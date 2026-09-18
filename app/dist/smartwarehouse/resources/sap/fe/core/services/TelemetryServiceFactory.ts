import Log from "sap/base/Log";
import type AppComponent from "sap/fe/core/AppComponent";
import Service from "sap/ui/core/service/Service";
import ServiceFactory from "sap/ui/core/service/ServiceFactory";
import type { ServiceContext } from "types/metamodel_types";

type TelemetryServiceSettings = {};

export type TelemetryFilterBarSearchEventType = "FE.FilterBarSearch";
export type TelemetryRecommendationType = "FE.Recommendations";
export type TelemetryEasyFilterType = "FE.EasyFilter";

type TelemetryEvent = {
	type: TelemetryFilterBarSearchEventType | TelemetryRecommendationType | TelemetryEasyFilterType;
	parameters: Record<string, string | number | boolean>;
};

export type RecommendationTelemetry = {
	// How many times do we re-read the data?
	// number of times recommendations were fetched in the current view (irrespective of page/table context)
	numberOfTimesRecommendationsFetched: number;
	// How long did the recommendation call take?
	// maximum time taken to receive recommendations
	maxTimeTakenToReceiveRecommendations: number;
	// manimum time taken to receive recommendations
	minTimeTakenToReceiveRecommendations: number;
	// average time taken to receive recommendations
	averageTimeTakenToReceiveRecommendations: number;
	//number of times, placeholder is not seen on UI
	numberOfTimesNoPlaceholderIsShownOnUI: number;
	// number of Field having recommendations
	numberOfRecommendedFields: number;
	// number of Fields directly accepted through Accept button
	numberOfFieldsAcceptedThroughAcceptButton: number;
	// number of Fields ignored through Accept button
	numberOfFieldsIgnoredThroughIgnoreButton: number;
	// number of times top recommendation was selected
	numberOfTimesTopRecommendationsSelected: number;
	// number of times non-top recommendation was selected
	numberOfTimesNonTopRecommendationsSelected: number;
	// number of times non-recommended value was selected
	numberOfTimesNonRecommendedValueWasSelected: number;
	// number of times empty recommendations were received from backend
	numberOfTimesEmptyRecommendations: number;
	// number of times formatter was called to show recommended state
	numberofTimesFormatterCalled: number;
	// total numberOfRecommendationsReceived
	totalNumberOfRecommendationsReceived: number;
	// number of times formatter not called
	numberOfTimesFormatterNotCalled: number;
	// total time taken
	totalTimeTaken: number;
};

export type TelemetryFilterBarSearchEvent = TelemetryEvent & {
	type: "FE.FilterBarSearch";
	parameters: {
		countFilters: number; // How many different filters are applied
		variantLayer: string; // Type of variant
		autoLoad: boolean; // Is the app using auto load of table data
		variantApplied: string; // Y=variant applied, N=standard variant
		filterBarType: string; // S=standard filter bar, V=visual filter
		openedBy: string; // F=FLP, N=external navigation
	};
};

export type TelemetryRecommendations = TelemetryEvent & {
	type: "FE.Recommendations";
	parameters: RecommendationTelemetry;
};

export type TelemetryEasyFilterEvent = TelemetryEvent & {
	type: TelemetryEasyFilterType;
	parameters: {
		countFilterTokens: number;
		countQueryWords: number;
	};
};

const ParameterMap = {
	"FE.FilterBarSearch": [
		{ name: "countFilters", type: "number" },
		{ name: "variantLayer", type: "string" },
		{ name: "autoLoad", type: "boolean" },
		{ name: "variantApplied", type: "string" },
		{ name: "filterBarType", type: "string" },
		{ name: "openedBy", type: "string" }
	],
	"FE.EasyFilter": [
		{ name: "countFilterTokens", type: "number" },
		{ name: "countQueryWords", type: "number" }
	],
	"FE.Recommendations": [
		{
			name: "numberOfTimesRecommendationsFetched",
			type: "number"
		},
		{
			name: "maxTimeTakenToReceiveRecommendations",
			type: "number"
		},
		{
			name: "minTimeTakenToReceiveRecommendations",
			type: "number"
		},
		{
			name: "averageTimeTakenToReceiveRecommendations",
			type: "number"
		},
		{
			name: "numberOfFieldsAcceptedThroughAcceptButton",
			type: "number"
		},
		{
			name: "numberOfFieldsIgnoredThroughIgnoreButton",
			type: "number"
		},
		{
			name: "numberOfTimesNoPlaceholderIsShownOnUI",
			type: "number"
		},
		{
			name: "numberOfRecommendedFields",
			type: "number"
		},
		{
			name: "numberOfTimesTopRecommendationsSelected",
			type: "number"
		},
		{
			name: "numberOfTimesNonTopRecommendationsSelected",
			type: "number"
		},
		{
			name: "numberOfTimesNonRecommendedValueWasSelected",
			type: "number"
		},
		{
			name: "numberOfTimesEmptyRecommendations",
			type: "number"
		},
		{
			name: "numberofTimesFormatterCalled",
			type: "number"
		},
		{
			name: "totalNumberOfRecommendationsReceived",
			type: "number"
		},
		{
			name: "numberOfTimesFormatterNotCalled",
			type: "number"
		},
		{
			name: "totalTimeTaken",
			type: "number"
		}
	]
};

// Map event types to GSM Metric IDs
const MetricIDMap: Record<string, string> = {
	"FE.FilterBarSearch": "fiori_ui5_fe_filter_bar_search",
	"FE.EasyFilter": "fiori_ui5_fe_easy_filter"
};

export type TelemetryEvents = TelemetryFilterBarSearchEvent | TelemetryRecommendations | TelemetryEasyFilterEvent;

export class TelemetryService extends Service<TelemetryServiceSettings> {
	private appId?: string;

	private appComponent!: AppComponent;

	/**
	 * Three-state enablement flag for this session:
	 * - "pending"  — no probe sent yet; first storeAction call triggers a fetch-based probe
	 * - "enabled"  — probe succeeded; all subsequent events use sendBeacon (fire-and-forget)
	 * - "disabled" — probe failed (endpoint unreachable / non-2xx); all events are suppressed
	 */
	private gsmState: "pending" | "enabled" | "disabled" = "pending";

	private pendingEvents: TelemetryEvents[] = [];

	private enabledPromise?: Promise<boolean>;

	private probePromise?: Promise<boolean>;

	private probeResolve?: (enabled: boolean) => void;

	private onVisibilityChange?: () => void;

	static beaconDelayInMs = 3000;

	static targetUrl = "/sap/bc/ui2/flp;sap-metrics-only";

	init(): void {
		const context = this.getContext();
		this.appComponent = context?.scopeObject as AppComponent;
		const fioriDefinition = this.appComponent.getManifestEntry("sap.fiori");

		this.appId = fioriDefinition?.registrationIds?.join("-");
	}

	initialize(): this {
		// Flush pending telemetry events immediately when the page becomes hidden
		// (e.g. tab close or tab switch) to prevent data loss.
		this.onVisibilityChange = (): void => {
			if (document.visibilityState === "hidden") {
				this.flushAllPending();
			}
		};
		document.addEventListener("visibilitychange", this.onVisibilityChange);

		return this;
	}

	exit(): void {
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
	 */
	async isEnabled(): Promise<boolean> {
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
	 */
	private flushAllPending(): void {
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
	 */
	private scheduleBeacon(event: TelemetryEvents): void {
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
	 */
	storeAction(telemetryEvent: TelemetryEvents): void {
		if (this.gsmState === "disabled") {
			return;
		}
		try {
			this.pendingEvents.push(telemetryEvent);

			if (this.gsmState === "pending" && !this.probePromise) {
				this.probePromise = new Promise((resolve) => {
					this.probeResolve = resolve;
				});
				this.sendProbe(telemetryEvent);
			} else if (this.gsmState === "enabled") {
				this.scheduleBeacon(telemetryEvent);
			}
		} catch (error) {
			Log.warning(error as string);
		}
	}

	/**
	 * Sends the first telemetry event via fetch to probe whether the GSM
	 * endpoint is reachable on this landscape. On success, transitions to "enabled"
	 * and flushes any queued events via scheduleBeacon. On failure, transitions to "disabled"
	 * and discards pending events.
	 * @param probeEvent The first telemetry event, which doubles as the probe payload.
	 */
	private sendProbe(probeEvent: TelemetryEvents): void {
		const body = this.buildRequestBody([probeEvent]);

		setTimeout(async () => {
			try {
				const response = await fetch(TelemetryService.targetUrl, { method: "POST", body });
				if (response.ok) {
					this.gsmState = "enabled";
					this.enabledPromise = Promise.resolve(true);
					this.probeResolve?.(true);
					const index = this.pendingEvents.indexOf(probeEvent);
					if (index !== -1) {
						this.pendingEvents.splice(index, 1);
					}
					const queued = [...this.pendingEvents];
					queued.forEach((event) => this.scheduleBeacon(event));
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
	 */
	private buildRequestBody(events: TelemetryEvent[]): string {
		const fioriID = this.appId ?? this.appComponent.getId();

		return events
			.map((event) => {
				const metricID = MetricIDMap[event.type];
				const paramParts: string[] = [`fioriID="${fioriID}"`];
				const parameterPerType = ParameterMap[event.type];

				parameterPerType.forEach(({ name: paramName, type: paramType }) => {
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
			})
			.join("");
	}
}

export default class TelemetryServiceFactory extends ServiceFactory<TelemetryServiceSettings> {
	async createInstance(oServiceContext: ServiceContext<TelemetryServiceSettings>): Promise<TelemetryService> {
		const instance = new TelemetryService(oServiceContext);
		return instance.initialize();
	}
}
