import { defineUI5Class } from "sap/fe/base/ClassSupport";
import type PageController from "sap/fe/core/PageController";
import type BaseObject from "sap/ui/base/Object";
import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import type ControllerMetadata from "sap/ui/core/mvc/ControllerMetadata";
/**
 * A base implementation for controller extension used internally in sap.fe for central functionalities.
 * @public
 * @since 1.118.0
 */
@defineUI5Class("sap.fe.core.controllerextensions.BaseControllerExtension")
export default class BaseControllerExtension<T extends PageController = PageController> extends ControllerExtension {
	// Set by UI5
	/**
	 * The controller instance that is extended by this controller extension.
	 * @public
	 */
	protected base!: T;

	/**
	 * Create the overrides for the controller extension.
	 *
	 * This method is a helper to get the correct typing when implementing your own controller extension.
	 * @param overrides The overrides to apply
	 * @returns The overrides passed in as parameter with correct typing
	 * @public
	 */
	public static createExtensionOverrides = function (overrides: object): object {
		return overrides;
	};

	constructor() {
		super();
		(this as unknown as { init: Function }).init();
	}

	/**
	 * This method is called when the controller extension is instantiated.
	 * We need to override it for the specific handling for the BeforeAsync and AfterAsync methods, otherwise the last level of the extension replaces our implementation.
	 * @returns The interface for this controller extension
	 */
	getInterface(): BaseObject {
		const interfaceObj = super.getInterface();
		const metadata = this.getMetadata() as ControllerMetadata;
		const allMethods = metadata.getAllMethods();
		const methodHolder: Record<string, Function[]> = {};

		for (const methodName in allMethods) {
			const method = allMethods[methodName];
			if (method.overrideExecution && (method.overrideExecution === "AfterAsync" || method.overrideExecution === "BeforeAsync")) {
				methodHolder[methodName] = [(interfaceObj as unknown as Record<string, Function>)[methodName]];
				Object.defineProperty(interfaceObj, methodName, {
					configurable: true,
					set: (v: Function) => {
						return methodHolder[methodName].push(v);
					},
					get: () => {
						return async (...args: unknown[]) => {
							const methodArrays = methodHolder[methodName];
							if (method.overrideExecution === "BeforeAsync") {
								methodArrays.reverse();
							}
							let result;
							for (const arg of methodArrays) {
								result = await arg.apply(this, args);
							}
							return result;
						};
					}
				});
			}
		}

		return interfaceObj;
	}
}
