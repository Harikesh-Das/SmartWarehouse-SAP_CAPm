/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/security/encodeXML", "sap/fe/base/ClassSupport", "sap/fe/base/jsx-runtime/jsx", "sap/fe/controls/easyFilter/Token", "sap/m/Button", "sap/m/FlexBox", "sap/m/Popover", "sap/m/Text", "sap/m/Tokenizer", "sap/m/VBox", "sap/m/library", "sap/ui/core/Control", "sap/ui/core/CustomData", "sap/ui/core/Lib", "sap/ui/core/library", "sap/base/util/deepClone", "sap/fe/base/BindingToolkit", "sap/fe/controls/AINotice", "sap/fe/controls/easyFilter/EasyFilterInput", "sap/m/HBox", "sap/m/MessageStrip", "sap/m/MessageToast", "sap/m/OverflowToolbar", "sap/m/ToggleButton", "sap/m/ToolbarSpacer", "sap/ui/core/InvisibleMessage", "sap/ui/core/message/MessageType", "sap/ui/model/FilterOperator", "sap/ui/performance/trace/FESRHelper", "./ErrorMessageHandler", "./PXFeedback", "./utils", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/Fragment", "sap/fe/base/jsx-runtime/jsxs"], function (Log, encodeXML, ClassSupport, jsx, Token, Button, FlexBox, Popover, Text, Tokenizer, VBox, library, Control, CustomData, Lib, coreLibrary, deepClone, BindingToolkit, AINotice, EasyFilterInput, HBox, MessageStrip, MessageToast, OverflowToolbar, ToggleButton, ToolbarSpacer, InvisibleMessage, MessageType, FilterOperator, FESRHelper, ErrorMessageHandler, PXFeedback, EasyFilterUtils, _jsx, _Fragment, _jsxs) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21;
  function __ui5_require_async(path) {
    return new Promise((resolve, reject) => {
      sap.ui.require([path], module => {
        if (!(module && module.__esModule)) {
          module = module === null || !(typeof module === "object" && path.endsWith("/library")) ? {
            default: module
          } : module;
          Object.defineProperty(module, "__esModule", {
            value: true
          });
        }
        resolve(module);
      }, err => {
        reject(err);
      });
    });
  }
  var _exports = {};
  var triggerPXIntegration = PXFeedback.triggerPXIntegration;
  var not = BindingToolkit.not;
  var bindState = BindingToolkit.bindState;
  var and = BindingToolkit.and;
  var ValueState = coreLibrary.ValueState;
  var InvisibleMessageMode = coreLibrary.InvisibleMessageMode;
  var TokenizerRenderMode = library.TokenizerRenderMode;
  var PlacementType = library.PlacementType;
  var FlexWrap = library.FlexWrap;
  var FlexJustifyContent = library.FlexJustifyContent;
  var FlexAlignItems = library.FlexAlignItems;
  var ButtonType = library.ButtonType;
  var property = ClassSupport.property;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var defineState = ClassSupport.defineState;
  var defineReference = ClassSupport.defineReference;
  var createReference = ClassSupport.createReference;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  //For current release we are ignoring "All" and "Any"
  //We can incorporate these values in future
  //We will be handling "ALL" and "ANY" at later point of time
  // We need the third arguement because there might be a chance of composite keys scenario
  /*
   * Delivery for beta release for the easy filter feature.
   */
  let EasyFilterBarContainer = (_dec = defineUI5Class("sap.fe.controls.easyFilter.EasyFilterBarContainer"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "array"
  }), _dec6 = property({
    type: "array"
  }), _dec7 = property({
    type: "function"
  }), _dec8 = defineReference(), _dec9 = defineReference(), _dec10 = aggregation({
    type: "sap.ui.core.Control"
  }), _dec11 = aggregation({
    type: "sap.ui.core.Control"
  }), _dec12 = event(), _dec13 = event(), _dec14 = event(), _dec15 = event(), _dec16 = event(), _dec17 = event(), _dec18 = event(), _dec19 = event(), _dec20 = event(), _dec21 = event(), _dec22 = defineState(), _dec(_class = (_class2 = /*#__PURE__*/function (_Control) {
    function EasyFilterBarContainer(properties, others) {
      var _this;
      _this = _Control.call(this, properties, others) || this;
      _initializerDefineProperty(_this, "contextPath", _descriptor, _this);
      _initializerDefineProperty(_this, "appId", _descriptor2, _this);
      _initializerDefineProperty(_this, "easyFilterLib", _descriptor3, _this);
      _initializerDefineProperty(_this, "filterBarMetadata", _descriptor4, _this);
      _initializerDefineProperty(_this, "recommendedValues", _descriptor5, _this);
      _initializerDefineProperty(_this, "dataFetcher", _descriptor6, _this);
      _initializerDefineProperty(_this, "easyFilterInput", _descriptor7, _this);
      _initializerDefineProperty(_this, "tokenizer", _descriptor8, _this);
      _initializerDefineProperty(_this, "content", _descriptor9, _this);
      _initializerDefineProperty(_this, "aiNotice", _descriptor10, _this);
      _initializerDefineProperty(_this, "tokensChanged", _descriptor11, _this);
      _initializerDefineProperty(_this, "sortersChanged", _descriptor12, _this);
      _initializerDefineProperty(_this, "groupLevelsChanged", _descriptor13, _this);
      _initializerDefineProperty(_this, "queryChanged", _descriptor14, _this);
      _initializerDefineProperty(_this, "showValueHelp", _descriptor15, _this);
      _initializerDefineProperty(_this, "liveChange", _descriptor16, _this);
      /** Fires when the user manually removes or edits a filter token. Does not fire when tokens are set by the AI search result. */
      _initializerDefineProperty(_this, "tokensChangedByUser", _descriptor17, _this);
      _initializerDefineProperty(_this, "clearFilters", _descriptor18, _this);
      _initializerDefineProperty(_this, "beforeQueryProcessing", _descriptor19, _this);
      _initializerDefineProperty(_this, "afterQueryProcessing", _descriptor20, _this);
      _initializerDefineProperty(_this, "state", _descriptor21, _this);
      _this.shouldTokenChangeEventFired = true;
      _this.isResettingToDefaultTokens = false;
      _this.inputFieldReady = new Promise(resolve => {
        _this.resolveContentReady = resolve;
      });
      _this.shouldMessageStripRemove = true;
      _this.supportsSorting = true;
      _this.supportsGrouping = true;
      _this.initialize();
      _this.invisibleMessage = InvisibleMessage.getInstance();
      return _this;
    }
    _exports = EasyFilterBarContainer;
    _inheritsLoose(EasyFilterBarContainer, _Control);
    var _proto = EasyFilterBarContainer.prototype;
    _proto.setEasyFilterLib = function setEasyFilterLib(easyFilterLib) {
      this.setProperty("easyFilterLib", easyFilterLib);
      if (this.easyFilterLib) {
        this.easyfilter = __ui5_require_async(this.easyFilterLib);
      }
    };
    _proto.setAppId = async function setAppId(appId) {
      if (!this.appId) {
        this.setProperty("appId", appId, true);
        await this.inputFieldReady;
        this.easyFilterInput.current?.setProperty("appId", appId, true);
      }
    };
    _proto.setFilterBarMetadata = function setFilterBarMetadata(filterBarMetadata) {
      if (!this.filterBarMetadata) {
        this.setProperty("filterBarMetadata", filterBarMetadata, true);
        // populate the tokens with default value
        const tokens = this.getDefaultTokens();
        if (!this.innerControlPopover) {
          this.innerControlPopover = this.createPopoverForInnerControls();
          this.addDependent(this.innerControlPopover);
        }
        this.state.tokens = tokens;
        this.state.showResult = tokens.length > 0;
        ///We don't want to display error valueStateMessage as soon the control renders
        this.isMandatoryCheckRequired = true;
        //onTokenChange event should not be fired when initial set of tokens are set
        this.shouldTokenChangeEventFired = false;
      }
    };
    _proto.init = function init() {
      this.resourceBundle = Lib.getResourceBundleFor("sap.fe.controls");
    };
    _proto.initialize = function initialize() {
      this.content = this.createContent();
      this.resolveContentReady();
      if (!this.innerControlPopover) {
        this.innerControlPopover = this.createPopoverForInnerControls();
        this.addDependent(this.innerControlPopover);
      }
      //We don't want to display error valueStateMessage as soon the control renders
      this.isMandatoryCheckRequired = true;
      //onTokenChange event should not be fired when initial set of tokens are set
      this.shouldTokenChangeEventFired = false;
    }

    // This method should be used before updating the state, once the state is updated the previous overridden default values would be gone forever
    ;
    _proto.getDefaultTokens = function getDefaultTokens() {
      const tokens = [];
      if (!this.mandatoryKeyMap) {
        this.mandatoryKeyMap = {};
      }
      this.filterBarMetadata?.forEach(data => {
        const isRequired = data.required;
        if (isRequired) {
          this.mandatoryKeyMap[data.name] = true;
          //Check whether the keys exist in the current state else push it across
          if (data.type === "ValueHelp") {
            tokens.push({
              key: data.name,
              label: data.label,
              keySpecificSelectedValues: data.defaultValue ?? [],
              type: data.type,
              busy: false,
              isRequired
            });
          } else {
            tokens.push({
              key: data.name,
              label: data.label,
              keySpecificSelectedValues: data.defaultValue ?? [],
              type: data.type,
              busy: false,
              isRequired
            });
          }
        }
      });
      return tokens;
    };
    _proto.onEnterPressed = function onEnterPressed(e) {
      this.onGoPress(e.getParameter("query"));
    }

    //Making it public because in live mode the app developer can decide whether to display the error ValueStateMessage
    //In non-live mode , we are already internally handling it on every time time a user clicks on GO/Enter buttons
    ;
    _proto.checkIfAllMandatoryTokensFilled = function checkIfAllMandatoryTokensFilled() {
      const tokensInState = this.getUnSetMandatoryTokensInCurrentState();
      if (tokensInState.length !== 0) {
        const tokens = this.getActualTokensFromState(tokensInState);
        tokens?.forEach(token => {
          token.setProperty("valueState", ValueState.Error);
          token.setProperty("valueStateText", this.resourceBundle.getText("M_EASY_FILTER_MANDATORY_TOKEN_ERROR"));
          token.openValueStateMessage();
        });
        return false;
      }
      return true;
    };
    _proto.closeAllMandatoryValueStateMessages = function closeAllMandatoryValueStateMessages() {
      const easyTokens = this.tokenizer.current?.getTokens();
      easyTokens.forEach(token => token.closeValueStateMessage());
    };
    _proto.onGoPress = async function onGoPress(magicQuery) {
      if (!magicQuery) {
        this.resetState();
        return;
      }
      this.state.tokenizerEditable = true;

      // Call AI service to get the filter criteria
      const easyfilter = await this.easyfilter;
      if (!easyfilter) {
        return;
      }
      this.fireEvent("beforeQueryProcessing");
      const easyFilterMetadata = {
        version: 1,
        entitySet: this.contextPath,
        fields: this.filterBarMetadata
      };
      const easyFilterResult = await easyfilter.easyFilter(magicQuery, easyFilterMetadata);

      //We should not change the message strip for the first time when the GO button is pressed, because it has already been calculated in the EasyFilterUtils.formatData method
      this.shouldMessageStripRemove = false;
      if (easyFilterResult.success) {
        //Only add the recent query when the call is success
        //Do not track the recent queries when the isHistoryEnabled is set to false
        //It would be a violation to users privacy
        if (this.easyFilterInput.current?.isHistoryEnabled() ?? false) {
          this.easyFilterInput.current?.addRecentQuery(magicQuery);
        }
        // Set query as successful in the input field
        this.easyFilterInput.current?.setQuerySuccess(magicQuery);
        if (easyFilterResult.data.version === 1) {
          this.handleV1Success(easyFilterResult);
        } else if (easyFilterResult.data.version === 2) {
          // Create the sap.ui.model.Filter from the filter and apply it directly to the list binding
        }
      } else {
        // error
        this.easyFilterInput.current?.setQueryFailure();
        this.removeNonMandatoryTokens();
        this.setMessageStrip(easyFilterResult.message);
        this.invisibleMessage.announce(this.resourceBundle.getText(easyFilterResult.message), InvisibleMessageMode.Assertive);
        this.state.messageStripType = MessageType.Warning;
        this.state.groupLevels = [];
        Log.error("Error while generating filter criteria: ", easyFilterResult.message);
      }
      this.fireEvent("afterQueryProcessing");
    }

    /**
     * Handles the success response from the AI service for version 1 of the easy filter.
     * @param easyFilterResult The result from the AI service
     * @private
     */;
    _proto.handleV1Success = function handleV1Success(easyFilterResult) {
      if (easyFilterResult.data.filter) {
        // We need to show a message to the user that the filter criteria has been generated
        Log.debug("Filter criteria generated: ", JSON.stringify(easyFilterResult.data.filter, null, 2));
        const tokens = [...this.state.tokens].filter(token => token.isRequired);

        // Clear the previous message strip for validated filters
        this.clearMessageStrip();

        // Validate and apply the filter criteria
        EasyFilterUtils.formatData(tokens, easyFilterResult.data.filter, this.filterBarMetadata, this.setMessageStrip.bind(this));

        //We only have to call the dataFetcher on the VH tokens which have been asked by the user
        //In Madnatory tokens case the defaultValues are already given, so no need to call dataFetcher on it

        const allValueHelpTokens = tokens.filter(result => result.type === "ValueHelp");
        const requiredValueHelpTokens = allValueHelpTokens.filter(valueHelpToken => {
          return easyFilterResult.data.filter?.find(llmResult => llmResult.name === valueHelpToken.key);
        });
        if (this.dataFetcher) {
          requiredValueHelpTokens.forEach(async valueHelpToken => {
            const result = await this.dataFetcher?.(valueHelpToken.key, valueHelpToken.keySpecificSelectedValues, easyFilterResult);
            valueHelpToken.busy = false;
            if (result) {
              //We should not change the message strip for the first time when the GO button is pressed, because it has already been calculated in the EasyFilterUtils.formatData method
              this.shouldMessageStripRemove = false;
              valueHelpToken.keySpecificSelectedValues = result;
              this.state.showResult = true;
              this.state.tokens = updatedTokens;
            }
          });
        } else {
          //If dataFetcher is not there, then mock the value and description with the same result coming from the LLM
          requiredValueHelpTokens.forEach(valueHelpToken => {
            valueHelpToken.busy = false;
            valueHelpToken.keySpecificSelectedValues.forEach((keySpecificValue, idx) => {
              if (keySpecificValue.operator === FilterOperator.BT || keySpecificValue.operator === FilterOperator.NB) {
                valueHelpToken.keySpecificSelectedValues[idx].selectedValues = [{
                  value: keySpecificValue.selectedValues[0],
                  description: keySpecificValue.selectedValues[0]
                }, {
                  value: keySpecificValue.selectedValues[1],
                  description: keySpecificValue.selectedValues[1]
                }];
              } else {
                valueHelpToken.keySpecificSelectedValues[idx].selectedValues.forEach((value, subIndx) => {
                  valueHelpToken.keySpecificSelectedValues[idx].selectedValues[subIndx] = {
                    value,
                    description: value
                  };
                });
              }
            });
          });
        }
        const updatedTokens = this.verifySingleSelectTokenValues(tokens);

        // Validate and store sort expressions (applied to table directly, not shown as tokens)
        this.state.sorters = this.supportsSorting ? this.validateSortExpressions(easyFilterResult.data.sorters) : [];
        this.state.showResult = true;
        this.state.thumbButtonEnabled = true;
        this.state.thumbDownButtonPressed = false;
        this.state.thumbUpButtonPressed = false;
        this.state.tokens = updatedTokens;
      }
      this.state.groupLevels = this.supportsGrouping ? this.applyGroupLevels(easyFilterResult.data.groupLevels) : [];
      this.showUnsupportedCapabilitiesWarning(easyFilterResult.data.sorters, easyFilterResult.data.groupLevels);
    }

    /**
     * Shows a warning when the app does not support the LLM's sort/group expressions.
     * @param sorters Sort expressions from the LLM.
     * @param groupLevels Group levels from the LLM.
     */;
    _proto.showUnsupportedCapabilitiesWarning = function showUnsupportedCapabilitiesWarning(sorters, groupLevels) {
      const hasSortersFromLLM = sorters && sorters.length > 0;
      const hasGroupLevelsFromLLM = groupLevels && groupLevels.length > 0;
      const sortingUnsupported = !this.supportsSorting && hasSortersFromLLM;
      const groupingUnsupported = !this.supportsGrouping && hasGroupLevelsFromLLM;
      if (sortingUnsupported && groupingUnsupported) {
        this.appendMessageStrip(this.resourceBundle.getText("M_EASY_FILTER_SORTING_AND_GROUPING_NOT_SUPPORTED"), MessageType.Warning);
      } else if (sortingUnsupported) {
        this.appendMessageStrip(this.resourceBundle.getText("M_EASY_FILTER_SORTING_NOT_SUPPORTED"), MessageType.Warning);
      } else if (groupingUnsupported) {
        this.appendMessageStrip(this.resourceBundle.getText("M_EASY_FILTER_GROUPING_NOT_SUPPORTED"), MessageType.Warning);
      }
    }

    /**
     * Updates whether the app supports sorting and grouping based on table personalization settings.
     * @param sorting Whether the app supports sorting.
     * @param grouping Whether the app supports grouping.
     */;
    _proto.setPersonalizationSupport = function setPersonalizationSupport(sorting, grouping) {
      this.supportsSorting = sorting;
      this.supportsGrouping = grouping;
    }

    /**
     *  Validates and triggers the groupLevelsChanged function, which warns about non-groupable fields.
     * @param groupLevels The group levels to validate and apply
     * @returns GroupLevelDefinition[] An array of valid group level definitions to be applied
     */;
    _proto.applyGroupLevels = function applyGroupLevels(groupLevels) {
      const metadata = this.filterBarMetadata;
      if (!metadata || !groupLevels || groupLevels.length === 0) {
        return [];
      }
      const resolveField = groupDef => {
        const propertyName = EasyFilterUtils.resolvePropertyName(groupDef.key);
        const field = metadata.find(f => f.name === groupDef.key || f.name.endsWith(`/${propertyName}`));
        if (!field) {
          Log.warning(`EasyFilterBarContainer: group key "${groupDef.key}" not found in filter bar metadata, skipping`);
        }
        return field;
      };
      if (groupLevels.length === 1) {
        const errorHandler = new ErrorMessageHandler();
        const field = resolveField(groupLevels[0]);
        if (!field) return [];
        const isGroupable = errorHandler.isGroupableProperty(field);
        if (errorHandler.hasErrors()) {
          this.appendMessageStrip(encodeXML(errorHandler.getErrorMessage()), MessageType.Warning);
        }
        return isGroupable ? [groupLevels[0]] : [];
      }

      // Multiple group levels: find the first valid groupable field
      const errorHandler = new ErrorMessageHandler();
      let firstGroupableDef;
      let firstGroupableLabel;
      for (const groupDef of groupLevels) {
        const field = resolveField(groupDef);
        if (!field) continue;
        if (errorHandler.isGroupableProperty(field)) {
          if (!firstGroupableDef) {
            firstGroupableDef = groupDef;
            firstGroupableLabel = field.label ?? field.name;
          }
        }
      }
      if (firstGroupableDef) {
        const warning = this.resourceBundle.getText("M_EASY_FILTER_MULTIPLE_GROUP_WARNING", [firstGroupableLabel]);
        this.appendMessageStrip(encodeXML(warning), MessageType.Warning);
        return [firstGroupableDef];
      }

      // All fields are non-groupable
      if (errorHandler.hasErrors()) {
        this.appendMessageStrip(encodeXML(errorHandler.getErrorMessage()), MessageType.Warning);
      }
      return [];
    }

    /**
     * Validates sort expressions from the AI result and returns valid sort definitions.
     * @param sortExpressions The sort expressions from the ABAP service.
     * @returns Array of validated sort definitions.
     * @private
     */;
    _proto.validateSortExpressions = function validateSortExpressions(sortExpressions) {
      if (!sortExpressions || sortExpressions.length === 0) {
        return [];
      }
      const nonSortableFields = [];
      const validSorters = sortExpressions.filter(sortExpression => {
        // Validate that the field exists in metadata and is sortable
        const fieldMetadata = this.filterBarMetadata?.find(field => {
          const fieldName = field.name.split("/").pop();
          return fieldName === sortExpression.key || field.name === sortExpression.key;
        });
        if (!fieldMetadata) {
          return false;
        }
        if (fieldMetadata.sortable === false) {
          nonSortableFields.push(fieldMetadata.label ?? sortExpression.key);
          return false;
        }
        return true;
      }).map(sortExpression => {
        const propertyName = sortExpression.key.split("/").pop() ?? sortExpression.key;
        return {
          key: propertyName,
          descending: sortExpression.descending
        };
      });

      // Show warning message for non-sortable fields
      if (nonSortableFields.length > 0) {
        const message = this.resourceBundle.getText("M_EASY_FILTER_NON_SORTABLE", [nonSortableFields.join(", ")]);
        this.appendMessageStrip(message, MessageType.Warning);
      }
      return validSorters;
    }

    //every single select menu type should have only one value, else splice to one value and update the  message strip
    ;
    _proto.verifySingleSelectTokenValues = function verifySingleSelectTokenValues(tokens) {
      const singleSelectTokenLabels = [];
      tokens.forEach(token => {
        if (token.type === "MenuWithSingleSelect") {
          if (token.keySpecificSelectedValues[0].selectedValues.length > 1) {
            singleSelectTokenLabels.push(token.label);
            token.keySpecificSelectedValues[0].selectedValues.splice(1);
          }
        }
      });
      if (singleSelectTokenLabels.length) {
        this.state.singleValueMessageStripText = this.resourceBundle.getText("M_EASY_FILTER_SINGLE_VALUE_MESSAGE", [`<strong>${singleSelectTokenLabels.join(", ")}</strong>`]);
        this.state.showSingleValueMessageStrip = true;
      }
      return tokens;
    };
    _proto.clearMessageStrip = function clearMessageStrip() {
      this.state.thumbDownButtonPressed = false;
      this.state.thumbUpButtonPressed = false;
      this.state.showMessageStrip = false;
      this.state.messageStripText = "";
      this.state.messageStripType = MessageType.Error;
    };
    _proto.clearMessageStripForSingleValue = function clearMessageStripForSingleValue() {
      this.state.showSingleValueMessageStrip = false;
      this.state.singleValueMessageStripText = "";
    };
    _proto.setMessageStrip = function setMessageStrip(text) {
      this.state.thumbDownButtonPressed = false;
      this.state.thumbUpButtonPressed = false;
      this.state.thumbButtonEnabled = true;
      this.state.messageStripText = text;
      this.state.showMessageStrip = true;
    };
    _proto.setMessageStripWithType = function setMessageStripWithType(text, type) {
      this.setMessageStrip(text);
      this.state.messageStripType = type;
    }

    /**
     * Appends a message to the existing message strip instead of overwriting it.
     * @param text The message text to append.
     * @param type The message type for this message.
     */;
    _proto.appendMessageStrip = function appendMessageStrip(text, type) {
      const combined = this.state.showMessageStrip && this.state.messageStripText ? `${this.state.messageStripText}<br>${text}` : text;
      this.setMessageStripWithType(combined, type);
    };
    _proto.createPopoverForInnerControls = function createPopoverForInnerControls() {
      if (!this.innerControlPopover) {
        this.innerControlPopover = _jsx(Popover, {
          id: this.getId() + "-innerPopover",
          showArrow: false,
          showHeader: true,
          placement: PlacementType.Bottom,
          class: "sapUiMediumMarginBottom",
          children: {
            footer: this.getToolbar()
          }
        });
      }
      return this.innerControlPopover;
    };
    _proto.getToolbar = function getToolbar() {
      if (!this.toolbar) {
        const okButton = this.getOkButton();
        const showAllButton = this.getShowAllButton();
        this.toolbar = _jsx(OverflowToolbar, {
          children: {
            content: _jsxs(_Fragment, {
              children: [_jsx(ToolbarSpacer, {}), okButton, showAllButton]
            })
          }
        });
      }
      return this.toolbar;
    };
    _proto.getOkButton = function getOkButton() {
      if (!this.okButton) {
        this.okButton = _jsx(Button, {
          text: this.resourceBundle.getText("M_EASY_FILTER_POPOVER_OK"),
          type: ButtonType.Emphasized
        });
      }
      return this.okButton;
    };
    _proto.getShowAllButton = function getShowAllButton() {
      if (!this.showAllButton) {
        this.showAllButton = _jsx(Button, {
          text: this.resourceBundle.getText("M_EASY_FILTER_POPOVER_SHOW_ALL_ITEMS")
        });
      }
      return this.showAllButton;
    };
    _proto.formatTokens = function formatTokens(tokens) {
      return tokens.map(token => {
        if (token.type === "ValueHelp") {
          return {
            ...token,
            keySpecificSelectedValues: token.keySpecificSelectedValues.map(value => {
              //Making sure that only the id part is passed
              return {
                operator: value.operator,
                selectedValues: value.selectedValues.map(val => val.value)
              };
            })
          };
        } else {
          return deepClone(token);
        }
      });
    };
    _proto.onStateChange = function onStateChange() {
      let changedProps = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      if (changedProps.includes("tokens")) {
        if (this.shouldTokenChangeEventFired) {
          this.fireEvent("tokensChanged", {
            tokens: this.formatTokens(this.state.tokens),
            reset: this.isResettingToDefaultTokens
          });
        }
        this.state.showResult = this.state.tokens.length > 0;
        if (!(this.isMandatoryCheckRequired ?? false)) {
          this.checkIfAllMandatoryTokensFilled();
        }
        if (this.shouldMessageStripRemove) {
          /**
           * The user has acknowledged the message strip and understood the issue.
           * When the tokens are updated next time, displaying the message strip again serves no purpose.
           * Additionally, once the tokens are updated, the input field text is removed
           * rendering the message strip irrelevant. However, the message strip is displayed again the next time the "Go" button is pressed.
           */
          this.clearMessageStrip();
          this.clearMessageStripForSingleValue();
        }
        this.shouldMessageStripRemove = true;
      }
      if (changedProps.includes("sorters")) {
        this.fireEvent("sortersChanged", {
          sorters: this.state.sorters
        });
      }
      if (changedProps.includes("groupLevels")) {
        this.fireEvent("groupLevelsChanged", {
          groupLevels: this.state.groupLevels
        });
      }
      //Resetting to default values
      this.isMandatoryCheckRequired = false;
      this.shouldTokenChangeEventFired = true;
      this.isResettingToDefaultTokens = false;

      //  onsapfocusleave method in sap.m.Tokenizer is automatically converting the rendermode of tokenizer to "Narrow" from "loose"
      //  In this process there are multiple popover issues happening
      //  So as a temporary fix overriding the function
      (this.tokenizer?.current).onsapfocusleave = () => {};
    };
    _proto.onThumbUpPressed = function onThumbUpPressed() {
      this.state.thumbUpButtonPressed = true;
      this.state.thumbDownButtonPressed = false;
      triggerPXIntegration("thumbUp");
      this.onThumbPressed();
    };
    _proto.onThumbDownPressed = function onThumbDownPressed() {
      this.state.thumbDownButtonPressed = true;
      this.state.thumbUpButtonPressed = false;
      triggerPXIntegration("thumbDown");
      this.onThumbPressed();
    };
    _proto.onThumbPressed = function onThumbPressed() {
      this.state.thumbButtonEnabled = false;
      MessageToast.show(this.resourceBundle.getText("C_EASY_FILTER_FEEDBACK_SENT"));
    };
    _proto.createContent = function createContent() {
      const $topGoBtn = createReference();
      const thumbUpButtonTokenizer = _jsx(ToggleButton, {
        icon: "sap-icon://thumb-up",
        tooltip: this.resourceBundle.getText("C_EASY_FILTER_THUMBS_UP"),
        type: "Transparent",
        press: () => {
          return this.onThumbUpPressed();
        },
        enabled: bindState(this.state, "thumbButtonEnabled"),
        pressed: bindState(this.state, "thumbUpButtonPressed")
      });
      FESRHelper.setSemanticStepname(thumbUpButtonTokenizer, "press", "fe4:eft:t:thumbUp");
      const thumbDownButtonTokenizer = _jsx(ToggleButton, {
        icon: "sap-icon://thumb-down",
        tooltip: this.resourceBundle.getText("C_EASY_FILTER_THUMBS_DOWN"),
        type: "Transparent",
        press: () => {
          return this.onThumbDownPressed();
        },
        enabled: bindState(this.state, "thumbButtonEnabled"),
        pressed: bindState(this.state, "thumbDownButtonPressed")
      });
      FESRHelper.setSemanticStepname(thumbDownButtonTokenizer, "press", "fe4:eft:t:thumbDown");
      const thumbUpButtonMessageStripe = _jsx(ToggleButton, {
        icon: "sap-icon://thumb-up",
        tooltip: this.resourceBundle.getText("C_EASY_FILTER_THUMBS_UP"),
        type: "Transparent",
        press: () => {
          return this.onThumbUpPressed();
        },
        enabled: bindState(this.state, "thumbButtonEnabled"),
        pressed: bindState(this.state, "thumbUpButtonPressed")
      });
      FESRHelper.setSemanticStepname(thumbUpButtonMessageStripe, "press", "fe4:eft:ms:thumbUp");
      const thumbDownButtonMessageStripe = _jsx(ToggleButton, {
        icon: "sap-icon://thumb-down",
        tooltip: this.resourceBundle.getText("C_EASY_FILTER_THUMBS_DOWN"),
        type: "Transparent",
        press: () => {
          return this.onThumbDownPressed();
        },
        enabled: bindState(this.state, "thumbButtonEnabled"),
        pressed: bindState(this.state, "thumbDownButtonPressed")
      });
      FESRHelper.setSemanticStepname(thumbDownButtonMessageStripe, "press", "fe4:eft:ms:thumbDown");
      const resourceBundle = Lib.getResourceBundleFor("sap.fe.controls");
      const aiNoticeControl = this.aiNotice ? this.aiNotice.clone() : _jsx(AINotice, {
        type: "Button",
        children: _jsxs(VBox, {
          children: [_jsx(Text, {
            class: "sapFeControlsAiPopoverText1",
            text: resourceBundle.getText("M_NOTICE_AI_POPOVER_TEXT_1")
          }), _jsx(Text, {
            class: "sapFeControlsAiPopoverText2",
            text: resourceBundle.getText("M_NOTICE_AI_POPOVER_TEXT_2")
          })]
        })
      });
      const outVBox = _jsxs(VBox, {
        children: [_jsxs(FlexBox, {
          renderType: "Bare",
          children: [_jsx(EasyFilterInput, {
            recommendedValues: this.recommendedValues,
            ref: this.easyFilterInput,
            enterPressed: this.onEnterPressed.bind(this),
            queryChanged: e => {
              this.fireEvent("queryChanged", {
                query: e.getParameter("query")
              });
            },
            liveChange: () => {
              this.state.tokenizerEditable = false;
              this.fireEvent("liveChange", {
                query: this.getQuery()
              });
            }
          }), _jsx(Button, {
            icon: "sap-icon://ai",
            class: "sapUiSmallMarginBegin",
            ref: $topGoBtn,
            text: this.resourceBundle.getText("M_EASY_FILTER_GO"),
            type: ButtonType.Emphasized,
            press: this.onGoButtonPress.bind(this)
          })]
        }), _jsx(FlexBox, {
          renderType: "Bare",
          visible: bindState(this.state, "showResult"),
          alignItems: FlexAlignItems.Center,
          wrap: FlexWrap.Wrap,
          justifyContent: FlexJustifyContent.SpaceBetween,
          class: "sapUiTinyMarginTop",
          children: _jsxs(FlexBox, {
            class: "sapFeControlsGap8px",
            renderType: "Bare",
            alignItems: FlexAlignItems.Center,
            wrap: FlexWrap.Wrap,
            children: [aiNoticeControl, _jsx(Tokenizer, {
              editable: and(bindState(this.state, "tokenizerEditable"), true),
              class: "sapFeControlsTokenizer",
              tokens: bindState(this.state, "tokens"),
              renderMode: TokenizerRenderMode.Loose,
              ref: this.tokenizer,
              children: {
                tokens: (idx, ctx) => {
                  const object = ctx.getObject();
                  return _jsx(Token, {
                    label: this.state.tokens.label,
                    items: this.state.tokens.keySpecificSelectedValues,
                    mandatory: this.isKeyMandatory(object.key),
                    busy: this.state.tokens.busy,
                    delete: () => {
                      const tokenIndex = this.state.tokens.findIndex(token => token.key === object.key);
                      const newTokens = this.state.tokens.concat();
                      newTokens.splice(tokenIndex, 1);
                      this.state.tokens = newTokens;
                      this.updateFilterInput("tokenUpdated");
                      this.fireEvent("tokensChangedByUser", {
                        tokens: [...this.state.tokens]
                      });
                    },
                    children: {
                      customData: [_jsx(CustomData, {
                        value: object
                      }, "TokenInfo"), _jsx(CustomData, {
                        value: this.innerControlPopover
                      }, "popover"), _jsx(CustomData, {
                        value: this
                      }, "easyFilterBarContainer"), _jsx(CustomData, {
                        value: this.filterBarMetadata?.find(data => data.name === object.key)?.codeList
                      }, "codeList")]
                    }
                  }, this.state.tokens.key);
                }
              }
            }), _jsxs(HBox, {
              children: [thumbUpButtonTokenizer, ", ", thumbDownButtonTokenizer]
            }), _jsx(Button, {
              text: this.resourceBundle.getText("M_EASY_FILTER_RESET"),
              type: ButtonType.Transparent,
              press: () => {
                this.resetState(true, true);
                //Retaining the focus on popover doesn't make the popover close on every interaction
                this.easyFilterInput.current?.$searchInput.focus();
              }
            })]
          })
        }), _jsxs(VBox, {
          renderType: "Bare",
          class: "sapUiTinyMarginTop sapFeControlsGap8px",
          children: [_jsx(MessageStrip, {
            text: bindState(this.state, "singleValueMessageStripText"),
            showIcon: true,
            enableFormattedText: true,
            visible: bindState(this.state, "showSingleValueMessageStrip"),
            showCloseButton: true,
            close: () => {
              this.clearMessageStripForSingleValue();
            }
          }), _jsxs(FlexBox, {
            renderType: "Bare",
            class: "sapFeControlsGap8px",
            children: [_jsx(MessageStrip, {
              type: bindState(this.state, "messageStripType"),
              text: bindState(this.state, "messageStripText"),
              showIcon: true,
              enableFormattedText: true,
              showCloseButton: true,
              close: () => {
                this.clearMessageStrip();
              },
              visible: bindState(this.state, "showMessageStrip")
            }), _jsxs(HBox, {
              visible: and(bindState(this.state, "showMessageStrip"), not(bindState(this.state, "showResult"))),
              children: [thumbUpButtonMessageStripe, ", ", thumbDownButtonMessageStripe]
            })]
          })]
        })]
      });
      FESRHelper.setSemanticStepname($topGoBtn.current, "press", "fe:ai:search");
      if (this.easyFilterInput.current) {
        FESRHelper.setSemanticStepname(this.easyFilterInput.current, "enterPressed", "fe:ai:search");
      }
      return outVBox;
    };
    _proto.onGoButtonPress = async function onGoButtonPress() {
      this.state.tokenizerEditable = true;
      let currentInputValue = this.easyFilterInput.current?.getValue();
      const currentInputPlaceholder = this.easyFilterInput.current?.getPlaceholder();
      if (currentInputValue === "" && currentInputPlaceholder !== this.resourceBundle.getText("M_EASY_FILTER_PLACEHOLDER")) {
        this.easyFilterInput.current?.setValue(currentInputPlaceholder || "");
        currentInputValue = currentInputPlaceholder;
      }
      await this.onGoPress(currentInputValue);
    }

    /**
     * Resets the state of the EasyFilterBarContainer to its initial configuration.
     *
     * This method performs the following actions:
     * - Clears all non-mandatory tokens and resets mandatory tokens to their default values
     * - Resets the input field to its default placeholder text
     * - Clears all error value states and messages from tokens
     * - Clears any displayed message strips
     * - Optionally fires the clearFilters event to notify consumers
     * @param clearAllFilters If true, fires the clearFilters event to notify consumers that filters should be cleared else just resets the tokens without firing the event
     * @param isResettingToDefaultTokens If true, indicates that the resetButton is restoring tokens to their default values
     */;
    _proto.resetState = function resetState() {
      let clearAllFilters = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      let isResettingToDefaultTokens = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      if (clearAllFilters) {
        this.fireEvent("clearFilters");
        this.state.groupLevels = [];
        this.isResettingToDefaultTokens = isResettingToDefaultTokens;
      } else {
        this.shouldTokenChangeEventFired = false;
      }
      this.state.sorters = [];
      this.state.tokens = this.getDefaultTokens();
      this.updateFilterInput("tokenReset");
      this.state.tokenizerEditable = true;
      this.isMandatoryCheckRequired = true;
      //Set the Value States of all the Tokens back to None
      this.tokenizer.current?.getTokens().forEach(token => token.setProperty("valueState", ValueState.None));
      this.tokenizer.current?.getTokens().forEach(token => token.setProperty("valueStateText", null));
      this.clearMessageStrip(); //clear the message strip for validated filters
      // Clear query success status
      this.easyFilterInput.current?.clearQueryStatus();
    };
    _proto.clearFiltersAndTokens = function clearFiltersAndTokens() {
      this.fireEvent("clearFilters");
      this.shouldTokenChangeEventFired = false;
      this.state.tokens = [];
    }

    //The below code updates the existing state by fetching the key and selectedValues
    ;
    _proto.updateTokenArray = function updateTokenArray(changeType, newTokenSpecificValues, tokenKey) {
      const newTokens = this.state.tokens.map(token => ({
        ...token,
        keySpecificSelectedValues: [...token.keySpecificSelectedValues]
      }));
      const tokenIndex = newTokens.findIndex(t => t.key === tokenKey);
      const token = newTokens[tokenIndex];
      if (tokenIndex != -1) {
        switch (changeType) {
          case "setSelectedValues":
            this.setSelectedValues(token, newTokenSpecificValues, tokenIndex, newTokens);
            token.keySpecificSelectedValues = newTokenSpecificValues;
            //Remove the token entirely
            if (!this.isKeyMandatory(token.key) && token.keySpecificSelectedValues.length === 0) {
              newTokens.splice(tokenIndex, 1);
            }
            break;
          default:
            Log.error("Specifying a setter that is out of the boundary");
            break;
        }
        // Update the state by assigning the new tokens array
        this.state.tokens = newTokens;
        this.state.showResult = newTokens.length > 0;
        this.updateFilterInput("tokenUpdated");
        this.fireEvent("tokensChangedByUser", {
          tokens: [...this.state.tokens]
        });
      }
    };
    _proto.closeInnerControlPopover = function closeInnerControlPopover() {
      this.innerControlPopover?.close();
    };
    _proto.setSelectedValues = function setSelectedValues(token, newTokenSpecificValues, tokenIndex, newTokens) {
      token.keySpecificSelectedValues = newTokenSpecificValues;
      if (!this.isKeyMandatory(token.key) && token.keySpecificSelectedValues.length === 0) {
        newTokens.splice(tokenIndex, 1);
      }
    };
    _proto.isKeyMandatory = function isKeyMandatory(key) {
      if (!this.mandatoryKeyMap) {
        this.mandatoryKeyMap = {};
      }
      return this.mandatoryKeyMap[key] ? true : false;
    }

    /**
     * Checks whether the current state has sort definitions from the easy filter.
     * @returns True if the current state contains one or more sorters.
     */;
    _proto.hasSorters = function hasSorters() {
      return this.state.sorters.length > 0;
    };
    _proto.removeNonMandatoryTokens = function removeNonMandatoryTokens() {
      const newToken = this.state.tokens.filter(token => {
        return this.isKeyMandatory(token.key);
      });
      this.state.tokens = newToken;
      return this;
    };
    _proto.hasGroupLevels = function hasGroupLevels() {
      return this.state.groupLevels.length > 0;
    }

    /**
     * Notifies the container that an external table state change (sort or group) has been detected.
     * If the container currently has active sorters or group levels, the filter input is marked dirty
     * because the external change makes the easy filter result inconsistent.
     */;
    _proto.notifyExternalTableStateChange = function notifyExternalTableStateChange() {
      if (this.hasSorters() || this.hasGroupLevels()) {
        this.updateFilterInput("tokenUpdated");
      }
    };
    _proto.getQuery = function getQuery() {
      return this.easyFilterInput.current?.getValue() ?? "";
    };
    _proto.getTokens = function getTokens() {
      return [...this.state.tokens];
    };
    _proto.setQuery = function setQuery(query) {
      this.easyFilterInput.current?.setValue(query);
    };
    _proto.updateFilterInput = function updateFilterInput(value) {
      const currValue = this.easyFilterInput.current?.getValue() || "";
      if (value === "tokenUpdated" && currValue !== "") {
        this.easyFilterInput.current?.setValue("");
        this.easyFilterInput.current?.setPlaceholder(currValue);
      } else if (value === "tokenReset") {
        this.easyFilterInput.current?.setValue("");
        this.easyFilterInput.current?.setPlaceholder(this.resourceBundle.getText("M_EASY_FILTER_PLACEHOLDER"));
      }
    };
    _proto.getTokensInInitialState = function getTokensInInitialState() {
      const newTokens = this.state.tokens.map(token => ({
        ...token,
        keySpecificSelectedValues: [...token.keySpecificSelectedValues]
      }));
      const mandatoryTokens = newTokens.filter(token => {
        if (this.isKeyMandatory(token.key)) {
          return true;
        }
      });
      return mandatoryTokens.map(token => ({
        ...token,
        keySpecificSelectedValues: []
      }));
    };
    _proto.getUnSetMandatoryTokensInCurrentState = function getUnSetMandatoryTokensInCurrentState() {
      return this.state.tokens.filter(token => {
        const isKeyMandatory = this.isKeyMandatory(token.key);
        if (isKeyMandatory) {
          return token.keySpecificSelectedValues.length === 0;
        }
      });
    };
    _proto.getActualTokensFromState = function getActualTokensFromState(tokens) {
      const requiredKeys = tokens.map(token => token.key);
      return this.tokenizer.current?.getTokens().filter(token => requiredKeys.includes(token.getKey()));
    };
    EasyFilterBarContainer.render = function render(rm, control) {
      return jsx.renderUsingRenderManager(rm, control, () => {
        return _jsx("span", {
          ref: control,
          children: control.getAggregation("content")
        });
      });
    };
    return EasyFilterBarContainer;
  }(Control), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "appId", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "easyFilterLib", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "filterBarMetadata", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "recommendedValues", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "dataFetcher", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "easyFilterInput", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "tokenizer", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "content", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "aiNotice", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "tokensChanged", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "sortersChanged", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "groupLevelsChanged", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "queryChanged", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "showValueHelp", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "liveChange", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "tokensChangedByUser", [_dec18], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "clearFilters", [_dec19], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "beforeQueryProcessing", [_dec20], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "afterQueryProcessing", [_dec21], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "state", [_dec22], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return {
        showResult: false,
        tokens: [],
        sorters: [],
        groupLevels: [],
        tokenizerEditable: true,
        showSingleValueMessageStrip: false,
        singleValueMessageStripText: "",
        messageStripText: "",
        showMessageStrip: false,
        messageStripType: MessageType.Error,
        thumbButtonEnabled: true,
        thumbUpButtonPressed: false,
        thumbDownButtonPressed: false
      };
    }
  }), _class2)) || _class);
  _exports = EasyFilterBarContainer;
  return _exports;
}, false);
//# sourceMappingURL=EasyFilterBarContainer-dbg.js.map
