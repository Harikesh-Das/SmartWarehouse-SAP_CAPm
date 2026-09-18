import type { OperatorConfiguration } from "sap/fe/core/converters/ManifestSettings";
import { ODATA_TYPE_MAPPING } from "sap/fe/core/templating/DisplayModeFormatter";
import * as DefaultSemanticDateOperators from "sap/fe/macros/filterBar/DefaultSemanticDateOperators";
import ExtendedSemanticDateOperators from "sap/fe/macros/filterBar/ExtendedSemanticDateOperators";
import type { PropertyInfo } from "sap/fe/macros/internal/PropertyInfo";
import type { SelectOption, SemanticDateConfiguration } from "sap/fe/navigation/SelectionVariant";
import type { Filter as StateUtilFilter } from "sap/ui/mdc/p13n/StateUtil";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";

const fixedDateOperators = ["TODAY", "TOMORROW", "YESTERDAY"];
const basicOperators = ["DATE", "FROM", "TO", "DATERANGE"];

type semanticDateFiltersInfo = {
	filterName: string;
	filterSemanticInfo: SemanticDateConfiguration;
	filterType: string;
};

/**
 * Helper function to check if an INCLUDED operator should be excluded based on its base operator.
 * Implements asymmetric exclusion: base operators control their INCLUDED variants, but not the other way around.
 * This only applies to the specific set of datetime-based operators that have INCLUDED variants.
 * @param currentOperator The current operator being evaluated
 * @param excludedOperators Array of operators that are excluded
 * @returns True if the current operator must be excluded based on paired operator logic
 */
function _shouldExcludeBasedOnInclusiveOperator(currentOperator: string, excludedOperators: string[]): boolean {
	// Get the base operators from the categorized constants
	const lastDateOperatorKeys = Object.keys(DefaultSemanticDateOperators.lastDateOperators);
	const nextDateOperatorKeys = Object.keys(DefaultSemanticDateOperators.nextDateOperators);
	const INCLUSIVE_DATETIME_BASE_OPERATORS = [...lastDateOperatorKeys, ...nextDateOperatorKeys];

	// Only apply this logic to INCLUDED variants of the supported operators
	if (!currentOperator.endsWith("INCLUDED")) {
		return false;
	}

	// Get the base operator (remove INCLUDED suffix)
	const baseOperator = currentOperator.replace("INCLUDED", "");

	// Check if this is a supported base operator for asymmetric exclusion
	if (!INCLUSIVE_DATETIME_BASE_OPERATORS.includes(baseOperator)) {
		return false;
	}

	// Check if the exact base operator is in the excluded list
	// Use exact matching to avoid partial matches (e.g., LASTYEAR vs LASTYEARS)
	return excludedOperators.some((excludedOp) => baseOperator === excludedOp);
}

/**
 * Check if the filter operation is supported by user configurations.
 *
 * Scenarios:
 * 1. If no configuration is maintained, then only all default semantic date operators shall be shown for the filter field.
 * 2. If configurations are maintained, then configuration shall be applied to the particular filter field.
 *
 * In case of extended operators that are a combination of single date operator like "TODAY", "TOMORROW" etc. with "TO"/"FROM" operators,
 * they shall not be shown by default.
 * The user will have to maintain configuration to enable them.
 * @param oOperation Operation
 * @param oOperation.key Operator identifier
 * @param oOperation.category Type of semantic date operation
 * @param aOperatorConfiguration User configurations for filter fields
 * @returns Extended Operator names
 */
function _filterOperation(
	oOperation: { key: string; category: string },
	aOperatorConfiguration?: OperatorConfiguration[]
): boolean | undefined {
	if (!aOperatorConfiguration) {
		return true;
	}
	aOperatorConfiguration = Array.isArray(aOperatorConfiguration) ? aOperatorConfiguration : [aOperatorConfiguration];
	const operationKey = oOperation["key"];
	const isExtendedOperator = ExtendedSemanticDateOperators.isExtendedOperator(operationKey);
	let bResult;

	const configFound = aOperatorConfiguration.some(function (oOperatorConfiguration: OperatorConfiguration): boolean {
		let j;
		if (!oOperatorConfiguration.path) {
			return false;
		}

		const sValue = oOperation[oOperatorConfiguration.path as keyof typeof oOperation];
		const bExclude = oOperatorConfiguration.exclude ?? isExtendedOperator ?? false;
		let aOperatorValues;

		if (oOperatorConfiguration.contains && sValue) {
			aOperatorValues = oOperatorConfiguration.contains.split(",");

			// Check for asymmetric inclusive operator exclusion
			if (bExclude && _shouldExcludeBasedOnInclusiveOperator(sValue, aOperatorValues)) {
				bResult = false;
				return true;
			}

			for (j = 0; j < aOperatorValues.length; j++) {
				if (bExclude && sValue.includes(aOperatorValues[j])) {
					bResult = false;
					return true;
				} else if (!bExclude && sValue.includes(aOperatorValues[j])) {
					bResult = true;
					return true;
				}
			}
		}

		if (oOperatorConfiguration.equals && sValue) {
			aOperatorValues = oOperatorConfiguration.equals.split(",");

			// Check for asymmetric inclusive operator exclusion
			if (bExclude && _shouldExcludeBasedOnInclusiveOperator(sValue, aOperatorValues)) {
				bResult = false;
				return true;
			}

			for (j = 0; j < aOperatorValues.length; j++) {
				if (bExclude && sValue === aOperatorValues[j]) {
					bResult = false;
					return true;
				} else if (!bExclude && sValue === aOperatorValues[j]) {
					bResult = true;
					return true;
				}
			}
		}

		return false;
	});
	return configFound ? bResult : !isExtendedOperator;
}
// Get the operators based on type
function getOperatorsInfo(type: string | undefined): Record<string, { key: string; category: string }> {
	return { ...DefaultSemanticDateOperators.getOperatorsInfo(type), ...ExtendedSemanticDateOperators.getOperatorsInfo() };
}
const SemanticDateOperators = {
	/**
	 * Get basic semantic date operator names.
	 * @returns Basic Operator names like "DATE", "FROM", "TO", "DATERANGE".
	 */
	getBasicSemanticDateOperations: function (): string[] {
		return [...basicOperators];
	},

	/**
	 * Get all supported semantic date operator names that can be used via FE macro filter bar.
	 * @param type
	 * @returns Operator names.
	 */
	getSemanticDateOperations: function (type?: string): string[] {
		return [
			...DefaultSemanticDateOperators.getSemanticDateOperations(type),
			...ExtendedSemanticDateOperators.getSemanticDateOperations()
		];
	},
	// TODO: Would need to check with MDC for removeOperator method
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	removeSemanticDateOperators: function (): void {},
	// To filter operators based on manifest aOperatorConfiguration settings
	getFilterOperations: function (aOperatorConfiguration: OperatorConfiguration[], type?: string): string[] {
		const aOperations: { key: string; category: string }[] = [];
		const operators = getOperatorsInfo(type);
		for (const n in operators) {
			const oOperation = operators[n];
			if (_filterOperation(oOperation, aOperatorConfiguration) === true) {
				aOperations.push(oOperation);
			}
		}
		return aOperations.map(function (oOperation) {
			return oOperation.key;
		});
	},

	/**
	 * The function will check if any of the filter conditions does not have a semantic operator or a date operator.
	 * This includes actual date fields along with Semantic operator.
	 * If the 2nd parameter is false, we only check if filter has the semantic Operator.
	 * @param filterConditions Filter conditions
	 * @param includeCheckForBasicOperators Should include basic operator along with semantic operator
	 * @returns True if any of the filter conditions is not semantic field
	 */
	hasSemanticDateOperations: function (filterConditions: StateUtilFilter, includeCheckForBasicOperators = true): boolean {
		const semanticDateOps = this.getSemanticDateOperations();
		for (const key in filterConditions) {
			const filterCondtion = filterConditions[key];
			const conditionWithSemanticOperator = filterCondtion.find(function (condition) {
				return semanticDateOps.includes(condition.operator);
			});
			if (conditionWithSemanticOperator) {
				if (includeCheckForBasicOperators) {
					return true;
				} else {
					// if operator is one of basic operator and not a semantic operator then we return false
					return !basicOperators.includes(conditionWithSemanticOperator.operator);
				}
			}
		}
		return false;
	},
	getSemanticOpsFilterProperties: function (filterSelectOptions: Record<string, SelectOption[]>): semanticDateFiltersInfo[] {
		const filtersWithSemanticOperators = [];

		for (const [filterName, filterInfo] of Object.entries(filterSelectOptions)) {
			const filterSemanticInfo = filterInfo[0].SemanticDates;
			if (filterSemanticInfo && !basicOperators.includes(filterSemanticInfo.operator)) {
				filtersWithSemanticOperators.push({ filterName, filterSemanticInfo, filterType: "" });
			}
		}
		return filtersWithSemanticOperators;
	},

	getSemanticDateFiltersWithFlpPlaceholders(
		filtersWithSemanticOpsInfo: semanticDateFiltersInfo[],
		propertiesInfo: PropertyInfo[]
	): [Record<string, string>, Filter[]] {
		const semanticDateFilters: Filter[] = [];
		const flpMappedPlaceholders: Record<string, string> = {};

		filtersWithSemanticOpsInfo.forEach(({ filterName, filterSemanticInfo, filterType }) => {
			const correspondingPropertyInfo = propertiesInfo.find(
				(propertyInfo) => (propertyInfo as PropertyInfo & { key?: string }).key === filterName
			);
			if (correspondingPropertyInfo && correspondingPropertyInfo.typeConfig?.className) {
				filterType = ODATA_TYPE_MAPPING[correspondingPropertyInfo.typeConfig?.className];
			}
			const semanticOperator = filterSemanticInfo.operator;
			const value1 = filterSemanticInfo.high;
			const value2 = filterSemanticInfo.low;

			if (semanticOperator) {
				let filter;
				const isExtendedOperator = ExtendedSemanticDateOperators.isExtendedOperator(semanticOperator);
				// FLP only understands single date operators like TODAY, YESTERDAY etc.
				// So in case of extended operators, we would need to use the single date operator(primitive semantic date operator) used in creating the extended operator.
				const operatorKeyForFlpPlaceholder = isExtendedOperator
					? ExtendedSemanticDateOperators.getCorrespondingSingleDateOperator(semanticOperator)
					: semanticOperator;
				if ((isExtendedOperator || fixedDateOperators.includes(semanticOperator)) && filterType !== "Edm.DateTimeOffset") {
					const key = `${filterName}placeholder`;
					const operator = isExtendedOperator ? ExtendedSemanticDateOperators.getFilterOperator(semanticOperator) : "EQ";
					filter = new Filter({
						path: filterName,
						operator,
						value1: key
					});
					flpMappedPlaceholders[key] = `{${filterType}%%DynamicDate.${operatorKeyForFlpPlaceholder}%%}`;
				} else {
					const commonOperatorSuffix = [operatorKeyForFlpPlaceholder, value1, value2]
						.filter((val) => val !== undefined && val !== null)
						.join(".");
					const startFilterKey = `${filterName}placeholderStart`;
					const endFilterKey = `${filterName}placeholderEnd`;
					const commonPrefixPlaceholder = `${filterType}%%DynamicDate.${commonOperatorSuffix}`;
					const geFilter = new Filter({
						path: filterName,
						operator: "GE",
						value1: startFilterKey
					});
					const leFilter = new Filter({
						path: filterName,
						operator: "LE",
						value1: endFilterKey
					});

					if (isExtendedOperator) {
						// Extended operators are combination of single date operators like TODAY with range operator like FROM or TO.
						// In such case, single date is the anchor for the filter and the operator LE or GE is decided based on the range TO or FROM.
						const filterOperator = ExtendedSemanticDateOperators.getFilterOperator(semanticOperator);
						filter = filterOperator === FilterOperator.GE ? geFilter : leFilter;
					} else {
						// The dates' end points(start and end) shall create the range for the filter.
						filter = new Filter({
							filters: [geFilter, leFilter],
							and: true
						});
					}
					flpMappedPlaceholders[startFilterKey] = `{${commonPrefixPlaceholder}.start%%}`;
					flpMappedPlaceholders[endFilterKey] = `{${commonPrefixPlaceholder}.end%%}`;
				}

				semanticDateFilters.push(filter);
			}
		});

		return [flpMappedPlaceholders, semanticDateFilters];
	},

	/**
	 * Add all semantic date operators that can be supported by FE FilterBar building block to MDC environment.
	 */
	addSemanticDateOperators(): void {
		DefaultSemanticDateOperators.addSemanticDateOperators();
		ExtendedSemanticDateOperators.addExtendedFilterOperators();
	}
};
export default SemanticDateOperators;
