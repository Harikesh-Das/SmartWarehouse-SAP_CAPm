sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], function (JSONModel, MessageBox) {
    "use strict";
    



    return {

      


        allocateWarehouse: async function (oEvent) {

            const oControl = oEvent.getSource();
            const oContext = oControl.getBindingContext();

            if (!oContext) {
                return;
            }

            const oRoot = oControl.getParent();

            // Hide previous resoolt

            const oModel = oContext.getModel();

            // Get Items
            const oBinding = oModel.bindList(
                oContext.getPath() + "/items"
            );

            const aContexts =
                await oBinding.requestContexts();

            const aItems = await Promise.all(
                aContexts.map(
                    oItemContext =>
                        oItemContext.requestObject()
                )
            );

            // Calculate Statistics
            const iItemCount = aItems.length;

            const iTotalQuantity = aItems.reduce(
                (total, item) =>
                    total + item.quantity,
                0
            );

            const iAverageQuantity =
                iItemCount > 0
                    ? iTotalQuantity / iItemCount
                    : 0;

            try {

                // Call backend action
                const oAction =
                    oModel.bindContext(
                        "/getBestWarehouse(...)"
                    );

                oAction.setParameter(
                    "salesOrderId",
                    oContext.getProperty("ID")
                );

                await oAction.execute();

                await oContext.requestRefresh();

                const oResult =
                    await oAction
                        .getBoundContext()
                        .requestObject();

                // Display output
                oRoot.setModel(
                    new JSONModel({
                        totalQuantity: iTotalQuantity,
                        averageQuantity: iAverageQuantity,
                        itemCount: iItemCount,

                        warehouseId:
                            oResult.warehouseId,

                        availableItems:
                            oResult.availableItems,

                        unavailableItems:
                            oResult.unavailableItems
                    }),
                    "allocation"
                );

                // Show warehouse result
                oRoot.getItems()[2].setVisible(true);


            } catch (oError) {

                MessageBox.error(
                    `400 - Error: ${oError.message}`
                );
            }
        }
    };
});