import type PageController from "sap/fe/core/PageController";
import { ActionType } from "sap/fe/core/converters/ManifestSettings";
import type {
	AnnotationAction,
	BaseAction,
	CustomAction,
	DataFieldForAction,
	IBNAction
} from "sap/fe/core/converters/controls/Common/Action";
import FPMHelper from "sap/fe/core/helpers/FPMHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import CommonHelper from "sap/fe/macros/CommonHelper";
import DefaultActionHandler from "sap/fe/macros/internal/helpers/DefaultActionHandler";
import Button from "sap/m/Button";
import Menu from "sap/m/Menu";
import MenuButton from "sap/m/MenuButton";
import MenuItem from "sap/m/MenuItem";
import OverflowToolbarLayoutData from "sap/m/OverflowToolbarLayoutData";
import ToolbarSeparator from "sap/m/ToolbarSeparator";
import type Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import { aria } from "sap/ui/core/library";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";

function getActionPressHandler(controller: PageController | undefined, action: BaseAction, _context?: Context): (event: Event) => void {
	if (action.command) {
		// make sure that command actions are handled by the editFlow
		action.type = ActionType.DataFieldForAction;
	}
	switch (action.type) {
		case ActionType.Menu:
			return (event: Event): void => {
				const source: Control = event.getSource();
				if ((action as CustomAction).defaultAction !== undefined) {
					controller?.editFlow.invokeAction((action as CustomAction).defaultAction as string, {
						contexts: source.getBindingContext() as Context | undefined,
						invocationGrouping: action.invocationGrouping,
						label: action.text,
						model: source.getModel() as ODataModel | undefined,
						isNavigable: action.isNavigable,
						disableStrictHandling: action.disableStrictHandling
					});
				}
			};
		case ActionType.DataFieldForAction:
			return (event: Event): void => {
				const source: Control = event.getSource();
				controller?.editFlow.invokeAction((action as DataFieldForAction).actionName! as string, {
					contexts: source.getBindingContext() as Context | undefined,
					invocationGrouping: action.invocationGrouping,
					label: action.text,
					model: source.getModel() as ODataModel | undefined,
					isNavigable: action.isNavigable,
					disableStrictHandling: action.disableStrictHandling
				});
			};
		case ActionType.DataFieldForIntentBasedNavigation:
			return (_event: Event): void => {
				controller?._intentBasedNavigation.navigate(
					(action as IBNAction).navigationParameters?.semanticObject as unknown as string,
					(action as IBNAction).navigationParameters?.action as string,
					(action as IBNAction).navigationParameters?.parameters
				);
			};
		case ActionType.Default:
			return (event: Event): void => {
				FPMHelper.actionWrapper(event, (action as CustomAction).handlerModule, (action as CustomAction).handlerMethod);
			};
		case ActionType.ShowFormDetails:
			return (event: Event): void => {
				const source: Control = event.getSource();
				const internalModel = source.getModel("internal") as JSONModel;
				const bindingContext = source.getBindingContext("internal");

				const contextPath = bindingContext?.getPath() || "";
				const path = contextPath ? `${contextPath}/showDetails` : "/showDetails";

				const currentShowDetails = internalModel?.getProperty(path) || false;
				internalModel?.setProperty(path, !currentShowDetails);
			};
		default:
			return (): void => {
				// no default action
			};
	}
}

function getMenuItem(menuItemAction: BaseAction, controller?: PageController, context?: Context): MenuItem {
	if (menuItemAction.type === "Default") {
		return (
			<MenuItem
				id={generate(["fe", menuItemAction.id])}
				text={menuItemAction.text}
				jsx:command={
					menuItemAction.command
						? `cmd:${menuItemAction.command}`
						: CommonHelper.buildActionWrapper(menuItemAction as CustomAction, { id: "forTheForm" })
				}
				press={getActionPressHandler(controller, menuItemAction, context)}
				visible={menuItemAction.visible}
				enabled={menuItemAction.enabled}
			/>
		);
	} else {
		const macrodata = { IBNData: (menuItemAction as AnnotationAction).customData };
		return (
			<MenuItem
				id={menuItemAction.id}
				binding={(menuItemAction as AnnotationAction).binding}
				text={menuItemAction.text}
				jsx:command={
					menuItemAction.command
						? `cmd:${menuItemAction.command}`
						: CommonHelper.buildActionWrapper(menuItemAction as CustomAction, { id: "forTheForm" })
				}
				press={getActionPressHandler(controller, menuItemAction, context)}
				// TODO: MenuItem does not have ariaHasPopup property, need to check if this was working previously
				//ariaHasPopup={(menuItemAction as AnnotationAction).requiresDialog ? aria.HasPopup.Dialog : undefined}
				visible={menuItemAction.visible}
				enabled={menuItemAction.enabled}
			>
				{{ macrodata: macrodata }}
			</MenuItem>
		);
	}
}

function getDefaultActionPressHandler(
	controller: PageController | undefined,
	action: BaseAction,
	context?: Context
): (event: Event) => void {
	const defaultAction = (action as CustomAction).defaultAction;
	if (defaultAction !== undefined && typeof defaultAction === "object") {
		return getActionPressHandler(controller, defaultAction as BaseAction, context);
	}
	return getActionPressHandler(controller, action, context);
}

function getFormActionButton(action: BaseAction, context: Context, controller?: PageController): Control {
	const stableActionId = action.id ? generate([action.id]) : generate(["fe", "formActionButton"]);
	const actionId = controller ? controller.createId(stableActionId) : action.id;

	const icon = action.isAIOperation === true ? CommonHelper.getAIIcon() : "";
	if (action.type === "Menu" && action.menu && action.menu.length > 0) {
		const defaultAction = (action as CustomAction).defaultAction;
		const defaultCommand = typeof defaultAction === "object" && defaultAction.command ? `cmd:${defaultAction.command}` : undefined;
		const command =
			defaultAction !== undefined
				? defaultCommand ?? CommonHelper.buildActionWrapper(action as CustomAction, { id: "forTheForm" })
				: undefined;
		return (
			<MenuButton
				text={action.text}
				icon={icon}
				menuPosition="BeginBottom"
				id={actionId}
				visible={action.visible}
				enabled={action.enabled}
				class="sapUiSmallMarginBegin"
				useDefaultActionOnly={DefaultActionHandler.getUseDefaultActionOnly(action as CustomAction)}
				buttonMode={DefaultActionHandler.getButtonMode(action as CustomAction)}
				defaultAction={getDefaultActionPressHandler(controller, action, context)}
				jsx:command={command}
				type="Transparent"
			>
				{{
					menu: (
						<Menu>
							{{
								items: action.menu.map((menuItemAction) => getMenuItem(menuItemAction, controller))
							}}
						</Menu>
					),
					layoutData: <OverflowToolbarLayoutData priority={action.priority} group={action.overflowGroup || action.group} />
				}}
			</MenuButton>
		);
	} else if (action.type === "Default") {
		return (
			<Button
				id={actionId}
				dt:designtime={action.visible === "true" || action.visible === "false" ? undefined : "not-adaptable-visibility"}
				text={action.text}
				jsx:command={
					action.command ? `cmd:${action.command}` : CommonHelper.buildActionWrapper(action as CustomAction, { id: "forTheForm" })
				}
				press={getActionPressHandler(controller, action, context)}
				type="Transparent"
				visible={action.visible}
				enabled={action.enabled}
				icon={icon}
			>
				{{
					layoutData: <OverflowToolbarLayoutData priority={action.priority} group={action.overflowGroup || action.group} />
				}}
			</Button>
		);
	} else if (action.type === "Separator") {
		return (
			<ToolbarSeparator>
				{{
					layoutData: <OverflowToolbarLayoutData priority={action.priority} group={action.overflowGroup || action.group} />
				}}
			</ToolbarSeparator>
		);
	} else {
		const macrodata = { IBNData: (action as AnnotationAction).customData };
		return (
			<Button
				id={actionId}
				dt:designtime={action.visible === "true" || action.visible === "false" ? undefined : "not-adaptable-visibility"}
				binding={(action as AnnotationAction).binding}
				text={action.text}
				icon={icon}
				jsx:command={action.command ? `cmd:${action.command}` : action.press}
				press={getActionPressHandler(controller, action, context)}
				type={(action as AnnotationAction).buttonType === "Ghost" ? "Transparent" : (action as AnnotationAction).buttonType}
				ariaHasPopup={(action as AnnotationAction).requiresDialog ? aria.HasPopup.Dialog : undefined}
				visible={action.visible}
				enabled={action.enabled}
			>
				{{
					macrodata: macrodata,
					layoutData: <OverflowToolbarLayoutData priority={action.priority} group={action.overflowGroup || action.group} />
				}}
			</Button>
		);
	}
}

export function getFormActionButtons(
	actions: BaseAction[] | undefined,
	context: Context,
	controller?: PageController
): Control[] | undefined {
	if (!actions || actions.length === 0) {
		return undefined;
	}
	return actions.map((action) => {
		return getFormActionButton(action, context, controller);
	});
}
