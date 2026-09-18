/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  /**
   * Flexibility change handler for the EasyFilterBar building block.
   *
   * Registers the `easyFilterState` change type so the variant management system can persist the easy filter state per variant (written via `ControlPersonalizationWriteAPI`).
   *
   * - `applyChange`: clears existing tokens/conditions, then restores the stored query text.
   * - `revertChange`: clears the query text.
   * - `getCondenserInfo`: uses `lastOneWins` so only the latest query is kept per variant.
   */
  const easyFilterStateHandler = {
    applyChange(oChange, oControl) {
      const {
        query
      } = oChange.getContent();
      oControl.content?.setQuery(query);
      return true;
    },
    revertChange(_oChange, oControl) {
      oControl.content?.setQuery("");
    },
    completeChangeContent() {},
    getCondenserInfo(oChange) {
      return {
        affectedControl: oChange.getSelector(),
        classification: "lastOneWins",
        uniqueKey: oChange.getSelector().id + "-easyFilterState"
      };
    }
  };
  const EasyFilterBarFlexibility = {
    easyFilterState: {
      changeHandler: easyFilterStateHandler,
      layers: {
        USER: true
      }
    }
  };
  return EasyFilterBarFlexibility;
}, false);
//# sourceMappingURL=EasyFilterBar.flexibility-dbg.js.map
