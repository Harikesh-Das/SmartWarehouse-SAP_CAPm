import type { EnhanceWithUI5, IInterfaceWithMixin } from "sap/fe/base/ClassSupport";
import type FormElementWrapper from "sap/fe/core/controls/FormElementWrapper";
import type MacroAPI from "sap/fe/macros/MacroAPI";
import type Contact from "sap/fe/macros/contact/Contact";
import type Email from "sap/fe/macros/contact/Email";
import type ConditionalWrapperType from "sap/fe/macros/controls/ConditionalWrapper";
import type FieldWrapper from "sap/fe/macros/controls/FieldWrapper";
import type FileWrapper from "sap/fe/macros/controls/FileWrapper";
import type TextLink from "sap/fe/macros/controls/TextLink";
import type DataPoint from "sap/fe/macros/internal/DataPoint";
import type Button from "sap/m/Button";
import type CheckBox from "sap/m/CheckBox";
import type ExpandableText from "sap/m/ExpandableText";
import type HBox from "sap/m/HBox";
import type InputBase from "sap/m/InputBase";
import type Label from "sap/m/Label";
import type Link from "sap/m/Link";
import type ObjectIdentifier from "sap/m/ObjectIdentifier";
import type ObjectStatus from "sap/m/ObjectStatus";
import type RatingIndicator from "sap/m/RatingIndicator";
import type Text from "sap/m/Text";
import type VBox from "sap/m/VBox";
import type Control from "sap/ui/core/Control";
import Messaging from "sap/ui/core/Messaging";
import Message from "sap/ui/core/message/Message";
import type MessageType from "sap/ui/core/message/MessageType";
import type { default as mdcField } from "sap/ui/mdc/Field";
import FieldEditMode from "sap/ui/mdc/enums/FieldEditMode";

/**
 * Type definitions for control operations registry
 * @private
 */
type ValueGetter = (control: Control) => boolean | string | number | undefined;
type ValueSetter = (control: Control, value: boolean | string | number) => void;
type EnabledGetter = (control: Control) => boolean;
type EnabledSetter = (control: Control, enabled: boolean) => Control;
type BindingPathGetter = (control: Control) => string | undefined;

/**
 * Control operations registry for centralizing control type handling
 * @private
 */
interface ControlOperations {
	getValue?: ValueGetter;
	setValue?: ValueSetter;
	getBindingPath?: BindingPathGetter;
	getEnabled?: EnabledGetter;
	setEnabled?: EnabledSetter;
}

/**
 * Centralized registry of control type operations to eliminate code duplication.
 * This registry maps control types to their specific operations for value access,
 * enabled state management, and binding path resolution.
 * @private
 */
const CONTROL_TYPE_REGISTRY: Array<{ check: (c: Control) => boolean; operations: ControlOperations }> = [
	{
		check: (c) => c.isA("sap.m.CheckBox"),
		operations: {
			getValue: (c) => (c as CheckBox).getSelected(),
			setValue: (c, v) => (c as CheckBox).setSelected(v as boolean),
			getBindingPath: (c) => (c as CheckBox).getBinding("selected")?.getResolvedPath(),
			getEnabled: (c) => (c as CheckBox).getProperty("enabled"),
			setEnabled: (c, e) => (c as CheckBox).setProperty("enabled", e)
		}
	},
	{
		check: (c) => c.isA("sap.m.InputBase"),
		operations: {
			getValue: (c) => (c as InputBase).getValue(),
			setValue: (c, v) => (c as InputBase).setValue(v as string),
			getBindingPath: (c) => (c as InputBase).getBinding("value")?.getResolvedPath(),
			getEnabled: (c) => (c as InputBase).getProperty("enabled"),
			setEnabled: (c, e) => (c as InputBase).setProperty("enabled", e)
		}
	},
	{
		check: (c) => c.isA<mdcField>("sap.ui.mdc.Field"),
		operations: {
			getValue: (c) => (c as mdcField).getValue(),
			setValue: (c, v) => (c as mdcField).setValue(v),
			getBindingPath: (c) => (c as mdcField).getBinding("value")?.getResolvedPath(),
			getEnabled: (c): boolean => {
				const editMode = (c as mdcField).getEditMode();
				return editMode !== FieldEditMode.Disabled;
			},
			setEnabled: (c, e): Control => {
				(c as mdcField).setEditMode(e ? FieldEditMode.Editable : FieldEditMode.Disabled);
				return c;
			}
		}
	},
	{
		check: (c) => c.isA("sap.m.RatingIndicator"),
		operations: {
			getValue: (c) => (c as RatingIndicator).getValue()
		}
	},
	{
		check: (c) => c.isA("sap.m.Link"),
		operations: {
			getValue: (c) => (c as Link).getText(),
			getEnabled: (c) => (c as Link).getProperty("enabled"),
			setEnabled: (c, e) => (c as Link).setProperty("enabled", e)
		}
	},
	{
		check: (c) => c.isA("sap.m.Label"),
		operations: {
			getValue: (c) => (c as Label).getText()
		}
	},
	{
		check: (c) => c.isA("sap.m.Text"),
		operations: {
			getValue: (c) => (c as Text).getText(false),
			setValue: (c, v) => (c as Text).setText(v as string),
			getEnabled: () => true
		}
	},
	{
		check: (c) => c.isA<EnhanceWithUI5<TextLink>>("sap.fe.macros.controls.TextLink"),
		operations: {
			getValue: (c) => (c as EnhanceWithUI5<TextLink>).getText(),
			getEnabled: () => true
		}
	},
	{
		check: (c) => c.isA("sap.m.ObjectStatus"),
		operations: {
			getValue: (c) => (c as ObjectStatus).getText(),
			getEnabled: () => true,
			setEnabled: (c, e) => (c as ObjectStatus).setProperty("active", e)
		}
	},
	{
		check: (c) => c.isA("sap.m.ObjectIdentifier"),
		operations: {
			getValue: (c) => (c as ObjectIdentifier).getTitle(),
			getEnabled: () => true,
			setEnabled: (c, e) => (c as ObjectIdentifier).setProperty("titleActive", e)
		}
	},
	{
		check: (c) => c.isA("sap.m.Button"),
		operations: {
			getEnabled: (c) => (c as Button).getProperty("enabled"),
			setEnabled: (c, e) => (c as Button).setProperty("enabled", e)
		}
	},
	{
		check: (c) => c.isA<DataPoint>("sap.fe.macros.internal.DataPoint"),
		operations: {
			getValue: (c) => (c as DataPoint).getValue(),
			getEnabled: (c) => (c as DataPoint).getEnabled(),
			setEnabled: (c, e): Control => {
				(c as DataPoint).setEnabled(e);
				return c;
			}
		}
	},
	{
		check: (c) => c.isA<Email>("sap.fe.macros.contact.Email"),
		operations: {
			getValue: (c) => (c as Email).getValue(),
			getEnabled: (c) => (c as Email).getProperty("linkEnabled"),
			setEnabled: (c, e): Control => {
				(c as Email).setLinkEnabled(e);
				return c;
			}
		}
	},
	{
		check: (c) => c.isA<Contact>("sap.fe.macros.contact.Contact"),
		operations: {
			getValue: (c) => (c as Contact).getValue(),
			getEnabled: (c) => (c as Contact).getEnabled()
		}
	},
	{
		check: (c) => c.isA<FormElementWrapper>("sap.fe.core.controls.FormElementWrapper"),
		operations: {
			getEnabled: () => true
		}
	},
	{
		check: (c) => c.isA<ExpandableText>("sap.m.ExpandableText"),
		operations: {
			getEnabled: () => true
		}
	}
];

/**
 * Finds the control operations for a given control from the registry.
 * @param control The control to find operations for
 * @returns The control operations or undefined if not found
 * @private
 */
function getControlOperations(control: Control): ControlOperations | undefined {
	const entry = CONTROL_TYPE_REGISTRY.find((e) => e.check(control));
	return entry?.operations;
}

/**
 * Gets the control type name for error messages.
 * @param control The control to get the type name for
 * @returns The control type name or "unknown"
 * @private
 */
function getControlTypeName(control: Control | undefined): string {
	if (!control) {
		return "undefined";
	}
	try {
		return control.getMetadata?.()?.getName?.() ?? "unknown";
	} catch (e) {
		return "unknown";
	}
}

/**
 * Creates a standardized error for unsupported operations.
 * @param operation The operation name, for example, "getValue" and "setValue"
 * @param control The control that doesn't support the operation
 * @returns Error instance with descriptive message
 * @private
 */
function createUnsupportedOperationError(operation: string, control: Control | undefined): Error {
	const controlType = getControlTypeName(control);
	return new Error(
		`FieldMixin.${operation}() is not supported for control type '${controlType}'. ` +
			`Please add support in CONTROL_TYPE_REGISTRY or ensure the control is wrapped properly.`
	);
}

/**
 * Mixin providing control access, value getter and setter, enabled state management, and message handling for field controls.
 * This mixin combines the following functionalities:
 * 1. FieldControlAccessor: access to the inner control of field-based building blocks
 * 2. FieldValueAccessor: value getter and setter and enablement getter and setter
 * 3. FieldMessageHandler: adding and managing validation messages
 *
 * This mixin enables building blocks to programmatically read and write values, enabled state,
 * and validation messages across different control types (CheckBox, Input, and MDC Field).
 * @alias sap.fe.macros.field.mixin.FieldMixin
 * @public
 */
export default class FieldMixin implements IInterfaceWithMixin {
	static interfaceName = "sap.fe.macros.field.mixin.FieldMixin";

	/**
	 * Returns the interface name for this mixin.
	 * @returns The interface name
	 */
	getInterfaceName(): string {
		return FieldMixin.interfaceName;
	}

	/**
	 * Setup method called when the mixin is applied to a class.
	 * @param _baseClass The base class to which the mixin is applied
	 */
	setupMixin(_baseClass: Function): void {
		// No special setup needed for this mixin
	}

	// ==========================================
	// FieldControlAccessor methods
	// ==========================================

	/**
	 * Returns the first visible control in the FieldWrapper (static utility method).
	 * This method handles FieldWrapper controls and extracts the inner control based on edit mode.
	 * @param control The FieldWrapper control or any other control
	 * @returns The inner control or the original control if not a FieldWrapper
	 */
	static getControlInFieldWrapper(control: Control | undefined): Control | undefined {
		if (control?.isA("sap.fe.macros.controls.FieldWrapper") && !control?.isA("sap.fe.macros.controls.FileWrapper")) {
			const fieldWrapper = control as EnhanceWithUI5<FieldWrapper>;
			const controls = fieldWrapper.getEditMode() === "Display" ? [fieldWrapper.getContentDisplay()] : fieldWrapper.getContentEdit();
			if (controls.length >= 1) {
				return controls[0];
			}
		} else {
			return control;
		}
	}

	/**
	 * Gets the inner control from the source control, handling FieldWrapper and collaboration HBox wrappers.
	 * This method is useful for accessing the actual input control from the building block's content.
	 * @param source The source control (typically from this content)
	 * @returns The inner control or undefined
	 */
	getInnerControl(this: MacroAPI & FieldMixin, source: Control): Control | undefined {
		if (source?.isA("sap.fe.macros.controls.FieldWrapper") && !source?.isA("sap.fe.macros.controls.FileWrapper")) {
			const fieldWrapper = source as EnhanceWithUI5<FieldWrapper>;
			const controls = fieldWrapper.getContentEdit() as Control[];
			let innerControl;
			if (controls.length >= 1) {
				innerControl = controls[0];
			}
			if (innerControl?.isA("sap.m.HBox")) {
				innerControl = (innerControl as HBox).getItems()[0];
			}
			return innerControl;
		}
	}

	/**
	 * Helper method to get the inner control inside several Conditional wrappers.
	 * @param control
	 * @returns The inner control or undefined
	 */
	static getInnerControlWithConditionalWrapper(control: Control | undefined): Control | undefined {
		if (!control) {
			return undefined;
		}

		while (control.isA<typeof ConditionalWrapperType>("sap.fe.macros.controls.ConditionalWrapper")) {
			control = control.getCondition() ? control.getContentTrue() : control.getContentFalse();
		}

		return control;
	}

	/**
	 * Helper method to get the inner control, unwrapping FieldWrapper, collaboration HBox and conditional wrappers.
	 * This consolidates the repeated control retrieval logic used in getValue, setValue, and setEnabled.
	 * @param control The source control
	 * @param collaborationEnabled Whether collaboration is enabled
	 * @returns The unwrapped inner control or undefined
	 */
	static getInnerControlWithCollaboration(control: Control | undefined, collaborationEnabled: boolean): Control | undefined {
		if (!control) {
			return undefined;
		}
		let unwrappedControl = FieldMixin.getControlInFieldWrapper(control);
		if (collaborationEnabled && unwrappedControl?.isA("sap.m.HBox")) {
			unwrappedControl = (unwrappedControl as HBox).getItems()[0];
		}
		return FieldMixin.getInnerControlWithConditionalWrapper(unwrappedControl);
	}

	/**
	 * Determines if the field has an MDC field with pending user input.
	 * This is useful for validation and change handling scenarios where you need to know
	 * if the user has entered data that hasn't been processed yet.
	 * @returns True if the field has pending user input, false otherwise
	 */
	hasPendingUserInput(this: MacroAPI & FieldMixin): boolean {
		const targetControl = FieldMixin.getControlInFieldWrapper(this.getContent());
		return !!(targetControl && targetControl.isA<mdcField>("sap.ui.mdc.Field") && targetControl.hasPendingUserInput());
	}

	// ==========================================
	// FieldValueAccessor methods
	// ==========================================

	/**
	 * Gets the current value of the field.
	 * This method handles various control types including CheckBox, Input, Text, MDC Field,
	 * RatingIndicator, Link, Label, ObjectStatus, ObjectIdentifier, and building blocks.
	 * @returns The current value of the field or undefined if control is not found
	 * @throws {Error} If the control type doesn't support the getValue operation
	 * @public
	 */
	getValue(this: MacroAPI & FieldMixin): boolean | string | number | undefined {
		const oControl = FieldMixin.getInnerControlWithCollaboration(
			this.content,
			(this as { collaborationEnabled?: boolean }).collaborationEnabled ?? false
		);
		if (!oControl) {
			return undefined;
		}

		const operations = getControlOperations(oControl);
		if (operations?.getValue) {
			return operations.getValue(oControl);
		}

		throw createUnsupportedOperationError("getValue", oControl);
	}

	/**
	 * Sets the current value of the field.
	 * This method handles various control types including CheckBox, Input, Text, and MDC Field.
	 * @param value The value to set
	 * @returns The current field reference for chaining
	 * @throws {Error} If the control is not found or doesn't support the setValue operation
	 * @public
	 */
	setValue(this: MacroAPI & FieldMixin, value: boolean | string | number): Control {
		if (!this.content) {
			return this.setProperty("value", value);
		}
		const control = FieldMixin.getInnerControlWithCollaboration(
			this.content,
			(this as { collaborationEnabled?: boolean }).collaborationEnabled ?? false
		);
		if (!control) {
			throw new Error("FieldMixin.setValue() failed: Control not found. Ensure the field content is properly initialized.");
		}

		const operations = getControlOperations(control);
		if (operations?.setValue) {
			operations.setValue(control, value);
			return this;
		}

		throw createUnsupportedOperationError("setValue", control);
	}

	/**
	 * Gets the current enabled state of the field.
	 * This method handles various control types and wrappers, returning true for controls
	 * that are always enabled, such as Text, and checking the enabled property for interactive controls.
	 * @returns Boolean value indicating if the field is enabled, or true if control is not found (graceful fallback)
	 * @public
	 */
	getEnabled(this: MacroAPI & FieldMixin): boolean {
		let control = FieldMixin.getControlInFieldWrapper(this.content);

		// Graceful fallback: if no control, assume enabled
		if (control === null || control === undefined) {
			return true;
		}

		// Handle collaboration-enabled HBox
		if ((this as { collaborationEnabled?: boolean }).collaborationEnabled && control.isA<HBox>("sap.m.HBox")) {
			control = control.getItems()[0];
		}

		control = FieldMixin.getInnerControlWithConditionalWrapper(control);
		if (!control) {
			return true;
		}

		// Handle VBox wrapper
		if (control.isA<VBox>("sap.m.VBox")) {
			control = control.getItems()[0];
		}

		// Handle FileWrapper special case
		if (control.isA<FileWrapper>("sap.fe.macros.controls.FileWrapper")) {
			const fileWrapper = control;
			return fileWrapper.link ? fileWrapper.link.getProperty("enabled") : true;
		}

		// Handle HBox with SituationsIndicator at item[1]
		if ((control as HBox).isA?.("sap.m.HBox") && (control as HBox).getItems()[1]?.isA("sap.fe.macros.situations.SituationsIndicator")) {
			return true;
		}

		// Use registry for standard control types
		const operations = getControlOperations(control);
		if (operations?.getEnabled) {
			return operations.getEnabled(control);
		}

		// Graceful fallback: assume disabled for unknown control types
		// This prevents breaking when encountering unsupported controls in read-only scenarios
		return false;
	}

	/**
	 * Sets the current enabled state of the field.
	 * This method handles various control types, setting the appropriate property,
	 * such as enabled, active, titleActive, or edit mode based on the control type.
	 * @param enabled The enabled state to set
	 * @returns The current field reference for chaining
	 * @throws {Error} If the control is not found or doesn't support the setEnabled operation
	 * @public
	 */
	setEnabled(this: MacroAPI & FieldMixin, enabled: boolean): Control {
		const control = FieldMixin.getInnerControlWithCollaboration(
			this.content,
			(this as { collaborationEnabled?: boolean }).collaborationEnabled ?? false
		);
		if (!control) {
			throw new Error("FieldMixin.setEnabled() failed: Control not found. Ensure the field content is properly initialized.");
		}

		const operations = getControlOperations(control);
		if (operations?.setEnabled) {
			operations.setEnabled(control, enabled);
			return this;
		}

		throw createUnsupportedOperationError("setEnabled", control);
	}

	// ==========================================
	// FieldMessageHandler methods
	// ==========================================

	/**
	 * Gets the message manager instance from the UI5 core.
	 * The message manager is responsible for handling all messages in the application.
	 * @returns The Messaging instance
	 * @public
	 */
	getMessageManager(this: MacroAPI & FieldMixin): Messaging {
		return Messaging;
	}

	/**
	 * Adds a validation message to the field.
	 * This method creates a new message and associates it with the field's binding path,
	 * making it visible in the field's value state and message popover.
	 * @param parameters The message parameters
	 * @param parameters.type Type of the message, such as Error, Warning, Success, or Information
	 * @param parameters.message Message text to display
	 * @param parameters.description Detailed message description
	 * @param parameters.persistent Whether the message persists across refreshes
	 * @returns The ID of the created message
	 * @public
	 */
	addMessage(
		this: MacroAPI & FieldMixin,
		parameters: { type?: MessageType; message?: string; description?: string; persistent?: boolean }
	): string {
		const msgManager = this.getMessageManager();
		const oControl = FieldMixin.getInnerControlWithCollaboration(
			this.content,
			(this as { collaborationEnabled?: boolean }).collaborationEnabled ?? false
		);

		let path: string | undefined;
		if (oControl) {
			const operations = getControlOperations(oControl);
			if (operations?.getBindingPath) {
				path = operations.getBindingPath(oControl);
			}
		}

		const oMessage = new Message({
			target: path,
			type: parameters.type,
			message: parameters.message,
			processor: oControl?.getModel(),
			description: parameters.description,
			persistent: parameters.persistent
		});

		msgManager.addMessages(oMessage);
		return oMessage.getId();
	}

	/**
	 * Removes a message from the field by its ID.
	 * This method finds the message in the message model and removes it,
	 * clearing it from the field's value state.
	 * @param id The ID of the message to remove
	 * @public
	 */
	removeMessage(this: MacroAPI & FieldMixin, id: string): void {
		const msgManager = this.getMessageManager();
		const arr = msgManager.getMessageModel().getData();
		const result = arr.find((e: Message) => e?.getId?.() === id);
		if (result) {
			msgManager.removeMessages(result);
		}
	}
}
