import { aggregation, defineUI5Class, implementInterface, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import type { AvailabilityType } from "sap/fe/core/converters/ManifestSettings";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";
import DataType from "sap/ui/base/DataType";
import type Control from "sap/ui/core/Control";
import type IFilterField from "./IFilterField";

/**
 * Definition of a custom filter to be used inside the FilterBar.
 *
 * The template for the FilterField has to be provided as the default aggregation
 *
 *
 * {@link demo:sap/fe/core/fpmExplorer/index.html#/buildingBlocks/filterBar/filterBarCustoms Overview of Building Blocks}
 * @public
 */
@defineUI5Class("sap.fe.macros.filterBar.FilterField")
export default class FilterField extends BuildingBlockObjectProperty implements IFilterField {
	@implementInterface("sap.fe.macros.filterBar.IFilterField")
	__implements__sap_fe_macros_filterBar_IFilterField = true;

	/**
	 * The property name of the FilterField
	 * @public
	 */
	@property({ type: "string" })
	key!: string;

	/**
	 * The text that will be displayed for this FilterField
	 * @public
	 */
	@property({ type: "string" })
	label!: string;

	/**
	 * Reference to the key of another filter already displayed in the table to properly place this one
	 * @public
	 */
	@property({ type: "string" })
	anchor?: string;

	/**
	 * Defines where this filter should be placed relative to the defined anchor
	 *
	 * Allowed values are `Before` and `After`
	 * @public
	 */
	@property({ type: "string" })
	placement?: "Before" | "After";

	/**
	 * Defines which property are influenced by the FilterField.
	 *
	 * This must be a valid property of the entity as this can be used for SAP Companion integration
	 * @public
	 */
	@property({ type: "string" })
	property?: string;

	/**
	 * Internal storage for the 'property' value to avoid conflicts with SAPUI5's getProperty and setProperty APIs
	 * @private
	 */
	@property({ type: "string" })
	internalProperty?: string;

	/**
	 * The filter field availability.
	 *
	 * Allowed values are `Default`, `Adaptation`, and `Hidden`
	 * @public
	 */
	@property({ type: "string" })
	availability?: AvailabilityType;

	/**
	 * This property is not required at filter field level. To achieve the desired behavior, specify the showMessages property in the FilterBar building block.
	 * @public
	 * @deprecatedsince 1.135
	 * @deprecated
	 */
	@property({ type: "boolean" })
	showMessages?: boolean;

	/**
	 * If set, the FilterField will be marked as a mandatory field.
	 * @public
	 */
	@property({ type: "boolean" })
	required?: boolean;

	@property({ type: "string" })
	slotName?: string;

	@aggregation({ type: "sap.ui.core.Control", multiple: false, isDefault: true })
	template?: Control;

	constructor(id: string | PropertiesOf<FilterField>, settings?: PropertiesOf<FilterField>) {
		// Handle 'property' being passed in constructor args to avoid conflict with UI5's getProperty/setProperty
		const resolvedSettings = typeof id === "object" ? id : settings;
		if (resolvedSettings && "property" in resolvedSettings) {
			(resolvedSettings as Record<string, unknown>).internalProperty = resolvedSettings.property;
			delete resolvedSettings.property;
		}
		super(id as string, settings);
	}

	/**
	 * Override getProperty to return internalProperty when 'property' is requested.
	 * This maintains backward compatibility with code that expects 'property' to be accessible.
	 * @param sPropertyName The name of the property to get
	 * @returns The property value or internalProperty if 'property' is requested
	 */
	getProperty(sPropertyName: string): unknown {
		if (sPropertyName === "property") {
			return super.getProperty("internalProperty");
		}
		return super.getProperty(sPropertyName);
	}

	/**
	 * Override setProperty to set internalProperty when 'property' is set.
	 * This maintains backward compatibility with code that expects 'property' to be settable.
	 * @param sPropertyName The name of the property to set
	 * @param vValue The value to set
	 * @param bSuppressInvalidate Whether to suppress invalidation
	 * @returns This instance for chaining
	 */
	setProperty(sPropertyName: string, vValue?: unknown, bSuppressInvalidate?: boolean): this {
		if (sPropertyName === "property") {
			return super.setProperty("internalProperty", vValue, bSuppressInvalidate);
		}
		return super.setProperty(sPropertyName, vValue, bSuppressInvalidate);
	}
}
DataType.registerEnum("sap.fe.macros.filterBar.FilterField", FilterField);
