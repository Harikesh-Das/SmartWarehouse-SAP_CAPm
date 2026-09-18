/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/templating/BuildingBlockSupport", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/controls/Common/Form", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/UIFormatters", "../CommonHelper", "../field/FieldTemplating", "./FormHelper"], function (BuildingBlockSupport, BuildingBlockTemplateProcessor, BuildingBlockTemplatingBase, MetaModelConverter, Form, StableIDHelper, DataModelPathHelper, UIFormatters, CommonHelper, FieldTemplating, FormHelper) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16;
  var _exports = {};
  var getVisibleExpression = FieldTemplating.getVisibleExpression;
  var isMultiValueField = UIFormatters.isMultiValueField;
  var getRequiredExpressionForConnectedDataField = UIFormatters.getRequiredExpressionForConnectedDataField;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var createFormDefinition = Form.createFormDefinition;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var xml = BuildingBlockTemplateProcessor.xml;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockEvent = BuildingBlockSupport.blockEvent;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  var blockAggregation = BuildingBlockSupport.blockAggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block for creating a FormContainer based on the provided OData V4 metadata.
   *
   *
   * Usage example:
   * <pre>
   * &lt;macros:FormContainer
   * id="SomeId"
   * entitySet="{entitySet>}"
   * dataFieldCollection ="{dataFieldCollection>}"
   * title="someTitle"
   * navigationPath="{ToSupplier}"
   * visible=true
   * onChange=".handlers.onFieldValueChange"
   * /&gt;
   * </pre>
   * @private
   */
  let FormContainerBlock = (_dec = defineBuildingBlock({
    name: "FormContainer",
    namespace: "sap.fe.macros"
  }), _dec2 = blockAttribute({
    type: "string"
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true,
    isPublic: true,
    expectedTypes: ["EntitySet", "NavigationProperty", "EntityType", "Singleton"]
  }), _dec4 = blockAttribute({
    type: "sap.ui.model.Context"
  }), _dec5 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: true,
    required: true
  }), _dec6 = blockAttribute({
    type: "array"
  }), _dec7 = blockAttribute({
    type: "boolean"
  }), _dec8 = blockAttribute({
    type: "string"
  }), _dec9 = blockAttribute({
    type: "sap.ui.core.TitleLevel",
    isPublic: true
  }), _dec10 = blockAttribute({
    type: "string"
  }), _dec11 = blockAttribute({
    type: "string"
  }), _dec12 = blockAttribute({
    type: "boolean"
  }), _dec13 = blockAttribute({
    type: "string"
  }), _dec14 = blockAttribute({
    type: "array"
  }), _dec15 = blockAttribute({
    type: "boolean"
  }), _dec16 = blockAggregation({
    type: "sap.fe.macros.form.FormElement"
  }), _dec17 = blockEvent(), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockTemplat) {
    function FormContainerBlock(props, externalConfiguration, settings) {
      var _this;
      _this = _BuildingBlockTemplat.call(this, props) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _this);
      _initializerDefineProperty(_this, "entitySet", _descriptor3, _this);
      _initializerDefineProperty(_this, "metaPath", _descriptor4, _this);
      /**
       * Metadata path to the dataFieldCollection
       */
      _initializerDefineProperty(_this, "dataFieldCollection", _descriptor5, _this);
      /**
       * Control whether the form is in displayMode or not
       */
      _initializerDefineProperty(_this, "displayMode", _descriptor6, _this);
      /**
       * Title of the form container
       */
      _initializerDefineProperty(_this, "title", _descriptor7, _this);
      /**
       * Defines the "aria-level" of the form title, titles of internally used form containers are nested subsequently
       */
      _initializerDefineProperty(_this, "titleLevel", _descriptor8, _this);
      /**
       * Binding the form container using a navigation path
       */
      _initializerDefineProperty(_this, "navigationPath", _descriptor9, _this);
      /**
       * Binding the visibility of the form container using an expression binding or Boolean
       */
      _initializerDefineProperty(_this, "visible", _descriptor10, _this);
      /**
       * Check if UI hidden annotation is present or not
       */
      _initializerDefineProperty(_this, "hasUiHiddenAnnotation", _descriptor11, _this);
      /**
       * Flex designtime settings to be applied
       */
      _initializerDefineProperty(_this, "designtimeSettings", _descriptor12, _this);
      _initializerDefineProperty(_this, "actions", _descriptor13, _this);
      _initializerDefineProperty(_this, "useSingleTextAreaFieldAsNotes", _descriptor14, _this);
      _initializerDefineProperty(_this, "formElements", _descriptor15, _this);
      // Just proxied down to the Field may need to see if needed or not
      _initializerDefineProperty(_this, "onChange", _descriptor16, _this);
      _this.entitySet = _this.contextPath;
      if (_this.formElements && Object.keys(_this.formElements).length > 0) {
        const oContextObjectPath = getInvolvedDataModelObjects(_this.metaPath, _this.contextPath);
        const mExtraSettings = {};
        let oFacetDefinition = oContextObjectPath.targetObject;
        // Wrap the facet in a fake Facet annotation
        oFacetDefinition = {
          $Type: "com.sap.vocabularies.UI.v1.ReferenceFacet",
          Label: oFacetDefinition?.Label,
          Target: {
            $target: oFacetDefinition,
            fullyQualifiedName: oFacetDefinition?.fullyQualifiedName,
            path: "",
            term: "",
            type: "AnnotationPath",
            value: getContextRelativeTargetObjectPath(oContextObjectPath)
          },
          annotations: {},
          fullyQualifiedName: oFacetDefinition?.fullyQualifiedName
        };
        mExtraSettings[oFacetDefinition.Target.value] = {
          fields: _this.formElements
        };
        const oConverterContext = _this.getConverterContext(oContextObjectPath, /*this.contextPath*/undefined, settings, mExtraSettings);
        const oFormDefinition = createFormDefinition(oFacetDefinition, "true", oConverterContext);

        // FormContainer.block represents a single container. We wrap one FieldGroup in a fake ReferenceFacet,
        // so createFormDefinition always returns exactly one FormContainer at index [0]
        _this.dataFieldCollection = oFormDefinition.formContainers[0].formElements;
        if (oFormDefinition.formContainers[0].flexSettings?.designtime) {
          _this.designtimeSettings = oFormDefinition.formContainers[0].flexSettings.designtime === "Default" ? "sap/fe/macros/form/FormContainer.designtime" : oFormDefinition.formContainers[0].flexSettings.designtime;
        }
      }
      // We need the view id for the form elements stable ids generation
      _this.contentId = settings.viewId;
      return _this;
    }

    /**
     * Returns the template for the FormContainer.
     * @returns The XML template string.
     */
    _exports = FormContainerBlock;
    _inheritsLoose(FormContainerBlock, _BuildingBlockTemplat);
    var _proto = FormContainerBlock.prototype;
    _proto.getTemplate = function getTemplate() {
      const overflowToolbarID = this.id ? StableIDHelper.generate([this.id, "FormActionsToolbar"]) : undefined;
      const dataModelObject = getInvolvedDataModelObjects(this.contextPath, this.metaPath);
      const bindingString = FormHelper.generateBindingExpression(this.navigationPath, dataModelObject);
      let title = "";
      if (this.title && this.title.length > 0) {
        title = xml`<f:title>
				<core:Title level="${this.titleLevel}" text="${this.title}" />
			</f:title>`;
      }
      return xml`
		<f:FormContainer
			xmlns="sap.m"
			xmlns:f="sap.ui.layout.form"
			xmlns:macro="sap.fe.macros"
			xmlns:macroForm="sap.fe.macros.form"
			xmlns:internalMacro="sap.fe.macros.internal"
			xmlns:core="sap.ui.core"
			xmlns:controls="sap.fe.macros.controls"
			xmlns:dt="sap.ui.dt"
			xmlns:macrodata="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
			xmlns:fpm="sap.fe.macros.fpm"
			xmlns:template="http://schemas.sap.com/sapui5/extension/sap.ui.core.template/1"
			template:require="{
				MODEL: 'sap/ui/model/odata/v4/AnnotationHelper',
				ID: 'sap/fe/core/helpers/StableIdHelper',
				COMMON: 'sap/fe/macros/CommonHelper',
				FORM: 'sap/fe/macros/form/FormHelper',
				UI: 'sap/fe/core/templating/UIFormatters',
				DataField: 'sap/fe/core/templating/DataFieldFormatters',
				FieldTemplating: 'sap/fe/macros/field/FieldTemplating',
				Property: 'sap/fe/core/templating/PropertyFormatters',
				FIELD: 'sap/fe/macros/field/FieldHelper',
				MACRO: 'sap/fe/macros/MacroTemplating'
			}"

			core:require="{FormContainerRuntime: 'sap/fe/macros/form/FormContainerAPI'}"
			dt:designtime="${this.designtimeSettings}"
			id="${this.id || undefined}"
			visible="${this.visible}"
			macrodata:navigationPath="${this.navigationPath}"
			macrodata:etName="${this.contextPath.getObject("./@sapui.name")}"
			macrodata:UiHiddenPresent="${this.hasUiHiddenAnnotation}"
		>

			${title}
			<template:if test="${this.actions}">
				<template:then>
					<f:toolbar>
						<OverflowToolbar
							id="${overflowToolbarID}"
							${this.attr("binding", bindingString)}
						>
							<Title level="${this.titleLevel}" text="${this.title}" />
							<ToolbarSpacer />
							<template:repeat list="{actions>}" var="action">
								<core:Fragment fragmentName="sap.fe.macros.form.FormActionButtons" type="XML" />
							</template:repeat>
						</OverflowToolbar>
					</f:toolbar>
				</template:then>
			</template:if>

			<f:dependents>
				<macroForm:FormContainerAPI formContainerId="${this.id}" showDetails="{internal>showDetails}" />
			</f:dependents>

			<f:formElements>
				${this.getTemplatedFormElements()}
			</f:formElements>

		</f:FormContainer>`;
    }

    /**
     * Returns the templated form elements.
     * @returns The XML string for the form elements.
     */;
    _proto.getTemplatedFormElements = function getTemplatedFormElements() {
      return xml`
			<template:with path="dataFieldCollection>" var="formElements">
				${this.getInnerTemplatedFormElements()}
			</template:with>`;
    }

    /**
     * Returns the inner templated form elements, including DataPoint and Contact templates.
     * @returns The XML string for the inner form elements.
     */;
    _proto.getInnerTemplatedFormElements = function getInnerTemplatedFormElements() {
      let getDataPointTemplate = "";
      if (this.dataFieldCollection && this.dataFieldCollection.length > 0) {
        // We need to consider the first element that has an annotationPath
        const firstElementWithAnnotationPath = this.dataFieldCollection.find(df => !!df.annotationPath);
        let idPrefix = "";
        const isEditableHeader = this.id?.includes("HeaderFacet::FormContainer") === true;
        let formElementId = "undefined";
        if (this.id) {
          if (isEditableHeader) {
            formElementId = `${this.id}::FormElement`;
            idPrefix = `${this.id}::FormElement`;
          } else {
            formElementId = `${StableIDHelper.generate([this.id, "FormElement", this.dataFieldCollection[0].key])}`;
            idPrefix = `${StableIDHelper.generate([this.id, "FormElement", this.dataFieldCollection[0].key])}`;
          }
        }
        if (firstElementWithAnnotationPath?.annotationPath) {
          const computedDataModelObject = getInvolvedDataModelObjects(this.contextPath.getModel().createBindingContext(firstElementWithAnnotationPath?.annotationPath || ""));
          const bindingString = FormHelper.generateBindingExpression(this.navigationPath, computedDataModelObject);
          const designtime = computedDataModelObject?.targetObject?.annotations?.UI?.AdaptationHidden ? "not-adaptable-tree" : "sap/fe/macros/form/FormElement.designtime";
          getDataPointTemplate = xml`
					<template:with path="formElements>0/annotationPath" var="dataPoint">
						<f:FormElement
							dt:designtime="${designtime}"
							id="${formElementId}"
							label="{dataPoint>@@FIELD.computeLabelText}"
							visible="${getVisibleExpression(computedDataModelObject)}"
							${this.attr("binding", bindingString)}
						>
							<f:fields>
								<macro:Field
									idPrefix="${idPrefix}"
									vhIdPrefix="${this.id ? StableIDHelper.generate([this.id, "FieldValueHelp"]) : ""}"
									contextPath="${this.entitySet?.getPath()}"
									metaPath="${this.dataFieldCollection[0].annotationPath}"
									editMode="${this.displayMode === true ? "Display" : undefined}"
									onChange="${this.onChange}"
								>
									<formatOptions textAlignMode="Form" showEmptyIndicator="true" />
								</macro:Field>
							</f:fields>
						</f:FormElement>
					</template:with>

			`;
        }
      }
      const getContactTemplate = xml`
			<template:with path="formElements>0/annotationPath" var="metaPath">
				<f:FormElement
					dt:designtime="{= \${metaPath>./@com.sap.vocabularies.UI.v1.AdaptationHidden} ? 'not-adaptable-tree' :  'sap/fe/macros/form/FormElement.designtime' }"
					binding="{= FORM.generateBindingExpression(\${this.navigationPath},\${contextPath>@@UI.getDataModelObjectPath})}"
				>
				<f:label>
					<Label
						text="{metaPath>fn/$Path@com.sap.vocabularies.Common.v1.Label}"
						visible="{= FieldTemplating.getVisibleExpression(\${dataField>@@UI.getDataModelObjectPath})}"
					>
					<layoutData>
						<f:ColumnElementData cellsLarge="12" />
					</layoutData>
				</Label>
				</f:label>
					<f:fields>
						<macro:Contact
							metaPath="{metaPath>@@COMMON.getMetaPath}"
								contextPath="{contextPath>@@COMMON.getMetaPath}"
								visible="true"
							/>
					</f:fields>
				</f:FormElement>
			</template:with>`;
      return xml`
			<template:if test="{= \${formElements>0/annotationPath}.indexOf('com.sap.vocabularies.UI.v1.DataPoint') > -1 }">
				<template:then>
					${getDataPointTemplate}
				</template:then>
				<template:elseif
					test="{= \${formElements>0/annotationPath}.indexOf('com.sap.vocabularies.Communication.v1.Contact') > -1 }"
				>
					${getContactTemplate}
				</template:elseif>
				<template:else>
					${this.getDataFieldsForAnnotations()}
				</template:else>
			</template:if>`;
    }

    /**
     * Generates the template for a form element with connected fields.
     * @param formElement The form element.
     * @returns The XML string for the connected fields form element.
     */;
    _proto.getConnectedFieldsFormElement = function getConnectedFieldsFormElement(formElement) {
      let connectedFieldElements = "";

      // Create a sorted copy of the connected fields based on the placeholder order in the template string.
      // The template string is expected to look like "{FieldA} / {FieldB}" etc. We extract the placeholder
      // sequence and sort the connected fields accordingly (falling back to original order for unmatched fields).
      let sortedConnectedFields = formElement.connectedFields ? [...formElement.connectedFields] : [];
      if (sortedConnectedFields.length > 1) {
        const templateString = sortedConnectedFields[0].originalTemplate || "";
        // Extract placeholders in the sequence defined by the template (e.g. "{FieldA} / {FieldB}")
        const placeholders = Array.from(templateString.matchAll(/\{([^}]+)\}/g)).map(m => String(m[1]).trim()).filter(p => p.length > 0);

        // Helper to derive the identifier from the connected field (last segment of fullyQualifiedName)
        const getFieldIdentifier = cf => {
          const originalObject = cf.originalObject;
          return originalObject?.fullyQualifiedName ? originalObject.fullyQualifiedName.substring(originalObject.fullyQualifiedName.lastIndexOf("/") + 1) : "";
        };
        const fieldIds = sortedConnectedFields.map(getFieldIdentifier);
        const uniquePlaceholders = new Set(placeholders);

        // We only reorder if the template is perfectly annotated:
        // 1. Same number of placeholders as connected fields
        // 2. All placeholders are unique
        // 3. Every connected field id is referenced exactly once
        const isPerfectMatch = placeholders.length === sortedConnectedFields.length && uniquePlaceholders.size === placeholders.length && fieldIds.every(id => uniquePlaceholders.has(id));

        // Review feedback: Do NOT "fix" badly annotated connected fields.
        // If the annotation is not perfect, we keep the original order.
        if (isPerfectMatch) {
          const mapById = new Map(sortedConnectedFields.map(cf => [getFieldIdentifier(cf), cf]));
          sortedConnectedFields = placeholders.map(ph => mapById.get(ph));
        }
      }
      for (const connectedField of sortedConnectedFields) {
        const model = this.contextPath.getModel();
        const tempName = connectedField.originalObject?.fullyQualifiedName;
        const path = tempName?.substring(tempName.lastIndexOf("/") + 1);
        const bindingContext = model.createBindingContext(formElement.annotationPath + "Target/$AnnotationPath/Data/" + path);
        const delimiter = CommonHelper.getDelimiter(connectedField.originalTemplate ?? "");
        const notLastIndexCondition = sortedConnectedFields.indexOf(connectedField) !== sortedConnectedFields.length - 1 ? xml`<Text
text="${delimiter}"
class="sapUiSmallMarginBeginEnd"
width="100%"
/>` : "";
        const computedIdPrefix = this.id ? StableIDHelper.generate([this.id, "SemanticFormElement", formElement.key, connectedField.originalObject?.Value.path]) : "";
        const computedVhIdPrefix = this.id ? StableIDHelper.generate([this.id, formElement.key, "FieldValueHelp"]) : "";

        // if there is a label on the connected field, we create an invisible text for aria-labelledby for proper screen reading
        const connectedFieldPath = connectedField.originalObject?.Value?.path?.valueOf();
        const connectedFieldLabel = connectedField.originalObject?.Value?.$target?.annotations?.Common?.Label?.valueOf();
        let ariaLabelId = "";
        let ariaLabelText = "";
        if (this.id && connectedFieldPath && connectedFieldLabel) {
          ariaLabelId = StableIDHelper.generate([this.id, "AriaText", formElement.key, connectedFieldPath]);
          ariaLabelText = xml`
					<core:InvisibleText
						text="${connectedFieldLabel}"
						id="${ariaLabelId}"
					/>
				`;
        }
        let connectedFieldElement = "";
        connectedFieldElement = xml`
                ${ariaLabelText}
				<macro:Field
                    idPrefix="${computedIdPrefix}"
                    vhIdPrefix="${computedVhIdPrefix}"
                    contextPath="${this.entitySet?.getPath()}"
                    metaPath="${bindingContext.getPath()}"
                    onChange="${this.onChange}"
                    ariaLabelledBy="${this.id ? [StableIDHelper.generate([this.id, "SemanticFormElementLabel", formElement.key]), ariaLabelId] : ""}"
                >
                    <formatOptions
                        textLinesEdit="${formElement.formatOptions?.textLinesEdit}"
                        textMaxLines="${formElement.formatOptions?.textMaxLines}"
                        textMaxCharactersDisplay="${formElement.formatOptions?.textMaxCharactersDisplay}"
                        textMaxLength="${formElement.formatOptions?.textMaxLength}"
                        textExpandBehaviorDisplay="${formElement.formatOptions?.textExpandBehaviorDisplay}"
                        textAlignMode="Form"
                        showEmptyIndicator="true"
                        fieldEditStyle="${formElement.formatOptions?.fieldEditStyle}"
                        radioButtonsHorizontalLayout="${formElement.formatOptions?.radioButtonsHorizontalLayout}"
                        createAssociatedAriaLabel="true"
						imageFitType="${formElement.formatOptions?.imageFitType}"
                    />
                    <macro:layoutData>
                        <FlexItemData growFactor="{= %{ui>/isEditable} ? 1 : 0}" />
                    </macro:layoutData>
                </macro:Field>
                ${notLastIndexCondition}
                `;
        connectedFieldElements += connectedFieldElement;
      }
      const dataModelObjectForConnectedFields = getInvolvedDataModelObjects(this.contextPath.getModel().createBindingContext(formElement.annotationPath ?? ""));
      let formElementId = "";
      if (this.id) {
        if (this.contentId) {
          formElementId = `${this.contentId}--${StableIDHelper.generate([this.id, "SemanticFormElement", formElement.key])}`;
        } else {
          formElementId = `${StableIDHelper.generate([this.id, "SemanticFormElement", formElement.key])}`;
        }
      }
      const visibleExpression = formElement.isPartOfPreview ? getVisibleExpression(dataModelObjectForConnectedFields) : "{= ${internal>showDetails} === true}";
      const bindingString = FormHelper.generateBindingExpression(this.navigationPath, dataModelObjectForConnectedFields);
      const targetObject = dataModelObjectForConnectedFields?.targetObject?.Target?.$target;
      const designtime = dataModelObjectForConnectedFields?.targetObject?.annotations?.UI?.AdaptationHidden ? "not-adaptable-tree" : "sap/fe/macros/form/FormElement.designtime";
      const isRequired = getRequiredExpressionForConnectedDataField(dataModelObjectForConnectedFields)?.toString();
      return xml`
            <f:FormElement
                xmlns:f="sap.ui.layout.form"
                dt:designtime="${designtime}"
                id="${formElementId}"
                visible="${visibleExpression}"
                ${this.attr("binding", bindingString)}
            >
                <f:label>
                    <Label
                    text="${targetObject?.Label ?? formElement.label}"
                    id="${this.id ? StableIDHelper.generate([this.id, "SemanticFormElementLabel", formElement.key]) : ""}"

                    />
                </f:label>
				<f:fields>
                    <controls:FieldWrapper required="${isRequired}">
                        <HBox wrap="Wrap">
							${connectedFieldElements}
                        </HBox>
                    </controls:FieldWrapper>
                </f:fields>
            </f:FormElement>
        `;
    }

    /**
     * Generates the template for a form element representing a multivalue field.
     * @param formElement The form element.
     * @returns The XML string for the multi-value field form element.
     */;
    _proto.getMultiValueFieldFormElement = function getMultiValueFieldFormElement(formElement) {
      const computedDataModelObject = getInvolvedDataModelObjects(this.contextPath.getModel().createBindingContext(formElement.annotationPath ?? ""));
      const visibleExpression = formElement.isPartOfPreview ? getVisibleExpression(computedDataModelObject) : "{= ${internal>showDetails} === true}";
      const bindingString = FormHelper.generateBindingExpression(this.navigationPath, computedDataModelObject);
      const formElementId = this.id ? `${StableIDHelper.generate([this.id, "FormElement", formElement.key])}` : "undefined";
      const multiValueFieldId = this.id ? `${StableIDHelper.generate([this.id, "FormElement", formElement.key, "MultiValueField"])}` : "undefined";
      const vhIdPrefix = this.id ? StableIDHelper.generate([this.id, "FieldValueHelp"]) : "";
      const designtime = computedDataModelObject?.targetObject?.annotations?.UI?.AdaptationHidden ? "not-adaptable-tree" : "sap/fe/macros/form/FormElement.designtime";
      return xml`
												<f:FormElement
													xmlns:macros="sap.fe.macros"
													xmlns:multivaluefield="sap.fe.macros.multivaluefield"
													dt:designtime="${designtime}"
													id="${formElementId}"
													label="${formElement.label}"
													visible="${visibleExpression}"
													${this.attr("binding", bindingString)}
												>
													<f:fields>
														<macros:MultiValueField
															id="${multiValueFieldId}"
															vhIdPrefix="${vhIdPrefix}"
															contextPath="${this.entitySet?.getPath()}"
															metaPath="${formElement.annotationPath}"
														>
															<macros:formatOptions>
																<multivaluefield:FormatOptions showEmptyIndicator="true" />
															</macros:formatOptions>
														</macros:MultiValueField>
													</f:fields>
												</f:FormElement>`;
    }

    /**
     * Generates the template for form elements representing a checkbox group.
     * @param formElement The form element.
     * @returns The XML string for the checkbox group form elements.
     */;
    _proto.getFieldGroupFormElement = function getFieldGroupFormElement(formElement) {
      let fieldGroupElements = "";
      //We template each element of the checkbox group
      for (const groupElement of formElement.fieldGroupElements) {
        const model = this.contextPath.getModel();
        const tempName = groupElement.fullyQualifiedName;
        const path = tempName?.substring(tempName.lastIndexOf("/") + 1);
        const bindingContext = model.createBindingContext(formElement.annotationPath + "Target/$AnnotationPath/Data/" + path);
        const groupElementDataModelObject = getInvolvedDataModelObjects(bindingContext);
        const computedIdPrefix = this.id ? `${StableIDHelper.generate([this.id, "CheckBoxGroup", formElement.key, groupElementDataModelObject.targetObject?.Value?.path])}` : "";
        const isBooleanFieldGroup = groupElementDataModelObject.targetObject?.Value?.$target?.type === "Edm.Boolean";
        const fieldGroupElement = isBooleanFieldGroup ? xml`
				<macro:Field
					idPrefix="${computedIdPrefix}"
					contextPath="${this.entitySet?.getPath()}"
					metaPath="${bindingContext.getPath()}"
					onChange="${this.onChange}"
					ariaLabelledBy="${this.id ? StableIDHelper.generate([this.id, "FieldGroupFormElementLabel", formElement.key]) : ""}"
				>
					<formatOptions isFieldGroupItem="true" textAlignMode="Form" />
				</macro:Field>
			` : "";
        fieldGroupElements += fieldGroupElement;
      }
      const computedDataModelObject = getInvolvedDataModelObjects(this.contextPath.getModel().createBindingContext(formElement.annotationPath ?? ""));
      const visibleExpression = formElement.isPartOfPreview ? getVisibleExpression(computedDataModelObject) : "{= ${internal>showDetails} === true}";
      const bindingString = FormHelper.generateBindingExpression(this.navigationPath, computedDataModelObject);
      let fieldGroupFormElementId = "";
      let labelID = "";
      if (this.id) {
        if (this.contentId) {
          fieldGroupFormElementId = `${this.contentId}--${StableIDHelper.generate([this.id, "FieldGroupFormElement", formElement.key])}`;
          labelID = `${this.contentId}--${StableIDHelper.generate([this.id, "FieldGroupFormElementLabel", formElement.key])}`;
        } else {
          fieldGroupFormElementId = `${StableIDHelper.generate([this.id, "FieldGroupFormElement", formElement.key])}`;
          labelID = `${StableIDHelper.generate([this.id, "FieldGroupFormElementLabel", formElement.key])}`;
        }
      }
      const targetObject = computedDataModelObject?.targetObject?.Target?.$target;
      const designtime = computedDataModelObject?.targetObject?.annotations?.UI?.AdaptationHidden ? "not-adaptable-tree" : "sap/fe/macros/form/FormElement.designtime";
      return xml`
												<f:FormElement
													xmlns:f="sap.ui.layout.form"
													dt:designtime="${designtime}"
													id="${fieldGroupFormElementId}"
													visible="${visibleExpression}"
													${this.attr("binding", bindingString)}
												>
													<f:label>
														<Label
															text="${targetObject?.Label ?? formElement.label}"
															id="${labelID}"
														/>
													</f:label>
													<f:fields>
														<controls:RequiredFlexBox>
															<FlexBox
																direction="${formElement.formatOptions?.fieldGroupHorizontalLayout === true ? "Row" : "Column"}"
																wrap="Wrap"
																columnGap="1rem"
															>
																<items>
																	${fieldGroupElements}
																</items>
															</FlexBox>
														</controls:RequiredFlexBox>
													</f:fields>
												</f:FormElement>
											`;
    }

    /**
     * Generates the template for a form element representing a field.
     * @param formElement The form element.
     * @returns The XML string for the field form element.
     */;
    _proto.getFieldFormElement = function getFieldFormElement(formElement) {
      const computedDataModelObject = getInvolvedDataModelObjects(this.contextPath.getModel().createBindingContext(formElement.annotationPath ?? ""));
      const bindingString = FormHelper.generateBindingExpression(this.navigationPath, computedDataModelObject);
      const computedVhIdPrefix = StableIDHelper.generate([this.id, "FieldValueHelp"]);
      let formElementId = "undefined";
      const visibleExpression = formElement.isPartOfPreview ? getVisibleExpression(computedDataModelObject) : "{= ${internal>showDetails} === true}";
      const computedIdPrefix = this.id ? `${StableIDHelper.generate([this.id, "FormElement", formElement.key])}` : "";
      if (this.id) {
        if (this.contentId) {
          formElementId = `${this.contentId}--${StableIDHelper.generate([this.id, "FormElement", formElement.key])}`;
        } else {
          formElementId = `${StableIDHelper.generate([this.id, "FormElement", formElement.key])}`;
        }
      }
      const designtime = computedDataModelObject?.targetObject?.annotations?.UI?.AdaptationHidden ? "not-adaptable-tree" : "sap/fe/macros/form/FormElement.designtime";
      return xml`
												<f:FormElement
													xmlns:f="sap.ui.layout.form"
													dt:designtime="${designtime}"
													id="${formElementId}"
													label="${formElement.label}"
													visible="${visibleExpression}"
													${this.attr("binding", bindingString)}
												>
													<f:fields>
<macro:Field
idPrefix="${computedIdPrefix}"
vhIdPrefix="${computedVhIdPrefix}"
contextPath="${this.contextPath.getPath()}"
metaPath="${formElement.annotationPath}"
onChange="${this.onChange}"
readOnly="${formElement.readOnly}"
semanticObject="${formElement.semanticObject}"
>
<formatOptions
textLinesEdit="${formElement.formatOptions?.textLinesEdit}"
textMaxLines="${formElement.formatOptions?.textMaxLines}"
textMaxLength="${formElement.formatOptions?.textMaxLength}"
textMaxCharactersDisplay="${formElement.formatOptions?.textMaxCharactersDisplay}"
textExpandBehaviorDisplay="${formElement.formatOptions?.textExpandBehaviorDisplay}"
textAlignMode="Form"
showEmptyIndicator="true"
fieldEditStyle="${formElement.formatOptions?.fieldEditStyle}"
radioButtonsHorizontalLayout="${formElement.formatOptions?.radioButtonsHorizontalLayout}"
dateTimePattern="${formElement.formatOptions?.pattern}"
useRadioButtonsForBoolean="${formElement.formatOptions?.useRadioButtonsForBoolean}"
imageFitType="${formElement.formatOptions?.imageFitType}"
/>
</macro:Field>
													</f:fields>
												</f:FormElement>
											`;
    }

    /**
     * Generates the template for a custom form element.
     * @param formElement The custom form element.
     * @returns The XML string for the custom form element.
     */;
    _proto.getCustomFormElement = function getCustomFormElement(formElement) {
      const propertyPath = this.contextPath.getPath(formElement.propertyPath);
      const computedDataModelObject = getInvolvedDataModelObjects(this.contextPath.getModel().createBindingContext(propertyPath));
      const bindingString = FormHelper.generateBindingExpression(this.navigationPath, computedDataModelObject);
      let formElementId = "";
      if (this.id) {
        if (this.contentId) {
          formElementId = `${this.contentId}--${StableIDHelper.generate([this.id, formElement.id])}`;
        } else {
          formElementId = `${StableIDHelper.generate([this.id, formElement.id])}`;
        }
      }
      const designtime = computedDataModelObject?.targetObject?.annotations?.UI?.AdaptationHidden ? "not-adaptable-tree" : "sap/fe/macros/form/FormElement.designtime";
      const formElementKey = StableIDHelper.generate([this.id, formElement.key]);
      return xml`
								<f:FormElement
										dt:designtime="${designtime}"
										id="${formElementId}"
										label="${formElement.label}"
										${this.attr("visible", formElement.visible)}
										${this.attr("binding", bindingString)}
									>
										<f:fields>
											<macroForm:CustomFormElement
												metaPath="${formElement.propertyPath}"
												contextPath="${this.contextPath.getPath()}"
												formElementKey="${formElementKey}"
											>
												<fpm:CustomFragment
													id="${formElementKey}"
													fragmentName="${formElement.template}"
													contextPath="${this.contextPath.getPath()}"
												/>
											</macroForm:CustomFormElement>
										</f:fields>
									</f:FormElement>
		`;
    }

    /**
     * Returns the template for a slot column for the given form element.
     * @param formElement The form element.
     * @returns The XML string for the slot column.
     */;
    _proto.getSlotColumn = function getSlotColumn(formElement) {
      return xml`<slot name="${formElement.key}" />`;
    }

    /**
     * Determines if the given data field is a multivalue field.
     * @param dataField The data field to check.
     * @returns True if the data field is a multivalue field, false otherwise.
     */;
    _proto.isMultiValueDataField = function isMultiValueDataField(dataField) {
      let isMultiValueFieldCondition = false;
      if (dataField.annotationPath) {
        const bindingContext = this.contextPath.getModel().createBindingContext(dataField.annotationPath);
        const valuePath = bindingContext.getObject()?.Value?.$Path;
        if (valuePath) {
          isMultiValueFieldCondition = isMultiValueField(enhanceDataModelPath(getInvolvedDataModelObjects(bindingContext), valuePath));
        }
      }
      return isMultiValueFieldCondition;
    }

    /**
     * Generates the template for all data fields for annotations.
     * @returns The XML string for the data fields.
     */;
    _proto.getDataFieldsForAnnotations = function getDataFieldsForAnnotations() {
      let returnString = "";
      if (this.dataFieldCollection !== undefined) {
        for (const dataField of this.dataFieldCollection) {
          switch (dataField.type) {
            case "Annotation":
              if (dataField.connectedFields && dataField.connectedFields.length > 0) {
                returnString += this.getConnectedFieldsFormElement(dataField);
              } else if (this.isMultiValueDataField(dataField)) {
                returnString += this.getMultiValueFieldFormElement(dataField);
              } else if (dataField.fieldGroupElements && dataField.fieldGroupElements.length > 0) {
                returnString += this.getFieldGroupFormElement(dataField);
              } else {
                returnString += this.getFieldFormElement(dataField);
              }
              break;
            case "Default":
              returnString += this.getCustomFormElement(dataField);
              break;
            default:
              returnString += this.getSlotColumn(dataField);
              break;
          }
        }
      }
      return xml`${returnString}`;
    };
    return FormContainerBlock;
  }(BuildingBlockTemplatingBase), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "entitySet", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "dataFieldCollection", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "displayMode", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "title", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "titleLevel", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "Auto";
    }
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "navigationPath", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "hasUiHiddenAnnotation", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "designtimeSettings", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "sap/fe/macros/form/FormContainer.designtime";
    }
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "actions", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "useSingleTextAreaFieldAsNotes", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "formElements", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return {};
    }
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "onChange", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = FormContainerBlock;
  return _exports;
}, false);
//# sourceMappingURL=FormContainer.block-dbg.js.map
