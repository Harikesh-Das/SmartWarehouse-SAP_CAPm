/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "./BuildingBlockObjectProperty"], function (ClassSupport, BuildingBlockObjectProperty) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Base class for Action building blocks used across different UI areas, such as Table and Chart.
   * Contains common properties shared by all action types.
   * @public
   */
  let BaseAction = (_dec = defineUI5Class("sap.fe.macros.controls.BaseAction"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "any",
    required: true,
    isBindingInfo: true
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "string"
  }), _dec6 = property({
    type: "any",
    isBindingInfo: true
  }), _dec7 = property({
    type: "any",
    isBindingInfo: true
  }), _dec8 = property({
    type: "boolean",
    defaultValue: false
  }), _dec9 = property({
    type: "int"
  }), _dec10 = property({
    type: "int"
  }), _dec11 = property({
    type: "boolean"
  }), _dec12 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockObjectP) {
    function BaseAction() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BuildingBlockObjectP.call(this, ...args) || this;
      /**
       * Unique identifier of the action
       * @public
       */
      _initializerDefineProperty(_this, "key", _descriptor, _this);
      /**
       * The text that is to be displayed for this action
       * @public
       */
      _initializerDefineProperty(_this, "text", _descriptor2, _this);
      /**
       * Reference to the key of another action already displayed in the toolbar to properly place this one
       * @public
       */
      _initializerDefineProperty(_this, "anchor", _descriptor3, _this);
      /**
       * Defines where this action is placed relative to the defined anchor
       *
       * Allowed values are `Before` and `After`
       * @public
       */
      _initializerDefineProperty(_this, "placement", _descriptor4, _this);
      /**
       * Enables or disables the action
       * @public
       */
      _initializerDefineProperty(_this, "enabled", _descriptor5, _this);
      /**
       * Determines whether the action is visible.
       * @public
       */
      _initializerDefineProperty(_this, "visible", _descriptor6, _this);
      /**
       * Displays the AI Icon on the action button.
       * @public
       */
      _initializerDefineProperty(_this, "isAIOperation", _descriptor7, _this);
      /**
       * Defines the group of the action in the overflow toolbar.
       * @public
       */
      _initializerDefineProperty(_this, "group", _descriptor8, _this);
      /**
       * Defines the overflow group of the action in the overflow toolbar.
       * Takes precedence over the group property when defined.
       * @public
       */
      _initializerDefineProperty(_this, "overflowGroup", _descriptor9, _this);
      /**
       * Defines if the action requires a selection.
       * @public
       */
      _initializerDefineProperty(_this, "requiresSelection", _descriptor10, _this);
      /**
       * Defines the priority of the action in the overflow toolbar.
       * @public
       */
      _initializerDefineProperty(_this, "priority", _descriptor11, _this);
      return _this;
    }
    _exports = BaseAction;
    _inheritsLoose(BaseAction, _BuildingBlockObjectP);
    return BaseAction;
  }(BuildingBlockObjectProperty), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "key", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "text", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "anchor", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "placement", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "enabled", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "isAIOperation", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "group", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "overflowGroup", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "requiresSelection", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "priority", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = BaseAction;
  return _exports;
}, false);
//# sourceMappingURL=BaseAction-dbg.js.map
