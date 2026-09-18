/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/macros/FilterBar"], function (ClassSupport, FilterBarAPI) {
  "use strict";

  var _dec, _class;
  var _exports = {};
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * Usage example:
   * <pre>
   * sap.ui.require(["sap/fe/macros/filterBar/FilterBar"], function(FilterBar) {
   * 	 ...
   * 	 new FilterBar("MyFilterBar", {metaPath:"@com.sap.vocabularies.UI.v1.SelectionFields"})
   * })
   * </pre>
   *
   * This is an experimental API because the structure of the generated content has changed to be closer to the FilterBar that you get from the templates.
   * The public method and property has not changed but the internal structure has changed so be careful on your usage.
   * @public
   * @deprecatedsince 1.147
   * @deprecated Use {@link sap.fe.macros.FilterBar} instead
   * @mixes sap.fe.macros.FilterBar
   */
  let FilterBar = (_dec = defineUI5Class("sap.fe.macros.filterBar.FilterBar", {
    returnTypes: ["sap.fe.macros.MacroAPI"]
  }), _dec(_class = /*#__PURE__*/function (_FilterBarAPI) {
    function FilterBar(mSettings) {
      for (var _len = arguments.length, others = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        others[_key - 1] = arguments[_key];
      }
      return _FilterBarAPI.call(this, mSettings, ...others) || this;
    }
    _exports = FilterBar;
    _inheritsLoose(FilterBar, _FilterBarAPI);
    return FilterBar;
  }(FilterBarAPI)) || _class);
  _exports = FilterBar;
  return _exports;
}, false);
//# sourceMappingURL=FilterBar-dbg.js.map
