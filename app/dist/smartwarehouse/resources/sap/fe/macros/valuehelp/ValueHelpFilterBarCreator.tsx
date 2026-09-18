import type { EntitySet } from "@sap-ux/vocabularies-types";
import type { ValueList } from "@sap-ux/vocabularies-types/vocabularies/Common";
import Log from "sap/base/Log";
import merge from "sap/base/util/merge";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import CommonUtils from "sap/fe/core/CommonUtils";
import ConverterContext from "sap/fe/core/converters/ConverterContext";
import type { BaseManifestSettings } from "sap/fe/core/converters/ManifestSettings";
import ManifestWrapper from "sap/fe/core/converters/ManifestWrapper";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import type { IDiagnostics } from "sap/fe/core/converters/TemplateConverter";
import type { FilterField as ConvertedFilterField } from "sap/fe/core/converters/controls/ListReport/FilterBar";
import { getExpandFilterFields, getSelectionFields } from "sap/fe/core/converters/controls/ListReport/FilterBar";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import CommonHelper from "sap/fe/macros/CommonHelper";
import ValueHelp from "sap/fe/macros/ValueHelp";
import FilterFieldCreator from "sap/fe/macros/filterBar/FilterFieldTemplate";
import CustomData from "sap/ui/core/CustomData";
import type { $ControlSettings } from "sap/ui/mdc/Control";
import MDCFilterField from "sap/ui/mdc/FilterField";
import type FilterBarP13nMode from "sap/ui/mdc/enums/FilterBarP13nMode";
import MDCValueHelpFilterBar from "sap/ui/mdc/valuehelp/FilterBar";
import type Context from "sap/ui/model/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type { MetaModelType } from "types/metamodel_types";
import type { FilterConditions } from "../filterBar/FilterHelper";
import { getViewDataForTemplate } from "../internal/valuehelp/ValueHelpUtils";
import type { ValueListInfo } from "../internal/valuehelp/ValueListHelper";

export default class ValueHelpFilterBarCreator {
	/*********** PUBLIC PROPERTIES ***********/

	/**
	 * Source Id to be used as prefix for the filter bar id
	 */
	public sourceId!: string;

	/**
	 * Meta path for the filter bar
	 */
	public metaPath!: Context;

	/**
	 * 'valuelist' object containing all relevant information
	 */
	public valueListInfo?: ValueListInfo;

	/**
	 * Parent Value Help control
	 */
	public parentVHControl!: ValueHelp;

	/**
	 * Don't show the basic search field
	 */
	public hideBasicSearch = false;

	/**
	 * Enables the fallback to show all fields of the EntityType as filter fields if com.sap.vocabularies.UI.v1.SelectionFields are not present
	 */
	public enableFallback = false;

	/**
	 * Specifies the personalization options for the filter bar.
	 */
	public p13nMode: FilterBarP13nMode[] = [];

	/**
	 * Specifies the Sematic Date Range option for the filter bar.
	 */
	public useSemanticDateRange = true;

	/**
	 * If set the search will be automatically triggered, when a filter value was changed.
	 */
	public liveMode = false;

	/**
	 * Filter conditions to be applied to the filter bar
	 */
	public filterConditions: Record<string, FilterConditions[]> | undefined = undefined;

	/**
	 * If set to <code>true</code>, all search requests are ignored. Once it has been set to <code>false</code>,
	 * a search is triggered immediately if one or more search requests have been triggered in the meantime
	 * but were ignored based on the setting.
	 */
	public suspendSelection = false;

	/*********** PRIVATE PROPERTIES ***********/

	/**
	 * Id for the ValueHelpFilterBar instance
	 */
	private id!: string;

	/**
	 * Selection field from converter context
	 */
	private selectionFields?: ConvertedFilterField[];

	/**
	 * Determines whether the Show/Hide Filters button is in the state show or hide.
	 */
	private expandFilterFields = true;

	/**
	 * Array to store value helps
	 */
	private valueHelps: ValueHelp[] = [];

	/**
	 * Array to store filter fields
	 */
	private filterFields: MDCFilterField[] = [];

	/**
	 * Internal property to store data model object path
	 */
	private dataModelObjectPath?: DataModelObjectPath<EntitySet>;

	/*
	 * Context path
	 */
	private contextPath!: string;

	/**
	 * Meta model
	 */
	private metaModel!: ODataMetaModel;

	/**
	 * Converter context
	 */
	private converterContext!: ConverterContext;

	/**
	 * For caching Value help filter bar
	 */
	private valueHelpFilterBar?: MDCValueHelpFilterBar;

	constructor(props: $ControlSettings & PropertiesOf<ValueHelpFilterBarCreator>) {
		if (!props.metaPath) {
			Log.error("ValueHelpFilterBar requires a metaPath property to be set.");
			return;
		}

		this.valueHelps = [];
		this.filterFields = [];
		this.id = generate([props.sourceId, "FilterBar"]);
		this.metaPath = props.metaPath;
		this.hideBasicSearch = props.hideBasicSearch ?? false;
		this.enableFallback = props.enableFallback ?? false;
		this.p13nMode = props.p13nMode ?? [];
		this.useSemanticDateRange = props.useSemanticDateRange ?? true;
		this.liveMode = props.liveMode ?? false;
		this.filterConditions = props.filterConditions;
		this.parentVHControl = props.parentVHControl as ValueHelp;
		this.valueListInfo = props.valueListInfo;
		this.metaModel = this.metaPath.getModel();
		this.contextPath = this.metaModel.getMetaPath(this.metaPath.getPath());
		this.dataModelObjectPath = getInvolvedDataModelObjects(this.metaPath);
		const containingView = CommonUtils.getTargetView(this.parentVHControl);
		const appComponent = CommonUtils.getAppComponent(containingView);
		const valueListAnnoInfo = this.valueListInfo?.valueListInfo;
		this.converterContext = ConverterContext.createConverterContextForMacro(
			this.dataModelObjectPath.startingEntitySet.name,
			this.metaModel,
			appComponent?.getDiagnostics() as unknown as IDiagnostics,
			merge,
			this.dataModelObjectPath.contextLocation,
			new ManifestWrapper(getViewDataForTemplate(this.valueListInfo?.columnDefs) as unknown as BaseManifestSettings, appComponent)
		);

		this.selectionFields = getSelectionFields(this.converterContext, []).selectionFields;

		const targetEntitySet: EntitySet = this.dataModelObjectPath.targetEntitySet as EntitySet; // It could be a singleton but the annotaiton are not defined there (yet?)
		this.expandFilterFields = getExpandFilterFields(
			this.converterContext,
			targetEntitySet.annotations.Capabilities?.FilterRestrictions,
			valueListAnnoInfo as unknown as MetaModelType<ValueList>
		);

		// Process selection fields and create value helps
		this.processSelectionFields();
	}

	/**
	 * Processes selection fields and creates value helps and filter fields for them.
	 */
	processSelectionFields(): void {
		// Create value helps and filter fields for selection fields
		if (Array.isArray(this.selectionFields)) {
			for (const selectionField of this.selectionFields) {
				if (selectionField.availability === "Default") {
					const annotationPath = selectionField.annotationPath;
					const navigationPath = CommonHelper.getNavigationPath(annotationPath);

					if (selectionField.template === undefined) {
						// Create filter field using FilterFieldCreator
						if (Array.isArray(this.filterFields)) {
							const filterField = new FilterFieldCreator({
								idPrefix: generate([this.id, "FilterField", navigationPath]),
								vhIdPrefix: generate([this.id, "FilterFieldValueHelp", navigationPath]),
								propertyPath: annotationPath,
								contextPath: this.contextPath,
								useSemanticDateRange: this.useSemanticDateRange,
								settings: selectionField.settings,
								metaModel: this.metaModel
							});
							const ff = filterField.getMDCFilterField();
							if (ff) {
								this.filterFields.push(ff);
							}
						}

						// Create value help
						if (Array.isArray(this.valueHelps)) {
							this.valueHelps.push(
								<ValueHelp
									idPrefix={generate([this.id, "FilterFieldValueHelp", navigationPath])}
									contextPath={this.contextPath}
									conditionModel="$filters"
									metaPath={annotationPath}
									metaModel={this.metaModel.getId()}
									filterFieldValueHelp={true}
									useSemanticDateRange={this.useSemanticDateRange}
								/>
							);
						}
					}
				}
			}
		}

		// Handle fallback case when no selection fields exist
		if (!this.dataModelObjectPath?.targetEntityType.annotations.UI?.SelectionFields && this.enableFallback) {
			const entityProperties = this.dataModelObjectPath?.targetEntityType.entityProperties;
			if (entityProperties) {
				for (const property of entityProperties) {
					const propertyName = property.name || "";
					const propPathDelimiter = this.contextPath.endsWith("/") ? "" : "/";
					const propertyPath = this.contextPath + propPathDelimiter + propertyName;

					// Create filter field for fallback properties
					if (Array.isArray(this.filterFields)) {
						const filterField = new FilterFieldCreator({
							idPrefix: generate([this.id, "FilterField"]),
							vhIdPrefix: generate([this.id, "FilterFieldValueHelp"]),
							propertyPath: propertyPath,
							contextPath: this.contextPath,
							useSemanticDateRange: this.useSemanticDateRange,
							metaModel: this.metaModel
						});
						const ff = filterField.getMDCFilterField();
						if (ff) {
							this.filterFields.push(ff);
						}
					}

					// Create value help for fallback properties
					if (Array.isArray(this.valueHelps)) {
						this.valueHelps.push(
							<ValueHelp
								idPrefix={generate([this.id, "FilterFieldValueHelp"])}
								contextPath={this.contextPath}
								conditionModel="$filters"
								metaPath={propertyPath}
								metaModel={this.metaModel.getId()}
								filterFieldValueHelp={true}
								useSemanticDateRange={this.useSemanticDateRange}
							/>
						);
					}
				}
			}
		}
	}

	getSearch = (): string => {
		if (!this.hideBasicSearch) {
			return (
				<MDCFilterField
					placeholder="{sap.fe.i18n>M_FILTERBAR_SEARCH}"
					propertyKey={"$search"}
					conditions="{$filters>/conditions/$search}"
					dataType={"sap.ui.model.type.String"}
					maxConditions={"1"}
				/>
			);
		}
		return "";
	};

	public getValueHelpFilterBar(): MDCValueHelpFilterBar {
		if (this.valueHelpFilterBar) {
			return this.valueHelpFilterBar;
		}

		this.valueHelpFilterBar = (
			<MDCValueHelpFilterBar
				id={this.id}
				liveMode={this.liveMode}
				delegate={{ name: "sap/fe/macros/filterBar/FilterBarDelegate", payload: { entityTypePath: this.contextPath } }}
				filterConditions={this.filterConditions}
				suspendSelection={this.suspendSelection}
				expandFilterFields={this.expandFilterFields}
				showMessages={false}
			>
				{{
					customData: [
						<CustomData key={"hideBasicSearch"} value={this.hideBasicSearch} />,
						<CustomData key={"useSemanticDateRange"} value={this.useSemanticDateRange} />,
						<CustomData key={"selectionFields"} value={this.selectionFields} />,
						<CustomData key={"entityType"} value={this.contextPath} />
					],
					dependents: [this.valueHelps],
					basicSearchField: this.getSearch(),
					filterItems: this.filterFields
				}}
			</MDCValueHelpFilterBar>
		) as MDCValueHelpFilterBar;
		return this.valueHelpFilterBar;
	}
}
