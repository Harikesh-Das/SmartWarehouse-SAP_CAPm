/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/FieldControlHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/Field", "sap/fe/macros/contact/Contact", "sap/m/FlexBox", "sap/m/FlexItemData", "sap/m/HBox", "sap/m/Label", "sap/m/MessageStrip", "sap/m/OverflowToolbar", "sap/m/Text", "sap/m/Title", "sap/m/ToolbarSpacer", "sap/m/VBox", "sap/ui/core/CustomData", "sap/ui/core/InvisibleText", "sap/ui/core/Title", "sap/ui/layout/form/ColumnElementData", "sap/ui/layout/form/FormContainer", "sap/ui/layout/form/FormElement", "../CommonHelper", "../MultiValueField", "../controls/FieldWrapper", "../controls/RequiredFlexBox", "../field/FieldFormatOptions", "../field/FieldTemplating", "../multivaluefield/FormatOptions", "./CustomFormElement", "./FormActionButtons", "./FormContainerAPI", "./FormHelper", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (BindingToolkit, MetaModelConverter, StableIDHelper, DataModelPathHelper, FieldControlHelper, UIFormatters, Field, Contact, FlexBox, FlexItemData, HBox, Label, MessageStrip, OverflowToolbar, Text, MTitle, ToolbarSpacer, VBox, CustomData, InvisibleText, Title, ColumnElementData, FormContainer, UI5FormElement, CommonHelper, MultiValueFieldBlock, FieldWrapper, RequiredFlexBox, FieldFormatOptions, FieldTemplating, FormatOptions, MacroCustomFormElement, FormActionButtons, FormContainerAPI, FormHelper, _jsx, _jsxs) {
  "use strict";

  var _exports = {};
  var getFormActionButtons = FormActionButtons.getFormActionButtons;
  var getVisibleExpression = FieldTemplating.getVisibleExpression;
  var getDataModelObjectPathForValue = FieldTemplating.getDataModelObjectPathForValue;
  var isMultiValueField = UIFormatters.isMultiValueField;
  var isRequiredExpression = FieldControlHelper.isRequiredExpression;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var pathInModel = BindingToolkit.pathInModel;
  var equal = BindingToolkit.equal;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  /**
   * Get the MessageStrip text binding expression for a field group.
   * @param fieldGroupFullyQualifiedName The fully qualified name of the field group
   * @returns The binding expression for the MessageStrip text
   */
  function getMessageStripTextExpression(fieldGroupFullyQualifiedName) {
    return fieldGroupFullyQualifiedName ? compileExpression(pathInModel(`internal>/${fieldGroupFullyQualifiedName}/valueStateText`)) : "";
  }

  /**
   * Get the MessageStrip visibility binding expression for a field group.
   * @param fieldGroupFullyQualifiedName The fully qualified name of the field group
   * @param requiredExpressionRaw The raw required expression (uncompiled) for the field group
   * @returns The binding expression for the MessageStrip visibility
   */
  _exports.getMessageStripTextExpression = getMessageStripTextExpression;
  function getMessageStripVisibilityExpression(fieldGroupFullyQualifiedName, requiredExpressionRaw) {
    if (fieldGroupFullyQualifiedName && requiredExpressionRaw) {
      return compileExpression(and(requiredExpressionRaw, equal(pathInModel(`internal>/${fieldGroupFullyQualifiedName}/valueState`), "Error")));
    } else if (fieldGroupFullyQualifiedName) {
      return compileExpression(equal(pathInModel(`internal>/${fieldGroupFullyQualifiedName}/valueState`), "Error"));
    }
    return false;
  }

  /**
   * Helper function to generate IDs with the proper prefix using the controller.
   * @param controller The page controller
   * @param idParts The ID parts to generate the stable ID
   * @returns The computed ID
   */
  _exports.getMessageStripVisibilityExpression = getMessageStripVisibilityExpression;
  function createFormElementId(controller) {
    for (var _len = arguments.length, idParts = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      idParts[_key - 1] = arguments[_key];
    }
    const stableId = StableIDHelper.generate(idParts);
    return controller ? controller.createId(stableId) || stableId : stableId;
  }
  /**
   * Create the content for a FormContainer.
   * @param props Props describing the form container such as id, title, actions or dataFieldCollection.
   * @param contextPath Context used to resolve annotation and model paths for contained form elements.
   * @param controller Optional page controller used for the action buttons logic.
   * @param metaPath
   * @returns A `sap.ui.layout.form.FormContainer` control.
   */
  function getFormContainerContent(props, contextPath, controller, metaPath) {
    const {
      id,
      visible,
      title,
      titleLevel,
      macrodata,
      actions,
      dataFieldCollection,
      designtimeSettings,
      slotElements,
      ibnMappingProperties
    } = props;
    const formElements = getFormElements(dataFieldCollection, contextPath, props, slotElements, controller);
    // Collect namespaced / custom attributes not present in the FormContainer TS typings.
    /* const customAttributes: Record<string, unknown> = {
    "macrodata:navigationPath": macrodata.navigationPath,
    "macrodata:etName": macrodata.etName,
    "macrodata:UiHiddenPresent": macrodata.UiHiddenPresent
    }; */
    const viewId = controller?.getView().createId(id); // ensure the FormContainer ID is registered in the view

    // Get the data model object for binding generation - pass both contextPath and metaPath like in FormContainer.block.ts
    const dataModelObject = getInvolvedDataModelObjects(contextPath, metaPath);
    return _jsx(FormContainer, {
      id: viewId,
      visible: visible,
      "dt:designtime": designtimeSettings === "Default" || !designtimeSettings ? "sap/fe/macros/form/FormContainer.designtime" : designtimeSettings,
      children: {
        customData: [_jsx(CustomData, {
          value: macrodata.navigationPath
        }, "navigationPath"), _jsx(CustomData, {
          value: macrodata.etName
        }, "etName"), _jsx(CustomData, {
          value: macrodata.UiHiddenPresent
        }, "UiHiddenPresent"), macrodata.navigationPropertiesForAdaptationDialog ? _jsx(CustomData, {
          value: macrodata.navigationPropertiesForAdaptationDialog
        }, "navigationPropertiesForAdaptationDialog") : undefined],
        title: getTitle(title, titleLevel),
        toolbar: getActionToolbar(id, actions, title, titleLevel, contextPath, controller, macrodata.navigationPath, dataModelObject, ibnMappingProperties),
        formElements: formElements,
        dependents: (() => {
          const formContainerAPI = new FormContainerAPI({
            formContainerId: id
          });
          formContainerAPI.bindProperty("showDetails", {
            path: "showDetails",
            model: "internal"
          });
          return formContainerAPI;
        })()
      }
    });
  }

  /**
   * Create a Title control for the form container.
   * @param formContainerTitle Title text to display.
   * @param formContainerTitleLevel Title level for accessibility and styling.
   * @returns A `sap.ui.core.Title` control.
   */
  _exports.getFormContainerContent = getFormContainerContent;
  function getTitle(formContainerTitle, formContainerTitleLevel) {
    if (!formContainerTitle || !formContainerTitleLevel && formContainerTitle.length === 0) {
      return undefined;
    }
    return _jsx(Title, {
      text: formContainerTitle,
      level: formContainerTitleLevel
    });
  }

  /**
   * Create a toolbar Title control used inside the action toolbar.
   * @param formContainerTitle Title text to display.
   * @param formContainerTitleLevel Title level accessibility and styling.
   * @returns A TitleToolbar control.
   */
  function getToolbarTitle(formContainerTitle, formContainerTitleLevel) {
    if (!formContainerTitle || !formContainerTitleLevel) {
      return undefined;
    }
    return _jsx(MTitle, {
      text: formContainerTitle,
      level: formContainerTitleLevel
    });
  }

  /**
   * Create an OverflowToolbar containing action buttons for the form container.
   * The toolbar contains an optional title and the action buttons produced by `getFormActionButtons`.
   * @param id The form container ID used to generate stable IDs for the toolbar.
   * @param actions Array of actions metadata used to create toolbar buttons.
   * @param formContainerTitle Title text to display.
   * @param formContainerTitleLevel Title level accessibility and styling.
   * @param context Binding context.
   * @param controller Optional page controller used for the button creation logic.
   * @param navigationPath Optional navigation path for binding.
   * @param dataModelObject Optional data model object path for binding generation.
   * @param ibnMappingProperties Optional intent-based navigation mapping for local properties to $select.
   * @returns An `sap.m.OverflowToolbar` control with action buttons or undefined if there are no actions.
   */
  function getActionToolbar(id, actions, formContainerTitle, formContainerTitleLevel, context, controller, navigationPath, dataModelObject, ibnMappingProperties) {
    if (!actions || actions.length === 0) {
      return undefined;
    }
    const overflowToolbarID = id ? createFormElementId(controller, id, "FormActionsToolbar") : undefined;
    const bindingString = FormHelper.generateBindingExpression(navigationPath, dataModelObject, ibnMappingProperties);
    return _jsxs(OverflowToolbar, {
      id: overflowToolbarID,
      binding: bindingString,
      children: [getToolbarTitle(formContainerTitle, formContainerTitleLevel), _jsx(ToolbarSpacer, {}), getFormActionButtons(actions, context, controller)]
    });
  }

  /**
   * Create an array of form element controls for the given data field collection.
   * @param dataFieldCollection Collection of data fields.
   * @param contextPath Binding context used to compute each element.
   * @param formContainerProps FormContainer level properties used in generating the form elements.
   * @param slotElements Additional slot controls for inline custom form elements.
   * @param controller
   * @returns An array of form elements controls.
   */
  function getFormElements(dataFieldCollection, contextPath, formContainerProps, slotElements, controller) {
    if (!dataFieldCollection || dataFieldCollection.length === 0) {
      return undefined;
    }
    // DataPoint template handling
    const firstElementWithAnnotationPath = dataFieldCollection.find(df => !!df.annotationPath);
    if (firstElementWithAnnotationPath?.annotationPath && firstElementWithAnnotationPath.annotationPath.includes("com.sap.vocabularies.UI.v1.DataPoint")) {
      const dataPointElement = getDataPointFormElement(firstElementWithAnnotationPath, contextPath, getFormElementProps(firstElementWithAnnotationPath, contextPath, formContainerProps, controller), formContainerProps);
      return [dataPointElement];
    }

    // Contact template handling
    if (dataFieldCollection[0]?.annotationPath && dataFieldCollection[0].annotationPath.includes("com.sap.vocabularies.Communication.v1.Contact")) {
      const contactElement = getContactFormElement(dataFieldCollection[0], contextPath, getFormElementProps(dataFieldCollection[0], contextPath, formContainerProps, controller));
      return [contactElement];
    }

    // Regular form element template handling
    let mappedFormElements = dataFieldCollection.map(formElement => getFormElement(formElement, contextPath, formContainerProps, controller, slotElements));
    mappedFormElements = mappedFormElements.filter(formElement => formElement !== undefined);
    return mappedFormElements;
  }

  /**
   * Creates a UI5 FormElement control for the provided form element descriptor.
   * @param formElement Descriptor of the form element to render.
   * @param contextPath Binding context used to resolve annotation/model paths for the form elements.
   * @param formContainerProps FormContainer level properties used in generating the form elements.
   * @param controller
   * @param slotElements
   * @returns A `sap.ui.core.Control` representing the form element.
   */
  function getFormElement(formElement, contextPath, formContainerProps, controller, slotElements) {
    const formElementProps = getFormElementProps(formElement, contextPath, formContainerProps, controller);
    let computedDataModelObject;
    let propertyPath;
    if (formElement.type === "Default") {
      const customFormElement = formElement;
      propertyPath = contextPath.getPath(customFormElement.propertyPath);
      computedDataModelObject = getInvolvedDataModelObjects(contextPath.getModel().createBindingContext(propertyPath));
    } else if (formElement.annotationPath) {
      computedDataModelObject = getInvolvedDataModelObjects(contextPath.getModel().createBindingContext(formElement.annotationPath ?? ""));
    }
    switch (formElement.type) {
      case "Annotation":
        {
          if (formElement.connectedFields && formElement.connectedFields.length > 0) {
            return getConnectedFieldsFormElement(formElement, contextPath, formElementProps, formContainerProps, controller);
          } else if (isMultiValueDataField(formElement, contextPath)) {
            return getMultiValueFieldFormElement(formElement, contextPath, formElementProps, formContainerProps, controller);
          } else if (formElement.fieldGroupElements && formElement.fieldGroupElements.length > 0) {
            return getFieldGroupFormElement(formElement, contextPath, formElementProps, formContainerProps, controller);
          } else {
            return getFieldFormElement(formElement, contextPath, formElementProps, formContainerProps, computedDataModelObject, controller);
          }
          break;
        }
      case "Default":
        {
          const targetId = createFormElementId(controller, formContainerProps.id ?? "", formElement.id ?? "");
          const fragmentId = createFormElementId(controller, formContainerProps.id ?? "", formElement.key);
          return getCustomFormElement(targetId, formElement, formElementProps, contextPath, fragmentId);
          break;
        }
      default:
        {
          return getSlotColumn(formElement, slotElements);
          break;
        }
    }
  }

  /**
   * Helper function to create form element properties.
   * @param formElement The form element descriptor.
   * @param contextPath The binding context.
   * @param formContainerProps FormContainer level properties.
   * @param controller
   * @returns Form element properties object.
   */
  function getFormElementProps(formElement, contextPath, formContainerProps, controller) {
    let computedDataModelObject;
    let propertyPath;
    if (formElement.type === "Default") {
      const customFormElement = formElement;
      propertyPath = contextPath.getPath(customFormElement.propertyPath);
      computedDataModelObject = getInvolvedDataModelObjects(contextPath.getModel().createBindingContext(propertyPath));
    } else if (formElement.annotationPath) {
      computedDataModelObject = getInvolvedDataModelObjects(contextPath.getModel().createBindingContext(formElement.annotationPath ?? ""));
    }

    // Priority: 1. Explicit non-Default manifest flexSettings, 2. UI.AdaptationHidden annotation, 3. Default file path
    // When flexSettings.designtime is "Default", it means "use default behavior" which includes checking UI.AdaptationHidden
    let designtime;
    if (formElement.flexSettings?.designtime && formElement.flexSettings.designtime !== "Default") {
      // Use explicit non-Default manifest setting
      designtime = formElement.flexSettings.designtime;
    } else {
      // No flexSettings OR explicit "Default" → use default logic (check annotation, then default file)
      designtime = computedDataModelObject?.targetObject?.annotations?.UI?.AdaptationHidden ? "not-adaptable-tree" : "sap/fe/macros/form/FormElement.designtime";
    }
    const visibleExpression = formElement.isPartOfPreview === true ? getVisibleExpression(computedDataModelObject) : "{= ${internal>showDetails} === true}";
    return {
      computedIdPrefix: formContainerProps.id ? createFormElementId(controller, formContainerProps.id, "FormElement", formElement.key) : "",
      computedVhIdPrefix: createFormElementId(controller, formContainerProps.id, "FieldValueHelp"),
      bindingString: FormHelper.generateBindingExpression(formContainerProps.macrodata.navigationPath, computedDataModelObject, formContainerProps.ibnMappingProperties),
      visibleExpression: visibleExpression,
      designtime: designtime
    };
  }

  /**
   * Determines if the given field is a multi-input field.
   * @param formElement The form element descriptor.
   * @param contextPath The context.
   * @returns True if the data field is a multi-input field, false otherwise.
   */
  function isMultiValueDataField(formElement, contextPath) {
    let isMultiValueFieldCondition = false;
    if (formElement.annotationPath) {
      const bindingContext = contextPath.getModel().createBindingContext(formElement.annotationPath);
      const valuePath = bindingContext.getObject()?.Value?.$Path;
      if (valuePath) {
        isMultiValueFieldCondition = isMultiValueField(enhanceDataModelPath(getInvolvedDataModelObjects(bindingContext), valuePath));
      }
    }
    return isMultiValueFieldCondition;
  }

  /**
   * Create controls for connected fields to be used in the form element.
   * @param formElement Parent form element descriptor.
   * @param connectedField Metadata describing the connected field.
   * @param index Index of the connected field in the collection.
   * @param total Total number of connected fields.
   * @param contextPath The binding context used for the field.
   * @param formContainerProps FormContainer level properties used in generating the form elements.
   * @param controller
   * @returns An array of controls representing the connected fields.
   */
  function getConnectedField(formElement, connectedField, index, total, contextPath, formContainerProps, controller) {
    const model = contextPath.getModel();
    const tempName = connectedField.originalObject?.fullyQualifiedName;
    const path = tempName?.substring(tempName.lastIndexOf("/") + 1);
    const bindingContext = model.createBindingContext(formElement.annotationPath + "Target/$AnnotationPath/Data/" + path);

    // the id here had to be changed a bit in order to get the app working - needs to be revised if its still needed
    const propertyPath = connectedField.originalObject?.Value?.path || path || index.toString();
    const connectedFieldId = formContainerProps.id ? StableIDHelper.generate([formContainerProps.id, "SemanticFormElement", formElement.key, propertyPath]) : "";
    const vhIdPrefix = formContainerProps.id ? StableIDHelper.generate([formContainerProps.id, formElement.key, "FieldValueHelp"]) : "";
    const ariaLabelId = controller.createId(StableIDHelper.generate([formContainerProps.id, "AriaText", formElement.key, propertyPath]));
    const ariaLabelledBy = formContainerProps.id ? [controller.createId(StableIDHelper.generate([formContainerProps.id, "SemanticFormElementLabel", formElement.key])), ariaLabelId] : "";
    const computedIdPrefix = controller ? controller.createId(connectedFieldId) || connectedFieldId : connectedFieldId;
    const computedVhIdPrefix = controller ? controller.createId(vhIdPrefix) || vhIdPrefix : vhIdPrefix;

    // we created the field instance because just returning it as tsx throws a _formatters error
    const fieldInstance = new Field({
      contextPath: contextPath.getPath(),
      metaPath: bindingContext.getPath(),
      idPrefix: computedIdPrefix,
      vhIdPrefix: computedVhIdPrefix,
      editMode: formContainerProps.displayMode === true ? "Display" : undefined,
      formatOptions: new FieldFormatOptions({
        displayMode: formElement.formatOptions?.displayMode,
        measureDisplayMode: formElement.formatOptions?.measureDisplayMode,
        showDate: formElement.formatOptions?.showDate,
        showTime: formElement.formatOptions?.showTime,
        showTimezone: formElement.formatOptions?.showTimezone,
        dateTimeStyle: formElement.formatOptions?.dateTimeStyle,
        reactiveAreaMode: formElement.formatOptions?.reactiveAreaMode,
        textLinesEdit: formElement.formatOptions?.textLinesEdit,
        textMaxLines: formElement.formatOptions?.textMaxLines,
        textMaxCharactersDisplay: formElement.formatOptions?.textMaxCharactersDisplay,
        textMaxLength: formElement.formatOptions?.textMaxLength,
        textExpandBehaviorDisplay: formElement.formatOptions?.textExpandBehaviorDisplay,
        textAlignMode: "Form",
        showEmptyIndicator: true,
        fieldEditStyle: formElement.formatOptions?.fieldEditStyle,
        radioButtonsHorizontalLayout: formElement.formatOptions?.radioButtonsHorizontalLayout,
        createAssociatedAriaLabel: true,
        imageFitType: formElement.formatOptions?.imageFitType,
        enableEnlargeImage: formElement.formatOptions?.enableEnlargeImage
      }),
      ariaLabelledBy: ariaLabelledBy,
      layoutData: new FlexItemData({
        growFactor: "{= %{ui>/isEditable} ? 1 : 0}"
      })
    });
    const connectedFieldControls = [fieldInstance];
    if (index < total - 1) {
      const delimiter = CommonHelper.getDelimiter(connectedField.originalTemplate ?? "");
      connectedFieldControls.push(_jsx(Text, {
        text: delimiter,
        class: "sapUiSmallMarginBeginEnd",
        width: "100%"
      }));
    }
    return connectedFieldControls;
  }

  /**
   * Create an invisible text element for a connected field.
   * @param connectedField The connected field descriptor.
   * @param formContainerProps FormContainer level properties used in generating the form elements.
   * @param formElement The form element descriptor.
   * @param controller The page controller instance.
   * @returns An InvisibleText control or undefined if not applicable.
   */
  function getInvisibleTextForConnectedField(connectedField, formContainerProps, formElement, controller) {
    // if there is a label on the connected field, we create an invisible text for aria-labelledby for proper screen reading
    const connectedFieldPath = connectedField.originalObject?.Value?.path?.valueOf();
    const connectedFieldLabel = connectedField.originalObject?.Value?.$target?.annotations?.Common?.Label?.valueOf();
    if (formContainerProps.id && connectedFieldPath && connectedFieldLabel) {
      const ariaLabelId = controller.createId(StableIDHelper.generate([formContainerProps.id, "AriaText", formElement.key, connectedFieldPath]));
      return _jsx(InvisibleText, {
        text: connectedFieldLabel,
        id: ariaLabelId
      });
    }
  }

  /**
   * Create a UI5 FormElement for a connected fields annotation.
   * @param formElement The form element descriptor.
   * @param contextPath The binding context used for the connected fields.
   * @param formElementProps Form element properties.
   * @param formContainerProps FormContainer level properties used in generating the form elements.
   * @param controller
   * @returns A `sap.ui.layout.form.FormElement` representing the connected fields.
   */
  function getConnectedFieldsFormElement(formElement, contextPath, formElementProps, formContainerProps, controller) {
    const dataModelobjectForConnectedFields = getInvolvedDataModelObjects(contextPath.getModel().createBindingContext(formElement.annotationPath ?? ""));
    const targetObject = dataModelobjectForConnectedFields.targetObject.Target.$target;
    const connectedFieldControls = [];

    // Create a sorted copy of the connected fields based on the placeholder order in the template string.
    // The template string is expected to look like "{FieldA} / {FieldB}" etc. We extract the placeholder
    // sequence and sort the connected fields accordingly (falling back to original order for unmatched fields).
    let sortedConnectedFields = formElement.connectedFields ? [...formElement.connectedFields] : [];
    if (sortedConnectedFields.length > 1) {
      const templateString = sortedConnectedFields[0].originalTemplate || "";
      // Extract placeholders in the sequence defined by the template (e.g. "{FieldA} / {FieldB}")
      const placeholders = Array.from(templateString.matchAll(/\{([^}]+)\}/g)).map(m => String(m[1]).trim()).filter(p => p.length > 0);

      // Helper to derive the identifier from the connected field (last segment of fullyQualifiedName)
      const getFieldIdentifier = cf => {
        const originalObject = cf.originalObject;
        return originalObject?.fullyQualifiedName ? originalObject.fullyQualifiedName.substring(originalObject.fullyQualifiedName.lastIndexOf("/") + 1) : "";
      };
      const fieldIds = sortedConnectedFields.map(getFieldIdentifier);
      const uniquePlaceholders = new Set(placeholders);

      // We only reorder if the template is perfectly annotated:
      // 1. Same number of placeholders as connected fields
      // 2. All placeholders are unique
      // 3. Every connected field id is referenced exactly once
      const isPerfectMatch = placeholders.length === sortedConnectedFields.length && uniquePlaceholders.size === placeholders.length && fieldIds.every(id => uniquePlaceholders.has(id));

      // Review feedback: Do NOT "fix" badly annotated connected fields.
      // If the annotation is not perfect, we keep the original order.
      if (isPerfectMatch) {
        const mapById = new Map(sortedConnectedFields.map(cf => [getFieldIdentifier(cf), cf]));
        sortedConnectedFields = placeholders.map(ph => mapById.get(ph));
      }
    }
    sortedConnectedFields.forEach((connectedField, fieldIndex) => {
      const invisibleText = getInvisibleTextForConnectedField(connectedField, formContainerProps, formElement, controller);
      if (invisibleText) {
        connectedFieldControls.push(invisibleText);
      }
      connectedFieldControls.push(...getConnectedField(formElement, connectedField, fieldIndex, sortedConnectedFields.length, contextPath, formContainerProps, controller));
    });
    const formElementId = createFormElementId(controller, formContainerProps.id, "SemanticFormElement", formElement.key);
    return _jsx(UI5FormElement, {
      id: formElementId,
      visible: formElementProps.visibleExpression,
      binding: formElementProps.bindingString,
      "dt:designtime": formElementProps.designtime,
      children: {
        label: _jsx(Label, {
          text: targetObject?.Label ?? formElement.label,
          id: controller.createId(StableIDHelper.generate([formContainerProps.id, "SemanticFormElementLabel", formElement.key]))
        }),
        fields: _jsx(FieldWrapper, {
          children: _jsx(HBox, {
            wrap: "Wrap",
            children: connectedFieldControls
          })
        })
      }
    });
  }

  /**
   * Create a UI5 FormElement for a multivalue field annotation.
   * @param formElement The form element descriptor.
   * @param contextPath The binding context used for the multivaluefield.
   * @param formElementProps Form element properties.
   * @param formContainerProps FormContainer level properties used in generating the form elements.
   * @param controller Optional page controller for ID generation.
   * @returns A `sap.ui.layout.form.FormElement` containing the MultiValueFieldBlock.
   */
  function getMultiValueFieldFormElement(formElement, contextPath, formElementProps, formContainerProps, controller) {
    const multiValueFieldId = controller.createId(StableIDHelper.generate([formContainerProps.id, "FormElement", formElement.key, "MultiValueField"]));
    const formElementId = formElementProps.computedIdPrefix || `FormElement_${formElement.key}`;
    return _jsx(UI5FormElement, {
      id: formElementId,
      label: formElement.label,
      visible: formElementProps.visibleExpression,
      "dt:designtime": formElementProps.designtime,
      children: {
        fields: _jsx(MultiValueFieldBlock, {
          id: multiValueFieldId,
          contextPath: contextPath.getPath(),
          metaPath: formElement.annotationPath,
          vhIdPrefix: formElementProps.computedVhIdPrefix,
          children: {
            formatOptions: _jsx(FormatOptions, {
              showEmptyIndicator: true
            })
          }
        })
      }
    });
  }

  /**
   * Create a Field control configured as a checkbox.
   * @param groupElement The data field metadata for the checkbox.
   * @param contextPath The binding context used for the field.
   * @param formElement Parent form element descriptor.
   * @param formElementProps Form element properties.
   * @param formContainerProps FormContainer level properties used in generating the form elements.
   * @param labelId The ID of the label that should be associated with the checkbox for accessibility.
   * @returns A Field configured for the checkbox use.
   */
  function getCheckboxField(groupElement, contextPath, formElement, formElementProps, formContainerProps, labelId) {
    const model = contextPath.getModel();
    const tempName = groupElement.fullyQualifiedName;
    const path = tempName?.substring(tempName.lastIndexOf("/") + 1);
    const bindingContext = model.createBindingContext(formElement.annotationPath + "Target/$AnnotationPath/Data/" + path);
    const groupElementDataModelObject = getInvolvedDataModelObjects(bindingContext);
    const computedIdPrefix = formContainerProps.id ? StableIDHelper.generate([formContainerProps.id, "CheckboxGroup", formElement.key, groupElementDataModelObject.targetObject?.Value?.path]) : "";
    if (groupElementDataModelObject.targetObject?.Value?.$target?.type !== "Edm.Boolean") {
      return undefined;
    }
    return new Field({
      contextPath: contextPath.getPath(),
      metaPath: bindingContext.getPath(),
      idPrefix: computedIdPrefix,
      vhIdPrefix: formElementProps.computedVhIdPrefix,
      ariaLabelledBy: [labelId],
      formatOptions: new FieldFormatOptions({
        isFieldGroupItem: true,
        textAlignMode: "Form"
      })
    });
  }

  /**
   * Create a UI5 FormElement for a checkbox field group.
   * @param formElement The form element descriptor.
   * @param contextPath The binding context used for the field.
   * @param formElementProps Form element properties.
   * @param formContainerProps FormContainer level properties used in generating the form elements.
   * @param controller Optional page controller for ID generation.
   * @returns A `sap.ui.layout.form.FormElement` representing the checkbox field group.
   */
  function getFieldGroupFormElement(formElement, contextPath, formElementProps, formContainerProps, controller) {
    const id = formContainerProps.id ? createFormElementId(controller, formContainerProps.id, "FieldGroupFormElement", formElement.key) : "";
    const labelId = formContainerProps.id ? createFormElementId(controller, formContainerProps.id, "FieldGroupFormElementLabel", formElement.key) : "";
    const computedDataModelObject = getInvolvedDataModelObjects(contextPath.getModel().createBindingContext(formElement.annotationPath ?? ""));
    const targetObject = computedDataModelObject?.targetObject?.Target?.$target;
    const requiredProperty = computedDataModelObject ? UIFormatters.getRequiredExpressionForFieldGroup(computedDataModelObject) : undefined;

    // Get the field group fully qualified name directly
    const fieldGroupFullyQualifiedName = targetObject?.fullyQualifiedName;

    // Get the raw (uncompiled) required expression for use in conditional bindings
    const requiredExpressionRaw = computedDataModelObject ? and(pathInModel("ui>isEditable"), isRequiredExpression(computedDataModelObject.targetObject?.Target?.$target)) : undefined;

    // Calculate MessageStrip text and visibility expressions using extracted helper functions
    const messageStripText = getMessageStripTextExpression(fieldGroupFullyQualifiedName);
    const messageStripVisible = getMessageStripVisibilityExpression(fieldGroupFullyQualifiedName, requiredExpressionRaw);
    return _jsx(UI5FormElement, {
      id: id,
      visible: formElementProps.visibleExpression,
      binding: formElementProps.bindingString,
      "dt:designtime": formElementProps.designtime,
      children: {
        customData: fieldGroupFullyQualifiedName ? [_jsx(CustomData, {
          value: fieldGroupFullyQualifiedName
        }, "fieldGroupName")] : undefined,
        label: _jsx(Label, {
          text: targetObject?.Label ?? formElement.label,
          id: labelId,
          required: requiredProperty
        }),
        fields: _jsx(RequiredFlexBox, {
          fieldGroupName: fieldGroupFullyQualifiedName,
          children: _jsxs(VBox, {
            children: [_jsx(FlexBox, {
              direction: formElement.formatOptions?.fieldGroupHorizontalLayout === true ? "Row" : "Column",
              wrap: "Wrap",
              children: {
                items: (formElement.fieldGroupElements ?? []).map(groupElement => getCheckboxField(groupElement, contextPath, formElement, formElementProps, formContainerProps, labelId))
              }
            }), _jsx(MessageStrip, {
              text: messageStripText,
              visible: messageStripVisible,
              showIcon: true,
              showCloseButton: false,
              enableFormattedText: true,
              type: "Error",
              class: "sapUiTinyMarginTop"
            })]
          })
        })
      }
    });
  }

  /**
   * Create a UI5 FormElement for a custom form element that loads a fragment.
   * @param formElementId The ID to assign to the form element.
   * @param formElement The custom form element descriptor.
   * @param formElementProps Form element properties.
   * @param contextPath Binding context used to resolve the property path.
   * @param fragmentId The ID to use for the fragment loading.
   * @returns A `sap.ui.layout.form.FormElement` that wraps the custom fragment inside the CustomFormElement.
   */
  function getCustomFormElement(formElementId, formElement, formElementProps, contextPath, fragmentId) {
    return _jsx(UI5FormElement, {
      "dt:designtime": formElementProps.designtime,
      id: formElementId,
      label: formElement.label,
      visible: formElement.visible,
      binding: formElementProps.bindingString,
      children: {
        fields: _jsx(MacroCustomFormElement, {
          metaPath: formElement.propertyPath,
          fragmentId: fragmentId,
          fragmentName: formElement.template,
          contextPath: contextPath.getPath(),
          formElementKey: fragmentId
        })
      }
    });
  }

  /**
   * Create a slot column control used for default slot-based content.
   * @param formElement Descriptor that provides the slot key (used as slot name).
   * @param slotElements
   * @returns A slot element with the appropriate name attribute.
   */
  function getSlotColumn(formElement, slotElements) {
    return slotElements.find(slotElement => {
      const slotIdParts = slotElement.getId().split("--");
      const id = slotIdParts[slotIdParts.length - 1];
      return id === formElement.key.split("InlineXML_")[1];
    });
  }

  /**
   * Generates the template for a form element representing a field.
   * @param formElement The form element descriptor.
   * @param contextPath The binding context used for the field.
   * @param formElementProps The properties for the form element.
   * @param formContainerProps FormContainer level properties used in generating the form elements.
   * @param computedDataModelObject The computed data model object path.
   * @param controller The page controller instance.
   * @returns A `sap.ui.layout.form.FormElement` containing a Field control.
   */
  function getFieldFormElement(formElement, contextPath, formElementProps, formContainerProps, computedDataModelObject, controller) {
    // this is temporary until the id generation is harmonized throughout the file
    const elementId = formElementProps.computedIdPrefix || `FormElement_${formElement.key}`;
    let metaPath = formElement.key;
    if (computedDataModelObject) {
      try {
        const valueDataModelPath = getDataModelObjectPathForValue(computedDataModelObject);
        if (valueDataModelPath && valueDataModelPath.targetObject) {
          metaPath = valueDataModelPath.targetObject.name;
        }
      } catch (e) {
        metaPath = formElement.key;
      }
    }
    const fieldInstance = new Field({
      contextPath: contextPath.getPath(),
      metaPath: formElement.annotationPath || metaPath,
      idPrefix: controller ? controller.createId(formElementProps.computedIdPrefix ?? "") : formElementProps.computedIdPrefix,
      vhIdPrefix: formElementProps.computedVhIdPrefix,
      editMode: formElement.readOnly === true ? "Display" : undefined,
      semanticObject: formElement.semanticObject,
      formatOptions: new FieldFormatOptions({
        displayMode: formElement.formatOptions?.displayMode,
        measureDisplayMode: formElement.formatOptions?.measureDisplayMode,
        showDate: formElement.formatOptions?.showDate,
        showTime: formElement.formatOptions?.showTime,
        showTimezone: formElement.formatOptions?.showTimezone,
        dateTimeStyle: formElement.formatOptions?.dateTimeStyle,
        reactiveAreaMode: formElement.formatOptions?.reactiveAreaMode,
        textLinesEdit: formElement.formatOptions?.textLinesEdit,
        textMaxLines: formElement.formatOptions?.textMaxLines,
        textMaxLength: formElement.formatOptions?.textMaxLength,
        textMaxCharactersDisplay: formElement.formatOptions?.textMaxCharactersDisplay,
        textExpandBehaviorDisplay: formElement.formatOptions?.textExpandBehaviorDisplay,
        textAlignMode: "Form",
        showEmptyIndicator: true,
        fieldEditStyle: formElement.formatOptions?.fieldEditStyle,
        radioButtonsHorizontalLayout: formElement.formatOptions?.radioButtonsHorizontalLayout,
        dateTimePattern: formElement.formatOptions?.pattern,
        useRadioButtonsForBoolean: formElement.formatOptions?.useRadioButtonsForBoolean,
        imageFitType: formElement.formatOptions?.imageFitType,
        enableEnlargeImage: formElement.formatOptions?.enableEnlargeImage
      })
    });
    return _jsx(UI5FormElement, {
      id: controller ? controller.createId(elementId) : elementId,
      label: formElement.label,
      visible: formElementProps.visibleExpression,
      "dt:designtime": formElementProps.designtime,
      binding: formElementProps.bindingString,
      children: {
        fields: fieldInstance
      }
    });
  }

  /**
   * Create a UI5 FormElement for the DataPoint annotation.
   * @param formElement The form element descriptor.
   * @param contextPath Binding context for the field.
   * @param formElementProps Form element properties.
   * @param formContainerProps FormContainer level properties used in generating the form elements.
   * @returns A `sap.ui.layout.form.FormElement` representing the DataPoint.
   */
  function getDataPointFormElement(formElement, contextPath, formElementProps, formContainerProps) {
    //TODO: We need to revisit the editable scenario and id generation here
    /* 	const isEditableHeader = formElement.id?.includes("HeaderFacet::FormContainer") === true;
    let formElementId = "undefined";
    if (formElement.id) {
    	if (isEditableHeader) {
    			formElementId = `${formElement.id}::FormElement`;
    			idPrefix = `${formElement.id}::FormElement`;
    	} else {
    			formElementId = `${StableIDHelper.generate([formElement.id, "FormElement", formElement.dataFieldCollection[0].key])}`;
    			idPrefix = `${StableIDHelper.generate([formElement.id, "FormElement", formElement.dataFieldCollection[0].key])}`;
    	}
    } */

    const fieldInstance = new Field({
      contextPath: contextPath.getPath(),
      metaPath: formElement.annotationPath,
      id: `${formElementProps.computedIdPrefix}::Field`,
      idPrefix: formElementProps.computedIdPrefix,
      vhIdPrefix: formElementProps.computedVhIdPrefix,
      editMode: formContainerProps.displayMode === true ? "Display" : undefined,
      formatOptions: new FieldFormatOptions({
        textAlignMode: "Form",
        showEmptyIndicator: true
      })
    });
    return _jsx(UI5FormElement, {
      id: formElementProps.computedIdPrefix || `FormElement_${formElement.key}`,
      label: formElement.label,
      visible: formElementProps.visibleExpression,
      "dt:designtime": formElementProps.designtime,
      binding: formElementProps.bindingString,
      children: {
        fields: fieldInstance
      }
    });
  }

  /**
   * Create a UI5 FormElement for the Communication.Contact annotation.
   * @param formElement The form element descriptor.
   * @param contextPath Binding context used for the contact.
   * @param formElementProps Form element properties.
   * @returns A `sap.ui.layout.form.FormElement` representing the Contact.
   */
  function getContactFormElement(formElement, contextPath, formElementProps) {
    const contactInstance = new Contact({
      contextPath: contextPath.getPath(),
      metaPath: formElement.annotationPath,
      idPrefix: formElementProps.computedIdPrefix
    });
    return _jsx(UI5FormElement, {
      id: formElementProps.computedIdPrefix || `FormElement_${formElement.key}`,
      visible: formElementProps.visibleExpression,
      "dt:designtime": formElementProps.designtime,
      binding: formElementProps.bindingString,
      children: {
        label: _jsx(Label, {
          text: formElement.label,
          children: {
            layoutData: _jsx(ColumnElementData, {
              cellsLarge: "12"
            })
          }
        }),
        fields: contactInstance
      }
    });
  }
  return _exports;
}, false);
//# sourceMappingURL=FormContainerHelper-dbg.js.map
