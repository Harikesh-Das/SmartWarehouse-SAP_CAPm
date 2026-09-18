import { defineUI5Class, type EventsOf, type PropertiesOf } from "sap/fe/base/ClassSupport";

import FilterBarAPI from "sap/fe/macros/FilterBar";
import type { $ControlSettings } from "sap/ui/mdc/Control";

/**
 * Usage example:
 * <pre>
 * sap.ui.require(["sap/fe/macros/filterBar/FilterBar"], function(FilterBar) {
 * 	 ...
 * 	 new FilterBar("MyFilterBar", {metaPath:"@com.sap.vocabularies.UI.v1.SelectionFields"})
 * })
 * </pre>
 *
 * This is an experimental API because the structure of the generated content has changed to be closer to the FilterBar that you get from the templates.
 * The public method and property has not changed but the internal structure has changed so be careful on your usage.
 * @public
 * @deprecatedsince 1.147
 * @deprecated Use {@link sap.fe.macros.FilterBar} instead
 * @mixes sap.fe.macros.FilterBar
 */
@defineUI5Class("sap.fe.macros.filterBar.FilterBar", { returnTypes: ["sap.fe.macros.MacroAPI"] })
export default class FilterBar extends FilterBarAPI {
	constructor(mSettings?: PropertiesOf<FilterBarAPI> & EventsOf<FilterBarAPI> & { id?: string }, ...others: $ControlSettings[]) {
		super(mSettings, ...others);
	}
}
