/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/macros/Field", "sap/fe/macros/ai/easyfill/FieldHelper", "sap/fe/macros/ai/easyfill/ReviewAreaBuilder", "sap/m/Input", "sap/m/Text", "sap/m/Title", "sap/ui/core/CustomData", "sap/ui/layout/form/FormContainer", "sap/ui/layout/form/FormElement", "sap/fe/base/jsx-runtime/jsx"], function (Field, EasyFillFieldHelper, EasyFillReviewAreaBuilder, Input, Text, Title, CustomData, FormContainer, FormElement, _jsx) {
  "use strict";

  var _exports = {};
  /** All dependencies the field form builder needs from EasyFillDialog. */
  /**
   * Creates an editable Field control for the given field name.
   * @param ctx The field form builder context.
   * @param updatedField Name of the updated field.
   * @returns Editable Field control.
   */
  function createEditableField(ctx, updatedField) {
    return ctx.runAsOwner(() => {
      return _jsx(Field, {
        _requiresValidation: true,
        validateFieldGroup: ctx.onValidateFieldGroups,
        fieldGroupIds: "EasyFillField",
        metaPath: updatedField,
        contextPath: ctx.ownerContextPath,
        change: ctx.onFieldChange
      });
    });
  }

  /**
   * Creates a FormContainer bound to the data and UI binding contexts.
   * @param ctx The field form builder context.
   * @param uiContext The UI model binding context.
   * @returns FormContainer with both contexts set.
   */
  _exports.createEditableField = createEditableField;
  function createFieldFormContainer(ctx, uiContext) {
    const fieldFormContainer = _jsx(FormContainer, {});
    fieldFormContainer.setBindingContext(ctx.bindingContext);
    fieldFormContainer.setBindingContext(uiContext, "ui");
    return fieldFormContainer;
  }

  /**
   * Creates a Text control showing the pre-AI value of a field.
   * @param ctx The field form builder context.
   * @param updatedField Name of the updated field.
   * @returns Text control with the previous value and a labelled custom data entry.
   */
  _exports.createFieldFormContainer = createFieldFormContainer;
  function createPreviousValueText(ctx, updatedField) {
    const formattedValue = EasyFillFieldHelper.getFormattedCurrentValue(ctx.view, ctx.metaModel, ctx.bindingContext, updatedField);
    const text = _jsx(Text, {
      text: formattedValue,
      class: "sapFeEasyFillPreviousValue"
    });
    text.addCustomData(new CustomData({
      key: "label",
      value: ctx.getTranslatedText("C_EASYEDIT_PREVIOUS_VALUE") + ": ",
      writeToDom: true
    }));
    return text;
  }

  /**
   * Creates a non-editable FormContainer displaying the AI-proposed value of a field.
   * @param ctx The field form builder context.
   * @param updatedField Name of the updated field.
   * @param updatedFields All AI-proposed field values.
   * @param uiContext The UI model binding context.
   * @returns FormContainer with a read-only Input and previous value text.
   */
  _exports.createPreviousValueText = createPreviousValueText;
  function createNonEditableFieldFormContainer(ctx, updatedField, updatedFields, uiContext) {
    const formattedValue = EasyFillFieldHelper.formatFieldValue(ctx.metaModel, ctx.bindingContext, updatedField, updatedFields[updatedField]);
    const nonEditableField = ctx.runAsOwner(() => {
      return _jsx(Input, {
        value: formattedValue,
        editable: false
      });
    });
    const fieldFormContainer = createFieldFormContainer(ctx, uiContext);
    const previousValueText = createPreviousValueText(ctx, updatedField);
    const formElementLabel = EasyFillFieldHelper.getFieldFormElementLabel(ctx.fieldMapping, updatedField);
    const formElement = _jsx(FormElement, {
      label: formElementLabel,
      children: {
        fields: [nonEditableField, previousValueText]
      }
    });
    fieldFormContainer.addFormElement(formElement);
    return fieldFormContainer;
  }

  /**
   * Creates an editable FormContainer for an AI-proposed field value, runs validation.
   * @param ctx The field form builder context.
   * @param updatedField Name of the updated field.
   * @param updatedFields All AI-proposed field values.
   * @param uiContext The UI model binding context.
   * @returns Promise resolved with the created FormContainer.
   */
  _exports.createNonEditableFieldFormContainer = createNonEditableFieldFormContainer;
  async function createEditableFieldContainer(ctx, updatedField, updatedFields, uiContext) {
    ctx.onHasValues();
    const newField = createEditableField(ctx, updatedField);
    const fieldFormContainer = createFieldFormContainer(ctx, uiContext);
    const previousValueText = createPreviousValueText(ctx, updatedField);
    const formElementLabel = EasyFillFieldHelper.getFieldFormElementLabel(ctx.fieldMapping, updatedField);
    const formElement = _jsx(FormElement, {
      label: formElementLabel,
      children: {
        fields: [newField, previousValueText]
      }
    });
    fieldFormContainer.addFormElement(formElement);
    const {
      errorMessage,
      hasError
    } = await EasyFillFieldHelper.validateFieldValue(ctx.metaModel, ctx.bindingContext, updatedField, updatedFields, ctx.getValueList, ctx.getTranslatedText);
    if (hasError) {
      ctx.onHasError();
    }
    ctx.bindingContext?.setProperty(updatedField, updatedFields[updatedField]);
    EasyFillFieldHelper.applyValidationResultToField(newField, errorMessage);
    return fieldFormContainer;
  }

  /**
   * Fills the incorrect values form with non-editable containers for each non-editable field.
   * @param ctx The field form builder context.
   * @param nonEditableFieldNames Field names that are not editable.
   * @param updatedFields All AI-proposed field values.
   * @param uiContext The UI model binding context.
   * @param incorrectValues Output map collecting the incorrect field values.
   * @param incorrectValuesForm Form to add the containers to.
   */
  _exports.createEditableFieldContainer = createEditableFieldContainer;
  function populateIncorrectValuesForm(ctx, nonEditableFieldNames, updatedFields, uiContext, incorrectValues, incorrectValuesForm) {
    for (const fieldName of nonEditableFieldNames) {
      incorrectValues[fieldName] = updatedFields[fieldName];
      const fieldFormContainer = createNonEditableFieldFormContainer(ctx, fieldName, updatedFields, uiContext);
      incorrectValuesForm.addFormContainer(fieldFormContainer);
    }
  }

  /**
   * Fills review area blocks with one form per section-subsection in detailed layout mode.
   * @param ctx The field form builder context.
   * @param editableFieldNames Editable field names to render.
   * @param updatedFields All AI-proposed field values.
   * @param uiContext The UI model binding context.
   * @param newValues Output map collecting new field values.
   * @param reviewAreaBlocks Output array of review area UI elements.
   */
  _exports.populateIncorrectValuesForm = populateIncorrectValuesForm;
  async function populateDetailedReviewAreaBlocks(ctx, editableFieldNames, updatedFields, uiContext, newValues, reviewAreaBlocks) {
    const {
      sectionSubsectionOrder,
      fieldsBySectionSubsection
    } = EasyFillReviewAreaBuilder.organizeFieldsBySectionSubsections(ctx.fieldMapping, editableFieldNames);
    for (const sectionSubsectionTitle of sectionSubsectionOrder) {
      const sectionSubsectionData = fieldsBySectionSubsection[sectionSubsectionTitle];
      const sectionSubsectionForm = EasyFillReviewAreaBuilder.createReviewAreaForm();
      for (const fieldName of sectionSubsectionData.noFieldSubsectionFields) {
        newValues[fieldName] = updatedFields[fieldName];
        const fieldFormContainer = await createEditableFieldContainer(ctx, fieldName, updatedFields, uiContext);
        sectionSubsectionForm.addFormContainer(fieldFormContainer);
      }
      await addFieldSubsectionContainers(ctx, sectionSubsectionData, updatedFields, uiContext, newValues, sectionSubsectionForm);
      if (sectionSubsectionForm.getFormContainers().length > 0) {
        if (sectionSubsectionTitle.length > 0) {
          reviewAreaBlocks.push(_jsx(Title, {
            text: sectionSubsectionTitle
          }));
        }
        reviewAreaBlocks.push(sectionSubsectionForm);
      }
    }
  }

  /**
   * Adds field-subsection-grouped FormContainers to a section form in detailed layout mode.
   * @param ctx The field form builder context.
   * @param sectionSubsectionData Subsection grouping data from organizeFieldsBySectionSubsections.
   * @param updatedFields All AI-proposed field values.
   * @param uiContext The UI model binding context.
   * @param newValues Output map collecting new field values.
   * @param sectionSubsectionForm The form to add the subsection containers to.
   */
  _exports.populateDetailedReviewAreaBlocks = populateDetailedReviewAreaBlocks;
  async function addFieldSubsectionContainers(ctx, sectionSubsectionData, updatedFields, uiContext, newValues, sectionSubsectionForm) {
    for (const fieldSubsectionTitle of sectionSubsectionData.fieldSubsectionOrder) {
      const fieldSubsectionContainer = createFieldFormContainer(ctx, uiContext);
      fieldSubsectionContainer.setTitle(fieldSubsectionTitle);
      for (const fieldName of sectionSubsectionData.fieldsByFieldSubsection[fieldSubsectionTitle]) {
        newValues[fieldName] = updatedFields[fieldName];
        const fieldFormContainer = await createEditableFieldContainer(ctx, fieldName, updatedFields, uiContext);
        const formElement = fieldFormContainer.getFormElements()[0];
        if (formElement !== undefined) {
          fieldSubsectionContainer.addFormElement(formElement);
        }
      }
      if (fieldSubsectionContainer.getFormElements().length > 0) {
        sectionSubsectionForm.addFormContainer(fieldSubsectionContainer);
      }
    }
  }

  /**
   * Fills review area blocks with a single form containing all editable fields in condensed layout mode.
   * @param ctx The field form builder context.
   * @param editableFieldNames Editable field names to render.
   * @param updatedFields All AI-proposed field values.
   * @param uiContext The UI model binding context.
   * @param newValues Output map collecting new field values.
   * @param reviewAreaBlocks Output array of review area UI elements.
   */
  _exports.addFieldSubsectionContainers = addFieldSubsectionContainers;
  async function populateCondensedReviewAreaBlocks(ctx, editableFieldNames, updatedFields, uiContext, newValues, reviewAreaBlocks) {
    const reviewAreaForm = EasyFillReviewAreaBuilder.createReviewAreaForm();
    for (const fieldName of editableFieldNames) {
      newValues[fieldName] = updatedFields[fieldName];
      const fieldFormContainer = await createEditableFieldContainer(ctx, fieldName, updatedFields, uiContext);
      reviewAreaForm.addFormContainer(fieldFormContainer);
    }
    if (reviewAreaForm.getFormContainers().length > 0) {
      reviewAreaBlocks.push(reviewAreaForm);
    }
  }
  _exports.populateCondensedReviewAreaBlocks = populateCondensedReviewAreaBlocks;
  return _exports;
}, false);
//# sourceMappingURL=FieldFormBuilder-dbg.js.map
