import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, event, property } from "sap/fe/base/ClassSupport";
import type UI5Event from "sap/ui/base/Event";
import UI5Element from "sap/ui/core/Element";
import type { EventHandler } from "types/extension_types";

/**
 * Defines a property with a key and a value that can be used in conditional templates.
 * When the value is changed, a `valueChanged` event is fired.
 * @since 1.141.0
 * @public
 */
@defineUI5Class("sap.fe.macros.ConditionalSwitchProperty")
class ConditionalSwitchProperty extends UI5Element {
	/**
	 * The key of the property.
	 * @public
	 */
	@property({ type: "string" })
	key!: string;

	/**
	 * The value of the property.
	 * @public
	 */
	@property({ type: "any" })
	value!: unknown;

	/**
	 * Event fired when the value of the property is changed.
	 * This is used internally by the `ConditionalTemplate` control to react to changes in the property value.
	 * @public
	 */
	@event()
	valueChanged!: EventHandler<UI5Event<{}, ConditionalSwitchProperty>>;

	constructor(
		idOrSettings?: string | PropertiesOf<ConditionalSwitchProperty>,
		settings?: PropertiesOf<ConditionalSwitchProperty>,
		scope?: object
	) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		super(idOrSettings, settings, scope);
	}

	setValue(value: string): void {
		this.setProperty("value", value);
		this.fireEvent("valueChanged");
	}
}

interface ConditionalSwitchProperty {
	getKey(): string | undefined;
	setKey(key: string): this;
	getValue(): unknown | undefined;
	setValue(value: unknown): void;
}

export default ConditionalSwitchProperty;
