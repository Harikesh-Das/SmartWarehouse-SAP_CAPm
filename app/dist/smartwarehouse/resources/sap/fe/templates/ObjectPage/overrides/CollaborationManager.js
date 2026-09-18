/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/core/CommonUtils","sap/fe/macros/insights/CommonInsightsHelper"],function(e,t,a){"use strict";var o={};var s=a.showGenericErrorMessage;const n={INTEGRATION:"integration"};o.RetrieveCardTypes=n;const r={async collectAvailableCards(a){const o=this.base.getView();const r=o.getController();const i=r.getOwnerComponent().getAppComponent();const c=t.getIsEditable(o);if(!c){const t=(async()=>{const t=await i.getCollaborationManagerService().getDesignTimeCard(n.INTEGRATION);if(t){const n=()=>{try{if(t){i.getCollaborationManagerService().publishCard(t);return}}catch(t){s(o);e.error(t)}};const c=await r._getPageTitleInformation();a.push({card:t,title:c.subtitle||"",callback:n})}})();r.pageReady.waitFor(t);await t}}};return r},false);
//# sourceMappingURL=CollaborationManager.js.map