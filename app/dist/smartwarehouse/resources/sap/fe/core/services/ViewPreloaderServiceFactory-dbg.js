/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ViewPreloaderCache", "sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory", "../helpers/RoutingHelper"], function (ViewPreloaderCache, Service, ServiceFactory, RoutingHelpler) {
  "use strict";

  var _exports = {};
  var viewPreloaderCache = ViewPreloaderCache.viewPreloaderCache;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let ViewPreloaderService = /*#__PURE__*/function (_Service) {
    function ViewPreloaderService() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _Service.call(this, ...args) || this;
      _this.newViews = [];
      return _this;
    }
    _exports.ViewPreloaderService = ViewPreloaderService;
    _inheritsLoose(ViewPreloaderService, _Service);
    var _proto = ViewPreloaderService.prototype;
    _proto.init = function init() {
      this.initPromise = new Promise(resolve => {
        this.appComponent = this.getContext().scopeObject;
        resolve(this);
      });
    }

    /**
     * Sets the cache for the current route.
     * @param routeConfig The route configuration.
     * @param routeArguments The route arguments.
     * @param appComponent
     */;
    _proto.setCache = function setCache(routeConfig, routeArguments, appComponent) {
      const bindingPattern = routeConfig.pattern;
      const {
        path
      } = RoutingHelpler.buildBindingPath(routeArguments, bindingPattern, {});
      const isCacheReady = [];
      let targetConfig = routeConfig.target;
      targetConfig = Array.isArray(targetConfig) ? targetConfig : [targetConfig];
      targetConfig.forEach(targetName => {
        const model = appComponent.getModel();
        this.setCurrentCacheEntryByTargetName(targetName);
        const currentCacheentry = viewPreloaderCache.getCurrentCacheEntry();
        if (currentCacheentry.visitedContextPath?.startsWith(path)) {
          isCacheReady.push(Promise.resolve());
          return;
        }
        isCacheReady.push(new Promise(async resolve => {
          const manifestContent = appComponent.getManifest();
          let shouldRefreshView = false;
          const pageLevelRequestPromises = manifestContent["sap.ui5"]["routing"]?.["targets"]?.[targetName]?.["options"]?.["settings"]?.preloadConfigurationProperties?.map(async sPath => {
            const record = {};
            const value = await this.requestPropertyOrSingleton(sPath, model, path);
            shouldRefreshView = currentCacheentry.values?.[sPath] !== value ? true : shouldRefreshView;
            record[sPath] = value;
            return record;
          }) ?? [];

          // all promises are resolved and the results are merged into a single object
          const aResults = (await Promise.all(pageLevelRequestPromises)).reduce((acc, curr) => {
            const key = Object.keys(curr)[0];
            acc[key] = curr[key];
            return acc;
          }, {});
          shouldRefreshView = !currentCacheentry.visitedContextPath ? false : shouldRefreshView; //if first page loading, the refreshing of the view is not needed
          currentCacheentry.visitedContextPath = path;
          currentCacheentry.values = aResults;
          currentCacheentry.viewShouldbeRefreshed = shouldRefreshView;
          resolve();
        }));
      });
      this.setCacheReady(Promise.all(isCacheReady));
    }

    /**
     * Requests a property or singleton value from the model.
     * If the property is not bound, it binds it and requests its value.
     * @param propOrSingletonPath The path to the property or singleton.
     * @param model The OData model.
     * @param pageBindingPath The binding path of the page.
     * @returns The value of the property or singleton.
     */;
    _proto.requestPropertyOrSingleton = async function requestPropertyOrSingleton(propOrSingletonPath, model, pageBindingPath) {
      const isSingleton = propOrSingletonPath.startsWith("/"); // if starts with /, it is a singletonasync
      const [__, entity, property] = [.../(?:(.*)\/){0,1}([^/]*)/.exec(propOrSingletonPath)];
      // eg: /Products/ID -> entity: Products, property: ID
      // eg: status -> entity: undefined, property: status

      const contextPath = isSingleton ? entity : pageBindingPath;
      let value;

      // we check first if the property is already bound in order to use its cached value
      // otherwise we bind the property and request its value
      const bindingProperty = model.getAllBindings().find(binding => binding.getContext()?.getPath() === contextPath && binding.getPath() === property);
      value = bindingProperty?.getValue();
      if (!value) {
        value = await model.bindProperty(`${contextPath}/${property}`).requestValue();
      }
      return value;
    };
    /**
     *  Sets the cache ready state.
     * @param isReady
     */
    _proto.setCacheReady = function setCacheReady(isReady) {
      this.cacheReady = isReady;
    }

    /**
     * Returns the cache ready state.
     * @returns The cache ready state.
     */;
    _proto.isCacheReady = async function isCacheReady() {
      await this.cacheReady;
      return true;
    }

    /**
     * Returns the current cache entry for the app component.
     * @returns  The current cache entry for the app component.
     */;
    _proto.getCurrentCacheEntry = function getCurrentCacheEntry() {
      return viewPreloaderCache.getCurrentCacheEntry();
    }

    /**
     *Returns the full cache object, which contains all application level caches.
     * @param targetName
     * @returns The full cache object for the app component.
     */;
    _proto.getCacheEntryByTargetName = function getCacheEntryByTargetName(targetName) {
      return viewPreloaderCache.getCacheEntryByTargetName(targetName, this.appComponent);
    }

    /**
     * Sets the current cache entry by the target name.
     * If the target name does not exist, it creates a new cache entry and adds it to the full cache.
     * @param targetName
     */;
    _proto.setCurrentCacheEntryByTargetName = function setCurrentCacheEntryByTargetName(targetName) {
      const cacheEntry = this.getCacheEntryByTargetName(targetName) ?? {
        values: {}
      };
      viewPreloaderCache.addEntryToCache(cacheEntry, targetName, this.appComponent);
    };
    return ViewPreloaderService;
  }(Service);
  _exports.ViewPreloaderService = ViewPreloaderService;
  let ViewPreloaderServiceFactory = /*#__PURE__*/function (_ServiceFactory) {
    function ViewPreloaderServiceFactory() {
      return _ServiceFactory.apply(this, arguments) || this;
    }
    _exports.ViewPreloaderServiceFactory = ViewPreloaderServiceFactory;
    _inheritsLoose(ViewPreloaderServiceFactory, _ServiceFactory);
    var _proto2 = ViewPreloaderServiceFactory.prototype;
    _proto2.createInstance = async function createInstance(oServiceContext) {
      this.instance = new ViewPreloaderService(oServiceContext);
      return this.instance.initPromise;
    };
    _proto2.getInstance = function getInstance() {
      return this.instance;
    };
    return ViewPreloaderServiceFactory;
  }(ServiceFactory);
  _exports.ViewPreloaderServiceFactory = ViewPreloaderServiceFactory;
  return _exports;
}, false);
//# sourceMappingURL=ViewPreloaderServiceFactory-dbg.js.map
