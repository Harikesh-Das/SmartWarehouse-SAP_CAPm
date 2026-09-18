/**
 * Interface for filter fields that can be used in the FilterBar.
 * This ensures consistent structure for both FilterField and custom filter field implementations.
 * This interface is implemented by:<br/>
 * - {@link sap.fe.macros.filterBar.FilterField} <br/>
 * - {@link sap.fe.macros.filterBar.FilterFieldOverride} <br/>
 * @interface
 */
interface IFilterField {
	/**
	 * Marker property to identify implementations of this interface
	 */
	__implements__sap_fe_macros_filterBar_IFilterField: boolean;
}

export default IFilterField;
