import { defineUI5Class, event, mixin, property } from "sap/fe/base/ClassSupport";
import type { FEView } from "sap/fe/core/BaseController";
import FPMHelper from "sap/fe/core/helpers/FPMHelper";
import SubSectionStateHandler from "sap/fe/macros/controls/section/mixin/SubSectionStateHandler";
import type SubSectionBlock from "sap/fe/templates/ObjectPage/controls/SubSectionBlock";
import type UI5Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import type Binding from "sap/ui/model/Binding";
import type CompositeBinding from "sap/ui/model/CompositeBinding";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataPropertyBinding from "sap/ui/model/odata/v4/ODataPropertyBinding";
import type PropertyBinding from "sap/ui/model/PropertyBinding";
import ObjectPageSubSection from "sap/uxap/ObjectPageSubSection";
import type { EventHandler } from "types/extension_types";
import type Section from "../Section";

@defineUI5Class("sap.fe.macros.controls.section.SubSection", { designtime: "sap/uxap/designtime/ObjectPageSubSection.designtime" })
@mixin(SubSectionStateHandler)
class SubSection extends ObjectPageSubSection {
	/**
	 * Path to the apply-state handler to be called during state interactions.
	 */
	@property({ type: "string" })
	applyStateHandler?: string;

	/**
	 * Path to the retrieve-state handler to be called during state interactions.
	 */
	@property({ type: "string" })
	retrieveStateHandler?: string;

	/**
	 * Fired when the visibility changes (due to change of value or context).
	 */
	@event()
	visibilityChanged?: EventHandler<UI5Event<{ value: unknown; oldValue: unknown; isInitial: boolean; context: Context }, SubSection>>;

	private previousVisibilityValue?: boolean;

	private observer?: IntersectionObserver;

	private observedDOM: Element | null = null;

	/**
	 * Hook function that is called when the subsection is first set to visible
	 * @ui5-experimental-since 1.143.0
	 */
	@property({ type: "string" })
	subSectionCreated?: string;

	private initialCall = true;

	private eventDelegatesToCreateObserver?: { onAfterRendering: () => void };

	constructor(sId?: string, mSettings?: object) {
		super(sId, mSettings);

		// Register delegate for lifecycle management
		const eventDelegates = {
			onBeforeRendering: (): void => {
				this.checkAndApplyFormAlignmentClass();
			}
		};

		this.addEventDelegate(eventDelegates);
	}

	init(): void {
		super.init();
		this.attachModelContextChange(this.waiForVisibilityResolved.bind(this));
	}

	/**
	 * Waits for the visibility binding to be resolved and fires the "visibilityChanged" event.
	 */
	async waiForVisibilityResolved(): Promise<void> {
		const visibilitybinding = this.getBinding("visible");
		if (visibilitybinding) {
			const allBindings: ODataPropertyBinding[] = visibilitybinding.isA<CompositeBinding>("sap.ui.model.CompositeBinding")
				? visibilitybinding.getBindings()
				: [visibilitybinding];

			await Promise.all(
				allBindings
					.filter((binding) => binding.getModel() === this.getModel()) // consider only bindings from the current model. Internal model bindings should not impact the resolution
					.map(async (binding) => binding.requestValue())
			);

			const visibilityValue = this.getCurrentBindingValue(visibilitybinding) as boolean;

			this.fireEvent("visibilityChanged", {
				value: visibilityValue,
				oldValue: this.previousVisibilityValue,
				context: this.getBindingContext()
			});
			this.previousVisibilityValue = visibilityValue;
		}
	}

	onAfterRendering(oEvent: jQuery.Event): void | undefined {
		super.onAfterRendering(oEvent);
		// If the targeted DOM element has changed, re-observe it
		if (this.observer && this.observedDOM && this.observedDOM !== this.getDomRef()) {
			this.observeCurrentSection();
		}
	}
	/**
	 * Gets the current value of the given binding.
	 * @param binding The binding to get the value from
	 * @returns The current value of the binding
	 */
	private getCurrentBindingValue(binding: Binding): unknown {
		if (binding) {
			return binding.isA<CompositeBinding>("sap.ui.model.CompositeBinding") ? binding.getExternalValue() : binding.getValue();
		}
		return null;
	}

	/**
	 * Sets the visibility of the subsection.
	 * This function is an override to capture visibility changes and fire the "visibilityChanged" event when the binding is resolved.
	 * @param bVisible The new visibility value
	 * @returns The current instance for chaining
	 */
	setVisible(bVisible?: boolean): this {
		super.setVisible(bVisible);
		if (this.isBindingResolvedOnCurrentModel("visible")) {
			this.fireEvent("visibilityChanged", {
				value: bVisible,
				oldValue: this.previousVisibilityValue,
				context: this.getBindingContext()
			});
			this.previousVisibilityValue = bVisible;
		}
		return this;
	}

	/**
	 * Recursively retrieves all property paths from the given object.
	 * @param obj The object to extract property paths from
	 * @param prefix  The prefix to prepend to each property path (used for recursion)
	 * @returns Array of property paths
	 */
	getAllProperties(obj: Record<string, unknown>, prefix = ""): string[] {
		let properties: string[] = [];
		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				const fullKey = prefix ? `${prefix}/${key}` : key;
				properties.push(fullKey);

				if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
					properties = properties.concat(this.getAllProperties(obj[key] as Record<string, unknown>, fullKey));
				}
			}
		}
		return properties;
	}

	/**
	 * Checks if the binding for the given path is resolved on the current model.
	 * @param path The binding path to check
	 * @returns True if the binding is resolved on the current model, false otherwise
	 */
	isBindingResolvedOnCurrentModel(path: string): boolean {
		const binding = this.getBinding(path) as CompositeBinding | PropertyBinding | undefined;
		const currentContextData = this.getBindingContext()?.getObject();
		const currentDataAvailableProperties = this.getAllProperties(currentContextData || {});
		if (binding?.isA<CompositeBinding>("sap.ui.model.CompositeBinding")) {
			return binding
				.getBindings()
				.filter((partBinding) => partBinding.getModel() === this.getModel()) // consider only bindings from the current model. Internal model bindings should not impact the resolution
				.every(
					(partBinding: PropertyBinding) =>
						currentDataAvailableProperties.includes(partBinding.getPath()) ||
						(currentDataAvailableProperties.includes(partBinding.getPath().split("/")[0]) &&
							!currentContextData[partBinding.getPath().split("/")[0]]) // nested properties returning undefined is also considered as resolved
				); // in case of navigation path we check only the first segment of the path
		} else {
			if (binding?.getModel() !== this.getModel()) {
				return true;
			}
			return binding?.getPath()
				? currentDataAvailableProperties.includes(binding.getPath()!) ||
						(currentDataAvailableProperties.includes(binding.getPath()!.split("/")[0]) &&
							!currentContextData[binding.getPath()!.split("/")[0]]) // nested properties returning undefined is also considered as resolved
				: false;
		}
	}

	/**
	 * Creates an IntersectionObserver for the ObjectPage scroll area to monitor subsection visibility.
	 */
	createIntersectionObserverOnScrollArea(): void {
		if (!this.observer?.root?.isConnected) {
			this.observer = new IntersectionObserver(
				(entries: IntersectionObserverEntry[]): void => {
					entries.forEach((entry) => {
						if (entry.intersectionRatio > 0 && this.getDomRef()) {
							this.fireEvent("subSectionEnteredViewPort", { subSection: this });
						}
					});
				},
				{
					root: null, // viewport of the scroll area; null means the browser viewport
					rootMargin: "0% 0% 0% 0%", // adjust as needed to trigger earlier/later (eg: "0% 0% 50% 0%" to increase the bottom margin of 50%)
					threshold: 0
				}
			);
		}
	}

	/**
	 * Observes the DOM element of the current subsection for visibility changes.
	 */
	observeCurrentSection(): void {
		if (this.observedDOM) {
			this.observer?.unobserve(this.observedDOM);
		}
		this.observedDOM = this.getDomRef();
		if (this.observedDOM) {
			this.createIntersectionObserverOnScrollArea();
			this.observer?.observe(this.observedDOM);
		} else {
			// Register delegate for lifecycle management
			this.eventDelegatesToCreateObserver = {
				onAfterRendering: (): void => {
					this.observedDOM = this.getDomRef();
					if (this.observedDOM) {
						this.createIntersectionObserverOnScrollArea();
						this.observer?.observe(this.observedDOM);
						this.removeEventDelegate(this.eventDelegatesToCreateObserver!);
						this.eventDelegatesToCreateObserver = undefined;
					}
				}
			};
			this.addEventDelegate(this.eventDelegatesToCreateObserver);
		}
	}

	disconnectVisibilityObserver(): void {
		this.observer?.disconnect();
		this.observedDOM = null;
		if (this.eventDelegatesToCreateObserver) {
			this.removeEventDelegate(this.eventDelegatesToCreateObserver);
			this.eventDelegatesToCreateObserver = undefined;
		}
	}

	/**
	 * Gets visible content from all blocks in this subsection.
	 * @returns Array of visible controls
	 */
	private getVisibleContent(): Control[] {
		const blocks = this.getBlocks() as SubSectionBlock[];
		const visibleContent: Control[] = [];

		blocks.forEach((block: SubSectionBlock) => {
			let content = block.getAggregation("content");
			if (content === null) {
				return;
			}
			if (!Array.isArray(content)) {
				content = [content];
			}
			for (const control of content as Control[]) {
				if (control.getVisible()) {
					visibleContent.push(control);
				}
			}
		});

		return visibleContent;
	}

	/**
	 * Checks if control is eligible for alignment CSS class.
	 * @param control Control to check
	 * @returns True if control is Form, Panel, Table, or List
	 */
	private isEligibleForAlignment(control: Control): boolean {
		return control.isA(["sap.ui.layout.form.Form", "sap.fe.macros.form.FormAPI", "sap.m.Panel", "sap.m.Table", "sap.m.List"]);
	}

	/**
	 * Checks subsection content and applies/removes alignment CSS class on Form elements.
	 */
	private checkAndApplyFormAlignmentClass(): void {
		const visibleContent = this.getVisibleContent();

		// Only apply if exactly one visible control of eligible type
		if (visibleContent.length === 1 && this.isEligibleForAlignment(visibleContent[0])) {
			visibleContent[0].addStyleClass("sapUxAPObjectPageSubSectionAlignContent");
		} else {
			for (const control of visibleContent) {
				control.removeStyleClass("sapUxAPObjectPageSubSectionAlignContent");
			}
		}
	}

	public handleSubSectionCreated(view: FEView): void {
		if (this.subSectionCreated && this.initialCall) {
			this.initialCall = false;
			const loadSplit = this.subSectionCreated.split(".");
			const methodName = loadSplit?.pop();
			const moduleName = loadSplit?.join("/");
			FPMHelper.loadModuleAndCallMethod(moduleName, methodName ?? "", view, this);
		}
	}

	/**
	 * Sets the title of the subsection and adjusts the section content accordingly.
	 * @param sTitle The title to set for the subsection
	 * @returns The current instance of SubSection
	 */
	setTitle(sTitle?: string): this {
		super.setTitle(sTitle);

		// We need to run the title adjustment logic at section level after the title is set.
		const feSection = this.getParent();
		if (feSection && feSection.isA<Section>("sap.fe.macros.controls.Section") && feSection.checkAndAdjustSectionContent) {
			feSection.checkAndAdjustSectionContent();
		}

		return this;
	}

	destroy(): void {
		if (this.observedDOM) {
			this.observer?.unobserve(this.observedDOM);
			this.observer?.disconnect();
			this.observer = undefined;
			this.observedDOM = null;
		}
		super.destroy();
	}
}

export default SubSection;
