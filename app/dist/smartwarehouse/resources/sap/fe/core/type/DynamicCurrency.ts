import { defineUI5Class } from "sap/fe/base/ClassSupport";
import CurrencyType from "sap/ui/model/odata/type/Currency";

type CurrencyCodeEntry = { UnitSpecificScale?: number };
type InternalFormatOptions = Record<string, unknown>;

const MINIMUM_CURRENCY_DECIMALS = 2;
const MAXIMUM_CURRENCY_DECIMALS = 5;

/**
 * Extension of the OData Currency type that computes decimalPadding dynamically from the currency
 * codelist (aValues[2]) the first time formatValue is called with the codelist available.
 * This ensures the padding is always the maximum UnitSpecificScale across all currencies
 * without requiring an upfront async codelist fetch.
 *
 * This type is only used for display bindings where decimal alignment is required.
 * Edit-mode type instances created by MDC use the base Currency type via FETypeMap.
 *
 * When a static decimalPadding is passed in the constructor (via a manifest override), that value
 * is respected and no dynamic computation takes place.
 *
 * Fallback behaviour when the codelist is unavailable (null, empty object) or contains currencies
 * whose scale exceeds the maximum: decimalPadding is capped at MAXIMUM_CURRENCY_DECIMALS (5).
 * While aValues[2] is still undefined (binding not yet resolved), the computation is deferred to
 * the next formatValue call.
 */
@defineUI5Class("sap.fe.core.type.DynamicCurrency")
class DynamicCurrency extends CurrencyType {
	override formatValue(aValues: unknown[], sTargetType: string): string {
		const self = this as typeof this & { oFormatOptions: InternalFormatOptions };
		if (!("decimalPadding" in self.oFormatOptions)) {
			const currencyList = aValues[2] as Record<string, CurrencyCodeEntry> | null | undefined;
			if (currencyList !== undefined) {
				const entries = currencyList ? Object.values(currencyList) : [];
				const decimalPadding =
					entries.length === 0
						? MAXIMUM_CURRENCY_DECIMALS
						: Math.min(
								entries.reduce(
									(max: number, entry: CurrencyCodeEntry) => Math.max(max, entry.UnitSpecificScale ?? 0),
									MINIMUM_CURRENCY_DECIMALS
								),
								MAXIMUM_CURRENCY_DECIMALS
						  );
				// Assign before super so that UnitMixin's first-time _createFormats() call picks up the correct value.
				self.oFormatOptions = { ...self.oFormatOptions, decimalPadding };
			}
		}
		return super.formatValue(aValues, sTargetType);
	}
}

export default DynamicCurrency;
