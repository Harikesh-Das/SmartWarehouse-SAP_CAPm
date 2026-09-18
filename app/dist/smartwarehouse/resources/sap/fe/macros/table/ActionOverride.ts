import { defineUI5Class, implementInterface, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";
import type { OverflowToolbarPriority } from "sap/m/library";
import type ITableAction from "./ITableAction";
import type ITableActionOrGroup from "./ITableActionOrGroup";

/**
 * Definition of an override for the action to be used inside the Table building block.
 * @public
 */
@defineUI5Class("sap.fe.macros.table.ActionOverride")
export default class ActionOverride
	extends BuildingBlockObjectProperty<{ enabled: boolean; visible: boolean }>
	implements ITableActionOrGroup, ITableAction
{
	@implementInterface("sap.fe.macros.table.ITableActionOrGroup")
	__implements__sap_fe_macros_table_ITableActionOrGroup = true;

	@implementInterface("sap.fe.macros.table.ITableAction")
	__implements__sap_fe_macros_table_ITableAction = true;

	/**
	 * Unique identifier of the action to overridden.
	 * @public
	 */
	@property({ type: "string", required: true })
	key!: string;

	/**
	 * Reference to the key of another action already displayed in the toolbar to properly place this one
	 * @public
	 */
	@property({ type: "string" })
	anchor?: string;

	/**
	 * Defines where this action should be placed relative to the defined anchor
	 *
	 * Allowed values are `Before` and `After`
	 * @public
	 */
	@property({ type: "string" })
	placement?: "Before" | "After";

	/**
	 * Enables or disables the action
	 * @public
	 */
	@property({ type: "boolean", bindToState: true })
	enabled?: boolean;

	@property({ type: "string" })
	enabledCallBack?: string;

	/**
	 * Determines the shortcut combination to trigger the action
	 * @public
	 */
	@property({ type: "string" })
	command?: string;

	/**
	 * Determines whether the action requires selecting one item or multiple items.
	 * Allowed values are `single` and `multi`
	 * @public
	 */
	@property({ type: "string" })
	enableOnSelect?: "single" | "multi";

	/**
	 * Determines if the auto scroll is enabled after executing the action.
	 * @public
	 */
	@property({ type: "boolean" })
	enableAutoScroll?: boolean;

	/**
	 * Determines whether the action is visible.
	 * @public
	 */
	@property({ type: "boolean", bindToState: true })
	visible?: boolean;

	/**
	 * Determines whether there is a navigation after executing the action.
	 * @public
	 */
	@property({ type: "boolean" })
	navigateToInstance?: boolean;

	/**
	 * Determines the function to get the default values of the action.
	 * @public
	 */
	@property({ type: "string" })
	defaultValuesFunction?: string;

	/**
	 * Displays the AI Icon on the action button.
	 * @public
	 */
	@property({ type: "boolean", defaultValue: false })
	isAIOperation?: boolean;

	/**
	 * Defines the priority of the action in the overflow toolbar.
	 */
	@property({ type: "string" })
	priority?: OverflowToolbarPriority;

	/**
	 * Defines the group of the action in the overflow toolbar.
	 */
	@property({ type: "int" })
	group?: number;

	/**
	 * Defines the overflow group of the action in the overflow toolbar.
	 * Takes precedence over the group property when defined.
	 */
	@property({ type: "int" })
	overflowGroup?: number;

	/**
	 * Disables strict handling for this action.
	 * When true, the action does not use strict message handling.
	 * @public
	 */
	@property({ type: "boolean" })
	disableStrictHandling?: boolean;

	constructor(settings: PropertiesOf<ActionOverride>) {
		super(settings);
	}
}
