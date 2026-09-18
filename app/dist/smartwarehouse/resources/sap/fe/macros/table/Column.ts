import { aggregation, defineUI5Class, implementInterface, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import type { HorizontalAlign } from "sap/fe/core/converters/ManifestSettings";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";
import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import type ColumnAINotice from "./ColumnAINotice";
import type ColumnExportSettings from "./ColumnExportSettings";
import type ITableColumn from "./ITableColumn";

/**
 * Definition of a custom column to be used inside the table.
 *
 * The template for the column must be provided as the default aggregation
 * @public
 */
@defineUI5Class("sap.fe.macros.table.Column")
export default class Column extends BuildingBlockObjectProperty implements ITableColumn {
	@implementInterface("sap.fe.macros.table.ITableColumn")
	__implements__sap_fe_macros_table_ITableColumn = true;

	/**
	 * Unique identifier of the column
	 * @public
	 */
	@property({ type: "string", required: true })
	key!: string;

	/**
	 * The text that will be displayed for this column header
	 * @public
	 */
	@property({ type: "string", required: true, isBindingInfo: true })
	header!: string | PropertyBindingInfo;

	/**
	 * Determines the column's width.
	 *
	 * Allowed values are 'auto', 'value', and 'inherit', according to {@link sap.ui.core.CSSSize}
	 * @public
	 */
	@property({ type: "string" })
	width?: string;

	/**
	 * Defines the column importance.
	 *
	 * You can define which columns should be automatically moved to the pop-in area based on their importance
	 * @public
	 */
	@property({ type: "string" })
	importance?: string;

	/**
	 * Aligns the header as well as the content horizontally
	 * @public
	 */
	@property({ type: "string" })
	horizontalAlign?: HorizontalAlign;

	/**
	 * Indicates if the column header should be a part of the width calculation.
	 * @public
	 */
	@property({ type: "boolean" })
	widthIncludingColumnHeader?: boolean;

	/**
	 * Reference to the key of another column already displayed in the table to properly place this one
	 * @public
	 */
	@property({ type: "string" })
	anchor?: string;

	/**
	 * Determines where this column should be placed relative to the defined anchor
	 *
	 * Allowed values are `Before` and `After`
	 * @public
	 */
	@property({ type: "string" })
	placement?: "Before" | "After";

	/**
	 * Determines the properties displayed in the column
	 *
	 * The properties allow to export, sort, group, copy, and paste in the column
	 * @public
	 */
	@property({ type: "string[]" })
	properties?: string[];

	/**
	 * Determines the text displayed for the column tooltip
	 * @public
	 */
	@property({ type: "string", isBindingInfo: true })
	tooltip?: string | PropertyBindingInfo;

	/**
	 * The column availability
	 *
	 * Allowed values are `Default`, `Adaptation`, `Hidden`
	 * @public
	 */
	@property({ type: "string" })
	availability?: string;

	/**
	 * Determines if the information in the column is required.
	 * @public
	 */
	@property({ type: "boolean" })
	required?: boolean;

	/**
	 * The content of the column
	 */
	@aggregation({ type: "sap.ui.core.Control", isDefault: true })
	template?: Control;

	/**
	 * Determines the export settings for the column.
	 * @public
	 */
	@aggregation({ type: "sap.fe.macros.table.ColumnExportSettings" })
	exportSettings?: ColumnExportSettings;

	/**
	 * Determines the AI notice for the column.
	 * The AI notice is used to display information related to AI features. This information is rendered as an icon in the column header.
	 * @public
	 */
	@aggregation({ type: "sap.fe.macros.table.ColumnAINotice", altTypes: ["string"] })
	aiNotice?: ColumnAINotice;

	/**
	 * Determines if the column should be excluded from the export.
	 * @public
	 */
	@property({ type: "boolean" })
	disableExport?: boolean;

	/**
	 * Sets the text displayed for the column tooltip
	 * By default, the tooltip is set as an aggregation by the Element, so this setter allows you to override it.
	 * @param tooltip The tooltip text
	 * @returns The Column instance itself for method chaining
	 */
	setTooltip(tooltip: string): this {
		this.setProperty("tooltip", tooltip);
		return this;
	}

	init(): undefined {
		super.init();
		// Don't propagate the table binding context to the column template, as the correct binding context is the row context which is set by the table itself.
		// mSkipPropagation isn't publicaly exposed but it's already used in sap.mdc.table.
		(this as unknown as { mSkipPropagation: Record<string, boolean> }).mSkipPropagation = { template: true };
		return;
	}

	constructor(id: string | PropertiesOf<Column>, settings?: PropertiesOf<Column>) {
		super(id as string, settings);
	}
}
