/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "../controls/BuildingBlockObjectProperty"], function (ClassSupport, BuildingBlockObjectProperty) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Configuration options for the Form layout
   *
   * @public
   */
  let FormLayoutOptions = (_dec = defineUI5Class("sap.fe.macros.form.FormLayoutOptions"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "int"
  }), _dec4 = property({
    type: "int"
  }), _dec5 = property({
    type: "int"
  }), _dec6 = property({
    type: "int"
  }), _dec7 = property({
    type: "int"
  }), _dec8 = property({
    type: "boolean"
  }), _dec9 = property({
    type: "int"
  }), _dec10 = property({
    type: "int"
  }), _dec11 = property({
    type: "int"
  }), _dec12 = property({
    type: "int"
  }), _dec13 = property({
    type: "int"
  }), _dec14 = property({
    type: "int"
  }), _dec15 = property({
    type: "int"
  }), _dec16 = property({
    type: "int"
  }), _dec17 = property({
    type: "int"
  }), _dec18 = property({
    type: "int"
  }), _dec19 = property({
    type: "int"
  }), _dec20 = property({
    type: "boolean"
  }), _dec21 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockObjectP) {
    function FormLayoutOptions(props, others) {
      var _this;
      _this = _BuildingBlockObjectP.call(this, props, others) || this;
      /**
       * The layout type to be used for the form
       * @public
       */
      _initializerDefineProperty(_this, "type", _descriptor, _this);
      /**
       * Number of columns for M size
       *
       * Applicable for ColumnLayout type
       * @public
       */
      _initializerDefineProperty(_this, "columnsM", _descriptor2, _this);
      /**
       * Number of columns for L size
       *
       * Applicable for ColumnLayout type
       * @public
       */
      _initializerDefineProperty(_this, "columnsL", _descriptor3, _this);
      /**
       * Number of columns for XL size
       *
       * Applicable for ColumnLayout type
       * @public
       */
      _initializerDefineProperty(_this, "columnsXL", _descriptor4, _this);
      /**
       * Number of grid cells that are reserved for the labels in large screen size
       *
       * Applicable for ColumnLayout type
       * @public
       */
      _initializerDefineProperty(_this, "labelCellsLarge", _descriptor5, _this);
      /**
       * Number of grid cells that are empty at the end of a row in large screen size
       *
       * Applicable for ColumnLayout type
       * @public
       */
      _initializerDefineProperty(_this, "emptyCellsLarge", _descriptor6, _this);
      /**
       * If set, the usage of `labelSpanL` and `labelSpanXL` is dependent on the size of the used column.
       * If the space is less than 600px (e.g., 2 columns are used), `labelSpanM` is used instead.
       *
       * Applicable for ResponsiveGridLayout type
       * @public
       */
      _initializerDefineProperty(_this, "adjustLabelSpan", _descriptor7, _this);
      /**
       * The breakpoint (in pixels) between M size and L size for the ResponsiveGridLayout
       *
       * Applicable for ResponsiveGridLayout type
       * @public
       */
      _initializerDefineProperty(_this, "breakpointM", _descriptor8, _this);
      /**
       * The breakpoint (in pixels) between L size and XL size for the ResponsiveGridLayout
       *
       * Applicable for ResponsiveGridLayout type
       * @public
       */
      _initializerDefineProperty(_this, "breakpointL", _descriptor9, _this);
      /**
       * The breakpoint (in pixels) between XL size and XXL size for the ResponsiveGridLayout
       *
       * Applicable for ResponsiveGridLayout type
       * @public
       */
      _initializerDefineProperty(_this, "breakpointXL", _descriptor10, _this);
      /**
       * Number of grid cells that are used for the labels in S size
       *
       * Applicable for ResponsiveGridLayout type
       * @public
       */
      _initializerDefineProperty(_this, "labelSpanS", _descriptor11, _this);
      /**
       * Number of grid cells that are used for the labels in M size
       *
       * Applicable for ResponsiveGridLayout type
       * @public
       */
      _initializerDefineProperty(_this, "labelSpanM", _descriptor12, _this);
      /**
       * Number of grid cells that are used for the labels in L size
       *
       * Applicable for ResponsiveGridLayout type
       * @public
       */
      _initializerDefineProperty(_this, "labelSpanL", _descriptor13, _this);
      /**
       * Number of grid cells that are used for the labels in XL size
       *
       * Applicable for ResponsiveGridLayout type
       * @public
       */
      _initializerDefineProperty(_this, "labelSpanXL", _descriptor14, _this);
      /**
       * Number of empty grid cells that are added on the end of each line in S size
       *
       * Applicable for ResponsiveGridLayout type
       * @public
       */
      _initializerDefineProperty(_this, "emptySpanS", _descriptor15, _this);
      /**
       * Number of empty grid cells that are added on the end of each line in M size
       *
       * Applicable for ResponsiveGridLayout type
       * @public
       */
      _initializerDefineProperty(_this, "emptySpanM", _descriptor16, _this);
      /**
       * Number of empty grid cells that are added on the end of each line in L size
       *
       * Applicable for ResponsiveGridLayout type
       * @public
       */
      _initializerDefineProperty(_this, "emptySpanL", _descriptor17, _this);
      /**
       * Number of empty grid cells that are added on the end of each line in XL size
       *
       * Applicable for ResponsiveGridLayout type
       * @public
       */
      _initializerDefineProperty(_this, "emptySpanXL", _descriptor18, _this);
      /**
       * If set, a single container has the full size of the parent container.
       * Otherwise, the container size is determined by the number of columns and the spacing between the columns.
       *
       * Applicable for ResponsiveGridLayout type
       * @public
       */
      _initializerDefineProperty(_this, "singleContainerFullSize", _descriptor19, _this);
      /**
       * Defines the background color of the form
       * @public
       */
      _initializerDefineProperty(_this, "backgroundDesign", _descriptor20, _this);
      return _this;
    }
    _exports = FormLayoutOptions;
    _inheritsLoose(FormLayoutOptions, _BuildingBlockObjectP);
    var _proto = FormLayoutOptions.prototype;
    // Override getProperty to return undefined for NaN values, as NaN is not a valid value for the properties and can cause issues in the UI5 controls
    _proto.getProperty = function getProperty(name) {
      const value = _BuildingBlockObjectP.prototype.getProperty.call(this, name);
      return typeof value === "number" && isNaN(value) ? undefined : value;
    };
    return FormLayoutOptions;
  }(BuildingBlockObjectProperty), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "type", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "columnsM", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "columnsL", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "columnsXL", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "labelCellsLarge", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "emptyCellsLarge", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "adjustLabelSpan", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "breakpointM", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "breakpointL", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "breakpointXL", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "labelSpanS", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "labelSpanM", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "labelSpanL", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "labelSpanXL", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "emptySpanS", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "emptySpanM", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "emptySpanL", [_dec18], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "emptySpanXL", [_dec19], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "singleContainerFullSize", [_dec20], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "backgroundDesign", [_dec21], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = FormLayoutOptions;
  return _exports;
}, false);
//# sourceMappingURL=FormLayoutOptions-dbg.js.map
