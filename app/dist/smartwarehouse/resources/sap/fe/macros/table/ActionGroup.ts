import { aggregation, defineUI5Class, implementInterface, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";
import Action from "sap/fe/macros/table/Action";
import type { OverflowToolbarPriority } from "sap/m/library";
import { type PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import type ActionOverride from "./ActionOverride";
import type ITableActionOrGroup from "./ITableActionOrGroup";

/**
 * Definition of a custom ActionGroup to be used inside the table toolbar
 * @public
 */
@defineUI5Class("sap.fe.macros.table.ActionGroup")
export default class ActionGroup extends BuildingBlockObjectProperty implements ITableActionOrGroup {
	@implementInterface("sap.fe.macros.table.ITableActionOrGroup")
	__implements__sap_fe_macros_table_ITableActionOrGroup = true;

	/**
	 * Unique identifier of the ActionGroup
	 * @public
	 */
	@property({ type: "string", required: true })
	key!: string;

	/**
	 * Determines the nested actions
	 * @public
	 */
	@aggregation({
		type: "sap.fe.macros.table.ITableAction",
		multiple: true,
		defaultClass: Action,
		isDefault: true
	})
	actions: (Action | ActionOverride)[] = [];

	/**
	 * The text that will be displayed for this action group
	 * @public
	 */
	@property({ type: "string", required: true, isBindingInfo: true })
	text!: string | PropertyBindingInfo;

	/**
	 * Reference to the key of another action or action group already displayed in the toolbar to properly place this one
	 * @public
	 */
	@property({ type: "string" })
	anchor?: string;

	/**
	 * Determines where this action group should be placed relative to the defined anchor
	 *
	 * Allowed values are `Before` and `After`
	 * @public
	 */
	@property({ type: "string" })
	placement?: "Before" | "After";

	/**
	 * Determines the default action to be executed on the action group.
	 * @public
	 */
	@property({ type: "string" })
	defaultAction?: string;

	/**
	 * Defines the priority of the action in the overflow toolbar.
	 * @public
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
	 * @public
	 */
	@property({ type: "int" })
	overflowGroup?: number;

	constructor(settings: PropertiesOf<ActionGroup>) {
		super(settings);
	}
}
