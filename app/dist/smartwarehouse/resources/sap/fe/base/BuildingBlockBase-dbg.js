/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/ui/core/Control", "sap/ui/core/InvisibleRenderer"], function (BindingToolkit, ClassSupport, Control, InvisibleRenderer) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _descriptor3;
  var STATE_MODEL_NAME = ClassSupport.STATE_MODEL_NAME;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var defineState = ClassSupport.defineState;
  var association = ClassSupport.association;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  /**
   * Base class for building blocks.
   * This contains the low-level functionality of having a content aggregation and handling the rendering of the content without an actual DOM element.<br/>
   * The building block also defines a state object that can be used to store the state of the building block.<br/>
   * Accessibility and classes information are forwarded to the content control.<br/>
   * This class is not meant to be used directly, it's there for internal use only (and documentation)
   * @public
   */
  let BuildingBlockBase = (_dec = defineUI5Class("sap.fe.base.BuildingBlockBase"), _dec2 = aggregation({
    type: "sap.ui.core.Element",
    multiple: false,
    isDefault: true
  }), _dec3 = association({
    type: "sap.ui.core.Control",
    multiple: true,
    singularName: "ariaLabelledBy"
  }), _dec4 = defineState(), _dec(_class = (_class2 = /*#__PURE__*/function (_Control) {
    function BuildingBlockBase(settings, others, scope) {
      var _this;
      if (typeof settings === "string") {
        others ??= {};
        others.id = settings;
      }
      // Scope is defined and is there, but somehow doesn't appear on all the children of ManagedObject
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      _this = _Control.call(this, settings, others, scope) || this;
      /**
       * Optional content of generic type T.
       *
       * This property holds the main data or payload for the containing object.
       * When undefined, it indicates that no content has been set or is available.
       * The specific type and structure of the content depends on the generic type parameter T.
       * @public
       */
      _initializerDefineProperty(_this, "content", _descriptor, _this);
      /**
       * Association to controls / IDs that label this control (see WAI-ARIA attribute aria-labelledby).
       * @public
       */
      _initializerDefineProperty(_this, "ariaLabelledBy", _descriptor2, _this);
      /**
       * The current state value of the component.
       *
       * This property holds the state data managed by the component, with the type
       * determined by the generic parameter K.
       * @public
       */
      _initializerDefineProperty(_this, "state", _descriptor3, _this);
      _this._oldDomRef = null;
      return _this;
    }
    _inheritsLoose(BuildingBlockBase, _Control);
    var _proto = BuildingBlockBase.prototype;
    _proto.getPlaceholder = function getPlaceholder(_rm) {};
    BuildingBlockBase.render = function render(oRm, oControl) {
      if (!oControl.content || oControl.getVisible() === false) {
        // If there is no content, we render an invisible renderer to avoid the control being
        InvisibleRenderer.render(oRm, oControl);
      } else {
        oControl.getPlaceholder?.(oRm);
        oRm.renderControl(oControl.content);
      }
    };
    _proto.setBindingContext = function setBindingContext(context, model) {
      _Control.prototype.setBindingContext.call(this, context, model);
      if (model === undefined && context) {
        this.invalidate();
      }
      return this;
    }

    /**
     * Override the bindProperty to deal with the case where the property is a binding info.
     * @param name The name of te property
     * @param bindingInfo The binding info
     * @returns The instance of the building block for chaining
     */;
    _proto.bindProperty = function bindProperty(name, bindingInfo) {
      const propertyMetadata = this.getMetadata().getProperty(name);
      if (propertyMetadata?.bindable === false && propertyMetadata.group === "Data") {
        this[name] = bindingInfo;
      } else {
        _Control.prototype.bindProperty.call(this, name, bindingInfo);
      }
      return this;
    }

    //set the old dom ref
    ;
    _proto.onAfterRendering = function onAfterRendering(event) {
      const domRef = this.getDomRef();
      if (domRef) {
        this._oldDomRef = new WeakRef(domRef);
      } else {
        this._oldDomRef = null;
      }
      _Control.prototype.onAfterRendering.call(this, event);
    };
    _proto.getDomRef = function getDomRef(suffix) {
      const oContent = this.content;
      let domRef = oContent?.getDomRef(suffix) ?? _Control.prototype.getDomRef.call(this, suffix);
      if (!domRef && !suffix) {
        domRef = this._oldDomRef?.deref() ?? null;
        if (domRef) {
          return document.getElementById(domRef.id);
        }
      }
      return domRef;
    };
    _proto.getFocusDomRef = function getFocusDomRef() {
      const oContent = this.content;
      return oContent ? oContent.getFocusDomRef() : _Control.prototype.getFocusDomRef.call(this);
    }

    /**
     * This function asks up the control tree to enhance the accessibility state of the control.
     * @param _oElement The element to enhance
     * @param mAriaProps The current aria properties
     * @returns The enhanced aria properties
     */;
    _proto.enhanceAccessibilityState = function enhanceAccessibilityState(_oElement, mAriaProps) {
      const oParent = this.getParent();
      if (oParent && oParent.enhanceAccessibilityState) {
        // forward  enhanceAccessibilityState call to the parent
        oParent.enhanceAccessibilityState(_oElement, mAriaProps);
      }
      return mAriaProps;
    }

    /**
     * This function (if available on the concrete control) provides the current accessibility state of the control.
     * @returns The accessibility information for the control.
     */;
    _proto.getAccessibilityInfo = function getAccessibilityInfo() {
      let accessibilityInfo = {};
      if (this.content?.isA("sap.ui.core.Control") && this.content.getAccessibilityInfo) {
        accessibilityInfo = this.content.getAccessibilityInfo();
      }
      return accessibilityInfo;
    }

    /**
     * Returns the DOMNode ID to be used for the "labelFor" attribute.
     *
     * We forward the call of this method to the content control.
     * @returns ID to be used for the <code>labelFor</code>
     */;
    _proto.getIdForLabel = function getIdForLabel() {
      if (this.content?.isA("sap.ui.core.Control")) {
        return this.content.getIdForLabel();
      }
      return "";
    };
    _proto.addStyleClass = function addStyleClass(styleClass) {
      this.content?.addStyleClass(styleClass);
      _Control.prototype.addStyleClass.call(this, styleClass);
      return this;
    };
    _proto.removeStyleClass = function removeStyleClass(styleClass) {
      this.content?.removeStyleClass(styleClass);
      _Control.prototype.removeStyleClass.call(this, styleClass);
      return this;
    }

    /**
     * Shorthand for the BindingToolkit.bindState function with the current state object.
     * @param path A property in the state object
     * @returns The binding toolkit expression for the state
     * @public
     * @ui5-experimental-since 1.145.0
     */;
    _proto.bindState = function bindState(path) {
      return BindingToolkit.bindState(this.state, path);
    }

    /**
     * Synchronizes a state property with another building block's state property.
     * @param propName Name of the property in the current state object
     * @param source The source building block
     * @param property The property in the source building block's state object
     */;
    _proto.syncStateProperty = function syncStateProperty(propName, source, property) {
      this.state[propName] = source.state[property];
      const propBinding = source.getModel(STATE_MODEL_NAME)?.bindProperty("/" + property);
      propBinding?.attachChange(() => {
        this.state[propName] = source.state[property];
      });
    }

    /**
     * Framework hook for state change handling.
     * Subclasses can override this method to react to state changes.
     * @param _changedProps List of changed property names
     * @public
     * @ui5-experimental-since 1.145.0
     */;
    _proto.onStateChange = async function onStateChange(_changedProps) {};
    return BuildingBlockBase;
  }(Control), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "content", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "ariaLabelledBy", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "state", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return BuildingBlockBase;
}, false);
//# sourceMappingURL=BuildingBlockBase-dbg.js.map
