/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define([],function(){"use strict";var t={};let n=function(){function n(t){this.filterBarAPI=t;if(t){this.constructorWithFunctions(t)}else{this.constructorWithStrings()}}t=n;var e=n.prototype;e.constructorWithStrings=function t(){this.search="API.handleSearch($event)";this.filtersChanged="API.handleFilterChanged($event)"};e.constructorWithFunctions=function t(n){this.search=n.handleSearch.bind(n);this.filtersChanged=n.handleFilterChanged.bind(n)};e.getSearchHandler=function t(){return this.search};e.getFiltersChangedHandler=function t(){return this.filtersChanged};return n}();t=n;return t},false);
//# sourceMappingURL=FilterBarEventHandlersProvider.js.map