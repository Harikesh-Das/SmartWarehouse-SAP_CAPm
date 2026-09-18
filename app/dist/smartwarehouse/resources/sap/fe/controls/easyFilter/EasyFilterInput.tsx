import Log from "sap/base/Log";
import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import type { PathInModelExpression } from "sap/fe/base/BindingToolkit";
import { bindState, equal, length, lessThan, not } from "sap/fe/base/BindingToolkit";
import { aggregation, defineState, defineUI5Class, event, property, type PropertiesOf, type StateOf } from "sap/fe/base/ClassSupport";
import EventDelegateHook from "sap/fe/base/EventDelegateHook";
import jsx from "sap/fe/base/jsx-runtime/jsx";
import ShellHistoryProvider from "sap/fe/controls/easyFilter/ShellHistoryProvider";
import type { Button$PressEvent } from "sap/m/Button";
import Button from "sap/m/Button";
import CustomListItem from "sap/m/CustomListItem";
import FlexBox from "sap/m/FlexBox";
import HBox from "sap/m/HBox";
import IllustratedMessage from "sap/m/IllustratedMessage";
import IllustratedMessageSize from "sap/m/IllustratedMessageSize";
import IllustratedMessageType from "sap/m/IllustratedMessageType";
import type { Input$LiveChangeEvent } from "sap/m/Input";
import Input from "sap/m/Input";
import List from "sap/m/List";
import type { ListBase$DeleteEvent } from "sap/m/ListBase";
import Popover from "sap/m/Popover";
import type StandardListItem from "sap/m/StandardListItem";
import Text from "sap/m/Text";
import Title from "sap/m/Title";
import { ButtonType, FlexAlignItems, FlexDirection, FlexJustifyContent, FlexWrap, ListMode, PlacementType } from "sap/m/library";
import type UI5Event from "sap/ui/base/Event";
import type { $ControlSettings } from "sap/ui/core/Control";
import Control from "sap/ui/core/Control";
import CustomData from "sap/ui/core/CustomData";
import InvisibleMessage from "sap/ui/core/InvisibleMessage";
import Lib from "sap/ui/core/Lib";
import type RenderManager from "sap/ui/core/RenderManager";
import { InvisibleMessageMode, TitleLevel, ValueState } from "sap/ui/core/library";
import type Context from "sap/ui/model/Context";
import type { EventHandler } from "../../../../../../../types/extension_types";
import { triggerPXIntegration } from "./PXFeedback";

type RecentType = {
	text: string;
	isFavorite: boolean;
};
@defineUI5Class("sap.fe.controls.easyFilter.EasyFilterInput")
export default class EasyFilterInput extends Control {
	@aggregation({ type: "sap.m.Input", multiple: false, isDefault: true })
	$searchInput!: Input;

	@property({ type: "string" })
	appId?: string;

	@property({ type: "array" })
	recommendedValues?: string[];

	@event()
	queryChanged?: EventHandler<UI5Event<{ query: string }, EasyFilterInput>>;

	@event()
	enterPressed?: EventHandler<UI5Event<{ query: string }, EasyFilterInput>>;

	@event()
	liveChange?: EventHandler;

	private resourceBundle!: ResourceBundle;

	shellHistoryProvider: ShellHistoryProvider | undefined;

	popoverInvisibleMessage: InvisibleMessage | undefined;

	$favoritePopover: Popover | undefined;

	private favoriteButtonClicked = false;

	@defineState()
	protected state: StateOf<{
		queryChanged: boolean;
		recentQueries: readonly string[];
		recentQueriesWitFavorites: readonly RecentType[];
		isHistoryEnabled: boolean;
		favoriteQueries: string[];
		recommendedQueries: string[];
		currentExecutedQuery: string;
		isQuerySuccessful: boolean;
		favoriteIconName: string;
		favoriteIconEnabled: boolean;
	}> = {
		queryChanged: false,
		isHistoryEnabled: false,
		recentQueries: [],
		recentQueriesWitFavorites: [],
		favoriteQueries: [] as string[],
		recommendedQueries: [] as string[],
		currentExecutedQuery: "",
		isQuerySuccessful: false,
		favoriteIconName: "sap-icon://add-favorite",
		favoriteIconEnabled: true
	};

	constructor(properties: string | ($ControlSettings & PropertiesOf<EasyFilterInput>), others?: $ControlSettings) {
		super(properties as string, others);
		this.initialize();
	}

	public getValue(): string {
		return this.$searchInput.getValue();
	}

	public isHistoryEnabled(): boolean {
		return this.state.isHistoryEnabled.valueOf();
	}

	setValue(value: string): this {
		this.$searchInput.setValue(value);
		return this;
	}

	setPlaceholder(value: string): this {
		this.$searchInput.setPlaceholder(value);
		return this;
	}

	public getPlaceholder(): string {
		return this.$searchInput.getPlaceholder();
	}

	initialize(): void {
		this.state.recommendedQueries = this.recommendedValues ?? [];
		this.resourceBundle = Lib.getResourceBundleFor("sap.fe.controls")!;
		this.popoverInvisibleMessage = InvisibleMessage.getInstance();
		this.createInput();
	}

	setAsInvalid(message: string): void {
		this.$searchInput.setValueState(ValueState.Warning);
		this.$searchInput.setValueStateText(message);
		this.$searchInput.openValueStateMessage();
	}

	setAsValid(): void {
		this.$searchInput.setValueState(ValueState.None);
		this.$searchInput.closeValueStateMessage();
	}

	createInput(): void {
		this.$searchInput = (
			<Input
				width="100%"
				showClearIcon={not(bindState(this.state, "isQuerySuccessful"))}
				showValueHelp={bindState(this.state, "isQuerySuccessful")}
				valueHelpIconSrc={bindState(this.state, "favoriteIconName")}
				valueHelpRequest={(): void => {
					this.onFavoriteIconPress();
				}}
				change={(e): void => {
					this.fireEvent("queryChanged", { query: e.getParameter("value") });
				}}
				liveChange={(e: Input$LiveChangeEvent): void => {
					this.state.queryChanged = true;
					// When user starts typing, hide favorite icon and show X
					this.state.isQuerySuccessful = false;
					if (e.getParameter("value") === "") {
						this.state.currentExecutedQuery = "";
						this.setPlaceholder(this.resourceBundle.getText("M_EASY_FILTER_PLACEHOLDER"));
					}
					this.fireEvent("liveChange");
					if (!e.getSource().getValue() && !(this.$favoritePopover?.isOpen() ?? false)) {
						this.openSuggestionPopover();
					}
					if (this.$searchInput.getValueState() === ValueState.Warning) {
						this.setAsValid();
					}
				}}
				placeholder={this.resourceBundle.getText("M_EASY_FILTER_PLACEHOLDER")}
			/>
		);

		const favoritePopover = this.createFavoritePopover();
		this.$favoritePopover = favoritePopover;

		this.$searchInput.addDependent(favoritePopover);
		this.$searchInput.addEventDelegate({
			onkeyup: (e: KeyboardEvent) => {
				if (e.key === "Enter") {
					this.onEnterPressed();
				}
				if (this.$favoritePopover && this.$searchInput.getValue()) {
					this.$favoritePopover.close();
				}
			},
			onkeydown: (e: KeyboardEvent) => {
				if (
					e.key === "Tab" &&
					this.$searchInput?.getValue().length === 0 &&
					this.$searchInput?.getValue() !== this.$searchInput?.getPlaceholder() &&
					this.$searchInput?.getPlaceholder() !== this.resourceBundle.getText("M_EASY_FILTER_PLACEHOLDER")
				) {
					e.preventDefault();
					this.$searchInput?.setValue(this.$searchInput?.getPlaceholder());
					this.fireEvent("liveChange");
				} else if (e.key === "ArrowDown") {
					const popoverConainer = this.$favoritePopover?.getContent()[0];
					const containerItems = (popoverConainer as FlexBox).getItems();
					containerItems?.find((item) => item.isFocusable() && (item.focus(), true));
				}
			},
			ontap: async () => {
				await this.openSuggestionPopover();
			},
			onfocusin: async () => {
				await this.openSuggestionPopover();
			}
		});
		this.$favoritePopover.addEventDelegate({
			onkeydown: (e: KeyboardEvent) => {
				const targetText = (e.target as HTMLElement)?.outerText;
				const targetId = (e.target as HTMLElement)?.id;
				switch (e.key) {
					case "Enter":
						this.$searchInput?.setValue(targetText);
						break;
					case "Delete":
						if (targetId?.includes("easyFilterFavoriteItem")) {
							this.state.favoriteQueries = this.state.favoriteQueries.filter(
								(data) => data.toLowerCase() !== targetText.toLowerCase()
							);
						} else {
							this.state.recentQueries = this.state.recentQueries.filter((query) => query !== targetText);
						}
						break;
					case "Escape":
						if (this.$favoritePopover?.isOpen()) {
							this.$favoritePopover.close();
						}
						break;
				}
			},
			onAfterRendering: () => {
				this.popoverInvisibleMessage?.announce(
					this.resourceBundle.getText("T_EASY_FILTER_INPUT_TEXT_LINK_POPOVER_ARIA"),
					InvisibleMessageMode.Assertive
				);
			}
		});
	}

	private async openSuggestionPopover(): Promise<void> {
		if (!this.$searchInput?.getValue() && (!this.$favoritePopover || !this.$favoritePopover?.isOpen())) {
			// Open the easy filter popover
			if (!this.shellHistoryProvider) {
				await this.initShellHistoryProvider();
			}
			this.state.isHistoryEnabled = this.shellHistoryProvider?.isHistoryEnabled() ?? false;
			this.state.favoriteQueries = (await this.shellHistoryProvider?.getFavoriteQueries()) ?? [];
			this.state.recentQueries = (await this.shellHistoryProvider?.getRecentQueries()) ?? [];
			this.$favoritePopover?.openBy(this.$searchInput);
		}
	}

	requestFavorite(e: Button$PressEvent): void {
		this.$favoritePopover?.close();
		this.$searchInput?.setValue(e.getSource().getText());
		this.onEnterPressed();
	}

	onEnterPressed(): void {
		this.$favoritePopover?.close();
		this.state.queryChanged = false;
		let magicQuery = this.$searchInput?.getValue();
		if (magicQuery === "" && this.$searchInput.getPlaceholder() !== this.resourceBundle.getText("M_EASY_FILTER_PLACEHOLDER")) {
			magicQuery = this.$searchInput.getPlaceholder();
			this.$searchInput?.setValue(magicQuery);
		}
		this.$searchInput?.setValueStateText("");
		this.$searchInput?.setValueState("None");
		this.fireEvent("enterPressed", { query: magicQuery });
	}

	addRecentQuery(queryString: string | undefined): void {
		// Normalize backslashes before storing
		queryString = queryString?.replace(/\\/g, "\\\\");

		const recentQueryIndex = this.state.recentQueries.findIndex((query) => query.toLowerCase() === queryString?.toLowerCase());
		if (queryString && recentQueryIndex === -1) {
			this.state.recentQueries = [queryString].concat(this.state.recentQueries);
			if (this.state.recentQueries.length > 5) {
				this.state.recentQueries = this.state.recentQueries.slice(0, 5);
			}
		} else if (queryString) {
			const recentQueries = this.state.recentQueries.filter((query) => query.toLowerCase() !== queryString?.toLowerCase());
			recentQueries.unshift(queryString);
			this.state.recentQueries = recentQueries;
		}
	}

	onStateChange(changedProps: string[] = []): void {
		if (changedProps.includes("favoriteQueries") || changedProps.includes("recentQueries")) {
			this.shellHistoryProvider?.setFavoriteQueries(this.state.favoriteQueries);
			this.shellHistoryProvider?.setRecentQueries(this.state.recentQueries.map((query) => query));
			this.state.recentQueriesWitFavorites = this.state.recentQueries.map((recentQuery) => {
				return {
					text: recentQuery,
					isFavorite: !!this.state.favoriteQueries.find((favoriteQuery) => favoriteQuery === recentQuery)
				};
			});
		}
		// Update favorite icon when query or favorites change
		if (changedProps.includes("currentExecutedQuery") || changedProps.includes("favoriteQueries")) {
			this.updateFavoriteIcon();
		}
	}

	private updateFavoriteIcon(): void {
		const isFavorited = this.isCurrentQueryFavorited();
		this.state.favoriteIconName = isFavorited ? "sap-icon://favorite" : "sap-icon://add-favorite";
		this.state.favoriteIconEnabled = isFavorited || this.state.favoriteQueries.length < 5;
		this.$searchInput?.toggleStyleClass("sapFEFavoriteIconDisabled", !this.state.favoriteIconEnabled);
		const valueHelpBtn = this.$searchInput?.getDomRef()?.querySelector('[aria-label="Show Value Help"]') as HTMLElement | null;
		if (valueHelpBtn) {
			valueHelpBtn.title = this.state.favoriteIconEnabled
				? this.resourceBundle.getText("M_EASY_FILTER_EMPTY_START")
				: this.resourceBundle.getText("M_EASY_FILTER_MAX_FAVORITE_REACHED");
		}
	}

	async initShellHistoryProvider(): Promise<void> {
		try {
			this.shellHistoryProvider = await ShellHistoryProvider.getInstance(this.appId ?? "<unknownApp>");
		} catch (error) {
			Log.error("Error while creating ShellHistoryProvider for easy filter", error as string);
		}
	}

	createFavoritePopover(): Popover {
		return (
			<Popover
				id={this.getId() + "-favoritePopover"}
				showHeader={false}
				horizontalScrolling={false}
				placement={PlacementType.Bottom}
				showArrow={false}
				initialFocus={this.$searchInput}
				class={"sapFEControlsPopover"}
				visible={this.state.recommendedQueries.length > 0 || equal(bindState(this.state, "isHistoryEnabled"), true)}
			>
				{{
					content: (
						<FlexBox direction={FlexDirection.Column} class={"sapUiContentPadding"} renderType={"Bare"}>
							{{
								items: [
									<Title
										titleStyle={TitleLevel.H6}
										text={this.resourceBundle.getText("M_EASY_FILTER_POPOVER_SUGGESTIONS_TITLE")}
										class={"sapFeControlsTitleBorder"}
										visible={this.state.recommendedQueries.length > 0}
									/>,
									<HBox
										class={"sapUiContentPadding"}
										items={bindState(this.state, "recommendedQueries")}
										wrap={FlexWrap.Wrap}
										visible={this.state.recommendedQueries.length > 0}
									>
										{{
											items: (id: string, ctx: Context): StandardListItem => {
												return (
													<Button
														class={"sapUiTinyMarginEnd"}
														text={ctx.getObject()}
														press={this.requestFavorite.bind(this)}
													/>
												);
											}
										}}
									</HBox>,
									<Title
										id={this.getId() + "-easyFilterFavoriteTitle"}
										titleStyle={TitleLevel.H6}
										text={this.resourceBundle.getText("M_EASY_FILTER_POPOVER_FAVORITE_TITLE")}
										class={"sapFeControlsTitleBorder"}
										visible={equal(bindState(this.state, "isHistoryEnabled"), true)}
									/>,
									<List
										items={bindState(this.state, "favoriteQueries")}
										visible={equal(bindState(this.state, "isHistoryEnabled"), true)}
									>
										{{
											noData: (
												<IllustratedMessage
													title={this.resourceBundle.getText("M_EASY_FILTER_POPOVER_EMPTY_FAVORITE_TITLE")}
													illustrationSize={IllustratedMessageSize.ExtraSmall}
													illustrationType={IllustratedMessageType.NoEntries}
													description={this.resourceBundle.getText(
														"M_EASY_FILTER_POPOVER_EMPTY_FAVORITE_DESCRIPTION"
													)}
												/>
											),
											items: (id: string, ctx: Context): StandardListItem => {
												return (
													<CustomListItem
														id={id + "-easyFilterFavoriteItem"}
														class={"sapUiSmallMarginBegin"}
														ariaLabelledBy={[id + "-easyFilterFavoriteTitle"]}
														customData={[<CustomData key={"text"} value={ctx.getObject()} />]}
														press={(): void => {
															this.$searchInput.setValue(ctx.getObject());
															this.onEnterPressed();
														}}
													>
														<FlexBox
															width={"100%"}
															direction={FlexDirection.Row}
															alignItems={FlexAlignItems.Center}
															justifyContent={FlexJustifyContent.SpaceBetween}
															renderType={"Bare"}
															id={id}
														>
															<Text
																text={ctx.getObject()}
																tooltip={ctx.getObject()}
																wrapping={false}
																class="sapFEControlsPointer"
															></Text>
															<Button
																icon={"sap-icon://favorite"}
																tooltip={this.resourceBundle.getText("M_EASY_FILTER_FILLED_STAR")}
																ariaLabelledBy={[this.getId() + "-easyFilterFavoriteItem"]}
																type={ButtonType.Transparent}
																press={(): void => {
																	//Retaining the focus on popover doesn't make the popover close on every interaction
																	this.$favoritePopover?.focus();
																	const queryString = ctx.getObject();
																	const index = this.state.favoriteQueries.indexOf(queryString);
																	if (index !== -1) {
																		this.state.favoriteQueries = this.state.favoriteQueries.filter(
																			(query) => query !== queryString
																		);
																	}
																	this.favoriteButtonClicked = true;
																}}
															/>
															{{
																dependents: (
																	<EventDelegateHook
																		tap={(): void => {
																			if (!this.favoriteButtonClicked) {
																				triggerPXIntegration("favorite");
																				this.$searchInput?.setValue(
																					ctx.getObject().replace(/\\\\/g, "\\")
																				);
																				this.onEnterPressed();
																			}
																			this.favoriteButtonClicked = false;
																		}}
																	/>
																)
															}}
														</FlexBox>
													</CustomListItem>
												);
											}
										}}
									</List>,
									<Title
										id={this.getId() + "-easyFilterLastUsedTitle"}
										titleStyle={TitleLevel.H6}
										text={this.resourceBundle.getText("M_EASY_FILTER_POPOVER_LAST_USED")}
										class={"sapFeControlsTitleBorder"}
										visible={equal(bindState(this.state, "isHistoryEnabled"), true)}
									/>,
									<List
										items={bindState(this.state, "recentQueriesWitFavorites")}
										visible={equal(bindState(this.state, "isHistoryEnabled"), true)}
										mode={ListMode.Delete}
										ariaLabelledBy={[this.getId() + "-easyFilterLastUsedTitle"]}
										delete={(e: ListBase$DeleteEvent): void => {
											const item = e.getParameter("listItem") as CustomListItem;
											item.focus();

											let queryString = e.getParameter("listItem")?.data("text");

											if (!queryString) return;
											// Normalize backslashes before comparing
											queryString = queryString?.replace(/\\/g, "\\\\");

											this.state.recentQueries = this.state.recentQueries.filter((query) => query !== queryString);
										}}
									>
										{{
											noData: (
												<IllustratedMessage
													title={this.resourceBundle.getText("M_EASY_FILTER_POPOVER_EMPTY_LAST_USED_TITLE")}
													illustrationSize={IllustratedMessageSize.ExtraSmall}
													illustrationType={IllustratedMessageType.NoEntries}
													description={this.resourceBundle.getText(
														"M_EASY_FILTER_POPOVER_EMPTY_RECENT_DESCRIPTION"
													)}
												/>
											),
											items: (id: string, ctx: Context): FlexBox => {
												return (
													<CustomListItem
														id={id + "-easyFilterLastUsedItem"}
														press={(): void => {
															this.$searchInput?.setValue(ctx.getObject().text);
															this.onEnterPressed();
														}}
														class={"sapUiSmallMarginBegin"}
														customData={[<CustomData key={"text"} value={ctx.getObject().text} />]}
														ariaLabelledBy={[id + "-easyFilterLastUsedTitle"]}
													>
														<FlexBox
															width={"100%"}
															direction={FlexDirection.Row}
															alignItems={FlexAlignItems.Center}
															justifyContent={FlexJustifyContent.SpaceBetween}
															renderType={"Bare"}
															id={id}
														>
															<Text
																text={ctx.getObject().text}
																tooltip={ctx.getObject().text}
																wrapping={false}
																class="sapFEControlsPointer"
															></Text>
															<Button
																icon={
																	ctx.getObject().isFavorite
																		? "sap-icon://favorite"
																		: "sap-icon://add-favorite"
																}
																tooltip={
																	ctx.getObject().isFavorite
																		? this.resourceBundle.getText("M_EASY_FILTER_FILLED_STAR")
																		: this.resourceBundle.getText("M_EASY_FILTER_EMPTY_START")
																}
																enabled={lessThan(
																	length(
																		bindState(
																			this.state,
																			"favoriteQueries"
																		) as PathInModelExpression<unknown>
																	),
																	5
																)}
																type={ButtonType.Transparent}
																ariaLabelledBy={[id + "-easyFilterLastUsedItem"]}
																press={(): void => {
																	this.favoriteButtonClicked = true;
																	//Retaining the focus on popover doesn't make the popover close on every interaction
																	this.$favoritePopover?.focus();
																	const queryString = ctx.getObject().text;
																	const isFavorite = ctx.getObject().isFavorite;

																	if (isFavorite) {
																		this.removeFromFavorites(queryString);
																	} else {
																		this.addToFavorites(queryString);
																	}
																}}
															/>
															{{
																dependents: (
																	<EventDelegateHook
																		tap={(): void => {
																			// should not be executed when clicking on add favorite button
																			if (!this.favoriteButtonClicked) {
																				this.$searchInput?.setValue(
																					ctx.getObject().text.replace(/\\\\/g, "\\")
																				);
																				triggerPXIntegration("recent");
																				this.onEnterPressed();
																			}
																			this.favoriteButtonClicked = false;
																		}}
																	/>
																)
															}}
														</FlexBox>
													</CustomListItem>
												);
											}
										}}
									</List>
								]
							}}
						</FlexBox>
					)
				}}
			</Popover>
		) as Popover;
	}

	private removeFromFavorites(query: string): void {
		this.state.favoriteQueries = this.state.favoriteQueries.filter((data) => data.toLowerCase() !== query.toLowerCase());
	}

	private addToFavorites(query: string): void {
		const newFavorite = [query].concat(this.state.favoriteQueries.concat());
		if (newFavorite.length > 5) {
			newFavorite.pop();
		}
		this.state.favoriteQueries = newFavorite;
	}

	private isCurrentQueryFavorited(): boolean {
		const currentQuery = this.state.currentExecutedQuery.toLowerCase().trim();
		return this.state.favoriteQueries.some((fav) => fav.toLowerCase().trim() === currentQuery);
	}

	public setQuerySuccess(query: string): void {
		this.state.currentExecutedQuery = query;
		this.state.isQuerySuccessful = true;
		this.updateFavoriteIcon();
	}

	public setQueryFailure(): void {
		this.state.isQuerySuccessful = false;
		this.state.currentExecutedQuery = "";
	}

	public clearQueryStatus(): void {
		this.state.isQuerySuccessful = false;
		this.state.currentExecutedQuery = "";
	}

	private onFavoriteIconPress(): void {
		if (!this.state.favoriteIconEnabled) {
			return;
		}
		// Toggle favorite status for the current query
		const isFavorited = this.isCurrentQueryFavorited();
		if (isFavorited) {
			this.removeFromFavorites(this.state.currentExecutedQuery);
		} else {
			this.addToFavorites(this.state.currentExecutedQuery);
		}
	}

	static render(rm: RenderManager, control: EasyFilterInput): void {
		return jsx.renderUsingRenderManager(rm, control, () => {
			return (
				<span ref={control} class={"sapFEEasyFilterInput"}>
					{control.$searchInput}
				</span>
			);
		});
	}
}
