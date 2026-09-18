import type { EntitySet } from "@sap-ux/vocabularies-types";
import { compileExpression, formatResult, pathInModel } from "sap/fe/base/BindingToolkit";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import type ConverterContext from "sap/fe/core/converters/ConverterContext";
import type {
	DefaultOperator,
	FilterFieldManifestConfiguration,
	FilterManifestConfiguration
} from "sap/fe/core/converters/ManifestSettings";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import { getSelectionVariant } from "sap/fe/core/converters/controls/Common/DataVisualization";
import FilterRestrictions from "sap/fe/core/converters/controls/Common/filter/FilterRestrictions";
import type { FilterField as ConvertedFilterField } from "sap/fe/core/converters/controls/ListReport/FilterBar";
import { getFilterConfigurationPath, getSelectionFields, type PropertyInfo } from "sap/fe/core/converters/controls/ListReport/FilterBar";
import standardFormatter from "sap/fe/core/formatters/StandardFormatter";
import { getSearchRestrictions } from "sap/fe/core/helpers/MetaModelFunction";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import type { ViewData } from "sap/fe/core/services/TemplatedViewServiceFactory";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import type { DisplayMode } from "sap/fe/core/templating/UIFormatters";
import CommonHelper from "sap/fe/macros/CommonHelper";
import FieldHelper from "sap/fe/macros/field/FieldHelper";
import { maxConditions } from "sap/fe/macros/filter/FilterFieldHelper";
import FilterUtils from "sap/fe/macros/filter/FilterUtils";
import DraftEditState from "sap/fe/macros/filterBar/DraftEditState";
import type FilterField from "sap/fe/macros/filterBar/FilterField";
import FilterFieldCreator from "sap/fe/macros/filterBar/FilterFieldTemplate";
import { type FilterConditions, getFilterConditions } from "sap/fe/macros/filterBar/FilterHelper";
import CustomFragment from "sap/fe/macros/fpm/CustomFragment";
import Select from "sap/m/Select";
import type Control from "sap/ui/core/Control";
import CustomData from "sap/ui/core/CustomData";
import ListItem from "sap/ui/core/ListItem";
import FieldHelpCustomData from "sap/ui/core/fieldhelp/FieldHelpCustomData";
import type { IContext } from "sap/ui/core/util/XMLPreprocessor";
import type VariantManagement from "sap/ui/fl/variants/VariantManagement";
import MDCFilterField from "sap/ui/mdc/FilterField";
import type { ConditionObject } from "sap/ui/mdc/condition/Condition";
import type FilterBarP13nMode from "sap/ui/mdc/enums/FilterBarP13nMode";
import PersistenceProvider from "sap/ui/mdc/p13n/PersistenceProvider";
import type Context from "sap/ui/model/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import ValueHelp from "../ValueHelp";
import CustomFilterFieldContentWrapper from "../controls/CustomFilterFieldContentWrapper";
import FEFilterBar from "../controls/FilterBar";
import type FilterBarEventHandlerProvider from "./FilterBarEventHandlersProvider";
import type FilterFieldOverride from "./FilterFieldOverride";

export type FilterBarTemplateProperties = {
	// Translation functions
	getTranslatedText(text: string, parameters?: unknown[], metaPath?: string): string;
	checkIfResourceKeyExists(textID: string): boolean;

	// Core identifiers
	id?: string;
	_contentId?: string;

	// Public properties for BB (stored as strings during templating phase)
	visible?: string | boolean;
	liveMode?: string | boolean;
	showMessages?: string | boolean;
	showClearButton?: string | boolean;
	filterFields?: (FilterField | FilterFieldOverride)[];
	navigationPropertiesForPersonalization?: string | string[];

	// Private properties (for internal use only, like FE templates)
	hideBasicSearch?: boolean;
	showAdaptFiltersButton?: boolean;
	useSemanticDateRange: boolean;
	navigationProperties?: string[];
	filterConditions?: string | Record<string, FilterConditions[]>;
	suspendSelection?: boolean;
	ignorePersonalizationChanges?: boolean;
	p13nMode?: string | FilterBarP13nMode;
	toggleControlId?: string;
	initialLayout?: string;
	disableDraftEditStateFilter?: boolean;
	variantBackreference?: string | VariantManagement;
	selectionFields?: ConvertedFilterField[] | Context;

	// Internal properties
	idPrefix?: string;
	isDraftCollaborative?: boolean;
	adaptFiltersNonZeroText?: string;
	adaptFiltersText?: string;
	_internalContextPath: Context;
	parameters?: string;
	_annotationPath?: string;
	filterBarDelegate?: string;
	propertyInfo?: PropertyInfo[];
	_valueHelps: Array<string | ValueHelp | PersistenceProvider> | "" | undefined;
	_filterFieldDisplayPromises: Promise<DisplayMode | undefined>[];
	_filterFieldControls?: MDCFilterField[];
	showDraftEditState?: boolean;
	designtime?: string;
	templateComponent?: TemplateComponent;
	contextPathToUse: string;
	handlerProvider: FilterBarEventHandlerProvider;
	filterFieldConfigs?: Record<string, FilterFieldManifestConfiguration>;
	rendererWrapper?: <T extends Control>(contentFunc: () => T) => T;
};

function processPropertyInfos(this: FilterBarTemplateProperties, propertyInfo: string, metaModel: ODataMetaModel): void {
	const parameterFields: string[] = [];
	if (propertyInfo) {
		const fetchedPropertiesStr = propertyInfo.replace(/\\{/g, "{").replace(/\\}/g, "}");
		const fetchedProperties = JSON.parse(fetchedPropertiesStr);
		const editStateLabel = this.getTranslatedText("FILTERBAR_EDITING_STATUS");
		fetchedProperties.forEach(function (propInfo: PropertyInfo) {
			propInfo.key = propInfo.name;
			if (propInfo.isParameter) {
				parameterFields.push(propInfo.name);
			}
			if (propInfo.path === "$editState") {
				propInfo.label = editStateLabel;
			}
			if (propInfo.key?.includes("/")) {
				//TO DO: Need to place this logic in common place when we cover filterRetrictions with this BLI FIORITECHP1-25080
				const annotationPath = (propInfo as ConvertedFilterField).annotationPath;
				const propertyLocationPath = CommonHelper.getLocationForPropertyPath(metaModel, annotationPath);
				const propertyPath = annotationPath.replace(`${propertyLocationPath}/`, "");
				const dataModel = MetaModelConverter.getInvolvedDataModelObjects(metaModel.getContext(propertyLocationPath));

				propInfo.required = FilterRestrictions.getFilterRestrictionsByDataModel(
					dataModel as DataModelObjectPath<PageContextPathTarget>
				)?.RequiredProperties?.includes(propertyPath);
			}
		});

		this.propertyInfo = fetchedProperties;
	}
	this.parameters = JSON.stringify(parameterFields);
}

function checkIfEditingFilterIsDisabled(this: FilterBarTemplateProperties, targetEntitySet: EntitySet): void {
	if (
		targetEntitySet.annotations?.Capabilities?.NavigationRestrictions?.RestrictedProperties?.some(
			(r) => r.NavigationProperty?.value === "DraftAdministrativeData" && r.FilterRestrictions?.Filterable === false
		) === true
	) {
		this.showDraftEditState = false;
	}
}

function checkIfCollaborationDraftSupported(this: FilterBarTemplateProperties, oMetaModel: ODataMetaModel | undefined): void {
	if (ModelHelper.isCollaborationDraftSupported(oMetaModel)) {
		this.isDraftCollaborative = true;
	}
}

function getEntityTypePath(metaPathParts: string[]): string {
	return metaPathParts[0].endsWith("/") ? metaPathParts[0] : metaPathParts[0] + "/";
}

function getSearch(this: FilterBarTemplateProperties): string {
	if (!this.hideBasicSearch) {
		return (
			<MDCFilterField
				id={generate([this.idPrefix, "BasicSearchField"])}
				label={""}
				placeholder="{sap.fe.i18n>M_FILTERBAR_SEARCH}"
				propertyKey="$search"
				conditions="{$filters>/conditions/$search}"
				dataType="sap.ui.model.odata.type.String"
				maxConditions="1"
				dataTypeConstraints={{ maxLength: 1000 }}
			/>
		);
	}
	return "";
}

function processSelectionFields(this: FilterBarTemplateProperties): void {
	if (this.showDraftEditState) {
		const draftStates = DraftEditState.getEditStates(this.isDraftCollaborative ?? false);
		const label = this.getTranslatedText("FILTERBAR_EDITING_STATUS");
		const draftEditState = (
			<MDCFilterField
				label={label}
				conditions="{$filters>/conditions/$editState}"
				maxConditions="1"
				id={generate([this.idPrefix, "FilterField", "DraftEditingStatus"])}
				operators="EQ"
				dataType="sap.ui.model.odata.type.String"
				propertyKey="$editState"
				display="Description"
			>
				{{
					contentEdit: (
						<Select
							id={generate([this.idPrefix, "FilterField", "DraftEditingStatusSelect"])}
							width="100%"
							forceSelection="true"
							selectedKey="{path: '$field>/conditions', type: 'sap.ui.mdc.field.ConditionsType'}"
						>
							{{ items: draftStates.map((state) => <ListItem key={state.id} text={state.display} />) }}
						</Select>
					)
				}}
			</MDCFilterField>
		);
		this._filterFieldControls?.push(draftEditState);
	}
	if (this.selectionFields && Array.isArray(this.selectionFields)) {
		this.selectionFields?.forEach((selectionField: ConvertedFilterField) => {
			if (selectionField.availability === "Default") {
				setFilterFieldsAndValueHelps.call(this, selectionField) as unknown as Control;
			}
		});
	}
}

function getPersistenceProvider(this: FilterBarTemplateProperties): PersistenceProvider | undefined {
	if (this.ignorePersonalizationChanges) {
		return <PersistenceProvider id={generate([this._contentId, "PersistenceProvider"])} for={this._contentId} mode={"Transient"} />;
	}
	return undefined;
}

function getSlotFilterField(this: FilterBarTemplateProperties, selectionField: ConvertedFilterField): Control | undefined {
	return this.filterFields?.find((ff) => ff.key === selectionField.key)?.getAggregation("template") as Control | undefined;
}

function setFilterFieldsAndValueHelps(this: FilterBarTemplateProperties, selectionField: ConvertedFilterField): void {
	if (selectionField.template === undefined && selectionField.type !== "Slot") {
		pushFilterFieldsAndValueHelps.call(this, selectionField);
	} else if (Array.isArray(this._filterFieldControls)) {
		const customFilterField = getCustomFilterField.call(this, selectionField);
		this._filterFieldControls.push(customFilterField);
	}
}

export function getCustomFilterField(this: FilterBarTemplateProperties, selectionField: ConvertedFilterField): MDCFilterField {
	const property = selectionField.annotationPath;
	const propertyContext = this._internalContextPath.getModel().createBindingContext(property) as Context;
	const propertyObject = propertyContext?.getObject();
	let filterContent;
	if (selectionField.type === "Slot") {
		filterContent = getSlotFilterField.call(this, selectionField);
	} else if (selectionField.template) {
		filterContent = (
			<CustomFragment
				fragmentName={selectionField.template}
				id={generate([this.idPrefix, "CustomFilterField", selectionField.key])}
				contextPath={this._internalContextPath.getPath()}
				containingView={this.templateComponent?.getRootController()?.getView()}
			/>
		);
	}
	let maxConditionValue = -1;
	if (propertyContext) {
		maxConditionValue = maxConditions(selectionField.annotationPath, { context: propertyContext }) ?? -1;
	}
	const formattedResult = compileExpression(formatResult([selectionField.documentRefText ?? undefined], standardFormatter.asArray));
	const propertyInfo = this.propertyInfo?.find((p) => p.key === selectionField.key);

	return (
		<MDCFilterField
			id={generate([this.idPrefix, "CustomFilterField", selectionField.key])}
			delegate={{ name: "sap/fe/macros/field/FieldBaseDelegate" }}
			propertyKey={selectionField.conditionPath}
			label={selectionField.label}
			dataType={selectionField.dataType ?? propertyInfo?.dataType}
			maxConditions={maxConditionValue}
			conditions={`{$filters>/conditions/${selectionField.conditionPath}}`}
			operators={FieldHelper.operators(
				propertyContext,
				propertyObject,
				this.useSemanticDateRange,
				selectionField.settings as unknown as string,
				this.contextPathToUse
			)}
			dataTypeConstraints={(selectionField as unknown as { constraints: unknown }).constraints ?? propertyInfo?.constraints}
			dataTypeFormatOptions={(selectionField as unknown as { formatOptions: unknown }).formatOptions ?? propertyInfo?.formatOptions}
			valueHelp={"undefined"}
			required={selectionField.required}
		>
			{{
				content: (
					<CustomFilterFieldContentWrapper
						core:require="{handler: 'sap/fe/macros/filter/FilterUtils'}"
						id={generate([this.idPrefix, "FilterFieldContentWrapper", selectionField.key])}
						binding={`{filterValues>/${FilterUtils.conditionToModelPath(selectionField.conditionPath)}}`}
						conditions={"{path: '$field>/conditions'}" as unknown as ConditionObject[]}
					>
						{{ content: filterContent }}
					</CustomFilterFieldContentWrapper>
				),
				customData: [
					<CustomData key={"isSlot"} value={selectionField.type === "Slot"} />,
					<FieldHelpCustomData key={"sap-ui-DocumentationRef"} value={formattedResult} />
				]
			}}
		</MDCFilterField>
	);
}

function _getContextPathForFilterField(selectionField: ConvertedFilterField, filterBarContextPath: Context): string {
	let contextPath: string = filterBarContextPath?.getPath();
	if (selectionField.isParameter) {
		// Example:
		// FilterBarContextPath: /Customer/Set
		// ParameterPropertyPath: /Customer/P_CC
		// ContextPathForFilterField: /Customer
		const annoPath = selectionField.annotationPath;
		contextPath = annoPath.substring(0, annoPath.lastIndexOf("/") + 1);
	}
	return contextPath;
}

function pushFilterFieldsAndValueHelps(this: FilterBarTemplateProperties, selectionField: ConvertedFilterField): void {
	if (Array.isArray(this._filterFieldControls)) {
		const vf = selectionField.visualFilter;
		if (vf) {
			vf.initialChartBindingEnabled = !this.suspendSelection;
		}
		const filterField = new FilterFieldCreator({
			idPrefix: generate([this.idPrefix, "FilterField", CommonHelper.getNavigationPath(selectionField.annotationPath)]),
			vhIdPrefix: generate([this.idPrefix, "FilterFieldValueHelp"]),
			propertyPath: selectionField.annotationPath,
			contextPath: _getContextPathForFilterField(selectionField, this._internalContextPath),
			useSemanticDateRange: this.useSemanticDateRange,
			label: selectionField.label,
			settings: selectionField.settings,
			visualFilter: vf,
			required: selectionField.required,
			editMode: compileExpression(pathInModel(`/${this.idPrefix}/filterFields/${selectionField.conditionPath}/editMode`, "internal")),
			metaModel: this._internalContextPath.getModel() as ODataMetaModel
		});
		const mdcFilterField = filterField.getMDCFilterField();
		if (mdcFilterField) {
			this._filterFieldControls.push(mdcFilterField);
			this._filterFieldDisplayPromises?.push(filterField.displayPromise);
		}
	}
	if (Array.isArray(this._valueHelps)) {
		this._valueHelps?.push(
			<ValueHelp
				idPrefix={generate([this.idPrefix, "FilterFieldValueHelp"])}
				conditionModel="$filters"
				metaPath={selectionField.annotationPath}
				contextPath={_getContextPathForFilterField(selectionField, this._internalContextPath)}
				filterFieldValueHelp={true}
				useSemanticDateRange={this.useSemanticDateRange}
			/>
		);
	}
}

/**
 * Determines the design time for the MDC FilterBar.
 * @returns The value to be assigned to dt:designtime
 */
function getDesignTime(): string | undefined {
	return "sap/fe/macros/filterBar/designtime/FilterBar.designtime";
}

export function initializeInternalMetaContext(this: FilterBarTemplateProperties, metaPath: string, metaModel: ODataMetaModel): void {
	let entityTypePath = "";
	const metaPathParts = metaPath.split("/@com.sap.vocabularies.UI.v1.SelectionFields") ?? []; // [0]: entityTypePath, [1]: SF Qualifier.
	if (metaPathParts.length > 0) {
		entityTypePath = getEntityTypePath(metaPathParts);
	}
	this._annotationPath = "@com.sap.vocabularies.UI.v1.SelectionFields" + ((metaPathParts.length && metaPathParts[1]) || "");
	this._internalContextPath = metaModel.createBindingContext(entityTypePath) as Context;
}

export function getExtraParams(this: FilterBarTemplateProperties): Record<string, FilterManifestConfiguration> {
	if (!this._annotationPath) {
		return {};
	}
	return FilterUtils.getExtraParams(this, this._annotationPath, this._internalContextPath.getPath(), this.contextPathToUse);
}
export function setupFilterBarSettings(
	this: FilterBarTemplateProperties,
	metaModel: ODataMetaModel,
	converterContext: ConverterContext<PageContextPathTarget>,
	viewData: ViewData
): void {
	this.rendererWrapper = this.rendererWrapper?.bind(this) ?? (<T extends Control>(renderMethod: () => T): T => renderMethod());
	const targetEntitySet = converterContext.getEntitySet() as EntitySet;
	if (targetEntitySet?.annotations?.Common?.DraftRoot && !this.disableDraftEditStateFilter) {
		this.showDraftEditState = true;
		checkIfEditingFilterIsDisabled.call(this, targetEntitySet);
		checkIfCollaborationDraftSupported.call(this, metaModel);
	}

	const hasOverride = this.checkIfResourceKeyExists("M_FILTERBAR_ADAPT_FILTERS_NON_ZERO");
	if (hasOverride) {
		this.adaptFiltersNonZeroText = this.getTranslatedText("M_FILTERBAR_ADAPT_FILTERS_NON_ZERO").replaceAll("{", "\\{");
		this.adaptFiltersText = this.getTranslatedText("M_FILTERBAR_ADAPT_FILTERS");
	}
	const selectionFieldsObj = getSelectionFields(converterContext, [], this._annotationPath);
	const propertyInfoString = selectionFieldsObj.sPropertyInfo;
	const filterConfigPath = getFilterConfigurationPath(this._annotationPath!, this._internalContextPath.getPath(), this.contextPathToUse);
	const filterBarConfigs = converterContext.getManifestControlConfiguration<FilterManifestConfiguration>(filterConfigPath) ?? {};

	this.showMessages = filterBarConfigs.showMessages ?? this.showMessages;

	//Filter Fields and values to the field are filled based on the selectionFields and this would be empty in case of macro outside the FE template
	if (!this.selectionFields) {
		this.selectionFields = selectionFieldsObj.selectionFields;

		const entityType = converterContext.getEntityType(),
			selectionVariant = getSelectionVariant(entityType, converterContext),
			defaultSemanticDates: Record<string, DefaultOperator[]> = {},
			ffConfigs = filterBarConfigs.filterFields ?? {};

		// Extract defaultValues from controlConfiguration for semantic date operators
		for (const propertyName in ffConfigs) {
			const fieldConfig = ffConfigs[propertyName];
			if (fieldConfig?.settings?.defaultValues && Array.isArray(fieldConfig.settings.defaultValues)) {
				defaultSemanticDates[propertyName] = fieldConfig.settings.defaultValues;
			}
		}

		const filterConditions = getFilterConditions(
			this._internalContextPath as unknown as IContext,
			{
				selectionVariant: selectionVariant,
				defaultSemanticDates: Object.keys(defaultSemanticDates).length > 0 ? defaultSemanticDates : undefined
			},
			this._internalContextPath.getObject(),
			viewData,
			this.showDraftEditState,
			true
		);
		this.filterConditions = filterConditions as Record<string, FilterConditions[]> | undefined;
	}
	processPropertyInfos.call(this, propertyInfoString, metaModel);

	if (this.hideBasicSearch !== true) {
		const searchRestrictionAnnotation = getSearchRestrictions(this._internalContextPath.getPath(), metaModel);
		this.hideBasicSearch = Boolean(searchRestrictionAnnotation && !searchRestrictionAnnotation.Searchable);
	}
	processSelectionFields.call(this);

	this.designtime = getDesignTime();
}

export function getFEFilterBarTemplate(this: FilterBarTemplateProperties): FEFilterBar {
	const _internalContextPath = this._internalContextPath?.getPath();
	const filterDelegate = this.filterBarDelegate
		? JSON.parse(this.filterBarDelegate)
		: {
				name: "sap/fe/macros/filterBar/FilterBarDelegate",
				payload: { entityTypePath: _internalContextPath }
		  };

	const dependents = Array.isArray(this._valueHelps) ? [...this._valueHelps] : [];
	const persistenceProvider = getPersistenceProvider.call(this);
	if (persistenceProvider) {
		dependents.push(persistenceProvider);
	}
	const runAsOwner = this.templateComponent?.runAsOwner?.bind(this.templateComponent) ?? ((r: () => FEFilterBar): FEFilterBar => r());
	return runAsOwner(() => {
		return (
			<FEFilterBar
				core:require="{API: 'sap/fe/macros/FilterBar'}"
				adaptFiltersText={this.adaptFiltersText}
				adaptFiltersTextNonZero={this.adaptFiltersNonZeroText}
				id={this._contentId}
				liveMode={this.liveMode}
				delegate={filterDelegate}
				variantBackreference={this.liveMode ? undefined : this.variantBackreference ?? undefined}
				showAdaptFiltersButton={this.showAdaptFiltersButton}
				showClearButton={this.showClearButton}
				p13nMode={this.p13nMode}
				search={this.handlerProvider.getSearchHandler()}
				filtersChanged={this.handlerProvider.getFiltersChangedHandler()}
				filterConditions={this.filterConditions}
				suspendSelection={this.suspendSelection}
				showMessages={this.showMessages}
				toggleControl={this.toggleControlId}
				initialLayout={this.initialLayout}
				disableDraftEditStateFilter={this.disableDraftEditStateFilter}
				dt:designtime={this.designtime}
			>
				{{
					customData: [
						<CustomData key={"localId"} value={this.idPrefix} />,
						<CustomData key={"hideBasicSearch"} value={this.hideBasicSearch} />,
						<CustomData key={"showDraftEditState"} value={this.showDraftEditState} />,
						<CustomData key={"useSemanticDateRange"} value={this.useSemanticDateRange} />,
						<CustomData key={"parameters"} value={this.parameters} />,
						<CustomData
							key={"feFilterInfo"}
							value={JSON.stringify(this.propertyInfo).replace(/\{/g, "\\{").replace(/\}/g, "\\}")}
						/>,
						<CustomData key={"annotationPath"} value={this._annotationPath} />,
						<CustomData key={"entityType"} value={_internalContextPath} />
					],
					dependents: dependents,
					basicSearchField: getSearch.call(this),
					filterItems: this._filterFieldControls
				}}
			</FEFilterBar>
		);
	});
}
