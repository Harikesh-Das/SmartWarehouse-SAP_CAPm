/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BuildingBlockBase", "sap/fe/base/ClassSupport", "sap/m/Button", "sap/m/Label", "sap/m/Link", "sap/m/library", "sap/ui/core/Lib", "./AiNoticeHelper", "sap/fe/base/jsx-runtime/jsx"], function (BuildingBlockBase, ClassSupport, Button, Label, Link, library, Lib, AiNoticeHelper, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;
  var _exports = {};
  var ButtonType = library.ButtonType;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block that displays a AI notice.
   *
   * It's used to display information related to AI features. This information is rendered either
   * as a link if the aggregation popoverContent is defined or as a label if there is no aggregation popoverContent.
   */
  let AINotice = (_dec = defineUI5Class("sap.fe.controls.AINotice"), _dec2 = property({
    type: "boolean",
    isBindingInfo: true,
    defaultValue: true
  }), _dec3 = property({
    type: "string",
    defaultValue: "Link"
  }), _dec4 = aggregation({
    type: "sap.ui.core.Control",
    multiple: true,
    isDefault: true
  }), _dec5 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    function AINotice(properties, others) {
      var _this;
      _this = _BuildingBlockBase.call(this, properties, others) || this;
      _initializerDefineProperty(_this, "visible", _descriptor, _this);
      /**
       * The type of control to display
       */
      _initializerDefineProperty(_this, "type", _descriptor2, _this);
      /**
       * The content to display into the popover
       * @public
       */
      _initializerDefineProperty(_this, "popoverContent", _descriptor3, _this);
      /**
       * The placement type of the popover
       */
      _initializerDefineProperty(_this, "placementType", _descriptor4, _this);
      _this.resourceBundle = Lib.getResourceBundleFor("sap.fe.controls");
      _this.content = _this.createContent();
      return _this;
    }

    /**
     * Handles the press event on the control.
     * @param event The press event
     */
    _exports = AINotice;
    _inheritsLoose(AINotice, _BuildingBlockBase);
    var _proto = AINotice.prototype;
    _proto.onPress = function onPress(event) {
      if (this.popoverContent) {
        AiNoticeHelper.generatePopover({
          content: this.popoverContent,
          placementType: this.placementType,
          parent: event.getSource()
        });
      }
    }

    /**
     * Returns the link or text depending on the popoverContent aggregation.
     * @returns The control tree
     */;
    _proto.createLinkOrLabel = function createLinkOrLabel() {
      const mainText = this.resourceBundle.getText("M_NOTICE_AI_TITLE");
      return this.getAggregation("popoverContent") ? _jsx(Link, {
        visible: this.visible,
        text: mainText,
        press: e => this.onPress(e)
      }) : _jsx(Label, {
        visible: this.visible,
        text: mainText
      });
    }

    /**
     * Returns the button.
     * @returns The button
     */;
    _proto.createButton = function createButton() {
      return _jsx(Button, {
        visible: this.visible,
        icon: "sap-icon://ai",
        type: ButtonType.Transparent,
        text: this.resourceBundle.getText("M_NOTICE_AI_FILTER"),
        press: e => this.onPress(e)
      });
    }

    /**
     * Returns the content of this building block.
     * @returns The control tree
     */;
    _proto.createContent = function createContent() {
      switch (this.type) {
        case "Button":
          return this.createButton();
        case "Link":
        default:
          return this.createLinkOrLabel();
      }
    };
    return AINotice;
  }(BuildingBlockBase), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "type", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "popoverContent", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "placementType", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = AINotice;
  return _exports;
}, false);
//# sourceMappingURL=AINotice-dbg.js.map
