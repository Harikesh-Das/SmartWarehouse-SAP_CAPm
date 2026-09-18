import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import type { BaseAction as BaseActionType } from "sap/fe/core/converters/controls/Common/Action";
import type { OverflowToolbarPriority } from "sap/m/library";
import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import BuildingBlockObjectProperty from "./BuildingBlockObjectProperty";

/**
 * Base class for Action building blocks used across different UI areas, such as Table and Chart.
 * Contains common properties shared by all action types.
 * @public
 */
@defineUI5Class("sap.fe.macros.controls.BaseAction")
export default class BaseAction<State extends object = {}> extends BuildingBlockObjectProperty<State> implements BaseActionType {
	/**
	 * Unique identifier of the action
	 * @public
	 */
	@property({ type: "string" })
	key!: string;

	/**
	 * The text that is to be displayed for this action
	 * @public
	 */
	@property({ type: "any", required: true, isBindingInfo: true })
	text!: string | PropertyBindingInfo;

	/**
	 * Reference to the key of another action already displayed in the toolbar to properly place this one
	 * @public
	 */
	@property({ type: "string" })
	anchor?: string;

	/**
	 * Defines where this action is placed relative to the defined anchor
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
	@property({ type: "any", isBindingInfo: true })
	enabled?: boolean | PropertyBindingInfo;

	/**
	 * Determines whether the action is visible.
	 * @public
	 */
	@property({ type: "any", isBindingInfo: true })
	visible?: boolean | PropertyBindingInfo;

	/**
	 * Displays the AI Icon on the action button.
	 * @public
	 */
	@property({ type: "boolean", defaultValue: false })
	isAIOperation?: boolean;

	/**
	 * Defines the group of the action in the overflow toolbar.
	 * @public
	 */
	@property({ type: "int" })
	group?: number;

	/**
	 * Defines the overflow group of the action in the overflow toolbar.
	 * Takes precedence over the group property when defined.
	 * @public
	 */
	@property({ type: "int" })
	overflowGroup?: number;

	/**
	 * Defines if the action requires a selection.
	 * @public
	 */
	@property({ type: "boolean" })
	requiresSelection?: boolean;

	/**
	 * Defines the priority of the action in the overflow toolbar.
	 * @public
	 */
	@property({ type: "string" })
	priority?: OverflowToolbarPriority;
}
