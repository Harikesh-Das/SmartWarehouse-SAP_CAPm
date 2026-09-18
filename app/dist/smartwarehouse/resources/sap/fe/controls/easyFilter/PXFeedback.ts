import EventBus from "sap/ui/core/EventBus";

export function triggerPXIntegration(triggerEvent: string): void {
	try {
		const eventBus = EventBus.getInstance();
		eventBus.publish("sap.feedback", "inapp.feature", {
			areaId: "EmbeddedAI",
			triggerName: "J91",
			payload: { event: triggerEvent }
		});
	} finally {
		// ignore
	}
}
