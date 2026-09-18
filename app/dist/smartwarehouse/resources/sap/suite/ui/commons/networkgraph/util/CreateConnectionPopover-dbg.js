/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "sap/suite/ui/commons/library",
    "sap/m/Popover",
    "sap/m/ComboBox",
    "sap/m/MultiComboBox",
    "sap/m/Button",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Label",
    "sap/m/Toolbar",
    "sap/m/ToolbarSpacer",
    "sap/ui/core/Item",
    "sap/ui/core/Lib"
], function (library, Popover, ComboBox, MultiComboBox, Button, VBox, HBox, Label, Toolbar, ToolbarSpacer, Item, CoreLib) {
    "use strict";
    var oResourceBundle = CoreLib.getResourceBundleFor("sap.suite.ui.commons");
    /**
     * Utility class for creating and managing connection creation popovers
     * @class
     * @private
     */
    var CreateConnectionPopover = function () {
        this._oPopover = null;
        this._oConnectionTypeCombo = null;
        this._oDestinationCombo = null;
        this._oOkButton = null;
        this._aConnectionRows = []; // Store multiple connection rows
        this._oConnectionsContainer = null; // VBox container for connection rows
        this._oCreateButton = null; // Button to add more connections
        this._iMaxConnections = 4; // Maximum number of connections allowed
    };
    /**
     * Shows the connection popover for creating connections between nodes
     * @param {Object} mConfig Configuration object
     * @param {sap.suite.ui.commons.networkgraph.Node} mConfig.sourceNode The source node
     * @param {Event} mConfig.event The triggering event
     * @param {Function} mConfig.onConnectionCreate Callback function when connection is created
     * @public
     */
    CreateConnectionPopover.prototype.show = function (mConfig) {
        var oSourceNode = mConfig.sourceNode;
        var oEvent = mConfig.event;
        var fnOnConnectionCreate = mConfig.onConnectionCreate;
        var oGraph = oSourceNode.getParent();
        if (!oGraph) {
            return;
        }
        // Clean up any existing popover
        this._cleanup();

        // Initialize connections container
        this._oConnectionsContainer = new VBox();
        this._aConnectionRows = [];

        // Create the first connection row
        this._addConnectionRow(oSourceNode, oGraph);
        // Create "Create" button to add more connections
        this._oCreateButton = new Button(oSourceNode.getId() + "-createButton", {
            text: oResourceBundle.getText("NETWORKGRAPH_CREATE_BUTTON"),
            type: "Transparent",
            enabled: true,
            press: function () {
                this._addConnectionRow(oSourceNode, oGraph);
            }.bind(this)
        });

        // Create OK button (initially disabled)
        this._oOkButton = new Button(oSourceNode.getId() + "-okButton", {
            text: oResourceBundle.getText("NETWORKGRAPH_OK_BUTTON"),
            type: "Emphasized",
            enabled: false,
            press: function () {
                this._handleConnectionCreate(oSourceNode, fnOnConnectionCreate);
            }.bind(this)
        });

        // Create Cancel button
        var oCancelButton = new Button(oSourceNode.getId() + "-cancelButton", {
            text: oResourceBundle.getText("NETWORKGRAPH_CANCEL_BUTTON"),
            type: "Transparent",
            press: function () {
                this._oPopover.close();
            }.bind(this)
        });

        // Create popover content
        var oPopoverContent = new VBox({
            items: [
                this._oConnectionsContainer,
                new HBox({
                    justifyContent: "End",
                    items: [
                        this._oCreateButton
                    ]
                }).addStyleClass("sapUiTinyMarginTop")
            ]
        }).addStyleClass("sapUiTinyMargin");

        // Create footer toolbar with OK and Cancel buttons
        var oFooterToolbar = new Toolbar({
            content: [
                new ToolbarSpacer(),
                this._oOkButton,
                oCancelButton
            ]
        });

        // Create and show popover
        this._oPopover = new Popover(oSourceNode.getId() + "-connectionPopover", {
            title: oResourceBundle.getText("NETWORKGRAPH_CONNECTION_POPOVER_TITLE"),
            content: oPopoverContent,
            footer: oFooterToolbar,
            placement: "PreferredTopOrFlip",
            afterClose: function () {
                this._cleanup();
            }.bind(this)
        });
        // Open popover relative to the event target (arrow button)
        this._oPopover.openBy(oEvent.target);
    };
    /**
     * Creates connection type items dynamically from the ConnectionType enum
     * based on the node ports configuration and graph-level connection type mapping.
     * The mapping allows customization of display text - values starting with "NETWORKGRAPH_"
     * are treated as message bundle keys, while other values are used as custom display text.
     * @param {sap.suite.ui.commons.networkgraph.Graph} oGraph - The parent graph
     * @returns {Array<sap.ui.core.Item>} Array of connection type items
     * @private
     */
    CreateConnectionPopover.prototype._createConnectionTypeItems = function (oGraph) {
        var aItems = [];
        var oConnectionTypes = library.networkgraph.ConnectionType;
        var sNodePorts = oGraph.getNodePorts();

        // Define default message bundle keys mapping
        var mDefaultMapping = {
            "LeftToLeft": "NETWORKGRAPH_CONNECTION_TYPE_LEFT_TO_LEFT",
            "LeftToRight": "NETWORKGRAPH_CONNECTION_TYPE_LEFT_TO_RIGHT",
            "RightToLeft": "NETWORKGRAPH_CONNECTION_TYPE_RIGHT_TO_LEFT",
            "RightToRight": "NETWORKGRAPH_CONNECTION_TYPE_RIGHT_TO_RIGHT"
        };

        // Get user-provided mapping and merge with defaults for missing/invalid keys
        var mUserMapping = oGraph.getConnectionTypeMapping() || {};
        var mMessageKeys = {};

        // For each valid connection type, use user mapping if valid key exists, otherwise use default
        for (var sConnectionType in mDefaultMapping) {
            if (mDefaultMapping.hasOwnProperty(sConnectionType)) {
                // Use user mapping if the exact key exists, otherwise fall back to default
                mMessageKeys[sConnectionType] = mUserMapping[sConnectionType] || mDefaultMapping[sConnectionType];
            }
        }
        // Define which connection types are available for each port configuration
        var mPortConnectionMapping = {
            "None": [], // No connections available
            "LeftRight": [library.networkgraph.ConnectionType.LeftToLeft, library.networkgraph.ConnectionType.LeftToRight, library.networkgraph.ConnectionType.RightToLeft, library.networkgraph.ConnectionType.RightToRight]
        };
        // Get allowed connection types for current port configuration
        var aAllowedTypes = mPortConnectionMapping[sNodePorts] || [];
        // If port configuration is not recognized, show all available types
        if (aAllowedTypes.length === 0 && sNodePorts !== "None") {
            aAllowedTypes = Object.keys(oConnectionTypes);
        }
        // Loop through the enum values and create items for allowed types only
        for (var sKey in oConnectionTypes) {
            if (oConnectionTypes.hasOwnProperty(sKey) && aAllowedTypes.indexOf(sKey) !== -1) {
                var sValue = oConnectionTypes[sKey];
                var sTextOrKey = mMessageKeys[sKey];
                var sDisplayText;

                if (sTextOrKey) {
                    // Check if it's a message bundle key (starts with uppercase) or custom text
                    if (sTextOrKey.indexOf("NETWORKGRAPH_") === 0) {
                        // It's a message bundle key, try to get text from bundle
                        sDisplayText = oResourceBundle.getText(sTextOrKey) || sTextOrKey;
                    } else {
                        // It's custom text, use as-is
                        sDisplayText = sTextOrKey;
                    }
                } else {
                    // Fallback to enum key if no mapping found
                    sDisplayText = sKey;
                }

                aItems.push(new Item({
                    key: sValue,
                    text: sDisplayText
                }));
            }
        }
        return aItems;
    };
    /**
     * Adds a new connection row with ComboBoxes for connection type and destination
     * @param {sap.suite.ui.commons.networkgraph.Node} oSourceNode The source node
     * @param {sap.suite.ui.commons.networkgraph.Graph} oGraph The parent graph
     * @private
     */
    CreateConnectionPopover.prototype._addConnectionRow = function (oSourceNode, oGraph) {
        if (this._aConnectionRows.length >= this._iMaxConnections) {
            return;
        }

        var iRowIndex = this._aConnectionRows.length;
        var sRowId = oSourceNode.getId() + "-row-" + iRowIndex;

        // Create connection type combo box
        var oConnectionTypeCombo = new ComboBox(sRowId + "-connectionTypeCombo", {
            items: this._createConnectionTypeItems(oGraph),
            width: "14.125rem",
            selectionChange: function () {
                this._updateButtons();
            }.bind(this)
        });

        // Create destination node multi combo box
        var oDestinationCombo = new MultiComboBox(sRowId + "-destinationCombo", {
            width: "14.125rem",
            selectionChange: function () {
                this._updateButtons();
            }.bind(this)
        });

        // Populate destination combo with all other nodes
        var aAllNodes = oGraph.getNodes();
        var sCurrentNodeKey = oSourceNode.getKey();
        aAllNodes.forEach(function (oNode) {
            if (oNode.getKey() !== sCurrentNodeKey) {
                oDestinationCombo.addItem(new Item({
                    key: oNode.getKey(),
                    text: oNode.getTitle() || oNode.getKey()
                }));
            }
        });

        // Create the row container
        var oRowContainer = new VBox({
            items: [
                new HBox({
                    alignItems: "Center",
                    items: [
                        new Label({
                            text: oResourceBundle.getText("NETWORKGRAPH_CONNECTION_TYPE_LABEL"),
                            labelFor: oConnectionTypeCombo.getId(),
                            width: "9rem"
                        }),
                        oConnectionTypeCombo
                    ]
                }).addStyleClass("sapUiTinyMargin"),
                new HBox({
                    alignItems: "Center",
                    items: [
                        new Label({
                            text: oResourceBundle.getText("NETWORKGRAPH_DESTINATION_LABEL"),
                            labelFor: oDestinationCombo.getId(),
                            width: "9rem"
                        }),
                        oDestinationCombo
                    ]
                }).addStyleClass("sapUiTinyMargin")
            ]
        });

        // Store the row data
        this._aConnectionRows.push({
            container: oRowContainer,
            connectionTypeCombo: oConnectionTypeCombo,
            destinationCombo: oDestinationCombo
        });

        // Add to connections container
        this._oConnectionsContainer.addItem(oRowContainer);

        // Update button states
        this._updateButtons();
    };

    /**
     * Updates the OK and Create button states based on dropdown selections
     * @private
     */
    CreateConnectionPopover.prototype._updateButtons = function () {
        if (!this._oOkButton || !this._oCreateButton) {
            return;
        }

        // Check if at least one row has both selections made
        var bAtLeastOneComplete = this._aConnectionRows.some(function (oRow) {
            return !!oRow.connectionTypeCombo.getSelectedKey() && 
                   oRow.destinationCombo.getSelectedKeys().length > 0;
        });

        // Enable OK button if at least one connection is complete
        this._oOkButton.setEnabled(bAtLeastOneComplete);

        // Disable Create button only when max connections reached
        this._oCreateButton.setEnabled(this._aConnectionRows.length < this._iMaxConnections);
    };
    /**
     * Handles connection creation when OK button is pressed
     * Creates all complete connections from the rows
     * @param {sap.suite.ui.commons.networkgraph.Node} oSourceNode The source node
     * @param {Function} fnOnConnectionCreate Callback function when connection is created
     * @private
     */
    CreateConnectionPopover.prototype._handleConnectionCreate = function (oSourceNode, fnOnConnectionCreate) {
        var oGraph = oSourceNode.getParent();
        if (!oGraph || !fnOnConnectionCreate) {
            return;
        }

        // Collect all complete connections
        var aConnections = [];
        this._aConnectionRows.forEach(function (oRow) {
            var sConnectionType = oRow.connectionTypeCombo.getSelectedKey();
            var aTargetNodeKeys = oRow.destinationCombo.getSelectedKeys();

            if (sConnectionType && aTargetNodeKeys.length > 0) {
                // Create a connection for each selected destination node
                aTargetNodeKeys.forEach(function (sTargetNodeKey) {
                    var oTargetNode = oGraph.getNodeByKey(sTargetNodeKey);
                    if (oTargetNode) {
                        aConnections.push({
                            from: oSourceNode.getKey(),
                            to: oTargetNode.getKey(),
                            connectionType: sConnectionType,
                            fromNode: oSourceNode,
                            toNode: oTargetNode
                        });
                    }
                });
            }
        });

        // Call the callback for each connection
        aConnections.forEach(function (oConnection) {
            fnOnConnectionCreate(oConnection);
        });

        // Close the popover
        this._oPopover.close();
    };
    /**
     * Cleans up the popover and its controls
     * @private
     */
    CreateConnectionPopover.prototype._cleanup = function () {
        if (this._oPopover) {
            this._oPopover.destroy();
            this._oPopover = null;
        }
        this._oConnectionTypeCombo = null;
        this._oDestinationCombo = null;
        this._oOkButton = null;
        this._oCreateButton = null;
        this._oConnectionsContainer = null;
        this._aConnectionRows = [];
    };
    /**
     * Destroys the popover utility and cleans up resources
     * @public
     */
    CreateConnectionPopover.prototype.destroy = function () {
        this._cleanup();
    };
    return CreateConnectionPopover;
});
