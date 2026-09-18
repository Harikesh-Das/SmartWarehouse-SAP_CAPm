import type { Route } from "@ui5/manifest/types/manifest";
import type { PageLevelCache } from "sap/fe/base/ViewPreloaderCache";
import { viewPreloaderCache } from "sap/fe/base/ViewPreloaderCache";
import Service from "sap/ui/core/service/Service";
import ServiceFactory from "sap/ui/core/service/ServiceFactory";
import type ODataPropertyBinding from "sap/ui/model/odata/ODataPropertyBinding";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type { ServiceContext } from "types/metamodel_types";
import type AppComponent from "../AppComponent";
import RoutingHelpler from "../helpers/RoutingHelper";

export class ViewPreloaderService extends Service<{}> {
	initPromise!: Promise<ViewPreloaderService>;

	private appComponent!: AppComponent;

	private cacheReady: Promise<void[]> | undefined;

	init(): void {
		this.initPromise = new Promise((resolve) => {
			this.appComponent = this.getContext().scopeObject as AppComponent;
			resolve(this);
		});
	}

	/**
	 * Sets the cache for the current route.
	 * @param routeConfig The route configuration.
	 * @param routeArguments The route arguments.
	 * @param appComponent
	 */
	setCache(routeConfig: Route, routeArguments: Record<string, string | object>, appComponent: AppComponent): void {
		const bindingPattern = routeConfig.pattern as string;
		const { path } = RoutingHelpler.buildBindingPath(routeArguments, bindingPattern, {});
		const isCacheReady: Promise<void>[] = [];
		let targetConfig = routeConfig.target as string | string[];
		targetConfig = Array.isArray(targetConfig) ? targetConfig : [targetConfig];

		targetConfig.forEach((targetName: string) => {
			const model = appComponent.getModel();

			this.setCurrentCacheEntryByTargetName(targetName);
			const currentCacheentry = viewPreloaderCache.getCurrentCacheEntry();

			if (currentCacheentry.visitedContextPath?.startsWith(path)) {
				isCacheReady.push(Promise.resolve());
				return;
			}
			isCacheReady.push(
				new Promise<void>(async (resolve) => {
					const manifestContent = appComponent.getManifest();
					let shouldRefreshView = false;
					const pageLevelRequestPromises =
						manifestContent["sap.ui5"]["routing"]?.["targets"]?.[targetName]?.["options"]?.[
							"settings"
						]?.preloadConfigurationProperties?.map(async (sPath: string) => {
							const record = {} as Record<string, unknown>;
							const value = await this.requestPropertyOrSingleton(sPath, model, path);
							shouldRefreshView = currentCacheentry.values?.[sPath] !== value ? true : shouldRefreshView;
							record[sPath] = value;
							return record;
						}) ?? [];

					// all promises are resolved and the results are merged into a single object
					const aResults = (await Promise.all(pageLevelRequestPromises)).reduce(
						(acc, curr) => {
							const key = Object.keys(curr)[0];
							acc[key] = curr[key];
							return acc;
						},
						{} as Record<string, unknown>
					);

					shouldRefreshView = !currentCacheentry.visitedContextPath ? false : shouldRefreshView; //if first page loading, the refreshing of the view is not needed
					currentCacheentry.visitedContextPath = path;
					currentCacheentry.values = aResults;
					currentCacheentry.viewShouldbeRefreshed = shouldRefreshView;
					resolve();
				})
			);
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
	 */
	async requestPropertyOrSingleton(propOrSingletonPath: string, model: ODataModel, pageBindingPath: string): Promise<unknown> {
		const isSingleton = propOrSingletonPath.startsWith("/"); // if starts with /, it is a singletonasync
		const [__, entity, property] = [...(/(?:(.*)\/){0,1}([^/]*)/.exec(propOrSingletonPath) as string[])];
		// eg: /Products/ID -> entity: Products, property: ID
		// eg: status -> entity: undefined, property: status

		const contextPath = isSingleton ? entity : pageBindingPath;
		let value: unknown;

		// we check first if the property is already bound in order to use its cached value
		// otherwise we bind the property and request its value
		const bindingProperty = model
			.getAllBindings()
			.find((binding) => binding.getContext()?.getPath() === contextPath && binding.getPath() === property) as
			| ODataPropertyBinding
			| undefined;
		value = bindingProperty?.getValue();
		if (!value) {
			value = await model.bindProperty(`${contextPath}/${property}`).requestValue();
		}

		return value;
	}

	private newViews: Promise<void>[] = [];

	/**
	 *  Sets the cache ready state.
	 * @param isReady
	 */
	setCacheReady(isReady: Promise<void[]>): void {
		this.cacheReady = isReady;
	}

	/**
	 * Returns the cache ready state.
	 * @returns The cache ready state.
	 */
	async isCacheReady(): Promise<boolean> {
		await this.cacheReady;
		return true;
	}

	/**
	 * Returns the current cache entry for the app component.
	 * @returns  The current cache entry for the app component.
	 */
	getCurrentCacheEntry(): PageLevelCache {
		return viewPreloaderCache.getCurrentCacheEntry();
	}

	/**
	 *Returns the full cache object, which contains all application level caches.
	 * @param targetName
	 * @returns The full cache object for the app component.
	 */
	getCacheEntryByTargetName(targetName: string): PageLevelCache | undefined {
		return viewPreloaderCache.getCacheEntryByTargetName(targetName, this.appComponent);
	}

	/**
	 * Sets the current cache entry by the target name.
	 * If the target name does not exist, it creates a new cache entry and adds it to the full cache.
	 * @param targetName
	 */
	setCurrentCacheEntryByTargetName(targetName: string): void {
		const cacheEntry = this.getCacheEntryByTargetName(targetName) ?? { values: {} };
		viewPreloaderCache.addEntryToCache(cacheEntry, targetName, this.appComponent);
	}
}

export class ViewPreloaderServiceFactory extends ServiceFactory<{}> {
	private instance!: ViewPreloaderService;

	async createInstance(oServiceContext: ServiceContext<{}>): Promise<ViewPreloaderService> {
		this.instance = new ViewPreloaderService(oServiceContext);
		return this.instance.initPromise;
	}

	getInstance(): ViewPreloaderService {
		return this.instance;
	}
}
