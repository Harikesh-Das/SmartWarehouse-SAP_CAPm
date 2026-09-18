/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory"], function (Log, Service, ServiceFactory) {
  "use strict";

  var _exports = {};
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  const ParameterMap = {
    "FE.FilterBarSearch": [{
      name: "countFilters",
      type: "number"
    }, {
      name: "variantLayer",
      type: "string"
    }, {
      name: "autoLoad",
      type: "boolean"
    }, {
      name: "variantApplied",
      type: "string"
    }, {
      name: "filterBarType",
      type: "string"
    }, {
      name: "openedBy",
      type: "string"
    }],
    "FE.EasyFilter": [{
      name: "countFilterTokens",
      type: "number"
    }, {
      name: "countQueryWords",
      type: "number"
    }],
    "FE.Recommendations": [{
      name: "numberOfTimesRecommendationsFetched",
      type: "number"
    }, {
      name: "maxTimeTakenToReceiveRecommendations",
      type: "number"
    }, {
      name: "minTimeTakenToReceiveRecommendations",
      type: "number"
    }, {
      name: "averageTimeTakenToReceiveRecommendations",
      type: "number"
    }, {
      name: "numberOfFieldsAcceptedThroughAcceptButton",
      type: "number"
    }, {
      name: "numberOfFieldsIgnoredThroughIgnoreButton",
      type: "number"
    }, {
      name: "numberOfTimesNoPlaceholderIsShownOnUI",
      type: "number"
    }, {
      name: "numberOfRecommendedFields",
      type: "number"
    }, {
      name: "numberOfTimesTopRecommendationsSelected",
      type: "number"
    }, {
      name: "numberOfTimesNonTopRecommendationsSelected",
      type: "number"
    }, {
      name: "numberOfTimesNonRecommendedValueWasSelected",
      type: "number"
    }, {
      name: "numberOfTimesEmptyRecommendations",
      type: "number"
    }, {
      name: "numberofTimesFormatterCalled",
      type: "number"
    }, {
      name: "totalNumberOfRecommendationsReceived",
      type: "number"
    }, {
      name: "numberOfTimesFormatterNotCalled",
      type: "number"
    }, {
      name: "totalTimeTaken",
      type: "number"
    }]
  };

  // Map event types to GSM Metric IDs
  const MetricIDMap = {
    "FE.FilterBarSearch": "fiori_ui5_fe_filter_bar_search",
    "FE.EasyFilter": "fiori_ui5_fe_easy_filter"
  };
  let TelemetryService = /*#__PURE__*/function (_Service) {
    function TelemetryService() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _Service.call(this, ...args) || this;
      /**
       * Three-state enablement flag for this session:
       * - "pending"  — no probe sent yet; first storeAction call triggers a fetch-based probe
       * - "enabled"  — probe succeeded; all subsequent events use sendBeacon (fire-and-forget)
       * - "disabled" — probe failed (endpoint unreachable / non-2xx); all events are suppressed
       */
      _this.gsmState = "pending";
      _this.pendingEvents = [];
      return _this;
    }
    _exports.TelemetryService = TelemetryService;
    _inheritsLoose(TelemetryService, _Service);
    var _proto = TelemetryService.prototype;
    _proto.init = function init() {
      const context = this.getContext();
      this.appComponent = context?.scopeObject;
      const fioriDefinition = this.appComponent.getManifestEntry("sap.fiori");
      this.appId = fioriDefinition?.registrationIds?.join("-");
    };
    _proto.initialize = function initialize() {
      // Flush pending telemetry events immediately when the page becomes hidden
      // (e.g. tab close or tab switch) to prevent data loss.
      this.onVisibilityChange = () => {
        if (document.visibilityState === "hidden") {
          this.flushAllPending();
        }
      };
      document.addEventListener("visibilitychange", this.onVisibilityChange);
      return this;
    };
    _proto.exit = function exit() {
      this.flushAllPending();
      if (this.onVisibilityChange) {
        document.removeEventListener("visibilitychange", this.onVisibilityChange);
        this.onVisibilityChange = undefined;
      }
    }

    /**
     * Returns whether telemetry is enabled for this session.
     *
     * The method handles three states:
     * 1. Probe completed (enabledPromise exists): Returns the cached result immediately.
     * All callers share the same promise instance — no per-caller overhead.
     * 2. Probe in-flight (probePromise exists): Returns a promise that waits for the
     * probe to complete and resolves to the actual result (true or false).
     * 3. Probe not yet triggered (neither promise exists): Returns true optimistically.
     * This only happens before the very first storeAction call. It is necessary to
     * avoid a deadlock — BBs call isTelemetryEnabled() before collecting data and
     * calling storeAction(), but storeAction() is what triggers the probe. Without
     * the optimistic true, the probe would never be triggered and the BB would never
     * proceed. Once the probe completes, subsequent calls return the definitive result.
     * @returns A promise that resolves to true if telemetry is enabled, false otherwise.
     */;
    _proto.isEnabled = async function isEnabled() {
      if (this.enabledPromise) {
        return this.enabledPromise;
      }
      if (this.probePromise) {
        return this.probePromise;
      }
      return true;
    }

    /**
     * Immediately sends all pending events via sendBeacon — called on
     * visibilitychange("hidden") and exit() so data is not lost when the
     * page is being torn down.
     */;
    _proto.flushAllPending = function flushAllPending() {
      if (this.pendingEvents.length === 0) {
        return;
      }
      const body = this.buildRequestBody(this.pendingEvents);
      navigator.sendBeacon(TelemetryService.targetUrl, body);
      this.pendingEvents = [];
    }

    /**
     * Schedules a single event to be sent via sendBeacon after the configured delay.
     * Each call creates its own independent timer.
     * @param event A telemetry event to send.
     */;
    _proto.scheduleBeacon = function scheduleBeacon(event) {
      const body = this.buildRequestBody([event]);
      setTimeout(() => {
        const index = this.pendingEvents.indexOf(event);
        if (index === -1) {
          return; // Already flushed — skip to avoid double-send
        }
        navigator.sendBeacon(TelemetryService.targetUrl, body);
        this.pendingEvents.splice(index, 1);
      }, TelemetryService.beaconDelayInMs);
    }

    /**
     * Entry point for Fe telemetry data reporting. It catches all exceptions so that
     * any unhandled errors do not affect regular Fe app functionalities.
     * @param telemetryEvent A telemetry event that contain metrics to be reported to GSM.
     */;
    _proto.storeAction = function storeAction(telemetryEvent) {
      if (this.gsmState === "disabled") {
        return;
      }
      try {
        this.pendingEvents.push(telemetryEvent);
        if (this.gsmState === "pending" && !this.probePromise) {
          this.probePromise = new Promise(resolve => {
            this.probeResolve = resolve;
          });
          this.sendProbe(telemetryEvent);
        } else if (this.gsmState === "enabled") {
          this.scheduleBeacon(telemetryEvent);
        }
      } catch (error) {
        Log.warning(error);
      }
    }

    /**
     * Sends the first telemetry event via fetch to probe whether the GSM
     * endpoint is reachable on this landscape. On success, transitions to "enabled"
     * and flushes any queued events via scheduleBeacon. On failure, transitions to "disabled"
     * and discards pending events.
     * @param probeEvent The first telemetry event, which doubles as the probe payload.
     */;
    _proto.sendProbe = function sendProbe(probeEvent) {
      const body = this.buildRequestBody([probeEvent]);
      setTimeout(async () => {
        try {
          const response = await fetch(TelemetryService.targetUrl, {
            method: "POST",
            body
          });
          if (response.ok) {
            this.gsmState = "enabled";
            this.enabledPromise = Promise.resolve(true);
            this.probeResolve?.(true);
            const index = this.pendingEvents.indexOf(probeEvent);
            if (index !== -1) {
              this.pendingEvents.splice(index, 1);
            }
            const queued = [...this.pendingEvents];
            queued.forEach(event => this.scheduleBeacon(event));
          } else {
            this.gsmState = "disabled";
            this.enabledPromise = Promise.resolve(false);
            this.probeResolve?.(false);
            this.pendingEvents = [];
          }
        } catch {
          this.gsmState = "disabled";
          this.enabledPromise = Promise.resolve(false);
          this.probeResolve?.(false);
          this.pendingEvents = [];
        }
      }, TelemetryService.beaconDelayInMs);
    }

    /**
     * Serializes telemetry events to the string format accepted by the GSM endpoint.
     * @param events An array of telemetry events.
     * @returns Serialized data to be posted to the GSM endpoint.
     */;
    _proto.buildRequestBody = function buildRequestBody(events) {
      const fioriID = this.appId ?? this.appComponent.getId();
      return events.map(event => {
        const metricID = MetricIDMap[event.type];
        const paramParts = [`fioriID="${fioriID}"`];
        const parameterPerType = ParameterMap[event.type];
        parameterPerType.forEach(_ref => {
          let {
            name: paramName,
            type: paramType
          } = _ref;
          const value = event.parameters[paramName];
          if (value === undefined || value === null) {
            return;
          }
          switch (paramType) {
            case "number":
            case "boolean":
              paramParts.push(`${paramName}=${value}`);
              break;
            case "string":
            default:
              paramParts.push(`${paramName}="${value}"`);
              break;
          }
        });
        return `${metricID}{ ${paramParts.join(", ")} }\n`;
      }).join("");
    };
    return TelemetryService;
  }(Service);
  TelemetryService.beaconDelayInMs = 3000;
  _exports.TelemetryService = TelemetryService;
  TelemetryService.targetUrl = "/sap/bc/ui2/flp;sap-metrics-only";
  let TelemetryServiceFactory = /*#__PURE__*/function (_ServiceFactory) {
    function TelemetryServiceFactory() {
      return _ServiceFactory.apply(this, arguments) || this;
    }
    _exports = TelemetryServiceFactory;
    _inheritsLoose(TelemetryServiceFactory, _ServiceFactory);
    var _proto2 = TelemetryServiceFactory.prototype;
    _proto2.createInstance = async function createInstance(oServiceContext) {
      const instance = new TelemetryService(oServiceContext);
      return instance.initialize();
    };
    return TelemetryServiceFactory;
  }(ServiceFactory);
  _exports = TelemetryServiceFactory;
  return _exports;
}, false);
//# sourceMappingURL=TelemetryServiceFactory-dbg.js.map
