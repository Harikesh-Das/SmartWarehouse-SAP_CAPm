// This list needs to come from AVT
import type { ConvertedMetadata } from "@sap-ux/vocabularies-types";

const ENUM_VALUES: Record<string, Record<string, unknown>> = {
	"com.sap.vocabularies.Common.v1.FieldControlType": {
		Mandatory: 7,
		Optional: 3,
		ReadOnly: 0,
		Inapplicable: 0,
		Disabled: 1
	}
};
export const resolveEnumValue = function (enumName: string | undefined, converterRoot?: ConvertedMetadata): unknown {
	if (!enumName) {
		return false;
	}
	const [termName, value] = enumName.split("/");
	if (ENUM_VALUES.hasOwnProperty(termName)) {
		return ENUM_VALUES[termName][value];
	} else {
		const enumType = converterRoot?.enumTypes.by_fullyQualifiedName(termName);
		return enumType ? enumType.members.by_name(value)?.value : false;
	}
};
