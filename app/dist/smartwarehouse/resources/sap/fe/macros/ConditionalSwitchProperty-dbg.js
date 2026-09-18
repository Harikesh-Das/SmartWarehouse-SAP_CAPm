/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/ui/core/Element"], function (ClassSupport, UI5Element) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _descriptor3;
  var property = ClassSupport.property;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Defines a property with a key and a value that can be used in conditional templates.
   * When the value is changed, a `valueChanged` event is fired.
   * @since 1.141.0
   * @public
   */
  let ConditionalSwitchProperty = (_dec = defineUI5Class("sap.fe.macros.ConditionalSwitchProperty"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "any"
  }), _dec4 = event(), _dec(_class = (_class2 = /*#__PURE__*/function (_UI5Element) {
    function ConditionalSwitchProperty(idOrSettings, settings, scope) {
      var _this;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      _this = _UI5Element.call(this, idOrSettings, settings, scope) || this;
      /**
       * The key of the property.
       * @public
       */
      _initializerDefineProperty(_this, "key", _descriptor, _this);
      /**
       * The value of the property.
       * @public
       */
      _initializerDefineProperty(_this, "value", _descriptor2, _this);
      /**
       * Event fired when the value of the property is changed.
       * This is used internally by the `ConditionalTemplate` control to react to changes in the property value.
       * @public
       */
      _initializerDefineProperty(_this, "valueChanged", _descriptor3, _this);
      return _this;
    }
    _inheritsLoose(ConditionalSwitchProperty, _UI5Element);
    var _proto = ConditionalSwitchProperty.prototype;
    _proto.setValue = function setValue(value) {
      this.setProperty("value", value);
      this.fireEvent("valueChanged");
    };
    return ConditionalSwitchProperty;
  }(UI5Element), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "key", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "value", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "valueChanged", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return ConditionalSwitchProperty;
}, false);
//# sourceMappingURL=ConditionalSwitchProperty-dbg.js.map
