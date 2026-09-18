/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/f/DynamicPage", "sap/f/DynamicPageAccessibleLandmarkInfo", "sap/f/DynamicPageHeader", "sap/f/DynamicPageTitle", "sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/controllerextensions/BusyLocker", "sap/fe/core/controls/CommandExecution", "sap/fe/macros/controls/Avatar", "sap/fe/macros/ObjectTitle", "sap/fe/macros/Share", "sap/fe/macros/share/ShareOptions", "sap/m/AvatarShape", "sap/m/AvatarSize", "sap/m/FlexBox", "sap/m/HBox", "sap/m/Label", "sap/m/Title", "sap/ui/core/library", "./share/MsTeamsOptions", "sap/fe/base/jsx-runtime/jsx"], function (DynamicPage, DynamicPageAccessibleLandmarkInfo, DynamicPageHeader, DynamicPageTitle, ClassSupport, BuildingBlock, BusyLocker, CommandExecution, Avatar, ObjectTitle, Share, ShareOptions, AvatarShape, AvatarSize, FlexBox, HBox, Label, Title, library, MsTeamsOptions, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14;
  var _exports = {};
  var AccessibleLandmarkRole = library.AccessibleLandmarkRole;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var association = ClassSupport.association;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block used to create a custom page with a title and the content. By default, the page includes a title.
   * @public
   */
  let Page = (_dec = defineUI5Class("sap.fe.macros.Page"), _dec2 = aggregation({
    type: "sap.ui.core.Control",
    multiple: true,
    isDefault: true
  }), _dec3 = aggregation({
    type: "sap.ui.core.Control",
    multiple: true
  }), _dec4 = aggregation({
    type: "sap.ui.core.Control",
    multiple: true
  }), _dec5 = aggregation({
    type: "sap.ui.core.Control",
    multiple: true
  }), _dec6 = aggregation({
    type: "sap.ui.core.Control",
    multiple: true
  }), _dec7 = aggregation({
    type: "sap.ui.core.Control",
    multiple: false
  }), _dec8 = aggregation({
    type: "sap.ui.core.Control",
    multiple: true
  }), _dec9 = property({
    type: "string",
    isBindingInfo: true
  }), _dec10 = property({
    type: "boolean"
  }), _dec11 = property({
    type: "string",
    isBindingInfo: true
  }), _dec12 = property({
    type: "string"
  }), _dec13 = property({
    type: "string",
    allowedValues: ["Cover", "Contain"]
  }), _dec14 = property({
    type: "boolean"
  }), _dec15 = association({
    type: "sap.ui.core.Control",
    multiple: false
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function Page(idOrSettings, settings) {
      var _this;
      _this = _BuildingBlock.call(this, idOrSettings, settings) || this;
      /**
       * Content(s) of the page
       * @public
       */
      _initializerDefineProperty(_this, "items", _descriptor, _this);
      /**
       * Actions to be displayed in the title area (for example, Edit and Delete buttons).
       * @public
       */
      _initializerDefineProperty(_this, "actions", _descriptor2, _this);
      /**
       * Breadcrumbs to be displayed in the title area.
       * @public
       */
      _initializerDefineProperty(_this, "breadcrumbs", _descriptor3, _this);
      /**
       * Navigation actions to be displayed in the title area.
       * @public
       */
      _initializerDefineProperty(_this, "navigationActions", _descriptor4, _this);
      /**
       * Content to be displayed next to the title (for example, GenericTag and Icon).
       * @public
       */
      _initializerDefineProperty(_this, "titleContent", _descriptor5, _this);
      /**
       * Footer content (for example, toolbar with buttons).
       * @public
       */
      _initializerDefineProperty(_this, "footer", _descriptor6, _this);
      /**
       * Additional content to be displayed in the header after the avatar.
       * @public
       */
      _initializerDefineProperty(_this, "headerContent", _descriptor7, _this);
      /**
       * Title of the page. If no title is provided, the title, avatar, and description are derived from the unqualified HeaderInfo annotation associated with the entity.
       * Can be a string or a binding info object.
       * @public
       */
      _initializerDefineProperty(_this, "title", _descriptor8, _this);
      /**
       * @private
       */
      _initializerDefineProperty(_this, "editable", _descriptor9, _this);
      /**
       * Provides additional details of the page. This property is considered only if the title property is defined.
       * Can be a string or a binding info object.
       * @public
       */
      _initializerDefineProperty(_this, "description", _descriptor10, _this);
      /**
       * Source of the avatar image. This property is considered only if the title property is defined.
       * @public
       */
      _initializerDefineProperty(_this, "avatarSrc", _descriptor11, _this);
      /**
       * ImageFitType of the avatar image. This property is only considered if the title property is defined.
       * @public
       */
      _initializerDefineProperty(_this, "avatarImageFitType", _descriptor12, _this);
      /**
       * Controls the visibility of the footer.
       * @public
       */
      _initializerDefineProperty(_this, "showFooter", _descriptor13, _this);
      /**
       * Reference to a control that provides sticky subheader content.
       * @public
       */
      _initializerDefineProperty(_this, "stickySubheaderProvider", _descriptor14, _this);
      return _this;
    }
    _exports = Page;
    _inheritsLoose(Page, _BuildingBlock);
    var _proto = Page.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      this.content = this.createContent();
    };
    _proto.createAvatar = function createAvatar(isExpanded) {
      if (this.avatarSrc) {
        return _jsx(Avatar, {
          src: this.avatarSrc,
          displayShape: AvatarShape.Square,
          displaySize: isExpanded ? AvatarSize.L : AvatarSize.S,
          imageFitType: this.avatarImageFitType
        });
      }
    };
    _proto.createTitle = function createTitle() {
      return _jsx(Title, {
        text: this.title
      });
    };
    _proto.createDescription = function createDescription() {
      return _jsx(Label, {
        text: this.description
      });
    };
    _proto.getTitlePart = function getTitlePart() {
      if (this.title && this.description) {
        return _jsx(FlexBox, {
          direction: "Column",
          children: {
            items: [this.createTitle(), this.createDescription()]
          }
        });
      } else if (this.title) {
        return _jsx(FlexBox, {
          direction: "Column",
          children: {
            items: [this.createTitle()]
          }
        });
      } else {
        return _jsx(ObjectTitle, {});
      }
    }

    /**
     * Returns the Share action with share options.
     * @returns The Share action control.
     */;
    _proto.getShareAction = function getShareAction() {
      return _jsx(Share, {
        id: this.createId("share"),
        children: {
          shareOptions: _jsx(ShareOptions, {
            showSendEmail: "true",
            showCollaborationManager: "true"
          }),
          msTeamsOptions: _jsx(MsTeamsOptions, {
            enableCard: "false"
          })
        }
      });
    };
    _proto.createHeaderWithContent = function createHeaderWithContent() {
      const headerItems = [];
      const avatar = this.createAvatar(true);
      const hboxItems = [];
      if (avatar) {
        hboxItems.push(avatar);
      }
      // Add spacing and additional header content if provided
      if (this.headerContent && this.headerContent.length > 0) {
        this.headerContent.forEach(content => {
          content.addStyleClass("sapUiMediumMarginEnd");
          content.addStyleClass("sapUiSmallMarginBottom");
          hboxItems.push(content);
        });
      }
      headerItems.push(_jsx(HBox, {
        children: {
          items: hboxItems
        }
      }));
      return _jsx(DynamicPageHeader, {
        children: {
          content: headerItems
        }
      });
    };
    _proto.createContent = function createContent() {
      const stickySubheaderProviderId = this.getAssociation("stickySubheaderProvider", null);
      const hasUShell = this.getAppComponent()?.getEnvironmentCapabilities().getCapabilities().UShell ?? true; // Default to true (FLP)
      const headerRole = hasUShell ? AccessibleLandmarkRole.None : AccessibleLandmarkRole.Banner;
      return _jsx(DynamicPage, {
        id: this.createId("page"),
        showFooter: this.showFooter,
        class: stickySubheaderProviderId ? "sapUiNoContentPadding" : undefined,
        stickySubheaderProvider: stickySubheaderProviderId,
        landmarkInfo: _jsx(DynamicPageAccessibleLandmarkInfo, {
          headerRole: headerRole,
          headerLabel: this.getTranslatedText("T_COMMON_CUSTOM_PAGE_HEADER")
        }),
        children: {
          title: _jsx(DynamicPageTitle, {
            id: this.createId("title"),
            children: {
              expandedHeading: this.getTitlePart(),
              snappedHeading: _jsx(FlexBox, {
                renderType: "Bare",
                children: {
                  items: [this.createAvatar(false), this.getTitlePart()]
                }
              }),
              breadcrumbs: this.breadcrumbs,
              navigationActions: this.navigationActions,
              content: this.titleContent,
              actions: this.actions.concat(this.getShareAction())
            }
          }),
          header: this.createHeaderWithContent(),
          footer: this.footer,
          content: stickySubheaderProviderId ? this.items.map(item => {
            return item;
          }) : [_jsx(FlexBox, {
            id: this.createId("content"),
            direction: "Column",
            children: {
              items: this.items.map(item => {
                item.addStyleClass("sapUiMediumMarginBottom");
                return item;
              })
            }
          })],
          dependents: [_jsx(CommandExecution, {
            execute: () => {
              const oContext = this.getBindingContext();
              const oModel = this.getModel("ui");
              BusyLocker.lock(oModel);
              this.getPageController()?.editFlow?.editDocument(oContext).finally(function () {
                BusyLocker.unlock(oModel);
              });
            },
            enabled: true,
            visible: true,
            command: "Edit"
          })]
        }
      });
    };
    return Page;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "items", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "actions", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "breadcrumbs", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "navigationActions", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "titleContent", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "footer", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "headerContent", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "title", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "editable", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "description", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "avatarSrc", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "avatarImageFitType", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "showFooter", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "stickySubheaderProvider", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = Page;
  return _exports;
}, false);
//# sourceMappingURL=Page-dbg.js.map
