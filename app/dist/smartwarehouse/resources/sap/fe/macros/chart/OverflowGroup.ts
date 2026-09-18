import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";
/**
 * Definition of an overflow group to be used in the chart toolbar
 * @public
 */
@defineUI5Class("sap.fe.macros.chart.OverflowGroup")
export default class OverflowGroup extends BuildingBlockObjectProperty {
	/**
	 * Defines the group of the toolbar separator in the overflow toolbar.
	 * @public
	 */
	@property({ type: "int", required: true })
	overflowGroup!: number;

	/**
	 * Defines if a toolbar separator should be displayed.
	 * @public
	 */
	@property({ type: "boolean" })
	showSeparator?: boolean;
}
