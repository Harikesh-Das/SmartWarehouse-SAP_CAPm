/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/formatters/Scope"], function (Scope) {
  "use strict";

  const formatScaleAndUOM = function (separator, uom, scale) {
    uom = uom === "undefined" ? "" : uom;
    scale = scale === "undefined" ? "" : scale;
    const UOMAndScale = `${separator}${scale} ${uom}`;
    const onlyUOM = uom ? `${separator}${uom}` : "";
    const onlyOneOfUOMOrScale = scale ? `${separator}${scale}` : onlyUOM;
    return uom && scale ? UOMAndScale : onlyOneOfUOMOrScale;
  };
  formatScaleAndUOM.__functionName = "._formatters.VisualFilterFormatter#formatScaleAndUOM";

  // See https://www.typescriptlang.org/docs/handbook/functions.html#this-parameters for more detail on this weird syntax
  /**
   * Collection of VisualFilter formatters.
   * @param this The context
   * @param sName The inner function name
   * @param oArgs The inner function parameters
   * @returns The value from the inner function
   */
  const visualFilterFormatter = function (sName) {
    if (visualFilterFormatter.hasOwnProperty(sName)) {
      for (var _len = arguments.length, oArgs = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        oArgs[_key - 1] = arguments[_key];
      }
      return visualFilterFormatter[sName].apply(this, oArgs);
    } else {
      return "";
    }
  };
  visualFilterFormatter.formatScaleAndUOM = formatScaleAndUOM;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  Scope._formatters.VisualFilterFormatter = visualFilterFormatter;
  return visualFilterFormatter;
}, false);
//# sourceMappingURL=VisualFilterFormatter-dbg.js.map
