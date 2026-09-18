import type { Action as EdmAction, ActionParameter as EdmActionParameter, PrimitiveType } from "@sap-ux/vocabularies-types";
import type AppComponent from "sap/fe/core/AppComponent";
import type { FEView } from "sap/fe/core/BaseController";
import { getCoreUIFactory, type StandardOperationParameterDialog } from "sap/fe/core/UIProvider";
import type MultiValueFieldItem from "sap/ui/mdc/field/MultiValueFieldItem";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type { StartupParameters } from "../../../AppComponent";
import type MessageHandler from "../../MessageHandler";
import actionHelper from "./actionHelper";

type BaseTypeParameter = string | number | boolean;

export default class OperationParameters {
	private readonly isParameterDialogNeeded: boolean;

	private readonly actionParameters: EdmActionParameter[];

	private parameterDialog: StandardOperationParameterDialog | undefined = undefined;

	private parametersValues: Record<string, PrimitiveType> = {};

	private startupParameters: StartupParameters = {};

	/**
	 * Creates an instance of OperationParameters.
	 * This class is responsible for handling the parameters of an OData action, including
	 * managing the parameter dialog, retrieving parameter values, and checking if the dialog is needed.
	 * It checks if the action has parameters and whether a dialog is needed based on the action's parameters.
	 * If the action has parameters, it will create a dialog to collect the parameter values.
	 * If the dialog is not needed (e.g., no parameters or all parameters are hidden), it will return the default values.
	 * @param appComponent The application component
	 * @param model The OData model
	 * @param convertedAction The operation
	 * @param skipParametersDialog If true, the parameter dialog will be skipped if all mandatory values are provided.
	 * @param parameters The parameters for the operation
	 * @param parameters.entitySetName The name of the entity set
	 * @param parameters.contexts The contexts for the action
	 * @param parameters.defaultValuesExtensionFunction The function to get default values for the parameters
	 * @param parameters.isCreateAction Indicates if the action is a create action
	 * @param parameters.label The label for the action
	 * @param parameters.parameterValues The values for the parameters
	 * @param parameters.view The view where the action is executed
	 * @param parameters.messageHandler The message handler for the action
	 * @param parameters.events The events for the parameter dialog
	 * @param parameters.events.onParameterDialogOpened The function to call when the parameter dialog is opened
	 * @param parameters.events.onParameterDialogClosed The function to call when the parameter dialog is closed
	 */
	constructor(
		private readonly appComponent: AppComponent,
		private readonly model: ODataModel,
		private readonly convertedAction: EdmAction,
		private readonly skipParametersDialog: boolean | undefined,
		private readonly parameters: {
			contexts: Context[];
			defaultValuesExtensionFunction?: string;
			isCreateAction?: boolean;
			label?: string;
			parameterValues?: Record<string, string | number | boolean | MultiValueFieldItem[]>[];
			entitySetName?: string;
			view?: FEView;
			messageHandler: MessageHandler;
			events?: {
				onParameterDialogOpened?: () => void;
				onParameterDialogClosed?: () => void;
			};
		}
	) {
		// Check if the action has parameters and would need a parameter dialog
		// The parameter ResultIsActiveEntity is always hidden in the dialog! Hence if
		// this is the only parameter, this is treated as no parameter here because the
		// dialog would be empty!
		this.actionParameters = actionHelper.getActionParameters(this.convertedAction);
		this.isParameterDialogNeeded =
			this.actionParameters.length > 0 &&
			!(this.actionParameters.length === 1 && this.actionParameters[0].name === "ResultIsActiveEntity");

		this.skipParametersDialog =
			(this.actionParameters.length &&
			this.actionParameters
				.filter((actionParameter) => actionParameter.name !== "ResultIsActiveEntity")
				.every((parameter) => parameter.annotations.UI?.Hidden?.valueOf() === true)
				? true
				: this.skipParametersDialog) ?? false;

		this.setStartupParameters();
	}

	/**
	 *  Sets the parameters provided on the startup.
	 */
	private setStartupParameters(): void {
		// Determine startup parameters if provided
		const componentData = this.appComponent.getComponentData();
		this.startupParameters = componentData?.startupParameters ?? {};
	}

	/**
	 *  Is the parameter dialog instanced.
	 * @returns True if the parameter dialog is instanced, otherwise false
	 */
	public isParameterDialog(): boolean {
		return !!this.parameterDialog;
	}

	/**
	 *  Is the parameter dialog opened.
	 * @returns True if the parameter dialog is opened, otherwise false
	 */
	public isParameterDialogOpened(): boolean {
		return this.parameterDialog?.isOpen() ?? false;
	}

	/**
	 * Resets the state of the parameter dialog.
	 */
	public resetParameterDialogState(): void {
		this.parameterDialog?.resetState();
	}

	/**
	 * Closes the state of the parameter dialog.
	 * @returns Promise that resolves when the dialog is closed
	 */
	public async closeParameterDialog(): Promise<void> {
		return this.parameterDialog?.closeDialog();
	}

	/**
	 * Gets the value of the parameters.
	 * @returns The value of the parameters
	 */
	public async getOperationParameters(): Promise<Record<string, PrimitiveType>> {
		// In case an action parameter is needed, and we shall skip the dialog, check if values are provided for all parameters
		if (this.isParameterDialogNeeded && !(this.skipParametersDialog && this.isMandatoryValuesProvided())) {
			if (!this.parameterDialog) {
				this.parameterDialog = getCoreUIFactory().newOperationParameterDialog(
					this.convertedAction,
					{
						appComponent: this.appComponent,
						model: this.model,
						contexts: this.parameters.contexts,
						parametersValues: {},
						defaultValuesExtensionFunction: this.parameters.defaultValuesExtensionFunction,
						isCreateAction: this.parameters.isCreateAction,
						label: this.parameters.label,
						view: this.parameters.view,
						events: {
							onParameterDialogOpened: this.parameters.events?.onParameterDialogOpened,
							onParameterDialogClosed: this.parameters.events?.onParameterDialogClosed
						}
					},
					this.parameters.parameterValues,
					this.parameters.entitySetName,
					this.parameters.messageHandler
				);
				await this.parameterDialog.createDialog();
				this.resetParameterDialogState(); // Ensure clean state for new dialog
				this.parameterDialog.openDialog();
			}
			return this.parameterDialog.waitForParametersValues();
		}
		// If the dialog is skipped, we need to set the default values for the parameters
		if (this.parameters.parameterValues) {
			for (const i in this.actionParameters) {
				this.parametersValues[this.actionParameters[i].name] = this.parameters.parameterValues?.find(
					(element) => element.name === this.actionParameters[i].name
				)?.value;
			}
		} else {
			let actionParameter;
			for (const i in this.actionParameters) {
				actionParameter = this.actionParameters[i];
				this.parametersValues[actionParameter.name] = await this.convertValue(
					actionParameter,
					this.startupParameters[actionParameter.name]?.[0] ?? actionParameter.annotations?.UI?.ParameterDefaultValue?.valueOf()
				);
			}
		}
		return this.parametersValues;
	}

	/**
	 *  Are values provided for the mandatory parameters.
	 * @returns True if the information is provided, otherwise false
	 */
	private isMandatoryValuesProvided(): boolean {
		const hiddenAnnotationSetOnAllActions = this.actionParameters
			.filter((parameter) => parameter.name !== "ResultIsActiveEntity")
			.every((parameter) => parameter?.annotations?.UI?.Hidden?.valueOf() === true);

		if (this.parameters.parameterValues?.length && !hiddenAnnotationSetOnAllActions) {
			// If showDialog is false but there are parameters from the invokeAction call which need to be checked on existence
			for (const actionParameter of this.actionParameters) {
				if (
					actionParameter.name !== "ResultIsActiveEntity" &&
					!this.parameters.parameterValues?.find((element) => element.name === actionParameter.name)
				) {
					// At least for one parameter no value has been provided, so we can't skip the dialog
					return false;
				}
			}
		}

		if (this.parameters.isCreateAction === true && Object.keys(this.startupParameters).length && !hiddenAnnotationSetOnAllActions) {
			// If parameters have been provided during application launch, we need to check if the set is complete
			// If not, the parameter dialog still needs to be shown.
			for (const actionParameter of this.actionParameters) {
				if (!this.startupParameters[actionParameter.name]) {
					// At least for one parameter no value has been provided, so we can't skip the dialog
					return false;
				}
			}
		}

		if (this.actionParameters.length && hiddenAnnotationSetOnAllActions) {
			return this.actionParameters.every((parameter) => {
				const fieldControl = parameter.annotations?.Common?.FieldControl;
				const isMandatory = fieldControl?.toString() === "Common.FieldControlType/Mandatory";

				// Possible sources may be startupParameters, parameterValues, defaultValues per annotation (ParameterDefaultValue)
				// If none is found, return false
				return (
					!isMandatory ||
					this.startupParameters[parameter.name] ||
					this.parameters.parameterValues?.find((parameterValue) => parameterValue.name === parameter.name) ||
					parameter?.annotations?.UI?.ParameterDefaultValue?.valueOf()
				);
			});
		}

		return true;
	}

	/**
	 *  Formats the value provided with a non relevant type.
	 * @param parameter The parameter
	 * @param value The value to convert
	 * @returns The converted value
	 */
	private async convertValue(
		parameter: EdmActionParameter,
		value?: BaseTypeParameter | null
	): Promise<BaseTypeParameter | undefined | null> {
		if (value === undefined || value === null) {
			return null;
		}
		const TypeMap = (await import("sap/ui/mdc/odata/v4/TypeMap")).default;
		const BaseType = (await import("sap/ui/mdc/enums/BaseType")).default;
		// Use the exact OData type to check if the value is already in model format (wire format).
		// ParameterDefaultValue annotations contain OData wire format values (e.g. "2023-11-18" for Edm.Date),
		// so no conversion is needed for string-model types. For boolean/numeric types, the value comes
		// as a string (e.g. from startup URL params) and must be parsed.
		const odataTypeInstance = TypeMap.getDataTypeInstance(parameter.type);
		let isAlreadyModelFormat: boolean;
		try {
			odataTypeInstance.validateValue(value);
			isAlreadyModelFormat = true;
		} catch {
			isAlreadyModelFormat = false;
		}
		if (isAlreadyModelFormat) {
			return value;
		}
		const fallbackType = TypeMap.getBaseType(parameter.type) === BaseType.Boolean ? "Boolean" : parameter.type;
		return TypeMap.getDataTypeInstance(fallbackType).parseValue(value, "string");
	}
}
