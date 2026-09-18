/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  const getCriticality = criticality => {
    if (criticality !== undefined) {
      switch (criticality) {
        case "UI.CriticalityType/VeryNegative":
        case -1:
        case "-1":
          return "UI.CriticalityType/VeryNegative";
        case "UI.CriticalityType/Neutral":
        case 0:
        case "0":
          return "UI.CriticalityType/Neutral";
        case "UI.CriticalityType/Negative":
        case 1:
        case "1":
          return "UI.CriticalityType/Negative";
        case "UI.CriticalityType/Critical":
        case 2:
        case "2":
          return "UI.CriticalityType/Critical";
        case "UI.CriticalityType/Positive":
        case 3:
        case "3":
          return "UI.CriticalityType/Positive";
        case "UI.CriticalityType/VeryPositive":
        case 4:
        case "4":
          return "UI.CriticalityType/VeryPositive";
        case "UI.CriticalityType/Information":
        case 5:
        case "5":
          return "UI.CriticalityType/Information";
        default:
          return undefined;
      }
    }
    return undefined;
  };
  getCriticality.__functionName = "._formatters.CriticalityFormatter#getCriticality";
  const criticalityFormatters = function (name) {
    if (criticalityFormatters.hasOwnProperty(name)) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      return criticalityFormatters[name].apply(this, args);
    } else {
      return "";
    }
  };
  criticalityFormatters.getCriticality = getCriticality;
  return criticalityFormatters;
}, false);
//# sourceMappingURL=CriticalityFormatter-dbg.js.map
