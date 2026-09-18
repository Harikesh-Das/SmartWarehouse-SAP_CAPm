import { defineUI5Class, type PropertiesOf } from "sap/fe/base/ClassSupport";
import TableAPI from "sap/fe/macros/Table";
import type Action from "sap/fe/macros/table/Action";
import type Column from "sap/fe/macros/table/Column";
import type { $ControlSettings } from "sap/ui/mdc/Control";
/**
 * Building block used to create a table based on the metadata provided by OData V4.
 * <br>
 * Usually, a LineItem, PresentationVariant or SelectionPresentationVariant annotation is expected, but the Table building block can also be used to display an EntitySet.
 * <br>
 * If a PresentationVariant is specified, then it must have UI.LineItem as the first property of the Visualizations.
 * <br>
 * If a SelectionPresentationVariant is specified, then it must contain a valid PresentationVariant that also has a UI.LineItem as the first property of the Visualizations.
 *
 * Usage example:
 * <pre>
 * sap.ui.require(["sap/fe/macros/table/Table"], function(Table) {
 * 	 ...
 * 	 new Table("myTable", {metaPath:"@com.sap.vocabularies.UI.v1.LineItem"})
 * })
 * </pre>
 *
 * This is currently an experimental API because the structure of the generated content will change to come closer to the Table that you get out of templates.
 * The public method and property will not change but the internal structure will so be careful on your usage.
 * @public
 * @deprecatedsince 1.145
 * @deprecated Use {@link sap.fe.macros.Table} instead
 * @mixes sap.fe.macros.Table
 */
@defineUI5Class("sap.fe.macros.table.Table", { returnTypes: ["sap.fe.macros.MacroAPI"] })
export default class Table extends TableAPI {
	constructor(mSettings?: PropertiesOf<TableAPI> & { id?: string }, ...others: $ControlSettings[]) {
		super(mSettings, ...others);
	}

	/**
	 * Sets the path to the metadata that should be used to generate the table.
	 * @param metaPath The path to the metadata
	 * @returns Reference to this to allow method chaining
	 * @deprecatedsince 1.145
	 * @deprecated Use {@link sap.fe.macros.Table.setMetaPath} instead
	 * @public
	 */
	setMetaPath(metaPath: string): this {
		return this.setProperty("metaPath", metaPath);
	}

	/**
	 * Gets the path to the metadata that should be used to generate the table.
	 * @returns The path to the metadata
	 * @deprecatedsince 1.145
	 * @deprecated Use {@link sap.fe.macros.Table.getMetaPath} instead
	 * @public
	 */
	getMetaPath(): string {
		return this.getProperty("metaPath");
	}

	/**
	 * Sets the fields that should be ignored when generating the table.
	 * @param ignoredFields The fields to ignore
	 * @returns Reference to this to allow method chaining
	 * @deprecatedsince 1.145
	 * @deprecated Use {@link sap.fe.macros.Table.setIgnoredFields} instead
	 * @public
	 */
	setIgnoredFields(ignoredFields: string): this {
		return this.setProperty("ignoredFields", ignoredFields);
	}

	/**
	 * Get the fields that should be ignored when generating the table.
	 * @returns The value of the ignoredFields property
	 * @deprecatedsince 1.145
	 * @deprecated Use {@link sap.fe.macros.Table.getIgnoredFields} instead
	 * @public
	 */
	getIgnoredFields(): string {
		return this.getProperty("ignoredFields");
	}

	/**
	 * Adds a column to the table.
	 * @param column The column to add
	 * @returns Reference to this to allow method chaining
	 * @deprecatedsince 1.145
	 * @deprecated Use {@link sap.fe.macros.Table.addColumn} instead
	 * @public
	 */
	addColumn(column: Column): this {
		return super.addColumn(column);
	}

	/**
	 * Removes a column from the table.
	 * @param column The column to remove, or its index or ID
	 * @returns The removed column or null
	 * @deprecatedsince 1.145
	 * @deprecated Use {@link sap.fe.macros.Table.removeColumn} instead
	 * @public
	 */
	removeColumn(column: number | string | Column): Column | null {
		return super.removeColumn(column);
	}

	/**
	 * Adds an action to the table.
	 * @param action The action to add
	 * @returns Reference to this to allow method chaining
	 * @deprecatedsince 1.145
	 * @deprecated Use {@link sap.fe.macros.Table.addAction} instead
	 * @public
	 */
	addAction(action: Action): this {
		return super.addAction(action);
	}

	/**
	 * Removes an action from the table.
	 * @param action The action to remove, or its index or ID
	 * @returns The removed action or null
	 * @deprecatedsince 1.145
	 * @deprecated Use {@link sap.fe.macros.Table.removeAction} instead
	 * @public
	 */
	removeAction(action: number | string | Action): Action | null {
		return super.removeAction(action);
	}
}
