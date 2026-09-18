import Log from "sap/base/Log";
import type ColumnListItem from "sap/m/ColumnListItem";
import type Table from "sap/m/Table";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type View from "sap/ui/core/mvc/View";
import type Control from "sap/ui/mdc/Control";
import FieldEditMode from "sap/ui/mdc/enums/FieldEditMode";
import type MDCTable from "sap/ui/mdc/Table";
import type V4Context from "sap/ui/model/odata/v4/Context";
import type GridTable from "sap/ui/table/Table";

// UI5 internal annotation marking grand-total and subtotal rows in aggregated OData V4 tables.
const NODE_IS_TOTAL_ANNOTATION = "@$ui5.node.isTotal";
// Substring that identifies MDC property-info keys derived from OData annotations rather than real OData properties.
const ANNOTATION_KEY_MARKER = "Property::";

export type TableColumnDescriptor = {
	description: string;
	dataType: string;
	isAuxiliary?: boolean;
	isComputed?: boolean;
	isImmutable?: boolean;
	/** Set on grouped-column leaves — the virtual MDC column key that groups them. */
	groupKey?: string;
	/** Set on grouped-column leaves — the visual header of the group column. */
	groupLabel?: string;
};

/**
 * Returns the real OData leaf property keys from a column's propertyInfos, excluding internal
 * annotation-based keys (e.g. "DataFieldForAnnotation::Property::X").
 * @param propertyInfos The raw propertyInfos array from the MDC property helper.
 * @returns Filtered array of real leaf keys.
 */
function getRealLeaves(propertyInfos: string[] | undefined): string[] {
	return (propertyInfos ?? []).filter((k) => !k.includes(ANNOTATION_KEY_MARKER));
}

/**
 * Returns all rendered controls of the given UI5 type from a view.
 * Only controls with a DOM reference (i.e. currently rendered) are returned.
 * @param view The view to search within.
 * @param type The fully-qualified UI5 control type name (e.g. "sap.ui.mdc.Table").
 * @returns Array of matching managed objects.
 */
export function getTables(view: View, type: string): ManagedObject[] {
	return view?.findAggregatedObjects?.(true, (control: ManagedObject) => control.isA(type) && !!(control as Control).getDomRef()) ?? [];
}

/**
 * Returns the inner sap.m.Table or sap.ui.table.Table aggregated inside an MDC table.
 * @param mdcTable The MDC table control.
 * @returns The inner table or null if not found.
 */
export function getInnerTable(mdcTable: MDCTable): Table | GridTable | null {
	const innerTables = mdcTable.findAggregatedObjects(
		true,
		(control: ManagedObject) => control.isA("sap.m.Table") || (control as ManagedObject).isA("sap.ui.table.Table")
	);
	return (innerTables[0] as Table | GridTable) ?? null;
}

export function isGridSourceTable(mdcTable: MDCTable): boolean {
	return (mdcTable.getType() as { isA?: (type: string) => boolean })?.isA?.("sap.ui.mdc.table.GridTableType") ?? false;
}

/**
 * Extracts visible column metadata from an MDC table.
 * - Regular columns are added as primary properties.
 * - Composite columns (amount+unit) have their sidecar added as auxiliary.
 * - Grouped columns (virtual grouping key with leaf propertyInfos but no own typeConfig) are
 *   expanded: the group key itself is skipped, each leaf is added as a primary property carrying
 *   groupKey and groupLabel so the preview table can re-render them as one visual column.
 * - Custom columns (no typeConfig and no propertyInfos) are skipped.
 * @param table The MDC table control.
 * @returns Map from property key to column descriptor.
 */
export function getTableColumns(table: MDCTable): Record<string, TableColumnDescriptor> {
	const itemProperties: Record<string, TableColumnDescriptor> = {};
	const tablePropertyHelper = table.getPropertyHelper();
	const visibleColumns = table.getColumns().filter((c) => c.getVisible());

	for (const col of visibleColumns) {
		const columnKey = col.getPropertyKey();
		const columnHeader = col.getHeader();
		const columnDescription = typeof columnHeader === "string" ? columnHeader : columnKey;

		const propertyInfo = tablePropertyHelper.getProperty(columnKey);
		const leaves = getRealLeaves(propertyInfo?.propertyInfos);
		// Annotation-based keys (e.g. DataFieldForAnnotation::FieldGroup::X) are never real OData properties.
		// Treat them the same as virtual grouped keys: expand their leaves if any, otherwise skip.
		const isAnnotationKey = columnKey.includes("::");
		const hasOwnType = !isAnnotationKey && !!(propertyInfo?.exportSettings?.type ?? propertyInfo?.typeConfig?.baseType);

		if (!hasOwnType && leaves.length === 0) {
			// Custom or annotation-only column — no OData property, skip entirely
			Log.info(`EasyFill: skipping column "${columnKey}" — no OData property metadata`);
			continue;
		}

		if (!hasOwnType && leaves.length > 0) {
			// Grouped column — virtual key groups multiple independent OData properties
			for (const leafKey of leaves) {
				if (leafKey in itemProperties) {
					continue;
				}
				const leafInfo = tablePropertyHelper.getProperty(leafKey);
				const leafDataType = leafInfo?.exportSettings?.type ?? leafInfo?.typeConfig?.baseType ?? "Edm.String";
				const leafLabel = typeof leafInfo?.label === "string" && leafInfo.label.length > 0 ? leafInfo.label : leafKey;
				itemProperties[leafKey] = {
					description: leafLabel,
					dataType: leafDataType,
					groupKey: columnKey,
					groupLabel: columnDescription
				};
			}
			continue;
		}

		// Regular or composite column
		const columnDataType = propertyInfo?.exportSettings?.type ?? "Edm.String";
		if (!(columnKey in itemProperties)) {
			itemProperties[columnKey] = { description: columnDescription, dataType: columnDataType };
		}

		// Include auxiliary properties (e.g. "Currency") linked to the column
		for (const subKey of leaves) {
			if (subKey in itemProperties) {
				continue;
			}
			const subInfo = tablePropertyHelper.getProperty(subKey);
			itemProperties[subKey] = {
				description: columnDescription,
				dataType: subInfo?.typeConfig?.baseType ?? "Edm.String",
				isAuxiliary: true
			};
		}
	}
	return itemProperties;
}

/**
 * Extracts current scalar property values from a set of V4 row contexts.
 * Each row is tagged with a zero-based _rowIndex for later identification.
 * @param rowContexts The V4 contexts representing the visible rows.
 * @param columns The property names to read from each context.
 * @returns Array of row value objects, each including _rowIndex.
 */
export function getTableRows(rowContexts: V4Context[], columns: string[]): Array<{ _rowIndex: number; [key: string]: unknown }> {
	const currentItems: Array<{ _rowIndex: number; [key: string]: unknown }> = [];

	rowContexts.forEach((row, index) => {
		const rowData: { _rowIndex: number; [key: string]: unknown } = { _rowIndex: index };
		for (const column of columns) {
			const value = row.getProperty(column);
			if (value !== undefined && typeof value !== "object") {
				rowData[column] = value;
			}
		}
		currentItems.push(rowData);
	});
	return currentItems;
}

/** One visual column in the EasyFill preview table. A grouped column merges multiple OData leaf properties into one cell. */
export type VisibleColumn = { label: string; propNames: string[]; groupKey?: string };

/**
 * Builds the ordered list of visual columns for the EasyFill preview table.
 * Leaves that share the same groupKey are merged into one column (rendered as a stacked VBox cell).
 * @param propNames Ordered non-auxiliary property names.
 * @param propertyFlags Per-property flags from TableRenderFlags, carrying groupKey and groupLabel.
 * @param itemDescriptions Optional label map (property name → description string) used as fallback for standalone columns.
 * @returns Ordered array of visual columns.
 */
export function buildVisibleColumns(
	propNames: string[],
	propertyFlags: Record<string, { groupKey?: string; groupLabel?: string } | undefined>,
	itemDescriptions: Record<string, string | undefined>
): VisibleColumn[] {
	const columns: VisibleColumn[] = [];
	const columnByGroupKey = new Map<string, VisibleColumn>();
	for (const propName of propNames) {
		const flags = propertyFlags[propName];
		const groupKey = flags?.groupKey;
		if (flags !== undefined && groupKey !== undefined) {
			const groupColumn = columnByGroupKey.get(groupKey);
			if (groupColumn) {
				groupColumn.propNames.push(propName);
			} else {
				const column: VisibleColumn = { label: flags.groupLabel ?? groupKey, propNames: [propName], groupKey };
				columns.push(column);
				columnByGroupKey.set(groupKey, column);
			}
		} else {
			columns.push({ label: itemDescriptions[propName] ?? propName, propNames: [propName] });
		}
	}
	return columns;
}

/**
 * Builds a map from each primary property to its auxiliary sibling property names.
 * Auxiliary properties share the same column index as their primary but are not themselves primary.
 * @param propColMap Map of property names to their column info (colIndex and isAuxiliary flag).
 * @returns Map of primary property name to its auxiliary property names.
 */
export function buildPrimaryToAuxMap(propColMap: Map<string, { colIndex: number; isAuxiliary: boolean }>): Map<string, string[]> {
	const colToPrimary = new Map<number, string>();
	propColMap.forEach((info, prop) => {
		if (!info.isAuxiliary) {
			colToPrimary.set(info.colIndex, prop);
		}
	});
	const primaryToAux = new Map<string, string[]>();
	propColMap.forEach((info, prop) => {
		if (info.isAuxiliary) {
			const primary = colToPrimary.get(info.colIndex);
			if (primary) {
				const arr = primaryToAux.get(primary) ?? [];
				arr.push(prop);
				primaryToAux.set(primary, arr);
			}
		}
	});
	return primaryToAux;
}

/**
 * Determines the edit mode of a specific cell in the inner table.
 * @param innerTable The inner sap.m.Table.
 * @param rowIndex Zero-based row index.
 * @param colIndex Zero-based column index.
 * @returns The edit mode of the cell, or "Display" if the cell does not have an edit mode.
 */
export function getCellEditMode(innerTable: Table | GridTable | null, rowIndex: number, colIndex: number | undefined): string | undefined {
	if (colIndex === undefined) {
		return undefined;
	}
	let cell: ManagedObject | undefined;
	if (innerTable && (innerTable as ManagedObject).isA("sap.ui.table.Table")) {
		cell = (innerTable as GridTable).getRows()[rowIndex]?.getCells()[colIndex];
	} else {
		cell = ((innerTable as Table | null)?.getItems()[rowIndex] as ColumnListItem | undefined)?.getCells()[colIndex];
	}
	return (cell as { getEditMode?: () => string } | undefined)?.getEditMode?.() ?? "Display";
}

/**
 * Builds a map from every property name (primary and auxiliary) to its real inner-table column index
 * and whether it is an auxiliary (unit/currency sidecar) property.
 * The column index is derived from the MDC table's actual column order, which includes all visible
 * columns (key, computed, etc.) — not just the EasyFill-visible subset. This ensures the index
 * matches the cell positions in the underlying sap.m.Table used by getCellEditMode.
 * Auxiliary properties share the column index of their parent primary property.
 * Properties not in the MDC table's visible column list are absent from the map.
 * @param table The MDC table control.
 * @param visiblePropNames Non-auxiliary, non-key property names (the EasyFill visible set).
 * @returns Map from property name to real column index and auxiliary flag.
 */
export function buildPropToColumnMap(table: MDCTable, visiblePropNames: string[]): Map<string, { colIndex: number; isAuxiliary: boolean }> {
	const result = new Map<string, { colIndex: number; isAuxiliary: boolean }>();
	const propertyHelper = table.getPropertyHelper();

	// Use the real MDC column order so colIndex matches inner sap.m.Table cell positions.
	// Grouped columns (virtual keys with leaves but no own typeConfig) are expanded so that
	// each leaf maps to the same column index as the group column in the inner table.
	const realColIndexMap = new Map<string, number>();
	table
		.getColumns()
		.filter((col) => col.getVisible())
		.forEach((col, idx) => {
			const key = col.getPropertyKey();
			const info = propertyHelper.getProperty(key);
			const leaves = getRealLeaves(info?.propertyInfos);
			const hasOwnType = !key.includes("::") && !!(info?.exportSettings?.type ?? info?.typeConfig?.baseType);
			if (!hasOwnType && leaves.length > 0) {
				// Grouped column: map each leaf to this column's real index
				for (const leafKey of leaves) {
					realColIndexMap.set(leafKey, idx);
				}
			} else {
				realColIndexMap.set(key, idx);
			}
		});

	for (const propName of visiblePropNames) {
		const realColIndex = realColIndexMap.get(propName);
		if (realColIndex === undefined) {
			continue;
		}
		result.set(propName, { colIndex: realColIndex, isAuxiliary: false });
		const propertyInfo = propertyHelper.getProperty(propName);
		for (const subKey of getRealLeaves(propertyInfo?.propertyInfos)) {
			if (!result.has(subKey)) {
				result.set(subKey, { colIndex: realColIndex, isAuxiliary: true });
			}
		}
	}

	return result;
}

/**
 * Determines whether a specific property within a cell is editable.
 * For primary properties any Editable* mode counts as editable.
 * For auxiliary (unit/currency sidecar) properties only the strict Editable mode applies,
 * because EditableReadOnly and EditableDisplay mean the secondary part is read-only.
 * @param innerTable The inner sap.m.Table.
 * @param rowIndex Zero-based row index.
 * @param colIndex Zero-based column index of the cell that contains this property.
 * @param isAuxiliary Whether the property is an auxiliary sidecar of a composite column.
 * @returns True if the property can accept a new value.
 */
export function isPropertyEditable(
	innerTable: Table | GridTable | null,
	rowIndex: number,
	colIndex: number,
	isAuxiliary: boolean
): boolean {
	const editMode = getCellEditMode(innerTable, rowIndex, colIndex);
	if (editMode === FieldEditMode.Editable) {
		return true;
	}
	if (isAuxiliary) {
		// EditableReadOnly / EditableDisplay: primary is editable but the sidecar is not
		return false;
	}
	return editMode === FieldEditMode.EditableReadOnly || editMode === FieldEditMode.EditableDisplay;
}

/**
 * Fetches visible columns and current row data from a rendered MDC table.
 * @param table The MDC table control.
 * @param navigationPropertyName The nav property name (used only for error logging).
 * @returns An object containing:
 */
export function fetchTableData(
	table: MDCTable,
	navigationPropertyName: string
): {
	itemProperties: Record<string, TableColumnDescriptor>;
	currentItems: Array<{ _rowIndex: number; [key: string]: unknown }>;
	currentContexts: V4Context[];
} {
	let currentContexts: V4Context[] = [];
	let currentItems: Array<{ _rowIndex: number; [key: string]: unknown }> = [];
	let itemProperties: Record<string, TableColumnDescriptor> = {};

	try {
		const rowBinding = table.getRowBinding();
		currentContexts = rowBinding.getCurrentContexts().filter((ctx) => {
			if (ctx.isTransient() ?? false) {
				return false;
			}
			return ctx.getProperty(NODE_IS_TOTAL_ANNOTATION) !== true;
		});

		itemProperties = getTableColumns(table);
		currentItems = getTableRows(currentContexts, Object.keys(itemProperties));
	} catch (error) {
		Log.error(`Failed to fetch table data for ${navigationPropertyName}:`, error as Error);
	}

	return { itemProperties, currentItems, currentContexts };
}
