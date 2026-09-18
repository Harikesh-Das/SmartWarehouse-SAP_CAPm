import type { BindingToolkitExpression, PrimitiveType } from "sap/fe/base/BindingToolkit";
import * as BindingToolkit from "sap/fe/base/BindingToolkit";
import type { GenericState, PropertiesOf, StateOf } from "sap/fe/base/ClassSupport";
import { aggregation, association, defineState, defineUI5Class, STATE_MODEL_NAME } from "sap/fe/base/ClassSupport";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import Control from "sap/ui/core/Control";
import type UI5Element from "sap/ui/core/Element";
import InvisibleRenderer from "sap/ui/core/InvisibleRenderer";
import type RenderManager from "sap/ui/core/RenderManager";
import type { AccessibilityInfo } from "sap/ui/core/library";
import type Context from "sap/ui/model/Context";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface BuildingBlockBase<T extends UI5Element = Control, K extends object = {}> {
	// Force a state update
	_updateState(): Promise<void>;
}

/**
 * Base class for building blocks.
 * This contains the low-level functionality of having a content aggregation and handling the rendering of the content without an actual DOM element.<br/>
 * The building block also defines a state object that can be used to store the state of the building block.<br/>
 * Accessibility and classes information are forwarded to the content control.<br/>
 * This class is not meant to be used directly, it's there for internal use only (and documentation)
 * @public
 */
@defineUI5Class("sap.fe.base.BuildingBlockBase")
class BuildingBlockBase<T extends UI5Element = Control, K extends object = {}> extends Control {
	/**
	 * Optional content of generic type T.
	 *
	 * This property holds the main data or payload for the containing object.
	 * When undefined, it indicates that no content has been set or is available.
	 * The specific type and structure of the content depends on the generic type parameter T.
	 * @public
	 */
	@aggregation({ type: "sap.ui.core.Element", multiple: false, isDefault: true })
	content?: T;

	/**
	 * Association to controls / IDs that label this control (see WAI-ARIA attribute aria-labelledby).
	 * @public
	 */
	@association({ type: "sap.ui.core.Control", multiple: true, singularName: "ariaLabelledBy" })
	ariaLabelledBy!: string[];

	/**
	 * The current state value of the component.
	 *
	 * This property holds the state data managed by the component, with the type
	 * determined by the generic parameter K.
	 * @public
	 */
	@defineState()
	protected state!: StateOf<K>;

	getPlaceholder(_rm: RenderManager): void {}

	constructor(settings?: string | PropertiesOf<BuildingBlockBase<T>>, others?: PropertiesOf<BuildingBlockBase<T>>, scope?: object) {
		if (typeof settings === "string") {
			others ??= {};
			others.id = settings;
		}
		// Scope is defined and is there, but somehow doesn't appear on all the children of ManagedObject
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		super(settings as unknown as string, others, scope);
	}

	private _oldDomRef: WeakRef<Element> | null = null;

	static render<T extends Control>(oRm: RenderManager, oControl: BuildingBlockBase<T>): void {
		if (!oControl.content || oControl.getVisible() === false) {
			// If there is no content, we render an invisible renderer to avoid the control being
			InvisibleRenderer.render(oRm, oControl);
		} else {
			oControl.getPlaceholder?.(oRm);
			oRm.renderControl(oControl.content);
		}
	}

	setBindingContext(context: Context, model?: string): this {
		super.setBindingContext(context, model);
		if (model === undefined && context) {
			this.invalidate();
		}
		return this;
	}

	/**
	 * Override the bindProperty to deal with the case where the property is a binding info.
	 * @param name The name of te property
	 * @param bindingInfo The binding info
	 * @returns The instance of the building block for chaining
	 */
	override bindProperty(name: string, bindingInfo: PropertyBindingInfo): this {
		const propertyMetadata = this.getMetadata().getProperty(name);
		if (propertyMetadata?.bindable === false && propertyMetadata.group === "Data") {
			(this as Record<string, unknown>)[name] = bindingInfo;
		} else {
			super.bindProperty(name, bindingInfo);
		}
		return this;
	}

	//set the old dom ref
	override onAfterRendering(event: JQuery.Event): void {
		const domRef = this.getDomRef();
		if (domRef) {
			this._oldDomRef = new WeakRef(domRef);
		} else {
			this._oldDomRef = null;
		}
		super.onAfterRendering(event);
	}

	override getDomRef(suffix?: string): Element | null {
		const oContent = this.content;
		let domRef: Element | null = oContent?.getDomRef(suffix) ?? super.getDomRef(suffix);
		if (!domRef && !suffix) {
			domRef = this._oldDomRef?.deref() ?? null;
			if (domRef) {
				return document.getElementById(domRef.id);
			}
		}
		return domRef;
	}

	override getFocusDomRef(): Element | null {
		const oContent = this.content;
		return oContent ? oContent.getFocusDomRef() : super.getFocusDomRef();
	}

	/**
	 * This function asks up the control tree to enhance the accessibility state of the control.
	 * @param _oElement The element to enhance
	 * @param mAriaProps The current aria properties
	 * @returns The enhanced aria properties
	 */
	override enhanceAccessibilityState(_oElement: object, mAriaProps: object): object {
		const oParent = this.getParent();

		if (oParent && (oParent as ManagedObject & { enhanceAccessibilityState?: Function }).enhanceAccessibilityState) {
			// forward  enhanceAccessibilityState call to the parent
			(oParent as ManagedObject & { enhanceAccessibilityState: Function }).enhanceAccessibilityState(_oElement, mAriaProps);
		}

		return mAriaProps;
	}

	/**
	 * This function (if available on the concrete control) provides the current accessibility state of the control.
	 * @returns The accessibility information for the control.
	 */
	override getAccessibilityInfo(): AccessibilityInfo {
		let accessibilityInfo = {};
		if (this.content?.isA<Control>("sap.ui.core.Control") && this.content.getAccessibilityInfo) {
			accessibilityInfo = this.content.getAccessibilityInfo();
		}
		return accessibilityInfo;
	}

	/**
	 * Returns the DOMNode ID to be used for the "labelFor" attribute.
	 *
	 * We forward the call of this method to the content control.
	 * @returns ID to be used for the <code>labelFor</code>
	 */
	override getIdForLabel(): string {
		if (this.content?.isA<Control>("sap.ui.core.Control")) {
			return this.content.getIdForLabel();
		}
		return "";
	}

	override addStyleClass(styleClass: string): this {
		(this.content as unknown as Control)?.addStyleClass(styleClass);
		super.addStyleClass(styleClass);
		return this;
	}

	override removeStyleClass(styleClass: string): this {
		(this.content as unknown as Control)?.removeStyleClass(styleClass);
		super.removeStyleClass(styleClass);
		return this;
	}

	/**
	 * Shorthand for the BindingToolkit.bindState function with the current state object.
	 * @param path A property in the state object
	 * @returns The binding toolkit expression for the state
	 * @public
	 * @ui5-experimental-since 1.145.0
	 */
	public bindState<ST extends PrimitiveType>(path: keyof K): BindingToolkitExpression<ST> {
		return BindingToolkit.bindState(this.state as K, path);
	}

	/**
	 * Synchronizes a state property with another building block's state property.
	 * @param propName Name of the property in the current state object
	 * @param source The source building block
	 * @param property The property in the source building block's state object
	 */
	public syncStateProperty(propName: string, source: BuildingBlockBase, property: string): void {
		(this.state as GenericState)[propName] = (source.state as GenericState)[property];
		const propBinding = source.getModel(STATE_MODEL_NAME)?.bindProperty("/" + property);
		propBinding?.attachChange((): void => {
			(this.state as GenericState)[propName] = (source.state as GenericState)[property];
		});
	}

	/**
	 * Framework hook for state change handling.
	 * Subclasses can override this method to react to state changes.
	 * @param _changedProps List of changed property names
	 * @public
	 * @ui5-experimental-since 1.145.0
	 */
	protected onStateChange(_changedProps: string[]): void;

	protected async onStateChange(_changedProps: string[]): Promise<void> {}
}

export default BuildingBlockBase;
