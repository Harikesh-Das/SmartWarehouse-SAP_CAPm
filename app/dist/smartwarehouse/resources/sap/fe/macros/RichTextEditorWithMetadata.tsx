import type { Property } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import { type DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import RichTextEditorBlock from "sap/fe/macros/RichTextEditor";
import { getValueBinding } from "sap/fe/macros/field/FieldTemplating";
import type { $ControlSettings, Control$ValidateFieldGroupEvent } from "sap/ui/core/Control";
import { type RichTextEditor$ChangeEvent } from "sap/ui/richtexteditor/RichTextEditor";
import FieldRuntimeHelper from "./field/FieldRuntimeHelper";
/**
 * Metadata-driven building block that exposes the RichTextEditor UI5 control.
 *
 * It's used to enter formatted text and uses the third-party component called TinyMCE.
 * @public
 * @since 1.117.0
 */
@defineUI5Class("sap.fe.macros.RichTextEditorWithMetadata")
export default class RichTextEditorWithMetadata extends RichTextEditorBlock {
	/**
	 * The metaPath of the displayed property
	 * @public
	 */
	@property({
		type: "string",
		required: true
	})
	metaPath!: string;

	/**
	 * The context path of the property displayed
	 * @public
	 */
	@property({
		type: "string",
		required: true
	})
	contextPath!: string;

	dataModelObjectPath?: DataModelObjectPath<Property>;

	constructor(properties: $ControlSettings & PropertiesOf<RichTextEditorWithMetadata>, others?: $ControlSettings) {
		super(properties, others);
	}

	onMetadataAvailable(_ownerComponent: TemplateComponent): void {
		this.dataModelObjectPath = this.getDataModelObjectForMetaPath<Property>(this.metaPath, this.contextPath);
		if (this.dataModelObjectPath) {
			this.value = getValueBinding(this.dataModelObjectPath, {});
		}
		super.onMetadataAvailable(_ownerComponent);
	}

	/**
	 * Change handler when the content of the Rich Text Editor changes.
	 * @param event
	 */
	handleChange(event: RichTextEditor$ChangeEvent): void {
		const pageController = this.getPageController();
		const feController = pageController ? FieldRuntimeHelper.getExtensionController(pageController) : undefined;
		feController?.sideEffects.handleFieldChange(event, true).catch((error) => {
			Log.error("Failed to handle side effects on RichTextEditor", error);
		});
	}

	/**
	 * Change handler for the validateFieldGroup event.
	 * @param event
	 */
	handleValidateFieldGroup(event: Control$ValidateFieldGroupEvent): void {
		const pageController = this.getPageController();
		const feController = pageController ? FieldRuntimeHelper.getExtensionController(pageController) : undefined;
		feController?.sideEffects.handleFieldGroupChange(event).catch((error) => {
			Log.error("Failed to handle side effects on RichTextEditor", error);
		});
	}

	// //////////////////////////////////////////////////
	// Overriden methods used by the RichTextEditorBlock

	retrieveFieldGroupIDs(): string[] | undefined {
		let fieldGroupIds: string[] | undefined;
		if (this.dataModelObjectPath) {
			const sourceEntityType = this.dataModelObjectPath.targetEntityType?.fullyQualifiedName ?? "";
			const sourceProperty = this.dataModelObjectPath.targetObject?.fullyQualifiedName ?? "";
			fieldGroupIds = this.getAppComponent()?.getSideEffectsService().computeFieldGroupIds(sourceEntityType, sourceProperty);
			if (fieldGroupIds?.length === 0) {
				fieldGroupIds = undefined;
			}
		}

		return fieldGroupIds;
	}

	getValueChangeHandler(): ((e: RichTextEditor$ChangeEvent) => void) | undefined {
		return this.handleChange.bind(this);
	}

	getValidateFieldGroupHandler(): ((e: Control$ValidateFieldGroupEvent) => void) | undefined {
		return this.handleValidateFieldGroup.bind(this);
	}
}
