import type { ConvertedMetadata, EntitySet, NavigationProperty } from "@sap-ux/vocabularies-types";
import type {
	Chart,
	ConnectedFields,
	DataField,
	DataFieldForAction,
	DataFieldForAnnotation,
	DataFieldTypes,
	DataPoint,
	FieldGroup,
	LineItem,
	PresentationVariant,
	SelectionPresentationVariant
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import {
	UIAnnotationTerms,
	UIAnnotationTypes,
	type DataFieldAbstractTypes,
	type DataFieldForIntentBasedNavigation
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import type { BindingToolkitExpression, CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import {
	and,
	compileExpression,
	constant,
	equal,
	greaterThan,
	ifElse,
	isConstant,
	isTruthy,
	not,
	notEqual,
	or,
	pathInModel,
	resolveBindingString
} from "sap/fe/base/BindingToolkit";
import type { PropertiesOf, StrictPropertiesOf } from "sap/fe/base/ClassSupport";
import type AppComponent from "sap/fe/core/AppComponent";
import CommonUtils from "sap/fe/core/CommonUtils";
import CommandExecution from "sap/fe/core/controls/CommandExecution";
import FormElementWrapper from "sap/fe/core/controls/FormElementWrapper";
import { CreationMode, type ColumnAiNoticeConfiguration } from "sap/fe/core/converters/ManifestSettings";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { hasDataPointTarget, isDataField, isDataFieldForAnnotation } from "sap/fe/core/converters/annotations/DataField";
import type { BaseAction, CustomAction } from "sap/fe/core/converters/controls/Common/Action";
import type { TableType, TableVisualization } from "sap/fe/core/converters/controls/Common/Table";
import type {
	AnnotationTableColumn,
	ComputedTableColumn,
	CustomBasedTableColumn
} from "sap/fe/core/converters/controls/Common/table/Columns";
import { StandardActionKeys, type StandardAction } from "sap/fe/core/converters/controls/Common/table/StandardActions";
import { getConnectedFieldsData } from "sap/fe/core/converters/helpers/DataFieldHelper";
import { Entity, UI, singletonPathVisitor } from "sap/fe/core/helpers/BindingHelper";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { isAnnotationOfTerm, isAnnotationOfType, isSingleton } from "sap/fe/core/helpers/TypeGuards";
import { enhanceDataModelPath, isPathUpdatable, type DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import type { DateTimeStyle } from "sap/fe/core/templating/UIFormatters";
import { isMultiValueField } from "sap/fe/core/templating/UIFormatters";
import { getCommandExecutionForAction } from "sap/fe/macros/ActionCommand";
import CommonHelper from "sap/fe/macros/CommonHelper";
import Field from "sap/fe/macros/Field";
import MultiValueFieldBlock from "sap/fe/macros/MultiValueField";
import { createCustomData, createCustomDatas } from "sap/fe/macros/TSXUtils";
import type TableAPI from "sap/fe/macros/Table";
import DraftIndicator from "sap/fe/macros/draftIndicator/DraftIndicator";
import FieldHelper from "sap/fe/macros/field/FieldHelper";
import { getDraftIndicatorVisibleBinding, getVisibleExpression } from "sap/fe/macros/field/FieldTemplating";
import ActionHelper from "sap/fe/macros/internal/helpers/ActionHelper";
import SituationsIndicator from "sap/fe/macros/situations/SituationsIndicator";
import {
	getAnalyticalRefreshButton,
	getFullScreen,
	getTableActionsTemplate,
	getTableContextMenuTemplate
} from "sap/fe/macros/table/ActionsTemplating";
import QuickFilterSelector from "sap/fe/macros/table/QuickFilterSelector";
import SlotColumn from "sap/fe/macros/table/SlotColumn";
import type TableCreationOptions from "sap/fe/macros/table/TableCreationOptions";
import TableHelper from "sap/fe/macros/table/TableHelper";
import { getUploadPlugin } from "sap/fe/macros/table/uploadTable/UploadTableTemplate";
import FlexItemData from "sap/m/FlexItemData";
import HBox from "sap/m/HBox";
import Label from "sap/m/Label";
import Menu from "sap/m/Menu";
import MenuItem from "sap/m/MenuItem";
import ObjectStatus from "sap/m/ObjectStatus";
import Text from "sap/m/Text";
import VBox from "sap/m/VBox";
import { ObjectMarkerVisibility, PlacementType } from "sap/m/library";
import CellSelector from "sap/m/plugins/CellSelector";
import ColumnAIAction from "sap/m/plugins/ColumnAIAction";
import ContextMenuSetting from "sap/m/plugins/ContextMenuSetting";
import CopyProvider from "sap/m/plugins/CopyProvider";
import DataStateIndicator from "sap/m/plugins/DataStateIndicator";
import type Control from "sap/ui/core/Control";
import type CustomData from "sap/ui/core/CustomData";
import type UI5Element from "sap/ui/core/Element";
import Library from "sap/ui/core/Lib";
import type { TitleLevel } from "sap/ui/core/library";
import { Priority } from "sap/ui/core/library";
import VariantManagement from "sap/ui/fl/variants/VariantManagement";
import MDCTable from "sap/ui/mdc/Table";
import ActionToolbarAction from "sap/ui/mdc/actiontoolbar/ActionToolbarAction";
import TableP13nMode from "sap/ui/mdc/enums/TableP13nMode";
import TableRowActionType from "sap/ui/mdc/enums/TableRowActionType";
import PersistenceProvider from "sap/ui/mdc/p13n/PersistenceProvider";
import Column from "sap/ui/mdc/table/Column";
import CreationRow from "sap/ui/mdc/table/CreationRow";
import DragDropConfig from "sap/ui/mdc/table/DragDropConfig";
import GridTableType from "sap/ui/mdc/table/GridTableType";
import ResponsiveColumnSettings from "sap/ui/mdc/table/ResponsiveColumnSettings";
import ResponsiveTableType from "sap/ui/mdc/table/ResponsiveTableType";
import RowActionItem from "sap/ui/mdc/table/RowActionItem";
import RowSettings from "sap/ui/mdc/table/RowSettings";
import TreeTableType from "sap/ui/mdc/table/TreeTableType";
import type Context from "sap/ui/model/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import MicroChart from "../MicroChart";
import FieldFormatOptions from "../field/FieldFormatOptions";
import type ColumnAINotice from "./ColumnAINotice";
import ColumnHelper from "./ColumnHelper";
import type TableEventHandlerProvider from "./TableEventHandlerProvider";

export type TableTemplatingParameters = {
	metaPath: Context;
	convertedMetadata: ConvertedMetadata;
	metaModel: ODataMetaModel;
	handlerProvider: TableEventHandlerProvider;
	appComponent: AppComponent;
};

/**
 * Generates the table type for the table.
 * @param tableDefinition
 * @param _collection
 * @param tableType
 * @param selectionLimit
 * @returns The table type
 */
function getTableType(
	tableDefinition: TableVisualization,
	_collection: Context,
	tableType: TableType,
	selectionLimit: number
): ResponsiveTableType | GridTableType | TreeTableType {
	const collection = _collection.getObject();
	switch (tableType) {
		case "GridTable":
			return (
				<GridTableType
					rowCountMode={tableDefinition.control.rowCountMode}
					rowCount={tableDefinition.control.rowCount}
					selectionLimit={selectionLimit}
					fixedColumnCount={tableDefinition.control.frozenColumnCount}
					scrollThreshold={tableDefinition.control.scrollThreshold}
					enableColumnFreeze={tableDefinition.control.enableColumnFreeze}
				/>
			);

		case "TreeTable":
			return (
				<TreeTableType
					rowCountMode={tableDefinition.control.rowCountMode}
					rowCount={tableDefinition.control.rowCount}
					selectionLimit={selectionLimit}
					fixedColumnCount={tableDefinition.control.frozenColumnCount}
					scrollThreshold={tableDefinition.control.scrollThreshold}
					enableColumnFreeze={tableDefinition.control.enableColumnFreeze}
				/>
			);

		default:
			return (
				<ResponsiveTableType
					showDetailsButton={true}
					detailsButtonSetting={[Priority.Low, Priority.Medium, Priority.None]}
					growingMode={collection.$kind === "EntitySet" ? "Scroll" : undefined}
					popinLayout={tableDefinition.control.popinLayout}
				/>
			);
	}
}

/**
 * Generates the DataSateIndicator for the table.
 * @param handlerProvider
 * @returns The datastate indicator
 */
function getDataStateIndicator(handlerProvider: TableEventHandlerProvider): DataStateIndicator {
	return (
		<DataStateIndicator
			filter={handlerProvider.dataStateIndicatorFilter}
			enabled={compileExpression(not(equal(pathInModel("enableTableDataStateIndicator", "pageInternal"), false)))}
			enableFiltering={true}
			dataStateChange={handlerProvider.dataStateChange}
		/>
	);
}

/**
 * Generates the binding expression for the drag and drop enablement.
 * @param contextObjectPath
 * @param tableDefinition
 * @returns The binding expression
 */
function getDragAndDropEnabled(
	contextObjectPath: DataModelObjectPath<LineItem | SelectionPresentationVariant | PresentationVariant>,
	tableDefinition: TableVisualization
): BindingToolkitExpression<boolean> {
	const isPathUpdatableOnNavigation = isPathUpdatable(contextObjectPath, {
		ignoreTargetCollection: true,
		authorizeUnresolvable: true,
		pathVisitor: (path: string, navigationPaths: string[]) =>
			singletonPathVisitor(path, contextObjectPath.convertedTypes, navigationPaths)
	});
	const isPathUpdatableOnTarget = isPathUpdatable(contextObjectPath, {
		authorizeUnresolvable: true,
		pathVisitor: (path: string, navigationPaths: string[]) =>
			singletonPathVisitor(path, contextObjectPath.convertedTypes, navigationPaths)
	});

	if (contextObjectPath.startingEntitySet === contextObjectPath.targetEntitySet) {
		// ListReport case: we allow drag and drop on draft-enabled entities
		if ((contextObjectPath.startingEntitySet as EntitySet).annotations.Common?.DraftRoot !== undefined) {
			return and(
				isPathUpdatableOnNavigation._type === "Unresolvable"
					? ifElse(isConstant(isPathUpdatableOnTarget), isPathUpdatableOnTarget, constant(true))
					: isPathUpdatableOnNavigation,
				tableDefinition.control.isHierarchyParentNodeUpdatable!
			);
		} else {
			return constant(false);
		}
	} else {
		// ObjectPage case: we allow drag and drop in edit mode
		return and(
			isPathUpdatableOnNavigation._type === "Unresolvable"
				? ifElse(isConstant(isPathUpdatableOnTarget), isPathUpdatableOnTarget, constant(true))
				: isPathUpdatableOnNavigation,
			UI.IsEditable,
			tableDefinition.control.isHierarchyParentNodeUpdatable!
		);
	}
}

function getCustomDataForClipboardActions(tableProperties: TableBlockProperties): { key: string; value: string }[] {
	const tableType = tableProperties.tableDefinition.control.type;
	const data: { key: string; value: string }[] = [];
	if (tableType !== "TreeTable") {
		return data;
	}

	const tableDefinition = tableProperties.tableDefinition;
	const cutAction = tableDefinition.actions.find((a) => a.key === StandardActionKeys.Cut) as StandardAction | undefined;
	if (cutAction?.isTemplated === "true") {
		data.push({ key: "TreeCutEnablement", value: cutAction.enabled as string });
	}
	const copyAction = tableDefinition.actions.find((a) => a.key === StandardActionKeys.Copy) as StandardAction | undefined;
	if (copyAction?.isTemplated === "true") {
		data.push({ key: "TreeCopyEnablement", value: copyAction.enabled as string });
	}
	const pasteAction = tableDefinition.actions.find((a) => a.key === StandardActionKeys.Paste) as StandardAction | undefined;
	if (pasteAction && pasteAction.visible !== "false") {
		data.push({ key: "TreePasteEnablement", value: pasteAction.enabled as string });
	}

	return data;
}

function getDependents(
	tableProperties: TableBlockProperties,
	parameters: TableTemplatingParameters,
	variantManagement: string | undefined,
	collection: Context
): UI5Element[] {
	const id = tableProperties.contentId;
	const tableDefinition = tableProperties.tableDefinition;
	const tableType = tableProperties.tableDefinition.control.type;
	const handlerProvider = parameters.handlerProvider;

	const dependents: UI5Element[] = [];
	const createAction = tableDefinition.actions.find((a) => a.key === StandardActionKeys.Create) as StandardAction | undefined;
	const deleteAction = tableDefinition.actions.find((a) => a.key === StandardActionKeys.Delete) as StandardAction | undefined;

	if (
		tableDefinition.annotation.isInsertUpdateActionsTemplated &&
		createAction?.isTemplated === "true" &&
		tableDefinition.control.nodeType === undefined &&
		tableDefinition.control.enableUploadPlugin === false
	) {
		// The shortcut is not enabled in case of a create menu (i.e. when nodeType is defined)
		dependents.push(
			<CommandExecution
				execute={handlerProvider.getCreateButtonPressHandler(false, false)}
				visible={createAction.visible as unknown as boolean}
				enabled={createAction.enabled as unknown as boolean}
				command="Create"
			/>
		);
	}
	if (deleteAction?.isTemplated === "true") {
		dependents.push(
			<CommandExecution
				execute={handlerProvider.getDeleteButtonPressHandler(false)}
				visible={deleteAction.visible as unknown as boolean}
				enabled={deleteAction.enabled as unknown as boolean}
				command="DeleteEntry"
			/>
		);
	}

	// Move up and down actions
	const moveUpAction = tableDefinition.actions.find((a) => a.key === StandardActionKeys.MoveUp) as StandardAction | undefined;
	const moveDownAction = tableDefinition.actions.find((a) => a.key === StandardActionKeys.MoveDown) as StandardAction | undefined;
	if (
		moveUpAction &&
		moveDownAction &&
		moveUpAction.visible !== "false" &&
		moveDownAction.visible !== "false" &&
		tableType === "TreeTable"
	) {
		dependents.push(
			<CommandExecution
				execute={handlerProvider.getMoveUpDownHandler(true, false)}
				command="TableMoveElementUp"
				enabled={moveUpAction.enabled as unknown as boolean}
			/>
		);
		dependents.push(
			<CommandExecution
				execute={handlerProvider.getMoveUpDownHandler(false, false)}
				command="TableMoveElementDown"
				enabled={moveDownAction.enabled as unknown as boolean}
			/>
		);
	}

	for (const actionName in tableDefinition.commandActions) {
		const action = tableDefinition.commandActions[actionName];
		const actionCommand = getActionCommand(actionName, action, parameters, collection, tableDefinition);
		if (actionCommand) {
			dependents.push(actionCommand);
		}
	}

	if (variantManagement === "None") {
		// Persistence provider offers persisting personalization changes without variant management
		dependents.push(<PersistenceProvider id={generate([id, "PersistenceProvider"])} for={id} mode={"Transient"} />);
	}

	dependents.push(<ContextMenuSetting scope="Selection" />);

	if (tableDefinition.control.enableUploadPlugin === true) {
		dependents.push(getUploadPlugin(tableDefinition, id, handlerProvider, tableProperties.uploadConfiguration));
	}

	return dependents;
}

function getTableActionsAggregation(table: TableBlockProperties, parameters: TableTemplatingParameters): Control[] | void {
	const actions: Control[] = [];
	if (table.displaySegmentedButton) {
		actions.push(
			<ActionToolbarAction
				id={generate([table.contentId, "ContentSwitcher"])}
				layoutInformation={{ aggregationName: "end", alignment: "End" }}
			/>
		);
	}
	const fullScreenButton = getFullScreen(table);
	if (fullScreenButton) {
		actions.push(fullScreenButton);
	}
	const refreshButton = getAnalyticalRefreshButton(table, parameters.handlerProvider);
	if (refreshButton) {
		actions.push(refreshButton);
	}
	return actions.length > 0 ? actions : undefined;
}

/**
 * Returns the table actions.
 * @param table
 * @param parameters
 * @param collectionContext
 * @param collectionEntity
 * @returns The list of actions
 */
function getActions(
	table: TableBlockProperties,
	parameters: TableTemplatingParameters,
	collectionContext: Context,
	collectionEntity: EntitySet | NavigationProperty
): Control[] | undefined {
	const actions = getTableActionsTemplate(table, parameters, collectionContext, collectionEntity);

	return actions.length > 0 ? actions : undefined;
}

export function getRowSettings(
	tableDefinition: TableVisualization,
	rowActionType: TableRowActionType | undefined,
	handlerProvider: TableEventHandlerProvider
): RowSettings {
	const rowActionItem = (
		<RowActionItem type={"Navigation"} press={handlerProvider.rowPress} visible={tableDefinition.annotation.row?.visible} />
	);

	return (
		<RowSettings
			navigated={tableDefinition.annotation.row?.rowNavigated}
			highlight={tableDefinition.annotation.row?.rowHighlighting}
			highlightText={tableDefinition.annotation.row?.rowHighlighting}
		>
			{{
				rowActions: rowActionType === TableRowActionType.Navigation ? rowActionItem : undefined
			}}
		</RowSettings>
	);
}

/**
 * Generates the context menu for the table.
 * @param tableProperties
 * @param parameters
 * @param collectionEntity
 * @param rowActionType
 * @param collection
 * @param navigationInEditMode
 * @returns The context menu
 */
function getContextMenu(
	tableProperties: TableBlockProperties,
	parameters: TableTemplatingParameters,
	collectionEntity: EntitySet | NavigationProperty,
	rowActionType: TableRowActionType | undefined,
	collection: Context,
	navigationInEditMode: boolean
): Menu | undefined {
	const menuItems = getTableContextMenuTemplate(tableProperties, parameters, collection, collectionEntity);
	if (rowActionType === TableRowActionType.Navigation && !navigationInEditMode) {
		menuItems.push(getSharetoCollaborationManagerTemplate(parameters.handlerProvider, tableProperties.contentId));
		menuItems.push(getOpenInNewTabTemplate(parameters.handlerProvider));
	}
	if (menuItems.length > 0) {
		return (
			<Menu itemSelected={parameters.handlerProvider.contextMenuItemSelected}>
				{{
					items: menuItems
				}}
			</Menu>
		);
	}
	return undefined;
}

/**
 * Generates the template string for the MenuItem.
 * @param handlerProvider
 * @param tableId
 * @returns The XML string representation for the MenuItem
 */
function getSharetoCollaborationManagerTemplate(handlerProvider: TableEventHandlerProvider, tableId: string): MenuItem {
	// The visible property will be set at runtime when the collaboration manager is available and all other conditions are met
	return (
		<MenuItem
			core:require="{API: 'sap/fe/macros/Table'}"
			startsSection={true}
			id={generate([tableId, "ContextMenu", "CollaborationManager"])}
			text="{sap.fe.i18n>M_COMMON_TABLE_CONTEXT_MENU_SHARE_TO_COLLABORATION_MANAGER}"
			press={handlerProvider.contextMenuShareToCollaborationManager}
			enabled="{= ${internal>contextmenu/numberOfSelectedContexts} > 0}"
			visible={false}
		/>
	);
}

/**
 * Generates the template string for the MenuItem.
 * @param handlerProvider
 * @returns The xml string representation for the MenuItem
 */
function getOpenInNewTabTemplate(handlerProvider: TableEventHandlerProvider): MenuItem {
	// The 'Open in New Tab' action should not be visible for sticky sessions in edit mode
	// For the context menu, the visibility should also consider the 'inactiveContext' property:
	// only when at least one selected context is active (i.e. "contextmenu/inactiveContext" is false), the action should be visible in the context menu
	// The second is only relevant when the table manifest setting "creationMode" is "InlineCreationRows"
	const visible = and(
		not(and(pathInModel("/sessionOn", "internal"), UI.IsEditable)),
		not(pathInModel("contextmenu/inactiveContext", "internal"))
	);
	return (
		<MenuItem
			core:require="{API: 'sap/fe/macros/Table'}"
			startsSection={true}
			text="{sap.fe.i18n>M_COMMON_TABLE_CONTEXT_MENU_OPEN_IN_NEW_TAB}"
			press={handlerProvider.contextMenuOpenInNewTab}
			enabled={greaterThan(pathInModel("contextmenu/numberOfNavigableContexts", "internal"), 0)}
			visible={visible}
		/>
	);
}

/**
 * Generates the VariantManagement for the table.
 * @param variantManagement
 * @param id
 * @param headerLevel
 * @param handlerProvider
 * @returns The VariantManagement control
 */
function getVariantManagement(
	variantManagement: string,
	id: string,
	headerLevel: TitleLevel,
	handlerProvider: TableEventHandlerProvider
): VariantManagement | undefined {
	if (variantManagement === "Control") {
		return (
			<VariantManagement
				id={generate([id, "VM"])}
				showSetAsDefault={true}
				select={handlerProvider.variantSelected}
				headerLevel={headerLevel}
				save={handlerProvider.variantSaved}
				for={[id]}
			></VariantManagement>
		);
	}
	return undefined;
}

/**
 * Generates the QuickVariantSelection control for the table.
 * @param tableProperties The table properties
 * @returns The QuickVariantSelection control
 */
function getQuickFilter(tableProperties: TableBlockProperties): QuickFilterSelector | undefined {
	const quickFilters = tableProperties.tableDefinition.control.filters?.quickFilters;
	if (quickFilters) {
		return (
			<QuickFilterSelector
				id={generate([tableProperties.contentId, "QuickFilterContainer"])}
				paths={quickFilters.paths.map((path) => path.annotationPath)}
				showCounts={quickFilters.showCounts}
			/>
		);
	}
	return undefined;
}

/**
 * Generates CopyProvider for the table.
 * @param tableProperties
 * @returns The CopyProvider
 */
function getCopyProvider(tableProperties: TableBlockProperties): CopyProvider {
	const contextObjectPath = tableProperties.contextObjectPath;

	let visibleExpression: BindingToolkitExpression<boolean>;
	if (tableProperties.tableDefinition.control.disableCopyToClipboard) {
		visibleExpression = constant(false);
	} else if (tableProperties.tableDefinition.control.type === "TreeTable") {
		// For a TreeTable, the copy button shall be visible only when drag and drop is disabled
		if (contextObjectPath.startingEntitySet === contextObjectPath.targetEntitySet) {
			// ListReport: enable copy if the entity is not draft-enabled
			visibleExpression = constant((contextObjectPath.startingEntitySet as EntitySet).annotations.Common?.DraftRoot === undefined);
		} else {
			// ObjectPage: enable copy in read-only
			visibleExpression = not(UI.IsEditable);
		}
	} else {
		visibleExpression = constant(true);
	}

	return <CopyProvider visible={visibleExpression} />;
}

/**
 * Generates the CellSelector for the table.
 * @param tableProperties
 * @param handlerProvider
 * @returns The CellSelector
 */
function getCellSelector(tableProperties: TableBlockProperties, handlerProvider: TableEventHandlerProvider): CellSelector | undefined {
	const tableType = tableProperties.tableDefinition.control.type;
	if (
		!tableProperties.tableDefinition.control.disableCopyToClipboard &&
		tableType &&
		["ResponsiveTable", "GridTable", "TreeTable"].includes(tableType)
	) {
		return (
			<CellSelector
				enabled={or(
					tableType !== "TreeTable",
					not(getDragAndDropEnabled(tableProperties.contextObjectPath, tableProperties.tableDefinition))
				)}
				rangeLimit={200}
				selectionChange={handlerProvider.cellsSelectionHandler}
			/>
		) as CellSelector;
	}
	return undefined;
}

/**
 * Generates the CreationRow for the table.
 * @param tableProperties
 * @param handlerProvider
 * @returns The CreationRow
 */
function getCreationRow(tableProperties: TableBlockProperties, handlerProvider: TableEventHandlerProvider): CreationRow | undefined {
	if ((tableProperties.creationMode?.name as string) === CreationMode.CreationRow) {
		const creationRowAction = tableProperties.tableDefinition.actions.find((a) => a.key === StandardActionKeys.CreationRow) as
			| StandardAction
			| undefined;
		if (creationRowAction?.isTemplated) {
			const customData = createCustomDatas([
				{ key: "disableAddRowButtonForEmptyData", value: tableProperties.tableDefinition.control.disableAddRowButtonForEmptyData },
				{ key: "customValidationFunction", value: tableProperties.tableDefinition.control.customValidationFunction }
			]);

			return (
				<CreationRow
					id={generate([tableProperties.contentId, CreationMode.CreationRow])}
					visible={creationRowAction.visible as unknown as boolean}
					apply={handlerProvider.getCreateButtonPressHandler(false, true)}
					applyEnabled={creationRowAction.enabled as unknown as boolean}
				>
					{{
						customData: customData
					}}
				</CreationRow>
			);
		}
	}
	return undefined;
}

/**
 * Generates the drag and drop config for the table.
 * @param tableProperties
 * @param handlerProvider
 * @returns The drag and drop config
 */
function getDragAndDropConfig(
	tableProperties: TableBlockProperties,
	handlerProvider: TableEventHandlerProvider
): DragDropConfig | undefined {
	if (tableProperties.tableDefinition.control.type === "TreeTable") {
		return (
			<DragDropConfig
				enabled={compileExpression(getDragAndDropEnabled(tableProperties.contextObjectPath, tableProperties.tableDefinition))}
				dropPosition={tableProperties.tableDefinition.annotation.allowDropBetweenNodes === true ? "OnOrBetween" : "On"}
				draggable={true}
				droppable={true}
				dragStart={handlerProvider.dragStartDocument}
				dragEnter={handlerProvider.dragEnterDocument}
				drop={handlerProvider.dropDocument}
			/>
		);
	}
	return undefined;
}

/**
 * Generates an actionCommand for the table.
 * @param actionName The name of the action
 * @param action Action to be evaluated
 * @param parameters
 * @param collection
 * @param tableDefinition
 * @returns The actionCommand
 */
function getActionCommand(
	actionName: string,
	action: BaseAction,
	parameters: TableTemplatingParameters,
	collection: Context,
	tableDefinition: TableVisualization
): CommandExecution | undefined {
	const dataField = action.annotationPath
		? (parameters.convertedMetadata.resolvePath(action.annotationPath).target as DataFieldForAction | DataFieldForIntentBasedNavigation)
		: undefined;
	const actionContextPath = action.annotationPath
		? CommonHelper.getActionContext(parameters.metaModel.createBindingContext(action.annotationPath + "/Action")!)
		: undefined;
	const actionContext = actionContextPath ? parameters.metaModel.createBindingContext(actionContextPath) : undefined;
	const dataFieldDataModelObjectPath = actionContext ? getInvolvedDataModelObjects(actionContext, collection) : undefined;
	const isBound = (dataField as DataFieldForAction)?.ActionTarget?.isBound;
	const isOperationAvailable =
		(dataField as DataFieldForAction)?.ActionTarget?.annotations?.Core?.OperationAvailable?.valueOf() !== false;
	const displayCommandAction = action.type === "ForAction" ? isBound !== true || isOperationAvailable : true;
	if (displayCommandAction) {
		const actionParameters = {
			onExecuteAction: parameters.handlerProvider.getDataFieldForActionButtonPressHandler(
				dataField as DataFieldForAction,
				action,
				false
			),
			onExecuteIBN: parameters.handlerProvider.getDataFieldForIBNPressHandler(action, false),
			onExecuteManifest: parameters.handlerProvider.getManifestActionPressHandler(action as CustomAction, false),
			isIBNEnabled:
				action.enabled ??
				TableHelper.isDataFieldForIBNEnabled(
					{ collection: collection, tableDefinition: tableDefinition },
					dataField! as DataFieldForIntentBasedNavigation,
					!!(dataField as DataFieldForIntentBasedNavigation).RequiresContext,
					(dataField as DataFieldForIntentBasedNavigation).NavigationAvailable,
					false
				),
			isActionEnabled:
				action.enabled ??
				TableHelper.isDataFieldForActionEnabled(
					tableDefinition,
					(dataField! as DataFieldForAction).Action,
					!!isBound,
					actionContextPath,
					action.enableOnSelect,
					dataFieldDataModelObjectPath?.targetEntityType,
					false
				),
			isEnabled: action.enabled
		};
		return getCommandExecutionForAction(action.command, tableDefinition.commandActions![actionName], actionParameters);
	}
	return undefined;
}

/**
 * Generates the template string for the required modules.
 * @param tableDefinition
 * @returns The list of required modules
 */
function getCoreRequire(tableDefinition: TableVisualization): string {
	const customModules = tableDefinition.control.additionalRequiredModules ?? [];

	return `{TableRuntime: 'sap/fe/macros/table/TableRuntime', API: 'sap/fe/macros/Table'${customModules
		.map((module: string, index: number) => `, customModule${index + 1}: '${module}'`)
		.join("")}}`;
}

/**
 * Create the template for a computed column.
 * This represents the DraftIndicator and the SituationsIndicator.
 * @param tableId The table ID
 * @param column The computed column definition
 * @param collection The collection context used for context path
 * @param enableAnalytics Whether analytics are enabled
 * @returns The computed column.
 */
export function getComputedColumn(
	tableId: string,
	column: ComputedTableColumn,
	collection: Context,
	enableAnalytics: boolean | undefined
): Column | undefined {
	if (column.isDraftIndicator) {
		return (
			<Column
				id={generate([tableId, "C", "computedColumns", "draftStatus"])}
				headerVisible={false}
				propertyKey={column.name}
				header={column.label}
				tooltip={column.tooltip}
				width="3em"
			>
				<DraftIndicator
					draftIndicatorType={ObjectMarkerVisibility.IconOnly}
					contextPath={collection.getPath()}
					visible={or(not(Entity.IsActive), Entity.HasDraft)}
					usedInTable={true}
					usedInAnalyticalTable={enableAnalytics}
				/>
			</Column>
		);
	} else if (column.isSituationsIndicator) {
		return (
			<Column
				id={generate([tableId, "C", "computedColumns", "situationsIndicator"])}
				propertyKey={column.name}
				header={column.label}
				tooltip={column.tooltip}
				headerVisible={false}
				width="4em"
			>
				<SituationsIndicator contextPath={collection.getPath()} />
			</Column>
		);
	} else {
		return undefined;
	}
}

/**
 * Create the template for a slot column.
 * This column will either reuse a template control that is defined at runtime (templateId case), or define a slot where the XML content is copied.
 * @param tableId The table ID
 * @param column The slot column definition
 * @param isReadOnly Whether the table is read only
 * @param tableProperties The properties of the Table building block
 * @returns The slot column.
 */
export function getSlotColumn(
	tableId: string,
	column: CustomBasedTableColumn,
	isReadOnly: boolean | undefined,
	tableProperties: TableBlockProperties
): Column {
	let template: string | Control;
	const dependents = [];
	const columnInstance = tableProperties.columns?.find((col) => col.key === column.key);

	if (typeof column.template === "string") {
		template = column.template.startsWith("<") ? (
			column.template
		) : (
			<SlotColumn
				templateId={
					(tableProperties as unknown as TableAPI).isA?.<TableAPI>("sap.fe.macros.Table") // V4 workflow
						? (columnInstance?.getAggregation("template") as Control | undefined)?.getId?.()
						: column.template //V2 workflow
				}
			/>
		);
	} else {
		template = column.template?.clone(); // We need to clone the control: the original stays under the column block definition and the clone is used in the MDC table
	}

	const aiNotice = getColumnHeaderAiNotice(column, tableProperties);
	if (aiNotice) {
		dependents.push(aiNotice);
	}

	return (
		<Column
			id={generate([tableId, "C", column.id])}
			propertyKey={column.name}
			width={column.width}
			hAlign={column.horizontalAlign}
			header={column.header}
			tooltip={column.tooltip}
			required={isReadOnly ? undefined : column.required}
		>
			{{
				dependents,
				extendedSettings: <ResponsiveColumnSettings importance={column.importance} />,
				template: template
			}}
		</Column>
	);
}

/**
 * Create the template for the DraftIndicator.
 * @param collection The context of the collection
 * @param column The column definition
 * @returns The XML string representing the DraftIndicator.
 */
export function getDraftIndicator(collection: Context, column: AnnotationTableColumn): FormElementWrapper | undefined {
	if (
		collection.getObject("@com.sap.vocabularies.Common.v1.DraftRoot") &&
		collection.getObject("./@com.sap.vocabularies.Common.v1.SemanticKey") &&
		column.formatOptions?.fieldGroupDraftIndicatorPropertyPath
	) {
		return (
			<FormElementWrapper>
				<DraftIndicator
					draftIndicatorType={ObjectMarkerVisibility.IconAndText}
					contextPath={collection.getPath()}
					visible={getDraftIndicatorVisibleBinding(column.formatOptions?.fieldGroupName)}
					ariaLabelledBy={["this>ariaLabelledBy"]}
				/>
			</FormElementWrapper>
		);
	}
	return undefined;
}

/**
 * Create the SituationIndicator ObjectStatus.
 * @param collection The context of the collection
 * @param column The column definition
 * @returns The ObjectStatus.
 */
function getSituationIndicator(collection: Context, column: AnnotationTableColumn): ObjectStatus | undefined {
	if (
		collection.getObject("./@com.sap.vocabularies.Common.v1.SemanticKey") &&
		column.formatOptions?.fieldGroupDraftIndicatorPropertyPath
	) {
		return (
			<ObjectStatus
				visible={column.formatOptions?.showErrorObjectStatus}
				class="sapUiSmallMarginBottom"
				text="{sap.fe.i18n>Contains_Errors}"
				state="Error"
			/>
		);
	}
	return undefined;
}

/**
 * Determines the default date-time format style based on the given data field context.
 * @param dataFieldContext The context of the data field
 * @returns Returns 'short' if the underlying data field is of the type 'Edm.TimeOfDay', otherwise undefined.
 */
function getDefaultDateTimeStyle(dataFieldContext: Context): DateTimeStyle | undefined {
	const targetObject = getInvolvedDataModelObjects<DataFieldAbstractTypes>(dataFieldContext).targetObject;
	if (isDataField(targetObject) && targetObject.Value?.$target?.type === "Edm.TimeOfDay") {
		return "short";
	}
	if (
		isDataFieldForAnnotation(targetObject) &&
		hasDataPointTarget(targetObject) &&
		(targetObject.Target.$target as DataPoint)?.Value.$target.type === "Edm.TimeOfDay"
	) {
		return "short";
	}
}

/**
 * Create the template for the creation row.
 * @param tableId The table ID
 * @param column The column definition
 * @param tableType The type of the table
 * @param creationMode The creation mode
 * @param isTableReadOnly Whether the table is read only
 * @param collection The collection context
 * @param dataField The data field context
 * @param fieldMode The field mode
 * @param enableAnalytics Whether analytics are enabled
 * @param handlerProvider
 * @returns The XML string representing the creation row.
 */
function getCreationTemplate(
	tableId: string,
	column: AnnotationTableColumn,
	tableType: TableType,
	creationMode: PropertiesOf<TableCreationOptions> | undefined,
	isTableReadOnly: boolean | undefined,
	collection: Context,
	dataField: Context,
	fieldMode: string | undefined,
	enableAnalytics: boolean | undefined,
	handlerProvider: TableEventHandlerProvider
): string | undefined {
	if ((creationMode?.name as string) === "CreationRow") {
		let columnEditMode: string | undefined;
		switch (isTableReadOnly) {
			case true:
				columnEditMode = "Display";
				break;
			case false:
				columnEditMode = "Editable";
				break;
			default:
				columnEditMode = undefined;
				break;
		}
		const dataFieldObject = dataField.getObject();

		const reactiveAreaMode: "Inline" | "Overlay" | undefined = tableType === "ResponsiveTable" ? "Overlay" : undefined;

		const formatOptions = {
			fieldMode: fieldMode,
			textLinesEdit: column.formatOptions?.textLinesEdit,
			textMaxLines: column.formatOptions?.textMaxLines === undefined ? undefined : column.formatOptions?.textMaxLines,
			textMaxLength: column.formatOptions?.textMaxLength,
			textMaxCharactersDisplay: column.formatOptions?.textMaxCharactersDisplay,
			textExpandBehaviorDisplay: column.formatOptions?.textExpandBehaviorDisplay,
			textAlignMode: "Table",
			semanticKeyStyle: tableType === "ResponsiveTable" ? "ObjectIdentifier" : "Label",
			hasDraftIndicator: column.formatOptions?.hasDraftIndicator,
			fieldGroupDraftIndicatorPropertyPath: column.formatOptions?.fieldGroupDraftIndicatorPropertyPath,
			fieldGroupName: column.formatOptions?.fieldGroupName,
			showIconUrl: dataFieldObject?.Inline && !!dataFieldObject?.IconUrl,
			ignoreNavigationAvailable: enableAnalytics ?? false,
			isCurrencyOrUnitAligned: true,
			dateTimeStyle: getDefaultDateTimeStyle(dataField),
			reactiveAreaMode: reactiveAreaMode
		};

		return (
			<Field
				core:require="{TableRuntime: 'sap/fe/macros/table/TableRuntime'}"
				vhIdPrefix={generate([tableId, "TableValueHelp"])}
				editMode={columnEditMode}
				contextPath={collection.getPath()}
				metaPath={dataField.getPath()}
				wrap={tableType === "ResponsiveTable"}
				change={handlerProvider.fieldChangeInCreationRow}
				showErrorObjectStatus={column.formatOptions?.showErrorObjectStatus as unknown as boolean}
			>
				{{
					formatOptions: <FieldFormatOptions {...formatOptions} />
				}}
			</Field>
		);
	}
	return undefined;
}

/**
 * Retrieves the template for the macros:Field inside the column.
 * @param tableId The table ID
 * @param tableDefinition The table definition
 * @param column The column definition
 * @param dataFieldContext The data field context
 * @param dataFieldObjectPath The data field object path
 * @param collection The collection context
 * @param enableAnalytics Whether analytics are enabled
 * @param tableType The type of the table
 * @param isTableReadOnly Whether the table is read only
 * @param creationMode The creation mode
 * @param fieldMode The field mode
 * @param isCompactType Whether the table is compact
 * @param textAlign The text alignment
 * @param ariaLabelledBy The aria labelled by
 * @param showEmptyIndicator Whether to show the empty indicator
 * @param className
 * @param handlerProvider The handler provider
 * @param isConnectedField Indicates if the field is a connected field
 * @returns The XML string representing the field.
 */
export function getMacroFieldTemplate(
	tableId: string,
	tableDefinition: TableVisualization,
	column: AnnotationTableColumn,
	dataFieldContext: Context,
	dataFieldObjectPath: DataModelObjectPath<DataFieldAbstractTypes>,
	collection: Context,
	enableAnalytics: boolean | undefined,
	tableType: TableType,
	isTableReadOnly: boolean | undefined,
	creationMode: PropertiesOf<TableCreationOptions> | undefined,
	fieldMode: string | undefined,
	isCompactType: boolean | undefined,
	textAlign: string | undefined,
	ariaLabelledBy: string | undefined,
	showEmptyIndicator: boolean | undefined,
	className: string | undefined,
	handlerProvider: TableEventHandlerProvider,
	isConnectedField = false
): string {
	const dataFieldObject = dataFieldContext.getObject();
	let columnEditMode: string | undefined;
	switch (isTableReadOnly) {
		case true:
			columnEditMode = "Display";
			break;
		case false:
			columnEditMode = "Editable";
			break;
		default:
			columnEditMode = undefined;
	}
	if (tableDefinition.control.enableUploadPlugin && column.typeConfig?.className === "Edm.Stream") {
		columnEditMode = "Display";
	}

	const reactiveAreaMode: "Inline" | "Overlay" | undefined = tableDefinition.control.type === "ResponsiveTable" ? "Overlay" : undefined;

	const formatOptions = {
		fieldMode: fieldMode,
		textLinesEdit: column.formatOptions?.textLinesEdit,
		textMaxLines: column.formatOptions?.textMaxLines === undefined ? undefined : column.formatOptions?.textMaxLines,
		textMaxCharactersDisplay: column.formatOptions?.textMaxCharactersDisplay,
		textMaxLength: column.formatOptions?.textMaxLength,
		textExpandBehaviorDisplay: column.formatOptions?.textExpandBehaviorDisplay,
		textAlignMode: "Table",
		showEmptyIndicator: showEmptyIndicator,
		semanticKeyStyle: tableType === "ResponsiveTable" ? "ObjectIdentifier" : "Label",
		hasDraftIndicator: column.formatOptions?.hasDraftIndicator,
		fieldGroupDraftIndicatorPropertyPath: column.formatOptions?.fieldGroupDraftIndicatorPropertyPath,
		fieldGroupName: column.formatOptions?.fieldGroupName,
		showIconUrl: dataFieldObject?.Inline && !!dataFieldObject?.IconUrl,
		ignoreNavigationAvailable: enableAnalytics ?? false,
		isAnalytics: enableAnalytics,
		forInlineCreationRows: creationMode?.name === "InlineCreationRows",
		isCurrencyOrUnitAligned: isConnectedField ? false : true,
		compactSemanticKey: isCompactType === undefined ? undefined : `${isCompactType}`,
		dateTimeStyle: getDefaultDateTimeStyle(dataFieldContext),
		isAnalyticalAggregatedRow: tableDefinition.control.analyticalConfiguration?.aggregationOnLeafLevel,
		reactiveAreaMode: reactiveAreaMode,
		createAssociatedAriaLabel: isConnectedField ? true : undefined,
		imageFitType: column.formatOptions?.imageFitType,
		enableEnlargeImage: column.formatOptions?.enableEnlargeImage
	};
	let customData: CustomData | undefined;

	// In case we display a property with TextOnly text arragement in a non-analytical table, we still load the original property (using custom data)
	// to make sure intent-based navigation can use the value of the original property an not just its text representation.
	// For analytical tables, this is done by adding the original property as a context-defining property for the text property in the table converter (getExtensionInfoFromEntityType)
	if (
		tableDefinition.enableAnalytics !== true &&
		(
			dataFieldObjectPath.targetObject as DataFieldTypes | undefined
		)?.Value?.$target?.annotations?.Common?.Text?.annotations?.UI?.TextArrangement?.valueOf() === "UI.TextArrangementType/TextOnly"
	) {
		customData = createCustomData("extraProperty", `{${(dataFieldObjectPath.targetObject as DataFieldTypes).Value.path}}`);
	}

	// When cell merging is enabled, store the comparison key in a "mergeCellKey" custom data on the Field element itself.
	// sap.m.ColumnListItemRenderer calls mergeFunctionName on oCell (= the Field), so the custom data must be at this level.
	let mergeCellKeyCustomData: CustomData | undefined;
	if (column.mergeCells === true && tableDefinition.control.type === "ResponsiveTable") {
		if (column.mergeComparisonProperties?.length) {
			const parts = column.mergeComparisonProperties.map((prop) => `\${${prop}}`).join(" + '|' + ");
			mergeCellKeyCustomData = createCustomData("mergeCellKey", `{= ${parts}}`);
		} else {
			const dataField = dataFieldObjectPath.targetObject as DataFieldAbstractTypes;
			if (
				isAnnotationOfType<DataFieldForAnnotation>(dataField, UIAnnotationTypes.DataFieldForAnnotation) &&
				isAnnotationOfTerm<DataPoint>(dataField.Target.$target, UIAnnotationTerms.DataPoint)
			) {
				const dataPoint = dataField.Target.$target as DataPoint;
				const valuePath = dataPoint.Value?.path;
				if (valuePath) {
					// For DataFieldForAnnotation -> DataPoint, use the actual value property path
					mergeCellKeyCustomData = createCustomData("mergeCellKey", `{${valuePath}}`);
				}
			} else if (column.relativePath) {
				mergeCellKeyCustomData = createCustomData("mergeCellKey", `{${column.relativePath}}`);
			}
		}
	}

	return (
		<Field
			vhIdPrefix={generate([tableId, "TableValueHelp"])}
			editMode={columnEditMode}
			contextPath={collection.getPath()}
			metaPath={dataFieldContext.getPath()}
			textAlign={isConnectedField ? "Left" : textAlign}
			wrap={tableType === "ResponsiveTable"}
			class={className}
			liveChange={handlerProvider.fieldLiveChange}
			ariaLabelledBy={ariaLabelledBy ? ariaLabelledBy.split(" ") : undefined}
			navigateAfterAction={column.isNavigable}
			showErrorObjectStatus={column.formatOptions?.showErrorObjectStatus as unknown as boolean}
			disableStrictHandling={column.disableStrictHandling}
		>
			{{
				formatOptions: <FieldFormatOptions {...formatOptions} />,
				customData: [customData, mergeCellKeyCustomData].filter(Boolean) as CustomData[]
			}}
		</Field>
	);
}

/**
 * Create the template for the column.
 * @param tableId The table ID
 * @param tableProperties The table properties
 * @param column The column definition
 * @param dataFieldOP The data field object path
 * @param dataFieldContext The data field context
 * @param collection The collection context
 * @param handlerProvider The handler provider
 * @returns The XML string representing the column.
 */
function getColumnContentTemplate(
	tableId: string,
	tableProperties: TableBlockProperties,
	column: AnnotationTableColumn,
	dataFieldOP: DataModelObjectPath<DataFieldAbstractTypes>,
	dataFieldContext: Context,
	collection: Context,
	handlerProvider: TableEventHandlerProvider
): { template: string; creationTemplate?: string } {
	let template: string;
	let creationTemplate: string | undefined;

	const tableDefinition = tableProperties.tableDefinition;
	const enableAnalytics = tableProperties.tableDefinition.enableAnalytics;
	const tableType = tableProperties.tableDefinition.control.type;
	const isTableReadOnly = tableProperties.readOnly;
	const creationMode = tableProperties.creationMode;
	const fieldMode = tableProperties.fieldMode;
	const isCompactType = tableProperties.tableDefinition.control.isCompactType;

	const dataField = dataFieldOP.targetObject as DataFieldAbstractTypes;
	if (
		isAnnotationOfType<DataFieldForAnnotation>(dataField, UIAnnotationTypes.DataFieldForAnnotation) &&
		(isAnnotationOfTerm<Chart>(dataField.Target.$target, UIAnnotationTerms.Chart) ||
			isAnnotationOfTerm<PresentationVariant>(dataField.Target.$target, UIAnnotationTerms.PresentationVariant))
	) {
		const showOnlyChart = (tableType === "ResponsiveTable" ? !column.settings?.showMicroChartLabel : undefined) ?? true;
		const microChartSize = tableType === "ResponsiveTable" ? column.settings?.microChartSize ?? "XS" : "XS";
		let microChartCollection = collection
			.getModel()
			.createBindingContext(collection.getPath(dataFieldContext.getObject("Target/$AnnotationPath")));
		microChartCollection = collection.getModel().createBindingContext(CommonHelper.getNavigationContext(microChartCollection));
		//We only consider the first visualization of the PV in PV case and expect it to be a chart (similar to VisualFilters)
		template = (
			<MicroChart
				id={generate([tableId, dataField])}
				contextPath={microChartCollection.getPath()}
				metaPath={dataFieldContext
					.getModel()
					.createBindingContext(dataFieldContext.getPath() + "/Target/$AnnotationPath")
					.getPath()}
				showOnlyChart={showOnlyChart}
				size={microChartSize ?? "XS"}
				hideOnNoData={true}
				isAnalytics={enableAnalytics}
			/>
		);
	} else if (
		isAnnotationOfType<DataField>(dataField, UIAnnotationTypes.DataField) &&
		isMultiValueField(enhanceDataModelPath(dataFieldOP, dataField.Value.path))
	) {
		// when evaluating "@$ui5.context.isInactive" we are forced to add isTruthy to force the binding evaluation
		const isReadOnly = compileExpression(
			ifElse(
				or(isTableReadOnly === true, and(isTruthy(UI.IsInactive), creationMode?.name === "InlineCreationRows")),
				constant(true),
				ifElse(equal(fieldMode, "nowrapper"), constant(true), constant(undefined))
			)
		);
		if (isReadOnly === "undefined") {
			template = (
				<MultiValueFieldBlock
					contextPath={collection.getPath()}
					metaPath={dataFieldContext.getPath()}
					useParentBindingCache={tableDefinition.disableOwnRequestOnMVF}
				/>
			);
		} else {
			template = (
				<MultiValueFieldBlock
					contextPath={collection.getPath()}
					metaPath={dataFieldContext.getPath()}
					readOnly={isReadOnly}
					useParentBindingCache={tableDefinition.disableOwnRequestOnMVF}
				/>
			);
		}
	} else if (
		isAnnotationOfType<DataFieldForAnnotation>(dataField, UIAnnotationTypes.DataFieldForAnnotation) &&
		isAnnotationOfTerm<FieldGroup>(dataField.Target.$target, UIAnnotationTerms.FieldGroup)
	) {
		const fieldGroup: FieldGroup = dataField.Target.$target;
		const dataFieldCollectionContext = dataFieldContext
			.getModel()
			.createBindingContext(dataFieldContext.getPath() + "/Target/$AnnotationPath/Data");
		const fieldGroupCollectionLength = fieldGroup.Data.length - 1;

		const items = fieldGroup.Data.map((_fieldGroupDataField: DataFieldAbstractTypes, fieldGroupDataFieldIdx: number) => {
			const fieldGroupDataFieldContext = dataFieldCollectionContext
				.getModel()
				.createBindingContext(dataFieldCollectionContext.getPath() + "/" + fieldGroupDataFieldIdx);
			const fieldGroupDataFieldOP = getInvolvedDataModelObjects<DataFieldAbstractTypes>(fieldGroupDataFieldContext);
			const fieldGroupLabel = FieldHelper.computeLabelText(fieldGroupDataFieldContext.getObject(), {
				context: fieldGroupDataFieldContext
			});
			if (column.showDataFieldsLabel && !!fieldGroupLabel) {
				const resourceBundle = Library.getResourceBundleFor("sap.fe.macros")!;
				return (
					<HBox
						renderType="Bare"
						visible={getVisibleExpression(fieldGroupDataFieldOP)}
						alignItems={FieldHelper.buildExpressionForAlignItems(
							fieldGroupDataFieldContext.getObject("Target/$AnnotationPath/Visualization/$EnumMember")
						)}
					>
						<Label
							id={TableHelper.getFieldGroupLabelStableId(tableId, fieldGroupDataFieldOP)}
							text={resourceBundle.getText("HEADER_FORM_LABEL", [fieldGroupLabel])}
							class="sapUiTinyMarginEnd"
							visible={getVisibleExpression(fieldGroupDataFieldOP)}
						/>
						<VBox>
							{{
								layoutData: <FlexItemData growFactor="1" />,
								items: getMacroFieldTemplate(
									tableId,
									tableDefinition,
									column,
									fieldGroupDataFieldContext,
									fieldGroupDataFieldOP,
									collection,
									enableAnalytics,
									tableType,
									isTableReadOnly,
									creationMode,
									undefined,
									isCompactType,
									"Left",
									`${TableHelper.getColumnStableId(tableId, dataFieldOP)} ${TableHelper.getFieldGroupLabelStableId(
										tableId,
										fieldGroupDataFieldOP
									)}`,
									true,
									TableHelper.getMarginClass(
										fieldGroupDataFieldContext.getObject("Target/$AnnotationPath/Visualization/$EnumMember"),
										fieldGroupDataFieldIdx === fieldGroupCollectionLength
									),
									handlerProvider
								)
							}}
						</VBox>
					</HBox>
				);
			} else {
				return getMacroFieldTemplate(
					tableId,
					tableDefinition,
					column,
					fieldGroupDataFieldContext,
					fieldGroupDataFieldOP,
					collection,
					enableAnalytics,
					tableType,
					isTableReadOnly,
					creationMode,
					fieldMode,
					isCompactType,
					undefined,
					TableHelper.getColumnStableId(tableId, dataFieldOP),
					false,
					TableHelper.getMarginClass(
						fieldGroupDataFieldContext.getObject("Target/$AnnotationPath/Visualization/$EnumMember"),
						fieldGroupDataFieldIdx === fieldGroupCollectionLength
					),
					handlerProvider
				);
			}
		});

		const draftIndicator = getDraftIndicator(collection, column);
		if (draftIndicator) {
			items.push(draftIndicator);
		}
		const situationIndicator = getSituationIndicator(collection, column);
		if (situationIndicator) {
			items.push(situationIndicator);
		}

		template = (
			<VBox
				visible={TableHelper.getVBoxVisibility(
					dataFieldCollectionContext.getObject(),
					column.collectionFieldsHiddenExpression,
					dataFieldContext.getObject()
				)}
			>
				{{
					items: items
				}}
			</VBox>
		);
	} else if (
		isAnnotationOfType<DataFieldForAnnotation>(dataField, UIAnnotationTypes.DataFieldForAnnotation) &&
		isAnnotationOfTerm<ConnectedFields>(dataField.Target.$target, UIAnnotationTerms.ConnectedFields)
	) {
		const connectedFields: ConnectedFields = dataField.Target.$target;
		const connectedFieldsContext = dataFieldContext
			.getModel()
			.createBindingContext(dataFieldContext.getPath() + "/Target/$AnnotationPath/Data");
		const fieldsDelimiter = CommonHelper.getDelimiter(connectedFields.Template as string);
		const connectedFieldsData = getConnectedFieldsData(connectedFields);
		// Build a visibility expression that hides the entire cell when all connected field values are empty.
		// At least one field must be truthy (non-null, non-undefined, non-empty) for the cell to be visible.
		const fieldValuePaths = connectedFieldsData.map((cf) => (cf as DataField)?.Value?.path).filter(Boolean) as string[];
		const atLeastOneNonEmpty =
			fieldValuePaths.length > 0 ? or(...fieldValuePaths.map((path) => notEqual(pathInModel(path), null))) : constant(true);
		const notAllEmptyVisible = compileExpression(
			column.collectionFieldsHiddenExpression
				? and(resolveBindingString<boolean>(column.collectionFieldsHiddenExpression), atLeastOneNonEmpty)
				: atLeastOneNonEmpty
		);
		const items = connectedFieldsData.map((connectedFieldsElement: DataFieldAbstractTypes, connectedFieldsElementIdx: number) => {
			const connectedFieldsElementContext = dataFieldContext
				.getModel()
				.createBindingContext(`${connectedFieldsContext.getPath()}/${(connectedFieldsElement as DataField)?.Value?.path}`);
			const connectedFieldsElementOP = getInvolvedDataModelObjects<DataFieldAbstractTypes>(connectedFieldsElementContext);
			const fieldTemplate = getMacroFieldTemplate(
				tableId,
				tableDefinition,
				column,
				connectedFieldsElementContext,
				connectedFieldsElementOP,
				collection,
				enableAnalytics,
				tableType,
				isTableReadOnly,
				creationMode,
				undefined,
				isCompactType,
				"Left",
				`${TableHelper.getColumnStableId(tableId, dataFieldOP)}`,
				false,
				undefined,
				handlerProvider,
				true
			);

			if (connectedFieldsElementIdx < connectedFieldsData.length - 1) {
				if (tableType === "ResponsiveTable") {
					return [
						fieldTemplate,
						/*Use ObjectStatus in ResponsiveTable: its line box matches cell height,
						so the delimiter is vertically centered in both display & edit modes.*/
						<ObjectStatus
							// NBSP on both sides to keep spacing
							text={`\u00A0${fieldsDelimiter}\u00A0`}
							state="None"
						>
							{{
								// Prevent the delimiter from being squeezed to zero width on tight layouts.
								layoutData: <FlexItemData shrinkFactor={0} />
							}}
						</ObjectStatus>
					];
				}

				// Grid/Tree tables: Text works fine here (keeps baseline behavior in display, centers in edit).
				return [
					fieldTemplate,
					<Text
						// NBSP on both sides to keep spacing
						text={`\u00A0${fieldsDelimiter}\u00A0`}
						//single line
						wrapping="false"
						// actually render the NBSPs
						renderWhitespace="true"
					>
						{{
							// Avoid squeeze-to-dot effect when space is tight.
							layoutData: <FlexItemData shrinkFactor={0} />
						}}
					</Text>
				];
			} else {
				return [fieldTemplate];
			}
		});

		/* Inner container alignment:
						- ResponsiveTable: always center (better visual consistency)
						- Grid/Tree: baseline in display, center in edit (mix of Text/Input heights)*/
		const innerHBox = (
			<HBox
				wrap="NoWrap"
				alignItems={
					tableType === "ResponsiveTable"
						? "Center"
						: compileExpression(ifElse(UI.IsEditable, constant("Center"), constant("Baseline")))
				}
			>
				{{
					items: items
				}}
			</HBox>
		);

		// Outer wrapper: render a real box, take the row height, and center vertically.
		// This guarantees vertical centering of the whole connected-fields block within the cell.
		template = (
			<HBox
				wrap="NoWrap"
				renderType="Div"
				fitContainer={true}
				alignItems="Center"
				visible={notAllEmptyVisible}
				justifyContent={column.horizontalAlign}
			>
				{{
					items: [innerHBox]
				}}
			</HBox>
		);
	} else {
		template = getMacroFieldTemplate(
			tableId,
			tableDefinition,
			column,
			dataFieldContext,
			dataFieldOP,
			collection,
			enableAnalytics,
			tableType,
			isTableReadOnly,
			creationMode,
			fieldMode,
			isCompactType,
			undefined,
			undefined,
			false,
			undefined,
			handlerProvider
		);
		creationTemplate = getCreationTemplate(
			tableId,
			column,
			tableType,
			creationMode,
			isTableReadOnly,
			collection,
			dataFieldContext,
			fieldMode,
			enableAnalytics,
			handlerProvider
		);
	}

	return { template, creationTemplate };
}

/**
 * Create the template for a column.
 * @param tableId The table ID
 * @param tableProperties Table properties
 * @param column The column definition
 * @param collection The collection context used for context path
 * @param handlerProvider The handler provider
 * @returns The XML string representing the column.
 */
export function getColumnTemplate(
	tableId: string,
	tableProperties: TableBlockProperties,
	column: AnnotationTableColumn,
	collection: Context,
	handlerProvider: TableEventHandlerProvider
): Column | undefined {
	let dataFieldContext = collection.getModel().createBindingContext(column.annotationPath);
	if (!dataFieldContext) {
		return undefined;
	}
	dataFieldContext = collection.getModel().createBindingContext(FieldHelper.getDataFieldDefault(dataFieldContext));
	const dataFieldObjectModelPath = getInvolvedDataModelObjects<DataFieldAbstractTypes>(dataFieldContext, collection);
	const dataFieldObject = dataFieldContext?.getObject?.() ?? {};

	const templates = getColumnContentTemplate(
		tableId,
		tableProperties,
		column,
		dataFieldObjectModelPath,
		dataFieldContext,
		collection,
		handlerProvider
	);

	const enableAutoColumnWidth = tableProperties.enableAutoColumnWidth ?? tableProperties.tableDefinition.control.enableAutoColumnWidth;
	const widthIncludingColumnHeader = tableProperties.tableDefinition.control.widthIncludingColumnHeader;
	const tableType = tableProperties.tableDefinition.control.type;
	const isConnectedField = dataFieldObject.Target?.$AnnotationPath?.includes(UIAnnotationTerms.ConnectedFields);

	const dependents = [];
	const aiNotice = getColumnHeaderAiNotice(column, tableProperties);
	if (aiNotice) {
		dependents.push(aiNotice);
	}

	return (
		<Column
			id={TableHelper.getColumnStableId(tableId, dataFieldObjectModelPath)}
			width={
				!CommonUtils.isSmallDevice() || column.width
					? TableHelper.getColumnWidth(
							{ enableAutoColumnWidth, widthIncludingColumnHeader, tableType },
							column,
							dataFieldObject,
							TableHelper.getTextOnActionField(dataFieldObject, { context: dataFieldContext }),
							dataFieldObjectModelPath,
							true,
							{
								title: dataFieldContext.getObject("Target/$AnnotationPath/Title") || "",
								description: dataFieldContext.getObject("Target/$AnnotationPath/Title") || ""
							}
					  )
					: undefined
			}
			minWidth={
				CommonUtils.isSmallDevice()
					? TableHelper.getColumnWidth(
							{ enableAutoColumnWidth, widthIncludingColumnHeader, tableType },
							column,
							dataFieldObject,
							TableHelper.getTextOnActionField(dataFieldObject, { context: dataFieldContext }),
							dataFieldObjectModelPath,
							false,
							{
								title: dataFieldContext.getObject("Target/$AnnotationPath/Title") || "",
								description: dataFieldContext.getObject("Target/$AnnotationPath/Description") || ""
							}
					  )
					: undefined
			}
			header={column.label || column.name}
			propertyKey={column.name}
			hAlign={column.horizontalAlign || FieldHelper.getColumnAlignment(dataFieldObject, { collection: collection })}
			headerVisible={
				isConnectedField
					? true
					: TableHelper.setHeaderLabelVisibility(dataFieldObject, dataFieldContext.getObject("Target/$AnnotationPath/Data"))
			}
			tooltip={column.tooltip}
			required={tableProperties.readOnly ? undefined : column.required}
		>
			{{
				dependents,
				customData: createCustomData("showDataFieldsLabel", column.showDataFieldsLabel),
				extendedSettings: (
					<ResponsiveColumnSettings
						importance={column.importance}
						mergeFunction={
							column.mergeCells === true && tableProperties.tableDefinition.control.type === "ResponsiveTable"
								? "getMergeCellKey"
								: undefined
						}
					/>
				),
				template: templates.template,
				creationTemplate: templates.creationTemplate
			}}
		</Column>
	);
}

export function getColumnHeaderAiNotice(
	column: AnnotationTableColumn | CustomBasedTableColumn,
	tableProperties: TableBlockProperties
): ColumnAIAction | undefined {
	const aiNotice = column.aiNotice ?? tableProperties.columns?.find((col) => col.key === column.key)?.getAggregation("aiNotice");
	if (aiNotice) {
		let content: Control | Control[] | undefined;
		let contentText: string | undefined;
		let contentFragmentName: string | undefined;
		if (typeof aiNotice === "string") {
			contentText = aiNotice;
		} else {
			content = (aiNotice as ColumnAINotice).content;
			contentFragmentName = (aiNotice as ColumnAiNoticeConfiguration).contentFragmentName;
			contentText = (aiNotice as ColumnAiNoticeConfiguration).contentText;
		}
		return new ColumnAIAction({
			press: (event): void => {
				const action = event.getParameter("action") as Control;
				const domRef = action.getDomRef();
				const spaceBelow = domRef ? window.innerHeight - domRef.getBoundingClientRect().bottom : 0;
				const minPopoverHeight = parseFloat(getComputedStyle(document.documentElement).fontSize) * 10;
				ColumnHelper.generateHeaderAIPopover({
					placementType: spaceBelow >= minPopoverHeight ? PlacementType.Bottom : PlacementType.Auto,
					parent: action,
					content: Array.isArray(content) ? content.map((item: Control) => item.clone()) : content?.clone(),
					contentFragmentName,
					contentText
				});
			}
		});
	}
}

/**
 * Create the template for all the columns in the table.
 * @param tableProperties The table properties
 * @param collection The collection context used for context path
 * @param handlerProvider The handler provider
 * @returns The XML string representing the columns.
 */
function getColumns(tableProperties: TableBlockProperties, collection: Context, handlerProvider: TableEventHandlerProvider): Column[] {
	const tableId = tableProperties.contentId;
	return tableProperties.tableDefinition.columns
		.map((column) => {
			if (column.availability === "Default" && column.type === "Default") {
				Log.error("Custom columns defined in the manifest are not supported when using a table building block.");
				throw new Error("Custom columns defined in the manifest are not supported when using a table building block.");
			} else if (column.availability === "Default" && column.type === "Annotation") {
				return getColumnTemplate(tableId, tableProperties, column as AnnotationTableColumn, collection, handlerProvider);
			} else if (column.availability === "Default" && column.type === "Slot") {
				return getSlotColumn(tableId, column as CustomBasedTableColumn, tableProperties.readOnly, tableProperties);
			} else if (column.availability === "Default" && column.type === "Computed") {
				return getComputedColumn(
					tableId,
					column as ComputedTableColumn,
					collection,
					tableProperties.tableDefinition.enableAnalytics
				);
			}

			return undefined;
		})
		.filter((column) => column !== undefined);
}

export type TableBlockProperties = Omit<StrictPropertiesOf<TableAPI>, "metaPath" | "contextPath"> & {
	getTranslatedText(text: string, parameters?: unknown[], metaPath?: string): string;
	["fl:flexibility"]?: string;
};
/**
 * Determines the designtime for the MDC table.
 * @returns The value to be assigned to dt:designtime
 */
function getDesigntime(): string | undefined {
	return "sap/fe/macros/table/designtime/Table.designtime";
}

/**
 * Maps the internal P13n table mode (string) to the corresponding MDC enum.
 * @param stringMode
 * @returns The MDC enum value
 */
function getMDCP13nMode(stringMode: string): TableP13nMode {
	switch (stringMode) {
		case "Aggregate":
			return TableP13nMode.Aggregate;
		case "Sort":
			return TableP13nMode.Sort;
		case "Column":
			return TableP13nMode.Column;
		case "Filter":
			return TableP13nMode.Filter;
		case "Group":
			return TableP13nMode.Group;
		default:
			Log.error("Unknown P13n mode: " + stringMode);
			return TableP13nMode.Column;
	}
}

/**
 * Method to compute the headerVisible property.
 * @param header
 * @param tabTitle
 * @param headerVisible Boolean value to determine if the header is visible
 * @returns Expression binding for headerVisible
 */
export function buildExpressionForHeaderVisibility(
	header: string,
	tabTitle: string | undefined,
	headerVisible: boolean
): CompiledBindingToolkitExpression {
	if (tabTitle === undefined || tabTitle === "") {
		return compileExpression(constant(headerVisible));
	} else {
		const headerBindingExpression = resolveBindingString(header);
		const tabTileBindingExpression = resolveBindingString(tabTitle);
		const headerVisibleBindingExpression = constant(headerVisible);
		return compileExpression(and(headerVisibleBindingExpression, not(equal(headerBindingExpression, tabTileBindingExpression))));
	}
}

/**
 * Determines whether the row count should be shown in the table header.
 * The row count is only shown when there is an actual header title; otherwise showing just "(N)" without a label is misleading.
 * @param showRowCount The showRowCount flag from the table control configuration
 * @param header The table header/title string
 * @returns True if the row count should be shown
 */
export function getShowRowCount(showRowCount: boolean, header: string | undefined): boolean {
	return showRowCount && !!header;
}

export function getMDCTableTemplate(tableProperties: TableBlockProperties, parameters: TableTemplatingParameters): MDCTable {
	// For a TreeTable in a ListReport displaying a draft-enabled entity, we only display active instances
	const navigationInfo = tableProperties.tableDefinition.annotation?.row?.navigationInfo as {
		routePath?: string;
		navigationInEditMode?: boolean;
	};
	const target = navigationInfo?.routePath;
	let navigationInEditMode = false;
	if (target) {
		const targetInformation = parameters.appComponent.getRoutingService()._getTargetInformation(target);
		navigationInEditMode = (targetInformation?.options?.settings?.openInEditMode as boolean | undefined) ?? false;
	}

	const tableType = tableProperties.tableDefinition.control.type;
	const contextObjectPath = tableProperties.contextObjectPath;
	const filterOnActiveEntities =
		(tableType === "TreeTable" || tableProperties.tableDefinition.enableAnalytics === true) &&
		contextObjectPath.startingEntitySet === contextObjectPath.targetEntitySet &&
		ModelHelper.isObjectPathDraftSupported(contextObjectPath);
	const delegate = TableHelper.getDelegate(
		tableProperties.tableDefinition,
		tableProperties.isAlp === true,
		tableProperties.tableDefinition.annotation.entityName,
		filterOnActiveEntities
	);
	const headerVisible = tableProperties.headerVisible ?? tableProperties.tableDefinition.control.headerVisible ?? false;
	const currentHeader = tableProperties.header ?? tableProperties.tableDefinition.annotation.title;

	const headerVisibilityExpression = buildExpressionForHeaderVisibility(currentHeader ?? "", tableProperties.tabTitle, headerVisible);

	const pasteAction = tableProperties.tableDefinition.actions.find((a) => a.key === StandardActionKeys.Paste);
	const collectionEntity = parameters.convertedMetadata.resolvePath(tableProperties.tableDefinition.annotation.collection).target as
		| EntitySet
		| NavigationProperty;
	const modelContextChange = tableType === "TreeTable" ? parameters.handlerProvider.tableContextChange : undefined;
	const lineItem = TableHelper.getUiLineItemObject(parameters.metaPath, parameters.convertedMetadata) as
		| DataFieldForIntentBasedNavigation[]
		| undefined;
	const navigationPath = tableProperties.tableDefinition.annotation.navigationPath;
	if (tableProperties.tableDefinition.annotation.collection.startsWith("/") && isSingleton(contextObjectPath.startingEntitySet)) {
		tableProperties.tableDefinition.annotation.collection = navigationPath;
	}

	const collectionContext = parameters.metaModel.createBindingContext(tableProperties.tableDefinition.annotation.collection)!;
	const draft = (collectionEntity as EntitySet).annotations.Common?.DraftRoot;
	// Add the definition of the designtime file if designtime is enabled from core or locally via url parameters
	const variantManagement = tableProperties.variantManagement ?? "None";
	const designtime = getDesigntime();
	let rowActionType: TableRowActionType | undefined;
	if (tableProperties.overrideRowPress) {
		rowActionType = TableRowActionType.Navigation;
	}
	rowActionType ??=
		tableProperties.tableDefinition.annotation.row?.actionType === "Navigation" ? TableRowActionType.Navigation : undefined;

	const showCreate = tableProperties.tableDefinition.actions.find((a) => a.key === StandardActionKeys.Create)?.visible || true;

	let currentPersonalization: TableP13nMode[] | undefined;
	switch (tableProperties.personalization) {
		case "false":
			currentPersonalization = undefined;
			break;
		case "true":
			currentPersonalization = [TableP13nMode.Sort, TableP13nMode.Column, TableP13nMode.Filter];
			if (tableType === "ResponsiveTable" || tableProperties.tableDefinition.enableAnalytics === true) {
				currentPersonalization = [...currentPersonalization, TableP13nMode.Group];
			}
			break;
		case undefined:
			currentPersonalization = tableProperties.tableDefinition.annotation.p13nMode?.map((mode) => getMDCP13nMode(mode));
			break;
		default:
			// In case grouping mode is defined explicitely on the personalization, we only enable it for the analytical and responsive table.
			if (tableType === "ResponsiveTable" || tableProperties.tableDefinition.enableAnalytics === true) {
				currentPersonalization = tableProperties.personalization.split(",").map((mode) => getMDCP13nMode(mode.trim()));
			} else {
				const excludeGroupFromP13n = tableProperties.personalization
					.split(",")
					.filter((mode) => getMDCP13nMode(mode.trim()) !== TableP13nMode.Group) as TableP13nMode[];
				currentPersonalization = excludeGroupFromP13n.length ? excludeGroupFromP13n : undefined;
			}
	}

	const multiSelectDisabledActions = ActionHelper.getMultiSelectDisabledActions(lineItem);

	const customData = [
		{ key: "kind", value: collectionEntity._type },
		{ key: "navigationPath", value: navigationPath },
		{ key: "enableAnalytics", value: tableProperties.tableDefinition.enableAnalytics },
		{ key: "creationMode", value: tableProperties.creationMode?.name },
		{ key: "inlineCreationRowCount", value: tableProperties.tableDefinition.control.inlineCreationRowCount },
		{ key: "showCreate", value: showCreate },
		{ key: "createAtEnd", value: tableProperties.creationMode?.createAtEnd },
		{ key: "displayModePropertyBinding", value: tableProperties.readOnly },
		{ key: "tableType", value: tableType },
		{ key: "targetCollectionPath", value: collectionContext.getPath() },
		{ key: "entityType", value: collectionContext.getPath() + "/" },
		{ key: "metaPath", value: collectionContext.getPath() },
		{ key: "hiddenFilters", value: tableProperties.tableDefinition.control.filters?.hiddenFilters },
		{ key: "requestGroupId", value: "$auto.Workers" },
		{ key: "disableCopyToClipboard", value: tableProperties.tableDefinition.control.disableCopyToClipboard },
		{ key: "draft", value: draft },
		{ key: "navigationAvailableMap", value: TableHelper.getNavigationAvailableMap(lineItem) },
		{
			key: "actionsMultiselectDisabled",
			value: multiSelectDisabledActions.length > 0 ? multiSelectDisabledActions.join(",") : undefined
		},
		{ key: "exportRequestSize", value: tableProperties.tableDefinition.control.exportRequestSize },
		...getCustomDataForClipboardActions(tableProperties)
	];
	let rowPressHandler;
	if (tableType === "ResponsiveTable") {
		rowPressHandler = parameters.handlerProvider.rowPress ? parameters.handlerProvider.noop : undefined;
	}
	return (
		<MDCTable
			core:require={getCoreRequire(tableProperties.tableDefinition)}
			fl:flexibility={tableProperties["fl:flexibility"]}
			sortConditions={tableProperties.tableDefinition.annotation.sortConditions}
			groupConditions={tableProperties.tableDefinition.annotation.groupConditions}
			aggregateConditions={tableProperties.tableDefinition.annotation.aggregateConditions}
			dt:designtime={designtime}
			id={tableProperties.contentId}
			busyIndicatorDelay={0}
			enableExport={tableProperties.tableDefinition.control.enableExport}
			delegate={JSON.parse(delegate)}
			rowPress={rowPressHandler}
			beforeOpenContextMenu={parameters.handlerProvider.beforeOpenContextMenu}
			autoBindOnInit={tableProperties.useBasicSearch || !tableProperties.filterBar}
			selectionMode={tableProperties.tableDefinition.annotation.selectionMode || "None"}
			selectionChange={parameters.handlerProvider.selectionChange}
			showRowCount={getShowRowCount(tableProperties.tableDefinition.control.showRowCount, currentHeader)}
			header={currentHeader}
			headerVisible={headerVisibilityExpression}
			headerLevel={tableProperties.headerLevel}
			headerStyle={tableProperties.headerStyle}
			threshold={tableProperties.tableDefinition.control.threshold ?? tableProperties.tableDefinition.annotation.threshold}
			p13nMode={currentPersonalization}
			paste={parameters.handlerProvider.getPasteHandler(false)}
			beforeExport={parameters.handlerProvider.beforeExport}
			class={tableProperties.tableDefinition.control.useCondensedTableLayout === true ? "sapUiSizeCondensed" : undefined}
			multiSelectMode={tableProperties.tableDefinition.control.multiSelectMode}
			showPasteButton={tableType === "TreeTable" ? false : pasteAction?.visible}
			enablePaste={tableType === "TreeTable" ? false : pasteAction?.enabled}
			modelContextChange={modelContextChange}
		>
			{{
				customData: createCustomDatas(customData),
				dataStateIndicator: getDataStateIndicator(parameters.handlerProvider),
				type: getTableType(
					tableProperties.tableDefinition,
					collectionContext,
					tableType,
					tableProperties.tableDefinition.control.selectionLimit
				),
				dependents: getDependents(tableProperties, parameters, variantManagement, collectionContext),
				actions: getActions(tableProperties, parameters, collectionContext, collectionEntity),
				tableActions: getTableActionsAggregation(tableProperties, parameters),
				rowSettings: getRowSettings(tableProperties.tableDefinition, rowActionType, parameters.handlerProvider),
				contextMenu: getContextMenu(
					tableProperties,
					parameters,
					collectionEntity,
					rowActionType,
					collectionContext,
					navigationInEditMode
				),
				columns: getColumns(tableProperties, collectionContext, parameters.handlerProvider),
				dragDropConfig: getDragAndDropConfig(tableProperties, parameters.handlerProvider),
				creationRow: getCreationRow(tableProperties, parameters.handlerProvider),
				variant: getVariantManagement(
					variantManagement,
					tableProperties.contentId,
					tableProperties.headerLevel,
					parameters.handlerProvider
				),
				quickFilter: getQuickFilter(tableProperties),
				copyProvider: getCopyProvider(tableProperties),
				cellSelector: getCellSelector(tableProperties, parameters.handlerProvider)
			}}
		</MDCTable>
	);
}
