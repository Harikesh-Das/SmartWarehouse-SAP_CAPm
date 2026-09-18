/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/macros/controls/BuildingBlockObjectProperty"], function (ClassSupport, BuildingBlockObjectProperty) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17;
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
   * Definition of a custom column to be used inside the table.
   *
   * The template for the column must be provided as the default aggregation
   * @public
   */
  let Column = (_dec = defineUI5Class("sap.fe.macros.table.Column"), _dec2 = implementInterface("sap.fe.macros.table.ITableColumn"), _dec3 = property({
    type: "string",
    required: true
  }), _dec4 = property({
    type: "string",
    required: true,
    isBindingInfo: true
  }), _dec5 = property({
    type: "string"
  }), _dec6 = property({
    type: "string"
  }), _dec7 = property({
    type: "string"
  }), _dec8 = property({
    type: "boolean"
  }), _dec9 = property({
    type: "string"
  }), _dec10 = property({
    type: "string"
  }), _dec11 = property({
    type: "string[]"
  }), _dec12 = property({
    type: "string",
    isBindingInfo: true
  }), _dec13 = property({
    type: "string"
  }), _dec14 = property({
    type: "boolean"
  }), _dec15 = aggregation({
    type: "sap.ui.core.Control",
    isDefault: true
  }), _dec16 = aggregation({
    type: "sap.fe.macros.table.ColumnExportSettings"
  }), _dec17 = aggregation({
    type: "sap.fe.macros.table.ColumnAINotice",
    altTypes: ["string"]
  }), _dec18 = property({
    type: "boolean"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockObjectP) {
    function Column(id, settings) {
      var _this;
      _this = _BuildingBlockObjectP.call(this, id, settings) || this;
      _initializerDefineProperty(_this, "__implements__sap_fe_macros_table_ITableColumn", _descriptor, _this);
      /**
       * Unique identifier of the column
       * @public
       */
      _initializerDefineProperty(_this, "key", _descriptor2, _this);
      /**
       * The text that will be displayed for this column header
       * @public
       */
      _initializerDefineProperty(_this, "header", _descriptor3, _this);
      /**
       * Determines the column's width.
       *
       * Allowed values are 'auto', 'value', and 'inherit', according to {@link sap.ui.core.CSSSize}
       * @public
       */
      _initializerDefineProperty(_this, "width", _descriptor4, _this);
      /**
       * Defines the column importance.
       *
       * You can define which columns should be automatically moved to the pop-in area based on their importance
       * @public
       */
      _initializerDefineProperty(_this, "importance", _descriptor5, _this);
      /**
       * Aligns the header as well as the content horizontally
       * @public
       */
      _initializerDefineProperty(_this, "horizontalAlign", _descriptor6, _this);
      /**
       * Indicates if the column header should be a part of the width calculation.
       * @public
       */
      _initializerDefineProperty(_this, "widthIncludingColumnHeader", _descriptor7, _this);
      /**
       * Reference to the key of another column already displayed in the table to properly place this one
       * @public
       */
      _initializerDefineProperty(_this, "anchor", _descriptor8, _this);
      /**
       * Determines where this column should be placed relative to the defined anchor
       *
       * Allowed values are `Before` and `After`
       * @public
       */
      _initializerDefineProperty(_this, "placement", _descriptor9, _this);
      /**
       * Determines the properties displayed in the column
       *
       * The properties allow to export, sort, group, copy, and paste in the column
       * @public
       */
      _initializerDefineProperty(_this, "properties", _descriptor10, _this);
      /**
       * Determines the text displayed for the column tooltip
       * @public
       */
      _initializerDefineProperty(_this, "tooltip", _descriptor11, _this);
      /**
       * The column availability
       *
       * Allowed values are `Default`, `Adaptation`, `Hidden`
       * @public
       */
      _initializerDefineProperty(_this, "availability", _descriptor12, _this);
      /**
       * Determines if the information in the column is required.
       * @public
       */
      _initializerDefineProperty(_this, "required", _descriptor13, _this);
      /**
       * The content of the column
       */
      _initializerDefineProperty(_this, "template", _descriptor14, _this);
      /**
       * Determines the export settings for the column.
       * @public
       */
      _initializerDefineProperty(_this, "exportSettings", _descriptor15, _this);
      /**
       * Determines the AI notice for the column.
       * The AI notice is used to display information related to AI features. This information is rendered as an icon in the column header.
       * @public
       */
      _initializerDefineProperty(_this, "aiNotice", _descriptor16, _this);
      /**
       * Determines if the column should be excluded from the export.
       * @public
       */
      _initializerDefineProperty(_this, "disableExport", _descriptor17, _this);
      return _this;
    }
    _exports = Column;
    _inheritsLoose(Column, _BuildingBlockObjectP);
    var _proto = Column.prototype;
    /**
     * Sets the text displayed for the column tooltip
     * By default, the tooltip is set as an aggregation by the Element, so this setter allows you to override it.
     * @param tooltip The tooltip text
     * @returns The Column instance itself for method chaining
     */
    _proto.setTooltip = function setTooltip(tooltip) {
      this.setProperty("tooltip", tooltip);
      return this;
    };
    _proto.init = function init() {
      _BuildingBlockObjectP.prototype.init.call(this);
      // Don't propagate the table binding context to the column template, as the correct binding context is the row context which is set by the table itself.
      // mSkipPropagation isn't publicaly exposed but it's already used in sap.mdc.table.
      this.mSkipPropagation = {
        template: true
      };
      return;
    };
    return Column;
  }(BuildingBlockObjectProperty), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_fe_macros_table_ITableColumn", [_dec2], {
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
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "header", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "width", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "importance", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "horizontalAlign", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "widthIncludingColumnHeader", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "anchor", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "placement", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "properties", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "tooltip", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "availability", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "required", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "template", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "exportSettings", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "aiNotice", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "disableExport", [_dec18], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = Column;
  return _exports;
}, false);
//# sourceMappingURL=Column-dbg.js.map
