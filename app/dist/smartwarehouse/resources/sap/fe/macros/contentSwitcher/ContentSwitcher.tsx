import { bindState } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { aggregation, defineReference, defineUI5Class, event, implementInterface, property } from "sap/fe/base/ClassSupport";
import type { Ref } from "sap/fe/base/jsx-runtime/jsx";
import { triggerPXIntegration } from "sap/fe/controls/easyFilter/PXFeedback";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import type IViewStateContributor from "sap/fe/core/controllerextensions/viewState/IViewStateContributor";
import type ContentSwitcherItem from "sap/fe/macros/contentSwitcher/ContentSwitcherItem";
import type { SegmentedButton$SelectionChangeEvent } from "sap/m/SegmentedButton";
import SegmentedButton from "sap/m/SegmentedButton";
import SegmentedButtonItem from "sap/m/SegmentedButtonItem";
import type Control from "sap/ui/core/Control";
import UI5Element from "sap/ui/core/Element";
import type { EventHandler } from "../../../../../../../types/extension_types";
import type IContentSwitcherHost from "./IContentSwitcherHost";

type ContentSwitcherState = {
	selectedKey?: string;
};
/**
 * Defines a new building block which can be used to toggle the visibility of the content referenced by the item.
 * Each item will be displayed in a segmented button with the
 */
@defineUI5Class("sap.fe.macros.contentSwitcher.ContentSwitcher")
export default class ContentSwitcher
	extends BuildingBlock<
		SegmentedButton,
		{
			selectedKey: string;
		}
	>
	implements IViewStateContributor<ContentSwitcherState>
{
	@implementInterface("sap.fe.core.controllerextensions.viewState.IViewStateContributor")
	__implements__sap_fe_core_controllerextensions_viewState_IViewStateContributor = true;

	@aggregation({ type: "sap.fe.macros.contentSwitcher.ContentSwitcherItem", multiple: true, isDefault: true })
	items!: ContentSwitcherItem[];

	@event()
	selectionChange?: EventHandler;

	@defineReference()
	$segmentedButton!: Ref<SegmentedButton>;

	@property({ type: "string", bindToState: true })
	selectedKey?: string;

	private currentKey: string | undefined = "";

	constructor(propertiesOrId: string | PropertiesOf<ContentSwitcher>, properties?: PropertiesOf<ContentSwitcher>) {
		super(propertiesOrId, properties);
		this.content = this.createContent();
		this.currentKey = this.retrieveState().selectedKey;
		if (this.state.selectedKey) {
			// if there is already a selected key let's make sure to apply it
			this.onStateChange(["selectedKey"]);
		} else {
			// otherwise let's set an initial state
			this.state.selectedKey = "key0";
		}
	}

	retrieveState(): ContentSwitcherState {
		return {
			selectedKey: this.$segmentedButton.current?.getSelectedKey()
		};
	}

	async applyState(appState?: ContentSwitcherState): Promise<void> {
		if (appState) {
			await this.handlePersonalizationUpdate(appState.selectedKey!, this.state.selectedKey, this.$segmentedButton.current!);
			this.state.selectedKey = appState.selectedKey ?? this.items[0]?.key ?? "key0";
		}
	}

	/**
	 * Retrieves the control referenced by the ContentSwitcherItem.
	 * @param item The ContentSwitcherItem
	 * @returns The control referenced by the ContentSwitcherItem
	 */
	_getControlFromItem(item: ContentSwitcherItem): Control | undefined {
		const controlToSwitch = item.controlToSwitch;
		if (controlToSwitch) {
			const control = UI5Element.getElementById(controlToSwitch);
			if (control?.isA<Control>("sap.ui.core.Control")) {
				return control;
			}
		}
	}

	private showHideControls(selectedKey: string): void {
		let controlsToHide: Control[] = [];
		let controlsToDisplay: Control[] = [];
		let showAllSelected = false;

		for (const item of this.items) {
			const control = this._getControlFromItem(item);
			if (item.key === selectedKey) {
				showAllSelected = item.showAll;
				if (control) {
					controlsToDisplay.push(control);
				}
			} else if (control) {
				controlsToHide.push(control);
			}
		}

		if (showAllSelected) {
			controlsToDisplay = controlsToHide;
			controlsToHide = [];
		}

		for (const control of controlsToHide) {
			if (!controlsToDisplay.includes(control)) {
				control.setVisible(false);
			}
		}

		let hostFound = false;
		for (const control of controlsToDisplay) {
			control.setVisible(true);
			if (!hostFound && control.isA<IContentSwitcherHost>("sap.fe.macros.contentSwitcher.IContentSwitcherHost")) {
				control.setAsHost(this);
				hostFound = true;
			}
		}
	}

	onStateChange(changedKeys: string[]): void {
		if (changedKeys?.includes("selectedKey")) {
			this.showHideControls(this.state.selectedKey);
			this.getPageController()?.getExtensionAPI().updateAppState();
			if (this.currentKey === "ai" && this.state.selectedKey === "compact") {
				triggerPXIntegration("toggleSwitch");
			}
			this.currentKey = this.state.selectedKey;
			this.fireEvent("selectionChange");
		}
	}

	private async handlePersonalizationUpdate(
		selectedKey: string,
		previousSelectedKey: string,
		segmentedButton: SegmentedButton
	): Promise<void> {
		if (selectedKey !== previousSelectedKey && typeof previousSelectedKey === "string") {
			const ControlPersonalizationWriteAPI = (await import("sap/ui/fl/write/api/ControlPersonalizationWriteAPI")).default;
			ControlPersonalizationWriteAPI.add({
				changes: [
					{
						changeSpecificData: {
							changeType: "selectSegmentedButtonItem",
							content: {
								selectedItem: this.createId(selectedKey),
								previousItem: this.createId(previousSelectedKey),
								previousKey: previousSelectedKey,
								bUpdateSelectedKey: true
							}
						},
						selectorElement: segmentedButton
					}
				]
			});
		}
	}

	onSegmentedButtonSelectionChange(selectionChangeEvent: SegmentedButton$SelectionChangeEvent): void {
		const selectedKey = selectionChangeEvent.getParameter("item")?.getKey();
		if (selectedKey) {
			this.handlePersonalizationUpdate(selectedKey, this.currentKey!, this.$segmentedButton.current!);
		}
	}

	/**
	 * Creates the content of the building block.
	 * @returns The SegmentedButton
	 */
	createContent(): SegmentedButton {
		return (
			<SegmentedButton
				id={this.createId("filterTypeSwitch")}
				ref={this.$segmentedButton}
				selectedKey={bindState(this.state, "selectedKey")}
				selectionChange={this.onSegmentedButtonSelectionChange.bind(this)}
			>
				{{ items: this.items.map((item, index) => this.createSegmentedButtonItem(item, index)) }}
			</SegmentedButton>
		);
	}

	/**
	 * Creates the SegmentedButtonItem for the SegmentedButton and associate a key to it.
	 * @param item The ContentSwitcherItem
	 * @param itemIdx The index of the item
	 * @returns The SegmentedButtonItem
	 */
	createSegmentedButtonItem(item: ContentSwitcherItem, itemIdx: number): SegmentedButtonItem {
		const segmentButtonItemId = this.createId(item.key);
		item.key ??= `key${itemIdx}`;
		if (item.icon) {
			return <SegmentedButtonItem icon={item.icon} tooltip={item.text} key={item.key} id={segmentButtonItemId} />;
		}
		return <SegmentedButtonItem text={item.text} key={item.key} id={segmentButtonItemId} />;
	}
}
