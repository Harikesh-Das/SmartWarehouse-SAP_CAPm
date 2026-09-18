/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/ui/core/EventBus"], function (Log, EventBus) {
  "use strict";

  var _exports = {};
  /**
   * Valid event types for Easy Fill PX feedback integration
   */

  /**
   * Triggers PX integration event for Easy Fill user feedback.
   * Events are sent to SAP Product Experience (PX) analytics.
   * @param triggerEvent The type of user action to track
   */
  function triggerPXIntegration(triggerEvent) {
    try {
      const eventBus = EventBus.getInstance();
      const payload = {
        areaId: "EmbeddedAI",
        triggerName: "J281",
        payload: {
          event: triggerEvent
        }
      };
      eventBus.publish("sap.feedback", "inapp.feature", payload);
    } catch (error) {
      Log.error("Error in triggerPXIntegration", error);
    }
  }
  _exports.triggerPXIntegration = triggerPXIntegration;
  return _exports;
}, false);
//# sourceMappingURL=PXFeedback-dbg.js.map
