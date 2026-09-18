import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class } from "sap/fe/base/ClassSupport";
import type { $ControlSettings } from "sap/ui/core/Control";
import FormAPI from "./form/FormAPI";

/**
 * Building block for creating a Form based on the metadata provided by OData V4.
 * <br>
 * It is designed to work based on a FieldGroup annotation but can also work if you provide a ReferenceFacet or a CollectionFacet
 *
 *
 * Usage example:
 * <pre>
 * &lt;macros:Form id="MyForm" metaPath="@com.sap.vocabularies.UI.v1.FieldGroup#GeneralInformation" /&gt;
 * </pre>
 */

@defineUI5Class("sap.fe.macros.Form", {
	returnTypes: ["sap.fe.macros.form.FormAPI"]
})
class FormBlock extends FormAPI {
	// Re-export constructor signature for proper type inference
	constructor(props?: PropertiesOf<FormAPI>, others?: $ControlSettings) {
		super(props, others);
	}
}

export default FormBlock;
