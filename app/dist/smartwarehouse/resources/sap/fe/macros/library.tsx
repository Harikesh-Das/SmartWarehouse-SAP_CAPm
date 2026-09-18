import Log from "sap/base/Log";
import "sap/f/library";
import "sap/fe/controls/library";
import AppComponent from "sap/fe/core/AppComponent";
import type ExtensionAPI from "sap/fe/core/ExtensionAPI";
import type PageController from "sap/fe/core/PageController";
import type { IVisitorCallback } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import "sap/fe/core/library";
import "sap/fe/macros/coreUI/factory";
import FilterOperatorUtils from "sap/fe/macros/filter/FilterOperatorUtils";
import "sap/fe/macros/filter/type/MultiValue";
import "sap/fe/macros/filter/type/Range";
import "sap/fe/macros/formatters/TableFormatter";
import "sap/fe/macros/formatters/VisualFilterFormatter";
import "sap/fe/macros/internal/valuehelp/AdditionalValueFormatter";
import "sap/fe/macros/macroLibrary";
import DataType from "sap/ui/base/DataType";
import type Control from "sap/ui/core/Control";
import CustomData from "sap/ui/core/CustomData";
import Fragment from "sap/ui/core/Fragment";
import Library from "sap/ui/core/Lib";
import "sap/ui/core/XMLTemplateProcessor";
import "sap/ui/core/library";
import type View from "sap/ui/core/mvc/View";
import XMLPreprocessor from "sap/ui/core/util/XMLPreprocessor";
import "sap/ui/mdc/library";
import "sap/ui/unified/library";

/**
 * Library containing the building blocks for SAP Fiori elements.
 * @namespace
 * @public
 */
export const macrosNamespace = "sap.fe.macros";

// library dependencies
const thisLib = Library.init({
	name: "sap.fe.macros",
	apiVersion: 2,
	dependencies: ["sap.ui.core", "sap.ui.mdc", "sap.ui.unified", "sap.fe.core", "sap.fe.navigation", "sap.fe.controls", "sap.m", "sap.f"],
	types: ["sap.fe.macros.NavigationType"],
	interfaces: [],
	controls: [],
	elements: [],
	// eslint-disable-next-line no-template-curly-in-string
	version: "${version}",
	noLibraryCSS: true,
	extensions: {
		flChangeHandlers: {
			"sap.fe.macros.controls.FilterBar": "sap/ui/mdc/flexibility/FilterBar",
			"sap.fe.macros.EasyFilterBar": "sap/fe/macros/flexibility/EasyFilterBar",
			"sap.fe.macros.controls.Section": "sap/uxap/flexibility/ObjectPageSection",
			"sap.fe.macros.controls.section.SubSection": "sap/uxap/flexibility/ObjectPageSubSection"
		}
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;

export enum NavigationType {
	/**
	 * For External Navigation
	 * @public
	 */
	External = "External",

	/**
	 * For In-Page Navigation
	 * @public
	 */
	InPage = "InPage",

	/**
	 * For No Navigation
	 * @public
	 */
	None = "None"
}

thisLib.NavigationType = NavigationType;
DataType.registerEnum("sap.fe.macros.NavigationType", thisLib.NavigationType);
Fragment.registerType("CUSTOM", {
	load: (Fragment as { getType?: Function }).getType?.("XML").load,
	init: async function (
		mSettings: {
			containingView?: View;
			oController?: PageController;
			id: string;
			childCustomData: Record<string, string> | undefined;
			contextPath?: string;
		},
		...args: unknown[]
	) {
		const currentController = (mSettings.containingView?.getController() ?? mSettings.oController) as PageController;
		let targetControllerExtension: PageController | ExtensionAPI = currentController;
		if (currentController && !currentController.isA<ExtensionAPI>("sap.fe.core.ExtensionAPI")) {
			targetControllerExtension = currentController.getExtensionAPI(mSettings.id);
		}
		mSettings.containingView = {
			oController: targetControllerExtension,
			createId: currentController?.createId?.bind(targetControllerExtension)
		} as unknown as View;
		const childCustomData = mSettings.childCustomData ?? undefined;
		const contextPath = mSettings.contextPath;
		delete mSettings.childCustomData;
		delete mSettings.contextPath;
		(this as { _fnSettingsPreprocessor?: Function })._fnSettingsPreprocessor = function (
			this: Control,
			controlSettings: {
				contextPath: unknown;
			}
		): unknown {
			if (this.getMetadata().hasProperty("contextPath")) {
				controlSettings.contextPath ??= contextPath;
			}

			return controlSettings;
		};
		const result = await (Fragment as unknown as { getType: Function }).getType("XML").init.apply(this, [mSettings, args]);
		if (childCustomData && result?.isA("sap.ui.core.Control")) {
			for (const customDataKey in childCustomData) {
				// UI5 adds 'bindingString' when its an adaptation project (SNOW: DINC0143515), which results in errors later
				if (customDataKey === "bindingString") {
					delete childCustomData[customDataKey];
					continue;
				}
				(result as Control).addCustomData(<CustomData key={customDataKey} value={childCustomData[customDataKey]} />);
			}
		}

		return result;
	}
});

Fragment.registerType("SCOPEDFEFRAGMENT", {
	load: (Fragment as { getType?: Function }).getType?.("XML").load,
	init: function (
		mSettings: { containingView: View; id: string; childCustomData: Record<string, string> | undefined; contextPath?: string },
		...args: unknown[]
	) {
		const contextPath = mSettings.contextPath;
		delete mSettings.contextPath;
		(this as { _fnSettingsPreprocessor?: Function })._fnSettingsPreprocessor = function (
			this: Control,
			controlSettings: {
				contextPath: unknown;
			}
		): unknown {
			if (this.getMetadata().hasProperty("contextPath")) {
				controlSettings.contextPath ??= contextPath;
			}

			return controlSettings;
		};
		return (Fragment as unknown as { getType: Function }).getType("XML").init.apply(this, [mSettings, args]);
	}
});

Library.load({ name: "sap.fe.macros" })
	.then(() => {
		AppComponent.registerInstanceDependentProcessForStartUp(FilterOperatorUtils.processCustomFilterOperators);
		return;
	})
	.catch((error: unknown) => {
		Log.error(`Error loading 'sap.fe.macros`, error as Error | string);
	});

const rewriteNodes = function (parentNamespace: string, parentName: string, childNamespace: string, childName: string): Function {
	// eslint-disable-next-line @typescript-eslint/require-await
	return async (oNode: Element, _oVisitor: IVisitorCallback): Promise<void> => {
		if (oNode.hasChildNodes() && oNode.attributes.length === 0) {
			await _oVisitor.visitChildNodes(oNode);
			return; // In case a node has children and no attribute it's already formatted properly
		}
		const newNode = document.createElementNS(childNamespace, childName);
		const newParent = document.createElementNS(parentNamespace, parentName);
		const attributeNames = oNode.getAttributeNames();
		if (attributeNames.length > 0) {
			// Only consider case where we have attributes, meaning the old syntax
			for (const attributeName of attributeNames) {
				newNode.setAttribute(attributeName, oNode.getAttribute(attributeName)!);
			}
			newParent.appendChild(newNode);
		}
		await _oVisitor.visitChildNodes(newParent);
		oNode.replaceWith(newParent);
	};
};

/**
 * Replaces child name space.
 * @param childNamespace Child name space to use
 * @param childName Local child name to use, such as "localChildName".
 * @param nameSpaceAlias The name space alias to use, such as "ns"
 * @param targetedLocalChildNames Only replace name spaces of children with these local child names.
 * @returns A function that rewrites the child namespace
 */
const rewriteChildNameSpace = function (
	childNamespace: string,
	childName?: string,
	nameSpaceAlias?: string,
	targetedLocalChildNames?: string[]
): Function {
	//Replace the child for the aggregation.
	//If nameSpaceAlias is provided, we use is as namespace alias for the child.
	// eslint-disable-next-line @typescript-eslint/require-await
	return async (oNode: Element, _oVisitor: IVisitorCallback): Promise<void> => {
		if (!oNode.hasChildNodes()) {
			return;
		}
		// Snapshot children into an array before iterating since we modify the live collection
		for (const child of Array.from(oNode.children)) {
			const localName = childName ?? child.localName;
			if (targetedLocalChildNames && targetedLocalChildNames.length > 0 && !targetedLocalChildNames.includes(localName)) {
				continue;
			}
			const resolvedChildName = nameSpaceAlias ? `${nameSpaceAlias}:${localName}` : localName;
			const newNode = document.createElementNS(childNamespace, resolvedChildName);
			const attributeNames = child.getAttributeNames();
			if (attributeNames.length > 0) {
				for (const attributeName of attributeNames) {
					newNode.setAttribute(attributeName, child.getAttribute(attributeName)!);
				}
			}
			oNode.replaceChild(newNode, child);
			// Move any children (e.g. default aggregation content) from the old node to the new one
			while (child.firstChild) {
				newNode.appendChild(child.firstChild);
			}
		}
		await _oVisitor.visitChildNodes(oNode);
		return;
	};
};

const tableAggregationsToRewrite = [
	{ name: "creationMode", type: "TableCreationOptions" },
	{ name: "analyticalConfiguration", type: "AnalyticalConfiguration" },
	{ name: "uploadConfiguration", type: "UploadConfiguration" }
];
//Ensure that the the aggregation is set to the relevant namespace
for (const aggregation of tableAggregationsToRewrite) {
	XMLPreprocessor.plugIn(
		rewriteNodes("sap.fe.macros", `macros:${aggregation.name}`, "sap.fe.macros.table", `macroTable:${aggregation.type}`),
		"sap.fe.macros",
		aggregation.name
	);
	XMLPreprocessor.plugIn(
		rewriteNodes("sap.fe.macros", `macros:${aggregation.name}`, "sap.fe.macros.table", `macroTable:${aggregation.type}`),
		"sap.m",
		aggregation.name
	);
}

// Ensure that the child inside the filterFields aggregation is set to the correct namespace,
// preserving the child's local name (like, FilterField or FilterFieldOverride)
XMLPreprocessor.plugIn(
	rewriteChildNameSpace("sap.fe.macros.filterBar", undefined, "macroFilterBar", ["FilterField", "FilterFieldOverride"]),
	"sap.fe.macros",
	"filterFields"
);

const tableAggregationChildToRewrite = [
	{ name: "quickVariantSelection", type: "QuickVariantSelection" },
	{ name: "massEdit", type: "MassEdit" }
];
//Ensure that the child inside the aggregation is set to the relevant namespace
for (const aggregation of tableAggregationChildToRewrite) {
	XMLPreprocessor.plugIn(rewriteChildNameSpace("sap.fe.macros.table", aggregation.type, "macroTable"), "sap.fe.macros", aggregation.name);
}

// Rewrite the old shareOptions to the new one
XMLPreprocessor.plugIn(
	rewriteNodes("sap.fe.macros", "macros:shareOptions", "sap.fe.macros.share", "macroShare:ShareOptions"),
	"sap.fe.macros",
	"shareOptions"
);

XMLPreprocessor.plugIn(
	rewriteNodes("sap.fe.macros", "macros:formatOptions", "sap.fe.macros.field", "macroField:FieldFormatOptions"),
	"sap.fe.macros",
	"formatOptions"
);

XMLPreprocessor.plugIn(
	rewriteNodes("sap.fe.macros", "macros:formatOptions", "sap.fe.macros.field", "macroField:FieldFormatOptions"),
	"sap.m",
	"formatOptions"
);

XMLPreprocessor.plugIn(
	rewriteNodes("sap.fe.macros", "macros:layout", "sap.fe.macros.form", "form:FormLayoutOptions"),
	"sap.fe.macros",
	"layout"
);

async function manageActions(oNode: Element, oVisitor: IVisitorCallback): Promise<void> {
	const enabledValue = oNode.getAttribute("enabled");
	if (!enabledValue || enabledValue === "true" || enabledValue === "false" || enabledValue.startsWith("{")) {
		return;
	}

	oNode.setAttribute("enabledCallBack", enabledValue);
	oNode.removeAttribute("enabled");
	await oVisitor.visitAttributes(oNode);
}

XMLPreprocessor.plugIn(manageActions, "sap.fe.macros.table", "Action");

export default thisLib;
