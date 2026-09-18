import { aggregation, defineUI5Class, implementInterface, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";
import Action from "sap/fe/macros/table/Action";
import type { OverflowToolbarPriority } from "sap/m/library";
import type ActionOverride from "./ActionOverride";
import type ITableActionOrGroup from "./ITableActionOrGroup";

/**
 * Definition of an action group override to be used inside the Table building block.
 * @public
 */
@defineUI5Class("sap.fe.macros.table.ActionGroupOverride")
export default class ActionGroupOverride extends BuildingBlockObjectProperty implements ITableActionOrGroup {
	@implementInterface("sap.fe.macros.table.ITableActionOrGroup")
	__implements__sap_fe_macros_table_ITableActionOrGroup = true;

	/**
	 * Unique identifier of the ActionGroup to overridden.
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

	constructor(settings: PropertiesOf<ActionGroupOverride>) {
		super(settings);
	}
}
