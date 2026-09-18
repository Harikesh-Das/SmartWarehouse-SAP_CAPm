import type { Property } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import deepEqual from "sap/base/util/deepEqual";
import CommonUtils from "sap/fe/core/CommonUtils";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { getTypeConfig } from "sap/fe/core/converters/controls/Common/table/Columns";
import type { FilterRestrictionsInfoType, SortRestrictionsInfoType } from "sap/fe/core/helpers/MetaModelFunction";
import { getFilterRestrictionsInfo, getSortRestrictionsInfo, isMultiValueFilterExpression } from "sap/fe/core/helpers/MetaModelFunction";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { enhanceDataModelPath, getTargetObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { getDisplayMode } from "sap/fe/core/templating/DisplayModeFormatter";
import {
	getAssociatedCurrencyPropertyPath,
	getAssociatedTextPropertyPath,
	getAssociatedTimezonePropertyPath,
	getAssociatedUnitPropertyPath,
	getLabel
} from "sap/fe/core/templating/PropertyHelper";
import type { DefaultTypeForEdmType } from "sap/fe/core/type/EDM";
import { isTypeFilterable } from "sap/fe/core/type/EDM";
import type { FilterInfo, SerializedCollectionBindingInfo } from "sap/fe/macros/CollectionBindingInfo";
import CommonHelper from "sap/fe/macros/CommonHelper";
import MacrosDelegateUtil from "sap/fe/macros/DelegateUtil";
import type { FilterConditions } from "sap/fe/macros/filterBar/FilterHelper";
import { getPath, isFilterableProperty, isSortableProperty } from "sap/fe/macros/internal/valuehelp/TableDelegateHelper";
import ValueHelpDelegate from "sap/fe/macros/valuehelp/ValueHelpDelegate";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type { BaseAggregationBindingInfo } from "sap/ui/base/ManagedObject";
import Element from "sap/ui/core/Element";
import type FilterBar from "sap/ui/mdc/FilterBar";
import type Table from "sap/ui/mdc/Table";
import type { MDCTablePropertyInfo as PropertyInfo } from "sap/ui/mdc/Table";
import type ValueHelp from "sap/ui/mdc/ValueHelp";
import type { ConditionObject } from "sap/ui/mdc/condition/Condition";
import TableDelegate from "sap/ui/mdc/odata/v4/TableDelegate";
import TypeMap from "sap/ui/mdc/odata/v4/TypeMap";
import DelegateUtil from "sap/ui/mdc/odata/v4/util/DelegateUtil";
import FilterUtil from "sap/ui/mdc/util/FilterUtil";
import type MTable from "sap/ui/mdc/valuehelp/content/MTable";
import type Context from "sap/ui/model/Context";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import type Model from "sap/ui/model/Model";
import Sorter from "sap/ui/model/Sorter";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type { MetaModelEntitySetAnnotation } from "../../../../../../../../types/metamodel_types";

type ComplexPropertyMap = Record<string, Property>;

type MdcTableDelegate = { name: string; payload: Payload };

type Payload = {
	collectionName?: string;
	collectionPath?: string;
	defaultSortPropertyName?: string;
	hierarchyQualifier?: string;
	initialExpansionLevel?: number;
};
/**
 * Test delegate for OData V4.
 */
const ODataTableDelegate = Object.assign({}, TableDelegate);

/**
 * Fetches the relevant metadata for the table and returns property info array.
 * @param table Instance of the MDCtable
 * @returns Array of property info
 */
ODataTableDelegate.fetchProperties = async function (table: Table): Promise<PropertyInfo> {
	const model = await this._getModel(table);
	const properties = await this._createPropertyInfos(table, model);
	ODataTableDelegate.createInternalBindingContext(table);
	ODataTableDelegate.setSortConditions(table, properties);
	MacrosDelegateUtil.setCachedProperties(table, properties);
	(table.getBindingContext("internal") as Context).setProperty("tablePropertiesAvailable", true);
	return properties;
};

/**
 * Set sort conditions on the table.
 * @param table Valuehelp table instance
 * @param properties PropertyInfo array
 */
ODataTableDelegate.setSortConditions = function (table: Table, properties: PropertyInfo[]): void {
	const sortConditionsCD = table.data("sortConditions");
	const rawSortConditions = CommonHelper.parseCustomData(sortConditionsCD) as { sorters: { name: string }[] } | undefined;
	if (rawSortConditions?.sorters) {
		rawSortConditions.sorters.forEach((sortCondition) => {
			const infoName = ODataTableDelegate.convertPropertyPathToInfoName(sortCondition.name, properties);
			if (infoName && infoName !== sortCondition.name) {
				sortCondition.name = infoName;
			}
		});
		table.setSortConditions({ ...rawSortConditions });
	}
};

/**
 * Convert a property path to its corresponding info name.
 * @param propertyPath Property path to be converted.
 * @param properties Table PropertyInfo array
 * @returns Property info name if found, otherwise returns the original property path.
 */
ODataTableDelegate.convertPropertyPathToInfoName = function (propertyPath: string, properties: PropertyInfo[]): string {
	const propertyInfo = properties.find((column) => {
		return !column.propertyInfos && column.path === propertyPath;
	});
	return propertyInfo?.key ?? propertyPath;
};

ODataTableDelegate.createInternalBindingContext = function (table: Table): void {
	let dialog: ManagedObject | null = table;
	while (dialog && !dialog.isA("sap.ui.mdc.valuehelp.Dialog")) {
		dialog = (dialog as ManagedObject).getParent();
	}

	const internalModel = table.getModel("internal") as JSONModel;

	if (dialog && internalModel) {
		const internalBindingContext = dialog.getBindingContext("internal");
		let newInternalBindingContextPath;
		if (internalBindingContext) {
			newInternalBindingContextPath = internalBindingContext.getPath() + `::VHDialog::${dialog.getId()}::table`;
		} else {
			newInternalBindingContextPath = `/buildingblocks/${table.getId()}`;
			internalModel.setProperty("/buildingblocks", { ...internalModel.getProperty("/buildingblocks") });
		}
		const newInternalBindingContext = internalModel.bindContext(newInternalBindingContextPath).getBoundContext();
		table.setBindingContext(newInternalBindingContext, "internal");
	}
};

/**
 * Collect related properties from a property's annotations.
 * @param dataModelPropertyPath The model object path of the property.
 * @returns The related properties that were identified.
 * @private
 */
function collectRelatedProperties(dataModelPropertyPath: DataModelObjectPath<Property>): ComplexPropertyMap {
	const dataModelAdditionalPropertyPath = getAdditionalProperty(dataModelPropertyPath);
	const relatedProperties: ComplexPropertyMap = {};
	if (dataModelAdditionalPropertyPath?.targetObject) {
		const additionalProperty = dataModelAdditionalPropertyPath.targetObject;
		const additionalPropertyPath = getTargetObjectPath(dataModelAdditionalPropertyPath, true);

		const property = dataModelPropertyPath.targetObject as Property;
		const propertyPath = getTargetObjectPath(dataModelPropertyPath, true);

		const textAnnotation = property.annotations?.Common?.Text,
			textArrangement = textAnnotation?.annotations?.UI?.TextArrangement?.toString(),
			displayMode = textAnnotation && textArrangement && getDisplayMode(property, dataModelPropertyPath.targetEntityType);

		if (displayMode === "Description") {
			relatedProperties[additionalPropertyPath] = additionalProperty;
		} else if ((displayMode && displayMode !== "Value") || !textAnnotation) {
			relatedProperties[propertyPath] = property;
			relatedProperties[additionalPropertyPath] = additionalProperty;
		}
	}
	return relatedProperties;
}

ODataTableDelegate._createPropertyInfos = async function (table: Table, model: ODataModel): Promise<PropertyInfo[]> {
	const metadataInfo = (table.getDelegate() as { payload: Payload }).payload;
	const properties: PropertyInfo[] = [];
	const entitySetPath = `/${metadataInfo.collectionName}`;
	const metaModel = model.getMetaModel();

	return metaModel.requestObject(`${entitySetPath}@`).then(function (entitySetAnnotations: MetaModelEntitySetAnnotation) {
		const sortRestrictionsInfo = getSortRestrictionsInfo(entitySetAnnotations);
		const filterRestrictions = entitySetAnnotations["@Org.OData.Capabilities.V1.FilterRestrictions"];
		const filterRestrictionsInfo = getFilterRestrictionsInfo(filterRestrictions);
		const filterFunctions = entitySetAnnotations["@Org.OData.Capabilities.V1.FilterFunctions"];
		const caseSensitive = ModelHelper.isFilteringCaseSensitive(metaModel, filterFunctions);
		const customDataForColumns = MacrosDelegateUtil.getCustomData<{
			customData: (PropertyInfo & { $Type: keyof typeof DefaultTypeForEdmType })[];
		}>(table, "columns")!;
		const propertiesToBeCreated: Record<string, Property> = {};
		const dataModelEntityPath = getInvolvedDataModelObjects((table.getModel() as ODataModel).getMetaModel().getContext(entitySetPath));
		customDataForColumns.customData.forEach(function (columnDef: PropertyInfo & { $Type: keyof typeof DefaultTypeForEdmType }) {
			let typeConfig = isTypeFilterable(columnDef.$Type)
				? table.getTypeMap().getTypeConfig(columnDef.$Type)
				: TypeMap.getTypeConfig("sap.ui.model.odata.type.String");
			const propertyInfo: PropertyInfo = {
				key: columnDef.path!,
				label: columnDef.label
			};

			const dataModelPropertyPath = enhanceDataModelPath<Property>(dataModelEntityPath, columnDef.path);
			const property = dataModelPropertyPath.targetObject as Property;
			if (property) {
				const targetPropertyPath = getTargetObjectPath(dataModelPropertyPath, true);
				if (isTypeFilterable(property.type as keyof typeof DefaultTypeForEdmType)) {
					const propertyTypeConfig = getTypeConfig(property);
					typeConfig =
						TypeMap.getTypeConfig(
							propertyTypeConfig.type ?? "sap.ui.model.odata.type.String",
							propertyTypeConfig.formatOptions,
							propertyTypeConfig.constraints
						) ?? typeConfig;
				}
				//Check if there is an additional property linked to the property as a Unit, Currency, Timezone or textArrangement
				const relatedPropertiesInfo = collectRelatedProperties(dataModelPropertyPath);
				const relatedPropertyPaths: string[] = Object.keys(relatedPropertiesInfo);

				if (relatedPropertyPaths.length) {
					propertyInfo.propertyInfos = relatedPropertyPaths;
					// Collect information of related columns to be created.
					relatedPropertyPaths.forEach((path) => {
						propertiesToBeCreated[path] = relatedPropertiesInfo[path];
					});
					// Also add property for the inOut Parameters on the ValueHelp when textArrangement is set to #TextOnly
					// It will not be linked to the complex Property (BCP 2270141154)
					if (!relatedPropertyPaths.find((path) => relatedPropertiesInfo[path] === property)) {
						propertiesToBeCreated[targetPropertyPath] = property;
					}
				} else {
					propertyInfo.path = columnDef.path;
					propertyInfo.dataType = typeConfig.className;
					propertyInfo.constraints = typeConfig.typeInstance.oConstraints;
					propertyInfo.formatOptions = typeConfig.typeInstance.oFormatOptions;
					propertyInfo.sortable = isSortableProperty(sortRestrictionsInfo, columnDef);
					propertyInfo.filterable = isFilterableProperty(filterRestrictionsInfo, columnDef);
					propertyInfo.maxConditions = getPropertyMaxConditions(filterRestrictionsInfo, columnDef);
					propertyInfo.caseSensitive = caseSensitive;
				}
			} else {
				propertyInfo.path = columnDef.path;
				propertyInfo.caseSensitive = caseSensitive;
				propertyInfo.dataType = typeConfig.className;
			}
			properties.push(propertyInfo);
		});
		const relatedColumns = createRelatedProperties(
			propertiesToBeCreated,
			properties,
			sortRestrictionsInfo,
			filterRestrictionsInfo,
			caseSensitive
		);
		return properties.concat(relatedColumns);
	});
};

/**
 * Updates the binding info with the relevant path and model from the metadata.
 * @param mdcTable The MDCTable instance
 * @param bindingInfo The bindingInfo of the table
 */
ODataTableDelegate.updateBindingInfo = function (mdcTable: Table, bindingInfo: SerializedCollectionBindingInfo): void {
	TableDelegate.updateBindingInfo.apply(this, [mdcTable, bindingInfo]);

	const metadataInfo = (mdcTable.getDelegate() as MdcTableDelegate).payload;

	if (metadataInfo) {
		bindingInfo.path = bindingInfo?.path || metadataInfo.collectionPath || `/${metadataInfo.collectionName}`;
	}

	bindingInfo.parameters = bindingInfo.parameters || {};

	const filterBar = Element.getElementById(mdcTable.getFilter()) as FilterBar,
		isFilterEnabled = mdcTable.isFilteringEnabled();
	let conditions: Record<string, FilterConditions[]>;
	let innerFilterInfo, outerFilterInfo: FilterInfo;
	const filters = [];
	const tableProperties = MacrosDelegateUtil.getCachedProperties(mdcTable) as unknown as PropertyInfo[];

	//TODO: consider a mechanism ('FilterMergeUtil' or enhance 'FilterUtil') to allow the connection between different filters)
	if (isFilterEnabled) {
		conditions = mdcTable.getConditions();
		innerFilterInfo = FilterUtil.getFilterInfo(mdcTable, conditions, tableProperties, []) as FilterInfo;
		if (innerFilterInfo.filters) {
			filters.push(innerFilterInfo.filters);
		}
	}
	const isTreeTable = !!metadataInfo?.hierarchyQualifier;
	if (isTreeTable) {
		bindingInfo.parameters.$$aggregation = {
			hierarchyQualifier: metadataInfo.hierarchyQualifier,
			expandTo: metadataInfo.initialExpansionLevel
		};
	}
	if (filterBar) {
		conditions = filterBar.getConditions();
		if (conditions) {
			const parameterNames = DelegateUtil.getParameterNames(filterBar);
			// The table properties needs to updated with the filter field if no Selectionfields are annotated and not part as value help parameter
			const propertyInfos =
				MacrosDelegateUtil.getCachedProperties(filterBar) ??
				ODataTableDelegate._updatePropertyInfo(tableProperties, mdcTable, conditions, metadataInfo);
			outerFilterInfo = FilterUtil.getFilterInfo(filterBar, conditions, propertyInfos, parameterNames);

			if (outerFilterInfo.filters) {
				filters.push(outerFilterInfo.filters);
			}

			const parameterPath = DelegateUtil.getParametersInfo(filterBar, conditions);
			if (parameterPath) {
				bindingInfo.path = parameterPath;
			}
		}
		// Check if search is supported before updating binding
		const content = mdcTable.getParent() as MTable;
		const valueHelp = content.getParent()?.getParent() as ValueHelp;
		const isSearchSupported = ValueHelpDelegate.isSearchSupported(valueHelp, content);
		if (!isTreeTable) {
			// get the basic search
			if (isSearchSupported) {
				bindingInfo.parameters.$search = CommonUtils.normalizeSearchTerm(filterBar.getSearch()) || undefined;
			}
		} else if (filterBar.getSearch()) {
			if (!bindingInfo.parameters.$$aggregation) {
				bindingInfo.parameters.$$aggregation = {};
			}
			if (isSearchSupported) {
				bindingInfo.parameters.$$aggregation.search = CommonUtils.normalizeSearchTerm(filterBar.getSearch());
				bindingInfo.parameters.$$aggregation.expandTo = Number.MAX_SAFE_INTEGER;
			}
		}
	}
	// BCP: 2370078660 - sharedRequest is set to false in order to avoid deadlock situation where the the oData
	// model cache is neither changeable (result of ListBinding.$$sharedRequest = true) nor deletable
	// (result of Context.setSelected(true) -> ListBinding.keepAlive)
	bindingInfo.parameters.$$sharedRequest = false;

	this._applyDefaultSorting(bindingInfo, (mdcTable.getDelegate() as MdcTableDelegate).payload);
	// add select to bindingInfo (BCP 2170163012)
	bindingInfo.parameters.$select = tableProperties?.reduce(function (query: string, property: PropertyInfo) {
		// Navigation properties (represented by X/Y) should not be added to $select.
		// ToDo : They should be added as $expand=X($select=Y) instead
		if (property.path && !property.path.includes("/")) {
			query = query ? `${query},${property.path}` : property.path;
		}
		return query;
	}, "");

	// Add $count
	bindingInfo.parameters.$count = true;

	//If the entity is DraftEnabled add a DraftFilter
	if (bindingInfo.path && ModelHelper.isDraftSupported(mdcTable.getModel()?.getMetaModel() as ODataMetaModel, bindingInfo.path)) {
		filters.push(new Filter("IsActiveEntity", FilterOperator.EQ, true));
	}
	bindingInfo.filters = new Filter(filters as Filter[], true);
};

ODataTableDelegate.getTypeMap = function (): object {
	return TypeMap;
};

/**
 * Get table Model.
 * @param table Instance of the MDCtable
 * @returns Model
 */
ODataTableDelegate._getModel = async function (table: Table): Promise<Model> {
	const metadataInfo = (table.getDelegate() as { payload: { model: string } }).payload;
	let model: Model = table.getModel(metadataInfo.model)!;
	if (!model) {
		await new Promise((resolve) => {
			table.attachEventOnce("modelContextChange", resolve);
		});
		model = table.getModel(metadataInfo.model)!;
	}
	return model;
};

/**
 * Applies a default sort order if needed. This is only the case if the request is not a $search request
 * (means the parameter $search of the bindingInfo is undefined) and if a sort order has not been set already,
 * for example, using a presentation variant or manually set by the user.
 * @param bindingInfo The bindingInfo of the table
 * @param payload The payload of the TableDelegate
 */
ODataTableDelegate._applyDefaultSorting = function (bindingInfo: SerializedCollectionBindingInfo, payload: Payload): void {
	if (
		bindingInfo.parameters &&
		bindingInfo.parameters.$search == undefined &&
		bindingInfo.parameters.$$aggregation?.search == undefined &&
		bindingInfo.sorter &&
		bindingInfo.sorter.length == 0
	) {
		const defaultSortPropertyName = payload ? payload.defaultSortPropertyName : undefined;
		if (defaultSortPropertyName) {
			bindingInfo.sorter.push(new Sorter(defaultSortPropertyName, false));
		}
	}
};

/**
 * Updates the table properties with filter field infos.
 * @param aTableProperties Array with table properties
 * @param oMDCTable The MDCTable instance
 * @param mConditions The conditions of the table
 * @param oMetadataInfo The metadata info of the filter field
 */
ODataTableDelegate._updatePropertyInfo = function (
	aTableProperties: PropertyInfo[],
	oMDCTable: Table,
	mConditions: Record<string, ConditionObject[]>,
	oMetadataInfo: Payload
): void {
	const aConditionKey = Object.keys(mConditions),
		oMetaModel = (oMDCTable.getModel() as ODataModel).getMetaModel()!;
	aConditionKey.forEach(function (conditionKey: string) {
		// The typeConfig is not set in the table propertyInfos, but we need to set it for the filter fields
		const conditionKeyType = oMetaModel.getObject(`/${oMetadataInfo.collectionName}/${conditionKey}`)?.$Type ?? "Edm.String";
		const typeConfig = oMDCTable.getTypeMap().getTypeConfig(conditionKeyType);
		aTableProperties.forEach((tableProperty, index) => {
			if (tableProperty.path === conditionKey) {
				(aTableProperties[index] as PropertyInfo & { typeConfig: object }).typeConfig = typeConfig;
			}
		});
		if (
			aTableProperties.findIndex(function (tableProperty: PropertyInfo) {
				return tableProperty.path === conditionKey;
			}) === -1
		) {
			const oColumnDef: PropertyInfo = {
				key: conditionKey,
				label: conditionKey,
				path: conditionKey,
				dataType: typeConfig.typeInstance.baseType,
				formatOptions: typeConfig.typeInstance?.oFormatOptions,
				constraints: typeConfig.typeInstance?.oConstraints,
				typeConfig: typeConfig
			};
			aTableProperties.push(oColumnDef);
		}
	});
};

ODataTableDelegate.updateBinding = function (
	oTable: Table,
	oBindingInfo: BaseAggregationBindingInfo & {
		parameters: {
			$search?: string;
		};
	},
	oBinding: ODataListBinding
): void {
	let bNeedManualRefresh = false;
	const oInternalBindingContext = oTable.getBindingContext("internal");
	const sManualUpdatePropertyKey = "pendingManualBindingUpdate";
	const sLastSearch = "lastSearch";
	const sLastFilter = "lastFilter";
	const bPendingManualUpdate = oInternalBindingContext?.getProperty(sManualUpdatePropertyKey);
	const lastSearch = oInternalBindingContext?.getProperty(sLastSearch);
	const lastFilter = oInternalBindingContext?.getProperty(sLastFilter);
	let oRowBinding = oTable.getRowBinding();

	//oBinding=null means that a rebinding needs to be forced via updateBinding in mdc TableDelegate
	TableDelegate.updateBinding.apply(ODataTableDelegate, [oTable, oBindingInfo, oBinding]);
	//get row binding after rebind from TableDelegate.updateBinding in case oBinding was null
	if (!oRowBinding) {
		oRowBinding = oTable.getRowBinding();
	}
	if (oRowBinding) {
		/**
		 * Manual refresh if filters are not changed by binding.refresh() since updating the bindingInfo
		 * is not enough to trigger a batch request.
		 * In case there is no internalBindingContext (see BCP 2280161524) we can not determine if a manual
		 * refresh is needed or not. Therefore, we always refresh in this special case
		 */
		bNeedManualRefresh = oInternalBindingContext
			? deepEqual(oBindingInfo.filters, lastFilter) && oBindingInfo.parameters?.$search === lastSearch && !bPendingManualUpdate
			: true;
	}
	oInternalBindingContext?.setProperty(sLastSearch, oBindingInfo.parameters?.$search);
	oInternalBindingContext?.setProperty(sLastFilter, oBindingInfo.filters);

	if (bNeedManualRefresh && oTable.getFilter()) {
		oInternalBindingContext?.setProperty(sManualUpdatePropertyKey, true);
		oRowBinding
			.requestRefresh(oRowBinding.getGroupId())
			.finally(function () {
				oInternalBindingContext?.setProperty(sManualUpdatePropertyKey, false);
			})
			.catch(function (oError: unknown) {
				Log.error("Error while refreshing a filterBar VH table", oError as string);
			});
	}
	oTable.fireEvent("bindingUpdated");
	//no need to check for semantic targets here since we are in a VH and don't want to allow further navigation
};

/**
 * Creates a simple property for each identified complex property.
 * @param propertiesToBeCreated Identified properties.
 * @param existingColumns The list of columns created for properties defined on the Value List.
 * @param sortRestrictionsInfo An object containing the sort restriction information
 * @param filterRestrictionsInfo An object containing the filter restriction information
 * @param caseSensitive
 * @returns The array of properties created.
 * @private
 */
function createRelatedProperties(
	propertiesToBeCreated: Record<string, Property>,
	existingColumns: PropertyInfo[],
	sortRestrictionsInfo: SortRestrictionsInfoType,
	filterRestrictionsInfo: FilterRestrictionsInfoType,
	caseSensitive?: boolean
): PropertyInfo[] {
	const relatedPropertyNameMap: Record<string, string> = {},
		relatedColumns: PropertyInfo[] = [];
	Object.keys(propertiesToBeCreated).forEach((path) => {
		const property = propertiesToBeCreated[path],
			relatedColumn = existingColumns.find((column) => column.path === path); // Complex properties doesn't have path so only simple column are found
		if (!relatedColumn) {
			const newName = `Property::${path}`;
			relatedPropertyNameMap[path] = newName;
			const propertyTypeConfig = getTypeConfig(property);
			const valueHelpColumnTypeConfig = TypeMap.getTypeConfig(
				propertyTypeConfig.type ?? "sap.ui.model.odata.type.String",
				propertyTypeConfig.formatOptions,
				propertyTypeConfig.constraints
			);
			const valueHelpTableColumn: PropertyInfo = {
				key: newName,
				label: getLabel(property),
				path,
				sortable: isSortableProperty(sortRestrictionsInfo, property),
				filterable: isFilterableProperty(filterRestrictionsInfo, property),
				dataType: valueHelpColumnTypeConfig.className,
				formatOptions: isTypeFilterable(property.type as keyof typeof DefaultTypeForEdmType)
					? propertyTypeConfig.formatOptions
					: undefined,
				constraints: isTypeFilterable(property.type as keyof typeof DefaultTypeForEdmType)
					? propertyTypeConfig.constraints
					: undefined,
				caseSensitive
			};
			valueHelpTableColumn.maxConditions = getPropertyMaxConditions(filterRestrictionsInfo, valueHelpTableColumn);
			relatedColumns.push(valueHelpTableColumn);
		}
	});
	// The property 'key' has been prefixed with 'Property::' for uniqueness.
	// Update the same in other propertyInfos[] references which point to this property.
	existingColumns.forEach((column) => {
		if (column.propertyInfos) {
			column.propertyInfos = column.propertyInfos?.map((columnName) => relatedPropertyNameMap[columnName] ?? columnName);
		}
	});
	return relatedColumns;
}

/**
 * Identifies the maxConditions for a given property.
 * @param filterRestrictionsInfo The filter restriction information from the restriction annotation.
 * @param property The target property.
 * @returns `-1` or `1` if the property is a MultiValueFilterExpression.
 * @private
 */

function getPropertyMaxConditions(filterRestrictionsInfo: FilterRestrictionsInfoType, property: PropertyInfo | Property): number {
	const propertyPath = getPath(property);
	return propertyPath &&
		filterRestrictionsInfo.propertyInfo?.hasOwnProperty(propertyPath) &&
		isMultiValueFilterExpression(filterRestrictionsInfo.propertyInfo[propertyPath] as unknown as string)
		? -1
		: 1;
}

/**
 * Identifies the additional property which references to the unit, timezone, textArrangement or currency.
 * @param dataModelPropertyPath The model object path of the property.
 * @returns The additional property.
 * @private
 */
function getAdditionalProperty(dataModelPropertyPath: DataModelObjectPath<Property>): DataModelObjectPath<Property> | undefined {
	const property = dataModelPropertyPath.targetObject;
	const additionalPropertyPath =
		property &&
		(getAssociatedTextPropertyPath(property) ||
			getAssociatedCurrencyPropertyPath(property) ||
			getAssociatedUnitPropertyPath(property) ||
			getAssociatedTimezonePropertyPath(property));
	if (!additionalPropertyPath) {
		return undefined;
	}
	const dataModelAdditionalProperty = enhanceDataModelPath<Property>(dataModelPropertyPath, additionalPropertyPath);

	//Additional Property could refer to a navigation property, keep the key and path as navigation property
	const additionalProperty = dataModelAdditionalProperty.targetObject;
	if (!additionalProperty) {
		return undefined;
	}
	return dataModelAdditionalProperty;
}

export default ODataTableDelegate;
