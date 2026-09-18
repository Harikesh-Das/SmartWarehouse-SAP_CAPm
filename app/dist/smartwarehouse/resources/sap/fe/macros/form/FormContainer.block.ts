import type { AnnotationPath, AnnotationTerm, EntitySet, Property } from "@sap-ux/vocabularies-types";
import type {
	ConnectedFieldsType,
	ConnectedFieldsTypeTypes,
	DataField,
	DataFieldAbstractTypes,
	DataFieldForAnnotation,
	DataPointType,
	FieldGroup,
	ReferenceFacet
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { type PropertiesOf } from "sap/fe/base/ClassSupport";
import {
	blockAggregation,
	blockAttribute,
	blockEvent,
	defineBuildingBlock
} from "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport";
import { xml, type TemplateProcessorSettings } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import BuildingBlockTemplatingBase from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import type { BaseAction } from "sap/fe/core/converters/controls/Common/Action";
import type { AnnotationFormElement, CustomFormElement, FormElement } from "sap/fe/core/converters/controls/Common/Form";
import { createFormDefinition } from "sap/fe/core/converters/controls/Common/Form";
import type { ConfigurableObject } from "sap/fe/core/converters/helpers/ConfigurableObject";
import * as StableIDHelper from "sap/fe/core/helpers/StableIdHelper";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { enhanceDataModelPath, getContextRelativeTargetObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { getRequiredExpressionForConnectedDataField, isMultiValueField } from "sap/fe/core/templating/UIFormatters";
import type Context from "sap/ui/model/odata/v4/Context";
import CommonHelper from "../CommonHelper";
import { getVisibleExpression } from "../field/FieldTemplating";
import FormHelper from "./FormHelper";

/**
 * Building block for creating a FormContainer based on the provided OData V4 metadata.
 *
 *
 * Usage example:
 * <pre>
 * &lt;macros:FormContainer
 * id="SomeId"
 * entitySet="{entitySet>}"
 * dataFieldCollection ="{dataFieldCollection>}"
 * title="someTitle"
 * navigationPath="{ToSupplier}"
 * visible=true
 * onChange=".handlers.onFieldValueChange"
 * /&gt;
 * </pre>
 * @private
 */
@defineBuildingBlock({ name: "FormContainer", namespace: "sap.fe.macros" })
export default class FormContainerBlock extends BuildingBlockTemplatingBase {
	@blockAttribute({ type: "string" })
	id?: string;

	@blockAttribute({
		type: "sap.ui.model.Context",
		required: true,
		isPublic: true,
		expectedTypes: ["EntitySet", "NavigationProperty", "EntityType", "Singleton"]
	})
	contextPath!: Context;

	@blockAttribute({
		type: "sap.ui.model.Context"
	})
	entitySet?: Context;

	@blockAttribute({
		type: "sap.ui.model.Context",
		isPublic: true,
		required: true
	})
	metaPath!: Context;

	/**
	 * Metadata path to the dataFieldCollection
	 */
	@blockAttribute({
		type: "array"
	})
	dataFieldCollection?: FormElement[];

	/**
	 * Control whether the form is in displayMode or not
	 */
	@blockAttribute({
		type: "boolean"
	})
	displayMode = false;

	/**
	 * Title of the form container
	 */
	@blockAttribute({ type: "string" })
	title?: string;

	/**
	 * Defines the "aria-level" of the form title, titles of internally used form containers are nested subsequently
	 */
	@blockAttribute({ type: "sap.ui.core.TitleLevel", isPublic: true })
	titleLevel = "Auto";

	/**
	 * Binding the form container using a navigation path
	 */
	@blockAttribute({ type: "string" })
	navigationPath?: string;

	/**
	 * Binding the visibility of the form container using an expression binding or Boolean
	 */
	@blockAttribute({ type: "string" })
	visible?: string;

	/**
	 * Check if UI hidden annotation is present or not
	 */
	@blockAttribute({ type: "boolean" })
	hasUiHiddenAnnotation?: boolean;

	/**
	 * Flex designtime settings to be applied
	 */
	@blockAttribute({ type: "string" })
	designtimeSettings = "sap/fe/macros/form/FormContainer.designtime";

	@blockAttribute({ type: "array" })
	actions?: BaseAction[];

	@blockAttribute({ type: "boolean" })
	useSingleTextAreaFieldAsNotes?: boolean;

	@blockAggregation({ type: "sap.fe.macros.form.FormElement" })
	formElements: Record<string, ConfigurableObject> = {};

	// Just proxied down to the Field may need to see if needed or not
	@blockEvent()
	onChange?: string;

	contentId: string | undefined;

	constructor(props: PropertiesOf<FormContainerBlock>, externalConfiguration: unknown, settings: TemplateProcessorSettings) {
		super(props);
		this.entitySet = this.contextPath!;
		if (this.formElements && Object.keys(this.formElements).length > 0) {
			const oContextObjectPath = getInvolvedDataModelObjects<ReferenceFacet>(this.metaPath, this.contextPath);
			const mExtraSettings: Record<string, unknown> = {};
			let oFacetDefinition = oContextObjectPath.targetObject;
			// Wrap the facet in a fake Facet annotation
			oFacetDefinition = {
				$Type: UIAnnotationTypes.ReferenceFacet,
				Label: oFacetDefinition?.Label,
				Target: {
					$target: oFacetDefinition,
					fullyQualifiedName: oFacetDefinition?.fullyQualifiedName,
					path: "",
					term: "",
					type: "AnnotationPath",
					value: getContextRelativeTargetObjectPath(oContextObjectPath)
				},
				annotations: {},
				fullyQualifiedName: oFacetDefinition?.fullyQualifiedName
			} as unknown as ReferenceFacet;
			mExtraSettings[oFacetDefinition.Target.value] = { fields: this.formElements };
			const oConverterContext = this.getConverterContext(
				oContextObjectPath,
				/*this.contextPath*/ undefined,
				settings,
				mExtraSettings
			);
			const oFormDefinition = createFormDefinition(oFacetDefinition, "true", oConverterContext);

			// FormContainer.block represents a single container. We wrap one FieldGroup in a fake ReferenceFacet,
			// so createFormDefinition always returns exactly one FormContainer at index [0]
			this.dataFieldCollection = oFormDefinition.formContainers[0].formElements;
			if (oFormDefinition.formContainers[0].flexSettings?.designtime) {
				this.designtimeSettings =
					oFormDefinition.formContainers[0].flexSettings.designtime === "Default"
						? "sap/fe/macros/form/FormContainer.designtime"
						: oFormDefinition.formContainers[0].flexSettings.designtime;
			}
		}
		// We need the view id for the form elements stable ids generation
		this.contentId = settings.viewId as string;
	}

	/**
	 * Returns the template for the FormContainer.
	 * @returns The XML template string.
	 */
	public getTemplate(): string {
		const overflowToolbarID = this.id ? StableIDHelper.generate([this.id, "FormActionsToolbar"]) : undefined;
		const dataModelObject = getInvolvedDataModelObjects(this.contextPath, this.metaPath) as DataModelObjectPath<EntitySet> | undefined;
		const bindingString = FormHelper.generateBindingExpression(this.navigationPath, dataModelObject);

		let title = "";
		if (this.title && this.title.length > 0) {
			title = xml`<f:title>
				<core:Title level="${this.titleLevel}" text="${this.title}" />
			</f:title>`;
		}

		return xml`
		<f:FormContainer
			xmlns="sap.m"
			xmlns:f="sap.ui.layout.form"
			xmlns:macro="sap.fe.macros"
			xmlns:macroForm="sap.fe.macros.form"
			xmlns:internalMacro="sap.fe.macros.internal"
			xmlns:core="sap.ui.core"
			xmlns:controls="sap.fe.macros.controls"
			xmlns:dt="sap.ui.dt"
			xmlns:macrodata="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
			xmlns:fpm="sap.fe.macros.fpm"
			xmlns:template="http://schemas.sap.com/sapui5/extension/sap.ui.core.template/1"
			template:require="{
				MODEL: 'sap/ui/model/odata/v4/AnnotationHelper',
				ID: 'sap/fe/core/helpers/StableIdHelper',
				COMMON: 'sap/fe/macros/CommonHelper',
				FORM: 'sap/fe/macros/form/FormHelper',
				UI: 'sap/fe/core/templating/UIFormatters',
				DataField: 'sap/fe/core/templating/DataFieldFormatters',
				FieldTemplating: 'sap/fe/macros/field/FieldTemplating',
				Property: 'sap/fe/core/templating/PropertyFormatters',
				FIELD: 'sap/fe/macros/field/FieldHelper',
				MACRO: 'sap/fe/macros/MacroTemplating'
			}"

			core:require="{FormContainerRuntime: 'sap/fe/macros/form/FormContainerAPI'}"
			dt:designtime="${this.designtimeSettings}"
			id="${this.id || undefined}"
			visible="${this.visible}"
			macrodata:navigationPath="${this.navigationPath}"
			macrodata:etName="${this.contextPath.getObject("./@sapui.name")}"
			macrodata:UiHiddenPresent="${this.hasUiHiddenAnnotation}"
		>

			${title}
			<template:if test="${this.actions}">
				<template:then>
					<f:toolbar>
						<OverflowToolbar
							id="${overflowToolbarID}"
							${this.attr("binding", bindingString)}
						>
							<Title level="${this.titleLevel}" text="${this.title}" />
							<ToolbarSpacer />
							<template:repeat list="{actions>}" var="action">
								<core:Fragment fragmentName="sap.fe.macros.form.FormActionButtons" type="XML" />
							</template:repeat>
						</OverflowToolbar>
					</f:toolbar>
				</template:then>
			</template:if>

			<f:dependents>
				<macroForm:FormContainerAPI formContainerId="${this.id}" showDetails="{internal>showDetails}" />
			</f:dependents>

			<f:formElements>
				${this.getTemplatedFormElements()}
			</f:formElements>

		</f:FormContainer>`;
	}

	/**
	 * Returns the templated form elements.
	 * @returns The XML string for the form elements.
	 */
	public getTemplatedFormElements(): string {
		return xml`
			<template:with path="dataFieldCollection>" var="formElements">
				${this.getInnerTemplatedFormElements()}
			</template:with>`;
	}

	/**
	 * Returns the inner templated form elements, including DataPoint and Contact templates.
	 * @returns The XML string for the inner form elements.
	 */
	public getInnerTemplatedFormElements(): string {
		let getDataPointTemplate = "";

		if (this.dataFieldCollection && this.dataFieldCollection.length > 0) {
			// We need to consider the first element that has an annotationPath
			const firstElementWithAnnotationPath = this.dataFieldCollection.find((df) => !!df.annotationPath);
			let idPrefix = "";
			const isEditableHeader = this.id?.includes("HeaderFacet::FormContainer") === true;
			let formElementId = "undefined";
			if (this.id) {
				if (isEditableHeader) {
					formElementId = `${this.id}::FormElement`;
					idPrefix = `${this.id}::FormElement`;
				} else {
					formElementId = `${StableIDHelper.generate([this.id, "FormElement", this.dataFieldCollection[0].key])}`;
					idPrefix = `${StableIDHelper.generate([this.id, "FormElement", this.dataFieldCollection[0].key])}`;
				}
			}
			if (firstElementWithAnnotationPath?.annotationPath) {
				const computedDataModelObject = getInvolvedDataModelObjects(
					this.contextPath.getModel().createBindingContext(firstElementWithAnnotationPath?.annotationPath || "")
				) as DataModelObjectPath<EntitySet> | undefined;
				const bindingString = FormHelper.generateBindingExpression(this.navigationPath, computedDataModelObject);
				const designtime = computedDataModelObject?.targetObject?.annotations?.UI?.AdaptationHidden
					? "not-adaptable-tree"
					: "sap/fe/macros/form/FormElement.designtime";

				getDataPointTemplate = xml`
					<template:with path="formElements>0/annotationPath" var="dataPoint">
						<f:FormElement
							dt:designtime="${designtime}"
							id="${formElementId}"
							label="{dataPoint>@@FIELD.computeLabelText}"
							visible="${getVisibleExpression(computedDataModelObject as DataModelObjectPath<DataFieldAbstractTypes | DataPointType | Property>)}"
							${this.attr("binding", bindingString)}
						>
							<f:fields>
								<macro:Field
									idPrefix="${idPrefix}"
									vhIdPrefix="${this.id ? StableIDHelper.generate([this.id, "FieldValueHelp"]) : ""}"
									contextPath="${this.entitySet?.getPath()}"
									metaPath="${this.dataFieldCollection[0].annotationPath}"
									editMode="${this.displayMode === true ? "Display" : undefined}"
									onChange="${this.onChange}"
								>
									<formatOptions textAlignMode="Form" showEmptyIndicator="true" />
								</macro:Field>
							</f:fields>
						</f:FormElement>
					</template:with>

			`;
			}
		}

		const getContactTemplate = xml`
			<template:with path="formElements>0/annotationPath" var="metaPath">
				<f:FormElement
					dt:designtime="{= \${metaPath>./@com.sap.vocabularies.UI.v1.AdaptationHidden} ? 'not-adaptable-tree' :  'sap/fe/macros/form/FormElement.designtime' }"
					binding="{= FORM.generateBindingExpression(\${this.navigationPath},\${contextPath>@@UI.getDataModelObjectPath})}"
				>
				<f:label>
					<Label
						text="{metaPath>fn/$Path@com.sap.vocabularies.Common.v1.Label}"
						visible="{= FieldTemplating.getVisibleExpression(\${dataField>@@UI.getDataModelObjectPath})}"
					>
					<layoutData>
						<f:ColumnElementData cellsLarge="12" />
					</layoutData>
				</Label>
				</f:label>
					<f:fields>
						<macro:Contact
							metaPath="{metaPath>@@COMMON.getMetaPath}"
								contextPath="{contextPath>@@COMMON.getMetaPath}"
								visible="true"
							/>
					</f:fields>
				</f:FormElement>
			</template:with>`;

		return xml`
			<template:if test="{= \${formElements>0/annotationPath}.indexOf('com.sap.vocabularies.UI.v1.DataPoint') > -1 }">
				<template:then>
					${getDataPointTemplate}
				</template:then>
				<template:elseif
					test="{= \${formElements>0/annotationPath}.indexOf('com.sap.vocabularies.Communication.v1.Contact') > -1 }"
				>
					${getContactTemplate}
				</template:elseif>
				<template:else>
					${this.getDataFieldsForAnnotations()}
				</template:else>
			</template:if>`;
	}

	/**
	 * Generates the template for a form element with connected fields.
	 * @param formElement The form element.
	 * @returns The XML string for the connected fields form element.
	 */
	getConnectedFieldsFormElement(formElement: AnnotationFormElement): string {
		let connectedFieldElements = "";

		// Create a sorted copy of the connected fields based on the placeholder order in the template string.
		// The template string is expected to look like "{FieldA} / {FieldB}" etc. We extract the placeholder
		// sequence and sort the connected fields accordingly (falling back to original order for unmatched fields).
		let sortedConnectedFields = formElement.connectedFields ? [...formElement.connectedFields] : [];
		if (sortedConnectedFields.length > 1) {
			const templateString = sortedConnectedFields[0].originalTemplate || "";
			// Extract placeholders in the sequence defined by the template (e.g. "{FieldA} / {FieldB}")
			const placeholders = Array.from(templateString.matchAll(/\{([^}]+)\}/g))
				.map((m) => String(m[1]).trim())
				.filter((p) => p.length > 0);

			// Helper to derive the identifier from the connected field (last segment of fullyQualifiedName)
			const getFieldIdentifier = (cf: (typeof sortedConnectedFields)[number]): string => {
				const originalObject = cf.originalObject;
				return originalObject?.fullyQualifiedName
					? originalObject.fullyQualifiedName.substring(originalObject.fullyQualifiedName.lastIndexOf("/") + 1)
					: "";
			};

			const fieldIds = sortedConnectedFields.map(getFieldIdentifier);
			const uniquePlaceholders = new Set(placeholders);

			// We only reorder if the template is perfectly annotated:
			// 1. Same number of placeholders as connected fields
			// 2. All placeholders are unique
			// 3. Every connected field id is referenced exactly once
			const isPerfectMatch =
				placeholders.length === sortedConnectedFields.length &&
				uniquePlaceholders.size === placeholders.length &&
				fieldIds.every((id) => uniquePlaceholders.has(id));

			// Review feedback: Do NOT "fix" badly annotated connected fields.
			// If the annotation is not perfect, we keep the original order.
			if (isPerfectMatch) {
				const mapById = new Map(sortedConnectedFields.map((cf) => [getFieldIdentifier(cf), cf]));
				sortedConnectedFields = placeholders.map((ph) => mapById.get(ph)!);
			}
		}

		for (const connectedField of sortedConnectedFields) {
			const model = this.contextPath.getModel();
			const tempName = connectedField.originalObject?.fullyQualifiedName;
			const path = tempName?.substring(tempName.lastIndexOf("/") + 1);
			const bindingContext = model.createBindingContext(formElement.annotationPath + "Target/$AnnotationPath/Data/" + path);
			const delimiter = CommonHelper.getDelimiter(connectedField.originalTemplate ?? "");
			const notLastIndexCondition =
				sortedConnectedFields.indexOf(connectedField) !== sortedConnectedFields.length - 1
					? xml`<Text
text="${delimiter}"
class="sapUiSmallMarginBeginEnd"
width="100%"
/>`
					: "";

			const computedIdPrefix = this.id
				? StableIDHelper.generate([
						this.id,
						"SemanticFormElement",
						formElement.key,
						(connectedField.originalObject as DataField)?.Value.path
				  ])
				: "";
			const computedVhIdPrefix = this.id ? StableIDHelper.generate([this.id, formElement.key, "FieldValueHelp"]) : "";

			// if there is a label on the connected field, we create an invisible text for aria-labelledby for proper screen reading
			const connectedFieldPath = (connectedField.originalObject as DataField)?.Value?.path?.valueOf();
			const connectedFieldLabel = (connectedField.originalObject as DataField)?.Value?.$target?.annotations?.Common?.Label?.valueOf();
			let ariaLabelId = "";
			let ariaLabelText = "";
			if (this.id && connectedFieldPath && connectedFieldLabel) {
				ariaLabelId = StableIDHelper.generate([this.id, "AriaText", formElement.key, connectedFieldPath]);
				ariaLabelText = xml`
					<core:InvisibleText
						text="${connectedFieldLabel}"
						id="${ariaLabelId}"
					/>
				`;
			}

			let connectedFieldElement = "";
			connectedFieldElement = xml`
                ${ariaLabelText}
				<macro:Field
                    idPrefix="${computedIdPrefix}"
                    vhIdPrefix="${computedVhIdPrefix}"
                    contextPath="${this.entitySet?.getPath()}"
                    metaPath="${bindingContext.getPath()}"
                    onChange="${this.onChange}"
                    ariaLabelledBy="${
						this.id ? [StableIDHelper.generate([this.id, "SemanticFormElementLabel", formElement.key]), ariaLabelId] : ""
					}"
                >
                    <formatOptions
                        textLinesEdit="${formElement.formatOptions?.textLinesEdit}"
                        textMaxLines="${formElement.formatOptions?.textMaxLines}"
                        textMaxCharactersDisplay="${formElement.formatOptions?.textMaxCharactersDisplay}"
                        textMaxLength="${formElement.formatOptions?.textMaxLength}"
                        textExpandBehaviorDisplay="${formElement.formatOptions?.textExpandBehaviorDisplay}"
                        textAlignMode="Form"
                        showEmptyIndicator="true"
                        fieldEditStyle="${formElement.formatOptions?.fieldEditStyle}"
                        radioButtonsHorizontalLayout="${formElement.formatOptions?.radioButtonsHorizontalLayout}"
                        createAssociatedAriaLabel="true"
						imageFitType="${formElement.formatOptions?.imageFitType}"
                    />
                    <macro:layoutData>
                        <FlexItemData growFactor="{= %{ui>/isEditable} ? 1 : 0}" />
                    </macro:layoutData>
                </macro:Field>
                ${notLastIndexCondition}
                `;

			connectedFieldElements += connectedFieldElement;
		}

		const dataModelObjectForConnectedFields = getInvolvedDataModelObjects(
			this.contextPath.getModel().createBindingContext(formElement.annotationPath ?? "")
		) as DataModelObjectPath<EntitySet> | undefined;
		let formElementId = "";
		if (this.id) {
			if (this.contentId) {
				formElementId = `${this.contentId}--${StableIDHelper.generate([this.id, "SemanticFormElement", formElement.key])}`;
			} else {
				formElementId = `${StableIDHelper.generate([this.id, "SemanticFormElement", formElement.key])}`;
			}
		}
		const visibleExpression = formElement.isPartOfPreview
			? getVisibleExpression(
					dataModelObjectForConnectedFields as DataModelObjectPath<DataFieldAbstractTypes | DataPointType | Property>
			  )
			: "{= ${internal>showDetails} === true}";
		const bindingString = FormHelper.generateBindingExpression(this.navigationPath, dataModelObjectForConnectedFields);
		const targetObject = (dataModelObjectForConnectedFields?.targetObject as unknown as DataFieldForAnnotation)?.Target
			?.$target as AnnotationTerm<ConnectedFieldsTypeTypes>;

		const designtime = dataModelObjectForConnectedFields?.targetObject?.annotations?.UI?.AdaptationHidden
			? "not-adaptable-tree"
			: "sap/fe/macros/form/FormElement.designtime";
		const isRequired = getRequiredExpressionForConnectedDataField(
			dataModelObjectForConnectedFields as DataModelObjectPath<AnnotationPath<ConnectedFieldsType>>
		)?.toString();

		return xml`
            <f:FormElement
                xmlns:f="sap.ui.layout.form"
                dt:designtime="${designtime}"
                id="${formElementId}"
                visible="${visibleExpression}"
                ${this.attr("binding", bindingString)}
            >
                <f:label>
                    <Label
                    text="${targetObject?.Label ?? formElement.label}"
                    id="${this.id ? StableIDHelper.generate([this.id, "SemanticFormElementLabel", formElement.key]) : ""}"

                    />
                </f:label>
				<f:fields>
                    <controls:FieldWrapper required="${isRequired}">
                        <HBox wrap="Wrap">
							${connectedFieldElements}
                        </HBox>
                    </controls:FieldWrapper>
                </f:fields>
            </f:FormElement>
        `;
	}

	/**
	 * Generates the template for a form element representing a multivalue field.
	 * @param formElement The form element.
	 * @returns The XML string for the multi-value field form element.
	 */
	getMultiValueFieldFormElement(formElement: AnnotationFormElement): string {
		const computedDataModelObject = getInvolvedDataModelObjects(
			this.contextPath.getModel().createBindingContext(formElement.annotationPath ?? "")
		) as DataModelObjectPath<EntitySet> | undefined;
		const visibleExpression = formElement.isPartOfPreview
			? getVisibleExpression(computedDataModelObject as DataModelObjectPath<DataFieldAbstractTypes | DataPointType | Property>)
			: "{= ${internal>showDetails} === true}";
		const bindingString = FormHelper.generateBindingExpression(this.navigationPath, computedDataModelObject);
		const formElementId = this.id ? `${StableIDHelper.generate([this.id, "FormElement", formElement.key])}` : "undefined";
		const multiValueFieldId = this.id
			? `${StableIDHelper.generate([this.id, "FormElement", formElement.key, "MultiValueField"])}`
			: "undefined";
		const vhIdPrefix = this.id ? StableIDHelper.generate([this.id, "FieldValueHelp"]) : "";
		const designtime = computedDataModelObject?.targetObject?.annotations?.UI?.AdaptationHidden
			? "not-adaptable-tree"
			: "sap/fe/macros/form/FormElement.designtime";

		return xml`
												<f:FormElement
													xmlns:macros="sap.fe.macros"
													xmlns:multivaluefield="sap.fe.macros.multivaluefield"
													dt:designtime="${designtime}"
													id="${formElementId}"
													label="${formElement.label}"
													visible="${visibleExpression}"
													${this.attr("binding", bindingString)}
												>
													<f:fields>
														<macros:MultiValueField
															id="${multiValueFieldId}"
															vhIdPrefix="${vhIdPrefix}"
															contextPath="${this.entitySet?.getPath()}"
															metaPath="${formElement.annotationPath}"
														>
															<macros:formatOptions>
																<multivaluefield:FormatOptions showEmptyIndicator="true" />
															</macros:formatOptions>
														</macros:MultiValueField>
													</f:fields>
												</f:FormElement>`;
	}

	/**
	 * Generates the template for form elements representing a checkbox group.
	 * @param formElement The form element.
	 * @returns The XML string for the checkbox group form elements.
	 */
	getFieldGroupFormElement(formElement: AnnotationFormElement): string {
		let fieldGroupElements = "";
		//We template each element of the checkbox group
		for (const groupElement of formElement.fieldGroupElements!) {
			const model = this.contextPath.getModel();
			const tempName = groupElement.fullyQualifiedName;
			const path = tempName?.substring(tempName.lastIndexOf("/") + 1);
			const bindingContext = model.createBindingContext(formElement.annotationPath + "Target/$AnnotationPath/Data/" + path);
			const groupElementDataModelObject = getInvolvedDataModelObjects<DataFieldAbstractTypes | DataPointType>(bindingContext);
			const computedIdPrefix = this.id
				? `${StableIDHelper.generate([
						this.id,
						"CheckBoxGroup",
						formElement.key,
						(groupElementDataModelObject.targetObject as DataField | DataPointType)?.Value?.path
				  ])}`
				: "";

			const isBooleanFieldGroup =
				(groupElementDataModelObject.targetObject as DataField | DataPointType)?.Value?.$target?.type === "Edm.Boolean";

			const fieldGroupElement = isBooleanFieldGroup
				? xml`
				<macro:Field
					idPrefix="${computedIdPrefix}"
					contextPath="${this.entitySet?.getPath()}"
					metaPath="${bindingContext.getPath()}"
					onChange="${this.onChange}"
					ariaLabelledBy="${this.id ? StableIDHelper.generate([this.id, "FieldGroupFormElementLabel", formElement.key]) : ""}"
				>
					<formatOptions isFieldGroupItem="true" textAlignMode="Form" />
				</macro:Field>
			`
				: "";

			fieldGroupElements += fieldGroupElement;
		}

		const computedDataModelObject = getInvolvedDataModelObjects(
			this.contextPath.getModel().createBindingContext(formElement.annotationPath ?? "")
		) as DataModelObjectPath<EntitySet> | undefined;
		const visibleExpression = formElement.isPartOfPreview
			? getVisibleExpression(computedDataModelObject as DataModelObjectPath<DataFieldAbstractTypes | DataPointType | Property>)
			: "{= ${internal>showDetails} === true}";
		const bindingString = FormHelper.generateBindingExpression(this.navigationPath, computedDataModelObject);
		let fieldGroupFormElementId = "";
		let labelID = "";
		if (this.id) {
			if (this.contentId) {
				fieldGroupFormElementId = `${this.contentId}--${StableIDHelper.generate([
					this.id,
					"FieldGroupFormElement",
					formElement.key
				])}`;
				labelID = `${this.contentId}--${StableIDHelper.generate([this.id, "FieldGroupFormElementLabel", formElement.key])}`;
			} else {
				fieldGroupFormElementId = `${StableIDHelper.generate([this.id, "FieldGroupFormElement", formElement.key])}`;
				labelID = `${StableIDHelper.generate([this.id, "FieldGroupFormElementLabel", formElement.key])}`;
			}
		}
		const targetObject = (computedDataModelObject?.targetObject as unknown as DataFieldForAnnotation)?.Target?.$target as FieldGroup;

		const designtime = computedDataModelObject?.targetObject?.annotations?.UI?.AdaptationHidden
			? "not-adaptable-tree"
			: "sap/fe/macros/form/FormElement.designtime";

		return xml`
												<f:FormElement
													xmlns:f="sap.ui.layout.form"
													dt:designtime="${designtime}"
													id="${fieldGroupFormElementId}"
													visible="${visibleExpression}"
													${this.attr("binding", bindingString)}
												>
													<f:label>
														<Label
															text="${targetObject?.Label ?? formElement.label}"
															id="${labelID}"
														/>
													</f:label>
													<f:fields>
														<controls:RequiredFlexBox>
															<FlexBox
																direction="${formElement.formatOptions?.fieldGroupHorizontalLayout === true ? "Row" : "Column"}"
																wrap="Wrap"
																columnGap="1rem"
															>
																<items>
																	${fieldGroupElements}
																</items>
															</FlexBox>
														</controls:RequiredFlexBox>
													</f:fields>
												</f:FormElement>
											`;
	}

	/**
	 * Generates the template for a form element representing a field.
	 * @param formElement The form element.
	 * @returns The XML string for the field form element.
	 */
	getFieldFormElement(formElement: AnnotationFormElement): string {
		const computedDataModelObject = getInvolvedDataModelObjects(
			this.contextPath.getModel().createBindingContext(formElement.annotationPath ?? "")
		) as DataModelObjectPath<EntitySet> | undefined;
		const bindingString = FormHelper.generateBindingExpression(this.navigationPath, computedDataModelObject);
		const computedVhIdPrefix = StableIDHelper.generate([this.id, "FieldValueHelp"]);
		let formElementId = "undefined";
		const visibleExpression = formElement.isPartOfPreview
			? getVisibleExpression(computedDataModelObject as DataModelObjectPath<DataFieldAbstractTypes | DataPointType | Property>)
			: "{= ${internal>showDetails} === true}";
		const computedIdPrefix = this.id ? `${StableIDHelper.generate([this.id, "FormElement", formElement.key])}` : "";
		if (this.id) {
			if (this.contentId) {
				formElementId = `${this.contentId}--${StableIDHelper.generate([this.id, "FormElement", formElement.key])}`;
			} else {
				formElementId = `${StableIDHelper.generate([this.id, "FormElement", formElement.key])}`;
			}
		}
		const designtime = computedDataModelObject?.targetObject?.annotations?.UI?.AdaptationHidden
			? "not-adaptable-tree"
			: "sap/fe/macros/form/FormElement.designtime";

		return xml`
												<f:FormElement
													xmlns:f="sap.ui.layout.form"
													dt:designtime="${designtime}"
													id="${formElementId}"
													label="${formElement.label}"
													visible="${visibleExpression}"
													${this.attr("binding", bindingString)}
												>
													<f:fields>
<macro:Field
idPrefix="${computedIdPrefix}"
vhIdPrefix="${computedVhIdPrefix}"
contextPath="${this.contextPath.getPath()}"
metaPath="${formElement.annotationPath}"
onChange="${this.onChange}"
readOnly="${formElement.readOnly}"
semanticObject="${formElement.semanticObject}"
>
<formatOptions
textLinesEdit="${formElement.formatOptions?.textLinesEdit}"
textMaxLines="${formElement.formatOptions?.textMaxLines}"
textMaxLength="${formElement.formatOptions?.textMaxLength}"
textMaxCharactersDisplay="${formElement.formatOptions?.textMaxCharactersDisplay}"
textExpandBehaviorDisplay="${formElement.formatOptions?.textExpandBehaviorDisplay}"
textAlignMode="Form"
showEmptyIndicator="true"
fieldEditStyle="${formElement.formatOptions?.fieldEditStyle}"
radioButtonsHorizontalLayout="${formElement.formatOptions?.radioButtonsHorizontalLayout}"
dateTimePattern="${formElement.formatOptions?.pattern}"
useRadioButtonsForBoolean="${formElement.formatOptions?.useRadioButtonsForBoolean}"
imageFitType="${formElement.formatOptions?.imageFitType}"
/>
</macro:Field>
													</f:fields>
												</f:FormElement>
											`;
	}

	/**
	 * Generates the template for a custom form element.
	 * @param formElement The custom form element.
	 * @returns The XML string for the custom form element.
	 */
	getCustomFormElement(formElement: CustomFormElement): string {
		const propertyPath = this.contextPath.getPath(formElement.propertyPath);
		const computedDataModelObject = getInvolvedDataModelObjects(this.contextPath.getModel().createBindingContext(propertyPath)) as
			| DataModelObjectPath<EntitySet>
			| undefined;
		const bindingString = FormHelper.generateBindingExpression(this.navigationPath, computedDataModelObject);
		let formElementId = "";
		if (this.id) {
			if (this.contentId) {
				formElementId = `${this.contentId}--${StableIDHelper.generate([this.id, formElement.id])}`;
			} else {
				formElementId = `${StableIDHelper.generate([this.id, formElement.id])}`;
			}
		}
		const designtime = computedDataModelObject?.targetObject?.annotations?.UI?.AdaptationHidden
			? "not-adaptable-tree"
			: "sap/fe/macros/form/FormElement.designtime";
		const formElementKey = StableIDHelper.generate([this.id, formElement.key]);

		return xml`
								<f:FormElement
										dt:designtime="${designtime}"
										id="${formElementId}"
										label="${formElement.label}"
										${this.attr("visible", formElement.visible)}
										${this.attr("binding", bindingString)}
									>
										<f:fields>
											<macroForm:CustomFormElement
												metaPath="${formElement.propertyPath}"
												contextPath="${this.contextPath.getPath()}"
												formElementKey="${formElementKey}"
											>
												<fpm:CustomFragment
													id="${formElementKey}"
													fragmentName="${formElement.template}"
													contextPath="${this.contextPath.getPath()}"
												/>
											</macroForm:CustomFormElement>
										</f:fields>
									</f:FormElement>
		`;
	}

	/**
	 * Returns the template for a slot column for the given form element.
	 * @param formElement The form element.
	 * @returns The XML string for the slot column.
	 */
	getSlotColumn(formElement: FormElement): string {
		return xml`<slot name="${formElement.key}" />`;
	}

	/**
	 * Determines if the given data field is a multivalue field.
	 * @param dataField The data field to check.
	 * @returns True if the data field is a multivalue field, false otherwise.
	 */
	isMultiValueDataField(dataField: FormElement): boolean {
		let isMultiValueFieldCondition = false;
		if (dataField.annotationPath) {
			const bindingContext = this.contextPath.getModel().createBindingContext(dataField.annotationPath);
			const valuePath = bindingContext.getObject()?.Value?.$Path;
			if (valuePath) {
				isMultiValueFieldCondition = isMultiValueField(
					enhanceDataModelPath(getInvolvedDataModelObjects(bindingContext), valuePath)
				);
			}
		}

		return isMultiValueFieldCondition;
	}

	/**
	 * Generates the template for all data fields for annotations.
	 * @returns The XML string for the data fields.
	 */
	getDataFieldsForAnnotations(): string {
		let returnString = "";

		if (this.dataFieldCollection !== undefined) {
			for (const dataField of this.dataFieldCollection) {
				switch (dataField.type) {
					case "Annotation":
						if (
							(dataField as AnnotationFormElement).connectedFields &&
							(dataField as AnnotationFormElement).connectedFields!.length > 0
						) {
							returnString += this.getConnectedFieldsFormElement(dataField);
						} else if (this.isMultiValueDataField(dataField)) {
							returnString += this.getMultiValueFieldFormElement(dataField);
						} else if (
							(dataField as AnnotationFormElement).fieldGroupElements &&
							(dataField as AnnotationFormElement).fieldGroupElements!.length > 0
						) {
							returnString += this.getFieldGroupFormElement(dataField);
						} else {
							returnString += this.getFieldFormElement(dataField);
						}
						break;
					case "Default":
						returnString += this.getCustomFormElement(dataField as CustomFormElement);
						break;
					default:
						returnString += this.getSlotColumn(dataField);
						break;
				}
			}
		}

		return xml`${returnString}`;
	}
}
