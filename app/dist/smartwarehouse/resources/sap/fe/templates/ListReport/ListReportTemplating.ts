// Template Helpers for the List Report
import type { BaseAction } from "sap/fe/core/converters/controls/Common/Action";
import type { ListReportDefinition } from "sap/fe/core/converters/templates/ListReportConverter";
import ActionUtilities, { LR_EMPHASIS_SUPPRESSION_CONDITION } from "sap/fe/core/helpers/ActionUtilities";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import type { ViewData } from "sap/fe/core/services/TemplatedViewServiceFactory";

/**
 * Method returns an VariantBackReference expression based on variantManagement and oConverterContext value.
 * @param viewData Object Containing View Data
 * @param converterContextObject Object containing converted context
 * @returns The variant back reference ID or undefined
 */

export const getVariantBackReference = function (viewData: ViewData, converterContextObject: ListReportDefinition): string | undefined {
	if (viewData && viewData.variantManagement === "Page") {
		return "fe::PageVariantManagement";
	}
	if (viewData && viewData.variantManagement === "Control") {
		return generate([converterContextObject.filterBarId, "VariantManagement"]);
	}
	return undefined;
};

export const getDefaultPath = function (aViews: { defaultPath?: string }[]): string | undefined {
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
export const getEmphasisSuppressionCondition = function (): string {
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
export const isListReportEmphasisSuppressed = function (hideFilterBar: boolean, useHiddenFilterBar: boolean, liveMode: boolean): boolean {
	return !hideFilterBar && !useHiddenFilterBar && !liveMode;
};

/**
 * Returns the dt:designtime value for a header action based on whether it's an emphasized-first clone.
 * Emphasized-first clones are technical duplicates and should not be adaptable in RTA.
 * @param action The action to check
 * @returns The designtime value: "not-adaptable" for emphasized-first clones, undefined otherwise
 */
export const getDesigntimeForHeaderAction = function (action: BaseAction): string | undefined {
	return ActionUtilities.isEmphasizedFirstClone(action) ? "not-adaptable" : undefined;
};
