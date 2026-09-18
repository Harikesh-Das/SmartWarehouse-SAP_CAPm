/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/macros/ai/easyfill/FieldHelper", "sap/fe/macros/ai/EasyFillLayoutMode", "sap/m/MessageStrip", "sap/m/Title", "sap/m/VBox", "sap/ui/core/library", "sap/ui/layout/form/ColumnLayout", "sap/ui/layout/form/Form", "sap/uxap/ObjectPageSubSection", "sap/fe/base/jsx-runtime/jsx"], function (Log, EasyFillFieldHelper, $EasyFillLayoutMode, MessageStrip, Title, VBox, library, ColumnLayout, Form, ObjectPageSubSection, _jsx) {
  "use strict";

  var _exports = {};
  var TitleLevel = library.TitleLevel;
  var EasyFillLayoutMode = $EasyFillLayoutMode.EasyFillLayoutMode;
  /**
   * Creates a new editable review area form with a column layout.
   * @returns Editable Form control.
   */
  function createReviewAreaForm() {
    return _jsx(Form, {
      editable: true,
      class: "sapFeEasyFillForm",
      children: {
        layout: _jsx(ColumnLayout, {
          columnsM: 2,
          columnsL: 3,
          columnsXL: 4
        })
      }
    });
  }

  /**
   * Creates a new non-editable form for displaying incorrect values.
   * @returns Non-editable Form control.
   */
  _exports.createReviewAreaForm = createReviewAreaForm;
  function createIncorrectValuesForm() {
    return _jsx(Form, {
      editable: false,
      class: "sapFeEasyFillForm",
      children: {
        layout: _jsx(ColumnLayout, {
          columnsM: 2,
          columnsL: 3,
          columnsXL: 4
        })
      }
    });
  }

  /**
   * Creates a single ObjectPageSubSection with the given blocks and optional title.
   * @param subSectionId The subsection element ID.
   * @param blocks Content blocks to place in the subsection.
   * @param title Optional subsection title.
   * @returns ObjectPageSubSection control.
   */
  _exports.createIncorrectValuesForm = createIncorrectValuesForm;
  function createObjectPageSubSection(subSectionId, blocks, title) {
    return _jsx(ObjectPageSubSection, {
      id: subSectionId,
      titleUppercase: false,
      title: title,
      class: "sapFeEasyFillSubsection",
      children: {
        blocks: blocks
      }
    });
  }

  /**
   * Builds a warning UI element for the case where all AI-proposed rows are new (creation not allowed).
   * @param ctx The review area context.
   * @param collectionMetadata Metadata for the collection field.
   * @returns Warning MessageStrip (condensed: wrapped in VBox with title).
   */
  _exports.createObjectPageSubSection = createObjectPageSubSection;
  function buildAllNewRowsWarning(ctx, collectionMetadata) {
    const warningStrip = _jsx(MessageStrip, {
      text: ctx.getTranslatedText("C_EASYEDIT_TABLE_NEW_ROW_NOT_ALLOWED"),
      type: "Warning",
      showIcon: true
    });
    if (ctx.selectedLayoutMode === EasyFillLayoutMode.CONDENSED) {
      return _jsx(VBox, {
        class: "sapUiSmallMargin",
        children: {
          items: [new Title({
            text: collectionMetadata.description,
            level: TitleLevel.H5
          }), warningStrip]
        }
      });
    }
    return warningStrip;
  }

  /**
   * Wraps a table diff VBox with a "new rows not allowed" warning strip above it.
   * @param ctx The review area context.
   * @param diffTable The table preview VBox to wrap.
   * @returns VBox containing warning strip and diff table.
   */
  _exports.buildAllNewRowsWarning = buildAllNewRowsWarning;
  function buildMixedRowsPreviewWithWarning(ctx, diffTable) {
    return _jsx(VBox, {
      children: {
        items: [_jsx(MessageStrip, {
          text: ctx.getTranslatedText("C_EASYEDIT_TABLE_NEW_ROW_NOT_ALLOWED"),
          type: "Warning",
          showIcon: true
        }), diffTable]
      }
    });
  }

  /**
   * Creates all ObjectPageSubSection controls for one review section.
   * In detailed mode, Title+Form pairs in reviewAreaBlocks become named subsections.
   * In condensed mode, all content goes into a single default subsection.
   * Each table VBox always gets its own dedicated subsection.
   * @param ctx The review area context.
   * @param baseSubSectionId Base ID prefix for generated subsections.
   * @param reviewAreaBlocks Review blocks from field content.
   * @param hasSectionIncorrectValues Whether the incorrect values form has content.
   * @param incorrectValuesForm Form containing incorrect (non-editable) field values.
   * @param tableVBoxes Table preview VBoxes, each rendered in its own subsection.
   * @returns List of ObjectPageSubSection controls.
   */
  _exports.buildMixedRowsPreviewWithWarning = buildMixedRowsPreviewWithWarning;
  function createObjectPageSubSections(ctx, baseSubSectionId, reviewAreaBlocks, hasSectionIncorrectValues, incorrectValuesForm) {
    let tableVBoxes = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : [];
    const defaultSubSectionBlocks = [];
    const subSectionEntries = [];
    const subSections = [];
    let generatedSubSectionIndex = 0;
    let index = 0;
    while (index < reviewAreaBlocks.length) {
      const block = reviewAreaBlocks[index];
      const nextBlock = reviewAreaBlocks[index + 1];
      const isDetailedMode = ctx.selectedLayoutMode === EasyFillLayoutMode.DETAILED;
      if (isDetailedMode && block instanceof Title && nextBlock instanceof Form) {
        subSectionEntries.push({
          title: block.getText(),
          form: nextBlock
        });
        index += 2;
        continue;
      }
      defaultSubSectionBlocks.push(block);
      index++;
    }
    for (const subSectionEntry of subSectionEntries) {
      const wrappedForm = _jsx(VBox, {
        children: {
          items: [subSectionEntry.form]
        }
      });
      subSections.push(createObjectPageSubSection(`${baseSubSectionId}_${generatedSubSectionIndex}`, [wrappedForm], subSectionEntry.title));
      generatedSubSectionIndex++;
    }
    if (hasSectionIncorrectValues) {
      const incorrectFieldsTitle = _jsx(Title, {
        text: ctx.getTranslatedText("C_EASYEDIT_INCORRECT_FIELDS"),
        class: "sapUiSmallMarginBegin"
      });
      const fieldContainer = _jsx(VBox, {
        children: {
          items: ctx.selectedLayoutMode === EasyFillLayoutMode.CONDENSED ? [incorrectFieldsTitle, incorrectValuesForm] : [incorrectValuesForm]
        }
      });
      defaultSubSectionBlocks.push(fieldContainer);
    }
    if (defaultSubSectionBlocks.length > 0 || subSections.length === 0 && tableVBoxes.length === 0) {
      const wrappedBlocks = _jsx(VBox, {
        children: {
          items: defaultSubSectionBlocks
        }
      });
      subSections.unshift(createObjectPageSubSection(`${baseSubSectionId}_${generatedSubSectionIndex}`, [wrappedBlocks]));
      generatedSubSectionIndex++;
    }
    for (const tableVBox of tableVBoxes) {
      subSections.push(createObjectPageSubSection(`${baseSubSectionId}_table_${generatedSubSectionIndex}`, [tableVBox]));
      generatedSubSectionIndex++;
    }
    return subSections;
  }

  /**
   * Determines which fields in updatedFields are editable and which are not.
   * Skips collection fields and fields with non-scalar values.
   * @param fieldMapping The current field metadata map.
   * @param updatedFields The AI-proposed field values.
   * @param getEditableFields Async function returning the editable fields map.
   * @returns Lists of editable and non-editable field names.
   */
  _exports.createObjectPageSubSections = createObjectPageSubSections;
  async function getEditableAndNotEditableFieldNames(fieldMapping, updatedFields, getEditableFields) {
    const editableFields = await getEditableFields();
    const editableFieldNames = [];
    const nonEditableFieldNames = [];
    for (const fieldName of Object.keys(updatedFields)) {
      if (fieldMapping[fieldName]?.isCollection === true) {
        continue;
      }
      const value = updatedFields[fieldName];
      if (value !== null && typeof value === "object") {
        const valueKind = Array.isArray(value) ? "array" : "object";
        Log.warning(`EasyFill: unexpected ${valueKind} value for scalar field "${fieldName}", skipping`);
        continue;
      }
      if (EasyFillFieldHelper.isEditableField(fieldName, editableFields)) {
        editableFieldNames.push(fieldName);
      } else {
        nonEditableFieldNames.push(fieldName);
      }
    }
    return {
      editableFieldNames,
      nonEditableFieldNames
    };
  }

  /** Structure describing how editable fields are organized into subsections. */
  _exports.getEditableAndNotEditableFieldNames = getEditableAndNotEditableFieldNames;
  /**
   * Groups editable fields by their section-subsection and field-subsection titles for detailed layout mode.
   * @param fieldMapping The current field metadata map.
   * @param editableFieldNames List of editable field names to organize.
   * @returns Ordered subsection titles and grouped field hierarchy.
   */
  function organizeFieldsBySectionSubsections(fieldMapping, editableFieldNames) {
    const sectionSubsectionOrder = [];
    const fieldsBySectionSubsection = {};
    for (const fieldName of editableFieldNames) {
      const sectionSubsectionTitle = fieldMapping[fieldName]?.sectionSubsection ?? "";
      const fieldSubsectionTitle = fieldMapping[fieldName]?.fieldSubsection;
      if (fieldsBySectionSubsection[sectionSubsectionTitle] === undefined) {
        fieldsBySectionSubsection[sectionSubsectionTitle] = {
          noFieldSubsectionFields: [],
          fieldSubsectionOrder: [],
          fieldsByFieldSubsection: {}
        };
        sectionSubsectionOrder.push(sectionSubsectionTitle);
      }
      const sectionSubsectionData = fieldsBySectionSubsection[sectionSubsectionTitle];
      if (fieldSubsectionTitle === undefined) {
        sectionSubsectionData.noFieldSubsectionFields.push(fieldName);
        continue;
      }
      if (sectionSubsectionData.fieldsByFieldSubsection[fieldSubsectionTitle] === undefined) {
        sectionSubsectionData.fieldsByFieldSubsection[fieldSubsectionTitle] = [];
        sectionSubsectionData.fieldSubsectionOrder.push(fieldSubsectionTitle);
      }
      sectionSubsectionData.fieldsByFieldSubsection[fieldSubsectionTitle].push(fieldName);
    }
    return {
      sectionSubsectionOrder,
      fieldsBySectionSubsection
    };
  }
  _exports.organizeFieldsBySectionSubsections = organizeFieldsBySectionSubsections;
  return _exports;
}, false);
//# sourceMappingURL=ReviewAreaBuilder-dbg.js.map
