/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/ui/core/dnd/DragInfo",
	"sap/ui/core/dnd/DropInfo",
	"sap/base/Log",
	"sap/suite/ui/commons/networkgraph/Utils"
], function (DragInfo, DropInfo, Log, Utils) {
	"use strict";

	// constants
	const RESIZE_CONFIG = {
		WIDTH_INCREMENT: 150,
		HEIGHT_INCREMENT: 150,
		PROXIMITY_THRESHOLD: 50, // TODO: update according to figma take node's width /height into consideration
		RESIZE_DEBOUNCE_DELAY: 150,
		// Auto-scroll configuration
		AUTO_SCROLL_THRESHOLD: 50, // Distance from scroller edge to trigger auto-scroll
		AUTO_SCROLL_SPEED: 10, // Pixels to scroll per frame (16ms)
	};

	/**
	 * Minimum position offsets to ensure action buttons remain visible.
	 * LEFT: 60px accounts for line and port
	 * TOP: 40px accounts for top action buttons (-2.25rem ≈ 36px) plus margin
	 */
	const POSITION_CLAMP_OFFSET = {
		LEFT: 60,
		TOP: 40
	};

	// Instance object: Only one will exist
	var instance = null;
	var sDragSessionKey = "networkGraphDragSession";
	var oUtilityFunctions = {
		diff: function (a, b) {
			return Math.abs(a - b);
		},
		clampPosition: function (x, y) {
			/**
			 * Clamps position coordinates to minimum thresholds.
			 * Prevents nodes from being positioned where action buttons would be off-screen.
			 */
			return {
				x: Math.max(POSITION_CLAMP_OFFSET.LEFT, x),
				y: Math.max(POSITION_CLAMP_OFFSET.TOP, y)
			};
		}
	};

	/**
	 * Constructor for DragDropManager.
	 * This class is for internal use only
	 *
	 * @class
	 * Manages drag and drop functionality for network graph components.
	 * This class handles drag start, drag end, drag over, and drop events
	 * for both Graph and Node controls in the network graph library.
	 *
	 * @private
	 */
	function DragDropManager() {
		this.bIsDragging = false;
		this._iWidthResizeDebounceTimeout = null;
		this._iHeightResizeDebounceTimeout = null;
		this._iRequestAnimationFrameId = null;
		this._iLastWidthResizeTime = 0;
		this._iLastHeightResizeTime = 0;
		// Auto-scroll state
		this._iAutoScrollIntervalId = null;
		this._oAutoScrollDirection = { x: 0, y: 0 };
	}

	/**
	 * Debounced function to resize the inner scroller width when dragging near right edge.
	 * Uses debouncing to prevent excessive resize operations during drag operations.
	 *
	 * @param {sap.suite.ui.commons.networkgraph.Graph} oGraph - The graph control
	 * @param {number} incrementBy - The amount in pixels to increment the width
	 * @private
	 */
	DragDropManager.prototype._resizeInnerScrollerWidth = function (oGraph, incrementBy) {
		const currentTime = Date.now();

		// Clear any existing timeout
		if (this._iWidthResizeDebounceTimeout) {
			clearTimeout(this._iWidthResizeDebounceTimeout);
		}

		// If enough time has passed since last resize, execute immediately
		if (currentTime - this._iLastWidthResizeTime > RESIZE_CONFIG.RESIZE_DEBOUNCE_DELAY) {
			this._executeWidthResize(oGraph, incrementBy);
			this._iLastWidthResizeTime = currentTime;
		} else {
			// Otherwise, debounce the call
			this._iWidthResizeDebounceTimeout = setTimeout(() => {
				this._executeWidthResize(oGraph, incrementBy);
				this._iLastWidthResizeTime = Date.now();
				this._iWidthResizeDebounceTimeout = null;
			}, RESIZE_CONFIG.RESIZE_DEBOUNCE_DELAY);
		}
	};

	/**
	 * Executes the actual width resize in the DOM.
	 * Forces a reflow and updates the width-related CSS properties of the inner scroller.
	 *
	 * @param {sap.suite.ui.commons.networkgraph.Graph} oGraph - The graph control
	 * @param {number} incrementBy - The amount in pixels to increment the width
	 * @private
	 */
	DragDropManager.prototype._executeWidthResize = function (oGraph, incrementBy) {
		// Guard check: Ensure graph and css for innerscroller exist before proceeding
		if (!oGraph || !oGraph._$innerscroller || !oGraph._$innerscroller.css) {
			return;
		}

		/**
		 * Force a reflow to get the most current width
		 * When you read a calculated property like clientHeight, offsetWidth etc.,
		 * the browser has to pause the JavaScript code and reflow the page so it can return an accurate number.”
		 **/
		oGraph._$innerscroller[0].offsetWidth;

		const currentWidth = parseFloat(oGraph._$innerscroller.css("width")) ||
			oGraph._$innerscroller[0].getBoundingClientRect().width;
		const newWidth = currentWidth + incrementBy;

		oGraph._$innerscroller[0].style.setProperty("width", newWidth + "px");
		oGraph._$innerscroller[0].style.setProperty("min-width", newWidth + "px");
		oGraph._$innerscroller[0].style.setProperty("max-width", "none");
	};

	/**
	 * Debounced function to resize the inner scroller height when dragging near bottom edge.
	 * Uses debouncing to prevent excessive resize operations during drag operations.
	 *
	 * @param {sap.suite.ui.commons.networkgraph.Graph} oGraph - The graph control
	 * @param {number} incrementBy - The amount in pixels to increment the height
	 * @private
	 */
	DragDropManager.prototype._resizeInnerScrollerHeight = function (oGraph, incrementBy) {
		const currentTime = Date.now();

		// Clear any existing timeout
		if (this._iHeightResizeDebounceTimeout) {
			clearTimeout(this._iHeightResizeDebounceTimeout);
		}

		// If enough time has passed since last resize, execute immediately
		if (currentTime - this._iLastHeightResizeTime > RESIZE_CONFIG.RESIZE_DEBOUNCE_DELAY) {
			this._executeHeightResize(oGraph, incrementBy);
			this._iLastHeightResizeTime = currentTime;
		} else {
			// Otherwise, debounce the call
			this._iHeightResizeDebounceTimeout = setTimeout(() => {
				this._executeHeightResize(oGraph, incrementBy);
				this._iLastHeightResizeTime = Date.now();
				this._iHeightResizeDebounceTimeout = null;
			}, RESIZE_CONFIG.RESIZE_DEBOUNCE_DELAY);
		}
	};

	/**
	 * Executes the actual height resize in the DOM.
	 * Forces a reflow and updates the height-related CSS properties of the inner scroller.
	 *
	 * @param {sap.suite.ui.commons.networkgraph.Graph} oGraph - The graph control
	 * @param {number} incrementBy - The amount in pixels to increment the height
	 * @private
	 */
	DragDropManager.prototype._executeHeightResize = function (oGraph, incrementBy) {
		// Guard check: Ensure graph and css for innerscroller exist before proceeding
		if (!oGraph || !oGraph._$innerscroller || !oGraph._$innerscroller.css) {
			return;
		}

		// Force a reflow to get the most current height
		oGraph._$innerscroller[0].offsetHeight;

		const currentHeight = parseFloat(oGraph._$innerscroller.css("height")) ||
			oGraph._$innerscroller[0].getBoundingClientRect().height;
		const newHeight = currentHeight + incrementBy;

		oGraph._$innerscroller[0].style.setProperty("height", newHeight + "px");
		oGraph._$innerscroller[0].style.setProperty("min-height", newHeight + "px");
		oGraph._$innerscroller[0].style.setProperty("max-height", "none");
	};

	/**
	 * Checks if the scroller can scroll in the given direction.
	 * 
	 * @param {HTMLElement} scrollerElement - The scroller DOM element
	 * @param {string} direction - Direction to check: 'up', 'down', 'left', 'right'
	 * @returns {boolean} True if scrolling is possible in that direction
	 * @private
	 */
	DragDropManager.prototype._canScroll = function (scrollerElement, direction) {
		if (!scrollerElement) {
			return false;
		}

		switch (direction) {
			case 'up':
				return scrollerElement.scrollTop > 0;
			case 'down':
				return scrollerElement.scrollTop < (scrollerElement.scrollHeight - scrollerElement.clientHeight);
			case 'left':
				return scrollerElement.scrollLeft > 0;
			case 'right':
				return scrollerElement.scrollLeft < (scrollerElement.scrollWidth - scrollerElement.clientWidth);
			default:
				return false;
		}
	};

	/**
	 * Starts or updates auto-scrolling of the viewport.
	 * 
	 * @param {sap.suite.ui.commons.networkgraph.Graph} oGraph - The graph control
	 * @param {number} scrollX - Horizontal scroll direction (-1: left, 0: none, 1: right)
	 * @param {number} scrollY - Vertical scroll direction (-1: up, 0: none, 1: down)
	 * @private
	 */
	DragDropManager.prototype._startAutoScroll = function (oGraph, scrollX, scrollY) {
		// Update scroll direction
		this._oAutoScrollDirection = { x: scrollX, y: scrollY };

		// If already scrolling, direction is updated, no need to restart interval
		if (this._iAutoScrollIntervalId) {
			return;
		}

		// Start auto-scroll loop at ~60fps
		this._iAutoScrollIntervalId = setInterval(() => {
			if (!this.bIsDragging) {
				this._stopAutoScroll();
				return;
			}

			const scrollerElement = oGraph.$scroller?.[0];
			if (!scrollerElement) {
				this._stopAutoScroll();
				return;
			}

			// Apply scrolling
			if (this._oAutoScrollDirection.x !== 0) {
				scrollerElement.scrollLeft += this._oAutoScrollDirection.x * RESIZE_CONFIG.AUTO_SCROLL_SPEED;
			}
			if (this._oAutoScrollDirection.y !== 0) {
				scrollerElement.scrollTop += this._oAutoScrollDirection.y * RESIZE_CONFIG.AUTO_SCROLL_SPEED;
			}
		}, 16); // ~60fps
	};

	/**
	 * Stops auto-scrolling.
	 * @private
	 */
	DragDropManager.prototype._stopAutoScroll = function () {
		if (this._iAutoScrollIntervalId) {
			clearInterval(this._iAutoScrollIntervalId);
			this._iAutoScrollIntervalId = null;
		}
		this._oAutoScrollDirection = { x: 0, y: 0 };
	};

	/**
	 * Validates if the given control is supported for drag and drop operations.
	 * Checks if the control is a valid Graph or Node instance.
	 *
	 * @param {object} oControl - The control to validate
	 * @returns {boolean} True if the control is eligible for drag and drop, otherwise false
	 * @private
	 */
	DragDropManager.prototype.isValidControl = function (oControl) {
		if (!oControl || typeof oControl !== 'object') {
			return false;
		}

		// Check if it's an empty object
		if (Object.keys(oControl).length === 0 && oControl.constructor === Object) {
			return false;
		}

		// Check if it has the required isA method
		if (typeof oControl.isA !== 'function') {
			return false;
		}

		return oControl.isA("sap.suite.ui.commons.networkgraph.Graph") ||
			oControl.isA("sap.suite.ui.commons.networkgraph.Node");
	}

	/**
	 * Handles the drag start event for nodes.
	 *
	 * @param {sap.ui.base.Event} oEvent - The drag start event handler
	 * @private
	 */
	DragDropManager.prototype._handleDragStart = function (oEvent) {
		let dragSession = oEvent.getParameter("dragSession");
		let browserEvent = oEvent.getParameter("browserEvent");
		let oGraph = oEvent.getParameter("target")?.getParent();
		let oNode = oEvent.getParameter("target");
		let boundingRectScroller = oGraph?.$scroller?.[0]?.getBoundingClientRect() || { x: 0, y: 0 };
		let boundingRectInnerScroller = oGraph?._$innerscroller?.[0]?.getBoundingClientRect() || { x: 0, y: 0 };

		// Capture initial scroll positions
		let scrollLeft = oGraph?._$innerscroller?.[0]?.scrollLeft || 0;
		let scrollTop = oGraph?._$innerscroller?.[0]?.scrollTop || 0;
		this.bIsDragging = true;

		// Stop any existing auto-scroll from previous drag operations
		this._stopAutoScroll();

		// Create custom drag image that includes the border
		this._oDragImageNode = Utils.createCustomDragImage(oNode, browserEvent);

		dragSession.setComplexData(sDragSessionKey, {
			// Mouse cursor position when drag starts (in viewport coordinates)
			cursorX: browserEvent.clientX,
			cursorY: browserEvent.clientY,
			// Position of the inner scroller container when drag starts (relative to viewport)
			// This changes if the graph content is scrolled during drag
			innerScrollerX: boundingRectInnerScroller.x,
			innerScrollerY: boundingRectInnerScroller.y,
			// Position of the outer scroller container when drag starts (relative to viewport)
			// This is usually stable but included for completeness
			scrollerX: boundingRectScroller.x,
			scrollerY: boundingRectScroller.y,
			// How much the graph content was already scrolled when drag starts
			// Used to maintain scroll position after drop to prevent viewport jumping
			initialScrollLeft: scrollLeft,
			initialScrollTop: scrollTop
		});
		this._iRequestAnimationFrameId && cancelAnimationFrame(this._iRequestAnimationFrameId);
	}

	/**
	 * Handles the drag end event for nodes.
	 *
	 * @param {sap.ui.base.Event} oEvent - The drag End event handler
	 * @private
	 */
	DragDropManager.prototype._handleDragEnd = function (oEvent) {
		if (!this._validateEvent(oEvent)) {
			return;
		}

		// Stop auto-scrolling when drag ends
		this._stopAutoScroll();

		// Clean up the drag image node
		if (this._oDragImageNode && this._oDragImageNode.parentNode) {
			this._oDragImageNode.parentNode.removeChild(this._oDragImageNode);
			this._oDragImageNode = null;
		}
	};

	/**
	 * Handles the drag over event for nodes.
	 *
	 * @param {sap.ui.base.Event} oEvent - The drag over event handler
	 * @private
	 */
	DragDropManager.prototype._handleDragOver = function (oEvent) {
		if (!this.bIsDragging) {
			// not dragging - skip dragover handling
			return;
		}
		if (!this._validateEvent(oEvent)) {
			return;
		}

		const oGraph = oEvent.getParameter("target");
		const oBrowserEvent = oEvent.getParameter("browserEvent");
		const oScrollerElement = oGraph?.$scroller?.[0];
		const oInnerScrollerElement = oGraph?._$innerscroller?.[0];

		if (!oScrollerElement || !oInnerScrollerElement) {
			return;
		}

		// Get cursor position
		const iCursorX = oBrowserEvent?.clientX;
		const iCursorY = oBrowserEvent?.clientY;

		// Get scroller's bounding rect to know viewport edges
		const oScrollerRect = oScrollerElement.getBoundingClientRect();

		// ========================================
		// AUTO-SCROLL LOGIC (Decision Tree)
		// ========================================

		let scrollX = 0;
		let scrollY = 0;

		// Check horizontal auto-scroll
		const distanceFromScrollerLeft = iCursorX - oScrollerRect.left;
		const distanceFromScrollerRight = oScrollerRect.right - iCursorX;

		if (distanceFromScrollerRight <= RESIZE_CONFIG.AUTO_SCROLL_THRESHOLD &&
			this._canScroll(oScrollerElement, 'right')) {
			scrollX = 1; // Scroll right
		} else if (distanceFromScrollerLeft <= RESIZE_CONFIG.AUTO_SCROLL_THRESHOLD &&
			this._canScroll(oScrollerElement, 'left')) {
			scrollX = -1; // Scroll left
		}

		// Check vertical auto-scroll
		const distanceFromScrollerTop = iCursorY - oScrollerRect.top;
		const distanceFromScrollerBottom = oScrollerRect.bottom - iCursorY;

		if (distanceFromScrollerBottom <= RESIZE_CONFIG.AUTO_SCROLL_THRESHOLD &&
			this._canScroll(oScrollerElement, 'down')) {
			scrollY = 1; // Scroll down
		} else if (distanceFromScrollerTop <= RESIZE_CONFIG.AUTO_SCROLL_THRESHOLD &&
			this._canScroll(oScrollerElement, 'up')) {
			scrollY = -1; // Scroll up
		}

		// Start/update/stop auto-scroll based on calculated direction
		if (scrollX !== 0 || scrollY !== 0) {
			this._startAutoScroll(oGraph, scrollX, scrollY);
		} else {
			this._stopAutoScroll();
		}

		// Get dimensions and scroll positions
		const iScrollerWidth = oScrollerElement.clientWidth;
		const iScrollerHeight = oScrollerElement.clientHeight;
		const iInnerScrollerWidth = oInnerScrollerElement.scrollWidth || oInnerScrollerElement.clientWidth;
		const iInnerScrollerHeight = oInnerScrollerElement.scrollHeight || oInnerScrollerElement.clientHeight;
		const iScrollLeft = oScrollerElement.scrollLeft;
		const iScrollTop = oScrollerElement.scrollTop;

		// Check proximity to right edge for width expansion
		// TODO: Consider adding a maximum width/height limit to prevent excessive growth
		// TODO: Consider adding factor of cursor position being at the end of the screen
		const bShouldExpandWidth = this._shouldExpandDimension(
			iInnerScrollerWidth,
			iScrollerWidth,
			iScrollLeft,
			iCursorX - oScrollerRect.left,  // Cursor X relative to scroller
			RESIZE_CONFIG.PROXIMITY_THRESHOLD
		);

		if (bShouldExpandWidth) {
			this._resizeInnerScrollerWidth(oGraph, RESIZE_CONFIG.WIDTH_INCREMENT);
		}

		// Check proximity to bottom edge for height expansion
		const bShouldExpandHeight = this._shouldExpandDimension(
			iInnerScrollerHeight,
			iScrollerHeight,
			iScrollTop,
			iCursorY - oScrollerRect.top,  // Cursor Y relative to scroller
			RESIZE_CONFIG.PROXIMITY_THRESHOLD
		);

		if (bShouldExpandHeight) {
			this._resizeInnerScrollerHeight(oGraph, RESIZE_CONFIG.HEIGHT_INCREMENT);
		}
	};

	/**
	 * Determines if the inner scroller dimension should be expanded based on cursor proximity to viewport edge
	 * and available content space.
	 * Handles two cases:
	 * Case 1: InnerScroller smaller than Scroller (not scrolled) - cursor must be near viewport edge AND near innerScroller's edge
	 * Case 2: InnerScroller larger than Scroller (scrolled) - cursor must be near viewport edge AND running out of content
	 *
	 * @param {number} iInnerDimension - The total dimension of inner scroller (width or height)
	 * @param {number} iScrollerDimension - The viewport dimension of scroller (width or height)
	 * @param {number} iScrollPosition - Current scroll position (scrollLeft or scrollTop)
	 * @param {number} iCursorPosition - Cursor position relative to scroller (clientX/Y - scrollerRect.left/top)
	 * @param {number} iProximityThreshold - Distance from edge to trigger expansion
	 * @returns {boolean} True if should expand, false otherwise
	 * @private
	 */
	DragDropManager.prototype._shouldExpandDimension = function (iInnerDimension, iScrollerDimension, iScrollPosition, iCursorPosition, iProximityThreshold) {
		// Case 1: InnerScroller is smaller than or equal to Scroller (not scrollable or minimal scroll)
		// In this case, cursor proximity is checked against innerScroller's edge, not viewport edge
		if (iInnerDimension <= iScrollerDimension) {
			// Check if cursor is near the innerScroller's content edge
			const bCursorNearInnerScrollerEdge = iCursorPosition >= (iInnerDimension - iProximityThreshold);
			return bCursorNearInnerScrollerEdge;
		}

		// Case 2: InnerScroller is larger than Scroller (content is scrollable)
		// Check if cursor is near viewport edge AND we're running out of content
		const bCursorNearViewportEdge = iCursorPosition >= (iScrollerDimension - iProximityThreshold);

		if (!bCursorNearViewportEdge) {
			// Cursor is not near the viewport edge, no need to expand
			return false;
		}

		// Cursor is near viewport edge, now check if we're running out of content
		const iVisibleEdgePosition = iScrollPosition + iScrollerDimension;
		const iContentEdgeThreshold = iInnerDimension - iProximityThreshold;

		return iVisibleEdgePosition >= iContentEdgeThreshold;
	};

	/**
	 * Handles the drop event for node elements.
	 * Calculates the new position of the node based on cursor movement and scroll changes,
	 * then fires the nodeDropped event with the updated coordinates.
	 *
	 * @param {sap.ui.base.Event} oEvent - The drop event
	 * @param {object} dropData - The extracted drop data containing drag information
	 * @param {sap.suite.ui.commons.networkgraph.Graph} oGraph - The graph control
	 * @private
	 */
	DragDropManager.prototype._handleNodeDrop = function (oEvent, dropData, oGraph) {
		let dragSessionComplexData = dropData.dragSessionComplexData,
			deltaX = dropData.clientX - (dragSessionComplexData?.cursorX || 0), // Calculate the change in X position for the node being dragged in viewport
			deltaY = dropData.clientY - (dragSessionComplexData?.cursorY || 0), // Calculate the change in Y position for the node being dragged in viewport
			prevInnerScrollerX = dragSessionComplexData?.innerScrollerX || 0, // Previous X position of the inner scroller at drag start
			prevInnerScrollerY = dragSessionComplexData?.innerScrollerY || 0; // Previous Y position of the inner scroller at drag start

		let boundingRectInnerScroller = oGraph?._$innerscroller[0]?.getBoundingClientRect() || { x: 0, y: 0 },
			deltaInnerScrollerX = oUtilityFunctions.diff(prevInnerScrollerX, boundingRectInnerScroller.x || 0), // Change in X position of the inner scroller during drag, to track scrolling
			deltaInnerScrollerY = oUtilityFunctions.diff(prevInnerScrollerY, boundingRectInnerScroller.y || 0), // Change in Y position of the inner scroller during drag, to track scrolling
			deltaSignatureX = prevInnerScrollerX >= boundingRectInnerScroller.x ? 1 : -1, // Determine scroll direction in X axis
			deltaSignatureY = prevInnerScrollerY >= boundingRectInnerScroller.y ? 1 : -1; // Determine scroll direction in Y axis

		let newX = dropData.draggedControl.getX() + deltaX + (deltaSignatureX * deltaInnerScrollerX),
			newY = dropData.draggedControl.getY() + deltaY + (deltaSignatureY * deltaInnerScrollerY);

		// Clamp position to prevent nodes from going off-screen (especially for action buttons)
		var oClampedPosition = oUtilityFunctions.clampPosition(newX, newY);

		// Store current scroll position before any DOM changes
		let currentScrollLeft = oGraph?.$scroller?.[0]?.scrollLeft || 0;
		let currentScrollTop = oGraph?.$scroller?.[0]?.scrollTop || 0;

		oGraph.fireEvent("nodeDropped", {
			...oEvent.getParameters(),
			node: dropData.draggedControl,
			newX: oClampedPosition.x,
			newY: oClampedPosition.y
		});
		// Preserve scroll position after event
		Utils.preserveScrollPosition(oGraph, currentScrollLeft, currentScrollTop, 0);
	};

	/**
	 * Handles the drop event for external items (non-node elements).
	 * Calculates the drop position relative to the inner scroller and fires the nodeDropped event.
	 *
	 * @param {sap.ui.base.Event} oEvent - The drop event
	 * @param {object} dropData - The extracted drop data containing drag information
	 * @param {sap.suite.ui.commons.networkgraph.Graph} oGraph - The graph control
	 * @private
	 */
	DragDropManager.prototype._handleExternalItemDrop = function (oEvent, dropData, oGraph) {
		let boundingRect = oGraph?._$innerscroller[0]?.getBoundingClientRect() || { left: 0, top: 0 },
			x = dropData.clientX - boundingRect.left,
			y = dropData.clientY - boundingRect.top;

		// Clamp position to prevent nodes from going off-screen (especially for action buttons)
		var oClampedPosition = oUtilityFunctions.clampPosition(x, y);

		// Store current scroll position before any DOM changes
		let currentScrollLeft = oGraph?.$scroller?.[0]?.scrollLeft || 0;
		let currentScrollTop = oGraph?.$scroller?.[0]?.scrollTop || 0;

		oGraph.fireEvent("nodeDropped", {
			...oEvent.getParameters(),
			node: dropData.draggedControl,
			newX: oClampedPosition.x,
			newY: oClampedPosition.y
		});

		// Preserve scroll position after event
		Utils.preserveScrollPosition(oGraph, currentScrollLeft, currentScrollTop, 0);
	};

	/**
	 * Validates if the event contains required browser event data and if DnD is enabled.
	 * Logs a warning if validation fails.
	 *
	 * @param {sap.ui.base.Event} oEvent - The event to validate
	 * @param {sap.suite.ui.commons.networkgraph.Graph} [oGraph] - Optional graph control to check if DnD is enabled
	 * @returns {boolean} True if the event is valid, false otherwise
	 * @private
	 */
	DragDropManager.prototype._validateEvent = function (oEvent, oGraph = undefined) {
		let oBrowserEvent = oEvent.getParameter("browserEvent") || undefined;
		if (!oBrowserEvent || (!!oGraph && !oGraph._isDnDEnabled())) {
			Log.warning("No native browser event available in drop event.");
			return false;
		}
		return true;
	};

	/**
	 * Checks if the given control is a Node type.
	 *
	 * @param {object} [control={}] - The control to check
	 * @returns {boolean} True if the control is a Node, false otherwise
	 * @private
	 */
	DragDropManager.prototype._isTypeNode = function (control = {}) {
		return control?.isA && control.isA("sap.suite.ui.commons.networkgraph.Node");
	};

	/**
	 * Extracts and returns the relevant drop data from the event.
	 * Includes dragged control, cursor position, and drag session data.
	 *
	 * @param {sap.ui.base.Event} oEvent - The drop event
	 * @param {sap.suite.ui.commons.networkgraph.Graph} oGraph - The graph control
	 * @returns {object} Object containing draggedControl, clientX, clientY, and dragSessionComplexData
	 * @private
	 */
	DragDropManager.prototype._extractDropData = function (oEvent, oGraph) {
		let oBrowserEvent = oEvent.getParameter("browserEvent") || {};
		return {
			draggedControl: oEvent.getParameter("draggedControl") || {},
			clientX: oBrowserEvent.clientX || 0,
			clientY: oBrowserEvent.clientY || 0,
			dragSessionComplexData: oEvent.getParameter("dragSession")?.getComplexData(sDragSessionKey) || {},
		};
	};

	/**
	 * Handles the drop event.
	 *
	 * @param {sap.ui.base.Event} oEvent - The drop event
	 * @param {sap.suite.ui.commons.networkgraph.Graph} oGraph - The graph control
	 * @private
	 */
	DragDropManager.prototype._handleDrop = function (oEvent, oGraph) {
		this.bIsDragging = false;
		if (!this._validateEvent(oEvent, oGraph)) {
			return;
		}

		let dropData = this._extractDropData(oEvent, oGraph);
		if (this._isTypeNode(dropData.draggedControl)) {
			this._handleNodeDrop(oEvent, dropData, oGraph);
		} else {
			this._handleExternalItemDrop(oEvent, dropData, oGraph);
		}
	};

	/**
	 * Injects drag and drop configuration into the given control.
	 * Adds appropriate DragInfo and DropInfo based on control type (Graph or Node).
	 *
	 * @param {sap.ui.core.Control} oControl - The control to inject DnD functionality into
	 * @throws {Error} If the control is not valid or not supported for DnD
	 * @public
	 */
	DragDropManager.prototype.injectDnD = function (oControl) {
		if (!this.isValidControl(oControl)) {
			throw new Error("DragDropManager: Control is not valid for DnD");
		}
		var sControlType = oControl.getMetadata().getName();
		switch (sControlType) {
			case "sap.suite.ui.commons.networkgraph.Graph":
				var dragInfo = new DragInfo({
					sourceAggregation: "nodes",
					dragEnd: this._handleDragEnd.bind(this)
				});
				var dropInfo = new DropInfo({
					dropPosition: "On",
					drop: function (oEvent) {
						this._handleDrop(oEvent, oControl);
					}.bind(this),
					dragOver: this._handleDragOver.bind(this),
					dragEnter: function (oEvent) {
						oEvent.getParameter("dragSession").setIndicatorConfig({
							display: "none"
						});
					}
				});

				oControl.addDragDropConfig(dragInfo);
				oControl.addDragDropConfig(dropInfo);
				break;
			case "sap.suite.ui.commons.networkgraph.Node":
				var dragInfo = new DragInfo({
					dragStart: this._handleDragStart.bind(this),
				});
				oControl.addDragDropConfig(dragInfo);
				break;
			default:
				throw new Error("DragDropManager: Control type " + sControlType + " is not supported");
		}
	};

	// Remove DnD config
	DragDropManager.prototype.removeDnD = function (oControl) {
		if (!this.isValidControl(oControl)) {
			throw new Error("DragDropManager: Control is not valid for DnD");
		}
		// Check if control has any drag drop configurations
		if (!oControl.getDragDropConfig || oControl.getDragDropConfig().length === 0) {
			return true; // Not an error, just nothing to remove
		}

		oControl?.destroyDragDropConfig();
	};

	// Exported singleton object - instantiate on first access
	if (!instance) {
		instance = new DragDropManager();
	}

	return instance;
}, /* bExport= */true);
