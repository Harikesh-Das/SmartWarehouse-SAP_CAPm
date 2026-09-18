import type { Property } from "@sap-ux/vocabularies-types";
import { CommonAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/Common";
import Log from "sap/base/Log";
import CommonUtils from "sap/fe/core/CommonUtils";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import { isPathAnnotationExpression } from "sap/fe/core/helpers/TypeGuards";
import FETypeMap from "sap/fe/macros/field/FETypeMap";
import type { AnnotationValueListType, ValueHelpPayload } from "sap/fe/macros/internal/valuehelp/ValueListHelper";
import Component from "sap/ui/core/Component";
import type Control from "sap/ui/core/Control";
import Element from "sap/ui/core/Element";
import type Field from "sap/ui/mdc/Field";
import type ValueHelp from "sap/ui/mdc/ValueHelp";
import type { ItemForValueConfiguration } from "sap/ui/mdc/ValueHelp";
import { type ConditionObject } from "sap/ui/mdc/condition/Condition";
import type ConditionModel from "sap/ui/mdc/condition/ConditionModel";
import type FieldBase from "sap/ui/mdc/field/FieldBase";
import FieldBaseDelegate from "sap/ui/mdc/field/FieldBaseDelegate";
import StateUtil from "sap/ui/mdc/p13n/StateUtil";
import Filter from "sap/ui/model/Filter";
import type SimpleType from "sap/ui/model/SimpleType";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import CommonHelper from "../CommonHelper";
import type FilterBarAPI from "../FilterBar";
import type FilterBar from "../controls/FilterBar";
import type { ConditionPayloadMap, ConditionPayloadType, ExternalStateType } from "../valuehelp/ValueHelpDelegate";
import ValueHelpDelegate from "../valuehelp/ValueHelpDelegate";

export type FieldPayload = {
	retrieveTextFromValueList?: boolean;
	isFilterField?: boolean;
};

export type Value = string | Date | number | boolean | undefined | null;

export type TypeInitialization = {
	bTypeInitialized?: boolean;
	mCustomUnits?: string;
};

export type Config = {
	value: Value;
	parsedValue: Value;
	bindingContext: Context;
	checkKey: boolean;
	checkDescription: boolean;
	conditionModel?: ConditionModel;
	conditionModelName?: string;
	control?: object;
};

export default Object.assign({}, FieldBaseDelegate, {
	apiVersion: 2,

	/**
	 * If the <code>Field</code> control is used, the used data type might come from the binding.
	 * In V4-unit or currency case it might need to be formatted once.
	 * To initialize the internal type later on, the currencies must be returned.
	 * @param field The <code>Field</code> instance
	 * @param type Type from binding
	 * @param value Given value
	 * @returns Information needed to initialize internal type (needs to set bTypeInitialized to true if initialized)
	 */
	initializeTypeFromBinding: function (field: Field, type: SimpleType | undefined, value: Value | Value[]) {
		// V4 Unit and Currency types have a map with valid units and create an internal customizing for it.
		// The Field needs to keep this customizing logic when creating the internal type.
		// (As external RAW binding is used there is no formatting on parsing.)

		const result: TypeInitialization = {};
		if (
			type &&
			type.isA(["sap.ui.model.odata.type.Unit", "sap.ui.model.odata.type.Currency", "sap.fe.core.type.DynamicCurrency"]) &&
			Array.isArray(value) &&
			value.length > 2 &&
			value[2] !== undefined
		) {
			// format once to set internal customizing. Allow null as valid values for custom units
			type.formatValue(value, "string");
			result.bTypeInitialized = true;
			result.mCustomUnits = value[2] as string; // TODO: find a better way to provide custom units to internal type
		}

		return result;
	},

	/**
	 * This function initializes the unit type.
	 * If the <code>Field</code> control is used, the used data type might come from the binding.
	 * If the type is a V4 unit or currency, it might need to be formatted once.
	 * @param field The <code>Field</code> instance
	 * @param type Type from binding
	 * @param typeInitialization Information needed to initialize internal type
	 */
	initializeInternalUnitType: function (field: Field, type: SimpleType, typeInitialization?: TypeInitialization) {
		if (typeInitialization?.mCustomUnits !== undefined) {
			// if already initialized initialize new type too.
			type.formatValue([null, null, typeInitialization.mCustomUnits], "string");
		}
	},

	/**
	 * This function enhances the value with unit or currency information if needed by the data type.
	 * @param field The <code>Field</code> instance
	 * @param  values Values
	 * @param  typeInitialization Information needed to initialize internal type
	 * @returns Values
	 */
	enhanceValueForUnit: function (field: Field, values: Value[], typeInitialization?: TypeInitialization) {
		if (typeInitialization?.bTypeInitialized === true && values.length === 2) {
			values.push(typeInitialization.mCustomUnits);
			return values;
		}

		return undefined;
	},

	/**
	 * This function returns which <code>ValueHelpDelegate</code> is used
	 * if a default field help (for example, for defining conditions in </code>FilterField</code>)
	 * is created.
	 * @param _field The <code>Field</code> instance
	 * @returns Delegate object with name and payload
	 */
	getDefaultValueHelpDelegate: function (_field: Field) {
		return { name: "sap/ui/mdc/odata/v4/ValueHelpDelegate", payload: {} };
	},

	getTypeMap: function (_field: Field) {
		return FETypeMap;
	},

	/**
	 * Determine all parameters in a value help that use a specific property.
	 * @param valueListInfo Value list info
	 * @param propertyName Name of the property
	 * @returns List of all found parameters
	 */
	_getValueListParameter: function (valueListInfo: AnnotationValueListType, propertyName: string) {
		//determine path to value list property
		return valueListInfo.Parameters.filter(function (entry) {
			if (entry.LocalDataProperty) {
				return entry.LocalDataProperty.$PropertyPath === propertyName;
			} else {
				return false;
			}
		});
	},

	/**
	 * Queries a value list with filters and returns up to 2 matching contexts.
	 * Requesting 2 contexts allows callers to distinguish between no matches (length === 0),
	 * exactly one match (length === 1), or multiple matches (length === 2).
	 * @param valueListModel The value list model
	 * @param collectionPath The collection path
	 * @param filters The filters to apply
	 * @param selectProperties The properties to select (can be comma-separated string)
	 * @returns Array of matching contexts (0-2 items)
	 */
	_queryValueListContexts: async function (
		valueListModel: ODataModel,
		collectionPath: string,
		filters: Filter[],
		selectProperties: string
	): Promise<Context[]> {
		const listBinding = valueListModel.bindList(`/${collectionPath}`, undefined, undefined, filters, {
			$select: selectProperties
		});
		return listBinding.requestContexts(0, 2);
	},

	/**
	 * Build filters for each relevant parameter.
	 * @param valueList Value list info
	 * @param propertyName Name of the property
	 * @param valueHelpProperty Name of the value help property
	 * @param keyValue Value of the property
	 * @param valuehelpPayload Payload of the value help
	 * @param valuehelpConditionPayload Additional condition information for this key
	 * @param bindingContext BindingContext of the field
	 * @returns List of filters
	 */
	_getFilter: function (
		valueList: AnnotationValueListType,
		propertyName: string,
		valueHelpProperty: string,
		keyValue: string,
		valuehelpPayload: ValueHelpPayload,
		valuehelpConditionPayload: ConditionPayloadType[] | undefined,
		bindingContext?: Context,
		filterBarConditions?: Record<string, ConditionObject[]>
	) {
		let filters: Filter[] = [];
		const processedValueListProperties = new Set<string>();
		const parameters = valueList.Parameters.filter(function (parameter) {
			return (
				parameter.$Type === CommonAnnotationTypes.ValueListParameterIn ||
				parameter.$Type === CommonAnnotationTypes.ValueListParameterInOut ||
				(parameter.LocalDataProperty?.$PropertyPath === propertyName && parameter.ValueListProperty === valueHelpProperty)
			);
		});
		for (const parameter of parameters) {
			let filterValue;
			if (parameter.LocalDataProperty?.$PropertyPath === propertyName) {
				filterValue = keyValue;
			} else if (valuehelpPayload?.isActionParameterDialog === true) {
				const apdFieldPath = `APD_::${parameter.LocalDataProperty?.$PropertyPath}`;
				const apdField = Element.getElementById(apdFieldPath) as Field;
				filterValue = apdField?.getValue();
			} else if (valuehelpConditionPayload !== undefined) {
				const sourcePath = parameter.ValueListProperty;
				const conditionPayload = valuehelpConditionPayload?.[0];
				filterValue = sourcePath && conditionPayload?.[sourcePath];
			} else if (bindingContext) {
				// if the value help is not used try getting the filter value from the binding context
				const sourcePath = parameter.LocalDataProperty?.$PropertyPath;
				filterValue = bindingContext.getObject(sourcePath);
			}
			if (!filterValue && filterBarConditions) {
				const condition = filterBarConditions?.[parameter.ValueListProperty];
				if (condition?.length === 1 && condition[0]?.operator === "EQ") {
					filterValue = condition[0]?.values[0];
				}
			}
			/* Add value to the filter for the text determination */
			if (filterValue !== null && filterValue !== undefined) {
				filters.push(new Filter({ path: parameter.ValueListProperty, operator: "EQ", value1: filterValue }));
				if (parameter.ValueListProperty) {
					processedValueListProperties.add(parameter.ValueListProperty);
				}
			}
		}
		if (valuehelpConditionPayload?.[0]) {
			// In case of multiple keys for the valuelist collection, the main ValueListProperty might not be unique to get exact value list selection.
			// So, we add filters for key properties if they are present in the valuehelpConditionPayload.
			filters = filters.concat(
				this._getRemainingKeyValueFilters(valuehelpConditionPayload[0], valueList, processedValueListProperties)
			);
		}
		return filters;
	},

	/**
	 * Get model filters to ensure a precise selection from the condition payload.
	 * @param conditionPayload Additional condition information for this key
	 * @param valueList Value list information
	 * @param processedValueListProperties Set of ValueListProperty names that have already been processed
	 * @returns List of filters
	 */
	_getRemainingKeyValueFilters(
		conditionPayload: ConditionPayloadType,
		valueList: AnnotationValueListType,
		processedValueListProperties: Set<string>
	): Filter[] {
		const { $model: valueListModel, CollectionPath: collectionPath, Parameters: parameters } = valueList;
		const metaContext = valueListModel.getMetaModel().getMetaContext(`/${collectionPath}`);
		const entityType = MetaModelConverter.getInvolvedDataModelObjects(metaContext).targetEntityType;
		const allLocalDataProperties = parameters.reduce((arr, parameter) => {
			if (parameter.LocalDataProperty?.$PropertyPath) {
				arr.push(parameter.LocalDataProperty.$PropertyPath);
			}
			return arr;
		}, [] as string[]);
		const allRemainingKeys = entityType.keys.reduce((arr, { name: keyName }) => {
			if (
				!allLocalDataProperties.includes(keyName) &&
				!processedValueListProperties.has(keyName) &&
				conditionPayload.hasOwnProperty(keyName)
			) {
				arr.push(keyName);
			}
			return arr;
		}, [] as string[]);
		if (allRemainingKeys.length > 0) {
			return allRemainingKeys.reduce((filters: Filter[], key: string): Filter[] => {
				// This is a metamodel operation. The original isPropertyFilterable needs to be converted later.
				const keyContext = valueListModel.getMetaModel().getMetaContext(`/${collectionPath}/${key}`);
				if (CommonHelper.isPropertyFilterable(keyContext, undefined, true)) {
					filters.push(new Filter({ path: key, operator: "EQ", value1: conditionPayload[key] }));
				}
				return filters;
			}, []);
		}
		return [];
	},

	/**
	 * Determines the key, description, and payload of a user input.
	 * @param field The <code>Field</code> instance
	 * @param valueHelp Value help instance
	 * @param config Configuration Object
	 * @returns Object containing description, key, and payload. If it is not available right now (must be requested), a <code>Promise</code> is returned
	 */
	getItemForValue: async function (field: Field, valueHelp: ValueHelp, config: ItemForValueConfiguration) {
		//BCP: 2270162887 . The MDC field should not try to get the item when the field is emptied
		// JIRA: FIORITECHP1-25361 - Improve the type-ahead behavior for missinng text annotation or constraints violations of the existing text annotation
		if (config.value === "") {
			return;
		}
		const payload = valueHelp.getPayload() as ValueHelpPayload;

		// DINC0776072: Handle ExternalID fields
		// When user enters an ExternalID and tabs out quickly, MDC calls getItemForValue with checkKey=true
		// but the entered value is the ExternalID, not the UUID key.
		// We must resolve the ExternalID to UUID and update the binding context directly.
		if (config.checkKey) {
			let externalIdPath = payload?.externalIdPath;

			// Ensure externalIdPath is available in the payload
			// It may not be set if the user typed quickly and the value help dropdown never opened
			// In that case, fetch it directly from the metamodel using annotation converter
			if (!externalIdPath) {
				try {
					const dataModel = field.getModel() as ODataModel | undefined;
					if (dataModel) {
						const metaModel = dataModel.getMetaModel();
						const convertedMetadata = MetaModelConverter.convertTypes(metaModel);
						const resolveResult = convertedMetadata.resolvePath<Property>(payload.propertyPath);
						const propertyDefinition = resolveResult?.target;
						const externalIdAnnotation = propertyDefinition?.annotations?.Common?.ExternalID;
						if (externalIdAnnotation && isPathAnnotationExpression(externalIdAnnotation)) {
							externalIdPath = externalIdAnnotation.path;
						}
					}
				} catch (error) {
					Log.error(`Failed to retrieve ExternalID annotation for property ${payload.propertyPath}: ${(error as Error).message}`);
					// Fall through to normal processing without ExternalID handling
				}
			}

			if (externalIdPath) {
				const resolvedUuid = await this._resolveAndUpdateExternalId(field, valueHelp, config, externalIdPath);
				if (resolvedUuid !== undefined) {
					// Resolution succeeded - update payload with externalIdPath for caching
					// Only mutate after successful resolution to avoid polluting payload with incorrect data
					if (!payload.externalIdPath) {
						payload.externalIdPath = externalIdPath;
					}
					// Return the resolved UUID as key, with the entered ExternalID as description
					// We must return early because the base delegate doesn't understand ExternalID pattern
					// and would fail to validate the UUID in this context
					return {
						key: resolvedUuid,
						payload: payload,
						description: config.value
					};
				}
			}
		}

		if (config.checkDescription) {
			const container = valueHelp.getTypeahead();
			const selectedContent = container.getSelectedContent();
			const contentId = selectedContent && selectedContent.getId();
			// In cases where getItemForValue is called before showValueList, the description may not be available.
			// Therefore, this retrieveContent method is used to update the description.
			await ValueHelpDelegate.retrieveContent(valueHelp, container, contentId);
			const maxLength = payload.maxLength;
			const valueLength = config.value?.toString().length || 0;
			const descriptionPath = payload.valueHelpDescriptionPath;
			if (descriptionPath === "") {
				// In case the property value help collection has no text annotation (descriptionPath is empty) the description check shouldn´t occur.
				// In such a case the method getDescription will be called by MDC and within this method a SideEffect is requested to retrieve the text from the text property of the main entity
				config.checkDescription = false;
			} else if (maxLength !== undefined && valueLength > maxLength) {
				//value length is > text proeperty length constraint
				return;
			}
		}
		return FieldBaseDelegate.getItemForValue(field, valueHelp, config);
	},

	/**
	 * Resolves ExternalID to UUID and updates the binding context directly.
	 * This handles the case where the user enters an ExternalID value and quickly tabs out,
	 * before the type-ahead dropdown appears.
	 * @param _field The <code>Field</code> instance
	 * @param valueHelp Value help instance
	 * @param config Configuration object
	 * @param externalIdPath Path to the ExternalID property
	 * @returns The resolved UUID or undefined if resolution fails
	 */
	_resolveAndUpdateExternalId: async function (
		_field: Field,
		valueHelp: ValueHelp,
		config: ItemForValueConfiguration,
		externalIdPath: string
	): Promise<string | undefined> {
		const payload = valueHelp.getPayload() as ValueHelpPayload;
		const enteredValue = config.value as string;

		try {
			const dataModel = valueHelp.getModel() as ODataModel | undefined;
			if (!dataModel) {
				return undefined;
			}

			const metaModel = dataModel.getMetaModel();
			const valueListInfo = await metaModel.requestValueListInfo(payload.propertyPath, true, config.bindingContext as Context);
			const valueList = valueListInfo[Object.keys(valueListInfo)[0]] as AnnotationValueListType;

			// Extract property name from metadata path (format: "/EntityType/propertyName")
			// This follows the same pattern used in ModelHelper.ts and FilterBar.ts
			const pathSegments = payload.propertyPath.split("/");
			const propertyName = pathSegments[pathSegments.length - 1];
			const externalIdFullPath = payload.propertyPath.replace(propertyName, externalIdPath);
			const externalIdPathSegments = externalIdFullPath.split("/");
			const externalIdName = externalIdPathSegments[externalIdPathSegments.length - 1];

			// Query value help collection by ExternalID to get the UUID
			const valueListModel = valueList.$model;
			const filters = [new Filter({ path: externalIdName, operator: "EQ", value1: enteredValue })];

			const valueHelpParameters = this._getValueListParameter(valueList, propertyName);
			const valueHelpProperty = valueHelpParameters?.[0]?.ValueListProperty;

			if (!valueHelpProperty) {
				return undefined;
			}

			const contexts = await this._queryValueListContexts(valueListModel, valueList.CollectionPath, filters, valueHelpProperty);

			if (contexts.length != 1) {
				// no match or multiple matches found
				return undefined;
			}

			const resolvedContext = contexts[0];
			return resolvedContext.getObject(valueHelpProperty);
		} catch (error) {
			// Log the error and return undefined to fall back to normal processing
			Log.error(
				`Failed to resolve ExternalID "${config.value}" to UUID for property ${payload.propertyPath}: ${(error as Error).message}`
			);
			return undefined;
		}
	},

	/**
	 * Retrieves the filter bar instance associated with the current field.
	 * @param field Field Control
	 * @returns The filter bar instance
	 */
	_getFilterBar: function (field: Field | null): FilterBar | undefined {
		let filterBarAPI;
		if (field?.isA("sap.ui.mdc.FilterField")) {
			while (field) {
				if (field?.isA<FilterBarAPI>("sap.fe.macros.FilterBar")) {
					filterBarAPI = field;
					break;
				}
				field = field?.getParent() as unknown as Field;
			}
			if (filterBarAPI?.getContent()?.isA("sap.fe.macros.controls.FilterBar")) {
				return filterBarAPI.getContent() as FilterBar;
			}
		}
		return undefined;
	},

	/**
	 * Determines the description for a given key.
	 * @param field The <code>Field</code> instance
	 * @param valueHelp Field help assigned to the <code>Field</code> or <code>FilterField</code> control
	 * @param key Key value of the description
	 * @param _conditionIn In parameters for the key (no longer supported)
	 * @param _conditionOut Out parameters for the key (no longer supported)
	 * @param bindingContext BindingContext <code>BindingContext</code> of the checked field. Inside a table, the <code>ValueHelp</code> element can be connected to a different row
	 * @param _ConditionModel ConditionModel</code>, if bound to one
	 * @param _conditionModelName Name of the <code>ConditionModel</code>, if bound to one
	 * @param conditionPayload Additional context information for this key
	 * @param control Instance of the calling control
	 * @param _type Type of the value
	 * @returns Description for the key or object containing a description, key and payload. If the description is not available right away (it must be requested), a <code>Promise</code> is returned
	 */
	getDescription: async function (
		field: Field | null,
		valueHelp: ValueHelp,
		key: string,
		_conditionIn: object,
		_conditionOut: object,
		bindingContext: Context | undefined,
		_ConditionModel: ConditionModel,
		_conditionModelName: string,
		conditionPayload: ConditionPayloadMap,
		control: Control,
		_type: unknown,
		emptyAllowed: boolean
	) {
		//JIRA: FIORITECHP1-22022 . The MDC field should not  tries to determine description with the initial GET of the data.
		// it should rely on the data we already received from the backend
		// But The getDescription function is also called in the FilterField case if a variant is loaded.
		// As the description text could be language dependent it is not stored in the variant, so it needs to be read on rendering.

		let payload = field?.getPayload() as FieldPayload;

		/* Retrieve text from value help, if value was set by out-parameter (BCP 2270160633) */
		if (!payload && (control as FieldBase)?.getDisplay().includes("Description")) {
			payload = {
				retrieveTextFromValueList: true
			};
		}

		if (payload?.retrieveTextFromValueList === true || payload?.isFilterField === true) {
			const dataModel = valueHelp.getModel() as ODataModel | undefined;
			const owner = Component.getOwnerComponentFor(valueHelp as unknown as Control);
			// If neither dataModel nor owner is defined, the valueHelp cannot be an FE control.
			// This occurs in cases of a standard MDC controls (e.g., default ValueHelp for boolean values).
			if (!dataModel && !owner) {
				return FieldBaseDelegate.getDescription(
					field as FieldBase,
					valueHelp,
					key,
					_conditionIn,
					_conditionOut,
					bindingContext as Context,
					undefined,
					undefined,
					conditionPayload,
					control,
					_type,
					emptyAllowed
				);
			}
			const metaModel = dataModel
				? dataModel.getMetaModel()
				: CommonUtils.getAppComponent(valueHelp as unknown as Control)
						.getModel()
						.getMetaModel();
			const valuehelpPayload = valueHelp.getPayload() as ValueHelpPayload;
			const valuehelpConditionPayload = conditionPayload?.[valuehelpPayload.valueHelpQualifier];
			const propertyPath = valuehelpPayload.propertyPath;
			const propertyDescriptionPath = valuehelpPayload?.propertyDescriptionPath;
			let textProperty: string;

			try {
				/* Request value help metadata */
				const valueListInfo = await metaModel.requestValueListInfo(propertyPath, true, bindingContext);
				const filterBar = this._getFilterBar(field);
				let filterConditions: Record<string, ConditionObject[]> | undefined;
				if (filterBar) {
					const filterState: ExternalStateType = await StateUtil.retrieveExternalState(filterBar);
					filterConditions = filterState.filter;
				}
				const propertyName = metaModel.getObject(`${propertyPath}@sapui.name`) as string;
				// take the first value list annotation - alternatively take the one without qualifier or the first one
				const valueList = valueListInfo[Object.keys(valueListInfo)[0]];
				const valueHelpParameters = this._getValueListParameter(valueList, propertyName);
				const valueHelpProperty = valueHelpParameters?.[0]?.ValueListProperty;
				if (!valueHelpProperty) {
					throw Error(`Inconsistent value help annotation for ${propertyName}`);
				}
				// get text annotation for this value list property
				const valueListModel = valueList.$model;
				const textAnnotation = valueListModel
					.getMetaModel()
					.getObject(`/${valueList.CollectionPath}/${valueHelpProperty}@com.sap.vocabularies.Common.v1.Text`);
				if (textAnnotation && textAnnotation.$Path) {
					textProperty = textAnnotation.$Path;
					/* Build the filter for the relevant parameters */
					const filters = this._getFilter(
						valueList,
						propertyName,
						valueHelpProperty,
						key,
						valuehelpPayload,
						valuehelpConditionPayload,
						bindingContext,
						filterConditions
					);
					/* Request description for given key from value list entity */
					const contexts = await this._queryValueListContexts(valueListModel, valueList.CollectionPath, filters, textProperty);
					return contexts.length ? contexts[0].getObject(textProperty) : undefined;
				} else if (bindingContext !== undefined && propertyDescriptionPath) {
					const lastIndex = propertyDescriptionPath.lastIndexOf("/");
					const sideEffectPath = lastIndex > 0 ? propertyDescriptionPath.substring(0, lastIndex) : propertyDescriptionPath;
					const sideEffectsService = CommonUtils.getAppComponent(valueHelp as unknown as Control).getSideEffectsService();
					await sideEffectsService.requestSideEffects([sideEffectPath], bindingContext);
					Log.warning(
						`RequestSideEffects is triggered because the text annotation for ${valueHelpProperty} is not defined at the CollectionPath of the value help`
					);
					return undefined;
				} else {
					/* EXTERNAlID */
					const externalIdPath = metaModel?.getObject(
						`${valuehelpPayload.propertyPath}@com.sap.vocabularies.Common.v1.ExternalID`
					)?.$Path;
					if (externalIdPath) {
						const externalIdFullPath = valuehelpPayload.propertyPath.replace(propertyName, externalIdPath);
						const externalIdName = metaModel.getObject(`${externalIdFullPath}@sapui.name`);
						const externalIdDescriptionPath = metaModel?.getObject(`${externalIdFullPath}@com.sap.vocabularies.Common.v1.Text`)
							?.$Path;
						const filters = [];
						filters.push(new Filter({ path: externalIdName, operator: "EQ", value1: key }));
						const contexts = await this._queryValueListContexts(
							valueListModel,
							valueList.CollectionPath,
							filters,
							`${externalIdName},${externalIdDescriptionPath}`
						);
						if (contexts.length) {
							return contexts[0].getObject(externalIdDescriptionPath);
						}
					}
					Log.error(`Text Annotation for ${valueHelpProperty} is not defined`);
					return undefined;
				}
			} catch (error) {
				const status = error ? (error as XMLHttpRequest).status : undefined;
				const message = error instanceof Error ? error.message : String(error);
				const msg = status === 404 ? `Metadata not found (${status}) for value help of property ${propertyPath}` : message;
				Log.error(msg);
			}
		}
		return undefined;
	}
});
