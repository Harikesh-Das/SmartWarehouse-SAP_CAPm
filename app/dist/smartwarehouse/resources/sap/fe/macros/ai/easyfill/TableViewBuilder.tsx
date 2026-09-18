import Log from "sap/base/Log";
import type { EnhanceWithUI5 } from "sap/fe/base/ClassSupport";
import Field from "sap/fe/macros/Field";
import {
	buildPrimaryToAuxMap,
	buildPropToColumnMap,
	buildVisibleColumns,
	getCellEditMode,
	getInnerTable,
	isGridSourceTable,
	isPropertyEditable,
	type TableColumnDescriptor
} from "sap/fe/macros/ai/EasyFillTableHelper";
import * as EasyFillFieldHelper from "sap/fe/macros/ai/easyfill/FieldHelper";
import * as EasyFillTablePreviewRenderer from "sap/fe/macros/ai/easyfill/TablePreviewRenderer";
import ValueListHelper from "sap/fe/macros/internal/valuehelp/ValueListHelper";
import ColumnListItem from "sap/m/ColumnListItem";
import type InputBase from "sap/m/InputBase";
import type Table from "sap/m/Table";
import VBox from "sap/m/VBox";
import type UI5Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import MessageType from "sap/ui/core/message/MessageType";
import type MDCTable from "sap/ui/mdc/Table";
import FieldEditMode from "sap/ui/mdc/enums/FieldEditMode";
import type V4Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type { FieldMetadata } from "ux/eng/fioriai/reuse/easyfill/EasyFill";

const INNER_CONTROL_RENDER_DELAY_MS = 200;
const UNIT_INPUT_ID_SUFFIX = "-inner-unit";

/** Internal rendering flags for a single table property. */
type TablePropertyFlags = Pick<TableColumnDescriptor, "groupKey" | "groupLabel"> & {
	isAuxiliary: boolean;
	isComputed: boolean;
	isImmutable: boolean;
};

/** Rendering flags for a table. */
export type TableRenderFlags = {
	allowsCreation: boolean;
	properties: Record<string, TablePropertyFlags>;
};

/** All dependencies the table view builder needs from EasyFillDialog. */
export type TablePreviewContext = {
	tableReferences: Map<string, MDCTable>;
	tableData: Map<string, { flags: TableRenderFlags }>;
	pendingUpdatedRowContexts: Map<string, Map<number, V4Context>>;
	pendingNewRowContexts: Map<string, V4Context[]>;
	runAsOwner: <T>(fn: () => T) => T | undefined;
	ownerContextPath: string;
	model: ODataModel;
	metaModel: ODataMetaModel | undefined;
	onFieldChange: (ev: UI5Event) => void;
	onValidateFieldGroups: (ev?: UI5Event) => void;
	getValueList: (metaPath: string) => Promise<unknown>;
	applyCompositeFieldCheck: (field: EnhanceWithUI5<Field>) => Promise<void>;
};

/**
 * Creates a transient ODataListBinding used for staging row contexts.
 * @param path The binding path.
 * @param model The OData model.
 * @param groupId The update group ID.
 * @returns The transient list binding.
 */
export function createListBinding(path: string, model: ODataModel, groupId = "submitLater"): ODataListBinding {
	const transientListBinding = model.bindList(path, undefined, [], [], { $$updateGroupId: groupId });
	transientListBinding.refreshInternal = (): void => {
		/* */
	};
	return transientListBinding;
}

/**
 * Returns column widths from an MDC grid table for a navigation property.
 * @param ctx The table preview context.
 * @param navigationPropertyName The navigation property name.
 * @returns A map of property key to width string, or undefined if not a grid table.
 */
export function getColumnWidthsForGrid(ctx: TablePreviewContext, navigationPropertyName: string): Record<string, string> | undefined {
	const mdcTable = ctx.tableReferences.get(navigationPropertyName);
	if (!mdcTable || !isGridSourceTable(mdcTable)) {
		return undefined;
	}
	const widths: Record<string, string> = {};
	for (const col of mdcTable.getColumns()) {
		const w = (col as unknown as { getWidth(): string }).getWidth();
		widths[col.getPropertyKey()] = w && w !== "auto" ? w : "10rem";
	}
	return widths;
}

/**
 * Renders the previous (read-only) table view showing original row values.
 * @param ctx The table preview context.
 * @param navigationPropertyName The navigation property name.
 * @param collectionMetadata The collection metadata.
 * @param existingRowContexts The V4 contexts for the existing rows.
 * @param isGridLayout Whether the source table uses grid layout.
 * @returns Preview table.
 */
export function renderPreviousTableView(
	ctx: TablePreviewContext,
	navigationPropertyName: string,
	collectionMetadata: NonNullable<FieldMetadata[string]>,
	existingRowContexts: V4Context[],
	isGridLayout: boolean
): Table {
	const itemProperties = collectionMetadata.itemProperties ?? {};
	const tableFlags = ctx.tableData.get(navigationPropertyName)?.flags;
	const propNames = Object.keys(itemProperties).filter((p) => tableFlags?.properties[p]?.isAuxiliary !== true);
	const visualColumns = buildVisibleColumns(
		propNames,
		tableFlags?.properties ?? {},
		Object.fromEntries(Object.entries(itemProperties).map(([k, v]) => [k, v?.description]))
	);
	const columns = EasyFillTablePreviewRenderer.createPreviewColumns(visualColumns, getColumnWidthsForGrid(ctx, navigationPropertyName));

	const rows: ColumnListItem[] = existingRowContexts.map((rowContext) => {
		const cells = visualColumns.map((spec) => {
			const leafFields = spec.propNames.map((propName) => {
				const f = ctx.runAsOwner(() => {
					return (
						<Field
							metaPath={propName}
							contextPath={`${ctx.ownerContextPath}${navigationPropertyName}`}
							readOnly={true}
							required={false}
						/>
					) as Field;
				}) as EnhanceWithUI5<Field>;
				f.setBindingContext(rowContext);
				return f;
			});
			if (leafFields.length === 1) return leafFields[0];
			return new VBox({ items: leafFields as Control[] });
		});
		return new ColumnListItem({ cells: cells as unknown as Control[] });
	});

	return EasyFillTablePreviewRenderer.createPreviewTable(columns, rows, isGridLayout);
}

/**
 * Renders the new table view with AI changes highlighted; new rows are editable.
 * @param ctx The table preview context.
 * @param navigationPropertyName The navigation property name.
 * @param aiChanges Array of row changes from the AI response.
 * @param collectionMetadata The collection metadata.
 * @param existingRowContexts The V4 contexts for the existing rows.
 * @param isGridLayout Whether the source table uses grid layout.
 * @param parentDataPath Data path of the parent entity (e.g. "/Travel(1)").
 * @returns Preview table, and flags indicating editable/uneditable changes.
 */
export function renderNewTableView(
	ctx: TablePreviewContext,
	navigationPropertyName: string,
	aiChanges: Array<{ _rowIndex?: number; [key: string]: unknown }>,
	collectionMetadata: NonNullable<FieldMetadata[string]>,
	existingRowContexts: V4Context[],
	isGridLayout: boolean,
	parentDataPath: string
): { view: Table; hasUneditableChanges: boolean; hasEditableChanges: boolean } {
	const itemProperties = collectionMetadata.itemProperties ?? {};
	const tableFlags = ctx.tableData.get(navigationPropertyName)?.flags;
	const allPropNames = Object.keys(itemProperties);
	const displayPropNames = allPropNames.filter((p) => tableFlags?.properties[p]?.isAuxiliary !== true);
	const editablePropNames = displayPropNames.filter((p) => tableFlags?.properties[p]?.isComputed !== true);

	const updatesForExistingRows = aiChanges.filter((r) => r._rowIndex !== undefined);
	let newRows = aiChanges.filter((r) => r._rowIndex === undefined);
	if (newRows.length > 0) {
		newRows = [newRows[0]];
	}

	const columns = EasyFillTablePreviewRenderer.createPreviewColumns(
		buildVisibleColumns(
			displayPropNames,
			tableFlags?.properties ?? {},
			Object.fromEntries(Object.entries(itemProperties).map(([k, v]) => [k, v?.description]))
		),
		getColumnWidthsForGrid(ctx, navigationPropertyName)
	);

	const bindingPath = `${parentDataPath}/${navigationPropertyName}`;
	const stagingBinding = createListBinding(bindingPath, ctx.model, "easyFillStaging");
	const newRowBinding = createListBinding(bindingPath, ctx.model, "submitLater");

	const {
		items: existingRowItems,
		fieldMap: existingFieldMap,
		hasUneditableChanges,
		hasEditableChanges: existingEditableChanges
	} = createExistingRowItems(
		ctx,
		navigationPropertyName,
		displayPropNames,
		allPropNames,
		existingRowContexts,
		updatesForExistingRows,
		stagingBinding
	);

	let newRowItems: ColumnListItem[] = [];
	let newFieldMap = new Map<string, EnhanceWithUI5<Field>>();
	if (tableFlags?.allowsCreation === true) {
		({ items: newRowItems, fieldMap: newFieldMap } = createNewRowItems(
			ctx,
			navigationPropertyName,
			displayPropNames,
			editablePropNames,
			allPropNames,
			newRows,
			newRowBinding
		));
	}

	const tableOrContainer = EasyFillTablePreviewRenderer.createPreviewTable(columns, [...existingRowItems, ...newRowItems], isGridLayout);

	const combinedFieldMap = new Map<string, EnhanceWithUI5<Field>>();
	existingFieldMap.forEach((field, key) => combinedFieldMap.set(key, field));
	const existingCount = existingRowContexts.length;
	newFieldMap.forEach((field, key) => {
		const [rowIdxStr, ...rest] = key.split("_");
		combinedFieldMap.set(`${existingCount + Number(rowIdxStr)}_${rest.join("_")}`, field);
	});

	validateTableCellValues(ctx, navigationPropertyName, aiChanges, parentDataPath, combinedFieldMap, existingCount).catch((err: unknown) =>
		Log.error("Table cell value help validation failed:", err as Error)
	);

	return { view: tableOrContainer, hasUneditableChanges, hasEditableChanges: existingEditableChanges || newRows.length > 0 };
}

/**
 * Creates editable row items for existing rows, backed by transient contexts seeded from real row data.
 * @param ctx The table preview context.
 * @param navigationPropertyName The navigation property name.
 * @param visiblePropNames Non-auxiliary property names shown as columns.
 * @param allPropNames All property names including auxiliary ones.
 * @param existingRowContexts The V4 contexts for the existing rows.
 * @param updatedRows AI-proposed row updates (have _rowIndex).
 * @param navListBinding Transient list binding for staging contexts.
 * @returns Row items, field map, and change flags.
 */
export function createExistingRowItems(
	ctx: TablePreviewContext,
	navigationPropertyName: string,
	visiblePropNames: string[],
	allPropNames: string[],
	existingRowContexts: V4Context[],
	updatedRows: Array<{ _rowIndex?: number; [key: string]: unknown }>,
	navListBinding: ODataListBinding
): {
	items: ColumnListItem[];
	fieldMap: Map<string, EnhanceWithUI5<Field>>;
	hasUneditableChanges: boolean;
	hasEditableChanges: boolean;
} {
	const allRowContextMap = new Map<number, V4Context>();
	const fieldMap = new Map<string, EnhanceWithUI5<Field>>();
	let hasUneditableChanges = false;
	let hasEditableChanges = false;
	const mdcTable = ctx.tableReferences.get(navigationPropertyName);
	const innerTable = mdcTable ? getInnerTable(mdcTable) : null;
	const propColMap = mdcTable
		? buildPropToColumnMap(mdcTable, visiblePropNames)
		: new Map<string, { colIndex: number; isAuxiliary: boolean }>();
	const primaryToAux = buildPrimaryToAuxMap(propColMap);
	const tableFlags = ctx.tableData.get(navigationPropertyName)?.flags;
	const rowSpecs = buildVisibleColumns(visiblePropNames, tableFlags?.properties ?? {}, {});

	const items: ColumnListItem[] = existingRowContexts.map((rowContext, rowIdx) => {
		const updatedRow = updatedRows.find((c) => c._rowIndex === rowIdx);
		const transientContext = navListBinding.create({}, true);
		const uneditableAiProps = new Set<string>();

		for (const key of allPropNames) {
			const aiValue = updatedRow?.[key];
			const propInfo = propColMap.get(key);
			const isGrouped = tableFlags?.properties[key]?.groupKey !== undefined;
			const canApplyAiValue =
				aiValue !== undefined &&
				(isGrouped
					? tableFlags?.properties[key]?.isComputed !== true && tableFlags?.properties[key]?.isImmutable !== true
					: propInfo !== undefined && isPropertyEditable(innerTable, rowIdx, propInfo.colIndex, propInfo.isAuxiliary));
			if (!canApplyAiValue && aiValue !== undefined) {
				hasUneditableChanges = true;
				uneditableAiProps.add(key);
			}
			if (canApplyAiValue) {
				hasEditableChanges = true;
			}
			const value = canApplyAiValue ? aiValue : rowContext.getProperty(key);
			transientContext.setProperty(key, value);
		}

		allRowContextMap.set(rowIdx, transientContext);

		const cells = rowSpecs.map((spec) => {
			const leafFields = spec.propNames.map((propName) => {
				const propInfo = propColMap.get(propName);
				const isUneditableAiProp = uneditableAiProps.has(propName);
				let editMode: string;
				if (isUneditableAiProp) {
					editMode = "Editable";
				} else if (spec.groupKey !== undefined) {
					editMode =
						tableFlags?.properties[propName]?.isComputed === true || tableFlags?.properties[propName]?.isImmutable === true
							? FieldEditMode.Display
							: FieldEditMode.Editable;
				} else if (propInfo !== undefined) {
					editMode = getCellEditMode(innerTable, rowIdx, propInfo.colIndex) ?? FieldEditMode.Display;
				} else {
					editMode = FieldEditMode.Display;
				}

				const editableField = ctx.runAsOwner(() => {
					return (
						<Field
							_requiresValidation={true}
							editMode={editMode}
							validateFieldGroup={ctx.onValidateFieldGroups}
							fieldGroupIds={"EasyFillField"}
							metaPath={propName}
							contextPath={`${ctx.ownerContextPath}${navigationPropertyName}`}
							change={ctx.onFieldChange}
						/>
					) as Field;
				}) as EnhanceWithUI5<Field>;
				editableField.setBindingContext(transientContext);

				const auxPropNames = primaryToAux.get(propName) ?? [];
				if (
					updatedRow !== undefined &&
					(updatedRow[propName] !== undefined || auxPropNames.some((aux) => updatedRow[aux] !== undefined))
				) {
					fieldMap.set(`${rowIdx}_${propName}`, editableField);
					for (const auxPropName of auxPropNames) {
						fieldMap.set(`${rowIdx}_${auxPropName}`, editableField);
					}
				}

				if (isUneditableAiProp) {
					editableField.addStyleClass("sapFeEasyFillWarningCell");
					setTimeout(() => {
						const content = editableField.content;
						const inputBase = (
							content?.isA("sap.m.InputBase") === true
								? content
								: content?.findAggregatedObjects(true, (c) => c.isA("sap.m.InputBase"))[0]
						) as InputBase | undefined;
						inputBase?.addStyleClass("sapFeEasyFillWarningCell");
						inputBase?.setEditable(false);
					}, INNER_CONTROL_RENDER_DELAY_MS);
				}
				return editableField;
			});
			if (leafFields.length === 1) return leafFields[0];
			return new VBox({ items: leafFields as Control[] });
		});

		return new ColumnListItem({ cells: cells as Control[], highlight: MessageType.None });
	});

	ctx.pendingUpdatedRowContexts.set(navigationPropertyName, allRowContextMap);
	return { items, fieldMap, hasUneditableChanges, hasEditableChanges };
}

/**
 * Creates row items for rows the AI proposes to add as new entries.
 * @param ctx The table preview context.
 * @param navigationPropertyName The navigation property name.
 * @param displayPropNames All non-auxiliary property names shown as columns.
 * @param editablePropNames Subset the AI can fill (excludes computed).
 * @param allPropNames All property names including auxiliary ones.
 * @param newRows AI-proposed new rows (no _rowIndex).
 * @param navListBinding Transient list binding for creating contexts.
 * @returns Row items and field map.
 */
export function createNewRowItems(
	ctx: TablePreviewContext,
	navigationPropertyName: string,
	displayPropNames: string[],
	editablePropNames: string[],
	allPropNames: string[],
	newRows: Array<{ [key: string]: unknown }>,
	navListBinding: ODataListBinding
): { items: ColumnListItem[]; fieldMap: Map<string, EnhanceWithUI5<Field>> } {
	const newContexts: V4Context[] = [];
	const fieldMap = new Map<string, EnhanceWithUI5<Field>>();
	const editableSet = new Set(editablePropNames);
	const tableFlags = ctx.tableData.get(navigationPropertyName)?.flags;
	const mdcTable = ctx.tableReferences.get(navigationPropertyName);
	const propColMap = mdcTable
		? buildPropToColumnMap(mdcTable, editablePropNames)
		: new Map<string, { colIndex: number; isAuxiliary: boolean }>();
	const primaryToAux = buildPrimaryToAuxMap(propColMap);

	const items: ColumnListItem[] = newRows.map((newRowData, rowIdx) => {
		const transientContext = navListBinding.create({}, true);
		for (const key of allPropNames) {
			if (tableFlags?.properties[key]?.isComputed === true) {
				continue;
			}
			const value = newRowData[key];
			if (value !== undefined && typeof value !== "object") {
				transientContext.setProperty(key, value);
			}
		}
		newContexts.push(transientContext);

		const newSpecs = buildVisibleColumns(displayPropNames, tableFlags?.properties ?? {}, {});
		const cells = newSpecs.map((spec) => {
			const leafFields = spec.propNames.map((propName) => {
				const isEditable = editableSet.has(propName);
				const field = ctx.runAsOwner(() => {
					if (isEditable) {
						return (
							<Field
								_requiresValidation={true}
								validateFieldGroup={ctx.onValidateFieldGroups}
								fieldGroupIds={"EasyFillField"}
								metaPath={propName}
								contextPath={`${ctx.ownerContextPath}${navigationPropertyName}`}
								change={ctx.onFieldChange}
							/>
						) as Field;
					}
					return (
						<Field
							metaPath={propName}
							contextPath={`${ctx.ownerContextPath}${navigationPropertyName}`}
							readOnly={true}
							required={false}
						/>
					) as Field;
				}) as EnhanceWithUI5<Field>;
				field.setBindingContext(transientContext);
				if (isEditable) {
					fieldMap.set(`${rowIdx}_${propName}`, field);
					for (const auxPropName of primaryToAux.get(propName) ?? []) {
						fieldMap.set(`${rowIdx}_${auxPropName}`, field);
					}
				}
				return field;
			});
			if (leafFields.length === 1) return leafFields[0];
			return new VBox({ items: leafFields as Control[] });
		});

		return new ColumnListItem({ cells: cells as Control[], highlight: MessageType.Information });
	});

	if (newContexts.length > 0) {
		ctx.pendingNewRowContexts.set(navigationPropertyName, newContexts);
	}
	return { items, fieldMap };
}

/**
 * Validates AI-supplied table cell values against their value lists and marks invalid cells.
 * @param ctx The table preview context.
 * @param navigationPropertyName The navigation property name.
 * @param aiChanges All AI-proposed rows.
 * @param parentDataPath Data path of the parent entity.
 * @param fieldMap Field references keyed by `${rowIdx}_${propName}`.
 * @param existingRowCount Number of existing rows (offset for new row field map keys).
 */
export async function validateTableCellValues(
	ctx: TablePreviewContext,
	navigationPropertyName: string,
	aiChanges: Array<{ _rowIndex?: number; [key: string]: unknown }>,
	parentDataPath: string,
	fieldMap: Map<string, EnhanceWithUI5<Field>>,
	existingRowCount: number
): Promise<void> {
	const { metaModel } = ctx;
	if (!metaModel) {
		return;
	}
	const tableFlags = ctx.tableData.get(navigationPropertyName)?.flags;
	let newRowIdx = 0;
	const fieldsToCheck = new Set<EnhanceWithUI5<Field>>();
	for (const aiRow of aiChanges) {
		const fieldMapRowIdx = aiRow._rowIndex !== undefined ? aiRow._rowIndex : existingRowCount + newRowIdx++;
		for (const propName of Object.keys(aiRow).filter((k) => k !== "_rowIndex" && !EasyFillFieldHelper.isTechnicalFieldKey(k))) {
			const field = fieldMap.get(`${fieldMapRowIdx}_${propName}`);
			if (!field) {
				continue;
			}
			const propertyMetaPath = metaModel.getMetaPath(`${parentDataPath}/${navigationPropertyName}/${propName}`);
			try {
				const valueList = await ctx.getValueList(propertyMetaPath);
				if (
					!valueList ||
					!ValueListHelper.isValueListSearchable(
						propertyMetaPath,
						valueList as Parameters<typeof ValueListHelper.isValueListSearchable>[1]
					)
				) {
					continue;
				}
				const prefix = tableFlags?.properties?.[propName]?.isAuxiliary === true ? "auxiliary" : "primary";
				field.data(`${prefix}PropMetaPath`, propertyMetaPath);
				fieldsToCheck.add(field);
			} catch (err) {
				Log.warning(`EasyFill: value list lookup failed for "${propName}", skipping VH check:`, err as Error);
			}
		}
	}
	setTimeout(() => {
		fieldsToCheck.forEach((field) => {
			ctx.applyCompositeFieldCheck(field).catch((err: unknown) => Log.error("EasyFill VH error marking failed:", err as Error));
		});
	}, INNER_CONTROL_RENDER_DELAY_MS);
}

export { UNIT_INPUT_ID_SUFFIX };
