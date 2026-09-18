import { aggregation, defineUI5Class, implementInterface, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import type { HorizontalAlign } from "sap/fe/core/converters/ManifestSettings";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";
import type ColumnAINotice from "./ColumnAINotice";
import type ColumnExportSettings from "./ColumnExportSettings";
import type ITableColumn from "./ITableColumn";

/**
 * Definition of an override for the column to be used inside the Table building block.
 * @public
 */
@defineUI5Class("sap.fe.macros.table.ColumnOverride")
export default class ColumnOverride extends BuildingBlockObjectProperty implements ITableColumn {
	@implementInterface("sap.fe.macros.table.ITableColumn")
	__implements__sap_fe_macros_table_ITableColumn = true;

	/**
	 * Unique identifier of the column to overridden.
	 * @public
	 */
	@property({ type: "string", required: true })
	key!: string;

	/**
	 * Determines the column's width.
	 *
	 * Allowed values are 'auto', 'value', and 'inherit', according to {@link sap.ui.core.CSSSize}
	 * @public
	 */
	@property({ type: "string" })
	width?: string;

	/**
	 * Defines the importance of the column.
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
	 * The column availability
	 *
	 * Allowed values are `Default`, `Adaptation`, `Hidden``
	 * @public
	 */
	@property({ type: "string" })
	availability?: string;

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
	 * Determines if the column is excluded from the export.
	 * @public
	 */
	@property({ type: "boolean" })
	disableExport?: boolean;

	/**
	 * Defines if cells with duplicate values in this column are merged in responsive tables (display mode only).
	 * This overrides the HTML5.RowSpanForDuplicateValues annotation if set.
	 * Only applicable to annotation-based column overrides. Not supported for custom columns (columns with a template).
	 * @public
	 */
	@property({ type: "boolean" })
	mergeCells?: boolean;

	/**
	 * List of property paths used to determine whether adjacent cells are merged.
	 * The values of the specified properties are concatenated to form a comparison key.
	 * If not set, the displayed text value is used for comparison.
	 * Only takes effect when mergeCells is set to true or for annotation-based column overrides.
	 * Not supported for custom columns (columns with a template).
	 * @public
	 */
	@property({ type: "string[]" })
	mergeComparisonProperties?: string[];

	constructor(settings: PropertiesOf<ColumnOverride>) {
		super(settings);
	}
}
