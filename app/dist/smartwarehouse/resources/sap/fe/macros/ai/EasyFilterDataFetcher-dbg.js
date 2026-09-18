/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/TypeGuards", "sap/ui/model/Filter", "sap/ui/model/FilterOperator"], function (CommonUtils, MetaModelConverter, TypeGuards, Filter, FilterOperator) {
  "use strict";

  var _exports = {};
  var isProperty = TypeGuards.isProperty;
  var convertTypes = MetaModelConverter.convertTypes;
  /**
   * Generates a filter for the key property of a value list.
   * @param valueList The value list information.
   * @param keyProperty The key property of the value list.
   * @param operator The filter operator.
   * @param valueToMatch The value to match.
   * @returns A filter for the key property.
   */
  function getKeyPropertyFilter(valueList, keyProperty, operator, valueToMatch) {
    let filterValue = valueToMatch;

    // If the key property is known to contain only uppercase values, convert the filter value to uppercase as well
    if (typeof filterValue === "string" && keyProperty.annotations.Common?.IsUpperCase?.valueOf() === true) {
      filterValue = filterValue.toUpperCase();
    }
    return new Filter({
      path: valueList.keyPath,
      operator,
      value1: filterValue
    });
  }

  /**
   * Resolves a single scalar value using a value list.
   * @param valueList The value list information.
   * @param keyProperty The key property of the value list.
   * @param operator The filter operator.
   * @param valueToMatch The value to match.
   * @param looseMatch Whether to apply loose matching or not
   * @returns A promise that resolves to the selected values.
   */
  async function resolveValueUsingValueList(valueList, keyProperty, operator, valueToMatch) {
    let looseMatch = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    const model = valueList.valueListInfo.$model;
    const path = `/${valueList.valueListInfo.CollectionPath}`;
    const $select = generateSelectParameter(valueList);
    let $search = CommonUtils.normalizeSearchTerm(valueToMatch instanceof Date ? valueToMatch.toISOString() : valueToMatch.toString());

    // Handle negation operators (NE, NotContains, NotStartsWith, NotEndsWith)
    // Strategy: Query for positive case, then apply negation client-side
    const isNegation = isNegationOperator(operator);
    // "cleaned" operator for possible negation operators
    const cleanedOperator = isNegation ? getPositiveOperator(operator) : operator;
    const keyPropertyFilter = getKeyPropertyFilter(valueList, keyProperty, cleanedOperator, valueToMatch);

    // Check if the query exceeds the maximum length of the key property
    const characterLimitOverflow = !$search || $search.length > (keyProperty.maxLength ?? $search.length);
    if (!looseMatch) {
      $search = `"${$search}"`; // Ensure the search term is treated as a phrase
    }
    // If query exceeds the maximum length of the key property, we don't filter at all, as it would give no result anyway
    const [valueHelpKeyQuery, valueHelpSearchQuery] = await Promise.allSettled([!characterLimitOverflow ? model.bindList(path, undefined, undefined, keyPropertyFilter, {
      $select
    }).requestContexts(0, 1) : [],
    // $filter on the key property of the value list
    model.bindList(path, undefined, undefined, undefined, {
      $search: $search,
      $select
    }).requestContexts() // $search on the value list
    ]);
    const mapResult = mapValueListToCodeList(valueList, true);
    if (valueHelpKeyQuery.status === "fulfilled" && valueHelpKeyQuery.value.length > 0) {
      // There is at least one match in the key column:
      // - If the operator is EQ: This indicates an exact key match, so the returned data will be used.
      // - For other operators: One or more keys match the value based on the operator, so the original condition is preserved.
      return cleanedOperator === FilterOperator.EQ ? {
        operator,
        selectedValues: valueHelpKeyQuery.value.map(mapResult)
      } : {
        operator,
        selectedValues: [{
          value: valueToMatch,
          description: valueToMatch
        }]
      };
    }
    if (valueHelpSearchQuery.status === "fulfilled" && valueHelpSearchQuery.value.length > 0) {
      // The key query did not return any matches, but the search query found results. Use the search results instead.

      const results = valueHelpSearchQuery.value.map(mapResult);
      let filteredResults = [];
      let hasPostProcessingResults = false;
      if (cleanedOperator === FilterOperator.EQ) {
        // for EQ we still want to display the results even if it is empty after filtering
        hasPostProcessingResults = true;
        filteredResults = results.filter(result => result.description.toString().toLowerCase() === valueToMatch.toString().toLowerCase());
        if (filteredResults.length === 0) {
          filteredResults = results;
        }
      } else if (cleanedOperator === FilterOperator.StartsWith) {
        filteredResults = results.filter(result => result.description.toString().toLowerCase().startsWith(valueToMatch.toString().toLowerCase()));
        hasPostProcessingResults = filteredResults.length > 0;
      } else if (cleanedOperator === FilterOperator.EndsWith) {
        filteredResults = results.filter(result => result.description.toString().toLowerCase().endsWith(valueToMatch.toString().toLowerCase()));
        hasPostProcessingResults = filteredResults.length > 0;
      } else if (cleanedOperator === FilterOperator.Contains) {
        filteredResults = results.filter(result => result.description.toString().toLowerCase().includes(valueToMatch.toString().toLowerCase()));
        hasPostProcessingResults = filteredResults.length > 0;
      }
      // If post-processing left no results, return user's original input
      if (!hasPostProcessingResults) {
        return {
          operator,
          selectedValues: [{
            value: valueToMatch,
            description: valueToMatch
          }]
        };
      }
      // If post-processing found results, return the filtered results
      // Always set the operator to EQ/NE, as post-processing ensures an EQ/NE result.
      return {
        operator: operator === cleanedOperator ? FilterOperator.EQ : FilterOperator.NE,
        selectedValues: filteredResults
      };
    }

    // No matches were found in either query; the original value will be used as a fallback.

    return {
      operator,
      selectedValues: [{
        value: valueToMatch,
        description: valueToMatch
      }],
      noMatch: true
    };
  }

  /**
   * Create a mapping function for mapping a value list query result to a code list.
   * @param valueList The value list information used to identify the key and description properties.
   * @param ensureDescription Whether to ensure that the description is always returned.
   * @returns A function that maps a single value list query result to a code list entry.
   */

  function mapValueListToCodeList(valueList) {
    let ensureDescription = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    return context => {
      const data = context.getObject();
      const value = data[valueList.keyPath];
      const description = valueList.descriptionPath ? data[valueList.descriptionPath] : undefined;
      return {
        value,
        description: ensureDescription ? description ?? value : description
      };
    };
  }

  /**
   * Generates the $select parameter for a value list query.
   * @param valueList The value list information.
   * @returns The $select parameter as a string.
   */
  _exports.mapValueListToCodeList = mapValueListToCodeList;
  function generateSelectParameter(valueList) {
    return [valueList.keyPath, valueList.descriptionPath].filter(path => path && !path.includes("/")).join(",");
  }
  _exports.generateSelectParameter = generateSelectParameter;
  const tokenCache = new Map();

  /**
   * Resolves token-based filter values using a value list.
   * @param valueList The value list used for resolving values.
   * @param value The token-based filter values to resolve.
   * @param looseMatch Whether to perform a loose match on the values.
   * @returns A promise that resolves to an array of resolved filter values.
   */
  async function resolveTokenValue(valueList, value) {
    let looseMatch = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    const {
      operator,
      selectedValues
    } = value;
    const model = valueList.valueListInfo.$model;

    // Make sure all values are resolved, even if some requests fail. It can happen that the backend cannot process the $filter queries we
    // run on the value list, but we still want to get the fallback $search results.
    model.setContinueOnError("$auto");
    const valueListMetamodel = convertTypes(model.getMetaModel());
    const keyProperty = valueListMetamodel.resolvePath(`/${valueList.valueListInfo.CollectionPath}/${valueList.keyPath}`)?.target;
    if (!isProperty(keyProperty)) {
      // something went wrong - the key property is not a property of the value list entity
      return unresolvedResult([value]);
    }
    const cacheKey = operator + "::" + selectedValues.join("|") + "::" + keyProperty.fullyQualifiedName;
    if (!tokenCache.has(cacheKey)) {
      const tokenValuePromise = resolveTokenValueInternal(valueList, value, looseMatch, keyProperty).then(res => {
        tokenCache.delete(cacheKey);
        return res;
      });
      tokenCache.set(cacheKey, tokenValuePromise);
    }
    return tokenCache.get(cacheKey);
  }
  _exports.resolveTokenValue = resolveTokenValue;
  async function resolveTokenValueInternal(valueList, value, looseMatch, keyProperty) {
    const {
      operator,
      selectedValues
    } = value;
    // For comparison operators (GreaterThan, LessThan, Between, etc.), skip backend calls
    // and return user input directly to EasyFilter
    if (isComparisonOperator(operator)) {
      if (operator === FilterOperator.BT || operator === FilterOperator.NB) {
        // Handle Between/Not Between operators - they expect exactly 2 values
        const [lowerBound, upperBound] = selectedValues;
        return [{
          operator,
          selectedValues: [{
            value: lowerBound,
            description: lowerBound
          }, {
            value: upperBound,
            description: upperBound
          }]
        }];
      } else {
        // Handle other comparison operators (GT, GE, LT, LE)
        return unresolvedResult([value]);
      }
    } else {
      const resolvedValues = await Promise.all(selectedValues.map(async selectedValue => resolveValueUsingValueList(valueList, keyProperty, operator, selectedValue, looseMatch)));
      return resolvedValues.flat();
    }
  }

  /**
   * Returns the unresolved values in the format expected by the Easy Filter Bar.
   * @param values The values to be resolved.
   * @returns An array of unresolved values.
   */
  function unresolvedResult(values) {
    return values.map(_ref => {
      let {
        operator,
        selectedValues
      } = _ref;
      return {
        operator,
        selectedValues: selectedValues.map(value => ({
          value,
          description: value
        }))
      };
    });
  }

  /**
   * Checks if the operator is a negation operator (NE, NotContains, NotStartsWith, NotEndsWith).
   * @param operator The filter operator to check.
   * @returns True if the operator is a negation operator.
   */
  _exports.unresolvedResult = unresolvedResult;
  function isNegationOperator(operator) {
    return [FilterOperator.NE, FilterOperator.NotContains, FilterOperator.NotStartsWith, FilterOperator.NotEndsWith].includes(operator);
  }

  /**
   * Checks if the operator is a comparison operator (GT, GE, LT, LE, BT, NB).
   * @param operator The filter operator to check.
   * @returns True if the operator is a comparison operator.
   */
  function isComparisonOperator(operator) {
    return [FilterOperator.GT, FilterOperator.GE, FilterOperator.LT, FilterOperator.LE, FilterOperator.BT, FilterOperator.NB].includes(operator);
  }

  /**
   * Converts a negation operator to its positive equivalent (NE -> EQ, NotContains -> Contains, etc.).
   * @param negationOperator The negation operator to convert.
   * @returns The corresponding positive operator.
   */
  function getPositiveOperator(negationOperator) {
    switch (negationOperator) {
      case FilterOperator.NE:
        return FilterOperator.EQ;
      case FilterOperator.NotContains:
        return FilterOperator.Contains;
      case FilterOperator.NotStartsWith:
        return FilterOperator.StartsWith;
      case FilterOperator.NotEndsWith:
        return FilterOperator.EndsWith;
      default:
        return FilterOperator.EQ;
    }
  }
  _exports.getPositiveOperator = getPositiveOperator;
  return _exports;
}, false);
//# sourceMappingURL=EasyFilterDataFetcher-dbg.js.map
