/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/controls/Common/DataVisualization", "sap/fe/core/converters/controls/Common/filter/FilterRestrictions", "sap/fe/core/converters/controls/ListReport/FilterBar", "sap/fe/core/formatters/StandardFormatter", "sap/fe/core/helpers/MetaModelFunction", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/macros/CommonHelper", "sap/fe/macros/field/FieldHelper", "sap/fe/macros/filter/FilterFieldHelper", "sap/fe/macros/filter/FilterUtils", "sap/fe/macros/filterBar/DraftEditState", "sap/fe/macros/filterBar/FilterFieldTemplate", "sap/fe/macros/filterBar/FilterHelper", "sap/fe/macros/fpm/CustomFragment", "sap/m/Select", "sap/ui/core/CustomData", "sap/ui/core/ListItem", "sap/ui/core/fieldhelp/FieldHelpCustomData", "sap/ui/mdc/FilterField", "sap/ui/mdc/p13n/PersistenceProvider", "../ValueHelp", "../controls/CustomFilterFieldContentWrapper", "../controls/FilterBar", "sap/fe/base/jsx-runtime/jsx"], function (BindingToolkit, MetaModelConverter, DataVisualization, FilterRestrictions, FilterBar, standardFormatter, MetaModelFunction, ModelHelper, StableIdHelper, CommonHelper, FieldHelper, FilterFieldHelper, FilterUtils, DraftEditState, FilterFieldCreator, FilterHelper, CustomFragment, Select, CustomData, ListItem, FieldHelpCustomData, MDCFilterField, PersistenceProvider, ValueHelp, CustomFilterFieldContentWrapper, FEFilterBar, _jsx) {
  "use strict";

  var _exports = {};
  var getFilterConditions = FilterHelper.getFilterConditions;
  var maxConditions = FilterFieldHelper.maxConditions;
  var generate = StableIdHelper.generate;
  var getSearchRestrictions = MetaModelFunction.getSearchRestrictions;
  var getSelectionFields = FilterBar.getSelectionFields;
  var getFilterConfigurationPath = FilterBar.getFilterConfigurationPath;
  var getSelectionVariant = DataVisualization.getSelectionVariant;
  var pathInModel = BindingToolkit.pathInModel;
  var formatResult = BindingToolkit.formatResult;
  var compileExpression = BindingToolkit.compileExpression;
  function processPropertyInfos(propertyInfo, metaModel) {
    const parameterFields = [];
    if (propertyInfo) {
      const fetchedPropertiesStr = propertyInfo.replace(/\\{/g, "{").replace(/\\}/g, "}");
      const fetchedProperties = JSON.parse(fetchedPropertiesStr);
      const editStateLabel = this.getTranslatedText("FILTERBAR_EDITING_STATUS");
      fetchedProperties.forEach(function (propInfo) {
        propInfo.key = propInfo.name;
        if (propInfo.isParameter) {
          parameterFields.push(propInfo.name);
        }
        if (propInfo.path === "$editState") {
          propInfo.label = editStateLabel;
        }
        if (propInfo.key?.includes("/")) {
          //TO DO: Need to place this logic in common place when we cover filterRetrictions with this BLI FIORITECHP1-25080
          const annotationPath = propInfo.annotationPath;
          const propertyLocationPath = CommonHelper.getLocationForPropertyPath(metaModel, annotationPath);
          const propertyPath = annotationPath.replace(`${propertyLocationPath}/`, "");
          const dataModel = MetaModelConverter.getInvolvedDataModelObjects(metaModel.getContext(propertyLocationPath));
          propInfo.required = FilterRestrictions.getFilterRestrictionsByDataModel(dataModel)?.RequiredProperties?.includes(propertyPath);
        }
      });
      this.propertyInfo = fetchedProperties;
    }
    this.parameters = JSON.stringify(parameterFields);
  }
  function checkIfEditingFilterIsDisabled(targetEntitySet) {
    if (targetEntitySet.annotations?.Capabilities?.NavigationRestrictions?.RestrictedProperties?.some(r => r.NavigationProperty?.value === "DraftAdministrativeData" && r.FilterRestrictions?.Filterable === false) === true) {
      this.showDraftEditState = false;
    }
  }
  function checkIfCollaborationDraftSupported(oMetaModel) {
    if (ModelHelper.isCollaborationDraftSupported(oMetaModel)) {
      this.isDraftCollaborative = true;
    }
  }
  function getEntityTypePath(metaPathParts) {
    return metaPathParts[0].endsWith("/") ? metaPathParts[0] : metaPathParts[0] + "/";
  }
  function getSearch() {
    if (!this.hideBasicSearch) {
      return _jsx(MDCFilterField, {
        id: generate([this.idPrefix, "BasicSearchField"]),
        label: "",
        placeholder: "{sap.fe.i18n>M_FILTERBAR_SEARCH}",
        propertyKey: "$search",
        conditions: "{$filters>/conditions/$search}",
        dataType: "sap.ui.model.odata.type.String",
        maxConditions: "1",
        dataTypeConstraints: {
          maxLength: 1000
        }
      });
    }
    return "";
  }
  function processSelectionFields() {
    if (this.showDraftEditState) {
      const draftStates = DraftEditState.getEditStates(this.isDraftCollaborative ?? false);
      const label = this.getTranslatedText("FILTERBAR_EDITING_STATUS");
      const draftEditState = _jsx(MDCFilterField, {
        label: label,
        conditions: "{$filters>/conditions/$editState}",
        maxConditions: "1",
        id: generate([this.idPrefix, "FilterField", "DraftEditingStatus"]),
        operators: "EQ",
        dataType: "sap.ui.model.odata.type.String",
        propertyKey: "$editState",
        display: "Description",
        children: {
          contentEdit: _jsx(Select, {
            id: generate([this.idPrefix, "FilterField", "DraftEditingStatusSelect"]),
            width: "100%",
            forceSelection: "true",
            selectedKey: "{path: '$field>/conditions', type: 'sap.ui.mdc.field.ConditionsType'}",
            children: {
              items: draftStates.map(state => _jsx(ListItem, {
                text: state.display
              }, state.id))
            }
          })
        }
      });
      this._filterFieldControls?.push(draftEditState);
    }
    if (this.selectionFields && Array.isArray(this.selectionFields)) {
      this.selectionFields?.forEach(selectionField => {
        if (selectionField.availability === "Default") {
          setFilterFieldsAndValueHelps.call(this, selectionField);
        }
      });
    }
  }
  function getPersistenceProvider() {
    if (this.ignorePersonalizationChanges) {
      return _jsx(PersistenceProvider, {
        id: generate([this._contentId, "PersistenceProvider"]),
        for: this._contentId,
        mode: "Transient"
      });
    }
    return undefined;
  }
  function getSlotFilterField(selectionField) {
    return this.filterFields?.find(ff => ff.key === selectionField.key)?.getAggregation("template");
  }
  function setFilterFieldsAndValueHelps(selectionField) {
    if (selectionField.template === undefined && selectionField.type !== "Slot") {
      pushFilterFieldsAndValueHelps.call(this, selectionField);
    } else if (Array.isArray(this._filterFieldControls)) {
      const customFilterField = getCustomFilterField.call(this, selectionField);
      this._filterFieldControls.push(customFilterField);
    }
  }
  function getCustomFilterField(selectionField) {
    const property = selectionField.annotationPath;
    const propertyContext = this._internalContextPath.getModel().createBindingContext(property);
    const propertyObject = propertyContext?.getObject();
    let filterContent;
    if (selectionField.type === "Slot") {
      filterContent = getSlotFilterField.call(this, selectionField);
    } else if (selectionField.template) {
      filterContent = _jsx(CustomFragment, {
        fragmentName: selectionField.template,
        id: generate([this.idPrefix, "CustomFilterField", selectionField.key]),
        contextPath: this._internalContextPath.getPath(),
        containingView: this.templateComponent?.getRootController()?.getView()
      });
    }
    let maxConditionValue = -1;
    if (propertyContext) {
      maxConditionValue = maxConditions(selectionField.annotationPath, {
        context: propertyContext
      }) ?? -1;
    }
    const formattedResult = compileExpression(formatResult([selectionField.documentRefText ?? undefined], standardFormatter.asArray));
    const propertyInfo = this.propertyInfo?.find(p => p.key === selectionField.key);
    return _jsx(MDCFilterField, {
      id: generate([this.idPrefix, "CustomFilterField", selectionField.key]),
      delegate: {
        name: "sap/fe/macros/field/FieldBaseDelegate"
      },
      propertyKey: selectionField.conditionPath,
      label: selectionField.label,
      dataType: selectionField.dataType ?? propertyInfo?.dataType,
      maxConditions: maxConditionValue,
      conditions: `{$filters>/conditions/${selectionField.conditionPath}}`,
      operators: FieldHelper.operators(propertyContext, propertyObject, this.useSemanticDateRange, selectionField.settings, this.contextPathToUse),
      dataTypeConstraints: selectionField.constraints ?? propertyInfo?.constraints,
      dataTypeFormatOptions: selectionField.formatOptions ?? propertyInfo?.formatOptions,
      valueHelp: "undefined",
      required: selectionField.required,
      children: {
        content: _jsx(CustomFilterFieldContentWrapper, {
          "core:require": "{handler: 'sap/fe/macros/filter/FilterUtils'}",
          id: generate([this.idPrefix, "FilterFieldContentWrapper", selectionField.key]),
          binding: `{filterValues>/${FilterUtils.conditionToModelPath(selectionField.conditionPath)}}`,
          conditions: "{path: '$field>/conditions'}",
          children: {
            content: filterContent
          }
        }),
        customData: [_jsx(CustomData, {
          value: selectionField.type === "Slot"
        }, "isSlot"), _jsx(FieldHelpCustomData, {
          value: formattedResult
        }, "sap-ui-DocumentationRef")]
      }
    });
  }
  _exports.getCustomFilterField = getCustomFilterField;
  function _getContextPathForFilterField(selectionField, filterBarContextPath) {
    let contextPath = filterBarContextPath?.getPath();
    if (selectionField.isParameter) {
      // Example:
      // FilterBarContextPath: /Customer/Set
      // ParameterPropertyPath: /Customer/P_CC
      // ContextPathForFilterField: /Customer
      const annoPath = selectionField.annotationPath;
      contextPath = annoPath.substring(0, annoPath.lastIndexOf("/") + 1);
    }
    return contextPath;
  }
  function pushFilterFieldsAndValueHelps(selectionField) {
    if (Array.isArray(this._filterFieldControls)) {
      const vf = selectionField.visualFilter;
      if (vf) {
        vf.initialChartBindingEnabled = !this.suspendSelection;
      }
      const filterField = new FilterFieldCreator({
        idPrefix: generate([this.idPrefix, "FilterField", CommonHelper.getNavigationPath(selectionField.annotationPath)]),
        vhIdPrefix: generate([this.idPrefix, "FilterFieldValueHelp"]),
        propertyPath: selectionField.annotationPath,
        contextPath: _getContextPathForFilterField(selectionField, this._internalContextPath),
        useSemanticDateRange: this.useSemanticDateRange,
        label: selectionField.label,
        settings: selectionField.settings,
        visualFilter: vf,
        required: selectionField.required,
        editMode: compileExpression(pathInModel(`/${this.idPrefix}/filterFields/${selectionField.conditionPath}/editMode`, "internal")),
        metaModel: this._internalContextPath.getModel()
      });
      const mdcFilterField = filterField.getMDCFilterField();
      if (mdcFilterField) {
        this._filterFieldControls.push(mdcFilterField);
        this._filterFieldDisplayPromises?.push(filterField.displayPromise);
      }
    }
    if (Array.isArray(this._valueHelps)) {
      this._valueHelps?.push(_jsx(ValueHelp, {
        idPrefix: generate([this.idPrefix, "FilterFieldValueHelp"]),
        conditionModel: "$filters",
        metaPath: selectionField.annotationPath,
        contextPath: _getContextPathForFilterField(selectionField, this._internalContextPath),
        filterFieldValueHelp: true,
        useSemanticDateRange: this.useSemanticDateRange
      }));
    }
  }

  /**
   * Determines the design time for the MDC FilterBar.
   * @returns The value to be assigned to dt:designtime
   */
  function getDesignTime() {
    return "sap/fe/macros/filterBar/designtime/FilterBar.designtime";
  }
  function initializeInternalMetaContext(metaPath, metaModel) {
    let entityTypePath = "";
    const metaPathParts = metaPath.split("/@com.sap.vocabularies.UI.v1.SelectionFields") ?? []; // [0]: entityTypePath, [1]: SF Qualifier.
    if (metaPathParts.length > 0) {
      entityTypePath = getEntityTypePath(metaPathParts);
    }
    this._annotationPath = "@com.sap.vocabularies.UI.v1.SelectionFields" + (metaPathParts.length && metaPathParts[1] || "");
    this._internalContextPath = metaModel.createBindingContext(entityTypePath);
  }
  _exports.initializeInternalMetaContext = initializeInternalMetaContext;
  function getExtraParams() {
    if (!this._annotationPath) {
      return {};
    }
    return FilterUtils.getExtraParams(this, this._annotationPath, this._internalContextPath.getPath(), this.contextPathToUse);
  }
  _exports.getExtraParams = getExtraParams;
  function setupFilterBarSettings(metaModel, converterContext, viewData) {
    this.rendererWrapper = this.rendererWrapper?.bind(this) ?? (renderMethod => renderMethod());
    const targetEntitySet = converterContext.getEntitySet();
    if (targetEntitySet?.annotations?.Common?.DraftRoot && !this.disableDraftEditStateFilter) {
      this.showDraftEditState = true;
      checkIfEditingFilterIsDisabled.call(this, targetEntitySet);
      checkIfCollaborationDraftSupported.call(this, metaModel);
    }
    const hasOverride = this.checkIfResourceKeyExists("M_FILTERBAR_ADAPT_FILTERS_NON_ZERO");
    if (hasOverride) {
      this.adaptFiltersNonZeroText = this.getTranslatedText("M_FILTERBAR_ADAPT_FILTERS_NON_ZERO").replaceAll("{", "\\{");
      this.adaptFiltersText = this.getTranslatedText("M_FILTERBAR_ADAPT_FILTERS");
    }
    const selectionFieldsObj = getSelectionFields(converterContext, [], this._annotationPath);
    const propertyInfoString = selectionFieldsObj.sPropertyInfo;
    const filterConfigPath = getFilterConfigurationPath(this._annotationPath, this._internalContextPath.getPath(), this.contextPathToUse);
    const filterBarConfigs = converterContext.getManifestControlConfiguration(filterConfigPath) ?? {};
    this.showMessages = filterBarConfigs.showMessages ?? this.showMessages;

    //Filter Fields and values to the field are filled based on the selectionFields and this would be empty in case of macro outside the FE template
    if (!this.selectionFields) {
      this.selectionFields = selectionFieldsObj.selectionFields;
      const entityType = converterContext.getEntityType(),
        selectionVariant = getSelectionVariant(entityType, converterContext),
        defaultSemanticDates = {},
        ffConfigs = filterBarConfigs.filterFields ?? {};

      // Extract defaultValues from controlConfiguration for semantic date operators
      for (const propertyName in ffConfigs) {
        const fieldConfig = ffConfigs[propertyName];
        if (fieldConfig?.settings?.defaultValues && Array.isArray(fieldConfig.settings.defaultValues)) {
          defaultSemanticDates[propertyName] = fieldConfig.settings.defaultValues;
        }
      }
      const filterConditions = getFilterConditions(this._internalContextPath, {
        selectionVariant: selectionVariant,
        defaultSemanticDates: Object.keys(defaultSemanticDates).length > 0 ? defaultSemanticDates : undefined
      }, this._internalContextPath.getObject(), viewData, this.showDraftEditState, true);
      this.filterConditions = filterConditions;
    }
    processPropertyInfos.call(this, propertyInfoString, metaModel);
    if (this.hideBasicSearch !== true) {
      const searchRestrictionAnnotation = getSearchRestrictions(this._internalContextPath.getPath(), metaModel);
      this.hideBasicSearch = Boolean(searchRestrictionAnnotation && !searchRestrictionAnnotation.Searchable);
    }
    processSelectionFields.call(this);
    this.designtime = getDesignTime();
  }
  _exports.setupFilterBarSettings = setupFilterBarSettings;
  function getFEFilterBarTemplate() {
    const _internalContextPath = this._internalContextPath?.getPath();
    const filterDelegate = this.filterBarDelegate ? JSON.parse(this.filterBarDelegate) : {
      name: "sap/fe/macros/filterBar/FilterBarDelegate",
      payload: {
        entityTypePath: _internalContextPath
      }
    };
    const dependents = Array.isArray(this._valueHelps) ? [...this._valueHelps] : [];
    const persistenceProvider = getPersistenceProvider.call(this);
    if (persistenceProvider) {
      dependents.push(persistenceProvider);
    }
    const runAsOwner = this.templateComponent?.runAsOwner?.bind(this.templateComponent) ?? (r => r());
    return runAsOwner(() => {
      return _jsx(FEFilterBar, {
        "core:require": "{API: 'sap/fe/macros/FilterBar'}",
        adaptFiltersText: this.adaptFiltersText,
        adaptFiltersTextNonZero: this.adaptFiltersNonZeroText,
        id: this._contentId,
        liveMode: this.liveMode,
        delegate: filterDelegate,
        variantBackreference: this.liveMode ? undefined : this.variantBackreference ?? undefined,
        showAdaptFiltersButton: this.showAdaptFiltersButton,
        showClearButton: this.showClearButton,
        p13nMode: this.p13nMode,
        search: this.handlerProvider.getSearchHandler(),
        filtersChanged: this.handlerProvider.getFiltersChangedHandler(),
        filterConditions: this.filterConditions,
        suspendSelection: this.suspendSelection,
        showMessages: this.showMessages,
        toggleControl: this.toggleControlId,
        initialLayout: this.initialLayout,
        disableDraftEditStateFilter: this.disableDraftEditStateFilter,
        "dt:designtime": this.designtime,
        children: {
          customData: [_jsx(CustomData, {
            value: this.idPrefix
          }, "localId"), _jsx(CustomData, {
            value: this.hideBasicSearch
          }, "hideBasicSearch"), _jsx(CustomData, {
            value: this.showDraftEditState
          }, "showDraftEditState"), _jsx(CustomData, {
            value: this.useSemanticDateRange
          }, "useSemanticDateRange"), _jsx(CustomData, {
            value: this.parameters
          }, "parameters"), _jsx(CustomData, {
            value: JSON.stringify(this.propertyInfo).replace(/\{/g, "\\{").replace(/\}/g, "\\}")
          }, "feFilterInfo"), _jsx(CustomData, {
            value: this._annotationPath
          }, "annotationPath"), _jsx(CustomData, {
            value: _internalContextPath
          }, "entityType")],
          dependents: dependents,
          basicSearchField: getSearch.call(this),
          filterItems: this._filterFieldControls
        }
      });
    });
  }
  _exports.getFEFilterBarTemplate = getFEFilterBarTemplate;
  return _exports;
}, false);
//# sourceMappingURL=FilterBarTemplate-dbg.js.map
