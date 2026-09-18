/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  let FilterBarEventHandlerProvider = /*#__PURE__*/function () {
    function FilterBarEventHandlerProvider(filterBarAPI) {
      this.filterBarAPI = filterBarAPI;
      if (filterBarAPI) {
        this.constructorWithFunctions(filterBarAPI);
      } else {
        this.constructorWithStrings();
      }
    }

    /**
     * Initializes the event handler properties with string values.
     */
    _exports = FilterBarEventHandlerProvider;
    var _proto = FilterBarEventHandlerProvider.prototype;
    _proto.constructorWithStrings = function constructorWithStrings() {
      this.search = "API.handleSearch($event)";
      this.filtersChanged = "API.handleFilterChanged($event)";
    }

    /**
     * Initializes the event handler properties with functions.
     * @param filterBarAPI
     */;
    _proto.constructorWithFunctions = function constructorWithFunctions(filterBarAPI) {
      this.search = filterBarAPI.handleSearch.bind(filterBarAPI);
      this.filtersChanged = filterBarAPI.handleFilterChanged.bind(filterBarAPI);
    }

    /**
     * Get the search event handler.
     * @returns The event handler.
     */;
    _proto.getSearchHandler = function getSearchHandler() {
      return this.search;
    }

    /**
     * Get the filters changed event handler.
     * @returns The event handler.
     */;
    _proto.getFiltersChangedHandler = function getFiltersChangedHandler() {
      return this.filtersChanged;
    };
    return FilterBarEventHandlerProvider;
  }();
  _exports = FilterBarEventHandlerProvider;
  return _exports;
}, false);
//# sourceMappingURL=FilterBarEventHandlersProvider-dbg.js.map
