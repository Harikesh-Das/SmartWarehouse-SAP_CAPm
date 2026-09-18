/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/deepEqual", "sap/ui/core/Lib", "sap/ui/core/format/DateFormat", "sap/ui/model/FilterOperator", "sap/ui/model/odata/type/DateTimeOffset", "./ErrorMessageHandler"], function (deepEqual, Lib, DateFormat, FilterOperator, DateTimeOffset, ErrorMessageHandler) {
  "use strict";

  var _exports = {};
  const resourceBundle = Lib.getResourceBundleFor("sap.fe.controls");
  const dateTimeOffset = new DateTimeOffset();
  function areItemsSame(arr1, arr2) {
    if (arr1.length !== arr2.length) {
      return false;
    }

    // Compare elements of both arrays
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i].operator !== arr2[i].operator || !arr1[i].selectedValues.every((firstValue, index) => {
        const otherValue = arr2[i].selectedValues[index];

        // Handle Date objects
        if (firstValue instanceof Date || otherValue instanceof Date) {
          return deepEqual(firstValue, otherValue);
        }

        // Handle objects with deep equality
        if (typeof firstValue === "object" && typeof otherValue === "object") {
          return deepEqual(firstValue.value, otherValue.value) && firstValue.description === otherValue.description;
        }

        // Fallback to direct comparison
        return firstValue === otherValue;
      })) {
        return false;
      }
    }
    return true; // Arrays are the same
  }
  function areArraySame(arr1, arr2) {
    if (arr1.length !== arr2.length) {
      return false;
    }
    // Compare elements of both arrays
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
    return true; // Arrays are the same
  }
  async function areCodeListsSame(arr1, arr2) {
    const arrNew1 = await getCodeListArray(arr1);
    const arrNew2 = await getCodeListArray(arr2);
    const descriptionNew1 = arrNew1?.map(data => data.description);
    const descriptionNew2 = arrNew2?.map(data => data.description);
    const value1 = arrNew1?.map(data => data.value);
    const value2 = arrNew2?.map(data => data.value);
    if (!descriptionNew1 || !descriptionNew2) {
      return false;
    }
    return areArraySame(descriptionNew1, descriptionNew2) && areArraySame(value1, value2);
  }
  async function getCodeListArray(arr) {
    if (typeof arr === "function") {
      return arr();
    }
    return arr;
  }
  function convertDateToString(value, tokenType, isDateTimeOffset) {
    let formattedDateTime = "";
    if (isDateTimeOffset) {
      return dateTimeOffset.formatValue(value, "string");
    }
    switch (tokenType) {
      // Edm.Date / Edm.TimeOfDay are timezone-free; UTC: true avoids
      // off-by-one in negative-offset zones.
      case "Calendar":
        formattedDateTime = DateFormat.getDateInstance({
          UTC: true
        }).format(value);
        break;
      case "Time":
        formattedDateTime = DateFormat.getTimeInstance({
          UTC: true
        }).format(value);
        break;
      default:
        break;
    }
    return formattedDateTime;
  }

  /**
   * Create a string representation of the operator and value.
   * @param operator The operator to represent
   * @param value The value to represent
   * @param tokenType The token's type
   * @param isDateTimeOffset Checks if the data type is of DateTimeOffset
   * @returns The string representation of the operator and value
   */
  function mapOperator(operator, value, tokenType, isDateTimeOffset) {
    let newValue = "";
    if (typeof value === "boolean") {
      newValue = convertBoolToString(value);
    } else if (value instanceof Date) {
      newValue = convertDateToString(value, tokenType, isDateTimeOffset);
    } else {
      newValue = value;
    }
    switch (operator) {
      case FilterOperator.GT:
        return `> ${newValue}`;
      case FilterOperator.LT:
        return `< ${newValue}`;
      case FilterOperator.GE:
        return `>= ${newValue}`;
      case FilterOperator.LE:
        return `<= ${newValue}`;
      case FilterOperator.EQ:
        return `${newValue}`;
      case FilterOperator.Contains:
        return `*${newValue}*`;
      case FilterOperator.EndsWith:
        return `*${newValue}`;
      case FilterOperator.StartsWith:
        return `${newValue}*`;
      case FilterOperator.NE:
        return `!=(${newValue})`;
      case FilterOperator.NotContains:
        return `!(*${newValue}*)`;
      case FilterOperator.NotEndsWith:
        return `!(*${newValue})`;
      case FilterOperator.NotStartsWith:
        return `!(${newValue}*)`;
      default:
        return newValue?.toString();
    }
  }
  function mapOperatorForValueHelp(operator, value, tokenType, isDateTimeOffset) {
    return mapOperator(operator, value.description, tokenType, isDateTimeOffset);
  }
  function mapOperatorForBetweenOperator(operator, values, tokenType, isDateTimeOffset) {
    let newValue1 = "";
    let newValue2 = "";
    if (typeof values[0] === "boolean") {
      newValue1 = convertBoolToString(values[0]);
    } else if (values[0] instanceof Date) {
      newValue1 = convertDateToString(values[0], tokenType, isDateTimeOffset);
    } else if (typeof values[0] === "object") {
      newValue1 = values[0].description;
    } else {
      newValue1 = values[0];
    }
    if (typeof values[1] === "boolean") {
      newValue2 = convertBoolToString(values[1]);
    } else if (values[1] instanceof Date) {
      newValue2 = convertDateToString(values[1], tokenType, isDateTimeOffset);
    } else if (typeof values[0] === "object") {
      newValue2 = values[1].description;
    } else {
      newValue2 = values[1];
    }
    if (operator === FilterOperator.BT) {
      return `${newValue1}...${newValue2}`;
    } else {
      return `!(${newValue1}...${newValue2})`;
    }
  }
  function isBetweenSelectedValues(operator) {
    return operator === FilterOperator.BT || operator === FilterOperator.NB;
  }
  function convertBoolToString(value) {
    return value ? resourceBundle.getText("M_EASY_FILTER_SELECTED_VALUES_TRUE") : resourceBundle.getText("M_EASY_FILTER_SELECTED_VALUES_FALSE");
  }
  function formatData(tokens, filterValues, filterBarMetadata, setMessageStripForValidatedFilters) {
    if (!filterValues) {
      return;
    }
    const visitedMapForMandatoryTokens = {};
    const errorMessageHandler = new ErrorMessageHandler();
    for (const filterValue of filterValues) {
      const filterCriteria = filterBarMetadata.find(field => field.name === filterValue.name);
      if (!filterCriteria) {
        continue;
      }

      // Handle non-filterable and hidden filters
      if (!errorMessageHandler.isFilterableProperty(filterCriteria)) {
        continue;
      }

      // Validate for filter value restriction
      const isInValidToken = !errorMessageHandler.validate(filterCriteria, filterValue);

      // Update tokens
      updateTokens(tokens, filterValue, filterCriteria, visitedMapForMandatoryTokens, isInValidToken);
    }

    // Handle validation messages
    if (errorMessageHandler.hasErrors()) {
      setMessageStripForValidatedFilters(errorMessageHandler.getErrorMessage());
    }
  }
  function updateTokens(tokens, filterValue, filterCriteria, visitedMapForMandatoryTokens, isInValidToken) {
    const tokenIndex = tokens.findIndex(token => token.key === filterValue.name);
    const keySpecificSelectedValues = createKeySpecificSelectedValues(filterValue);
    if (tokenIndex === -1) {
      // Add new token
      tokens.push({
        key: filterValue.name,
        label: filterCriteria.label,
        keySpecificSelectedValues: isInValidToken ? [] : [keySpecificSelectedValues],
        type: filterCriteria.type,
        busy: filterCriteria.type === "ValueHelp"
      });
    } else {
      // Update existing token
      const currentToken = tokens[tokenIndex];
      if (isInValidToken) {
        currentToken.keySpecificSelectedValues = [];
      } else if ((currentToken.isRequired ?? false) && !visitedMapForMandatoryTokens[currentToken.key]) {
        currentToken.keySpecificSelectedValues = [keySpecificSelectedValues];
        visitedMapForMandatoryTokens[currentToken.key] = true;
      } else {
        currentToken.keySpecificSelectedValues.push(keySpecificSelectedValues);
      }
    }
  }
  function createKeySpecificSelectedValues(filterValue) {
    const {
      operator,
      values
    } = filterValue;
    if (EasyFilterUtils.isBetweenSelectedValues(operator)) {
      return {
        operator,
        selectedValues: values
      };
    }
    return {
      operator: operator,
      selectedValues: values
    };
  }

  /**
   * Extracts the plain property name from an OData-style path (e.g. "/SalesOrderManage/SoldToParty" → "SoldToParty").
   * @param path The OData-style path or plain property name to resolve.
   * @returns The last path segment, or the original string if no "/" is present.
   */
  function resolvePropertyName(path) {
    return path.includes("/") ? path.split("/").filter(Boolean).pop() ?? path : path;
  }
  _exports.resolvePropertyName = resolvePropertyName;
  const EasyFilterUtils = {
    areItemsSame,
    areCodeListsSame,
    getCodeListArray,
    areArraySame,
    mapOperator,
    mapOperatorForBetweenOperator,
    isBetweenSelectedValues,
    formatData,
    mapOperatorForValueHelp,
    resolvePropertyName
  };
  return EasyFilterUtils;
}, false);
//# sourceMappingURL=utils-dbg.js.map
