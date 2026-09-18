/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/mdc/odata/v4/TypeMap"], function (TypeMap) {
  "use strict";

  // This function is only called by MDC TypeMap when creating type instances for edit-mode content.
  // Strip decimalPadding so the constructor never sees it alongside showMeasure != false —
  // that combination throws in NumberFormat.checkDecimalPadding.
  function dynamicCurrencyOptions(formatOptions, constraints, context) {
    const {
      decimalPadding: _dp,
      ...rest
    } = formatOptions ?? {};
    return TypeMap.getUnitOptions(rest, constraints, context);
  }
  const FETypeMap = Object.assign({}, TypeMap);
  FETypeMap.import(TypeMap);
  // Register DynamicCurrency with the same base type logic as sap.ui.model.odata.type.Currency
  // so the MDC Field renders it with the correct amount + code layout.
  FETypeMap.set("sap.fe.core.type.DynamicCurrency", TypeMap.getUnitBaseType, dynamicCurrencyOptions);
  FETypeMap.freeze();
  return FETypeMap;
}, false);
//# sourceMappingURL=FETypeMap-dbg.js.map
