import { aggregation, defineUI5Class, type PropertiesOf } from "sap/fe/base/ClassSupport";
import type Control from "sap/ui/core/Control";
import BuildingBlockObjectProperty from "../controls/BuildingBlockObjectProperty";

/**
 * Definition of the  AINotice applied to a column within the table.
 * @public
 */
@defineUI5Class("sap.fe.macros.table.ColumnAINotice")
export default class ColumnAINotice extends BuildingBlockObjectProperty {
	/**
	 * Determines the pop-up content of the AINotice to be displayed
	 * @public
	 */
	@aggregation({ type: "sap.ui.core.Control", isDefault: true, multiple: false })
	content?: Control;

	constructor(settings: PropertiesOf<ColumnAINotice>) {
		super(settings);
	}
}
