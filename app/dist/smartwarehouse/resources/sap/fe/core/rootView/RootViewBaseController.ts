import Log from "sap/base/Log";
import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import type FlexibleColumnLayout from "sap/f/FlexibleColumnLayout";
import { defineUI5Class, usingExtension } from "sap/fe/base/ClassSupport";
import type { FEView } from "sap/fe/core/BaseController";
import BaseController from "sap/fe/core/BaseController";
import CommonUtils from "sap/fe/core/CommonUtils";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import { type NavigationToErrorPageResult } from "sap/fe/core/controllerextensions/MessageHandler";
import Placeholder from "sap/fe/core/controllerextensions/Placeholder";
import ViewState from "sap/fe/core/controllerextensions/ViewState";
import { getRouteTargetNames } from "sap/fe/core/helpers/ManifestHelper";
import PromiseKeeper from "sap/fe/core/helpers/PromiseKeeper";
import SizeHelper from "sap/fe/core/helpers/SizeHelper";
import type FclController from "sap/fe/core/rootView/Fcl.controller";
import type NavContainer from "sap/m/NavContainer";
import BindingInfo from "sap/ui/base/BindingInfo";
import Component from "sap/ui/core/Component";
import type ComponentContainer from "sap/ui/core/ComponentContainer";
import type Control from "sap/ui/core/Control";
import Element from "sap/ui/core/Element";
import type View from "sap/ui/core/mvc/View";
import HashChanger from "sap/ui/core/routing/HashChanger";
import type { Route$MatchedEvent } from "sap/ui/core/routing/Route";
import type Router from "sap/ui/core/routing/Router";
import type Table from "sap/ui/mdc/Table";
import type CompositeBinding from "sap/ui/model/CompositeBinding";
import type Context from "sap/ui/model/Context";
import JSONModel from "sap/ui/model/json/JSONModel";
import AnnotationHelper from "sap/ui/model/odata/v4/AnnotationHelper";
import type { ODataPropertyBinding$ChangeEvent } from "sap/ui/model/odata/v4/ODataPropertyBinding";
import type ResourceModel from "sap/ui/model/resource/ResourceModel";
import URI from "sap/ui/thirdparty/URI";
import type { TitleAdditionalInfo } from "sap/ushell/ui5service/ShellUIService";
import type AppComponent from "../AppComponent";
import Any from "../controls/Any";

export type TitleInformation = {
	title?: string;
	subtitle?: string;
	icon?: string;
	intent?: string;
	description?: string;
};

type TargetOptions = {
	name: string;
	options?: {
		settings?: {
			contextPath?: string;
			entitySet?: string;
		};
	};
};

@defineUI5Class("sap.fe.core.rootView.RootViewBaseController")
class RootViewBaseController extends BaseController {
	@usingExtension(Placeholder)
	oPlaceholder!: Placeholder;

	@usingExtension(ViewState)
	viewState!: ViewState;

	private _aHelperModels!: JSONModel[];

	private oRouter?: Router;

	private oTitleHierarchyCache?: Record<string, TitleInformation>;

	private bIsComputingTitleHierachy = false;

	private _routingIsComplete?: PromiseKeeper<void>;

	private _numberOfRoutesInProgress = 0;

	// Edit lifecycle callback properties
	private dirtyStateProviderCallback?: (navigationContext: { innerAppRoute: string }) => boolean | undefined;

	private stickySessionTimeoutCallback?: () => void;

	private discardAfterNavigationCallback?: () => Promise<void>;

	private discardPromise = Promise.resolve();

	private _discardAfterNavHandler?: () => void;

	/**
	 * Callback to confirm guard crossing during navigation.
	 * When set, displays the appropriate data loss dialog based on programming model (sticky vs draft).
	 * Returns true if navigation should proceed, false if cancelled.
	 */
	public confirmGuardCross?: () => Promise<boolean>;

	onInit(): void {
		SizeHelper.init();

		this._aHelperModels = [];
	}

	getPlaceholder(): Placeholder {
		return this.oPlaceholder;
	}

	attachRouteMatchers(): void {
		this.oPlaceholder.attachRouteMatchers();
		this.getAppComponent().getRoutingService().attachAfterRouteMatched({}, this.onAfterRouteMatched, this);
	}

	onExit(): void {
		this.getAppComponent().getRoutingService().detachAfterRouteMatched(this.onAfterRouteMatched, this);
		this.oRouter = undefined;
		this.unregisterEditLifecycleCallbacks();

		SizeHelper.exit();

		// Destroy all JSON models created dynamically for the views
		this._aHelperModels.forEach(function (oModel: JSONModel) {
			oModel.destroy();
		});
	}

	getViewFromContainer(container: Control): View | undefined {
		const result = container.isA<ComponentContainer>("sap.ui.core.ComponentContainer")
			? container.getComponentInstance().getRootControl()
			: container;

		return result?.isA<View>("sap.ui.core.mvc.View") ? result : undefined;
	}

	/**
	 * Analyze the pages and return the corresponding views.
	 * @param pages The pages to be analyzed.
	 * @returns The views
	 */
	protected getViewsFromPages(pages: Control[]): View[] {
		const views: View[] = [];

		pages.forEach((page) => {
			const view = this.getViewFromContainer(page);

			if (view !== undefined) {
				views.push(view);
			}
		});

		return views;
	}

	/**
	 * Convenience method for getting the resource bundle.
	 * @public
	 * @returns The resourceModel of the component
	 */
	getResourceBundle(): ResourceBundle | Promise<ResourceBundle> {
		return (this.getOwnerComponent().getModel("i18n") as ResourceModel).getResourceBundle();
	}

	getRouter(): Router {
		if (!this.oRouter) {
			this.oRouter = this.getAppComponent().getRouter();
		}

		return this.oRouter;
	}

	_createHelperModel(): JSONModel {
		// We keep a reference on the models created dynamically, as they don't get destroyed
		// automatically when the view is destroyed.
		// This is done during onExit
		const oModel = new JSONModel();
		this._aHelperModels.push(oModel);

		return oModel;
	}

	async routingIsComplete(): Promise<void> {
		await (this._routingIsComplete?.promise || Promise.resolve());
	}

	/**
	 * Function waiting for the Right most view to be ready.
	 * @param oEvent Reference an Event parameter coming from routeMatched event
	 * @returns A promise indicating when the right most view is ready
	 */
	async waitForRightMostViewReady(oEvent: Route$MatchedEvent): Promise<FEView> {
		return new Promise(function (resolve: (value: FEView) => void, reject: (reason?: Error) => void) {
			const aContainers = oEvent.getParameter("views") ?? [],
				// There can also be reuse components in the view, remove them before processing.
				aFEContainers: FEView[] = [];
			let defaultView: FEView | undefined;
			aContainers.forEach(function (oContainer: View | ComponentContainer | undefined) {
				let oView = oContainer as FEView | undefined;
				if (oContainer && (oContainer as ComponentContainer).getComponentInstance) {
					const oComponentInstance = (oContainer as ComponentContainer).getComponentInstance();
					oView = oComponentInstance.getRootControl() as FEView;
				}
				if (oView && oView.getController() && oView.getController().pageReady) {
					aFEContainers.push(oView);
				} else if (oView) {
					defaultView = oView;
				}
			});
			const oRightMostFEView = aFEContainers[aFEContainers.length - 1];
			if (oRightMostFEView && oRightMostFEView.getController().pageReady.isPageReady()) {
				resolve(oRightMostFEView);
			} else if (oRightMostFEView) {
				oRightMostFEView.getController().pageReady.attachEventOnce("pageReady", function () {
					resolve(oRightMostFEView);
				});
			} else if (defaultView) {
				resolve(defaultView);
			} else {
				reject(new Error("No view was found during onAfterRouteMatched"));
			}
		});
	}

	/**
	 * Method to restore the focusInformation from the history Object.
	 */
	protected restoreFocusFromHistory(): void {
		switch (history.state.focusInfo.type) {
			case "Row":
				const table = Element.getElementById(history.state.focusInfo.tableId) as Table;
				const pos = table
					.getRowBinding()
					.getCurrentContexts()
					.findIndex((context) => context.getPath() === history.state.focusInfo.contextPathFocus);
				if (pos !== -1) {
					table.focusRow(pos);
				}
				break;
			default:
				Element.getElementById(history.state.focusInfo.controlId)?.focus();
		}
		//once applied, the focus info is removed to prevent focusing on it each time the user do a back navigation to this page
		history.replaceState(Object.assign(history.state, { focusInfo: null }), "");
	}

	/**
	 * Callback when the navigation is done.
	 * - update the shell title.
	 * - update table scroll.
	 * - call onPageReady on the rightMostView.
	 * @param event
	 * @returns A promise for the current navigation
	 */
	async onAfterRouteMatched(event: Route$MatchedEvent): Promise<FEView | undefined> {
		// We create a debouncer for '_routingIsComplete' to handler multiple 'onAfterRouteMatched' calls.
		this._routingIsComplete = this._routingIsComplete ?? new PromiseKeeper<void>();
		this._numberOfRoutesInProgress = ++this._numberOfRoutesInProgress;
		const currentRouteId = this._numberOfRoutesInProgress;

		try {
			const view = await this.waitForRightMostViewReady(event);

			if (view && this.getVisibleViews().includes(view)) {
				// The autoFocus is initially disabled on the navContainer or the FCL, so that the focus stays on the Shell menu
				// even if the app takes a long time to launch
				// The first time the view is displayed, we need to enable the autofocus so that it's managed properly during navigation
				const rootControl = this.getView().getContent()[0];
				if (
					rootControl &&
					(rootControl as FlexibleColumnLayout).getAutoFocus &&
					!(rootControl as FlexibleColumnLayout).getAutoFocus()
				) {
					rootControl.setProperty("autoFocus", true, true); // Do not mark the container as invalid, otherwise it's re-rendered
				}

				const appComponent = this.getAppComponent();
				this._scrollTablesToLastNavigatedItems();
				if (appComponent.getEnvironmentCapabilities().getCapabilities().UShell) {
					this.computeTitleHierarchy(view);
				}
				const forceFocus = appComponent.getRouterProxy().isFocusForced();
				appComponent.getRouterProxy().setFocusForced(false); // reset
				if (view.getController() && (view.getParent() as TemplateComponent).onPageReady) {
					(view.getParent() as TemplateComponent).onPageReady({ forceFocus: forceFocus });
				}
				if (history.state?.focusInfo) {
					this.restoreFocusFromHistory();
				} else if (appComponent.getRouterProxy().getLastHistoryEntry().focusControlId) {
					// Try to restore the focus on where it was when we last visited the current hash
					appComponent.getRouterProxy().restoreFocusForCurrentHash();
				}
				if (this.onContainerReady) {
					this.onContainerReady();
				}
			}
			return view;
		} catch (error: unknown) {
			Log.error("An error occurs while computing the title hierarchy and calling focus method", error as string);
			return undefined;
		} finally {
			if (currentRouteId === this._numberOfRoutesInProgress) {
				// We reset the debouncer logic after completion of latest route match.
				this._numberOfRoutesInProgress = 0;
				this._routingIsComplete.resolve();
				this._routingIsComplete = undefined;
			}
		}
	}

	/**
	 * This function returns the TitleHierarchy cache ( or initializes it if undefined).
	 * @returns  The TitleHierarchy cache
	 */
	_getTitleHierarchyCache(): Record<string, TitleInformation> {
		if (!this.oTitleHierarchyCache) {
			this.oTitleHierarchyCache = {};
		}
		return this.oTitleHierarchyCache;
	}

	/**
	 * This function clear the TitleHierarchy cache for the given context path.
	 * Present implementation only updates the title when the current context is the one being invalidated.
	 * @param  path The path of the context to clear the cache for
	 */
	async invalidateTitleHierarchyCache(path: string): Promise<void> {
		delete this._getTitleHierarchyCache()[path];
		const appComponent = this.getAppComponent(),
			currentView = CommonUtils.getCurrentPageView(appComponent),
			bindingContext = currentView.getBindingContext(),
			bindingContextPath = bindingContext?.getPath();
		if (currentView && bindingContextPath === path) {
			const templateComponent = currentView.getParent() as TemplateComponent;
			const pageTitleInformation = await this._createCurrentPageTitleInfo(templateComponent, bindingContext, path);
			const manifestAppSettings = appComponent.getManifestEntry("sap.app"),
				appTitle = manifestAppSettings.title || "";
			await this._setTitles(appTitle, pageTitleInformation, currentView);
		}
	}

	/**
	 * This function returns a titleInfo object.
	 * @param title The application's title
	 * @param subtitle The application's subTitle
	 * @param sIntent The intent path to be redirected to
	 * @param description The application's description
	 * @param icon The application's icon
	 * @returns The title information
	 */
	_computeTitleInfo(title: string, subtitle: string, sIntent: string, description?: string, icon = ""): TitleInformation {
		const aParts = sIntent.split("/");
		if (!aParts[aParts.length - 1].includes("?")) {
			sIntent += "?restoreHistory=true";
		} else {
			sIntent += "&restoreHistory=true";
		}
		return {
			title: title,
			subtitle: subtitle,
			intent: sIntent,
			icon: icon,
			description: description
		};
	}

	_formatTitle(displayMode: string, titleValue: string, titleDescription: string): string {
		let formattedTitle = "";
		switch (displayMode) {
			case "Value":
				formattedTitle = `${titleValue}`;
				break;
			case "ValueDescription":
				formattedTitle = `${titleValue} (${titleDescription})`;
				break;
			case "DescriptionValue":
				formattedTitle = `${titleDescription} (${titleValue})`;
				break;
			case "Description":
				formattedTitle = `${titleDescription}`;
				break;
			default:
		}
		return formattedTitle;
	}

	/**
	 * Fetches the value of the HeaderInfo title for a given path.
	 * @param path The path to the entity
	 * @returns A promise containing the formatted title, or an empty string if no HeaderInfo title annotation is available
	 */
	async _fetchTitleValue(path: string): Promise<string> {
		const appComponent = this.getAppComponent(),
			model = this.getView().getModel(),
			metaModel = appComponent.getMetaModel(),
			metaPath = metaModel.getMetaPath(path),
			bindingViewContext = model.createBindingContext(path),
			headerInfoTitleValueAnnotation = metaModel.getObject(`${metaPath}/@com.sap.vocabularies.UI.v1.HeaderInfo/Title/Value`),
			valueExpression = AnnotationHelper.format(headerInfoTitleValueAnnotation, { context: metaModel.createBindingContext("/") });
		if (!valueExpression) {
			return Promise.resolve("");
		}
		if (headerInfoTitleValueAnnotation.$Function === "odata.concat") {
			const anyObject = new Any({ any: valueExpression });
			anyObject.setModel(model);
			anyObject.setBindingContext(bindingViewContext);
			const textBinding = anyObject.getBinding("any");
			if (textBinding?.isA<CompositeBinding>("sap.ui.model.CompositeBinding")) {
				await Promise.all(textBinding.getBindings().map((binding) => binding.requestValue?.()));
			}
			const infoTitle = anyObject.getAny();
			anyObject.destroy();
			return Promise.resolve(infoTitle as string);
		}
		const textExpression = AnnotationHelper.format(
				metaModel.getObject(
					`${metaPath}/@com.sap.vocabularies.UI.v1.HeaderInfo/Title/Value/$Path@com.sap.vocabularies.Common.v1.Text`
				),
				{ context: metaModel.createBindingContext("/") }
			),
			propertyContext = metaModel.getObject(`${metaPath}/@com.sap.vocabularies.UI.v1.HeaderInfo/Title/Value/$Path@`),
			promises: Promise<string>[] = [];
		if (propertyContext) {
			const parsedvalueExpression = BindingInfo.parse(valueExpression),
				promiseForDisplayMode = new Promise(function (resolve: (value: string) => void) {
					const displayMode = CommonUtils.computeDisplayMode(propertyContext);
					resolve(displayMode);
				});
			promises.push(promiseForDisplayMode);
			const valuePath = parsedvalueExpression?.parts ? parsedvalueExpression.parts[0].path : parsedvalueExpression.path,
				fnValueFormatter = parsedvalueExpression?.formatter,
				valueBinding = model.bindProperty(valuePath, bindingViewContext, { $$groupId: "$auto.Heroes" });
			valueBinding.initialize();

			const promiseForTitleValue = new Promise(function (resolve: (value: string) => void) {
				const fnChange = function (event: ODataPropertyBinding$ChangeEvent): void {
					const targetValue = fnValueFormatter ? fnValueFormatter(event.getSource().getValue()) : event.getSource().getValue();

					valueBinding.detachChange(fnChange);
					resolve(targetValue);
				};
				valueBinding.attachChange(fnChange);
			});
			promises.push(promiseForTitleValue);

			if (textExpression) {
				const parsedTextExpression = BindingInfo.parse(textExpression);
				let textPath = parsedTextExpression.parts ? parsedTextExpression.parts[0].path : parsedTextExpression.path;
				textPath = valuePath.lastIndexOf("/") > -1 ? `${valuePath.slice(0, valuePath.lastIndexOf("/"))}/${textPath}` : textPath;

				const fnTextFormatter = parsedTextExpression.formatter,
					textBinding = model.bindProperty(textPath, bindingViewContext, { $$groupId: "$auto.Heroes" });
				textBinding.initialize();
				const promiseForTitleText = new Promise(function (resolve: (description: string) => void) {
					const fnChange = function (event: ODataPropertyBinding$ChangeEvent): void {
						const targetText = fnTextFormatter ? fnTextFormatter(event.getSource().getValue()) : event.getSource().getValue();

						textBinding.detachChange(fnChange);
						resolve(targetText);
					};

					textBinding.attachChange(fnChange);
				});
				promises.push(promiseForTitleText);
			}
		} else {
			promises.push(Promise.resolve("Value"));
			promises.push(Promise.resolve(valueExpression));
		}
		try {
			const titleInfo: string[] = await Promise.all(promises);
			let formattedTitle = "";
			if (typeof titleInfo !== "string") {
				formattedTitle = this._formatTitle(titleInfo[0], titleInfo[1], titleInfo[2]);
			}
			return formattedTitle;
		} catch (error: unknown) {
			Log.error("Error while fetching the title from the header info :" + error);
		}
		return "";
	}

	/**
	 * Function returning the decoded application-specific hash.
	 * @returns Decoded application-specific hash
	 */
	getAppSpecificHash(): string {
		// HashChanged isShellNavigationHashChanger
		const hashChanger = HashChanger.getInstance();
		return hashChanger.hrefForAppSpecificHash ? URI.decode(hashChanger.hrefForAppSpecificHash("")) : "#/";
	}

	_getHash(): string {
		return HashChanger.getInstance().getHash();
	}

	/**
	 * This function returns titleInformation from a path.
	 * It updates the cache to store title information if necessary
	 * @param {*} sPath path of the context to retrieve title information from MetaModel
	 * @returns {Promise}  oTitleinformation returned as promise
	 */

	async getTitleInfoFromPath(sPath: string): Promise<TitleInformation> {
		const oTitleHierarchyCache = this._getTitleHierarchyCache();

		if (oTitleHierarchyCache[sPath]) {
			// The title info is already stored in the cache
			return Promise.resolve(oTitleHierarchyCache[sPath]);
		}

		const oMetaModel = this.getAppComponent().getMetaModel();
		const sEntityPath = oMetaModel.getMetaPath(sPath);
		let sTypeName = oMetaModel.getObject(`${sEntityPath}/@com.sap.vocabularies.UI.v1.HeaderInfo/TypeName`);
		sTypeName = CommonUtils.getTranslatedTextFromExpBindingString(sTypeName, this.getView()) || sTypeName;
		const sAppSpecificHash = this.getAppSpecificHash();
		const sIntent = sAppSpecificHash + sPath.slice(1);
		return this._fetchTitleValue(sPath).then((sTitle: string) => {
			const oTitleInfo = this._computeTitleInfo(sTypeName, sTitle, sIntent);
			oTitleHierarchyCache[sPath] = oTitleInfo;
			return oTitleInfo;
		});
	}

	/**
	 * Ensure that the ushell service receives all elements
	 * (title, subtitle, intent, icon) as strings.
	 *
	 * Annotation HeaderInfo allows for binding of title and description
	 * (which are used here as title and subtitle) to any element in the entity
	 * (such types as Boolean, timestamp, double, and others are possible)
	 *
	 * Creates a new hierarchy and converts non-string types to string.
	 * @param aHierarchy Shell title hierarchy
	 * @returns Copy of shell title hierarchy containing all elements as strings
	 */
	_ensureHierarchyElementsAreStrings(aHierarchy: TitleInformation[]): object[] {
		const aHierarchyShell = [];
		for (const level in aHierarchy) {
			const oHierarchy = aHierarchy[level];
			const oShellHierarchy: Record<string, string> = {};
			for (const key in oHierarchy) {
				oShellHierarchy[key] = (
					typeof oHierarchy[key as keyof TitleInformation] !== "string"
						? String(oHierarchy[key as keyof TitleInformation])
						: oHierarchy[key as keyof TitleInformation]
				) as string;
			}
			aHierarchyShell.push(oShellHierarchy);
		}
		return aHierarchyShell;
	}

	/**
	 * Get target options from the hash.
	 * @param sHash The hash to get the target options from
	 * @returns Target options from the corresponding route target
	 */
	getTargetOptionsFromHash(sHash: string): TargetOptions | undefined {
		const oAppComponent = this.getAppComponent();

		const aRoutes = oAppComponent.getManifestEntry("sap.ui5").routing?.routes ?? [];
		for (const route of aRoutes) {
			const oRoute = oAppComponent.getRouter().getRoute(route.name);
			if (oRoute?.match(sHash)) {
				const sTarget = getRouteTargetNames(route.target)[0];
				return (oAppComponent.getRouter().getTarget(sTarget) as unknown as { _oOptions: TargetOptions })._oOptions;
			}
		}
	}

	/**
	 * Get the target type name from the hash.
	 * @param sHash The hash to get the target type from
	 * @returns Target type name from the corresponding route target
	 */
	getTargetTypeFromHash(sHash: string): string {
		return this.getTargetOptionsFromHash(sHash)?.name || "";
	}

	/**
	 * Calculate the browser title and menu title, then trigger the set API of the shell.
	 * @param appTitle Application title
	 * @param pageTitleInformation TitleInformation object
	 * @param view Page view
	 */
	async _setTitles(appTitle: string, pageTitleInformation: TitleInformation, view: FEView): Promise<void> {
		// Get the title of the browser
		let browserTitle;
		const appComponent = this.getAppComponent(),
			title = pageTitleInformation.title ?? "";
		try {
			const templateComponent = Component.getOwnerComponentFor(view) as TemplateComponent;
			browserTitle = await templateComponent._getBrowserTitle(pageTitleInformation);
		} catch (err: unknown) {
			Log.error(`Error retrieving browser title: ${err}`);
		}
		await this._setShellMenuTitle(appComponent, title, appTitle, browserTitle);
	}

	removeEmptyParamFromHash(appComponent: AppComponent, appSpecificHash: string): string {
		const shellServiceHelper = appComponent.getShellServices();
		const parsedUrl = shellServiceHelper.parseShellHash(appSpecificHash);
		for (const key in parsedUrl?.params) {
			if (!key.startsWith("sap-") && parsedUrl.params[key][0] === "") {
				delete parsedUrl.params[key];
			}
		}
		if (parsedUrl?.params) {
			delete parsedUrl.params["sap-xapp-state"];
		}
		return `#${shellServiceHelper.constructShellHash(parsedUrl)}`;
	}

	/**
	 * Creates title information for the current page by retrieving page-specific title data
	 * and enhancing it with navigation intent information.
	 *
	 * This method retrieves the raw title information from the page component, computes
	 * the navigation intent hash, and processes the title data through _computeTitleInfo
	 * to create a standardized TitleInformation object. The result is cached in the
	 * title hierarchy cache for future use.
	 * @param currentPage The template component representing the current page
	 * @param context Optional binding context for the page data
	 * @param newPath Optional new path for caching the title information
	 * @returns Promise that resolves to the processed title information for the page
	 */
	async _createCurrentPageTitleInfo(
		currentPage: TemplateComponent,
		context?: Context | null,
		newPath?: string
	): Promise<TitleInformation> {
		let pageTitleInformation: TitleInformation;

		// Check if _getPageTitleInformation exists before calling it
		if (currentPage._getPageTitleInformation) {
			pageTitleInformation = await currentPage._getPageTitleInformation();
		} else {
			// Fallback to empty title information if the method doesn't exist
			pageTitleInformation = { title: "", subtitle: "", intent: "" };
		}

		const appSpecificHash = this.getAppSpecificHash();
		const hash = this._getHash();
		const intent = appSpecificHash.endsWith("/") && hash.startsWith("/") ? appSpecificHash + hash.substring(1) : appSpecificHash + hash;
		pageTitleInformation = this._computeTitleInfo(
			pageTitleInformation.title ?? "",
			pageTitleInformation.subtitle ?? "",
			intent,
			pageTitleInformation.description
		);

		if (context && newPath) {
			this._getTitleHierarchyCache()[newPath] = pageTitleInformation;
		} else if (!this._getTitleHierarchyCache()[appSpecificHash]) {
			this._getTitleHierarchyCache()[appSpecificHash] = pageTitleInformation;
		}
		return pageTitleInformation;
	}

	/**
	 * This function updates the shell title after each navigation.
	 * @param view The current view
	 * @returns A promise that is resolved when the menu is filled properly
	 * @private
	 */
	async computeTitleHierarchy(view: View): Promise<void> {
		const appComponent = this.getAppComponent(),
			context = view.getBindingContext(),
			currentPage = view.getParent(),
			titleInfoHierarchySeq: TitleInformation[] = [],
			appSpecificHash = this.getAppSpecificHash(),
			manifestAppSettings = appComponent.getManifestEntry("sap.app"),
			appTitle = manifestAppSettings.title || "",
			appSubTitle = manifestAppSettings.subTitle || "",
			appIcon = manifestAppSettings.icon || "";
		let pageTitleInformation: TitleInformation, newPath: string | undefined;

		if (currentPage && (currentPage as TemplateComponent)._getPageTitleInformation) {
			if (context) {
				// If the first page of the application is a LR, use the title and subtitle from the manifest
				if (["sap.fe.templates.ListReport", "sap.fe.ariba.ListReport"].includes(this.getTargetTypeFromHash(""))) {
					titleInfoHierarchySeq.push(
						await this.getRootLevelTitleInformation(
							this.removeEmptyParamFromHash(appComponent, appSpecificHash),
							appTitle,
							appSubTitle,
							appIcon
						)
					);
				}

				// Then manage other pages
				newPath = context.getPath();
				const pathParts = newPath.split("/");
				let path = "";

				pathParts.shift(); // Remove the first segment (empty string) as it has been managed above
				pathParts.pop(); // Remove the last segment as it corresponds to the current page and shouldn't appear in the menu

				for (const pathPart of pathParts) {
					path += `/${pathPart}`;
					//if the associated target is not declared in the routes, we skip it
					if (!appComponent.getRouter().getRouteInfoByHash(path)) {
						continue;
					}
					const metaModel = appComponent.getMetaModel(),
						parameterPath = metaModel.getMetaPath(path),
						isParameterized = metaModel.getObject(`${parameterPath}/@com.sap.vocabularies.Common.v1.ResultContext`);
					if (!isParameterized) {
						titleInfoHierarchySeq.push(await this.getTitleInfoFromPath(path));
					}
				}
			}

			// Current page
			pageTitleInformation = await this._createCurrentPageTitleInfo(currentPage as TemplateComponent, context, newPath);
		} else {
			throw new Error("Title information missing in HeaderInfo");
		}
		try {
			//We now use directly the hierarchy already sequentially resolved
			const titleInfoHierarchy = titleInfoHierarchySeq;
			// workaround for shell which is expecting all elements being of type string
			const titleInfoHierarchyShell = this._ensureHierarchyElementsAreStrings(titleInfoHierarchy);
			titleInfoHierarchyShell.reverse();
			await appComponent.getShellServices().setHierarchy(titleInfoHierarchyShell);

			await this._setTitles(appTitle, pageTitleInformation, view as FEView);
			return;
		} catch (errorMessage: unknown) {
			Log.error(errorMessage as string);
		} finally {
			this.bIsComputingTitleHierachy = false;
		}
	}

	/**
	 * Retrieve the title information for the root level.
	 * @param appSpecificHash The application-specific hash
	 * @param appTitle The application title
	 * @param appSubTitle The application subtitle
	 * @param appIcon The application icon
	 * @returns A Promise containing the title information
	 */
	async getRootLevelTitleInformation(
		appSpecificHash: string,
		appTitle: string,
		appSubTitle: string,
		appIcon: string
	): Promise<TitleInformation> {
		const oTitleHierarchyCache = this._getTitleHierarchyCache();

		if (oTitleHierarchyCache[appSpecificHash]) {
			// The title info is already stored in the cache
			return Promise.resolve(oTitleHierarchyCache[appSpecificHash]);
		} else {
			return Promise.resolve(this._computeTitleInfo(appTitle, appSubTitle, appSpecificHash, undefined, appIcon));
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	calculateLayout(iNextFCLLevel: number, sHash: string, sProposedLayout: string | undefined, keepCurrentLayout = false): string {
		return "";
	}

	/**
	 * Callback after a view has been bound to a context.
	 * @param oContext The context that has been bound to a view
	 */
	onContextBoundToView(oContext: Context | undefined | null): void {
		if (oContext) {
			const sDeepestPath = this.getView().getModel("internal").getProperty("/deepestPath"),
				sViewContextPath = oContext.getPath();

			if (!sDeepestPath || sDeepestPath.indexOf(sViewContextPath) !== 0) {
				// There was no previous value for the deepest reached path, or the path
				// for the view isn't a subpath of the previous deepest path --> update
				this.getView().getModel("internal").setProperty("/deepestPath", sViewContextPath, undefined, true);
			}
		}
	}

	async displayErrorPage(_errorMessage: string, _parameters: NavigationToErrorPageResult, _FCLLevel = 0): Promise<boolean> {
		// To be overridden
		return Promise.resolve(true);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	updateUIStateForView(oView: FEView, FCLLevel: number): void {
		// To be overriden
	}

	getInstancedViews(): View[] {
		return [];
		// To be overriden
	}

	/**
	 * Return all visible views.
	 * @returns The visible views
	 */
	getVisibleViews(): View[] {
		return [];
		// To be overriden
	}

	_scrollTablesToLastNavigatedItems(): void {
		// To be overriden
	}

	isFclEnabled(): this is FclController {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async _setShellMenuTitle(
		oAppComponent: AppComponent,
		sTitle: string,
		sAppTitle: string,
		additionalInformation?: TitleAdditionalInfo
	): Promise<void> {
		// To be overriden by FclController
		await oAppComponent.getShellServices().setTitle(sTitle, additionalInformation);
	}

	getAppContentContainer(): NavContainer | FlexibleColumnLayout {
		const oAppComponent = this.getAppComponent();
		const appContentId = oAppComponent.getManifestEntry("sap.ui5").routing?.config?.controlId ?? "appContent";
		return this.getView().byId(appContentId) as NavContainer | FlexibleColumnLayout;
	}

	/**
	 * Registers the callbacks related to an edit session (sticky or hidden draft).
	 * @param dirtyStateProviderCallback Callback for dirty state provider
	 * @param discardAfterNavigationCallback Callback to discard session after navigation
	 * @param sessionTimeoutCallback Optional callback for session timeout
	 * @param confirmGuardCrossCallback Optional callback to confirm guard crossing with appropriate data loss dialog
	 */
	registerEditLifecycleCallbacks(
		dirtyStateProviderCallback: (navigationContext: { innerAppRoute: string }) => boolean | undefined,
		discardAfterNavigationCallback: () => Promise<void>,
		sessionTimeoutCallback?: () => void,
		confirmGuardCrossCallback?: () => Promise<boolean>
	): void {
		const appComponent = this.getAppComponent();

		this.dirtyStateProviderCallback = dirtyStateProviderCallback;
		appComponent.getShellServices().registerDirtyStateProvider(dirtyStateProviderCallback);

		if (sessionTimeoutCallback) {
			this.stickySessionTimeoutCallback = sessionTimeoutCallback;
			appComponent.getModel().attachSessionTimeout(sessionTimeoutCallback);
		}

		this.discardAfterNavigationCallback = discardAfterNavigationCallback;
		this._discardAfterNavHandler = (): void => {
			if (this.discardAfterNavigationCallback) {
				this.discardPromise = this.discardAfterNavigationCallback();
			}
		};
		appComponent.getRoutingService().attachRouteMatched({}, this._discardAfterNavHandler);

		this.confirmGuardCross = confirmGuardCrossCallback;
	}

	/**
	 * Unregisters the callbacks related to an edit session.
	 */
	unregisterEditLifecycleCallbacks(): void {
		const appComponent = this.getAppComponent();

		if (this.dirtyStateProviderCallback) {
			appComponent.getShellServices().deregisterDirtyStateProvider(this.dirtyStateProviderCallback);
			this.dirtyStateProviderCallback = undefined;
		}
		if (this.stickySessionTimeoutCallback && appComponent.getModel()) {
			appComponent.getModel().detachSessionTimeout(this.stickySessionTimeoutCallback);
			this.stickySessionTimeoutCallback = undefined;
		}
		if (this._discardAfterNavHandler) {
			appComponent.getRoutingService().detachRouteMatched(this._discardAfterNavHandler);
			this._discardAfterNavHandler = undefined;
			this.discardAfterNavigationCallback = undefined;
		}
		this.confirmGuardCross = undefined;
	}

	/**
	 * Waits for the edit cleanup to complete after navigation.
	 * Call this to ensure any pending discard operations have finished.
	 * @returns Promise that resolves when the cleanup is complete
	 */
	async waitForEditCleanup(): Promise<void> {
		return this.discardPromise;
	}
}
interface RootViewBaseController {
	onContainerReady?(): void;
}

export default RootViewBaseController;
