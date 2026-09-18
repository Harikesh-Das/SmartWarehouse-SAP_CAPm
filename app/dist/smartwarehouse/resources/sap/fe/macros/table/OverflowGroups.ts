import { defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";

/**
 * Configuration of toolbar separators to be used inside the table toolbar
 * @public
 */
@defineUI5Class("sap.fe.macros.table.OverflowGroup")
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

	constructor(settings: PropertiesOf<OverflowGroup>) {
		super(settings);
	}
}
