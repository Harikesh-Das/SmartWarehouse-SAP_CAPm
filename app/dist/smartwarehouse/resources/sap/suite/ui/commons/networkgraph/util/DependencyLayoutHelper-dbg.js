/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/suite/ui/commons/library", "sap/base/Log"], function (library, Log) {
	"use strict";

	const oConnectionType = library.networkgraph.ConnectionType,
		oComponentArrangement = library.networkgraph.ComponentArrangement;
	const DEFAULT_HORIZONTAL_SPACING = 240;
	const DEFAULT_VERTICAL_SPACING = 100;
	const DRAG_DETECTION_THRESHOLD = 10;

	/**
	 * Utility class for calculating node positions based on dependency relationships.
	 * This utility arranges nodes based on their dependency relationships using topological sorting,
	 * cycle detection, and layer-based positioning.
	 *
	 * Why a node may be positioned incorrectly after recalculation:
	 * After each run, node positions are cached with a flag indicating whether the user moved
	 * them (<code>bIsUserPositioned</code>). On the next call, nodes flagged as user-positioned
	 * are preserved as-is, and the algorithm-placed nodes are recalculated. A node appears in the
	 * wrong place if it is unexpectedly treated as user-positioned, most commonly because
	 * <code>clearCache: true</code> was passed. It wipes the cache, but leaves the coordinates intact.
	 * So every node with non-zero coordinates is immediately re-classified as user-positioned
	 * and freezes, rather than being recalculated.
	 *
	 * Drag and drop recalculation - correct pattern:
	 * Call <code>resetNode(oNode)</code> for each dragged node, then call
	 * <code>calculatePositions</code> without <code>clearCache</code> (default <code>false</code>).
	 * <code>resetNode</code> evicts the node from the cache and zeros its coordinates, so only
	 * that node is repositioned; all the other nodes remain stable.
	 *
	 * Sentinel value:
	 * Coordinates <code>(0, 0)</code> mean "unpositioned". To place a node at the canvas origin,
	 * use <code>(0.1, 0.1)</code> or <code>(1, 1)</code> instead.
	 *
	 * @namespace sap.suite.ui.commons.networkgraph.util.DependencyLayoutHelper
	 * @public
	 * @since 1.144
	 */
	const DependencyLayoutHelper = {
		/**
		 * WeakMap to store last calculated positions and origin flag for automatic drag detection.
	 	 * Structure: {x: number, y: number, bIsUserPositioned: boolean}
		 */
		_lastCalculated: new WeakMap(),

		/**
		 * Evicts one or more nodes from the position cache and zeros their coordinates so the next
		 * <code>calculatePositions</code> call repositions them while all other nodes remain stable.
		 * To understand the use for drag and drop recalculation, see the class-level JSDoc for the full pattern.
		 *
		 * @param {sap.suite.ui.commons.networkgraph.Node|sap.suite.ui.commons.networkgraph.Node[]} vNode - A single node or an array of nodes to reset
		 * @public
		 */
		resetNode: function (vNode) {
			const aNodes = Array.isArray(vNode) ? vNode : [vNode];
			aNodes.forEach((oNode) => {
				if (!oNode || !oNode.setX || !oNode.setY) {
					return;
				}
				this._lastCalculated.delete(oNode);
				oNode.setX(0);
				oNode.setY(0);
			});
		},

		/**
		 * Calculates and sets positions for nodes without coordinates based on their dependency relationships.
		 * Uses topological sorting (Kahn's algorithm) and DFS-based cycle detection to arrange nodes
		 * in layers from left to right, ensuring no overlaps and minimal line crossings.
		 * Note: Drag and drop functionality is only available for nodes. Groups cannot be dragged and dropped, even when NoopLayout is used and enableDragAndDrop is set to true.
		 *
		 * @param {sap.suite.ui.commons.networkgraph.Graph} oGraph - The graph instance
		 * @param {object} [mConfig] - Configuration object
		 * @param {number} [mConfig.horizontalSpacing=240] - Horizontal spacing between layers
		 * @param {number} [mConfig.verticalSpacing=100] - Vertical spacing between nodes
		 * @param {sap.suite.ui.commons.networkgraph.ComponentArrangement} [mConfig.componentArrangement=Horizontal] - Component arrangement: "Horizontal" or "Vertical"
		 * @param {boolean} [mConfig.clearCache=false] - Wipes the position cache; node coordinates are not modified.
		 *   <code>_detectUserChanges</code> then re-classifies every non-zero node as user-positioned and freezes it.
		 *   Use only to discard all layout history (e.g. switching <code>componentArrangement</code>).
		 *   For drag and drop recalculation, use <code>resetNode()</code> with the default <code>clearCache: false</code>.
		 * @public
		 */
		calculatePositions: function (oGraph, mConfig) {
			if (!oGraph) {
				throw new Error("Graph instance is required");
			}

			const config = Object.assign(
				{
					horizontalSpacing: DEFAULT_HORIZONTAL_SPACING,
					verticalSpacing: DEFAULT_VERTICAL_SPACING,
					componentArrangement: oComponentArrangement.Horizontal,
					clearCache: false
				},
				mConfig || {}
			);

			// Clear cache if requested (e.g., when changing arrangement)
			if (config.clearCache) {
				this._lastCalculated = new WeakMap();
			}

			try {
				this._detectUserChanges(oGraph, config.horizontalSpacing);
				this._buildDependencyGraph(oGraph);
				const aComponents = this._identifyComponents(oGraph);
				this._processComponents(aComponents, config);
				this._calculateCoordinates(oGraph, config);
				this._adjustHorizontalSpacingForNodeWidths(oGraph, config);
				this._adjustVerticalSpacingForNodeHeights(oGraph, config);
				if (oGraph._bIsRtl) {
					this._horizontalMirror(oGraph, config.horizontalSpacing);
				}
				this._storeFinalPositions(oGraph, config.horizontalSpacing);
			} catch (e) {
				Log.error("DependencyLayoutHelper error: " + e.message, e);
				throw new Error("DependencyLayoutHelper error: " + e.message);
			} finally {
				if (this._lineMap) {
					this._lineMap.clear();
					this._lineMap = null;
				}
			}
		},

		/**
		 * Builds the dependency graph structure by analyzing node relationships.
		 * Initializes layout data for each node and categorizes connections.
		 *
		 * @param {sap.suite.ui.commons.networkgraph.Graph} oGraph - The network graph instance
		 * @private
		 */
		_buildDependencyGraph: function (oGraph) {
			const aNodes = oGraph.getNodes();
			const aLines = oGraph.getLines();
			const mNodeMap = new Map();

			aNodes.forEach((oNode) => {
				mNodeMap.set(oNode.getKey(), oNode);

				oNode._layoutData = {
					layer: -1,
					position: -1,
					incoming: [],
					outgoing: [],
					parallelNodes: [],
					backwardEdges: [],
					backwardEdgeLines: [],
					isBackwardSource: false
				};
			});

			if (this._lineMap) {
				this._lineMap.clear();
			}
			// Store line references for backward edge detection
			this._lineMap = new Map();

			aLines.forEach((oLine) => {
				const oFromNode = mNodeMap.get(oLine.getFrom());
				const oToNode = mNodeMap.get(oLine.getTo());

				if (oFromNode && oToNode) {
					const sConnectionType = oLine.getConnectionType();
					const sFromKey = oFromNode.getKey();
					const sToKey = oToNode.getKey();

					if (!this._lineMap.has(sFromKey)) {
						this._lineMap.set(sFromKey, new Map());
					}
					this._lineMap.get(sFromKey).set(sToKey, oLine);

					switch (sConnectionType) {
						case oConnectionType.RightToRight:
						case oConnectionType.LeftToLeft:
							oFromNode._layoutData.parallelNodes.push(oToNode);
							oToNode._layoutData.parallelNodes.push(oFromNode);
							break;
						case oConnectionType.RightToLeft:
						case oConnectionType.LeftToRight:
						default:
							oFromNode._layoutData.outgoing.push(oToNode);
							oToNode._layoutData.incoming.push(oFromNode);
							break;
					}
				}
			});

			this._detectAndRemoveBackwardEdges(aNodes);
		},

		/**
		 * Detects and temporarily removes backward edges that create cycles using DFS.
		 * Identifies edges that point to already visited ancestors in the DFS traversal.
		 *
		 * @param {sap.suite.ui.commons.networkgraph.Node[]} aNodes - Array of graph nodes
		 * @private
		 */
		_detectAndRemoveBackwardEdges: function (aNodes) {
			const mVisiting = {};
			const mVisited = {};

			const dfsVisit = (oNode) => {
				const sKey = oNode.getKey();
				if (mVisited[sKey]) {
					return;
				}

				mVisiting[sKey] = true;

				const aRemainingOutgoing = [];
				oNode._layoutData.outgoing.forEach((oTargetNode) => {
					const sTargetKey = oTargetNode.getKey();

					if (mVisiting[sTargetKey]) {
						// Backward edge detected
						oNode._layoutData.isBackwardSource = true;
						oNode._layoutData.backwardEdges.push(oTargetNode);

						const oLine = this._lineMap.get(sKey)?.get(sTargetKey);
						if (oLine) {
							oNode._layoutData.backwardEdgeLines.push(oLine);
						}

						const idx = oTargetNode._layoutData.incoming.indexOf(oNode);
						if (idx > -1) {
							oTargetNode._layoutData.incoming.splice(idx, 1);
						}
					} else {
						aRemainingOutgoing.push(oTargetNode);
						if (!mVisited[sTargetKey]) {
							dfsVisit(oTargetNode);
						}
					}
				});

				oNode._layoutData.outgoing = aRemainingOutgoing;
				mVisiting[sKey] = false;
				mVisited[sKey] = true;
			};

			aNodes.forEach((oNode) => {
				if (!mVisited[oNode.getKey()]) {
					dfsVisit(oNode);
				}
			});
		},

		/**
		 * Identifies separate connected components in the graph using BFS.
		 * A component is a group of nodes that are connected by dependencies.
		 *
		 * @param {sap.suite.ui.commons.networkgraph.Graph} oGraph - The network graph instance
		 * @returns {Array<sap.suite.ui.commons.networkgraph.Node[]>} Array of components (groups of connected nodes)
		 * @private
		 */
		_identifyComponents: function (oGraph) {
			const aNodes = oGraph.getNodes();
			const mVisited = {};
			const aComponents = [];

			const addConnectedNodesToQueue = (oNode, aQueue) => {
				const aConnectionTypes = ["incoming", "outgoing", "parallelNodes"];
				aConnectionTypes.forEach((sType) => {
					oNode._layoutData[sType].forEach((oConnectedNode) => {
						const sKey = oConnectedNode.getKey();
						if (!mVisited[sKey]) {
							aQueue.push(oConnectedNode);
						}
					});
				});
			};

			aNodes.forEach((oNode) => {
				const sKey = oNode.getKey();
				if (mVisited[sKey]) {
					return;
				}

				const aComponent = [];
				const aQueue = [oNode];

				while (aQueue.length > 0) {
					const oCurrent = aQueue.shift();
					const sCurrentKey = oCurrent.getKey();

					if (!mVisited[sCurrentKey]) {
						mVisited[sCurrentKey] = true;
						aComponent.push(oCurrent);
						addConnectedNodesToQueue(oCurrent, aQueue);
					}
				}

				aComponents.push(aComponent);
			});

			return aComponents;
		},

		/**
		 * Processes all components: separates isolated nodes and arranges connected components.
		 *
		 * @param {Array<sap.suite.ui.commons.networkgraph.Node[]>} aComponents - Array of components (groups of connected nodes)
		 * @param {object} config - Configuration object
		 * @private
		 */
		_processComponents: function (aComponents, { componentArrangement }) {
			const aIsolatedNodes = [];
			const aConnectedComponents = [];

			aComponents.forEach((aComponentNodes) => {
				const bIsIsolated =
					aComponentNodes.length === 1 &&
					aComponentNodes[0]._layoutData.incoming.length === 0 &&
					aComponentNodes[0]._layoutData.outgoing.length === 0;

				if (bIsIsolated) {
					aIsolatedNodes.push(aComponentNodes[0]);
				} else {
					aConnectedComponents.push(aComponentNodes);
				}
			});
			const bSideBySide = componentArrangement !== oComponentArrangement.Vertical;
			let iMaxVerticalPosition = 0;
			let iMaxLayerAcrossAll = 0;

			aConnectedComponents.forEach((aComponentNodes, iCompIndex) => {
				this._assignLayersForComponent(aComponentNodes, iCompIndex);
				this._adjustParallelLayersForComponent(aComponentNodes);
				this._assignVerticalPositionsForComponent(aComponentNodes);

				if (bSideBySide) {
					aComponentNodes.forEach((oNode) => {
						oNode._layoutData.layer += iMaxLayerAcrossAll;
						oNode._layoutData.componentOffset = 0;
					});

					let iComponentMaxLayer = -1;
					aComponentNodes.forEach((n) => {
						if (n._layoutData.layer > iComponentMaxLayer) {
							iComponentMaxLayer = n._layoutData.layer;
						}
					});
					iMaxLayerAcrossAll = iComponentMaxLayer + 1;
				} else {
					aComponentNodes.forEach((oNode) => {
						oNode._layoutData.position += iMaxVerticalPosition;
						oNode._layoutData.componentOffset = 0;
					});

					let iComponentMaxPosition = -1;
					aComponentNodes.forEach((n) => {
						if (n._layoutData.position > iComponentMaxPosition) {
							iComponentMaxPosition = n._layoutData.position;
						}
					});
					iMaxVerticalPosition = iComponentMaxPosition + 1;

					let iComponentMaxLayer = -1;
					aComponentNodes.forEach((n) => {
						if (n._layoutData.layer > iComponentMaxLayer) {
							iComponentMaxLayer = n._layoutData.layer;
						}
					});
					iMaxLayerAcrossAll = Math.max(iMaxLayerAcrossAll, iComponentMaxLayer);
				}
			});

			if (aIsolatedNodes.length > 0) {
				const iRightSideOffset = bSideBySide ? iMaxLayerAcrossAll : iMaxLayerAcrossAll + 1;
				let iIsolatedIdx = 0;
				aIsolatedNodes.forEach((oNode) => {
					if (this._lastCalculated.get(oNode)?.bIsUserPositioned) {
						return;
					}
					const idx = iIsolatedIdx++;

					oNode._layoutData.layer = Math.floor(idx / 2);
					oNode._layoutData.position = idx % 2;
					oNode._layoutData.componentOffset = iRightSideOffset;
				});
			}
		},

		/**
		 * Assigns layer numbers to nodes in a component (group of connected nodes) using Kahn's algorithm (topological sorting).
		 *
		 * @param {sap.suite.ui.commons.networkgraph.Node[]} aComponentNodes - Array of nodes belonging to the same component
		 * @param {number} iComponentId - Component identifier
		 * @private
		 */
		_assignLayersForComponent: function (aComponentNodes, iComponentId) {
			const aQueue = [];
			const mInDegree = {};

			aComponentNodes.forEach((oNode) => {
				oNode._layoutData.componentId = iComponentId;
				const iInDegree = oNode._layoutData.incoming.length;
				mInDegree[oNode.getKey()] = iInDegree;

				if (iInDegree === 0) {
					oNode._layoutData.layer = 0;
					aQueue.push(oNode);

					oNode._layoutData.parallelNodes.forEach((oParallelNode) => {
						if (oParallelNode._layoutData.layer === -1) {
							oParallelNode._layoutData.layer = 0;
						}
					});
				}
			});

			while (aQueue.length > 0) {
				const oCurrentNode = aQueue.shift();

				oCurrentNode._layoutData.outgoing.forEach((oTargetNode) => {
					const sTargetKey = oTargetNode.getKey();
					mInDegree[sTargetKey]--;

					oTargetNode._layoutData.layer = Math.max(
						oTargetNode._layoutData.layer,
						oCurrentNode._layoutData.layer + 1
					);

					if (mInDegree[sTargetKey] === 0) {
						aQueue.push(oTargetNode);
					}
				});
			}

			const aUnprocessedNodes = aComponentNodes.filter(
				(n) => n._layoutData.layer === -1
			);

			if (aUnprocessedNodes.length > 0) {
				const aProcessedNodes = aComponentNodes.filter(
					(n) => n._layoutData.layer >= 0
				);
				let iMinLayer = 0;
				if (aProcessedNodes.length > 0) {
					let iMaxLayer = -1;
					aProcessedNodes.forEach((n) => {
						if (n._layoutData.layer > iMaxLayer) {
							iMaxLayer = n._layoutData.layer;
						}
					});
					iMinLayer = iMaxLayer + 1;
				}

				aUnprocessedNodes.forEach((oNode) => {
					oNode._layoutData.layer = iMinLayer;
				});
			}

			aComponentNodes.forEach((oNode) => {
				if (
					oNode._layoutData.incoming.length === 0 &&
					oNode._layoutData.outgoing.length > 0
				) {
					const iCurrentLayer = oNode._layoutData.layer;
					let iMaxTargetLayer = -1;
					oNode._layoutData.outgoing.forEach((t) => {
						if (t._layoutData.layer > iMaxTargetLayer) {
							iMaxTargetLayer = t._layoutData.layer;
						}
					});

					const bTargetHasOtherIncoming = oNode._layoutData.outgoing.some(
						(t) => t._layoutData.incoming.filter((n) => n !== oNode).length > 0
					);

					if (iMaxTargetLayer > iCurrentLayer && bTargetHasOtherIncoming) {
						oNode._layoutData.layer = Math.max(0, iMaxTargetLayer - 1);
					}
				}
			});
		},

		/**
		 * Ensures parallel nodes (same-layer dependencies) stay in the same layer.
		 *
		 * @param {sap.suite.ui.commons.networkgraph.Node[]} aComponentNodes - Array of nodes belonging to the same component (group of connected nodes)
		 * @private
		 */
		_adjustParallelLayersForComponent: function (aComponentNodes) {
			const ensureParallelNodesInSameLayer = (oNode) => {
				oNode._layoutData.parallelNodes.forEach((oParallelNode) => {
					if (
						oParallelNode._layoutData.layer === -1 ||
						oParallelNode._layoutData.layer > oNode._layoutData.layer
					) {
						oParallelNode._layoutData.layer = oNode._layoutData.layer;
					}
				});
			};

			aComponentNodes.forEach((oNode) => {
				if (oNode._layoutData.layer >= 0) {
					ensureParallelNodesInSameLayer(oNode);
				}
			});

			let bChanged = true;
			while (bChanged) {
				bChanged = false;

				aComponentNodes.forEach((oNode) => {
					oNode._layoutData.parallelNodes.forEach((oParallelNode) => {
						if (oNode._layoutData.layer !== oParallelNode._layoutData.layer) {
							const iMinLayer = Math.min(
								oNode._layoutData.layer,
								oParallelNode._layoutData.layer
							);
							if (
								oNode._layoutData.layer !== iMinLayer ||
								oParallelNode._layoutData.layer !== iMinLayer
							) {
								oNode._layoutData.layer = iMinLayer;
								oParallelNode._layoutData.layer = iMinLayer;
								bChanged = true;
							}
						}
					});
				});
			}
		},

		/**
		 * Assigns vertical positions within layers, inheriting parent positions where possible.
		 *
		 * @param {sap.suite.ui.commons.networkgraph.Node[]} aComponentNodes - Array of nodes belonging to the same component (group of connected nodes)
		 * @private
		 */
		_assignVerticalPositionsForComponent: function (aComponentNodes) {
			const mLayers = this._groupNodesByLayer(aComponentNodes);
			const aLayerKeys = Object.keys(mLayers)
				.map((k) => parseInt(k))
				.sort((a, b) => a - b);

			aLayerKeys.forEach((iLayer) => {
				if (iLayer > 0) {
					this._positionLayerNodes(mLayers, iLayer);
				}
			});

			if (mLayers[0]) {
				const mUsedPositions = {};
				let iNextAvailablePosition = 0;

				const updateChainPositions = (
					oNode,
					iNewPosition,
					mVisitedNodes = {}
				) => {
					if (mVisitedNodes[oNode.getKey()]) {
						return;
					}
					mVisitedNodes[oNode.getKey()] = true;

					oNode._layoutData.position = iNewPosition;

					oNode._layoutData.outgoing.forEach((oSuccessor) => {
						const aSuccessorIncoming = oSuccessor._layoutData.incoming;
						if (
							aSuccessorIncoming.length === 1 &&
							aSuccessorIncoming[0] === oNode
						) {
							updateChainPositions(oSuccessor, iNewPosition, mVisitedNodes);
						}
					});
				};

				const aRootNodes = mLayers[0].sort((a, b) => {
					const aHasTarget = a._layoutData.outgoing.length > 0;
					const bHasTarget = b._layoutData.outgoing.length > 0;

					if (!aHasTarget && !bHasTarget) return 0;
					if (!aHasTarget) return 1;
					if (!bHasTarget) return -1;

					const aTargetPos = a._layoutData.outgoing[0]._layoutData.position;
					const bTargetPos = b._layoutData.outgoing[0]._layoutData.position;
					return aTargetPos - bTargetPos;
				});

				aRootNodes.forEach((oRootNode) => {
					if (oRootNode._layoutData.outgoing.length > 0) {
						const oFirstTarget = oRootNode._layoutData.outgoing[0];
						const iPreferredPosition = oFirstTarget._layoutData.position;

						if (!mUsedPositions[iPreferredPosition]) {
							oRootNode._layoutData.position = iPreferredPosition;
							mUsedPositions[iPreferredPosition] = true;
							iNextAvailablePosition = Math.max(
								iNextAvailablePosition,
								iPreferredPosition + 1
							);
						} else {
							const aTargetIncoming = oFirstTarget._layoutData.incoming;
							if (
								aTargetIncoming.length === 1 &&
								aTargetIncoming[0] === oRootNode
							) {
								let iNewPosition = iPreferredPosition;
								while (mUsedPositions[iNewPosition]) {
									iNewPosition++;
								}
								updateChainPositions(oFirstTarget, iNewPosition);
								oRootNode._layoutData.position = iNewPosition;
								mUsedPositions[iNewPosition] = true;
								iNextAvailablePosition = Math.max(
									iNextAvailablePosition,
									iNewPosition + 1
								);
							} else {
								let iAdjacentPosition = iPreferredPosition + 1;
								while (mUsedPositions[iAdjacentPosition]) {
									iAdjacentPosition++;
								}
								oRootNode._layoutData.position = iAdjacentPosition;
								mUsedPositions[iAdjacentPosition] = true;
								iNextAvailablePosition = Math.max(
									iNextAvailablePosition,
									iAdjacentPosition + 1
								);
							}
						}
					} else {
						while (mUsedPositions[iNextAvailablePosition]) {
							iNextAvailablePosition++;
						}
						oRootNode._layoutData.position = iNextAvailablePosition;
						mUsedPositions[iNextAvailablePosition] = true;
						iNextAvailablePosition++;
					}
				});
			}
		},

		/**
		 * Groups nodes by their assigned layer.
		 *
		 * @param {sap.suite.ui.commons.networkgraph.Node[]} aComponentNodes - Array of nodes belonging to the same component (group of connected nodes)
		 * @returns {object} Map of layer number to array of nodes
		 * @private
		 */
		_groupNodesByLayer: function (aComponentNodes) {
			const mLayers = {};

			aComponentNodes.forEach((oNode) => {
				const iLayer = oNode._layoutData.layer;
				if (!mLayers[iLayer]) {
					mLayers[iLayer] = [];
				}
				mLayers[iLayer].push(oNode);
				oNode._layoutData.position = -1;
			});

			return mLayers;
		},

		/**
		 * Positions nodes within a specific layer based on their predecessors.
		 *
		 * @param {object} mLayers - Map of layer number to array of nodes
		 * @param {number} iLayer - The layer to position
		 * @private
		 */
		_positionLayerNodes: function (mLayers, iLayer) {
			const aLayerNodes = mLayers[iLayer];
			const mUsedPositions = {};
			let iNextAvailablePosition = 0;

			const aPrevLayerNodes = (mLayers[iLayer - 1] || [])
				.filter((oNode) => oNode._layoutData.position >= 0)
				.sort((a, b) => a._layoutData.position - b._layoutData.position);

			aPrevLayerNodes.forEach((oPrevNode) => {
				const aSuccessors = oPrevNode._layoutData.outgoing
					.filter((oNode) => oNode._layoutData.layer === iLayer)
					.sort((a, b) => a.getKey().localeCompare(b.getKey()));

				if (aSuccessors.length === 0) {
					return;
				}

				const iPreferredPosition = oPrevNode._layoutData.position;
				if (
					!mUsedPositions[iPreferredPosition] &&
					aSuccessors[0]._layoutData.position === -1
				) {
					aSuccessors[0]._layoutData.position = iPreferredPosition;
					mUsedPositions[iPreferredPosition] = true;
					iNextAvailablePosition = Math.max(
						iNextAvailablePosition,
						iPreferredPosition + 1
					);
				}

				aSuccessors.forEach((oNode) => {
					if (oNode._layoutData.position === -1) {
						while (mUsedPositions[iNextAvailablePosition]) {
							iNextAvailablePosition++;
						}
						oNode._layoutData.position = iNextAvailablePosition;
						mUsedPositions[iNextAvailablePosition] = true;
						iNextAvailablePosition++;
					}
				});
			});

			aLayerNodes.forEach((oNode) => {
				if (oNode._layoutData.position === -1) {
					while (mUsedPositions[iNextAvailablePosition]) {
						iNextAvailablePosition++;
					}
					oNode._layoutData.position = iNextAvailablePosition;
					mUsedPositions[iNextAvailablePosition] = true;
					iNextAvailablePosition++;
				}
			});
		},

		/**
		 * Calculates final X and Y coordinates for all nodes based on layer and position.
		 *
		 * @param {sap.suite.ui.commons.networkgraph.Graph} oGraph - The network graph instance
		 * @param {object} config - Configuration with spacing values
		 * @private
		 */
		_calculateCoordinates: function (oGraph, { horizontalSpacing, verticalSpacing }) {
			const aNodes = oGraph.getNodes();
			const iHSpacing = horizontalSpacing;
			const iVSpacing = verticalSpacing;

			aNodes.forEach((oNode) => {
				const iComponentOffset = oNode._layoutData.componentOffset || 0;
				oNode.setX(
					iHSpacing + (oNode._layoutData.layer + iComponentOffset) * iHSpacing
				);
				oNode.setY(iVSpacing + oNode._layoutData.position * iVSpacing);
			});

			aNodes.forEach((oNode) => {
				const oLastPos = this._lastCalculated.get(oNode);
				if (oLastPos?.bIsUserPositioned) {
					oNode.setX(oLastPos.x);
					oNode.setY(oLastPos.y);
				}
			});
		},

		/**
		 * Adjusts horizontal spacing to accommodate nodes with varying widths.
		 *
		 * @param {sap.suite.ui.commons.networkgraph.Graph} oGraph - The network graph instance
		 * @private
		 */
		_adjustHorizontalSpacingForNodeWidths: function (oGraph) {
			const aNodes = oGraph.getNodes();
			const mLayerWidths = {};
			let iMaxLayer = -1;

			aNodes.forEach((oNode) => {
				const iLayer =
					oNode._layoutData.layer + (oNode._layoutData.componentOffset || 0);
				// Skip nodes with unassigned layout
				if (iLayer < 0) return;
				iMaxLayer = Math.max(iMaxLayer, iLayer);

				if (oNode._iWidth) {
					const iWidth = oNode._iWidth;
					if (!mLayerWidths[iLayer] || mLayerWidths[iLayer] < iWidth) {
						mLayerWidths[iLayer] = iWidth;
					}
				}
			});

			const mLayerOffsets = {};
			let iCumulativeOffset = 0;

			for (let iLayer = 0; iLayer <= iMaxLayer; iLayer++) {
				mLayerOffsets[iLayer] = iCumulativeOffset;
				const iActualWidth = mLayerWidths[iLayer];
				if (iActualWidth) {
					iCumulativeOffset += iActualWidth;
				}
			}

			aNodes.forEach((oNode) => {
				if (!this._lastCalculated.get(oNode)?.bIsUserPositioned) {
					const iLayer =
						oNode._layoutData.layer + (oNode._layoutData.componentOffset || 0);
					const iOffset = mLayerOffsets[iLayer] || 0;
					oNode.setX(oNode.getX() + iOffset);
				}
			});
		},

		/**
		 * Adjusts vertical spacing to accommodate nodes with varying heights.
		 *
		 * @param {sap.suite.ui.commons.networkgraph.Graph} oGraph - The network graph instance
		 * @private
		 */
		_adjustVerticalSpacingForNodeHeights: function (oGraph) {
			const aNodes = oGraph.getNodes();
			const mPositionHeights = {};
			const mAllPositions = {};

			aNodes.forEach((oNode) => {
				const iPosition = oNode._layoutData.position;
				// Skip nodes with unassigned layout
				if (iPosition < 0) return;
				mAllPositions[iPosition] = true;

				if (oNode._iHeight) {
					const iHeight = oNode._iHeight;
					if (
						!mPositionHeights[iPosition] ||
						mPositionHeights[iPosition] < iHeight
					) {
						mPositionHeights[iPosition] = iHeight;
					}
				}
			});

			const aAllPositionKeys = Object.keys(mAllPositions)
				.map((k) => parseInt(k))
				.sort((a, b) => a - b);
			const mPositionOffsets = {};
			let iCumulativeOffset = 0;

			aAllPositionKeys.forEach((iPosition) => {
				mPositionOffsets[iPosition] = iCumulativeOffset;
				const iActualHeight = mPositionHeights[iPosition];
				if (iActualHeight) {
					iCumulativeOffset += iActualHeight;
				}
			});

			aNodes.forEach((oNode) => {
				if (!this._lastCalculated.get(oNode)?.bIsUserPositioned) {
					const iPosition = oNode._layoutData.position;
					const iOffset = mPositionOffsets[iPosition] || 0;
					oNode.setY(oNode.getY() + iOffset);
				}
			});
		},

		/**
		 * Stores final calculated positions for automatic drag detection on next call.
		 * Only stores positions for nodes that were calculated (not original/dragged).
		 *
		 * @param {sap.suite.ui.commons.networkgraph.Graph} oGraph - The network graph instance
		 * @param {number} iHSpacing - Horizontal spacing used as RTL mirror offset
		 * @private
		 */
		_storeFinalPositions: function (oGraph, iHSpacing) {
			const aNodes = oGraph.getNodes();
			const bIsRtl = oGraph._bIsRtl || false;

			// Reuse fMaxX from _horizontalMirror to ensure consistent mirror/unmirror
			let fMaxX = 0;
			if (bIsRtl) {
				fMaxX = oGraph._rtlMirrorMaxX || 0;
			}

			aNodes.forEach((oNode) => {
				const fCurrentX = oNode.getX();
				const fCurrentY = oNode.getY();

				// Always store in LTR space
				let fLtrX = fCurrentX;
				if (bIsRtl) {
					const fNodeWidth = oNode._iWidth || 0;
					fLtrX = fMaxX - fCurrentX - fNodeWidth + iHSpacing;
				}

				const bIsUserPositioned = this._lastCalculated.get(oNode)?.bIsUserPositioned ?? false;

				this._lastCalculated.set(oNode, {
					x: fLtrX,
					y: fCurrentY,
					lastRtl: bIsRtl,
					bIsUserPositioned
				});
			});
		},

		/**
		 * Detects user-made position changes by comparing current positions with last calculated positions.
		 * Marks nodes with original coordinates and tracks drag operations.
		 *
		 * @param {sap.suite.ui.commons.networkgraph.Graph} oGraph - The network graph instance
		 * @param {number} iHSpacing - Horizontal spacing used as RTL mirror offset
		 * @private
		 */
		_detectUserChanges: function (oGraph, iHSpacing) {
			const aNodes = oGraph.getNodes();
			const bIsRtl = oGraph._bIsRtl || false;

			// Use stored fMaxX from previous mirror operation if available, otherwise calculate.
			// We need it both when in RTL mode AND when switching RTL→LTR (to detect pre-switch drags).
			let fMaxX = oGraph._rtlMirrorMaxX || 0;
			if (bIsRtl && !fMaxX) {
				aNodes.forEach((n) => {
					const fRight = n.getX() + (n._iWidth || 0);
					if (fRight > fMaxX) fMaxX = fRight;
				});
			}

			aNodes.forEach((oNode) => {
				const fCurrentX = oNode.getX();
				const fCurrentY = oNode.getY();
				// (0,0) is the sentinel for "unpositioned": resetNode() sets coordinates to (0,0)
				// so the algorithm treats the node as if it were never placed.
				// To legitimately position a node at the canvas origin, use (0.1, 0.1) or (1, 1).
				const bHasCoordinates = fCurrentX !== undefined && fCurrentY !== undefined && (fCurrentX !== 0 || fCurrentY !== 0);
				const oLastPos = this._lastCalculated.get(oNode);

				// Convert current position to LTR coordinates for comparison
				let fLtrX = fCurrentX;
				if (bIsRtl) {
					const fNodeWidth = oNode._iWidth || 0;
					fLtrX = fMaxX - fCurrentX - fNodeWidth + iHSpacing;
				}

				if (oLastPos && !bHasCoordinates) {
					// Coordinates were cleared (sentinel value 0,0) — evict cache so the algorithm
					// repositions this node on the next layout pass.
					this._lastCalculated.delete(oNode);
				} else if (!oLastPos && bHasCoordinates) {
					// No cache entry + non-zero coords: node has model-provided position (first call).
					// Treated as user-positioned → preserved. Use resetNode() to opt a node out.
					this._lastCalculated.set(oNode, {
						x: fLtrX,
						y: fCurrentY,
						lastRtl: bIsRtl,
						bIsUserPositioned: true
					});
				} else if (oLastPos) {
					const bModeChanged = (oLastPos.lastRtl !== bIsRtl);

					if (bModeChanged) {
						const bPrevRtl = oLastPos.lastRtl;
						let fLtrXBeforeSwitch;

						if (bPrevRtl) {
							const fNodeWidth = oNode._iWidth || 0;
							fLtrXBeforeSwitch = fMaxX - fCurrentX - fNodeWidth + iHSpacing;
						} else {
							fLtrXBeforeSwitch = fCurrentX;
						}

						const fDeltaX = Math.abs(fLtrXBeforeSwitch - oLastPos.x);
						const fDeltaY = Math.abs(fCurrentY - oLastPos.y);

						if (fDeltaX > DRAG_DETECTION_THRESHOLD || fDeltaY > DRAG_DETECTION_THRESHOLD) {
							oLastPos.x = fLtrXBeforeSwitch;
							oLastPos.y = fCurrentY;
							oLastPos.bIsUserPositioned = true;
						}

						oLastPos.lastRtl = bIsRtl;
					} else {
						const fDeltaX = Math.abs(fLtrX - oLastPos.x);
						const fDeltaY = Math.abs(fCurrentY - oLastPos.y);

						if (fDeltaX > DRAG_DETECTION_THRESHOLD || fDeltaY > DRAG_DETECTION_THRESHOLD) {
							oLastPos.x = fLtrX;
							oLastPos.y = fCurrentY;
							oLastPos.bIsUserPositioned = true;
						}
					}
				}
			});
		},

		/**
		 * Mirrors all node X positions horizontally for RTL layout.
		 *
		 * @param {sap.suite.ui.commons.networkgraph.Graph} oGraph - The network graph instance
		 * @param {number} iHSpacing - Horizontal spacing used as left-side padding offset after mirroring
		 * @private
		 */
		_horizontalMirror: function (oGraph, iHSpacing) {
			const aNodes = oGraph.getNodes();

			// Find the rightmost edge of all nodes
			let fMaxX = 0;
			aNodes.forEach((oNode) => {
				const fX = oNode.getX();
				const fWidth = oNode._iWidth || 0;
				const fRightEdge = fX + fWidth;
				if (fRightEdge > fMaxX) {
					fMaxX = fRightEdge;
				}
			});

			oGraph._rtlMirrorMaxX = fMaxX;

			aNodes.forEach((oNode) => {
				const fCurrentX = oNode.getX();
				const fWidth = oNode._iWidth || 0;
				const fMirroredX = fMaxX - fCurrentX - fWidth + iHSpacing;
				oNode.setX(fMirroredX);
			});
		}
	};

	return DependencyLayoutHelper;
});
