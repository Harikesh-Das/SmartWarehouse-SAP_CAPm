/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define([],function(){"use strict";const e={applyChange(e,t){const{query:n}=e.getContent();t.content?.setQuery(n);return true},revertChange(e,t){t.content?.setQuery("")},completeChangeContent(){},getCondenserInfo(e){return{affectedControl:e.getSelector(),classification:"lastOneWins",uniqueKey:e.getSelector().id+"-easyFilterState"}}};const t={easyFilterState:{changeHandler:e,layers:{USER:true}}};return t},false);
//# sourceMappingURL=EasyFilterBar.flexibility.js.map