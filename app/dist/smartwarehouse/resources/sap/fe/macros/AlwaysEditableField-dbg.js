/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/templating/PropertyHelper", "sap/ui/mdc/enums/FieldEditMode", "./MacroAPI", "./ValueHelp", "./field/mixin/FieldMixin", "./internal/field/EditStyle", "./internal/field/FieldStructureHelper"], function (Log, BindingToolkit, ClassSupport, PropertyHelper, FieldEditMode, MacroAPI, ValueHelp, FieldMixin, EditStyle, FieldStructureHelper) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8;
  var _exports = {};
  var setUpField = FieldStructureHelper.setUpField;
  var hasValueHelp = PropertyHelper.hasValueHelp;
  var getAssociatedUnitProperty = PropertyHelper.getAssociatedUnitProperty;
  var getAssociatedCurrencyProperty = PropertyHelper.getAssociatedCurrencyProperty;
  var property = ClassSupport.property;
  var mixin = ClassSupport.mixin;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  var constant = BindingToolkit.constant;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block for creating an always-editable field based on metadata provided by OData V4.
   * <br>
   * This building block is designed for use with JSON model bindings in custom dialogs and popups,
   * where the field must always be editable regardless of OData metadata or draft status.
   * <br>
   * When creating an AlwaysEditableField building block, you must provide an ID.
   *
   * Usage example:
   * <pre>
   * &lt;macros:AlwaysEditableField
   * id="MyAlwaysEditableField"
   * metaPath="MyProperty"
   * value="{myJSONModel>/myValue}"
   * description="{myJSONModel>/myDescription}" /&gt;
   * </pre>
   * @mixes sap.fe.macros.field.mixin.FieldMixin
   * @alias sap.fe.macros.AlwaysEditableField
   * @public
   */
  let AlwaysEditableField = (_dec = defineUI5Class("sap.fe.macros.AlwaysEditableField", {
    returnTypes: ["sap.fe.core.controls.FormElementWrapper"]
  }), _dec2 = mixin(FieldMixin), _dec3 = property({
    type: "string",
    expectedTypes: ["Property"]
  }), _dec4 = property({
    type: "string",
    expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"]
  }), _dec5 = property({
    type: "string",
    bindable: true,
    isBindingInfo: true,
    required: false
  }), _dec6 = property({
    type: "string",
    bindable: true,
    isBindingInfo: true,
    required: false
  }), _dec7 = aggregation({
    type: "sap.fe.macros.field.FieldFormatOptions"
  }), _dec8 = property({
    type: "string"
  }), _dec9 = event(), _dec10 = event(), _dec(_class = _dec2(_class = (_class2 = /*#__PURE__*/function (_MacroAPI) {
    function AlwaysEditableField(props, others) {
      var _this;
      _this = _MacroAPI.call(this, props, others) || this;
      // id is inherited from Control but needs to be accessible in TypeScript
      // Do not use @property decorator to avoid PropertyBindingInfo type conflict in generated .d.ts
      /**
       * Defines the relative path of the property in the metamodel, based on the current contextPath.
       * AlwaysEditableField only supports metadata paths with the Property type.
       * @public
       */
      _initializerDefineProperty(_this, "metaPath", _descriptor, _this);
      /**
       * Defines the path of the context used in the current page or block.
       * This setting is defined by the framework.
       * @public
       */
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _this);
      /**
       * This is used to optionally provide an external value that comes from a different model than the OData model.
       * Typically used with JSON models for custom popup scenarios.
       * @public
       */
      _initializerDefineProperty(_this, "value", _descriptor3, _this);
      /**
       * This is used to optionally provide an external description that comes from a different model than the oData model.
       * This must be used in conjunction with the value property.
       * @public
       */
      _initializerDefineProperty(_this, "description", _descriptor4, _this);
      /**
       * A set of options that can be configured.
       * @public
       */
      _initializerDefineProperty(_this, "formatOptions", _descriptor5, _this);
      /**
       * Prefix added to the generated ID of the value help used for the field.
       * @public
       */
      _initializerDefineProperty(_this, "vhIdPrefix", _descriptor6, _this);
      /**
       * An event containing details is triggered when the value of the field is changed.
       * @public
       */
      _initializerDefineProperty(_this, "change", _descriptor7, _this);
      /**
       * An event containing details is triggered when the value of the field is live changed.
       * <br>
       * <b>Note:</b> Browsing autocomplete suggestions does not fire the event.
       * @public
       */
      _initializerDefineProperty(_this, "liveChange", _descriptor8, _this);
      return _this;
    }
    _exports = AlwaysEditableField;
    _inheritsLoose(AlwaysEditableField, _MacroAPI);
    var _proto = AlwaysEditableField.prototype;
    _proto.applySettings = function applySettings(mSettings, oScope) {
      this._doNotCreateOnNullContext = true; // We don't want to create the field if there is no context
      return _MacroAPI.prototype.applySettings.call(this, mSettings, oScope);
    }

    /**
     * Called when metadata is available. Creates the AlwaysEditableField content.
     */;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      if (!this.content) {
        const preparedProperties = this.prepareProperties();
        if (preparedProperties) {
          this.createContent(preparedProperties);
        }
      }
    }

    /**
     * Handles the change event for the edit field.
     * @param changeEvent The change event object
     */;
    _proto.handleChange = function handleChange(changeEvent) {
      const source = changeEvent.getSource();
      const customValueBinding = this.customValueBinding;

      // Type guard: Only process if customValueBinding is a PropertyBindingInfo object or resolved binding
      if (customValueBinding && typeof customValueBinding === "object") {
        let newValue;
        let valueModel;
        let bindingPath;
        let modelName;

        // Check if this is a resolved binding object with a binding property
        if ("binding" in customValueBinding && customValueBinding.binding) {
          const binding = customValueBinding.binding;
          valueModel = binding.getModel();
          bindingPath = binding.getPath();
        } else if ("path" in customValueBinding) {
          // Raw PropertyBindingInfo
          modelName = "model" in customValueBinding ? customValueBinding.model : undefined;
          valueModel = source?.getModel(modelName);
          bindingPath = customValueBinding.path;
        }
        if (valueModel && bindingPath) {
          if (source.isA("sap.m.CheckBox")) {
            newValue = changeEvent.getParameter("selected");
          } else {
            newValue = changeEvent.getParameter("value");
          }
          valueModel.setProperty(bindingPath, newValue);
          valueModel.updateBindings(true);
        }
      }
      this.fireEvent("change", {
        value: changeEvent.getParameter("value"),
        isValid: changeEvent.getParameter("valid") ?? true
      });
    }

    /**
     * Handles the live change event for the edit field.
     * @param _liveChangeEvent The live change event object
     */;
    _proto.handleLiveChange = function handleLiveChange(_liveChangeEvent) {
      this.fireEvent("liveChange", {});
    }

    /**
     * Gets the ValueHelp template ID for a field if it has a value help configured.
     * @param field The field block properties
     * @returns The ValueHelp template ID or undefined
     * @private
     */;
    _proto.getPossibleValueHelpTemplateId = function getPossibleValueHelpTemplateId(field) {
      // For currency (and later Unit) we need to forward the value help to the annotated field
      const targetProperty = getAssociatedCurrencyProperty(field.property) ?? getAssociatedUnitProperty(field.property) ?? field.property;
      if (targetProperty && hasValueHelp(targetProperty)) {
        // depending on whether this one has a value help annotation included, add the dependent
        const vhTemplate = ValueHelp.getValueHelpForMetaPath(this.getPageController(), field.dataSourcePath, field.contextPath?.getPath(), this.getMetaModel(), field._requiresValidation);
        return vhTemplate?.getContent()?.getId();
      }
      return "";
    }

    /**
     * Prepares the properties for the AlwaysEditableField building block.
     * @returns The prepared properties
     */;
    _proto.prepareProperties = function prepareProperties() {
      const viewDataModel = this.getModel("viewData");
      const internalModel = this.getModel("internal");
      const appComponent = this.getAppComponent();
      const odataMetaModel = this.getMetaModel();
      const resolvedContextPath = this.contextPath ?? this._getOwner()?.preprocessorContext?.fullContextPath;
      if (!resolvedContextPath) {
        Log.error("AlwaysEditableField: contextPath is undefined");
        return undefined;
      }

      // Create Context objects from string paths like Field.ts does
      const computedContextPath = odataMetaModel.getMetaContext(resolvedContextPath);
      const fullMetaPath = computedContextPath.getPath() + "/" + this.metaPath;
      const computedMetaPath = odataMetaModel.createBindingContext(fullMetaPath);

      // Convert AlwaysEditableField properties to InputFieldBlockProperties format
      const fieldProperties = {
        id: this.id,
        contextPath: resolvedContextPath,
        metaPath: this.metaPath,
        value: this.value,
        description: this.description,
        formatOptions: this.formatOptions,
        vhIdPrefix: this.vhIdPrefix,
        change: this.change,
        liveChange: this.liveChange,
        // Force read-only to false - AlwaysEditableField is always editable
        readOnly: constant(false),
        // No edit mode specified - will be overridden below
        editMode: undefined
      };

      // Call the standard Field setup function with Context objects
      // Empty controlConfiguration - used only for field override lookups, which we don't have at runtime
      const preparedProperties = setUpField(fieldProperties, {}, viewDataModel, internalModel, appComponent, false,
      // isReadOnlyInitial = false
      computedMetaPath, computedContextPath);

      // Override computed properties to force always-editable behavior
      // This is the key difference from standard Field - AlwaysEditableField ignores OData editability
      Object.assign(preparedProperties, {
        editMode: FieldEditMode.Editable,
        computedEditMode: FieldEditMode.Editable,
        editableExpression: "true",
        enabledExpression: "true"
      });
      preparedProperties.isDynamicInstantiation = true;
      preparedProperties.getTranslatedText = this.getTranslatedText.bind(this);
      if (preparedProperties.ariaLabelledBy === undefined) {
        preparedProperties.ariaLabelledBy = [];
      }
      this.dataModelPath = preparedProperties.dataModelPath;
      return preparedProperties;
    }

    /**
     * Creates the content for the AlwaysEditableField building block.
     * @param preparedProperties The prepared properties for the AlwaysEditableField building block
     * @returns The created content control
     */;
    _proto.createContent = function createContent(preparedProperties) {
      try {
        // Store custom value binding if provided
        if (typeof preparedProperties.value !== "string") {
          this.customValueBinding = preparedProperties.value;
        }

        // Wire event handlers
        preparedProperties.eventHandlers.change = this.handleChange.bind(this);
        preparedProperties.eventHandlers.liveChange = this.handleLiveChange.bind(this);

        // Generate value help ID if needed
        if (preparedProperties.editStyle === "InputWithValueHelp") {
          preparedProperties.valueHelpId = this.getPossibleValueHelpTemplateId(preparedProperties);
        }

        // Create the content using inline template methods
        this.content = EditStyle.getTemplateWithWrapper(preparedProperties);
      } catch (e) {
        if (e instanceof Error) {
          Log.error("Error in createContent of AlwaysEditableField: " + e.message);
        } else {
          Log.error("An unknown error occurred in AlwaysEditableField");
        }
      }
      return this.content;
    };
    return AlwaysEditableField;
  }(MacroAPI), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "value", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "description", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "formatOptions", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "vhIdPrefix", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "change", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "liveChange", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class) || _class);
  _exports = AlwaysEditableField;
  return _exports;
}, false);
//# sourceMappingURL=AlwaysEditableField-dbg.js.map
