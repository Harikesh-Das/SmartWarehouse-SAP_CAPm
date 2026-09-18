/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/deepClone", "sap/fe/base/BindingToolkit", "sap/fe/core/converters/ManifestSettings", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/converters/controls/Common/Action", "sap/fe/core/converters/controls/Common/table/StandardActions", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/macros/CommonHelper", "sap/fe/macros/TSXUtils", "sap/fe/macros/table/TableFullScreenButton", "sap/fe/macros/table/TableHelper", "sap/m/Button", "sap/m/Menu", "sap/m/MenuButton", "sap/m/MenuItem", "sap/m/OverflowToolbarLayoutData", "sap/m/ToolbarSeparator", "sap/m/library", "sap/m/upload/ActionsPlaceholder", "sap/ui/core/Popup", "sap/ui/mdc/actiontoolbar/ActionToolbarAction", "sap/ui/mdc/enums/TableActionPosition", "sap/ui/mdc/table/ActionLayoutData", "../internal/helpers/ActionHelper", "./BasicSearch", "sap/fe/base/jsx-runtime/jsx"], function (deepClone, BindingToolkit, ManifestSettings, MetaModelConverter, DataField, Action, StandardActions, BindingHelper, ModelHelper, StableIdHelper, CommonHelper, TSXUtils, TableFullScreenButton, TableHelper, Button, Menu, MenuButton, MenuItem, OverflowToolbarLayoutData, ToolbarSeparator, library, ActionsPlaceholder, Popup, ActionToolbarAction, TableActionPosition, ActionLayoutData, ActionHelper, BasicSearchMacro, _jsx) {
  "use strict";

  var _exports = {};
  var MenuButtonMode = library.MenuButtonMode;
  var createCustomData = TSXUtils.createCustomData;
  var generate = StableIdHelper.generate;
  var UI = BindingHelper.UI;
  var StandardActionKeys = StandardActions.StandardActionKeys;
  var aiIcon = Action.aiIcon;
  var ButtonType = Action.ButtonType;
  var isDataFieldForIntentBasedNavigation = DataField.isDataFieldForIntentBasedNavigation;
  var isDataFieldForAction = DataField.isDataFieldForAction;
  var isActionWithDialog = DataField.isActionWithDialog;
  var ActionType = ManifestSettings.ActionType;
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var pathInModel = BindingToolkit.pathInModel;
  var notEqual = BindingToolkit.notEqual;
  var equal = BindingToolkit.equal;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  /**
   * Generates the MenuItem for the DataFieldForAction.
   * @param dataField DataField for action
   * @param action The name of the action
   * @param menuItemAction The menuItemAction to be evaluated
   * @param table The instance of the table building block
   * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
   * @param collectionContext The context of the collection
   * @param parameters
   * @returns The MenuItem
   */
  function getMenuItemForAction(dataField, action, menuItemAction, table, forContextMenu, collectionContext, parameters) {
    if (!menuItemAction.annotationPath) {
      return undefined;
    }
    const actionContextPath = CommonHelper.getActionContext(parameters.metaModel.createBindingContext(menuItemAction.annotationPath + "/Action"));
    const actionContext = parameters.metaModel.createBindingContext(actionContextPath);
    const dataFieldDataModelObjectPath = actionContext ? MetaModelConverter.getInvolvedDataModelObjects(actionContext, collectionContext) : undefined;
    const isBound = dataField.ActionTarget?.isBound;
    const isOperationAvailable = dataField.ActionTarget?.annotations?.Core?.OperationAvailable?.valueOf() !== false;
    const contextMenuText = forContextMenu ? "ContextMenu" : "ActionMenu";
    // Here check the parent/child
    const pressHandler = menuItemAction.command && !forContextMenu ? undefined : parameters.handlerProvider.getDataFieldForActionButtonPressHandler(dataField, menuItemAction, forContextMenu);
    const pressCommand = menuItemAction.command && !forContextMenu ? `cmd:${menuItemAction.command}|press` : undefined;
    let enabled = menuItemAction.enabled !== undefined ? menuItemAction.enabled : TableHelper.isDataFieldForActionEnabled(table.tableDefinition, dataField.Action, !!isBound, actionContext.getObject(), menuItemAction.enableOnSelect, dataFieldDataModelObjectPath?.targetEntityType, forContextMenu);
    if (table.tableDefinition.control.analyticalConfiguration?.aggregationOnLeafLevel && !!isBound) {
      enabled = compileExpression(and(UI.isNodeLevelNavigable, resolveBindingString(enabled)));
    }
    if (isBound !== true || isOperationAvailable) {
      const itemId = generate([table.contentId, menuItemAction.key, action.key, contextMenuText, dataField, "MenuItemForAction"]);
      return _jsx(MenuItem, {
        text: dataField.Label,
        id: itemId,
        press: pressHandler,
        "jsx:command": pressCommand,
        enabled: enabled,
        visible: menuItemAction.visible,
        children: {
          customData: [createCustomData("actionId", itemId)]
        }
      });
    } else {
      return undefined;
    }
  }

  /**
   * Generates the MenuItem for the DataFieldForIntentBasedNavigation.
   * @param dataField DataField for IntentBasedNavigation
   * @param menuItemAction The menuItemAction to be evaluated
   * @param table The instance of the table building block
   * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
   * @param collectionContext The context of the collection
   * @param action
   * @param handlerProvider
   * @returns The MenuItem
   */
  function getMenuItemForIntentBasedNavigation(dataField, menuItemAction, table) {
    let forContextMenu = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    let collectionContext = arguments.length > 4 ? arguments[4] : undefined;
    let action = arguments.length > 5 ? arguments[5] : undefined;
    let handlerProvider = arguments.length > 6 ? arguments[6] : undefined;
    const pressHandler = menuItemAction.command ? undefined : handlerProvider.getDataFieldForIBNPressHandler(menuItemAction, forContextMenu);
    const pressCommand = menuItemAction.command ? `cmd:${menuItemAction.command}|press` : undefined;
    const enabled = menuItemAction.enabled !== undefined ? menuItemAction.enabled : TableHelper.isDataFieldForIBNEnabled({
      collection: collectionContext,
      tableDefinition: table.tableDefinition
    }, dataField, dataField.RequiresContext, dataField.NavigationAvailable, forContextMenu);
    const id = forContextMenu ? generate([table.contentId, menuItemAction.key, action.key, dataField, "MenuItemIntentBasedNavigation", "ContextMenu"]) : generate([table.contentId, menuItemAction.key, action.key, dataField, "MenuItemIntentBasedNavigation"]);
    return _jsx(MenuItem, {
      text: dataField.Label,
      id: id,
      press: pressHandler,
      "jsx:command": pressCommand,
      enabled: enabled,
      visible: menuItemAction.visible,
      children: {
        customData: [!dataField.RequiresContext ? createCustomData("IBNData", {
          semanticObject: dataField.SemanticObject,
          action: dataField.Action
        }) : undefined, createCustomData("actionId", id)]
      }
    });
  }

  /**
   * Generates the xml string for the MenuItem based on the type of the menuItemAction.
   * @param action The name of the action
   * @param menuItemAction The menuItemAction to be evaluated
   * @param table The instance of the table building block
   * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
   * @param collectionContext The context of the collection
   * @param parameters
   * @returns The xml string for the MenuItem
   */
  function getMenuItem(action, menuItemAction, table, forContextMenu, collectionContext, parameters) {
    const dataField = menuItemAction.annotationPath ? parameters.convertedMetadata.resolvePath(menuItemAction.annotationPath).target : undefined;
    switch (dataField && menuItemAction.type) {
      case "ForAction":
        if (isDataFieldForAction(dataField)) {
          if (!forContextMenu || forContextMenu && TableHelper.isActionShownInContextMenu(menuItemAction, table.contextObjectPath)) {
            return getMenuItemForAction(dataField, action, menuItemAction, table, forContextMenu, collectionContext, parameters);
          }
        }
        break;
      case "ForNavigation":
        if (isDataFieldForIntentBasedNavigation(dataField) && (!forContextMenu || forContextMenu && TableHelper.isActionShownInContextMenu(menuItemAction, table.contextObjectPath))) {
          return getMenuItemForIntentBasedNavigation(dataField, menuItemAction, table, forContextMenu, collectionContext, action, parameters.handlerProvider);
        }
        break;
      default:
    }
    const pressHandler = menuItemAction.command && !forContextMenu ? undefined : parameters.handlerProvider.getManifestActionPressHandler(menuItemAction, forContextMenu);
    const pressCommand = menuItemAction.command && !forContextMenu ? `cmd:${menuItemAction.command}|press` : undefined;
    let enabled = !forContextMenu ? menuItemAction.enabled : menuItemAction.enabledForContextMenu;
    if (menuItemAction.requiresSelection && table.tableDefinition.control.analyticalConfiguration?.aggregationOnLeafLevel) {
      enabled = compileExpression(and(resolveBindingString(enabled ?? ""), UI.isNodeLevelNavigable));
    }
    const contextMenuText = forContextMenu ? "ContextMenu" : "ActionMenu";
    const itemId = generate([table.contentId, menuItemAction.key, contextMenuText, action.key, dataField, "MenuItem"]);
    return _jsx(MenuItem, {
      "core:require": "{FPM: 'sap/fe/core/helpers/FPMHelper'}",
      text: menuItemAction?.text,
      id: itemId,
      press: pressHandler,
      "jsx:command": pressCommand,
      visible: menuItemAction.visible,
      enabled: enabled,
      children: {
        customData: [createCustomData("actionId", itemId)]
      }
    });
  }

  /**
   * Generates the control for the DataFieldForActionButton.
   * @param dataField DataField for action
   * @param action The name of the action
   * @param table The instance of the table building block
   * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
   * @param collectionContext The context of the collection
   * @param parameters
   * @returns The control for the DataFieldForActionButton
   */
  function getDataFieldButtonForAction(dataField, action, table, forContextMenu, collectionContext, parameters) {
    const dataFieldActionContext = parameters.metaModel.createBindingContext(action.annotationPath + "/Action");
    const actionContextPath = CommonHelper.getActionContext(dataFieldActionContext);
    const actionContext = parameters.metaModel.createBindingContext(actionContextPath);
    const dataFieldDataModelObjectPath = actionContext ? MetaModelConverter.getInvolvedDataModelObjects(actionContext, collectionContext) : undefined;
    const isBound = dataField.ActionTarget?.isBound;
    const pressHandler = action.command && !forContextMenu ? undefined : parameters.handlerProvider.getDataFieldForActionButtonPressHandler(dataField, action, forContextMenu);
    const pressCommand = action.command && !forContextMenu ? `cmd:${action.command}|press` : undefined;
    const enabled = action.enabled !== undefined ? action.enabled : TableHelper.isDataFieldForActionEnabled(table.tableDefinition, dataField.Action, !!isBound, actionContext.getObject(), action.enableOnSelect, dataFieldDataModelObjectPath?.targetEntityType, forContextMenu);
    const icon = action.isAIOperation === true ? aiIcon : undefined;
    if (!forContextMenu) {
      // for table toolbar
      const toolbarActionId = generate([table.contentId, dataField]);
      return _jsx(Button, {
        id: toolbarActionId,
        text: dataField.Label,
        icon: icon,
        ariaHasPopup: isActionWithDialog(dataField),
        press: pressHandler,
        "jsx:command": pressCommand,
        type: ButtonType.Transparent,
        enabled: enabled,
        visible: action.visible,
        ariaDescribedBy: action.isAIOperation === true ? ["fe::AiAction::AriaText"] : undefined,
        children: {
          customData: [createCustomData("actionId", toolbarActionId)],
          layoutData: _jsx(OverflowToolbarLayoutData, {
            priority: action.priority,
            group: action.group
          })
        }
      });
    } else {
      // for context menu
      const tableActionContextMenuId = generate([table.contentId, dataField, "ContextMenu"]);
      return _jsx(MenuItem, {
        id: tableActionContextMenuId,
        text: dataField.Label,
        icon: icon,
        press: pressHandler,
        "jsx:command": pressCommand,
        enabled: enabled,
        children: {
          customData: [createCustomData("actionId", tableActionContextMenuId)]
        }
      });
    }
  }

  /**
   * Generates the control for the DataFieldForIntentBasedNavigation Button.
   * @param dataField DataField for IntentBasedNavigation
   * @param action The name of the action
   * @param table The instance of the table building block
   * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
   * @param collectionContext The context of the collection
   * @param handlerProvider
   * @returns The control for the DataFieldForIntentBasedNavigation button/menu item
   */
  function getDataFieldButtonForIntentBasedNavigation(dataField, action, table, forContextMenu, collectionContext, handlerProvider) {
    const pressHandler = action.command && !forContextMenu ? undefined : handlerProvider.getDataFieldForIBNPressHandler(action, forContextMenu);
    const pressCommand = action.command && !forContextMenu ? `cmd:${action.command}|press` : undefined;
    const enabled = action.enabled !== undefined ? action.enabled : TableHelper.isDataFieldForIBNEnabled({
      collection: collectionContext,
      tableDefinition: table.tableDefinition
    }, dataField, dataField.RequiresContext, dataField.NavigationAvailable, forContextMenu);
    const IBNData = !dataField.RequiresContext ? {
      semanticObject: dataField.SemanticObject,
      action: dataField.Action
    } : undefined;
    if (!forContextMenu) {
      // for table toolbar
      const toolbarActionId = generate([table.contentId, dataField]);
      return _jsx(Button, {
        id: toolbarActionId,
        text: dataField.Label,
        press: pressHandler,
        "jsx:command": pressCommand,
        type: ButtonType.Transparent,
        enabled: enabled,
        visible: action.visible,
        children: {
          customData: [createCustomData("IBNData", IBNData), createCustomData("actionId", toolbarActionId)]
        }
      });
    } else {
      // for context menu
      const tableActionContextMenuId = generate([table.contentId, dataField, "ContextMenu"]);
      return _jsx(MenuItem, {
        id: tableActionContextMenuId,
        text: dataField.Label,
        press: pressHandler,
        "jsx:command": pressCommand,
        enabled: enabled,
        children: {
          customData: [createCustomData("IBNData", IBNData), createCustomData("actionId", tableActionContextMenuId)]
        }
      });
    }
  }

  /**
   * Generates the control for the button based on the type of the action.
   * @param action The name of the action
   * @param table The instance of the table building block
   * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
   * @param collectionContext The context of the collection
   * @param parameters
   * @returns The control for the button/menu item
   */
  function getDataFieldButton(action, table, forContextMenu, collectionContext, parameters) {
    const dataField = action.annotationPath ? parameters.convertedMetadata.resolvePath(action.annotationPath).target : undefined;
    let template;
    if (!dataField) {
      return undefined;
    }
    switch (action.type) {
      case "ForAction":
        if (isDataFieldForAction(dataField)) {
          const isBound = dataField.ActionTarget?.isBound;
          if (!!isBound && table.tableDefinition.control.analyticalConfiguration?.aggregationOnLeafLevel) {
            action = deepClone(action);
            action.enabled = compileExpression(and(resolveBindingString(action.enabled ?? ""), UI.isNodeLevelNavigable));
          }
          const isOperationAvailable = dataField.ActionTarget?.annotations?.Core?.OperationAvailable?.valueOf() !== false;
          // show only bound actions in context menu
          if (!forContextMenu || TableHelper.isActionShownInContextMenu(action, table.contextObjectPath)) {
            if (isBound !== true || isOperationAvailable) {
              template = getDataFieldButtonForAction(dataField, action, table, forContextMenu, collectionContext, parameters);
            }
          }
        }
        break;
      case "ForNavigation":
        if (isDataFieldForIntentBasedNavigation(dataField) && (!forContextMenu || TableHelper.isActionShownInContextMenu(action, table.contextObjectPath))) {
          template = getDataFieldButtonForIntentBasedNavigation(dataField, action, table, forContextMenu, collectionContext, parameters.handlerProvider);
        }
        break;
      default:
    }
    if (template === undefined) {
      return undefined;
    }
    if (!forContextMenu) {
      // for table toolbar
      return _jsx(ActionToolbarAction, {
        id: generate([table.contentId, action.id, dataField, "ActionToolbarAction"]),
        "dt:designtime": action.visible === "true" || action.visible === "false" ? undefined : "not-adaptable-visibility",
        children: {
          action: template
        }
      });
    } else {
      // for context menu
      return template;
    }
  }

  /**
   * Gets the default action handler that is invoked when adding the menu button.
   * @param defaultAction The default action of the menu
   * @param dataFieldForDefaultAction The dataField for the default action
   * @param parameters
   * @returns The corresponding event handler or command
   */
  function getDefaultMenuButtonAction(defaultAction, dataFieldForDefaultAction, parameters) {
    if (!defaultAction) {
      return {};
    }
    try {
      switch (defaultAction.type) {
        case "ForAction":
          return {
            handler: parameters.handlerProvider.getDataFieldForActionButtonPressHandler(dataFieldForDefaultAction, defaultAction, false)
          };
        case "ForNavigation":
          return {
            handler: parameters.handlerProvider.getDataFieldForIBNPressHandler(defaultAction, false)
          };
        default:
          {
            if (defaultAction.command) {
              return {
                command: `cmd:${defaultAction.command}|defaultAction`
              };
            } else {
              return {
                handler: parameters.handlerProvider.getManifestActionPressHandler(defaultAction, false)
              };
            }
          }
      }
    } catch (e) {
      return {};
    }
  }

  /**
   * Gets the text for the button binding.
   * @param action  The action
   * @returns  The text for the button binding
   */

  function getTextButton(action) {
    return typeof action.text === "string" ? action.text : deepClone(action.text);
  }

  /**
   * Generates the control for the MenuButton control which enables the user to show a hierarchical menu.
   * @param action The name of the action
   * @param table The instance of the table building block
   * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
   * @param collectionContext The context of the collection
   * @param parameters
   * @returns The MenuButton control
   */
  function getMenuButton(action, table, forContextMenu, collectionContext, parameters) {
    if (action.requiresSelection && table.tableDefinition.control.analyticalConfiguration?.aggregationOnLeafLevel) {
      action = deepClone(action);
      action.enabled = compileExpression(and(resolveBindingString(action.enabled ?? ""), UI.isNodeLevelNavigable));
    }
    const icon = action.isAIOperation === true ? aiIcon : undefined;
    const text = getTextButton(action);
    if (!forContextMenu) {
      // for table toolbar
      const defaultAction = action.defaultAction;
      const dataFieldForDefaultAction = defaultAction?.annotationPath ? parameters.convertedMetadata.resolvePath(defaultAction.annotationPath).target : undefined;
      const defaultActionHandlers = getDefaultMenuButtonAction(defaultAction, dataFieldForDefaultAction, parameters);
      const menuItems = action.menu?.filter(menuItemAction => typeof menuItemAction !== "string").map(menuItemAction => {
        return getMenuItem(action, menuItemAction, table, forContextMenu, collectionContext, parameters);
      }).filter(item => item !== undefined);
      if (menuItems?.length) {
        const menuId = generate([table.contentId, action.id]);
        return _jsx(ActionToolbarAction, {
          id: generate([table.contentId, action.id, "ActionToolbarAction"]),
          "dt:designtime": action.visible === "true" || action.visible === "false" ? undefined : "not-adaptable-visibility",
          children: _jsx(MenuButton, {
            text: text,
            type: ButtonType.Transparent,
            menuPosition: Popup.Dock.BeginBottom,
            id: menuId,
            visible: action.visible,
            enabled: action.enabled,
            useDefaultActionOnly: !!action.defaultAction,
            icon: icon,
            buttonMode: action.defaultAction ? MenuButtonMode.Split : MenuButtonMode.Regular,
            defaultAction: defaultActionHandlers.handler,
            "jsx:command": defaultActionHandlers.command,
            ariaDescribedBy: action.isAIOperation === true ? ["fe::AiAction::AriaText"] : undefined,
            children: {
              customData: [createCustomData("actionId", menuId)],
              menu: _jsx(Menu, {
                children: menuItems
              }),
              layoutData: _jsx(OverflowToolbarLayoutData, {
                priority: action.priority,
                group: action.group
              })
            }
          })
        });
      } else {
        return undefined;
      }
    } else {
      // for context menu
      const menuItemsForContextMenu = [];
      const defaultAction = action.defaultAction;
      if (defaultAction && TableHelper.isActionShownInContextMenu(defaultAction, table.contextObjectPath)) {
        menuItemsForContextMenu.push(defaultAction);
      }
      action.menu?.forEach(menuItemAction => {
        if (typeof menuItemAction !== "string" && TableHelper.isActionShownInContextMenu(menuItemAction, table.contextObjectPath) && menuItemAction.key !== defaultAction?.key) {
          menuItemsForContextMenu?.push(menuItemAction);
        }
      });
      const menuItems = menuItemsForContextMenu.filter(menuItemAction => typeof menuItemAction !== "string").map(menuItemAction => {
        return getMenuItem(action, menuItemAction, table, forContextMenu, collectionContext, parameters);
      }).filter(item => item !== undefined);
      if (menuItems?.length) {
        return _jsx(MenuItem, {
          text: text,
          id: generate([table.contentId, action.id, "ContextMenu"]),
          enabled: action.enabledForContextMenu,
          icon: icon,
          children: {
            items: menuItems
          }
        });
      } else {
        return undefined;
      }
    }
  }

  /**
   * Generates the xml string for the default button.
   * @param action The name of the action
   * @param table The instance of the table building block
   * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
   * @param handlerProvider
   * @returns The xml string for the default button.
   */
  function getDefaultButton(action, table, forContextMenu, handlerProvider) {
    const pressHandler = action.command && !forContextMenu ? undefined : handlerProvider.getManifestActionPressHandler(action, forContextMenu);
    const pressCommand = action.command && !forContextMenu ? `cmd:${action.command}|press` : undefined;
    if (action.requiresSelection && table.tableDefinition.control.analyticalConfiguration?.aggregationOnLeafLevel) {
      action = deepClone(action);
      action.enabled = compileExpression(and(resolveBindingString(action.enabled ?? ""), UI.isNodeLevelNavigable));
      action.enabledForContextMenu = compileExpression(and(resolveBindingString(action.enabledForContextMenu ?? ""), UI.isNodeLevelNavigable));
    }
    const text = getTextButton(action);
    if (!forContextMenu) {
      // for table toolbar
      return _jsx(ActionToolbarAction, {
        id: generate([table.contentId, action.id, "ActionToolbarAction"]),
        "dt:designtime": action.visible === "true" || action.visible === "false" ? undefined : "not-adaptable-visibility",
        children: _jsx(Button, {
          "core:require": "{FPM: 'sap/fe/core/helpers/FPMHelper'}",
          id: generate([table.contentId, action.id]),
          text: text,
          press: pressHandler,
          "jsx:command": pressCommand,
          type: ButtonType.Transparent,
          visible: action.visible,
          enabled: action.enabled,
          icon: action.isAIOperation === true ? aiIcon : undefined,
          ariaDescribedBy: action.isAIOperation === true ? ["fe::AiAction::AriaText"] : undefined,
          children: {
            customData: [createCustomData("actionId", generate([table.contentId, action.id]))],
            layoutData: _jsx(OverflowToolbarLayoutData, {
              priority: action.priority,
              group: action.group
            })
          }
        })
      });
    } else if (TableHelper.isActionShownInContextMenu(action, table.contextObjectPath)) {
      const tableActionContextMenuId = generate([table.contentId, action.id, "ContextMenu"]);
      // for context menu
      return _jsx(MenuItem, {
        "core:require": "{FPM: 'sap/fe/core/helpers/FPMHelper'}",
        id: tableActionContextMenuId,
        text: text,
        press: pressHandler,
        "jsx:command": pressCommand,
        enabled: action.enabledForContextMenu,
        children: {
          customData: [createCustomData("actionId", tableActionContextMenuId)]
        }
      });
    } else {
      return undefined;
    }
  }

  /**
   * Generates the control for an action button/menu item based on the type of the action.
   * @param action The action to get
   * @param table The instance of the table building block
   * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
   * @param collectionContext The context of the collection
   * @param parameters
   * @returns The control of the action
   */
  function getAction(action, table, forContextMenu, collectionContext, parameters) {
    switch (action.type) {
      case "Default":
        if ("noWrap" in action) {
          return getDefaultButton(action, table, forContextMenu, parameters.handlerProvider);
        }
        break;
      case "Menu":
        return getMenuButton(action, table, forContextMenu, collectionContext, parameters);
      default:
    }
    return getDataFieldButton(action, table, forContextMenu, collectionContext, parameters);
  }

  /**
   * Generates the copy action.
   * @param action The copy action
   * @param table The instance of the table building block
   * @param forContextMenu Indicates if action is for Action Toolbar of Context Menu
   * @param collectionContext The context of the collection
   * @param parameters
   * @returns The action
   */
  function getCopyAction(action, table, forContextMenu, collectionContext, parameters) {
    const dataField = action.annotationPath ? parameters.convertedMetadata.resolvePath(action.annotationPath).target : undefined;
    const actionContextPath = CommonHelper.getActionContext(parameters.metaModel.createBindingContext(action.annotationPath + "/Action"));
    const operationAvailable = dataField?.ActionTarget?.annotations?.Core?.OperationAvailable !== undefined;
    const actionContext = parameters.metaModel.createBindingContext(actionContextPath);
    const dataFieldDataModelObjectPath = actionContext ? MetaModelConverter.getInvolvedDataModelObjects(actionContext, collectionContext) : undefined;
    const isBound = dataField?.ActionTarget?.isBound;
    const press = dataField ? parameters.handlerProvider.getDataFieldForActionButtonPressHandler(dataField, action, forContextMenu) : undefined;
    let enabled = operationAvailable ? TableHelper.isDataFieldForActionEnabled(table.tableDefinition, dataField.Action, !!isBound, actionContext.getObject(), action.enableOnSelect, dataFieldDataModelObjectPath?.targetEntityType, forContextMenu, true) : `{= ${ActionHelper.getNumberOfContextsExpression("single", forContextMenu)}}`;
    if (table.tableDefinition.control.analyticalConfiguration?.aggregationOnLeafLevel) {
      enabled = compileExpression(and(resolveBindingString(enabled), UI.isNodeLevelNavigable));
    }
    const text = getTextButton(action);
    if (!forContextMenu) {
      // for table toolbar
      return _jsx(ActionToolbarAction, {
        id: generate([table.contentId, dataField, "ActionToolbarAction"]),
        "dt:designtime": action.visible === "true" || action.visible === "false" ? undefined : "not-adaptable-visibility",
        children: _jsx(Button, {
          id: generate([table.contentId, dataField]),
          text: text,
          press: press,
          type: ButtonType.Transparent,
          visible: action.visible,
          enabled: enabled,
          children: {
            customData: [createCustomData("actionId", generate([table.contentId, dataField]))],
            layoutData: _jsx(OverflowToolbarLayoutData, {
              priority: action.priority,
              group: action.group
            })
          }
        })
      });
    } else {
      // for context menu
      return _jsx(MenuItem, {
        id: generate([table.contentId, dataField, "ContextMenu"]),
        text: text,
        press: press,
        enabled: compileExpression(equal(pathInModel("contextmenu/numberOfSelectedContexts", "internal"), 1)),
        children: {
          customData: [createCustomData("actionId", generate([table.contentId, dataField, "ContextMenu"]))]
        }
      });
    }
  }

  /**
   * Generates the xml string for the create button.
   * @param standardAction Standard actions to be evaluated
   * @param table The instance of the table building block
   * @param forContextMenu Indicates whether the action appears in the context menu. If set to `false`, the action appears in the table toolbar.
   * @param handlerProvider
   * @param collectionEntity The entity set of the collection
   * @returns The xml string for the create button
   */
  function getCreateButton(standardAction, table, forContextMenu, handlerProvider, collectionEntity) {
    const suffixResourceKey = collectionEntity.name;
    const buttonText = table.getTranslatedText("M_COMMON_TABLE_CREATE", undefined, suffixResourceKey);
    const createOutboundDetail = table.tableDefinition.annotation.create.outboundDetail;
    const customData = createOutboundDetail ? createCustomData("IBNData", {
      semanticObject: createOutboundDetail.semanticObject,
      action: createOutboundDetail.action
    }) : undefined;
    if (table.tableDefinition.control.enableUploadPlugin) {
      return _jsx(ActionsPlaceholder, {
        id: `${table.contentId}-uploadButton`,
        placeholderFor: "UploadButtonPlaceholder"
      });
    } else if (!forContextMenu) {
      return _jsx(ActionToolbarAction, {
        id: generate([table.contentId, standardAction.key, "ActionToolbarAction"]),
        "dt:designtime": "not-adaptable-tree",
        children: _jsx(Button, {
          id: generate([table.contentId, standardAction.key]),
          text: buttonText,
          "jsx:command": "cmd:Create|press",
          type: ButtonType.Transparent,
          visible: standardAction.visible,
          enabled: standardAction.enabled,
          children: {
            customData,
            layoutData: _jsx(OverflowToolbarLayoutData, {
              priority: standardAction.priority,
              group: standardAction.group
            })
          }
        })
      });
    } else {
      return _jsx(MenuItem, {
        id: generate([table.contentId, standardAction.key, "ContextMenu"]),
        text: buttonText,
        press: handlerProvider.getCreateButtonPressHandler(true, false),
        visible: standardAction.visible,
        enabled: standardAction.enabledForContextMenu
      });
    }
  }
  function getCreateMenu(standardAction, table, collectionEntity, forContextMenu, handlerProvider) {
    const suffixResourceKey = collectionEntity.name;
    const buttonText = table.getTranslatedText("M_COMMON_TABLE_CREATE", undefined, suffixResourceKey);
    const values = table.tableDefinition.control.nodeType.values;
    const hasCustomCreateEnablement = table.tableDefinition.control.createEnablement !== undefined;
    const menuItems = values.map((allowedValue, index) => {
      const modelName = !forContextMenu ? "" : "contextmenu/";
      const isEnabled = hasCustomCreateEnablement ? notEqual(pathInModel(`${modelName}createEnablement/Create_${index}`, "internal"), false) : undefined;
      const id = forContextMenu ? generate([table.contentId, allowedValue.value, "ContextMenu"]) : generate([table.contentId, allowedValue.value]);
      return _jsx(MenuItem, {
        id: id,
        text: allowedValue.text,
        enabled: isEnabled ? compileExpression(isEnabled) : undefined,
        press: handlerProvider.getCreateMenuItemPressHandler(index, forContextMenu)
      });
    });
    if (forContextMenu) {
      return _jsx(MenuItem, {
        id: generate([table.contentId, standardAction.key, "ContextMenu"]),
        text: buttonText,
        visible: standardAction.visible,
        enabled: standardAction.enabledForContextMenu,
        children: {
          items: menuItems !== undefined && menuItems.length > 0 ? menuItems : undefined
        }
      });
    }
    return _jsx(ActionToolbarAction, {
      id: generate([table.contentId, standardAction.key, "ActionToolbarAction"]),
      "dt:designtime": "not-adaptable-tree",
      children: _jsx(MenuButton, {
        text: buttonText,
        type: ButtonType.Transparent,
        menuPosition: "BeginBottom",
        id: generate([table.contentId, standardAction.key]),
        visible: standardAction.visible,
        enabled: standardAction.enabled,
        children: {
          customData: [createCustomData("actionId", generate([table.contentId, standardAction.key]))],
          menu: _jsx(Menu, {
            children: menuItems
          }),
          layoutData: _jsx(OverflowToolbarLayoutData, {
            priority: standardAction.priority,
            group: standardAction.group
          })
        }
      })
    });
  }

  /**
   * Generates the xml string for the delete button.
   * @param standardAction Standard actions to be evaluated
   * @param table The instance of the table building block
   * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
   * @param handlerProvider
   * @param collectionEntity The entity set of the collection
   * @returns The xml string for the delete button
   */
  function getDeleteButton(standardAction, table, forContextMenu, handlerProvider, collectionEntity) {
    const suffixResourceKey = collectionEntity.name;
    const buttonText = table.getTranslatedText("M_COMMON_TABLE_DELETE", undefined, suffixResourceKey);
    if (!forContextMenu) {
      // for table toolbar
      return _jsx(ActionToolbarAction, {
        id: generate([table.contentId, standardAction.key, "ActionToolbarAction"]),
        "dt:designtime": "not-adaptable-tree",
        children: _jsx(Button, {
          id: generate([table.contentId, standardAction.key]),
          text: buttonText,
          "jsx:command": "cmd:DeleteEntry|press",
          type: ButtonType.Transparent,
          visible: standardAction.visible,
          enabled: standardAction.enabled,
          ariaHasPopup: "Dialog",
          children: {
            layoutData: _jsx(OverflowToolbarLayoutData, {
              priority: standardAction.priority,
              group: standardAction.group
            })
          }
        })
      });
    } else {
      // for context menu
      return _jsx(MenuItem, {
        id: generate([table.contentId, standardAction.key, "ContextMenu"]),
        text: buttonText,
        press: handlerProvider.getDeleteButtonPressHandler(true),
        visible: standardAction.visible,
        enabled: standardAction.enabledForContextMenu
      });
    }
  }

  /**
   * Generates the xml string for standard actions based on the key of the standard action.
   * @param action The action to template
   * @param table The instance of the table building block
   * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
   * @param handlerProvider
   * @param collectionEntity The entity set of the collection
   * @returns The xml string representation of the standard action
   */
  function getStandardAction(action, table, forContextMenu, handlerProvider, collectionEntity) {
    if (action.isTemplated === "false") {
      return undefined;
    }
    if (table.tableDefinition.control.analyticalConfiguration?.aggregationOnLeafLevel && action.key !== StandardActionKeys.Create) {
      action = deepClone(action);
      action.enabled = compileExpression(and(resolveBindingString(action.enabled ?? ""), UI.isNodeLevelNavigable));
      action.enabledForContextMenu = compileExpression(and(resolveBindingString(action.enabledForContextMenu ?? ""), UI.isNodeLevelNavigable));
    }
    switch (action.key) {
      case StandardActionKeys.Create:
        if (!table.tableDefinition.annotation.isInsertUpdateActionsTemplated ||
        // We only have Create on the ContextMenu on the TreeTable
        table.tableDefinition.control.type !== "TreeTable" && forContextMenu) {
          return undefined;
        } else if (table.tableDefinition.control.nodeType) {
          return getCreateMenu(action, table, collectionEntity, forContextMenu, handlerProvider);
        } else {
          return getCreateButton(action, table, forContextMenu, handlerProvider, collectionEntity);
        }
      case StandardActionKeys.Delete:
        return getDeleteButton(action, table, forContextMenu, handlerProvider, collectionEntity);
      case StandardActionKeys.Cut:
        return getCutButton(action, table, forContextMenu, handlerProvider);
      case StandardActionKeys.Copy:
        return getCopyButton(action, table, forContextMenu, handlerProvider);
      case StandardActionKeys.Paste:
        return getPasteButton(action, table, forContextMenu, handlerProvider);
      case StandardActionKeys.MassEdit:
        if (table.tableDefinition.annotation.isInsertUpdateActionsTemplated) {
          if (!forContextMenu) {
            // for table toolbar
            return _jsx(ActionToolbarAction, {
              id: generate([table.contentId, action.key, "ActionToolbarAction"]),
              "dt:designtime": "not-adaptable-tree",
              children: _jsx(Button, {
                id: generate([table.contentId, action.key]),
                text: "{sap.fe.i18n>M_COMMON_TABLE_MASSEDIT}",
                press: handlerProvider.getMassEditButtonPressHandler(false),
                visible: action.visible,
                enabled: action.enabled,
                children: {
                  layoutData: _jsx(OverflowToolbarLayoutData, {
                    priority: action.priority,
                    group: action.group
                  })
                }
              })
            });
          } else {
            // for context menu
            return _jsx(MenuItem, {
              id: generate([table.contentId, action.key, "ContextMenu"]),
              text: "{sap.fe.i18n>M_COMMON_TABLE_MASSEDIT}",
              press: handlerProvider.getMassEditButtonPressHandler(true),
              enabled: action.enabledForContextMenu
            });
          }
        }
        return undefined;
      case StandardActionKeys.Insights:
        if (!forContextMenu) {
          // for table toolbar
          return _jsx(ActionToolbarAction, {
            id: generate([table.contentId, action.key, "ActionToolbarAction"]),
            "dt:designtime": action.visible === "true" || action.visible === "false" ? undefined : "not-adaptable-visibility",
            visible: action.visible,
            children: _jsx(Button, {
              id: generate([table.contentId, action.key]),
              text: "{sap.fe.i18n>M_COMMON_INSIGHTS_CARD}",
              press: handlerProvider.addCardToInsightsPress,
              visible: action.visible,
              enabled: action.enabled,
              children: {
                layoutData: _jsx(OverflowToolbarLayoutData, {
                  priority: action.priority ?? "AlwaysOverflow",
                  group: action.group
                })
              }
            })
          });
        }
        return undefined;
      case StandardActionKeys.MoveUp:
      case StandardActionKeys.MoveDown:
        return getMoveUpDownButton(action, table, forContextMenu, handlerProvider);
      default:
        return undefined;
    }
  }

  /**
   * Generates the xml string for standard, annotation, and custom actions of the table.
   * @param table The instance of the table building block
   * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
   * @param parameters
   * @param collectionContext The context of the collection
   * @param collectionEntity The entity set of the collection
   * @returns The xml string representation of the actions
   */
  function getActions(table, forContextMenu, parameters, collectionContext, collectionEntity) {
    // Apply primary action overflow protection before processing
    const actionsWithOverflowProtection = ActionHelper.ensurePrimaryActionNeverOverflows(table.tableDefinition.actions);
    return actionsWithOverflowProtection.map(action => {
      switch (action.type) {
        case ActionType.Standard:
          return getStandardAction(action, table, forContextMenu, parameters.handlerProvider, collectionEntity);
        case ActionType.Copy:
          return getCopyAction(action, table, forContextMenu, collectionContext, parameters);
        case ActionType.Separator:
          if (!forContextMenu) {
            return _jsx(ToolbarSeparator, {
              children: {
                layoutData: _jsx(OverflowToolbarLayoutData, {
                  group: action.group
                })
              }
            });
          }
          return undefined;
        default:
          return getAction(action, table, forContextMenu, collectionContext, parameters);
      }
    }).filter(action => action !== undefined);
  }

  /**
   * Generates the control for BasicSearch.
   * @param useBasicSearch
   * @param filterBarId
   * @param _collectionIsDraftEnabled
   * @param isSearchable
   * @returns The control of the BasicSearch
   */
  _exports.getActions = getActions;
  function getBasicSearch(useBasicSearch, filterBarId, _collectionIsDraftEnabled, isSearchable) {
    if (useBasicSearch) {
      return _jsx(ActionToolbarAction, {
        id: generate([filterBarId, "ActionToolbarAction"]),
        label: "{sap.fe.i18n>M_BASIC_SEARCH}",
        "dt:designtime": "not-adaptable-tree",
        children: {
          action: _jsx(BasicSearchMacro, {
            id: filterBarId,
            useDraftEditState: _collectionIsDraftEnabled,
            visible: isSearchable
          })
        }
      });
    }
    return undefined;
  }

  /**
   * Generates the control for table fullscreen button.
   * @param table The instance of the table building block
   * @returns The control of the button
   */
  function getFullScreen(table) {
    if (table.tableDefinition.control.enableFullScreen) {
      return _jsx(ActionToolbarAction, {
        id: generate([table.contentId, "StandardAction", "FullScreen", "ActionToolbarAction"]),
        label: "{sap.fe.i18n>M_FULL_SCREEN}",
        "dt:designtime": "not-adaptable-tree",
        children: {
          action: _jsx(TableFullScreenButton, {
            id: generate([table.contentId, "StandardAction", "FullScreen"])
          }),
          layoutData: _jsx(ActionLayoutData, {
            position: TableActionPosition.ViewActions
          })
        }
      });
    }
    return undefined;
  }

  /**
   * Generates the control for the Refresh button of the analytical table.
   * The button is only enabled when the totals are outdated, for example, isOutdated in the header context,
   * and is only visible in edit mode.
   * @param table The instance of the Table building block
   * @param handlerProvider The event handler provider
   * @returns The control of the button, or undefined if not applicable
   */
  _exports.getFullScreen = getFullScreen;
  function getAnalyticalRefreshButton(table, handlerProvider) {
    if (table.tableDefinition.control.enableAnalyticalEdit === true) {
      return _jsx(ActionToolbarAction, {
        id: generate([table.contentId, "StandardAction", "AnalyticalRefresh", "ActionToolbarAction"]),
        label: "{sap.fe.i18n>M_COMMON_TABLE_ANALYTICAL_REFRESH}",
        "dt:designtime": "not-adaptable-tree",
        children: {
          action: _jsx(Button, {
            id: generate([table.contentId, "StandardAction", "AnalyticalRefresh"]),
            text: "{sap.fe.i18n>M_COMMON_TABLE_ANALYTICAL_REFRESH}",
            press: handlerProvider.analyticalRefreshPress,
            enabled: compileExpression(UI.AnalyticalRefreshNeeded),
            visible: compileExpression(UI.IsEditable),
            type: "Transparent"
          }),
          layoutData: _jsx(ActionLayoutData, {
            position: TableActionPosition.ModificationActionsEnd
          })
        }
      });
    }
    return undefined;
  }
  _exports.getAnalyticalRefreshButton = getAnalyticalRefreshButton;
  /**
   * Internal function to get the cut/copy/paste button.
   * @param action
   * @param table
   * @param forContextMenu
   * @param params
   * @returns The button
   */
  function getCutCopyPasteButton(action, table, forContextMenu, params) {
    if (!forContextMenu) {
      // for table toolbar
      const button = _jsx(Button, {
        id: generate([table.contentId, params.idKey]),
        text: params.text,
        press: params.handler,
        visible: action.visible,
        enabled: action.enabled,
        children: {
          layoutData: _jsx(OverflowToolbarLayoutData, {
            priority: action.priority,
            group: action.group
          })
        }
      });
      // Adds the shortcut text in a button tooltip.
      // This is used when the press event cannot be associated with a command, but the shortcut still needs to appear in the button tooltip.
      sap.ui.require(["sap/ui/core/ShortcutHintsMixin"], ShortcutHintsMixin => {
        ShortcutHintsMixin.addConfig(button, {
          shortcut: params.shortcut
        }, undefined);
      });
      return _jsx(ActionToolbarAction, {
        id: generate([table.contentId, params.idKey, "ActionToolbarAction"]),
        "dt:designtime": "not-adaptable-tree",
        children: {
          action: button
        }
      });
    } else {
      // for context menu
      return _jsx(MenuItem, {
        id: generate([table.contentId, params.idKey, "ContextMenu"]),
        text: params.text,
        press: params.handler,
        visible: action.visible,
        enabled: action.enabledForContextMenu
      });
    }
  }

  /**
   * Generates the XML string for the Cut Button.
   * @param action The instance of the standard action
   * @param table The instance of the table building block
   * @param forContextMenu
   * @param handlerProvider
   * @returns The XML string representation of the Cut Button
   */
  function getCutButton(action, table, forContextMenu, handlerProvider) {
    return getCutCopyPasteButton(action, table, forContextMenu, {
      idKey: "Cut",
      text: "{sap.fe.i18n>M_TABLE_CUT}",
      shortcut: "Ctrl+X",
      handler: handlerProvider.getCutHandler(forContextMenu)
    });
  }

  /**
   * Generates the XML string for the Copy button.
   * @param action The instance of the standardAction.
   * @param table The instance of the Table building block.
   * @param forContextMenu
   * @param handlerProvider
   * @returns The XML string representation of the Copy button.
   */
  function getCopyButton(action, table, forContextMenu, handlerProvider) {
    return getCutCopyPasteButton(action, table, forContextMenu, {
      idKey: "Copy",
      text: "{sap.fe.i18n>M_TABLE_COPY}",
      shortcut: "Ctrl+C",
      handler: handlerProvider.getCopyHandler(forContextMenu)
    });
  }

  /**
   * Generates the XML for the 'move up' / 'move down'' buttons.
   * @param action The instance of the standardAction.
   * @param table The instance of the Table building block.
   * @param forContextMenu
   * @param handlerProvider
   * @returns The XML for the button
   */
  function getMoveUpDownButton(action, table, forContextMenu, handlerProvider) {
    const forMoveUp = action.key === StandardActionKeys.MoveUp;
    if (!forContextMenu) {
      // for table toolbar
      return _jsx(ActionToolbarAction, {
        id: generate([table.contentId, action.key, "ActionToolbarAction"]),
        visible: action.visible,
        "dt:designtime": "not-adaptable-tree",
        children: _jsx(Button, {
          id: generate([table.contentId, action.key]),
          text: forMoveUp ? "{sap.fe.i18n>M_TABLE_MOVE_UP}" : "{sap.fe.i18n>M_TABLE_MOVE_DOWN}",
          "jsx:command": forMoveUp ? "cmd:TableMoveElementUp|press" : "cmd:TableMoveElementDown|press",
          visible: action.visible,
          enabled: action.enabled,
          children: {
            layoutData: _jsx(OverflowToolbarLayoutData, {
              priority: action.priority,
              group: action.group
            })
          }
        })
      });
    } else {
      // for context menu
      return _jsx(MenuItem, {
        id: generate([table.contentId, action.key, "ContextMenu"]),
        text: forMoveUp ? "{sap.fe.i18n>M_TABLE_MOVE_UP}" : "{sap.fe.i18n>M_TABLE_MOVE_DOWN}",
        press: handlerProvider.getMoveUpDownHandler(forMoveUp, true),
        visible: action.visible,
        enabled: action.enabledForContextMenu
      });
    }
  }
  /**
   * Generates the XML string for the Paste Button.
   * @param action The Paste action
   * @param table The instance of the table building block
   * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
   * @param handlerProvider
   * @returns The XML string representation of the Paste Button
   */
  function getPasteButton(action, table, forContextMenu, handlerProvider) {
    if (table.tableDefinition.control.type !== "TreeTable") {
      return undefined;
    }
    return getCutCopyPasteButton(action, table, forContextMenu, {
      idKey: "Paste",
      text: "{sap.fe.i18n>M_PASTE}",
      shortcut: "Ctrl+V",
      handler: handlerProvider.getPasteHandler(forContextMenu)
    });
  }

  /**
   * Generates the XML string for actions.
   * @param table The instance of the table building block
   * @param parameters
   * @param collectionContext The context of the collection
   * @param collectionEntity The entity set of the collection
   * @returns The XML string representation of the actions
   */
  function getTableActionsTemplate(table, parameters, collectionContext, collectionEntity) {
    const _collectionIsDraftEnabled = ModelHelper.isDraftNode(collectionEntity) || ModelHelper.isDraftRoot(collectionEntity);
    let searchable;
    if (table.isSearchable === false) {
      searchable = false;
    } else {
      searchable = table.tableDefinition.annotation.searchable;
    }
    const actions = [];
    const basicSearch = getBasicSearch(!!table.useBasicSearch, table.filterBar, _collectionIsDraftEnabled, searchable);
    if (basicSearch) {
      actions.push(basicSearch);
    }
    actions.push(...getActions(table, false, parameters, collectionContext, collectionEntity));
    return actions;
  }

  /**
   * Generates the xml string for context menu actions.
   * @param table The instance of the table building block
   * @param parameters
   * @param collectionContext The context of the collection
   * @param collectionEntity The entity set of the collection
   * @returns The xml string representation of the actions
   */
  _exports.getTableActionsTemplate = getTableActionsTemplate;
  function getTableContextMenuTemplate(table, parameters, collectionContext, collectionEntity) {
    const template = getActions(table, true, parameters, collectionContext, collectionEntity);
    if (table.tableDefinition.control.type === "TreeTable") {
      template.push(getExpandedCollapseActions(table, true, parameters.handlerProvider.expandNode));
      template.push(getExpandedCollapseActions(table, false, parameters.handlerProvider.collapseNode));
    }
    return template;
  }
  _exports.getTableContextMenuTemplate = getTableContextMenuTemplate;
  function getExpandedCollapseActions(table, expand, pressHandler) {
    const enableExpression = expand ? and(equal(pathInModel("contextmenu/isExpandable", "internal"), true), equal(pathInModel("contextmenu/numberOfSelectedContexts", "internal"), 1)) : and(equal(pathInModel("contextmenu/isCollapsable", "internal"), true), equal(pathInModel("contextmenu/numberOfSelectedContexts", "internal"), 1));
    return _jsx(MenuItem, {
      id: generate([table.contentId, expand ? "Expand" : "Collapse", "ContextMenu"]),
      text: expand ? "{sap.fe.i18n>M_TABLE_CONTEXTMENU_EXPAND}" : "{sap.fe.i18n>M_TABLE_CONTEXTMENU_COLLAPSE}",
      press: pressHandler,
      enabled: enableExpression
    });
  }
  return _exports;
}, false);
//# sourceMappingURL=ActionsTemplating-dbg.js.map
