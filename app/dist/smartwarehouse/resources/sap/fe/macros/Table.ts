import type { EntitySet, EntityType, NavigationProperty, Property } from "@sap-ux/vocabularies-types";
import type {
	DataFieldAbstractTypes,
	DataFieldTypes,
	DataPointTypeTypes,
	LineItem,
	PresentationVariant,
	SelectionPresentationVariant
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import uid from "sap/base/util/uid";
import {
	compileExpression,
	isPathInModelExpression,
	pathInModel,
	resolveBindingString,
	type CompiledBindingToolkitExpression
} from "sap/fe/base/BindingToolkit";
import type { PropertiesOf, XMLEventHolder } from "sap/fe/base/ClassSupport";
import {
	aggregation,
	association,
	defineUI5Class,
	event,
	implementInterface,
	mixin,
	property,
	xmlEventHandler
} from "sap/fe/base/ClassSupport";
import CommonUtils from "sap/fe/core/CommonUtils";
import type IRowBindingInterface from "sap/fe/core/IRowBindingInterface";
import type PageController from "sap/fe/core/PageController";
import type ResourceModel from "sap/fe/core/ResourceModel";
import type BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import BusyLocker from "sap/fe/core/controllerextensions/BusyLocker";
import NotApplicableContextDialog from "sap/fe/core/controllerextensions/editFlow/NotApplicableContextDialog";
import NavigationReason from "sap/fe/core/controllerextensions/routing/NavigationReason";
import Any from "sap/fe/core/controls/Any";
import DataWatcher from "sap/fe/core/controls/DataWatcher";
import { CreationMode, TemplateType } from "sap/fe/core/converters/ManifestSettings";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import { convertTypes, getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import {
	getCustomFunctionInfo,
	type CreateBehavior,
	type ExternalMethodConfig,
	type TableType,
	type TableVisualization
} from "sap/fe/core/converters/controls/Common/Table";
import { StandardActionKeys } from "sap/fe/core/converters/controls/Common/table/StandardActions";
import DeleteHelper from "sap/fe/core/helpers/DeleteHelper";
import FPMHelper from "sap/fe/core/helpers/FPMHelper";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import PromiseKeeper from "sap/fe/core/helpers/PromiseKeeper";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import type { RecommendationContextsInfo } from "sap/fe/core/helpers/StandardRecommendationHelper";
import type { RoutingNavigationParameters } from "sap/fe/core/services/RoutingServiceFactory";
import {
	getContextRelativeTargetObjectPath,
	getTargetObjectPath,
	type DataModelObjectPath
} from "sap/fe/core/templating/DataModelPathHelper";
import { type DisplayMode } from "sap/fe/core/templating/DisplayModeFormatter";
import * as UIFormatters from "sap/fe/core/templating/UIFormatters";
import type CollectionBindingInfoAPI from "sap/fe/macros/CollectionBindingInfo";
import type {
	EventHandler as CollectionBindingInfoEventHandler,
	SerializedCollectionBindingInfo
} from "sap/fe/macros/CollectionBindingInfo";
import type FilterBarAPI from "sap/fe/macros/FilterBar";
import MacroAPI from "sap/fe/macros/MacroAPI";
import type FilterBar from "sap/fe/macros/controls/FilterBar";
import type { default as FEFilterBar } from "sap/fe/macros/controls/FilterBar";
import type ISingleSectionContributor from "sap/fe/macros/controls/section/ISingleSectionContributor";
import type { ConsumerData } from "sap/fe/macros/controls/section/ISingleSectionContributor";
import * as FieldTemplating from "sap/fe/macros/field/FieldTemplating";
import FilterUtils from "sap/fe/macros/filter/FilterUtils";
import type { ControlState } from "sap/fe/macros/insights/CommonInsightsHelper";
import type Action from "sap/fe/macros/table/Action";
import type ActionGroup from "sap/fe/macros/table/ActionGroup";
import type BasicSearch from "sap/fe/macros/table/BasicSearch";
import type Column from "sap/fe/macros/table/Column";
import * as MdcTableTemplate from "sap/fe/macros/table/MdcTableTemplate";
import type OverflowGroup from "sap/fe/macros/table/OverflowGroups";
import PasteHelper from "sap/fe/macros/table/PasteHelper";
import type QuickFilterSelector from "sap/fe/macros/table/QuickFilterSelector";
import TableCreationOptions from "sap/fe/macros/table/TableCreationOptions";
import TableHelper from "sap/fe/macros/table/TableHelper";
import TableRuntime from "sap/fe/macros/table/TableRuntime";
import TableUtils from "sap/fe/macros/table/Utils";
import { convertPVToState } from "sap/fe/macros/table/adapter/TablePVToState";
import MassEditDialogHelper from "sap/fe/macros/table/massEdit/MassEditDialogHelper";
import type UploadConfiguration from "sap/fe/macros/table/uploadTable/UploadConfiguration";
import type { PvProperties } from "sap/fe/navigation/PresentationVariant";
import PresentationVariantClass from "sap/fe/navigation/PresentationVariant";
import type SelectionVariant from "sap/fe/navigation/SelectionVariant";
import type Dialog from "sap/m/Dialog";
import FlexItemData from "sap/m/FlexItemData";
import IllustratedMessage from "sap/m/IllustratedMessage";
import IllustratedMessageType from "sap/m/IllustratedMessageType";
import MessageBox from "sap/m/MessageBox";
import Text from "sap/m/Text";
import type CellSelector from "sap/m/plugins/CellSelector";
import type { DataStateIndicator$DataStateChangeEvent } from "sap/m/plugins/DataStateIndicator";
import type { PasteProvider$PasteEvent } from "sap/m/plugins/PasteProvider";
import type BindingInfo from "sap/ui/base/BindingInfo";
import type UI5Event from "sap/ui/base/Event";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import type { $ControlSettings } from "sap/ui/core/Control";
import UI5Element from "sap/ui/core/Element";
import Library from "sap/ui/core/Lib";
import Messaging from "sap/ui/core/Messaging";
import type RenderManager from "sap/ui/core/RenderManager";
import type DragDropInfo from "sap/ui/core/dnd/DragDropInfo";
import { TitleLevel } from "sap/ui/core/library";
import Message from "sap/ui/core/message/Message";
import type MessageType from "sap/ui/core/message/MessageType";
import type {
	default as MDCTable,
	MDCTablePropertyInfo as PropertyInfo,
	Table$BeforeExportEvent,
	Table$BeforeOpenContextMenuEvent,
	Table$SelectionChangeEvent,
	Table$SelectionChangeEventParameters
} from "sap/ui/mdc/Table";
import type TypeConfig from "sap/ui/mdc/TypeConfig";
import type ActionToolbarAction from "sap/ui/mdc/actiontoolbar/ActionToolbarAction";
import type { GroupLevels, Items, Sorters } from "sap/ui/mdc/p13n/StateUtil";
import StateUtil from "sap/ui/mdc/p13n/StateUtil";
import { type RowActionItem$PressEvent, type RowActionItem$PressEventParameters } from "sap/ui/mdc/table/RowActionItem";
import ChangeReason from "sap/ui/model/ChangeReason";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";
import type { ODataContextBinding$PatchSentEvent } from "sap/ui/model/odata/v4/ODataContextBinding";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type { ODataListBinding$ChangeEvent } from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type CreationRow from "sap/ui/table/CreationRow";
import type { EventHandler } from "types/extension_types";
import type ContentSwitcher from "./contentSwitcher/ContentSwitcher";
import type IContentSwitcherHost from "./contentSwitcher/IContentSwitcherHost";
import StateHelper from "./mdc/adapter/StateHelper";
import type ActionGroupOverride from "./table/ActionGroupOverride";
import type ActionOverride from "./table/ActionOverride";
import type AnalyticalConfiguration from "./table/AnalyticalConfiguration";
import type ColumnOverride from "./table/ColumnOverride";
import type MassEdit from "./table/MassEdit";
import type QuickVariantSelection from "./table/QuickVariantSelection";
import { createTableDefinition } from "./table/TableDefinition";
import TableEventHandlerProvider from "./table/TableEventHandlerProvider";
import ColumnManagement from "./table/mixin/ColumnManagement";
import ContextMenuHandler from "./table/mixin/ContextMenuHandler";
import EmptyRowsHandler from "./table/mixin/EmptyRowsHandler";
import TableAPIStateHandler from "./table/mixin/TableAPIStateHandler";
import TableExport from "./table/mixin/TableExport";
import TableHierarchy from "./table/mixin/TableHierarchy";
import TableOptimisticBatch from "./table/mixin/TableOptimisticBatch";
import TableSharing from "./table/mixin/TableSharing";

export type EnhancedFEPropertyInfo = PropertyInfo & {
	name: string;
	annotationPath: string;
	relativePath: string;
	descriptionProperty?: string;
	mode?: DisplayMode;
	valueProperty?: string;
	typeConfig?: TypeConfig;
	exportDataPointTargetValue?: string;
	additionalLabels?: string[];
	type?: string;
	textArrangement?: {
		textProperty: string;
		mode: DisplayMode;
	};
};

type DataModelConversion = {
	dataModelPath: DataModelObjectPath<DataFieldAbstractTypes | DataPointTypeTypes | Property>;
	convertedtargetObject: DataFieldAbstractTypes | DataPointTypeTypes;
};

type TableState = {
	[key in `actionEnablement_${string}` | `actionVisibility_${string}`]: boolean;
};

export type TableColumnProperties = {
	key: string;
	visibility: boolean;
}[];

export type DynamicVisibilityForColumn = { columnKey: string; visible: boolean };

export type TableAppState = {
	innerTable?: {
		initialState?: {
			items?: { name: string }[];
			supplementaryConfig?: object;
		};
		fullState?: {
			items?: { name: string }[];
			filter?: object;
		};
	};
	quickFilter?: {
		selectedKey?: string;
	};
	variantManagement?: {
		variantId?: string | null;
	};
	supplementaryConfig?: object;
};

export interface ITableBlock extends BuildingBlock {
	setBusyLock(locked: boolean): void;
	enableOptimisticBatchMode(): void;
	metaPath: string;
	contextPath?: string;
	emptyRowsEnabled?: boolean;
	getContent(): MDCTable;
	getTableDefinition(): TableVisualization;
	getSelectedContexts(): Context[];
	isTableRowNavigationPossible(context: Context): boolean;
	createAnyControl(ModeAsExpression: CompiledBindingToolkitExpression, rowContext: Context | undefined): typeof Any;
	getDataModelAndConvertedTargetObject(propertyName: string | undefined): DataModelConversion | undefined;
}

interface TableAPI
	extends TableAPIStateHandler,
		TableExport,
		TableOptimisticBatch,
		TableHierarchy,
		EmptyRowsHandler,
		ContextMenuHandler,
		TableSharing,
		ColumnManagement {
	// aggregation
	getContent(): MDCTable;
	// association
	getFilterBar(): string;
	// property
	getDataInitialized(): boolean;
}

/**
 * Building block used to create a table based on the metadata provided by OData V4.
 * <br>
 * Usually, a LineItem, PresentationVariant, or SelectionPresentationVariant annotation is expected, but the Table building block can also be used to display an EntitySet.
 * <br>
 * If a PresentationVariant is specified, then it must have UI.LineItem as the first property of the Visualizations.
 * <br>
 * If a SelectionPresentationVariant is specified, then it must contain a valid PresentationVariant that also has a UI.LineItem as the first property of the Visualizations.
 *
 * Usage example:
 * <pre>
 * &lt;macros:Table id="MyTable" metaPath="@com.sap.vocabularies.UI.v1.LineItem" /&gt;
 * </pre>
 * {@link demo:sap/fe/core/fpmExplorer/index.html#/buildingBlocks/table/tableDefault Overview of Table Building Blocks}
 * @mixes sap.fe.macros.Table
 * @ignoreInterface sap.fe.macros.controls.section.ISingleSectionContributor
 * @ignoreInterface sap.fe.macros.contentSwitcher.IContentSwitcherHost
 * @augments sap.fe.macros.MacroAPI
 * @public
 */

@defineUI5Class("sap.fe.macros.Table", { returnTypes: ["sap.fe.macros.MacroAPI"] })
@mixin(TableAPIStateHandler)
@mixin(TableExport)
@mixin(TableOptimisticBatch)
@mixin(TableHierarchy)
@mixin(EmptyRowsHandler)
@mixin(ContextMenuHandler)
@mixin(TableSharing)
@mixin(ColumnManagement)
class TableAPI extends MacroAPI<TableState> implements ISingleSectionContributor, IRowBindingInterface, ITableBlock, IContentSwitcherHost {
	content!: MDCTable;

	massEditDialogHelper: MassEditDialogHelper | undefined;

	originalTableDefinition!: TableVisualization;

	propertyEditModeCache: Record<string, typeof Any> = {};

	initialControlState: Record<string, unknown> = {};

	placeholderId: string | undefined;

	recreateTimer: number | undefined;

	setContextsAsyncTimer: number | undefined;

	needsRefreshOnSearch = false;

	preloadModulesPromise!: Promise<unknown>;

	constructor(mSettings?: PropertiesOf<TableAPI> & { id?: string }, ...others: $ControlSettings[]) {
		if (mSettings && typeof mSettings === "object") {
			mSettings.objectBindings = mSettings.objectBindings ?? {};
			(mSettings.objectBindings as Record<string, BindingInfo>)["internal"] = {
				model: "internal",
				path: `controls/${uid()}`
			};
			if (mSettings.id && mSettings.contentId && !mSettings.contentId.startsWith(mSettings.id)) {
				// we come from the templates and we need to get the viewId into the contentId so we use the one generated for the TableAPI as reference
				const newContentId = mSettings.id.replace("::Table", "");
				if (newContentId !== mSettings.id) {
					//ensure we don't create a duplicate id
					mSettings.contentId = newContentId;
				}
			}
		}
		super(mSettings, ...others);
		this.originalTableDefinition = this.tableDefinition;
		if (!this.getLayoutData()) {
			this.setLayoutData(new FlexItemData({ maxWidth: "100%" }));
		}
		this.attachStateChangeHandler();
		this.attachManifestEvents();
	}

	/**
	 * Set the id of the inner control when not provided into the definition of the BB
	 * Useful if we have a building block in a list report without initial load.
	 * @private
	 */
	setUpId(): void {
		if (this.id) {
			// Generate the contentId based on the ID, if not provided (FPM case)
			this.contentId ??= `${this.id}-content`;
		} else {
			const viewId = this.getPageController().getView().getId() ? `${this.getPageController().getView().getId()}--` : "";
			// We generate the contentID. Due to compatibility reasons we keep it on the MDC Table but provide assign
			// the ID with a ::Table suffix to the TableAPI
			this.contentId = `${viewId}${this.tableDefinition.annotation.id}`;
		}
	}

	@implementInterface("sap.fe.core.IRowBindingInterface")
	__implements__sap_fe_core_IRowBindingInterface = true;

	@implementInterface("sap.fe.macros.contentSwitcher.IContentSwitcherHost")
	__implements__sap_fe_macros_contentSwitcher_IContentSwitcherHost = true;

	getRowBinding(parameters?: object): ODataListBinding {
		const mdcTable = this.content;
		const dataModel = mdcTable.getModel();
		return (
			mdcTable.getRowBinding() ??
			(dataModel?.bindList(this.getRowCollectionPath(), undefined, undefined, undefined, parameters) as ODataListBinding)
		);
	}

	private attachStateChangeHandler(): void {
		StateUtil.detachStateChange(this.stateChangeHandler);
		StateUtil.attachStateChange(this.stateChangeHandler);
	}

	stateChangeHandler(oEvent: UI5Event<{ control: Control }>): void {
		const control = oEvent.getParameter("control");
		if (control.isA<MDCTable>("sap.ui.mdc.Table")) {
			const tableAPI = control.getParent() as unknown as { handleStateChange?: Function };
			if (tableAPI?.handleStateChange) {
				tableAPI.handleStateChange();
			}
		}
	}

	/**
	 * Attach the event handlers coming from the manifest for 'rowPress', 'selectionChange' and 'beforeRebindTable'.
	 * We ignore the manifest handlers if the table already has event handlers (override).
	 */
	private attachManifestEvents(): void {
		const preloadModulesPromises: Promise<void>[] = [];

		const attachIfNoListeners = (eventName: string, methodConfig: ExternalMethodConfig | undefined): void => {
			if (!this.hasListeners(eventName) && methodConfig !== undefined) {
				preloadModulesPromises.push(
					FPMHelper.preloadModule(methodConfig.moduleName)
						.then(() => {
							this.attachEvent(eventName, (ui5Event: UI5Event) => {
								const handler = FPMHelper.getCustomFunction<(ui5Event: UI5Event) => void>(
									methodConfig.moduleName,
									methodConfig.methodName,
									ui5Event
								);
								if (handler) {
									try {
										handler(ui5Event);
									} catch (error) {
										Log.error(`Error occurred while executing ${eventName} event handler: ${error}`);
									}
								} else {
									Log.error(
										`Failed to call event handler for ${eventName} event. The method ${methodConfig.methodName} in module ${methodConfig.moduleName} could not be found.`
									);
								}
							});
							return;
						})
						.catch(() => {
							Log.error(
								`Failed to attach event handler for ${eventName} event. The module ${methodConfig.moduleName} could not be found.`
							);
						})
				);
			}
		};

		attachIfNoListeners(
			"beforeRebindTable",
			getCustomFunctionInfo(this.tableDefinition?.control?.beforeRebindTable, this.tableDefinition?.control)
		);
		attachIfNoListeners("rowPress", getCustomFunctionInfo(this.tableDefinition?.control?.rowPress, this.tableDefinition?.control));
		attachIfNoListeners(
			"selectionChange",
			getCustomFunctionInfo(this.tableDefinition?.control?.selectionChange, this.tableDefinition?.control)
		);

		this.preloadModulesPromise = preloadModulesPromises.length > 0 ? Promise.all(preloadModulesPromises) : Promise.resolve();
	}

	/**
	 * Sets an illustrated message during the initialisation of the table API.
	 * Useful if we have a building block in a list report without initial load.
	 * @private
	 */
	private async setUpNoDataInformation(): Promise<void> {
		const table = this.content;
		const noData = this.getAggregation("noData") as Control | null;
		if (!table) {
			return;
		}
		await table.initialized();
		// If noData is already set by the user, we don't override it
		if (noData) {
			table.setNoData(noData.clone());
		}
		if (table.getNoData()) {
			return;
		}
		const owner = this._getOwner();
		let description;
		let title;
		if (owner) {
			const resourceModel = getResourceModel(owner);
			if (resourceModel) {
				let suffix;
				const metaPath = this.metaPath;
				if (metaPath) {
					suffix = metaPath.startsWith("/") ? metaPath.substring(1) : metaPath;
				}
				title = resourceModel.getText("T_ILLUSTRATED_MESSAGE_TITLE_BEFORESEARCH", undefined, suffix);
				description = resourceModel.getText("T_TABLE_AND_CHART_NO_DATA_TEXT", undefined, suffix);
			}
		} else {
			const resourceBundle = Library.getResourceBundleFor("sap.fe.templates")!;
			title = resourceBundle.getText("T_ILLUSTRATED_MESSAGE_TITLE_BEFORESEARCH");
			description = resourceBundle.getText("T_TABLE_AND_CHART_NO_DATA_TEXT");
		}

		if (this.getNoDataMessageMode() === "text") {
			table.setNoData(new Text({ text: description }));
		} else {
			const illustratedMessage = new IllustratedMessage({
				title: title,
				description: description,
				illustrationType: IllustratedMessageType.BeforeSearch,
				illustrationSize: this.getNoDataMessageMode(),
				enableDefaultTitleAndDescription: false,
				ariaTitleLevel: this.getIllustratedMessageAriaTitleLevel(this.headerStyle ?? this.headerLevel)
			});

			table.setNoData(illustratedMessage);
		}
	}

	/**
	 * Gets the aria level of the IllustratedMessage based on the table level.
	 * @returns The aria level of the IllustratedMessage's title
	 */
	getIllustratedMessageAriaTitleLevel(tableHeaderStyle: TitleLevel): TitleLevel {
		switch (tableHeaderStyle) {
			case TitleLevel.H1:
				return TitleLevel.H2;
			case TitleLevel.H2:
				return TitleLevel.H3;
			case TitleLevel.H3:
				return TitleLevel.H4;
			case TitleLevel.H4:
				return TitleLevel.H5;
			case TitleLevel.H5:
			case TitleLevel.Auto:
			default:
				// If it's set to Auto, the MDC Table handles the title level to be H5. If it's H6, we don't set it lower.
				return TitleLevel.H6;
		}
	}

	@implementInterface("sap.fe.macros.controls.section.ISingleSectionContributor")
	__implements__sap_fe_macros_controls_section_ISingleSectionContributor = true;

	getSectionContentRole(): "provider" | "consumer" {
		return "consumer";
	}

	/**
	 * Implementation of the sendDataToConsumer method which is a part of the ISingleSectionContributor
	 *
	 * Is called from the sap.fe.macros.controls.Section control when there is a Table building block rendered within a section
	 * along with the consumerData, for example, section data such as title and title level, which is then applied to the table using the following implementation.
	 *
	 */

	sendDataToConsumer(consumerData: ConsumerData): void {
		if (this.content?.isA<MDCTable>("sap.ui.mdc.Table")) {
			this.content?.setHeader(consumerData.title);
			this.content?.setHeaderStyle(consumerData.headerStyle as TitleLevel);
			this.content?.setHeaderLevel(consumerData.titleLevel as TitleLevel);
			this.content?.setHeaderVisible(true);
			this.content?.setShowRowCount(MdcTableTemplate.getShowRowCount(this.tableDefinition.control.showRowCount, consumerData.title));
			this.consumerDataForSection = consumerData;
			const noDataControl = this.content?.getNoData();
			if (typeof noDataControl !== "string" && noDataControl?.isA<IllustratedMessage>("sap.m.IllustratedMessage")) {
				// We set IllustratedMessage header level relative to the content(mdc table).
				noDataControl.setAriaTitleLevel(this.getIllustratedMessageAriaTitleLevel(this.content.getHeaderLevel() as TitleLevel));
			}
		}
	}

	/**
	 * Defines the relative path to a LineItem, PresentationVariant, or SelectionPresentationVariant in the metamodel, based on the current contextPath.
	 * @public
	 */
	@property({
		type: "string",
		expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"],
		expectedAnnotations: [
			"com.sap.vocabularies.UI.v1.LineItem",
			"com.sap.vocabularies.UI.v1.PresentationVariant",
			"com.sap.vocabularies.UI.v1.SelectionPresentationVariant"
		],
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
		expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"]
	})
	contextPath!: string;

	@property({ type: "object" })
	tableDefinition!: TableVisualization;

	/**
	 * Comma-separated list of additional properties that should be requested in the table's data binding.
	 * These properties are used to fetch extra data beyond what is automatically requested.
	 */
	@property({ type: "string" })
	additionalProperties!: string;

	/**
	 * Defines the template type of the table.
	 * This is an internal property used to distinguish between different template types
	 */
	@property({ type: "string" })
	templateType?: TemplateType;

	@property({ type: "string" })
	contentId!: string;

	@property({ type: "string" })
	entityTypeFullyQualifiedName!: string;

	/**
	 * Controls whether the table can be opened in full-screen mode or not.
	 * @public
	 */
	@property({ type: "boolean" })
	enableFullScreen?: boolean;

	/**
	 * Controls if the export functionality of the table is enabled or not.
	 * @public
	 */
	@property({ type: "boolean" })
	enableExport?: boolean;

	/**
	 * Configures the file name of exported table.
	 * It's limited to 31 characters. If the name is longer, it is truncated.
	 * @public
	 */
	@property({ type: "string" })
	exportFileName?: string;

	/**
	 * Configures the sheet name of exported table.
	 * It's limited to 31 characters. If the name is longer, it is truncated.
	 * @public
	 */
	@property({ type: "string" })
	exportSheetName?: string;

	/**
	 * Number of columns that are fixed on the left. Only columns which are not fixed can be scrolled horizontally.
	 *
	 * This property is not relevant for responsive tables
	 * @public
	 */
	@property({ type: "int" })
	frozenColumnCount?: number;

	/**
	 * Determines whether the number of fixed columns can be configured in the Column Settings dialog.
	 *
	 * This property doesn't apply for responsive tables
	 * @public
	 */
	@property({ type: "boolean" })
	disableColumnFreeze?: boolean;

	/**
	 * Defines how the table handles the visible rows. Does not apply to responsive tables.
	 *
	 * Allowed values are `Auto`, `Fixed`, and `Interactive`.<br/>
	 * - If set to `Fixed`, the table always has as many rows as defined in the rowCount property.<br/>
	 * - If set to `Auto`, the number of rows is changed by the table automatically. The table adjusts the number of rows based on the available space, which is limited by the surrounding container. The table cannot have fewer rows than defined in the `rowCount` property.<br/>
	 * - If set to `Interactive` the table can have as many rows as defined in the rowCount property. The number of rows can be modified by dragging the resizer.<br/>
	 * @public
	 */
	@property({ type: "string", allowedValues: ["Auto", "Fixed", "Interactive"] })
	rowCountMode?: string;

	/**
	 * Number of rows to be displayed in the table. Does not apply to responsive tables.
	 * @public
	 */
	@property({ type: "int" })
	rowCount?: number;

	/**
	 * Controls if the paste functionality of the table is enabled or not.
	 * @public
	 */
	@property({ type: "boolean" })
	enablePaste?: boolean | CompiledBindingToolkitExpression;

	/**
	 * Controls if the copy functionality of the table is disabled or not.
	 * @public
	 */
	@property({ type: "boolean" })
	disableCopyToClipboard?: boolean;

	/**
	 * Defines how many additional data records are requested from the back-end system when the user scrolls vertically in the table.
	 * @public
	 */
	@property({ type: "int" })
	scrollThreshold?: number;

	/**
	 * Defines the number of records to be initially requested from the back end.
	 * @public
	 */
	@property({ type: "int" })
	threshold?: number;

	/**
	 * Defines the layout options of the table popins. Only applies to responsive tables.
	 *
	 * Allowed values are `Block`, `GridLarge`, and `GridSmall`.<br/>
	 * - `Block`: Sets a block layout for rendering the table popins. The elements inside the popin container are rendered one below the other.<br/>
	 * - `GridLarge`: Sets a grid layout for rendering the table popins. The grid width for each table popin is comparatively larger than GridSmall, so this layout allows less content to be rendered in a single popin row.<br/>
	 * - `GridSmall`: Sets a grid layout for rendering the table popins. The grid width for each table popin is small, so this layout allows more content to be rendered in a single popin row.<br/>
	 * @public
	 */
	@property({ type: "string", allowedValues: ["Block", "GridLarge", "GridSmall"] })
	popinLayout?: string;

	/**
	 * Defines whether to display the search action.
	 * @public
	 */
	@property({ type: "boolean" })
	isSearchable?: boolean;

	/**
	 * Defines the type of table that is used by the building block to render data.
	 *
	 * Allowed values are `GridTable`, `ResponsiveTable`, and `AnalyticalTable`.
	 * @public
	 */
	@property({ type: "string", allowedValues: ["GridTable", "ResponsiveTable", "AnalyticalTable"] })
	type?: TableType;

	/**
	 * Specifies whether the table is displayed with a condensed layout. The default setting is `false`.
	 */
	@property({ type: "boolean" })
	useCondensedLayout?: boolean;

	/**
	 * Defines the selection mode to be used by the table.
	 *
	 * Allowed values are `None`, `Single`, `ForceSingle`, `Multi`, `ForceMulti`, or `Auto`.
	 * If set to `Single`, `Multi`, or `Auto`, SAP Fiori elements hooks into the standard lifecycle to determine a consistent selection mode.
	 * If set to `ForceSingle` or `ForceMulti`, note this may not adhere to the SAP Fiori guidelines.
	 * @public
	 */
	@property({ type: "string", allowedValues: ["None", "Single", "Multi", "Auto", "ForceMulti", "ForceSingle"] })
	selectionMode?: string;

	/**
	 * Determines whether the table adapts to the condensed layout.
	 * @public
	 */
	@property({ type: "boolean", bindable: true })
	condensedTableLayout?: boolean;

	/**
	 * Aggregate actions of the table.
	 * @public
	 */
	@aggregation({
		type: "sap.fe.macros.table.ITableActionOrGroup",
		multiple: true
	})
	actions?: (Action | ActionGroup | ActionOverride | ActionGroupOverride)[];

	/**
	 * Aggregate overflowGroups of the table.
	 * @public
	 */
	@aggregation({
		type: "sap.fe.macros.table.OverflowGroup",
		multiple: true
	})
	actionOverflowGroups?: OverflowGroup[];

	/**
	 * Aggregate columns of the table.
	 * @public
	 */
	@aggregation({
		type: "sap.fe.macros.table.ITableColumn",
		multiple: true,
		isDefault: true
	})
	columns?: (Column | ColumnOverride)[];

	/**
	 * An expression that allows you to control the 'read-only' state of the table.
	 *
	 * If you do not set any expression, SAP Fiori elements hooks into the standard lifecycle to determine the current state.
	 * @public
	 */
	@property({ type: "boolean" })
	readOnly!: boolean;

	/**
	 * ID of the FilterBar building block associated with the table.
	 * @public
	 */
	@property({ type: "string" })
	filterBar?: string;

	/**
	 * Specifies if the column width is automatically calculated.
	 * @public
	 */
	@property({ type: "boolean", defaultValue: true })
	enableAutoColumnWidth!: boolean;

	/**
	 * Indicates if the column header should be a part of the width calculation.
	 * @public
	 */
	@property({ type: "boolean", defaultValue: false })
	widthIncludingColumnHeader?: boolean;

	/**
	 * Changes the size of the IllustratedMessage in the table, or removes it completely.
	 * Allowed values are `illustratedMessage-Auto`, `illustratedMessage-Base`, `illustratedMessage-Dialog`, `illustratedMessage-Dot`, `illustratedMessage-Scene`, `illustratedMessage-Spot` or `text`.
	 * @since 1.129.0
	 * @public
	 */
	@property({
		type: "string",
		allowedValues: [
			"illustratedMessage-Auto",
			"illustratedMessage-Base",
			"illustratedMessage-Medium",
			"illustratedMessage-Dot",
			"illustratedMessage-ExtraSmall",
			"illustratedMessage-Scene",
			"illustratedMessage-Large",
			"illustratedMessage-Spot",
			"illustratedMessage-Small",
			"text"
		]
	})
	modeForNoDataMessage?: string;

	@property({ type: "boolean", defaultValue: false })
	dataInitialized!: boolean;

	@property({ type: "boolean", defaultValue: false })
	bindingSuspended!: boolean;

	@property({ type: "boolean", defaultValue: false })
	outDatedBinding!: boolean;

	@property({ type: "boolean", defaultValue: false })
	isAlp!: boolean;

	/**
	 * An expression that allows you to control the 'busy' state of the table.
	 * @public
	 */
	@property({ type: "boolean", bindable: true })
	busy?: boolean;

	/**
	 * Controls the kind of variant management that should be enabled for the table.
	 *
	 * Allowed value is `Control`.<br/>
	 * If set with value `Control`, a variant management control is seen within the table and the table is linked to this.<br/>
	 * If not set with any value, control level variant management is not available for this table.
	 * @public
	 */
	@property({ type: "string", allowedValues: ["", "Control"] })
	variantManagement?: string;

	/**
	 * Comma-separated value of fields that must be ignored in the OData metadata by the Table building block.<br>
	 * The table building block is not going to create built-in columns or offer table personalization for comma-separated value of fields that are provided in the ignoredfields.<br>
	 * Any column referencing an ignored field is to be removed.<br>
	 * @since 1.124.0
	 * @public
	 */
	@property({ type: "string" })
	ignoredFields?: string;

	@property({ type: "string" })
	id!: string;

	@property({ type: "string", defaultValue: "" })
	fieldMode!: string;

	/**
	 * Defines the "aria-level" of the table header
	 */
	@property({ type: "sap.ui.core.TitleLevel", defaultValue: TitleLevel.Auto })
	headerLevel!: TitleLevel;

	/**
	 * Defines the header style of the table header
	 */
	@property({ type: "sap.ui.core.TitleLevel" })
	headerStyle?: TitleLevel;

	/**
	 * Maximum allowed number of records to be exported in one request.
	 * @public
	 */
	@property({ type: "int" })
	exportRequestSize?: number;

	/**
	 * Indicates if the table should load data when initialized.
	 * This property is used only if a filter bar is associated with the table and doesn't use the liveMode.
	 * If set to `true`, the table loads data on initialization if the filter bar has no mandatory filters or the mandatory filters are filled in.
	 * If set to `false`, the table waits for the filter bar to be filled in before loading data.
	 * The default value is `false`.
	 * @public
	 */
	@property({ type: "boolean" })
	initialLoad?: boolean;

	/**
	 * Controls which options should be enabled for the table personalization dialog.
	 *
	 * If it is set to `true`, all possible options for this kind of table are enabled.<br/>
	 * If it is set to `false`, personalization is disabled.<br/>
	 * <br/>
	 * You can also provide a more granular control for the personalization by providing a comma-separated list with the options you want to be available.<br/>
	 * Available options are:<br/>
	 * - Sort<br/>
	 * - Column<br/>
	 * - Filter<br/>
	 * - Group<br/>
	 * <br/>
	 * The Group option is only applicable to analytical tables and responsive tables.<br/>
	 * @public
	 */
	@property({ type: "string" })
	personalization?: string;

	/**
	 * Specifies the header text that is shown in the table.
	 * @public
	 */
	@property({ type: "string", isBindingInfo: true })
	header?: string;

	@property({ type: "boolean" })
	useBasicSearch?: boolean;

	/**
	 * Specifies if the empty rows are enabled. This allows to have dynamic enablement of the empty rows using the setter function.
	 */
	@property({ type: "boolean" })
	emptyRowsEnabled?: boolean;

	/**
	 * Controls if the header text should be shown or not.
	 * @public
	 */
	@property({ type: "boolean", isBindingInfo: true })
	headerVisible?: boolean;

	@property({ type: "string" })
	tabTitle?: string;

	@property({ type: "string" })
	associatedSelectionVariantPath?: string;

	@property({ type: "boolean" })
	inMultiView?: boolean;

	@property({ type: "boolean" })
	displaySegmentedButton?: boolean;

	@property({ type: "boolean" })
	showPlaceholder?: boolean;

	/**
	 * Determine whether the data copied to the computed columns is sent to the back end.
	 * @public
	 */
	@property({ type: "boolean" })
	enablePastingOfComputedProperties?: boolean;

	/**
	 * Determines whether the Clear All button is enabled by default.
	 * To enable the Clear All button by default, you must set this property to false.
	 * @public
	 */
	@property({ type: "boolean" })
	enableSelectAll?: boolean;

	/**
	 * Defines the maximum number of rows that can be selected at once in the table.
	 * This property does not apply to responsive tables.
	 * @public
	 */
	@property({ type: "int" })
	selectionLimit?: number;

	/**
	 * A set of options that can be configured.
	 * @public
	 */
	@aggregation({ type: "sap.fe.macros.table.TableCreationOptions", defaultClass: TableCreationOptions })
	creationMode?: TableCreationOptions;

	/**
	 * Aggregation to forward the IllustratedMessage control to the mdc control.
	 * @public
	 */
	@aggregation({
		type: "sap.m.IllustratedMessage",
		altTypes: ["sap.m.Text"]
	})
	noData?: IllustratedMessage;

	/**
	 * A set of options that can be configured to control the aggregation behavior
	 * @public
	 */
	@aggregation({
		type: "sap.fe.macros.table.AnalyticalConfiguration"
	})
	analyticalConfiguration?: AnalyticalConfiguration;

	/**
	 * A set of options that can be configured to control the upload behavior
	 * @private
	 */
	@aggregation({
		type: "sap.fe.macros.table.uploadTable.UploadConfiguration"
	})
	uploadConfiguration?: UploadConfiguration;

	/**
	 * Aggregate quickVariantSelection of the table.
	 * @public
	 */
	@aggregation({
		type: "sap.fe.macros.table.QuickVariantSelection"
	})
	quickVariantSelection?: QuickVariantSelection;

	/**
	 * Aggregate mass edit of the table.
	 * @public
	 */
	@aggregation({
		type: "sap.fe.macros.table.MassEdit"
	})
	massEdit?: MassEdit;

	/**
	 * Before a table rebind, an event is triggered that contains information about the binding.
	 *
	 * The event contains a parameter, `collectionBindingInfo`, which is an instance of `CollectionBindingInfoAPI`.
	 * It can also contain an optional parameter, `quickFilterKey`, which indicates what is the quick filter key (if any) being processed for the table.
	 * This allows you to manipulate the table's list binding.
	 * You can use this event to attach event handlers to the table's list binding.
	 * You can use this event to add selects, and add or read the sorters and filters.
	 * @public
	 */
	@event()
	beforeRebindTable?: EventHandler<UI5Event<{ collectionBindingInfo: CollectionBindingInfoAPI; quickFilterKey?: string }, TableAPI>>;

	/**
	 * An event is triggered when the user chooses a row. The event contains information about which row is chosen.
	 *
	 * You can set this to handle the navigation manually.
	 * @public
	 */
	@event()
	rowPress?: EventHandler<UI5Event<RowActionItem$PressEventParameters, TableAPI>>;

	/**
	 * Event handler called when the user chooses an option of the segmented button in the ALP View
	 */
	@event()
	segmentedButtonPress?: Function;

	/**
	 * An event is triggered when the user saved the variant.
	 */
	@event()
	variantSaved?: Function;

	/**
	 * An event is triggered when the user selected a variant.
	 */
	@event()
	variantSelected?: Function;

	/**
	 * Event handler to react to the change event of the table's list binding.
	 *
	 * Internal only
	 */
	@event()
	listBindingChange?: Function;

	/**
	 * Event handler to react to the update of the table binding.
	 *
	 * This event is forwarded from the inner MDC table ("bindingUpdated").
	 * It is useful for scenarios where the table binding is updated (for example due to
	 * table personalization such as hide/show columns) but no list rebind/context change happens.
	 *
	 * Internal only
	 */
	@event()
	bindingUpdated?: Function;

	@event()
	internalDataRequested!: Function;

	@association({ type: "sap.fe.macros.contentSwitcher.ContentSwitcher" })
	contentSwitcher?: string;

	contextObjectPath!: DataModelObjectPath<LineItem | PresentationVariant | SelectionPresentationVariant>;

	private ignoreContextChangeEvent = false;

	private ignoreSelectionChangeEvent = false;

	private lock: Record<string, boolean> = {};

	private analyticalOutdatedWatcher?: DataWatcher;

	storedEvents: CollectionBindingInfoEventHandler[] = [];

	overrideRowPress?: boolean;

	consumerDataForSection?: ConsumerData;

	init(): void {
		return super.init(true);
	}

	getIgnoreContextChangeEvent(): boolean {
		return this.ignoreContextChangeEvent;
	}

	setIgnoreContextChangeEvent(value: boolean): void {
		this.ignoreContextChangeEvent = value;
	}

	getIgnoreSelectionChangeEvent(): boolean {
		return this.ignoreSelectionChangeEvent;
	}

	setIgnoreSelectionChangeEvent(value: boolean): void {
		this.ignoreSelectionChangeEvent = value;
	}

	setBusy(value: boolean): this {
		super.setBusy(value);
		this.content?.setBusy(value);
		return this;
	}

	/**
	 * Sets the event handlers to the TableAPI.
	 * @param eventHandlers
	 */
	setAttachEvents(eventHandlers: CollectionBindingInfoEventHandler[]): void {
		this.storedEvents = eventHandlers;
	}

	/**
	 * Gets the relevant tableAPI for a UI5 event.
	 * An event can be triggered either by the inner control (the table) or the OData listBinding
	 * The first initiator is the usual one so it's managed by the MacroAPI whereas
	 * the second one is specific to this API and has to managed by the TableAPI.
	 * @param source The UI5 event source
	 * @returns The TableAPI or false if not found
	 * @private
	 */
	static _getAPIExtension(source: ManagedObject): TableAPI | undefined {
		let tableAPI: TableAPI | undefined;
		if (source.isA<ODataListBinding>("sap.ui.model.odata.v4.ODataListBinding")) {
			tableAPI = ((this as unknown as XMLEventHolder).instanceMap?.get(this) as TableAPI[])?.find(
				(api) => api.content?.getRowBinding?.() === source || api.content?.getBinding("items") === source
			);
		}
		return tableAPI;
	}

	/**
	 * Gets contexts from the table that have been selected by the user.
	 * @returns Contexts of the rows selected by the user
	 * @public
	 */
	getSelectedContexts(): Context[] {
		// When a context menu item has been pressed, the selectedContexts correspond to the items on which
		// the corresponding action shall be applied.
		return this.isContextMenuActive()
			? this.getBindingContext("internal")?.getProperty("contextmenu/selectedContexts") ?? []
			: (this.content.getSelectedContexts() as unknown as Context[]);
	}

	/**
	 * Returns all contexts that are loaded in the table.
	 *
	 * See also the {@link sap.ui.model.odata.v4.ODataListBinding#getAllCurrentContexts} method.
	 * @returns All contexts of the table's list binding, or undefined if the table data is not yet loaded.
	 * @public
	 * @since 1.142.0
	 */
	getAllCurrentContexts(): Context[] | undefined {
		return this.content?.getRowBinding()?.getAllCurrentContexts();
	}

	/**
	 * Clears the selection.
	 * @public
	 * @since 1.142.0
	 */
	clearSelection(): void {
		this.content?.clearSelection();
	}

	/**
	 * Adds a message to the table.
	 *
	 * The message applies to the whole table and not to an individual table row.
	 * @param [parameters] The parameters to create the message
	 * @param parameters.type Message type
	 * @param parameters.message Message text
	 * @param parameters.description Message description
	 * @param parameters.persistent True if the message is persistent
	 * @returns Promise<string> The ID of the message
	 * @public
	 */
	async addMessage(parameters: { type?: MessageType; message?: string; description?: string; persistent?: boolean }): Promise<string> {
		const table = this.getContent();
		if (!table.getBindingContext() && !table.getRowBinding()) {
			await new Promise<void>((resolve) => {
				const checkContextChange = function (): void {
					if (table.getBindingContext()) {
						table.detachEvent("modelContextChange", checkContextChange);
						resolve();
					}
				};
				table.attachEvent("modelContextChange", checkContextChange);
			});
		}
		const rowBinding = table.getRowBinding();
		const resolvedPath = rowBinding.getResolvedPath() as string;
		return this.createMessage(table, resolvedPath, parameters);
	}

	private createMessage(
		table: MDCTable,
		path: string,
		parameters: { type?: MessageType; message?: string; description?: string; persistent?: boolean }
	): string {
		const message = new Message({
			target: path,
			type: parameters.type,
			message: parameters.message,
			processor: table.getModel(),
			description: parameters.description,
			persistent: parameters.persistent
		});
		this._getMessageManager().addMessages(message);
		return message.getId();
	}

	/**
	 * This function will check if the table should request recommendations function.
	 * The table in view should only request recommendations if
	 * 1. The Page is in Edit mode
	 * 2. Table is not read only
	 * 3. It has annotation for Common.RecommendedValuesFunction
	 * 4. View is not ListReport, for OP/SubOP and forward views recommendations should be requested.
	 * @param _oEvent
	 * @returns True if recommendations needs to be requested
	 */
	checkIfRecommendationRelevant(_oEvent: UI5Event): boolean {
		const isTableReadOnly = this.getProperty("readOnly");
		const isEditable = CommonUtils.getIsEditable(this);
		const view = CommonUtils.getTargetView(this);
		const viewData = view.getViewData();
		// request for action only if we are in OP/SubOP and in Edit mode, also table is not readOnly
		if (!isTableReadOnly && isEditable && viewData.converterType !== "ListReport") {
			return true;
		}
		return false;
	}

	/**
	 * Removes a message from the table.
	 * @param id The id of the message
	 * @public
	 */
	removeMessage(id: string): void {
		const msgManager = this._getMessageManager();
		const messages = msgManager.getMessageModel().getData();
		const result = messages.find((e: Message) => e.getId() === id);
		if (result) {
			msgManager.removeMessages(result);
		}
	}

	/**
	 * Requests a refresh of the table.
	 * @public
	 */
	refresh(): void {
		const tableRowBinding = this.content.getRowBinding();
		if (tableRowBinding && (tableRowBinding.isRelative() || this.getTableDefinition().control.type === "TreeTable")) {
			// For tree tables, the refresh is always done using side effects to preserve expansion states
			const appComponent = CommonUtils.getAppComponent(this.content);
			const headerContext = tableRowBinding.getHeaderContext();

			if (headerContext) {
				appComponent
					.getSideEffectsService()
					.requestSideEffects([{ $NavigationPropertyPath: "" }], headerContext, tableRowBinding.getGroupId());
			}
		} else {
			tableRowBinding?.refresh();
		}
	}

	getQuickFilter(): QuickFilterSelector | undefined {
		return this.content?.getQuickFilter() as QuickFilterSelector | undefined;
	}

	/**
	 * Get the presentation variant that is currently applied on the table.
	 * @returns The presentation variant applied to the table
	 * @public
	 */
	async getPresentationVariant(): Promise<PresentationVariantClass> {
		try {
			const table = this.content;
			const tableState = await StateUtil.retrieveExternalState(table);

			//We remove "Property::" as it is prefixed to those columns that have associated propertyInfos.
			//The Presentation Variant format does not support this (it is only required by the Table and AppState).
			const sortOrder = tableState.sorters?.map((sorter: Sorters) => {
				return {
					Property: sorter.name.replace("Property::", ""),
					Descending: sorter.descending ?? false
				};
			});
			const groupLevels = tableState.groupLevels?.map((group: GroupLevels) => {
				return group.name.replace("Property::", "");
			});
			const tableViz = {
				Content: tableState.items?.map((item: Items) => {
					return {
						Value: item.name
					};
				}),
				Type: "LineItem"
			};
			const aggregations: Record<string, { aggregated?: boolean }> = {};
			let hasAggregations = false;
			for (const key in tableState.aggregations) {
				const newKey = key.replace("Property::", "");
				aggregations[newKey] = tableState.aggregations[key];
				hasAggregations = true;
			}
			const initialExpansionLevel = (table.getPayload() as { initialExpansionLevel?: number; hierarchyQualifier?: string })
				?.initialExpansionLevel;
			const tablePV = new PresentationVariantClass();
			tablePV.setTableVisualization(tableViz);
			const properties: PvProperties = {
				GroupBy: groupLevels || [],
				SortOrder: sortOrder || []
			};
			if (hasAggregations) {
				properties.Aggregations = aggregations;
			}
			if (initialExpansionLevel) {
				properties.initialExpansionLevel = initialExpansionLevel;
			}
			tablePV.setProperties(properties);
			return tablePV;
		} catch (error) {
			const id = this.getId();
			const message = error instanceof Error ? error.message : String(error);
			Log.error(`Table Building Block (${id}) - get presentation variant failed : ${message}`);
			throw Error(error as string);
		}
	}

	/**
	 * Set a new presentation variant to the table.
	 * @param tablePV The new presentation variant that is to be set on the table.
	 * @public
	 */
	async setPresentationVariant(tablePV: PresentationVariantClass): Promise<void> {
		try {
			const table = this.content;

			const currentStatePV = await this.getPresentationVariant();
			const propertyInfos = this.getEnhancedFetchedPropertyInfos();
			const propertyInfoNames = propertyInfos.map((propInfo) => propInfo.key);
			const newTableState = convertPVToState(tablePV, currentStatePV, propertyInfoNames);
			const tableProperties = tablePV.getProperties();
			if (tableProperties?.initialExpansionLevel !== undefined) {
				const tablePayload = table.getPayload() as { initialExpansionLevel?: number; hierarchyQualifier?: string };
				tablePayload.initialExpansionLevel = tableProperties.initialExpansionLevel;
			}
			await StateUtil.applyExternalState(table, newTableState);
		} catch (error) {
			const id = this.getId();
			const message = error instanceof Error ? error.message : String(error);
			Log.error(`Table Building Block (${id}) - set presentation variant failed : ${message}`);
			throw Error(message);
		}
	}

	/**
	 * Get the variant management applied to the table.
	 * @returns Key of the currently selected variant. In case the model is not yet set, `null` will be returned.
	 * @public
	 */
	getCurrentVariantKey(): string | null {
		return this.content.getVariant()?.getCurrentVariantKey();
	}

	/**
	 * Set a variant management to the table.
	 * @param key Key of the variant that should be selected. If the passed key doesn't identify a variant, it will be ignored.
	 * @public
	 */
	setCurrentVariantKey(key: string): void {
		const variantManagement = this.content.getVariant();
		variantManagement.setCurrentVariantKey(key);
	}

	_getMessageManager(): Messaging {
		return Messaging;
	}

	/**
	 * An event triggered when the selection in the table changes.
	 * @public
	 */
	@event()
	selectionChange?: EventHandler<UI5Event<Table$SelectionChangeEventParameters & { selectedContext: Context[] }, TableAPI>>;

	_getRowBinding(): ODataListBinding {
		const oTable = this.getContent();
		return oTable.getRowBinding();
	}

	async getCounts(): Promise<string> {
		const isNotSuspended = !this.getProperty("bindingSuspended");
		const oTable = this.getContent();
		const headerContext = this._getRowBinding()?.getHeaderContext();
		return (
			!this.getQuickFilter() && headerContext && isNotSuspended
				? // The table is displayed and without quickfilter so we can directly use the property $count to get the figure
				  headerContext.requestProperty("$count")
				: TableUtils.requestCountForTable(oTable, {
						batchGroupId: isNotSuspended ? oTable.data("batchGroupId") : "$auto",
						additionalFilters: TableUtils.getHiddenFilters(oTable)
				  })
		)
			.then((iValue: number) => {
				return TableUtils.getCountFormatted(iValue);
			})
			.catch(() => {
				return "0";
			});
	}

	/**
	 * Debounced wrapper around TableRuntime.setContextsAsync that coalesces rapid successive calls into one.
	 * Only used for ChangeReason.Change events (e.g. scroll), where the binding can fire many events in quick
	 * succession. Calls within 100ms of each other are merged; only the last one executes.
	 * @param table The MDC table whose selection/action state needs updating.
	 */
	debouncedSetContextsAsync = (table: MDCTable): void => {
		if (this.setContextsAsyncTimer !== undefined) {
			clearTimeout(this.setContextsAsyncTimer);
		}
		this.setContextsAsyncTimer = window.setTimeout(() => {
			TableRuntime.setContextsAsync(table);
		}, 100);
	};

	/**
	 * Handles the context change on the table.
	 * An event is fired to propagate the OdataListBinding event and the enablement
	 * of the creation row is calculated.
	 * @param ui5Event The UI5 event
	 */
	onListBindingChange(ui5Event: ODataListBinding$ChangeEvent): void {
		const reason = ui5Event.getParameter("reason");
		this.fireEvent("listBindingChange", ui5Event.getParameters());
		this.setFastCreationRowEnablement();
		this.getQuickFilter()?.refreshSelectedCount();
		if (reason === ChangeReason.Change) {
			this.debouncedSetContextsAsync(this.content);
		} else {
			TableRuntime.setContextsAsync(this.content);
		}
		if (reason === ChangeReason.Context) {
			// The table context has changed, so has its header context. We need to update the DataWatcher to track the new header context for analytical tables.
			this.setupAnalyticalOutdatedWatcher();
		}
	}

	/**
	 * Sets up the DataWatcher that tracks `@$ui5.context.isOutdated` on the ODataListBinding's header context.
	 * Called from TableDelegate.updateBinding() every time the list binding is created or replaced.
	 * The watcher is created once and reused; only its binding context is updated on subsequent calls.
	 * Must be public so TableDelegate can call it.
	 */
	setupAnalyticalOutdatedWatcher(): void {
		if (this.getTableDefinition().control.enableAnalyticalEdit !== true) {
			return;
		}
		const rowBinding = this.content?.getRowBinding();
		const headerContext = rowBinding?.getHeaderContext();
		if (!headerContext) {
			return;
		}
		if (!this.analyticalOutdatedWatcher) {
			const watcher = new DataWatcher({
				propertyBinding: compileExpression(pathInModel("@$ui5.context.isOutdated")),
				valueChanged: (evt): void => {
					const isOutdated = evt.getParameter("value") as boolean | undefined;
					this.getBindingContext("internal")?.setProperty("analyticalRefreshNeeded", isOutdated === true);
				}
			});
			this.analyticalOutdatedWatcher = watcher;
			this.addDependent(watcher);
		}
		// Always update the binding context — the list binding may have been replaced
		this.analyticalOutdatedWatcher.setBindingContext(headerContext);
	}

	/**
	 * Handles the press event of the Refresh button in the analytical table.
	 * Refreshes the table's list binding to recalculate outdated totals.
	 */
	onAnalyticalRefreshPress(): void {
		this.getBindingContext("internal")?.setProperty("analyticalRefreshNeeded", false);
		this.content?.getRowBinding()?.refresh();
	}

	/**
	 * Handler for the onFieldLiveChange event.
	 * @param ui5Event The event object passed by the onFieldLiveChange event
	 */
	@xmlEventHandler()
	onFieldLiveChange(ui5Event: UI5Event<{}, Control>): void {
		// We can't fully move an xmlEventHandler to a mixin...
		this._onFieldLiveChange(ui5Event);
	}

	/**
	 * Handles the change on a quickFilter
	 * The table is rebound if the FilterBar is not suspended and update the AppState.
	 *
	 */
	onQuickFilterSelectionChange(): void {
		const table = this.content;
		// Rebind the table to reflect the change in quick filter key.
		// We don't rebind the table if the filterBar for the table is suspended
		// as rebind will be done when the filterBar is resumed
		const filterBarID = table.getFilter();
		const filterBar = (filterBarID && UI5Element.getElementById(filterBarID)) as FilterBar | undefined;
		if (!filterBar?.getSuspendSelection?.()) {
			table.rebind();
		}
		(CommonUtils.getTargetView(this)?.getController() as PageController | undefined)?.getExtensionAPI().updateAppState();
	}

	onTableNavigate(oController: PageController, oContext: Context, mParameters: object): boolean | undefined {
		if (this.isTableRowNavigationPossible(oContext)) {
			if (this.fullScreenDialog) {
				// Exit fullscreen mode before navigation
				this.fullScreenDialog.close(); // The fullscreendialog will set this.fullScreenDialog to undefined when closing
			}

			const navigationParameters = Object.assign({}, mParameters, {
				reason: NavigationReason.RowPress,
				targetControlId: this.tableDefinition?.annotation.row?.navigationInfo?.targetControlId
			});
			oController._routing.navigateForwardToContext(oContext, navigationParameters);
		} else {
			return false;
		}
	}

	/**
	 * Event handler for the row press event of the table.
	 * @param pressEvent
	 * @returns Promise<boolean>
	 */
	@xmlEventHandler()
	async onTableRowPress(pressEvent: RowActionItem$PressEvent): Promise<boolean | void> {
		const proceed = async (): Promise<boolean | void> => {
			const rowNavigationInfo = this.tableDefinition?.annotation.row?.navigationInfo;
			if (this.overrideRowPress === true) {
				// There's an event handler for the rowPress event --> we just fire the event and do not navigate
				this.fireEvent("rowPress", pressEvent.getParameters());
			} else if (rowNavigationInfo !== undefined) {
				const controller = this.getPageController();
				const bindingContext = pressEvent.getParameter("bindingContext") as Context;
				if (rowNavigationInfo.type === "Outbound") {
					// Outbound navigation
					return this.avoidParallelCalls(
						async () =>
							controller._intentBasedNavigation.onChevronPressNavigateOutBound(
								controller,
								rowNavigationInfo.navigationTarget,
								bindingContext,
								"",
								undefined,
								rowNavigationInfo.targetControlId
							),
						"onChevronPressNavigateOutBound"
					);
				} else {
					// Internal navigation
					const editable = rowNavigationInfo.checkEditable ? !bindingContext.getProperty("IsActiveEntity") : undefined;
					const parameters = {
						callExtension: true,
						targetPath: rowNavigationInfo.targetPath,
						editable,
						recreateContext: rowNavigationInfo.recreateContext
					};

					return this.onTableNavigate(controller, bindingContext, parameters);
				}
			}
		};
		const controller = this.getPageController();
		await controller.editFlow.syncTask(proceed);
	}

	/**
	 * Fires the corresponding event when the segmented button is pressed (in ALP).
	 * @param oEvent
	 */
	@xmlEventHandler()
	onSegmentedButtonPressed(oEvent: UI5Event): void {
		this.fireEvent("segmentedButtonPress", oEvent.getParameters());
	}

	/**
	 * Fires the corresponding event when a new variant is selected.
	 * @param oEvent
	 */
	@xmlEventHandler()
	onVariantSelected(oEvent: UI5Event): void {
		const parameters = {
			...oEvent.getParameters(),
			originalSource: oEvent.getSource()
		};
		this.fireEvent("variantSelected", parameters);
	}

	/**
	 * Fires the corresponding event when a variant is saved.
	 * @param oEvent
	 */
	@xmlEventHandler()
	onVariantSaved(oEvent: UI5Event): void {
		this.fireEvent("variantSaved", oEvent.getParameters());
	}

	/**
	 * Fires the corresponding event when a row is pressed.
	 * @param oEvent
	 */
	@xmlEventHandler()
	onRowPressed(oEvent: UI5Event): void {
		this.fireEvent("rowPress", oEvent.getParameters());
	}

	@xmlEventHandler()
	onNoop(): void {
		// Do nothing, this is used to ensure the table action are fired in responsive table
	}

	isTableRowNavigationPossible(context: Context): boolean {
		// prevent navigation to an empty row
		const emptyRow = context.isInactive() == true && context.isTransient() === true;
		// Or in the case of an analytical table, if we're trying to navigate to a context corresponding to a visual group or grand total
		// --> Cancel navigation
		const analyticalGroupHeaderExpanded =
			this.getTableDefinition().enableAnalytics === true &&
			context.isA("sap.ui.model.odata.v4.Context") &&
			typeof context.getProperty("@$ui5.node.isExpanded") === "boolean";
		return !(emptyRow || analyticalGroupHeaderExpanded);
	}

	@xmlEventHandler()
	onShareToCollaborationManagerPress(
		oEvent: UI5Event,
		controller: PageController,
		contexts: Context[],
		maxNumberofSelectedItems: number
	): void | boolean {
		// We can't fully move an xmlEventHandler to a mixin...
		return this._onShareToCollaborationManagerPress(controller, contexts, maxNumberofSelectedItems);
	}

	@xmlEventHandler()
	async onOpenInNewTabPress(
		oEvent: UI5Event,
		controller: PageController,
		allContexts: Context[],
		navigableContexts: Context[],
		parameters: RoutingNavigationParameters,
		maxNumberofSelectedItems: number
	): Promise<void | boolean> {
		if (navigableContexts.length <= maxNumberofSelectedItems) {
			const promiseToWait = new PromiseKeeper<boolean>();
			if (navigableContexts.length < allContexts.length) {
				const textKey =
					navigableContexts.length === 1
						? "T_TABLE_NAVIGATION_NOT_ALL_ITEMS_NAVIGABLE_SINGULAR"
						: "T_TABLE_NAVIGATION_NOT_ALL_ITEMS_NAVIGABLE_PLURAL";
				MessageBox.confirm(
					this.getTranslatedText(textKey, [allContexts.length, navigableContexts.length, maxNumberofSelectedItems]),
					{
						onClose: (result: string): void => {
							if (result === "CANCEL") {
								promiseToWait.resolve(false);
							}
							promiseToWait.resolve(true);
						}
					}
				);
			} else {
				promiseToWait.resolve(true);
			}
			const shouldProceed = await promiseToWait.promise;
			if (shouldProceed) {
				navigableContexts.forEach(async (context: Context) => {
					if (this.isTableRowNavigationPossible(context)) {
						parameters.editable = !context.getProperty("IsActiveEntity");
						await controller._routing.navigateForwardToContext(context, parameters);
					} else {
						return false;
					}
				});
			}
		} else {
			MessageBox.warning(
				Library.getResourceBundleFor("sap.fe.macros")!.getText("T_TABLE_NAVIGATION_TOO_MANY_ITEMS_SELECTED", [
					maxNumberofSelectedItems
				])
			);
		}
	}

	@xmlEventHandler()
	onInternalPatchCompleted(evt: UI5Event<{ error: { status?: number; cause?: { status?: number }; message?: string } }>): void {
		// BCP: 2380023090
		// We handle enablement of Delete for the table here.
		// EditFlow.ts#handlePatchSent is handling the action enablement.
		const internalModelContext = this.getBindingContext("internal") as InternalModelContext;
		const selectedContexts = this.getSelectedContexts();
		DeleteHelper.updateDeleteInfoForSelectedContexts(internalModelContext, selectedContexts);
		if (evt.getParameter("error")) {
			this.getPageController().messageHandler.showMessageDialog({ control: this });
		} else {
			this.getPageController().messageHandler.releaseHoldByControl(this);
		}
	}

	@xmlEventHandler()
	onInternalPatchSent(evt: ODataContextBinding$PatchSentEvent): void {
		const controller = this.getPageController();
		const editFlowExtension = controller.editFlow;
		controller.messageHandler.holdMessagesForControl(this);
		if (this.tableDefinition.handlePatchSent) {
			editFlowExtension.handlePatchSent.call(this, evt);
		} else if (controller.inlineEditFlow.isInlineEditPossible()) {
			controller.inlineEditFlow.handleInlineEditPatchSent.call(this, evt);
		}
	}

	@xmlEventHandler()
	onInternalDataReceived(oEvent: UI5Event<{ error: string }, ODataListBinding>): void {
		const isRecommendationRelevant = this.checkIfRecommendationRelevant(oEvent);
		if (isRecommendationRelevant) {
			const contextIdentifier = this.getIdentifierColumn(isRecommendationRelevant) as string[];
			const responseContextsArray = oEvent.getSource().getAllCurrentContexts();
			const newContexts: RecommendationContextsInfo[] = [];
			responseContextsArray.forEach((context) => {
				newContexts.push({
					context,
					contextIdentifier
				});
			});
			this.getPageController().recommendations.fetchAndApplyRecommendations(newContexts, true);
		}
		this.getPageController().messageHandler.holdMessagesForControl(this);
		if (oEvent.getParameter("error")) {
			this.getPageController().messageHandler.showMessageDialog({ control: this });
		} else {
			this.getPageController().messageHandler.releaseHoldByControl(this);
			this.setDownloadUrl();
		}
	}

	@xmlEventHandler()
	onInternalDataRequested(oEvent: UI5Event): void {
		this.setProperty("dataInitialized", true);
		this.fireEvent("internalDataRequested", oEvent.getParameters());
		if (this.getQuickFilter() !== undefined && this.getTableDefinition().control.filters?.quickFilters?.showCounts === true) {
			this.getQuickFilter()?.setCountsAsLoading();
			this.getQuickFilter()?.refreshUnSelectedCounts();
		}
		this.getPageController().messageHandler.holdMessagesForControl(this);
	}

	setBusyLock(locked: boolean): void {
		const appComponent = CommonUtils.getAppComponent(this.content);
		const busyId = this.getTableDefinition()?.annotation.id;
		const busyPath = this.getBusyPath(busyId!);
		if (locked) {
			BusyLocker.lock(appComponent, busyPath);
		} else {
			BusyLocker.unlock(appComponent, busyPath);
		}
	}

	getBusyPath(path: string, isLocal = true): string {
		return isLocal ? `/busyLocal/${path}` : "/busy";
	}

	/**
	 * Handles the Paste operation.
	 * @param evt The event
	 * @param controller The page controller
	 * @param forContextMenu
	 */
	@xmlEventHandler()
	async onPaste(evt: PasteProvider$PasteEvent, controller: PageController, forContextMenu = false): Promise<void> {
		if (forContextMenu) {
			this.setContextMenuActive(true);
		}
		const rawPastedData = evt.getParameter("data");
		const table = this.getContent();

		// If paste is disabled or if we're not in edit mode in an ObjectPage, we can't paste anything
		if (!this.tableDefinition.control.enablePaste || (table.getRowBinding().isRelative() && !CommonUtils.getIsEditable(this))) {
			return;
		}

		if (this.tableDefinition.control.type === "TreeTable") {
			await this._onPasteInHierarchy();
		} else if (table.getEnablePaste() === true && !forContextMenu) {
			const cellSelection = table.getCellSelector()?.getSelection();
			if (cellSelection?.columns.length > 0) {
				PasteHelper.pasteRangeData(rawPastedData ?? [], cellSelection, table);
			} else {
				PasteHelper.pasteData(rawPastedData ?? [], table, controller);
			}
		} else {
			const resourceBundle = Library.getResourceBundleFor("sap.fe.core")!;
			MessageBox.error(resourceBundle.getText("T_OP_CONTROLLER_SAPFE_PASTE_DISABLED_MESSAGE"), {
				title: resourceBundle.getText("C_COMMON_SAPFE_ERROR")
			});
		}
	}

	/**
	 * Handles the Paste enablement event.
	 * @param evt The UI5 event.
	 */
	@xmlEventHandler()
	pasteEnablementHandler(evt: UI5Event<{}, CellSelector>): void {
		const cellsSelection = evt.getSource().getSelection();
		const hasSelection = cellsSelection.columns.length !== 0 || cellsSelection.rows.length !== 0;
		this.content.getBindingContext("internal")?.setProperty("cellSelectorHasSelection", hasSelection);
	}

	/**
	 * Handles the Cut operation.
	 * @param forContextMenu
	 */
	@xmlEventHandler()
	onCut(forContextMenu = false): void {
		// We can't fully move an xmlEventHandler to a mixin...
		if (forContextMenu) {
			this.setContextMenuActive(true);
		}
		this._onCopyCut(forContextMenu, "Cut");
	}

	/**
	 * Handles the Copy operation.
	 * @param forContextMenu
	 */
	@xmlEventHandler()
	onCopy(forContextMenu = false): void {
		// We can't fully move an xmlEventHandler to a mixin...
		if (forContextMenu) {
			this.setContextMenuActive(true);
		}
		this._onCopyCut(forContextMenu, "Copy");
	}

	// This event will allow us to intercept the export before is triggered to cover specific cases
	// that couldn't be addressed on the propertyInfos for each column.
	// e.g. Fixed Target Value for the datapoints
	@xmlEventHandler()
	onBeforeExport(exportEvent: Table$BeforeExportEvent): void {
		// We can't fully move an xmlEventHandler to a mixin...
		this._onBeforeExport(exportEvent);
	}

	/**
	 * Handles the MDC DataStateIndicator plugin to display messageStrip on a table
	 *  On ListReport view, it will show messageStrip for messages targeting the displayed entitySet
	 *  on OP/SubOP and other views, it will show messageStrip for all messages except the one targeting /$Parameter (action parameter).
	 * @param message
	 * @param control
	 * @returns Whether to render the messageStrip visible
	 */
	dataStateIndicatorFilter(message: Message, control: Control): boolean {
		const mdcTable = control as MDCTable;
		const view = CommonUtils.getTargetView(this);
		const viewData = view.getViewData();
		const targetMessage = message.getTargets()[0];
		return viewData.converterType === TemplateType.ListReport
			? mdcTable.getRowBinding().getPath() === targetMessage
			: !targetMessage.includes("/$Parameter");
	}

	/**
	 * This event handles the DataState of the DataStateIndicator plugin from MDC on a table.
	 * It's fired when new error messages are sent from the backend to update row highlighting.
	 * @param evt Event object
	 */
	@xmlEventHandler()
	onDataStateChange(evt: DataStateIndicator$DataStateChangeEvent): void {
		const dataStateIndicator = evt.getSource();
		const filteredMessages = evt.getParameter("filteredMessages") as Message[];
		if (filteredMessages) {
			const hiddenMandatoryProperties = filteredMessages
				.map((msg) => {
					const technicalDetails = (msg.getTechnicalDetails() || {}) as {
						tableId?: string;
						emptyRowMessage?: boolean;
						missingColumn?: string;
					};
					return technicalDetails.emptyRowMessage === true && technicalDetails.missingColumn;
				})
				.filter((hiddenProperty) => !!hiddenProperty);
			if (hiddenMandatoryProperties.length) {
				const messageStripError = Library.getResourceBundleFor("sap.fe.macros")!.getText(
					hiddenMandatoryProperties.length === 1
						? "M_MESSAGESTRIP_EMPTYROW_MANDATORY_HIDDEN"
						: "M_MESSAGESTRIP_EMPTYROW_MANDATORY_HIDDEN_PLURAL",
					[hiddenMandatoryProperties.join(", ")]
				);
				dataStateIndicator.showMessage(messageStripError, "Error");
			}
			const internalModel = dataStateIndicator.getModel("internal") as JSONModel;
			internalModel.setProperty("filteredMessages", filteredMessages, dataStateIndicator.getBindingContext("internal") as Context);
		}
	}

	resumeBinding(bRequestIfNotInitialized: boolean): void {
		this.setProperty("bindingSuspended", false);
		if ((bRequestIfNotInitialized && !this.getDataInitialized()) || this.getProperty("outDatedBinding")) {
			this.setProperty("outDatedBinding", false);
			this.getContent()?.rebind();
		}
	}

	refreshNotApplicableFields(oFilterControl: Control): string[] {
		const oTable = this.getContent();
		return FilterUtils.getNotApplicableFilters(oFilterControl as FilterBar, oTable);
	}

	suspendBinding(): void {
		this.setProperty("bindingSuspended", true);
	}

	invalidateContent(): void {
		this.setProperty("dataInitialized", false);
		this.setProperty("outDatedBinding", false);
	}

	/**
	 * Sets the enablement of the creation row.
	 * @private
	 */
	setFastCreationRowEnablement(): void {
		const table = this.content;
		const fastCreationRow = table.getAggregation("creationRow") as CreationRow | null;

		if (fastCreationRow && !fastCreationRow.getBindingContext()) {
			const tableBinding = table.getRowBinding();
			const bindingContext = tableBinding.getContext();

			if (bindingContext) {
				TableHelper.enableFastCreationRow(
					fastCreationRow,
					tableBinding.getPath(),
					bindingContext,
					bindingContext.getModel(),
					Promise.resolve()
				);
			}
		}
	}

	/**
	 * Event handler to create insightsParams and call the API to show insights card preview for table.
	 * @returns Undefined if the card preview is rendered.
	 */
	@xmlEventHandler()
	async onAddCardToInsightsPressed(): Promise<void> {
		// We can't fully move an xmlEventHandler to a mixin...
		return this._onAddCardToInsightsPressed();
	}

	@xmlEventHandler()
	onMassEditButtonPressed(ui5Event: UI5Event, forContextMenu: boolean): void {
		if (forContextMenu) {
			this.setContextMenuActive(true);
		}
		const massEditHelper = new MassEditDialogHelper({
			table: this.content,
			onContextMenu: forContextMenu,
			onClose: (): void => {
				this.setMassEditDialogHelper();
			}
		});
		this.setMassEditDialogHelper(massEditHelper);
		massEditHelper.open();
	}

	@xmlEventHandler()
	async onSelectionChanged(ui5event: Table$SelectionChangeEvent): Promise<void> {
		await TableRuntime.setContexts(ui5event);
		this.fireEvent("selectionChange", { ...ui5event.getParameters(), selectedContext: this.getSelectedContexts() });
	}

	@xmlEventHandler()
	async onActionPress(
		oEvent: UI5Event<{}, Control>,
		pageController: PageController,
		actionName: string,
		parameters: {
			model: ODataModel;
			notApplicableContexts: Context[];
			label: string;
			contexts: Context[];
			applicableContexts: Context[];
			entitySetName: string;
			disableStrictHandling?: boolean;
		}
	): Promise<unknown> {
		parameters.model = oEvent.getSource().getModel() as ODataModel;
		const labelExpression = resolveBindingString(parameters.label, "string");
		if (isPathInModelExpression(labelExpression) && (labelExpression.modelName === "i18n" || labelExpression.modelName === "@i18n")) {
			//resolveBindingString(parameters.label, "string")
			parameters.label =
				(oEvent.getSource().getModel(labelExpression.modelName) as ResourceModel).getProperty(labelExpression.path) ??
				parameters.label;
		}
		let executeAction = true;
		if (parameters.notApplicableContexts && parameters.notApplicableContexts.length > 0) {
			// If we have non applicable contexts, we need to open a dialog to ask the user if he wants to continue
			const convertedMetadata = convertTypes(parameters.model.getMetaModel());
			const entityType = convertedMetadata.resolvePath<EntityType>(this.entityTypeFullyQualifiedName).target!;
			const visiblePropertyPaths = this.getEnhancedFetchedPropertyInfos()
				.filter((propInfo) => propInfo.visible)
				.map((propInfo) => propInfo.name)
				.filter((name): name is string => name !== undefined);
			const myUnapplicableContextDialog = new NotApplicableContextDialog({
				entityType: entityType,
				notApplicableContexts: parameters.notApplicableContexts,
				title: parameters.label,
				resourceModel: getResourceModel(this),
				entitySet: parameters.entitySetName,
				actionName: actionName,
				applicableContexts: parameters.applicableContexts,
				visiblePropertyPaths
			});
			parameters.contexts = parameters.applicableContexts;
			executeAction = await myUnapplicableContextDialog.open(this);
		}
		if (executeAction) {
			// Direct execution of the action
			try {
				return await pageController.editFlow.invokeAction(actionName, parameters);
			} catch (e) {
				Log.info(e as string);
			}
		}
	}

	@xmlEventHandler()
	onContextMenuPress(oEvent: Table$BeforeOpenContextMenuEvent): void {
		// We can't fully move an xmlEventHandler to a mixin...
		this._onContextMenuPress(oEvent);
	}

	/**
	 * Expose the internal table definition for external usage in the delegate.
	 * @returns The tableDefinition
	 */
	getTableDefinition(): TableVisualization {
		return this.tableDefinition;
	}

	/**
	 * Sets the mass edit related to the table.
	 * @param massEditDialogHelper
	 */
	setMassEditDialogHelper(massEditDialogHelper?: MassEditDialogHelper): void {
		this.massEditDialogHelper = massEditDialogHelper;
	}

	/**
	 * Expose the mass edit related to the table.
	 * @returns The mass edit related to the table, if any
	 */
	getMassEditDialogHelper(): MassEditDialogHelper | undefined {
		return this.massEditDialogHelper;
	}

	/**
	 * connect the filter to the tableAPI if required
	 * @private
	 * @alias sap.fe.macros.TableAPI
	 */

	updateFilterBar(): void {
		const table = this.getContent();
		const filterBarRefId = this.getFilterBar();
		if (table && filterBarRefId && table.getFilter?.() !== filterBarRefId) {
			this._setFilterBar(filterBarRefId);
		}
	}

	/**
	 * Removes the table from the listeners of the filterBar.
	 */
	detachFilterBar(): void {
		const table = this.content;
		table?.setFilter("");
	}

	/**
	 * Gets the filter control.
	 * @param filterBarRefId Id of the filter bar
	 * @returns The filter control
	 * @private
	 * @alias sap.fe.macros.TableAPI
	 */
	getFilterBarControl(filterBarRefId: string): UI5Element | undefined {
		return (
			this.getPageController()?.byId(filterBarRefId) || // Local id wrt View(FPM explorer example)
			UI5Element.getElementById(filterBarRefId) || // Absolute Id(this was not supported in older versions)
			UI5Element.getElementById(`${this.getId().substring(0, this.getId().lastIndexOf("--") + 2)}${filterBarRefId}`)
		); // Local id wrt FragmentId(when an XMLComposite or Fragment is independently processed) instead of ViewId
	}

	/**
	 * Sets the filter depending on the type of filterBar.
	 * @param filterBarRefId Id of the filter bar
	 * @private
	 * @alias sap.fe.macros.TableAPI
	 */
	_setFilterBar(filterBarRefId: string): void {
		const table = this.getContent();
		const filterBar = this.getFilterBarControl(filterBarRefId);

		if (filterBar) {
			if (filterBar.isA<FilterBarAPI>("sap.fe.macros.FilterBar")) {
				table.setFilter(`${filterBar._contentId}`);
			} else if (filterBar.isA<FEFilterBar>("sap.fe.macros.controls.FilterBar")) {
				table.setFilter(`${filterBar.getId()}`);
			} else if (
				filterBar.isA<FilterBar>("sap.ui.mdc.FilterBar") ||
				filterBar.isA<typeof BasicSearch>("sap.fe.macros.table.BasicSearch")
			) {
				table.setFilter(filterBar.getId());
			}
		}
	}

	/**
	 * Handles the CreateActivate event from the ODataListBinding.
	 * @param activateEvent The event sent by the binding
	 */
	@xmlEventHandler()
	async handleCreateActivate(activateEvent: UI5Event<{ context: Context }, ODataListBinding>): Promise<void> {
		// We can't fully move an xmlEventHandler to a mixin...
		await this._handleCreateActivate(activateEvent);
	}

	/**
	 * The dragged element enters a table row.
	 * @param ui5Event UI5 event coming from the MDC drag and drop config
	 */
	@xmlEventHandler()
	onDragEnterDocument(
		ui5Event: UI5Event<{ bindingContext: Context; dragSource: Context; dropPosition: "Before" | "After" | "On" }, DragDropInfo>
	): void {
		// We can't fully move an xmlEventHandler to a mixin...
		this._onDragEnterDocument(ui5Event);
	}

	/**
	 * Starts the drag of the document.
	 * @param ui5Event UI5 event coming from the MDC drag and drop config
	 */
	@xmlEventHandler()
	onDragStartDocument(ui5Event: UI5Event<{ bindingContext: Context }, Control>): void {
		// We can't fully move an xmlEventHandler to a mixin...
		this._onDragStartDocument(ui5Event);
	}

	/**
	 * Drops the document.
	 * @param ui5Event UI5 event coming from the MDC drag and drop config
	 * @returns The Promise
	 */
	@xmlEventHandler()
	async onDropDocument(
		ui5Event: UI5Event<{
			bindingContext: Context;
			dragSource: Context;
			dropPosition: string;
		}>
	): Promise<void> {
		// We can't fully move an xmlEventHandler to a mixin...
		await this._onDropDocument(ui5Event);
	}

	@xmlEventHandler()
	async onCollapseExpandNode(ui5Event: UI5Event, expand: boolean): Promise<void> {
		// We can't fully move an xmlEventHandler to a mixin...
		if (ui5Event.getSource().getMetadata().isA("sap.m.MenuItem")) {
			this.setContextMenuActive(true);
		}
		await this._onCollapseExpandNode(ui5Event, expand);
	}

	/**
	 * Internal method to move a row up or down in a Tree table.
	 * @param ui5Event
	 * @param moveUp True for move up, false for move down
	 * @param forContextMenu
	 */
	@xmlEventHandler()
	async onMoveUpDown(ui5Event: UI5Event, moveUp: boolean, forContextMenu = false): Promise<void> {
		// We can't fully move an xmlEventHandler to a mixin...
		if (forContextMenu) {
			this.setContextMenuActive(true);
		}
		await this._onMoveUpDown(ui5Event, moveUp, forContextMenu);
	}

	/**
	 * Get the selection variant from the table. This function considers only the selection variant applied at the control level.
	 * @returns A promise which resolves with {@link sap.fe.navigation.SelectionVariant}
	 * @public
	 */
	async getSelectionVariant(): Promise<SelectionVariant> {
		return StateHelper.getSelectionVariant(this.getContent());
	}

	/**
	 * Sets {@link sap.fe.navigation.SelectionVariant} to the table. Note: setSelectionVariant will clear existing filters and then apply the SelectionVariant values.
	 * @param selectionVariant The {@link sap.fe.navigation.SelectionVariant} to apply to the table
	 * @param prefillDescriptions Optional. If true, we will use the associated text property values (if they're available in the SelectionVariant) to display the filter value descriptions, instead of loading them from the backend
	 * @returns A promise for asynchronous handling
	 * @public
	 */
	async setSelectionVariant(selectionVariant: SelectionVariant, prefillDescriptions = false): Promise<unknown> {
		return StateHelper.setSelectionVariantToMdcControl(this.getContent(), selectionVariant, prefillDescriptions);
	}

	setProperty(propertyKey: string, propertyValue: unknown, bSuppressInvalidate?: boolean): this {
		if (!this._applyingSettings && propertyValue !== undefined && ["ignoredFields", "metaPath"].includes(propertyKey)) {
			super.setProperty(propertyKey, propertyValue, true);
			this.reCreateContent(true);
		} else {
			super.setProperty(propertyKey, propertyValue, bSuppressInvalidate);
		}
		return this;
	}

	/**
	 * Retrieves the data model and converted target object based on the provided property name.
	 * @param propertyName The name of the property.
	 * @returns Returns data model path and converted target object.
	 */

	getDataModelAndConvertedTargetObject(propertyName: string | undefined): DataModelConversion | undefined {
		const table = this.getContent();
		const metaModel = table.getModel()?.getMetaModel();
		if (!metaModel) {
			return;
		}
		const entityPath = table.data("metaPath");
		const targetMetaPath = this.getEnhancedFetchedPropertyInfos().find((propertyInfo) => propertyInfo.name === propertyName)
			?.annotationPath;
		if (!targetMetaPath) {
			return undefined;
		}
		const targetObject = metaModel.getContext(targetMetaPath!);
		const entitySet = metaModel.getContext(entityPath);
		const convertedtargetObject = MetaModelConverter.convertMetaModelContext(targetObject) as
			| DataFieldAbstractTypes
			| DataPointTypeTypes;
		let dataModelPath = MetaModelConverter.getInvolvedDataModelObjects<DataFieldAbstractTypes | DataPointTypeTypes | Property>(
			targetObject,
			entitySet
		);
		dataModelPath =
			FieldTemplating.getDataModelObjectPathForValue(
				dataModelPath as DataModelObjectPath<DataFieldAbstractTypes | DataPointTypeTypes>
			) || dataModelPath;
		return { dataModelPath: dataModelPath, convertedtargetObject: convertedtargetObject };
	}

	/**
	 * Get the binding context for the given ModeAsExpression.
	 * @param ModeAsExpression
	 * @param rowContext
	 * @returns
	 */

	createAnyControl(ModeAsExpression: CompiledBindingToolkitExpression, rowContext: Context | undefined): typeof Any {
		const table = this.getContent();
		const anyObject = new Any({ any: ModeAsExpression });
		anyObject.setModel(rowContext?.getModel());
		anyObject.setModel(table.getModel("ui"), "ui");
		return anyObject;
	}

	/**
	 * Get the edit mode of a Property.
	 * @param propertyName The name of the property
	 * @param rowContext The context of the row containing the property
	 * @returns The edit mode of the field
	 */

	getPropertyEditMode(propertyName: string, rowContext: Context): string | undefined {
		let anyObject: typeof Any | undefined;
		if (!this.propertyEditModeCache[propertyName]) {
			const dataModelPath = this.getDataModelAndConvertedTargetObject(propertyName)?.dataModelPath;
			const convertedtargetObject = this.getDataModelAndConvertedTargetObject(propertyName)?.convertedtargetObject;
			if (dataModelPath && convertedtargetObject) {
				const propertyForFieldControl = (dataModelPath?.targetObject as unknown as DataFieldTypes)?.Value
					? (dataModelPath?.targetObject as unknown as DataFieldTypes).Value
					: dataModelPath?.targetObject;
				const editModeAsExpression = compileExpression(
					UIFormatters.getEditMode(propertyForFieldControl, dataModelPath, false, true, convertedtargetObject)
				);
				anyObject = this.createAnyControl(editModeAsExpression, rowContext);
				this.propertyEditModeCache[propertyName] = anyObject;
				anyObject.setBindingContext(null); // we need to set the binding context to null otherwise the following addDependent will set it to the context of the table
				this.addDependent(anyObject); // to destroy it when the tableAPI is destroyed
			}
		} else {
			anyObject = this.propertyEditModeCache[propertyName];
		}
		anyObject?.setBindingContext(rowContext);
		const editMode = anyObject?.getAny() as string | undefined;
		anyObject?.setBindingContext(null);
		return editMode;
	}

	/**
	 * Show the columns with the given column keys by setting their availability to Default.
	 * @param columnKeys The keys for the columns to show
	 * @returns Promise<void>
	 * @public
	 * @ui5-experimental-since 1.124.0
	 * @since 1.124.0
	 */
	async showColumns(columnKeys: string[]): Promise<void> {
		for (const columnKey of columnKeys) {
			this.modifyDynamicVisibilityForColumn(columnKey, true);
		}
		return Promise.resolve(this.reCreateContent(true));
	}

	/**
	 * Hide the columns with the given column keys by setting their availability to Default.
	 * @param columnKeys The keys for the columns to hide
	 * @returns Promise<void>
	 * @public
	 * @ui5-experimental-since 1.124.0
	 * @since 1.124.0
	 */
	async hideColumns(columnKeys: string[]): Promise<void> {
		for (const columnKey of columnKeys) {
			this.modifyDynamicVisibilityForColumn(columnKey, false);
		}
		return Promise.resolve(this.reCreateContent(true));
	}

	/**
	 * Sets the fields that should be ignored when generating the table.
	 * @param ignoredFields The fields to ignore
	 * @returns Reference to this to allow method chaining
	 * @ui5-experimental-since 1.124.0
	 * @since 1.124.0
	 * @public
	 */
	setIgnoredFields(ignoredFields: string): this {
		return this.setProperty("ignoredFields", ignoredFields);
	}

	/**
	 * Get the fields that should be ignored when generating the table.
	 * @returns The value of the ignoredFields property
	 * @ui5-experimental-since 1.124.0
	 * @since 1.124.0
	 * @public
	 */
	getIgnoredFields(): string {
		return this.getProperty("ignoredFields") ?? this.tableDefinition.control.ignoredFields;
	}

	/**
	 * Retrieves the control state based on the given control state key.
	 * @param controlState The current state of the control.
	 * @returns - The full state of the control along with the initial state if available.
	 */
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
	 * Returns the key to be used for given control.
	 * @param oControl The control to get state key for
	 * @returns The key to be used for storing the controls state
	 */
	getStateKey(oControl: ManagedObject): string {
		return CommonUtils.getTargetView(this.content)?.getLocalId(oControl.getId()) || oControl.getId();
	}

	/**
	 * Updates the table definition with ignoredFields and dynamicVisibilityForColumns.
	 * @param ignoredFields
	 * @param dynamicVisibilityForColumns
	 * @param tableDefinition
	 */
	public static updateColumnsVisibility(
		ignoredFields: string | undefined,
		dynamicVisibilityForColumns: DynamicVisibilityForColumn[],
		tableDefinition: TableVisualization
	): void {
		ColumnManagement.updateColumnsVisibilityStatic(ignoredFields, dynamicVisibilityForColumns, tableDefinition);
	}

	/**
	 * Indicates whether a custom noData control has been set.
	 * @returns True if a custom noData control has been set, false otherwise
	 */
	isCustomNoDataSet(): boolean {
		return this.getAggregation("noData") !== null;
	}

	/**
	 * Sets the noData aggregation.
	 * @param noData The control to set as noData
	 * @private
	 */
	setNoData(noData: Control): void {
		this.setAggregation("noData", noData);
		if (this.content) {
			this.content.setNoData(noData.clone());
		}
	}

	/**
	 * Gets the noData aggregation.
	 * @private
	 * @returns The noData control or null if not set
	 */
	getNoData(): Control | null {
		const target = (this.content as MDCTable | undefined) ?? this;
		if (target.isA<MDCTable>("sap.ui.mdc.Table")) {
			return target.getNoData() as Control | null;
		}
		return target.getAggregation("noData") as Control | null;
	}

	/**
	 * Called by the MDC state util when the state for this control's child has changed.
	 */
	handleStateChange(): void {
		this.getPageController()?.getExtensionAPI().updateAppState();
		// Update grouping state in internal model for analytical tables
		this._updateGroupingState();
	}

	/**
	 * Updates the hasActiveGrouping property in the internal model based on the table's current grouping state.
	 */
	private _updateGroupingState(): void {
		const table = this.content;
		const internalModelContext = table?.getBindingContext("internal") as InternalModelContext;

		if (!table || !internalModelContext) {
			return;
		}

		// Check if table has active grouping
		const groupConditions = table.getGroupConditions();
		const hasGrouping = groupConditions?.groupLevels && groupConditions.groupLevels.length > 0;

		internalModelContext.setProperty("hasActiveGrouping", hasGrouping);
	}

	/**
	 * Calls the asyncCall function only if the lockName is not already locked.
	 * @param asyncCall
	 * @param lockName
	 * @returns Promise<void>
	 */
	async avoidParallelCalls(asyncCall: Function, lockName: string): Promise<void> {
		if (this.lock[lockName]) {
			return;
		}
		this.lock[lockName] = true;
		try {
			await asyncCall();
		} catch {
			this.lock[lockName] = false;
		}
		this.lock[lockName] = false;
	}

	destroy(suppressInvalidate?: boolean): void {
		// We release hold on messageHandler by the control if there is one.
		this.getPageController()?.messageHandler?.releaseHoldByControl(this);
		super.destroy(suppressInvalidate);
	}

	private fullScreenDialog?: Dialog; // The dialog used to display the table in full screen mode

	setFullScreenDialog(dialog: Dialog | undefined): void {
		this.fullScreenDialog = dialog;
	}

	private enhancedPropertyInfos: EnhancedFEPropertyInfo[] = [];

	private propertyInfos: PropertyInfo[] = [];

	/**
	 * Sets the fetched propertyInfos from the table delegate containing internal properties.
	 * @param enhancedPropertyInfos
	 * @private
	 */
	setEnhancedFetchedPropertyInfos(enhancedPropertyInfos: EnhancedFEPropertyInfo[]): void {
		this.enhancedPropertyInfos = enhancedPropertyInfos;
	}

	/**
	 * Gets the fetched propertyInfos from the table delegate containing internal properties.
	 * @returns The PropertyInfo enhanced with the PropertyInfos from the table delegate
	 * @private
	 */
	getEnhancedFetchedPropertyInfos(): EnhancedFEPropertyInfo[] {
		return this.enhancedPropertyInfos;
	}

	/**
	 * Gets the MDC expected propertyInfos from the table delegate containing internal additional properties.
	 * @returns The PropertyInfo
	 * @private
	 */
	getPropertyInfos(): PropertyInfo[] {
		const propertyInfos: PropertyInfo[] = [];
		for (const enhancedPropertyInfo of this.enhancedPropertyInfos as PropertyInfo[]) {
			let propertyInfo: PropertyInfo = {
				key: enhancedPropertyInfo.key,
				label: enhancedPropertyInfo.label,
				visible: enhancedPropertyInfo.visible,
				exportSettings: enhancedPropertyInfo.exportSettings,
				clipboardSettings: enhancedPropertyInfo.clipboardSettings,
				visualSettings: enhancedPropertyInfo.visualSettings,
				tooltip: enhancedPropertyInfo.tooltip,
				isKey: enhancedPropertyInfo.isKey
			};

			if (enhancedPropertyInfo.propertyInfos) {
				propertyInfo = {
					...propertyInfo,
					propertyInfos: enhancedPropertyInfo.propertyInfos
				};
			} else {
				let extension: PropertyInfo["extension"];
				if (enhancedPropertyInfo.extension) {
					extension = {
						technicallyGroupable: enhancedPropertyInfo.extension.technicallyGroupable,
						technicallyAggregatable: enhancedPropertyInfo.extension.technicallyAggregatable,
						customAggregate: enhancedPropertyInfo.extension.customAggregate,
						additionalProperties: enhancedPropertyInfo.extension.additionalProperties
					};
					extension = Object.fromEntries(Object.entries(extension).filter(([_, value]) => value !== undefined));
				}
				propertyInfo = {
					...propertyInfo,
					path: enhancedPropertyInfo.path,
					maxConditions: enhancedPropertyInfo.maxConditions,
					formatOptions: enhancedPropertyInfo.formatOptions,
					constraints: enhancedPropertyInfo.constraints,
					group: enhancedPropertyInfo.group,
					groupLabel: enhancedPropertyInfo.groupLabel,
					caseSensitive: enhancedPropertyInfo.caseSensitive,
					filterable: enhancedPropertyInfo.filterable,
					sortable: enhancedPropertyInfo.sortable,
					groupable: enhancedPropertyInfo.groupable,
					dataType: enhancedPropertyInfo.dataType,
					aggregatable: enhancedPropertyInfo.aggregatable,
					unit: enhancedPropertyInfo.unit,
					text: enhancedPropertyInfo.text,
					extension
				};
			}
			propertyInfos.push(
				Object.fromEntries(Object.entries(propertyInfo).filter(([_, value]) => value !== undefined)) as PropertyInfo
			);
		}
		return propertyInfos;
	}

	setCachedPropertyInfos(propertyInfos: PropertyInfo[]): void {
		this.propertyInfos = propertyInfos;
	}

	getCachedPropertyInfos(): PropertyInfo[] {
		return this.propertyInfos;
	}

	/**
	 * Sets whether the table needs to be refreshed on search.
	 * @param needsRefresh True if the table needs to be refreshed on search
	 */
	setNeedsRefreshOnSearch(needsRefresh: boolean): void {
		this.needsRefreshOnSearch = needsRefresh;
	}

	/**
	 * Gets whether the table needs to be refreshed on search.
	 * @returns True if the table needs to be refreshed on search
	 */
	getNeedsRefreshOnSearch(): boolean {
		return this.needsRefreshOnSearch;
	}

	/**
	 * Gets the path for the table collection.
	 * @returns The path
	 */
	getRowCollectionPath(): string {
		const controller = this.getPageController()!;
		const metaModel = controller.getModel().getMetaModel();
		const collectionContext = metaModel.createBindingContext(this.tableDefinition.annotation.collection);
		const contextPath = metaModel.createBindingContext(this.contextPath)!;
		const dataModelPath = getInvolvedDataModelObjects(collectionContext!, contextPath);
		return getContextRelativeTargetObjectPath(dataModelPath) || getTargetObjectPath(dataModelPath);
	}

	/**
	 * Gets the binding info used when creating the list binding for the MDC table.
	 * @returns The table binding info
	 */
	getTableTemplateBindingInfo(): SerializedCollectionBindingInfo {
		const controller = this.getPageController()!;
		const path = this.getRowCollectionPath();
		const rowBindingInfo: SerializedCollectionBindingInfo = {
			suspended: false,
			path,
			parameters: {
				$count: true
			}
		};

		if (this.tableDefinition.enable$select) {
			// Don't add $select parameter in case of an analytical query, this isn't supported by the model
			let select = Object.keys(this.tableDefinition.requestAtLeast).join(",");
			if (this.additionalProperties) {
				select = select.concat(`,${this.additionalProperties}`);
			}
			if (select) {
				rowBindingInfo.parameters!.$select = select;
			}
		}

		if (this.tableDefinition.enable$$getKeepAliveContext) {
			// we later ensure in the delegate only one list binding for a given targetCollectionPath has the flag $$getKeepAliveContext
			rowBindingInfo.parameters!.$$getKeepAliveContext = true;
		}

		// Clears the selection after a search/filter
		rowBindingInfo.parameters!.$$clearSelectionOnFilter = true;

		rowBindingInfo.parameters!.$$groupId = "$auto.Workers";
		rowBindingInfo.parameters!.$$updateGroupId = "$auto";
		rowBindingInfo.parameters!.$$ownRequest = true;
		rowBindingInfo.parameters!.$$patchWithoutSideEffects = true;

		// Event handlers
		const editFlowExtension = controller.editFlow;
		const eventHandlers: Record<string, Function> = {};
		eventHandlers.patchCompleted = this.onInternalPatchCompleted.bind(this);
		eventHandlers.dataReceived = this.onInternalDataReceived.bind(this);
		eventHandlers.dataRequested = this.onInternalDataRequested.bind(this);
		eventHandlers.change = this.onListBindingChange.bind(this);
		eventHandlers.createActivate = this.handleCreateActivate.bind(this);
		eventHandlers.createSent = editFlowExtension.handleCreateSent.bind(editFlowExtension);
		eventHandlers.patchSent = this.onInternalPatchSent.bind(this);

		rowBindingInfo.events = eventHandlers;

		return rowBindingInfo;
	}

	protected static addSetting(target: Record<string, unknown>, key: string, value: unknown): void {
		if (value !== undefined) {
			target[key] = value;
		}
	}

	/**
	 * Forward MDC "bindingUpdated" to the TableAPI so controller handlers can react
	 * even when there is no list rebind/context change (e.g. hide/show columns via personalization).
	 * @private
	 */
	attachBindingUpdatedForwarding(): void {
		this.content.attachEvent("bindingUpdated", () => {
			this.fireEvent("bindingUpdated");
		});
	}

	/**
	 * Create manifest-friendly settings from tableAPI properties.
	 * @returns Settings
	 */
	getSettingsForManifest(): Record<string, unknown> {
		const tableSettings: Record<string, unknown> = {};
		TableAPI.addSetting(tableSettings, "enableExport", this.enableExport);
		TableAPI.addSetting(tableSettings, "exportRequestSize", this.exportRequestSize);
		TableAPI.addSetting(tableSettings, "exportFileName", this.exportFileName);
		TableAPI.addSetting(tableSettings, "exportSheetName", this.exportSheetName);
		TableAPI.addSetting(tableSettings, "frozenColumnCount", this.frozenColumnCount);
		TableAPI.addSetting(tableSettings, "disableColumnFreeze", this.disableColumnFreeze);
		TableAPI.addSetting(tableSettings, "widthIncludingColumnHeader", this.widthIncludingColumnHeader);
		TableAPI.addSetting(tableSettings, "rowCountMode", this.rowCountMode);
		TableAPI.addSetting(tableSettings, "rowCount", this.rowCount);
		TableAPI.addSetting(tableSettings, "enableFullScreen", this.enableFullScreen);
		TableAPI.addSetting(tableSettings, "enablePaste", this.enablePaste);
		TableAPI.addSetting(tableSettings, "disableCopyToClipboard", this.disableCopyToClipboard);
		TableAPI.addSetting(tableSettings, "scrollThreshold", this.scrollThreshold);
		TableAPI.addSetting(tableSettings, "threshold", this.threshold);
		TableAPI.addSetting(tableSettings, "popinLayout", this.popinLayout);
		TableAPI.addSetting(tableSettings, "selectionMode", this.selectionMode);
		TableAPI.addSetting(tableSettings, "type", this.type);
		TableAPI.addSetting(tableSettings, "enablePastingOfComputedProperties", this.enablePastingOfComputedProperties);
		TableAPI.addSetting(tableSettings, "selectAll", this.enableSelectAll);
		TableAPI.addSetting(tableSettings, "ignoredFields", this.ignoredFields);
		TableAPI.addSetting(tableSettings, "selectionLimit", this.selectionLimit);
		TableAPI.addSetting(tableSettings, "condensedTableLayout", this.condensedTableLayout);
		TableAPI.addSetting(tableSettings, "isSearchable", this.isSearchable);

		if (this.creationMode) {
			const creationMode: Record<string, unknown> = {};
			TableAPI.addSetting(creationMode, "name", this.creationMode.name);
			TableAPI.addSetting(creationMode, "creationFields", this.creationMode.creationFields);
			TableAPI.addSetting(creationMode, "createAtEnd", this.creationMode.createAtEnd);
			TableAPI.addSetting(creationMode, "inlineCreationRowsHiddenInEditMode", this.creationMode.inlineCreationRowsHiddenInEditMode);
			TableAPI.addSetting(creationMode, "outbound", this.creationMode.outbound);
			if (Object.entries(creationMode).length > 0) {
				tableSettings["creationMode"] = creationMode;
			}
		}

		if (this.massEdit) {
			const enableMassEdit: Record<string, unknown> = {};
			TableAPI.addSetting(enableMassEdit, "customFragment", this.massEdit.customContent);
			TableAPI.addSetting(enableMassEdit, "fromInline", true);
			TableAPI.addSetting(enableMassEdit, "visibleFields", this.massEdit.visibleFields?.join(","));
			TableAPI.addSetting(enableMassEdit, "ignoredFields", this.massEdit.ignoredFields?.join(","));
			TableAPI.addSetting(enableMassEdit, "operationGroupingMode", this.massEdit.operationGroupingMode);
			tableSettings["enableMassEdit"] = enableMassEdit;
		}

		if (this.analyticalConfiguration?.aggregationOnLeafLevel === true) {
			const analyticalConfiguration: Record<string, unknown> = {};
			TableAPI.addSetting(analyticalConfiguration, "aggregationOnLeafLevel", this.analyticalConfiguration.aggregationOnLeafLevel);
			if (Object.entries(analyticalConfiguration).length > 0) {
				tableSettings["analyticalConfiguration"] = analyticalConfiguration;
			}
		}

		if (this.quickVariantSelection?.paths?.length) {
			TableAPI.addSetting(tableSettings, "quickVariantSelection", {
				paths: this.quickVariantSelection.paths.map((path) => {
					return { annotationPath: path };
				}),
				showCounts: this.quickVariantSelection.showCounts
			});
		}

		return tableSettings;
	}

	/**
	 * Find an action from its key.
	 * @param key
	 * @returns The action if it can be found (or undefined)
	 */
	findSlotActionFromKey(key: string): Action | undefined {
		let result: Action | undefined;

		for (const action of this.actions ?? []) {
			if (
				action.isA<ActionGroup>("sap.fe.macros.table.ActionGroup") ||
				action.isA<ActionGroupOverride>("sap.fe.macros.table.ActionGroupOverride")
			) {
				result ??= action.actions.find((a) => {
					return a.isA<Action>("sap.fe.macros.table.Action") && a.key === key;
				}) as Action | undefined;
			} else if (action.isA<Action>("sap.fe.macros.table.Action") && action.key === key) {
				result = action;
				break;
			}
		}

		return result;
	}

	onMetadataAvailable(): void {
		this.createContent();
	}

	getFullMetaPath(): string {
		if (this.metaPath.startsWith("/")) {
			return this.metaPath;
		} else if (this.contextPath.endsWith("/")) {
			return `${this.contextPath}${this.metaPath}`;
		} else {
			return `${this.contextPath}/${this.metaPath}`;
		}
	}

	getDefaultCreationMode(): TableCreationOptions {
		return new TableCreationOptions({
			name: this.tableDefinition.annotation.create.mode as TableCreationOptions["name"],
			createAtEnd: (this.tableDefinition.annotation.create as CreateBehavior).append
		});
	}

	/**
	 * Regenerate the content.
	 * @param forceCreation Regenerate it even if it has never been created.
	 */
	protected reCreateContent(forceCreation = false): void {
		if (this.content || forceCreation) {
			/* Reset the cached property infos whenever we recreate the table content.
			setIgnoredFields() can change the visibility of properties, and without clearing the cache the MDC delegate
			might reuse stale (pre-ignoredFields) visibility data, allowing hidden columns to be re-added via personalization.*/
			this.setCachedPropertyInfos([]);
			const debounce = (func: Function, delay: number) => {
				return (...args: unknown[]) => {
					if (this.recreateTimer !== undefined) {
						clearTimeout(this.recreateTimer);
					}
					this.recreateTimer = window.setTimeout(() => {
						func(...args);
					}, delay);
				};
			};
			const debouncedCreateContent = debounce(this.createContent.bind(this), 200);
			debouncedCreateContent(true);
		}
	}

	protected createContent(forceCreation = false): void {
		const owner = this._getOwner();
		if (!owner) {
			return;
		}

		this.contextPath ??= this.getOwnerContextPath() as string;
		const fullMetaPath = this.getFullMetaPath();
		if (!this.content || forceCreation) {
			this.detachFilterBar();
			if (this.analyticalOutdatedWatcher) {
				this.removeDependent(this.analyticalOutdatedWatcher);
				this.analyticalOutdatedWatcher.destroy();
				this.analyticalOutdatedWatcher = undefined;
			}
			this.content?.destroy();

			const metaModel = owner.getAppComponent().getMetaModel();
			const metaPathContext = metaModel.createBindingContext(fullMetaPath)!;

			this.tableDefinition = createTableDefinition(this);
			// Set Default values for properties based on table definition
			this.threshold ??= this.tableDefinition.annotation.threshold ?? this.tableDefinition.control.threshold;
			this.creationMode ??= this.getDefaultCreationMode();
			this.updatePropertiesFromTableDefinition();
			if (
				!this.fieldMode &&
				this.tableDefinition.enableAnalytics === true &&
				this.tableDefinition.control.enableAnalyticalEdit !== true
			) {
				// In case of analytical table with analytical edit disabled, we set the field mode to nowrapper to avoid rendering editable controls in the table
				this.fieldMode = "nowrapper";
			}

			this.updateColumnsVisibility(this.tableDefinition.control.ignoredFields, this.tableDefinition);

			const collectionEntity = this.contextObjectPath.convertedTypes.resolvePath(this.tableDefinition.annotation.collection)
				.target as EntitySet | NavigationProperty;
			const entityType = (collectionEntity as EntitySet)?.entityType ?? (collectionEntity as NavigationProperty)?.targetType;
			this.entityTypeFullyQualifiedName = entityType?.fullyQualifiedName;

			const handlerProvider = new TableEventHandlerProvider(this, { metaModel, collectionEntity });
			this.content = owner.runAsOwner(() =>
				this.createMDCTable({
					appComponent: owner.getAppComponent(),
					metaPath: metaPathContext,
					convertedMetadata: MetaModelConverter.convertTypes(metaModel),
					handlerProvider,
					metaModel
				})
			);
			this.attachBindingUpdatedForwarding();
			if (this.consumerDataForSection) {
				this.sendDataToConsumer(this.consumerDataForSection);
			}
		}
		this.updateFilterBar();
		this.setupOptimisticBatch();
		this.setUpNoDataInformation();
		this.getQuickFilter()?.setMetaPath(fullMetaPath);
		this.removePlaceholderWhenTablestartRendering();
		this.attachClipboardHandlers();
	}

	/**
	 * Remove the placeholder when the table starts rendering.
	 */
	removePlaceholderWhenTablestartRendering(): void {
		if (this.showPlaceholder) {
			//await new Promise((resolve) => this.getContent().attachEventOnce("bindingUpdated", resolve));
			const eventDelegate = {
				onAfterRendering: (): void => {
					if (this.getContent().getDomRef()?.innerHTML) {
						this.showPlaceholder = false;
						document.getElementById(this.placeholderId!)?.remove();
						this.getContent().removeEventDelegate(eventDelegate);
					}
				}
			};
			this.getContent().addEventDelegate(eventDelegate);
		}
	}

	/**
	 * Get the placeholder HTML.
	 * @param rm RenderManager
	 */
	getPlaceholder(rm: RenderManager): void {
		if (this.showPlaceholder && !document.getElementById(this.placeholderId ?? "")) {
			this.placeholderId = `${this.getId()}--placeholder`;
			rm.openStart("div", this.placeholderId)
				.style("height", "33.34vh")
				//	.style("width", "100%")
				//	.style("position", "absolute")
				.style("background-color", "rgba(0, 0, 0, 0)")
				.openEnd()
				.close("div");
		}
	}

	private createMDCTable(parameters: MdcTableTemplate.TableTemplatingParameters): MDCTable {
		return MdcTableTemplate.getMDCTableTemplate(this, parameters);
	}

	private updatePropertiesFromTableDefinition(): void {
		this.setUpId();
		// Basic search field if no filter bar is provided
		if (this.useBasicSearch === undefined && this.isSearchable !== false) {
			// If no filterbar is provided, use the basic search field
			if (!this.filterBar) {
				this.filterBar = generate([this.contentId, "StandardAction", "BasicSearch"]);
				this.useBasicSearch = true;
			} else {
				this.useBasicSearch = false;
			}
		}
		this.isSearchable = this.isSearchable ?? this.tableDefinition.annotation.searchable;

		if (this.variantManagement === undefined) {
			this.variantManagement = this.tableDefinition.annotation.variantManagement;
		}

		this.overrideRowPress = !!this.tableDefinition?.control?.rowPress || this.hasListeners("rowPress");

		// Read-only mode
		if (
			this.readOnly === undefined &&
			(this.tableDefinition.annotation.displayMode === true || this.tableDefinition.control.readOnly === true)
		) {
			this.readOnly = true;
		}

		// Enable empty rows
		if (this.emptyRowsEnabled === undefined) {
			const enabled =
				this.creationMode?.name === CreationMode.InlineCreationRows
					? this.tableDefinition.actions.find((a) => a.key === StandardActionKeys.Create)?.enabled
					: undefined;
			if (enabled !== undefined && enabled !== "false") {
				this.setOrBindProperty("emptyRowsEnabled", enabled);
			}
		}
	}

	getNoDataMessageMode(): string {
		const mode = this.modeForNoDataMessage ?? this.tableDefinition.control.modeForNoDataMessage ?? "illustratedMessage-Auto";
		return mode === "text" ? "text" : mode.split("-")[1];
	}

	/**
	 * Get the count of the row binding of the table.
	 * @returns The count of the row binding
	 * @public
	 */
	getCount(): number | undefined {
		return this.getRowBinding()?.getCount();
	}

	/**
	 * Adds a column to the table.
	 * @param column The column to add
	 * @returns Reference to this to allow method chaining
	 * @public
	 * @ui5-experimental-since 1.145.0
	 * @since 1.145.0
	 */
	addColumn(column: Column): this {
		this.addAggregation("columns", column);
		this.reCreateContent();
		return this;
	}

	/**
	 * Removes a column from the table.
	 * @param column The column to remove, or its index or ID
	 * @returns The removed column or null
	 * @public
	 * @ui5-experimental-since 1.145.0
	 * @since 1.145.0
	 */
	removeColumn(column: number | string | Column): Column | null {
		const removedColumn = this.removeAggregation("columns", column) as Column | null;
		this.reCreateContent();
		return removedColumn;
	}

	/**
	 * Adds an action to the table.
	 * @param action The action to add
	 * @returns Reference to this to allow method chaining
	 * @public
	 * @ui5-experimental-since 1.145.0
	 * @since 1.145.0
	 */
	addAction(action: Action): this {
		this.addAggregation("actions", action);
		this.reCreateContent();
		return this;
	}

	/**
	 * Removes an action from the table.
	 * @param action The action to remove, or its index or ID
	 * @returns The removed action or null
	 * @public
	 * @ui5-experimental-since 1.145.0
	 * @since 1.145.0
	 */
	removeAction(action: number | string | Action): Action | null {
		const removedAction = this.removeAggregation("actions", action) as Action | null;
		this.reCreateContent();
		return removedAction;
	}

	setAsHost(contentSwitcher: ContentSwitcher): void {
		// If the table is set to visible, we need to ensure that the contentSwitcher is also included in the table's action toolbar
		(
			this.content
				.getTableActions()
				.find((action) => action.getId() === generate([this.contentId, "ContentSwitcher"])) as ActionToolbarAction
		)?.setAction(contentSwitcher);
	}
}

export default TableAPI;
