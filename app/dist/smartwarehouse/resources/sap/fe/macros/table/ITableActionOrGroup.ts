/**
 * Interface for controls that can be used as actions or action groups inside the {@link sap.fe.macros.Table} building block.
 *
 * This interface is implemented by:<br/>
 * - {@link sap.fe.macros.table.Action} <br/>
 * - {@link sap.fe.macros.table.ActionOverride} <br/>
 * - {@link sap.fe.macros.table.ActionGroup} <br/>
 * - {@link sap.fe.macros.table.ActionGroupOverride} <br/>
 * @public
 * @since 1.145.0
 * @interface
 */
export default interface ITableActionOrGroup {
	__implements__sap_fe_macros_table_ITableActionOrGroup: boolean;
}
