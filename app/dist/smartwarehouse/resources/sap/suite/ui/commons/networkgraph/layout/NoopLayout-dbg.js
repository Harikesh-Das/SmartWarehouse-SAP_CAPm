/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"sap/suite/ui/commons/library",
	"./LayoutAlgorithm",
	"./LayoutTask",
	"../util/ConnectionPathUtils",
	"../util/DependencyLayoutHelper"
], function (library, LayoutAlgorithm, LayoutTask, ConnectionPathUtils, DependencyLayoutHelper) {
	"use strict";

	var oLayoutRenderType = library.networkgraph.LayoutRenderType,
		oComponentArrangement = library.networkgraph.ComponentArrangement;

	/**
	 * Constructor for a new NoopLayout.
	 *
	 * @class
	 * This is a simple layout algorithm that expects the positions of nodes to be already present. It only creates
	 * line coordinates (see {@link sap.suite.ui.commons.networkgraph.Line#setCoordinates}).
	 *
	 * @extends sap.suite.ui.commons.networkgraph.layout.LayoutAlgorithm
	 *
	 * @constructor
	 * @public
	 * @since 1.50
	 * @alias sap.suite.ui.commons.networkgraph.layout.NoopLayout
	 */
	var NoopLayout = LayoutAlgorithm.extend("sap.suite.ui.commons.networkgraph.layout.NoopLayout", {
		metadata: {
			library: "sap.suite.ui.commons",
			properties: {
				/**
				 * Enables advanced line routing algorithm that creates orthogonal bends along the pathfinding process for line creation.
				 *
				 * @public
				 */
				enableOptimizedLineAlgorithm: { type: "boolean", group: "Behavior", defaultValue: false },

				/**
				 * Defines how separate connected components should be arranged in the graph.
				 * Components can be arranged either horizontally (side-by-side) or vertically (stacked).
				 *
				 * @since 1.146
				 * @public
				 */
				componentArrangement: { type: "sap.suite.ui.commons.networkgraph.ComponentArrangement", group: "Behavior", defaultValue: oComponentArrangement.Horizontal }
			}
		}
	});

	const GRID_SIZE = 54; // Size of each grid cell
	const MIN_EDGE_LENGTH = 44; // Minimum length of an edge to avoid too short lines

	/**
	 * Specifies the type of layout algorithm that defines the visual features and layout of the network graph.
	 *
	 * @returns {sap.suite.ui.commons.networkgraph.LayoutRenderType} The layout render type.
	 * @public
	 */
	NoopLayout.prototype.getLayoutRenderType = function () {
		return oLayoutRenderType.LayeredWithGroups;
	};

	/**
	 * Executes the layout algorithm.
	 * Automatically calculates initial positions for unpositioned nodes using DependencyLayoutHelper,
	 * then normalizes line coordinates.
	 *
	 * @returns {sap.suite.ui.commons.networkgraph.layout.LayoutTask} Task to get the layout calculated.
	 * @public
	 */
	NoopLayout.prototype.layout = function () {
		return new LayoutTask(function (fnResolve, fnReject, oLayoutTask) {
			var oGraph = this.getParent();

			if (oLayoutTask.isTerminated()) {
				fnResolve();
				return;
			}

			if (!oGraph) {
				fnReject("The algorithm must be associated with a graph.");
				return;
			}

			// Check if positioning should be calculated
			// Note: DependencyLayoutHelper only repositions nodes without valid coordinates
			if (this._shouldCalculatePositions(oGraph)) {
				DependencyLayoutHelper.calculatePositions(oGraph, {
					componentArrangement: this.getComponentArrangement()
				});

				// Reset flag after calculation
				if (oGraph._bTriggerLayoutCalculation) {
					oGraph._bTriggerLayoutCalculation = false;
				}
			}

			if (this.getEnableOptimizedLineAlgorithm()) {
				// Use the ConnectionPathUtils utility to normalize lines
				ConnectionPathUtils.normalizeLines(oGraph, {
					gridSize: GRID_SIZE,
					minEdgeLength: MIN_EDGE_LENGTH
				});
			} else {
				this._normalizeLines();
			}

			fnResolve();
		}.bind(this));
	};

	/**
	 * Determines if initial positions should be calculated.
	 * Only returns true if there are unpositioned nodes or if explicitly triggered.
	 *
	 * @param {sap.suite.ui.commons.networkgraph.Graph} oGraph - The graph instance
	 * @returns {boolean} True if positions should be calculated
	 * @private
	 */
	NoopLayout.prototype._shouldCalculatePositions = function (oGraph) {
		// Check if explicit trigger flag is set
		// Even when triggered, DependencyLayoutHelper only affects unpositioned nodes
		if (oGraph._bTriggerLayoutCalculation) {
			return true;
		}

		// Auto-detect unpositioned nodes (coordinates 0,0 or undefined)
		return oGraph.getNodes().some(function (oNode) {
			var fX = oNode.getX();
			var fY = oNode.getY();
			return (fX === 0 || fX === undefined) && (fY === 0 || fY === undefined);
		});
	};

	return NoopLayout;
});
