import BuildingBlockBase from "sap/fe/base/BuildingBlockBase";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { aggregation, defineUI5Class, implementInterface, property } from "sap/fe/base/ClassSupport";
import type ConditionalSwitchProperty from "sap/fe/macros/ConditionalSwitchProperty";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import type { IFormContent } from "sap/ui/core/library";

/**
 * Defines a conditional template that renders content based on the evaluation of a set of switchProperties.
 * The switchProperties are defined using the {@link sap.fe.macros.ConditionalSwitchProperty} building block.
 * @public
 * @since 1.141.0
 */
@defineUI5Class("sap.fe.macros.ConditionalSwitch")
export default class ConditionalSwitch extends BuildingBlockBase implements IFormContent {
	@implementInterface("sap.ui.core.IFormContent")
	__implements__sap_ui_core_IFormContent = true;

	@aggregation({ type: "sap.ui.core.IFormContent", isDefault: false })
	content?: Control;

	@aggregation({ type: "sap.fe.macros.ConditionalSwitchProperty", isDefault: true, multiple: true, singularName: "switchProperty" })
	switchProperties!: ConditionalSwitchProperty[];

	/**
	 * A function that returns the content to be rendered based on the evaluation of the switchProperties.
	 * The function receives an object with the switchProperties as key-value pairs, the binding context, and the displayed control.
	 * The function should return a single UI5 control.
	 * @public
	 */
	@property({ type: "function" })
	factory?: Function;

	private _createDebounceTimer?: number;

	private fnBoundDebounced?: Function;

	constructor(idOrSettings?: string | PropertiesOf<ConditionalSwitch>, settings?: PropertiesOf<ConditionalSwitch>, scope?: object) {
		super(idOrSettings, settings, scope);
	}

	/**
	 * Time in milliseconds to debounce content creation calls.
	 * We use a debounce function to avoid multiple calls in quick succession when multiple switchProperties are changed at once.
	 * @private
	 */
	private readonly DEBOUNCE_TIME = 200;

	/**
	 * Debounced content creation to avoid multiple calls in quick succession.
	 * This is useful when multiple switchProperties are changed at once.
	 */
	_createContentDebounced(): void {
		if (this._createDebounceTimer !== undefined) {
			clearTimeout(this._createDebounceTimer);
		}
		this._createDebounceTimer = window.setTimeout(() => {
			this._createContent();
		}, this.DEBOUNCE_TIME);
	}

	/**
	 * Creates the content based on the current switchProperties and the factory function.
	 * If no factory function is provided, the content will be empty.
	 */
	private _createContent(): void {
		if (this.factory) {
			const switchProperties: object = this.switchProperties.reduce(
				(reducer: Record<string, unknown>, prop: ConditionalSwitchProperty): Record<string, unknown> => {
					reducer[prop.key] = prop.value;
					return reducer;
				},
				{} as Record<string, unknown>
			);

			const oldContent = this.content;
			const newContent = this.factory.call(this, switchProperties, this.getBindingContext(), this.content);
			if (newContent !== oldContent) {
				oldContent?.destroy();
				this.content = newContent;
			}
			if (this.ariaLabelledBy !== undefined) {
				this.content?.addAssociation("ariaLabelledBy", this.ariaLabelledBy.join(","));
			}
		}
	}

	/**
	 * Overrides the addAssociation method to propagate ariaLabelledBy associations to the content.
	 * @param sAssociationName The name of the association
	 * @param sId The ID of the associated control or the control instance
	 * @param bSuppressInvalidate Whether to suppress invalidation
	 * @returns The current instance for method chaining
	 */
	override addAssociation(sAssociationName: string, sId: string | ManagedObject, bSuppressInvalidate?: boolean): this {
		super.addAssociation(sAssociationName, sId, bSuppressInvalidate);
		if (sAssociationName === "ariaLabelledBy" && this.content) {
			this.content.addAssociation("ariaLabelledBy", sId);
		}
		return this;
	}

	/**
	 * Adds a ConditionalSwitchProperty to the 'switchProperties' aggregation and attaches a change listener to it.
	 * The change listener will trigger a content re-creation when the property value changes.
	 * @param conditionalSwitchProperty
	 * @returns The current instance for method chaining.
	 */
	addSwitchProperty(conditionalSwitchProperty: ConditionalSwitchProperty): this {
		super.addAggregation("switchProperties", conditionalSwitchProperty);
		if (!this.fnBoundDebounced) {
			// Bind the debounced content creation method to the instance
			this.fnBoundDebounced = this._createContentDebounced.bind(this);
		}
		conditionalSwitchProperty.attachEvent("valueChanged", this.fnBoundDebounced);
		this._createContentDebounced();
		return this;
	}

	/**
	 * Removes a ConditionalSwitchProperty from the 'switchProperties' aggregation and detaches its change listener.
	 * @param vIndex The index, ID, or instance of the ConditionalSwitchProperty to remove.
	 * @returns The removed ConditionalSwitchProperty instance or null if not found.
	 */
	removeSwitchProperty(vIndex: number | string | ConditionalSwitchProperty): ConditionalSwitchProperty | null {
		const conditionalSwitchProperty = super.removeAggregation("switchProperties", vIndex) as ConditionalSwitchProperty | null;
		if (conditionalSwitchProperty !== null && this.fnBoundDebounced) {
			conditionalSwitchProperty.detachEvent("valueChanged", this.fnBoundDebounced);
		}
		this._createContentDebounced();
		return conditionalSwitchProperty;
	}

	// #region IFormContent

	getFormDoNotAdjustWidth(): boolean {
		return (this.content as unknown as IFormContent)?.getFormDoNotAdjustWidth?.() ?? false;
	}
}
