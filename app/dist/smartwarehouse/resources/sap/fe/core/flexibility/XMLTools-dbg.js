/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  /**
   * Traverses a DOM element and adds generated ID properties to nodes representing controls that are missing IDs.
   * Controls are identified by local names starting with an uppercase letter.
   * @param element The root DOM element to traverse
   * @param prefix Optional prefix for generated IDs
   * @returns The number of IDs that were generated and added
   */
  function addGeneratedIdsToControls(element) {
    let prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "generatedId";
    let idCounter = 0;
    const generatedIds = new Set();

    /**
     * Recursively traverses the DOM tree and processes each element.
     * @param node The current element being processed
     */
    function traverse(node) {
      // Check if this is a control (local name starts with uppercase) and missing an ID
      if (isControl(node) && !node.hasAttribute("id")) {
        const generatedId = generateUniqueId(prefix, generatedIds);
        node.setAttribute("id", generatedId);
        generatedIds.add(generatedId);
        idCounter++;
      }

      // Recursively process all child elements
      for (let i = 0; i < node.children.length; i++) {
        traverse(node.children[i]);
      }
    }

    /**
     * Determines if an element represents a UI5 control based on its local name.
     * @param controlElement The element to check
     * @returns True if the element represents a control
     */
    function isControl(controlElement) {
      const localName = controlElement.localName ?? controlElement.tagName.toLowerCase();
      return localName.length > 0 && localName.charAt(0) === localName.charAt(0).toUpperCase();
    }

    /**
     * Generates a unique ID that doesn't conflict with existing IDs.
     * @param basePrefix The base prefix for the ID
     * @param existingIds Set of already generated IDs
     * @returns A unique ID string
     */
    function generateUniqueId(basePrefix, existingIds) {
      let counter = 1;
      let candidateId = `${basePrefix}_${counter}`;
      while (existingIds.has(candidateId) || document.getElementById(candidateId)) {
        counter++;
        candidateId = `${basePrefix}_${counter}`;
      }
      return candidateId;
    }
    traverse(element);
    return idCounter;
  }
  _exports.addGeneratedIdsToControls = addGeneratedIdsToControls;
  return _exports;
}, false);
//# sourceMappingURL=XMLTools-dbg.js.map
