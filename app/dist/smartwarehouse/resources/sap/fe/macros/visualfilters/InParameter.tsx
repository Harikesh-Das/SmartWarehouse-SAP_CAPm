import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";

/**
 * InParameter definition for VisualFilter.
 * Represents a mapping between a local data property and a value list property.
 */
@defineUI5Class("sap.fe.macros.visualfilters.InParameter")
export default class InParameter extends BuildingBlockObjectProperty {
	constructor(idOrProps?: string | PropertiesOf<InParameter>, props?: PropertiesOf<InParameter>) {
		super(idOrProps as string, props);
	}

	/**
	 * The local data property path.
	 */
	@property({ type: "string" })
	localDataProperty!: string;

	/**
	 * The value list property path.
	 */
	@property({ type: "string" })
	valueListProperty!: string;
}
