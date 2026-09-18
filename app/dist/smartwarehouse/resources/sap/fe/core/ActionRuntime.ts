import type { ActionParameter as EdmActionParameter, PrimitiveType } from "@sap-ux/vocabularies-types";
import merge from "sap/base/util/merge";
import type { PathInModelExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, constant, equal, transformRecursively } from "sap/fe/base/BindingToolkit";
import type { FEView } from "sap/fe/core/BaseController";
import type { _RequestedProperty } from "sap/fe/core/CommonUtils";
import CommonUtils from "sap/fe/core/CommonUtils";
import type ResourceModel from "sap/fe/core/ResourceModel";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { isEntitySet } from "sap/fe/core/helpers/TypeGuards";
import type TableAPI from "sap/fe/macros/Table";
import type Label from "sap/m/Label";
import type Event from "sap/ui/base/Event";
import type CustomData from "sap/ui/core/CustomData";
import Messaging from "sap/ui/core/Messaging";
import Message from "sap/ui/core/message/Message";
import MessageType from "sap/ui/core/message/MessageType";
import type View from "sap/ui/core/mvc/View";
import type Field from "sap/ui/mdc/Field";
import type MultiValueField from "sap/ui/mdc/MultiValueField";
import type Table from "sap/ui/mdc/Table";
import type MultiValueFieldItem from "sap/ui/mdc/field/MultiValueFieldItem";
import type PropertyBinding from "sap/ui/model/PropertyBinding";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type FileUploader from "sap/ui/unified/FileUploader";
import AnyElement from "./controls/AnyElement";
import ConverterContext from "./converters/ConverterContext";
import type { BaseManifestSettings } from "./converters/ManifestSettings";
import { getEditButtonEnabled, getHiddenExpression } from "./converters/objectPage/HeaderAndFooterAction";

export type ActionParameterInfo = {
	parameter?: EdmActionParameter;
	field: Field | MultiValueField | FileUploader;
	isMultiValue: boolean;
	value?: string | MultiValueFieldItem[] | Record<string, string>;
	validationPromise?: Promise<string | MultiValueFieldItem[]>;
	hasError: boolean;
	propertyPath?: string;
};

/**
 * Initializes the properties of a table action in the internal model context.
 * @param internalModelContext The internal model context where the action properties are set.
 * @param action The name of the action for which properties are initialized.
 * @param forContextMenu Indicates if the action is for a context menu.
 */
function initializeTableActionProperties(internalModelContext: InternalModelContext, action: string, forContextMenu: boolean): void {
	internalModelContext.setProperty(`dynamicActions/${action}/aApplicable`, []);
	internalModelContext.setProperty(`dynamicActions/${action}/aNotApplicable`, []);
	if (forContextMenu) {
		internalModelContext.setProperty(`dynamicActions/${action}/bEnabledForContextMenu`, false);
	} else {
		internalModelContext.setProperty(`dynamicActions/${action}/bEnabled`, false);
	}
}

/**
 * Handles the case when no contexts are selected for an action.
 * @param internalModelContext The internal model context where the action properties are set.
 * @param action The name of the action for which properties are initialized.
 * @param promises An array of promises to be resolved after setting the action properties.
 * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar.
 */
function handleNoSelectedContexts(
	internalModelContext: InternalModelContext,
	action: string,
	promises: Promise<void[]>[],
	forContextMenu: boolean
): void {
	internalModelContext.setProperty(`dynamicActions/${action}`, {
		bEnabled: false,
		aApplicable: [],
		aNotApplicable: []
	});
	promises.push(CommonUtils.setContextsBasedOnOperationAvailable(internalModelContext, [], forContextMenu).then(() => []));
}

/**
 * Handles the case when contexts are selected for an action.
 * @param internalModelContext The internal model context where the action properties are set.
 * @param requestPromises An array of promises to be resolved after setting the action properties.
 * @param promises	An array of promises to be resolved after setting the action properties.
 * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar.
 */
function handleSelectedContexts(
	internalModelContext: InternalModelContext,
	requestPromises: Promise<_RequestedProperty>[],
	promises: Promise<void[]>[],
	forContextMenu: boolean
): void {
	promises.push(CommonUtils.setContextsBasedOnOperationAvailable(internalModelContext, requestPromises, forContextMenu).then(() => []));
}

/**
 * Handles the action enablement for table contexts.
 * @param selectedContexts  Selected contexts for the action.
 * @param internalModelContext 	Internal model context where the action properties are set.
 * @param action Name of the action for which properties are initialized.
 * @param property Property to be checked for the action.
 * @param requestPromises Promises to be resolved after setting the action properties.
 * @param forContextMenu True if the action appears in the context menu, false if it appears in the table toolbar.
 * @param promises P‚romises to be resolved after setting the action properties.
 */
function handleTableContexts(
	selectedContexts: Context[],
	internalModelContext: InternalModelContext,
	action: string,
	property: string,
	requestPromises: Promise<_RequestedProperty>[],
	forContextMenu: boolean,
	promises: Promise<void[]>[]
): void {
	if (!selectedContexts.length) {
		handleNoSelectedContexts(internalModelContext, action, promises, forContextMenu);
	} else if (selectedContexts.length && typeof property === "string") {
		handleSelectedContexts(internalModelContext, requestPromises, promises, forContextMenu);
	}
}

const ActionRuntime = {
	/**
	 * Checks if a required parameter field is empty.
	 * @param parameterInfo Information identifying an action parameter
	 * @returns True if the field is empty, false otherwise
	 */
	isRequiredFieldEmpty: function (parameterInfo: ActionParameterInfo): boolean {
		const fieldId = parameterInfo.field.getId();
		const allMessages = Messaging.getMessageModel().getData();
		const relevantMessages = allMessages.filter((msg: Message) =>
			msg.getControlIds().some((controlId: string) => controlId.includes(fieldId))
		);
		if (relevantMessages.length > 0) {
			return false;
		} else if (parameterInfo.isMultiValue) {
			const items = (parameterInfo.field as MultiValueField).getItems();
			return items === undefined || (Array.isArray(items) && items.length === 0);
		} else {
			const fieldValue = (parameterInfo.field as Field).getValue();
			const isFieldArray = Array.isArray((parameterInfo.field as Field).getValue());
			if (isFieldArray) {
				// only first value check is enough as the field value comes on [0] rest of the array includes currency and currency code
				// both of which can or cannot be null, so we shall check only the field value
				return fieldValue[0] === null || fieldValue[0] === "";
			}
			return fieldValue === undefined || fieldValue === null || fieldValue === "";
		}
	},
	/**
	 * Adds error messages for an action parameter field to the message manager.
	 * @param messageParameters Information identifying an action parameter and messages referring to this parameter
	 */
	_addMessageForActionParameter: function (messageParameters: { actionParameterInfo: ActionParameterInfo; message: string }[]): void {
		const messages: Message[] = [];
		messageParameters.forEach((messageParameter) => {
			const binding = messageParameter.actionParameterInfo.field.getBinding(
				messageParameter.actionParameterInfo.isMultiValue ? "items" : "value"
			);
			if (messageParameter.actionParameterInfo.isMultiValue) {
				return this.manageMessageOnMultiValueField(messageParameter);
			}

			const message = new Message({
				message: messageParameter.message,
				type: MessageType.Error,
				processor: binding?.getModel() ?? undefined, // getModel(): null | Model ~~> processor?: MessageProcessor
				persistent: true,
				target: binding?.getResolvedPath()
			});

			// Attach change handler to validate value and remove message if field is not empty
			if (binding) {
				const changeHandler = (): void => {
					// Check if the field is no longer empty using the extracted validation function
					if (!ActionRuntime.isRequiredFieldEmpty(messageParameter.actionParameterInfo)) {
						// Remove the message
						Messaging.removeMessages([message]);
						// Detach the change handler
						binding.detachChange(changeHandler);
					}
				};
				// There might be sceanrios like value help out parameters where the field is not explicitly changed instead property value changes due to setProperty.
				// In such cases, field change is not called and is not a reliable event to validate the field value again.
				// So we use value/items binding change to re-validate the property value to remove the messages.
				binding.attachChange(changeHandler);
			}

			// If the field's required constraint is dynamic (e.g. driven by FieldControl), also watch the
			// required binding. When another field's change removes the required constraint from this field,
			// the value-binding changeHandler above never fires (the value is still empty and unchanged).
			// Without this handler the persistent "required field" message would remain, keeping valueState
			// as "Error" and blocking the action even though the field is no longer mandatory.
			const requiredBinding = messageParameter.actionParameterInfo.field.getBinding("required");
			if (requiredBinding) {
				const requiredChangeHandler = (): void => {
					if (!(messageParameter.actionParameterInfo.field as Field).getRequired()) {
						Messaging.removeMessages([message]);
						requiredBinding.detachChange(requiredChangeHandler);
					}
				};
				requiredBinding.attachChange(requiredChangeHandler);
			}

			messages.push(message);
		});

		Messaging.addMessages(messages);
	},

	_addMessageForActionParameterFiles: function (
		messageParameters: { actionParameterInfo: ActionParameterInfo; message: string }[]
	): void {
		messageParameters.forEach((messageParameter) => {
			messageParameter.actionParameterInfo.field.setValueState("Error");
			messageParameter.actionParameterInfo.field.setValueStateText(messageParameter.message);
		});
	},

	/**
	 * Manages the message state on multi value fields.
	 * @param messageParameter
	 * @param messageParameter.actionParameterInfo
	 * @param messageParameter.message
	 */
	manageMessageOnMultiValueField: function (messageParameter: { actionParameterInfo: ActionParameterInfo; message: string }): void {
		const binding = messageParameter.actionParameterInfo.field.getBinding("items");
		messageParameter.actionParameterInfo.field.setValueState("Error");
		messageParameter.actionParameterInfo.field.setValueStateText(messageParameter.message);
		if (binding) {
			const changeHandler = (): void => {
				// Check if the field is no longer empty using the extracted validation function
				if (!ActionRuntime.isRequiredFieldEmpty(messageParameter.actionParameterInfo)) {
					// Remove the ERROR state
					messageParameter.actionParameterInfo.field.setValueState("None");
					messageParameter.actionParameterInfo.field.setValueStateText("");
					// Detach the change handler
					binding.detachChange(changeHandler);
				}
			};

			binding.attachChange(changeHandler);
		}
		return;
	},

	/**
	 * Checks if all required action parameters contain data and checks for all action parameters if the
	 * contained data is valid.
	 * @param actionParameterInfos Information identifying an action parameter
	 * @param resourceModel The model to load text resources
	 * @returns The validation result can be true or false
	 */
	validateProperties: async function (actionParameterInfos: ActionParameterInfo[], resourceModel: ResourceModel): Promise<boolean> {
		await Promise.allSettled(
			actionParameterInfos
				.map((actionParameterInfo): Promise<string | MultiValueFieldItem[]> | undefined => actionParameterInfo.validationPromise)
				.filter((promise): promise is Promise<string | MultiValueFieldItem[]> => promise !== undefined)
		);

		const requiredParameterInfos = actionParameterInfos.filter(
			(parameterInfo) =>
				(parameterInfo.field as Field | MultiValueField).getRequired &&
				(parameterInfo.field as Field | MultiValueField).getRequired()
		);

		const emptyRequiredFields = requiredParameterInfos.filter(this.isRequiredFieldEmpty);
		/* Message for missing mandatory value of the action parameter */
		if (emptyRequiredFields.length) {
			this._addMessageForActionParameter(
				emptyRequiredFields.map((actionParameterInfo) => ({
					actionParameterInfo: actionParameterInfo,
					message: resourceModel.getText("C_OPERATIONS_ACTION_PARAMETER_DIALOG_MISSING_MANDATORY_MSG", [
						(actionParameterInfo.field.getParent()?.getAggregation("label") as Label).getText()
					])
				}))
			);
		}
		//Check the parameters that are of type file
		const requiredFileParameterInfos = actionParameterInfos.filter(
			(parameterInfo) =>
				parameterInfo.field.getCustomData &&
				parameterInfo.field.getCustomData() &&
				parameterInfo.field
					.getCustomData()
					.find((customData: CustomData) => customData.getKey() === "isRequired")
					?.getValue() === "true"
		);
		// Message for missing mandatory file upload of the action parameter
		const emptyRequiredFileFields = requiredFileParameterInfos.filter(this.isRequiredFieldEmpty);

		if (emptyRequiredFileFields.length) {
			this._addMessageForActionParameterFiles(
				emptyRequiredFileFields.map((actionParameterInfo) => ({
					actionParameterInfo: actionParameterInfo,
					message: resourceModel.getText("C_OPERATIONS_ACTION_PARAMETER_DIALOG_FILE_MISSING_MANDATORY_MSG", [
						(actionParameterInfo.field.getParent()?.getAggregation("label") as Label).getText()
					])
				}))
			);
		}

		/* Check value state of all parameters */
		const firstInvalidParameter = actionParameterInfos.find(
			(parameterInfo) =>
				parameterInfo.field.getVisible() &&
				(parameterInfo.hasError || parameterInfo.field.getValueState() === "Error" || emptyRequiredFields.includes(parameterInfo))
		);
		if (firstInvalidParameter) {
			firstInvalidParameter.field.setVisible(true);
			firstInvalidParameter.field.focus();
			return false;
		} else {
			return true;
		}
	},

	/**
	 * Sets the action enablement.
	 * @param oInternalModelContext Object containing the context model
	 * @param oActionOperationAvailableMap Map containing the operation availability of actions
	 * @param aSelectedContexts Array containing selected contexts of the chart
	 * @param sControl Control name
	 * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
	 * @param skipSelectionRefresh If true, skips the refresh of the selection in the internal model context
	 * @returns The action enablement promises
	 */
	setActionEnablement: async function (
		oInternalModelContext: InternalModelContext,
		oActionOperationAvailableMap: Record<string, string>,
		aSelectedContexts: Context[],
		sControl: string,
		forContextMenu = false,
		skipSelectionRefresh = false
	): Promise<void[]> {
		const aPromises: Promise<void[]>[] = [];
		for (const sAction in oActionOperationAvailableMap) {
			let aRequestPromises: Promise<_RequestedProperty>[] = [];
			oInternalModelContext.setProperty(sAction, false);
			if (sControl === "table") {
				initializeTableActionProperties(oInternalModelContext, sAction, forContextMenu);
			}
			const sProperty = oActionOperationAvailableMap[sAction];
			for (const selectedContext of aSelectedContexts) {
				if (selectedContext) {
					const oContextData = selectedContext.getObject() as Record<string, unknown>;
					if (sControl === "chart") {
						if ((sProperty === null && !!oContextData[`#${sAction}`]) || selectedContext.getObject(sProperty)) {
							//look for action advertisement if present and its value is not null
							oInternalModelContext.setProperty(sAction, true);
							break;
						}
					} else if (sControl === "table") {
						aRequestPromises = this._setActionEnablementForTable(
							selectedContext,
							oInternalModelContext,
							sAction,
							sProperty,
							aRequestPromises,
							forContextMenu
						);
					}
				}
			}

			if (sControl === "table") {
				handleTableContexts(
					aSelectedContexts,
					oInternalModelContext,
					sAction,
					sProperty,
					aRequestPromises,
					forContextMenu,
					aPromises
				);
			}
		}

		if (!skipSelectionRefresh && aSelectedContexts.length > 0) {
			// trigger an explicit refresh of the selected context to update
			// also the contexts in case of custom actions
			const selectedContexts = oInternalModelContext.getProperty("selectedContexts") || [];
			oInternalModelContext.setProperty("selectedContexts", []);
			oInternalModelContext.setProperty("selectedContexts", selectedContexts);
		}

		return Promise.all(aPromises).then((results) => results.flat());
	},
	setActionEnablementAfterPatch: function (
		oView: View,
		oListBinding: ODataListBinding,
		oInternalModelContext: InternalModelContext
	): void {
		const oInternalModelContextData = oInternalModelContext?.getObject() as Record<string, unknown>;
		const oControls = (oInternalModelContextData?.controls || {}) as Record<string, { controlId?: string }>;
		for (const sKey in oControls) {
			if (oControls[sKey] && oControls[sKey].controlId) {
				const oTable = oView.byId(sKey);
				if (oTable && oTable.isA<Table>("sap.ui.mdc.Table")) {
					const oRowBinding = oTable.getRowBinding();
					if (oRowBinding == oListBinding) {
						const tableAPI = oTable.getParent() as TableAPI;
						ActionRuntime.setActionEnablement(
							oTable.getBindingContext("internal") as InternalModelContext,
							JSON.parse(tableAPI.tableDefinition.operationAvailableMap),
							oTable.getSelectedContexts() as Context[],
							"table"
						);
					}
				}
			}
		}
	},

	updateEditButtonVisibilityAndEnablement(oView: FEView): void {
		const iViewLevel = (oView.getViewData() as BaseManifestSettings)?.viewLevel,
			isEditable = CommonUtils.getIsEditable(oView);
		if ((iViewLevel as number) > 1 && isEditable !== true) {
			const oContext = oView.getBindingContext();
			const oAppComponent = CommonUtils.getAppComponent(oView);
			const sMetaPath = ModelHelper.getMetaPathForContext(oContext);
			const sEntitySet = ModelHelper.getRootEntitySetPath(sMetaPath);
			const metaContext = oContext
				?.getModel()
				.getMetaModel()
				?.getContext(oContext?.getPath());
			const converterContext = ConverterContext?.createConverterContextForMacro(
				sEntitySet,
				metaContext,
				oAppComponent.getDiagnostics(),
				merge
			);
			const entitySet = converterContext.getEntitySet();
			const entityType = converterContext.getEntityType();
			let updateHidden;
			//Find the Update Hidden of the root entity set and bind the property to AnyElement, any changes in the path of the root UpdateHidden will be updated via the property, internal model context is updated based on the property
			const bUpdateHidden = isEntitySet(entitySet) && entitySet.annotations.UI?.UpdateHidden?.valueOf();
			if (bUpdateHidden !== true) {
				updateHidden = ModelHelper.isUpdateHidden(entitySet, entityType);
			}
			//Find the operation available property of the root edit configuration and fetch the property using AnyElement
			const sEditEnableBinding = getEditButtonEnabled(converterContext);
			const draftRootPath = ModelHelper.getDraftRootPath(oContext);
			const sStickyRootPath = ModelHelper.getStickyRootPath(oContext);
			const sPath = draftRootPath || sStickyRootPath;
			const oInternalModelContext = oView.getBindingContext("internal") as InternalModelContext;
			if (sPath) {
				const oRootContext = oView.getModel().bindContext(sPath).getBoundContext();
				if (updateHidden !== undefined) {
					const sHiddenExpression = compileExpression(equal(getHiddenExpression(converterContext, updateHidden), false));
					this.updateEditModelContext(sHiddenExpression, oView, oRootContext, "rootEditVisible", oInternalModelContext);
				}
				if (sEditEnableBinding) {
					this.updateEditModelContext(sEditEnableBinding, oView, oRootContext, "rootEditEnabled", oInternalModelContext);
				}
			}
		}
	},

	updateEditModelContext: function (
		sBindingExpression: string | undefined,
		oView: View,
		oRootContext: Context,
		sProperty: string,
		oInternalModelContext: InternalModelContext
	): void {
		if (sBindingExpression) {
			const oHiddenElement = new AnyElement({ anyText: sBindingExpression });
			oHiddenElement.setBindingContext(null);
			oView.addDependent(oHiddenElement);
			oHiddenElement.getBinding("anyText");
			const oContext = oHiddenElement
				.getModel()
				?.bindContext(oRootContext.getPath(), oRootContext, { $$groupId: "$auto.Heroes" })
				?.getBoundContext();
			oHiddenElement.setBindingContext(oContext);
			oHiddenElement?.getBinding("anyText")?.attachChange((oEvent: Event<{}, PropertyBinding>) => {
				const oNewValue = oEvent.getSource().getExternalValue();
				oInternalModelContext.setProperty(sProperty, oNewValue);
			});
		}
	},

	_setActionEnablementForTable: function (
		oSelectedContext: Context | undefined,
		oInternalModelContext: InternalModelContext,
		sAction: string,
		sProperty: string,
		aRequestPromises: Promise<_RequestedProperty>[],
		forContextMenu = false
	): Promise<_RequestedProperty>[] {
		// Retrieve previously checked contexts in case of !forContextMenu
		const sEnablementFieldName = forContextMenu ? "bEnabledForContextMenu" : "bEnabled",
			aApplicable: [Context | undefined] = oInternalModelContext.getProperty(`dynamicActions/${sAction}/aApplicable`) || [],
			aNotApplicable: [Context | undefined] = oInternalModelContext.getProperty(`dynamicActions/${sAction}/aNotApplicable`) || [];
		let bActionEnabled: boolean = oInternalModelContext.getProperty(`dynamicActions/${sAction}/${sEnablementFieldName}`) || false;

		if (!forContextMenu) {
			oInternalModelContext.setProperty(`dynamicActions/${sAction}`, {
				bEnabled: false,
				aApplicable: [],
				aNotApplicable: []
			});
		} else {
			oInternalModelContext.setProperty(`dynamicActions/${sAction}`, {
				// Do not change enabled, aApplicable and aNotApplicable property in case of context menu calculation
				// in case of context menu, only the clicked context goes into the processing - other selected contexts must be kept in the model
				bEnabled: oInternalModelContext.getProperty(`dynamicActions/${sAction}/bEnabled`),
				aApplicable: oInternalModelContext.getProperty(`dynamicActions/${sAction}/aApplicable`),
				aNotApplicable: oInternalModelContext.getProperty(`dynamicActions/${sAction}/aNotApplicable`),
				bEnabledForContextMenu: false,
				aApplicableForContextMenu: [],
				aNotApplicableForContextMenu: []
			});
		}
		// Note that non dynamic actions are not processed here. They are enabled because
		// one or more are selected and the second part of the condition in the templating
		// is then undefined and thus the button takes the default enabling, which is true!
		const sDynamicActionEnabledPath = `${oInternalModelContext.getPath()}/dynamicActions/${sAction}/${sEnablementFieldName}`;

		if (typeof sProperty === "object" && sProperty !== null && sProperty !== undefined) {
			if (oSelectedContext) {
				const oContextData = oSelectedContext.getObject() as Record<string, PrimitiveType>;
				const oTransformedBinding = transformRecursively(
					sProperty,
					"PathInModel",
					// eslint-disable-next-line no-loop-func
					function (oBindingExpression: PathInModelExpression<PrimitiveType>) {
						return oContextData ? constant(oContextData[oBindingExpression.path]) : constant(false);
					},
					true
				);
				const sResult = compileExpression(oTransformedBinding);
				bActionEnabled = bActionEnabled || sResult === "true";
				oInternalModelContext.getModel().setProperty(sDynamicActionEnabledPath, bActionEnabled);
				(sResult === "true" ? aApplicable : aNotApplicable).push(oSelectedContext);
			}
			CommonUtils.setDynamicActionContexts(oInternalModelContext, sAction, aApplicable, aNotApplicable, forContextMenu);
		} else {
			const oContextData = oSelectedContext?.getObject() as Record<string, PrimitiveType>;
			if (sProperty === null && !!oContextData[`#${sAction}`]) {
				//look for action advertisement if present and its value is not null
				oInternalModelContext.getModel().setProperty(sDynamicActionEnabledPath, true);
			} else if (oSelectedContext !== undefined) {
				// Collect promises to retrieve singleton or normal property value asynchronously
				aRequestPromises.push(CommonUtils.requestProperty(oSelectedContext, sAction, sProperty, sDynamicActionEnabledPath));
			}
		}
		return aRequestPromises;
	}
};
export default ActionRuntime;
