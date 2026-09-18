import type { EntitySet } from "@sap-ux/vocabularies-types";
import { CommunicationAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/Communication";
import type {
	CollectionFacet,
	DataField,
	FacetTypes,
	FieldGroupType,
	Identification,
	ReferenceFacet
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, equal, getExpressionFromAnnotation, ifElse } from "sap/fe/base/BindingToolkit";
import { aggregation, association, defineUI5Class, event, implementInterface, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import type { XMLPreprocessorContext } from "sap/fe/core/TemplateComponent";
import type { TemplateProcessorSettings } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import HideFormGroupAutomatically from "sap/fe/core/controls/HideFormGroupAutomatically";
import type { FormManifestConfiguration } from "sap/fe/core/converters/ManifestSettings";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { hasFieldGroupTarget, hasIdentificationTarget } from "sap/fe/core/converters/annotations/DataField";
import type { FormContainer as FormContainerType } from "sap/fe/core/converters/controls/Common/Form";
import { createFormDefinition } from "sap/fe/core/converters/controls/Common/Form";
import { getFacetActions } from "sap/fe/core/converters/controls/ObjectPage/SubSection";
import { getFormContainerID } from "sap/fe/core/converters/helpers/ID";
import { UI } from "sap/fe/core/helpers/BindingHelper";
import * as StableIDHelper from "sap/fe/core/helpers/StableIdHelper";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { getContextRelativeTargetObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import type ISingleSectionContributor from "sap/fe/macros/controls/section/ISingleSectionContributor";
import type { ProviderData } from "sap/fe/macros/controls/section/ISingleSectionContributor";
import type OverflowToolbar from "sap/m/OverflowToolbar";
import Text from "sap/m/Text";
import MTitle from "sap/m/Title";
import type Control from "sap/ui/core/Control";
import type { $ControlSettings } from "sap/ui/core/Control";
import CustomData from "sap/ui/core/CustomData";
import Title from "sap/ui/core/Title";
import { TitleLevel } from "sap/ui/core/library";
import type { $ColumnLayoutSettings } from "sap/ui/layout/form/ColumnLayout";
import ColumnLayoutControl from "sap/ui/layout/form/ColumnLayout";
import UI5Form from "sap/ui/layout/form/Form";
import UI5FormContainer from "sap/ui/layout/form/FormContainer";
import type { $ResponsiveGridLayoutSettings } from "sap/ui/layout/form/ResponsiveGridLayout";
import ResponsiveGridLayoutControl from "sap/ui/layout/form/ResponsiveGridLayout";
import type Context from "sap/ui/model/Context";
import AnnotationHelper from "sap/ui/model/odata/v4/AnnotationHelper";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import FormElement from "../FormElement";
import MacroAPI from "../MacroAPI";
import FormContainer from "./FormContainerAPI";
import { getFormContainerContent } from "./FormContainerHelper";
import FormHelper from "./FormHelper";
import FormLayoutOptions from "./FormLayoutOptions";

type ColumnLayout = $ColumnLayoutSettings & {
	type: "ColumnLayout";
};
type ResponsiveGridLayout = $ResponsiveGridLayoutSettings & {
	type: "ResponsiveGridLayout";
};
type FormLayoutInformation = ColumnLayout | ResponsiveGridLayout;

/**
 * Building block for creating a Form based on the metadata provided by OData V4.
 * <br>
 * It is designed to work based on a FieldGroup annotation but can also work if you provide a ReferenceFacet or a CollectionFacet
 *
 *
 * Usage example:
 * <pre>
 * &lt;macros:Form id="MyForm" metaPath="@com.sap.vocabularies.UI.v1.FieldGroup#GeneralInformation" /&gt;
 * </pre>
 * @alias sap.fe.macros.Form
 * @public
 */
@defineUI5Class("sap.fe.macros.form.FormAPI")
class FormAPI extends MacroAPI<{ displayMode: string }> implements ISingleSectionContributor {
	@implementInterface("sap.fe.macros.controls.section.ISingleSectionContributor")
	__implements__sap_fe_macros_controls_section_ISingleSectionContributor = true;

	/**
	 * The identifier of the form control.
	 */
	@property({ type: "string", required: true })
	id!: string;

	/**
	 * Defines the path of the context used in the current page or block.
	 * This setting is defined by the framework.
	 * @public
	 */
	@property({
		type: "string",
		required: true,
		expectedTypes: ["EntitySet", "NavigationProperty", "Singleton", "EntityType"]
	})
	contextPath!: string;

	/**
	 * Defines the relative path of the property in the metamodel, based on the current contextPath.
	 * @public
	 */
	@property({
		type: "string",
		required: true,
		expectedAnnotations: [
			"com.sap.vocabularies.UI.v1.FieldGroupType",
			"com.sap.vocabularies.UI.v1.CollectionFacet",
			"com.sap.vocabularies.UI.v1.ReferenceFacet"
		],
		expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"]
	})
	metaPath!: string;

	/**
	 * The manifest defined form containers to be shown in the action area of the table
	 */
	@property({ type: "array" })
	formContainers?: FormContainerType[];

	/**
	 * The designtime settings for the form
	 */
	@property({ type: "string" })
	designtime = "sap/fe/macros/form/Form.designtime";

	/**
	 * Control the rendering of the form container labels
	 */
	@property({ type: "boolean" })
	useFormContainerLabels = false;

	/**
	 * Filters the navigation properties that can be used by flexibility features.
	 * This property allows you to specify which navigation properties are available
	 * for flexibility operations such as adding custom fields.
	 * You can use the asterisk (*) wildcard to include all navigation properties,
	 * or specify individual navigation property names to restrict the available options.
	 * Example:
	 * Allow all navigation properties: navigationPropertiesForAdaptationDialog: ["*"]
	 * Example:
	 * Allow only a specific navigation property: navigationPropertiesForAdaptationDialog: ["Customer/Name"]
	 * Example:
	 * Allow multiple specific navigation properties based on a wildcard: navigationPropertiesForAdaptationDialog: ["Cust*\/Name"]
	 * @public
	 */
	@property({ type: "string[]" })
	navigationPropertiesForAdaptationDialog?: string[];

	/**
	 * Toggle Preview: Part of Preview / Preview using the 'Show More' Button
	 */
	@property({ type: "boolean" })
	partOfPreview = true;

	/**
	 * The title of the form control.
	 * @public
	 */
	@property({ type: "string", required: true })
	title?: string;

	/**
	 * Defines the "aria-level" of the form title. Titles of internally used form containers are nested subsequently
	 */
	@property({ type: "sap.ui.core.TitleLevel" })
	titleLevel: TitleLevel = TitleLevel.Auto;

	@property({ type: "string", bindToState: true })
	displayMode?: string;

	/**
	 * Parameter which sets the visibility of the Form building block
	 * @public
	 */
	@property({ type: "boolean" })
	visible?: boolean | CompiledBindingToolkitExpression = true;
	// Independent from the form title, can be a bit confusing in standalone usage at is not showing anything by default

	// Just proxied down to the Field may need to see if needed or not
	@event()
	onChange?: string;

	@aggregation({ type: "sap.fe.macros.FormElement", multiple: true, isDefault: true })
	formElements?: FormElement[];

	/**
	 * Defines the layout to be used within the form.
	 * It defaults to the ColumnLayout, but you can also use a ResponsiveGridLayout.
	 * All the properties of the ResponsiveGridLayout can be added to the configuration.
	 * @public
	 */
	@aggregation({ type: "sap.fe.macros.form.FormLayoutOptions" })
	layout?: FormLayoutOptions;

	// Useful for our dynamic thing but also depends on the metadata -> make sure this is taken into account
	_editable: CompiledBindingToolkitExpression;

	/**
	 * The original id for the form content.
	 * @private
	 */
	@association({ type: "sap.ui.core.Control" })
	_formContentId?: string;

	facetType?: string;

	computedMetaPath?: Context;

	odataMetaModel!: ODataMetaModel | undefined;

	preprocessorContext!: XMLPreprocessorContext | undefined;

	computedContextPath: Context | undefined;

	constructor(props?: PropertiesOf<FormAPI>, others?: $ControlSettings) {
		let combinedProps;

		if (props) {
			if (typeof props === "string") {
				combinedProps = { ...others, id: props } as PropertiesOf<FormAPI>;
			} else {
				combinedProps = { ...props } as PropertiesOf<FormAPI>;
			}

			// Template case the ids are managed differently
			// The inner ID is equal to the external one, the outer one becomes ::Formn
			if (props.id && props._formContentId && props.id === props._formContentId) {
				combinedProps._formContentId = props.id;
				combinedProps.id = `${props.id}::Form`;
			} else {
				combinedProps._formContentId = props._formContentId ?? `${props.id}-content`;
			}
		}

		super(combinedProps, others);
	}

	getSectionContentRole(): "provider" | "consumer" {
		return "provider";
	}

	/**
	 * Implementation of the getDataFromProvider method which is a part of the ISingleSectionContributor
	 *
	 * Is called from the sap.fe.macros.controls.Section control when there is a Form building block rendered within a section
	 * and the form's title is provided to the Section and accordingly adjusted here.
	 * @param useSingleTextAreaFieldAsNotes
	 * @returns The title of the form
	 */
	getDataFromProvider(useSingleTextAreaFieldAsNotes: boolean): ProviderData {
		const formContent = this.content as UI5Form;
		const formContainers = formContent.getFormContainers();
		if (useSingleTextAreaFieldAsNotes && formContainers.length) {
			formContainers.forEach((formContainer: UI5FormContainer) => {
				FormContainer.setTextAreaLabelVisibility(formContainer);
			});
		}
		// if the form's content directly has a title
		let formTitle = "";
		if (formContainers.length === 1) {
			const formContentTitle = (formContent.getTitle() as Title)?.getText();
			if (formContentTitle) {
				formTitle = formContentTitle;
				formContent.setTitle("");
				return {
					title: formTitle
				};
			}

			const formContainerTitle = (formContainers[0]?.getTitle() as Title)?.getText();
			//if the title from the formContainer needs to be fetched
			if (formContainerTitle && formContainerTitle !== "") {
				formTitle = formContainerTitle;
			}

			// if the title needs to be fetched from the toolbar aggregation's content of form container
			let formActionToolbarTitleControl;
			(formContainers[0].getAggregation("toolbar") as OverflowToolbar)?.getContent().forEach(function (innerControl: Control) {
				if (innerControl.isA<MTitle>("sap.m.Title")) {
					formActionToolbarTitleControl = innerControl;
					const formActionToolbarTitle = innerControl.getText();
					if (formActionToolbarTitle && formActionToolbarTitle != "") {
						formTitle = innerControl.getText();
					}
				}
			});

			if (formTitle && formTitle !== "") {
				formContainers[0]?.setTitle("");
				//this is needed to handle cases where title is present for both formContainer and the form action toolbar, but the title rendered on the UI is the one coming from one of those
				(formActionToolbarTitleControl as unknown as MTitle)?.setTitle(new MTitle(""));
				return {
					title: formTitle
				};
			}
		}
		return {
			title: formTitle
		};
	}

	onMetadataAvailable(): void {
		if (this.content === undefined || this.content === null) {
			this.setupDesigntime();
			this.prepareFormContainers();
			this.content = this.createContent();
		}
	}

	prepareFormContainers(): void {
		if (!this.contextPath) {
			this.contextPath = this._getOwner()?.contextPath || this.getOwnerContextPath() || "";
		}

		if (this.metaPath && this.contextPath && (this.formContainers === undefined || this.formContainers === null)) {
			// Convert string paths to Context objects for BBv4
			const metaModel = this.getMetaModel();
			if (!metaModel) {
				return;
			}
			if (this.contextPath.endsWith("/")) {
				this.contextPath = this.contextPath.substring(0, this.contextPath.length - 1);
			}
			// Get the computed context path as Context object
			this.computedContextPath = metaModel.getMetaContext(this.getComputedContextPath(this.contextPath));
			if (this.computedContextPath === undefined || this.computedContextPath === null) {
				return;
			}

			const oContextObjectPath = this.getDataModelObjectForMetaPath<FieldGroupType | CollectionFacet | ReferenceFacet>(
				this.metaPath,
				this.contextPath
			);

			if (!oContextObjectPath) {
				return;
			}

			const mExtraSettings: Record<string, unknown> = {};
			let oFacetDefinition = oContextObjectPath.targetObject;
			let hasFieldGroup = false;

			if (oFacetDefinition && oFacetDefinition.$Type === UIAnnotationTypes.FieldGroupType) {
				// Wrap the facet in a fake Facet annotation
				hasFieldGroup = true;
				oFacetDefinition = {
					$Type: UIAnnotationTypes.ReferenceFacet,
					Label: oFacetDefinition.Label,
					Target: {
						$target: oFacetDefinition,
						fullyQualifiedName: oFacetDefinition.fullyQualifiedName,
						path: "",
						term: "",
						type: "AnnotationPath",
						value: getContextRelativeTargetObjectPath(oContextObjectPath)
					},
					annotations: {},
					fullyQualifiedName: oFacetDefinition.fullyQualifiedName
				} as unknown as ReferenceFacet;
				mExtraSettings[oFacetDefinition.Target.value] = {
					fields: this.formElements?.reduce(
						(formContainers: Record<string, object>, formElement): Record<string, object> => {
							const id = formElement.getId();
							const idParts = id.split("--");
							const key = "InlineXML_" + idParts[idParts.length - 1];
							formContainers[key] = {
								key: key,
								type: "Slot",
								label: formElement.label,
								position: {
									placement: formElement.placement,
									anchor: formElement.anchor
								}
							};
							return formContainers;
						},
						{} as Record<string, object>
					)
				};
			}

			const appComponent = this.getAppComponent();
			const viewData = this._getOwner()?.getRootController()?.getView().getViewData() ?? {};

			if (!appComponent) {
				return;
			}

			const settings = {
				appComponent,
				models: {
					metaModel,
					viewData: { getData: () => viewData }
				}
			} as Partial<TemplateProcessorSettings>;

			const oConverterContext = MacroAPI.getConverterContext(
				oContextObjectPath,
				this.contextPath, // Keep as string for converter context
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				settings as any, // TODO: look into TemplateProcessorSettings
				mExtraSettings
			);
			let oFormDefinition;
			try {
				const facetActions = oFacetDefinition ? getFacetActions(oFacetDefinition, oConverterContext).actions : [];
				oFormDefinition = createFormDefinition(oFacetDefinition, compileExpression(this.visible), oConverterContext, facetActions);
			} catch (error: unknown) {
				Log.warning(
					`Form building block: skipping unsupported facet at "${this.metaPath}":`,
					error instanceof Error ? error.message : String(error)
				);
				this.formContainers = [];
				return;
			}
			if (hasFieldGroup) {
				let fieldGroupPath = this.contextPath;
				if (!fieldGroupPath.endsWith("/")) {
					fieldGroupPath += "/";
				}
				if (this.metaPath.startsWith("/")) {
					fieldGroupPath = this.metaPath;
				} else {
					fieldGroupPath += this.metaPath;
				}

				// Update the annotation path to point to the FieldGroup itself
				oFormDefinition.formContainers[0].annotationPath = fieldGroupPath;
			}
			this.formContainers = oFormDefinition.formContainers;
			this.useFormContainerLabels = oFormDefinition.useFormContainerLabels;

			// Read layout settings from manifest and override the layout aggregation if any
			if (oContextObjectPath.targetObject) {
				const sections = oConverterContext.getManifestWrapper().getSections();
				let targetLayout;
				const facetId = (oContextObjectPath.targetObject as CollectionFacet | ReferenceFacet).ID;
				if (facetId && sections[facetId.toString()] !== undefined) {
					targetLayout = (sections[facetId.toString()] as FormManifestConfiguration).layout;
				}
				if (!targetLayout) {
					const manifestFormConfiguration = oConverterContext.getManifestControlConfiguration<FormManifestConfiguration>(
						oConverterContext.getRelativeAnnotationPath(
							oContextObjectPath.targetObject.fullyQualifiedName ?? "",
							oContextObjectPath.targetEntityType
						)
					);
					if (manifestFormConfiguration?.layout) {
						targetLayout = manifestFormConfiguration.layout;
					}
				}
				if (targetLayout) {
					this.layout = new FormLayoutOptions(targetLayout);
				}
			}

			// if navigationPropertiesForAdaptationDialog is defined on the form building block,
			// it should be passed down to the form containers as well
			if (this.navigationPropertiesForAdaptationDialog) {
				this.formContainers.forEach((formContainer) => {
					formContainer.navigationPropertiesForAdaptationDialog =
						formContainer.navigationPropertiesForAdaptationDialog ?? this.navigationPropertiesForAdaptationDialog;
				});
			}
			this.facetType = oFacetDefinition && (oFacetDefinition.$Type as string);
		} else {
			const metaModel = this.getMetaModel();
			const facetContext = metaModel?.createBindingContext(this.metaPath);
			this.facetType = facetContext?.getObject()?.$Type;
		}

		if (this.getBindingInfo("displayMode") !== undefined) {
			this._editable = compileExpression(ifElse(equal(this.bindState("displayMode"), false), true, false));
		} else {
			this._editable = compileExpression(UI.IsEditable);
		}
	}

	setupDesigntime(): void {
		const customSettings = this.data("sap-ui-custom-settings") ?? {};
		const dtDesigntime = customSettings["sap.ui.dt"]?.designtime;
		// if dt:designtime is provided, us it
		if (dtDesigntime && typeof dtDesigntime === "string") {
			this.designtime = dtDesigntime;
		}
		// map "Default" to designtime file so that we can directly pass it to UI5Form
		if (this.designtime === "Default") {
			this.designtime = "sap/fe/macros/form/Form.designtime";
		}
	}

	getDataFieldCollection(formContainer: FormContainerType, facetContext: ODataV4Context): Control {
		const facet = getInvolvedDataModelObjects(facetContext).targetObject as FacetTypes;
		let navigationPath;
		let idPart;
		if (facet.$Type === UIAnnotationTypes.ReferenceFacet) {
			navigationPath = AnnotationHelper.getNavigationPath(facet.Target.value);
			idPart = facet;
		} else {
			const contextPathPath = this.contextPath;
			let facetPath = facetContext.getPath();
			if (facetPath.startsWith(contextPathPath)) {
				facetPath = facetPath.substring(contextPathPath.length);
				if (facetPath.charAt(0) === "/") {
					facetPath = facetPath.slice(1);
				}
			}
			navigationPath = AnnotationHelper.getNavigationPath(facetPath);
			idPart = facetPath;
		}
		const titleLevel = FormHelper.getFormContainerTitleLevel(this.title, this.titleLevel);
		const title = this.useFormContainerLabels === true && facet.Label ? getExpressionFromAnnotation(facet.Label) : "";
		// Enhance: generate a stable form container id whenever we have a derived idPart even if this._formContentId is undefined.
		// Protect getFormContainerID from being called with an undefined idPart by checking idPart and converting to string.
		const id = this._formContentId && idPart ? getFormContainerID(idPart) : undefined;

		const contextPath =
			navigationPath && formContainer.entitySet
				? this.computedContextPath?.getModel().getContext(formContainer.entitySet)
				: this.computedContextPath;

		return getFormContainerContent(
			{
				id: id,
				visible: formContainer.isVisible as unknown as boolean,
				title: title as unknown as string,
				titleLevel: titleLevel,
				displayMode: this.displayMode as unknown as boolean,
				macrodata: {
					navigationPath: navigationPath,
					UiHiddenPresent: formContainer.annotationHidden,
					etName: contextPath.getObject("./@sapui.name"),
					navigationPropertiesForAdaptationDialog: formContainer.navigationPropertiesForAdaptationDialog
				},
				actions: formContainer.actions,
				dataFieldCollection: formContainer.formElements,
				designtimeSettings:
					formContainer.flexSettings?.designtime === "Default" || !formContainer.flexSettings?.designtime
						? "sap/fe/macros/form/FormContainer.designtime"
						: formContainer.flexSettings.designtime,
				slotElements: this.formElements as unknown as Control[],
				ibnMappingProperties: formContainer.ibnMappingProperties
			},
			contextPath,
			this.getPageController(),
			facetContext
		);
	}

	getFormContainers(): (Control | undefined)[] {
		if (this.formContainers?.length === 0) {
			return [undefined];
		}

		if (this.facetType?.includes("com.sap.vocabularies.UI.v1.CollectionFacet") === true) {
			return this.formContainers!.map((formContainer, _formContainerIdx) => {
				if (formContainer.isVisible) {
					const facetContext = this.computedContextPath
						?.getModel()
						.createBindingContext(formContainer.annotationPath, this.computedContextPath);
					const facet = facetContext.getObject();
					if (
						facet.$Type === UIAnnotationTypes.ReferenceFacet &&
						FormHelper.isReferenceFacetPartOfPreview(facet, this.partOfPreview)
					) {
						if (facet.Target.$AnnotationPath.$Type === CommunicationAnnotationTypes.AddressType) {
							const navigationPath =
								facet.Target.value && facet.Target.value.includes("/") ? facet.Target.value.split("/")[0] : "";

							const title = facet.Label;
							const facetId = facet.ID || "AddressSection";
							const formContainerId = this._formContentId
								? StableIDHelper.generate(["fe", "FormContainer", facetId])
								: undefined;
							const formElementId = this._formContentId
								? StableIDHelper.generate([this._formContentId, "FormElement", facetId])
								: undefined;

							const entitySetContext = formContainer.entitySet
								? this.computedContextPath?.getModel().getContext(formContainer.entitySet)
								: undefined;
							const dataModelObjectPath = entitySetContext ? getInvolvedDataModelObjects(entitySetContext) : undefined;
							const bindingExpression = FormHelper.generateBindingExpression(
								navigationPath,
								dataModelObjectPath as DataModelObjectPath<EntitySet> | undefined
							);

							const isHidden = facet["@com.sap.vocabularies.UI.v1.Hidden"]?.$Path;
							const visibleExpression = isHidden ? `{= !\${${isHidden}} }` : "true";

							const formContainerDesigntime =
								formContainer.flexSettings?.designtime === "Default" || !formContainer.flexSettings?.designtime
									? "sap/fe/macros/form/FormContainer.designtime"
									: formContainer.flexSettings.designtime;

							return (
								<UI5FormContainer
									id={formContainerId}
									binding={bindingExpression}
									visible={visibleExpression}
									dt:designtime={formContainerDesigntime}
								>
									{{
										title: title ? (
											<Title
												level={FormHelper.getFormContainerTitleLevel(this.title, this.titleLevel)}
												text={getExpressionFromAnnotation(title)}
											/>
										) : undefined,
										formElements: (
											<FormElement id={formElementId}>
												{{
													fields: (
														<Text
															text="{facet>Target/$AnnotationPath/label@@MODEL.format}"
															class="sapMITBFilterNeutral"
														/>
													)
												}}
											</FormElement>
										)
									}}
								</UI5FormContainer>
							);
						}
						return this.getDataFieldCollection(formContainer, facetContext);
					}
				}
				return undefined;
			});
		} else if (this.facetType === "com.sap.vocabularies.UI.v1.ReferenceFacet") {
			return this.formContainers!.map((formContainer) => {
				if (formContainer.isVisible) {
					const facetContext = this.computedContextPath
						?.getModel()
						.createBindingContext(formContainer.annotationPath, this.computedContextPath);
					return this.getDataFieldCollection(formContainer, facetContext);
				} else {
					return undefined;
				}
			});
		}
		return [undefined];
	}

	/**
	 * @returns True if a textarea is alone in a form
	 */
	checkIfTextAreaIsAlone(): boolean {
		if (this.formContainers && this.formContainers.length === 1) {
			if (this.formContainers[0].formElements.length === 1) {
				const metaModel = this.getMetaModel();
				if (!metaModel) {
					return false;
				}
				const facetContext = metaModel.createBindingContext(this.formContainers[0].annotationPath);
				if (!facetContext) {
					return false;
				}
				const facet = getInvolvedDataModelObjects(facetContext).targetObject as FieldGroupType | ReferenceFacet;
				let fieldGroup: FieldGroupType | undefined;
				let identification: Identification | undefined;

				// This is only for macros:form with a FieldGroup that contains only a TextArea
				if (facet.$Type === "com.sap.vocabularies.UI.v1.FieldGroupType") {
					fieldGroup = facet;
				} else if (hasFieldGroupTarget(facet)) {
					fieldGroup = facet?.Target?.$target as FieldGroupType;
				} else if (hasIdentificationTarget(facet)) {
					identification = facet?.Target?.$target as Identification;
				}

				if (fieldGroup?.Data.length === 1) {
					return (fieldGroup.Data[0] as DataField)?.Value?.$target?.annotations?.UI?.MultiLineText?.valueOf() === true;
				}

				if (identification?.length === 1) {
					return (identification[0] as DataField)?.Value?.$target?.annotations?.UI?.MultiLineText?.valueOf() === true;
				}
			}
		}
		return false;
	}

	/**
	 * Create the proper layout information based on the `layout` property defined externally.
	 * @param isTextAreaAlone Whether the section contains a lonely TextArea inside
	 * @returns The layout information for the XML.
	 */
	getLayoutInformation(isTextAreaAlone: boolean): Control {
		let layoutConfig: FormLayoutInformation;

		if (this.layout) {
			const propertyBag = this.layout.getPropertyBag();
			layoutConfig = {
				type: propertyBag.type || "ColumnLayout",
				...propertyBag
			} as FormLayoutInformation;
		} else {
			layoutConfig = { type: "ColumnLayout", columnsM: 3, columnsXL: 6, columnsL: 4, labelCellsLarge: 12 };
		}

		switch (layoutConfig.type) {
			case "ResponsiveGridLayout":
				return (
					<ResponsiveGridLayoutControl
						adjustLabelSpan={layoutConfig.adjustLabelSpan}
						breakpointL={layoutConfig.breakpointL}
						breakpointM={layoutConfig.breakpointM}
						breakpointXL={layoutConfig.breakpointXL}
						columnsL={isTextAreaAlone ? 1 : layoutConfig.columnsL}
						columnsM={isTextAreaAlone ? 1 : layoutConfig.columnsM}
						columnsXL={isTextAreaAlone ? 1 : layoutConfig.columnsXL}
						emptySpanL={layoutConfig.emptySpanL}
						emptySpanM={layoutConfig.emptySpanM}
						emptySpanS={layoutConfig.emptySpanS}
						emptySpanXL={layoutConfig.emptySpanXL}
						labelSpanL={layoutConfig.labelSpanL}
						labelSpanM={layoutConfig.labelSpanM}
						labelSpanS={layoutConfig.labelSpanS}
						labelSpanXL={layoutConfig.labelSpanXL}
						singleContainerFullSize={layoutConfig.singleContainerFullSize}
						backgroundDesign={layoutConfig.backgroundDesign}
					/>
				);
			case "ColumnLayout":
			default:
				return (
					<ColumnLayoutControl
						columnsM={isTextAreaAlone ? 1 : layoutConfig.columnsM}
						columnsL={isTextAreaAlone ? 1 : layoutConfig.columnsL}
						columnsXL={isTextAreaAlone ? 1 : layoutConfig.columnsXL}
						labelCellsLarge={layoutConfig.labelCellsLarge}
						emptyCellsLarge={layoutConfig.emptyCellsLarge}
						backgroundDesign={layoutConfig.backgroundDesign}
					/>
				);
		}
	}

	createContent(): Control {
		const isTextAreaAlone = this.checkIfTextAreaIsAlone();
		const contextPathPath = this.contextPath;
		const metaPathObject = this.getMetaPathObject(this.metaPath, this.contextPath);
		const onChangeStr = (this.onChange && this.onChange.replace("{", "\\{").replace("}", "\\}")) || "";

		return (
			<UI5Form
				dt:designtime={this.designtime}
				fl:delegate='{         "name": "sap/fe/macros/form/FormDelegate",         "delegateType": "complete"        }'
				id={this._formContentId}
				editable={this._editable}
				visible={this.visible}
				ariaLabelledBy={this.ariaLabelledBy}
			>
				{{
					title: this.title !== undefined ? <Title text={this.title} level={this.titleLevel} /> : undefined,
					layout: this.getLayoutInformation(isTextAreaAlone),
					formContainers: this.getFormContainers(),
					dependents: <HideFormGroupAutomatically />,
					customData: [
						<CustomData key="metaPath" value={metaPathObject?.getPath()} />,
						<CustomData key="navigationPath" value={contextPathPath} />,
						<CustomData key="onChange" value={onChangeStr} />
					]
				}}
			</UI5Form>
		);
	}
}

export default FormAPI;
