import type { ComplexType, EntitySet, EntityType, NavigationProperty, Property, TypeDefinition } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import Localization from "sap/base/i18n/Localization";
import { isConstant } from "sap/fe/base/BindingToolkit";
import type { EnhanceWithUI5 } from "sap/fe/base/ClassSupport";
import { aggregation, association, defineUI5Class, implementInterface, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import type {
	EasyFilterBarContainer$ShowValueHelpEvent,
	EasyFilterPropertyMetadata,
	GroupLevelDefinition,
	SortDefinition,
	TokenDefinition,
	TokenSelectedValuesDefinition,
	TokenType,
	ValueHelpSelectedValuesDefinition
} from "sap/fe/controls/easyFilter/EasyFilterBarContainer";
import EasyFilterBarContainer from "sap/fe/controls/easyFilter/EasyFilterBarContainer";
import EasyFilterUtils from "sap/fe/controls/easyFilter/utils";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import BusyLocker from "sap/fe/core/controllerextensions/BusyLocker";
import type { ControlState, NavigationParameter } from "sap/fe/core/controllerextensions/ViewState";
import type IViewStateContributor from "sap/fe/core/controllerextensions/viewState/IViewStateContributor";
import { type FilterField } from "sap/fe/core/definition/FEDefinition";
import type MetaPath from "sap/fe/core/helpers/MetaPath";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { isComplexType, isEntityType, isNavigationProperty, isPathAnnotationExpression, isProperty } from "sap/fe/core/helpers/TypeGuards";
import type { TelemetryEasyFilterEvent } from "sap/fe/core/services/TelemetryServiceFactory";
import { isPathFilterable } from "sap/fe/core/templating/DataModelPathHelper";
import { hasValueHelpWithFixedValues } from "sap/fe/core/templating/PropertyHelper";
import type FilterBarAPI from "sap/fe/macros/FilterBar";
import type TableAPI from "sap/fe/macros/Table";
import {
	generateSelectParameter,
	mapValueListToCodeList,
	resolveTokenValue,
	unresolvedResult
} from "sap/fe/macros/ai/EasyFilterDataFetcher";
import type ContentSwitcher from "sap/fe/macros/contentSwitcher/ContentSwitcher";
import type FilterBar from "sap/fe/macros/controls/FilterBar";
import FilterUtils from "sap/fe/macros/filter/FilterUtils";
import DraftEditState from "sap/fe/macros/filterBar/DraftEditState";
import ValueListHelper, { type ValueListInfo } from "sap/fe/macros/internal/valuehelp/ValueListHelper";
import type UI5Event from "sap/ui/base/Event";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import type { $ControlSettings } from "sap/ui/core/Control";
import UI5Element from "sap/ui/core/Element";
import DateFormat from "sap/ui/core/format/DateFormat";
import ControlVariantApplyAPI from "sap/ui/fl/apply/api/ControlVariantApplyAPI";
import type { VariantManagement$SelectEvent } from "sap/ui/fl/variants/VariantManagement";
import ControlPersonalizationWriteAPI from "sap/ui/fl/write/api/ControlPersonalizationWriteAPI";
import type MDCTable from "sap/ui/mdc/Table";
import type { ConditionObject } from "sap/ui/mdc/condition/Condition";
import OperatorName from "sap/ui/mdc/enums/OperatorName";
import StateUtil from "sap/ui/mdc/p13n/StateUtil";
import FilterOperator from "sap/ui/model/FilterOperator";
import JSONModel from "sap/ui/model/json/JSONModel";
import DateTimeOffset from "sap/ui/model/odata/type/DateTimeOffset";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type { CodeList } from "ux/eng/fioriai/reuse/easyfilter/EasyFilter";

type EasyFilterBarState = {};
type FieldMetadata = EasyFilterPropertyMetadata & { maxLength?: number; sortable?: boolean };
type VariantModelItem = { key: string; executeOnSelect: boolean };
type VMWithContext = { oContext?: { getObject: () => { variants?: VariantModelItem[] } } };

/**
 * Delivery for beta release for the easy filter feature.
 */
@defineUI5Class("sap.fe.macros.EasyFilterBar")
export default class EasyFilterBar extends BuildingBlock implements IViewStateContributor<EasyFilterBarState> {
	@implementInterface("sap.fe.core.controllerextensions.viewState.IViewStateContributor")
	__implements__sap_fe_core_controllerextensions_viewState_IViewStateContributor!: boolean;

	@association({ type: "sap.fe.macros.FilterBar" })
	filterBar!: string;

	@association({ type: "sap.fe.macros.contentSwitcher.ContentSwitcher" })
	contentSwitcher!: string;

	@property({ type: "string" })
	contentSwitcherKey?: string;

	@property({ type: "string" })
	contextPath?: string;

	@aggregation({ type: "sap.fe.controls.easyFilter.EasyFilterBarContainer" })
	content?: EnhanceWithUI5<EasyFilterBarContainer>;

	private filterBarMetadata!: FieldMetadata[];

	private easyFilterPath?: string;

	private recommendedQueries?: string[];

	// True when the user manually edits tokens; consumed by onAfterSearch to call setEditable(false)
	// after the flex model refresh (triggered by the token change) has already settled.
	private tokensDirtyByUser = false;

	/**
	 * Tracks how many concurrent operations have suspended the table state
	 * change handler. The handler is only reattached when the count drops
	 * back to zero, which prevents one operation from prematurely resuming
	 * the handler while another operation is still in progress.
	 */
	private tableStateChangeHandlerSuspendCount = 0;

	/**
	 * Flips to true on the first call to onVariantApplied
	 */
	private isControlRendered = false;

	constructor(properties: $ControlSettings & PropertiesOf<EasyFilterBar>, others?: $ControlSettings) {
		super(properties, others);
		this.attachTableStateChangeHandler();
		this.getAppComponent()
			?.getEnvironmentCapabilities()
			.prepareFeature("MagicFiltering")
			.then(() => {
				this.easyFilterPath = "ux/eng/fioriai/reuse/easyfilter/EasyFilter";
				this.content?.setEasyFilterLib(this.easyFilterPath);
				return;
			})
			.catch((error) => {
				Log.debug("Error while loading EasyFilter", error);
				return undefined;
			});
	}

	async applyLegacyState(
		getContrilState?: (control: ManagedObject) => ControlState,
		oNavParameters?: NavigationParameter,
		_shouldApplyDiffState?: boolean,
		_skipMerge?: boolean
	): Promise<void> {
		if (oNavParameters?.selectionVariant) {
			const selectOptionsNames = oNavParameters.selectionVariant.getSelectOptionsPropertyNames();
			this.filterBarMetadata.forEach((field) => {
				if (selectOptionsNames.includes(field.name)) {
					field.defaultValue = oNavParameters.selectionVariant!.getSelectOption(field.name)?.reduce((acc, option) => {
						if (option.Sign === "I") {
							if (option.Option === FilterOperator.BT || option.Option === FilterOperator.NB) {
								if (option.High !== null && option.High !== undefined) {
									acc.push({ operator: option.Option, selectedValues: [option.Low, option.High] });
								}
							} else {
								acc.push({
									operator: option.Option as Exclude<FilterOperator, FilterOperator.BT | FilterOperator.NB>,
									selectedValues: [option.Low]
								});
							}
						} else {
							acc.push({ operator: FilterOperator.NE, selectedValues: [option.Low] });
						}
						return acc;
					}, [] as TokenSelectedValuesDefinition[]);
				}
			});
			this.content?.resetState(false);
		}
		return Promise.resolve(undefined);
	}

	applyState(_state: EasyFilterBarState, _oNavParameters?: NavigationParameter): Promise<void> | void {
		return undefined;
	}

	retrieveState(): EasyFilterBarState | null {
		return {};
	}

	getApplicationId(): string {
		return this.getAppComponent()?.getManifestEntry("sap.app").id ?? "<unknownID>";
	}

	onMetadataAvailable(): void {
		this.filterBarMetadata = this.prepareFilterBarMetadata();
		this.recommendedQueries = this.getAppComponent()?.getManifestEntry("sap.fe")?.macros?.easyFilter?.recommendedQueries ?? [];
		this.content = this.createContent() as EnhanceWithUI5<EasyFilterBarContainer>;
		this.content.filterBarMetadata = this.filterBarMetadata;

		const contentSwitcher = UI5Element.getElementById(this.contentSwitcher) as ContentSwitcher | undefined;
		contentSwitcher?.attachEvent("selectionChange", this.onContentSwitcherSelectionChange.bind(this));

		const filterBarAPI = this.getFilterBarAPI();
		filterBarAPI?.attachEvent("search", this.onAfterSearch, this);
		const vm = filterBarAPI?.getVariantManagement();
		if (vm) {
			// attachVariantApplied only registers its listener after the EasyFilterBar is in the DOM
			// (waitForControlToBeRendered, ControlVariantApplyAPI.js). On first load the EasyFilterBar is
			// hidden behind the compact filter tab, so it has no DOM ref yet — any variant switch before the
			// AI tab is first shown would be silently missed. attachSelect fires synchronously on every switch
			// regardless of DOM state, so it catches those early switches via onVariantSelected.
			vm.attachSelect(this.onVariantSelected.bind(this));
			ControlVariantApplyAPI.attachVariantApplied({
				selector: this,
				vmControlId: vm.getId(),
				callback: this.onVariantApplied.bind(this),
				callAfterInitialVariant: true
			});
		}
	}

	private getFilterBarAPI(): FilterBarAPI | undefined {
		const filterBar = UI5Element.getElementById(this.filterBar) as FilterBar | undefined;
		return filterBar?.getParent() as FilterBarAPI | undefined;
	}

	private onVariantSelected(e: VariantManagement$SelectEvent): void {
		if (!this.isControlRendered) {
			const key = e.getParameter("key");
			if (!key) {
				return;
			}
			const filterBar = UI5Element.getElementById(this.filterBar) as FilterBar | undefined;
			const vm = (filterBar?.getParent() as FilterBarAPI | undefined)?.getVariantManagement();
			if (!vm) {
				return;
			}

			const variants = (vm as unknown as VMWithContext).oContext?.getObject()?.variants ?? [];
			const executeOnSelect = variants.find((v) => v.key === key)?.executeOnSelect ?? false;
			this.onVariantApplied({ executeOnSelect });
		}
	}

	private onVariantApplied(variant: { executeOnSelect: boolean }): void {
		this.getFilterBarAPI()?.getVariantManagement()?.setEditable(true);

		const contentSwitcher = UI5Element.getElementById(this.contentSwitcher) as ContentSwitcher | undefined;
		if (contentSwitcher?.selectedKey !== "ai") {
			return;
		}

		this.isControlRendered = true;

		this.content?.clearFiltersAndTokens();

		if (variant.executeOnSelect) {
			this.content?.onGoPress(this.content.getQuery());
		}
	}

	private onContentSwitcherSelectionChange(): void {
		const contentSwitcher = UI5Element.getElementById(this.contentSwitcher) as ContentSwitcher | undefined;
		const selectedKey = contentSwitcher?.$segmentedButton.current?.getSelectedKey();

		if (selectedKey !== this.contentSwitcherKey) {
			// Switching away from the AI tab — re-enable Save/Save As
			this.getFilterBarAPI()?.getVariantManagement()?.setEditable(true);
			return;
		}

		const filterBar = UI5Element.getElementById(this.filterBar) as FilterBar | undefined;
		const filterBarAPI = this.getFilterBarAPI();
		if (!filterBar || !filterBarAPI) {
			Log.warning("ContentSwitcher selection changed to EasyFilterBar, but FilterBar or FilterBarAPI could not be found.");
			return;
		}

		if (!filterBarAPI._hasPendingFilters) {
			filterBar.fireFiltersChanged({ conditionsBased: true });
		}
	}

	/**
	 * Attaches a state change handler that detects manual table sort changes.
	 * When the user sorts the table manually and the easy filter has sort definitions,
	 * the easy filter input is greyed out (dirty state).
	 */
	private attachTableStateChangeHandler(): void {
		StateUtil.detachStateChange(this.tableStateChangeHandler);
		StateUtil.attachStateChange(this.tableStateChangeHandler);
	}

	/**
	 * Suspends the table state change handler to prevent false external-change
	 * notifications while the easy filter itself is driving table state updates.
	 * Uses reference counting so that multiple concurrent callers (for example
	 * sorters and group levels applied in parallel) do not interfere with each
	 * other. The handler remains attached but ignores events while suspended.
	 * Must be paired with {@link resumeTableStateChangeHandler}.
	 */
	private suspendTableStateChangeHandler(): void {
		this.tableStateChangeHandlerSuspendCount++;
	}

	/**
	 * Resumes the table state change handler after a programmatic table state
	 * update. The decrement is deferred to the next macrotask so that any
	 * pending stateChange events queued internally by MDC (via its own
	 * setTimeout) are dispatched while the suspend count is still elevated
	 * and therefore ignored by the handler.
	 * Events are only processed again once every caller that suspended
	 * it has called resume (reference count drops to zero).
	 */
	private async resumeTableStateChangeHandler(): Promise<void> {
		return new Promise<void>((resolve) => {
			setTimeout(() => {
				this.tableStateChangeHandlerSuspendCount--;
				if (this.tableStateChangeHandlerSuspendCount < 0) {
					Log.error("EasyFilterBar: resumeTableStateChangeHandler called more times than suspendTableStateChangeHandler.");
					this.tableStateChangeHandlerSuspendCount = 0;
				}
				resolve();
			}, 0);
		});
	}

	/**
	 * Handles state changes on MDC Table controls to detect manual sort changes.
	 * If the table sort was changed externally (not by the easy filter), the container
	 * is notified so it can decide whether to mark the filter input as dirty.
	 * @param oEvent The state change event.
	 */
	tableStateChangeHandler = (oEvent: UI5Event<{ control: Control }>): void => {
		if (!this.content || this.tableStateChangeHandlerSuspendCount > 0) {
			return;
		}

		const control = oEvent.getParameter("control");
		if (!control.isA<MDCTable>("sap.ui.mdc.Table")) {
			return;
		}

		// Check that this table is associated with the same filter bar
		const tableFilterBarId = control.getFilter?.();
		if (!tableFilterBarId || tableFilterBarId !== this.filterBar) {
			return;
		}

		this.content.notifyExternalTableStateChange();
	};

	override destroy(suppressInvalidate?: boolean): void {
		StateUtil.detachStateChange(this.tableStateChangeHandler);
		this.tableStateChangeHandlerSuspendCount = 0;

		const filterBarAPI = this.getFilterBarAPI();
		filterBarAPI?.detachEvent("search", this.onAfterSearch, this);
		const vm = filterBarAPI?.getVariantManagement();
		if (vm) {
			ControlVariantApplyAPI.detachVariantApplied({ selector: this, vmControlId: vm.getId() });
		}

		super.destroy(suppressInvalidate);
	}

	private getUnitForProperty(prop: Property, basePath: string): string | undefined {
		const unitAnnotation = prop.annotations.Measures?.ISOCurrency ?? prop.annotations.Measures?.Unit;
		return isPathAnnotationExpression(unitAnnotation) ? `${basePath}/${unitAnnotation.path}` : undefined;
	}

	private getDefaultValueForFilterField(
		field: FilterField,
		startupParameters: Record<string, unknown>
	): TokenSelectedValuesDefinition[] | undefined {
		let defaultValue: TokenSelectedValuesDefinition[] | undefined;
		if (startupParameters.hasOwnProperty(field.name)) {
			defaultValue = [
				{
					operator: FilterOperator.EQ,
					selectedValues: startupParameters[field.name] as TokenSelectedValuesDefinition["selectedValues"]
				}
			];
		} else if (field.isParameter && startupParameters.hasOwnProperty(field.name.substring(2))) {
			defaultValue = [
				{
					operator: FilterOperator.EQ,
					selectedValues: startupParameters[field.name.substring(2)] as TokenSelectedValuesDefinition["selectedValues"]
				}
			];
		}
		return defaultValue;
	}

	private getEditStateFilterMetadata(metaModel: ODataMetaModel): FieldMetadata {
		// Assemble the code list for the editing status filter values:
		const props = new JSONModel({
			isDraftCollaborative: ModelHelper.isCollaborationDraftSupported(metaModel)
		}).createBindingContext("/");

		const editingStatusCodeList = DraftEditState.getEditStatesContext(props)
			.getObject("/")
			.map((state: { id: string; display: string }) => ({ value: state.id, description: state.display }));

		return {
			name: "$editState",
			label: this.getTranslatedText("FILTERBAR_EDITING_STATUS"),
			dataType: "Edm.String",
			filterable: true,
			codeList: editingStatusCodeList,
			type: "MenuWithSingleSelect"
		};
	}

	private getTokenType(prop: Property, filterRestriction: string): TokenType {
		if (hasValueHelpWithFixedValues(prop)) {
			return filterRestriction === "SingleValue" ? "MenuWithSingleSelect" : "MenuWithCheckBox";
		}
		switch (prop.type) {
			case "Edm.Date":
				return "Calendar";
			case "Edm.TimeOfDay":
				return "Time";
			default:
				return "ValueHelp";
		}
	}

	private getLabel(element: Property | NavigationProperty | EntityType | ComplexType): string | undefined {
		const label = element.annotations.Common?.Label?.toString();
		const headerInfoTypeName = isEntityType(element) ? (element.annotations.UI?.HeaderInfo?.TypeName?.valueOf() as string) : undefined;
		const result = headerInfoTypeName || label;

		if (this.isComplexProperty(element) || isNavigationProperty(element)) {
			return result || this.getLabel(element.targetType);
		}

		return result;
	}

	private isScalarProperty(element: unknown): element is Property & { targetType?: TypeDefinition } {
		return isProperty(element) && !isComplexType(element.targetType);
	}

	private isComplexProperty(element: unknown): element is Property & { targetType: ComplexType } {
		return isProperty(element) && isComplexType(element.targetType);
	}

	prepareFilterBarMetadata(): FieldMetadata[] {
		/*
		 * 1. INITIALIZATION:
		 *    - Queue all root entity properties and navigation properties for traversal
		 *    - Initialize result array and elimination set for Common.Text targets
		 *
		 * 2. BREADTH-FIRST TRAVERSAL:
		 *    For each path in queue:
		 *    - Skip UI.Hidden properties
		 *    - Scalar properties: Generate metadata, track Common.Text targets for elimination
		 *    - Complex properties: Add child properties to queue
		 *    - Navigation properties: Add target EntityType properties to queue
		 *      (Collections only if explicit filter fields exist, respect depth limits)
		 *
		 * 3. POST-PROCESSING:
		 *    - Add $editState filter for draft-enabled entities
		 *    - Remove properties marked for elimination (except explicit filter fields)
		 */
		const owner = this._getOwner()!;
		const definitionForPage = owner.preprocessorContext?.getDefinitionForPage();

		if (!definitionForPage) {
			return [];
		}

		const filterBarDef = definitionForPage.getFilterBarDefinition({});
		const metaPath = definitionForPage.getMetaPath();
		const entitySet = metaPath.getClosestEntitySet() as EntitySet;

		let filterExpressionRestrictions = entitySet.annotations.Capabilities?.FilterRestrictions?.FilterExpressionRestrictions ?? [];
		const sortRestrictions = entitySet.annotations.Capabilities?.SortRestrictions;

		// Collect non-sortable properties from SortRestrictions
		const nonSortableProperties = new Set<string>();

		// Check if the entity set is sortable overall
		const entitySetSortable = sortRestrictions?.Sortable !== false;

		// Add non-sortable properties from main entity set
		sortRestrictions?.NonSortableProperties?.forEach((propertyPath) => {
			if (propertyPath.value) {
				nonSortableProperties.add(`/${entitySet.name}/${propertyPath.value}`);
			}
		});

		// TODO: Maybe we can simplify this by using restrictions on the main entity set only
		for (const navigationProperty in entitySet.navigationPropertyBinding) {
			if (entitySet.navigationPropertyBinding[navigationProperty]?._type === "EntitySet") {
				// FIXME: optional chaining should not be needed here -> root cause fix pending
				const navigationPropertyEntitySet = entitySet.navigationPropertyBinding[navigationProperty] as EntitySet;
				const navPropertyFilterExpressionRestrictions =
					navigationPropertyEntitySet.annotations.Capabilities?.FilterRestrictions?.FilterExpressionRestrictions ?? [];

				const currentFilterRestrictions = [...filterExpressionRestrictions];
				filterExpressionRestrictions = [
					...filterExpressionRestrictions,
					...navPropertyFilterExpressionRestrictions.filter((restriction) => !currentFilterRestrictions.includes(restriction))
				];

				// Collect SortRestrictions from navigation property entity sets
				const navSortRestrictions = navigationPropertyEntitySet.annotations.Capabilities?.SortRestrictions;
				if (navSortRestrictions?.Sortable === false) {
					// If navigation entity set is not sortable, mark all its properties as non-sortable
					navigationPropertyEntitySet.entityType.entityProperties.forEach((prop) => {
						nonSortableProperties.add(`/${entitySet.name}/${navigationProperty}/${prop.name}`);
					});
				} else {
					// Add specific non-sortable properties from navigation entity set
					navSortRestrictions?.NonSortableProperties?.forEach((propertyPath) => {
						if (propertyPath.value) {
							nonSortableProperties.add(`/${entitySet.name}/${navigationProperty}/${propertyPath.value}`);
						}
					});
				}
			}
		}

		const metaModel = owner.preprocessorContext?.models.metaModel as ODataMetaModel;

		const getCodeList = (lastPathSegment: Property, propertyPath: string): CodeList | (() => Promise<CodeList>) | undefined =>
			hasValueHelpWithFixedValues(lastPathSegment)
				? async (): Promise<CodeList> => this.getCodeListForProperty(propertyPath)
				: undefined;

		const filterFields = filterBarDef
			.getFilterFields()
			.filter((field: FilterField) => !field.getTarget()?.annotations?.UI?.HiddenFilter?.valueOf());

		const startupParameters = owner.getAppComponent().getComponentData()?.startupParameters ?? {};

		const maxDepth = 1; // Maximum depth for navigation properties

		// Initialize traversal queue with all entity properties and navigation properties.
		// Each path to traverse is a list of segments (e.g. [navProp1, complexProp1, complexProp2, scalarProp])
		const pathsToExplore: (Property | NavigationProperty)[][] = [
			...entitySet.entityType.entityProperties,
			...entitySet.entityType.navigationProperties
		].map((element) => [element]);

		// Resulting metadata array
		const result: FieldMetadata[] = [];

		// Set of property paths to be eliminated from the filter bar metadata
		const pathsToEliminate = new Set<string>();

		const getPathLabel = (path: (Property | NavigationProperty)[]): string => {
			const pathLabels = path.map((e) => this.getLabel(e) || `[${e.name}]`);
			return Localization.getRTL() ? pathLabels.slice().reverse().join(" - ") : pathLabels.join(" - ");
		};

		while (pathsToExplore.length > 0) {
			const currentPath = pathsToExplore.shift()!;

			const navigationDepth = currentPath.filter(isNavigationProperty).length;

			const lastPathSegment = currentPath[currentPath.length - 1];

			if (lastPathSegment.annotations.UI?.Hidden?.valueOf() === true) {
				continue;
			}

			const pathString = [`/${entitySet.name}`, ...currentPath.slice(0, -1).map((e) => e.name)].reduce(
				(acc, curr) => `${acc}/${curr}`
			);
			const propertyPath = `${pathString}/${lastPathSegment.name}`;

			if (this.isScalarProperty(lastPathSegment)) {
				// Check for Common.Text annotation and record the annotation target path for elimination
				const textAnnotation = lastPathSegment.annotations.Common?.Text;
				if (isPathAnnotationExpression(textAnnotation)) {
					// Construct the full path to the target property
					pathsToEliminate.add(`${pathString}/${textAnnotation.path}`);
				}

				// Scalar property: create metadata for the property
				const filterField = filterFields.find((field) => field.getTarget() === lastPathSegment);
				const filterRestriction = filterExpressionRestrictions.find(
					(expression) => expression.Property?.$target === lastPathSegment
				);
				const filterable = isPathFilterable(this.getDataModelObjectPath(propertyPath));
				const filterableExpression = isConstant(filterable) ? filterable.value : true;
				const filterRestrictionExpression = filterRestriction?.AllowedExpressions as
					| EasyFilterPropertyMetadata["filterRestriction"]
					| undefined;
				const codeList = getCodeList(lastPathSegment, propertyPath);

				// Determine sortability based on SortRestrictions
				const sortable = entitySetSortable && !nonSortableProperties.has(propertyPath);

				const metadata: FieldMetadata = {
					name: propertyPath,
					label: getPathLabel(currentPath),
					dataType: lastPathSegment.type,
					required: filterField?.required,
					defaultValue: filterField ? this.getDefaultValueForFilterField(filterField, startupParameters) : undefined,
					filterable: filterField ? filterableExpression : undefined,
					hiddenFilter: !filterField,
					filterRestriction: filterField ? filterRestrictionExpression : undefined,
					codeList,
					type: this.getTokenType(
						lastPathSegment,
						filterRestriction?.AllowedExpressions?.toString() || "MultiRangeOrSearchExpression"
					) as Exclude<TokenType, "ValueHelp">,
					unit: this.getUnitForProperty(lastPathSegment, pathString),
					sortable,
					groupable: sortable
				};
				result.push(metadata);
			} else if (this.isComplexProperty(lastPathSegment)) {
				// Complex property: add all properties and navigation properties of the complex type
				lastPathSegment.targetType.properties.forEach((child) => {
					pathsToExplore.push([...currentPath, child]);
				});

				// only traverse navigation properties if we are not at the maximum depth
				if (navigationDepth < maxDepth) {
					lastPathSegment.targetType.navigationProperties.forEach((child) => {
						pathsToExplore.push([...currentPath, child]);
					});
				}
			} else if (isNavigationProperty(lastPathSegment)) {
				// add 1:n navigation properties only if there are filter fields for at least one of the target properties
				if (lastPathSegment.isCollection && !filterFields.some((field) => field.annotationPath?.startsWith(propertyPath))) {
					continue;
				}

				lastPathSegment.targetType.entityProperties.forEach((child) => {
					pathsToExplore.push([...currentPath, child]);
				});

				// only traverse navigation properties if we are not at the maximum depth
				if (navigationDepth < maxDepth) {
					lastPathSegment.targetType.navigationProperties.forEach((child) => {
						pathsToExplore.push([...currentPath, child]);
					});
				}
			}
		}

		// [Editing Status]
		if (ModelHelper.isMetaPathDraftSupported(definitionForPage.getMetaPath() as unknown as MetaPath<unknown>)) {
			result.push(this.getEditStateFilterMetadata(metaModel));
		}

		// Remove properties marked for elimination (unless they are filter fields)
		return result.filter((metadata) => {
			return (
				!metadata.hiddenFilter || // Keep if explicit filter field
				!pathsToEliminate.has(metadata.name) // Keep if path not marked for elimination
			);
		});
	}

	async getCodeListForProperty(propertyPath: string): Promise<CodeList> {
		const defaultValueList = await this.getValueList(propertyPath);

		if (!defaultValueList) {
			return [];
		}

		const valueListInfo = defaultValueList.valueListInfo;

		const listBinding = valueListInfo.$model.bindList(`/${valueListInfo.CollectionPath}`, undefined, undefined, undefined, {
			$select: generateSelectParameter(defaultValueList)
		});
		const data = await listBinding.requestContexts();

		const filterGroupValues = data.map(mapValueListToCodeList(defaultValueList));
		const codeListProperty = this.filterBarMetadata.find((field) => field.name === propertyPath);
		if (codeListProperty) {
			codeListProperty.codeList = filterGroupValues;
		}
		return filterGroupValues;
	}

	async resolveTokenValuesForField(
		fieldName: string,
		values: TokenSelectedValuesDefinition[]
	): Promise<ValueHelpSelectedValuesDefinition[]> {
		const field = this.filterBarMetadata.find(({ name }) => name === fieldName);
		let result: ValueHelpSelectedValuesDefinition[];

		if (!field) {
			// return original values converted to the expected format if no field is defined
			return unresolvedResult(values);
		}
		const valueList = await this.getValueList(field.name);

		if (valueList && ValueListHelper.isValueListSearchable(field.name, valueList)) {
			const resolvedTokenValues = await Promise.all(values.map(async (value) => resolveTokenValue(valueList, value)));
			result = resolvedTokenValues.flat();
		} else {
			result = unresolvedResult(values);
		}

		// if no maxLength is defined, return unfiltered result
		return result;
	}

	async getValueList(fieldName: string): Promise<ValueListInfo | undefined> {
		const metaModel = this.getMetaModel()!;
		const valueLists = await ValueListHelper.getValueListInfo(undefined, fieldName, undefined, metaModel);
		return valueLists[0];
	}

	async onTokensChanged(e: UI5Event<{ tokens: TokenDefinition[]; reset: boolean }, EasyFilterBarContainer>): Promise<void> {
		const filterBar = UI5Element.getElementById(this.filterBar) as FilterBar;
		// If reset=true, turn on dirty state (gray overlay) without triggering search
		if (e.getParameter("reset")) {
			filterBar.fireFiltersChanged({ conditionsBased: true });
			return;
		}

		const filterBarAPI = filterBar.getParent() as FilterBarAPI;
		const tokens = e.getParameter("tokens");
		const clearEditFilter = tokens.some((tokenDefinition) => tokenDefinition.key === "$editState");
		await filterBarAPI._clearFilterValuesWithOptions(filterBar, { clearEditFilter });
		this.formateDataTypes(tokens);

		for (const token of tokens) {
			if (token.key === "$editState") {
				// convert the $editState filter condition
				for (const tokenKeySpecification of token.keySpecificSelectedValues) {
					await FilterUtils.addFilterValues(
						filterBarAPI.content,
						token.key,
						"DRAFT_EDIT_STATE",
						tokenKeySpecification.selectedValues
					);
				}
			} else {
				const field = this.filterBarMetadata.find((f) => f.name === token.key)!;
				for (const tokenKeySpecification of token.keySpecificSelectedValues) {
					const { operator, selectedValues } = tokenKeySpecification;
					if (operator === FilterOperator.NB) {
						await FilterUtils.addFilterValues(filterBarAPI.content, field.name, OperatorName.NOTBT, selectedValues);
					} else {
						await FilterUtils.addFilterValues(filterBarAPI.content, field.name, operator, selectedValues);
					}
				}
			}
		}
		this.fireTelemetryEvent(tokens.length);
		await filterBarAPI.triggerSearch();
	}

	private onTokensChangedByUser(): void {
		// setEditable(false) cannot be called here directly: showFooter on the inner sap.m VM is
		// one-way bound to variantsEditable in the VariantModel, so the flex write triggered by
		// onTokensChanged → triggerSearch → ControlPersonalizationWriteAPI.add causes a
		// VariantModel.refresh() that re-pushes variantsEditable=true and overwrites the call.
		// We defer to onAfterSearch, which runs after that refresh has settled.
		// NOTE: replace with vm.setCreationAllowed(false) once sap.ui.fl exposes it on the wrapper.
		this.tokensDirtyByUser = true;
	}

	private onAfterSearch(): void {
		if (this.tokensDirtyByUser) {
			this.tokensDirtyByUser = false;
			this.getFilterBarAPI()?.getVariantManagement()?.setEditable(false);
		}
	}

	private fireTelemetryEvent(countFilterTokens: number): void {
		const queryText = this.content?.getQuery?.()?.trim() ?? "";
		const telemetryEvent: TelemetryEasyFilterEvent = {
			type: "FE.EasyFilter",
			parameters: {
				countFilterTokens,
				countQueryWords: queryText === "" ? 0 : queryText.split(/\s+/).length
			}
		};
		this.getAppComponent()?.getTelemetryService()?.storeAction(telemetryEvent);
	}

	/**
	 * Handles the sortersChanged event from the EasyFilterBarContainer.
	 * @param e The sortersChanged event containing sort definitions.
	 */
	async onSortersChanged(e: UI5Event<{ sorters?: SortDefinition[] }, EasyFilterBarContainer>): Promise<void> {
		const sorters = e.getParameter("sorters");

		try {
			const filterBar = UI5Element.getElementById(this.filterBar) as FilterBar | undefined;
			if (!filterBar) {
				Log.error("EasyFilterBar.onSortersChanged: FilterBar not found.", this.filterBar);
				return;
			}

			const filterBarAPI = filterBar.getParent() as FilterBarAPI | undefined;
			if (!filterBarAPI) {
				Log.error("EasyFilterBar.onSortersChanged: FilterBarAPI not found.");
				return;
			}

			this.suspendTableStateChangeHandler();
			try {
				if (!sorters || sorters.length === 0) {
					await FilterUtils.clearSortersFromTable(filterBarAPI.content);
				} else {
					await FilterUtils.applySortersToTable(filterBarAPI.content, sorters);
				}
			} finally {
				await this.resumeTableStateChangeHandler();
			}
		} catch (error) {
			Log.error("EasyFilterBar.onSortersChanged: Failed to apply sorters.", error as string);
		}
	}

	/**
	 * Handles the groupLevelsChanged event fired by EasyFilterBarContainer.
	 * Applies the group levels directly to all MDC tables without using tokens.
	 * @param e The event carrying the groupLevels from the AI result
	 */
	async onGroupLevelsChanged(e: UI5Event<{ groupLevels: GroupLevelDefinition[] }, EasyFilterBarContainer>): Promise<void> {
		try {
			const groupLevels = e.getParameter("groupLevels");
			await this.applyGroupToTables(groupLevels);
		} catch (error) {
			Log.warning("EasyFilterBar: unexpected error while handling groupLevelsChanged", String(error));
		}
	}

	/**
	 * Applies group levels to all MDC tables on the page.
	 * Normalizes OData paths, for example "/SalesOrderManage/SoldToParty" → "SoldToParty") and
	 * prefixes with "Property::" when the table's propertyInfos require it.
	 * @param groupLevels
	 */
	private async applyGroupToTables(groupLevels: GroupLevelDefinition[]): Promise<void> {
		const pageController = this.getPageController() as unknown as { _getControls?: (type: string) => unknown[] };
		const tableControls: unknown[] = pageController?._getControls?.("table") ?? [];

		this.suspendTableStateChangeHandler();
		try {
			await Promise.all(
				tableControls.map(async (tableControl) => {
					try {
						const tableAPI = (tableControl as MDCTable).getParent() as TableAPI;
						const propertyInfoNames = tableAPI.getEnhancedFetchedPropertyInfos().map((p) => p.key);
						// Strips OData path segments (via EasyFilterUtils.resolvePropertyName) then applies
						// the "Property::" prefix convention used by some MDC table implementations.
						const getTablePropertyKey = (name: string): string => {
							const plainName = EasyFilterUtils.resolvePropertyName(name);
							return propertyInfoNames.includes(`Property::${plainName}`) ? `Property::${plainName}` : plainName;
						};

						// Retrieve existing group state and mark all previous groups as ungrouped
						// to ensure a full replacement rather than a merge.
						const currentState = await StateUtil.retrieveExternalState(
							tableControl as Parameters<typeof StateUtil.retrieveExternalState>[0]
						);
						const resetGroupLevels = (currentState.groupLevels ?? []).map((g: { key: string }) => ({
							key: g.key,
							grouped: false
						}));

						const newGroupLevels = groupLevels.map((g) => ({
							key: getTablePropertyKey(g.key)
						}));

						await StateUtil.applyExternalState(tableControl as Parameters<typeof StateUtil.applyExternalState>[0], {
							groupLevels: [...resetGroupLevels, ...newGroupLevels]
						});
					} catch (error) {
						Log.warning("EasyFilterBar: failed to apply group state to table", String(error));
					}
				})
			);
		} finally {
			await this.resumeTableStateChangeHandler();
		}
	}

	//We need the below function so that the date objects and dateTimeOffsets would be converted to string type as the date object is not a valid type in V4 world
	formateDataTypes(tokens: TokenDefinition[]): void {
		const dateTimeOffsetType = new DateTimeOffset(undefined, { V4: true });
		// UTC: true avoids off-by-one in negative-offset zones; pattern locks the V4 wire format.
		const dateFormatter = DateFormat.getDateInstance({ UTC: true, pattern: "yyyy-MM-dd" });
		const timeFormatter = DateFormat.getTimeInstance({ UTC: true, pattern: "HH:mm:ss" });
		tokens.forEach((token) => {
			const edmType = this.filterBarMetadata.find((data) => data.name === token.key)?.dataType;
			if (edmType !== "Edm.Date" && edmType !== "Edm.TimeOfDay" && edmType !== "Edm.DateTimeOffset") {
				return;
			}
			token.keySpecificSelectedValues.forEach((keySpecificSelectedValue) => {
				keySpecificSelectedValue.selectedValues.forEach((value, idx) => {
					if (!(value instanceof Date)) {
						return;
					}
					switch (edmType) {
						case "Edm.Date":
							keySpecificSelectedValue.selectedValues[idx] = dateFormatter.format(value);
							break;
						case "Edm.TimeOfDay":
							keySpecificSelectedValue.selectedValues[idx] = timeFormatter.format(value);
							break;
						case "Edm.DateTimeOffset":
							keySpecificSelectedValue.selectedValues[idx] = dateTimeOffsetType.parseValue(value, "object");
							break;
						default:
							break;
					}
				});
			});
		});
	}

	async showValueHelpForKey(key: string): Promise<ConditionObject[]> {
		const field = this.filterBarMetadata.find((f) => f.name === key)!;
		const filterBar = UI5Element.getElementById(this.filterBar) as FilterBar;
		const filterBarAPI = filterBar.getParent() as FilterBarAPI;
		await filterBarAPI.showFilterField(field.name);
		return filterBarAPI.openValueHelpForFilterField(field.name);
	}

	/**
	 * Updates sorting and grouping support based on associated table personalization settings.
	 */
	private updatePersonalizationSupport(): void {
		const pageController = this.getPageController() as unknown as { _getControls?: (type: string) => unknown[] };
		const tableControls = (pageController?._getControls?.("table") ?? []) as MDCTable[];

		if (tableControls.length === 0) {
			// No tables detected — default to supported to avoid false warnings.
			this.content?.setPersonalizationSupport(true, true);
			return;
		}

		let supportsSorting = false;
		let supportsGrouping = false;

		// A capability is considered supported if at least one table has it in its P13n mode.
		for (const table of tableControls) {
			const p13nMode = table.getP13nMode?.() ?? [];
			if (p13nMode.includes("Sort")) {
				supportsSorting = true;
			}
			if (p13nMode.includes("Group")) {
				supportsGrouping = true;
			}
			if (supportsSorting && supportsGrouping) {
				break;
			}
		}

		this.content?.setPersonalizationSupport(supportsSorting, supportsGrouping);
	}

	private liveChangeDebounceTimer: number | undefined;

	private registerQueryPersonalizationChange(query: string): void {
		ControlPersonalizationWriteAPI.add({
			changes: [
				{
					selectorElement: this,
					changeSpecificData: {
						changeType: "easyFilterState",
						content: { query }
					}
				}
			]
		});
	}

	onBeforeQueryProcessing(): void {
		const uiModel = this.getModel("ui") as JSONModel;
		BusyLocker.lock(uiModel);
		this.updatePersonalizationSupport();
		// Favorites/recent selections bypass liveChange and go directly to onGoPress — this is the single convergence point for all submission paths.
		clearTimeout(this.liveChangeDebounceTimer);
		this.registerQueryPersonalizationChange(this.content?.getQuery() ?? "");

		this.getFilterBarAPI()?.getVariantManagement()?.setEditable(true);
	}

	onAfterQueryProcessing(): void {
		const uiModel = this.getModel("ui") as JSONModel;
		BusyLocker.unlock(uiModel);
	}

	onQueryChanged(): void {
		const filterBar = UI5Element.getElementById(this.filterBar) as FilterBar;
		filterBar.fireFiltersChanged({ conditionsBased: true });
	}

	/**
	 * Handles live changes to the search query input and registers them as a pending personalization change.
	 * Debounced to avoid registering one change per keystroke, which would cause excessive revert steps.
	 * @param e The UI5 event carrying the updated query string.
	 */
	onLiveChange(e: UI5Event<{ query: string }, EasyFilterBarContainer>): void {
		const query = e.getParameter("query");
		clearTimeout(this.liveChangeDebounceTimer);
		this.liveChangeDebounceTimer = window.setTimeout(() => {
			this.registerQueryPersonalizationChange(query);
		}, 300);
	}

	private async handleShowValueHelp(event: EasyFilterBarContainer$ShowValueHelpEvent): Promise<void> {
		const key = event.getParameter("key");
		const resolve = event.getParameter("resolve");
		const reject = event.getParameter("reject");

		try {
			const conditions = await this.showValueHelpForKey(key);

			const selectedValues = conditions.map(async (condition) => {
				const operator = condition.operator as FilterOperator;

				if (condition.validated === "NotValidated") {
					// not validated: the condition only has values without description - try to get the description using the data fetcher mechanism.
					// `condition.values` is a single value `[value]` (or `[lower bound, upper bound]` for BT/NB operators).
					const conditionToResolve: TokenSelectedValuesDefinition =
						operator === FilterOperator.BT || operator === FilterOperator.NB
							? { operator, selectedValues: [condition.values[0], condition.values[1]] }
							: { operator, selectedValues: [condition.values[0]] };

					return this.resolveTokenValuesForField(key, [conditionToResolve]);
				} else if (operator !== FilterOperator.BT && operator !== FilterOperator.NB) {
					// validated: both value and description are available - directly map them to the result
					// `condition.values` is a tuple of `[value, description?]`
					const [value, description] = condition.values as [string | number | boolean, string | undefined];
					return Promise.resolve([{ operator, selectedValues: [{ value, description: description ?? value }] }]);
				} else {
					// should not occur: BT/NB are expected to be "NotValidated" conditions
					Log.warning(`Unexpected condition for field ${key}: operator ${operator} with values ${condition.values}.`);
					return Promise.resolve([]);
				}
			});

			const resolvedValues = await Promise.all(selectedValues);
			resolve(resolvedValues.flat());
		} catch (error) {
			reject(error instanceof Error ? error : new Error(String(error)));
		}
	}

	createContent(): EasyFilterBarContainer {
		return (
			<EasyFilterBarContainer
				contextPath={this.getOwnerContextPath()}
				appId={this.getApplicationId()}
				filterBarMetadata={this.filterBarMetadata}
				easyFilterLib={this.easyFilterPath}
				showValueHelp={this.handleShowValueHelp.bind(this)}
				dataFetcher={this.resolveTokenValuesForField.bind(this)}
				recommendedValues={this.recommendedQueries}
				queryChanged={this.onQueryChanged.bind(this)}
				tokensChanged={this.onTokensChanged.bind(this)}
				tokensChangedByUser={this.onTokensChangedByUser.bind(this)}
				sortersChanged={this.onSortersChanged.bind(this)}
				groupLevelsChanged={this.onGroupLevelsChanged.bind(this)}
				beforeQueryProcessing={this.onBeforeQueryProcessing.bind(this)}
				afterQueryProcessing={this.onAfterQueryProcessing.bind(this)}
				liveChange={this.onLiveChange.bind(this)}
			/>
		);
	}
}
