import type { DataFieldTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { CompiledBindingToolkitExpression, ExpressionOrPrimitive } from "sap/fe/base/BindingToolkit";
import { compileExpression, getExpressionFromAnnotation, ifElse } from "sap/fe/base/BindingToolkit";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import AvatarShape from "sap/m/AvatarShape";
import type ConverterContext from "../../ConverterContext";

export type Avatar = {
	src?: CompiledBindingToolkitExpression;
	initials: CompiledBindingToolkitExpression;
	fallbackIcon?: CompiledBindingToolkitExpression;
	displayShape: CompiledBindingToolkitExpression;
	imageFitType?: CompiledBindingToolkitExpression;
	lightBoxTitle?: CompiledBindingToolkitExpression;
	lightBoxSubtitle?: CompiledBindingToolkitExpression;
};

const isNaturalPersonExpression = (converterContext: ConverterContext<PageContextPathTarget>): ExpressionOrPrimitive<boolean> => {
	return getExpressionFromAnnotation(converterContext.getEntityType().annotations.Common?.IsNaturalPerson);
};

const compileAvatarShape = (expression: ExpressionOrPrimitive<boolean>): CompiledBindingToolkitExpression => {
	return compileExpression(ifElse(expression, AvatarShape.Circle, AvatarShape.Square));
};

// The shape of the Avatar depends upon whether the entity instance represents a natural person.
// This can depend upon a property in the entity. Unlike the shape of an avatar defined in a field, it
// doesn't make sense to make the image at the object page header dependent upon the property containg
// the image or imageURL.
const compileFallBackIcon = (expression: ExpressionOrPrimitive<boolean>): CompiledBindingToolkitExpression => {
	return compileExpression(ifElse(expression, "sap-icon://person-placeholder", "sap-icon://product"));
};

const getFallBackIcon = (converterContext: ConverterContext<PageContextPathTarget>): CompiledBindingToolkitExpression | undefined => {
	const headerInfo = converterContext.getEntityType().annotations?.UI?.HeaderInfo;
	if (!headerInfo || (headerInfo && !headerInfo.ImageUrl && !headerInfo.TypeImageUrl)) {
		return undefined;
	}
	if (headerInfo.ImageUrl && headerInfo.TypeImageUrl) {
		return compileExpression(getExpressionFromAnnotation(headerInfo.TypeImageUrl));
	}
	return compileFallBackIcon(isNaturalPersonExpression(converterContext));
};

const getSource = (converterContext: ConverterContext<PageContextPathTarget>): CompiledBindingToolkitExpression | undefined => {
	const headerInfo = converterContext.getEntityType().annotations?.UI?.HeaderInfo;
	if (!headerInfo || !(headerInfo.ImageUrl || headerInfo.TypeImageUrl)) {
		return undefined;
	}
	return compileExpression(getExpressionFromAnnotation(headerInfo.ImageUrl || headerInfo.TypeImageUrl));
};

const getLightBoxTitle = (converterContext: ConverterContext<PageContextPathTarget>): CompiledBindingToolkitExpression | undefined => {
	const headerInfo = converterContext.getEntityType().annotations?.UI?.HeaderInfo;
	if (!headerInfo?.Title) {
		return undefined;
	}
	// Use the title value from HeaderInfo
	return compileExpression(getExpressionFromAnnotation((headerInfo.Title as DataFieldTypes).Value));
};

const getLightBoxSubtitle = (converterContext: ConverterContext<PageContextPathTarget>): CompiledBindingToolkitExpression | undefined => {
	const headerInfo = converterContext.getEntityType().annotations?.UI?.HeaderInfo;
	if (!headerInfo?.Description) {
		return undefined;
	}
	// Use the description value from HeaderInfo
	return compileExpression(getExpressionFromAnnotation((headerInfo.Description as DataFieldTypes).Value));
};

export const getAvatar = (converterContext: ConverterContext<PageContextPathTarget>): Avatar | undefined => {
	const headerInfo = converterContext.getEntityType().annotations?.UI?.HeaderInfo;
	const oSource = headerInfo && (headerInfo.ImageUrl || headerInfo.TypeImageUrl || headerInfo.Initials);
	if (!oSource) {
		return undefined;
	}
	const manifestImageFitType = converterContext.getManifestWrapper().getHeaderAvatar().imageFitType;
	return {
		src: getSource(converterContext),
		initials: compileExpression(getExpressionFromAnnotation(headerInfo?.Initials, [], "")),
		fallbackIcon: getFallBackIcon(converterContext),
		displayShape: compileAvatarShape(isNaturalPersonExpression(converterContext)),
		lightBoxTitle: getLightBoxTitle(converterContext),
		lightBoxSubtitle: getLightBoxSubtitle(converterContext),
		...(manifestImageFitType !== undefined && { imageFitType: compileExpression(manifestImageFitType) })
	};
};
