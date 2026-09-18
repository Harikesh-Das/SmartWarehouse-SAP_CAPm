import Log from "sap/base/Log";
import type DynamicPage from "sap/f/DynamicPage";
import { defineUI5Class, extensible, publicExtension, usingExtension } from "sap/fe/base/ClassSupport";
import type { FEView } from "sap/fe/core/BaseController";
import BaseController from "sap/fe/core/BaseController";
import ExtensionAPI from "sap/fe/core/ExtensionAPI";
import CollaborativeDraft from "sap/fe/core/controllerextensions/CollaborativeDraft";
import EditFlow from "sap/fe/core/controllerextensions/EditFlow";
import InlineEditFlow from "sap/fe/core/controllerextensions/InlineEditFlow";
import IntentBasedNavigation from "sap/fe/core/controllerextensions/IntentBasedNavigation";
import InternalIntentBasedNavigation from "sap/fe/core/controllerextensions/InternalIntentBasedNavigation";
import InternalRouting from "sap/fe/core/controllerextensions/InternalRouting";
import MessageHandler from "sap/fe/core/controllerextensions/MessageHandler";
import PageReady from "sap/fe/core/controllerextensions/PageReady";
import Paginator from "sap/fe/core/controllerextensions/Paginator";
import Placeholder from "sap/fe/core/controllerextensions/Placeholder";
import Recommendations from "sap/fe/core/controllerextensions/Recommendations";
import Routing from "sap/fe/core/controllerextensions/Routing";
import Share from "sap/fe/core/controllerextensions/Share";
import SideEffects from "sap/fe/core/controllerextensions/SideEffects";
import ViewState from "sap/fe/core/controllerextensions/ViewState";
import Scope from "sap/fe/core/formatters/Scope";
import type { TitleInformation } from "sap/fe/core/rootView/RootViewBaseController";

import MessageBox from "sap/m/MessageBox";
import Component from "sap/ui/core/Component";
import InvisibleText from "sap/ui/core/InvisibleText";
import Library from "sap/ui/core/Lib";
import type View from "sap/ui/core/mvc/View";
import type Control from "sap/ui/mdc/Control";
import type Model from "sap/ui/model/Model";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";
import type { TitleAdditionalInfo } from "sap/ushell/ui5service/ShellUIService";
import type ObjectPageLayout from "sap/uxap/ObjectPageLayout";
import ContextSharing from "./controllerextensions/ContextSharing";
import CollaborationManager from "./controllerextensions/cards/CollaborationManager";
/**
 * Base controller class for your custom page used inside an SAP Fiori elements application.
 *
 * This controller provides preconfigured extensions that ensure you have the basic functionalities required to use the building blocks.
 * @hideconstructor
 * @public
 * @since 1.88.0
 */
@defineUI5Class("sap.fe.core.PageController")
class PageController extends BaseController {
	@usingExtension(Routing)
	routing!: Routing;

	@usingExtension(CollaborativeDraft)
	collaborativeDraft!: CollaborativeDraft;

	@usingExtension(
		InternalRouting.override({
			onAfterBinding: function (this: InternalRouting) {
				const view = this.getView();
				const controller = view.getController() as PageController;
				controller._onInternalAfterBinding();
			}
		})
	)
	_routing!: InternalRouting;

	@usingExtension(EditFlow)
	editFlow!: EditFlow;

	@usingExtension(IntentBasedNavigation)
	intentBasedNavigation!: IntentBasedNavigation;

	@usingExtension(InternalIntentBasedNavigation)
	_intentBasedNavigation!: InternalIntentBasedNavigation;

	@usingExtension(PageReady)
	pageReady!: PageReady;

	@usingExtension(MessageHandler)
	messageHandler!: MessageHandler;

	@usingExtension(Share)
	share!: Share;

	@usingExtension(Paginator)
	paginator!: Paginator;

	@usingExtension(ViewState)
	viewState!: ViewState;

	@usingExtension(Placeholder)
	placeholder!: Placeholder;

	/**
	 * A controller extension providing hooks into the event-driven side effects flow of the application.
	 * @public
	 * @since 1.148.0
	 */
	@usingExtension(SideEffects)
	sideEffects!: SideEffects;

	@usingExtension(Recommendations)
	recommendations!: Recommendations;

	@usingExtension(ContextSharing)
	contextSharing!: ContextSharing;

	@usingExtension(CollaborationManager)
	collaborationManager!: CollaborationManager;

	@usingExtension(InlineEditFlow)
	inlineEditFlow!: InlineEditFlow;

	extension!: Record<string, unknown>;

	_oView?: View;

	routingTargetName?: string;

	private invisibleAriaLabels: string[] = [];

	protected extensionAPI?: ExtensionAPI;

	protected _formatters = Scope._formatters;

	initialisationForPageControllerDoneProperly = false;

	constructor(name: string) {
		super(name);

		const ownProps = Object.getOwnPropertyNames(this.constructor.prototype);
		if (ownProps.includes("_isExtension")) {
			ownProps.splice(0, 0, ...Object.getOwnPropertyNames(Object.getPrototypeOf(this.constructor.prototype))); // Case when we have an extension to the controller (ie.: ariba)
		}
		for (const ownProp of ownProps) {
			if (ownProp !== "constructor" && ownProp !== "getMetadata" && ownProp !== "extension") {
				const fnProp = (this as Record<string, unknown>)[ownProp];
				if (fnProp && typeof fnProp === "function" && !(fnProp as { getMetadata?: Function }).getMetadata) {
					(this as Record<string, unknown>)[ownProp] = (...args: unknown[]): unknown => {
						const ownerComponent = Component.getOwnerComponentFor(this.getView());
						if (ownerComponent) {
							return ownerComponent.runAsOwner(() => fnProp.apply(this, args));
						} else {
							return fnProp.apply(this, args);
						}
					};
				}
			}
		}

		Object.defineProperty(this, "oView", {
			get(): View | undefined {
				return this._oView;
			},
			set(v: View) {
				this._oView = v;
				// On the initial view instantiation from XML the templating process may be finished before the view is completely created
				// When that happens we need to ensure that the root controller is available on the TemplateComponent
				this.getOwnerComponent()?.setRootController?.(this);
			}
		});
	}

	@publicExtension()
	onInit(): void {
		const ownerComponent = this.getOwnerComponent();
		const fnModel = this.getView().getModel;
		this.getView().getModel = ((modelName?: string): Model | undefined => {
			if (modelName === "$cmd") {
				return fnModel.apply(this.getView(), [modelName]);
			}
			return fnModel.apply(this.getView(), [modelName]) ?? ownerComponent.getModel(modelName);
		}) as unknown as FEView["getModel"];

		this.initialisationForPageControllerDoneProperly = true;
	}

	@publicExtension()
	onBeforeRendering(): void {
		if (!this.initialisationForPageControllerDoneProperly) {
			Log.error(
				"PageController onInit didn't run properly. Your Controller.onInit() method might not extend the sap.fe.core.PageController onInit method properly. "
			);
		}
		if (this.placeholder.attachHideCallback) {
			this.placeholder.attachHideCallback();
		}
	}

	/**
	 * Get the extension API for the current page.
	 * @param id PRIVATE
	 * @public
	 * @returns The extension API.
	 */
	@publicExtension()
	getExtensionAPI(id?: string): ExtensionAPI {
		if (!this.extensionAPI) {
			this.extensionAPI = new ExtensionAPI(this, id);
		}
		return this.extensionAPI;
	}

	// We specify the extensibility here the same way as it is done in the object page controller
	// since the specification here overrides it and if we do not specify anything here, the
	// behavior defaults to an execute instead!
	// TODO This may not be ideal, since it also influences the list report controller but currently it's the best solution.
	@publicExtension()
	@extensible("After")
	onPageReady(_mParameters: unknown): void {
		// Could be overridden by the implmenting controller.
	}

	async _getPageTitleInformation(): Promise<TitleInformation> {
		return Promise.resolve({} as TitleInformation);
	}

	/**
	 * Get the browser title of the object page.
	 * @param pageTitleInformation Present page title information
	 * @returns Title information to be used by shell services for browser title
	 */
	async _getBrowserTitle(pageTitleInformation: TitleInformation): Promise<TitleAdditionalInfo | undefined> {
		const { subtitle, title, description } = pageTitleInformation;
		let titleAggregator: string | undefined;
		const titleExists = title !== undefined && title !== null && title !== "";
		const subtitleExists = subtitle !== undefined && subtitle !== null && subtitle !== "";
		const descriptionExists = description !== undefined && description !== null && description !== "";

		// Apply title formatting rules based on available components
		if (titleExists && subtitleExists && descriptionExists) {
			// Rule 1: '<subTitle> (<description>) - <title>'
			titleAggregator = `${subtitle} (${description}) - ${title}`;
		} else if (titleExists && subtitleExists) {
			// Rule 2: '<subTitle> - <title>'
			titleAggregator = `${subtitle} - ${title}`;
		} else if (subtitleExists && descriptionExists) {
			// Rule 3: '<subTitle> (<description>)'
			titleAggregator = `${subtitle} (${description})`;
		} else if (titleExists && descriptionExists) {
			// Rule 4: '<description> - <title>'
			titleAggregator = `${description} - ${title}`;
		} else if (titleExists) {
			// Rule 5: '<title>'
			titleAggregator = title;
		} else if (subtitleExists) {
			// Rule 6: '<subTitle>'
			titleAggregator = subtitle;
		} else if (descriptionExists) {
			// Rule 7: '<description>'
			titleAggregator = description;
		} else {
			// Rule 8: None exists, log warning and return undefined
			const view = this.getView();
			Log.warning(`No title, subtitle, or description available for browser title of page: ${view.getId()}`);
			return Promise.resolve(undefined);
		}

		return Promise.resolve({ headerText: titleAggregator });
	}

	_getPageModel(): JSONModel | undefined {
		const pageComponent = Component.getOwnerComponentFor(this.getView());
		return pageComponent?.getModel("_pageModel") as JSONModel;
	}

	/**
	 * Opens one or more new tabs with the given outbound target for the selected contexts.
	 * @param outboundTarget The outbound target
	 * @param contexts The selected contexts
	 * @param createPath The create path
	 * @param maxNumberOfSelectedItems The maximum number of selected items
	 * @param [targetControlId] Local ID of the target section or subsection to navigate to after opening the new tab
	 */
	onOpenInNewTabNavigateOutBound(
		outboundTarget: string,
		contexts: Context[],
		createPath: string,
		maxNumberOfSelectedItems: number,
		targetControlId?: string
	): void {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const that = this;
		if (contexts.length <= maxNumberOfSelectedItems) {
			contexts.forEach(function (context: Context) {
				that._intentBasedNavigation.onChevronPressNavigateOutBound(
					that,
					outboundTarget,
					context,
					createPath,
					"explace",
					targetControlId
				);
			});
		} else {
			MessageBox.warning(
				Library.getResourceBundleFor("sap.fe.macros")!.getText("T_TABLE_NAVIGATION_TOO_MANY_ITEMS_SELECTED", [
					maxNumberOfSelectedItems
				])
			);
		}
	}

	_onInternalAfterBinding(): void {
		const view = this.getView();
		this.pageReady.waitFor(this.getAppComponent().getAppStateHandler().applyAppState(view));

		if (this.isCustomPage()) {
			const binding = (view.getBindingContext() as Context | undefined)?.getBinding();
			binding?.attachEvent("patchSent", () => {
				const uiContext = view.getBindingContext("ui");
				if (uiContext?.getProperty("isEditable") !== false) {
					this.messageHandler.removeTransitionMessages();
				}
			});
		}
	}

	/**
	 * Get the name of the page as defined in the manifest routing section.
	 * @returns The name of the page
	 */
	getRoutingTargetName(): string {
		if (!this.routingTargetName) {
			this.routingTargetName = this.getAppComponent().getRoutingService().getTargetNameForView(this.getView()) ?? "";
		}
		return this.routingTargetName;
	}

	/**
	 * Method to forward setShowFooter on the first content of the view if recognized.
	 * @param show
	 */
	setShowFooter(show = false): void {
		const page = this.getView().getContent()[0];
		if (page.isA<DynamicPage>("sap.f.DynamicPage") || page.isA<ObjectPageLayout>("sap.uxap.ObjectPageLayout")) {
			if (page.getShowFooter() !== show) {
				// setting showFooter triggers an animation so we only do it when needed
				page.setShowFooter(show);
			}
		}
	}

	/**
	 * Method to get the footer.
	 * @returns The footer of the page if it exists
	 */
	getFooter(): Control | undefined {
		const page = this.getView().getContent()[0];
		if (page.isA<DynamicPage>("sap.f.DynamicPage") || page.isA<ObjectPageLayout>("sap.uxap.ObjectPageLayout")) {
			return page.getFooter() as unknown as Control;
		}
		return undefined;
	}

	/**
	 * Adds an InvisibleText control to the view with the provided id and text.
	 * @param id
	 * @param text
	 */
	addAriaInvisibleText(id: string, text: string): void {
		if (this.invisibleAriaLabels.includes(id)) {
			return;
		}
		this.invisibleAriaLabels.push(id);
		const invisibleText = new InvisibleText({
			id: id,
			text: text
		});
		// ensure the invisible text is destroyed with teh view
		this.getView().addDependent(invisibleText);

		invisibleText.toStatic();
	}

	/**
	 * Checks whether the view controlled by this controller is currently visible.
	 * @returns True if the view is visible, false otherwise
	 */
	isViewVisible(): boolean {
		const visibleViewsId = this.getAppComponent()
			.getRootViewController()
			.getVisibleViews()
			.map((view: View) => view.getId());
		return visibleViewsId.includes(this.getView().getId());
	}

	/**
	 * Checks whether the page is used as a custom page.
	 * @returns True if the page is used as a custom page, false otherwise
	 */
	isCustomPage(): boolean {
		return this.getOwnerComponent().isA("sap.fe.core.fpm.Component");
	}
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export default PageController;
