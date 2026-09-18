import type { EntitySet, NavigationProperty } from "@sap-ux/vocabularies-types";
import {
	type DataFieldForAction,
	type DataFieldForIntentBasedNavigation,
	type DataFieldTypes
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, getExpressionFromAnnotation, isConstant, isPathInModelExpression } from "sap/fe/base/BindingToolkit";
import { type BaseAction, type CustomAction } from "sap/fe/core/converters/controls/Common/Action";
import FPMHelper from "sap/fe/core/helpers/FPMHelper";
import { type DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { formatValueRecursively } from "sap/fe/macros/field/FieldTemplating";
import type TableAPI from "sap/fe/macros/Table";
import BindingInfo from "sap/ui/base/BindingInfo";
import type UI5Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import type Message from "sap/ui/core/message/Message";
import type V4Context from "sap/ui/model/odata/v4/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import CommonHelper from "../CommonHelper";
import type Field from "../Field";
import TableHelper from "./TableHelper";
import TableRuntime from "./TableRuntime";
import UploadTableRuntime from "./uploadTable/UploadTableRuntime";

export type EventHandlerType = (e: UI5Event) => void;

// maximum number of items to share to Collaboration Manager simultanously
const selectionLimitForShareToCollaborationManager = 1;
// maximum number of items to open in new tabs simultanously
const selectionLimitForOpenInNewTab = 10;

export default class TableEventHandlerProvider {
	addCardToInsightsPress!: EventHandlerType;

	analyticalRefreshPress?: EventHandlerType;

	beforeExport!: EventHandlerType;

	beforeOpenContextMenu!: EventHandlerType;

	cellsSelectionHandler!: EventHandlerType;

	collapseNode?: EventHandlerType;

	contextMenuItemSelected!: EventHandlerType;

	contextMenuOpenInNewTab?: EventHandlerType;

	contextMenuShareToCollaborationManager: EventHandlerType | undefined;

	dataStateChange!: EventHandlerType;

	dataStateIndicatorFilter?: (message: Message, control: Control) => boolean;

	dragStartDocument?: EventHandlerType;

	dragEnterDocument?: EventHandlerType;

	dropDocument?: EventHandlerType;

	expandNode?: EventHandlerType;

	fieldChangeInCreationRow?: typeof Field.prototype.change;

	fieldLiveChange?: EventHandlerType;

	rowPress?: EventHandlerType;

	noop?: EventHandlerType;

	segmentedButtonPress?: EventHandlerType;

	selectionChange!: EventHandlerType;

	tableContextChange?: EventHandlerType;

	uploadCompleted!: EventHandlerType;

	uploadFileNameLengthExceeded!: EventHandlerType;

	uploadFileSizeExceeded!: EventHandlerType;

	uploadItemValidationHandler!: Function;

	uploadMediaTypeMismatch!: EventHandlerType;

	variantSaved?: EventHandlerType;

	variantSelected?: EventHandlerType;

	private metaModel: ODataMetaModel;

	private collectionEntity: EntitySet | NavigationProperty;

	constructor(
		private tableAPI: TableAPI,
		settings: { collectionEntity: EntitySet | NavigationProperty; metaModel: ODataMetaModel }
	) {
		this.collectionEntity = settings.collectionEntity;
		this.metaModel = settings.metaModel;

		this.initializeHandlers(tableAPI);
	}

	/**
	 * Initializes the event handler properties with functions.
	 * @param tableAPI
	 */
	private initializeHandlers(tableAPI: TableAPI): void {
		const tableType = this.tableAPI.tableDefinition?.control?.type;

		this.addCardToInsightsPress = tableAPI.onAddCardToInsightsPressed.bind(tableAPI);
		this.analyticalRefreshPress =
			this.tableAPI.tableDefinition.control.enableAnalyticalEdit === true
				? tableAPI.onAnalyticalRefreshPress.bind(tableAPI)
				: undefined;
		this.beforeExport = tableAPI.onBeforeExport.bind(tableAPI);
		this.beforeOpenContextMenu = tableAPI.onContextMenuPress.bind(tableAPI);
		this.cellsSelectionHandler = tableAPI.pasteEnablementHandler.bind(tableAPI);
		this.collapseNode =
			tableType === "TreeTable"
				? (e: UI5Event): void => {
						tableAPI.onCollapseExpandNode(e, false);
				  }
				: undefined;
		this.contextMenuItemSelected = TableRuntime.onContextMenuItemSelected.bind(TableRuntime);

		const rowNavigationInfo = this.tableAPI.tableDefinition?.annotation.row?.navigationInfo;
		if (rowNavigationInfo !== undefined || this.tableAPI.overrideRowPress) {
			if (rowNavigationInfo?.type === "Outbound") {
				this.contextMenuOpenInNewTab = (_e: UI5Event): void => {
					const controller = tableAPI.getPageController();
					const internalContext = tableAPI.getBindingContext("internal");
					controller?.onOpenInNewTabNavigateOutBound?.(
						rowNavigationInfo.navigationTarget,
						internalContext?.getProperty("contextmenu/selectedContexts"),
						"",
						selectionLimitForOpenInNewTab,
						rowNavigationInfo.targetControlId
					);
				};
			} else {
				this.contextMenuShareToCollaborationManager = (e: UI5Event): void => {
					const controller = tableAPI.getPageController()!;
					const internalContext = tableAPI.getBindingContext("internal");
					tableAPI.onShareToCollaborationManagerPress(
						e,
						controller,
						internalContext?.getProperty("contextmenu/selectedContexts"),
						selectionLimitForShareToCollaborationManager
					);
				};
				this.contextMenuOpenInNewTab = (e: UI5Event): void => {
					const controller = tableAPI.getPageController()!;
					const internalContext = tableAPI.getBindingContext("internal");
					tableAPI.onOpenInNewTabPress(
						e,
						controller,
						internalContext?.getProperty("contextmenu/selectedContexts"),
						internalContext?.getProperty("contextmenu/navigableContexts"),
						{
							callExtension: true,
							targetPath: rowNavigationInfo?.targetPath ?? "",
							navMode: "openInNewTab",
							targetControlId: rowNavigationInfo?.targetControlId
						},
						selectionLimitForOpenInNewTab
					);
				};
			}
		}

		this.dataStateChange = tableAPI.onDataStateChange.bind(tableAPI);
		this.dataStateIndicatorFilter = tableAPI.dataStateIndicatorFilter.bind(tableAPI);

		this.dragStartDocument = tableType === "TreeTable" ? (tableAPI.onDragStartDocument.bind(tableAPI) as EventHandlerType) : undefined;
		this.dragEnterDocument = tableType === "TreeTable" ? (tableAPI.onDragEnterDocument.bind(tableAPI) as EventHandlerType) : undefined;
		this.dropDocument = tableType === "TreeTable" ? (tableAPI.onDropDocument.bind(tableAPI) as EventHandlerType) : undefined;
		this.expandNode =
			tableType === "TreeTable"
				? (e: UI5Event): void => {
						tableAPI.onCollapseExpandNode(e, true);
				  }
				: undefined;

		this.fieldChangeInCreationRow = (e): void => {
			TableRuntime.onFieldChangeInCreationRow(e, !!this.tableAPI.tableDefinition.control.customValidationFunction);
		};
		this.fieldLiveChange =
			this.tableAPI.creationMode?.name === "InlineCreationRows" ? tableAPI.onFieldLiveChange.bind(tableAPI) : undefined;
		this.rowPress = tableAPI.onTableRowPress.bind(tableAPI);
		this.noop = tableAPI.onNoop.bind(tableAPI);
		this.segmentedButtonPress = tableAPI.onSegmentedButtonPressed.bind(tableAPI);
		this.selectionChange = tableAPI.onSelectionChanged.bind(tableAPI);
		this.tableContextChange =
			tableType === "TreeTable"
				? (e: UI5Event): void => {
						TableRuntime.onTreeTableContextChanged(e, this.tableAPI.tableDefinition?.annotation?.initialExpansionLevel);
				  }
				: undefined;

		this.uploadCompleted = UploadTableRuntime.onUploadCompleted.bind(UploadTableRuntime) as EventHandlerType;
		this.uploadFileNameLengthExceeded = UploadTableRuntime.onFileNameLengthExceeded.bind(UploadTableRuntime) as EventHandlerType;
		this.uploadFileSizeExceeded = UploadTableRuntime.onFileSizeExceeded.bind(UploadTableRuntime) as EventHandlerType;
		this.uploadItemValidationHandler = UploadTableRuntime.uploadFile.bind(UploadTableRuntime);
		this.uploadMediaTypeMismatch = UploadTableRuntime.onMediaTypeMismatch.bind(UploadTableRuntime) as EventHandlerType;
		this.variantSaved = tableAPI.onVariantSaved.bind(tableAPI);
		this.variantSelected = tableAPI.onVariantSelected.bind(tableAPI);
	}

	/**
	 * Gets the press event handler for the Create button.
	 * @param forContextMenu
	 * @param forCreationRow
	 * @returns The event handler.
	 */
	getCreateButtonPressHandler(forContextMenu: boolean, forCreationRow: boolean): EventHandlerType {
		return forCreationRow
			? TableRuntime.onCreateButtonPress.bind(TableRuntime)
			: (e: UI5Event): void => {
					const internalContext = this.tableAPI.getBindingContext("internal");
					const path = forContextMenu ? "contextmenu/selectedContexts" : "selectedContexts";
					TableRuntime.onCreateButtonPress(e, internalContext?.getProperty(path));
			  };
	}

	/**
	 * Gets the press event handler for the Create menu item.
	 * @param index
	 * @param forContextMenu
	 * @returns The event handler.
	 */
	getCreateMenuItemPressHandler(index: number, forContextMenu: boolean): EventHandlerType {
		const path = forContextMenu ? "contextmenu/selectedContexts" : "selectedContexts";
		return (e: UI5Event): void => {
			TableRuntime.onCreateMenuItemPress(e, index, this.tableAPI.getBindingContext("internal")?.getProperty(path));
		};
	}

	/**
	 * Gets the event handler for the Cut action.
	 * @param forContextMenu
	 * @returns The event handler.
	 */
	getCutHandler(forContextMenu: boolean): EventHandlerType {
		return (): void => {
			this.tableAPI.onCut(forContextMenu);
		};
	}

	/**
	 * Gets the event handler for the Copy action.
	 * @param forContextMenu
	 * @returns The event handler.
	 */
	getCopyHandler(forContextMenu: boolean): EventHandlerType {
		return (): void => {
			this.tableAPI.onCopy(forContextMenu);
		};
	}

	/**
	 * Gets the press event handler for an action button.
	 * @param dataField
	 * @param action
	 * @param forContextMenu
	 * @returns The event handler.
	 */
	getDataFieldForActionButtonPressHandler(
		dataField: DataFieldForAction | undefined,
		action: BaseAction,
		forContextMenu: boolean
	): EventHandlerType | undefined {
		if (!dataField) {
			return undefined;
		}

		const actionContextPath = action.annotationPath
			? CommonHelper.getActionContext(this.metaModel.createBindingContext(action.annotationPath + "/Action")!)
			: undefined;
		const actionContext = actionContextPath ? this.metaModel.createBindingContext(actionContextPath) : undefined;

		const actionName = dataField.Action;
		const targetEntityTypeName = this.tableAPI.contextObjectPath.targetEntityType.fullyQualifiedName;
		const isStaticAction =
			typeof actionContext?.getObject() !== "string" &&
			(TableHelper._isStaticAction(actionContext?.getObject(), actionName) ||
				TableHelper._isActionOverloadOnDifferentType(actionName.toString(), targetEntityTypeName));
		const applicablePropertyPath = !forContextMenu ? "aApplicable" : "aApplicableForContextMenu";
		const notApplicablePropertyPath = !forContextMenu ? "aNotApplicable" : "aNotApplicableForContextMenu";
		const contextMenuPath = !forContextMenu ? "" : "contextmenu/";

		return (e: UI5Event): void => {
			const internalContext = this.tableAPI.getBindingContext("internal")!;
			const params = {
				contexts: !isStaticAction ? internalContext.getProperty(`${contextMenuPath}selectedContexts`) : null,
				bStaticAction: isStaticAction ? isStaticAction : undefined,
				entitySetName: this.collectionEntity.name,
				applicableContexts: !isStaticAction
					? internalContext.getProperty(`dynamicActions/${dataField.Action}/${applicablePropertyPath}/`)
					: null,
				notApplicableContexts: !isStaticAction
					? internalContext.getProperty(`dynamicActions/${dataField.Action}/${notApplicablePropertyPath}/`)
					: null,
				isNavigable: action.isNavigable,
				enableAutoScroll: action.enableAutoScroll,
				defaultValuesExtensionFunction: action.defaultValuesExtensionFunction,
				invocationGrouping: dataField?.InvocationGrouping === "UI.OperationGroupingType/ChangeSet" ? "ChangeSet" : "Isolated",
				controlId: this.tableAPI.contentId,
				operationAvailableMap: this.tableAPI.tableDefinition.operationAvailableMap,
				label: dataField.Label?.valueOf() ?? "",
				model: this.tableAPI.getPageController().getModel(),
				disableStrictHandling: action.disableStrictHandling
			};
			this.tableAPI?.onActionPress(e, this.tableAPI.getPageController(), dataField.Action.valueOf(), params);
		};
	}

	/**
	 * Gets the press event handler for an IBN action.
	 * @param action
	 * @param forContextMenu
	 * @returns The event handler.
	 */
	getDataFieldForIBNPressHandler(action: BaseAction, forContextMenu: boolean): EventHandlerType | undefined {
		if (action.annotationPath === undefined) {
			return undefined;
		}
		const dataFieldContext = this.metaModel.createBindingContext(action.annotationPath);
		const dataField = dataFieldContext?.getObject() as DataFieldForIntentBasedNavigation | undefined;
		if (!dataField) {
			return undefined;
		}
		const navigateWithConfirmationDialog = this.tableAPI.tableDefinition.enableAnalytics !== true;

		return (e: UI5Event): void => {
			const internalContext = this.tableAPI.getBindingContext("internal")!;
			const navigationParameters: {
				navigationContexts?: V4Context[];
				label?: string;
				applicableContexts?: V4Context[];
				notApplicableContexts?: V4Context[];
				semanticObjectMapping?: object;
			} = {};

			navigationParameters.navigationContexts = forContextMenu
				? internalContext.getProperty("contextmenu/selectedContexts")
				: internalContext.getProperty("selectedContexts");

			if (dataField.RequiresContext && !dataField.Inline && navigateWithConfirmationDialog) {
				const applicableProperty = !forContextMenu ? "aApplicable" : "aApplicableForContextMenu";
				const notApplicableProperty = !forContextMenu ? "aNotApplicable" : "aNotApplicableForContextMenu";
				navigationParameters.applicableContexts = internalContext.getProperty(
					`ibn/${dataField.SemanticObject}-${dataField.Action}/${applicableProperty}/`
				);
				navigationParameters.notApplicableContexts = internalContext.getProperty(
					`ibn/${dataField.SemanticObject}-${dataField.Action}/${notApplicableProperty}/`
				);
				navigationParameters.label = dataField.Label as string;
			}
			navigationParameters.semanticObjectMapping = dataField.Mapping;
			const controller = this.tableAPI.getPageController();
			if (navigateWithConfirmationDialog) {
				controller?._intentBasedNavigation.navigateWithConfirmationDialog(
					dataField.SemanticObject as unknown as string,
					dataField.Action as unknown as string,
					navigationParameters,
					e.getSource<Control>()
				);
			} else {
				controller?._intentBasedNavigation.navigate(
					dataField.SemanticObject as unknown as string,
					dataField.Action as unknown as string,
					navigationParameters,
					e.getSource<Control>()
				);
			}
		};
	}

	private getExpressionForDataFieldValue(
		dataField: DataFieldTypes | undefined,
		fullContextPath: DataModelObjectPath<unknown>
	): string | CompiledBindingToolkitExpression | undefined {
		const value = dataField?.Value;
		if (!value) {
			return undefined;
		}

		if (typeof value === "string") {
			return value;
		} else {
			const expression = getExpressionFromAnnotation(value);
			if (isConstant(expression) || isPathInModelExpression(expression)) {
				const valueExpression = formatValueRecursively(expression, fullContextPath);
				return compileExpression(valueExpression);
			}
		}
	}

	/**
	 * Gets the press event handler for the Delete button.
	 * @param forContextMenu
	 * @returns The event handler.
	 */
	getDeleteButtonPressHandler(forContextMenu: boolean): EventHandlerType {
		const headerInfo = ((this.collectionEntity as EntitySet)?.entityType || (this.collectionEntity as NavigationProperty)?.targetType)
			?.annotations?.UI?.HeaderInfo;

		const contextMenuPath = !forContextMenu ? "" : "contextmenu/";
		const deletableContextsPath = `${contextMenuPath}deletableContexts`;
		const selectedContextsPath = `${contextMenuPath}selectedContextsIncludingInactive`;
		const numberOfSelectedContextsPath = !forContextMenu
			? `numberOfSelectedContexts`
			: `${contextMenuPath}numberOfSelectedContextsForDelete`;
		const unSavedContextsPath = `${contextMenuPath}unSavedContexts`;
		const lockedContextsPath = `${contextMenuPath}lockedContexts`;
		const draftsWithDeletableActivePath = `${contextMenuPath}draftsWithDeletableActive`;
		const draftsWithNonDeletableActivePath = `${contextMenuPath}draftsWithNonDeletableActive`;

		const titleExpression = this.getExpressionForDataFieldValue(headerInfo?.Title as DataFieldTypes, this.tableAPI.contextObjectPath);
		const descriptionExpression = this.getExpressionForDataFieldValue(
			headerInfo?.Description as DataFieldTypes,
			this.tableAPI.contextObjectPath
		);
		let description;
		if (typeof descriptionExpression === "string" && descriptionExpression.startsWith("{")) {
			description = BindingInfo.parse(descriptionExpression);
		} else {
			description = descriptionExpression;
		}

		return (_e: UI5Event): void => {
			const internalContext = this.tableAPI.getBindingContext("internal");
			const params = {
				id: this.tableAPI.contentId,
				numberOfSelectedContexts: internalContext?.getProperty(numberOfSelectedContextsPath) as number,
				unSavedContexts: internalContext?.getProperty(unSavedContextsPath) as V4Context[],
				lockedContexts: internalContext?.getProperty(lockedContextsPath) as V4Context[],
				draftsWithDeletableActive: internalContext?.getProperty(draftsWithDeletableActivePath) as V4Context[],
				draftsWithNonDeletableActive: internalContext?.getProperty(draftsWithNonDeletableActivePath) as V4Context[],
				controlId: internalContext?.getProperty("controlId"),
				title: titleExpression,
				description,
				selectedContexts: internalContext?.getProperty(selectedContextsPath) as V4Context[]
			};
			this.tableAPI
				.getPageController()
				?.editFlow.deleteMultipleDocuments(internalContext?.getProperty(deletableContextsPath), params);
		};
	}

	/**
	 * Get the press event handler for a manifest action button.
	 * @param action
	 * @param forContextMenu
	 * @returns The event handler.
	 */
	getManifestActionPressHandler(action: CustomAction, forContextMenu: boolean): EventHandlerType | undefined {
		if (action.noWrap === true) {
			// If noWrap = true, then the action is a slot action (defined in the XML view as an aggregation of the table block)
			const relatedActionElement = this.tableAPI.findSlotActionFromKey(action.key);
			if (relatedActionElement) {
				return (e: UI5Event): void => {
					const internalModelPath = forContextMenu ? "contextmenu/selectedContexts" : "selectedContexts";
					const internalContext = this.tableAPI.getBindingContext("internal")!;
					const eventParameters = { ...e.getParameters(), contexts: internalContext.getProperty(internalModelPath) };
					relatedActionElement.fireEvent("press", eventParameters);
				};
			} else {
				Log.error("Couldn't find action with key " + action.key);
				return undefined;
			}
		} else {
			return (e: UI5Event): void => {
				const internalModelPath = forContextMenu ? "contextmenu/selectedContexts" : "selectedContexts";
				const internalContext = this.tableAPI.getBindingContext("internal")!;
				FPMHelper.actionWrapper(e, action.handlerModule, action.handlerMethod, {
					contexts: internalContext.getProperty(internalModelPath)
				}).catch((err) => {
					Log.error("Error while executing custom action", err);
				});
			};
		}
	}

	/**
	 * Get the press event handler for the mass edit button.
	 * @param forContextMenu
	 * @returns The event handler.
	 */
	getMassEditButtonPressHandler(forContextMenu: boolean): EventHandlerType {
		return (e: UI5Event): void => {
			this.tableAPI.onMassEditButtonPressed(e, forContextMenu);
		};
	}

	/**
	 * Get the press event handler for the move up / move down buttons.
	 * @param forMoveUp
	 * @param forContextMenu
	 * @returns The event handler.
	 */
	getMoveUpDownHandler(forMoveUp: boolean, forContextMenu: boolean): EventHandlerType {
		return (e: UI5Event): void => {
			this.tableAPI.onMoveUpDown(e, forMoveUp, forContextMenu);
		};
	}

	/**
	 * Gets the event handler for the Paste action.
	 * @param forContextMenu
	 * @returns The event handler.
	 */
	getPasteHandler(forContextMenu: boolean): EventHandlerType {
		const controller = this.tableAPI.getPageController();
		return (e: UI5Event): void => {
			this.tableAPI.onPaste(e, controller, forContextMenu);
		};
	}
}
