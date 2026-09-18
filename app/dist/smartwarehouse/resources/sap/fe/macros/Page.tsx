import DynamicPage from "sap/f/DynamicPage";
import DynamicPageAccessibleLandmarkInfo from "sap/f/DynamicPageAccessibleLandmarkInfo";
import DynamicPageHeader from "sap/f/DynamicPageHeader";
import DynamicPageTitle from "sap/f/DynamicPageTitle";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { aggregation, association, defineUI5Class, property } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import BusyLocker from "sap/fe/core/controllerextensions/BusyLocker";
import CommandExecution from "sap/fe/core/controls/CommandExecution";
import Avatar from "sap/fe/macros/controls/Avatar";
import ObjectTitle from "sap/fe/macros/ObjectTitle";
import Share from "sap/fe/macros/Share";
import ShareOptions from "sap/fe/macros/share/ShareOptions";
import type AvatarImageFitType from "sap/m/AvatarImageFitType";
import AvatarShape from "sap/m/AvatarShape";
import AvatarSize from "sap/m/AvatarSize";
import FlexBox from "sap/m/FlexBox";
import HBox from "sap/m/HBox";
import Label from "sap/m/Label";
import Title from "sap/m/Title";
import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import { AccessibleLandmarkRole } from "sap/ui/core/library";
import type Context from "sap/ui/model/odata/v4/Context";
import MsTeamsOptions from "./share/MsTeamsOptions";

/**
 * Building block used to create a custom page with a title and the content. By default, the page includes a title.
 * @public
 */
@defineUI5Class("sap.fe.macros.Page")
export default class Page extends BuildingBlock {
	/**
	 * Content(s) of the page
	 * @public
	 */
	@aggregation({ type: "sap.ui.core.Control", multiple: true, isDefault: true })
	items!: Control[];

	/**
	 * Actions to be displayed in the title area (for example, Edit and Delete buttons).
	 * @public
	 */
	@aggregation({ type: "sap.ui.core.Control", multiple: true })
	actions!: Control[];

	/**
	 * Breadcrumbs to be displayed in the title area.
	 * @public
	 */
	@aggregation({ type: "sap.ui.core.Control", multiple: true })
	breadcrumbs!: Control[];

	/**
	 * Navigation actions to be displayed in the title area.
	 * @public
	 */
	@aggregation({ type: "sap.ui.core.Control", multiple: true })
	navigationActions!: Control[];

	/**
	 * Content to be displayed next to the title (for example, GenericTag and Icon).
	 * @public
	 */
	@aggregation({ type: "sap.ui.core.Control", multiple: true })
	titleContent!: Control[];

	/**
	 * Footer content (for example, toolbar with buttons).
	 * @public
	 */
	@aggregation({ type: "sap.ui.core.Control", multiple: false })
	footer?: Control;

	/**
	 * Additional content to be displayed in the header after the avatar.
	 * @public
	 */
	@aggregation({ type: "sap.ui.core.Control", multiple: true })
	headerContent!: Control[];

	/**
	 * Title of the page. If no title is provided, the title, avatar, and description are derived from the unqualified HeaderInfo annotation associated with the entity.
	 * Can be a string or a binding info object.
	 * @public
	 */
	@property({
		type: "string",
		isBindingInfo: true
	})
	title?: string | PropertyBindingInfo;

	/**
	 * @private
	 */
	@property({ type: "boolean" })
	editable = false;

	/**
	 * Provides additional details of the page. This property is considered only if the title property is defined.
	 * Can be a string or a binding info object.
	 * @public
	 */
	@property({
		type: "string",
		isBindingInfo: true
	})
	description?: string;

	/**
	 * Source of the avatar image. This property is considered only if the title property is defined.
	 * @public
	 */
	@property({ type: "string" })
	avatarSrc?: string;

	/**
	 * ImageFitType of the avatar image. This property is only considered if the title property is defined.
	 * @public
	 */
	@property({ type: "string", allowedValues: ["Cover", "Contain"] })
	avatarImageFitType?: AvatarImageFitType;

	/**
	 * Controls the visibility of the footer.
	 * @public
	 */
	@property({ type: "boolean" })
	showFooter?: boolean;

	/**
	 * Reference to a control that provides sticky subheader content.
	 * @public
	 */
	@association({ type: "sap.ui.core.Control", multiple: false })
	stickySubheaderProvider?: string;

	constructor(idOrSettings: string);

	constructor(idOrSettings: PropertiesOf<Page>);

	constructor(idOrSettings: string | PropertiesOf<Page>, settings?: PropertiesOf<Page>) {
		super(idOrSettings, settings);
	}

	onMetadataAvailable(): void {
		this.content = this.createContent();
	}

	private createAvatar(isExpanded: boolean): Avatar | undefined {
		if (this.avatarSrc) {
			return (
				<Avatar
					src={this.avatarSrc}
					displayShape={AvatarShape.Square}
					displaySize={isExpanded ? AvatarSize.L : AvatarSize.S}
					imageFitType={this.avatarImageFitType}
				/>
			);
		}
	}

	private createTitle(): Title {
		return <Title text={this.title} />;
	}

	private createDescription(): Label {
		return <Label text={this.description} />;
	}

	private getTitlePart(): FlexBox | ObjectTitle {
		if (this.title && this.description) {
			return <FlexBox direction="Column">{{ items: [this.createTitle(), this.createDescription()] }}</FlexBox>;
		} else if (this.title) {
			return <FlexBox direction="Column">{{ items: [this.createTitle()] }}</FlexBox>;
		} else {
			return <ObjectTitle />;
		}
	}

	/**
	 * Returns the Share action with share options.
	 * @returns The Share action control.
	 */
	getShareAction(): Control {
		return (
			<Share id={this.createId("share")}>
				{{
					shareOptions: <ShareOptions showSendEmail="true" showCollaborationManager="true" />,
					msTeamsOptions: <MsTeamsOptions enableCard="false" />
				}}
			</Share>
		);
	}

	private createHeaderWithContent(): DynamicPageHeader {
		const headerItems: Control[] = [];
		const avatar = this.createAvatar(true);
		const hboxItems: Control[] = [];
		if (avatar) {
			hboxItems.push(avatar);
		}
		// Add spacing and additional header content if provided
		if (this.headerContent && this.headerContent.length > 0) {
			this.headerContent.forEach((content) => {
				content.addStyleClass("sapUiMediumMarginEnd");
				content.addStyleClass("sapUiSmallMarginBottom");
				hboxItems.push(content);
			});
		}
		headerItems.push(<HBox>{{ items: hboxItems }}</HBox>);
		return <DynamicPageHeader>{{ content: headerItems }}</DynamicPageHeader>;
	}

	private createContent(): DynamicPage {
		const stickySubheaderProviderId = this.getAssociation("stickySubheaderProvider", null) as string | undefined;
		const hasUShell = this.getAppComponent()?.getEnvironmentCapabilities().getCapabilities().UShell ?? true; // Default to true (FLP)
		const headerRole = hasUShell ? AccessibleLandmarkRole.None : AccessibleLandmarkRole.Banner;
		return (
			<DynamicPage
				id={this.createId("page")}
				showFooter={this.showFooter}
				class={stickySubheaderProviderId ? "sapUiNoContentPadding" : undefined}
				stickySubheaderProvider={stickySubheaderProviderId}
				landmarkInfo={
					<DynamicPageAccessibleLandmarkInfo
						headerRole={headerRole}
						headerLabel={this.getTranslatedText("T_COMMON_CUSTOM_PAGE_HEADER")}
					/>
				}
			>
				{{
					title: (
						<DynamicPageTitle id={this.createId("title")}>
							{{
								expandedHeading: this.getTitlePart(),
								snappedHeading: (
									<FlexBox renderType="Bare">{{ items: [this.createAvatar(false), this.getTitlePart()] }}</FlexBox>
								),
								breadcrumbs: this.breadcrumbs,
								navigationActions: this.navigationActions,
								content: this.titleContent,
								actions: this.actions.concat(this.getShareAction())
							}}
						</DynamicPageTitle>
					),
					header: this.createHeaderWithContent(),
					footer: this.footer,
					content: stickySubheaderProviderId
						? this.items.map((item) => {
								return item;
						  })
						: [
								<FlexBox id={this.createId("content")} direction="Column">
									{{
										items: this.items.map((item) => {
											item.addStyleClass("sapUiMediumMarginBottom");
											return item;
										})
									}}
								</FlexBox>
						  ],
					dependents: [
						<CommandExecution
							execute={(): void => {
								const oContext = this.getBindingContext() as Context;
								const oModel = this.getModel("ui")!;
								BusyLocker.lock(oModel);
								this.getPageController()
									?.editFlow?.editDocument(oContext)
									.finally(function () {
										BusyLocker.unlock(oModel);
									});
							}}
							enabled={true}
							visible={true}
							command="Edit"
						/>
					]
				}}
			</DynamicPage>
		);
	}
}
