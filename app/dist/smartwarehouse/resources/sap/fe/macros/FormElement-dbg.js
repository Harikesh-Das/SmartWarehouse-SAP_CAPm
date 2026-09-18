/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/converters/MetaModelConverter", "sap/fe/macros/Field", "sap/ui/core/Component", "sap/ui/layout/form/FormElement"], function (Log, ClassSupport, MetaModelConverter, Field, Component, FormElement) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block used to create a form element based on the metadata provided by OData V4.
   * @public
   * @since 1.90.0
   */
  let FormElementControl = (_dec = defineUI5Class("sap.fe.macros.FormElement"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "boolean",
    defaultValue: true
  }), _dec6 = aggregation({
    type: "sap.ui.core.Control",
    multiple: true,
    singularName: "field"
  }), _dec7 = property({
    type: "string"
  }), _dec8 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_FormElement) {
    /**
     * Constructor for the FormElementControl.
     * Adds a default Field if no fields are provided and attaches a handler for model context changes.
     * @param properties Initial settings for the new control
     * @param others Additional settings
     */
    function FormElementControl(properties, others) {
      var _this;
      _this = _FormElement.call(this, properties, others) || this;
      /**
       * Defines the path of the context used in the current page or block.
       * This setting is defined by the framework.
       * @public
       */
      _initializerDefineProperty(_this, "contextPath", _descriptor, _this);
      /**
       * Defines the relative path of the property in the metamodel, based on the current contextPath.
       * @public
       */
      _initializerDefineProperty(_this, "metaPath", _descriptor2, _this);
      /**
       * Label shown for the field. If not set, the label from the annotations will be shown.
       * @public
       */
      _initializerDefineProperty(_this, "label", _descriptor3, _this);
      /**
       * If set to false, the FormElement is not rendered.
       * @public
       */
      _initializerDefineProperty(_this, "visible", _descriptor4, _this);
      /**
       * Optional aggregation of controls that should be displayed inside the FormElement.
       * If not set, a default Field building block will be rendered
       * @public
       */
      _initializerDefineProperty(_this, "fields", _descriptor5, _this);
      /**
       * Reference to the key of another column already displayed in the table to properly place this one
       * @public
       */
      _initializerDefineProperty(_this, "anchor", _descriptor6, _this);
      /**
       * Determines where this column should be placed relative to the defined anchor
       *
       * Allowed values are `Before` and `After`
       * @public
       */
      _initializerDefineProperty(_this, "placement", _descriptor7, _this);
      _this.ensureDefaultField();
      _this.attachModelContextChange(_this.onModelContextChange.bind(_this));
      return _this;
    }

    /**
     * Ensures that a default Field is created and added to the aggregation if no fields are provided.
     * @private
     */
    _exports = FormElementControl;
    _inheritsLoose(FormElementControl, _FormElement);
    var _proto = FormElementControl.prototype;
    _proto.ensureDefaultField = function ensureDefaultField() {
      if (!this.fields || this.fields.length === 0) {
        const field = new Field({
          metaPath: this.metaPath,
          contextPath: this.contextPath,
          id: this.getId() + "--FormElementField"
        });
        this.addField(field);
      }
    }

    /**
     * Handles model context changes to update the label from OData annotations if not set explicitly.
     * @param evt The model context change event
     * @private
     */;
    _proto.onModelContextChange = function onModelContextChange(evt) {
      const source = evt.getSource();
      const owner = Component.getOwnerComponentFor(source);
      const metaModel = owner?.getMetaModel();
      const contextPath = source.contextPath ? source.contextPath + "/" : owner?.getFullContextPath();
      const metaPathContext = metaModel?.createBindingContext(contextPath + source.metaPath);
      let oContextObjectPath;
      try {
        oContextObjectPath = MetaModelConverter.getInvolvedDataModelObjects(metaPathContext);
      } catch (error) {
        Log.error(`Error while getting the involved data model objects: ${error}`);
      }
      if (oContextObjectPath && !oContextObjectPath.targetObject) {
        Log.error(`No target object found for the given path ${source.metaPath} on the FormElement`);
      } else {
        // Only set label from metadata annotations if no label is currently set.
        // This prevents overwriting i18n-resolved labels with unresolved keys.
        const annotationLabel = oContextObjectPath?.targetObject?.annotations.Common?.Label?.toString(),
          currentLabel = source.getLabel();
        if ((currentLabel === null || currentLabel === undefined) && annotationLabel) {
          source.setLabel(annotationLabel);
        }
      }
    };
    return FormElementControl;
  }(FormElement), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "label", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "fields", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "anchor", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "placement", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = FormElementControl;
  return _exports;
}, false);
//# sourceMappingURL=FormElement-dbg.js.map
