import { defineUI5Class, event, implementInterface, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BaseAction from "sap/fe/macros/controls/BaseAction";
import type UI5Event from "sap/ui/base/Event";
import type { EventHandler } from "../../../../../../../types/extension_types";
import type ITableAction from "./ITableAction";
import type ITableActionOrGroup from "./ITableActionOrGroup";
/**
 * Definition of a custom action to be used inside the table toolbar
 * @public
 */
@defineUI5Class("sap.fe.macros.table.Action")
export default class Action extends BaseAction<{ enabled: boolean; visible: boolean }> implements ITableActionOrGroup, ITableAction {
	@implementInterface("sap.fe.macros.table.ITableActionOrGroup")
	__implements__sap_fe_macros_table_ITableActionOrGroup = true;

	@implementInterface("sap.fe.macros.table.ITableAction")
	__implements__sap_fe_macros_table_ITableAction = true;

	/**
	 * Event handler to be called when the user chooses the action
	 * @public
	 */
	@event()
	press?: EventHandler<UI5Event<{}, Action>>;

	/**
	 * Defines if the action requires a selection.
	 * @public
	 */
	@property({ type: "boolean" })
	requiresSelection?: boolean;

	/**
	 * Enables or disables the action
	 * @public
	 */
	@property({ type: "boolean", bindToState: true })
	enabled?: boolean;

	/**
	 * Determines whether the action is visible.
	 * @public
	 */
	@property({ type: "boolean", bindToState: true })
	visible?: boolean;

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

	constructor(settings: PropertiesOf<Action>) {
		super(settings);
	}
}
