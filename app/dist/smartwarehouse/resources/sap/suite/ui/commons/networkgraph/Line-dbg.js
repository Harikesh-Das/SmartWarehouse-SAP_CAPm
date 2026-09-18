/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"sap/suite/ui/commons/library",
	"./ElementBase",
	"./layout/Geometry",
	"./Coordinate",
	"./Utils",
	"sap/ui/core/RenderManager",
	"sap/ui/core/Lib"
], function (library, ElementBase, Geometry, Coordinate, Utils,RenderManager, CoreLib) {
	"use strict";

	const ArrowPosition = library.networkgraph.LineArrowPosition,
		LineType = library.networkgraph.LineType,
		ArrowOrientation = library.networkgraph.LineArrowOrientation,
		Shape = library.networkgraph.NodeShape,
		Orientation = library.networkgraph.Orientation,
		SemanticColorType = library.SemanticColorType,
		ConnectionType = library.networkgraph.ConnectionType;

	var BEND_RADIUS = 6, // Bezier 'radius' of smooth bends
		FOCUS_LANE_WIDTH = 5, // Distance of focus shadow line from the main line
		RELATIVE_ARROW_POSITION = 0.45,
		FIXED_ARROW_POSITION = 15,
		MULTIPLE_ARROW_DISTANCE = 44,
		LABEL_BOX_WIDTH = 30,
		LABEL_BOX_HEIGHT = 22,
		ARROW_LENGTH = 11, // Length of arrow from apex to tail
		ZERO_ANGLE_ARROW_POINTS = {
			Apex: {x: 5.5, y: 0},
			Second: {x: -5.5, y: -7.5},
			Third: {x: -5.5, y: 7.5}
		},
		// points for dual arrow <->
		ZERO_ANGLE_ARROW_POINTS_DUAL_1 = {
			Apex: {x: 16, y: 0},
			Second: {x: 5, y: -7.5},
			Third: {x: 5, y: 7.5}
		},
		ZERO_ANGLE_ARROW_POINTS_DUAL_2 = {
			Apex: {x: -12, y: 0},
			Second: {x: -1, y: -7.5},
			Third: {x: -1, y: 7.5}
		},
		NIPPLE_ARC_RADIUS = 5;

	var oResourceBundle = CoreLib.getResourceBundleFor("sap.suite.ui.commons");

	/**
	 * Constructor for a new Line.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Holds information about one connector line.
	 *
	 * @extends sap.suite.ui.commons.networkgraph.ElementBase
	 *
	 * @constructor
	 * @public
	 * @since 1.50
	 * @alias sap.suite.ui.commons.networkgraph.Line
	 */
	var Line = ElementBase.extend("sap.suite.ui.commons.networkgraph.Line", {
		apiVersion: 2,
		metadata: {
			library: "sap.suite.ui.commons",
			properties: {
				/**
				 * Shows if the line is selected. Once the line is selected, its appearance changes slightly
				 * to distinguish it from other lines.
				 */
				selected: {
					type: "boolean", group: "Misc", defaultValue: false
				},
				/**
				 * Key of the node where the line begins.
				 */
				from: {
					type: "string", group: "Misc", defaultValue: null
				},
				/**
				 * Key of the node the line leads to.
				 */
				to: {
					type: "string", group: "Misc", defaultValue: null
				},
				/**
				 * Defines the appearance of the line. Can be set to solid, dashed, or dotted.
				 */
				lineType: {
					type: "sap.suite.ui.commons.networkgraph.LineType",
					group: "Appearance",
					defaultValue: LineType.Solid
				},
				/**
				 * Position of the arrow on the line. Can be set to End, Middle, or Start.
				 */
				arrowPosition: {
					type: "sap.suite.ui.commons.networkgraph.LineArrowPosition",
					group: "Appearance",
					defaultValue: ArrowPosition.End
				},
				/**
				 * Orientation of the line that defines the direction of the arrow.
				 */
				arrowOrientation: {
					type: "sap.suite.ui.commons.networkgraph.LineArrowOrientation",
					group: "Appearance",
					defaultValue: ArrowOrientation.ParentOf
				},
				/**
				 * Extends the line up to the node's horizontal or vertical axis to ensure that it meets the shape's outline even when a fancy shape is used.<br>
				 * Available for custom nodes only.
				 */
				stretchToCenter: {
					type: "boolean", group: "Misc", defaultValue: false
				},
				/**
				 * Defines the connection type between the source and target nodes.
				 * Can be set to RightToLeft, LeftToRight, TopToBottom, or BottomToTop using {@link sap.suite.ui.commons.networkgraph.ConnectionType ConnectionType} enumeration.
				 * This property is used to determine how the line connects the source and target nodes. For example, if set to RightToLeft, the line starts from the right side of the source node and end at the left side of the target node.
				 * This property is valid only with the NoopLayout and drag and drop enabled network graph.
				 * @public
				 * @since 1.144
				 *
				 */
				connectionType: {
					type: "sap.suite.ui.commons.networkgraph.ConnectionType", defaultValue: ConnectionType.RightToLeft
				},
				/**
				 * Defines the text label to be displayed on the line.
				 *
				 * When set, displays the label text in a rounded rectangle box positioned near the target arrow.
				 * The label is rendered only when all of the following conditions are met:
				 * - This property has a non-empty value
				 * - The graph is using NoopLayout
				 * - The line's arrowPosition is set to "Both"
				 * - The line is long enough to accommodate the label
				 * If this property is empty or not set, no label is displayed on the line
				 * @public
				 * @since 1.144.
				 */
				labelName: {
					type: "string", group: "Behavior", defaultValue: ""
				}
			},
			aggregations: {
				/**
				 * A list of points the line goes through. After the layouting algorithm has finished arranging the graph,
				 * this aggregation contains the coordinates of at least two points: the starting point and the end point of
				 * the line. The rest of the points making up the line are treated as break points.
				 */
				coordinates: {
					type: "sap.suite.ui.commons.networkgraph.Coordinate", multiple: true, singularName: "coordinate"
				},
				/**
				 * A list of custom action buttons.
				 */
				actionButtons: {
					type: "sap.suite.ui.commons.networkgraph.ActionButton", multiple: true, singularName: "actionButton"
				}
			},
			events: {
				/**
				 * This event is fired when the user moves the mouse pointer over the line.
				 */
				hover: {},
				/**
				 * This event is fired when the user clicks or taps the line.
				 */
				press: {
					parameters: {
						/**
						 * Coordinates of the cursor when pressed.
						 */
						point: "Object",
						/**
						 * Object you can pass to 'openBy' method for custom tooltip. Its important for lines where you want to
						 * display tooltip precisely where the cursor is.
						 */
						opener: "Object"
					}
				}
			}
		},
		renderer: {
			apiVersion: 2,
			render (oRM, oControl) {
				// NOTE: this render is considered to be called only for single item invalidation
				// whole graph has different render path
				var sHtml = oControl._render({
					renderManager: oRM
				});
				this.oRm = oRM;

				if (sHtml) {
					oRM.unsafeHtml(sHtml);
				}
			}
		},
		onAfterRendering: function () {
			this._afterRenderingBase();
		},
		init: function () {
			this._oFrom = null;
			this._oTo = null;

			this._bFocusRendered = false;
			this._sKey = "";

			this._bIsHidden = false;
		}
	});

	// sum of properties that if changed requires data reprocessing
	Line.prototype.aProcessRequiredProperties = ["from", "to"];

	/* =========================================================== */
	/* Events & pseudo events */
	/* =========================================================== */
	Line.prototype._afterRendering = function () {
		this._setupEvents();
		// Only check node visibility if data is fully loaded
		var oFromNode = this.getFromNode();
		var oToNode = this.getToNode();
		if (oFromNode && oToNode && (oFromNode._bIsHidden || oToNode._bIsHidden)) {
			this.$().hide();
		}

		this._removeFromInvalidatedControls();
	};

	/* =========================================================== */
	/* Rendering */
	/* =========================================================== */
	Line.prototype._render = function (mOptions) {
		//getting reference of ORM to use semantic rendering
		var oRm = mOptions.renderManager;
		var sSelectedClass = this.getSelected() ? " " + this.SELECT_CLASS + " " : "",
			sId = this._getElementId(mOptions && mOptions.idSufix),
			sRoundedPath;
		var {style: sStyle, class: sStatusClass} = this._getStatusStyle({
			"stroke": ElementBase.ColorType.Border,
			"stroke-width": ElementBase.ColorType.BorderWidth,
			"stroke-dasharray": ElementBase.ColorType.BorderStyle
		});

		var {style: sColorStyle, class: sColorClass} = this._getStatusStyle({
			fill: ElementBase.ColorType.Background,
			stroke: ElementBase.ColorType.Border
		});

		var fnRenderPath = function (sClass, sPathId, bIsInvisible) {
			return this._renderControl("path", {
				d: sRoundedPath,
				"class": (sClass || this._getLineClass() + " " + sStatusClass),
				style: bIsInvisible ? "" : sStyle,
				from: this.getFromNode().getKey(),
				to: this.getToNode().getKey(),
				id: sId ? sId + "-" + sPathId : ""
			}, null, oRm);
		}.bind(this);

		var fnCreateArrowAttr = function (iIndex, aPoints, sArrowId) {
			var sArrowClass = "sapSuiteUiCommonsNetworkLineArrow";
			if (sColorClass) {
				sArrowClass += " " + sColorClass;
			}
			return {
				id: sId + "-" + sArrowId,
				"class": sArrowClass,
				style: sColorStyle,
				d: "M " + aPoints[iIndex + 0].x + "," + aPoints[iIndex + 0].y +
					" L " + aPoints[iIndex + 1].x + "," + aPoints[iIndex + 1].y +
					" L " + aPoints[iIndex + 2].x + "," + aPoints[iIndex + 2].y +
					" Z"
			};
		}; var fnRenderArrow = function (sOrientation, sPosition, sArrowId) {
			var aPoints = this._getArrowPoints(sOrientation, sPosition);
			this._renderControl("path", fnCreateArrowAttr(0, aPoints, sArrowId || "arrow"), null, oRm);

			// middle arrow are rendered here with single group of points
			// dual end (begin) arrow are rendered twice first as "childOf" and second as "parentOf"
			if (this._isBothMiddleArrow()) {
				this._renderControl("path", fnCreateArrowAttr(3, aPoints, "arrow1"), null, oRm);
			}
		}.bind(this);

		var fnCreateArc = function (iX, iY, sOrientation) {
			var iEndX = iX,
				iEndY = iY,
				sArc = " 0 0 0 ";

			if (sOrientation === Orientation.LeftRight || sOrientation === Orientation.RightLeft) {
				iY -= NIPPLE_ARC_RADIUS;
				iEndY += NIPPLE_ARC_RADIUS;
			}

			if (sOrientation === Orientation.TopBottom || sOrientation === Orientation.BottomTop) {
				iX -= NIPPLE_ARC_RADIUS;
				iEndX += NIPPLE_ARC_RADIUS;
			}

			if (sOrientation === Orientation.BottomTop || sOrientation === Orientation.LeftRight) {
				sArc = " 0 0 1 ";
			}

			return "M" + iX + " " + iY +
				"A" + NIPPLE_ARC_RADIUS + " " + NIPPLE_ARC_RADIUS + sArc + " " + iEndX + " " + iEndY;
		};

		this._bFocusRendered = false;

		if (this._isIgnored()) {
			return "";
		}

		if (!this.getVisible()) {
			// at least we need render invisible container as we set bOutput (for multiple reasons:) to tru manually
			oRm.openStart("g",sId);
			oRm.style("display","none");
			oRm.attr("data-sap-ui",sId);
			oRm.openEnd();
			oRm.close("g");
			return;
		}

		sRoundedPath = this._createPath();
		//Render control using new version of api
		this._renderControl("g", {
			"class": "sapSuiteUiCommonsNetworkLine " + this._getStatusClass() + sSelectedClass,
			id: sId,
			"data-sap-ui": sId
		}, false, oRm);

		// Add title for tooltip showing connection type (always shown)
		if (this.getParent()._isNoopLayout() &&
			this.getArrowPosition() === ArrowPosition.Both) {

			var sConnectionType = this.getConnectionType();
			var oMapping = this.getParent().getConnectionTypeMapping();
			var sTooltipText = "";

			if (sConnectionType === ConnectionType.LeftToRight) {
				sTooltipText = oMapping.LeftToRight || ConnectionType.LeftToRight;
			} else if (sConnectionType === ConnectionType.RightToLeft) {
				sTooltipText = oMapping.RightToLeft || ConnectionType.RightToLeft;
			} else if (sConnectionType === ConnectionType.LeftToLeft) {
				sTooltipText = oMapping.LeftToLeft || ConnectionType.LeftToLeft;
			} else if (sConnectionType === ConnectionType.RightToRight) {
				sTooltipText = oMapping.RightToRight || ConnectionType.RightToRight;
			} else {
				sTooltipText = oMapping.RightToLeft || ConnectionType.RightToLeft;
			}

			if (sTooltipText) {
				oRm.openStart("title");
				oRm.openEnd();
				oRm.text(sTooltipText);
				oRm.close("title");
			}
		}

		// invisible wrapper for better event handling
		fnRenderPath("sapSuiteUiCommonsNetworkLineInvisibleWrapper", "invisibleWrapper", true);

		// path itself
		fnRenderPath("", "path");

		if (this.getArrowPosition() === ArrowPosition.Both && this._hasMultipleDirectedArrows() && this.getCoordinates().length >= 2 ) {
			// Calculate total line length to determine arrow placement strategy
			var fTotalLineLength = this._calculateTotalLineLength();
			var bCanFitTwoArrows = this._canLineFitTwoArrows(fTotalLineLength);

			if (bCanFitTwoArrows) {
				// Line is long enough for both arrows - use smart source arrow logic
				if (this._shouldRenderSourceArrow()) {
					fnRenderArrow(ArrowOrientation.ParentOf, "multipleSource", "arrow-source");
				}
				// Always render target arrow (each incoming line gets its own target arrow)
				fnRenderArrow(ArrowOrientation.ParentOf, "multipleTarget", "arrow-target");
			} else {
				// Line is too short for two arrows - only render target arrow
				fnRenderArrow(ArrowOrientation.ParentOf, "multipleTarget", "arrow-target");
			}
		} else if (this.getArrowOrientation() !== ArrowOrientation.None && this.getCoordinates().length >= 2) {
			if (this.getArrowOrientation() === ArrowOrientation.Both) {
				if (this.getArrowPosition() === ArrowPosition.Middle) {
					// middle arrow is rendered "at once" using two groups of points
					fnRenderArrow(ArrowOrientation.ParentOf, ArrowPosition.Middle);
				} else {
					// arrows on edges are rendered twice using default methods
					fnRenderArrow(ArrowOrientation.ChildOf, ArrowPosition.Start, "arrow");
					fnRenderArrow(ArrowOrientation.ParentOf, ArrowPosition.End, "arrow1");
				}
			} else {
				fnRenderArrow();
			}
		}

		if (this._aNipples) {
			var sColorStyleText = sColorStyle ? sColorStyle : "";
			this._aNipples.forEach(function (oNipple) {
				oRm.openStart("path");
				this.applyStyles(oRm, this.getStyleObject(sColorStyleText));
				oRm.class("sapSuiteUiCommonsNetworkLineNipple");
				((sColorClass || "").split(" ") || []).forEach((sClass) => {
					if (sClass) {
						oRm.class(sClass);
					}
				})
				oRm.attr("d", fnCreateArc(oNipple.x, oNipple.y, oNipple.orientation));
				oRm.openEnd();
				oRm.close("path");
			}.bind(this));
		} oRm.close("g");
	};

	/**
	 * Renders the text label for this line. Used by batch text rendering.
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager to use for rendering
	 * @param {string} [sIdSuffix] Optional suffix for element ID
	 * @private
	 */
	Line.prototype._renderLineText = function (oRm, sIdSuffix) {
		// Early return if any condition is not met:
		// - labelName has a non-empty value
		// - Graph must be in NoopLayout
		// - arrowPosition must be Both (labels only shown when both arrows are present)
		if (!this.getLabelName() ||
			!this.getParent()._isNoopLayout() ||
			this.getArrowPosition() !== ArrowPosition.Both) {
			return;
		}

		// Always use the base line ID without any suffix to ensure consistency
		// with _hideShowLineText which can't know what suffix was used during rendering
		var sId = this.getId();
		var {style: sStyle, class: sStatusClass} = this._getStatusStyle({
			"stroke": ElementBase.ColorType.Border,
			"stroke-width": ElementBase.ColorType.BorderWidth,
			"stroke-dasharray": ElementBase.ColorType.BorderStyle
		});

		// Get the connection type and convert to display text
		var sConnectionType = this.getConnectionType();
		var oMapping = this.getParent().getConnectionTypeMapping();
		var sFullText = ""; // Store the full text for tooltip

		// Check if custom mapping exists for this connection type
		switch (sConnectionType) {
			case ConnectionType.LeftToRight:
				sFullText = oMapping.LeftToRight || ConnectionType.LeftToRight;
				break;
			case ConnectionType.RightToLeft:
				sFullText = oMapping.RightToLeft || ConnectionType.RightToLeft;
				break;
			case ConnectionType.LeftToLeft:
				sFullText = oMapping.LeftToLeft || ConnectionType.LeftToLeft;
				break;
			case ConnectionType.RightToRight:
				sFullText = oMapping.RightToRight || ConnectionType.RightToRight;
				break;
			default:
				sFullText = oMapping.RightToLeft || ConnectionType.RightToLeft;
				break;
		}

		// Calculate position near the ingoing arrow (end of the line)
		// When ArrowPosition.Both, the target arrow is positioned at MULTIPLE_ARROW_DISTANCE (44px) from the end
		var oCoords = this.getCoordinates();
		if (oCoords && oCoords.length >= 2) {
			var aFragmentLengthSum = [], fTotalDistance = 0;
			var iLastIndex = oCoords.length - 1;

			// Calculate cumulative distances along the path
			for (var i = 0; i < iLastIndex; i++) {
				if (oCoords[i].getX() === oCoords[i + 1].getX()) {
					// Vertical line - only Y changes
					fTotalDistance += Math.abs(oCoords[i + 1].getY() - oCoords[i].getY());
				} else if (oCoords[i].getY() === oCoords[i + 1].getY()) {
					// Horizontal line - only X changes
					fTotalDistance += Math.abs(oCoords[i + 1].getX() - oCoords[i].getX());
				} else {
					// Diagonal line - use Pythagorean theorem If Lines are plotted Diagonally
					fTotalDistance += Math.sqrt(
						Math.pow(oCoords[i + 1].getX() - oCoords[i].getX(), 2) +
						Math.pow(oCoords[i + 1].getY() - oCoords[i].getY(), 2)
					);
				}
				// Store cumulative distance
				aFragmentLengthSum.push(fTotalDistance);
			}

			// Check if there's enough space for the label box with 8px padding from target arrow
			// When line is long enough for both arrows, check gap between them
			// When line is short, source arrow is hidden and target arrow position is adjusted
			var bCanFitTwoArrows = this._canLineFitTwoArrows(fTotalDistance);
			var fTargetArrowDistance;
			var fAvailableSpace;

			if (bCanFitTwoArrows) {
				// Both arrows present at fixed positions
				fTargetArrowDistance = MULTIPLE_ARROW_DISTANCE;
				// Available space = total - (source position + source arrow + target position + target arrow + 8px padding)
				fAvailableSpace = fTotalDistance - (MULTIPLE_ARROW_DISTANCE + ARROW_LENGTH + MULTIPLE_ARROW_DISTANCE + ARROW_LENGTH + 8);
			} else {
				// Only target arrow present
				fTargetArrowDistance = Math.min(MULTIPLE_ARROW_DISTANCE, fTotalDistance * 0.3);
				// Available space = total - (target position + target arrow + 8px padding)
				fAvailableSpace = fTotalDistance - (fTargetArrowDistance + ARROW_LENGTH + 8);
			}

			var fRequiredSpace = LABEL_BOX_WIDTH; // 30px box width
			if (fAvailableSpace < fRequiredSpace) {
				return;
			}

			// Position label so its end is 8px away from the target arrow
			var fTargetDistance = fTotalDistance - fTargetArrowDistance - 8 - LABEL_BOX_WIDTH; // arrow position + 8px offset + full box width
			var iTargetIndex = 0;
			for (var j = 0; j < iLastIndex; j++) {
				if (aFragmentLengthSum[j] >= fTargetDistance) {
					iTargetIndex = j;
					break;
				}
			}

			// Calculate the exact position on the segment
			var fSegmentStart = iTargetIndex > 0 ? aFragmentLengthSum[iTargetIndex - 1] : 0;
			var fSegmentLength = aFragmentLengthSum[iTargetIndex] - fSegmentStart;
			var fPositionInSegment = (fTargetDistance - fSegmentStart) / fSegmentLength;
			var fLabelX = oCoords[iTargetIndex].getX() +
				(oCoords[iTargetIndex + 1].getX() - oCoords[iTargetIndex].getX()) * fPositionInSegment;
			var fLabelY = oCoords[iTargetIndex].getY() +
				(oCoords[iTargetIndex + 1].getY() - oCoords[iTargetIndex].getY()) * fPositionInSegment;

			// Calculate box position (centered on label coordinates)
			var fBoxX = fLabelX - LABEL_BOX_WIDTH / 2;
			var fBoxY = fLabelY - LABEL_BOX_HEIGHT / 2;

			// Create a group to contain both rectangle and text
			oRm.openStart("g");
			oRm.class("sapSuiteUiCommonsNetworkLineTextBox");
			oRm.attr("id", sId + "-textbox-middle");
			oRm.attr("data-line-id", this._getLineId());
			oRm.openEnd();

			// Add title for tooltip on the label box group
			oRm.openStart("title");
			oRm.openEnd();
			oRm.text(sFullText);
			oRm.close("title");

			// Render the rectangle background
			oRm.openStart("rect");
			oRm.class("sapSuiteUiCommonsNetworkLineTextBoxBackground");
			if (sStatusClass) {
				oRm.class(sStatusClass);
			}
			//this.applyStyles(oRm, this.getStyleObject(sStyle)); //ToDo:  to be applied if Box should also adhere to status styles
			oRm.attr("x", fBoxX);
			oRm.attr("y", fBoxY);
			oRm.attr("width", LABEL_BOX_WIDTH);
			oRm.attr("height", LABEL_BOX_HEIGHT);
			oRm.attr("rx", 8); // Rounded corners
			oRm.attr("ry", 8);
			oRm.openEnd();
			oRm.close("rect");

			// Render the text inside the rectangle
			oRm.openStart("text");
			oRm.class("sapSuiteUiCommonsNetworkLineText");
			oRm.attr("x", fLabelX);
			oRm.attr("y", fLabelY); // Center vertically in the box
			oRm.openEnd();
			oRm.text(this.getLabelName());
			oRm.close("text");

			// Close the group
			oRm.close("g");
		}
	};

	Line.prototype._renderFocusWrapper = function () {
		var fnAppendFocusLine = function (iShift) {
			var oPath = this._createElement("path", {
				d: this._createPath(iShift),
				"class": "sapSuiteUiCommonsNetworkLineFocus"
			});

			// Find the first text box group to insert before it
			var oContainer = this.getDomRef();
			var oFirstTextBox = oContainer ? oContainer.querySelector(".sapSuiteUiCommonsNetworkLineTextBox") : null;

			if (oFirstTextBox) {
				// Insert the focus line before the first text box group
				oContainer.insertBefore(oPath, oFirstTextBox);
			} else {
				// Fallback: append to end if no text boxes found
				if (oContainer) {
					oContainer.appendChild(oPath);
				}
			}
		}.bind(this);

		if (!this._bFocusRendered) {
			fnAppendFocusLine(FOCUS_LANE_WIDTH);
			fnAppendFocusLine(-FOCUS_LANE_WIDTH);

			this._bFocusRendered = true;
		}
	};

	Line.prototype._resetLayoutData = function () {
		this._aNipples = null;
	};

	Line.prototype._createPath = function (iShift) {
		if (!this.getSource() || !this.getTarget()) {
			return;
		}

		var aPoints = [{
				x: this.getSource().getX(),
				y: this.getSource().getY()
			}],
			sPath = "M" + this.getSource().getX() + "," + this.getSource().getY(),
			iLast, iNew,
			bIsTopBottom = this._isTopBottom(),
			sCoord = bIsTopBottom ? "x" : "y",
			sFnName = bIsTopBottom ? "getX" : "getY",
			aCoordinates = this.getBends().concat([this.getTarget()]);

		// this should prevent some small Y adjustments when line is almost on same Y but not quite
		for (var i = 0; i < aCoordinates.length; i++) {
			// check current - 2 to determine if current - 1 is in "almost" the same y(x)
			// in such case we ignore middle coordinate and create one single line
			// aPoints is one coordinate "before" so aPoints[i-1] is actually aCoordinates - 2
			iLast = aPoints[i - 1] ? aPoints[i - 1][sCoord] : NaN;
			iNew = aCoordinates[i][sFnName]();

			if (Math.abs(iLast - aCoordinates[i][sFnName]()) < 2) {
				aPoints.pop();
				iNew = iLast;
			}

			aPoints.push({
				x: bIsTopBottom ? iNew : aCoordinates[i].getX(),
				y: !bIsTopBottom ? iNew : aCoordinates[i].getY()
			});
		}

		for (var j = 1; j < aPoints.length; j++) {
			sPath += " L" + aPoints[j].x + "," + aPoints[j].y;
		}

		return Geometry.getBezierPathCorners(sPath, BEND_RADIUS, iShift);
	};

	Line.prototype._getLineClass = function () {
		var fnGetLineTypeClass = function () {
			switch (this.getLineType()) {
				case LineType.Dashed:
					return "sapSuiteUiCommonsNetworkDashedLine";
				case LineType.Dotted:
					return "sapSuiteUiCommonsNetworkDottedLine";
				default:
					return "";
			}
		}.bind(this);

		return "sapSuiteUiCommonsNetworkLinePath " + fnGetLineTypeClass();
	};

	/**
	 * Identification of the line fragment where the arrow is supposed to be placed.
	 * @private
	 */
	Line.prototype._getArrowFragmentVector = function (sPosition) {
		var oCoords = this.getCoordinates(),
			iLastIndex = oCoords.length - 1,
			iHolyIndex = 0,
			fnGetFragmentSize = function (i) {
				return Math.abs(oCoords[i].getX() - oCoords[i + 1].getX())
					+ Math.abs(oCoords[i].getY() - oCoords[i + 1].getY());
			};

		sPosition = sPosition || this.getArrowPosition();

		// Handle multiple directed arrows positioning
		if (sPosition === "multipleSource" || sPosition === "multipleTarget") {
			// Check if line is long enough for the requested arrow position
			var fTotalLineLength = this._calculateTotalLineLength();
			var bCanFitTwoArrows = this._canLineFitTwoArrows(fTotalLineLength);

			// If line is too short and we're trying to render source arrow, skip it
			if (!bCanFitTwoArrows && sPosition === "multipleSource") {
				// Return default fallback to avoid errors
				return {
					center: {x: oCoords[0].getX(), y: oCoords[0].getY()},
					apex: {x: oCoords[1].getX(), y: oCoords[1].getY()}
				};
			}
			// Find optimal segment by traveling 44px along the line path
			var sDirection = sPosition === "multipleSource" ? "forward" : "backward";
			var fDistance = bCanFitTwoArrows ? MULTIPLE_ARROW_DISTANCE : Math.min(MULTIPLE_ARROW_DISTANCE, fTotalLineLength * 0.3);
			var oSegmentInfo = this._findOptimalArrowSegment(sDirection, fDistance);

			return {
				center: oSegmentInfo.center,
				apex: oSegmentInfo.apex,
				segmentRatio: oSegmentInfo.ratio,
				isMultipleDirected: true
			};
		}

		if (this.getBends().length === 0) {
			iHolyIndex = 0;
		} else if (sPosition === ArrowPosition.Start) {
			while (iHolyIndex < (iLastIndex - 1) && this._doesLineFragmentCrossCollapsedGroup(iHolyIndex)) {
				iHolyIndex++;
			}
			// When the intended fragment is too small, shift it yet more
			if (fnGetFragmentSize(iHolyIndex) < FIXED_ARROW_POSITION) {
				iHolyIndex++;
			}
			// When still crossing a collapsed group rollback the optimization attempt
			if (this._doesLineFragmentCrossCollapsedGroup(iHolyIndex)) {
				iHolyIndex = 0;
			}
		} else if (sPosition === ArrowPosition.End) {
			iHolyIndex = iLastIndex - 1;
			while (iHolyIndex > 0 && this._doesLineFragmentCrossCollapsedGroup(iHolyIndex)) {
				iHolyIndex--;
			}
			// When the intended fragment is too small, shift it yet more
			if (fnGetFragmentSize(iHolyIndex) < FIXED_ARROW_POSITION) {
				iHolyIndex--;
			}
		} else {
			// Find fragment closest to the middle of all fragments in terms of length
			var aFragLenSums = [], fDist = 0;
			for (var i = 0; i < iLastIndex; i++) {
				if (oCoords[i].getX() === oCoords[i + 1].getX()) {
					fDist += Math.abs(oCoords[i + 1].getY() - oCoords[i].getY());
				} else if (oCoords[i].getY() === oCoords[i + 1].getY()) {
					fDist += Math.abs(oCoords[i + 1].getX() - oCoords[i].getX());
				} else {
					fDist += Geometry.getPointsDistance(
						{x: oCoords[i].getX(), y: oCoords[i].getY()},
						{x: oCoords[i + 1].getX(), y: oCoords[i + 1].getY()});
				}
				aFragLenSums.push(fDist);
			}
			fDist = fDist / 2;
			for (i = 0; i < iLastIndex && iHolyIndex === 0; i++) {
				if (aFragLenSums[i] >= fDist && !this._doesLineFragmentCrossCollapsedGroup(i)) {
					iHolyIndex = i;
				}
			}
		}

		// 'Better safe than sorry' fallback
		if (iHolyIndex < 0 || iHolyIndex > (iLastIndex - 1)) {
			iHolyIndex = 0;
		}

		return {
			center: {x: oCoords[iHolyIndex].getX(), y: oCoords[iHolyIndex].getY()},
			apex: {x: oCoords[iHolyIndex + 1].getX(), y: oCoords[iHolyIndex + 1].getY()}
		};
	};

	/**
	 * @private
	 */
	Line.prototype._doesLineFragmentCrossCollapsedGroup = function (iStartCoordIndex) {
		var oGraph = this.getParent(),
			oBend1 = this.getCoordinates()[iStartCoordIndex],
			oBend2 = this.getCoordinates()[iStartCoordIndex + 1];
		return oGraph.getGroups().some(function (oGroup) {
			return oGroup.getCollapsed() && Geometry.doLineRectangleIntersect(
				{ // Line fragment end points, slightly smaller to skip when just touching the group
					p1: {
						x: Math.min(oBend1.getX(), oBend2.getX()) + 1,
						y: Math.min(oBend1.getY(), oBend2.getY()) + 1
					},
					p2: {
						x: Math.max(oBend1.getX(), oBend2.getX()) - 1,
						y: Math.max(oBend1.getY(), oBend2.getY()) - 1
					}
				},
				{ // Group rectangle
					p1: {x: oGroup.getX(), y: oGroup.getY()},
					p2: {x: oGroup.getX() + oGroup._iWidth, y: oGroup.getY() + oGroup._iHeight}
				}
			);
		});
	};

	/**
	 * @private
	 */
	Line.prototype._getArrowPoints = function (sOrientation, sPosition) {
		var oPosVector, oFragVector,
			oArrowCenter, fArrowAngle, aArrowPoints = [];

		sOrientation = sOrientation || this.getArrowOrientation();
		sPosition = sPosition || this.getArrowPosition();

		var fnCalcArrowPoint = function (oArrowVertex) {
			var fFixedPosition = FIXED_ARROW_POSITION;
			// Handle multiple directed arrows with precise positioning along segments
			if (sPosition === "multipleSource" || sPosition === "multipleTarget") {
				// Use the exact position calculated to be precisely 44px away
				oArrowCenter = oFragVector.exactPosition || {
					x: oFragVector.center.x + (oFragVector.apex.x - oFragVector.center.x) * (oFragVector.segmentRatio || 0.5),
					y: oFragVector.center.y + (oFragVector.apex.y - oFragVector.center.y) * (oFragVector.segmentRatio || 0.5)
				};
			} else if (sPosition === ArrowPosition.Middle) { // First calculate where the center of the arrow is
				oArrowCenter = {
					x: (oFragVector.apex.x - oFragVector.center.x) * RELATIVE_ARROW_POSITION + oFragVector.center.x,
					y: (oFragVector.apex.y - oFragVector.center.y) * RELATIVE_ARROW_POSITION + oFragVector.center.y
				};
			} else {
				// Circle has lines going all the way to the center axis, we need to stretch fixed position, spare the collapsed groups
				if (!(this.getToNode()._oGroup && this.getToNode()._oGroup.getCollapsed()) &&
					this.getToNode().getShape() === Shape.Circle && sPosition === ArrowPosition.End) {
					fFixedPosition += this.getToNode()._getCircleSize() / 2;
				} else if (!(this.getFromNode()._oGroup && this.getFromNode()._oGroup.getCollapsed()) &&
					this.getFromNode().getShape() === Shape.Circle && sPosition === ArrowPosition.Start) {
					fFixedPosition += this.getFromNode()._getCircleSize() / 2;
				}
				oPosVector = Geometry.getNormalizedVector(oFragVector, fFixedPosition);
				if (sPosition === ArrowPosition.Start) {
					oArrowCenter = oFragVector.center;
				} else if (sPosition === ArrowPosition.End) {
					oPosVector = Geometry.getRotatedVector(oPosVector, Math.PI);
					oArrowCenter = oFragVector.apex;
				}
				oArrowCenter = Geometry.getPointSum(oArrowCenter, oPosVector.apex);
			}
			// Then get the angle
			fArrowAngle = Geometry.getAngleOfVector(oFragVector);
			if (sOrientation === ArrowOrientation.ChildOf) {
				fArrowAngle += Math.PI;
			}
			// Finally rotate and translate
			aArrowPoints.push(Geometry.getPointSum(oArrowCenter, Geometry.getRotatedPoint(oArrowVertex, fArrowAngle)));
		}.bind(this);

		oFragVector = this._getArrowFragmentVector(sPosition);

		if (this._isBothMiddleArrow()) {
			fnCalcArrowPoint(ZERO_ANGLE_ARROW_POINTS_DUAL_1.Apex);
			fnCalcArrowPoint(ZERO_ANGLE_ARROW_POINTS_DUAL_1.Second);
			fnCalcArrowPoint(ZERO_ANGLE_ARROW_POINTS_DUAL_1.Third);

			fnCalcArrowPoint(ZERO_ANGLE_ARROW_POINTS_DUAL_2.Apex);
			fnCalcArrowPoint(ZERO_ANGLE_ARROW_POINTS_DUAL_2.Second);
			fnCalcArrowPoint(ZERO_ANGLE_ARROW_POINTS_DUAL_2.Third);
		} else {
			fnCalcArrowPoint(ZERO_ANGLE_ARROW_POINTS.Apex);
			fnCalcArrowPoint(ZERO_ANGLE_ARROW_POINTS.Second);
			fnCalcArrowPoint(ZERO_ANGLE_ARROW_POINTS.Third);
		}

		return aArrowPoints;
	};

	/**
	 * @private
	 */
	Line.prototype._getAccessibilityLabel = function (oGraph) {
		const aSentenceParts = [];
		const sConnectionType = this.getConnectionType();
		const oMapping = oGraph.getConnectionTypeMapping();
		// In RTL mode, left and right sides of nodes are semantically swapped
		const bRTL = this.getParent()._bIsRtl;
		const sResolvedType = bRTL ? (Utils.mRTLSwap[sConnectionType] || sConnectionType) : sConnectionType;
		const sConnectionTypeText = oMapping[sResolvedType];
		const sFromNodeTitle = this.getFromNode().getTitle();
		const sFromNodeText = sFromNodeTitle ? sFromNodeTitle : this.getFromNode().getAltText();
		const sToNodeTitle = this.getToNode().getTitle();
		const sToNodeText = sToNodeTitle ? sToNodeTitle : this.getToNode().getAltText();
		let sConnectionText = oResourceBundle.getText('NETWORK_GRAPH_LINE_ACCESSIBILITY_CONNECTION_FROM_TO', [sFromNodeText, sToNodeText]);
		if (sConnectionTypeText) {
			sConnectionText = `${sConnectionTypeText} ${sConnectionText.charAt(0).toLowerCase()}${sConnectionText.slice(1)}`;
		}
		aSentenceParts.push(sConnectionText);

		const sStatusText = this._getStatusText(oGraph._oStatuses);

		if (sStatusText) {
			aSentenceParts.push(
				`${oResourceBundle.getText('NETWORK_GRAPH_LINE_ACCESSIBILITY_STATUS')} ${sStatusText}`
			);
		}

		if (this.getSelected()) {
			aSentenceParts.push(oResourceBundle.getText('NETWORK_GRAPH_SELECTED_NODE'));
		}

		aSentenceParts.push(oResourceBundle.getText('NETWORK_GRAPH_ACCESSIBILITY_TOGGLE_STATE'));

		const iIncomingConnectors = this.getFromNode().getChildLines().length;
		if (iIncomingConnectors > 1) {
			aSentenceParts.push(oResourceBundle.getText('NETWORK_GRAPH_LINE_NAVIGATION_ARROW_KEYS', [sFromNodeText]));
		}

		aSentenceParts.push(oResourceBundle.getText('NETWORK_GRAPH_LINE_NAVIGATION_TAB_TO_TARGET', [sToNodeText]));
		aSentenceParts.push(oResourceBundle.getText('NETWORK_GRAPH_LINE_NAVIGATION_SHIFT_TAB_TO_SOURCE', [sFromNodeText]));

		return aSentenceParts.join('. ');
	};

	/* =========================================================== */
	/* Public methods */
	/* =========================================================== */
	/**
	 * Returns the node instance where the line starts.
	 * This method doesn't call invalidate on the object.
	 * @returns {object} Node instance where the line starts
	 * @public
	 */
	Line.prototype.getFromNode = function () {
		this._checkForProcessData();
		if (!this._oFrom && this.getParent()) {
			this._oFrom = this.getParent().getNodeByKey(this.getFrom());
		}
		return this._oFrom;
	};

	/**
	 * Returns the node instance where the line leads to.
	 * This method doesn't call invalidate on the object.
	 * @returns {object} Node instance where the line ends
	 * @public
	 */
	Line.prototype.getToNode = function () {
		this._checkForProcessData();
		if (!this._oTo && this.getParent()) {
			this._oTo = this.getParent().getNodeByKey(this.getTo());
		}
		return this._oTo;
	};

	/**
	 * Sets the starting point, or the source, for the line.
	 * This method doesn't call invalidate on the object.
	 * @param {object} mArguments mArguments.x mArguments.y X and Y coordinates of the starting point
	 * @public
	 */
	Line.prototype.setSource = function (mArguments) {
		var oCoordinate;
		if (this.getCoordinates().length === 0) {
			oCoordinate = new Coordinate();
			this.addAggregation("coordinates", oCoordinate, true);
		}

		oCoordinate = this.getCoordinates()[0];
		if (mArguments.x || mArguments.x === 0) {
			oCoordinate.setX(mArguments.x);
		}

		if (mArguments.y || mArguments.y === 0) {
			oCoordinate.setY(mArguments.y);
		}
	};

	/**
	 * Returns the coordinates of the line's starting point.
	 * This method doesn't call invalidate on the object.
	 * @returns {sap.suite.ui.commons.networkgraph.Coordinate} Coordinate object
	 * @public
	 */
	Line.prototype.getSource = function () {
		return this.getCoordinates()[0];
	};

	/**
	 * Returns the coordinates of the line's end point.
	 * This method doesn't call invalidate on the object.
	 * @returns {sap.suite.ui.commons.networkgraph.Coordinate} Coordinate object
	 * @public
	 */
	Line.prototype.getTarget = function () {
		// if there is only 1 node source == target
		return this.getCoordinates().length > 0 ? this.getCoordinates()[this.getCoordinates().length - 1] : null;
	};

	/**
	 * Sets the end point, or the target, for the line.
	 * This method doesn't call invalidate on the object.
	 * @param {object} mArguments mArguments.x mArguments.y X and Y coordinates of the end point
	 * @public
	 */
	Line.prototype.setTarget = function (mArguments) {
		var oCoordinate;

		if (this.getCoordinates().length < 2) {
			oCoordinate = new Coordinate();
			this.addAggregation("coordinates", oCoordinate, true);
		}
		oCoordinate = this.getCoordinates()[this.getCoordinates().length - 1];

		if (mArguments.x || mArguments.x === 0) {
			oCoordinate.setX(mArguments.x);
		}

		if (mArguments.y || mArguments.y === 0) {
			oCoordinate.setY(mArguments.y);
		}
	};

	/**
	 * Returns the coordinates of all points that define the shape of the line between its start and end points.
	 * This method doesn't call invalidate on the object.
	 * @returns {sap.suite.ui.commons.networkgraph.Coordinate[]} Coordinates of the points shaping the line
	 * @public
	 */
	Line.prototype.getBends = function () {
		return this.getCoordinates().filter(function (oCoord, iIndex) {
			return (iIndex > 0) && (iIndex < (this.getCoordinates().length - 1));
		}, this);
	};

	/**
	 * Removes all points that define the shape of the line between its start and end points.
	 * This method doesn't call invalidate on the object.
	 * @public
	 */
	Line.prototype.clearBends = function () {
		this.getBends().forEach(function (oBend) {
			this.removeAggregation("coordinates", oBend, true);
		}, this);
	};

	/**
	 * Adds coordinates for points that should define the shape of the line between its start and end points.
	 * This method doesn't call invalidate on the object.
	 * @param {{x: float, y: float}} oPoint X and Y coordinates
	 * @returns {sap.suite.ui.commons.networkgraph.Coordinate} Newly added coordinates object
	 * @public
	 */
	Line.prototype.addBend = function (oPoint) {
		var oNew = new Coordinate();
		oNew.setX(oPoint.x);
		oNew.setY(oPoint.y);
		this.insertAggregation("coordinates", oNew, this.getCoordinates().length - 1, true);

		return oNew;
	};

	Line.prototype.isHidden = function () {
		return this._bIsHidden;
	};

	Line.prototype.getKey = function () {
		return this._getLineId();
	};

	/**
	 * Hides the line.
	 * @public
	 */
	Line.prototype.setHidden = function (bValue) {
		this.$()[bValue ? "hide" : "show"]();
	};

	/* =========================================================== */
	/* Private methods */
	/* =========================================================== */
	Line.prototype._isIgnored = function () {
		var oFrom = this.getFromNode(),
			oTo = this.getToNode(),
			bInsideCollapsedGroup =
				oFrom._oGroup && oFrom._oGroup.getCollapsed()
				&& oTo._oGroup && oTo._oGroup.getCollapsed()
				&& oFrom._oGroup === oTo._oGroup,
			bNodesIgnored = !oFrom._useInLayout() || !oTo._useInLayout();

		return !this._useInLayout || bInsideCollapsedGroup || this._isLoop() || bNodesIgnored;
	};

	Line.prototype._isLoop = function () {
		return this.getFromNode().getId() === this.getToNode().getId();
	};

	Line.prototype._getLineId = function () {
		return this._sKey ? this._sKey : "line_" + this.getFrom() + "-" + this.getTo();
	};

	Line.prototype._setupEvents = function () {
		var $line = this.$().find(".sapSuiteUiCommonsNetworkLineInvisibleWrapper");

		$line.on("click", function (oEvent) {
			this._click({
				ctrlKey: oEvent.ctrlKey,
				clientX: oEvent.clientX,
				clientY: oEvent.clientY
			});
		}.bind(this));

		$line.on("mouseover", function (oEvent) {
			this._mouseOver();
		}.bind(this));

		$line.on("mouseout", function (oEvent) {
			this._mouseOut();
		}.bind(this));

		// Setup events for text box
		var oParent = this.getParent();
		if (oParent) {
			var sLineId = this._getLineId();
			var $textBox = oParent.$("line-texts").find('[data-line-id="' + sLineId + '"]');

			$textBox.on("click", function (oEvent) {
				this._click({
					ctrlKey: oEvent.ctrlKey,
					clientX: oEvent.clientX,
					clientY: oEvent.clientY
				});
			}.bind(this));

			$textBox.on("mouseover", function (oEvent) {
				this._mouseOver();
			}.bind(this));

			$textBox.on("mouseout", function (oEvent) {
				this._mouseOut();
			}.bind(this));
		}
	};

	Line.prototype._mouseOut = function () {
		this.$().removeClass(this.HIGHLIGHT_CLASS);
		// Remove highlight class from text box using data-line-id attribute
		var oParent = this.getParent();
		if (oParent) {
			var sLineId = this._getLineId();
			oParent.$("line-texts").find('[data-line-id="' + sLineId + '"]').removeClass(this.HIGHLIGHT_CLASS);
		}
		if (!this.getSelected()) {
			this._setStatusColors("");
		}
	};

	Line.prototype._mouseOver = function () {
		var bExecuteDefault = this.fireEvent("hover", {}, true);

		if (!this.getSelected() && bExecuteDefault) {
			this._setStatusColors("Hover");
			this.$().addClass(this.HIGHLIGHT_CLASS);
			// Add highlight class to text box using data-line-id attribute
			var oParent = this.getParent();
			if (oParent) {
				var sLineId = this._getLineId();
				oParent.$("line-texts").find('[data-line-id="' + sLineId + '"]').addClass(this.HIGHLIGHT_CLASS);
			}
		}
	};

	Line.prototype._setStatusColors = function (sType) {
		var $arrow = this.$().find(".sapSuiteUiCommonsNetworkLineArrow"),
			sBorderColor = this._getColor(ElementBase.ColorType[sType + "Border"]),
			sBackgroundColor = this._getColor(ElementBase.ColorType[sType + "Background"]);

		if (SemanticColorType.hasOwnProperty(sBackgroundColor)) {
			$arrow.addClass(Utils.SEMANTIC_CLASS_NAME.FILL + sBackgroundColor);
			$arrow.addClass(Utils.SEMANTIC_CLASS_NAME.STROKE + sBackgroundColor); // borderColor is going to be deprecated after UI52.x, hence adding respective stroke for minimum color contrast
			this.$("path").addClass(Utils.SEMANTIC_CLASS_NAME.STROKE + sBackgroundColor);

			if (this.getParent() && this.getParent()._isSwimLane()) {
				var $nipple = this.$().find(".sapSuiteUiCommonsNetworkLineNipple");
				$nipple.addClass(Utils.SEMANTIC_CLASS_NAME.FILL + sBackgroundColor);
				$nipple.addClass(Utils.SEMANTIC_CLASS_NAME.STROKE + sBackgroundColor);
			}
		} else {
			/** @deprecated As of 1.120 */
			{
				$arrow.css("fill", sBackgroundColor);
				$arrow.css("stroke", sBorderColor);
				this.$("path").css("stroke", sBorderColor);

				if (this.getParent() && this.getParent()._isSwimLane()) {
					var $nipple = this.$().find(".sapSuiteUiCommonsNetworkLineNipple");
					$nipple.css("fill", sBackgroundColor);
					$nipple.css("stroke", sBorderColor);
				}
			}
		}
	};

	Line.prototype._showActionButtons = function (oPoint) {
		var fnCheckAndSetBoundaries = function (oNode, iBottom, iRight) {
			var bIntersection = fnCheckBoundaries(oNode, iBottom, iRight);
			if (bIntersection) {
				oNode._setNodeOpacity(true);
				oParent._aShadedNodes.push(oNode);
			}

			return bIntersection;
		};

		var fnCheckBoundaries = function (oNode, iBottom, iRight) {
			return Geometry.hasRectangleRectangleIntersection({
				p1: {
					x: iLeft,
					y: iTop
				},
				p2: {
					x: iRight,
					y: iBottom
				}
			}, oNode._getContentRect());
		};

		var fnCreateLine = function (oFrom, oTo) {
			return {
				p1: {
					x: oFrom.x,
					y: oFrom.y
				},
				p2: {
					x: oTo.x,
					y: oTo.y
				}
			};
		};

		var iLines = 0;
		var fnAppendArrow = function (sClass, oPos) {
			if (iLines < 2) {
				var $arrow = jQuery('<div></div>', {
					"class": sClass,
					css: {
						top: oPos.top,
						left: oPos.left,
						right: oPos.right,
						bottom: oPos.bottom
					}
				});

				$tooltip.append($arrow);
				iLines++;
			}
		};

		var oParent = this.getParent(),
			$wrapper = oParent.$("divlinebuttons"),
			$tooltip = oParent.$("linetooltip"),
			$buttons = oParent.$("linetooltipbuttons");

		var oFrom = this.getFromNode(),
			oTo = this.getToNode();

		var ARROW_SIZE = 10;

		oParent._aShadedNodes = [];

		var sFromNodeTitle = oFrom.getTitle();
		var sFromNodeText = sFromNodeTitle ? sFromNodeTitle : oFrom.getAltText();

		// Add connection type information (always shown in tooltip)
		var sConnectionTypeText = "";
		var sTitle = "";

		if (this.getParent()._isNoopLayout() &&
			this.getArrowPosition() === ArrowPosition.Both) {

			var sConnectionType = this.getConnectionType();
			var oMapping = this.getParent().getConnectionTypeMapping();

			if (sConnectionType === ConnectionType.LeftToRight) {
				sConnectionTypeText = oMapping.LeftToRight || ConnectionType.LeftToRight;
			} else if (sConnectionType === ConnectionType.RightToLeft) {
				sConnectionTypeText = oMapping.RightToLeft || ConnectionType.RightToLeft;
			} else if (sConnectionType === ConnectionType.LeftToLeft) {
				sConnectionTypeText = oMapping.LeftToLeft || ConnectionType.LeftToLeft;
			} else if (sConnectionType === ConnectionType.RightToRight) {
				sConnectionTypeText = oMapping.RightToRight || ConnectionType.RightToRight;
			} else {
				sConnectionTypeText = oMapping.RightToLeft || ConnectionType.RightToLeft;
			}

			if (sConnectionTypeText) {
				sTitle += "<span class=\"sapSuiteUiCommonsNetworkGraphLineTooltipText\">" + sConnectionTypeText + "</span><br/>";
			}
		}

		sTitle +=  "<span class=\"sapSuiteUiCommonsNetworkGraphLineTooltipText\">" + sFromNodeText + "</span>";

		if (this._isBothArrow()) {
			sTitle += "<span class=\"sapSuiteUiCommonsNetworkGraphLineTooltipArrow sapSuiteUiCommonsNetworkGraphLineTooltipDualArrow\"></span>"
				+ "<span class=\"sapSuiteUiCommonsNetworkGraphLineTooltipArrow\"></span>" + "</br>";
		} else if (this.getArrowOrientation() === ArrowOrientation.ChildOf) {
			sTitle += "<span class=\"sapSuiteUiCommonsNetworkGraphLineTooltipArrow\"></span>" + "</br>";
		} else if (this.getArrowOrientation() === ArrowOrientation.ParentOf) {
			sTitle += "<span class=\"sapSuiteUiCommonsNetworkGraphLineTooltipArrow\"></span>" + "</br>";
		} else {
			sTitle += "<span class=\"sapSuiteUiCommonsNetworkGraphLineTooltipArrow\"></span>" + "</br>";
		}

		var sToNodeTitle = oTo.getTitle();
		var sToNodeText = sToNodeTitle ? sToNodeTitle : oTo.getAltText();

		sTitle += "<span class=\"sapSuiteUiCommonsNetworkGraphLineTooltipText\">" + sToNodeText + "</span>";

		$tooltip.html(sTitle);
		$buttons.html("");

		this.getActionButtons().forEach(function (oButton) {
			this._appendActionButton({
				icon: oButton.getIcon(),
				enable: oButton.getEnabled(),
				title: oButton.getTitle(),
				id: oButton.getId(),
				click: function (evt) {
					oButton.firePress({
						buttonElement: evt.target
					});
				}
			}, $buttons);
		}.bind(this));

		$wrapper.show();

		var iTop = oPoint.y - $tooltip.outerHeight() / 2,
			iLeft = oPoint.x - $tooltip.outerWidth() / 2,
			iBottom = iTop + $tooltip.outerHeight(),
			iRight = iLeft + $tooltip.outerWidth();

		fnCheckAndSetBoundaries(oTo, iBottom, iLeft + $wrapper.width());
		// for purposes of displaying arrow we check only right boundaries of tooltip
		// for node setting opacity we use right edge with buttons
		// thats why we call it 3 times
		var bCrossLeft = fnCheckAndSetBoundaries(oFrom, iTop + $tooltip.height(), iLeft),
			bCrossRight = fnCheckAndSetBoundaries(oTo, iBottom, iLeft + $tooltip.outerWidth() + ARROW_SIZE);

		if (oParent._isLayered()) {
			var oTopLeft = {
				x: iLeft,
				y: iTop
			};

			var oTopRight = {
				x: iRight,
				y: iTop
			};

			var oBottomRight = {
				x: iRight,
				y: iBottom
			};

			var oBottomLeft = {
				x: iLeft,
				y: iBottom
			};

			var aCoordinates = this.getCoordinates();

			for (var i = 0; i < aCoordinates.length - 1 && iLines < 2; i++) {
				var oCoordPrev = aCoordinates[i],
					oCoordNext = aCoordinates[i + 1];

				var oPrev = {
					x: oCoordPrev.getX(),
					y: oCoordPrev.getY()
				};

				var oNext = {
					x: oCoordNext.getX(),
					y: oCoordNext.getY()
				};

				var oLine = fnCreateLine(oPrev, oNext);

				var oIntersection = Geometry.getSegmentsIntersection(oLine, fnCreateLine(oTopLeft, oBottomLeft));
				if (oIntersection && !bCrossLeft) {
					fnAppendArrow("sapSuiteUiCommonsNetworkGraphTooltipLeftArrow", {
						top: (oIntersection.y - iTop) - ARROW_SIZE
					});
				}

				oIntersection = Geometry.getSegmentsIntersection(oLine, fnCreateLine(oTopRight, oBottomRight));
				if (oIntersection && !bCrossRight) {
					fnAppendArrow("sapSuiteUiCommonsNetworkGraphTooltipRightArrow", {
						top: (oIntersection.y - iTop) - ARROW_SIZE
					});
				}

				oIntersection = Geometry.getSegmentsIntersection(oLine, fnCreateLine(oBottomLeft, oBottomRight));
				if (oIntersection) {
					fnAppendArrow("sapSuiteUiCommonsNetworkGraphTooltipBottomArrow", {
						left: oIntersection.x - iLeft - ARROW_SIZE
					});
				}

				oIntersection = Geometry.getSegmentsIntersection(oLine, fnCreateLine(oTopLeft, oTopRight));
				if (oIntersection) {
					fnAppendArrow("sapSuiteUiCommonsNetworkGraphTooltipTopArrow", {
						left: oIntersection.x - iLeft - ARROW_SIZE
					});
				}
			}

			$wrapper.css("top", iTop + "px");
			$wrapper.css("left", iLeft + "px");
		}
	};

	Line.prototype._hasVisibleActionButtons = function() {
		return this.getParent().$().find(".sapSuiteUiCommonsNetworkGraphLineButtons").is(":visible");
	};

	Line.prototype._getEnabledActionButtons = function() {
		var aEnabledButtons = [];
		this.getActionButtons().forEach(function(oActionButton){
			if (oActionButton.getEnabled() && oActionButton.getDomRef()) {
				aEnabledButtons.push(oActionButton.getDomRef());
			}
		});
		return aEnabledButtons;
	};


	Line.prototype._setActionButtonFocus = function (oItem, bFocus) {
		var $wrapper = this.getParent().$("divlinebuttons");

		$wrapper.removeClass(this.FOCUS_CLASS);
		$wrapper.find("." + this.FOCUS_CLASS).removeClass(this.FOCUS_CLASS);

		jQuery(oItem).toggleClass(this.FOCUS_CLASS, bFocus);
	};

	Line.prototype._click = function (mArguments) {
		var oParent = this.getParent(),
			oPoint = mArguments.skipConversion
						? ({x : mArguments.clientX, y : mArguments.clientY})
						: (oParent.getCorrectMousePosition({
								x: mArguments.clientX,
								y: mArguments.clientY
							})),
			oOpener = oParent._tooltip._getOpener(this, oPoint), bExecuteDefault;

		oParent._selectLine({
			element: this,
			forceFocus: true,
			preventDeselect: mArguments.ctrlKey
		});

		bExecuteDefault = this.fireEvent("press", {
			opener: oOpener,
			point: oPoint
		}, true);

		if (this.getSelected() && bExecuteDefault) {
			(this.getActionButtons().length === 0) ?
				oParent._tooltip.openDetail({
					item: this,
					opener: oOpener,
					point: oPoint
				}) : this._showActionButtons(oPoint);
		}
	};

	Line.prototype._setFocus = function (bFocus) {
		ElementBase.prototype._setFocus.call(this, bFocus);
		if (bFocus) {
			this._renderFocusWrapper();
		}

		// Apply focus class to text box for blue border
		var oParent = this.getParent();
		if (oParent) {
			var sLineId = this._getLineId();
			var $textBox = oParent.$("line-texts").find('[data-line-id="' + sLineId + '"]');
			if (bFocus) {
				$textBox.addClass(this.FOCUS_CLASS);
			} else {
				$textBox.removeClass(this.FOCUS_CLASS);
			}
		}
	};

	Line.prototype._isEndPosition = function () {
		return ((this.getArrowPosition() === ArrowPosition.End && this.getArrowOrientation() === ArrowOrientation.ParentOf) ||
			(this.getArrowPosition() === ArrowPosition.Start && this.getArrowOrientation() === ArrowOrientation.ChildOf));
	};

	Line.prototype._moveToEnd = function () {
		return this._isEndPosition() ||
			(this.getArrowPosition() === ArrowPosition.Middle && this.getArrowOrientation() === ArrowOrientation.ParentOf);
	};

	Line.prototype._hideShow = function (bCollapse) {
		if (bCollapse) {
			this.$().hide();
			this._bIsHidden = true;
			// Also hide the line text label if it exists
			this._hideShowLineText(true);
		} else if (!this.getToNode()._bIsHidden && !this.getFromNode()._bIsHidden) {
			this.$().show();
			this._bIsHidden = false;
			// Also show the line text label if it exists
			this._hideShowLineText(false);
		}
	};

	/**
	 * Hides or shows the line text label element
	 * @param {boolean} bHide True to hide, false to show
	 * @private
	 */
	Line.prototype._hideShowLineText = function (bHide) {
		// Use the same ID pattern that was set during _renderLineText
		// The text box ID is: this.getId() + "-textbox-middle"
		var sTextBoxId = this.getId() + "-textbox-middle";
		var oTextBox = document.getElementById(sTextBoxId);

		if (oTextBox) {
			oTextBox.style.display = bHide ? "none" : "";
		}
	};

	Line.prototype._shift = function (oPoint) {
		this.getBends().forEach(function (b) {
			b.setX(b.getX() + oPoint.x);
			b.setY(b.getY() + oPoint.y);
		});

		if (this.getSource()) {
			this.setSource({
				x: this.getSource().getX() + oPoint.x,
				y: this.getSource().getY() + oPoint.y
			});
		}

		if (this.getTarget()) {
			this.setTarget({
				x: this.getTarget().getX() + oPoint.x,
				y: this.getTarget().getY() + oPoint.y
			});
		}

		if (this._aNipples) {
			this._aNipples.forEach(function (oNip) {
				oNip.x += oPoint.x;
				oNip.y += oPoint.y;
			});
		}
	};

	Line.prototype._normalizePath = function () {
		var oFromCenter, oToCenter;
		oFromCenter = this.getFromNode().getCenterPosition();
		this.setSource({
			x: oFromCenter.x,
			y: oFromCenter.y
		});
		oToCenter = this.getToNode().getCenterPosition();
		this.setTarget({
			x: oToCenter.x,
			y: oToCenter.y
		});
		this.clearBends();
	};

	Line.prototype._validateLayout = function () {
		return (!this.getSource() || (isFinite(this.getSource().getX()) && isFinite(this.getSource().getY())))
			&& (!this.getTarget() || (isFinite(this.getTarget().getX()) && isFinite(this.getTarget().getY())))
			&& !this.getBends().some(function (oBend) {
				return !isFinite(oBend.getX()) || !isFinite(oBend.getY());
			});
	};

	/* =========================================================== */
	/* Getters, Setters & Private helper methods*/
	/* =========================================================== */
	Line.prototype.setSelected = function (bSelected) {
		var oParent = this.getParent(),
			sFnName = bSelected ? "addClass" : "removeClass";

		this._setStatusColors(bSelected ? "Selected" : "");

		this.setProperty("selected", bSelected, true);
		this.$()[sFnName](this.SELECT_CLASS);

		if (oParent) {
			if (bSelected) {
				oParent._mSelectedLines[this._getLineId()] = this;
			} else {
				this._setStatusColors(""); //sets defined color back, after unselect
				delete oParent._mSelectedLines[this._getLineId()];
			}
		}

		return this;
	};

	Line.prototype.setFrom = function (sFrom) {
		var oParent = this.getParent();
		this.setProperty("from", sFrom, true);
		if (oParent) {
			oParent.invalidate();
		}
		return this;
	};

	Line.prototype.setTo = function (sTo) {
		var oParent = this.getParent();
		this.setProperty("to", sTo, true);
		if (oParent) {
			oParent.invalidate();
		}
		return this;
	};

	Line.prototype._isTopBottom = function () {
		var oParent = this.getParent();
		return oParent && oParent._isTopBottom();
	};

	Line.prototype.getFocusDomRef = function () {
		return this.getDomRef("invisibleWrapper");
	};

	Line.prototype._createSuggestionHelpText = function () {
		var LINE_TITLE_LENGTH = 25;
		var sTitle = this.getTitle() ? (this.getTitle() + " ") : "";

		var sFromNodeTitle = this.getFromNode().getTitle();
		var sFromNodeText = sFromNodeTitle ? sFromNodeTitle : this.getFromNode().getAltText();

		var sToNodeTitle = this.getToNode().getTitle();
		var sToNodeText = sToNodeTitle ? sToNodeTitle : this.getToNode().getAltText();

		return sTitle + "(" + Utils.trimText(sFromNodeText, LINE_TITLE_LENGTH) + " -> "
			+ Utils.trimText(sToNodeText, LINE_TITLE_LENGTH) + ")";
	};

	Line.prototype._isInCollapsedGroup = function () {
		var oFrom = this.getFromNode(),
			oTo = this.getToNode();

		return (oFrom._oGroup === oTo._oGroup) && oFrom._isInCollapsedGroup();
	};

	Line.prototype._isBothMiddleArrow = function () {
		return this.getArrowOrientation() === ArrowOrientation.Both && this.getArrowPosition() === ArrowPosition.Middle;
	};

	Line.prototype._isBothArrow = function () {
		return this.getArrowOrientation() === ArrowOrientation.Both;
	};

	Line.prototype._isOnScreen = function (iLeft, iRight, iTop, iBottom) {
		var aCoordinates = this.getCoordinates(),
			i, bOnScreen;
		for (i = 1; i < aCoordinates.length; i++) {
			bOnScreen = ElementBase._isRectOnScreen(aCoordinates[i - 1].getX(), aCoordinates[i].getX(), aCoordinates[i - 1].getY(),
													aCoordinates[i].getY(), iLeft, iRight, iTop, iBottom);
			if (bOnScreen) {
				return true;
			}
		}
		return false;
	};

	/**
	 * Calculates the total length of the line by summing up all the segment distances.
	 * @returns {number} Total line length in pixels
	 * @private
	 */
	Line.prototype._calculateTotalLineLength = function () {
		var oCoords = this.getCoordinates();
		var fTotalLength = 0;

		if (!oCoords || oCoords.length < 2) {
			return 0;
		}

		// Sum the distance of each line segment
		for (var i = 0; i < oCoords.length - 1; i++) {
			var fSegmentLength = Math.sqrt(
				Math.pow(oCoords[i + 1].getX() - oCoords[i].getX(), 2) +
				Math.pow(oCoords[i + 1].getY() - oCoords[i].getY(), 2)
			);
			fTotalLength += fSegmentLength;
		}

		return fTotalLength;
	};

	/**
	 * Determines if a line is long enough to accommodate two arrows at 44px from each anchor
	 * @param {number} fLineLength - Total length of the line
	 * @returns {boolean} True if line can fit two arrows with proper spacing
	 * @private
	 */
	Line.prototype._canLineFitTwoArrows = function (fLineLength) {
		// Minimum line length calculation:
		// - 44px from source anchor
		// - 44px from target anchor
		// - 20px minimum spacing between arrows
		// Total: 108px minimum
		var fMinLineLength = (MULTIPLE_ARROW_DISTANCE * 2) + 20;

		// Add some buffer for curved/bent lines where the actual path might be longer
		// but the arrow positions could still overlap
		var fSafeLineLength = fMinLineLength + 10; // 118px total

		return fLineLength >= fSafeLineLength;
	};

	Line.prototype._shouldRenderSourceArrow = function () {
		if (!this._hasMultipleDirectedArrows()) {
			return false;
		}

		var oSourceNode = this.getFromNode();
		if (!oSourceNode) {
			return true; // Fallback: show arrow if source node not found
		}

		var aOutgoingLines = oSourceNode.getChildLines();

		// If source node has only one outgoing line, show the arrow
		if (!aOutgoingLines || aOutgoingLines.length <= 1) {
			return true;
		}

		// Filter valid outgoing lines first
		var aValidOutgoingLines = aOutgoingLines.filter(function(oLine) {
			return oLine && oLine.getVisible() && !oLine._isIgnored();
		});

		if (aValidOutgoingLines.length <= 1) {
			return true;
		}

		// Group outgoing lines by their direction/side from the source node
		var oLinesByDirection = this._groupLinesByDirection(aValidOutgoingLines, oSourceNode, "outgoing");

		// Get the direction of this line
		var sThisLineDirection = this._getLineDirection(this, oSourceNode, "outgoing");

		// Get lines going in the same direction as this line
		var aLinesInSameDirection = oLinesByDirection[sThisLineDirection] || [];

		if (aLinesInSameDirection.length <= 1) {
			return true;
		}

		// Sort lines by their ID to ensure consistent ordering
		aLinesInSameDirection.sort(function(a, b) {
			return a._getLineId().localeCompare(b._getLineId());
		});

		// Show arrow only on the first line in the sorted list for this direction
		return aLinesInSameDirection[0] === this;
	};

	/**
	 * Checks if multiple directed arrows feature is enabled at the graph level
	 * @returns {boolean} True if the feature is enabled
	 * @private
	 */
	Line.prototype._hasMultipleDirectedArrows = function () {
		var oParent = this.getParent();
		return oParent && oParent._enableMultipleDirectedArrows === true;
	};

	/**
	 * Groups lines by their direction relative to a node
	 * @param {array} aLines - Array of lines to group
	 * @param {object} oNode - The reference node
	 * @param {string} sType - "outgoing" or "incoming"
	 * @returns {object} Object with direction as key and array of lines as value
	 * @private
	 */
	Line.prototype._groupLinesByDirection = function (aLines, oNode, sType) {
		var oGroupedLines = {
			"right": [],
			"left": [],
			"up": [],
			"down": []
		};

		aLines.forEach(function(oLine) {
			var sDirection = this._getLineDirection(oLine, oNode, sType);
			if (oGroupedLines[sDirection]) {
				oGroupedLines[sDirection].push(oLine);
			}
		}.bind(this));

		return oGroupedLines;
	};

	/**
	 * Determines the direction of a line relative to a node based on connection anchors
	 * @param {object} oLine - The line object
	 * @param {object} oNode - The reference node
	 * @param {string} sType - "outgoing" or "incoming"
	 * @returns {string} Direction: "right", "left", "up", or "down"
	 * @private
	 */
	Line.prototype._getLineDirection = function (oLine, oNode, sType) {
		// Validate inputs
		if (!oLine || !oNode) {
			return "right"; // Default fallback
		}

		var oOtherNode = sType === "outgoing" ? oLine.getToNode() : oLine.getFromNode();
		if (!oOtherNode) {
			return "right"; // Default fallback
		}

		// Use the actual line coordinates (source/target anchors) instead of node centers
		var oSourceCoords = oLine.getSource();
		var oTargetCoords = oLine.getTarget();
		var oNodeCenter = oNode.getCenterPosition();

		// Validate coordinates
		if (!oSourceCoords || !oTargetCoords || !oNodeCenter ||
			typeof oSourceCoords.getX !== 'function' || typeof oSourceCoords.getY !== 'function' ||
			typeof oTargetCoords.getX !== 'function' || typeof oTargetCoords.getY !== 'function' ||
			typeof oNodeCenter.x !== 'number' || typeof oNodeCenter.y !== 'number') {
			return "right"; // Default fallback
		}

		// Get the anchor point coordinates
		var fSourceX = oSourceCoords.getX();
		var fSourceY = oSourceCoords.getY();
		var fTargetX = oTargetCoords.getX();
		var fTargetY = oTargetCoords.getY();

		// Determine which anchor point belongs to our reference node
		var fAnchorX, fAnchorY;
		if (sType === "outgoing") {
			// For outgoing lines, use the source anchor (where line starts from our node)
			fAnchorX = fSourceX;
			fAnchorY = fSourceY;
		} else {
			// For incoming lines, use the target anchor (where line ends at our node)
			fAnchorX = fTargetX;
			fAnchorY = fTargetY;
		}

		// Calculate the direction based on anchor position relative to node center
		var fDeltaX = fAnchorX - oNodeCenter.x;
		var fDeltaY = fAnchorY - oNodeCenter.y;

		// Use threshold to handle edge cases
		var fThreshold = 5.0; // 5px threshold for anchor-based detection
		var fAbsDeltaX = Math.abs(fDeltaX);
		var fAbsDeltaY = Math.abs(fDeltaY);

		// If anchor is very close to center, fall back to target direction
		if (fAbsDeltaX < fThreshold && fAbsDeltaY < fThreshold) {
			// Use direction to other node as fallback
			var oOtherCenter = oOtherNode.getCenterPosition();
			if (oOtherCenter) {
				fDeltaX = oOtherCenter.x - oNodeCenter.x;
				fDeltaY = oOtherCenter.y - oNodeCenter.y;
				fAbsDeltaX = Math.abs(fDeltaX);
				fAbsDeltaY = Math.abs(fDeltaY);
			} else {
				return "right"; // Final fallback
			}
		}

		// Determine direction based on larger delta
		if (fAbsDeltaX > fAbsDeltaY + fThreshold) {
			return fDeltaX > 0 ? "right" : "left";
		} else if (fAbsDeltaY > fAbsDeltaX + fThreshold) {
			return fDeltaY > 0 ? "down" : "up";
		} else {
			// When deltas are nearly equal, prefer horizontal direction for consistency
			return fDeltaX >= 0 ? "right" : "left";
		}
	};

	/**
	 * Finds the optimal segment for placing arrows on bent lines by traveling along the path
	 * @param {string} sDirection - "forward" from source or "backward" from target
	 * @param {number} fDistance - Distance to travel along the line (e.g., 44px)
	 * @returns {object} Segment information with exact position 44px away from anchor
	 * @private
	 */
	Line.prototype._findOptimalArrowSegment = function (sDirection, fDistance) {
		var oCoords = this.getCoordinates(),
			iLastIndex = oCoords.length - 1,
			fTotalDistance = 0,
			fSegmentDistance,
			iSegmentIndex,
			fRemainingDistance,
			i;

		// Threshold to detect if arrow is too close to a vertex/bend (10px)
		var fVertexThreshold = 10;

		if (sDirection === "forward") {
			// Travel from source towards target
			for (i = 0; i < iLastIndex; i++) {
				fSegmentDistance = Math.sqrt(
					Math.pow(oCoords[i + 1].getX() - oCoords[i].getX(), 2) +
					Math.pow(oCoords[i + 1].getY() - oCoords[i].getY(), 2)
				);

				if (fTotalDistance + fSegmentDistance >= fDistance) {
					// Found the segment where 44px distance falls
					fRemainingDistance = fDistance - fTotalDistance;
					iSegmentIndex = i;
					break;
				}
				fTotalDistance += fSegmentDistance;
			}
		} else {
			// Travel from target towards source
			for (i = iLastIndex; i > 0; i--) {
				fSegmentDistance = Math.sqrt(
					Math.pow(oCoords[i].getX() - oCoords[i - 1].getX(), 2) +
					Math.pow(oCoords[i].getY() - oCoords[i - 1].getY(), 2)
				);

				if (fTotalDistance + fSegmentDistance >= fDistance) {
					// Found the segment where 44px distance falls
					fRemainingDistance = fDistance - fTotalDistance;
					iSegmentIndex = i - 1; // Use the segment index format (i to i+1)
					break;
				}
				fTotalDistance += fSegmentDistance;
			}
		}

		// Fallback to first/last segment if distance is too large
		if (typeof iSegmentIndex === "undefined") {
			iSegmentIndex = sDirection === "forward" ? 0 : Math.max(0, iLastIndex - 1);
			fRemainingDistance = sDirection === "forward" ? fDistance : fDistance;
		}

		// Calculate exact position along the segment
		var fSegmentLength = Math.sqrt(
			Math.pow(oCoords[iSegmentIndex + 1].getX() - oCoords[iSegmentIndex].getX(), 2) +
			Math.pow(oCoords[iSegmentIndex + 1].getY() - oCoords[iSegmentIndex].getY(), 2)
		);

		var fRatio = fSegmentLength > 0 ? (fRemainingDistance / fSegmentLength) : 0;
		if (sDirection === "backward") {
			fRatio = 1 - fRatio; // Reverse the ratio for backward direction
		}

		// Check if arrow position is too close to a vertex (bend point)
		var fDistanceToStart = fRatio * fSegmentLength;
		var fDistanceToEnd = (1 - fRatio) * fSegmentLength;
		var fAdjustedSegmentLength;

		// Strategy: When arrow is too close to a bend, prefer moving AWAY from the anchor
		// to avoid overlap with node/port. This means:
		// - For "forward" direction (from source): prefer moving to next segment (away from source)
		// - For "backward" direction (from target): prefer moving to previous segment (away from target)

		if (sDirection === "forward") {
			// Arrow traveling from source: prefer moving forward (away from source) when near bend
			if (fDistanceToEnd < fVertexThreshold && iSegmentIndex + 1 < iLastIndex) {
				// Too close to end of segment - move to next segment (preferred)
				fAdjustedSegmentLength = Math.sqrt(
					Math.pow(oCoords[iSegmentIndex + 2].getX() - oCoords[iSegmentIndex + 1].getX(), 2) +
					Math.pow(oCoords[iSegmentIndex + 2].getY() - oCoords[iSegmentIndex + 1].getY(), 2)
				);

				if (fAdjustedSegmentLength > fVertexThreshold) {
					// Move arrow to start of next segment plus threshold
					iSegmentIndex = iSegmentIndex + 1;
					fRatio = fVertexThreshold / fAdjustedSegmentLength;
					fSegmentLength = fAdjustedSegmentLength;
				} else {
					// Next segment too short, stay on current segment away from vertex
					fRatio = Math.max(0, (fSegmentLength - fVertexThreshold) / fSegmentLength);
				}
			} else if (fDistanceToStart < fVertexThreshold) {
				// Too close to start of segment - only move back if critically close to source anchor
				// This is less preferred as it moves closer to the source node/port
				if (fDistanceToStart < 5 && iSegmentIndex > 0) {
					// Only if extremely close (< 5px) and previous segment exists
					fAdjustedSegmentLength = Math.sqrt(
						Math.pow(oCoords[iSegmentIndex].getX() - oCoords[iSegmentIndex - 1].getX(), 2) +
						Math.pow(oCoords[iSegmentIndex].getY() - oCoords[iSegmentIndex - 1].getY(), 2)
					);

					if (fAdjustedSegmentLength > fVertexThreshold) {
						iSegmentIndex = iSegmentIndex - 1;
						fRatio = (fAdjustedSegmentLength - fVertexThreshold) / fAdjustedSegmentLength;
						fSegmentLength = fAdjustedSegmentLength;
					}
				} else {
					// Stay on current segment, move away from start vertex
					fRatio = Math.min(1, fVertexThreshold / fSegmentLength);
				}
			}
		} else if (sDirection === "backward") {
			// Arrow traveling from target: prefer moving backward (away from target) when near bend
			if (fDistanceToStart < fVertexThreshold && iSegmentIndex > 0) {
				// Too close to start of segment - move to previous segment (preferred)
				fAdjustedSegmentLength = Math.sqrt(
					Math.pow(oCoords[iSegmentIndex].getX() - oCoords[iSegmentIndex - 1].getX(), 2) +
					Math.pow(oCoords[iSegmentIndex].getY() - oCoords[iSegmentIndex - 1].getY(), 2)
				);

				if (fAdjustedSegmentLength > fVertexThreshold) {
					// Move arrow to end of previous segment minus threshold
					iSegmentIndex = iSegmentIndex - 1;
					fRatio = (fAdjustedSegmentLength - fVertexThreshold) / fAdjustedSegmentLength;
					fSegmentLength = fAdjustedSegmentLength;
				} else {
					// Previous segment too short, stay on current segment away from vertex
					fRatio = Math.min(1, fVertexThreshold / fSegmentLength);
				}
			} else if (fDistanceToEnd < fVertexThreshold) {
				// Too close to end of segment - only move forward if critically close to target anchor
				// This is less preferred as it moves closer to the target node/port
				if (fDistanceToEnd < 5 && iSegmentIndex + 1 < iLastIndex) {
					// Only if extremely close (< 5px) and next segment exists
					fAdjustedSegmentLength = Math.sqrt(
						Math.pow(oCoords[iSegmentIndex + 2].getX() - oCoords[iSegmentIndex + 1].getX(), 2) +
						Math.pow(oCoords[iSegmentIndex + 2].getY() - oCoords[iSegmentIndex + 1].getY(), 2)
					);

					if (fAdjustedSegmentLength > fVertexThreshold) {
						iSegmentIndex = iSegmentIndex + 1;
						fRatio = fVertexThreshold / fAdjustedSegmentLength;
						fSegmentLength = fAdjustedSegmentLength;
					}
				} else {
					// Stay on current segment, move away from end vertex
					fRatio = Math.max(0, (fSegmentLength - fVertexThreshold) / fSegmentLength);
				}
			}
		}

		// Calculate the exact coordinates with adjusted position
		var fExactX = oCoords[iSegmentIndex].getX() + (oCoords[iSegmentIndex + 1].getX() - oCoords[iSegmentIndex].getX()) * fRatio;
		var fExactY = oCoords[iSegmentIndex].getY() + (oCoords[iSegmentIndex + 1].getY() - oCoords[iSegmentIndex].getY()) * fRatio;

		return {
			segmentIndex: iSegmentIndex,
			ratio: fRatio,
			center: {x: oCoords[iSegmentIndex].getX(), y: oCoords[iSegmentIndex].getY()},
			apex: {x: oCoords[iSegmentIndex + 1].getX(), y: oCoords[iSegmentIndex + 1].getY()},
			exactPosition: {x: fExactX, y: fExactY}
		};
	};

	return Line;
});
