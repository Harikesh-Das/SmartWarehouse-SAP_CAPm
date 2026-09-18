import type { VisibleColumn } from "sap/fe/macros/ai/EasyFillTableHelper";
import Column from "sap/m/Column";
import type ColumnListItem from "sap/m/ColumnListItem";
import Label from "sap/m/Label";
import Table from "sap/m/Table";

export function createPreviewColumns(visualColumns: VisibleColumn[], columnWidths?: Record<string, string>): Column[] {
	return visualColumns.map(
		(spec) =>
			new Column({
				header: new Label({ text: spec.label, wrapping: true }),
				...(columnWidths ? { width: columnWidths[spec.propNames[0]] ?? "10rem" } : {})
			})
	);
}

export function createPreviewTable(columns: Column[], items: ColumnListItem[], isGridLayout: boolean): Table {
	const config: Record<string, unknown> = {
		columns,
		items,
		autoPopinMode: !isGridLayout,
		fixedLayout: isGridLayout
	};
	if (!isGridLayout) {
		config.contextualWidth = "Auto";
	}
	const table = new Table(config);
	table.addStyleClass("sapFeEasyFillPreviewTable");
	return table;
}
