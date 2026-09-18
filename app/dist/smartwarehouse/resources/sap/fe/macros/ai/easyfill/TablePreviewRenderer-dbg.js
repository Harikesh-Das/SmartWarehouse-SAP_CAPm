/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/m/Column", "sap/m/Label", "sap/m/Table"], function (Column, Label, Table) {
  "use strict";

  var _exports = {};
  function createPreviewColumns(visualColumns, columnWidths) {
    return visualColumns.map(spec => new Column({
      header: new Label({
        text: spec.label,
        wrapping: true
      }),
      ...(columnWidths ? {
        width: columnWidths[spec.propNames[0]] ?? "10rem"
      } : {})
    }));
  }
  _exports.createPreviewColumns = createPreviewColumns;
  function createPreviewTable(columns, items, isGridLayout) {
    const config = {
      columns,
      items,
      autoPopinMode: !isGridLayout,
      fixedLayout: isGridLayout
    };
    if (!isGridLayout) {
      config.contextualWidth = "Auto";
    }
    const table = new Table(config);
    table.addStyleClass("sapFeEasyFillPreviewTable");
    return table;
  }
  _exports.createPreviewTable = createPreviewTable;
  return _exports;
}, false);
//# sourceMappingURL=TablePreviewRenderer-dbg.js.map
