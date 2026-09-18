import type { AnnotationTerm, EntitySet, Property } from "@sap-ux/vocabularies-types";
import type {
	ConnectedFieldsTypeTypes,
	DataField,
	DataFieldAbstractTypes,
	DataFieldForAnnotation,
	DataPointType,
	FieldGroup
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { BindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { and, compileExpression, equal, pathInModel } from "sap/fe/base/BindingToolkit";
import type PageController from "sap/fe/core/PageController";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import type { BaseAction } from "sap/fe/core/converters/controls/Common/Action";
import type { AnnotationFormElement, ConnectedField, CustomFormElement, FormElement } from "sap/fe/core/converters/controls/Common/Form";
import * as StableIDHelper from "sap/fe/core/helpers/StableIdHelper";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { enhanceDataModelPath } from "sap/fe/core/templating/DataModelPathHelper";
import { isRequiredExpression } from "sap/fe/core/templating/FieldControlHelper";
import * as UIFormatters from "sap/fe/core/templating/UIFormatters";
import { isMultiValueField } from "sap/fe/core/templating/UIFormatters";
import Field from "sap/fe/macros/Field";
import Contact from "sap/fe/macros/contact/Contact";
import FlexBox from "sap/m/FlexBox";
import FlexItemData from "sap/m/FlexItemData";
import HBox from "sap/m/HBox";
import Label from "sap/m/Label";
import MessageStrip from "sap/m/MessageStrip";
import OverflowToolbar from "sap/m/OverflowToolbar";
import Text from "sap/m/Text";
import MTitle from "sap/m/Title";
import ToolbarSpacer from "sap/m/ToolbarSpacer";
import VBox from "sap/m/VBox";
import type Control from "sap/ui/core/Control";
import CustomData from "sap/ui/core/CustomData";
import InvisibleText from "sap/ui/core/InvisibleText";
import Title from "sap/ui/core/Title";
import ColumnElementData from "sap/ui/layout/form/ColumnElementData";
import FormContainer from "sap/ui/layout/form/FormContainer";
import UI5FormElement from "sap/ui/layout/form/FormElement";
import type Context from "sap/ui/model/odata/v4/Context";
import type { TitleLevel } from "sap/ui/webc/main/library";
import type { EventHandler } from "../CollectionBindingInfo";
import CommonHelper from "../CommonHelper";
import MultiValueFieldBlock from "../MultiValueField";
import FieldWrapper from "../controls/FieldWrapper";
import RequiredFlexBox from "../controls/RequiredFlexBox";
import FieldFormatOptions from "../field/FieldFormatOptions";
import { getDataModelObjectPathForValue, getVisibleExpression } from "../field/FieldTemplating";
import FormatOptions from "../multivaluefield/FormatOptions";
import MacroCustomFormElement from "./CustomFormElement";
import { getFormActionButtons } from "./FormActionButtons";
import FormContainerAPI from "./FormContainerAPI";
import FormHelper from "./FormHelper";

/**
 * Get the MessageStrip text binding expression for a field group.
 * @param fieldGroupFullyQualifiedName The fully qualified name of the field group
 * @returns The binding expression for the MessageStrip text
 */
export function getMessageStripTextExpression(fieldGroupFullyQualifiedName: string | undefined): string {
	return fieldGroupFullyQualifiedName
		? (compileExpression(pathInModel(`internal>/${fieldGroupFullyQualifiedName}/valueStateText`)) as string)
		: "";
}

/**
 * Get the MessageStrip visibility binding expression for a field group.
 * @param fieldGroupFullyQualifiedName The fully qualified name of the field group
 * @param requiredExpressionRaw The raw required expression (uncompiled) for the field group
 * @returns The binding expression for the MessageStrip visibility
 */
export function getMessageStripVisibilityExpression(
	fieldGroupFullyQualifiedName: string | undefined,
	requiredExpressionRaw: BindingToolkitExpression<boolean> | undefined
): string | boolean {
	if (fieldGroupFullyQualifiedName && requiredExpressionRaw) {
		return compileExpression(
			and(requiredExpressionRaw, equal(pathInModel(`internal>/${fieldGroupFullyQualifiedName}/valueState`), "Error"))
		) as string;
	} else if (fieldGroupFullyQualifiedName) {
		return compileExpression(equal(pathInModel(`internal>/${fieldGroupFullyQualifiedName}/valueState`), "Error")) as string;
	}
	return false;
}

/**
 * Helper function to generate IDs with the proper prefix using the controller.
 * @param controller The page controller
 * @param idParts The ID parts to generate the stable ID
 * @returns The computed ID
 */
function createFormElementId(controller: PageController | undefined, ...idParts: string[]): string {
	const stableId = StableIDHelper.generate(idParts);
	return controller ? controller.createId(stableId) || stableId : stableId;
}

export type FormContainerProps = {
	id?: string;
	visible?: boolean;
	title?: string;
	titleLevel?: string;
	displayMode?: boolean;
	macrodata: {
		navigationPath: string;
		UiHiddenPresent: boolean;
		etName: string;
		navigationPropertiesForAdaptationDialog?: string[];
	};
	actions?: BaseAction[];
	dataFieldCollection?: FormElement[];
	designtimeSettings?: string;
	onChange?: EventHandler;
	slotElements: Control[];
	ibnMappingProperties?: string[]; // IBN mapping local properties for $select
};
type FormElementProps = {
	computedIdPrefix?: string;
	computedVhIdPrefix?: string;
	bindingString?: string;
	visibleExpression?: string;
	designtime?: string;
};

/**
 * Create the content for a FormContainer.
 * @param props Props describing the form container such as id, title, actions or dataFieldCollection.
 * @param contextPath Context used to resolve annotation and model paths for contained form elements.
 * @param controller Optional page controller used for the action buttons logic.
 * @param metaPath
 * @returns A `sap.ui.layout.form.FormContainer` control.
 */
export function getFormContainerContent(
	props: FormContainerProps,
	contextPath: Context,
	controller?: PageController,
	metaPath?: Context
): Control {
	const {
		id,
		visible,
		title,
		titleLevel,
		macrodata,
		actions,
		dataFieldCollection,
		designtimeSettings,
		slotElements,
		ibnMappingProperties
	} = props;
	const formElements = getFormElements(dataFieldCollection, contextPath, props, slotElements, controller!);
	// Collect namespaced / custom attributes not present in the FormContainer TS typings.
	/* const customAttributes: Record<string, unknown> = {
	"macrodata:navigationPath": macrodata.navigationPath,
	"macrodata:etName": macrodata.etName,
	"macrodata:UiHiddenPresent": macrodata.UiHiddenPresent
	}; */
	const viewId = controller?.getView().createId(id as unknown as string); // ensure the FormContainer ID is registered in the view

	// Get the data model object for binding generation - pass both contextPath and metaPath like in FormContainer.block.ts
	const dataModelObject = getInvolvedDataModelObjects(contextPath, metaPath) as DataModelObjectPath<EntitySet> | undefined;

	return (
		<FormContainer
			id={viewId}
			visible={visible}
			dt:designtime={
				designtimeSettings === "Default" || !designtimeSettings ? "sap/fe/macros/form/FormContainer.designtime" : designtimeSettings
			}
		>
			{{
				customData: [
					<CustomData key="navigationPath" value={macrodata.navigationPath} />,
					<CustomData key="etName" value={macrodata.etName} />,
					<CustomData key="UiHiddenPresent" value={macrodata.UiHiddenPresent} />,
					macrodata.navigationPropertiesForAdaptationDialog ? (
						<CustomData
							key="navigationPropertiesForAdaptationDialog"
							value={macrodata.navigationPropertiesForAdaptationDialog}
						/>
					) : undefined
				],
				title: getTitle(title, titleLevel),
				toolbar: getActionToolbar(
					id,
					actions,
					title,
					titleLevel,
					contextPath,
					controller,
					macrodata.navigationPath,
					dataModelObject,
					ibnMappingProperties
				),
				formElements: formElements,
				dependents: ((): FormContainerAPI => {
					const formContainerAPI = new FormContainerAPI({ formContainerId: id });
					formContainerAPI.bindProperty("showDetails", { path: "showDetails", model: "internal" });
					return formContainerAPI;
				})()
			}}
		</FormContainer>
	);
}

/**
 * Create a Title control for the form container.
 * @param formContainerTitle Title text to display.
 * @param formContainerTitleLevel Title level for accessibility and styling.
 * @returns A `sap.ui.core.Title` control.
 */
function getTitle(formContainerTitle: string | undefined, formContainerTitleLevel: string | undefined): Control | undefined {
	if (!formContainerTitle || (!formContainerTitleLevel && formContainerTitle.length === 0)) {
		return undefined;
	}
	return <Title text={formContainerTitle} level={formContainerTitleLevel as TitleLevel} />;
}

/**
 * Create a toolbar Title control used inside the action toolbar.
 * @param formContainerTitle Title text to display.
 * @param formContainerTitleLevel Title level accessibility and styling.
 * @returns A TitleToolbar control.
 */
function getToolbarTitle(formContainerTitle: string | undefined, formContainerTitleLevel: string | undefined): Control | undefined {
	if (!formContainerTitle || !formContainerTitleLevel) {
		return undefined;
	}
	return <MTitle text={formContainerTitle} level={formContainerTitleLevel as TitleLevel} />;
}

/**
 * Create an OverflowToolbar containing action buttons for the form container.
 * The toolbar contains an optional title and the action buttons produced by `getFormActionButtons`.
 * @param id The form container ID used to generate stable IDs for the toolbar.
 * @param actions Array of actions metadata used to create toolbar buttons.
 * @param formContainerTitle Title text to display.
 * @param formContainerTitleLevel Title level accessibility and styling.
 * @param context Binding context.
 * @param controller Optional page controller used for the button creation logic.
 * @param navigationPath Optional navigation path for binding.
 * @param dataModelObject Optional data model object path for binding generation.
 * @param ibnMappingProperties Optional intent-based navigation mapping for local properties to $select.
 * @returns An `sap.m.OverflowToolbar` control with action buttons or undefined if there are no actions.
 */
function getActionToolbar(
	id: string | undefined,
	actions: BaseAction[] | undefined,
	formContainerTitle: string | undefined,
	formContainerTitleLevel: string | undefined,
	context: Context,
	controller?: PageController,
	navigationPath?: string,
	dataModelObject?: DataModelObjectPath<EntitySet>,
	ibnMappingProperties?: string[]
): Control | undefined {
	if (!actions || actions.length === 0) {
		return undefined;
	}

	const overflowToolbarID = id ? createFormElementId(controller, id, "FormActionsToolbar") : undefined;

	const bindingString = FormHelper.generateBindingExpression(navigationPath, dataModelObject, ibnMappingProperties);

	return (
		<OverflowToolbar id={overflowToolbarID} binding={bindingString}>
			{getToolbarTitle(formContainerTitle, formContainerTitleLevel)}
			<ToolbarSpacer />
			{getFormActionButtons(actions, context, controller)}
		</OverflowToolbar>
	);
}

/**
 * Create an array of form element controls for the given data field collection.
 * @param dataFieldCollection Collection of data fields.
 * @param contextPath Binding context used to compute each element.
 * @param formContainerProps FormContainer level properties used in generating the form elements.
 * @param slotElements Additional slot controls for inline custom form elements.
 * @param controller
 * @returns An array of form elements controls.
 */
function getFormElements(
	dataFieldCollection: FormElement[] | undefined,
	contextPath: Context,
	formContainerProps: FormContainerProps,
	slotElements: Control[],
	controller: PageController
): (Control | undefined)[] | undefined {
	if (!dataFieldCollection || dataFieldCollection.length === 0) {
		return undefined;
	}
	// DataPoint template handling
	const firstElementWithAnnotationPath = dataFieldCollection.find((df) => !!df.annotationPath);
	if (
		firstElementWithAnnotationPath?.annotationPath &&
		firstElementWithAnnotationPath.annotationPath.includes("com.sap.vocabularies.UI.v1.DataPoint")
	) {
		const dataPointElement = getDataPointFormElement(
			firstElementWithAnnotationPath as AnnotationFormElement,
			contextPath,
			getFormElementProps(firstElementWithAnnotationPath, contextPath, formContainerProps, controller),
			formContainerProps
		);
		return [dataPointElement];
	}

	// Contact template handling
	if (
		dataFieldCollection[0]?.annotationPath &&
		dataFieldCollection[0].annotationPath.includes("com.sap.vocabularies.Communication.v1.Contact")
	) {
		const contactElement = getContactFormElement(
			dataFieldCollection[0] as AnnotationFormElement,
			contextPath,
			getFormElementProps(dataFieldCollection[0], contextPath, formContainerProps, controller)
		);
		return [contactElement];
	}

	// Regular form element template handling
	let mappedFormElements: (Control | undefined)[] = dataFieldCollection.map((formElement) =>
		getFormElement(formElement, contextPath, formContainerProps, controller, slotElements)
	);
	mappedFormElements = mappedFormElements.filter((formElement) => formElement !== undefined);

	return mappedFormElements;
}

/**
 * Creates a UI5 FormElement control for the provided form element descriptor.
 * @param formElement Descriptor of the form element to render.
 * @param contextPath Binding context used to resolve annotation/model paths for the form elements.
 * @param formContainerProps FormContainer level properties used in generating the form elements.
 * @param controller
 * @param slotElements
 * @returns A `sap.ui.core.Control` representing the form element.
 */
function getFormElement(
	formElement: FormElement,
	contextPath: Context,
	formContainerProps: FormContainerProps,
	controller: PageController,
	slotElements: Control[]
): Control | undefined {
	const formElementProps = getFormElementProps(formElement, contextPath, formContainerProps, controller);

	let computedDataModelObject;
	let propertyPath: string | undefined;

	if (formElement.type === "Default") {
		const customFormElement = formElement as CustomFormElement;
		propertyPath = contextPath.getPath(customFormElement.propertyPath);
		computedDataModelObject = getInvolvedDataModelObjects(contextPath.getModel().createBindingContext(propertyPath)) as
			| DataModelObjectPath<EntitySet>
			| undefined;
	} else if (formElement.annotationPath) {
		computedDataModelObject = getInvolvedDataModelObjects(
			contextPath.getModel().createBindingContext(formElement.annotationPath ?? "")
		) as DataModelObjectPath<EntitySet> | undefined;
	}
	switch (formElement.type) {
		case "Annotation": {
			if (
				(formElement as AnnotationFormElement).connectedFields &&
				(formElement as AnnotationFormElement).connectedFields!.length > 0
			) {
				return getConnectedFieldsFormElement(
					formElement as AnnotationFormElement,
					contextPath,
					formElementProps,
					formContainerProps,
					controller
				);
			} else if (isMultiValueDataField(formElement, contextPath)) {
				return getMultiValueFieldFormElement(formElement, contextPath, formElementProps, formContainerProps, controller);
			} else if (
				(formElement as AnnotationFormElement).fieldGroupElements &&
				(formElement as AnnotationFormElement).fieldGroupElements!.length > 0
			) {
				return getFieldGroupFormElement(
					formElement as AnnotationFormElement,
					contextPath,
					formElementProps,
					formContainerProps,
					controller
				);
			} else {
				return getFieldFormElement(
					formElement,
					contextPath,
					formElementProps,
					formContainerProps,
					computedDataModelObject as DataModelObjectPath<DataFieldAbstractTypes | DataPointType | Property>,
					controller
				);
			}
			break;
		}
		case "Default": {
			const targetId = createFormElementId(controller, formContainerProps.id ?? "", formElement.id ?? "");
			const fragmentId = createFormElementId(controller, formContainerProps.id ?? "", formElement.key);
			return getCustomFormElement(targetId, formElement as CustomFormElement, formElementProps, contextPath, fragmentId);
			break;
		}
		default: {
			return getSlotColumn(formElement, slotElements);
			break;
		}
	}
}

/**
 * Helper function to create form element properties.
 * @param formElement The form element descriptor.
 * @param contextPath The binding context.
 * @param formContainerProps FormContainer level properties.
 * @param controller
 * @returns Form element properties object.
 */
function getFormElementProps(
	formElement: FormElement,
	contextPath: Context,
	formContainerProps: FormContainerProps,
	controller?: PageController
): FormElementProps {
	let computedDataModelObject;
	let propertyPath: string | undefined;

	if (formElement.type === "Default") {
		const customFormElement = formElement as CustomFormElement;
		propertyPath = contextPath.getPath(customFormElement.propertyPath);
		computedDataModelObject = getInvolvedDataModelObjects(contextPath.getModel().createBindingContext(propertyPath)) as
			| DataModelObjectPath<EntitySet>
			| undefined;
	} else if (formElement.annotationPath) {
		computedDataModelObject = getInvolvedDataModelObjects(
			contextPath.getModel().createBindingContext(formElement.annotationPath ?? "")
		) as DataModelObjectPath<EntitySet> | undefined;
	}

	// Priority: 1. Explicit non-Default manifest flexSettings, 2. UI.AdaptationHidden annotation, 3. Default file path
	// When flexSettings.designtime is "Default", it means "use default behavior" which includes checking UI.AdaptationHidden
	let designtime: string;
	if (formElement.flexSettings?.designtime && formElement.flexSettings.designtime !== "Default") {
		// Use explicit non-Default manifest setting
		designtime = formElement.flexSettings.designtime;
	} else {
		// No flexSettings OR explicit "Default" → use default logic (check annotation, then default file)
		designtime = computedDataModelObject?.targetObject?.annotations?.UI?.AdaptationHidden
			? "not-adaptable-tree"
			: "sap/fe/macros/form/FormElement.designtime";
	}
	const visibleExpression =
		(formElement as AnnotationFormElement).isPartOfPreview === true
			? getVisibleExpression(computedDataModelObject as DataModelObjectPath<DataFieldAbstractTypes | DataPointType | Property>)
			: "{= ${internal>showDetails} === true}";

	return {
		computedIdPrefix: formContainerProps.id
			? createFormElementId(controller, formContainerProps.id, "FormElement", formElement.key)
			: "",
		computedVhIdPrefix: createFormElementId(controller, formContainerProps.id!, "FieldValueHelp"),
		bindingString: FormHelper.generateBindingExpression(
			formContainerProps.macrodata.navigationPath,
			computedDataModelObject,
			formContainerProps.ibnMappingProperties
		),
		visibleExpression: visibleExpression,
		designtime: designtime
	};
}

/**
 * Determines if the given field is a multi-input field.
 * @param formElement The form element descriptor.
 * @param contextPath The context.
 * @returns True if the data field is a multi-input field, false otherwise.
 */
function isMultiValueDataField(formElement: FormElement, contextPath: Context): boolean {
	let isMultiValueFieldCondition = false;
	if (formElement.annotationPath) {
		const bindingContext = contextPath.getModel().createBindingContext(formElement.annotationPath);
		const valuePath = bindingContext.getObject()?.Value?.$Path;
		if (valuePath) {
			isMultiValueFieldCondition = isMultiValueField(enhanceDataModelPath(getInvolvedDataModelObjects(bindingContext), valuePath));
		}
	}
	return isMultiValueFieldCondition;
}

/**
 * Create controls for connected fields to be used in the form element.
 * @param formElement Parent form element descriptor.
 * @param connectedField Metadata describing the connected field.
 * @param index Index of the connected field in the collection.
 * @param total Total number of connected fields.
 * @param contextPath The binding context used for the field.
 * @param formContainerProps FormContainer level properties used in generating the form elements.
 * @param controller
 * @returns An array of controls representing the connected fields.
 */
function getConnectedField(
	formElement: FormElement,
	connectedField: ConnectedField,
	index: number,
	total: number,
	contextPath: Context,
	formContainerProps: FormContainerProps,
	controller: PageController
): Control[] {
	const model = contextPath.getModel();
	const tempName = connectedField.originalObject?.fullyQualifiedName;
	const path = tempName?.substring(tempName.lastIndexOf("/") + 1);
	const bindingContext = model.createBindingContext(formElement.annotationPath + "Target/$AnnotationPath/Data/" + path);

	// the id here had to be changed a bit in order to get the app working - needs to be revised if its still needed
	const propertyPath = (connectedField.originalObject as DataField)?.Value?.path || path || index.toString();
	const connectedFieldId = formContainerProps.id
		? StableIDHelper.generate([formContainerProps.id, "SemanticFormElement", formElement.key, propertyPath])
		: "";
	const vhIdPrefix = formContainerProps.id ? StableIDHelper.generate([formContainerProps.id, formElement.key, "FieldValueHelp"]) : "";
	const ariaLabelId = controller.createId(StableIDHelper.generate([formContainerProps.id, "AriaText", formElement.key, propertyPath]));
	const ariaLabelledBy = formContainerProps.id
		? [controller.createId(StableIDHelper.generate([formContainerProps.id, "SemanticFormElementLabel", formElement.key])), ariaLabelId]
		: "";

	const computedIdPrefix = controller ? controller.createId(connectedFieldId) || connectedFieldId : connectedFieldId;
	const computedVhIdPrefix = controller ? controller.createId(vhIdPrefix) || vhIdPrefix : vhIdPrefix;

	// we created the field instance because just returning it as tsx throws a _formatters error
	const fieldInstance = new Field({
		contextPath: contextPath.getPath(),
		metaPath: bindingContext.getPath(),
		idPrefix: computedIdPrefix,
		vhIdPrefix: computedVhIdPrefix,
		editMode: formContainerProps.displayMode === true ? "Display" : undefined,
		formatOptions: new FieldFormatOptions({
			displayMode: formElement.formatOptions?.displayMode,
			measureDisplayMode: formElement.formatOptions?.measureDisplayMode,
			showDate: formElement.formatOptions?.showDate,
			showTime: formElement.formatOptions?.showTime,
			showTimezone: formElement.formatOptions?.showTimezone,
			dateTimeStyle: formElement.formatOptions?.dateTimeStyle,
			reactiveAreaMode: formElement.formatOptions?.reactiveAreaMode,
			textLinesEdit: formElement.formatOptions?.textLinesEdit,
			textMaxLines: formElement.formatOptions?.textMaxLines,
			textMaxCharactersDisplay: formElement.formatOptions?.textMaxCharactersDisplay,
			textMaxLength: formElement.formatOptions?.textMaxLength,
			textExpandBehaviorDisplay: formElement.formatOptions?.textExpandBehaviorDisplay,
			textAlignMode: "Form",
			showEmptyIndicator: true,
			fieldEditStyle: formElement.formatOptions?.fieldEditStyle,
			radioButtonsHorizontalLayout: formElement.formatOptions?.radioButtonsHorizontalLayout,
			createAssociatedAriaLabel: true,
			imageFitType: formElement.formatOptions?.imageFitType,
			enableEnlargeImage: formElement.formatOptions?.enableEnlargeImage
		}),

		ariaLabelledBy: ariaLabelledBy,
		layoutData: new FlexItemData({ growFactor: "{= %{ui>/isEditable} ? 1 : 0}" })
	});

	const connectedFieldControls = [fieldInstance];
	if (index < total - 1) {
		const delimiter = CommonHelper.getDelimiter(connectedField.originalTemplate ?? "");
		connectedFieldControls.push(<Text text={delimiter} class="sapUiSmallMarginBeginEnd" width="100%" />);
	}
	return connectedFieldControls;
}

/**
 * Create an invisible text element for a connected field.
 * @param connectedField The connected field descriptor.
 * @param formContainerProps FormContainer level properties used in generating the form elements.
 * @param formElement The form element descriptor.
 * @param controller The page controller instance.
 * @returns An InvisibleText control or undefined if not applicable.
 */
function getInvisibleTextForConnectedField(
	connectedField: ConnectedField,
	formContainerProps: FormContainerProps,
	formElement: FormElement,
	controller: PageController
): InvisibleText | undefined {
	// if there is a label on the connected field, we create an invisible text for aria-labelledby for proper screen reading
	const connectedFieldPath = (connectedField.originalObject as DataField)?.Value?.path?.valueOf();
	const connectedFieldLabel = (connectedField.originalObject as DataField)?.Value?.$target?.annotations?.Common?.Label?.valueOf();

	if (formContainerProps.id && connectedFieldPath && connectedFieldLabel) {
		const ariaLabelId = controller.createId(
			StableIDHelper.generate([formContainerProps.id, "AriaText", formElement.key, connectedFieldPath])
		);
		return <InvisibleText text={connectedFieldLabel} id={ariaLabelId} />;
	}
}

/**
 * Create a UI5 FormElement for a connected fields annotation.
 * @param formElement The form element descriptor.
 * @param contextPath The binding context used for the connected fields.
 * @param formElementProps Form element properties.
 * @param formContainerProps FormContainer level properties used in generating the form elements.
 * @param controller
 * @returns A `sap.ui.layout.form.FormElement` representing the connected fields.
 */
function getConnectedFieldsFormElement(
	formElement: AnnotationFormElement,
	contextPath: Context,
	formElementProps: FormElementProps,
	formContainerProps: FormContainerProps,
	controller: PageController
): Control {
	const dataModelobjectForConnectedFields = getInvolvedDataModelObjects(
		contextPath.getModel().createBindingContext(formElement.annotationPath ?? "")
	);
	const targetObject = (dataModelobjectForConnectedFields.targetObject as DataFieldForAnnotation).Target
		.$target as AnnotationTerm<ConnectedFieldsTypeTypes>;

	const connectedFieldControls: Control[] = [];

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

	sortedConnectedFields.forEach((connectedField, fieldIndex) => {
		const invisibleText = getInvisibleTextForConnectedField(connectedField, formContainerProps, formElement, controller);
		if (invisibleText) {
			connectedFieldControls.push(invisibleText);
		}

		connectedFieldControls.push(
			...getConnectedField(
				formElement,
				connectedField,
				fieldIndex,
				sortedConnectedFields.length,
				contextPath,
				formContainerProps,
				controller
			)
		);
	});
	const formElementId = createFormElementId(controller, formContainerProps.id!, "SemanticFormElement", formElement.key);

	return (
		<UI5FormElement
			id={formElementId}
			visible={formElementProps.visibleExpression}
			binding={formElementProps.bindingString}
			dt:designtime={formElementProps.designtime}
		>
			{{
				label: (
					<Label
						text={targetObject?.Label ?? formElement.label}
						id={controller.createId(
							StableIDHelper.generate([formContainerProps.id!, "SemanticFormElementLabel", formElement.key])
						)}
					/>
				),
				fields: (
					<FieldWrapper>
						<HBox wrap="Wrap">{connectedFieldControls}</HBox>
					</FieldWrapper>
				)
			}}
		</UI5FormElement>
	);
}

/**
 * Create a UI5 FormElement for a multivalue field annotation.
 * @param formElement The form element descriptor.
 * @param contextPath The binding context used for the multivaluefield.
 * @param formElementProps Form element properties.
 * @param formContainerProps FormContainer level properties used in generating the form elements.
 * @param controller Optional page controller for ID generation.
 * @returns A `sap.ui.layout.form.FormElement` containing the MultiValueFieldBlock.
 */
function getMultiValueFieldFormElement(
	formElement: FormElement,
	contextPath: Context,
	formElementProps: FormElementProps,
	formContainerProps: FormContainerProps,
	controller: PageController
): Control {
	const multiValueFieldId = controller.createId(
		StableIDHelper.generate([formContainerProps.id!, "FormElement", formElement.key, "MultiValueField"])
	);
	const formElementId = formElementProps.computedIdPrefix || `FormElement_${formElement.key}`;

	return (
		<UI5FormElement
			id={formElementId}
			label={formElement.label}
			visible={formElementProps.visibleExpression}
			dt:designtime={formElementProps.designtime}
		>
			{{
				fields: (
					<MultiValueFieldBlock
						id={multiValueFieldId}
						contextPath={contextPath.getPath()}
						metaPath={formElement.annotationPath}
						vhIdPrefix={formElementProps.computedVhIdPrefix}
					>
						{{
							formatOptions: <FormatOptions showEmptyIndicator={true} />
						}}
					</MultiValueFieldBlock>
				)
			}}
		</UI5FormElement>
	);
}

/**
 * Create a Field control configured as a checkbox.
 * @param groupElement The data field metadata for the checkbox.
 * @param contextPath The binding context used for the field.
 * @param formElement Parent form element descriptor.
 * @param formElementProps Form element properties.
 * @param formContainerProps FormContainer level properties used in generating the form elements.
 * @param labelId The ID of the label that should be associated with the checkbox for accessibility.
 * @returns A Field configured for the checkbox use.
 */
function getCheckboxField(
	groupElement: DataFieldAbstractTypes,
	contextPath: Context,
	formElement: FormElement,
	formElementProps: FormElementProps,
	formContainerProps: FormContainerProps,
	labelId: string
): Control | undefined {
	const model = contextPath.getModel();
	const tempName = groupElement.fullyQualifiedName;
	const path = tempName?.substring(tempName.lastIndexOf("/") + 1);
	const bindingContext = model.createBindingContext(formElement.annotationPath + "Target/$AnnotationPath/Data/" + path);
	const groupElementDataModelObject = getInvolvedDataModelObjects<DataFieldAbstractTypes | DataPointType>(bindingContext);
	const computedIdPrefix = formContainerProps.id
		? StableIDHelper.generate([
				formContainerProps.id,
				"CheckboxGroup",
				formElement.key,
				(groupElementDataModelObject.targetObject as DataField | DataPointType)?.Value?.path
		  ])
		: "";

	if ((groupElementDataModelObject.targetObject as DataField | DataPointType)?.Value?.$target?.type !== "Edm.Boolean") {
		return undefined;
	}

	return new Field({
		contextPath: contextPath.getPath(),
		metaPath: bindingContext.getPath(),
		idPrefix: computedIdPrefix,
		vhIdPrefix: formElementProps.computedVhIdPrefix,
		ariaLabelledBy: [labelId],
		formatOptions: new FieldFormatOptions({
			isFieldGroupItem: true,
			textAlignMode: "Form"
		})
	});
}

/**
 * Create a UI5 FormElement for a checkbox field group.
 * @param formElement The form element descriptor.
 * @param contextPath The binding context used for the field.
 * @param formElementProps Form element properties.
 * @param formContainerProps FormContainer level properties used in generating the form elements.
 * @param controller Optional page controller for ID generation.
 * @returns A `sap.ui.layout.form.FormElement` representing the checkbox field group.
 */
function getFieldGroupFormElement(
	formElement: AnnotationFormElement,
	contextPath: Context,
	formElementProps: FormElementProps,
	formContainerProps: FormContainerProps,
	controller?: PageController
): Control {
	const id = formContainerProps.id
		? createFormElementId(controller, formContainerProps.id, "FieldGroupFormElement", formElement.key)
		: "";
	const labelId = formContainerProps.id
		? createFormElementId(controller, formContainerProps.id, "FieldGroupFormElementLabel", formElement.key)
		: "";

	const computedDataModelObject = getInvolvedDataModelObjects(
		contextPath.getModel().createBindingContext(formElement.annotationPath ?? "")
	) as DataModelObjectPath<DataFieldForAnnotation> | undefined;
	const targetObject = computedDataModelObject?.targetObject?.Target?.$target as FieldGroup | undefined;
	const requiredProperty = computedDataModelObject ? UIFormatters.getRequiredExpressionForFieldGroup(computedDataModelObject) : undefined;

	// Get the field group fully qualified name directly
	const fieldGroupFullyQualifiedName = targetObject?.fullyQualifiedName;

	// Get the raw (uncompiled) required expression for use in conditional bindings
	const requiredExpressionRaw = computedDataModelObject
		? and(pathInModel("ui>isEditable"), isRequiredExpression(computedDataModelObject.targetObject?.Target?.$target as FieldGroup))
		: undefined;

	// Calculate MessageStrip text and visibility expressions using extracted helper functions
	const messageStripText = getMessageStripTextExpression(fieldGroupFullyQualifiedName);
	const messageStripVisible = getMessageStripVisibilityExpression(fieldGroupFullyQualifiedName, requiredExpressionRaw);

	return (
		<UI5FormElement
			id={id}
			visible={formElementProps.visibleExpression}
			binding={formElementProps.bindingString}
			dt:designtime={formElementProps.designtime}
		>
			{{
				customData: fieldGroupFullyQualifiedName
					? [<CustomData key="fieldGroupName" value={fieldGroupFullyQualifiedName} />]
					: undefined,
				label: <Label text={targetObject?.Label ?? formElement.label} id={labelId} required={requiredProperty} />,
				fields: (
					<RequiredFlexBox {...({ fieldGroupName: fieldGroupFullyQualifiedName } as unknown as Record<string, unknown>)}>
						<VBox>
							<FlexBox
								direction={formElement.formatOptions?.fieldGroupHorizontalLayout === true ? "Row" : "Column"}
								wrap="Wrap"
							>
								{{
									items: (formElement.fieldGroupElements ?? []).map((groupElement) =>
										getCheckboxField(
											groupElement,
											contextPath,
											formElement,
											formElementProps,
											formContainerProps,
											labelId
										)
									)
								}}
							</FlexBox>
							<MessageStrip
								text={messageStripText}
								visible={messageStripVisible}
								showIcon={true}
								showCloseButton={false}
								enableFormattedText={true}
								type="Error"
								class={"sapUiTinyMarginTop"}
							/>
						</VBox>
					</RequiredFlexBox>
				)
			}}
		</UI5FormElement>
	);
}

/**
 * Create a UI5 FormElement for a custom form element that loads a fragment.
 * @param formElementId The ID to assign to the form element.
 * @param formElement The custom form element descriptor.
 * @param formElementProps Form element properties.
 * @param contextPath Binding context used to resolve the property path.
 * @param fragmentId The ID to use for the fragment loading.
 * @returns A `sap.ui.layout.form.FormElement` that wraps the custom fragment inside the CustomFormElement.
 */
function getCustomFormElement(
	formElementId: string,
	formElement: CustomFormElement,
	formElementProps: FormElementProps,
	contextPath: Context,
	fragmentId: string
): Control {
	return (
		<UI5FormElement
			dt:designtime={formElementProps.designtime}
			id={formElementId}
			label={formElement.label}
			visible={formElement.visible}
			binding={formElementProps.bindingString}
		>
			{{
				fields: (
					<MacroCustomFormElement
						metaPath={formElement.propertyPath}
						fragmentId={fragmentId}
						fragmentName={formElement.template}
						contextPath={contextPath.getPath()}
						formElementKey={fragmentId}
					></MacroCustomFormElement>
				)
			}}
		</UI5FormElement>
	);
}

/**
 * Create a slot column control used for default slot-based content.
 * @param formElement Descriptor that provides the slot key (used as slot name).
 * @param slotElements
 * @returns A slot element with the appropriate name attribute.
 */
function getSlotColumn(formElement: FormElement, slotElements: Control[]): Control | undefined {
	return slotElements.find((slotElement) => {
		const slotIdParts = slotElement.getId().split("--");
		const id = slotIdParts[slotIdParts.length - 1];
		return id === formElement.key.split("InlineXML_")[1];
	});
}

/**
 * Generates the template for a form element representing a field.
 * @param formElement The form element descriptor.
 * @param contextPath The binding context used for the field.
 * @param formElementProps The properties for the form element.
 * @param formContainerProps FormContainer level properties used in generating the form elements.
 * @param computedDataModelObject The computed data model object path.
 * @param controller The page controller instance.
 * @returns A `sap.ui.layout.form.FormElement` containing a Field control.
 */
function getFieldFormElement(
	formElement: FormElement,
	contextPath: Context,
	formElementProps: FormElementProps,
	formContainerProps: FormContainerProps,
	computedDataModelObject?: DataModelObjectPath<DataFieldAbstractTypes | DataPointType | Property>,
	controller?: PageController
): Control {
	// this is temporary until the id generation is harmonized throughout the file
	const elementId = formElementProps.computedIdPrefix || `FormElement_${formElement.key}`;

	let metaPath = formElement.key;

	if (computedDataModelObject) {
		try {
			const valueDataModelPath = getDataModelObjectPathForValue(computedDataModelObject);
			if (valueDataModelPath && valueDataModelPath.targetObject) {
				metaPath = valueDataModelPath.targetObject.name;
			}
		} catch (e) {
			metaPath = formElement.key;
		}
	}

	const fieldInstance = new Field({
		contextPath: contextPath.getPath(),
		metaPath: formElement.annotationPath || metaPath,
		idPrefix: controller ? controller.createId(formElementProps.computedIdPrefix ?? "") : formElementProps.computedIdPrefix,
		vhIdPrefix: formElementProps.computedVhIdPrefix,
		editMode: formElement.readOnly === true ? "Display" : undefined,
		semanticObject: (formElement as AnnotationFormElement).semanticObject,
		formatOptions: new FieldFormatOptions({
			displayMode: formElement.formatOptions?.displayMode,
			measureDisplayMode: formElement.formatOptions?.measureDisplayMode,
			showDate: formElement.formatOptions?.showDate,
			showTime: formElement.formatOptions?.showTime,
			showTimezone: formElement.formatOptions?.showTimezone,
			dateTimeStyle: formElement.formatOptions?.dateTimeStyle,
			reactiveAreaMode: formElement.formatOptions?.reactiveAreaMode,
			textLinesEdit: formElement.formatOptions?.textLinesEdit,
			textMaxLines: formElement.formatOptions?.textMaxLines,
			textMaxLength: formElement.formatOptions?.textMaxLength,
			textMaxCharactersDisplay: formElement.formatOptions?.textMaxCharactersDisplay,
			textExpandBehaviorDisplay: formElement.formatOptions?.textExpandBehaviorDisplay,
			textAlignMode: "Form",
			showEmptyIndicator: true,
			fieldEditStyle: formElement.formatOptions?.fieldEditStyle,
			radioButtonsHorizontalLayout: formElement.formatOptions?.radioButtonsHorizontalLayout,
			dateTimePattern: formElement.formatOptions?.pattern,
			useRadioButtonsForBoolean: formElement.formatOptions?.useRadioButtonsForBoolean,
			imageFitType: formElement.formatOptions?.imageFitType,
			enableEnlargeImage: formElement.formatOptions?.enableEnlargeImage
		})
	});

	return (
		<UI5FormElement
			id={controller ? controller.createId(elementId) : elementId}
			label={formElement.label}
			visible={formElementProps.visibleExpression}
			dt:designtime={formElementProps.designtime}
			binding={formElementProps.bindingString}
		>
			{{
				fields: fieldInstance
			}}
		</UI5FormElement>
	);
}

/**
 * Create a UI5 FormElement for the DataPoint annotation.
 * @param formElement The form element descriptor.
 * @param contextPath Binding context for the field.
 * @param formElementProps Form element properties.
 * @param formContainerProps FormContainer level properties used in generating the form elements.
 * @returns A `sap.ui.layout.form.FormElement` representing the DataPoint.
 */
function getDataPointFormElement(
	formElement: AnnotationFormElement,
	contextPath: Context,
	formElementProps: FormElementProps,
	formContainerProps: FormContainerProps
): Control {
	//TODO: We need to revisit the editable scenario and id generation here
	/* 	const isEditableHeader = formElement.id?.includes("HeaderFacet::FormContainer") === true;
	let formElementId = "undefined";
	if (formElement.id) {
		if (isEditableHeader) {
				formElementId = `${formElement.id}::FormElement`;
				idPrefix = `${formElement.id}::FormElement`;
		} else {
				formElementId = `${StableIDHelper.generate([formElement.id, "FormElement", formElement.dataFieldCollection[0].key])}`;
				idPrefix = `${StableIDHelper.generate([formElement.id, "FormElement", formElement.dataFieldCollection[0].key])}`;
		}
	} */

	const fieldInstance = new Field({
		contextPath: contextPath.getPath(),
		metaPath: formElement.annotationPath,
		id: `${formElementProps.computedIdPrefix}::Field`,
		idPrefix: formElementProps.computedIdPrefix,
		vhIdPrefix: formElementProps.computedVhIdPrefix,
		editMode: formContainerProps.displayMode === true ? "Display" : undefined,
		formatOptions: new FieldFormatOptions({
			textAlignMode: "Form",
			showEmptyIndicator: true
		})
	});

	return (
		<UI5FormElement
			id={formElementProps.computedIdPrefix || `FormElement_${formElement.key}`}
			label={formElement.label}
			visible={formElementProps.visibleExpression}
			dt:designtime={formElementProps.designtime}
			binding={formElementProps.bindingString}
		>
			{{
				fields: fieldInstance
			}}
		</UI5FormElement>
	);
}

/**
 * Create a UI5 FormElement for the Communication.Contact annotation.
 * @param formElement The form element descriptor.
 * @param contextPath Binding context used for the contact.
 * @param formElementProps Form element properties.
 * @returns A `sap.ui.layout.form.FormElement` representing the Contact.
 */
function getContactFormElement(formElement: AnnotationFormElement, contextPath: Context, formElementProps: FormElementProps): Control {
	const contactInstance = new Contact({
		contextPath: contextPath.getPath(),
		metaPath: formElement.annotationPath,
		idPrefix: formElementProps.computedIdPrefix
	});

	return (
		<UI5FormElement
			id={formElementProps.computedIdPrefix || `FormElement_${formElement.key}`}
			visible={formElementProps.visibleExpression}
			dt:designtime={formElementProps.designtime}
			binding={formElementProps.bindingString}
		>
			{{
				label: (
					<Label text={formElement.label}>
						{{
							layoutData: <ColumnElementData cellsLarge="12" />
						}}
					</Label>
				),
				fields: contactInstance
			}}
		</UI5FormElement>
	);
}
