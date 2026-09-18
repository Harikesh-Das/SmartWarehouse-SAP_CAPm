declare module "sap/fe/core/controllerextensions/BaseControllerExtension" {
	import type PageController from "sap/fe/core/PageController";
	import type EditFlowOverrides from "sap/fe/core/controllerextensions/EditFlowOverrides";
	import type IntentBasedNavigationOverride from "sap/fe/core/controllerextensions/IntentBasedNavigationOverrides";
	import type MessageHandlerOverrides from "sap/fe/core/controllerextensions/MessageHandlerOverrides";
	import type PaginatorOverrides from "sap/fe/core/controllerextensions/PaginatorOverrides";
	import type RoutingOverrides from "sap/fe/core/controllerextensions/RoutingOverrides";
	import type ShareOverrides from "sap/fe/core/controllerextensions/ShareOverrides";
	import type ViewStateOverrides from "sap/fe/core/controllerextensions/ViewStateOverrides";
	import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";

	type MapThis<T, S> = {
		[P in keyof S]?: S[P] extends (...args: infer A) => infer R ? (this: T, ...args: A) => R : S[P];
	};
	export type ControllerExtensionOverrides<T, ControllerType> = {
		// Lifecycle hooks
		onInit?: (this: T) => void;
		onBeforeRendering?: (this: T) => void;
		onAfterRendering?: (this: T) => void;
		onExit?: (this: T) => void;

		// CExt Hooks
		paginator?: MapThis<T, PaginatorOverrides>;
		editFlow?: MapThis<T, EditFlowOverrides>;
		routing?: MapThis<T, RoutingOverrides>;
		messageHandler?: MapThis<T, MessageHandlerOverrides>;
		intentBasedNavigation?: MapThis<T, IntentBasedNavigationOverride>;
		share?: MapThis<T, ShareOverrides>;
		viewState?: MapThis<T, ViewStateOverrides>;
	} & MapThis<
		T,
		Omit<
			ControllerType,
			"editFlow" | "paginator" | "routing" | "messageHandler" | "intentBasedNavigation" | "recommendations" | "share" | "viewState"
		>
	>;

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	export default class BaseControllerExtension<T extends PageController = PageController> extends ControllerExtension {
		protected base: T;

		public static createExtensionOverrides<K, BaseControllerType = PageController>(
			overrides: ControllerExtensionOverrides<K, BaseControllerType>
		): ControllerExtensionOverrides<K, BaseControllerType>;

		constructor();
	}
}
