/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/controls/ListReport/FilterField", "sap/fe/core/formatters/StandardFormatter", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyFormatters", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/field/FieldHelper", "sap/ui/core/CustomData", "sap/ui/core/fieldhelp/FieldHelpCustomData", "sap/ui/mdc/FilterField", "../CommonHelper", "../filter/FilterFieldHelper", "../filter/FilterFieldTemplating", "../visualfilters/InParameter", "../visualfilters/VisualFilter", "./ExtendedSemanticDateOperators", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (Log, BindingToolkit, BuildingBlockTemplateProcessor, MetaModelConverter, FilterField, standardFormatter, StableIdHelper, DataModelPathHelper, PropertyFormatters, PropertyHelper, UIFormatters, FieldHelper, CustomData, FieldHelpCustomData, MDCFilterField, CommonHelper, FilterFieldHelper, FilterFieldTemplating, InParameter, VisualFilter, ExtendedSemanticDateOperators, _jsx, _jsxs) {
  "use strict";

  var _exports = {};
  var getFilterFieldDisplayFormat = FilterFieldTemplating.getFilterFieldDisplayFormat;
  var isRequiredInFilter = FilterFieldHelper.isRequiredInFilter;
  var getPlaceholder = FilterFieldHelper.getPlaceholder;
  var getDataType = FilterFieldHelper.getDataType;
  var getConditionsBinding = FilterFieldHelper.getConditionsBinding;
  var formatOptions = FilterFieldHelper.formatOptions;
  var constraints = FilterFieldHelper.constraints;
  var getDisplayMode = UIFormatters.getDisplayMode;
  var getAssociatedExternalIdPropertyPath = PropertyHelper.getAssociatedExternalIdPropertyPath;
  var getRelativePropertyPath = PropertyFormatters.getRelativePropertyPath;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var generate = StableIdHelper.generate;
  var getMaxConditions = FilterField.getMaxConditions;
  var SAP_UI_MODEL_CONTEXT = BuildingBlockTemplateProcessor.SAP_UI_MODEL_CONTEXT;
  var formatResult = BindingToolkit.formatResult;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  let FilterFieldCreator = /*#__PURE__*/function () {
    function FilterFieldCreator(props) {
      /**
       * Defines the metadata path to the property.
       */
      /**
       * A prefix that is added to the generated ID of the filter field.
       */
      /**
       * A prefix that is added to the generated ID of the value help used for the filter field.
       */
      /**
       * Specifies the Sematic Date Range option for the filter field.
       */
      this.useSemanticDateRange = true;
      /**
       * Settings from the manifest.
       */
      this.settings = {};
      /**
       * Property to hold promise for display value asynchronously fetched based on value help annotations
       */
      this.displayPromise = Promise.resolve(undefined);
      this.mdcFilterField = undefined;
      this.idPrefix = props.idPrefix ?? "FilterField";
      this.vhIdPrefix = props.vhIdPrefix ?? "FilterFieldValueHelp";
      this.propertyPath = props.propertyPath;
      this.contextPath = props.contextPath;
      this.useSemanticDateRange = props.useSemanticDateRange ?? true;
      this.editMode = props.editMode;
      this.required = props.required;
      this.settings = props.settings ?? {};
      this.visualFilter = props.visualFilter;
      this.label = props.label ?? "";
      this.metaModel = props.metaModel;
      this.prepareFilterField(this.metaModel);
    }
    _exports = FilterFieldCreator;
    var _proto = FilterFieldCreator.prototype;
    _proto.prepareFilterField = function prepareFilterField(metaModel) {
      this.vfEnabled = !!this.visualFilter && !(this.idPrefix && this.idPrefix.includes("Adaptation"));
      const propertyDataModelObject = MetaModelConverter.getInvolvedDataModelObjects(metaModel?.getContext(this.propertyPath), metaModel?.getContext(this.contextPath));
      const propertyConverted = propertyDataModelObject?.targetObject;
      const externalIdPropertyPath = getAssociatedExternalIdPropertyPath(propertyConverted);
      if (externalIdPropertyPath) {
        this.propertyExternalId = this.propertyPath.replace(propertyConverted.name, externalIdPropertyPath);
      }
      const propertyConvertedExternalId = this.propertyExternalId ? MetaModelConverter.getInvolvedDataModelObjects(metaModel?.getContext(this.propertyExternalId), metaModel?.getContext(this.contextPath))?.targetObject : undefined;
      // Property settings
      const propertyName = propertyConverted.name,
        originalPropertyName = propertyConverted.name,
        fixedValues = !!propertyConvertedExternalId?.annotations?.Common?.ValueListWithFixedValues || !!propertyConverted.annotations?.Common?.ValueListWithFixedValues;
      this.controlId = this.idPrefix && generate([this.idPrefix, originalPropertyName]);
      this.sourcePath = getTargetObjectPath(propertyDataModelObject);
      this.documentRefText = propertyDataModelObject?.targetObject?.annotations.Common?.DocumentationRef?.toString();
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
        model = propertyContext?.getModel(),
        vhPropertyPath = FieldHelper.valueHelpPropertyForFilterField(propertyContext),
        filterable = CommonHelper.isPropertyFilterable(propertyContext),
        propertyObject = propertyContext?.getObject(),
        propertyInterface = {
          context: propertyContext
        };
      this.displayPromise = this.calculateAndSetDisplay(metaModel, propertyDataModelObject, propertyConverted, propertyInterface);
      this.isFilterable = !(filterable === false || filterable === "false");
      this.maxConditions = getMaxConditions(propertyDataModelObject);
      this.dataTypeConstraints = constraints(propertyObject, propertyInterface, true);
      this.dataTypeFormatOptions = formatOptions(propertyObject, propertyInterface, true);
      this.required = this?.required ?? isRequiredInFilter(propertyObject, propertyInterface);
      this.operators = FieldHelper.operators(propertyContext, propertyObject, this.useSemanticDateRange, Object.keys(this.settings).length ? JSON.stringify(this.settings) : "", this.contextPath);
      if (this.operators) {
        // Extended operators are not added by default.
        // We add them to MDC filter environment.
        ExtendedSemanticDateOperators.addExtendedFilterOperators(this.operators.split(","));
      }
      // Value Help settings
      // TODO: This needs to be updated when VH macro is converted to 2.0
      const vhProperty = model.createBindingContext(vhPropertyPath);
      const vhPropertyObject = vhProperty.getObject(),
        vhPropertyInterface = {
          context: vhProperty
        },
        relativeVhPropertyPath = getRelativePropertyPath(vhPropertyObject, vhPropertyInterface),
        relativePropertyPath = getRelativePropertyPath(propertyObject, propertyInterface);
      this.valueHelpProperty = FieldHelper.getValueHelpPropertyForFilterField(propertyContext, propertyObject, propertyObject.$Type, this.vhIdPrefix, propertyDataModelObject?.targetEntityType?.name, relativePropertyPath, relativeVhPropertyPath, fixedValues, this.useSemanticDateRange);
    };
    _proto.getCustomData = function getCustomData() {
      const companionTextAvailable = this.documentRefText === undefined || null ? false : true;
      const formattedResult = compileExpression(formatResult([this.documentRefText], standardFormatter.asArray));
      const customData = [];
      customData.push(_jsx(CustomData, {
        value: this.sourcePath
      }, "sourcePath"));
      if (this.visualFilter?.valueListQualifier) {
        customData.push(_jsx(CustomData, {
          value: this.visualFilter.valueListQualifier || ""
        }, "valueListQualifier"));
      }
      if (companionTextAvailable) {
        customData.push(_jsx(FieldHelpCustomData, {
          value: formattedResult || null
        }));
      }
      return customData;
    };
    _proto.getVisualFilterContent = function getVisualFilterContent() {
      let visualFilterObject = this.visualFilter;
      if (!this.vfEnabled || !visualFilterObject) {
        return "";
      }
      if (visualFilterObject?.isA?.(SAP_UI_MODEL_CONTEXT)) {
        visualFilterObject = visualFilterObject.getObject();
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
      } = visualFilterObject;
      return _jsx(VisualFilter, {
        id: this.vfRuntimeId,
        _contentId: this.vfId,
        contextPath: contextPath,
        metaPath: presentationAnnotation,
        outParameter: outParameter,
        valuelistProperty: valuelistProperty,
        selectionVariantAnnotation: selectionVariantAnnotation,
        multipleSelectionAllowed: multipleSelectionAllowed,
        required: required,
        requiredProperties: requiredProperties,
        showOverlayInitially: showOverlayInitially,
        renderLineChart: renderLineChart,
        isValueListWithFixedValues: isValueListWithFixedValues,
        filterBarEntityType: contextPath,
        children: {
          inParameters: inParameters?.map(param => _jsx(InParameter, {
            localDataProperty: param.localDataProperty,
            valueListProperty: param.valueListProperty
          }))
        }
      });
    };
    _proto._getFilterField = function _getFilterField() {
      return _jsxs(MDCFilterField, {
        id: this.controlId,
        delegate: {
          name: "sap/fe/macros/field/FieldBaseDelegate",
          payload: {
            isFilterField: true
          }
        },
        propertyKey: this.propertyKey,
        label: this.label,
        dataType: this.dataType,
        maxConditions: this.maxConditions,
        valueHelp: this.valueHelpProperty,
        conditions: this.conditionsBinding,
        dataTypeConstraints: this.dataTypeConstraints,
        dataTypeFormatOptions: this.dataTypeFormatOptions,
        required: this.required,
        operators: this.operators,
        placeholder: this.placeholder,
        editMode: this.editMode,
        display: this.display,
        tooltip: this.tooltip,
        children: [{
          customData: this.getCustomData()
        }, {
          content: this.vfEnabled ? this.getVisualFilterContent() : {}
        }]
      });
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
     */;
    _proto.calculateAndSetDisplay = async function calculateAndSetDisplay(metaModel, propertyDataModelObject, propertyConverted, propertyInterface) {
      try {
        const dataModelPathExternalId = this.propertyExternalId && MetaModelConverter.getInvolvedDataModelObjects(metaModel.getContext(this.propertyExternalId), metaModel.getContext(this.contextPath))?.targetObject;
        this.display = dataModelPathExternalId ? getDisplayMode(dataModelPathExternalId) : await getFilterFieldDisplayFormat(propertyDataModelObject, propertyConverted, propertyInterface);
        if (this.mdcFilterField) {
          this.mdcFilterField.setDisplay(this.display);
        }
        return this.display;
      } catch (err) {
        Log.error(`FE : FilterField BuildingBlock : Error fetching display property for ${this.sourcePath} : ${err}`);
      }
    };
    _proto.getMDCFilterField = function getMDCFilterField() {
      try {
        // Return cached value
        if (this.mdcFilterField || this.isFilterable === false) {
          return this.mdcFilterField;
        }

        // Return MDCFilterField directly and handle display property separately
        this.mdcFilterField = this._getFilterField();
        return this.mdcFilterField;
      } catch (err) {
        Log.error(`FE : FilterField BuildingBlock : Error preparing filter field for ${this.sourcePath} : ${err}`);
      }
    };
    return FilterFieldCreator;
  }();
  _exports = FilterFieldCreator;
  return _exports;
}, false);
//# sourceMappingURL=FilterFieldTemplate-dbg.js.map
