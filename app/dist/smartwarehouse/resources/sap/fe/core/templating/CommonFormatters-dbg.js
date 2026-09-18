/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/core/formatters/ValueFormatter", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/UIFormatters", "../converters/helpers/DataFieldHelper"], function (Log, BindingToolkit, valueFormatters, TypeGuards, DataModelPathHelper, UIFormatters, DataFieldHelper) {
  "use strict";

  var _exports = {};
  var isReferencePropertyStaticallyHidden = DataFieldHelper.isReferencePropertyStaticallyHidden;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isPropertyPathExpression = TypeGuards.isPropertyPathExpression;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var pathInModel = BindingToolkit.pathInModel;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatWithTypeInformation = BindingToolkit.formatWithTypeInformation;
  var formatResult = BindingToolkit.formatResult;
  var compileExpression = BindingToolkit.compileExpression;
  // Import-export methods related to the common annotations used by the converter to use them in the templating through the Common Formatters.

  /**
   * Process binding expressions and create description/value expressions for JSON and OData models.
   * @param propertyDefinition The property definition for type information
   * @param propertyBindingExpression The main property binding expression
   * @param descriptionBinding The description binding for JSON model handling
   * @param valueBinding The value binding expression for JSON model handling
   * @param relativeLocation The relative location for annotation processing
   * @param commonText The common text annotation
   * @returns Object containing processed description and value expressions
   */
  const processBindingsAndExpressions = function (propertyDefinition, propertyBindingExpression, descriptionBinding, valueBinding, relativeLocation, commonText) {
    const processBinding = binding => {
      if (!binding) return undefined;
      try {
        const bindingObj = binding;
        if (bindingObj.path !== undefined) {
          const pathExpression = pathInModel(bindingObj.path, bindingObj.model);
          return propertyDefinition ? formatWithTypeInformation(propertyDefinition, pathExpression) : pathExpression;
        }
      } catch (error) {
        Log.error("Error processing binding in CommonFormatters.processBinding:", error);
      }
      return undefined;
    };
    let descriptionExpression;
    if (descriptionBinding) {
      descriptionExpression = processBinding(descriptionBinding);
    } else if (commonText) {
      descriptionExpression = getExpressionFromAnnotation(commonText, relativeLocation);
    }
    let valueExpression = propertyBindingExpression;
    if (valueBinding) {
      valueExpression = processBinding(valueBinding) || propertyBindingExpression;
    }
    return {
      descriptionExpression,
      valueExpression
    };
  };

  /**
   * Retrieves the expressionBinding created out of a binding expression.
   * @param expression The expression which needs to be compiled
   * @returns The expression-binding string
   */
  const getExpressionBinding = function (expression) {
    return compileExpression(expression);
  };
  _exports.getExpressionBinding = getExpressionBinding;
  const getBindingWithTextArrangement = function (propertyDataModelPath, propertyBindingExpression, fieldFormatOptions, customFormatter, descriptionBinding, valueBinding) {
    const targetDisplayModeOverride = fieldFormatOptions?.displayMode;
    let outExpression = propertyBindingExpression;
    const propertyDefinition = isPropertyPathExpression(propertyDataModelPath.targetObject) ? propertyDataModelPath.targetObject.$target : propertyDataModelPath.targetObject;
    const targetDisplayMode = targetDisplayModeOverride || UIFormatters.getDisplayMode(propertyDataModelPath);
    const commonText = propertyDefinition?.annotations?.Common?.Text;
    const relativeLocation = getRelativePaths(propertyDataModelPath);
    const formatter = customFormatter || valueFormatters.formatWithBrackets;
    propertyBindingExpression = propertyDefinition && formatWithTypeInformation(propertyDefinition, propertyBindingExpression) || propertyBindingExpression;
    const {
      descriptionExpression,
      valueExpression
    } = processBindingsAndExpressions(propertyDefinition, propertyBindingExpression, descriptionBinding, valueBinding, relativeLocation, commonText);
    outExpression = valueBinding ? valueExpression : propertyBindingExpression;
    if (targetDisplayMode !== "Value" && descriptionExpression) {
      switch (targetDisplayMode) {
        case "Description":
          outExpression = descriptionExpression;
          break;
        case "DescriptionValue":
          outExpression = formatResult([descriptionExpression, valueExpression], formatter);
          break;
        case "ValueDescription":
          outExpression = formatResult([valueExpression, descriptionExpression], formatter);
          break;
      }
    }
    return outExpression;
  };
  _exports.getBindingWithTextArrangement = getBindingWithTextArrangement;
  const getBindingWithText = function (targetDataModelPath, customFormatter) {
    let propertyDataModelPath;
    if (isPathAnnotationExpression(targetDataModelPath?.targetObject)) {
      propertyDataModelPath = enhanceDataModelPath(targetDataModelPath, targetDataModelPath.targetObject?.path);
    } else {
      propertyDataModelPath = targetDataModelPath;
    }
    const propertyDefinition = propertyDataModelPath.targetObject;
    let propertyBindingExpression = pathInModel(getContextRelativeTargetObjectPath(propertyDataModelPath));
    propertyBindingExpression = formatWithTypeInformation(propertyDefinition, propertyBindingExpression, true);
    const textArrangementBinding = getBindingWithTextArrangement(propertyDataModelPath, propertyBindingExpression, {}, customFormatter);
    return propertyDefinition.annotations.UI && !isReferencePropertyStaticallyHidden(propertyDefinition.annotations.UI.DataFieldDefault) && compileExpression(textArrangementBinding) || undefined;
  };
  _exports.getBindingWithText = getBindingWithText;
  return _exports;
}, false);
//# sourceMappingURL=CommonFormatters-dbg.js.map
