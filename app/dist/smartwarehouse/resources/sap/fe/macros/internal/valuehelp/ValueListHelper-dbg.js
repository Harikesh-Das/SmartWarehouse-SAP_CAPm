/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/ObjectPath", "sap/fe/core/CommonUtils", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/MetaModelFunction", "sap/fe/core/helpers/MetaPath", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/CommonHelper", "sap/fe/macros/internal/valuehelp/ValueHelpUtils", "sap/fe/macros/valuehelp/ValueHelpFilterBarCreator", "sap/m/table/Util", "sap/ui/core/Fragment", "sap/ui/core/ResizeHandler", "sap/ui/core/XMLTemplateProcessor", "sap/ui/core/util/XMLPreprocessor", "sap/ui/dom/units/Rem", "sap/ui/mdc/valuehelp/content/Conditions", "sap/ui/mdc/valuehelp/content/MDCTable", "sap/ui/mdc/valuehelp/content/MTable", "sap/ui/model/json/JSONModel"], function (Log, ObjectPath, CommonUtils, MetaModelConverter, MetaModelFunction, MetaPath, TypeGuards, PropertyHelper, UIFormatters, CommonHelper, ValueHelpUtils, ValueHelpFilterBarCreator, Util, Fragment, ResizeHandler, XMLTemplateProcessor, XMLPreprocessor, Rem, Conditions, MDCTable, MTable, JSONModel) {
  "use strict";

  var _exports = {};
  var putDefaultQualifierFirst = ValueHelpUtils.putDefaultQualifierFirst;
  var getViewDataForTemplate = ValueHelpUtils.getViewDataForTemplate;
  var getTypeConfig = UIFormatters.getTypeConfig;
  var getDisplayMode = UIFormatters.getDisplayMode;
  var getAssociatedUnitProperty = PropertyHelper.getAssociatedUnitProperty;
  var getAssociatedTimezoneProperty = PropertyHelper.getAssociatedTimezoneProperty;
  var getAssociatedTextProperty = PropertyHelper.getAssociatedTextProperty;
  var getAssociatedCurrencyProperty = PropertyHelper.getAssociatedCurrencyProperty;
  var isMultipleNavigationProperty = TypeGuards.isMultipleNavigationProperty;
  var isPropertyFilterable = MetaModelFunction.isPropertyFilterable;
  var getSortRestrictionsInfo = MetaModelFunction.getSortRestrictionsInfo;
  var convertTypes = MetaModelConverter.convertTypes;
  // com.sap.vocabularies.Common.v1.ValueListType

  const columnNotAlreadyDefined = (columnDefs, vhKey) => !columnDefs.some(column => column.path === vhKey);
  const adaptationFilterBar = "sap.ui.mdc.filterbar.p13n.AdaptationFilterBar";
  const AnnotationLabel = "@com.sap.vocabularies.Common.v1.Label",
    AnnotationText = "@com.sap.vocabularies.Common.v1.Text",
    AnnotationTextUITextArrangement = "@com.sap.vocabularies.Common.v1.Text@com.sap.vocabularies.UI.v1.TextArrangement",
    AnnotationValueListParameterIn = "com.sap.vocabularies.Common.v1.ValueListParameterIn",
    AnnotationValueListParameterConstant = "com.sap.vocabularies.Common.v1.ValueListParameterConstant",
    AnnotationValueListParameterOut = "com.sap.vocabularies.Common.v1.ValueListParameterOut",
    AnnotationValueListParameterInOut = "com.sap.vocabularies.Common.v1.ValueListParameterInOut",
    AnnotationValueListWithFixedValues = "@com.sap.vocabularies.Common.v1.ValueListWithFixedValues",
    AnnotationsPersonalDataPotentiallySensitive = "@com.sap.vocabularies.PersonalData.v1.IsPotentiallySensitive",
    AnnotationsValueListRelevantQualifiers = "@com.sap.vocabularies.Common.v1.ValueListRelevantQualifiers";
  _exports.AnnotationLabel = AnnotationLabel;
  _exports.AnnotationsValueListRelevantQualifiers = AnnotationsValueListRelevantQualifiers;
  _exports.AnnotationsPersonalDataPotentiallySensitive = AnnotationsPersonalDataPotentiallySensitive;
  _exports.AnnotationValueListWithFixedValues = AnnotationValueListWithFixedValues;
  _exports.AnnotationValueListParameterInOut = AnnotationValueListParameterInOut;
  _exports.AnnotationValueListParameterOut = AnnotationValueListParameterOut;
  _exports.AnnotationValueListParameterConstant = AnnotationValueListParameterConstant;
  _exports.AnnotationValueListParameterIn = AnnotationValueListParameterIn;
  _exports.AnnotationTextUITextArrangement = AnnotationTextUITextArrangement;
  _exports.AnnotationText = AnnotationText;
  function _getDefaultSortPropertyName(valueListInfo) {
    let sortFieldName;
    const metaModel = valueListInfo.$model.getMetaModel();
    const entitySetAnnotations = metaModel.getObject(`/${valueListInfo.CollectionPath}@`) || {};
    const sortRestrictionsInfo = getSortRestrictionsInfo(entitySetAnnotations);
    const foundElement = valueListInfo.Parameters.find(function (element) {
      return (element.$Type === "com.sap.vocabularies.Common.v1.ValueListParameterInOut" || element.$Type === "com.sap.vocabularies.Common.v1.ValueListParameterOut" || element.$Type === "com.sap.vocabularies.Common.v1.ValueListParameterDisplayOnly") &&
      // Navigation properties (containing "/") cannot be used for default sorting
      !element.ValueListProperty.includes("/") && !(metaModel.getObject(`/${valueListInfo.CollectionPath}/${element.ValueListProperty}@com.sap.vocabularies.UI.v1.Hidden`) === true);
    });
    if (foundElement) {
      if (metaModel.getObject(`/${valueListInfo.CollectionPath}/${foundElement.ValueListProperty}@com.sap.vocabularies.Common.v1.Text@com.sap.vocabularies.UI.v1.TextArrangement/$EnumMember`) === "com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly") {
        sortFieldName = metaModel.getObject(`/${valueListInfo.CollectionPath}/${foundElement.ValueListProperty}@com.sap.vocabularies.Common.v1.Text/$Path`);
      } else {
        sortFieldName = foundElement.ValueListProperty;
      }
    }
    if (sortFieldName && (!sortRestrictionsInfo.propertyInfo[sortFieldName] || sortRestrictionsInfo.propertyInfo[sortFieldName].sortable)) {
      return sortFieldName;
    } else {
      return undefined;
    }
  }
  function _redundantDescription(oVLParameter, aColumnInfo) {
    const oColumnInfo = aColumnInfo.find(function (columnInfo) {
      return oVLParameter.ValueListProperty === columnInfo.textColumnName;
    });
    if (oVLParameter.ValueListProperty === oColumnInfo?.textColumnName && !oColumnInfo.keyColumnHidden && oColumnInfo.keyColumnDisplayFormat !== "Value") {
      return true;
    }
    return undefined;
  }
  function _hasImportanceHigh(oValueListContext) {
    return oValueListContext.Parameters.some(function (oParameter) {
      return oParameter["@com.sap.vocabularies.UI.v1.Importance"] && oParameter["@com.sap.vocabularies.UI.v1.Importance"].$EnumMember === "com.sap.vocabularies.UI.v1.ImportanceType/High";
    });
  }
  function _build$SelectString(control) {
    const oViewData = control.getModel("viewData");
    if (oViewData) {
      const oData = oViewData.getData();
      if (oData) {
        const aColumns = oData.columns;
        if (aColumns) {
          return aColumns.reduce(function (sQuery, oProperty) {
            // Navigation properties (represented by X/Y) should not be added to $select.
            // TODO : They should be added as $expand=X($select=Y) instead
            if (oProperty.path && !oProperty.path.includes("/")) {
              sQuery = sQuery ? `${sQuery},${oProperty.path}` : oProperty.path;
            }
            return sQuery;
          }, undefined);
        }
      }
    }
    return undefined;
  }
  function _getValueHelpColumnDisplayFormat(oPropertyAnnotations, isValueHelpWithFixedValues) {
    const sDisplayMode = CommonUtils.computeDisplayMode(oPropertyAnnotations);
    const oTextAnnotation = oPropertyAnnotations && oPropertyAnnotations["@com.sap.vocabularies.Common.v1.Text"];
    const oTextArrangementAnnotation = oTextAnnotation && oPropertyAnnotations["@com.sap.vocabularies.Common.v1.Text@com.sap.vocabularies.UI.v1.TextArrangement"];
    if (isValueHelpWithFixedValues) {
      return oTextAnnotation && typeof oTextAnnotation !== "string" && "$Path" in oTextAnnotation && oTextAnnotation.$Path ? sDisplayMode : "Value";
    } else {
      // Only explicit defined TextArrangements in a Value Help with Dialog are considered
      return oTextArrangementAnnotation ? sDisplayMode : "Value";
    }
  }

  /**
   * Retrieves the valueList's PresentationVariant.
   * @param valueList The valueList annotation
   * @returns The PresentationVariant (if any) of the valueList
   */
  function getPresentationVariant(valueList) {
    const presentationVariantQualifier = valueList.PresentationVariantQualifier ? `#${valueList.PresentationVariantQualifier}` : "";
    const presentationVariantPath = `/${valueList.CollectionPath}/@com.sap.vocabularies.UI.v1.PresentationVariant${presentationVariantQualifier}`;
    return valueList.$model.getMetaModel().getObject(presentationVariantPath);
  }
  const ValueListHelper = {
    getValueListCollectionEntitySet: function (oValueListContext) {
      const mValueList = oValueListContext.getObject();
      return mValueList.$model.getMetaModel().createBindingContext(`/${mValueList.CollectionPath}`);
    },
    /**
     * Checks if the ValueList is annotated with a PresentationVariant.
     * If the PresentationVariant is annotated with a RecursiveHierarchyQualifier, the ValueList's table has to be a TreeTable.
     * @param valueList The valueList annotation
     * @returns True if the table has to be a TreeTable, false otherwise
     */
    isTreeTableType(valueList) {
      return getPresentationVariant(valueList)?.RecursiveHierarchyQualifier ? true : false;
    },
    /**
     * Gets the delegate for the ValueList's table.
     * @param valueList The valueList annotation
     * @returns The calculated delegate for the ValueList's table
     */
    getTableDelegate: function (valueList) {
      let sDefaultSortPropertyName = _getDefaultSortPropertyName(valueList);
      if (sDefaultSortPropertyName) {
        sDefaultSortPropertyName = `'${sDefaultSortPropertyName}'`;
      }
      const presentationVariant = getPresentationVariant(valueList);
      const recursiveHierarchyQualifier = presentationVariant?.RecursiveHierarchyQualifier;
      if (recursiveHierarchyQualifier) {
        const initialExpansionLevel = presentationVariant.InitialExpansionLevel;
        return "{name: 'sap/fe/macros/internal/valuehelp/TableDelegate', payload: {collectionName: '" + valueList.CollectionPath + "'" + (sDefaultSortPropertyName ? ", defaultSortPropertyName: " + sDefaultSortPropertyName : "") + ", hierarchyQualifier: '" + recursiveHierarchyQualifier + "'" + (initialExpansionLevel ? ", initialExpansionLevel: " + (initialExpansionLevel + 1) : "") + "}}";
      }
      return "{name: 'sap/fe/macros/internal/valuehelp/TableDelegate', payload: {collectionName: '" + valueList.CollectionPath + "'" + (sDefaultSortPropertyName ? ", defaultSortPropertyName: " + sDefaultSortPropertyName : "") + "}}";
    },
    /**
     * Gets the sort conditions set on the ValueList's PresentationVariant.
     * @param valueListInfo The valueList annotation
     * @param isSuggestion Indicates if the ValueList is used in a suggestion scenario
     * @param asCustomdata Indicates if the sort conditions should be returned as custom data
     * @returns The sort conditions if any, undefined otherwise
     */
    getSortConditionsFromPresentationVariant: function (valueListInfo, isSuggestion) {
      let asCustomdata = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      const presentationVariant = getPresentationVariant(valueListInfo);
      if (presentationVariant?.SortOrder) {
        const sortConditions = {
          sorters: []
        };
        presentationVariant.SortOrder.forEach(function (condition) {
          const sorter = {},
            propertyPath = condition?.Property?.$PropertyPath;
          if (isSuggestion) {
            sorter.path = propertyPath;
          } else {
            sorter.name = propertyPath;
          }
          if (condition.Descending) {
            sorter.descending = true;
          } else {
            sorter.ascending = true;
          }
          sortConditions.sorters.push(sorter);
        });
        const stringConverter = asCustomdata ? CommonHelper.stringifyCustomData : JSON.stringify;
        return isSuggestion ? `sorter: ${stringConverter(sortConditions.sorters)}` : stringConverter(sortConditions);
      }
      return;
    },
    /**
     * Gets the sort conditions for the ValueList.
     * @param valueListInfo The ValueList annotation
     * @param isValueHelpWithFixedValues Indicates if ValueList has fixed values
     * @returns The sort conditions either from the presentation variant or the default one, undefined otherwise
     */
    getSortConditionsForValueList: function (valueListInfo, isValueHelpWithFixedValues) {
      const sortConditionsFromPresentationVariant = ValueListHelper.getSortConditionsFromPresentationVariant(valueListInfo, false);
      if (sortConditionsFromPresentationVariant) {
        return sortConditionsFromPresentationVariant;
      }
      if (isValueHelpWithFixedValues) {
        const sortConditions = {
          sorters: [{
            name: _getDefaultSortPropertyName(valueListInfo),
            ascending: true
          }]
        };
        return JSON.stringify(sortConditions);
      }
    },
    getValueListProperty: function (oPropertyContext) {
      const oValueListModel = oPropertyContext.getModel();
      const mValueList = oValueListModel.getObject("/");
      return mValueList.$model.getMetaModel().createBindingContext(`/${mValueList.CollectionPath}/${oPropertyContext.getObject()}`);
    },
    // This function is used for value help m-table and mdc-table
    getColumnVisibility: function (oValueList, oVLParameter, oSource) {
      const isDropDownList = oSource && !!oSource.valueHelpWithFixedValues,
        oColumnInfo = oSource.columnInfo,
        isVisible = !_redundantDescription(oVLParameter, oColumnInfo.columnInfos),
        isDialogTable = oColumnInfo.isDialogTable;
      if (isDropDownList || !isDropDownList && isDialogTable || !isDropDownList && !_hasImportanceHigh(oValueList)) {
        const columnWithHiddenAnnotation = oColumnInfo.columnInfos.find(function (columnInfo) {
          return oVLParameter.ValueListProperty === columnInfo.columnName && columnInfo.hasHiddenAnnotation === true;
        });
        return !columnWithHiddenAnnotation ? isVisible : false;
      } else if (!isDropDownList && _hasImportanceHigh(oValueList)) {
        return oVLParameter && oVLParameter["@com.sap.vocabularies.UI.v1.Importance"] && oVLParameter["@com.sap.vocabularies.UI.v1.Importance"].$EnumMember === "com.sap.vocabularies.UI.v1.ImportanceType/High" ? true : false;
      }
      return true;
    },
    getColumnVisibilityInfo: function (oValueList, sPropertyFullPath, bIsDropDownListe, isDialogTable) {
      const oMetaModel = oValueList.$model.getMetaModel();
      const aColumnInfos = [];
      const oColumnInfos = {
        isDialogTable: isDialogTable,
        columnInfos: aColumnInfos
      };
      oValueList.Parameters.forEach(function (oParameter) {
        const oPropertyAnnotations = oMetaModel.getObject(`/${oValueList.CollectionPath}/${oParameter.ValueListProperty}@`);
        const oTextAnnotation = oPropertyAnnotations && oPropertyAnnotations["@com.sap.vocabularies.Common.v1.Text"];
        let columnInfo = {};
        if (oTextAnnotation) {
          columnInfo = {
            keyColumnHidden: oPropertyAnnotations["@com.sap.vocabularies.UI.v1.Hidden"] ? true : false,
            keyColumnDisplayFormat: oTextAnnotation && _getValueHelpColumnDisplayFormat(oPropertyAnnotations, bIsDropDownListe),
            textColumnName: oTextAnnotation && oTextAnnotation.$Path,
            columnName: oParameter.ValueListProperty,
            hasHiddenAnnotation: oPropertyAnnotations && oPropertyAnnotations["@com.sap.vocabularies.UI.v1.Hidden"] ? true : false
          };
        } else if (oPropertyAnnotations && oPropertyAnnotations["@com.sap.vocabularies.UI.v1.Hidden"]) {
          columnInfo = {
            columnName: oParameter.ValueListProperty,
            hasHiddenAnnotation: oPropertyAnnotations && oPropertyAnnotations["@com.sap.vocabularies.UI.v1.Hidden"] ? true : false
          };
        }
        oColumnInfos.columnInfos.push(columnInfo);
      });
      return oColumnInfos;
    },
    getTableItemsParameters: function (valueListInfo, requestGroupId, isSuggestion, isValueHelpWithFixedValues) {
      const itemParameters = [`path: '/${valueListInfo.CollectionPath}'`];

      // add select to oBindingInfo (BCP 2180255956 / 2170163012)
      const selectString = _build$SelectString(this);

      // since there could be recommendations/recently used values to show in the suggestion popover
      // hence we need to create some transient contexts on the valueHelp list binding
      // so we will set the updateGroupId of the list binding to avoid sending calls to the backend
      // we need to explicitly set $$sharedRequest to false to make sure we can create transient contexts in RAP
      if (requestGroupId) {
        const selectStringPart = selectString ? `, '${selectString}'` : "";
        itemParameters.push(`parameters: {$$sharedRequest: false, $$updateGroupId: "donotsubmit", $$groupId: '${requestGroupId}'${selectStringPart}}`);
      } else if (selectString) {
        itemParameters.push(`parameters: {$$sharedRequest: false, $$updateGroupId: "donotsubmit", $select: '${selectString}'}`);
      }
      const isSuspended = valueListInfo.Parameters.some(function (oParameter) {
        return isSuggestion || oParameter.$Type === "com.sap.vocabularies.Common.v1.ValueListParameterIn";
      });
      itemParameters.push(`suspended: ${isSuspended}`);
      if (!isValueHelpWithFixedValues) {
        itemParameters.push("length: 10");
      }
      const sortConditionsFromPresentationVariant = ValueListHelper.getSortConditionsFromPresentationVariant(valueListInfo, isSuggestion);
      if (sortConditionsFromPresentationVariant) {
        itemParameters.push(sortConditionsFromPresentationVariant);
      } else if (isValueHelpWithFixedValues) {
        const defaultSortPropertyName = _getDefaultSortPropertyName(valueListInfo);
        if (defaultSortPropertyName) {
          itemParameters.push(`sorter: [{path: '${defaultSortPropertyName}', ascending: true}]`);
        }
      }
      return "{" + itemParameters.join(", ") + "}";
    },
    // Is needed for "external" representation in qunit
    hasImportance: function (oValueListContext) {
      return _hasImportanceHigh(oValueListContext.getObject()) ? "Importance/High" : "None";
    },
    // Is needed for "external" representation in qunit
    getMinScreenWidth: function (oValueList) {
      return _hasImportanceHigh(oValueList) ? "{= ${_VHUI>/minScreenWidth}}" : "416px";
    },
    /**
     * Retrieves the column width for a given property.
     * @param propertyPath The propertyPath
     * @param isValueListWithFixedValues An indicator stating if the valueHelp has fixed values
     * @returns The width as a string or undefined.
     */
    getColumnWidth: function (propertyPath) {
      let isValueListWithFixedValues = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      if (CommonUtils.isSmallDevice() || !propertyPath.targetObject) return;
      const property = propertyPath.targetObject;
      let relatedProperty = [property];
      // The additional property could refer to the text, currency, unit or timezone
      const additionalProperty = getAssociatedTextProperty(property) || getAssociatedCurrencyProperty(property) || getAssociatedUnitProperty(property) || getAssociatedTimezoneProperty(property),
        textAnnotation = property.annotations?.Common?.Text,
        textArrangement = textAnnotation?.annotations?.UI?.TextArrangement?.toString(),
        label = property.annotations?.Common?.Label?.toString();
      let displayMode;

      // default textarrangement is only used for VH with fixed values
      if (isValueListWithFixedValues && !textArrangement) {
        //displayMode = as annotated or default
        displayMode = getDisplayMode(propertyPath);
      } else {
        //displayMode = as annotated or undefined
        displayMode = textArrangement && getDisplayMode(propertyPath);
      }
      if (additionalProperty) {
        if (displayMode === "Description") {
          relatedProperty = [additionalProperty];
        } else if (!textAnnotation || displayMode && displayMode !== "Value") {
          relatedProperty.push(additionalProperty);
        }
      }
      let size = 0;
      const instances = [];
      relatedProperty.forEach(prop => {
        const propertyTypeConfig = getTypeConfig(prop, undefined);
        const PropertyODataConstructor = ObjectPath.get(propertyTypeConfig.type);
        if (PropertyODataConstructor) {
          instances.push(new PropertyODataConstructor(propertyTypeConfig.formatOptions, propertyTypeConfig.constraints));
        }
      });
      const sWidth = Util.calcColumnWidth(instances, label);
      size = sWidth ? parseFloat(sWidth.replace("rem", "")) : 0;
      if (size === 0) {
        Log.error(`Cannot compute the column width for property: ${property.name}`);
      }
      return size <= 20 ? size.toString() + "rem" : "20rem";
    },
    getOutParameterPaths: function (aParameters) {
      let sPath = "";
      aParameters.forEach(function (oParameter) {
        if (oParameter.$Type.endsWith("Out")) {
          sPath += `{${oParameter.ValueListProperty}}`;
        }
      });
      return sPath;
    },
    entityIsSearchable: function (propertyAnnotations, collectionAnnotations) {
      const searchSupported = propertyAnnotations.ValueList?.SearchSupported ?? propertyAnnotations["@com.sap.vocabularies.Common.v1.ValueList"]?.SearchSupported,
        searchable = collectionAnnotations.SearchRestrictions?.Searchable ?? collectionAnnotations["@Org.OData.Capabilities.V1.SearchRestrictions"]?.Searchable;
      if (searchable === undefined && searchSupported === false || searchable === true && searchSupported === false || searchable === false) {
        return false;
      }
      return true;
    },
    /**
     * Returns the condition path required for the condition model.
     * For e.g. <1:N-PropertyName>*\/<1:1-PropertyName>/<PropertyName>.
     * @param metaModel The metamodel instance
     * @param entitySet The entity set path
     * @param propertyPath The property path
     * @returns The formatted condition path
     * @private
     */
    _getConditionPath: function (metaModel, entitySet, propertyPath) {
      // (see also: sap/fe/core/converters/controls/ListReport/FilterBar.ts)
      const parts = propertyPath.split("/");
      let conditionPath = "",
        partialPath;
      while (parts.length) {
        let part = parts.shift();
        partialPath = partialPath ? `${partialPath}/${part}` : part;
        const property = metaModel.getObject(`${entitySet}/${partialPath}`);
        if (property && property.$kind === "NavigationProperty" && property.$isCollection) {
          part += "*";
        }
        conditionPath = conditionPath ? `${conditionPath}/${part}` : part;
      }
      return conditionPath;
    },
    /**
     * Returns array of column definitions corresponding to properties defined as Selection Fields on the CollectionPath entity set in a ValueHelp.
     * @param metaModel The metamodel instance
     * @param entitySet The entity set path
     * @returns Array of column definitions
     * @private
     */
    _getColumnDefinitionFromSelectionFields: function (metaModel, entitySet) {
      const columnDefs = [],
        entityTypeAnnotations = metaModel.getObject(`${entitySet}/@`),
        selectionFields = entityTypeAnnotations["@com.sap.vocabularies.UI.v1.SelectionFields"];
      if (selectionFields) {
        selectionFields.forEach(function (selectionField) {
          const selectionFieldPath = `${entitySet}/${selectionField.$PropertyPath}`,
            conditionPath = ValueListHelper._getConditionPath(metaModel, entitySet, selectionField.$PropertyPath),
            propertyAnnotations = metaModel.getObject(`${selectionFieldPath}@`),
            columnDef = {
              path: conditionPath,
              label: propertyAnnotations?.[AnnotationLabel] || selectionFieldPath,
              sortable: true,
              filterable: isPropertyFilterable(metaModel, entitySet, selectionField.$PropertyPath, false),
              $Type: metaModel.getObject(selectionFieldPath)?.$Type
            };
          columnDefs.push(columnDef);
        });
      }
      return columnDefs;
    },
    _mergeColumnDefinitionsFromProperties: function (columnDefs, valueListInfo, valueListProperty, property, propertyAnnotations) {
      let columnPath = valueListProperty,
        columnPropertyType = property.$Type;
      const label = propertyAnnotations[AnnotationLabel] || columnPath,
        textAnnotation = propertyAnnotations[AnnotationText];
      if (textAnnotation && propertyAnnotations[AnnotationTextUITextArrangement]?.$EnumMember === "com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly") {
        // the column property is the one coming from the text annotation
        columnPath = textAnnotation.$Path;
        const textPropertyPath = `/${valueListInfo.CollectionPath}/${columnPath}`;
        columnPropertyType = valueListInfo.$model.getMetaModel()?.getObject(textPropertyPath)?.$Type;
      }
      if (columnNotAlreadyDefined(columnDefs, columnPath)) {
        const columnDef = {
          path: columnPath,
          // ensure the text associated with a column that references a navigation property reflects the same navigation structure as the column
          textPath: textAnnotation?.$Path && valueListProperty.includes("/") ? valueListProperty.substring(0, valueListProperty.lastIndexOf("/")) + "/" + textAnnotation.$Path : textAnnotation?.$Path,
          label: label,
          sortable: true,
          filterable: !propertyAnnotations["@com.sap.vocabularies.UI.v1.HiddenFilter"],
          $Type: columnPropertyType
        };
        columnDefs.push(columnDef);
      }
    },
    filterInOutParameters: function (vhParameters, typeFilter) {
      return vhParameters.filter(function (parameter) {
        return typeFilter.includes(parameter.parmeterType);
      });
    },
    getInParameters: function (vhParameters) {
      return ValueListHelper.filterInOutParameters(vhParameters, [AnnotationValueListParameterIn, AnnotationValueListParameterConstant, AnnotationValueListParameterInOut]);
    },
    getOutParameters: function (vhParameters) {
      return ValueListHelper.filterInOutParameters(vhParameters, [AnnotationValueListParameterOut, AnnotationValueListParameterInOut]);
    },
    createVHUIModel: function (valueHelp, propertyPath, metaModel) {
      // setting the _VHUI model evaluated in the ValueListTable fragment
      const vhUIModel = new JSONModel({}),
        propertyAnnotations = metaModel.getObject(`${propertyPath}@`);
      valueHelp.setModel(vhUIModel, "_VHUI");
      // Identifies the "ContextDependent-Scenario"
      vhUIModel.setProperty("/hasValueListRelevantQualifiers", !!propertyAnnotations[AnnotationsValueListRelevantQualifiers]);
      /* Property label for dialog title */
      vhUIModel.setProperty("/propertyLabel", propertyAnnotations[AnnotationLabel]);
      return vhUIModel;
    },
    /**
     * Returns the title of the value help dialog.
     * By default, the data field label is used, otherwise either the property label or the value list label is used as a fallback.
     * For context-dependent value helps, by default the value list label is used, otherwise either the property label or the data field label is used as a fallback.
     * For unit/currency value helps the connected measure control's label is skipped, we use unit/currency label instead.
     * @param valueHelp The valueHelp instance
     * @param valuehelpLabel The label in the value help metadata
     * @param isUnitValueHelp Whether this value help targets the unit/currency sub-input of a measure Field
     * @returns The title for the valueHelp dialog
     * @private
     */
    _getDialogTitle: function (valueHelp, valuehelpLabel) {
      let isUnitValueHelp = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      const propertyLabel = valueHelp.getModel("_VHUI").getProperty("/propertyLabel");
      const dataFieldLabel = isUnitValueHelp ? undefined : valueHelp.getControl()?.getProperty("label");
      return valueHelp.getModel("_VHUI").getProperty("/hasValueListRelevantQualifiers") ? valuehelpLabel || propertyLabel || dataFieldLabel : dataFieldLabel || propertyLabel || valuehelpLabel;
    },
    destroyVHContent: function (valueHelp) {
      if (valueHelp) {
        valueHelp.getDialog()?.destroyContent();
        valueHelp.getTypeahead()?.destroyContent();
      }
    },
    _getContextPrefix: function (bindingContext, propertyBindingParts) {
      if (bindingContext && bindingContext.getPath()) {
        const bindigContextParts = bindingContext.getPath().split("/");
        if (propertyBindingParts.length - bindigContextParts.length > 1) {
          const contextPrefixParts = [];
          for (let i = bindigContextParts.length; i < propertyBindingParts.length - 1; i++) {
            contextPrefixParts.push(propertyBindingParts[i]);
          }
          return `${contextPrefixParts.join("/")}/`;
        }
      }
      return "";
    },
    /**
     * Resolves the value path for a FilterBar parameter based on entity set matching.
     * Handles two scenarios:
     * 1. Direct property on same entity (e.g., "status" -> "status") fix commit 47ec8f711e.
     * 2. Navigation back to parent (e.g., "packagingComposition/id" -> "id").
     * @param localDataPropertyPath The local data property path
     * @param contextMetaPath The context meta path
     * @param newPath The new path to resolve
     * @returns The resolved value path or undefined
     * @private
     */
    resolveFilterBarValuePath: function (localDataPropertyPath, contextMetaPath, newPath) {
      const pathParts = localDataPropertyPath.split("/");
      if (pathParts.length > 1) {
        const metaPathForObject = contextMetaPath.getMetaPathForObject(newPath.getTarget());
        if (metaPathForObject) {
          return metaPathForObject.getRelativePath();
        }
        return localDataPropertyPath;
      }
      return localDataPropertyPath;
    },
    _getVhParameter: function (conditionModel, valueHelp, contextPrefix, parameter, vhMetaModel, localDataPropertyPath) {
      let valuePath = "";
      const bindingContext = valueHelp?.getBindingContext();
      if (conditionModel && conditionModel.length > 0) {
        if (valueHelp?.getParent()?.isA("sap.ui.mdc.Table") === true && bindingContext && ValueListHelper._parameterIsA(parameter, ["com.sap.vocabularies.Common.v1.ValueListParameterIn", "com.sap.vocabularies.Common.v1.ValueListParameterInOut"])) {
          // Special handling for value help used in filter dialog
          const parts = localDataPropertyPath.split("/");
          if (parts.length > 1) {
            const firstNavigationProperty = parts[0];
            const oBoundEntity = vhMetaModel.getMetaContext(bindingContext.getPath());
            const sPathOfTable = valueHelp.getParent().getRowBinding().getPath(); //TODO
            if (oBoundEntity.getObject(`${sPathOfTable}/$Partner`) === firstNavigationProperty) {
              // Using the condition model doesn't make any sense in case an in-parameter uses a navigation property
              // referring to the partner. Therefore using the FVH context instead of the condition model.
              valuePath = localDataPropertyPath;
            }
          }
        } else if (valueHelp?.getParent()?.getParent()?.getParent()?.isA("sap.fe.macros.FilterBar") === true && bindingContext && ValueListHelper._parameterIsA(parameter, ["com.sap.vocabularies.Common.v1.ValueListParameterIn", "com.sap.vocabularies.Common.v1.ValueListParameterInOut"])) {
          // In case we are a value help of a FilterBar, we can go up to the API to check if we are on a filterbar representing a navigation property
          const filterBarAPI = valueHelp.getParent()?.getParent()?.getParent();
          const filterBarMetaPath = filterBarAPI.metaPath;
          const valueHelpContextPath = vhMetaModel.getMetaPath(bindingContext.getPath());
          const contextMetaPath = new MetaPath(convertTypes(vhMetaModel), valueHelpContextPath, valueHelpContextPath);
          const metaPath = new MetaPath(convertTypes(vhMetaModel), filterBarMetaPath, valueHelpContextPath);
          const newPath = metaPath.getMetaPathForPath(localDataPropertyPath);
          if (newPath && newPath.getTarget()) {
            const targetEntitySet = newPath.getClosestEntitySet();
            if (targetEntitySet === contextMetaPath.getClosestEntitySet()) {
              valuePath = ValueListHelper.resolveFilterBarValuePath(localDataPropertyPath, contextMetaPath, newPath);
            }
          }
        }
        if (!valuePath) {
          valuePath = conditionModel + ">/conditions/" + localDataPropertyPath;
        }
      } else {
        valuePath = contextPrefix + localDataPropertyPath;
      }
      return {
        parmeterType: parameter.$Type,
        source: valuePath,
        helpPath: parameter.ValueListProperty,
        constantValue: parameter.Constant,
        initialValueIsSignificant: Boolean(parameter.InitialValueIsSignificant)
      };
    },
    _parameterIsA(parameter, parameterTypes) {
      return parameterTypes.includes(parameter.$Type);
    },
    /**
     * Enriches a path object with key, field property path, and description path based on value list parameters and property annotations.
     *
     * This method handles external ID path resolution for navigation properties and configures the path object
     * for value help scenarios with InOut and Out parameters.
     * @param path The path object to be enriched
     * @param propertyPath The property path to be set as the field property path
     * @param localDataPropertyPath The local data property path i.e. "fk"
     * @param parameter The value list parameter containing ValueListProperty and type information
     * @param [propertyName] The name of the property being processed
     * @param propertyAnnotations The annotations for the property, including text annotations
     * @param [externalIdPath] The external ID path for navigation property resolution
     * @param isPropertyNotNullable Indicates whether the property is not nullable
     * @param isAdaptationFilterBar Indicates whether the context is an adaptation filter bar
     * @param collectionPath The collection path to match against for navigation property validation
     * @param [metaModel] The OData metamodel for navigation property resolution
     * @param [payloadPropertyPath] The full payload property path for navigation property context i.e. "/entities/fk" along with parent entity set "/entities"
     */
    _enrichPath: function (path, propertyPath, localDataPropertyPath, parameter, propertyName, propertyAnnotations, externalIdPath, isPropertyNotNullable, isAdaptationFilterBar, collectionPath, metaModel, payloadPropertyPath) {
      const ParameterTypes = ["com.sap.vocabularies.Common.v1.ValueListParameterInOut"];
      if (isPropertyNotNullable || isAdaptationFilterBar) {
        ParameterTypes.push("com.sap.vocabularies.Common.v1.ValueListParameterOut");
      }
      if (!path.key && ValueListHelper._parameterIsA(parameter, ParameterTypes) && localDataPropertyPath === propertyName) {
        /* EXTERNALID */
        if (metaModel && externalIdPath?.includes("/") && payloadPropertyPath) {
          const [associatedProperty, targetProperty] = externalIdPath.split("/");
          const entitySet = payloadPropertyPath.split("/")[1];
          if (this._isNavigationProperty(metaModel, entitySet, associatedProperty, payloadPropertyPath, collectionPath)) {
            parameter.ValueListProperty = targetProperty;
          }
        }
        path.fieldPropertyPath = propertyPath;
        path.key = parameter.ValueListProperty;

        //Only the text annotation of the key can specify the description
        path.descriptionPath = propertyAnnotations[AnnotationText]?.$Path || "";
      }
    },
    /**
     * Checks if a property is a navigation property by examining navigation property bindings and metadata.
     * @param metaModel The OData metamodel
     * @param entitySet The entity set name
     * @param propertyName The associated property name to check
     * @param payloadPropertyPath The full payload property path i.e. "/ReportCategory/fees/linkEPRFeeItems/selectedReportingGroup1Id"
     * @param collectionPath The collection path to match against
     * @returns True if the property is a navigation property, false otherwise
     */
    _isNavigationProperty: function (metaModel, entitySet, propertyName, payloadPropertyPath, collectionPath) {
      const convertedMetadata = convertTypes(metaModel);
      const entitySetObject = convertedMetadata.entitySets.find(es => es.name === entitySet);
      if (!entitySetObject) {
        return false;
      }

      // Check NavigationPropertyBinding for direct navigation;
      // Check NavigationPropertyBinding one level above the property like "entities/fc" and assoc is a direct navigationbinding of the entity set entities
      const navBinding = entitySetObject.navigationPropertyBinding[propertyName];
      if (navBinding?.name === collectionPath) {
        return true;
      }

      // Check for NavigationProperty in nested paths
      // When more levels present check for NavigationProperty in the metaModel like "/ReportCategory/fees/linkEPRFeeItems/selectedReportingGroup1Id" and now check if assoc is a navigation property of the last segment "selectedReportingGroup1Id"
      const parentPath = payloadPropertyPath.substring(0, payloadPropertyPath.lastIndexOf("/"));
      const resolvedPath = convertedMetadata.resolvePath(parentPath);
      const targetType = resolvedPath?.target?.targetType;
      if (targetType?.navigationProperties) {
        const navigationProperty = targetType.navigationProperties.find(navProperty => navProperty.name === propertyName);
        if (navigationProperty?.targetType?.name === collectionPath) {
          return true;
        }
      }
      return false;
    },
    _enrichKeys: function (vhKeys, parameter) {
      if (ValueListHelper._parameterIsA(parameter, ValueListHelper.getInAndOutParametersList()) && !vhKeys.includes(parameter.ValueListProperty)) {
        vhKeys.push(parameter.ValueListProperty);
      }
    },
    _getEntityType: async function (metaModelVH, entitySetPath) {
      return metaModelVH.getObject(`${entitySetPath}/`) || (await metaModelVH.requestObject(`${entitySetPath}/`));
    },
    /**
     * Method to pre-process a value list annotation before using them in the templating.
     * @param annotationValueListType
     * @param propertyName
     * @param conditionModel
     * @param valueHelp
     * @param contextPrefix
     * @param metaModel
     * @param valueHelpQualifier
     * @param payload
     * @param entityType
     * @returns The ValueListInfo to be used in templating
     */
    _processParameters: function (annotationValueListType, propertyName, conditionModel, valueHelp, contextPrefix, metaModel, valueHelpQualifier, payload, entityType) {
      const isForMultiValueField = payload?.useMultiValueField;
      const metaModelVH = annotationValueListType.$model.getMetaModel(),
        entitySetPath = `/${annotationValueListType.CollectionPath}`;
      if (entityType === undefined) {
        Log.error(`Inconsistent value help metadata: Entity ${entitySetPath} is not defined`);
        return;
      }
      const columnDefs = ValueListHelper._getColumnDefinitionFromSelectionFields(metaModelVH, entitySetPath),
        vhParameters = [],
        path = {
          fieldPropertyPath: "",
          descriptionPath: "",
          key: ""
        };
      let vhKeys = [];
      let isAdaptationFilterBar;
      if ("$Key" in entityType && entityType.$Key) {
        vhKeys = [...entityType.$Key];
      }
      const firstKey = vhKeys[0];
      for (const parameter of annotationValueListType.Parameters) {
        //All String fields are allowed for filter
        const propertyPath = `/${annotationValueListType.CollectionPath}/${parameter.ValueListProperty}`,
          property = metaModelVH.getObject(propertyPath),
          propertyAnnotations = payload?.externalIdPath ? metaModelVH.getObject(`/${annotationValueListType.CollectionPath}/${payload?.externalIdPath.split("/").pop()}@`) || {} : metaModelVH.getObject(`${propertyPath}@`) || {},
          localDataPropertyPath = parameter.LocalDataProperty?.$PropertyPath || "";
        if (payload && propertyAnnotations[AnnotationsPersonalDataPotentiallySensitive]) {
          payload.isPotentiallySensitive = true;
        }
        const isPropertyNotNullable = property?.$Nullable === false,
          field = valueHelp?.getControl?.();
        const control = field?.getParent();
        isAdaptationFilterBar = control?.isA(adaptationFilterBar) ?? false;
        // If property is undefined, then the property coming for the entry isn't defined in
        // the metamodel, therefore we don't need to add it in the in/out parameters
        if (property) {
          // Search for the *out Parameter mapped to the local property
          ValueListHelper._enrichPath(path, propertyPath, localDataPropertyPath, parameter, propertyName, propertyAnnotations, payload?.externalIdPath, isPropertyNotNullable, isAdaptationFilterBar, `${annotationValueListType.CollectionPath}`, metaModel, payload?.propertyPath);
          const valueListProperty = parameter.ValueListProperty;
          ValueListHelper._mergeColumnDefinitionsFromProperties(columnDefs, annotationValueListType, valueListProperty, property, propertyAnnotations);
        }

        //In and InOut and Out
        if (ValueListHelper._parameterIsA(parameter, ["com.sap.vocabularies.Common.v1.ValueListParameterIn", "com.sap.vocabularies.Common.v1.ValueListParameterOut", "com.sap.vocabularies.Common.v1.ValueListParameterInOut"]) && localDataPropertyPath !== propertyName || !isAdaptationFilterBar && !isPropertyNotNullable && ValueListHelper._parameterIsA(parameter, ["com.sap.vocabularies.Common.v1.ValueListParameterOut"])) {
          const vhParameter = ValueListHelper._getVhParameter(conditionModel, valueHelp, contextPrefix, parameter, metaModel, localDataPropertyPath);
          // Derive conditionPath from helpPath for 1:n navigation detection
          try {
            const conditionPath = ValueListHelper._getConditionPath(metaModelVH, entitySetPath, parameter.ValueListProperty);
            if (conditionPath && conditionPath !== parameter.ValueListProperty) {
              vhParameter.conditionPath = conditionPath;
            }
          } catch (error) {
            ValueListHelper._logError("ValueListHelper", error);
          }
          if (!isForMultiValueField || isForMultiValueField && ValueListHelper._parameterIsA(parameter, ["com.sap.vocabularies.Common.v1.ValueListParameterIn"])) {
            // in case of Multivalue Field we disregard ValueListParameterInOut
            vhParameters.push(vhParameter);
          }
        }

        //Constant as InParamter for filtering
        if (parameter.$Type === AnnotationValueListParameterConstant) {
          const constantParameter = {
            parmeterType: parameter.$Type,
            source: parameter.ValueListProperty,
            helpPath: parameter.ValueListProperty,
            constantValue: parameter.Constant,
            initialValueIsSignificant: Boolean(parameter.InitialValueIsSignificant)
          };

          // Derive conditionPath for constant parameters as well
          try {
            const conditionPath = ValueListHelper._getConditionPath(metaModelVH, entitySetPath, parameter.ValueListProperty);
            if (conditionPath && conditionPath !== parameter.ValueListProperty) {
              constantParameter.conditionPath = conditionPath;
            }
          } catch (error) {
            ValueListHelper._logError("ValueListHelper", error);
          }
          vhParameters.push(constantParameter);
        }

        // Enrich keys with out-parameters
        ValueListHelper._enrichKeys(vhKeys, parameter);
      }
      if (!path.key) {
        path.key = firstKey;
        const propertyPath = `/${annotationValueListType.CollectionPath}/${firstKey}`;
        const propertyAnnotations = metaModelVH.getObject(`${propertyPath}@`) || {};
        // We update path.descriptionPath for the key property
        path.descriptionPath = propertyAnnotations[AnnotationText]?.$Path || "";
      }

      /* Ensure that vhKeys are part of the columnDefs, otherwise it is not considered in $select (BCP 2270141154) */
      for (const vhKey of vhKeys) {
        if (columnNotAlreadyDefined(columnDefs, vhKey)) {
          const columnDef = {
            path: vhKey,
            $Type: metaModelVH.getObject(`/${annotationValueListType.CollectionPath}/${path.key}`)?.$Type,
            label: "",
            sortable: false,
            filterable: undefined
          };
          columnDefs.push(columnDef);
        }
      }
      const valuelistInfo = {
        keyPath: path.key,
        descriptionPath: path.descriptionPath,
        fieldPropertyPath: path.fieldPropertyPath,
        vhKeys: vhKeys,
        vhParameters: vhParameters,
        valueListInfo: annotationValueListType,
        columnDefs: columnDefs,
        valueHelpQualifier
      };
      return valuelistInfo;
    },
    _logError: function (propertyPath, error) {
      const status = error ? error.status : undefined;
      const message = error instanceof Error ? error.message : String(error);
      const msg = status === 404 ? `Metadata not found (${status}) for value help of property ${propertyPath}` : message;
      Log.error(msg);
    },
    /**
     * Filters out value list qualifiers that should not be used for regular value helps.
     * This includes visual filter qualifiers (for FilterFields with visual filters) and qualifiers with chart annotations (for non-FilterFields).
     * @param valueHelp The value help instance
     * @param propertyPath The property path
     * @param valueHelpQualifiers The list of value help qualifiers to filter
     * @param valueListByQualifier Map of qualifiers to their value list annotations
     * @returns Filtered list of value help qualifiers
     * @private
     */
    _filterValueHelpQualifiers: function (valueHelp, propertyPath, valueHelpQualifiers, valueListByQualifier) {
      if (!valueHelp) {
        return valueHelpQualifiers;
      }
      const control = valueHelp.getControl?.();
      const isFilterField = control?.isA("sap.ui.mdc.FilterField");

      // Check if this FilterField contains a visual filter
      if (isFilterField === true) {
        const visualFilterQualifier = control?.getCustomData().find(cdv => cdv.getKey() === "valueListQualifier");
        let visualFilterQualifierValue;
        if (visualFilterQualifier) {
          visualFilterQualifierValue = visualFilterQualifier.getValue();
        } // FIRST: For FilterFields with VisualFilter, filter out the visual filter qualifier
        if (visualFilterQualifier) {
          if (visualFilterQualifier !== undefined) {
            return valueHelpQualifiers.filter(qualifier => qualifier !== visualFilterQualifierValue);
          }
        }
      }

      // SECOND: For non-FilterFields, filter out qualifiers with Chart annotations
      else if (isFilterField === false) {
        return valueHelpQualifiers.filter(qualifier => {
          const presentationVariant = getPresentationVariant(valueListByQualifier[qualifier]);
          const hasChartAnnotation = presentationVariant?.Visualizations?.some(visualization => {
            const annotationPath = visualization.$AnnotationPath;
            return annotationPath?.includes("@com.sap.vocabularies.UI.v1.Chart");
          });
          return hasChartAnnotation !== true;
        });
      }
      return valueHelpQualifiers;
    },
    /**
     * Method to compute the value list infos based on the value list annotations before using them at templating.
     * If a property has a visual filter configured, the visual filter's value list qualifier is excluded from the results.
     * This ensures that visual filters use their dedicated value list while regular value helps use the default or other qualifiers.
     * @param valueHelp
     * @param propertyPath
     * @param payload
     * @param metaModel
     * @returns The value list infos (excluding visual filter qualifiers)
     */
    getValueListInfo: async function (valueHelp, propertyPath, payload, metaModel) {
      const bindingContext = valueHelp?.getBindingContext(),
        conditionModel = payload?.conditionModel,
        valueListInfos = [],
        propertyPathParts = propertyPath.split("/");
      try {
        const valueListByQualifier = await metaModel.requestValueListInfo(propertyPath, true, bindingContext);
        let valueHelpQualifiers = putDefaultQualifierFirst(Object.keys(valueListByQualifier));
        const propertyName = propertyPathParts.pop();

        // Filter out qualifiers that should not be used for regular value helps (visual filters, charts)
        valueHelpQualifiers = ValueListHelper._filterValueHelpQualifiers(valueHelp, propertyPath, valueHelpQualifiers, valueListByQualifier);
        const contextPrefix = payload?.useMultiValueField === true ? ValueListHelper._getContextPrefix(bindingContext, propertyPathParts) : "";
        for (const valueHelpQualifier of valueHelpQualifiers) {
          // Add column definitions for properties defined as Selection fields on the CollectionPath entity set.
          const annotationValueListType = valueListByQualifier[valueHelpQualifier];
          const metaModelVH = annotationValueListType.$model.getMetaModel(),
            entitySetPath = `/${annotationValueListType.CollectionPath}`;
          const entityType = await ValueListHelper._getEntityType(metaModelVH, entitySetPath);
          const valueListInfo = ValueListHelper._processParameters(annotationValueListType, propertyName, conditionModel, valueHelp, contextPrefix, metaModel, annotationValueListType.$qualifier ?? valueHelpQualifier,
          // for ValueListWithFixedValues, get the qualifier from $qualifier
          payload, entityType);
          /* Only consistent value help definitions shall be part of the value help */
          if (valueListInfo) {
            valueListInfos.push(valueListInfo);
          }
        }
      } catch (err) {
        this._logError(propertyPath, err);
        ValueListHelper.destroyVHContent(valueHelp);
      }
      return valueListInfos;
    },
    ALLFRAGMENTS: [],
    logFragment: undefined,
    _logTemplatedFragments: function (propertyPath, fragmentName, fragmentDefinition) {
      const logInfo = {
        path: propertyPath,
        fragmentName: fragmentName,
        fragment: fragmentDefinition
      };
      if (Log.getLevel() === Log.Level.DEBUG) {
        //In debug mode we log all generated fragments
        ValueListHelper.ALLFRAGMENTS = ValueListHelper.ALLFRAGMENTS || [];
        ValueListHelper.ALLFRAGMENTS.push(logInfo);
      }
      if (ValueListHelper.logFragment) {
        //One Tool Subscriber allowed
        setTimeout(function () {
          ValueListHelper.logFragment?.(logInfo);
        }, 0);
      }
    },
    _templateFragment: async function (fragmentName, valueListInfo, sourceModel, propertyPath, valueHelp) {
      let enableLinksInDialogTable = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
      const containingView = CommonUtils.getTargetView(valueHelp);
      const appComponent = CommonUtils.getAppComponent(CommonUtils.getTargetView(valueHelp));
      const localValueListInfo = valueListInfo.valueListInfo,
        valueListModel = new JSONModel(localValueListInfo),
        valueListServiceMetaModel = localValueListInfo.$model.getMetaModel(),
        viewData = new JSONModel(getViewDataForTemplate(valueListInfo.columnDefs, enableLinksInDialogTable));
      const fragmentDefinition = await XMLPreprocessor.process(await XMLTemplateProcessor.loadTemplatePromise(fragmentName, "fragment"), {
        name: fragmentName
      }, {
        bindingContexts: {
          valueList: valueListModel.createBindingContext("/"),
          contextPath: valueListServiceMetaModel.createBindingContext(`/${localValueListInfo.CollectionPath}/`),
          source: sourceModel.createBindingContext("/")
        },
        models: {
          valueList: valueListModel,
          contextPath: valueListServiceMetaModel,
          source: sourceModel,
          metaModel: valueListServiceMetaModel,
          viewData: viewData
        },
        appComponent
      });
      ValueListHelper._logTemplatedFragments(propertyPath, fragmentName, fragmentDefinition);
      const templateComponent = containingView.getController()?.getOwnerComponent();
      if (templateComponent) {
        return templateComponent.runAsOwner(async () => {
          return await Fragment.load({
            definition: fragmentDefinition,
            controller: containingView.getController()
          });
        });
      } else {
        return await Fragment.load({
          definition: fragmentDefinition,
          controller: containingView.getController()
        });
      }
    },
    _getContentId: function (valueHelpId, valueHelpQualifier, isTypeahead) {
      const contentType = isTypeahead ? "Popover" : "Dialog";
      return `${valueHelpId}::${contentType}::qualifier::${valueHelpQualifier}`;
    },
    _addInOutParametersToPayload: function (payload, valueListInfo) {
      const valueHelpQualifier = valueListInfo.valueHelpQualifier;
      if (!payload.qualifiers) {
        payload.qualifiers = {};
      }
      if (!payload.qualifiers[valueHelpQualifier]) {
        const vhProperties = new Set();
        valueListInfo.columnDefs.forEach(column => {
          if (!column.path.includes("*")) {
            // In case of 1..n the condition path includes a * so we have to remove this
            vhProperties.add(column.path);
          }
          if (column.textPath) {
            vhProperties.add(column.textPath);
          }
        });
        payload.qualifiers[valueHelpQualifier] = {
          vhKeys: valueListInfo.vhKeys,
          vhParameters: valueListInfo.vhParameters,
          vhProperties: Array.from(vhProperties)
        };
      }
    },
    _getValueHelpColumnDisplayFormat: function (propertyAnnotations, isValueHelpWithFixedValues) {
      const displayMode = CommonUtils.computeDisplayMode(propertyAnnotations, undefined),
        textAnnotation = propertyAnnotations && propertyAnnotations[AnnotationText],
        textArrangementAnnotation = textAnnotation && propertyAnnotations[AnnotationTextUITextArrangement];
      if (isValueHelpWithFixedValues) {
        return textAnnotation && typeof textAnnotation !== "string" && textAnnotation.$Path ? displayMode : "Value";
      } else {
        // Only explicit defined TextArrangements in a Value Help with Dialog are considered
        return textArrangementAnnotation ? displayMode : "Value";
      }
    },
    _getWidthInRem: function (control, isUnitValueHelp) {
      let width = control.$().width(); // JQuery
      if (isUnitValueHelp && width) {
        width = 0.3 * width;
      }
      const floatWidth = width ? parseFloat(String(Rem.fromPx(width))) : 0;
      return isNaN(floatWidth) ? 0 : floatWidth;
    },
    _getTableWidth: function (table, minWidth, isMultiSelect) {
      let width;
      const columns = table.getColumns(),
        visibleColumns = columns && columns.filter(function (column) {
          return column && column.getVisible && column.getVisible();
        }) || [],
        // we add 1em for every column and 2.5em for a multiselect checkbox
        initialSum = visibleColumns.length + (isMultiSelect ? 2.5 : 0),
        sumWidth = visibleColumns.reduce(function (sum, column) {
          width = column.getWidth();
          if (width && width.endsWith("px")) {
            width = String(Rem.fromPx(width));
          }
          const floatWidth = parseFloat(width);
          return sum + (isNaN(floatWidth) ? 9 : floatWidth);
        }, initialSum);
      return `${Math.max(sumWidth, minWidth)}em`;
    },
    /**
     * Constructs JSON Model with the properties for the value help dialog fragment where it is used as a source object.
     * @param valueListInfo Value list info
     * @param propertyPath The property path
     * @param content Content for which this fragment will be set
     * @param payload Value help payload
     * @returns JSONModel
     * @private
     */
    _getJSONModelForDialog: function (valueListInfo, propertyPath, content, payload) {
      const isDropDownListe = false,
        isDialogTable = true,
        columnInfo = ValueListHelper.getColumnVisibilityInfo(valueListInfo.valueListInfo, propertyPath, isDropDownListe, isDialogTable);
      return new JSONModel({
        id: content.getId(),
        groupId: payload.requestGroupId,
        bSuggestion: false,
        columnInfo: columnInfo,
        valueHelpWithFixedValues: isDropDownListe
      });
    },
    /**
     * Constructs JSON Model with the properties for the define condition value help fragment in the value help dialog where it is used as a source object.
     * @param valueListInfo Value list info
     * @param propertyPath The property path
     * @param content Content for which this fragment will be set
     * @param payload Value help payload
     * @param caseSensitive
     * @returns JSONModel
     * @private
     */
    _getJSONModelForCondition: function (valueListInfo, propertyPath, content, payload, caseSensitive) {
      const isDropDownListe = false,
        isDialogTable = false,
        columnInfo = ValueListHelper.getColumnVisibilityInfo(valueListInfo.valueListInfo, propertyPath, isDropDownListe, isDialogTable);
      return new JSONModel({
        id: content.getId(),
        groupId: payload.requestGroupId || undefined,
        bSuggestion: true,
        columnInfo: columnInfo,
        valueHelpWithFixedValues: isDropDownListe,
        descriptionPath: valueListInfo.descriptionPath,
        keyPath: valueListInfo.keyPath,
        propertyPath,
        caseSensitive
      });
    },
    /**
     * Constructs JSON Model with the properties for the value help typeahead fragment where it is used as a source object.
     * @param valueListInfo Value list info
     * @param propertyPath The property path
     * @param content Content for which this fragment will be set
     * @param payload Value help payload
     * @param valueHelpWithFixedValues Specify is it dropdownlist or not
     * @returns JSONModel
     * @private
     */
    _getJSONModelForTypeahead: function (valueListInfo, propertyPath, content, payload, valueHelpWithFixedValues) {
      const isDialogTable = false,
        contentId = content.getId(),
        columnInfo = ValueListHelper.getColumnVisibilityInfo(valueListInfo.valueListInfo, propertyPath, valueHelpWithFixedValues, isDialogTable);
      return new JSONModel({
        id: contentId,
        groupId: payload.requestGroupId || undefined,
        bSuggestion: true,
        propertyPath: propertyPath,
        columnInfo: columnInfo,
        valueHelpWithFixedValues: valueHelpWithFixedValues
      });
    },
    _createValueHelpTypeahead: async function (propertyPath, valueHelp, content, valueListInfo, payload, metaModel) {
      const propertyAnnotations = metaModel.getObject(`${propertyPath}@`),
        valueHelpWithFixedValues = propertyAnnotations[AnnotationValueListWithFixedValues] ?? false,
        sourceModel = this._getJSONModelForTypeahead(valueListInfo, propertyPath, content, payload, valueHelpWithFixedValues);
      content.setKeyPath(valueListInfo.keyPath);
      content.setDescriptionPath(valueListInfo.descriptionPath);
      payload.isValueListWithFixedValues = valueHelpWithFixedValues;
      payload.isPotentiallySensitive = payload.isPotentiallySensitive ?? propertyAnnotations[AnnotationsPersonalDataPotentiallySensitive];
      payload.history = {
        enabled: this.checkHistoryEnabled(valueHelp, payload)
      };
      const collectionAnnotations = valueListInfo.valueListInfo.$model.getMetaModel().getObject(`/${valueListInfo.valueListInfo.CollectionPath}@`) || {};
      content.data("searchSupported", ValueListHelper.entityIsSearchable(propertyAnnotations, collectionAnnotations) ? true : false);
      const table = await ValueListHelper._templateFragment("sap.fe.macros.internal.valuehelp.ValueListTable", valueListInfo, sourceModel, propertyPath, valueHelp);
      table.setModel(valueListInfo.valueListInfo.$model);
      Log.info(`Value List- suggest Table XML content created [${propertyPath}]`, table.getMetadata().getName(), "MDC Templating");
      content.setTable(table);
      const field = valueHelp.getControl();
      if (field !== undefined && (field.isA("sap.ui.mdc.FilterField") || field.isA("sap.ui.mdc.Field") || field.isA("sap.ui.mdc.Field") && valueHelpWithFixedValues || field.isA("sap.ui.mdc.MultiValueField"))) {
        //Can the filterfield be something else that we need the .isA() check?
        const tableMode = valueHelpWithFixedValues && field.getMaxConditions() !== 1 ? "MultiSelect" : "SingleSelectMaster";
        table.setMode(tableMode);
        table.addEventDelegate({
          onAfterRendering: function () {
            ResizeHandler.register(table, function () {
              ValueListHelper._setTableWidth(table, field, tableMode, payload.isUnitValueHelp);
            });
          }
        });
        this._setTableWidth(table, field, tableMode, payload.isUnitValueHelp);
      }
    },
    _setTableWidth(table, field, tableMode, isUnitValueHelp) {
      // On small devices, use percentage width for better reflow
      if (CommonUtils.isSmallDevice()) {
        table.setWidth("100%");
        return;
      }
      const reduceWidthForUnitValueHelp = Boolean(isUnitValueHelp);
      const tableWidth = ValueListHelper._getTableWidth(table, ValueListHelper._getWidthInRem(field, reduceWidthForUnitValueHelp), tableMode === "MultiSelect");
      table.setWidth(tableWidth);
    },
    /**
     * Check if the history is enabled for a certain field.
     * @param valueHelp The value help instance
     * @param payload Value help payload
     * @returns True if the history is enabled, false otherwise
     */
    checkHistoryEnabled: function (valueHelp, payload) {
      const appComponent = CommonUtils.getAppComponent(CommonUtils.getTargetView(valueHelp));
      const historySettings = appComponent.getManifestEntry("sap.fe")?.historySettings;
      return historySettings?.fields?.[payload.propertyPath]?.historyEnabled ?? true;
    },
    isValueListSearchable(propertyPath, valueList) {
      const valueListMetamodel = valueList.valueListInfo.$model.getMetaModel();
      const propertyAnnotations = valueListMetamodel.getObject(`${propertyPath}@`) ?? {};
      const collectionAnnotations = valueListMetamodel.getObject(`/${valueList.valueListInfo.CollectionPath}@`) ?? {};
      return ValueListHelper.entityIsSearchable(propertyAnnotations, collectionAnnotations);
    },
    _createValueHelpDialog: async function (metaModel, propertyPath, valueHelp, content, valueListInfo, payload, conditionContent) {
      const propertyAnnotations = valueHelp.getModel().getMetaModel().getObject(`${propertyPath}@`),
        sourceModelDialog = this._getJSONModelForDialog(valueListInfo, propertyPath, content, payload);
      content.setKeyPath(valueListInfo.keyPath);
      content.setDescriptionPath(valueListInfo.descriptionPath);
      const collectionAnnotations = valueListInfo.valueListInfo.$model.getMetaModel().getObject(`/${valueListInfo.valueListInfo.CollectionPath}@`) || {};
      content.data("searchSupported", ValueListHelper.entityIsSearchable(propertyAnnotations, collectionAnnotations) ? true : false);
      payload.isPotentiallySensitive = payload.isPotentiallySensitive ?? propertyAnnotations[AnnotationsPersonalDataPotentiallySensitive];
      if (conditionContent) {
        const firstTypeAheadContent = valueHelp.getTypeahead().getContent()[0],
          caseSensitive = firstTypeAheadContent.getCaseSensitive();
        const sourceModelCondition = this._getJSONModelForCondition(valueListInfo, propertyPath, content, payload, caseSensitive);
        const condition = await ValueListHelper._templateFragment("sap.fe.macros.internal.valuehelp.ValueListForCondition", valueListInfo, sourceModelCondition, propertyPath, valueHelp);
        /* As the condition is not added to an aggregation, but just associated, we need to explicitly set the model */
        condition.setModel(metaModel);

        /* Add as dependent, otherwise it will not be properly destroyed during lifecycle handling */
        conditionContent.addDependent(condition);
        conditionContent.setValueHelp(condition.getId());
        const conditionTable = condition.getTypeahead().getContent()[0] // there is only one table
        .getTable();
        const tableWidth = ValueListHelper._getTableWidth(conditionTable, 0, false);
        conditionTable.setWidth(tableWidth);
      }
      const appComponent = CommonUtils.getAppComponent(CommonUtils.getTargetView(valueHelp));
      const manifestSettings = appComponent.getManifestEntry("sap.fe");
      const enableLinksInDialogTable = manifestSettings?.macros?.valueHelp?.enableLinksInDialogTable;
      const tablePromise = ValueListHelper._templateFragment("sap.fe.macros.internal.valuehelp.ValueListDialogTable", valueListInfo, sourceModelDialog, propertyPath, valueHelp, enableLinksInDialogTable);
      const filterBar = ValueListHelper._createValueHelpFilterBar(valueListInfo, sourceModelDialog, valueHelp);
      const table = await tablePromise;
      table.setModel(valueListInfo.valueListInfo.$model);
      filterBar.setModel(valueListInfo.valueListInfo.$model);
      content.setFilterBar(filterBar);
      content.setTable(table);
      table.setFilter(filterBar.getId());
      table.initialized();
      table.setWidth("100%");
      ValueListHelper.setCopyProviderVisibility(table, valueHelp);

      //This is a temporary workarround - provided by MDC (see FIORITECHP1-24002)
      const mdcTable = table;
      mdcTable._setShowP13nButton(false);
    },
    /**
     * Creates a ValueHelpFilterBar for the value help dialog using the ValueHelpFilterBarCreator.
     * @param valueListInfo The value list information
     * @param sourceModelDialog The source model for the dialog
     * @param valueHelp The parent ValueHelp control
     * @returns The created MDCValueHelpFilterBar instance
     */
    _createValueHelpFilterBar: function (valueListInfo, sourceModelDialog, valueHelp) {
      const view = CommonUtils.getTargetView(valueHelp);
      const templateComponent = view.getController()?.getOwnerComponent();
      const valueListServiceMetaModel = valueListInfo.valueListInfo.$model.getMetaModel();
      return templateComponent.runAsOwner(() => {
        return new ValueHelpFilterBarCreator({
          sourceId: sourceModelDialog.getProperty("/id"),
          valueListInfo: valueListInfo,
          metaPath: valueListServiceMetaModel.createBindingContext(`/${valueListInfo.valueListInfo.CollectionPath}/`),
          parentVHControl: valueHelp,
          hideBasicSearch: true,
          enableFallback: true,
          liveMode: false
        }).getValueHelpFilterBar();
      });
    },
    /**
     * Set the visible attribute of the CopyProvider based on the MaxCondition of the field.
     * In case of a single selection, the copy button is hidden. In another case, it is visible.
     * @param table The MDC table of the Value Help dialog
     * @param valueHelp The Value Help object
     */
    setCopyProviderVisibility: function (table, valueHelp) {
      if (valueHelp.getControl()?.isA("sap.ui.mdc.field.FieldBase")) {
        table.getCopyProvider()?.setVisible(true);
      }
    },
    _getContentById: function (contentList, contentId) {
      return contentList.find(function (item) {
        return item.getId() === contentId;
      });
    },
    _createPopoverContent: function (contentId, caseSensitive, useAsValueHelp) {
      return new MTable({
        id: contentId,
        group: "group1",
        caseSensitive: caseSensitive,
        useAsValueHelp: useAsValueHelp
      });
    },
    _createDialogContent: function (contentId, caseSensitive, forceBind) {
      return new MDCTable({
        id: contentId,
        group: "group1",
        caseSensitive: caseSensitive,
        forceBind: forceBind
      });
    },
    _showConditionsContent: function (contentList, container) {
      let conditionsContent = contentList.length && contentList[contentList.length - 1].getMetadata().getName() === "sap.ui.mdc.valuehelp.content.Conditions" ? contentList[contentList.length - 1] : undefined;
      if (conditionsContent) {
        conditionsContent.setVisible(true);
      } else {
        conditionsContent = new Conditions();
        container.addContent(conditionsContent);
      }
      return conditionsContent;
    },
    _alignOrCreateContent: function (valueListInfo, contentId, caseSensitive, showConditionPanel, container) {
      const contentList = container.getContent();
      let content = ValueListHelper._getContentById(contentList, contentId);
      if (!content) {
        const forceBind = valueListInfo.valueListInfo.FetchValues === 2 ? false : true;
        content = ValueListHelper._createDialogContent(contentId, caseSensitive, forceBind);
        if (!showConditionPanel) {
          container.addContent(content);
        } else {
          container.insertContent(content, contentList.length - 1); // insert content before conditions content
        }
      }
      return content;
    },
    _prepareValueHelpTypeAhead: function (valueHelp, container, valueListInfos, payload, caseSensitive, firstTypeAheadContent) {
      const contentList = container.getContent();
      let qualifierForTypeahead = valueHelp.data("valuelistForValidation") || ""; // can also be null
      if (qualifierForTypeahead === " ") {
        qualifierForTypeahead = "";
      }
      const valueListInfo = qualifierForTypeahead // fallback if qualifier for Typeahead not exists
      ? valueListInfos.filter(function (subValueListInfo) {
        return subValueListInfo.valueHelpQualifier === qualifierForTypeahead;
      })[0] || valueListInfos[0] : valueListInfos[0];
      ValueListHelper._addInOutParametersToPayload(payload, valueListInfo);
      const contentId = ValueListHelper._getContentId(valueHelp.getId(), valueListInfo.valueHelpQualifier, true);
      let content = ValueListHelper._getContentById(contentList, contentId);
      if (!content) {
        const useAsValueHelp = firstTypeAheadContent.getUseAsValueHelp();
        content = ValueListHelper._createPopoverContent(contentId, caseSensitive, useAsValueHelp);
        container.insertContent(content, 0); // insert content as first content
      } else if (contentId !== contentList[0].getId()) {
        // content already available but not as first content?
        container.removeContent(content);
        container.insertContent(content, 0); // move content to first position
      }
      return {
        valueListInfo,
        content
      };
    },
    _prepareValueHelpDialog: function (valueHelp, container, valueListInfos, payload, selectedContentId, caseSensitive) {
      const showConditionPanel = valueHelp.data("showConditionPanel") && valueHelp.data("showConditionPanel") !== "false";
      const contentList = container.getContent();

      // set all contents to invisible
      for (const contentListItem of contentList) {
        contentListItem.setVisible(false);
      }
      const conditionContent = showConditionPanel ? this._showConditionsContent(contentList, container) : undefined;
      const field = valueHelp.getControl();

      // For a FilterField we check the operators if they are default (empty list=all) or include EQ
      const hasOperatorEQ = field && field.isA("sap.ui.mdc.FilterField") ? field.getOperators().length === 0 || field.getOperators().includes("EQ") : true;
      let selectedInfo, selectedContent;

      // Create or reuse contents for the current context
      for (const valueListInfo of valueListInfos) {
        const valueHelpQualifier = valueListInfo.valueHelpQualifier;
        ValueListHelper._addInOutParametersToPayload(payload, valueListInfo);
        const contentId = ValueListHelper._getContentId(valueHelp.getId(), valueHelpQualifier, false);
        const content = this._alignOrCreateContent(valueListInfo, contentId, caseSensitive, showConditionPanel, container);
        content.setVisible(hasOperatorEQ); // Do not show a value help table for a filter field without operator 'EQ'

        if (valueListInfo.valueListInfo.Label && field) {
          const title = CommonUtils.getTranslatedTextFromExpBindingString(valueListInfo.valueListInfo.Label, field);
          content.setTitle(title);
        }
        if (!selectedContent || selectedContentId && selectedContentId === contentId) {
          selectedContent = content;
          selectedInfo = valueListInfo;
        }
      }
      if (!selectedInfo || !selectedContent) {
        throw new Error("selectedInfo or selectedContent undefined");
      }
      return {
        selectedInfo,
        selectedContent,
        conditionContent
      };
    },
    _addDescriptionInfosToPayload: function (payload, valueListInfo, metaModel) {
      if (payload.valueHelpDescriptionPath !== valueListInfo.descriptionPath || payload.externalIdPath) {
        const convertedMetadata = convertTypes(metaModel);
        const propertyDescriptionPath = convertedMetadata.resolvePath(payload.propertyPath).target?.annotations?.Common?.Text?.path;

        /* Enrich payload with Text Property Infos */
        payload.valueHelpDescriptionPath = valueListInfo.descriptionPath;
        payload.valueHelpKeyPath = valueListInfo.keyPath;
        if (propertyDescriptionPath) {
          payload.maxLength = payload.valueHelpDescriptionPath ? convertedMetadata.resolvePath(`/${valueListInfo.valueListInfo.CollectionPath}/${payload.valueHelpDescriptionPath}`)?.target?.maxLength : undefined;
          payload.propertyDescriptionPath = propertyDescriptionPath;
        }

        /* EXTERNALID */
        // Add descriptionPath to the payload and valueListInfo
        const externalIdPath = payload.externalIdPath;
        if (externalIdPath && !payload.valueHelpDescriptionPath) {
          const propertyName = metaModel.getObject(`${payload.propertyPath}@sapui.name`);
          const externalIdFullPath = payload.propertyPath.replace(propertyName, externalIdPath);
          const descriptionPath = convertedMetadata.resolvePath(externalIdFullPath).target?.annotations?.Common?.Text?.path;
          valueListInfo.descriptionPath = descriptionPath;
          payload.valueHelpDescriptionPath = descriptionPath;
        }
      }
    },
    showValueList: async function (payload, container, selectedContentId) {
      const valueHelp = container.getParent(),
        isTypeahead = container.isTypeahead(),
        propertyPath = payload.propertyPath,
        /* In case of RAP the valueHelp model is different to the control model */
        control = valueHelp.getControl(),
        metaModel = control ? (valueHelp.getControl()?.getModel()).getMetaModel() : valueHelp.getModel().getMetaModel(),
        vhUIModel = valueHelp.getModel("_VHUI") !== undefined ? valueHelp.getModel("_VHUI") : ValueListHelper.createVHUIModel(valueHelp, propertyPath, metaModel);
      /* EXTERNALID */
      payload.externalIdPath = metaModel?.getObject(`${payload.propertyPath}@com.sap.vocabularies.Common.v1.ExternalID`)?.$Path;
      vhUIModel.setProperty("/isSuggestion", isTypeahead);
      vhUIModel.setProperty("/minScreenWidth", !isTypeahead ? "418px" : undefined);
      try {
        const valueListInfos = await ValueListHelper.getValueListInfo(valueHelp, propertyPath, payload, metaModel);
        const firstTypeAheadContent = valueHelp.getTypeahead().getContent()[0],
          caseSensitive = firstTypeAheadContent.getCaseSensitive(); // take caseSensitive from first Typeahead content

        if (isTypeahead) {
          const {
            valueListInfo,
            content
          } = ValueListHelper._prepareValueHelpTypeAhead(valueHelp, container, valueListInfos, payload, caseSensitive, firstTypeAheadContent);
          payload.valueHelpQualifier = valueListInfo.valueHelpQualifier;
          vhUIModel.setProperty("/selectedProperties", valueListInfo.columnDefs.map(col => col.path));
          ValueListHelper._addDescriptionInfosToPayload(payload, valueListInfo, metaModel);
          if (content.getTable() === undefined || content.getTable() === null) {
            await ValueListHelper._createValueHelpTypeahead(propertyPath, valueHelp, content, valueListInfo, payload, metaModel);
          }
        } else {
          const {
            selectedInfo,
            selectedContent,
            conditionContent
          } = ValueListHelper._prepareValueHelpDialog(valueHelp, container, valueListInfos, payload, selectedContentId, caseSensitive);
          payload.valueHelpQualifier = selectedInfo.valueHelpQualifier;
          ValueListHelper._addDescriptionInfosToPayload(payload, selectedInfo, metaModel);

          /* For context depentent value helps the value list label is used for the dialog title */
          const field = valueHelp.getControl();
          if (field) {
            const title = CommonUtils.getTranslatedTextFromExpBindingString(ValueListHelper._getDialogTitle(valueHelp, selectedInfo.valueListInfo?.Label, payload.isUnitValueHelp), field);
            container.setTitle(title);
          }
          if (selectedContent.getTable() === undefined || selectedContent.getTable() === null) {
            await ValueListHelper._createValueHelpDialog(metaModel, propertyPath, valueHelp, selectedContent, selectedInfo, payload, conditionContent);
          }
        }
      } catch (err) {
        this._logError(propertyPath, err);
        ValueListHelper.destroyVHContent(valueHelp);
      }
    },
    getInAndOutParametersList() {
      return ["com.sap.vocabularies.Common.v1.ValueListParameterOut", "com.sap.vocabularies.Common.v1.ValueListParameterIn", "com.sap.vocabularies.Common.v1.ValueListParameterInOut"];
    },
    /**
     * Checks if a given ValueListProperty corresponds to a multi-value field by analyzing the navigation properties in the OData meta model.
     * @param oValueList The value list information
     * @param oValueList.Parameters
     * @param oVLParameter The value list parameter information
     * @returns A boolean indicating whether the field is a multi-value field
     */
    isMultiValueField: function (oValueList, oVLParameter) {
      const valueListProperty = oVLParameter.ValueListProperty;
      if (!valueListProperty?.includes("/")) {
        return false;
      }
      const collectionPath = oValueList.CollectionPath;
      const metaModel = oValueList.$model?.getMetaModel();
      if (!metaModel) {
        return false;
      }
      const convertedTypes = convertTypes(metaModel);
      const entitySet = convertedTypes.entitySets.find(es => es.name === collectionPath);
      if (!entitySet) {
        return false;
      }
      const pathParts = valueListProperty.split("/");
      let currentEntityType = entitySet.entityType;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const navProperty = currentEntityType.navigationProperties.find(nav => nav.name === pathParts[i]);
        if (isMultipleNavigationProperty(navProperty)) {
          return true;
        }
        if (navProperty) {
          currentEntityType = navProperty.targetType;
        } else {
          break;
        }
      }
      return false;
    }
  };
  return ValueListHelper;
}, false);
//# sourceMappingURL=ValueListHelper-dbg.js.map
