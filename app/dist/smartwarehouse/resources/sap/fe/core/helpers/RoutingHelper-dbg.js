/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  const RoutingHelpser = {
    /**
     * Builds the binding path for a navigation target.
     * @param routeArguments The route arguments to be used in the binding path.
     * @param bindingPattern The binding pattern to be used.
     * @param navigationParameters The navigation parameters.
     * @returns The constructed binding path and a flag indicating if it is deferred.
     */
    buildBindingPath(routeArguments, bindingPattern, navigationParameters) {
      let path = bindingPattern.replace(":?query:", "");
      let deferred = false;
      for (const sKey in routeArguments) {
        const sValue = routeArguments[sKey];
        if (typeof sValue !== "string") {
          continue;
        }
        if (sValue === "..." && bindingPattern.includes(`{${sKey}}`)) {
          deferred = true;
          // Sometimes in preferredMode = create, the edit button is shown in background when the
          // action parameter dialog shows up, setting bTargetEditable passes editable as true
          // to onBeforeBinding in _bindTargetPage function
          navigationParameters.bTargetEditable = true;
        }
        path = path.replace(`{${sKey}}`, sValue);
      }
      if (routeArguments["?query"]?.["i-action"]?.includes("create")) {
        navigationParameters.bActionCreate = true;
      }

      // the binding path is always absolute
      if (path && path[0] !== "/") {
        path = `/${path}`;
      }
      return {
        path,
        deferred
      };
    }
  };
  return RoutingHelpser;
}, false);
//# sourceMappingURL=RoutingHelper-dbg.js.map
