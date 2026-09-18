import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import BaseAction from "sap/fe/macros/controls/BaseAction";

/**
 * Definition of a custom action to be used in the chart toolbar
 * @public
 */
@defineUI5Class("sap.fe.macros.chart.Action")
export default class Action extends BaseAction {
	/**
	 * Defines if the action requires a selection.
	 * @public
	 */
	@property({ type: "boolean" })
	requiresSelection?: boolean;

	/**
	 * Event handler to be called when the user chooses the action
	 * @public
	 */
	@property({ type: "string" })
	press!: string;
}
