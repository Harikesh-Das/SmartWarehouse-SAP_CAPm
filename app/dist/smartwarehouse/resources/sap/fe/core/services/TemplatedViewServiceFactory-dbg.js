/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/i18n/Localization", "sap/fe/base/BindingToolkit", "sap/fe/core/CommonUtils", "sap/fe/core/TemplateModel", "sap/fe/core/converters/ManifestSettings", "sap/fe/core/converters/ManifestWrapper", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/definition/FEDefinition", "sap/fe/core/helpers/LoaderUtils", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/manifestMerger/ChangePageConfiguration", "sap/ui/Device", "sap/ui/VersionInfo", "sap/ui/core/Core", "sap/ui/core/CustomData", "sap/ui/core/mvc/View", "sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory", "sap/ui/core/service/ServiceFactoryRegistry", "sap/ui/model/json/JSONModel", "../helpers/DynamicAnnotationPathHelper"], function (Log, Localization, BindingToolkit, CommonUtils, TemplateModel, ManifestSettings, ManifestWrapper, MetaModelConverter, FEDefinition, LoaderUtils, ModelHelper, ChangePageConfiguration, Device, VersionInfo, Core, CustomData, View, Service, ServiceFactory, ServiceFactoryRegistry, JSONModel, DynamicAnnotationPathHelper) {
  "use strict";

  var _exports = {};
  var resolveDynamicExpression = DynamicAnnotationPathHelper.resolveDynamicExpression;
  var applyPageConfigurationChanges = ChangePageConfiguration.applyPageConfigurationChanges;
  var requireDependencies = LoaderUtils.requireDependencies;
  var DefinitionContext = FEDefinition.DefinitionContext;
  var registerVirtualProperty = MetaModelConverter.registerVirtualProperty;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var convertMetaModelContext = MetaModelConverter.convertMetaModelContext;
  var TemplateType = ManifestSettings.TemplateType;
  var resolveBindingString = BindingToolkit.resolveBindingString;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let TemplatedViewService = /*#__PURE__*/function (_Service) {
    function TemplatedViewService() {
      return _Service.apply(this, arguments) || this;
    }
    _exports.TemplatedViewService = TemplatedViewService;
    _inheritsLoose(TemplatedViewService, _Service);
    var _proto = TemplatedViewService.prototype;
    _proto.init = function init() {
      const aServiceDependencies = [];
      const oContext = this.getContext();
      const oComponent = oContext.scopeObject;
      const oAppComponent = CommonUtils.getAppComponent(oComponent);
      const oMetaModel = oAppComponent.getMetaModel();
      this.pageId = oAppComponent.getLocalId(oComponent.getId());
      const sStableId = `${oAppComponent.getMetadata().getComponentName()}::${this.pageId}`;
      const aEnhanceI18n = oComponent.getEnhanceI18n() || [];
      let sAppNamespace;
      this.oFactory = oContext.factory;
      if (aEnhanceI18n) {
        sAppNamespace = oAppComponent.getMetadata().getComponentName();
        for (let i = 0; i < aEnhanceI18n.length; i++) {
          // In order to support text-verticalization applications can also pass a resource model defined in the manifest
          // UI5 takes care of text-verticalization for resource models defined in the manifest
          // Hence check if the given key is a resource model defined in the manifest
          // if so this model should be used to enhance the sap.fe resource model so pass it as it is
          const oResourceModel = oAppComponent.getModel(aEnhanceI18n[i]);
          if (oResourceModel && oResourceModel.isA("sap.ui.model.resource.ResourceModel")) {
            aEnhanceI18n[i] = oResourceModel;
          } else {
            aEnhanceI18n[i] = aEnhanceI18n[i].replace(".properties", "");
            if (!aEnhanceI18n[i].startsWith(oComponent.getMetadata().getComponentName())) {
              // scope the bundle to the app namespace if not explicitly set to the (reuse) component namespace
              aEnhanceI18n[i] = `${sAppNamespace}.${aEnhanceI18n[i]}`;
            }
          }
        }
      }
      const sCacheIdentifier = `${oAppComponent.getMetadata().getName()}_${sStableId}_${Localization.getLanguageTag()}`;
      const bundlesToLoad = ["sap.fe.core.messagebundle", "sap.fe.macros.messagebundle", "sap.fe.templates.messagebundle"];
      if (oComponent._getAdditionalI18nBundles) {
        bundlesToLoad.push(...oComponent._getAdditionalI18nBundles());
      }
      aServiceDependencies.push(ServiceFactoryRegistry.get("sap.fe.core.services.ResourceModelService").createInstance({
        scopeType: "component",
        scopeObject: oComponent,
        settings: {
          bundles: bundlesToLoad,
          enhanceI18n: aEnhanceI18n,
          modelName: "sap.fe.i18n"
        }
      }).then(oResourceModelService => {
        this.oResourceModelService = oResourceModelService;
        return oResourceModelService.getResourceModel();
      }));
      aServiceDependencies.push(ServiceFactoryRegistry.get("sap.fe.core.services.CacheHandlerService").createInstance({
        settings: {
          metaModel: oMetaModel,
          appComponent: oAppComponent,
          component: oComponent
        }
      }).then(async oCacheHandlerService => {
        const viewPreloaderService = await oAppComponent.getService("viewPreloaderService");
        await viewPreloaderService.isCacheReady();
        this.oCacheHandlerService = oCacheHandlerService;
        const environmentCapabilities = await oAppComponent.getService("environmentCapabilities");
        return oCacheHandlerService.validateCacheKey(sCacheIdentifier, oComponent, environmentCapabilities);
      }));
      aServiceDependencies.push(VersionInfo.load().then(function (oInfo) {
        let sTimestamp = "";
        if (!oInfo.libraries) {
          sTimestamp = Core?.buildinfo?.buildtime ?? "<NOVALUE>";
        } else {
          oInfo.libraries.forEach(function (oLibrary) {
            sTimestamp += oLibrary.buildTimestamp;
          });
        }
        return sTimestamp;
      }).catch(function () {
        return "<NOVALUE>";
      }));
      this.initPromise = Promise.all(aServiceDependencies).then(async aDependenciesResult => {
        const oResourceModel = aDependenciesResult[0];
        const sCacheKey = aDependenciesResult[1];
        const [TemplateConverter, MetaModelConverter] = await requireDependencies(["sap/fe/core/converters/TemplateConverter", "sap/fe/core/converters/MetaModelConverter"]);
        return this.createView(oResourceModel, sStableId, sCacheKey, TemplateConverter, MetaModelConverter);
      }).then(async function (sCacheKey) {
        const oCacheHandlerService = ServiceFactoryRegistry.get("sap.fe.core.services.CacheHandlerService").getInstance(oMetaModel);
        const environmentCapabilities = await oAppComponent.getService("environmentCapabilities");
        oCacheHandlerService.invalidateIfNeeded(sCacheKey, sCacheIdentifier, oComponent, environmentCapabilities);
        return;
      });
    }

    /**
     * Refresh the current view using the same configuration as before.
     * @param oComponent
     * @returns A promise indicating when the view is refreshed
     */;
    _proto.refreshView = async function refreshView(oComponent) {
      const oRootView = oComponent.getRootControl();
      if (oRootView) {
        oRootView.destroy();
      } else if (this.oView) {
        this.oView.destroy();
      }
      return this.createView(this.resourceModel, this.stableId, "", this.TemplateConverter, this.MetaModelConverter).then(function () {
        oComponent.getUIArea().invalidate();
        return;
      }).catch(function (oError) {
        oComponent.getUIArea().invalidate();
        Log.error(oError);
      });
    };
    _proto._getViewSettings = function _getViewSettings(preprocessorContext, mServiceSettings, oComponent, mViewData, sCacheKey, oPageModel, oResourceModel) {
      let viewType = mServiceSettings.viewType || oComponent.getViewType() || "XML";
      if (viewType !== "XML") {
        viewType = undefined;
      }
      return {
        type: viewType,
        preprocessors: {
          xml: preprocessorContext,
          controls: {}
        },
        id: mViewData.stableId,
        viewName: mServiceSettings.viewName || oComponent.getViewName?.(),
        viewData: mViewData,
        cache: {
          keys: [sCacheKey],
          additionalData: {
            // We store the page model data in the `additionalData` of the view cache, this way it is always in sync
            getAdditionalCacheData: () => {
              if (oPageModel.getData()?.filterConditions?.selectionVariant) {
                delete oPageModel.getData().filterConditions.selectionVariant;
              }
              return oPageModel.getData();
            },
            setAdditionalCacheData: value => {
              oPageModel.setData(value);
            }
          }
        },
        models: {
          "sap.fe.i18n": oResourceModel
        },
        height: "100%"
      };
    };
    _proto._createErrorPage = async function _createErrorPage(reason, oViewSettings, viewName, oComponent, sCacheKey) {
      // just replace the view name and a model containing the reason, but keep the other settings
      Log.error(reason.message, reason);
      oViewSettings.viewName = viewName;
      if (oViewSettings.preprocessors) {
        oViewSettings.preprocessors.xml.models["error"] = new JSONModel(reason);
      }
      delete oViewSettings.cache;
      oViewSettings.id += "-Error";
      oViewSettings.viewData.stableId += "-Error";
      delete oViewSettings.controller;
      return oComponent.runAsOwner(async () => {
        return View.create(oViewSettings).then(oView => {
          this.oView = oView;
          this.oView.setModel(new JSONModel(this.oView), "$view");
          oComponent.setAggregation("rootControl", this.oView);
          oComponent.getAppComponent().getRootControl().getController().getPlaceholder().hideRootPlaceholder();
          return sCacheKey;
        });
      });
    };
    _proto.createView = async function createView(oResourceModel, sStableId, sCacheKey, TemplateConverter, MetaModelConverter) {
      this.resourceModel = oResourceModel;
      this.stableId = sStableId;
      this.TemplateConverter = TemplateConverter;
      this.MetaModelConverter = MetaModelConverter;
      const oContext = this.getContext();
      const mServiceSettings = oContext.settings;
      const sConverterType = mServiceSettings.converterType;
      const oComponent = oContext.scopeObject;
      const oAppComponent = CommonUtils.getAppComponent(oComponent);
      let sFullContextPath = oAppComponent.getRoutingService().getTargetInformationFor(oComponent)?.options?.settings?.fullContextPath ?? "";
      if (!sFullContextPath) {
        // if the context path couldn't be retrieved from the routing service, try to get it from the component itself
        const componentContextPath = oComponent.getContextPath();
        if (componentContextPath) {
          sFullContextPath = componentContextPath.endsWith("/") ? componentContextPath : `${componentContextPath}/`;
        }
      }
      const oMetaModel = oAppComponent.getMetaModel();
      const oManifestContent = oAppComponent.getManifest();
      const oDeviceModel = new JSONModel(Device).setDefaultBindingMode("OneWay");
      const oManifestModel = new JSONModel(oManifestContent);
      let oPageModel, oViewDataModel, mViewData;
      // Load the index for the additional building blocks which is responsible for initializing them
      try {
        const oRoutingService = await oAppComponent.getService("routingService");
        const environmentCapabilities = await oAppComponent.getService("environmentCapabilities");
        // Retrieve the viewLevel for the component
        const oTargetInfo = oRoutingService.getTargetInformationFor(oComponent);
        const mOutbounds = oManifestContent["sap.app"] && oManifestContent["sap.app"].crossNavigation && oManifestContent["sap.app"].crossNavigation.outbounds || {};
        const mNavigation = oComponent.getNavigation() || {};
        const convertedMetadata = MetaModelConverter.convertTypes(oMetaModel, environmentCapabilities.getCapabilities());
        this._enhanceNavigationConfig(mNavigation, mOutbounds, convertedMetadata, sStableId);
        const definitionContext = new DefinitionContext(convertedMetadata);
        definitionContext.addApplicationManifest(oManifestContent);
        mViewData = {
          appComponent: oAppComponent,
          navigation: mNavigation,
          viewLevel: oTargetInfo?.viewLevel,
          stableId: sStableId,
          contentDensities: oManifestContent["sap.ui5"]?.contentDensities,
          resourceModel: oResourceModel,
          fullContextPath: sFullContextPath,
          isDesktop: Device.system.desktop,
          isPhone: Device.system.phone,
          converterType: TemplateType.FreeStylePage
        };
        if (oComponent.getViewData) {
          Object.assign(mViewData, oComponent.getViewData());
          mViewData = TemplatedViewServiceFactory.setPageConfigurationChanges(oManifestContent, mViewData, oAppComponent, this.pageId);
        }
        mViewData.isShareButtonVisibleForMyInbox = TemplatedViewServiceFactory.getShareButtonVisibilityForMyInbox(oAppComponent);
        const oShellServices = oAppComponent.getShellServices();
        mViewData.converterType = sConverterType;
        mViewData.shellContentDensity = oShellServices.getContentDensity();
        const sapfeManifestContent = oManifestContent["sap.fe"];
        mViewData.sapFeManifestConfiguration = oManifestContent["sap.fe"];
        mViewData.retrieveTextFromValueList = sapfeManifestContent?.form ? sapfeManifestContent?.form?.retrieveTextFromValueList : undefined;
        oViewDataModel = new JSONModel(mViewData);
        if (mViewData.controlConfiguration) {
          for (const sAnnotationPath in mViewData.controlConfiguration) {
            if (sAnnotationPath.includes("[")) {
              const sTargetAnnotationPath = resolveDynamicExpression(sAnnotationPath, oMetaModel);
              mViewData.controlConfiguration[sTargetAnnotationPath] = mViewData.controlConfiguration[sAnnotationPath];
            }
          }
        }
        oPageModel = new TemplateModel(() => {
          try {
            const oDiagnostics = oAppComponent.getDiagnostics();
            const iIssueCount = oDiagnostics.getIssues().length;
            const oConverterPageModel = TemplateConverter.convertPage(sConverterType, oMetaModel, mViewData, new ManifestWrapper(mViewData, oAppComponent), oDiagnostics, sFullContextPath, environmentCapabilities.getCapabilities(), oComponent);
            if (oConverterPageModel && oComponent._getControllerName()) {
              oConverterPageModel.controllerName = oComponent._getControllerName();
            }
            const aIssues = oDiagnostics.getIssues();
            const aAddedIssues = aIssues.slice(iIssueCount);
            if (aAddedIssues.length > 0) {
              Log.warning("Some issues have been detected in your project, please check the UI5 support assistant rule for sap.fe.core");
            }
            return oConverterPageModel;
          } catch (error) {
            Log.error(error, error);
            return {};
          }
        }, oMetaModel);
        const aSplitPath = sFullContextPath.split("/");
        const sEntitySetPath = this._getFullPathToEntitySet(aSplitPath, oMetaModel);
        const preprocessorContext = {
            bindingContexts: {
              entitySet: sEntitySetPath ? oMetaModel.createBindingContext(sEntitySetPath) : null,
              fullContextPath: sFullContextPath ? oMetaModel.createBindingContext(sFullContextPath) : null,
              contextPath: sFullContextPath ? oMetaModel.createBindingContext(sFullContextPath) : null,
              converterContext: oPageModel.createBindingContext("/", undefined, {
                noResolve: true
              }),
              viewData: mViewData ? oViewDataModel.createBindingContext("/") : null
            },
            models: {
              entitySet: oMetaModel,
              fullContextPath: oMetaModel,
              contextPath: oMetaModel,
              "sap.fe.i18n": oResourceModel,
              metaModel: oMetaModel,
              device: oDeviceModel,
              manifest: oManifestModel,
              converterContext: oPageModel,
              viewData: oViewDataModel
            },
            fullContextPath: sFullContextPath,
            getConvertedMetadata: () => convertedMetadata,
            getDefinitionContext() {
              return definitionContext;
            },
            getDefinitionForPage() {
              let fullContextPath = sFullContextPath;
              if (fullContextPath.endsWith("/")) {
                fullContextPath = fullContextPath.substring(0, fullContextPath.length - 1);
              }
              return definitionContext.getPageFor(fullContextPath);
            },
            appComponent: oAppComponent,
            viewId: sStableId
          },
          oViewSettings = this._getViewSettings(preprocessorContext, mServiceSettings, oComponent, mViewData, sCacheKey, oPageModel, oResourceModel);
        // Setting the pageModel on the component for potential reuse
        oComponent.setModel(oPageModel, "_pageModel");
        oComponent.setModel(oViewDataModel, "viewData");
        const uiModel = oAppComponent.getModel("ui");
        const internalModel = oAppComponent.getModel("internal");
        oComponent.setModel(uiModel, "ui");
        oComponent.setModel(internalModel, "internal");
        oComponent.setModel(internalModel, "pageInternal");
        const path = `/pages/${oViewSettings.id}`;
        uiModel.setProperty(path, {
          controls: {}
        });
        internalModel.setProperty(path, {
          controls: {},
          collaboration: {}
        });
        let targetUIModelContext = "/";
        if (oComponent.isA("sap.fe.templates.ListReport.Component")) {
          targetUIModelContext = `/${oViewSettings.id}`;
        }
        oComponent.setBindingContext(uiModel.createBindingContext(targetUIModelContext), "ui");
        oComponent.setBindingContext(internalModel.createBindingContext(path), "internal");

        // for the time being provide it also pageInternal as some macros access it - to be removed
        oComponent.setBindingContext(internalModel.createBindingContext(path), "pageInternal");
        oComponent.setPreprocessorContext(preprocessorContext);
        return oComponent.runAsOwner(async () => {
          return View.create(oViewSettings).then(oView => {
            this.oView = oView;
            // add custom data to the view for later retrieval of additional properties
            this.fetchAdditionalProperties(oComponent);
            const viewJSONModel = new JSONModel(this.oView);
            ModelHelper.enhanceViewJSONModel(viewJSONModel);
            oComponent.setModel(viewJSONModel, "$view");
            if (oAppComponent.hideViewDuringCreation && oComponent.isA("sap.fe.templates.ObjectPage.Component")) {
              this.oView.setVisible(false);
            }
            oComponent.setAggregation("rootControl", this.oView);
            if (oAppComponent.eagerViewCreation) {
              setTimeout(() => {
                for (const navName in mNavigation) {
                  const routingTargets = oAppComponent.getRoutingService()._getRouteInformation(mNavigation[navName].detail.route)?.targetsWithInfo;
                  if (routingTargets) {
                    for (const routingTarget of routingTargets) {
                      const routingTargetName = typeof routingTarget === "string" ? routingTarget : routingTarget.name;
                      const routerTarget = oAppComponent.getRouter().getTarget(routingTargetName);
                      if (routerTarget && !Array.isArray(routerTarget)) {
                        routerTarget.load(routingTarget);
                      }
                    }
                  }
                }
              }, 2000); // Delay a bit to not block the initial rendering
            }
            return sCacheKey;
          }).catch(async reason => {
            oComponent.getRootController()?.destroy();
            oComponent.setRootController();
            return this._createErrorPage(reason, oViewSettings, mServiceSettings.errorViewName || "sap.fe.core.services.view.TemplatingErrorPage", oComponent, sCacheKey);
          }).catch(e => Log.error(e.message, e));
        });
      } catch (error) {
        Log.error(error.message, error);
        throw new Error(`Error while creating view : ${error}`);
      }
    }

    /**
     * Fetches additional value properties defined in the page's manifest.json file and attaches them to the view as custom data.
     *
     * Resolves the data model object path from the preprocessor's `fullContextPath` binding context,
     * reads the `additionalProperties` list from the manifest.json file, validates each property path against the
     * entity type metadata, and attaches a {@link sap.ui.core.CustomData} element keyed
     * `"additionalValueProperties"` to the view. The custom data's `value` property is bound to a
     * composite binding that keeps the additional properties in sync at runtime.
     * @param component The template component providing access to the preprocessor context, manifest wrapper, and OData meta model.
     */;
    _proto.fetchAdditionalProperties = function fetchAdditionalProperties(component) {
      const fullContextPathBindingContext = component?.getPreprocessorContext()?.bindingContexts?.["fullContextPath"];
      if (fullContextPathBindingContext) {
        const manifestWrapper = component.getManifestWrapper();
        const additionalPropertiesFromManifest = manifestWrapper?.getAdditionalProperties();
        if (additionalPropertiesFromManifest?.length) {
          const metaModel = component.getMetaModel();
          const metaContext = metaModel ? metaModel.getMetaContext(fullContextPathBindingContext.getPath()) : fullContextPathBindingContext;
          const resolvedContext = convertMetaModelContext(metaContext);
          if (!resolvedContext) {
            return;
          }
          const dataModelObjectPath = getInvolvedDataModelObjects(metaContext);
          const view = this.getView();
          const validatedAdditionalPropertiesFromManifest = ModelHelper.getValidatedAdditionalProperties(dataModelObjectPath, additionalPropertiesFromManifest);
          if (validatedAdditionalPropertiesFromManifest?.length) {
            const customData = new CustomData({
              key: "additionalValueProperties"
            });
            view?.addDependent(customData);
            customData.bindProperty("value", {
              parts: validatedAdditionalPropertiesFromManifest.map(property => ({
                path: property
              })),
              formatter: () => {
                return null;
              }
            });
          }
        }
      }
    };
    _proto._enhanceNavigationConfig = function _enhanceNavigationConfig(mNavigation, mOutbounds, convertedTypes, stableId) {
      Object.keys(mNavigation).forEach(function (navigationObjectKey) {
        const navigationObject = mNavigation[navigationObjectKey];
        let outboundConfig;
        if (navigationObject.detail && navigationObject.detail.outbound && mOutbounds[navigationObject.detail.outbound]) {
          outboundConfig = mOutbounds[navigationObject.detail.outbound];
          navigationObject.detail.outboundDetail = {
            semanticObject: outboundConfig.semanticObject,
            action: outboundConfig.action,
            parameters: outboundConfig.parameters
          };
        }
        if (navigationObject.detail.availability) {
          registerVirtualProperty(convertedTypes, "routeNavigable-" + navigationObject.detail.route, () => {
            return resolveBindingString(navigationObject.detail.availability);
          }, stableId);
        }
        if (navigationObject.create && navigationObject.create.outbound && mOutbounds[navigationObject.create.outbound]) {
          outboundConfig = mOutbounds[navigationObject.create.outbound];
          navigationObject.create.outboundDetail = {
            semanticObject: outboundConfig.semanticObject,
            action: outboundConfig.action,
            parameters: outboundConfig.parameters
          };
        }
      });
    };
    _proto._getFullPathToEntitySet = function _getFullPathToEntitySet(aSplitPath, oMetaModel) {
      return aSplitPath.reduce(function (sPathSoFar, sNextPathPart) {
        if (sNextPathPart === "") {
          return sPathSoFar;
        }
        if (sPathSoFar === "") {
          sPathSoFar = `/${sNextPathPart}`;
        } else {
          const oTarget = oMetaModel.getObject(`${sPathSoFar}/$NavigationPropertyBinding/${sNextPathPart}`);
          if (oTarget && Object.keys(oTarget).length > 0) {
            sPathSoFar += "/$NavigationPropertyBinding";
          }
          sPathSoFar += `/${sNextPathPart}`;
        }
        return sPathSoFar;
      }, "");
    };
    _proto.getView = function getView() {
      return this.oView;
    };
    _proto.getInterface = function getInterface() {
      return this;
    };
    _proto.exit = function exit() {
      // Deregister global instance
      if (this.oResourceModelService) {
        this.oResourceModelService.destroy();
      }
      if (this.oCacheHandlerService) {
        this.oCacheHandlerService.destroy();
      }
      this.oFactory.removeGlobalInstance();
    };
    return TemplatedViewService;
  }(Service);
  _exports.TemplatedViewService = TemplatedViewService;
  let TemplatedViewServiceFactory = /*#__PURE__*/function (_ServiceFactory) {
    function TemplatedViewServiceFactory() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _ServiceFactory.call(this, ...args) || this;
      _this._oInstanceRegistry = {};
      return _this;
    }
    _exports.TemplatedViewServiceFactory = TemplatedViewServiceFactory;
    _inheritsLoose(TemplatedViewServiceFactory, _ServiceFactory);
    var _proto2 = TemplatedViewServiceFactory.prototype;
    _proto2.createInstance = async function createInstance(oServiceContext) {
      TemplatedViewServiceFactory.iCreatingViews++;
      const oTemplatedViewService = new TemplatedViewService(Object.assign({
        factory: this
      }, oServiceContext));
      return oTemplatedViewService.initPromise.then(function () {
        TemplatedViewServiceFactory.iCreatingViews--;
        return oTemplatedViewService;
      });
    };
    _proto2.removeGlobalInstance = function removeGlobalInstance() {
      this._oInstanceRegistry = {};
    }

    /**
     * This function checks if the component data specifies the visibility of the 'Share' button and returns true or false based on the visibility.
     * @param appComponent Specifies the app component
     * @returns Boolean value as true or false based whether the 'Share' button should be visible or not
     */;
    TemplatedViewServiceFactory.getShareButtonVisibilityForMyInbox = function getShareButtonVisibilityForMyInbox(appComponent) {
      const componentData = appComponent.getComponentData();
      if (componentData !== undefined && componentData.feEnvironment) {
        return componentData.feEnvironment.getShareControlVisibility();
      }
      return undefined;
    };
    TemplatedViewServiceFactory.getNumberOfViewsInCreationState = function getNumberOfViewsInCreationState() {
      return TemplatedViewServiceFactory.iCreatingViews;
    }

    /**
     * Sets page configuration changes for a specific page identified by its ID.
     * @param manifest The manifest content object containing configuration details.
     * @param viewData The view data object representing the current state of the view.
     * @param appComponent The application component instance.
     * @param pageId The unique identifier of the page for which configuration changes are to be applied.
     * @returns The updated view data object reflecting the applied changes.
     */;
    TemplatedViewServiceFactory.setPageConfigurationChanges = function setPageConfigurationChanges(manifest, viewData, appComponent, pageId) {
      const targets = manifest?.["sap.ui5"]?.routing?.targets ?? {};
      let realTarget = "";
      for (const targetToFind in targets) {
        if (targets[targetToFind].id === pageId) {
          realTarget = targetToFind;
          break;
        }
      }
      if (realTarget === "") {
        realTarget = pageId;
      }
      const actualSettings = manifest?.["sap.ui5"]?.routing?.targets?.[realTarget]?.options?.settings || {};
      return applyPageConfigurationChanges(actualSettings, viewData, appComponent, pageId);
    };
    return TemplatedViewServiceFactory;
  }(ServiceFactory);
  _exports.TemplatedViewServiceFactory = TemplatedViewServiceFactory;
  return _exports;
}, false);
//# sourceMappingURL=TemplatedViewServiceFactory-dbg.js.map
