/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/core/helpers/FPMHelper", "sap/fe/macros/field/FieldTemplating", "sap/ui/base/BindingInfo", "../CommonHelper", "./TableHelper", "./TableRuntime", "./uploadTable/UploadTableRuntime"], function (Log, BindingToolkit, FPMHelper, FieldTemplating, BindingInfo, CommonHelper, TableHelper, TableRuntime, UploadTableRuntime) {
  "use strict";

  var _exports = {};
  var formatValueRecursively = FieldTemplating.formatValueRecursively;
  var isPathInModelExpression = BindingToolkit.isPathInModelExpression;
  var isConstant = BindingToolkit.isConstant;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var compileExpression = BindingToolkit.compileExpression;
  // maximum number of items to share to Collaboration Manager simultanously
  const selectionLimitForShareToCollaborationManager = 1;
  // maximum number of items to open in new tabs simultanously
  const selectionLimitForOpenInNewTab = 10;
  let TableEventHandlerProvider = /*#__PURE__*/function () {
    function TableEventHandlerProvider(tableAPI, settings) {
      this.tableAPI = tableAPI;
      this.collectionEntity = settings.collectionEntity;
      this.metaModel = settings.metaModel;
      this.initializeHandlers(tableAPI);
    }

    /**
     * Initializes the event handler properties with functions.
     * @param tableAPI
     */
    _exports = TableEventHandlerProvider;
    var _proto = TableEventHandlerProvider.prototype;
    _proto.initializeHandlers = function initializeHandlers(tableAPI) {
      const tableType = this.tableAPI.tableDefinition?.control?.type;
      this.addCardToInsightsPress = tableAPI.onAddCardToInsightsPressed.bind(tableAPI);
      this.analyticalRefreshPress = this.tableAPI.tableDefinition.control.enableAnalyticalEdit === true ? tableAPI.onAnalyticalRefreshPress.bind(tableAPI) : undefined;
      this.beforeExport = tableAPI.onBeforeExport.bind(tableAPI);
      this.beforeOpenContextMenu = tableAPI.onContextMenuPress.bind(tableAPI);
      this.cellsSelectionHandler = tableAPI.pasteEnablementHandler.bind(tableAPI);
      this.collapseNode = tableType === "TreeTable" ? e => {
        tableAPI.onCollapseExpandNode(e, false);
      } : undefined;
      this.contextMenuItemSelected = TableRuntime.onContextMenuItemSelected.bind(TableRuntime);
      const rowNavigationInfo = this.tableAPI.tableDefinition?.annotation.row?.navigationInfo;
      if (rowNavigationInfo !== undefined || this.tableAPI.overrideRowPress) {
        if (rowNavigationInfo?.type === "Outbound") {
          this.contextMenuOpenInNewTab = _e => {
            const controller = tableAPI.getPageController();
            const internalContext = tableAPI.getBindingContext("internal");
            controller?.onOpenInNewTabNavigateOutBound?.(rowNavigationInfo.navigationTarget, internalContext?.getProperty("contextmenu/selectedContexts"), "", selectionLimitForOpenInNewTab, rowNavigationInfo.targetControlId);
          };
        } else {
          this.contextMenuShareToCollaborationManager = e => {
            const controller = tableAPI.getPageController();
            const internalContext = tableAPI.getBindingContext("internal");
            tableAPI.onShareToCollaborationManagerPress(e, controller, internalContext?.getProperty("contextmenu/selectedContexts"), selectionLimitForShareToCollaborationManager);
          };
          this.contextMenuOpenInNewTab = e => {
            const controller = tableAPI.getPageController();
            const internalContext = tableAPI.getBindingContext("internal");
            tableAPI.onOpenInNewTabPress(e, controller, internalContext?.getProperty("contextmenu/selectedContexts"), internalContext?.getProperty("contextmenu/navigableContexts"), {
              callExtension: true,
              targetPath: rowNavigationInfo?.targetPath ?? "",
              navMode: "openInNewTab",
              targetControlId: rowNavigationInfo?.targetControlId
            }, selectionLimitForOpenInNewTab);
          };
        }
      }
      this.dataStateChange = tableAPI.onDataStateChange.bind(tableAPI);
      this.dataStateIndicatorFilter = tableAPI.dataStateIndicatorFilter.bind(tableAPI);
      this.dragStartDocument = tableType === "TreeTable" ? tableAPI.onDragStartDocument.bind(tableAPI) : undefined;
      this.dragEnterDocument = tableType === "TreeTable" ? tableAPI.onDragEnterDocument.bind(tableAPI) : undefined;
      this.dropDocument = tableType === "TreeTable" ? tableAPI.onDropDocument.bind(tableAPI) : undefined;
      this.expandNode = tableType === "TreeTable" ? e => {
        tableAPI.onCollapseExpandNode(e, true);
      } : undefined;
      this.fieldChangeInCreationRow = e => {
        TableRuntime.onFieldChangeInCreationRow(e, !!this.tableAPI.tableDefinition.control.customValidationFunction);
      };
      this.fieldLiveChange = this.tableAPI.creationMode?.name === "InlineCreationRows" ? tableAPI.onFieldLiveChange.bind(tableAPI) : undefined;
      this.rowPress = tableAPI.onTableRowPress.bind(tableAPI);
      this.noop = tableAPI.onNoop.bind(tableAPI);
      this.segmentedButtonPress = tableAPI.onSegmentedButtonPressed.bind(tableAPI);
      this.selectionChange = tableAPI.onSelectionChanged.bind(tableAPI);
      this.tableContextChange = tableType === "TreeTable" ? e => {
        TableRuntime.onTreeTableContextChanged(e, this.tableAPI.tableDefinition?.annotation?.initialExpansionLevel);
      } : undefined;
      this.uploadCompleted = UploadTableRuntime.onUploadCompleted.bind(UploadTableRuntime);
      this.uploadFileNameLengthExceeded = UploadTableRuntime.onFileNameLengthExceeded.bind(UploadTableRuntime);
      this.uploadFileSizeExceeded = UploadTableRuntime.onFileSizeExceeded.bind(UploadTableRuntime);
      this.uploadItemValidationHandler = UploadTableRuntime.uploadFile.bind(UploadTableRuntime);
      this.uploadMediaTypeMismatch = UploadTableRuntime.onMediaTypeMismatch.bind(UploadTableRuntime);
      this.variantSaved = tableAPI.onVariantSaved.bind(tableAPI);
      this.variantSelected = tableAPI.onVariantSelected.bind(tableAPI);
    }

    /**
     * Gets the press event handler for the Create button.
     * @param forContextMenu
     * @param forCreationRow
     * @returns The event handler.
     */;
    _proto.getCreateButtonPressHandler = function getCreateButtonPressHandler(forContextMenu, forCreationRow) {
      return forCreationRow ? TableRuntime.onCreateButtonPress.bind(TableRuntime) : e => {
        const internalContext = this.tableAPI.getBindingContext("internal");
        const path = forContextMenu ? "contextmenu/selectedContexts" : "selectedContexts";
        TableRuntime.onCreateButtonPress(e, internalContext?.getProperty(path));
      };
    }

    /**
     * Gets the press event handler for the Create menu item.
     * @param index
     * @param forContextMenu
     * @returns The event handler.
     */;
    _proto.getCreateMenuItemPressHandler = function getCreateMenuItemPressHandler(index, forContextMenu) {
      const path = forContextMenu ? "contextmenu/selectedContexts" : "selectedContexts";
      return e => {
        TableRuntime.onCreateMenuItemPress(e, index, this.tableAPI.getBindingContext("internal")?.getProperty(path));
      };
    }

    /**
     * Gets the event handler for the Cut action.
     * @param forContextMenu
     * @returns The event handler.
     */;
    _proto.getCutHandler = function getCutHandler(forContextMenu) {
      return () => {
        this.tableAPI.onCut(forContextMenu);
      };
    }

    /**
     * Gets the event handler for the Copy action.
     * @param forContextMenu
     * @returns The event handler.
     */;
    _proto.getCopyHandler = function getCopyHandler(forContextMenu) {
      return () => {
        this.tableAPI.onCopy(forContextMenu);
      };
    }

    /**
     * Gets the press event handler for an action button.
     * @param dataField
     * @param action
     * @param forContextMenu
     * @returns The event handler.
     */;
    _proto.getDataFieldForActionButtonPressHandler = function getDataFieldForActionButtonPressHandler(dataField, action, forContextMenu) {
      if (!dataField) {
        return undefined;
      }
      const actionContextPath = action.annotationPath ? CommonHelper.getActionContext(this.metaModel.createBindingContext(action.annotationPath + "/Action")) : undefined;
      const actionContext = actionContextPath ? this.metaModel.createBindingContext(actionContextPath) : undefined;
      const actionName = dataField.Action;
      const targetEntityTypeName = this.tableAPI.contextObjectPath.targetEntityType.fullyQualifiedName;
      const isStaticAction = typeof actionContext?.getObject() !== "string" && (TableHelper._isStaticAction(actionContext?.getObject(), actionName) || TableHelper._isActionOverloadOnDifferentType(actionName.toString(), targetEntityTypeName));
      const applicablePropertyPath = !forContextMenu ? "aApplicable" : "aApplicableForContextMenu";
      const notApplicablePropertyPath = !forContextMenu ? "aNotApplicable" : "aNotApplicableForContextMenu";
      const contextMenuPath = !forContextMenu ? "" : "contextmenu/";
      return e => {
        const internalContext = this.tableAPI.getBindingContext("internal");
        const params = {
          contexts: !isStaticAction ? internalContext.getProperty(`${contextMenuPath}selectedContexts`) : null,
          bStaticAction: isStaticAction ? isStaticAction : undefined,
          entitySetName: this.collectionEntity.name,
          applicableContexts: !isStaticAction ? internalContext.getProperty(`dynamicActions/${dataField.Action}/${applicablePropertyPath}/`) : null,
          notApplicableContexts: !isStaticAction ? internalContext.getProperty(`dynamicActions/${dataField.Action}/${notApplicablePropertyPath}/`) : null,
          isNavigable: action.isNavigable,
          enableAutoScroll: action.enableAutoScroll,
          defaultValuesExtensionFunction: action.defaultValuesExtensionFunction,
          invocationGrouping: dataField?.InvocationGrouping === "UI.OperationGroupingType/ChangeSet" ? "ChangeSet" : "Isolated",
          controlId: this.tableAPI.contentId,
          operationAvailableMap: this.tableAPI.tableDefinition.operationAvailableMap,
          label: dataField.Label?.valueOf() ?? "",
          model: this.tableAPI.getPageController().getModel(),
          disableStrictHandling: action.disableStrictHandling
        };
        this.tableAPI?.onActionPress(e, this.tableAPI.getPageController(), dataField.Action.valueOf(), params);
      };
    }

    /**
     * Gets the press event handler for an IBN action.
     * @param action
     * @param forContextMenu
     * @returns The event handler.
     */;
    _proto.getDataFieldForIBNPressHandler = function getDataFieldForIBNPressHandler(action, forContextMenu) {
      if (action.annotationPath === undefined) {
        return undefined;
      }
      const dataFieldContext = this.metaModel.createBindingContext(action.annotationPath);
      const dataField = dataFieldContext?.getObject();
      if (!dataField) {
        return undefined;
      }
      const navigateWithConfirmationDialog = this.tableAPI.tableDefinition.enableAnalytics !== true;
      return e => {
        const internalContext = this.tableAPI.getBindingContext("internal");
        const navigationParameters = {};
        navigationParameters.navigationContexts = forContextMenu ? internalContext.getProperty("contextmenu/selectedContexts") : internalContext.getProperty("selectedContexts");
        if (dataField.RequiresContext && !dataField.Inline && navigateWithConfirmationDialog) {
          const applicableProperty = !forContextMenu ? "aApplicable" : "aApplicableForContextMenu";
          const notApplicableProperty = !forContextMenu ? "aNotApplicable" : "aNotApplicableForContextMenu";
          navigationParameters.applicableContexts = internalContext.getProperty(`ibn/${dataField.SemanticObject}-${dataField.Action}/${applicableProperty}/`);
          navigationParameters.notApplicableContexts = internalContext.getProperty(`ibn/${dataField.SemanticObject}-${dataField.Action}/${notApplicableProperty}/`);
          navigationParameters.label = dataField.Label;
        }
        navigationParameters.semanticObjectMapping = dataField.Mapping;
        const controller = this.tableAPI.getPageController();
        if (navigateWithConfirmationDialog) {
          controller?._intentBasedNavigation.navigateWithConfirmationDialog(dataField.SemanticObject, dataField.Action, navigationParameters, e.getSource());
        } else {
          controller?._intentBasedNavigation.navigate(dataField.SemanticObject, dataField.Action, navigationParameters, e.getSource());
        }
      };
    };
    _proto.getExpressionForDataFieldValue = function getExpressionForDataFieldValue(dataField, fullContextPath) {
      const value = dataField?.Value;
      if (!value) {
        return undefined;
      }
      if (typeof value === "string") {
        return value;
      } else {
        const expression = getExpressionFromAnnotation(value);
        if (isConstant(expression) || isPathInModelExpression(expression)) {
          const valueExpression = formatValueRecursively(expression, fullContextPath);
          return compileExpression(valueExpression);
        }
      }
    }

    /**
     * Gets the press event handler for the Delete button.
     * @param forContextMenu
     * @returns The event handler.
     */;
    _proto.getDeleteButtonPressHandler = function getDeleteButtonPressHandler(forContextMenu) {
      const headerInfo = (this.collectionEntity?.entityType || this.collectionEntity?.targetType)?.annotations?.UI?.HeaderInfo;
      const contextMenuPath = !forContextMenu ? "" : "contextmenu/";
      const deletableContextsPath = `${contextMenuPath}deletableContexts`;
      const selectedContextsPath = `${contextMenuPath}selectedContextsIncludingInactive`;
      const numberOfSelectedContextsPath = !forContextMenu ? `numberOfSelectedContexts` : `${contextMenuPath}numberOfSelectedContextsForDelete`;
      const unSavedContextsPath = `${contextMenuPath}unSavedContexts`;
      const lockedContextsPath = `${contextMenuPath}lockedContexts`;
      const draftsWithDeletableActivePath = `${contextMenuPath}draftsWithDeletableActive`;
      const draftsWithNonDeletableActivePath = `${contextMenuPath}draftsWithNonDeletableActive`;
      const titleExpression = this.getExpressionForDataFieldValue(headerInfo?.Title, this.tableAPI.contextObjectPath);
      const descriptionExpression = this.getExpressionForDataFieldValue(headerInfo?.Description, this.tableAPI.contextObjectPath);
      let description;
      if (typeof descriptionExpression === "string" && descriptionExpression.startsWith("{")) {
        description = BindingInfo.parse(descriptionExpression);
      } else {
        description = descriptionExpression;
      }
      return _e => {
        const internalContext = this.tableAPI.getBindingContext("internal");
        const params = {
          id: this.tableAPI.contentId,
          numberOfSelectedContexts: internalContext?.getProperty(numberOfSelectedContextsPath),
          unSavedContexts: internalContext?.getProperty(unSavedContextsPath),
          lockedContexts: internalContext?.getProperty(lockedContextsPath),
          draftsWithDeletableActive: internalContext?.getProperty(draftsWithDeletableActivePath),
          draftsWithNonDeletableActive: internalContext?.getProperty(draftsWithNonDeletableActivePath),
          controlId: internalContext?.getProperty("controlId"),
          title: titleExpression,
          description,
          selectedContexts: internalContext?.getProperty(selectedContextsPath)
        };
        this.tableAPI.getPageController()?.editFlow.deleteMultipleDocuments(internalContext?.getProperty(deletableContextsPath), params);
      };
    }

    /**
     * Get the press event handler for a manifest action button.
     * @param action
     * @param forContextMenu
     * @returns The event handler.
     */;
    _proto.getManifestActionPressHandler = function getManifestActionPressHandler(action, forContextMenu) {
      if (action.noWrap === true) {
        // If noWrap = true, then the action is a slot action (defined in the XML view as an aggregation of the table block)
        const relatedActionElement = this.tableAPI.findSlotActionFromKey(action.key);
        if (relatedActionElement) {
          return e => {
            const internalModelPath = forContextMenu ? "contextmenu/selectedContexts" : "selectedContexts";
            const internalContext = this.tableAPI.getBindingContext("internal");
            const eventParameters = {
              ...e.getParameters(),
              contexts: internalContext.getProperty(internalModelPath)
            };
            relatedActionElement.fireEvent("press", eventParameters);
          };
        } else {
          Log.error("Couldn't find action with key " + action.key);
          return undefined;
        }
      } else {
        return e => {
          const internalModelPath = forContextMenu ? "contextmenu/selectedContexts" : "selectedContexts";
          const internalContext = this.tableAPI.getBindingContext("internal");
          FPMHelper.actionWrapper(e, action.handlerModule, action.handlerMethod, {
            contexts: internalContext.getProperty(internalModelPath)
          }).catch(err => {
            Log.error("Error while executing custom action", err);
          });
        };
      }
    }

    /**
     * Get the press event handler for the mass edit button.
     * @param forContextMenu
     * @returns The event handler.
     */;
    _proto.getMassEditButtonPressHandler = function getMassEditButtonPressHandler(forContextMenu) {
      return e => {
        this.tableAPI.onMassEditButtonPressed(e, forContextMenu);
      };
    }

    /**
     * Get the press event handler for the move up / move down buttons.
     * @param forMoveUp
     * @param forContextMenu
     * @returns The event handler.
     */;
    _proto.getMoveUpDownHandler = function getMoveUpDownHandler(forMoveUp, forContextMenu) {
      return e => {
        this.tableAPI.onMoveUpDown(e, forMoveUp, forContextMenu);
      };
    }

    /**
     * Gets the event handler for the Paste action.
     * @param forContextMenu
     * @returns The event handler.
     */;
    _proto.getPasteHandler = function getPasteHandler(forContextMenu) {
      const controller = this.tableAPI.getPageController();
      return e => {
        this.tableAPI.onPaste(e, controller, forContextMenu);
      };
    };
    return TableEventHandlerProvider;
  }();
  _exports = TableEventHandlerProvider;
  return _exports;
}, false);
//# sourceMappingURL=TableEventHandlerProvider-dbg.js.map
