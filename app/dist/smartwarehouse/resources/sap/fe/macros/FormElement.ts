import type { ServiceObject } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import type { EnhanceWithUI5, PropertiesOf } from "sap/fe/base/ClassSupport";
import { aggregation, defineUI5Class, property } from "sap/fe/base/ClassSupport";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import Field from "sap/fe/macros/Field";
import type UI5Event from "sap/ui/base/Event";
import Component from "sap/ui/core/Component";
import type Control from "sap/ui/core/Control";
import type { $ControlSettings } from "sap/ui/core/Control";
import FormElement from "sap/ui/layout/form/FormElement";
import type Context from "sap/ui/model/odata/v4/Context";

/**
 * Building block used to create a form element based on the metadata provided by OData V4.
 * @public
 * @since 1.90.0
 */
@defineUI5Class("sap.fe.macros.FormElement")
export default class FormElementControl extends FormElement {
	/**
	 * Defines the path of the context used in the current page or block.
	 * This setting is defined by the framework.
	 * @public
	 */
	@property({ type: "string" })
	public contextPath!: string;

	/**
	 * Defines the relative path of the property in the metamodel, based on the current contextPath.
	 * @public
	 */
	@property({ type: "string" })
	public metaPath!: string;

	/**
	 * Label shown for the field. If not set, the label from the annotations will be shown.
	 * @public
	 */
	@property({ type: "string" })
	label?: string;

	/**
	 * If set to false, the FormElement is not rendered.
	 * @public
	 */
	@property({ type: "boolean", defaultValue: true })
	visible!: boolean;

	/**
	 * Optional aggregation of controls that should be displayed inside the FormElement.
	 * If not set, a default Field building block will be rendered
	 * @public
	 */
	@aggregation({ type: "sap.ui.core.Control", multiple: true, singularName: "field" })
	fields?: Control[];

	/**
	 * Reference to the key of another column already displayed in the table to properly place this one
	 * @public
	 */
	@property({ type: "string" })
	anchor?: string;

	/**
	 * Determines where this column should be placed relative to the defined anchor
	 *
	 * Allowed values are `Before` and `After`
	 * @public
	 */
	@property({ type: "string" })
	placement?: "Before" | "After";

	/**
	 * Constructor for the FormElementControl.
	 * Adds a default Field if no fields are provided and attaches a handler for model context changes.
	 * @param properties Initial settings for the new control
	 * @param others Additional settings
	 */
	constructor(properties: string | ($ControlSettings & PropertiesOf<FormElementControl>), others?: $ControlSettings) {
		super(properties as string, others);
		this.ensureDefaultField();
		this.attachModelContextChange(this.onModelContextChange.bind(this));
	}

	/**
	 * Ensures that a default Field is created and added to the aggregation if no fields are provided.
	 * @private
	 */
	ensureDefaultField(): void {
		if (!this.fields || this.fields.length === 0) {
			const field = new Field({
				metaPath: this.metaPath,
				contextPath: this.contextPath,
				id: this.getId() + "--FormElementField"
			});
			this.addField(field);
		}
	}

	/**
	 * Handles model context changes to update the label from OData annotations if not set explicitly.
	 * @param evt The model context change event
	 * @private
	 */
	onModelContextChange(evt: UI5Event): void {
		const source = evt.getSource() as unknown as FormElementControl;
		const owner = Component.getOwnerComponentFor(source) as EnhanceWithUI5<TemplateComponent>;
		const metaModel = owner?.getMetaModel();
		const contextPath = source.contextPath ? source.contextPath + "/" : owner?.getFullContextPath();
		const metaPathContext = metaModel?.createBindingContext(contextPath + source.metaPath) as Context;
		let oContextObjectPath: DataModelObjectPath<ServiceObject> | undefined;
		try {
			oContextObjectPath = MetaModelConverter.getInvolvedDataModelObjects(metaPathContext);
		} catch (error) {
			Log.error(`Error while getting the involved data model objects: ${error}`);
		}
		if (oContextObjectPath && !oContextObjectPath.targetObject) {
			Log.error(`No target object found for the given path ${source.metaPath} on the FormElement`);
		} else {
			// Only set label from metadata annotations if no label is currently set.
			// This prevents overwriting i18n-resolved labels with unresolved keys.
			const annotationLabel = oContextObjectPath?.targetObject?.annotations.Common?.Label?.toString(),
				currentLabel = source.getLabel();
			if ((currentLabel === null || currentLabel === undefined) && annotationLabel) {
				source.setLabel(annotationLabel);
			}
		}
	}
}
