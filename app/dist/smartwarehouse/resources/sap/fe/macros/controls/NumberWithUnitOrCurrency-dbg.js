/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BuildingBlockBase", "sap/fe/base/ClassSupport", "sap/m/HBox", "sap/m/Text", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (BuildingBlockBase, ClassSupport, HBox, Text, _jsx, _jsxs) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _descriptor3;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let NumberWithUnitOrCurrency = (_dec = defineUI5Class("sap.fe.macros.controls.NumberWithUnitOrCurrency"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "string",
    group: "Data",
    bindToState: true
  }), _dec4 = property({
    type: "string",
    group: "Data",
    bindToState: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    function NumberWithUnitOrCurrency(propertiesOrId, properties) {
      var _this;
      _this = _BuildingBlockBase.call(this, propertiesOrId, properties) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      _initializerDefineProperty(_this, "number", _descriptor2, _this);
      _initializerDefineProperty(_this, "unitOrCurrency", _descriptor3, _this);
      _this.state.visible = _this.shouldBeVisible(_this.state.number);
      _this.content = _this.createContent();
      return _this;
    }
    _exports = NumberWithUnitOrCurrency;
    _inheritsLoose(NumberWithUnitOrCurrency, _BuildingBlockBase);
    var _proto = NumberWithUnitOrCurrency.prototype;
    _proto.onStateChange = function onStateChange(changedKeys) {
      if (changedKeys?.includes("number")) {
        this.state.visible = this.shouldBeVisible(this.state.number);
      }
    };
    _proto.shouldBeVisible = function shouldBeVisible(value) {
      return typeof value === "string" && value.trim() !== "" || typeof value === "number" && value !== 0;
    };
    _proto.createContent = function createContent() {
      return _jsxs(HBox, {
        renderType: "Bare",
        justifyContent: "End",
        class: "sapFeControlsUnitCurrencyHbox",
        visible: this.bindState("visible"),
        children: [_jsx(Text, {
          textDirection: "LTR",
          wrapping: "false",
          textAlign: "End",
          text: this.bindState("number")
        }), _jsx(Text, {
          textDirection: "LTR",
          wrapping: "false",
          textAlign: "End",
          text: this.bindState("unitOrCurrency"),
          width: "3.3em"
        })]
      });
    };
    return NumberWithUnitOrCurrency;
  }(BuildingBlockBase), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "number", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "unitOrCurrency", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = NumberWithUnitOrCurrency;
  return _exports;
}, false);
//# sourceMappingURL=NumberWithUnitOrCurrency-dbg.js.map
