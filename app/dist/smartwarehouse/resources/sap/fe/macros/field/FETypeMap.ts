import TypeMap from "sap/ui/mdc/odata/v4/TypeMap";

type ExtendedTypeMap = typeof TypeMap & {
	import: (other: typeof TypeMap) => void;
	set: (typeName: string, ...args: unknown[]) => void;
	freeze: () => void;
	getUnitBaseType: unknown;
	getUnitOptions: (
		formatOptions: Record<string, unknown>,
		constraints: Record<string, unknown>,
		context?: unknown
	) => Record<string, unknown>;
};

// This function is only called by MDC TypeMap when creating type instances for edit-mode content.
// Strip decimalPadding so the constructor never sees it alongside showMeasure != false —
// that combination throws in NumberFormat.checkDecimalPadding.
function dynamicCurrencyOptions(
	formatOptions: Record<string, unknown>,
	constraints: Record<string, unknown>,
	context?: unknown
): Record<string, unknown> {
	const { decimalPadding: _dp, ...rest } = formatOptions ?? {};
	return (TypeMap as unknown as ExtendedTypeMap).getUnitOptions(rest, constraints, context);
}

const FETypeMap = Object.assign({}, TypeMap) as ExtendedTypeMap;
FETypeMap.import(TypeMap as unknown as typeof TypeMap);
// Register DynamicCurrency with the same base type logic as sap.ui.model.odata.type.Currency
// so the MDC Field renders it with the correct amount + code layout.
FETypeMap.set("sap.fe.core.type.DynamicCurrency", (TypeMap as unknown as ExtendedTypeMap).getUnitBaseType, dynamicCurrencyOptions);
FETypeMap.freeze();

export default FETypeMap as typeof TypeMap;
