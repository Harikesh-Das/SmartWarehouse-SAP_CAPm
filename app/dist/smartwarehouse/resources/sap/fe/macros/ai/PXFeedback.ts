import Log from "sap/base/Log";
import EventBus from "sap/ui/core/EventBus";

/**
 * Valid event types for Easy Fill PX feedback integration
 */
type PXEventType = "thumbUp" | "thumbDown" | "confirm" | "cancel";

/**
 * Triggers PX integration event for Easy Fill user feedback.
 * Events are sent to SAP Product Experience (PX) analytics.
 * @param triggerEvent The type of user action to track
 */
export function triggerPXIntegration(triggerEvent: PXEventType): void {
	try {
		const eventBus = EventBus.getInstance();
		const payload = {
			areaId: "EmbeddedAI",
			triggerName: "J281",
			payload: { event: triggerEvent }
		};
		eventBus.publish("sap.feedback", "inapp.feature", payload);
	} catch (error) {
		Log.error("Error in triggerPXIntegration", error as string);
	}
}
