import type { PathAnnotationExpression, Property, PropertyAnnotationValue } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import type { BindingToolkitExpression, CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import {
	compileExpression,
	formatResult,
	formatWithTypeInformation,
	getExpressionFromAnnotation,
	pathInModel
} from "sap/fe/base/BindingToolkit";
import valueFormatters from "sap/fe/core/formatters/ValueFormatter";
import { isPathAnnotationExpression, isPropertyPathExpression } from "sap/fe/core/helpers/TypeGuards";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { enhanceDataModelPath, getContextRelativeTargetObjectPath, getRelativePaths } from "sap/fe/core/templating/DataModelPathHelper";
import type * as DisplayModeFormatter from "sap/fe/core/templating/DisplayModeFormatter";
import * as UIFormatters from "sap/fe/core/templating/UIFormatters";
import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import { isReferencePropertyStaticallyHidden } from "../converters/helpers/DataFieldHelper";
export type DisplayMode = DisplayModeFormatter.DisplayMode;

// Import-export methods related to the common annotations used by the converter to use them in the templating through the Common Formatters.

/**
 * Process binding expressions and create description/value expressions for JSON and OData models.
 * @param propertyDefinition The property definition for type information
 * @param propertyBindingExpression The main property binding expression
 * @param descriptionBinding The description binding for JSON model handling
 * @param valueBinding The value binding expression for JSON model handling
 * @param relativeLocation The relative location for annotation processing
 * @param commonText The common text annotation
 * @returns Object containing processed description and value expressions
 */
const processBindingsAndExpressions = function (
	propertyDefinition: Property | undefined,
	propertyBindingExpression: BindingToolkitExpression<string>,
	descriptionBinding: BindingToolkitExpression<string> | string | object | undefined,
	valueBinding: BindingToolkitExpression<string> | string | object | undefined,
	relativeLocation: string[],
	commonText: PropertyAnnotationValue<string> | undefined
): { descriptionExpression: BindingToolkitExpression<string> | undefined; valueExpression: BindingToolkitExpression<string> } {
	const processBinding = (
		binding: BindingToolkitExpression<string> | string | object | undefined
	): BindingToolkitExpression<string> | undefined => {
		if (!binding) return undefined;

		try {
			const bindingObj = binding as PropertyBindingInfo;
			if (bindingObj.path !== undefined) {
				const pathExpression = pathInModel(bindingObj.path, bindingObj.model);
				return propertyDefinition ? formatWithTypeInformation(propertyDefinition, pathExpression) : pathExpression;
			}
		} catch (error) {
			Log.error("Error processing binding in CommonFormatters.processBinding:", error as string);
		}

		return undefined;
	};

	let descriptionExpression: BindingToolkitExpression<string> | undefined;
	if (descriptionBinding) {
		descriptionExpression = processBinding(descriptionBinding);
	} else if (commonText) {
		descriptionExpression = getExpressionFromAnnotation(commonText, relativeLocation);
	}

	let valueExpression: BindingToolkitExpression<string> = propertyBindingExpression;
	if (valueBinding) {
		valueExpression = processBinding(valueBinding) || propertyBindingExpression;
	}

	return { descriptionExpression, valueExpression };
};

/**
 * Retrieves the expressionBinding created out of a binding expression.
 * @param expression The expression which needs to be compiled
 * @returns The expression-binding string
 */
export const getExpressionBinding = function (expression: BindingToolkitExpression<unknown>): CompiledBindingToolkitExpression {
	return compileExpression(expression);
};
export const getBindingWithTextArrangement = function (
	propertyDataModelPath: DataModelObjectPath<Property>,
	propertyBindingExpression: BindingToolkitExpression<string>,
	fieldFormatOptions?: { displayMode?: DisplayMode },
	customFormatter?: string,
	descriptionBinding?: BindingToolkitExpression<string> | string | object,
	valueBinding?: BindingToolkitExpression<string> | string | object
): BindingToolkitExpression<string> {
	const targetDisplayModeOverride = fieldFormatOptions?.displayMode;
	let outExpression = propertyBindingExpression;
	const propertyDefinition = isPropertyPathExpression(propertyDataModelPath.targetObject)
		? (propertyDataModelPath.targetObject.$target as Property)
		: (propertyDataModelPath.targetObject as Property);
	const targetDisplayMode = targetDisplayModeOverride || UIFormatters.getDisplayMode(propertyDataModelPath);
	const commonText = propertyDefinition?.annotations?.Common?.Text;
	const relativeLocation = getRelativePaths(propertyDataModelPath);
	const formatter = customFormatter || valueFormatters.formatWithBrackets;
	propertyBindingExpression =
		(propertyDefinition && formatWithTypeInformation(propertyDefinition, propertyBindingExpression)) || propertyBindingExpression;
	const { descriptionExpression, valueExpression } = processBindingsAndExpressions(
		propertyDefinition,
		propertyBindingExpression,
		descriptionBinding,
		valueBinding,
		relativeLocation,
		commonText as PropertyAnnotationValue<string> | undefined
	);

	outExpression = valueBinding ? valueExpression : propertyBindingExpression;

	if (targetDisplayMode !== "Value" && descriptionExpression) {
		switch (targetDisplayMode) {
			case "Description":
				outExpression = descriptionExpression;
				break;
			case "DescriptionValue":
				outExpression = formatResult([descriptionExpression, valueExpression], formatter);
				break;
			case "ValueDescription":
				outExpression = formatResult([valueExpression, descriptionExpression], formatter);
				break;
		}
	}
	return outExpression;
};

export const getBindingWithText = function (
	targetDataModelPath: DataModelObjectPath<Property | PathAnnotationExpression<Property>>,
	customFormatter?: string
): CompiledBindingToolkitExpression {
	let propertyDataModelPath: DataModelObjectPath<Property>;
	if (isPathAnnotationExpression<Property>(targetDataModelPath?.targetObject)) {
		propertyDataModelPath = enhanceDataModelPath<Property>(targetDataModelPath, targetDataModelPath.targetObject?.path);
	} else {
		propertyDataModelPath = targetDataModelPath as DataModelObjectPath<Property>;
	}
	const propertyDefinition = propertyDataModelPath.targetObject as Property;

	let propertyBindingExpression = pathInModel(
		getContextRelativeTargetObjectPath(propertyDataModelPath)
	) as BindingToolkitExpression<string>;

	propertyBindingExpression = formatWithTypeInformation(propertyDefinition, propertyBindingExpression, true);
	const textArrangementBinding = getBindingWithTextArrangement(propertyDataModelPath, propertyBindingExpression, {}, customFormatter);
	return ((propertyDefinition.annotations.UI &&
		!isReferencePropertyStaticallyHidden(propertyDefinition.annotations.UI.DataFieldDefault) &&
		compileExpression(textArrangementBinding)) ||
		undefined) as CompiledBindingToolkitExpression;
};
