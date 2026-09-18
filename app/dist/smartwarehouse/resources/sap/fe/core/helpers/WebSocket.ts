import SapPcpWebSocket, { SUPPORTED_PROTOCOLS } from "sap/ui/core/ws/SapPcpWebSocket";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type AppComponent from "../AppComponent";

export enum WEBSOCKET_STATUS {
	CLOSED = 0,
	CLOSING = 1,
	CONNECTING = 2,
	CONNECTED = 3,
	ERROR = 4
}

export enum ChannelType {
	CollaborationDraft = "CollaborationDraft",
	SideEffectsEvents = "SideEffectsEvents"
}

export type WebSocketParameter = Record<string, string>;

export function createWebSocket(
	channelType: ChannelType,
	appComponent: AppComponent,
	additionalParameters?: WebSocketParameter
): SapPcpWebSocket {
	const model = appComponent.getModel();
	const serviceUrl = model.getServiceUrl();
	const socketBaseURL = getWebSocketBaseUrl(model);
	if (!socketBaseURL) {
		throw Error("WebSocket Base URL annotation not found");
	}

	const channelUrl = getWebSocketChannelUrl(channelType, model);
	let socketURI;

	socketURI = appComponent.getManifestObject().resolveUri(socketBaseURL);

	socketURI += `?${channelUrl}relatedService=${serviceUrl}`;

	if (additionalParameters) {
		for (const p in additionalParameters) {
			socketURI += `&${p}=${encodeURI(additionalParameters[p])}`;
		}
	}
	return new SapPcpWebSocket(socketURI, [SUPPORTED_PROTOCOLS.v10]);
}

export function getWebSocketBaseUrl(model: ODataModel): string | undefined {
	return model.getMetaModel().getObject("/@com.sap.vocabularies.Common.v1.WebSocketBaseURL");
}

export function getWebSocketChannelUrl(channelType: ChannelType, model: ODataModel): string | undefined {
	if (!getWebSocketBaseUrl(model)) {
		return "";
	}

	switch (channelType) {
		case ChannelType.CollaborationDraft:
			// currently collaboration draft does not need a channel (might change later)
			return "";
		case ChannelType.SideEffectsEvents:
			// the service need a WebSocketChannel annotated with a #sideEffects qualifier
			const channelName = model.getMetaModel().getObject("/@com.sap.vocabularies.Common.v1.WebSocketChannel#sideEffects");
			return `sideEffects=${channelName}&`;
	}
}
