/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "sap/suite/ui/commons/library"
], function (library) {
    "use strict";
    const ConnectionType = library.networkgraph.ConnectionType;
    const GRID_SIZE = 54; // Size of each grid cell
    const MIN_EDGE_LENGTH = 44; // Minimum length of an edge to avoid too short lines
    /**
     * Utility class for calculating connection paths between nodes in network graphs.
     * This utility provides a method to normalize lines and calculate path coordinates
     * based on different connection types.
     *
     * @namespace sap.suite.ui.commons.networkgraph.util.ConnectionPathUtils
     * @public
     * @since 1.144
     */
    var ConnectionPathUtils = {
        /**
         * Gets the effective connection type for path calculation based on RTL mode.
         * In RTL mode, semantic directions are reversed since nodes are already mirrored.
         *
         * @param {string} sConnectionType - The configured connection type
         * @param {boolean} bIsRTL - Whether RTL mode is enabled
         * @returns {string} The effective connection type to use for calculations
         * @private
         */
        _getEffectiveConnectionType: function (sConnectionType, bIsRTL) {
            if (!bIsRTL) {
                return sConnectionType;
            }

            // In RTL mode, semantic directions are reversed (nodes are already mirrored)
            const rtlMapping = {
                [ConnectionType.RightToLeft]: ConnectionType.LeftToRight,
                [ConnectionType.LeftToRight]: ConnectionType.RightToLeft,
                [ConnectionType.LeftToLeft]: ConnectionType.RightToRight,
                [ConnectionType.RightToRight]: ConnectionType.LeftToLeft
            };

            return rtlMapping[sConnectionType] || sConnectionType;
        },

        /**
         * Normalizes lines in a network graph by calculating path coordinates
         * between source and target nodes based on connection types.
         *
         * @param {sap.suite.ui.commons.networkgraph.Graph} oGraph - The network graph instance
         * @param {object} [mConfig] - Configuration object
         * @param {number} [mConfig.gridSize=50] - Size of each grid cell
         * @param {number} [mConfig.minEdgeLength=20] - Minimum length of an edge
         * @public
         */
        normalizeLines: function (oGraph, mConfig) {
            const config = Object.assign({
                gridSize: GRID_SIZE,
                minEdgeLength: MIN_EDGE_LENGTH
            }, mConfig || {});

            // Enable multiple directed arrows feature when using ConnectionPathUtils
            oGraph._enableMultipleDirectedArrows = true;

            // Detect RTL mode from graph
            const bIsRTL = oGraph._bIsRtl || false;

            // Iterate over all lines in the graph
            oGraph.getLines().forEach((oLine) => {
                const configuredConnectionType = oLine.getConnectionType(); // Get the connection type, if not configured at Line level then the default is Right to Left from source to target.
                // In RTL mode, use effective connection type (semantically reversed)
                const effectiveConnectionType = this._getEffectiveConnectionType(configuredConnectionType, bIsRTL);
                const oSourceNode = oLine.getFromNode();
                const oTargetNode = oLine.getToNode();
                // Get anchor coordinates for source and target nodes, usually the center of the respective sides
                const oSourceAnchor = this._getNodeAnchorCoordinates(oLine.getFromNode(), effectiveConnectionType, "source");
                const oTargetAnchor = this._getNodeAnchorCoordinates(oLine.getToNode(), effectiveConnectionType, "target");
                const mParams = {
                    sourceAnchor: oSourceAnchor,
                    targetAnchor: oTargetAnchor,
                    sourceNode: oSourceNode,
                    targetNode: oTargetNode,
                    sConnectionType: effectiveConnectionType,
                    gridSize: config.gridSize,
                    minEdgeLength: config.minEdgeLength
                };
                // Calculate the path coordinates between the source and target anchors
                const aCoordinates = this._calculatePathCoordinates(mParams);
                // set the anchor points of the source and target nodes on the line as source and target for drawing the path.
                oLine.setSource({
                    x: oSourceAnchor.x,
                    y: oSourceAnchor.y
                });
                oLine.setTarget({
                    x: oTargetAnchor.x,
                    y: oTargetAnchor.y
                });
                // Set the calculated bend points on the line
                oLine.clearBends();
                // Set the calculated bend points on the line, determined by the connection type.
                if (aCoordinates && aCoordinates.length) {
                    aCoordinates.forEach((oBend) => {
                        oLine.addBend(oBend);
                    });
                }
            });
        },
        /**
         * Calculates path coordinates between source and target anchors based on connection type.
         *
         * @param {object} mParams - Parameters for path calculation
         * @param {object} mParams.sourceAnchor - Source anchor coordinates {x, y}
         * @param {object} mParams.targetAnchor - Target anchor coordinates {x, y}
         * @param {object} mParams.sourceNode - Source node object
         * @param {object} mParams.targetNode - Target node object
         * @param {string} mParams.sConnectionType - Connection type
         * @param {number} [mParams.gridSize=50] - Grid size for calculations
         * @param {number} [mParams.minEdgeLength=20] - Minimum edge length
         * @returns {Array<object>} Array of bend point coordinates
         * @private
         */
        _calculatePathCoordinates: function (mParams) {
            const { sConnectionType } = mParams;
            switch (sConnectionType) {
                case ConnectionType.RightToLeft:
                    return this._handleRightToLeftConnection(mParams);
                case ConnectionType.LeftToRight:
                    return this._handleLeftToRightConnection(mParams);
                case ConnectionType.LeftToLeft:
                    return this._handleLeftToLeftConnection(mParams);
                case ConnectionType.RightToRight:
                    return this._handleRightToRightConnection(mParams);
                default:
                    // default RightToLeft case
                    // This is a fallback for any unrecognized connection type
                    return this._handleRightToLeftConnection(mParams);
            }
        },
        /**
         * ╔══════════════════════════════════════════════════════════════════════════════╗
         * ║                        RIGHT-TO-LEFT CONNECTION HANDLER                      ║
         * ╠══════════════════════════════════════════════════════════════════════════════╣
         * ║                                                                              ║
         * ║  [SRC NODE]→  ········→  ←[TGT NODE]                                         ║
         * ║                                                                              ║
         * ║  Calculates optimal path from right anchor of source to left anchor of       ║
         * ║  target, creating L-shaped, U-shaped, Z-bend, or S-shaped connections        ║
         * ║  based on node positions and grid constraints.                               ║
         * ║                                                                              ║
         * ╚══════════════════════════════════════════════════════════════════════════════╝
         */
        /**
         * Handles RightToLeft connection path calculation.
         * Connection flows from the right side of source node to the left side of target node.
         *
         * @param {object} mParams - Parameters for path calculation
         * @returns {Array<object>} Array of bend point coordinates
         * @private
         */
         _handleRightToLeftConnection: function (mParams) {
            const { sourceNode, gridSize = GRID_SIZE, minEdgeLength = MIN_EDGE_LENGTH } = mParams;
            const { x1, y1, x2, y2, AX1, AY1, AX2, AY2, dx } = this._transformSourceTargetCoordinates(mParams);

            // CASE 1: Source and target nodes are on the same horizontal line (y1 === y2)
            if (y1 === y2) {
                if (x2 > x1) {
                    // SCENARIO 1A: Direct horizontal connection (source right → target left)
                    // Check if anchors are aligned and connection pattern allows straight line
                    const anchorVerticalOffset = Math.abs(AY1 - AY2);
                    const shouldUseStraightLine = this._shouldUseHorizontalStraightLine(mParams.sourceNode, mParams.targetNode, mParams.sConnectionType);

                    if (shouldUseStraightLine && anchorVerticalOffset <= 5) {
                        // Visual: [SRC]----→[TGT] (perfect alignment)
                        return [];
                    } else if (anchorVerticalOffset > 5) {
                        // Visual: [SRC]→     ←[TGT] (offset anchors - add horizontal correction)
                        //              |     |
                        //              └─────┘
                        const midX = AX1 + (AX2 - AX1) / 2;
                        return [
                            { x: midX, y: AY1 },
                            { x: midX, y: AY2 }
                        ];
                    } else {
                        // Multiple connections - use straight line anyway for now
                        return [];
                    }
                } else if (x1 >= x2) {
                    // SCENARIO 1B: Backward horizontal connection (source overlaps/behind target)
                    // Visual: [TGT]    [SRC]
                    //             ↑----→ |
                    //             |      |
                    //             ←------↓
                    // Create U-shaped path going around both nodes
                    const x3 = this.getRightGridIntersectionPoint(AX1, AY1, gridSize, minEdgeLength).x;
                    const x4 = this.getLeftGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                    const y3 = this.getBottomGridIntersectionPoint(x3, y1 + sourceNode._iHeight, gridSize, minEdgeLength).y;

                    return [
                        { x: x3, y: AY1 }, // Right from source
                        { x: x3, y: y3 },  // Down below both nodes
                        { x: x4, y: y3 },  // Left to target column
                        { x: x4, y: AY2 }  // Up to target
                    ];
                }
            } else if (y1 != y2) {
                if (x1 <= x2) {
                    // SCENARIO 2A: Source is to the left or aligned with target
                    if (dx >= minEdgeLength + sourceNode._iWidth) {
                        if (Math.abs(x1 + sourceNode._iWidth - x2) <= gridSize) {
                            // SCENARIO 2A1: Nodes are close - use midpoint connection
                            // Visual: [SRC]→  ←[TGT]
                            //              |  |
                            //              ↓  ↑
                            //              (midpoint)
                            const x3 = AX1 + (x2 - (x1 + sourceNode._iWidth)) / 2;
                            return [{ x: x3, y: AY1 }, { x: x3, y: AY2 }];
                        } else {
                            // SCENARIO 2A2: Nodes are far apart - use grid-aligned Z-bend
                            // Visual: [SRC]→ |
                            //               |
                            //               ↓
                            //               ←[TGT]
                            const x3 = this.getRightGridIntersectionPoint(x1 + sourceNode._iWidth, AY1, gridSize, minEdgeLength).x;
                            return [{ x: x3, y: AY1 }, { x: x3, y: AY2 }];
                        }
                    } else if (dx <= minEdgeLength + sourceNode._iWidth) {
                        // SCENARIO 2B: Nodes are too close - create S-shaped path
                        if (y1 < y2) {
                            // SCENARIO 2B1: Source above target - S-bend going down
                            // Visual: [SRC]→ |
                            //               |
                            //               ↓----→ |
                            //                     |
                            //                     ↓
                            //               ←[TGT]
                            const x3 = this.getRightGridIntersectionPoint(x1 + sourceNode._iWidth, y1, gridSize, minEdgeLength).x;
                            const x4 = this.getLeftGridIntersectionPoint(x2, AY2, gridSize, minEdgeLength).x;
                            const y3 = this.getBottomGridIntersectionPoint(x3, y1 + sourceNode._iHeight, gridSize, minEdgeLength).y;
                            return [{ x: x3, y: AY1 }, { x: x3, y: y3 }, { x: x4, y: y3 }, { x: x4, y: AY2 }];
                        } else if (y1 > y2) {
                            // SCENARIO 2B2: Source below target - S-bend going up
                            // Visual:       ←[TGT]
                            //                     ↑
                            //               ↑----→ |
                            //               |
                            //               |
                            // [SRC]→ |
                            const x3 = this.getRightGridIntersectionPoint(AX1, AY2, gridSize, minEdgeLength).x;
                            const x4 = this.getLeftGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                            const y3 = this.getTopGridIntersectionPoint(x3, y1, gridSize, minEdgeLength).y;
                            return [{ x: x3, y: AY1 }, { x: x3, y: y3 }, { x: x4, y: y3 }, { x: x4, y: AY2 }];
                        }
                    }
                } else if (x1 > x2) {
                    // SCENARIO 3: Source is to the right of target - create S-shaped path
                    if (y1 < y2) {
                        // SCENARIO 3A: Source above and right of target - S-bend down and left
                        // Visual:       [SRC]→ |
                        //                     |
                        //                     ↓
                        // ←[TGT]    ←---------
                        const x3 = this.getRightGridIntersectionPoint(AX1, AY1, gridSize, minEdgeLength).x;
                        const x4 = this.getLeftGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                        const y3 = this.getBottomGridIntersectionPoint(x3, y1 + sourceNode._iHeight, gridSize, minEdgeLength).y;
                        return [
                            { x: x3, y: AY1 }, // Right from source
                            { x: x3, y: y3 },  // Down past both nodes
                            { x: x4, y: y3 },  // Left to target column
                            { x: x4, y: AY2 }  // Up to target
                        ];
                    } else if (y1 > y2) {
                        // SCENARIO 3B: Source below and right of target - S-bend up and left
                        // Visual: ←[TGT]    ←---------
                        //                           ↑
                        //                           |
                        //       [SRC]→ |
                        const x3 = this.getRightGridIntersectionPoint(AX1, AY1, gridSize, minEdgeLength).x;
                        const x4 = this.getLeftGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                        const y3 = this.getTopGridIntersectionPoint(x3, y1, gridSize, minEdgeLength).y;
                        return [{ x: x3, y: AY1 }, { x: x3, y: y3 }, { x: x4, y: y3 }, { x: x4, y: AY2 }];
                    }
                }
            }
            // DEFAULT: No bends needed (direct connection possible)
            return [];
        },
        /**
         * ╔══════════════════════════════════════════════════════════════════════════════╗
         * ║                        LEFT-TO-RIGHT CONNECTION HANDLER                      ║
         * ╠══════════════════════════════════════════════════════════════════════════════╣
         * ║                                                                              ║
         * ║  ←[SRC NODE]  ········→  [TGT NODE]→                                         ║
         * ║                                                                              ║
         * ║  Calculates optimal path from left anchor of source to right anchor of       ║
         * ║  target, creating direct, U-shaped, Z-bend, or S-shaped connections          ║
         * ║  based on node positions and grid alignment.                                 ║
         * ║                                                                              ║
         * ╚══════════════════════════════════════════════════════════════════════════════╝
         */
        /**
         * Handles LeftToRight connection path calculation.
         * Connection flows from the left side of source node to the right side of target node.
         *
         * @param {object} mParams - Parameters for path calculation
         * @returns {Array<object>} Array of bend point coordinates
         * @private
         */
        _handleLeftToRightConnection: function (mParams) {
            const { sourceNode, targetNode, gridSize = GRID_SIZE, minEdgeLength = MIN_EDGE_LENGTH } = mParams;
            const { x1, y1, x2, y2, AX1, AY1, AX2, AY2, dx } = this._transformSourceTargetCoordinates(mParams);
            // CASE 1: Source and target nodes are on the same horizontal line (y1 === y2)
            if (y1 === y2) {
                if (x1 > x2) {
                    // SCENARIO 1A: Direct horizontal connection (source left → target right, but source is actually to the right)
                    // Check if anchors are aligned and connection pattern allows straight line
                    const anchorVerticalOffset = Math.abs(AY1 - AY2);
                    const shouldUseStraightLine = this._shouldUseHorizontalStraightLine(mParams.sourceNode, mParams.targetNode, mParams.sConnectionType);

                    if (shouldUseStraightLine && anchorVerticalOffset <= 5) {
                        // Visual: [TGT]←----[SRC] (perfect alignment)
                        return [];
                    } else if (anchorVerticalOffset > 5) {
                        // Visual: ←[SRC]     [TGT]→ (offset anchors - add horizontal correction)
                        //          |           |
                        //          └───────────┘
                        const midX = AX1 + (AX2 - AX1) / 2;
                        return [
                            { x: midX, y: AY1 },
                            { x: midX, y: AY2 }
                        ];
                    } else {
                        // Multiple connections - use straight line anyway for now
                        return [];
                    }
                } else if (x1 <= x2) {
                    // SCENARIO 1B: Forward horizontal connection but needs U-shape (source overlaps/in front of target)
                    // Visual: [SRC] [TGT]
                    //          ↓----→ |
                    //          |      |
                    //          ↑------↓
                    // Create U-shaped path going around both nodes
                    const x3 = this.getLeftGridIntersectionPoint(AX1, AY1, gridSize, minEdgeLength).x;
                    const x4 = this.getRightGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                    const y3 = this.getBottomGridIntersectionPoint(x3, y1 + sourceNode._iHeight, gridSize, minEdgeLength).y;

                    return [
                        { x: x3, y: AY1 }, // Right from source
                        { x: x3, y: y3 },  // Down below both nodes
                        { x: x4, y: y3 },  // Left to target column
                        { x: x4, y: AY2 }  // Up to target
                    ];
                }
            } else if (y1 != y2) {
                // CASE 2: Source and target nodes are on different horizontal lines (y1 != y2)
                if (x1 >= x2) {
                    // SCENARIO 2A: Source is to the right or aligned with target
                    if (dx >= minEdgeLength + targetNode._iWidth) {
                        if (Math.abs(x1 - (x2 + targetNode._iWidth)) <= gridSize) {
                            // SCENARIO 2A1: Nodes are close - use midpoint connection
                            // Visual: ←[SRC]  [TGT]→
                            //         |        |
                            //         ↓        ↑
                            //         (midpoint)
                            const x3 = (AX1 + AX2) / 2;
                            return [{ x: x3, y: AY1 }, { x: x3, y: AY2 }];
                        } else {
                            // SCENARIO 2A2: Nodes are far apart - use grid-aligned Z-bend
                            // Visual: ←[SRC] |
                            //               |
                            //               ↓
                            //         [TGT]→
                            const x3 = this.getLeftGridIntersectionPoint(AX1, AY1, gridSize, minEdgeLength).x;
                            return [{ x: x3, y: AY1 }, { x: x3, y: AY2 }];
                        }
                    } else if (dx <= minEdgeLength + targetNode._iWidth) {
                        // SCENARIO 2B: Nodes are too close - create S-shaped path
                        if (y1 < y2) {
                            // SCENARIO 2B1: Source above target - S-bend going down
                            // Visual: ←[SRC] |
                            //               |
                            //         ←---- ↓
                            //         |
                            //         ↓
                            //         [TGT]→
                            const x3 = this.getLeftGridIntersectionPoint(AX1, AY1, gridSize, minEdgeLength).x;
                            const x4 = this.getRightGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                            const y3 = this.getBottomGridIntersectionPoint(x3, y1 + sourceNode._iHeight, gridSize, minEdgeLength).y;
                            return [{ x: x3, y: AY1 }, { x: x3, y: y3 }, { x: x4, y: y3 }, { x: x4, y: AY2 }];
                        } else if (y1 > y2) {
                            // SCENARIO 2B2: Source below target - S-bend going up
                            // Visual:         [TGT]→
                            //                     ↑
                            //         ←------     |
                            //         |
                            //         |
                            // ←[SRC] |
                            const x3 = this.getLeftGridIntersectionPoint(AX1, AY2, gridSize, minEdgeLength).x;
                            const x4 = this.getRightGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                            const y3 = this.getTopGridIntersectionPoint(x3, y1, gridSize, minEdgeLength).y;
                            return [{ x: x3, y: AY1 }, { x: x3, y: y3 }, { x: x4, y: y3 }, { x: x4, y: AY2 }];
                        }
                    }
                } else if (x1 < x2) {
                    // SCENARIO 3: Source is to the left of target - create S-shaped path
                    if (y1 < y2) {
                        // SCENARIO 3A: Source above and left of target - S-bend down and right
                        // Visual: ←[SRC] |
                        //               |
                        //               ↓
                        //               --------→[TGT]
                        const x3 = this.getLeftGridIntersectionPoint(AX1, AY1, gridSize, minEdgeLength).x;
                        const x4 = this.getRightGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                        const y3 = this.getBottomGridIntersectionPoint(x3, y1 + sourceNode._iHeight, gridSize, minEdgeLength).y;
                        return [{ x: x3, y: AY1 }, { x: x3, y: y3 }, { x: x4, y: y3 }, { x: x4, y: AY2 }];
                    } else if (y1 > y2) {
                        // SCENARIO 3B: Source below and left of target - S-bend up and right
                        // Visual:               --------→[TGT]
                        //                               ↑
                        //                               |
                        //         ←[SRC] |
                        const x3 = this.getLeftGridIntersectionPoint(AX1, AY1, gridSize, minEdgeLength).x;
                        const x4 = this.getRightGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                        const y3 = this.getTopGridIntersectionPoint(x3, y1, gridSize, minEdgeLength).y;
                        return [{ x: x3, y: AY1 }, { x: x3, y: y3 }, { x: x4, y: y3 }, { x: x4, y: AY2 }];
                    }
                }
            }
            // DEFAULT: No bends needed (direct connection possible)
            return [];
        },
        /**
         * ╔══════════════════════════════════════════════════════════════════════════════╗
         * ║                         LEFT-TO-LEFT CONNECTION HANDLER                      ║
         * ╠══════════════════════════════════════════════════════════════════════════════╣
         * ║                                                                              ║
         * ║  ←[SRC NODE]  ········→  ←[TGT NODE]                                         ║
         * ║                                                                              ║
         * ║  Calculates optimal path from left anchor of source to left anchor of        ║
         * ║  target, creating C-shaped or stepped connections that route around          ║
         * ║  the left side of both nodes to avoid overlaps.                              ║
         * ║                                                                              ║
         * ╚══════════════════════════════════════════════════════════════════════════════╝
         */
        /**
         * Handles LeftToLeft connection path calculation.
         * Connection flows from the left side of source node to the left side of target node.
         *
         * @param {object} mParams - Parameters for path calculation
         * @returns {Array<object>} Array of bend point coordinates
         * @private
         */
        _handleLeftToLeftConnection: function (mParams) {
            const { sourceNode, targetNode, gridSize = GRID_SIZE, minEdgeLength = MIN_EDGE_LENGTH } = mParams;
            const { x1, y1, x2, y2, AX1, AY1, AX2, AY2 } = this._transformSourceTargetCoordinates(mParams);
            // CASE 1: Source and target nodes are on the same horizontal line (y1 === y2)
            if (y1 === y2) {
                if (x1 > x2) {
                    // SCENARIO 1A: Source to the right of target - create C-shaped path on left side
                    // Visual:    ←[TGT] ←[SRC]
                    //            |           |
                    //            ↓           |
                    //            ←-----------↓
                    // Check if nodes are close enough for midpoint, else use grid-aligned path
                    const x3 = Math.abs(x1 - x2 + targetNode._iWidth) <= gridSize ?
                        (AX1 + (x2 + targetNode._iWidth)) / 2 :
                        this.getLeftGridIntersectionPoint(AX1, AY1, gridSize, minEdgeLength).x;
                    const x4 = this.getLeftGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                    const y3 = y1 <= gridSize ? this.getBottomGridIntersectionPoint(x3, y1 + sourceNode._iHeight, gridSize, minEdgeLength).y : this.getTopGridIntersectionPoint(x3, y1, gridSize, minEdgeLength).y;
                    return [
                        { x: x3, y: AY1 }, // Left from source
                        { x: x3, y: y3 },  // Down/up to avoid nodes
                        { x: x4, y: y3 },  // Across to target column
                        { x: x4, y: AY2 }  // Up/down to target
                    ];
                } else if (x1 <= x2) {
                    // SCENARIO 1B: Source to the left of target - create C-shaped path on left side
                    // Visual: ←[SRC]    ←[TGT]
                    //         |             |
                    //         ↓             |
                    //         →-------------↓
                    const x3 = this.getLeftGridIntersectionPoint(AX1, AY1, gridSize, minEdgeLength).x;
                    const x4 = Math.abs(x1 + sourceNode._iWidth - x2) <= gridSize ?
                        (AX2 + x2) / 2 :
                        this.getLeftGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                    const y3 = y1 <= gridSize ? this.getBottomGridIntersectionPoint(x3, y1 + sourceNode._iHeight, gridSize, minEdgeLength).y : this.getTopGridIntersectionPoint(x3, y1, gridSize, minEdgeLength).y;
                    return [{ x: x3, y: AY1 }, { x: x3, y: y3 }, { x: x4, y: y3 }, { x: x4, y: AY2 }];
                }
            } else if (y1 != y2) {
                // CASE 2: Source and target nodes are on different horizontal lines (y1 != y2)
                /**
                 * When the source and target nodes are not on the same horizontal line (y1 != y2)
                 * Then nodes can be placed in either x1 > x2 or x1 < x2
                 * with these positions there can be two cases:
                 * 1. y1 < y2: source node is above the target node
                 * 2. y1 > y2: source node is below the target node
                 * In both cases we need to calculate the vertical bend points based on node's y so that the lines do not overlap with the target node.
                 * If x1 < x2 and y1 < y2 then we know that source node is above the target node and to the left of it. Based on AY2 we can calculate above or below bend points.
                 */
                if (x1 > x2) {
                    // SCENARIO 2A: Source is to the right of target
                    if (y1 < y2) {
                        // SCENARIO 2A1: Source above and right of target
                        if (AY1 < y2) {
                            // Simple vertical connection if source anchor is above target node
                            // Visual: ←[SRC]
                            //         |
                            //         |
                            //         ↓
                            //         ←[TGT]
                            const x4 = this.getLeftGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                            return [{ x: x4, y: AY1 }, { x: x4, y: AY2 }];
                        } else if (AY1 >= y2) {
                            // Need to avoid target node - create stepped path
                            // Visual:        ←[SRC]
                            //                |
                            //  ←[TGT]  ←-----↓
                            const iDiff = Math.abs(AX1 - (x2 + targetNode._iWidth));
                            let x3 = null;
                            if (iDiff <= gridSize) {
                                x3 = iDiff < minEdgeLength ? (AX1 + (x2 + targetNode._iWidth) / 2) : AX1 - minEdgeLength;
                            } else {
                                x3 = this.getLeftGridIntersectionPoint(AX1, AY1, gridSize, minEdgeLength).x;
                            }
                            const x4 = this.getLeftGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                            const y3 = this.getTopGridIntersectionPoint(x4, y2, gridSize, minEdgeLength).y;
                            return [{ x: x3, y: AY1 }, { x: x3, y: y3 }, { x: x4, y: y3 }, { x: x4, y: AY2 }];
                        }
                    } else if (y1 > y2) {
                        // SCENARIO 2A2: Source below and right of target
                        if (AY1 > y2 + targetNode._iHeight) {
                            // Simple vertical connection if source anchor is below target node
                            // Visual: ←[TGT]
                            //         |
                            //         |
                            //         ↑
                            //         ←[SRC]
                            const x4 = this.getLeftGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                            return [{ x: x4, y: AY1 }, { x: x4, y: AY2 }];
                        } else if (AY1 <= y2 + targetNode._iHeight) {
                            // Need to avoid target node - create stepped path
                            // Visual:  ←[TGT]  ←-----↑
                            //                 |
                            //         ←[SRC]
                            const iDiff = Math.abs(AX1 - (x2 + targetNode._iWidth));
                            let x3 = null;
                            if (iDiff <= gridSize) {
                                x3 = iDiff < AX1 + minEdgeLength ? (AX1 + (x2 + targetNode._iWidth) / 2) : AX1 + minEdgeLength;
                            } else {
                                x3 = this.getLeftGridIntersectionPoint(AX1, AY1, gridSize, minEdgeLength).x;
                            }
                            const x4 = this.getLeftGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                            const y3 = this.getBottomGridIntersectionPoint(x4, y2 + targetNode._iHeight, gridSize, minEdgeLength).y;
                            return [{ x: x3, y: AY1 }, { x: x3, y: y3 }, { x: x4, y: y3 }, { x: x4, y: AY2 }];
                        }
                    }
                } else if (x1 <= x2) {
                    // SCENARIO 2B: Source is to the left of target
                    if (y1 < y2) {
                        // SCENARIO 2B1: Source above and left of target
                        // Visual: ←[SRC]
                        //         |
                        //         ↓-------→ |
                        //                  ↓
                        //                  ←[TGT]
                        const x3 = this.getLeftGridIntersectionPoint(AX1, AY1, gridSize, minEdgeLength).x;
                        const iDiff = Math.abs(x1 + sourceNode._iWidth - x2);
                        let x4 = null;
                        if (iDiff <= gridSize) {
                            x4 = iDiff < minEdgeLength ? (AX2 + (x1 + sourceNode._iWidth)) / 2 : AX2 + minEdgeLength;
                        } else {
                            x4 = this.getLeftGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                        }
                        const y3 = (AY2 > (y1 + sourceNode._iHeight)) ? AY2 : this.getBottomGridIntersectionPoint(x3, y1 + sourceNode._iHeight, gridSize, minEdgeLength).y;
                        const aCoordinates = AY2 > (y1 + sourceNode._iHeight) ? [{ x: x3, y: AY1 }, { x: x3, y: y3 }] : [{ x: x3, y: AY1 }, { x: x3, y: y3 }, { x: x4, y: y3 }, { x: x4, y: AY2 }];
                        return aCoordinates;
                    } else if (y1 > y2) {
                        // SCENARIO 2B2: Source below and left of target
                        // Visual:                  ←[TGT]
                        //                          ↑
                        //         ←-------→ |
                        //         |
                        //         ←[SRC]
                        const x3 = this.getLeftGridIntersectionPoint(AX1, AY2, gridSize, minEdgeLength).x;
                        const iDiff = Math.abs(x1 + sourceNode._iWidth - x2);
                        let x4 = null;
                        if (iDiff <= gridSize) {
                            x4 = iDiff < minEdgeLength ? (AX2 + (x1 + sourceNode._iWidth)) / 2 : AX2 + minEdgeLength;
                        } else {
                            x4 = this.getLeftGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                        }
                        const y3 = (AY2 < y1) ? AY2 : this.getTopGridIntersectionPoint(x3, y1, gridSize, minEdgeLength).y;
                        const aCoordinates = AY2 < y1 ? [{ x: x3, y: AY1 }, { x: x3, y: y3 }] : [{ x: x3, y: AY1 }, { x: x3, y: y3 }, { x: x4, y: y3 }, { x: x4, y: AY2 }];
                        return aCoordinates;
                    }
                }
            }
            // DEFAULT: No bends needed (direct connection possible)
            return [];
        },
        /**
         * ╔══════════════════════════════════════════════════════════════════════════════╗
         * ║                       RIGHT-TO-RIGHT CONNECTION HANDLER                      ║
         * ╠══════════════════════════════════════════════════════════════════════════════╣
         * ║                                                                              ║
         * ║  [SRC NODE]→  ········→  [TGT NODE]→                                         ║
         * ║                                                                              ║
         * ║  Calculates optimal path from right anchor of source to right anchor of      ║
         * ║  target, creating C-shaped or stepped connections that route around          ║
         * ║  the right side of both nodes to avoid overlaps.                             ║
         * ║                                                                              ║
         * ╚══════════════════════════════════════════════════════════════════════════════╝
         */
        /**
         * Handles RightToRight connection path calculation.
         * Connection flows from the right side of source node to the right side of target node.
         *
         * @param {object} mParams - Parameters for path calculation
         * @returns {Array<object>} Array of bend point coordinates
         * @private
         */
        _handleRightToRightConnection: function (mParams) {
            const { sourceNode, targetNode, gridSize = GRID_SIZE, minEdgeLength = MIN_EDGE_LENGTH } = mParams;
            const { x1, y1, x2, y2, AX1, AY1, AX2, AY2 } = this._transformSourceTargetCoordinates(mParams);
            // CASE 1: Source and target nodes are on the same horizontal line (y1 === y2)
            if (y1 === y2) {
                if (x1 > x2) {
                    // SCENARIO 1A: Source to the right of target - create C-shaped path on right side
                    // Visual: [TGT]→     [SRC]→
                    //              |         |
                    //              ↓         |
                    //              →---------↓
                    const x3 = this.getRightGridIntersectionPoint(AX1, AY1, gridSize, minEdgeLength).x;
                    const iDiff = Math.abs(x1 - AX2);
                    const x4 = iDiff <= gridSize ? (x1 + x2) / 2 : this.getRightGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                    const y3 = y1 < gridSize ? this.getBottomGridIntersectionPoint(x3, y1 + sourceNode._iHeight, gridSize, minEdgeLength).y : this.getTopGridIntersectionPoint(x3, y1, gridSize, minEdgeLength).y;
                    return [{ x: x3, y: AY1 }, { x: x3, y: y3 }, { x: x4, y: y3 }, { x: x4, y: AY2 }];
                } else if (x1 <= x2) {
                    // SCENARIO 1B: Source to the left of target - create C-shaped path on right side
                    // Visual: [SRC]→             [TGT]→
                    //              |                 |
                    //              ↓                 |
                    //              →-----------------↓
                    const iDff = Math.abs(AX1 - x2);
                    const x3 = iDff <= gridSize ? (AX1 + x2) / 2 : this.getRightGridIntersectionPoint(AX1, AY1, gridSize, minEdgeLength).x;
                    const x4 = this.getRightGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                    const y3 = y1 < gridSize ? this.getBottomGridIntersectionPoint(x3, y1 + sourceNode._iHeight, gridSize, minEdgeLength).y : this.getTopGridIntersectionPoint(x3, y1, gridSize, minEdgeLength).y;
                    return [{ x: x3, y: AY1 }, { x: x3, y: y3 }, { x: x4, y: y3 }, { x: x4, y: AY2 }];
                }
            } else if (y1 != y2) {
                // CASE 2: Source and target nodes are on different horizontal lines (y1 != y2)
                if (x1 > x2) {
                    // SCENARIO 2A: Source is to the right of target
                    if (y1 < y2) {
                        // SCENARIO 2A1: Source above and right of target
                        // Visual: [SRC]→
                        //              |
                        //              ↓--------→ |
                        //                         ↓
                        //                    [TGT]→
                        const x3 = this.getRightGridIntersectionPoint(AX1, AY1, gridSize, minEdgeLength).x;
                        const iDiff = Math.abs(AX2 - x1);
                        let x4 = null;
                        if (iDiff <= gridSize) {
                            x4 = iDiff < minEdgeLength ? (AX2 + x1) / 2 : AX2 + minEdgeLength;
                        } else {
                            x4 = this.getRightGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                        }
                        const y3 = y1 <= gridSize ? this.getBottomGridIntersectionPoint(x3, y1 + sourceNode._iHeight, gridSize, minEdgeLength).y : this.getTopGridIntersectionPoint(x3, y1, gridSize, minEdgeLength).y;
                        if (AY2 > y1 + sourceNode._iHeight) {
                            // Simple vertical connection if target anchor is below source node
                            // Visual: [SRC]→
                            //              |
                            //              ↓
                            //              [TGT]→
                            const aCords = AX2 > AX1 ? [{x: x4, y: AY1}, {x: x4, y: AY2}] : [{ x: x3, y: AY1 }, { x: x3, y: AY2 }];
                            return aCords;
                        } else {
                            // Need to avoid target node - create stepped path
                            // Visual: [SRC]→
                            //              |
                            //         ↓---- →
                            //         |
                            //     [TGT]→
                            return [{ x: x3, y: AY1 }, { x: x3, y: y3 }, { x: x4, y: y3 }, { x: x4, y: AY2 }];
                        }
                    } else if (y1 > y2) {
                        // SCENARIO 2A2: Source below and right of target
                        // Visual:                    [TGT]→
                        //                                 ↑
                        //              ↑--------→ |
                        //              |
                        //         [SRC]→
                        const x3 = this.getRightGridIntersectionPoint(AX1, AY1, gridSize, minEdgeLength).x;
                        const iDiff = Math.abs(AX2 - x1);
                        let x4 = null;
                        if (iDiff <= gridSize) {
                            x4 = iDiff < minEdgeLength ? (AX2 + x1) / 2 : AX2 + minEdgeLength;
                        } else {
                            x4 = this.getRightGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                        }
                        const y3 = y2 <= gridSize ? this.getBottomGridIntersectionPoint(x3, y1 + sourceNode._iHeight, gridSize, minEdgeLength) : this.getTopGridIntersectionPoint(x4, y2, gridSize, minEdgeLength).y;
                        if (AY1 > y2 + targetNode._iHeight) {
                            // Simple vertical connection if target anchor is below source node
                            // Visual: [SRC]→
                            //              |
                            //              ↓
                            //              [TGT]→
                            const aCords = AX2 > AX1 ? [{x: x4, y: AY1}, {x: x4, y: AY2}] : [{ x: x3, y: AY1 }, { x: x3, y: AY2 }];
                            return aCords;
                        } else {
                            // Need to avoid target node - create stepped path
                            // Visual: [SRC]→
                            //              |
                            //         ↓---- →
                            //         |
                            //     [TGT]→
                            return [{ x: x3, y: AY1 }, { x: x3, y: y3 }, { x: x4, y: y3 }, { x: x4, y: AY2 }];
                        }
                    }
                } else if (x1 <= x2) {
                    // SCENARIO 2B: Source is to the left of target
                    if (y1 < y2) {
                        // SCENARIO 2B1: Source above and left of target
                        // Visual: [SRC]→
                        //              |
                        //              ↓----------→ |
                        //                           ↓
                        //                      [TGT]→
                        const x3 = this.getRightGridIntersectionPoint(AX1, AY1, gridSize, minEdgeLength).x;
                        const iDiff = Math.abs(x2 - AX1);
                        let x4 = null;
                        if (iDiff <= gridSize && !(AY2 > y1 + sourceNode._iHeight)) {
                            x4 = iDiff < minEdgeLength ? (x2 + AX1) / 2 : AX1 - minEdgeLength;
                        } else {
                            x4 = this.getRightGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                        }
                        const y3 = y1 <= gridSize ? this.getBottomGridIntersectionPoint(x3, y1 + sourceNode._iHeight, gridSize, minEdgeLength).y : this.getTopGridIntersectionPoint(x3, y1, gridSize, minEdgeLength).y;
                        if (AY2 > y1 + sourceNode._iHeight) {
                            // Simple vertical connection if target anchor is below source node
                            // Visual: [SRC]→
                            //              |
                            //              ↓
                            //              [TGT]→
                            const aCords = AX2 > AX1 ? [{x: x4, y: AY1}, {x: x4, y: AY2}] : [{ x: x3, y: AY1 }, { x: x3, y: AY2 }];
                            return aCords;
                        } else {
                            // Need to avoid target node - create stepped path
                            // Visual: [SRC]→
                            //              |
                            //         ↓---- →
                            //         |
                            //     [TGT]→
                            return [{ x: x3, y: AY1 }, { x: x3, y: y3 }, { x: x4, y: y3 }, { x: x4, y: AY2 }];
                        }
                        // const aCoordinates = (AY2 > y1 + sourceNode._iHeight) ? [{ x: x4, y: AY1 }, { x: x4, y: AY2 }] : [{ x: x3, y: AY1 }, { x: x3, y: y3 }, { x: x4, y: y3 }, { x: x4, y: AY2 }];
                        // return aCoordinates;
                    } else if (y1 > y2) {
                        // SCENARIO 2B2: Source below and left of target
                        // Visual:                      [TGT]→
                        //                                   ↑
                        //              ↑----------→ |
                        //              |
                        //         [SRC]→
                        const x3 = this.getRightGridIntersectionPoint(AX1, AY1, gridSize, minEdgeLength).x;
                        const iDiff = Math.abs(x2 - AX1);
                        let x4 = null;
                        if (iDiff <= gridSize && !(AY1 > y2 + targetNode._iHeight)) {
                            x4 = iDiff < minEdgeLength ? (x2 + AX1) / 2 : AX1 - minEdgeLength;
                        } else {
                            x4 = this.getRightGridIntersectionPoint(AX2, AY2, gridSize, minEdgeLength).x;
                        }
                        const y3 = y2 <= gridSize ? this.getBottomGridIntersectionPoint(x3, y1 + sourceNode._iHeight, gridSize, minEdgeLength) : this.getTopGridIntersectionPoint(x4, y2, gridSize, minEdgeLength).y;
                        if (AY1 > y2 + targetNode._iHeight) {
                            // Simple vertical connection if target anchor is below source node
                            // Visual: [SRC]→
                            //              |
                            //              ↓
                            //              [TGT]→
                            const aCords = AX2 > AX1 ? [{x: x4, y: AY1}, {x: x4, y: AY2}] : [{ x: x3, y: AY1 }, { x: x3, y: AY2 }];
                            return aCords;
                        } else {
                            // Need to avoid target node - create stepped path
                            // Visual: [SRC]→
                            //              |
                            //         ↓---- →
                            //         |
                            //     [TGT]→
                            return [{ x: x3, y: AY1 }, { x: x3, y: y3 }, { x: x4, y: y3 }, { x: x4, y: AY2 }];
                        }
                        // const aCoordinates = (AY1 > y2 + targetNode._iHeight) ? [{ x: x4, y: AY1 }, { x: x4, y: AY2 }] : [{ x: x3, y: AY1 }, { x: x3, y: y3 }, { x: x4, y: y3 }, { x: x4, y: AY2 }];
                        // return aCoordinates;
                    }
                }
            }
            // DEFAULT: No bends needed (direct connection possible)
            return [];
        },
        /**
         * Calculates the right grid intersection point.
         *
         * @param {number} x - X coordinate
         * @param {number} y - Y coordinate
         * @param {number} [gridSize=50] - Size of grid cells
         * @param {number} [minEdgeLength=20] - Minimum edge length
         * @returns {object} Intersection point {x, y}
         * @public
         */
        getRightGridIntersectionPoint: function (x, y, gridSize = GRID_SIZE, minEdgeLength = MIN_EDGE_LENGTH) {
            let xIntersection = Math.ceil(x / gridSize) * gridSize;
            if (xIntersection - x < minEdgeLength) {
                xIntersection += gridSize; // Ensure the intersection is at least MIN_EDGE_LENGTH away
            }
            return { x: xIntersection, y: y };
        },
        /**
         * Calculates the left grid intersection point.
         *
         * @param {number} x - X coordinate
         * @param {number} y - Y coordinate
         * @param {number} [gridSize=50] - Size of grid cells
         * @param {number} [minEdgeLength=20] - Minimum edge length
         * @returns {object} Intersection point {x, y}
         * @public
         */
        getLeftGridIntersectionPoint: function (x, y, gridSize = GRID_SIZE, minEdgeLength = MIN_EDGE_LENGTH) {
            let xIntersection = Math.floor(x / gridSize) * gridSize;
            if (x - xIntersection < minEdgeLength) {
                xIntersection -= gridSize; // Ensure the intersection is at least MIN_EDGE_LENGTH away
            }
            return { x: xIntersection, y: y };
        },
        /**
         * Calculates the top grid intersection point.
         *
         * @param {number} x - X coordinate
         * @param {number} y - Y coordinate
         * @param {number} [gridSize=50] - Size of grid cells
         * @param {number} [minEdgeLength=20] - Minimum edge length
         * @returns {object} Intersection point {x, y}
         * @public
         */
        getTopGridIntersectionPoint: function (x, y, gridSize = GRID_SIZE, minEdgeLength = MIN_EDGE_LENGTH) {
            let yIntersection = Math.floor(y / gridSize) * gridSize;
            if (y - yIntersection < minEdgeLength) {
                yIntersection -= gridSize; // Ensure the intersection is at least MIN_EDGE_LENGTH away
            }
            return { x: x, y: yIntersection };
        },
        /**
         * Calculates the bottom grid intersection point.
         *
         * @param {number} x - X coordinate
         * @param {number} y - Y coordinate
         * @param {number} [gridSize=50] - Size of grid cells
         * @param {number} [minEdgeLength=20] - Minimum edge length
         * @returns {object} Intersection point {x, y}
         * @public
         */
        getBottomGridIntersectionPoint: function (x, y, gridSize = GRID_SIZE, minEdgeLength = MIN_EDGE_LENGTH) {
            let yIntersection = Math.ceil(y / gridSize) * gridSize;
            if (yIntersection - y < minEdgeLength) {
                yIntersection += gridSize; // Ensure the intersection is at least MIN_EDGE_LENGTH away
            }
            return { x: x, y: yIntersection };
        },
        /**
         * Gets the anchor coordinates for a node based on connection type and anchor type.
         * Enhanced to handle center positioning for single connections and offset positioning for mixed connections.
         *
         * @param {object} oNode - The node object
         * @param {string} sConnectionType - Connection type
         * @param {string} sAnchorType - Anchor type ("source" or "target")
         * @returns {object} Anchor coordinates {x, y}
         * @private
         */
        _getNodeAnchorCoordinates: function (oNode, sConnectionType, sAnchorType) {
            const x = oNode.getX();
            const y = oNode.getY();
            const width = oNode._iWidth;
            const height = oNode._iHeight;
            const centerY = y + (height / 2);

            // Enhanced anchor calculation with connection pattern analysis
            const oConnectionAnalysis = this._analyzeNodeConnectionPatterns(oNode);
            // Determine the port position based on the connection type and analysis
            switch (sConnectionType) {
                case "LeftToLeft":
                    if (sAnchorType === "source") {
                        // Source anchor on left side
                        return this._calculateEnhancedAnchor({
                            node: { x, y, width, height, centerY },
                            side: "left",
                            analysis: oConnectionAnalysis,
                            anchorType: sAnchorType
                        });
                    } else {
                        // Target anchor on left side
                        return this._calculateEnhancedAnchor({
                            node: { x, y, width, height, centerY },
                            side: "left",
                            analysis: oConnectionAnalysis,
                            anchorType: sAnchorType
                        });
                    }
                case "LeftToRight":
                    if (sAnchorType === "source") {
                        // Source anchor on left side
                        return this._calculateEnhancedAnchor({
                            node: { x, y, width, height, centerY },
                            side: "left",
                            analysis: oConnectionAnalysis,
                            anchorType: sAnchorType
                        });
                    } else {
                        // Target anchor on right side
                        return this._calculateEnhancedAnchor({
                            node: { x, y, width, height, centerY },
                            side: "right",
                            analysis: oConnectionAnalysis,
                            anchorType: sAnchorType
                        });
                    }
                case "RightToLeft":
                    if (sAnchorType === "source") {
                        // Source anchor on right side
                        return this._calculateEnhancedAnchor({
                            node: { x, y, width, height, centerY },
                            side: "right",
                            analysis: oConnectionAnalysis,
                            anchorType: sAnchorType
                        });
                    } else {
                        // Target anchor on left side
                        return this._calculateEnhancedAnchor({
                            node: { x, y, width, height, centerY },
                            side: "left",
                            analysis: oConnectionAnalysis,
                            anchorType: sAnchorType
                        });
                    }
                case "RightToRight":
                    if (sAnchorType === "source") {
                        // Source anchor on right side
                        return this._calculateEnhancedAnchor({
                            node: { x, y, width, height, centerY },
                            side: "right",
                            analysis: oConnectionAnalysis,
                            anchorType: sAnchorType
                        });
                    } else {
                        // Target anchor on right side
                        return this._calculateEnhancedAnchor({
                            node: { x, y, width, height, centerY },
                            side: "right",
                            analysis: oConnectionAnalysis,
                            anchorType: sAnchorType
                        });
                    }
                default:
                    // Default RightToLeft case
                    if (sAnchorType === "source") {
                        return this._calculateEnhancedAnchor({
                            node: { x, y, width, height, centerY },
                            side: "right",
                            analysis: oConnectionAnalysis,
                            anchorType: sAnchorType
                        });
                    } else {
                        return this._calculateEnhancedAnchor({
                            node: { x, y, width, height, centerY },
                            side: "left",
                            analysis: oConnectionAnalysis,
                            anchorType: sAnchorType
                        });
                    }
            }
        },
        /**
         * Transforms source and target coordinates into a normalized format for calculations.
         *
         * @param {object} mParams - Parameters containing node and anchor information
         * @returns {object} Transformed coordinates object
         * @private
         */
        _transformSourceTargetCoordinates: function (mParams) {
            return {
                x1: mParams.sourceNode.getX(), // x coordinate of the source node
                y1: mParams.sourceNode.getY(), // y coordinate of the source node
                x2: mParams.targetNode.getX(), // x cordinate of the target node
                y2: mParams.targetNode.getY(), // y coordinate of the target node
                AX1: mParams.sourceAnchor.x, // x coordinate of the source anchor
                AY1: mParams.sourceAnchor.y, // y coordinate of the source anchor
                AX2: mParams.targetAnchor.x, // x coordinate of the target anchor
                AY2: mParams.targetAnchor.y, // y coordinate of the target anchor
                connectionType: mParams.connectionType, // type of the connection
                dx: Math.abs(mParams.targetNode.getX() - mParams.sourceNode.getX()), // horizontal distance between source and target nodes
                dy: Math.abs(mParams.targetNode.getY() - mParams.sourceNode.getY()) // vertical distance between source and target nodes
            };
        },
        /**
         * Analyzes the connection patterns for a node to determine optimal anchor placement
         * @param {object} oNode - The node to analyze
         * @returns {object} Analysis object with connection counts per side
         * @private
         */
        _analyzeNodeConnectionPatterns: function (oNode) {
            if (!oNode || !oNode.getParent || !oNode.getParent()) {
                return { leftIncoming: 0, leftOutgoing: 0, rightIncoming: 0, rightOutgoing: 0 };
            }

            const oGraph = oNode.getParent();
            const aLines = oGraph.getLines();
            const sNodeKey = oNode.getKey();

            let leftIncoming = 0, leftOutgoing = 0, rightIncoming = 0, rightOutgoing = 0;

            aLines.forEach(function(oLine) {
                if (!oLine.getVisible() || oLine._isIgnored()) {
                    return;
                }

                const sFromKey = oLine.getFrom();
                const sToKey = oLine.getTo();
                const sLineConnectionType = oLine.getConnectionType();

                // Check if this line involves our node
                if (sFromKey === sNodeKey) {
                    // Outgoing connection from our node
                    switch (sLineConnectionType) {
                        case "LeftToLeft":
                        case "LeftToRight":
                            leftOutgoing++;
                            break;
                        case "RightToLeft":
                        case "RightToRight":
                            rightOutgoing++;
                            break;
                        default:
                            // Default to right for unrecognized connection types
                            rightOutgoing++;
                            break;
                    }
                } else if (sToKey === sNodeKey) {
                    // Incoming connection to our node
                    switch (sLineConnectionType) {
                        case "LeftToLeft":
                        case "RightToLeft":
                            leftIncoming++;
                            break;
                        case "LeftToRight":
                        case "RightToRight":
                            rightIncoming++;
                            break;
                        default:
                            // Default to left for unrecognized connection types
                            leftIncoming++;
                            break;
                    }
                }
            });

            return {
                leftIncoming: leftIncoming,
                leftOutgoing: leftOutgoing,
                rightIncoming: rightIncoming,
                rightOutgoing: rightOutgoing
            };
        },

        /**
         * Calculates enhanced anchor position based on connection analysis
         * @param {object} mParams - Parameters for anchor calculation
         * @param {object} mParams.node - Node position and size info
         * @param {string} mParams.side - Side of the node ("left" or "right")
         * @param {object} mParams.analysis - Connection pattern analysis
         * @param {string} mParams.anchorType - Anchor type ("source" or "target")
         * @returns {object} Anchor coordinates {x, y}
         * @private
         */
        _calculateEnhancedAnchor: function (mParams) {
            const { node, side, analysis, anchorType } = mParams;
            const { x, y, width, height, centerY } = node;

            const offsetDistance = height * 0.15; // 15% of node height for offset positioning

            // Determine base X coordinate for the side
            const baseX = side === "left" ? x : (x + width);

            // Get connection counts for this side
            const sideIncoming = side === "left" ? analysis.leftIncoming : analysis.rightIncoming;
            const sideOutgoing = side === "left" ? analysis.leftOutgoing : analysis.rightOutgoing;

            // Calculate Y position based on connection patterns
            let anchorY = centerY; // Default to center

            // ENHANCEMENT 1: Single connection type on this side -> use center
            if ((sideIncoming === 0 && sideOutgoing === 1) || (sideIncoming === 1 && sideOutgoing === 0)) {
                anchorY = centerY; // Center position for single connection
            } else if (sideIncoming > 0 && sideOutgoing > 0) {
                // ENHANCEMENT 2: Mixed connections on this side -> offset positioning
                if (anchorType === "target") {
                    // Incoming connections (targets) go above center
                    anchorY = centerY - offsetDistance;
                } else {
                    // Outgoing connections (sources) go below center
                    anchorY = centerY + offsetDistance;
                }
            } else {
                // Multiple connections of same type -> use center (for now)
                anchorY = centerY;
            }

            // Ensure anchor stays within node boundaries
            const minY = y + (height * 0.1); // 10% margin from top
            const maxY = y + (height * 0.9); // 10% margin from bottom
            anchorY = Math.max(minY, Math.min(maxY, anchorY));

            return {
                x: baseX,
                y: Math.floor(anchorY)
            };
        },

        /**
         * Determines if a horizontal connection should use a straight line based on connection patterns.
         * Returns true only when both nodes have single dedicated connections (source has single outgoing, target has single incoming).
         *
         * @param {object} sourceNode - The source node
         * @param {object} targetNode - The target node
         * @param {string} connectionType - The connection type
         * @returns {boolean} True if straight line should be used, false if bends are needed
         * @private
         */
        _shouldUseHorizontalStraightLine: function (sourceNode, targetNode, connectionType) {
            const sourceAnalysis = this._analyzeNodeConnectionPatterns(sourceNode);
            const targetAnalysis = this._analyzeNodeConnectionPatterns(targetNode);

            // Determine which sides are involved based on connection type
            let sourceOutgoingCount, targetIncomingCount;

            switch (connectionType) {
                case "RightToLeft":
                    sourceOutgoingCount = sourceAnalysis.rightOutgoing;
                    targetIncomingCount = targetAnalysis.leftIncoming;
                    break;
                case "LeftToRight":
                    sourceOutgoingCount = sourceAnalysis.leftOutgoing;
                    targetIncomingCount = targetAnalysis.rightIncoming;
                    break;
                case "LeftToLeft":
                    sourceOutgoingCount = sourceAnalysis.leftOutgoing;
                    targetIncomingCount = targetAnalysis.leftIncoming;
                    break;
                case "RightToRight":
                    sourceOutgoingCount = sourceAnalysis.rightOutgoing;
                    targetIncomingCount = targetAnalysis.rightIncoming;
                    break;
                default:
                    // Default to RightToLeft
                    sourceOutgoingCount = sourceAnalysis.rightOutgoing;
                    targetIncomingCount = targetAnalysis.leftIncoming;
                    break;
            }

            // Allow straight line only when both nodes have single dedicated connections
            return (sourceOutgoingCount === 1 && targetIncomingCount === 1);
        }
    };
    return ConnectionPathUtils;
});