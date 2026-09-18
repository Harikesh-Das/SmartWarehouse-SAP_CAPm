/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/controllerextensions/editFlow/draft", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/m/Breadcrumbs", "sap/m/Link", "sap/fe/base/jsx-runtime/jsx"], function (Log, ClassSupport, CommonUtils, BuildingBlock, draft, ModelHelper, ResourceModelHelper, StableIdHelper, UI5Breadcrumbs, Link, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var _exports = {};
  var generate = StableIdHelper.generate;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  const hierachyModeOptions = {
    OBJECT: "objectNavigation",
    FULL: "fullNavigation"
  };
  _exports.hierachyModeOptions = hierachyModeOptions;
  /**
   * Building block used to create breadcrumbs.
   */
  let Breadcrumbs = (_dec = defineUI5Class("sap.fe.macros.Breadcrumbs"), _dec2 = implementInterface("sap.m.IBreadcrumbs"), _dec3 = property({
    type: "string",
    defaultValue: hierachyModeOptions.OBJECT,
    allowedValues: Object.values(hierachyModeOptions)
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function Breadcrumbs() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BuildingBlock.call(this, ...args) || this;
      _initializerDefineProperty(_this, "__implements__sap_m_IBreadcrumbs", _descriptor, _this);
      /**
       * Hierarchy mode for breadcrumbs
       * @public
       */
      _initializerDefineProperty(_this, "hierarchyMode", _descriptor2, _this);
      return _this;
    }
    _exports = Breadcrumbs;
    _inheritsLoose(Breadcrumbs, _BuildingBlock);
    var _proto = Breadcrumbs.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      if (!this.content) {
        this._getOwner()?.runAsOwner(() => {
          this.content = this.createContent();
        });
      }
    }

    /**
     * Get breadcrumbs title information for full path.
     * @param fullPathForLinks The context path of the object page.
     * @returns Promises resolving to TitleInformation objects for each path part.
     */;
    _proto._getBreadcrumbsTitleInfos = function _getBreadcrumbsTitleInfos(fullPathForLinks) {
      const promises = [],
        appComponent = this.getAppComponent(),
        rootViewController = appComponent.getRootViewController(),
        metaModel = appComponent.getMetaModel(),
        pathParts = this._getBreadcrumbsPathParts(fullPathForLinks);
      let path = "";
      if (this.hierarchyMode === hierachyModeOptions.FULL) {
        // Home page
        const resourceModel = getResourceModel(this);
        const homeTitle = this._getFEManifestBreadcrumbSettings()?.home;
        promises.push(Promise.resolve({
          intent: "#" + (this.getAppComponent()?.getShellServices().getHomeIntent() ?? "Shell-home"),
          title: homeTitle ? CommonUtils.getTranslatedTextFromExpBindingString(homeTitle, this) : resourceModel.getText("T_APP_HOME")
        }));
      }
      pathParts.forEach(function (pathPart, idx) {
        path += pathPart ? `/${pathPart}` : "";
        if (!appComponent.getRouter().getRouteInfoByHash(path)) {
          // If the target is not declared in the routes, we skip it
          return;
        }
        // If in full Navigation mode, the first page of the application uses the title and subtitle from the manifest
        if (!idx && path === "" && this.hierarchyMode === hierachyModeOptions.FULL) {
          promises.push(this._getFirstPageTitleInformation());
          return;
        }
        const parameterPath = metaModel.getMetaPath(path);
        const resultContext = metaModel.getObject(`${parameterPath}/@com.sap.vocabularies.Common.v1.ResultContext`);
        if (resultContext) {
          // We dont need to create a breadcrumb for Parameter path
          return;
        }
        promises.push(rootViewController.getTitleInfoFromPath(path));
      }.bind(this));
      return promises;
    }

    /**
     * Get path parts from the full path for links.
     * @param fullPathForLinks The context path of the object page.
     * @returns Path parts for creating breadcrumb links.
     */;
    _proto._getBreadcrumbsPathParts = function _getBreadcrumbsPathParts(fullPathForLinks) {
      const pathParts = fullPathForLinks?.split("/") ?? [];
      if (this.hierarchyMode !== hierachyModeOptions.FULL) {
        pathParts.shift(); // Remove ""
        pathParts.splice(-1, 1); // Remove current page
      }
      return pathParts;
    };
    _proto._getFirstPageTitleInformation = async function _getFirstPageTitleInformation() {
      const appComponent = this.getAppComponent(),
        rootViewController = appComponent.getRootViewController(),
        manifestAppSettings = appComponent.getManifestEntry("sap.app"),
        appTitle = manifestAppSettings.title || "",
        appSubTitle = manifestAppSettings.subTitle || "",
        appIcon = manifestAppSettings.icon || "",
        appSpecificHash = rootViewController.getAppSpecificHash();
      const titleInfo = {
        ...(await rootViewController.getRootLevelTitleInformation(appSpecificHash, appTitle, appSubTitle, appIcon))
      };
      titleInfo.subtitle = titleInfo.title;
      const spaceName = this._getFEManifestBreadcrumbSettings()?.space;
      titleInfo.title = spaceName ? CommonUtils.getTranslatedTextFromExpBindingString(spaceName, this) : "";
      return titleInfo;
    };
    _proto._getFEManifestBreadcrumbSettings = function _getFEManifestBreadcrumbSettings() {
      const appComponent = this.getAppComponent(),
        manifestFESettings = appComponent.getManifestEntry("sap.fe");
      return manifestFESettings?.app?.breadcrumbs;
    }

    /**
     * Sets breadcrumb links in the given Breadcrumbs control.
     *
     * This method retrieves the title information for each path part and sets the links accordingly.
     * If the `fullPathForLink` parameter is not provided, it uses the binding context path of the Breadcrumbs control.
     * @param fullPathForLinks The full path for the link, defaults to the binding context path of the Breadcrumbs control
     * @returns A promise that resolves when the breadcrumb links are set
     */;
    _proto.setBreadcrumbLinks = async function setBreadcrumbLinks() {
      let fullPathForLinks = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.getBindingContext()?.getPath();
      if (typeof fullPathForLinks !== "string") {
        Log.info("Breadcrumbs: path not available. Cannot set breadcrumb links.");
        return;
      }
      const breadcrumbsCtrl = this.getContent();
      if (!breadcrumbsCtrl) {
        Log.error("Breadcrumbs Building block: Breadcrumbs control not available. Cannot set breadcrumb links.");
        return;
      }
      try {
        const titleHierarchyInfos = await Promise.all(this._getBreadcrumbsTitleInfos(fullPathForLinks));
        titleHierarchyInfos.forEach(this.updateBreadcrumbLink.bind(this));
      } catch (error) {
        Log.error("Error while setting the breadcrumb links: " + error);
      }
    }

    /**
     * Update the breadcrumb link at the specified hierarchy position.
     * @param titleHierarchyInfo The title information for the link
     * @param hierarchyPosition The position of the link in the hierarchy
     * @param titleHierarchyInfos The array of all title information for the hierarchy
     */;
    _proto.updateBreadcrumbLink = function updateBreadcrumbLink(titleHierarchyInfo, hierarchyPosition, titleHierarchyInfos) {
      const breadcrumbsCtrl = this.getContent();
      const isLastLink = hierarchyPosition === titleHierarchyInfos.length - 1;
      const linkText = this.getLinkText(titleHierarchyInfo, isLastLink, hierarchyPosition);
      if (!linkText) {
        Log.error("Breadcrumbs: No link text available for the breadcrumb link at position " + hierarchyPosition);
        return;
      }
      if (isLastLink && this.hierarchyMode === hierachyModeOptions.FULL) {
        // NOTE: As of 1.136.0, the setCurrentLocationText method is not deprecated.
        // It was depricated in UI5 1.123 but reintroduced on/before UI5 1.127.
        // As of day of writing this, we use UI5 1.124 for openui5 types.
        // eslint-disable-next-line deprecation/deprecation
        breadcrumbsCtrl.setCurrentLocationText(linkText);
      } else {
        const link = breadcrumbsCtrl.getLinks()[hierarchyPosition] ? breadcrumbsCtrl.getLinks()[hierarchyPosition] : new Link();
        //sCurrentEntity is a fallback value in case of empty title
        link.setText(linkText);
        //We apply an additional encodeURI in case of special characters (ie "/") used in the url through the semantic keys
        link.setHref(encodeURI(titleHierarchyInfo.intent));

        // Attach press handler to check for draft data loss before navigation. Only required for the first two breadcrumb
        // links in FULL mode (home and LR), as in OBJECT mode, breadcrumbs start from the sub object page, wherein no
        // popup is required.
        if (this.hierarchyMode === hierachyModeOptions.FULL && hierarchyPosition <= 1 && this.getPageController().isA("sap.fe.templates.ObjectPage.ObjectPageController")) {
          link.detachPress(this.onLinkPress, this);
          link.attachPress(this.onLinkPress, this);
        }
        if (!breadcrumbsCtrl.getLinks()[hierarchyPosition]) {
          breadcrumbsCtrl.addLink(link);
        }
      }
    }

    /**
     * Handle link press event to check for unsaved changes before navigation.
     * @param event The press event from the link
     */;
    _proto.onLinkPress = async function onLinkPress(event) {
      event.preventDefault();
      const href = event.getSource().getHref();
      const pageController = this.getPageController();
      const bindingContext = pageController.getView().getBindingContext();
      if (ModelHelper.isDraftSupported(bindingContext.getModel().getMetaModel(), bindingContext.getPath())) {
        await draft.processDataLossOrDraftDiscardConfirmation(() => {
          window.location.hash = href;
        }, Function.prototype, pageController.getView().getBindingContext(), pageController, true, draft.NavigationType.BackNavigation, undefined, undefined, true);
      } else {
        window.location.hash = href;
      }
    }

    /**
     * Get link text based on title and subtitle.
     * @param titleInfo Title information containing title and subtitle
     * @param isLastLink Determines if it is the last link in the breadcrumbs
     * @param hierarchyPosition Position of the link in the hierarchy
     * @returns Link text
     */;
    _proto.getLinkText = function getLinkText(titleInfo, isLastLink, hierarchyPosition) {
      const {
        title,
        subtitle
      } = titleInfo;
      const titleExists = title !== undefined && title !== "";
      const subtitleExists = subtitle !== undefined && subtitle !== "";
      if (titleExists && subtitleExists && this.hierarchyMode === hierachyModeOptions.FULL) {
        const resourceModel = getResourceModel(this);
        const isFirstPage = hierarchyPosition === 1;
        return !isFirstPage && isLastLink ? title : resourceModel.getText("T_BREADCRUMBS_TITLE_LONG_TEMPLATE", [title, subtitle]);
      }
      if (subtitleExists) {
        return subtitle;
      } else if (titleExists) {
        return title;
      }
    };
    _proto.createContent = function createContent() {
      const viewId = this.getPageController()?.getView().getId();
      return _jsx(UI5Breadcrumbs
      // This is set as absolute ID.
      , {
        id: viewId ? generate([`${viewId}--fe`, "Breadcrumbs"]) : undefined,
        modelContextChange: () => {
          this.setBreadcrumbLinks();
        }
      });
    };
    return Breadcrumbs;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_m_IBreadcrumbs", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "hierarchyMode", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = Breadcrumbs;
  return _exports;
}, false);
//# sourceMappingURL=Breadcrumbs-dbg.js.map
