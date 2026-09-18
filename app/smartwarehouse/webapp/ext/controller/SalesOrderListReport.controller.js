sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ui/core/Fragment",
    "sap/m/Input",
    "sap/m/HBox",
    "sap/m/Button",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (
    ControllerExtension,
    Fragment,
    Input,
    HBox,
    Button,
    MessageToast,
    MessageBox
) {
    "use strict";
   
    
    
    return ControllerExtension.extend(
        "smartwarehouse.ext.controller.SalesOrderListReport",
        {

            onCreateSalesOrder: async function () {

                const oView = this.base.getView();

                if (!this._oCreateDialog) {

                    this._oCreateDialog =
                        await Fragment.load({
                            id: oView.getId(),
                            name: "smartwarehouse.ext.fragment.CreateSalesOrder",
                            controller: this
                        });

                    oView.addDependent(this._oCreateDialog);

                    this.onAddItem();
                }

                this._oCreateDialog.open();
            },


            onAddItem: function () {

                const oView = this.base.getView();

                const oItemsContainer =
                    Fragment.byId(
                        oView.getId(),
                        "itemsContainer"
                    );

                const oItemId = new Input({
                    placeholder: "Item ID",
                    width: "40%"
                });

                const oQuantity = new Input({
                    placeholder: "Quantity",
                    type: "Number",
                    width: "30%"
                });

                const oRemoveButton = new Button({
                    text: "Remove",
                    press: function () {

                        oItemsContainer.removeItem(oRow);

                        oItemId.destroy();
                        oQuantity.destroy();
                        oRemoveButton.destroy();
                        oRow.destroy();
                    }
                });

                const oRow = new HBox({
                    items: [
                        oItemId,
                        oQuantity,
                        oRemoveButton
                    ],
                    class: "sapUiTinyMarginBottom"
                });

                oItemsContainer.addItem(oRow);
            },


            onSaveSalesOrder: async function () {

                const oView = this.base.getView();
                const oModel = oView.getModel();

                const oOrderId =
                    Fragment.byId(
                        oView.getId(),
                        "orderId"
                    ).getValue();

                const oCustomerId =
                    Fragment.byId(
                        oView.getId(),
                        "customerId"
                    ).getValue();

                const oStatus =
                    Fragment.byId(
                        oView.getId(),
                        "status"
                    ).getSelectedKey();

                const oLatitude =
                    Fragment.byId(
                        oView.getId(),
                        "customerLatitude"
                    ).getValue();

                const oLongitude =
                    Fragment.byId(
                        oView.getId(),
                        "customerLongitude"
                    ).getValue();

                if (
                    !oOrderId ||
                    !oCustomerId ||
                    !oLatitude ||
                    !oLongitude
                ) {
                    MessageBox.error(
                        "Please enter all Sales Order details."
                    );
                    return;
                }

                try {

                    // Create Sales Order
                    const oOrderBinding =
                        oModel.bindList("/SalesOrder");

                    const oOrderContext =
                        oOrderBinding.create({

                            orderId: oOrderId,
                            customerId: oCustomerId,
                            status: oStatus,
                            customerLatitude: Number(oLatitude),
                            customerLongitude: Number(oLongitude)

                        });

                    await oOrderContext.created();


                    // Create Items under this Sales Order
                    const oItemsContainer =
                        Fragment.byId(
                            oView.getId(),
                            "itemsContainer"
                        );

                    const aRows =
                        oItemsContainer.getItems();

                    const oItemBinding =
                        oModel.bindList(
                            "items",
                            oOrderContext
                        );

                    for (const oRow of aRows) {

                        const aControls =
                            oRow.getItems();

                        const sItemId =
                            aControls[0].getValue();

                        const iQuantity =
                            Number(
                                aControls[1].getValue()
                            );

                        if (!sItemId || !iQuantity) {
                            continue;
                        }

                        const oItemContext =
                            oItemBinding.create({

                                itemId: sItemId,
                                quantity: iQuantity

                            });

                        await oItemContext.created();
                    }


                    this._oCreateDialog.close();

                    MessageToast.show(
                        "Sales Order created successfully"
                    );

                    // Refresh List Report
                    oModel.refresh();

                } catch (oError) {

                    MessageBox.error(
                        oError.message ||
                        "Failed to create Sales Order"
                    );
                }
            },


            onCancelSalesOrder: function () {

                this._oCreateDialog.close();
            }

            

        }
    );
    
});