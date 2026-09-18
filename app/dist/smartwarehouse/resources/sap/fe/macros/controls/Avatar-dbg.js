/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/base/BuildingBlockBase", "sap/fe/base/ClassSupport", "sap/m/Avatar", "sap/m/AvatarColor", "sap/m/AvatarImageFitType", "sap/m/AvatarShape", "sap/m/LightBox", "sap/m/LightBoxItem", "sap/fe/base/jsx-runtime/jsx"], function (BindingToolkit, BuildingBlockBase, ClassSupport, UI5Avatar, AvatarColor, AvatarImageFitType, AvatarShape, LightBox, LightBoxItem, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var wrapPrimitive = BindingToolkit.wrapPrimitive;
  var pathInModel = BindingToolkit.pathInModel;
  var ifElse = BindingToolkit.ifElse;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Simple building block for rendering an avatar.
   *
   * - Converter (Avatar.ts) = Business logic ("WHAT to show")
   *   - Interprets HeaderInfo annotations
   *   - Determines shape based on IsNaturalPerson
   *   - Resolves image sources and fallback icons
   *   - Computes lightBoxTitle and lightBoxSubtitle from HeaderInfo
   * - Avatar BB (this) = Presentation logic ("HOW to show it")
   *   - Applies backgroundColor rules for visual consistency
   *   - Applies imageFitType rules based on shape
   *   - Renders the actual UI control (including LightBox when enabled)
   * @private
   */
  let Avatar = (_dec = defineUI5Class("sap.fe.macros.controls.Avatar"), _dec2 = property({
    type: "any",
    isBindingInfo: true
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "string"
  }), _dec6 = property({
    type: "string"
  }), _dec7 = property({
    type: "string",
    isBindingInfo: true
  }), _dec8 = property({
    type: "string",
    isBindingInfo: true
  }), _dec9 = property({
    type: "boolean"
  }), _dec10 = property({
    type: "boolean"
  }), _dec11 = property({
    type: "string",
    isBindingInfo: true
  }), _dec12 = property({
    type: "string",
    isBindingInfo: true
  }), _dec13 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    function Avatar(settings, others) {
      var _this;
      _this = _BuildingBlockBase.call(this, settings, others) || this;
      _initializerDefineProperty(_this, "src", _descriptor, _this);
      _initializerDefineProperty(_this, "initials", _descriptor2, _this);
      _initializerDefineProperty(_this, "fallbackIcon", _descriptor3, _this);
      _initializerDefineProperty(_this, "displayShape", _descriptor4, _this);
      _initializerDefineProperty(_this, "displaySize", _descriptor5, _this);
      _initializerDefineProperty(_this, "imageFitType", _descriptor6, _this);
      _initializerDefineProperty(_this, "tooltip", _descriptor7, _this);
      _initializerDefineProperty(_this, "visible", _descriptor8, _this);
      _initializerDefineProperty(_this, "showLightBox", _descriptor9, _this);
      _initializerDefineProperty(_this, "lightBoxTitle", _descriptor10, _this);
      _initializerDefineProperty(_this, "lightBoxSubtitle", _descriptor11, _this);
      _initializerDefineProperty(_this, "class", _descriptor12, _this);
      _this.content = _this.createContent();
      return _this;
    }
    _exports = Avatar;
    _inheritsLoose(Avatar, _BuildingBlockBase);
    var _proto = Avatar.prototype;
    _proto.createContent = function createContent() {
      if (!this.src) {
        return;
      }

      // Apply presentation rules
      const backgroundColor = this.getBackgroundColor();
      const imageFitType = this.getImageFitType();
      const avatar = _jsx(UI5Avatar, {
        src: this.src,
        initials: this.initials,
        fallbackIcon: this.fallbackIcon,
        displayShape: this.displayShape,
        displaySize: this.displaySize,
        imageFitType: imageFitType || undefined,
        backgroundColor: backgroundColor,
        tooltip: this.tooltip,
        visible: this.visible,
        children: this.showLightBox === true ? {
          detailBox: _jsx(LightBox, {
            children: _jsx(LightBoxItem, {
              imageSrc: this.src,
              title: this.lightBoxTitle,
              subtitle: this.lightBoxSubtitle
            })
          })
        } : undefined
      });
      avatar.addStyleClass(this.class || "sapUiSmallMarginEnd");
      return avatar;
    }

    /**
     * Gets the background color for the avatar based on the imageFitType.
     * Rule: If imageFitType is Contain, use Transparent background; otherwise use Accent6.
     * @returns The compiled expression for backgroundColor
     */;
    _proto.getBackgroundColor = function getBackgroundColor() {
      return compileExpression(ifElse(equal(this.getPropertyExpression(this.imageFitType), constant(AvatarImageFitType.Contain)), constant(AvatarColor.Transparent), constant(AvatarColor.Accent6)));
    }

    /**
     * Gets the image fit type for the avatar based on the displayShape.
     * Rule: If displayShape is Circle, force Cover mode; otherwise use provided imageFitType.
     * @returns The compiled expression for imageFitType
     */;
    _proto.getImageFitType = function getImageFitType() {
      return compileExpression(ifElse(equal(this.getPropertyExpression(this.displayShape), constant(AvatarShape.Circle)), constant(AvatarImageFitType.Cover), this.getPropertyExpression(this.imageFitType)));
    }

    /**
     * Helper function to convert property to binding expression.
     * @param propertyValue The property value to convert
     * @returns A BindingToolkitExpression
     */;
    _proto.getPropertyExpression = function getPropertyExpression(propertyValue) {
      if (propertyValue !== undefined && typeof propertyValue === "object" && "path" in propertyValue) {
        return pathInModel(propertyValue.path);
      }
      return wrapPrimitive(propertyValue ?? "");
    }

    /**
     * Refreshes the avatar cache busting to reload the image.
     * Delegates to the underlying sap.m.Avatar control.
     */;
    _proto.refreshAvatarCacheBusting = function refreshAvatarCacheBusting() {
      const avatarControl = this.content;
      if (avatarControl?.isA("sap.m.Avatar")) {
        avatarControl.refreshAvatarCacheBusting();
      }
    }

    /**
     * Gets the content (the underlying sap.m.Avatar control).
     * @returns The sap.m.Avatar control
     */;
    _proto.getContent = function getContent() {
      return this.content;
    }

    /**
     * Gets the ID for the label association.
     * Delegates to the underlying sap.m.Avatar control.
     * @returns The ID for the label
     */;
    _proto.getIdForLabel = function getIdForLabel() {
      const oAvatar = this.content;
      return oAvatar.getIdForLabel();
    };
    return Avatar;
  }(BuildingBlockBase), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "src", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "initials", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "fallbackIcon", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "displayShape", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "displaySize", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "imageFitType", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "tooltip", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "showLightBox", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "lightBoxTitle", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "lightBoxSubtitle", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "class", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _class2)) || _class);
  _exports = Avatar;
  return _exports;
}, false);
//# sourceMappingURL=Avatar-dbg.js.map
