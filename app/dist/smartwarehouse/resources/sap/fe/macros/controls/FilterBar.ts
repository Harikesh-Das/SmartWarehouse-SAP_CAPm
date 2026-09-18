import Log from "sap/base/Log";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { association, defineUI5Class, property } from "sap/fe/base/ClassSupport";
import PromiseKeeper from "sap/fe/core/helpers/PromiseKeeper";
import FilterContainer from "sap/fe/macros/controls/filterbar/FilterContainer";
import VisualFilterContainer from "sap/fe/macros/controls/filterbar/VisualFilterContainer";
import type VisualFilter from "sap/fe/macros/visualfilters/VisualFilter";
import type Button from "sap/m/Button";
import type SegmentedButton from "sap/m/SegmentedButton";
import type { ManagedObject$ModelContextChangeEvent } from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import { default as Element } from "sap/ui/core/Element";
import type { $FilterBarSettings } from "sap/ui/mdc/FilterBar";
import MdcFilterBar from "sap/ui/mdc/FilterBar";
import type FilterField from "sap/ui/mdc/FilterField";
import type IFilterContainer from "sap/ui/mdc/filterbar/IFilterContainer";
import FilterItemLayout from "sap/ui/mdc/filterbar/aligned/FilterItemLayout";
import { type ExternalStateType } from "../valuehelp/ValueHelpDelegate";
import VisualFilterUtils from "./filterbar/utils/VisualFilterUtils";

const VISUAL_FILTER_CONTAINER = "sap.fe.macros.controls.filterbar.VisualFilterContainer",
	FILTER_CONTAINER = "sap.fe.macros.controls.filterbar.FilterContainer";
type ContainerType = typeof VISUAL_FILTER_CONTAINER | typeof FILTER_CONTAINER;

@defineUI5Class("sap.fe.macros.controls.FilterBar")
class FilterBar extends MdcFilterBar {
	@property({ type: "string", defaultValue: "compact" })
	initialLayout!: string;

	@property({ type: "boolean", defaultValue: false })
	disableDraftEditStateFilter!: boolean;

	/**
	 * Control which allows for switching between visual and normal filter layouts
	 */
	@association({
		type: "sap.m.SegmentedButton",
		multiple: false
	})
	toggleControl!: string;

	constructor(
		idOrProps?: PropertiesOf<FilterBar> &
			$FilterBarSettings & {
				adaptFiltersText?: string;
				adaptFiltersTextNonZero?: string;
			},
		settings?: PropertiesOf<FilterBar> & $FilterBarSettings
	) {
		delete idOrProps?.propertyInfo;
		delete settings?.propertyInfo;
		super(idOrProps as unknown as string, settings);
		this._initializeStatus();
	}

	private async _initializeStatus(): Promise<void> {
		// Promise keeper to hold the process.
		this._initializedPromiseKeeper = new PromiseKeeper<void>();

		// Awaits
		await this.initializedWithMetadata();
		await this.waitForModelToBeSet();

		this._initializedPromiseKeeper.resolve();
		this._isInitialized = true;
	}

	private async waitForModelToBeSet(): Promise<void> {
		if (this.getModel()) {
			return;
		}
		// wait for deafault model to be set.
		const modelIsSetPromiseKeeper = new PromiseKeeper<void>();
		const fnCheckAndReset = (e: ManagedObject$ModelContextChangeEvent): void => {
			const filterbar = e.getSource();
			if (filterbar.getModel()) {
				// default model is set.
				filterbar.detachModelContextChange(fnCheckAndReset);
				modelIsSetPromiseKeeper?.resolve();
			}
		};
		this.attachModelContextChange(fnCheckAndReset);
		return modelIsSetPromiseKeeper.promise;
	}

	/**
	 * Checks if the FilterBar is fully initialized.
	 * @returns True if the FilterBar is initialized, false otherwise.
	 */
	isInitialized(): boolean {
		return !!this._isInitialized;
	}

	/**
	 * Async equivalent of 'isInitialized' to perform filter bar interactions after the filter bar is ready.
	 * @returns Promise that resolves when the filter bar is initialized.
	 */
	async whenInitialized(): Promise<void> {
		return this._initializedPromiseKeeper?.promise;
	}

	private _initializedPromiseKeeper?: PromiseKeeper<void>;

	private _isInitialized = false;

	private _oSegmentedButton?: SegmentedButton;

	private _oSecondaryFilterBarLayout?: IFilterContainer;

	private _oFilterBarLayout!: IFilterContainer;

	private _cLayoutItem: typeof FilterItemLayout;

	setToggleControl(vToggle: string | SegmentedButton): void {
		if (typeof vToggle === "string") {
			this._oSegmentedButton = Element.getElementById(vToggle) as SegmentedButton;
		} else {
			this._oSegmentedButton = vToggle;
		}

		if (this.toggleControl && this._oSegmentedButton) {
			this._oSegmentedButton.detachEvent("selectionChange", this._toggleLayout.bind(this));
		}
		if (this._oSegmentedButton) {
			this._oSegmentedButton.attachEvent("selectionChange", this._toggleLayout.bind(this));
		}
		this.setAssociation("toggleControl", vToggle, true);
	}

	_toggleLayout(): void {
		// Since primary layout is always compact
		// hence set the secondary layout as visual filter only for the first time only
		this.waitForInitialization()
			.then(() => {
				const targetKey = this._oSegmentedButton?.getSelectedKey();
				if (
					(targetKey === "visual" &&
						this._oFilterBarLayout?.isA<VisualFilterContainer>("sap.fe.macros.controls.filterbar.VisualFilterContainer")) ||
					(targetKey === "compact" &&
						!this._oFilterBarLayout?.isA<VisualFilterContainer>("sap.fe.macros.controls.filterbar.VisualFilterContainer"))
				) {
					return;
				}
				if (!this._oSecondaryFilterBarLayout) {
					this._oSecondaryFilterBarLayout = new VisualFilterContainer() as unknown as IFilterContainer;
				}

				// do not show Adapt Filters Button for visual layout
				if (this._oSecondaryFilterBarLayout?.isA<VisualFilterContainer>("sap.fe.macros.controls.filterbar.VisualFilterContainer")) {
					this.setShowAdaptFiltersButton(false);
				} else {
					this.setShowAdaptFiltersButton(true);
				}

				// get all filter fields and button of the current layout
				const oCurrentFilterBarLayout = this._oFilterBarLayout;
				const oFilterItems = this.getFilterItems();
				const aFilterFields = oCurrentFilterBarLayout.getAllFilterFields();
				const aSortedFilterFields = this.getSortedFilterFields(oFilterItems, aFilterFields);
				const aButtons = oCurrentFilterBarLayout.getAllButtons();
				const aVisualFilterFields =
					oCurrentFilterBarLayout.getAllVisualFilterFields &&
					(oCurrentFilterBarLayout.getAllVisualFilterFields() as Record<string, VisualFilter> | undefined);
				if (this._oSecondaryFilterBarLayout?.isA<VisualFilterContainer>("sap.fe.macros.controls.filterbar.VisualFilterContainer")) {
					this._oSecondaryFilterBarLayout.setAllFilterFields(aSortedFilterFields, aVisualFilterFields);
				}
				// use secondary filter bar layout as new layout
				this._oFilterBarLayout = this._oSecondaryFilterBarLayout!;

				// insert all filter fields from current layout to new layout
				aFilterFields.forEach((oFilterField: FilterField, iIndex: number) => {
					oCurrentFilterBarLayout.removeFilterField(oFilterField);
					this._oFilterBarLayout.insertFilterField(oFilterField, iIndex);
				});
				// insert all buttons from the current layout to the new layout
				aButtons.forEach((oButton: Button) => {
					oCurrentFilterBarLayout.removeButton(oButton);
					this._oFilterBarLayout.addButton(oButton);
				});

				// set the current filter bar layout to the secondary one
				this._oSecondaryFilterBarLayout = oCurrentFilterBarLayout;

				// update the layout aggregation of the filter bar and rerender the same.
				this.setAggregation("layout", this._oFilterBarLayout, true);
				this._oFilterBarLayout.invalidate();
				return;
			})
			.catch((error) => {
				Log.error(error);
			});
	}

	getSortedFilterFields(aFilterItems: FilterField[], aFilterFields: FilterField[]): FilterField[] {
		const aFilterIds: string[] = [];
		aFilterItems.forEach(function (oFilterItem: FilterField) {
			aFilterIds.push(oFilterItem.getId());
		});
		aFilterFields.sort(function (aFirstItem: FilterField, aSecondItem: FilterField) {
			let sFirstItemVFId, sSecondItemVFId;
			(aFirstItem.getContent() as unknown as Control[]).forEach(function (oInnerControl: Control) {
				if (oInnerControl.isA<FilterField>("sap.ui.mdc.FilterField")) {
					sFirstItemVFId = oInnerControl.getId();
				}
			});
			(aSecondItem.getContent() as unknown as Control[]).forEach(function (oInnerControl: Control) {
				if (oInnerControl.isA<FilterField>("sap.ui.mdc.FilterField")) {
					sSecondItemVFId = oInnerControl.getId();
				}
			});
			return aFilterIds.indexOf(sFirstItemVFId ?? "") - aFilterIds.indexOf(sSecondItemVFId ?? "");
		});
		return aFilterFields;
	}

	_createInnerLayout(): void {
		this._oFilterBarLayout = new FilterContainer();
		this._cLayoutItem = FilterItemLayout;
		this._oFilterBarLayout.getInner().addStyleClass("sapUiMdcFilterBarBaseAFLayout");
		this._addButtons();

		// TODO: Check with MDC if there is a better way to load visual filter on the basis of control property
		// _createInnerLayout is called on Init by the filter bar base.
		// This mean that we do not have access to the control properties yet
		// and hence we cannot decide on the basis of control properties whether initial layout should be compact or visual
		// As a result we have to do this workaround to always load the compact layout by default
		// And toogle the same in case the initialLayout was supposed to be visual filters.
		const oInnerLayout = this._oFilterBarLayout.getInner();
		const oFilterContainerInnerLayoutEventDelegate = {
			onBeforeRendering: (): void => {
				if (this.initialLayout === "visual") {
					this._toggleLayout();
				}
				oInnerLayout.removeEventDelegate(oFilterContainerInnerLayoutEventDelegate);
			}
		};
		oInnerLayout.addEventDelegate(oFilterContainerInnerLayoutEventDelegate);

		this.setAggregation("layout", this._oFilterBarLayout, true);
	}

	exit(): void {
		super.exit();
		// Sometimes upon external navigation this._SegmentedButton is already destroyed
		// so check if it exists and then only remove stuff
		if (this._oSegmentedButton) {
			this._oSegmentedButton.detachEvent("selectionChange", this._toggleLayout);
			delete this._oSegmentedButton;
		}
	}

	getSegmentedButton(): SegmentedButton | undefined {
		return this._oSegmentedButton;
	}

	/**
	 * Enable or disable requests that are initiated by the FilterBar.
	 *
	 * To be used to suspend or resume requests(table or visual filters) when the filter bar is being modified or when the user is programmatically interacting with the filter controls.
	 * This method is also used to control whether the visual filter chart binding should be resumed/suspended based on the diff state, and resumed after conditon model update.
	 * @param enable Enable or disable requests
	 * @param diffState If there is a differnce in the external state that needs to be considered for visual filter in-parameters
	 */
	enableRequests(enable: boolean, diffState?: ExternalStateType): void {
		this.setSuspendSelection(!enable);
		// We need to enable or disable the visual filter chart bindings based on diff state.
		this._enableVisualFilterChartBindings(enable, diffState);
	}

	/**
	 * Get the filter layout by its type.
	 * @param layoutClassName The class name of the filter layout to be returned.
	 * @template T The type of the filter layout to be returned.
	 * @typedef {IFilterContainer} T The type of the filter layout to be returned
	 * @returns Corresponding filter layout if it exists, otherwise undefined.
	 */
	_getFilterLayoutByType<T extends IFilterContainer>(layoutClassName: ContainerType): T | undefined {
		const retFilterLayout = this._oFilterBarLayout.isA<T>(layoutClassName) ? this._oFilterBarLayout : undefined;
		return !retFilterLayout && this._oSecondaryFilterBarLayout?.isA<T>(layoutClassName)
			? this._oSecondaryFilterBarLayout
			: retFilterLayout;
	}

	_enableVisualFilterChartBindings(enable: boolean, diffState?: ExternalStateType): void {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const visualFilterLayout = this._getFilterLayoutByType<VisualFilterContainer>(VISUAL_FILTER_CONTAINER);
		if (visualFilterLayout) {
			visualFilterLayout.enableChartBinding(enable, diffState);
			return;
		}

		// If initial layout is compact, we don't have the visual filter layout(container) available yet until the user toggles to visual filter layout.
		// So we need to check if the compact filter layout has visual filters and enable/disable the chart binding for those visual filters.
		const compactFilterLayout = this._getFilterLayoutByType<FilterContainer>(FILTER_CONTAINER);
		if (compactFilterLayout) {
			const visualFilters = compactFilterLayout.getAllVisualFilterFields();
			if (visualFilters) {
				VisualFilterUtils.enableChartBinding(visualFilters, enable, diffState);
			}
		}
	}
}
interface FilterBar {
	_addButtons(): void;
}
export default FilterBar;
