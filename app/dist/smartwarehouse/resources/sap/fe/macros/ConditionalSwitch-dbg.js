/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BuildingBlockBase", "sap/fe/base/ClassSupport"], function (BuildingBlockBase, ClassSupport) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;
  var _exports = {};
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Defines a conditional template that renders content based on the evaluation of a set of switchProperties.
   * The switchProperties are defined using the {@link sap.fe.macros.ConditionalSwitchProperty} building block.
   * @public
   * @since 1.141.0
   */
  let ConditionalSwitch = (_dec = defineUI5Class("sap.fe.macros.ConditionalSwitch"), _dec2 = implementInterface("sap.ui.core.IFormContent"), _dec3 = aggregation({
    type: "sap.ui.core.IFormContent",
    isDefault: false
  }), _dec4 = aggregation({
    type: "sap.fe.macros.ConditionalSwitchProperty",
    isDefault: true,
    multiple: true,
    singularName: "switchProperty"
  }), _dec5 = property({
    type: "function"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    function ConditionalSwitch(idOrSettings, settings, scope) {
      var _this;
      _this = _BuildingBlockBase.call(this, idOrSettings, settings, scope) || this;
      _initializerDefineProperty(_this, "__implements__sap_ui_core_IFormContent", _descriptor, _this);
      _initializerDefineProperty(_this, "content", _descriptor2, _this);
      _initializerDefineProperty(_this, "switchProperties", _descriptor3, _this);
      /**
       * A function that returns the content to be rendered based on the evaluation of the switchProperties.
       * The function receives an object with the switchProperties as key-value pairs, the binding context, and the displayed control.
       * The function should return a single UI5 control.
       * @public
       */
      _initializerDefineProperty(_this, "factory", _descriptor4, _this);
      /**
       * Time in milliseconds to debounce content creation calls.
       * We use a debounce function to avoid multiple calls in quick succession when multiple switchProperties are changed at once.
       * @private
       */
      _this.DEBOUNCE_TIME = 200;
      return _this;
    }
    _exports = ConditionalSwitch;
    _inheritsLoose(ConditionalSwitch, _BuildingBlockBase);
    var _proto = ConditionalSwitch.prototype;
    /**
     * Debounced content creation to avoid multiple calls in quick succession.
     * This is useful when multiple switchProperties are changed at once.
     */
    _proto._createContentDebounced = function _createContentDebounced() {
      if (this._createDebounceTimer !== undefined) {
        clearTimeout(this._createDebounceTimer);
      }
      this._createDebounceTimer = window.setTimeout(() => {
        this._createContent();
      }, this.DEBOUNCE_TIME);
    }

    /**
     * Creates the content based on the current switchProperties and the factory function.
     * If no factory function is provided, the content will be empty.
     */;
    _proto._createContent = function _createContent() {
      if (this.factory) {
        const switchProperties = this.switchProperties.reduce((reducer, prop) => {
          reducer[prop.key] = prop.value;
          return reducer;
        }, {});
        const oldContent = this.content;
        const newContent = this.factory.call(this, switchProperties, this.getBindingContext(), this.content);
        if (newContent !== oldContent) {
          oldContent?.destroy();
          this.content = newContent;
        }
        if (this.ariaLabelledBy !== undefined) {
          this.content?.addAssociation("ariaLabelledBy", this.ariaLabelledBy.join(","));
        }
      }
    }

    /**
     * Overrides the addAssociation method to propagate ariaLabelledBy associations to the content.
     * @param sAssociationName The name of the association
     * @param sId The ID of the associated control or the control instance
     * @param bSuppressInvalidate Whether to suppress invalidation
     * @returns The current instance for method chaining
     */;
    _proto.addAssociation = function addAssociation(sAssociationName, sId, bSuppressInvalidate) {
      _BuildingBlockBase.prototype.addAssociation.call(this, sAssociationName, sId, bSuppressInvalidate);
      if (sAssociationName === "ariaLabelledBy" && this.content) {
        this.content.addAssociation("ariaLabelledBy", sId);
      }
      return this;
    }

    /**
     * Adds a ConditionalSwitchProperty to the 'switchProperties' aggregation and attaches a change listener to it.
     * The change listener will trigger a content re-creation when the property value changes.
     * @param conditionalSwitchProperty
     * @returns The current instance for method chaining.
     */;
    _proto.addSwitchProperty = function addSwitchProperty(conditionalSwitchProperty) {
      _BuildingBlockBase.prototype.addAggregation.call(this, "switchProperties", conditionalSwitchProperty);
      if (!this.fnBoundDebounced) {
        // Bind the debounced content creation method to the instance
        this.fnBoundDebounced = this._createContentDebounced.bind(this);
      }
      conditionalSwitchProperty.attachEvent("valueChanged", this.fnBoundDebounced);
      this._createContentDebounced();
      return this;
    }

    /**
     * Removes a ConditionalSwitchProperty from the 'switchProperties' aggregation and detaches its change listener.
     * @param vIndex The index, ID, or instance of the ConditionalSwitchProperty to remove.
     * @returns The removed ConditionalSwitchProperty instance or null if not found.
     */;
    _proto.removeSwitchProperty = function removeSwitchProperty(vIndex) {
      const conditionalSwitchProperty = _BuildingBlockBase.prototype.removeAggregation.call(this, "switchProperties", vIndex);
      if (conditionalSwitchProperty !== null && this.fnBoundDebounced) {
        conditionalSwitchProperty.detachEvent("valueChanged", this.fnBoundDebounced);
      }
      this._createContentDebounced();
      return conditionalSwitchProperty;
    }

    // #region IFormContent
    ;
    _proto.getFormDoNotAdjustWidth = function getFormDoNotAdjustWidth() {
      return this.content?.getFormDoNotAdjustWidth?.() ?? false;
    };
    return ConditionalSwitch;
  }(BuildingBlockBase), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_ui_core_IFormContent", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "content", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "switchProperties", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "factory", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = ConditionalSwitch;
  return _exports;
}, false);
//# sourceMappingURL=ConditionalSwitch-dbg.js.map
