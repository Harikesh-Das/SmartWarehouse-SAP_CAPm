/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/Messaging", "sap/ui/core/message/Message", "sap/ui/mdc/enums/FieldEditMode"], function (Messaging, Message, FieldEditMode) {
  "use strict";

  var _exports = {};
  /**
   * Type definitions for control operations registry
   * @private
   */

  /**
   * Control operations registry for centralizing control type handling
   * @private
   */

  /**
   * Centralized registry of control type operations to eliminate code duplication.
   * This registry maps control types to their specific operations for value access,
   * enabled state management, and binding path resolution.
   * @private
   */
  const CONTROL_TYPE_REGISTRY = [{
    check: c => c.isA("sap.m.CheckBox"),
    operations: {
      getValue: c => c.getSelected(),
      setValue: (c, v) => c.setSelected(v),
      getBindingPath: c => c.getBinding("selected")?.getResolvedPath(),
      getEnabled: c => c.getProperty("enabled"),
      setEnabled: (c, e) => c.setProperty("enabled", e)
    }
  }, {
    check: c => c.isA("sap.m.InputBase"),
    operations: {
      getValue: c => c.getValue(),
      setValue: (c, v) => c.setValue(v),
      getBindingPath: c => c.getBinding("value")?.getResolvedPath(),
      getEnabled: c => c.getProperty("enabled"),
      setEnabled: (c, e) => c.setProperty("enabled", e)
    }
  }, {
    check: c => c.isA("sap.ui.mdc.Field"),
    operations: {
      getValue: c => c.getValue(),
      setValue: (c, v) => c.setValue(v),
      getBindingPath: c => c.getBinding("value")?.getResolvedPath(),
      getEnabled: c => {
        const editMode = c.getEditMode();
        return editMode !== FieldEditMode.Disabled;
      },
      setEnabled: (c, e) => {
        c.setEditMode(e ? FieldEditMode.Editable : FieldEditMode.Disabled);
        return c;
      }
    }
  }, {
    check: c => c.isA("sap.m.RatingIndicator"),
    operations: {
      getValue: c => c.getValue()
    }
  }, {
    check: c => c.isA("sap.m.Link"),
    operations: {
      getValue: c => c.getText(),
      getEnabled: c => c.getProperty("enabled"),
      setEnabled: (c, e) => c.setProperty("enabled", e)
    }
  }, {
    check: c => c.isA("sap.m.Label"),
    operations: {
      getValue: c => c.getText()
    }
  }, {
    check: c => c.isA("sap.m.Text"),
    operations: {
      getValue: c => c.getText(false),
      setValue: (c, v) => c.setText(v),
      getEnabled: () => true
    }
  }, {
    check: c => c.isA("sap.fe.macros.controls.TextLink"),
    operations: {
      getValue: c => c.getText(),
      getEnabled: () => true
    }
  }, {
    check: c => c.isA("sap.m.ObjectStatus"),
    operations: {
      getValue: c => c.getText(),
      getEnabled: () => true,
      setEnabled: (c, e) => c.setProperty("active", e)
    }
  }, {
    check: c => c.isA("sap.m.ObjectIdentifier"),
    operations: {
      getValue: c => c.getTitle(),
      getEnabled: () => true,
      setEnabled: (c, e) => c.setProperty("titleActive", e)
    }
  }, {
    check: c => c.isA("sap.m.Button"),
    operations: {
      getEnabled: c => c.getProperty("enabled"),
      setEnabled: (c, e) => c.setProperty("enabled", e)
    }
  }, {
    check: c => c.isA("sap.fe.macros.internal.DataPoint"),
    operations: {
      getValue: c => c.getValue(),
      getEnabled: c => c.getEnabled(),
      setEnabled: (c, e) => {
        c.setEnabled(e);
        return c;
      }
    }
  }, {
    check: c => c.isA("sap.fe.macros.contact.Email"),
    operations: {
      getValue: c => c.getValue(),
      getEnabled: c => c.getProperty("linkEnabled"),
      setEnabled: (c, e) => {
        c.setLinkEnabled(e);
        return c;
      }
    }
  }, {
    check: c => c.isA("sap.fe.macros.contact.Contact"),
    operations: {
      getValue: c => c.getValue(),
      getEnabled: c => c.getEnabled()
    }
  }, {
    check: c => c.isA("sap.fe.core.controls.FormElementWrapper"),
    operations: {
      getEnabled: () => true
    }
  }, {
    check: c => c.isA("sap.m.ExpandableText"),
    operations: {
      getEnabled: () => true
    }
  }];

  /**
   * Finds the control operations for a given control from the registry.
   * @param control The control to find operations for
   * @returns The control operations or undefined if not found
   * @private
   */
  function getControlOperations(control) {
    const entry = CONTROL_TYPE_REGISTRY.find(e => e.check(control));
    return entry?.operations;
  }

  /**
   * Gets the control type name for error messages.
   * @param control The control to get the type name for
   * @returns The control type name or "unknown"
   * @private
   */
  function getControlTypeName(control) {
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
  function createUnsupportedOperationError(operation, control) {
    const controlType = getControlTypeName(control);
    return new Error(`FieldMixin.${operation}() is not supported for control type '${controlType}'. ` + `Please add support in CONTROL_TYPE_REGISTRY or ensure the control is wrapped properly.`);
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
  let FieldMixin = /*#__PURE__*/function () {
    function FieldMixin() {}
    _exports = FieldMixin;
    var _proto = FieldMixin.prototype;
    /**
     * Returns the interface name for this mixin.
     * @returns The interface name
     */
    _proto.getInterfaceName = function getInterfaceName() {
      return FieldMixin.interfaceName;
    }

    /**
     * Setup method called when the mixin is applied to a class.
     * @param _baseClass The base class to which the mixin is applied
     */;
    _proto.setupMixin = function setupMixin(_baseClass) {
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
     */;
    FieldMixin.getControlInFieldWrapper = function getControlInFieldWrapper(control) {
      if (control?.isA("sap.fe.macros.controls.FieldWrapper") && !control?.isA("sap.fe.macros.controls.FileWrapper")) {
        const fieldWrapper = control;
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
     */;
    _proto.getInnerControl = function getInnerControl(source) {
      if (source?.isA("sap.fe.macros.controls.FieldWrapper") && !source?.isA("sap.fe.macros.controls.FileWrapper")) {
        const fieldWrapper = source;
        const controls = fieldWrapper.getContentEdit();
        let innerControl;
        if (controls.length >= 1) {
          innerControl = controls[0];
        }
        if (innerControl?.isA("sap.m.HBox")) {
          innerControl = innerControl.getItems()[0];
        }
        return innerControl;
      }
    }

    /**
     * Helper method to get the inner control inside several Conditional wrappers.
     * @param control
     * @returns The inner control or undefined
     */;
    FieldMixin.getInnerControlWithConditionalWrapper = function getInnerControlWithConditionalWrapper(control) {
      if (!control) {
        return undefined;
      }
      while (control.isA("sap.fe.macros.controls.ConditionalWrapper")) {
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
     */;
    FieldMixin.getInnerControlWithCollaboration = function getInnerControlWithCollaboration(control, collaborationEnabled) {
      if (!control) {
        return undefined;
      }
      let unwrappedControl = FieldMixin.getControlInFieldWrapper(control);
      if (collaborationEnabled && unwrappedControl?.isA("sap.m.HBox")) {
        unwrappedControl = unwrappedControl.getItems()[0];
      }
      return FieldMixin.getInnerControlWithConditionalWrapper(unwrappedControl);
    }

    /**
     * Determines if the field has an MDC field with pending user input.
     * This is useful for validation and change handling scenarios where you need to know
     * if the user has entered data that hasn't been processed yet.
     * @returns True if the field has pending user input, false otherwise
     */;
    _proto.hasPendingUserInput = function hasPendingUserInput() {
      const targetControl = FieldMixin.getControlInFieldWrapper(this.getContent());
      return !!(targetControl && targetControl.isA("sap.ui.mdc.Field") && targetControl.hasPendingUserInput());
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
     */;
    _proto.getValue = function getValue() {
      const oControl = FieldMixin.getInnerControlWithCollaboration(this.content, this.collaborationEnabled ?? false);
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
     */;
    _proto.setValue = function setValue(value) {
      if (!this.content) {
        return this.setProperty("value", value);
      }
      const control = FieldMixin.getInnerControlWithCollaboration(this.content, this.collaborationEnabled ?? false);
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
     */;
    _proto.getEnabled = function getEnabled() {
      let control = FieldMixin.getControlInFieldWrapper(this.content);

      // Graceful fallback: if no control, assume enabled
      if (control === null || control === undefined) {
        return true;
      }

      // Handle collaboration-enabled HBox
      if (this.collaborationEnabled && control.isA("sap.m.HBox")) {
        control = control.getItems()[0];
      }
      control = FieldMixin.getInnerControlWithConditionalWrapper(control);
      if (!control) {
        return true;
      }

      // Handle VBox wrapper
      if (control.isA("sap.m.VBox")) {
        control = control.getItems()[0];
      }

      // Handle FileWrapper special case
      if (control.isA("sap.fe.macros.controls.FileWrapper")) {
        const fileWrapper = control;
        return fileWrapper.link ? fileWrapper.link.getProperty("enabled") : true;
      }

      // Handle HBox with SituationsIndicator at item[1]
      if (control.isA?.("sap.m.HBox") && control.getItems()[1]?.isA("sap.fe.macros.situations.SituationsIndicator")) {
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
     */;
    _proto.setEnabled = function setEnabled(enabled) {
      const control = FieldMixin.getInnerControlWithCollaboration(this.content, this.collaborationEnabled ?? false);
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
     */;
    _proto.getMessageManager = function getMessageManager() {
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
     */;
    _proto.addMessage = function addMessage(parameters) {
      const msgManager = this.getMessageManager();
      const oControl = FieldMixin.getInnerControlWithCollaboration(this.content, this.collaborationEnabled ?? false);
      let path;
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
     */;
    _proto.removeMessage = function removeMessage(id) {
      const msgManager = this.getMessageManager();
      const arr = msgManager.getMessageModel().getData();
      const result = arr.find(e => e?.getId?.() === id);
      if (result) {
        msgManager.removeMessages(result);
      }
    };
    return FieldMixin;
  }();
  FieldMixin.interfaceName = "sap.fe.macros.field.mixin.FieldMixin";
  _exports = FieldMixin;
  return _exports;
}, false);
//# sourceMappingURL=FieldMixin-dbg.js.map
