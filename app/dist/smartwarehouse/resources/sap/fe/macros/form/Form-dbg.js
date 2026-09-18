/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/macros/Form"], function (ClassSupport, FormBlock) {
  "use strict";

  var _dec, _dec2, _class, _class2;
  var _exports = {};
  var xmlEventHandler = ClassSupport.xmlEventHandler;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  /**
   * This class represents a Form building block that can be used in SAP Fiori elements applications through dynamic instantiation.
   * It's not intended to be used directly in applications, but rather as a part of the SAP Fiori elements framework.
   */
  let Form = (_dec = defineUI5Class("sap.fe.macros.form.Form"), _dec2 = xmlEventHandler(), _dec(_class = (_class2 = /*#__PURE__*/function (_FormBlock) {
    function Form(props, others) {
      return _FormBlock.call(this, props, others) || this;
    }
    _exports = Form;
    _inheritsLoose(Form, _FormBlock);
    var _proto = Form.prototype;
    _proto._fireEvent = function _fireEvent(ui5Event, _controller, eventId) {
      this.fireEvent(eventId, ui5Event.getParameters());
    }

    /**
     * Sets the path to the metadata that should be used to generate the table.
     * @param metaPath The path to the metadata
     * @returns Reference to this in order to allow method chaining
     */;
    _proto.setMetaPath = function setMetaPath(metaPath) {
      return this.setProperty("metaPath", metaPath);
    }

    /**
     * Gets the path to the metadata that should be used to generate the table.
     * @returns The path to the metadata
     */;
    _proto.getMetaPath = function getMetaPath() {
      return this.getProperty("metaPath");
    };
    return Form;
  }(FormBlock), _applyDecoratedDescriptor(_class2.prototype, "_fireEvent", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "_fireEvent"), _class2.prototype), _class2)) || _class);
  _exports = Form;
  return _exports;
}, false);
//# sourceMappingURL=Form-dbg.js.map
