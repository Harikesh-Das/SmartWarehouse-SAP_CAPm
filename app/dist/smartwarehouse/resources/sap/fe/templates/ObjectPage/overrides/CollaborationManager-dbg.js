/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/macros/insights/CommonInsightsHelper"], function (Log, CommonUtils, CommonInsightsHelper) {
  "use strict";

  var _exports = {};
  var showGenericErrorMessage = CommonInsightsHelper.showGenericErrorMessage;
  const RetrieveCardTypes = {
    INTEGRATION: "integration"
  };
  _exports.RetrieveCardTypes = RetrieveCardTypes;
  const CollaborationManagerOverride = {
    async collectAvailableCards(cards) {
      const view = this.base.getView();
      const controller = view.getController();
      const appComponent = controller.getOwnerComponent().getAppComponent();
      const isEditable = CommonUtils.getIsEditable(view);
      if (!isEditable) {
        // Start card retrieval immediately and register it with pageReady so it runs in
        // parallel with the OData page load instead of sequentially after it.
        // _getPageTitleInformation uses requestProperty() which is an OData V4 async API
        // that safely queues data requests and resolves when entity data arrives.
        const cardRetrievalPromise = (async () => {
          const card = await appComponent.getCollaborationManagerService().getDesignTimeCard(RetrieveCardTypes.INTEGRATION);
          if (card) {
            const onAddCardToCollaborationManagerCallback = () => {
              try {
                if (card) {
                  appComponent.getCollaborationManagerService().publishCard(card);
                  return;
                }
              } catch (e) {
                showGenericErrorMessage(view);
                Log.error(e);
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
  return CollaborationManagerOverride;
}, false);
//# sourceMappingURL=CollaborationManager-dbg.js.map
