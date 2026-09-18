/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/i18n/Localization", "sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/controls/easyFilter/EasyFilterBarContainer", "sap/fe/controls/easyFilter/utils", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/controllerextensions/BusyLocker", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyHelper", "sap/fe/macros/ai/EasyFilterDataFetcher", "sap/fe/macros/filter/FilterUtils", "sap/fe/macros/filterBar/DraftEditState", "sap/fe/macros/internal/valuehelp/ValueListHelper", "sap/ui/core/Element", "sap/ui/core/format/DateFormat", "sap/ui/fl/apply/api/ControlVariantApplyAPI", "sap/ui/fl/write/api/ControlPersonalizationWriteAPI", "sap/ui/mdc/enums/OperatorName", "sap/ui/mdc/p13n/StateUtil", "sap/ui/model/FilterOperator", "sap/ui/model/json/JSONModel", "sap/ui/model/odata/type/DateTimeOffset", "sap/fe/base/jsx-runtime/jsx"], function (Log, Localization, BindingToolkit, ClassSupport, EasyFilterBarContainer, EasyFilterUtils, BuildingBlock, BusyLocker, ModelHelper, TypeGuards, DataModelPathHelper, PropertyHelper, EasyFilterDataFetcher, FilterUtils, DraftEditState, ValueListHelper, UI5Element, DateFormat, ControlVariantApplyAPI, ControlPersonalizationWriteAPI, OperatorName, StateUtil, FilterOperator, JSONModel, DateTimeOffset, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6;
  var _exports = {};
  var unresolvedResult = EasyFilterDataFetcher.unresolvedResult;
  var resolveTokenValue = EasyFilterDataFetcher.resolveTokenValue;
  var mapValueListToCodeList = EasyFilterDataFetcher.mapValueListToCodeList;
  var generateSelectParameter = EasyFilterDataFetcher.generateSelectParameter;
  var hasValueHelpWithFixedValues = PropertyHelper.hasValueHelpWithFixedValues;
  var isPathFilterable = DataModelPathHelper.isPathFilterable;
  var isProperty = TypeGuards.isProperty;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var isNavigationProperty = TypeGuards.isNavigationProperty;
  var isEntityType = TypeGuards.isEntityType;
  var isComplexType = TypeGuards.isComplexType;
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var association = ClassSupport.association;
  var aggregation = ClassSupport.aggregation;
  var isConstant = BindingToolkit.isConstant;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Delivery for beta release for the easy filter feature.
   */
  let EasyFilterBar = (_dec = defineUI5Class("sap.fe.macros.EasyFilterBar"), _dec2 = implementInterface("sap.fe.core.controllerextensions.viewState.IViewStateContributor"), _dec3 = association({
    type: "sap.fe.macros.FilterBar"
  }), _dec4 = association({
    type: "sap.fe.macros.contentSwitcher.ContentSwitcher"
  }), _dec5 = property({
    type: "string"
  }), _dec6 = property({
    type: "string"
  }), _dec7 = aggregation({
    type: "sap.fe.controls.easyFilter.EasyFilterBarContainer"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function EasyFilterBar(properties, others) {
      var _this;
      _this = _BuildingBlock.call(this, properties, others) || this;
      _initializerDefineProperty(_this, "__implements__sap_fe_core_controllerextensions_viewState_IViewStateContributor", _descriptor, _this);
      _initializerDefineProperty(_this, "filterBar", _descriptor2, _this);
      _initializerDefineProperty(_this, "contentSwitcher", _descriptor3, _this);
      _initializerDefineProperty(_this, "contentSwitcherKey", _descriptor4, _this);
      _initializerDefineProperty(_this, "contextPath", _descriptor5, _this);
      _initializerDefineProperty(_this, "content", _descriptor6, _this);
      // True when the user manually edits tokens; consumed by onAfterSearch to call setEditable(false)
      // after the flex model refresh (triggered by the token change) has already settled.
      _this.tokensDirtyByUser = false;
      /**
       * Tracks how many concurrent operations have suspended the table state
       * change handler. The handler is only reattached when the count drops
       * back to zero, which prevents one operation from prematurely resuming
       * the handler while another operation is still in progress.
       */
      _this.tableStateChangeHandlerSuspendCount = 0;
      /**
       * Flips to true on the first call to onVariantApplied
       */
      _this.isControlRendered = false;
      /**
       * Handles state changes on MDC Table controls to detect manual sort changes.
       * If the table sort was changed externally (not by the easy filter), the container
       * is notified so it can decide whether to mark the filter input as dirty.
       * @param oEvent The state change event.
       */
      _this.tableStateChangeHandler = oEvent => {
        if (!_this.content || _this.tableStateChangeHandlerSuspendCount > 0) {
          return;
        }
        const control = oEvent.getParameter("control");
        if (!control.isA("sap.ui.mdc.Table")) {
          return;
        }

        // Check that this table is associated with the same filter bar
        const tableFilterBarId = control.getFilter?.();
        if (!tableFilterBarId || tableFilterBarId !== _this.filterBar) {
          return;
        }
        _this.content.notifyExternalTableStateChange();
      };
      _this.attachTableStateChangeHandler();
      _this.getAppComponent()?.getEnvironmentCapabilities().prepareFeature("MagicFiltering").then(() => {
        _this.easyFilterPath = "ux/eng/fioriai/reuse/easyfilter/EasyFilter";
        _this.content?.setEasyFilterLib(_this.easyFilterPath);
        return;
      }).catch(error => {
        Log.debug("Error while loading EasyFilter", error);
        return undefined;
      });
      return _this;
    }
    _exports = EasyFilterBar;
    _inheritsLoose(EasyFilterBar, _BuildingBlock);
    var _proto = EasyFilterBar.prototype;
    _proto.applyLegacyState = async function applyLegacyState(getContrilState, oNavParameters, _shouldApplyDiffState, _skipMerge) {
      if (oNavParameters?.selectionVariant) {
        const selectOptionsNames = oNavParameters.selectionVariant.getSelectOptionsPropertyNames();
        this.filterBarMetadata.forEach(field => {
          if (selectOptionsNames.includes(field.name)) {
            field.defaultValue = oNavParameters.selectionVariant.getSelectOption(field.name)?.reduce((acc, option) => {
              if (option.Sign === "I") {
                if (option.Option === FilterOperator.BT || option.Option === FilterOperator.NB) {
                  if (option.High !== null && option.High !== undefined) {
                    acc.push({
                      operator: option.Option,
                      selectedValues: [option.Low, option.High]
                    });
                  }
                } else {
                  acc.push({
                    operator: option.Option,
                    selectedValues: [option.Low]
                  });
                }
              } else {
                acc.push({
                  operator: FilterOperator.NE,
                  selectedValues: [option.Low]
                });
              }
              return acc;
            }, []);
          }
        });
        this.content?.resetState(false);
      }
      return Promise.resolve(undefined);
    };
    _proto.applyState = function applyState(_state, _oNavParameters) {
      return undefined;
    };
    _proto.retrieveState = function retrieveState() {
      return {};
    };
    _proto.getApplicationId = function getApplicationId() {
      return this.getAppComponent()?.getManifestEntry("sap.app").id ?? "<unknownID>";
    };
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      this.filterBarMetadata = this.prepareFilterBarMetadata();
      this.recommendedQueries = this.getAppComponent()?.getManifestEntry("sap.fe")?.macros?.easyFilter?.recommendedQueries ?? [];
      this.content = this.createContent();
      this.content.filterBarMetadata = this.filterBarMetadata;
      const contentSwitcher = UI5Element.getElementById(this.contentSwitcher);
      contentSwitcher?.attachEvent("selectionChange", this.onContentSwitcherSelectionChange.bind(this));
      const filterBarAPI = this.getFilterBarAPI();
      filterBarAPI?.attachEvent("search", this.onAfterSearch, this);
      const vm = filterBarAPI?.getVariantManagement();
      if (vm) {
        // attachVariantApplied only registers its listener after the EasyFilterBar is in the DOM
        // (waitForControlToBeRendered, ControlVariantApplyAPI.js). On first load the EasyFilterBar is
        // hidden behind the compact filter tab, so it has no DOM ref yet — any variant switch before the
        // AI tab is first shown would be silently missed. attachSelect fires synchronously on every switch
        // regardless of DOM state, so it catches those early switches via onVariantSelected.
        vm.attachSelect(this.onVariantSelected.bind(this));
        ControlVariantApplyAPI.attachVariantApplied({
          selector: this,
          vmControlId: vm.getId(),
          callback: this.onVariantApplied.bind(this),
          callAfterInitialVariant: true
        });
      }
    };
    _proto.getFilterBarAPI = function getFilterBarAPI() {
      const filterBar = UI5Element.getElementById(this.filterBar);
      return filterBar?.getParent();
    };
    _proto.onVariantSelected = function onVariantSelected(e) {
      if (!this.isControlRendered) {
        const key = e.getParameter("key");
        if (!key) {
          return;
        }
        const filterBar = UI5Element.getElementById(this.filterBar);
        const vm = filterBar?.getParent()?.getVariantManagement();
        if (!vm) {
          return;
        }
        const variants = vm.oContext?.getObject()?.variants ?? [];
        const executeOnSelect = variants.find(v => v.key === key)?.executeOnSelect ?? false;
        this.onVariantApplied({
          executeOnSelect
        });
      }
    };
    _proto.onVariantApplied = function onVariantApplied(variant) {
      this.getFilterBarAPI()?.getVariantManagement()?.setEditable(true);
      const contentSwitcher = UI5Element.getElementById(this.contentSwitcher);
      if (contentSwitcher?.selectedKey !== "ai") {
        return;
      }
      this.isControlRendered = true;
      this.content?.clearFiltersAndTokens();
      if (variant.executeOnSelect) {
        this.content?.onGoPress(this.content.getQuery());
      }
    };
    _proto.onContentSwitcherSelectionChange = function onContentSwitcherSelectionChange() {
      const contentSwitcher = UI5Element.getElementById(this.contentSwitcher);
      const selectedKey = contentSwitcher?.$segmentedButton.current?.getSelectedKey();
      if (selectedKey !== this.contentSwitcherKey) {
        // Switching away from the AI tab — re-enable Save/Save As
        this.getFilterBarAPI()?.getVariantManagement()?.setEditable(true);
        return;
      }
      const filterBar = UI5Element.getElementById(this.filterBar);
      const filterBarAPI = this.getFilterBarAPI();
      if (!filterBar || !filterBarAPI) {
        Log.warning("ContentSwitcher selection changed to EasyFilterBar, but FilterBar or FilterBarAPI could not be found.");
        return;
      }
      if (!filterBarAPI._hasPendingFilters) {
        filterBar.fireFiltersChanged({
          conditionsBased: true
        });
      }
    }

    /**
     * Attaches a state change handler that detects manual table sort changes.
     * When the user sorts the table manually and the easy filter has sort definitions,
     * the easy filter input is greyed out (dirty state).
     */;
    _proto.attachTableStateChangeHandler = function attachTableStateChangeHandler() {
      StateUtil.detachStateChange(this.tableStateChangeHandler);
      StateUtil.attachStateChange(this.tableStateChangeHandler);
    }

    /**
     * Suspends the table state change handler to prevent false external-change
     * notifications while the easy filter itself is driving table state updates.
     * Uses reference counting so that multiple concurrent callers (for example
     * sorters and group levels applied in parallel) do not interfere with each
     * other. The handler remains attached but ignores events while suspended.
     * Must be paired with {@link resumeTableStateChangeHandler}.
     */;
    _proto.suspendTableStateChangeHandler = function suspendTableStateChangeHandler() {
      this.tableStateChangeHandlerSuspendCount++;
    }

    /**
     * Resumes the table state change handler after a programmatic table state
     * update. The decrement is deferred to the next macrotask so that any
     * pending stateChange events queued internally by MDC (via its own
     * setTimeout) are dispatched while the suspend count is still elevated
     * and therefore ignored by the handler.
     * Events are only processed again once every caller that suspended
     * it has called resume (reference count drops to zero).
     */;
    _proto.resumeTableStateChangeHandler = async function resumeTableStateChangeHandler() {
      return new Promise(resolve => {
        setTimeout(() => {
          this.tableStateChangeHandlerSuspendCount--;
          if (this.tableStateChangeHandlerSuspendCount < 0) {
            Log.error("EasyFilterBar: resumeTableStateChangeHandler called more times than suspendTableStateChangeHandler.");
            this.tableStateChangeHandlerSuspendCount = 0;
          }
          resolve();
        }, 0);
      });
    };
    _proto.destroy = function destroy(suppressInvalidate) {
      StateUtil.detachStateChange(this.tableStateChangeHandler);
      this.tableStateChangeHandlerSuspendCount = 0;
      const filterBarAPI = this.getFilterBarAPI();
      filterBarAPI?.detachEvent("search", this.onAfterSearch, this);
      const vm = filterBarAPI?.getVariantManagement();
      if (vm) {
        ControlVariantApplyAPI.detachVariantApplied({
          selector: this,
          vmControlId: vm.getId()
        });
      }
      _BuildingBlock.prototype.destroy.call(this, suppressInvalidate);
    };
    _proto.getUnitForProperty = function getUnitForProperty(prop, basePath) {
      const unitAnnotation = prop.annotations.Measures?.ISOCurrency ?? prop.annotations.Measures?.Unit;
      return isPathAnnotationExpression(unitAnnotation) ? `${basePath}/${unitAnnotation.path}` : undefined;
    };
    _proto.getDefaultValueForFilterField = function getDefaultValueForFilterField(field, startupParameters) {
      let defaultValue;
      if (startupParameters.hasOwnProperty(field.name)) {
        defaultValue = [{
          operator: FilterOperator.EQ,
          selectedValues: startupParameters[field.name]
        }];
      } else if (field.isParameter && startupParameters.hasOwnProperty(field.name.substring(2))) {
        defaultValue = [{
          operator: FilterOperator.EQ,
          selectedValues: startupParameters[field.name.substring(2)]
        }];
      }
      return defaultValue;
    };
    _proto.getEditStateFilterMetadata = function getEditStateFilterMetadata(metaModel) {
      // Assemble the code list for the editing status filter values:
      const props = new JSONModel({
        isDraftCollaborative: ModelHelper.isCollaborationDraftSupported(metaModel)
      }).createBindingContext("/");
      const editingStatusCodeList = DraftEditState.getEditStatesContext(props).getObject("/").map(state => ({
        value: state.id,
        description: state.display
      }));
      return {
        name: "$editState",
        label: this.getTranslatedText("FILTERBAR_EDITING_STATUS"),
        dataType: "Edm.String",
        filterable: true,
        codeList: editingStatusCodeList,
        type: "MenuWithSingleSelect"
      };
    };
    _proto.getTokenType = function getTokenType(prop, filterRestriction) {
      if (hasValueHelpWithFixedValues(prop)) {
        return filterRestriction === "SingleValue" ? "MenuWithSingleSelect" : "MenuWithCheckBox";
      }
      switch (prop.type) {
        case "Edm.Date":
          return "Calendar";
        case "Edm.TimeOfDay":
          return "Time";
        default:
          return "ValueHelp";
      }
    };
    _proto.getLabel = function getLabel(element) {
      const label = element.annotations.Common?.Label?.toString();
      const headerInfoTypeName = isEntityType(element) ? element.annotations.UI?.HeaderInfo?.TypeName?.valueOf() : undefined;
      const result = headerInfoTypeName || label;
      if (this.isComplexProperty(element) || isNavigationProperty(element)) {
        return result || this.getLabel(element.targetType);
      }
      return result;
    };
    _proto.isScalarProperty = function isScalarProperty(element) {
      return isProperty(element) && !isComplexType(element.targetType);
    };
    _proto.isComplexProperty = function isComplexProperty(element) {
      return isProperty(element) && isComplexType(element.targetType);
    };
    _proto.prepareFilterBarMetadata = function prepareFilterBarMetadata() {
      /*
       * 1. INITIALIZATION:
       *    - Queue all root entity properties and navigation properties for traversal
       *    - Initialize result array and elimination set for Common.Text targets
       *
       * 2. BREADTH-FIRST TRAVERSAL:
       *    For each path in queue:
       *    - Skip UI.Hidden properties
       *    - Scalar properties: Generate metadata, track Common.Text targets for elimination
       *    - Complex properties: Add child properties to queue
       *    - Navigation properties: Add target EntityType properties to queue
       *      (Collections only if explicit filter fields exist, respect depth limits)
       *
       * 3. POST-PROCESSING:
       *    - Add $editState filter for draft-enabled entities
       *    - Remove properties marked for elimination (except explicit filter fields)
       */
      const owner = this._getOwner();
      const definitionForPage = owner.preprocessorContext?.getDefinitionForPage();
      if (!definitionForPage) {
        return [];
      }
      const filterBarDef = definitionForPage.getFilterBarDefinition({});
      const metaPath = definitionForPage.getMetaPath();
      const entitySet = metaPath.getClosestEntitySet();
      let filterExpressionRestrictions = entitySet.annotations.Capabilities?.FilterRestrictions?.FilterExpressionRestrictions ?? [];
      const sortRestrictions = entitySet.annotations.Capabilities?.SortRestrictions;

      // Collect non-sortable properties from SortRestrictions
      const nonSortableProperties = new Set();

      // Check if the entity set is sortable overall
      const entitySetSortable = sortRestrictions?.Sortable !== false;

      // Add non-sortable properties from main entity set
      sortRestrictions?.NonSortableProperties?.forEach(propertyPath => {
        if (propertyPath.value) {
          nonSortableProperties.add(`/${entitySet.name}/${propertyPath.value}`);
        }
      });

      // TODO: Maybe we can simplify this by using restrictions on the main entity set only
      for (const navigationProperty in entitySet.navigationPropertyBinding) {
        if (entitySet.navigationPropertyBinding[navigationProperty]?._type === "EntitySet") {
          // FIXME: optional chaining should not be needed here -> root cause fix pending
          const navigationPropertyEntitySet = entitySet.navigationPropertyBinding[navigationProperty];
          const navPropertyFilterExpressionRestrictions = navigationPropertyEntitySet.annotations.Capabilities?.FilterRestrictions?.FilterExpressionRestrictions ?? [];
          const currentFilterRestrictions = [...filterExpressionRestrictions];
          filterExpressionRestrictions = [...filterExpressionRestrictions, ...navPropertyFilterExpressionRestrictions.filter(restriction => !currentFilterRestrictions.includes(restriction))];

          // Collect SortRestrictions from navigation property entity sets
          const navSortRestrictions = navigationPropertyEntitySet.annotations.Capabilities?.SortRestrictions;
          if (navSortRestrictions?.Sortable === false) {
            // If navigation entity set is not sortable, mark all its properties as non-sortable
            navigationPropertyEntitySet.entityType.entityProperties.forEach(prop => {
              nonSortableProperties.add(`/${entitySet.name}/${navigationProperty}/${prop.name}`);
            });
          } else {
            // Add specific non-sortable properties from navigation entity set
            navSortRestrictions?.NonSortableProperties?.forEach(propertyPath => {
              if (propertyPath.value) {
                nonSortableProperties.add(`/${entitySet.name}/${navigationProperty}/${propertyPath.value}`);
              }
            });
          }
        }
      }
      const metaModel = owner.preprocessorContext?.models.metaModel;
      const getCodeList = (lastPathSegment, propertyPath) => hasValueHelpWithFixedValues(lastPathSegment) ? async () => this.getCodeListForProperty(propertyPath) : undefined;
      const filterFields = filterBarDef.getFilterFields().filter(field => !field.getTarget()?.annotations?.UI?.HiddenFilter?.valueOf());
      const startupParameters = owner.getAppComponent().getComponentData()?.startupParameters ?? {};
      const maxDepth = 1; // Maximum depth for navigation properties

      // Initialize traversal queue with all entity properties and navigation properties.
      // Each path to traverse is a list of segments (e.g. [navProp1, complexProp1, complexProp2, scalarProp])
      const pathsToExplore = [...entitySet.entityType.entityProperties, ...entitySet.entityType.navigationProperties].map(element => [element]);

      // Resulting metadata array
      const result = [];

      // Set of property paths to be eliminated from the filter bar metadata
      const pathsToEliminate = new Set();
      const getPathLabel = path => {
        const pathLabels = path.map(e => this.getLabel(e) || `[${e.name}]`);
        return Localization.getRTL() ? pathLabels.slice().reverse().join(" - ") : pathLabels.join(" - ");
      };
      while (pathsToExplore.length > 0) {
        const currentPath = pathsToExplore.shift();
        const navigationDepth = currentPath.filter(isNavigationProperty).length;
        const lastPathSegment = currentPath[currentPath.length - 1];
        if (lastPathSegment.annotations.UI?.Hidden?.valueOf() === true) {
          continue;
        }
        const pathString = [`/${entitySet.name}`, ...currentPath.slice(0, -1).map(e => e.name)].reduce((acc, curr) => `${acc}/${curr}`);
        const propertyPath = `${pathString}/${lastPathSegment.name}`;
        if (this.isScalarProperty(lastPathSegment)) {
          // Check for Common.Text annotation and record the annotation target path for elimination
          const textAnnotation = lastPathSegment.annotations.Common?.Text;
          if (isPathAnnotationExpression(textAnnotation)) {
            // Construct the full path to the target property
            pathsToEliminate.add(`${pathString}/${textAnnotation.path}`);
          }

          // Scalar property: create metadata for the property
          const filterField = filterFields.find(field => field.getTarget() === lastPathSegment);
          const filterRestriction = filterExpressionRestrictions.find(expression => expression.Property?.$target === lastPathSegment);
          const filterable = isPathFilterable(this.getDataModelObjectPath(propertyPath));
          const filterableExpression = isConstant(filterable) ? filterable.value : true;
          const filterRestrictionExpression = filterRestriction?.AllowedExpressions;
          const codeList = getCodeList(lastPathSegment, propertyPath);

          // Determine sortability based on SortRestrictions
          const sortable = entitySetSortable && !nonSortableProperties.has(propertyPath);
          const metadata = {
            name: propertyPath,
            label: getPathLabel(currentPath),
            dataType: lastPathSegment.type,
            required: filterField?.required,
            defaultValue: filterField ? this.getDefaultValueForFilterField(filterField, startupParameters) : undefined,
            filterable: filterField ? filterableExpression : undefined,
            hiddenFilter: !filterField,
            filterRestriction: filterField ? filterRestrictionExpression : undefined,
            codeList,
            type: this.getTokenType(lastPathSegment, filterRestriction?.AllowedExpressions?.toString() || "MultiRangeOrSearchExpression"),
            unit: this.getUnitForProperty(lastPathSegment, pathString),
            sortable,
            groupable: sortable
          };
          result.push(metadata);
        } else if (this.isComplexProperty(lastPathSegment)) {
          // Complex property: add all properties and navigation properties of the complex type
          lastPathSegment.targetType.properties.forEach(child => {
            pathsToExplore.push([...currentPath, child]);
          });

          // only traverse navigation properties if we are not at the maximum depth
          if (navigationDepth < maxDepth) {
            lastPathSegment.targetType.navigationProperties.forEach(child => {
              pathsToExplore.push([...currentPath, child]);
            });
          }
        } else if (isNavigationProperty(lastPathSegment)) {
          // add 1:n navigation properties only if there are filter fields for at least one of the target properties
          if (lastPathSegment.isCollection && !filterFields.some(field => field.annotationPath?.startsWith(propertyPath))) {
            continue;
          }
          lastPathSegment.targetType.entityProperties.forEach(child => {
            pathsToExplore.push([...currentPath, child]);
          });

          // only traverse navigation properties if we are not at the maximum depth
          if (navigationDepth < maxDepth) {
            lastPathSegment.targetType.navigationProperties.forEach(child => {
              pathsToExplore.push([...currentPath, child]);
            });
          }
        }
      }

      // [Editing Status]
      if (ModelHelper.isMetaPathDraftSupported(definitionForPage.getMetaPath())) {
        result.push(this.getEditStateFilterMetadata(metaModel));
      }

      // Remove properties marked for elimination (unless they are filter fields)
      return result.filter(metadata => {
        return !metadata.hiddenFilter ||
        // Keep if explicit filter field
        !pathsToEliminate.has(metadata.name) // Keep if path not marked for elimination
        ;
      });
    };
    _proto.getCodeListForProperty = async function getCodeListForProperty(propertyPath) {
      const defaultValueList = await this.getValueList(propertyPath);
      if (!defaultValueList) {
        return [];
      }
      const valueListInfo = defaultValueList.valueListInfo;
      const listBinding = valueListInfo.$model.bindList(`/${valueListInfo.CollectionPath}`, undefined, undefined, undefined, {
        $select: generateSelectParameter(defaultValueList)
      });
      const data = await listBinding.requestContexts();
      const filterGroupValues = data.map(mapValueListToCodeList(defaultValueList));
      const codeListProperty = this.filterBarMetadata.find(field => field.name === propertyPath);
      if (codeListProperty) {
        codeListProperty.codeList = filterGroupValues;
      }
      return filterGroupValues;
    };
    _proto.resolveTokenValuesForField = async function resolveTokenValuesForField(fieldName, values) {
      const field = this.filterBarMetadata.find(_ref => {
        let {
          name
        } = _ref;
        return name === fieldName;
      });
      let result;
      if (!field) {
        // return original values converted to the expected format if no field is defined
        return unresolvedResult(values);
      }
      const valueList = await this.getValueList(field.name);
      if (valueList && ValueListHelper.isValueListSearchable(field.name, valueList)) {
        const resolvedTokenValues = await Promise.all(values.map(async value => resolveTokenValue(valueList, value)));
        result = resolvedTokenValues.flat();
      } else {
        result = unresolvedResult(values);
      }

      // if no maxLength is defined, return unfiltered result
      return result;
    };
    _proto.getValueList = async function getValueList(fieldName) {
      const metaModel = this.getMetaModel();
      const valueLists = await ValueListHelper.getValueListInfo(undefined, fieldName, undefined, metaModel);
      return valueLists[0];
    };
    _proto.onTokensChanged = async function onTokensChanged(e) {
      const filterBar = UI5Element.getElementById(this.filterBar);
      // If reset=true, turn on dirty state (gray overlay) without triggering search
      if (e.getParameter("reset")) {
        filterBar.fireFiltersChanged({
          conditionsBased: true
        });
        return;
      }
      const filterBarAPI = filterBar.getParent();
      const tokens = e.getParameter("tokens");
      const clearEditFilter = tokens.some(tokenDefinition => tokenDefinition.key === "$editState");
      await filterBarAPI._clearFilterValuesWithOptions(filterBar, {
        clearEditFilter
      });
      this.formateDataTypes(tokens);
      for (const token of tokens) {
        if (token.key === "$editState") {
          // convert the $editState filter condition
          for (const tokenKeySpecification of token.keySpecificSelectedValues) {
            await FilterUtils.addFilterValues(filterBarAPI.content, token.key, "DRAFT_EDIT_STATE", tokenKeySpecification.selectedValues);
          }
        } else {
          const field = this.filterBarMetadata.find(f => f.name === token.key);
          for (const tokenKeySpecification of token.keySpecificSelectedValues) {
            const {
              operator,
              selectedValues
            } = tokenKeySpecification;
            if (operator === FilterOperator.NB) {
              await FilterUtils.addFilterValues(filterBarAPI.content, field.name, OperatorName.NOTBT, selectedValues);
            } else {
              await FilterUtils.addFilterValues(filterBarAPI.content, field.name, operator, selectedValues);
            }
          }
        }
      }
      this.fireTelemetryEvent(tokens.length);
      await filterBarAPI.triggerSearch();
    };
    _proto.onTokensChangedByUser = function onTokensChangedByUser() {
      // setEditable(false) cannot be called here directly: showFooter on the inner sap.m VM is
      // one-way bound to variantsEditable in the VariantModel, so the flex write triggered by
      // onTokensChanged → triggerSearch → ControlPersonalizationWriteAPI.add causes a
      // VariantModel.refresh() that re-pushes variantsEditable=true and overwrites the call.
      // We defer to onAfterSearch, which runs after that refresh has settled.
      // NOTE: replace with vm.setCreationAllowed(false) once sap.ui.fl exposes it on the wrapper.
      this.tokensDirtyByUser = true;
    };
    _proto.onAfterSearch = function onAfterSearch() {
      if (this.tokensDirtyByUser) {
        this.tokensDirtyByUser = false;
        this.getFilterBarAPI()?.getVariantManagement()?.setEditable(false);
      }
    };
    _proto.fireTelemetryEvent = function fireTelemetryEvent(countFilterTokens) {
      const queryText = this.content?.getQuery?.()?.trim() ?? "";
      const telemetryEvent = {
        type: "FE.EasyFilter",
        parameters: {
          countFilterTokens,
          countQueryWords: queryText === "" ? 0 : queryText.split(/\s+/).length
        }
      };
      this.getAppComponent()?.getTelemetryService()?.storeAction(telemetryEvent);
    }

    /**
     * Handles the sortersChanged event from the EasyFilterBarContainer.
     * @param e The sortersChanged event containing sort definitions.
     */;
    _proto.onSortersChanged = async function onSortersChanged(e) {
      const sorters = e.getParameter("sorters");
      try {
        const filterBar = UI5Element.getElementById(this.filterBar);
        if (!filterBar) {
          Log.error("EasyFilterBar.onSortersChanged: FilterBar not found.", this.filterBar);
          return;
        }
        const filterBarAPI = filterBar.getParent();
        if (!filterBarAPI) {
          Log.error("EasyFilterBar.onSortersChanged: FilterBarAPI not found.");
          return;
        }
        this.suspendTableStateChangeHandler();
        try {
          if (!sorters || sorters.length === 0) {
            await FilterUtils.clearSortersFromTable(filterBarAPI.content);
          } else {
            await FilterUtils.applySortersToTable(filterBarAPI.content, sorters);
          }
        } finally {
          await this.resumeTableStateChangeHandler();
        }
      } catch (error) {
        Log.error("EasyFilterBar.onSortersChanged: Failed to apply sorters.", error);
      }
    }

    /**
     * Handles the groupLevelsChanged event fired by EasyFilterBarContainer.
     * Applies the group levels directly to all MDC tables without using tokens.
     * @param e The event carrying the groupLevels from the AI result
     */;
    _proto.onGroupLevelsChanged = async function onGroupLevelsChanged(e) {
      try {
        const groupLevels = e.getParameter("groupLevels");
        await this.applyGroupToTables(groupLevels);
      } catch (error) {
        Log.warning("EasyFilterBar: unexpected error while handling groupLevelsChanged", String(error));
      }
    }

    /**
     * Applies group levels to all MDC tables on the page.
     * Normalizes OData paths, for example "/SalesOrderManage/SoldToParty" → "SoldToParty") and
     * prefixes with "Property::" when the table's propertyInfos require it.
     * @param groupLevels
     */;
    _proto.applyGroupToTables = async function applyGroupToTables(groupLevels) {
      const pageController = this.getPageController();
      const tableControls = pageController?._getControls?.("table") ?? [];
      this.suspendTableStateChangeHandler();
      try {
        await Promise.all(tableControls.map(async tableControl => {
          try {
            const tableAPI = tableControl.getParent();
            const propertyInfoNames = tableAPI.getEnhancedFetchedPropertyInfos().map(p => p.key);
            // Strips OData path segments (via EasyFilterUtils.resolvePropertyName) then applies
            // the "Property::" prefix convention used by some MDC table implementations.
            const getTablePropertyKey = name => {
              const plainName = EasyFilterUtils.resolvePropertyName(name);
              return propertyInfoNames.includes(`Property::${plainName}`) ? `Property::${plainName}` : plainName;
            };

            // Retrieve existing group state and mark all previous groups as ungrouped
            // to ensure a full replacement rather than a merge.
            const currentState = await StateUtil.retrieveExternalState(tableControl);
            const resetGroupLevels = (currentState.groupLevels ?? []).map(g => ({
              key: g.key,
              grouped: false
            }));
            const newGroupLevels = groupLevels.map(g => ({
              key: getTablePropertyKey(g.key)
            }));
            await StateUtil.applyExternalState(tableControl, {
              groupLevels: [...resetGroupLevels, ...newGroupLevels]
            });
          } catch (error) {
            Log.warning("EasyFilterBar: failed to apply group state to table", String(error));
          }
        }));
      } finally {
        await this.resumeTableStateChangeHandler();
      }
    }

    //We need the below function so that the date objects and dateTimeOffsets would be converted to string type as the date object is not a valid type in V4 world
    ;
    _proto.formateDataTypes = function formateDataTypes(tokens) {
      const dateTimeOffsetType = new DateTimeOffset(undefined, {
        V4: true
      });
      // UTC: true avoids off-by-one in negative-offset zones; pattern locks the V4 wire format.
      const dateFormatter = DateFormat.getDateInstance({
        UTC: true,
        pattern: "yyyy-MM-dd"
      });
      const timeFormatter = DateFormat.getTimeInstance({
        UTC: true,
        pattern: "HH:mm:ss"
      });
      tokens.forEach(token => {
        const edmType = this.filterBarMetadata.find(data => data.name === token.key)?.dataType;
        if (edmType !== "Edm.Date" && edmType !== "Edm.TimeOfDay" && edmType !== "Edm.DateTimeOffset") {
          return;
        }
        token.keySpecificSelectedValues.forEach(keySpecificSelectedValue => {
          keySpecificSelectedValue.selectedValues.forEach((value, idx) => {
            if (!(value instanceof Date)) {
              return;
            }
            switch (edmType) {
              case "Edm.Date":
                keySpecificSelectedValue.selectedValues[idx] = dateFormatter.format(value);
                break;
              case "Edm.TimeOfDay":
                keySpecificSelectedValue.selectedValues[idx] = timeFormatter.format(value);
                break;
              case "Edm.DateTimeOffset":
                keySpecificSelectedValue.selectedValues[idx] = dateTimeOffsetType.parseValue(value, "object");
                break;
              default:
                break;
            }
          });
        });
      });
    };
    _proto.showValueHelpForKey = async function showValueHelpForKey(key) {
      const field = this.filterBarMetadata.find(f => f.name === key);
      const filterBar = UI5Element.getElementById(this.filterBar);
      const filterBarAPI = filterBar.getParent();
      await filterBarAPI.showFilterField(field.name);
      return filterBarAPI.openValueHelpForFilterField(field.name);
    }

    /**
     * Updates sorting and grouping support based on associated table personalization settings.
     */;
    _proto.updatePersonalizationSupport = function updatePersonalizationSupport() {
      const pageController = this.getPageController();
      const tableControls = pageController?._getControls?.("table") ?? [];
      if (tableControls.length === 0) {
        // No tables detected — default to supported to avoid false warnings.
        this.content?.setPersonalizationSupport(true, true);
        return;
      }
      let supportsSorting = false;
      let supportsGrouping = false;

      // A capability is considered supported if at least one table has it in its P13n mode.
      for (const table of tableControls) {
        const p13nMode = table.getP13nMode?.() ?? [];
        if (p13nMode.includes("Sort")) {
          supportsSorting = true;
        }
        if (p13nMode.includes("Group")) {
          supportsGrouping = true;
        }
        if (supportsSorting && supportsGrouping) {
          break;
        }
      }
      this.content?.setPersonalizationSupport(supportsSorting, supportsGrouping);
    };
    _proto.registerQueryPersonalizationChange = function registerQueryPersonalizationChange(query) {
      ControlPersonalizationWriteAPI.add({
        changes: [{
          selectorElement: this,
          changeSpecificData: {
            changeType: "easyFilterState",
            content: {
              query
            }
          }
        }]
      });
    };
    _proto.onBeforeQueryProcessing = function onBeforeQueryProcessing() {
      const uiModel = this.getModel("ui");
      BusyLocker.lock(uiModel);
      this.updatePersonalizationSupport();
      // Favorites/recent selections bypass liveChange and go directly to onGoPress — this is the single convergence point for all submission paths.
      clearTimeout(this.liveChangeDebounceTimer);
      this.registerQueryPersonalizationChange(this.content?.getQuery() ?? "");
      this.getFilterBarAPI()?.getVariantManagement()?.setEditable(true);
    };
    _proto.onAfterQueryProcessing = function onAfterQueryProcessing() {
      const uiModel = this.getModel("ui");
      BusyLocker.unlock(uiModel);
    };
    _proto.onQueryChanged = function onQueryChanged() {
      const filterBar = UI5Element.getElementById(this.filterBar);
      filterBar.fireFiltersChanged({
        conditionsBased: true
      });
    }

    /**
     * Handles live changes to the search query input and registers them as a pending personalization change.
     * Debounced to avoid registering one change per keystroke, which would cause excessive revert steps.
     * @param e The UI5 event carrying the updated query string.
     */;
    _proto.onLiveChange = function onLiveChange(e) {
      const query = e.getParameter("query");
      clearTimeout(this.liveChangeDebounceTimer);
      this.liveChangeDebounceTimer = window.setTimeout(() => {
        this.registerQueryPersonalizationChange(query);
      }, 300);
    };
    _proto.handleShowValueHelp = async function handleShowValueHelp(event) {
      const key = event.getParameter("key");
      const resolve = event.getParameter("resolve");
      const reject = event.getParameter("reject");
      try {
        const conditions = await this.showValueHelpForKey(key);
        const selectedValues = conditions.map(async condition => {
          const operator = condition.operator;
          if (condition.validated === "NotValidated") {
            // not validated: the condition only has values without description - try to get the description using the data fetcher mechanism.
            // `condition.values` is a single value `[value]` (or `[lower bound, upper bound]` for BT/NB operators).
            const conditionToResolve = operator === FilterOperator.BT || operator === FilterOperator.NB ? {
              operator,
              selectedValues: [condition.values[0], condition.values[1]]
            } : {
              operator,
              selectedValues: [condition.values[0]]
            };
            return this.resolveTokenValuesForField(key, [conditionToResolve]);
          } else if (operator !== FilterOperator.BT && operator !== FilterOperator.NB) {
            // validated: both value and description are available - directly map them to the result
            // `condition.values` is a tuple of `[value, description?]`
            const [value, description] = condition.values;
            return Promise.resolve([{
              operator,
              selectedValues: [{
                value,
                description: description ?? value
              }]
            }]);
          } else {
            // should not occur: BT/NB are expected to be "NotValidated" conditions
            Log.warning(`Unexpected condition for field ${key}: operator ${operator} with values ${condition.values}.`);
            return Promise.resolve([]);
          }
        });
        const resolvedValues = await Promise.all(selectedValues);
        resolve(resolvedValues.flat());
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    };
    _proto.createContent = function createContent() {
      return _jsx(EasyFilterBarContainer, {
        contextPath: this.getOwnerContextPath(),
        appId: this.getApplicationId(),
        filterBarMetadata: this.filterBarMetadata,
        easyFilterLib: this.easyFilterPath,
        showValueHelp: this.handleShowValueHelp.bind(this),
        dataFetcher: this.resolveTokenValuesForField.bind(this),
        recommendedValues: this.recommendedQueries,
        queryChanged: this.onQueryChanged.bind(this),
        tokensChanged: this.onTokensChanged.bind(this),
        tokensChangedByUser: this.onTokensChangedByUser.bind(this),
        sortersChanged: this.onSortersChanged.bind(this),
        groupLevelsChanged: this.onGroupLevelsChanged.bind(this),
        beforeQueryProcessing: this.onBeforeQueryProcessing.bind(this),
        afterQueryProcessing: this.onAfterQueryProcessing.bind(this),
        liveChange: this.onLiveChange.bind(this)
      });
    };
    return EasyFilterBar;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_fe_core_controllerextensions_viewState_IViewStateContributor", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "filterBar", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "contentSwitcher", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "contentSwitcherKey", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "content", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = EasyFilterBar;
  return _exports;
}, false);
//# sourceMappingURL=EasyFilterBar-dbg.js.map
