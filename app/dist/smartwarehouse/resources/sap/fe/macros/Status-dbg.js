/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/CriticalityFormatters", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/field/FieldTemplating", "sap/m/ObjectStatus", "sap/fe/base/jsx-runtime/jsx"], function (ClassSupport, BuildingBlock, StableIdHelper, TypeGuards, CriticalityFormatters, DataModelPathHelper, UIFormatters, FieldTemplating, MObjectStatus, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9;
  var _exports = {};
  var getVisibleExpression = FieldTemplating.getVisibleExpression;
  var getTextBinding = FieldTemplating.getTextBinding;
  var getTooltipValue = UIFormatters.getTooltipValue;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var buildExpressionForCriticalityIcon = CriticalityFormatters.buildExpressionForCriticalityIcon;
  var buildExpressionForCriticalityColor = CriticalityFormatters.buildExpressionForCriticalityColor;
  var isProperty = TypeGuards.isProperty;
  var generate = StableIdHelper.generate;
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block to display a status and criticality.
   * @public
   * @since 1.143.0
   */
  let Status = (_dec = defineUI5Class("sap.fe.macros.Status"), _dec2 = implementInterface("sap.ui.core.IFormContent"), _dec3 = property({
    type: "string",
    required: true
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "string",
    allowedValues: ["Inline", "Overlay"],
    defaultValue: "Inline"
  }), _dec6 = property({
    type: "boolean"
  }), _dec7 = property({
    type: "boolean"
  }), _dec8 = property({
    type: "boolean"
  }), _dec9 = property({
    type: "string",
    allowedValues: ["Standard", "Pastel"],
    defaultValue: "Standard"
  }), _dec10 = event(), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    /**
     * Internal property to store the data model path
     */

    /**
     * Constructor for the Status building block.
     * @param properties The properties object containing Status-specific settings and base control settings
     * @param [others] Additional control settings that may be applied to the building block
     */
    function Status(properties, others) {
      var _this;
      _this = _BuildingBlock.call(this, properties, others) || this;
      _initializerDefineProperty(_this, "__implements__sap_ui_core_IFormContent", _descriptor, _this);
      /**
       * Metadata path to the DataField annotation or property.
       * @public
       */
      _initializerDefineProperty(_this, "metaPath", _descriptor2, _this);
      /**
       * Context path for the binding context.
       * @public
       */
      _initializerDefineProperty(_this, "contextPath", _descriptor3, _this);
      /**
       *  When the Status is clickable, it defines the size of the reactive area of the clickable element:
       *
       * - ReactiveAreaMode.Inline - The Status is displayed as part of a sentence.
       * - ReactiveAreaMode.Overlay - The Status is displayed as an overlay on top of other interactive parts of the page.
       * Note: It is designed to make the clickable element easier to activate and helps meet the WCAG 2.2 Target Size requirement. It is applicable only for the SAP Horizon themes. Note: The size of the reactive area is sufficiently large to help users avoid accidentally selecting (clicking or tapping) unintended UI elements. UI elements positioned over other parts of the page may need an invisible active touch area. This ensures that no elements beneath are activated accidentally when the user tries to interact with the overlay element.
       * @public
       */
      _initializerDefineProperty(_this, "reactiveAreaMode", _descriptor4, _this);
      /**
       * Indicates whether the ObjectStatus should be displayed in large design mode.
       * @public
       */
      _initializerDefineProperty(_this, "largeDesign", _descriptor5, _this);
      /**
       * Determines whether the background color reflects the set state of the ObjectStatus instead of the control's text.
       * @public
       */
      _initializerDefineProperty(_this, "inverted", _descriptor6, _this);
      _initializerDefineProperty(_this, "hideIcon", _descriptor7, _this);
      /**
       * Color palette to be used by the control. The supported values are "Standard" (default) and "Pastel".
       * @public
       */
      _initializerDefineProperty(_this, "colorPalette", _descriptor8, _this);
      /**
       * Press event fired when the ObjectStatus is clicked.
       * @param event The press event
       * @public
       */
      _initializerDefineProperty(_this, "press", _descriptor9, _this);
      return _this;
    }

    /**
     * Handler for the onMetadataAvailable event.
     */
    _exports = Status;
    _inheritsLoose(Status, _BuildingBlock);
    var _proto = Status.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
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
     */;
    _proto.getTemplatingObjects = function getTemplatingObjects() {
      // Try to get as DataField first, then as DataPoint, then as Property
      const internalDataModelPath = this.getDataModelObjectForMetaPath(this.metaPath, this.contextPath);
      const targetObject = internalDataModelPath?.targetObject;
      if (!internalDataModelPath) {
        return;
      }
      if (isProperty(targetObject)) {
        if (targetObject?.annotations?.UI?.DataFieldDefault !== undefined) {
          this.dataModelPath = this.getDataModelObjectForMetaPath(`${this.metaPath}@${"com.sap.vocabularies.UI.v1.DataFieldDefault"}`, this.contextPath);
        }
        this.valueDataModelPath = internalDataModelPath;
      } else {
        this.dataModelPath = internalDataModelPath;
        if (this.dataModelPath?.targetObject?.Value?.path) {
          this.valueDataModelPath = enhanceDataModelPath(internalDataModelPath, this.dataModelPath.targetObject.Value.path);
        }
      }
    }

    /**
     * Gets the criticality expression for the ObjectStatus.
     * @returns The compiled binding expression for criticality color, or undefined if no criticality is available
     */;
    _proto.getCriticalityExpression = function getCriticalityExpression(colorPalette) {
      const pastelColorMap = {
        Negative: "Indication12",
        Critical: "Indication13",
        Positive: "Indication14",
        Information: "Indication15",
        Neutral: "Indication20"
      };
      const specificColorMap = colorPalette === "Pastel" ? pastelColorMap : undefined;
      return this.dataModelPath === undefined ? undefined : buildExpressionForCriticalityColor(this.dataModelPath, this.dataModelPath, specificColorMap);
    }

    /**
     * Gets the criticality icon expression for the ObjectStatus.
     * @returns The compiled binding expression for criticality icon, or undefined if no criticality is available
     */;
    _proto.getCriticalityIconExpression = function getCriticalityIconExpression() {
      return this.dataModelPath === undefined ? undefined : buildExpressionForCriticalityIcon(this.dataModelPath, this.dataModelPath);
    }

    /**
     * Gets the text binding expression for the ObjectStatus.
     * @returns The compiled binding expression for the ObjectStatus text content
     */;
    _proto.getObjectStatusTextBinding = function getObjectStatusTextBinding() {
      const propertyOrDataFieldDataModelObjectPath = this.valueDataModelPath ?? this.dataModelPath;
      return getTextBinding(propertyOrDataFieldDataModelObjectPath, {});
    }

    /**
     * Creates the ObjectStatus control content.
     * @returns The configured ObjectStatus control ready for rendering
     */;
    _proto.createContent = function createContent() {
      const statusConfig = this.getAppComponent()?.getAdditionalConfiguration()?.["sap.fe.macros"]?.Status;
      const dataFieldOrPropertyDataModelObjectPath = this.dataModelPath ?? this.valueDataModelPath;
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
      return _jsx(MObjectStatus, {
        id: generate([this.getId(), "ObjectStatus"]),
        inverted: this.inverted,
        class: this.largeDesign ? "sapMObjectStatusLarge sapMObjectStatusLongText" : undefined,
        state: criticalityExpression,
        tooltip: toolTipValue,
        icon: this.hideIcon ? undefined : criticalityIconExpression,
        text: textBinding,
        visible: visible,
        active: isActive,
        reactiveAreaMode: this.reactiveAreaMode,
        press: pressEvent => {
          this.fireEvent("press", pressEvent);
        }
      });
    };
    return Status;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_ui_core_IFormContent", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "reactiveAreaMode", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "largeDesign", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "inverted", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "hideIcon", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "colorPalette", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "press", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = Status;
  return _exports;
}, false);
//# sourceMappingURL=Status-dbg.js.map
