/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/ui/model/odata/type/Currency"], function (ClassSupport, CurrencyType) {
  "use strict";

  var _dec, _class;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  const MINIMUM_CURRENCY_DECIMALS = 2;
  const MAXIMUM_CURRENCY_DECIMALS = 5;

  /**
   * Extension of the OData Currency type that computes decimalPadding dynamically from the currency
   * codelist (aValues[2]) the first time formatValue is called with the codelist available.
   * This ensures the padding is always the maximum UnitSpecificScale across all currencies
   * without requiring an upfront async codelist fetch.
   *
   * This type is only used for display bindings where decimal alignment is required.
   * Edit-mode type instances created by MDC use the base Currency type via FETypeMap.
   *
   * When a static decimalPadding is passed in the constructor (via a manifest override), that value
   * is respected and no dynamic computation takes place.
   *
   * Fallback behaviour when the codelist is unavailable (null, empty object) or contains currencies
   * whose scale exceeds the maximum: decimalPadding is capped at MAXIMUM_CURRENCY_DECIMALS (5).
   * While aValues[2] is still undefined (binding not yet resolved), the computation is deferred to
   * the next formatValue call.
   */
  let DynamicCurrency = (_dec = defineUI5Class("sap.fe.core.type.DynamicCurrency"), _dec(_class = /*#__PURE__*/function (_CurrencyType) {
    function DynamicCurrency() {
      return _CurrencyType.apply(this, arguments) || this;
    }
    _inheritsLoose(DynamicCurrency, _CurrencyType);
    var _proto = DynamicCurrency.prototype;
    _proto.formatValue = function formatValue(aValues, sTargetType) {
      const self = this;
      if (!("decimalPadding" in self.oFormatOptions)) {
        const currencyList = aValues[2];
        if (currencyList !== undefined) {
          const entries = currencyList ? Object.values(currencyList) : [];
          const decimalPadding = entries.length === 0 ? MAXIMUM_CURRENCY_DECIMALS : Math.min(entries.reduce((max, entry) => Math.max(max, entry.UnitSpecificScale ?? 0), MINIMUM_CURRENCY_DECIMALS), MAXIMUM_CURRENCY_DECIMALS);
          // Assign before super so that UnitMixin's first-time _createFormats() call picks up the correct value.
          self.oFormatOptions = {
            ...self.oFormatOptions,
            decimalPadding
          };
        }
      }
      return _CurrencyType.prototype.formatValue.call(this, aValues, sTargetType);
    };
    return DynamicCurrency;
  }(CurrencyType)) || _class);
  return DynamicCurrency;
}, false);
//# sourceMappingURL=DynamicCurrency-dbg.js.map
