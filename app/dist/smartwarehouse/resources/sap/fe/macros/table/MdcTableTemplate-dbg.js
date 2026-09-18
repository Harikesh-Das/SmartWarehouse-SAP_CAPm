/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/core/CommonUtils", "sap/fe/core/controls/CommandExecution", "sap/fe/core/controls/FormElementWrapper", "sap/fe/core/converters/ManifestSettings", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/converters/controls/Common/table/StandardActions", "sap/fe/core/converters/helpers/DataFieldHelper", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/ActionCommand", "sap/fe/macros/CommonHelper", "sap/fe/macros/Field", "sap/fe/macros/MultiValueField", "sap/fe/macros/TSXUtils", "sap/fe/macros/draftIndicator/DraftIndicator", "sap/fe/macros/field/FieldHelper", "sap/fe/macros/field/FieldTemplating", "sap/fe/macros/internal/helpers/ActionHelper", "sap/fe/macros/situations/SituationsIndicator", "sap/fe/macros/table/ActionsTemplating", "sap/fe/macros/table/QuickFilterSelector", "sap/fe/macros/table/SlotColumn", "sap/fe/macros/table/TableHelper", "sap/fe/macros/table/uploadTable/UploadTableTemplate", "sap/m/FlexItemData", "sap/m/HBox", "sap/m/Label", "sap/m/Menu", "sap/m/MenuItem", "sap/m/ObjectStatus", "sap/m/Text", "sap/m/VBox", "sap/m/library", "sap/m/plugins/CellSelector", "sap/m/plugins/ColumnAIAction", "sap/m/plugins/ContextMenuSetting", "sap/m/plugins/CopyProvider", "sap/m/plugins/DataStateIndicator", "sap/ui/core/Lib", "sap/ui/core/library", "sap/ui/fl/variants/VariantManagement", "sap/ui/mdc/Table", "sap/ui/mdc/actiontoolbar/ActionToolbarAction", "sap/ui/mdc/enums/TableP13nMode", "sap/ui/mdc/enums/TableRowActionType", "sap/ui/mdc/p13n/PersistenceProvider", "sap/ui/mdc/table/Column", "sap/ui/mdc/table/CreationRow", "sap/ui/mdc/table/DragDropConfig", "sap/ui/mdc/table/GridTableType", "sap/ui/mdc/table/ResponsiveColumnSettings", "sap/ui/mdc/table/ResponsiveTableType", "sap/ui/mdc/table/RowActionItem", "sap/ui/mdc/table/RowSettings", "sap/ui/mdc/table/TreeTableType", "../MicroChart", "../field/FieldFormatOptions", "./ColumnHelper", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (Log, BindingToolkit, CommonUtils, CommandExecution, FormElementWrapper, ManifestSettings, MetaModelConverter, DataField, StandardActions, DataFieldHelper, BindingHelper, ModelHelper, StableIdHelper, TypeGuards, DataModelPathHelper, UIFormatters, ActionCommand, CommonHelper, Field, MultiValueFieldBlock, TSXUtils, DraftIndicator, FieldHelper, FieldTemplating, ActionHelper, SituationsIndicator, ActionsTemplating, QuickFilterSelector, SlotColumn, TableHelper, UploadTableTemplate, FlexItemData, HBox, Label, Menu, MenuItem, ObjectStatus, Text, VBox, library, CellSelector, ColumnAIAction, ContextMenuSetting, CopyProvider, DataStateIndicator, Library, coreLibrary, VariantManagement, MDCTable, ActionToolbarAction, TableP13nMode, TableRowActionType, PersistenceProvider, Column, CreationRow, DragDropConfig, GridTableType, ResponsiveColumnSettings, ResponsiveTableType, RowActionItem, RowSettings, TreeTableType, MicroChart, FieldFormatOptions, ColumnHelper, _jsx, _jsxs) {
  "use strict";

  var _exports = {};
  var Priority = coreLibrary.Priority;
  var PlacementType = library.PlacementType;
  var ObjectMarkerVisibility = library.ObjectMarkerVisibility;
  var getUploadPlugin = UploadTableTemplate.getUploadPlugin;
  var getTableContextMenuTemplate = ActionsTemplating.getTableContextMenuTemplate;
  var getTableActionsTemplate = ActionsTemplating.getTableActionsTemplate;
  var getFullScreen = ActionsTemplating.getFullScreen;
  var getAnalyticalRefreshButton = ActionsTemplating.getAnalyticalRefreshButton;
  var getVisibleExpression = FieldTemplating.getVisibleExpression;
  var getDraftIndicatorVisibleBinding = FieldTemplating.getDraftIndicatorVisibleBinding;
  var createCustomDatas = TSXUtils.createCustomDatas;
  var createCustomData = TSXUtils.createCustomData;
  var getCommandExecutionForAction = ActionCommand.getCommandExecutionForAction;
  var isMultiValueField = UIFormatters.isMultiValueField;
  var isPathUpdatable = DataModelPathHelper.isPathUpdatable;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isSingleton = TypeGuards.isSingleton;
  var isAnnotationOfType = TypeGuards.isAnnotationOfType;
  var isAnnotationOfTerm = TypeGuards.isAnnotationOfTerm;
  var generate = StableIdHelper.generate;
  var singletonPathVisitor = BindingHelper.singletonPathVisitor;
  var UI = BindingHelper.UI;
  var Entity = BindingHelper.Entity;
  var getConnectedFieldsData = DataFieldHelper.getConnectedFieldsData;
  var StandardActionKeys = StandardActions.StandardActionKeys;
  var isDataFieldForAnnotation = DataField.isDataFieldForAnnotation;
  var isDataField = DataField.isDataField;
  var hasDataPointTarget = DataField.hasDataPointTarget;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var CreationMode = ManifestSettings.CreationMode;
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var notEqual = BindingToolkit.notEqual;
  var not = BindingToolkit.not;
  var isTruthy = BindingToolkit.isTruthy;
  var isConstant = BindingToolkit.isConstant;
  var ifElse = BindingToolkit.ifElse;
  var greaterThan = BindingToolkit.greaterThan;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  /**
   * Generates the table type for the table.
   * @param tableDefinition
   * @param _collection
   * @param tableType
   * @param selectionLimit
   * @returns The table type
   */
  function getTableType(tableDefinition, _collection, tableType, selectionLimit) {
    const collection = _collection.getObject();
    switch (tableType) {
      case "GridTable":
        return _jsx(GridTableType, {
          rowCountMode: tableDefinition.control.rowCountMode,
          rowCount: tableDefinition.control.rowCount,
          selectionLimit: selectionLimit,
          fixedColumnCount: tableDefinition.control.frozenColumnCount,
          scrollThreshold: tableDefinition.control.scrollThreshold,
          enableColumnFreeze: tableDefinition.control.enableColumnFreeze
        });
      case "TreeTable":
        return _jsx(TreeTableType, {
          rowCountMode: tableDefinition.control.rowCountMode,
          rowCount: tableDefinition.control.rowCount,
          selectionLimit: selectionLimit,
          fixedColumnCount: tableDefinition.control.frozenColumnCount,
          scrollThreshold: tableDefinition.control.scrollThreshold,
          enableColumnFreeze: tableDefinition.control.enableColumnFreeze
        });
      default:
        return _jsx(ResponsiveTableType, {
          showDetailsButton: true,
          detailsButtonSetting: [Priority.Low, Priority.Medium, Priority.None],
          growingMode: collection.$kind === "EntitySet" ? "Scroll" : undefined,
          popinLayout: tableDefinition.control.popinLayout
        });
    }
  }

  /**
   * Generates the DataSateIndicator for the table.
   * @param handlerProvider
   * @returns The datastate indicator
   */
  function getDataStateIndicator(handlerProvider) {
    return _jsx(DataStateIndicator, {
      filter: handlerProvider.dataStateIndicatorFilter,
      enabled: compileExpression(not(equal(pathInModel("enableTableDataStateIndicator", "pageInternal"), false))),
      enableFiltering: true,
      dataStateChange: handlerProvider.dataStateChange
    });
  }

  /**
   * Generates the binding expression for the drag and drop enablement.
   * @param contextObjectPath
   * @param tableDefinition
   * @returns The binding expression
   */
  function getDragAndDropEnabled(contextObjectPath, tableDefinition) {
    const isPathUpdatableOnNavigation = isPathUpdatable(contextObjectPath, {
      ignoreTargetCollection: true,
      authorizeUnresolvable: true,
      pathVisitor: (path, navigationPaths) => singletonPathVisitor(path, contextObjectPath.convertedTypes, navigationPaths)
    });
    const isPathUpdatableOnTarget = isPathUpdatable(contextObjectPath, {
      authorizeUnresolvable: true,
      pathVisitor: (path, navigationPaths) => singletonPathVisitor(path, contextObjectPath.convertedTypes, navigationPaths)
    });
    if (contextObjectPath.startingEntitySet === contextObjectPath.targetEntitySet) {
      // ListReport case: we allow drag and drop on draft-enabled entities
      if (contextObjectPath.startingEntitySet.annotations.Common?.DraftRoot !== undefined) {
        return and(isPathUpdatableOnNavigation._type === "Unresolvable" ? ifElse(isConstant(isPathUpdatableOnTarget), isPathUpdatableOnTarget, constant(true)) : isPathUpdatableOnNavigation, tableDefinition.control.isHierarchyParentNodeUpdatable);
      } else {
        return constant(false);
      }
    } else {
      // ObjectPage case: we allow drag and drop in edit mode
      return and(isPathUpdatableOnNavigation._type === "Unresolvable" ? ifElse(isConstant(isPathUpdatableOnTarget), isPathUpdatableOnTarget, constant(true)) : isPathUpdatableOnNavigation, UI.IsEditable, tableDefinition.control.isHierarchyParentNodeUpdatable);
    }
  }
  function getCustomDataForClipboardActions(tableProperties) {
    const tableType = tableProperties.tableDefinition.control.type;
    const data = [];
    if (tableType !== "TreeTable") {
      return data;
    }
    const tableDefinition = tableProperties.tableDefinition;
    const cutAction = tableDefinition.actions.find(a => a.key === StandardActionKeys.Cut);
    if (cutAction?.isTemplated === "true") {
      data.push({
        key: "TreeCutEnablement",
        value: cutAction.enabled
      });
    }
    const copyAction = tableDefinition.actions.find(a => a.key === StandardActionKeys.Copy);
    if (copyAction?.isTemplated === "true") {
      data.push({
        key: "TreeCopyEnablement",
        value: copyAction.enabled
      });
    }
    const pasteAction = tableDefinition.actions.find(a => a.key === StandardActionKeys.Paste);
    if (pasteAction && pasteAction.visible !== "false") {
      data.push({
        key: "TreePasteEnablement",
        value: pasteAction.enabled
      });
    }
    return data;
  }
  function getDependents(tableProperties, parameters, variantManagement, collection) {
    const id = tableProperties.contentId;
    const tableDefinition = tableProperties.tableDefinition;
    const tableType = tableProperties.tableDefinition.control.type;
    const handlerProvider = parameters.handlerProvider;
    const dependents = [];
    const createAction = tableDefinition.actions.find(a => a.key === StandardActionKeys.Create);
    const deleteAction = tableDefinition.actions.find(a => a.key === StandardActionKeys.Delete);
    if (tableDefinition.annotation.isInsertUpdateActionsTemplated && createAction?.isTemplated === "true" && tableDefinition.control.nodeType === undefined && tableDefinition.control.enableUploadPlugin === false) {
      // The shortcut is not enabled in case of a create menu (i.e. when nodeType is defined)
      dependents.push(_jsx(CommandExecution, {
        execute: handlerProvider.getCreateButtonPressHandler(false, false),
        visible: createAction.visible,
        enabled: createAction.enabled,
        command: "Create"
      }));
    }
    if (deleteAction?.isTemplated === "true") {
      dependents.push(_jsx(CommandExecution, {
        execute: handlerProvider.getDeleteButtonPressHandler(false),
        visible: deleteAction.visible,
        enabled: deleteAction.enabled,
        command: "DeleteEntry"
      }));
    }

    // Move up and down actions
    const moveUpAction = tableDefinition.actions.find(a => a.key === StandardActionKeys.MoveUp);
    const moveDownAction = tableDefinition.actions.find(a => a.key === StandardActionKeys.MoveDown);
    if (moveUpAction && moveDownAction && moveUpAction.visible !== "false" && moveDownAction.visible !== "false" && tableType === "TreeTable") {
      dependents.push(_jsx(CommandExecution, {
        execute: handlerProvider.getMoveUpDownHandler(true, false),
        command: "TableMoveElementUp",
        enabled: moveUpAction.enabled
      }));
      dependents.push(_jsx(CommandExecution, {
        execute: handlerProvider.getMoveUpDownHandler(false, false),
        command: "TableMoveElementDown",
        enabled: moveDownAction.enabled
      }));
    }
    for (const actionName in tableDefinition.commandActions) {
      const action = tableDefinition.commandActions[actionName];
      const actionCommand = getActionCommand(actionName, action, parameters, collection, tableDefinition);
      if (actionCommand) {
        dependents.push(actionCommand);
      }
    }
    if (variantManagement === "None") {
      // Persistence provider offers persisting personalization changes without variant management
      dependents.push(_jsx(PersistenceProvider, {
        id: generate([id, "PersistenceProvider"]),
        for: id,
        mode: "Transient"
      }));
    }
    dependents.push(_jsx(ContextMenuSetting, {
      scope: "Selection"
    }));
    if (tableDefinition.control.enableUploadPlugin === true) {
      dependents.push(getUploadPlugin(tableDefinition, id, handlerProvider, tableProperties.uploadConfiguration));
    }
    return dependents;
  }
  function getTableActionsAggregation(table, parameters) {
    const actions = [];
    if (table.displaySegmentedButton) {
      actions.push(_jsx(ActionToolbarAction, {
        id: generate([table.contentId, "ContentSwitcher"]),
        layoutInformation: {
          aggregationName: "end",
          alignment: "End"
        }
      }));
    }
    const fullScreenButton = getFullScreen(table);
    if (fullScreenButton) {
      actions.push(fullScreenButton);
    }
    const refreshButton = getAnalyticalRefreshButton(table, parameters.handlerProvider);
    if (refreshButton) {
      actions.push(refreshButton);
    }
    return actions.length > 0 ? actions : undefined;
  }

  /**
   * Returns the table actions.
   * @param table
   * @param parameters
   * @param collectionContext
   * @param collectionEntity
   * @returns The list of actions
   */
  function getActions(table, parameters, collectionContext, collectionEntity) {
    const actions = getTableActionsTemplate(table, parameters, collectionContext, collectionEntity);
    return actions.length > 0 ? actions : undefined;
  }
  function getRowSettings(tableDefinition, rowActionType, handlerProvider) {
    const rowActionItem = _jsx(RowActionItem, {
      type: "Navigation",
      press: handlerProvider.rowPress,
      visible: tableDefinition.annotation.row?.visible
    });
    return _jsx(RowSettings, {
      navigated: tableDefinition.annotation.row?.rowNavigated,
      highlight: tableDefinition.annotation.row?.rowHighlighting,
      highlightText: tableDefinition.annotation.row?.rowHighlighting,
      children: {
        rowActions: rowActionType === TableRowActionType.Navigation ? rowActionItem : undefined
      }
    });
  }

  /**
   * Generates the context menu for the table.
   * @param tableProperties
   * @param parameters
   * @param collectionEntity
   * @param rowActionType
   * @param collection
   * @param navigationInEditMode
   * @returns The context menu
   */
  _exports.getRowSettings = getRowSettings;
  function getContextMenu(tableProperties, parameters, collectionEntity, rowActionType, collection, navigationInEditMode) {
    const menuItems = getTableContextMenuTemplate(tableProperties, parameters, collection, collectionEntity);
    if (rowActionType === TableRowActionType.Navigation && !navigationInEditMode) {
      menuItems.push(getSharetoCollaborationManagerTemplate(parameters.handlerProvider, tableProperties.contentId));
      menuItems.push(getOpenInNewTabTemplate(parameters.handlerProvider));
    }
    if (menuItems.length > 0) {
      return _jsx(Menu, {
        itemSelected: parameters.handlerProvider.contextMenuItemSelected,
        children: {
          items: menuItems
        }
      });
    }
    return undefined;
  }

  /**
   * Generates the template string for the MenuItem.
   * @param handlerProvider
   * @param tableId
   * @returns The XML string representation for the MenuItem
   */
  function getSharetoCollaborationManagerTemplate(handlerProvider, tableId) {
    // The visible property will be set at runtime when the collaboration manager is available and all other conditions are met
    return _jsx(MenuItem, {
      "core:require": "{API: 'sap/fe/macros/Table'}",
      startsSection: true,
      id: generate([tableId, "ContextMenu", "CollaborationManager"]),
      text: "{sap.fe.i18n>M_COMMON_TABLE_CONTEXT_MENU_SHARE_TO_COLLABORATION_MANAGER}",
      press: handlerProvider.contextMenuShareToCollaborationManager,
      enabled: "{= ${internal>contextmenu/numberOfSelectedContexts} > 0}",
      visible: false
    });
  }

  /**
   * Generates the template string for the MenuItem.
   * @param handlerProvider
   * @returns The xml string representation for the MenuItem
   */
  function getOpenInNewTabTemplate(handlerProvider) {
    // The 'Open in New Tab' action should not be visible for sticky sessions in edit mode
    // For the context menu, the visibility should also consider the 'inactiveContext' property:
    // only when at least one selected context is active (i.e. "contextmenu/inactiveContext" is false), the action should be visible in the context menu
    // The second is only relevant when the table manifest setting "creationMode" is "InlineCreationRows"
    const visible = and(not(and(pathInModel("/sessionOn", "internal"), UI.IsEditable)), not(pathInModel("contextmenu/inactiveContext", "internal")));
    return _jsx(MenuItem, {
      "core:require": "{API: 'sap/fe/macros/Table'}",
      startsSection: true,
      text: "{sap.fe.i18n>M_COMMON_TABLE_CONTEXT_MENU_OPEN_IN_NEW_TAB}",
      press: handlerProvider.contextMenuOpenInNewTab,
      enabled: greaterThan(pathInModel("contextmenu/numberOfNavigableContexts", "internal"), 0),
      visible: visible
    });
  }

  /**
   * Generates the VariantManagement for the table.
   * @param variantManagement
   * @param id
   * @param headerLevel
   * @param handlerProvider
   * @returns The VariantManagement control
   */
  function getVariantManagement(variantManagement, id, headerLevel, handlerProvider) {
    if (variantManagement === "Control") {
      return _jsx(VariantManagement, {
        id: generate([id, "VM"]),
        showSetAsDefault: true,
        select: handlerProvider.variantSelected,
        headerLevel: headerLevel,
        save: handlerProvider.variantSaved,
        for: [id]
      });
    }
    return undefined;
  }

  /**
   * Generates the QuickVariantSelection control for the table.
   * @param tableProperties The table properties
   * @returns The QuickVariantSelection control
   */
  function getQuickFilter(tableProperties) {
    const quickFilters = tableProperties.tableDefinition.control.filters?.quickFilters;
    if (quickFilters) {
      return _jsx(QuickFilterSelector, {
        id: generate([tableProperties.contentId, "QuickFilterContainer"]),
        paths: quickFilters.paths.map(path => path.annotationPath),
        showCounts: quickFilters.showCounts
      });
    }
    return undefined;
  }

  /**
   * Generates CopyProvider for the table.
   * @param tableProperties
   * @returns The CopyProvider
   */
  function getCopyProvider(tableProperties) {
    const contextObjectPath = tableProperties.contextObjectPath;
    let visibleExpression;
    if (tableProperties.tableDefinition.control.disableCopyToClipboard) {
      visibleExpression = constant(false);
    } else if (tableProperties.tableDefinition.control.type === "TreeTable") {
      // For a TreeTable, the copy button shall be visible only when drag and drop is disabled
      if (contextObjectPath.startingEntitySet === contextObjectPath.targetEntitySet) {
        // ListReport: enable copy if the entity is not draft-enabled
        visibleExpression = constant(contextObjectPath.startingEntitySet.annotations.Common?.DraftRoot === undefined);
      } else {
        // ObjectPage: enable copy in read-only
        visibleExpression = not(UI.IsEditable);
      }
    } else {
      visibleExpression = constant(true);
    }
    return _jsx(CopyProvider, {
      visible: visibleExpression
    });
  }

  /**
   * Generates the CellSelector for the table.
   * @param tableProperties
   * @param handlerProvider
   * @returns The CellSelector
   */
  function getCellSelector(tableProperties, handlerProvider) {
    const tableType = tableProperties.tableDefinition.control.type;
    if (!tableProperties.tableDefinition.control.disableCopyToClipboard && tableType && ["ResponsiveTable", "GridTable", "TreeTable"].includes(tableType)) {
      return _jsx(CellSelector, {
        enabled: or(tableType !== "TreeTable", not(getDragAndDropEnabled(tableProperties.contextObjectPath, tableProperties.tableDefinition))),
        rangeLimit: 200,
        selectionChange: handlerProvider.cellsSelectionHandler
      });
    }
    return undefined;
  }

  /**
   * Generates the CreationRow for the table.
   * @param tableProperties
   * @param handlerProvider
   * @returns The CreationRow
   */
  function getCreationRow(tableProperties, handlerProvider) {
    if (tableProperties.creationMode?.name === CreationMode.CreationRow) {
      const creationRowAction = tableProperties.tableDefinition.actions.find(a => a.key === StandardActionKeys.CreationRow);
      if (creationRowAction?.isTemplated) {
        const customData = createCustomDatas([{
          key: "disableAddRowButtonForEmptyData",
          value: tableProperties.tableDefinition.control.disableAddRowButtonForEmptyData
        }, {
          key: "customValidationFunction",
          value: tableProperties.tableDefinition.control.customValidationFunction
        }]);
        return _jsx(CreationRow, {
          id: generate([tableProperties.contentId, CreationMode.CreationRow]),
          visible: creationRowAction.visible,
          apply: handlerProvider.getCreateButtonPressHandler(false, true),
          applyEnabled: creationRowAction.enabled,
          children: {
            customData: customData
          }
        });
      }
    }
    return undefined;
  }

  /**
   * Generates the drag and drop config for the table.
   * @param tableProperties
   * @param handlerProvider
   * @returns The drag and drop config
   */
  function getDragAndDropConfig(tableProperties, handlerProvider) {
    if (tableProperties.tableDefinition.control.type === "TreeTable") {
      return _jsx(DragDropConfig, {
        enabled: compileExpression(getDragAndDropEnabled(tableProperties.contextObjectPath, tableProperties.tableDefinition)),
        dropPosition: tableProperties.tableDefinition.annotation.allowDropBetweenNodes === true ? "OnOrBetween" : "On",
        draggable: true,
        droppable: true,
        dragStart: handlerProvider.dragStartDocument,
        dragEnter: handlerProvider.dragEnterDocument,
        drop: handlerProvider.dropDocument
      });
    }
    return undefined;
  }

  /**
   * Generates an actionCommand for the table.
   * @param actionName The name of the action
   * @param action Action to be evaluated
   * @param parameters
   * @param collection
   * @param tableDefinition
   * @returns The actionCommand
   */
  function getActionCommand(actionName, action, parameters, collection, tableDefinition) {
    const dataField = action.annotationPath ? parameters.convertedMetadata.resolvePath(action.annotationPath).target : undefined;
    const actionContextPath = action.annotationPath ? CommonHelper.getActionContext(parameters.metaModel.createBindingContext(action.annotationPath + "/Action")) : undefined;
    const actionContext = actionContextPath ? parameters.metaModel.createBindingContext(actionContextPath) : undefined;
    const dataFieldDataModelObjectPath = actionContext ? getInvolvedDataModelObjects(actionContext, collection) : undefined;
    const isBound = dataField?.ActionTarget?.isBound;
    const isOperationAvailable = dataField?.ActionTarget?.annotations?.Core?.OperationAvailable?.valueOf() !== false;
    const displayCommandAction = action.type === "ForAction" ? isBound !== true || isOperationAvailable : true;
    if (displayCommandAction) {
      const actionParameters = {
        onExecuteAction: parameters.handlerProvider.getDataFieldForActionButtonPressHandler(dataField, action, false),
        onExecuteIBN: parameters.handlerProvider.getDataFieldForIBNPressHandler(action, false),
        onExecuteManifest: parameters.handlerProvider.getManifestActionPressHandler(action, false),
        isIBNEnabled: action.enabled ?? TableHelper.isDataFieldForIBNEnabled({
          collection: collection,
          tableDefinition: tableDefinition
        }, dataField, !!dataField.RequiresContext, dataField.NavigationAvailable, false),
        isActionEnabled: action.enabled ?? TableHelper.isDataFieldForActionEnabled(tableDefinition, dataField.Action, !!isBound, actionContextPath, action.enableOnSelect, dataFieldDataModelObjectPath?.targetEntityType, false),
        isEnabled: action.enabled
      };
      return getCommandExecutionForAction(action.command, tableDefinition.commandActions[actionName], actionParameters);
    }
    return undefined;
  }

  /**
   * Generates the template string for the required modules.
   * @param tableDefinition
   * @returns The list of required modules
   */
  function getCoreRequire(tableDefinition) {
    const customModules = tableDefinition.control.additionalRequiredModules ?? [];
    return `{TableRuntime: 'sap/fe/macros/table/TableRuntime', API: 'sap/fe/macros/Table'${customModules.map((module, index) => `, customModule${index + 1}: '${module}'`).join("")}}`;
  }

  /**
   * Create the template for a computed column.
   * This represents the DraftIndicator and the SituationsIndicator.
   * @param tableId The table ID
   * @param column The computed column definition
   * @param collection The collection context used for context path
   * @param enableAnalytics Whether analytics are enabled
   * @returns The computed column.
   */
  function getComputedColumn(tableId, column, collection, enableAnalytics) {
    if (column.isDraftIndicator) {
      return _jsx(Column, {
        id: generate([tableId, "C", "computedColumns", "draftStatus"]),
        headerVisible: false,
        propertyKey: column.name,
        header: column.label,
        tooltip: column.tooltip,
        width: "3em",
        children: _jsx(DraftIndicator, {
          draftIndicatorType: ObjectMarkerVisibility.IconOnly,
          contextPath: collection.getPath(),
          visible: or(not(Entity.IsActive), Entity.HasDraft),
          usedInTable: true,
          usedInAnalyticalTable: enableAnalytics
        })
      });
    } else if (column.isSituationsIndicator) {
      return _jsx(Column, {
        id: generate([tableId, "C", "computedColumns", "situationsIndicator"]),
        propertyKey: column.name,
        header: column.label,
        tooltip: column.tooltip,
        headerVisible: false,
        width: "4em",
        children: _jsx(SituationsIndicator, {
          contextPath: collection.getPath()
        })
      });
    } else {
      return undefined;
    }
  }

  /**
   * Create the template for a slot column.
   * This column will either reuse a template control that is defined at runtime (templateId case), or define a slot where the XML content is copied.
   * @param tableId The table ID
   * @param column The slot column definition
   * @param isReadOnly Whether the table is read only
   * @param tableProperties The properties of the Table building block
   * @returns The slot column.
   */
  _exports.getComputedColumn = getComputedColumn;
  function getSlotColumn(tableId, column, isReadOnly, tableProperties) {
    let template;
    const dependents = [];
    const columnInstance = tableProperties.columns?.find(col => col.key === column.key);
    if (typeof column.template === "string") {
      template = column.template.startsWith("<") ? column.template : _jsx(SlotColumn, {
        templateId: tableProperties.isA?.("sap.fe.macros.Table") // V4 workflow
        ? columnInstance?.getAggregation("template")?.getId?.() : column.template //V2 workflow
      });
    } else {
      template = column.template?.clone(); // We need to clone the control: the original stays under the column block definition and the clone is used in the MDC table
    }
    const aiNotice = getColumnHeaderAiNotice(column, tableProperties);
    if (aiNotice) {
      dependents.push(aiNotice);
    }
    return _jsx(Column, {
      id: generate([tableId, "C", column.id]),
      propertyKey: column.name,
      width: column.width,
      hAlign: column.horizontalAlign,
      header: column.header,
      tooltip: column.tooltip,
      required: isReadOnly ? undefined : column.required,
      children: {
        dependents,
        extendedSettings: _jsx(ResponsiveColumnSettings, {
          importance: column.importance
        }),
        template: template
      }
    });
  }

  /**
   * Create the template for the DraftIndicator.
   * @param collection The context of the collection
   * @param column The column definition
   * @returns The XML string representing the DraftIndicator.
   */
  _exports.getSlotColumn = getSlotColumn;
  function getDraftIndicator(collection, column) {
    if (collection.getObject("@com.sap.vocabularies.Common.v1.DraftRoot") && collection.getObject("./@com.sap.vocabularies.Common.v1.SemanticKey") && column.formatOptions?.fieldGroupDraftIndicatorPropertyPath) {
      return _jsx(FormElementWrapper, {
        children: _jsx(DraftIndicator, {
          draftIndicatorType: ObjectMarkerVisibility.IconAndText,
          contextPath: collection.getPath(),
          visible: getDraftIndicatorVisibleBinding(column.formatOptions?.fieldGroupName),
          ariaLabelledBy: ["this>ariaLabelledBy"]
        })
      });
    }
    return undefined;
  }

  /**
   * Create the SituationIndicator ObjectStatus.
   * @param collection The context of the collection
   * @param column The column definition
   * @returns The ObjectStatus.
   */
  _exports.getDraftIndicator = getDraftIndicator;
  function getSituationIndicator(collection, column) {
    if (collection.getObject("./@com.sap.vocabularies.Common.v1.SemanticKey") && column.formatOptions?.fieldGroupDraftIndicatorPropertyPath) {
      return _jsx(ObjectStatus, {
        visible: column.formatOptions?.showErrorObjectStatus,
        class: "sapUiSmallMarginBottom",
        text: "{sap.fe.i18n>Contains_Errors}",
        state: "Error"
      });
    }
    return undefined;
  }

  /**
   * Determines the default date-time format style based on the given data field context.
   * @param dataFieldContext The context of the data field
   * @returns Returns 'short' if the underlying data field is of the type 'Edm.TimeOfDay', otherwise undefined.
   */
  function getDefaultDateTimeStyle(dataFieldContext) {
    const targetObject = getInvolvedDataModelObjects(dataFieldContext).targetObject;
    if (isDataField(targetObject) && targetObject.Value?.$target?.type === "Edm.TimeOfDay") {
      return "short";
    }
    if (isDataFieldForAnnotation(targetObject) && hasDataPointTarget(targetObject) && targetObject.Target.$target?.Value.$target.type === "Edm.TimeOfDay") {
      return "short";
    }
  }

  /**
   * Create the template for the creation row.
   * @param tableId The table ID
   * @param column The column definition
   * @param tableType The type of the table
   * @param creationMode The creation mode
   * @param isTableReadOnly Whether the table is read only
   * @param collection The collection context
   * @param dataField The data field context
   * @param fieldMode The field mode
   * @param enableAnalytics Whether analytics are enabled
   * @param handlerProvider
   * @returns The XML string representing the creation row.
   */
  function getCreationTemplate(tableId, column, tableType, creationMode, isTableReadOnly, collection, dataField, fieldMode, enableAnalytics, handlerProvider) {
    if (creationMode?.name === "CreationRow") {
      let columnEditMode;
      switch (isTableReadOnly) {
        case true:
          columnEditMode = "Display";
          break;
        case false:
          columnEditMode = "Editable";
          break;
        default:
          columnEditMode = undefined;
          break;
      }
      const dataFieldObject = dataField.getObject();
      const reactiveAreaMode = tableType === "ResponsiveTable" ? "Overlay" : undefined;
      const formatOptions = {
        fieldMode: fieldMode,
        textLinesEdit: column.formatOptions?.textLinesEdit,
        textMaxLines: column.formatOptions?.textMaxLines === undefined ? undefined : column.formatOptions?.textMaxLines,
        textMaxLength: column.formatOptions?.textMaxLength,
        textMaxCharactersDisplay: column.formatOptions?.textMaxCharactersDisplay,
        textExpandBehaviorDisplay: column.formatOptions?.textExpandBehaviorDisplay,
        textAlignMode: "Table",
        semanticKeyStyle: tableType === "ResponsiveTable" ? "ObjectIdentifier" : "Label",
        hasDraftIndicator: column.formatOptions?.hasDraftIndicator,
        fieldGroupDraftIndicatorPropertyPath: column.formatOptions?.fieldGroupDraftIndicatorPropertyPath,
        fieldGroupName: column.formatOptions?.fieldGroupName,
        showIconUrl: dataFieldObject?.Inline && !!dataFieldObject?.IconUrl,
        ignoreNavigationAvailable: enableAnalytics ?? false,
        isCurrencyOrUnitAligned: true,
        dateTimeStyle: getDefaultDateTimeStyle(dataField),
        reactiveAreaMode: reactiveAreaMode
      };
      return _jsx(Field, {
        "core:require": "{TableRuntime: 'sap/fe/macros/table/TableRuntime'}",
        vhIdPrefix: generate([tableId, "TableValueHelp"]),
        editMode: columnEditMode,
        contextPath: collection.getPath(),
        metaPath: dataField.getPath(),
        wrap: tableType === "ResponsiveTable",
        change: handlerProvider.fieldChangeInCreationRow,
        showErrorObjectStatus: column.formatOptions?.showErrorObjectStatus,
        children: {
          formatOptions: _jsx(FieldFormatOptions, {
            ...formatOptions
          })
        }
      });
    }
    return undefined;
  }

  /**
   * Retrieves the template for the macros:Field inside the column.
   * @param tableId The table ID
   * @param tableDefinition The table definition
   * @param column The column definition
   * @param dataFieldContext The data field context
   * @param dataFieldObjectPath The data field object path
   * @param collection The collection context
   * @param enableAnalytics Whether analytics are enabled
   * @param tableType The type of the table
   * @param isTableReadOnly Whether the table is read only
   * @param creationMode The creation mode
   * @param fieldMode The field mode
   * @param isCompactType Whether the table is compact
   * @param textAlign The text alignment
   * @param ariaLabelledBy The aria labelled by
   * @param showEmptyIndicator Whether to show the empty indicator
   * @param className
   * @param handlerProvider The handler provider
   * @param isConnectedField Indicates if the field is a connected field
   * @returns The XML string representing the field.
   */
  function getMacroFieldTemplate(tableId, tableDefinition, column, dataFieldContext, dataFieldObjectPath, collection, enableAnalytics, tableType, isTableReadOnly, creationMode, fieldMode, isCompactType, textAlign, ariaLabelledBy, showEmptyIndicator, className, handlerProvider) {
    let isConnectedField = arguments.length > 17 && arguments[17] !== undefined ? arguments[17] : false;
    const dataFieldObject = dataFieldContext.getObject();
    let columnEditMode;
    switch (isTableReadOnly) {
      case true:
        columnEditMode = "Display";
        break;
      case false:
        columnEditMode = "Editable";
        break;
      default:
        columnEditMode = undefined;
    }
    if (tableDefinition.control.enableUploadPlugin && column.typeConfig?.className === "Edm.Stream") {
      columnEditMode = "Display";
    }
    const reactiveAreaMode = tableDefinition.control.type === "ResponsiveTable" ? "Overlay" : undefined;
    const formatOptions = {
      fieldMode: fieldMode,
      textLinesEdit: column.formatOptions?.textLinesEdit,
      textMaxLines: column.formatOptions?.textMaxLines === undefined ? undefined : column.formatOptions?.textMaxLines,
      textMaxCharactersDisplay: column.formatOptions?.textMaxCharactersDisplay,
      textMaxLength: column.formatOptions?.textMaxLength,
      textExpandBehaviorDisplay: column.formatOptions?.textExpandBehaviorDisplay,
      textAlignMode: "Table",
      showEmptyIndicator: showEmptyIndicator,
      semanticKeyStyle: tableType === "ResponsiveTable" ? "ObjectIdentifier" : "Label",
      hasDraftIndicator: column.formatOptions?.hasDraftIndicator,
      fieldGroupDraftIndicatorPropertyPath: column.formatOptions?.fieldGroupDraftIndicatorPropertyPath,
      fieldGroupName: column.formatOptions?.fieldGroupName,
      showIconUrl: dataFieldObject?.Inline && !!dataFieldObject?.IconUrl,
      ignoreNavigationAvailable: enableAnalytics ?? false,
      isAnalytics: enableAnalytics,
      forInlineCreationRows: creationMode?.name === "InlineCreationRows",
      isCurrencyOrUnitAligned: isConnectedField ? false : true,
      compactSemanticKey: isCompactType === undefined ? undefined : `${isCompactType}`,
      dateTimeStyle: getDefaultDateTimeStyle(dataFieldContext),
      isAnalyticalAggregatedRow: tableDefinition.control.analyticalConfiguration?.aggregationOnLeafLevel,
      reactiveAreaMode: reactiveAreaMode,
      createAssociatedAriaLabel: isConnectedField ? true : undefined,
      imageFitType: column.formatOptions?.imageFitType,
      enableEnlargeImage: column.formatOptions?.enableEnlargeImage
    };
    let customData;

    // In case we display a property with TextOnly text arragement in a non-analytical table, we still load the original property (using custom data)
    // to make sure intent-based navigation can use the value of the original property an not just its text representation.
    // For analytical tables, this is done by adding the original property as a context-defining property for the text property in the table converter (getExtensionInfoFromEntityType)
    if (tableDefinition.enableAnalytics !== true && dataFieldObjectPath.targetObject?.Value?.$target?.annotations?.Common?.Text?.annotations?.UI?.TextArrangement?.valueOf() === "UI.TextArrangementType/TextOnly") {
      customData = createCustomData("extraProperty", `{${dataFieldObjectPath.targetObject.Value.path}}`);
    }

    // When cell merging is enabled, store the comparison key in a "mergeCellKey" custom data on the Field element itself.
    // sap.m.ColumnListItemRenderer calls mergeFunctionName on oCell (= the Field), so the custom data must be at this level.
    let mergeCellKeyCustomData;
    if (column.mergeCells === true && tableDefinition.control.type === "ResponsiveTable") {
      if (column.mergeComparisonProperties?.length) {
        const parts = column.mergeComparisonProperties.map(prop => `\${${prop}}`).join(" + '|' + ");
        mergeCellKeyCustomData = createCustomData("mergeCellKey", `{= ${parts}}`);
      } else {
        const dataField = dataFieldObjectPath.targetObject;
        if (isAnnotationOfType(dataField, "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") && isAnnotationOfTerm(dataField.Target.$target, "com.sap.vocabularies.UI.v1.DataPoint")) {
          const dataPoint = dataField.Target.$target;
          const valuePath = dataPoint.Value?.path;
          if (valuePath) {
            // For DataFieldForAnnotation -> DataPoint, use the actual value property path
            mergeCellKeyCustomData = createCustomData("mergeCellKey", `{${valuePath}}`);
          }
        } else if (column.relativePath) {
          mergeCellKeyCustomData = createCustomData("mergeCellKey", `{${column.relativePath}}`);
        }
      }
    }
    return _jsx(Field, {
      vhIdPrefix: generate([tableId, "TableValueHelp"]),
      editMode: columnEditMode,
      contextPath: collection.getPath(),
      metaPath: dataFieldContext.getPath(),
      textAlign: isConnectedField ? "Left" : textAlign,
      wrap: tableType === "ResponsiveTable",
      class: className,
      liveChange: handlerProvider.fieldLiveChange,
      ariaLabelledBy: ariaLabelledBy ? ariaLabelledBy.split(" ") : undefined,
      navigateAfterAction: column.isNavigable,
      showErrorObjectStatus: column.formatOptions?.showErrorObjectStatus,
      disableStrictHandling: column.disableStrictHandling,
      children: {
        formatOptions: _jsx(FieldFormatOptions, {
          ...formatOptions
        }),
        customData: [customData, mergeCellKeyCustomData].filter(Boolean)
      }
    });
  }

  /**
   * Create the template for the column.
   * @param tableId The table ID
   * @param tableProperties The table properties
   * @param column The column definition
   * @param dataFieldOP The data field object path
   * @param dataFieldContext The data field context
   * @param collection The collection context
   * @param handlerProvider The handler provider
   * @returns The XML string representing the column.
   */
  _exports.getMacroFieldTemplate = getMacroFieldTemplate;
  function getColumnContentTemplate(tableId, tableProperties, column, dataFieldOP, dataFieldContext, collection, handlerProvider) {
    let template;
    let creationTemplate;
    const tableDefinition = tableProperties.tableDefinition;
    const enableAnalytics = tableProperties.tableDefinition.enableAnalytics;
    const tableType = tableProperties.tableDefinition.control.type;
    const isTableReadOnly = tableProperties.readOnly;
    const creationMode = tableProperties.creationMode;
    const fieldMode = tableProperties.fieldMode;
    const isCompactType = tableProperties.tableDefinition.control.isCompactType;
    const dataField = dataFieldOP.targetObject;
    if (isAnnotationOfType(dataField, "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") && (isAnnotationOfTerm(dataField.Target.$target, "com.sap.vocabularies.UI.v1.Chart") || isAnnotationOfTerm(dataField.Target.$target, "com.sap.vocabularies.UI.v1.PresentationVariant"))) {
      const showOnlyChart = (tableType === "ResponsiveTable" ? !column.settings?.showMicroChartLabel : undefined) ?? true;
      const microChartSize = tableType === "ResponsiveTable" ? column.settings?.microChartSize ?? "XS" : "XS";
      let microChartCollection = collection.getModel().createBindingContext(collection.getPath(dataFieldContext.getObject("Target/$AnnotationPath")));
      microChartCollection = collection.getModel().createBindingContext(CommonHelper.getNavigationContext(microChartCollection));
      //We only consider the first visualization of the PV in PV case and expect it to be a chart (similar to VisualFilters)
      template = _jsx(MicroChart, {
        id: generate([tableId, dataField]),
        contextPath: microChartCollection.getPath(),
        metaPath: dataFieldContext.getModel().createBindingContext(dataFieldContext.getPath() + "/Target/$AnnotationPath").getPath(),
        showOnlyChart: showOnlyChart,
        size: microChartSize ?? "XS",
        hideOnNoData: true,
        isAnalytics: enableAnalytics
      });
    } else if (isAnnotationOfType(dataField, "com.sap.vocabularies.UI.v1.DataField") && isMultiValueField(enhanceDataModelPath(dataFieldOP, dataField.Value.path))) {
      // when evaluating "@$ui5.context.isInactive" we are forced to add isTruthy to force the binding evaluation
      const isReadOnly = compileExpression(ifElse(or(isTableReadOnly === true, and(isTruthy(UI.IsInactive), creationMode?.name === "InlineCreationRows")), constant(true), ifElse(equal(fieldMode, "nowrapper"), constant(true), constant(undefined))));
      if (isReadOnly === "undefined") {
        template = _jsx(MultiValueFieldBlock, {
          contextPath: collection.getPath(),
          metaPath: dataFieldContext.getPath(),
          useParentBindingCache: tableDefinition.disableOwnRequestOnMVF
        });
      } else {
        template = _jsx(MultiValueFieldBlock, {
          contextPath: collection.getPath(),
          metaPath: dataFieldContext.getPath(),
          readOnly: isReadOnly,
          useParentBindingCache: tableDefinition.disableOwnRequestOnMVF
        });
      }
    } else if (isAnnotationOfType(dataField, "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") && isAnnotationOfTerm(dataField.Target.$target, "com.sap.vocabularies.UI.v1.FieldGroup")) {
      const fieldGroup = dataField.Target.$target;
      const dataFieldCollectionContext = dataFieldContext.getModel().createBindingContext(dataFieldContext.getPath() + "/Target/$AnnotationPath/Data");
      const fieldGroupCollectionLength = fieldGroup.Data.length - 1;
      const items = fieldGroup.Data.map((_fieldGroupDataField, fieldGroupDataFieldIdx) => {
        const fieldGroupDataFieldContext = dataFieldCollectionContext.getModel().createBindingContext(dataFieldCollectionContext.getPath() + "/" + fieldGroupDataFieldIdx);
        const fieldGroupDataFieldOP = getInvolvedDataModelObjects(fieldGroupDataFieldContext);
        const fieldGroupLabel = FieldHelper.computeLabelText(fieldGroupDataFieldContext.getObject(), {
          context: fieldGroupDataFieldContext
        });
        if (column.showDataFieldsLabel && !!fieldGroupLabel) {
          const resourceBundle = Library.getResourceBundleFor("sap.fe.macros");
          return _jsxs(HBox, {
            renderType: "Bare",
            visible: getVisibleExpression(fieldGroupDataFieldOP),
            alignItems: FieldHelper.buildExpressionForAlignItems(fieldGroupDataFieldContext.getObject("Target/$AnnotationPath/Visualization/$EnumMember")),
            children: [_jsx(Label, {
              id: TableHelper.getFieldGroupLabelStableId(tableId, fieldGroupDataFieldOP),
              text: resourceBundle.getText("HEADER_FORM_LABEL", [fieldGroupLabel]),
              class: "sapUiTinyMarginEnd",
              visible: getVisibleExpression(fieldGroupDataFieldOP)
            }), _jsx(VBox, {
              children: {
                layoutData: _jsx(FlexItemData, {
                  growFactor: "1"
                }),
                items: getMacroFieldTemplate(tableId, tableDefinition, column, fieldGroupDataFieldContext, fieldGroupDataFieldOP, collection, enableAnalytics, tableType, isTableReadOnly, creationMode, undefined, isCompactType, "Left", `${TableHelper.getColumnStableId(tableId, dataFieldOP)} ${TableHelper.getFieldGroupLabelStableId(tableId, fieldGroupDataFieldOP)}`, true, TableHelper.getMarginClass(fieldGroupDataFieldContext.getObject("Target/$AnnotationPath/Visualization/$EnumMember"), fieldGroupDataFieldIdx === fieldGroupCollectionLength), handlerProvider)
              }
            })]
          });
        } else {
          return getMacroFieldTemplate(tableId, tableDefinition, column, fieldGroupDataFieldContext, fieldGroupDataFieldOP, collection, enableAnalytics, tableType, isTableReadOnly, creationMode, fieldMode, isCompactType, undefined, TableHelper.getColumnStableId(tableId, dataFieldOP), false, TableHelper.getMarginClass(fieldGroupDataFieldContext.getObject("Target/$AnnotationPath/Visualization/$EnumMember"), fieldGroupDataFieldIdx === fieldGroupCollectionLength), handlerProvider);
        }
      });
      const draftIndicator = getDraftIndicator(collection, column);
      if (draftIndicator) {
        items.push(draftIndicator);
      }
      const situationIndicator = getSituationIndicator(collection, column);
      if (situationIndicator) {
        items.push(situationIndicator);
      }
      template = _jsx(VBox, {
        visible: TableHelper.getVBoxVisibility(dataFieldCollectionContext.getObject(), column.collectionFieldsHiddenExpression, dataFieldContext.getObject()),
        children: {
          items: items
        }
      });
    } else if (isAnnotationOfType(dataField, "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") && isAnnotationOfTerm(dataField.Target.$target, "com.sap.vocabularies.UI.v1.ConnectedFields")) {
      const connectedFields = dataField.Target.$target;
      const connectedFieldsContext = dataFieldContext.getModel().createBindingContext(dataFieldContext.getPath() + "/Target/$AnnotationPath/Data");
      const fieldsDelimiter = CommonHelper.getDelimiter(connectedFields.Template);
      const connectedFieldsData = getConnectedFieldsData(connectedFields);
      // Build a visibility expression that hides the entire cell when all connected field values are empty.
      // At least one field must be truthy (non-null, non-undefined, non-empty) for the cell to be visible.
      const fieldValuePaths = connectedFieldsData.map(cf => cf?.Value?.path).filter(Boolean);
      const atLeastOneNonEmpty = fieldValuePaths.length > 0 ? or(...fieldValuePaths.map(path => notEqual(pathInModel(path), null))) : constant(true);
      const notAllEmptyVisible = compileExpression(column.collectionFieldsHiddenExpression ? and(resolveBindingString(column.collectionFieldsHiddenExpression), atLeastOneNonEmpty) : atLeastOneNonEmpty);
      const items = connectedFieldsData.map((connectedFieldsElement, connectedFieldsElementIdx) => {
        const connectedFieldsElementContext = dataFieldContext.getModel().createBindingContext(`${connectedFieldsContext.getPath()}/${connectedFieldsElement?.Value?.path}`);
        const connectedFieldsElementOP = getInvolvedDataModelObjects(connectedFieldsElementContext);
        const fieldTemplate = getMacroFieldTemplate(tableId, tableDefinition, column, connectedFieldsElementContext, connectedFieldsElementOP, collection, enableAnalytics, tableType, isTableReadOnly, creationMode, undefined, isCompactType, "Left", `${TableHelper.getColumnStableId(tableId, dataFieldOP)}`, false, undefined, handlerProvider, true);
        if (connectedFieldsElementIdx < connectedFieldsData.length - 1) {
          if (tableType === "ResponsiveTable") {
            return [fieldTemplate,
            /*Use ObjectStatus in ResponsiveTable: its line box matches cell height,
            so the delimiter is vertically centered in both display & edit modes.*/
            _jsx(ObjectStatus
            // NBSP on both sides to keep spacing
            , {
              text: `\u00A0${fieldsDelimiter}\u00A0`,
              state: "None",
              children: {
                // Prevent the delimiter from being squeezed to zero width on tight layouts.
                layoutData: _jsx(FlexItemData, {
                  shrinkFactor: 0
                })
              }
            })];
          }

          // Grid/Tree tables: Text works fine here (keeps baseline behavior in display, centers in edit).
          return [fieldTemplate, _jsx(Text
          // NBSP on both sides to keep spacing
          , {
            text: `\u00A0${fieldsDelimiter}\u00A0`
            //single line
            ,
            wrapping: "false"
            // actually render the NBSPs
            ,
            renderWhitespace: "true",
            children: {
              // Avoid squeeze-to-dot effect when space is tight.
              layoutData: _jsx(FlexItemData, {
                shrinkFactor: 0
              })
            }
          })];
        } else {
          return [fieldTemplate];
        }
      });

      /* Inner container alignment:
      				- ResponsiveTable: always center (better visual consistency)
      				- Grid/Tree: baseline in display, center in edit (mix of Text/Input heights)*/
      const innerHBox = _jsx(HBox, {
        wrap: "NoWrap",
        alignItems: tableType === "ResponsiveTable" ? "Center" : compileExpression(ifElse(UI.IsEditable, constant("Center"), constant("Baseline"))),
        children: {
          items: items
        }
      });

      // Outer wrapper: render a real box, take the row height, and center vertically.
      // This guarantees vertical centering of the whole connected-fields block within the cell.
      template = _jsx(HBox, {
        wrap: "NoWrap",
        renderType: "Div",
        fitContainer: true,
        alignItems: "Center",
        visible: notAllEmptyVisible,
        justifyContent: column.horizontalAlign,
        children: {
          items: [innerHBox]
        }
      });
    } else {
      template = getMacroFieldTemplate(tableId, tableDefinition, column, dataFieldContext, dataFieldOP, collection, enableAnalytics, tableType, isTableReadOnly, creationMode, fieldMode, isCompactType, undefined, undefined, false, undefined, handlerProvider);
      creationTemplate = getCreationTemplate(tableId, column, tableType, creationMode, isTableReadOnly, collection, dataFieldContext, fieldMode, enableAnalytics, handlerProvider);
    }
    return {
      template,
      creationTemplate
    };
  }

  /**
   * Create the template for a column.
   * @param tableId The table ID
   * @param tableProperties Table properties
   * @param column The column definition
   * @param collection The collection context used for context path
   * @param handlerProvider The handler provider
   * @returns The XML string representing the column.
   */
  function getColumnTemplate(tableId, tableProperties, column, collection, handlerProvider) {
    let dataFieldContext = collection.getModel().createBindingContext(column.annotationPath);
    if (!dataFieldContext) {
      return undefined;
    }
    dataFieldContext = collection.getModel().createBindingContext(FieldHelper.getDataFieldDefault(dataFieldContext));
    const dataFieldObjectModelPath = getInvolvedDataModelObjects(dataFieldContext, collection);
    const dataFieldObject = dataFieldContext?.getObject?.() ?? {};
    const templates = getColumnContentTemplate(tableId, tableProperties, column, dataFieldObjectModelPath, dataFieldContext, collection, handlerProvider);
    const enableAutoColumnWidth = tableProperties.enableAutoColumnWidth ?? tableProperties.tableDefinition.control.enableAutoColumnWidth;
    const widthIncludingColumnHeader = tableProperties.tableDefinition.control.widthIncludingColumnHeader;
    const tableType = tableProperties.tableDefinition.control.type;
    const isConnectedField = dataFieldObject.Target?.$AnnotationPath?.includes("com.sap.vocabularies.UI.v1.ConnectedFields");
    const dependents = [];
    const aiNotice = getColumnHeaderAiNotice(column, tableProperties);
    if (aiNotice) {
      dependents.push(aiNotice);
    }
    return _jsx(Column, {
      id: TableHelper.getColumnStableId(tableId, dataFieldObjectModelPath),
      width: !CommonUtils.isSmallDevice() || column.width ? TableHelper.getColumnWidth({
        enableAutoColumnWidth,
        widthIncludingColumnHeader,
        tableType
      }, column, dataFieldObject, TableHelper.getTextOnActionField(dataFieldObject, {
        context: dataFieldContext
      }), dataFieldObjectModelPath, true, {
        title: dataFieldContext.getObject("Target/$AnnotationPath/Title") || "",
        description: dataFieldContext.getObject("Target/$AnnotationPath/Title") || ""
      }) : undefined,
      minWidth: CommonUtils.isSmallDevice() ? TableHelper.getColumnWidth({
        enableAutoColumnWidth,
        widthIncludingColumnHeader,
        tableType
      }, column, dataFieldObject, TableHelper.getTextOnActionField(dataFieldObject, {
        context: dataFieldContext
      }), dataFieldObjectModelPath, false, {
        title: dataFieldContext.getObject("Target/$AnnotationPath/Title") || "",
        description: dataFieldContext.getObject("Target/$AnnotationPath/Description") || ""
      }) : undefined,
      header: column.label || column.name,
      propertyKey: column.name,
      hAlign: column.horizontalAlign || FieldHelper.getColumnAlignment(dataFieldObject, {
        collection: collection
      }),
      headerVisible: isConnectedField ? true : TableHelper.setHeaderLabelVisibility(dataFieldObject, dataFieldContext.getObject("Target/$AnnotationPath/Data")),
      tooltip: column.tooltip,
      required: tableProperties.readOnly ? undefined : column.required,
      children: {
        dependents,
        customData: createCustomData("showDataFieldsLabel", column.showDataFieldsLabel),
        extendedSettings: _jsx(ResponsiveColumnSettings, {
          importance: column.importance,
          mergeFunction: column.mergeCells === true && tableProperties.tableDefinition.control.type === "ResponsiveTable" ? "getMergeCellKey" : undefined
        }),
        template: templates.template,
        creationTemplate: templates.creationTemplate
      }
    });
  }
  _exports.getColumnTemplate = getColumnTemplate;
  function getColumnHeaderAiNotice(column, tableProperties) {
    const aiNotice = column.aiNotice ?? tableProperties.columns?.find(col => col.key === column.key)?.getAggregation("aiNotice");
    if (aiNotice) {
      let content;
      let contentText;
      let contentFragmentName;
      if (typeof aiNotice === "string") {
        contentText = aiNotice;
      } else {
        content = aiNotice.content;
        contentFragmentName = aiNotice.contentFragmentName;
        contentText = aiNotice.contentText;
      }
      return new ColumnAIAction({
        press: event => {
          const action = event.getParameter("action");
          const domRef = action.getDomRef();
          const spaceBelow = domRef ? window.innerHeight - domRef.getBoundingClientRect().bottom : 0;
          const minPopoverHeight = parseFloat(getComputedStyle(document.documentElement).fontSize) * 10;
          ColumnHelper.generateHeaderAIPopover({
            placementType: spaceBelow >= minPopoverHeight ? PlacementType.Bottom : PlacementType.Auto,
            parent: action,
            content: Array.isArray(content) ? content.map(item => item.clone()) : content?.clone(),
            contentFragmentName,
            contentText
          });
        }
      });
    }
  }

  /**
   * Create the template for all the columns in the table.
   * @param tableProperties The table properties
   * @param collection The collection context used for context path
   * @param handlerProvider The handler provider
   * @returns The XML string representing the columns.
   */
  _exports.getColumnHeaderAiNotice = getColumnHeaderAiNotice;
  function getColumns(tableProperties, collection, handlerProvider) {
    const tableId = tableProperties.contentId;
    return tableProperties.tableDefinition.columns.map(column => {
      if (column.availability === "Default" && column.type === "Default") {
        Log.error("Custom columns defined in the manifest are not supported when using a table building block.");
        throw new Error("Custom columns defined in the manifest are not supported when using a table building block.");
      } else if (column.availability === "Default" && column.type === "Annotation") {
        return getColumnTemplate(tableId, tableProperties, column, collection, handlerProvider);
      } else if (column.availability === "Default" && column.type === "Slot") {
        return getSlotColumn(tableId, column, tableProperties.readOnly, tableProperties);
      } else if (column.availability === "Default" && column.type === "Computed") {
        return getComputedColumn(tableId, column, collection, tableProperties.tableDefinition.enableAnalytics);
      }
      return undefined;
    }).filter(column => column !== undefined);
  }
  /**
   * Determines the designtime for the MDC table.
   * @returns The value to be assigned to dt:designtime
   */
  function getDesigntime() {
    return "sap/fe/macros/table/designtime/Table.designtime";
  }

  /**
   * Maps the internal P13n table mode (string) to the corresponding MDC enum.
   * @param stringMode
   * @returns The MDC enum value
   */
  function getMDCP13nMode(stringMode) {
    switch (stringMode) {
      case "Aggregate":
        return TableP13nMode.Aggregate;
      case "Sort":
        return TableP13nMode.Sort;
      case "Column":
        return TableP13nMode.Column;
      case "Filter":
        return TableP13nMode.Filter;
      case "Group":
        return TableP13nMode.Group;
      default:
        Log.error("Unknown P13n mode: " + stringMode);
        return TableP13nMode.Column;
    }
  }

  /**
   * Method to compute the headerVisible property.
   * @param header
   * @param tabTitle
   * @param headerVisible Boolean value to determine if the header is visible
   * @returns Expression binding for headerVisible
   */
  function buildExpressionForHeaderVisibility(header, tabTitle, headerVisible) {
    if (tabTitle === undefined || tabTitle === "") {
      return compileExpression(constant(headerVisible));
    } else {
      const headerBindingExpression = resolveBindingString(header);
      const tabTileBindingExpression = resolveBindingString(tabTitle);
      const headerVisibleBindingExpression = constant(headerVisible);
      return compileExpression(and(headerVisibleBindingExpression, not(equal(headerBindingExpression, tabTileBindingExpression))));
    }
  }

  /**
   * Determines whether the row count should be shown in the table header.
   * The row count is only shown when there is an actual header title; otherwise showing just "(N)" without a label is misleading.
   * @param showRowCount The showRowCount flag from the table control configuration
   * @param header The table header/title string
   * @returns True if the row count should be shown
   */
  _exports.buildExpressionForHeaderVisibility = buildExpressionForHeaderVisibility;
  function getShowRowCount(showRowCount, header) {
    return showRowCount && !!header;
  }
  _exports.getShowRowCount = getShowRowCount;
  function getMDCTableTemplate(tableProperties, parameters) {
    // For a TreeTable in a ListReport displaying a draft-enabled entity, we only display active instances
    const navigationInfo = tableProperties.tableDefinition.annotation?.row?.navigationInfo;
    const target = navigationInfo?.routePath;
    let navigationInEditMode = false;
    if (target) {
      const targetInformation = parameters.appComponent.getRoutingService()._getTargetInformation(target);
      navigationInEditMode = targetInformation?.options?.settings?.openInEditMode ?? false;
    }
    const tableType = tableProperties.tableDefinition.control.type;
    const contextObjectPath = tableProperties.contextObjectPath;
    const filterOnActiveEntities = (tableType === "TreeTable" || tableProperties.tableDefinition.enableAnalytics === true) && contextObjectPath.startingEntitySet === contextObjectPath.targetEntitySet && ModelHelper.isObjectPathDraftSupported(contextObjectPath);
    const delegate = TableHelper.getDelegate(tableProperties.tableDefinition, tableProperties.isAlp === true, tableProperties.tableDefinition.annotation.entityName, filterOnActiveEntities);
    const headerVisible = tableProperties.headerVisible ?? tableProperties.tableDefinition.control.headerVisible ?? false;
    const currentHeader = tableProperties.header ?? tableProperties.tableDefinition.annotation.title;
    const headerVisibilityExpression = buildExpressionForHeaderVisibility(currentHeader ?? "", tableProperties.tabTitle, headerVisible);
    const pasteAction = tableProperties.tableDefinition.actions.find(a => a.key === StandardActionKeys.Paste);
    const collectionEntity = parameters.convertedMetadata.resolvePath(tableProperties.tableDefinition.annotation.collection).target;
    const modelContextChange = tableType === "TreeTable" ? parameters.handlerProvider.tableContextChange : undefined;
    const lineItem = TableHelper.getUiLineItemObject(parameters.metaPath, parameters.convertedMetadata);
    const navigationPath = tableProperties.tableDefinition.annotation.navigationPath;
    if (tableProperties.tableDefinition.annotation.collection.startsWith("/") && isSingleton(contextObjectPath.startingEntitySet)) {
      tableProperties.tableDefinition.annotation.collection = navigationPath;
    }
    const collectionContext = parameters.metaModel.createBindingContext(tableProperties.tableDefinition.annotation.collection);
    const draft = collectionEntity.annotations.Common?.DraftRoot;
    // Add the definition of the designtime file if designtime is enabled from core or locally via url parameters
    const variantManagement = tableProperties.variantManagement ?? "None";
    const designtime = getDesigntime();
    let rowActionType;
    if (tableProperties.overrideRowPress) {
      rowActionType = TableRowActionType.Navigation;
    }
    rowActionType ??= tableProperties.tableDefinition.annotation.row?.actionType === "Navigation" ? TableRowActionType.Navigation : undefined;
    const showCreate = tableProperties.tableDefinition.actions.find(a => a.key === StandardActionKeys.Create)?.visible || true;
    let currentPersonalization;
    switch (tableProperties.personalization) {
      case "false":
        currentPersonalization = undefined;
        break;
      case "true":
        currentPersonalization = [TableP13nMode.Sort, TableP13nMode.Column, TableP13nMode.Filter];
        if (tableType === "ResponsiveTable" || tableProperties.tableDefinition.enableAnalytics === true) {
          currentPersonalization = [...currentPersonalization, TableP13nMode.Group];
        }
        break;
      case undefined:
        currentPersonalization = tableProperties.tableDefinition.annotation.p13nMode?.map(mode => getMDCP13nMode(mode));
        break;
      default:
        // In case grouping mode is defined explicitely on the personalization, we only enable it for the analytical and responsive table.
        if (tableType === "ResponsiveTable" || tableProperties.tableDefinition.enableAnalytics === true) {
          currentPersonalization = tableProperties.personalization.split(",").map(mode => getMDCP13nMode(mode.trim()));
        } else {
          const excludeGroupFromP13n = tableProperties.personalization.split(",").filter(mode => getMDCP13nMode(mode.trim()) !== TableP13nMode.Group);
          currentPersonalization = excludeGroupFromP13n.length ? excludeGroupFromP13n : undefined;
        }
    }
    const multiSelectDisabledActions = ActionHelper.getMultiSelectDisabledActions(lineItem);
    const customData = [{
      key: "kind",
      value: collectionEntity._type
    }, {
      key: "navigationPath",
      value: navigationPath
    }, {
      key: "enableAnalytics",
      value: tableProperties.tableDefinition.enableAnalytics
    }, {
      key: "creationMode",
      value: tableProperties.creationMode?.name
    }, {
      key: "inlineCreationRowCount",
      value: tableProperties.tableDefinition.control.inlineCreationRowCount
    }, {
      key: "showCreate",
      value: showCreate
    }, {
      key: "createAtEnd",
      value: tableProperties.creationMode?.createAtEnd
    }, {
      key: "displayModePropertyBinding",
      value: tableProperties.readOnly
    }, {
      key: "tableType",
      value: tableType
    }, {
      key: "targetCollectionPath",
      value: collectionContext.getPath()
    }, {
      key: "entityType",
      value: collectionContext.getPath() + "/"
    }, {
      key: "metaPath",
      value: collectionContext.getPath()
    }, {
      key: "hiddenFilters",
      value: tableProperties.tableDefinition.control.filters?.hiddenFilters
    }, {
      key: "requestGroupId",
      value: "$auto.Workers"
    }, {
      key: "disableCopyToClipboard",
      value: tableProperties.tableDefinition.control.disableCopyToClipboard
    }, {
      key: "draft",
      value: draft
    }, {
      key: "navigationAvailableMap",
      value: TableHelper.getNavigationAvailableMap(lineItem)
    }, {
      key: "actionsMultiselectDisabled",
      value: multiSelectDisabledActions.length > 0 ? multiSelectDisabledActions.join(",") : undefined
    }, {
      key: "exportRequestSize",
      value: tableProperties.tableDefinition.control.exportRequestSize
    }, ...getCustomDataForClipboardActions(tableProperties)];
    let rowPressHandler;
    if (tableType === "ResponsiveTable") {
      rowPressHandler = parameters.handlerProvider.rowPress ? parameters.handlerProvider.noop : undefined;
    }
    return _jsx(MDCTable, {
      "core:require": getCoreRequire(tableProperties.tableDefinition),
      "fl:flexibility": tableProperties["fl:flexibility"],
      sortConditions: tableProperties.tableDefinition.annotation.sortConditions,
      groupConditions: tableProperties.tableDefinition.annotation.groupConditions,
      aggregateConditions: tableProperties.tableDefinition.annotation.aggregateConditions,
      "dt:designtime": designtime,
      id: tableProperties.contentId,
      busyIndicatorDelay: 0,
      enableExport: tableProperties.tableDefinition.control.enableExport,
      delegate: JSON.parse(delegate),
      rowPress: rowPressHandler,
      beforeOpenContextMenu: parameters.handlerProvider.beforeOpenContextMenu,
      autoBindOnInit: tableProperties.useBasicSearch || !tableProperties.filterBar,
      selectionMode: tableProperties.tableDefinition.annotation.selectionMode || "None",
      selectionChange: parameters.handlerProvider.selectionChange,
      showRowCount: getShowRowCount(tableProperties.tableDefinition.control.showRowCount, currentHeader),
      header: currentHeader,
      headerVisible: headerVisibilityExpression,
      headerLevel: tableProperties.headerLevel,
      headerStyle: tableProperties.headerStyle,
      threshold: tableProperties.tableDefinition.control.threshold ?? tableProperties.tableDefinition.annotation.threshold,
      p13nMode: currentPersonalization,
      paste: parameters.handlerProvider.getPasteHandler(false),
      beforeExport: parameters.handlerProvider.beforeExport,
      class: tableProperties.tableDefinition.control.useCondensedTableLayout === true ? "sapUiSizeCondensed" : undefined,
      multiSelectMode: tableProperties.tableDefinition.control.multiSelectMode,
      showPasteButton: tableType === "TreeTable" ? false : pasteAction?.visible,
      enablePaste: tableType === "TreeTable" ? false : pasteAction?.enabled,
      modelContextChange: modelContextChange,
      children: {
        customData: createCustomDatas(customData),
        dataStateIndicator: getDataStateIndicator(parameters.handlerProvider),
        type: getTableType(tableProperties.tableDefinition, collectionContext, tableType, tableProperties.tableDefinition.control.selectionLimit),
        dependents: getDependents(tableProperties, parameters, variantManagement, collectionContext),
        actions: getActions(tableProperties, parameters, collectionContext, collectionEntity),
        tableActions: getTableActionsAggregation(tableProperties, parameters),
        rowSettings: getRowSettings(tableProperties.tableDefinition, rowActionType, parameters.handlerProvider),
        contextMenu: getContextMenu(tableProperties, parameters, collectionEntity, rowActionType, collectionContext, navigationInEditMode),
        columns: getColumns(tableProperties, collectionContext, parameters.handlerProvider),
        dragDropConfig: getDragAndDropConfig(tableProperties, parameters.handlerProvider),
        creationRow: getCreationRow(tableProperties, parameters.handlerProvider),
        variant: getVariantManagement(variantManagement, tableProperties.contentId, tableProperties.headerLevel, parameters.handlerProvider),
        quickFilter: getQuickFilter(tableProperties),
        copyProvider: getCopyProvider(tableProperties),
        cellSelector: getCellSelector(tableProperties, parameters.handlerProvider)
      }
    });
  }
  _exports.getMDCTableTemplate = getMDCTableTemplate;
  return _exports;
}, false);
//# sourceMappingURL=MdcTableTemplate-dbg.js.map
