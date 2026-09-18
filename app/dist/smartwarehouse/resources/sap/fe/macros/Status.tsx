import type { Property } from "@sap-ux/vocabularies-types";
import type { DataField, DataPointType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { defineUI5Class, event, implementInterface, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { isProperty } from "sap/fe/core/helpers/TypeGuards";
import { buildExpressionForCriticalityColor, buildExpressionForCriticalityIcon } from "sap/fe/core/templating/CriticalityFormatters";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { enhanceDataModelPath } from "sap/fe/core/templating/DataModelPathHelper";
import { getTooltipValue } from "sap/fe/core/templating/UIFormatters";
import { getTextBinding, getVisibleExpression } from "sap/fe/macros/field/FieldTemplating";
import type { ObjectStatus$PressEvent } from "sap/m/ObjectStatus";
import MObjectStatus from "sap/m/ObjectStatus";
import type { $ControlSettings } from "sap/ui/core/Control";
import type { IFormContent } from "sap/ui/core/library";

/**
 * Building block to display a status and criticality.
 * @public
 * @since 1.143.0
 */
@defineUI5Class("sap.fe.macros.Status")
export default class Status extends BuildingBlock<MObjectStatus> implements IFormContent {
	@implementInterface("sap.ui.core.IFormContent")
	__implements__sap_ui_core_IFormContent = true;

	/**
	 * Metadata path to the DataField annotation or property.
	 * @public
	 */
	@property({
		type: "string",
		required: true
	})
	public metaPath!: string;

	/**
	 * Context path for the binding context.
	 * @public
	 */
	@property({
		type: "string"
	})
	public contextPath?: string;

	/**
	 *  When the Status is clickable, it defines the size of the reactive area of the clickable element:
	 *
	 * - ReactiveAreaMode.Inline - The Status is displayed as part of a sentence.
	 * - ReactiveAreaMode.Overlay - The Status is displayed as an overlay on top of other interactive parts of the page.
	 * Note: It is designed to make the clickable element easier to activate and helps meet the WCAG 2.2 Target Size requirement. It is applicable only for the SAP Horizon themes. Note: The size of the reactive area is sufficiently large to help users avoid accidentally selecting (clicking or tapping) unintended UI elements. UI elements positioned over other parts of the page may need an invisible active touch area. This ensures that no elements beneath are activated accidentally when the user tries to interact with the overlay element.
	 * @public
	 */
	@property({ type: "string", allowedValues: ["Inline", "Overlay"], defaultValue: "Inline" })
	public reactiveAreaMode?: "Inline" | "Overlay";

	/**
	 * Indicates whether the ObjectStatus should be displayed in large design mode.
	 * @public
	 */
	@property({ type: "boolean" })
	public largeDesign = false;

	/**
	 * Determines whether the background color reflects the set state of the ObjectStatus instead of the control's text.
	 * @public
	 */
	@property({ type: "boolean" })
	public inverted = false;

	@property({ type: "boolean" })
	public hideIcon = false;

	/**
	 * Color palette to be used by the control. The supported values are "Standard" (default) and "Pastel".
	 * @public
	 */
	@property({ type: "string", allowedValues: ["Standard", "Pastel"], defaultValue: "Standard" })
	public colorPalette?: "Standard" | "Pastel";

	/**
	 * Press event fired when the ObjectStatus is clicked.
	 * @param event The press event
	 * @public
	 */
	@event()
	public press?: (event: ObjectStatus$PressEvent) => void;

	/**
	 * Internal property to store the data model path
	 */
	private dataModelPath?: DataModelObjectPath<DataField | DataPointType>;

	private valueDataModelPath?: DataModelObjectPath<Property>;

	/**
	 * Constructor for the Status building block.
	 * @param properties The properties object containing Status-specific settings and base control settings
	 * @param [others] Additional control settings that may be applied to the building block
	 */
	constructor(properties: $ControlSettings & PropertiesOf<Status>, others?: $ControlSettings) {
		super(properties, others);
	}

	/**
	 * Handler for the onMetadataAvailable event.
	 */
	onMetadataAvailable(): void {
		this.getTemplatingObjects();
		if (!this.dataModelPath && !this.valueDataModelPath) {
			// there cannot be a static value and no datafield or datapoint
			return;
		}
		if (!this.content) {
			this.content = this.createContent();
		}
	}

	/**
	 * Function to get the templating objects and prepare data model paths.
	 */
	private getTemplatingObjects(): void {
		// Try to get as DataField first, then as DataPoint, then as Property
		const internalDataModelPath = this.getDataModelObjectForMetaPath<DataField | DataPointType | Property>(
			this.metaPath,
			this.contextPath
		);
		const targetObject = internalDataModelPath?.targetObject;

		if (!internalDataModelPath) {
			return;
		}
		if (isProperty(targetObject)) {
			if (targetObject?.annotations?.UI?.DataFieldDefault !== undefined) {
				this.dataModelPath = this.getDataModelObjectForMetaPath<DataField>(
					`${this.metaPath}@${UIAnnotationTerms.DataFieldDefault}`,
					this.contextPath
				);
			}
			this.valueDataModelPath = internalDataModelPath as DataModelObjectPath<Property>;
		} else {
			this.dataModelPath = internalDataModelPath as DataModelObjectPath<DataField | DataPointType>;
			if (this.dataModelPath?.targetObject?.Value?.path) {
				this.valueDataModelPath = enhanceDataModelPath<Property>(internalDataModelPath, this.dataModelPath.targetObject.Value.path);
			}
		}
	}

	/**
	 * Gets the criticality expression for the ObjectStatus.
	 * @returns The compiled binding expression for criticality color, or undefined if no criticality is available
	 */
	private getCriticalityExpression(colorPalette?: string): CompiledBindingToolkitExpression | undefined {
		const pastelColorMap = {
			Negative: "Indication12",
			Critical: "Indication13",
			Positive: "Indication14",
			Information: "Indication15",
			Neutral: "Indication20"
		};
		const specificColorMap = colorPalette === "Pastel" ? pastelColorMap : undefined;
		return this.dataModelPath === undefined
			? undefined
			: buildExpressionForCriticalityColor(this.dataModelPath, this.dataModelPath, specificColorMap);
	}

	/**
	 * Gets the criticality icon expression for the ObjectStatus.
	 * @returns The compiled binding expression for criticality icon, or undefined if no criticality is available
	 */
	private getCriticalityIconExpression(): CompiledBindingToolkitExpression | undefined {
		return this.dataModelPath === undefined ? undefined : buildExpressionForCriticalityIcon(this.dataModelPath, this.dataModelPath);
	}

	/**
	 * Gets the text binding expression for the ObjectStatus.
	 * @returns The compiled binding expression for the ObjectStatus text content
	 */
	private getObjectStatusTextBinding(): CompiledBindingToolkitExpression {
		const propertyOrDataFieldDataModelObjectPath = (this.valueDataModelPath ?? this.dataModelPath) as DataModelObjectPath<
			Property | DataField | DataPointType
		>;
		return getTextBinding(propertyOrDataFieldDataModelObjectPath, {}) as CompiledBindingToolkitExpression;
	}

	/**
	 * Creates the ObjectStatus control content.
	 * @returns The configured ObjectStatus control ready for rendering
	 */
	createContent(): MObjectStatus {
		const statusConfig = this.getAppComponent()?.getAdditionalConfiguration()?.["sap.fe.macros"]?.Status;
		const dataFieldOrPropertyDataModelObjectPath = (this.dataModelPath ?? this.valueDataModelPath) as DataModelObjectPath<
			Property | DataField | DataPointType
		>;
		const visible = getVisibleExpression(dataFieldOrPropertyDataModelObjectPath);
		if (this.isPropertyInitial("colorPalette")) {
			this.colorPalette = statusConfig?.colorPalette ?? "Standard";
		}
		const criticalityExpression = this.getCriticalityExpression(this.colorPalette);
		const criticalityIconExpression = this.getCriticalityIconExpression();
		const textBinding = this.getObjectStatusTextBinding();
		const isActive = this.hasListeners("press");
		if (this.isPropertyInitial("inverted")) {
			// if inverted is not set, use the default from configuration
			this.inverted = statusConfig?.invertedDefaultValue === true;
		}
		if (this.largeDesign) {
			this.hideIcon = true;
		}
		const toolTipValue = getTooltipValue(this.dataModelPath, this.valueDataModelPath);

		return (
			<MObjectStatus
				id={generate([this.getId(), "ObjectStatus"])}
				inverted={this.inverted}
				class={this.largeDesign ? "sapMObjectStatusLarge sapMObjectStatusLongText" : undefined}
				state={criticalityExpression}
				tooltip={toolTipValue}
				icon={this.hideIcon ? undefined : criticalityIconExpression}
				text={textBinding}
				visible={visible}
				active={isActive}
				reactiveAreaMode={this.reactiveAreaMode}
				press={(pressEvent: ObjectStatus$PressEvent): void => {
					this.fireEvent("press", pressEvent);
				}}
			/>
		);
	}
}
