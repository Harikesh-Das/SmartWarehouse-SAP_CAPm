import Log from "sap/base/Log";
import type { StartupParameters } from "sap/fe/core/AppComponent";
import CommonUtils from "sap/fe/core/CommonUtils";
import type { NavigationParameter } from "sap/fe/core/controllerextensions/ViewState";
import IViewStateContributorMixin from "sap/fe/core/controllerextensions/viewState/IViewStateContributorMixin";
import type FilterBarAPI from "sap/fe/macros/FilterBar";
import type { ControlState } from "sap/fe/macros/insights/CommonInsightsHelper";
import type TableAPI from "sap/fe/macros/Table";
import type { TableAppState } from "sap/fe/macros/Table";
import type ManagedObject from "sap/ui/base/ManagedObject";
import ManagedObjectObserver from "sap/ui/base/ManagedObjectObserver";
import StateUtil from "sap/ui/mdc/p13n/StateUtil";

export default class TableAPIStateHandler extends IViewStateContributorMixin<TableAppState> {
	/**
	 * Asynchronously retrieves the state of the table based on the provided viewstate.
	 * @returns A promise that resolves to the table state or null if not found.
	 */
	async retrieveState(this: TableAPI): Promise<TableAppState | null> {
		const tableState: TableAppState = {};
		tableState.innerTable = this.getControlState(await StateUtil.retrieveExternalState(this.content)) as object;
		const quickFilter = this.getQuickFilter();
		if (quickFilter) {
			const quickFilterState = quickFilter.getSelectedKey();
			if (!tableState.quickFilter) {
				tableState.quickFilter = {};
			}
			tableState.quickFilter.selectedKey = quickFilterState;
		}
		const variantToRetrieve = this.content.getVariant()?.getId();
		if (variantToRetrieve) {
			const variantManagementControl = this.content.getVariant();
			if (!tableState.variantManagement) {
				tableState.variantManagement = { variantId: variantManagementControl?.getCurrentVariantKey() };
			} else {
				tableState.variantManagement.variantId = variantManagementControl?.getCurrentVariantKey();
			}
		}
		return tableState;
	}

	/**
	 * Sets the initial state of the control by retrieving the external state.
	 * @returns A promise that resolves when the initial state is set.
	 */
	async setInitialState(this: TableAPI): Promise<void> {
		try {
			// Exclude sort state from the baseline: MDC's sort controller returns [] for unchanged sort
			// in diffState, which would clear annotation-based sort (PresentationVariant) on apply.
			// Both "sortConditions" (MDC P13n) and "sorters" (GridTable binding sort) must be excluded.
			const {
				sortConditions: _sc,
				sorters: _s,
				...stateWithoutSort
			} = (await StateUtil.retrieveExternalState(this.content)) as Record<string, unknown>;
			this.initialControlState = stateWithoutSort;
		} catch (e: unknown) {
			Log.error(e as string);
		}
	}

	/**
	 * Applies the legacy state to the table based on the provided control state retrieval function.
	 * @param getControlState Function to retrieve the control state.
	 * @param [_navParameters] Optional navigation parameters.
	 * @param [shouldApplyDiffState] Flag indicating whether to apply the diff state.
	 * @returns - A promise that resolves when the state has been applied.
	 */
	async applyLegacyState(
		this: TableAPI,
		getControlState: (control: ManagedObject) => ControlState,
		_navParameters?: NavigationParameter,
		shouldApplyDiffState?: boolean
	): Promise<void> {
		const table = this.content;
		const vm = table.getVariant();
		const quickFilter = this.getQuickFilter();

		const tableState = getControlState(table) as { initialState?: TableAppState; fullState?: TableAppState };
		const vmState = vm ? getControlState(vm) : null;
		const quickFilterState = quickFilter?.content ? getControlState(quickFilter.content) : null;

		const controlState: TableAppState = {};

		if (tableState) {
			controlState.innerTable = {
				...controlState.innerTable,
				...tableState,
				fullState: {
					...controlState.innerTable?.fullState,
					...tableState.fullState
				},
				initialState: {
					...controlState.innerTable?.initialState,
					...tableState.initialState
				}
			};
		}

		if (vmState?.variantId) {
			controlState.variantManagement = {
				...controlState.variantManagement,
				variantId: vmState.variantId.toString()
			};
		}

		if (quickFilterState?.selectedKey) {
			controlState.quickFilter = {
				...controlState.quickFilter,
				selectedKey: quickFilterState.selectedKey.toString()
			};
		}
		if (controlState && Object.keys(controlState).length > 0) {
			await this.applyState(controlState as object, _navParameters, shouldApplyDiffState);
		}
	}

	/**
	 * Handles the application of a variant ID passed via URL parameters.
	 * @returns A promise that resolves when the variant has been applied.
	 */
	async handleVariantIdPassedViaURLParams(this: TableAPI & TableAPIStateHandler): Promise<unknown> {
		const urlParams = await this.getStartupParameters();
		const tableVariantId = urlParams["sap-ui-fe-table-variant-id"]?.[0];
		const view = CommonUtils.getTargetView(this);
		const viewData = view.getViewData();
		const vmType = viewData.variantManagement;
		const vm = this.content.getVariant();
		if (vm && tableVariantId && typeof tableVariantId === "string" && vmType === "Control") {
			const variantToApply = vm.getVariants().find((variant) => variant.getKey() === tableVariantId);
			const ControlVariantApplyAPI = (await import("sap/ui/fl/apply/api/ControlVariantApplyAPI")).default;
			return ControlVariantApplyAPI.activateVariant({
				element: vm,
				variantReference: variantToApply?.getKey()
			});
		}
	}

	/**
	 * Retrieves the startup parameters from the application component data.
	 * These parameters contain URL query parameters that were passed when the application was started.
	 * @returns The startup parameters.
	 */
	async getStartupParameters(this: TableAPI): Promise<StartupParameters> {
		const controller = this.getPageController();
		const appComponent = controller.getAppComponent();
		return appComponent.getStartupParameters();
	}

	/**
	 * Asynchronously applies navigation parameters to the filter bar.
	 * @param navigationParameter The navigation parameters to be applied.
	 * @returns A promise that resolves when the parameters have been applied.
	 */
	async applyNavigationParameters(this: TableAPI & TableAPIStateHandler, navigationParameter: NavigationParameter): Promise<void> {
		try {
			// Only handle variant ID from URL parameters if applyVariantFromURLParams is true
			if (navigationParameter.applyVariantFromURLParams ?? false) {
				await this.handleVariantIdPassedViaURLParams();
			}
		} catch (error: unknown) {
			Log.error(
				`Error tying to apply navigation parameters to ${this.getMetadata().getName()}} control with ID: ${this.getId()}`,
				error as Error
			);
		}
		return Promise.resolve();
	}

	/**
	 * Asynchronously applies the provided control state to the viewstate.
	 * @param controlState The state to be applied to the control.
	 * @param [_navParameters] Optional navigation parameters.
	 * @param [shouldApplyDiffState] Optional flag to skip merging states.
	 * @returns A promise that resolves when the state has been applied.
	 */
	async applyState(
		this: TableAPI,
		controlState: TableAppState,
		_navParameters?: NavigationParameter,
		shouldApplyDiffState?: boolean
	): Promise<void> {
		if (!controlState) return;

		// Table properties need to be available before calling diffState/retrieveState. However, applyState
		// gets called too early in the table's lifecycle, so the delegate and properties are not yet available.
		if (!this.content) {
			// it is not really clear why the content is not available yet, so we use a ManagedObjectObserver to wait for the content aggregation to be set.
			// ideally we should not have to do this, It needs further investigation.
			let observer: typeof ManagedObjectObserver | null = null;
			await new Promise((resolve) => {
				observer = new ManagedObjectObserver(resolve);
				observer.observe(this, { aggregations: ["content"] });
			});
			observer?.disconnect();
		}
		await this.content.initialized();

		const innerTableState = controlState?.innerTable;
		const variantId = controlState?.variantManagement?.variantId;
		const currentVariant = this.content?.getVariant();
		const quickFilterKey = controlState?.quickFilter?.selectedKey;
		const quickFilter = this.getQuickFilter();

		// Handle Variant Management
		if (variantId !== undefined && variantId !== currentVariant.getCurrentVariantKey()) {
			const ovM = this.content?.getVariant();
			const aVariants = ovM?.getVariants();
			const sVariantReference = aVariants?.some((oVariant) => oVariant.getKey() === variantId)
				? variantId
				: ovM?.getStandardVariantKey;
			try {
				const ControlVariantApplyAPI = (await import("sap/ui/fl/apply/api/ControlVariantApplyAPI")).default;
				await ControlVariantApplyAPI.activateVariant({
					element: ovM,
					variantReference: sVariantReference as string
				});
				await this.setInitialState();
			} catch (error: unknown) {
				Log.error(error as string);
				await this.setInitialState();
			}
		} else {
			// we need to update initial state even if above condition not satiesfied
			await this.setInitialState();
		}

		// Handle Inner Table State

		let finalState;

		if (innerTableState) {
			// Exclude sort from stored state: MDC returns [] for annotation-based sort (PresentationVariant),
			// so [] in fullState produces "remove sort" entries via diffState that clear PV sort (DINC0863168).
			// Sort is managed by variant activation and annotations, not by iApp state delta.
			const {
				sortConditions: _iSC,
				sorters: _iS,
				...initialStateWithoutSort
			} = (innerTableState.initialState ?? {}) as Record<string, unknown>;
			const {
				sortConditions: _fSC,
				sorters: _fS,
				...fullStateWithoutSort
			} = (innerTableState.fullState ?? {}) as Record<string, unknown>;
			if (shouldApplyDiffState && innerTableState.initialState) {
				if (!initialStateWithoutSort.supplementaryConfig) {
					initialStateWithoutSort.supplementaryConfig = {};
				}
				finalState = await StateUtil.diffState(this.content, initialStateWithoutSort, fullStateWithoutSort);
			} else {
				if (controlState && !controlState?.supplementaryConfig) {
					controlState.supplementaryConfig = {};
				}
				finalState = fullStateWithoutSort;
			}
			await StateUtil.applyExternalState(this.content, finalState);
		}

		// Handle Quick Filter State
		if (quickFilterKey && quickFilterKey !== quickFilter?.getSelectedKey()) {
			quickFilter?.setSelectedKey(quickFilterKey);
			this.onQuickFilterSelectionChange();
		}
		if (this.initialLoad && this.filterBar) {
			const filterBar = this.getFilterBarControl(this.filterBar);
			if (filterBar && filterBar.isA<FilterBarAPI>("sap.fe.macros.FilterBar")) {
				filterBar
					.waitForInitialState()
					.then((): void => {
						this.content.rebind();
						return;
					})
					.catch((): void => {
						Log.error("Error while waiting for initial state of filter bar");
					});
			}
		}
	}
}
