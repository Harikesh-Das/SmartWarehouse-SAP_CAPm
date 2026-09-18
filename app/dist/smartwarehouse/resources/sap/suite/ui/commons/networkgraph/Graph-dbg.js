/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"sap/suite/ui/commons/library",
	"sap/ui/thirdparty/jquery",
	"sap/ui/core/Control",
	"./SvgBase",
	"./Node",
	"./Line",
	"./Group",
	"./layout/LayeredLayout",
	"./Tooltip",
	"sap/ui/model/json/JSONModel",
	"sap/m/SuggestionItem",
	"./Utils",
	"sap/m/Label",
	"sap/m/OverflowToolbar",
	"sap/m/OverflowToolbarButton",
	"sap/m/SearchField",
	"sap/m/ToolbarSpacer",
	"sap/ui/core/CustomData",
	"sap/ui/model/Filter",
	"sap/m/OverflowToolbarLayoutData",
	"./KeyboardNavigator",
	"sap/base/Log",
	"sap/ui/performance/Measurement",
	"sap/base/security/encodeXML",
	"sap/m/ToggleButton",
	"sap/m/BusyIndicator",
	"sap/m/library",
	"sap/m/IllustratedMessage",
	"sap/m/IllustratedMessageType",
	"sap/suite/ui/commons/util/FullScreenUtil",
	"sap/ui/core/InvisibleMessage",
	"sap/ui/core/library",
	"sap/ui/core/Core",
	"sap/ui/core/Lib",
	"sap/ui/core/Element",
	"sap/base/i18n/Localization",
	"sap/ui/core/RenderManager",
	"sap/ui/core/Theming",
	'sap/ui/core/InvisibleText',
	"./GraphRenderer",
	"./util/DragDropManager",
	"./util/PortManager",
	"sap/ui/core/IconPool"
], function (
	library,
	jQuery,
	Control,
	SvgBase,
	Node,
	Line,
	Group,
	LayeredLayout,
	Tooltip,
	JSONModel,
	SuggestionItem,
	Utils,
	Label,
	OverflowToolbar,
	OverflowToolbarButton,
	SearchField,
	ToolbarSpacer,
	CustomData,
	Filter,
	OverflowToolbarLayoutData,
	KeyboardNavigator,
	Log,
	Measurement,
	encodeXML,
	ToggleButton,
	BusyIndicator,
	MobileLibrary,
	IllustratedMessage,
	IllustratedMessageType,
	FullScreenUtil,
	InvisibleMessage,
	coreLibrary,
	Core,
	CoreLib,
	Element,
	Localization,
	RenderManager,
	Theming,
	InvisibleText,
	GraphRenderer,
	DragDropManager,
	PortManager,
	IconPool
) {
	"use strict";

	// enums
	var ButtonType = MobileLibrary.ButtonType,
		Orientation = library.networkgraph.Orientation,
		LayoutRenderType = library.networkgraph.LayoutRenderType,
		RenderType = library.networkgraph.RenderType,
		SemanticColorType = library.SemanticColorType,
		NodePorts = library.networkgraph.NodePorts;

	var AGG_NODES = "nodes",
		AGG_LINES = "lines",
		AGG_GROUPS = "groups";

	var ZOOM_MILESTONES = [0.05, 0.1, 0.25, 0.33, 0.50, 0.67, 0.75, 0.80, 0.90, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5],
		DEFAULT_ZOOM_MILESTONE = 1,
		ZOOM_OUT_RATING = 0.4,
		SUGGESTION_ITEMS_LIMIT = 100,
		MOVING_THRESHOLD = 20;

	var SUGGESTIONS = {
		Group: "group",
		Node: "node",
		Line: "line",
		IsLastKey: "islast",
		TypeKey: "type"
	};

	var StatusType = Object.freeze({
		Node: "Node",
		Line: "Line",
		Group: "Group"
	});

	var oResourceBundle = CoreLib.getResourceBundleFor("sap.suite.ui.commons");
	var InvisibleMessageMode = coreLibrary.InvisibleMessageMode;
	/**
	 * Constructor for a new Graph.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * The network graph control allows you to display data as a network of nodes connected by lines.
	 * The nodes can be circular or rectangular and can be joined into groups. You can define custom attributes for
	 * nodes and groups of nodes as well as apply layout algorithms that define the graph's appearance.
	 *
	 * @extends sap.suite.ui.commons.networkgraph.SvgBase
	 *
	 * @constructor
	 * @public
	 * @since 1.50
	 * @alias sap.suite.ui.commons.networkgraph.Graph
	 * @see {@link topic:b5649c8de7f74739b66747dcc9356d0b Network Graph}
	 * @see {@link fiori:https://experience.sap.com/fiori-design-web/network-graph/ Network Graph}
	 */
	var Graph = SvgBase.extend("sap.suite.ui.commons.networkgraph.Graph", {
		metadata: {
			library: "sap.suite.ui.commons",
			dnd: { draggable: false, droppable: true },
			properties: {
				/**
				 * The height of the graph. If this property is set to 'auto', the network graph will be resized to fit the height of its content, regardless of the height of the parent control.
				 */
				height: {
					type: "sap.ui.core.CSSSize", group: "Appearance", defaultValue: "100%"
				},
				/**
				 * The width of the graph. If this property is set to 'auto', the network graph will be resized to fit the width of its content, regardless of the width of the parent control.
				 */
				width: {
					type: "sap.ui.core.CSSSize", group: "Appearance", defaultValue: "100%"
				},
				/**
				 * Orientation of the graph flow. This property is used by layout algorithms.
				 */
				orientation: {
					type: "sap.suite.ui.commons.networkgraph.Orientation",
					group: "Behavior",
					defaultValue: Orientation.LeftRight
				},
				/**
				 * If this property is set to <code>false</code>, zoom buttons are hidden, and the mouse wheel can be used for scrolling only.
				 */
				enableZoom: {
					type: "boolean", group: "Behavior", defaultValue: true
				},
				/**
				 * If this property is set to <code>false</code>, zooming in or out using the mouse wheel is available only when the Ctrl key is pressed.
				 */
				enableWheelZoom: {
					type: "boolean", group: "Behavior", defaultValue: true
				},
				/**
				 * An image to be rendered on the background.
				 */
				backgroundImage: {
					type: "sap.ui.core.URI", group: "Appearance", defaultValue: null
				},
				/**
				 * Background color.
				 */
				backgroundColor: {
					type: "sap.suite.ui.commons.networkgraph.BackgroundColor",
					group: "Appearance",
					defaultValue: "White"
				},
				/**
				 * Nodes rendering type. For optimal performance and usability, it is recommended that you use HTML whenever possible.
				 */
				renderType: {
					type: "sap.suite.ui.commons.networkgraph.RenderType",
					group: "Appearance",
					defaultValue: RenderType.Html
				},
				/**
				 * Set this property to <code>true</code> if you want to notify the user that no data has been loaded. <br> There is no internal check for data received,
				 * so we recommend that you make sure you set it correctly when there is no data received, not just when the
				 * application is waiting for data to be retrieved.
				 */
				noData: {
					type: "boolean", group: "Behavior", defaultValue: false
				},
				/**
				 * Text displayed when no data is set. <br> This property takes effect only when the <code>noData</code> property is set to <code>true</code>.
				 */
				noDataText: {
					type: "string", group: "Behavior", defaultValue: ""
				},
				/**
				 * Set this property to <code>true</code> to display a loading indicator while the data loads.
				 * @public
				 * @since 1.144
				 */
				loading: {
					type: "boolean", group: "Behavior", defaultValue: false
				},
				/**
				 * Text that is displayed when the loading is set. <br> This property takes effect only when the <code>loading</code> property is set to <code>true</code>.
				 * @public
				 * @since 1.144
				 */
				loadingText: {
					type: "string", group: "Behavior", defaultValue: ""
				},
				/**
				 * Adds delay in wheel scrolling to make zooming smooth.
				 * Only works when enableWheelZoom is set to true or 'ctrl' key is pressed while wheel scrolling.
				 * Add delay in milliseconds.
				 *
				 * @private
				 */
				_smoothWheelZoom: {
					type: "int", group: "Behavior", defaultValue: 125, visibility: "hidden"
				},
				/**
				 * Enables the drag and drop of nodes. This property is ignored if the layout property is not set to noop.
				 * If set to <code>true</code>, nodes can be dragged and dropped within the graph.
				 * Note: Drag and drop functionality is only available for nodes. Groups cannot be dragged and dropped, even when NoopLayout is used and enableDragAndDrop is set to true.
				 * @public
				 * @since 1.144
				 */
				enableDragAndDrop: {
					type: "boolean", group: "Behavior", defaultValue: false
				},
				/**
				 * Specifies the ports that are to be displayed on nodes. Ports are used for creating connections between nodes.
				 * Ports are available only when the layout algorithm is set to "NoopLayout", and when the drag and drop is enabled. Otherwise, this property is ignored.
				 * @public
				 * @since 1.144
				 */
				nodePorts: {
					type: "sap.suite.ui.commons.networkgraph.NodePorts", group: "Behavior", defaultValue: NodePorts.None
				},
				/**
				 * This action button is used to create connections between nodes as an accessible alternative to node ports.
				 * The button is displayed on each node when the layout algorithm is set to "NoopLayout" and drag and drop is enabled.
				 * shows the 'Create Connection' action button on node.
				 * If set to <code>false</code>, the button remains hidden.
				 * Hide this button when you want to implement your own way of creating connections between nodes as an accessible alternative to node ports.
				 * @public
				 * @since 1.144
				 */
				showCreateConnectionButton: {
					type: "boolean", group: "Behavior", defaultValue: true
				},
				/**
				 * Mapping of connection types to their display text keys or custom text values.
				 * This allows customization of how connection types are displayed in the connection creation popover.
				 * The mapping should be an object where keys are connection type values (LeftToLeft, LeftToRight, RightToLeft, RightToRight)
				 * and values are custom text that follows the correct format (e.g., "Start to End", "Source to Target").
				 * If the format is invalid or not provided, default values are used
				 * @public
				 * @since 1.144
				 */
				connectionTypeMapping: {
					type: "object", group: "Behavior", defaultValue: {
						"LeftToLeft": "Start to Start",
						"LeftToRight": "Start to Finish",
						"RightToLeft": "Finish to Start",
						"RightToRight": "Finish to Finish"
					}
				}
			},
			aggregations: {
				/**
				 * Holds the lines to be displayed in the graph.
				 */
				lines: {
					type: "sap.suite.ui.commons.networkgraph.Line", multiple: true, singularName: "line"
				},
				/**
				 * Holds the nodes to be displayed in the graph.
				 */
				nodes: {
					type: "sap.suite.ui.commons.networkgraph.Node", multiple: true, singularName: "node", dnd: true
				},
				/**
				 * Holds a list of groups used in the graph.
				 */
				groups: {
					type: "sap.suite.ui.commons.networkgraph.Group", multiple: true, singularName: "group"
				},
				/**
				 * A custom legend to be rendered instead of the autogenerated one.
				 */
				legend: {
					type: "sap.ui.core.Control", multiple: false
				},
				/**
				 * Defines the layout algorithm to be used. If not defined, {@link sap.suite.ui.commons.networkgraph.layout.LayeredLayout} is used.
				 */
				layoutAlgorithm: {
					type: "sap.suite.ui.commons.networkgraph.layout.LayoutAlgorithm", multiple: false
				},
				/**
				 * Holds a collection of custom statuses that can be used to assign custom colors to nodes, lines,
				 * and groups of nodes, based on their status.
				 */
				statuses: {
					type: "sap.suite.ui.commons.networkgraph.Status", multiple: true, singularName: "status"
				}
			},
			associations: {
				/**
				 * Controls or IDs that describe this control. This association is used by screen reader software.
				 */
				ariaDescribedBy: { type: "sap.ui.core.Control", multiple: true, singularName: "ariaDescribedBy" },

				/**
				 * Controls or IDs that label this control. This association is used by screen reader software.
				 */
				ariaLabelledBy: { type: "sap.ui.core.Control", multiple: true, singularName: "ariaLabelledBy" },
				/**
				 * Control or ID of an auxiliary control associated with this graph.
				 * @since 1.144
				 */
				associatedControl: { type: "sap.ui.core.Control", multiple: false, singularName: "associatedControl" }
			},
			events: {
				/**
				 * This event is fired when the graph is fully rendered.
				 */
				graphReady: {},
				/**
				 * This event is fired when the layouting algorithm has finished arranging the graph and SVG rendering starts.
				 */
				afterLayouting: {},
				/**
				 * This event is fired just before the layout computation begins.
				 */
				beforeLayouting: {},
				/**
				 * This event is fired when zooming in or out.
				 */
				zoomChanged: {},
				/**
				 * This event is fired when an error has occured and the graph cannot be rendered properly.
				 */
				failure: {
					parameters: {
						/**
						 * Type of an error. This parameter can be used for decision making in the calling code.
						 */
						type: "string",
						/**
						 * A human readable message with a description of what went wrong.
						 */
						message: "string"
					}
				},
				/**
				 * This event is fired when a selection of elements in the graph changes.
				 */
				selectionChange: {
					parameters: {
						/**
						 * A list of elements that changed the state of the selection. To determine the new
						 * state, use the <code>getSelected()</code> method.
						 */
						items: { type: "sap.suite.ui.commons.networkgraph.ElementBase[]" }
					}
				},
				/**
				 * This event is fired when the user runs a search and there is a matching term found
				 * among the suggestions.
				 */
				searchSuggest: {
					parameters: {
						term: { type: "string" }
					}
				},
				/**
				 * This event is fired when the user enters a keyword into the search field.
				 */
				search: {
					parameters: {
						term: { type: "string" },
						key: { type: "string" }
					}
				},
				/**
				 * This event is fired when a user drops a node in the graph.
				 * This event is available only when the layout algorithm is set to "NoopLayout" and the <code>enableDragAndDrop</code> property is set to <code>true</code>.
				 * Note: When a node is dropped near the TOP or LEFT boundary of the graph canvas, its position is automatically adjusted (clamped) to ensure the node and its elements remain fully visible. This provides better visualization by preventing nodes from being positioned at coordinates that would make them invisible or partially hidden.
				 * @public
				 * @since 1.144
				 */
				nodeDropped: {
					parameters: {
						/**
						 * The node that was moved.
						 */
						node: { type: "sap.suite.ui.commons.networkgraph.Node" },
						/**
						 * The new x coordinate of the node.
						 */
						newX: { type: "float" },
						/**
						 * The new y coordinate of the node.
						 */
						newY: { type: "float" }
					}
				},
				/**
				 * This event is fired when a new connection is created between two nodes by using node ports.
				 * @public
				 * @since 1.144
				 */
				connectionCreated: {
					parameters: {
						/**
						 * The key of the source node.
						 **/
						from: { type: "string" },
						/**
						 * The key of the target node.
						 **/
						to: { type: "string" },
						/**
						 * The connection type defining how the line connects the source and target nodes.
						 */
						connectionType: {type: "sap.suite.ui.commons.networkgraph.ConnectionType"},
						/**
						 * The source node control instance.
						 **/
						fromNode: { type: "sap.suite.ui.commons.networkgraph.Node" },
						/**
						 * The target node control instance.
						 **/
						toNode: { type: "sap.suite.ui.commons.networkgraph.Node" }
					}
				},
				/**
				 * This event is fired when a user presses the delete key on a focused node or line.
				 * This event is available only when the layout algorithm is set to "NoopLayout" and the <code>enableDragAndDrop</code> property is set to <code>true</code>.
				 * @public
				 * @since 1.145
				 */
				itemDeleted: {
					parameters: {
						/**
						 * The item (node or line) that is to be deleted.
						 */
						item: { type: "sap.suite.ui.commons.networkgraph.ElementBase" }
					}
				},
				/**
				 * Fired when the user requests to add a node via INSERT or Ctrl+Alt+N.
				 * Only available when NoopLayout is used and enableDragAndDrop is <code>true</code>.
				 * @public
				 * @since 1.148
				 */
				nodeAdded: {}
			}
		}
	});

	Graph.FAILURE_TYPE = {
		INCONSISTENT_MODEL: "Inconsistent model",
		LAYOUT_FAILURE: "Layout failure"
	};

	Graph.prototype.ZOOM_100 = DEFAULT_ZOOM_MILESTONE;

	/* =========================================================== */
	/* Events */
	/* =========================================================== */
	Graph.prototype.init = function () {
		// indicates zoom state of graph
		this._fZoomLevel = 1;

		// currently selected nodes
		this._mSelectedNodes = {};

		// currently selected lines
		this._mSelectedLines = {};

		// indicates whether the graph is completely rendered
		this._bIsLayedOut = false;

		// flag for fullscreen mode
		this._bIsFullScreen = false;

		// map with nodes parsed by nodes' keys
		this._mNodes = {};

		// some properties are set before rendering (hiding nodes) or before graph aggregation is set
		// in such case we need to reset them after graph is rendered
		// this is needed only for the first time (update aggregation reset this flag)
		this._bNeedNodeProcessing = true;

		// Container for full screen mode, where data is rendered
		this._oFullScreenContainer = null;

		// indicates whether data need to be reprocessed (that is setting parents and child of nodes, groups and lines)
		// set true when aggregation is changed or f.e. line is set to another node
		this._bRequiresDataProcessing = true;

		// information about current state when graph panning
		this._oPanning = {};

		// Custom legend labels
		this._oLegendLabels = {};

		// Number of running layouting algorithms
		this._iRunningLayouts = 0;

		// Last initiated running layouting algorithm.
		this._oLastLayout = null;

		// RTL mode - it's reset in 'onBeforeRendering' in case it changed runtime
		this._bIsRtl = Localization.getRTL();

		// Private variable for multiple directed arrows feature
		this._enableMultipleDirectedArrows = false;

		// element with focus
		this._oFocus = null;

		// popover object for elements
		this._tooltip = this._createTooltip();

		// flag for graph data validity
		this._bIsInvalid = false;

		// hash map with statuses
		this._oStatuses = {};

		// Shaded nodes (opacity when line clicked)
		this._aShadedNodes = [];

		// flag to check if the events has been added to the graph
		this._bEventsAdded = false;

		// illustrated message instance for empty state
		this._oIllustratedMessage = null;

		this._createToolbar();

		/**
		 * Attach drag and drop events
		 */
		if (this.getDragDropConfig().length === 0) {
			try {
				DragDropManager.injectDnD(this);
			} catch (error) {
				Log.warning("Graph injectDnD issue: ", error);
			}
		}
		// Initialize PortManager with this graph instance
		PortManager.setGraphInstance(this);
		Core.ready(this._handleCoreInitialized.bind(this));

	};

	/**
	 * Handler for the core's init event. Attaches listener for localization changes.
	 * @private
	 */
	Graph.prototype._handleCoreInitialized = function () {
		Localization.attachChange(this._handleLocalizationChanged.bind(this));
	};

	/**
	 * Handler for localization changes. Sets a pending flag when RTL mode changes so that
	 * node dimensions are re-measured after RTL CSS files finish loading.
	 * UI5 automatically re-renders all UIAreas on RTL change; the flag prevents premature
	 * layout calculation in onAfterRendering before CSS dimensions are stable.
	 * @private
	 */
	Graph.prototype._handleLocalizationChanged = function () {
		const bNewRtl = Localization.getRTL();
		if (this._bIsRtl !== bNewRtl) {
			this._bIsRtl = bNewRtl;
			this._bRtlMeasurementPending = true;

			const fnOnApplied = function () {
				Theming.detachApplied(fnOnApplied);
				if (this._bRtlMeasurementPending) {
					this._bRtlMeasurementPending = false;
					this._measureAndLayout();
				}
			}.bind(this);
			Theming.attachApplied(fnOnApplied);
		}
	};

	Graph.prototype._measureAndLayout = function () {
		var aNodes = this.getNodes();
		aNodes.forEach(function (oNode) {
			if (this._isUseNodeHtml()) {
				oNode._setupDivDimensions();
			} else {
				oNode.calculateSizes();
				oNode._setupWidthAndHeight();
			}
		}.bind(this));
		this._bTriggerLayoutCalculation = true;
		this._preprocessData();
	};

	Graph.prototype.onBeforeRendering = function () {
		// indicates RTL
		this._bIsRtl = Localization.getRTL();

		// Check if the currently focused item has been destroyed and clear it
		if (this._oFocus && this._oFocus.item && (this._oFocus.item.bIsDestroyed || this._oFocus.item.isDestroyed?.())) {
			Log.info("NetworkGraph: Focused item was destroyed before rendering, clearing focus");
			this._oFocus = null;
		}

		this.setBusy(false);
		this.setBusyIndicatorDelay(0);

		// find largest nodes' maxWidth (if any) we will use it to set 'divnodes' to this width to ensure
		// there is enough space for max width rendering routine.
		this._iNodeMaxWidth = 0;
		this.getNodes().forEach(function (oNode) {
			oNode._resetDimensions();

			var iMaxWidth = oNode.getMaxWidth();
			if (iMaxWidth > this._iNodeMaxWidth) {
				this._iNodeMaxWidth = iMaxWidth;
			}
		}.bind(this));

		this.getLines().forEach(function (oLine) {
			oLine._resetLayoutData();
		});

		if (!this.getNoData()) {
			this.setDisableToolbarButtons(true);
			this._loadData();
		} else {
			this.setDisableToolbarButtons(false);
		}
	};

	Graph.prototype.onAfterRendering = function () {
		var aNodes = this.getNodes();
		var oRm = new RenderManager();

		this.$divnodes = this.$("divnodes");
		this.$divgroups = this.$("divgroups");
		this.$background = this.$("background");
		this.$tooltips = this.$("tooltiplayer");

		this.$scroller = this.$("scroller");
		this._$innerscroller = this.$("innerscroller");
		this.$legend = this.$("legend");

		// if there is invalidation in full screen mode we have to set $content again as it would point
		// to wrong element
		if (this._oFullScreenContainer && this._bIsFullScreen) {
			this._oFullScreenContainer.$content = this.$();
			this.$().addClass("sapSuiteUiCommonsNetworkGraphFullScreen");
		}

		if (aNodes.length === 0 || this._bIsInvalid || this.getNoData()) {
			if (this._bIsInvalid) {
				oRm.openStart("span");
				oRm.class("sapSuiteNetworkGraphErrorText");
				oRm.openEnd();
				// oRm.writeEscaped(oResourceBundle.getText("NETWORK_GRAPH_WRONGDATA"));
				oRm.close("span");
				oRm.flush(this.$scroller[0]);
			}

			if (this._oSuggestionItemsModel) {
				this._oSuggestionItemsModel.setData("");
			}

			// empty graph or invalid graph - we fire ready because there is no other action to do
			this.fireGraphReady();
			return;
		}

		this.setBusy(true);

		// this is important for preventing invalidation of node's inner control when they trigger invalidate themself
		// typical case is f.e. control is invalidating on themechanged event
		// graph is rendering on this event too and so the inner controls force invalidation the whole graph as nodes are marked as not rendered yet
		aNodes.forEach(function (oNode) {
			oNode.bOutput = true;
		});

		if (this._isDelayedLayouting()) {
			var fnProcess = function () {
				if (this._iNodeMaxWidth) {
					this.$divnodes.css("width", this._iNodeMaxWidth + 50 + "px");
				}
				if (this._isUseNodeHtml()) {
					this._createDivNodes();
				} else {
					oRm.openStart("svg", this.getId() + "-sizesvg");
					if (this._bIsRtl) {
						oRm.attr("direction", "rtl");
					}
					oRm.class("sapSuiteUiCommonsNetworkGraphSvg");
					oRm.openEnd();
					aNodes.forEach(function (oNode) {
						oNode._setupWidthAndHeight();
						oNode._render({
							sizeDetermination: true,
							renderManager: oRm
						});
						oRm.close("g");
					});
					//Rendering Canvas
					oRm.openStart("rect");
					oRm.class("sapSuiteFlickerFreeRect");
					oRm.attr("x", "0").attr("y", "0");
					oRm.openEnd();
					oRm.close("rect");
					oRm.close("svg");
					//Flush at the end
					oRm.flush(this._$innerscroller[0], true, this._$innerscroller.children().length);
				}

				if (!this._bRtlMeasurementPending) {
					this._measureAndLayout();
				}
			}.bind(this);

			fnProcess();
		}
		this.oInvisibleMessage = InvisibleMessage.getInstance();
		oRm.destroy();

	};

	Graph.prototype.exit = function () {
		// if (this.oHashChanger) {
		// 	this.oHashChanger.destroy();
		// }
		if (this._oFullScreenUtil) {
			this._oFullScreenUtil.cleanUpFullScreen(this);
		}

		// Clean up busy indicator
		if (this._oBusyIndicator) {
			this._oBusyIndicator.destroy();
			this._oBusyIndicator = null;
		}

		// Clean up illustrated message
		if (this._oIllustratedMessage) {
			this._oIllustratedMessage.destroy();
			this._oIllustratedMessage = null;
		}

		DragDropManager.removeDnD(this);
	};
	/* =========================================================== */
	/* Pseudo events and event triggers */
	/* =========================================================== */
	Graph.prototype._beforeRender = function () {
		this.fireEvent("afterLayouting");
	};

	Graph.prototype._fireFailure = function (sType, sMsg) {
		var sParsedMsg = sMsg;
		if (typeof sMsg === "object" && sMsg.text) {
			sParsedMsg = sMsg.text;
		}

		var sConsoleText = "Graph failure: " + sType + ": " + sParsedMsg;
		if (sType === Graph.FAILURE_TYPE.INCONSISTENT_MODEL) {
			sConsoleText += " This may be due to the model size restriction. For its increase use model's 'setSizeLimit' method.";
		}

		this.fireFailure([sType.toString(), sParsedMsg]);
		Log.error(sConsoleText);
	};

	/* =========================================================== */
	/* Public API */
	/* =========================================================== */

	/**
	 * Returns <code>true</code> if the graph is in full screen mode.
	 * @public
	 * @returns {boolean} Returns whether the graph is in full screen mode.
	 */
	Graph.prototype.isFullScreen = function () {
		return this._bIsFullScreen;
	};

	/**
	 * Toggles full screen mode.
	 * @public
	 */
	Graph.prototype.toggleFullScreen = function () {
		this._toggleFullScreen();
	};

	/**
	 * If you call this method with <code>true</code> parameter, no invalidation will be triggered until you call it with <code>false</code>.
	 * This can be useful when changing properties before rendering that can trigger unwanted invalidation and force an infinite loop.
	 * @param {boolean} bPreventInvalidation True for preventing graph invalidation
	 * @public
	 */
	Graph.prototype.preventInvalidation = function (bPreventInvalidation) {
		this._bPreventInvalidation = bPreventInvalidation;
	};

	/**
	 * Scrolls to the element set in the parameter.
	 * @param {Object} oElement Element to scroll to
	 * @returns {void}
	 * @public
	 */
	Graph.prototype.scrollToElement = function (oElement) {
		this._scrollToElement(oElement);
	};

	/**
	 * Sets custom search suggestions.
	 * @param {Array} aItems Array with suggestion items ({@link sap.m.SuggestionItem}) to display when the user runs a search.
	 * @public
	 */
	Graph.prototype.setSearchSuggestionItems = function (aItems) {
		var aDataItems = [];

		if (aItems) {
			aItems.forEach(function (oItem) {
				aDataItems.push({
					text: oItem.getText(),
					icon: oItem.getIcon(),
					key: oItem.getKey(),
					description: oItem.getDescription()
				});
			});
		}

		this._oSuggestionItemsModel.setData({
			items: aDataItems
		});
	};

	/**
	 * This method removes all elements (lines, nodes, groups) without triggering invalidation.
	 * You should use this method when changing graph data that uses data binding, for example with {@link sap.suite.ui.commons.networkgraph.Graph#setModel}.
	 * @public
	 */
	Graph.prototype.destroyAllElements = function () {
		this.destroyAggregation(AGG_NODES, false);
		this.destroyAggregation(AGG_GROUPS, false);
		this.destroyAggregation(AGG_LINES, false);
	};

	/**
	 * Deselects all currently selected items.
	 * @param {boolean} bSuppressEvent Indicates whether the <code>selecitonChange</code> event should be fired
	 * @returns {Array} All items that have been deselected
	 * @public
	 */
	Graph.prototype.deselect = function (bSuppressEvent) {
		var aItems = [],
			$this = this.$(),
			fnDeselectElements = function (mElements) {
				Object.keys(mElements).forEach(function (sKey) {
					aItems.push(mElements[sKey]);
					mElements[sKey].setSelected(false);
				}, this);
			}.bind(this);

		$this.find("." + this.HIGHLIGHT_CLASS).removeClass(this.HIGHLIGHT_CLASS);
		$this.find("." + this.SELECT_CLASS).removeClass(this.SELECT_CLASS);
		$this.find("." + this.VISIBLE_ACTIONS_BUTTONS_CLASS).removeClass(this.VISIBLE_ACTIONS_BUTTONS_CLASS);

		fnDeselectElements(this._mSelectedNodes);
		fnDeselectElements(this._mSelectedLines);

		// line buttons tooltip
		this._aShadedNodes.forEach(function (oNode) {
			oNode._setNodeOpacity(false);
		});
		this._aShadedNodes = [];
		this.$(this.LINEBUTTONSID).hide();

		if (!bSuppressEvent && aItems.length) {
			this.fireSelectionChange({
				items: aItems
			});
		}

		return aItems;
	};

	Graph.prototype.getFocus = function () {
		return this._oFocus;
	};

	/**
	 * Returns a toolbar instance to allow its customization.
	 * @returns {sap.m.OverflowToolbar} Toolbar instance
	 * @public
	 */
	Graph.prototype.getToolbar = function () {
		return this._toolbar;
	};

	/**
	 * Returns a node by its key.
	 * @param {string} sKey Node's key
	 * @returns {sap.suite.ui.commons.networkgraph.Node} The node, if such a node exists, or undefined
	 * @public
	 */
	Graph.prototype.getNodeByKey = function (sKey) {
		if (this._bRequiresDataProcessing) {
			this._processData();
		}

		return this._mNodes[sKey];
	};

	/**
	 * Re-rendering a node and all connected lines to update the positions of both the node and the lines.
	 * Note: This method should be used only when the layout algorithm is set to NoopLayout and enableDragAndDrop is set to true.
	 *
	 * @param {sap.suite.ui.commons.networkgraph.Node|string} vNode Node instance or node key
	 * @param {number} iX New X coordinate
	 * @param {number} iY New Y coordinate
	 * @returns {sap.suite.ui.commons.networkgraph.Graph} Reference to this for method chaining
	 * @public
	 * @since 1.144
	 */
	Graph.prototype.updateNodePosition = function (vNode, iX, iY) {
		if (!this._isDnDEnabled()) {
			return this;
		}

		var oNode = typeof vNode === "string" ? this.getNodeByKey(vNode) : vNode;

		if (!oNode) {
			Log.warning("Node not found", "updateNodePosition", "sap.suite.ui.commons.networkgraph.Graph");
			return this;
		}

		this.invalidate();
		return this;
	};

	/**
	 * Sets a custom label for the legend.
	 * @param {object} mArguments Parameters for this method
	 * @param {string} mArguments.label ]text for the legend label
	 * @param {sap.suite.ui.commons.networkgraph.ElementStatus} mArguments.status Status the custom text will be assigned to. Works only for the default legend,
	 * not when the Legend aggregation is used
	 * @param {boolean} mArguments.isNode True for a legend describing nodes. True by default if 'isLine' and 'isGroup' are false.
	 * @param {boolean} mArguments.isLine True for a legend describing lines. By default true if 'isNode' is false.
	 * @param {boolean} mArguments.isGroup True for a legend describing groups. False by default.
	 * @public
	 */
	Graph.prototype.setCustomLegendLabel = function (mArguments) {
		var sType;
		if (mArguments.isGroup === true) {
			sType = StatusType.Group;
		} else if (mArguments.isLine === true) {
			sType = StatusType.Line;
		} else {
			// backward compatibility
			sType = mArguments.isNode === false ? StatusType.Line : StatusType.Node;
		}

		if (mArguments.status) {
			this._oLegendLabels[sType + mArguments.status] = mArguments.label;
			this._createLegend();
		}
	};

	/**
	 * Updates the legend.
	 * @public
	 */
	Graph.prototype.updateLegend = function () {
		this._createLegend();
	};


	/**
	 * Zooms in or out of the graph.
	 *
	 * @param {object} mParameters Map which contains following parameters properties:
	 * @param {number} [mParameters.x=middle of view port width] x position from/to which the zoom should happen
	 * @param {number} [mParameters.y=middle of view port height] y position from/to which the zoom should happen
	 * @param {boolean} [mParameters.zoomin=true] whether to zoom in or out
	 * @param {number} [mParameters.zoomLevel] zoom level in percents, parameter zoomin ignored in this case
	 * @public
	 */
	Graph.prototype.zoom = function (mParameters) {
		mParameters = mParameters || {};
		mParameters.deltaY = (mParameters.zoomin !== false) ? 1 : -1;

		if (mParameters.x && mParameters.y) {
			mParameters.point = {
				x: mParameters.x,
				y: mParameters.y
			};
		}

		this._zoom(mParameters);
	};

	/**
	 *  Returns predefined zoom level steps used by the default zoom functionality.
	 *
	 * @return {number[]} zoom level milestones
	 * @public
	 */
	Graph.prototype.getZoomLevelMilestones = function () {
		return ZOOM_MILESTONES;
	};

	/**
	 * Returns current zoom level.
	 *
	 * @return {number} Current zoom level
	 * @public
	 */
	Graph.prototype.getCurrentZoomLevel = function () {
		return this._fZoomLevel;
	};


	/**
	 * Sets current zoom level.
	 * @param {float} zoomLevel New zoom level
	 *
	 * @public
	 */
	Graph.prototype.setCurrentZoomLevel = function (zoomLevel) {
		this._fZoomLevel = zoomLevel;
		this._zoomLabel.setText(this._getZoomText());
		this._oZoomLevelInvisibleText.setText(oResourceBundle.getText("NETWORK_GRAPH_ZOOM_LEVEL") + ": " + this._getZoomText());
	};

	/**
	 * Restores keyboard focus to the last focused item in the graph, or falls back to the graph wrapper.
	 * @private
	 */
	Graph.prototype._restoreFocusToGraph = function () {
		if (this._oFocus) {
			const oFocusToRestore = this._oFocus;
			// Force setFocus to re-apply even if the item hasn't changed.
			this._oFocus = null;
			this.setFocus(oFocusToRestore);
		} else {
			this.getFocusDomRef().focus();
		}
	};

	/**
	 * Gets the associated control linked to this graph instance using the 'associatedControl' association.
	 * This can be any UI5 control that is related to the graph.
	 * @returns {sap.ui.core.Control|null} The associated control instance or null if not set.
	 * @public
	 */
	Graph.prototype.getAssociatedControl = function () {
		var sId = this.getAssociation("associatedControl");
		return sId ? Element.getElementById(sId) : null;
	};

	/* =========================================================== */
	/* Private methods */
	/* =========================================================== */
	/**
	 *
	 * @param {{x: Number, y: Number}} oPoint Original coordinates to check
	 * @returns {{x: Number, y: Number}} Position of the mouse
	 * @private
	 */
	Graph.prototype.getCorrectMousePosition = function (oPoint) {
		var oPosition = this.$svg.offset(),
			iRatioX = 1,
			iRatioY = 1;

		if (this._iWidth !== this.$svg.width() || this._iHeight !== this.$svg.height()) {
			iRatioX = this._iWidth / this.$svg.width();
			iRatioY = this._iHeight / this.$svg.height();
		}

		return {
			x: parseInt((oPoint.x - oPosition.left) * iRatioX, 10),
			y: parseInt((oPoint.y - oPosition.top) * iRatioY, 10)
		};
	};

	/**
	 * Returns a busy indicator instance for loading states.
	 * @returns {sap.m.BusyIndicator} BusyIndicator instance
	 * @private
	 */
	Graph.prototype._getBusyIndicator = function () {
		var sText = this.getLoadingText() || oResourceBundle.getText("NETWORK_GRAPH_OPENING_CANVAS");

		if (!this._oBusyIndicator) {
			this._oBusyIndicator = new BusyIndicator({ text: sText });
			this.addDependent(this._oBusyIndicator);
		} else {
			this._oBusyIndicator.setText(sText);
		}

		return this._oBusyIndicator;
	};

	Graph.prototype._createTooltip = function () {
		var oTooltip = new Tooltip(this.getId() + "-tooltip");
		this.addDependent(oTooltip);
		oTooltip.create(this);
		oTooltip.attachEvent("afterClose", function () {
			var oFocus = this.getFocus();

			if (oFocus && oFocus.item) {
				// Check if the focused item is destroyed before trying to restore focus
				if (oFocus.item.bIsDestroyed || oFocus.item.isDestroyed?.()) {
					Log.info("NetworkGraph: Cannot restore focus on destroyed control after tooltip close");
					this._oFocus = null;
					return;
				}

				this.setFocus(oFocus);

				if (oFocus.button == "menu") {
					oFocus.item._setMenuButtonFocus(true);
				}
			}

		}.bind(this));

		return oTooltip;
	};

	/**
	 * Gets or creates an IllustratedMessage instance for displaying empty state.
	 * This method reuses the same instance to avoid memory leaks.
	 * The illustrated message content depends on whether drag-and-drop is enabled:
	 * - When drag-and-drop is enabled: Shows "AddDimensions" illustration with plan-building message
	 * - When drag-and-drop is disabled: Shows "NoChartData" illustration with custom or default no-data text
	 *
	 * @returns {sap.m.IllustratedMessage} The illustrated message instance for empty state
	 * @private
	 */
	Graph.prototype._getIllustratedMessage = function () {
		// Helper function to get configuration based on current state
		var fnConfigureIllustratedMessage = function () {
			var sText = this.getNoDataText(),
				sTextInline = sText || oResourceBundle.getText("NETWORK_GRAPH_NO_DATA");

			if (this._isDnDEnabled()) {
				return {
					illustrationType: IllustratedMessageType.AddDimensions,
					title: oResourceBundle.getText("NETWORK_GRAPH_DND_EMPTY_TITLE"),
					description: oResourceBundle.getText("NETWORK_GRAPH_DND_EMPTY_DESCRIPTION"),
					enableDefaultTitleAndDescription: false
				};
			} else {
				return {
					illustrationType: IllustratedMessageType.NoChartData,
					title: sTextInline,
					enableDefaultTitleAndDescription: false
				};
			}
		}.bind(this);

		if (!this._oIllustratedMessage) {
			var oConfig = fnConfigureIllustratedMessage();
			this._oIllustratedMessage = new IllustratedMessage(oConfig);
			this.addDependent(this._oIllustratedMessage);
		} else {
			var oConfig = fnConfigureIllustratedMessage();
			this._oIllustratedMessage.setIllustrationType(oConfig.illustrationType);
			this._oIllustratedMessage.setTitle(oConfig.title);
			this._oIllustratedMessage.setDescription(oConfig.description);
		}

		return this._oIllustratedMessage;
	};

	/**
	 * @private
	 * Defocuses the currently focused element.
	 */
	Graph.prototype.defocus = function () {
		this.$().find("." + this.FOCUS_CLASS).removeClass(this.FOCUS_CLASS);
	};

	/**
	 * Sets whether drag and drop is enabled.
	 * @param {boolean} bEnabled Whether drag and drop should be enabled
	 * @private
	 */
	Graph.prototype.setEnableDragAndDrop = function (bEnabled) {
		this.setProperty("enableDragAndDrop", bEnabled, true);

		// Update zoom button visibility
		if (this._zoomIn && this._zoomOut && this._zoomToFitButton) {
			var bZoomVisible = !this._isDnDEnabled();
			this._zoomIn.setVisible(bZoomVisible);
			this._zoomOut.setVisible(bZoomVisible);
			this._zoomToFitButton.setVisible(bZoomVisible);
		}

		// remove the node ports when drag and drop is disabled
		if (!bEnabled) {
			PortManager.removeAllPorts();
		}

		return this;
	};

	/**
	 * @private
	 * @returns {boolean} Returns whether drag and drop is enabled.
	 */
	Graph.prototype.getEnableDragAndDrop = function () {
		return this.getProperty("enableDragAndDrop");
	};

	/**
	 * Sets focus of the graph. Since one element at max can be focused at one time, handling of this belongs to the graph itself.
	 * @param {object} oFocus Element (and optionally button) to focus
	 * @param {boolean} bIsClickOrEnter to check whether the item has been clicked or if the enter button was pressed
	 * @private
	 */
	Graph.prototype.setFocus = function (oFocus, bIsClickOrEnter) {
		// Check if the focused item has been destroyed and clear it
		if (oFocus && oFocus.item && (oFocus.item.bIsDestroyed || oFocus.item.isDestroyed?.())) {
			Log.info("NetworkGraph: Cannot set focus on destroyed control, clearing focus");
			this._oFocus = null;
			return;
		}

		// Identity redundant
		if (!oFocus && !this._oFocus ||
			oFocus && this._oFocus && oFocus.item === this._oFocus.item && oFocus.button === this._oFocus.button  && oFocus.groupInFocused === this._oFocus.groupInFocused) {
				if (bIsClickOrEnter ||
						(this._oFocus && this._oFocus.item &&
								(this._oFocus.item.isA("sap.suite.ui.commons.networkgraph.Line") ||
									this._oFocus.item.isA("sap.suite.ui.commons.networkgraph.Node")))) {
				this._updateAccessibility(oFocus);
			}
			this._updateAccessibility(oFocus);
			return;
		}

		this.defocus();
		if (this.getFocusDomRef() && !(oFocus && oFocus.button && oFocus.button.id && oFocus.button.id.indexOf("actionOverflow") !== -1)) {
			this.getFocusDomRef().focus();
		}

		if (oFocus) {
			if (oFocus.button) {
				if (oFocus.item instanceof Node || oFocus.item instanceof Line) {
					oFocus.item._setActionButtonFocus(oFocus.button, true);
				} else if (oFocus.item instanceof Group) {
					if (oFocus.button === Group.BUTTONS.MENU) {
						oFocus.item._setMenuButtonFocus(true);
					} else if (oFocus.button === Group.BUTTONS.COLLAPSE) {
						oFocus.item._setCollapseButtonFocus(true);
					}
				}
			} else if (oFocus.item) {
				if (oFocus.item instanceof Group) {
						if (oFocus.item.sParentAggregationName === "groups" && !this._oFocus?.groupInFocused) {
							oFocus.item._setFocus(true);
							oFocus.groupInFocused = true;
						} else {
							oFocus.item._setMenuButtonFocus(true);
							oFocus.button = Group.BUTTONS.MENU;
						}
				} else {
					oFocus.item._setFocus(true);
				}
			}
		}

		this._oFocus = oFocus;
		this._ensureOnScreen(oFocus ? oFocus.item : null);
		this._updateAccessibility(oFocus);
	};

	Graph.prototype._updateAccessibility = function (oFocus) {
		var fnSetDefaultAccessibilityTitle = function () {
			this._setAccessibilityTitle(oResourceBundle.getText("NETWORK_GRAPH_ACCESSIBILITY_CONTENT"));
		}.bind(this),
			fnBuildTitleForButton = function (sLabel) {
				var sTitleLabel = sLabel + " " + oResourceBundle.getText("NETWORK_GRAPH_ACCESSIBILITY_ACTION_BUTTON");
				if (sLabel === "Expand/Collapse") {
					if (oFocus.item.getCollapsed()) {
						sTitleLabel = sTitleLabel + " " + oResourceBundle.getText("NETWORK_GRAPH_COLLAPSED");
					} else {
						sTitleLabel = sTitleLabel + " " + oResourceBundle.getText("NETWORK_GRAPH_EXPANDED");
					}
					return sTitleLabel + "." + oResourceBundle.getText("NETWORK_GRAPH_ACCESSIBILITY_TOGGLE_STATE");
				}
				return sTitleLabel;
			};
		if (this.getDomRef("wrapper")) {
			this._setAriaLabelForWrapper();
		}
		if (oFocus) {
			if (oFocus.button) {
				if (oFocus.item instanceof Node) {
					if (oFocus.button.title === "Expand/Collapse") {
						this._setAccessibilityTitle(oFocus.item._getActionButtonTitle(oFocus.button, this) + " " + oFocus.item._oExpandState);
					} else {
						this._setAccessibilityTitle(oFocus.item._getActionButtonTitle(oFocus.button, this));
					}
				} else if (oFocus.item instanceof Group) {
					if (oFocus.button === Group.BUTTONS.MENU) {
						this._setAccessibilityTitle(fnBuildTitleForButton(oResourceBundle.getText("NETWORK_GRAPH_GROUP_DETAIL")));
					} else if (oFocus.button === Group.BUTTONS.COLLAPSE) {
						this._setAccessibilityTitle(fnBuildTitleForButton(oResourceBundle.getText("NETWORK_GRAPH_EXPAND_COLLAPSE")));
					} else {
						fnSetDefaultAccessibilityTitle();
					}
				} else {
					fnSetDefaultAccessibilityTitle();
				}
			} else if (oFocus.item) {
				this._setAccessibilityTitle(oFocus.item._getAccessibilityLabel(this));
			} else {
				this._setAriaLabelForWrapper(oResourceBundle.getText("NETWORK_GRAPH_ACCESSIBILITY_CONTENT"));
				this._setAccessibilityTitle(" ");
			}
		} else {
			fnSetDefaultAccessibilityTitle();
		}
	};

	/**
	 * Sets the Aria-Label for the NetworkGraph Wrapper
	 *  @param {string} sLabel indicates the aria-label value
	 * @private
	 */
	Graph.prototype._setAriaLabelForWrapper = function (sLabel) {
		sLabel = (sLabel) ? sLabel : " ";
		this.getDomRef("wrapper").setAttribute("aria-label", sLabel);
	};

	Graph.prototype._processProperties = function () {
		if (this._bNeedNodeProcessing) {
			this._mSelectedNodes = {};
			this._mSelectedLines = {};

			this.getNodes().forEach(function (oNode) {
				if (oNode.getSelected()) {
					this._mSelectedNodes[oNode.getKey()] = oNode;
				}
				if (oNode.getCollapsed()) {
					oNode.setCollapsed(true);
				}
			}, this);

			this.getLines().forEach(function (oLine) {
				if (oLine.getSelected()) {
					this._mSelectedLines[oLine._getLineId()] = oLine;
				}
			}, this);
			this._bNeedNodeProcessing = false;
		}
	};

	Graph.prototype._loadData = function () {
		if (this.getNodes().length > 0) {
			if (!this._processData()) {
				return;
			}

			if (!this._isDelayedLayouting()) {
				// postpone processing to finish render routine and allow render busy indicator
				setTimeout(this._preprocessData.bind(this), 0);
			}
		}
	};

	Graph.prototype._preprocessData = function () {
		this._bIsLayedOut = false;
		this._bImageLoaded = false;

		this.fireBeforeLayouting();
		this._applyLayout()
			.then(this._render.bind(this));
	};

	Graph.prototype._getAllElements = function () {
		return this.getNodes().concat(this.getGroups());
	};

	Graph.prototype._isNoopLayout = function () {
		return this._getLayoutAlgorithm().isA("sap.suite.ui.commons.networkgraph.layout.NoopLayout");
	};

	Graph.prototype._isDnDEnabled = function() {
		return this._isNoopLayout() && this.getEnableDragAndDrop();
	};

	Graph.prototype._render = function () {
		this._beforeRender();

		this._iRunningLayouts--;

		if (this._iRunningLayouts > 0) {
			return;
		}
		this._oLastLayout = null;

		this._createSearchSuggestItems();
		this._innerRender();
		this._createLegend();

		this._processProperties();

		// fix different zoom ratio
		if (this._fZoomLevel !== 1) {
			this.$svg[0].setAttribute("viewBox", "0 0 " + this.$svg.width() + " " + this.$svg.height());

			var iSvgWidth = this.$svg.width(),
				iSvgHeight = this.$svg.height();
			this.$svg.width(iSvgWidth * this._fZoomLevel);
			this.$svg.height(iSvgHeight * this._fZoomLevel);

			this.$background.width(iSvgWidth * this._fZoomLevel);
			this.$background.height(iSvgHeight * this._fZoomLevel);

			var sScale = "";
			if (this._isUseNodeHtml()) {
				sScale = "scale(" + this._fZoomLevel + ")";
				this.$("divnodes").css("transform", sScale);
			}

			this.$("tooltiplayer").css("transform", sScale);
			this.$("divgroups").css("transform", sScale);
		}

		this._setLineClasses();

		// scrollTo
		if (this._selectElementAfterScroll) {
			this._scrollToElement(this._selectElementAfterScroll);
			this._selectElementAfterScroll = null;
		}

		// While Expand/Collapse, focus will still remain to the button
		if (this._oFocus && this._oFocus.button === Group.BUTTONS.COLLAPSE) {
			// Check if the focused item still exists and is not destroyed
			if (this._oFocus.item && !this._oFocus.item.bIsDestroyed && !this._oFocus.item.isDestroyed?.()) {
				this._oFocus.item._setCollapseButtonFocus(true);
			} else {
				Log.info("NetworkGraph: Focused item was destroyed, clearing focus");
				this._oFocus = null;
			}
		}
		this._bIsLayedOut = true;
		this._setupEvents();
		this._setupKeyboardNavigation();
		// Only restore focus if the focused item still exists and is not destroyed
		var oCurrentFocus = this.getFocus();
		if (oCurrentFocus && oCurrentFocus.item && (oCurrentFocus.item.bIsDestroyed || oCurrentFocus.item.isDestroyed?.())) {
			Log.info("NetworkGraph: Cannot restore focus on destroyed control, clearing focus");
			this._oFocus = null;
		} else {
			this.setFocus(oCurrentFocus);
		}

		// when there is background image, busy is set false after image is loaded (own event)
		// in case image was already loaded continue as usual
		if (!this.getBackgroundImage() || this._bImageLoaded) {
			this.setBusy(false);
			this.fireGraphReady();
		}

		if (!this._isSwimLane() && !this._isTwoColumnsLayout()) {
			this.$("innerscroller").addClass(" sapSuiteUiCommonsNetworkGraphInnerScrollerCenter ");
			if (this._isDnDEnabled()) {
				// If NoopLayout is used, users must set certain styles to ensure precise coordinates setting.
				this.$("innerscroller").addClass("sapSuiteUiCommonsNetworkGraphInnerScrollerNoMargin");
			}
		}
	};

	Graph.prototype._createDivNodes = function () {
		var oRm = new RenderManager();

		this.getNodes().forEach(function (oItem) {
			// we need to say the node this is main graph rendering used for size calculation
			// (which differers from simple node's invalidation and map render)
			oItem._bMainRender = true;
			oRm.renderControl(oItem);
			oItem._bMainRender = false;
		});

		oRm.flush(this.$divnodes[0]);
		oRm.destroy();
	};

	Graph.prototype._innerRender = function (mParams) {
		var fnImageLoaded = function () {
			this.$svg.find(".sapSuiteFlickerFreeRect").remove();
			this._bImageLoaded = true;

			if (this._bIsLayedOut) {
				this.setBusy(false);
				this.fireGraphReady();
			}
		}.bind(this);

		var fnRenderGroups = function () {
			var oRm = new RenderManager();

			this.getGroups().forEach(function (oGroup) {
				oRm.renderControl(oGroup);
			});

			oRm.flush(this.$("divgroups")[0], false, true);
			oRm.destroy();
		}.bind(this);

		var SIZE_OFFSET_Y = 20,
			SIZE_OFFSET_X = 50,
			fnSetLimits = function () {
				var iMaxX = 0,
					iMaxY = 0;

				var fnCheckMax = function (iSumX, iSumY) {
					if (iSumX > iMaxX) {
						iMaxX = iSumX;
					}
					if (iSumY > iMaxY) {
						iMaxY = iSumY;
					}
				};

				this._iWidth = 0;
				this._iHeight = 0;

				this._getAllElements().forEach(function (oNode) {
					if (!oNode._isIgnored()) {
						fnCheckMax(oNode._iWidth + oNode.getX(), oNode._iHeight + oNode.getY());
					}
				}, this);

				this.getLines().forEach(function (oLine) {
					if (!oLine._isIgnored()) {
						oLine.getCoordinates().forEach(function (oCoordinate) {
							fnCheckMax(oCoordinate.getX(), oCoordinate.getY());
						});
					}
				}, this);


				if (this.getBackgroundImage()) {
					var oImg = new Image();
					// this ensures image is not cropped by svg size
					oImg.onload = function () {
						this._iWidth = Math.max(this._iWidth, oImg.width);
						this._iHeight = Math.max(this._iHeight, oImg.height);

						this.$svg.width(this._iWidth);
						this.$svg.height(this._iHeight);

						this.$background.width(this._iWidth);
						this.$background.height(this._iHeight);

						this.$svg.css("background-image", "url(" + this.getBackgroundImage() + ")");
						this.$svg.css("background-size", "cover");

						fnImageLoaded();
					}.bind(this);
					oImg.onerror = function () {
						Log.warning("Unable to load background image.");
						fnImageLoaded();
					};
					oImg.src = this.getBackgroundImage();
				}

				this._iWidth = Math.round(iMaxX + (this._isTwoColumnsLayout() ? 0 : SIZE_OFFSET_X));
				this._iHeight = Math.round(iMaxY + SIZE_OFFSET_Y);

				// width is set to whole component as height only to inner div
				// as there may be toolbar so we don't need to add this value to its height
				if (this.getWidth() === "auto") {
					this.$().width(this._iWidth);
				}

				if (this.getHeight() === "auto") {
					this.$("wrapper").height(this._iHeight);
				}

				if (this._isTwoColumnsLayout()) {
					var iParentWidth = this._$innerscroller.width();
					if (this._iWidth < iParentWidth) {
						this._iWidth = iParentWidth;
					}
				}

				this.$svg.width(this._iWidth);
				this.$svg.height(this._iHeight);

				this.$background.width(this._iWidth);
				this.$background.height(this._iHeight);

				if (this._isUseNodeHtml()) {
					this.$divnodes.width(this._iWidth);
					this.$divnodes.height(this._iHeight);
					this.$divnodes.css("opacity", 1);
				}

				this.$divgroups.width(this._iWidth);
				this.$divgroups.height(this._iHeight);

				this.$tooltips.width(this._iWidth);
				this.$tooltips.height(this._iHeight);
			}.bind(this);

		var fnAfterRendering = function (aItems) {
			aItems.forEach(function (aItemsInner) {
				aItemsInner.forEach(function (oItem) {
					oItem._afterRendering();
				});
			});
		};

		var aNodes = this.getNodes(), aLines = this.getLines();

		Measurement.start(this.getId(), "Rendering of a network graph");

		// for node SVG rendering clear HTML for case delayed rendering is used (so the svg is already rendered for sizes determination)
		if (!this._isUseNodeHtml()) {
			this.$("sizesvg").remove();
		}

		fnRenderGroups();
		var oRm = new RenderManager();
		// this._$innerscroller.append(this._renderSvg(this._isUseNodeHtml() ? [] : aNodes, aLines,oRm));
		this._renderSvg(this._isUseNodeHtml() ? [] : aNodes, aLines, oRm);
		oRm.flush(this._$innerscroller[0], true, this._$innerscroller.children().length);
		oRm.destroy();
		this.$svg = this.$("networkGraphSvg");
		this.$background = this.$("background");

		fnSetLimits();

		if (this._isUseNodeHtml()) {
			aNodes.forEach(function (oNode) {
				var $node = oNode.$();
				// for swim lanes we render the nodes as we still want their size
				if (oNode._isInCollapsedGroup()) {
					$node.hide();
				}

				$node.css("top", oNode.getY() + "px");
				$node.css("left", oNode.getX() + "px");
			});
		}

		// HTML nodes already called after rendering before layouter stars
		fnAfterRendering([this._isUseNodeHtml() ? [] : aNodes, aLines]);
		Measurement.end(this.getId());
	};

	Graph.prototype._renderSvg = function (aNodes, aLines, oRm) {
		var aClasses = ["sapSuiteUiCommonsNetworkGraphSvg", "sapSuiteUiCommonsNetworkGraphNoSelect", "sapSuiteNetworkGraphSvgMargin"];
		if (this._fZoomLevel < ZOOM_OUT_RATING) {
			aClasses.push("sapSuiteUiCommonsNetworkGraphZoomedOut");
		}
		if (!this._isUseNodeHtml()) {
			aClasses.push("sapSuiteNetworkGraphSvgPosition");
		}
		var fnRenderInnerItems = function (aItems, oRm) {
			aItems.forEach(function (oItem) {
				oItem._render({
					"renderManager": oRm
				});
				oItem.bOutput = true;
			});
		};
		var fnRenderItems = function (sId, aItems, sClass) {
			oRm.openStart("g", this._getDomId(sId));
			if (sClass) {
				oRm.class(sClass);
			}
			oRm.openEnd();
			fnRenderInnerItems(aItems, oRm);
			oRm.close("g");
		}.bind(this);
		oRm.openStart("svg", this.getId() + "-networkGraphSvg");
		if (this._bIsRtl) {
			oRm.attr("direction", "rtl");
		}
		oRm.attr("aria-label", oResourceBundle.getText("NETWORK_GRAPH_SVG_ACCESSIBILITY_LABEL"));

		aClasses.forEach(function (sClass) {
			oRm.class(sClass);
		});

		oRm.attr("preserveAspectRatio", "none");
		oRm.openEnd();
		oRm.openStart("g", this.getId() + "-svgbody");
		oRm.openEnd();
		fnRenderItems("lines", aLines, "sapSuiteUiCommonsNetworkLines");
		// Render line texts after all lines are rendered to handle overlaps
		this._renderAllLineTexts(aLines, oRm);
		if (!this._isUseNodeHtml()) {
			fnRenderItems("nodes", aNodes, "sapSuiteUiCommonsNetworkNodes");
		}
		oRm.close("g");

		if (this.getBackgroundImage()) {
			oRm.openStart("rect");
			oRm.class("sapSuiteFlickerFreeRect");
			oRm.attr("x", "0");
			oRm.attr("y", "0");
			oRm.attr("height", "100%");
			oRm.attr("width", "100%");
			oRm.openEnd();
			oRm.close("rect");
		}
		oRm.close("svg");
		if (this._isUseNodeHtml()) {
			oRm.openStart("div", this.getId() + "-background");
			oRm.openEnd();
			oRm.close("div");
		}

	};

	/**
	 * Renders text labels for all lines in a dedicated SVG group container.
	 *
	 * This method creates a batch rendering context for line labels, enabling
	 * potential overlap handling and positioning optimizations. Labels are only
	 * rendered for lines that meet all of the following conditions:
	 * - The line has a labelName property value set
	 * - The graph is using NoopLayout
	 * - The line's arrowPosition is set to "Both"
	 *
	 * @param {sap.suite.ui.commons.networkgraph.Line[]} aLines Array of line objects to render text labels for
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager instance used for SVG rendering
	 * @private
	 */
	Graph.prototype._renderAllLineTexts = function (aLines, oRm) {
		// Early return if line labels are disabled or NoopLayout is not active
		if (!this._isNoopLayout()) {
			return;
		}

		// Create a dedicated SVG group container for all line text labels
		// This enables batch processing and potential overlap handling
		oRm.openStart("g");
		oRm.attr("id", this.getId() + "-line-texts");
		oRm.class("sapSuiteUiCommonsNetworkLineTexts");
		oRm.openEnd();

		// Iterate through all lines and render their text labels within the group
		// Only process lines that are valid, not ignored by layout, and visible
		aLines.forEach(function (oLine) {
			if (oLine && !oLine._isIgnored() && oLine.getVisible()) {
				oLine._renderLineText(oRm);
			}
		});

		// Close the SVG group container
		oRm.close("g");
	};

	Graph.prototype._isProperKey = function (sKey) {
		return sKey || (sKey === "0");
	};

	Graph.prototype._processData = function () {
		var bIsSwimLane = this._isSwimLane();

		var fnProcessGroups = function () {
			var iIndex = 0,
				bFirstRun;
			this.mGroups = {};

			bFirstRun = this.getGroups().some(function (oGroup) {
				var sGroupKey = oGroup.getKey();

				oGroup._iNestedLevel = 0;

				if (!this._isProperKey(sGroupKey)) {
					this._fireFailure(
						Graph.FAILURE_TYPE.INCONSISTENT_MODEL,
						"Group without a proper key [index: " + iIndex + "] found.");
					return true;
				}

				oGroup._bIsSwimLane = bIsSwimLane;
				oGroup._resetSize();
				oGroup._clearChildren();
				if (this.mGroups[sGroupKey]) {
					this._fireFailure(
						Graph.FAILURE_TYPE.INCONSISTENT_MODEL,
						"Group with a duplicit key " + sGroupKey + " found.");
					return true;
				}
				this.mGroups[sGroupKey] = oGroup;
				iIndex++;

				return false;
			}, this);

			return bFirstRun || this.getGroups().some(function (oGroup) {
				// Check existence of parent group
				if (oGroup.getParentGroupKey() && !this.mGroups[oGroup.getParentGroupKey()]) {
					this._fireFailure(
						Graph.FAILURE_TYPE.INCONSISTENT_MODEL,
						"Group '" + oGroup.getKey() + "' reffers to a nonexistent parent group '" + oGroup.getParentGroupKey() + "'.");
					return true;
				}
				return false;
			}, this);
		}.bind(this);

		var fnProcessNodes = function () {
			var iIndex = 0;
			this._mNodes = {};

			return this.getNodes().some(function (oNode) {
				if (!this._isProperKey(oNode.getKey())) {
					this._fireFailure(
						Graph.FAILURE_TYPE.INCONSISTENT_MODEL,
						"Node without a proper ID [index: " + iIndex + "] found.");
					return true;
				}

				// group handling
				var sGroup = oNode.getGroup(),
					oGroup;
				oNode._oGroup = null;
				if (sGroup) {
					oGroup = this.mGroups[sGroup];
					if (oGroup) {
						oNode._oGroup = oGroup;
						oGroup.aNodes.push(oNode);
					} else {
						this._fireFailure(
							Graph.FAILURE_TYPE.INCONSISTENT_MODEL,
							"Node belonging to a nonexistent group with key " + sGroup + " found.");
						return true;
					}
				}

				if (this._isUseNodeHtml()) {
					oNode._resetDimensions();
				} else {
					oNode._setupWidthAndHeight();
				}
				oNode._clearChildren();
				oNode._rendered = false;

				if (this._mNodes[oNode.getKey()]) {
					this._fireFailure(
						Graph.FAILURE_TYPE.INCONSISTENT_MODEL,
						"Node with a duplicit key " + oNode.getKey() + " found.");
					return true;
				}
				this._mNodes[oNode.getKey()] = oNode;
				iIndex++;

				return false;
			}, this);
		}.bind(this);

		var fnProcessLines = function () {
			return this.getLines().some(function (oLine, iIndex) {
				var oFrom = this.getNodeByKey(oLine.getFrom()),
					oTo = this.getNodeByKey(oLine.getTo());

				if (!oFrom) {
					this._fireFailure(
						Graph.FAILURE_TYPE.INCONSISTENT_MODEL,
						"Line going from a nonexistent node with key " + oLine.getFrom() + " found.");
					return true;
				}
				if (!oTo) {
					this._fireFailure(
						Graph.FAILURE_TYPE.INCONSISTENT_MODEL,
						"Line going to a nonexistent node with key " + oLine.getTo() + " found.");
					return true;
				}

				oLine._rendered = false;
				oLine._initialized = false;

				if (oFrom && oTo) {
					oFrom.aChildren.push(oTo);
					oFrom.aLines.push(oLine);
					oTo.aParents.push(oFrom);
					oTo.aParentLines.push(oLine);

					oLine._oFrom = oFrom;
					oLine._oTo = oTo;

					oLine._sKey = "line_" + oFrom.getKey() + "-" + oTo.getKey() + "[" + iIndex + "]";
				}

				if (oFrom._oGroup) {
					oFrom._oGroup.aLines.push(oLine);
					oFrom._oGroup.aChildren.push(oTo);
				}
				if (oTo._oGroup) {
					oTo._oGroup.aParentLines.push(oLine);
					oTo._oGroup.aParents.push(oFrom);
				}

				return false;
			}, this);
		}.bind(this);

		var fnProcessNestedGroups = function () {
			this.getGroups().forEach(function (oGroup) {
				var sParentKey = oGroup.getParentGroupKey();
				if (sParentKey) {
					var oParentGroup = this.mGroups[sParentKey];
					if (oParentGroup) {
						oGroup._oParentGroup = oParentGroup;
						oParentGroup.aChildGroups.push(oGroup);
					}
				}
			}.bind(this));

			// calculate nested levels
			this.getGroups().forEach(function (oGroup) {
				var iLevel = 0,
					oParentGroup = oGroup._oParentGroup,
					bSet = false,
					oTopGroup = oGroup;

				while (oParentGroup) {
					if (oParentGroup.getCollapsed() && !bSet) {
						oGroup._oCollapsedByParent = oParentGroup;
						bSet = true;
					}

					oTopGroup = oParentGroup;
					oParentGroup = oParentGroup._oParentGroup;

					iLevel++;
				}

				oGroup._iNestedLevel = iLevel;
				oGroup._oTopParentGroup = oTopGroup;
			});
		}.bind(this);

		this._bRequiresDataProcessing = false;

		if (fnProcessGroups() || fnProcessNodes() || fnProcessLines()) {
			this._bIsInvalid = true;
			return false;
		}

		fnProcessNestedGroups();

		// process statuses
		this._oStatuses = {};
		this.getStatuses().forEach(function (oStatus) {
			var sKey = oStatus.getKey();
			if (sKey) {
				this._oStatuses[sKey] = oStatus;
			}
		}, this);

		this._bIsInvalid = false;
		return true;
	};

	Graph.prototype._validateLayout = function () {
		var bWrongNodeCoordinate,
			bWrongGroupCoordinate,
			bWrongLineCoordinate,
			sDetailErrorMessage = "";

		bWrongNodeCoordinate = this.getNodes().some(function (oNode) {
			if (oNode._isIgnored()) {
				return false;
			}

			sDetailErrorMessage = "Missing coordinates: Node(" + oNode.getKey() + ")";
			return !((oNode._oGroup && oNode._oGroup.getCollapsed()) || (isFinite(oNode.getX()) && isFinite(oNode.getY())));
		});
		if (bWrongNodeCoordinate) {
			this._fireFailure(Graph.FAILURE_TYPE.LAYOUT_FAILURE, sDetailErrorMessage);
			return false;
		}

		if (this._isLayered()) {
			bWrongGroupCoordinate = this.getGroups().some(function (oGroup) {
				if (oGroup._isIgnored()) {
					return false;
				}

				sDetailErrorMessage = "Missing coordinates: Group(" + oGroup.getKey() + ")";
				return !oGroup._isEmpty() && (!isFinite(oGroup.getX()) || !isFinite(oGroup.getY()));
			});
			if (bWrongGroupCoordinate) {
				this._fireFailure(Graph.FAILURE_TYPE.LAYOUT_FAILURE, sDetailErrorMessage);
				return false;
			}
		}

		bWrongLineCoordinate = this.getLines().some(function (oLine) {
			if (oLine._isIgnored()) {
				return false;
			}

			sDetailErrorMessage = "Missing coordinates: Line(" + oLine.getKey() + ")";
			return !oLine._validateLayout();
		});
		if (bWrongLineCoordinate) {
			this._fireFailure(Graph.FAILURE_TYPE.LAYOUT_FAILURE, sDetailErrorMessage);
			return false;
		}

		return true;
	};

	Graph.prototype._suggest = function (sTerm) {
		var fnAppendCustomData = function (oItem) {
			oItem.addCustomData(new CustomData({
				key: SUGGESTIONS.IsLastKey,
				value: "true",
				writeToDom: true
			}));
		};

		var fnRemoveCustomData = function (oItem) {
			var oCustomItem = Utils.find(oItem.getCustomData(), function (oCustomData) {
				return oCustomData.getKey() === SUGGESTIONS.IsLastKey;
			});

			if (oCustomItem) {
				oItem.removeCustomData(oCustomItem);
			}
		};

		var fnGetCustomData = function (oItem) {
			var oCustomItem = Utils.find(oItem.getCustomData(), function (oCustomData) {
				return oCustomData.getKey() === SUGGESTIONS.TypeKey;
			});

			return oCustomItem && oCustomItem.getValue();
		};

		var fnCreateDelimiters = function () {
			// last node and last line has special flag to draw delimiter
			var aItems = this._searchField.getSuggestionItems(),
				oItem, sType, sNextType;

			for (var i = 0; i < aItems.length; i++) {
				oItem = aItems[i];

				// remove "islast" flag (if there is any) from last suggestions
				fnRemoveCustomData(oItem);
				if (i < aItems.length - 1) {
					// find suggestion type of current and next item to see if this item is last of its type
					sType = fnGetCustomData(oItem);
					sNextType = fnGetCustomData(aItems[i + 1]);

					if (sType && sNextType) {
						// if the item is last of its type, add custom data (which will be rendered as special attribute and
						// so it can be styled properly

						if ((sType === SUGGESTIONS.Node && sNextType === SUGGESTIONS.Line) ||
							(sType === SUGGESTIONS.Line && sNextType === SUGGESTIONS.Group)) {
							fnAppendCustomData(oItem);
						}
					}
				}
			}
		}.bind(this);

		var aFilters = [],
			bExecuteDefault = this.fireEvent("searchSuggest", {
				term: sTerm
			}, true);

		if (bExecuteDefault) {
			if (sTerm) {
				aFilters = [
					new Filter([
						new Filter("text", function (sText) {
							return (sText.toLowerCase() || "").indexOf(sTerm.toLowerCase()) > -1;
						}),
						new Filter("description", function (sDesc) {
							return (sDesc.toLowerCase() || "").indexOf(sTerm.toLowerCase()) > -1;
						})
					], false)
				];
			}

			this._searchField.getBinding("suggestionItems").filter(aFilters);
			fnCreateDelimiters();
		}
		this._searchField.suggest();
	};

	/**
	 * Returns name of the select function for given element
	 *
	 * @param {sap.suite.ui.commons.networkgraph.ElementBase} oElement element
	 * @return {string} name of the select function for given element
	 * @private
	 */
	Graph.prototype._getElementSelectFunctionName = function (oElement) {
		var sSelectFunction = "";

		if (oElement instanceof Node) {
			sSelectFunction = "_selectNode";
		}

		if (oElement instanceof Line) {
			sSelectFunction = "_selectLine";
		}

		if (oElement instanceof Group) {
			sSelectFunction = "_selectGroup";
		}

		return sSelectFunction;
	};

	Graph.prototype._search = function (sSearchTerm, sKey) {
		var sSelectFunction, bExecuteDefault, oItem;

		bExecuteDefault = this.fireEvent("search", {
			term: sSearchTerm,
			key: sKey
		}, true);

		if (!bExecuteDefault) {
			return;
		}

		if (sSearchTerm) {
			oItem = Utils.find(this.getNodes(), function (oItem) {
				return sKey ? oItem.getKey() === sKey : oItem.getTitle() === sSearchTerm;
			});

			if (!oItem) {
				oItem = Utils.find(this.getLines(), function (oLine) {
					if (oLine._isLoop()) {
						return false;
					}
					return sKey ? oLine._getLineId() === sKey : oLine._createSuggestionHelpText() === sSearchTerm;
				});
			}

			if (!oItem) {
				oItem = Utils.find(this.getGroups(), function (oGroup) {
					return oGroup.aNodes.length > 0 && (sKey ? oGroup.getKey() === sKey : oGroup.getTitle() === sSearchTerm);
				});
			}

			if (oItem) {
				sSelectFunction = this._getElementSelectFunctionName(oItem);

				if (sSelectFunction) {
					this[sSelectFunction]({
						element: oItem,
						scroll: true,
						alwaysSelect: true
					});
				}
			}
		} else {
			this.deselect(false);
			this.setFocus(null);
		}
	};

	Graph.prototype._createToolbar = function () {
		var that = this;

		this._toolbar = new OverflowToolbar(this.getId() + "-toolbar", {
			content: [new ToolbarSpacer()]
		}).addStyleClass("sapSuiteUiCommonsNetworkGraphToolbar");
		this.addDependent(this._toolbar);

		//Removes the focus from the NetworkGraph and keeps the default value of aria-label on the NetworkGraph wrapper
		this._toolbar.ontouchstart = function () {
			this.setFocus(null);
			this.getDomRef("wrapper").setAttribute("aria-live", "off");
			this._setAriaLabelForWrapper(oResourceBundle.getText("NETWORK_GRAPH_ACCESSIBILITY_LABEL"));
		}.bind(this);

		// search
		this._searchField = new SearchField({
			layoutData: new OverflowToolbarLayoutData({
				priority: sap.m.OverflowToolbarPriority.NeverOverflow,
				shrinkable: true
			}),
			enableSuggestions: true,
			suggest: function (oEvent) {
				that._suggest(oEvent.getParameter("suggestValue"));
			},
			search: function (oEvent) {
				var sTerm = oEvent.getParameter("query"),
					oSuggestionItem = oEvent.getParameter("suggestionItem"),
					sKey;

				if (oSuggestionItem) {
					sKey = oSuggestionItem.getProperty("key");
				}

				that._search(sTerm, sKey);
			}
		}).addStyleClass("sapSuiteUiCommonsNetworkGraphSearchField");
		this._toolbar.addContent(this._searchField);

		// show hide legend
		this._toolbar.addContent(new ToggleButton({
			id: this.getId() + "-legendButton",
			type: ButtonType.Transparent,
			icon: "sap-icon://legend",
			//	text: oResourceBundle.getText("NETWORK_GRAPH_LEGEND"),
			tooltip: oResourceBundle.getText("NETWORK_GRAPH_LEGEND"),
			press: function (oEvent) {
				if (that.$legend.is(":visible")) {
					that.$legend.hide();
				} else {
					that.$legend.show();
				}
			}
		}));

		// zoom
		if (this.getEnableZoom()) {
			if (!this._oZoomLevelInvisibleText) {
				this._oZoomLevelInvisibleText = new InvisibleText();
				this._oZoomLevelInvisibleText.toStatic(); //Be aware that without a call the screen reader does not read the content.
			}
			this._zoomLabel = new Label({
				layoutData: new OverflowToolbarLayoutData({
					group: 1,
					priority: sap.m.OverflowToolbarPriority.Disappear
				}),
				text: "100%"
			});
			this._oZoomLevelInvisibleText.setText(oResourceBundle.getText("NETWORK_GRAPH_ZOOM_LEVEL") + ": " + "100%");
			this._zoomIn = new OverflowToolbarButton({
				layoutData: new OverflowToolbarLayoutData({
					group: 1
				}),
				type: ButtonType.Transparent,
				ariaDescribedBy: [this._oZoomLevelInvisibleText.getId()],
				text: oResourceBundle.getText("CHARTCONTAINER_ZOOMIN"),
				icon: "sap-icon://zoom-in",
				tooltip: oResourceBundle.getText("CHARTCONTAINER_ZOOMIN"),
				press: function (oEvent) {
					that._zoom({
						deltaY: 1
					});
				}
			});
			this._toolbar.addContent(this._zoomIn);

			this._toolbar.addContent(this._zoomLabel);

			this._zoomOut = new OverflowToolbarButton({
				layoutData: new OverflowToolbarLayoutData({
					group: 1
				}),
				type: ButtonType.Transparent,
				ariaDescribedBy: [this._oZoomLevelInvisibleText.getId()],
				text: oResourceBundle.getText("CHARTCONTAINER_ZOOMOUT"),
				icon: "sap-icon://zoom-out",
				tooltip: oResourceBundle.getText("CHARTCONTAINER_ZOOMOUT"),
				press: function (oEvent) {
					that._zoom({
						deltaY: -1
					});
				}
			});
			this._toolbar.addContent(this._zoomOut);
	}

		// fit to viewport
		this._zoomToFitButton = new OverflowToolbarButton({
			type: ButtonType.Transparent,
			icon: "sap-icon://popup-window",
			tooltip: oResourceBundle.getText("NETWORK_GRAPH_ZOOMTOFIT"),
			text: oResourceBundle.getText("NETWORK_GRAPH_ZOOMTOFIT"),
			press: this._fitToScreen.bind(this)
		});
		this._toolbar.addContent(this._zoomToFitButton);

		// Hide zoom buttons if drag and drop is enabled
		if (this._isDnDEnabled()) {
			this._zoomIn.setVisible(false);
			this._zoomOut.setVisible(false);
			this._zoomToFitButton.setVisible(false);
		}

		// toggle full screen
		this._oFullScreenButton = new OverflowToolbarButton({
			type: ButtonType.Transparent,
			text: oResourceBundle.getText("CALCULATION_BUILDER_ENTER_FULL_SCREEN_BUTTON"),
			icon: "sap-icon://full-screen",
			tooltip: oResourceBundle.getText("CALCULATION_BUILDER_ENTER_FULL_SCREEN_BUTTON"),
			press: this._toggleFullScreen.bind(this)
		});

		this._toolbar.addContent(this._oFullScreenButton);
	};

	Graph.prototype._fitToScreen = function () {
		var iHeightRatio = this.$scroller.height() / this._iHeight,
			iWidthRatio = this.$scroller.width() / this._iWidth,
			iFinalRatio = Math.min(iHeightRatio, iWidthRatio),
			iZoomLevel = ZOOM_MILESTONES.slice(-1);

		for (var i = 1; i < ZOOM_MILESTONES.length; i++) {
			if (iFinalRatio < ZOOM_MILESTONES[i]) {
				iZoomLevel = ZOOM_MILESTONES[i - 1];
				break;
			}
		}

		this._zoom({
			zoomLevel: iZoomLevel
		});
		this.oInvisibleMessage.announce(oResourceBundle.getText("NETWORK_GRAPH_ZOOMTOFIT_ANNOUNCEMENT", [iZoomLevel * 100]), InvisibleMessageMode.Assertive);
	};

	Graph.prototype._getZoomText = function () {
		return Math.floor((this._fZoomLevel * 100)) + "%";
	};

	Graph.prototype._toggleFullScreen = function () {

		if (this._bIsFullScreen == false) {
			this._sControlHeight = this.getHeight();
			this.setHeight("100%");
			this._sControlWidth = this.getWidth();
			this.setWidth("100%");
		}

		var fnSetFullScreenButton = function (sIcon, sText) {
			this._oFullScreenButton.setIcon(sIcon);
			this._oFullScreenButton.setText(sText);
			this._oFullScreenButton.setTooltip(sText);
		}.bind(this);

		if (this._bIsFullScreen) {
			fnSetFullScreenButton("sap-icon://full-screen", oResourceBundle.getText("CALCULATION_BUILDER_ENTER_FULL_SCREEN_BUTTON"));
		} else {
			fnSetFullScreenButton("sap-icon://exit-full-screen", oResourceBundle.getText("CALCULATION_BUILDER_EXIT_FULL_SCREEN_BUTTON"));
		}
		this._bIsFullScreen = !this._bIsFullScreen;

		if (!this._oFullScreenUtil) {
			this._oFullScreenUtil = FullScreenUtil;
		}

		this._oFullScreenUtil.toggleFullScreen(this, this._bIsFullScreen, this._oFullScreenButton, this._toggleFullScreen);

		if (this._bIsFullScreen == false) {
			this.setHeight(this._sControlHeight);
			this.setWidth(this._sControlWidth);
		}
	};

	Graph.prototype._setupKeyboardNavigation = function () {
		var aItems = [],
			aGrid = [[]],
			oLastItem,
			aLastRow;

		if (!this._isLayedOut()) {
			return;
		}

		this.getNodes().forEach(function (oNode) {
			if (oNode.isHidden() || oNode._isIgnored() || !oNode.getVisible()) {
				return;
			}
			aItems.push({
				item: oNode,
				x: oNode.getX(),
				y: oNode.getY()
			});
		});
		this.getLines().forEach(function (oLine) {
			if (oLine.isHidden() || oLine._isIgnored() || !oLine.getVisible() || oLine.getCoordinates().length < 2) {
				return;
			}
			var oBend = oLine.getCoordinates()[0],
				iX = oBend.getX(),
				iY = oBend.getY();
			oLine.getCoordinates().forEach(function (oBend) {
				if (iX > oBend.getX()) {
					iX = oBend.getX();
				}
				if (iY > oBend.getY()) {
					iY = oBend.getY();
				}
			});
			aItems.push({
				item: oLine,
				x: iX,
				y: iY
			});
		});
		this.getGroups().forEach(function (oGroup) {
			if (oGroup.isHidden() || oGroup._isEmpty() || !oGroup.getVisible()) {
				return;
			}
			aItems.push({
				item: oGroup,
				x: oGroup.getX(),
				y: oGroup.getY()
			});
		});
		aItems.sort(function (a, b) {
			if (a.y < b.y) {
				return -1;
			} else if (a.y > b.y) {
				return 1;
			} else if (a.x < b.x) {
				return -1;
			} else if (a.x > b.x) {
				return 1;
			} else {
				return 0;
			}
		});
		if (aItems.length > 0) {
			aLastRow = [aItems[0]];
			aGrid = [aLastRow];
			oLastItem = aItems[0];
			aItems.forEach(function (oItem, i) {
				if (i === 0) {
					return;
				}
				if (oItem.y === oLastItem.y) {
					aLastRow.push(oItem);
				} else {
					aLastRow = [oItem];
					aGrid.push(aLastRow);
				}
				oLastItem = oItem;
			});
		}
		aGrid = this._normalizeGrid(aGrid, aItems);

		if (!this._oKeyboardNavigator) {
			this._oKeyboardNavigator = new KeyboardNavigator(this);
			this.addDelegate(this._oKeyboardNavigator);
		}
		this._oKeyboardNavigator.setItems(aGrid);
		this._oKeyboardNavigator.setWrapperDom(this.getFocusDomRef());
	};

	Graph.prototype._normalizeGrid = function (aGrid, aItems) {
		if (aItems.length === 0) {
			return aGrid;
		}
		var oFirstItem = aItems[0],
			iMinX = oFirstItem.x,
			iMaxX = oFirstItem.x,
			iCols = 1,
			iBoundaryStep,
			iLastBoundary,
			aBoundaries = [],
			i;

		aItems.forEach(function (oItem) {
			if (oItem.x < iMinX) {
				iMinX = oItem.x;
			}
			if (oItem.x > iMaxX) {
				iMaxX = oItem.x;
			}
		});
		aGrid.forEach(function (aRow) {
			if (aRow.length > iCols) {
				iCols = aRow.length;
			}
		});
		iBoundaryStep = Math.abs(iMaxX - iMinX) / iCols;
		iLastBoundary = iMinX;
		for (i = 0; i < iCols; i++) {
			iLastBoundary += iBoundaryStep;
			aBoundaries.push(iLastBoundary);
		}
		return aGrid.map(function (aRow) {
			var aNewRow,
				iPos;
			if (aRow.length === iCols) {
				aNewRow = aRow;
			} else {
				aNewRow = [];
				iPos = 0;
				while (iPos < (iCols - aRow.length) && aBoundaries[iPos] < aRow[0].x) {
					iPos++;
					aNewRow.push(null);
				}
				aRow.forEach(function (oItem) {
					aNewRow.push(oItem);
					iPos++;
				});
				while (iPos < iCols) {
					aNewRow.push(null);
					iPos++;
				}
			}
			return aNewRow.map(function (oItem) {
				return oItem ? oItem.item : null;
			});
		});
	};

	Graph.prototype.getFocusDomRef = function () {
		return this.getDomRef("wrapper");
	};

	Graph.prototype._setupEvents = function () {
		// how many touchmove events are triggered before zoom is performed.
		// this prevents zooming to fast
		var TOUCH_ZOOM_RATING = 5;

		var iState = 0,
			oTouchCoord = {},
			$ctrlalert = this.$("ctrlalert"),
			$wrapper = this.$scroller;

		var fnDiff = function (o1, o2) {
			return Math.sqrt(Math.pow(o1.clientX - o2.clientX, 2) + Math.pow(o1.clientY - o2.clientY, 2));
		};

		var fnTouchStart = function (oOriginalEvent) {
			if (oOriginalEvent.touches && oOriginalEvent.touches.length === 2) {
				oTouchCoord = {
					t1: oOriginalEvent.touches[0],
					t2: oOriginalEvent.touches[1],
					diff: fnDiff(oOriginalEvent.touches[0], oOriginalEvent.touches[1])
				};
			}
		};

		var fnTouchMove = function (oOriginalEvent) {
			if (oOriginalEvent.touches && oOriginalEvent.touches.length === 2) {
				// trigger zoom every five events
				if (++iState === TOUCH_ZOOM_RATING) {
					var oT1 = oOriginalEvent.touches[0],
						oT2 = oOriginalEvent.touches[1],
						nDiff = fnDiff(oT1, oT2);

					this._zoom({
						point: {
							x: (oT1.clientX + oT2.clientX) / 2,
							y: (oT1.clientY + oT2.clientY) / 2
						},
						deltaY: nDiff - oTouchCoord.diff
					});
					iState = 0;

					oTouchCoord = {
						t1: oT1,
						t2: oT2,
						diff: nDiff
					};
				}
				oOriginalEvent.preventDefault();
			}
		}.bind(this);
		if (!this._bEventsAdded) {
			$wrapper.on("mousemove", function (oEvent) {
				this._mouseMove(oEvent.clientX, oEvent.clientY);
			}.bind(this));

			$wrapper.on("mouseleave", this._endDragging.bind(this));
			$wrapper.on("mouseup", this._mouseUp.bind(this));
			if (this.getEnableZoom() && !this._isDnDEnabled()) {
				// Disabling zooming capability in edit mode.
				// TODO: consider scaling when dragging and dropping nodes and update ghost image dimenstion and coordinates prediction, to allow zooming.
				$wrapper.on("wheel", function (oEvent) {
					if (this._wheel({
						x: oEvent.originalEvent.clientX,
						y: oEvent.originalEvent.clientY,
						deltaY: oEvent.originalEvent.deltaY,
						div: $ctrlalert,
						ctrl: oEvent.ctrlKey
					})) {
						oEvent.preventDefault();
					}
				}.bind(this));
			}

			// touch zoom
			$wrapper.on("touchstart", function (oEvent) {
				fnTouchStart(oEvent);
			});

			$wrapper.on("touchmove", function (oEvent) {
				fnTouchMove(oEvent);
			});

			this.getDomRef("wrapper").addEventListener("keydown",(oEvent) => {
				var oScroller = this.$scroller[0];
				setTimeout(() => {
					// Check whether the focus is not on childElements
					if (!document.querySelector(".sapSuiteUiCommonsNetworkElementFocus")) {
						var iX = 0;
						var iY = 0;

						// Handle horizontal movement
						if (oEvent.key === "ArrowLeft") {
							iX = -MOVING_THRESHOLD;
						} else if (oEvent.key === "ArrowRight") {
							iX = MOVING_THRESHOLD;
						}

						// Handle vertical movement
						if (oEvent.key === "ArrowUp") {
							iY = -MOVING_THRESHOLD;
						} else if (oEvent.key === "ArrowDown") {
							iY = MOVING_THRESHOLD;
						}

						oScroller.scrollTop = oScroller.scrollTop + iY;
						oScroller.scrollLeft = oScroller.scrollLeft + iX;
					}
				}, 0);
			});
			this._bEventsAdded = true;
		}


		// in swimlanes we don't put lanes beneeth groups (due to the collapsed groups)
		// so we put z-index of groups in front of the lanes but then we have to attach events to svg
		var $eventWrapper = this._isSwimLane() ? this.$svg : this.$divgroups;
		if (!$eventWrapper._eventAdded) {
			$eventWrapper.on("mousedown", function (oEvent) {
				this._mouseDown(oEvent.clientX, oEvent.clientY);
				oEvent.preventDefault();
			}.bind(this));
			$eventWrapper._eventAdded = true;
		}
	};

	Graph.prototype._wheel = function (mArguments) {
		if (this.getEnableWheelZoom() || mArguments.ctrl) {
			mArguments.div.css("opacity", "0");
			var iSmoothWheelZoom = this.getProperty("_smoothWheelZoom");
			var throttledZoom = iSmoothWheelZoom > 0 ?
			 Utils.throttle(this._zoom.bind(this), iSmoothWheelZoom) :
			 this._zoom.bind(this);

			throttledZoom({
				point: {
					x: mArguments.x,
					y: mArguments.y
				},
				deltaY: -mArguments.deltaY
			});

			this._zoomLabel.setText(this._getZoomText());
			this._oZoomLevelInvisibleText.setText(oResourceBundle.getText("NETWORK_GRAPH_ZOOM_LEVEL") + ": " + this._getZoomText());
			return true;
		}
		return false;
	};

	Graph.prototype._endDragging = function () {
		this._oPanning.dragging = false;
		this.$scroller.removeClass("sapSuiteUiCommonsNetworkGraphPanning");
	};

	Graph.prototype._mouseMove = function (iX, iY) {
		var oScroller = this.$scroller[0];

		if (this._oPanning.dragging) {
			if (!this.$scroller.hasClass("sapSuiteUiCommonsNetworkGraphPanning")) {
				this.$scroller.addClass("sapSuiteUiCommonsNetworkGraphPanning");
			}

			oScroller.scrollTop = oScroller.scrollTop - (iY - this._oPanning.lastY);
			oScroller.scrollLeft = oScroller.scrollLeft - (iX - this._oPanning.lastX);

			this._oPanning.lastX = iX;
			this._oPanning.lastY = iY;
		}
	};

	Graph.prototype._mouseDown = function (iX, iY) {
		this.deselect(false);
		this.setFocus(null);

		this._oPanning.lastX = iX;
		this._oPanning.lastY = iY;
		this._oPanning.dragging = true;

		this._tooltip.instantClose();

		// Remove all ports when deselecting
		if (PortManager._currentTriggerNodeKey !== null) {
			PortManager.removeAllPorts();
		}
	};

	Graph.prototype._mouseUp = function () {
		this._endDragging();
	};

	Graph.prototype._preventZoomToChangeLineWidth = function () {
		return this._isLayered() && (this._fZoomLevel >= 0.5 && this._fZoomLevel < 2);
	};

	Graph.prototype._setLineClasses = function () {
		var $this = this.$(),
			sFnName = this._preventZoomToChangeLineWidth() ? "addClass" : "removeClass",
			sFnCrispName = (this._fZoomLevel < 0.5) ? "removeClass" : "addClass";

		// force 1px width despite of zoom level
		$this[sFnName]("sapSuiteUiCommonsNetworkGraphDefaultLineWidth");

		// turn of/on anti-aliasing
		$this[sFnCrispName]("sapSuiteUiCommonsNetworkGraphCrispEdges");
	};

	Graph.prototype._zoom = function (mParameters) {
		var sBox = this.$svg[0].getAttribute("viewBox"),
			iLevelDelta = mParameters.deltaY < 0 ? -1 : 1,
			oOldPoint, oNewPoint, newIndex,
			sNewBox;

		var fnGetClosestZoomLevelIndex = function (fZoomLevel) {
			var iClosestIndex = 0,
				fMinDiff;

			ZOOM_MILESTONES.forEach(function (fMileStone, iIndex) {
				var fDiff = Math.abs(fZoomLevel - fMileStone);
				if (fDiff < fMinDiff || fMinDiff === undefined) {
					iClosestIndex = iIndex;
					fMinDiff = fDiff;
				}
			});

			return iClosestIndex;
		};

		if (!mParameters.point) {
			mParameters.point = {
				x: this.$scroller.width() / 2,
				y: this.$scroller.height() / 2
			};
		}

		oOldPoint = this.getCorrectMousePosition({
			x: mParameters.point.x,
			y: mParameters.point.y
		});


		if (mParameters.zoomLevel || mParameters.zoomLevel === 0) {
			this._fZoomLevel = mParameters.zoomLevel;
		} else {
			newIndex = fnGetClosestZoomLevelIndex(this._fZoomLevel);

			// correctly jump to closest zoom level
			if (ZOOM_MILESTONES.indexOf(this._fZoomLevel) < 0) {
				if (this._fZoomLevel > ZOOM_MILESTONES[newIndex]) {
					newIndex = iLevelDelta < 0 ? newIndex : newIndex + iLevelDelta;
				} else {
					newIndex = iLevelDelta > 0 ? newIndex : newIndex + iLevelDelta;
				}
			} else {
				newIndex += iLevelDelta;
			}

			if (newIndex < 0) {
				newIndex = 0;
			} else if (newIndex > ZOOM_MILESTONES.length - 1) {
				newIndex = ZOOM_MILESTONES.length - 1;
			}
			this._fZoomLevel = ZOOM_MILESTONES[newIndex];
		}

		if (this._fZoomLevel < 0) {
			this._fZoomLevel = 0;
		}

		if (!sBox) {
			sNewBox = "0 0 " + Math.round(this.$svg.width()) + " " + Math.round(this.$svg.height());
			this.$svg[0].setAttribute("viewBox", sNewBox);
		}

		this.$svg.width(Math.round(this._iWidth * this._fZoomLevel));
		this.$svg.height(Math.round(this._iHeight * this._fZoomLevel));

		this.$background.width(Math.round(this._iWidth * this._fZoomLevel));
		this.$background.height(Math.round(this._iHeight * this._fZoomLevel));


		oNewPoint = this.getCorrectMousePosition({
			x: mParameters.point.x,
			y: mParameters.point.y
		});

		this.$scroller[0].scrollLeft += (oOldPoint.x - oNewPoint.x) * this._fZoomLevel;
		this.$scroller[0].scrollTop += (oOldPoint.y - oNewPoint.y) * this._fZoomLevel;

		this._zoomLabel.setText(this._getZoomText());
		this._oZoomLevelInvisibleText.setText(oResourceBundle.getText("NETWORK_GRAPH_ZOOM_LEVEL") + ": " + this._getZoomText());

		if (this._fZoomLevel < ZOOM_OUT_RATING) {
			this.$svg.addClass("sapSuiteUiCommonsNetworkGraphZoomedOut");
		} else {
			this.$svg.removeClass("sapSuiteUiCommonsNetworkGraphZoomedOut");
		}

		if (this._isUseNodeHtml()) {
			this.$("divnodes").css("transform", "scale(" + this._fZoomLevel + ")");
		}

		this.$("divgroups").css("transform", "scale(" + this._fZoomLevel + ")");
		this.$tooltips.css("transform", "scale(" + this._fZoomLevel + ")");

		this._setLineClasses();
		this.fireEvent("zoomChanged");
	};

	Graph.prototype._createSearchSuggestItems = function () {
		var TITLE_LENGTH = 50;

		var oData = {
			items: []
		}, aNodes = this.getNodes().sort(function (oNode1, oNode2) {
			return oNode1.getTitle().localeCompare(oNode2.getTitle());
		}), aLines = this.getLines().sort(function (oLine1, oLine2) {
			var sLine1Title = oLine1.getTitle(),
				sLine2Title = oLine2.getTitle();

			// for lines with same (usually no) title use title of from node to compare
			if (sLine1Title === sLine2Title) {
				return oLine1.getFromNode().getTitle().localeCompare(oLine2.getFromNode().getTitle());
			}
			return sLine1Title.localeCompare(sLine2Title);
		}), aGroups = this.getGroups().sort(function (oGroup1, oGroup2) {
			return oGroup1.getTitle().localeCompare(oGroup2.getTitle());
		});

		this._oSuggestionItemsModel = new JSONModel();
		// indicates current count of suggestion items when they are rendered
		this._oSuggestionItemsModel.setSizeLimit(SUGGESTION_ITEMS_LIMIT);

		aNodes.forEach(function (oNode) {
			var sTitle = Utils.trimText(oNode.getTitle(), TITLE_LENGTH);
			oData.items.push({
				text: sTitle ? sTitle : oNode.getKey(),
				type: SUGGESTIONS.Node,
				icon: oNode.getIcon(),
				key: oNode.getKey(),
				description: "(" + oResourceBundle.getText("NETWORK_GRAPH_NODE") + ")"
			});
		});

		aLines.forEach(function (oLine) {
			if (oLine._isLoop()) {
				return;
			}
			if (oLine.getTitle() || oLine.getFromNode().getTitle() || oLine.getToNode().getTitle()) {
				oData.items.push({
					text: oLine._createSuggestionHelpText(),
					type: SUGGESTIONS.Line,
					key: oLine._getLineId(),
					description: "(" + oResourceBundle.getText("NETWORK_GRAPH_LINE") + ")"
				});
			}
		});

		aGroups.forEach(function (oGroup) {
			var sTitle = Utils.trimText(oGroup.getTitle(), TITLE_LENGTH);
			if (oGroup.aNodes.length > 0) {
				oData.items.push({
					text: sTitle ? sTitle : oGroup.getKey(),
					key: oGroup.getKey(),
					type: SUGGESTIONS.Group,
					description: "(" + oResourceBundle.getText("NETWORK_GRAPH_GROUP") + ")"
				});
			}
		});

		this._oSuggestionItemsModel.setData(oData);
		this._searchField.setModel(this._oSuggestionItemsModel);
		this._searchField.bindAggregation("suggestionItems", {
			path: "/items",
			template: new SuggestionItem({
				text: "{text}",
				icon: "{icon}",
				key: "{key}",
				description: "{description}",
				customData: new CustomData({
					key: "type",
					value: "{type}"
				})
			})
		});
	};

	Graph.prototype._scrollToElement = function (oItem) {
		var bIsInCollapsedGroup = oItem._oGroup && oItem._oGroup.getCollapsed(),
			fX, fY, fWidth, fHeight, oSource, oTarget;

		if (bIsInCollapsedGroup) {
			oItem = oItem._oGroup;
		}

		if (oItem instanceof Line) {
			oSource = oItem.getSource();
			oTarget = oItem.getTarget();
			fWidth = Math.abs(oTarget.getX() - oSource.getX());
			fHeight = Math.abs(oTarget.getY() - oSource.getY());
			fX = Math.min(oSource.getX(), oTarget.getX());
			fY = Math.max(oSource.getY(), oTarget.getY());
		} else {
			fX = oItem.getX();
			fY = oItem.getY();
			fWidth = oItem._iWidth;
			fHeight = oItem._iHeight;
		}

		const fScrollLeft = ((fX + (fWidth ? fWidth : 0) / 2) * this._fZoomLevel) - (this.$scroller.width() / 2);

		if (this._bIsRtl) {
			this.$scroller.get(0).scrollLeft = -fScrollLeft;
		} else {
			this.$scroller.get(0).scrollLeft = fScrollLeft;
		}
		this.$scroller.get(0).scrollTop = ((fY + (fHeight ? fHeight : 0) / 2) * this._fZoomLevel) - (this.$scroller.height() / 2);
	};

	/**
	 * Ensures that given item is in visible section of scroll area.
	 * @param {sap.suite.ui.commons.networkgraph.ElementBase} oItem Item to ensure visibility for.
	 * @private
	 */
	Graph.prototype._ensureOnScreen = function (oItem) {
		if (!oItem || !this.$scroller) {
			return;
		}

		var oArrowPos, iCenterX, iCenterY,
			oScroller = this.$scroller[0],
			iLeft = oScroller.scrollLeft / this._fZoomLevel,
			iTop = oScroller.scrollTop / this._fZoomLevel,
			iRight = iLeft + this.$scroller.width() / this._fZoomLevel,
			iBottom = iTop + this.$scroller.height() / this._fZoomLevel;

		if (this._bIsRtl) {
			const iGraphWidth = this.$svg.width() / this._fZoomLevel;
			const iViewportWidth = this.$scroller.width() / this._fZoomLevel;
			const iScrollPosAbs = Math.abs(iLeft);
			iLeft = iGraphWidth - iScrollPosAbs - iViewportWidth;
			iRight = iLeft + iViewportWidth;
		}

		if (!oItem._isOnScreen(iLeft, iRight, iTop, iBottom)) {
			if (oItem instanceof Node) {
				iCenterX = oItem.getX() + oItem._iWidth / 2;
				iCenterY = oItem.getY() + oItem._iHeight / 2;
			} else if (oItem instanceof Line) {
				oArrowPos = oItem._getArrowFragmentVector();
				iCenterX = (oArrowPos.center.x + oArrowPos.apex.x) / 2;
				iCenterY = (oArrowPos.center.y + oArrowPos.apex.y) / 2;
			} else if (oItem instanceof Group) {
				iCenterX = oItem.getX();
				iCenterY = oItem.getY();
			}

			if (iCenterX < iLeft || iCenterX > iRight) {
				let iTargetScrollLeft = iCenterX * this._fZoomLevel - this.$scroller.width() / 2;

				if (this._bIsRtl) {
					const iScrollRange = oScroller.scrollWidth - oScroller.clientWidth;
					iTargetScrollLeft = -(iScrollRange - iTargetScrollLeft);
				}

				oScroller.scrollLeft = iTargetScrollLeft;
			}
			if (iCenterY < iTop || iCenterY > iBottom) {
				oScroller.scrollTop = iCenterY * this._fZoomLevel - this.$scroller.height() / 2;
			}
		}
	};

	Graph.prototype._createLegend = function () {
		var oRm = new RenderManager();
		var $legend = this.$("legend"),
			that = this,
			oNodeStatuses = {}, oLineStatuses = {}, oGroupStatuses = {};

		var fnAddElement = function (oElement, oItemStatuses) {
			var sStatus = encodeXML(oElement.getStatus());
			if (sStatus) {
				if (oItemStatuses[sStatus]) {
					oItemStatuses[sStatus].push(oElement);
				} else {
					oItemStatuses[sStatus] = [oElement];
				}
			}
		};

		var fnHasStatus = function (oItemStatuses) {
			return Object.keys(oItemStatuses).length > 0;
		};

		var fnAppendLine = function (sStatus, sLabel, sType) {
			var oCustomStatus = this._oStatuses[sStatus],
				sColor = oCustomStatus && oCustomStatus._getLegendColor(),
				bisSemanticColor = SemanticColorType.hasOwnProperty(sColor),
				/** @deprecated As of 1.120 */
				sStyle = (sColor && !bisSemanticColor) ? "background-color:" + sColor : "",
				sClass = (sColor && bisSemanticColor) ? Utils.SEMANTIC_CLASS_NAME.BACKGROUND + sColor : "";

			this._renderControl.call(that, "div", {
				status: sStatus,
				elementtype: sType,
				"class": "sapSuiteUiCommonsNetworkGraphLegendLine"
			}, false, oRm);

			var sLegendClass = "sapSuiteUiCommonsNetworkGraphLegendColorLine " + this._getStatusClass(sStatus);
			if (sClass) {
				sLegendClass += " " + sClass;
			}
			this._renderControl.call(that, "div", {
				"class": sLegendClass,
				/** @deprecated As of 1.120 */
				"style": sStyle
			}, null, oRm); this._renderControl.call(that, "label", {
				"class": "sapSuiteUiCommonsNetworkGraphLegendLineLabel"
			}, false, oRm);
			oRm.text(this._oLegendLabels[sType + sStatus] ? this._oLegendLabels[sType + sStatus] : sLabel);
			oRm.close("label");
			oRm.close("div");
		}.bind(this);

		var fnProcessElements = function (aItems, oCollection, sClass, sTitle, sStatusType) {
			aItems.forEach(function (oItem) {
				fnAddElement(oItem, oCollection);
			});

			if (fnHasStatus(oCollection)) {
				oRm.openStart("div").class(sClass).openEnd();
				oRm.openStart("label").class("sapSuiteUiCommonsNetworkGraphLegendTitle").openEnd();
				oRm.text(oResourceBundle.getText(sTitle));
				oRm.close("label");
				oRm.close("div");
				// get the status labels for sorting (some statuses can have custom labels)
				var oStatuses = Object.keys(oCollection).reduce(function (oAcc, sKey) {
					var sLabel;

					if (this._oLegendLabels[sStatusType + sKey]) {
						sLabel = this._oLegendLabels[sStatusType + sKey];
					} else {
						var oCustomStatus = this._oStatuses[sKey];
						sLabel = oCustomStatus ? (oCustomStatus.getTitle() || sKey) : oResourceBundle.getText("NETWORK_GRAPH_" + sKey.toUpperCase());
					}

					oAcc[sKey] = sLabel;
					return oAcc;
				}.bind(this), {});

				Object.keys(oCollection).sort(function (a, b) {
					return (oStatuses[a] || "").localeCompare(oStatuses[b]);
				}).forEach(function (sKey) {
					fnAppendLine(sKey, oStatuses[sKey], sStatusType);
				});
			}
		}.bind(this);

		if (this.getLegend()) {
			// legend is already rendered in renderer with render control over aggregation
			return;
		}

		if (!$legend[0]) {
			return;
		}

		fnProcessElements(this.getNodes(), oNodeStatuses, "sapSuiteUiCommonsNetworkGraphLegendTitleNode",
			"NETWORK_GRAPH_NODES", StatusType.Node);
		fnProcessElements(this.getLines(), oLineStatuses, "sapSuiteUiCommonsNetworkGraphLegendTitleLine",
			"NETWORK_GRAPH_LINES", StatusType.Line);
		fnProcessElements(this.getGroups(), oGroupStatuses, "sapSuiteUiCommonsNetworkGraphLegendTitleLine",
			"NETWORK_GRAPH_GROUPS", StatusType.Group);
		oRm.flush($legend[0]);
		oRm.destroy();
		// $legend.html(sHtml);

		//After the Network Graph is rendered, check if the Legend Button is enabled then display te Legend Details.
		if (Element.getElementById(this.getId() + "-legendButton").getPressed()) {
			this.getDomRef("legend").style.display = "block";
		}

		// events
		this.$().find(".sapSuiteUiCommonsNetworkGraphLegendLine").on("click", function (oEvent) {
			var sStatus = jQuery(this).attr("status"),
				sType = jQuery(this).attr("elementtype"), oCollection;

			if (sType === StatusType.Node) {
				oCollection = oNodeStatuses;
			}

			if (sType === StatusType.Line) {
				oCollection = oLineStatuses;
			}

			if (!oEvent.ctrlKey) {
				that.deselect(false);
				that.setFocus(null);
			}

			if (sType !== StatusType.Group && oCollection[sStatus]) {
				oCollection[sStatus].forEach(function (oElement) {
					oElement.setSelected(true);
				});
			}
		});
	};

	Graph.prototype._selectElement = function (mArguments) {
		var bIsToBeSelected = mArguments.element && !mArguments.element.getSelected(),
			aItems = [];

		var fnSetElementData = function (bValue) {
			mArguments.element.setSelected(bValue);
			if (mArguments.setFocus !== false) {
				// selecting element have always focus (only in cases) when we don't want to manipulate focus at all
				this.setFocus({
					item: mArguments.element
				});
			}
		}.bind(this);

		// remove last item action button class
		this.$("svg").find("." + this.VISIBLE_ACTIONS_BUTTONS_CLASS).removeClass(this.VISIBLE_ACTIONS_BUTTONS_CLASS);

		if (!mArguments.preventDeselect) {
			aItems = this.deselect(true);
			if (mArguments.setFocus) {
				this.setFocus(null);
			}
			fnSetElementData(bIsToBeSelected || mArguments.alwaysSelect);
		} else {
			fnSetElementData(bIsToBeSelected);
		}

		if (!mArguments.element._hasFocus() && mArguments.forceFocus) {
			this.setFocus({
				item: mArguments.element
			});
		}

		if (!aItems.some(function (oL) {
			return oL === mArguments.element;
		})) {
			aItems.push(mArguments.element);
		}

		this.fireSelectionChange({ items: aItems });
	};

	Graph.prototype._selectLine = function (mArguments) {
		var oFrom = mArguments.element.getFromNode(),
			oTo = mArguments.element.getToNode(),
			oGroup = (oFrom._isInCollapsedGroup() && (oFrom._oGroup === oTo._oGroup)) ? oTo._oGroup : null;
		if (mArguments.scroll) {
			this._scrollToElement(oGroup || mArguments.element);
		}
		if (!oGroup) {
			this._selectElement(mArguments);
		}
	};

	Graph.prototype._selectNode = function (mArguments) {
		var oGroup = mArguments.element._isInCollapsedGroup() ? mArguments.element._oGroup : null;
		if (mArguments.scroll) {
			this._scrollToElement(oGroup || mArguments.element);
		}
		if (!oGroup) {
			this._selectElement(mArguments);
			if (mArguments.renderActionButtons !== false) {
				mArguments.element.showActionButtons(true);
			}
		}
	};

	Graph.prototype._selectGroup = function (mArguments) {
		if (mArguments.scroll) {
			this._scrollToElement(mArguments.element);
		}
		this.setFocus({ item: mArguments.element });
	};

	Graph.prototype._applyLayout = function () {
		var oLayoutTask;

		this._iRunningLayouts++;
		oLayoutTask = this._getLayoutAlgorithm().layout().catch(function (oError) {
			this._fireFailure(Graph.FAILURE_TYPE.LAYOUT_FAILURE, oError);
			return Promise.reject();
		}.bind(this)).then(function () {
			return new Promise(function (resolve, reject) {
				if (oLayoutTask.isTerminated()) {
					resolve();
					return;
				}
				if (this._validateLayout()) {
					resolve();
				} else {
					reject();
				}
			}.bind(this));
		}.bind(this));

		if (this._oLastLayout && this._iRunningLayouts > 1) {
			this._oLastLayout.terminate();
		}
		this._oLastLayout = oLayoutTask;

		return oLayoutTask;
	};

	/**
	 * Set accessibility title for given graph item.
	 * @param {sap.suite.ui.commons.networkgraph.SvgBase} oItem Item to set title for or null, if default title to be set.
	 * @private
	 */
	Graph.prototype._setAccessibilityTitle = function (oItem) {
		var sLabel,
			oWrapper = this.$("accessibility");
		if (oItem === null) {
			sLabel = oResourceBundle.getText("NETWORK_GRAPH_ACCESSIBILITY_CONTENT");
		} else if (typeof oItem === "string") {
			sLabel = oItem;
		} else {
			sLabel = oItem._getAccessibilityLabel(this);
		}
		if (oWrapper && oWrapper.length) {
			// Switch to assertive only when deliberately updating text, so re-render
			// of the div (which resets to default text) does not trigger an announcement.
			oWrapper[0].setAttribute("aria-live", "assertive");
			oWrapper.html(encodeXML(sLabel));
		}
	};

	Graph.prototype._isTopBottom = function () {
		return this.getOrientation() === Orientation.TopBottom;
	};

	Graph.prototype._isBottomTop = function () {
		return this.getOrientation() === Orientation.BottomTop;
	};

	Graph.prototype._isRightLeft = function () {
		return this.getOrientation() === Orientation.RightLeft;
	};

	/* =========================================================== */
	/* Setters & Private helper methods*/
	/* =========================================================== */
	/**
	 * Returns the layouting algorithm to use. It's either getLayoutAlgorithm or a default algorithm.
	 * @returns {LayoutAlgorithm} Algorithm that is set to compute layout of the graph
	 * @private
	 */
	Graph.prototype._getLayoutAlgorithm = function () {
		return this.getLayoutAlgorithm() || this._getDefalutLayout();
	};

	Graph.prototype._isUseNodeHtml = function () {
		return this.getRenderType() === RenderType.Html;
	};

	Graph.prototype._getDefalutLayout = function () {
		if (!this._oDefalutLayout) {
			this._oDefaultLayout = new LayeredLayout();
			this._oDefaultLayout.setParent(this, null, true);
		}
		return this._oDefaultLayout;
	};

	Graph.prototype._isLayered = function () {
		var sRenderType = this._getLayoutAlgorithm().getLayoutRenderType();

		return sRenderType === LayoutRenderType.SwimLanes || sRenderType === LayoutRenderType.LayeredWithGroups || sRenderType === LayoutRenderType.TwoColumns;
	};

	Graph.prototype._isSwimLane = function () {
		return this._getLayoutAlgorithm().getLayoutRenderType() === LayoutRenderType.SwimLanes;
	};

	Graph.prototype._isTwoColumnsLayout = function () {
		return this._getLayoutAlgorithm().getLayoutRenderType() === LayoutRenderType.TwoColumns;
	};

	Graph.prototype._isDelayedLayouting = function () {
		// for HTML nodes rendering we always use delayed rendering
		if (this._isUseNodeHtml()) {
			return true;
		}

		return this.getNodes().some(function (oNode) {
			var bHasComputeEvent = oNode.hasListeners("computeSizes");

			return bHasComputeEvent || oNode._useAutomaticSize() || oNode.getTitleLineSize() !== 1 || oNode._displayDescription();
		});
	};

	Graph.prototype._isLayedOut = function () {
		return this._bIsLayedOut;
	};

	Graph.prototype.setEnableZoom = function (bValue) {
		if (this._toolbar) {
			this._zoomLabel.setVisible(bValue);
			this._zoomIn.setVisible(bValue);
			this._zoomOut.setVisible(bValue);
		}

		this.setProperty("enableZoom", bValue);

		return this;
	};
	Graph.prototype.setDisableToolbarButtons = function (bValue) {
		this._toolbar.setEnabled(bValue);
		return this;
	};
	/**
	 * @param {string} sAggregationName Name of the aggregation to destroy
	 * @param {boolean} bSuppressInvalidate Whether to suppress resulting invalidation
	 * @private
	 */
	Graph.prototype.destroyAggregation = function (sAggregationName, bSuppressInvalidate) {
		this._bRequiresDataProcessing = true;
		Control.prototype.destroyAggregation.call(this, sAggregationName, bSuppressInvalidate);
	};

	/**
	 * @param {string} sAggregationName Name of the aggregation to insert the object into
	 * @param {object} oObject Object to insert into the aggregation
	 * @param {number} iIndex Index at which insert the object
	 * @param {boolean} bSuppressInvalidate Whether to suppress resulting invalidation
	 * @private
	 */
	Graph.prototype.insertAggregation = function (sAggregationName, oObject, iIndex, bSuppressInvalidate) {
		this._bRequiresDataProcessing = true;
		Control.prototype.insertAggregation.call(this, sAggregationName, oObject, iIndex, bSuppressInvalidate);
	};

	/**
	 * @param {string} sAggregationName Name of the aggregation to remove the object from
	 * @param {object} oObject Object to remove from the aggregation
	 * @param {boolean} bSuppressInvalidate Whether to suppress resulting invalidation
	 * @private
	 */
	Graph.prototype.removeAggregation = function (sAggregationName, oObject, bSuppressInvalidate) {
		this._bRequiresDataProcessing = true;
		Control.prototype.removeAggregation.call(this, sAggregationName, oObject, bSuppressInvalidate);
	};

	/**
	 * @param {string} sAggregationName Name of the aggregation to add the object into
	 * @param {object} oObject Object to add into the aggregation
	 * @param {boolean} bSuppressInvalidate Whether to suppress resulting invalidation
	 * @private
	 */
	Graph.prototype.addAggregation = function (sAggregationName, oObject, bSuppressInvalidate) {
		this._bRequiresDataProcessing = true;
		Control.prototype.addAggregation.call(this, sAggregationName, oObject, bSuppressInvalidate);
	};

	/**
	 * @param {string} sAggregationName Name of the aggregation to remove all objects from
	 * @param {boolean} bSuppressInvalidate Whether to suppress resulting invalidation
	 * @private
	 */
	Graph.prototype.removeAllAggregation = function (sAggregationName, bSuppressInvalidate) {
		this._bRequiresDataProcessing = true;
		Control.prototype.removeAllAggregation.call(this, sAggregationName, bSuppressInvalidate);
	};

	/**
	 * @param {string} sName Name of the aggregation being updated
	 * @private
	 */
	Graph.prototype.updateAggregation = function (sName) {
		this._bNeedNodeProcessing = true;
		Control.prototype.updateAggregation.call(this, sName);
	};

	Graph.prototype.invalidate = function () {
		if (this._bPreventInvalidation !== true) {
			Control.prototype.invalidate.call(this);
		}
	};

	/**
	 * Checks if the current layout algorithm supports node ports functionality.
	 * For now, only NoopLayout algorithms support node ports.
	 *
	 * @returns {boolean} True if the layout supports node ports, false otherwise
	 * @private
	 */
	Graph.prototype._supportsNodePorts = function () {
		return this.getNodePorts() !== "None" && this._isDnDEnabled();
	};

	return Graph;
});