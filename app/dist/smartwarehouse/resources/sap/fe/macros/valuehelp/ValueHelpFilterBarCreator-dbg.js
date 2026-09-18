/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/merge", "sap/fe/core/CommonUtils", "sap/fe/core/converters/ConverterContext", "sap/fe/core/converters/ManifestWrapper", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/controls/ListReport/FilterBar", "sap/fe/core/helpers/StableIdHelper", "sap/fe/macros/CommonHelper", "sap/fe/macros/ValueHelp", "sap/fe/macros/filterBar/FilterFieldTemplate", "sap/ui/core/CustomData", "sap/ui/mdc/FilterField", "sap/ui/mdc/valuehelp/FilterBar", "../internal/valuehelp/ValueHelpUtils", "sap/fe/base/jsx-runtime/jsx"], function (Log, merge, CommonUtils, ConverterContext, ManifestWrapper, MetaModelConverter, FilterBar, StableIdHelper, CommonHelper, ValueHelp, FilterFieldCreator, CustomData, MDCFilterField, MDCValueHelpFilterBar, ValueHelpUtils, _jsx) {
  "use strict";

  var _exports = {};
  var getViewDataForTemplate = ValueHelpUtils.getViewDataForTemplate;
  var generate = StableIdHelper.generate;
  var getSelectionFields = FilterBar.getSelectionFields;
  var getExpandFilterFields = FilterBar.getExpandFilterFields;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  let ValueHelpFilterBarCreator = /*#__PURE__*/function () {
    /**
     * Internal property to store data model object path
     */

    /*
     * Context path
     */

    /**
     * Meta model
     */

    /**
     * Converter context
     */

    /**
     * For caching Value help filter bar
     */

    function ValueHelpFilterBarCreator(props) {
      /*********** PUBLIC PROPERTIES ***********/
      /**
       * Source Id to be used as prefix for the filter bar id
       */
      /**
       * Meta path for the filter bar
       */
      /**
       * 'valuelist' object containing all relevant information
       */
      /**
       * Parent Value Help control
       */
      /**
       * Don't show the basic search field
       */
      this.hideBasicSearch = false;
      /**
       * Enables the fallback to show all fields of the EntityType as filter fields if com.sap.vocabularies.UI.v1.SelectionFields are not present
       */
      this.enableFallback = false;
      /**
       * Specifies the personalization options for the filter bar.
       */
      this.p13nMode = [];
      /**
       * Specifies the Sematic Date Range option for the filter bar.
       */
      this.useSemanticDateRange = true;
      /**
       * If set the search will be automatically triggered, when a filter value was changed.
       */
      this.liveMode = false;
      /**
       * Filter conditions to be applied to the filter bar
       */
      this.filterConditions = undefined;
      /**
       * If set to <code>true</code>, all search requests are ignored. Once it has been set to <code>false</code>,
       * a search is triggered immediately if one or more search requests have been triggered in the meantime
       * but were ignored based on the setting.
       */
      this.suspendSelection = false;
      /**
       * Determines whether the Show/Hide Filters button is in the state show or hide.
       */
      this.expandFilterFields = true;
      /**
       * Array to store value helps
       */
      this.valueHelps = [];
      /**
       * Array to store filter fields
       */
      this.filterFields = [];
      this.getSearch = () => {
        if (!this.hideBasicSearch) {
          return _jsx(MDCFilterField, {
            placeholder: "{sap.fe.i18n>M_FILTERBAR_SEARCH}",
            propertyKey: "$search",
            conditions: "{$filters>/conditions/$search}",
            dataType: "sap.ui.model.type.String",
            maxConditions: "1"
          });
        }
        return "";
      };
      if (!props.metaPath) {
        Log.error("ValueHelpFilterBar requires a metaPath property to be set.");
        return;
      }
      this.valueHelps = [];
      this.filterFields = [];
      this.id = generate([props.sourceId, "FilterBar"]);
      this.metaPath = props.metaPath;
      this.hideBasicSearch = props.hideBasicSearch ?? false;
      this.enableFallback = props.enableFallback ?? false;
      this.p13nMode = props.p13nMode ?? [];
      this.useSemanticDateRange = props.useSemanticDateRange ?? true;
      this.liveMode = props.liveMode ?? false;
      this.filterConditions = props.filterConditions;
      this.parentVHControl = props.parentVHControl;
      this.valueListInfo = props.valueListInfo;
      this.metaModel = this.metaPath.getModel();
      this.contextPath = this.metaModel.getMetaPath(this.metaPath.getPath());
      this.dataModelObjectPath = getInvolvedDataModelObjects(this.metaPath);
      const containingView = CommonUtils.getTargetView(this.parentVHControl);
      const appComponent = CommonUtils.getAppComponent(containingView);
      const valueListAnnoInfo = this.valueListInfo?.valueListInfo;
      this.converterContext = ConverterContext.createConverterContextForMacro(this.dataModelObjectPath.startingEntitySet.name, this.metaModel, appComponent?.getDiagnostics(), merge, this.dataModelObjectPath.contextLocation, new ManifestWrapper(getViewDataForTemplate(this.valueListInfo?.columnDefs), appComponent));
      this.selectionFields = getSelectionFields(this.converterContext, []).selectionFields;
      const targetEntitySet = this.dataModelObjectPath.targetEntitySet; // It could be a singleton but the annotaiton are not defined there (yet?)
      this.expandFilterFields = getExpandFilterFields(this.converterContext, targetEntitySet.annotations.Capabilities?.FilterRestrictions, valueListAnnoInfo);

      // Process selection fields and create value helps
      this.processSelectionFields();
    }

    /**
     * Processes selection fields and creates value helps and filter fields for them.
     */
    _exports = ValueHelpFilterBarCreator;
    var _proto = ValueHelpFilterBarCreator.prototype;
    _proto.processSelectionFields = function processSelectionFields() {
      // Create value helps and filter fields for selection fields
      if (Array.isArray(this.selectionFields)) {
        for (const selectionField of this.selectionFields) {
          if (selectionField.availability === "Default") {
            const annotationPath = selectionField.annotationPath;
            const navigationPath = CommonHelper.getNavigationPath(annotationPath);
            if (selectionField.template === undefined) {
              // Create filter field using FilterFieldCreator
              if (Array.isArray(this.filterFields)) {
                const filterField = new FilterFieldCreator({
                  idPrefix: generate([this.id, "FilterField", navigationPath]),
                  vhIdPrefix: generate([this.id, "FilterFieldValueHelp", navigationPath]),
                  propertyPath: annotationPath,
                  contextPath: this.contextPath,
                  useSemanticDateRange: this.useSemanticDateRange,
                  settings: selectionField.settings,
                  metaModel: this.metaModel
                });
                const ff = filterField.getMDCFilterField();
                if (ff) {
                  this.filterFields.push(ff);
                }
              }

              // Create value help
              if (Array.isArray(this.valueHelps)) {
                this.valueHelps.push(_jsx(ValueHelp, {
                  idPrefix: generate([this.id, "FilterFieldValueHelp", navigationPath]),
                  contextPath: this.contextPath,
                  conditionModel: "$filters",
                  metaPath: annotationPath,
                  metaModel: this.metaModel.getId(),
                  filterFieldValueHelp: true,
                  useSemanticDateRange: this.useSemanticDateRange
                }));
              }
            }
          }
        }
      }

      // Handle fallback case when no selection fields exist
      if (!this.dataModelObjectPath?.targetEntityType.annotations.UI?.SelectionFields && this.enableFallback) {
        const entityProperties = this.dataModelObjectPath?.targetEntityType.entityProperties;
        if (entityProperties) {
          for (const property of entityProperties) {
            const propertyName = property.name || "";
            const propPathDelimiter = this.contextPath.endsWith("/") ? "" : "/";
            const propertyPath = this.contextPath + propPathDelimiter + propertyName;

            // Create filter field for fallback properties
            if (Array.isArray(this.filterFields)) {
              const filterField = new FilterFieldCreator({
                idPrefix: generate([this.id, "FilterField"]),
                vhIdPrefix: generate([this.id, "FilterFieldValueHelp"]),
                propertyPath: propertyPath,
                contextPath: this.contextPath,
                useSemanticDateRange: this.useSemanticDateRange,
                metaModel: this.metaModel
              });
              const ff = filterField.getMDCFilterField();
              if (ff) {
                this.filterFields.push(ff);
              }
            }

            // Create value help for fallback properties
            if (Array.isArray(this.valueHelps)) {
              this.valueHelps.push(_jsx(ValueHelp, {
                idPrefix: generate([this.id, "FilterFieldValueHelp"]),
                contextPath: this.contextPath,
                conditionModel: "$filters",
                metaPath: propertyPath,
                metaModel: this.metaModel.getId(),
                filterFieldValueHelp: true,
                useSemanticDateRange: this.useSemanticDateRange
              }));
            }
          }
        }
      }
    };
    _proto.getValueHelpFilterBar = function getValueHelpFilterBar() {
      if (this.valueHelpFilterBar) {
        return this.valueHelpFilterBar;
      }
      this.valueHelpFilterBar = _jsx(MDCValueHelpFilterBar, {
        id: this.id,
        liveMode: this.liveMode,
        delegate: {
          name: "sap/fe/macros/filterBar/FilterBarDelegate",
          payload: {
            entityTypePath: this.contextPath
          }
        },
        filterConditions: this.filterConditions,
        suspendSelection: this.suspendSelection,
        expandFilterFields: this.expandFilterFields,
        showMessages: false,
        children: {
          customData: [_jsx(CustomData, {
            value: this.hideBasicSearch
          }, "hideBasicSearch"), _jsx(CustomData, {
            value: this.useSemanticDateRange
          }, "useSemanticDateRange"), _jsx(CustomData, {
            value: this.selectionFields
          }, "selectionFields"), _jsx(CustomData, {
            value: this.contextPath
          }, "entityType")],
          dependents: [this.valueHelps],
          basicSearchField: this.getSearch(),
          filterItems: this.filterFields
        }
      });
      return this.valueHelpFilterBar;
    };
    return ValueHelpFilterBarCreator;
  }();
  _exports = ValueHelpFilterBarCreator;
  return _exports;
}, false);
//# sourceMappingURL=ValueHelpFilterBarCreator-dbg.js.map
