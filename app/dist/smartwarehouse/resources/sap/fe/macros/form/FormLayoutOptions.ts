import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "../controls/BuildingBlockObjectProperty";

/**
 * Configuration options for the Form layout
 *
 * @public
 */
@defineUI5Class("sap.fe.macros.form.FormLayoutOptions")
export default class FormLayoutOptions extends BuildingBlockObjectProperty {
	constructor(props?: string | PropertiesOf<FormLayoutOptions>, others?: PropertiesOf<FormLayoutOptions>) {
		super(props as string, others);
	}

	/**
	 * The layout type to be used for the form
	 * @public
	 */
	@property({ type: "string" })
	type?: "ColumnLayout" | "ResponsiveGridLayout";

	/**
	 * Number of columns for M size
	 *
	 * Applicable for ColumnLayout type
	 * @public
	 */
	@property({ type: "int" })
	columnsM?: number;

	/**
	 * Number of columns for L size
	 *
	 * Applicable for ColumnLayout type
	 * @public
	 */
	@property({ type: "int" })
	columnsL?: number;

	/**
	 * Number of columns for XL size
	 *
	 * Applicable for ColumnLayout type
	 * @public
	 */
	@property({ type: "int" })
	columnsXL?: number;

	/**
	 * Number of grid cells that are reserved for the labels in large screen size
	 *
	 * Applicable for ColumnLayout type
	 * @public
	 */
	@property({ type: "int" })
	labelCellsLarge?: number;

	/**
	 * Number of grid cells that are empty at the end of a row in large screen size
	 *
	 * Applicable for ColumnLayout type
	 * @public
	 */
	@property({ type: "int" })
	emptyCellsLarge?: number;

	/**
	 * If set, the usage of `labelSpanL` and `labelSpanXL` is dependent on the size of the used column.
	 * If the space is less than 600px (e.g., 2 columns are used), `labelSpanM` is used instead.
	 *
	 * Applicable for ResponsiveGridLayout type
	 * @public
	 */
	@property({ type: "boolean" })
	adjustLabelSpan?: boolean;

	/**
	 * The breakpoint (in pixels) between M size and L size for the ResponsiveGridLayout
	 *
	 * Applicable for ResponsiveGridLayout type
	 * @public
	 */
	@property({ type: "int" })
	breakpointM?: number;

	/**
	 * The breakpoint (in pixels) between L size and XL size for the ResponsiveGridLayout
	 *
	 * Applicable for ResponsiveGridLayout type
	 * @public
	 */
	@property({ type: "int" })
	breakpointL?: number;

	/**
	 * The breakpoint (in pixels) between XL size and XXL size for the ResponsiveGridLayout
	 *
	 * Applicable for ResponsiveGridLayout type
	 * @public
	 */
	@property({ type: "int" })
	breakpointXL?: number;

	/**
	 * Number of grid cells that are used for the labels in S size
	 *
	 * Applicable for ResponsiveGridLayout type
	 * @public
	 */
	@property({ type: "int" })
	labelSpanS?: number;

	/**
	 * Number of grid cells that are used for the labels in M size
	 *
	 * Applicable for ResponsiveGridLayout type
	 * @public
	 */
	@property({ type: "int" })
	labelSpanM?: number;

	/**
	 * Number of grid cells that are used for the labels in L size
	 *
	 * Applicable for ResponsiveGridLayout type
	 * @public
	 */
	@property({ type: "int" })
	labelSpanL?: number;

	/**
	 * Number of grid cells that are used for the labels in XL size
	 *
	 * Applicable for ResponsiveGridLayout type
	 * @public
	 */
	@property({ type: "int" })
	labelSpanXL?: number;

	/**
	 * Number of empty grid cells that are added on the end of each line in S size
	 *
	 * Applicable for ResponsiveGridLayout type
	 * @public
	 */
	@property({ type: "int" })
	emptySpanS?: number;

	/**
	 * Number of empty grid cells that are added on the end of each line in M size
	 *
	 * Applicable for ResponsiveGridLayout type
	 * @public
	 */
	@property({ type: "int" })
	emptySpanM?: number;

	/**
	 * Number of empty grid cells that are added on the end of each line in L size
	 *
	 * Applicable for ResponsiveGridLayout type
	 * @public
	 */
	@property({ type: "int" })
	emptySpanL?: number;

	/**
	 * Number of empty grid cells that are added on the end of each line in XL size
	 *
	 * Applicable for ResponsiveGridLayout type
	 * @public
	 */
	@property({ type: "int" })
	emptySpanXL?: number;

	/**
	 * If set, a single container has the full size of the parent container.
	 * Otherwise, the container size is determined by the number of columns and the spacing between the columns.
	 *
	 * Applicable for ResponsiveGridLayout type
	 * @public
	 */
	@property({ type: "boolean" })
	singleContainerFullSize?: boolean;

	/**
	 * Defines the background color of the form
	 * @public
	 */
	@property({ type: "string" })
	backgroundDesign?: string;

	// Override getProperty to return undefined for NaN values, as NaN is not a valid value for the properties and can cause issues in the UI5 controls
	getProperty(name: string): unknown {
		const value = super.getProperty(name);
		return typeof value === "number" && isNaN(value) ? undefined : value;
	}
}
