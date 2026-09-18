import { defineUI5Class, implementInterface, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import type { AvailabilityType } from "sap/fe/core/converters/ManifestSettings";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";
import DataType from "sap/ui/base/DataType";
import type IFilterField from "./IFilterField";

/**
 * Definition of an override for the filter field to be used inside the FilterBar building block.
 * @public
 */
@defineUI5Class("sap.fe.macros.filterBar.FilterFieldOverride")
export default class FilterFieldOverride extends BuildingBlockObjectProperty implements IFilterField {
	@implementInterface("sap.fe.macros.filterBar.IFilterField")
	__implements__sap_fe_macros_filterBar_IFilterField = true;

	/**
	 * Unique identifier of the filter field to be overridden.
	 * @public
	 */
	@property({ type: "string", required: true })
	key!: string;

	/**
	 * If set, the FilterField is marked as a mandatory field.
	 * @public
	 */
	@property({ type: "boolean" })
	required?: boolean;

	/**
	 * The filter field availability.
	 *
	 * Allowed values are `Default`, `Adaptation`, and `Hidden`
	 * @public
	 */
	@property({ type: "string" })
	availability?: AvailabilityType;

	/**
	 * Reference to the key of another filter already displayed in the table to properly place this one.
	 * @public
	 */
	@property({ type: "string" })
	anchor?: string;

	/**
	 * Defines where this filter is placed relative to the defined anchor.
	 *
	 * Allowed values are `Before` and `After`
	 * @public
	 */
	@property({ type: "string" })
	placement?: "Before" | "After";

	constructor(settings: PropertiesOf<FilterFieldOverride>) {
		super(settings);
	}
}
DataType.registerEnum("sap.fe.macros.filterBar.FilterFieldOverride", FilterFieldOverride);
