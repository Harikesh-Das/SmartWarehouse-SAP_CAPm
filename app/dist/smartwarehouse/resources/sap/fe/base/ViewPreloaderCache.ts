import deepClone from "sap/base/util/deepClone";
import type AppComponent from "sap/fe/core/AppComponent";

export type PageLevelCache = {
	visitedContextPath?: string;
	values: Record<string, unknown>;
	viewShouldbeRefreshed?: boolean;
};
export type ApplicationLevelCache = Record<string, PageLevelCache>;
const fullCache: Record<string, ApplicationLevelCache> = {};

let currentCacheEntry: PageLevelCache = {
	values: {}
};

/**
 *  Returns the current cache entry, which is a PageLevelCache object.
 * @returns The current cache entry
 */
function getCurrentCacheEntry(): PageLevelCache {
	return currentCacheEntry;
}

/**
 *Returns the full cache object, which contains all application level caches.
 * @param targetName
 * @param appComponent
 * @returns The full cache object for the app component.
 */
function getCacheEntryByTargetName(targetName: string, appComponent: AppComponent): PageLevelCache | undefined {
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
function addEntryToCache(cacheEntry: PageLevelCache, targetName: string, appComponent: AppComponent, isCurrent = true): void {
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
function _getFullCache(): Record<string, ApplicationLevelCache> {
	return deepClone(fullCache);
}

export const viewPreloaderCache = {
	getCurrentCacheEntry,
	getCacheEntryByTargetName,
	addEntryToCache,
	_getFullCache
};
