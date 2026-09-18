/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/jsx-runtime/jsx-control", "sap/fe/base/jsx-runtime/jsx-renderManager", "sap/fe/base/jsx-runtime/jsx-xml"], function (jsxControl, jsxRenderManager, jsxXml) {
  "use strict";

  let renderNextAsXML = false;
  let renderNextUsingRenderManager;
  let xmlNamespaceMap = {};
  const jsx = function (ControlType, mSettings, key) {
    if (!renderNextAsXML && !renderNextUsingRenderManager) {
      return jsxControl(ControlType, mSettings, key, jsxContext, jsxFormatterContext);
    } else if (renderNextUsingRenderManager !== undefined) {
      return jsxRenderManager(ControlType, mSettings, key, renderNextUsingRenderManager);
    } else {
      return jsxXml(ControlType, mSettings, key, xmlNamespaceMap);
    }
  };

  /**
   * Indicates that the next JSX call is rendered using the provided RenderManager.
   * @param renderManager The UI5 RenderManager to use for rendering
   * @param control The control to render
   * @param renderMethod The method to be rendered
   */
  jsx.renderUsingRenderManager = function (renderManager, control, renderMethod) {
    renderNextUsingRenderManager = renderManager;
    const returnValue = renderMethod(control);
    renderNextUsingRenderManager = undefined;
    returnValue();
  };
  jsx.defineXMLNamespaceMap = async function (namespaceMap, renderMethod) {
    xmlNamespaceMap = namespaceMap;
    const returnValue = await renderMethod();
    xmlNamespaceMap = {};
    return returnValue;
  };
  /**
   * Indicates that the next JSX call should be rendered as XML.
   * @param renderMethod The method that needs to be rendered as XML
   * @returns The XML representation of the control
   */
  jsx.renderAsXML = function (renderMethod) {
    renderNextAsXML = true;
    const returnValue = renderMethod();
    renderNextAsXML = false;
    return returnValue;
  };
  let jsxContext = {};
  jsx.getContext = function () {
    return jsxContext;
  };
  let jsxFormatterContext = {};
  jsx.setFormatterContext = function (context) {
    jsxFormatterContext = context;
  };
  jsx.getFormatterContext = function () {
    return jsxFormatterContext;
  };
  jsx.withContext = function (context, functionToExecute) {
    jsxContext = context;
    const callBackReturn = functionToExecute();
    jsxContext = {};
    return callBackReturn;
  };

  /**
   * JSX support for UI5 controls.
   * @returns The control or controls created
   */
  return jsx;
}, false);
//# sourceMappingURL=jsx-dbg.js.map
