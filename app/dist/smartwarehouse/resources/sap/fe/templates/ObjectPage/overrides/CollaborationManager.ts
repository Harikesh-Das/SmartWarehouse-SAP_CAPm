import Log from "sap/base/Log";
import { type RetrieveCardType } from "sap/cards/ap/common/services/RetrieveCard";
import CommonUtils from "sap/fe/core/CommonUtils";
import type CollaborationManager from "sap/fe/core/controllerextensions/cards/CollaborationManager";
import { type WrappedCard } from "sap/fe/core/services/CollaborationManagerServiceFactory";
import { showGenericErrorMessage } from "sap/fe/macros/insights/CommonInsightsHelper";
import { type CardManifest } from "sap/insights/CardHelper";
export const RetrieveCardTypes: Record<string, RetrieveCardType> = {
	INTEGRATION: "integration"
};

const CollaborationManagerOverride = {
	async collectAvailableCards(this: CollaborationManager, cards: WrappedCard[]): Promise<void> {
		const view = this.base.getView();
		const controller = view.getController();
		const appComponent = controller.getOwnerComponent().getAppComponent();
		const isEditable = CommonUtils.getIsEditable(view);
		if (!isEditable) {
			// Start card retrieval immediately and register it with pageReady so it runs in
			// parallel with the OData page load instead of sequentially after it.
			// _getPageTitleInformation uses requestProperty() which is an OData V4 async API
			// that safely queues data requests and resolves when entity data arrives.
			const cardRetrievalPromise = (async (): Promise<void> => {
				const card = await appComponent.getCollaborationManagerService().getDesignTimeCard(RetrieveCardTypes.INTEGRATION);
				if (card) {
					const onAddCardToCollaborationManagerCallback = (): void => {
						try {
							if (card) {
								appComponent.getCollaborationManagerService().publishCard(card as CardManifest);
								return;
							}
						} catch (e) {
							showGenericErrorMessage(view);
							Log.error(e as string);
						}
					};
					const pageTitleInformation = await controller._getPageTitleInformation();
					cards.push({
						card: card,
						title: pageTitleInformation.subtitle || "",
						callback: onAddCardToCollaborationManagerCallback
					});
				}
			})();
			controller.pageReady.waitFor(cardRetrievalPromise);
			await cardRetrievalPromise;
		}
	}
};
export default CollaborationManagerOverride;
