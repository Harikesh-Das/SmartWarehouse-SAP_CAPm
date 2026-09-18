/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/macros/filterBar/SemanticDateOperators", "sap/fe/macros/notes/Notes.block", "./fcl/FlexibleColumnLayoutActions.block", "./form/Form.block", "./form/FormContainer.block", "./fpm/CustomFragment.block", "./internal/ActionCommand.block", "./internal/HeaderDataPoint.block"], function (SemanticDateOperators, NotesBuildingBlock, FlexibleColumnLayoutActionsBlock, FormBlock, FormContainerBlock, CustomFragmentBlock, ActionCommandBlock, HeaderDataPointBlock) {
  "use strict";

  const buildingBlocks = [ActionCommandBlock, CustomFragmentBlock, HeaderDataPointBlock, FlexibleColumnLayoutActionsBlock, FormBlock, FormContainerBlock, NotesBuildingBlock];
  function registerAll() {
    for (const buildingBlock of buildingBlocks) {
      buildingBlock.register();
    }
  }

  //This is needed in for templating test utils
  function unregisterAll() {
    for (const buildingBlock of buildingBlocks) {
      buildingBlock.unregister();
    }
  }

  // Adding Semantic Date Operators
  SemanticDateOperators.addSemanticDateOperators();

  //Always register when loaded for compatibility
  registerAll();
  return {
    register: registerAll,
    unregister: unregisterAll
  };
}, false);
//# sourceMappingURL=macroLibrary-dbg.js.map
