import type { ContactType } from "@sap-ux/vocabularies-types/vocabularies/Communication";
import type { BindingToolkitExpression, PrimitiveType } from "sap/fe/base/BindingToolkit";
import { compileExpression, getExpressionFromAnnotation } from "sap/fe/base/BindingToolkit";
import { association, defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { isPathAnnotationExpression } from "sap/fe/core/helpers/TypeGuards";
import { getRelativePaths } from "sap/fe/core/templating/DataModelPathHelper";
import { getMsTeamsMail } from "sap/fe/macros/contact/ContactHelper";
import { addTextArrangementToBindingExpression } from "sap/fe/macros/field/FieldTemplating";
import type Control from "sap/ui/core/Control";
import type { $ControlSettings } from "sap/ui/core/Control";
import MdcField from "sap/ui/mdc/Field";
import MdcLink from "sap/ui/mdc/Link";

@defineUI5Class("sap.fe.macros.contact.Contact")
export default class Contact extends BuildingBlock<Control> {
	/**
	 * Prefix added to the generated ID of the field
	 */
	@association({
		type: "string"
	})
	public idPrefix?: string;

	/**
	 * Metadata path to the dataPoint.
	 */
	@property({
		type: "string",
		required: true
	})
	public metaPath!: string;

	@property({
		type: "string"
	})
	public contextPath?: string;

	@property({
		type: "boolean"
	})
	public showEmptyIndicator?: boolean;

	@association({
		type: "string"
	})
	public _flexId?: string;

	constructor(properties: $ControlSettings & PropertiesOf<Contact>, others?: $ControlSettings) {
		super(properties, others);
	}

	/**
	 * Handler for the onMetadataAvailable event.
	 */
	onMetadataAvailable(): void {
		if (!this.content) {
			const content = this.createContent();
			if (content) {
				this.content = content;
			}
		}
	}

	/**
	 * Gets the current enablement state of the contact.
	 * @returns Boolean value with the enablement state
	 */
	getEnabled(): boolean {
		return true;
	}

	createContent(): MdcField | null {
		let id;
		if (this._flexId) {
			//in case a flex id is given, take this one
			id = this._flexId;
		} else {
			//alternatively check for idPrefix and generate an appropriate id
			id = this.idPrefix ? generate([this.idPrefix, "Field-content"]) : undefined;
		}
		const contactDataModelObjectPath = this.getDataModelObjectForMetaPath<ContactType>(this.metaPath, this.contextPath);
		if (!contactDataModelObjectPath) {
			return null;
		}

		// Default to true if IsNaturalPerson annotation is not present
		const isNaturalPersonAnnotation = contactDataModelObjectPath.targetEntityType?.annotations?.Common?.IsNaturalPerson;
		let isNaturalPerson = true;
		if (isNaturalPersonAnnotation !== undefined) {
			const annotationValue = isNaturalPersonAnnotation.valueOf();
			isNaturalPerson = typeof annotationValue === "boolean" ? annotationValue : true;
		}

		// Get the fn property value
		let value: BindingToolkitExpression<PrimitiveType> = getExpressionFromAnnotation(
			contactDataModelObjectPath.targetObject?.fn,
			getRelativePaths(contactDataModelObjectPath)
		);

		// Apply text arrangement if the fn property has @Common.Text annotation
		const fnValue = contactDataModelObjectPath.targetObject?.fn;
		if (isPathAnnotationExpression(fnValue)) {
			const fnTarget = fnValue.$target;
			if (fnTarget?.annotations?.Common?.Text) {
				// Use the contact's context path for text arrangement resolution
				// The contactDataModelObjectPath contains the entity context needed for text arrangement
				value = addTextArrangementToBindingExpression(
					value,
					contactDataModelObjectPath
				);
			}
		}

		const delegateConfiguration = {
			name: "sap/fe/macros/contact/ContactDelegate",
			payload: {
				contact: this.metaPath,
				mail: getMsTeamsMail(contactDataModelObjectPath),
				isNaturalPerson: isNaturalPerson
			}
		};

		return (
			<MdcField
				delegate={{ name: "sap/fe/macros/field/FieldBaseDelegate" }}
				id={id}
				editMode="Display"
				width="100%"
				showEmptyIndicator={this.showEmptyIndicator}
				value={compileExpression(value)}
				multipleLines={true}
			>
				{{
					fieldInfo: <MdcLink enablePersonalization="false" delegate={delegateConfiguration} />
				}}
			</MdcField>
		);
	}

	/**
	 * Retrieves the current value of the datapoint.
	 * @returns The current value of the datapoint
	 */
	getValue(): boolean | string | undefined {
		return (this.content as MdcField | undefined)?.getValue();
	}
}
