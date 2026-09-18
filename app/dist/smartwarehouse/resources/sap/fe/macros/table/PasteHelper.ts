import type { ArrayWithIndex, Property } from "@sap-ux/vocabularies-types";
import type { PropertyAnnotations_Core } from "@sap-ux/vocabularies-types/vocabularies/Core_Edm";
import { TextArrangementType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import type PageController from "sap/fe/core/PageController";
import { CreationMode } from "sap/fe/core/converters/ManifestSettings";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import { FieldEditMode } from "sap/fe/core/templating/UIFormatters";
import type TableAPI from "sap/fe/macros/Table";
import type { EnhancedFEPropertyInfo } from "sap/fe/macros/Table";
import * as EasyFilterDataFetcher from "sap/fe/macros/ai/EasyFilterDataFetcher";
import ValueListHelper, { type ValueListInfo } from "sap/fe/macros/internal/valuehelp/ValueListHelper";
import MessageBox from "sap/m/MessageBox";
import Library from "sap/ui/core/Lib";
import Messaging from "sap/ui/core/Messaging";
import type Message from "sap/ui/core/message/Message";
import * as CorePasteHelper from "sap/ui/core/util/PasteHelper";
import type Table from "sap/ui/mdc/Table";
import type ValueHelp from "sap/ui/mdc/ValueHelp";
import type Column from "sap/ui/mdc/table/Column";
import type Context from "sap/ui/model/Context";
import FilterOperator from "sap/ui/model/FilterOperator";
import ValidateException from "sap/ui/model/ValidateException";
import type ODataType from "sap/ui/model/odata/type/ODataType";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";

export type customValidationMessage = {
	messageText?: string;
	messageTarget?: string;
};

type PasteInformation = {
	rows: ODataV4Context[];
	columns: Column[];
	updatedRowCount: number;
	numberOfNewCreationRows: number;
};

const getInfoForEntityProperty = function (
	propertyPath: string,
	rowBindingPath: string,
	metaContext: Context,
	metaModel: ODataMetaModel,
	enablePastingOfComputedProperties = false,
	forceIgnore = false
): PasteColumnInfo {
	const property = metaContext.getProperty(propertyPath),
		formatOptions = { parseKeepsEmptyString: true },
		type = metaModel.getUI5Type(`${rowBindingPath}/${propertyPath}`, formatOptions);
	let isIgnored, computed;
	if (enablePastingOfComputedProperties === true) {
		isIgnored = !property;
		computed = metaContext.getProperty(`${propertyPath}@Org.OData.Core.V1.Computed`);
	} else {
		isIgnored = !property || metaContext.getProperty(`${propertyPath}@Org.OData.Core.V1.Computed`);
	}

	return {
		property: propertyPath,
		ignore: forceIgnore || isIgnored,
		computed: computed,
		type: type
	};
};

const displayErrorMessages = function (errorMessages: string[]): void {
	const messageDetails = [...errorMessages];
	const resourceBundle = Library.getResourceBundleFor("sap.fe.core")!,
		errorCorrectionMessage = resourceBundle.getText("C_PASTE_HELPER_SAPFE_PASTE_ERROR_CORRECTION_MESSAGE"),
		noteMessage = resourceBundle.getText("C_PASTE_HELPER_SAPFE_PASTE_ERROR_CORRECTION_NOTE");
	let pasteErrorMessage;

	if (messageDetails.length > 1) {
		pasteErrorMessage = resourceBundle.getText("C_PASTE_HELPER_SAPFE_PASTE_ERROR_MESSAGE_PLURAL", [messageDetails.length]);
	} else {
		pasteErrorMessage = resourceBundle.getText("C_PASTE_HELPER_SAPFE_PASTE_ERROR_MESSAGE_SINGULAR");
	}
	messageDetails.unshift(""); // To show space between the short text and the list of errors
	messageDetails.unshift(noteMessage);
	messageDetails.unshift(errorCorrectionMessage);
	MessageBox.error(pasteErrorMessage, {
		title: resourceBundle.getText("C_COMMON_SAPFE_ERROR_MESSAGES_PAGE_TITLE_ERROR"),
		details: messageDetails.join("<br>")
	});
};

type PasteColumnInfo = {
	property: string | undefined;
	type?: ODataType | null;
	ignore: boolean;
	computed?: boolean;
	customParseFunction?: Function;
};

const PasteHelper = {
	displayErrorMessages: displayErrorMessages,
	formatCustomMessage: function (validationMessages: customValidationMessage[], iRowNumber: number): string {
		let errorMessage = "";
		const numberMessages = validationMessages.length;
		const resourceBundle = Library.getResourceBundleFor("sap.fe.core")!,
			i18nRow = resourceBundle.getText("T_MESSAGE_GROUP_DESCRIPTION_TABLE_ROW");
		if (numberMessages > 0) {
			errorMessage += `${i18nRow} ${iRowNumber}: `;
			validationMessages.forEach((message, indexMessage) => {
				if (message.messageText) {
					errorMessage += message.messageText + (indexMessage + 1 !== numberMessages ? " " : "");
				}
			});
		}
		return errorMessage;
	},
	async _getValueList(propertyPath: string, metaModel: ODataMetaModel, metaContext: Context): Promise<ValueListInfo | undefined> {
		const valueLists = await ValueListHelper.getValueListInfo(
			{
				getBindingContext(): Context | null | undefined {
					return metaContext;
				}
			} as unknown as ValueHelp,
			propertyPath,
			undefined,
			metaModel
		);
		return valueLists[0];
	},
	/**
	 * Get details about table columns.
	 * @param table The table which contains the columns to be analyzed
	 * @param columns A list of columns to be analyzed. If undefined, all columns from the table are analyzed
	 * @param ignoreNavigationProperty If true, navigation properties are ignored
	 * @returns An array of objects providing details about columns.
	 */
	getColumnInfo: function (table: Table, columns?: Column[], ignoreNavigationProperty = true): PasteColumnInfo[] {
		const model = table.getRowBinding().getModel(),
			metaModel = model.getMetaModel(),
			rowBindingPath = model.resolve(table.getRowBinding().getPath(), table.getRowBinding().getContext()),
			metaContext = metaModel.getMetaContext(rowBindingPath),
			entityTypeProperties = MetaModelConverter.getInvolvedDataModelObjects(metaContext).targetEntityType.entityProperties,
			columnArrangementProperty: string[] = [],
			tableDefinition = (table.getParent() as TableAPI).getTableDefinition();
		const resourceBundle = Library.getResourceBundleFor("sap.fe.core")!;
		function getColumnFromPropertyInfos(
			dataProperty: EnhancedFEPropertyInfo,
			hasValueHelp: boolean,
			property: string
		): PasteColumnInfo | undefined {
			// If we have a textArrangement, we want to remove it if it has a ValueList associated.
			if (dataProperty.text && hasValueHelp) {
				columnArrangementProperty.push(dataProperty.text);
			}
			// Non exported columns (exportSettings === null) must still be added to columnInfos
			// to preserve column alignment with copied clipboard data.
			if (dataProperty.exportSettings === null) {
				if (dataProperty.path) {
					const infoForEntityProperty = PasteHelper.getInfoForEntityProperty(
						dataProperty.path,
						rowBindingPath,
						metaContext,
						metaModel,
						tableDefinition.control.enablePastingOfComputedProperties,
						false
					);
					// Virtual/computed properties (e.g. RAP @VirtualElement used as UoM) are not present
					// in the clipboard and must stay ignored. Only real non-exported persistent properties
					// (e.g. currency code) should be forced to ignore=false to preserve column alignment.
					const isComputedProperty = !!(
						entityTypeProperties.find((p) => p.name === dataProperty.path)?.annotations
							.Core as unknown as PropertyAnnotations_Core
					)?.Computed?.valueOf();
					infoForEntityProperty.ignore = isComputedProperty;
					return infoForEntityProperty;
				}
			}
			// Check a navigation property within the current Complex property --> ignore
			if (ignoreNavigationProperty && property.includes("/")) {
				return {
					property: dataProperty.path,
					ignore: true
				};
			} else {
				let forceIgnore = false;
				if (dataProperty.path) {
					forceIgnore = columnArrangementProperty.includes(dataProperty.path);
				}
				// The object this is weird in a function, so changing it to PasteHelper instead.
				return PasteHelper.getInfoForEntityProperty(
					dataProperty.path!,
					rowBindingPath,
					metaContext,
					metaModel,
					tableDefinition.control.enablePastingOfComputedProperties,
					forceIgnore
				);
			}
		}

		const propertyInfo = (table.getParent() as TableAPI).getEnhancedFetchedPropertyInfos();
		const propertyInfoDict: Record<string, EnhancedFEPropertyInfo> = Object.assign(
			{},
			...propertyInfo.map((property) => ({ [property.key]: property }))
		);
		const columnInfos: PasteColumnInfo[] = [];
		(columns ?? table.getColumns()).forEach((column) => {
			const infoProperty = propertyInfoDict[column.getPropertyKey()];
			// Check if it's a complex property (property associated to multiple simple properties)
			if (infoProperty.propertyInfos) {
				// Get data from simple property
				const mainPropInfo = { ...propertyInfoDict[column.getPropertyKey()] };
				mainPropInfo.path = column.getPropertyKey();
				const mainProp = entityTypeProperties.by_name(mainPropInfo.name);
				if (
					mainProp?.annotations.Common?.Text &&
					mainProp.annotations.Common.Text.annotations?.UI?.TextArrangement?.valueOf() === TextArrangementType.TextOnly
				) {
					const hasValueHelp = this.hasValueHelpProperty(entityTypeProperties, mainPropInfo),
						columnToPush = getColumnFromPropertyInfos(mainPropInfo, hasValueHelp, column.getPropertyKey());
					if (columnToPush) {
						delete columnToPush.type;
						columnToPush.customParseFunction = async (data: never): Promise<never> => {
							const valueList = await this._getValueList(metaContext.getPath(mainProp.name), metaModel, metaContext);
							// Check if the value list is searchable and validate the updated field values
							if (valueList && ValueListHelper.isValueListSearchable(metaContext.getPath(mainProp.name), valueList)) {
								const values = await EasyFilterDataFetcher.resolveTokenValue(
									valueList,
									{
										operator: FilterOperator.EQ,
										selectedValues: [data as string]
									},
									true
								);
								// Update the field value if it differs from the resolved value
								if (!values[0].noMatch) {
									if (values[0].selectedValues.length > 1) {
										const potentialValues = values[0].selectedValues
											.map((val) => val.value + "(" + val.description + ")")
											.join(",");
										throw new ValidateException(
											resourceBundle.getText("C_PASTE_HELPER_SAPFE_PASTE_ERROR_AMBIGUOUS_VALUES", [potentialValues])
										);
									}
									return values[0].selectedValues[0].value as never;
								} else {
									throw new ValidateException(resourceBundle.getText("C_PASTE_HELPER_SAPFE_PASTE_ERROR_INVALID_VALUES"));
								}
							}
							return data;
						};
						columnInfos.push(columnToPush);
					}
				} else {
					infoProperty.propertyInfos.forEach((property: string) => {
						const dataProperty = propertyInfoDict[property],
							hasValueHelp = this.hasValueHelpProperty(entityTypeProperties, dataProperty),
							columnToPush = getColumnFromPropertyInfos(dataProperty, hasValueHelp, property);
						if (columnToPush) {
							columnInfos.push(columnToPush);
						}
					});
				}

				if (infoProperty.exportDataPointTargetValue) {
					columnInfos.push({
						property: "targetValueFromDataPoint",
						ignore: true
					});
				}
				// Non exported columns should be part of the columnInfos
			} else if (infoProperty.exportSettings !== null) {
				if (infoProperty.path) {
					columnInfos.push(
						PasteHelper.getInfoForEntityProperty(
							infoProperty.path,
							rowBindingPath,
							metaContext,
							metaModel,
							tableDefinition.control.enablePastingOfComputedProperties
						)
					);
				} else {
					// Empty column --> ignore
					columnInfos.push({
						property: "unused",
						type: null,
						ignore: true
					});
				}
			}
		});
		return columnInfos;
	},
	getInfoForEntityProperty: getInfoForEntityProperty,

	/**
	 * Returns whether a property has a value list or not.
	 * @param entityTypeProperties The entity properties
	 * @param dataProperty The property we want to check
	 * @returns Boolean `true` if the property has a value list.
	 */
	hasValueHelpProperty: function (
		entityTypeProperties: ArrayWithIndex<Property, "name" | "fullyQualifiedName">,
		dataProperty: EnhancedFEPropertyInfo
	): boolean {
		const property = entityTypeProperties.find((p) => p.name === dataProperty.path);
		if (property) {
			return !!property.annotations?.Common?.ValueList;
		}
		return false;
	},

	/**
	 * Transform an array of data by parsing it into an array of objects, facilitating the mapping of columns and data.
	 * @param rawData The table which contains the columns to be analyzed
	 * @param table The table which receives the data
	 * @param columns A list of columns to be used to map the data. If undefined, all table columns are used
	 * @param ignoreNavigationProperty If true, navigation properties are ignored
	 * @returns A collection of objects that associates data with corresponding columns.
	 */
	parsePastedData: async function (
		rawData: unknown[][],
		table: Table,
		columns?: Column[],
		ignoreNavigationProperty = true
	): Promise<Record<string, unknown>[]> {
		const pasteInfos = this.getColumnInfo(table, columns, ignoreNavigationProperty);
		const tableDefinition = (table.getParent() as TableAPI).getTableDefinition();
		// Check if we have data for at least the first editable column
		const pastedColumnCount = rawData.length ? rawData[0].length : 0;
		let firstEditableColumnIndex = -1;
		for (let I = 0; I < pasteInfos.length && firstEditableColumnIndex < 0; I++) {
			if (!pasteInfos[I].ignore && !pasteInfos[I].computed) {
				firstEditableColumnIndex = I;
			}
		}

		if (tableDefinition.control.enablePastingOfComputedProperties) {
			const computedProperties = pasteInfos.filter(function (info) {
				return info.computed;
			});
			//for each computed property, check if the column is empty . If yes, ignore it
			computedProperties.forEach(function (computedProperty) {
				const columnPosition = pasteInfos.indexOf(computedProperty);
				const isColEmpty = rawData.every((row) => row[columnPosition] === "");
				if (isColEmpty) {
					computedProperty.ignore = true;
				}
			});
		}

		const parseResult = await (firstEditableColumnIndex < 0 || firstEditableColumnIndex > pastedColumnCount - 1
			? { parsedData: [], errors: null } // We don't have data for an editable column --> return empty parsed data
			: CorePasteHelper.parse(rawData, pasteInfos));
		if (parseResult.errors) {
			const errorMessages = parseResult.errors.map(function (oElement) {
				return oElement.message;
			});
			this.displayErrorMessages(errorMessages);
			return []; // Errors --> return nothing
		} else {
			return parseResult.parsedData;
		}
	},

	/**
	 * Update an array of contexts.
	 * @param table The table which contains the contexts to be updated
	 * @param contexts Array of contexts to be updated
	 * @param data Array of object containing the data to be used to update the contexts
	 * @returns Promise
	 */
	_updateContexts: async function (
		table: Table,
		contexts: (ODataV4Context | undefined)[],
		data: Record<string, unknown>[]
	): Promise<void> {
		let index = 0;
		const setPropertyPromises = [];
		for (const row of data) {
			const rowContext = contexts[index++];
			if (rowContext) {
				for (const dataProperty in row) {
					const editMode = (table.getParent() as TableAPI).getPropertyEditMode(dataProperty, rowContext);
					if (editMode === FieldEditMode.Editable || editMode === FieldEditMode.EditableDisplay) {
						setPropertyPromises.push(rowContext.setProperty(dataProperty, row[dataProperty]));
					} else {
						Log.warning(`Property ${dataProperty} is not editable for row ${rowContext.getIndex()}`);
					}
				}
			}
		}
		await Promise.allSettled(setPropertyPromises);
	},

	/**
	 *  Get information about the paste operation on ResponsiveTable.
	 * @param rawData
	 * @param cellSelection
	 * @param cellSelection.columns
	 * @param cellSelection.rows
	 * @param posFirstSelectedRow
	 * @param table
	 * @returns Objet containing Information about the pasting operation
	 */
	getPasteInformationForReponsiveTable: function (
		rawData: string[][],
		cellSelection: { columns: Column[]; rows: ODataV4Context[] },
		posFirstSelectedRow: number,
		table: Table
	): PasteInformation {
		let numberOfNewCreationRows = 0;
		const posFirstInlineCreationRowInTable = table
			.getRowBinding()
			.getCurrentContexts()
			.findIndex((context) => context.isTransient());
		const rows = cellSelection.rows;
		let updatedRowCount = 0;
		const columns =
			cellSelection.columns.length > 1
				? cellSelection.columns
				: table.getColumns().slice(table.getColumns().indexOf(cellSelection.columns[0]));

		// only one cell is selected
		if (cellSelection.columns.length === 1 && cellSelection.rows.length === 1) {
			// check if the inline creation row is in the targeted range
			if (
				posFirstSelectedRow <= posFirstInlineCreationRowInTable &&
				posFirstSelectedRow + rawData.length > posFirstInlineCreationRowInTable
			) {
				numberOfNewCreationRows = rawData.length - (posFirstInlineCreationRowInTable - posFirstSelectedRow) - 1;
				updatedRowCount = rawData.length;
			} else {
				// the inline creation row is not in the targeted range
				numberOfNewCreationRows = 0;
				updatedRowCount = rawData.length;
			}
		} else {
			// multiple cells are selected
			const lastInlineCreationRowInSelection = rows.filter((context) => context.isTransient())?.pop();
			const posLastInlineCreationRowInSelection = lastInlineCreationRowInSelection
				? rows.indexOf(lastInlineCreationRowInSelection)
				: -1;
			updatedRowCount = Math.min(rawData.length, cellSelection.rows.length);
			// check if the inline creation row is in the selected range
			if (posLastInlineCreationRowInSelection > -1) {
				updatedRowCount = posLastInlineCreationRowInSelection === cellSelection.rows.length - 1 ? rawData.length : updatedRowCount;
				numberOfNewCreationRows =
					posLastInlineCreationRowInSelection === cellSelection.rows.length - 1
						? rawData.length - posLastInlineCreationRowInSelection - 1
						: 0;
			}
		}
		return { rows, columns, updatedRowCount, numberOfNewCreationRows };
	},

	/**
	 *  Get information about the paste operation on GridTable.
	 * @param rawData
	 * @param cellSelection
	 * @param cellSelection.columns
	 * @param cellSelection.rows
	 * @param posFirstSelectedRow
	 * @param table
	 * @returns Objet containing Information about the pasting operation
	 */
	getPasteInformationForGridTable: function (
		rawData: string[][],
		cellSelection: { columns: Column[]; rows: ODataV4Context[] },
		posFirstSelectedRow: number,
		table: Table
	): PasteInformation {
		let numberOfNewCreationRows = 0;
		const rows = cellSelection.rows;
		let updatedRowCount = 0;
		const isAnalyticalTable = table.data("enableAnalytics");
		// For analytical tables, the binding length includes grand total row(s) which are not editable data rows.
		// Exclude them so that new rows are created only when we truly exceed the data row count.
		const grandTotalRowsCount = isAnalyticalTable
			? table
					.getRowBinding()
					.getCurrentContexts()
					.filter((c) => !c.isTransient() && c.getPath().endsWith("()")).length
			: 0;
		// For GridTable and AnalyticalTable, pre-existing inactive (empty) rows sit at the end and must be excluded.
		// They don't shift posFirstSelectedRow, so including them would underestimate numberOfNewCreationRows
		// and cause the createEmptyRows guard to block creation.
		// ResponsiveTable creates at position 0 and shifts existing rows, so no exclusion needed there.
		const isResponsiveTableInGetPasteInfo = table.data("tableType") === "ResponsiveTable";
		const inactiveRowsCount = isResponsiveTableInGetPasteInfo
			? 0
			: table
					.getRowBinding()
					.getAllCurrentContexts()
					.filter((c) => c.isInactive?.()).length;
		const tableRowcCount = table.getRowBinding().getLength() - grandTotalRowsCount - inactiveRowsCount;
		let columns =
			cellSelection.columns.length > 1
				? cellSelection.columns
				: table.getColumns().slice(table.getColumns().indexOf(cellSelection.columns[0]));
		if (cellSelection.columns.length === 1 && cellSelection.rows.length === 1) {
			numberOfNewCreationRows =
				posFirstSelectedRow + rawData.length > tableRowcCount ? posFirstSelectedRow + rawData.length - tableRowcCount : 0;
			columns = table.getColumns().slice(table.getColumns().indexOf(cellSelection.columns[0]));
			updatedRowCount = rawData.length;
		} else {
			// multiple cells are selected
			numberOfNewCreationRows =
				posFirstSelectedRow + rows.length >= tableRowcCount ? posFirstSelectedRow + rawData.length - tableRowcCount : 0;
			updatedRowCount = numberOfNewCreationRows === 0 ? Math.min(rawData.length, cellSelection.rows.length) : rawData.length;
		}
		return { rows, columns, updatedRowCount, numberOfNewCreationRows };
	},

	/**
	 *  Get information about the paste operation.
	 * @param rawData
	 * @param cellSelection
	 * @param cellSelection.columns
	 * @param cellSelection.rows
	 * @param posFirstSelectedRow
	 * @param table
	 * @returns Objet containing Information about the pasting operation
	 */
	getPasteInformation: function (
		rawData: string[][],
		cellSelection: { columns: Column[]; rows: ODataV4Context[] },
		posFirstSelectedRow: number,
		table: Table
	): PasteInformation | null {
		let pasteInformation: PasteInformation | null = null;

		switch (table.data("tableType")) {
			case "GridTable":
				pasteInformation = this.getPasteInformationForGridTable(rawData, cellSelection, posFirstSelectedRow, table);
				break;
			case "ResponsiveTable":
				pasteInformation = this.getPasteInformationForReponsiveTable(rawData, cellSelection, posFirstSelectedRow, table);
				break;
			default:
				Log.warning(`Paste operation is not supported for table type ${table.data("tableType")}`);
		}

		if (
			pasteInformation &&
			pasteInformation?.numberOfNewCreationRows > 0 &&
			(table.getParent() as TableAPI & { getCreationMode: Function }).getCreationMode().getName() !== CreationMode.InlineCreationRows
		) {
			pasteInformation.updatedRowCount -= pasteInformation.numberOfNewCreationRows;
			pasteInformation.numberOfNewCreationRows = 0;
		}

		return pasteInformation;
	},

	/**
	 * Paste data into a table using a selection of column and rows.
	 * @param rawData The data to be pasted into the table
	 * @param cellSelection The columns and the rows to be updated
	 * @param cellSelection.columns The columns to be updated
	 * @param cellSelection.rows The rows to be updated
	 * @param table The table
	 * @returns Object containing information about the paste
	 */
	pasteRangeData: async function (
		rawData: string[][],
		cellSelection: { columns: Column[]; rows: ODataV4Context[] },
		table: Table
	): Promise<
		| {
				updatedRowCount: number;
				updatedColCount: number;
				numberOfNewCreationRows: number;
				posFirstInlineCreationRow: number | undefined;
		  }
		| undefined
	> {
		const posFirstSelectedRow = cellSelection.rows[0].getIndex()!;

		const pasteInfo = this.getPasteInformation(rawData, cellSelection, posFirstSelectedRow, table);
		if (!pasteInfo) return;

		const parsedData = await this.parsePastedData(rawData, table, pasteInfo.columns, false);
		if (parsedData.length > 0) {
			const isResponsiveTable = table.data("tableType") === "ResponsiveTable";
			if (pasteInfo.numberOfNewCreationRows > 0) {
				// ResponsiveTable creates new rows at position 0 (beginning).
				// AnalyticalTable and GridTable create at end. The forceCreateAtEnd param controls this.
				await (table.getParent() as TableAPI).createEmptyRows(
					table.getRowBinding(),
					table,
					false,
					pasteInfo.numberOfNewCreationRows,
					!isResponsiveTable
				);
			}

			if (isResponsiveTable && pasteInfo.numberOfNewCreationRows > 0) {
				// New rows were created at position 0 (ResponsiveTable creates at beginning),
				// shifting all existing rows by numberOfNewCreationRows.
				// Request the existing row(s) at their shifted position, then the new rows at position 0,
				// so that parsedData[0] updates the originally selected row and parsedData[1..n] fill the new rows.
				const existingRowCount = pasteInfo.updatedRowCount - pasteInfo.numberOfNewCreationRows;
				const existingRows = await table
					.getRowBinding()
					.requestContexts(posFirstSelectedRow + pasteInfo.numberOfNewCreationRows, existingRowCount);
				const newRows = await table.getRowBinding().requestContexts(0, pasteInfo.numberOfNewCreationRows);
				pasteInfo.rows = [...existingRows, ...newRows];
			} else {
				// Load missing rows if needed including the newly created rows.
				pasteInfo.rows = await table.getRowBinding().requestContexts(posFirstSelectedRow, pasteInfo.updatedRowCount);
			}
			await this._updateContexts(table, pasteInfo.rows, parsedData);

			// For GridTable and AnalyticalTable with inlineCreationRowsHiddenInEditMode=true, no inactive row exists before paste.
			// When paste fits within existing rows (numberOfNewCreationRows=0), no createActivate event fires,
			// so _handleCreateActivate never runs. We must explicitly create the empty row here.
			if (!isResponsiveTable && pasteInfo.numberOfNewCreationRows === 0) {
				await (table.getParent() as TableAPI).createEmptyRows(table.getRowBinding(), table, false, undefined, true);
			}

			// Look for the empty row in all current contexts (not just pasteInfo.rows) since
			// the activated context may have been saved before isTransient() is checked in the mock.
			const inactiveRowContext = table
				.getRowBinding()
				.getAllCurrentContexts()
				.find((c) => c.isInactive?.());
			const posFirstInlineCreationRow =
				inactiveRowContext?.getIndex() ?? pasteInfo.rows.find((context) => context.isTransient())?.getIndex();
			if (posFirstInlineCreationRow !== undefined) {
				table.focusRow(posFirstInlineCreationRow);
			}
			return {
				updatedRowCount: pasteInfo.updatedRowCount,
				updatedColCount: Object.keys(parsedData[0]).length,
				numberOfNewCreationRows: pasteInfo.numberOfNewCreationRows < 0 ? 0 : pasteInfo.numberOfNewCreationRows,
				posFirstInlineCreationRow
			};
		}
	},
	pasteData: async function (rawData: string[][], table: Table, controller: PageController): Promise<Context[] | undefined> {
		const editFlow = controller.editFlow;
		const tableDefinition = (table.getParent() as TableAPI).getTableDefinition();
		let aData: Record<string, unknown>[] = [];
		return this.parsePastedData(rawData, table)
			.then(async (aParsedData: Record<string, unknown>[]) => {
				aData = aParsedData || [];
				return Promise.all(
					aData.map(async (mData) =>
						editFlow.validateDocument(table.getBindingContext() as ODataV4Context, {
							data: mData,
							customValidationFunction: tableDefinition?.control?.customValidationFunction
						})
					)
				);
			})
			.then((aValidationMessages) => {
				const aErrorMessages: { messages: { messageTarget?: string; messageText: string }[]; row: number }[] =
					aValidationMessages.reduce(
						function (aMessages, aCustomMessages, index) {
							if (aCustomMessages.length > 0) {
								aMessages.push({ messages: aCustomMessages, row: index + 1 });
							}
							return aMessages;
						},
						[] as { messages: { messageTarget?: string; messageText: string }[]; row: number }[]
					);
				if (aErrorMessages.length > 0) {
					const aRowMessages = aErrorMessages.map((mError) => this.formatCustomMessage(mError.messages, mError.row));
					this.displayErrorMessages(aRowMessages);
					return [];
				}
				return aData;
			})
			.then(async (aValidatedData): Promise<Context[] | undefined> => {
				// remove the last transient context if it exists
				const transientContexts = table
					.getRowBinding()
					.getCurrentContexts()
					.filter((context) => context.isTransient());
				const lastTransientContext = transientContexts.pop();
				//check if the last transient context has an error message
				const lastTransientContextHasErrorMessage = !!Messaging.getMessageModel()
					.getData()
					.find((message: Message) => lastTransientContext && message.getTargets()[0].includes(lastTransientContext.getPath()));
				const newContexts =
					aValidatedData.length > 0
						? await editFlow.createMultipleDocuments(table.getRowBinding(), aValidatedData, {
								createAtEnd: tableDefinition?.control?.createAtEnd,
								isFromCopyPaste: true,
								beforeCreateCallBack: controller.editFlow.onBeforeCreate,
								requestSideEffects: true
						  })
						: undefined;
				// if the last transient context has no error message, delete it and recreate a new one at the last position
				if (lastTransientContext && !lastTransientContextHasErrorMessage) {
					lastTransientContext?.delete();
					await (table.getParent() as TableAPI).createEmptyRows(table.getRowBinding(), table, false, 1);
				}
				return newContexts;
			})
			.catch((oError) => {
				Log.error("Error while pasting data", oError);
				return undefined;
			});
	}
};

export default PasteHelper;
