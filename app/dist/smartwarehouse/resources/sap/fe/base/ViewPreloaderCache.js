/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/deepClone"],function(e){"use strict";var t={};const n={};let r={values:{}};function u(){return r}function a(e,t){return n[t.getId()]?.[e]}function c(e,t,u){let a=arguments.length>3&&arguments[3]!==undefined?arguments[3]:true;if(!n[u.getId()]){n[u.getId()]={}}n[u.getId()][t]=e;if(a){r=e}}function i(){return e(n)}const d={getCurrentCacheEntry:u,getCacheEntryByTargetName:a,addEntryToCache:c,_getFullCache:i};t.viewPreloaderCache=d;return t},false);
//# sourceMappingURL=ViewPreloaderCache.js.map