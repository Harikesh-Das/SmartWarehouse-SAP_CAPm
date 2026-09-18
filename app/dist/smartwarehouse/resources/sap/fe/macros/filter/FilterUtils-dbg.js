/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/merge", "sap/fe/core/CommonUtils", "sap/fe/core/converters/ConverterContext", "sap/fe/core/converters/ManifestWrapper", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/controls/ListReport/FilterBar", "sap/fe/core/helpers/MetaModelFunction", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/DisplayModeFormatter", "sap/fe/macros/CommonHelper", "sap/fe/macros/DelegateUtil", "sap/fe/macros/filterBar/SemanticDateOperators", "sap/ui/core/Element", "sap/ui/mdc/condition/Condition", "sap/ui/mdc/condition/ConditionConverter", "sap/ui/mdc/enums/ConditionValidated", "sap/ui/mdc/enums/OperatorName", "sap/ui/mdc/odata/v4/TypeMap", "sap/ui/mdc/p13n/StateUtil", "sap/ui/mdc/util/FilterUtil", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/ui/model/odata/v4/ODataUtils", "../filterBar/DraftEditState"], function (Log, merge, CommonUtils, ConverterContext, ManifestWrapper, MetaModelConverter, FilterBarConverter, MetaModelFunction, ModelHelper, DataModelPathHelper, DisplayModeFormatter, CommonHelper, DelegateUtil, SemanticDateOperators, Element, Condition, ConditionConverter, ConditionValidated, OperatorName, TypeMap, StateUtil, FilterUtil, Filter, FilterOperator, ODataUtils, EDITSTATE) {
  "use strict";

  var ODATA_TYPE_MAPPING = DisplayModeFormatter.ODATA_TYPE_MAPPING;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var getAllCustomAggregates = MetaModelFunction.getAllCustomAggregates;
  var PropertyInfoKeys = /*#__PURE__*/function (PropertyInfoKeys) {
    PropertyInfoKeys["hiddenFilter"] = "hiddenFilter";
    PropertyInfoKeys["required"] = "required";
    PropertyInfoKeys["path"] = "path";
    PropertyInfoKeys["tooltip"] = "tooltip";
    PropertyInfoKeys["visible"] = "visible";
    PropertyInfoKeys["maxConditions"] = "maxConditions";
    PropertyInfoKeys["formatOptions"] = "formatOptions";
    PropertyInfoKeys["constraints"] = "constraints";
    PropertyInfoKeys["group"] = "group";
    PropertyInfoKeys["groupLabel"] = "groupLabel";
    PropertyInfoKeys["caseSensitive"] = "caseSensitive";
    return PropertyInfoKeys;
  }(PropertyInfoKeys || {});
  const CONDITION_PATH_TO_PROPERTY_PATH_REGEX = /[+*]/g;
  const oFilterUtils = {
    /**
     * Gets the extra parameters for the converter context based on filter field configurations.
     * @param filterBar The filter bar context (FilterBarAPI or FilterBar.block)
     * @param relAnnoPath FilterBar annotation path relative to fitler context path, like. "@com.sap.vocabularies.UI.v1.SelectionFields" or "@com.sap.vocabularies.UI.v1.SelectionFields#SF2"
     * @param filterBarContextPath FilterBar context path, like "/SO" or "/SO/_Item"
     * @param pageContextPath Present page or view context path of manifest entry, like "/SO"
     * @returns Extra parameters object with filter field configurations
     */
    getExtraParams: function (filterBar, relAnnoPath, filterBarContextPath, pageContextPath) {
      const filterConfigPath = FilterBarConverter.getFilterConfigurationPath(relAnnoPath, filterBarContextPath, pageContextPath);
      const extraParams = {};
      extraParams[filterConfigPath] = {
        filterFields: filterBar.filterFieldConfigs ?? {},
        navigationPropertiesForPersonalization: Array.isArray(filterBar.navigationPropertiesForPersonalization) ? filterBar.navigationPropertiesForPersonalization : filterBar.navigationPropertiesForPersonalization?.split(",").map(s => s.trim())
      };
      return extraParams;
    },
    getFilter: function (vIFilter) {
      const aFilters = oFilterUtils.getFilterInfo(vIFilter).filters;
      return aFilters?.length ? new Filter(aFilters, false) : undefined;
    },
    getFilterField: function (propertyPath, converterContext, entityType) {
      return FilterBarConverter.getFilterField(propertyPath, converterContext, entityType);
    },
    buildProperyInfo: function (propertyInfoField, converterContext) {
      let oPropertyInfo;
      const aTypeConfig = {};
      const propertyConvertyContext = converterContext.getConverterContextFor(propertyInfoField.annotationPath);
      const propertyTargetObject = propertyConvertyContext.getDataModelObjectPath().targetObject;
      const oTypeConfig = FilterBarConverter.fetchTypeConfig(propertyTargetObject);
      oPropertyInfo = FilterBarConverter.fetchPropertyInfo(converterContext, propertyInfoField, oTypeConfig);
      aTypeConfig[propertyInfoField.key] = oTypeConfig;
      oPropertyInfo = FilterBarConverter.assignDataTypeToPropertyInfo(oPropertyInfo, converterContext, [], aTypeConfig);
      return oPropertyInfo;
    },
    createConverterContext: function (oFilterControl, sEntityTypePath, metaModel, appComponent) {
      const sFilterEntityTypePath = DelegateUtil.getCustomData(oFilterControl, "entityType"),
        contextPath = sEntityTypePath || sFilterEntityTypePath;
      const oView = oFilterControl.isA ? CommonUtils.getTargetView(oFilterControl.getParent()) : null;
      const oMetaModel = metaModel || oFilterControl.getModel().getMetaModel();
      const oAppComponent = appComponent || oView && CommonUtils.getAppComponent(oView);
      const oVisualizationObjectPath = MetaModelConverter.getInvolvedDataModelObjects(oMetaModel.createBindingContext(contextPath));
      let manifestSettings;
      if (oFilterControl.isA && !oFilterControl.isA("sap.ui.mdc.valuehelp.FilterBar")) {
        manifestSettings = oView && oView.getViewData() || {};
        if (oFilterControl.isA("sap.fe.macros.controls.FilterBar") && oFilterControl.getParent()?.isA("sap.fe.macros.FilterBar")) {
          const relAnnoPath = oFilterControl.data("annotationPath");
          const filterBarContextPath = oFilterControl.data("entityType");
          if (relAnnoPath && filterBarContextPath) {
            const pageContextPath = manifestSettings?.contextPath ?? (manifestSettings?.entitySet ? `/${manifestSettings.entitySet}` : undefined);
            const extraParams = oFilterUtils.getExtraParams(oFilterControl.getParent(), relAnnoPath, filterBarContextPath, pageContextPath);
            manifestSettings.controlConfiguration = merge(extraParams ?? {}, manifestSettings.controlConfiguration ?? {});
          }
        }
      }
      return ConverterContext.createConverterContextForMacro(oVisualizationObjectPath.startingEntitySet.name, oMetaModel, oAppComponent?.getDiagnostics(), merge, oVisualizationObjectPath.contextLocation, new ManifestWrapper(manifestSettings ?? {}));
    },
    getConvertedFilterFields: function (oFilterControl, sEntityTypePath, includeHidden, metaModel, appComponent, oModifier, lineItemTerm, propertyInfosFromFilterBar) {
      const oMetaModel = this._getFilterMetaModel(oFilterControl, metaModel);
      const sFilterEntityTypePath = DelegateUtil.getCustomData(oFilterControl, "entityType");
      const annotationPath = DelegateUtil.getCustomData(oFilterControl, "annotationPath"),
        contextPath = sEntityTypePath || sFilterEntityTypePath;
      const lrTables = this._getFieldsForTable(oFilterControl, sEntityTypePath);
      const oConverterContext = this.createConverterContext(oFilterControl, sEntityTypePath, metaModel ?? oMetaModel, appComponent);

      //aSelectionFields = FilterBarConverter.getSelectionFields(oConverterContext);
      return this._getSelectionFields(oFilterControl, sEntityTypePath, sFilterEntityTypePath, contextPath, lrTables, oMetaModel, oConverterContext, includeHidden, oModifier, lineItemTerm, annotationPath, propertyInfosFromFilterBar);
    },
    getBindingPathForParameters: function (oIFilter, mConditions, aFilterPropertiesMetadata, aParameters) {
      const aParams = [];
      aFilterPropertiesMetadata = oFilterUtils.setTypeConfigToProperties(aFilterPropertiesMetadata);
      // Collecting all parameter values from conditions
      for (const sFieldPath of aParameters) {
        if (mConditions[sFieldPath] && mConditions[sFieldPath].length > 0) {
          // We would be using only the first condition for parameter value.
          const oConditionInternal = merge({}, mConditions[sFieldPath][0]);
          const oProperty = FilterUtil.getPropertyByKey(aFilterPropertiesMetadata, sFieldPath);
          const oTypeConfig = oProperty.typeConfig || TypeMap.getTypeConfig(oProperty.dataType, oProperty.formatOptions, oProperty.constraints);
          const mInternalParameterCondition = ConditionConverter.toType(oConditionInternal, oTypeConfig, oIFilter.getTypeMap());
          const sEdmType = ODATA_TYPE_MAPPING[oTypeConfig.className];
          aParams.push(`${sFieldPath}=${encodeURIComponent(ODataUtils.formatLiteral(mInternalParameterCondition.values[0], sEdmType))}`);
        }
      }

      // Binding path from EntityType
      const sEntityTypePath = oIFilter.data("entityType");
      const sEntitySetPath = sEntityTypePath.substring(0, sEntityTypePath.length - 1);
      const sParameterEntitySet = sEntitySetPath.slice(0, sEntitySetPath.lastIndexOf("/"));
      const sTargetNavigation = sEntitySetPath.substring(sEntitySetPath.lastIndexOf("/") + 1);
      // create parameter context
      return `${sParameterEntitySet}(${aParams.toString()})/${sTargetNavigation}`;
    },
    getEditStateIsHideDraft: function (mConditions) {
      let bIsHideDraft = false;
      if (mConditions && mConditions.$editState) {
        if (mConditions.$editState?.[0]?.values.includes("ALL_HIDING_DRAFTS") || mConditions.$editState?.[0]?.values.includes("SAVED_ONLY")) {
          bIsHideDraft = true;
        }
      }
      return bIsHideDraft;
    },
    /**
     * Gets all filters that originate from the MDC FilterBar.
     * @param vIFilter String or object instance related to MDC_FilterBar/Table/Chart
     * @param mProperties Properties on filters that are to be retrieved. Available parameters:
     * @param mProperties.ignoredProperties Array of property names which should be not considered for filtering
     * @param mProperties.propertiesMetadata Array with all the property metadata. If not provided, properties will be retrieved from vIFilter.
     * @param mProperties.targetControl MDC_table or chart. If provided, property names which are not relevant for the target control entitySet are not considered.
     * @param mFilterConditions Map with externalized filter conditions.
     * @returns FilterBar filters and basic search
     * @private
     */
    getFilterInfo: function (vIFilter, mProperties, mFilterConditions) {
      let aIgnoreProperties = mProperties && mProperties.ignoredProperties || [];
      const oTargetControl = mProperties && mProperties.targetControl,
        sTargetEntityPath = oTargetControl ? oTargetControl.data("entityType") : undefined;
      const mParameters = {};
      let oIFilter = vIFilter,
        sSearch = null,
        aFilters = [],
        sBindingPath,
        aPropertiesMetadata = mProperties && mProperties.propertiesMetadata;
      if (typeof vIFilter === "string") {
        oIFilter = Element.getElementById(vIFilter);
      }
      if (oIFilter) {
        sSearch = this._getSearchField(oIFilter, aIgnoreProperties);
        const mConditions = this._getFilterConditions(mProperties, mFilterConditions, oIFilter);
        let aFilterPropertiesMetadata;
        if (oIFilter.isA("sap.ui.mdc.FilterBar")) {
          aFilterPropertiesMetadata = this.getFilterPropertyInfo(oIFilter);
        } else {
          aFilterPropertiesMetadata = oIFilter.getPropertyInfoSet ? oIFilter.getPropertyInfoSet() : null;
        }
        aFilterPropertiesMetadata = this._getFilterPropertiesMetadata(aFilterPropertiesMetadata, oIFilter);
        if (mProperties && mProperties.targetControl && mProperties.targetControl.isA("sap.ui.mdc.Chart")) {
          Object.keys(mConditions).forEach(function (sKey) {
            if (sKey === "$editState") {
              delete mConditions["$editState"];
            }
          });
        }
        let aParameters = oIFilter.data("parameters") || [];
        aParameters = typeof aParameters === "string" ? JSON.parse(aParameters) : aParameters;
        if (aParameters && aParameters.length > 0) {
          // Binding path changes in case of parameters.
          sBindingPath = oFilterUtils.getBindingPathForParameters(oIFilter, mConditions, aFilterPropertiesMetadata, aParameters);
          if (Object.keys(mConditions).length) {
            Object.keys(mConditions).forEach(param => {
              aParameters.forEach(requiredParam => {
                if (param === requiredParam) {
                  const mParametersValue = mConditions[param][0].values;
                  mParameters[requiredParam] = mParametersValue[0];
                }
              });
            });
          }
        }
        if (mConditions) {
          //Exclude Interface Filter properties that are not relevant for the Target control entitySet
          if (sTargetEntityPath && oIFilter.data("entityType") && oIFilter.data("entityType") !== sTargetEntityPath) {
            const oMetaModel = oIFilter.getModel().getMetaModel();
            const aTargetPropertiesMetadata = oIFilter.getControlDelegate?.().fetchPropertiesForEntity(sTargetEntityPath, oMetaModel, oIFilter);
            aPropertiesMetadata = aTargetPropertiesMetadata;
            const _aIgnoreProperties = this._getIgnoredProperties(aFilterPropertiesMetadata, aTargetPropertiesMetadata);
            if (_aIgnoreProperties.length > 0) {
              aIgnoreProperties = aIgnoreProperties.concat(_aIgnoreProperties);
            }
          } else if (!aPropertiesMetadata && aFilterPropertiesMetadata) {
            aPropertiesMetadata = aFilterPropertiesMetadata;
          }
          // var aParamKeys = [];
          // aParameters.forEach(function (oParam) {
          // 	aParamKeys.push(oParam.key);
          // });
          aFilters = this.getEditStateAndFilter({
            oIFilter,
            mConditions,
            aPropertiesMetadata,
            aIgnoreProperties,
            aParameters
          });
        }
      }
      return {
        parameters: mParameters,
        filters: aFilters,
        search: sSearch || undefined,
        bindingPath: sBindingPath
      };
    },
    /**
     * Gets the Filter params taking in consideration the Editing Status field,
     * merges/overrides the data that's coming from FilterUtil.getFilterInfo, and,
     * returns a mapped data to be sent to the backend.
     * @param param Object
     * @param param.oIFilter Object FilterBar instance
     * @param param.mConditions Object Conditions that comes from the Filter Fields
     * @param param.aPropertiesMetadata Array Filter metadata
     * @param param.aIgnoreProperties Array of strings with the field keys which need to be ignored
     * @param param.aParameters Array URL params that also need to be ignore and are merged into the aIgnoreProperties
     * @returns FilterBar filters array
     */
    getEditStateAndFilter: function (_ref) {
      let {
        oIFilter,
        mConditions,
        aPropertiesMetadata,
        aIgnoreProperties,
        aParameters
      } = _ref;
      const oFilter = FilterUtil.getFilterInfo(oIFilter, mConditions, oFilterUtils.setTypeConfigToProperties(aPropertiesMetadata), aIgnoreProperties.concat(aParameters)).filters;
      const hasEditStateMetadata = aPropertiesMetadata?.filter(property => property.name === "$editState");
      let editStateFilter;

      // Only process edit state if it's not in the ignore list and has metadata
      if (!aIgnoreProperties.includes("$editState") && hasEditStateMetadata && hasEditStateMetadata.length > 0) {
        const view = CommonUtils.getTargetView(oIFilter);
        const appComponent = CommonUtils.getAppComponent(view);
        const isHiddenDraftEnabled = appComponent?.getEnvironmentCapabilities()?.getCapabilities()?.HiddenDraft?.enabled;
        if (isHiddenDraftEnabled) {
          // Hidden draft: only filter when disableDraftEditStateFilter is true
          if (oIFilter.hasOwnProperty("disableDraftEditStateFilter") && oIFilter.getProperty("disableDraftEditStateFilter")) {
            editStateFilter = EDITSTATE.getFilterForEditState("ALL");
          }
        } else if (mConditions.hasOwnProperty("$editState")) {
          // Normal draft: use condition value
          const editStateValue = mConditions["$editState"];
          editStateFilter = EDITSTATE.getFilterForEditState(editStateValue?.[0]?.values?.[0]);
        } else {
          // Normal draft: use default
          editStateFilter = EDITSTATE.getFilterForEditState("");
        }
      }
      let aFilters = oFilter ? [oFilter] : [];

      //( Transform DateTimeOffset precision 7 filters
      if (oIFilter.isA("sap.ui.mdc.FilterBar")) {
        this._transformDateTimeOffsetFilters(aFilters, mConditions, oIFilter);
      } else if (oIFilter.isA("sap.ui.mdc.Table")) {
        this._transformDateTimeOffsetFiltersForTable(aFilters, oIFilter);
      }
      if (editStateFilter) {
        const hasEditStateFilter = this.hasEditStateFilterRecursively(aFilters);
        if (hasEditStateFilter) {
          aFilters = this.exchangeEditStateFilterRecursively(editStateFilter, aFilters);
        } else {
          aFilters = [new Filter({
            filters: [...aFilters, editStateFilter],
            and: true
          })];
        }
      }
      return aFilters;
    },
    /**
     * Transforms DateTimeOffset filter conditions for table columns.
     * Table columns have a different property info structure than FilterBar properties.
     * @param filters Array of filter objects to transform
     * @param tableControl IFilterControl Table control instance
     */
    _transformDateTimeOffsetFiltersForTable: function (filters, tableControl) {
      // Transform filters using table column information
      const tableColumns = [];
      try {
        // Get table column definitions directly from the passed table
        const tableAPI = tableControl.getParent();
        const tableDefinition = tableAPI.getTableDefinition();
        if (tableDefinition && tableDefinition.columns) {
          tableColumns.push(...tableDefinition.columns);
        }
        if (!filters || !Array.isArray(filters) || tableColumns.length === 0) {
          return;
        }
        // Handle nested filter structure - when multiple filters are defined,
        // they may be contained within aFilters[0].aFilters (same as FilterBar logic)
        let actualFilters = filters;
        const firstFilter = filters[0];
        if (firstFilter?.aFilters && firstFilter.aFilters.length > 0) {
          actualFilters = firstFilter.aFilters;
        }
        // Create a map of field paths to their precision info from table columns
        const fieldPrecisionMap = new Map();
        tableColumns.forEach(column => {
          if (column.dataType === "Edm.DateTimeOffset" && column.typeConfig && column.typeConfig.constraints && column.typeConfig.constraints.precision) {
            const precision = column.typeConfig.constraints.precision;
            const fieldPath = column.relativePath;
            fieldPrecisionMap.set(fieldPath, precision);
          }
        });
        // Process each filter using the actual filters (handles both single and multiple filter cases)
        this._transformDateTimeOffSetFilterValueRecursively(actualFilters, fieldPrecisionMap);
      } catch (error) {
        Log.error("Error While transforming the table filter for milliseconds range before request :", error);
      }
    },
    /**
     * Transforms DateTimeOffset filters by converting EQ operators to BT operators
     * with precision-based range from .000... to .999... based on property precision.
     * @param aFilters Array of filter objects to transform
     * @param mConditions Filter conditions from the filter bar
     * @param oFilterBar The filter bar instance to access property information
     */
    _transformDateTimeOffsetFilters: function (aFilters, mConditions, oFilterBar) {
      if (!aFilters || !Array.isArray(aFilters) || !mConditions) {
        return;
      }

      // Handle nested filter structure - when multiple filters are defined,
      // they may be contained within aFilters[0].aFilters
      let actualFilters = aFilters;
      const firstFilter = aFilters[0];
      if (firstFilter?.aFilters && firstFilter.aFilters.length > 0) {
        actualFilters = firstFilter.aFilters;
      }

      // Get property helper to access property metadata
      const oPropertyHelper = oFilterBar.getPropertyHelper();
      if (!oPropertyHelper) {
        return;
      }

      // Create a map of condition paths to their precision levels
      const dateTimeOffsetPaths = new Map();
      Object.keys(mConditions).forEach(function (sConditionPath) {
        if (mConditions[sConditionPath] && mConditions[sConditionPath].length > 0) {
          // Use the full condition path for property helper
          const propertyInfo = oPropertyHelper.getProperty(sConditionPath);

          // Check if property is DateTimeOffset
          const isDateTimeOffset = (propertyInfo?.dataType?.includes("DateTimeOffset") ?? false) || (propertyInfo?.typeConfig?.typeInstance?.getName().includes("DateTimeOffset") ?? false);
          const precision = propertyInfo?.constraints?.precision ?? propertyInfo?.typeConfig?.typeInstance?.constraints?.precision;

          // Only process DateTimeOffset properties with defined precision
          if (isDateTimeOffset && precision !== undefined && precision > 0) {
            dateTimeOffsetPaths.set(sConditionPath, precision);
          }
        }
      });

      // Transform filters recursively to handle all nested structures
      this._transformDateTimeOffSetFilterValueRecursively(actualFilters, dateTimeOffsetPaths);
    },
    /**
     * Recursively transforms filters to handle all possible nested aFilters structures.
     * @param aFilters Array of filter objects to transform
     * @param dateTimeOffsetPaths Map of condition paths to their precision levels
     */
    _transformDateTimeOffSetFilterValueRecursively: function (aFilters, dateTimeOffsetPaths) {
      for (let i = 0; i < aFilters.length; i++) {
        const filter = aFilters[i];

        // Check if this filter has nested aFilters (multiple conditions for same field)
        const filterWithNestedFilters = filter;
        if (filterWithNestedFilters.aFilters && filterWithNestedFilters.aFilters.length > 0) {
          // Recursively transform nested filters for deeper nesting levels
          this._transformDateTimeOffSetFilterValueRecursively(filterWithNestedFilters.aFilters, dateTimeOffsetPaths);
          continue;
        }
        const filterPath = filter.getPath();
        const filterOperator = filter.getOperator();
        const filterValue1 = filter.getValue1();
        const filterValue2 = filter.getValue2?.();

        // Handle undefined filterOperator gracefully
        if (filterOperator === undefined) {
          Log.warning("FilterUtils._transformDateTimeOffsetFilters: Filter operator is undefined, skipping filter transformation", `filterPath: ${filterPath}, filterValue1: ${filterValue1}`);
          continue; // Skip this filter and continue with next one
        }

        // Check for transformation conditions:
        // 1. EQ operator with valid first value
        // 2. Any operator with two values (irrespective of operator type)
        const shouldTransform = filterOperator === "EQ" && filterValue1 !== undefined && filterValue1 !== null || filterValue1 !== undefined && filterValue1 !== null && filterValue2 !== undefined && filterValue2 !== null;
        if (shouldTransform) {
          // For direct properties - check if the path matches any condition path
          if (filterPath && dateTimeOffsetPaths.has(filterPath)) {
            const precision = dateTimeOffsetPaths.get(filterPath);
            const transformedFilter = this._transformDateTimeOffSetFilterValue(filter, precision);
            if (transformedFilter) {
              aFilters[i] = transformedFilter;
            }
          }
        } else if (filterOperator === "Any") {
          // Handle navigation property filters
          const nestedFilter = filter.getCondition();
          if (!nestedFilter) {
            continue;
          }

          // Check if the nested filter has multiple conditions (aFilters array)
          const nestedFilterWithMultipleConditions = nestedFilter;
          if (nestedFilterWithMultipleConditions.aFilters && nestedFilterWithMultipleConditions.aFilters.length > 0) {
            // Handle multiple conditions within navigation property
            let hasTransformation = false;
            for (let j = 0; j < nestedFilterWithMultipleConditions.aFilters.length; j++) {
              const subFilter = nestedFilterWithMultipleConditions.aFilters[j];

              // Check for further nesting within sub-filters
              const subFilterWithNesting = subFilter;
              if (subFilterWithNesting.aFilters && subFilterWithNesting.aFilters.length > 0) {
                // Recursively handle deeper nesting levels
                this._transformDateTimeOffSetFilterValueRecursively(subFilterWithNesting.aFilters, dateTimeOffsetPaths);
                continue;
              }
              const subFilterPath = subFilter.getPath();
              const subFilterOperator = subFilter.getOperator();
              const subFilterValue1 = subFilter.getValue1();
              const subFilterValue2 = subFilter.getValue2?.();

              // Handle undefined subFilterOperator gracefully
              if (subFilterOperator === undefined) {
                Log.warning("FilterUtils._transformDateTimeOffsetFilters: Filter operator is undefined, skipping filter transformation", `filterPath: ${subFilterPath}, filterValue1: ${subFilterValue1}`);
                continue; // Skip this sub-filter
              }

              // Check for transformation conditions for sub-filters
              const shouldTransformSubFilter = subFilterOperator === "EQ" && subFilterValue1 !== undefined && subFilterValue1 !== null || subFilterValue1 !== undefined && subFilterValue1 !== null && subFilterValue2 !== undefined && subFilterValue2 !== null;
              if (shouldTransformSubFilter) {
                // Check if any condition path matches the navigation pattern
                const matchingConditionPath = Array.from(dateTimeOffsetPaths.keys()).find(function (sConditionPath) {
                  // Extract navigation and property parts from condition path
                  const pathParts = sConditionPath.split("/");
                  if (pathParts.length === 2) {
                    const navigationPart = pathParts[0].replace("*", ""); // "_Item*" -> "_Item"
                    const propertyPart = pathParts[1]; // "BillingDocumentDate"

                    // Check if filter navigation matches and sub filter ends with property
                    return filterPath === navigationPart && Boolean(subFilterPath?.endsWith(propertyPart));
                  }
                  return false;
                });
                if (matchingConditionPath) {
                  const precision = dateTimeOffsetPaths.get(matchingConditionPath);
                  const transformedSubFilter = this._transformDateTimeOffSetFilterValue(subFilter, precision);
                  if (transformedSubFilter) {
                    nestedFilterWithMultipleConditions.aFilters[j] = transformedSubFilter;
                    hasTransformation = true;
                  }
                }
              }
            }

            // If any transformation occurred, recreate the Any filter with updated nested conditions
            if (hasTransformation) {
              aFilters[i] = new Filter({
                path: filterPath,
                operator: "Any",
                variable: filter.getVariable(),
                condition: new Filter({
                  filters: nestedFilterWithMultipleConditions.aFilters,
                  and: nestedFilterWithMultipleConditions.bAnd ?? true
                })
              });
            }
          } else {
            // Handle single condition within navigation property
            const nestedFilterPath = nestedFilter.getPath();
            const nestedFilterOperator = nestedFilter.getOperator();
            const nestedFilterValue1 = nestedFilter.getValue1();
            const nestedFilterValue2 = nestedFilter.getValue2?.();

            // Handle undefined nestedFilterOperator gracefully
            if (nestedFilterOperator === undefined) {
              Log.warning("FilterUtils._transformDateTimeOffsetFilters: Filter operator is undefined, skipping filter transformation", `filterPath: ${nestedFilterPath}, filterValue1: ${nestedFilterValue1}`);
              continue; // Skip this nested filter
            }

            // Check for transformation conditions for nested filters
            const shouldTransformNested = nestedFilterOperator === "EQ" && nestedFilterValue1 !== undefined && nestedFilterValue1 !== null || nestedFilterValue1 !== undefined && nestedFilterValue1 !== null && nestedFilterValue2 !== undefined && nestedFilterValue2 !== null;
            if (shouldTransformNested) {
              // Check if any condition path matches the navigation pattern
              const matchingConditionPath = Array.from(dateTimeOffsetPaths.keys()).find(function (sConditionPath) {
                // Extract navigation and property parts from condition path
                const pathParts = sConditionPath.split("/");
                if (pathParts.length === 2) {
                  const navigationPart = pathParts[0].replace("*", ""); // "_Item*" -> "_Item"
                  const propertyPart = pathParts[1]; // "RequestedDeliveryDate"

                  // Check if filter navigation matches and nested filter ends with property
                  return filterPath === navigationPart && Boolean(nestedFilterPath?.endsWith(propertyPart));
                }
                return false;
              });
              if (matchingConditionPath) {
                const precision = dateTimeOffsetPaths.get(matchingConditionPath);
                const transformedNestedFilter = this._transformDateTimeOffSetFilterValue(nestedFilter, precision);
                if (transformedNestedFilter) {
                  // Create new Any filter with transformed nested filter
                  aFilters[i] = new Filter({
                    path: filterPath,
                    operator: "Any",
                    variable: filter.getVariable(),
                    condition: transformedNestedFilter
                  });
                }
              }
            }
          }
        }
      }
    },
    /**
     * Transforms a single filter value for DateTimeOffset precision properties.
     * Handles EQ operator by converting to BT range, and adjusts second value for any filter with two values.
     * Precision determines the number of decimal places: precision 3 = .999, precision 7 = .9999999.
     * @param filter The filter to transform
     * @param precision The precision level for the DateTimeOffset property
     * @returns Transformed filter with microsecond precision or null if no transformation needed
     */
    _transformDateTimeOffSetFilterValue: function (filter, precision) {
      const operator = filter.getOperator();
      const value1 = filter.getValue1();
      const value2 = filter.getValue2?.();
      if (operator === undefined) {
        Log.warning("FilterUtils._transformDateTimeOffsetFilters: Filter operator is undefined, skipping filter transformation", `filterPath: ${filter.getPath()}, filterValue1: ${value1}`);
        return null;
      }

      // Only process filters with valid first value
      if (value1 === null || value1 === undefined) {
        return null;
      }
      const originalValue1 = value1;

      // Parse datetime: 2025-08-13T15:19:15.0000000+02:00 or Z
      const dateTimeMatch1 = originalValue1.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{0,7}))?([+-]\d{2}:\d{2}|Z)$/);
      if (!dateTimeMatch1) {
        return null;
      }
      const dateTimePart1 = dateTimeMatch1[1];
      const timezone1 = dateTimeMatch1[3];

      // Generate precision-based decimal suffix (e.g., .999 for precision 3, .9999999 for precision 7)
      const maxDecimalValue = "9".repeat(precision);

      // Handle EQ operator - convert to BT with full precision range
      if (operator === "EQ") {
        const startValue = `${dateTimePart1}.${"0".repeat(precision)}${timezone1}`;
        const endValue = `${dateTimePart1}.${maxDecimalValue}${timezone1}`;
        return new Filter({
          path: filter.getPath(),
          operator: FilterOperator.BT,
          value1: startValue,
          value2: endValue
        });
      }

      // For any operator with two values, adjust the second value to max precision
      if (value2 !== null && value2 !== undefined) {
        const originalValue2 = value2;
        const dateTimeMatch2 = originalValue2.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{0,7}))?([+-]\d{2}:\d{2}|Z)$/);
        if (!dateTimeMatch2) {
          return null;
        }
        const dateTimePart2 = dateTimeMatch2[1];
        const timezone2 = dateTimeMatch2[3];

        // Keep first value unchanged, modify second value to max precision
        const adjustedValue2 = `${dateTimePart2}.${maxDecimalValue}${timezone2}`;
        return new Filter({
          path: filter.getPath(),
          operator: filter.getOperator(),
          value1: originalValue1,
          // Keep original first value unchanged
          value2: adjustedValue2 // Transform second value to max precision
        });
      }

      // No transformation needed for single-value non-EQ operators
      return null;
    },
    hasEditStateFilterRecursively: function (filters) {
      return filters.some(filter => {
        if (filter.getPath() === "$editState") {
          return true;
        } else if (filter.getFilters() !== undefined) {
          return this.hasEditStateFilterRecursively(filter.getFilters());
        } else {
          return false;
        }
      });
    },
    exchangeEditStateFilterRecursively: function (editStateFilter, filters) {
      return filters.map(filter => {
        if (filter.getPath() === "$editState") {
          return editStateFilter;
        } else if (filter.getFilters() !== undefined) {
          filter = new Filter({
            filters: this.exchangeEditStateFilterRecursively(editStateFilter, filter.getFilters()),
            and: filter.isAnd()
          });
          return filter;
        }
        return filter;
      });
    },
    setTypeConfigToProperties: function (aProperties) {
      if (aProperties && aProperties.length) {
        aProperties.forEach(function (oIFilterProperty) {
          if (oIFilterProperty.typeConfig && oIFilterProperty.typeConfig.typeInstance && oIFilterProperty.typeConfig.typeInstance.getConstraints instanceof Function) {
            return;
          }
          if (oIFilterProperty.path === "$editState") {
            oIFilterProperty.typeConfig = TypeMap.getTypeConfig("sap.ui.model.odata.type.String", {}, {});
          } else if (oIFilterProperty.path === "$search") {
            oIFilterProperty.typeConfig = TypeMap.getTypeConfig("sap.ui.model.odata.type.String", {}, {});
          } else if (oIFilterProperty.dataType || oIFilterProperty.typeConfig && oIFilterProperty.typeConfig.className) {
            oIFilterProperty.typeConfig = TypeMap.getTypeConfig(oIFilterProperty.dataType || oIFilterProperty.typeConfig?.className, oIFilterProperty.formatOptions, oIFilterProperty.constraints);
          }
        });
      }
      return aProperties;
    },
    getNotApplicableFilters: function (oFilterBar, oControl) {
      const sTargetEntityTypePath = oControl.data("entityType"),
        oFilterBarEntityPath = oFilterBar.data("entityType"),
        oMetaModel = oFilterBar.getModel().getMetaModel(),
        oFilterBarEntitySetAnnotations = oMetaModel.getObject(oFilterBarEntityPath),
        aNotApplicable = [],
        mConditions = oFilterBar.getConditions(),
        bIsFilterBarEntityType = sTargetEntityTypePath === oFilterBarEntityPath,
        bIsChart = oControl.isA("sap.ui.mdc.Chart"),
        bIsAnalyticalTable = !bIsChart && oControl.getParent().getTableDefinition().enableAnalytics,
        bIsTreeTable = !bIsChart && oControl.getParent().getTableDefinition().control.type === "TreeTable",
        bEnableSearch = bIsChart ? CommonHelper.parseCustomData(DelegateUtil.getCustomData(oControl, "applySupported")).enableSearch : oControl.getParent().getTableDefinition().annotation.searchable;
      if (mConditions && (!bIsFilterBarEntityType || bIsAnalyticalTable || bIsChart || bIsTreeTable)) {
        // We don't need to calculate the difference on property Level if entity sets are identical
        const aTargetProperties = bIsFilterBarEntityType ? [] : oFilterBar.getControlDelegate().fetchPropertiesForEntity(sTargetEntityTypePath, oMetaModel, oFilterBar),
          mTargetProperties = aTargetProperties.reduce(function (mProp, oProp) {
            mProp[oProp.name] = oProp;
            return mProp;
          }, {}),
          mAggregatedProperties = {};
        const chartEntityTypeAnnotations = oControl.getModel().getMetaModel().getObject(oControl.data("targetCollectionPath") + "/");
        if (oControl.isA("sap.ui.mdc.Chart")) {
          const oEntitySetAnnotations = oControl.getModel().getMetaModel().getObject(`${oControl.data("targetCollectionPath")}@`),
            mChartCustomAggregates = getAllCustomAggregates(oEntitySetAnnotations);
          Object.keys(mChartCustomAggregates).forEach(function (sAggregateName) {
            if (!mAggregatedProperties[sAggregateName]) {
              const oAggregate = mChartCustomAggregates[sAggregateName];
              mAggregatedProperties[sAggregateName] = oAggregate;
            }
          });
        }
        for (const sProperty in mConditions) {
          // Need to check the length of mConditions[sProperty] since previous filtered properties are kept into mConditions with empty array as definition
          const aConditionProperty = mConditions[sProperty];
          let typeCheck = true;
          if (chartEntityTypeAnnotations[sProperty] && oFilterBarEntitySetAnnotations[sProperty]) {
            typeCheck = chartEntityTypeAnnotations[sProperty]["$Type"] === oFilterBarEntitySetAnnotations[sProperty]["$Type"];
          }
          if (Array.isArray(aConditionProperty) && aConditionProperty.length > 0 && (
          //has a filter value
          (!mTargetProperties[sProperty] ||
          // no target property found by property name
          mTargetProperties[sProperty].isCustomFilter && mTargetProperties[sProperty].annotationPath == undefined ||
          // custom filter that is not part of the current entitySet
          mTargetProperties[sProperty] && !typeCheck) && (!bIsFilterBarEntityType || sProperty === "$editState" && (bIsChart || bIsTreeTable || bIsAnalyticalTable)) ||
          //type does not match OR $editState on secondary entity set
          mAggregatedProperties[sProperty])) {
            aNotApplicable.push(sProperty.replace(/[+|*]/g, ""));
          }
        }
      }
      if (!bEnableSearch && oFilterBar.getSearch()) {
        aNotApplicable.push("$search");
      }
      return aNotApplicable;
    },
    /**
     * Gets the value list information of a property as defined for a given filter bar.
     * @param filterBar The filter bar to get the value list information for
     * @param propertyName The property to get the value list information for
     * @returns The value list information
     */
    async _getValueListInfo(filterBar, propertyName) {
      const metaModel = filterBar.getModel()?.getMetaModel();
      if (!metaModel) {
        return undefined;
      }
      const entityType = filterBar.data("entityType") ?? "";
      const valueListInfos = await metaModel.requestValueListInfo(entityType + propertyName, true).catch(() => null);
      return valueListInfos?.[""];
    },
    /**
     * Gets the value list of all the filter properties.
     * @param filterBar Instance of FilterBar
     * @returns Array of filter properties for FilterBar
     */
    getFilterPropertyInfo(filterBar) {
      let _propertyInfo = filterBar.data("feFilterInfo");
      if (typeof _propertyInfo === "string") {
        _propertyInfo = JSON.parse(_propertyInfo);
      }
      return _propertyInfo || [];
    },
    /**
     * Gets the {@link ConditionValidated} state for a single value. This decides whether the value is treated as a selected value
     * in a value help, meaning that its description is loaded and displayed if existing, or whether it is displayed as a
     * condition (e.g. "=1").
     *
     * Values for properties without value list info are always treated as {@link ConditionValidated.NotValidated}.
     * @param valueListInfo The value list info from the {@link MetaModel}
     * @param propertyName The name of the property
     * @param value The single value to get the state for
     * @returns The {@link ConditionValidated} state for the value
     */
    _getConditionValidated: async function (valueListInfo, propertyName, value) {
      if (!valueListInfo) {
        return ConditionValidated.NotValidated;
      }
      try {
        const valueListProperties = valueListInfo.Parameters.filter(parameter => ["com.sap.vocabularies.Common.v1.ValueListParameterInOut".valueOf(), "com.sap.vocabularies.Common.v1.ValueListParameterOut".valueOf()].includes(parameter.$Type)).filter(parameter => parameter.LocalDataProperty?.$PropertyPath === propertyName).map(parameter => parameter.ValueListProperty);
        const valueListPropertyPath = valueListProperties[0] ?? propertyName;
        const filter = new Filter({
          path: valueListPropertyPath,
          operator: FilterOperator.EQ,
          value1: value
        });
        const listBinding = valueListInfo.$model.bindList(`/${valueListInfo.CollectionPath}`, undefined, undefined, filter, {
          $select: valueListPropertyPath
        });
        const valueExists = (await listBinding.requestContexts()).length > 0;
        if (valueExists) {
          return ConditionValidated.Validated;
        } else {
          return ConditionValidated.NotValidated;
        }
      } catch (error) {
        Log.error("FilterUtils: Error while retrieving ConditionValidated", error);
        return ConditionValidated.NotValidated;
      }
    },
    /**
     * Clear the filter value for a specific property in the filter bar.
     * This is a prerequisite before new values can be set cleanly.
     * @param filterBar The filter bar that contains the filter field
     * @param conditionPath The path to the property as a condition path
     */
    async _clearFilterValue(filterBar, conditionPath) {
      const oState = await StateUtil.retrieveExternalState(filterBar);
      if (oState.filter[conditionPath]) {
        oState.filter[conditionPath].forEach(oCondition => {
          oCondition.filtered = false;
        });
        await StateUtil.applyExternalState(filterBar, {
          filter: {
            [conditionPath]: oState.filter[conditionPath]
          }
        });
      }
    },
    /**
     * Normalizes the variadic args of _setFilterValues into a canonical operator and values pair.
     * Returns { earlyReturn: true } when the call should be silently ignored (empty value with a
     * standard operator, BCP 2270135274).
     * @param args The variadic args passed to _setFilterValues
     * @returns Canonical operator and values, or earlyReturn flag
     */
    _resolveOperatorAndValues(args) {
      let operator = args?.[0];
      let rawValues = args?.[1];

      // common filter Operators need a value. Do nothing if this value is undefined
      // BCP: 2270135274
      if (args.length === 2 && (rawValues === undefined || rawValues === null || rawValues === "") && operator && Object.keys(FilterOperator).includes(operator)) {
        Log.warning(`An empty filter value cannot be applied with the ${operator} operator`);
        return {
          earlyReturn: true
        };
      }

      // The 4th parameter is optional; if operator is missing, rawValues is used as 3rd parameter
      // This does not apply for semantic dates, as these do not require rawValues (exception: "LASTDAYS", 3)
      if (rawValues === undefined && !SemanticDateOperators.getSemanticDateOperations().includes(operator || "") && !(operator === "Empty")) {
        rawValues = operator ?? [];
        operator = undefined;
      }

      // If operator is not set, use EQ as default
      if (!operator) {
        operator = FilterOperator.EQ;
      }

      // Supported array types:
      //  - Single Values:	"2" | ["2"]
      //  - Multiple Values:	["2", "3"]
      //  - Ranges:			["2","3"]
      // Unsupported array types:
      //  - Multiple Ranges:	[["2","3"]] | [["2","3"],["4","5"]]
      const supportedValueTypes = ["string", "number", "boolean"];
      if (rawValues !== undefined && (!Array.isArray(rawValues) && !supportedValueTypes.includes(typeof rawValues) || Array.isArray(rawValues) && rawValues.length > 0 && !supportedValueTypes.includes(typeof rawValues[0]))) {
        throw new Error("FilterUtils.js#_setFilterValues: Filter value not supported; only primitive values or an array thereof can be used.");
      }
      let values;
      if (rawValues !== undefined) {
        values = Array.isArray(rawValues) ? rawValues : [rawValues];
      }
      return {
        operator,
        values
      };
    },
    /**
     * Resolves the canonical condition path, property name, and value list info for a given raw
     * condition path and filter bar. The returned conditionPath may differ from the input if the
     * property path contains 1:n navigation segments.
     * @param filterBar The filter bar that contains the filter field
     * @param conditionPath The raw condition path
     * @returns Resolved conditionPath, propertyName, and valueListInfo
     */
    async _resolveConditionContext(filterBar, conditionPath) {
      // We recreate conditionPath to ensure it is in right format
      // e.g. If "_Item/Material" is sent as condition path where _Item is 1:n multiplicity -> "_Item*/Material"
      const propertyPath = oFilterUtils.getPropertyPathFromConditionPath(conditionPath);
      const mainFilterBarControl = oFilterUtils.getFilterBarForAdaptationControl(filterBar) ?? filterBar;
      const propertyTargetObjectPath = oFilterUtils.getDataModelObjectPathForProperty(mainFilterBarControl, propertyPath);
      const propertyName = propertyTargetObjectPath?.targetObject?.name ?? propertyPath;
      const resolvedConditionPath = (propertyTargetObjectPath ? getContextRelativeTargetObjectPath(propertyTargetObjectPath, false, true) : undefined) ?? conditionPath;
      const valueListInfo = await this._getValueListInfo(mainFilterBarControl, propertyPath);
      return {
        conditionPath: resolvedConditionPath,
        propertyName,
        valueListInfo
      };
    },
    /**
     * Builds the ConditionObject[] array for a resolved condition path, operator, and values.
     * Returns undefined when no condition should be created (e.g. reset case).
     * @param operator The operator to use
     * @param values The values to apply
     * @param valueListInfo The value list info for the property
     * @param propertyName The property name
     * @returns Array of conditions, or undefined if no conditions should be created
     */
    async _buildConditions(operator, values, valueListInfo, propertyName) {
      if (values && values.length) {
        if (operator === OperatorName.BT || operator === OperatorName.NOTBT || operator === "DATERANGE") {
          // The operator BT and NOTBT require one condition with both thresholds
          return [Condition.createCondition(operator, values, null, null, ConditionValidated.NotValidated)];
        } else {
          // Regular single and multi value conditions, if there are no values, we do not want any conditions
          return Promise.all(values.map(async value => {
            // For the EQ case, tell MDC to validate the value (e.g. display the description), if it exists in the associated entity, otherwise never validate
            const conditionValidatedStatus = operator === FilterOperator.EQ ? await this._getConditionValidated(valueListInfo, propertyName, value) : ConditionValidated.NotValidated;
            return Condition.createCondition(operator, [value], null, null, conditionValidatedStatus);
          }));
        }
      } else if (SemanticDateOperators.getSemanticDateOperations().includes(operator || "") || operator === "Empty") {
        // vValues is undefined, so the operator is a semantic date that does not need values (see above)
        return [Condition.createCondition(operator, [], null, null, ConditionValidated.NotValidated)];
      }
      return undefined;
    },
    /**
     * Set the filter values for the given property in the filter bar.
     * The filter values can be either a single value or an array of values.
     * Each filter value must be represented as a primitive value.
     * @param oFilterBar The filter bar that contains the filter field
     * @param sConditionPath The path to the property as a condition path
     * @param args List of optional parameters
     *  [sOperator] The operator to be used - if not set, the default operator (EQ) will be used
     *  [vValues] The values to be applied - if sOperator is missing, vValues is used as 3rd parameter
     */
    setFilterValues: async function (oFilterBar, sConditionPath) {
      for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        args[_key - 2] = arguments[_key];
      }
      await this._setFilterValues(oFilterBar, false, sConditionPath, ...args);
    },
    /**
     * Add the filter values for the given property in the filter bar.
     *
     * The filter values can be either a single value or an array of values.
     * Each filter value must be represented as a primitive value.
     * @param filterBar The filter bar that contains the filter field
     * @param conditionPath The path to the property as a condition path
     * @param args List of optional parameters
     */
    addFilterValues: async function (filterBar, conditionPath) {
      for (var _len2 = arguments.length, args = new Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
        args[_key2 - 2] = arguments[_key2];
      }
      await this._setFilterValues(filterBar, true, conditionPath, ...args);
    },
    /**
     * Get property path from condition path.
     *
     * It removes the condition path specific characters like "+" and "*".
     * @param conditionPath The path to the property as a condition path
     * @returns The property path derived from the condition path
     */
    getPropertyPathFromConditionPath(conditionPath) {
      return conditionPath.replace(CONDITION_PATH_TO_PROPERTY_PATH_REGEX, "");
    },
    /**
     * Get main filter bar for the given p13n adaptation filter control.
     * @param potentialFilterBar Expected instance of FilterBar or AdaptationFilterBar.
     * @returns The main filter bar instance if found, otherwise undefined.
     */
    getFilterBarForAdaptationControl(potentialFilterBar) {
      while (potentialFilterBar && !potentialFilterBar.isA("sap.ui.mdc.FilterBar")) {
        potentialFilterBar = potentialFilterBar.getParent();
      }
      return potentialFilterBar;
    },
    /**
     * Get the data model object path for a property in the filter bar.
     *
     * This is used to retrieve the data model object path for a specific property in the filter bar.
     * @param filterBar The filter bar that contains the property
     * @param propertyPath The path to the property
     * @returns The data model object path for the property
     */
    getDataModelObjectPathForProperty(filterBar, propertyPath) {
      const entityTypePath = DelegateUtil.getCustomData(filterBar, "entityType");
      const metaModel = filterBar.getModel()?.getMetaModel();
      return MetaModelConverter.getInvolvedDataModelObjects(metaModel.createBindingContext(`${entityTypePath}${propertyPath}`), metaModel.createBindingContext(`${entityTypePath}`));
    },
    _setFilterValues: async function (oFilterBar, append, sConditionPath) {
      // Do nothing when the filter bar is hidden
      if (!oFilterBar) {
        return;
      }

      // We wait for filter bar to be ready.
      if (oFilterBar.isA("sap.fe.macros.controls.FilterBar")) {
        // _setFilterValues could be called in case of adaptation filter bar, so we explicitly check for FE filter bar control.
        await oFilterBar.whenInitialized();
      }
      for (var _len3 = arguments.length, args = new Array(_len3 > 3 ? _len3 - 3 : 0), _key3 = 3; _key3 < _len3; _key3++) {
        args[_key3 - 3] = arguments[_key3];
      }
      const resolved = this._resolveOperatorAndValues(args);
      if ("earlyReturn" in resolved) {
        return;
      }
      const {
        operator,
        values
      } = resolved;
      const filter = {};
      if (sConditionPath) {
        const {
          conditionPath,
          propertyName,
          valueListInfo
        } = await this._resolveConditionContext(oFilterBar, sConditionPath);
        sConditionPath = conditionPath;
        const conditions = await this._buildConditions(operator, values, valueListInfo, propertyName);
        if (conditions) {
          filter[sConditionPath] = conditions;
        }
      }

      // Suspend MDC selection (validation) while clearing and re-applying the filter value.
      // In liveMode the MDC FilterBar validates required fields on every state change. Without
      // this guard the intermediate "cleared" state triggers the "Enter a value in all required
      // fields" error dialog even though the new value is applied immediately after.
      const isLiveMode = oFilterBar.getLiveMode?.();
      if (isLiveMode) {
        oFilterBar.setSuspendSelection(true);
      }
      try {
        if (!append) {
          // Clear the current value as we do not want to add filter values but replace them
          await this._clearFilterValue(oFilterBar, sConditionPath);
        }
        if (filter[sConditionPath]) {
          // This is not called in the reset case, i.e. setFilterValue("Property")
          await StateUtil.applyExternalState(oFilterBar, {
            filter
          });
        }
      } finally {
        if (isLiveMode) {
          oFilterBar.setSuspendSelection(false);
        }
      }
    },
    /**
     * Resolves the MDC table content control from a given filter bar.
     * @param oFilterBar The filter bar control used to locate the associated table.
     * @param callerName Name of the calling function for logging purposes.
     * @returns The MDC table control, or undefined if it cannot be resolved.
     */
    _getTableFromFilterBar: function (oFilterBar, callerName) {
      const oView = oFilterBar.isA ? CommonUtils.getTargetView(oFilterBar) : null;
      if (!oView || !oView.getController()) {
        Log.warning(`FilterUtils.${callerName}: Cannot find view or controller`);
        return undefined;
      }
      const controller = oView.getController();
      if (typeof controller._getControls !== "function") {
        Log.warning(`FilterUtils.${callerName}: Controller does not support _getControls`);
        return undefined;
      }
      const tableControls = controller._getControls("table");
      if (!tableControls || tableControls.length === 0) {
        Log.warning(`FilterUtils.${callerName}: No table controls found`);
        return undefined;
      }
      const filterBarId = oFilterBar.getId();
      const oTable = tableControls.find(oTable => {
        const tableAPI = oTable.getParent();
        return tableAPI?.getContent()?.getFilter?.() === filterBarId;
      });
      if (!oTable) {
        Log.warning(`FilterUtils.${callerName}: No table found associated with filter bar '${filterBarId}'`);
        return undefined;
      }
      const tableAPI = oTable.getParent();
      return tableAPI?.getContent();
    },
    /**
     * Clears all existing sorters from the given MDC table.
     * @param table The MDC table control.
     */
    _clearExistingSorters: async function (table) {
      const oState = await StateUtil.retrieveExternalState(table);
      if (oState.sorters && oState.sorters.length > 0) {
        const clearedSorters = oState.sorters.map(sorter => ({
          ...sorter,
          sorted: false
        }));
        await StateUtil.applyExternalState(table, {
          sorters: clearedSorters
        });
      }
    },
    /**
     * Applies sorters to the table associated with the given filter bar.
     * @param oFilterBar The filter bar control used to locate the associated table.
     * @param sorters The sorters to apply.
     */
    applySortersToTable: async function (oFilterBar, sorters) {
      if (!oFilterBar || !sorters || sorters.length === 0) {
        return;
      }
      const table = oFilterUtils._getTableFromFilterBar(oFilterBar, "applySortersToTable");
      if (!table) {
        return;
      }

      // Convert sorters to the format expected by StateUtil
      // Extract just the property name from the key (remove entity path if present)
      const propertyInfos = table.getParent()?.getEnhancedFetchedPropertyInfos() ?? [];
      const stateSorters = sorters.map(sorter => {
        const propertyName = sorter.key.includes("/") ? sorter.key.split("/").pop() : sorter.key;
        const match = propertyInfos.find(p => p.relativePath === propertyName && p.key?.startsWith("Property::")) ?? propertyInfos.find(p => p.relativePath === propertyName);
        return {
          key: match?.key ?? propertyName,
          descending: sorter.descending
        };
      });
      try {
        await oFilterUtils._clearExistingSorters(table);
        await StateUtil.applyExternalState(table, {
          sorters: stateSorters
        });
      } catch (error) {
        Log.error("FilterUtils.applySortersToTable: Failed to apply sorting", error);
      }
    },
    /**
     * Clears all sorters from the table associated with the given filter bar.
     * @param oFilterBar The filter bar control used to locate the associated table.
     */
    clearSortersFromTable: async function (oFilterBar) {
      if (!oFilterBar) {
        return;
      }
      const table = oFilterUtils._getTableFromFilterBar(oFilterBar, "clearSortersFromTable");
      if (!table) {
        return;
      }
      try {
        await oFilterUtils._clearExistingSorters(table);
      } catch (error) {
        Log.error("FilterUtils.clearSortersFromTable: Failed to clear sorting", error);
      }
    },
    conditionToModelPath: function (sConditionPath) {
      // make the path usable as model property, therefore slashes become backslashes
      return sConditionPath.replace(/\//g, "\\");
    },
    _getFilterMetaModel: function (oFilterControl, metaModel) {
      return metaModel || oFilterControl.getModel().getMetaModel();
    },
    _getEntitySetPath: function (sEntityTypePath) {
      return sEntityTypePath && ModelHelper.getEntitySetPath(sEntityTypePath);
    },
    _getFieldsForTable: function (oFilterControl, sEntityTypePath) {
      const lrTables = [];
      /**
       * Gets fields from
       * 	- direct entity properties,
       * 	- navigateProperties key in the manifest if these properties are known by the entity
       *  - annotation "SelectionFields"
       */
      if (sEntityTypePath) {
        const oView = oFilterControl.isA ? CommonUtils.getTargetView(oFilterControl) : null;
        const tableControls = oView && oView.getController() && oView.getController()._getControls && oView.getController()._getControls("table");
        if (tableControls) {
          tableControls.forEach(function (oTable) {
            lrTables.push(oTable.getParent().getTableDefinition());
          });
        }
        return lrTables;
      }
      return [];
    },
    _getSelectionFields: function (oFilterControl, sEntityTypePath, sFilterEntityTypePath, contextPath, lrTables, oMetaModel, oConverterContext, includeHidden, oModifier, lineItemTerm, annotationPath, propertyInfosFromFilterBar) {
      const filterFields = FilterBarConverter.getSelectionFields(oConverterContext, lrTables, annotationPath, includeHidden, lineItemTerm);
      let selectionFields = filterFields.selectionFields;
      let propertyInfos;
      //During templating time while adding a flex change propertyInfosFromFilterBar will be passed
      if (propertyInfosFromFilterBar && propertyInfosFromFilterBar.length > 0) {
        propertyInfos = propertyInfosFromFilterBar;
      } else {
        propertyInfos = oFilterControl.data ? this.getFilterPropertyInfo(oFilterControl) : JSON.parse(filterFields.sPropertyInfo.replace(/\\\{/g, "{").replace(/\\\}/g, "}")); // propertyInfo string is returned from the getSelectionFields
      }
      if ((oModifier ? oModifier.getControlType(oFilterControl) === "sap.ui.mdc.FilterBar" : oFilterControl.isA("sap.ui.mdc.FilterBar")) && sEntityTypePath !== sFilterEntityTypePath) {
        /**
         * We are in a multi-entity set scenario so we add annotation "SelectionFields"
         * from FilterBar entity if these properties are known by the entity
         */
        const oVisualizationObjectPath = MetaModelConverter.getInvolvedDataModelObjects(oMetaModel.createBindingContext(contextPath));
        const oPageContext = oConverterContext.getConverterContextFor(sFilterEntityTypePath);
        const aFilterBarSelectionFieldsAnnotation = oPageContext.getEntityTypeAnnotation("@com.sap.vocabularies.UI.v1.SelectionFields").annotation || [];
        const mapSelectionFields = {};
        selectionFields.forEach(function (oSelectionField) {
          mapSelectionFields[oSelectionField.conditionPath] = true;
        });
        aFilterBarSelectionFieldsAnnotation.forEach(function (oFilterBarSelectionFieldAnnotation) {
          const sPath = oFilterBarSelectionFieldAnnotation.value;
          if (!mapSelectionFields[sPath]) {
            const oFilterField = FilterBarConverter.getFilterField(sPath, oConverterContext, oVisualizationObjectPath.startingEntitySet.entityType);
            if (oFilterField) {
              selectionFields.push(oFilterField);
            }
          }
        });
      }
      if (selectionFields) {
        const fieldNames = [];
        selectionFields.forEach(function (oField) {
          fieldNames.push(oField.key);
        });
        selectionFields = this._getSelectionFieldsFromPropertyInfos(fieldNames, selectionFields, propertyInfos);
      }
      return selectionFields;
    },
    /**
     * Adds the properties from propertyInfos for the filter field.
     * @param fieldNames The names of fields present in the selectionField array.
     * @param selectionFields Selection field array of all the possible fields that can be in the selection field.
     * @param propertyInfo PropertyInfos filters that are available or present in selection field annotation.
     * @returns FilterField array of all the possible filter fields after adding properties from propertyInfos
     */
    _getSelectionFieldsFromPropertyInfos: function (fieldNames, selectionFields, propertyInfo) {
      // Create a map for quick lookup by annotation path
      const selectionFieldsMap = selectionFields.reduce((map, field) => {
        if (field.annotationPath) {
          map[field.annotationPath] = field;
        }
        return map;
      }, {});
      propertyInfo.forEach(prop => {
        if (prop.name === "$search" || prop.name === "$editState" || prop.key === undefined) {
          return;
        }

        // Find a matching selection field by annotation path
        const matchingSelectionField = selectionFieldsMap && prop.annotationPath ? selectionFieldsMap[prop.annotationPath] : undefined;
        if (matchingSelectionField) {
          // Propagate properties from selection field
          this._mergeSelectionFieldProperties(prop, matchingSelectionField);

          // Update the existing selection field
          const index = fieldNames.indexOf(matchingSelectionField.key);
          if (index !== -1) {
            selectionFields[index] = prop;
          }
        } else if (fieldNames.includes(prop.key) && prop.key) {
          // Update existing field if it exists in selectionFields by key
          const selField = selectionFields[fieldNames.indexOf(prop.key)];
          if (selField.annotationPath) {
            this._mergeSelectionFieldProperties(prop, selField);
            const index = fieldNames.indexOf(prop.key);
            selectionFields[index] = prop;
          }
        } else if (!prop.annotationPath) {
          // Add new field if it doesn't exist and annotation path is not present
          selectionFields.push(prop);
        }
      });
      return selectionFields;
    },
    /**
     * Merges properties from an existing selection field into the property info field.
     * @param prop The property info field to update
     * @param existingField The existing selection field to merge from
     */
    _mergeSelectionFieldProperties: function (prop, existingField) {
      prop.group = existingField.group;
      prop.groupLabel = existingField.groupLabel;
      prop.settings = existingField.settings;
      prop.visualFilter = existingField.visualFilter;
      prop.label = prop.label || existingField.label; // Use propertyInfo labels as they can have custom labels
      prop.annotationPath = prop.annotationPath || existingField.annotationPath;
    },
    _getSearchField: function (oIFilter, aIgnoreProperties) {
      return oIFilter.getSearch && !aIgnoreProperties.includes("search") ? oIFilter.getSearch() : null;
    },
    _getFilterConditions: function (mProperties, mFilterConditions, oIFilter) {
      const mConditions = mFilterConditions || oIFilter.getConditions();
      if (mProperties && mProperties.targetControl && mProperties.targetControl.isA("sap.ui.mdc.Chart")) {
        Object.keys(mConditions).forEach(function (sKey) {
          if (sKey === "$editState") {
            delete mConditions["$editState"];
          }
        });
      }
      return mConditions;
    },
    _getFilterPropertiesMetadata: function (aFilterPropertiesMetadata, oIFilter) {
      if (!(aFilterPropertiesMetadata && aFilterPropertiesMetadata.length)) {
        if (oIFilter.getPropertyInfo) {
          aFilterPropertiesMetadata = oIFilter.getPropertyInfo();
        } else {
          aFilterPropertiesMetadata = null;
        }
      }
      return aFilterPropertiesMetadata;
    },
    _getIgnoredProperties: function (filterPropertiesMetadata, entityProperties) {
      const ignoreProperties = [];
      filterPropertiesMetadata.forEach(function (filterProperty) {
        const filterPropertyName = filterProperty.name;
        const entityPropertiesCurrent = entityProperties.find(entity => entity.name === filterPropertyName);
        if (entityPropertiesCurrent && (!filterProperty.isCustomFilter && filterProperty.dataType !== entityPropertiesCurrent.dataType ||
        // custom filters will have an annotation path applied in the converter when there is a matching property found
        filterProperty.isCustomFilter && entityPropertiesCurrent.annotationPath === undefined)) {
          ignoreProperties.push(filterPropertyName);
        }
      });
      return ignoreProperties;
    },
    getFilters: function (filterBar) {
      if (!filterBar || typeof filterBar.isInitialized !== "function" || !filterBar.isInitialized()) {
        return;
      }
      const {
        parameters,
        filters,
        search
      } = this.getFilterInfo(filterBar);
      return {
        parameters,
        filters,
        search
      };
    },
    /**
     * Prepares propertyInfo for sharing it outside FE, removes unwanted property.
     * @param propertyInfos Array of propertyInfo
     * @returns Array or String (for FilterBar templating) of PropertyInfos after removing the unwanted properties
     */
    formatPropertyInfo: function (propertyInfos) {
      if (typeof propertyInfos === "string") {
        let propInfo = propertyInfos.replace(/\\\{/g, "{");
        propInfo = propInfo.replace(/\\\}/g, "}");
        let propInfos = JSON.parse(propInfo);
        propInfos = this._formatPropertyInfo(propInfos);
        let propertyInfoForFilterBar = JSON.stringify(propInfos);
        propertyInfoForFilterBar = propertyInfoForFilterBar.replace(/\{/g, "\\{");
        propertyInfoForFilterBar = propertyInfoForFilterBar.replace(/\}/g, "\\}");
        return propertyInfoForFilterBar;
      } else {
        return this._formatPropertyInfo(propertyInfos);
      }
    },
    /**
     * Removes unwanted property from PropertyInfos.
     * @param propertyInfos Array of propertyInfo
     * @returns Array of PropertyInfos after removing the unwanted properties
     */
    _formatPropertyInfo: function (propertyInfos) {
      return propertyInfos.map(property => {
        const _propertyInfo = {
          key: property.key || property.name,
          dataType: "",
          label: ""
        };
        for (const key in PropertyInfoKeys) {
          if (property.hasOwnProperty(key)) {
            switch (key) {
              case "hiddenFilter":
                _propertyInfo.hiddenFilter = property.hiddenFilter;
                break;
              case "required":
                _propertyInfo.required = property.required;
                break;
              case "path":
                _propertyInfo.path = property.path;
                break;
              case "tooltip":
                _propertyInfo.tooltip = property.tooltip;
                break;
              case "visible":
                _propertyInfo.visible = property.visible;
                break;
              case "maxConditions":
                _propertyInfo.maxConditions = property.maxConditions;
                break;
              case "formatOptions":
                _propertyInfo.formatOptions = property.formatOptions;
                break;
              case "constraints":
                _propertyInfo.constraints = property.constraints;
                break;
              case "group":
                _propertyInfo.group = property.group;
                break;
              case "groupLabel":
                _propertyInfo.groupLabel = property.groupLabel;
                break;
              case "caseSensitive":
                _propertyInfo.caseSensitive = property.caseSensitive;
            }
          }
        }
        if (property.dataType) {
          _propertyInfo.dataType = property.dataType;
        } else {
          throw new Error(`Missing mandatory property dataType for filter-bar filter field: ${property}`);
        }
        if (property.label) {
          _propertyInfo.label = property.label;
        }
        return _propertyInfo;
      });
    },
    /**
     * Checks if the Property already exists in the propertyInfo array, used during templating to avoid duplicates.
     * @param parentControl FilterBar control where the custom data is stored
     * @param modifier Modifier
     * @param propertyInfoName Name of the property to be checked
     * @returns Array of PropertyInfos after removing the unwanted properties
     */
    _checkIfPropertyInfoExists: async function (parentControl, modifier, propertyInfoName) {
      let propertyInfo = [];
      try {
        const customDataValue = await DelegateUtil.getCustomDataWithModifier(parentControl, "feFilterInfo", modifier);
        if (customDataValue) {
          propertyInfo = JSON.parse(customDataValue);
          return propertyInfo.some(obj => obj.name === propertyInfoName);
        }
        return false;
      } catch (error) {
        return false;
      }
    }
  };
  return oFilterUtils;
}, false);
//# sourceMappingURL=FilterUtils-dbg.js.map
