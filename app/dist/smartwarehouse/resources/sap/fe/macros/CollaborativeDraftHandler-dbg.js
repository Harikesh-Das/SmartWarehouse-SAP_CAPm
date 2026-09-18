/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/base/EventDelegateHook", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/formatters/CollaborationFormatter", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/UIFormatters", "sap/m/Avatar", "sap/m/Label", "sap/m/ResponsivePopover", "sap/ui/core/Element", "sap/fe/base/jsx-runtime/jsx"], function (BindingToolkit, ClassSupport, EventDelegateHook, BuildingBlock, CollaborationFormatters, ModelHelper, ResourceModelHelper, TypeGuards, DataModelPathHelper, UIFormatters, Avatar, Label, ResponsivePopover, UI5Element, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6;
  var _exports = {};
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var isProperty = TypeGuards.isProperty;
  var property = ClassSupport.property;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var compileExpression = BindingToolkit.compileExpression;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * A BuildingBlock to watch the lock status of a property and to react on changes.
   * @public
   * @since 1.141.0
   */
  let CollaborativeDraftHandler = (_dec = defineUI5Class("sap.fe.macros.CollaborativeDraftHandler"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "string"
  }), _dec4 = event(), _dec5 = event(), _dec6 = property({
    type: "boolean",
    defaultValue: false
  }), _dec7 = property({
    type: "object"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function CollaborativeDraftHandler(idOrSettings, settings) {
      var _this;
      _this = _BuildingBlock.call(this, idOrSettings, settings) || this;
      /**
       * Defines the path of the context used in the current page or block.
       * This setting is defined by the framework, and can be overwritten.
       * @public
       * @since 1.141.0
       */
      _initializerDefineProperty(_this, "contextPath", _descriptor, _this);
      /**
       * Defines the relative path of the property in the metamodel, based on the current contextPath.
       * @public
       * @since 1.141.0
       */
      _initializerDefineProperty(_this, "metaPath", _descriptor2, _this);
      /**
       * Event fired when the lock status changes.
       *
       * Parameters:<BR>
       * - isLocked : True if the property is locked, false otherwise<BR>
       * - lockingUserID: The ID of the user locking the property (undefined if not locked)<BR>
       * - lockingUserName: The name of the user locking the property (undefined if not locked)<BR>
       * - lockingUserInitials: The initials of the user locking the property (undefined if not locked)<BR>
       * - lockingUserColor: The color associated to the user locking the property (undefined if not locked)<BR>
       * @public
       * @since 1.141.0
       */
      _initializerDefineProperty(_this, "lockChange", _descriptor3, _this);
      /**
       * Event fired when the user clicks on the avatar.
       *
       * Parameters:<BR>
       * - lockingUserID: The ID of the user locking the property<BR>
       * - lockingUserName: The name of the user locking the property<BR>
       * - lockingUserInitials: The initials of the user locking the property<BR>
       * - lockingUserColor: The color associated to the user locking the property<BR>
       * @public
       * @since 1.142.0
       */
      _initializerDefineProperty(_this, "avatarPress", _descriptor4, _this);
      /**
       * If set to true, the standard Avatar control is displayed to indicate the lock status.
       * If set to false, nothing is displayed.
       * @public
       * @since 1.141.0
       */
      _initializerDefineProperty(_this, "showAvatar", _descriptor5, _this);
      /**
       * Internal property to receive the lock data
       */
      _initializerDefineProperty(_this, "lockInfo", _descriptor6, _this);
      return _this;
    }
    _exports = CollaborativeDraftHandler;
    _inheritsLoose(CollaborativeDraftHandler, _BuildingBlock);
    var _proto = CollaborativeDraftHandler.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      const owner = this._getOwner();
      if (!owner) {
        return;
      }
      if (!ModelHelper.isCollaborationDraftSupported(owner.getAppComponent().getModel().getMetaModel())) {
        return;
      }
      const objectPath = this.getDataModelObjectForMetaPath(this.metaPath, this.contextPath);
      if (!objectPath || !isProperty(objectPath.targetObject)) {
        throw new Error(`CollaborativeDraftHandler: the provided metaPath '${this.metaPath}' does not point to a valid property`);
      }

      // Bind the lockInfo property to the corresponding lockInfo in the internal model
      const keysBindingParts = objectPath.contextLocation?.targetEntityType.keys.map(key => {
        return {
          path: key.name,
          targetType: "any"
        };
      });
      const bindingInfo = {
        parts: [{
          path: `internal>/collaboration/activities${getTargetObjectPath(objectPath)}`,
          targetType: "any"
        }, ...keysBindingParts],
        formatter: CollaborationFormatters.getCollaborationInfo
      };
      this.bindProperty("lockInfo", bindingInfo);
      if (!this.content && this.showAvatar) {
        this.content = this.createCollaborationAvatar(objectPath);
      }
    }

    /**
     * Update the lockInfo property and fire the lockChange event if there is a change.
     * @param lockInfo
     */;
    _proto.setLockInfo = function setLockInfo(lockInfo) {
      if (this.lockInfo !== lockInfo) {
        this.lockInfo = lockInfo;
        this.fireEvent("lockChange", {
          isLocked: this.lockInfo !== undefined,
          lockingUserID: this.lockInfo?.id,
          lockingUserName: this.lockInfo?.name,
          lockingUserInitials: this.lockInfo?.initials,
          lockingUserColor: this.lockInfo?.color
        });
      }
    }

    /**
     * Creates the content of the block (Avatar).
     * @param objectPath
     * @returns The Avatar control
     */;
    _proto.createCollaborationAvatar = function createCollaborationAvatar(objectPath) {
      const collaborationHasActivityExpression = compileExpression(UIFormatters.getCollaborationExpression(objectPath, CollaborationFormatters.hasCollaborationActivity));
      const collaborationInitialsExpression = compileExpression(UIFormatters.getCollaborationExpression(objectPath, CollaborationFormatters.getCollaborationActivityInitials));
      const collaborationColorExpression = compileExpression(UIFormatters.getCollaborationExpression(objectPath, CollaborationFormatters.getCollaborationActivityColor));
      return _jsx(Avatar, {
        visible: collaborationHasActivityExpression,
        initials: collaborationInitialsExpression,
        displaySize: "Custom",
        customDisplaySize: "1.5rem",
        customFontSize: "0.8rem",
        backgroundColor: collaborationColorExpression,
        press: evt => {
          this.onAvatarPress(evt);
        },
        children: {
          dependents: _jsx(EventDelegateHook, {
            stopTapPropagation: true
          })
        }
      });
    }

    /**
     * Event handler for the press event of the Avatar.
     * @param evt
     */;
    _proto.onAvatarPress = function onAvatarPress(evt) {
      const avatar = evt.getSource();
      const block = avatar.getParent();
      if (block.hasListeners("avatarPress")) {
        // If the event is handled by the application, do not open the popover
        block.fireEvent("avatarPress", {
          lockingUserID: block.lockInfo?.id,
          lockingUserName: block.lockInfo?.name,
          lockingUserInitials: block.lockInfo?.initials,
          lockingUserColor: block.lockInfo?.color
        });
        return;
      }
      const view = this.getPageController().getView();
      const resourceModel = ResourceModelHelper.getResourceModel(view);
      let popover = UI5Element.getElementById(`manageCollaborationDraft--editUser`);
      if (!popover) {
        popover = new ResponsivePopover("manageCollaborationDraft--editUser", {
          showHeader: false,
          placement: "Bottom"
        });
        popover.addStyleClass("sapUiContentPadding");
        view.addDependent(popover);
      }
      popover.destroyContent();
      popover.addContent(new Label({
        text: resourceModel.getText("C_COLLABORATIONAVATAR_USER_EDIT_FIELD", [`${block.lockInfo?.name}`])
      }));
      popover.openBy(avatar);
    };
    return CollaborativeDraftHandler;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "lockChange", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "avatarPress", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "showAvatar", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "lockInfo", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = CollaborativeDraftHandler;
  return _exports;
}, false);
//# sourceMappingURL=CollaborativeDraftHandler-dbg.js.map
