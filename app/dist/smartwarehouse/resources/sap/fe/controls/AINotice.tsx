import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import BuildingBlockBase from "sap/fe/base/BuildingBlockBase";
import { aggregation, defineUI5Class, type PropertiesOf, property } from "sap/fe/base/ClassSupport";
import type { Button$PressEvent } from "sap/m/Button";
import Button from "sap/m/Button";
import Label from "sap/m/Label";
import type { Link$PressEvent } from "sap/m/Link";
import Link from "sap/m/Link";
import type { PlacementType } from "sap/m/library";
import { ButtonType } from "sap/m/library";
import type Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import type { $ControlSettings } from "sap/ui/core/Control";
import Lib from "sap/ui/core/Lib";
import AiNoticeHelper from "./AiNoticeHelper";

/**
 * Building block that displays a AI notice.
 *
 * It's used to display information related to AI features. This information is rendered either
 * as a link if the aggregation popoverContent is defined or as a label if there is no aggregation popoverContent.
 */
@defineUI5Class("sap.fe.controls.AINotice")
export default class AINotice extends BuildingBlockBase<Control> {
	@property({ type: "boolean", isBindingInfo: true, defaultValue: true })
	visible?: boolean;

	/**
	 * The type of control to display
	 */
	@property({ type: "string", defaultValue: "Link" })
	type?: "Link" | "Button";

	/**
	 * The content to display into the popover
	 * @public
	 */
	@aggregation({ type: "sap.ui.core.Control", multiple: true, isDefault: true })
	popoverContent?: Control;

	/**
	 * The placement type of the popover
	 */
	@property({ type: "string" })
	placementType?: PlacementType;

	resourceBundle!: ResourceBundle;

	constructor(properties: PropertiesOf<AINotice>, others?: $ControlSettings) {
		super(properties, others);
		this.resourceBundle = Lib.getResourceBundleFor("sap.fe.controls") as ResourceBundle;
		this.content = this.createContent();
	}

	/**
	 * Handles the press event on the control.
	 * @param event The press event
	 */
	onPress(event: Button$PressEvent | Link$PressEvent): void {
		if (this.popoverContent) {
			AiNoticeHelper.generatePopover({
				content: this.popoverContent,
				placementType: this.placementType,
				parent: (event as Event<Control>).getSource() as unknown as Control
			});
		}
	}

	/**
	 * Returns the link or text depending on the popoverContent aggregation.
	 * @returns The control tree
	 */
	createLinkOrLabel(): Link | Label {
		const mainText = this.resourceBundle.getText("M_NOTICE_AI_TITLE");
		return this.getAggregation("popoverContent") ? (
			<Link visible={this.visible} text={mainText} press={(e: Link$PressEvent): void => this.onPress(e)} />
		) : (
			<Label visible={this.visible} text={mainText} />
		);
	}

	/**
	 * Returns the button.
	 * @returns The button
	 */
	createButton(): Button {
		return (
			<Button
				visible={this.visible}
				icon="sap-icon://ai"
				type={ButtonType.Transparent}
				text={this.resourceBundle.getText("M_NOTICE_AI_FILTER")}
				press={(e: Button$PressEvent): void => this.onPress(e)}
			/>
		);
	}

	/**
	 * Returns the content of this building block.
	 * @returns The control tree
	 */
	createContent(): Link | Button | Label {
		switch (this.type) {
			case "Button":
				return this.createButton();
			case "Link":
			default:
				return this.createLinkOrLabel();
		}
	}
}
