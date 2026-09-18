/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/converters/controls/Common/Action", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "../../../helpers/StableIdHelper", "../../ManifestSettings", "../../helpers/ConfigurableObject", "../../helpers/DataFieldHelper", "../../helpers/ID", "../../helpers/Key"], function (Log, BindingToolkit, DataField, Action, TypeGuards, DataModelPathHelper, StableIdHelper, ManifestSettings, ConfigurableObject, DataFieldHelper, ID, Key) {
  "use strict";

  var _exports = {};
  var KeyHelper = Key.KeyHelper;
  var getFormStandardActionButtonID = ID.getFormStandardActionButtonID;
  var getFormID = ID.getFormID;
  var isReferencePropertyStaticallyHidden = DataFieldHelper.isReferencePropertyStaticallyHidden;
  var insertCustomElements = ConfigurableObject.insertCustomElements;
  var Placement = ConfigurableObject.Placement;
  var OverrideType = ConfigurableObject.OverrideType;
  var FlexDesignTimeType = ManifestSettings.FlexDesignTimeType;
  var ActionType = ManifestSettings.ActionType;
  var createIdForAnnotation = StableIdHelper.createIdForAnnotation;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var getTargetEntitySetPath = DataModelPathHelper.getTargetEntitySetPath;
  var isSingleton = TypeGuards.isSingleton;
  var isNavigationProperty = TypeGuards.isNavigationProperty;
  var addSeparators = Action.addSeparators;
  var getSemanticObjectPath = DataField.getSemanticObjectPath;
  var pathInModel = BindingToolkit.pathInModel;
  var not = BindingToolkit.not;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var equal = BindingToolkit.equal;
  var compileExpression = BindingToolkit.compileExpression;
  let FormElementType = /*#__PURE__*/function (FormElementType) {
    FormElementType["Default"] = "Default";
    FormElementType["Slot"] = "Slot";
    FormElementType["Annotation"] = "Annotation";
    return FormElementType;
  }({});
  _exports.FormElementType = FormElementType;
  /**
   * Returns default format options for text fields in a form.
   * It also adds the horizontal layout as a format option for field groups.
   * @param facetDefinition The facet definition to get the format options for
   * @param converterContext The converter context to fetch additional information
   * @param field The field for which the format options are to be returned
   * @returns The collection of format options for the FormElement
   */
  function getFormatOptionsForFormElement(facetDefinition, converterContext, field) {
    let manifestWrapper, horizontalLayout;
    const formatOptions = {
      textLinesEdit: 4 // default
    };
    if (field && field.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
      manifestWrapper = converterContext.getManifestWrapper();
      horizontalLayout = manifestWrapper.getHorizontalLayoutForFieldGroup(facetDefinition.Target.value, field.Target?.value);
      if (horizontalLayout === true) {
        formatOptions.fieldGroupHorizontalLayout = horizontalLayout;
      }
    }
    return formatOptions;
  }
  function isFieldPartOfPreview(field, formPartOfPreview) {
    // Both each form and field can have the PartOfPreview annotation. Only if the form is not hidden (not partOfPreview) we allow toggling on field level
    return formPartOfPreview?.valueOf() === false || field.annotations?.UI?.PartOfPreview === undefined || field.annotations?.UI?.PartOfPreview.valueOf() === true;
  }

  /**
   * Type guard for FieldGroup annotation.
   * Checks that the annotation has the FieldGroup term and contains a Data array.
   * @param annotation The annotation to check (can be FieldGroup, Identification, Contact, DataPoint, InputMask, or Masked).
   * @returns True if the annotation is a FieldGroup with Data.
   */
  function isFieldGroupAnnotation(annotation) {
    if (!annotation || typeof annotation !== "object") {
      return false;
    }
    const fieldGroup = annotation;
    return fieldGroup.term === "com.sap.vocabularies.UI.v1.FieldGroup" && Array.isArray(fieldGroup.Data);
  }

  /**
   * Type guard for Identification annotation (array of DataFieldAbstractTypes).
   * Checks that the annotation is a non-empty array and that elements have the expected $Type property.
   * @param annotation The annotation to check (can be FieldGroup, Identification, Contact, DataPoint, InputMask, or Masked).
   * @returns True if the annotation is an Identification array with at least one element.
   */
  function isIdentificationAnnotation(annotation) {
    return Array.isArray(annotation) && annotation.length > 0 && typeof annotation[0]?.$Type === "string";
  }

  /**
   * Extracts LocalProperty paths from DataFieldWithIntentBasedNavigation mapping arrays.
   * These properties are needed in $select for intent-based navigation to work correctly,
   * even when the property is not displayed due to TextArrangement#TextOnly.
   * @param fields The DataField array from FieldGroup or Identification.
   * @returns Array of property paths from intent-based navigation mappings.
   */
  function getIBNMappingProperties(fields) {
    const mappingProperties = new Set();
    for (const field of fields) {
      if (field.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation" && field.Mapping) {
        for (const mapping of field.Mapping) {
          const localPropertyPath = mapping.LocalProperty?.value;
          if (localPropertyPath) {
            mappingProperties.add(localPropertyPath);
          }
        }
      }
    }
    return Array.from(mappingProperties);
  }
  _exports.getIBNMappingProperties = getIBNMappingProperties;
  function getFormElementsFromAnnotations(facetDefinition, converterContext) {
    const formElements = [];
    const resolvedTarget = converterContext.getEntityTypeAnnotation(facetDefinition.Target.value);
    const formAnnotation = resolvedTarget.annotation;
    converterContext = resolvedTarget.converterContext;
    function getDataFieldsFromAnnotations(field, formPartOfPreview) {
      const dataFieldKey = KeyHelper.generateKeyFromDataField(field);
      const semanticObjectAnnotationPath = getSemanticObjectPath(converterContext, field);
      const manifestWrapper = converterContext.getManifestWrapper();
      const manifestFields = manifestWrapper.getFormContainer(facetDefinition.Target.value)?.fields;
      const semanticObjectManifestSettings = manifestFields?.[dataFieldKey]?.semanticObject;
      const flexSettingsManifestSettings = manifestFields?.[dataFieldKey]?.flexSettings;
      if (field.$Type !== "com.sap.vocabularies.UI.v1.DataFieldForAction" && field.$Type !== "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" && field.$Type !== "com.sap.vocabularies.UI.v1.DataFieldForActionGroup" && !isReferencePropertyStaticallyHidden(field)) {
        const baseFormatOptions = getFormatOptionsForFormElement(facetDefinition, converterContext, field);
        const formElement = {
          key: dataFieldKey,
          type: FormElementType.Annotation,
          annotationPath: `${converterContext.getEntitySetBasedAnnotationPath(field.fullyQualifiedName)}/`,
          semanticObjectPath: semanticObjectAnnotationPath,
          formatOptions: {
            ...baseFormatOptions
          },
          isPartOfPreview: isFieldPartOfPreview(field, formPartOfPreview),
          label: field.Label ?? field.Value?.$target?.annotations?.Common?.Label?.toString(),
          semanticObject: semanticObjectManifestSettings,
          ...(flexSettingsManifestSettings && {
            flexSettings: {
              designtime: flexSettingsManifestSettings.designtime ?? FlexDesignTimeType.Default
            }
          })
        };
        if (field.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && field.Target.$target?.$Type === "com.sap.vocabularies.UI.v1.ConnectedFieldsType") {
          const connectedFields = Object.values(field.Target.$target.Data).filter(connectedField => connectedField?.hasOwnProperty("Value"));
          formElement.connectedFields = connectedFields.map(connnectedFieldElement => {
            const returnObject = {
              semanticObjectPath: getSemanticObjectPath(converterContext, connnectedFieldElement)
            };
            Object.defineProperty(returnObject, "originalObject", {
              get: () => connnectedFieldElement
            });
            Object.defineProperty(returnObject, "originalTemplate", {
              get: () => {
                const target = field.Target?.$target;
                return target && "Template" in target ? target.Template : undefined;
              }
            });
            return returnObject;
          });
        } else if (field.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && field.Target.$target?.$Type === "com.sap.vocabularies.UI.v1.FieldGroupType") {
          const fieldGroupElements = Object.values(field.Target.$target.Data).filter(fieldGroupElement => fieldGroupElement?.hasOwnProperty("Value"));
          formElement.fieldGroupElements = fieldGroupElements.map(element => ({
            $Type: element.$Type,
            fullyQualifiedName: element.fullyQualifiedName,
            Label: element.Label
          }));
        }
        formElements.push(formElement);
      }
    }
    switch (formAnnotation?.term) {
      case "com.sap.vocabularies.UI.v1.FieldGroup":
        formAnnotation.Data.forEach(field => getDataFieldsFromAnnotations(field, facetDefinition.annotations?.UI?.PartOfPreview));
        break;
      case "com.sap.vocabularies.UI.v1.Identification":
        formAnnotation.forEach(field => getDataFieldsFromAnnotations(field, facetDefinition.annotations?.UI?.PartOfPreview));
        break;
      case "com.sap.vocabularies.UI.v1.DataPoint":
        formElements.push({
          // key: KeyHelper.generateKeyFromDataField(formAnnotation),
          key: `DataPoint::${formAnnotation.qualifier ? formAnnotation.qualifier : ""}`,
          type: FormElementType.Annotation,
          annotationPath: `${converterContext.getEntitySetBasedAnnotationPath(formAnnotation.fullyQualifiedName)}/`,
          label: formAnnotation.Title?.toString(),
          isPartOfPreview: isFieldPartOfPreview(formAnnotation, facetDefinition.annotations?.UI?.PartOfPreview)
        });
        break;
      case "com.sap.vocabularies.UI.v1.InputMask":
        formElements.push({
          key: `MaskedInput::${formAnnotation.qualifier ? formAnnotation.qualifier : ""}`,
          type: FormElementType.Annotation,
          annotationPath: `${converterContext.getEntitySetBasedAnnotationPath(formAnnotation.fullyQualifiedName)}/`
        });
        break;
      case "com.sap.vocabularies.Common.v1.Masked":
        formElements.push({
          key: `Masked::${formAnnotation.qualifier ? formAnnotation.qualifier : ""}`,
          type: FormElementType.Annotation,
          annotationPath: `${converterContext.getEntitySetBasedAnnotationPath(formAnnotation.fullyQualifiedName)}/`
        });
        break;
      case "com.sap.vocabularies.Communication.v1.Contact":
        formElements.push({
          // key: KeyHelper.generateKeyFromDataField(formAnnotation),
          key: `Contact::${formAnnotation.qualifier ? formAnnotation.qualifier : ""}`,
          type: FormElementType.Annotation,
          annotationPath: `${converterContext.getEntitySetBasedAnnotationPath(formAnnotation.fullyQualifiedName)}/`
        });
        break;
      default:
        break;
    }
    return formElements;
  }
  _exports.getFormElementsFromAnnotations = getFormElementsFromAnnotations;
  function getFormElementsFromManifest(facetDefinition, converterContext) {
    const manifestWrapper = converterContext.getManifestWrapper();
    const manifestFormContainer = manifestWrapper.getFormContainer(facetDefinition.Target.value);
    const formElements = {};
    if (manifestFormContainer?.fields) {
      Object.keys(manifestFormContainer?.fields).forEach(fieldId => {
        formElements[fieldId] = {
          key: fieldId,
          id: `CustomFormElement::${fieldId}`,
          type: manifestFormContainer.fields[fieldId].type || FormElementType.Default,
          template: manifestFormContainer.fields[fieldId].template,
          propertyPath: manifestFormContainer.fields[fieldId]?.property,
          label: converterContext.fetchTextFromMetaModel(manifestFormContainer.fields[fieldId].label),
          position: manifestFormContainer.fields[fieldId].position || {
            placement: Placement.After
          },
          formatOptions: {
            ...getFormatOptionsForFormElement(facetDefinition, converterContext),
            ...manifestFormContainer.fields[fieldId].formatOptions
          },
          ...(manifestFormContainer.fields[fieldId].readOnly !== undefined && {
            readOnly: manifestFormContainer.fields[fieldId].readOnly
          }),
          ...(manifestFormContainer.fields[fieldId].semanticObject !== undefined && {
            semanticObject: manifestFormContainer.fields[fieldId].semanticObject
          }),
          ...(manifestFormContainer.fields[fieldId].visible !== undefined && {
            visible: typeof manifestFormContainer.fields[fieldId].visible === "boolean" ? compileExpression(manifestFormContainer.fields[fieldId].visible) : manifestFormContainer.fields[fieldId].visible
          }),
          flexSettings: {
            designtime: manifestFormContainer.fields[fieldId].flexSettings?.designtime ?? FlexDesignTimeType.Default
          }
        };
      });
    }
    return formElements;
  }
  _exports.getFormElementsFromManifest = getFormElementsFromManifest;
  function getFormContainer(facetDefinition, converterContext, actions, additionalSettings) {
    const sFormContainerId = createIdForAnnotation(facetDefinition);
    const sAnnotationPath = converterContext.getEntitySetBasedAnnotationPath(facetDefinition.fullyQualifiedName);
    const resolvedTarget = converterContext.getEntityTypeAnnotation(facetDefinition.Target.value);
    const isVisible = compileExpression(not(equal(true, getExpressionFromAnnotation(facetDefinition.annotations?.UI?.Hidden))));

    // Collect IBN mapping properties for $select
    let ibnMappingProps = [];
    const formAnnotation = resolvedTarget.annotation;
    if (formAnnotation) {
      if (isFieldGroupAnnotation(formAnnotation)) {
        ibnMappingProps = getIBNMappingProperties(formAnnotation.Data);
      } else if (isIdentificationAnnotation(formAnnotation)) {
        ibnMappingProps = getIBNMappingProperties(formAnnotation);
      }
    }
    let sEntitySetPath;
    // resolvedTarget doesn't have a entitySet in case Containments and Paramterized services.
    const entitySet = resolvedTarget.converterContext.getEntitySet();
    const dataModelObjectPathTarget = resolvedTarget.converterContext.getDataModelObjectPath().targetObject;
    if (entitySet && entitySet !== converterContext.getEntitySet()) {
      sEntitySetPath = getTargetEntitySetPath(resolvedTarget.converterContext.getDataModelObjectPath());
    } else if (isNavigationProperty(dataModelObjectPathTarget) && dataModelObjectPathTarget?.containsTarget === true) {
      sEntitySetPath = getTargetObjectPath(resolvedTarget.converterContext.getDataModelObjectPath(), false);
    } else if (entitySet && !sEntitySetPath && isSingleton(entitySet)) {
      sEntitySetPath = "/" + entitySet.fullyQualifiedName;
    } else if (!entitySet && isNavigationProperty(dataModelObjectPathTarget) && dataModelObjectPathTarget?.containsTarget === false) {
      sEntitySetPath = getTargetObjectPath(resolvedTarget.converterContext.getDataModelObjectPath(), false);
    }
    const aFormElements = insertCustomElements(getFormElementsFromAnnotations(facetDefinition, converterContext), getFormElementsFromManifest(facetDefinition, converterContext), {
      formatOptions: OverrideType.overwrite,
      readOnly: OverrideType.overwrite,
      semanticObject: OverrideType.overwrite,
      visible: OverrideType.overwrite,
      flexSettings: OverrideType.overwrite
    });
    actions = actions !== undefined ? actions.filter(action => action.facetName == facetDefinition.fullyQualifiedName) : [];
    if (actions.length === 0) {
      actions = undefined;
    }
    const oActionShowDetails = {
      id: getFormStandardActionButtonID(sFormContainerId, "ShowHideDetails"),
      key: "StandardAction::ShowHideDetails",
      text: compileExpression(ifElse(equal(pathInModel("showDetails", "internal"), true), pathInModel("T_COMMON_OBJECT_PAGE_HIDE_FORM_CONTAINER_DETAILS", "sap.fe.i18n"), pathInModel("T_COMMON_OBJECT_PAGE_SHOW_FORM_CONTAINER_DETAILS", "sap.fe.i18n"))),
      type: ActionType.ShowFormDetails,
      press: ""
    };
    if (facetDefinition.annotations?.UI?.PartOfPreview?.valueOf() !== false && aFormElements.some(oFormElement => oFormElement.isPartOfPreview === false)) {
      if (actions !== undefined) {
        actions.push(oActionShowDetails);
      } else {
        actions = [oActionShowDetails];
      }
    }

    // Add separators based on overflowGroups configuration from manifest
    if (actions) {
      const manifestWrapper = converterContext.getManifestWrapper();
      const formManifestConfig = manifestWrapper.getFormContainer(facetDefinition.Target.value);
      const overflowGroupsConfig = formManifestConfig?.overflowGroups;
      if (overflowGroupsConfig) {
        actions = addSeparators(actions, overflowGroupsConfig);
      }
    }
    const manifestWrapper = converterContext.getManifestWrapper();
    const formManifestConfig = manifestWrapper.getFormContainer(facetDefinition.Target.value);
    return {
      id: sFormContainerId,
      formElements: aFormElements,
      annotationPath: sAnnotationPath,
      isVisible: isVisible,
      entitySet: sEntitySetPath,
      actions: actions,
      useSingleTextAreaFieldAsNotes: additionalSettings?.useSingleTextAreaFieldAsNotes,
      annotationHidden: facetDefinition.annotations?.UI?.Hidden ? true : false,
      navigationPropertiesForAdaptationDialog: formManifestConfig?.navigationPropertiesForAdaptationDialog,
      flexSettings: {
        designtime: formManifestConfig?.flexSettings?.designtime ?? FlexDesignTimeType.Default
      },
      ibnMappingProperties: ibnMappingProps.length > 0 ? ibnMappingProps : undefined
    };
  }
  _exports.getFormContainer = getFormContainer;
  function getFormContainersForCollection(facetDefinition, converterContext, actions, additionalSettings) {
    const formContainers = [];
    const formContainerSettings = {
      useSingleTextAreaFieldAsNotes: additionalSettings?.useSingleTextAreaFieldAsNotes
    };
    facetDefinition.Facets?.forEach(facet => {
      // Ignore level 3 collection facet
      if (facet.$Type === "com.sap.vocabularies.UI.v1.CollectionFacet") {
        return;
      }
      try {
        formContainers.push(getFormContainer(facet, converterContext, actions, formContainerSettings));
      } catch (error) {
        Log.error(`Skipping facet ${facet.fullyQualifiedName} due to error:`, error);
      }
    });
    return formContainers;
  }
  function isReferenceFacet(facetDefinition) {
    return facetDefinition.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet";
  }
  _exports.isReferenceFacet = isReferenceFacet;
  function createFormDefinition(facetDefinition, isVisible, converterContext, actions, additionalSettings) {
    const manifestWrapper = converterContext.getManifestWrapper();
    switch (facetDefinition?.$Type) {
      case "com.sap.vocabularies.UI.v1.CollectionFacet":
        {
          // Keep only valid children
          const annotationPath = converterContext.getRelativeAnnotationPath(facetDefinition.fullyQualifiedName, converterContext.getEntityType());
          const collectionControlConfig = converterContext.getManifestControlConfiguration(annotationPath);
          return {
            id: getFormID(facetDefinition),
            useFormContainerLabels: true,
            hasFacetsNotPartOfPreview: facetDefinition.Facets.some(childFacet => childFacet.annotations?.UI?.PartOfPreview?.valueOf() === false),
            formContainers: getFormContainersForCollection(facetDefinition, converterContext, actions, additionalSettings),
            isVisible: isVisible,
            ...(collectionControlConfig.flexSettings && {
              flexSettings: {
                designtime: collectionControlConfig.flexSettings.designtime ?? FlexDesignTimeType.Default
              }
            })
          };
        }
      case "com.sap.vocabularies.UI.v1.ReferenceFacet":
        {
          const formManifestConfig = manifestWrapper.getFormContainer(facetDefinition.Target.value);
          return {
            id: getFormID(facetDefinition),
            useFormContainerLabels: false,
            hasFacetsNotPartOfPreview: facetDefinition.annotations?.UI?.PartOfPreview?.valueOf() === false,
            formContainers: [getFormContainer(facetDefinition, converterContext, actions, additionalSettings)],
            isVisible: isVisible,
            ...(formManifestConfig?.flexSettings && {
              flexSettings: {
                designtime: formManifestConfig.flexSettings.designtime ?? FlexDesignTimeType.Default
              }
            })
          };
        }
      default:
        throw new Error("Cannot create form based on ReferenceURLFacet");
    }
  }
  _exports.createFormDefinition = createFormDefinition;
  return _exports;
}, false);
//# sourceMappingURL=Form-dbg.js.map
