import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import UI5Element from "sap/ui/core/Element";

/**
 * Represents a group configuration for address fields in the Object Page Layout.
 * Used to organize address fields into sections with titles.
 */
@defineUI5Class("sap.fe.macros.address.AddressGroup")
export default class AddressGroup extends UI5Element {
	@property({ type: "string", required: true })
	key!: string;

	@property({ type: "string", required: true })
	title!: string;
}
