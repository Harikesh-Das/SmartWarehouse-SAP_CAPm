/**
 * Flexibility change handler for the EasyFilterBar building block.
 *
 * Registers the `easyFilterState` change type so the variant management system can persist the easy filter state per variant (written via `ControlPersonalizationWriteAPI`).
 *
 * - `applyChange`: clears existing tokens/conditions, then restores the stored query text.
 * - `revertChange`: clears the query text.
 * - `getCondenserInfo`: uses `lastOneWins` so only the latest query is kept per variant.
 */
import type EasyFilterBar from "sap/fe/macros/ai/EasyFilterBar";

export type EasyFilterStateContent = {
	query: string;
};

type Change = {
	getContent(): EasyFilterStateContent;
	getSelector(): { id: string };
};

const easyFilterStateHandler = {
	applyChange(oChange: Change, oControl: EasyFilterBar): boolean {
		const { query } = oChange.getContent();
		oControl.content?.setQuery(query);
		return true;
	},
	revertChange(_oChange: Change, oControl: EasyFilterBar): void {
		oControl.content?.setQuery("");
	},
	completeChangeContent(): void {},
	getCondenserInfo(oChange: Change): { affectedControl: { id: string }; classification: string; uniqueKey: string } {
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

export default EasyFilterBarFlexibility;
