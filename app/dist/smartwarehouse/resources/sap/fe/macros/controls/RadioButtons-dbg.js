/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/m/RadioButton", "sap/m/RadioButtonGroup", "sap/ui/core/CustomData", "sap/ui/core/Messaging", "sap/ui/core/library", "sap/fe/base/jsx-runtime/jsx"], function (BindingToolkit, ClassSupport, CommonUtils, BuildingBlock, RadioButton, RadioButtonGroup, CustomData, Messaging, library, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15;
  var _exports = {};
  var ValueState = library.ValueState;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var pathInModel = BindingToolkit.pathInModel;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let RadioButtons = (_dec = defineUI5Class("sap.fe.macros.controls.RadioButtons"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "string[]"
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "any",
    defaultValue: null
  }), _dec6 = property({
    type: "string"
  }), _dec7 = property({
    type: "object",
    bindToState: true
  }), _dec8 = property({
    type: "any",
    isBindingInfo: true
  }), _dec9 = property({
    type: "any",
    isBindingInfo: true
  }), _dec10 = property({
    type: "boolean"
  }), _dec11 = property({
    type: "string",
    isBindingInfo: true
  }), _dec12 = property({
    type: "string",
    isBindingInfo: true
  }), _dec13 = property({
    type: "string"
  }), _dec14 = property({
    type: "string"
  }), _dec15 = property({
    type: "string"
  }), _dec16 = property({
    type: "function"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function RadioButtons(properties, others) {
      var _this;
      _this = _BuildingBlock.call(this, properties, others) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      _initializerDefineProperty(_this, "fieldGroupIds", _descriptor2, _this);
      _initializerDefineProperty(_this, "requiredExpression", _descriptor3, _this);
      // We use type 'raw' here because otherwise the binding will refuse to update the value, as it doesn't know how to convert from any to string
      // Setting it to raw make sure that no conversion is attempted which then works
      // Default value is set to null to allow having a radio button pointing to a `null` value
      _initializerDefineProperty(_this, "value", _descriptor4, _this);
      _initializerDefineProperty(_this, "fixedValuesPath", _descriptor5, _this);
      /**
       * An array of possible, fixed value list object
       * If this property is used, the fixedValuesPath property is ignored.
       */
      _initializerDefineProperty(_this, "possibleValues", _descriptor6, _this);
      _initializerDefineProperty(_this, "radioButtonTextProperty", _descriptor7, _this);
      _initializerDefineProperty(_this, "radioButtonKeyProperty", _descriptor8, _this);
      _initializerDefineProperty(_this, "horizontalLayout", _descriptor9, _this);
      _initializerDefineProperty(_this, "enabledExpression", _descriptor10, _this);
      _initializerDefineProperty(_this, "editableExpression", _descriptor11, _this);
      _initializerDefineProperty(_this, "width", _descriptor12, _this);
      _initializerDefineProperty(_this, "dataSourcePath", _descriptor13, _this);
      _initializerDefineProperty(_this, "dataTextSourcePath", _descriptor14, _this);
      _initializerDefineProperty(_this, "validateFieldGroup", _descriptor15, _this);
      _this.content = _this.createContent();

      // Create a message binding to listen for message changes
      const messageModel = Messaging.getMessageModel();
      _this.messageBinding = messageModel.bindProperty("/");
      _this.messageBinding.attachChange(_this.handleMessageChange.bind(_this));
      return _this;
    }
    _exports = RadioButtons;
    _inheritsLoose(RadioButtons, _BuildingBlock);
    var _proto = RadioButtons.prototype;
    _proto.exit = function exit() {
      // Clean up message binding
      if (this.messageBinding) {
        this.messageBinding.destroy();
        this.messageBinding = undefined;
      }
      _BuildingBlock.prototype.exit.call(this);
    }

    /**
     * Handler for message model changes to manually update valueState on RadioButtonGroup.
     */;
    _proto.handleMessageChange = function handleMessageChange() {
      if (!this.content || !this.dataSourcePath) {
        return;
      }
      const context = this.getBindingContext();
      if (!context) {
        return;
      }

      // Get all messages from the message manager
      const messages = Messaging.getMessageModel().getData();

      // Extract just the property name from dataSourcePath
      const propertyName = this.dataSourcePath.split("/").pop();
      if (!propertyName) {
        return;
      }

      // Get the binding context path to match against message targets
      const contextPath = context.getPath();

      // Find messages that target this control's data property
      const relevantMessages = messages.filter(msg => {
        const targets = msg.getTargets();
        // Check if any target matches both the context path and ends with the property name
        return targets.length > 0 && targets.some(target => {
          return target.endsWith(`/${propertyName}`) && target.startsWith(contextPath);
        });
      });

      // Update valueState based on messages
      if (relevantMessages.length > 0) {
        // Find the highest severity message
        let highestSeverity = ValueState.None;
        for (const msg of relevantMessages) {
          const type = msg.getType();
          if (type === "Error" && highestSeverity !== ValueState.Error) {
            highestSeverity = ValueState.Error;
          } else if (type === "Warning" && (highestSeverity === ValueState.None || highestSeverity === ValueState.Information)) {
            highestSeverity = ValueState.Warning;
          } else if (type === "Information" && highestSeverity === ValueState.None) {
            highestSeverity = ValueState.Information;
          }
        }
        this.content.setValueState(highestSeverity);
      } else {
        // No messages, reset to None
        this.content.setValueState(ValueState.None);
      }
    }

    /**
     * Event handler for the RadioButtonGroup's select event.
     * We need to parse from the radio button group index to the model value.
     * @param event
     */;
    _proto.onRadioButtonSelect = function onRadioButtonSelect(event) {
      const radioButtonGroup = event.getSource();
      const selectedIndex = event.getParameter("selectedIndex");
      if (selectedIndex !== undefined) {
        const selectedRadioButtonKey = radioButtonGroup?.getButtons()[selectedIndex].getCustomData()[0].getValue();
        // Now we have the value => write it to the model!
        this.setProperty("value", selectedRadioButtonKey);
        CommonUtils.getTargetView(radioButtonGroup)?.getController()?.sideEffects?.handleFieldChange(event, true);

        // Refresh the associated text/description property so that bindings using @Common.Text
        // (e.g. header facets) update immediately — replicates what FieldBaseDelegate.getDescription
        // does for InputWithValueHelp after a value help selection.
        if (this.dataTextSourcePath) {
          const bindingContext = this.getBindingContext();
          if (bindingContext) {
            const lastIndex = this.dataTextSourcePath.lastIndexOf("/");
            const sideEffectPath = lastIndex > 0 ? this.dataTextSourcePath.substring(0, lastIndex) : this.dataTextSourcePath;
            CommonUtils.getAppComponent(radioButtonGroup).getSideEffectsService().requestSideEffects([sideEffectPath], bindingContext);
          }
        }
      }
    }

    /**
     * The value property type needs to be initially 'any' but has to be changed to 'raw' to avoid parsing errors.
     * @param name
     * @param bindingInfo
     * @returns This
     */;
    _proto.bindProperty = function bindProperty(name, bindingInfo) {
      if (name === "value" && !bindingInfo.formatter) {
        // not if a formatter is used, as this needs to be executed
        bindingInfo.targetType = "raw";
      }
      return _BuildingBlock.prototype.bindProperty.call(this, name, bindingInfo);
    }

    /**
     * This is being called when the model fetches the data from the backend or when we call it directly.
     * We need to parse from the model value to the radio button group index.
     * @param newValue
     */;
    _proto.setValue = function setValue(newValue) {
      this.value = newValue;
      if (this.content) {
        // Compute the new radio button index
        const radioButtons = this.content.getButtons();
        if (radioButtons.length != 0) {
          let radioButtonIndex = 0;
          for (const radioButton of radioButtons) {
            const keyCustomData = radioButton.getCustomData()[0].getBinding("value")?.getValue();
            if (keyCustomData === newValue) {
              this.content.setSelectedIndex(radioButtonIndex);
              return;
            }
            radioButtonIndex++;
          }
        }
        // If no value could be found or if the radio button aggregation was empty, which can happen due to
        // a very early call of setValue, set the selected to index to -1 which results in NO radio button to be selected.
        this.content.setSelectedIndex(-1);
      }
    }

    /**
     * Setter for valueState property to forward changes to the RadioButtonGroup.
     * @param newValueState The new value state
     */;
    _proto.setValueState = function setValueState(newValueState) {
      this.valueState = newValueState;
      if (this.content) {
        this.content.setValueState(newValueState);
      }
    }

    /**
     * The building block render function.
     * @returns The radio button group
     */;
    _proto.createContent = function createContent() {
      // Setting up the binding so that we can access $count for getting the number
      // of entries in the fixed value list and set this as number of radio button columns
      // in case horizontal layout is configured
      let buttonsBindingContext;
      if (this.possibleValues) {
        buttonsBindingContext = this.bindState("possibleValues");
        this.radioButtonTextProperty = pathInModel("text", "$componentState");
        this.radioButtonKeyProperty = pathInModel("key", "$componentState");
      } else {
        buttonsBindingContext = {
          path: `${this.fixedValuesPath}`,
          parameters: {
            $count: true
          },
          events: {
            dataReceived: ev => {
              const count = ev.getSource()?.getCount();
              if (count !== undefined && this.horizontalLayout) {
                radioButtonGroup.setColumns(count);
              }
              // Check if there is a value stored from the initialization but the radio
              // button selection has not yet been done and do this now
              if (this.value !== undefined && radioButtonGroup.getSelectedIndex() === -1) {
                this.setValue(this.value);
              }
            }
          }
        };
      }
      const radioButtonGroup = _jsx(RadioButtonGroup, {
        buttons: buttonsBindingContext,
        select: this.onRadioButtonSelect.bind(this),
        editable: this.editableExpression,
        enabled: this.enabledExpression,
        fieldGroupIds: this.fieldGroupIds,
        ariaLabelledBy: this.ariaLabelledBy,
        width: this.width,
        columns: this.possibleValues?.length ?? 1,
        validateFieldGroup: this.validateFieldGroup,
        children: _jsx(RadioButton, {
          text: this.radioButtonTextProperty,
          customData: _jsx(CustomData, {
            value: this.radioButtonKeyProperty
          }, "key"),
          class: "sapUiSmallMarginEnd",
          tooltip: this.radioButtonTextProperty
        })
      });

      // The SideEffects mechanism identifies the field via data("sourcePath") on the control
      // that fires the change event. Since onRadioButtonSelect passes the inner RadioButtonGroup
      // as the event source, we attach sourcePath here so that getTargetProperty() in
      // SideEffects.ts can resolve the correct property path and trigger side effects.
      if (this.dataSourcePath) {
        radioButtonGroup.addCustomData(new CustomData({
          key: "sourcePath",
          value: this.dataSourcePath
        }));
      }
      return radioButtonGroup;
    };
    return RadioButtons;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "fieldGroupIds", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "requiredExpression", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "value", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "fixedValuesPath", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "possibleValues", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "radioButtonTextProperty", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "radioButtonKeyProperty", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "horizontalLayout", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "enabledExpression", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "editableExpression", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "width", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "100%";
    }
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "dataSourcePath", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "dataTextSourcePath", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "validateFieldGroup", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = RadioButtons;
  return _exports;
}, false);
//# sourceMappingURL=RadioButtons-dbg.js.map
