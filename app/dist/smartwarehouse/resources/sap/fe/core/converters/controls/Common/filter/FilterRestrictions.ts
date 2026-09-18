import type { EntitySet, PropertyPath } from "@sap-ux/vocabularies-types";
import type { FilterRestrictionsType } from "@sap-ux/vocabularies-types/vocabularies/Capabilities";
import type { EntitySetAnnotations_Capabilities } from "@sap-ux/vocabularies-types/vocabularies/Capabilities_Edm";
import uniqueSort from "sap/base/util/array/uniqueSort";
import mergeObjects from "sap/base/util/merge";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import { isEntitySet } from "sap/fe/core/helpers/TypeGuards";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";

type _FilterAllowedExpressions = Record<string, string[]>;

export type FilterRestrictions = {
	RequiredProperties: string[];
	NonFilterableProperties: string[];
	FilterAllowedExpressions: _FilterAllowedExpressions;
};

type FilterExpressionRestriction = {
	Property?: PropertyPath;
	AllowedExpressions?: string;
};

/**
 * Extracts property path string from a flexible path object used in converter or annotation inputs.
 * The object may contain a 'value' field. Returns undefined if it is a non-empty string.
 * @param ref Potential property reference object.
 * @returns Property path string or undefined.
 */
function extractPath(ref: PropertyPath | undefined): string | undefined {
	if (!ref) {
		return undefined;
	}
	return typeof ref.value === "string" ? ref.value : undefined;
}

/**
 * Parses raw FilterRestrictionsType annotation into plain arrays of strings and a mapping of allowed expressions.
 * This replaces previous two-step normalization + extraction logic and deliberately avoids introducing $PropertyPath objects.
 * @param filterRestrictions Raw filter restrictions annotation (may be undefined).
 * @returns Parsed filter restrictions with simple string collections.
 */
function getFilterRestrictions(filterRestrictions: FilterRestrictionsType | undefined): FilterRestrictions {
	if (!filterRestrictions) {
		return { RequiredProperties: [], NonFilterableProperties: [], FilterAllowedExpressions: {} };
	}

	const required: string[] = (filterRestrictions.RequiredProperties ?? []).map((p) => extractPath(p)).filter((p): p is string => !!p);
	const nonFilterable: string[] = (filterRestrictions.NonFilterableProperties ?? [])
		.map((p) => extractPath(p))
		.filter((p): p is string => !!p);

	const allowed: _FilterAllowedExpressions = {};
	for (const expr of filterRestrictions.FilterExpressionRestrictions ?? []) {
		const exprObj = expr as FilterExpressionRestriction;
		const propPath = extractPath(exprObj.Property);
		const allowedExp = typeof exprObj.AllowedExpressions === "string" ? exprObj.AllowedExpressions : undefined;
		if (!propPath || !allowedExp) {
			continue;
		}
		if (allowed[propPath] !== undefined) {
			allowed[propPath].push(allowedExp);
		} else {
			allowed[propPath] = [allowedExp];
		}
	}

	return {
		RequiredProperties: required,
		NonFilterableProperties: nonFilterable,
		FilterAllowedExpressions: allowed
	};
}

function _fetchPropertiesForNavPath(paths: string[], navPath: string, props: string[]): string[] {
	const navPathPrefix = navPath + "/";
	return paths.reduce((outPaths: string[], pathToCheck: string) => {
		if (pathToCheck.startsWith(navPathPrefix)) {
			const outPath = pathToCheck.replace(navPathPrefix, "");
			if (!outPaths.includes(outPath)) {
				outPaths.push(outPath);
			}
		}
		return outPaths;
	}, props);
}

/**
 * Initializes an empty filter restrictions object with default values.
 * @returns The initialized filter restrictions object
 */
function initializeFilterRestrictions(): FilterRestrictions {
	return {
		RequiredProperties: [],
		NonFilterableProperties: [],
		FilterAllowedExpressions: {}
	};
}

/**
 * Determines if the entity set has a result context annotation.
 * @param entitySet The entity set to check
 * @returns True if the entity set has result context, false otherwise
 */
function hasResultContext(entitySet: EntitySet | null | undefined): boolean {
	if (!entitySet?.annotations?.Common) {
		return false;
	}
	return "ResultContext" in entitySet.annotations.Common ? entitySet.annotations.Common.ResultContext?.valueOf() === true : false;
}

/**
 * Processes filter restrictions at entity set level (least priority).
 * @param restrictions The current filter restrictions object
 * @param filterRestrictions The filter restrictions annotation
 * @param hasResultContextValue Whether the entity has result context
 * @returns Updated filter restrictions object
 */
function processEntitySetFilterRestrictions(
	restrictions: FilterRestrictions,
	filterRestrictions: FilterRestrictionsType | undefined,
	hasResultContextValue: boolean
): FilterRestrictions {
	const filterRestictions = getFilterRestrictions(filterRestrictions);
	restrictions.RequiredProperties = filterRestictions.RequiredProperties;
	if (!hasResultContextValue) {
		restrictions.NonFilterableProperties = filterRestictions.NonFilterableProperties;
	}
	restrictions.FilterAllowedExpressions = filterRestictions.FilterAllowedExpressions;
	return restrictions;
}

/**
 * Processes property path filter restrictions (third highest priority).
 * @param restrictions The current filter restrictions object
 * @param filterRestrictions The parent filter restrictions
 * @param navPath The navigation path
 * @returns Updated filter restrictions object
 */
function processPropertyPathFilterRestrictions(
	restrictions: FilterRestrictions,
	filterRestrictions: FilterRestrictionsType | undefined,
	navPath: string
): FilterRestrictions {
	if (!filterRestrictions || navPath.includes("%2F")) {
		return restrictions;
	}
	const filterRestictions = getFilterRestrictions(filterRestrictions);

	const navPrefix = navPath + "/";
	const reqSubset = filterRestictions.RequiredProperties.filter((p) => p.startsWith(navPrefix));
	const nonFilterSubset = filterRestictions.NonFilterableProperties.filter((p) => p.startsWith(navPrefix));
	restrictions.RequiredProperties = _fetchPropertiesForNavPath(reqSubset, navPath, restrictions.RequiredProperties);
	restrictions.NonFilterableProperties = _fetchPropertiesForNavPath(nonFilterSubset, navPath, restrictions.NonFilterableProperties);

	const parentAllowedExpressions = Object.keys(filterRestictions.FilterAllowedExpressions).reduce(
		(outProp: Record<string, string[]>, propPath: string) => {
			if (propPath.startsWith(navPrefix)) {
				const outPropPath = propPath.slice(navPrefix.length);
				outProp[outPropPath] = filterRestictions.FilterAllowedExpressions[propPath];
			}
			return outProp;
		},
		{} as Record<string, string[]>
	);

	restrictions.FilterAllowedExpressions = mergeObjects({}, restrictions.FilterAllowedExpressions, parentAllowedExpressions) as Record<
		string,
		string[]
	>;
	return restrictions;
}

/**
 * Processes navigation restrictions (second highest priority).
 * @param restrictions The current filter restrictions object
 * @param navigationRestrictions The navigation restrictions
 * @returns Updated filter restrictions object
 */
function processNavigationFilterRestrictions(
	restrictions: FilterRestrictions,
	navigationRestrictions: FilterRestrictionsType | undefined
): FilterRestrictions {
	const filterRestictions = getFilterRestrictions(navigationRestrictions);
	restrictions.RequiredProperties = uniqueSort(restrictions.RequiredProperties.concat(filterRestictions.RequiredProperties));
	restrictions.NonFilterableProperties = uniqueSort(
		restrictions.NonFilterableProperties.concat(filterRestictions.NonFilterableProperties)
	);
	restrictions.FilterAllowedExpressions = mergeObjects(
		{},
		restrictions.FilterAllowedExpressions,
		filterRestictions.FilterAllowedExpressions
	) as Record<string, string[]>;
	return restrictions;
}

/**
 * Processes navigation association entity restrictions (highest priority).
 * @param restrictions The current filter restrictions object
 * @param associationRestrictions The association entity filter restrictions
 * @returns Updated filter restrictions object
 */
function processNavigationAssociationFilterRestrictions(
	restrictions: FilterRestrictions,
	associationRestrictions: FilterRestrictionsType | undefined
): FilterRestrictions {
	const filterRestictions = getFilterRestrictions(associationRestrictions);
	restrictions.RequiredProperties = uniqueSort(restrictions.RequiredProperties.concat(filterRestictions.RequiredProperties));
	restrictions.NonFilterableProperties = uniqueSort(
		restrictions.NonFilterableProperties.concat(filterRestictions.NonFilterableProperties)
	);
	restrictions.FilterAllowedExpressions = mergeObjects(
		{},
		restrictions.FilterAllowedExpressions,
		filterRestictions.FilterAllowedExpressions
	) as _FilterAllowedExpressions;
	return restrictions;
}

/**
 * Processes filter restrictions using converter context.
 * @param dataModelObjectPath The data model object path
 * @returns Processed filter restrictions
 */
function processFilterRestrictionsFromConverter(dataModelObjectPath: DataModelObjectPath<PageContextPathTarget>): FilterRestrictions {
	const restrictions = initializeFilterRestrictions();
	const isContainment = !isEntitySet(dataModelObjectPath.targetEntitySet);
	const containmentNavPath =
		isContainment && dataModelObjectPath.navigationProperties[dataModelObjectPath.navigationProperties.length - 1]?.name;

	// LEAST PRIORITY - Filter restrictions directly at Entity Set
	if (!isContainment) {
		const entitySetFilterRestrictions = (
			dataModelObjectPath.targetEntitySet?.annotations?.Capabilities as EntitySetAnnotations_Capabilities
		)?.FilterRestrictions;
		const hasResultContextValue = hasResultContext(dataModelObjectPath.targetEntitySet as EntitySet | null | undefined);

		processEntitySetFilterRestrictions(restrictions, entitySetFilterRestrictions, hasResultContextValue);
	}

	if (dataModelObjectPath.navigationProperties.length > 0) {
		const navPath = isContainment
			? (containmentNavPath as string)
			: dataModelObjectPath.navigationProperties[dataModelObjectPath.navigationProperties.length - 1]?.name;

		// THIRD HIGHEST PRIORITY - Property path restrictions at parent entity
		const parentFilterRestrictions = (
			dataModelObjectPath.startingEntitySet?.annotations?.Capabilities as EntitySetAnnotations_Capabilities
		)?.FilterRestrictions;
		processPropertyPathFilterRestrictions(restrictions, parentFilterRestrictions, navPath);

		// SECOND HIGHEST PRIORITY - Navigation restrictions from parent entity set
		// Build the full navigation path dynamically
		const navigationPathParts = dataModelObjectPath.navigationProperties.map((prop) => prop.name);

		// Check for navigation restrictions that match any part of our navigation path
		const navigationRestrictions =
			dataModelObjectPath.startingEntitySet?.annotations?.Capabilities?.NavigationRestrictions?.RestrictedProperties?.find(
				(navProp) => {
					const navPropPath = navProp.NavigationProperty.value;
					if (!navPropPath) {
						return false;
					}

					// Check if the navigation property path matches any of our navigation segments
					// This handles both single level (e.g., "_PartnerItems") and multi-level (e.g., "Set/_PartnerItems") paths
					const isPartialPathMatch = navigationPathParts.some((_, index) => {
						const partialPath = navigationPathParts.slice(index).join("/");
						return navPropPath === partialPath;
					});

					// Also check the full path
					const fullPath = navigationPathParts.join("/");
					return isPartialPathMatch || navPropPath === fullPath;
				}
			);

		const navFilterRestrictions = navigationRestrictions?.FilterRestrictions;
		processNavigationFilterRestrictions(restrictions, navFilterRestrictions);

		// HIGHEST PRIORITY - Navigation association entity restrictions
		const navigationAssociation = dataModelObjectPath.navigationProperties.find((navProp) => navProp.name === navPath);
		const associationFilterRestrictions = (navigationAssociation?.annotations?.Capabilities as EntitySetAnnotations_Capabilities)
			?.FilterRestrictions;
		processNavigationAssociationFilterRestrictions(restrictions, associationFilterRestrictions);
	}

	return restrictions;
}

/*** Fetches filter restrictions by entity path with proper priority handling and ensures correct processing order by following priority order:
 * 1. LEAST PRIORITY: Filter restrictions directly at Entity Set
 * 2. THIRD HIGHEST PRIORITY: Property path restrictions at parent entity
 * 3. SECOND HIGHEST PRIORITY: Navigation restrictions
 * 4. HIGHEST PRIORITY: Restrictions at navigation association entity
 * @param converterContext Optional converter context for enhanced processing
 * @returns Filter restrictions object containing required properties, non-filterable properties, and allowed expressions
 */
function getFilterRestrictionsByDataModel(dataModelObjectPath?: DataModelObjectPath<PageContextPathTarget>): FilterRestrictions {
	if (dataModelObjectPath) {
		return processFilterRestrictionsFromConverter(dataModelObjectPath);
	}
	return initializeFilterRestrictions();
}

const FilterRestrictions = { getFilterRestrictionsByDataModel };

export default FilterRestrictions;
