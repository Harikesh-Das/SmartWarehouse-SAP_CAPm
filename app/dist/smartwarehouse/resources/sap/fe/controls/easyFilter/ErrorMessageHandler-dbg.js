/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/Lib", "sap/ui/model/FilterOperator"], function (Lib, FilterOperator) {
  "use strict";

  var _exports = {};
  /**
   * The `ErrorMessageHandler` class is responsible for managing and validating filter-related errors
   * in the context of the Easy Filter control. It provides mechanisms to validate filter properties
   * and values, construct error messages, and track invalid tokens or operators.
   *
   * This class ensures that filter criteria adhere to specified restrictions, such as allowed operators
   * and single/multiple value constraints. It also identifies non-filterable or hidden filter properties
   * and generates user-friendly error messages for invalid filter configurations.
   *
   * Key Features:
   * - Validates filter properties and values against defined restrictions.
   * - Tracks invalid tokens, operators, and properties.
   * - Constructs detailed error messages for invalid filter configurations.
   * - Provides utility methods to check if a property is filterable and if there are any errors.
   *
   * Usage:
   * - Use `isFilterableProperty` to check if a property is filterable.
   * - Use `validate` to validate a filter property and its value.
   * - Use `getErrorMessage` to retrieve a constructed error message for invalid tokens.
   * - Use `hasErrors` to check if there are any validation errors.
   */
  let ErrorMessageHandler = /*#__PURE__*/function () {
    function ErrorMessageHandler() {
      //Contains labels of tokens which have single item restriction violated
      //Contains labels of tokens which have invalid operator used as a map
      //{GT:[SoldToParty, PurchaseOrder], LT:[...], ...}
      //{soldToParty: true}
      this.FILTERRESTRICTIONS = {
        SingleValue: {
          multiple: false,
          operators: [FilterOperator.EQ]
        },
        MultiValue: {
          multiple: true,
          operators: [FilterOperator.EQ]
        },
        SingleRange: {
          multiple: false,
          operators: [FilterOperator.EQ, FilterOperator.NE, FilterOperator.LE, FilterOperator.LT, FilterOperator.GE, FilterOperator.GT, FilterOperator.BT, FilterOperator.NB]
        },
        MultiRange: {
          multiple: true,
          operators: [FilterOperator.EQ, FilterOperator.NE, FilterOperator.LE, FilterOperator.LT, FilterOperator.GE, FilterOperator.GT, FilterOperator.BT, FilterOperator.NB]
        },
        SearchExpression: {
          multiple: true,
          operators: [FilterOperator.StartsWith, FilterOperator.Contains, FilterOperator.EndsWith, FilterOperator.NotStartsWith, FilterOperator.NotContains, FilterOperator.NotEndsWith]
        },
        MultiRangeOrSearchExpression: {
          multiple: true,
          operators: [FilterOperator.EQ, FilterOperator.NE, FilterOperator.LE, FilterOperator.LT, FilterOperator.GE, FilterOperator.GT, FilterOperator.BT, FilterOperator.NB, FilterOperator.StartsWith, FilterOperator.Contains, FilterOperator.EndsWith, FilterOperator.NotStartsWith, FilterOperator.NotContains, FilterOperator.NotEndsWith]
        },
        SingleInterval: {
          multiple: true,
          operators: [FilterOperator.Contains, FilterOperator.NotContains, FilterOperator.EQ, FilterOperator.NE, FilterOperator.BT, FilterOperator.NB, FilterOperator.StartsWith, FilterOperator.NotStartsWith, FilterOperator.EndsWith, FilterOperator.NotEndsWith, FilterOperator.LT, FilterOperator.LE, FilterOperator.GT, FilterOperator.GE]
        }
      };
      this.resourceBundle = Lib.getResourceBundleFor("sap.fe.controls");
      this.nonFilterableTokenLabels = [];
      this.invalidSingleItemTokenLabels = [];
      this.invalidOperatorTokenLabels = {};
      this.invalidProperty = {};
      this.hiddenFilterTokenLabels = [];
      this.nonGroupableTokenLabels = [];
      this.propertyMapFreq = {};
    }

    /**
     * this method constructs the error message based on the invalid tokens present
     * @returns The constructed error message string
     */
    _exports = ErrorMessageHandler;
    var _proto = ErrorMessageHandler.prototype;
    _proto.getErrorMessage = function getErrorMessage() {
      const messages = [];
      if (this.nonFilterableTokenLabels.length > 0) {
        messages.push(this.resourceBundle.getText("M_EASY_FILTER_NON_FILTERABLE", [`<strong>${this.nonFilterableTokenLabels.join(", ")}</strong>`]));
      }
      if (this.hiddenFilterTokenLabels.length > 0) {
        messages.push(this.resourceBundle.getText("M_EASY_FILTER_HIDDEN_FILTER", [`<strong>${this.hiddenFilterTokenLabels.join(", ")}</strong>`]));
      }
      if (this.nonGroupableTokenLabels.length > 0) {
        messages.push(this.resourceBundle.getText("M_EASY_FILTER_NON_GROUPABLE", [`${this.nonGroupableTokenLabels.join(", ")}`]));
      }
      if (this.getInvalidOperatorLength() > 0) {
        Object.keys(this.invalidOperatorTokenLabels).forEach(operator => {
          if ((this.invalidOperatorTokenLabels[operator]?.length ?? 0) > 0) {
            messages.push(this.resourceBundle.getText("M_EASY_FILTER_OPERATOR", [this.resourceBundle.getText("FILTER_OPERATOR_" + operator.toUpperCase()), `<strong>${this.invalidOperatorTokenLabels[operator].join(", ")}</strong>`]));
          }
        });
      }
      if (this.invalidSingleItemTokenLabels.length > 0) {
        messages.push(this.resourceBundle.getText("M_EASY_FILTER_SINGLE_RANGE", [`<strong>${this.invalidSingleItemTokenLabels.join(", ")}</strong>`]));
      }
      return messages.join("<br>");
    };
    _proto.getInvalidOperatorLength = function getInvalidOperatorLength() {
      return Object.keys(this.invalidOperatorTokenLabels).reduce((acc, key) => {
        return acc + (this.invalidOperatorTokenLabels[key]?.length ?? 0);
      }, 0);
    }

    /**
     * This method checks if the filter property is filterable or not
     * @param filterCriteria it has metadata of the filter property
     * @returns if the filter property is filterable or not
     */;
    _proto.isFilterableProperty = function isFilterableProperty(filterCriteria) {
      if (this.invalidProperty[filterCriteria.name]) {
        return false;
      }
      const label = filterCriteria.label || filterCriteria.name;
      if (filterCriteria.filterable === false) {
        this.nonFilterableTokenLabels.push(label);
        this.invalidProperty[filterCriteria.name] = true;
        return false;
      }
      if (filterCriteria.hiddenFilter === true) {
        this.invalidProperty[filterCriteria.name] = true;
        this.hiddenFilterTokenLabels.push(label);
        return false;
      }
      return true;
    }

    /**
     * This method checks if the filter property is groupable or not.
     * @param filterCriteria Metadata of the filter property.
     * @returns Whether the filter property is groupable or not.
     */;
    _proto.isGroupableProperty = function isGroupableProperty(filterCriteria) {
      if (filterCriteria.groupable === false) {
        const label = filterCriteria.label ?? filterCriteria.name;
        this.nonGroupableTokenLabels.push(label);
        return false;
      }
      return true;
    }

    /**
     * This method validates the filter property and its value against the defined restrictions
     * @param filterCriteria it has metadata of the filter property
     * @param filterValue it has the filter value and operator
     * @returns if the filter property and its value are valid or not
     */;
    _proto.validate = function validate(filterCriteria, filterValue) {
      if (this.invalidProperty[filterCriteria.name]) {
        return false;
      }
      if (filterCriteria.filterRestriction) {
        const restriction = this.FILTERRESTRICTIONS[filterCriteria.filterRestriction];
        const name = filterValue.name;
        const label = filterCriteria.label || name;
        const operator = filterValue.operator;

        //Check if invalid operator has been used
        if (!restriction.operators.includes(operator)) {
          if (!this.invalidOperatorTokenLabels[operator]) {
            this.invalidOperatorTokenLabels[operator] = [];
          }
          this.invalidOperatorTokenLabels[operator].push(label);
          this.invalidProperty[name] = true;
          return false;
        }

        //Check if only single value restriction is present
        //If the operator is of BT or NB type, then we consider it as 1 value
        this.propertyMapFreq[name] = (this.propertyMapFreq[name] ?? 0) + (operator === FilterOperator.BT || operator === FilterOperator.NB ? 1 : filterValue.values.length);
        if (!restriction.multiple && this.propertyMapFreq[filterValue.name] > 1) {
          this.invalidSingleItemTokenLabels.push(label);
          this.invalidProperty[name] = true;
          return false;
        }
      }
      return true;
    }

    /**
     * This method checks if there are any validation errors present
     * @returns if there are any validation errors
     */;
    _proto.hasErrors = function hasErrors() {
      return this.getInvalidOperatorLength() > 0 || this.nonFilterableTokenLabels.length > 0 || this.hiddenFilterTokenLabels.length > 0 || this.nonGroupableTokenLabels.length > 0 || this.invalidSingleItemTokenLabels.length > 0;
    };
    return ErrorMessageHandler;
  }();
  _exports = ErrorMessageHandler;
  return _exports;
}, false);
//# sourceMappingURL=ErrorMessageHandler-dbg.js.map
