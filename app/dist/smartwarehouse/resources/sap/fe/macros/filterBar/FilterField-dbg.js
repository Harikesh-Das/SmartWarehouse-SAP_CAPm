/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/macros/controls/BuildingBlockObjectProperty", "sap/ui/base/DataType"], function (ClassSupport, BuildingBlockObjectProperty, DataType) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12;
  var _exports = {};
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Definition of a custom filter to be used inside the FilterBar.
   *
   * The template for the FilterField has to be provided as the default aggregation
   *
   *
   * {@link demo:sap/fe/core/fpmExplorer/index.html#/buildingBlocks/filterBar/filterBarCustoms Overview of Building Blocks}
   * @public
   */
  let FilterField = (_dec = defineUI5Class("sap.fe.macros.filterBar.FilterField"), _dec2 = implementInterface("sap.fe.macros.filterBar.IFilterField"), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "string"
  }), _dec6 = property({
    type: "string"
  }), _dec7 = property({
    type: "string"
  }), _dec8 = property({
    type: "string"
  }), _dec9 = property({
    type: "string"
  }), _dec10 = property({
    type: "boolean"
  }), _dec11 = property({
    type: "boolean"
  }), _dec12 = property({
    type: "string"
  }), _dec13 = aggregation({
    type: "sap.ui.core.Control",
    multiple: false,
    isDefault: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockObjectP) {
    function FilterField(id, settings) {
      var _this;
      // Handle 'property' being passed in constructor args to avoid conflict with UI5's getProperty/setProperty
      const resolvedSettings = typeof id === "object" ? id : settings;
      if (resolvedSettings && "property" in resolvedSettings) {
        resolvedSettings.internalProperty = resolvedSettings.property;
        delete resolvedSettings.property;
      }
      _this = _BuildingBlockObjectP.call(this, id, settings) || this;
      _initializerDefineProperty(_this, "__implements__sap_fe_macros_filterBar_IFilterField", _descriptor, _this);
      /**
       * The property name of the FilterField
       * @public
       */
      _initializerDefineProperty(_this, "key", _descriptor2, _this);
      /**
       * The text that will be displayed for this FilterField
       * @public
       */
      _initializerDefineProperty(_this, "label", _descriptor3, _this);
      /**
       * Reference to the key of another filter already displayed in the table to properly place this one
       * @public
       */
      _initializerDefineProperty(_this, "anchor", _descriptor4, _this);
      /**
       * Defines where this filter should be placed relative to the defined anchor
       *
       * Allowed values are `Before` and `After`
       * @public
       */
      _initializerDefineProperty(_this, "placement", _descriptor5, _this);
      /**
       * Defines which property are influenced by the FilterField.
       *
       * This must be a valid property of the entity as this can be used for SAP Companion integration
       * @public
       */
      _initializerDefineProperty(_this, "property", _descriptor6, _this);
      /**
       * Internal storage for the 'property' value to avoid conflicts with SAPUI5's getProperty and setProperty APIs
       * @private
       */
      _initializerDefineProperty(_this, "internalProperty", _descriptor7, _this);
      /**
       * The filter field availability.
       *
       * Allowed values are `Default`, `Adaptation`, and `Hidden`
       * @public
       */
      _initializerDefineProperty(_this, "availability", _descriptor8, _this);
      /**
       * This property is not required at filter field level. To achieve the desired behavior, specify the showMessages property in the FilterBar building block.
       * @public
       * @deprecatedsince 1.135
       * @deprecated
       */
      _initializerDefineProperty(_this, "showMessages", _descriptor9, _this);
      /**
       * If set, the FilterField will be marked as a mandatory field.
       * @public
       */
      _initializerDefineProperty(_this, "required", _descriptor10, _this);
      _initializerDefineProperty(_this, "slotName", _descriptor11, _this);
      _initializerDefineProperty(_this, "template", _descriptor12, _this);
      return _this;
    }

    /**
     * Override getProperty to return internalProperty when 'property' is requested.
     * This maintains backward compatibility with code that expects 'property' to be accessible.
     * @param sPropertyName The name of the property to get
     * @returns The property value or internalProperty if 'property' is requested
     */
    _exports = FilterField;
    _inheritsLoose(FilterField, _BuildingBlockObjectP);
    var _proto = FilterField.prototype;
    _proto.getProperty = function getProperty(sPropertyName) {
      if (sPropertyName === "property") {
        return _BuildingBlockObjectP.prototype.getProperty.call(this, "internalProperty");
      }
      return _BuildingBlockObjectP.prototype.getProperty.call(this, sPropertyName);
    }

    /**
     * Override setProperty to set internalProperty when 'property' is set.
     * This maintains backward compatibility with code that expects 'property' to be settable.
     * @param sPropertyName The name of the property to set
     * @param vValue The value to set
     * @param bSuppressInvalidate Whether to suppress invalidation
     * @returns This instance for chaining
     */;
    _proto.setProperty = function setProperty(sPropertyName, vValue, bSuppressInvalidate) {
      if (sPropertyName === "property") {
        return _BuildingBlockObjectP.prototype.setProperty.call(this, "internalProperty", vValue, bSuppressInvalidate);
      }
      return _BuildingBlockObjectP.prototype.setProperty.call(this, sPropertyName, vValue, bSuppressInvalidate);
    };
    return FilterField;
  }(BuildingBlockObjectProperty), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_fe_macros_filterBar_IFilterField", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "key", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "label", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "anchor", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "placement", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "property", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "internalProperty", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "availability", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "showMessages", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "required", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "slotName", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "template", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  DataType.registerEnum("sap.fe.macros.filterBar.FilterField", FilterField);
  _exports = FilterField;
  return _exports;
}, false);
//# sourceMappingURL=FilterField-dbg.js.map
