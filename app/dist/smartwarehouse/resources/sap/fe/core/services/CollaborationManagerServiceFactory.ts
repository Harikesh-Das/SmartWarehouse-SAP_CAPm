import Log from "sap/base/Log";
import type { RetrieveCardType } from "sap/cards/ap/common/services/RetrieveCard";
import type { CardManifest } from "sap/insights/CardHelper";
import type CardsChannel from "sap/insights/CardsChannel";
import type { ICardProvider, SharedCard } from "sap/insights/CardsChannel";
import Service from "sap/ui/core/service/Service";
import ServiceFactory from "sap/ui/core/service/ServiceFactory";
import type { ServiceContext } from "types/metamodel_types";
import type AppComponent from "../AppComponent";

type CollaborationManagerSettings = {};

export type WrappedCard = Pick<NonNullable<SharedCard>, "card" | "title" | "callback">;

const COLLABORATION_MANAGER_CONSUMER_ID = "sap-collaboration-manager";

export class CollaborationManagerService extends Service<CollaborationManagerSettings> implements ICardProvider {
	initPromise!: Promise<CollaborationManagerService>;

	// eslint-disable-next-line camelcase
	__implements__sap_insights_ICardProvider = true;

	private channel!: CardsChannel;

	private id!: string;

	private consumers!: Record<string, boolean>;

	private onRetrieveAvailableCards?: () => Promise<void>;

	private sharedCards!: SharedCard[];

	private registered = false;

	private isCollaborationManagerConnected = false;

	private appComponent!: AppComponent;

	// used for FCL scenarios
	private sharedCardsPerView: Record<string, SharedCard[]> = {};

	init(): void {
		this.initPromise = new Promise((resolve) => {
			this.appComponent = this.getContext().scopeObject as AppComponent;
			resolve(this);
		});
	}

	private async getCardsChannel(): Promise<CardsChannel> {
		const { default: cardHelper } = await import("sap/insights/CardHelper");
		const service = await cardHelper.getServiceAsync("UIService");
		return service.getCardsChannel();
	}

	exit(): void {
		this.unregisterProvider();
	}

	public async connect(providerId: string, onRetrieveAvailableCards: () => Promise<void>): Promise<CollaborationManagerService> {
		try {
			const channel = await this.getCardsChannel();
			if (channel.isEnabled()) {
				this.onRetrieveAvailableCards = onRetrieveAvailableCards;
				this.channel = channel;
				this.id = providerId;
				this.consumers = {};
				this.sharedCards = [];
				if (this.registered !== true) {
					await this.registerProvider();
				}
				this.updateConsumers();
			}
		} catch (error: unknown) {
			Log.debug("Collaboration Manager connection failed", error as Error | string);
		}
		return this;
	}

	public async onConsumerConnected(id: string): Promise<number> {
		if (!this.consumers[id]) {
			this.consumers[id] = true;
			if (id === COLLABORATION_MANAGER_CONSUMER_ID) {
				this.isCollaborationManagerConnected = true;
				await this.onRetrieveAvailableCards?.();
			}
			this.shareAvailableCards(id);
		}
		return Promise.resolve(Object.keys(this.consumers).length);
	}

	public async onConsumerDisconnected(id: string): Promise<number> {
		if (this.consumers[id]) {
			delete this.consumers[id];
		}
		return Promise.resolve(Object.keys(this.consumers).length);
	}

	public onCardRequested(consumerId: string, cardId: string): SharedCard {
		// Search through all cards stored across all views
		const card = Object.values(this.sharedCardsPerView)
			.flat()
			.find((card) => card?.id === cardId);
		card?.callback?.(card.card);
		return card;
	}

	public async onViewUpdate(active: boolean): Promise<void> {
		// register / unregister if the status of the home page changed
		if (this.registered !== active) {
			if (active) {
				await this.registerProvider();
				this.updateConsumers();
			} else {
				await this.unregisterProvider();
			}
		} else if (this.registered) {
			this.updateConsumers();
		}
	}

	private async registerProvider(): Promise<void> {
		if (this.channel) {
			await this.channel.registerProvider(this.id, this);
			this.registered = true;
		}
	}

	public async unregisterProvider(): Promise<void> {
		if (this.channel) {
			await this.channel.unregister(this.id);
			this.registered = false;
			this.consumers = {};
			this.sharedCards = [];
			this.onRetrieveAvailableCards = undefined;
		}
	}

	private updateConsumers(): void {
		this.shareAvailableCards();
	}

	public shareAvailableCards(consumerId = "*"): void {
		let cards = this.sharedCards;
		const rootViewController = this.appComponent.getRootViewController();
		if (rootViewController.isFclEnabled()) {
			const viewId = rootViewController.getRightmostView().getId();
			cards = this.sharedCardsPerView[viewId];
		}
		this?.channel?.publishAvailableCards(this.id, cards, consumerId);
	}

	public addCardsToCollaborationManager(cards: Record<string, WrappedCard>, parentAppId: string, viewId: string): void {
		this.sharedCards = [];
		for (const [id, card] of Object.entries(cards)) {
			this.sharedCards.push({
				id: id,
				title: card.title,
				parentAppId: parentAppId,
				callback: card.callback,
				card: card.card
			});
		}
		this.sharedCardsPerView[viewId] = this.sharedCards;
	}

	public async getDesignTimeCard(cardType: RetrieveCardType): Promise<Record<string, unknown> | undefined> {
		const retrieveCardModule = await import("sap/cards/ap/common/services/RetrieveCard");
		type RetrieveCardService = {
			getObjectPageCardManifestForPreview(
				component: unknown,
				options: { cardType: RetrieveCardType }
			): Promise<Record<string, unknown>>;
		};

		const retrieveCard = retrieveCardModule as RetrieveCardService;
		const appComponent = this.appComponent;
		let manifest: Record<string, unknown> | undefined;

		try {
			manifest = await retrieveCard.getObjectPageCardManifestForPreview(appComponent, { cardType });
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			Log.error(`Failed to get design time card manifest: ${message}`);
		}

		return manifest;
	}

	public publishCard(card: CardManifest): void {
		const sapAppSection = card["sap.app"] as { id?: string } | undefined;
		const publishedId = sapAppSection?.id ?? "UNKNOWN_CARD_ID";
		this.channel.publishCard(this.id, { id: publishedId, descriptorContent: card }, "*");
	}

	/**
	 * Check if there are connected consumers to the cards channel.
	 * @returns True if there are connected consumers to the collaboration manager
	 */
	public hasCollaborationManagerConnected(): boolean {
		return this.isCollaborationManagerConnected;
	}
}

export default class CollaborationManagerServiceFactory extends ServiceFactory<CollaborationManagerSettings> {
	static serviceClass = CollaborationManagerService;

	private instance!: CollaborationManagerService;

	async createInstance(oServiceContext: ServiceContext<CollaborationManagerSettings>): Promise<CollaborationManagerService> {
		this.instance = new CollaborationManagerService(oServiceContext);
		return this.instance.initPromise;
	}

	getInstance(): CollaborationManagerService {
		return this.instance;
	}

	shareAvailableCards(): void {
		this.instance.shareAvailableCards();
	}
}
