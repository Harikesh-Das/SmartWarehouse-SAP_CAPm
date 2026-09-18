import Log from "sap/base/Log";
import { defineUI5Class, implementInterface, property } from "sap/fe/base/ClassSupport";
import CommonUtils from "sap/fe/core/CommonUtils";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import draft from "sap/fe/core/controllerextensions/editFlow/draft";
import type { ManifestSettingsSapFE } from "sap/fe/core/converters/ManifestSettings";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import type { TitleInformation } from "sap/fe/core/rootView/RootViewBaseController";
import UI5Breadcrumbs from "sap/m/Breadcrumbs";
import type { Link$PressEvent } from "sap/m/Link";
import Link from "sap/m/Link";

export const hierachyModeOptions = {
	OBJECT: "objectNavigation",
	FULL: "fullNavigation"
} as const;
export type HierachyMode = (typeof hierachyModeOptions)[keyof typeof hierachyModeOptions];

/**
 * Building block used to create breadcrumbs.
 */
@defineUI5Class("sap.fe.macros.Breadcrumbs")
export default class Breadcrumbs extends BuildingBlock<UI5Breadcrumbs> {
	@implementInterface("sap.m.IBreadcrumbs")
	__implements__sap_m_IBreadcrumbs = true;

	/**
	 * Hierarchy mode for breadcrumbs
	 * @public
	 */
	@property({
		type: "string",
		defaultValue: hierachyModeOptions.OBJECT,
		allowedValues: Object.values(hierachyModeOptions)
	})
	hierarchyMode!: HierachyMode;

	onMetadataAvailable(): void {
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
	 */
	_getBreadcrumbsTitleInfos(fullPathForLinks: string): Promise<TitleInformation>[] {
		const promises: Promise<TitleInformation>[] = [],
			appComponent = this.getAppComponent()!,
			rootViewController = appComponent.getRootViewController(),
			metaModel = appComponent.getMetaModel(),
			pathParts = this._getBreadcrumbsPathParts(fullPathForLinks);

		let path = "";
		if (this.hierarchyMode === hierachyModeOptions.FULL) {
			// Home page
			const resourceModel = getResourceModel(this);
			const homeTitle = this._getFEManifestBreadcrumbSettings()?.home;
			promises.push(
				Promise.resolve({
					intent: "#" + (this.getAppComponent()?.getShellServices().getHomeIntent() ?? "Shell-home"),
					title: homeTitle
						? CommonUtils.getTranslatedTextFromExpBindingString(homeTitle, this)
						: resourceModel.getText("T_APP_HOME")
				})
			);
		}
		pathParts.forEach(
			function (this: Breadcrumbs, pathPart: string, idx: number): void {
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
			}.bind(this)
		);
		return promises;
	}

	/**
	 * Get path parts from the full path for links.
	 * @param fullPathForLinks The context path of the object page.
	 * @returns Path parts for creating breadcrumb links.
	 */
	_getBreadcrumbsPathParts(fullPathForLinks: string): string[] {
		const pathParts = fullPathForLinks?.split("/") ?? [];
		if (this.hierarchyMode !== hierachyModeOptions.FULL) {
			pathParts.shift(); // Remove ""
			pathParts.splice(-1, 1); // Remove current page
		}
		return pathParts;
	}

	async _getFirstPageTitleInformation(): Promise<TitleInformation> {
		const appComponent = this.getAppComponent()!,
			rootViewController = appComponent.getRootViewController(),
			manifestAppSettings = appComponent.getManifestEntry("sap.app"),
			appTitle = manifestAppSettings.title || "",
			appSubTitle = manifestAppSettings.subTitle || "",
			appIcon = manifestAppSettings.icon || "",
			appSpecificHash = rootViewController.getAppSpecificHash();

		const titleInfo = { ...(await rootViewController.getRootLevelTitleInformation(appSpecificHash, appTitle, appSubTitle, appIcon)) };
		titleInfo.subtitle = titleInfo.title;
		const spaceName = this._getFEManifestBreadcrumbSettings()?.space;
		titleInfo.title = spaceName ? CommonUtils.getTranslatedTextFromExpBindingString(spaceName, this) : "";
		return titleInfo;
	}

	_getFEManifestBreadcrumbSettings(): NonNullable<ManifestSettingsSapFE["app"]>["breadcrumbs"] | undefined {
		const appComponent = this.getAppComponent()!,
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
	 */
	async setBreadcrumbLinks(fullPathForLinks = this.getBindingContext()?.getPath()): Promise<void> {
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
			const titleHierarchyInfos: TitleInformation[] = await Promise.all(this._getBreadcrumbsTitleInfos(fullPathForLinks));
			titleHierarchyInfos.forEach(this.updateBreadcrumbLink.bind(this));
		} catch (error: unknown) {
			Log.error("Error while setting the breadcrumb links: " + error);
		}
	}

	/**
	 * Update the breadcrumb link at the specified hierarchy position.
	 * @param titleHierarchyInfo The title information for the link
	 * @param hierarchyPosition The position of the link in the hierarchy
	 * @param titleHierarchyInfos The array of all title information for the hierarchy
	 */
	updateBreadcrumbLink(titleHierarchyInfo: TitleInformation, hierarchyPosition: number, titleHierarchyInfos: TitleInformation[]): void {
		const breadcrumbsCtrl = this.getContent()!;
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
			link.setHref(encodeURI(titleHierarchyInfo.intent!));

			// Attach press handler to check for draft data loss before navigation. Only required for the first two breadcrumb
			// links in FULL mode (home and LR), as in OBJECT mode, breadcrumbs start from the sub object page, wherein no
			// popup is required.
			if (
				this.hierarchyMode === hierachyModeOptions.FULL &&
				hierarchyPosition <= 1 &&
				this.getPageController().isA("sap.fe.templates.ObjectPage.ObjectPageController")
			) {
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
	 */
	async onLinkPress(event: Link$PressEvent): Promise<void> {
		event.preventDefault();
		const href = event.getSource().getHref();
		const pageController = this.getPageController();
		const bindingContext = pageController.getView().getBindingContext();

		if (ModelHelper.isDraftSupported(bindingContext.getModel().getMetaModel(), bindingContext.getPath())) {
			await draft.processDataLossOrDraftDiscardConfirmation(
				() => {
					window.location.hash = href;
				},
				Function.prototype,
				pageController.getView().getBindingContext(),
				pageController,
				true,
				draft.NavigationType.BackNavigation,
				undefined,
				undefined,
				true
			);
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
	 */
	getLinkText(titleInfo: TitleInformation, isLastLink: boolean, hierarchyPosition: number): string | undefined {
		const { title, subtitle } = titleInfo;
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
	}

	createContent(): UI5Breadcrumbs {
		const viewId = this.getPageController()?.getView().getId();
		return (
			<UI5Breadcrumbs
				// This is set as absolute ID.
				id={viewId ? generate([`${viewId}--fe`, "Breadcrumbs"]) : undefined}
				modelContextChange={(): void => {
					this.setBreadcrumbLinks();
				}}
			></UI5Breadcrumbs>
		);
	}
}
