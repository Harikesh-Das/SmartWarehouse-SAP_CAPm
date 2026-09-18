/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/ManifestSettings"], function (ManifestSettings) {
  "use strict";

  var _exports = {};
  var TemplateType = ManifestSettings.TemplateType;
  /**
   * Constructs the property path for action parameters based on whether the action is bound or unbound.
   * @param oParameters The action parameter details
   * @param oParameters.UnboundAction Whether the action is unbound
   * @param oParameters.Property The property name
   * @param oParameters.EntityTypePath The entity type path
   * @param oParameters.Action The action name
   * @returns The constructed property path
   */
  function getPropertyPath(oParameters) {
    return !oParameters.UnboundAction ? `${oParameters.EntityTypePath}/${oParameters.Action}/${oParameters.Property}` : `/${oParameters.Action.substring(oParameters.Action.lastIndexOf(".") + 1)}/${oParameters.Property}`;
  }

  /**
   * Reorders value list qualifiers so the default qualifier (empty string) comes first.
   * @param qualifiers Array of value list qualifiers
   * @returns The reordered array with the default qualifier first
   */
  _exports.getPropertyPath = getPropertyPath;
  function putDefaultQualifierFirst(qualifiers) {
    const indexDefaultVH = qualifiers.indexOf("");

    // default ValueHelp without qualifier should be the first
    if (indexDefaultVH > 0) {
      qualifiers.unshift(qualifiers[indexDefaultVH]);
      qualifiers.splice(indexDefaultVH + 1, 1);
    }
    return qualifiers;
  }
  _exports.putDefaultQualifierFirst = putDefaultQualifierFirst;
  function getViewDataForTemplate() {
    let columnDefs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    let enableLinksInDialogTable = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    return {
      converterType: TemplateType.ListReport,
      columns: columnDefs,
      enableLinksInDialogTable: enableLinksInDialogTable
    };
  }
  _exports.getViewDataForTemplate = getViewDataForTemplate;
  return _exports;
}, false);
//# sourceMappingURL=ValueHelpUtils-dbg.js.map
