import type { Property } from "@sap-ux/vocabularies-types";
import type { PropertyAnnotations_Common } from "@sap-ux/vocabularies-types/vocabularies/Common_Edm";
import Log from "sap/base/Log";
import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, constant, formatResult } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { SAP_UI_MODEL_CONTEXT } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import { getMaxConditions } from "sap/fe/core/converters/controls/ListReport/FilterField";
import type { VisualFilters } from "sap/fe/core/converters/controls/ListReport/VisualFilters";
import standardFormatter from "sap/fe/core/formatters/StandardFormatter";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { getContextRelativeTargetObjectPath, getTargetObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { getRelativePropertyPath } from "sap/fe/core/templating/PropertyFormatters";
import { getAssociatedExternalIdPropertyPath } from "sap/fe/core/templating/PropertyHelper";
import type { DisplayMode } from "sap/fe/core/templating/UIFormatters";
import { getDisplayMode, type ComputedAnnotationInterface, type MetaModelContext } from "sap/fe/core/templating/UIFormatters";
import FieldHelper from "sap/fe/macros/field/FieldHelper";
import CustomData from "sap/ui/core/CustomData";
import FieldHelpCustomData from "sap/ui/core/fieldhelp/FieldHelpCustomData";
import type { $ControlSettings } from "sap/ui/mdc/Control";
import MDCFilterField from "sap/ui/mdc/FilterField";
import type Context from "sap/ui/model/Context";
import type MetaModel from "sap/ui/model/MetaModel";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import CommonHelper from "../CommonHelper";
import {
	constraints,
	formatOptions,
	getConditionsBinding,
	getDataType,
	getPlaceholder,
	isRequiredInFilter
} from "../filter/FilterFieldHelper";
import { getFilterFieldDisplayFormat } from "../filter/FilterFieldTemplating";
import InParameter from "../visualfilters/InParameter";
import VisualFilter from "../visualfilters/VisualFilter";
import ExtendedSemanticDateOperators from "./ExtendedSemanticDateOperators";

export default class FilterFieldCreator {
	/**
	 * Defines the metadata path to the property.
	 */
	propertyPath!: string;

	metaModel!: ODataMetaModel;

	contextPath!: string;

	visualFilter?: Context | VisualFilters;

	/**
	 * A prefix that is added to the generated ID of the filter field.
	 */

	idPrefix!: string;

	/**
	 * A prefix that is added to the generated ID of the value help used for the filter field.
	 */
	vhIdPrefix!: string;

	/**
	 * Specifies the Sematic Date Range option for the filter field.
	 */
	useSemanticDateRange = true;

	/**
	 * Settings from the manifest.
	 */
	settings = {};

	/**
	 * Speficies the enablement of the filter field.
	 */
	editMode?: string;

	/**
	 * The property name of the FilterField
	 * @public
	 */
	key!: string;

	slotName?: string;

	/***********************************************
	 *            INTERNAL ATTRIBUTES              *
	 **********************************************/
	/**
	 * Control Id for MDC filter field used inside.
	 */
	controlId!: string;

	/**
	 * Property key for filter field.
	 */
	propertyKey!: string;

	/**
	 * Source annotation path of the property.
	 */
	sourcePath!: string;

	/**
	 * Source annotation path of the property.
	 */
	documentRefText?: string;

	/**
	 * Label for filterfield.
	 */
	label!: string;

	/**
	 * Tooltip content from @Common.QuickInfo annotation
	 */
	tooltip?: string;

	/**
	 * Data Type of the filter field.
	 */
	dataType!: string;

	/**
	 * Maximum conditions that can be added to the filter field.
	 */
	maxConditions!: number;

	/**
	 * Value Help id as association for the filter field.
	 */
	valueHelpProperty?: string;

	/**
	 * Binding path for conditions added to filter field.
	 */
	conditionsBinding!: string;

	/**
	 * Datatype constraints of the filter field.
	 */
	dataTypeConstraints?: string;

	/**
	 * Datatype format options of the filter field.
	 */
	dataTypeFormatOptions?: string;

	/**
	 * To specify filter field is mandatory for filtering.
	 */
	required!: boolean;

	/**
	 * Valid operators for the filter field.
	 */
	operators?: string;

	/**
	 * Visual Filter building block id to be used.
	 */
	vfRuntimeId?: string;

	/**
	 * Visual Filter id to be used.
	 */
	vfId?: string;

	/**
	 * Visual Filter is expected.
	 */
	vfEnabled!: boolean;

	/**
	 * Property used is filterable
	 */
	isFilterable!: boolean;

	/**
	 * Property for placeholder
	 */
	placeholder?: string;

	/**
	 * Property to hold promise for display
	 */
	display?: DisplayMode;

	/**
	 * Property to hold promise for display value asynchronously fetched based on value help annotations
	 */
	displayPromise: Promise<DisplayMode | undefined> = Promise.resolve(undefined);

	propertyExternalId?: string;

	mdcFilterField: MDCFilterField | undefined = undefined;

	constructor(props: $ControlSettings & PropertiesOf<FilterFieldCreator>) {
		this.idPrefix = props.idPrefix ?? "FilterField";
		this.vhIdPrefix = props.vhIdPrefix ?? "FilterFieldValueHelp";
		this.propertyPath = props.propertyPath as string;
		this.contextPath = props.contextPath as string;
		this.useSemanticDateRange = props.useSemanticDateRange ?? true;
		this.editMode = props.editMode as string;
		this.required = props.required as boolean;
		this.settings = props.settings ?? {};
		this.visualFilter = props.visualFilter as VisualFilters;
		this.label = props.label ?? "";
		this.metaModel = props.metaModel as ODataMetaModel;
		this.prepareFilterField(this.metaModel);
	}

	prepareFilterField(metaModel: ODataMetaModel): void {
		this.vfEnabled = !!this.visualFilter && !(this.idPrefix && this.idPrefix.includes("Adaptation"));
		const propertyDataModelObject = MetaModelConverter.getInvolvedDataModelObjects<Property>(
			metaModel?.getContext(this.propertyPath),
			metaModel?.getContext(this.contextPath)
		);
		const propertyConverted = propertyDataModelObject?.targetObject as Property;
		const externalIdPropertyPath = getAssociatedExternalIdPropertyPath(propertyConverted) as string;
		if (externalIdPropertyPath) {
			this.propertyExternalId = this.propertyPath.replace(propertyConverted.name, externalIdPropertyPath);
		}
		const propertyConvertedExternalId = this.propertyExternalId
			? (MetaModelConverter.getInvolvedDataModelObjects(
					metaModel?.getContext(this.propertyExternalId),
					metaModel?.getContext(this.contextPath)
			  )?.targetObject as Property)
			: undefined;
		// Property settings
		const propertyName = propertyConverted.name,
			originalPropertyName = propertyConverted.name,
			fixedValues =
				!!propertyConvertedExternalId?.annotations?.Common?.ValueListWithFixedValues ||
				!!propertyConverted.annotations?.Common?.ValueListWithFixedValues;
		this.controlId = this.idPrefix && generate([this.idPrefix, originalPropertyName]);
		this.sourcePath = getTargetObjectPath(propertyDataModelObject);
		type PropertyAnnotations_Common_extended = PropertyAnnotations_Common & { DocumentationRef?: string };
		this.documentRefText = (
			(propertyDataModelObject?.targetObject as Property)?.annotations.Common as PropertyAnnotations_Common_extended
		)?.DocumentationRef?.toString();
		this.tooltip = propertyConverted?.annotations?.Common?.QuickInfo?.toString();
		this.dataType = getDataType(propertyConvertedExternalId || propertyConverted); // data type for LR-FilterBar condition of the value help
		const labelTerm = this.label ? this.label : propertyConverted?.annotations?.Common?.Label;
		const labelExpression = labelTerm?.toString() ?? constant(propertyName);
		this.label = compileExpression(labelExpression) || propertyName;
		this.conditionsBinding = getConditionsBinding(propertyDataModelObject) || "";
		this.placeholder = getPlaceholder(propertyConverted);
		this.propertyKey = getContextRelativeTargetObjectPath(propertyDataModelObject, false, true) || propertyName;
		// Visual Filter settings
		this.vfEnabled = !!this.visualFilter && !(this.idPrefix && this.idPrefix.includes("Adaptation"));
		this.vfId = this.vfEnabled ? generate([this.idPrefix, propertyName, "VisualFilter"]) : undefined;
		this.vfRuntimeId = this.vfEnabled ? generate([this.idPrefix, propertyName, "VisualFilterContainer"]) : undefined;

		//-----------------------------------------------------------------------------------------------------//
		// TODO: need to change operations from MetaModel to Converters.
		// This mainly included changing changing getFilterRestrictions operations from metaModel to converters
		const propertyContext = metaModel?.createBindingContext(this.propertyPath),
			model: MetaModel = propertyContext?.getModel(),
			vhPropertyPath: string = FieldHelper.valueHelpPropertyForFilterField(propertyContext as Context),
			filterable = CommonHelper.isPropertyFilterable(propertyContext as Context),
			propertyObject = propertyContext?.getObject(),
			propertyInterface = { context: propertyContext } as ComputedAnnotationInterface;
		this.displayPromise = this.calculateAndSetDisplay(metaModel, propertyDataModelObject, propertyConverted, propertyInterface);
		this.isFilterable = !(filterable === false || filterable === "false");
		this.maxConditions = getMaxConditions(propertyDataModelObject);
		this.dataTypeConstraints = constraints(propertyObject, propertyInterface, true);
		this.dataTypeFormatOptions = formatOptions(propertyObject, propertyInterface, true);
		this.required = this?.required ?? isRequiredInFilter(propertyObject, propertyInterface);
		this.operators = FieldHelper.operators(
			propertyContext as Context,
			propertyObject,
			this.useSemanticDateRange,
			Object.keys(this.settings).length ? JSON.stringify(this.settings) : "",
			this.contextPath
		);
		if (this.operators) {
			// Extended operators are not added by default.
			// We add them to MDC filter environment.
			ExtendedSemanticDateOperators.addExtendedFilterOperators(this.operators.split(","));
		}
		// Value Help settings
		// TODO: This needs to be updated when VH macro is converted to 2.0
		const vhProperty = model.createBindingContext(vhPropertyPath) as Context;
		const vhPropertyObject = vhProperty.getObject() as MetaModelContext,
			vhPropertyInterface = { context: vhProperty },
			relativeVhPropertyPath = getRelativePropertyPath(vhPropertyObject, vhPropertyInterface),
			relativePropertyPath = getRelativePropertyPath(propertyObject, propertyInterface);
		this.valueHelpProperty = FieldHelper.getValueHelpPropertyForFilterField(
			propertyContext as Context,
			propertyObject,
			propertyObject.$Type,
			this.vhIdPrefix,
			propertyDataModelObject?.targetEntityType?.name,
			relativePropertyPath,
			relativeVhPropertyPath,
			fixedValues,
			this.useSemanticDateRange
		);
	}

	getCustomData(): CustomData[] {
		const companionTextAvailable = this.documentRefText === undefined || null ? false : true;
		const formattedResult: CompiledBindingToolkitExpression = compileExpression(
			formatResult([this.documentRefText], standardFormatter.asArray)
		);
		const customData = [];
		customData.push(<CustomData key="sourcePath" value={this.sourcePath}></CustomData>);
		if ((this.visualFilter as VisualFilters)?.valueListQualifier) {
			customData.push(
				<CustomData key="valueListQualifier" value={(this.visualFilter as VisualFilters).valueListQualifier || ""}></CustomData>
			);
		}
		if (companionTextAvailable) {
			customData.push(<FieldHelpCustomData value={formattedResult || null}></FieldHelpCustomData>);
		}
		return customData;
	}

	getVisualFilterContent(): string {
		let visualFilterObject = this.visualFilter;
		if (!this.vfEnabled || !visualFilterObject) {
			return "";
		}
		if ((visualFilterObject as Context)?.isA?.(SAP_UI_MODEL_CONTEXT)) {
			visualFilterObject = (visualFilterObject as Context).getObject() as VisualFilters;
		}

		const {
			contextPath,
			presentationAnnotation,
			outParameter,
			inParameters,
			valuelistProperty,
			selectionVariantAnnotation,
			multipleSelectionAllowed,
			required,
			requiredProperties = [],
			showOverlayInitially,
			renderLineChart,
			isValueListWithFixedValues
		} = visualFilterObject as VisualFilters;
		return (
			<VisualFilter
				id={this.vfRuntimeId}
				_contentId={this.vfId}
				contextPath={contextPath}
				metaPath={presentationAnnotation}
				outParameter={outParameter}
				valuelistProperty={valuelistProperty}
				selectionVariantAnnotation={selectionVariantAnnotation}
				multipleSelectionAllowed={multipleSelectionAllowed}
				required={required}
				requiredProperties={requiredProperties}
				showOverlayInitially={showOverlayInitially}
				renderLineChart={renderLineChart}
				isValueListWithFixedValues={isValueListWithFixedValues}
				filterBarEntityType={contextPath}
			>
				{{
					inParameters: inParameters?.map((param) => (
						<InParameter localDataProperty={param.localDataProperty} valueListProperty={param.valueListProperty} />
					))
				}}
			</VisualFilter>
		);
	}

	_getFilterField(): MDCFilterField {
		return (
			<MDCFilterField
				id={this.controlId}
				delegate={{ name: "sap/fe/macros/field/FieldBaseDelegate", payload: { isFilterField: true } }}
				propertyKey={this.propertyKey}
				label={this.label}
				dataType={this.dataType}
				maxConditions={this.maxConditions}
				valueHelp={this.valueHelpProperty}
				conditions={this.conditionsBinding}
				dataTypeConstraints={this.dataTypeConstraints}
				dataTypeFormatOptions={this.dataTypeFormatOptions}
				required={this.required}
				operators={this.operators}
				placeholder={this.placeholder}
				editMode={this.editMode}
				display={this.display}
				tooltip={this.tooltip}
			>
				{{ customData: this.getCustomData() }}
				{{ content: this.vfEnabled ? this.getVisualFilterContent() : {} }}
			</MDCFilterField>
		);
	}

	/**
	 * Calculates and sets the display property asynchronously for the filter field.
	 * This is required as the display property is calculated based on the value help property which requires async calls to fetch the annotations.
	 * Side effects: Sets this.display with the calculated DisplayMode value, and updates this.mdcFilterField.setDisplay() if the control has already been created.
	 * @param metaModel The ODataMetaModel instance
	 * @param propertyDataModelObject DataModelObjectPath for the property
	 * @param propertyConverted The converted property definition
	 * @param propertyInterface The computed annotation interface
	 * @returns Promise resolving to the DisplayMode or undefined if calculation fails
	 */
	private async calculateAndSetDisplay(
		metaModel: ODataMetaModel,
		propertyDataModelObject: DataModelObjectPath<Property>,
		propertyConverted: Property,
		propertyInterface: ComputedAnnotationInterface
	): Promise<DisplayMode | undefined> {
		try {
			const dataModelPathExternalId =
				this.propertyExternalId &&
				MetaModelConverter.getInvolvedDataModelObjects(
					metaModel.getContext(this.propertyExternalId),
					metaModel.getContext(this.contextPath)
				)?.targetObject;
			this.display = dataModelPathExternalId
				? getDisplayMode(dataModelPathExternalId as DataModelObjectPath<Property>)
				: await getFilterFieldDisplayFormat(propertyDataModelObject, propertyConverted, propertyInterface);
			if (this.mdcFilterField) {
				this.mdcFilterField.setDisplay(this.display);
			}
			return this.display;
		} catch (err: unknown) {
			Log.error(`FE : FilterField BuildingBlock : Error fetching display property for ${this.sourcePath} : ${err}`);
		}
	}

	getMDCFilterField(): MDCFilterField | undefined {
		try {
			// Return cached value
			if (this.mdcFilterField || this.isFilterable === false) {
				return this.mdcFilterField;
			}

			// Return MDCFilterField directly and handle display property separately
			this.mdcFilterField = this._getFilterField();
			return this.mdcFilterField;
		} catch (err: unknown) {
			Log.error(`FE : FilterField BuildingBlock : Error preparing filter field for ${this.sourcePath} : ${err}`);
		}
	}
}
