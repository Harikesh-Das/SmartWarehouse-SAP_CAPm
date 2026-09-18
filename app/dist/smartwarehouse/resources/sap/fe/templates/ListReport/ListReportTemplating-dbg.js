/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ActionUtilities", "sap/fe/core/helpers/StableIdHelper"], function (ActionUtilities, StableIdHelper) {
  "use strict";

  var _exports = {};
  var generate = StableIdHelper.generate;
  var LR_EMPHASIS_SUPPRESSION_CONDITION = ActionUtilities.LR_EMPHASIS_SUPPRESSION_CONDITION;
  // Template Helpers for the List Report
  /**
   * Method returns an VariantBackReference expression based on variantManagement and oConverterContext value.
   * @param viewData Object Containing View Data
   * @param converterContextObject Object containing converted context
   * @returns The variant back reference ID or undefined
   */

  const getVariantBackReference = function (viewData, converterContextObject) {
    if (viewData && viewData.variantManagement === "Page") {
      return "fe::PageVariantManagement";
    }
    if (viewData && viewData.variantManagement === "Control") {
      return generate([converterContextObject.filterBarId, "VariantManagement"]);
    }
    return undefined;
  };
  _exports.getVariantBackReference = getVariantBackReference;
  const getDefaultPath = function (aViews) {
    for (let i = 0; i < aViews.length; i++) {
      if (aViews[i].defaultPath) {
        return aViews[i].defaultPath;
      }
    }
  };

  /**
   * Returns the binding expression condition for when ListReport header emphasis should be suppressed.
   * This condition is centralized to ensure consistency between converters and templates.
   * Emphasis is suppressed when FilterBar is visible and liveMode is disabled (Go button gets emphasis).
   * @returns The suppression condition as a binding string
   */
  _exports.getDefaultPath = getDefaultPath;
  const getEmphasisSuppressionCondition = function () {
    return LR_EMPHASIS_SUPPRESSION_CONDITION;
  };

  /**
   * Determines whether ListReport header emphasis should be suppressed at runtime.
   * This formatter is used in templates to apply the same logic as the converter.
   * @param hideFilterBar Whether the FilterBar is hidden
   * @param useHiddenFilterBar Whether a hidden FilterBar is used
   * @param liveMode Whether liveMode is enabled
   * @returns True if emphasis should be suppressed (FilterBar visible and liveMode disabled)
   */
  _exports.getEmphasisSuppressionCondition = getEmphasisSuppressionCondition;
  const isListReportEmphasisSuppressed = function (hideFilterBar, useHiddenFilterBar, liveMode) {
    return !hideFilterBar && !useHiddenFilterBar && !liveMode;
  };

  /**
   * Returns the dt:designtime value for a header action based on whether it's an emphasized-first clone.
   * Emphasized-first clones are technical duplicates and should not be adaptable in RTA.
   * @param action The action to check
   * @returns The designtime value: "not-adaptable" for emphasized-first clones, undefined otherwise
   */
  _exports.isListReportEmphasisSuppressed = isListReportEmphasisSuppressed;
  const getDesigntimeForHeaderAction = function (action) {
    return ActionUtilities.isEmphasizedFirstClone(action) ? "not-adaptable" : undefined;
  };
  _exports.getDesigntimeForHeaderAction = getDesigntimeForHeaderAction;
  return _exports;
}, false);
//# sourceMappingURL=ListReportTemplating-dbg.js.map
