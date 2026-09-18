import type { EnhanceWithUI5 } from "sap/fe/base/ClassSupport";
import type { FEView } from "sap/fe/core/BaseController";
import Field from "sap/fe/macros/Field";
import * as EasyFillFieldHelper from "sap/fe/macros/ai/easyfill/FieldHelper";
import type { FieldsBySectionSubsection } from "sap/fe/macros/ai/easyfill/ReviewAreaBuilder";
import * as EasyFillReviewAreaBuilder from "sap/fe/macros/ai/easyfill/ReviewAreaBuilder";
import Input from "sap/m/Input";
import Text from "sap/m/Text";
import Title from "sap/m/Title";
import type UI5Event from "sap/ui/base/Event";
import CustomData from "sap/ui/core/CustomData";
import type UI5Element from "sap/ui/core/Element";
import type Form from "sap/ui/layout/form/Form";
import FormContainer from "sap/ui/layout/form/FormContainer";
import FormElement from "sap/ui/layout/form/FormElement";
import type Context from "sap/ui/model/Context";
import type V4Context from "sap/ui/model/odata/v4/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type { FieldMetadata, FieldValues } from "ux/eng/fioriai/reuse/easyfill/EasyFill";

/** All dependencies the field form builder needs from EasyFillDialog. */
export type FieldFormBuilderContext = {
	fieldMapping: FieldMetadata;
	bindingContext: V4Context | undefined;
	metaModel: ODataMetaModel;
	view: FEView | undefined;
	runAsOwner: <T>(fn: () => T) => T | undefined;
	ownerContextPath: string | undefined;
	getValueList: (path: string) => Promise<unknown>;
	getTranslatedText: (key: string, params?: unknown[]) => string;
	onFieldChange: (ev: UI5Event) => void;
	onValidateFieldGroups: (ev?: UI5Event) => void;
	onHasError: () => void;
	onHasValues: () => void;
};

/**
 * Creates an editable Field control for the given field name.
 * @param ctx The field form builder context.
 * @param updatedField Name of the updated field.
 * @returns Editable Field control.
 */
export function createEditableField(ctx: FieldFormBuilderContext, updatedField: string): EnhanceWithUI5<Field> {
	return ctx.runAsOwner(() => {
		return (
			<Field
				_requiresValidation={true}
				validateFieldGroup={ctx.onValidateFieldGroups}
				fieldGroupIds={"EasyFillField"}
				metaPath={updatedField}
				contextPath={ctx.ownerContextPath}
				change={ctx.onFieldChange}
			/>
		) as Field;
	}) as EnhanceWithUI5<Field>;
}

/**
 * Creates a FormContainer bound to the data and UI binding contexts.
 * @param ctx The field form builder context.
 * @param uiContext The UI model binding context.
 * @returns FormContainer with both contexts set.
 */
export function createFieldFormContainer(ctx: FieldFormBuilderContext, uiContext: Context): FormContainer {
	const fieldFormContainer = (<FormContainer />) as FormContainer;
	fieldFormContainer.setBindingContext(ctx.bindingContext);
	fieldFormContainer.setBindingContext(uiContext, "ui");
	return fieldFormContainer;
}

/**
 * Creates a Text control showing the pre-AI value of a field.
 * @param ctx The field form builder context.
 * @param updatedField Name of the updated field.
 * @returns Text control with the previous value and a labelled custom data entry.
 */
export function createPreviousValueText(ctx: FieldFormBuilderContext, updatedField: string): Text {
	const formattedValue = EasyFillFieldHelper.getFormattedCurrentValue(ctx.view, ctx.metaModel, ctx.bindingContext!, updatedField);
	const text = (<Text text={formattedValue} class={"sapFeEasyFillPreviousValue"} />) as Text;
	text.addCustomData(
		new CustomData({ key: "label", value: ctx.getTranslatedText("C_EASYEDIT_PREVIOUS_VALUE") + ": ", writeToDom: true })
	);
	return text;
}

/**
 * Creates a non-editable FormContainer displaying the AI-proposed value of a field.
 * @param ctx The field form builder context.
 * @param updatedField Name of the updated field.
 * @param updatedFields All AI-proposed field values.
 * @param uiContext The UI model binding context.
 * @returns FormContainer with a read-only Input and previous value text.
 */
export function createNonEditableFieldFormContainer(
	ctx: FieldFormBuilderContext,
	updatedField: string,
	updatedFields: FieldValues,
	uiContext: Context
): FormContainer {
	const formattedValue = EasyFillFieldHelper.formatFieldValue(
		ctx.metaModel,
		ctx.bindingContext!,
		updatedField,
		updatedFields[updatedField]
	);
	const nonEditableField = ctx.runAsOwner(() => {
		return (<Input value={formattedValue} editable={false} />) as Input;
	}) as Input;

	const fieldFormContainer = createFieldFormContainer(ctx, uiContext);
	const previousValueText = createPreviousValueText(ctx, updatedField);
	const formElementLabel = EasyFillFieldHelper.getFieldFormElementLabel(ctx.fieldMapping, updatedField);
	const formElement = (
		<FormElement label={formElementLabel}>{{ fields: [nonEditableField, previousValueText] }}</FormElement>
	) as FormElement;

	fieldFormContainer.addFormElement(formElement);
	return fieldFormContainer;
}

/**
 * Creates an editable FormContainer for an AI-proposed field value, runs validation.
 * @param ctx The field form builder context.
 * @param updatedField Name of the updated field.
 * @param updatedFields All AI-proposed field values.
 * @param uiContext The UI model binding context.
 * @returns Promise resolved with the created FormContainer.
 */
export async function createEditableFieldContainer(
	ctx: FieldFormBuilderContext,
	updatedField: string,
	updatedFields: FieldValues,
	uiContext: Context
): Promise<FormContainer> {
	ctx.onHasValues();

	const newField = createEditableField(ctx, updatedField);
	const fieldFormContainer = createFieldFormContainer(ctx, uiContext);
	const previousValueText = createPreviousValueText(ctx, updatedField);
	const formElementLabel = EasyFillFieldHelper.getFieldFormElementLabel(ctx.fieldMapping, updatedField);
	const formElement = (<FormElement label={formElementLabel}>{{ fields: [newField, previousValueText] }}</FormElement>) as FormElement;

	fieldFormContainer.addFormElement(formElement);

	const { errorMessage, hasError } = await EasyFillFieldHelper.validateFieldValue(
		ctx.metaModel,
		ctx.bindingContext!,
		updatedField,
		updatedFields,
		ctx.getValueList as Parameters<typeof EasyFillFieldHelper.validateFieldValue>[4],
		ctx.getTranslatedText
	);
	if (hasError) {
		ctx.onHasError();
	}
	ctx.bindingContext?.setProperty(updatedField, updatedFields[updatedField]);
	EasyFillFieldHelper.applyValidationResultToField(newField, errorMessage);

	return fieldFormContainer;
}

/**
 * Fills the incorrect values form with non-editable containers for each non-editable field.
 * @param ctx The field form builder context.
 * @param nonEditableFieldNames Field names that are not editable.
 * @param updatedFields All AI-proposed field values.
 * @param uiContext The UI model binding context.
 * @param incorrectValues Output map collecting the incorrect field values.
 * @param incorrectValuesForm Form to add the containers to.
 */
export function populateIncorrectValuesForm(
	ctx: FieldFormBuilderContext,
	nonEditableFieldNames: string[],
	updatedFields: FieldValues,
	uiContext: Context,
	incorrectValues: Record<string, unknown>,
	incorrectValuesForm: Form
): void {
	for (const fieldName of nonEditableFieldNames) {
		incorrectValues[fieldName] = updatedFields[fieldName];
		const fieldFormContainer = createNonEditableFieldFormContainer(ctx, fieldName, updatedFields, uiContext);
		incorrectValuesForm.addFormContainer(fieldFormContainer);
	}
}

/**
 * Fills review area blocks with one form per section-subsection in detailed layout mode.
 * @param ctx The field form builder context.
 * @param editableFieldNames Editable field names to render.
 * @param updatedFields All AI-proposed field values.
 * @param uiContext The UI model binding context.
 * @param newValues Output map collecting new field values.
 * @param reviewAreaBlocks Output array of review area UI elements.
 */
export async function populateDetailedReviewAreaBlocks(
	ctx: FieldFormBuilderContext,
	editableFieldNames: string[],
	updatedFields: FieldValues,
	uiContext: Context,
	newValues: Record<string, unknown>,
	reviewAreaBlocks: UI5Element[]
): Promise<void> {
	const { sectionSubsectionOrder, fieldsBySectionSubsection } = EasyFillReviewAreaBuilder.organizeFieldsBySectionSubsections(
		ctx.fieldMapping,
		editableFieldNames
	);

	for (const sectionSubsectionTitle of sectionSubsectionOrder) {
		const sectionSubsectionData = fieldsBySectionSubsection[sectionSubsectionTitle];
		const sectionSubsectionForm = EasyFillReviewAreaBuilder.createReviewAreaForm();

		for (const fieldName of sectionSubsectionData.noFieldSubsectionFields) {
			newValues[fieldName] = updatedFields[fieldName];
			const fieldFormContainer = await createEditableFieldContainer(ctx, fieldName, updatedFields, uiContext);
			sectionSubsectionForm.addFormContainer(fieldFormContainer);
		}

		await addFieldSubsectionContainers(ctx, sectionSubsectionData, updatedFields, uiContext, newValues, sectionSubsectionForm);

		if (sectionSubsectionForm.getFormContainers().length > 0) {
			if (sectionSubsectionTitle.length > 0) {
				reviewAreaBlocks.push((<Title text={sectionSubsectionTitle} />) as Title);
			}
			reviewAreaBlocks.push(sectionSubsectionForm);
		}
	}
}

/**
 * Adds field-subsection-grouped FormContainers to a section form in detailed layout mode.
 * @param ctx The field form builder context.
 * @param sectionSubsectionData Subsection grouping data from organizeFieldsBySectionSubsections.
 * @param updatedFields All AI-proposed field values.
 * @param uiContext The UI model binding context.
 * @param newValues Output map collecting new field values.
 * @param sectionSubsectionForm The form to add the subsection containers to.
 */
export async function addFieldSubsectionContainers(
	ctx: FieldFormBuilderContext,
	sectionSubsectionData: FieldsBySectionSubsection[string],
	updatedFields: FieldValues,
	uiContext: Context,
	newValues: Record<string, unknown>,
	sectionSubsectionForm: Form
): Promise<void> {
	for (const fieldSubsectionTitle of sectionSubsectionData.fieldSubsectionOrder) {
		const fieldSubsectionContainer = createFieldFormContainer(ctx, uiContext);
		fieldSubsectionContainer.setTitle(fieldSubsectionTitle);
		for (const fieldName of sectionSubsectionData.fieldsByFieldSubsection[fieldSubsectionTitle]) {
			newValues[fieldName] = updatedFields[fieldName];
			const fieldFormContainer = await createEditableFieldContainer(ctx, fieldName, updatedFields, uiContext);
			const formElement = fieldFormContainer.getFormElements()[0];
			if (formElement !== undefined) {
				fieldSubsectionContainer.addFormElement(formElement);
			}
		}
		if (fieldSubsectionContainer.getFormElements().length > 0) {
			sectionSubsectionForm.addFormContainer(fieldSubsectionContainer);
		}
	}
}

/**
 * Fills review area blocks with a single form containing all editable fields in condensed layout mode.
 * @param ctx The field form builder context.
 * @param editableFieldNames Editable field names to render.
 * @param updatedFields All AI-proposed field values.
 * @param uiContext The UI model binding context.
 * @param newValues Output map collecting new field values.
 * @param reviewAreaBlocks Output array of review area UI elements.
 */
export async function populateCondensedReviewAreaBlocks(
	ctx: FieldFormBuilderContext,
	editableFieldNames: string[],
	updatedFields: FieldValues,
	uiContext: Context,
	newValues: Record<string, unknown>,
	reviewAreaBlocks: UI5Element[]
): Promise<void> {
	const reviewAreaForm = EasyFillReviewAreaBuilder.createReviewAreaForm();
	for (const fieldName of editableFieldNames) {
		newValues[fieldName] = updatedFields[fieldName];
		const fieldFormContainer = await createEditableFieldContainer(ctx, fieldName, updatedFields, uiContext);
		reviewAreaForm.addFormContainer(fieldFormContainer);
	}
	if (reviewAreaForm.getFormContainers().length > 0) {
		reviewAreaBlocks.push(reviewAreaForm);
	}
}
