/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
*/
sap.ui.define([
    "sap/ui/thirdparty/jquery",
    "sap/suite/ui/commons/library",
    "sap/suite/ui/commons/networkgraph/Utils"
], function (jQuery, Library, Utils) {
    "use strict";
    /**
     * PortManager class for managing network graph ports.
     * Implements singleton pattern to ensure only one instance exists.
     */
    class PortManager {
        constructor() {
            /**
             * Set of node keys that currently have trigger ports.
             * Used to track which nodes are acting as trigger nodes for port connections.
             * @type {Set<string>}
             * @private
             */
            this._triggerPortNodeKeys = new Set();
            /**
             * Reference to the current graph instance.
             * Used for accessing graph properties and nodes for port operations.
             * @type {sap.suite.ui.commons.networkgraph.Graph|null}
             * @private
             */
            this._graphInstance = null;
            /**
             * Key of the node that currently has trigger ports active.
             * Used for port restoration after graph rerendering and toggle behavior.
             * @type {string|null}
             * @private
             */
            this._currentTriggerNodeKey = null;
            /**
             * Flag indicating whether port restoration mechanism has been set up.
             * Prevents duplicate event listeners for graph ready events.
             * @type {boolean}
             * @private
             */
            this._restorationSetup = false;
        }

        /**
         * Reference to the ConnectionType enum for efficient access
         * @type {Object}
         * @private
         */
        static _oConnectionType = Library.networkgraph.ConnectionType;

        getGraphInstance() {
            return this._graphInstance;
        }
        setGraphInstance(oGraph) {
            this._graphInstance = oGraph;
            // Set up automatic port restoration after rerendering
            if (oGraph) {
                this.setupPortRestoration();
            }
        }
        /**
         * Adds ports to the given node instance based on the graph's nodePorts property.
         * @param {sap.suite.ui.commons.networkgraph.Node} oNode - The node instance.
         * @param {boolean} bTriggerNode - Whether the node is a trigger node.
         */
        addPortsToNode(oNode, bTriggerNode) {
            var sNodePorts = oNode._getNodePorts();
            // Remove existing ports first
            this.removePortsFromNode(oNode);
            if (sNodePorts === "None") {
                return;
            }
            var $node = oNode.$();
            // Add ports based on the nodePorts setting
            switch (sNodePorts) {
                case "All":
                    this._addPortToSide({ $node: $node, oNode: oNode, sSide: "left", bTriggerNode: bTriggerNode });
                    this._addPortToSide({ $node: $node, oNode: oNode, sSide: "right", bTriggerNode: bTriggerNode });
                    this._addPortToSide({ $node: $node, oNode: oNode, sSide: "top", bTriggerNode: bTriggerNode });
                    this._addPortToSide({ $node: $node, oNode: oNode, sSide: "bottom", bTriggerNode: bTriggerNode });
                    break;
                case "LeftRight":
                    this._addPortToSide({ $node: $node, oNode: oNode, sSide: "left", bTriggerNode: bTriggerNode });
                    this._addPortToSide({ $node: $node, oNode: oNode, sSide: "right", bTriggerNode: bTriggerNode });
                    break;
                case "TopBottom":
                    this._addPortToSide({ $node: $node, oNode: oNode, sSide: "top", bTriggerNode: bTriggerNode });
                    this._addPortToSide({ $node: $node, oNode: oNode, sSide: "bottom", bTriggerNode: bTriggerNode });
                    break;
                default:
                    // No ports to add
                    break;
            }
            if (bTriggerNode) {
                this._triggerPortNodeKeys.add(oNode.getKey());
                this._currentTriggerNodeKey = oNode.getKey();
            }
        }
        /**
         * Adds a port to a specific side of the node.
         * @param {Object} oConfig - Configuration object for port creation.
         * @param {jQuery} oConfig.$node - The node DOM element.
         * @param {sap.suite.ui.commons.networkgraph.Node} oConfig.oNode - The node instance.
         * @param {string} oConfig.sSide - The side to add the port to ("left", "right", "top", "bottom").
         * @param {boolean} oConfig.bTriggerNode - Whether this is a trigger node.
         */
        _addPortToSide(oConfig) {
            var $node = oConfig.$node;
            var oNode = oConfig.oNode;
            var sSide = oConfig.sSide;
            var bTriggerNode = oConfig.bTriggerNode;
            var sPortType = bTriggerNode ? "trigger" : "inlet";
            var sCapitalizedSide = sSide.charAt(0).toUpperCase() + sSide.slice(1);
            // Build the CSS classes based on port type and position
            var aClasses = ["sapSuiteUiCommonsNetworkNodePort"];
            // Add port type specific class
            aClasses.push("sapSuiteUiCommonsNetworkNode" + (bTriggerNode ? "TriggerPort" : "InletPort"));
            // Add position-specific class (matching the CSS class names)
            aClasses.push("sapSuiteUi" + sCapitalizedSide + (bTriggerNode ? "TriggerPort" : "InletPort"));
            var sPortClass = aClasses.join(" ");
            var $port = this._createPort({
                className: sPortClass,
                isAccessible: bTriggerNode, // Only trigger ports are accessible
                ariaLabel: bTriggerNode ? ("Connection port on " + sSide + " side of " + (oNode.getTitle() || "node")) : null,
                attributes: {
                    "data-node-key": oNode.getKey(),
                    "data-port-type": sPortType,
                    "data-port-side": sSide
                }
            });
            $node.append($port);
            if (bTriggerNode) {
                this._setupPortEvents($port, oNode);
            }
        }
        /**
         * Removes all ports from the given node instance.
         * @param {sap.suite.ui.commons.networkgraph.Node} oNode - The node instance.
         */
        removePortsFromNode(oNode) {
            oNode.$().find(".sapSuiteUiCommonsNetworkNodePort").remove();
            this._triggerPortNodeKeys.delete(oNode.getKey());
            if (this._currentTriggerNodeKey === oNode.getKey()) {
                this._currentTriggerNodeKey = null;
            }
        }
        /**
         * Removes all ports from all nodes and clears tracking.
         */
        removeAllPorts() {
            this._removeAlltriggerPorts();
            this.removeInletPortsFromOtherNodes();
            this.clearTriggerNodeTracking();
        }
        /**
         * Gets the current trigger node key.
         * @returns {string|null} The key of the current trigger node or null if none.
         */
        getCurrentTriggerNodeKey() {
            return this._currentTriggerNodeKey;
        }
        /**
         * Restores trigger ports to the previously active trigger node after rerendering.
         * This should be called after graph rerendering to maintain port state.
         */
        restoreTriggerPorts() {
            if (this._currentTriggerNodeKey && this._graphInstance) {
                var oTriggerNode = this._graphInstance.getNodeByKey(this._currentTriggerNodeKey);
                if (oTriggerNode) {
                    // Small delay to ensure DOM is ready after rerendering
                    setTimeout(function () {
                        this.addPortsToNode(oTriggerNode, true);
                    }.bind(this));
                }
            }
        }
        /**
         * Sets up automatic restoration of trigger ports after graph rerendering.
         * This method should be called once to set up the restoration mechanism.
         */
        setupPortRestoration() {
            if (!this._graphInstance || this._restorationSetup) {
                return;
            }
            // Listen for graph ready event to restore ports after rerendering
            this._graphInstance.attachGraphReady(function () {
                this.restoreTriggerPorts();
            }.bind(this));
            // Mark as setup to prevent duplicate handlers
            this._restorationSetup = true;
        }
        /**
         * Adds inlet ports to all nodes in the graph except the node with trigger ports.
         * @param {sap.suite.ui.commons.networkgraph.Node} oNode - The node instance.
         */
        addInletPortsToOtherNodes(oNode) {
            var oGraph = oNode.getParent();
            var sNodePorts = oNode._getNodePorts();
            // Don't add inlet ports if nodePorts is "None"
            if (sNodePorts === "None") {
                return;
            }
            oGraph.getNodes().forEach(function (oOtherNode) {
                const sKey = oOtherNode.getKey();
                var $otherNode = oOtherNode.$();
                // Skip the trigger node (node that was clicked to trigger port addition)
                if (sKey === this._currentTriggerNodeKey) {
                    return;
                }
                // Skip if inlet ports already exist
                if ($otherNode.find(".sapSuiteUiCommonsNetworkNodeInletPort").length > 0) {
                    return;
                }
                // Add inlet ports based on the nodePorts setting
                switch (sNodePorts) {
                    case "All":
                        this._addInletPortToSide({ $node: $otherNode, sSide: "left", sKey: sKey });
                        this._addInletPortToSide({ $node: $otherNode, sSide: "right", sKey: sKey });
                        this._addInletPortToSide({ $node: $otherNode, sSide: "top", sKey: sKey });
                        this._addInletPortToSide({ $node: $otherNode, sSide: "bottom", sKey: sKey });
                        break;
                    case "LeftRight":
                        this._addInletPortToSide({ $node: $otherNode, sSide: "left", sKey: sKey });
                        this._addInletPortToSide({ $node: $otherNode, sSide: "right", sKey: sKey });
                        break;
                    case "TopBottom":
                        this._addInletPortToSide({ $node: $otherNode, sSide: "top", sKey: sKey });
                        this._addInletPortToSide({ $node: $otherNode, sSide: "bottom", sKey: sKey });
                        break;
                    default:
                        // No inlet ports to add
                        break;
                }
            }.bind(this));
        }
        /**
         * Adds an inlet port to a specific side of the node.
         * @param {Object} oConfig - Configuration object for inlet port creation.
         * @param {jQuery} oConfig.$node - The node DOM element.
         * @param {string} oConfig.sSide - The side to add the port to ("left", "right", "top", "bottom").
         * @param {string} oConfig.sKey - The node key.
         */
        _addInletPortToSide(oConfig) {
            var $node = oConfig.$node;
            var sSide = oConfig.sSide;
            var sKey = oConfig.sKey;
            var sCapitalizedSide = sSide.charAt(0).toUpperCase() + sSide.slice(1);
            // Build the CSS classes for inlet port
            var aClasses = ["sapSuiteUiCommonsNetworkNodePort"];
            aClasses.push("sapSuiteUiCommonsNetworkNodeInletPort");
            aClasses.push("sapSuiteUi" + sCapitalizedSide + "InletPort");
            var sPortClass = aClasses.join(" ");
            var $port = this._createPort({
                className: sPortClass,
                attributes: {
                    "data-node-key": sKey,
                    "data-port-type": "inlet",
                    "data-port-side": sSide
                }
            });
            $node.append($port);
        }
        /**
         * Removes all inlet ports from the graph.
         */
        removeInletPortsFromOtherNodes() {
            jQuery(".sapSuiteUiCommonsNetworkNodeInletPort").remove();
        }
        /**
         * Removes trigger ports from the given node instance.
         * @param {sap.suite.ui.commons.networkgraph.Node} oNode - The node instance.
         */
        removeTriggerPortsFromNode(oNode) {
            oNode.$().find(".sapSuiteUiCommonsNetworkNodeLeftTriggerPort, .sapSuiteUiCommonsNetworkNodeRightTriggerPort").remove();
            this._triggerPortNodeKeys.delete(oNode.getKey());
        }
        /**
         * Creates a port element.
         * @param {Object} options - Configuration options for the port.
         * @returns {jQuery} - The created port element.
         */
        _createPort(options) {
            // Prepare accessibility attributes for trigger ports
            var mAttributes = options?.attributes || {};
            if (options.isAccessible) {
                mAttributes.tabindex = "0";
                mAttributes.role = "button";
                mAttributes["aria-label"] = options.ariaLabel || ("Port on " + options.position + " side");
                mAttributes["aria-describedby"] = options.ariaDescribedBy || null;
            }
            return jQuery("<div></div>", {
                "class": options.className,
                ...mAttributes
            });
        }
        /**
         * Sets up events for the given port.
         * @param {jQuery} $port - The port element.
         * @param {sap.suite.ui.commons.networkgraph.Node} oNode - The node instance.
         */
        _setupPortEvents($port, oNode) {
            $port.on("mousedown", this._onPortMouseDown.bind(this, $port, oNode));
            $port.on("keydown", this._onPortKeyDown.bind(this, $port, oNode));
            $port.on("focus", this._onPortFocus.bind(this, $port, oNode));
            $port.on("blur", this._onPortBlur.bind(this, $port, oNode));
        }
        /**
         * Handles keydown events on ports for accessibility navigation.
         * @param {jQuery} $port - The port element.
         * @param {sap.suite.ui.commons.networkgraph.Node} oNode - The node instance.
         * @param {Event} oEvent - The keydown event.
         */
        _onPortKeyDown($port, oNode, oEvent) {
            var iKeyCode = oEvent.keyCode || oEvent.which;
            // Shift+Tab key - Return focus to node (standard backward navigation)
            if (iKeyCode === 9 && oEvent.shiftKey) { // Tab key with Shift
                oEvent.preventDefault();
                oEvent.stopPropagation();
                this._returnFocusToNode(oNode);
                return;
            }
            // Enter key - Log port click
            if (iKeyCode === 13) { // KeyCodes.ENTER
                oEvent.preventDefault();
                oEvent.stopPropagation();
                // Get port information
                var sSide = $port.attr("data-port-side");
                var sNodeKey = $port.attr("data-node-key");
                var sPortType = $port.attr("data-port-type");
                // Use the Graph's accessibility system to announce port details
                var oGraph = oNode.getParent();
                if (oGraph && oGraph._setAccessibilityTitle) {
                    var sNodeLabel = oNode._getAccessibilityLabel(oGraph);
                    var sPortInfo = sNodeLabel + " " + sPortType + " port on " + sSide + " side. Node key: " + sNodeKey + ".";
                    oGraph._setAccessibilityTitle(sPortInfo);
                }
                return;
            }
        }
        /**
         * Handles focus events on ports.
         * @param {jQuery} $port - The port element.
         * @param {sap.suite.ui.commons.networkgraph.Node} oNode - The node instance.
         * @param {Event} oEvent - The focus event.
         */
        _onPortFocus($port, oNode, oEvent) {
            // Add visual focus indicator using SAP standard focus class
            $port.addClass("sapMFocused");
            // Use the Graph's accessibility system instead of our own announcements
            var oGraph = oNode.getParent();
            if (oGraph && oGraph._setAccessibilityTitle) {
                var sNodeLabel = oNode._getAccessibilityLabel(oGraph);
                var sSide = $port.attr("data-port-side");
                var sPortLabel = sNodeLabel + " " + sSide + " port focused. Press Enter for details, Space for connection, Shift+Tab to return to node.";
                oGraph._setAccessibilityTitle(sPortLabel);
            }
        }
        /**
         * Handles blur events on ports.
         * @param {jQuery} $port - The port element.
         * @param {sap.suite.ui.commons.networkgraph.Node} oNode - The node instance.
         * @param {Event} oEvent - The blur event.
         */
        _onPortBlur($port, oNode, oEvent) {
            // Remove visual focus indicator
            $port.removeClass("sapMFocused");
        }
        /**
         * Returns focus to the node from a port.
         * @param {sap.suite.ui.commons.networkgraph.Node} oNode - The node instance.
         */
        _returnFocusToNode(oNode) {
            // First, remove focus from any currently focused port
            var $currentPort = jQuery(document.activeElement);
            if ($currentPort.hasClass("sapSuiteUiCommonsNetworkNodePort")) {
                $currentPort.blur();
                $currentPort.removeClass("sapMFocused");
            }
            // Restore the Graph's focus state to the node (like Tab key behavior)
            var oGraph = oNode.getParent();
            if (oGraph) {
                oGraph.setFocus({
                    item: oNode,
                    button: null
                });
                // Use the Graph's accessibility system to announce the return
                if (oGraph._setAccessibilityTitle) {
                    var sNodeLabel = oNode._getAccessibilityLabel(oGraph);
                    var sReturnLabel = sNodeLabel + " Use Shift+Arrow keys to navigate to ports.";
                    oGraph._setAccessibilityTitle(sReturnLabel);
                }
            }
            // Focus the node wrapper or node itself
            var $focusTarget = oNode.$("wrapper");
            if (!$focusTarget || $focusTarget.length === 0) {
                $focusTarget = oNode.$();
            }
            if ($focusTarget && $focusTarget.length > 0) {
                $focusTarget.focus();
            }
        }
        /**
         * Handles the mousedown event for a port.
         * @param {jQuery} $port - The port element.
         * @param {sap.suite.ui.commons.networkgraph.Node} oNode - The node instance.
         * @param {Event} e - The event object.
         */
        _onPortMouseDown($port, oNode, e) {
            e.stopPropagation();
            e.preventDefault();
            // Create ghost port using CSS classes
            var $ghostPort = jQuery("<div></div>", {
                "class": "sapSuiteUiCommonsNetworkNodeGhostArrow",
                "style": "position: absolute; width: 13px; height: 19px;"
            });
            jQuery("body").append($ghostPort);
            // Create ghost line using CSS classes
            var $ghostLine = jQuery("<div></div>", {
                "class": "sapSuiteUiCommonsNetworkNodeGhostLine"
            });
            jQuery("body").append($ghostLine);
            var startRect = $port[0].getBoundingClientRect();
            var startX = startRect.left + startRect.width / 2;
            var startY = startRect.top + startRect.height / 2;
            $ghostPort.css({ left: startX + "px", top: startY + "px" });
            // Bind mousemove and mouseup events
            var onMouseMove = this._onPortMouseMove.bind(this, $ghostPort, $ghostLine, startX, startY, oNode);
            var onMouseUp = this._onPortMouseUp.bind(this, $ghostPort, $ghostLine, $port, oNode);
            jQuery(document).on("mousemove", onMouseMove);
            jQuery(document).on("mouseup", onMouseUp);
        }
        /**
         * Handles the mousemove event for a port.
         * @param {jQuery} $ghostPort - The ghost port element.
         * @param {jQuery} $ghostLine - The ghost line element.
         * @param {number} startX - The starting X coordinate.
         * @param {number} startY - The starting Y coordinate.
         * @param {sap.suite.ui.commons.networkgraph.Node} oNode - The node instance.
         * @param {Event} moveEvent - The event object.
         */
        _onPortMouseMove($ghostPort, $ghostLine, startX, startY, oNode, moveEvent) {
            // Center the ghost port on the cursor by offsetting by half its dimensions
            var ghostPortWidth = 10; // Default port width
            var ghostPortHeight = 10; // Default port height
            $ghostPort.css({
                left: (moveEvent.clientX - ghostPortWidth / 2) + "px",
                top: (moveEvent.clientY - ghostPortHeight / 2) + "px"
            });
            var length = Math.sqrt(Math.pow(moveEvent.clientX - startX, 2) + Math.pow(moveEvent.clientY - startY, 2));
            var angle = Math.atan2(moveEvent.clientY - startY, moveEvent.clientX - startX) * 180 / Math.PI;
            $ghostLine.css({
                width: length + "px",
                left: startX + "px",
                top: startY + "px",
                transform: `rotate(${angle}deg)`,
                transformOrigin: "0 0"
            });
            // Add inlet ports to other nodes
            this.addInletPortsToOtherNodes(oNode);
        }
        /**
         * Handles the mouseup event for a port.
         * @param {jQuery} $ghostPort - The ghost port element.
         * @param {jQuery} $ghostLine - The ghost line element.
         * @param {jQuery} $port - The port element.
         * @param {sap.suite.ui.commons.networkgraph.Node} oNode - The node instance.
         * @param {Event} mouseUpEvent - The event object.
         */
        _onPortMouseUp($ghostPort, $ghostLine, $port, oNode, mouseUpEvent) {
            jQuery(document).off("mousemove");
            jQuery(document).off("mouseup");
            $ghostPort.remove();
            $ghostLine.remove();
            const target = mouseUpEvent?.target?.closest('.sapSuiteUiCommonsNetworkNodeInletPort');
            if (target) {
                // get the source node and target node
                const sourceNode = oNode;
                const targetNode = sourceNode?.getParent()?.getNodeByKey(target.dataset.nodeKey);
                // Get the source and target port sides
                const sourcePortSide = $port.data("portSide");
                const targetPortSide = target.dataset.portSide;
                // Check if the target node is valid
                if (targetNode) {
                    const oGraph = sourceNode.getParent();
                    // Capture current scroll position before firing event
                    const scrollerElement = oGraph.$scroller[0];
                    const currentScrollLeft = scrollerElement.scrollLeft || 0;
                    const currentScrollTop = scrollerElement.scrollTop || 0;
                    const mParameters = {
                        from: sourceNode.getKey(),
                        to: targetNode.getKey(),
                        connectionType: this._getConnectionType(sourcePortSide, targetPortSide),
                        fromNode: sourceNode,
                        toNode: targetNode
                    };
                    // Fire the connectionCreated event
                    oGraph.fireConnectionCreated(mParameters);

                    // Preserve scroll position after event
                    Utils.preserveScrollPosition(oGraph, currentScrollLeft, currentScrollTop, 0);
                }
            }
            // Remove inlet ports from other nodes
            this.removeInletPortsFromOtherNodes();
        }
        /**
         * Navigates to a port based on direction when Space + Arrow is pressed on a node.
         * @param {sap.suite.ui.commons.networkgraph.Node} oNode - The node instance.
         * @param {string} sDirection - The direction (left, right, up, down).
         * @returns {boolean} True if navigation was successful, false otherwise.
         */
        navigateToPortFromNode(oNode, sDirection) {
            // Check if this node has trigger ports
            if (this._currentTriggerNodeKey !== oNode.getKey()) {
                return false;
            }
            // Map direction to port side
            var sPortSide;
            switch (sDirection) {
                case "left":
                    sPortSide = "left";
                    break;
                case "right":
                    sPortSide = "right";
                    break;
                case "up":
                    sPortSide = "top";
                    break;
                case "down":
                    sPortSide = "bottom";
                    break;
                default:
                    return false;
            }
            // Find the port element
            var $port = oNode.$().find('.sapSuiteUiCommonsNetworkNodeTriggerPort[data-port-side="' + sPortSide + '"]');
            if ($port.length === 0) {
                return false;
            }
            // Focus the port (Graph focus already cleared by KeyboardNavigator)
            $port.focus();
            return true;
        }
        /**
         * Clears the current trigger node tracking.
         * This can be called when ports should no longer be restored.
         */
        clearTriggerNodeTracking() {
            this._currentTriggerNodeKey = null;
        }

        _getConnectionType(sSourcePortSide, sTargetPortSide) {
            if (sSourcePortSide === "left" && sTargetPortSide === "right") {
                return PortManager._oConnectionType.LeftToRight;
            } else if (sSourcePortSide === "right" && sTargetPortSide === "left") {
                return PortManager._oConnectionType.RightToLeft;
            } else if (sSourcePortSide === "left" && sTargetPortSide === "left") {
                return PortManager._oConnectionType.LeftToLeft;
            } else if (sSourcePortSide === "right" && sTargetPortSide === "right") {
                return PortManager._oConnectionType.RightToRight;
            }
            return PortManager._oConnectionType.RightToLeft; // Default case
        }

        _removeAlltriggerPorts() {
            jQuery(".sapSuiteUiCommonsNetworkNodePort").remove();
            this._triggerPortNodeKeys.clear();
            this.clearTriggerNodeTracking();
        }
    }
    // Singleton instance
    let portManagerInstance = null;
    if (!portManagerInstance) {
        portManagerInstance = new PortManager();
    }
    return portManagerInstance;
});