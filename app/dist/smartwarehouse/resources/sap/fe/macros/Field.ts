import type { Property } from "@sap-ux/vocabularies-types";
import type {
	DataFieldAbstractTypes,
	DataFieldForAction,
	DataFieldWithNavigationPath,
	DataPointTypeTypes,
	OperationGroupingType
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import uid from "sap/base/util/uid";
import { compileExpression, type CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { aggregation, association, defineUI5Class, event, mixin, property, xmlEventHandler } from "sap/fe/base/ClassSupport";
import CommonUtils from "sap/fe/core/CommonUtils";
import type PageController from "sap/fe/core/PageController";
import type { XMLPreprocessorContext } from "sap/fe/core/TemplateComponent";
import type { TemplateProcessorSettings } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import { Activity } from "sap/fe/core/controllerextensions/collaboration/CollaborationCommon";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { getContextRelativeTargetObjectPath, type DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import type Contact from "sap/fe/macros/contact/Contact";
import type BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";
import FieldRuntime from "sap/fe/macros/field/FieldRuntime";
import { getDataModelObjectPathForValue } from "sap/fe/macros/field/FieldTemplating";
import * as FieldStructure from "sap/fe/macros/internal/field/FieldStructure";
import type { FieldBlockProperties, InputFieldBlockProperties } from "sap/fe/macros/internal/field/FieldStructureHelper";
import { setUpField } from "sap/fe/macros/internal/field/FieldStructureHelper";
import type { Button$PressEvent } from "sap/m/Button";
import type CheckBox from "sap/m/CheckBox";
import type { CheckBox$SelectEvent, CheckBox$SelectEventParameters } from "sap/m/CheckBox";
import type InputBase from "sap/m/InputBase";
import type { InputBase$ChangeEvent, InputBase$ChangeEventParameters } from "sap/m/InputBase";
import type Label from "sap/m/Label";
import type Link from "sap/m/Link";
import MessageToast from "sap/m/MessageToast";
import type RatingIndicator from "sap/m/RatingIndicator";
import type { RatingIndicator$ChangeEventParameters } from "sap/m/RatingIndicator";
import type UI5Event from "sap/ui/base/Event";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import type { Control$ValidateFieldGroupEvent } from "sap/ui/core/Control";
import LabelEnablement from "sap/ui/core/LabelEnablement";
import type Messaging from "sap/ui/core/Messaging";
import type MessageType from "sap/ui/core/message/MessageType";
import type FormElement from "sap/ui/layout/form/FormElement";
import type { Field$ChangeEvent, Field$ChangeEventParameters, default as mdcField } from "sap/ui/mdc/Field";
import type FieldEditMode from "sap/ui/mdc/enums/FieldEditMode";
import type Binding from "sap/ui/model/Binding";
import type Context from "sap/ui/model/Context";
import JSONModel from "sap/ui/model/json/JSONModel";
import type { default as ODataV4Context, default as V4Context } from "sap/ui/model/odata/v4/Context";
import type ODataContextBinding from "sap/ui/model/odata/v4/ODataContextBinding";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type FileUploader from "sap/ui/unified/FileUploader";
import type {
	FileUploader$ChangeEvent,
	FileUploader$FileSizeExceedEvent,
	FileUploader$TypeMissmatchEvent
} from "sap/ui/unified/FileUploader";
import type { EventHandler } from "types/extension_types";
import type { MetaModelEnum, MetaModelType } from "../../../../../../types/metamodel_types";
import MacroAPI from "./MacroAPI";
import type Email from "./contact/Email";
import type FieldFormatOptions from "./field/FieldFormatOptions";
import FieldRuntimeHelper from "./field/FieldRuntimeHelper";
import FieldMixin from "./field/mixin/FieldMixin";
import InlineEdit from "./inlineEdit/InlineEdit";

type ControlWithAccessibility = Control & { addAriaLabelledBy?: (id: string) => void; getAriaLabelledBy: () => string[] };
/**
 * Building block for creating a field based on the metadata provided by OData V4.
 * <br>
 * Usually, a DataField or DataPoint annotation is expected, but the field can also be used to display a property from the entity type.
 * When creating a Field building block, you must provide an ID to ensure everything works correctly.
 *
 *
 * Usage example:
 * <pre>
 * &lt;macros:Field id="MyField" metaPath="MyProperty" /&gt;
 * </pre>
 * <a href="/sapui5-sdk-internal/test-resources/sap/fe/core/fpmExplorer/index.html#/buildingBlocks/buildingBlockOverview" target="_blank" >Overview of Building Blocks</a>
 * @mixes sap.fe.macros.field.mixin.FieldMixin
 * @alias sap.fe.macros.Field
 * @public
 */
@defineUI5Class("sap.fe.macros.Field", {
	returnTypes: [
		"sap.fe.core.controls.FormElementWrapper" /*, not sure i want to add those yet "sap.fe.macros.Field", "sap.m.HBox", "sap.fe.macros.controls.ConditionalWrapper", "sap.m.Button"*/
	]
})
@mixin(InlineEdit)
@mixin(FieldMixin)
class Field extends MacroAPI<{ readOnly: boolean; semanticObject: string }> {
	/**
	 * An expression that allows you to control the editable state of the field.
	 *
	 * If you do not set any expression, SAP Fiori elements hooks into the standard lifecycle to determine if the page is currently editable.
	 * Please note that you cannot set a field to editable if it has been defined in the annotation as not editable.
	 * @private
	 * @deprecated
	 */
	@property({ type: "boolean" })
	public readonly editable!: boolean;

	/**
	 * An expression that allows you to control the read-only state of the field.
	 *
	 * If you do not set any expression, SAP Fiori elements hooks into the standard lifecycle to determine the current state.
	 * @public
	 */
	@property({ type: "boolean", bindToState: true })
	public readOnly!: boolean;

	/**
	 * The identifier of the Field control.
	 */
	@property({ type: "string" })
	public id!: string;

	/**
	 * Defines the relative path of the property in the metamodel, based on the current contextPath.
	 * @public
	 */
	@property({
		type: "string",
		expectedAnnotations: [],
		expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty", "Property"]
	})
	public readonly metaPath!: string;

	/**
	 * Wrap field
	 */
	@property({
		type: "boolean"
	})
	public readonly wrap?: boolean;

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
	 * An event containing details is triggered when the value of the field is changed.
	 * @public
	 */
	@event()
	change!: EventHandler<UI5Event<{ value: string | number | boolean | undefined; isValid: boolean }, Field>>;

	/**
	 * An event containing details is triggered when the field is focused.
	 *
	 */
	@event()
	focusin!: EventHandler;

	/**
	 * An event containing details is triggered when the value of the field is live changed.
	 *
	 * <b>Note:</b> Browsing autocomplete suggestions does not fire the event.
	 * @public
	 */
	@event()
	liveChange!: EventHandler<UI5Event<{}, Field>>;

	@association({
		type: "string"
	})
	public idPrefix?: string;

	/**
	 * Prefix added to the generated ID of the value help used for the field
	 */
	@association({
		type: "string"
	})
	public vhIdPrefix!: string;

	/**
	 * Flag indicating whether action will navigate after execution
	 */
	@property({
		type: "boolean"
	})
	public readonly navigateAfterAction: boolean = true;

	/**
	 * A set of options that can be configured.
	 * @public
	 */
	@aggregation({ type: "sap.fe.macros.field.FieldFormatOptions" })
	public readonly formatOptions?: FieldFormatOptions;

	@association({ type: "string" })
	// eslint-disable-next-line @typescript-eslint/naming-convention
	public _flexId?: string;

	/**
	 * Edit Mode of the field.
	 *
	 * If the editMode is undefined then we compute it based on the metadata
	 * Otherwise we use the value provided here.
	 */
	@property({
		type: "sap.ui.mdc.enums.FieldEditMode"
	})
	public readonly editMode?: FieldEditMode | CompiledBindingToolkitExpression;

	/**
	 * Option to add semantic objects for a field.
	 * This parameter overwrites the semantic objects defined through annotations.
	 * Valid options are either a single semantic object, a stringified array of semantic objects,
	 * a formatter or a single binding expression returning either a single semantic object or an array of semantic objects.
	 * @public
	 */
	@property({ type: "string", bindToState: true })
	public readonly semanticObject!: string;

	/**
	 * This is used to optionally provide an external value that comes from a different model than the OData model.
	 * It is designed to work with a field with value help, and without support for complex value help (currency / unit).
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
	 * This should be used in conjunction with the value property.
	 * @public
	 */
	@property({
		type: "string",
		bindable: true,
		isBindingInfo: true,
		required: false
	})
	public readonly description?: string | PropertyBindingInfo;

	@property({
		type: "sap.ui.core.TextAlign"
	})
	public readonly textAlign?: string;

	@property({ type: "object", isBindingInfo: true })
	public readonly showErrorObjectStatus?: object | boolean;

	@property({ type: "string" })
	public collaborationEnabled?: boolean; // Need to be computed on demand

	@property({ type: "string" })
	public mainPropertyRelativePath?: string; // Need to be computed on demand

	@property({ type: "object", isBindingInfo: true })
	customValueBinding?: boolean | string | number | PropertyBindingInfo;

	@property({ type: "boolean" })
	inlineEditEnabled? = false;

	@property({ type: "boolean" })
	hasInlineEdit?: boolean;

	private focusHandlersAttached = false;

	private computedMetaPath?: Context;

	private computedContextPath?: Context;

	dataModelPath?: DataModelObjectPath<Property>;

	private odataMetaModel!: ODataMetaModel | undefined;

	@property({ type: "string" })
	_apiId?: string;

	@property({ type: "boolean" })
	required?: boolean;

	/**
	 * Whether the associated value help requires validation or not.
	 */
	@property({ type: "boolean" })
	_requiresValidation?: boolean = false;

	/**
	 * Enables strict handling for actions. When true, warning responses from API calls during action execution
	 * should not be treated as errors and normal execution should continue.
	 */
	@property({ type: "boolean" })
	public readonly disableStrictHandling?: boolean;

	private preprocessorContext!: XMLPreprocessorContext | undefined;

	/**
	 * Gets the binding used for collaboration notifications.
	 * @param field
	 * @returns The binding, or undefined if the field has no OData V4 binding context.
	 */
	getCollaborationBinding(field: Control): ODataListBinding | ODataContextBinding | undefined {
		const bindingContext = field.getBindingContext() as V4Context | undefined;
		if (!bindingContext) {
			return undefined;
		}
		let binding = bindingContext.getBinding();

		if (!binding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
			const oView = CommonUtils.getTargetView(field);
			binding = oView.getBindingContext().getBinding();
		}

		return binding;
	}

	/**
	 * Extracts data from a change event for usage in the handleChange method.
	 * @param changeEvent The change event object.
	 * @returns An object containing the extracted details
	 */
	private extractChangeEventDetails(
		changeEvent: UI5Event<
			CheckBox$SelectEventParameters &
				InputBase$ChangeEventParameters &
				Field$ChangeEventParameters &
				RatingIndicator$ChangeEventParameters,
			CheckBox | InputBase | mdcField | RatingIndicator
		>
	): {
		source: CheckBox | InputBase | mdcField | RatingIndicator;
		controller: PageController;
		isTransient: boolean;
		valueResolved: Promise<void>;
		valid: boolean | undefined;
		fieldValidity: boolean;
		customValueBinding: boolean | string | number | PropertyBindingInfo | undefined;
	} {
		const source = changeEvent.getSource();
		const controller = this.getPageController();
		// If the field is bound to a JSON model, source.getBindingContext() returns undefined.
		// In such cases, we cannot call isTransient on it. Defaulting to false.
		const bindingContext = source && source.getBindingContext();
		const isTransient = bindingContext ? (bindingContext as unknown as { isTransient: Function }).isTransient() : false;
		const valueResolved = changeEvent.getParameter("promise") || Promise.resolve();
		const valid = changeEvent.getParameter("valid");
		const fieldValidity = FieldRuntimeHelper.getFieldStateOnChange(changeEvent).state["validity"];
		const customValueBinding = this?.customValueBinding;

		return { source, controller, isTransient, valueResolved, valid, fieldValidity, customValueBinding };
	}

	@xmlEventHandler()
	handleChange(
		changeEvent: UI5Event<
			CheckBox$SelectEventParameters &
				InputBase$ChangeEventParameters &
				Field$ChangeEventParameters &
				RatingIndicator$ChangeEventParameters,
			CheckBox | InputBase | mdcField | RatingIndicator
		>
	): void {
		const { source, controller, isTransient, valueResolved, valid, fieldValidity, customValueBinding } =
			this.extractChangeEventDetails(changeEvent);

		if (customValueBinding) {
			let newValue;
			const valueModel = source?.getModel(customValueBinding.model) as JSONModel | undefined;
			if (source.isA("sap.m.CheckBox")) {
				newValue = (changeEvent as CheckBox$SelectEvent).getParameter("selected");
			} else {
				newValue = (changeEvent as InputBase$ChangeEvent).getParameter("value");
			}
			valueModel?.setProperty(customValueBinding.path, newValue);
			valueModel?.updateBindings(true);
		}

		// Use the FE Controller instead of the extensionAPI to access internal FE controllers
		const feController = controller ? FieldRuntimeHelper.getExtensionController(controller) : undefined;

		// Currently we have undefined and true... and our creation row implementation relies on this.
		// I would move this logic to this place as it's hard to understand for field consumer
		const getRequestsPromises = valueResolved
			.then(async () => {
				// The event is gone. For now we'll just recreate it again
				(changeEvent as { oSource?: Control }).oSource = source;
				(changeEvent as { mParameters?: { valid?: boolean } }).mParameters = {
					valid: valid ?? true
				};
				this?.fireEvent("change", { value: this.getValue(), isValid: valid ?? true });
				const promises = [];
				// OData operations (side effects, recommendations) must only run when the field's
				// value is NOT externally bound to a non-OData model (customValueBinding) AND an
				// OData V4 binding context is present. Using customValueBinding as the primary
				// discriminator handles both: (a) custom pages with no context at all, and
				// (b) Object Pages where a context is inherited from the page but the value is
				// still bound to a JSON model.
				const shouldRunODataOperations =
					!customValueBinding && !!source.getBindingContext()?.isA?.("sap.ui.model.odata.v4.Context");
				if (!isTransient && shouldRunODataOperations) {
					// trigger side effects without registering deferred side effects
					// deferred side effects are already registered by prepareDeferredSideEffectsForField before valueResolved is resolved.
					const sideEffectsPromise = feController?.sideEffects.handleFieldChange(
						changeEvent,
						!!fieldValidity,
						valueResolved,
						true
					);
					if (sideEffectsPromise) {
						promises.push(sideEffectsPromise);
					}
				}
				// Recommendations - only applicable for OData-bound fields
				if (controller && shouldRunODataOperations) {
					promises.push(FieldRuntimeHelper.fetchRecommendations(source, controller));
				}
				return Promise.all(promises);
			})
			.catch(() => {
				// The event is gone. For now we'll just recreate it again
				(changeEvent as { oSource?: Control }).oSource = source;
				(changeEvent as { mParameters?: { valid?: boolean } }).mParameters = {
					valid: false
				};
				Log.debug("Prerequisites on Field for the SideEffects and Recommendations have been rejected");
				// as the UI might need to react on. We could provide a parameter to inform if validation
				// was successful?
				this.fireEvent("change", { value: this.getValue(), isValid: valid ?? false });
			});
		feController?.editFlow.syncTask(getRequestsPromises);

		// For the EditFlow synchronization, we need to wait for the corresponding PATCH request to be sent (or an error to be detected), otherwise there could be e.g. action or save invoked in parallel with the PATCH request.
		// This is done with a 0-timeout, to allow for the 'patchSent' event to be sent by the binding (then the internal edit flow synchronization kicks in with EditFlow.handlePatchSent).
		const valueResolvedAndPatchSent = valueResolved
			.then(async () => {
				return new Promise<void>((resolve) => {
					setTimeout(resolve, 0);
				});
			})
			.catch(async () => {
				return new Promise<void>((resolve) => {
					setTimeout(resolve, 0);
				});
			});
		feController?.editFlow.syncTask(valueResolvedAndPatchSent);

		// if the context is transient, it means the request would fail anyway as the record does not exist in reality
		// Should the request be made in future if the context is transient?
		if (isTransient) {
			return;
		}

		if (!customValueBinding && source.getBindingContext()?.isA?.("sap.ui.model.odata.v4.Context")) {
			feController?.sideEffects.prepareDeferredSideEffectsForField(changeEvent, !!fieldValidity, valueResolved);
		}
		// Collaboration Draft Activity Sync
		const bCollaborationEnabled = controller?.collaborativeDraft.isConnected();

		if (bCollaborationEnabled && fieldValidity && !customValueBinding) {
			const binding = this.getCollaborationBinding(source);
			if (!binding) {
				return;
			}
			const data = [
				...((source.getBindingInfo("value") || source.getBindingInfo("selected"))?.parts || []),
				...(source.getBindingInfo("additionalValue")?.parts || [])
			]
				.filter((part) => {
					return part?.path !== undefined && part.path.indexOf("@@") < 0; // Remove binding parts with @@ that make no sense for collaboration messages
				})
				.map(function (part: { path: string }) {
					return `${source.getBindingContext()?.getPath()}/${part.path}`;
				});

			// From this point, we will always send a collaboration message (UNLOCK or CHANGE), so we retain
			// a potential UNLOCK that would be sent in handleFocusOut, to make sure it's sent after the CHANGE message
			controller?.collaborativeDraft.retainAsyncMessages(data);

			const sendCollaborationMessagesAfterPatchCompleted = (): void => {
				// The value has been changed by the user --> wait until it's sent to the server before sending a notification to other users
				binding.attachEventOnce("patchCompleted", function () {
					controller?.collaborativeDraft.send({ action: Activity.Change, content: data });
					controller?.collaborativeDraft.releaseAsyncMessages(data);
				});
			};

			const isDataUpdated = binding.hasPendingChanges();
			if (isDataUpdated) {
				sendCollaborationMessagesAfterPatchCompleted();
			}

			const updateCollaboration = (): void => {
				if (!isDataUpdated) {
					// We need to check again if the binding has some pending changes, since it may have been updated once the Field value is resolved
					if (binding.hasPendingChanges()) {
						sendCollaborationMessagesAfterPatchCompleted();
					} else {
						controller?.collaborativeDraft.releaseAsyncMessages(data);
					}
				}
			};
			if (source.isA("sap.ui.mdc.Field") || (source as Control).isA("sap.ui.mdc.MultiValueField")) {
				valueResolved
					.then(() => {
						updateCollaboration();
						return;
					})
					.catch(() => {
						updateCollaboration();
					});
			} else {
				updateCollaboration();
			}
		}
	}

	@xmlEventHandler()
	handleLiveChange(_event: UI5Event): void {
		this.fireEvent("liveChange");
	}

	@xmlEventHandler()
	onValidateFieldGroup(_event: Control$ValidateFieldGroupEvent): void {
		const sourceField = _event.getSource(),
			view = CommonUtils.getTargetView(sourceField);
		if (view) {
			const controller = view.getController();

			// Skip side effects if the field has an external value binding (JSON model) or has no OData V4 context.
			// Using customValueBinding as the primary check covers both custom pages (no context) and
			// Object Pages where a context is inherited but the value is still bound to a JSON model.
			if (this.customValueBinding || !sourceField.getBindingContext()?.isA?.("sap.ui.model.odata.v4.Context")) {
				return;
			}
			const feController = FieldRuntimeHelper.getExtensionController(controller);
			feController.sideEffects.handleFieldGroupChange(_event);
		}
	}

	constructor(
		props?: PropertiesOf<Field, "change" | "liveChange" | "focusin">,
		others?: PropertiesOf<Field, "change" | "liveChange" | "focusin">,
		scope?: never
	) {
		let combinedProps;

		if (props) {
			if (typeof props === "string") {
				combinedProps = { ...others, id: props } as PropertiesOf<Field>;
			} else {
				combinedProps = { ...props } as PropertiesOf<Field>;
				scope = others as never;
			}

			const { _flexId, vhIdPrefix, idPrefix, id, _apiId } = combinedProps;

			if (_flexId && !_flexId.includes("-content")) {
				combinedProps._apiId = _flexId;
				combinedProps._flexId = `${_flexId}-content`;
			}

			if (!vhIdPrefix) {
				//no vhIdPrefix means "public use case"
				combinedProps.vhIdPrefix = "FieldValueHelp";
				combinedProps._flexId = id;
				combinedProps.idPrefix = idPrefix || id;
			}
			if (!id) {
				if (combinedProps._apiId) {
					combinedProps.id = combinedProps._apiId;
				} else if (idPrefix) {
					combinedProps.id = generate([idPrefix, "Field"]);
				}
			}
		}
		super(combinedProps, scope);
	}

	override applySettings(mSettings: PropertiesOf<Field, "change" | "liveChange" | "focusin">, oScope?: object): this {
		this._doNotCreateOnNullContext = true; // We don't want to create the field if there is no context
		return super.applySettings(mSettings, oScope);
	}

	_setAriaLabelledBy(content?: ControlWithAccessibility): void {
		if (content && content.addAriaLabelledBy) {
			const ariaLabelledBy = this.ariaLabelledBy;

			for (const id of ariaLabelledBy) {
				const ariaLabelledBys = content.getAriaLabelledBy() || [];
				if (!ariaLabelledBys.includes(id)) {
					content.addAriaLabelledBy(id);
				}
			}
			// Special handling for Contact controls such as Email and Contact
			if ((content as Control).isA("sap.fe.macros.contact.Contact") || (content as Control).isA("sap.fe.macros.contact.Email")) {
				this._setAriaLabelledBy((content as unknown as Contact | Email).getContent() as unknown as ControlWithAccessibility);
			}
		}
	}

	onBeforeRendering(): void {
		// before calling the renderer of the Field parent control may have set ariaLabelledBy
		// we ensure it is passed to its inner controls
		this._setAriaLabelledBy(this.content as unknown as ControlWithAccessibility);

		const control = FieldMixin.getControlInFieldWrapper(this.content);
		if (control?.isA<Link>("sap.m.Link")) {
			const ibnData = control.data("IBNData") as { semanticObject?: string; action?: string } | undefined;
			if (ibnData?.semanticObject && ibnData?.action) {
				FieldRuntimeHelper.updateIBNLinkEnabled(control, ibnData.semanticObject, ibnData.action);
			}
		}
	}

	onAfterRendering(): void {
		const editControl = this.getInnerControl(this.content);
		const notLockControls = ["sap.m.CheckBox"];

		const canLock = !notLockControls.includes(editControl?.getMetadata().getName() ?? "");
		if (this.collaborationEnabled && !this.focusHandlersAttached && canLock) {
			// The event delegate doesn't work on the Field, we need to put it on its content (FieldWrapper)
			this.content?.addEventDelegate(
				{
					onfocusin: (evt: FocusEvent) => {
						this.getPageController().collaborativeDraft.handleContentFocusIn(this, evt);
					}
				},
				this
			);

			this.focusHandlersAttached = true; // To avoid attaching events twice
		}
	}

	/**
	 * Returns the label controls of the field
	 * when being referenced by the 'labelFor' attribute on the label or when in a form.
	 * @returns The label controls
	 */
	getLabelControls(): Label[] {
		const referencingLabels = this._getLabelsFromReferencingLabels();
		return referencingLabels.length > 0 ? referencingLabels : this._getLabelsForFormFields();
	}

	/**
	 * Returns the label controls of the field when referenced by a label.
	 * @returns The label controls
	 */
	_getLabelsFromReferencingLabels(): Label[] {
		const labelIds = LabelEnablement.getReferencingLabels(this);
		const labelControls: Label[] = [];
		const view = this.getPageController().getView();
		labelIds.forEach((labelId) => {
			const labelControl = view.byId(labelId);
			if (labelControl) {
				labelControls.push(labelControl as Label);
			}
		});
		return labelControls;
	}

	/**
	 * Returns the label controls of the field or connected field when in a form.
	 * @returns The label controls
	 */
	_getLabelsForFormFields(): Label[] {
		// if the field is not in a form, we return undefined
		if (!this.getId().includes("FormElement")) {
			return [];
		}
		let control = this as ManagedObject | null;
		// search the parents of the control until we find a sap.ui.layout.form.FormElement
		// or we reach the root control
		while (control && !control.isA("sap.ui.layout.form.FormElement")) {
			control = (control as ManagedObject)?.getParent();
		}
		return control ? [(control as FormElement).getLabelControl() as Label] : [];
	}

	getMainPropertyRelativePath(): string | undefined {
		return this.mainPropertyRelativePath;
	}

	// Note: getValue(), setValue(), getEnabled(), setEnabled(), addMessage(), removeMessage(),
	// and getMessageManager() are inherited from FieldMixin via @mixin decorator

	/**
	 * Handler for the onMetadataAvailable event.
	 */
	onMetadataAvailable(): void {
		if (!this.content) {
			const preparedProperties = this.prepareProperties();
			if (preparedProperties) {
				if (this.formatOptions?.createAssociatedAriaLabel && preparedProperties.label && preparedProperties.convertedMetaPath) {
					const ariaLabelId = generate([preparedProperties.convertedMetaPath.fullyQualifiedName, "Field-ariaLabel"]);
					this.getPageController()?.addAriaInvisibleText(ariaLabelId, preparedProperties.label);
					this.addAssociation("ariaLabelledBy", ariaLabelId);
				}
				this.content = this.createContent(preparedProperties);
			}
		}
	}

	/**
	 * Prepares the properties required for the Field block.
	 *
	 * This function computes the meta path and context path, sets up the input field properties,
	 * and calls the setUpField function to prepare the properties for the Field block.
	 * Additionally, it sets the mainPropertyRelativePath and collaborationEnabled properties.
	 * @returns The prepared properties for the Field block, or undefined if the preprocessor context is not available.
	 */
	prepareProperties(): FieldBlockProperties | undefined {
		const metaContextPath = this.getMetaPathObject(this.metaPath, this.contextPath);

		if (!metaContextPath) {
			return undefined;
		}
		const owner = this._getOwner();
		const inputFieldProperties = this.getPropertyBag() as InputFieldBlockProperties;
		Object.defineProperty(inputFieldProperties, "value", {
			get: () => {
				return this.value;
			}
		});
		Object.defineProperty(inputFieldProperties, "description", {
			get: () => {
				return this.description;
			}
		});

		inputFieldProperties.readOnly = this.bindState("readOnly");
		// if there is a binding for the property semanticObject we will rely on the binding to the state to ensure
		// binding manipulation is possible
		if (this.getBindingInfo("semanticObject")) {
			inputFieldProperties.semanticObject = compileExpression(this.bindState("semanticObject"));
		}
		inputFieldProperties.vhIdPrefix = this.vhIdPrefix;
		inputFieldProperties.idPrefix = this.idPrefix;
		inputFieldProperties._flexId = this._flexId;
		inputFieldProperties.onLiveChange = this.hasListeners("liveChange") ? "Something" : undefined;

		this.preprocessorContext = owner?.preprocessorContext;
		this.odataMetaModel = this.getMetaModel();
		this.computedContextPath = this.odataMetaModel?.getMetaContext(this.getComputedContextPath(this.contextPath));

		this.computedMetaPath = this.odataMetaModel?.createBindingContext(metaContextPath.getPath()) as Context;

		// Some code rely on us checking if visible is defined or not, the only way to do it is through the isPropertyInitial method
		if (this.isPropertyInitial("visible")) {
			inputFieldProperties.visible = undefined;
		}

		//if (this.preprocessorContext) {
		// If the ID is not set by the consumer, use the ID provided by UI5.
		// (The logic for setting the value help relies on always having an ID.)
		inputFieldProperties.id = inputFieldProperties.id ?? this.getId();

		const preparedProperties = setUpField(
			inputFieldProperties,
			{} as TemplateProcessorSettings,
			(this.preprocessorContext?.models.viewData as JSONModel) ?? new JSONModel(this._getOwner()?.getViewData?.() ?? {}),
			(this.preprocessorContext?.models.internal as JSONModel) ?? this._getOwner()!.getAppComponent().getModel("internal"),
			this.preprocessorContext?.appComponent ?? this._getOwner()!.getAppComponent(),
			this.isPropertyInitial("readOnly"),
			this.computedMetaPath,
			this.computedContextPath
		);
		this.setOrBindProperty("inlineEditEnabled", preparedProperties.inlineEditEnabled);
		this.setOrBindProperty("hasInlineEdit", compileExpression(preparedProperties.hasInlineEdit));

		preparedProperties.isDynamicInstantiation = true;
		if (preparedProperties.mainPropertyRelativePath) this.mainPropertyRelativePath = preparedProperties.mainPropertyRelativePath;
		if (preparedProperties.collaborationEnabled) this.collaborationEnabled = preparedProperties.collaborationEnabled;
		if (preparedProperties.displayStyle === "File")
			preparedProperties.fileUploaderVisible = !this.readOnly && preparedProperties.editableExpression;
		preparedProperties.getTranslatedText = this.getTranslatedText.bind(this);
		if (preparedProperties.ariaLabelledBy === undefined) {
			preparedProperties.ariaLabelledBy = this.ariaLabelledBy;
		}
		this.dataModelPath = preparedProperties.dataModelPath;
		return preparedProperties;
	}

	/**
	 * Creates the content for the Field block.
	 *
	 * This function uses the prepared properties to create and return the content control for the Field block.
	 * @param preparedProperties The prepared properties for the Field block.
	 * @returns The created content control.
	 */
	createContent(preparedProperties: FieldBlockProperties): Control {
		try {
			const controller = this.getPageController();
			// We have to set (or bind) some properties to the Field so they can be accessed by consumers/UI5
			if (preparedProperties.required === undefined) {
				this.setOrBindProperty("required", preparedProperties.requiredExpression);
			}
			this.setOrBindProperty("editable", preparedProperties.editableExpression);

			this.setOrBindProperty("visible", preparedProperties.visible);
			if (typeof preparedProperties.value !== "string") {
				this.customValueBinding = preparedProperties.value;
			}

			if (preparedProperties.computedEditMode !== undefined) {
				this.setOrBindProperty("editMode", preparedProperties.editMode ?? compileExpression(preparedProperties.computedEditMode));
			}
			preparedProperties.eventHandlers.change = (Field as unknown as { handleChange: EventHandler }).handleChange;
			preparedProperties.eventHandlers.liveChange = (Field as unknown as { handleLiveChange: EventHandler }).handleLiveChange;
			preparedProperties.eventHandlers.validateFieldGroup = (
				Field as unknown as { onValidateFieldGroup: EventHandler }
			).onValidateFieldGroup;
			preparedProperties.eventHandlers.handleTypeMissmatch = this.onHandleTypeMissmatch.bind(this);
			preparedProperties.eventHandlers.handleFileSizeExceed = this.onHandleFileSizeExceed.bind(this);
			preparedProperties.eventHandlers.handleUploadComplete = (ev): void => {
				FieldRuntimeHelper.handleUploadComplete(
					ev,
					{ path: preparedProperties.fileFilenameExpression },
					preparedProperties.fileRelativePropertyPath,
					controller
				);
			};
			preparedProperties.eventHandlers.uploadStream = this.onUploadStream.bind(this);
			preparedProperties.eventHandlers.removeStream = (ev): void => {
				FieldRuntimeHelper.removeStream(
					ev as Field$ChangeEvent & UI5Event<{ isValid: boolean }>,
					{ path: preparedProperties.fileFilenameExpression },
					preparedProperties.fileRelativePropertyPath,
					controller
				);
			};
			preparedProperties.eventHandlers.handleOpenUploader = this.onHandleOpenUploader.bind(this);
			preparedProperties.eventHandlers.handleCloseUploader = this.onHandleCloseUploader.bind(this);
			preparedProperties.eventHandlers.openExternalLink = this.onOpenExternalLink.bind(this);
			preparedProperties.eventHandlers.onFocusOut = this.onFocusOut.bind(this);
			preparedProperties.eventHandlers.linkPressed = this.onLinkPressed.bind(this);
			preparedProperties.eventHandlers.onDataFieldWithIBN = (ev: Button$PressEvent): void => {
				const oDataField = preparedProperties.metaPath.getObject();
				if (!oDataField) return undefined;
				const mNavigationParameters: {
					navigationContexts?: ODataV4Context;
					label?: string;
					applicableContexts?: ODataV4Context[];
					notApplicableContexts?: ODataV4Context[];
					semanticObjectMapping?: string;
				} = {
					navigationContexts: ev.getSource()?.getBindingContext() as ODataV4Context
				};
				if (oDataField.Mapping) {
					mNavigationParameters.semanticObjectMapping = oDataField.Mapping;
				}
				controller._intentBasedNavigation.navigate(
					oDataField.SemanticObject,
					oDataField.Action,
					mNavigationParameters,
					ev.getSource()
				);
			};
			preparedProperties.eventHandlers.onDataFieldActionButton = (ev: Button$PressEvent): void => {
				const oThis: FieldBlockProperties = preparedProperties;
				const oDataField: MetaModelType<DataFieldForAction> = preparedProperties.metaPath.getObject();
				let sInvocationGrouping = "Isolated";
				if (
					oDataField.InvocationGrouping &&
					(oDataField.InvocationGrouping as unknown as MetaModelEnum<OperationGroupingType>).$EnumMember ===
						"com.sap.vocabularies.UI.v1.OperationGroupingType/ChangeSet"
				) {
					sInvocationGrouping = "ChangeSet";
				}
				let bIsNavigable = oThis.navigateAfterAction as boolean | string;
				bIsNavigable = bIsNavigable === "false" ? false : true;

				const entities: Array<string> = oThis?.contextPath?.getPath().split("/");
				const entitySetName: string = entities[entities.length - 1];
				const disableStrictHandling = this.disableStrictHandling;
				const oParams = {
					contexts: ev.getSource().getBindingContext()! as ODataV4Context,
					invocationGrouping: sInvocationGrouping,
					model: ev.getSource().getModel() as ODataModel,
					label: oDataField.Label,
					isNavigable: bIsNavigable,
					entitySetName: entitySetName,
					disableStrictHandling: disableStrictHandling
				};

				controller.editFlow.invokeAction(oDataField.Action!, oParams);
			};
			preparedProperties.eventHandlers.displayAggregationDetails = (ev): void => {
				FieldRuntime.displayAggregateDetails(ev, getContextRelativeTargetObjectPath(preparedProperties.dataModelPath));
			};
			if (preparedProperties.convertedMetaPath.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath") {
				preparedProperties.eventHandlers.onDataFieldWithNavigationPath = (ev): void => {
					FieldRuntimeHelper.onDataFieldWithNavigationPath(
						ev.getSource(),
						controller,
						(preparedProperties.convertedMetaPath as DataFieldWithNavigationPath).Target.value
					);
				};
			}
			if (preparedProperties.editMode !== "Display") {
				preparedProperties.valueHelpId = FieldStructure.getPossibleValueHelpTemplateId(
					preparedProperties,
					this.getPageController(),
					this.getMetaModel()!
				);
			}
			this.content = FieldStructure.getFieldStructureTemplate(preparedProperties) as unknown as Control;
		} catch (e) {
			if (e instanceof Error) {
				MessageToast.show(e.message + " in createContent of Field");
			} else {
				MessageToast.show("An unknown error occurred");
			}
		}
		return this.content;
	}

	onHandleTypeMissmatch(ev: FileUploader$TypeMissmatchEvent): void {
		FieldRuntimeHelper.handleTypeMissmatch(ev);
	}

	onHandleFileSizeExceed(ev: FileUploader$FileSizeExceedEvent): void {
		FieldRuntimeHelper.handleFileSizeExceed(ev);
	}

	onHandleOpenUploader(ev: UI5Event<{}, FileUploader>): void {
		FieldRuntimeHelper.handleOpenUploader(ev);
	}

	onUploadStream(ev: FileUploader$ChangeEvent): void {
		FieldRuntimeHelper.uploadStream(this.getPageController(), ev);
	}

	onHandleCloseUploader(ev: UI5Event<{}, FileUploader>): void {
		FieldRuntimeHelper.handleCloseUploader(ev);
	}

	onOpenExternalLink(ev: UI5Event<{}, Link>): void {
		FieldRuntimeHelper.openExternalLink(ev);
	}

	onLinkPressed(ev: Button$PressEvent): void {
		FieldRuntimeHelper.pressLink(ev);
	}

	onFocusOut(ev: Control$ValidateFieldGroupEvent): void {
		const controller = this.getPageController();
		controller.collaborativeDraft.handleContentFocusOut(ev);
	}

	getPropertyBag(): PropertiesOf<this> {
		const settings: PropertiesOf<this> = {} as PropertiesOf<this>;
		const properties = this.getMetadata().getAllProperties();
		const aggregations = this.getMetadata().getAllAggregations();
		for (const propertyName in properties) {
			const currentPropertyValue = this.getProperty(propertyName);
			settings[propertyName as keyof PropertiesOf<this>] = currentPropertyValue;
		}
		for (const aggregationName in aggregations) {
			const aggregationContent = this.getAggregation(aggregationName);
			if (Array.isArray(aggregationContent)) {
				const childrenArray = [];
				for (const managedObject of aggregationContent) {
					if (managedObject.isA<BuildingBlockObjectProperty>("sap.fe.macros.controls.BuildingBlockObjectProperty")) {
						childrenArray.push(managedObject.getPropertyBag());
					}
				}
				settings[aggregationName as keyof PropertiesOf<this>] = childrenArray;
			} else if (aggregationContent) {
				if (aggregationContent.isA<BuildingBlockObjectProperty>("sap.fe.macros.controls.BuildingBlockObjectProperty")) {
					settings[aggregationName as keyof PropertiesOf<this>] = aggregationContent.getPropertyBag();
					for (const binding in (aggregationContent as ManagedObject & { mBindingInfos?: Record<string, { binding?: Binding }> })
						.mBindingInfos) {
						settings[aggregationName as keyof PropertiesOf<this>][binding] = aggregationContent.getBindingInfo(binding);
					}
				} else {
					settings[aggregationName as keyof PropertiesOf<this>] = aggregationContent.getId();
				}
			}
		}
		return settings;
	}

	/**
	 * Determines the target property of the inline edit field.
	 * @returns The targetProperty of the inline edit field.
	 */
	getInlineEditProperty(): Property | undefined {
		const dataModelPath = this.getDataModelObjectForMetaPath<DataFieldAbstractTypes | DataPointTypeTypes>(
			this.metaPath,
			this.contextPath
		);
		return getDataModelObjectPathForValue(dataModelPath as DataModelObjectPath<DataFieldAbstractTypes | DataPointTypeTypes>)
			?.targetObject;
	}

	/**
	 * Determines the fullyQualifiedName of the inline edit field.
	 * @returns The fullyQualifiedName of the inline edit field.
	 */
	getInlineEditPropertyName(): string | undefined {
		return this.getInlineEditProperty()?.fullyQualifiedName;
	}

	/**
	 * Returns the merge comparison key for cell merging in responsive tables.
	 * Used as the mergeFunctionName on sap.m.Column which is called by sap.m.ColumnListItemRenderer on the cell control.
	 * Returns a unique key (UID) when the field is in edit mode so that no two cells match,
	 * effectively preventing merging on editable rows.
	 * @returns The comparison key, or a unique key if the field is not in display mode.
	 */
	getMergeCellKey(): string {
		const mdcField = this.content as (mdcField & { getEditMode?(): string }) | undefined;
		if (mdcField?.getEditMode && mdcField.getEditMode() !== "Display") {
			return uid();
		}
		return (this.data("mergeCellKey") as string) ?? uid();
	}
}

// Interface declaration merging to expose FieldMixin methods to TypeScript
// This tells TypeScript that Field has these methods from FieldMixin, even though they're added at runtime
interface Field {
	getValue(): boolean | string | number | undefined;
	setValue(value: boolean | string | number): Control;
	getEnabled(): boolean;
	setEnabled(enabled: boolean): Control;
	addMessage(parameters: { type?: MessageType; message?: string; description?: string; persistent?: boolean }): string;
	removeMessage(id: string): void;
	getMessageManager(): Messaging;
	hasPendingUserInput(): boolean;
	getInnerControl(source: Control): Control | undefined;
}

export default Field;
