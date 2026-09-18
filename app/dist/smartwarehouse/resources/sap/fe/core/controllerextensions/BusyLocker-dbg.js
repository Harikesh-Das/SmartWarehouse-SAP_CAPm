/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log"], function (Log) {
  "use strict";

  const _iTimeoutInSeconds = 30,
    _mLockCounters = {},
    _oReferenceDummy = {
      getId: function () {
        return "BusyLocker.ReferenceDummy";
      },
      setBusy: function (bBusy) {
        Log.info(`setBusy(${bBusy}) triggered on dummy reference`);
      }
    };
  function getLockCountId(oReference, sPath) {
    if (!oReference || !oReference.getId) {
      oReference = _oReferenceDummy;
    }
    return oReference.getId() + (sPath || "/busy");
  }
  function isLocked(oReference, sPath) {
    return getLockCountId(oReference, sPath) in _mLockCounters;
  }
  function getLockCountEntry(oReference, sPath) {
    if (!oReference || !oReference.getId) {
      Log.warning("No reference for BusyLocker, using dummy reference");
      oReference = _oReferenceDummy;
    }
    sPath = sPath || "/busy";
    const sId = getLockCountId(oReference, sPath);
    if (!(sId in _mLockCounters)) {
      _mLockCounters[sId] = {
        id: sId,
        path: sPath,
        reference: oReference,
        count: 0
      };
    }
    return _mLockCounters[sId];
  }
  function storeFocusInfo(lockEntry) {
    try {
      const activeElement = document.activeElement;
      if (activeElement && activeElement !== document.body) {
        lockEntry.previousActiveElement = activeElement;
      }
    } catch (error) {
      Log.warning(`BusyLocker: Failed to store focus info for ${lockEntry.id}`, error);
    }
  }
  function restoreFocusInfo(lockEntry) {
    const previousElement = lockEntry.previousActiveElement;
    if (!previousElement) {
      return;
    }
    let currentActive = document.activeElement;
    if (currentActive && currentActive !== document.body && currentActive !== previousElement) {
      return;
    }
    if (document.contains(previousElement) && typeof previousElement.focus === "function") {
      setTimeout(() => {
        // Check active element inside setTimeout to respect any focus changes that happened after unlock but before the timeout fires
        currentActive = document.activeElement;
        // If focus was explicitly changed to a different element after unlock (and not to body), respect that change
        if (currentActive && currentActive !== document.body && currentActive !== previousElement) {
          return;
        }
        try {
          previousElement.focus();
        } catch {
          fallbackFocus(lockEntry);
        }
      }, 50);
    } else {
      fallbackFocus(lockEntry);
    }
  }
  function fallbackFocus(lockEntry) {
    setTimeout(() => {
      const reference = lockEntry.reference;
      if (reference && typeof reference.focus === "function") {
        try {
          reference.focus();
          return;
        } catch (error) {
          Log.warning(`BusyLocker: Failed to focus control for ${lockEntry.id}`, error);
        }
      }
      const domRef = reference?.getDomRef?.();
      if (domRef instanceof HTMLElement && typeof domRef.focus === "function") {
        try {
          domRef.focus();
        } catch (error) {
          Log.warning(`BusyLocker: Failed to focus DOM reference for ${lockEntry.id}`, error);
        }
      }
    }, 50);
  }
  function deleteLockCountEntry(mLockCountEntry) {
    if (mLockCountEntry.previousActiveElement) {
      delete mLockCountEntry.previousActiveElement;
    }
    delete _mLockCounters[mLockCountEntry.id];
  }
  function applyLockState(mLockCountEntry) {
    const reference = mLockCountEntry.reference;
    const bBusy = mLockCountEntry.count !== 0;
    if (bBusy && mLockCountEntry.count === 1) {
      // Only store focus when transitioning from not busy to busy
      storeFocusInfo(mLockCountEntry);
    }
    if (reference.isA && reference.isA("sap.ui.model.Model")) {
      reference.setProperty(mLockCountEntry.path, bBusy, undefined, true);
    } else if (reference.setBusy) {
      reference.setBusy(bBusy);
    }
    clearTimeout(mLockCountEntry.timeout);
    if (bBusy) {
      mLockCountEntry.timeout = setTimeout(function () {
        Log.error(`busy lock for ${mLockCountEntry.id} with value ${mLockCountEntry.count} timed out after ${_iTimeoutInSeconds} seconds!`);
      }, _iTimeoutInSeconds * 1000);
    } else {
      // Restore focus AFTER BusyIndicator is destroyed
      restoreFocusInfo(mLockCountEntry);
      deleteLockCountEntry(mLockCountEntry);
    }
    return bBusy;
  }
  function changeLockCount(mLockCountEntry, iDelta) {
    if (iDelta === 0) {
      mLockCountEntry.count = 0;
      Log.info(`busy lock count '${mLockCountEntry.id}' was reset to 0`);
    } else {
      mLockCountEntry.count += iDelta;
      Log.info(`busy lock count '${mLockCountEntry.id}' is ${mLockCountEntry.count}`);
    }
  }
  const BusyLocker = {
    lock: function (oModelOrControl, sPath) {
      return this._updateLock(oModelOrControl, sPath, 1);
    },
    unlock: function (oModelOrControl, sPath) {
      // Early return if not locked - prevents negative counter
      if (!this.isLocked(oModelOrControl, sPath)) {
        const lockId = getLockCountId(oModelOrControl, sPath);
        Log.warning(`BusyLocker.unlock: Lock ID '${lockId}' is not locked. ` + `This indicates unbalanced lock/unlock calls. Ignoring unlock.`);
        return false; // Object is not busy
      }
      return this._updateLock(oModelOrControl, sPath, -1);
    },
    isLocked: function (oModelOrControl, sPath) {
      return isLocked(oModelOrControl, sPath);
    },
    restoreFocus(oModelOrControl, sPath) {
      const lockId = getLockCountId(oModelOrControl, sPath);
      const entry = _mLockCounters[lockId];
      if (entry) {
        restoreFocusInfo(entry);
      }
    },
    _updateLock: function (oReference, sPath, iDelta) {
      const mLockCountEntry = getLockCountEntry(oReference, sPath);
      changeLockCount(mLockCountEntry, iDelta);
      return applyLockState(mLockCountEntry);
    }
  };
  return BusyLocker;
}, false);
//# sourceMappingURL=BusyLocker-dbg.js.map
