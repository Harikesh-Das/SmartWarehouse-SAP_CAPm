/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/ui/core/Element"], function (ClassSupport, UI5Element) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var _exports = {};
  var property = ClassSupport.property;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * A callback function that is called when the value of the watched property changes.
   * @param value The new value of the watched property
   * @param oldValue The old value of the watched property
   * @param isInitial Whether the value change is the initial value
   * @param context The binding context of the watched property
   * @typedef
   * @public
   */
  /**
   * The DataWatcher is an element you can use to watch a property binding and get notified when the value changes.
   *
   */
  let DataWatcher = (_dec = defineUI5Class("sap.fe.core.controls.DataWatcher"), _dec2 = property({
    type: "any"
  }), _dec3 = event(), _dec(_class = (_class2 = /*#__PURE__*/function (_UI5Element) {
    function DataWatcher(idOrProps, props, scope) {
      var _this;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      _this = _UI5Element.call(this, idOrProps, props, scope) || this; // need to pass scope here
      _initializerDefineProperty(_this, "propertyBinding", _descriptor, _this);
      _initializerDefineProperty(_this, "valueChanged", _descriptor2, _this);
      _this.isInitial = true;
      _this.isSingleton = ((typeof idOrProps !== "string" ? idOrProps : props)?.propertyBinding).startsWith("{/");
      return _this;
    }
    _exports = DataWatcher;
    _inheritsLoose(DataWatcher, _UI5Element);
    var _proto = DataWatcher.prototype;
    _proto.setPropertyBinding = function setPropertyBinding(propertyBinding) {
      const oldValue = this.getProperty("propertyBinding");
      // for singleton it doesn't matter if the context of the view changes
      if (this.isInitial || !this.isSingleton && this._previousContextPath !== this.getBindingContext()?.getPath()) {
        this.isInitial = false;
        this._initialValue = propertyBinding;
        this._previousContextPath = this.getBindingContext()?.getPath();
      }
      const bindingInfo = this.getBindingInfo("propertyBinding");
      const binding = bindingInfo?.binding;
      this.isInitial = false;
      if (binding?.isA("sap.ui.model.CompositeBinding")) {
        binding.getBindings().forEach(b => {
          if (b.bInitial) {
            this.isInitial = true;
          }
        });
      } else if (binding?.bInitial) {
        this.isInitial = true;
      }
      _UI5Element.prototype.setProperty.call(this, "propertyBinding", propertyBinding, true);
      this.fireEvent("valueChanged", {
        value: propertyBinding,
        oldValue: oldValue,
        isInitial: propertyBinding === this._initialValue,
        isBindingInitial: this.isInitial,
        context: this.getBindingContext()
      });
    };
    return DataWatcher;
  }(UI5Element), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "propertyBinding", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "valueChanged", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = DataWatcher;
  return _exports;
}, false);
//# sourceMappingURL=DataWatcher-dbg.js.map
