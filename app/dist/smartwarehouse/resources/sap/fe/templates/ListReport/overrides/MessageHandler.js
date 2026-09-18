/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils"],function(e){"use strict";const t={getShowBoundMessagesInMessageDialog:function(){const t=this.base.getAppComponent();const s=e.getCurrentPageView(t);const n=s?.getId();const i=this.base.getView()?.getId();if(t._isFclEnabled()&&n!==i&&s?.getViewData()?.viewLevel!==1){return false}return true}};return t},false);
//# sourceMappingURL=MessageHandler.js.map