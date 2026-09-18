/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BuildingBlockBase", "sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/ui/core/Messaging", "sap/ui/core/message/MessageType"], function (BuildingBlockBase, ClassSupport, CommonUtils, Messaging, MessageType) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;
  var _exports = {};
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block to wrap a FlexBox and expose a required property.
   * Handles error display for checkbox field groups by listening to message model changes.
   * @private
   */
  let RequiredFlexBox = (_dec = defineUI5Class("sap.fe.macros.controls.RequiredFlexBox"), _dec2 = implementInterface("sap.ui.core.IFormContent"), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "boolean"
  }), _dec5 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    function RequiredFlexBox() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BuildingBlockBase.call(this, ...args) || this;
      _initializerDefineProperty(_this, "__implements__sap_ui_core_IFormContent", _descriptor, _this);
      _initializerDefineProperty(_this, "id", _descriptor2, _this);
      _initializerDefineProperty(_this, "required", _descriptor3, _this);
      _initializerDefineProperty(_this, "fieldGroupName", _descriptor4, _this);
      _this._initialized = false;
      return _this;
    }
    _exports = RequiredFlexBox;
    _inheritsLoose(RequiredFlexBox, _BuildingBlockBase);
    var _proto = RequiredFlexBox.prototype;
    _proto.onBeforeRendering = function onBeforeRendering() {
      // Initialize error handling once, ensuring parent hierarchy is established
      if (!this._initialized && this.fieldGroupName) {
        this.initializeErrorHandling();
        this._initialized = true;
      }
    };
    _proto.initializeErrorHandling = function initializeErrorHandling() {
      const messageModel = Messaging.getMessageModel();
      this._messageBinding = messageModel.bindProperty("/");
      const messageChangeHandler = () => {
        this.handleFieldGroupErrors();
      };
      this._messageBinding.attachChange(messageChangeHandler);
      this.handleFieldGroupErrors(); // Initial check
    };
    _proto.handleFieldGroupErrors = function handleFieldGroupErrors() {
      // Navigate to FormContainer via parent hierarchy
      const formElement = this.getParent();
      if (!formElement?.isA?.("sap.ui.layout.form.FormElement")) {
        return;
      }
      const formContainer = formElement.getParent();
      if (!formContainer?.isA?.("sap.ui.layout.form.FormContainer")) {
        return;
      }

      // Get dependencies
      const view = CommonUtils.getTargetView(this);
      const controller = view?.getController();
      if (!controller) {
        return;
      }
      const internalModel = CommonUtils.getAppComponent(this)?.getModel("internal");
      if (!internalModel || !this.fieldGroupName) {
        return;
      }

      // Build map and process errors
      const messages = Messaging.getMessageModel().getData();
      const fieldGroupMap = RequiredFlexBox.buildFieldGroupMap(formContainer);
      const booleanPaths = fieldGroupMap.get(this.fieldGroupName);

      // Clear error state
      RequiredFlexBox.setFieldGroupState(internalModel, this.fieldGroupName, "None", "");

      // Check if all booleans in this field group are in error
      if (booleanPaths) {
        messages.forEach(msg => {
          if (msg.getType() === MessageType.Error) {
            const messageTargets = msg.getTargets();
            const allBooleansInError = Array.from(booleanPaths).every(boolPath => messageTargets.some(target => target.includes(`/${boolPath}`)));
            if (allBooleansInError && this.fieldGroupName) {
              RequiredFlexBox.setFieldGroupState(internalModel, this.fieldGroupName, "Error", msg.getMessage());
            }
          }
        });
      }
    };
    _proto.destroy = function destroy() {
      if (this._messageBinding) {
        this._messageBinding.destroy();
        this._messageBinding = undefined;
      }
      _BuildingBlockBase.prototype.destroy.call(this);
    }

    /**
     * Sets the value state for a field group in the internal model.
     * @param internalModel The internal JSON model
     * @param fieldGroupName The field group name
     * @param valueState The value state to set (e.g., "None", "Error")
     * @param valueStateText The value state text message
     */;
    RequiredFlexBox.setFieldGroupState = function setFieldGroupState(internalModel, fieldGroupName, valueState, valueStateText) {
      internalModel.setProperty(`/${fieldGroupName}/valueState`, valueState);
      internalModel.setProperty(`/${fieldGroupName}/valueStateText`, valueStateText);
    }

    /**
     * Extracts the property path from a Field control.
     * @param field The Field control
     * @returns The property path or undefined if not found
     */;
    RequiredFlexBox.getPropertyPathFromField = function getPropertyPathFromField(field) {
      const metaPath = field.metaPath;
      const metaModel = field.getBindingContext()?.getModel()?.getMetaModel();
      const metaContext = metaModel?.createBindingContext(metaPath);
      const dataField = metaContext?.getObject();
      return dataField?.Value?.$Path || dataField?.Value?.path;
    }

    /**
     * Extracts the field group name from a Field control by traversing up to the FormElement parent.
     * @param field The Field control
     * @returns The field group name or undefined if not found
     */;
    RequiredFlexBox.getFieldGroupNameFromField = function getFieldGroupNameFromField(field) {
      let parent = field.getParent();
      while (parent && !parent.isA("sap.ui.layout.form.FormElement")) {
        parent = parent.getParent();
      }
      if (parent) {
        const formElement = parent;
        const customData = formElement.getCustomData().find(cd => cd.getKey() === "fieldGroupName");
        return customData?.getValue();
      }
      return undefined;
    }

    /**
     * Builds a map of field group names to their associated property paths.
     * @param formContainer The FormContainer control
     * @returns A Map where keys are field group names and values are Sets of property paths
     */;
    RequiredFlexBox.buildFieldGroupMap = function buildFieldGroupMap(formContainer) {
      const fieldGroupMap = new Map();
      const allFields = formContainer.findAggregatedObjects(true, control => {
        return control.isA("sap.fe.macros.Field");
      });
      allFields.forEach(control => {
        const field = control;
        const formatOptions = field.formatOptions;
        if (formatOptions?.isFieldGroupItem === true) {
          const propertyPath = RequiredFlexBox.getPropertyPathFromField(field);
          const fieldGroupName = RequiredFlexBox.getFieldGroupNameFromField(field);
          if (propertyPath && fieldGroupName) {
            if (!fieldGroupMap.has(fieldGroupName)) {
              fieldGroupMap.set(fieldGroupName, new Set());
            }
            fieldGroupMap.get(fieldGroupName).add(propertyPath);
          }
        }
      });
      return fieldGroupMap;
    };
    return RequiredFlexBox;
  }(BuildingBlockBase), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_ui_core_IFormContent", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "required", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "fieldGroupName", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = RequiredFlexBox;
  return _exports;
}, false);
//# sourceMappingURL=RequiredFlexBox-dbg.js.map
