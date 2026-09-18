import type { Property } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import { constant } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { aggregation, defineUI5Class, event, mixin, property } from "sap/fe/base/ClassSupport";
import type { TemplateProcessorSettings } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { getAssociatedCurrencyProperty, getAssociatedUnitProperty, hasValueHelp } from "sap/fe/core/templating/PropertyHelper";
import type CheckBox from "sap/m/CheckBox";
import type { CheckBox$SelectEvent } from "sap/m/CheckBox";
import type InputBase from "sap/m/InputBase";
import type { InputBase$ChangeEvent } from "sap/m/InputBase";
import type RatingIndicator from "sap/m/RatingIndicator";
import type UI5Event from "sap/ui/base/Event";
import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import type { $ControlSettings } from "sap/ui/core/Control";
import FieldEditMode from "sap/ui/mdc/enums/FieldEditMode";
import type PropertyBinding from "sap/ui/model/PropertyBinding";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type { EventHandler } from "types/extension_types";
import MacroAPI from "./MacroAPI";
import ValueHelp from "./ValueHelp";
import type FieldFormatOptions from "./field/FieldFormatOptions";
import FieldMixin from "./field/mixin/FieldMixin";
import EditStyle from "./internal/field/EditStyle";
import type { FieldBlockProperties, InputFieldBlockProperties } from "./internal/field/FieldStructureHelper";
import { setUpField } from "./internal/field/FieldStructureHelper";

/**
 * Building block for creating an always-editable field based on metadata provided by OData V4.
 * <br>
 * This building block is designed for use with JSON model bindings in custom dialogs and popups,
 * where the field must always be editable regardless of OData metadata or draft status.
 * <br>
 * When creating an AlwaysEditableField building block, you must provide an ID.
 *
 * Usage example:
 * <pre>
 * &lt;macros:AlwaysEditableField
 * id="MyAlwaysEditableField"
 * metaPath="MyProperty"
 * value="{myJSONModel>/myValue}"
 * description="{myJSONModel>/myDescription}" /&gt;
 * </pre>
 * @mixes sap.fe.macros.field.mixin.FieldMixin
 * @alias sap.fe.macros.AlwaysEditableField
 * @public
 */
@defineUI5Class("sap.fe.macros.AlwaysEditableField", {
	returnTypes: ["sap.fe.core.controls.FormElementWrapper"]
})
@mixin(FieldMixin)
export default class AlwaysEditableField extends MacroAPI<{ id?: string }> {
	// id is inherited from Control but needs to be accessible in TypeScript
	// Do not use @property decorator to avoid PropertyBindingInfo type conflict in generated .d.ts
	id!: string;

	/**
	 * Defines the relative path of the property in the metamodel, based on the current contextPath.
	 * AlwaysEditableField only supports metadata paths with the Property type.
	 * @public
	 */
	@property({
		type: "string",
		expectedTypes: ["Property"]
	})
	public readonly metaPath!: string;

	/**
	 * Defines the path of the context used in the current page or block.
	 * This setting is defined by the framework.
	 * @public
	 */
	@property({
		type: "string",
		expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"]
	})
	public contextPath!: string;

	/**
	 * This is used to optionally provide an external value that comes from a different model than the OData model.
	 * Typically used with JSON models for custom popup scenarios.
	 * @public
	 */
	@property({
		type: "string",
		bindable: true,
		isBindingInfo: true,
		required: false
	})
	public readonly value?: string | PropertyBindingInfo;

	/**
	 * This is used to optionally provide an external description that comes from a different model than the oData model.
	 * This must be used in conjunction with the value property.
	 * @public
	 */
	@property({
		type: "string",
		bindable: true,
		isBindingInfo: true,
		required: false
	})
	public readonly description?: string | PropertyBindingInfo;

	/**
	 * A set of options that can be configured.
	 * @public
	 */
	@aggregation({ type: "sap.fe.macros.field.FieldFormatOptions" })
	public readonly formatOptions?: FieldFormatOptions;

	/**
	 * Prefix added to the generated ID of the value help used for the field.
	 * @public
	 */
	@property({
		type: "string"
	})
	public vhIdPrefix?: string;

	/**
	 * An event containing details is triggered when the value of the field is changed.
	 * @public
	 */
	@event()
	change!: EventHandler<UI5Event<{ value: string | number | boolean | undefined; isValid: boolean }, AlwaysEditableField>>;

	/**
	 * An event containing details is triggered when the value of the field is live changed.
	 * <br>
	 * <b>Note:</b> Browsing autocomplete suggestions does not fire the event.
	 * @public
	 */
	@event()
	liveChange!: EventHandler<UI5Event<{}, AlwaysEditableField>>;

	customValueBinding?: boolean | string | number | PropertyBindingInfo;

	dataModelPath?: DataModelObjectPath<Property>;

	constructor(props?: PropertiesOf<AlwaysEditableField> & { id?: string }, others?: $ControlSettings) {
		super(props, others);
	}

	override applySettings(mSettings: PropertiesOf<AlwaysEditableField, "change" | "liveChange">, oScope?: object): this {
		this._doNotCreateOnNullContext = true; // We don't want to create the field if there is no context
		return super.applySettings(mSettings, oScope);
	}

	/**
	 * Called when metadata is available. Creates the AlwaysEditableField content.
	 */
	onMetadataAvailable(): void {
		if (!this.content) {
			const preparedProperties = this.prepareProperties();
			if (preparedProperties) {
				this.createContent(preparedProperties);
			}
		}
	}

	/**
	 * Handles the change event for the edit field.
	 * @param changeEvent The change event object
	 */
	handleChange(
		changeEvent: UI5Event<
			{
				selected?: boolean;
				value?: string | number;
				valid?: boolean;
				promise?: Promise<void>;
			},
			CheckBox | InputBase | Control | RatingIndicator
		>
	): void {
		const source = changeEvent.getSource();
		const customValueBinding = this.customValueBinding;

		// Type guard: Only process if customValueBinding is a PropertyBindingInfo object or resolved binding
		if (customValueBinding && typeof customValueBinding === "object") {
			let newValue;
			let valueModel: JSONModel | undefined;
			let bindingPath: string | undefined;
			let modelName: string | undefined;

			// Check if this is a resolved binding object with a binding property
			if ("binding" in customValueBinding && customValueBinding.binding) {
				const binding = customValueBinding.binding as PropertyBinding;
				valueModel = binding.getModel() as JSONModel | undefined;
				bindingPath = binding.getPath();
			} else if ("path" in customValueBinding) {
				// Raw PropertyBindingInfo
				modelName = "model" in customValueBinding ? (customValueBinding.model as string) : undefined;
				valueModel = source?.getModel(modelName) as JSONModel | undefined;
				bindingPath = customValueBinding.path as string;
			}

			if (valueModel && bindingPath) {
				if (source.isA("sap.m.CheckBox")) {
					newValue = (changeEvent as CheckBox$SelectEvent).getParameter("selected");
				} else {
					newValue = (changeEvent as InputBase$ChangeEvent).getParameter("value");
				}

				valueModel.setProperty(bindingPath, newValue);
				valueModel.updateBindings(true);
			}
		}

		this.fireEvent("change", {
			value: (changeEvent as InputBase$ChangeEvent).getParameter("value"),
			isValid: changeEvent.getParameter("valid") ?? true
		});
	}

	/**
	 * Handles the live change event for the edit field.
	 * @param _liveChangeEvent The live change event object
	 */
	handleLiveChange(_liveChangeEvent: UI5Event<{}, Control>): void {
		this.fireEvent("liveChange", {});
	}

	/**
	 * Gets the ValueHelp template ID for a field if it has a value help configured.
	 * @param field The field block properties
	 * @returns The ValueHelp template ID or undefined
	 * @private
	 */
	private getPossibleValueHelpTemplateId(field: FieldBlockProperties): string | undefined {
		// For currency (and later Unit) we need to forward the value help to the annotated field
		const targetProperty = getAssociatedCurrencyProperty(field.property) ?? getAssociatedUnitProperty(field.property) ?? field.property;
		if (targetProperty && hasValueHelp(targetProperty)) {
			// depending on whether this one has a value help annotation included, add the dependent
			const vhTemplate = ValueHelp.getValueHelpForMetaPath(
				this.getPageController(),
				field.dataSourcePath!,
				field.contextPath?.getPath(),
				this.getMetaModel(),
				field._requiresValidation
			);
			return vhTemplate?.getContent()?.getId();
		}
		return "";
	}

	/**
	 * Prepares the properties for the AlwaysEditableField building block.
	 * @returns The prepared properties
	 */
	prepareProperties(): FieldBlockProperties | undefined {
		const viewDataModel = this.getModel("viewData") as JSONModel;
		const internalModel = this.getModel("internal") as JSONModel;
		const appComponent = this.getAppComponent();
		const odataMetaModel = this.getMetaModel();

		const resolvedContextPath = this.contextPath ?? this._getOwner()?.preprocessorContext?.fullContextPath;
		if (!resolvedContextPath) {
			Log.error("AlwaysEditableField: contextPath is undefined");
			return undefined;
		}

		// Create Context objects from string paths like Field.ts does
		const computedContextPath = odataMetaModel!.getMetaContext(resolvedContextPath);
		const fullMetaPath = computedContextPath.getPath() + "/" + this.metaPath;
		const computedMetaPath = odataMetaModel!.createBindingContext(fullMetaPath);

		// Convert AlwaysEditableField properties to InputFieldBlockProperties format
		const fieldProperties: InputFieldBlockProperties = {
			id: this.id,
			contextPath: resolvedContextPath,
			metaPath: this.metaPath,
			value: this.value,
			description: this.description,
			formatOptions: this.formatOptions,
			vhIdPrefix: this.vhIdPrefix,
			change: this.change as EventHandler,
			liveChange: this.liveChange as EventHandler,
			// Force read-only to false - AlwaysEditableField is always editable
			readOnly: constant(false),
			// No edit mode specified - will be overridden below
			editMode: undefined
		};

		// Call the standard Field setup function with Context objects
		// Empty controlConfiguration - used only for field override lookups, which we don't have at runtime
		const preparedProperties = setUpField(
			fieldProperties,
			{} as TemplateProcessorSettings,
			viewDataModel,
			internalModel,
			appComponent!,
			false, // isReadOnlyInitial = false
			computedMetaPath!,
			computedContextPath
		);

		// Override computed properties to force always-editable behavior
		// This is the key difference from standard Field - AlwaysEditableField ignores OData editability
		Object.assign(preparedProperties, {
			editMode: FieldEditMode.Editable,
			computedEditMode: FieldEditMode.Editable,
			editableExpression: "true",
			enabledExpression: "true"
		});

		preparedProperties.isDynamicInstantiation = true;
		preparedProperties.getTranslatedText = this.getTranslatedText.bind(this);
		if (preparedProperties.ariaLabelledBy === undefined) {
			preparedProperties.ariaLabelledBy = [];
		}
		this.dataModelPath = preparedProperties.dataModelPath;

		return preparedProperties;
	}

	/**
	 * Creates the content for the AlwaysEditableField building block.
	 * @param preparedProperties The prepared properties for the AlwaysEditableField building block
	 * @returns The created content control
	 */
	createContent(preparedProperties: FieldBlockProperties): Control {
		try {
			// Store custom value binding if provided
			if (typeof preparedProperties.value !== "string") {
				this.customValueBinding = preparedProperties.value;
			}

			// Wire event handlers
			preparedProperties.eventHandlers.change = this.handleChange.bind(this);
			preparedProperties.eventHandlers.liveChange = this.handleLiveChange.bind(this);

			// Generate value help ID if needed
			if (preparedProperties.editStyle === "InputWithValueHelp") {
				preparedProperties.valueHelpId = this.getPossibleValueHelpTemplateId(preparedProperties);
			}

			// Create the content using inline template methods
			this.content = EditStyle.getTemplateWithWrapper(preparedProperties) as unknown as Control;
		} catch (e) {
			if (e instanceof Error) {
				Log.error("Error in createContent of AlwaysEditableField: " + e.message);
			} else {
				Log.error("An unknown error occurred in AlwaysEditableField");
			}
		}
		return this.content;
	}
}
