/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/EventBus"], function (EventBus) {
  "use strict";

  var _exports = {};
  function triggerPXIntegration(triggerEvent) {
    try {
      const eventBus = EventBus.getInstance();
      eventBus.publish("sap.feedback", "inapp.feature", {
        areaId: "EmbeddedAI",
        triggerName: "J91",
        payload: {
          event: triggerEvent
        }
      });
    } finally {
      // ignore
    }
  }
  _exports.triggerPXIntegration = triggerPXIntegration;
  return _exports;
}, false);
//# sourceMappingURL=PXFeedback-dbg.js.map
