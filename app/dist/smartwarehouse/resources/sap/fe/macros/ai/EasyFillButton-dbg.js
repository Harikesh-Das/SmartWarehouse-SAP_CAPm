/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/controls/CommandExecution", "sap/fe/macros/ai/EasyFillDialog", "sap/m/Button", "sap/m/OverflowToolbarLayoutData", "sap/m/library", "sap/ui/performance/trace/FESRHelper", "sap/fe/base/jsx-runtime/jsx"], function (ClassSupport, BuildingBlock, CommandExecution, EasyFillDialog, Button, OverflowToolbarLayoutData, library, FESRHelper, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var _exports = {};
  var OverflowToolbarPriority = library.OverflowToolbarPriority;
  var ButtonType = library.ButtonType;
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let EasyFillButton = (_dec = defineUI5Class("sap.fe.macros.ai.EasyFillButton"), _dec2 = property({
    type: "string"
  }), _dec3 = implementInterface("sap.m.IOverflowToolbarContent"), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function EasyFillButton() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BuildingBlock.call(this, ...args) || this;
      _initializerDefineProperty(_this, "text", _descriptor, _this);
      _initializerDefineProperty(_this, "__implements__sap_m_IOverflowToolbarContent", _descriptor2, _this);
      return _this;
    }
    _exports = EasyFillButton;
    _inheritsLoose(EasyFillButton, _BuildingBlock);
    var _proto = EasyFillButton.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable(_ownerComponent) {
      _BuildingBlock.prototype.onMetadataAvailable.call(this, _ownerComponent);
      this.content = this.createContent();
    };
    _proto._easyEditDocument = async function _easyEditDocument() {
      if (this.getAppComponent()?.getEnvironmentCapabilities().getCapabilities().EasyEdit) {
        const controller = this.getPageController();
        const view = controller.getView();
        if (!this.getPageController()?.getModel("ui").getProperty("/isEditable")) {
          await controller.editFlow.editDocument.apply(controller.editFlow, [view?.getBindingContext()]);
        }
        // Open easy create dialog
        const easyEditDialog = this.getPageController().getOwnerComponent()?.runAsOwner(() => {
          return new EasyFillDialog({
            getEditableFields: this._getEditableFields.bind(this)
          });
        });
        easyEditDialog.open();
        view?.addDependent(easyEditDialog);
      }
    };
    _proto._getEditableFields = async function _getEditableFields() {
      // Connect all sections
      const allFields = this.getPageController().getView()?.findAggregatedObjects(true, control => {
        return control.isA("sap.fe.macros.Field");
      });
      const editableFields = {};
      allFields.forEach(field => {
        const propertyRelativePath = field.getMainPropertyRelativePath();
        if (propertyRelativePath) {
          if (editableFields[propertyRelativePath] === undefined) {
            editableFields[propertyRelativePath] = {
              isEditable: field.getEditable()
            };
          } else {
            // If the field is already in the editableFields object, we combine the editable state, if at least one field is editable then we consider it editable
            editableFields[propertyRelativePath].isEditable = editableFields[propertyRelativePath].isEditable || field.getEditable();
          }
        }
      });
      return Promise.resolve(editableFields);
    };
    _proto.createContent = function createContent() {
      if (this.getAppComponent()?.getEnvironmentCapabilities().getCapabilities().EasyEdit) {
        this.getPageController().getView()?.addDependent(_jsx(CommandExecution, {
          execute: this._easyEditDocument.bind(this),
          command: "EasyEdit"
        }));
        const button = _jsx(Button, {
          id: this.createId("button"),
          "dt:designtime": "not-adaptable",
          text: this.getTranslatedText("C_EASYEDIT_BUTTON"),
          icon: "sap-icon://ai",
          type: ButtonType.Ghost,
          "jsx:command": "cmd:EasyEdit|press",
          ariaDescribedBy: ["fe::AiAction::AriaText"]
        });
        this.setLayoutData(_jsx(OverflowToolbarLayoutData, {
          priority: OverflowToolbarPriority.High
        }));
        FESRHelper.setSemanticStepname(button, "press", "fe4:ef:easyfill");
        return button;
      }
      this.setVisible(false);
    };
    _proto.getOverflowToolbarConfig = function getOverflowToolbarConfig() {
      return {
        canOverflow: true
      };
    };
    return EasyFillButton;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "text", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_m_IOverflowToolbarContent", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _class2)) || _class);
  _exports = EasyFillButton;
  return _exports;
}, false);
//# sourceMappingURL=EasyFillButton-dbg.js.map
