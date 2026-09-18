import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import type { ShareOptions } from "sap/fe/core/controllerextensions/Share";
import type { FormElementType } from "sap/fe/core/converters/controls/Common/Form";
import type { AnalyticalConfiguration } from "sap/fe/core/converters/controls/Common/Table";
import type { HeaderFacetType } from "sap/fe/core/converters/controls/ObjectPage/HeaderFacet";
import type { FieldEditStyle } from "sap/fe/macros/field/FieldFormatOptions";
import type AvatarImageFitType from "sap/m/AvatarImageFitType";
import type { OverflowToolbarPriority } from "sap/m/library";
import { type PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import type { $ColumnLayoutSettings } from "sap/ui/layout/form/ColumnLayout";
import type FormContainer from "sap/ui/layout/form/FormContainer";
import type { $ResponsiveGridLayoutSettings } from "sap/ui/layout/form/ResponsiveGridLayout";
import type { PopinLayoutMode, TableRowCountMode, TableType } from "./controls/Common/Table";
import type { ColumnExportSettings } from "./controls/Common/table/Columns";
import type { ConfigurableRecord, Position, Positionable } from "./helpers/ConfigurableObject";

export type CustomFilterOperatorInfo = {
	name: string;
	multiValue?: boolean;
};

/**
 * Definition of settings in the "sap.fe" section of the manifest
 * @public
 */
export type ManifestSettingsSapFE = {
	macros?: {
		table?: {
			defaultCreationMode?: CreationMode;
			currency?: {
				decimalPadding?: number;
			};
			unitOfMeasure?: {
				decimalPadding?: number;
			};
			defaultPopinLayout?: PopinLayoutMode;
		};
		multiValueField?: {
			itemsSizeLimit?: number;
		};
		filter?: {
			customFilterOperators?: CustomFilterOperatorInfo[];
		};
		easyFilter?: {
			recommendedQueries?: string[];
		};
		valueHelp?: {
			/**
			 * Enables navigation links in value help dialog tables.
			 *
			 * **Important:** Links in value help dialog tables are disabled by default.
			 * Please refer to JIRA ticket FIORITECHP1-32051 for full context before enabling this setting.
			 *
			 * **Reasons for default behavior:**
			 * - Ensures feature parity with SAP Fiori elements for OData V2
			 * - Navigation inside dialogs can be misleading for users
			 * - Opening additional popups from within a dialog creates a poor user experience
			 * - Navigating back from linked pages is not easily accessible from the dialog context
			 *
			 * **Usage:** This setting should only be used as a fallback option for customers who urgently
			 * require navigation links in value help dialogs and understand the UX implications.
			 * @fe-default-value false
			 */
			enableLinksInDialogTable?: boolean;
		};
	};
	form?: {
		retrieveTextFromValueList?: boolean;
	};
	/**
	 * Application-specific settings
	 * @public
	 */
	app?: {
		/**
		 * Enable lazy loading and lazy rendering for sections on the object page.
		 * @fe-default-value false
		 * @public
		 */
		enableLazyLoading?: boolean;
		disableObjectPageRequestOptimization?: boolean; // When set, the Object Page will disable optimized requesting for sections
		preserveDecimalsForCurrency?: boolean; // When set, the scale defined in the metadata for currency fields is used to display the number of decimals
		considerNavigationPropertiesForExternalNavigation?: boolean;
		disableStrictHandling?: boolean; // switch to turn of strict handling, default is true
		disableCollaborationDraft?: boolean; // temporary switch to turn of collaboration draft, will be deleted again
		enableTelemetry?: boolean;
		singleDraftForCreate?: boolean;
		silentlyKeepDraftOnForwardNavigation?: boolean;
		sideEffectsEventsInteractionType?: SideEffectsEventsInteractionManifestSetting;
		share?: ShareOptions;
		_checkExistenceOnDeepLink?: boolean;
		disableInputAssistance?: boolean;
		/**
		 * Enable Save and Leave functionality for draft-enabled object pages
		 * @fe-default-value false
		 * @public
		 */
		enableSaveAndLeave?: boolean;
		hideDraft?: HiddenDraft;
		showOnlyUnitDecimals?: boolean; // Will limit the display of decimals to the number of decimals of the unit
		disableManifestChanges?: boolean; // disable the "Configuration" option in change handlers that result in manifest changes
		breadcrumbs?: {
			home?: string;
			space?: string;
		};
		inboundParameterForTargetResolution?: string;
		disableStrictUomFiltering?: boolean; // When set, no strict filtering is applied for UoM fields,
		isBuildingBlockContext?: boolean; //set to true when app component is used for a sap.fe.core.BuildingBlockContext
	};
	historySettings?: {
		fields?: Record<
			string,
			{
				historyEnabled: boolean;
			}
		>;
	};
};

// ENUMS

export enum TemplateType {
	ListReport = "ListReport",
	ObjectPage = "ObjectPage",
	AnalyticalListPage = "AnalyticalListPage",
	FreeStylePage = "None"
}

export enum ActionType {
	DataFieldForAction = "ForAction",
	DataFieldForIntentBasedNavigation = "ForNavigation",
	Default = "Default",
	Primary = "Primary",
	Secondary = "Secondary",
	SwitchToActiveObject = "SwitchToActiveObject",
	SwitchToDraftObject = "SwitchToDraftObject",
	DraftActions = "DraftActions",
	CollaborationAvatars = "CollaborationAvatars",
	DefaultApply = "DefaultApply",
	Menu = "Menu",
	ShowFormDetails = "ShowFormDetails",
	Copy = "Copy",
	Cut = "Cut",
	/** This type denotes standard actions like "Create" and "Delete" */
	Standard = "Standard",
	CreateNext = "CreateNext",
	/** This type is a toolbar separator, not an action */
	Separator = "Separator"
}

export enum SelectionMode {
	Auto = "Auto",
	None = "None",
	Multi = "Multi",
	Single = "Single",
	ForceMulti = "ForceMulti",
	ForceSingle = "ForceSingle"
}

export enum VariantManagementType {
	Page = "Page",
	Control = "Control",
	None = "None"
}

export enum CreationMode {
	NewPage = "NewPage",
	Sync = "Sync",
	Async = "Async",
	Deferred = "Deferred",
	Inline = "Inline",
	CreationRow = "CreationRow",
	InlineCreationRows = "InlineCreationRows",
	External = "External",
	CreationDialog = "CreationDialog"
}

export enum VisualizationType {
	Table = "Table",
	Chart = "Chart"
}

export enum OperationGroupingMode {
	ChangeSet = "ChangeSet",
	Isolated = "Isolated"
}

// Table
export type AvailabilityType = "Default" | "Adaptation" | "Hidden";
export enum Importance {
	High = "High",
	Medium = "Medium",
	Low = "Low",
	None = "None"
}

export enum HorizontalAlign {
	End = "End",
	Begin = "Begin",
	Center = "Center"
}

// TYPES

export type ContentDensitiesType = {
	compact?: boolean;
	cozy?: boolean;
};

export type ManifestSideContent = {
	template: string;
	equalSplit?: boolean;
};

/**
 * Configuration of a KPI in the manifest
 */
export type AnalyticalKPIConfiguration = {
	model?: string;
	entitySet?: string;
	contextPath?: string;
	qualifier: string;
	detailNavigation?: string;
};

export type HiddenDraft = {
	enabled: boolean;
	stayOnCurrentPageAfterSave?: boolean;
	stayOnCurrentPageAfterCancel?: boolean;
	hideCreateNext?: boolean;
};

export type CustomKPIConfiguration = {
	template: string;
};
export type KPIConfiguration = CustomKPIConfiguration | AnalyticalKPIConfiguration;
export type MicroChartManifestConfiguration = {
	requestGroupId?: string;
	navigation?: {
		targetOutbound: {
			outbound: string;
		};
		targetSections: string[];
	};
	hideOnNoData?: boolean;
	showOnlyChart?: boolean;
	size?: string;
};
export type ControlConfiguration = {
	[annotationPath: string]: ControlManifestConfiguration;
} & {
	"@com.sap.vocabularies.UI.v1.LineItem"?: TableManifestConfiguration;
	"@com.sap.vocabularies.UI.v1.Chart"?: ChartManifestConfiguration;
	"@com.sap.vocabularies.UI.v1.Facets"?: FacetsControlConfiguration;
	"@com.sap.vocabularies.UI.v1.HeaderFacets"?: HeaderFacetsControlConfiguration;
	"@com.sap.vocabularies.UI.v1.SelectionFields"?: FilterManifestConfiguration;
	"@com.sap.vocabularies.UI.v1.MicroChart"?: MicroChartManifestConfiguration;
};

/**
 * @typedef BaseManifestSettings
 */
export type BaseManifestSettings = {
	content?: {
		header?: {
			aiNotice?: PageHeaderAINoticeConfiguration;
			facets?: ConfigurableRecord<ManifestHeaderFacet>;
			actions?: ConfigurableRecord<ManifestAction>;
			overflowGroups?: OverflowGroupsConfiguration;
			customHeader?: {
				expandedHeaderFragment: string;
				collapsedHeaderFragment: string;
			};
			avatar?: {
				imageFitType?: AvatarImageFitType;
			};
		};
		footer?: {
			actions?: ConfigurableRecord<ManifestAction>;
			overflowGroups?: OverflowGroupsConfiguration;
		};
	};
	controlConfiguration?: ControlConfiguration;
	converterType: TemplateType;
	entitySet?: string;
	navigation?: {
		[navigationPath: string]: NavigationSettingsConfiguration;
	};
	viewLevel?: number;
	fclEnabled?: boolean;
	contextPath?: string;
	variantManagement?: VariantManagementType;
	defaultTemplateAnnotationPath?: string;
	contentDensities?: ContentDensitiesType;
	shellContentDensity?: string;
	isDesktop?: boolean;
	isPhone?: boolean;
	enableLazyLoading?: boolean;
	disableObjectPageRequestOptimization?: boolean;
	sapFeManifestConfiguration?: ManifestSettingsSapFE;
	inlineEdit?: InlineEditConfiguration;
	preloadConfigurationProperties?: string[];
	additionalProperties?: string[];
};

export type ColumnAiNoticeConfiguration = {
	contentText?: string;
	contentFragmentName?: string;
};

export type PageHeaderAINoticeConfiguration = ColumnAiNoticeConfiguration & {
	visible?: string | boolean;
};

export type InlineEditConfiguration = {
	enabledFields?: string[];
	disabledFields?: string[];
	connectedFields?: (string | string[])[];
};

export type NavigationTargetConfiguration = {
	outbound?: string;
	outboundDetail?: {
		semanticObject: string;
		action: string;
		parameters?: unknown;
	};
	route?: string;
	availability?: CompiledBindingToolkitExpression;
	targetControlId?: string;
};

/**
 * @typedef NavigationSettingsConfiguration
 */
export type NavigationSettingsConfiguration = {
	create?: NavigationTargetConfiguration;
	detail?: NavigationTargetConfiguration;
	display?: {
		outbound?: string;
		target?: string; // for compatibility
		route?: string;
	};
};

type HeaderFacetsControlConfiguration = {
	facets: ConfigurableRecord<ManifestHeaderFacet>;
};

export type FacetsControlConfiguration = {
	sections: ConfigurableRecord<ManifestSection>;
	flexSettings?: FlexSettings;
};

type ManifestFormElement = Positionable &
	FieldManifestOverrides & {
		type: FormElementType;
		template: string;
		label?: string;
		property?: string;
		formatOptions?: FormatOptionsType;
		visible?: string | boolean;
		flexSettings?: FlexSettings;
	};

type ColumnLayout = $ColumnLayoutSettings & {
	type: "ColumnLayout";
};
type ResponsiveGridLayout = $ResponsiveGridLayoutSettings & {
	type: "ResponsiveGridLayout";
};
export type FormLayoutInformation = ColumnLayout | ResponsiveGridLayout;

export type FormManifestConfiguration = {
	layout?: FormLayoutInformation;
	fields: ConfigurableRecord<ManifestFormElement>;
	actions?: ConfigurableRecord<ManifestAction>;
	overflowGroups?: OverflowGroupsConfiguration;
	navigationPropertiesForAdaptationDialog?: string[];
	flexSettings?: FlexSettings;
};

export type ControlManifestConfiguration =
	| TableManifestConfiguration
	| ChartManifestConfiguration
	| FacetsControlConfiguration
	| HeaderFacetsControlConfiguration
	| FormManifestConfiguration
	| FilterManifestConfiguration;

/** Object Page */
export type TransportSelectionDefinition = {
	transportRequestProperty: string;
	selectTransportAction: string;
};

export type ObjectPageManifestSettings = BaseManifestSettings & {
	content?: {
		header?: {
			visible?: boolean;
			anchorBarVisible?: boolean;
			facets?: ConfigurableRecord<ManifestHeaderFacet>;
		};
		body?: {
			sections?: ConfigurableRecord<ManifestSection>;
		};
		transportSelection?: TransportSelectionDefinition;
	};
	editableHeaderContent?: boolean;
	sectionLayout?: "Tabs" | "Page";
	useTextForNoDataMessages?: boolean;
	openInEditMode?: boolean;
};

/**
 * @typedef ManifestHeaderFacet
 */
export type ManifestHeaderFacet = {
	type?: HeaderFacetType;
	name?: string;
	template?: string;
	position?: Position;
	visible?: CompiledBindingToolkitExpression;
	title?: string;
	subTitle?: string;
	stashed?: boolean;
	flexSettings?: FlexSettings;
	requestGroupId?: string;
	templateEdit?: string;
};

/**
 * @typedef ManifestSection
 */
export type ManifestSection = {
	title?: string;
	id?: string;
	name?: string;
	visible?: CompiledBindingToolkitExpression;
	position?: Position;
	template?: string;
	subSections?: Record<string, ManifestSubSection>;
	actions?: Record<string, ManifestAction>;
	overflowGroups?: OverflowGroupsConfiguration;
	useSingleTextAreaFieldAsNotes?: boolean;
	onSectionLoaded?: string;
	applyState?: string;
	retrieveState?: string;
	isPartOfPreview?: boolean;
	flexSettings?: FlexSettings;
};

export type ManifestSubSection = {
	id?: string;
	name?: string;
	template?: string;
	subSectionCreated?: string;
	title?: string;
	position?: Position;
	visible?: CompiledBindingToolkitExpression;
	actions?: Record<string, ManifestAction>;
	overflowGroups?: OverflowGroupsConfiguration;
	sideContent?: ManifestSideContent;
	enableLazyLoading?: boolean;
	embeddedComponent?: ManifestReuseComponentSettings;
	applyState?: string;
	retrieveState?: string;
	horizontalLayout?: boolean;
	/**
	 * Defines whether this section is a part of the preview mode.
	 * When false, the entire section is only shown in detail mode (after "Show More").
	 * When true or undefined, the section is shown in preview mode.
	 * This provides section-level show more and show less functionality for XMLFragment sections.
	 */
	isPartOfPreview?: boolean;
	flexSettings?: FlexSettings;
};

export type ManifestReuseComponentSettings = {
	name: string;
	settings?: unknown;
};

/** List Report */
export type ListReportManifestSettings = BaseManifestSettings & {
	stickyMultiTabHeader?: boolean;
	initialLoad?: boolean;
	views?: MultipleViewsConfiguration;
	keyPerformanceIndicators?: {
		[kpiName: string]: KPIConfiguration;
	};
	hideFilterBar?: boolean;
	useHiddenFilterBar?: boolean;
};

export type ViewPathConfiguration = SingleViewPathConfiguration | CombinedViewPathConfiguration;

export type ViewConfiguration = ViewPathConfiguration | CustomViewTemplateConfiguration;

export type CustomViewTemplateConfiguration = {
	key?: string;
	label: string;
	template: string;
	visible?: string;
};

export type SingleViewPathConfiguration = {
	keepPreviousPersonalization?: boolean;
	key?: string;
	entitySet?: string;
	annotationPath: string;
	contextPath?: string;
	visible?: string;
};

export type CombinedViewDefaultPath = "both" | "primary" | "secondary";

export type CombinedViewPathConfiguration = {
	primary: SingleViewPathConfiguration[];
	secondary: SingleViewPathConfiguration[];
	defaultPath?: CombinedViewDefaultPath;
	key?: string;
	visible?: string;
	annotationPath?: string;
};

/**
 * @typedef MultipleViewsConfiguration
 */
export type MultipleViewsConfiguration = {
	paths: ViewConfiguration[];
	showCounts?: boolean;
};

/** Filter Configuration */

/** @typedef FilterManifestConfiguration */
export type FilterManifestConfiguration = {
	filterFields?: Record<string, FilterFieldManifestConfiguration>;
	// old way of providing nav props
	navigationProperties?: string[];
	// New way of providing nav props
	navigationPropertiesForPersonalization?: string[];
	useSemanticDateRange?: boolean;
	showClearButton?: boolean;
	showMessages?: boolean;
	initialLayout?: string;
	layout?: string;
};

export type FilterFieldManifestConfiguration = Positionable & {
	type?: string;
	label?: string;
	template?: string;
	availability?: AvailabilityType;
	settings?: FilterSettings;
	visualFilter?: visualFilterConfiguration;
	required?: boolean;
	slotName?: string;
	property?: string | null;
};

export type visualFilterConfiguration = {
	valueList?: string;
};

export type OperatorConfiguration = {
	path: string;
	equals?: string;
	contains?: string;
	exclude: boolean;
};

export type DefaultOperator = {
	operator: string;
};

export type FilterSettings = {
	operatorConfiguration?: OperatorConfiguration[];
	defaultValues?: DefaultOperator[];
	isCustomFilter?: boolean;
};

/** Chart Configuration */

export type ChartPersonalizationManifestSettings =
	| boolean
	| string
	| {
			sort: boolean;
			type: boolean;
			item: boolean;
			filter: boolean;
	  };

export type ChartManifestConfiguration = {
	chartSettings?: {
		personalization?: ChartPersonalizationManifestSettings;
		header?: string;
		headerVisible?: boolean;
		selectionMode?: "Multiple" | "None" | "Single";
	};
	actions?: Record<string, ManifestAction>;
	overflowGroups?: OverflowGroupsConfiguration;
	enableAddCardToInsights?: boolean;
};

export type ActionAfterExecutionConfiguration = {
	navigateToInstance?: boolean;
	enableAutoScroll?: boolean;
};

/**
 * Configuration for action group separators
 */
export type OverflowGroupConfiguration = {
	showSeparator?: boolean;
};

/**
 * Configuration for all action groups in a specific context
 */
export type OverflowGroupsConfiguration = Record<string, OverflowGroupConfiguration>;

/** Table Configuration */

/**
 * @typedef ManifestAction
 */
export type ManifestAction = {
	defaultAction?: string;
	menu?: string[];
	visible?: string | boolean | PropertyBindingInfo;
	enabled?: string | boolean | PropertyBindingInfo;
	position?: Position;
	press?: string;
	text?: string | PropertyBindingInfo;
	__noWrap?: boolean;
	enableOnSelect?: string;
	defaultValuesFunction?: string;
	requiresSelection?: boolean;
	afterExecution?: ActionAfterExecutionConfiguration;
	inline?: boolean;
	determining?: boolean;
	facetName?: string;
	command?: string | undefined;
	isAIOperation?: boolean | undefined;
	priority?: OverflowToolbarPriority;
	group?: number;
	overflowGroup?: number;
	disableStrictHandling?: boolean;
	isPrimaryAction?: boolean;
};

export type ManifestAvatar = {
	imageFitType?: AvatarImageFitType;
};

export type BaseCustomDefinedTableColumn = Positionable & {
	aiNotice?: ColumnAiNoticeConfiguration;
	width?: string;
	importance?: Importance;
	horizontalAlign?: HorizontalAlign;
	availability?: AvailabilityType;
	tooltip?: string;
	required?: boolean;
	widthIncludingColumnHeader?: boolean;
	exportSettings?: ColumnExportSettings;
	disableExport?: boolean;
};

// Can be either Custom Column from Manifest or Slot Column from Building Block
export type CustomDefinedTableColumn = BaseCustomDefinedTableColumn & {
	type?: string;
	header: string;
	template: string | Control;
	properties?: string[];
};

// For overwriting Annotation Column properties
export type CustomDefinedTableColumnForOverride = BaseCustomDefinedTableColumn & {
	afterExecution?: ActionAfterExecutionConfiguration;
	settings?: TableColumnSettings;
	formatOptions?: FormatOptionsType;
	showDataFieldsLabel?: boolean;
	mergeCells?: boolean;
	mergeComparisonProperties?: string | string[];
};

export type TableColumnSettings = {
	microChartSize?: string;
	showMicroChartLabel?: boolean;
	mergeCells?: boolean;
	mergeComparisonProperties?: string | string[];
};

export type FieldManifestOverrides = {
	readOnly?: boolean;
	semanticObject?: string;
	/**
	 * Override visibility for an annotation based form element. Only applied if provided.
	 */
	visible?: string | boolean;
};

/**
 * Collection of format options for multiline text fields on a form or in a table
 */
export type FormatOptionsType = {
	displayMode?: "Value" | "Description" | "DescriptionValue" | "ValueDescription";
	measureDisplayMode?: "Hidden" | "ReadOnly";
	showDate?: boolean;
	showTime?: boolean;
	showTimezone?: boolean;
	dateTimeStyle?: "short" | "medium" | "long" | "full";
	dateTimePattern?: string;
	reactiveAreaMode?: "Inline" | "Overlay";
	hasDraftIndicator?: boolean;
	hasSituationsIndicator?: boolean;
	textLinesEdit?: number;
	textMaxCharactersDisplay?: number;
	textExpandBehaviorDisplay?: "InPlace" | "Popover";
	textMaxLines?: number;
	fieldGroupName?: string;
	textMaxLength?: number;
	showErrorObjectStatus?: string;
	fieldGroupDraftIndicatorPropertyPath?: string;
	fieldEditStyle?: FieldEditStyle;
	radioButtonsHorizontalLayout?: boolean;
	fieldGroupHorizontalLayout?: boolean;
	pattern?: string;
	useRadioButtonsForBoolean?: boolean;
	imageFitType?: AvatarImageFitType;
	enableEnlargeImage?: boolean;
};

export type QuickVariantSelectionConfiguration = {
	paths: { annotationPath: string }[];
	hideTableTitle?: boolean;
	showCounts?: boolean;
};

export type TableManifestConfiguration = {
	tableSettings?: TableManifestSettingsConfiguration;
	actions?: Record<string, ManifestAction>;
	overflowGroups?: OverflowGroupsConfiguration;
	columns?: Record<string, CustomDefinedTableColumn | CustomDefinedTableColumnForOverride>;
};

export type TablePersonalizationConfiguration =
	| boolean
	| {
			sort: boolean;
			column: boolean;
			filter: boolean;
			group: boolean;
			aggregate: boolean;
	  };
export type MassEditConfiguration =
	| boolean
	| Partial<{
			customFragment: string | FormContainer;
			visibleFields: string;
			ignoredFields: string;
			operationGroupingMode: OperationGroupingMode;
			fromInline: boolean;
	  }>;

export type TableManifestSettingsConfiguration = {
	creationMode?: {
		disableAddRowButtonForEmptyData?: boolean;
		customValidationFunction?: string;
		createAtEnd?: boolean;
		createInPlace?: boolean;
		name?: CreationMode;
		creationFields?: string;
		inlineCreationRowCount?: number;
		inlineCreationRowsHiddenInEditMode?: boolean;
		nodeType?: {
			propertyName?: string;
			values?: Record<string, string | { label: string; creationFields?: string }>;
		};
		isCreateEnabled?: string;
		outbound?: string;
	};
	isNodeMovable?: string;
	isNodeCopyable?: string;
	isMoveToPositionAllowed?: string;
	isCopyToPositionAllowed?: string;
	enablePastingOfComputedProperties?: boolean;
	enableExport?: boolean;
	exportFileName?: string;
	exportSheetName?: string;
	frozenColumnCount?: number;
	disableColumnFreeze?: boolean;
	widthIncludingColumnHeader?: boolean;
	quickVariantSelection?: QuickVariantSelectionConfiguration;
	personalization?: TablePersonalizationConfiguration;
	/**
	 * Defines how many items in a table can be selected. You have the following options:
	 * => by defining 'None' you can fully disable the list selection
	 * => by defining 'Single' you allow only one item to be selected
	 * => by defining 'Multi' you allow several items to be selected
	 * => by using 'Auto' you leave the default definition 'None', except if there is an action that requires a selection (such as deleting, or IBN)
	 */
	selectionMode?: SelectionMode;
	type?: TableType;
	analyticalConfiguration?: AnalyticalConfiguration;
	rowCountMode?: TableRowCountMode;
	rowCount?: number;
	condensedTableLayout?: boolean;
	selectAll?: boolean;
	selectionLimit?: number;
	ignoredFields?: string;
	isSearchable?: boolean;
	enablePaste?: boolean;
	rowPress?: string;
	readOnly?: boolean;
	disableCopyToClipboard?: boolean;
	enableFullScreen?: boolean;
	enableMassEdit?: MassEditConfiguration;
	enableAddCardToInsights?: boolean;
	hierarchyQualifier?: string;
	selectionChange?: string;
	header?: string;
	headerVisible?: boolean;
	disableRequestCache?: boolean;
	beforeRebindTable?: string;
	exportRequestSize?: number;
	scrollThreshold?: number;
	threshold?: number;
	popinLayout?: PopinLayoutMode;
	disableOwnRequestOnMVF?: boolean;
	additionalProperties?: string[];
};

export type SideEffectsEventsInteractionType = "Notification" | "Confirmation" | "None";
export type SideEffectsEventsInteractionManifestSetting =
	| SideEffectsEventsInteractionType
	| {
			default?: SideEffectsEventsInteractionType;
			events?: Record<string, SideEffectsEventsInteractionType>;
	  };

export enum FlexDesignTimeType {
	Default = "Default",
	NotAdaptable = "not-adaptable", // disable all actions on that instance
	NotAdaptableTree = "not-adaptable-tree", // disable all actions on that instance and on all children of that instance
	NotAdaptableVisibility = "not-adaptable-visibility" // disable all actions that influence the visibility, namely reveal and remove
}

export type FlexSettings = {
	designtime?: FlexDesignTimeType;
};
