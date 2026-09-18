import type { EntitySet, NavigationProperty, PropertyPath } from "@sap-ux/vocabularies-types";
import type { NavigationPropertyRestriction } from "@sap-ux/vocabularies-types/vocabularies/Capabilities";
import type ConverterContext from "sap/fe/core/converters/ConverterContext";
import { isEntitySet } from "sap/fe/core/helpers/TypeGuards";
import { getTargetEntitySetInfo } from "./DataModelPathHelper";

export type RestrictionsOnProperties = {
	nonSortableProperties: string[];
	nonFilterableProperties: string[];
};

/**
 * Reads all FilterRestrictions and SortRestrictions of the main and child entities and their dedicated navigation restrictions.
1. For containment scenario:
   1.1. For LR, Navigation restrictions are evaluated first, followed by the restrictions on the root entity. If Navigation property restriction and a direct restriction exist, both are considered.
   1.2 For the OP, Restrictions are only calculated on the root entity, as there are no child entities. The same approach described in point 1.1 is applied.
2. For a non containment scenario:
   2.1 The same logic described in point 1.1 applies.
   2.2 For the OP, the direct restrictions configured for the OP are considered along with the navigation restrictions on the target (child) entity displayed.
 * @param entitySet Entity set to be analyzed (target or parent entity set).
 * @param targetEntitySet The target entity set, if available.  Not used in the case of containment.
 * @param parentNavigationPath The parent navigation path, specific for containment scenario to get the correct property based on the parent navigation path.
 * @returns Array containing the property names of all non-filterable and non-sortable properties
 */
const getPropertiesRestrictionsBasedOnEntities = function (
	entitySet: EntitySet,
	targetEntitySet?: EntitySet,
	parentNavigationPath?: string
): RestrictionsOnProperties {
	const restrictionsFromNavigationRestrictions = {
		nonSortableProperties: getSortRestrictionsfromNavigationRestrictions(entitySet, targetEntitySet, parentNavigationPath),
		nonFilterableProperties: getFilterRestrictionsfromNavigationRestrictions(entitySet, targetEntitySet, parentNavigationPath)
	};
	const directRestrictions = {
		nonSortableProperties: getDirectSortRestrictions(entitySet, targetEntitySet, parentNavigationPath),
		nonFilterableProperties: getDirectFilterRestrictions(entitySet, targetEntitySet, parentNavigationPath)
	};
	return {
		nonSortableProperties: Array.from(
			new Set([...restrictionsFromNavigationRestrictions.nonSortableProperties, ...directRestrictions.nonSortableProperties])
		),
		nonFilterableProperties: Array.from(
			new Set([...restrictionsFromNavigationRestrictions.nonFilterableProperties, ...directRestrictions.nonFilterableProperties])
		)
	};
};

/**
 * Gets all SortRestrictions and FilterRestrictions for a given context.
 * This function verifies whether we are in a containment scenario.
 * @param converterContext The converter context.
 * @returns Object containing all property names of restrictions separated by sortable and filterable capabilities.
 */
export const getRestrictionsOnProperties = function (converterContext: ConverterContext): RestrictionsOnProperties {
	let propertiesRestrictions: RestrictionsOnProperties = { nonSortableProperties: [], nonFilterableProperties: [] };
	const dataModelObjectPath = converterContext.getDataModelObjectPath();
	const { parentEntitySet, targetEntitySet, parentNavigationPath } = getTargetEntitySetInfo(dataModelObjectPath);
	if (isEntitySet(targetEntitySet)) {
		// Get the restrictions on the target navigation entity set
		return getPropertiesRestrictionsBasedOnEntities(targetEntitySet);
	} else if (parentEntitySet && isEntitySet(parentEntitySet)) {
		// Find the restrictions on the parent entity set, this applies for containment as there isn't an entity set available on the OP
		return getPropertiesRestrictionsBasedOnEntities(parentEntitySet, undefined, parentNavigationPath);
	}
	return propertiesRestrictions;
};

/**
 * Gets the sort restrictions from the navigation restrictions.
 * @param entitySet Entity set to be analyzed.
 * @param targetEntitySet The target entity set, if available. Not used in the case of containment.
 * @param parentNavigationPath The parent navigation path, specific for containment scenario to get the correct property based on the parent navigation path.
 * @returns Array containing the property names of all non-sortable properties from navigation restrictions.
 */
function getSortRestrictionsfromNavigationRestrictions(
	entitySet: EntitySet,
	targetEntitySet?: EntitySet,
	parentNavigationPath?: string
): string[] {
	const sortRestrictionsFromNavigationRestrictions: string[] = [];
	entitySet.annotations.Capabilities?.NavigationRestrictions?.RestrictedProperties?.forEach((navigationRestriction) => {
		// if containment enabled get only the sort restrictions of the related navigation path
		if (parentNavigationPath && parentNavigationPath !== navigationRestriction?.NavigationProperty?.value) {
			return;
		}
		if (navigationRestriction?.SortRestrictions?.Sortable === false) {
			// find navigation property
			const navigationProperty = navigationRestriction.NavigationProperty.$target;
			if (navigationProperty) {
				// add all properties of the navigation property to the nonSortableProperties
				sortRestrictionsFromNavigationRestrictions.push(
					...getAllPropertiesOfNavigationProperty(navigationProperty, navigationRestriction, parentNavigationPath)
				);
			}
		} else {
			const nonSortableNavigationProperties = navigationRestriction?.SortRestrictions?.NonSortableProperties?.map((property) => {
				return getRestrictedPropertyRelativePath(property, targetEntitySet, parentNavigationPath);
			});
			if (nonSortableNavigationProperties?.length) {
				sortRestrictionsFromNavigationRestrictions.push(...nonSortableNavigationProperties);
			}
		}
	});
	return sortRestrictionsFromNavigationRestrictions;
}

/**
 * Gets the sort restrictions directly from the entity set.
 * @param entitySet Entity set to be analyzed.
 * @param targetEntitySet The target entity set, if available. Not used in the case of containment.
 * @param parentNavigationPath The parent navigation path, specific for containment scenario to get the correct property based on the parent navigation path.
 * @returns Array containing the property names of all non-sortable properties.
 */
function getDirectSortRestrictions(entitySet: EntitySet, targetEntitySet?: EntitySet, parentNavigationPath?: string): string[] {
	const sortRestrictionsOnEntitySet: string[] = [];
	if (entitySet.annotations.Capabilities?.SortRestrictions?.Sortable === false) {
		// add all properties of the entity set to the nonSortableProperties
		sortRestrictionsOnEntitySet.push(...entitySet.entityType.entityProperties.map((property) => property.name));
	} else {
		const nonSortableProperties: string[] = [];
		entitySet.annotations.Capabilities?.SortRestrictions?.NonSortableProperties?.forEach((property) => {
			if (parentNavigationPath && !property.value.includes(parentNavigationPath)) {
				// skip the non sortable property if it doesn't belong to the parent navigation path in case of containment
				return;
			}
			nonSortableProperties.push(getRestrictedPropertyRelativePath(property, targetEntitySet, parentNavigationPath));
		});
		if (nonSortableProperties?.length) {
			sortRestrictionsOnEntitySet.push(...nonSortableProperties);
		}
	}
	return sortRestrictionsOnEntitySet;
}

/**
 * Gets the filter restrictions from the navigation restrictions.
 * @param entitySet Entity set to be analyzed.
 * @param targetEntitySet The target entity set, if available. Not used in the case of containment.
 * @param parentNavigationPath The parent navigation path, specific for containment scenario to get the correct property based on the parent navigation path.
 * @returns Array containing the property names of all non-filterable properties from navigation restrictions.
 */
function getFilterRestrictionsfromNavigationRestrictions(
	entitySet: EntitySet,
	targetEntitySet?: EntitySet,
	parentNavigationPath?: string
): string[] {
	const filterRestrictionsFromNavigationRestrictions: string[] = [];
	entitySet.annotations.Capabilities?.NavigationRestrictions?.RestrictedProperties?.forEach((navigationRestriction) => {
		// Get the filter restrictions of the related navigation path
		// The navigationRestriction is also relevant if it contains the parent navigation path
		if (parentNavigationPath && !navigationRestriction?.NavigationProperty?.value.includes(parentNavigationPath)) {
			return;
		}
		if (navigationRestriction?.FilterRestrictions?.Filterable === false) {
			// find navigation property
			const navigationProperty = navigationRestriction.NavigationProperty.$target;
			if (navigationProperty) {
				// add all properties of the navigation property to the nonFilterableProperties
				filterRestrictionsFromNavigationRestrictions.push(
					...getAllPropertiesOfNavigationProperty(navigationProperty, navigationRestriction, parentNavigationPath)
				);
			}
		} else {
			const nonFilterableNavigationProperties = navigationRestriction?.FilterRestrictions?.NonFilterableProperties?.map(
				(property) => {
					return getRestrictedPropertyRelativePath(property, targetEntitySet, parentNavigationPath);
				}
			);
			if (nonFilterableNavigationProperties?.length) {
				filterRestrictionsFromNavigationRestrictions.push(...nonFilterableNavigationProperties);
			}
		}
	});
	return filterRestrictionsFromNavigationRestrictions;
}

/**
 * Gets all properties of a navigation property based on the navigation restriction and parent navigation path.
 * @param navigationProperty The navigation property to be analyzed.
 * @param navigationRestriction The navigation restriction to be applied.
 * @param parentNavigationPath The parent navigation path, specific for containment scenario to get the correct property based on the parent navigation path.
 * @returns The array of property names of the navigation property.
 */
function getAllPropertiesOfNavigationProperty(
	navigationProperty: NavigationProperty,
	navigationRestriction?: NavigationPropertyRestriction,
	parentNavigationPath?: string
): string[] {
	if (parentNavigationPath) {
		// for containment scenario only
		if (navigationRestriction?.NavigationProperty?.value !== navigationProperty.name) {
			// in case the target entity set is a child entity set (OP), we need to get the properties based on OP target entity set
			const navigationPathBasedOnParent = navigationRestriction?.NavigationProperty?.value.replace(`${parentNavigationPath}/`, "");
			return navigationProperty.targetType.entityProperties.map((property) => `${navigationPathBasedOnParent}/${property.name}`);
		} else {
			return navigationProperty.targetType.entityProperties.map((property) => property.name);
		}
	} else {
		return navigationProperty.targetType.entityProperties.map((property) => `${navigationProperty.name}/${property.name}`);
	}
}

/**
 * Gets the relative path of the property restricted based on the target entity set and parent navigation path.
 * @param property The property to be analyzed.
 * @param targetEntitySet The target entity set, if available. Not present in the case of containment.
 * @param parentNavigationPath The parent navigation path, specific for containment scenario to get the correct property based on the parent navigation path.
 * @returns The relative path of the restricted property.
 */
function getRestrictedPropertyRelativePath(
	property: PropertyPath,
	targetEntitySet: EntitySet | undefined,
	parentNavigationPath?: string
): string {
	if (parentNavigationPath && property.value.includes(parentNavigationPath)) {
		// if the parentNavigationPath is available, we need to check if the property belongs to the parent navigation path
		// we need to get the property path based on target entity for the child entity set (OP)
		return property.value.replace(`${parentNavigationPath}/`, "");
	} else if (targetEntitySet && property.$target?.name) {
		// we need the property name from the navigation restriction definition when the targetEntitySet is available and it's not a containment scenario
		return property.$target?.name;
	} else {
		// leave the property path unchanged (it is relative to the annotation target!)
		return property.value;
	}
}

/**
 * Gets the filter restrictions directly from the entity set.
 * @param entitySet Entity set to be analyzed.
 * @param targetEntitySet The target entity set, if available. Not used in the case of containment.
 * @param parentNavigationPath The parent navigation path, specific for containment scenario to get the correct property based on the parent navigation path.
 * @returns Array containing the property names of all non-filterable properties.
 */
function getDirectFilterRestrictions(entitySet: EntitySet, targetEntitySet?: EntitySet, parentNavigationPath?: string): string[] {
	const filterRestrictionsOnEntitySet: string[] = [];
	if (entitySet.annotations.Capabilities?.FilterRestrictions?.Filterable === false) {
		// add all properties of the entity set to the nonFilterableProperties
		filterRestrictionsOnEntitySet.push(...entitySet.entityType.entityProperties.map((property) => property.name));
	} else {
		const nonFilterableProperties: string[] = [];
		entitySet.annotations.Capabilities?.FilterRestrictions?.NonFilterableProperties?.forEach((propertyPath) => {
			if (parentNavigationPath && !propertyPath.value.includes(parentNavigationPath)) {
				// skip the non filterable property if it doesn't belong to the parent navigation path in case of containment
				return;
			}
			nonFilterableProperties.push(getRestrictedPropertyRelativePath(propertyPath, targetEntitySet, parentNavigationPath));
		});
		if (nonFilterableProperties?.length) {
			filterRestrictionsOnEntitySet.push(...nonFilterableProperties);
		}
	}
	return filterRestrictionsOnEntitySet;
}
