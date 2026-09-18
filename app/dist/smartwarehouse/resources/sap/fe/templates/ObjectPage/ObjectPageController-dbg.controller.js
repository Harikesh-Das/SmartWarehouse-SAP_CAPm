/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/merge", "sap/fe/base/ClassSupport", "sap/fe/core/ActionRuntime", "sap/fe/core/CommonUtils", "sap/fe/core/PageController", "sap/fe/core/controllerextensions/BusyLocker", "sap/fe/core/controllerextensions/IntentBasedNavigation", "sap/fe/core/controllerextensions/InternalIntentBasedNavigation", "sap/fe/core/controllerextensions/InternalRouting", "sap/fe/core/controllerextensions/MessageHandler", "sap/fe/core/controllerextensions/PageReady", "sap/fe/core/controllerextensions/Paginator", "sap/fe/core/controllerextensions/Placeholder", "sap/fe/core/controllerextensions/Share", "sap/fe/core/controllerextensions/ViewState", "sap/fe/core/controllerextensions/cards/CollaborationManager", "sap/fe/core/controllerextensions/editFlow/draft", "sap/fe/core/controllerextensions/editFlow/editFlowConstants", "sap/fe/core/controllerextensions/routing/NavigationReason", "sap/fe/core/controls/Recommendations/ConfirmRecommendationDialog", "sap/fe/core/converters/ManifestSettings", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/library", "sap/fe/macros/CommonHelper", "sap/fe/macros/table/TableHelper", "sap/fe/macros/table/Utils", "sap/fe/navigation/SelectionVariant", "sap/fe/templates/ObjectPage/ExtensionAPI", "sap/fe/templates/ObjectPage/components/CollaborationDiscardDialog", "sap/fe/templates/ObjectPage/helpers/SectionNavigationHelper", "sap/fe/templates/TableScroller", "sap/m/InstanceManager", "sap/ui/Device", "sap/ui/core/Element", "sap/ui/core/Lib", "sap/ui/core/Messaging", "sap/ui/core/message/Message", "sap/ui/core/message/MessageType", "sap/ui/core/mvc/OverrideExecution", "./overrides/CollaborationManager", "./overrides/IntentBasedNavigation", "./overrides/InternalRouting", "./overrides/MessageHandler", "./overrides/Paginator", "./overrides/Share", "./overrides/ViewState"], function (Log, merge, ClassSupport, ActionRuntime, CommonUtils, PageController, BusyLocker, IntentBasedNavigation, InternalIntentBasedNavigation, InternalRouting, MessageHandler, PageReady, Paginator, Placeholder, Share, ViewState, CollaborationManager, draft, UiModelConstants, NavigationReason, ConfirmRecommendationDialog, ManifestSettings, ModelHelper, FELibrary, CommonHelper, TableHelper, TableUtils, SelectionVariant, ExtensionAPI, CollaborationDiscard, SectionNavigationHelper, TableScroller, InstanceManager, Device, UI5Element, Library, Messaging, Message, MessageType, OverrideExecution, CollaborationManagerOverride, IntentBasedNavigationOverride, InternalRoutingOverride, MessageHandlerOverride, PaginatorOverride, ShareOverrides, ViewStateOverrides) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10;
  var pollForSectionStability = SectionNavigationHelper.pollForSectionStability;
  var CreationMode = ManifestSettings.CreationMode;
  var RecommendationDialogDecision = ConfirmRecommendationDialog.RecommendationDialogDecision;
  var usingExtension = ClassSupport.usingExtension;
  var publicExtension = ClassSupport.publicExtension;
  var finalExtension = ClassSupport.finalExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  const ProgrammingModel = FELibrary.ProgrammingModel;
  const PreferredActionStatus = FELibrary.PreferredActionStatusType;

  /**
   * @public
   */
  let ObjectPageController = (_dec = defineUI5Class("sap.fe.templates.ObjectPage.ObjectPageController"), _dec2 = usingExtension(Placeholder), _dec3 = usingExtension(Share.override(ShareOverrides)), _dec4 = usingExtension(InternalRouting.override(InternalRoutingOverride)), _dec5 = usingExtension(Paginator.override(PaginatorOverride)), _dec6 = usingExtension(MessageHandler.override(MessageHandlerOverride)), _dec7 = usingExtension(IntentBasedNavigation.override(IntentBasedNavigationOverride)), _dec8 = usingExtension(CollaborationManager.override(CollaborationManagerOverride)), _dec9 = usingExtension(InternalIntentBasedNavigation.override({
    getNavigationMode: function () {
      const bIsStickyEditMode = this.getView().getController().getStickyEditMode && this.getView().getController().getStickyEditMode();
      return bIsStickyEditMode ? "explace" : undefined;
    }
  })), _dec10 = usingExtension(ViewState.override(ViewStateOverrides)), _dec11 = usingExtension(PageReady.override({
    isContextExpected: function () {
      return true;
    }
  })), _dec12 = publicExtension(), _dec13 = finalExtension(), _dec14 = publicExtension(), _dec15 = extensible(OverrideExecution.After), _dec(_class = (_class2 = /*#__PURE__*/function (_PageController) {
    function ObjectPageController() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _PageController.call(this, ...args) || this;
      _initializerDefineProperty(_this, "placeholder", _descriptor, _this);
      _initializerDefineProperty(_this, "share", _descriptor2, _this);
      _initializerDefineProperty(_this, "_routing", _descriptor3, _this);
      _initializerDefineProperty(_this, "paginator", _descriptor4, _this);
      _initializerDefineProperty(_this, "messageHandler", _descriptor5, _this);
      _initializerDefineProperty(_this, "intentBasedNavigation", _descriptor6, _this);
      _initializerDefineProperty(_this, "collaborationManager", _descriptor7, _this);
      _initializerDefineProperty(_this, "_intentBasedNavigation", _descriptor8, _this);
      _initializerDefineProperty(_this, "viewState", _descriptor9, _this);
      _initializerDefineProperty(_this, "pageReady", _descriptor10, _this);
      _this.invalidateTitleHierarchyCacheSetUp = false;
      _this.mergePatchDraft = false;
      _this.fclCloseHandlerSet = false;
      // Flag to prevent ViewState.apply() from overriding section selection after user interaction or targetControlId navigation
      _this.skipViewStateSectionRestore = false;
      // Tracks if the binding context path changed (new entity vs same entity re-binding)
      _this.isNewBindingContext = false;
      _this.handlers = {
        onPrimaryAction(oController, oView, oContext, sActionName, mParameters, mConditions) {
          /**
           * Invokes the page primary action when the user presses Ctrl+Enter (Cmd+Enter on macOS).
           */

          const primaryCandidate = oController._getPrimaryActionShortcutCandidates(oView)[0];

          /* By design, there must be at most one candidate due to the "single emphasis per page" rule.
             If a primary-enter target is found, it must fully take over Ctrl/Cmd+Enter.*/

          if (primaryCandidate) {
            if (!primaryCandidate.getEnabled()) {
              // Take over Ctrl/Cmd+Enter, but do not trigger anything when the primary action is disabled.
              return;
            }
            if (primaryCandidate.isA("sap.m.Button")) {
              primaryCandidate.firePress();
            }
            if (primaryCandidate.isA("sap.m.MenuButton")) {
              primaryCandidate.fireDefaultAction();
            }
            return;
          }
          const iViewLevel = oController.getView().getViewData().viewLevel;
          if (mConditions.positiveActionVisible) {
            if (mConditions.positiveActionEnabled) {
              oController.handlers.onCallAction(oView, sActionName, mParameters);
            }
          } else if (mConditions.editActionVisible) {
            if (mConditions.editActionEnabled) {
              oController._editDocument();
            }
          } else if (iViewLevel === 1 && CommonUtils.getIsEditable(oView)) {
            oController._saveDocument();
          } else if (CommonUtils.getIsEditable(oView)) {
            oController._applyDocument(oContext);
          }
        },
        /**
         * Manages the context change event on the tables.
         * The focus is set if this change is related to an editFlow action and
         * an event is fired on the objectPage messageButton.
         * @param this The objectPage controller
         * @param event The UI5 event
         */
        async onTableContextChange(event) {
          const tableAPI = event.getSource();
          const table = tableAPI.content;
          const currentActionPromise = this.editFlow.getCurrentActionPromise();
          const tableContexts = this._getTableBinding(table)?.getAllCurrentContexts();
          if (currentActionPromise && tableContexts?.length) {
            try {
              const actionResponse = await currentActionPromise;
              if (actionResponse?.controlId === table.getId()) {
                const actionData = actionResponse.oData;
                const keys = actionResponse.keys;
                const newItem = tableContexts.find(tableContext => {
                  const tableData = tableContext.getObject();
                  return keys.every(key => tableData[key] === actionData[key]);
                })?.getIndex() ?? -1;
                if (newItem !== -1) {
                  const dialog = InstanceManager.getOpenDialogs().find(dialog => dialog.data("FullScreenDialog") !== true);
                  if (dialog) {
                    // by design, a sap.m.dialog set the focus to the previous focused element when closing.
                    // we should wait for the dialog to be closed before set the focus to another element
                    dialog.attachEventOnce("afterClose", () => {
                      table.focusRow(newItem, true);
                    });
                  } else {
                    table.focusRow(newItem, true);
                  }
                  this.editFlow.deleteCurrentActionPromise();
                }
              }
            } catch (e) {
              Log.error(`An error occurs while scrolling to the newly created Item: ${e}`);
            }
          }
          // fire ModelContextChange on the message button whenever the table context changes
          this.messageButton.fireModelContextChange();
        },
        onTableBindingUpdated() {
          this.messageButton.fireModelContextChange();
        },
        async onCallAction(oView, sActionName, mParameters) {
          const oController = oView.getController();

          // Wait for VH values to be resolved before calling the action
          await oController.editFlow.syncTask();
          return oController.editFlow.invokeAction(sActionName, mParameters).then(res => {
            oController._showMessagePopover();
            return res;
          }).catch(() => {
            oController._showMessagePopover();
          });
        },
        onDataPointTitlePressed(oController, oSource, oManifestOutbound, sControlConfig, sCollectionPath) {
          oManifestOutbound = typeof oManifestOutbound === "string" ? JSON.parse(oManifestOutbound) : oManifestOutbound;
          const oTargetInfo = oManifestOutbound[sControlConfig],
            oDataPointOrChartBindingContext = oSource.getBindingContext(),
            sMetaPath = oDataPointOrChartBindingContext.getModel().getMetaModel().getMetaPath(oDataPointOrChartBindingContext.getPath());
          let aSemanticObjectMapping = CommonUtils.getSemanticObjectMapping(oTargetInfo),
            aNavigationData = oController._getChartContextData(oDataPointOrChartBindingContext, sCollectionPath),
            additionalNavigationParameters;
          aNavigationData = aNavigationData.map(function (oNavigationData) {
            return {
              data: oNavigationData,
              metaPath: sMetaPath + (sCollectionPath ? `/${sCollectionPath}` : "")
            };
          });
          if (oTargetInfo && oTargetInfo.parameters) {
            const oParams = oTargetInfo.parameters && oController._intentBasedNavigation.getOutboundParams(oTargetInfo.parameters);
            if (Object.keys(oParams).length > 0) {
              additionalNavigationParameters = oParams;
            }
          }
          // Check if implicit semantic object mapping is needed
          if (aSemanticObjectMapping.length === 0) {
            const customData = oSource.getCustomData().find(data => data.getKey() === "ValuePropertyPath");
            if (customData) {
              aSemanticObjectMapping = oController._getImplicitSemanticObjectMappingForDataPoints(customData.getValue(), oTargetInfo.semanticObject);
            }
          }
          if (oTargetInfo && oTargetInfo.semanticObject && oTargetInfo.action) {
            oController._intentBasedNavigation.navigate(oTargetInfo.semanticObject, oTargetInfo.action, {
              navigationContexts: aNavigationData,
              semanticObjectMapping: aSemanticObjectMapping,
              additionalNavigationParameters: additionalNavigationParameters
            });
          }
        },
        /**
         * Triggers an outbound navigation when a user chooses the chevron.
         * @param oController
         * @param sOutboundTarget Name of the outbound target (needs to be defined in the manifest)
         * @param oContext The context that contains the data for the target app
         * @param sCreatePath Create path when the chevron is created.
         * @returns Promise which is resolved once the navigation is triggered (??? maybe only once finished?)
         * @final
         */
        async onChevronPressNavigateOutBound(oController, sOutboundTarget, oContext, sCreatePath) {
          return oController._intentBasedNavigation.onChevronPressNavigateOutBound(oController, sOutboundTarget, oContext, sCreatePath);
        },
        onNavigateChange(oEvent) {
          //will be called always when we click on a section tab
          this.bSectionNavigated = true;

          // Prevent ViewState from overriding the user's manual tab selection.
          // This is important after discard when ViewState.apply might try to restore the previous section.
          this.skipViewStateSectionRestore = true;
          const subSection = oEvent.getParameter("subSection");
          this.targetSubSection = subSection;
          this.getExtensionAPI().updateAppState();
          const oInternalModelContext = this.getView().getBindingContext("internal");
          if (CommonUtils.getIsEditable(this.getView()) && this.getView().getViewData().sectionLayout === "Tabs" && oInternalModelContext.getProperty("errorNavigationSectionFlag") === false) {
            this._updateFocusInEditMode([subSection], true);
          }
        },
        onVariantSelected: function () {
          this.getExtensionAPI().updateAppState();
        },
        onVariantSaved: function () {
          //TODO: Should remove this setTimeOut once Variant Management provides an api to fetch the current variant key on save
          setTimeout(() => {
            this.getExtensionAPI().updateAppState();
          }, 2000);
        },
        navigateToSubSection: function (oController, vDetailConfig) {
          const oDetailConfig = typeof vDetailConfig === "string" ? JSON.parse(vDetailConfig) : vDetailConfig;

          // Determine the target ID based on input type
          let targetId;
          if (typeof oDetailConfig === "string") {
            targetId = oDetailConfig;
          } else {
            // Priority: subSectionId > sectionId
            targetId = oDetailConfig.subSectionId ?? oDetailConfig.sectionId;
          }
          if (targetId) {
            oController.getExtensionAPI().navigateToSubSection(targetId);
          }
        },
        closeCollaborationStrip: function () {
          this.getView().getModel("ui").setProperty("/showCollaborationStrip", false);
        },
        closeOPMessageStrip: function () {
          const view = this.getView();
          const bIsInEditMode = CommonUtils.getIsEditable(view);
          const internalModel = view.getModel("internal");
          const messagestripInternalModelContext = internalModel.bindContext(this.getExtensionAPI()._getMessageStripBindingContextPath()).getBoundContext();
          // Remove context bound messages and set the property to false for the backend transition messages in edit mode.
          if (!bIsInEditMode && messagestripInternalModelContext.getProperty("OPBackendMessageVisible") === true) {
            const contextBoundMessages = Messaging.getMessageModel().getData().filter(message => message.getTargets()[0] === this.getView().getBindingContext()?.getPath() && message.getPersistent() === true);
            if (contextBoundMessages.length === 1) {
              Messaging.removeMessages(contextBoundMessages);
            }
          }
          messagestripInternalModelContext.setProperty("OPBackendMessageVisible", false);
          this.getExtensionAPI().hideMessage();
        }
      };
      return _this;
    }
    _inheritsLoose(ObjectPageController, _PageController);
    var _proto = ObjectPageController.prototype;
    /**
     * Returns controls (Button / MenuButton) that are marked as "primary action".
     * The marker is set by the converters when an action is emphasized (annotation-based) or
     * configured as primaryAction (custom action defined in the manifest).
     * @param root Root control to start the search from
     * @param onlyActionable If true, only actionable (enabled) candidates are returned
     * @returns An array of controls that are candidates for primary action shortcuts
     */
    _proto._getPrimaryActionShortcutCandidates = function _getPrimaryActionShortcutCandidates(root) {
      let onlyActionable = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      return root.findAggregatedObjects(true, object => {
        const isButton = object.isA("sap.m.Button");
        const isMenuButton = object.isA("sap.m.MenuButton");
        if (!isButton && !isMenuButton) {
          return false;
        }
        const ctrl = object;
        const flag = ctrl.getCustomData().find(customData => customData.getKey() === "fePrimaryActionShortcut")?.getValue();
        if (flag !== true && flag !== "true") {
          return false;
        }
        if (!ctrl.getVisible()) {
          return false;
        }
        // For focus placement we must ignore disabled candidates.
        return onlyActionable ? ctrl.getEnabled() : true;
      });
    };
    _proto.getExtensionAPI = function getExtensionAPI(sId) {
      if (sId) {
        // to allow local ID usage for custom pages we'll create/return own instances for custom sections
        this.mCustomSectionExtensionAPIs = this.mCustomSectionExtensionAPIs || {};
        if (!this.mCustomSectionExtensionAPIs[sId]) {
          this.mCustomSectionExtensionAPIs[sId] = new ExtensionAPI(this, sId);
        }
        return this.mCustomSectionExtensionAPIs[sId];
      } else {
        if (!this.extensionAPI) {
          this.extensionAPI = new ExtensionAPI(this);
        }
        return this.extensionAPI;
      }
    };
    _proto.onInit = function onInit() {
      _PageController.prototype.onInit.call(this);
      const oObjectPage = this._getObjectPageLayoutControl();

      // Setting defaults of internal model context
      const oInternalModelContext = this.getOwnerComponent().getBindingContext("internal");
      oInternalModelContext?.setProperty("externalNavigationContext", {
        page: true
      }, undefined, true);
      oInternalModelContext?.setProperty("relatedApps", {
        visibility: false,
        items: null
      }, undefined, true);
      oInternalModelContext?.setProperty("batchGroups", this._getBatchGroupsForView());
      oInternalModelContext?.setProperty("errorNavigationSectionFlag", false);
      if (this.getDisableObjectPageRequestOptimization()) {
        oObjectPage.attachEvent("subSectionEnteredViewPort", this._handleSubSectionEnteredViewPort.bind(this));
      } else {
        this._getAllSubSections().forEach(subSection => {
          subSection.attachEvent("subSectionEnteredViewPort", this._handleSubSectionEnteredViewPort.bind(this));
        });
      }
      this.messageButton = this.getView().byId("fe::FooterBar::MessageButton");
      this.messageBinding = Messaging.getMessageModel().bindList("/");
      this.messageBinding?.attachChange(this._fnShowOPMessage, this);
      oInternalModelContext?.setProperty("rootEditEnabled", true, undefined, true);
      oInternalModelContext?.setProperty("rootEditVisible", true, undefined, true);
      this._handleSmartSummaryStartupAction();
    };
    _proto.onExit = function onExit() {
      if (this.mCustomSectionExtensionAPIs) {
        for (const sId of Object.keys(this.mCustomSectionExtensionAPIs)) {
          if (this.mCustomSectionExtensionAPIs[sId]) {
            this.mCustomSectionExtensionAPIs[sId].destroy();
          }
        }
        delete this.mCustomSectionExtensionAPIs;
      }
      if (this.extensionAPI) {
        this.extensionAPI.destroy();
      }
      delete this.extensionAPI;
      const oMessagePopover = this.messageButton ? this.messageButton.oMessagePopover : null;
      if (oMessagePopover && oMessagePopover.isOpen()) {
        oMessagePopover.close();
      }
      //when exiting we set keepAlive context to false
      const oContext = this.getView().getBindingContext();
      if (oContext && oContext.isKeepAlive()) {
        oContext.setKeepAlive(false);
      }
      this.collaborativeDraft.disconnect(); // Cleanup collaboration connection when leaving the app

      this.messageBinding?.detachChange(this._fnShowOPMessage, this);
    }

    /**
     * Method to show the message strip on the object page.
     *
     */;
    _proto._fnShowOPMessage = function _fnShowOPMessage() {
      if (this.getAppComponent().isSuspended()) {
        // If the app is suspended, we do not show the messages (the MessageModel contains messages from the active app).
        return;
      }
      const extensionAPI = this.getExtensionAPI();
      const view = this.getView();
      const messages = Messaging?.getMessageModel().getData().filter(message => {
        return message.getTargets()[0] === view.getBindingContext()?.getPath();
      });
      if (extensionAPI) {
        extensionAPI._showMessages(messages, "Backend");
      }
    };
    _proto._getTableBinding = function _getTableBinding(oTable) {
      return oTable && oTable.getRowBinding();
    }

    /**
     * Add the sapUxAPObjectPageSubSectionFitContainer CSS class to every visible subsection that contains only a single GridTable or TreeTable.
     * This makes the table fill the full height of its container so that the scrollbar appears on the table itself rather than on the page.
     * @param subSections The sub sections to look for
     */;
    _proto.checkSectionsForNonResponsiveTable = function checkSectionsForNonResponsiveTable(subSections) {
      const changeClassForTables = (event, visibleSubSection) => {
        const blocks = [...visibleSubSection.getBlocks(), ...visibleSubSection.getMoreBlocks()].filter(block => block.isA("sap.fe.templates.ObjectPage.controls.SubSectionBlock"));
        if (blocks.length === 1) {
          const table = this.searchTableInBlock(blocks[0]);
          if (!table) {
            return;
          }
          const tableType = table.isA("sap.ui.mdc.Table") && table.getType();
          const tableAPI = table.getParent()?.isA("sap.fe.macros.Table") ? table.getParent() : undefined;
          const tableControl = tableAPI?.getTableDefinition().control;
          if (tableType && (tableType?.isA("sap.ui.mdc.table.GridTableType") || tableType?.isA("sap.ui.mdc.table.TreeTableType")) && tableControl?.rowCountMode === "Auto" && (
          // Exclude CreationRow mode unless sectionLayout is Tabs: the fit-container style creates whitespace in the subsection in edit mode when CreationRow is used in TableCreationOptions
          tableControl?.creationMode !== CreationMode.CreationRow || this.getView().getViewData().sectionLayout === "Tabs")) {
            //In case there is only a single table in a subSection we fit that to the whole page so that the scrollbar comes only on table and not on page
            visibleSubSection.addStyleClass("sapUxAPObjectPageSubSectionFitContainer");
            visibleSubSection.detachEvent("modelContextChange", changeClassForTables, this);
          }
        }
      };
      for (const subSection of subSections) {
        if (subSection.getVisible()) {
          // We need to attach this event in order to manage the Object Page Lazy Loading mechanism
          subSection.attachEvent("modelContextChange", subSection, changeClassForTables, this);
        }
      }
    }

    /**
     * Find a table in blocks of section.
     * @param block One sub section block
     * @returns Table if exists
     */;
    _proto.searchTableInBlock = function searchTableInBlock(block) {
      let tableAPI;
      const getTableAPI = control => {
        // The table may currently be shown in a full screen dialog, we can then get the reference to the TableAPI
        // control from the custom data of the place holder panel
        if (control.isA("sap.m.Panel") && control.data("FullScreenTablePlaceHolder")) {
          return control.data("tableAPIreference");
        } else if (control.isA("sap.fe.macros.Table")) {
          return control;
        }
      };
      if (block.isA("sap.fe.templates.ObjectPage.controls.SubSectionBlock")) {
        const control = block.content;
        if (control.isA("sap.ui.layout.DynamicSideContent")) {
          const mainContent = control.getMainContent()[0];
          const mainContentTableAPI = getTableAPI(mainContent);
          if (mainContentTableAPI) {
            tableAPI = mainContentTableAPI;
          } else {
            const sideContent = control.getSideContent()[0];
            const sideContentTableAPI = getTableAPI(sideContent);
            if (sideContentTableAPI) {
              tableAPI = sideContentTableAPI;
            }
          }
        } else {
          tableAPI = getTableAPI(control);
        }
        if (tableAPI) {
          return tableAPI.content;
        }
      }
      return undefined;
    };
    _proto.onBeforeRendering = function onBeforeRendering() {
      PageController.prototype.onBeforeRendering.apply(this);
      // In the retrieveTextFromValueList scenario we need to ensure in case of reload/refresh that the meta model in the methode retrieveTextFromValueList of the FieldRuntime is available
      if (this.oView.getViewData()?.retrieveTextFromValueList && CommonHelper.getMetaModel() === undefined) {
        CommonHelper.setMetaModel(this.getAppComponent().getMetaModel());
      }
    };
    _proto.onAfterRendering = function onAfterRendering() {
      let subSections;
      if (this._getObjectPageLayoutControl().getUseIconTabBar()) {
        const sections = this._getObjectPageLayoutControl().getSections();
        for (const section of sections) {
          subSections = section.getSubSections();
          this.checkSectionsForNonResponsiveTable(subSections);
        }
      } else {
        subSections = this._getAllSubSections();
        this.checkSectionsForNonResponsiveTable(subSections);
      }
    };
    _proto._onBeforeBinding = function _onBeforeBinding(oContext) {
      let mParameters = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      // Reset flag to allow section restoration on this new binding context.
      // This ensures ViewState.apply() can properly restore sections after discard or re-navigation.
      this.skipViewStateSectionRestore = false;

      // Store targetControlId for scrolling after binding completes
      this.pendingTargetControlId = mParameters.targetControlId;

      // Apply targetControlId only on initial navigation - don't apply during edit/save/discard transitions
      // to preserve user's section selection. Note: getView().getBindingContext() returns the OLD context
      // therefore the oContext parameter is used.
      const currentContextPath = oContext?.getPath();
      const getEntityIdentity = path => {
        if (!path) return undefined;
        // Remove IsActiveEntity from the path to get entity identity
        // e.g., "/Products(ID=1,IsActiveEntity=true)" -> "/Products(ID=1)"
        return path.replace(/,?IsActiveEntity=(true|false),?/, "").replace(/\(\s*,/, "(").replace(/,\s*\)/, ")");
      };
      const currentEntityId = getEntityIdentity(currentContextPath);
      const previousEntityId = getEntityIdentity(this.previousBindingContextPath);
      this.isNewBindingContext = previousEntityId !== currentEntityId;
      this.previousBindingContextPath = currentContextPath;
      const aTables = this._findTables(),
        oObjectPage = this._getObjectPageLayoutControl(),
        oInternalModelContext = this.getView().getBindingContext("internal"),
        oInternalModel = this.getView().getModel("internal"),
        aBatchGroups = oInternalModelContext.getProperty("batchGroups");
      let oFastCreationRow;
      aBatchGroups.push("$auto");
      if (mParameters.reason !== NavigationReason.EditFlowAction) {
        this._closeSideContent();
      }
      const opContext = oObjectPage.getBindingContext();
      if (opContext && opContext.hasPendingChanges() && !aBatchGroups.some(opContext.getModel().hasPendingChanges.bind(opContext.getModel()))) {
        /* 	In case there are pending changes for the creation row and no others we need to reset the changes
        					TODO: this is just a quick solution, this needs to be reworked
        					*/

        opContext.getBinding().resetChanges();
      }

      // For now we have to set the binding context to null for every fast creation row
      // TODO: Get rid of this coding or move it to another layer - to be discussed with MDC and model
      for (const item of aTables) {
        oFastCreationRow = item.getCreationRow();
        if (oFastCreationRow) {
          oFastCreationRow.setBindingContext(null);
        }
      }

      // Scroll to present Section so that bindings are enabled during navigation through paginator buttons, as there is no view rerendering/rebind
      const fnScrollToPresentSection = function () {
        if (!oObjectPage.isFirstRendering?.() && !mParameters.bPersistOPScroll) {
          oObjectPage.setSelectedSection(null);
        }
      };
      oObjectPage.attachEventOnce("modelContextChange", fnScrollToPresentSection);
      const fnOPRenderingLayout = {
        onAfterRendering: () => {
          if (this.getView().getViewData()?.editableHeaderContent) {
            fnScrollToPresentSection();
          }
          oObjectPage.removeEventDelegate(fnOPRenderingLayout);
        }
      };
      oObjectPage.addEventDelegate(fnOPRenderingLayout);

      //Set the Binding for Paginators using ListBinding ID
      this._initializePagination(oContext, oInternalModel, mParameters?.listBinding);
      this._disableBlocksBindings(oObjectPage);
      this.subSections = this.disconnectSubSectionVisibilityObservers(oObjectPage);
      this.waitForVisibilityBindings = this.waitForAllSubSectionVisibilityBindingsResolved();
      if (this.placeholder.isPlaceholderEnabled() && mParameters.showPlaceholder) {
        const oView = this.getView();
        const oNavContainer = oView.getParent().oContainer.getParent();
        if (oNavContainer) {
          this.placeholder.enableAnimation();
          oNavContainer.showPlaceholder({});
        }
      }
    }

    /**
     * Disconnect the visibility observers of all FE subsections.
     * @param objectPageLayout
     * @returns The subsections information or undefined if optimization is disabled
     */;
    _proto.disconnectSubSectionVisibilityObservers = function disconnectSubSectionVisibilityObservers(objectPageLayout) {
      if (!this.getDisableObjectPageRequestOptimization()) {
        objectPageLayout.setVisible(false);
        const subSectionsInfo = {
          fe: [],
          others: []
        };
        this._getAllSubSections().forEach(subSection => {
          if (subSection.isA("sap.fe.macros.controls.section.SubSection")) {
            subSectionsInfo.fe.push(subSection);
          } else {
            subSectionsInfo.others.push(subSection);
          }
        });
        subSectionsInfo.fe.forEach(subSection => subSection.disconnectVisibilityObserver());
        return subSectionsInfo;
      }
      return undefined;
    }

    /**
     * Get the loading strategy for the object page.
     * @returns The loading strategy for the object page.
     */;
    _proto.getDisableObjectPageRequestOptimization = function getDisableObjectPageRequestOptimization() {
      return this._getObjectPageLayoutControl().data("disableObjectPageRequestOptimization") === "true";
    };
    _proto.getFirstEditableInput = function getFirstEditableInput() {
      const domEditableElement = this._getObjectPageLayoutControl()._getFirstEditableInput();
      return domEditableElement ? UI5Element.closestTo(domEditableElement) : undefined;
    }

    /**
     * Get the first clickable element in the object page.
     * @private
     * @param objectPage Object Page Layout control
     * @returns The first clickable element found
     */;
    _proto.getFirstClickableElement = function getFirstClickableElement(objectPage) {
      // In display mode, if a visible primary action with the emphasis exists in the footer, it must be the first clickable element on the page.
      const footer = objectPage.getFooter();
      const footerPrimaryAction = footer ? this._getPrimaryActionShortcutCandidates(footer, true)[0] : undefined;
      if (footerPrimaryAction) {
        return footerPrimaryAction;
      }
      // Fallback: first visible & enabled header action (Edit, etc.)
      let firstClickableElement;
      const actions = objectPage.getHeaderTitle() && objectPage.getHeaderTitle().getActions();
      if (actions?.length) {
        firstClickableElement = actions.find(function (action) {
          // Due to the left alignment of the Draft switch and the collaborative draft avatar controls
          // there is a ToolbarSpacer in the actions aggregation which we need to exclude here!
          // Due to the ACC report, we also need not to check for the InvisibleText elements
          if (action.isA("sap.fe.macros.ai.SummarizationButton")) {
            return action.getContent()?.getVisible() ?? false;
          } else if (action.isA("sap.fe.macros.Share") || action.isA("sap.fe.macros.ai.EasyFillButton") || action.isA("sap.fe.templates.ObjectPage.components.CollaborationDraft")) {
            // since Share and CollaborationDraft does not have a disable property
            // hence there is no need to check if it is disabled or not
            return action.getVisible();
          } else if (!action.isA("sap.ui.core.InvisibleText") && !action.isA("sap.m.ToolbarSpacer")) {
            return action.getVisible() && action.getEnabled();
          }
        });
      }
      return firstClickableElement;
    }

    /**
     * Disable the bindings of blocks in Object Page Layout based on the its overall content.
     * @param objectPage Object Page Layout control
     */;
    _proto._disableBlocksBindings = function _disableBlocksBindings(objectPage) {
      const aSections = objectPage.getSections();
      const bUseIconTabBar = objectPage.getUseIconTabBar();
      let iSkip = 3; // 3 sections/subsections are loaded initially, the others are loaded lazily
      const bIsInEditMode = CommonUtils.getIsEditable(this.getView());
      const bEditableHeader = this.getView().getViewData().editableHeaderContent;
      const firstVisibilityBinding = this._getfirstSubSectionVisibilityBinding();
      for (let iSection = 0; iSection < aSections.length; iSection++) {
        const oSection = aSections[iSection];
        const aSubSections = oSection.getSubSections();
        for (let iSubSection = 0; iSubSection < aSubSections.length; iSubSection++, iSkip--) {
          // In IconTabBar mode keep the second section bound if there is an editable header and we are switching to display mode
          const oSubSection = aSubSections[iSubSection];
          const disableBindingContextCondition = this.getDisableObjectPageRequestOptimization() && (iSkip < 1 || bUseIconTabBar && (iSection > 1 || iSection === 1 && !bEditableHeader && !bIsInEditMode)) || !this.getDisableObjectPageRequestOptimization() && (!bUseIconTabBar && (iSkip < 1 || oSubSection.getBinding("visible")) ||
          //if we are not in IconTabBar mode, all section with index >=3 or with visibility binding should be disconnected
          !bUseIconTabBar && !firstVisibilityBinding && iSkip < 1 ||
          // if no subsection has visibility binding and we are not in IconTabBar mode
          bUseIconTabBar && (iSection > 1 || iSection === 1 && !bEditableHeader && !bIsInEditMode));
          if (disableBindingContextCondition) {
            // SubSection's binding is enabled.
            oSubSection.setBindingContext(undefined);
            const blocks = oSubSection.getBlocks();
            // SubSection's contents binding is disabled.
            blocks.forEach(block => {
              if (block.isA("sap.fe.templates.ObjectPage.controls.SubSectionBlock")) {
                block.content.setBindingContext?.(null);
              } else {
                block.setBindingContext(null);
              }
            });
            oSubSection.getMoreBlocks().forEach(subBlock => subBlock.setBindingContext(null));
            oSubSection.getActions().forEach(actions => actions.setBindingContext(null));
          }
        }
      }
    };
    _proto._getFirstEmptyMandatoryFieldFromSubSection = function _getFirstEmptyMandatoryFieldFromSubSection(aSubSections) {
      if (aSubSections.length === 0) return undefined;
      for (const subSection of aSubSections) {
        const aBlocks = subSection.getBlocks();
        if (aBlocks) {
          for (const blockControl of aBlocks) {
            if (blockControl.getBindingContext?.()) {
              let aFormContainers;
              if (blockControl.isA("sap.ui.layout.form.Form")) {
                aFormContainers = blockControl.getFormContainers();
              } else if (blockControl.getContent && blockControl.getContent()?.isA("sap.ui.layout.form.Form")) {
                aFormContainers = blockControl.getContent().getFormContainers();
              } else if (blockControl?.getContent?.()?.isA("sap.fe.macros.form.FormAPI")) {
                aFormContainers = blockControl.getContent().getContent().getFormContainers();
              }
              if (aFormContainers) {
                for (const formContainer of aFormContainers) {
                  const aFormElements = formContainer.getFormElements();
                  if (aFormElements) {
                    for (const formElement of aFormElements) {
                      const aFields = formElement.getFields();
                      const emptyField = this.getFirstEmptyRequiredField(aFields);
                      if (emptyField) return emptyField;
                    }
                  }
                }
              }
            }
          }
        }
      }
      return undefined;
    }

    /**
     * Verify if the first field is empty and required.
     * @param fields The fields to check
     * @returns The first empty required field or undefined if no such field exists
     */;
    _proto.getFirstEmptyRequiredField = function getFirstEmptyRequiredField(fields) {
      if (!fields || fields.length === 0) return;
      if (!fields[0].getRequired?.()) return;
      let isEmpty = false;
      try {
        if (fields[0].isA("sap.fe.macros.MultiValueField")) {
          const items = fields[0].getMultiValueField().getItems();
          isEmpty = items.length === 0;
        } else {
          const value = fields[0].getValue();
          isEmpty = !value;
        }
      } catch (error) {
        Log.debug(`Error when checking field properties: ${error}`);
      }
      return isEmpty ? fields[0] : undefined;
    }

    /**
     * Set the initial focus in edit mode.
     * @param aSubSections Object page sub sections
     * @param fromTabNavigation Indicates if the focus is set after a tab navigation
     */;
    _proto._updateFocusInEditMode = function _updateFocusInEditMode(aSubSections) {
      let fromTabNavigation = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      setTimeout(function () {
        // We set the focus in a timeeout, otherwise the focus sometimes goes to the TabBar
        const oObjectPage = this._getObjectPageLayoutControl();
        const oMandatoryField = this._getFirstEmptyMandatoryFieldFromSubSection(aSubSections);
        let oFieldToFocus;
        if (oMandatoryField) {
          if (oMandatoryField.isA("sap.fe.macros.MultiValueField")) {
            oFieldToFocus = oMandatoryField.getMultiValueField();
          } else {
            oFieldToFocus = oMandatoryField.content.getContentEdit()[0];
          }
        } else {
          oFieldToFocus = this.getFirstEditableInput() ?? this.getFirstClickableElement(oObjectPage);
        }
        if (oFieldToFocus) {
          const focusInfo = oFieldToFocus.getFocusInfo();
          focusInfo.targetInfo = {
            silent: true
          };
          if (oFieldToFocus.isA("sap.ui.mdc.field.FieldInput")) {
            oFieldToFocus = oFieldToFocus.getParent();
          }
          if (oFieldToFocus?.isA("sap.m.SearchField") && oFieldToFocus.getEnableSuggestions() && !oFieldToFocus.isBound("enableSuggestions")) {
            // In case the focus is set on a search field with suggestions, we temporarily disable the suggestions to avoid triggering them on focus
            // unless this property is bound (to avoid modifying something in a model)
            oFieldToFocus.setEnableSuggestions(false);
            oFieldToFocus.focus(focusInfo);
            oFieldToFocus.setEnableSuggestions(true);
          } else {
            oFieldToFocus?.focus(focusInfo);
          }
        }
      }.bind(this), fromTabNavigation ? 300 : 0);
    }

    /**
     * Get the first sub-section with a visibility bound to the model of the view.
     * Sections with bindings on internal models only are ignored.
     * @returns The visibility binding of the first sub-section or undefined if not found.
     */;
    _proto._getfirstSubSectionVisibilityBinding = function _getfirstSubSectionVisibilityBinding() {
      const allsubSections = this._getAllSubSections();
      const currentModel = this.getView().getModel();
      return allsubSections.find(subSection => subSection.getBinding("visible")?.getBindings?.().some(binding => binding.getModel() === currentModel))?.getBinding("visible");
    }

    /**
     * Wait for all subsection visibility bindings to be resolved.
     * This method listens for the 'visibilityChanged' event  . The change event is fired even if the values are not changed but just resolved.
     * @returns An array of promises that resolve when each visibility binding is resolved.
     */;
    _proto.waitForAllSubSectionVisibilityBindingsResolved = function waitForAllSubSectionVisibilityBindingsResolved() {
      return this._getAllSubSections().filter(subSection => subSection.isA("sap.fe.macros.controls.section.SubSection") && subSection.getBinding("visible")) //filtering on FE subsections with visibility binding)
      .map(async subSection => {
        return new Promise(resolve => subSection.attachEventOnce("visibilityChanged", resolve));
      });
    };
    _proto._handleSubSectionEnteredViewPort = function _handleSubSectionEnteredViewPort(oEvent) {
      const oSubSection = oEvent.getParameter("subSection");
      if (oSubSection.isA("sap.fe.macros.controls.section.SubSection")) {
        oSubSection.handleSubSectionCreated(this.getView());
      }
      const blocks = oSubSection.getBlocks();
      blocks.forEach(block => {
        if (block.isA("sap.fe.templates.ObjectPage.controls.SubSectionBlock")) {
          block.content.setBindingContext?.(undefined);
        } else {
          block.setBindingContext(undefined);
        }
      });
      oSubSection.getMoreBlocks().forEach(subBlock => subBlock.setBindingContext(undefined));
      oSubSection.getActions().forEach(actions => actions.setBindingContext(undefined));
    };
    _proto._onBackNavigationInDraft = function _onBackNavigationInDraft(oContext) {
      this.messageHandler.removeTransitionMessages();

      // Function to navigate back, or display the launchpad if we're on the first page of the history
      const navBack = () => {
        // Use the new Navigation API if it's available in the browser, to check if we can go back in history.
        const canGoBack = window.navigation?.canGoBack;
        if (canGoBack === true) {
          history.back();
        } else if (canGoBack === false) {
          this._routing.navigateBackFromContext(oContext);
        } else {
          // Fallback in case the browser doesn't support the Navigation API
          const currentURL = document.URL;
          history.back();
          // In case there is no previous page in the history, history.back does nothing.
          // In this case, we need to use navigateBackFromContext, that will display the home page
          setTimeout(() => {
            if (document.URL === currentURL) {
              this._routing.navigateBackFromContext(oContext);
            }
          }, 500);
        }
      };
      if (this.getAppComponent().getRouterProxy().checkIfBackHasSameContext()) {
        // Back nav will keep the same context --> no need to display the dialog
        history.back();
      } else if (!this.getView().getBindingContext()) {
        // This object page doesn't have a binding context, but still handles the shell back navigation --> pform the nav back and remove the navback handler as it makes no sense any longer
        this.getAppComponent().getShellServices().setBackNavigation(undefined).then(navBack).catch(e => {
          Log.warning("Error while setting back navigation", e);
        });
      } else {
        const hiddenDraftEnabled = this.getAppComponent()?.getEnvironmentCapabilities()?.getCapabilities()?.HiddenDraft?.enabled;
        draft.processDataLossOrDraftDiscardConfirmation(navBack, Function.prototype, oContext, this, true, draft.NavigationType.BackNavigation, undefined, hiddenDraftEnabled ? true : undefined);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ;
    _proto._onAfterBinding = function _onAfterBinding(inputBindingContext, mParameters) {
      const view = this.getView();
      const viewLevel = view?.getViewData()?.viewLevel;
      const oObjectPage = this._getObjectPageLayoutControl();
      const aTables = this._findTables();
      if ([NavigationReason.EditFlowAction, NavigationReason.RowPress].includes(mParameters?.reason)) {
        this.editFlow.storeSiblingContextData(inputBindingContext);
      }
      this.sideEffects.clearFieldGroupsValidity();

      // TODO: this is only a temp solution as long as the model fix the cache issue and we use this additional
      // binding with ownRequest
      const bindingContext = oObjectPage.getBindingContext();
      let aIBNActions = [];
      oObjectPage.getSections().forEach(function (oSection) {
        oSection.getSubSections().forEach(function (oSubSection) {
          aIBNActions = CommonUtils.getIBNActions(oSubSection, aIBNActions);
        });
      });

      // Assign internal binding contexts to oFormContainer:
      // 1. It is not possible to assign the internal binding context to the XML fragment
      // (FormContainer.fragment.xml) yet - it is used already for the data-structure.
      // 2. Another problem is, that FormContainers assigned to a 'MoreBlock' does not have an
      // internal model context at all.

      aTables.forEach(function (oTable) {
        const oInternalModelContext = oTable.getBindingContext("internal");
        if (oInternalModelContext) {
          oInternalModelContext.setProperty("creationRowFieldValidity", {});
          oInternalModelContext.setProperty("creationRowCustomValidity", {});
          aIBNActions = CommonUtils.getIBNActions(oTable, aIBNActions);

          // temporary workaround for BCP: 2080218004
          // Need to fix with BLI: FIORITECHP1-15274
          // only for edit mode, we clear the table cache
          // Workaround starts here!!
          const oTableRowBinding = oTable.getRowBinding();
          if (oTableRowBinding) {
            if (ModelHelper.isStickySessionSupported(oTableRowBinding.getModel().getMetaModel())) {
              // apply for both edit and display mode in sticky
              oTableRowBinding.removeCachesAndMessages("");
            }
          }
          // Workaround ends here!!

          // Clear the selection in the table and update action enablement accordingly
          // Will to be fixed with BLI: FIORITECHP1-24318
          const tableAPI = oTable.getParent();
          const oActionOperationAvailableMap = tableAPI ? JSON.parse(tableAPI.tableDefinition.operationAvailableMap) : {};
          ActionRuntime.setActionEnablement(oInternalModelContext, oActionOperationAvailableMap, [], "table");
          oTable.clearSelection();
        }
      });
      //Retrieve Object Page header actions from Object Page title control
      const oObjectPageTitle = oObjectPage.getHeaderTitle();
      let aIBNHeaderActions = [];
      aIBNHeaderActions = CommonUtils.getIBNActions(oObjectPageTitle, aIBNHeaderActions);
      aIBNActions = aIBNActions.concat(aIBNHeaderActions);
      CommonUtils.updateDataFieldForIBNButtonsVisibility(aIBNActions, this.getView());
      let oModel,
        oFinalUIState = Promise.resolve();

      // this should not be needed at the all
      /**
       * @param oTable
       */
      const handleTableModifications = oTable => {
        const oBinding = this._getTableBinding(oTable),
          fnHandleTablePatchEvents = function () {
            TableHelper.enableFastCreationRow(oTable.getCreationRow(), oBinding.getPath(), oBinding.getContext(), oModel, oFinalUIState);
          };
        if (!oBinding) {
          Log.error(`Expected binding missing for table: ${oTable.getId()}`);
          return;
        }
        if (oBinding.getContext()) {
          fnHandleTablePatchEvents();
        } else {
          const fnHandleChange = function () {
            if (oBinding.getContext()) {
              fnHandleTablePatchEvents();
              oBinding.detachChange(fnHandleChange);
            }
          };
          oBinding.attachChange(fnHandleChange);
        }
      };
      if (bindingContext) {
        oModel = bindingContext.getModel();

        // Store navigation parameters in internal model for access by controller extensions
        const internalModelContext = this.getView().getBindingContext("internal");
        if (mParameters) {
          internalModelContext?.setProperty("navigationParameters", mParameters);
        }

        // Compute Edit Mode
        oFinalUIState = this.editFlow.computeModelsForEditMode(bindingContext);

        // update related apps
        this._updateRelatedApps();

        //Attach the patch sent and patch completed event to the object page binding so that we can react
        const oBinding = bindingContext.getBinding && bindingContext.getBinding() || bindingContext;

        // Attach the event handler only once to the same binding
        if (this.currentBinding !== oBinding) {
          oBinding.attachEvent("patchSent", {}, this.editFlow.handlePatchSent, this);
          this.currentBinding = oBinding;
        }
        aTables.forEach(function (oTable) {
          // access binding only after table is bound
          TableUtils.whenBound(oTable).then(handleTableModifications).catch(function (oError) {
            Log.error("Error while waiting for the table to be bound", oError);
          });
        });

        // should be called only after binding is ready hence calling it in onAfterBinding
        if (this.getDisableObjectPageRequestOptimization()) {
          oObjectPage._triggerVisibleSubSectionsEvents();
        }

        //To Compute the Edit Binding of the subObject page using root object page, create a context for draft root and update the edit button in sub OP using the context
        ActionRuntime.updateEditButtonVisibilityAndEnablement(this.getView());
        this._updateAvailableCards([]);
      }
      // we are clearing any previous data from recommendations every time we come to new OP
      // so that cached recommendations are not shown to user
      if (viewLevel && viewLevel === 1) {
        oFinalUIState?.then(() => {
          this.recommendations.clearRecommendations();
          return;
        });
      }
      this.displayCollaborationMessage(mParameters?.redirectedToNonDraft);
      this._setOPMessageStripInternalContext();
      const applyAppState = this.getAppComponent().getAppStateHandler().applyAppState(view);
      this.pageReady.waitFor(applyAppState);
      this.reconnectSubSectionVisibilityObservers(this.subSections, oObjectPage, applyAppState, this.previousBindingContextPath !== this.getView().getBindingContext()?.getPath());

      // Capture synchronously to avoid race with subsequent navigations
      const pendingTargetControlId = this.pendingTargetControlId;
      this.pendingTargetControlId = undefined;
      this.handlePendingTargetControlIdNavigation(applyAppState, oObjectPage, pendingTargetControlId);
    }

    /**
     * Handles navigation to a target section or subsection after app state is applied.
     * This coordinates targetControlId navigation from two sources:
     * - In-app navigation: pendingTargetControlId captured before applyAppState.
     * - Cross-app navigation: xAppState targetControlId stored by AppStateHandler during LR to OP transition.
     * @param applyAppState Promise that resolves when app state has been applied.
     * @param oObjectPage The ObjectPageLayout control.
     * @param pendingTargetControlId The targetControlId captured before applyAppState, if any.
     */;
    _proto.handlePendingTargetControlIdNavigation = function handlePendingTargetControlIdNavigation(applyAppState, oObjectPage, pendingTargetControlId) {
      applyAppState.then(async () => {
        const xAppStateTargetControlId = this.getAppComponent().getAppStateHandler()?.consumePendingTargetControlId();
        const targetControlId = pendingTargetControlId ?? xAppStateTargetControlId;
        if (!targetControlId) {
          return;
        }

        // Wait for visibility bindings  (needed for lazy loading scenarios)
        try {
          await Promise.all(this.waitForVisibilityBindings);
        } catch {
          // Some visibility bindings failed to resolve, proceeding anyway
        }

        // Wait for pageReady to ensure ObjectPage is fully initialized
        await this.pageReady.waitPageReady();

        // Navigate to target section
        this.navigateToTargetSection(oObjectPage, targetControlId);
        return; // Required by linter rule promise/always-return
      }).catch(() => {
        // applyAppState failed - skip targetControlId navigation
      });
    }

    /**
     * Navigates to a target section with automatic re-navigation if UX rules reset the selection.
     * Polls the section state since setSelectedSection() doesn't fire the navigate event.
     * @param oObjectPage The ObjectPageLayout control.
     * @param targetControlId The local ID of the target section or subsection.
     */;
    _proto.navigateToTargetSection = function navigateToTargetSection(oObjectPage, targetControlId) {
      // Determine target section ID for comparison
      const targetControl = this.getView().byId(targetControlId);
      const isSection = targetControl?.isA("sap.uxap.ObjectPageSection");
      const targetSectionId = isSection ? targetControl?.getId() : targetControl?.getParent()?.getId();

      // Navigate function with guard to prevent duplicate calls when already on target
      const navigateToTarget = () => {
        if (oObjectPage.getSelectedSection() === targetSectionId) {
          return; // Already on target section
        }
        this.navigateWithConfirmation(targetControlId);
      };

      // Navigate immediately
      navigateToTarget();

      // Skip polling if already on target section (navigation was no-op or succeeded immediately)
      if (oObjectPage.getSelectedSection() === targetSectionId) {
        this.skipViewStateSectionRestore = true;
        return;
      }

      // Poll to detect UX rules reset only on new entity binding.
      // _adjustSelectedSectionByUXRules() only runs when ObjectPageLayout re-initializes with a new entity.
      if (this.isNewBindingContext) {
        pollForSectionStability({
          getSelectedSection: () => oObjectPage.getSelectedSection(),
          targetSectionId,
          onResetDetected: navigateToTarget
        }).then(() => {
          this.skipViewStateSectionRestore = true;
          return; // Required by linter rule promise/always-return
        }).catch(() => {
          // Required by linter rule promise/catch-or-return - polling failures are non-critical
        });
      }
    }

    /**
     * Sets targetSubSection based on the target control ID for app state persistence.
     * @param targetControlId The local ID of the target section or subsection.
     */;
    _proto.setTargetSubSection = function setTargetSubSection(targetControlId) {
      const targetControl = this.getView().byId(targetControlId);
      if (targetControl?.isA("sap.uxap.ObjectPageSubSection")) {
        this.targetSubSection = targetControl;
      } else if (targetControl?.isA("sap.uxap.ObjectPageSection")) {
        const subSections = targetControl.getSubSections();
        this.targetSubSection = subSections[0];
      }
    }

    /**
     * Performs navigation to the target section and then updates the app state.
     * @param targetControlId The local ID of the target section or subsection.
     */;
    _proto.navigateWithConfirmation = function navigateWithConfirmation(targetControlId) {
      // Set targetSubSection BEFORE navigation for app state saving.
      // scrollToSection() doesn't fire the navigate event, so onNavigateChange won't be called.
      this.setTargetSubSection(targetControlId);
      this.getExtensionAPI().navigateToSubSection(targetControlId);

      // Wait for ExtensionAPI polling to complete (~100ms) plus scroll to finish
      // before updating app state and setting focus.
      setTimeout(() => {
        this.viewState.updateAppStateDebounced();

        // Set focus if in edit mode (for in-app navigation to sub-object page in edit mode)
        // This is needed because scrollToSection() doesn't fire onNavigateChange,
        // so we need to manually trigger focus setting here
        const isInEditMode = CommonUtils.getIsEditable(this.getView());
        if (isInEditMode && this.targetSubSection) {
          this._updateFocusInEditMode([this.targetSubSection], false);
        }
      }, 150);
    }

    /**
     * Reconnect the visibility observers of all FE subsections after the subsection visibility bindings are resolved and the app state is applied.
     * This function wait for the appSate to be applied before reconnecting the observers and the scrolling to the selected section if it changed during the appState application.
     * @param subSectionInfo Subsections information retrieved during disconnection
     * @param objectPageLayout Object Page Layout control
     * @param waitForApplyAppstate Promise that resolves when the app state is applied
     * @param waitForVisibilityBindings Boolean indicating whether to wait for visibility bindings to be resolved before reconnecting observers
     * @returns A promise that resolves to true if the observers were reconnected, false otherwise
     */;
    _proto.reconnectSubSectionVisibilityObservers = async function reconnectSubSectionVisibilityObservers(subSectionInfo, objectPageLayout, waitForApplyAppstate) {
      let waitForVisibilityBindings = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
      if (!this.getDisableObjectPageRequestOptimization() && subSectionInfo) {
        await Promise.all(waitForVisibilityBindings ? this.waitForVisibilityBindings : []).then(async () => {
          objectPageLayout.setVisible(true);
          try {
            //waiting for the app state to be applied bto ensure focusing on the correct section if required
            await waitForApplyAppstate;
          } catch {
            Log.warning("Error while applying app state");
          }
          subSectionInfo.fe.forEach(subSection => subSection.observeCurrentSection());
          subSectionInfo.others.filter(subsection => subsection.getVisible()).forEach(subSection => subSection.fireEvent("subSectionEnteredViewPort", {
            subSection: subSection
          }));
          return;
        }).catch(e => {
          Log.error("Error while applying app state", e);
        });
        return true;
      }
      return false;
    }

    /**
     * Update the cards when the binding is refreshed.
     * @param cards Array of cards to be updated
     */;
    _proto._updateAvailableCards = async function _updateAvailableCards(cards) {
      const collaborationManagerService = this.getAppComponent().getCollaborationManagerService();
      // Only collect cards when consumers are connected to the cards channel
      if (collaborationManagerService.hasCollaborationManagerConnected()) {
        await this.collaborationManager.collectAvailableCards(cards);
        if (cards.length > 0) {
          const cardObject = this.collaborationManager.updateCards(cards);
          const parentAppId = this.getAppComponent().getId();
          collaborationManagerService.addCardsToCollaborationManager(cardObject, parentAppId, this.getView().getId());
          collaborationManagerService.shareAvailableCards();
        }
      }
    }

    /**
     * Set the internal binding context of the Messagestrip OP.
     */;
    _proto._setOPMessageStripInternalContext = function _setOPMessageStripInternalContext() {
      const view = this.getView();
      const oObjectPage = this._getObjectPageLayoutControl();
      const internalModelContext = view.getBindingContext("internal");
      internalModelContext?.setProperty("MessageStrip", {
        ...internalModelContext?.getProperty("MessageStrip")
      });
      if (internalModelContext) {
        oObjectPage.getHeaderTitle()?.findElements(true, elem => elem.isA("sap.m.MessageStrip")).forEach(messageStrip => {
          messageStrip.setBindingContext(internalModelContext.getModel().bindContext(this.getExtensionAPI()._getMessageStripBindingContextPath()).getBoundContext(), "internal");
        });
        // If the view's binding context already had messages that were not cleared, we would need to re-evaluate to show the message strip.
        this._fnShowOPMessage();
      }
    }

    /**
     * Show a message strip if a redirection to a non-draft element has been done.
     * Remove the message strip in case we navigate to another object page.
     * @param entityName Name of the Entity to be displayed in the message
     */;
    _proto.displayCollaborationMessage = function displayCollaborationMessage(entityName) {
      const resourceBundle = Library.getResourceBundleFor("sap.fe.core");
      if (this.collaborationMessage) {
        Messaging.removeMessages([this.collaborationMessage]);
        delete this.collaborationMessage;
      }
      if (entityName) {
        this.collaborationMessage = new Message({
          message: resourceBundle.getText("REROUTED_NAVIGATION_TO_SAVED_VERSION", [entityName]),
          type: MessageType.Information,
          target: this.getView()?.getBindingContext()?.getPath()
        });
        Messaging.addMessages([this.collaborationMessage]);
      }
    };
    _proto.onPageReady = async function onPageReady(mParameters) {
      const setFocus = () => {
        // Set the focus to the first action button, or to the first editable input if in editable mode
        const oObjectPage = this._getObjectPageLayoutControl();
        const isInDisplayMode = !CommonUtils.getIsEditable(this.getView());
        if (isInDisplayMode) {
          const oFirstClickableElement = this.getFirstClickableElement(oObjectPage);
          if (oFirstClickableElement) {
            oFirstClickableElement.focus();
          }
        } else {
          const oSelectedSection = UI5Element.getElementById(oObjectPage.getSelectedSection());
          if (oSelectedSection) {
            this._updateFocusInEditMode(oSelectedSection.getSubSections());
          }
        }
      };
      const ctxt = this.getView().getBindingContext();
      // setting this model data to be used for recommendations binding
      this.getView().getModel("internal").setProperty("/currentCtxt", ctxt);

      // Apply app state only after the page is ready with the first section selected
      const oView = this.getView();
      const oInternalModelContext = oView.getBindingContext("internal");
      const oBindingContext = oView.getBindingContext();
      //Show popup while navigating back from object page in case of draft
      if (oBindingContext) {
        const bIsStickyMode = ModelHelper.isStickySessionSupported(oBindingContext.getModel().getMetaModel());
        if (!bIsStickyMode) {
          const oAppComponent = CommonUtils.getAppComponent(oView);
          await oAppComponent.getShellServices().setBackNavigation(() => this._onBackNavigationInDraft(oBindingContext));
        }
      }
      // do not request recommendations action if we are in Display mode
      const isEditable = CommonUtils.getIsEditable(this.getView());
      if (isEditable && oBindingContext) {
        await this.recommendations.fetchAndApplyRecommendations([{
          context: oBindingContext
        }]);
      }
      if (mParameters?.forceFocus) {
        setFocus();
      }
      oInternalModelContext.setProperty("errorNavigationSectionFlag", false);
      this._checkDataPointTitleForExternalNavigation();

      //The following coding is done to merge an open PATCH and the draftprepare/draftactivate
      //request into one $batch request
      //To achieve this the $auto queue is locked at the mousedown event (before focusout) in
      //order to wait for the draft request issued in the save buttons press event handler.
      //The queue is released again during mouseup (before press).
      //This is only possible on non touch devices because on touch devices the focusout and press
      //events are both initiated at touchend by sap.m.Button.
      //mouseHandlerSet is used to ensures that the event handlers are attached only one time.
      //There can be multiple onPageReady e.g. when switching between edit/display mode
      if (!this.mergePatchDraft && !Device.support.touch) {
        const saveButton = oView.byId("fe::FooterBar::StandardAction::Save");
        const autoQueueUnlock = () => {
          if (this.autoQueueLock?.isLocked()) {
            this.autoQueueLock.unlock();
          }
          saveButton.detachBrowserEvent("mouseup", autoQueueUnlock);
          saveButton.detachBrowserEvent("blur", autoQueueUnlock);
        };
        saveButton?.attachBrowserEvent("mousedown", () => {
          if (!this.autoQueueLock?.isLocked()) {
            this.autoQueueLock = this.getView().getModel().lock("$auto");
            //when the mouse is dragged away from the save button while pressed then there will be no
            //mouseup event on the save button. Therefore, the unlocking is done on "mouseup" and "blur"
            saveButton.attachBrowserEvent("mouseup", autoQueueUnlock);
            saveButton.attachBrowserEvent("blur", autoQueueUnlock);
          }
        });
        this.mergePatchDraft = true;
      }

      // When the user clicks the FCL Close button while a key property field has focus,
      // the field's focus-loss triggers side effects that refresh the OData binding and
      // re-render the ObjectPage header title — removing the Close button from the DOM
      // before the click event fires, so the press is silently lost.
      // Listening on mousedown (which fires before focus-loss) ensures closeColumn() is
      // always called regardless of the subsequent re-render.
      if (!this.fclCloseHandlerSet && !Device.support.touch) {
        const fclCloseButton = oView.byId("fe::FCLStandardAction::Close");
        if (fclCloseButton?.isA("sap.m.Button")) {
          fclCloseButton.attachBrowserEvent("mousedown", () => {
            this._routing.closeColumn();
          });
        }
        this.fclCloseHandlerSet = true;
      }
    }

    /**
     * Get the status of edit mode for sticky session.
     * @returns The status of edit mode for sticky session
     */;
    _proto.getStickyEditMode = function getStickyEditMode() {
      const oBindingContext = this.getView().getBindingContext && this.getView().getBindingContext();
      let bIsStickyEditMode = false;
      if (oBindingContext) {
        const bIsStickyMode = ModelHelper.isStickySessionSupported(oBindingContext.getModel().getMetaModel());
        if (bIsStickyMode) {
          bIsStickyEditMode = CommonUtils.getIsEditable(this.getView());
        }
      }
      return bIsStickyEditMode;
    };
    _proto._getObjectPageLayoutControl = function _getObjectPageLayoutControl() {
      return this.byId("fe::ObjectPage");
    };
    _proto._getPageTitleInformation = async function _getPageTitleInformation() {
      const oObjectPage = this._getObjectPageLayoutControl();
      const oObjectPageSubtitle = oObjectPage.getCustomData().find(function (oCustomData) {
        return oCustomData.getKey() === "ObjectPageSubtitle";
      });
      const oObjectPageDescription = oObjectPage.getCustomData().find(function (oCustomData) {
        return oCustomData.getKey() === "ObjectPageDescription";
      });
      const extractPaths = bindingInfo => Array.from(new Set((bindingInfo?.parts || []).filter(part => !part.model).map(part => part.path || "").filter(Boolean)));
      const subtitlePaths = extractPaths(oObjectPageSubtitle?.getBindingInfo("value"));
      const descriptionPaths = extractPaths(oObjectPageDescription?.getBindingInfo("value"));
      const pathsToResolve = [...subtitlePaths, ...descriptionPaths];
      const appComponent = this.getAppComponent();
      const rootViewController = appComponent.getRootViewController();
      const fnClearCacheTitle = () => {
        rootViewController.invalidateTitleHierarchyCache(oObjectPage.getBindingContext()?.getPath());
      };
      if ((oObjectPageDescription || oObjectPageSubtitle) && !this.invalidateTitleHierarchyCacheSetUp) {
        oObjectPageSubtitle?.getBinding("value")?.attachChange(fnClearCacheTitle, this);
        oObjectPageDescription?.getBinding("value")?.attachChange(fnClearCacheTitle, this);
        this.invalidateTitleHierarchyCacheSetUp = true;
      }
      const oObjectPageContext = oObjectPage.getBindingContext();
      const build = () => ({
        title: oObjectPage.data("ObjectPageTitle") ?? "",
        subtitle: oObjectPageSubtitle?.getValue() ?? "",
        intent: "",
        icon: "",
        description: oObjectPageDescription?.getValue() ?? ""
      });
      //if no context or nothing to resolve, direct return
      if (!oObjectPageContext || pathsToResolve.length === 0) {
        return Promise.resolve(build());
      }
      await Promise.all(pathsToResolve.map(async p => oObjectPageContext.requestProperty(p).catch(() => undefined)));
      return build();
    };
    _proto._executeTabShortCut = function _executeTabShortCut(oExecution) {
      const oObjectPage = this._getObjectPageLayoutControl(),
        aSections = oObjectPage.getSections(),
        iSectionIndexMax = aSections.length - 1,
        sCommand = oExecution.getSource().getCommand();
      let newSection,
        iSelectedSectionIndex = oObjectPage.indexOfSection(this.byId(oObjectPage.getSelectedSection()));
      if (iSelectedSectionIndex !== -1 && iSectionIndexMax > 0) {
        if (sCommand === "NextTab") {
          if (iSelectedSectionIndex <= iSectionIndexMax - 1) {
            newSection = aSections[++iSelectedSectionIndex];
          }
        } else if (iSelectedSectionIndex !== 0) {
          // PreviousTab
          newSection = aSections[--iSelectedSectionIndex];
        }
        if (newSection) {
          oObjectPage.setSelectedSection(newSection);
          newSection.focus();
        }
      }
    };
    _proto._getFooterVisibility = function _getFooterVisibility() {
      const oInternalModelContext = this.getView().getBindingContext("internal");
      const sViewId = this.getView().getId();
      oInternalModelContext.setProperty("messageFooterContainsErrors", false);
      const isHiddenDraftEnabled = this.getAppComponent().getEnvironmentCapabilities().getCapabilities().HiddenDraft?.enabled;
      Messaging.getMessageModel().getData().forEach(function (oMessage) {
        const isErrorMessage = oMessage.validation && oMessage.getType() === "Error";
        const messageValidation = isHiddenDraftEnabled ? isErrorMessage : isErrorMessage && oMessage.getTargets().some(target => target.includes(sViewId));
        if (messageValidation) {
          oInternalModelContext.setProperty("messageFooterContainsErrors", true);
        }
      });
    };
    _proto._showMessagePopover = function _showMessagePopover() {
      const isEditMode = CommonUtils.getIsEditable(this.getView());
      const rootViewController = this.getAppComponent().getRootViewController();
      const currentPageView = rootViewController.isFclEnabled() ? rootViewController.getRightmostView() : this.getAppComponent().getRootContainer().getCurrentPage();
      if (isEditMode && !currentPageView.isA("sap.m.MessagePage")) {
        const oMessageButton = this.messageButton,
          oMessagePopover = oMessageButton.oMessagePopover,
          oItemBinding = oMessagePopover.getBinding("items");
        if (oItemBinding.getLength() > 0 && !oMessagePopover.isOpen()) {
          oMessageButton.setVisible(true);
          // workaround to ensure that oMessageButton is rendered when openBy is called
          setTimeout(function () {
            oMessagePopover.openBy(oMessageButton);
          }, 0);
        }
      }
    };
    _proto._editDocument = async function _editDocument() {
      const oContext = this.getView().getBindingContext();
      const oModel = this.getView().getModel("ui");
      BusyLocker.lock(oModel);
      return this.editFlow.editDocument.apply(this.editFlow, [oContext]).finally(function () {
        BusyLocker.unlock(oModel);
      });
    }

    /**
     * Returns the default semantic object mapping object.
     * @private
     * @param propertyPath The value of the data point property path
     * @param semanticObject The semantic object
     * @returns The array of the default semantic object mapping object
     */;
    _proto._getImplicitSemanticObjectMappingForDataPoints = function _getImplicitSemanticObjectMappingForDataPoints(propertyPath, semanticObject) {
      return [{
        LocalProperty: {
          $PropertyPath: propertyPath
        },
        SemanticObjectProperty: semanticObject
      }];
    }

    /**
     * Executes the validation of the document
     * One of the following actions is triggered on the draft version of the document:
     * - on a transient context:
     * - if the context gets data, wait for the creation of the context and execute the global validation
     * - if no data is found on this context, only the prepareAction is requested
     * - on a regular context, the global validation is requested.
     * @returns Promise of the global validation or undefined if not executed
     */;
    _proto._validateDocument = async function _validateDocument() {
      const control = UI5Element.getActiveElement();
      const context = control?.getBindingContext();
      if (!control || !context) {
        return undefined;
      }
      let byPassSideEffects = false;
      if (context.isTransient()) {
        if (context.hasPendingChanges()) {
          await context.created();
        } else {
          byPassSideEffects = true;
        }
      }
      this.messageHandler.holdMessagesForControl(control);
      const ret = await this.executeGlobalValidation(context, byPassSideEffects);
      this.messageHandler.showMessages({
        control
      });
      return ret;
    }

    /**
     * Executes the global validation of the draft
     * One of the following actions is triggered on the draft version of the document:
     * - the global side effects are executed if these side effects are defined in the context
     * - the draft Validation on the DraftRoot context.
     * @param context The Context
     * @param byPassSideEffects Only the draft Validation step is executed
     * @returns Promise of the global validation
     */;
    _proto.executeGlobalValidation = async function executeGlobalValidation(context) {
      let byPassSideEffects = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      const appComponent = this.getAppComponent();
      // the draft validation is treated as a user interaction, and the service must return transition messages again if still valid
      this.messageHandler.removeTransitionMessages();
      if (!byPassSideEffects) {
        const sideEffectsService = appComponent.getSideEffectsService();
        const entityType = sideEffectsService.getEntityTypeFromContext(context);
        const globalSideEffects = entityType ? sideEffectsService.getGlobalODataEntitySideEffects(entityType) : [];
        // If there is at least one global SideEffects for the related entity, execute it/them
        if (globalSideEffects.length) {
          await this.editFlow.syncTask();
          return Promise.all(globalSideEffects.map(async sideEffects => this.sideEffects.requestSideEffects(sideEffects, context)));
        }
      }
      const draftRootContext = await CommonUtils.createRootContext(ProgrammingModel.Draft, this.getView(), appComponent);
      //Execute the draftValidation if there is no globalSideEffects (ignore ETags in collaboration draft)
      if (draftRootContext) {
        await this.editFlow.syncTask();
        return draft.executeDraftValidation(draftRootContext, appComponent, this.collaborativeDraft.isConnected());
      }
    }

    /**
     * Saves the draft version of the document
     * If data has been provided on the creation rows, the related documents are created
     * before saving the draft version.
     * @param skipBindingToView Indicates if the binding to the view should be skipped
     * @param useSaveAndLeave Indicates if the save is triggered from a save and leave action
     * @returns Promise
     */;
    _proto._saveDocument = async function _saveDocument(skipBindingToView, useSaveAndLeave) {
      const context = this.getView().getBindingContext();
      const model = this.getView().getModel("ui"),
        awaitCreateDocuments = [];
      // indicates if we are creating a new row in the OP
      let executeSideEffectsOnError = false;
      let messagePopoverErr;
      BusyLocker.lock(model);
      try {
        if (this.collaborativeDraft.isCollaborationEnabled()) {
          try {
            const dialogAction = await new CollaborationDiscard(this.getView(), true).getUserAction();
            // We cancel the action
            if (dialogAction === "cancel") {
              return;
            }
            // We keep the draft and leave for LR
            if (dialogAction === "keepDraft") {
              this.collaborativeDraft.disconnect();
              await this._routing.navigateBackFromContext(context);
              return;
            }
          } catch (err) {
            Log.error(`Something went wrong with collaboration discard: ${err}`);
          }
        }
        await this.editFlow.syncTask();
        this._findTables().forEach(table => {
          const creationRow = table.getCreationRow();
          const tableBinding = this._getTableBinding(table);
          const contextKeys = Object.keys(creationRow?.getBindingContext()?.getObject() || {});
          if (contextKeys.filter(key => !key.startsWith("@$ui5.")).length) {
            executeSideEffectsOnError = true;
            awaitCreateDocuments.push(this.editFlow.createDocument(tableBinding, {
              creationMode: table.data("creationMode"),
              creationRow: creationRow,
              createAtEnd: table.getParent().getAggregation("creationMode")?.getProperty("createAtEnd") === true,
              skipSideEffects: true // the skipSideEffects is a parameter created when we click the save key. If we press this key, we don't execute the handleSideEffects funciton to avoid batch redundancy
            }).then(() => tableBinding));
          }
        });
        let isStandardSave;
        if (skipBindingToView && typeof skipBindingToView === "object") {
          const command = skipBindingToView?.getSource?.()?.getCommand?.();
          isStandardSave = command === "Save";
        }
        const bindings = await Promise.all(awaitCreateDocuments);
        // We need to either reject or resolve a promise here and return it since this save
        // function is not only called when pressing the save button in the footer, but also
        // when the user selects create or save in a dataloss popup.
        // The logic of the dataloss popup needs to detect if the save had errors or not in order
        // to decide if the subsequent action - like a back navigation - has to be executed or not.
        try {
          await this.editFlow.saveDocument(context, {
            bExecuteSideEffectsOnError: executeSideEffectsOnError,
            bindings: bindings,
            mergePatchDraft: this.mergePatchDraft,
            skipBindingToView,
            isStandardSave,
            useSaveAndLeave
          });
        } catch (error) {
          // If the saveDocument in editFlow returns errors we need
          // to show the message popover here and ensure that the
          // dataloss logic does not perform the follow up function
          // like e.g. a back navigation hence we return a promise and reject it
          if (error !== RecommendationDialogDecision.Continue) {
            messagePopoverErr = error ?? "";
          }
          throw error;
        }
      } finally {
        if (BusyLocker.isLocked(model)) {
          BusyLocker.unlock(model);
        }
        if (messagePopoverErr !== undefined) {
          if (messagePopoverErr.length) {
            Log.error(messagePopoverErr);
          }
          this._showMessagePopover();
        }
      }
    };
    _proto._cancelDocument = async function _cancelDocument(mParameters) {
      const context = this.getView()?.getBindingContext();
      const cancelButton = this.getView().byId(mParameters.cancelButton); //to get the reference of the cancel button from command execution
      const lastFocusedControlId = UI5Element.getActiveElement()?.getId();
      let shouldSkipDiscardPopover = false;
      if (this.collaborativeDraft.isCollaborationEnabled()) {
        try {
          const dialogAction = await new CollaborationDiscard(this.getView(), false).getUserAction();
          // We cancel the action
          if (dialogAction === "cancel") {
            return;
          }
          // We keep the draft and leave for LR
          if (dialogAction === "keepDraft") {
            this.collaborativeDraft.disconnect();
            await this._routing.navigateBackFromContext(context);
            return;
          }
          // We have displayed the dialog and the user confirmed the discard -> We skip the discard confirmation
          if (dialogAction === "discardConfirmed") {
            shouldSkipDiscardPopover = true;
          }
        } catch (err) {
          Log.error("Cannot get collaborative users");
        }
      }
      const isDocumentModified = !!this.getView().getModel("ui").getProperty(UiModelConstants.DocumentModified) || !this.getStickyEditMode() && context.getProperty("HasActiveEntity") === false;
      const afterCancel = promiseResult => {
        // focus is retained on the last focused element
        if (lastFocusedControlId !== undefined) {
          UI5Element.getElementById(lastFocusedControlId)?.focus();
        }
        return promiseResult;
      };
      if (this.getAppComponent()?.getEnvironmentCapabilities()?.getCapabilities()?.HiddenDraft?.enabled && isDocumentModified) {
        return draft.processDataLossOrDraftDiscardConfirmation(afterCancel, Function.prototype, context, this, false, draft.NavigationType.BackNavigation, true);
      }
      return this.editFlow.cancelDocument(context, {
        control: cancelButton,
        skipDiscardPopover: shouldSkipDiscardPopover
      }).then(promiseResult => {
        return afterCancel(promiseResult);
      });
    };
    _proto._applyDocument = async function _applyDocument(oContext) {
      return this.editFlow.applyDocument(oContext).catch(() => {
        this._showMessagePopover();
        return;
      });
    };
    _proto._updateRelatedApps = function _updateRelatedApps() {
      const oObjectPage = this._getObjectPageLayoutControl();
      const showRelatedApps = oObjectPage.data("showRelatedApps");
      if (showRelatedApps === "true" || showRelatedApps === true) {
        const appComponent = CommonUtils.getAppComponent(this.getView());
        CommonUtils.updateRelatedAppsDetails(oObjectPage, appComponent);
      }
    };
    _proto._findControlInSubSection = function _findControlInSubSection(aParentElement, aSubsection, aControls, bIsChart) {
      for (const item1 of aParentElement) {
        let oElement = item1.getContent instanceof Function ? item1.getContent() : undefined;
        if (bIsChart) {
          if (oElement?.getAggregation("items")) {
            const items = oElement.getAggregation("items");
            items.forEach(function (item) {
              if (item.isA("sap.fe.macros.Chart")) {
                const chartControl = item.getChartControl();
                aControls.push(chartControl);
              }
            });
          }
        } else {
          if (oElement && oElement.isA && oElement.isA("sap.ui.layout.DynamicSideContent")) {
            const oSubElement = oElement.getMainContent instanceof Function ? oElement.getMainContent() : undefined;
            if (oSubElement && oSubElement.length > 0) {
              oElement = oSubElement[0];
            }
          }
          // The table may currently be shown in a full screen dialog, we can then get the reference to the TableAPI
          // control from the custom data of the place holder panel
          if (oElement && oElement.isA && oElement.isA("sap.m.Panel") && oElement.data("FullScreenTablePlaceHolder")) {
            oElement = oElement.data("tableAPIreference");
          }
          if (oElement && oElement.isA && oElement.isA("sap.fe.macros.Table")) {
            const oSubElement = oElement.getContent instanceof Function ? oElement.getContent() : undefined;
            if (oSubElement && oSubElement.isA && oSubElement.isA("sap.ui.mdc.Table")) {
              aControls.push(oSubElement);
            }
          }
        }
      }
    };
    _proto._getAllSubSections = function _getAllSubSections() {
      const oObjectPage = this._getObjectPageLayoutControl();
      let aSubSections = [];
      oObjectPage.getSections().forEach(function (oSection) {
        aSubSections = aSubSections.concat(oSection.getSubSections());
      });
      return aSubSections;
    };
    _proto._getAllBlocks = function _getAllBlocks() {
      let aBlocks = [];
      this._getAllSubSections().forEach(function (oSubSection) {
        aBlocks = aBlocks.concat(oSubSection.getBlocks());
      });
      return aBlocks;
    };
    _proto._findTables = function _findTables() {
      const aSubSections = this._getAllSubSections();
      const aTables = [];
      for (let subSection = 0; subSection < aSubSections.length; subSection++) {
        this._findControlInSubSection(aSubSections[subSection].getBlocks(), aSubSections[subSection], aTables);
        this._findControlInSubSection(aSubSections[subSection].getMoreBlocks(), aSubSections[subSection], aTables);
      }
      return aTables;
    };
    _proto._findCharts = function _findCharts() {
      const aSubSections = this._getAllSubSections();
      const aCharts = [];
      for (let subSection = 0; subSection < aSubSections.length; subSection++) {
        this._findControlInSubSection(aSubSections[subSection].getBlocks(), aSubSections[subSection], aCharts, true);
        this._findControlInSubSection(aSubSections[subSection].getMoreBlocks(), aSubSections[subSection], aCharts, true);
      }
      return aCharts;
    };
    _proto._closeSideContent = function _closeSideContent() {
      this._getAllBlocks().forEach(function (oBlock) {
        const oContent = oBlock.getContent instanceof Function && oBlock.getContent();
        if (oContent && oContent.isA && oContent.isA("sap.ui.layout.DynamicSideContent")) {
          if (oContent.setShowSideContent instanceof Function) {
            oContent.setShowSideContent(false, false);
          }
        }
      });
    }

    /**
     * Chart Context is resolved for 1:n microcharts.
     * @param oChartContext The Context of the MicroChart
     * @param sChartPath The collectionPath of the the chart
     * @returns Array of Attributes of the chart Context
     */;
    _proto._getChartContextData = function _getChartContextData(oChartContext, sChartPath) {
      const oContextData = oChartContext.getObject();
      let oChartContextData = [oContextData];
      if (oChartContext && sChartPath) {
        if (oContextData[sChartPath]) {
          oChartContextData = oContextData[sChartPath];
          delete oContextData[sChartPath];
          oChartContextData.push(oContextData);
        }
      }
      return oChartContextData;
    }

    /**
     * Scroll the tables to the row with the sPath
     * @param {string} sRowPath 'sPath of the table row'
     */;
    _proto._scrollTablesToRow = function _scrollTablesToRow(sRowPath) {
      if (this._findTables && this._findTables().length > 0) {
        const aTables = this._findTables();
        for (const item of aTables) {
          TableScroller.scrollTableToRow(item, sRowPath);
        }
      }
    }

    /**
     * Method to merge selected contexts and filters.
     * @param oPageContext Page context
     * @param aLineContext Selected Contexts
     * @param sChartPath Collection name of the chart
     * @returns Selection Variant Object
     */;
    _proto._mergeMultipleContexts = function _mergeMultipleContexts(oPageContext, aLineContext, sChartPath) {
      let aAttributes = [],
        aPageAttributes = [],
        oContext,
        sMetaPathLine,
        sPathLine;
      const sPagePath = oPageContext.getPath();
      const oMetaModel = oPageContext && oPageContext.getModel() && oPageContext.getModel().getMetaModel();
      const sMetaPathPage = oMetaModel && oMetaModel.getMetaPath(sPagePath).replace(/^\/*/, "");

      // Get single line context if necessary
      if (aLineContext && aLineContext.length) {
        oContext = aLineContext[0];
        sPathLine = oContext.getPath();
        sMetaPathLine = oMetaModel && oMetaModel.getMetaPath(sPathLine).replace(/^\/*/, "");
        aLineContext.forEach(oSingleContext => {
          if (sChartPath) {
            const oChartContextData = this._getChartContextData(oSingleContext, sChartPath);
            if (oChartContextData) {
              aAttributes = oChartContextData.map(function (oSubChartContextData) {
                return {
                  contextData: oSubChartContextData,
                  entitySet: `${sMetaPathPage}/${sChartPath}`
                };
              });
            }
          } else {
            aAttributes.push({
              contextData: oSingleContext.getObject(),
              entitySet: sMetaPathLine
            });
          }
        });
      }
      aPageAttributes.push({
        contextData: oPageContext.getObject(),
        entitySet: sMetaPathPage
      });
      // Adding Page Context to selection variant
      aPageAttributes = this._intentBasedNavigation.removeSensitiveData(aPageAttributes, sMetaPathPage);
      const oPageLevelSV = CommonUtils.addPageContextToSelectionVariant(new SelectionVariant(), aPageAttributes, this.getView());
      aAttributes = this._intentBasedNavigation.removeSensitiveData(aAttributes, sMetaPathPage);
      return {
        selectionVariant: oPageLevelSV,
        attributes: aAttributes
      };
    };
    _proto._getBatchGroupsForView = function _getBatchGroupsForView() {
      const oViewData = this.getView().getViewData(),
        oConfigurations = oViewData.controlConfiguration,
        aConfigurations = oConfigurations && Object.keys(oConfigurations),
        aBatchGroups = ["$auto.Heroes", "$auto.Decoration", "$auto.Workers"];
      if (aConfigurations && aConfigurations.length > 0) {
        aConfigurations.forEach(function (sKey) {
          const oConfiguration = oConfigurations[sKey];
          if (oConfiguration.requestGroupId === "LongRunners") {
            aBatchGroups.push("$auto.LongRunners");
          }
        });
      }
      return aBatchGroups;
    }

    /**
     * Method to initialize pagination.
     * @param context Context of object page
     * @param internalModel Internal model
     * @param listBinding Parent list binding to use
     */;
    _proto._initializePagination = function _initializePagination(context, internalModel, listBinding) {
      const viewLevel = this.getView().getViewData().viewLevel;
      if (viewLevel > 1) {
        const paginatorCurrentContext = internalModel.getProperty("/paginatorCurrentContext");
        if (paginatorCurrentContext) {
          const bindingToUse = paginatorCurrentContext.getBinding();
          this.paginator.initialize(bindingToUse, paginatorCurrentContext);
          internalModel.setProperty("/paginatorCurrentContext", null);
        } else if (listBinding) {
          this.paginator.initialize(listBinding, context);
        }
      }
    };
    _proto._checkDataPointTitleForExternalNavigation = function _checkDataPointTitleForExternalNavigation() {
      const oView = this.getView();
      const oInternalModelContext = oView.getBindingContext("internal");
      const oDataPoints = CommonUtils.getHeaderFacetItemConfigForExternalNavigation(oView.getViewData(), this.getAppComponent().getRoutingService().getOutbounds());
      const oShellServices = this.getAppComponent().getShellServices();
      const oPageContext = oView && oView.getBindingContext();
      oInternalModelContext.setProperty("isHeaderDPLinkVisible", {});
      if (oPageContext) {
        oPageContext.requestObject().then(function (oData) {
          return fnGetLinks(oDataPoints, oData);
        }).catch(function (oError) {
          Log.error("Cannot retrieve the links from the shell service", oError);
        });
      }

      /**
       * @param oError
       */
      function fnOnError(oError) {
        Log.error(oError);
      }
      function fnSetLinkEnablement(id, aSupportedLinks) {
        const sLinkId = id;
        // process viable links from getLinks for all datapoints having outbound
        if (aSupportedLinks && aSupportedLinks.length === 1 && aSupportedLinks[0].supported) {
          oInternalModelContext.setProperty(`isHeaderDPLinkVisible/${sLinkId}`, true);
        }
      }

      /**
       * @param oSubDataPoints
       * @param oPageData
       */
      function fnGetLinks(oSubDataPoints, oPageData) {
        for (const sId in oSubDataPoints) {
          const oDataPoint = oSubDataPoints[sId];
          const oParams = {};
          const oLink = oView.byId(sId);
          if (!oLink) {
            // for data points configured in app descriptor but not annotated in the header
            continue;
          }
          const oLinkContext = oLink.getBindingContext();
          const oLinkData = oLinkContext && oLinkContext.getObject();
          let oMixedContext = merge({}, oPageData, oLinkData);
          // process semantic object mappings
          if (oDataPoint.semanticObjectMapping) {
            const aSemanticObjectMapping = oDataPoint.semanticObjectMapping;
            for (const item in aSemanticObjectMapping) {
              const oMapping = aSemanticObjectMapping[item];
              const sMainProperty = oMapping["LocalProperty"]["$PropertyPath"];
              const sMappedProperty = oMapping["SemanticObjectProperty"];
              if (sMainProperty !== sMappedProperty) {
                if (oMixedContext.hasOwnProperty(sMainProperty)) {
                  const oNewMapping = {};
                  oNewMapping[sMappedProperty] = oMixedContext[sMainProperty];
                  oMixedContext = merge({}, oMixedContext, oNewMapping);
                  delete oMixedContext[sMainProperty];
                }
              }
            }
          }
          if (oMixedContext) {
            for (const sKey in oMixedContext) {
              if (!sKey.startsWith("_") && !sKey.includes("odata.context")) {
                oParams[sKey] = oMixedContext[sKey];
              }
            }
          }
          // validate if a link must be rendered
          oShellServices.isNavigationSupported([{
            target: {
              semanticObject: oDataPoint.semanticObject,
              action: oDataPoint.action
            },
            params: oParams
          }]).then(aLinks => {
            return fnSetLinkEnablement(sId, aLinks);
          }).catch(fnOnError);
        }
      }
    };
    _proto._findSummarizeButton = function _findSummarizeButton() {
      const objectPage = this._getObjectPageLayoutControl();
      const objectPageTitle = objectPage.getHeaderTitle();
      const actions = objectPageTitle?.getActions();
      let summarizeButton;
      for (const action of actions) {
        if (action.isA("sap.fe.macros.ai.SummarizationButton")) {
          const button = action.getContent();
          if (button && button.getId().endsWith("::Summarize::button")) {
            summarizeButton = button;
            break;
          }
        }
      }
      return summarizeButton;
    }

    /**
     * Evaluates startup parameters and triggers the smart summary action on the Object Page if required.
     *
     * This method checks whether the startup parameters indicate that a smart summary should be performed for the current Object Page level.
     * The level parameter determines which Object Page should be summarized, which is relevant in Flexible Column Layout (FCL) scenarios where
     * multiple Object Pages may be displayed simultaneously.
     * If no level is provided in the startup parameters, the method defaults the level to 1.
     * If the summary action is allowed and the SmartSummarize capability is available, it locates the summarize button and triggers its press event.
     * The method ensures the summary is only executed once per navigation and logs errors if prerequisites are not met or the button is unavailable.
     * All errors encountered during the process are caught and logged.
     * @private
     */;
    _proto._handleSmartSummaryStartupAction = function _handleSmartSummaryStartupAction() {
      const appComponent = this.getAppComponent();
      appComponent?.getStartupParameters()?.then(startupParams => {
        if (!startupParams.preferredAction || !startupParams.preferredAction[0].startsWith("summary")) {
          return;
        }

        // check if we are on the correct OP by checking the level provided in the startup parameters
        const viewLevel = this.getView().getViewData().viewLevel;
        const preferredActionLevel = startupParams.preferredAction[0] === "summary" ? 1 : parseInt(startupParams.preferredAction[0].split("-")[1], 10);
        if (isNaN(preferredActionLevel) || viewLevel !== preferredActionLevel) {
          return;
        }

        // Check if summary action shall be executed now (it might have already been executed by a higher level OP)
        if (appComponent.getPreferredActionStatus() === PreferredActionStatus.CanPerform) {
          appComponent.setPreferredActionStatus(PreferredActionStatus.AlreadyPerformed); // to prevent other OPs on higher levels to execute the summary again
        } else {
          return;
        }

        // Check if SmartSummarize capability is available
        const environmentService = appComponent.getEnvironmentCapabilities();
        if (!environmentService?.environmentCapabilities.SmartSummarize) {
          Log.error("Smart Summarization was not triggered because SmartSummarize capability is not available");
          return;
        }

        // Find the Summary button
        const summarizeButton = this._findSummarizeButton();
        if (summarizeButton && summarizeButton.getVisible() && summarizeButton.getEnabled()) {
          summarizeButton.firePress();
          return;
        } else {
          Log.error("Smart Summarization was not triggered because the Summarize button is either not visible or not enabled or not found.");
          return;
        }
      }).catch(error => {
        Log.error("Error while retrieving startup parameters or triggering smart summary:", error);
      });
    };
    return ObjectPageController;
  }(PageController), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "placeholder", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "share", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_routing", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "paginator", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "messageHandler", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "intentBasedNavigation", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "collaborationManager", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_intentBasedNavigation", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "viewState", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "pageReady", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _applyDecoratedDescriptor(_class2.prototype, "getExtensionAPI", [_dec12, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "getExtensionAPI"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onPageReady", [_dec14, _dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "onPageReady"), _class2.prototype), _class2)) || _class);
  return ObjectPageController;
}, false);
//# sourceMappingURL=ObjectPageController-dbg.controller.js.map
