import type { Property } from "@sap-ux/vocabularies-types";
import type { DataFieldAbstractTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import JSTokenizer from "sap/base/util/JSTokenizer";
import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, EDM_TYPE_MAPPING, getFiscalType, pathInModel } from "sap/fe/base/BindingToolkit";
import CommonUtils from "sap/fe/core/CommonUtils";
import FilterRestrictions from "sap/fe/core/converters/controls/Common/filter/FilterRestrictions";
import { getTypeConfig } from "sap/fe/core/converters/controls/Common/table/Columns";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { getContextRelativeTargetObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { getProperty } from "sap/fe/core/templating/PropertyFormatters";
import type { ComputedAnnotationInterface, MetaModelContext } from "sap/fe/core/templating/UIFormatters";
import FiscalDate from "sap/fe/core/type/FiscalDate";
import CommonHelper from "sap/fe/macros/CommonHelper";
import BindingInfo from "sap/ui/base/BindingInfo";
import AnnotationHelper from "sap/ui/model/odata/v4/AnnotationHelper";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";

/**
 * Checks whether the property with the given path is required in the filter for the given annotation interface.
 * @param path Property path - ignored when provided as string
 * @param annotationInterface Structure returned by the ODataMetaModel when using the @@ operator in XML templates
 * @returns The value true if the given input is requird for filtering
 */
export function isRequiredInFilter(path: string | unknown, annotationInterface: ComputedAnnotationInterface): boolean {
	const model = annotationInterface.context.getModel() as ODataMetaModel;
	const propertyPath = annotationInterface.context.getPath();
	const propertyLocationPath = CommonHelper.getLocationForPropertyPath(model, propertyPath);

	let property: string;
	let required = model.getObject(`${propertyLocationPath}/@com.sap.vocabularies.Common.v1.ResultContext`);

	if (!required) {
		if (typeof path === "string") {
			property = path;
		} else {
			property = model.getObject(`${propertyPath}@sapui.name`);
		}
		const dataModel = MetaModelConverter.getInvolvedDataModelObjects(model.getContext(propertyLocationPath));
		const oFR = FilterRestrictions.getFilterRestrictionsByDataModel(dataModel as DataModelObjectPath<PageContextPathTarget>);
		required = oFR?.RequiredProperties?.includes(property);
	}
	return required;
}

/**
 * Checks the maximum number of conditions for the given path and given annotation interface.
 * @param path Property path - ignored when provided as string
 * @param annotationInterface Structure returned by the ODataMetaModel when using the @@ operator in XML templates
 * @returns The number of maximum allowed conditions or -1 if there is no limit.
 */
export function maxConditions(path: string | unknown, annotationInterface: ComputedAnnotationInterface): number {
	const model = annotationInterface.context.getModel() as ODataMetaModel;
	const propertyPath = annotationInterface.context.getPath();
	const propertyLocationPath = CommonHelper.getLocationForPropertyPath(model, propertyPath);

	let property: string;
	let max = -1;

	if (model.getObject(`${propertyLocationPath}/@com.sap.vocabularies.Common.v1.ResultContext`) === true) {
		return 1;
	}

	if (typeof path === "string") {
		property = path;
	} else {
		property = model.getObject(`${propertyPath}@sapui.name`);
	}
	const dataModel = MetaModelConverter.getInvolvedDataModelObjects(model.getContext(propertyLocationPath));
	const filterRestrictions = FilterRestrictions.getFilterRestrictionsByDataModel(dataModel as DataModelObjectPath<PageContextPathTarget>);
	let propertyInfo = model.getObject(`${propertyLocationPath}/${property}`);
	if (!propertyInfo) {
		propertyInfo = model.getObject(propertyPath);
	}
	if (propertyInfo.$Type === "Edm.Boolean") {
		max = 1;
	} else if (filterRestrictions?.FilterAllowedExpressions?.[property]) {
		const allowedExpression = CommonUtils.getSpecificAllowedExpression(filterRestrictions.FilterAllowedExpressions[property]);
		if (allowedExpression === "SingleValue" || allowedExpression === "SingleRange") {
			max = 1;
		}
	}
	return max;
}

/**
 * To Create binding for mdc:filterfield conditions.
 * @param dataModelObjectPath Data Model Object path to filter field property
 * @returns Expression binding for conditions for the field
 */
export function getConditionsBinding(dataModelObjectPath: DataModelObjectPath<Property>): CompiledBindingToolkitExpression {
	const relativePropertyPath = getContextRelativeTargetObjectPath(dataModelObjectPath, false, true);
	return compileExpression(pathInModel(`/conditions/${relativePropertyPath}`, "$filters"));
}

/**
 * Get the contraints string for the given property and interface.
 * @param context
 * @param annotationInterface Structure returned by the ODataMetaModel when using the @@ operator in XML templates
 * @param isRuntime
 * @returns Constraints as string if available otherwise undefined
 */
export function constraints(
	context: MetaModelContext,
	annotationInterface: ComputedAnnotationInterface,
	isRuntime?: boolean
): string | undefined {
	const value = (AnnotationHelper.format(context, annotationInterface) as string) || "";
	const matches = value.match(/constraints:.*?({.*?})/);
	const propertyConstraints = JSTokenizer.parseJS(matches?.[1] || "{}");
	// Workaround. Add "V4: true" to DateTimeOffset constraints. AnnotationHelper is not aware of this flag.
	if (value.includes("sap.ui.model.odata.type.DateTimeOffset")) {
		// Ensure that V4:true is  there. With the openUI5 BLI: CPOUI5ODATAV4-2131 the constraints are already include 'V4':true
		propertyConstraints.V4 = true;
	}
	// Remove {nullable:false} from the constraints as it prevents from having an empty filter field
	// in the case of a single-value filter
	if (propertyConstraints.nullable === false) {
		delete propertyConstraints.nullable;
	}
	// Unfortunately, JSTokenizer does not provide a method to stringify (reversing parseJS).
	// Using JSON.stringify and replacing double quotes with single quotes works at least in the known simple cases (flat objects not containing quotes in property names or values).
	// If special cases should occur in future, this might need some adoption (depending on the required string format in that case).
	if (isRuntime === true) {
		return Object.keys(propertyConstraints).length === 0 ? undefined : propertyConstraints;
	}
	return Object.keys(propertyConstraints).length === 0 ? undefined : JSON.stringify(propertyConstraints).replaceAll('"', "'");
}

/**
 * Get the format options as string for the given path and given annotation interface.
 * @param context
 * @param annotationInterface Structure returned by the ODataMetaModel when using the @@ operator in XML templates
 * @param isRuntime
 * @returns Format options as string if available otherwise undefined
 */
export function formatOptions(
	context: MetaModelContext,
	annotationInterface: ComputedAnnotationInterface,
	isRuntime?: boolean
): string | undefined {
	// as the Annotation helper always returns "parseKeepsEmptyString: true" we need to prevent this in case a property (of type string) is nullable
	// Filling annotationInterface.arguments with an array where the first parameter is null, and the second contains the "expected"
	// parseKeepsEmptyString value follows a proposal from the model colleagues to "overrule" the behavior of the AnnotationHelper
	if (context.$Type === "Edm.String") {
		if (!context.hasOwnProperty("$Nullable") || context.$Nullable === true) {
			annotationInterface.arguments = [null, { parseKeepsEmptyString: false }];
		}
		const fiscalType = getFiscalType(getProperty(context, annotationInterface));
		if (fiscalType) {
			if (!annotationInterface.arguments) {
				annotationInterface.arguments = [null, {}];
			}
			(annotationInterface.arguments[1] as { fiscalType?: string }).fiscalType = fiscalType;
		}
	} else {
		const typeFormatOptions = getTypeConfig(context as unknown as DataFieldAbstractTypes, context.$Type)?.formatOptions;
		annotationInterface.arguments = [null, typeFormatOptions];
	}
	const value = (AnnotationHelper.format(context, annotationInterface) as string) || "";
	if (isRuntime === true && value) {
		const bindingInfo = BindingInfo.parse(value);
		return bindingInfo?.type?.oFormatOptions;
	}
	return value.match(/formatOptions:.*?({.*?})/)?.[1] || undefined;
}

/**
 * Get the data type for a given property.
 * @param property Property information
 * @returns Type as string
 */
export function getDataType(property: Property): string {
	if (property.type === "Edm.String") {
		const fiscalType = getFiscalType(property);
		if (fiscalType) {
			return "sap.fe.core.type.FiscalDate";
		}
	}
	const typeMapping = EDM_TYPE_MAPPING[property.type];
	return typeMapping ? typeMapping.type : property.type;
}

/**
 * Get the placeholder of properties of type Edm.String.
 * @param property Property information
 * @returns Placeholder as string if available otherwise undefined
 */
export function getPlaceholder(property: Property): string | undefined {
	if (property.type === "Edm.String") {
		const fiscalType = getFiscalType(property);
		if (fiscalType) {
			return new FiscalDate({ fiscalType }, {}).getPattern();
		}
	}
	return undefined;
}
