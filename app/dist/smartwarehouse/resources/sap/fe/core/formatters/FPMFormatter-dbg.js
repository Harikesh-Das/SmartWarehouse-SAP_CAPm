/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/FPMHelper"], function (FPMHelper) {
  "use strict";

  const customBooleanPropertyCheck = async function (oView, modulePath, aSelectedContexts) {
    const parts = modulePath.split(".");
    const methodName = parts.pop();
    const moduleName = parts.join("/");
    return FPMHelper.loadModuleAndCallMethod(moduleName, methodName, oView, oView.getBindingContext(), aSelectedContexts || []);
  };
  customBooleanPropertyCheck.__functionName = "._formatters.FPMFormatter.bind($control)#customBooleanPropertyCheck";

  /**
   * Collection of table formatters.
   * @param this The context
   * @param sName The inner function name
   * @param oArgs The inner function parameters
   * @returns The value from the inner function
   */
  const fpmFormatter = function (sName) {
    if (fpmFormatter.hasOwnProperty(sName)) {
      for (var _len = arguments.length, oArgs = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        oArgs[_key - 1] = arguments[_key];
      }
      return fpmFormatter[sName].apply(this, oArgs);
    } else {
      return "";
    }
  };
  fpmFormatter.customBooleanPropertyCheck = customBooleanPropertyCheck;
  return fpmFormatter;
}, false);
//# sourceMappingURL=FPMFormatter-dbg.js.map
