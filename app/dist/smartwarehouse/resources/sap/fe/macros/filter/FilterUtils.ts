import type { EntityType, Property } from "@sap-ux/vocabularies-types";
import type { PropertyPath } from "@sap-ux/vocabularies-types/Edm";
import { CommonAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/Common";
import type { SelectionFields } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import merge from "sap/base/util/merge";
import type AppComponent from "sap/fe/core/AppComponent";
import type { BaseTreeModifier } from "sap/fe/core/CommonUtils";
import CommonUtils from "sap/fe/core/CommonUtils";
import ConverterContext from "sap/fe/core/converters/ConverterContext";
import type {
	BaseManifestSettings,
	ControlConfiguration,
	FilterManifestConfiguration,
	HiddenDraft
} from "sap/fe/core/converters/ManifestSettings";
import ManifestWrapper from "sap/fe/core/converters/ManifestWrapper";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import type { IDiagnostics } from "sap/fe/core/converters/TemplateConverter";
import type { TableVisualization } from "sap/fe/core/converters/controls/Common/Table";
import type { PropertyTypeConfig } from "sap/fe/core/converters/controls/Common/table/Columns";
import * as FilterBarConverter from "sap/fe/core/converters/controls/ListReport/FilterBar";
import { type FilterField, type PropertyInfo, type PropertyInfoExternal } from "sap/fe/core/converters/controls/ListReport/FilterBar";
import { getAllCustomAggregates } from "sap/fe/core/helpers/MetaModelFunction";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { getContextRelativeTargetObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { ODATA_TYPE_MAPPING } from "sap/fe/core/templating/DisplayModeFormatter";
import CommonHelper from "sap/fe/macros/CommonHelper";
import DelegateUtil from "sap/fe/macros/DelegateUtil";
import type TableAPI from "sap/fe/macros/Table";
import { type default as FEFilterBar } from "sap/fe/macros/controls/FilterBar";
import SemanticDateOperators from "sap/fe/macros/filterBar/SemanticDateOperators";
import type { AnnotationValueListType } from "sap/fe/macros/internal/valuehelp/ValueListHelper";
import type { InternalBindingInfo } from "sap/fe/macros/table/Utils";
import type ListReportController from "sap/fe/templates/ListReport/ListReportController.controller";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import Element from "sap/ui/core/Element";
import type Chart from "sap/ui/mdc/Chart";
import type FilterBar from "sap/ui/mdc/FilterBar";
import type Table from "sap/ui/mdc/Table";
import type { ConditionObject } from "sap/ui/mdc/condition/Condition";
import Condition from "sap/ui/mdc/condition/Condition";
import ConditionConverter from "sap/ui/mdc/condition/ConditionConverter";
import ConditionValidated from "sap/ui/mdc/enums/ConditionValidated";
import OperatorName from "sap/ui/mdc/enums/OperatorName";
import type { IFilter } from "sap/ui/mdc/library";
import TypeMap from "sap/ui/mdc/odata/v4/TypeMap";
import StateUtil from "sap/ui/mdc/p13n/StateUtil";
import FilterUtil from "sap/ui/mdc/util/FilterUtil";
import type MDCValueHelpFilterBar from "sap/ui/mdc/valuehelp/FilterBar";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import ODataUtils from "sap/ui/model/odata/v4/ODataUtils";
import type FilterBarAPI from "../FilterBar";
import EDITSTATE from "../filterBar/DraftEditState";
import type { FilterBarTemplateProperties } from "../filterBar/FilterBarTemplate";

export type IFilterControl = Control & {
	getSearch?: () => string;
	getPropertyInfoSet?: () => PropertyInfo[];
	getPropertyInfo?: () => PropertyInfo[];
	getTypeMap: () => TypeMap;
	getControlDelegate?: () => {
		fetchPropertiesForEntity: (sEntitySetPath: string, oMetaModel: ODataMetaModel, oControl: Control) => PropertyInfo[];
	};
	isInitialized?: () => boolean;
	getCurrentState?: () => { items?: { key: string }[] };
} & IFilter;
enum PropertyInfoKeys {
	hiddenFilter = "hiddenFilter",
	required = "required",
	path = "path",
	tooltip = "tooltip",
	visible = "visible",
	maxConditions = "maxConditions",
	formatOptions = "formatOptions",
	constraints = "constraints",
	group = "group",
	groupLabel = "groupLabel",
	caseSensitive = "caseSensitive"
}

const CONDITION_PATH_TO_PROPERTY_PATH_REGEX = /[+*]/g;

const oFilterUtils = {
	/**
	 * Gets the extra parameters for the converter context based on filter field configurations.
	 * @param filterBar The filter bar context (FilterBarAPI or FilterBar.block)
	 * @param relAnnoPath FilterBar annotation path relative to fitler context path, like. "@com.sap.vocabularies.UI.v1.SelectionFields" or "@com.sap.vocabularies.UI.v1.SelectionFields#SF2"
	 * @param filterBarContextPath FilterBar context path, like "/SO" or "/SO/_Item"
	 * @param pageContextPath Present page or view context path of manifest entry, like "/SO"
	 * @returns Extra parameters object with filter field configurations
	 */
	getExtraParams: function (
		filterBar: FilterBarTemplateProperties,
		relAnnoPath: string,
		filterBarContextPath: string,
		pageContextPath?: string
	): Record<string, FilterManifestConfiguration> {
		const filterConfigPath = FilterBarConverter.getFilterConfigurationPath(relAnnoPath, filterBarContextPath, pageContextPath);
		const extraParams: Record<string, FilterManifestConfiguration> = {};
		extraParams[filterConfigPath] = {
			filterFields: filterBar.filterFieldConfigs ?? {},
			navigationPropertiesForPersonalization: Array.isArray(filterBar.navigationPropertiesForPersonalization)
				? filterBar.navigationPropertiesForPersonalization
				: filterBar.navigationPropertiesForPersonalization?.split(",").map((s) => s.trim())
		};
		return extraParams;
	},

	getFilter: function (vIFilter: string | IFilterControl | null): Filter | undefined {
		const aFilters = oFilterUtils.getFilterInfo(vIFilter).filters;
		return aFilters?.length ? new Filter(aFilters, false) : undefined;
	},
	getFilterField: function (propertyPath: string, converterContext: ConverterContext, entityType: EntityType): FilterField | undefined {
		return FilterBarConverter.getFilterField(propertyPath, converterContext, entityType);
	},
	buildProperyInfo: function (propertyInfoField: FilterField, converterContext: ConverterContext): PropertyInfo {
		let oPropertyInfo;
		const aTypeConfig: Record<string, PropertyTypeConfig> = {};
		const propertyConvertyContext = converterContext.getConverterContextFor<Property>(propertyInfoField.annotationPath);
		const propertyTargetObject = propertyConvertyContext.getDataModelObjectPath().targetObject;
		const oTypeConfig = FilterBarConverter.fetchTypeConfig(propertyTargetObject);
		oPropertyInfo = FilterBarConverter.fetchPropertyInfo(converterContext, propertyInfoField, oTypeConfig);
		aTypeConfig[propertyInfoField.key] = oTypeConfig;
		oPropertyInfo = FilterBarConverter.assignDataTypeToPropertyInfo(oPropertyInfo, converterContext, [], aTypeConfig);
		return oPropertyInfo;
	},
	createConverterContext: function (
		oFilterControl: IFilterControl,
		sEntityTypePath: string | undefined,
		metaModel?: ODataMetaModel,
		appComponent?: AppComponent
	): ConverterContext {
		const sFilterEntityTypePath = DelegateUtil.getCustomData<string>(oFilterControl, "entityType"),
			contextPath = sEntityTypePath || sFilterEntityTypePath;

		const oView = (oFilterControl as Partial<IFilterControl>).isA ? CommonUtils.getTargetView(oFilterControl.getParent()) : null;
		const oMetaModel = (metaModel || oFilterControl.getModel()!.getMetaModel()) as ODataMetaModel;
		const oAppComponent = appComponent || (oView && CommonUtils.getAppComponent(oView));
		const oVisualizationObjectPath = MetaModelConverter.getInvolvedDataModelObjects(oMetaModel.createBindingContext(contextPath!)!);
		let manifestSettings: BaseManifestSettings | undefined;
		if (oFilterControl.isA && !oFilterControl.isA<MDCValueHelpFilterBar>("sap.ui.mdc.valuehelp.FilterBar")) {
			manifestSettings = ((oView && oView.getViewData()) || {}) as BaseManifestSettings;
			if (
				oFilterControl.isA<FEFilterBar>("sap.fe.macros.controls.FilterBar") &&
				oFilterControl.getParent()?.isA<FilterBarAPI>("sap.fe.macros.FilterBar")
			) {
				const relAnnoPath = oFilterControl.data("annotationPath");
				const filterBarContextPath = oFilterControl.data("entityType");
				if (relAnnoPath && filterBarContextPath) {
					const pageContextPath =
						manifestSettings?.contextPath ?? (manifestSettings?.entitySet ? `/${manifestSettings.entitySet}` : undefined);
					const extraParams = oFilterUtils.getExtraParams(
						oFilterControl.getParent() as FilterBarAPI,
						relAnnoPath,
						filterBarContextPath,
						pageContextPath
					);
					manifestSettings.controlConfiguration = merge(
						extraParams ?? {},
						manifestSettings.controlConfiguration ?? {}
					) as ControlConfiguration;
				}
			}
		}
		return ConverterContext.createConverterContextForMacro(
			oVisualizationObjectPath.startingEntitySet.name,
			oMetaModel,
			oAppComponent?.getDiagnostics() as unknown as IDiagnostics,
			merge,
			oVisualizationObjectPath.contextLocation,
			new ManifestWrapper((manifestSettings ?? {}) as BaseManifestSettings)
		);
	},
	getConvertedFilterFields: function (
		oFilterControl: IFilterControl,
		sEntityTypePath: string | undefined,
		includeHidden?: boolean,
		metaModel?: ODataMetaModel,
		appComponent?: AppComponent,
		oModifier?: BaseTreeModifier,
		lineItemTerm?: string,
		propertyInfosFromFilterBar?: PropertyInfo[]
	): FilterField[] {
		const oMetaModel = this._getFilterMetaModel(oFilterControl, metaModel);
		const sFilterEntityTypePath = DelegateUtil.getCustomData<string>(oFilterControl, "entityType");
		const annotationPath = DelegateUtil.getCustomData<string>(oFilterControl, "annotationPath"),
			contextPath = sEntityTypePath || sFilterEntityTypePath;

		const lrTables: TableVisualization[] = this._getFieldsForTable(oFilterControl, sEntityTypePath);

		const oConverterContext = this.createConverterContext(oFilterControl, sEntityTypePath, metaModel ?? oMetaModel, appComponent);

		//aSelectionFields = FilterBarConverter.getSelectionFields(oConverterContext);
		return this._getSelectionFields(
			oFilterControl,
			sEntityTypePath,
			sFilterEntityTypePath!,
			contextPath!,
			lrTables,
			oMetaModel,
			oConverterContext,
			includeHidden,
			oModifier,
			lineItemTerm,
			annotationPath,
			propertyInfosFromFilterBar
		);
	},

	getBindingPathForParameters: function (
		oIFilter: IFilterControl,
		mConditions: Record<string, ConditionObject[]>,
		aFilterPropertiesMetadata: PropertyInfo[] | null,
		aParameters: string[]
	): string {
		const aParams: string[] = [];
		aFilterPropertiesMetadata = oFilterUtils.setTypeConfigToProperties(aFilterPropertiesMetadata)!;
		// Collecting all parameter values from conditions
		for (const sFieldPath of aParameters) {
			if (mConditions[sFieldPath] && mConditions[sFieldPath].length > 0) {
				// We would be using only the first condition for parameter value.
				const oConditionInternal = merge({}, mConditions[sFieldPath][0]) as ConditionObject;
				const oProperty = FilterUtil.getPropertyByKey(aFilterPropertiesMetadata, sFieldPath) as PropertyInfo;
				const oTypeConfig =
					oProperty.typeConfig || TypeMap.getTypeConfig(oProperty.dataType, oProperty.formatOptions, oProperty.constraints);
				const mInternalParameterCondition = ConditionConverter.toType(oConditionInternal, oTypeConfig, oIFilter.getTypeMap());
				const sEdmType = ODATA_TYPE_MAPPING[oTypeConfig.className];
				aParams.push(
					`${sFieldPath}=${encodeURIComponent(ODataUtils.formatLiteral(mInternalParameterCondition.values[0], sEdmType))}`
				);
			}
		}

		// Binding path from EntityType
		const sEntityTypePath = oIFilter.data("entityType");
		const sEntitySetPath = sEntityTypePath.substring(0, sEntityTypePath.length - 1);
		const sParameterEntitySet = sEntitySetPath.slice(0, sEntitySetPath.lastIndexOf("/"));
		const sTargetNavigation = sEntitySetPath.substring(sEntitySetPath.lastIndexOf("/") + 1);
		// create parameter context
		return `${sParameterEntitySet}(${aParams.toString()})/${sTargetNavigation}`;
	},

	getEditStateIsHideDraft: function (mConditions?: Record<string, ConditionObject[]>): boolean {
		let bIsHideDraft = false;
		if (mConditions && mConditions.$editState) {
			if (
				mConditions.$editState?.[0]?.values.includes("ALL_HIDING_DRAFTS") ||
				mConditions.$editState?.[0]?.values.includes("SAVED_ONLY")
			) {
				bIsHideDraft = true;
			}
		}
		return bIsHideDraft;
	},
	/**
	 * Gets all filters that originate from the MDC FilterBar.
	 * @param vIFilter String or object instance related to MDC_FilterBar/Table/Chart
	 * @param mProperties Properties on filters that are to be retrieved. Available parameters:
	 * @param mProperties.ignoredProperties Array of property names which should be not considered for filtering
	 * @param mProperties.propertiesMetadata Array with all the property metadata. If not provided, properties will be retrieved from vIFilter.
	 * @param mProperties.targetControl MDC_table or chart. If provided, property names which are not relevant for the target control entitySet are not considered.
	 * @param mFilterConditions Map with externalized filter conditions.
	 * @returns FilterBar filters and basic search
	 * @private
	 */
	getFilterInfo: function (
		vIFilter: string | IFilterControl | null,
		mProperties?: { ignoredProperties?: string[]; propertiesMetadata?: PropertyInfo[]; targetControl?: Control },
		mFilterConditions?: Record<string, ConditionObject[]>
	): InternalBindingInfo {
		let aIgnoreProperties = (mProperties && mProperties.ignoredProperties) || [];
		const oTargetControl = mProperties && mProperties.targetControl,
			sTargetEntityPath = oTargetControl ? oTargetControl.data("entityType") : undefined;
		const mParameters: Record<string, string> = {};
		let oIFilter: IFilterControl = vIFilter as IFilterControl,
			sSearch: string | null = null,
			aFilters: Filter[] = [],
			sBindingPath,
			aPropertiesMetadata = mProperties && mProperties.propertiesMetadata;
		if (typeof vIFilter === "string") {
			oIFilter = Element.getElementById(vIFilter) as unknown as IFilterControl;
		}
		if (oIFilter) {
			sSearch = this._getSearchField(oIFilter, aIgnoreProperties);
			const mConditions = this._getFilterConditions(mProperties, mFilterConditions!, oIFilter);
			let aFilterPropertiesMetadata: PropertyInfo[] | null;
			if (oIFilter.isA<FilterBar>("sap.ui.mdc.FilterBar")) {
				aFilterPropertiesMetadata = this.getFilterPropertyInfo(oIFilter);
			} else {
				aFilterPropertiesMetadata = oIFilter.getPropertyInfoSet ? oIFilter.getPropertyInfoSet() : null;
			}
			aFilterPropertiesMetadata = this._getFilterPropertiesMetadata(aFilterPropertiesMetadata, oIFilter);
			if (mProperties && mProperties.targetControl && mProperties.targetControl.isA("sap.ui.mdc.Chart")) {
				Object.keys(mConditions).forEach(function (sKey: string) {
					if (sKey === "$editState") {
						delete mConditions["$editState"];
					}
				});
			}
			let aParameters = oIFilter.data("parameters") || [];
			aParameters = typeof aParameters === "string" ? JSON.parse(aParameters) : aParameters;
			if (aParameters && aParameters.length > 0) {
				// Binding path changes in case of parameters.
				sBindingPath = oFilterUtils.getBindingPathForParameters(oIFilter, mConditions, aFilterPropertiesMetadata, aParameters);
				if (Object.keys(mConditions).length) {
					Object.keys(mConditions).forEach((param) => {
						aParameters.forEach((requiredParam: string) => {
							if (param === requiredParam) {
								const mParametersValue = mConditions[param][0].values;
								mParameters[requiredParam] = mParametersValue[0];
							}
						});
					});
				}
			}
			if (mConditions) {
				//Exclude Interface Filter properties that are not relevant for the Target control entitySet
				if (sTargetEntityPath && oIFilter.data("entityType") && oIFilter.data("entityType") !== sTargetEntityPath) {
					const oMetaModel = oIFilter.getModel()!.getMetaModel() as ODataMetaModel;
					const aTargetPropertiesMetadata = oIFilter
						.getControlDelegate?.()
						.fetchPropertiesForEntity(sTargetEntityPath, oMetaModel, oIFilter) as PropertyInfo[];
					aPropertiesMetadata = aTargetPropertiesMetadata;

					const _aIgnoreProperties = this._getIgnoredProperties(
						aFilterPropertiesMetadata as PropertyInfo[],
						aTargetPropertiesMetadata
					);
					if (_aIgnoreProperties.length > 0) {
						aIgnoreProperties = aIgnoreProperties.concat(_aIgnoreProperties);
					}
				} else if (!aPropertiesMetadata && aFilterPropertiesMetadata) {
					aPropertiesMetadata = aFilterPropertiesMetadata;
				}
				// var aParamKeys = [];
				// aParameters.forEach(function (oParam) {
				// 	aParamKeys.push(oParam.key);
				// });
				aFilters = this.getEditStateAndFilter({
					oIFilter,
					mConditions,
					aPropertiesMetadata,
					aIgnoreProperties,
					aParameters
				});
			}
		}
		return { parameters: mParameters, filters: aFilters, search: sSearch || undefined, bindingPath: sBindingPath };
	},
	/**
	 * Gets the Filter params taking in consideration the Editing Status field,
	 * merges/overrides the data that's coming from FilterUtil.getFilterInfo, and,
	 * returns a mapped data to be sent to the backend.
	 * @param param Object
	 * @param param.oIFilter Object FilterBar instance
	 * @param param.mConditions Object Conditions that comes from the Filter Fields
	 * @param param.aPropertiesMetadata Array Filter metadata
	 * @param param.aIgnoreProperties Array of strings with the field keys which need to be ignored
	 * @param param.aParameters Array URL params that also need to be ignore and are merged into the aIgnoreProperties
	 * @returns FilterBar filters array
	 */
	getEditStateAndFilter: function ({
		oIFilter,
		mConditions,
		aPropertiesMetadata,
		aIgnoreProperties,
		aParameters
	}: {
		oIFilter: IFilterControl;
		mConditions: Record<string, ConditionObject[]>;
		aPropertiesMetadata: PropertyInfo[] | undefined;
		aIgnoreProperties: string[];
		aParameters: ConcatArray<string>;
	}): Filter[] {
		const oFilter = (
			FilterUtil.getFilterInfo(
				oIFilter,
				mConditions,
				oFilterUtils.setTypeConfigToProperties(aPropertiesMetadata)!,
				aIgnoreProperties.concat(aParameters)
			) as { filters: Filter }
		).filters;
		const hasEditStateMetadata = aPropertiesMetadata?.filter((property) => property.name === "$editState");
		let editStateFilter: Filter | undefined;

		// Only process edit state if it's not in the ignore list and has metadata
		if (!aIgnoreProperties.includes("$editState") && hasEditStateMetadata && hasEditStateMetadata.length > 0) {
			const view = CommonUtils.getTargetView(oIFilter);
			const appComponent = CommonUtils.getAppComponent(view);
			const isHiddenDraftEnabled = (appComponent?.getEnvironmentCapabilities()?.getCapabilities()?.HiddenDraft as HiddenDraft)
				?.enabled;

			if (isHiddenDraftEnabled) {
				// Hidden draft: only filter when disableDraftEditStateFilter is true
				if (oIFilter.hasOwnProperty("disableDraftEditStateFilter") && oIFilter.getProperty("disableDraftEditStateFilter")) {
					editStateFilter = EDITSTATE.getFilterForEditState("ALL");
				}
			} else if (mConditions.hasOwnProperty("$editState")) {
				// Normal draft: use condition value
				const editStateValue = mConditions["$editState"];
				editStateFilter = EDITSTATE.getFilterForEditState(editStateValue?.[0]?.values?.[0]);
			} else {
				// Normal draft: use default
				editStateFilter = EDITSTATE.getFilterForEditState("");
			}
		}
		let aFilters = oFilter ? [oFilter] : [];

		//( Transform DateTimeOffset precision 7 filters
		if (oIFilter.isA<FilterBar>("sap.ui.mdc.FilterBar")) {
			this._transformDateTimeOffsetFilters(aFilters, mConditions, oIFilter as FilterBar);
		} else if (oIFilter.isA<Table>("sap.ui.mdc.Table")) {
			this._transformDateTimeOffsetFiltersForTable(aFilters, oIFilter as Table);
		}

		if (editStateFilter) {
			const hasEditStateFilter = this.hasEditStateFilterRecursively(aFilters);
			if (hasEditStateFilter) {
				aFilters = this.exchangeEditStateFilterRecursively(editStateFilter, aFilters);
			} else {
				aFilters = [
					new Filter({
						filters: [...aFilters, editStateFilter],
						and: true
					})
				];
			}
		}
		return aFilters;
	},

	/**
	 * Transforms DateTimeOffset filter conditions for table columns.
	 * Table columns have a different property info structure than FilterBar properties.
	 * @param filters Array of filter objects to transform
	 * @param tableControl IFilterControl Table control instance
	 */
	_transformDateTimeOffsetFiltersForTable: function (filters: Filter[], tableControl: Table): void {
		// Transform filters using table column information
		const tableColumns: unknown[] = [];
		try {
			// Get table column definitions directly from the passed table
			const tableAPI = tableControl.getParent() as TableAPI;
			const tableDefinition = tableAPI.getTableDefinition();
			if (tableDefinition && tableDefinition.columns) {
				tableColumns.push(...tableDefinition.columns);
			}
			if (!filters || !Array.isArray(filters) || tableColumns.length === 0) {
				return;
			}
			// Handle nested filter structure - when multiple filters are defined,
			// they may be contained within aFilters[0].aFilters (same as FilterBar logic)
			let actualFilters: Filter[] = filters;
			const firstFilter = filters[0] as Filter & { aFilters?: Filter[] };
			if (firstFilter?.aFilters && firstFilter.aFilters.length > 0) {
				actualFilters = firstFilter.aFilters;
			}
			// Create a map of field paths to their precision info from table columns
			const fieldPrecisionMap = new Map<string, number>();
			(tableColumns as Array<Record<string, unknown>>).forEach((column) => {
				if (
					column.dataType === "Edm.DateTimeOffset" &&
					column.typeConfig &&
					(column.typeConfig as Record<string, unknown>).constraints &&
					((column.typeConfig as Record<string, unknown>).constraints as Record<string, unknown>).precision
				) {
					const precision = ((column.typeConfig as Record<string, unknown>).constraints as Record<string, unknown>)
						.precision as number;
					const fieldPath = column.relativePath as string;
					fieldPrecisionMap.set(fieldPath, precision);
				}
			});
			// Process each filter using the actual filters (handles both single and multiple filter cases)
			this._transformDateTimeOffSetFilterValueRecursively(actualFilters, fieldPrecisionMap);
		} catch (error) {
			Log.error("Error While transforming the table filter for milliseconds range before request :", error as string);
		}
	},

	/**
	 * Transforms DateTimeOffset filters by converting EQ operators to BT operators
	 * with precision-based range from .000... to .999... based on property precision.
	 * @param aFilters Array of filter objects to transform
	 * @param mConditions Filter conditions from the filter bar
	 * @param oFilterBar The filter bar instance to access property information
	 */
	_transformDateTimeOffsetFilters: function (
		aFilters: Filter[],
		mConditions: Record<string, ConditionObject[]>,
		oFilterBar: FilterBar
	): void {
		if (!aFilters || !Array.isArray(aFilters) || !mConditions) {
			return;
		}

		// Handle nested filter structure - when multiple filters are defined,
		// they may be contained within aFilters[0].aFilters
		let actualFilters: Filter[] = aFilters;
		const firstFilter = aFilters[0] as Filter & { aFilters?: Filter[] };
		if (firstFilter?.aFilters && firstFilter.aFilters.length > 0) {
			actualFilters = firstFilter.aFilters;
		}

		// Get property helper to access property metadata
		const oPropertyHelper = oFilterBar.getPropertyHelper();
		if (!oPropertyHelper) {
			return;
		}

		// Create a map of condition paths to their precision levels
		const dateTimeOffsetPaths: Map<string, number> = new Map<string, number>();

		Object.keys(mConditions).forEach(function (sConditionPath: string): void {
			if (mConditions[sConditionPath] && mConditions[sConditionPath].length > 0) {
				// Use the full condition path for property helper
				const propertyInfo = oPropertyHelper.getProperty(sConditionPath) as
					| {
							dataType?: string;
							constraints?: { precision?: number };
							typeConfig?: {
								typeInstance?: {
									constraints?: { precision?: number };
									getName(): string;
								};
							};
					  }
					| undefined;

				// Check if property is DateTimeOffset
				const isDateTimeOffset: boolean =
					(propertyInfo?.dataType?.includes("DateTimeOffset") ?? false) ||
					(propertyInfo?.typeConfig?.typeInstance?.getName().includes("DateTimeOffset") ?? false);
				const precision: number | undefined =
					propertyInfo?.constraints?.precision ?? propertyInfo?.typeConfig?.typeInstance?.constraints?.precision;

				// Only process DateTimeOffset properties with defined precision
				if (isDateTimeOffset && precision !== undefined && precision > 0) {
					dateTimeOffsetPaths.set(sConditionPath, precision);
				}
			}
		});

		// Transform filters recursively to handle all nested structures
		this._transformDateTimeOffSetFilterValueRecursively(actualFilters, dateTimeOffsetPaths);
	},

	/**
	 * Recursively transforms filters to handle all possible nested aFilters structures.
	 * @param aFilters Array of filter objects to transform
	 * @param dateTimeOffsetPaths Map of condition paths to their precision levels
	 */
	_transformDateTimeOffSetFilterValueRecursively: function (aFilters: Filter[], dateTimeOffsetPaths: Map<string, number>): void {
		for (let i = 0; i < aFilters.length; i++) {
			const filter: Filter = aFilters[i];

			// Check if this filter has nested aFilters (multiple conditions for same field)
			const filterWithNestedFilters = filter as Filter & { aFilters?: Filter[]; bAnd?: boolean };
			if (filterWithNestedFilters.aFilters && filterWithNestedFilters.aFilters.length > 0) {
				// Recursively transform nested filters for deeper nesting levels
				this._transformDateTimeOffSetFilterValueRecursively(filterWithNestedFilters.aFilters, dateTimeOffsetPaths);
				continue;
			}

			const filterPath: string | undefined = filter.getPath();
			const filterOperator: FilterOperator | undefined = filter.getOperator() as FilterOperator | undefined;
			const filterValue1: unknown = filter.getValue1();
			const filterValue2: unknown = filter.getValue2?.();

			// Handle undefined filterOperator gracefully
			if (filterOperator === undefined) {
				Log.warning(
					"FilterUtils._transformDateTimeOffsetFilters: Filter operator is undefined, skipping filter transformation",
					`filterPath: ${filterPath}, filterValue1: ${filterValue1}`
				);
				continue; // Skip this filter and continue with next one
			}

			// Check for transformation conditions:
			// 1. EQ operator with valid first value
			// 2. Any operator with two values (irrespective of operator type)
			const shouldTransform: boolean =
				(filterOperator === "EQ" && filterValue1 !== undefined && filterValue1 !== null) ||
				(filterValue1 !== undefined && filterValue1 !== null && filterValue2 !== undefined && filterValue2 !== null);

			if (shouldTransform) {
				// For direct properties - check if the path matches any condition path
				if (filterPath && dateTimeOffsetPaths.has(filterPath)) {
					const precision: number = dateTimeOffsetPaths.get(filterPath)!;
					const transformedFilter: Filter | null = this._transformDateTimeOffSetFilterValue(filter, precision);
					if (transformedFilter) {
						aFilters[i] = transformedFilter;
					}
				}
			} else if (filterOperator === "Any") {
				// Handle navigation property filters
				const nestedFilter = filter.getCondition();
				if (!nestedFilter) {
					continue;
				}

				// Check if the nested filter has multiple conditions (aFilters array)
				const nestedFilterWithMultipleConditions = nestedFilter as Filter & { aFilters?: Filter[]; bAnd?: boolean };
				if (nestedFilterWithMultipleConditions.aFilters && nestedFilterWithMultipleConditions.aFilters.length > 0) {
					// Handle multiple conditions within navigation property
					let hasTransformation = false;

					for (let j = 0; j < nestedFilterWithMultipleConditions.aFilters.length; j++) {
						const subFilter: Filter = nestedFilterWithMultipleConditions.aFilters[j];

						// Check for further nesting within sub-filters
						const subFilterWithNesting = subFilter as Filter & { aFilters?: Filter[] };
						if (subFilterWithNesting.aFilters && subFilterWithNesting.aFilters.length > 0) {
							// Recursively handle deeper nesting levels
							this._transformDateTimeOffSetFilterValueRecursively(subFilterWithNesting.aFilters, dateTimeOffsetPaths);
							continue;
						}

						const subFilterPath: string | undefined = subFilter.getPath();
						const subFilterOperator: FilterOperator | undefined = subFilter.getOperator() as FilterOperator | undefined;
						const subFilterValue1: unknown = subFilter.getValue1();
						const subFilterValue2: unknown = subFilter.getValue2?.();

						// Handle undefined subFilterOperator gracefully
						if (subFilterOperator === undefined) {
							Log.warning(
								"FilterUtils._transformDateTimeOffsetFilters: Filter operator is undefined, skipping filter transformation",
								`filterPath: ${subFilterPath}, filterValue1: ${subFilterValue1}`
							);
							continue; // Skip this sub-filter
						}

						// Check for transformation conditions for sub-filters
						const shouldTransformSubFilter: boolean =
							(subFilterOperator === "EQ" && subFilterValue1 !== undefined && subFilterValue1 !== null) ||
							(subFilterValue1 !== undefined &&
								subFilterValue1 !== null &&
								subFilterValue2 !== undefined &&
								subFilterValue2 !== null);

						if (shouldTransformSubFilter) {
							// Check if any condition path matches the navigation pattern
							const matchingConditionPath: string | undefined = Array.from(dateTimeOffsetPaths.keys()).find(function (
								sConditionPath: string
							): boolean {
								// Extract navigation and property parts from condition path
								const pathParts: string[] = sConditionPath.split("/");
								if (pathParts.length === 2) {
									const navigationPart: string = pathParts[0].replace("*", ""); // "_Item*" -> "_Item"
									const propertyPart: string = pathParts[1]; // "BillingDocumentDate"

									// Check if filter navigation matches and sub filter ends with property
									return filterPath === navigationPart && Boolean(subFilterPath?.endsWith(propertyPart));
								}
								return false;
							});

							if (matchingConditionPath) {
								const precision: number = dateTimeOffsetPaths.get(matchingConditionPath)!;
								const transformedSubFilter: Filter | null = this._transformDateTimeOffSetFilterValue(subFilter, precision);
								if (transformedSubFilter) {
									nestedFilterWithMultipleConditions.aFilters[j] = transformedSubFilter;
									hasTransformation = true;
								}
							}
						}
					}

					// If any transformation occurred, recreate the Any filter with updated nested conditions
					if (hasTransformation) {
						aFilters[i] = new Filter({
							path: filterPath,
							operator: "Any",
							variable: filter.getVariable(),
							condition: new Filter({
								filters: nestedFilterWithMultipleConditions.aFilters,
								and: nestedFilterWithMultipleConditions.bAnd ?? true
							})
						});
					}
				} else {
					// Handle single condition within navigation property
					const nestedFilterPath: string | undefined = nestedFilter.getPath();
					const nestedFilterOperator: FilterOperator | undefined = nestedFilter.getOperator() as FilterOperator | undefined;
					const nestedFilterValue1: unknown = nestedFilter.getValue1();
					const nestedFilterValue2: unknown = nestedFilter.getValue2?.();

					// Handle undefined nestedFilterOperator gracefully
					if (nestedFilterOperator === undefined) {
						Log.warning(
							"FilterUtils._transformDateTimeOffsetFilters: Filter operator is undefined, skipping filter transformation",
							`filterPath: ${nestedFilterPath}, filterValue1: ${nestedFilterValue1}`
						);
						continue; // Skip this nested filter
					}

					// Check for transformation conditions for nested filters
					const shouldTransformNested: boolean =
						(nestedFilterOperator === "EQ" && nestedFilterValue1 !== undefined && nestedFilterValue1 !== null) ||
						(nestedFilterValue1 !== undefined &&
							nestedFilterValue1 !== null &&
							nestedFilterValue2 !== undefined &&
							nestedFilterValue2 !== null);

					if (shouldTransformNested) {
						// Check if any condition path matches the navigation pattern
						const matchingConditionPath: string | undefined = Array.from(dateTimeOffsetPaths.keys()).find(function (
							sConditionPath: string
						): boolean {
							// Extract navigation and property parts from condition path
							const pathParts: string[] = sConditionPath.split("/");
							if (pathParts.length === 2) {
								const navigationPart: string = pathParts[0].replace("*", ""); // "_Item*" -> "_Item"
								const propertyPart: string = pathParts[1]; // "RequestedDeliveryDate"

								// Check if filter navigation matches and nested filter ends with property
								return filterPath === navigationPart && Boolean(nestedFilterPath?.endsWith(propertyPart));
							}
							return false;
						});

						if (matchingConditionPath) {
							const precision: number = dateTimeOffsetPaths.get(matchingConditionPath)!;
							const transformedNestedFilter: Filter | null = this._transformDateTimeOffSetFilterValue(
								nestedFilter,
								precision
							);
							if (transformedNestedFilter) {
								// Create new Any filter with transformed nested filter
								aFilters[i] = new Filter({
									path: filterPath,
									operator: "Any",
									variable: filter.getVariable(),
									condition: transformedNestedFilter
								});
							}
						}
					}
				}
			}
		}
	},

	/**
	 * Transforms a single filter value for DateTimeOffset precision properties.
	 * Handles EQ operator by converting to BT range, and adjusts second value for any filter with two values.
	 * Precision determines the number of decimal places: precision 3 = .999, precision 7 = .9999999.
	 * @param filter The filter to transform
	 * @param precision The precision level for the DateTimeOffset property
	 * @returns Transformed filter with microsecond precision or null if no transformation needed
	 */
	_transformDateTimeOffSetFilterValue: function (filter: Filter, precision: number): Filter | null {
		const operator: string | undefined = filter.getOperator();
		const value1: unknown = filter.getValue1();
		const value2: unknown = filter.getValue2?.();

		if (operator === undefined) {
			Log.warning(
				"FilterUtils._transformDateTimeOffsetFilters: Filter operator is undefined, skipping filter transformation",
				`filterPath: ${filter.getPath()}, filterValue1: ${value1}`
			);
			return null;
		}

		// Only process filters with valid first value
		if (value1 === null || value1 === undefined) {
			return null;
		}

		const originalValue1: string = value1 as string;

		// Parse datetime: 2025-08-13T15:19:15.0000000+02:00 or Z
		const dateTimeMatch1: RegExpMatchArray | null = originalValue1.match(
			/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{0,7}))?([+-]\d{2}:\d{2}|Z)$/
		);

		if (!dateTimeMatch1) {
			return null;
		}

		const dateTimePart1: string = dateTimeMatch1[1];
		const timezone1: string = dateTimeMatch1[3];

		// Generate precision-based decimal suffix (e.g., .999 for precision 3, .9999999 for precision 7)
		const maxDecimalValue: string = "9".repeat(precision);

		// Handle EQ operator - convert to BT with full precision range
		if (operator === "EQ") {
			const startValue = `${dateTimePart1}.${"0".repeat(precision)}${timezone1}`;
			const endValue = `${dateTimePart1}.${maxDecimalValue}${timezone1}`;

			return new Filter({
				path: filter.getPath(),
				operator: FilterOperator.BT,
				value1: startValue,
				value2: endValue
			});
		}

		// For any operator with two values, adjust the second value to max precision
		if (value2 !== null && value2 !== undefined) {
			const originalValue2: string = value2 as string;
			const dateTimeMatch2: RegExpMatchArray | null = originalValue2.match(
				/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{0,7}))?([+-]\d{2}:\d{2}|Z)$/
			);

			if (!dateTimeMatch2) {
				return null;
			}

			const dateTimePart2: string = dateTimeMatch2[1];
			const timezone2: string = dateTimeMatch2[3];

			// Keep first value unchanged, modify second value to max precision
			const adjustedValue2 = `${dateTimePart2}.${maxDecimalValue}${timezone2}`;

			return new Filter({
				path: filter.getPath(),
				operator: filter.getOperator(),
				value1: originalValue1, // Keep original first value unchanged
				value2: adjustedValue2 // Transform second value to max precision
			});
		}

		// No transformation needed for single-value non-EQ operators
		return null;
	},
	hasEditStateFilterRecursively: function (filters: Filter[]): boolean {
		return filters.some((filter): boolean => {
			if (filter.getPath() === "$editState") {
				return true;
			} else if (filter.getFilters() !== undefined) {
				return this.hasEditStateFilterRecursively(filter.getFilters()!);
			} else {
				return false;
			}
		});
	},
	exchangeEditStateFilterRecursively: function (editStateFilter: Filter, filters: Filter[]): Filter[] {
		return filters.map((filter): Filter => {
			if (filter.getPath() === "$editState") {
				return editStateFilter;
			} else if (filter.getFilters() !== undefined) {
				filter = new Filter({
					filters: this.exchangeEditStateFilterRecursively(editStateFilter, filter.getFilters()!),
					and: filter.isAnd()
				});
				return filter;
			}
			return filter;
		});
	},
	setTypeConfigToProperties: function (aProperties: PropertyInfo[] | null | undefined): PropertyInfo[] | null | undefined {
		if (aProperties && aProperties.length) {
			aProperties.forEach(function (oIFilterProperty: PropertyInfo) {
				if (
					oIFilterProperty.typeConfig &&
					oIFilterProperty.typeConfig.typeInstance &&
					(oIFilterProperty.typeConfig.typeInstance as { getConstraints?: Function }).getConstraints instanceof Function
				) {
					return;
				}
				if (oIFilterProperty.path === "$editState") {
					oIFilterProperty.typeConfig = TypeMap.getTypeConfig("sap.ui.model.odata.type.String", {}, {});
				} else if (oIFilterProperty.path === "$search") {
					oIFilterProperty.typeConfig = TypeMap.getTypeConfig("sap.ui.model.odata.type.String", {}, {});
				} else if (oIFilterProperty.dataType || (oIFilterProperty.typeConfig && oIFilterProperty.typeConfig.className)) {
					oIFilterProperty.typeConfig = TypeMap.getTypeConfig(
						oIFilterProperty.dataType || oIFilterProperty.typeConfig?.className,
						oIFilterProperty.formatOptions,
						oIFilterProperty.constraints
					);
				}
			});
		}
		return aProperties;
	},
	getNotApplicableFilters: function (oFilterBar: FilterBar, oControl: Control): string[] {
		const sTargetEntityTypePath = oControl.data("entityType"),
			oFilterBarEntityPath = oFilterBar.data("entityType"),
			oMetaModel = oFilterBar.getModel()!.getMetaModel()!,
			oFilterBarEntitySetAnnotations = oMetaModel.getObject(oFilterBarEntityPath),
			aNotApplicable = [],
			mConditions = oFilterBar.getConditions(),
			bIsFilterBarEntityType = sTargetEntityTypePath === oFilterBarEntityPath,
			bIsChart = oControl.isA<Chart>("sap.ui.mdc.Chart"),
			bIsAnalyticalTable = !bIsChart && (oControl.getParent() as TableAPI).getTableDefinition().enableAnalytics,
			bIsTreeTable = !bIsChart && (oControl.getParent() as TableAPI).getTableDefinition().control.type === "TreeTable",
			bEnableSearch = bIsChart
				? (CommonHelper.parseCustomData(DelegateUtil.getCustomData(oControl, "applySupported")) as { enableSearch?: boolean })
						.enableSearch
				: (oControl.getParent() as TableAPI).getTableDefinition().annotation.searchable;

		if (mConditions && (!bIsFilterBarEntityType || bIsAnalyticalTable || bIsChart || bIsTreeTable)) {
			// We don't need to calculate the difference on property Level if entity sets are identical
			const aTargetProperties = bIsFilterBarEntityType
					? []
					: (oFilterBar
							.getControlDelegate()
							.fetchPropertiesForEntity(sTargetEntityTypePath, oMetaModel, oFilterBar) as PropertyInfo[]),
				mTargetProperties = aTargetProperties.reduce(function (mProp: { [key: string]: PropertyInfo }, oProp: PropertyInfo) {
					mProp[oProp.name] = oProp;
					return mProp;
				}, {}),
				mAggregatedProperties: Record<string, unknown> = {};
			const chartEntityTypeAnnotations = oControl
				.getModel()!
				.getMetaModel()!
				.getObject(oControl.data("targetCollectionPath") + "/");
			if (oControl.isA("sap.ui.mdc.Chart")) {
				const oEntitySetAnnotations = oControl
						.getModel()!
						.getMetaModel()!
						.getObject(`${oControl.data("targetCollectionPath")}@`),
					mChartCustomAggregates = getAllCustomAggregates(oEntitySetAnnotations);
				Object.keys(mChartCustomAggregates).forEach(function (sAggregateName: string) {
					if (!mAggregatedProperties[sAggregateName]) {
						const oAggregate = mChartCustomAggregates[sAggregateName];
						mAggregatedProperties[sAggregateName] = oAggregate;
					}
				});
			}

			for (const sProperty in mConditions) {
				// Need to check the length of mConditions[sProperty] since previous filtered properties are kept into mConditions with empty array as definition
				const aConditionProperty = mConditions[sProperty];
				let typeCheck = true;
				if (chartEntityTypeAnnotations[sProperty] && oFilterBarEntitySetAnnotations[sProperty]) {
					typeCheck = chartEntityTypeAnnotations[sProperty]["$Type"] === oFilterBarEntitySetAnnotations[sProperty]["$Type"];
				}
				if (
					Array.isArray(aConditionProperty) &&
					aConditionProperty.length > 0 && //has a filter value
					(((!mTargetProperties[sProperty] || // no target property found by property name
						(mTargetProperties[sProperty].isCustomFilter && mTargetProperties[sProperty].annotationPath == undefined) || // custom filter that is not part of the current entitySet
						(mTargetProperties[sProperty] && !typeCheck)) &&
						(!bIsFilterBarEntityType || (sProperty === "$editState" && (bIsChart || bIsTreeTable || bIsAnalyticalTable)))) || //type does not match OR $editState on secondary entity set
						mAggregatedProperties[sProperty])
				) {
					aNotApplicable.push(sProperty.replace(/[+|*]/g, ""));
				}
			}
		}
		if (!bEnableSearch && oFilterBar.getSearch()) {
			aNotApplicable.push("$search");
		}
		return aNotApplicable;
	},

	/**
	 * Gets the value list information of a property as defined for a given filter bar.
	 * @param filterBar The filter bar to get the value list information for
	 * @param propertyName The property to get the value list information for
	 * @returns The value list information
	 */
	async _getValueListInfo(filterBar: FilterBar, propertyName: string): Promise<AnnotationValueListType | undefined> {
		const metaModel = filterBar.getModel()?.getMetaModel() as ODataMetaModel;

		if (!metaModel) {
			return undefined;
		}

		const entityType = filterBar.data("entityType") ?? "";
		const valueListInfos = await metaModel.requestValueListInfo(entityType + propertyName, true).catch(() => null);
		return valueListInfos?.[""];
	},

	/**
	 * Gets the value list of all the filter properties.
	 * @param filterBar Instance of FilterBar
	 * @returns Array of filter properties for FilterBar
	 */
	getFilterPropertyInfo(filterBar: IFilterControl): PropertyInfo[] {
		let _propertyInfo = filterBar.data("feFilterInfo");
		if (typeof _propertyInfo === "string") {
			_propertyInfo = JSON.parse(_propertyInfo);
		}
		return _propertyInfo || [];
	},

	/**
	 * Gets the {@link ConditionValidated} state for a single value. This decides whether the value is treated as a selected value
	 * in a value help, meaning that its description is loaded and displayed if existing, or whether it is displayed as a
	 * condition (e.g. "=1").
	 *
	 * Values for properties without value list info are always treated as {@link ConditionValidated.NotValidated}.
	 * @param valueListInfo The value list info from the {@link MetaModel}
	 * @param propertyName The name of the property
	 * @param value The single value to get the state for
	 * @returns The {@link ConditionValidated} state for the value
	 */
	_getConditionValidated: async function (
		valueListInfo: AnnotationValueListType | undefined,
		propertyName: string,
		value: string | number | boolean | null | undefined
	): Promise<ConditionValidated> {
		if (!valueListInfo) {
			return ConditionValidated.NotValidated;
		}

		try {
			const valueListProperties = valueListInfo.Parameters.filter((parameter) =>
				[CommonAnnotationTypes.ValueListParameterInOut.valueOf(), CommonAnnotationTypes.ValueListParameterOut.valueOf()].includes(
					parameter.$Type
				)
			)
				.filter((parameter) => parameter.LocalDataProperty?.$PropertyPath === propertyName)
				.map((parameter) => parameter.ValueListProperty);

			const valueListPropertyPath = valueListProperties[0] ?? propertyName;

			const filter = new Filter({
				path: valueListPropertyPath,
				operator: FilterOperator.EQ,
				value1: value
			});
			const listBinding = valueListInfo.$model.bindList(`/${valueListInfo.CollectionPath}`, undefined, undefined, filter, {
				$select: valueListPropertyPath
			});

			const valueExists = (await listBinding.requestContexts()).length > 0;
			if (valueExists) {
				return ConditionValidated.Validated;
			} else {
				return ConditionValidated.NotValidated;
			}
		} catch (error: unknown) {
			Log.error("FilterUtils: Error while retrieving ConditionValidated", error as Error | string);
			return ConditionValidated.NotValidated;
		}
	},
	/**
	 * Clear the filter value for a specific property in the filter bar.
	 * This is a prerequisite before new values can be set cleanly.
	 * @param filterBar The filter bar that contains the filter field
	 * @param conditionPath The path to the property as a condition path
	 */
	async _clearFilterValue(filterBar: FilterBar, conditionPath: string): Promise<void> {
		const oState = await StateUtil.retrieveExternalState(filterBar);
		if (oState.filter[conditionPath]) {
			oState.filter[conditionPath].forEach((oCondition: ConditionObject) => {
				oCondition.filtered = false;
			});
			await StateUtil.applyExternalState(filterBar, { filter: { [conditionPath]: oState.filter[conditionPath] } });
		}
	},

	/**
	 * Normalizes the variadic args of _setFilterValues into a canonical operator and values pair.
	 * Returns { earlyReturn: true } when the call should be silently ignored (empty value with a
	 * standard operator, BCP 2270135274).
	 * @param args The variadic args passed to _setFilterValues
	 * @returns Canonical operator and values, or earlyReturn flag
	 */
	_resolveOperatorAndValues(
		args: unknown[]
	): { earlyReturn: true } | { operator: string; values: (string | number | boolean | null)[] | undefined } {
		let operator = args?.[0] as string | undefined;
		let rawValues = args?.[1] as undefined | string | number | boolean | string[] | number[] | boolean[];

		// common filter Operators need a value. Do nothing if this value is undefined
		// BCP: 2270135274
		if (
			args.length === 2 &&
			(rawValues === undefined || rawValues === null || rawValues === "") &&
			operator &&
			Object.keys(FilterOperator).includes(operator)
		) {
			Log.warning(`An empty filter value cannot be applied with the ${operator} operator`);
			return { earlyReturn: true };
		}

		// The 4th parameter is optional; if operator is missing, rawValues is used as 3rd parameter
		// This does not apply for semantic dates, as these do not require rawValues (exception: "LASTDAYS", 3)
		if (
			rawValues === undefined &&
			!SemanticDateOperators.getSemanticDateOperations().includes(operator || "") &&
			!(operator === "Empty")
		) {
			rawValues = operator ?? [];
			operator = undefined;
		}

		// If operator is not set, use EQ as default
		if (!operator) {
			operator = FilterOperator.EQ;
		}

		// Supported array types:
		//  - Single Values:	"2" | ["2"]
		//  - Multiple Values:	["2", "3"]
		//  - Ranges:			["2","3"]
		// Unsupported array types:
		//  - Multiple Ranges:	[["2","3"]] | [["2","3"],["4","5"]]
		const supportedValueTypes = ["string", "number", "boolean"];
		if (
			rawValues !== undefined &&
			((!Array.isArray(rawValues) && !supportedValueTypes.includes(typeof rawValues)) ||
				(Array.isArray(rawValues) && rawValues.length > 0 && !supportedValueTypes.includes(typeof rawValues[0])))
		) {
			throw new Error(
				"FilterUtils.js#_setFilterValues: Filter value not supported; only primitive values or an array thereof can be used."
			);
		}

		let values: (string | number | boolean | null)[] | undefined;
		if (rawValues !== undefined) {
			values = Array.isArray(rawValues) ? rawValues : [rawValues];
		}

		return { operator, values };
	},

	/**
	 * Resolves the canonical condition path, property name, and value list info for a given raw
	 * condition path and filter bar. The returned conditionPath may differ from the input if the
	 * property path contains 1:n navigation segments.
	 * @param filterBar The filter bar that contains the filter field
	 * @param conditionPath The raw condition path
	 * @returns Resolved conditionPath, propertyName, and valueListInfo
	 */
	async _resolveConditionContext(
		filterBar: FilterBar,
		conditionPath: string
	): Promise<{ conditionPath: string; propertyName: string; valueListInfo: AnnotationValueListType | undefined }> {
		// We recreate conditionPath to ensure it is in right format
		// e.g. If "_Item/Material" is sent as condition path where _Item is 1:n multiplicity -> "_Item*/Material"
		const propertyPath = oFilterUtils.getPropertyPathFromConditionPath(conditionPath);
		const mainFilterBarControl = oFilterUtils.getFilterBarForAdaptationControl(filterBar) ?? filterBar;
		const propertyTargetObjectPath = oFilterUtils.getDataModelObjectPathForProperty(mainFilterBarControl, propertyPath);
		const propertyName = propertyTargetObjectPath?.targetObject?.name ?? propertyPath;
		const resolvedConditionPath =
			(propertyTargetObjectPath ? getContextRelativeTargetObjectPath(propertyTargetObjectPath, false, true) : undefined) ??
			conditionPath;
		const valueListInfo = await this._getValueListInfo(mainFilterBarControl, propertyPath);
		return { conditionPath: resolvedConditionPath, propertyName, valueListInfo };
	},

	/**
	 * Builds the ConditionObject[] array for a resolved condition path, operator, and values.
	 * Returns undefined when no condition should be created (e.g. reset case).
	 * @param operator The operator to use
	 * @param values The values to apply
	 * @param valueListInfo The value list info for the property
	 * @param propertyName The property name
	 * @returns Array of conditions, or undefined if no conditions should be created
	 */
	async _buildConditions(
		operator: string,
		values: (string | number | boolean | null)[] | undefined,
		valueListInfo: AnnotationValueListType | undefined,
		propertyName: string
	): Promise<ConditionObject[] | undefined> {
		if (values && values.length) {
			if (operator === OperatorName.BT || operator === OperatorName.NOTBT || operator === "DATERANGE") {
				// The operator BT and NOTBT require one condition with both thresholds
				return [Condition.createCondition(operator, values, null, null, ConditionValidated.NotValidated)];
			} else {
				// Regular single and multi value conditions, if there are no values, we do not want any conditions
				return Promise.all(
					values.map(async (value) => {
						// For the EQ case, tell MDC to validate the value (e.g. display the description), if it exists in the associated entity, otherwise never validate
						const conditionValidatedStatus =
							operator === FilterOperator.EQ
								? await this._getConditionValidated(valueListInfo, propertyName, value)
								: ConditionValidated.NotValidated;
						return Condition.createCondition(operator, [value], null, null, conditionValidatedStatus);
					})
				);
			}
		} else if (SemanticDateOperators.getSemanticDateOperations().includes(operator || "") || operator === "Empty") {
			// vValues is undefined, so the operator is a semantic date that does not need values (see above)
			return [Condition.createCondition(operator, [], null, null, ConditionValidated.NotValidated)];
		}
		return undefined;
	},

	/**
	 * Set the filter values for the given property in the filter bar.
	 * The filter values can be either a single value or an array of values.
	 * Each filter value must be represented as a primitive value.
	 * @param oFilterBar The filter bar that contains the filter field
	 * @param sConditionPath The path to the property as a condition path
	 * @param args List of optional parameters
	 *  [sOperator] The operator to be used - if not set, the default operator (EQ) will be used
	 *  [vValues] The values to be applied - if sOperator is missing, vValues is used as 3rd parameter
	 */
	setFilterValues: async function (oFilterBar: FilterBar | undefined, sConditionPath: string, ...args: unknown[]): Promise<void> {
		await this._setFilterValues(oFilterBar, false, sConditionPath, ...args);
	},

	/**
	 * Add the filter values for the given property in the filter bar.
	 *
	 * The filter values can be either a single value or an array of values.
	 * Each filter value must be represented as a primitive value.
	 * @param filterBar The filter bar that contains the filter field
	 * @param conditionPath The path to the property as a condition path
	 * @param args List of optional parameters
	 */
	addFilterValues: async function (filterBar: FilterBar | undefined, conditionPath: string, ...args: unknown[]): Promise<void> {
		await this._setFilterValues(filterBar, true, conditionPath, ...args);
	},

	/**
	 * Get property path from condition path.
	 *
	 * It removes the condition path specific characters like "+" and "*".
	 * @param conditionPath The path to the property as a condition path
	 * @returns The property path derived from the condition path
	 */
	getPropertyPathFromConditionPath(conditionPath: string): string {
		return conditionPath.replace(CONDITION_PATH_TO_PROPERTY_PATH_REGEX, "");
	},

	/**
	 * Get main filter bar for the given p13n adaptation filter control.
	 * @param potentialFilterBar Expected instance of FilterBar or AdaptationFilterBar.
	 * @returns The main filter bar instance if found, otherwise undefined.
	 */
	getFilterBarForAdaptationControl(potentialFilterBar: ManagedObject | null): FilterBar | null {
		while (potentialFilterBar && !potentialFilterBar.isA<FilterBar>("sap.ui.mdc.FilterBar")) {
			potentialFilterBar = potentialFilterBar.getParent();
		}
		return potentialFilterBar;
	},

	/**
	 * Get the data model object path for a property in the filter bar.
	 *
	 * This is used to retrieve the data model object path for a specific property in the filter bar.
	 * @param filterBar The filter bar that contains the property
	 * @param propertyPath The path to the property
	 * @returns The data model object path for the property
	 */
	getDataModelObjectPathForProperty(filterBar: FilterBar, propertyPath: string): DataModelObjectPath<Property> | undefined {
		const entityTypePath = DelegateUtil.getCustomData<string>(filterBar, "entityType");
		const metaModel = filterBar.getModel()?.getMetaModel() as ODataMetaModel;
		return MetaModelConverter.getInvolvedDataModelObjects<Property>(
			metaModel.createBindingContext(`${entityTypePath}${propertyPath}`)!,
			metaModel.createBindingContext(`${entityTypePath}`)!
		);
	},

	_setFilterValues: async function (
		oFilterBar: FilterBar | undefined,
		append: boolean,
		sConditionPath: string,
		...args: unknown[]
	): Promise<void> {
		// Do nothing when the filter bar is hidden
		if (!oFilterBar) {
			return;
		}

		// We wait for filter bar to be ready.
		if (oFilterBar.isA<FEFilterBar>("sap.fe.macros.controls.FilterBar")) {
			// _setFilterValues could be called in case of adaptation filter bar, so we explicitly check for FE filter bar control.
			await oFilterBar.whenInitialized();
		}

		const resolved = this._resolveOperatorAndValues(args);
		if ("earlyReturn" in resolved) {
			return;
		}
		const { operator, values } = resolved;

		const filter: { [key: string]: ConditionObject[] } = {};
		if (sConditionPath) {
			const { conditionPath, propertyName, valueListInfo } = await this._resolveConditionContext(oFilterBar, sConditionPath);
			sConditionPath = conditionPath;

			const conditions = await this._buildConditions(operator, values, valueListInfo, propertyName);
			if (conditions) {
				filter[sConditionPath] = conditions;
			}
		}

		// Suspend MDC selection (validation) while clearing and re-applying the filter value.
		// In liveMode the MDC FilterBar validates required fields on every state change. Without
		// this guard the intermediate "cleared" state triggers the "Enter a value in all required
		// fields" error dialog even though the new value is applied immediately after.
		const isLiveMode = oFilterBar.getLiveMode?.();
		if (isLiveMode) {
			oFilterBar.setSuspendSelection(true);
		}
		try {
			if (!append) {
				// Clear the current value as we do not want to add filter values but replace them
				await this._clearFilterValue(oFilterBar, sConditionPath);
			}

			if (filter[sConditionPath]) {
				// This is not called in the reset case, i.e. setFilterValue("Property")
				await StateUtil.applyExternalState(oFilterBar, { filter });
			}
		} finally {
			if (isLiveMode) {
				oFilterBar.setSuspendSelection(false);
			}
		}
	},

	/**
	 * Resolves the MDC table content control from a given filter bar.
	 * @param oFilterBar The filter bar control used to locate the associated table.
	 * @param callerName Name of the calling function for logging purposes.
	 * @returns The MDC table control, or undefined if it cannot be resolved.
	 */
	_getTableFromFilterBar: function (oFilterBar: FilterBar, callerName: string): Table | undefined {
		const oView = (oFilterBar as Partial<IFilterControl>).isA ? CommonUtils.getTargetView(oFilterBar as Control) : null;
		if (!oView || !oView.getController()) {
			Log.warning(`FilterUtils.${callerName}: Cannot find view or controller`);
			return undefined;
		}

		const controller = oView.getController() as ListReportController;
		if (typeof controller._getControls !== "function") {
			Log.warning(`FilterUtils.${callerName}: Controller does not support _getControls`);
			return undefined;
		}

		const tableControls = controller._getControls("table");
		if (!tableControls || tableControls.length === 0) {
			Log.warning(`FilterUtils.${callerName}: No table controls found`);
			return undefined;
		}

		const filterBarId = oFilterBar.getId();
		const oTable = tableControls.find((oTable: Control) => {
			const tableAPI = oTable.getParent() as TableAPI;
			return tableAPI?.getContent()?.getFilter?.() === filterBarId;
		});
		if (!oTable) {
			Log.warning(`FilterUtils.${callerName}: No table found associated with filter bar '${filterBarId}'`);
			return undefined;
		}

		const tableAPI = oTable.getParent() as TableAPI;
		return tableAPI?.getContent();
	},

	/**
	 * Clears all existing sorters from the given MDC table.
	 * @param table The MDC table control.
	 */
	_clearExistingSorters: async function (table: Table): Promise<void> {
		const oState = await StateUtil.retrieveExternalState(table);
		if (oState.sorters && oState.sorters.length > 0) {
			const clearedSorters = oState.sorters.map((sorter: { key: string; descending: boolean }) => ({
				...sorter,
				sorted: false
			}));
			await StateUtil.applyExternalState(table, { sorters: clearedSorters });
		}
	},

	/**
	 * Applies sorters to the table associated with the given filter bar.
	 * @param oFilterBar The filter bar control used to locate the associated table.
	 * @param sorters The sorters to apply.
	 */
	applySortersToTable: async function (
		oFilterBar: FilterBar | undefined,
		sorters: { key: string; descending: boolean }[]
	): Promise<void> {
		if (!oFilterBar || !sorters || sorters.length === 0) {
			return;
		}

		const table = oFilterUtils._getTableFromFilterBar(oFilterBar, "applySortersToTable");
		if (!table) {
			return;
		}

		// Convert sorters to the format expected by StateUtil
		// Extract just the property name from the key (remove entity path if present)
		const propertyInfos = (table.getParent() as TableAPI)?.getEnhancedFetchedPropertyInfos() ?? [];
		const stateSorters = sorters.map((sorter) => {
			const propertyName = sorter.key.includes("/") ? sorter.key.split("/").pop()! : sorter.key;
			const match =
				propertyInfos.find((p) => p.relativePath === propertyName && p.key?.startsWith("Property::")) ??
				propertyInfos.find((p) => p.relativePath === propertyName);
			return {
				key: match?.key ?? propertyName,
				descending: sorter.descending
			};
		});

		try {
			await oFilterUtils._clearExistingSorters(table);
			await StateUtil.applyExternalState(table, { sorters: stateSorters });
		} catch (error) {
			Log.error("FilterUtils.applySortersToTable: Failed to apply sorting", error as string);
		}
	},

	/**
	 * Clears all sorters from the table associated with the given filter bar.
	 * @param oFilterBar The filter bar control used to locate the associated table.
	 */
	clearSortersFromTable: async function (oFilterBar: FilterBar | undefined): Promise<void> {
		if (!oFilterBar) {
			return;
		}

		const table = oFilterUtils._getTableFromFilterBar(oFilterBar, "clearSortersFromTable");
		if (!table) {
			return;
		}

		try {
			await oFilterUtils._clearExistingSorters(table);
		} catch (error) {
			Log.error("FilterUtils.clearSortersFromTable: Failed to clear sorting", error as string);
		}
	},

	conditionToModelPath: function (sConditionPath: string): string {
		// make the path usable as model property, therefore slashes become backslashes
		return sConditionPath.replace(/\//g, "\\");
	},
	_getFilterMetaModel: function (oFilterControl: IFilterControl, metaModel?: ODataMetaModel): ODataMetaModel {
		return metaModel || (oFilterControl.getModel()!.getMetaModel() as ODataMetaModel);
	},
	_getEntitySetPath: function (sEntityTypePath: string): string {
		return sEntityTypePath && ModelHelper.getEntitySetPath(sEntityTypePath);
	},

	_getFieldsForTable: function (oFilterControl: IFilterControl, sEntityTypePath?: string): TableVisualization[] {
		const lrTables: TableVisualization[] = [];
		/**
		 * Gets fields from
		 * 	- direct entity properties,
		 * 	- navigateProperties key in the manifest if these properties are known by the entity
		 *  - annotation "SelectionFields"
		 */
		if (sEntityTypePath) {
			const oView = (oFilterControl as Partial<IFilterControl>).isA ? CommonUtils.getTargetView(oFilterControl) : null;
			const tableControls =
				oView &&
				oView.getController() &&
				(oView.getController() as ListReportController)._getControls &&
				(oView.getController() as ListReportController)._getControls("table");
			if (tableControls) {
				tableControls.forEach(function (oTable: Control) {
					lrTables.push((oTable.getParent() as TableAPI).getTableDefinition());
				});
			}
			return lrTables;
		}
		return [];
	},
	_getSelectionFields: function (
		oFilterControl: IFilterControl,
		sEntityTypePath: string | undefined,
		sFilterEntityTypePath: string,
		contextPath: string,
		lrTables: TableVisualization[],
		oMetaModel: ODataMetaModel,
		oConverterContext: ConverterContext,
		includeHidden?: boolean,
		oModifier?: BaseTreeModifier,
		lineItemTerm?: string,
		annotationPath?: string,
		propertyInfosFromFilterBar?: PropertyInfo[]
	): FilterField[] {
		const filterFields = FilterBarConverter.getSelectionFields(
			oConverterContext,
			lrTables,
			annotationPath,
			includeHidden,
			lineItemTerm
		);
		let selectionFields: FilterField[] = filterFields.selectionFields;
		let propertyInfos: PropertyInfo[];
		//During templating time while adding a flex change propertyInfosFromFilterBar will be passed
		if (propertyInfosFromFilterBar && propertyInfosFromFilterBar.length > 0) {
			propertyInfos = propertyInfosFromFilterBar;
		} else {
			propertyInfos = (oFilterControl as Partial<IFilterControl>).data
				? this.getFilterPropertyInfo(oFilterControl)
				: JSON.parse(filterFields.sPropertyInfo.replace(/\\\{/g, "{").replace(/\\\}/g, "}")); // propertyInfo string is returned from the getSelectionFields
		}
		if (
			(oModifier
				? oModifier.getControlType(oFilterControl) === "sap.ui.mdc.FilterBar"
				: oFilterControl.isA("sap.ui.mdc.FilterBar")) &&
			sEntityTypePath !== sFilterEntityTypePath
		) {
			/**
			 * We are in a multi-entity set scenario so we add annotation "SelectionFields"
			 * from FilterBar entity if these properties are known by the entity
			 */
			const oVisualizationObjectPath = MetaModelConverter.getInvolvedDataModelObjects(oMetaModel.createBindingContext(contextPath)!);
			const oPageContext = oConverterContext.getConverterContextFor(sFilterEntityTypePath);
			const aFilterBarSelectionFieldsAnnotation: SelectionFields =
				oPageContext.getEntityTypeAnnotation<SelectionFields>("@com.sap.vocabularies.UI.v1.SelectionFields").annotation ||
				([] as unknown as SelectionFields);
			const mapSelectionFields: Record<string, boolean> = {};
			selectionFields.forEach(function (oSelectionField: FilterField) {
				mapSelectionFields[oSelectionField.conditionPath] = true;
			});

			aFilterBarSelectionFieldsAnnotation.forEach(function (oFilterBarSelectionFieldAnnotation: PropertyPath) {
				const sPath = oFilterBarSelectionFieldAnnotation.value;
				if (!mapSelectionFields[sPath]) {
					const oFilterField = FilterBarConverter.getFilterField(
						sPath,
						oConverterContext,
						oVisualizationObjectPath.startingEntitySet.entityType
					);
					if (oFilterField) {
						selectionFields.push(oFilterField);
					}
				}
			});
		}
		if (selectionFields) {
			const fieldNames: string[] = [];
			selectionFields.forEach(function (oField: FilterField) {
				fieldNames.push(oField.key);
			});
			selectionFields = this._getSelectionFieldsFromPropertyInfos(fieldNames, selectionFields, propertyInfos);
		}
		return selectionFields;
	},

	/**
	 * Adds the properties from propertyInfos for the filter field.
	 * @param fieldNames The names of fields present in the selectionField array.
	 * @param selectionFields Selection field array of all the possible fields that can be in the selection field.
	 * @param propertyInfo PropertyInfos filters that are available or present in selection field annotation.
	 * @returns FilterField array of all the possible filter fields after adding properties from propertyInfos
	 */
	_getSelectionFieldsFromPropertyInfos: function (
		fieldNames: string[],
		selectionFields: FilterField[],
		propertyInfo: PropertyInfo[]
	): FilterField[] {
		// Create a map for quick lookup by annotation path
		const selectionFieldsMap: Record<string, FilterField> = selectionFields.reduce(
			(map, field) => {
				if (field.annotationPath) {
					map[field.annotationPath] = field;
				}
				return map;
			},
			{} as Record<string, FilterField>
		);

		propertyInfo.forEach((prop: PropertyInfo) => {
			if (prop.name === "$search" || prop.name === "$editState" || prop.key === undefined) {
				return;
			}

			// Find a matching selection field by annotation path
			const matchingSelectionField = selectionFieldsMap && prop.annotationPath ? selectionFieldsMap[prop.annotationPath] : undefined;

			if (matchingSelectionField) {
				// Propagate properties from selection field
				this._mergeSelectionFieldProperties(prop, matchingSelectionField);

				// Update the existing selection field
				const index = fieldNames.indexOf(matchingSelectionField.key);
				if (index !== -1) {
					selectionFields[index] = prop as FilterField;
				}
			} else if (fieldNames.includes(prop.key) && prop.key) {
				// Update existing field if it exists in selectionFields by key
				const selField = selectionFields[fieldNames.indexOf(prop.key)];
				if (selField.annotationPath) {
					this._mergeSelectionFieldProperties(prop, selField);
					const index = fieldNames.indexOf(prop.key);
					selectionFields[index] = prop as FilterField;
				}
			} else if (!prop.annotationPath) {
				// Add new field if it doesn't exist and annotation path is not present
				selectionFields.push(prop as FilterField);
			}
		});
		return selectionFields;
	},
	/**
	 * Merges properties from an existing selection field into the property info field.
	 * @param prop The property info field to update
	 * @param existingField The existing selection field to merge from
	 */
	_mergeSelectionFieldProperties: function (prop: PropertyInfo, existingField: FilterField): void {
		prop.group = existingField.group;
		prop.groupLabel = existingField.groupLabel;
		prop.settings = existingField.settings;
		prop.visualFilter = existingField.visualFilter;
		prop.label = prop.label || existingField.label; // Use propertyInfo labels as they can have custom labels
		prop.annotationPath = prop.annotationPath || existingField.annotationPath;
	},
	_getSearchField: function (oIFilter: Partial<IFilterControl>, aIgnoreProperties: string[]): string | null {
		return oIFilter.getSearch && !aIgnoreProperties.includes("search") ? oIFilter.getSearch() : null;
	},
	_getFilterConditions: function (
		mProperties: { ignoredProperties?: string[]; propertiesMetadata?: PropertyInfo[]; targetControl?: Control } | undefined,
		mFilterConditions: Record<string, ConditionObject[]>,
		oIFilter: IFilterControl
	): Record<string, ConditionObject[]> {
		const mConditions = mFilterConditions || oIFilter.getConditions();
		if (mProperties && mProperties.targetControl && mProperties.targetControl.isA("sap.ui.mdc.Chart")) {
			Object.keys(mConditions).forEach(function (sKey: string) {
				if (sKey === "$editState") {
					delete mConditions["$editState"];
				}
			});
		}
		return mConditions;
	},
	_getFilterPropertiesMetadata: function (
		aFilterPropertiesMetadata: PropertyInfo[] | null,
		oIFilter: IFilterControl
	): PropertyInfo[] | null {
		if (!(aFilterPropertiesMetadata && aFilterPropertiesMetadata.length)) {
			if (oIFilter.getPropertyInfo) {
				aFilterPropertiesMetadata = oIFilter.getPropertyInfo();
			} else {
				aFilterPropertiesMetadata = null;
			}
		}
		return aFilterPropertiesMetadata;
	},
	_getIgnoredProperties: function (filterPropertiesMetadata: PropertyInfo[], entityProperties: PropertyInfo[]): string[] {
		const ignoreProperties: string[] = [];
		filterPropertiesMetadata.forEach(function (filterProperty) {
			const filterPropertyName = filterProperty.name;
			const entityPropertiesCurrent = entityProperties.find((entity) => entity.name === filterPropertyName);
			if (
				entityPropertiesCurrent &&
				((!filterProperty.isCustomFilter && filterProperty.dataType !== entityPropertiesCurrent.dataType) ||
					// custom filters will have an annotation path applied in the converter when there is a matching property found
					(filterProperty.isCustomFilter && entityPropertiesCurrent.annotationPath === undefined))
			) {
				ignoreProperties.push(filterPropertyName);
			}
		});
		return ignoreProperties;
	},
	getFilters: function (filterBar?: IFilterControl): InternalBindingInfo | undefined {
		if (!filterBar || typeof filterBar.isInitialized !== "function" || !filterBar.isInitialized()) {
			return;
		}
		const { parameters, filters, search } = this.getFilterInfo(filterBar);
		return { parameters, filters, search };
	},
	/**
	 * Prepares propertyInfo for sharing it outside FE, removes unwanted property.
	 * @param propertyInfos Array of propertyInfo
	 * @returns Array or String (for FilterBar templating) of PropertyInfos after removing the unwanted properties
	 */
	formatPropertyInfo: function (propertyInfos: PropertyInfo[] | string): PropertyInfoExternal[] | string {
		if (typeof propertyInfos === "string") {
			let propInfo = propertyInfos.replace(/\\\{/g, "{");
			propInfo = propInfo.replace(/\\\}/g, "}");
			let propInfos = JSON.parse(propInfo);
			propInfos = this._formatPropertyInfo(propInfos);
			let propertyInfoForFilterBar = JSON.stringify(propInfos);
			propertyInfoForFilterBar = propertyInfoForFilterBar.replace(/\{/g, "\\{");
			propertyInfoForFilterBar = propertyInfoForFilterBar.replace(/\}/g, "\\}");
			return propertyInfoForFilterBar;
		} else {
			return this._formatPropertyInfo(propertyInfos);
		}
	},
	/**
	 * Removes unwanted property from PropertyInfos.
	 * @param propertyInfos Array of propertyInfo
	 * @returns Array of PropertyInfos after removing the unwanted properties
	 */
	_formatPropertyInfo: function (propertyInfos: PropertyInfo[]): PropertyInfoExternal[] {
		return propertyInfos.map((property) => {
			const _propertyInfo: PropertyInfoExternal = {
				key: property.key || property.name,
				dataType: "",
				label: ""
			};
			for (const key in PropertyInfoKeys) {
				if (property.hasOwnProperty(key)) {
					switch (key) {
						case "hiddenFilter":
							_propertyInfo.hiddenFilter = property.hiddenFilter;
							break;
						case "required":
							_propertyInfo.required = property.required;
							break;
						case "path":
							_propertyInfo.path = property.path;
							break;
						case "tooltip":
							_propertyInfo.tooltip = property.tooltip;
							break;
						case "visible":
							_propertyInfo.visible = property.visible;
							break;
						case "maxConditions":
							_propertyInfo.maxConditions = property.maxConditions;
							break;
						case "formatOptions":
							_propertyInfo.formatOptions = property.formatOptions;
							break;
						case "constraints":
							_propertyInfo.constraints = property.constraints;
							break;
						case "group":
							_propertyInfo.group = property.group;
							break;
						case "groupLabel":
							_propertyInfo.groupLabel = property.groupLabel;
							break;
						case "caseSensitive":
							_propertyInfo.caseSensitive = property.caseSensitive;
					}
				}
			}
			if (property.dataType) {
				_propertyInfo.dataType = property.dataType;
			} else {
				throw new Error(`Missing mandatory property dataType for filter-bar filter field: ${property}`);
			}
			if (property.label) {
				_propertyInfo.label = property.label;
			}
			return _propertyInfo;
		});
	},

	/**
	 * Checks if the Property already exists in the propertyInfo array, used during templating to avoid duplicates.
	 * @param parentControl FilterBar control where the custom data is stored
	 * @param modifier Modifier
	 * @param propertyInfoName Name of the property to be checked
	 * @returns Array of PropertyInfos after removing the unwanted properties
	 */
	_checkIfPropertyInfoExists: async function (
		parentControl: FilterBar,
		modifier: BaseTreeModifier,
		propertyInfoName: string
	): Promise<boolean> {
		let propertyInfo: PropertyInfo[] = [];
		try {
			const customDataValue = await DelegateUtil.getCustomDataWithModifier<string>(parentControl, "feFilterInfo", modifier);
			if (customDataValue) {
				propertyInfo = JSON.parse(customDataValue);
				return propertyInfo.some((obj: PropertyInfo) => obj.name === propertyInfoName);
			}
			return false;
		} catch (error) {
			return false;
		}
	}
};

export default oFilterUtils;
