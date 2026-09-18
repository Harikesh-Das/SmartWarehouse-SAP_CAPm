/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/macros/table/delegates/TableDelegate"], function (CommonUtils, TableDelegate) {
  "use strict";

  /**
   * Helper class for sap.ui.mdc.Table.
   * <h3><b>Note:</b></h3>
   * This class is experimental and not intended for productive usage, since the API/behavior has not been finalized.
   * @author SAP SE
   * @private
   * @since 1.69.0
   * @alias sap.fe.macros.TableDelegate
   */
  const TreeTableDelegate = Object.assign({}, TableDelegate, {
    apiVersion: 2,
    _internalUpdateBindingInfo: function (table, bindingInfo) {
      TableDelegate._internalUpdateBindingInfo.apply(this, [table, bindingInfo]);
      const currentAggregation = table.getRowBinding()?.getAggregation();
      const payload = table.getPayload();
      bindingInfo.parameters.$$aggregation = {
        ...bindingInfo.parameters.$$aggregation,
        ...{
          hierarchyQualifier: payload?.hierarchyQualifier,
          createInPlace: payload?.createInPlace ? true : undefined
        },
        // Setting the expandTo parameter to a high value forces the treeTable to expand all nodes when the search is applied
        ...{
          expandTo: bindingInfo.parameters.$$aggregation?.search ? Number.MAX_SAFE_INTEGER : currentAggregation?.expandTo ?? payload?.initialExpansionLevel
        }
      };

      // Flag to know if sorters are applied (used in drag & drop logic)
      const internalContext = table.getBindingContext("internal");
      internalContext.setProperty("isSorted", bindingInfo.sorter !== undefined && bindingInfo.sorter.length > 0);
    },
    updateBindingInfoWithSearchQuery: function (bindingInfo, filterInfo, filter) {
      bindingInfo.filters = filter;
      // We set search to undefined instead of deleting it to trigger MDC's change detection
      // when search changes from a value to empty. The model ignores undefined parameters, so it won't be included
      // in the request
      bindingInfo.parameters.$$aggregation = {
        ...bindingInfo.parameters.$$aggregation,
        search: CommonUtils.normalizeSearchTerm(filterInfo.search)
      };
    }
  });
  return TreeTableDelegate;
}, false);
//# sourceMappingURL=TreeTableDelegate-dbg.js.map
