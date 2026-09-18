/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/macros/ai/EasyFilterDataFetcher", "sap/fe/macros/internal/valuehelp/ValueListHelper", "sap/ui/base/BindingInfo", "sap/ui/core/message/MessageType", "sap/ui/model/FilterOperator", "sap/ui/model/odata/v4/AnnotationHelper"], function (Log, EasyFilterDataFetcher, ValueListHelper, BindingInfo, MessageType, FilterOperator, AnnotationHelper) {
  "use strict";

  var _exports = {};
  var resolveTokenValue = EasyFilterDataFetcher.resolveTokenValue;
  const UI5_ANNOTATION_PREFIX = "@$";
  const TECHNICAL_FIELD_PREFIX = "__";
  function isTechnicalFieldKey(fieldName) {
    return fieldName.startsWith(TECHNICAL_FIELD_PREFIX) || fieldName.startsWith(UI5_ANNOTATION_PREFIX);
  }
  _exports.isTechnicalFieldKey = isTechnicalFieldKey;
  function isEditableField(fieldName, editableFields) {
    return editableFields[fieldName]?.isEditable === true;
  }
  _exports.isEditableField = isEditableField;
  function getFieldFormElementLabel(fieldMapping, updatedField) {
    const fieldDescription = fieldMapping[updatedField]?.description;
    return fieldDescription && fieldDescription.length > 0 ? fieldDescription : updatedField;
  }
  _exports.getFieldFormElementLabel = getFieldFormElementLabel;
  function formatFieldValue(metaModel, bindingContext, updatedField, rawValue) {
    if (rawValue == null || rawValue === "") {
      return "";
    }
    try {
      const targetMetaPath = metaModel.getMetaPath(bindingContext.getPath(updatedField));
      const targetMetaContext = metaModel.createBindingContext(targetMetaPath);
      const valueExpression = AnnotationHelper.format(targetMetaContext.getObject(), {
        context: targetMetaContext
      });
      const parsedBinding = BindingInfo.parse(valueExpression);
      if (parsedBinding?.type) {
        return parsedBinding.type.formatValue(rawValue, "string") ?? "-";
      }
    } catch (e) {
      Log.warning("Failed to format value for field " + updatedField);
    }
    return String(rawValue);
  }
  _exports.formatFieldValue = formatFieldValue;
  function getFormattedCurrentValue(view, metaModel, bindingContext, updatedField) {
    const rawValue = view?.getBindingContext()?.getObject()?.[updatedField];
    if (rawValue == null || rawValue === "") {
      return "-";
    }
    return formatFieldValue(metaModel, bindingContext, updatedField, rawValue);
  }
  _exports.getFormattedCurrentValue = getFormattedCurrentValue;
  function applyValidationResultToField(field, errorMessage) {
    if (errorMessage.length > 0) {
      setTimeout(() => {
        const messageId = field.addMessage({
          type: MessageType.Error,
          message: errorMessage
        });
        field.data("messageId", messageId);
      }, 200);
    }
  }
  _exports.applyValidationResultToField = applyValidationResultToField;
  async function validateFieldValue(metaModel, bindingContext, updatedField, updatedFields, getValueList, getTranslatedText) {
    const targetMetaPath = metaModel.getMetaPath(bindingContext.getPath(updatedField));
    const targetMetaContext = metaModel.createBindingContext(targetMetaPath);
    const valueExpression = AnnotationHelper.format(targetMetaContext.getObject(), {
      context: targetMetaContext
    });
    const parsedBinding = BindingInfo.parse(valueExpression);
    let errorMessage = "";
    let hasError = false;
    if (parsedBinding && parsedBinding.type) {
      try {
        const valueForValidation = typeof updatedFields[updatedField] === "number" ? String(updatedFields[updatedField]) : updatedFields[updatedField];
        parsedBinding.type.validateValue(valueForValidation);
      } catch (e) {
        hasError = true;
        errorMessage = e.message;
        Log.error("Validation error for field " + updatedField + ": ", errorMessage);
      }
    }
    const valueList = await getValueList(targetMetaPath);
    if (valueList && ValueListHelper.isValueListSearchable(targetMetaPath, valueList)) {
      const values = await resolveTokenValue(valueList, {
        operator: FilterOperator.EQ,
        selectedValues: [updatedFields[updatedField]]
      }, true);
      if (values[0].noMatch !== true) {
        updatedFields[updatedField] = values[0].selectedValues[0].value;
        errorMessage = "";
        hasError = false;
      } else {
        hasError = true;
        errorMessage = getTranslatedText("C_EASYEDIT_VH_ERROR", [values[0].selectedValues[0].value]);
      }
    }
    return {
      errorMessage,
      hasError
    };
  }
  _exports.validateFieldValue = validateFieldValue;
  return _exports;
}, false);
//# sourceMappingURL=FieldHelper-dbg.js.map
