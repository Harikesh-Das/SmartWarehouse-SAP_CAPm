import type { EntityType } from "@sap-ux/vocabularies-types";
import type { FacetTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { BindingToolkitExpression, CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import {
	and,
	compileExpression,
	constant,
	equal,
	getExpressionFromAnnotation,
	ifElse,
	isConstant,
	not,
	or,
	pathInModel,
	resolveBindingString
} from "sap/fe/base/BindingToolkit";
import type { BaseAction, CombinedAction, CustomAction, OverrideTypeAction } from "sap/fe/core/converters/controls/Common/Action";
import {
	addSeparators,
	getActionsFromManifest,
	getAnnotationMenuActionItems,
	getMatchingManifestAction,
	getVisibilityEnablementMenuActions,
	prepareMenuActions,
	removeDuplicateActions
} from "sap/fe/core/converters/controls/Common/Action";
import type { TableVisualization } from "sap/fe/core/converters/controls/Common/Table";
import {
	getEditButtonEnabledExpression,
	getFooterDefaultActions,
	getHeaderDefaultActions,
	getHiddenHeaderActions
} from "sap/fe/core/converters/objectPage/HeaderAndFooterAction";
import ActionUtilities from "sap/fe/core/helpers/ActionUtilities";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { UI, singletonPathVisitor } from "../../helpers/BindingHelper";
import type { EnvironmentCapabilities } from "../../services/EnvironmentServiceFactory";
import type ConverterContext from "../ConverterContext";
import type { FacetsControlConfiguration, ManifestSection, ManifestSubSection, TransportSelectionDefinition } from "../ManifestSettings";
import { FlexDesignTimeType, TemplateType, VisualizationType } from "../ManifestSettings";
import type ManifestWrapper from "../ManifestWrapper";
import type { PageContextPathTarget, PageDefinition } from "../TemplateConverter";
import { getActionOverrideConfig } from "../controls/Common/Action";
import type { Avatar } from "../controls/ObjectPage/Avatar";
import { getAvatar } from "../controls/ObjectPage/Avatar";
import type { ObjectPageHeaderFacet } from "../controls/ObjectPage/HeaderFacet";
import { getHeaderFacetsFromAnnotations, getHeaderFacetsFromManifest } from "../controls/ObjectPage/HeaderFacet";
import type {
	CustomObjectPageSection,
	DataVisualizationSubSection,
	FormSubSection,
	MixedSubSection,
	ObjectPageSection,
	ObjectPageSubSection
} from "../controls/ObjectPage/SubSection";
import {
	SubSectionType,
	createCustomHeaderFacetSubSections,
	createCustomSubSections,
	createSubSections
} from "../controls/ObjectPage/SubSection";
import type { ConfigurableRecord, Position } from "../helpers/ConfigurableObject";
import { OverrideType, Placement, insertCustomElements } from "../helpers/ConfigurableObject";
import { getCustomSectionID, getEditableHeaderSectionID, getSectionID } from "../helpers/ID";

export type ObjectPageDefinition = PageDefinition & {
	header: {
		visible: boolean;
		section?: ObjectPageSection;
		facets: ObjectPageHeaderFacet[];
		aiNotice?: AiNoticeConfiguration;
		actions: BaseAction[];
		/**
		 * References to header actions that are emphasized when rendered.
		 * This array supports the cascade priority pattern: when multiple actions are marked as
		 * emphasized, only the first visible action receives emphasis. Each action may have an
		 * "EmphasizedFirst" clone that ensures correct positioning even when the original action's
		 * visibility changes dynamically.
		 */
		emphasizedFirstActions?: BaseAction[];
		easyFillVisible: CompiledBindingToolkitExpression;
		showContent: CompiledBindingToolkitExpression;
		hasContent: boolean;
		avatar?: Avatar;
		title: {
			expandedImageVisible: CompiledBindingToolkitExpression;
		};
	};
	sections: ObjectPageSection[];
	footerActions: BaseAction[];
	headerCommandActions: Record<string, BaseAction>;
	footerCommandActions: Record<string, BaseAction>;
	isDraftEnabled: boolean;

	/**
	 * Runtime expression indicating whether the footer action bar is effectively shown.
	 * Used to avoid reordering header actions permanently when the header must only be emphasized if the footer is hidden.
	 */
	footerActionsVisible?: CompiledBindingToolkitExpression;
	showAnchorBar: boolean;
	useIconTabBar: boolean;
	transportSelection?: TransportSelectionDefinition;
	disableObjectPageRequestOptimization: boolean;
	additionalProperties?: string[];
};

type AiNoticeConfiguration = {
	contentText?: string;
	visible?: CompiledBindingToolkitExpression;
	contentFragmentName?: string;
	expandedHeadingId: string;
	defaultHeadingId: string;
};

const getSectionKey = (facetDefinition: FacetTypes, fallback: string): string => {
	return facetDefinition.ID?.toString() || facetDefinition.Label?.toString() || fallback;
};

/**
 * Creates a section that represents the editable header part; it is only visible in edit mode.
 * @param converterContext The converter context
 * @param allHeaderFacets The converter context
 * @param disableObjectPageRequestOptimization Flag to disable request optimization for the object page
 * @returns The section representing the editable header parts
 */
export function createEditableHeaderSection(
	converterContext: ConverterContext<PageContextPathTarget>,
	allHeaderFacets: ObjectPageHeaderFacet[],
	disableObjectPageRequestOptimization = true
): ObjectPageSection {
	const editableHeaderSectionID = getEditableHeaderSectionID();
	const headerFacets = converterContext.getEntityType().annotations?.UI?.HeaderFacets;
	const headerfacetSubSections = headerFacets ? createSubSections(headerFacets, converterContext, true) : [];
	const customHeaderFacetSubSections = createCustomHeaderFacetSubSections(converterContext, disableObjectPageRequestOptimization);
	let allHeaderFacetsSubSections: ObjectPageSubSection[] = [];
	if (customHeaderFacetSubSections.length > 0) {
		// merge annotation based header facets and custom header facets in the right order
		let i = 0;
		allHeaderFacets.forEach(function (item) {
			// hidden header facets are not included in allHeaderFacets array => add them anyway
			while (headerfacetSubSections.length > i && headerfacetSubSections[i].visible === "false") {
				allHeaderFacetsSubSections.push(headerfacetSubSections[i]);
				i++;
			}
			if (
				headerfacetSubSections.length > i &&
				(item.key === headerfacetSubSections[i].key ||
					// for header facets with no id the keys of header facet and subsection are different => check only the last part
					item.key.slice(item.key.lastIndexOf("::") + 2) ===
						headerfacetSubSections[i].key.slice(headerfacetSubSections[i].key.lastIndexOf("::") + 2))
			) {
				allHeaderFacetsSubSections.push(headerfacetSubSections[i]);
				i++;
			} else {
				customHeaderFacetSubSections.forEach(function (customItem) {
					if (item.key === customItem.key) {
						allHeaderFacetsSubSections.push(customItem);
					}
				});
			}
		});
	} else {
		allHeaderFacetsSubSections = headerfacetSubSections;
	}
	const headerSection: ObjectPageSection = {
		id: editableHeaderSectionID,
		key: "EditableHeaderContent",
		title: "{sap.fe.i18n>T_COMMON_OBJECT_PAGE_HEADER_SECTION}",
		visible: compileExpression(UI.IsEditable),
		subSections: allHeaderFacetsSubSections
	};
	return headerSection;
}

/**
 * Creates a definition for a section based on the Facet annotation.
 * @param converterContext The converter context
 * @returns All sections
 */
function getSectionsFromAnnotation(converterContext: ConverterContext<PageContextPathTarget>): ObjectPageSection[] {
	const entityType = converterContext.getEntityType();
	const objectPageSections: ObjectPageSection[] =
		entityType.annotations?.UI?.Facets?.map((facetDefinition: FacetTypes) =>
			getSectionFromAnnotation(facetDefinition, converterContext)
		) || [];
	return objectPageSections;
}

/**
 * Check manifest for setting 'useSingleTextAreaFieldAsNotes'.
 * If this setting is true, then the label of the single text-area field in a form container will be hidden.
 * @param manifestWrapper
 * @param sectionKey
 * @returns If the form element's label needs to be hidden.
 */
function getUseSingleTextAreaFieldAsNotes(manifestWrapper: ManifestWrapper, sectionKey: string): boolean {
	const sectionsInManifest = manifestWrapper.getSections();
	const sectionSettings = sectionsInManifest?.[sectionKey];
	return sectionSettings?.useSingleTextAreaFieldAsNotes ?? false;
}

/**
 * Create an annotation based section.
 * @param facet
 * @param converterContext
 * @returns The current section
 */
function getSectionFromAnnotation(facet: FacetTypes, converterContext: ConverterContext<PageContextPathTarget>): ObjectPageSection {
	const sectionID = getSectionID(facet);
	const sectionKey = getSectionKey(facet, sectionID);
	// Set absolute binding path for Singleton references, otherwise the configured annotation path itself.
	const hiddenExpression = getExpressionFromAnnotation(facet.annotations?.UI?.Hidden, [], false, (path: string) =>
		singletonPathVisitor(path, converterContext.getConvertedTypes(), [])
	);
	const useSingleTextAreaFieldAsNotes = getUseSingleTextAreaFieldAsNotes(converterContext.getManifestWrapper(), sectionKey);
	const relativeAnnotationPath = converterContext.getRelativeAnnotationPath(facet.fullyQualifiedName, converterContext.getEntityType());
	const controlConfig = converterContext.getManifestControlConfiguration<FacetsControlConfiguration>(relativeAnnotationPath);
	const section: ObjectPageSection = {
		id: sectionID,
		key: sectionKey,
		title: facet.Label ? compileExpression(getExpressionFromAnnotation(facet.Label)) : undefined,
		showTitle: !!facet.Label,
		visible: compileExpression(not(equal(hiddenExpression, true))),
		subSections: createSubSections([facet], converterContext, undefined, useSingleTextAreaFieldAsNotes),
		useSingleTextAreaFieldAsNotes: useSingleTextAreaFieldAsNotes,
		flexSettings: {
			designtime: controlConfig.flexSettings?.designtime ?? FlexDesignTimeType.Default
		}
	};
	return section;
}

/**
 * Creates section definitions based on the manifest definitions.
 * @param manifestSections The sections defined in the manifest
 * @param converterContext
 * @returns The sections defined in the manifest
 */
function getSectionsFromManifest(
	manifestSections: ConfigurableRecord<ManifestSection>,
	converterContext: ConverterContext<PageContextPathTarget>
): Record<string, CustomObjectPageSection> {
	const sections: Record<string, CustomObjectPageSection> = {};
	Object.keys(manifestSections).forEach((manifestSectionKey) => {
		sections[manifestSectionKey] = getSectionFromManifest(manifestSections[manifestSectionKey], manifestSectionKey, converterContext);
	});
	return sections;
}

/**
 * Create a manifest-based custom section.
 * @param customSectionDefinition
 * @param sectionKey
 * @param converterContext
 * @returns The current custom section
 */
function getSectionFromManifest(
	customSectionDefinition: ManifestSection,
	sectionKey: string,
	converterContext: ConverterContext<PageContextPathTarget>
): CustomObjectPageSection {
	const customSectionID = customSectionDefinition.id ? getCustomSectionID(customSectionDefinition.id) : getCustomSectionID(sectionKey);
	let position: Position | undefined = customSectionDefinition.position;
	if (!position) {
		position = {
			placement: Placement.After
		};
	}
	let manifestSubSections: Record<string, ManifestSubSection>;
	if (!customSectionDefinition.subSections) {
		// If there is no subSection defined, we add the content of the custom section as subsections
		// and make sure to set the visibility to 'true', as the actual visibility is handled by the section itself
		manifestSubSections = {
			[sectionKey]: {
				...customSectionDefinition,
				position: undefined,
				visible: "true",
				applyState: undefined,
				retrieveState: undefined
			}
		};
	} else {
		manifestSubSections = customSectionDefinition.subSections;
	}
	const subSections = createCustomSubSections(manifestSubSections, converterContext);

	const customSection: CustomObjectPageSection = {
		id: customSectionID,
		key: sectionKey,
		title: customSectionDefinition.title,
		showTitle: !!customSectionDefinition.title,
		visible: customSectionDefinition.visible !== undefined ? customSectionDefinition.visible : "true",
		position: position,
		subSections: subSections,
		onSectionLoaded: customSectionDefinition.onSectionLoaded,
		applyState: customSectionDefinition.applyState,
		retrieveState: customSectionDefinition.retrieveState,
		flexSettings: customSectionDefinition.flexSettings
			? {
					designtime: customSectionDefinition.flexSettings.designtime ?? FlexDesignTimeType.Default
			  }
			: { designtime: FlexDesignTimeType.Default }
	};
	return customSection;
}

/**
 * Retrieves the ObjectPage header actions (both the default ones and the custom ones defined in the manifest).
 * @param converterContext The converter context
 * @param capabilities
 * @returns An array containing all the actions for this ObjectPage header
 */
export const getHeaderActions = function (
	converterContext: ConverterContext<PageContextPathTarget>,
	capabilities?: EnvironmentCapabilities
): CombinedAction {
	// 1. Get actions from annotations
	const annotationHeaderActions: BaseAction[] = getHeaderDefaultActions(converterContext, capabilities);
	const manifestWrapper = converterContext.getManifestWrapper();
	const actionOverwriteConfig: OverrideTypeAction = getActionOverrideConfig(true);
	// 2. Get actions from manifest
	const manifestActions = getActionsFromManifest(
		manifestWrapper.getHeaderActions(),
		converterContext,
		annotationHeaderActions,
		undefined,
		undefined,
		getHiddenHeaderActions(converterContext)
	);
	// 3. Get all annotation menu items
	const annotationMenuActionItems = getAnnotationMenuActionItems(annotationHeaderActions);
	// 4. Find manifest actions which override any annotation menu items
	const matchingManifestActions = getMatchingManifestAction(annotationMenuActionItems, manifestActions.actions);
	// 5. Get overridden annotation menu items
	const overwrittenMenuActionItems = insertCustomElements(annotationMenuActionItems, matchingManifestActions, actionOverwriteConfig);
	// 6. Override all actions
	let headerActions = insertCustomElements(annotationHeaderActions, manifestActions.actions, actionOverwriteConfig) as CustomAction[];
	// 7. Replace original menu items with their corresponding overridden menu items
	prepareMenuActions(headerActions, overwrittenMenuActionItems);
	// 8. Remove duplicate actions which are menu items
	headerActions = removeDuplicateActions(headerActions) as CustomAction[];
	// 9. Hide menus where all menu items are hidden
	headerActions = getVisibilityEnablementMenuActions(headerActions) as CustomAction[];
	// 10. Apply primary action overflow protection
	headerActions = ActionUtilities.ensurePrimaryActionNeverOverflows(headerActions) as CustomAction[];
	// 10. Add toolbar separators in case of grouped actions
	const overflowGroupsConfig = manifestWrapper.getHeaderOverflowGroups();
	headerActions = addSeparators(headerActions, overflowGroupsConfig) as CustomAction[];
	// Apply emphasis based on manifest 'primaryAction' flag
	ActionUtilities.applyManifestPrimaryActionEmphasis(headerActions, manifestActions.actions);
	return {
		actions: headerActions,
		commandActions: manifestActions.commandActions
	};
};

/**
 * Builds the ObjectPage footer actions.
 *
 * This includes default footer actions as well as custom actions defined in the manifest.json file.
 *
 * Feature: primaryAction emphasis
 * When footer actions are rendered, an emphasized or primary action must be located in the footer.
 * A first-position clone ("EmphasizedFirst") can be inserted to guarantee the first position and to prevent overflow,
 * while keeping the original action order when the emphasis is not effectively active.
 * @param converterContext The converter context
 * @param capabilities The predefined environment capabilities
 * @returns The combined footer actions and command actions
 */
export const getFooterActions = function (
	converterContext: ConverterContext<PageContextPathTarget>,
	capabilities?: EnvironmentCapabilities
): CombinedAction {
	const manifestWrapper = converterContext.getManifestWrapper();
	const aAnnotationFooterActions: BaseAction[] = getFooterDefaultActions(manifestWrapper.getViewLevel(), converterContext, capabilities);
	const manifestActions = getActionsFromManifest(manifestWrapper.getFooterActions(), converterContext, aAnnotationFooterActions);

	const actionOverwriteConfig: OverrideTypeAction = getActionOverrideConfig(true);
	let footerActions = insertCustomElements(aAnnotationFooterActions, manifestActions.actions, actionOverwriteConfig);
	// Apply primary action overflow protection
	footerActions = ActionUtilities.ensurePrimaryActionNeverOverflows(footerActions);
	// Add toolbar separators in case of grouped actions
	const overflowGroupsConfig = manifestWrapper.getFooterOverflowGroups();
	footerActions = addSeparators(footerActions, overflowGroupsConfig);
	// Apply emphasis based on manifest 'primaryAction' flag
	// Footer: coexists with annotation emphasis (multiple emphasized actions with cascading priority)
	ActionUtilities.applyManifestPrimaryActionEmphasis(footerActions, manifestActions.actions);
	return {
		actions: footerActions,
		commandActions: manifestActions.commandActions
	};
};

function _getSubSectionVisualization(subSection: DataVisualizationSubSection): TableVisualization {
	return (subSection?.presentation?.visualizations[0] ? subSection.presentation.visualizations[0] : undefined) as TableVisualization;
}

function _isFacetHasNonResponsiveTableVisible(
	dataVisualizationSubSection: DataVisualizationSubSection,
	subSectionVisualization: TableVisualization
): boolean {
	return (
		dataVisualizationSubSection.internalVisible !== "false" &&
		dataVisualizationSubSection?.presentation?.visualizations &&
		subSectionVisualization?.type === "Table" &&
		subSectionVisualization?.control?.type !== "ResponsiveTable"
	);
}

function _setNonResponsiveTableVisualizationInformation(
	sections: ObjectPageSection[],
	dataVisualizationSubSection: DataVisualizationSubSection,
	subSectionVisualization: TableVisualization,
	sectionLayout: string
): void {
	if (_isFacetHasNonResponsiveTableVisible(dataVisualizationSubSection, subSectionVisualization)) {
		const tableControlConfiguration = subSectionVisualization.control;
		dataVisualizationSubSection.dataVisualizationOptions ??= {};
		if (!(sectionLayout === "Page" && sections.length > 1)) {
			dataVisualizationSubSection.dataVisualizationOptions["rowCountMode"] = "Auto";
			tableControlConfiguration.rowCountMode = "Auto";
		}
		if (sectionLayout !== "Tabs") {
			dataVisualizationSubSection.dataVisualizationOptions["useCondensedTableLayout"] = false;
			tableControlConfiguration.useCondensedTableLayout = false;
		}
	}
}

function _setNonResponsiveTableWithMixFacetsInformation(subSection: MixedSubSection, sectionLayout: string): void {
	const firstSection = subSection?.content?.length === 1 ? subSection.content[0] : undefined;
	if (firstSection?.type === SubSectionType.DataVisualization) {
		const tableControl = (firstSection.presentation?.visualizations[0] as TableVisualization).control;
		if (tableControl.type !== "ResponsiveTable") {
			firstSection.dataVisualizationOptions ??= {};
			firstSection.dataVisualizationOptions["rowCountMode"] = "Auto";
			tableControl.rowCountMode = "Auto";
			if (sectionLayout !== "Tabs") {
				firstSection.dataVisualizationOptions["useCondensedTableLayout"] = false;
				tableControl.useCondensedTableLayout = false;
			}
		}
	}
}

/**
 * Set the NonResponsive Table (grid, tree, analytical) display information.
 * @param sections The ObjectPage sections
 * @param section The current ObjectPage section processed
 * @param sectionLayout
 */
function _setNonResponsiveTableSubSectionControlConfiguration(
	sections: ObjectPageSection[],
	section: ObjectPageSection,
	sectionLayout: string
): void {
	let subSectionVisualization: TableVisualization;
	const subSections = section.subSections;
	if (subSections.length === 1) {
		const subSection = subSections[0];
		switch (subSection.type) {
			case "DataVisualization":
				subSectionVisualization = _getSubSectionVisualization(subSection);
				_setNonResponsiveTableVisualizationInformation(sections, subSection, subSectionVisualization, sectionLayout);
				break;
			case "Mixed":
				_setNonResponsiveTableWithMixFacetsInformation(subSection, sectionLayout);
				break;
			default:
				break;
		}
		return;
	}
	_removeCondensedFromSubSections(subSections);
}

/**
 * Remove the condense layout mode from the subsections.
 * @param subSections The subSections where we need to remove the condensed layout
 */
function _removeCondensedFromSubSections(subSections: ObjectPageSubSection[]): void {
	let dataVisualizationSubSection: DataVisualizationSubSection;
	// We check in each subsection if there is visualizations
	subSections.forEach((subSection) => {
		dataVisualizationSubSection = subSection as DataVisualizationSubSection;
		if (dataVisualizationSubSection?.presentation?.visualizations) {
			dataVisualizationSubSection?.presentation?.visualizations.forEach((singleVisualization) => {
				if (singleVisualization.type === VisualizationType.Table) {
					singleVisualization.control.useCondensedTableLayout = false;
				}
			});
		}
		// Then we check the content of the subsection, and in each content we check if there is a table to set its condensed layout to false
		if (dataVisualizationSubSection?.content) {
			dataVisualizationSubSection.content.forEach((singleContent) => {
				(singleContent as DataVisualizationSubSection).presentation?.visualizations.forEach((singleVisualization) => {
					if (singleVisualization.type === VisualizationType.Table) {
						singleVisualization.control.useCondensedTableLayout = false;
					}
				});
			});
		}
	});
}
/**
 * Retrieves and merges the ObjectPage sections defined in the annotation and in the manifest.
 * @param converterContext The converter context
 * @returns An array of sections.
 */

export const getSections = function (converterContext: ConverterContext<PageContextPathTarget>): ObjectPageSection[] {
	const manifestWrapper = converterContext.getManifestWrapper();
	const sections = insertCustomElements(
		getSectionsFromAnnotation(converterContext),
		getSectionsFromManifest(manifestWrapper.getSections(), converterContext),
		{
			title: OverrideType.overwrite,
			visible: OverrideType.overwrite,
			flexSettings: OverrideType.overwrite,
			subSections: {
				actions: OverrideType.merge,
				title: OverrideType.overwrite,
				sideContent: OverrideType.overwrite,
				objectPageLazyLoaderEnabled: OverrideType.overwrite,
				subSectionCreated: OverrideType.overwrite,
				flexSettings: OverrideType.overwrite
			}
		}
	);
	// Level Adjustment for "Mixed" Collection Facets:
	// ==============================================
	// The manifest definition of custom side contents and actions still needs to be aligned for "Mixed" collection facets:
	// Collection facets containing tables gain an extra reference facet as a table wrapper to ensure, that the table is always
	// placed in an own individual Object Page Block; this additional hierarchy level is unknown to app developers, which are
	// defining the side content and actions in the manifest at collection facet level; now, since the sideContent always needs
	// to be assigned to a block, and actions always need to be assigned to a form,
	// we need to move the sideContent and actions from a mixed collection facet to its content.
	// ==============================================
	let index = 0;
	sections.forEach(function (section) {
		_setNonResponsiveTableSubSectionControlConfiguration(sections, section, manifestWrapper.getSectionLayout());
		section.subSections?.forEach(function (subSection) {
			if (converterContext.getManifestWrapper().getEnableLazyLoading()) {
				const entityType = converterContext.getEntityType();
				const visibleExpression = resolveBindingString(subSection.visible as string, "boolean");
				subSection.visible =
					isConstant(visibleExpression) && index < 3
						? subSection.visible
						: compileExpression(ifElse(equal(pathInModel(entityType.keys[0].name), undefined), false, visibleExpression));
				index++;
			}
			subSection.title = subSection.title === "undefined" ? undefined : subSection.title;
			if (subSection.type === "Mixed") {
				subSection.content?.forEach((content) => {
					content.objectPageLazyLoaderEnabled = subSection.objectPageLazyLoaderEnabled;
				});
			}
			if (subSection.type === "Mixed" && subSection.content?.length) {
				const firstForm = subSection.content.find(
					(element) => (element as FormSubSection).type === SubSectionType.Form
				) as FormSubSection;

				// 1. Copy sideContent to the SubSection's first form; or -- if unavailable -- to its first content
				// 2. Copy actions to the first form of the SubSection's content
				// 3. Delete sideContent / actions at the (invalid) manifest level

				if (subSection.sideContent) {
					if (firstForm) {
						// If there is a form, it always needs to be attached to the form, as the form inherits the ID of the SubSection
						firstForm.sideContent = subSection.sideContent;
					} else {
						subSection.content[0].sideContent = subSection.sideContent;
					}
					subSection.sideContent = undefined;
				}

				if (firstForm && (subSection as unknown as FormSubSection).actions?.length) {
					firstForm.actions = (subSection as unknown as FormSubSection).actions;
					(subSection as unknown as FormSubSection).actions = [];
				}
			}
		});
	});
	return sections;
};

/**
 * Determines if the ObjectPage has header content.
 * @param converterContext The instance of the converter context
 * @returns `true` if there is at least on header facet
 */
function hasHeaderContent(converterContext: ConverterContext<PageContextPathTarget>): boolean {
	const manifestWrapper = converterContext.getManifestWrapper();
	return (
		(converterContext.getEntityType().annotations?.UI?.HeaderFacets || []).length > 0 ||
		Object.keys(manifestWrapper.getHeaderFacets()).length > 0
	);
}

/**
 * Gets the expression to evaluate the visibility of the header content.
 * @param converterContext The instance of the converter context
 * @returns The binding expression for the Delete button
 */
function getShowHeaderContentExpression(converterContext: ConverterContext<PageContextPathTarget>): BindingToolkitExpression<boolean> {
	const manifestWrapper = converterContext.getManifestWrapper();
	return ifElse(
		!hasHeaderContent(converterContext),
		constant(false),
		ifElse(equal(manifestWrapper.isHeaderEditable(), false), constant(true), not(UI.IsEditable))
	);
}

/**
 * Gets the binding expression to evaluate the visibility of the header content.
 * @param converterContext The instance of the converter context
 * @returns The binding expression for the Delete button
 */
export const getShowHeaderContent = function (converterContext: ConverterContext<PageContextPathTarget>): CompiledBindingToolkitExpression {
	return compileExpression(getShowHeaderContentExpression(converterContext));
};

/**
 * Gets the binding expression to evaluate the visibility of the EasyFill button.
 * Main Object Page: EasyFill Button is visible if Edit Button is visible OR Main Object page is in edit mode.
 * Sub Object Page: EasyFill Button is visible if Edit Button is visible OR Sub Object page is in edit mode.
 * @param converterContext
 * @returns The binding expression for the EasyFill button
 */
export const getEasyFillVisible = function (converterContext: ConverterContext<PageContextPathTarget>): CompiledBindingToolkitExpression {
	const entitySet = converterContext?.getEntitySet(),
		entityType = converterContext.getEntityType(),
		isUpdateHidden = getExpressionFromAnnotation(ModelHelper.isUpdateHidden(entitySet, entityType));
	const rootEntitySetPath = ModelHelper.getRootEntitySetPath(converterContext.getContextPath());
	const rootConverterContext = converterContext.getConverterContextFor<PageContextPathTarget>("/" + rootEntitySetPath);
	const isRootUpdateHidden = getExpressionFromAnnotation(
		ModelHelper.isUpdateHidden(rootConverterContext.getEntitySet(), rootConverterContext.getEntityType())
	);
	const isDraftEnabled = ModelHelper.isObjectPathDraftSupported(converterContext.getDataModelObjectPath());
	const isSticky = ModelHelper.isSticky(converterContext.getDataModelObjectPath().startingEntitySet);
	// EasyFill is only available if the object path is draft enabled and sticky
	if (!isDraftEnabled && !isSticky) {
		return compileExpression(false);
	}
	const viewLevel = converterContext.getManifestWrapper().getViewLevel();
	const updatablePropertyPath = viewLevel > 1 ? entitySet?.annotations.Capabilities?.UpdateRestrictions?.Updatable : undefined;
	const isEditEnabled = getEditButtonEnabledExpression(converterContext, updatablePropertyPath, viewLevel);
	return compileExpression(
		ifElse(
			viewLevel > 1,
			or(and(equal(pathInModel("rootEditVisible", "internal"), true), not(isUpdateHidden)), and(UI.IsEditable, isEditEnabled)),
			and(not(isUpdateHidden), not(isRootUpdateHidden), isEditEnabled)
		)
	);
};

/**
 * Gets the binding expression to evaluate the visibility of the avatar when the header is in an expanded state.
 * @param converterContext The instance of the converter context
 * @returns The binding expression for the Delete button
 */
export const getExpandedImageVisible = function (
	converterContext: ConverterContext<PageContextPathTarget>
): CompiledBindingToolkitExpression {
	return compileExpression(not(getShowHeaderContentExpression(converterContext)));
};

/**
 * Gets the AI notice configuration.
 * @param converterContext The instance of the converter context
 * @returns The AI notice configuration
 */
export const getHeaderAiNotice = function (converterContext: ConverterContext<PageContextPathTarget>): AiNoticeConfiguration | undefined {
	const manifestWrapper = converterContext.getManifestWrapper();
	const aiNoticeSettings = manifestWrapper.getHeaderAiNotice();
	if (!aiNoticeSettings) {
		return undefined;
	}
	const aiNoticeVisibleExpression =
		aiNoticeSettings.visible === undefined ? undefined : compileExpression(resolveBindingString(aiNoticeSettings.visible, "boolean"));
	return {
		visible: aiNoticeVisibleExpression,
		contentText: aiNoticeSettings?.contentText,
		contentFragmentName: aiNoticeSettings?.contentFragmentName,
		// Distinct ids for the expanded and heading-fallback slots; both coexist in the control tree.
		expandedHeadingId: generate(["fe", "expandedHeaderNotice"]),
		defaultHeadingId: generate(["fe", "defaultHeaderNotice"])
	};
};

/**
 * Converts an entity definition into an ObjectPage template definition.
 *
 * Feature: action emphasis.
 * Applies emphasis rules for header and footer actions based on the UI.Emphasized annotation and primaryAction manifest setting,
 * including criticality gating and footer visibility constraints.
 * @param converterContext The converter context
 * @param capabilities The predefined environment capabilities
 * @returns The ObjectPage definition
 */
/**
 * Returns the list of additional properties defined in the manifest.json file that exist in the EntityType.
 * @param converterContext Converter context containing manifest and metadata information.
 * @returns Array of property names that are both defined in the manifest.json file and present in the EntityType.
 */
export const getAdditionalPropertiesFromManifest = function (converterContext: ConverterContext<PageContextPathTarget>): string[] {
	const manifestWrapper = converterContext.getManifestWrapper();
	return ModelHelper.getValidatedAdditionalProperties(
		converterContext.getDataModelObjectPath(),
		manifestWrapper.getAdditionalProperties()
	);
};

export const convertPage = function (
	converterContext: ConverterContext<PageContextPathTarget>,
	capabilities?: EnvironmentCapabilities
): ObjectPageDefinition {
	const manifestWrapper = converterContext.getManifestWrapper();
	let headerSection: ObjectPageSection | undefined;
	const entityType: EntityType = converterContext.getEntityType();
	const disableObjectPageRequestOptimization = manifestWrapper.getDisableObjectPageRequestOptimization();

	// Retrieve all header facets (from annotations & custom)
	const headerFacets = insertCustomElements(
		getHeaderFacetsFromAnnotations(converterContext, disableObjectPageRequestOptimization),
		getHeaderFacetsFromManifest(manifestWrapper.getHeaderFacets(), disableObjectPageRequestOptimization)
	);

	// Retrieve the page header actions
	const headerActions = getHeaderActions(converterContext, capabilities);
	const isDraftEnabled = ModelHelper.isObjectPathDraftSupported(converterContext.getDataModelObjectPath());
	// Retrieve the page footer actions
	const footerActions = getFooterActions(converterContext, capabilities);
	// Reorder actions for cascade priority calculation (manifest before annotation)
	const reorderedHeaderActions = ActionUtilities.prioritizeManifestEmphasizedActions(headerActions.actions);
	const reorderedFooterActions = ActionUtilities.prioritizeManifestEmphasizedActions(footerActions.actions);
	// Apply ObjectPage emphasis rules (header/footer/criticality) in a single pipeline.
	// Use reordered arrays for correct cascade priority, but emphasizedHeaderActionsRef still references original actions
	const emphasizedHeaderActionsRef = ActionUtilities.applyObjectPageEmphasisRules(reorderedHeaderActions, reorderedFooterActions);

	// Copy back any clones (::EmphasizedFirst) that were created in the reordered arrays
	// This ensures the clones are also present in the original action arrays used for rendering
	const clones = reorderedFooterActions.filter((a) => ActionUtilities.isEmphasizedFirstClone(a));
	for (const clone of clones) {
		// Only add if not already present (avoid duplicates when emphasis rules modified arrays)
		if (!footerActions.actions.some((a) => a.key === clone.key)) {
			// Insert at beginning to maintain first-position semantics
			footerActions.actions.unshift(clone);
		}
	}

	if (manifestWrapper.isHeaderEditable() && (entityType.annotations.UI?.HeaderFacets || entityType.annotations.UI?.HeaderInfo)) {
		headerSection = createEditableHeaderSection(converterContext, headerFacets, disableObjectPageRequestOptimization);
	}

	const sections = getSections(converterContext);

	return {
		template: TemplateType.ObjectPage,
		header: {
			visible: manifestWrapper.getShowObjectPageHeader(),
			aiNotice: getHeaderAiNotice(converterContext),
			section: headerSection,
			facets: headerFacets,
			actions: headerActions.actions,
			emphasizedFirstActions: emphasizedHeaderActionsRef,
			easyFillVisible: getEasyFillVisible(converterContext),
			showContent: getShowHeaderContent(converterContext),
			hasContent: hasHeaderContent(converterContext),
			avatar: getAvatar(converterContext),
			title: {
				expandedImageVisible: getExpandedImageVisible(converterContext)
			}
		},
		sections: sections,
		footerActions: footerActions.actions,
		headerCommandActions: headerActions.commandActions,
		footerCommandActions: footerActions.commandActions,
		showAnchorBar: manifestWrapper.getShowAnchorBar(),
		useIconTabBar: manifestWrapper.useIconTabBar(),
		transportSelection: manifestWrapper.getTransportSelection(),
		disableObjectPageRequestOptimization,
		isDraftEnabled
	};
};
