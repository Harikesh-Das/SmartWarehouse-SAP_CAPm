/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  /**
   * Filters delegate properties based on the filter expressions from navigation properties.
   * @param delegateProperies
   * @param filterExpressions The filter expressions can include wildcards (*) to match multiple properties (for example: "*", "ToSalesOrder/*" and "ToSalesOrder/ToLineItems*" ).
   * @returns Filtered array of DelegateProperty
   */
  function filterNavigationForAdaptation(delegateProperies) {
    let filterExpressions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [""];
    filterExpressions = filterExpressions === null ? [""] : filterExpressions;
    if (!filterExpressions?.includes("")) {
      // Always include properties without navigation if not already included
      filterExpressions.push("");
    }
    return delegateProperies.filter(function (property) {
      return filterExpressions.some(function (filterExpression) {
        let regexString;
        switch (filterExpression) {
          case "":
            // Match only properties without navigation
            regexString = "^[^/]*$";
            break;
          case "*":
          case "*/*":
            // Match all properties and navigations
            regexString = ".*";
            break;
          default:
            // Convert wildcard to regex
            regexString = filterExpression.includes("/") ? "^" + filterExpression.replace(/\*/g, ".*").replace("/", "\\/") + "$" : "^" + filterExpression.replace(/\*/g, ".*") + "\\/.*";
        }
        return new RegExp(regexString).test(property.name);
      });
    });
  }
  _exports.filterNavigationForAdaptation = filterNavigationForAdaptation;
  return _exports;
}, false);
//# sourceMappingURL=Adaptation-dbg.js.map
