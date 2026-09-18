/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/macros/controls/BuildingBlockObjectProperty"], function (ClassSupport, BuildingBlockObjectProperty) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18;
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
   * Definition of an override for the action to be used inside the Table building block.
   * @public
   */
  let ActionOverride = (_dec = defineUI5Class("sap.fe.macros.table.ActionOverride"), _dec2 = implementInterface("sap.fe.macros.table.ITableActionOrGroup"), _dec3 = implementInterface("sap.fe.macros.table.ITableAction"), _dec4 = property({
    type: "string",
    required: true
  }), _dec5 = property({
    type: "string"
  }), _dec6 = property({
    type: "string"
  }), _dec7 = property({
    type: "boolean",
    bindToState: true
  }), _dec8 = property({
    type: "string"
  }), _dec9 = property({
    type: "string"
  }), _dec10 = property({
    type: "string"
  }), _dec11 = property({
    type: "boolean"
  }), _dec12 = property({
    type: "boolean",
    bindToState: true
  }), _dec13 = property({
    type: "boolean"
  }), _dec14 = property({
    type: "string"
  }), _dec15 = property({
    type: "boolean",
    defaultValue: false
  }), _dec16 = property({
    type: "string"
  }), _dec17 = property({
    type: "int"
  }), _dec18 = property({
    type: "int"
  }), _dec19 = property({
    type: "boolean"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_ref) {
    function ActionOverride(settings) {
      var _this;
      _this = _ref.call(this, settings) || this;
      _initializerDefineProperty(_this, "__implements__sap_fe_macros_table_ITableActionOrGroup", _descriptor, _this);
      _initializerDefineProperty(_this, "__implements__sap_fe_macros_table_ITableAction", _descriptor2, _this);
      /**
       * Unique identifier of the action to overridden.
       * @public
       */
      _initializerDefineProperty(_this, "key", _descriptor3, _this);
      /**
       * Reference to the key of another action already displayed in the toolbar to properly place this one
       * @public
       */
      _initializerDefineProperty(_this, "anchor", _descriptor4, _this);
      /**
       * Defines where this action should be placed relative to the defined anchor
       *
       * Allowed values are `Before` and `After`
       * @public
       */
      _initializerDefineProperty(_this, "placement", _descriptor5, _this);
      /**
       * Enables or disables the action
       * @public
       */
      _initializerDefineProperty(_this, "enabled", _descriptor6, _this);
      _initializerDefineProperty(_this, "enabledCallBack", _descriptor7, _this);
      /**
       * Determines the shortcut combination to trigger the action
       * @public
       */
      _initializerDefineProperty(_this, "command", _descriptor8, _this);
      /**
       * Determines whether the action requires selecting one item or multiple items.
       * Allowed values are `single` and `multi`
       * @public
       */
      _initializerDefineProperty(_this, "enableOnSelect", _descriptor9, _this);
      /**
       * Determines if the auto scroll is enabled after executing the action.
       * @public
       */
      _initializerDefineProperty(_this, "enableAutoScroll", _descriptor10, _this);
      /**
       * Determines whether the action is visible.
       * @public
       */
      _initializerDefineProperty(_this, "visible", _descriptor11, _this);
      /**
       * Determines whether there is a navigation after executing the action.
       * @public
       */
      _initializerDefineProperty(_this, "navigateToInstance", _descriptor12, _this);
      /**
       * Determines the function to get the default values of the action.
       * @public
       */
      _initializerDefineProperty(_this, "defaultValuesFunction", _descriptor13, _this);
      /**
       * Displays the AI Icon on the action button.
       * @public
       */
      _initializerDefineProperty(_this, "isAIOperation", _descriptor14, _this);
      /**
       * Defines the priority of the action in the overflow toolbar.
       */
      _initializerDefineProperty(_this, "priority", _descriptor15, _this);
      /**
       * Defines the group of the action in the overflow toolbar.
       */
      _initializerDefineProperty(_this, "group", _descriptor16, _this);
      /**
       * Defines the overflow group of the action in the overflow toolbar.
       * Takes precedence over the group property when defined.
       */
      _initializerDefineProperty(_this, "overflowGroup", _descriptor17, _this);
      /**
       * Disables strict handling for this action.
       * When true, the action does not use strict message handling.
       * @public
       */
      _initializerDefineProperty(_this, "disableStrictHandling", _descriptor18, _this);
      return _this;
    }
    _exports = ActionOverride;
    _inheritsLoose(ActionOverride, _ref);
    return ActionOverride;
  }(BuildingBlockObjectProperty), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_fe_macros_table_ITableActionOrGroup", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_fe_macros_table_ITableAction", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "key", [_dec4], {
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
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "enabled", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "enabledCallBack", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "command", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "enableOnSelect", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "enableAutoScroll", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "navigateToInstance", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "defaultValuesFunction", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "isAIOperation", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "priority", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "group", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "overflowGroup", [_dec18], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "disableStrictHandling", [_dec19], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = ActionOverride;
  return _exports;
}, false);
//# sourceMappingURL=ActionOverride-dbg.js.map
