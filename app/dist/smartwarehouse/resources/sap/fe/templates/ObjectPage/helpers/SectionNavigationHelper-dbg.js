/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  /**
   * Configuration for polling section stability.
   */
  /** Default polling interval in milliseconds.  */
  const POLL_INTERVAL = 50;
  /** Default maximum number of polling attempts. */
  const MAX_ATTEMPTS = 10;
  /** Number of consecutive stable checks required before considering navigation complete. */
  const REQUIRED_STABLE_CHECKS = 3;

  /**
   * Polls for section selection stability to detect and recover from ObjectPageLayout UX rules resets.
   * During initial ObjectPage load, the ObjectPageLayout's _adjustSelectedSectionByUXRules method may reset
   * the selected section to the first visible section. This utility polls to detect such resets and
   * re-triggers navigation when detected.
   * The polling stops when either:
   * - The target section has been stable for 3 consecutive checks (~150ms).
   * - Maximum attempts (10) reached (~500ms total).
   * - Guard check returns false (e.g., control destroyed).
   * @param config Polling configuration.
   * @returns Promise that resolves when polling completes (either stable or timeout).
   */
  // eslint-disable-next-line @typescript-eslint/promise-function-async -- Cannot use async here as return await is not allowed
  function pollForSectionStability(config) {
    return new Promise(resolve => {
      let attempts = 0;
      let stableCount = 0;
      const checkSection = () => {
        attempts++;

        // Guard check (e.g., control destroyed during navigation)
        if (config.guardCheck && !config.guardCheck()) {
          resolve();
          return;
        }
        const currentSection = config.getSelectedSection();
        if (currentSection !== config.targetSectionId) {
          // UX rules reset detected - re-navigate
          stableCount = 0;
          config.onResetDetected();
        } else {
          stableCount++;
          if (stableCount >= REQUIRED_STABLE_CHECKS) {
            // Section stable - stop polling
            resolve();
            return;
          }
        }
        if (attempts < MAX_ATTEMPTS) {
          setTimeout(checkSection, POLL_INTERVAL);
        } else {
          // Max attempts reached - stop polling
          resolve();
        }
      };

      // Start polling after first interval
      setTimeout(checkSection, POLL_INTERVAL);
    });
  }
  _exports.pollForSectionStability = pollForSectionStability;
  return _exports;
}, false);
//# sourceMappingURL=SectionNavigationHelper-dbg.js.map
