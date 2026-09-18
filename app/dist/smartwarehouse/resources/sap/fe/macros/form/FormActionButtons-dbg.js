/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/ManifestSettings", "sap/fe/core/helpers/FPMHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/macros/CommonHelper", "sap/fe/macros/internal/helpers/DefaultActionHandler", "sap/m/Button", "sap/m/Menu", "sap/m/MenuButton", "sap/m/MenuItem", "sap/m/OverflowToolbarLayoutData", "sap/m/ToolbarSeparator", "sap/ui/core/library", "sap/fe/base/jsx-runtime/jsx"], function (ManifestSettings, FPMHelper, StableIdHelper, CommonHelper, DefaultActionHandler, Button, Menu, MenuButton, MenuItem, OverflowToolbarLayoutData, ToolbarSeparator, library, _jsx) {
  "use strict";

  var _exports = {};
  var aria = library.aria;
  var generate = StableIdHelper.generate;
  var ActionType = ManifestSettings.ActionType;
  function getActionPressHandler(controller, action, _context) {
    if (action.command) {
      // make sure that command actions are handled by the editFlow
      action.type = ActionType.DataFieldForAction;
    }
    switch (action.type) {
      case ActionType.Menu:
        return event => {
          const source = event.getSource();
          if (action.defaultAction !== undefined) {
            controller?.editFlow.invokeAction(action.defaultAction, {
              contexts: source.getBindingContext(),
              invocationGrouping: action.invocationGrouping,
              label: action.text,
              model: source.getModel(),
              isNavigable: action.isNavigable,
              disableStrictHandling: action.disableStrictHandling
            });
          }
        };
      case ActionType.DataFieldForAction:
        return event => {
          const source = event.getSource();
          controller?.editFlow.invokeAction(action.actionName, {
            contexts: source.getBindingContext(),
            invocationGrouping: action.invocationGrouping,
            label: action.text,
            model: source.getModel(),
            isNavigable: action.isNavigable,
            disableStrictHandling: action.disableStrictHandling
          });
        };
      case ActionType.DataFieldForIntentBasedNavigation:
        return _event => {
          controller?._intentBasedNavigation.navigate(action.navigationParameters?.semanticObject, action.navigationParameters?.action, action.navigationParameters?.parameters);
        };
      case ActionType.Default:
        return event => {
          FPMHelper.actionWrapper(event, action.handlerModule, action.handlerMethod);
        };
      case ActionType.ShowFormDetails:
        return event => {
          const source = event.getSource();
          const internalModel = source.getModel("internal");
          const bindingContext = source.getBindingContext("internal");
          const contextPath = bindingContext?.getPath() || "";
          const path = contextPath ? `${contextPath}/showDetails` : "/showDetails";
          const currentShowDetails = internalModel?.getProperty(path) || false;
          internalModel?.setProperty(path, !currentShowDetails);
        };
      default:
        return () => {
          // no default action
        };
    }
  }
  function getMenuItem(menuItemAction, controller, context) {
    if (menuItemAction.type === "Default") {
      return _jsx(MenuItem, {
        id: generate(["fe", menuItemAction.id]),
        text: menuItemAction.text,
        "jsx:command": menuItemAction.command ? `cmd:${menuItemAction.command}` : CommonHelper.buildActionWrapper(menuItemAction, {
          id: "forTheForm"
        }),
        press: getActionPressHandler(controller, menuItemAction, context),
        visible: menuItemAction.visible,
        enabled: menuItemAction.enabled
      });
    } else {
      const macrodata = {
        IBNData: menuItemAction.customData
      };
      return _jsx(MenuItem, {
        id: menuItemAction.id,
        binding: menuItemAction.binding,
        text: menuItemAction.text,
        "jsx:command": menuItemAction.command ? `cmd:${menuItemAction.command}` : CommonHelper.buildActionWrapper(menuItemAction, {
          id: "forTheForm"
        }),
        press: getActionPressHandler(controller, menuItemAction, context)
        // TODO: MenuItem does not have ariaHasPopup property, need to check if this was working previously
        //ariaHasPopup={(menuItemAction as AnnotationAction).requiresDialog ? aria.HasPopup.Dialog : undefined}
        ,
        visible: menuItemAction.visible,
        enabled: menuItemAction.enabled,
        children: {
          macrodata: macrodata
        }
      });
    }
  }
  function getDefaultActionPressHandler(controller, action, context) {
    const defaultAction = action.defaultAction;
    if (defaultAction !== undefined && typeof defaultAction === "object") {
      return getActionPressHandler(controller, defaultAction, context);
    }
    return getActionPressHandler(controller, action, context);
  }
  function getFormActionButton(action, context, controller) {
    const stableActionId = action.id ? generate([action.id]) : generate(["fe", "formActionButton"]);
    const actionId = controller ? controller.createId(stableActionId) : action.id;
    const icon = action.isAIOperation === true ? CommonHelper.getAIIcon() : "";
    if (action.type === "Menu" && action.menu && action.menu.length > 0) {
      const defaultAction = action.defaultAction;
      const defaultCommand = typeof defaultAction === "object" && defaultAction.command ? `cmd:${defaultAction.command}` : undefined;
      const command = defaultAction !== undefined ? defaultCommand ?? CommonHelper.buildActionWrapper(action, {
        id: "forTheForm"
      }) : undefined;
      return _jsx(MenuButton, {
        text: action.text,
        icon: icon,
        menuPosition: "BeginBottom",
        id: actionId,
        visible: action.visible,
        enabled: action.enabled,
        class: "sapUiSmallMarginBegin",
        useDefaultActionOnly: DefaultActionHandler.getUseDefaultActionOnly(action),
        buttonMode: DefaultActionHandler.getButtonMode(action),
        defaultAction: getDefaultActionPressHandler(controller, action, context),
        "jsx:command": command,
        type: "Transparent",
        children: {
          menu: _jsx(Menu, {
            children: {
              items: action.menu.map(menuItemAction => getMenuItem(menuItemAction, controller))
            }
          }),
          layoutData: _jsx(OverflowToolbarLayoutData, {
            priority: action.priority,
            group: action.overflowGroup || action.group
          })
        }
      });
    } else if (action.type === "Default") {
      return _jsx(Button, {
        id: actionId,
        "dt:designtime": action.visible === "true" || action.visible === "false" ? undefined : "not-adaptable-visibility",
        text: action.text,
        "jsx:command": action.command ? `cmd:${action.command}` : CommonHelper.buildActionWrapper(action, {
          id: "forTheForm"
        }),
        press: getActionPressHandler(controller, action, context),
        type: "Transparent",
        visible: action.visible,
        enabled: action.enabled,
        icon: icon,
        children: {
          layoutData: _jsx(OverflowToolbarLayoutData, {
            priority: action.priority,
            group: action.overflowGroup || action.group
          })
        }
      });
    } else if (action.type === "Separator") {
      return _jsx(ToolbarSeparator, {
        children: {
          layoutData: _jsx(OverflowToolbarLayoutData, {
            priority: action.priority,
            group: action.overflowGroup || action.group
          })
        }
      });
    } else {
      const macrodata = {
        IBNData: action.customData
      };
      return _jsx(Button, {
        id: actionId,
        "dt:designtime": action.visible === "true" || action.visible === "false" ? undefined : "not-adaptable-visibility",
        binding: action.binding,
        text: action.text,
        icon: icon,
        "jsx:command": action.command ? `cmd:${action.command}` : action.press,
        press: getActionPressHandler(controller, action, context),
        type: action.buttonType === "Ghost" ? "Transparent" : action.buttonType,
        ariaHasPopup: action.requiresDialog ? aria.HasPopup.Dialog : undefined,
        visible: action.visible,
        enabled: action.enabled,
        children: {
          macrodata: macrodata,
          layoutData: _jsx(OverflowToolbarLayoutData, {
            priority: action.priority,
            group: action.overflowGroup || action.group
          })
        }
      });
    }
  }
  function getFormActionButtons(actions, context, controller) {
    if (!actions || actions.length === 0) {
      return undefined;
    }
    return actions.map(action => {
      return getFormActionButton(action, context, controller);
    });
  }
  _exports.getFormActionButtons = getFormActionButtons;
  return _exports;
}, false);
//# sourceMappingURL=FormActionButtons-dbg.js.map
