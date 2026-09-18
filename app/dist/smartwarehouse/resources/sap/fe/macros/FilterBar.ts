import type { EntitySet, Property, PropertyPath } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import merge from "sap/base/util/merge";
import type { EventsOf, PropertiesOf } from "sap/fe/base/ClassSupport";
import { aggregation, association, defineUI5Class, event, mixin, property, xmlEventHandler } from "sap/fe/base/ClassSupport";
import { controllerExtensionHandler } from "sap/fe/base/HookSupport";
import CommonUtils from "sap/fe/core/CommonUtils";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import type { TemplateProcessorSettings } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import type { ControlState, LegacyFilterBarState, NavigationParameter } from "sap/fe/core/controllerextensions/ViewState";
import type { FilterFieldManifestConfiguration } from "sap/fe/core/converters/ManifestSettings";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import type { FilterField as ConvertedFilterField, PropertyInfo } from "sap/fe/core/converters/controls/ListReport/FilterBar";
import type { Placement } from "sap/fe/core/converters/helpers/ConfigurableObject";
import PromiseKeeper from "sap/fe/core/helpers/PromiseKeeper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { InitialLoadMode } from "sap/fe/core/library";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { getContextRelativeTargetObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import type { DisplayMode } from "sap/fe/core/templating/UIFormatters";
import MacroAPI from "sap/fe/macros/MacroAPI";
import type { default as FEFilterBar } from "sap/fe/macros/controls/FilterBar";
import type { IFilterControl } from "sap/fe/macros/filter/FilterUtils";
import FilterUtils from "sap/fe/macros/filter/FilterUtils";
import type FilterField from "sap/fe/macros/filterBar/FilterField";
import type FilterFieldOverride from "sap/fe/macros/filterBar/FilterFieldOverride";
import SemanticDateOperators from "sap/fe/macros/filterBar/SemanticDateOperators";
import type { ControlPropertyInfo } from "sap/fe/macros/mdc/adapter/StateHelper";
import stateHelper from "sap/fe/macros/mdc/adapter/StateHelper";
import type { InternalBindingInfo } from "sap/fe/macros/table/Utils";
import type { ExternalStateType } from "sap/fe/macros/valuehelp/ValueHelpDelegate";
import SelectionVariant from "sap/fe/navigation/SelectionVariant";
import { NavType } from "sap/fe/navigation/library";
import type { default as ListReportController } from "sap/fe/templates/ListReport/ListReportController.controller";
import type Input from "sap/m/Input";
import type { Input$ValueHelpRequestEventParameters } from "sap/m/Input";
import type UI5Event from "sap/ui/base/Event";
import { type $ControlSettings } from "sap/ui/core/Control";
import UI5Element from "sap/ui/core/Element";
import type View from "sap/ui/core/mvc/View";
import ControlVariantApplyAPI from "sap/ui/fl/apply/api/ControlVariantApplyAPI";
import type VariantManagement from "sap/ui/fl/variants/VariantManagement";
import type VariantModel from "sap/ui/fl/variants/VariantModel";
import type { VariantData } from "sap/ui/fl/variants/VariantModel";
import type Control from "sap/ui/mdc/Control";
import type MDCFilterField from "sap/ui/mdc/FilterField";
import type ValueHelp from "sap/ui/mdc/ValueHelp";
import type { ConditionObject } from "sap/ui/mdc/condition/Condition";
import FieldEditMode from "sap/ui/mdc/enums/FieldEditMode";
import FilterBarP13nMode from "sap/ui/mdc/enums/FilterBarP13nMode";
import type {
	FilterBarBase$FiltersChangedEvent,
	FilterBarBase$FiltersChangedEventParameters,
	FilterBarBase$SearchEvent
} from "sap/ui/mdc/filterbar/FilterBarBase";
import type { Filter as StateUtilFilter } from "sap/ui/mdc/p13n/StateUtil";
import StateUtil from "sap/ui/mdc/p13n/StateUtil";
import type Context from "sap/ui/model/Context";
import type { default as ODataMetaModel } from "sap/ui/model/odata/v4/ODataMetaModel";
import jQuery from "sap/ui/thirdparty/jquery";
import type { EventHandler } from "../../../../../../types/extension_types";
import FilterBarEventHandlerProvider from "./filterBar/FilterBarEventHandlersProvider";
import {
	getExtraParams,
	getFEFilterBarTemplate,
	initializeInternalMetaContext,
	setupFilterBarSettings
} from "./filterBar/FilterBarTemplate";
import type { FilterConditions } from "./filterBar/FilterHelper";
import UOMValidationDelegate from "./filterBar/UOMValidationDelegate";
import FilterBarAPIStateHandler from "./filterBar/mixin/FilterBarAPIStateHandler";
// Track telemetry content for the filterBar
class FilterBarTelemetry {
	private countFilterActions = 0;

	private countVariantFilters = 0;

	constructor(private readonly filterBar: FilterBar) {}

	onFiltersChanged(reason?: string): void {
		if (reason === "Variant") {
			this.countVariantFilters++;
		} else {
			this.countFilterActions++;
		}
	}

	getFilterNamesFromConditions(conditions: Record<string, ConditionObject[]>): string {
		let filterNames = "";
		Object.keys(conditions).forEach((condition) => {
			if (condition != "$search") {
				filterNames += condition + ";";
			}
		});
		return filterNames;
	}
}

export type FilterBarState = {
	innerState?: {
		filter?: Record<string, ConditionObject[]>;
		initialState?: LegacyFilterBarState;
		fullState?: LegacyFilterBarState;
	};
};

type VariantIDs = {
	sPageVariantId: string;
	sFilterBarVariantId: string;
	sTableVariantId: string;
	sChartVariantId: string;
};

type VariantObject = {
	getKey(): string;
	getTitle(): string;
	getExecuteOnSelect(): boolean;
	getVisible(): boolean;
};

enum VariantManagementType {
	Control = "Control",
	Page = "Page",
	None = "None"
}

const DISPLAY_CURRENCY_PROPERTY_NAME = "DisplayCurrency";
const P_DISPLAY_CURRENCY_PROPERTY_NAME = "P_DisplayCurrency";

type LRViewData = {
	controlConfiguration?: Record<string, Record<string, unknown>>;
	entitySet?: string;
	contextPath?: string;
	variantManagement?: boolean | string;
};

/**
 * The key type includes 'boolean' to support legacy scenarios where 'dataLoaded' may be present at the parent level as a boolean,
 * as well as at instance level as an object with a 'dataLoaded' property. This ensures compatibility with both usages.
 */
type AdditionalStates = {
	dataLoaded?: boolean;
	[key: string]: { dataLoaded?: boolean } | boolean | undefined;
};

interface FilterBar extends FilterBarAPIStateHandler {}

/**
 * Building block for creating a FilterBar based on the metadata provided by OData V4.
 * {@link demo:sap/fe/core/fpmExplorer/index.html#/buildingBlocks/filterBar/filterBarDefault Overview of Building Blocks}
 * <br>
 * Usually, a SelectionFields annotation is expected.
 *
 *
 * Usage example:
 * <pre>
 * &lt;macros:FilterBar id="MyFilterBar" metaPath="@com.sap.vocabularies.UI.v1.SelectionFields" /&gt;
 * </pre>
 * @alias sap.fe.macros.FilterBar
 * @public
 */
@defineUI5Class("sap.fe.macros.FilterBar", {
	returnTypes: ["sap.fe.macros.MacroAPI"]
})
@mixin(FilterBarAPIStateHandler)
class FilterBar extends MacroAPI<FilterBar> {
	content!: FEFilterBar;

	/******************/
	/* PUBLIC SECTION */
	/******************/

	/**
	 * The identifier of the FilterBar control.
	 */
	@property({ type: "string" })
	id!: string;

	/**
	 * Defines the relative path of the property in the metamodel, based on the current contextPath.
	 * @public
	 */
	@property({
		type: "string",
		expectedAnnotations: ["com.sap.vocabularies.UI.v1.SelectionFields"],
		expectedTypes: ["EntitySet", "EntityType"],
		required: true
	})
	metaPath!: string;

	/**
	 * Defines the path of the context used in the current page or block.
	 * This setting is defined by the framework.
	 * @public
	 */
	@property({
		type: "string",
		expectedTypes: ["EntitySet", "EntityType", "NavigationProperty"]
	})
	contextPath!: string;

	/**
	 * Comma separated list of navigation properties which are considered for filtering.
	 * @public
	 */
	@property({
		type: "string[]",
		defaultValue: []
	})
	navigationPropertiesForPersonalization?: string[];

	/**
	 * If true, the search is triggered automatically when a filter value is changed.
	 * @public
	 */
	@property({ type: "boolean", defaultValue: false })
	liveMode?: boolean;

	/**
	 * Displays possible errors during the search in a message box
	 * @public
	 */
	@property({ type: "boolean", defaultValue: true })
	showMessages?: boolean;

	/**
	 * Handles the visibility of the 'Clear' button on the FilterBar.
	 * @public
	 */
	@property({ type: "boolean", defaultValue: false })
	showClearButton?: boolean;

	/**
	 * Aggregate filter fields of the FilterBar building block
	 * @public
	 */
	@aggregation({ type: "sap.fe.macros.filterBar.FilterField", altTypes: ["sap.fe.macros.filterBar.FilterFieldOverride"], multiple: true })
	filterFields?: (FilterField | FilterFieldOverride)[];

	/**
	 * This event is fired when the 'Go' button is pressed or after a condition change.
	 * @public
	 */
	@event()
	search!: EventHandler<UI5Event<{}, FilterBar>>;

	/**
	 * This event is fired after either a filter value or the visibility of a filter item has been changed. The event contains conditions that are used as filters.
	 * @public
	 */
	@event()
	filterChanged!: EventHandler<UI5Event<FilterBarBase$FiltersChangedEventParameters, FilterBar>>;

	/**
	 * This event is fired when the 'Clear' button is pressed. This is only possible when the 'Clear' button is enabled.
	 * @public
	 */
	@event()
	afterClear!: EventHandler<UI5Event<{}, FilterBar>>;

	/************************************************/
	/* PRIVATE SECTION - NOT PART OF THE PUBLIC API */
	/************************************************/

	/**
	 * This event is fired when the 'Go' button is pressed or after a condition change. This is only used internally by sap.fe (SAP Fiori elements) and
	 * exposes parameters from internal MDC-FilterBar search event
	 * NOTE: Used via LR Template
	 * @private
	 */
	@event()
	internalSearch!: string;

	/**
	 * This event is fired after either a filter value or the visibility of a filter item has been changed. The event contains conditions that will be used as filters.
	 * This is only used internally by sap.fe (SAP Fiori elements). This exposes parameters from the MDC-FilterBar filterChanged event that is used by sap.fe.
	 * NOTE: Used via LR Template
	 * @private
	 */
	@event()
	internalFilterChanged!: string;

	/**
	 * Selection fields
	 * NOTE: Used via LR Template
	 * @private
	 */
	@property({ type: "array" })
	selectionFields?: ConvertedFilterField[];

	/**
	 * ID of the assigned variant management
	 * NOTE: Used via LR Template
	 * @private
	 */
	@association({ type: "sap.ui.core.Control" })
	variantBackreference?: VariantManagement;

	/**
	 * Don't show the basic search field
	 * NOTE: Used via LR Template
	 * @private
	 */
	@property({ type: "boolean", defaultValue: false })
	hideBasicSearch!: boolean;

	/**
	 * Handles visibility of the 'Adapt Filters' button on the FilterBar
	 * NOTE: Used via LR Template
	 * @private
	 */
	@property({ type: "boolean" })
	showAdaptFiltersButton = true;

	/**
	 * Specifies the Sematic Date Range option for the filter bar.
	 * NOTE: Used via LR Template
	 * @private
	 */
	@property({ type: "boolean", defaultValue: true })
	useSemanticDateRange = true;

	/**
	 * Specifies the navigation properties option for the filter bar.
	 * Note:
	 * This property is used by present RTA implementations for filter bar adaptation. Before changing or removing this property, please check the impact on RTA.
	 * We pass navigationPropertiesForPersonalization to navigationProperties of manifest filter configurations directly.
	 * @private
	 */
	@property({
		type: "string[]",
		defaultValue: []
	})
	navigationProperties?: string[];

	/**
	 * Filter conditions to be applied to the filter bar
	 * NOTE: Used via LR Template
	 * @private
	 */
	@property({ type: "object", defaultValue: {} })
	filterConditions?: Record<string, FilterConditions[]>;

	/**
	 * If set to <code>true</code>, all search requests are ignored. Once it has been set to <code>false</code>,
	 * a search is triggered immediately if one or more search requests have been triggered in the meantime
	 * but were ignored based on the setting.
	 * NOTE: Used via LR Template
	 * @private
	 */
	@property({ type: "boolean", defaultValue: false })
	suspendSelection = false;

	/**
	 * This mode must be used when it is certain that a control must not persist it´s personalization state upon initialization.
	 * @since 1.136.0
	 * @private
	 */
	@property({ type: "boolean", defaultValue: false })
	ignorePersonalizationChanges = false;

	/**
	 * Used internally for Fiori Elements templates of LR and OP
	 * NOTE: Used via LR Template
	 * @private
	 */
	@property({ type: "boolean", defaultValue: false })
	_applyIdToContent = false;

	/**
	 * Specifies the personalization options for the filter bar.
	 * NOTE: Used via LR Template
	 * @private
	 */
	@property({
		type: "string[]",
		defaultValue: [FilterBarP13nMode.Item, FilterBarP13nMode.Value]
	})
	p13nMode!: FilterBarP13nMode;

	/**
	 * Id of control that will allow for switching between normal and visual filter
	 * @private
	 */
	@association({
		type: "sap.m.SegmentedButton",
		multiple: false
	})
	toggleControlId?: string;

	/**
	 * Initial layout of the filter bar, either "compact" or "visual"
	 * @private
	 */
	@property({ type: "string", defaultValue: "compact" })
	initialLayout = "compact";

	/**
	 * Disable draft edit state filter.
	 * @private
	 */
	@property({ type: "boolean" })
	disableDraftEditStateFilter?: boolean;

	/**
	 * Prefix to be used for the ids of the inner content controls.
	 * @private
	 */
	@property({ type: "string", defaultValue: "" })
	idPrefix?: string;

	/**
	 * The identifier of the inner content FilterBar control.
	 * @private
	 */
	@property({ type: "string" })
	_contentId?: string;

	/***********************/
	/* INTERNAL PROPERTIES */
	/***********************/

	/**
	 * Stores the initial control state for the filter bar
	 * @private
	 */
	initialControlState: Record<string, unknown> = {};

	/**
	 * Promise keeper for tracking the initial state loading
	 * @private
	 */
	_initialStatePromise: PromiseKeeper<void> = new PromiseKeeper();

	/**
	 * Indicates whether a search has been triggered
	 * @private
	 */
	_bSearchTriggered = false;

	/**
	 * Indicates whether there are pending filters to be applied
	 * @private
	 */
	_hasPendingFilters = true;

	/**
	 * Indicates whether the draft collaborative scenario is enabled.
	 * @private
	 */
	isDraftCollaborative = false;

	/**
	 * Text for the 'Adapt Filters' button when there are filters applied.
	 * @private
	 */
	adaptFiltersNonZeroText?: string;

	/**
	 * Text for the 'Adapt Filters' button when there are no filters applied.
	 * @private
	 */
	adaptFiltersText?: string;

	/**
	 * ContextPath to be used by child filterfields
	 * @private
	 */
	_internalContextPath!: Context;

	/**
	 * Parameters for parameterized filterbar
	 * @private
	 */
	parameters?: string;

	/**
	 * Annotation path relative to internalContextPath
	 * @private
	 */
	_annotationPath?: string;

	filterBarDelegate?: string;

	propertyInfo?: PropertyInfo[];

	/**
	 * ValueHelps associated with the Filterfields in FilterBar
	 * @private
	 */
	_valueHelps: ValueHelp[] = [];

	/**
	 * FilterFields promises from XML rendering(v2 BB)
	 * @private
	 */
	_filterFieldDisplayPromises: Promise<DisplayMode | undefined>[] = [];

	/**
	 * FilterFields promises from XML rendering(v2 BB)
	 * @private
	 */
	_filterFieldDisplayPropPromises: Promise<void>[] = [];

	/**
	 * FilterFields to be added to the FilterBar
	 * @private
	 */
	_filterFieldControls: MDCFilterField[] = [];

	/**
	 * Show draft edit state in filter bar
	 * @private
	 */
	showDraftEditState = false;

	/**
	 * Design time handler module path
	 * @private
	 */
	designtime?: string;

	/**
	 * Template Component instance to be used as owner for the inner content creation
	 * @private
	 */
	templateComponent?: TemplateComponent;

	/**
	 * Context path relative to the view where the FilterBar is placed
	 * @private
	 */
	contextPathToUse!: string;

	handlerProvider!: FilterBarEventHandlerProvider;

	filterFieldConfigs: Record<string, FilterFieldManifestConfiguration> = {};

	/**
	 * Telemetry instance for tracking filter bar interactions
	 * @private
	 */
	private telemetry?: FilterBarTelemetry;

	@controllerExtensionHandler("viewState", "retrieveAdditionalStates")
	public retrieveAdditionalStates(additionalStates: AdditionalStates): void {
		additionalStates[this.getId()] = { dataLoaded: !this._hasPendingFilters };
	}

	@controllerExtensionHandler("viewState", "applyAdditionalStates")
	public applyAdditionalStates(additionalStates: AdditionalStates): void {
		const instanceState = additionalStates[this.getId()];
		let instanceDataLoaded: boolean | undefined;
		if (typeof instanceState === "object" && instanceState !== null) {
			instanceDataLoaded = instanceState.dataLoaded;
		} else {
			instanceDataLoaded = undefined;
		}

		const parentDataLoaded =
			"dataLoaded" in additionalStates && typeof additionalStates.dataLoaded === "boolean" ? additionalStates.dataLoaded : undefined;

		if (parentDataLoaded === true || instanceDataLoaded === true) {
			this.triggerSearch();
		}
		if (parentDataLoaded === false || instanceDataLoaded === false) {
			(this.content as { _bSearchTriggered?: boolean })._bSearchTriggered = false;
		}
	}

	constructor(props?: $ControlSettings & PropertiesOf<FilterBar> & EventsOf<FilterBar>, others?: $ControlSettings) {
		// Adjust Ids if 'id' is provided.
		if (props && props.id) {
			// Irrespective of the scenario, all inner controls will get provided 'id' as prefix. Exception being the content FilterBar in LR template scenario.
			props.idPrefix = props.id;
			// We set content Id.
			if (props._applyIdToContent) {
				// LR template scenario
				// Provided Id is applied to content, and FilterBar building block gets a 'FilterBar' suffix for id.
				props._contentId = props.id;
				props.id = generate([props.id, "FilterBar"]);
			} else {
				// General scenario
				// Content gets a 'content' suffix for id.
				props._contentId = `${props.id}-content`;
			}
		}

		super(props, others);
		this.telemetry = new FilterBarTelemetry(this);
		this.attachStateChangeHandler();
	}

	/**
	 * Handler for the onMetadataAvailable event.
	 * @returns A promise that resolves to the FEFilterBar content
	 */
	public onMetadataAvailable(): FEFilterBar | undefined {
		const owner = this._getOwner();
		if (!owner) {
			// No owner available yet
			return;
		}

		this.createContent();

		return this.content;
	}

	/**
	 * Returns the full metadata path for the filter bar.
	 * @returns The full metadata path as a string.
	 */
	getFullMetaPath(): string {
		if (this.metaPath.startsWith("/")) {
			return this.metaPath;
		} else if (this.contextPath.endsWith("/")) {
			return `${this.contextPath}${this.metaPath}`;
		} else {
			return `${this.contextPath}/${this.metaPath}`;
		}
	}

	/**
	 * This is to handle scenario where there is no id provided for the FilterBar building block.
	 * In such cases, idPrefix couldn't be set during constructor phase.
	 * This method is to ensure that ids are set up correctly before creating the content.
	 */
	setUpIds(): void {
		if (!this.idPrefix && this.id) {
			this.idPrefix = this.id;
			// We set content Id. Content gets a 'content' suffix for id.
			this._contentId = `${this.idPrefix}-content`;
		}
	}

	/**
	 * Creates the FilterBar content based on the metadata and properties.
	 * @param forceCreation If true, forces the creation of the content even if it already exists.
	 */
	createContent(forceCreation = false): void {
		try {
			if (!this.metaPath) {
				throw new Error("Meta Path not available for FilterBar Macro.");
			}
			this.contextPath ??= this.getOwnerContextPath() as string;
			const fullMetaPath = this.getFullMetaPath();
			if (forceCreation || !this.content) {
				this.content?.destroy();
				this.templateComponent = this._getOwner() as TemplateComponent;
				// Create the FE FilterBar control(MDC)
				this.content = this.templateComponent.runAsOwner(() => {
					this.setUpIds();

					// Initialize all template properties
					if (forceCreation) {
						this.selectionFields = undefined;
					}
					this.setCustomFilterFieldProperties();
					this.handlerProvider = this.handlerProvider ?? new FilterBarEventHandlerProvider(this);
					this._valueHelps = [];
					this._filterFieldDisplayPromises = [];
					this._filterFieldControls = [];
					this.isDraftCollaborative = false;
					this.initialLayout = "compact";
					this.showDraftEditState = false;
					const metaModel =
						this.templateComponent!.getMetaModel() ??
						(this.templateComponent!.preprocessorContext?.models.metaModel as ODataMetaModel);
					const templateProcessorSettings = (this.templateComponent!.preprocessorContext ?? {
						appComponent: this.templateComponent!.getAppComponent(),
						models: {
							metaModel: metaModel
						}
					}) as TemplateProcessorSettings;
					this.contextPathToUse = this.contextPath ?? this.templateComponent!.preprocessorContext?.fullContextPath;
					initializeInternalMetaContext.call(this, fullMetaPath, metaModel);
					const extraParams = getExtraParams.call(this);
					const visualizationObjectPath = MetaModelConverter.getInvolvedDataModelObjects(this._internalContextPath);
					const viewData = templateProcessorSettings.models?.viewData?.getData() ?? {};
					const converterContext = MacroAPI.getConverterContext(
						visualizationObjectPath,
						this.contextPathToUse,
						templateProcessorSettings,
						extraParams
					);

					// Setup filter bar for creating template
					setupFilterBarSettings.call(this, metaModel, converterContext, viewData);
					return getFEFilterBarTemplate.call(this);
				});
			}
		} catch (error: unknown) {
			Log.error("Error creating filter bar content:", error as string);
		}
	}

	/**
	 * Content property setter, used to set properties on the inner content control when they are changed on the building block.
	 * @param propertyKey The property key to set on the content control
	 * @param propertyValue The value to set for the property
	 * @param bSuppressInvalidate Whether to suppress invalidation
	 */
	_setContentProperty(propertyKey: string, propertyValue: unknown, bSuppressInvalidate?: boolean): void {
		if (this.content && ["showMessages", "liveMode", "showClearButton"].includes(propertyKey)) {
			this.content.setProperty(propertyKey, propertyValue, bSuppressInvalidate);
		}
	}

	/**
	 * Overrides the setProperty method to trigger content creation when certain properties are set.
	 * @param propertyKey The property key to set
	 * @param propertyValue The value to set for the property
	 * @param bSuppressInvalidate Whether to suppress invalidation
	 * @returns Reference to this to allow method chaining
	 */
	setProperty(propertyKey: string, propertyValue: unknown, bSuppressInvalidate?: boolean): this {
		if (!this._applyingSettings && propertyValue !== undefined && propertyKey === "metaPath") {
			super.setProperty(propertyKey, propertyValue, true);
			this.createContent(true);
		} else {
			super.setProperty(propertyKey, propertyValue, bSuppressInvalidate);
			this._setContentProperty(propertyKey, propertyValue, bSuppressInvalidate);
		}
		return this;
	}

	/**
	 * Regenerate the content only if it has already been created.
	 */
	protected reCreateContent(): void {
		if (this.content) {
			this.createContent(true);
		}
	}

	/**
	 * Adds a filterField to the FilterBar.
	 *
	 * <b>Note:</b> When adding a custom filter field that uses a custom operator, ensure you use the correct configuration. For more information, see {@link topic:5fb9f57fcf12401bbe39a635e9a32a4e Custom Filters with Custom Operators}.
	 * @param filterField The filterField to add
	 * @returns Reference to this to allow method chaining
	 * @public
	 * @ui5-experimental-since 1.147.0
	 * @since 1.147.0
	 */
	addFilterField(filterField: FilterField): this {
		this.addAggregation("filterFields", filterField);
		this.reCreateContent();
		return this;
	}

	/**
	 * Removes a filterField from the FilterBar.
	 * @param filterField The filterField to remove, or its index or ID
	 * @returns The removed filterField or null
	 * @public
	 * @ui5-experimental-since 1.147.0
	 * @since 1.147.0
	 */
	removeFilterField(filterField: number | string | FilterField): FilterField | null {
		const removedFilterField = this.removeAggregation("filterFields", filterField) as FilterField | null;
		this.reCreateContent();
		return removedFilterField;
	}

	/**
	 * Pass the filter fields aggregations to manifest configurations, so that they can be used in the creation of filter fields in the FilterBar template.
	 */
	setCustomFilterFieldProperties(): void {
		this.filterFieldConfigs = (this.filterFields ?? []).reduce(
			(overallFFConfigs: Record<string, FilterFieldManifestConfiguration>, ff: FilterField | FilterFieldOverride) => {
				const isCompleteFilterField = ff.isA<FilterField>("sap.fe.macros.filterBar.FilterField");

				const ffKey = ff.key ?? ff.getId();
				const ffConfig: FilterFieldManifestConfiguration & { key: string } = {
					key: ffKey,
					type: "Default",
					required: ff.required === true,
					slotName: ffKey,
					position:
						ff.anchor || ff.placement
							? {
									anchor: ff.anchor ?? undefined,
									placement: (ff.placement as Placement) ?? undefined
							  }
							: undefined,
					availability: ff.availability ?? undefined
				};
				if (isCompleteFilterField) {
					ffConfig.label = ff.label ?? null;
					ffConfig.template = ff.template?.getId();
					ffConfig.property = ff.internalProperty ?? null;
					ffConfig.type = "Slot";
				}
				overallFFConfigs[ffKey] = ffConfig;
				return overallFFConfigs;
			},
			{}
		);
	}

	async waitForInitialState(): Promise<void> {
		return this._initialStatePromise.promise;
	}

	getControlState(controlState: ControlState): ControlState {
		const initialControlState: Record<string, unknown> = this.initialControlState;
		if (controlState) {
			return {
				fullState: controlState as object,
				initialState: initialControlState as object
			};
		}
		return controlState;
	}

	/**
	 * Determines whether Search can be triggered at initial load of the application or not.
	 * @param navigationType Navigation Type during the load of the application
	 * @returns A Boolean determining whether Search can be triggered or not
	 */
	isSearchTriggeredByInitialLoad(navigationType: string): boolean {
		const controller = this.getPageController() as ListReportController,
			view = controller.getView(),
			viewData = view.getViewData();
		let isSearchTriggeredByInitialLoad = false,
			variantManagement;
		// Determining whether it's Control variantManagement or Page variantManagement
		if (viewData.variantManagement === VariantManagementType.Control) {
			variantManagement = controller._getFilterBarVariantControl();
		} else {
			variantManagement = view.byId("fe::PageVariantManagement") as VariantManagement;
		}
		const currentVariantKey = variantManagement?.getCurrentVariantKey();
		//The check shall happen for 'intial load' and 'Apply Automatically' for collapsing the header or
		// always be collapsed if navType is xAppState
		// initialLoad Auto or Disabled
		if (navigationType === NavType.xAppState) {
			return true;
		} else if (variantManagement && viewData.initialLoad !== InitialLoadMode.Enabled) {
			// Header is collapsed if preset filters are set for initial load Auto, Header shall remain expanded if initial load is Auto without preset filters or intial load is disabled
			if (controller._shouldAutoTriggerSearch(this._getFilterBarVM(view))) {
				isSearchTriggeredByInitialLoad = true;
			}
		}
		// initialLoad Enabled
		else if (
			variantManagement &&
			viewData.initialLoad === InitialLoadMode.Enabled &&
			controller._getApplyAutomaticallyOnVariant(variantManagement, currentVariantKey)
		) {
			isSearchTriggeredByInitialLoad = true;
		}
		return isSearchTriggeredByInitialLoad;
	}

	/**
	 * Apply Selection Variant from Navigation Parameter.
	 * @param view View of the LR filter bar
	 * @param navigationParameter Selection Variant to apply from appState
	 * @param filterVariantApplied Is a filter variant alaready applied
	 * @returns Promise for asynchronous handling
	 */
	async _applySelectionVariant(view: View, navigationParameter: NavigationParameter, filterVariantApplied: boolean): Promise<unknown> {
		const filterBar = this.getContent() as FEFilterBar;
		const { selectionVariant: sv, selectionVariantDefaults: svDefaults, requiresStandardVariant = false } = navigationParameter;

		if (!filterBar || !sv) {
			return Promise.resolve();
		}
		const variantManagement = this._getFilterBarVM(view) as VariantManagement;
		const shouldApplyAppState = await this._activateVariantAndDetermineApplyAppState(
			variantManagement,
			requiresStandardVariant,
			filterVariantApplied
		);
		if (shouldApplyAppState) {
			this._addDefaultDisplayCurrencyToSV(view, sv, svDefaults);

			// check if FLP default values are there and is it standard variant
			const svDefaultsArePresent = svDefaults ? svDefaults.getSelectOptionsPropertyNames().length > 0 : false;
			const stdVariantIsDefaultVariant =
				variantManagement && variantManagement.getDefaultVariantKey() === variantManagement.getStandardVariantKey();
			const useFLPDefaultValues: boolean =
				svDefaultsArePresent &&
				(stdVariantIsDefaultVariant || !variantManagement) &&
				Boolean(navigationParameter.navSelVarHasDefaultsOnly);

			const filterBarAPI = filterBar.getParent() as FilterBar;
			let svToSet: SelectionVariant = sv;
			if (filterVariantApplied || useFLPDefaultValues) {
				svToSet = await this._getAdjustedSV(sv, useFLPDefaultValues);
			}
			return filterBarAPI.setSelectionVariant(svToSet, true, true);
		}
	}

	_enableFilterBar(filterBarControl: FEFilterBar, preventInitialSearch: boolean): void {
		const filterBarAPI = filterBarControl.getParent() as FilterBar;
		const fnOnSearch = (): void => {
			this._bSearchTriggered = !preventInitialSearch;
		};

		// reset the suspend selection on filter bar to allow loading of data when needed (was set on LR Init)
		if (filterBarControl.getSuspendSelection()) {
			// Only if search is fired we set _bSearchTriggered.
			// If there was an error due to required filterfields empty or other issues we skip setting _bSearchTriggered.
			filterBarAPI.attachEventOnce("search", fnOnSearch);
			filterBarControl.enableRequests(true);
		} else {
			// search might already be triggered.
			fnOnSearch();
		}
	}

	async _getAdjustedSV(appStateSV: SelectionVariant, useFLPDefaultValues: boolean): Promise<SelectionVariant> {
		let adjustedSV = new SelectionVariant(appStateSV.toJSONObject());
		const alreadyAppliedSV = await this.getSelectionVariant();
		const appliedSelOptNames = alreadyAppliedSV?.getSelectOptionsPropertyNames() || [];
		if (appliedSelOptNames.length > 0) {
			// We merge 'applied SV' and 'appState SV' based on 'useFLPDefaultValues'.
			adjustedSV = appliedSelOptNames.reduce((svCopy: SelectionVariant, selOptionName) => {
				// (appStateSV = adjustedSV = svCopy)
				const svSelOpts = svCopy.getSelectOption(selOptionName);
				// If useFLPDefaultValues = true, means (appStateSV = svDefaults)
				if ((useFLPDefaultValues && !svSelOpts?.length) || !useFLPDefaultValues) {
					// if default SV needs to be used, then select options from default select options take priority.
					// else we merge both: already applied SV and SV from navParams.
					const selectOptions = alreadyAppliedSV.getSelectOption(selOptionName);
					svCopy.massAddSelectOption(selOptionName, selectOptions || []);
				}
				return svCopy;
			}, adjustedSV);
		}

		return adjustedSV;
	}

	_preventInitialSearch(variantManagement: VariantManagement): boolean {
		if (!variantManagement) {
			return true;
		}
		const aVariants = variantManagement.getVariants();
		const oCurrentVariant = aVariants.find(function (item): boolean {
			return item.getKey() === variantManagement.getCurrentVariantKey();
		});
		return !oCurrentVariant?.getExecuteOnSelect();
	}

	/**
	 * Add DisplayCurrency to SV if it is mandatory and exists in SV defaults.
	 * @param view View of the LR filter bar
	 * @param sv Selection Variant to apply
	 * @param svDefaults Selection Variant defaults
	 */
	_addDefaultDisplayCurrencyToSV(view: View, sv: SelectionVariant, svDefaults?: SelectionVariant): void {
		if (!svDefaults || svDefaults?.isEmpty()) {
			return;
		}

		const viewData = view.getViewData() as LRViewData,
			metaModel = view.getModel()?.getMetaModel() as ODataMetaModel,
			contextPath = viewData.contextPath || `/${viewData.entitySet}`,
			metaContext = metaModel.getMetaContext(contextPath),
			dataModelObjectPath: DataModelObjectPath<ODataMetaModel> = getInvolvedDataModelObjects(metaContext);

		// getDisplayCurrencyPropertyName already applies the isParameterized logic
		const displayCurrencyPropertyName = this.getDisplayCurrencyPropertyName(dataModelObjectPath);
		const displayCurrencyIsMandatory = this._checkIfDisplayCurrencyIsRequired(dataModelObjectPath);
		if (!displayCurrencyIsMandatory) {
			return;
		}

		const svOptions = sv.getSelectOption(displayCurrencyPropertyName) || [],
			defaultSVOptions = svDefaults.getSelectOption(displayCurrencyPropertyName) || [],
			displayCurrencyDefaultExists = defaultSVOptions.length > 0,
			noSVDisplayCurrencyExists = svOptions.length === 0;

		if (noSVDisplayCurrencyExists && displayCurrencyDefaultExists) {
			const displayCurrencySelectOption = defaultSVOptions[0],
				sign = displayCurrencySelectOption["Sign"],
				option = displayCurrencySelectOption["Option"],
				low = displayCurrencySelectOption["Low"],
				high = displayCurrencySelectOption["High"];

			sv.addSelectOption(displayCurrencyPropertyName, sign, option, low, high);
		}
	}

	/**
	 * Checks if the data model object path is parameterized.
	 * Looks for a ResultContext annotation in the starting entity's type
	 * and ensures there's no target entity set.
	 * @param dataModelObjectPath The path to check.
	 * @returns True if it's parameterized, false otherwise.
	 */
	private isParameterized(dataModelObjectPath: DataModelObjectPath<ODataMetaModel>): boolean {
		return !!dataModelObjectPath.startingEntitySet.entityType?.annotations?.Common?.ResultContext;
	}

	/**
	 * Gets the display currency property name based on the entity type's parameterization.
	 * Uses the isParameterized method to decide which property name to return.
	 * @param dataModelObjectPath The path to check.
	 * @returns The appropriate display currency property name.
	 */
	getDisplayCurrencyPropertyName(dataModelObjectPath: DataModelObjectPath<ODataMetaModel>): string {
		return this.isParameterized(dataModelObjectPath) ? P_DISPLAY_CURRENCY_PROPERTY_NAME : DISPLAY_CURRENCY_PROPERTY_NAME;
	}

	/**
	 * Checks if DisplayCurrency is mandatory for filtering.
	 * @param dataModelObjectPath
	 * @returns Boolean
	 */
	_checkIfDisplayCurrencyIsRequired(dataModelObjectPath: DataModelObjectPath<ODataMetaModel>): boolean {
		let displayCurrencyIsMandatory = false;

		if (this.isParameterized(dataModelObjectPath)) {
			displayCurrencyIsMandatory = dataModelObjectPath.startingEntitySet.entityType.entityProperties.some(
				(parameter: Property): boolean => parameter.name === P_DISPLAY_CURRENCY_PROPERTY_NAME
			);
		} else {
			const entitySet: EntitySet | undefined =
					dataModelObjectPath.startingEntitySet._type === "EntitySet" ? dataModelObjectPath.startingEntitySet : undefined,
				requiredProperties = entitySet?.annotations.Capabilities?.FilterRestrictions?.RequiredProperties ?? [];
			displayCurrencyIsMandatory = requiredProperties.some(
				(requiredProperty: PropertyPath) => requiredProperty.value === DISPLAY_CURRENCY_PROPERTY_NAME
			);
		}
		return displayCurrencyIsMandatory;
	}

	/**
	 * Activate variant from variant management and return if appState needs to be applied.
	 * @param variantManagement VariantManagement used by filter bar
	 * @param reqStdVariant If standard variant is required to be used
	 * @param filterVariantApplied Is a filter variant already applied
	 * @returns Promise for asynchronous handling
	 */
	async _activateVariantAndDetermineApplyAppState(
		variantManagement: VariantManagement | undefined,
		reqStdVariant: boolean,
		filterVariantApplied: boolean
	): Promise<boolean> {
		if (variantManagement && !filterVariantApplied) {
			let variantKey = reqStdVariant ? variantManagement.getStandardVariantKey() : variantManagement.getDefaultVariantKey();
			if (variantKey === null) {
				variantKey = variantManagement.getId();
			}
			await ControlVariantApplyAPI.activateVariant({
				element: variantManagement,
				variantReference: variantKey
			});
			return reqStdVariant || variantManagement.getDefaultVariantKey() === variantManagement.getStandardVariantKey();
		}

		return true;
	}

	/**
	 * Variant management used by filter bar.
	 * @param view View of the LR filter bar
	 * @returns VariantManagement if used
	 */
	_getFilterBarVM(view: View): VariantManagement | undefined {
		let variantManagement;
		const viewData = view.getViewData() as LRViewData;
		switch (viewData.variantManagement) {
			case VariantManagementType.Page:
				variantManagement = view.byId("fe::PageVariantManagement");
				break;
			case VariantManagementType.Control:
				variantManagement = (view.getController() as ListReportController)._getFilterBarVariantControl();
				break;
			case VariantManagementType.None:
			default:
				break;
		}
		return variantManagement as VariantManagement | undefined;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async handleVariantIdPassedViaURLParams(oUrlParams: Record<string, string>): Promise<unknown> {
		const aPageVariantId = oUrlParams["sap-ui-fe-variant-id"],
			aFilterBarVariantId = oUrlParams["sap-ui-fe-filterbar-variant-id"],
			aTableVariantId = oUrlParams["sap-ui-fe-table-variant-id"],
			aChartVariantId = oUrlParams["sap-ui-fe-chart-variant-id"];
		let oVariantIDs: VariantIDs | undefined;
		if (aPageVariantId || aFilterBarVariantId || aTableVariantId || aChartVariantId) {
			oVariantIDs = {
				sPageVariantId: aPageVariantId && aPageVariantId[0],
				sFilterBarVariantId: aFilterBarVariantId && aFilterBarVariantId[0],
				sTableVariantId: aTableVariantId && aTableVariantId[0],
				sChartVariantId: aChartVariantId && aChartVariantId[0]
			};
		}
		return this._handleControlVariantId(oVariantIDs);
	}

	async _handleControlVariantId(oVariantIDs: VariantIDs | undefined): Promise<unknown> {
		let oVM: VariantManagement;
		const oView = this.getPageController()?.getView(),
			aPromises: Promise<boolean>[] = [];
		const sVariantManagement = oView.getViewData().variantManagement;
		if (oVariantIDs && oVariantIDs.sPageVariantId && sVariantManagement === "Page") {
			oVM = oView.byId("fe::PageVariantManagement") as VariantManagement;
			this._handlePageVariantId(oVariantIDs, oVM, aPromises);
		} else if (oVariantIDs && sVariantManagement === "Control") {
			if (oVariantIDs.sFilterBarVariantId) {
				oVM = (oView.getController() as ListReportController)._getFilterBarVariantControl()!;
				this._handleFilterBarVariantControlId(oVariantIDs, oVM, aPromises);
			}
		}
		return Promise.all(aPromises);
	}

	/*
	 * Handles page level variant and passes the variant to the function that pushes the promise to the promise array
	 *
	 * @param oVarinatIDs contains an object of all variant IDs
	 * @param oVM contains the vairant management object for the page variant
	 * @param aPromises is an array of all promises
	 * @private
	 */
	_handlePageVariantId(oVariantIDs: VariantIDs, oVM: VariantManagement, aPromises: Promise<boolean>[]): void {
		oVM.getVariants()?.forEach((oVariant: VariantObject) => {
			this._findAndPushVariantToPromise(oVariant, oVariantIDs.sPageVariantId, oVM, aPromises, true);
		});
	}

	/*
	 * Handles control level variant for filter bar and passes the variant to the function that pushes the promise to the promise array
	 *
	 * @param oVarinatIDs contains an object of all variant IDs
	 * @param oVM contains the vairant management object for the filter bar
	 * @param aPromises is an array of all promises
	 * @private
	 */

	_handleFilterBarVariantControlId(oVariantIDs: VariantIDs, oVM: VariantManagement, aPromises: Promise<boolean>[]): void {
		if (oVM) {
			oVM.getVariants().forEach((oVariant: VariantObject) => {
				this._findAndPushVariantToPromise(oVariant, oVariantIDs.sFilterBarVariantId, oVM, aPromises, true);
			});
		}
	}

	/*
	 * Matches the variant ID provided in the url to the available vairant IDs and pushes the appropriate promise to the promise array
	 *
	 * @param oVariant is an object for a specific variant
	 * @param sVariantId is the variant ID provided in the url
	 * @param oVM is the variant management object for the specfic variant
	 * @param aPromises is an array of promises
	 * @param bFilterVariantApplied is an optional parameter which is set to ture in case the filter variant is applied
	 * @private
	 */
	_findAndPushVariantToPromise(
		//This function finds the suitable variant for the variantID provided in the url and pushes them to the promise array
		oVariant: VariantObject,
		sVariantId: string,
		oVM: VariantManagement,
		aPromises: Promise<boolean>[],
		bFilterVariantApplied?: boolean
	): void {
		if (oVariant.getKey() === sVariantId) {
			aPromises.push(this._applyControlVariant(oVM, sVariantId, bFilterVariantApplied));
		}
	}

	async _applyControlVariant(oVariant: VariantManagement, sVariantID: string, bFilterVariantApplied = false): Promise<boolean> {
		const sVariantReference = this._checkIfVariantIdIsAvailable(oVariant, sVariantID) ? sVariantID : oVariant.getStandardVariantKey();
		const oVM = ControlVariantApplyAPI.activateVariant({
			element: oVariant,
			variantReference: sVariantReference
		});
		return oVM.then(function () {
			return bFilterVariantApplied;
		});
	}

	_checkIfVariantIdIsAvailable(oVM: VariantManagement, sVariantId: string | null): boolean {
		const aVariants = oVM.getVariants();
		let bIsControlStateVariantAvailable = false;
		aVariants.forEach(function (oVariant) {
			if (oVariant.getKey() === sVariantId) {
				bIsControlStateVariantAvailable = true;
			}
		});
		return bIsControlStateVariantAvailable;
	}

	private attachStateChangeHandler(): void {
		StateUtil.detachStateChange(this.stateChangeHandler);
		StateUtil.attachStateChange(this.stateChangeHandler);
	}

	stateChangeHandler(oEvent: UI5Event<{ control: Control }>): void {
		const control = oEvent.getParameter("control");
		if (control.isA<FEFilterBar>("sap.ui.mdc.FilterBar")) {
			const filterBarAPI = control.getParent() as unknown as { handleStateChange?: Function };
			if (filterBarAPI?.handleStateChange) {
				filterBarAPI.handleStateChange();
			}
		}
	}

	@xmlEventHandler()
	handleSearch(oEvent: FilterBarBase$SearchEvent): void {
		this.getPageController()?.inlineEditFlow?.inlineEditDiscard();
		const oFilterBar = oEvent.getSource() as FEFilterBar | undefined;
		const eventParameters = oEvent.getParameters();
		if (oFilterBar) {
			const conditions = (oFilterBar.getFilterConditions() ?? {}) as Record<string, ConditionObject[]>;
			const preparedEventParameters = this._prepareEventParameters(oFilterBar);
			this.fireEvent("internalSearch", merge({ conditions: conditions }, eventParameters));
			this.fireEvent("search", merge({ reason: eventParameters.reason }, preparedEventParameters));
			this._hasPendingFilters = false;
			if (!this.liveMode) {
				this.getPageController()?.getExtensionAPI().updateAppState();
			}
		}
	}

	@xmlEventHandler()
	async handleFilterChanged(oEvent: FilterBarBase$FiltersChangedEvent): Promise<void> {
		const filterBar = oEvent.getSource() as FEFilterBar | undefined;
		const oEventParameters = oEvent.getParameters();
		if (filterBar) {
			if (!filterBar.getLiveMode()) {
				await UOMValidationDelegate.validateAllUOMFields(filterBar, "filterChange");
			}
			const oConditions = filterBar.getFilterConditions();
			const eventParameters: object = this._prepareEventParameters(filterBar);
			this.telemetry?.onFiltersChanged(this._getFilterBarReason(filterBar));
			this.fireEvent("internalFilterChanged", merge({ conditions: oConditions }, oEventParameters));
			this.fireEvent("filterChanged", eventParameters);
			// Set hasPendingFilters to true only if conditionsBased is true
			if (oEventParameters?.conditionsBased) {
				this._hasPendingFilters = true;
			}
		}
	}

	_getFilterBarReason(filterBar: FEFilterBar & { _sReason?: string }): string {
		return filterBar?._sReason ?? "";
	}

	_prepareEventParameters(oFilterBar: FEFilterBar): Partial<InternalBindingInfo> {
		const { parameters, filters, search } = FilterUtils.getFilters(oFilterBar as unknown as IFilterControl) || {};

		return { parameters, filters, search };
	}

	/**
	 * Set the filter values for the given property in the filter bar.
	 * The filter values can be either a single value or an array of values.
	 * Each filter value must be represented as a primitive value.
	 * @param sConditionPath The path to the property as a condition path
	 * @param [sOperator] The operator to be used (optional) - if not set, the default operator (EQ) will be used
	 * @param vValues The values to be applied
	 * @returns A promise for asynchronous handling
	 * @public
	 */
	async setFilterValues(
		sConditionPath: string,
		sOperator: string | undefined,
		vValues?: undefined | string | number | boolean | string[] | number[] | boolean[]
	): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		if (arguments.length === 2) {
			vValues = sOperator;
			return FilterUtils.setFilterValues(this.content, sConditionPath, vValues);
		}
		return FilterUtils.setFilterValues(this.content, sConditionPath, sOperator, vValues);
	}

	/**
	 * Get the Active Filters Text Summary for the filter bar.
	 * @returns Active filters summary as text
	 * @public
	 */
	getActiveFiltersText(): string {
		return this.content?.getAssignedFiltersText()?.filtersText || "";
	}

	/**
	 * Provides all the filters that are currently active
	 * along with the search expression.
	 * @returns An array of active filters and the search expression.
	 * @public
	 */
	getFilters(): object {
		return FilterUtils.getFilters(this.content as IFilterControl) || {};
	}

	/**
	 * Triggers the API search on the filter bar.
	 * @returns Returns a promise which resolves if the filter is triggered; otherwise it is rejected.
	 * @public
	 */
	async triggerSearch(): Promise<object | undefined> {
		const filterBar = this.content;
		try {
			if (filterBar) {
				await filterBar.whenInitialized();
				return await filterBar.triggerSearch();
			}
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			throw Error(message);
		}
	}

	isSemanticDateFilterApplied(): boolean {
		return SemanticDateOperators.hasSemanticDateOperations(this.content.getConditions(), false);
	}

	/**
	 * Get the selection variant from the filter bar.
	 * Note: This method returns all the filter values that are set in the filter bar, including the text from the search field (with $search as the property name). However, it doesn't return any filter field condition that uses a custom operator.
	 * @returns A promise which resolves with a {@link sap.fe.navigation.SelectionVariant}
	 * @public
	 */
	async getSelectionVariant(): Promise<SelectionVariant> {
		const selectionVariant = await stateHelper.getSelectionVariant(this.getContent());
		const controller = this.getPageController() as ListReportController;
		if (controller !== undefined) {
			const view = controller?.getView(),
				appComponent = CommonUtils.getAppComponent(view),
				navigationService = appComponent?.getNavigationService(),
				dataModelObject = this.getDataModelObjectForMetaPath(this.metaPath);
			if (dataModelObject?.targetEntitySet?.name) {
				const sContextUrl =
					dataModelObject?.targetEntitySet?.name &&
					navigationService?.constructContextUrl(dataModelObject?.targetEntitySet?.name, view.getModel());
				selectionVariant.setFilterContextUrl(sContextUrl);
			}
		}
		return selectionVariant;
	}

	/**
	 * Get the list of mandatory filter property names.
	 * @returns The list of mandatory filter property names
	 */
	getMandatoryFilterPropertyNames(): string[] {
		return (this.content.getPropertyInfoSet() as ControlPropertyInfo[])
			.filter(function (filterProp) {
				return filterProp.required;
			})
			.map(function (requiredProp) {
				return requiredProp.conditionPath;
			});
	}

	/**
	 * Get the filter bar parameters for a parameterized service.
	 * @returns Array of parameters configured in a parameterized service
	 */

	getParameters(): string[] {
		const filterBar = this.content;
		const parameters = filterBar.data("parameters");
		if (parameters) {
			return Array.isArray(parameters) ? parameters : JSON.parse(parameters);
		}
		return [];
	}

	getVariant(): VariantData | undefined {
		let currentVariant;
		try {
			const variantModel = this.getModel("$FlexVariants") as VariantModel | undefined;
			const variantBackReference = this.content.getVariantBackreference();

			if (variantModel && variantBackReference) {
				currentVariant = variantModel.getVariant(variantModel.getCurrentVariantReference(variantBackReference));
			}
		} catch (e) {
			Log.debug("Couldn't fetch variant ", e as string);
		}
		return currentVariant;
	}

	/**
	 * Shows or hides any filter field from the filter bar.
	 * The property will not be hidden inside the adaptation dialog and may be re-added.
	 * @param conditionPath The path to the property as a condition path
	 * @param visible Whether it should be shown or hidden
	 * @returns A {@link Promise} resolving once the change in visibility was applied
	 * @public
	 */
	async setFilterFieldVisible(conditionPath: string, visible: boolean): Promise<void> {
		await StateUtil.applyExternalState(this.content, { items: [{ name: conditionPath, visible }] });
	}

	/**
	 * Gets the visibility of a filter field.
	 * @param conditionPath The path to the property as a condition path
	 * @returns A {@link Promise} that resolves to check whether the filter field is visible or not.
	 * @public
	 */
	async getFilterFieldVisible(conditionPath: string): Promise<boolean> {
		const state: ExternalStateType = await StateUtil.retrieveExternalState(this.content);
		return !!state.items.find((item) => item.name === conditionPath);
	}

	/**
	 * Gets the associated variant management.
	 * @returns The {@link sap.ui.fl.variants.VariantManagement} control associated with the filter bar.
	 */
	getVariantManagement(): VariantManagement | undefined {
		const variantBackreference = this.content.getVariantBackreference();
		if (variantBackreference) {
			return UI5Element.getElementById(variantBackreference) as VariantManagement;
		} else {
			Log.warning(`Variant back reference not defined on the filter bar ${this.id}`);
		}
	}

	/**
	 * Sets the variant back reference association for this instance.
	 * @param variant The `VariantManagement` instance to set as the back reference.
	 */
	setVariantBackReference(variant: VariantManagement): void {
		const content = this.getContent() as FEFilterBar;
		const isLiveMode = content?.getLiveMode?.();
		if (!isLiveMode) {
			this.content.setVariantBackreference(variant);
		}
	}

	/**
	 * Gets the key of the current variant in the associated variant management.
	 * @returns Key of the currently selected variant. In case the model is not yet set, `null` will be returned.
	 * @public
	 */
	getCurrentVariantKey(): string | null {
		const vm = this.getVariantManagement();
		return vm !== undefined ? vm.getCurrentVariantKey() : null;
	}

	/**
	 * Sets the new selected variant in the associated variant management.
	 * @param key Key of the variant that should be selected. If the passed key doesn't identify a variant, it will be ignored.
	 * @public
	 */
	setCurrentVariantKey(key: string): void {
		const vm = this.getVariantManagement();
		if (vm) {
			vm.setCurrentVariantKey(key);
		}
	}

	/**
	 * Sets the enablement of the field.
	 * @param name Name of the field that should be enabled or disabled.
	 * @param enabled Whether the field should be enabled or disabled.
	 * @public
	 */
	setFilterFieldEnabled(name: string, enabled: boolean): void {
		this.getInternalModel()?.setData(
			{
				[this.content.data("localId")]: {
					filterFields: { [name]: { editMode: enabled ? FieldEditMode.Editable : FieldEditMode.Disabled } }
				}
			},
			true
		);
	}

	/**
	 * Determines whether the field is enabled or disabled.
	 * @param name Name of the field.
	 * @returns Whether the filterField is enabled or disabled.
	 * @public
	 */
	getFilterFieldEnabled(name: string): boolean {
		return this.getInternalModel()?.getProperty(`/${this.content.data("localId")}/filterFields/${name}/editMode`) ===
			FieldEditMode.Disabled
			? false
			: true;
	}

	/**
	 * Convert {@link sap.fe.navigation.SelectionVariant} to conditions.
	 * @param selectionVariant The selection variant to apply to the filter bar.
	 * @param prefillDescriptions If true, we try to find the associated Text value for each property in the selectionVariant (to avoid fetching it from the server)
	 * @returns A promise resolving to conditions
	 */
	async convertSelectionVariantToStateFilters(
		selectionVariant: SelectionVariant,
		prefillDescriptions: boolean
	): Promise<StateUtilFilter> {
		return stateHelper.convertSelectionVariantToStateFilters(
			this.content,
			selectionVariant,
			prefillDescriptions,
			this.content?.getModel()
		);
	}

	/**
	 * Clears all input values of visible filter fields in the filter bar with flag to indicate whether to clear Edit Filter or not.
	 * @param filterBar The filter bar that contains the filter field
	 * @param options Options for filtering on the filter bar
	 * @param options.clearEditFilter Whether to clear the edit filter or let it be default value 'All' instead
	 */
	async _clearFilterValuesWithOptions(filterBar: FEFilterBar, options?: { clearEditFilter: boolean }): Promise<void> {
		await stateHelper._clearFilterValuesWithOptions(filterBar, options);
	}

	/**
	 * Sets {@link sap.fe.navigation.SelectionVariant} to the filter bar. Note: setSelectionVariant will clear existing filters and then apply the SelectionVariant values.
	 * Note: This method cannot set the search field text or any filter field condition that relies on a custom operator.
	 * @param selectionVariant The {@link sap.fe.navigation.SelectionVariant} to apply to the filter bar
	 * @param prefillDescriptions Optional. If true, we will use the associated text property values (if they're available in the selectionVariant) to display the filter value descriptions, instead of loading them from the backend
	 * @param fromNavigationParameters PRIVATE
	 * @returns A promise for asynchronous handling
	 * @public
	 */
	async setSelectionVariant(
		selectionVariant: SelectionVariant,
		prefillDescriptions = false,
		fromNavigationParameters = false
	): Promise<unknown> {
		const content = this.getContent() as FEFilterBar | undefined;
		const isLiveMode = content && content?.getLiveMode?.();
		let result: { diffState: ExternalStateType; applyStateResult: unknown } | undefined;
		if (isLiveMode) {
			content.enableRequests(false);
		}
		try {
			result = await stateHelper.setSelectionVariantToMdcControl(
				this.getContent(),
				selectionVariant,
				prefillDescriptions,
				fromNavigationParameters
			);
			return result?.applyStateResult;
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			Log.error(`FE : Buildingblock : FilterBar : ${message}`);
			throw Error(message);
		} finally {
			if (isLiveMode) {
				content.enableRequests(true, result?.diffState);
			}
		}
	}

	/**
	 * Called by the MDC state util when the state for this control's child has changed.
	 */
	handleStateChange(): void {
		this.getPageController()?.getExtensionAPI().updateAppState();
	}

	private getConditionPath(propertyPath: string): string {
		const propertyTargetObjectPath = FilterUtils.getDataModelObjectPathForProperty(this.content, propertyPath);
		return (
			(propertyTargetObjectPath ? getContextRelativeTargetObjectPath(propertyTargetObjectPath, false, true) : undefined) ??
			propertyPath
		);
	}

	async showFilterField(name: string): Promise<void> {
		const state: ExternalStateType = await StateUtil.retrieveExternalState(this.content);
		const conditionPath = this.getConditionPath(name);
		const targetFilterField = !!state.items.find((item) => item.name === conditionPath);
		if (!targetFilterField) {
			state.items.push({ name: conditionPath });
		}
		await StateUtil.applyExternalState(this.content, state);
	}

	async openValueHelpForFilterField(name: string, inputValue?: string): Promise<ConditionObject[]> {
		const conditionPath = this.getConditionPath(name);

		return new Promise((resolve, reject) => {
			const filterField = this.content.getFilterItems().find((item) => item.getPropertyKey() === conditionPath);
			const valueHelp = UI5Element.getElementById(filterField?.getValueHelp()) as ValueHelp | undefined;
			if (!valueHelp || !filterField) {
				reject(new Error(`ValueHelp for filter field ${name} not found`));
				return;
			}

			valueHelp.attachEventOnce("closed", () => {
				resolve(valueHelp.getConditions() as ConditionObject[]);
			});

			(filterField as unknown as { _oFocusInfo: object })._oFocusInfo = { targetInfo: { silent: true } };
			(filterField as unknown as { onfocusin?: Function }).onfocusin?.(new jQuery.Event("focusin"));
			setTimeout(() => {
				(filterField.getAggregation("_content") as Input[])[0].fireValueHelpRequest({
					fromKeyboard: true,
					_userInputValue: inputValue
				} as unknown as Input$ValueHelpRequestEventParameters);
			}, 200);
		});
	}

	getCollapsedFiltersText(): string {
		return this.content?.getAssignedFiltersText()?.filtersText;
	}
}
export default FilterBar;
