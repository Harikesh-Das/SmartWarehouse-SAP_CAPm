/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/controls/CommandExecution", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/BindingHelper", "sap/m/Button", "sap/m/List", "sap/m/ResponsivePopover", "sap/m/StandardListItem", "sap/ui/core/InvisibleText", "../ObjectPageTemplating", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (BindingToolkit, ClassSupport, CommonUtils, BuildingBlock, CommandExecution, MetaModelConverter, BindingHelper, Button, List, ResponsivePopover, StandardListItem, InvisibleText, ObjectPageTemplating, _jsx, _jsxs) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6;
  var _exports = {};
  var checkDraftState = ObjectPageTemplating.checkDraftState;
  var UI = BindingHelper.UI;
  var Entity = BindingHelper.Entity;
  var Draft = BindingHelper.Draft;
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var defineReference = ClassSupport.defineReference;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var ifElse = BindingToolkit.ifElse;
  var equal = BindingToolkit.equal;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let DraftToggle = (_dec = defineUI5Class("sap.fe.macros.DraftToggle"), _dec2 = implementInterface("sap.m.IOverflowToolbarContent"), _dec3 = property({
    type: "boolean"
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "string"
  }), _dec6 = defineReference(), _dec7 = defineReference(), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function DraftToggle(props, others) {
      var _this;
      _this = _BuildingBlock.call(this, props, others) || this;
      _initializerDefineProperty(_this, "__implements__sap_m_IOverflowToolbarContent", _descriptor, _this);
      _initializerDefineProperty(_this, "visible", _descriptor2, _this);
      _this.SWITCH_TO_DRAFT_KEY = "switchToDraft";
      _this.SWITCH_TO_ACTIVE_KEY = "switchToActive";
      _initializerDefineProperty(_this, "id", _descriptor3, _this);
      _initializerDefineProperty(_this, "contextPath", _descriptor4, _this);
      _initializerDefineProperty(_this, "switchToActiveRef", _descriptor5, _this);
      _initializerDefineProperty(_this, "switchToDraftRef", _descriptor6, _this);
      _this.initialSelectedKey = _this.SWITCH_TO_ACTIVE_KEY;
      _this._hiddenDraft = false;
      _this.handleSelectedItemChange = selectedItemKey => {
        if (selectedItemKey !== _this.initialSelectedKey) {
          _this._containingView.getController().editFlow.toggleDraftActive(_this._containingView.getBindingContext());
        }
        _this.popover?.close();
      };
      _this.openSwitchActivePopover = event => {
        const sourceControl = event.getSource();
        const containingView = CommonUtils.getTargetView(sourceControl);
        if (_this.popover) {
          _this.popover.destroy();
          delete _this.popover;
        }
        const context = containingView.getBindingContext();
        const isActiveEntity = context.getObject().IsActiveEntity;
        _this.initialSelectedKey = isActiveEntity ? _this.SWITCH_TO_ACTIVE_KEY : _this.SWITCH_TO_DRAFT_KEY;
        const popover = _this.createPopover();
        _this.popover = popover;
        _this._containingView = containingView;
        containingView.addDependent(popover);
        popover.attachEventOnce("afterClose", () => {
          popover.destroy();
          if (_this.popover === popover) {
            delete _this.popover;
          }
        });
        popover.openBy(sourceControl);
        return popover;
      };
      _this.attachModelContextChange(function handleVisibility(event) {
        // Forced to double cast to avoid typing errors.
        const self = event.getSource();
        if (self.content?.getBinding("visible")) {
          self.content?.getBinding("visible")?.attachEvent("change", localEvent => {
            self.visible = localEvent.getSource().getExternalValue();
          });
          self.detachModelContextChange(handleVisibility, self);
        }
      }, _this);
      return _this;
    }

    /**
     * Handler for the onMetadataAvailable event.
     */
    _exports = DraftToggle;
    _inheritsLoose(DraftToggle, _BuildingBlock);
    var _proto = DraftToggle.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      const controller = this._getOwner()?.getRootController();
      this._hiddenDraft = controller.getAppComponent().getEnvironmentCapabilities().getCapabilities().HiddenDraft?.enabled;
      if (!this.content && !this._hiddenDraft) {
        this.content = this.createContent();
      }
    };
    _proto.getEnabled = function getEnabled() {
      return this.content?.getProperty("enabled") ?? true;
    };
    _proto.getOverflowToolbarConfig = function getOverflowToolbarConfig() {
      return {
        canOverflow: true
      };
    };
    /**
     * Function to check if the entitySet is a draft root that supports collaboration.
     * @param entitySet The current entity set.
     * @returns Returns the Boolean value based on draft state
     */
    _proto.checkCollaborationDraftRoot = function checkCollaborationDraftRoot(entitySet) {
      if (entitySet.annotations?.Common?.DraftRoot?.ShareAction) {
        return true;
      } else {
        return false;
      }
    }

    /**
     * Function to get the visibility for the SwitchToActive button in the object page or subobject page.
     * @param entitySet The current entity set.
     * @returns Returns expression binding or Boolean value based on the draft state
     */;
    _proto.getSwitchToActiveVisibility = function getSwitchToActiveVisibility(entitySet) {
      if (checkDraftState(entitySet)) {
        if (this.checkCollaborationDraftRoot(entitySet)) {
          return compileExpression(and(pathInModel("HasActiveEntity"), UI.IsEditable));
        } else {
          return compileExpression(and(Draft.IsCreatedByMe, UI.IsEditable, not(UI.IsCreateMode)));
        }
      } else {
        return false;
      }
    }

    /**
     * Function to get the visibility for the SwitchToDraft button in the object page or subobject page.
     * @param entitySet The current entity set.
     * @returns Returns expression binding or Boolean value based on the draft state
     */;
    _proto.getSwitchToDraftVisibility = function getSwitchToDraftVisibility(entitySet) {
      if (checkDraftState(entitySet)) {
        if (this.checkCollaborationDraftRoot(entitySet)) {
          return compileExpression(and(pathInModel("HasDraftEntity"), not(UI.IsEditable)));
        } else {
          return compileExpression(and(Draft.IsCreatedByMe, not(UI.IsEditable), not(UI.IsCreateMode), pathInModel("HasDraftEntity")));
        }
      } else {
        return false;
      }
    }

    /**
     * Function to get the visibility for the SwitchDraftAndActive button in the object page or subobject page.
     * @param entitySet The current entity set.
     * @returns Returns expression binding or Boolean value based on the draft state
     */;
    _proto.getVisibility = function getVisibility(entitySet) {
      if (checkDraftState(entitySet)) {
        if (this.checkCollaborationDraftRoot(entitySet)) {
          // On an active instance, we check if there's a draft. On a draft instance, we check if there's an active entity.
          // We also check either that the draft is collaborative (access type 3) or that the draft was created by me (in case an exclusive draft was created before) --> for an exclusive draft not created by me, we don't show the toggle
          return compileExpression(and(ifElse(pathInModel("IsActiveEntity"), equal(pathInModel("HasDraftEntity"), true), equal(pathInModel("HasActiveEntity"), true)), or(Draft.IsOfCollaborativeType, Draft.IsCreatedByMe)));
        } else {
          return compileExpression(and(Draft.IsCreatedByMe, not(UI.IsCreateMode)));
        }
      } else {
        return false;
      }
    };
    _proto.createPopover = function createPopover() {
      const draftId = this.createId("DraftToggleItemDraft");
      const activeId = this.createId("DraftToggleItemActive");
      const isDraftCurrent = this.initialSelectedKey === this.SWITCH_TO_DRAFT_KEY;
      const initialFocusId = isDraftCurrent ? activeId : draftId;
      return _jsx(ResponsivePopover, {
        showHeader: false,
        contentWidth: "15.625rem",
        verticalScrolling: false,
        class: "sapUiNoContentPadding",
        placement: "Bottom",
        initialFocus: initialFocusId,
        children: _jsxs(List, {
          children: [_jsx(StandardListItem, {
            id: draftId,
            title: "{sap.fe.i18n>C_COMMON_OBJECT_PAGE_DISPLAY_DRAFT_MIT}",
            type: "Active",
            press: () => this.handleSelectedItemChange(this.SWITCH_TO_DRAFT_KEY)
          }), _jsx(StandardListItem, {
            id: activeId,
            title: "{sap.fe.i18n>C_COMMON_OBJECT_PAGE_DISPLAY_SAVED_VERSION_MIT}",
            type: "Active",
            press: () => this.handleSelectedItemChange(this.SWITCH_TO_ACTIVE_KEY)
          })]
        })
      });
    };
    _proto.createContent = function createContent() {
      const contextPathToUse = this._getOwner()?.preprocessorContext?.fullContextPath;
      const odataMetaModel = this._getOwner()?.getMetaModel();
      const context = odataMetaModel?.createBindingContext(this.contextPath ?? contextPathToUse);
      const entityset = MetaModelConverter.convertMetaModelContext(context);
      const textValue = ifElse(and(not(UI.IsEditable), not(UI.IsCreateMode), Entity.HasDraft), pathInModel("C_COMMON_OBJECT_PAGE_SAVED_VERSION_BUT", "sap.fe.i18n"), pathInModel("C_COMMON_OBJECT_PAGE_DRAFT_BUT", "sap.fe.i18n"));
      const visible = this.getVisibility(entityset);
      const controller = this._getOwner()?.getRootController();
      const invisibleText = _jsx(InvisibleText, {
        text: "{sap.fe.i18n>T_HEADER_DATAPOINT_TITLE_DRAFT_SWITCHER_ARIA_BUTTON}",
        id: this.createId("AriaTextDraftSwitcher")
      });
      invisibleText.toStatic();
      const draftToggle = _jsx(Button, {
        id: this.createId("_dt"),
        "dt:designtime": "not-adaptable",
        text: textValue,
        visible: visible,
        icon: "sap-icon://navigation-down-arrow",
        iconFirst: false,
        type: "Transparent",
        press: event => this.openSwitchActivePopover(event),
        ariaDescribedBy: this.createId("AriaTextDraftSwitcher") ? [this.createId("AriaTextDraftSwitcher")] : undefined
      });
      draftToggle.addDependent(invisibleText);
      controller.getView().addDependent(_jsx(CommandExecution, {
        command: "SwitchToActiveObject",
        execute: () => {
          controller.editFlow.toggleDraftActive(controller.getView().getBindingContext());
        },
        visible: this.getSwitchToActiveVisibility(entityset)
      }));
      controller.getView().addDependent(_jsx(CommandExecution, {
        command: "SwitchToDraftObject",
        execute: () => {
          controller.editFlow.toggleDraftActive(controller.getView().getBindingContext());
        },
        visible: this.getSwitchToDraftVisibility(entityset)
      }));
      return draftToggle;
    };
    return DraftToggle;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_m_IOverflowToolbarContent", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "switchToActiveRef", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "switchToDraftRef", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = DraftToggle;
  return _exports;
}, false);
//# sourceMappingURL=DraftToggle-dbg.js.map
