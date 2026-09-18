import type { Action } from "@sap-ux/vocabularies-types";
import type { SemanticObjectMappingType } from "@sap-ux/vocabularies-types/vocabularies/Common";
import type {
	DataFieldForActionAbstractTypes,
	DataFieldForActionGroupTypes,
	DataFieldForActionTypes
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import type { BindingToolkitExpression, CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import {
	and,
	compileExpression,
	constant,
	equal,
	formatResult,
	greaterOrEqual,
	ifElse,
	isConstant,
	not,
	or,
	pathInModel,
	resolveBindingString
} from "sap/fe/base/BindingToolkit";
import type { NavigationParameters } from "sap/fe/core/controllerextensions/InternalIntentBasedNavigation";
import type {
	CustomDefinedTableColumnForOverride,
	ManifestAction,
	NavigationSettingsConfiguration,
	OverflowGroupsConfiguration
} from "sap/fe/core/converters/ManifestSettings";
import { ActionType } from "sap/fe/core/converters/ManifestSettings";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import type { ConfigurableObject, CustomElement } from "sap/fe/core/converters/helpers/ConfigurableObject";
import { OverrideType, Placement } from "sap/fe/core/converters/helpers/ConfigurableObject";
import { getCustomActionID } from "sap/fe/core/converters/helpers/ID";
import fpmFormatter from "sap/fe/core/formatters/FPMFormatter";
import { Draft, UI } from "sap/fe/core/helpers/BindingHelper";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { replaceSpecialChars } from "sap/fe/core/helpers/StableIdHelper";
import { getActionEnabledExpression } from "sap/fe/core/templating/UIFormatters";
import type { OverflowToolbarPriority } from "sap/m/library";
import { type PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import type View from "sap/ui/core/mvc/View";
import type Context from "sap/ui/model/Context";
import type { MetaModelType } from "types/metamodel_types";
import type ConverterContext from "../../ConverterContext";

export enum ButtonType {
	Accept = "Accept",
	Attention = "Attention",
	Back = "Back",
	Critical = "Critical",
	Default = "Default",
	Emphasized = "Emphasized",
	Ghost = "Ghost",
	Negative = "Negative",
	Neutral = "Neutral",
	Reject = "Reject",
	Success = "Success",
	Transparent = "Transparent",
	Unstyled = "Unstyled",
	Up = "Up"
}

export const aiIcon = "sap-icon://ai";
export const PRINT_ICON = "sap-icon://print";
export const EXPORT_TO_SPREADSHEET_ICON = "sap-icon://excel-attachment";
export const EXPORT_TO_CSV_ICON = "sap-icon://document";
export const EXPORT_TO_PDF_ICON = "sap-icon://pdf-attachment";

export type BaseAction = ConfigurableObject & {
	id?: string;
	text?: string;
	type?: ActionType;
	press?: string;
	enabled?: CompiledBindingToolkitExpression;
	enabledForContextMenu?: CompiledBindingToolkitExpression;
	visible?: CompiledBindingToolkitExpression;
	/** Runtime-only: uncompiled visibility expression, used to build composite bindings without string concatenation */
	visibleExpression?: BindingToolkitExpression<boolean>;
	/** Manifest-only: marks this custom action as primary and therefore eligible for emphasis. */
	isPrimaryAction?: boolean;
	enableOnSelect?: string;
	annotationPath?: string;
	defaultValuesExtensionFunction?: string;
	isNavigable?: boolean;
	enableAutoScroll?: boolean;
	parentEntityDeleteEnabled?: CompiledBindingToolkitExpression;
	menu?: BaseAction[];
	facetName?: string;
	command?: string | undefined;
	isAIOperation?: boolean;
	priority?: OverflowToolbarPriority | CompiledBindingToolkitExpression;
	group?: number;
	overflowGroup?: number;
	disableStrictHandling?: boolean;
	invocationGrouping?: string;
	buttonType?: ButtonType | CompiledBindingToolkitExpression;
	/**
	 * True if this action (or one of its menu items) has a Criticality annotation.
	 * Used to compute runtime rules for emphasis.
	 */
	hasCriticality?: boolean;
	/** Runtime-only: visibility for the first-position emphasized clone in the header. */
	emphFirstVisible?: CompiledBindingToolkitExpression;
	/** Runtime-only: visibility for the regular action instance. */
};

export type AnnotationAction = BaseAction & {
	type: ActionType.DataFieldForIntentBasedNavigation | ActionType.DataFieldForAction | ActionType.Menu | ActionType.Copy;
	annotationPath: string;
	customData?: string;
	requiresDialog?: string;
	binding?: string;
	buttonType?: ButtonType.Ghost | ButtonType.Transparent | string;
};

export type DataFieldForAction = AnnotationAction & {
	type: ActionType.DataFieldForAction;
	actionName?: String;
};

export type IBNAction = AnnotationAction & {
	type: ActionType.DataFieldForIntentBasedNavigation;
	navigationParameters?: {
		semanticObject: string;
		action: string;
		parameters: NavigationParameters;
	};
};

/**
 * Represents a group of actions displayed in a menu/dropdown.
 * Implements DataFieldForActionGroup from UI annotations.
 */
export type ActionGroup = BaseAction & {
	type: ActionType.Menu;
	menu: BaseAction[];
};

export type CustomAction = CustomElement<
	Omit<BaseAction, "enabled" | "enabledForContextMenu" | "visible"> & {
		handlerMethod?: string;
		handlerModule?: string;
		noWrap?: boolean; // Indicates that we want to avoid the wrapping from the FPMHelper
		requiresSelection?: boolean;
		defaultAction?: string | BaseAction | CustomAction; // Indicates whether a default action exists in this context
		enabled?: CompiledBindingToolkitExpression | PropertyBindingInfo;
		enabledForContextMenu?: CompiledBindingToolkitExpression | PropertyBindingInfo;
		visible?: CompiledBindingToolkitExpression | PropertyBindingInfo;
	}
>;

export type CombinedAction = {
	actions: BaseAction[];
	commandActions: Record<string, BaseAction>;
};

export type OverrideTypeAction = {
	// Core properties
	enabled?: OverrideType.overwrite;
	visible?: OverrideType.overwrite;
	command?: OverrideType.overwrite;
	position?: OverrideType.overwrite;
	priority?: OverrideType.overwrite;
	group?: OverrideType.overwrite;
	overflowGroup?: OverrideType.overwrite;
	text?: OverrideType.overwrite;
	disableStrictHandling?: OverrideType.overwrite;
	menu?: OverrideType.overwrite;

	// Navigation-specific properties (conditionally included)
	isNavigable?: OverrideType.overwrite;
	defaultValuesExtensionFunction?: OverrideType.overwrite;

	// Selection-specific properties (conditionally included)
	enableOnSelect?: OverrideType.overwrite;
	enableAutoScroll?: OverrideType.overwrite;
};

export type DataFieldForActionOrActionGroup = DataFieldForActionTypes | DataFieldForActionGroupTypes;

/**
 * Returns the action override configuration for manifest actions.
 * @param includeNavigation Include navigation-specific properties (isNavigable, defaultValuesExtensionFunction, menu)
 * @param includeSelection Include selection-specific properties (enableOnSelect, enableAutoScroll)
 * @returns Action override configuration with the specified properties
 */
export function getActionOverrideConfig(includeNavigation = false, includeSelection = false): OverrideTypeAction {
	const config: OverrideTypeAction = {
		enabled: OverrideType.overwrite,
		visible: OverrideType.overwrite,
		command: OverrideType.overwrite,
		position: OverrideType.overwrite,
		priority: OverrideType.overwrite,
		group: OverrideType.overwrite,
		overflowGroup: OverrideType.overwrite,
		text: OverrideType.overwrite,
		disableStrictHandling: OverrideType.overwrite,
		menu: OverrideType.overwrite
	};

	if (includeNavigation) {
		config.isNavigable = OverrideType.overwrite;
		config.defaultValuesExtensionFunction = OverrideType.overwrite;
	}

	if (includeSelection) {
		config.enableOnSelect = OverrideType.overwrite;
		config.enableAutoScroll = OverrideType.overwrite;
	}

	return config;
}
/**
 * Method provides actions collection after calculating the visible setting for all actions of type menu depending on its visible setting and its menu items visible settings.
 * @param actions Collection of actions
 * @returns Collection of actions with visible setting set for actions of type menu
 */
export const getVisibilityEnablementMenuActions = (actions: BaseAction[]): BaseAction[] => {
	let menuActionNotVisible: string | boolean,
		menuActionVisiblePaths: string[],
		atleastOneMenuItemsVisible: boolean,
		menuItemsVisiblePaths: string[];
	actions.forEach((menuAction: BaseAction) => {
		menuActionNotVisible = menuAction.visible?.valueOf() === "false";
		atleastOneMenuItemsVisible = false;
		menuItemsVisiblePaths = [];
		menuActionVisiblePaths = [];
		if (menuAction.visible && !(menuAction.visible.valueOf() === "true" || menuAction.visible.valueOf() === "false")) {
			menuActionVisiblePaths.push(menuAction.visible);
		}
		if (menuAction?.menu?.length) {
			menuAction?.menu?.forEach((menuItem: BaseAction): void => {
				const menuItemVisible = menuItem.visible;
				if (menuItemVisible && (typeof menuItemVisible === "boolean" || menuItemVisible.valueOf() === "true")) {
					atleastOneMenuItemsVisible = true;
				} else if (menuItemVisible && menuItemVisible.valueOf() !== "false") {
					menuItemsVisiblePaths.push(menuItemVisible.valueOf());
				}
			});
			if (menuActionNotVisible) {
				// if menu is statically visible false
				menuAction.visible = false.toString();
			} else if (!atleastOneMenuItemsVisible && !menuItemsVisiblePaths.length) {
				// if all menu items are statically visible false
				menuAction.visible = false.toString();
			} else if (atleastOneMenuItemsVisible && !menuActionVisiblePaths.length) {
				// if at least one menu item is statically visible true and no visible setting for menu
				menuAction.visible = true.toString();
			} else if (atleastOneMenuItemsVisible) {
				// if at least one menu item, then just consider visible setting of the menu
				menuAction.visible = compileExpression(resolveBindingString(menuAction.visible as string));
			} else if (menuActionVisiblePaths.length || menuItemsVisiblePaths.length) {
				// If the menu is set to invisible, it should be invisible, otherwise the visibility should be calculated from the items
				const visibleExpressions: BindingToolkitExpression<boolean>[] = menuItemsVisiblePaths.map((menuItemVisiblePath) =>
					resolveBindingString(menuItemVisiblePath, "boolean")
				);
				menuAction.visible = compileExpression(
					and(resolveBindingString((menuAction.visible as string) || true, "boolean"), or(...visibleExpressions))
				);
			} else {
				menuAction.visible = (!menuActionNotVisible).toString();
			}
		}
	});
	return actions;
};

/**
 * Adds the collaboration condition to all actions with type ForAction.
 * This disables the actions if the collaboration is enabled, but the user doesn't have the authorization from the back end.
 * @param actions The list of definitions of the table actions.
 */
export function addCollaborationCondition(actions: BaseAction[]): void {
	actions.forEach((action) => {
		if (action.visible?.valueOf() === "false") {
			return;
		}
		if (action.type === "ForAction") {
			action.visible = compileExpression(
				and(resolveBindingString(action.visible as string, "boolean"), not(equal(UI.hasCollaborationAuthorization, false)))
			);
		}
	});
}

/**
 * Maps an action by its key, based on the given annotation actions and manifest configuration. The result already represents the
 * merged action from both configuration sources.
 *
 * This function also returns an indication whether the action can be a menu item, saying whether it is visible or of a specific type
 * that allows this.
 * @param manifestActions Actions defined in the manifest
 * @param annotationActions Actions defined through annotations
 * @param actionKey Action Key to look up
 * @returns Merged action and indicator whether it can be a menu item
 */
function mapActionByKey(
	manifestActions: Record<string, PartiallyConvertedCustomAction>,
	annotationActions: BaseAction[],
	actionKey: string
): { action: BaseAction; canBeMenuItem: boolean | CompiledBindingToolkitExpression } {
	const annotationAction = annotationActions.find((action) => action.key === actionKey);
	const manifestAction = manifestActions[actionKey];
	let resultAction: PartiallyConvertedCustomAction | BaseAction = { ...(annotationAction ?? manifestAction) };

	// actions inside menus can't be found on top level, so assign actions from menu to it
	if (Object.keys(resultAction).length === 0) {
		annotationActions
			.filter((actionAnnotation: BaseAction) => {
				return actionAnnotation.type === ActionType.Menu;
			})
			.forEach((menuAction: BaseAction) => {
				menuAction.menu?.forEach((menuItem: BaseAction) => {
					if (menuItem.key === actionKey) {
						resultAction = menuItem;
					}
				});
			});
	}

	// Annotation action and manifest configuration already has to be merged here as insertCustomElements only considers top-level actions
	if (annotationAction) {
		// If enabled or visible is not set in the manifest, use the annotation value and hence do not overwrite
		resultAction.enabled = manifestAction?.enabled ?? annotationAction.enabled;
		resultAction.visible = manifestAction?.visible ?? annotationAction.visible;

		for (const prop in manifestAction || {}) {
			const propKey = prop as keyof BaseAction;
			if (!annotationAction[propKey] && propKey !== "menu") {
				resultAction[propKey] = manifestAction[propKey] as never;
			}
		}
	}

	const canBeMenuItem =
		resultAction?.visible ||
		resultAction?.type === ActionType.DataFieldForAction ||
		resultAction?.type === ActionType.DataFieldForIntentBasedNavigation;

	return {
		action: resultAction as BaseAction,
		canBeMenuItem
	};
}

/**
 * Map the default action key of a menu to its actual action configuration and identify whether this default action is a command.
 * @param menuAction Menu action to map the default action for
 * @param manifestActions Actions defined in the manifest
 * @param annotationActions Actions defined through annotations
 * @param commandActions Array of command actions to push the default action to if applicable
 */
function mapMenuDefaultAction(
	menuAction: PartiallyConvertedCustomAction,
	manifestActions: Record<string, PartiallyConvertedCustomAction>,
	annotationActions: BaseAction[],
	commandActions: Record<string, BaseAction>
): void {
	const { action, canBeMenuItem } = mapActionByKey(manifestActions, annotationActions, menuAction.defaultAction as string);

	if (canBeMenuItem) {
		menuAction.defaultAction = action;
	}

	if (action.command) {
		commandActions[action.key] = action;
	}
}

/**
 * Map the menu item keys of a menu to their actual action configurations and identify whether they are commands.
 * @param menuAction Menu action to map the menu items for
 * @param manifestActions Actions defined in the manifest
 * @param annotationActions Actions defined through annotations
 * @param commandActions Array of command actions to push the menu item actions to if applicable
 */
function mapMenuItems(
	menuAction: PartiallyConvertedCustomAction,
	manifestActions: Record<string, PartiallyConvertedCustomAction>,
	annotationActions: BaseAction[],
	commandActions: Record<string, BaseAction>
): void {
	const mappedMenuItems: BaseAction[] = [];
	const matchingAnnotationAction = annotationActions.find((annotationAction) => annotationAction.key === menuAction.key);

	if (menuAction.menu?.length !== 0) {
		for (const menuItemKey of menuAction.menu ?? []) {
			const { action, canBeMenuItem } = mapActionByKey(manifestActions, annotationActions, menuItemKey);

			if (canBeMenuItem) {
				mappedMenuItems.push(action);
			}

			if (action.command) {
				commandActions[menuItemKey] = action;
			}
		}
	}

	// If no menu items are assigned to the manifest-override-menu, it inherits the items from the previous menu
	else if (matchingAnnotationAction) {
		matchingAnnotationAction.menu?.forEach((menuItem) => mappedMenuItems.push(menuItem));
	}

	const mappedMenuAction = menuAction as BaseAction;
	mappedMenuAction.menu = mappedMenuItems;
}

/**
 * Transforms the flat collection of actions into a nested structures of menus. The result is a record of actions that are either menus or
 * ones that do not appear in menus as menu items. It also returns a list of actions that have an assigned command.
 *
 * Note that menu items are already the merged result of annotation actions and their manifest configuration, as {@link insertCustomElements}
 * only considers root-level actions.
 * @param manifestActions Actions defined in the manifest
 * @param annotationActions Actions defined through annotations
 * @returns The transformed actions from the manifest and a list of command actions
 */
function transformMenuActionsAndIdentifyCommands(
	manifestActions: Record<string, PartiallyConvertedCustomAction>,
	annotationActions: BaseAction[]
): Record<string, Record<string, CustomAction>> {
	const allActions: Record<string, CustomAction> = {};
	const actionKeysToDelete: string[] = [];
	const commandActions: Record<string, CustomAction> = {};

	for (const actionKey in manifestActions) {
		const manifestAction: PartiallyConvertedCustomAction = manifestActions[actionKey];

		if (manifestAction.defaultAction !== undefined) {
			mapMenuDefaultAction(manifestAction, manifestActions, annotationActions, commandActions);
		}

		if (manifestAction.type === ActionType.Menu) {
			mapMenuItems(manifestAction, manifestActions, annotationActions, commandActions);

			// Menu has no visible items, so remove it
			if (!manifestAction.menu?.length) {
				actionKeysToDelete.push(manifestAction.key);
			}
		}

		if (manifestAction.command) {
			commandActions[actionKey] = manifestAction as CustomAction;
		}

		allActions[actionKey] = manifestAction as CustomAction;
	}

	actionKeysToDelete.forEach((actionKey: string) => delete allActions[actionKey]);

	return {
		actions: allActions,
		commandActions: commandActions
	};
}

/**
 * Gets the binding expression for the enablement of a manifest action.
 * @param manifestAction The action configured in the manifest
 * @param isAnnotationAction Whether the action, defined in manifest, corresponds to an existing annotation action.
 * @param converterContext
 * @param forContextMenu
 * @returns Determined property value for the enablement
 */
const _getManifestEnabled = function (
	manifestAction: ManifestAction,
	isAnnotationAction: boolean,
	converterContext: ConverterContext<PageContextPathTarget>,
	forContextMenu = false
): CompiledBindingToolkitExpression | undefined | PropertyBindingInfo {
	const enabledValue = manifestAction.enabled;
	if (isAnnotationAction && enabledValue === undefined) {
		// If annotation action has no property defined in manifest,
		// do not overwrite it with manifest action's default value.
		return undefined;
	}

	if (typeof enabledValue === "object") {
		// We already have a BindingInfo, so we return it as is
		return enabledValue;
	}

	const result = getManifestActionBooleanPropertyWithFormatter(enabledValue, converterContext, forContextMenu);

	// Consider requiresSelection property to include selectedContexts in the binding expression
	const internalModelProperty = !forContextMenu ? "numberOfSelectedContexts" : "contextmenu/numberOfSelectedContexts";
	return compileExpression(
		ifElse(
			manifestAction.requiresSelection === true,
			ifElse(
				manifestAction.enableOnSelect === "single",
				and(equal(pathInModel(internalModelProperty, "internal"), 1), result),
				and(greaterOrEqual(pathInModel(internalModelProperty, "internal"), 1), result)
			),
			result
		)
	);
};

/**
 * Gets the binding expression for the visibility of a manifest action.
 * @param manifestAction The action configured in the manifest
 * @param isAnnotationAction Whether the action, defined in the manifest, corresponds to an existing annotation action.
 * @param converterContext
 * @returns Determined property value for the visibility
 */
const _getManifestVisible = function (
	manifestAction: ManifestAction,
	isAnnotationAction: boolean,
	converterContext: ConverterContext<PageContextPathTarget>
): CompiledBindingToolkitExpression | undefined | PropertyBindingInfo {
	const visibleValue = manifestAction.visible;
	if (isAnnotationAction && visibleValue === undefined) {
		// If annotation action has no property defined in manifest,
		// do not overwrite it with manifest action's default value.
		return undefined;
	}

	if (typeof visibleValue === "object") {
		// We already have a BindingInfo, so we return it as is
		return visibleValue;
	}

	const result = getManifestActionBooleanPropertyWithFormatter(visibleValue, converterContext);
	return compileExpression(result);
};

type PartiallyConvertedCustomAction = Omit<CustomAction, "menu"> & {
	menu: string[] | undefined;
	priority?: OverflowToolbarPriority;
	group?: number;
	overflowGroup?: number;
};

/**
 * As some properties should not be overridable by the manifest, make sure that the manifest configuration gets the annotation values for these.
 * @param manifestAction Action defined in the manifest
 * @param annotationAction Action defined through annotations
 */
function overrideManifestConfigurationWithAnnotation(manifestAction: PartiallyConvertedCustomAction, annotationAction?: BaseAction): void {
	if (!annotationAction) {
		return;
	}

	// Do not override the 'type' given in an annotation action
	manifestAction.type = annotationAction.type;
	manifestAction.annotationPath = annotationAction.annotationPath;
	manifestAction.press = annotationAction.press;

	// Only use the annotation values for enablement and visibility if not set in the manifest
	manifestAction.enabled = manifestAction.enabled ?? annotationAction.enabled;
	manifestAction.visible = manifestAction.visible ?? annotationAction.visible;
}

/**
 * Creates the action configuration based on the manifest settings.
 * @param manifestActions The manifest actions
 * @param converterContext The converter context
 * @param annotationActions The annotation actions definition
 * @param navigationSettings The navigation settings
 * @param considerNavigationSettings The navigation settings to be considered
 * @param hiddenActions Actions that are configured as hidden (additional to the visible property)
 * @param facetName The facet where an action is displayed if it is inline
 * @returns The actions from the manifest
 */
export function getActionsFromManifest(
	manifestActions: Record<string, ManifestAction> | undefined,
	converterContext: ConverterContext<PageContextPathTarget>,
	annotationActions?: BaseAction[],
	navigationSettings?: NavigationSettingsConfiguration,
	considerNavigationSettings?: boolean,
	hiddenActions?: BaseAction[],
	facetName?: string
): Record<string, Record<string, CustomAction>> {
	const actions: Record<string, PartiallyConvertedCustomAction> = {};
	for (const actionKey in manifestActions) {
		const manifestAction: ManifestAction = manifestActions[actionKey];
		const lastDotIndex = manifestAction.press?.lastIndexOf(".") || -1;
		let annotationAction: BaseAction | undefined;

		if (annotationActions) {
			for (const action of annotationActions) {
				// SubSection.ts#createFormActionReducer uses insertCustomElements which results in annotation actions mixing up with manifest action
				// this is why we may find an action that has a CustomAction prefix
				if (action.id?.startsWith("CustomAction::")) {
					continue;
				}
				if (action.key === actionKey) {
					annotationAction = action;
					break;
				} else if (action.type === "Menu") {
					// If not found, check inside menus
					annotationAction = action.menu?.find((menuItem: BaseAction) => {
						return menuItem.key === actionKey;
					});
					if (annotationAction) {
						break;
					}
				}
			}
		}

		// To identify the annotation action property overwrite via manifest use-case.
		const isAnnotationAction = !!annotationAction;
		if (manifestAction.facetName) {
			facetName = manifestAction.facetName;
		}

		actions[actionKey] = {
			id: annotationAction ? actionKey : getCustomActionID(actionKey),
			type: manifestAction.menu ? ActionType.Menu : ActionType.Default,
			visible: _getManifestVisible(manifestAction, isAnnotationAction, converterContext),
			enabled: _getManifestEnabled(manifestAction, isAnnotationAction, converterContext),
			enabledForContextMenu: _getManifestEnabled(manifestAction, isAnnotationAction, converterContext, true),
			handlerModule: manifestAction.press && manifestAction.press.substring(0, lastDotIndex).replace(/\./gi, "/"),
			handlerMethod: manifestAction.press && manifestAction.press.substring(lastDotIndex + 1),
			press: manifestAction.press,
			text: manifestAction.text,
			noWrap: manifestAction.__noWrap,
			key: replaceSpecialChars(actionKey),
			enableOnSelect: manifestAction.enableOnSelect,
			defaultValuesExtensionFunction: manifestAction.defaultValuesFunction,
			position: {
				anchor: manifestAction.position?.anchor,
				placement: manifestAction.position === undefined ? Placement.After : manifestAction.position.placement
			},
			isNavigable: isActionNavigable(manifestAction, navigationSettings, considerNavigationSettings),
			command: manifestAction.command,
			requiresSelection: manifestAction.requiresSelection === undefined ? false : manifestAction.requiresSelection,
			enableAutoScroll: enableAutoScroll(manifestAction),
			menu: manifestAction.menu ?? (annotationAction?.type === ActionType.Menu ? [] : undefined),
			facetName: manifestAction.inline ? facetName : undefined,
			defaultAction: manifestAction.defaultAction,
			isAIOperation: manifestAction?.isAIOperation ?? false,
			priority: manifestAction?.priority ?? undefined,
			group: manifestAction?.overflowGroup ?? manifestAction?.group ?? 0,
			overflowGroup: manifestAction?.overflowGroup ?? undefined,
			disableStrictHandling: manifestAction?.disableStrictHandling ?? undefined,
			isPrimaryAction: manifestAction.isPrimaryAction ?? undefined
		};

		overrideManifestConfigurationWithAnnotation(actions[actionKey], annotationAction);
	}

	return transformMenuActionsAndIdentifyCommands(actions, annotationActions ?? []);
}

/**
 * Gets a binding expression representing a Boolean manifest property that can either be represented by a static value, a binding string,
 * or a runtime formatter function.
 * @param propertyValue String representing the configured property value
 * @param converterContext
 * @param forContextMenu Indicates whether the property is requested for a context menu action
 * @returns A binding expression representing the property
 */
function getManifestActionBooleanPropertyWithFormatter(
	propertyValue: string | undefined | boolean,
	converterContext: ConverterContext<PageContextPathTarget>,
	forContextMenu = false
): BindingToolkitExpression<boolean> {
	const resolvedBinding = resolveBindingString<boolean | string>(propertyValue as string, "boolean");
	let result: BindingToolkitExpression<boolean>;
	if (isConstant(resolvedBinding) && resolvedBinding.value === undefined) {
		// No property value configured in manifest for the custom action --> default value is true
		result = constant(true);
	} else if (isConstant(resolvedBinding) && typeof resolvedBinding.value === "string") {
		// Then it's a module-method reference "sap.xxx.yyy.doSomething"
		const methodPath = resolvedBinding.value;
		const internalModelPath = forContextMenu ? "contextmenu/selectedContexts" : "selectedContexts";
		// FIXME: The custom "isEnabled" check does not trigger (because none of the bound values changes)
		result = formatResult(
			[pathInModel<View>("/", "$view"), methodPath, pathInModel<Context[]>(internalModelPath, "internal")],
			fpmFormatter.customBooleanPropertyCheck,
			!forContextMenu
				? converterContext.getDataModelObjectPath().contextLocation?.targetEntityType || converterContext.getEntityType()
				: undefined
		);
	} else {
		// then it's a binding
		result = resolvedBinding as BindingToolkitExpression<boolean>;
	}

	return result;
}

export const removeDuplicateActions = (actions: BaseAction[]): BaseAction[] => {
	let oMenuItemKeys: Record<string, boolean> = {};
	actions.forEach((action) => {
		if (action?.menu?.length) {
			const actionMenu = action.menu;
			oMenuItemKeys = actionMenu.reduce((item: Record<string, boolean>, { key }) => {
				if (key && !item[key]) {
					item[key] = true;
				}
				return item;
			}, oMenuItemKeys);
		}
	});
	return actions.filter((action) => !oMenuItemKeys[action.key]);
};

export function getEnabledForAnnotationActionExpression(
	converterContext: ConverterContext<PageContextPathTarget>,
	actionTarget: Action | undefined,
	pathFromContextLocation = false
): BindingToolkitExpression<boolean> {
	if (actionTarget?.annotations.Core?.OperationAvailable) {
		const dataModelObjectPath = converterContext.getDataModelObjectPath();
		let isEnabledExp = getActionEnabledExpression(
			actionTarget,
			converterContext.getConvertedTypes(),
			dataModelObjectPath,
			pathFromContextLocation
		);
		const collaborationOnRoot =
			ModelHelper.isCollaborationDraftSupportedFromConverterContext(converterContext) &&
			ModelHelper.getDraftRoot(converterContext.getEntitySet());
		if (collaborationOnRoot) {
			isEnabledExp = and(isEnabledExp, not(equal(UI.hasCollaborationAuthorization, false)));
		}
		return isEnabledExp;
	}
	return constant(true);
}

/**
 * Method to determine the value of the 'enabled' property of an annotation-based action.
 * @param converterContext The instance of the converter context
 * @param actionTarget The instance of the action
 * @param pathFromContextLocation Is the binding path calculated  from the converter context location
 * @returns The binding expression for the 'enabled' property of the action button.
 */
export function getEnabledForAnnotationAction(
	converterContext: ConverterContext<PageContextPathTarget>,
	actionTarget: Action | undefined,
	pathFromContextLocation = false
): CompiledBindingToolkitExpression {
	return compileExpression(getEnabledForAnnotationActionExpression(converterContext, actionTarget, pathFromContextLocation));
}

export function getSemanticObjectMapping(mappings?: SemanticObjectMappingType[]): MetaModelType<SemanticObjectMappingType>[] {
	return mappings
		? mappings.map((mapping) => {
				return {
					LocalProperty: {
						$PropertyPath: mapping.LocalProperty.value
					},
					SemanticObjectProperty: mapping.SemanticObjectProperty.toString()
				};
		  })
		: [];
}

export function isActionNavigable(
	action: ManifestAction | CustomDefinedTableColumnForOverride | undefined,
	navigationSettings?: NavigationSettingsConfiguration,
	considerNavigationSettings?: boolean
): boolean {
	let bIsNavigationConfigured = true;
	if (considerNavigationSettings) {
		const detailOrDisplay = navigationSettings && (navigationSettings.detail || navigationSettings.display);
		bIsNavigationConfigured = detailOrDisplay?.route ? true : false;
	}
	// when enableAutoScroll is true the navigateToInstance feature is disabled
	if (
		(action &&
			action.afterExecution &&
			(action.afterExecution?.navigateToInstance === false || action.afterExecution?.enableAutoScroll === true)) ||
		!bIsNavigationConfigured
	) {
		return false;
	}
	return true;
}

export function enableAutoScroll(action: ManifestAction): boolean {
	return action?.afterExecution?.enableAutoScroll === true;
}

export function dataFieldIsCopyAction(dataField: DataFieldForActionTypes): boolean {
	return dataField.annotations?.UI?.IsCopyAction?.valueOf() === true && dataField.$Type === UIAnnotationTypes.DataFieldForAction;
}

export function getCopyAction(copyDataFields: DataFieldForActionTypes[]): DataFieldForActionTypes | undefined {
	if (copyDataFields.length === 1) {
		return copyDataFields[0];
	}
	if (copyDataFields.length > 1) {
		Log.error("Multiple actions are annotated with isCopyAction. There can be only one standard copy action.");
	}
	return undefined;
}

/**
 * Method to extract menu items from actions of type menus.
 * @param annotationActions Collection of annotation based actions
 * @returns Collection of actions which are menu items in one of the annotation based menus
 */
export function getAnnotationMenuActionItems(annotationActions: BaseAction[]): BaseAction[] {
	const menuActionItems: BaseAction[] = [];

	annotationActions.forEach((action: BaseAction) => {
		if (action.type === "Menu" && !action.id?.startsWith("CustomAction::") && action.menu) {
			menuActionItems.push(...action.menu);
		}
	});

	return menuActionItems;
}

/**
 * Method to find the matching manifest actions which override the annotation menu items.
 * @param annotationMenuItems Collection of annotation based menu items
 * @param manifestActions Collection of manifest based actions
 * @returns Collection of actions which are menu items in one of the annotation based menus
 */
export function getMatchingManifestAction(
	annotationMenuItems: BaseAction[],
	manifestActions: Record<string, CustomAction>
): Record<string, CustomAction> {
	const matchingManifestActions: Record<string, CustomAction> = {};

	for (const manifestAction in manifestActions) {
		if (
			manifestAction.startsWith("DataFieldForAction::") &&
			annotationMenuItems.find((menuActionItems) => {
				return menuActionItems.key === manifestAction;
			})
		) {
			matchingManifestActions[manifestAction] = manifestActions[manifestAction];
		}
	}

	return matchingManifestActions;
}

/**
 * Method to transform the menus by replacing the menu items with their overriding actions.
 * @param unpreparedActions Collection of all actions after merging manifest and annotation actions
 * @param overrideMenuActions Collection of all overriden menu items
 */
export function prepareMenuActions(unpreparedActions: BaseAction[], overrideMenuActions: BaseAction[]): void {
	let foundAction;

	unpreparedActions.forEach((action: BaseAction) => {
		if (action.type === ActionType.Menu) {
			action.menu?.forEach((menuItem: BaseAction, menuItemIndex: number) => {
				foundAction = overrideMenuActions.find((overrideMenuAction: BaseAction) => {
					return overrideMenuAction.key === menuItem.key;
				});

				if (foundAction) {
					action.menu?.splice(menuItemIndex, 1, foundAction);
				}
			});

			// Menu has isAIOperation set to true on each menu item has isAIOperation set to true
			const isAIOperation = isMenuAIOperation(action.menu as BaseAction[]);
			if (isAIOperation) {
				action.isAIOperation = isAIOperation;
			}
		}
	});
}

/**
 * Method to determine if the menu consists of all AI operation actions.
 * @param actions Collection of DataFieldForActionAbstractTypes or CustomAction in the menu
 * @returns A boolean true if all records in the menu are AI operations, false otherwise
 */
export function isMenuAIOperation(actions: DataFieldForActionAbstractTypes[] | BaseAction[]): boolean {
	let isAIOperationOccurrences = 0;
	actions.forEach((action) => {
		if ((action as DataFieldForActionAbstractTypes).$Type !== undefined) {
			if (isActionAIOperation(action as DataFieldForActionAbstractTypes)) {
				isAIOperationOccurrences++;
			}
		} else if ((action as BaseAction).type !== undefined) {
			if (isBaseActionAIOperation(action as BaseAction)) {
				isAIOperationOccurrences++;
			}
		}
	});
	if (isAIOperationOccurrences === actions?.length) return true;

	return false;
}

/**
 * Method to determine if the given record is an AI operation.
 * @param dataField The record of type DataFieldForAction or DataFieldForIntentBasedNavigation
 * @returns A boolean true if the given record is an AI operation, false otherwise
 */
export function isActionAIOperation(dataField: DataFieldForActionAbstractTypes): boolean {
	if (dataField.$Type === UIAnnotationTypes.DataFieldForAction) {
		return dataField.ActionTarget?.annotations.UI?.IsAIOperation?.valueOf() === true;
	}
	return false;
}

/**
 * Method to determine if the given action is an AI operation.
 * @param action The record of type BaseAction
 * @returns A boolean true if the given record is an AI operation, false otherwise
 */
function isBaseActionAIOperation(action: BaseAction): boolean {
	return action?.isAIOperation === true;
}

/**
 * Method to add toolbar separators if actions are grouped in more than one group.
 * @param actions Collection of merged actions from annotations and manifest settings
 * @param overflowGroupsConfig Configuration for overflow group separators from manifest settings
 * @returns Collection of merged actions with toolbar separators
 */
export function addSeparators(actions: BaseAction[], overflowGroupsConfig?: OverflowGroupsConfiguration): BaseAction[] {
	if (!overflowGroupsConfig) {
		return actions;
	}
	const result: BaseAction[] = [];
	const groupsUsed: number[] = [];
	const groupStartPositions: Record<number, number> = {};

	// First pass: identify groups and their positions
	actions.forEach((action: BaseAction, index: number) => {
		// Use overflowGroup if available, otherwise fall back to group for compatibility
		const effectiveGroup = action.overflowGroup ?? action.group;
		if (effectiveGroup !== undefined && !groupsUsed.includes(effectiveGroup)) {
			groupsUsed.push(effectiveGroup);
			groupStartPositions[effectiveGroup] = index;
		}
	});

	// Second pass: add actions and separators based on configuration
	actions.forEach((action: BaseAction, index: number) => {
		// Use overflowGroup if available, otherwise fall back to group for compatibility
		const effectiveGroup = action.overflowGroup ?? action.group;
		const groupConfig = overflowGroupsConfig?.[effectiveGroup?.toString() || ""];
		const isGroupStart = effectiveGroup !== undefined && groupStartPositions[effectiveGroup] === index;

		// Add separator at the beginning of group if configured
		if (isGroupStart && groupConfig?.showSeparator && result.length > 0) {
			// Don't add separator if it would be the first item
			result.push({
				type: ActionType.Separator,
				key: "Separator::" + effectiveGroup,
				group: effectiveGroup,
				overflowGroup: effectiveGroup,
				position: {
					placement: Placement.After
				}
			});
		}

		// Add the action itself
		result.push(action);
	});

	return result;
}

/**
 * Gets the binding expression for the visibility of the CreateNext button.
 * This function centralizes the visibility logic to be reused by both getFooterDefaultActions
 * and FooterContent.tsx.
 * @param hiddenDraftEnabled Whether hidden draft mode is enabled
 * @param fclEnabled Whether FCL (Flexible Column Layout) is enabled
 * @returns A compiled binding expression for the CreateNext button visibility
 */
export function getCreateNextButtonVisibility(hiddenDraftEnabled: boolean, fclEnabled: boolean): BindingToolkitExpression<boolean> {
	return ifElse(
		hiddenDraftEnabled === true,
		ifElse(
			fclEnabled === true,
			and(Draft.IsNewObject, equal(pathInModel("/showSaveAndCancelButton", "fclhelper"), true)),
			Draft.IsNewObject
		),
		Draft.IsNewObject
	);
}
