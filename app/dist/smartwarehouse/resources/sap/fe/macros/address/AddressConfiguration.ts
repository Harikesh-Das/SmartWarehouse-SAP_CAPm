import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import UI5Element from "sap/ui/core/Element";

@defineUI5Class("sap.fe.macros.address.AddressConfiguration")
export default class AddressConfiguration extends UI5Element {
	@property({ type: "string" })
	name!: string;

	@property({ type: "string" })
	property?: string;

	@property({ type: "string" })
	connection?: string;

	@property({ type: "boolean" })
	required?: boolean;

	@property({ type: "string" })
	group?: string;

	@property({ type: "string" })
	priority?: string;
}
