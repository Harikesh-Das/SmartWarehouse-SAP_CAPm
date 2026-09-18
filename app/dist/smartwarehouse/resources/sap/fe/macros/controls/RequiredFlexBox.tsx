import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import BuildingBlockBase from "sap/fe/base/BuildingBlockBase";
import { defineUI5Class, implementInterface, property } from "sap/fe/base/ClassSupport";
import CommonUtils from "sap/fe/core/CommonUtils";
import type Field from "sap/fe/macros/Field";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import Messaging from "sap/ui/core/Messaging";
import type Message from "sap/ui/core/message/Message";
import MessageType from "sap/ui/core/message/MessageType";
import type FormContainer from "sap/ui/layout/form/FormContainer";
import type FormElement from "sap/ui/layout/form/FormElement";
import type PropertyBinding from "sap/ui/model/PropertyBinding";
import type JSONModel from "sap/ui/model/json/JSONModel";

/**
 * Building block to wrap a FlexBox and expose a required property.
 * Handles error display for checkbox field groups by listening to message model changes.
 * @private
 */
@defineUI5Class("sap.fe.macros.controls.RequiredFlexBox")
export default class RequiredFlexBox extends BuildingBlockBase<Control> {
	@implementInterface("sap.ui.core.IFormContent")
	__implements__sap_ui_core_IFormContent = true;

	@property({ type: "string" })
	id?: string;

	@property({ type: "boolean" })
	required?: boolean | CompiledBindingToolkitExpression;

	@property({ type: "string" })
	fieldGroupName?: string;

	private _messageBinding?: PropertyBinding;

	private _initialized = false;

	onBeforeRendering(): void {
		// Initialize error handling once, ensuring parent hierarchy is established
		if (!this._initialized && this.fieldGroupName) {
			this.initializeErrorHandling();
			this._initialized = true;
		}
	}

	private initializeErrorHandling(): void {
		const messageModel = Messaging.getMessageModel();
		this._messageBinding = messageModel.bindProperty("/");

		const messageChangeHandler = (): void => {
			this.handleFieldGroupErrors();
		};

		this._messageBinding.attachChange(messageChangeHandler);
		this.handleFieldGroupErrors(); // Initial check
	}

	private handleFieldGroupErrors(): void {
		// Navigate to FormContainer via parent hierarchy
		const formElement = this.getParent() as FormElement | undefined;
		if (!formElement?.isA?.("sap.ui.layout.form.FormElement")) {
			return;
		}

		const formContainer = formElement.getParent() as FormContainer | undefined;
		if (!formContainer?.isA?.("sap.ui.layout.form.FormContainer")) {
			return;
		}

		// Get dependencies
		const view = CommonUtils.getTargetView(this);
		const controller = view?.getController();
		if (!controller) {
			return;
		}

		const internalModel = CommonUtils.getAppComponent(this)?.getModel("internal") as JSONModel;
		if (!internalModel || !this.fieldGroupName) {
			return;
		}

		// Build map and process errors
		const messages = Messaging.getMessageModel().getData() as Message[];
		const fieldGroupMap = RequiredFlexBox.buildFieldGroupMap(formContainer);
		const booleanPaths = fieldGroupMap.get(this.fieldGroupName);

		// Clear error state
		RequiredFlexBox.setFieldGroupState(internalModel, this.fieldGroupName, "None", "");

		// Check if all booleans in this field group are in error
		if (booleanPaths) {
			messages.forEach((msg) => {
				if (msg.getType() === MessageType.Error) {
					const messageTargets = msg.getTargets();
					const allBooleansInError = Array.from(booleanPaths).every((boolPath) =>
						messageTargets.some((target) => target.includes(`/${boolPath}`))
					);

					if (allBooleansInError && this.fieldGroupName) {
						RequiredFlexBox.setFieldGroupState(internalModel, this.fieldGroupName, "Error", msg.getMessage());
					}
				}
			});
		}
	}

	override destroy(): void {
		if (this._messageBinding) {
			this._messageBinding.destroy();
			this._messageBinding = undefined;
		}
		super.destroy();
	}

	/**
	 * Sets the value state for a field group in the internal model.
	 * @param internalModel The internal JSON model
	 * @param fieldGroupName The field group name
	 * @param valueState The value state to set (e.g., "None", "Error")
	 * @param valueStateText The value state text message
	 */
	static setFieldGroupState(internalModel: JSONModel, fieldGroupName: string, valueState: string, valueStateText: string): void {
		internalModel.setProperty(`/${fieldGroupName}/valueState`, valueState);
		internalModel.setProperty(`/${fieldGroupName}/valueStateText`, valueStateText);
	}

	/**
	 * Extracts the property path from a Field control.
	 * @param field The Field control
	 * @returns The property path or undefined if not found
	 */
	static getPropertyPathFromField(field: Field): string | undefined {
		const metaPath = field.metaPath;
		const metaModel = field.getBindingContext()?.getModel()?.getMetaModel();
		const metaContext = metaModel?.createBindingContext(metaPath);
		const dataField = metaContext?.getObject();
		return dataField?.Value?.$Path || dataField?.Value?.path;
	}

	/**
	 * Extracts the field group name from a Field control by traversing up to the FormElement parent.
	 * @param field The Field control
	 * @returns The field group name or undefined if not found
	 */
	static getFieldGroupNameFromField(field: Field): string | undefined {
		let parent: ManagedObject | null = field.getParent();
		while (parent && !parent.isA("sap.ui.layout.form.FormElement")) {
			parent = (parent as ManagedObject).getParent();
		}
		if (parent) {
			const formElement = parent as FormElement;
			const customData = formElement.getCustomData().find((cd) => cd.getKey() === "fieldGroupName");
			return customData?.getValue() as string | undefined;
		}
		return undefined;
	}

	/**
	 * Builds a map of field group names to their associated property paths.
	 * @param formContainer The FormContainer control
	 * @returns A Map where keys are field group names and values are Sets of property paths
	 */
	static buildFieldGroupMap(formContainer: FormContainer): Map<string, Set<string>> {
		const fieldGroupMap = new Map<string, Set<string>>();

		const allFields = formContainer.findAggregatedObjects(true, (control) => {
			return control.isA("sap.fe.macros.Field");
		});

		allFields.forEach((control) => {
			const field = control as Field;
			const formatOptions = field.formatOptions;

			if (formatOptions?.isFieldGroupItem === true) {
				const propertyPath = RequiredFlexBox.getPropertyPathFromField(field);
				const fieldGroupName = RequiredFlexBox.getFieldGroupNameFromField(field);

				if (propertyPath && fieldGroupName) {
					if (!fieldGroupMap.has(fieldGroupName)) {
						fieldGroupMap.set(fieldGroupName, new Set());
					}
					fieldGroupMap.get(fieldGroupName)!.add(propertyPath);
				}
			}
		});

		return fieldGroupMap;
	}
}
