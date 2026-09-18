/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/Control"],function(n){"use strict";var o=n.extend("sap.collaboration.components.fiori.notification.NotificationContainer",{metadata:{aggregations:{content:{singularName:"content"}}},renderer:{apiVersion:2,render:function(n,o){n.openStart("div",o);n.class("sapClbNotifContainerBox");n.openEnd();var t=o.getContent();for(var e=0,r=t.length;e<r;e++){n.renderControl(t[e])}n.close("div")}}});return o});
//# sourceMappingURL=NotificationContainer.js.map