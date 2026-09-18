import Log from "sap/base/Log";
import type AppComponent from "sap/fe/core/AppComponent";
import type { FEView } from "sap/fe/core/BaseController";
import type { BaseTreeModifier } from "sap/fe/core/CommonUtils";
import CommonUtils from "sap/fe/core/CommonUtils";
import { addGeneratedIdsToControls } from "sap/fe/core/flexibility/XMLTools";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import type { XMLPreprocessorContext } from "sap/fe/core/TemplateComponent";
import Component from "sap/ui/core/Component";
import DelegateMediatorAPI from "sap/ui/fl/apply/api/DelegateMediatorAPI";

/**
 * Runs the provided fragment through the templating engine if the app component is an instance of sap.fe.core.AppComponent
 * This will ensure that all included building blocks will be resolved to their target controls.
 * @param fragment The XML fragment to be processed
 * @param propertyBag An object containing the app component, modifier, view, and optionally componentId
 * @param propertyBag.appComponent
 * @param propertyBag.modifier
 * @param propertyBag.view
 * @param propertyBag.componentId
 * @returns A promise that resolves to the processed XML fragment as a string
 */
async function runTemplating(
	fragment: string,
	propertyBag: { appComponent: AppComponent; modifier: BaseTreeModifier; view: FEView; componentId?: string }
): Promise<string> {
	try {
		if (propertyBag.appComponent.isA("sap.fe.core.AppComponent")) {
			const templateComponent = (
				propertyBag.componentId
					? Component.getComponentById(propertyBag.componentId)
					: Component.getOwnerComponentFor(propertyBag.view)
			) as TemplateComponent | undefined;
			const preprocessorContext = (templateComponent?.preprocessorContext ?? {}) as XMLPreprocessorContext;
			const fragmentXML = new DOMParser().parseFromString(fragment, "text/xml");
			const templatedResult = await CommonUtils.templateControlFragment(
				fragmentXML.firstElementChild,
				{
					models: preprocessorContext.models,
					bindingContexts: preprocessorContext.bindingContexts
				},
				{ view: propertyBag.view, isXML: true },
				propertyBag.modifier
			);
			if (templatedResult instanceof Element) {
				addGeneratedIdsToControls(templatedResult);
				return templatedResult.outerHTML;
			}
			// If something goes wrong, fallback to the original fragment
			return fragment;
		} else {
			return fragment;
		}
	} catch (error) {
		Log.error("Error during Fiori Elements XML Templating in flexibility handler:", error as Error);
		return fragment;
	}
}

// Register a hook onto the addXML handler from Flex that will run the templating if the conditions are right
DelegateMediatorAPI.registerAddXMLAdjustFragmentHandler({
	key: "FEXMLTemplating",
	handler: runTemplating,
	reference: "sap.fe.macros.BaseAddXMLAdjustFragmentHandler"
});
