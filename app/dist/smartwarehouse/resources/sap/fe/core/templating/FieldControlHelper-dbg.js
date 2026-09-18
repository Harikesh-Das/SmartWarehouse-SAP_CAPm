/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "../converters/annotations/DataField", "../helpers/TypeGuards"], function (BindingToolkit, DataField, TypeGuards) {
  "use strict";

  var _exports = {};
  var isProperty = TypeGuards.isProperty;
  var isDataFieldForAnnotation = DataField.isDataFieldForAnnotation;
  var isDataField = DataField.isDataField;
  var or = BindingToolkit.or;
  var isConstant = BindingToolkit.isConstant;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var equal = BindingToolkit.equal;
  /**
   * Create the binding expression to check if the property is read only or not.
   * @param oTarget The target property or DataField
   * @param relativePath Array of navigation properties pointing to the location of field control property
   * @returns The binding expression resolving to a Boolean being true if it's read only
   */
  const isReadOnlyExpression = function (oTarget, relativePath) {
    const fieldControlExpression = getExpressionFromAnnotation(oTarget?.annotations?.Common?.FieldControl, relativePath);
    if (!isConstant(fieldControlExpression)) {
      return or(equal(fieldControlExpression, 1), equal(fieldControlExpression, "1"));
    } else {
      return or(equal(fieldControlExpression, "Common.FieldControlType/ReadOnly"), equal(fieldControlExpression, 1), equal(fieldControlExpression, "1"));
    }
  };

  /**
   * Create the binding expression to check if the property is disabled or not.
   * @param oTarget The target property or DataField
   * @param relativePath Array of navigation properties pointing to the location of field control property
   * @returns The binding expression resolving to a Boolean being true if it's disabled
   */
  _exports.isReadOnlyExpression = isReadOnlyExpression;
  const isDisabledExpression = function (oTarget, relativePath) {
    const fieldControlExpression = getExpressionFromAnnotation(oTarget?.annotations?.Common?.FieldControl, relativePath);
    if (!isConstant(fieldControlExpression)) {
      return or(equal(fieldControlExpression, 0), equal(fieldControlExpression, "0"));
    } else {
      return or(equal(fieldControlExpression, "Common.FieldControlType/Hidden"),
      // deprecated version but still used by stakeholders
      equal(fieldControlExpression, "Common.FieldControlType/Inapplicable"), equal(fieldControlExpression, 0), equal(fieldControlExpression, "0"));
    }
  };

  /**
   * Create the binding expression to check if the property is editable or not.
   * @param oTarget The target property or DataField
   * @param relativePath Array of navigation properties pointing to the location of field control property
   * @returns The binding expression resolving to a Boolean being true if it's not editable
   */
  _exports.isDisabledExpression = isDisabledExpression;
  const isNonEditableExpression = function (oTarget, relativePath) {
    return or(isReadOnlyExpression(oTarget, relativePath), isDisabledExpression(oTarget, relativePath));
  };

  /**
   * Determines if the dataFieldForAnnotation has a fieldControl that is not set to Mandatory.
   * @param dataFieldForAnnotation The dataFieldForAnnotation being processed
   * @returns True if it has a fieldControl set and not Mandatory.
   */
  _exports.isNonEditableExpression = isNonEditableExpression;
  const hasFieldControlNotMandatory = function (dataFieldForAnnotation) {
    const fieldControl = dataFieldForAnnotation.annotations?.Common?.FieldControl;
    return fieldControl && fieldControl.toString() !== "Common.FieldControlType/Mandatory" ? true : false;
  };

  /**
   * Determines if the target has a field control annotation with static value mandatory .
   * @param target The target to be processed
   * @returns True if it has a static mandatory field control.
   */
  _exports.hasFieldControlNotMandatory = hasFieldControlNotMandatory;
  function isStaticallyMandatory(target) {
    const isMandatory = fc => {
      const value = fc?.toString?.();
      return value === "7" || value === "Common.FieldControlType/Mandatory";
    };
    const fieldFieldControl = target?.annotations?.Common?.FieldControl;
    if (isProperty(target) || isDataFieldForAnnotation(target)) {
      return isMandatory(fieldFieldControl);
    }
    if (isDataField(target)) {
      if (isMandatory(fieldFieldControl)) {
        return true;
      }
      if (fieldFieldControl?.toString() !== undefined) {
        return false;
      } else {
        return isMandatory(target?.Value?.$target?.annotations?.Common?.FieldControl);
      }
    }
    return isMandatory(target?.Value?.$target?.annotations?.Common?.FieldControl);
  }

  /**
   * Create the binding expression to check if the property is read only or not.
   * @param oTarget The target property or DataField
   * @param relativePath Array of navigation properties pointing to the location of field control property
   * @returns The binding expression resolving to a Boolean being true if it's read only
   */
  _exports.isStaticallyMandatory = isStaticallyMandatory;
  const isRequiredExpression = function (oTarget) {
    let relativePath = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    const oFieldControlValue = oTarget?.annotations?.Common?.FieldControl;
    const fieldControlExp = getExpressionFromAnnotation(oFieldControlValue, relativePath);
    return or(isConstant(fieldControlExp) && equal(fieldControlExp, "Common.FieldControlType/Mandatory"), equal(fieldControlExp, 7), equal(fieldControlExp, "7"));
  };
  _exports.isRequiredExpression = isRequiredExpression;
  return _exports;
}, false);
//# sourceMappingURL=FieldControlHelper-dbg.js.map
