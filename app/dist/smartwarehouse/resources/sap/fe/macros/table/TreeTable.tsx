import { defineUI5Class, type PropertiesOf } from "sap/fe/base/ClassSupport";
import type { $ControlSettings } from "sap/ui/mdc/Control";
import TreeTableAPI from "../TreeTable";
import type Action from "./Action";
import type Column from "./Column";

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
 * sap.ui.require(["sap/fe/macros/table/TreeTable"], function(TreeTable) {
 * 	 ...
 * 	 new TreeTable("myTable", {metaPath:"@com.sap.vocabularies.UI.v1.LineItem"})
 * })
 * </pre>
 *
 * This is currently an experimental API because the structure of the generated content will change to come closer to the Table that you get out of templates.
 * The public method and property will not change but the internal structure will so be careful on your usage.
 * @public
 * @deprecatedsince 1.145
 * @deprecated Use {@link sap.fe.macros.TreeTable} instead
 * @mixes sap.fe.macros.TreeTable
 */
@defineUI5Class("sap.fe.macros.table.TreeTable", { returnTypes: ["sap.fe.macros.MacroAPI"] })
export default class TreeTable extends TreeTableAPI {
	constructor(mSettings?: PropertiesOf<TreeTableAPI> & { id?: string }, ...others: $ControlSettings[]) {
		super(mSettings, ...others);
	}

	/**
	 * Sets the path to the metadata that should be used to generate the table.
	 * @param metaPath The path to the metadata
	 * @returns Reference to this to allow method chaining
	 * @deprecatedsince 1.145
	 * @deprecated Use {@link sap.fe.macros.TreeTable.setMetaPath} instead
	 * @public
	 */
	setMetaPath(metaPath: string): this {
		return this.setProperty("metaPath", metaPath);
	}

	/**
	 * Gets the path to the metadata that should be used to generate the table.
	 * @returns The path to the metadata
	 * @deprecatedsince 1.145
	 * @deprecated Use {@link sap.fe.macros.TreeTable.getMetaPath} instead
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
	 * @deprecated Use {@link sap.fe.macros.TreeTable.setIgnoredFields} instead
	 * @public
	 */
	setIgnoredFields(ignoredFields: string): this {
		return this.setProperty("ignoredFields", ignoredFields);
	}

	/**
	 * Get the fields that should be ignored when generating the table.
	 * @returns The value of the ignoredFields property
	 * @deprecatedsince 1.145
	 * @deprecated Use {@link sap.fe.macros.TreeTable.getIgnoredFields} instead
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
	 * @deprecated Use {@link sap.fe.macros.TreeTable.addColumn} instead
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
	 * @deprecated Use {@link sap.fe.macros.TreeTable.removeColumn} instead
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
	 * @deprecated Use {@link sap.fe.macros.TreeTable.addAction} instead
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
	 * @deprecated Use {@link sap.fe.macros.TreeTable.removeAction} instead
	 * @public
	 */
	removeAction(action: number | string | Action): Action | null {
		return super.removeAction(action);
	}
}
