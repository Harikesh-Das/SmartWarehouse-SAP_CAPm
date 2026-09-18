/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/controls/AINotice", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/controllerextensions/collaboration/CollaborationCommon", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/templating/PropertyHelper", "sap/fe/macros/ai/EasyFillLayoutMode", "sap/fe/macros/ai/EasyFillTableHelper", "sap/fe/macros/ai/EasyFilterDataFetcher", "sap/fe/macros/ai/PXFeedback", "sap/fe/macros/ai/easyfill/FieldFormBuilder", "sap/fe/macros/ai/easyfill/FieldHelper", "sap/fe/macros/ai/easyfill/ObjectPageHelper", "sap/fe/macros/ai/easyfill/ReviewAreaBuilder", "sap/fe/macros/ai/easyfill/TableViewBuilder", "sap/fe/macros/internal/valuehelp/ValueListHelper", "sap/m/Button", "sap/m/Dialog", "sap/m/FlexBox", "sap/m/FlexItemData", "sap/m/FormattedText", "sap/m/GenericTag", "sap/m/HBox", "sap/m/IllustratedMessage", "sap/m/IllustratedMessageSize", "sap/m/IllustratedMessageType", "sap/m/MessageStrip", "sap/m/MessageToast", "sap/m/OverflowToolbar", "sap/m/ScrollContainer", "sap/m/SegmentedButton", "sap/m/SegmentedButtonItem", "sap/m/Text", "sap/m/TextArea", "sap/m/Title", "sap/m/ToggleButton", "sap/m/ToolbarSpacer", "sap/m/VBox", "sap/m/library", "sap/ui/core/Element", "sap/ui/core/InvisibleText", "sap/ui/core/Lib", "sap/ui/core/library", "sap/ui/layout/PaneContainer", "sap/ui/layout/ResponsiveSplitter", "sap/ui/layout/SplitPane", "sap/ui/layout/SplitterLayoutData", "sap/ui/model/FilterOperator", "sap/ui/performance/trace/FESRHelper", "sap/uxap/ObjectPageDynamicHeaderTitle", "sap/uxap/ObjectPageLayout", "sap/uxap/ObjectPageSection", "sap/uxap/ObjectPageSubSection", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (Log, BindingToolkit, ClassSupport, AINotice, BuildingBlock, CollaborationCommon, MetaModelConverter, PropertyHelper, $EasyFillLayoutMode, EasyFillTableHelper, EasyFilterDataFetcher, PXFeedback, EasyFillFieldFormBuilder, EasyFillFieldHelper, EasyFillObjectPageHelper, EasyFillReviewAreaBuilder, EasyFillTableViewBuilder, ValueListHelper, Button, Dialog, FlexBox, FlexItemData, FormattedText, GenericTag, HBox, IllustratedMessage, IllustratedMessageSize, IllustratedMessageType, MessageStrip, MessageToast, OverflowToolbar, ScrollContainer, SegmentedButton, SegmentedButtonItem, Text, TextArea, Title, ToggleButton, ToolbarSpacer, VBox, library, Element, InvisibleText, Lib, coreLibrary, PaneContainer, ResponsiveSplitter, SplitPane, SplitterLayoutData, FilterOperator, FESRHelper, ObjectPageDynamicHeaderTitle, ObjectPageLayout, ObjectPageSection, ObjectPageSubSection, _jsx, _jsxs) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _EasyFillDialog;
  function __ui5_require_async(path) {
    return new Promise((resolve, reject) => {
      sap.ui.require([path], module => {
        if (!(module && module.__esModule)) {
          module = module === null || !(typeof module === "object" && path.endsWith("/library")) ? {
            default: module
          } : module;
          Object.defineProperty(module, "__esModule", {
            value: true
          });
        }
        resolve(module);
      }, err => {
        reject(err);
      });
    });
  }
  var _exports = {};
  var ValueState = coreLibrary.ValueState;
  var TitleLevel = coreLibrary.TitleLevel;
  var PlacementType = library.PlacementType;
  var FlexWrap = library.FlexWrap;
  var FlexDirection = library.FlexDirection;
  var ButtonType = library.ButtonType;
  var triggerPXIntegration = PXFeedback.triggerPXIntegration;
  var resolveTokenValue = EasyFilterDataFetcher.resolveTokenValue;
  var isGridSourceTable = EasyFillTableHelper.isGridSourceTable;
  var getTables = EasyFillTableHelper.getTables;
  var fetchTableData = EasyFillTableHelper.fetchTableData;
  var EasyFillLayoutMode = $EasyFillLayoutMode.EasyFillLayoutMode;
  var isImmutable = PropertyHelper.isImmutable;
  var isComputed = PropertyHelper.isComputed;
  var getLabel = PropertyHelper.getLabel;
  var CollaborationUtils = CollaborationCommon.CollaborationUtils;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var defineReference = ClassSupport.defineReference;
  var createReference = ClassSupport.createReference;
  var not = BindingToolkit.not;
  var isEmpty = BindingToolkit.isEmpty;
  var equal = BindingToolkit.equal;
  var and = BindingToolkit.and;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  const MAX_LENGTH = 2000;
  const INNER_CONTROL_RENDER_DELAY_MS = 200;
  // MDC composite fields (amount + unit) render two inputs. The unit input gets the suffix "-inner-unit". This is an internal MDC convention — verify it still holds after UI5 upgrades.
  const UNIT_INPUT_ID_SUFFIX = "-inner-unit";
  const UI5_ANNOTATION_PREFIX = "@$";

  /** Internal rendering flags for a table - not sent to the LLM. Keyed by navPropertyName. */

  /** Co-located LLM entry and rendering flags for a single table field. */
  let EasyFillDialog = (_dec = defineUI5Class("sap.fe.macros.ai.EasyFillDialog"), _dec2 = defineReference(), _dec3 = defineReference(), _dec4 = defineReference(), _dec5 = property({
    type: "function"
  }), _dec(_class = (_class2 = (_EasyFillDialog = /*#__PURE__*/function (_BuildingBlock) {
    function EasyFillDialog(idOrProps, props) {
      var _this;
      _this = _BuildingBlock.call(this, idOrProps, props) || this;
      _initializerDefineProperty(_this, "$reviewArea", _descriptor, _this);
      _initializerDefineProperty(_this, "$scrollContainer", _descriptor2, _this);
      _initializerDefineProperty(_this, "$responsiveSplitter", _descriptor3, _this);
      _initializerDefineProperty(_this, "getEditableFields", _descriptor4, _this);
      _this._tableData = new Map();
      _this._pendingNewRowContexts = new Map();
      _this._hasIncorrectFields = false;
      _this._hasIncorrectTableFields = false;
      // Transient contexts for existing rows that the AI proposes to update.
      // Key: navigationPropertyName, Value: map of rowIndex -> transient V4Context
      _this._pendingUpdatedRowContexts = new Map();
      _this._existingRowContexts = new Map();
      _this._tableReferences = new Map();
      /** Cached table preview VBoxes keyed by navPropertyName. Survive layout switches. */
      _this._renderedTablePreviews = new Map();
      return _this;
    }
    _exports = EasyFillDialog;
    _inheritsLoose(EasyFillDialog, _BuildingBlock);
    var _proto = EasyFillDialog.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable(_ownerComponent) {
      _BuildingBlock.prototype.onMetadataAvailable.call(this, _ownerComponent);
      this.state.newValues = {};
      this.state.selectedLayoutMode = EasyFillLayoutMode.CONDENSED;
      this.state.hasValues = false;
      this.state.hasError = false;
      this._hasIncorrectFields = false;
      this._hasIncorrectTableFields = false;
      this.state.warningMessageText = "";
      this.state.stateType = "Initial";
      this.state.tableViewModes = {};
      this.state.attemptToAddMultipleRowsPerTable = false;
      this.content = this.createContent();
    };
    _proto.onConfirm = async function onConfirm(_e) {
      triggerPXIntegration("confirm");
      // Validate the data handling
      const view = this.getPageController().getView();
      const mainPageBindingContext = view?.getBindingContext();
      const allProps = [];
      const newValues = this._bindingContext?.getObject() ?? this.state.newValues;
      const odataModel = this.getModel();
      for (const newValuesKey in newValues) {
        if (newValuesKey !== "__bindingInfo" && !newValuesKey.startsWith(UI5_ANNOTATION_PREFIX)) {
          if (typeof newValues[newValuesKey] !== "object") {
            mainPageBindingContext.setProperty(newValuesKey, newValues[newValuesKey]);
            allProps.push(this.applyUpdatesForChange(view, mainPageBindingContext.getPath(newValuesKey)));
          }
        }
      }

      // Apply AI-proposed changes to updated existing table rows
      const rowUpdatePromises = [];
      const sideEffectTargets = [];
      this._pendingUpdatedRowContexts.forEach((rowContextMap, navPropertyName) => {
        const existingContexts = this._existingRowContexts.get(navPropertyName) ?? [];
        rowContextMap.forEach((transientContext, rowIdx) => {
          const realContext = existingContexts[rowIdx];
          if (realContext === undefined) return;
          const transientData = transientContext.getObject();
          if (!transientData) return;
          for (const propName in transientData) {
            if (!propName.startsWith(UI5_ANNOTATION_PREFIX) && propName !== "__bindingInfo") {
              const newValue = transientData[propName];
              if (typeof newValue === "object" || newValue === null) continue;
              const hasChanged = realContext.getProperty(propName) !== newValue;
              if (hasChanged) {
                rowUpdatePromises.push(realContext.setProperty(propName, newValue, "easyFillConfirm"));
                sideEffectTargets.push({
                  path: `${realContext.getPath()}/${propName}`,
                  context: realContext
                });
              }
            }
          }
        });
      });
      if (rowUpdatePromises.length > 0) {
        odataModel.submitBatch("easyFillConfirm");
        await Promise.all(rowUpdatePromises);
        for (const {
          path,
          context
        } of sideEffectTargets) {
          allProps.push(this.applyUpdatesForChange(view, path, context));
        }
      }

      // Create AI-proposed new rows by activating their transient contexts
      const newRowActivations = [];
      this._pendingNewRowContexts.forEach((newContexts, navPropertyName) => {
        if (this._tableData.get(navPropertyName)?.flags.allowsCreation !== true) {
          return;
        }
        newContexts.forEach(transientContext => {
          const activation = (async () => {
            try {
              await transientContext.created();
            } catch (err) {
              Log.error("Failed to activate new row context:", err);
            }
          })();
          newRowActivations.push(activation);
        });
      });

      // Discard staging contexts used for existing-row display, they must never be posted.
      odataModel.resetChanges("easyFillStaging");
      // Discard the direct-field staging context - values already applied to the real entity above.
      odataModel.resetChanges("easyFillDirectFields")?.catch(() => {
        /* expected cancellation */
      });
      // Submit the new-row batch so the created() promises can resolve.
      if (newRowActivations.length > 0) {
        odataModel.submitBatch("submitLater");
      }
      await Promise.all(newRowActivations);
      try {
        await Promise.all(allProps);
        mainPageBindingContext.refresh();
      } catch (err) {
        Log.error("Failed to update data after change:", err);
      } finally {
        this.content?.close();
      }
    };
    _proto.applyUpdatesForChange = async function applyUpdatesForChange(view, propertyPathForUpdate, context) {
      const metaModel = view.getModel().getMetaModel();
      const metaContext = metaModel.getMetaContext(propertyPathForUpdate);
      const dataModelObject = MetaModelConverter.getInvolvedDataModelObjects(metaContext);
      const targetContext = context ?? view.getBindingContext();
      try {
        const sideEffectsPromises = [];
        const sideEffectsService = CollaborationUtils.getAppComponent(view).getSideEffectsService();

        // We have a target context, so we can retrieve the updated property
        const targetMetaPath = metaModel.getMetaPath(targetContext.getPath());
        const relativeMetaPathForUpdate = metaModel.getMetaPath(propertyPathForUpdate).replace(targetMetaPath, "").slice(1);
        sideEffectsPromises.push(sideEffectsService.requestSideEffects([relativeMetaPathForUpdate], targetContext, "$auto"));

        // Get the fieldGroupIds corresponding to pathForUpdate
        const fieldGroupIds = sideEffectsService.computeFieldGroupIds(dataModelObject.targetEntityType.fullyQualifiedName, dataModelObject.targetObject.fullyQualifiedName);

        // Execute the side effects for the fieldGroupIds
        if (fieldGroupIds.length) {
          const pageController = view.getController();
          const sideEffectsMapForFieldGroup = pageController.sideEffects.getSideEffectsMapForFieldGroups(fieldGroupIds, targetContext);
          Object.keys(sideEffectsMapForFieldGroup).forEach(sideEffectName => {
            const sideEffect = sideEffectsMapForFieldGroup[sideEffectName];
            sideEffectsPromises.push(pageController.sideEffects.requestSideEffects(sideEffect.sideEffects, sideEffect.context, "$auto", undefined, true));
          });
        }
        await Promise.all(sideEffectsPromises);
      } catch (err) {
        Log.error("Failed to update data after change:", err);
        throw err;
      }
    };
    _proto.onCancel = function onCancel() {
      triggerPXIntegration("cancel");
      this.discardPendingContexts();
      this.content?.close();
    };
    _proto.discardPendingContexts = function discardPendingContexts() {
      this._bindingContext?.created()?.catch(() => {
        /* expected cancellation when re-running easy edit */
      });
      this._pendingUpdatedRowContexts.forEach(rowContextMap => {
        rowContextMap.forEach(ctx => {
          ctx.created()?.catch(() => {
            /* expected cancellation */
          });
        });
      });
      this._pendingNewRowContexts.forEach(contexts => {
        contexts.forEach(ctx => {
          ctx.created()?.catch(() => {
            /* expected cancellation */
          });
        });
      });
      const odataModel = this.getModel();
      if (odataModel) {
        odataModel.resetChanges("submitLater")?.catch(() => {
          /* expected cancellation */
        });
        odataModel.resetChanges("easyFillStaging")?.catch(() => {
          /* expected cancellation */
        });
        odataModel.resetChanges("easyFillDirectFields")?.catch(() => {
          /* expected cancellation */
        });
      }
      this._pendingUpdatedRowContexts.clear();
      this._pendingNewRowContexts.clear();
      this._renderedTablePreviews.forEach(_ref => {
        let {
          vbox
        } = _ref;
        vbox.destroy();
      });
      this._renderedTablePreviews.clear();
    };
    _proto.open = function open() {
      this.content?.open();
    }

    /**
     * Builds AI field metadata mapping from the current page definition.
     * @param definitionPage Current page definition.
     * @returns Field metadata.
     */;
    _proto._getFieldMapping = function _getFieldMapping(definitionPage) {
      const fieldMapping = {};
      if (definitionPage) {
        const pageTarget = definitionPage.getMetaPath().getTarget();
        let entityType;
        switch (pageTarget._type) {
          case "EntitySet":
          case "Singleton":
            entityType = pageTarget.entityType;
            break;
          case "NavigationProperty":
            entityType = pageTarget.targetType;
            break;
        }
        if (entityType !== undefined) {
          this.processDirectEntityProperties(entityType.entityProperties, fieldMapping);
          this.processTables(entityType);
          this._tableData.forEach((data, navProp) => {
            fieldMapping[navProp] = data.llmEntry;
          });
        }
      }
      return fieldMapping;
    }

    /* Process direct properties of the entity (non-navigation) and add to field mapping if they are not immutable, computed, hidden, or complex types. */;
    _proto.processDirectEntityProperties = function processDirectEntityProperties(simpleObjects, fieldMapping) {
      for (const entityProperty of simpleObjects) {
        if (isImmutable(entityProperty) || isComputed(entityProperty)) {
          fieldMapping[entityProperty.name] = {
            description: getLabel(entityProperty) ?? entityProperty.name,
            dataType: entityProperty.type,
            section: this.getTranslatedText("C_EASYEDIT_INCORRECT_FIELDS")
          };
        } else if (entityProperty.annotations.UI?.Hidden?.valueOf() !== true && !entityProperty.targetType) {
          const objectPageLayout = this.getCurrentObjectPageLayout();
          const section = EasyFillObjectPageHelper.getSectionForField(objectPageLayout, entityProperty.name);
          const sectionForField = section?.getTitle() ?? EasyFillObjectPageHelper.getOneExistingSectionTitleOrEmpty(objectPageLayout);
          const sectionSubsection = section ? EasyFillObjectPageHelper.tryGetSectionSubsectionTitleForField(section, entityProperty.name) : undefined;
          const fieldSubsection = section ? EasyFillObjectPageHelper.tryGetSubsectionTitleForField(section, entityProperty.name) : undefined;
          fieldMapping[entityProperty.name] = {
            description: getLabel(entityProperty) ?? entityProperty.name,
            dataType: entityProperty.type,
            section: sectionForField,
            sectionSubsection: sectionSubsection,
            fieldSubsection: fieldSubsection
          };
        }
      }
    }

    /*
     * Append visible tables to _tableData, separating LLM-facing entry from internal rendering flags.
     * The LLM entry contains only description and dataType per property; flags track isAuxiliary,
     * isComputed, isImmutable, and allowsCreation for use during preview rendering.
     */;
    _proto.processTables = function processTables(parentEntityType) {
      this._tableData.clear();
      this._existingRowContexts.clear();
      this._tableReferences.clear();
      const view = this.getPageController().getView();
      const renderedMDCTables = getTables(view, "sap.ui.mdc.Table");
      for (const table of renderedMDCTables) {
        const innerTableType = table.getType();
        const isSupportedTableType = (innerTableType?.isA?.("sap.ui.mdc.table.ResponsiveTableType") ?? false) || (innerTableType?.isA?.("sap.ui.mdc.table.GridTableType") ?? false);
        if (!isSupportedTableType) {
          Log.info(`EasyFill: skipping table ${table.getId()} - unsupported inner table type`);
          continue;
        }
        const navPropertyName = table.getRowBinding()?.getPath();
        if (!navPropertyName) {
          continue;
        }
        const {
          itemProperties,
          currentItems,
          currentContexts
        } = fetchTableData(table, navPropertyName);
        if (Object.keys(itemProperties).length > 0) {
          const navProperty = parentEntityType.navigationProperties.find(np => np.name === navPropertyName);
          const subEntityProps = navProperty?.targetType.entityProperties ?? [];
          const properties = {};
          const llmItemProperties = {};
          for (const [key, val] of Object.entries(itemProperties)) {
            const prop = subEntityProps.find(p => p.name === key);
            properties[key] = {
              isAuxiliary: val.isAuxiliary === true,
              isComputed: prop !== undefined && isComputed(prop),
              isImmutable: prop !== undefined && isImmutable(prop),
              groupKey: val.groupKey,
              groupLabel: val.groupLabel
            };
            llmItemProperties[key] = {
              description: val.description,
              dataType: val.dataType
            };
          }
          const tableHeader = table.getHeader();
          const tableSectionTitle = EasyFillObjectPageHelper.findSectionTitleForTable(table) ?? tableHeader;
          this._existingRowContexts.set(navPropertyName, currentContexts);
          this._tableReferences.set(navPropertyName, table);
          this._tableData.set(navPropertyName, {
            llmEntry: {
              description: `${tableHeader}`,
              dataType: "Collection",
              isCollection: true,
              itemProperties: llmItemProperties,
              currentItems,
              section: tableSectionTitle
            },
            flags: {
              allowsCreation: this.resolveTableAllowsCreation(table),
              properties
            }
          });
        }
      }
    }

    /**
     * Determines whether new rows can be created for a given table.
     * @param table The MDC table to check.
     * @returns True if the table supports inline creation and the Create action is enabled.
     */;
    _proto.resolveTableAllowsCreation = function resolveTableAllowsCreation(table) {
      const tableParent = table.getParent();
      const isTableInlineCreatable = tableParent?.creationMode?.name === "Inline";
      const isTableInlineRowCreatable = tableParent?.creationMode?.name === "InlineCreationRows";
      const createButton = tableParent?.findElements(true).find(el => el.isA("sap.m.Button") && el.getId().endsWith("StandardAction::Create"));
      const isCreateActionEnabled = createButton?.getEnabled?.() === true;
      const allowsCreation = isTableInlineRowCreatable || isTableInlineCreatable && isCreateActionEnabled;
      if (allowsCreation) {
        Log.info(`Table ${table.getId()} - Inline creatable: ${isTableInlineCreatable}, Inline row creatable: ${isTableInlineRowCreatable}, Create action enabled: ${isCreateActionEnabled}`);
      }
      return allowsCreation;
    };
    _proto.makeFieldFormBuilderContext = function makeFieldFormBuilderContext() {
      return {
        fieldMapping: this.state.fieldMapping,
        bindingContext: this._bindingContext,
        metaModel: this.getMetaModel(),
        view: this.getPageController().getView(),
        runAsOwner: fn => this._getOwner()?.runAsOwner(fn),
        ownerContextPath: this.getOwnerContextPath(),
        getValueList: this.getValueList.bind(this),
        getTranslatedText: this.getTranslatedText.bind(this),
        onFieldChange: this.onFieldChange.bind(this),
        onValidateFieldGroups: this.onValidateFieldGroups.bind(this),
        onHasError: () => {
          this.state.hasError = true;
        },
        onHasValues: () => {
          this.state.hasValues = true;
        }
      };
    };
    _proto.makeReviewAreaContext = function makeReviewAreaContext() {
      return {
        selectedLayoutMode: this.state.selectedLayoutMode,
        getTranslatedText: this.getTranslatedText.bind(this)
      };
    };
    _proto.makeTablePreviewContext = function makeTablePreviewContext() {
      return {
        tableReferences: this._tableReferences,
        tableData: this._tableData,
        pendingUpdatedRowContexts: this._pendingUpdatedRowContexts,
        pendingNewRowContexts: this._pendingNewRowContexts,
        runAsOwner: fn => this._getOwner()?.runAsOwner(fn),
        ownerContextPath: this.getOwnerContextPath() ?? "",
        model: this.getModel(),
        metaModel: this.getMetaModel(),
        onFieldChange: this.onFieldChange.bind(this),
        onValidateFieldGroups: this.onValidateFieldGroups.bind(this),
        getValueList: this.getValueList.bind(this),
        applyCompositeFieldCheck: this.applyCompositeFieldCheck.bind(this)
      };
    }

    /**
     * Renders previous table view showing original values (all read-only).
     * @param navigationPropertyName The name of the navigation property (table).
     * @param collectionMetadata The collection (table) metadata.
     * @param existingRowContexts The V4 contexts for the existing rows.
     * @param isGridLayout Whether the source table is a grid (sap.ui.table.Table).
     * @returns Preview table.
     */;
    _proto._renderPreviousTableView = function _renderPreviousTableView(navigationPropertyName, collectionMetadata, existingRowContexts, isGridLayout) {
      return EasyFillTableViewBuilder.renderPreviousTableView(this.makeTablePreviewContext(), navigationPropertyName, collectionMetadata, existingRowContexts, isGridLayout);
    }

    /**
     * Renders new table view with AI changes highlighted and new rows editable.
     * @param navigationPropertyName The name of the navigation property.
     * @param aiChanges Array of row changes from AI response.
     * @param collectionMetadata The collection metadata.
     * @param existingRowContexts The V4 contexts for the existing rows.
     * @param isGridLayout Whether the source table is a grid (sap.ui.table.Table).
     * @returns Preview table.
     */;
    _proto._renderNewTableView = function _renderNewTableView(navigationPropertyName, aiChanges, collectionMetadata, existingRowContexts, isGridLayout) {
      const parentDataPath = this.getPageController().getView()?.getBindingContext()?.getPath() ?? "";
      return EasyFillTableViewBuilder.renderNewTableView(this.makeTablePreviewContext(), navigationPropertyName, aiChanges, collectionMetadata, existingRowContexts, isGridLayout, parentDataPath);
    }

    /**
     * Renders the complete table preview with segmented button to toggle between previous and new views.
     * @param navigationPropertyName The name of the navigation property.
     * @param aiChanges Array of row changes from AI response.
     * @param collectionMetadata The collection metadata.
     * @param rowContexts The V4 contexts for the existing rows.
     * @returns VBox containing segmented button and table.
     */;
    _proto._renderTablePreview = function _renderTablePreview(navigationPropertyName, aiChanges, collectionMetadata, rowContexts) {
      // Determine view mode: preserve user's selection across re-renders, default to "new"
      const currentViewMode = this.state.tableViewModes[navigationPropertyName] ?? "new";
      this.state.tableViewModes[navigationPropertyName] = currentViewMode;

      // Calculate counts
      const existingCount = rowContexts.length;
      const allowsCreation = this._tableData.get(navigationPropertyName)?.flags.allowsCreation === true;
      const aiNewRows = aiChanges.filter(r => r._rowIndex === undefined);
      // Cap at 1: the dialog only creates one new row at a time (matching _renderNewTableView behavior)
      const newCount = allowsCreation ? Math.min(1, aiNewRows.length) : 0;

      // Format title with change summary
      const getTableTitle = viewMode => {
        if (viewMode === "previous") {
          const baseName = collectionMetadata.description;
          return `${baseName} (${existingCount})`;
        } else {
          const baseName = collectionMetadata.description;
          return `${baseName} (${existingCount + newCount})`;
        }
      };

      // Create both table views
      const mdcTable = this._tableReferences.get(navigationPropertyName);
      const isGridLayout = mdcTable ? isGridSourceTable(mdcTable) : false;
      const previousTable = this._renderPreviousTableView(navigationPropertyName, collectionMetadata, rowContexts, isGridLayout);
      const {
        view: newTable,
        hasUneditableChanges,
        hasEditableChanges
      } = this._renderNewTableView(navigationPropertyName, aiChanges, collectionMetadata, rowContexts, isGridLayout);

      // Set initial visibility based on current view mode
      previousTable.setVisible(currentViewMode === "previous");
      newTable.setVisible(currentViewMode === "new");

      // Create title control that updates dynamically
      const titleControl = new Title({
        text: getTableTitle(currentViewMode),
        level: TitleLevel.H5
      }).addStyleClass("sapUiMediumMarginEnd");
      const readonlyTag = hasUneditableChanges ? new GenericTag({
        text: this.getTranslatedText("C_EASYEDIT_TABLE_READONLY_TAG"),
        status: "Warning",
        visible: currentViewMode === "new"
      }) : null;

      // Create segmented button for view switching
      const segmentedButton = new SegmentedButton({
        width: "auto",
        selectionChange: () => {
          const selectedKey = segmentedButton.getSelectedKey();
          this.state.tableViewModes[navigationPropertyName] = selectedKey;
          previousTable.setVisible(selectedKey === "previous");
          newTable.setVisible(selectedKey === "new");
          readonlyTag?.setVisible(selectedKey === "new");
          // Update title with new count
          titleControl.setText(getTableTitle(selectedKey));
        },
        items: [new SegmentedButtonItem({
          key: "previous",
          text: this.getTranslatedText("C_EASYEDIT_TABLE_VIEW_PREVIOUS"),
          width: "auto"
        }), new SegmentedButtonItem({
          key: "new",
          text: this.getTranslatedText("C_EASYEDIT_TABLE_VIEW_NEW"),
          width: "auto"
        })]
      });
      segmentedButton.setSelectedKey(currentViewMode);

      // Container for dynamically showing the selected table
      const tableContainer = isGridLayout ? (() => {
        const sc = new ScrollContainer({
          horizontal: true,
          vertical: false,
          content: [previousTable, newTable]
        });
        sc.addStyleClass("sapUiSmallMarginTop");
        return sc;
      })() : _jsx(VBox, {
        class: "sapUiSmallMarginTop",
        children: {
          items: [previousTable, newTable]
        }
      });
      return {
        vbox: _jsx(VBox, {
          class: "sapUiSmallMargin",
          children: {
            items: [_jsxs(HBox, {
              justifyContent: "SpaceBetween",
              alignItems: "Center",
              wrap: FlexWrap.Wrap,
              children: [_jsxs(HBox, {
                alignItems: "Center",
                wrap: FlexWrap.Wrap,
                renderType: "Bare",
                children: [titleControl, readonlyTag]
              }), segmentedButton]
            }), tableContainer]
          }
        }),
        hasUneditableChanges,
        hasEditableChanges
      };
    };
    _proto.onThumbUpPressed = function onThumbUpPressed(thumbUpButton, thumbDownButton) {
      triggerPXIntegration("thumbUp");
      this.onThumbPressed(thumbUpButton, thumbDownButton);
    };
    _proto.onThumbDownPressed = function onThumbDownPressed(thumbUpButton, thumbDownButton) {
      triggerPXIntegration("thumbDown");
      this.onThumbPressed(thumbUpButton, thumbDownButton);
    };
    _proto.onThumbPressed = function onThumbPressed(thumbUpButton, thumbDownButton) {
      thumbUpButton.setEnabled(false);
      thumbDownButton.setEnabled(false);
      MessageToast.show(this.getTranslatedText("C_EASYEDIT_FEEDBACK_SENT"));
    };
    _proto.formatRemainingCharacters = function formatRemainingCharacters(value) {
      return this.getTranslatedText("C_EASYEDIT_REMAINING_CHARACTERS", [MAX_LENGTH - (value?.length ?? 0)]);
    };
    _proto.onClearAll = function onClearAll() {
      this.state.newValues = {};
      this.state.hasValues = false;
      this._hasIncorrectFields = false;
      this._hasIncorrectTableFields = false;
      this.state.warningMessageText = "";
      this.state.selectedLayoutMode = EasyFillLayoutMode.CONDENSED;
      this.state.enteredText = "";
      this.state.hasError = false;
      this.state.stateType = "Initial";
      this.state.currentlyEnteredText = "";
      this.state.incorrectValues = {};
      this.state.attemptToAddMultipleRowsPerTable = false;
      this.discardPendingContexts();
      this._tableData.clear();
      this._existingRowContexts.clear();
      this._tableReferences.clear();
      this.destroyCurrentScrollContainer();
    }

    /**
     * Handles layout mode switch between condensed and detailed layout.
     * @param event Selection change event.
     * @returns Promise resolved after layout update.
     */;
    _proto.onSettingsModeSelectionChange = async function onSettingsModeSelectionChange(event) {
      const selectedItemKey = event.getParameter("item")?.getKey();
      this.state.selectedLayoutMode = selectedItemKey === EasyFillLayoutMode.DETAILED ? EasyFillLayoutMode.DETAILED : EasyFillLayoutMode.CONDENSED;
      try {
        await this.setAllFieldsBasedOnLayoutMode();
      } catch (err) {
        Log.error(err);
        this.setErrorState();
      }
    }

    /**
     * Rebuilds section content according to selected layout mode.
     * @returns Promise resolved when layout content is updated.
     */;
    _proto.setAllFieldsBasedOnLayoutMode = async function setAllFieldsBasedOnLayoutMode() {
      this.preserveEditedValuesBeforeLayoutSwitch();
      const isCondensed = this.state.selectedLayoutMode === EasyFillLayoutMode.CONDENSED;
      const sectionsForMode = isCondensed ? [""] : this.state.pageSectionsTitles;
      this.destroyCurrentSectionsAndSubSections();
      this._hasIncorrectFields = false;
      this._hasIncorrectTableFields = false;
      this.state.warningMessageText = "";
      await this.createOrUpdateObjectPageLayoutWithSections(sectionsForMode);
    }

    /**
     * Preserves currently edited values before switching layout mode.
     */;
    _proto.preserveEditedValuesBeforeLayoutSwitch = function preserveEditedValuesBeforeLayoutSwitch() {
      const bindingValues = this._bindingContext?.getObject();
      if (bindingValues === undefined) {
        Log.info("No values to be preserved before layout switch");
        return;
      }
      const currentAiValues = this.getAiResultForFieldsFromComponentState() ?? {};
      const mergedValues = {
        ...currentAiValues
      };
      for (const fieldName of Object.keys(currentAiValues)) {
        if (bindingValues[fieldName] !== undefined) {
          mergedValues[fieldName] = bindingValues[fieldName];
        }
      }
      this.saveAiResultForFieldsToComponentState(mergedValues);
    }

    /**
     * Reads visible object page section titles.
     * @returns List of section titles, or a single empty title fallback.
     */;
    _proto.getPageSectionsTitles = function getPageSectionsTitles() {
      const objectPageLayout = this.getCurrentObjectPageLayout();
      try {
        const sectionTitles = objectPageLayout.getSections().filter(section => section.getVisible() && section.getTitle()).map(section => section.getTitle());
        if (sectionTitles.length === 0) {
          Log.warning("Could not find any visible sections with a title in the ObjectPageLayout.");
          return [""];
        }
        sectionTitles.push(this.getTranslatedText("C_EASYEDIT_INCORRECT_FIELDS"));
        return sectionTitles;
      } catch (err) {
        Log.error(err);
        return [""];
      }
    }

    /**
     * Returns the current object page layout from the active view.
     * @returns Object page layout instance.
     */;
    _proto.getCurrentObjectPageLayout = function getCurrentObjectPageLayout() {
      const pageController = this.getPageController();
      const objectPageLayout = pageController._getObjectPageLayoutControl?.();
      if (objectPageLayout === undefined) {
        throw new Error("Failed to retrieve ObjectPageLayout from ObjectPage controller");
      }
      return objectPageLayout;
    }

    /**
     * Clears dynamic sections and subsections from the current layout.
     */;
    _proto.destroyCurrentSectionsAndSubSections = function destroyCurrentSectionsAndSubSections() {
      // Detach cached table preview VBoxes from the section tree before destroying sections.
      // This preserves the live transient contexts and field bindings so they can be re-added
      // to the rebuilt sections without recreating OData contexts on every layout switch.
      this._renderedTablePreviews.forEach(_ref2 => {
        let {
          vbox
        } = _ref2;
        const parent = vbox.getParent();
        if (parent instanceof ObjectPageSubSection) {
          parent.removeBlock(vbox);
        } else if (parent instanceof VBox) {
          parent.removeItem(vbox);
        }
      });
      const scrollContainer = this.$scrollContainer.current;
      if (scrollContainer === undefined) {
        return;
      }
      const objectPageLayouts = scrollContainer.getItems().filter(item => item instanceof ObjectPageLayout);
      objectPageLayouts.forEach(layout => {
        layout.destroySections();
      });
    };
    _proto.onValidateFieldGroups = function onValidateFieldGroups(_e) {
      const allFields = this.$reviewArea.current?.getControlsByFieldGroupId("EasyFillField") ?? [];
      this.state.hasError = allFields.some(field => {
        if (field.data("messageId")) {
          return true;
        }
        const content = field.content;
        const innerInputs = content?.isA("sap.m.InputBase") === true ? [content] : content?.findAggregatedObjects(true, c => c.isA("sap.m.InputBase")) ?? [];
        return innerInputs.some(input => input.getValueState() === ValueState.Error);
      });
    };
    _proto.onFieldChange = function onFieldChange(ev) {
      const field = ev.getSource();
      const msgId = field.data("messageId");
      if (msgId) {
        field.removeMessage(msgId);
      }
      field.data("messageId", undefined);
      setTimeout(() => {
        this.applyCompositeFieldCheck(field).catch(err => Log.error("Composite field error re-application failed:", err));
      }, INNER_CONTROL_RENDER_DELAY_MS);
    }

    /**
     * Runs the value help check on the current input value for composite fields (e.g. amount + currency).
     * Sets the value state to "Error" if the value is still invalid, or "None" if it has become valid.
     *
     * Note: using simply field.addMessage does not work for composite fields due to the way MDC handles value states internally on the input controls, so we have to set the value state directly on the input after checking the value help results.
     * @param field The composite field to validate.
     */;
    _proto.applyCompositeFieldCheck = async function applyCompositeFieldCheck(field) {
      const content = field.content;
      const inputs = content?.findAggregatedObjects(true, c => c.isA("sap.m.InputBase")) ?? [];
      for (const metaPathKey of ["primaryPropMetaPath", "auxiliaryPropMetaPath"]) {
        const metaPath = field.data(metaPathKey);
        if (!metaPath) {
          continue;
        }
        const isAuxiliary = metaPathKey === "auxiliaryPropMetaPath";
        const input = inputs.find(inp => inp.getId().endsWith(UNIT_INPUT_ID_SUFFIX) === isAuxiliary);
        if (!input) {
          Log.warning(`EasyFill [ATTENTION]: could not locate ${isAuxiliary ? "unit" : "primary"} input via suffix "${UNIT_INPUT_ID_SUFFIX}" - MDC internal convention may have changed, skipping value help check`);
          continue;
        }
        const currentValue = input.getValue();
        const valueList = await this.getValueList(metaPath);
        if (!currentValue || !valueList || !ValueListHelper.isValueListSearchable(metaPath, valueList)) {
          // No value or no searchable value list — clear any prior error so a deleted value doesn't stay red.
          input.setValueState(ValueState.None);
          input.setValueStateText("");
          continue;
        }
        const resolved = await resolveTokenValue(valueList, {
          operator: FilterOperator.EQ,
          selectedValues: [currentValue]
        }, true);
        if (resolved[0]?.noMatch === true) {
          input.setValueState(ValueState.Error);
          input.setValueStateText(this.getTranslatedText("C_EASYEDIT_VH_ERROR", [currentValue]));
        } else {
          input.setValueState(ValueState.None);
          input.setValueStateText("");
        }
      }
      this.onValidateFieldGroups();
    }

    /**
     * Executes AI extraction and builds review content.
     * @returns Promise resolved when processing is complete.
     */;
    _proto.onEasyEditPressed = async function onEasyEditPressed() {
      this.navigateToReviewPane();
      const metaPath = this.getOwnerPageDefinition();
      let fieldMapping;
      try {
        fieldMapping = this._getFieldMapping(metaPath);
        this.state.fieldMapping = fieldMapping;
      } catch (err) {
        this.setErrorState();
        Log.error("Failed to get field mapping:", err);
        return;
      }
      const easyFillLibrary = await __ui5_require_async("ux/eng/fioriai/reuse/easyfill/EasyFill");
      const odataModel = this.getModel();
      this.discardPendingContexts();
      const transientListBinding = EasyFillTableViewBuilder.createListBinding(odataModel.getMetaModel().getMetaPath(this.getPageController().getView()?.getBindingContext()?.getPath()), this.getModel(), "easyFillDirectFields");
      this._bindingContext = transientListBinding.create({}, true);
      this.state.isBusy = true;
      try {
        const aiCallResult = await easyFillLibrary.extractFieldValuesFromText(this.state.enteredText, fieldMapping);
        this.state.isBusy = false;
        if (aiCallResult.success) {
          const {
            multipleRows,
            ...updatedFields
          } = aiCallResult.data;
          this.state.attemptToAddMultipleRowsPerTable = multipleRows ?? false;
          for (const [key, value] of Object.entries(updatedFields)) {
            if (typeof value !== "object" && fieldMapping[key] !== undefined) {
              this._bindingContext?.setProperty(key, value);
            }
          }
          this.saveAiResultForFieldsToComponentState(updatedFields);
          this.destroyCurrentScrollContainer();
          if (Object.keys(updatedFields).length === 0) {
            this.state.hasValues = false;
            this._hasIncorrectFields = false;
            this._hasIncorrectTableFields = false;
            this.state.warningMessageText = "";
            this.state.stateType = "NoEntries";
            return;
          }
          this.state.stateType = "HasEntries";
          this.state.hasError = false;
          this.state.hasValues = false;
          this._hasIncorrectFields = false;
          this._hasIncorrectTableFields = false;
          this.state.warningMessageText = "";
          this.changeSelectedLayoutModeBasedOnChangedValuesCount(Object.keys(updatedFields).length);
          this.state.pageSectionsTitles = this.getPageSectionsTitles();
          const sectionsForMode = this.state.selectedLayoutMode === EasyFillLayoutMode.CONDENSED ? [""] : this.state.pageSectionsTitles;
          const objectPageLayoutWithSections = await this.createOrUpdateObjectPageLayoutWithSections(sectionsForMode);
          this.addItemToReviewArea(objectPageLayoutWithSections);
          setTimeout(() => {
            this.onValidateFieldGroups();
          }, 1000);
        } else {
          this.setErrorState();
        }
      } catch (e) {
        this.state.isBusy = false;
        this.setErrorState();
      }
    }

    /**
     * Chooses default layout mode depending on number of changed values.
     * @param changedValuesCount Number of changed values.
     */;
    _proto.changeSelectedLayoutModeBasedOnChangedValuesCount = function changeSelectedLayoutModeBasedOnChangedValuesCount(changedValuesCount) {
      if (changedValuesCount > EasyFillDialog.CHANGED_VALUES_COUNT_THRESHOLD) {
        this.state.selectedLayoutMode = EasyFillLayoutMode.DETAILED;
      } else {
        this.state.selectedLayoutMode = EasyFillLayoutMode.CONDENSED;
      }
    };
    _proto.isInErrorState = function isInErrorState() {
      return this.state.stateType === "Error";
    };
    _proto._updateWarningMessageText = function _updateWarningMessageText() {
      if (this._hasIncorrectFields && this._hasIncorrectTableFields) {
        this.state.warningMessageText = this.getTranslatedText("C_EASYEDIT_DIALOG_WARNING_MSG_FIELDS_AND_TABLES");
      } else if (this._hasIncorrectFields) {
        this.state.warningMessageText = this.getTranslatedText("C_EASYEDIT_DIALOG_WARNING_MSG_FIELDS");
      } else if (this._hasIncorrectTableFields) {
        this.state.warningMessageText = this.getTranslatedText("C_EASYEDIT_DIALOG_WARNING_MSG_TABLES");
      } else {
        this.state.warningMessageText = "";
      }
    };
    _proto.setErrorState = function setErrorState() {
      this.discardPendingContexts();
      this.destroyCurrentScrollContainer();
      this.state.hasValues = false;
      this._hasIncorrectFields = false;
      this._hasIncorrectTableFields = false;
      this.state.warningMessageText = "";
      this.state.stateType = "Error";
      this.state.newValues = {};
      this.state.incorrectValues = {};
      this.state.tableViewModes = {};
      this.state.attemptToAddMultipleRowsPerTable = false;
      this._tableData.clear();
      this._existingRowContexts.clear();
      this._tableReferences.clear();
    }

    /**
     * Adds the generated object page layout into the review area.
     * @param objectPageLayoutWithSections Layout containing reviewed fields.
     */;
    _proto.addItemToReviewArea = function addItemToReviewArea(objectPageLayoutWithSections) {
      if (this.isInErrorState()) return;
      this.$reviewArea.current?.addItem(_jsx(FlexBox, {
        ref: this.$scrollContainer,
        class: "sapFeEasyFillReviewArea",
        direction: FlexDirection.Column,
        children: {
          items: [objectPageLayoutWithSections]
        }
      }));
    };
    _proto.saveAiResultForFieldsToComponentState = function saveAiResultForFieldsToComponentState(updatedFields) {
      Log.info("Saving AI result for fields to component state. Updated fields: " + JSON.stringify(updatedFields));
      this.state.aiResultUpdatedFields = updatedFields;
    };
    _proto.getAiResultForFieldsFromComponentState = function getAiResultForFieldsFromComponentState() {
      const sanitizedUpdatedFields = {};
      const updatedFields = this.state.aiResultUpdatedFields ?? {};
      for (const fieldName of Object.keys(updatedFields)) {
        if (!EasyFillFieldHelper.isTechnicalFieldKey(fieldName)) {
          sanitizedUpdatedFields[fieldName] = updatedFields[fieldName];
        }
      }
      return sanitizedUpdatedFields;
    };
    _proto.destroyCurrentScrollContainer = function destroyCurrentScrollContainer() {
      this.$scrollContainer.current?.destroy();
      this.destroyLayoutSettingsButtons();
    };
    _proto.destroyLayoutSettingsButtons = function destroyLayoutSettingsButtons() {
      this.settingsButtons?.layoutModeButton?.destroy();
      this.settingsButtons?.enlargeOrShrinkButton?.destroy();
      this.settingsButtons = undefined;
    }

    /**
     * Creates the heading title control and header content controls (AI notice, feedback, warning strip).
     * @returns Object with heading Title and headerContent controls array.
     */;
    _proto.createHeadingWithTitleAndAiNoticeText = function createHeadingWithTitleAndAiNoticeText() {
      const resourceBundle = Lib.getResourceBundleFor("sap.fe.controls");
      const thumbUpButton = _jsx(ToggleButton, {
        icon: "sap-icon://thumb-up",
        tooltip: this.getTranslatedText("C_EASYEDIT_THUMBS_UP"),
        type: "Transparent",
        class: "sapUiTinyMarginBegin"
      });
      FESRHelper.setSemanticStepname(thumbUpButton, "press", "fe4:ef:thumbUp");
      const thumbDownButton = _jsx(ToggleButton, {
        icon: "sap-icon://thumb-down",
        tooltip: this.getTranslatedText("C_EASYEDIT_THUMBS_DOWN"),
        type: "Transparent",
        class: "sapUiTinyMarginBegin"
      });
      FESRHelper.setSemanticStepname(thumbDownButton, "press", "fe4:ef:thumbDown");
      thumbUpButton.attachPress(() => this.onThumbUpPressed(thumbUpButton, thumbDownButton));
      thumbDownButton.attachPress(() => this.onThumbDownPressed(thumbUpButton, thumbDownButton));
      const heading = _jsx(Title, {
        text: this.getTranslatedText("C_EASYEDIT_FILLED_FIELDS")
      });
      const aiNoticeRow = _jsxs(FlexBox, {
        direction: FlexDirection.Row,
        wrap: FlexWrap.Wrap,
        justifyContent: "Start",
        alignItems: "Center",
        renderType: "Bare",
        visible: equal(this.bindState("stateType"), "HasEntries"),
        children: [_jsx(AINotice, {
          type: "Link",
          placementType: PlacementType.Auto,
          children: _jsxs(VBox, {
            children: [_jsx(Text, {
              class: "sapFeControlsAiPopoverText1",
              text: resourceBundle.getText("M_NOTICE_AI_POPOVER_TEXT_1")
            }), _jsx(Text, {
              class: "sapFeControlsAiPopoverText2",
              text: resourceBundle.getText("M_NOTICE_AI_POPOVER_TEXT_2")
            })]
          })
        }), _jsxs(HBox, {
          children: [thumbUpButton, ", ", thumbDownButton]
        })]
      });
      const multipleRowsStrip = _jsx(MessageStrip, {
        visible: this.state.attemptToAddMultipleRowsPerTable,
        text: this.getTranslatedText("C_EASYEDIT_TABLE_MULTIPLE_NEW_ROWS_WARNING"),
        type: "Warning",
        showIcon: true
      });
      const messageStrip = _jsx(MessageStrip, {
        text: this.bindState("warningMessageText"),
        type: "Warning",
        showIcon: true,
        visible: not(isEmpty(this.bindState("warningMessageText"))),
        class: "sapUiTinyMarginTopBottom"
      });
      return {
        heading,
        headerContent: [aiNoticeRow, multipleRowsStrip, messageStrip]
      };
    }

    /**
     * Creates or updates an object page layout with sections and header actions.
     * @param sections Section titles to render.
     * @returns Promise resolved with the object page layout.
     */;
    _proto.createOrUpdateObjectPageLayoutWithSections = async function createOrUpdateObjectPageLayoutWithSections(sections) {
      const showAnchorBar = this.state.selectedLayoutMode === EasyFillLayoutMode.DETAILED;
      const settingsButtons = this.getOrCreateLayoutSettingsActions();
      const objectPageSections = await this.createAllObjectPageSections(sections);
      const {
        heading,
        headerContent
      } = this.createHeadingWithTitleAndAiNoticeText();
      const headerTitle = _jsx(ObjectPageDynamicHeaderTitle, {
        children: {
          heading,
          actions: [settingsButtons]
        }
      });
      const existingLayout = this.tryGetScrollContainerObjectPageLayout();
      if (existingLayout) {
        Log.info("Layout already exists, adding sections to existing layout");
        objectPageSections.forEach(section => {
          existingLayout.addSection(section);
        });
        existingLayout.setShowAnchorBar(showAnchorBar);
        return existingLayout;
      }
      Log.info("No existing layout found, creating a new one with sections");
      const newLayout = _jsx(ObjectPageLayout, {
        id: "sapFeEasyFillObjectPageLayout",
        showAnchorBar: showAnchorBar,
        upperCaseAnchorBar: false,
        alwaysShowContentHeader: true,
        height: "100%",
        class: "sapUiNoContentPadding",
        children: {
          headerTitle,
          headerContent,
          sections: objectPageSections
        }
      });
      newLayout.attachNavigate(e => {
        const subSection = e.getParameter("subSection");
        // OPL's spacer is hidden to prevent a layout feedback loop, so its native
        // scroll cannot always reach all sections - scrollIntoView is the fallback.
        setTimeout(() => {
          subSection?.getDomRef()?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }, 0);
      });
      return newLayout;
    }

    /**
     * Creates all object page sections for the current AI result.
     * @param sections Section titles to map fields into.
     * @returns Promise resolved with created sections.
     */;
    _proto.createAllObjectPageSections = async function createAllObjectPageSections(sections) {
      const aiResultUpdatedFields = this.getAiResultForFieldsFromComponentState();
      const fieldMapping = this.state.fieldMapping;
      const updatedFieldNames = Object.keys(aiResultUpdatedFields);
      const incorrectFieldsSectionTitle = this.getTranslatedText("C_EASYEDIT_INCORRECT_FIELDS");
      const editableFields = (await this.getEditableFields?.()) ?? {};
      const sectionsToFields = new Map();
      sections.forEach(sectionTitle => {
        sectionsToFields.set(sectionTitle, []);
      });
      if (sections.length > 1) {
        for (const fieldName of updatedFieldNames) {
          const isCollectionField = fieldMapping[fieldName]?.isCollection === true;
          const isNonEditableField = !isCollectionField && !EasyFillFieldHelper.isEditableField(fieldName, editableFields);
          const targetSection = isNonEditableField ? incorrectFieldsSectionTitle : fieldMapping[fieldName]?.section ?? sections[0];
          sectionsToFields.get(targetSection)?.push(fieldName);
        }
      } else {
        // If only one section, assign all fields to that section
        sectionsToFields.set(sections[0], updatedFieldNames);
      }
      // Remove entries for sections that have no fields
      sectionsToFields.forEach((fieldNames, sectionTitle) => {
        const hasFields = fieldNames.length > 0;
        if (!hasFields) {
          Log.info("Removing section from sections to fields mapping due to no fields mapped: " + sectionTitle);
          sectionsToFields.delete(sectionTitle);
        }
      });
      const sectionCreationPromises = [];
      let sectionIndex = 0;
      sectionsToFields.forEach((sectionFieldNames, sectionTitle) => {
        const sectionUpdatedFields = {};
        sectionFieldNames.forEach(fieldName => {
          const value = aiResultUpdatedFields[fieldName];
          if (value !== undefined) {
            sectionUpdatedFields[fieldName] = value;
          }
        });
        sectionCreationPromises.push(this.createObjectPageSection(sectionTitle, sectionIndex, sectionUpdatedFields));
        sectionIndex++;
      });
      const results = await Promise.all(sectionCreationPromises);
      this._hasIncorrectFields = results.some(r => r.hasIncorrectFields);
      this._hasIncorrectTableFields = results.some(r => r.hasIncorrectTableFields);
      this._updateWarningMessageText();
      return results.map(r => r.section);
    }

    /**
     * Tries to retrieve an existing object page layout from the scroll container.
     * @returns Existing layout when available.
     */;
    _proto.tryGetScrollContainerObjectPageLayout = function tryGetScrollContainerObjectPageLayout() {
      const scrollContainer = this.$scrollContainer.current;
      if (scrollContainer === undefined) {
        return undefined;
      }
      return scrollContainer.getItems().find(item => item instanceof ObjectPageLayout);
    }

    /**
     * Gets existing or creates a layout mode buttons and enlarge/shrink button.
     * @returns JSX content with action controls.
     */;
    _proto.getOrCreateLayoutSettingsActions = function getOrCreateLayoutSettingsActions() {
      if (this.settingsButtons?.layoutModeButton === undefined) {
        this.settingsButtons = {};
        this.settingsButtons.layoutModeButton = _jsx(SegmentedButton, {
          selectedKey: this.bindState("selectedLayoutMode"),
          selectionChange: this.onSettingsModeSelectionChange.bind(this),
          children: {
            items: [_jsx(SegmentedButtonItem, {
              icon: "sap-icon://increase-line-height",
              tooltip: this.getTranslatedText("C_EASYEDIT_BUTTON_DETAILED_VIEW_TOOLTIP")
            }, EasyFillLayoutMode.DETAILED), _jsx(SegmentedButtonItem, {
              icon: "sap-icon://decrease-line-height",
              tooltip: this.getTranslatedText("C_EASYEDIT_BUTTON_CONDENSED_VIEW_TOOLTIP")
            }, EasyFillLayoutMode.CONDENSED)]
          }
        });
      }
      if (this.settingsButtons?.enlargeOrShrinkButton === undefined) {
        this.settingsButtons.enlargeOrShrinkButton = _jsx(Button, {
          id: this.createId("easyFillEnlargeOrShrinkButton"),
          icon: "sap-icon://full-screen",
          type: ButtonType.Transparent,
          class: "sapUiTinyMarginBegin",
          press: this.onEnlargeOrShrinkReviewAreaButtonClick.bind(this)
        });
      }
      return [this.settingsButtons.layoutModeButton, this.settingsButtons.enlargeOrShrinkButton];
    };
    _proto.createObjectPageSection = async function createObjectPageSection(sectionTitle, sectionIndex, sectionUpdatedFields) {
      const sectionId = this.createId(`easyFillSection_${sectionIndex}`);
      const subSectionId = this.createId(`easyFillSubSection_${sectionIndex}`);
      const uiModel = this.getPageController().getModel("ui");
      const uiContext = uiModel.createBindingContext("/easyEditDialog");
      uiModel.setProperty("/easyEditDialog", {});
      uiContext.setProperty("isEditable", true);
      const table = [];
      for (const fieldName of Object.keys(sectionUpdatedFields)) {
        const fieldMetadata = this.state.fieldMapping[fieldName];
        const rowsValue = sectionUpdatedFields[fieldName];
        if (fieldMetadata?.isCollection !== true || !Array.isArray(rowsValue) || rowsValue.length === 0) {
          continue;
        }
        const typedRowsValue = rowsValue;
        const allowsCreation = this._tableData.get(fieldName)?.flags.allowsCreation === true;
        if (allowsCreation || typedRowsValue.some(r => r._rowIndex !== undefined)) {
          this.state.hasValues = true;
          this.state.newValues[fieldName] = typedRowsValue;
        }
        table.push(this.buildTablePreviewWithCreationGuard(fieldName, fieldMetadata, typedRowsValue));
      }
      const {
        reviewAreaBlocks,
        incorrectValuesForm
      } = await this.getReviewAreaAndIncorrectValuesForms(sectionUpdatedFields, uiContext);
      const hasSectionIncorrectValues = incorrectValuesForm.getFormContainers().length > 0;
      incorrectValuesForm.setVisible(hasSectionIncorrectValues);
      const subSections = EasyFillReviewAreaBuilder.createObjectPageSubSections(this.makeReviewAreaContext(), subSectionId, reviewAreaBlocks, hasSectionIncorrectValues, incorrectValuesForm, table);
      return {
        section: _jsx(ObjectPageSection, {
          id: sectionId,
          titleUppercase: false,
          showTitle: this.state.selectedLayoutMode === EasyFillLayoutMode.DETAILED,
          title: sectionTitle,
          class: this.state.selectedLayoutMode === EasyFillLayoutMode.DETAILED ? "sapFeEasyFillSectionDetailed" : "sapFeEasyFillSectionCondensed",
          children: {
            subSections: subSections
          }
        }),
        hasIncorrectFields: hasSectionIncorrectValues,
        hasIncorrectTableFields: false
      };
    };
    _proto.buildTablePreviewWithCreationGuard = function buildTablePreviewWithCreationGuard(fieldName, fieldMetadata, rowsValue) {
      const allowsCreation = this._tableData.get(fieldName)?.flags.allowsCreation === true;
      if (!allowsCreation && rowsValue.every(r => r._rowIndex === undefined)) {
        return EasyFillReviewAreaBuilder.buildAllNewRowsWarning(this.makeReviewAreaContext(), fieldMetadata);
      }
      const rowContexts = this._existingRowContexts.get(fieldName) ?? [];
      let tablePreview = this._renderedTablePreviews.get(fieldName);
      if (!tablePreview) {
        tablePreview = this._renderTablePreview(fieldName, rowsValue, fieldMetadata, rowContexts);
        this._renderedTablePreviews.set(fieldName, tablePreview);
      }
      const {
        vbox: diffTable
      } = tablePreview;
      if (!allowsCreation && rowsValue.some(r => r._rowIndex === undefined)) {
        return EasyFillReviewAreaBuilder.buildMixedRowsPreviewWithWarning(this.makeReviewAreaContext(), diffTable);
      }
      return diffTable;
    }

    /**
     * Populates review forms and performs validation.
     * The review form is split into editable and non-editable fields. Non-editable fields are shown in a separate form with a warning message.
     * For detailed layout mode, subsection titles are rendered in the same form container as their fields.
     * @param updatedFields Updated field values.
     * @param uiContext UI model context.
     * @returns Promise resolved with populated review blocks and incorrect values form.
     */;
    _proto.getReviewAreaAndIncorrectValuesForms = async function getReviewAreaAndIncorrectValuesForms(updatedFields, uiContext) {
      const newValues = {};
      const incorrectValues = {};
      const reviewAreaBlocks = [];
      const incorrectValuesForm = EasyFillReviewAreaBuilder.createIncorrectValuesForm();
      const {
        editableFieldNames,
        nonEditableFieldNames
      } = await EasyFillReviewAreaBuilder.getEditableAndNotEditableFieldNames(this.state.fieldMapping, updatedFields, () => this.getEditableFields?.() ?? Promise.resolve({}));
      if (this.state.selectedLayoutMode === EasyFillLayoutMode.DETAILED) {
        await EasyFillFieldFormBuilder.populateDetailedReviewAreaBlocks(this.makeFieldFormBuilderContext(), editableFieldNames, updatedFields, uiContext, newValues, reviewAreaBlocks);
      } else {
        await EasyFillFieldFormBuilder.populateCondensedReviewAreaBlocks(this.makeFieldFormBuilderContext(), editableFieldNames, updatedFields, uiContext, newValues, reviewAreaBlocks);
      }
      EasyFillFieldFormBuilder.populateIncorrectValuesForm(this.makeFieldFormBuilderContext(), nonEditableFieldNames, updatedFields, uiContext, incorrectValues, incorrectValuesForm);
      this.state.newValues = newValues;
      this.state.incorrectValues = incorrectValues;
      return {
        reviewAreaBlocks,
        incorrectValuesForm
      };
    };
    _proto.onEnlargeOrShrinkReviewAreaButtonClick = function onEnlargeOrShrinkReviewAreaButtonClick() {
      const shouldSetFullScreen = this.isEnlargeIconUsed();
      if (shouldSetFullScreen) {
        this.moveSplitterToFarLeft();
        this.updateEnlargeOrShrinkButtonIconToShrink();
      } else {
        this.moveSplitterToDefault();
        this.updateEnlargeOrShrinkButtonIconToEnlarge();
      }
    };
    _proto.isEnlargeIconUsed = function isEnlargeIconUsed() {
      return this.settingsButtons?.enlargeOrShrinkButton?.getIcon() === "sap-icon://full-screen";
    };
    _proto.moveSplitterToFarLeft = function moveSplitterToFarLeft() {
      this.moveSplitter("0%", "100%");
    };
    _proto.moveSplitterToDefault = function moveSplitterToDefault() {
      this.moveSplitter("40%", "60%");
    }

    /**
     * Changes the splitter position by setting the size of the input and review panes.
     * @param inputPaneSize Size for the input pane (e.g., "40%").
     * @param reviewPaneSize Size for the review pane (e.g., "60%").
     */;
    _proto.moveSplitter = function moveSplitter(inputPaneSize, reviewPaneSize) {
      const inputPaneId = this.createId("inputPane");
      const reviewPaneId = this.createId("reviewPane");
      const inputPane = Element.getElementById(inputPaneId);
      const reviewPane = Element.getElementById(reviewPaneId);
      inputPane?.setLayoutData(new SplitterLayoutData({
        size: inputPaneSize
      }));
      reviewPane?.setLayoutData(new SplitterLayoutData({
        size: reviewPaneSize
      }));
    };
    _proto.updateEnlargeOrShrinkButtonIconToShrink = function updateEnlargeOrShrinkButtonIconToShrink() {
      const icon = "sap-icon://exit-full-screen";
      this.settingsButtons?.enlargeOrShrinkButton?.setIcon(icon);
      this.settingsButtons?.enlargeOrShrinkButton?.setTooltip(this.getTranslatedText("C_EASYEDIT_EXIT_FULLSCREEN_BUTTON_TOOLTIP"));
    };
    _proto.updateEnlargeOrShrinkButtonIconToEnlarge = function updateEnlargeOrShrinkButtonIconToEnlarge() {
      const icon = "sap-icon://full-screen";
      this.settingsButtons?.enlargeOrShrinkButton?.setIcon(icon);
      this.settingsButtons?.enlargeOrShrinkButton?.setTooltip(this.getTranslatedText("C_EASYEDIT_ENTER_FULLSCREEN_BUTTON_TOOLTIP"));
    };
    _proto.navigateToReviewPane = function navigateToReviewPane() {
      const reviewAreaDom = this.$reviewArea.current?.getDomRef?.();
      if (reviewAreaDom) {
        return;
      }
      const splitter = this.$responsiveSplitter.current;
      splitter?._activatePage?.(1);
      setTimeout(() => {
        const splitterDom = this.$responsiveSplitter.current?.getDomRef?.();
        splitterDom?.querySelectorAll(".sapUiResponsiveSplitterPaginatorButton")?.[1]?.focus();
      }, 0);
    };
    _proto.createContent = function createContent() {
      const easyEditDescription = _jsx(InvisibleText, {
        text: this.getTranslatedText("C_EASYEDIT_DIALOG_DESCRIPTION")
      });
      const $easyFillButton = createReference();
      const $easyFillSaveButton = createReference();
      const $easyFillCancelButton = createReference();
      const $easyFillClearAllButton = createReference();
      const dialog = _jsx(Dialog, {
        title: this.getTranslatedText("C_EASYEDIT_DIALOG_TITLE"),
        resizable: true,
        draggable: true,
        horizontalScrolling: false,
        verticalScrolling: false,
        contentWidth: "1100px",
        contentHeight: "800px",
        escapeHandler: () => {
          this.onCancel();
        },
        afterClose: () => {
          this.destroy();
        },
        children: {
          content: _jsx(ResponsiveSplitter, {
            ref: this.$responsiveSplitter,
            children: _jsxs(PaneContainer, {
              children: [_jsxs(SplitPane, {
                requiredParentWidth: "600",
                id: this.createId("inputPane"),
                children: [{
                  layoutData: _jsx(SplitterLayoutData, {
                    size: "40%"
                  })
                }, _jsx(FlexBox, {
                  id: this.createId("inputArea"),
                  direction: FlexDirection.Column,
                  fitContainer: true,
                  children: _jsxs(VBox, {
                    class: "sapUiContentPadding",
                    children: [_jsx(FormattedText, {
                      htmlText: this.getTranslatedText("C_EASYEDIT_DIALOG_DESCRIPTION"),
                      class: "sapUiTinyMarginBottom"
                    }), easyEditDescription, _jsx(TextArea, {
                      value: this.bindState("enteredText"),
                      class: "sapUiTinyMarginBottom",
                      liveChange: e => {
                        this.state.currentlyEnteredText = e.getParameter("value") ?? "";
                      },
                      width: "100%",
                      placeholder: this.getTranslatedText("C_EASYEDIT_TEXTAREA_PLACEHOLDER"),
                      rows: 20,
                      growing: true,
                      growingMaxLines: 30,
                      maxLength: MAX_LENGTH,
                      ariaLabelledBy: easyEditDescription
                    }), _jsx(Text, {
                      class: "sapUiTinyMarginBottom",
                      text: {
                        path: "/currentlyEnteredText",
                        model: "$componentState",
                        formatter: this.formatRemainingCharacters.bind(this)
                      },
                      children: {
                        layoutData: _jsx(FlexItemData, {
                          alignSelf: "End"
                        })
                      }
                    }), _jsxs(FlexBox, {
                      wrap: FlexWrap.Wrap,
                      direction: FlexDirection.Row,
                      justifyContent: "End",
                      children: [{
                        layoutData: _jsx(FlexItemData, {
                          alignSelf: "End"
                        })
                      }, _jsx(Button, {
                        text: this.getTranslatedText("C_EASYEDIT_BUTTON"),
                        icon: "sap-icon://ai",
                        enabled: not(isEmpty(this.bindState("currentlyEnteredText"))),
                        press: this.onEasyEditPressed.bind(this),
                        ref: $easyFillButton,
                        class: "sapUiSmallMarginEnd sapUiSmallMarginBottom"
                      }), _jsx(Button, {
                        text: this.getTranslatedText("C_EASYEDIT_DIALOG_CLEAR_ALL"),
                        type: ButtonType.Transparent,
                        enabled: not(isEmpty(this.bindState("currentlyEnteredText"))),
                        press: this.onClearAll.bind(this),
                        ref: $easyFillClearAllButton
                      })]
                    })]
                  })
                })]
              }), _jsxs(SplitPane, {
                requiredParentWidth: "600",
                id: this.createId("reviewPane"),
                children: [{
                  layoutData: _jsx(SplitterLayoutData, {
                    size: "60%"
                  })
                }, _jsx(VBox, {
                  height: "100%",
                  busy: this.bindState("isBusy"),
                  class: "sapFeEasyFillReviewPaneWrapper",
                  children: _jsxs(FlexBox, {
                    id: this.createId("reviewArea"),
                    ref: this.$reviewArea,
                    renderType: "Bare",
                    direction: FlexDirection.Column,
                    height: "100%",
                    fitContainer: true,
                    class: "sapFeEasyFillReviewArea sapFeEasyFillReviewPaneContainer",
                    children: [_jsx(IllustratedMessage, {
                      illustrationType: IllustratedMessageType.NoSearchResults,
                      illustrationSize: IllustratedMessageSize.Large,
                      title: this.getTranslatedText("C_EASYEDIT_DIALOG_REVIEW_TITLE"),
                      description: this.getTranslatedText("C_EASYEDIT_DIALOG_REVIEW_DESCRIPTION"),
                      visible: equal(this.bindState("stateType"), "Initial")
                    }), _jsx(IllustratedMessage, {
                      illustrationType: IllustratedMessageType.NoEntries,
                      illustrationSize: IllustratedMessageSize.Large,
                      title: this.getTranslatedText("C_EASYEDIT_DIALOG_NO_ENTRIES_TITLE"),
                      description: this.getTranslatedText("C_EASYEDIT_DIALOG_NO_ENTRIES_DESCRIPTION"),
                      visible: equal(this.bindState("stateType"), "NoEntries")
                    }), _jsx(IllustratedMessage, {
                      illustrationType: IllustratedMessageType.UnableToLoad,
                      illustrationSize: IllustratedMessageSize.Large,
                      title: this.getTranslatedText("C_EASYEDIT_DIALOG_ERROR_TITLE"),
                      description: this.getTranslatedText("C_EASYEDIT_DIALOG_ERROR_DESCRIPTION"),
                      visible: equal(this.bindState("stateType"), "Error")
                    })]
                  })
                })]
              })]
            })
          }),
          footer: _jsxs(OverflowToolbar, {
            children: [_jsx(ToolbarSpacer, {}), _jsx(Button, {
              text: this.getTranslatedText("C_EASYEDIT_DIALOG_SAVE"),
              type: "Emphasized",
              enabled: and(this.bindState("hasValues"), not(this.bindState("hasError"))),
              press: this.onConfirm.bind(this),
              ref: $easyFillSaveButton
            }), _jsx(Button, {
              text: this.getTranslatedText("C_EASYEDIT_DIALOG_CANCEL"),
              type: "Transparent",
              press: this.onCancel.bind(this),
              ref: $easyFillCancelButton
            })]
          })
        }
      });
      dialog.addStyleClass("sapFeEasyFillDialog");
      FESRHelper.setSemanticStepname($easyFillButton.current, "press", "fai:ef:analyzeText");
      FESRHelper.setSemanticStepname($easyFillSaveButton.current, "press", "fai:ef:save");
      FESRHelper.setSemanticStepname($easyFillCancelButton.current, "press", "fai:ef:cancel");
      FESRHelper.setSemanticStepname($easyFillClearAllButton.current, "press", "fai:ef:clearAll");
      return dialog;
    };
    _proto.getValueList = async function getValueList(propertyPath) {
      const metaModel = this.getMetaModel();
      const valueLists = await ValueListHelper.getValueListInfo(undefined, propertyPath, undefined, metaModel);
      return valueLists[0];
    };
    return EasyFillDialog;
  }(BuildingBlock), _EasyFillDialog.CHANGED_VALUES_COUNT_THRESHOLD = 5, _EasyFillDialog), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "$reviewArea", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "$scrollContainer", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "$responsiveSplitter", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "getEditableFields", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = EasyFillDialog;
  return _exports;
}, false);
//# sourceMappingURL=EasyFillDialog-dbg.js.map
