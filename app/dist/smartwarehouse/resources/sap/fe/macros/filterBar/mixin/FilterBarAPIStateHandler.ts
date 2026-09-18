import Log from "sap/base/Log";
import type { ControlState, LegacyFilterBarState, NavigationParameter } from "sap/fe/core/controllerextensions/ViewState";
import IViewStateContributorMixin from "sap/fe/core/controllerextensions/viewState/IViewStateContributorMixin";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import { InitialLoadMode } from "sap/fe/core/library";
import type FilterBar from "sap/fe/macros/controls/FilterBar";
import type { PropertyInfo } from "sap/fe/macros/internal/PropertyInfo";
import type SelectionVariant from "sap/fe/navigation/SelectionVariant";
import { NavType } from "sap/fe/navigation/library";
import type ListReportController from "sap/fe/templates/ListReport/ListReportController.controller";
import Device from "sap/ui/Device";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type VariantManagement from "sap/ui/fl/variants/VariantManagement";
import StateUtil from "sap/ui/mdc/p13n/StateUtil";
import type FilterBarAPI from "../../FilterBar";
import type { FilterBarState } from "../../FilterBar";

export default class FilterBarAPIStateHandler extends IViewStateContributorMixin<FilterBarState> {
	async applyLegacyState(
		this: FilterBarAPI,
		getControlState: (control: ManagedObject) => ControlState,
		_navParameters?: NavigationParameter,
		shouldApplyDiffState?: boolean,
		skipMerge?: boolean
	): Promise<void> {
		const filterBar = this.content;
		const filterBarState = getControlState(filterBar) as { initialState?: LegacyFilterBarState; fullState?: LegacyFilterBarState };
		const controlState: FilterBarState = {};

		if (filterBarState) {
			controlState.innerState = {
				...filterBarState,
				fullState: {
					...controlState.innerState?.fullState,
					...filterBarState.fullState
				},
				initialState: {
					...controlState.innerState?.initialState,
					...filterBarState.initialState
				}
			};
		}
		if (controlState && Object.keys(controlState).length > 0) {
			await this.applyState(controlState as object, _navParameters, shouldApplyDiffState, skipMerge);
		}
	}

	async applyState(
		this: FilterBarAPI,
		controlState: FilterBarState,
		navParameter?: NavigationParameter,
		shouldApplyDiffState?: boolean,
		skipMerge?: boolean
	): Promise<void> {
		try {
			if (controlState && navParameter) {
				const navigationType = navParameter.navigationType;
				//When navigation type is hybrid, we override the filter conditions in IAppState with SV received from XappState
				if (navigationType === NavType.hybrid && controlState.innerState?.fullState !== undefined) {
					const xAppStateFilters = await this.convertSelectionVariantToStateFilters(
						navParameter.selectionVariant as SelectionVariant,
						true
					);

					const mergedFullState = {
						...controlState.innerState?.fullState,
						filter: {
							...controlState.innerState?.fullState.filter,
							...xAppStateFilters
						}
					};
					//when navigating from card, remove all existing filters values (default or otherwise) and then apply the state
					await this._clearFilterValuesWithOptions(this.content, { clearEditFilter: true });
					return await StateUtil.applyExternalState(this.content, mergedFullState);
				}

				if (shouldApplyDiffState) {
					const diffState: object = await StateUtil.diffState(
						this.content,
						controlState.innerState?.initialState as object,
						controlState.innerState?.fullState as object
					);
					return await StateUtil.applyExternalState(this.content, diffState);
				} else if (skipMerge) {
					//skipMerge is true when coming from the dynamic tile, in this case, remove all existing filters values (default or otherwise)
					await this._clearFilterValuesWithOptions(this.content, { clearEditFilter: true });
				}
				return await StateUtil.applyExternalState(this.content, controlState?.innerState?.fullState ?? controlState);
			}
		} catch (error: unknown) {
			Log.error(error as string);
		} finally {
			this._initialStatePromise.resolve();
		}
	}

	async retrieveState(this: FilterBarAPI): Promise<FilterBarState | null> {
		const filterBarState: FilterBarState = {};
		filterBarState.innerState = this.getControlState(await StateUtil.retrieveExternalState(this.content)) as {
			initialState?: LegacyFilterBarState;
			fullState?: LegacyFilterBarState;
		};
		// remove sensitive or view state irrelevant fields
		const propertiesInfo = this.content.getPropertyInfoSet();
		const filter = filterBarState.innerState?.filter || {};
		propertiesInfo
			.filter(function (propertyInfo: PropertyInfo & { removeFromAppState?: boolean }) {
				return (
					Object.keys(filter).length > 0 &&
					propertyInfo.path &&
					filter[propertyInfo.path] &&
					(propertyInfo.removeFromAppState || filter[propertyInfo.path].length === 0)
				);
			})
			.forEach(function (PropertyInfo: PropertyInfo) {
				if (PropertyInfo.path) {
					delete filter[PropertyInfo.path];
				}
			});
		return filterBarState;
	}

	async setInitialState(this: FilterBarAPI): Promise<void> {
		try {
			const initialControlState = await StateUtil.retrieveExternalState(this.content);
			this.initialControlState = initialControlState;
		} catch (e: unknown) {
			Log.error(e as string);
		}
	}

	async applyNavigationParameters(this: FilterBarAPI, navigationParameter: NavigationParameter): Promise<void> {
		return new Promise<void>(async (resolve) => {
			try {
				const view = this.getPageController()?.getView();
				const controller = this.getPageController();
				const appComponent = controller.getAppComponent();
				const componentData = appComponent.getComponentData();
				const startupParameters = (componentData && componentData.startupParameters) || {};
				let variantStatus: unknown;
				let filterVariantApplied = false;

				// Only handle variant ID from URL parameters if applyVariantFromURLParams is true
				if (navigationParameter.applyVariantFromURLParams ?? false) {
					variantStatus = await this.handleVariantIdPassedViaURLParams(startupParameters as unknown as Record<string, string>);
				}
				if (variantStatus && (variantStatus as [])?.length > 0) {
					// check if filter bar variant is applied or not.
					if ((variantStatus as boolean[])[0] === true || (variantStatus as boolean[])[1] === true) {
						filterVariantApplied = true;
					}
				}

				// if variant from URL does not exist or did not apply properly then apply to LR either default variant or standard variant required.
				const filterBar = this.getContent();
				const { selectionVariant: sv, requiresStandardVariant: reqStdVariant = false } = navigationParameter;

				if (!filterBar || !sv) {
					resolve();
				}
				const appliedCondition = await this._applySelectionVariant(view, navigationParameter, filterVariantApplied);
				const selectionVariantWasApplied = Array.isArray(appliedCondition) && appliedCondition.length > 0;
				let bPreventInitialSearch = false;
				const variantManagement = this._getFilterBarVM(view) as VariantManagement;
				if (filterBar) {
					if (
						(navigationParameter.navigationType !== NavType.initial && reqStdVariant && selectionVariantWasApplied) ||
						(!variantManagement && view.getViewData().initialLoad === InitialLoadMode.Enabled) ||
						(controller as ListReportController)._shouldAutoTriggerSearch(variantManagement)
					) {
						const filterBarAPI = filterBar.getParent() as FilterBarAPI;
						try {
							await filterBarAPI.triggerSearch();
						} catch (error: unknown) {
							//ignore errors from search trigger as MDC shall show them in message box or as filter field value state.
						}
					} else {
						bPreventInitialSearch = this._preventInitialSearch(variantManagement);
					}
					//collapse or expand shall be available only for non-desktop systems
					const searchTriggeredByInitialLoad = this.isSearchTriggeredByInitialLoad(navigationParameter.navigationType);
					if (!Device.system.desktop) {
						const internalModelContext = view.getBindingContext("internal") as InternalModelContext;
						internalModelContext.setProperty("searchTriggeredByInitialLoad", searchTriggeredByInitialLoad);
					}
					this._enableFilterBar(filterBar as FilterBar, bPreventInitialSearch);
					if (!bPreventInitialSearch && searchTriggeredByInitialLoad) {
						// If search was triggered previously before suspendSelection is set to false in _enableFilterBar, then MDC internally would trigger search as it hold the previous request to trigger search.
						// We don't have the instance of this new search to await before we complete the state application and pass control back to the page.
						// So we use 'validate' which returns a promise of this search validation.
						// So, we call validate with the same as we don't want to suppress the search in this case and await the same.
						await (filterBar as FilterBar).validate(searchTriggeredByInitialLoad);
					}
				} else {
					Log.warning("Did not finish applying navigation parameters - Filter bar not found.");
				}
				resolve();
			} catch {
				resolve();
				Log.warning("Could not apply navigation parameters.");
			}
		});
	}
}
