/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/f/library", "sap/fe/controls/library", "sap/fe/core/AppComponent", "sap/fe/core/library", "sap/fe/macros/coreUI/factory", "sap/fe/macros/filter/FilterOperatorUtils", "sap/fe/macros/filter/type/MultiValue", "sap/fe/macros/filter/type/Range", "sap/fe/macros/formatters/TableFormatter", "sap/fe/macros/formatters/VisualFilterFormatter", "sap/fe/macros/internal/valuehelp/AdditionalValueFormatter", "sap/fe/macros/macroLibrary", "sap/ui/base/DataType", "sap/ui/core/CustomData", "sap/ui/core/Fragment", "sap/ui/core/Lib", "sap/ui/core/XMLTemplateProcessor", "sap/ui/core/library", "sap/ui/core/util/XMLPreprocessor", "sap/ui/mdc/library", "sap/ui/unified/library", "sap/fe/base/jsx-runtime/jsx"], function (Log, _library, _library2, AppComponent, _library3, _factory, FilterOperatorUtils, _MultiValue, _Range, _TableFormatter, _VisualFilterFormatter, _AdditionalValueFormatter, _macroLibrary, DataType, CustomData, Fragment, Library, _XMLTemplateProcessor, _library4, XMLPreprocessor, _library5, _library6, _jsx) {
  "use strict";

  var _exports = {};
  /**
   * Library containing the building blocks for SAP Fiori elements.
   * @namespace
   * @public
   */
  const macrosNamespace = "sap.fe.macros";

  // library dependencies
  _exports.macrosNamespace = macrosNamespace;
  const thisLib = Library.init({
    name: "sap.fe.macros",
    apiVersion: 2,
    dependencies: ["sap.ui.core", "sap.ui.mdc", "sap.ui.unified", "sap.fe.core", "sap.fe.navigation", "sap.fe.controls", "sap.m", "sap.f"],
    types: ["sap.fe.macros.NavigationType"],
    interfaces: [],
    controls: [],
    elements: [],
    // eslint-disable-next-line no-template-curly-in-string
    version: "1.148.3",
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
  });
  let NavigationType = /*#__PURE__*/function (NavigationType) {
    /**
     * For External Navigation
     * @public
     */
    NavigationType["External"] = "External";
    /**
     * For In-Page Navigation
     * @public
     */
    NavigationType["InPage"] = "InPage";
    /**
     * For No Navigation
     * @public
     */
    NavigationType["None"] = "None";
    return NavigationType;
  }({});
  thisLib.NavigationType = NavigationType;
  _exports.NavigationType = NavigationType;
  DataType.registerEnum("sap.fe.macros.NavigationType", thisLib.NavigationType);
  Fragment.registerType("CUSTOM", {
    load: Fragment.getType?.("XML").load,
    init: async function (mSettings) {
      const currentController = mSettings.containingView?.getController() ?? mSettings.oController;
      let targetControllerExtension = currentController;
      if (currentController && !currentController.isA("sap.fe.core.ExtensionAPI")) {
        targetControllerExtension = currentController.getExtensionAPI(mSettings.id);
      }
      mSettings.containingView = {
        oController: targetControllerExtension,
        createId: currentController?.createId?.bind(targetControllerExtension)
      };
      const childCustomData = mSettings.childCustomData ?? undefined;
      const contextPath = mSettings.contextPath;
      delete mSettings.childCustomData;
      delete mSettings.contextPath;
      this._fnSettingsPreprocessor = function (controlSettings) {
        if (this.getMetadata().hasProperty("contextPath")) {
          controlSettings.contextPath ??= contextPath;
        }
        return controlSettings;
      };
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      const result = await Fragment.getType("XML").init.apply(this, [mSettings, args]);
      if (childCustomData && result?.isA("sap.ui.core.Control")) {
        for (const customDataKey in childCustomData) {
          // UI5 adds 'bindingString' when its an adaptation project (SNOW: DINC0143515), which results in errors later
          if (customDataKey === "bindingString") {
            delete childCustomData[customDataKey];
            continue;
          }
          result.addCustomData(_jsx(CustomData, {
            value: childCustomData[customDataKey]
          }, customDataKey));
        }
      }
      return result;
    }
  });
  Fragment.registerType("SCOPEDFEFRAGMENT", {
    load: Fragment.getType?.("XML").load,
    init: function (mSettings) {
      const contextPath = mSettings.contextPath;
      delete mSettings.contextPath;
      this._fnSettingsPreprocessor = function (controlSettings) {
        if (this.getMetadata().hasProperty("contextPath")) {
          controlSettings.contextPath ??= contextPath;
        }
        return controlSettings;
      };
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }
      return Fragment.getType("XML").init.apply(this, [mSettings, args]);
    }
  });
  Library.load({
    name: "sap.fe.macros"
  }).then(() => {
    AppComponent.registerInstanceDependentProcessForStartUp(FilterOperatorUtils.processCustomFilterOperators);
    return;
  }).catch(error => {
    Log.error(`Error loading 'sap.fe.macros`, error);
  });
  const rewriteNodes = function (parentNamespace, parentName, childNamespace, childName) {
    // eslint-disable-next-line @typescript-eslint/require-await
    return async (oNode, _oVisitor) => {
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
          newNode.setAttribute(attributeName, oNode.getAttribute(attributeName));
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
  const rewriteChildNameSpace = function (childNamespace, childName, nameSpaceAlias, targetedLocalChildNames) {
    //Replace the child for the aggregation.
    //If nameSpaceAlias is provided, we use is as namespace alias for the child.
    // eslint-disable-next-line @typescript-eslint/require-await
    return async (oNode, _oVisitor) => {
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
            newNode.setAttribute(attributeName, child.getAttribute(attributeName));
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
  const tableAggregationsToRewrite = [{
    name: "creationMode",
    type: "TableCreationOptions"
  }, {
    name: "analyticalConfiguration",
    type: "AnalyticalConfiguration"
  }, {
    name: "uploadConfiguration",
    type: "UploadConfiguration"
  }];
  //Ensure that the the aggregation is set to the relevant namespace
  for (const aggregation of tableAggregationsToRewrite) {
    XMLPreprocessor.plugIn(rewriteNodes("sap.fe.macros", `macros:${aggregation.name}`, "sap.fe.macros.table", `macroTable:${aggregation.type}`), "sap.fe.macros", aggregation.name);
    XMLPreprocessor.plugIn(rewriteNodes("sap.fe.macros", `macros:${aggregation.name}`, "sap.fe.macros.table", `macroTable:${aggregation.type}`), "sap.m", aggregation.name);
  }

  // Ensure that the child inside the filterFields aggregation is set to the correct namespace,
  // preserving the child's local name (like, FilterField or FilterFieldOverride)
  XMLPreprocessor.plugIn(rewriteChildNameSpace("sap.fe.macros.filterBar", undefined, "macroFilterBar", ["FilterField", "FilterFieldOverride"]), "sap.fe.macros", "filterFields");
  const tableAggregationChildToRewrite = [{
    name: "quickVariantSelection",
    type: "QuickVariantSelection"
  }, {
    name: "massEdit",
    type: "MassEdit"
  }];
  //Ensure that the child inside the aggregation is set to the relevant namespace
  for (const aggregation of tableAggregationChildToRewrite) {
    XMLPreprocessor.plugIn(rewriteChildNameSpace("sap.fe.macros.table", aggregation.type, "macroTable"), "sap.fe.macros", aggregation.name);
  }

  // Rewrite the old shareOptions to the new one
  XMLPreprocessor.plugIn(rewriteNodes("sap.fe.macros", "macros:shareOptions", "sap.fe.macros.share", "macroShare:ShareOptions"), "sap.fe.macros", "shareOptions");
  XMLPreprocessor.plugIn(rewriteNodes("sap.fe.macros", "macros:formatOptions", "sap.fe.macros.field", "macroField:FieldFormatOptions"), "sap.fe.macros", "formatOptions");
  XMLPreprocessor.plugIn(rewriteNodes("sap.fe.macros", "macros:formatOptions", "sap.fe.macros.field", "macroField:FieldFormatOptions"), "sap.m", "formatOptions");
  XMLPreprocessor.plugIn(rewriteNodes("sap.fe.macros", "macros:layout", "sap.fe.macros.form", "form:FormLayoutOptions"), "sap.fe.macros", "layout");
  async function manageActions(oNode, oVisitor) {
    const enabledValue = oNode.getAttribute("enabled");
    if (!enabledValue || enabledValue === "true" || enabledValue === "false" || enabledValue.startsWith("{")) {
      return;
    }
    oNode.setAttribute("enabledCallBack", enabledValue);
    oNode.removeAttribute("enabled");
    await oVisitor.visitAttributes(oNode);
  }
  XMLPreprocessor.plugIn(manageActions, "sap.fe.macros.table", "Action");
  return thisLib;
}, false);
//# sourceMappingURL=library-dbg.js.map
