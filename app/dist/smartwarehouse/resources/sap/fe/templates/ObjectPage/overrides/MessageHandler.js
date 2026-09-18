/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils"],function(t){"use strict";const e={getShowBoundMessagesInMessageDialog:function(){return!t.getIsEditable(this.base)||this.base.getView().getBindingContext("internal").getProperty("isOperationDialogOpen")||this.base.getView().getBindingContext("internal").getProperty("getBoundMessagesForMassEdit")},filterContextBoundMessages(t,e){const n=[];t?.forEach(t=>{if(t.getTargets().length===1&&t.getTargets()[0]===e?.getPath()&&t.getPersistent()===true){const e=t.getTechnicalDetails();if(!(e?.httpStatus===412&&e?.isConcurrentModification)){n.push(t)}}});if(n.length===1){t=t?.filter(function(t){return t!==n[0]})}return t}};return e},false);
//# sourceMappingURL=MessageHandler.js.map