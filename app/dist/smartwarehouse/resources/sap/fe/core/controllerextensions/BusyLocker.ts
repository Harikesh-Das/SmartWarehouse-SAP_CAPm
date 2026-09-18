import Log from "sap/base/Log";
import type BaseObject from "sap/ui/base/Object";
import type Control from "sap/ui/core/Control";
import type Model from "sap/ui/model/Model";
import type JSONModel from "sap/ui/model/json/JSONModel";
export type BaseObjectWithId = BaseObject & { getId(): string; setBusy?(busy: boolean): void };
const _iTimeoutInSeconds = 30,
	_mLockCounters: Record<string, LockCountEntry> = {},
	_oReferenceDummy = {
		getId: function (): string {
			return "BusyLocker.ReferenceDummy";
		},
		setBusy: function (bBusy: boolean): void {
			Log.info(`setBusy(${bBusy}) triggered on dummy reference`);
		}
	};
function getLockCountId(oReference: BaseObjectWithId | Model, sPath?: string): string {
	if (!oReference || !oReference.getId) {
		oReference = _oReferenceDummy as unknown as BaseObjectWithId;
	}
	return oReference.getId() + (sPath || "/busy");
}
function isLocked(oReference: BaseObjectWithId | Model, sPath?: string): boolean {
	return getLockCountId(oReference, sPath) in _mLockCounters;
}
function getLockCountEntry(oReference: BaseObjectWithId | Model, sPath?: string): LockCountEntry {
	if (!oReference || !oReference.getId) {
		Log.warning("No reference for BusyLocker, using dummy reference");
		oReference = _oReferenceDummy as unknown as BaseObjectWithId;
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

function storeFocusInfo(lockEntry: LockCountEntry): void {
	try {
		const activeElement = document.activeElement;
		if (activeElement && activeElement !== document.body) {
			lockEntry.previousActiveElement = activeElement;
		}
	} catch (error) {
		Log.warning(`BusyLocker: Failed to store focus info for ${lockEntry.id}`, error as Error);
	}
}

function restoreFocusInfo(lockEntry: LockCountEntry): void {
	const previousElement = lockEntry.previousActiveElement as HTMLElement | undefined;
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

function fallbackFocus(lockEntry: LockCountEntry): void {
	setTimeout(() => {
		const reference = lockEntry.reference;

		if (reference && typeof (reference as Control).focus === "function") {
			try {
				(reference as Control).focus();
				return;
			} catch (error) {
				Log.warning(`BusyLocker: Failed to focus control for ${lockEntry.id}`, error as Error);
			}
		}

		const domRef = (reference as Control)?.getDomRef?.();
		if (domRef instanceof HTMLElement && typeof domRef.focus === "function") {
			try {
				domRef.focus();
			} catch (error) {
				Log.warning(`BusyLocker: Failed to focus DOM reference for ${lockEntry.id}`, error as Error);
			}
		}
	}, 50);
}


function deleteLockCountEntry(mLockCountEntry: LockCountEntry): void {
	if (mLockCountEntry.previousActiveElement) {
		delete mLockCountEntry.previousActiveElement;
	}
	delete _mLockCounters[mLockCountEntry.id];
}

type LockCountEntry = {
	id: string;
	count: number;
	path: string;
	timeout?: number;
	reference: BaseObjectWithId | Model;
	previousActiveElement?: Element;
};
function applyLockState(mLockCountEntry: LockCountEntry): boolean {
	const reference = mLockCountEntry.reference;
	const bBusy = mLockCountEntry.count !== 0;

	if (bBusy && mLockCountEntry.count === 1) {
		// Only store focus when transitioning from not busy to busy
		storeFocusInfo(mLockCountEntry);
	}

	if (reference.isA && reference.isA<JSONModel>("sap.ui.model.Model")) {
		reference.setProperty(mLockCountEntry.path, bBusy, undefined, true);
	} else if ((reference as Control).setBusy) {
		(reference as Control).setBusy(bBusy);
	}

	clearTimeout(mLockCountEntry.timeout);
	if (bBusy) {
		mLockCountEntry.timeout = setTimeout(function () {
			Log.error(
				`busy lock for ${mLockCountEntry.id} with value ${mLockCountEntry.count} timed out after ${_iTimeoutInSeconds} seconds!`
			);
		}, _iTimeoutInSeconds * 1000) as unknown as number;
	} else {
		// Restore focus AFTER BusyIndicator is destroyed
		restoreFocusInfo(mLockCountEntry);
		deleteLockCountEntry(mLockCountEntry);
	}

	return bBusy;
}

function changeLockCount(mLockCountEntry: LockCountEntry, iDelta: number): void {
	if (iDelta === 0) {
		mLockCountEntry.count = 0;
		Log.info(`busy lock count '${mLockCountEntry.id}' was reset to 0`);
	} else {
		mLockCountEntry.count += iDelta;
		Log.info(`busy lock count '${mLockCountEntry.id}' is ${mLockCountEntry.count}`);
	}
}

const BusyLocker = {
	lock: function (oModelOrControl: BaseObjectWithId | Model, sPath?: string): boolean {
		return this._updateLock(oModelOrControl, sPath, 1);
	},

	unlock: function (oModelOrControl: BaseObjectWithId | Model, sPath?: string): boolean {
		// Early return if not locked - prevents negative counter
		if (!this.isLocked(oModelOrControl, sPath)) {
			const lockId = getLockCountId(oModelOrControl, sPath);
			Log.warning(
				`BusyLocker.unlock: Lock ID '${lockId}' is not locked. ` + `This indicates unbalanced lock/unlock calls. Ignoring unlock.`
			);
			return false; // Object is not busy
		}
		return this._updateLock(oModelOrControl, sPath, -1);
	},

	isLocked: function (oModelOrControl: BaseObjectWithId | Model, sPath?: string): boolean {
		return isLocked(oModelOrControl, sPath);
	},

	restoreFocus(oModelOrControl: BaseObjectWithId | Model, sPath?: string): void {
		const lockId = getLockCountId(oModelOrControl, sPath);
		const entry = _mLockCounters[lockId];
		if (entry) {
			restoreFocusInfo(entry);
		}
	},

	_updateLock: function (oReference: BaseObjectWithId | Model, sPath: string | undefined, iDelta: number): boolean {
		const mLockCountEntry = getLockCountEntry(oReference, sPath);
		changeLockCount(mLockCountEntry, iDelta);
		return applyLockState(mLockCountEntry);
	}
};

export default BusyLocker;
