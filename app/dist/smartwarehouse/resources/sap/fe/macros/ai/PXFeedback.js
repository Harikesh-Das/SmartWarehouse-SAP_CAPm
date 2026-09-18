/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/ui/core/EventBus"],function(e,r){"use strict";var t={};function a(t){try{const e=r.getInstance();const a={areaId:"EmbeddedAI",triggerName:"J281",payload:{event:t}};e.publish("sap.feedback","inapp.feature",a)}catch(r){e.error("Error in triggerPXIntegration",r)}}t.triggerPXIntegration=a;return t},false);
//# sourceMappingURL=PXFeedback.js.map