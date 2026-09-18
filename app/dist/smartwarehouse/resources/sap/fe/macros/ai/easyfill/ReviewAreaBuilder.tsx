import Log from "sap/base/Log";
import * as EasyFillFieldHelper from "sap/fe/macros/ai/easyfill/FieldHelper";
import { EasyFillLayoutMode } from "sap/fe/macros/ai/EasyFillLayoutMode";
import MessageStrip from "sap/m/MessageStrip";
import Title from "sap/m/Title";
import VBox from "sap/m/VBox";
import type UI5Element from "sap/ui/core/Element";
import { TitleLevel } from "sap/ui/core/library";
import ColumnLayout from "sap/ui/layout/form/ColumnLayout";
import Form from "sap/ui/layout/form/Form";
import ObjectPageSubSection from "sap/uxap/ObjectPageSubSection";
import type { FieldMetadata, FieldValues } from "ux/eng/fioriai/reuse/easyfill/EasyFill";

export type ReviewAreaContext = {
	selectedLayoutMode: EasyFillLayoutMode.CONDENSED | EasyFillLayoutMode.DETAILED;
	getTranslatedText: (key: string, params?: unknown[]) => string;
};

/**
 * Creates a new editable review area form with a column layout.
 * @returns Editable Form control.
 */
export function createReviewAreaForm(): Form {
	return (
		<Form editable={true} class="sapFeEasyFillForm">
			{{
				layout: <ColumnLayout columnsM={2} columnsL={3} columnsXL={4} />
			}}
		</Form>
	) as Form;
}

/**
 * Creates a new non-editable form for displaying incorrect values.
 * @returns Non-editable Form control.
 */
export function createIncorrectValuesForm(): Form {
	return (
		<Form editable={false} class="sapFeEasyFillForm">
			{{
				layout: <ColumnLayout columnsM={2} columnsL={3} columnsXL={4} />
			}}
		</Form>
	) as Form;
}

/**
 * Creates a single ObjectPageSubSection with the given blocks and optional title.
 * @param subSectionId The subsection element ID.
 * @param blocks Content blocks to place in the subsection.
 * @param title Optional subsection title.
 * @returns ObjectPageSubSection control.
 */
export function createObjectPageSubSection(subSectionId: string, blocks: UI5Element[], title?: string): ObjectPageSubSection {
	return (
		<ObjectPageSubSection id={subSectionId} titleUppercase={false} title={title} class="sapFeEasyFillSubsection">
			{{
				blocks: blocks
			}}
		</ObjectPageSubSection>
	) as ObjectPageSubSection;
}

/**
 * Builds a warning UI element for the case where all AI-proposed rows are new (creation not allowed).
 * @param ctx The review area context.
 * @param collectionMetadata Metadata for the collection field.
 * @returns Warning MessageStrip (condensed: wrapped in VBox with title).
 */
export function buildAllNewRowsWarning(ctx: ReviewAreaContext, collectionMetadata: NonNullable<FieldMetadata[string]>): UI5Element {
	const warningStrip = (
		<MessageStrip text={ctx.getTranslatedText("C_EASYEDIT_TABLE_NEW_ROW_NOT_ALLOWED")} type={"Warning"} showIcon={true} />
	) as MessageStrip;
	if (ctx.selectedLayoutMode === EasyFillLayoutMode.CONDENSED) {
		return (
			<VBox class="sapUiSmallMargin">
				{{ items: [new Title({ text: collectionMetadata.description, level: TitleLevel.H5 }), warningStrip] }}
			</VBox>
		) as VBox;
	}
	return warningStrip;
}

/**
 * Wraps a table diff VBox with a "new rows not allowed" warning strip above it.
 * @param ctx The review area context.
 * @param diffTable The table preview VBox to wrap.
 * @returns VBox containing warning strip and diff table.
 */
export function buildMixedRowsPreviewWithWarning(ctx: ReviewAreaContext, diffTable: VBox): UI5Element {
	return (
		<VBox>
			{{
				items: [
					<MessageStrip text={ctx.getTranslatedText("C_EASYEDIT_TABLE_NEW_ROW_NOT_ALLOWED")} type={"Warning"} showIcon={true} />,
					diffTable
				]
			}}
		</VBox>
	) as VBox;
}

/**
 * Creates all ObjectPageSubSection controls for one review section.
 * In detailed mode, Title+Form pairs in reviewAreaBlocks become named subsections.
 * In condensed mode, all content goes into a single default subsection.
 * Each table VBox always gets its own dedicated subsection.
 * @param ctx The review area context.
 * @param baseSubSectionId Base ID prefix for generated subsections.
 * @param reviewAreaBlocks Review blocks from field content.
 * @param hasSectionIncorrectValues Whether the incorrect values form has content.
 * @param incorrectValuesForm Form containing incorrect (non-editable) field values.
 * @param tableVBoxes Table preview VBoxes, each rendered in its own subsection.
 * @returns List of ObjectPageSubSection controls.
 */
export function createObjectPageSubSections(
	ctx: ReviewAreaContext,
	baseSubSectionId: string,
	reviewAreaBlocks: UI5Element[],
	hasSectionIncorrectValues: boolean,
	incorrectValuesForm: Form,
	tableVBoxes: UI5Element[] = []
): ObjectPageSubSection[] {
	type SubSectionEntry = { title: string; form: Form };

	const defaultSubSectionBlocks: UI5Element[] = [];
	const subSectionEntries: SubSectionEntry[] = [];
	const subSections: ObjectPageSubSection[] = [];
	let generatedSubSectionIndex = 0;

	let index = 0;
	while (index < reviewAreaBlocks.length) {
		const block: UI5Element = reviewAreaBlocks[index];
		const nextBlock: UI5Element | undefined = reviewAreaBlocks[index + 1];
		const isDetailedMode: boolean = ctx.selectedLayoutMode === EasyFillLayoutMode.DETAILED;
		if (isDetailedMode && block instanceof Title && nextBlock instanceof Form) {
			subSectionEntries.push({ title: block.getText(), form: nextBlock });
			index += 2;
			continue;
		}
		defaultSubSectionBlocks.push(block);
		index++;
	}

	for (const subSectionEntry of subSectionEntries) {
		const wrappedForm = (<VBox>{{ items: [subSectionEntry.form] }}</VBox>) as VBox;
		subSections.push(
			createObjectPageSubSection(`${baseSubSectionId}_${generatedSubSectionIndex}`, [wrappedForm], subSectionEntry.title)
		);
		generatedSubSectionIndex++;
	}

	if (hasSectionIncorrectValues) {
		const incorrectFieldsTitle = (
			<Title text={ctx.getTranslatedText("C_EASYEDIT_INCORRECT_FIELDS")} class="sapUiSmallMarginBegin" />
		) as Title;
		const fieldContainer = (
			<VBox>
				{{
					items:
						ctx.selectedLayoutMode === EasyFillLayoutMode.CONDENSED
							? [incorrectFieldsTitle, incorrectValuesForm]
							: [incorrectValuesForm]
				}}
			</VBox>
		) as VBox;
		defaultSubSectionBlocks.push(fieldContainer);
	}

	if (defaultSubSectionBlocks.length > 0 || (subSections.length === 0 && tableVBoxes.length === 0)) {
		const wrappedBlocks = (<VBox>{{ items: defaultSubSectionBlocks }}</VBox>) as VBox;
		subSections.unshift(createObjectPageSubSection(`${baseSubSectionId}_${generatedSubSectionIndex}`, [wrappedBlocks]));
		generatedSubSectionIndex++;
	}

	for (const tableVBox of tableVBoxes) {
		subSections.push(createObjectPageSubSection(`${baseSubSectionId}_table_${generatedSubSectionIndex}`, [tableVBox]));
		generatedSubSectionIndex++;
	}

	return subSections;
}

/**
 * Determines which fields in updatedFields are editable and which are not.
 * Skips collection fields and fields with non-scalar values.
 * @param fieldMapping The current field metadata map.
 * @param updatedFields The AI-proposed field values.
 * @param getEditableFields Async function returning the editable fields map.
 * @returns Lists of editable and non-editable field names.
 */
export async function getEditableAndNotEditableFieldNames(
	fieldMapping: FieldMetadata,
	updatedFields: FieldValues,
	getEditableFields: () => Promise<Record<string, { isEditable?: boolean } | undefined>>
): Promise<{ editableFieldNames: string[]; nonEditableFieldNames: string[] }> {
	const editableFields = await getEditableFields();
	const editableFieldNames: string[] = [];
	const nonEditableFieldNames: string[] = [];

	for (const fieldName of Object.keys(updatedFields)) {
		if (fieldMapping[fieldName]?.isCollection === true) {
			continue;
		}
		const value = updatedFields[fieldName];
		if (value !== null && typeof value === "object") {
			const valueKind = Array.isArray(value) ? "array" : "object";
			Log.warning(`EasyFill: unexpected ${valueKind} value for scalar field "${fieldName}", skipping`);
			continue;
		}
		if (EasyFillFieldHelper.isEditableField(fieldName, editableFields)) {
			editableFieldNames.push(fieldName);
		} else {
			nonEditableFieldNames.push(fieldName);
		}
	}
	return { editableFieldNames, nonEditableFieldNames };
}

/** Structure describing how editable fields are organized into subsections. */
export type FieldsBySectionSubsection = Record<
	string,
	{
		noFieldSubsectionFields: string[];
		fieldSubsectionOrder: string[];
		fieldsByFieldSubsection: Record<string, string[]>;
	}
>;

/**
 * Groups editable fields by their section-subsection and field-subsection titles for detailed layout mode.
 * @param fieldMapping The current field metadata map.
 * @param editableFieldNames List of editable field names to organize.
 * @returns Ordered subsection titles and grouped field hierarchy.
 */
export function organizeFieldsBySectionSubsections(
	fieldMapping: FieldMetadata,
	editableFieldNames: string[]
): { sectionSubsectionOrder: string[]; fieldsBySectionSubsection: FieldsBySectionSubsection } {
	const sectionSubsectionOrder: string[] = [];
	const fieldsBySectionSubsection: FieldsBySectionSubsection = {};

	for (const fieldName of editableFieldNames) {
		const sectionSubsectionTitle: string = fieldMapping[fieldName]?.sectionSubsection ?? "";
		const fieldSubsectionTitle: string | undefined = fieldMapping[fieldName]?.fieldSubsection;

		if (fieldsBySectionSubsection[sectionSubsectionTitle] === undefined) {
			fieldsBySectionSubsection[sectionSubsectionTitle] = {
				noFieldSubsectionFields: [],
				fieldSubsectionOrder: [],
				fieldsByFieldSubsection: {}
			};
			sectionSubsectionOrder.push(sectionSubsectionTitle);
		}

		const sectionSubsectionData = fieldsBySectionSubsection[sectionSubsectionTitle];
		if (fieldSubsectionTitle === undefined) {
			sectionSubsectionData.noFieldSubsectionFields.push(fieldName);
			continue;
		}

		if (sectionSubsectionData.fieldsByFieldSubsection[fieldSubsectionTitle] === undefined) {
			sectionSubsectionData.fieldsByFieldSubsection[fieldSubsectionTitle] = [];
			sectionSubsectionData.fieldSubsectionOrder.push(fieldSubsectionTitle);
		}
		sectionSubsectionData.fieldsByFieldSubsection[fieldSubsectionTitle].push(fieldName);
	}

	return { sectionSubsectionOrder, fieldsBySectionSubsection };
}
