import jsx from "sap/fe/base/jsx-runtime/jsx";
import CollaborationFormatter from "sap/fe/core/formatters/CollaborationFormatter";
import CriticalityFormatter from "sap/fe/core/formatters/CriticalityFormatter";
import FPMFormatter from "sap/fe/core/formatters/FPMFormatter";
import KPIFormatter from "sap/fe/core/formatters/KPIFormatter";
import standardFormatter from "sap/fe/core/formatters/StandardFormatter";
import ValueFormatter from "sap/fe/core/formatters/ValueFormatter";

const globalScope = {
	_formatters: {
		ValueFormatter: ValueFormatter,
		StandardFormatter: standardFormatter,
		CriticalityFormatter: CriticalityFormatter,
		FPMFormatter: FPMFormatter,
		KPIFormatter: KPIFormatter,
		CollaborationFormatter: CollaborationFormatter
	}
};

jsx.setFormatterContext(globalScope);
export default globalScope;
