/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/m/HBox"], function (ClassSupport, HBox) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var association = ClassSupport.association;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let CollaborationHBox = (_dec = defineUI5Class("sap.fe.macros.controls.CollaborationHBox"), _dec2 = association({
    type: "sap.ui.core.Control",
    multiple: true,
    singularName: "ariaLabelledBy"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_HBox) {
    function CollaborationHBox() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _HBox.call(this, ...args) || this;
      /**
       * Association to controls / IDs that label this control (see WAI-ARIA attribute aria-labelledby).
       */
      _initializerDefineProperty(_this, "ariaLabelledBy", _descriptor, _this);
      return _this;
    }
    _inheritsLoose(CollaborationHBox, _HBox);
    var _proto = CollaborationHBox.prototype;
    _proto.enhanceAccessibilityState = function enhanceAccessibilityState(_oElement, mAriaProps) {
      const oParent = this.getParent();
      if (oParent && oParent.enhanceAccessibilityState) {
        // forward  enhanceAccessibilityState call to the parent
        oParent.enhanceAccessibilityState(_oElement, mAriaProps);
      }
      return mAriaProps;
    };
    _proto.setAriaLabelledBy = function setAriaLabelledBy(content) {
      if (content && content.addAriaLabelledBy && content.getAriaLabelledBy) {
        const ariaLabelledByIds = this.ariaLabelledBy;
        for (const id of ariaLabelledByIds) {
          const existingIds = content.getAriaLabelledBy() ?? [];
          if (!existingIds.includes(id)) {
            content.addAriaLabelledBy(id);
          }
        }
      }
    };
    _proto.onBeforeRendering = function onBeforeRendering() {
      // before calling the renderer, parent control may have set ariaLabelledBy
      // we ensure it is passed to the inner controls (items)
      const items = this.getItems();
      for (const item of items) {
        this.setAriaLabelledBy(item);
      }
    };
    return CollaborationHBox;
  }(HBox), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "ariaLabelledBy", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return CollaborationHBox;
}, false);
//# sourceMappingURL=CollaborationHBox-dbg.js.map
