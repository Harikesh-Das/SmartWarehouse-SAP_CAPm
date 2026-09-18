/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/fe/core/converters/ManifestWrapper", "sap/fe/core/converters/MetaModelConverter", "sap/m/library", "sap/ui/core/UIComponent"], function (ClassSupport, CommonUtils, ManifestWrapper, MetaModelConverter, library, UIComponent) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22;
  var OverflowToolbarPriority = library.OverflowToolbarPriority;
  var getMetaModelById = MetaModelConverter.getMetaModelById;
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
   * Base component for SAP Fiori elements floorplans.
   *
   * This component provides as foundation for all SAP Fiori elements page types, and shall not be used directly.
   * @public
   * @since 1.145.0
   */
  let TemplateComponent = (_dec = defineUI5Class("sap.fe.core.TemplateComponent"), _dec2 = implementInterface("sap.ui.core.IAsyncContentCreation"), _dec3 = implementInterface("sap.fe.core.buildingBlocks.IBuildingBlockOwnerComponent"), _dec4 = property({
    type: "string",
    defaultValue: null
  }), _dec5 = property({
    type: "string",
    defaultValue: null
  }), _dec6 = property({
    type: "object"
  }), _dec7 = property({
    type: "string"
  }), _dec8 = property({
    type: "object"
  }), _dec9 = property({
    type: "string[]"
  }), _dec10 = property({
    type: "object"
  }), _dec11 = property({
    type: "object"
  }), _dec12 = property({
    type: "object"
  }), _dec13 = property({
    type: "boolean"
  }), _dec14 = property({
    type: "string"
  }), _dec15 = property({
    type: "object"
  }), _dec16 = property({
    type: "string"
  }), _dec17 = property({
    type: "string"
  }), _dec18 = property({
    type: "string"
  }), _dec19 = property({
    type: "string"
  }), _dec20 = event(), _dec21 = event(), _dec22 = event(), _dec23 = property({
    type: "string",
    defaultValue: OverflowToolbarPriority.High
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_UIComponent) {
    function TemplateComponent() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _UIComponent.call(this, ...args) || this;
      _initializerDefineProperty(_this, "__implements__sap_ui_core_IAsyncContentCreation", _descriptor, _this);
      _initializerDefineProperty(_this, "__implements__sap_fe_core_buildingBlocks_IBuildingBlockOwnerComponent", _descriptor2, _this);
      /**
       * Name of the OData entity set
       */
      _initializerDefineProperty(_this, "entitySet", _descriptor3, _this);
      /**
       * Defines the path of the context used in the current page.
       * @public
       */
      _initializerDefineProperty(_this, "contextPath", _descriptor4, _this);
      _initializerDefineProperty(_this, "preprocessorContext", _descriptor5, _this);
      /**
       * The pattern for the binding context to be create based on the parameters from the navigation
       * If not provided we'll default to what was passed in the URL
       */
      _initializerDefineProperty(_this, "bindingContextPattern", _descriptor6, _this);
      /**
       * Map of used OData navigations and its routing targets.
       */
      _initializerDefineProperty(_this, "navigation", _descriptor7, _this);
      /**
       * Enhance the i18n bundle used for this page with one or more app specific i18n resource bundles or resource models
       * or a combination of both. The last resource bundle or model is given the highest priority.
       * @public
       */
      _initializerDefineProperty(_this, "enhanceI18n", _descriptor8, _this);
      /**
       * Define control related configuration settings.
       */
      _initializerDefineProperty(_this, "controlConfiguration", _descriptor9, _this);
      _initializerDefineProperty(_this, "inlineEdit", _descriptor10, _this);
      /**
       * Adjusts the template content
       */
      _initializerDefineProperty(_this, "content", _descriptor11, _this);
      /**
       * Whether or not you can reach this page directly through semantic bookmarks
       */
      _initializerDefineProperty(_this, "allowDeepLinking", _descriptor12, _this);
      /**
       * Comma-separated list of additional OData property paths to request alongside the standard page data.
       * Property paths may traverse 1:1 navigation associations, for example, `"_Supplier/Name"`.
       * Collection-typed navigation properties are not supported.
       */
      _initializerDefineProperty(_this, "additionalProperties", _descriptor13, _this);
      /**
       * Defines the context path on the component that is refreshed when the app is restored using keep alive mode
       */
      _initializerDefineProperty(_this, "refreshStrategyOnAppRestore", _descriptor14, _this);
      /**
       * Hierarchy mode for breadcrumbs
       * Note: Breadcrumbs are not shown if this property is not set.
       */
      _initializerDefineProperty(_this, "breadcrumbsHierarchyMode", _descriptor15, _this);
      _initializerDefineProperty(_this, "viewType", _descriptor16, _this);
      /**
       * Name of the XML view which is used for this page.
       */
      _initializerDefineProperty(_this, "viewName", _descriptor17, _this);
      _initializerDefineProperty(_this, "_jsxViewName", _descriptor18, _this);
      _initializerDefineProperty(_this, "containerDefined", _descriptor19, _this);
      _initializerDefineProperty(_this, "heroesBatchReceived", _descriptor20, _this);
      _initializerDefineProperty(_this, "workersBatchReceived", _descriptor21, _this);
      _initializerDefineProperty(_this, "shareOverflowPriority", _descriptor22, _this);
      return _this;
    }
    _inheritsLoose(TemplateComponent, _UIComponent);
    var _proto = TemplateComponent.prototype;
    // The id of a fragment being processed, it will take priority in the ID generation
    _proto.setContainer = function setContainer(oContainer) {
      _UIComponent.prototype.setContainer.call(this, oContainer);
      this.fireEvent("containerDefined", {
        container: oContainer
      });
      return this;
    };
    _proto.init = function init() {
      this.oAppComponent = CommonUtils.getAppComponent(this);
      this.oComponentData ??= {};
      _UIComponent.prototype.init.call(this);
    }

    // This method is called by UI5 core to access to the component containing the customizing configuration.
    // as controller extensions are defined in the manifest for the app component and not for the
    // template component we return the app component.
    ;
    _proto.getExtensionComponent = function getExtensionComponent() {
      return this.oAppComponent;
    };
    _proto.getAppComponent = function getAppComponent() {
      return this.oAppComponent;
    };
    _proto.setRootController = function setRootController(controller) {
      this._rootController = controller;
    };
    _proto.getRootController = function getRootController() {
      const rootControl = this.getRootControl();
      let rootController;
      if (rootControl && rootControl.getController) {
        rootController = rootControl.getController();
      } else {
        rootController = this._rootController;
      }
      return rootController;
    };
    _proto.onPageReady = function onPageReady(mParameters) {
      const rootController = this.getRootController();
      if (rootController && rootController.onPageReady) {
        rootController.onPageReady(mParameters);
      }
    };
    _proto.getNavigationConfiguration = function getNavigationConfiguration(sTargetPath) {
      const mNavigation = this.navigation;
      return mNavigation[sTargetPath];
    };
    _proto.getViewData = function getViewData() {
      const mProperties = this.getMetadata().getAllProperties();
      const oViewData = Object.keys(mProperties).reduce((mViewData, sPropertyName) => {
        mViewData[sPropertyName] = mProperties[sPropertyName].get(this);
        return mViewData;
      }, {});
      delete oViewData.preprocessorContext;
      // Access the internal _isFclEnabled which will be there
      oViewData.fclEnabled = this.oAppComponent._isFclEnabled();
      const routingTargetName = this.oAppComponent.getRoutingService().getTargetName(this);
      oViewData.isInlineEditEnabled = routingTargetName ? this.oAppComponent.getInlineEditService().doesPageHaveInlineEdit(routingTargetName) : false;
      return oViewData;
    };
    _proto._getPageTitleInformation = async function _getPageTitleInformation() {
      const rootControl = this.getRootControl();
      if (rootControl && rootControl.getController() && rootControl.getController()._getPageTitleInformation) {
        return rootControl.getController()._getPageTitleInformation();
      } else {
        return Promise.resolve({});
      }
    }

    /**
     * Get browser title information for component.
     * @param pageTitleInformation Present page title information
     * @returns Title information to be used by shell services for browser title
     */;
    _proto._getBrowserTitle = async function _getBrowserTitle(pageTitleInformation) {
      const rootControl = this.getRootControl();
      return rootControl.getController()?._getBrowserTitle(pageTitleInformation);
    };
    _proto.getExtensionAPI = function getExtensionAPI() {
      return this.getRootControl().getController().getExtensionAPI();
    }

    /**
     * Retrieves the metamodel for the given metamodel reference (ID / name or undefined for the default one).
     * @param metaModelReference The metamodel reference
     * @returns The correct metamodel if it exits
     */;
    _proto.getMetaModel = function getMetaModel(metaModelReference) {
      if (!metaModelReference) {
        return this.preprocessorContext?.models.metaModel;
      } else if (metaModelReference.startsWith("id-")) {
        return getMetaModelById(metaModelReference);
      } else if (!this.getModel(metaModelReference)) {
        return this.getAppComponent().getModel(metaModelReference)?.getMetaModel();
      } else {
        return this.getModel(metaModelReference)?.getMetaModel();
      }
    }

    /**
     * Retrieves the full context path for the given metamodel reference (ID / name or undefined for the default one).
     * @param metaModelReference The metamodel reference
     * @returns The correct full context path
     */;
    _proto.getFullContextPath = function getFullContextPath(metaModelReference) {
      if (!metaModelReference) {
        return this.preprocessorContext?.fullContextPath;
      }
    }

    /**
     * Retrieves the ManifestWrapper for the current view.
     * @returns The ManifestWrapper
     */;
    _proto.getManifestWrapper = function getManifestWrapper() {
      return new ManifestWrapper(this.getViewData());
    };
    _proto._getControllerName = function _getControllerName() {
      return undefined;
    }

    /**
     * Returns additional i18n bundles to be loaded for this component.
     * @returns An array of additional i18n bundle names
     */;
    _proto._getAdditionalI18nBundles = function _getAdditionalI18nBundles() {
      return [];
    };
    return TemplateComponent;
  }(UIComponent), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_ui_core_IAsyncContentCreation", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_fe_core_buildingBlocks_IBuildingBlockOwnerComponent", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "entitySet", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return null;
    }
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return null;
    }
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "preprocessorContext", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "bindingContextPattern", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "navigation", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "enhanceI18n", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "controlConfiguration", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "inlineEdit", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "content", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "allowDeepLinking", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "additionalProperties", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "refreshStrategyOnAppRestore", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "breadcrumbsHierarchyMode", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "viewType", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "XML";
    }
  }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "viewName", [_dec18], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "_jsxViewName", [_dec19], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "containerDefined", [_dec20], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "heroesBatchReceived", [_dec21], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "workersBatchReceived", [_dec22], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor22 = _applyDecoratedDescriptor(_class2.prototype, "shareOverflowPriority", [_dec23], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return TemplateComponent;
}, false);
//# sourceMappingURL=TemplateComponent-dbg.js.map
