import { defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import type { TextAlign } from "sap/ui/core/library";
import BuildingBlockObjectProperty from "../controls/BuildingBlockObjectProperty";

/**
 * Definition of the export settings applied to a column within the table.
 * @public
 */
@defineUI5Class("sap.fe.macros.table.ColumnExportSettings")
export default class ColumnExportSettings extends BuildingBlockObjectProperty {
	/**
	 * Determines the column header text.
	 * @public
	 */
	@property({ type: "string" })
	label?: string;

	/**
	 * Determines a formatting template that supports indexed placeholders within curly brackets.
	 * @public
	 */
	@property({ type: "string" })
	template?: string;

	/**
	 * Determines if the content needs to be wrapped.
	 * @public
	 */
	@property({ type: "boolean" })
	wrap?: boolean;

	/**
	 * Determines the data type of the field
	 * @public
	 */
	@property({ type: "string" })
	type?: string;

	/**
	 * Determines the properties of the column.
	 * @public
	 */
	@property({ type: "string[]" })
	property?: string[];

	/**
	 * Determines the properties of the column.
	 * Replace the property 'property' which generates issues on the setProperty in the internal workflow.
	 */
	@property({ type: "string[]" })
	properties?: string[];

	/**
	 * Determines the width of the column in characters
	 * @public
	 */
	@property({ type: "int" })
	width?: number;

	/**
	 * Determines the alignment of the column of the cell contents.
	 * Available options are:<br/>
	 * - Left<br/>
	 * - Right<br/>
	 * - Center<br/>
	 * - Begin<br/>
	 * - End<br/>
	 * <br/>
	 * @public
	 */
	@property({ type: "string" })
	textAlign?: TextAlign;

	/**
	 * Determines the text associated to a Boolean type with 'true' as value.
	 * @public
	 */
	@property({ type: "string" })
	trueValue?: string;

	/**
	 * Determines the text associated to a Boolean type with 'false' as value.
	 * @public
	 */
	@property({ type: "string" })
	falseValue?: string;

	/**
	 * Determines the mapping object holding the values associated with a specific key.
	 * Enumeration type must be used when valueMap is provided.
	 * @public
	 */
	@property({ type: "object" })
	valueMap?: object;

	/**
	 * Determines how to parse a textual date representation based on a given pattern. The pattern has to be provided as a string with the literals y, m, d. Other literals are ignored.
	 * @public
	 */
	@property({ type: "string" })
	inputFormat?: string;

	constructor(settings: PropertiesOf<ColumnExportSettings>) {
		settings.properties = settings.properties ?? settings.property;
		delete settings.property;
		super(settings);
	}
}
