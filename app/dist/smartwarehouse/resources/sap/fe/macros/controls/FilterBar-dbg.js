/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/helpers/PromiseKeeper", "sap/fe/macros/controls/filterbar/FilterContainer", "sap/fe/macros/controls/filterbar/VisualFilterContainer", "sap/ui/core/Element", "sap/ui/mdc/FilterBar", "sap/ui/mdc/filterbar/aligned/FilterItemLayout", "./filterbar/utils/VisualFilterUtils"], function (Log, ClassSupport, PromiseKeeper, FilterContainer, VisualFilterContainer, Element, MdcFilterBar, FilterItemLayout, VisualFilterUtils) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _descriptor3;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var association = ClassSupport.association;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  const VISUAL_FILTER_CONTAINER = "sap.fe.macros.controls.filterbar.VisualFilterContainer",
    FILTER_CONTAINER = "sap.fe.macros.controls.filterbar.FilterContainer";
  let FilterBar = (_dec = defineUI5Class("sap.fe.macros.controls.FilterBar"), _dec2 = property({
    type: "string",
    defaultValue: "compact"
  }), _dec3 = property({
    type: "boolean",
    defaultValue: false
  }), _dec4 = association({
    type: "sap.m.SegmentedButton",
    multiple: false
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_MdcFilterBar) {
    function FilterBar(idOrProps, settings) {
      var _this;
      delete idOrProps?.propertyInfo;
      delete settings?.propertyInfo;
      _this = _MdcFilterBar.call(this, idOrProps, settings) || this;
      _initializerDefineProperty(_this, "initialLayout", _descriptor, _this);
      _initializerDefineProperty(_this, "disableDraftEditStateFilter", _descriptor2, _this);
      /**
       * Control which allows for switching between visual and normal filter layouts
       */
      _initializerDefineProperty(_this, "toggleControl", _descriptor3, _this);
      _this._isInitialized = false;
      _this._initializeStatus();
      return _this;
    }
    _inheritsLoose(FilterBar, _MdcFilterBar);
    var _proto = FilterBar.prototype;
    _proto._initializeStatus = async function _initializeStatus() {
      // Promise keeper to hold the process.
      this._initializedPromiseKeeper = new PromiseKeeper();

      // Awaits
      await this.initializedWithMetadata();
      await this.waitForModelToBeSet();
      this._initializedPromiseKeeper.resolve();
      this._isInitialized = true;
    };
    _proto.waitForModelToBeSet = async function waitForModelToBeSet() {
      if (this.getModel()) {
        return;
      }
      // wait for deafault model to be set.
      const modelIsSetPromiseKeeper = new PromiseKeeper();
      const fnCheckAndReset = e => {
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
     */;
    _proto.isInitialized = function isInitialized() {
      return !!this._isInitialized;
    }

    /**
     * Async equivalent of 'isInitialized' to perform filter bar interactions after the filter bar is ready.
     * @returns Promise that resolves when the filter bar is initialized.
     */;
    _proto.whenInitialized = async function whenInitialized() {
      return this._initializedPromiseKeeper?.promise;
    };
    _proto.setToggleControl = function setToggleControl(vToggle) {
      if (typeof vToggle === "string") {
        this._oSegmentedButton = Element.getElementById(vToggle);
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
    };
    _proto._toggleLayout = function _toggleLayout() {
      // Since primary layout is always compact
      // hence set the secondary layout as visual filter only for the first time only
      this.waitForInitialization().then(() => {
        const targetKey = this._oSegmentedButton?.getSelectedKey();
        if (targetKey === "visual" && this._oFilterBarLayout?.isA("sap.fe.macros.controls.filterbar.VisualFilterContainer") || targetKey === "compact" && !this._oFilterBarLayout?.isA("sap.fe.macros.controls.filterbar.VisualFilterContainer")) {
          return;
        }
        if (!this._oSecondaryFilterBarLayout) {
          this._oSecondaryFilterBarLayout = new VisualFilterContainer();
        }

        // do not show Adapt Filters Button for visual layout
        if (this._oSecondaryFilterBarLayout?.isA("sap.fe.macros.controls.filterbar.VisualFilterContainer")) {
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
        const aVisualFilterFields = oCurrentFilterBarLayout.getAllVisualFilterFields && oCurrentFilterBarLayout.getAllVisualFilterFields();
        if (this._oSecondaryFilterBarLayout?.isA("sap.fe.macros.controls.filterbar.VisualFilterContainer")) {
          this._oSecondaryFilterBarLayout.setAllFilterFields(aSortedFilterFields, aVisualFilterFields);
        }
        // use secondary filter bar layout as new layout
        this._oFilterBarLayout = this._oSecondaryFilterBarLayout;

        // insert all filter fields from current layout to new layout
        aFilterFields.forEach((oFilterField, iIndex) => {
          oCurrentFilterBarLayout.removeFilterField(oFilterField);
          this._oFilterBarLayout.insertFilterField(oFilterField, iIndex);
        });
        // insert all buttons from the current layout to the new layout
        aButtons.forEach(oButton => {
          oCurrentFilterBarLayout.removeButton(oButton);
          this._oFilterBarLayout.addButton(oButton);
        });

        // set the current filter bar layout to the secondary one
        this._oSecondaryFilterBarLayout = oCurrentFilterBarLayout;

        // update the layout aggregation of the filter bar and rerender the same.
        this.setAggregation("layout", this._oFilterBarLayout, true);
        this._oFilterBarLayout.invalidate();
        return;
      }).catch(error => {
        Log.error(error);
      });
    };
    _proto.getSortedFilterFields = function getSortedFilterFields(aFilterItems, aFilterFields) {
      const aFilterIds = [];
      aFilterItems.forEach(function (oFilterItem) {
        aFilterIds.push(oFilterItem.getId());
      });
      aFilterFields.sort(function (aFirstItem, aSecondItem) {
        let sFirstItemVFId, sSecondItemVFId;
        aFirstItem.getContent().forEach(function (oInnerControl) {
          if (oInnerControl.isA("sap.ui.mdc.FilterField")) {
            sFirstItemVFId = oInnerControl.getId();
          }
        });
        aSecondItem.getContent().forEach(function (oInnerControl) {
          if (oInnerControl.isA("sap.ui.mdc.FilterField")) {
            sSecondItemVFId = oInnerControl.getId();
          }
        });
        return aFilterIds.indexOf(sFirstItemVFId ?? "") - aFilterIds.indexOf(sSecondItemVFId ?? "");
      });
      return aFilterFields;
    };
    _proto._createInnerLayout = function _createInnerLayout() {
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
        onBeforeRendering: () => {
          if (this.initialLayout === "visual") {
            this._toggleLayout();
          }
          oInnerLayout.removeEventDelegate(oFilterContainerInnerLayoutEventDelegate);
        }
      };
      oInnerLayout.addEventDelegate(oFilterContainerInnerLayoutEventDelegate);
      this.setAggregation("layout", this._oFilterBarLayout, true);
    };
    _proto.exit = function exit() {
      _MdcFilterBar.prototype.exit.call(this);
      // Sometimes upon external navigation this._SegmentedButton is already destroyed
      // so check if it exists and then only remove stuff
      if (this._oSegmentedButton) {
        this._oSegmentedButton.detachEvent("selectionChange", this._toggleLayout);
        delete this._oSegmentedButton;
      }
    };
    _proto.getSegmentedButton = function getSegmentedButton() {
      return this._oSegmentedButton;
    }

    /**
     * Enable or disable requests that are initiated by the FilterBar.
     *
     * To be used to suspend or resume requests(table or visual filters) when the filter bar is being modified or when the user is programmatically interacting with the filter controls.
     * This method is also used to control whether the visual filter chart binding should be resumed/suspended based on the diff state, and resumed after conditon model update.
     * @param enable Enable or disable requests
     * @param diffState If there is a differnce in the external state that needs to be considered for visual filter in-parameters
     */;
    _proto.enableRequests = function enableRequests(enable, diffState) {
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
     */;
    _proto._getFilterLayoutByType = function _getFilterLayoutByType(layoutClassName) {
      const retFilterLayout = this._oFilterBarLayout.isA(layoutClassName) ? this._oFilterBarLayout : undefined;
      return !retFilterLayout && this._oSecondaryFilterBarLayout?.isA(layoutClassName) ? this._oSecondaryFilterBarLayout : retFilterLayout;
    };
    _proto._enableVisualFilterChartBindings = function _enableVisualFilterChartBindings(enable, diffState) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const visualFilterLayout = this._getFilterLayoutByType(VISUAL_FILTER_CONTAINER);
      if (visualFilterLayout) {
        visualFilterLayout.enableChartBinding(enable, diffState);
        return;
      }

      // If initial layout is compact, we don't have the visual filter layout(container) available yet until the user toggles to visual filter layout.
      // So we need to check if the compact filter layout has visual filters and enable/disable the chart binding for those visual filters.
      const compactFilterLayout = this._getFilterLayoutByType(FILTER_CONTAINER);
      if (compactFilterLayout) {
        const visualFilters = compactFilterLayout.getAllVisualFilterFields();
        if (visualFilters) {
          VisualFilterUtils.enableChartBinding(visualFilters, enable, diffState);
        }
      }
    };
    return FilterBar;
  }(MdcFilterBar), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "initialLayout", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "disableDraftEditStateFilter", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "toggleControl", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return FilterBar;
}, false);
//# sourceMappingURL=FilterBar-dbg.js.map
