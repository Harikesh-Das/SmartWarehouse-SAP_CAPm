/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/AppStateHandler", "sap/fe/core/controllerextensions/routing/RouterProxy", "sap/fe/core/helpers/HTTP503Handler", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/PromiseKeeper", "sap/fe/core/library", "sap/fe/core/manifestMerger/ChangePageConfiguration", "sap/fe/core/support/Diagnostics", "sap/fe/core/type/DynamicCurrency", "sap/m/routing/Router", "sap/ui/core/Lib", "sap/ui/core/UIComponent", "sap/ui/model/json/JSONModel", "sap/ui/model/odata/type/Currency", "sap/ui/model/odata/type/Unit", "./controllerextensions/BusyLocker", "./converters/MetaModelConverter", "./helpers/ResourceModelHelper"], function (Log, ClassSupport, AppStateHandler, RouterProxy, HTTP503Handler, ModelHelper, PromiseKeeper, library, ChangePageConfiguration, Diagnostics, _DynamicCurrency, Router, Library, UIComponent, JSONModel, _Currency, _Unit, BusyLocker, MetaModelConverter, ResourceModelHelper) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor, _AppComponent;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var deleteModelCacheData = MetaModelConverter.deleteModelCacheData;
  var changeConfiguration = ChangePageConfiguration.changeConfiguration;
  var implementInterface = ClassSupport.implementInterface;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Represents the additional configuration that can be provided by libraries.
   */

  const StartupMode = library.StartupMode;
  const NAVCONF = {
    FCL: {
      VIEWNAME: "sap.fe.core.rootView.Fcl",
      VIEWNAME_COMPATIBILITY: "sap.fe.templates.RootContainer.view.Fcl",
      ROUTERCLASS: "sap.f.routing.Router"
    },
    NAVCONTAINER: {
      VIEWNAME: "sap.fe.core.rootView.NavContainer",
      VIEWNAME_COMPATIBILITY: "sap.fe.templates.RootContainer.view.NavContainer",
      ROUTERCLASS: "sap.m.routing.Router"
    }
  };
  // Keep a reference so as to keep the import despite it not being directly used
  const _mRouter = Router;
  /**
   * Main class for components used for an application in SAP Fiori elements.
   *
   * Application developers using the templates and building blocks provided by SAP Fiori elements should create their apps by extending this component.
   * This ensures that all the necessary services that you need for the building blocks and templates to work are started.
   *
   * When you use sap.fe.core.AppComponent as the base component, you also need to use a rootView. SAP Fiori elements provides two options: <br/>
   * - sap.fe.core.rootView.NavContainer when using sap.m.routing.Router <br/>
   * - sap.fe.core.rootView.Fcl when using sap.f.routing.Router (FCL use case) <br/>
   * @hideconstructor
   * @public
   */
  let AppComponent = (_dec = defineUI5Class("sap.fe.core.AppComponent", {
    config: {
      fullWidth: true
    },
    manifest: {
      _version: "2.0.0",
      "sap.ui5": {
        services: {
          viewPreloaderService: {
            factoryName: "sap.fe.core.services.ViewPreloaderService",
            startup: "waitFor"
          },
          resourceModel: {
            factoryName: "sap.fe.core.services.ResourceModelService",
            startup: "waitFor",
            settings: {
              bundles: ["sap.fe.core.messagebundle"],
              modelName: "sap.fe.i18n"
            }
          },
          routingService: {
            factoryName: "sap.fe.core.services.RoutingService",
            startup: "waitFor"
          },
          shellServices: {
            factoryName: "sap.fe.core.services.ShellServices",
            startup: "waitFor"
          },
          ShellUIService: {
            factoryName: "sap.ushell.ui5service.ShellUIService"
          },
          navigationService: {
            factoryName: "sap.fe.core.services.NavigationService",
            startup: "waitFor"
          },
          environmentCapabilities: {
            factoryName: "sap.fe.core.services.EnvironmentService",
            startup: "waitFor"
          },
          sideEffectsService: {
            factoryName: "sap.fe.core.services.SideEffectsService",
            startup: "waitFor"
          },
          asyncComponentService: {
            factoryName: "sap.fe.core.services.AsyncComponentService",
            startup: "waitFor"
          },
          collaborationManagerService: {
            factoryName: "sap.fe.core.services.CollaborationManagerService",
            startup: "waitFor"
          },
          collaborativeToolsService: {
            factoryName: "sap.fe.core.services.CollaborativeToolsService",
            startup: "waitFor"
          },
          telemetryService: {
            factoryName: "sap.fe.core.services.TelemetryService",
            startup: "waitFor"
          },
          valueHelpHistoryService: {
            factoryName: "sap.fe.core.services.ValueHelpHistoryService",
            startup: "waitFor"
          },
          CollaborativeDraftService: {
            factoryName: "sap.fe.core.services.CollaborativeDraftService",
            startup: "waitFor"
          },
          ContextSharingService: {
            factoryName: "sap.fe.core.services.ContextSharingService",
            startup: "waitFor"
          },
          inlineEditService: {
            factoryName: "sap.fe.core.services.InlineEditService",
            startup: "waitFor"
          }
        },
        rootView: {
          viewName: NAVCONF.NAVCONTAINER.VIEWNAME,
          id: "appRootView"
        },
        routing: {
          config: {
            controlId: "appContent",
            routerClass: NAVCONF.NAVCONTAINER.ROUTERCLASS,
            viewType: "XML",
            controlAggregation: "pages",
            containerOptions: {
              propagateModel: true
            }
          }
        }
      }
    },
    designtime: "sap/fe/core/designtime/AppComponent.designtime",
    library: "sap.fe.core"
  }), _dec2 = implementInterface("sap.ui.core.IAsyncContentCreation"), _dec(_class = (_class2 = (_AppComponent = /*#__PURE__*/function (_UIComponent) {
    function AppComponent() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _UIComponent.call(this, ...args) || this;
      _initializerDefineProperty(_this, "__implements__sap_ui_core_IAsyncContentCreation", _descriptor, _this);
      /**
       * The additional configuration for the application.
       * @private
       */
      _this.additionalConfiguration = {};
      _this.startupMode = StartupMode.Normal;
      _this.delayTime = 100;
      _this.delayMetadataCheck = false;
      _this._startedServices = [];
      _this.isAdaptationEnabled = false;
      _this.isExiting = false;
      _this.pageConfigurationChanges = {};
      _this.suspended = false;
      /**
       * Status of the preferred action execution to prevent duplicate triggering.
       * - NotSet: Initial state, no preferred action has been evaluated
       * - CanPerform: Preferred action can be performed (conditions are met)
       * - AlreadyPerformed: Preferred action has been executed and should not be triggered again
       */
      _this.preferredActionStatus = library.PreferredActionStatusType.NotSet;
      return _this;
    }
    _inheritsLoose(AppComponent, _UIComponent);
    var _proto = AppComponent.prototype;
    /**
     * Gets the additional configuration for the application.
     * @returns The additional configuration
     */
    _proto.getAdditionalConfiguration = function getAdditionalConfiguration() {
      return this.additionalConfiguration;
    }

    /**
     * Registered handlers for modifying additional configuration.
     */;
    /**
     * Gets the current status of the preferred action.
     * @returns The current preferred action status
     */
    _proto.getPreferredActionStatus = function getPreferredActionStatus() {
      return this.preferredActionStatus;
    }

    /**
     * Sets the status of the preferred action.
     * @param status The new status to set
     */;
    _proto.setPreferredActionStatus = function setPreferredActionStatus(status) {
      this.preferredActionStatus = status;
    }

    /**
     * Singleton to hold processes from libraries that need to be run for every instance prior to startup.
     */;
    _proto._isFclEnabled = function _isFclEnabled() {
      const oManifestUI5 = this.getManifestEntry("sap.ui5");
      return oManifestUI5?.routing?.config?.routerClass === NAVCONF.FCL.ROUTERCLASS;
    };
    _proto.setAdaptationMode = function setAdaptationMode(isAdaptationEnabled) {
      this.isAdaptationEnabled = isAdaptationEnabled;
    };
    _proto.isAdaptationMode = function isAdaptationMode() {
      return this.isAdaptationEnabled;
    }

    /**
     * Register a handler for modifying additional configuration.
     * The handler will be called before feature toggles are initialized.
     * @param handler The handler function that will modify the additional configuration
     */;
    AppComponent.registerConfigurationHandlers = function registerConfigurationHandlers(handler) {
      this.configurationHandlers.push(handler);
    }

    /**
     * Provides a hook to initialize feature toggles.
     *
     * This hook is being called by the SAP Fiori elements AppComponent at the time feature toggles can be initialized.
     * To change page configuration, use the {@link sap.fe.core.AppComponent#changePageConfiguration} method.
     * @public
     * @returns A promise without any value to allow asynchronous processes
     */;
    _proto.initializeFeatureToggles = async function initializeFeatureToggles() {
      // this method can be overridden by applications
      return Promise.resolve();
    }

    /**
     * Changes the page configuration of SAP Fiori elements.
     *
     * This method enables you to change the page configuration of SAP Fiori elements.
     * @param pageId The ID of the page for which the configuration is to be changed.
     * @param path The path in the page settings for which the configuration is to be changed.
     * @param value The new value of the configuration. This could be a plain value like a string, or a Boolean, or a structured object.
     * @public
     */;
    _proto.changePageConfiguration = function changePageConfiguration(pageId, path, value) {
      const manifest = changeConfiguration(this.getManifest(), pageId, path, value, true, this);
      if (path === "app/disableInputAssistance" && manifest?.["sap.fe"]?.["app"]?.["disableInputAssistance"] === value) {
        this.getEnvironmentCapabilities().setCapability("DisableInputAssistance", value);
      }
    }

    /**
     * Cleans all registered page configuration changes.
     */;
    _proto.cleanPageConfigurationChanges = function cleanPageConfigurationChanges() {
      this.pageConfigurationChanges = {};
    }

    /**
     * Get a reference to the RouterProxy.
     * @returns A Reference to the RouterProxy
     * @final
     */;
    _proto.getRouterProxy = function getRouterProxy() {
      return this._oRouterProxy;
    }

    /**
     * Get a reference to the AppStateHandler.
     * @returns A reference to the AppStateHandler
     * @final
     */;
    _proto.getAppStateHandler = function getAppStateHandler() {
      return this._oAppStateHandler;
    }

    /**
     * Get a reference to the nav/FCL Controller.
     * @returns  A reference to the FCL Controller
     * @final
     */;
    _proto.getRootViewController = function getRootViewController() {
      return this.getRootControl().getController();
    }

    /**
     * Get the NavContainer control or the FCL control.
     * @returns  A reference to NavContainer control or the FCL control
     * @final
     */;
    _proto.getRootContainer = function getRootContainer() {
      return this.getRootControl().getContent()[0];
    }

    /**
     * Get the startup mode of the app.
     * @returns The startup mode
     */;
    _proto.getStartupMode = function getStartupMode() {
      return this.startupMode;
    }

    /**
     * Set the startup mode for the app to 'Create'.
     *
     */;
    _proto.setStartupModeCreate = function setStartupModeCreate() {
      this.startupMode = StartupMode.Create;
    }

    /**
     * Set the startup mode for the app to 'AutoCreate'.
     *
     */;
    _proto.setStartupModeAutoCreate = function setStartupModeAutoCreate() {
      this.startupMode = StartupMode.AutoCreate;
    }

    /**
     * Set the startup mode for the app to 'Deeplink'.
     *
     */;
    _proto.setStartupModeDeeplink = function setStartupModeDeeplink() {
      this.startupMode = StartupMode.Deeplink;
    };
    _proto.init = function init() {
      this.oComponentData ??= {};
      const params = new URLSearchParams(window.location.search);
      if (params.has("sap-ui-xx-fe-support")) {
        setTimeout(function () {
          Library.load({
            name: "sap.fe.tools"
          });
        }, 2000);
      }
      if (params.has("sap-ui-xx-fe-eager-view")) {
        this.eagerViewCreation = true;
      }
      if (params.has("sap-ui-xx-fe-hide-view")) {
        this.hideViewDuringCreation = true;
      }
      if (params.has("sap-ui-xx-fe-field-opt")) {
        // STABLE-ISH
        this.delayMetadataCheck = true;
      }
      if (params.has("sap-ui-xx-fe-delay")) {
        // STABLE
        this.delayTime = parseInt(params.get("sap-ui-xx-fe-delay"), 10);
      }
      if (params.has("sap-ui-xx-fe-fcl-opt")) {
        // STABLE
        this.delayFcl = true;
      }
      this._initializedKeeper = new PromiseKeeper();
      this.initialized = this._initializedKeeper.promise;
      const uiModel = new JSONModel({
        editMode: library.EditMode.Display,
        isEditable: false,
        draftStatus: library.DraftStatus.Clear,
        busy: false,
        busyLocal: {},
        pages: {}
      });
      const oInternalModel = new JSONModel({
        pages: {}
      });
      // set the binding OneWay for uiModel to prevent changes if controller extensions modify a bound property of a control
      uiModel.setDefaultBindingMode("OneWay");
      // for internal model binding needs to be two way
      ModelHelper.enhanceUiJSONModel(uiModel, library);
      ModelHelper.enhanceInternalJSONModel(oInternalModel);
      this.setModel(uiModel, "ui");
      this.setModel(oInternalModel, "internal");
      this.bInitializeRouting = this.bInitializeRouting !== undefined ? this.bInitializeRouting : true;
      this._oRouterProxy = new RouterProxy();
      this._oAppStateHandler = new AppStateHandler(this);
      this._oDiagnostics = new Diagnostics();
      const oModel = this.getModel();
      if (oModel?.isA?.("sap.ui.model.odata.v4.ODataModel")) {
        ModelHelper.enhanceODataModel(oModel, this);
        oModel.setRetryAfterHandler(this.http503RetryHandler.bind(this));
        this.metaModel = oModel.getMetaModel();
        this.entityContainer = this.metaModel.requestObject("/$EntityContainer/");
      } else {
        // not an OData v4 service
        this.entityContainer = Promise.resolve();
      }
      if (this.getManifestEntry("sap.fe")?.app?.disableCollaborationDraft) {
        // disable the collaboration draft globally in case private manifest flag is set
        // this allows customers to disable the collaboration draft in case we run into issues with the first delivery
        // this will be removed with the next S/4 release
        ModelHelper.disableCollaborationDraft = true;
      }
      const oManifestUI5 = this.getManifest()["sap.ui5"];
      this.checkRoutingConfiguration(oManifestUI5);
      AppComponent._customManifestChecks.forEach(fnProcess => {
        return fnProcess.call(this, oManifestUI5);
      });
      this.preloadLibraries(oManifestUI5);

      // the init function configures the routing according to the settings above
      // it will call the createContent function to instantiate the RootView and add it to the UIComponent aggregations

      _UIComponent.prototype.init.call(this);
      AppComponent.instanceMap[this.getId()] = this;
    };
    _proto.http503RetryHandler = async function http503RetryHandler(error) {
      return HTTP503Handler.handle503Delay(error, this.getRootControl(), getResourceModel(this));
    };
    _proto.preloadLibraries = function preloadLibraries(oManifestUI5) {
      for (const targetsKey in oManifestUI5.routing?.targets) {
        if (oManifestUI5.routing?.targets[targetsKey].name === "sap.fe.templates.ObjectPage") {
          Library.load({
            name: "sap.uxap"
          }); // fire and forget
        }
        const settings = JSON.stringify(oManifestUI5.routing?.targets[targetsKey]?.options?.settings?.controlConfiguration);
        if (settings?.includes("GridTable") || settings?.includes("TreeTable")) {
          Library.load({
            name: "sap.ui.table"
          }); // fire and forget
        }
      }
    };
    _proto.checkRoutingConfiguration = function checkRoutingConfiguration(oManifestUI5) {
      if (oManifestUI5?.rootView?.viewName) {
        // The application specified an own root view in the manifest

        // Root View was moved from sap.fe.templates to sap.fe.core - keep it compatible
        if (oManifestUI5.rootView.viewName === NAVCONF.FCL.VIEWNAME_COMPATIBILITY) {
          oManifestUI5.rootView.viewName = NAVCONF.FCL.VIEWNAME;
        } else if (oManifestUI5.rootView.viewName === NAVCONF.NAVCONTAINER.VIEWNAME_COMPATIBILITY) {
          oManifestUI5.rootView.viewName = NAVCONF.NAVCONTAINER.VIEWNAME;
        }
        if (oManifestUI5.rootView.viewName === NAVCONF.FCL.VIEWNAME && oManifestUI5.routing?.config?.routerClass === NAVCONF.FCL.ROUTERCLASS) {
          Log.info(`Rootcontainer: "${NAVCONF.FCL.VIEWNAME}" - Routerclass: "${NAVCONF.FCL.ROUTERCLASS}"`);
        } else if (oManifestUI5.rootView.viewName === NAVCONF.NAVCONTAINER.VIEWNAME && oManifestUI5.routing?.config?.routerClass === NAVCONF.NAVCONTAINER.ROUTERCLASS) {
          Log.info(`Rootcontainer: "${NAVCONF.NAVCONTAINER.VIEWNAME}" - Routerclass: "${NAVCONF.NAVCONTAINER.ROUTERCLASS}"`);
        } else if (oManifestUI5.rootView?.viewName?.includes("sap.fe.core.rootView")) {
          throw Error(`\nWrong configuration for the couple (rootView/routerClass) in manifest file.\n` + `Current values are :(${oManifestUI5.rootView.viewName}/${oManifestUI5.routing?.config?.routerClass || "<missing router class>"})\n` + `Expected values are \n` + `\t - (${NAVCONF.NAVCONTAINER.VIEWNAME}/${NAVCONF.NAVCONTAINER.ROUTERCLASS})\n` + `\t - (${NAVCONF.FCL.VIEWNAME}/${NAVCONF.FCL.ROUTERCLASS})`);
        } else {
          Log.info(`Rootcontainer: "${oManifestUI5.rootView.viewName}" - Routerclass: "${NAVCONF.NAVCONTAINER.ROUTERCLASS}"`);
        }
      }
    };
    _proto.onServicesStarted = async function onServicesStarted(allServices) {
      this._startedServices = allServices;
      // Execute all registered configuration handlers
      await Promise.all(AppComponent.configurationHandlers.map(async handler => handler(this.additionalConfiguration)));
      await this.initializeFeatureToggles();
      await Promise.allSettled(AppComponent.instanceDependentProcesses.map(async fnProcess => {
        return fnProcess.call(null, this);
      }));

      //router must be started once the rootcontainer is initialized
      //starting of the router
      const finalizedRoutingInitialization = () => {
        this.entityContainer.then(async () => {
          // Preload currencyCodes and UoM if they exists
          this.getMetaModel().requestCodeList?.("CurrencyCodes");
          this.getMetaModel().requestCodeList?.("UnitOfMeasures");
          if (this.getRootViewController().attachRouteMatchers) {
            this.getRootViewController().attachRouteMatchers();
          }
          this.getRouter().initialize();
          this.getRouterProxy().init(this, this._isFclEnabled());
          return this.getValueHelpHistoryService().registerShellHook();
        }).catch(error => {
          const oResourceBundle = Library.getResourceBundleFor("sap.fe.core");
          this.getRootViewController().displayErrorPage(oResourceBundle.getText("C_APP_COMPONENT_SAPFE_APPSTART_TECHNICAL_ISSUES"), {
            title: oResourceBundle.getText("C_COMMON_SAPFE_ERROR"),
            description: error.message
          });
        });
      };
      if (this.bInitializeRouting) {
        return this.getRoutingService().initializeRouting().then(() => {
          if (this.getRootViewController()) {
            finalizedRoutingInitialization();
          } else {
            this.getRootControl().attachAfterInit(function () {
              finalizedRoutingInitialization();
            });
          }
          this._initializedKeeper.resolve();
          return;
        }).catch(function (err) {
          Log.error(`cannot cannot initialize routing: ${err.toString()}`);
        });
      } else {
        this._initializedKeeper.resolve();
      }
    };
    _proto.exit = function exit() {
      this._startedServices = [];
      this._oAppStateHandler.destroy();
      this._oRouterProxy.destroy();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete this._oAppStateHandler;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete this._oRouterProxy;
      deleteModelCacheData(this.metaModel);
      this.getModel("ui").destroy();
      this.cleanPageConfigurationChanges();
    };
    _proto.getMetaModel = function getMetaModel() {
      return this.getModel().getMetaModel();
    };
    _proto.getDiagnostics = function getDiagnostics() {
      return this._oDiagnostics;
    };
    _proto.destroy = function destroy(bSuppressInvalidate) {
      this.isExiting = true;

      // LEAKS, with workaround for some Flex / MDC issue
      try {
        delete AppComponent.instanceMap[this.getId()];

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        delete window._routing;
      } catch (e) {
        Log.info(e);
      }

      //WORKAROUND for sticky discard request : due to async callback, request triggered by the exitApplication will be send after the UIComponent.prototype.destroy
      //so we need to copy the Requestor headers as it will be destroy

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const oMainModel = this.oModels[undefined];
      let oHeaders;
      if (oMainModel?.oRequestor) {
        oHeaders = Object.assign({}, oMainModel.oRequestor.mHeaders);
      }

      // As we need to cleanup the application / handle the dirty object we need to call our cleanup before the models are destroyed
      this.getRoutingService()?.beforeExit?.();
      _UIComponent.prototype.destroy.call(this, bSuppressInvalidate);
      if (oHeaders && oMainModel.oRequestor) {
        oMainModel.oRequestor.mHeaders = oHeaders;
      }
    };
    _proto.getRoutingService = function getRoutingService() {
      return {}; // overriden at runtime
    };
    _proto.getShellServices = function getShellServices() {
      return {}; // overriden at runtime
    };
    _proto.getNavigationService = function getNavigationService() {
      return {}; // overriden at runtime
    };
    _proto.getSideEffectsService = function getSideEffectsService() {
      return {};
    };
    _proto.getEnvironmentCapabilities = function getEnvironmentCapabilities() {
      return {};
    };
    _proto.getCollaborationManagerService = function getCollaborationManagerService() {
      return {};
    };
    _proto.getViewPreloaderService = function getViewPreloaderService() {
      return {};
    };
    _proto.getCollaborativeToolsService = function getCollaborativeToolsService() {
      return {};
    };
    _proto.getCollaborativeDraftService = function getCollaborativeDraftService() {
      return {};
    };
    _proto.getContextSharingService = function getContextSharingService() {
      return {};
    };
    _proto.getTelemetryService = function getTelemetryService() {
      return {};
    };
    _proto.getValueHelpHistoryService = function getValueHelpHistoryService() {
      return {};
    };
    _proto.getInlineEditService = function getInlineEditService() {
      return {};
    };
    _proto.getStartupParameters = async function getStartupParameters() {
      const startupParams = this.getComponentData()?.startupParameters;
      if (startupParams?.preferredAction?.[0].includes("summary") && this.getPreferredActionStatus() === library.PreferredActionStatusType.NotSet) {
        this.setPreferredActionStatus(library.PreferredActionStatusType.CanPerform);
      }
      return startupParams ?? {};
    };
    _proto.restore = function restore() {
      // called by FLP when app sap-keep-alive is enabled and app is restored
      for (const startedService of this._startedServices) {
        startedService.onRestore?.();
      }
      this.getRootViewController().viewState.onRestore();

      // Reset all values in versionActivationStatus to false
      AppStateHandler.resetVersionActivationStatus();
      this.suspended = false;
    };
    _proto.suspend = function suspend() {
      // called by FLP when app sap-keep-alive is enabled and app is suspended
      for (const startedService of this._startedServices) {
        startedService.onSuspend?.();
      }
      this.getRootViewController().viewState.onSuspend();
      this.suspended = true;
    };
    _proto.isSuspended = function isSuspended() {
      return this.suspended;
    }

    /**
     * navigateBasedOnStartupParameter function is a public api that acts as a wrapper to _manageDeepLinkStartup function. It passes the startup parameters further to _manageDeepLinkStartup function
     * @param startupParameters Defines the startup parameters which is further passed to _manageDeepLinkStartup function.
     */;
    _proto.navigateBasedOnStartupParameter = async function navigateBasedOnStartupParameter(startupParameters) {
      try {
        if (!BusyLocker.isLocked(this.getModel("ui"))) {
          if (!startupParameters) {
            startupParameters = null;
          }
          const routingService = this.getRoutingService();
          await routingService._manageDeepLinkStartup(startupParameters);
        }
      } catch (exception) {
        Log.error(exception);
        BusyLocker.unlock(this.getModel("ui"));
      }
    }

    /**
     * Used to allow disabling the Collaboration Manager integration for the OVP use case.
     * @returns Whether the collaboration manager service is active.
     */;
    _proto.isCollaborationManagerServiceEnabled = function isCollaborationManagerServiceEnabled() {
      return !this.isUsedAsBuildingBlockContext();
    }

    /**
     * Register processes that need to be run for every instance prior to startup.
     * @param fnProcess Function that hold the implementation of the process.
     *
     * The registered process can be an asynchronous process.
     * It shall be called with the AppComponent instance as a parameter before startup.
     */;
    AppComponent.registerInstanceDependentProcessForStartUp = function registerInstanceDependentProcessForStartUp(fnProcess) {
      this.instanceDependentProcesses.push(fnProcess);
    }

    /**
     * Registers custom initialization checks that are run before the component is initialized.
     * This is useful for running checks that are specific to a library.
     * These checks are run before the component is initialized and before the manifest is merged.
     * @param fnProcess
     */;
    AppComponent.registerInitChecks = function registerInitChecks(fnProcess) {
      this._customManifestChecks.push(fnProcess);
    }

    /**
     * Checks if the component is embedded in another application.
     * This is determined by checking if the component data contains a `feEnvironment` object.
     * This is set when the component is embedded in My Inbox.
     * @returns True if the component is embedded, false otherwise.
     */;
    _proto._isEmbedded = function _isEmbedded() {
      return !!this.getComponentData()?.feEnvironment;
    }

    /**
     * Checks if the application is used as a container for building block instantiation by a building block context.
     * This is determined by checking the manifest entry `sap.fe.app.isBuildingBlockContext`.
     * @returns True if the application is used for creating a BuildingBlockContext, false otherwise.
     */;
    _proto.isUsedAsBuildingBlockContext = function isUsedAsBuildingBlockContext() {
      return this.getManifestEntry("sap.fe")?.app?.isBuildingBlockContext === true;
    };
    return AppComponent;
  }(UIComponent), _AppComponent.instanceMap = {}, _AppComponent.configurationHandlers = [], _AppComponent.instanceDependentProcesses = [], _AppComponent._customManifestChecks = [], _AppComponent), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_ui_core_IAsyncContentCreation", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _class2)) || _class); // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return AppComponent;
}, false);
//# sourceMappingURL=AppComponent-dbg.js.map
