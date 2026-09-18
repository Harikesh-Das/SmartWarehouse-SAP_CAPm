import type { Property } from "@sap-ux/vocabularies-types";
import type { PropertyAnnotations_Common } from "@sap-ux/vocabularies-types/vocabularies/Common_Edm";
import type {
	DataFieldAbstractTypes,
	DataFieldTypes,
	FieldGroupType,
	FilterFacets,
	ReferenceFacet,
	SelectionFields
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import mergeObjects from "sap/base/util/merge";
import type { EnhanceWithUI5 } from "sap/fe/base/ClassSupport";
import jsx from "sap/fe/base/jsx-runtime/jsx";
import type AppComponent from "sap/fe/core/AppComponent";
import type { BaseTreeModifier, PreprocessorSettings } from "sap/fe/core/CommonUtils";
import CommonUtils from "sap/fe/core/CommonUtils";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import TemplateModel from "sap/fe/core/TemplateModel";
import { parseXMLString } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import FilterRestrictions from "sap/fe/core/converters/controls/Common/filter/FilterRestrictions";
import type {
	PropertyInfo as FEPropertyInfo,
	FilterField,
	PropertyInfoExternal
} from "sap/fe/core/converters/controls/ListReport/FilterBar";
import { processSelectionFields, sortPropertyInfosByGroupLabel } from "sap/fe/core/converters/controls/ListReport/FilterBar";
import type { VisualFilters } from "sap/fe/core/converters/controls/ListReport/VisualFilters";
import { KeyHelper } from "sap/fe/core/converters/helpers/Key";
import { isPropertyFilterable } from "sap/fe/core/helpers/MetaModelFunction";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { getLocalizedText, getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { hasValueHelp } from "sap/fe/core/templating/PropertyFormatters";
import { getModelType } from "sap/fe/core/type/EDM";
import CommonHelper from "sap/fe/macros/CommonHelper";
import DelegateUtil from "sap/fe/macros/DelegateUtil";
import type TableAPI from "sap/fe/macros/Table";
import FieldHelper from "sap/fe/macros/field/FieldHelper";
import type { IFilterControl } from "sap/fe/macros/filter/FilterUtils";
import FilterUtils from "sap/fe/macros/filter/FilterUtils";
import FilterFieldCreator from "sap/fe/macros/filterBar/FilterFieldTemplate";
import UOMValidationDelegate from "sap/fe/macros/filterBar/UOMValidationDelegate";
import type { PropertyInfo } from "sap/fe/macros/internal/PropertyInfo";
import { getValueHelpTemplate } from "sap/fe/macros/internal/valuehelp/ValueHelpTemplating";
import type { ControlPropertyInfo } from "sap/fe/macros/mdc/adapter/StateHelper";
import StateHelper from "sap/fe/macros/mdc/adapter/StateHelper";
import type ManagedObject from "sap/ui/base/ManagedObject";
import Component from "sap/ui/core/Component";
import type UI5Element from "sap/ui/core/Element";
import type View from "sap/ui/core/mvc/View";
import type FilterBar from "sap/ui/mdc/FilterBar";
import FilterBarDelegate from "sap/ui/mdc/FilterBarDelegate";
import type MDCFilterField from "sap/ui/mdc/FilterField";
import type ValueHelp from "sap/ui/mdc/ValueHelp";
import TypeMap from "sap/ui/mdc/odata/v4/TypeMap";
import type Context from "sap/ui/model/Context";
import type Model from "sap/ui/model/Model";
import JSONModel from "sap/ui/model/json/JSONModel";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type MacroAPI from "../MacroAPI";

type ModifierElement = UI5Element | UI5Element[] | Element | Element[];
type NullableModifierElement = void | ModifierElement | null | string;
const ODataFilterBarDelegate = Object.assign({}, FilterBarDelegate, UOMValidationDelegate) as typeof FilterBarDelegate &
	typeof UOMValidationDelegate & {
		apiVersion: number;
		_isFilterInSelectionFields(selectionFields: SelectionFields, filterFieldInfo: FilterField): boolean;
		getLineItemAnnotationPathFromTable(oControl: ManagedObject, oMetaModel: ODataMetaModel): string | undefined;
		_findSelectionField(aSelectionFields: FilterField[], sFlexName: string): FilterField | undefined;
		clearFilters(oFilterControl: FilterBar): Promise<void>;
		getTypeMap(): typeof TypeMap;
		fetchFilterProperties(filterBar: IFilterControl): Promise<ControlPropertyInfo[] | PropertyInfoExternal[]>;
		fetchProperties(filterBar: FilterBar): Promise<PropertyInfoExternal[]>;
		_isFilterAdaptable(
			filterFieldInfo: FilterField,
			propertyAnnotations: Property,
			selectionFields?: SelectionFields,
			filterFacets?: FilterFacets
		): boolean;
		fetchPropertiesForEntity(sEntityTypePath: string, oMetaModel: ODataMetaModel, oFilterControl: IFilterControl): PropertyInfo[];
		_templateCustomFilter(
			oFilterBar: IFilterControl,
			sIdPrefix: string,
			oSelectionFieldInfo: FilterField,
			oMetaModel: ODataMetaModel,
			oModifier: BaseTreeModifier
		): Promise<ModifierElement>;
		_addP13nItem(sPropertyInfoName: string, oParentControl: FilterBar): Promise<NullableModifierElement>;
		_addFlexItem(
			sFlexPropertyName: string,
			oParentControl: FilterBar,
			oMetaModel: ODataMetaModel,
			oModifier: BaseTreeModifier | undefined,
			oAppComponent?: AppComponent,
			view?: View
		): Promise<NullableModifierElement>;
		addItem(
			oParentControl: FilterBar,
			sPropertyInfoName: string,
			mPropertyBag?: { modifier: BaseTreeModifier; appComponent: AppComponent }
		): Promise<NullableModifierElement>;
		addCondition(
			oParentControl: FilterBar,
			sPropertyInfoName: string,
			mPropertyBag: { appComponent: AppComponent; modifier: BaseTreeModifier }
		): Promise<void | null>;
		removeItem(
			oParentControl: FilterBar,
			oFilterFieldProperty: UI5Element | Element,
			mPropertyBag: { appComponent: AppComponent; modifier: BaseTreeModifier }
		): Promise<boolean | null>;
		removeCondition(
			oParentControl: FilterBar,
			sPropertyInfoName: string,
			mPropertyBag: {
				appComponent: AppComponent;
				modifier: BaseTreeModifier;
			}
		): Promise<void | null>;
	};
ODataFilterBarDelegate.apiVersion = 2;
const EDIT_STATE_PROPERTY_NAME = "$editState",
	SEARCH_PROPERTY_NAME = "$search",
	VALUE_HELP_TYPE = "FilterFieldValueHelp",
	FETCHED_PROPERTIES_DATA_KEY = DelegateUtil.FETCHED_PROPERTIES_DATA_KEY;

// For one single entry in UI.SelectionFields
type AnnotationSelectionField = {
	value: string;
};

async function _templateEditState(
	sIdPrefix: string,
	metaModel: ODataMetaModel,
	oModifier: BaseTreeModifier | undefined
): Promise<ModifierElement> {
	const oThis = new JSONModel({
			id: sIdPrefix,
			isDraftCollaborative: ModelHelper.isCollaborationDraftSupported(metaModel)
		}),
		oPreprocessorSettings = {
			bindingContexts: {
				this: oThis.createBindingContext("/")
			},
			models: {
				//"this.i18n": ResourceModel.getModel(), TODO: To be checked why this is needed, should not be needed at all
				this: oThis
			}
		};

	return DelegateUtil.templateControlFragment(
		"sap.fe.macros.filterBar.DraftEditState",
		oPreprocessorSettings,
		undefined,
		oModifier
	).finally(function () {
		oThis.destroy();
	});
}

ODataFilterBarDelegate._templateCustomFilter = async function (
	oFilterBar: IFilterControl,
	sIdPrefix: string,
	oSelectionFieldInfo: FilterField,
	oMetaModel: ODataMetaModel,
	oModifier: BaseTreeModifier
): Promise<ModifierElement> {
	const sEntityTypePath = await DelegateUtil.getCustomDataWithModifier<string>(oFilterBar, "entityType", oModifier);

	if (oSelectionFieldInfo.annotationPath !== undefined) {
		// if property is not defined in the manifest
		type PropertyAnnotations_Common_extended = PropertyAnnotations_Common & { DocumentationRef?: string };
		const context = oMetaModel.getContext(oSelectionFieldInfo.annotationPath),
			dataModelPath = getInvolvedDataModelObjects<Property>(context),
			documentRefText = (
				dataModelPath.targetObject?.annotations.Common as PropertyAnnotations_Common_extended
			)?.DocumentationRef?.toString();
		oSelectionFieldInfo.documentRefText = documentRefText;
	}

	const oThis = new JSONModel({
			id: sIdPrefix
		}),
		oItemModel = new TemplateModel(oSelectionFieldInfo, oMetaModel),
		oPreprocessorSettings = {
			bindingContexts: {
				contextPath: oMetaModel.createBindingContext(sEntityTypePath!),
				this: oThis.createBindingContext("/"),
				item: oItemModel.createBindingContext("/")
			},
			models: {
				contextPath: oMetaModel,
				this: oThis,
				item: oItemModel
			}
		},
		oView = CommonUtils.getTargetView(oFilterBar),
		oController = oView ? oView.getController() : undefined,
		oOptions = {
			controller: oController ? oController : undefined,
			view: oView
		};

	return DelegateUtil.templateControlFragment("sap.fe.macros.filter.CustomFilter", oPreprocessorSettings, oOptions, oModifier).finally(
		function () {
			oThis.destroy();
			oItemModel.destroy();
		}
	);
};
function _getPropertyPath(sConditionPath: string): string {
	return FilterUtils.getPropertyPathFromConditionPath(sConditionPath);
}
ODataFilterBarDelegate._findSelectionField = function (aSelectionFields: FilterField[], sFlexName: string): FilterField | undefined {
	return aSelectionFields.find(function (oSelectionField: FilterField) {
		return (
			(oSelectionField.conditionPath === sFlexName || oSelectionField.conditionPath.replaceAll(/\*/g, "") === sFlexName) &&
			oSelectionField.availability !== "Hidden"
		);
	});
};
/**
 * Searches for a filter field in the property info array by matching name or key.
 * This is used as a fallback mechanism when a field is not found in the selection fields.
 * @param propertyInfos Array of property info objects containing field definitions from manifest/custom data.
 * @param flexName The name/key of the property to search for (can be the conditionPath, name, or key).
 * @returns The matching FilterField object if found, undefined otherwise.
 * @private
 */
function _findInPropertyInfos(propertyInfos: FEPropertyInfo[], flexName: string): FilterField | undefined {
	const foundPropertyInfo = propertyInfos.find(function (propertyInfo: FEPropertyInfo) {
		return (propertyInfo.name === flexName || propertyInfo.key === flexName) && propertyInfo.availability !== "Hidden";
	});

	return foundPropertyInfo ? _convertPropertyInfoToFilterField(foundPropertyInfo) : undefined;
}
/**
 * Converts FEPropertyInfo to FilterField by copying relevant properties.
 * This adapter function ensures type safety when using property info as filter field.
 * @param propertyInfo The property info object from manifest/custom data
 * @returns A FilterField object with properties copied from FEPropertyInfo
 * @private
 */
function _convertPropertyInfoToFilterField(propertyInfo: FEPropertyInfo): FilterField | undefined {
	if (!propertyInfo.conditionPath || !propertyInfo.key) {
		Log.warning(
			`Cannot convert property info to filter field: missing required properties (key: ${propertyInfo.key}, conditionPath: ${propertyInfo.conditionPath})`
		);
		return undefined;
	}
	return {
		key: propertyInfo.key,
		conditionPath: propertyInfo.conditionPath,
		annotationPath: propertyInfo.annotationPath,
		availability: propertyInfo.availability,
		label: propertyInfo.label,
		name: propertyInfo.name,
		dataType: propertyInfo.dataType,
		type: propertyInfo.type,
		template: propertyInfo.template,
		group: propertyInfo.group,
		groupLabel: propertyInfo.groupLabel,
		menu: propertyInfo.menu,
		settings: propertyInfo.settings,
		isParameter: propertyInfo.isParameter,
		visualFilter: propertyInfo.visualFilter,
		caseSensitive: propertyInfo.caseSensitive,
		required: propertyInfo.required,
		position: propertyInfo.position
	} as FilterField;
}
function _generateIdPrefix(sFilterBarId: string, sControlType: string, sNavigationPrefix?: string): string {
	return sNavigationPrefix ? generate([sFilterBarId, sControlType, sNavigationPrefix]) : generate([sFilterBarId, sControlType]);
}
async function _templateValueHelp(
	oSettings: {
		isXML: boolean;
		bindingContexts: {
			metaPath: Context;
			contextPath: Context;
		};
		models: {
			metaPath: ODataMetaModel;
			contextPath: ODataMetaModel;
		};
	},
	oParameters: {
		sVhIdPrefix: string;
		sNavigationPrefix?: string;
		bUseSemanticDateRange: boolean;
		oModifier?: BaseTreeModifier;
		oControl: UI5Element;
		view?: View;
	}
): Promise<void> {
	const oThis = {
		idPrefix: oParameters.sVhIdPrefix,
		conditionModel: "$filters",
		navigationPrefix: oParameters.sNavigationPrefix ? `/${oParameters.sNavigationPrefix}` : "",
		filterFieldValueHelp: true,
		useSemanticDateRange: oParameters.bUseSemanticDateRange,
		metaPath: oSettings.bindingContexts.metaPath,
		contextPath: oSettings.bindingContexts.contextPath,
		useMultiValueField: false,
		requiresValidation: false,
		collaborationEnabled: false,
		requestGroupId: undefined
	};
	const jsonModel = new JSONModel(oThis);
	const oPreprocessorSettings = mergeObjects({}, oSettings, {
		bindingContexts: {
			this: jsonModel.createBindingContext("/")
		},
		models: {
			this: oThis
		}
	}) as PreprocessorSettings;
	const targetPath = FieldHelper.valueHelpPropertyForFilterField(oSettings.bindingContexts.metaPath);

	if (oSettings.isXML) {
		let valueHelpXMLString = jsx.renderAsXML<string | undefined>(
			() =>
				getValueHelpTemplate(oSettings.bindingContexts.metaPath.getModel().createBindingContext(targetPath), oThis) as
					| string
					| undefined
		);
		if (valueHelpXMLString) {
			if (oSettings.isXML) {
				valueHelpXMLString = `<root>${valueHelpXMLString}</root>`;
			}
			const valueHelpXML = new DOMParser().parseFromString(valueHelpXMLString, "text/xml");
			return Promise.resolve(
				DelegateUtil.templateControlFragment(valueHelpXML.firstElementChild, oPreprocessorSettings, {
					isXML: oSettings.isXML
				})
			)
				.then(async function (aVHElements: ModifierElement): Promise<void> {
					if (aVHElements) {
						const sAggregationName = "dependents";
						//Some filter fields have the PersistenceProvider aggregation besides the FVH :
						if (Array.isArray(aVHElements)) {
							aVHElements.forEach(function (elt: Element | UI5Element) {
								if (oParameters.oModifier) {
									oParameters.oModifier.insertAggregation(oParameters.oControl, sAggregationName, elt, 0);
								} else {
									oParameters.oControl.insertAggregation(sAggregationName, elt as UI5Element, 0, false);
								}
							});
						} else if (oParameters.oModifier) {
							return oParameters.oModifier.insertAggregation(
								oParameters.oControl,
								sAggregationName,
								aVHElements,
								0,
								oParameters.view as unknown as Element
							);
						} else {
							oParameters.oControl.insertAggregation(sAggregationName, aVHElements as UI5Element, 0, false);
							return;
						}
					}
					return;
				})
				.catch(function (oError: unknown) {
					Log.error("Error while evaluating DelegateUtil.isValueHelpRequired", oError as string);
				})
				.finally(function () {
					jsonModel.destroy();
				});
		}
	} else {
		const valueHelp = getValueHelpTemplate(oSettings.bindingContexts.metaPath.getModel().createBindingContext(targetPath), oThis) as
			| ValueHelp
			| undefined;
		if (valueHelp) {
			const sAggregationName = "dependents";
			//Some filter fields have the PersistenceProvider aggregation besides the FVH :
			if (Array.isArray(valueHelp)) {
				valueHelp.forEach(function (elt: Element | UI5Element) {
					if (oParameters.oModifier) {
						oParameters.oModifier.insertAggregation(oParameters.oControl, sAggregationName, elt, 0);
					} else {
						oParameters.oControl.insertAggregation(sAggregationName, elt as UI5Element, 0, false);
					}
				});
			} else if (oParameters.oModifier) {
				oParameters.oModifier.insertAggregation(oParameters.oControl, sAggregationName, valueHelp, 0);
			} else {
				oParameters.oControl.insertAggregation(sAggregationName, valueHelp, 0, false);
			}
		}
	}
}
async function _addXMLCustomFilterField(
	oFilterBar: IFilterControl,
	oModifier: BaseTreeModifier,
	sPropertyPath: string
): Promise<UI5Element | Element | void> {
	try {
		const aDependents = await Promise.resolve(oModifier.getAggregation(oFilterBar, "dependents"));
		let i;
		if (aDependents && aDependents.length > 1) {
			for (i = 0; i <= aDependents.length; i++) {
				const oFilterField = aDependents[i];
				if (oFilterField && (oFilterField as UI5Element).isA<MDCFilterField>("sap.ui.mdc.FilterField")) {
					const sDataProperty = (oFilterField as MDCFilterField).getPropertyKey(),
						sFilterFieldId = (oFilterField as MDCFilterField).getId();
					if (sPropertyPath === sDataProperty && sFilterFieldId.indexOf("CustomFilterField")) {
						return oFilterField;
					}
				}
			}
		}
	} catch (oError) {
		Log.error("Filter Cannot be added", oError as string);
	}
}

async function _addPropertyInfo(
	oParentControl: FilterBar,
	mPropertyBag: { modifier: BaseTreeModifier; appComponent: AppComponent },
	oMetaModel: ODataMetaModel,
	sPropertyInfoName: string
): Promise<void> {
	try {
		// key should have the same value as name
		const sPropertyInfoKey = KeyHelper.getSelectionFieldKeyFromPath(sPropertyInfoName);
		sPropertyInfoName = sPropertyInfoName.replace("*", "");
		if (mPropertyBag && !mPropertyBag.modifier) {
			throw "FilterBar Delegate method called without modifier.";
		}

		const delegate = await mPropertyBag.modifier.getProperty<FilterBarDelegate>(oParentControl, "delegate");
		const aPropertyInfo = await mPropertyBag.modifier.getProperty<FEPropertyInfo[]>(oParentControl, "propertyInfo");
		const propertyInfoExists = await FilterUtils._checkIfPropertyInfoExists(oParentControl, mPropertyBag.modifier, sPropertyInfoName);
		//We do not get propertyInfo in case of table filters
		if (aPropertyInfo && !propertyInfoExists) {
			const hasPropertyInfo = aPropertyInfo.some(function (prop: FEPropertyInfo) {
				return prop.key === sPropertyInfoKey || prop.name === sPropertyInfoKey;
			});
			if (!hasPropertyInfo) {
				const entityTypePath = delegate.payload.entityTypePath;
				const converterContext = FilterUtils.createConverterContext(
					oParentControl as unknown as IFilterControl,
					entityTypePath,
					oMetaModel,
					mPropertyBag.appComponent
				);
				const entityType = converterContext.getEntityType();
				const filterField = FilterUtils.getFilterField(sPropertyInfoName, converterContext, entityType);
				const propertyInfo = FilterUtils.buildProperyInfo(filterField!, converterContext);
				await _updatePropertyInfo(
					aPropertyInfo as PropertyInfo[],
					mPropertyBag,
					propertyInfo as unknown as PropertyInfo,
					oParentControl
				);
			}
		}
	} catch (errorMsg) {
		Log.warning(`${oParentControl.getId()} : ${errorMsg}`);
	}
}

async function _updatePropertyInfo(
	propertyInfo: PropertyInfo[],
	propertyBag: { modifier: BaseTreeModifier; appComponent: AppComponent },
	filterField: PropertyInfo,
	parentControl: FilterBar
): Promise<void> {
	let propertyInfoForFilterBar = await DelegateUtil.getCustomDataWithModifier<string>(
		parentControl,
		"feFilterInfo",
		propertyBag.modifier
	);
	if (propertyInfoForFilterBar && propertyInfoForFilterBar.length > 0) {
		const propertyInfoForFilterBarObj = JSON.parse(propertyInfoForFilterBar) as PropertyInfo[];
		propertyInfoForFilterBarObj.push(filterField);
		propertyInfoForFilterBar = JSON.stringify(propertyInfoForFilterBarObj);
		propertyInfoForFilterBar = propertyInfoForFilterBar.replace(/\{/g, "\\{");
		propertyInfoForFilterBar = propertyInfoForFilterBar.replace(/\}/g, "\\}");
		const customDataNode = await DelegateUtil.retrieveCustomDataNode(parentControl, "feFilterInfo", propertyBag.modifier);
		customDataNode[0].setAttribute("value", propertyInfoForFilterBar);
		propertyBag.modifier.insertAggregation(parentControl, "customData", customDataNode[0], 0);
	}

	// Custom data is set to the parent control to store the propertyInfo
	propertyInfo.push(filterField);
	//remove unwanted property from the propertyInfo
	const _propertyInfo = FilterUtils.formatPropertyInfo(propertyInfo as FEPropertyInfo[]);
	//Update the propertyInfo in the parent control
	propertyBag.modifier.setProperty(parentControl, "propertyInfo", _propertyInfo);
}
/**
 * Method responsible for creating the filter field in standalone mode and in the personalization settings of the filter bar.
 * @param oParentControl Parent control instance to which the filter field is added
 * @param sPropertyInfoName Name of the property being added as the filter field
 * @param mPropertyBag Instance of the property bag from Flex API
 * @param mPropertyBag.appComponent AppComponent
 * @param mPropertyBag.modifier Modifier from Flex API
 * @param mPropertyBag.view Instance of the view
 * @returns Once resolved, a filter field definition is returned
 */
ODataFilterBarDelegate.addItem = async function (
	oParentControl: FilterBar,
	sPropertyInfoName: string,
	mPropertyBag?: { view: View; modifier: BaseTreeModifier; appComponent: AppComponent }
): Promise<NullableModifierElement> {
	if (!mPropertyBag) {
		// Invoked during runtime.
		return ODataFilterBarDelegate._addP13nItem(sPropertyInfoName, oParentControl);
	}
	const modifier = mPropertyBag.modifier;
	const model = mPropertyBag && mPropertyBag.appComponent && mPropertyBag.appComponent.getModel();
	const oMetaModel = model && model.getMetaModel();
	if (!oMetaModel) {
		return Promise.resolve(null);
	}
	const isXML = modifier && modifier.targets === "xmlTree";
	const propertyInfoExists = isXML ? await FilterUtils._checkIfPropertyInfoExists(oParentControl, modifier, sPropertyInfoName) : true;
	if (isXML && !propertyInfoExists) {
		await _addPropertyInfo(oParentControl, mPropertyBag, oMetaModel, sPropertyInfoName);
	}
	return ODataFilterBarDelegate._addFlexItem(
		sPropertyInfoName,
		oParentControl,
		oMetaModel,
		modifier,
		mPropertyBag.appComponent,
		mPropertyBag.view
	);
};

/**
 * Method responsible for removing filter field in standalone / personalization filter bar.
 * @param oParentControl Parent control instance from which the filter field is removed
 * @param oFilterFieldProperty Object of the filter field property being removed as filter field
 * @param mPropertyBag Instance of property bag from Flex API
 * @param mPropertyBag.appComponent AppComponent
 * @param mPropertyBag.modifier Modifier from Flex API
 * @returns The resolved promise
 */
ODataFilterBarDelegate.removeItem = async function (
	oParentControl: FilterBar,
	oFilterFieldProperty: UI5Element | Element,
	mPropertyBag: { appComponent: AppComponent; modifier: BaseTreeModifier }
): Promise<boolean | null> {
	let doRemoveItem = true;
	const modifier = mPropertyBag.modifier;
	const isXML = modifier && modifier.targets === "xmlTree";
	if (isXML) {
		const model = mPropertyBag && mPropertyBag.appComponent && mPropertyBag.appComponent.getModel();
		const oMetaModel = model && model.getMetaModel();
		if (!oMetaModel) {
			return Promise.resolve(null);
		}
		const filterFieldProperty = await mPropertyBag.modifier.getProperty(oFilterFieldProperty, "propertyKey");

		await _addPropertyInfo(oParentControl, mPropertyBag, oMetaModel, filterFieldProperty as string);
	}
	if (
		typeof oFilterFieldProperty !== "string" &&
		(oFilterFieldProperty as UI5Element).isA &&
		(oFilterFieldProperty as UI5Element).isA("sap.ui.mdc.FilterField")
	) {
		if ((oFilterFieldProperty as UI5Element).data("isSlot") === "true" && mPropertyBag) {
			// Inserting into the modifier creates a change from flex also filter is been removed hence promise is resolved to false
			modifier.insertAggregation(oParentControl, "dependents", oFilterFieldProperty);
			doRemoveItem = false;
		}
	}
	return Promise.resolve(doRemoveItem);
};

/**
 * Method responsible for creating filter field condition in standalone / personalization filter bar.
 * @param oParentControl Parent control instance to which the filter field is added
 * @param sPropertyInfoName Name of the property being added as filter field
 * @param mPropertyBag Instance of property bag from Flex API
 * @param mPropertyBag.appComponent AppComponent
 * @param mPropertyBag.modifier Modifier from Flex API
 * @returns The resolved promise
 */
ODataFilterBarDelegate.addCondition = async function (
	oParentControl: FilterBar,
	sPropertyInfoName: string,
	mPropertyBag: { appComponent: AppComponent; modifier: BaseTreeModifier }
): Promise<void | null> {
	const modifier = mPropertyBag.modifier;
	const isXML = modifier && modifier.targets === "xmlTree";
	if (isXML) {
		const model = mPropertyBag && mPropertyBag.appComponent && mPropertyBag.appComponent.getModel();
		const oMetaModel = model && model.getMetaModel();
		if (!oMetaModel) {
			return Promise.resolve(null);
		}
		await _addPropertyInfo(oParentControl, mPropertyBag, oMetaModel, sPropertyInfoName);
	}
	return Promise.resolve();
};

/**
 * Method responsible for removing filter field in standalone / personalization filter bar.
 * @param oParentControl Parent control instance from which the filter field is removed
 * @param sPropertyInfoName Name of the property being removed as filter field
 * @param mPropertyBag Instance of property bag from Flex API
 * @param mPropertyBag.appComponent AppComponent
 * @param mPropertyBag.modifier Modifier from Flex API
 * @returns The resolved promise
 */
ODataFilterBarDelegate.removeCondition = async function (
	oParentControl: FilterBar,
	sPropertyInfoName: string,
	mPropertyBag: {
		appComponent: AppComponent;
		modifier: BaseTreeModifier;
	}
): Promise<void | null> {
	const modifier = mPropertyBag.modifier;
	const isXML = modifier && modifier.targets === "xmlTree";
	if (isXML) {
		const propertyInfoFromCD = await DelegateUtil.getCustomDataWithModifier<string>(
			oParentControl,
			FETCHED_PROPERTIES_DATA_KEY,
			modifier
		);
		if (!propertyInfoFromCD) {
			const model = mPropertyBag && mPropertyBag.appComponent && mPropertyBag.appComponent.getModel();
			const oMetaModel = model && model.getMetaModel();
			if (!oMetaModel) {
				return Promise.resolve(null);
			}
			await _addPropertyInfo(oParentControl, mPropertyBag, oMetaModel, sPropertyInfoName);
		}
	}
	return Promise.resolve();
};
/**
 * Clears all input values of visible filter fields in the filter bar.
 * @param oFilterControl Instance of the FilterBar control
 * @returns The resolved promise
 */
ODataFilterBarDelegate.clearFilters = async function (oFilterControl: FilterBar): Promise<void> {
	const filterBarAPI = oFilterControl.getParent();
	return StateHelper.clearFilterValues(filterBarAPI as MacroAPI);
};
/**
 * Creates the filter field in the table adaptation of the FilterBar.
 * @param sPropertyInfoName The property name of the entity type for which the filter field needs to be created
 * @param oParentControl Instance of the parent control
 * @returns Once resolved, a filter field definition is returned
 */
ODataFilterBarDelegate._addP13nItem = async function (
	sPropertyInfoName: string,
	oParentControl: FilterBar
): Promise<NullableModifierElement> {
	return DelegateUtil.fetchModel(oParentControl)
		.then(async function (oModel: Model) {
			return ODataFilterBarDelegate._addFlexItem(
				sPropertyInfoName,
				oParentControl,
				oModel.getMetaModel() as ODataMetaModel,
				undefined
			);
		})
		.catch(function (oError) {
			Log.error("Model could not be resolved", oError as string);
			return null;
		});
};
ODataFilterBarDelegate.fetchPropertiesForEntity = function (
	sEntityTypePath: string,
	oMetaModel: ODataMetaModel,
	oFilterControl: IFilterControl
): PropertyInfo[] {
	const oEntityType = oMetaModel.getObject(sEntityTypePath);
	const includeHidden = oFilterControl.isA("sap.ui.mdc.valuehelp.FilterBar") ? true : undefined;
	if (!oFilterControl || !oEntityType) {
		return [];
	}
	const oConverterContext = FilterUtils.createConverterContext(oFilterControl, sEntityTypePath);
	const sEntitySetPath = ModelHelper.getEntitySetPath(sEntityTypePath);

	const mFilterFields = FilterUtils.getConvertedFilterFields(
		oFilterControl,
		sEntityTypePath,
		includeHidden,
		oMetaModel,
		CommonUtils.getAppComponent(oFilterControl)
	);
	let aFetchedProperties: FEPropertyInfo[] = [];
	mFilterFields.forEach(function (oFilterFieldInfo: FilterField) {
		const sAnnotationPath = oFilterFieldInfo.annotationPath;
		if (sAnnotationPath && !oFilterFieldInfo.template) {
			const oPropertyAnnotations = oConverterContext.getConvertedTypes().resolvePath<Property>(sAnnotationPath).target;
			const sTargetPropertyPrefix = CommonHelper.getLocationForPropertyPath(oMetaModel, sAnnotationPath);
			const sProperty = sAnnotationPath.replace(`${sTargetPropertyPrefix}/`, "");
			const entityType = oConverterContext.getEntityType();
			const selectionFields = entityType.annotations?.UI?.SelectionFields;
			const filterFacets = entityType.annotations?.UI?.FilterFacets;
			if (
				oPropertyAnnotations &&
				ODataFilterBarDelegate._isFilterAdaptable(oFilterFieldInfo, oPropertyAnnotations, selectionFields, filterFacets) &&
				isPropertyFilterable(oMetaModel, sTargetPropertyPrefix, _getPropertyPath(sProperty), true)
			) {
				aFetchedProperties.push(oFilterFieldInfo as PropertyInfo);
			}
		} else {
			//Custom Filters
			aFetchedProperties.push(oFilterFieldInfo as PropertyInfo);
		}
	});

	const aParameterFields: string[] = [];
	const processedFields = processSelectionFields(aFetchedProperties as FilterField[], oConverterContext);
	const processedFieldsKeys: string[] = [];
	processedFields.forEach(function (oProps: FEPropertyInfo) {
		if (oProps.key) {
			processedFieldsKeys.push(oProps.key);
		}
	});

	aFetchedProperties = aFetchedProperties.filter(function (oProp: FEPropertyInfo) {
		return processedFieldsKeys.includes(oProp.key!);
	});
	const dataModel = getInvolvedDataModelObjects(oMetaModel.getContext(sEntitySetPath));
	const oFR = FilterRestrictions.getFilterRestrictionsByDataModel(dataModel as DataModelObjectPath<PageContextPathTarget>),
		mAllowedExpressions = oFR.FilterAllowedExpressions;
	//Object.keys(processedFields).forEach(function (sFilterFieldKey: string) {
	processedFields.forEach(function (oProp, iFilterFieldIndex: number) {
		const oSelField = aFetchedProperties[iFilterFieldIndex];
		if (!oSelField || !oSelField.conditionPath) {
			return;
		}
		const sPropertyPath = _getPropertyPath(oSelField.conditionPath);
		//fetchBasic
		oProp = Object.assign(oProp, {
			group: oSelField.group,
			groupLabel: oSelField.groupLabel,
			path: oSelField.conditionPath,
			tooltip: null,
			removeFromAppState: false,
			hasValueHelp: false
		});

		//fetchPropInfo
		if (oSelField.annotationPath) {
			const sAnnotationPath = oSelField.annotationPath;
			const oProperty = oMetaModel.getObject(sAnnotationPath),
				oPropertyAnnotations = oMetaModel.getObject(`${sAnnotationPath}@`),
				oPropertyContext = oMetaModel.createBindingContext(sAnnotationPath);

			const bRemoveFromAppState =
				oPropertyAnnotations["@com.sap.vocabularies.PersonalData.v1.IsPotentiallySensitive"] ||
				oPropertyAnnotations["@com.sap.vocabularies.UI.v1.ExcludeFromNavigationContext"] ||
				oPropertyAnnotations["@com.sap.vocabularies.Analytics.v1.Measure"];

			const sTargetPropertyPrefix = CommonHelper.getLocationForPropertyPath(oMetaModel, oSelField.annotationPath);
			const sProperty = sAnnotationPath.replace(`${sTargetPropertyPrefix}/`, "");
			let oFilterDefaultValueAnnotation;
			let oFilterDefaultValue;
			if (oPropertyContext && isPropertyFilterable(oMetaModel, sTargetPropertyPrefix, _getPropertyPath(sProperty), true)) {
				oFilterDefaultValueAnnotation = oPropertyAnnotations["@com.sap.vocabularies.Common.v1.FilterDefaultValue"];
				if (oFilterDefaultValueAnnotation) {
					oFilterDefaultValue = oFilterDefaultValueAnnotation[`$${getModelType(oProperty.$Type)}`];
				}

				oProp = Object.assign(oProp, {
					tooltip: oPropertyAnnotations["@com.sap.vocabularies.Common.v1.QuickInfo"] || undefined,
					removeFromAppState: bRemoveFromAppState,
					hasValueHelp: hasValueHelp(oPropertyContext.getObject(), { context: oPropertyContext }),
					defaultFilterConditions: oFilterDefaultValue
						? [
								{
									fieldPath: oSelField.conditionPath,
									operator: "EQ",
									values: [oFilterDefaultValue]
								}
						  ]
						: undefined
				});
			}
		}

		//base

		if (oProp) {
			if (mAllowedExpressions[sPropertyPath] && mAllowedExpressions[sPropertyPath].length > 0) {
				oProp.filterExpression = CommonUtils.getSpecificAllowedExpression(mAllowedExpressions[sPropertyPath]);
			} else {
				oProp.filterExpression = "auto";
			}

			oProp = Object.assign(oProp, {
				visible: oSelField.availability === "Default"
			});
		}

		processedFields[iFilterFieldIndex] = oProp;
	});
	processedFields.forEach(function (propInfo: FEPropertyInfo) {
		// key should have the same value as name
		propInfo.key = propInfo.name;
		if (propInfo.path === "$editState") {
			propInfo.label = getResourceModel(oFilterControl).getText("FILTERBAR_EDITING_STATUS");
			if (oFilterControl.isA("sap.fe.macros.controls.FilterBar") && oFilterControl.getProperty("disableDraftEditStateFilter")) {
				propInfo.hiddenFilter = true;
			}
		}
		propInfo.typeConfig = TypeMap.getTypeConfig(propInfo.dataType, propInfo.formatOptions, propInfo.constraints);
		propInfo.label = getLocalizedText(propInfo.label!, oFilterControl) || "";
		if (propInfo.isParameter) {
			aParameterFields.push(propInfo.name);
		}
	});

	aFetchedProperties = processedFields;
	DelegateUtil.setCustomData(oFilterControl, "parameters", aParameterFields as unknown as string);

	return aFetchedProperties as PropertyInfo[];
};

ODataFilterBarDelegate.getLineItemAnnotationPathFromTable = function (
	oControl: ManagedObject,
	oMetaModel: ODataMetaModel
): string | undefined {
	if (oControl.isA<EnhanceWithUI5<TableAPI>>("sap.fe.macros.Table")) {
		const annotationPaths = oControl.getFullMetaPath().split("#")[0].split("/");
		switch (annotationPaths[annotationPaths.length - 1]) {
			case `@${UIAnnotationTerms.SelectionPresentationVariant}`:
			case `@${UIAnnotationTerms.PresentationVariant}`:
				return oMetaModel
					.getObject(oControl.getFullMetaPath())
					.Visualizations?.find((visualization: { $AnnotationPath: string }) =>
						visualization.$AnnotationPath.includes(`@${UIAnnotationTerms.LineItem}`)
					).$AnnotationPath;
			case `@${UIAnnotationTerms.LineItem}`:
				const metaPaths = oControl.getFullMetaPath().split("/");
				return metaPaths[metaPaths.length - 1];
		}
	}
	return undefined;
};

ODataFilterBarDelegate._isFilterAdaptable = function (
	filterFieldInfo: FilterField,
	propertyAnnotations: Property,
	selectionFields?: SelectionFields,
	filterFacets?: FilterFacets
): boolean {
	let isInFilterFacets: boolean;
	const isSelectionField = selectionFields ? ODataFilterBarDelegate._isFilterInSelectionFields(selectionFields, filterFieldInfo) : false;
	if (filterFacets) {
		isInFilterFacets = filterFacets.some(function (filterFacet: ReferenceFacet) {
			const fieldGroup = filterFacet.Target?.$target as FieldGroupType;
			return fieldGroup?.Data.some(function (dataField: DataFieldAbstractTypes) {
				// we expect dataField to be DataFieldTypes (having a Value) inside FieldGroups inside FilterFacets
				if ((dataField as DataFieldTypes).Value.path === filterFieldInfo.key) {
					return true;
				}
				// dataField types having no Value (DataFieldForAnnotationTypes, DataFieldForActionAbstractTypes, DataFieldForActionGroupTypes), there is nothing to check, but this should not occur anyway
				return false;
			});
		});
	} else {
		isInFilterFacets = false;
	}
	return isSelectionField || isInFilterFacets || !propertyAnnotations.annotations?.UI?.AdaptationHidden;
};

ODataFilterBarDelegate._isFilterInSelectionFields = function (selectionFields: SelectionFields, filterFieldInfo: FilterField): boolean {
	const filterFieldKey = filterFieldInfo.key.replace(/[*:]/g, "/").replace(/\/+/g, "/");
	return selectionFields.some(function (selectionField: AnnotationSelectionField) {
		if (selectionField.value === filterFieldKey) {
			return true;
		}
		return false;
	});
};

ODataFilterBarDelegate._addFlexItem = async function (
	sFlexPropertyName: string,
	oParentControl: FilterBar,
	oMetaModel: ODataMetaModel,
	oModifier: BaseTreeModifier | undefined,
	oAppComponent: AppComponent | undefined,
	view?: View | undefined
): Promise<NullableModifierElement> {
	let propertyInfosFromFilterBar: FEPropertyInfo[] = [];
	const bIsXML = !!oModifier && oModifier.targets === "xmlTree";
	if (bIsXML) {
		const customDataValue = await DelegateUtil.getCustomDataWithModifier<string>(oParentControl, "feFilterInfo", oModifier);
		if (customDataValue) {
			propertyInfosFromFilterBar = JSON.parse(customDataValue) as FEPropertyInfo[]; // retrieve pre-fetched filter info from custom data, required during templating
		}
	}
	const sFilterBarId = oModifier ? oModifier.getId(oParentControl) : oParentControl.getId(),
		sIdPrefix = oModifier ? "" : "Adaptation",
		filterEntityTypePath = await DelegateUtil.getCustomDataWithModifier<string>(oParentControl, "entityType", oModifier),
		aSelectionFields = FilterUtils.getConvertedFilterFields(
			oParentControl as unknown as IFilterControl,
			filterEntityTypePath,
			undefined,
			oMetaModel,
			oAppComponent,
			oModifier,
			oModifier ? undefined : ODataFilterBarDelegate.getLineItemAnnotationPathFromTable(oParentControl.getParent()!, oMetaModel),
			propertyInfosFromFilterBar
		);
	let oSelectionField: FilterField | undefined = ODataFilterBarDelegate._findSelectionField(aSelectionFields, sFlexPropertyName);
	// if not found in selectionFields, check in propertyInfos.
	if (!oSelectionField && propertyInfosFromFilterBar.length > 0) {
		oSelectionField = _findInPropertyInfos(propertyInfosFromFilterBar, sFlexPropertyName);
	}
	const sPropertyPath = _getPropertyPath(oSelectionField?.conditionPath ?? sFlexPropertyName);

	if (sFlexPropertyName === EDIT_STATE_PROPERTY_NAME) {
		return _templateEditState(_generateIdPrefix(sFilterBarId, `${sIdPrefix}FilterField`), oMetaModel, oModifier);
	} else if (sFlexPropertyName === SEARCH_PROPERTY_NAME) {
		return Promise.resolve(null);
	}

	const existingSlotFilterField = oModifier
		? await _addXMLCustomFilterField(oParentControl as unknown as IFilterControl, oModifier, sPropertyPath)
		: undefined;
	if (existingSlotFilterField) {
		return existingSlotFilterField;
	}

	if (oSelectionField?.template) {
		return ODataFilterBarDelegate._templateCustomFilter(
			oParentControl as unknown as IFilterControl,
			_generateIdPrefix(sFilterBarId, `${sIdPrefix}`),
			oSelectionField,
			oMetaModel,
			oModifier!
		);
	}

	if (oSelectionField?.type === "Slot" && oModifier) {
		return _addXMLCustomFilterField(oParentControl as unknown as IFilterControl, oModifier, sPropertyPath);
	}

	const sNavigationPath = CommonHelper.getNavigationPath(sPropertyPath);
	let sEntityTypePath: string;
	let sUseSemanticDateRange;
	let oSettings: {
		bindingContexts: {
			contextPath: Context;
			property: Context;
		};
		models: {
			contextPath: ODataMetaModel;
			property?: ODataMetaModel;
			metaPath?: ODataMetaModel;
		};
		isXML: boolean;
	};
	let sBindingPath;
	let oPropertyContext: Context;
	let oParameters: {
		metaPath: string;
		sPropertyName: string;
		sBindingPath: string;
		sValueHelpType: string;
		oMetaModel: ODataMetaModel;
		sIdPrefix: string;
		oSettings: unknown;
		sVhIdPrefix: string;
		sNavigationPrefix?: string;
		bUseSemanticDateRange: boolean;
		oModifier?: BaseTreeModifier;
		oControl: UI5Element;
		visualFilter?: unknown;
		view?: View;
		label?: string;
	};

	return Promise.resolve()
		.then(async function () {
			if (oSelectionField?.isParameter) {
				const sAnnotationPath = oSelectionField.annotationPath;
				return sAnnotationPath.substring(0, sAnnotationPath.lastIndexOf("/") + 1);
			}
			return DelegateUtil.getCustomDataWithModifier<string>(oParentControl, "entityType", oModifier);
		})
		.then(async function (sRetrievedEntityTypePath: string | undefined) {
			sEntityTypePath = sRetrievedEntityTypePath!;
			return DelegateUtil.getCustomDataWithModifier<string>(oParentControl, "useSemanticDateRange", oModifier);
		})
		.then(async function (sRetrievedUseSemanticDateRange: string | undefined) {
			sUseSemanticDateRange = sRetrievedUseSemanticDateRange;
			oPropertyContext = oMetaModel.createBindingContext(sEntityTypePath + sPropertyPath)!;
			let sInFilterBarId = oModifier ? oModifier.getId(oParentControl) : oParentControl.getId();
			if (sInFilterBarId.endsWith("-content")) {
				// -content is only added when the building block is used directly in the filter bar
				sInFilterBarId = sInFilterBarId.substring(0, sInFilterBarId.lastIndexOf("-content"));
				// By using the id of the parent control, we can get the correct idPrefix for the value help
			}
			oSettings = {
				bindingContexts: {
					contextPath: oMetaModel.createBindingContext(sEntityTypePath)!,
					property: oPropertyContext
				},
				models: {
					contextPath: oMetaModel,
					property: oMetaModel
				},
				isXML: bIsXML
			};
			sBindingPath = `/${ModelHelper.getEntitySetPath(sEntityTypePath)
				.split("/")
				.filter(ModelHelper.filterOutNavPropBinding)
				.join("/")}`;
			oParameters = {
				metaPath: oPropertyContext.getPath(),
				sPropertyName: sPropertyPath,
				sBindingPath: sBindingPath,
				sValueHelpType: sIdPrefix + VALUE_HELP_TYPE,
				oControl: oParentControl,
				oMetaModel: oMetaModel,
				oModifier: oModifier,
				sIdPrefix: _generateIdPrefix(sInFilterBarId, `${sIdPrefix}FilterField`, sNavigationPath),
				sVhIdPrefix: _generateIdPrefix(sInFilterBarId, sIdPrefix + VALUE_HELP_TYPE),
				sNavigationPrefix: sNavigationPath,
				bUseSemanticDateRange: sUseSemanticDateRange as unknown as boolean,
				oSettings: oSelectionField?.settings ?? {},
				visualFilter: oSelectionField?.visualFilter,
				view,
				label: oSelectionField?.label
			};

			return DelegateUtil.doesValueHelpExist(oParameters);
		})
		.then(async function (bValueHelpExists: boolean) {
			if (!bValueHelpExists) {
				return _templateValueHelp(
					{
						bindingContexts: {
							contextPath: oMetaModel.createBindingContext(sEntityTypePath)!,
							metaPath: oSettings.bindingContexts.property
						},
						models: {
							contextPath: oMetaModel,
							metaPath: oMetaModel
						},
						isXML: bIsXML
					},
					oParameters
				);
			}
			return;
		})
		.then(async function () {
			return DelegateUtil.getCustomDataWithModifier<string>(oParentControl, "localId", oModifier);
		})
		.then(async function (localId: string | undefined) {
			const filterFieldCreator = new FilterFieldCreator({
				idPrefix: oParameters.sIdPrefix,
				vhIdPrefix: oParameters.sVhIdPrefix,
				contextPath: sEntityTypePath,
				propertyPath: oPropertyContext.getPath(),
				useSemanticDateRange: (oParameters.bUseSemanticDateRange as unknown as string) === "false" ? false : true,
				settings: oParameters.oSettings as {} | undefined,
				visualFilter: oParameters.visualFilter as Context | VisualFilters | undefined,
				editMode: `{internal>/${localId}/filterFields/${oParameters.sPropertyName}/editMode}`,
				label: oParameters.label,
				metaModel: oParameters.oMetaModel
			});

			await filterFieldCreator.displayPromise;
			if (bIsXML) {
				// Template preprocessing: wrap creation in renderAsXML
				const xmlString = jsx.renderAsXML(() => filterFieldCreator.getMDCFilterField()) as unknown as string;
				return parseXMLString(xmlString as unknown as string)[0];
			} else {
				const ownerComponent =
					oParentControl ?? view ? (Component.getOwnerComponentFor(oParentControl ?? view) as TemplateComponent) : undefined;
				// Runtime: direct control creation
				return ownerComponent
					? ownerComponent.runAsOwner(() => filterFieldCreator.getMDCFilterField())
					: filterFieldCreator.getMDCFilterField();
			}
		});
};
function _getCachedProperties(oFilterBar: IFilterControl | Element): null | PropertyInfo[] | undefined {
	// properties are not cached during templating
	if (oFilterBar instanceof window.Element) {
		return null;
	}
	return DelegateUtil.getCustomData<PropertyInfo[]>(oFilterBar, FETCHED_PROPERTIES_DATA_KEY);
}
function _setCachedProperties(oFilterBar: IFilterControl | Element, aFetchedProperties: PropertyInfo[]): void {
	// do not cache during templating, else it becomes part of the cached view
	if (oFilterBar instanceof window.Element) {
		return;
	}
	DelegateUtil.setCustomData(oFilterBar, FETCHED_PROPERTIES_DATA_KEY, aFetchedProperties as unknown as string);
}
function _getCachedOrFetchPropertiesForEntity(
	sEntityTypePath: string,
	oMetaModel: ODataMetaModel,
	oFilterBar: IFilterControl
): ControlPropertyInfo[] | PropertyInfoExternal[] {
	let aFetchedProperties = _getCachedProperties(oFilterBar);
	let localGroupLabel;

	if (!aFetchedProperties) {
		aFetchedProperties = ODataFilterBarDelegate.fetchPropertiesForEntity(sEntityTypePath, oMetaModel, oFilterBar);
		aFetchedProperties.forEach(function (oGroup: FEPropertyInfo) {
			localGroupLabel = null;
			if (oGroup.groupLabel) {
				localGroupLabel = getLocalizedText(oGroup.groupLabel, oFilterBar);
				oGroup.groupLabel = localGroupLabel === null ? oGroup.groupLabel : localGroupLabel;
			}
		});
		sortPropertyInfosByGroupLabel(aFetchedProperties);
		_setCachedProperties(oFilterBar, aFetchedProperties);
	}
	return aFetchedProperties;
}
ODataFilterBarDelegate.fetchProperties = async function (filterBar: FilterBar): Promise<PropertyInfoExternal[]> {
	const propertyInfos = await ODataFilterBarDelegate.fetchFilterProperties(filterBar as unknown as IFilterControl);
	DelegateUtil.setCustomData(filterBar, "feFilterInfo", propertyInfos);
	if (propertyInfos.length > 0) {
		return FilterUtils.formatPropertyInfo(propertyInfos as PropertyInfo[]) as PropertyInfoExternal[];
	} else {
		return [];
	}
};

ODataFilterBarDelegate.fetchFilterProperties = async function (
	filterBar: IFilterControl
): Promise<ControlPropertyInfo[] | PropertyInfoExternal[]> {
	const entityTypePath = DelegateUtil.getCustomData<string>(filterBar, "entityType")!;
	return DelegateUtil.fetchModel(filterBar as FilterBar).then(function (model: Model) {
		if (!model) {
			return [];
		}
		return _getCachedOrFetchPropertiesForEntity(entityTypePath, model.getMetaModel() as ODataMetaModel, filterBar);
	});
};

ODataFilterBarDelegate.getTypeMap = function (): typeof TypeMap {
	return TypeMap;
};

export default ODataFilterBarDelegate;
