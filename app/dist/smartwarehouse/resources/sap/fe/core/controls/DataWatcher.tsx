import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, event, property } from "sap/fe/base/ClassSupport";
import type UI5Event from "sap/ui/base/Event";
import UI5Element from "sap/ui/core/Element";
import type CompositeBinding from "sap/ui/model/CompositeBinding";
import type Context from "sap/ui/model/Context";
import type PropertyBinding from "sap/ui/model/PropertyBinding";
import type { EventHandler } from "types/extension_types";

/**
 * A callback function that is called when the value of the watched property changes.
 * @param value The new value of the watched property
 * @param oldValue The old value of the watched property
 * @param isInitial Whether the value change is the initial value
 * @param context The binding context of the watched property
 * @typedef
 * @public
 */
export type WatcherCallback = (value: unknown, oldValue: unknown, isInitial: boolean, context: Context) => void;
type InternalV4Bindings = PropertyBinding & {
	bInitial: boolean;
};
/**
 * The DataWatcher is an element you can use to watch a property binding and get notified when the value changes.
 *
 */
@defineUI5Class("sap.fe.core.controls.DataWatcher")
export default class DataWatcher extends UI5Element {
	@property({ type: "any" })
	propertyBinding?: unknown;

	@event()
	valueChanged?: EventHandler<
		UI5Event<{ value: unknown; oldValue: unknown; isInitial: boolean; context: Context; isBindingInitial: boolean }, DataWatcher>
	>;

	private _initialValue?: unknown;

	private isInitial: boolean;

	private _previousContextPath?: string;

	private isSingleton?: boolean;

	constructor(idOrProps?: string | PropertiesOf<DataWatcher>, props?: PropertiesOf<DataWatcher>, scope?: unknown) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		super(idOrProps as string | undefined, props, scope); // need to pass scope here
		this.isInitial = true;
		this.isSingleton = ((typeof idOrProps !== "string" ? idOrProps : props)?.propertyBinding as string).startsWith("{/");
	}

	setPropertyBinding(propertyBinding: string): void {
		const oldValue = this.getProperty("propertyBinding");
		// for singleton it doesn't matter if the context of the view changes
		if (this.isInitial || (!this.isSingleton && this._previousContextPath !== this.getBindingContext()?.getPath())) {
			this.isInitial = false;
			this._initialValue = propertyBinding;
			this._previousContextPath = this.getBindingContext()?.getPath();
		}
		const bindingInfo = this.getBindingInfo("propertyBinding");
		const binding = bindingInfo?.binding as CompositeBinding | PropertyBinding;
		this.isInitial = false;
		if (binding?.isA<CompositeBinding>("sap.ui.model.CompositeBinding")) {
			binding.getBindings().forEach((b: PropertyBinding) => {
				if ((b as InternalV4Bindings).bInitial) {
					this.isInitial = true;
				}
			});
		} else if ((binding as InternalV4Bindings)?.bInitial) {
			this.isInitial = true;
		}
		super.setProperty("propertyBinding", propertyBinding, true);
		this.fireEvent("valueChanged", {
			value: propertyBinding,
			oldValue: oldValue,
			isInitial: propertyBinding === this._initialValue,
			isBindingInitial: this.isInitial,
			context: this.getBindingContext()
		});
	}
}
