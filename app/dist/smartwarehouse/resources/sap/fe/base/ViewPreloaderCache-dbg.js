/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/deepClone"], function (deepClone) {
  "use strict";

  var _exports = {};
  const fullCache = {};
  let currentCacheEntry = {
    values: {}
  };

  /**
   *  Returns the current cache entry, which is a PageLevelCache object.
   * @returns The current cache entry
   */
  function getCurrentCacheEntry() {
    return currentCacheEntry;
  }

  /**
   *Returns the full cache object, which contains all application level caches.
   * @param targetName
   * @param appComponent
   * @returns The full cache object for the app component.
   */
  function getCacheEntryByTargetName(targetName, appComponent) {
    return fullCache[appComponent.getId()]?.[targetName];
  }

  /**
   * Adds or replace a page level cache entry to the full cache.
   *  If the isCurrent parameter is true, it will also set the current cache entry.
   * @param cacheEntry
   * @param targetName
   * @param appComponent
   * @param isCurrent If true, the cache entry will be set as the current cache entry.
   */
  function addEntryToCache(cacheEntry, targetName, appComponent) {
    let isCurrent = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
    if (!fullCache[appComponent.getId()]) {
      fullCache[appComponent.getId()] = {};
    }
    fullCache[appComponent.getId()][targetName] = cacheEntry;
    if (isCurrent) {
      currentCacheEntry = cacheEntry;
    }
  }

  /**
   * Returns a deep clone of the full cache object.
   * This function is used only for testing purposes.
   * @returns The full cache object.
   */
  function _getFullCache() {
    return deepClone(fullCache);
  }
  const viewPreloaderCache = {
    getCurrentCacheEntry,
    getCacheEntryByTargetName,
    addEntryToCache,
    _getFullCache
  };
  _exports.viewPreloaderCache = viewPreloaderCache;
  return _exports;
}, false);
//# sourceMappingURL=ViewPreloaderCache-dbg.js.map
