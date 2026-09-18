/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit"], function (Log, BindingToolkit) {
  "use strict";

  var _exports = {};
  var pathInModel = BindingToolkit.pathInModel;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var concatWithSeparator = BindingToolkit.concatWithSeparator;
  // Collection of helper functions to retrieve information from an EntityType.

  // This is still a work in progress

  /**
   * Retrieve the binding expression required to display the title of an entity.
   *
   * This is usually defined as:
   * - the HeaderInfo.Title value
   * - the SemanticKeys properties
   * - the typename as a fallback
   * @param entityType The target entityType
   * @param visiblePropertyPaths List of property paths currently visible in the table
   * @returns The title binding expression
   */
  const getTitleExpression = (entityType, visiblePropertyPaths) => {
    // HeaderInfo can be a [DataField] and any of its children, or a [DataFieldForAnnotation] targeting [ConnectedFields](#ConnectedFields).
    const headerInfoTitle = entityType.annotations?.UI?.HeaderInfo?.Title;

    //Use HeaderInfo.Title if available and visible, otherwise fallback to TypeName or SemanticKeys
    if (headerInfoTitle) {
      switch (headerInfoTitle.$Type) {
        case "com.sap.vocabularies.UI.v1.DataField":
          if (visiblePropertyPaths?.includes(headerInfoTitle.Value.path)) {
            return getExpressionFromAnnotation(headerInfoTitle.Value);
          }
          break;
        case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
          Log.error("DataFieldForAnnotation with connected fields not supported for HeaderInfo.Title");
          return getExpressionFromAnnotation(entityType.annotations?.UI?.HeaderInfo?.TypeName);
      }
    }
    const semanticKeys = entityType.annotations?.Common?.SemanticKey;
    if (semanticKeys) {
      // Filter semantic keys to only include visible ones if visiblePropertyPaths is provided
      const visibleSemanticKeys = visiblePropertyPaths?.length ? semanticKeys.filter(key => visiblePropertyPaths.includes(key.value)) : semanticKeys;
      if (visibleSemanticKeys.length > 0) {
        return concatWithSeparator(" - ", ...visibleSemanticKeys.map(key => pathInModel(key.value)));
      }
    }
    Log.warning(`No HeaderInfo.Title or Semantic keys defined or visible for entity ${entityType.name}`);
    return getExpressionFromAnnotation(entityType.annotations?.UI?.HeaderInfo?.TypeName);
  };
  _exports.getTitleExpression = getTitleExpression;
  return _exports;
}, false);
//# sourceMappingURL=EntityTypeHelper-dbg.js.map
