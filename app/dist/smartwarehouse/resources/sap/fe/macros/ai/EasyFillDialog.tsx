import type { EntityType, Property } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import { and, equal, isEmpty, not } from "sap/fe/base/BindingToolkit";
import type { EnhanceWithUI5, PropertiesOf } from "sap/fe/base/ClassSupport";
import { createReference, defineReference, defineUI5Class, property } from "sap/fe/base/ClassSupport";
import type { Ref } from "sap/fe/base/jsx-runtime/jsx";
import AINotice from "sap/fe/controls/AINotice";
import type { FEView } from "sap/fe/core/BaseController";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import type { FieldSideEffectDictionary } from "sap/fe/core/controllerextensions/SideEffects";
import { CollaborationUtils } from "sap/fe/core/controllerextensions/collaboration/CollaborationCommon";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import type { DefinitionPage } from "sap/fe/core/definition/FEDefinition";
import { getLabel, isComputed, isImmutable } from "sap/fe/core/templating/PropertyHelper";
import Field from "sap/fe/macros/Field";
import type TableAPI from "sap/fe/macros/Table";
import { EasyFillLayoutMode } from "sap/fe/macros/ai/EasyFillLayoutMode";
import { fetchTableData, getTables, isGridSourceTable, type TableColumnDescriptor } from "sap/fe/macros/ai/EasyFillTableHelper";
import { resolveTokenValue } from "sap/fe/macros/ai/EasyFilterDataFetcher";
import { triggerPXIntegration } from "sap/fe/macros/ai/PXFeedback";
import type { FieldFormBuilderContext } from "sap/fe/macros/ai/easyfill/FieldFormBuilder";
import * as EasyFillFieldFormBuilder from "sap/fe/macros/ai/easyfill/FieldFormBuilder";
import * as EasyFillFieldHelper from "sap/fe/macros/ai/easyfill/FieldHelper";
import * as EasyFillObjectPageHelper from "sap/fe/macros/ai/easyfill/ObjectPageHelper";
import type { ReviewAreaContext } from "sap/fe/macros/ai/easyfill/ReviewAreaBuilder";
import * as EasyFillReviewAreaBuilder from "sap/fe/macros/ai/easyfill/ReviewAreaBuilder";
import type { TablePreviewContext } from "sap/fe/macros/ai/easyfill/TableViewBuilder";
import * as EasyFillTableViewBuilder from "sap/fe/macros/ai/easyfill/TableViewBuilder";
import ValueListHelper, { type ValueListInfo } from "sap/fe/macros/internal/valuehelp/ValueListHelper";
import type { Button$PressEvent } from "sap/m/Button";
import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import FlexBox from "sap/m/FlexBox";
import FlexItemData from "sap/m/FlexItemData";
import FormattedText from "sap/m/FormattedText";
import GenericTag from "sap/m/GenericTag";
import HBox from "sap/m/HBox";
import IllustratedMessage from "sap/m/IllustratedMessage";
import IllustratedMessageSize from "sap/m/IllustratedMessageSize";
import IllustratedMessageType from "sap/m/IllustratedMessageType";
import type InputBase from "sap/m/InputBase";
import MessageStrip from "sap/m/MessageStrip";
import MessageToast from "sap/m/MessageToast";
import OverflowToolbar from "sap/m/OverflowToolbar";
import ScrollContainer from "sap/m/ScrollContainer";
import type { SegmentedButton$SelectionChangeEvent } from "sap/m/SegmentedButton";
import SegmentedButton from "sap/m/SegmentedButton";
import SegmentedButtonItem from "sap/m/SegmentedButtonItem";
import Table from "sap/m/Table";
import Text from "sap/m/Text";
import TextArea from "sap/m/TextArea";
import Title from "sap/m/Title";
import ToggleButton from "sap/m/ToggleButton";
import ToolbarSpacer from "sap/m/ToolbarSpacer";
import VBox from "sap/m/VBox";
import { ButtonType, FlexDirection, FlexWrap, PlacementType } from "sap/m/library";
import type UI5Event from "sap/ui/base/Event";
import type { Control$ValidateFieldGroupEvent } from "sap/ui/core/Control";
import type UI5Element from "sap/ui/core/Element";
import Element from "sap/ui/core/Element";
import InvisibleText from "sap/ui/core/InvisibleText";
import Lib from "sap/ui/core/Lib";
import { TitleLevel, ValueState } from "sap/ui/core/library";
import PaneContainer from "sap/ui/layout/PaneContainer";
import ResponsiveSplitter from "sap/ui/layout/ResponsiveSplitter";
import SplitPane from "sap/ui/layout/SplitPane";
import SplitterLayoutData from "sap/ui/layout/SplitterLayoutData";
import Form from "sap/ui/layout/form/Form";
import type MDCTable from "sap/ui/mdc/Table";
import type Context from "sap/ui/model/Context";
import FilterOperator from "sap/ui/model/FilterOperator";
import type V4Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import FESRHelper from "sap/ui/performance/trace/FESRHelper";
import ObjectPageDynamicHeaderTitle from "sap/uxap/ObjectPageDynamicHeaderTitle";
import ObjectPageLayout from "sap/uxap/ObjectPageLayout";
import ObjectPageSection from "sap/uxap/ObjectPageSection";
import ObjectPageSubSection from "sap/uxap/ObjectPageSubSection";
import type { FieldMetadata, FieldValues } from "ux/eng/fioriai/reuse/easyfill/EasyFill";

const MAX_LENGTH = 2000;
const INNER_CONTROL_RENDER_DELAY_MS = 200;
// MDC composite fields (amount + unit) render two inputs. The unit input gets the suffix "-inner-unit". This is an internal MDC convention — verify it still holds after UI5 upgrades.
const UNIT_INPUT_ID_SUFFIX = "-inner-unit";
const UI5_ANNOTATION_PREFIX = "@$";

/** Internal rendering flags for a table - not sent to the LLM. Keyed by navPropertyName. */
type TableRenderFlags = {
	allowsCreation: boolean;
	properties: Record<
		string,
		Pick<TableColumnDescriptor, "groupKey" | "groupLabel"> & { isAuxiliary: boolean; isComputed: boolean; isImmutable: boolean }
	>;
};

/** Co-located LLM entry and rendering flags for a single table field. */
type TableData = {
	llmEntry: NonNullable<FieldMetadata[string]>;
	flags: TableRenderFlags;
};

@defineUI5Class("sap.fe.macros.ai.EasyFillDialog")
export default class EasyFillDialog extends BuildingBlock<
	Dialog,
	{
		enteredText: string;
		isBusy: boolean;
		currentlyEnteredText: string;
		incorrectValues: Record<string, unknown>;
		newValues: Record<string, unknown>;
		selectedLayoutMode: EasyFillLayoutMode.CONDENSED | EasyFillLayoutMode.DETAILED;
		hasValues: boolean;
		hasError: boolean;
		warningMessageText: string;
		stateType: "Initial" | "NoEntries" | "Error" | "HasEntries";
		aiResultUpdatedFields: FieldValues;
		pageSectionsTitles: string[];
		fieldMapping: FieldMetadata;
		tableViewModes: Record<string, "previous" | "new">;
		attemptToAddMultipleRowsPerTable: boolean;
	}
> {
	private static readonly CHANGED_VALUES_COUNT_THRESHOLD = 5;

	@defineReference()
	$reviewArea!: Ref<FlexBox>;

	@defineReference()
	$scrollContainer!: Ref<FlexBox>;

	@defineReference()
	$responsiveSplitter!: Ref<ResponsiveSplitter>;

	@property({ type: "function" })
	getEditableFields?: Function;

	private _tableData: Map<string, TableData> = new Map();

	private _pendingNewRowContexts: Map<string, V4Context[]> = new Map();

	private _hasIncorrectFields = false;

	private _hasIncorrectTableFields = false;

	// Transient contexts for existing rows that the AI proposes to update.
	// Key: navigationPropertyName, Value: map of rowIndex -> transient V4Context
	private _pendingUpdatedRowContexts: Map<string, Map<number, V4Context>> = new Map();

	private _existingRowContexts: Map<string, V4Context[]> = new Map();

	private _tableReferences: Map<string, MDCTable> = new Map();

	/** Cached table preview VBoxes keyed by navPropertyName. Survive layout switches. */
	private _renderedTablePreviews: Map<string, { vbox: VBox; hasUneditableChanges: boolean; hasEditableChanges: boolean }> = new Map();

	private _bindingContext?: V4Context;

	private settingsButtons?: { layoutModeButton?: SegmentedButton; enlargeOrShrinkButton?: Button };

	constructor(idOrProps: string | PropertiesOf<EasyFillDialog>, props?: PropertiesOf<EasyFillDialog>) {
		super(idOrProps, props);
	}

	onMetadataAvailable(_ownerComponent: TemplateComponent): void {
		super.onMetadataAvailable(_ownerComponent);
		this.state.newValues = {};
		this.state.selectedLayoutMode = EasyFillLayoutMode.CONDENSED;
		this.state.hasValues = false;
		this.state.hasError = false;
		this._hasIncorrectFields = false;
		this._hasIncorrectTableFields = false;
		this.state.warningMessageText = "";
		this.state.stateType = "Initial";
		this.state.tableViewModes = {};
		this.state.attemptToAddMultipleRowsPerTable = false;
		this.content = this.createContent();
	}

	async onConfirm(_e: Button$PressEvent): Promise<void> {
		triggerPXIntegration("confirm");
		// Validate the data handling
		const view = this.getPageController().getView();
		const mainPageBindingContext = view?.getBindingContext();
		const allProps: Promise<void>[] = [];
		const newValues = this._bindingContext?.getObject() ?? this.state.newValues;
		const odataModel = this.getModel() as ODataModel;
		for (const newValuesKey in newValues) {
			if (newValuesKey !== "__bindingInfo" && !newValuesKey.startsWith(UI5_ANNOTATION_PREFIX)) {
				if (typeof newValues[newValuesKey] !== "object") {
					mainPageBindingContext.setProperty(newValuesKey, newValues[newValuesKey]);
					allProps.push(this.applyUpdatesForChange(view, mainPageBindingContext.getPath(newValuesKey)));
				}
			}
		}

		// Apply AI-proposed changes to updated existing table rows
		const rowUpdatePromises: Promise<void>[] = [];
		const sideEffectTargets: Array<{ path: string; context: V4Context }> = [];
		this._pendingUpdatedRowContexts.forEach((rowContextMap, navPropertyName) => {
			const existingContexts = this._existingRowContexts.get(navPropertyName) ?? [];
			rowContextMap.forEach((transientContext, rowIdx) => {
				const realContext = existingContexts[rowIdx];
				if (realContext === undefined) return;
				const transientData = transientContext.getObject() as Record<string, unknown> | null;
				if (!transientData) return;
				for (const propName in transientData) {
					if (!propName.startsWith(UI5_ANNOTATION_PREFIX) && propName !== "__bindingInfo") {
						const newValue = transientData[propName];
						if (typeof newValue === "object" || newValue === null) continue;
						const hasChanged = realContext.getProperty(propName) !== newValue;
						if (hasChanged) {
							rowUpdatePromises.push(realContext.setProperty(propName, newValue, "easyFillConfirm"));
							sideEffectTargets.push({ path: `${realContext.getPath()}/${propName}`, context: realContext });
						}
					}
				}
			});
		});
		if (rowUpdatePromises.length > 0) {
			odataModel.submitBatch("easyFillConfirm");
			await Promise.all(rowUpdatePromises);
			for (const { path, context } of sideEffectTargets) {
				allProps.push(this.applyUpdatesForChange(view, path, context));
			}
		}

		// Create AI-proposed new rows by activating their transient contexts
		const newRowActivations: Promise<void>[] = [];

		this._pendingNewRowContexts.forEach((newContexts: V4Context[], navPropertyName: string): void => {
			if (this._tableData.get(navPropertyName)?.flags.allowsCreation !== true) {
				return;
			}

			newContexts.forEach((transientContext) => {
				const activation: Promise<void> = (async (): Promise<void> => {
					try {
						await transientContext.created();
					} catch (err: unknown) {
						Log.error("Failed to activate new row context:", err as Error);
					}
				})();
				newRowActivations.push(activation);
			});
		});

		// Discard staging contexts used for existing-row display, they must never be posted.
		odataModel.resetChanges("easyFillStaging");
		// Discard the direct-field staging context - values already applied to the real entity above.
		(odataModel.resetChanges("easyFillDirectFields") as unknown as Promise<void>)?.catch(() => {
			/* expected cancellation */
		});
		// Submit the new-row batch so the created() promises can resolve.
		if (newRowActivations.length > 0) {
			odataModel.submitBatch("submitLater");
		}
		await Promise.all(newRowActivations);

		try {
			await Promise.all(allProps);
			mainPageBindingContext.refresh();
		} catch (err) {
			Log.error("Failed to update data after change:", err as Error);
		} finally {
			this.content?.close();
		}
	}

	async applyUpdatesForChange(view: FEView, propertyPathForUpdate: string, context?: V4Context): Promise<void> {
		const metaModel = view.getModel().getMetaModel();
		const metaContext = metaModel.getMetaContext(propertyPathForUpdate);
		const dataModelObject = MetaModelConverter.getInvolvedDataModelObjects<Property>(metaContext);
		const targetContext = context ?? view.getBindingContext();
		try {
			const sideEffectsPromises: Promise<unknown>[] = [];
			const sideEffectsService = CollaborationUtils.getAppComponent(view).getSideEffectsService();

			// We have a target context, so we can retrieve the updated property
			const targetMetaPath = metaModel.getMetaPath(targetContext.getPath());
			const relativeMetaPathForUpdate = metaModel.getMetaPath(propertyPathForUpdate).replace(targetMetaPath, "").slice(1);
			sideEffectsPromises.push(sideEffectsService.requestSideEffects([relativeMetaPathForUpdate], targetContext, "$auto"));

			// Get the fieldGroupIds corresponding to pathForUpdate
			const fieldGroupIds = sideEffectsService.computeFieldGroupIds(
				dataModelObject.targetEntityType.fullyQualifiedName,
				dataModelObject.targetObject!.fullyQualifiedName
			);

			// Execute the side effects for the fieldGroupIds
			if (fieldGroupIds.length) {
				const pageController = view.getController();
				const sideEffectsMapForFieldGroup = pageController.sideEffects.getSideEffectsMapForFieldGroups(
					fieldGroupIds,
					targetContext
				) as FieldSideEffectDictionary;
				Object.keys(sideEffectsMapForFieldGroup).forEach((sideEffectName) => {
					const sideEffect = sideEffectsMapForFieldGroup[sideEffectName];
					sideEffectsPromises.push(
						pageController.sideEffects.requestSideEffects(sideEffect.sideEffects, sideEffect.context, "$auto", undefined, true)
					);
				});
			}

			await Promise.all(sideEffectsPromises);
		} catch (err) {
			Log.error("Failed to update data after change:", err as Error);
			throw err;
		}
	}

	onCancel(): void {
		triggerPXIntegration("cancel");
		this.discardPendingContexts();
		this.content?.close();
	}

	private discardPendingContexts(): void {
		this._bindingContext?.created()?.catch(() => {
			/* expected cancellation when re-running easy edit */
		});
		this._pendingUpdatedRowContexts.forEach((rowContextMap) => {
			rowContextMap.forEach((ctx) => {
				ctx.created()?.catch(() => {
					/* expected cancellation */
				});
			});
		});
		this._pendingNewRowContexts.forEach((contexts) => {
			contexts.forEach((ctx) => {
				ctx.created()?.catch(() => {
					/* expected cancellation */
				});
			});
		});
		const odataModel = this.getModel() as ODataModel | undefined;
		if (odataModel) {
			(odataModel.resetChanges("submitLater") as unknown as Promise<void>)?.catch(() => {
				/* expected cancellation */
			});
			(odataModel.resetChanges("easyFillStaging") as unknown as Promise<void>)?.catch(() => {
				/* expected cancellation */
			});
			(odataModel.resetChanges("easyFillDirectFields") as unknown as Promise<void>)?.catch(() => {
				/* expected cancellation */
			});
		}
		this._pendingUpdatedRowContexts.clear();
		this._pendingNewRowContexts.clear();
		this._renderedTablePreviews.forEach(({ vbox }) => {
			vbox.destroy();
		});
		this._renderedTablePreviews.clear();
	}

	open(): void {
		this.content?.open();
	}

	/**
	 * Builds AI field metadata mapping from the current page definition.
	 * @param definitionPage Current page definition.
	 * @returns Field metadata.
	 */
	_getFieldMapping(definitionPage: DefinitionPage | undefined): FieldMetadata {
		const fieldMapping: FieldMetadata = {};
		if (definitionPage) {
			const pageTarget = definitionPage.getMetaPath().getTarget();
			let entityType: EntityType | undefined;
			switch (pageTarget._type) {
				case "EntitySet":
				case "Singleton":
					entityType = pageTarget.entityType;
					break;
				case "NavigationProperty":
					entityType = pageTarget.targetType;
					break;
			}
			if (entityType !== undefined) {
				this.processDirectEntityProperties(entityType.entityProperties, fieldMapping);
				this.processTables(entityType);
				this._tableData.forEach((data, navProp) => {
					fieldMapping[navProp] = data.llmEntry;
				});
			}
		}
		return fieldMapping;
	}

	/* Process direct properties of the entity (non-navigation) and add to field mapping if they are not immutable, computed, hidden, or complex types. */
	processDirectEntityProperties(simpleObjects: Property[], fieldMapping: FieldMetadata): void {
		for (const entityProperty of simpleObjects) {
			if (isImmutable(entityProperty) || isComputed(entityProperty)) {
				fieldMapping[entityProperty.name] = {
					description: getLabel(entityProperty) ?? entityProperty.name,
					dataType: entityProperty.type,
					section: this.getTranslatedText("C_EASYEDIT_INCORRECT_FIELDS")
				};
			} else if (entityProperty.annotations.UI?.Hidden?.valueOf() !== true && !entityProperty.targetType) {
				const objectPageLayout = this.getCurrentObjectPageLayout();
				const section = EasyFillObjectPageHelper.getSectionForField(objectPageLayout, entityProperty.name);
				const sectionForField = section?.getTitle() ?? EasyFillObjectPageHelper.getOneExistingSectionTitleOrEmpty(objectPageLayout);
				const sectionSubsection = section
					? EasyFillObjectPageHelper.tryGetSectionSubsectionTitleForField(section, entityProperty.name)
					: undefined;
				const fieldSubsection = section
					? EasyFillObjectPageHelper.tryGetSubsectionTitleForField(section, entityProperty.name)
					: undefined;
				fieldMapping[entityProperty.name] = {
					description: getLabel(entityProperty) ?? entityProperty.name,
					dataType: entityProperty.type,
					section: sectionForField,
					sectionSubsection: sectionSubsection,
					fieldSubsection: fieldSubsection
				};
			}
		}
	}

	/*
	 * Append visible tables to _tableData, separating LLM-facing entry from internal rendering flags.
	 * The LLM entry contains only description and dataType per property; flags track isAuxiliary,
	 * isComputed, isImmutable, and allowsCreation for use during preview rendering.
	 */
	processTables(parentEntityType: EntityType): void {
		this._tableData.clear();
		this._existingRowContexts.clear();
		this._tableReferences.clear();
		const view = this.getPageController().getView();
		const renderedMDCTables = getTables(view, "sap.ui.mdc.Table") as MDCTable[];

		for (const table of renderedMDCTables) {
			const innerTableType = table.getType();
			const isSupportedTableType =
				((innerTableType as { isA?: (type: string) => boolean })?.isA?.("sap.ui.mdc.table.ResponsiveTableType") ?? false) ||
				((innerTableType as { isA?: (type: string) => boolean })?.isA?.("sap.ui.mdc.table.GridTableType") ?? false);
			if (!isSupportedTableType) {
				Log.info(`EasyFill: skipping table ${table.getId()} - unsupported inner table type`);
				continue;
			}

			const navPropertyName = table.getRowBinding()?.getPath();
			if (!navPropertyName) {
				continue;
			}

			const { itemProperties, currentItems, currentContexts } = fetchTableData(table, navPropertyName);

			if (Object.keys(itemProperties).length > 0) {
				const navProperty = parentEntityType.navigationProperties.find((np) => np.name === navPropertyName);
				const subEntityProps = navProperty?.targetType.entityProperties ?? [];

				const properties: TableRenderFlags["properties"] = {};
				const llmItemProperties: NonNullable<FieldMetadata[string]>["itemProperties"] = {};
				for (const [key, val] of Object.entries(itemProperties)) {
					const prop = subEntityProps.find((p) => p.name === key);
					properties[key] = {
						isAuxiliary: val.isAuxiliary === true,
						isComputed: prop !== undefined && isComputed(prop),
						isImmutable: prop !== undefined && isImmutable(prop),
						groupKey: val.groupKey,
						groupLabel: val.groupLabel
					};
					llmItemProperties[key] = { description: val.description, dataType: val.dataType };
				}

				const tableHeader = table.getHeader();
				const tableSectionTitle = EasyFillObjectPageHelper.findSectionTitleForTable(table) ?? tableHeader;
				this._existingRowContexts.set(navPropertyName, currentContexts);
				this._tableReferences.set(navPropertyName, table);
				this._tableData.set(navPropertyName, {
					llmEntry: {
						description: `${tableHeader}`,
						dataType: "Collection",
						isCollection: true,
						itemProperties: llmItemProperties,
						currentItems,
						section: tableSectionTitle
					},
					flags: { allowsCreation: this.resolveTableAllowsCreation(table), properties }
				});
			}
		}
	}

	/**
	 * Determines whether new rows can be created for a given table.
	 * @param table The MDC table to check.
	 * @returns True if the table supports inline creation and the Create action is enabled.
	 */
	private resolveTableAllowsCreation(table: MDCTable): boolean {
		const tableParent = table.getParent() as TableAPI;
		const isTableInlineCreatable = tableParent?.creationMode?.name === "Inline";
		const isTableInlineRowCreatable = tableParent?.creationMode?.name === "InlineCreationRows";
		const createButton = tableParent
			?.findElements(true)
			.find((el) => el.isA("sap.m.Button") && el.getId().endsWith("StandardAction::Create")) as
			| { getEnabled?: () => boolean }
			| undefined;
		const isCreateActionEnabled = createButton?.getEnabled?.() === true;
		const allowsCreation = isTableInlineRowCreatable || (isTableInlineCreatable && isCreateActionEnabled);
		if (allowsCreation) {
			Log.info(
				`Table ${table.getId()} - Inline creatable: ${isTableInlineCreatable}, Inline row creatable: ${isTableInlineRowCreatable}, Create action enabled: ${isCreateActionEnabled}`
			);
		}
		return allowsCreation;
	}

	private makeFieldFormBuilderContext(): FieldFormBuilderContext {
		return {
			fieldMapping: this.state.fieldMapping,
			bindingContext: this._bindingContext,
			metaModel: this.getMetaModel()!,
			view: this.getPageController().getView(),
			runAsOwner: <T,>(fn: () => T): T | undefined => this._getOwner()?.runAsOwner(fn),
			ownerContextPath: this.getOwnerContextPath(),
			getValueList: this.getValueList.bind(this),
			getTranslatedText: this.getTranslatedText.bind(this),
			onFieldChange: this.onFieldChange.bind(this),
			onValidateFieldGroups: this.onValidateFieldGroups.bind(this),
			onHasError: (): void => {
				this.state.hasError = true;
			},
			onHasValues: (): void => {
				this.state.hasValues = true;
			}
		};
	}

	private makeReviewAreaContext(): ReviewAreaContext {
		return {
			selectedLayoutMode: this.state.selectedLayoutMode,
			getTranslatedText: this.getTranslatedText.bind(this)
		};
	}

	private makeTablePreviewContext(): TablePreviewContext {
		return {
			tableReferences: this._tableReferences,
			tableData: this._tableData,
			pendingUpdatedRowContexts: this._pendingUpdatedRowContexts,
			pendingNewRowContexts: this._pendingNewRowContexts,
			runAsOwner: <T,>(fn: () => T): T | undefined => this._getOwner()?.runAsOwner(fn),
			ownerContextPath: this.getOwnerContextPath() ?? "",
			model: this.getModel() as ODataModel,
			metaModel: this.getMetaModel(),
			onFieldChange: this.onFieldChange.bind(this),
			onValidateFieldGroups: this.onValidateFieldGroups.bind(this),
			getValueList: this.getValueList.bind(this),
			applyCompositeFieldCheck: this.applyCompositeFieldCheck.bind(this)
		};
	}

	/**
	 * Renders previous table view showing original values (all read-only).
	 * @param navigationPropertyName The name of the navigation property (table).
	 * @param collectionMetadata The collection (table) metadata.
	 * @param existingRowContexts The V4 contexts for the existing rows.
	 * @param isGridLayout Whether the source table is a grid (sap.ui.table.Table).
	 * @returns Preview table.
	 */
	private _renderPreviousTableView(
		navigationPropertyName: string,
		collectionMetadata: NonNullable<FieldMetadata[string]>,
		existingRowContexts: V4Context[],
		isGridLayout: boolean
	): Table {
		return EasyFillTableViewBuilder.renderPreviousTableView(
			this.makeTablePreviewContext(),
			navigationPropertyName,
			collectionMetadata,
			existingRowContexts,
			isGridLayout
		);
	}

	/**
	 * Renders new table view with AI changes highlighted and new rows editable.
	 * @param navigationPropertyName The name of the navigation property.
	 * @param aiChanges Array of row changes from AI response.
	 * @param collectionMetadata The collection metadata.
	 * @param existingRowContexts The V4 contexts for the existing rows.
	 * @param isGridLayout Whether the source table is a grid (sap.ui.table.Table).
	 * @returns Preview table.
	 */
	private _renderNewTableView(
		navigationPropertyName: string,
		aiChanges: Array<{ _rowIndex?: number; [key: string]: unknown }>,
		collectionMetadata: NonNullable<FieldMetadata[string]>,
		existingRowContexts: V4Context[],
		isGridLayout: boolean
	): { view: Table; hasUneditableChanges: boolean; hasEditableChanges: boolean } {
		const parentDataPath = this.getPageController().getView()?.getBindingContext()?.getPath() ?? "";
		return EasyFillTableViewBuilder.renderNewTableView(
			this.makeTablePreviewContext(),
			navigationPropertyName,
			aiChanges,
			collectionMetadata,
			existingRowContexts,
			isGridLayout,
			parentDataPath
		);
	}

	/**
	 * Renders the complete table preview with segmented button to toggle between previous and new views.
	 * @param navigationPropertyName The name of the navigation property.
	 * @param aiChanges Array of row changes from AI response.
	 * @param collectionMetadata The collection metadata.
	 * @param rowContexts The V4 contexts for the existing rows.
	 * @returns VBox containing segmented button and table.
	 */
	private _renderTablePreview(
		navigationPropertyName: string,
		aiChanges: Array<{ _rowIndex?: number; [key: string]: unknown }>,
		collectionMetadata: NonNullable<FieldMetadata[string]>,
		rowContexts: V4Context[]
	): { vbox: VBox; hasUneditableChanges: boolean; hasEditableChanges: boolean } {
		// Determine view mode: preserve user's selection across re-renders, default to "new"
		const currentViewMode: "previous" | "new" = this.state.tableViewModes[navigationPropertyName] ?? "new";
		this.state.tableViewModes[navigationPropertyName] = currentViewMode;

		// Calculate counts
		const existingCount = rowContexts.length;
		const allowsCreation = this._tableData.get(navigationPropertyName)?.flags.allowsCreation === true;
		const aiNewRows = aiChanges.filter((r) => r._rowIndex === undefined);
		// Cap at 1: the dialog only creates one new row at a time (matching _renderNewTableView behavior)
		const newCount = allowsCreation ? Math.min(1, aiNewRows.length) : 0;

		// Format title with change summary
		const getTableTitle = (viewMode: "previous" | "new"): string => {
			if (viewMode === "previous") {
				const baseName = collectionMetadata.description;
				return `${baseName} (${existingCount})`;
			} else {
				const baseName = collectionMetadata.description;
				return `${baseName} (${existingCount + newCount})`;
			}
		};

		// Create both table views
		const mdcTable = this._tableReferences.get(navigationPropertyName);
		const isGridLayout = mdcTable ? isGridSourceTable(mdcTable) : false;
		const previousTable = this._renderPreviousTableView(navigationPropertyName, collectionMetadata, rowContexts, isGridLayout);
		const {
			view: newTable,
			hasUneditableChanges,
			hasEditableChanges
		} = this._renderNewTableView(navigationPropertyName, aiChanges, collectionMetadata, rowContexts, isGridLayout);

		// Set initial visibility based on current view mode
		previousTable.setVisible(currentViewMode === "previous");
		newTable.setVisible(currentViewMode === "new");

		// Create title control that updates dynamically
		const titleControl = new Title({
			text: getTableTitle(currentViewMode),
			level: TitleLevel.H5
		}).addStyleClass("sapUiMediumMarginEnd");

		const readonlyTag = hasUneditableChanges
			? new GenericTag({
					text: this.getTranslatedText("C_EASYEDIT_TABLE_READONLY_TAG"),
					status: "Warning",
					visible: currentViewMode === "new"
			  })
			: null;

		// Create segmented button for view switching
		const segmentedButton = new SegmentedButton({
			width: "auto",
			selectionChange: (): void => {
				const selectedKey = segmentedButton.getSelectedKey() as "previous" | "new";
				this.state.tableViewModes[navigationPropertyName] = selectedKey;
				previousTable.setVisible(selectedKey === "previous");
				newTable.setVisible(selectedKey === "new");
				readonlyTag?.setVisible(selectedKey === "new");
				// Update title with new count
				titleControl.setText(getTableTitle(selectedKey));
			},
			items: [
				new SegmentedButtonItem({
					key: "previous",
					text: this.getTranslatedText("C_EASYEDIT_TABLE_VIEW_PREVIOUS"),
					width: "auto"
				}),
				new SegmentedButtonItem({
					key: "new",
					text: this.getTranslatedText("C_EASYEDIT_TABLE_VIEW_NEW"),
					width: "auto"
				})
			]
		});
		segmentedButton.setSelectedKey(currentViewMode);

		// Container for dynamically showing the selected table
		const tableContainer = isGridLayout
			? ((): ScrollContainer => {
					const sc = new ScrollContainer({ horizontal: true, vertical: false, content: [previousTable, newTable] });
					sc.addStyleClass("sapUiSmallMarginTop");
					return sc;
			  })()
			: ((<VBox class="sapUiSmallMarginTop">{{ items: [previousTable, newTable] }}</VBox>) as VBox);

		return {
			vbox: (
				<VBox class="sapUiSmallMargin">
					{{
						items: [
							<HBox justifyContent="SpaceBetween" alignItems="Center" wrap={FlexWrap.Wrap}>
								<HBox alignItems="Center" wrap={FlexWrap.Wrap} renderType="Bare">
									{titleControl}
									{readonlyTag}
								</HBox>
								{segmentedButton}
							</HBox>,
							tableContainer
						]
					}}
				</VBox>
			) as VBox,
			hasUneditableChanges,
			hasEditableChanges
		};
	}

	private onThumbUpPressed(thumbUpButton: ToggleButton, thumbDownButton: ToggleButton): void {
		triggerPXIntegration("thumbUp");
		this.onThumbPressed(thumbUpButton, thumbDownButton);
	}

	private onThumbDownPressed(thumbUpButton: ToggleButton, thumbDownButton: ToggleButton): void {
		triggerPXIntegration("thumbDown");
		this.onThumbPressed(thumbUpButton, thumbDownButton);
	}

	private onThumbPressed(thumbUpButton: ToggleButton, thumbDownButton: ToggleButton): void {
		thumbUpButton.setEnabled(false);
		thumbDownButton.setEnabled(false);
		MessageToast.show(this.getTranslatedText("C_EASYEDIT_FEEDBACK_SENT"));
	}

	formatRemainingCharacters(value: string): string {
		return this.getTranslatedText("C_EASYEDIT_REMAINING_CHARACTERS", [MAX_LENGTH - (value?.length ?? 0)]);
	}

	onClearAll(): void {
		this.state.newValues = {};
		this.state.hasValues = false;
		this._hasIncorrectFields = false;
		this._hasIncorrectTableFields = false;
		this.state.warningMessageText = "";
		this.state.selectedLayoutMode = EasyFillLayoutMode.CONDENSED;
		this.state.enteredText = "";
		this.state.hasError = false;
		this.state.stateType = "Initial";
		this.state.currentlyEnteredText = "";
		this.state.incorrectValues = {};
		this.state.attemptToAddMultipleRowsPerTable = false;
		this.discardPendingContexts();
		this._tableData.clear();
		this._existingRowContexts.clear();
		this._tableReferences.clear();
		this.destroyCurrentScrollContainer();
	}

	/**
	 * Handles layout mode switch between condensed and detailed layout.
	 * @param event Selection change event.
	 * @returns Promise resolved after layout update.
	 */
	async onSettingsModeSelectionChange(event: SegmentedButton$SelectionChangeEvent): Promise<void> {
		const selectedItemKey: string | undefined = event.getParameter("item")?.getKey();
		this.state.selectedLayoutMode =
			selectedItemKey === EasyFillLayoutMode.DETAILED ? EasyFillLayoutMode.DETAILED : EasyFillLayoutMode.CONDENSED;
		try {
			await this.setAllFieldsBasedOnLayoutMode();
		} catch (err) {
			Log.error(err as string);
			this.setErrorState();
		}
	}

	/**
	 * Rebuilds section content according to selected layout mode.
	 * @returns Promise resolved when layout content is updated.
	 */
	private async setAllFieldsBasedOnLayoutMode(): Promise<void> {
		this.preserveEditedValuesBeforeLayoutSwitch();
		const isCondensed = this.state.selectedLayoutMode === EasyFillLayoutMode.CONDENSED;
		const sectionsForMode: readonly string[] = isCondensed ? [""] : this.state.pageSectionsTitles;
		this.destroyCurrentSectionsAndSubSections();
		this._hasIncorrectFields = false;
		this._hasIncorrectTableFields = false;
		this.state.warningMessageText = "";
		await this.createOrUpdateObjectPageLayoutWithSections(sectionsForMode);
	}

	/**
	 * Preserves currently edited values before switching layout mode.
	 */
	private preserveEditedValuesBeforeLayoutSwitch(): void {
		const bindingValues: Record<string, unknown> | undefined = this._bindingContext?.getObject();
		if (bindingValues === undefined) {
			Log.info("No values to be preserved before layout switch");
			return;
		}
		const currentAiValues: FieldValues = this.getAiResultForFieldsFromComponentState() ?? {};
		const mergedValues: FieldValues = { ...currentAiValues };
		for (const fieldName of Object.keys(currentAiValues)) {
			if (bindingValues[fieldName] !== undefined) {
				mergedValues[fieldName] = bindingValues[fieldName];
			}
		}
		this.saveAiResultForFieldsToComponentState(mergedValues);
	}

	/**
	 * Reads visible object page section titles.
	 * @returns List of section titles, or a single empty title fallback.
	 */
	private getPageSectionsTitles(): string[] {
		const objectPageLayout = this.getCurrentObjectPageLayout();
		try {
			const sectionTitles: string[] = objectPageLayout
				.getSections()
				.filter((section: ObjectPageSection) => section.getVisible() && section.getTitle())
				.map((section: ObjectPageSection) => section.getTitle());
			if (sectionTitles.length === 0) {
				Log.warning("Could not find any visible sections with a title in the ObjectPageLayout.");
				return [""];
			}
			sectionTitles.push(this.getTranslatedText("C_EASYEDIT_INCORRECT_FIELDS"));
			return sectionTitles;
		} catch (err) {
			Log.error(err as string);
			return [""];
		}
	}

	/**
	 * Returns the current object page layout from the active view.
	 * @returns Object page layout instance.
	 */
	private getCurrentObjectPageLayout(): ObjectPageLayout {
		const pageController = this.getPageController() as {
			_getObjectPageLayoutControl?: () => ObjectPageLayout | undefined;
		};
		const objectPageLayout: ObjectPageLayout | undefined = pageController._getObjectPageLayoutControl?.();
		if (objectPageLayout === undefined) {
			throw new Error("Failed to retrieve ObjectPageLayout from ObjectPage controller");
		}
		return objectPageLayout;
	}

	/**
	 * Clears dynamic sections and subsections from the current layout.
	 */
	private destroyCurrentSectionsAndSubSections(): void {
		// Detach cached table preview VBoxes from the section tree before destroying sections.
		// This preserves the live transient contexts and field bindings so they can be re-added
		// to the rebuilt sections without recreating OData contexts on every layout switch.
		this._renderedTablePreviews.forEach(({ vbox }) => {
			const parent = vbox.getParent();
			if (parent instanceof ObjectPageSubSection) {
				parent.removeBlock(vbox);
			} else if (parent instanceof VBox) {
				parent.removeItem(vbox);
			}
		});
		const scrollContainer: FlexBox | undefined = this.$scrollContainer.current;
		if (scrollContainer === undefined) {
			return;
		}
		const objectPageLayouts: ObjectPageLayout[] = scrollContainer
			.getItems()
			.filter((item): item is ObjectPageLayout => item instanceof ObjectPageLayout);
		objectPageLayouts.forEach((layout: ObjectPageLayout): void => {
			layout.destroySections();
		});
	}

	onValidateFieldGroups(_e?: Control$ValidateFieldGroupEvent): void {
		const allFields = (this.$reviewArea.current?.getControlsByFieldGroupId("EasyFillField") as EnhanceWithUI5<Field>[]) ?? [];
		this.state.hasError = allFields.some((field: EnhanceWithUI5<Field>): boolean => {
			if (field.data("messageId")) {
				return true;
			}

			const content = field.content;
			const innerInputs: InputBase[] =
				content?.isA("sap.m.InputBase") === true
					? [content as unknown as InputBase]
					: ((content?.findAggregatedObjects(true, (c) => c.isA("sap.m.InputBase")) ?? []) as InputBase[]);
			return innerInputs.some((input) => input.getValueState() === ValueState.Error);
		});
	}

	onFieldChange(ev: UI5Event<{}, Field>): void {
		const field = ev.getSource();
		const msgId = field.data("messageId") as string | undefined;
		if (msgId) {
			field.removeMessage(msgId);
		}
		field.data("messageId", undefined);

		setTimeout(() => {
			this.applyCompositeFieldCheck(field as unknown as EnhanceWithUI5<Field>).catch((err: unknown) =>
				Log.error("Composite field error re-application failed:", err as Error)
			);
		}, INNER_CONTROL_RENDER_DELAY_MS);
	}

	/**
	 * Runs the value help check on the current input value for composite fields (e.g. amount + currency).
	 * Sets the value state to "Error" if the value is still invalid, or "None" if it has become valid.
	 *
	 * Note: using simply field.addMessage does not work for composite fields due to the way MDC handles value states internally on the input controls, so we have to set the value state directly on the input after checking the value help results.
	 * @param field The composite field to validate.
	 */
	private async applyCompositeFieldCheck(field: EnhanceWithUI5<Field>): Promise<void> {
		const content = field.content;
		const inputs: InputBase[] = (content?.findAggregatedObjects(true, (c) => c.isA("sap.m.InputBase")) ?? []) as InputBase[];
		for (const metaPathKey of ["primaryPropMetaPath", "auxiliaryPropMetaPath"] as const) {
			const metaPath = field.data(metaPathKey) as string | undefined;
			if (!metaPath) {
				continue;
			}

			const isAuxiliary = metaPathKey === "auxiliaryPropMetaPath";
			const input = inputs.find((inp) => inp.getId().endsWith(UNIT_INPUT_ID_SUFFIX) === isAuxiliary);
			if (!input) {
				Log.warning(
					`EasyFill [ATTENTION]: could not locate ${
						isAuxiliary ? "unit" : "primary"
					} input via suffix "${UNIT_INPUT_ID_SUFFIX}" - MDC internal convention may have changed, skipping value help check`
				);
				continue;
			}

			const currentValue = input.getValue();
			const valueList = await this.getValueList(metaPath);
			if (!currentValue || !valueList || !ValueListHelper.isValueListSearchable(metaPath, valueList)) {
				// No value or no searchable value list — clear any prior error so a deleted value doesn't stay red.
				input.setValueState(ValueState.None);
				input.setValueStateText("");
				continue;
			}

			const resolved = await resolveTokenValue(valueList, { operator: FilterOperator.EQ, selectedValues: [currentValue] }, true);
			if (resolved[0]?.noMatch === true) {
				input.setValueState(ValueState.Error);
				input.setValueStateText(this.getTranslatedText("C_EASYEDIT_VH_ERROR", [currentValue]));
			} else {
				input.setValueState(ValueState.None);
				input.setValueStateText("");
			}
		}
		this.onValidateFieldGroups();
	}

	/**
	 * Executes AI extraction and builds review content.
	 * @returns Promise resolved when processing is complete.
	 */
	async onEasyEditPressed(): Promise<void> {
		this.navigateToReviewPane();
		const metaPath = this.getOwnerPageDefinition();
		let fieldMapping: FieldMetadata;
		try {
			fieldMapping = this._getFieldMapping(metaPath);
			this.state.fieldMapping = fieldMapping;
		} catch (err) {
			this.setErrorState();
			Log.error("Failed to get field mapping:", err as Error);
			return;
		}
		const easyFillLibrary = await import("ux/eng/fioriai/reuse/easyfill/EasyFill");
		const odataModel = this.getModel() as ODataModel;
		this.discardPendingContexts();
		const transientListBinding = EasyFillTableViewBuilder.createListBinding(
			odataModel.getMetaModel().getMetaPath(this.getPageController().getView()?.getBindingContext()?.getPath()),
			this.getModel() as ODataModel,
			"easyFillDirectFields"
		);
		this._bindingContext = transientListBinding.create({}, true);

		this.state.isBusy = true;
		try {
			const aiCallResult = await easyFillLibrary.extractFieldValuesFromText(this.state.enteredText, fieldMapping);
			this.state.isBusy = false;
			if (aiCallResult.success) {
				const { multipleRows, ...updatedFields } = aiCallResult.data;
				this.state.attemptToAddMultipleRowsPerTable = (multipleRows as boolean) ?? false;
				for (const [key, value] of Object.entries(updatedFields)) {
					if (typeof value !== "object" && fieldMapping[key] !== undefined) {
						this._bindingContext?.setProperty(key, value);
					}
				}
				this.saveAiResultForFieldsToComponentState(updatedFields);
				this.destroyCurrentScrollContainer();
				if (Object.keys(updatedFields).length === 0) {
					this.state.hasValues = false;
					this._hasIncorrectFields = false;
					this._hasIncorrectTableFields = false;
					this.state.warningMessageText = "";
					this.state.stateType = "NoEntries";
					return;
				}
				this.state.stateType = "HasEntries";
				this.state.hasError = false;
				this.state.hasValues = false;
				this._hasIncorrectFields = false;
				this._hasIncorrectTableFields = false;
				this.state.warningMessageText = "";

				this.changeSelectedLayoutModeBasedOnChangedValuesCount(Object.keys(updatedFields).length);
				this.state.pageSectionsTitles = this.getPageSectionsTitles();
				const sectionsForMode: readonly string[] =
					this.state.selectedLayoutMode === EasyFillLayoutMode.CONDENSED ? [""] : this.state.pageSectionsTitles;
				const objectPageLayoutWithSections = await this.createOrUpdateObjectPageLayoutWithSections(sectionsForMode);
				this.addItemToReviewArea(objectPageLayoutWithSections);
				setTimeout((): void => {
					this.onValidateFieldGroups();
				}, 1000);
			} else {
				this.setErrorState();
			}
		} catch (e) {
			this.state.isBusy = false;
			this.setErrorState();
		}
	}

	/**
	 * Chooses default layout mode depending on number of changed values.
	 * @param changedValuesCount Number of changed values.
	 */
	private changeSelectedLayoutModeBasedOnChangedValuesCount(changedValuesCount: number): void {
		if (changedValuesCount > EasyFillDialog.CHANGED_VALUES_COUNT_THRESHOLD) {
			this.state.selectedLayoutMode = EasyFillLayoutMode.DETAILED;
		} else {
			this.state.selectedLayoutMode = EasyFillLayoutMode.CONDENSED;
		}
	}

	private isInErrorState(): boolean {
		return this.state.stateType === "Error";
	}

	private _updateWarningMessageText(): void {
		if (this._hasIncorrectFields && this._hasIncorrectTableFields) {
			this.state.warningMessageText = this.getTranslatedText("C_EASYEDIT_DIALOG_WARNING_MSG_FIELDS_AND_TABLES");
		} else if (this._hasIncorrectFields) {
			this.state.warningMessageText = this.getTranslatedText("C_EASYEDIT_DIALOG_WARNING_MSG_FIELDS");
		} else if (this._hasIncorrectTableFields) {
			this.state.warningMessageText = this.getTranslatedText("C_EASYEDIT_DIALOG_WARNING_MSG_TABLES");
		} else {
			this.state.warningMessageText = "";
		}
	}

	private setErrorState(): void {
		this.discardPendingContexts();
		this.destroyCurrentScrollContainer();
		this.state.hasValues = false;
		this._hasIncorrectFields = false;
		this._hasIncorrectTableFields = false;
		this.state.warningMessageText = "";
		this.state.stateType = "Error";
		this.state.newValues = {};
		this.state.incorrectValues = {};
		this.state.tableViewModes = {};
		this.state.attemptToAddMultipleRowsPerTable = false;
		this._tableData.clear();
		this._existingRowContexts.clear();
		this._tableReferences.clear();
	}

	/**
	 * Adds the generated object page layout into the review area.
	 * @param objectPageLayoutWithSections Layout containing reviewed fields.
	 */
	private addItemToReviewArea(objectPageLayoutWithSections: ObjectPageLayout): void {
		if (this.isInErrorState()) return;
		this.$reviewArea.current?.addItem(
			<FlexBox ref={this.$scrollContainer} class="sapFeEasyFillReviewArea" direction={FlexDirection.Column}>
				{{
					items: [objectPageLayoutWithSections]
				}}
			</FlexBox>
		);
	}

	private saveAiResultForFieldsToComponentState(updatedFields: FieldValues): void {
		Log.info("Saving AI result for fields to component state. Updated fields: " + JSON.stringify(updatedFields));
		this.state.aiResultUpdatedFields = updatedFields;
	}

	private getAiResultForFieldsFromComponentState(): FieldValues {
		const sanitizedUpdatedFields: FieldValues = {};
		const updatedFields = this.state.aiResultUpdatedFields ?? {};
		for (const fieldName of Object.keys(updatedFields)) {
			if (!EasyFillFieldHelper.isTechnicalFieldKey(fieldName)) {
				sanitizedUpdatedFields[fieldName] = updatedFields[fieldName];
			}
		}
		return sanitizedUpdatedFields;
	}

	private destroyCurrentScrollContainer(): void {
		this.$scrollContainer.current?.destroy();
		this.destroyLayoutSettingsButtons();
	}

	private destroyLayoutSettingsButtons(): void {
		this.settingsButtons?.layoutModeButton?.destroy();
		this.settingsButtons?.enlargeOrShrinkButton?.destroy();
		this.settingsButtons = undefined;
	}

	/**
	 * Creates the heading title control and header content controls (AI notice, feedback, warning strip).
	 * @returns Object with heading Title and headerContent controls array.
	 */
	private createHeadingWithTitleAndAiNoticeText(): { heading: Title; headerContent: UI5Element[] } {
		const resourceBundle: ResourceBundle = Lib.getResourceBundleFor("sap.fe.controls") as ResourceBundle;
		const thumbUpButton = (
			<ToggleButton
				icon={"sap-icon://thumb-up"}
				tooltip={this.getTranslatedText("C_EASYEDIT_THUMBS_UP")}
				type={"Transparent"}
				class={"sapUiTinyMarginBegin"}
			/>
		) as ToggleButton;
		FESRHelper.setSemanticStepname(thumbUpButton, "press", "fe4:ef:thumbUp");

		const thumbDownButton = (
			<ToggleButton
				icon={"sap-icon://thumb-down"}
				tooltip={this.getTranslatedText("C_EASYEDIT_THUMBS_DOWN")}
				type={"Transparent"}
				class={"sapUiTinyMarginBegin"}
			/>
		) as ToggleButton;
		FESRHelper.setSemanticStepname(thumbDownButton, "press", "fe4:ef:thumbDown");

		thumbUpButton.attachPress((): void => this.onThumbUpPressed(thumbUpButton, thumbDownButton));
		thumbDownButton.attachPress((): void => this.onThumbDownPressed(thumbUpButton, thumbDownButton));

		const heading = (<Title text={this.getTranslatedText("C_EASYEDIT_FILLED_FIELDS")} />) as Title;

		const aiNoticeRow = (
			<FlexBox
				direction={FlexDirection.Row}
				wrap={FlexWrap.Wrap}
				justifyContent={"Start"}
				alignItems={"Center"}
				renderType={"Bare"}
				visible={equal(this.bindState("stateType"), "HasEntries")}
			>
				<AINotice type="Link" placementType={PlacementType.Auto}>
					<VBox>
						<Text class="sapFeControlsAiPopoverText1" text={resourceBundle.getText("M_NOTICE_AI_POPOVER_TEXT_1")} />
						<Text class="sapFeControlsAiPopoverText2" text={resourceBundle.getText("M_NOTICE_AI_POPOVER_TEXT_2")} />
					</VBox>
				</AINotice>
				<HBox>
					{thumbUpButton}, {thumbDownButton}
				</HBox>
			</FlexBox>
		) as FlexBox;

		const multipleRowsStrip = (
			<MessageStrip
				visible={this.state.attemptToAddMultipleRowsPerTable}
				text={this.getTranslatedText("C_EASYEDIT_TABLE_MULTIPLE_NEW_ROWS_WARNING")}
				type={"Warning"}
				showIcon={true}
			/>
		) as MessageStrip;

		const messageStrip = (
			<MessageStrip
				text={this.bindState("warningMessageText")}
				type={"Warning"}
				showIcon={true}
				visible={not(isEmpty(this.bindState("warningMessageText")))}
				class={"sapUiTinyMarginTopBottom"}
			/>
		) as MessageStrip;

		return { heading, headerContent: [aiNoticeRow, multipleRowsStrip, messageStrip] };
	}

	/**
	 * Creates or updates an object page layout with sections and header actions.
	 * @param sections Section titles to render.
	 * @returns Promise resolved with the object page layout.
	 */
	private async createOrUpdateObjectPageLayoutWithSections(sections: readonly string[]): Promise<ObjectPageLayout> {
		const showAnchorBar = this.state.selectedLayoutMode === EasyFillLayoutMode.DETAILED;
		const settingsButtons = this.getOrCreateLayoutSettingsActions();
		const objectPageSections: ObjectPageSection[] = await this.createAllObjectPageSections(sections);
		const { heading, headerContent } = this.createHeadingWithTitleAndAiNoticeText();
		const headerTitle: ObjectPageDynamicHeaderTitle = (
			<ObjectPageDynamicHeaderTitle>
				{{
					heading,
					actions: [settingsButtons]
				}}
			</ObjectPageDynamicHeaderTitle>
		) as ObjectPageDynamicHeaderTitle;
		const existingLayout = this.tryGetScrollContainerObjectPageLayout();
		if (existingLayout) {
			Log.info("Layout already exists, adding sections to existing layout");
			objectPageSections.forEach((section: ObjectPageSection): void => {
				existingLayout.addSection(section);
			});
			existingLayout.setShowAnchorBar(showAnchorBar);
			return existingLayout;
		}
		Log.info("No existing layout found, creating a new one with sections");
		const newLayout = (
			<ObjectPageLayout
				id="sapFeEasyFillObjectPageLayout"
				showAnchorBar={showAnchorBar}
				upperCaseAnchorBar={false}
				alwaysShowContentHeader={true}
				height={"100%"}
				class={"sapUiNoContentPadding"}
			>
				{{
					headerTitle,
					headerContent,
					sections: objectPageSections
				}}
			</ObjectPageLayout>
		) as ObjectPageLayout;
		newLayout.attachNavigate((e) => {
			const subSection = e.getParameter("subSection") as ObjectPageSubSection;
			// OPL's spacer is hidden to prevent a layout feedback loop, so its native
			// scroll cannot always reach all sections - scrollIntoView is the fallback.
			setTimeout(() => {
				subSection?.getDomRef()?.scrollIntoView({ behavior: "smooth", block: "start" });
			}, 0);
		});
		return newLayout;
	}

	/**
	 * Creates all object page sections for the current AI result.
	 * @param sections Section titles to map fields into.
	 * @returns Promise resolved with created sections.
	 */
	private async createAllObjectPageSections(sections: readonly string[]): Promise<ObjectPageSection[]> {
		const aiResultUpdatedFields = this.getAiResultForFieldsFromComponentState();
		const fieldMapping: FieldMetadata = this.state.fieldMapping;
		const updatedFieldNames: string[] = Object.keys(aiResultUpdatedFields);
		const incorrectFieldsSectionTitle: string = this.getTranslatedText("C_EASYEDIT_INCORRECT_FIELDS");
		const editableFields: Record<string, { isEditable?: boolean } | undefined> = (await this.getEditableFields?.()) ?? {};
		const sectionsToFields = new Map<string, string[]>();
		sections.forEach((sectionTitle: string) => {
			sectionsToFields.set(sectionTitle, []);
		});
		if (sections.length > 1) {
			for (const fieldName of updatedFieldNames) {
				const isCollectionField: boolean = fieldMapping[fieldName]?.isCollection === true;
				const isNonEditableField: boolean = !isCollectionField && !EasyFillFieldHelper.isEditableField(fieldName, editableFields);
				const targetSection: string = isNonEditableField
					? incorrectFieldsSectionTitle
					: fieldMapping[fieldName]?.section ?? sections[0];
				sectionsToFields.get(targetSection)?.push(fieldName);
			}
		} else {
			// If only one section, assign all fields to that section
			sectionsToFields.set(sections[0], updatedFieldNames);
		}
		// Remove entries for sections that have no fields
		sectionsToFields.forEach((fieldNames: string[], sectionTitle: string): void => {
			const hasFields: boolean = fieldNames.length > 0;
			if (!hasFields) {
				Log.info("Removing section from sections to fields mapping due to no fields mapped: " + sectionTitle);
				sectionsToFields.delete(sectionTitle);
			}
		});
		const sectionCreationPromises: Promise<{
			section: ObjectPageSection;
			hasIncorrectFields: boolean;
			hasIncorrectTableFields: boolean;
		}>[] = [];
		let sectionIndex = 0;
		sectionsToFields.forEach((sectionFieldNames: string[], sectionTitle: string): void => {
			const sectionUpdatedFields: FieldValues = {};
			sectionFieldNames.forEach((fieldName: string): void => {
				const value: unknown = aiResultUpdatedFields[fieldName];
				if (value !== undefined) {
					sectionUpdatedFields[fieldName] = value;
				}
			});
			sectionCreationPromises.push(this.createObjectPageSection(sectionTitle, sectionIndex, sectionUpdatedFields));
			sectionIndex++;
		});
		const results = await Promise.all(sectionCreationPromises);
		this._hasIncorrectFields = results.some((r) => r.hasIncorrectFields);
		this._hasIncorrectTableFields = results.some((r) => r.hasIncorrectTableFields);
		this._updateWarningMessageText();
		return results.map((r) => r.section);
	}

	/**
	 * Tries to retrieve an existing object page layout from the scroll container.
	 * @returns Existing layout when available.
	 */
	private tryGetScrollContainerObjectPageLayout(): ObjectPageLayout | undefined {
		const scrollContainer: FlexBox | undefined = this.$scrollContainer.current;
		if (scrollContainer === undefined) {
			return undefined;
		}

		return scrollContainer.getItems().find((item): item is ObjectPageLayout => item instanceof ObjectPageLayout);
	}

	/**
	 * Gets existing or creates a layout mode buttons and enlarge/shrink button.
	 * @returns JSX content with action controls.
	 */
	private getOrCreateLayoutSettingsActions(): unknown[] {
		if (this.settingsButtons?.layoutModeButton === undefined) {
			this.settingsButtons = {};
			this.settingsButtons.layoutModeButton = (
				<SegmentedButton
					selectedKey={this.bindState("selectedLayoutMode")}
					selectionChange={this.onSettingsModeSelectionChange.bind(this)}
				>
					{{
						items: [
							<SegmentedButtonItem
								key={EasyFillLayoutMode.DETAILED}
								icon={"sap-icon://increase-line-height"}
								tooltip={this.getTranslatedText("C_EASYEDIT_BUTTON_DETAILED_VIEW_TOOLTIP")}
							/>,
							<SegmentedButtonItem
								key={EasyFillLayoutMode.CONDENSED}
								icon={"sap-icon://decrease-line-height"}
								tooltip={this.getTranslatedText("C_EASYEDIT_BUTTON_CONDENSED_VIEW_TOOLTIP")}
							/>
						]
					}}
				</SegmentedButton>
			) as SegmentedButton;
		}

		if (this.settingsButtons?.enlargeOrShrinkButton === undefined) {
			this.settingsButtons.enlargeOrShrinkButton = (
				<Button
					id={this.createId("easyFillEnlargeOrShrinkButton")}
					icon={"sap-icon://full-screen"}
					type={ButtonType.Transparent}
					class={"sapUiTinyMarginBegin"}
					press={this.onEnlargeOrShrinkReviewAreaButtonClick.bind(this)}
				/>
			) as Button;
		}

		return [this.settingsButtons.layoutModeButton, this.settingsButtons.enlargeOrShrinkButton];
	}

	private async createObjectPageSection(
		sectionTitle: string,
		sectionIndex: number,
		sectionUpdatedFields: FieldValues
	): Promise<{ section: ObjectPageSection; hasIncorrectFields: boolean; hasIncorrectTableFields: boolean }> {
		const sectionId = this.createId(`easyFillSection_${sectionIndex}`);
		const subSectionId = this.createId(`easyFillSubSection_${sectionIndex}`) as string;

		const uiModel = this.getPageController().getModel("ui");
		const uiContext = uiModel.createBindingContext("/easyEditDialog");
		uiModel.setProperty("/easyEditDialog", {});
		uiContext.setProperty("isEditable", true);

		const table: UI5Element[] = [];
		for (const fieldName of Object.keys(sectionUpdatedFields)) {
			const fieldMetadata = this.state.fieldMapping[fieldName];
			const rowsValue = sectionUpdatedFields[fieldName];
			if (fieldMetadata?.isCollection !== true || !Array.isArray(rowsValue) || rowsValue.length === 0) {
				continue;
			}
			const typedRowsValue = rowsValue as Array<{ _rowIndex?: number; [key: string]: unknown }>;
			const allowsCreation = this._tableData.get(fieldName)?.flags.allowsCreation === true;
			if (allowsCreation || typedRowsValue.some((r) => r._rowIndex !== undefined)) {
				this.state.hasValues = true;
				this.state.newValues[fieldName] = typedRowsValue;
			}
			table.push(this.buildTablePreviewWithCreationGuard(fieldName, fieldMetadata, typedRowsValue));
		}

		const { reviewAreaBlocks, incorrectValuesForm } = await this.getReviewAreaAndIncorrectValuesForms(sectionUpdatedFields, uiContext);

		const hasSectionIncorrectValues: boolean = incorrectValuesForm.getFormContainers().length > 0;
		incorrectValuesForm.setVisible(hasSectionIncorrectValues);
		const subSections: ObjectPageSubSection[] = EasyFillReviewAreaBuilder.createObjectPageSubSections(
			this.makeReviewAreaContext(),
			subSectionId,
			reviewAreaBlocks,
			hasSectionIncorrectValues,
			incorrectValuesForm,
			table
		);

		return {
			section: (
				<ObjectPageSection
					id={sectionId}
					titleUppercase={false}
					showTitle={this.state.selectedLayoutMode === EasyFillLayoutMode.DETAILED}
					title={sectionTitle}
					class={
						this.state.selectedLayoutMode === EasyFillLayoutMode.DETAILED
							? "sapFeEasyFillSectionDetailed"
							: "sapFeEasyFillSectionCondensed"
					}
				>
					{{
						subSections: subSections
					}}
				</ObjectPageSection>
			),
			hasIncorrectFields: hasSectionIncorrectValues,
			hasIncorrectTableFields: false
		};
	}

	private buildTablePreviewWithCreationGuard(
		fieldName: string,
		fieldMetadata: NonNullable<FieldMetadata[string]>,
		rowsValue: Array<{ _rowIndex?: number; [key: string]: unknown }>
	): UI5Element {
		const allowsCreation = this._tableData.get(fieldName)?.flags.allowsCreation === true;
		if (!allowsCreation && rowsValue.every((r) => r._rowIndex === undefined)) {
			return EasyFillReviewAreaBuilder.buildAllNewRowsWarning(this.makeReviewAreaContext(), fieldMetadata);
		}

		const rowContexts = this._existingRowContexts.get(fieldName) ?? [];
		let tablePreview = this._renderedTablePreviews.get(fieldName);
		if (!tablePreview) {
			tablePreview = this._renderTablePreview(fieldName, rowsValue, fieldMetadata, rowContexts);
			this._renderedTablePreviews.set(fieldName, tablePreview);
		}
		const { vbox: diffTable } = tablePreview;

		if (!allowsCreation && rowsValue.some((r) => r._rowIndex === undefined)) {
			return EasyFillReviewAreaBuilder.buildMixedRowsPreviewWithWarning(this.makeReviewAreaContext(), diffTable);
		}
		return diffTable;
	}

	/**
	 * Populates review forms and performs validation.
	 * The review form is split into editable and non-editable fields. Non-editable fields are shown in a separate form with a warning message.
	 * For detailed layout mode, subsection titles are rendered in the same form container as their fields.
	 * @param updatedFields Updated field values.
	 * @param uiContext UI model context.
	 * @returns Promise resolved with populated review blocks and incorrect values form.
	 */
	private async getReviewAreaAndIncorrectValuesForms(
		updatedFields: FieldValues,
		uiContext: Context
	): Promise<{ reviewAreaBlocks: UI5Element[]; incorrectValuesForm: Form }> {
		const newValues: Record<string, unknown> = {};
		const incorrectValues: Record<string, unknown> = {};
		const reviewAreaBlocks: UI5Element[] = [];
		const incorrectValuesForm: Form = EasyFillReviewAreaBuilder.createIncorrectValuesForm();

		const { editableFieldNames, nonEditableFieldNames } = await EasyFillReviewAreaBuilder.getEditableAndNotEditableFieldNames(
			this.state.fieldMapping,
			updatedFields,
			() => this.getEditableFields?.() ?? Promise.resolve({})
		);

		if (this.state.selectedLayoutMode === EasyFillLayoutMode.DETAILED) {
			await EasyFillFieldFormBuilder.populateDetailedReviewAreaBlocks(
				this.makeFieldFormBuilderContext(),
				editableFieldNames,
				updatedFields,
				uiContext,
				newValues,
				reviewAreaBlocks
			);
		} else {
			await EasyFillFieldFormBuilder.populateCondensedReviewAreaBlocks(
				this.makeFieldFormBuilderContext(),
				editableFieldNames,
				updatedFields,
				uiContext,
				newValues,
				reviewAreaBlocks
			);
		}

		EasyFillFieldFormBuilder.populateIncorrectValuesForm(
			this.makeFieldFormBuilderContext(),
			nonEditableFieldNames,
			updatedFields,
			uiContext,
			incorrectValues,
			incorrectValuesForm
		);

		this.state.newValues = newValues;
		this.state.incorrectValues = incorrectValues;
		return { reviewAreaBlocks, incorrectValuesForm };
	}

	private onEnlargeOrShrinkReviewAreaButtonClick(): void {
		const shouldSetFullScreen: boolean = this.isEnlargeIconUsed();
		if (shouldSetFullScreen) {
			this.moveSplitterToFarLeft();
			this.updateEnlargeOrShrinkButtonIconToShrink();
		} else {
			this.moveSplitterToDefault();
			this.updateEnlargeOrShrinkButtonIconToEnlarge();
		}
	}

	private isEnlargeIconUsed(): boolean {
		return this.settingsButtons?.enlargeOrShrinkButton?.getIcon() === "sap-icon://full-screen";
	}

	private moveSplitterToFarLeft(): void {
		this.moveSplitter("0%", "100%");
	}

	private moveSplitterToDefault(): void {
		this.moveSplitter("40%", "60%");
	}

	/**
	 * Changes the splitter position by setting the size of the input and review panes.
	 * @param inputPaneSize Size for the input pane (e.g., "40%").
	 * @param reviewPaneSize Size for the review pane (e.g., "60%").
	 */
	private moveSplitter(inputPaneSize: string, reviewPaneSize: string): void {
		const inputPaneId: string = this.createId("inputPane") as string;
		const reviewPaneId: string = this.createId("reviewPane") as string;
		const inputPane: SplitPane | undefined = Element.getElementById(inputPaneId) as SplitPane | undefined;
		const reviewPane: SplitPane | undefined = Element.getElementById(reviewPaneId) as SplitPane | undefined;
		inputPane?.setLayoutData(new SplitterLayoutData({ size: inputPaneSize }));
		reviewPane?.setLayoutData(new SplitterLayoutData({ size: reviewPaneSize }));
	}

	private updateEnlargeOrShrinkButtonIconToShrink(): void {
		const icon = "sap-icon://exit-full-screen";
		this.settingsButtons?.enlargeOrShrinkButton?.setIcon(icon);
		this.settingsButtons?.enlargeOrShrinkButton?.setTooltip(this.getTranslatedText("C_EASYEDIT_EXIT_FULLSCREEN_BUTTON_TOOLTIP"));
	}

	private updateEnlargeOrShrinkButtonIconToEnlarge(): void {
		const icon = "sap-icon://full-screen";
		this.settingsButtons?.enlargeOrShrinkButton?.setIcon(icon);
		this.settingsButtons?.enlargeOrShrinkButton?.setTooltip(this.getTranslatedText("C_EASYEDIT_ENTER_FULLSCREEN_BUTTON_TOOLTIP"));
	}

	private navigateToReviewPane(): void {
		const reviewAreaDom = (this.$reviewArea.current?.getDomRef as (() => HTMLElement | null) | undefined)?.();
		if (reviewAreaDom) {
			return;
		}
		const splitter = this.$responsiveSplitter.current as unknown as { _activatePage?: (index: number) => void };
		splitter?._activatePage?.(1);
		setTimeout(() => {
			const splitterDom = (this.$responsiveSplitter.current?.getDomRef as (() => HTMLElement | null) | undefined)?.();
			(splitterDom?.querySelectorAll(".sapUiResponsiveSplitterPaginatorButton")?.[1] as HTMLElement | undefined)?.focus();
		}, 0);
	}

	createContent(): Dialog {
		const easyEditDescription = <InvisibleText text={this.getTranslatedText("C_EASYEDIT_DIALOG_DESCRIPTION")} />;

		const $easyFillButton = createReference<Button>();
		const $easyFillSaveButton = createReference<Button>();
		const $easyFillCancelButton = createReference<Button>();
		const $easyFillClearAllButton = createReference<Button>();
		const dialog = (
			<Dialog
				title={this.getTranslatedText("C_EASYEDIT_DIALOG_TITLE")}
				resizable={true}
				draggable={true}
				horizontalScrolling={false}
				verticalScrolling={false}
				contentWidth="1100px"
				contentHeight={"800px"}
				escapeHandler={(): void => {
					this.onCancel();
				}}
				afterClose={(): void => {
					this.destroy();
				}}
			>
				{{
					content: (
						<ResponsiveSplitter ref={this.$responsiveSplitter}>
							<PaneContainer>
								<SplitPane requiredParentWidth="600" id={this.createId("inputPane")}>
									{{ layoutData: <SplitterLayoutData size="40%" /> }}
									<FlexBox id={this.createId("inputArea")} direction={FlexDirection.Column} fitContainer={true}>
										<VBox class={"sapUiContentPadding"}>
											<FormattedText
												htmlText={this.getTranslatedText("C_EASYEDIT_DIALOG_DESCRIPTION")}
												class={"sapUiTinyMarginBottom"}
											/>
											{easyEditDescription}
											<TextArea
												value={this.bindState("enteredText")}
												class={"sapUiTinyMarginBottom"}
												liveChange={(e): void => {
													this.state.currentlyEnteredText = e.getParameter("value") ?? "";
												}}
												width="100%"
												placeholder={this.getTranslatedText("C_EASYEDIT_TEXTAREA_PLACEHOLDER")}
												rows={20}
												growing={true}
												growingMaxLines={30}
												maxLength={MAX_LENGTH}
												ariaLabelledBy={easyEditDescription}
											/>
											<Text
												class={"sapUiTinyMarginBottom"}
												text={{
													path: "/currentlyEnteredText",
													model: "$componentState",
													formatter: this.formatRemainingCharacters.bind(this)
												}}
											>
												{{ layoutData: <FlexItemData alignSelf="End" /> }}
											</Text>
											<FlexBox wrap={FlexWrap.Wrap} direction={FlexDirection.Row} justifyContent={"End"}>
												{{ layoutData: <FlexItemData alignSelf="End" /> }}
												<Button
													text={this.getTranslatedText("C_EASYEDIT_BUTTON")}
													icon={"sap-icon://ai"}
													enabled={not(isEmpty(this.bindState("currentlyEnteredText")))}
													press={this.onEasyEditPressed.bind(this)}
													ref={$easyFillButton}
													class={"sapUiSmallMarginEnd sapUiSmallMarginBottom"}
												></Button>
												<Button
													text={this.getTranslatedText("C_EASYEDIT_DIALOG_CLEAR_ALL")}
													type={ButtonType.Transparent}
													enabled={not(isEmpty(this.bindState("currentlyEnteredText")))}
													press={this.onClearAll.bind(this)}
													ref={$easyFillClearAllButton}
												></Button>
											</FlexBox>
										</VBox>
									</FlexBox>
								</SplitPane>
								<SplitPane requiredParentWidth="600" id={this.createId("reviewPane")}>
									{{ layoutData: <SplitterLayoutData size="60%" /> }}
									<VBox height={"100%"} busy={this.bindState("isBusy")} class={"sapFeEasyFillReviewPaneWrapper"}>
										<FlexBox
											id={this.createId("reviewArea")}
											ref={this.$reviewArea}
											renderType={"Bare"}
											direction={FlexDirection.Column}
											height={"100%"}
											fitContainer={true}
											class={"sapFeEasyFillReviewArea sapFeEasyFillReviewPaneContainer"}
										>
											<IllustratedMessage
												illustrationType={IllustratedMessageType.NoSearchResults}
												illustrationSize={IllustratedMessageSize.Large}
												title={this.getTranslatedText("C_EASYEDIT_DIALOG_REVIEW_TITLE")}
												description={this.getTranslatedText("C_EASYEDIT_DIALOG_REVIEW_DESCRIPTION")}
												visible={equal(this.bindState("stateType"), "Initial")}
											/>
											<IllustratedMessage
												illustrationType={IllustratedMessageType.NoEntries}
												illustrationSize={IllustratedMessageSize.Large}
												title={this.getTranslatedText("C_EASYEDIT_DIALOG_NO_ENTRIES_TITLE")}
												description={this.getTranslatedText("C_EASYEDIT_DIALOG_NO_ENTRIES_DESCRIPTION")}
												visible={equal(this.bindState("stateType"), "NoEntries")}
											/>
											<IllustratedMessage
												illustrationType={IllustratedMessageType.UnableToLoad}
												illustrationSize={IllustratedMessageSize.Large}
												title={this.getTranslatedText("C_EASYEDIT_DIALOG_ERROR_TITLE")}
												description={this.getTranslatedText("C_EASYEDIT_DIALOG_ERROR_DESCRIPTION")}
												visible={equal(this.bindState("stateType"), "Error")}
											/>
										</FlexBox>
									</VBox>
								</SplitPane>
							</PaneContainer>
						</ResponsiveSplitter>
					),
					footer: (
						<OverflowToolbar>
							<ToolbarSpacer />
							<Button
								text={this.getTranslatedText("C_EASYEDIT_DIALOG_SAVE")}
								type="Emphasized"
								enabled={and(this.bindState("hasValues"), not(this.bindState("hasError")))}
								press={this.onConfirm.bind(this)}
								ref={$easyFillSaveButton}
							/>
							<Button
								text={this.getTranslatedText("C_EASYEDIT_DIALOG_CANCEL")}
								type="Transparent"
								press={this.onCancel.bind(this)}
								ref={$easyFillCancelButton}
							/>
						</OverflowToolbar>
					)
				}}
			</Dialog>
		);
		dialog.addStyleClass("sapFeEasyFillDialog");
		FESRHelper.setSemanticStepname($easyFillButton.current!, "press", "fai:ef:analyzeText");
		FESRHelper.setSemanticStepname($easyFillSaveButton.current!, "press", "fai:ef:save");
		FESRHelper.setSemanticStepname($easyFillCancelButton.current!, "press", "fai:ef:cancel");
		FESRHelper.setSemanticStepname($easyFillClearAllButton.current!, "press", "fai:ef:clearAll");
		return dialog;
	}

	private async getValueList(propertyPath: string): Promise<ValueListInfo | undefined> {
		const metaModel = this.getMetaModel()!;
		const valueLists = await ValueListHelper.getValueListInfo(undefined, propertyPath, undefined, metaModel);
		return valueLists[0];
	}
}
