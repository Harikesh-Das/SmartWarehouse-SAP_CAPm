/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/uid", "sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/collaboration/CollaborationCommon", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/macros/field/FieldRuntime", "sap/fe/macros/field/FieldTemplating", "sap/fe/macros/internal/field/FieldStructure", "sap/fe/macros/internal/field/FieldStructureHelper", "sap/m/MessageToast", "sap/ui/core/LabelEnablement", "sap/ui/model/json/JSONModel", "./MacroAPI", "./field/FieldRuntimeHelper", "./field/mixin/FieldMixin", "./inlineEdit/InlineEdit"], function (Log, uid, BindingToolkit, ClassSupport, CommonUtils, CollaborationCommon, StableIdHelper, DataModelPathHelper, FieldRuntime, FieldTemplating, FieldStructure, FieldStructureHelper, MessageToast, LabelEnablement, JSONModel, MacroAPI, FieldRuntimeHelper, FieldMixin, InlineEdit) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _descriptor27, _descriptor28, _descriptor29;
  var setUpField = FieldStructureHelper.setUpField;
  var getDataModelObjectPathForValue = FieldTemplating.getDataModelObjectPathForValue;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var generate = StableIdHelper.generate;
  var Activity = CollaborationCommon.Activity;
  var xmlEventHandler = ClassSupport.xmlEventHandler;
  var property = ClassSupport.property;
  var mixin = ClassSupport.mixin;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var association = ClassSupport.association;
  var aggregation = ClassSupport.aggregation;
  var compileExpression = BindingToolkit.compileExpression;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
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
  let Field = (_dec = defineUI5Class("sap.fe.macros.Field", {
    returnTypes: ["sap.fe.core.controls.FormElementWrapper" /*, not sure i want to add those yet "sap.fe.macros.Field", "sap.m.HBox", "sap.fe.macros.controls.ConditionalWrapper", "sap.m.Button"*/]
  }), _dec2 = mixin(InlineEdit), _dec3 = mixin(FieldMixin), _dec4 = property({
    type: "boolean"
  }), _dec5 = property({
    type: "boolean",
    bindToState: true
  }), _dec6 = property({
    type: "string"
  }), _dec7 = property({
    type: "string",
    expectedAnnotations: [],
    expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty", "Property"]
  }), _dec8 = property({
    type: "boolean"
  }), _dec9 = property({
    type: "string",
    expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"]
  }), _dec10 = event(), _dec11 = event(), _dec12 = event(), _dec13 = association({
    type: "string"
  }), _dec14 = association({
    type: "string"
  }), _dec15 = property({
    type: "boolean"
  }), _dec16 = aggregation({
    type: "sap.fe.macros.field.FieldFormatOptions"
  }), _dec17 = association({
    type: "string"
  }), _dec18 = property({
    type: "sap.ui.mdc.enums.FieldEditMode"
  }), _dec19 = property({
    type: "string",
    bindToState: true
  }), _dec20 = property({
    type: "string",
    bindable: true,
    isBindingInfo: true,
    required: false
  }), _dec21 = property({
    type: "string",
    bindable: true,
    isBindingInfo: true,
    required: false
  }), _dec22 = property({
    type: "sap.ui.core.TextAlign"
  }), _dec23 = property({
    type: "object",
    isBindingInfo: true
  }), _dec24 = property({
    type: "string"
  }), _dec25 = property({
    type: "string"
  }), _dec26 = property({
    type: "object",
    isBindingInfo: true
  }), _dec27 = property({
    type: "boolean"
  }), _dec28 = property({
    type: "boolean"
  }), _dec29 = property({
    type: "string"
  }), _dec30 = property({
    type: "boolean"
  }), _dec31 = property({
    type: "boolean"
  }), _dec32 = property({
    type: "boolean"
  }), _dec33 = xmlEventHandler(), _dec34 = xmlEventHandler(), _dec35 = xmlEventHandler(), _dec(_class = _dec2(_class = _dec3(_class = (_class2 = /*#__PURE__*/function (_MacroAPI) {
    function Field(props, others, scope) {
      var _this;
      let combinedProps;
      if (props) {
        if (typeof props === "string") {
          combinedProps = {
            ...others,
            id: props
          };
        } else {
          combinedProps = {
            ...props
          };
          scope = others;
        }
        const {
          _flexId,
          vhIdPrefix,
          idPrefix,
          id,
          _apiId
        } = combinedProps;
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
      _this = _MacroAPI.call(this, combinedProps, scope) || this;
      /**
       * An expression that allows you to control the editable state of the field.
       *
       * If you do not set any expression, SAP Fiori elements hooks into the standard lifecycle to determine if the page is currently editable.
       * Please note that you cannot set a field to editable if it has been defined in the annotation as not editable.
       * @private
       * @deprecated
       */
      _initializerDefineProperty(_this, "editable", _descriptor, _this);
      /**
       * An expression that allows you to control the read-only state of the field.
       *
       * If you do not set any expression, SAP Fiori elements hooks into the standard lifecycle to determine the current state.
       * @public
       */
      _initializerDefineProperty(_this, "readOnly", _descriptor2, _this);
      /**
       * The identifier of the Field control.
       */
      _initializerDefineProperty(_this, "id", _descriptor3, _this);
      /**
       * Defines the relative path of the property in the metamodel, based on the current contextPath.
       * @public
       */
      _initializerDefineProperty(_this, "metaPath", _descriptor4, _this);
      /**
       * Wrap field
       */
      _initializerDefineProperty(_this, "wrap", _descriptor5, _this);
      /**
       * Defines the path of the context used in the current page or block.
       * This setting is defined by the framework.
       * @public
       */
      _initializerDefineProperty(_this, "contextPath", _descriptor6, _this);
      /**
       * An event containing details is triggered when the value of the field is changed.
       * @public
       */
      _initializerDefineProperty(_this, "change", _descriptor7, _this);
      /**
       * An event containing details is triggered when the field is focused.
       *
       */
      _initializerDefineProperty(_this, "focusin", _descriptor8, _this);
      /**
       * An event containing details is triggered when the value of the field is live changed.
       *
       * <b>Note:</b> Browsing autocomplete suggestions does not fire the event.
       * @public
       */
      _initializerDefineProperty(_this, "liveChange", _descriptor9, _this);
      _initializerDefineProperty(_this, "idPrefix", _descriptor10, _this);
      /**
       * Prefix added to the generated ID of the value help used for the field
       */
      _initializerDefineProperty(_this, "vhIdPrefix", _descriptor11, _this);
      /**
       * Flag indicating whether action will navigate after execution
       */
      _initializerDefineProperty(_this, "navigateAfterAction", _descriptor12, _this);
      /**
       * A set of options that can be configured.
       * @public
       */
      _initializerDefineProperty(_this, "formatOptions", _descriptor13, _this);
      _initializerDefineProperty(_this, "_flexId", _descriptor14, _this);
      /**
       * Edit Mode of the field.
       *
       * If the editMode is undefined then we compute it based on the metadata
       * Otherwise we use the value provided here.
       */
      _initializerDefineProperty(_this, "editMode", _descriptor15, _this);
      /**
       * Option to add semantic objects for a field.
       * This parameter overwrites the semantic objects defined through annotations.
       * Valid options are either a single semantic object, a stringified array of semantic objects,
       * a formatter or a single binding expression returning either a single semantic object or an array of semantic objects.
       * @public
       */
      _initializerDefineProperty(_this, "semanticObject", _descriptor16, _this);
      /**
       * This is used to optionally provide an external value that comes from a different model than the OData model.
       * It is designed to work with a field with value help, and without support for complex value help (currency / unit).
       * @public
       */
      _initializerDefineProperty(_this, "value", _descriptor17, _this);
      /**
       * This is used to optionally provide an external description that comes from a different model than the oData model.
       * This should be used in conjunction with the value property.
       * @public
       */
      _initializerDefineProperty(_this, "description", _descriptor18, _this);
      _initializerDefineProperty(_this, "textAlign", _descriptor19, _this);
      _initializerDefineProperty(_this, "showErrorObjectStatus", _descriptor20, _this);
      _initializerDefineProperty(_this, "collaborationEnabled", _descriptor21, _this);
      // Need to be computed on demand
      _initializerDefineProperty(_this, "mainPropertyRelativePath", _descriptor22, _this);
      // Need to be computed on demand
      _initializerDefineProperty(_this, "customValueBinding", _descriptor23, _this);
      _initializerDefineProperty(_this, "inlineEditEnabled", _descriptor24, _this);
      _initializerDefineProperty(_this, "hasInlineEdit", _descriptor25, _this);
      _this.focusHandlersAttached = false;
      _initializerDefineProperty(_this, "_apiId", _descriptor26, _this);
      _initializerDefineProperty(_this, "required", _descriptor27, _this);
      /**
       * Whether the associated value help requires validation or not.
       */
      _initializerDefineProperty(_this, "_requiresValidation", _descriptor28, _this);
      /**
       * Enables strict handling for actions. When true, warning responses from API calls during action execution
       * should not be treated as errors and normal execution should continue.
       */
      _initializerDefineProperty(_this, "disableStrictHandling", _descriptor29, _this);
      return _this;
    }
    _inheritsLoose(Field, _MacroAPI);
    var _proto = Field.prototype;
    /**
     * Gets the binding used for collaboration notifications.
     * @param field
     * @returns The binding, or undefined if the field has no OData V4 binding context.
     */
    _proto.getCollaborationBinding = function getCollaborationBinding(field) {
      const bindingContext = field.getBindingContext();
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
     */;
    _proto.extractChangeEventDetails = function extractChangeEventDetails(changeEvent) {
      const source = changeEvent.getSource();
      const controller = this.getPageController();
      // If the field is bound to a JSON model, source.getBindingContext() returns undefined.
      // In such cases, we cannot call isTransient on it. Defaulting to false.
      const bindingContext = source && source.getBindingContext();
      const isTransient = bindingContext ? bindingContext.isTransient() : false;
      const valueResolved = changeEvent.getParameter("promise") || Promise.resolve();
      const valid = changeEvent.getParameter("valid");
      const fieldValidity = FieldRuntimeHelper.getFieldStateOnChange(changeEvent).state["validity"];
      const customValueBinding = this?.customValueBinding;
      return {
        source,
        controller,
        isTransient,
        valueResolved,
        valid,
        fieldValidity,
        customValueBinding
      };
    };
    _proto.handleChange = function handleChange(changeEvent) {
      const {
        source,
        controller,
        isTransient,
        valueResolved,
        valid,
        fieldValidity,
        customValueBinding
      } = this.extractChangeEventDetails(changeEvent);
      if (customValueBinding) {
        let newValue;
        const valueModel = source?.getModel(customValueBinding.model);
        if (source.isA("sap.m.CheckBox")) {
          newValue = changeEvent.getParameter("selected");
        } else {
          newValue = changeEvent.getParameter("value");
        }
        valueModel?.setProperty(customValueBinding.path, newValue);
        valueModel?.updateBindings(true);
      }

      // Use the FE Controller instead of the extensionAPI to access internal FE controllers
      const feController = controller ? FieldRuntimeHelper.getExtensionController(controller) : undefined;

      // Currently we have undefined and true... and our creation row implementation relies on this.
      // I would move this logic to this place as it's hard to understand for field consumer
      const getRequestsPromises = valueResolved.then(async () => {
        // The event is gone. For now we'll just recreate it again
        changeEvent.oSource = source;
        changeEvent.mParameters = {
          valid: valid ?? true
        };
        this?.fireEvent("change", {
          value: this.getValue(),
          isValid: valid ?? true
        });
        const promises = [];
        // OData operations (side effects, recommendations) must only run when the field's
        // value is NOT externally bound to a non-OData model (customValueBinding) AND an
        // OData V4 binding context is present. Using customValueBinding as the primary
        // discriminator handles both: (a) custom pages with no context at all, and
        // (b) Object Pages where a context is inherited from the page but the value is
        // still bound to a JSON model.
        const shouldRunODataOperations = !customValueBinding && !!source.getBindingContext()?.isA?.("sap.ui.model.odata.v4.Context");
        if (!isTransient && shouldRunODataOperations) {
          // trigger side effects without registering deferred side effects
          // deferred side effects are already registered by prepareDeferredSideEffectsForField before valueResolved is resolved.
          const sideEffectsPromise = feController?.sideEffects.handleFieldChange(changeEvent, !!fieldValidity, valueResolved, true);
          if (sideEffectsPromise) {
            promises.push(sideEffectsPromise);
          }
        }
        // Recommendations - only applicable for OData-bound fields
        if (controller && shouldRunODataOperations) {
          promises.push(FieldRuntimeHelper.fetchRecommendations(source, controller));
        }
        return Promise.all(promises);
      }).catch(() => {
        // The event is gone. For now we'll just recreate it again
        changeEvent.oSource = source;
        changeEvent.mParameters = {
          valid: false
        };
        Log.debug("Prerequisites on Field for the SideEffects and Recommendations have been rejected");
        // as the UI might need to react on. We could provide a parameter to inform if validation
        // was successful?
        this.fireEvent("change", {
          value: this.getValue(),
          isValid: valid ?? false
        });
      });
      feController?.editFlow.syncTask(getRequestsPromises);

      // For the EditFlow synchronization, we need to wait for the corresponding PATCH request to be sent (or an error to be detected), otherwise there could be e.g. action or save invoked in parallel with the PATCH request.
      // This is done with a 0-timeout, to allow for the 'patchSent' event to be sent by the binding (then the internal edit flow synchronization kicks in with EditFlow.handlePatchSent).
      const valueResolvedAndPatchSent = valueResolved.then(async () => {
        return new Promise(resolve => {
          setTimeout(resolve, 0);
        });
      }).catch(async () => {
        return new Promise(resolve => {
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
        const data = [...((source.getBindingInfo("value") || source.getBindingInfo("selected"))?.parts || []), ...(source.getBindingInfo("additionalValue")?.parts || [])].filter(part => {
          return part?.path !== undefined && part.path.indexOf("@@") < 0; // Remove binding parts with @@ that make no sense for collaboration messages
        }).map(function (part) {
          return `${source.getBindingContext()?.getPath()}/${part.path}`;
        });

        // From this point, we will always send a collaboration message (UNLOCK or CHANGE), so we retain
        // a potential UNLOCK that would be sent in handleFocusOut, to make sure it's sent after the CHANGE message
        controller?.collaborativeDraft.retainAsyncMessages(data);
        const sendCollaborationMessagesAfterPatchCompleted = () => {
          // The value has been changed by the user --> wait until it's sent to the server before sending a notification to other users
          binding.attachEventOnce("patchCompleted", function () {
            controller?.collaborativeDraft.send({
              action: Activity.Change,
              content: data
            });
            controller?.collaborativeDraft.releaseAsyncMessages(data);
          });
        };
        const isDataUpdated = binding.hasPendingChanges();
        if (isDataUpdated) {
          sendCollaborationMessagesAfterPatchCompleted();
        }
        const updateCollaboration = () => {
          if (!isDataUpdated) {
            // We need to check again if the binding has some pending changes, since it may have been updated once the Field value is resolved
            if (binding.hasPendingChanges()) {
              sendCollaborationMessagesAfterPatchCompleted();
            } else {
              controller?.collaborativeDraft.releaseAsyncMessages(data);
            }
          }
        };
        if (source.isA("sap.ui.mdc.Field") || source.isA("sap.ui.mdc.MultiValueField")) {
          valueResolved.then(() => {
            updateCollaboration();
            return;
          }).catch(() => {
            updateCollaboration();
          });
        } else {
          updateCollaboration();
        }
      }
    };
    _proto.handleLiveChange = function handleLiveChange(_event) {
      this.fireEvent("liveChange");
    };
    _proto.onValidateFieldGroup = function onValidateFieldGroup(_event) {
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
    };
    _proto.applySettings = function applySettings(mSettings, oScope) {
      this._doNotCreateOnNullContext = true; // We don't want to create the field if there is no context
      return _MacroAPI.prototype.applySettings.call(this, mSettings, oScope);
    };
    _proto._setAriaLabelledBy = function _setAriaLabelledBy(content) {
      if (content && content.addAriaLabelledBy) {
        const ariaLabelledBy = this.ariaLabelledBy;
        for (const id of ariaLabelledBy) {
          const ariaLabelledBys = content.getAriaLabelledBy() || [];
          if (!ariaLabelledBys.includes(id)) {
            content.addAriaLabelledBy(id);
          }
        }
        // Special handling for Contact controls such as Email and Contact
        if (content.isA("sap.fe.macros.contact.Contact") || content.isA("sap.fe.macros.contact.Email")) {
          this._setAriaLabelledBy(content.getContent());
        }
      }
    };
    _proto.onBeforeRendering = function onBeforeRendering() {
      // before calling the renderer of the Field parent control may have set ariaLabelledBy
      // we ensure it is passed to its inner controls
      this._setAriaLabelledBy(this.content);
      const control = FieldMixin.getControlInFieldWrapper(this.content);
      if (control?.isA("sap.m.Link")) {
        const ibnData = control.data("IBNData");
        if (ibnData?.semanticObject && ibnData?.action) {
          FieldRuntimeHelper.updateIBNLinkEnabled(control, ibnData.semanticObject, ibnData.action);
        }
      }
    };
    _proto.onAfterRendering = function onAfterRendering() {
      const editControl = this.getInnerControl(this.content);
      const notLockControls = ["sap.m.CheckBox"];
      const canLock = !notLockControls.includes(editControl?.getMetadata().getName() ?? "");
      if (this.collaborationEnabled && !this.focusHandlersAttached && canLock) {
        // The event delegate doesn't work on the Field, we need to put it on its content (FieldWrapper)
        this.content?.addEventDelegate({
          onfocusin: evt => {
            this.getPageController().collaborativeDraft.handleContentFocusIn(this, evt);
          }
        }, this);
        this.focusHandlersAttached = true; // To avoid attaching events twice
      }
    }

    /**
     * Returns the label controls of the field
     * when being referenced by the 'labelFor' attribute on the label or when in a form.
     * @returns The label controls
     */;
    _proto.getLabelControls = function getLabelControls() {
      const referencingLabels = this._getLabelsFromReferencingLabels();
      return referencingLabels.length > 0 ? referencingLabels : this._getLabelsForFormFields();
    }

    /**
     * Returns the label controls of the field when referenced by a label.
     * @returns The label controls
     */;
    _proto._getLabelsFromReferencingLabels = function _getLabelsFromReferencingLabels() {
      const labelIds = LabelEnablement.getReferencingLabels(this);
      const labelControls = [];
      const view = this.getPageController().getView();
      labelIds.forEach(labelId => {
        const labelControl = view.byId(labelId);
        if (labelControl) {
          labelControls.push(labelControl);
        }
      });
      return labelControls;
    }

    /**
     * Returns the label controls of the field or connected field when in a form.
     * @returns The label controls
     */;
    _proto._getLabelsForFormFields = function _getLabelsForFormFields() {
      // if the field is not in a form, we return undefined
      if (!this.getId().includes("FormElement")) {
        return [];
      }
      let control = this;
      // search the parents of the control until we find a sap.ui.layout.form.FormElement
      // or we reach the root control
      while (control && !control.isA("sap.ui.layout.form.FormElement")) {
        control = control?.getParent();
      }
      return control ? [control.getLabelControl()] : [];
    };
    _proto.getMainPropertyRelativePath = function getMainPropertyRelativePath() {
      return this.mainPropertyRelativePath;
    }

    // Note: getValue(), setValue(), getEnabled(), setEnabled(), addMessage(), removeMessage(),
    // and getMessageManager() are inherited from FieldMixin via @mixin decorator

    /**
     * Handler for the onMetadataAvailable event.
     */;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
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
     */;
    _proto.prepareProperties = function prepareProperties() {
      const metaContextPath = this.getMetaPathObject(this.metaPath, this.contextPath);
      if (!metaContextPath) {
        return undefined;
      }
      const owner = this._getOwner();
      const inputFieldProperties = this.getPropertyBag();
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
      this.computedMetaPath = this.odataMetaModel?.createBindingContext(metaContextPath.getPath());

      // Some code rely on us checking if visible is defined or not, the only way to do it is through the isPropertyInitial method
      if (this.isPropertyInitial("visible")) {
        inputFieldProperties.visible = undefined;
      }

      //if (this.preprocessorContext) {
      // If the ID is not set by the consumer, use the ID provided by UI5.
      // (The logic for setting the value help relies on always having an ID.)
      inputFieldProperties.id = inputFieldProperties.id ?? this.getId();
      const preparedProperties = setUpField(inputFieldProperties, {}, this.preprocessorContext?.models.viewData ?? new JSONModel(this._getOwner()?.getViewData?.() ?? {}), this.preprocessorContext?.models.internal ?? this._getOwner().getAppComponent().getModel("internal"), this.preprocessorContext?.appComponent ?? this._getOwner().getAppComponent(), this.isPropertyInitial("readOnly"), this.computedMetaPath, this.computedContextPath);
      this.setOrBindProperty("inlineEditEnabled", preparedProperties.inlineEditEnabled);
      this.setOrBindProperty("hasInlineEdit", compileExpression(preparedProperties.hasInlineEdit));
      preparedProperties.isDynamicInstantiation = true;
      if (preparedProperties.mainPropertyRelativePath) this.mainPropertyRelativePath = preparedProperties.mainPropertyRelativePath;
      if (preparedProperties.collaborationEnabled) this.collaborationEnabled = preparedProperties.collaborationEnabled;
      if (preparedProperties.displayStyle === "File") preparedProperties.fileUploaderVisible = !this.readOnly && preparedProperties.editableExpression;
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
     */;
    _proto.createContent = function createContent(preparedProperties) {
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
        preparedProperties.eventHandlers.change = Field.handleChange;
        preparedProperties.eventHandlers.liveChange = Field.handleLiveChange;
        preparedProperties.eventHandlers.validateFieldGroup = Field.onValidateFieldGroup;
        preparedProperties.eventHandlers.handleTypeMissmatch = this.onHandleTypeMissmatch.bind(this);
        preparedProperties.eventHandlers.handleFileSizeExceed = this.onHandleFileSizeExceed.bind(this);
        preparedProperties.eventHandlers.handleUploadComplete = ev => {
          FieldRuntimeHelper.handleUploadComplete(ev, {
            path: preparedProperties.fileFilenameExpression
          }, preparedProperties.fileRelativePropertyPath, controller);
        };
        preparedProperties.eventHandlers.uploadStream = this.onUploadStream.bind(this);
        preparedProperties.eventHandlers.removeStream = ev => {
          FieldRuntimeHelper.removeStream(ev, {
            path: preparedProperties.fileFilenameExpression
          }, preparedProperties.fileRelativePropertyPath, controller);
        };
        preparedProperties.eventHandlers.handleOpenUploader = this.onHandleOpenUploader.bind(this);
        preparedProperties.eventHandlers.handleCloseUploader = this.onHandleCloseUploader.bind(this);
        preparedProperties.eventHandlers.openExternalLink = this.onOpenExternalLink.bind(this);
        preparedProperties.eventHandlers.onFocusOut = this.onFocusOut.bind(this);
        preparedProperties.eventHandlers.linkPressed = this.onLinkPressed.bind(this);
        preparedProperties.eventHandlers.onDataFieldWithIBN = ev => {
          const oDataField = preparedProperties.metaPath.getObject();
          if (!oDataField) return undefined;
          const mNavigationParameters = {
            navigationContexts: ev.getSource()?.getBindingContext()
          };
          if (oDataField.Mapping) {
            mNavigationParameters.semanticObjectMapping = oDataField.Mapping;
          }
          controller._intentBasedNavigation.navigate(oDataField.SemanticObject, oDataField.Action, mNavigationParameters, ev.getSource());
        };
        preparedProperties.eventHandlers.onDataFieldActionButton = ev => {
          const oThis = preparedProperties;
          const oDataField = preparedProperties.metaPath.getObject();
          let sInvocationGrouping = "Isolated";
          if (oDataField.InvocationGrouping && oDataField.InvocationGrouping.$EnumMember === "com.sap.vocabularies.UI.v1.OperationGroupingType/ChangeSet") {
            sInvocationGrouping = "ChangeSet";
          }
          let bIsNavigable = oThis.navigateAfterAction;
          bIsNavigable = bIsNavigable === "false" ? false : true;
          const entities = oThis?.contextPath?.getPath().split("/");
          const entitySetName = entities[entities.length - 1];
          const disableStrictHandling = this.disableStrictHandling;
          const oParams = {
            contexts: ev.getSource().getBindingContext(),
            invocationGrouping: sInvocationGrouping,
            model: ev.getSource().getModel(),
            label: oDataField.Label,
            isNavigable: bIsNavigable,
            entitySetName: entitySetName,
            disableStrictHandling: disableStrictHandling
          };
          controller.editFlow.invokeAction(oDataField.Action, oParams);
        };
        preparedProperties.eventHandlers.displayAggregationDetails = ev => {
          FieldRuntime.displayAggregateDetails(ev, getContextRelativeTargetObjectPath(preparedProperties.dataModelPath));
        };
        if (preparedProperties.convertedMetaPath.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath") {
          preparedProperties.eventHandlers.onDataFieldWithNavigationPath = ev => {
            FieldRuntimeHelper.onDataFieldWithNavigationPath(ev.getSource(), controller, preparedProperties.convertedMetaPath.Target.value);
          };
        }
        if (preparedProperties.editMode !== "Display") {
          preparedProperties.valueHelpId = FieldStructure.getPossibleValueHelpTemplateId(preparedProperties, this.getPageController(), this.getMetaModel());
        }
        this.content = FieldStructure.getFieldStructureTemplate(preparedProperties);
      } catch (e) {
        if (e instanceof Error) {
          MessageToast.show(e.message + " in createContent of Field");
        } else {
          MessageToast.show("An unknown error occurred");
        }
      }
      return this.content;
    };
    _proto.onHandleTypeMissmatch = function onHandleTypeMissmatch(ev) {
      FieldRuntimeHelper.handleTypeMissmatch(ev);
    };
    _proto.onHandleFileSizeExceed = function onHandleFileSizeExceed(ev) {
      FieldRuntimeHelper.handleFileSizeExceed(ev);
    };
    _proto.onHandleOpenUploader = function onHandleOpenUploader(ev) {
      FieldRuntimeHelper.handleOpenUploader(ev);
    };
    _proto.onUploadStream = function onUploadStream(ev) {
      FieldRuntimeHelper.uploadStream(this.getPageController(), ev);
    };
    _proto.onHandleCloseUploader = function onHandleCloseUploader(ev) {
      FieldRuntimeHelper.handleCloseUploader(ev);
    };
    _proto.onOpenExternalLink = function onOpenExternalLink(ev) {
      FieldRuntimeHelper.openExternalLink(ev);
    };
    _proto.onLinkPressed = function onLinkPressed(ev) {
      FieldRuntimeHelper.pressLink(ev);
    };
    _proto.onFocusOut = function onFocusOut(ev) {
      const controller = this.getPageController();
      controller.collaborativeDraft.handleContentFocusOut(ev);
    };
    _proto.getPropertyBag = function getPropertyBag() {
      const settings = {};
      const properties = this.getMetadata().getAllProperties();
      const aggregations = this.getMetadata().getAllAggregations();
      for (const propertyName in properties) {
        const currentPropertyValue = this.getProperty(propertyName);
        settings[propertyName] = currentPropertyValue;
      }
      for (const aggregationName in aggregations) {
        const aggregationContent = this.getAggregation(aggregationName);
        if (Array.isArray(aggregationContent)) {
          const childrenArray = [];
          for (const managedObject of aggregationContent) {
            if (managedObject.isA("sap.fe.macros.controls.BuildingBlockObjectProperty")) {
              childrenArray.push(managedObject.getPropertyBag());
            }
          }
          settings[aggregationName] = childrenArray;
        } else if (aggregationContent) {
          if (aggregationContent.isA("sap.fe.macros.controls.BuildingBlockObjectProperty")) {
            settings[aggregationName] = aggregationContent.getPropertyBag();
            for (const binding in aggregationContent.mBindingInfos) {
              settings[aggregationName][binding] = aggregationContent.getBindingInfo(binding);
            }
          } else {
            settings[aggregationName] = aggregationContent.getId();
          }
        }
      }
      return settings;
    }

    /**
     * Determines the target property of the inline edit field.
     * @returns The targetProperty of the inline edit field.
     */;
    _proto.getInlineEditProperty = function getInlineEditProperty() {
      const dataModelPath = this.getDataModelObjectForMetaPath(this.metaPath, this.contextPath);
      return getDataModelObjectPathForValue(dataModelPath)?.targetObject;
    }

    /**
     * Determines the fullyQualifiedName of the inline edit field.
     * @returns The fullyQualifiedName of the inline edit field.
     */;
    _proto.getInlineEditPropertyName = function getInlineEditPropertyName() {
      return this.getInlineEditProperty()?.fullyQualifiedName;
    }

    /**
     * Returns the merge comparison key for cell merging in responsive tables.
     * Used as the mergeFunctionName on sap.m.Column which is called by sap.m.ColumnListItemRenderer on the cell control.
     * Returns a unique key (UID) when the field is in edit mode so that no two cells match,
     * effectively preventing merging on editable rows.
     * @returns The comparison key, or a unique key if the field is not in display mode.
     */;
    _proto.getMergeCellKey = function getMergeCellKey() {
      const mdcField = this.content;
      if (mdcField?.getEditMode && mdcField.getEditMode() !== "Display") {
        return uid();
      }
      return this.data("mergeCellKey") ?? uid();
    };
    return Field;
  }(MacroAPI), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "editable", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "readOnly", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "wrap", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "change", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "focusin", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "liveChange", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "idPrefix", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "vhIdPrefix", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "navigateAfterAction", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "formatOptions", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "_flexId", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "editMode", [_dec18], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "semanticObject", [_dec19], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "value", [_dec20], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "description", [_dec21], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "textAlign", [_dec22], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "showErrorObjectStatus", [_dec23], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "collaborationEnabled", [_dec24], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor22 = _applyDecoratedDescriptor(_class2.prototype, "mainPropertyRelativePath", [_dec25], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor23 = _applyDecoratedDescriptor(_class2.prototype, "customValueBinding", [_dec26], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor24 = _applyDecoratedDescriptor(_class2.prototype, "inlineEditEnabled", [_dec27], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor25 = _applyDecoratedDescriptor(_class2.prototype, "hasInlineEdit", [_dec28], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor26 = _applyDecoratedDescriptor(_class2.prototype, "_apiId", [_dec29], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor27 = _applyDecoratedDescriptor(_class2.prototype, "required", [_dec30], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor28 = _applyDecoratedDescriptor(_class2.prototype, "_requiresValidation", [_dec31], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor29 = _applyDecoratedDescriptor(_class2.prototype, "disableStrictHandling", [_dec32], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _applyDecoratedDescriptor(_class2.prototype, "handleChange", [_dec33], Object.getOwnPropertyDescriptor(_class2.prototype, "handleChange"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "handleLiveChange", [_dec34], Object.getOwnPropertyDescriptor(_class2.prototype, "handleLiveChange"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onValidateFieldGroup", [_dec35], Object.getOwnPropertyDescriptor(_class2.prototype, "onValidateFieldGroup"), _class2.prototype), _class2)) || _class) || _class) || _class); // Interface declaration merging to expose FieldMixin methods to TypeScript
  // This tells TypeScript that Field has these methods from FieldMixin, even though they're added at runtime
  return Field;
}, false);
//# sourceMappingURL=Field-dbg.js.map
