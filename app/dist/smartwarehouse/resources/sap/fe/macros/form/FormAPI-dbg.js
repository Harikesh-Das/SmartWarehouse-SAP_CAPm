/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/controls/HideFormGroupAutomatically", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/converters/controls/Common/Form", "sap/fe/core/converters/controls/ObjectPage/SubSection", "sap/fe/core/converters/helpers/ID", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/DataModelPathHelper", "sap/m/Text", "sap/m/Title", "sap/ui/core/CustomData", "sap/ui/core/Title", "sap/ui/core/library", "sap/ui/layout/form/ColumnLayout", "sap/ui/layout/form/Form", "sap/ui/layout/form/FormContainer", "sap/ui/layout/form/ResponsiveGridLayout", "sap/ui/model/odata/v4/AnnotationHelper", "../FormElement", "../MacroAPI", "./FormContainerAPI", "./FormContainerHelper", "./FormHelper", "./FormLayoutOptions", "sap/fe/base/jsx-runtime/jsx"], function (Log, BindingToolkit, ClassSupport, HideFormGroupAutomatically, MetaModelConverter, DataField, Form, SubSection, ID, BindingHelper, StableIDHelper, DataModelPathHelper, Text, MTitle, CustomData, Title, library, ColumnLayoutControl, UI5Form, UI5FormContainer, ResponsiveGridLayoutControl, AnnotationHelper, FormElement, MacroAPI, FormContainer, FormContainerHelper, FormHelper, FormLayoutOptions, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17;
  var getFormContainerContent = FormContainerHelper.getFormContainerContent;
  var TitleLevel = library.TitleLevel;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var UI = BindingHelper.UI;
  var getFormContainerID = ID.getFormContainerID;
  var getFacetActions = SubSection.getFacetActions;
  var createFormDefinition = Form.createFormDefinition;
  var hasIdentificationTarget = DataField.hasIdentificationTarget;
  var hasFieldGroupTarget = DataField.hasFieldGroupTarget;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var association = ClassSupport.association;
  var aggregation = ClassSupport.aggregation;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var equal = BindingToolkit.equal;
  var compileExpression = BindingToolkit.compileExpression;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
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
  let FormAPI = (_dec = defineUI5Class("sap.fe.macros.form.FormAPI"), _dec2 = implementInterface("sap.fe.macros.controls.section.ISingleSectionContributor"), _dec3 = property({
    type: "string",
    required: true
  }), _dec4 = property({
    type: "string",
    required: true,
    expectedTypes: ["EntitySet", "NavigationProperty", "Singleton", "EntityType"]
  }), _dec5 = property({
    type: "string",
    required: true,
    expectedAnnotations: ["com.sap.vocabularies.UI.v1.FieldGroupType", "com.sap.vocabularies.UI.v1.CollectionFacet", "com.sap.vocabularies.UI.v1.ReferenceFacet"],
    expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"]
  }), _dec6 = property({
    type: "array"
  }), _dec7 = property({
    type: "string"
  }), _dec8 = property({
    type: "boolean"
  }), _dec9 = property({
    type: "string[]"
  }), _dec10 = property({
    type: "boolean"
  }), _dec11 = property({
    type: "string",
    required: true
  }), _dec12 = property({
    type: "sap.ui.core.TitleLevel"
  }), _dec13 = property({
    type: "string",
    bindToState: true
  }), _dec14 = property({
    type: "boolean"
  }), _dec15 = event(), _dec16 = aggregation({
    type: "sap.fe.macros.FormElement",
    multiple: true,
    isDefault: true
  }), _dec17 = aggregation({
    type: "sap.fe.macros.form.FormLayoutOptions"
  }), _dec18 = association({
    type: "sap.ui.core.Control"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_MacroAPI) {
    function FormAPI(props, others) {
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
      _this = _MacroAPI.call(this, combinedProps, others) || this;
      _initializerDefineProperty(_this, "__implements__sap_fe_macros_controls_section_ISingleSectionContributor", _descriptor, _this);
      /**
       * The identifier of the form control.
       */
      _initializerDefineProperty(_this, "id", _descriptor2, _this);
      /**
       * Defines the path of the context used in the current page or block.
       * This setting is defined by the framework.
       * @public
       */
      _initializerDefineProperty(_this, "contextPath", _descriptor3, _this);
      /**
       * Defines the relative path of the property in the metamodel, based on the current contextPath.
       * @public
       */
      _initializerDefineProperty(_this, "metaPath", _descriptor4, _this);
      /**
       * The manifest defined form containers to be shown in the action area of the table
       */
      _initializerDefineProperty(_this, "formContainers", _descriptor5, _this);
      /**
       * The designtime settings for the form
       */
      _initializerDefineProperty(_this, "designtime", _descriptor6, _this);
      /**
       * Control the rendering of the form container labels
       */
      _initializerDefineProperty(_this, "useFormContainerLabels", _descriptor7, _this);
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
      _initializerDefineProperty(_this, "navigationPropertiesForAdaptationDialog", _descriptor8, _this);
      /**
       * Toggle Preview: Part of Preview / Preview using the 'Show More' Button
       */
      _initializerDefineProperty(_this, "partOfPreview", _descriptor9, _this);
      /**
       * The title of the form control.
       * @public
       */
      _initializerDefineProperty(_this, "title", _descriptor10, _this);
      /**
       * Defines the "aria-level" of the form title. Titles of internally used form containers are nested subsequently
       */
      _initializerDefineProperty(_this, "titleLevel", _descriptor11, _this);
      _initializerDefineProperty(_this, "displayMode", _descriptor12, _this);
      /**
       * Parameter which sets the visibility of the Form building block
       * @public
       */
      _initializerDefineProperty(_this, "visible", _descriptor13, _this);
      // Independent from the form title, can be a bit confusing in standalone usage at is not showing anything by default
      // Just proxied down to the Field may need to see if needed or not
      _initializerDefineProperty(_this, "onChange", _descriptor14, _this);
      _initializerDefineProperty(_this, "formElements", _descriptor15, _this);
      /**
       * Defines the layout to be used within the form.
       * It defaults to the ColumnLayout, but you can also use a ResponsiveGridLayout.
       * All the properties of the ResponsiveGridLayout can be added to the configuration.
       * @public
       */
      _initializerDefineProperty(_this, "layout", _descriptor16, _this);
      /**
       * The original id for the form content.
       * @private
       */
      _initializerDefineProperty(_this, "_formContentId", _descriptor17, _this);
      return _this;
    }
    _inheritsLoose(FormAPI, _MacroAPI);
    var _proto = FormAPI.prototype;
    _proto.getSectionContentRole = function getSectionContentRole() {
      return "provider";
    }

    /**
     * Implementation of the getDataFromProvider method which is a part of the ISingleSectionContributor
     *
     * Is called from the sap.fe.macros.controls.Section control when there is a Form building block rendered within a section
     * and the form's title is provided to the Section and accordingly adjusted here.
     * @param useSingleTextAreaFieldAsNotes
     * @returns The title of the form
     */;
    _proto.getDataFromProvider = function getDataFromProvider(useSingleTextAreaFieldAsNotes) {
      const formContent = this.content;
      const formContainers = formContent.getFormContainers();
      if (useSingleTextAreaFieldAsNotes && formContainers.length) {
        formContainers.forEach(formContainer => {
          FormContainer.setTextAreaLabelVisibility(formContainer);
        });
      }
      // if the form's content directly has a title
      let formTitle = "";
      if (formContainers.length === 1) {
        const formContentTitle = formContent.getTitle()?.getText();
        if (formContentTitle) {
          formTitle = formContentTitle;
          formContent.setTitle("");
          return {
            title: formTitle
          };
        }
        const formContainerTitle = formContainers[0]?.getTitle()?.getText();
        //if the title from the formContainer needs to be fetched
        if (formContainerTitle && formContainerTitle !== "") {
          formTitle = formContainerTitle;
        }

        // if the title needs to be fetched from the toolbar aggregation's content of form container
        let formActionToolbarTitleControl;
        formContainers[0].getAggregation("toolbar")?.getContent().forEach(function (innerControl) {
          if (innerControl.isA("sap.m.Title")) {
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
          formActionToolbarTitleControl?.setTitle(new MTitle(""));
          return {
            title: formTitle
          };
        }
      }
      return {
        title: formTitle
      };
    };
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      if (this.content === undefined || this.content === null) {
        this.setupDesigntime();
        this.prepareFormContainers();
        this.content = this.createContent();
      }
    };
    _proto.prepareFormContainers = function prepareFormContainers() {
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
        const oContextObjectPath = this.getDataModelObjectForMetaPath(this.metaPath, this.contextPath);
        if (!oContextObjectPath) {
          return;
        }
        const mExtraSettings = {};
        let oFacetDefinition = oContextObjectPath.targetObject;
        let hasFieldGroup = false;
        if (oFacetDefinition && oFacetDefinition.$Type === "com.sap.vocabularies.UI.v1.FieldGroupType") {
          // Wrap the facet in a fake Facet annotation
          hasFieldGroup = true;
          oFacetDefinition = {
            $Type: "com.sap.vocabularies.UI.v1.ReferenceFacet",
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
          };
          mExtraSettings[oFacetDefinition.Target.value] = {
            fields: this.formElements?.reduce((formContainers, formElement) => {
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
            }, {})
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
            viewData: {
              getData: () => viewData
            }
          }
        };
        const oConverterContext = MacroAPI.getConverterContext(oContextObjectPath, this.contextPath,
        // Keep as string for converter context
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        settings,
        // TODO: look into TemplateProcessorSettings
        mExtraSettings);
        let oFormDefinition;
        try {
          const facetActions = oFacetDefinition ? getFacetActions(oFacetDefinition, oConverterContext).actions : [];
          oFormDefinition = createFormDefinition(oFacetDefinition, compileExpression(this.visible), oConverterContext, facetActions);
        } catch (error) {
          Log.warning(`Form building block: skipping unsupported facet at "${this.metaPath}":`, error instanceof Error ? error.message : String(error));
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
          const facetId = oContextObjectPath.targetObject.ID;
          if (facetId && sections[facetId.toString()] !== undefined) {
            targetLayout = sections[facetId.toString()].layout;
          }
          if (!targetLayout) {
            const manifestFormConfiguration = oConverterContext.getManifestControlConfiguration(oConverterContext.getRelativeAnnotationPath(oContextObjectPath.targetObject.fullyQualifiedName ?? "", oContextObjectPath.targetEntityType));
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
          this.formContainers.forEach(formContainer => {
            formContainer.navigationPropertiesForAdaptationDialog = formContainer.navigationPropertiesForAdaptationDialog ?? this.navigationPropertiesForAdaptationDialog;
          });
        }
        this.facetType = oFacetDefinition && oFacetDefinition.$Type;
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
    };
    _proto.setupDesigntime = function setupDesigntime() {
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
    };
    _proto.getDataFieldCollection = function getDataFieldCollection(formContainer, facetContext) {
      const facet = getInvolvedDataModelObjects(facetContext).targetObject;
      let navigationPath;
      let idPart;
      if (facet.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet") {
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
      const contextPath = navigationPath && formContainer.entitySet ? this.computedContextPath?.getModel().getContext(formContainer.entitySet) : this.computedContextPath;
      return getFormContainerContent({
        id: id,
        visible: formContainer.isVisible,
        title: title,
        titleLevel: titleLevel,
        displayMode: this.displayMode,
        macrodata: {
          navigationPath: navigationPath,
          UiHiddenPresent: formContainer.annotationHidden,
          etName: contextPath.getObject("./@sapui.name"),
          navigationPropertiesForAdaptationDialog: formContainer.navigationPropertiesForAdaptationDialog
        },
        actions: formContainer.actions,
        dataFieldCollection: formContainer.formElements,
        designtimeSettings: formContainer.flexSettings?.designtime === "Default" || !formContainer.flexSettings?.designtime ? "sap/fe/macros/form/FormContainer.designtime" : formContainer.flexSettings.designtime,
        slotElements: this.formElements,
        ibnMappingProperties: formContainer.ibnMappingProperties
      }, contextPath, this.getPageController(), facetContext);
    };
    _proto.getFormContainers = function getFormContainers() {
      if (this.formContainers?.length === 0) {
        return [undefined];
      }
      if (this.facetType?.includes("com.sap.vocabularies.UI.v1.CollectionFacet") === true) {
        return this.formContainers.map((formContainer, _formContainerIdx) => {
          if (formContainer.isVisible) {
            const facetContext = this.computedContextPath?.getModel().createBindingContext(formContainer.annotationPath, this.computedContextPath);
            const facet = facetContext.getObject();
            if (facet.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet" && FormHelper.isReferenceFacetPartOfPreview(facet, this.partOfPreview)) {
              if (facet.Target.$AnnotationPath.$Type === "com.sap.vocabularies.Communication.v1.AddressType") {
                const navigationPath = facet.Target.value && facet.Target.value.includes("/") ? facet.Target.value.split("/")[0] : "";
                const title = facet.Label;
                const facetId = facet.ID || "AddressSection";
                const formContainerId = this._formContentId ? StableIDHelper.generate(["fe", "FormContainer", facetId]) : undefined;
                const formElementId = this._formContentId ? StableIDHelper.generate([this._formContentId, "FormElement", facetId]) : undefined;
                const entitySetContext = formContainer.entitySet ? this.computedContextPath?.getModel().getContext(formContainer.entitySet) : undefined;
                const dataModelObjectPath = entitySetContext ? getInvolvedDataModelObjects(entitySetContext) : undefined;
                const bindingExpression = FormHelper.generateBindingExpression(navigationPath, dataModelObjectPath);
                const isHidden = facet["@com.sap.vocabularies.UI.v1.Hidden"]?.$Path;
                const visibleExpression = isHidden ? `{= !\${${isHidden}} }` : "true";
                const formContainerDesigntime = formContainer.flexSettings?.designtime === "Default" || !formContainer.flexSettings?.designtime ? "sap/fe/macros/form/FormContainer.designtime" : formContainer.flexSettings.designtime;
                return _jsx(UI5FormContainer, {
                  id: formContainerId,
                  binding: bindingExpression,
                  visible: visibleExpression,
                  "dt:designtime": formContainerDesigntime,
                  children: {
                    title: title ? _jsx(Title, {
                      level: FormHelper.getFormContainerTitleLevel(this.title, this.titleLevel),
                      text: getExpressionFromAnnotation(title)
                    }) : undefined,
                    formElements: _jsx(FormElement, {
                      id: formElementId,
                      children: {
                        fields: _jsx(Text, {
                          text: "{facet>Target/$AnnotationPath/label@@MODEL.format}",
                          class: "sapMITBFilterNeutral"
                        })
                      }
                    })
                  }
                });
              }
              return this.getDataFieldCollection(formContainer, facetContext);
            }
          }
          return undefined;
        });
      } else if (this.facetType === "com.sap.vocabularies.UI.v1.ReferenceFacet") {
        return this.formContainers.map(formContainer => {
          if (formContainer.isVisible) {
            const facetContext = this.computedContextPath?.getModel().createBindingContext(formContainer.annotationPath, this.computedContextPath);
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
     */;
    _proto.checkIfTextAreaIsAlone = function checkIfTextAreaIsAlone() {
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
          const facet = getInvolvedDataModelObjects(facetContext).targetObject;
          let fieldGroup;
          let identification;

          // This is only for macros:form with a FieldGroup that contains only a TextArea
          if (facet.$Type === "com.sap.vocabularies.UI.v1.FieldGroupType") {
            fieldGroup = facet;
          } else if (hasFieldGroupTarget(facet)) {
            fieldGroup = facet?.Target?.$target;
          } else if (hasIdentificationTarget(facet)) {
            identification = facet?.Target?.$target;
          }
          if (fieldGroup?.Data.length === 1) {
            return fieldGroup.Data[0]?.Value?.$target?.annotations?.UI?.MultiLineText?.valueOf() === true;
          }
          if (identification?.length === 1) {
            return identification[0]?.Value?.$target?.annotations?.UI?.MultiLineText?.valueOf() === true;
          }
        }
      }
      return false;
    }

    /**
     * Create the proper layout information based on the `layout` property defined externally.
     * @param isTextAreaAlone Whether the section contains a lonely TextArea inside
     * @returns The layout information for the XML.
     */;
    _proto.getLayoutInformation = function getLayoutInformation(isTextAreaAlone) {
      let layoutConfig;
      if (this.layout) {
        const propertyBag = this.layout.getPropertyBag();
        layoutConfig = {
          type: propertyBag.type || "ColumnLayout",
          ...propertyBag
        };
      } else {
        layoutConfig = {
          type: "ColumnLayout",
          columnsM: 3,
          columnsXL: 6,
          columnsL: 4,
          labelCellsLarge: 12
        };
      }
      switch (layoutConfig.type) {
        case "ResponsiveGridLayout":
          return _jsx(ResponsiveGridLayoutControl, {
            adjustLabelSpan: layoutConfig.adjustLabelSpan,
            breakpointL: layoutConfig.breakpointL,
            breakpointM: layoutConfig.breakpointM,
            breakpointXL: layoutConfig.breakpointXL,
            columnsL: isTextAreaAlone ? 1 : layoutConfig.columnsL,
            columnsM: isTextAreaAlone ? 1 : layoutConfig.columnsM,
            columnsXL: isTextAreaAlone ? 1 : layoutConfig.columnsXL,
            emptySpanL: layoutConfig.emptySpanL,
            emptySpanM: layoutConfig.emptySpanM,
            emptySpanS: layoutConfig.emptySpanS,
            emptySpanXL: layoutConfig.emptySpanXL,
            labelSpanL: layoutConfig.labelSpanL,
            labelSpanM: layoutConfig.labelSpanM,
            labelSpanS: layoutConfig.labelSpanS,
            labelSpanXL: layoutConfig.labelSpanXL,
            singleContainerFullSize: layoutConfig.singleContainerFullSize,
            backgroundDesign: layoutConfig.backgroundDesign
          });
        case "ColumnLayout":
        default:
          return _jsx(ColumnLayoutControl, {
            columnsM: isTextAreaAlone ? 1 : layoutConfig.columnsM,
            columnsL: isTextAreaAlone ? 1 : layoutConfig.columnsL,
            columnsXL: isTextAreaAlone ? 1 : layoutConfig.columnsXL,
            labelCellsLarge: layoutConfig.labelCellsLarge,
            emptyCellsLarge: layoutConfig.emptyCellsLarge,
            backgroundDesign: layoutConfig.backgroundDesign
          });
      }
    };
    _proto.createContent = function createContent() {
      const isTextAreaAlone = this.checkIfTextAreaIsAlone();
      const contextPathPath = this.contextPath;
      const metaPathObject = this.getMetaPathObject(this.metaPath, this.contextPath);
      const onChangeStr = this.onChange && this.onChange.replace("{", "\\{").replace("}", "\\}") || "";
      return _jsx(UI5Form, {
        "dt:designtime": this.designtime,
        "fl:delegate": "{         \"name\": \"sap/fe/macros/form/FormDelegate\",         \"delegateType\": \"complete\"        }",
        id: this._formContentId,
        editable: this._editable,
        visible: this.visible,
        ariaLabelledBy: this.ariaLabelledBy,
        children: {
          title: this.title !== undefined ? _jsx(Title, {
            text: this.title,
            level: this.titleLevel
          }) : undefined,
          layout: this.getLayoutInformation(isTextAreaAlone),
          formContainers: this.getFormContainers(),
          dependents: _jsx(HideFormGroupAutomatically, {}),
          customData: [_jsx(CustomData, {
            value: metaPathObject?.getPath()
          }, "metaPath"), _jsx(CustomData, {
            value: contextPathPath
          }, "navigationPath"), _jsx(CustomData, {
            value: onChangeStr
          }, "onChange")]
        }
      });
    };
    return FormAPI;
  }(MacroAPI), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_fe_macros_controls_section_ISingleSectionContributor", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "formContainers", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "designtime", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "sap/fe/macros/form/Form.designtime";
    }
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "useFormContainerLabels", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "navigationPropertiesForAdaptationDialog", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "partOfPreview", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "title", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "titleLevel", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return TitleLevel.Auto;
    }
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "displayMode", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "onChange", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "formElements", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "layout", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "_formContentId", [_dec18], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return FormAPI;
}, false);
//# sourceMappingURL=FormAPI-dbg.js.map
