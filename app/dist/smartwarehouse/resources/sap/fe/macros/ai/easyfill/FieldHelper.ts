import Log from "sap/base/Log";
import type { EnhanceWithUI5 } from "sap/fe/base/ClassSupport";
import type { FEView } from "sap/fe/core/BaseController";
import type Field from "sap/fe/macros/Field";
import { resolveTokenValue } from "sap/fe/macros/ai/EasyFilterDataFetcher";
import type { ValueListInfo } from "sap/fe/macros/internal/valuehelp/ValueListHelper";
import ValueListHelper from "sap/fe/macros/internal/valuehelp/ValueListHelper";
import BindingInfo from "sap/ui/base/BindingInfo";
import MessageType from "sap/ui/core/message/MessageType";
import FilterOperator from "sap/ui/model/FilterOperator";
import AnnotationHelper from "sap/ui/model/odata/v4/AnnotationHelper";
import type V4Context from "sap/ui/model/odata/v4/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type { FieldMetadata, FieldValues } from "ux/eng/fioriai/reuse/easyfill/EasyFill";

const UI5_ANNOTATION_PREFIX = "@$";
const TECHNICAL_FIELD_PREFIX = "__";

export function isTechnicalFieldKey(fieldName: string): boolean {
	return fieldName.startsWith(TECHNICAL_FIELD_PREFIX) || fieldName.startsWith(UI5_ANNOTATION_PREFIX);
}

export function isEditableField(fieldName: string, editableFields: Record<string, { isEditable?: boolean } | undefined>): boolean {
	return editableFields[fieldName]?.isEditable === true;
}

export function getFieldFormElementLabel(fieldMapping: FieldMetadata, updatedField: string): string {
	const fieldDescription: string | undefined = fieldMapping[updatedField]?.description;
	return fieldDescription && fieldDescription.length > 0 ? fieldDescription : updatedField;
}

export function formatFieldValue(metaModel: ODataMetaModel, bindingContext: V4Context, updatedField: string, rawValue: unknown): string {
	if (rawValue == null || rawValue === "") {
		return "";
	}
	try {
		const targetMetaPath = metaModel.getMetaPath(bindingContext.getPath(updatedField));
		const targetMetaContext = metaModel.createBindingContext(targetMetaPath)!;
		const valueExpression = AnnotationHelper.format(targetMetaContext.getObject(), { context: targetMetaContext });
		const parsedBinding = BindingInfo.parse(valueExpression);
		if (parsedBinding?.type) {
			return parsedBinding.type.formatValue(rawValue, "string") ?? "-";
		}
	} catch (e) {
		Log.warning("Failed to format value for field " + updatedField);
	}
	return String(rawValue);
}

export function getFormattedCurrentValue(
	view: FEView | undefined,
	metaModel: ODataMetaModel,
	bindingContext: V4Context,
	updatedField: string
): string {
	const rawValue = view?.getBindingContext()?.getObject()?.[updatedField];
	if (rawValue == null || rawValue === "") {
		return "-";
	}
	return formatFieldValue(metaModel, bindingContext, updatedField, rawValue);
}

export function applyValidationResultToField(field: EnhanceWithUI5<Field>, errorMessage: string): void {
	if (errorMessage.length > 0) {
		setTimeout((): void => {
			const messageId = field.addMessage({ type: MessageType.Error, message: errorMessage });
			field.data("messageId", messageId);
		}, 200);
	}
}

export async function validateFieldValue(
	metaModel: ODataMetaModel,
	bindingContext: V4Context,
	updatedField: string,
	updatedFields: FieldValues,
	getValueList: (path: string) => Promise<ValueListInfo | undefined>,
	getTranslatedText: (key: string, params?: unknown[]) => string
): Promise<{ errorMessage: string; hasError: boolean }> {
	const targetMetaPath = metaModel.getMetaPath(bindingContext.getPath(updatedField));
	const targetMetaContext = metaModel.createBindingContext(targetMetaPath)!;
	const valueExpression = AnnotationHelper.format(targetMetaContext.getObject(), { context: targetMetaContext });
	const parsedBinding = BindingInfo.parse(valueExpression);

	let errorMessage = "";
	let hasError = false;
	if (parsedBinding && parsedBinding.type) {
		try {
			const valueForValidation: unknown =
				typeof updatedFields[updatedField] === "number" ? String(updatedFields[updatedField]) : updatedFields[updatedField];
			parsedBinding.type.validateValue(valueForValidation);
		} catch (e) {
			hasError = true;
			errorMessage = (e as Error).message;
			Log.error("Validation error for field " + updatedField + ": ", errorMessage);
		}
	}

	const valueList = await getValueList(targetMetaPath);
	if (valueList && ValueListHelper.isValueListSearchable(targetMetaPath, valueList)) {
		const values = await resolveTokenValue(
			valueList,
			{ operator: FilterOperator.EQ, selectedValues: [updatedFields[updatedField] as string] },
			true
		);
		if (values[0].noMatch !== true) {
			updatedFields[updatedField] = values[0].selectedValues[0].value;
			errorMessage = "";
			hasError = false;
		} else {
			hasError = true;
			errorMessage = getTranslatedText("C_EASYEDIT_VH_ERROR", [values[0].selectedValues[0].value]);
		}
	}

	return { errorMessage, hasError };
}
