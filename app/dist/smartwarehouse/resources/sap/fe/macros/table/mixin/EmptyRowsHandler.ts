import type { EntitySet, NavigationProperty } from "@sap-ux/vocabularies-types";
import type { DefaultValuesFunction } from "@sap-ux/vocabularies-types/vocabularies/Common";
import Log from "sap/base/Log";
import { type IInterfaceWithMixin } from "sap/fe/base/ClassSupport";
import CommonUtils from "sap/fe/core/CommonUtils";
import { Activity } from "sap/fe/core/controllerextensions/collaboration/CollaborationCommon";
import TransactionHelper from "sap/fe/core/controllerextensions/editFlow/TransactionHelper";
import { CreationMode } from "sap/fe/core/converters/ManifestSettings";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import type { AnnotationTableColumn } from "sap/fe/core/converters/controls/Common/table/Columns";
import { type ITableBlock } from "sap/fe/macros/Table";
import type UI5Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import Library from "sap/ui/core/Lib";
import Messaging from "sap/ui/core/Messaging";
import Message from "sap/ui/core/message/Message";
import MessageType from "sap/ui/core/message/MessageType";
import type MDCTable from "sap/ui/mdc/Table";
import type MDCColumn from "sap/ui/mdc/table/Column";
import type DataState from "sap/ui/model/DataState";
import type PropertyBinding from "sap/ui/model/PropertyBinding";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";
import type { ContextErrorType } from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";

export default class EmptyRowsHandler implements IInterfaceWithMixin {
	creatingEmptyRows?: boolean;

	/**
	 * Promise that resolves to the table's default values.
	 */
	public tableDefaultsPromise?: Promise<object | undefined>;

	setupMixin(_baseClass: Function): void {
		// This method is needed to implement interface IInterfaceWithMixin
	}

	/**
	 * Handler for the onFieldLiveChange event.
	 * @param ui5Event The event object passed by the onFieldLiveChange event
	 */
	_onFieldLiveChange(this: ITableBlock & EmptyRowsHandler, ui5Event: UI5Event<{}, Control>): void {
		const field = ui5Event.getSource(),
			bindingContext = field.getBindingContext() as Context,
			binding = bindingContext.getBinding();
		// creation of a new inactive row if relevant
		if (bindingContext.isInactive()) {
			const table = this?.getContent();
			this?.createEmptyRows(binding as ODataListBinding, table, true);
		}
	}

	/**
	 * Handles the CreateActivate event from the ODataListBinding.
	 * @param activateEvent The event sent by the binding
	 */
	async _handleCreateActivate(
		this: ITableBlock & EmptyRowsHandler,
		activateEvent: UI5Event<{ context: Context }, ODataListBinding>
	): Promise<void> {
		const activatedContext = activateEvent.getParameter("context");
		// we start by asking to recreate an empty row (if live change has already done it this won't have any effect)
		// but we do not wait
		this.createEmptyRows(activateEvent.getSource(), this.getContent(), true);
		const table = this.getContent();
		const appComponent = CommonUtils.getAppComponent(table);
		const binding = table.getRowBinding();
		if (!this.validateEmptyRow(activatedContext)) {
			activateEvent.preventDefault();
			return;
		}
		try {
			const transientPath = activatedContext.getPath(),
				view = CommonUtils.getTargetView(this),
				controller = view.getController(),
				editFlow = controller.editFlow;
			try {
				await Promise.all([
					appComponent
						.getSideEffectsService()
						.requestSideEffectsForNavigationProperty(binding.getPath(), view.getBindingContext()),
					activatedContext.created?.() ?? Promise.resolve()
				]);
				await editFlow.onAfterCreate({ context: activatedContext });
			} catch (e) {
				Log.warning(`Failed to activate context ${activatedContext.getPath()}`);
				return;
			}
			const content = activatedContext.getPath();
			const collaborativeDraft = view.getController().collaborativeDraft;
			// Send notification to other users only after the creation has been finalized
			collaborativeDraft.send({ action: Activity.Create, content });
			// Since the path of the context has changed during activation, we need to update all collaboration locks
			// that were using the transient path
			collaborativeDraft.updateLocksForContextPath(transientPath, activatedContext.getPath());

			// Load the properties that are part of the 'requestAtLeast' annotation from the table (if any)
			const requestAtLeast = Object.keys(this.getTableDefinition().requestAtLeast ?? {});
			if (requestAtLeast.length > 0) {
				await activatedContext.requestProperty(requestAtLeast);
			}
		} catch (error) {
			Log.error("Failed to activate new row -", error as Error);
		}
	}

	/**
	 * Get the default values from the DefaultValues function.
	 * @param listBinding The current list binding
	 * @returns The DefaultValues function (or undefined if no function is found)
	 */
	getDefaultValuesFunction(listBinding: ODataListBinding): DefaultValuesFunction | undefined {
		const model = listBinding.getModel();
		const metaModel = model.getMetaModel();
		const metaContext = metaModel.getMetaContext(listBinding.getResolvedPath() as string);
		const listBindingObjectPath = getInvolvedDataModelObjects(metaContext);

		const defaultFuncOnTargetObject = (listBindingObjectPath.targetObject as NavigationProperty | EntitySet).annotations.Common
			?.DefaultValuesFunction;
		const defaultFuncOnTargetEntitySet = (listBindingObjectPath.targetEntitySet as EntitySet | undefined)?.annotations.Common
			?.DefaultValuesFunction;

		return defaultFuncOnTargetObject ?? defaultFuncOnTargetEntitySet;
	}

	/**
	 * EmptyRowsEnabled setter.
	 * @param enablement
	 */
	setEmptyRowsEnabled(this: ITableBlock & EmptyRowsHandler, enablement: boolean): void {
		// INIT: ensure tableDefaultsPromise exists when enabling empty rows
		if (enablement && !this.tableDefaultsPromise) {
			this.tableDefaultsPromise = this.getTableDefaults(this.getContent());
		}
		this.setProperty("emptyRowsEnabled", enablement);
		const navigationPath = this.getContent().data().navigationPath,
			appComponent = CommonUtils.getAppComponent(this.getContent());
		if (enablement) {
			const listBinding = this.getContent().getRowBinding();
			const defaultValuesFunction = listBinding?.getResolvedPath() ? this.getDefaultValuesFunction(listBinding) : undefined;
			if (defaultValuesFunction) {
				appComponent.getSideEffectsService().registerTargetCallback(navigationPath, this.updateEmptyRows.bind(this));
				// Immediate initial setup without defaults
				if (!this.tableDefaultsPromise) {
					this.setUpEmptyRows(this.getContent());
				}
			}
		} else {
			appComponent.getSideEffectsService().deregisterTargetCallback(navigationPath);
		}
		// Immediate initial setup only if no defaults promise exists (to avoid duplicate empty rows)
		if (this.tableDefaultsPromise) {
			this.tableDefaultsPromise
				.then((tableDefaultData) => {
					this.updateEmptyRows(tableDefaultData);
					return tableDefaultData;
				})
				.catch((error) => {
					Log.error("Error while setting up empty rows:", error);
				});
		} else {
			this.setUpEmptyRows(this.getContent());
		}
	}

	/**
	 * Remove and recreate the empty rows in order to get any updated default values.
	 * @param this
	 * @param defaultsFromPromise
	 * @returns Promise
	 */
	async updateEmptyRows(this: ITableBlock & EmptyRowsHandler, defaultsFromPromise?: object | undefined): Promise<void> {
		const table = this.getContent();
		const binding = table.getRowBinding();
		const bindingHeaderContext = binding.getHeaderContext();

		if (!(binding && binding.isResolved() && binding.isLengthFinal() && bindingHeaderContext)) {
			return;
		}

		const contextPath = bindingHeaderContext.getPath();

		// DO NOT show empty rows in display mode.
		// If any inactive rows are present (from a previous state), remove them and exit.
		if (!CommonUtils.getIsEditable(table)) {
			this.removeEmptyRowsMessages();
			this._deleteEmptyRows(binding, contextPath);
			return;
		}
		this._deleteEmptyRows(binding, contextPath);

		// Analytical tables - Do not create empty rows when grouping is active.
		const groupConditions = table.getGroupConditions?.();
		const bindingAggregation = (binding as unknown as { getAggregation?(): { groupLevels?: unknown[] } }).getAggregation?.();
		if (groupConditions?.groupLevels?.length || bindingAggregation?.groupLevels?.length) {
			return;
		}
		const defaults = defaultsFromPromise ?? (await this.getTableDefaults(table));
		// Update the empty rows with the latest default values
		await this.createEmptyRows(binding, table, false, undefined, false, defaults);
	}

	/**
	 * Helper function to perform common checks for table defaults and empty rows setup.
	 * @param table The table being processed
	 * @returns The binding object if checks pass, or undefined if checks fail
	 */
	private async _validateAndRetrieveBinding(
		this: ITableBlock & EmptyRowsHandler,
		table: MDCTable
	): Promise<ODataListBinding | undefined> {
		if (this.getTableDefinition().control?.creationMode !== CreationMode.InlineCreationRows) {
			return undefined;
		}

		const uiModel = table.getModel("ui") as JSONModel | undefined;
		if (!uiModel) {
			return undefined;
		}

		if (uiModel.getProperty("/isEditablePending")) {
			// Wait until the edit mode computation is complete
			const watchBinding = uiModel.bindProperty("/isEditablePending");
			await new Promise<void>((resolve) => {
				const fnHandler = (): void => {
					watchBinding.detachChange(fnHandler);
					watchBinding.destroy();
					resolve();
				};
				watchBinding.attachChange(fnHandler);
			});
		}

		const binding = table.getRowBinding() as ODataListBinding | undefined;

		if (!binding || (binding.isRelative() && !binding.getContext())) {
			return undefined;
		}
		return binding;
	}

	/**
	 * Gets the table defaults by validating and retrieving the binding, then fetching data from the DefaultValueFunction.
	 * @param table The table being processed
	 * @returns A promise that resolves to an object containing the default values, or undefined if no binding is available or the DefaultValueFunction returns no data
	 */
	async getTableDefaults(this: ITableBlock & EmptyRowsHandler, table: MDCTable): Promise<object | undefined> {
		const binding = await this._validateAndRetrieveBinding(table);
		if (!binding) return undefined;

		const appComponent = CommonUtils.getAppComponent(CommonUtils.getTargetView(table));
		return appComponent ? TransactionHelper.getDataFromDefaultValueFunction(binding, appComponent) : undefined;
	}

	async setUpEmptyRows(
		this: ITableBlock & EmptyRowsHandler,
		table: MDCTable,
		createButtonWasPressed = false,
		tableDefaultData = {}
	): Promise<void> {
		const binding = await this._validateAndRetrieveBinding(table);
		if (!binding) {
			return;
		}
		const bindingHeaderContext = binding.getHeaderContext();
		if (binding && binding.isResolved() && binding.isLengthFinal() && bindingHeaderContext) {
			const contextPath = bindingHeaderContext.getPath();
			if (!this.emptyRowsEnabled) {
				this.removeEmptyRowsMessages();
				return this._deleteEmptyRows(binding, contextPath);
			}
			if (!CommonUtils.getIsEditable(table)) {
				return;
			}
			if (
				this.getTableDefinition().control?.inlineCreationRowsHiddenInEditMode &&
				!table.getBindingContext("pageInternal")?.getProperty("createMode") &&
				!createButtonWasPressed
			) {
				return;
			}
			// Do not create empty rows when grouping is active — analytical tables do not support creating rows with active group levels.
			const groupConditions = table.getGroupConditions?.();
			const bindingAggregation = (binding as unknown as { getAggregation?(): { groupLevels?: unknown[] } }).getAggregation?.();
			if (groupConditions?.groupLevels?.length || bindingAggregation?.groupLevels?.length) {
				return;
			}
			const inactiveContext = binding.getAllCurrentContexts().find(function (context) {
				// when this is called from controller code we need to check that inactive contexts are still relative to the current table context
				return context.isInactive() && context.getPath().startsWith(contextPath);
			});
			if (!inactiveContext) {
				this.removeEmptyRowsMessages();
				await this.createEmptyRows(binding, table, false, undefined, false, tableDefaultData);
			}
		}
	}

	/**
	 * Deletes inactive rows from the table listBinding.
	 * @param binding
	 * @param contextPath
	 */
	_deleteEmptyRows(binding: ODataListBinding, contextPath: string): void {
		for (const context of binding.getAllCurrentContexts()) {
			if (context.isInactive() && context.getPath().startsWith(contextPath)) {
				context.delete();
			}
		}
	}

	/**
	 * Returns the current number of inactive contexts within the list binding.
	 * @param binding Data list binding
	 * @returns The number of inactive contexts
	 */
	getInactiveContextNumber(binding: ODataListBinding): number {
		return binding.getAllCurrentContexts().filter((context) => context.isInactive()).length;
	}

	/**
	 * Handles the validation of the empty row.
	 * @param context The context of the empty row
	 * @returns The validation status
	 */
	validateEmptyRow(this: ITableBlock & EmptyRowsHandler, context: Context): boolean {
		const requiredProperties = this.getTableDefinition().annotation.requiredProperties;
		if (requiredProperties?.length) {
			this.removeEmptyRowsMessages(context);
			const missingProperties = requiredProperties.filter((requiredProperty) => !context.getObject(requiredProperty));
			if (missingProperties.length) {
				const resourceBundle = Library.getResourceBundleFor("sap.fe.macros")!;
				const messages: Message[] = [];
				let displayedColumn: MDCColumn | undefined;
				for (const missingProperty of missingProperties) {
					let errorMessage: string;
					const missingColumn = this.getTableDefinition().columns.find(
						(tableColumn) =>
							(tableColumn as AnnotationTableColumn).relativePath === missingProperty ||
							(tableColumn.propertyInfos && tableColumn.propertyInfos.includes(missingProperty))
					);

					if (!missingColumn) {
						errorMessage = resourceBundle.getText("M_TABLE_EMPTYROW_MANDATORY", [missingProperty]);
					} else {
						displayedColumn = this.getContent()
							.getColumns()
							.find((mdcColumn) => mdcColumn.getPropertyKey() === missingColumn.name);
						errorMessage = resourceBundle.getText(
							displayedColumn ? "M_TABLE_EMPTYROW_MANDATORY" : "M_TABLE_EMPTYROW_MANDATORY_HIDDEN",
							[displayedColumn?.getHeader() || missingColumn.label]
						);
					}

					messages.push(
						new Message({
							message: errorMessage,
							processor: this.getModel(),
							type: MessageType.Error,
							technical: false,
							persistent: true,
							technicalDetails: {
								tableId: this.getContent().getId(), // Need to do it since handleCreateActivate can be triggered multiple times (extra properties set by value help) before controlIds are set on the message
								emptyRowMessage: true,
								missingColumn: displayedColumn ? undefined : missingProperty // needed to change the messageStrip message
							},
							target: `${context?.getPath()}/${missingProperty}`
						})
					);
				}
				Messaging.addMessages(messages);
				return false;
			}
		}

		// Prevent activation when any field binding holds a client-side invalid value
		const hasInvalidBinding = context
			.getModel()
			.getDependentBindings(context)
			.some(
				(binding) =>
					!binding.getPath()?.startsWith("@$ui5") &&
					(binding as PropertyBinding & { getDataState?(): DataState }).getDataState?.()?.getInvalidValue?.() !== undefined
			);

		if (hasInvalidBinding) {
			return false;
		}

		return true;
	}

	/**
	 * Removes the messages related to the empty rows.
	 * @param inactiveContexts The contexts of the empty rows, if not provided, the messages of all empty rows are removed
	 */
	removeEmptyRowsMessages(this: ITableBlock & EmptyRowsHandler, inactiveContexts?: Context | Context[]): void {
		Messaging.removeMessages(
			(Messaging.getMessageModel().getData() as Message[]).filter((msg) => {
				const technicalDetails = (msg.getTechnicalDetails() || {}) as { tableId?: string; emptyRowMessage?: boolean };

				// Check if msg target starts with any path in the inactiveContext array
				const contextMatches = Array.isArray(inactiveContexts)
					? inactiveContexts.some((context) => msg.getTargets().some((value) => value.startsWith(context.getPath())))
					: !inactiveContexts || msg.getTargets().some((value) => value.startsWith(inactiveContexts.getPath()));

				return contextMatches && technicalDetails.emptyRowMessage && technicalDetails.tableId === this.getContent().getId();
			})
		);
	}

	/**
	 * Creation of inactive rows for the table in creation mode "InlineCreationRows".
	 * @param binding Data list binding
	 * @param table The table being edited
	 * @param recreateOneRow `true` if the call is to recreate an emptyLine
	 * @param newInlineCreationRowFromPaste Number of new inactive rows to be created
	 * @param forceCreateatEnd `true` if the new row is to be created at the end of the table
	 * @param defaultValueFunctionData Default values retrieved from the DefaultValuesFunction to be applied to the new rows
	 * @returns A promise that resolves to the created contexts or void if the creation failed
	 */
	async createEmptyRows(
		this: ITableBlock & EmptyRowsHandler,
		binding: ODataListBinding,
		table: MDCTable,
		recreateOneRow = false,
		newInlineCreationRowFromPaste?: number,
		forceCreateatEnd = false,
		defaultValueFunctionData?: object | undefined
	): Promise<void | Context[]> {
		const inlineCreationRowCount = newInlineCreationRowFromPaste ?? (this.getTableDefinition().control?.inlineCreationRowCount || 1);
		/* ensures that at most one additional empty row can exist during LiveChange (when `recreateOneRow` is true).
		In all other cases, the number of inactive contexts cannot exceed `inlineCreationRowCount`.*/
		if (this.creatingEmptyRows || this.getInactiveContextNumber(binding) >= inlineCreationRowCount + (recreateOneRow ? 1 : 0)) {
			return;
		}
		const data = Array.from({ length: inlineCreationRowCount }, () => ({})),
			atEnd = table.data("tableType") !== "ResponsiveTable",
			view = CommonUtils.getTargetView(table),
			controller = view.getController(),
			editFlow = controller.editFlow;

		this.creatingEmptyRows = true;
		try {
			const dataForCreate = recreateOneRow ? [{}] : data;
			const contexts = await editFlow.createMultipleDocuments(
				binding,
				// during a live change, only 1 new document is created
				dataForCreate,
				{
					createAtEnd: recreateOneRow || forceCreateatEnd ? true : atEnd, // When editing an empty row, the new empty row is to be created just below and not above

					beforeCreateCallBack: controller.editFlow.onBeforeCreate,
					createAsInactive: true,
					hideBusyIndicator: true,
					defaultValueFunctionData
				}
			);
			contexts?.forEach(async function (context: Context) {
				try {
					await context.created();
				} catch (error) {
					if (!(error as ContextErrorType).canceled) {
						throw error;
					}
				}
			});
			return contexts;
		} catch (e) {
			Log.error(e as string);
		} finally {
			this.creatingEmptyRows = false;
		}
	}
}
