import Log from "sap/base/Log";
import type FlexibleColumnLayout from "sap/f/FlexibleColumnLayout";
import { defineUI5Class, implementInterface } from "sap/fe/base/ClassSupport";
import AppStateHandler from "sap/fe/core/AppStateHandler";
import RouterProxy from "sap/fe/core/controllerextensions/routing/RouterProxy";
import type { ManifestSettingsSapFE } from "sap/fe/core/converters/ManifestSettings";
import HTTP503Handler from "sap/fe/core/helpers/HTTP503Handler";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import PromiseKeeper from "sap/fe/core/helpers/PromiseKeeper";
import library from "sap/fe/core/library";
import { changeConfiguration } from "sap/fe/core/manifestMerger/ChangePageConfiguration";
import type RootViewBaseController from "sap/fe/core/rootView/RootViewBaseController";
import type { CollaborationManagerService } from "sap/fe/core/services/CollaborationManagerServiceFactory";
import type { CollaborativeToolsService } from "sap/fe/core/services/CollaborativeToolsServiceFactory";
import type { ContextSharingService } from "sap/fe/core/services/ContextSharingServiceFactory";
import type { EnvironmentCapabilitiesService } from "sap/fe/core/services/EnvironmentServiceFactory";
import type { InlineEditService } from "sap/fe/core/services/InlineEditServiceFactory";
import type { NavigationService } from "sap/fe/core/services/NavigationServiceFactory";
import type { RoutingService } from "sap/fe/core/services/RoutingServiceFactory";
import type { IShellServices } from "sap/fe/core/services/ShellServicesFactory";
import type { SideEffectsService } from "sap/fe/core/services/SideEffectsServiceFactory";
import type { TelemetryService } from "sap/fe/core/services/TelemetryServiceFactory";
import type { CollaborativeDraftService } from "sap/fe/core/services/collaborativeDraftServiceFactory";
import Diagnostics from "sap/fe/core/support/Diagnostics";
import "sap/fe/core/type/DynamicCurrency";
import type NavContainer from "sap/m/NavContainer";
import Router from "sap/m/routing/Router";
import Library from "sap/ui/core/Lib";
import type { ManifestContent } from "sap/ui/core/Manifest";
import UIComponent from "sap/ui/core/UIComponent";
import type { IAsyncContentCreation } from "sap/ui/core/library";
import type View from "sap/ui/core/mvc/View";
import type Service from "sap/ui/core/service/Service";
import type Model from "sap/ui/model/Model";
import JSONModel from "sap/ui/model/json/JSONModel";
import "sap/ui/model/odata/type/Currency";
import "sap/ui/model/odata/type/Unit";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import BusyLocker from "./controllerextensions/BusyLocker";
import { deleteModelCacheData } from "./converters/MetaModelConverter";
import { getResourceModel } from "./helpers/ResourceModelHelper";
import type { ValueHelpHistoryService } from "./services/ValueHelpHistoryServiceFactory";
import type { ViewPreloaderService } from "./services/ViewPreloaderServiceFactory";

/**
 * Represents the additional configuration that can be provided by libraries.
 */
export type AdditionalConfiguration = {
	"sap.fe.core.fpm"?: {
		i18nBundles?: string[];
	};
	/**
	 * Configuration options for SAP Fiori elements macros.
	 */
	"sap.fe.macros"?: {
		/**
		 * Configuration for the Status building block.
		 */
		Status?: {
			/**
			 * Whether the default value is inverted.
			 */
			invertedDefaultValue?: boolean;
			/**
			 * Color mapping for different status values.
			 */
			colorPalette?: "Standard" | "Pastel";
		};
	};
};

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

export type ComponentData = {
	startupParameters?: StartupParameters;
	//feEnvironment is object which is received as a part of the component data for My Inbox applications.
	feEnvironment?: {
		//Within this object they pass a function called getIntent() which returns an object containing the semanticObject and action as separate property-value entries that are then used to update the related apps button.
		getIntent: Function;
		//Within this object they pass a function called getShareControlVisibility() that returns boolean values(true or false) which determines the visibility of the share button.
		getShareControlVisibility: Function;
	};
};
// Keep a reference so as to keep the import despite it not being directly used
const _mRouter = Router;

export type StartupParameters = {
	preferredMode?: string[];
	preferredAction?: string[];
} & Record<string, unknown[]>;

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
@defineUI5Class("sap.fe.core.AppComponent", {
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
})
class AppComponent extends UIComponent implements IAsyncContentCreation {
	@implementInterface("sap.ui.core.IAsyncContentCreation")
	__implements__sap_ui_core_IAsyncContentCreation = true;

	static instanceMap: Record<string, AppComponent> = {};

	/**
	 * The additional configuration for the application.
	 * @private
	 */
	private additionalConfiguration: AdditionalConfiguration = {};

	/**
	 * Gets the additional configuration for the application.
	 * @returns The additional configuration
	 */
	getAdditionalConfiguration(): AdditionalConfiguration {
		return this.additionalConfiguration;
	}

	/**
	 * Registered handlers for modifying additional configuration.
	 */
	private static configurationHandlers: ((additionalConfiguration: AdditionalConfiguration) => Promise<void>)[] = [];

	private _oRouterProxy!: RouterProxy;

	private _oAppStateHandler!: AppStateHandler;

	private bInitializeRouting?: boolean;

	private _oDiagnostics!: Diagnostics;

	private entityContainer!: Promise<void>;

	private metaModel?: ODataMetaModel;

	private startupMode: string = StartupMode.Normal;

	public eagerViewCreation?: boolean;

	public hideViewDuringCreation?: boolean;

	public delayFcl?: boolean;

	public delayTime = 100;

	public delayMetadataCheck = false;

	private _startedServices: Service<unknown>[] = [];

	public initialized!: Promise<void>;

	private _initializedKeeper!: PromiseKeeper<void>;

	private isAdaptationEnabled = false;

	public isExiting = false;

	public pageConfigurationChanges: Record<string, string[]> = {};

	private suspended = false;

	private oComponentData?: ComponentData;

	/**
	 * Status of the preferred action execution to prevent duplicate triggering.
	 * - NotSet: Initial state, no preferred action has been evaluated
	 * - CanPerform: Preferred action can be performed (conditions are met)
	 * - AlreadyPerformed: Preferred action has been executed and should not be triggered again
	 */
	public preferredActionStatus: (typeof library.PreferredActionStatusType)[keyof typeof library.PreferredActionStatusType] =
		library.PreferredActionStatusType.NotSet;

	/**
	 * Gets the current status of the preferred action.
	 * @returns The current preferred action status
	 */
	getPreferredActionStatus(): (typeof library.PreferredActionStatusType)[keyof typeof library.PreferredActionStatusType] {
		return this.preferredActionStatus;
	}

	/**
	 * Sets the status of the preferred action.
	 * @param status The new status to set
	 */
	setPreferredActionStatus(status: (typeof library.PreferredActionStatusType)[keyof typeof library.PreferredActionStatusType]): void {
		this.preferredActionStatus = status;
	}

	/**
	 * Singleton to hold processes from libraries that need to be run for every instance prior to startup.
	 */
	private static instanceDependentProcesses: ((appComponent: AppComponent) => Promise<void>)[] = [];

	/**
	 * Singleton holding custom initialization checks that can be registered by libraries.
	 */
	private static _customManifestChecks: ((manifestContent: ManifestContent["sap.ui5"]) => void)[] = [];

	_isFclEnabled(): boolean {
		const oManifestUI5 = this.getManifestEntry("sap.ui5");
		return oManifestUI5?.routing?.config?.routerClass === NAVCONF.FCL.ROUTERCLASS;
	}

	setAdaptationMode(isAdaptationEnabled: boolean): void {
		this.isAdaptationEnabled = isAdaptationEnabled;
	}

	isAdaptationMode(): boolean {
		return this.isAdaptationEnabled;
	}

	/**
	 * Register a handler for modifying additional configuration.
	 * The handler will be called before feature toggles are initialized.
	 * @param handler The handler function that will modify the additional configuration
	 */
	static registerConfigurationHandlers(handler: (additionalConfiguration: AdditionalConfiguration) => Promise<void>): void {
		this.configurationHandlers.push(handler);
	}

	/**
	 * Provides a hook to initialize feature toggles.
	 *
	 * This hook is being called by the SAP Fiori elements AppComponent at the time feature toggles can be initialized.
	 * To change page configuration, use the {@link sap.fe.core.AppComponent#changePageConfiguration} method.
	 * @public
	 * @returns A promise without any value to allow asynchronous processes
	 */
	async initializeFeatureToggles(): Promise<void> {
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
	 */
	changePageConfiguration(pageId: string, path: string, value: unknown): void {
		const manifest = changeConfiguration(this.getManifest(), pageId, path, value, true, this) as ManifestContent;
		if (
			path === "app/disableInputAssistance" &&
			(manifest?.["sap.fe"] as ManifestSettingsSapFE)?.["app"]?.["disableInputAssistance"] === value
		) {
			this.getEnvironmentCapabilities().setCapability("DisableInputAssistance", value as boolean);
		}
	}

	/**
	 * Cleans all registered page configuration changes.
	 */
	cleanPageConfigurationChanges(): void {
		this.pageConfigurationChanges = {};
	}

	/**
	 * Get a reference to the RouterProxy.
	 * @returns A Reference to the RouterProxy
	 * @final
	 */
	getRouterProxy(): RouterProxy {
		return this._oRouterProxy;
	}

	/**
	 * Get a reference to the AppStateHandler.
	 * @returns A reference to the AppStateHandler
	 * @final
	 */
	getAppStateHandler(): AppStateHandler {
		return this._oAppStateHandler;
	}

	/**
	 * Get a reference to the nav/FCL Controller.
	 * @returns  A reference to the FCL Controller
	 * @final
	 */
	getRootViewController(): RootViewBaseController {
		return this.getRootControl().getController();
	}

	/**
	 * Get the NavContainer control or the FCL control.
	 * @returns  A reference to NavContainer control or the FCL control
	 * @final
	 */
	getRootContainer(): NavContainer | FlexibleColumnLayout {
		return this.getRootControl().getContent()[0] as NavContainer | FlexibleColumnLayout;
	}

	/**
	 * Get the startup mode of the app.
	 * @returns The startup mode
	 */
	getStartupMode(): string {
		return this.startupMode;
	}

	/**
	 * Set the startup mode for the app to 'Create'.
	 *
	 */
	setStartupModeCreate(): void {
		this.startupMode = StartupMode.Create;
	}

	/**
	 * Set the startup mode for the app to 'AutoCreate'.
	 *
	 */
	setStartupModeAutoCreate(): void {
		this.startupMode = StartupMode.AutoCreate;
	}

	/**
	 * Set the startup mode for the app to 'Deeplink'.
	 *
	 */
	setStartupModeDeeplink(): void {
		this.startupMode = StartupMode.Deeplink;
	}

	init(): void {
		this.oComponentData ??= {};
		const params = new URLSearchParams(window.location.search);
		if (params.has("sap-ui-xx-fe-support")) {
			setTimeout(function () {
				Library.load({ name: "sap.fe.tools" });
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
			this.delayTime = parseInt(params.get("sap-ui-xx-fe-delay")!, 10);
		}
		if (params.has("sap-ui-xx-fe-fcl-opt")) {
			// STABLE
			this.delayFcl = true;
		}
		this._initializedKeeper = new PromiseKeeper<void>();
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
		if (oModel?.isA?.<ODataModel>("sap.ui.model.odata.v4.ODataModel")) {
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
		AppComponent._customManifestChecks.forEach((fnProcess) => {
			return fnProcess.call(this, oManifestUI5);
		});

		this.preloadLibraries(oManifestUI5);

		// the init function configures the routing according to the settings above
		// it will call the createContent function to instantiate the RootView and add it to the UIComponent aggregations

		super.init();
		AppComponent.instanceMap[this.getId()] = this;
	}

	private async http503RetryHandler(error: Error & { retryAfter?: Date }): Promise<undefined> {
		return HTTP503Handler.handle503Delay(error, this.getRootControl(), getResourceModel(this));
	}

	private preloadLibraries(oManifestUI5: ManifestContent["sap.ui5"]): void {
		for (const targetsKey in oManifestUI5.routing?.targets) {
			if (oManifestUI5.routing?.targets[targetsKey].name === "sap.fe.templates.ObjectPage") {
				Library.load({ name: "sap.uxap" }); // fire and forget
			}
			const settings = JSON.stringify(oManifestUI5.routing?.targets[targetsKey]?.options?.settings?.controlConfiguration);
			if (settings?.includes("GridTable") || settings?.includes("TreeTable")) {
				Library.load({ name: "sap.ui.table" }); // fire and forget
			}
		}
	}

	private checkRoutingConfiguration(oManifestUI5: ManifestContent["sap.ui5"]): void {
		if (oManifestUI5?.rootView?.viewName) {
			// The application specified an own root view in the manifest

			// Root View was moved from sap.fe.templates to sap.fe.core - keep it compatible
			if (oManifestUI5.rootView.viewName === NAVCONF.FCL.VIEWNAME_COMPATIBILITY) {
				oManifestUI5.rootView.viewName = NAVCONF.FCL.VIEWNAME;
			} else if (oManifestUI5.rootView.viewName === NAVCONF.NAVCONTAINER.VIEWNAME_COMPATIBILITY) {
				oManifestUI5.rootView.viewName = NAVCONF.NAVCONTAINER.VIEWNAME;
			}

			if (
				oManifestUI5.rootView.viewName === NAVCONF.FCL.VIEWNAME &&
				oManifestUI5.routing?.config?.routerClass === NAVCONF.FCL.ROUTERCLASS
			) {
				Log.info(`Rootcontainer: "${NAVCONF.FCL.VIEWNAME}" - Routerclass: "${NAVCONF.FCL.ROUTERCLASS}"`);
			} else if (
				oManifestUI5.rootView.viewName === NAVCONF.NAVCONTAINER.VIEWNAME &&
				oManifestUI5.routing?.config?.routerClass === NAVCONF.NAVCONTAINER.ROUTERCLASS
			) {
				Log.info(`Rootcontainer: "${NAVCONF.NAVCONTAINER.VIEWNAME}" - Routerclass: "${NAVCONF.NAVCONTAINER.ROUTERCLASS}"`);
			} else if (oManifestUI5.rootView?.viewName?.includes("sap.fe.core.rootView")) {
				throw Error(
					`\nWrong configuration for the couple (rootView/routerClass) in manifest file.\n` +
						`Current values are :(${oManifestUI5.rootView.viewName}/${
							oManifestUI5.routing?.config?.routerClass || "<missing router class>"
						})\n` +
						`Expected values are \n` +
						`\t - (${NAVCONF.NAVCONTAINER.VIEWNAME}/${NAVCONF.NAVCONTAINER.ROUTERCLASS})\n` +
						`\t - (${NAVCONF.FCL.VIEWNAME}/${NAVCONF.FCL.ROUTERCLASS})`
				);
			} else {
				Log.info(`Rootcontainer: "${oManifestUI5.rootView.viewName}" - Routerclass: "${NAVCONF.NAVCONTAINER.ROUTERCLASS}"`);
			}
		}
	}

	async onServicesStarted(allServices: Service<unknown>[]): Promise<void> {
		this._startedServices = allServices;
		// Execute all registered configuration handlers
		await Promise.all(AppComponent.configurationHandlers.map(async (handler) => handler(this.additionalConfiguration)));
		await this.initializeFeatureToggles();
		await Promise.allSettled(
			AppComponent.instanceDependentProcesses.map(async (fnProcess) => {
				return fnProcess.call(null, this);
			})
		);

		//router must be started once the rootcontainer is initialized
		//starting of the router
		const finalizedRoutingInitialization = (): void => {
			this.entityContainer
				.then(async () => {
					// Preload currencyCodes and UoM if they exists
					(this.getMetaModel() as { requestCodeList?: Function }).requestCodeList?.("CurrencyCodes");
					(this.getMetaModel() as { requestCodeList?: Function }).requestCodeList?.("UnitOfMeasures");
					if (this.getRootViewController().attachRouteMatchers) {
						this.getRootViewController().attachRouteMatchers();
					}
					this.getRouter().initialize();
					this.getRouterProxy().init(this, this._isFclEnabled());

					return this.getValueHelpHistoryService().registerShellHook();
				})
				.catch((error: Error) => {
					const oResourceBundle = Library.getResourceBundleFor("sap.fe.core")!;

					this.getRootViewController().displayErrorPage(
						oResourceBundle.getText("C_APP_COMPONENT_SAPFE_APPSTART_TECHNICAL_ISSUES"),
						{
							title: oResourceBundle.getText("C_COMMON_SAPFE_ERROR"),
							description: error.message
						}
					);
				});
		};

		if (this.bInitializeRouting) {
			return this.getRoutingService()
				.initializeRouting()
				.then(() => {
					if (this.getRootViewController()) {
						finalizedRoutingInitialization();
					} else {
						this.getRootControl().attachAfterInit(function () {
							finalizedRoutingInitialization();
						});
					}
					this._initializedKeeper.resolve();
					return;
				})
				.catch(function (err: Error) {
					Log.error(`cannot cannot initialize routing: ${err.toString()}`);
				});
		} else {
			this._initializedKeeper.resolve();
		}
	}

	exit(): void {
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
	}

	getMetaModel(): ODataMetaModel {
		return this.getModel().getMetaModel();
	}

	getDiagnostics(): Diagnostics {
		return this._oDiagnostics;
	}

	destroy(bSuppressInvalidate?: boolean): void {
		this.isExiting = true;

		// LEAKS, with workaround for some Flex / MDC issue
		try {
			delete AppComponent.instanceMap[this.getId()];

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			delete (window as unknown)._routing;
		} catch (e) {
			Log.info(e as string);
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
		super.destroy(bSuppressInvalidate);
		if (oHeaders && oMainModel.oRequestor) {
			oMainModel.oRequestor.mHeaders = oHeaders;
		}
	}

	getRoutingService(): RoutingService {
		return {} as RoutingService; // overriden at runtime
	}

	getShellServices(): IShellServices {
		return {} as IShellServices; // overriden at runtime
	}

	getNavigationService(): NavigationService {
		return {} as NavigationService; // overriden at runtime
	}

	getSideEffectsService(): SideEffectsService {
		return {} as SideEffectsService;
	}

	getEnvironmentCapabilities(): EnvironmentCapabilitiesService {
		return {} as EnvironmentCapabilitiesService;
	}

	getCollaborationManagerService(): CollaborationManagerService {
		return {} as CollaborationManagerService;
	}

	getViewPreloaderService(): ViewPreloaderService {
		return {} as ViewPreloaderService;
	}

	getCollaborativeToolsService(): CollaborativeToolsService {
		return {} as CollaborativeToolsService;
	}

	getCollaborativeDraftService(): CollaborativeDraftService {
		return {} as CollaborativeDraftService;
	}

	getContextSharingService(): ContextSharingService {
		return {} as ContextSharingService;
	}

	getTelemetryService(): TelemetryService {
		return {} as TelemetryService;
	}

	getValueHelpHistoryService(): ValueHelpHistoryService {
		return {} as ValueHelpHistoryService;
	}

	getInlineEditService(): InlineEditService {
		return {} as InlineEditService;
	}

	async getStartupParameters(): Promise<StartupParameters> {
		const startupParams = this.getComponentData()?.startupParameters;
		if (
			startupParams?.preferredAction?.[0].includes("summary") &&
			this.getPreferredActionStatus() === library.PreferredActionStatusType.NotSet
		) {
			this.setPreferredActionStatus(library.PreferredActionStatusType.CanPerform);
		}
		return startupParams ?? {};
	}

	restore(): void {
		// called by FLP when app sap-keep-alive is enabled and app is restored
		for (const startedService of this._startedServices) {
			startedService.onRestore?.();
		}
		this.getRootViewController().viewState.onRestore();

		// Reset all values in versionActivationStatus to false
		AppStateHandler.resetVersionActivationStatus();

		this.suspended = false;
	}

	suspend(): void {
		// called by FLP when app sap-keep-alive is enabled and app is suspended
		for (const startedService of this._startedServices) {
			startedService.onSuspend?.();
		}
		this.getRootViewController().viewState.onSuspend();

		this.suspended = true;
	}

	isSuspended(): boolean {
		return this.suspended;
	}

	/**
	 * navigateBasedOnStartupParameter function is a public api that acts as a wrapper to _manageDeepLinkStartup function. It passes the startup parameters further to _manageDeepLinkStartup function
	 * @param startupParameters Defines the startup parameters which is further passed to _manageDeepLinkStartup function.
	 */

	async navigateBasedOnStartupParameter(startupParameters: StartupParameters | null | undefined): Promise<void> {
		try {
			if (!BusyLocker.isLocked(this.getModel("ui"))) {
				if (!startupParameters) {
					startupParameters = null;
				}
				const routingService = this.getRoutingService();
				await routingService._manageDeepLinkStartup(startupParameters);
			}
		} catch (exception: unknown) {
			Log.error(exception as string);
			BusyLocker.unlock(this.getModel("ui"));
		}
	}

	/**
	 * Used to allow disabling the Collaboration Manager integration for the OVP use case.
	 * @returns Whether the collaboration manager service is active.
	 */
	isCollaborationManagerServiceEnabled(): boolean {
		return !this.isUsedAsBuildingBlockContext();
	}

	/**
	 * Register processes that need to be run for every instance prior to startup.
	 * @param fnProcess Function that hold the implementation of the process.
	 *
	 * The registered process can be an asynchronous process.
	 * It shall be called with the AppComponent instance as a parameter before startup.
	 */
	static registerInstanceDependentProcessForStartUp(fnProcess: (appComponent: AppComponent) => Promise<void>): void {
		this.instanceDependentProcesses.push(fnProcess);
	}

	/**
	 * Registers custom initialization checks that are run before the component is initialized.
	 * This is useful for running checks that are specific to a library.
	 * These checks are run before the component is initialized and before the manifest is merged.
	 * @param fnProcess
	 */
	static registerInitChecks(fnProcess: (manifestContent: ManifestContent["sap.ui5"]) => void): void {
		this._customManifestChecks.push(fnProcess);
	}

	/**
	 * Checks if the component is embedded in another application.
	 * This is determined by checking if the component data contains a `feEnvironment` object.
	 * This is set when the component is embedded in My Inbox.
	 * @returns True if the component is embedded, false otherwise.
	 */
	_isEmbedded(): boolean {
		return !!this.getComponentData()?.feEnvironment;
	}

	/**
	 * Checks if the application is used as a container for building block instantiation by a building block context.
	 * This is determined by checking the manifest entry `sap.fe.app.isBuildingBlockContext`.
	 * @returns True if the application is used for creating a BuildingBlockContext, false otherwise.
	 */
	isUsedAsBuildingBlockContext(): boolean {
		return this.getManifestEntry("sap.fe")?.app?.isBuildingBlockContext === true;
	}
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
interface AppComponent extends UIComponent {
	isAdaptationMode(): boolean;
	getManifest(): ManifestContent;
	getManifestEntry(entry: "sap.app"): ManifestContent["sap.app"];
	getManifestEntry(entry: "sap.ui5"): ManifestContent["sap.ui5"];
	_getManifestEntry(entry: "sap.ui5", merged: boolean): ManifestContent["sap.ui5"];
	getManifestEntry(entry: "sap.ui"): ManifestContent["sap.ui"];
	getManifestEntry(entry: "sap.fe"): ManifestSettingsSapFE | undefined;
	getManifestEntry(entry: "sap.fiori"): ManifestContent["sap.fiori"];
	getComponentData(): ComponentData;
	getRootControl(): {
		getController(): RootViewBaseController;
	} & View;
	getModel(): ODataModel;
	getModel(name: "ui"): JSONModel;
	getModel(name: string): Model | undefined;
}

export default AppComponent;
