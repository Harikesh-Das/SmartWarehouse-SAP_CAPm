/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/jsx-runtime/jsx", "sap/fe/core/formatters/CollaborationFormatter", "sap/fe/core/formatters/CriticalityFormatter", "sap/fe/core/formatters/FPMFormatter", "sap/fe/core/formatters/KPIFormatter", "sap/fe/core/formatters/StandardFormatter", "sap/fe/core/formatters/ValueFormatter"], function (jsx, CollaborationFormatter, CriticalityFormatter, FPMFormatter, KPIFormatter, standardFormatter, ValueFormatter) {
  "use strict";

  const globalScope = {
    _formatters: {
      ValueFormatter: ValueFormatter,
      StandardFormatter: standardFormatter,
      CriticalityFormatter: CriticalityFormatter,
      FPMFormatter: FPMFormatter,
      KPIFormatter: KPIFormatter,
      CollaborationFormatter: CollaborationFormatter
    }
  };
  jsx.setFormatterContext(globalScope);
  return globalScope;
}, false);
//# sourceMappingURL=Scope-dbg.js.map
