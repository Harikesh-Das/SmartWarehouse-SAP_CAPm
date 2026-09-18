/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/uid", "sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/fe/core/converters/helpers/ID", "sap/fe/core/ExtensionAPI", "sap/fe/core/helpers/RecommendationHelper", "sap/fe/core/helpers/ResourceModelHelper", "sap/m/Link", "sap/m/MessageBox", "sap/m/MessageItem", "sap/m/MessagePopover", "sap/m/MessageStrip", "sap/ui/core/InvisibleMessage", "sap/ui/core/library", "sap/ui/core/message/Message", "sap/ui/core/message/MessageType"], function (Log, uid, ClassSupport, CommonUtils, ID, ExtensionAPI, RecommendationHelper, ResourceModelHelper, Link, MessageBox, MessageItem, MessagePopover, MessageStrip, InvisibleMessage, library, Message, MessageType) {
  "use strict";

  var _dec, _class;
  var InvisibleMessageMode = library.InvisibleMessageMode;
  var recommendationHelper = RecommendationHelper.recommendationHelper;
  var getSideContentLayoutID = ID.getSideContentLayoutID;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * Extension API for object pages on SAP Fiori elements for OData V4.
   *
   * To correctly integrate your app extension coding with SAP Fiori elements, use only the extensionAPI of SAP Fiori elements. Don't access or manipulate controls, properties, models, or other internal objects created by the SAP Fiori elements framework.
   * @public
   * @hideconstructor
   * @final
   * @since 1.79.0
   */
  let ObjectPageExtensionAPI = (_dec = defineUI5Class("sap.fe.templates.ObjectPage.ExtensionAPI"), _dec(_class = /*#__PURE__*/function (_ExtensionAPI) {
    function ObjectPageExtensionAPI() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _ExtensionAPI.call(this, ...args) || this;
      /**
       * ID of the active custom MessageStrip for programmatic removal.
       */
      /**
       * Flag to prevent concurrent navigateToSubSection calls.
       * Set to true when navigation starts, reset after navigation completes (including polling).
       */
      _this.isNavigatingToSubSection = false;
      return _this;
    }
    _inheritsLoose(ObjectPageExtensionAPI, _ExtensionAPI);
    var _proto = ObjectPageExtensionAPI.prototype;
    /**
     * Refreshes either the whole object page or only parts of it.
     * @param [vPath] Path or array of paths referring to entities or properties to be refreshed.
     * If omitted, the whole object page is refreshed. The path "" refreshes the entity assigned to the object page
     * without navigation.
     * @returns Resolved once the data is refreshed or rejected if the request failed
     * @public
     */
    _proto.refresh = async function refresh(vPath) {
      const oBindingContext = this._view.getBindingContext();
      if (!oBindingContext) {
        // nothing to be refreshed - do not block the app!
        return Promise.resolve();
      }
      const oAppComponent = CommonUtils.getAppComponent(this._view),
        oSideEffectsService = oAppComponent.getSideEffectsService(),
        oMetaModel = oBindingContext.getModel().getMetaModel(),
        oSideEffects = {
          targetProperties: [],
          targetEntities: []
        };
      if (vPath === undefined || vPath === null) {
        // we just add an empty path which should refresh the page with all dependent bindings
        oSideEffects.targetEntities.push({
          $NavigationPropertyPath: ""
        });
      } else {
        const allPaths = Array.isArray(vPath) ? vPath : [vPath];
        const ownerComponent = this._controller.getOwnerComponent();
        const contextPath = ownerComponent.getContextPath() || `/${ownerComponent.getEntitySet()}`;
        for (const path of allPaths) {
          if (path === "") {
            // an empty path shall refresh the entity without dependencies which means * for the model
            oSideEffects.targetProperties.push("*");
          } else {
            const kind = oMetaModel.getObject(`${contextPath}/${path}/$kind`);
            if (kind === "NavigationProperty") {
              oSideEffects.targetEntities.push({
                $NavigationPropertyPath: path
              });
            } else if (kind) {
              oSideEffects.targetProperties.push(path);
            } else {
              return Promise.reject(`${path} is not a valid path to be refreshed`);
            }
          }
        }
      }
      return oSideEffectsService.requestSideEffects([...oSideEffects.targetEntities, ...oSideEffects.targetProperties], oBindingContext);
    }

    /**
     * Gets the list entries currently selected for the table.
     * @param sTableId The ID identifying the table the selected context is requested for
     * @returns Array containing the selected contexts
     * @public
     */;
    _proto.getSelectedContexts = function getSelectedContexts(sTableId) {
      let table = this._view.byId(sTableId);
      if (table?.isA("sap.ui.mdc.Table")) {
        table = table.getParent();
      }
      if (table?.isA("sap.fe.macros.Table")) {
        return table.getSelectedContexts();
      }
      return [];
    }

    /**
     * Displays or hides the side content of an object page.
     * @param sSubSectionKey Key of the side content fragment as defined in the manifest.json
     * @param [bShow] Optional Boolean flag to show or hide the side content
     * @public
     */;
    _proto.showSideContent = function showSideContent(sSubSectionKey, bShow) {
      const sBlockID = getSideContentLayoutID(sSubSectionKey),
        oBlock = this._view.byId(sBlockID);
      if (!oBlock) {
        return;
      }
      const sCurrentBreakpoint = oBlock.getCurrentBreakpoint();
      const bBlockState = bShow === undefined ? !oBlock.getShowSideContent() : bShow;

      // On small screens (S breakpoint), side content should replace main content
      if (sCurrentBreakpoint === "S") {
        if (bBlockState) {
          // Show side content, hide main content
          oBlock.setShowSideContent(true, false);
          oBlock.setShowMainContent(false, false);
        } else {
          // Hide side content, show main content
          oBlock.setShowSideContent(false, false);
          oBlock.setShowMainContent(true, false);
        }
      } else {
        // On larger screens, show side content alongside main content
        // Always keep main content visible on large screens
        oBlock.setShowMainContent(true, false);
        oBlock.setShowSideContent(bBlockState, false);
      }
    }

    /**
     * Gets the bound context of the current object page.
     * @returns Context bound to the object page
     * @public
     */;
    _proto.getBindingContext = function getBindingContext() {
      return this._view.getBindingContext();
    }

    /**
     * Build the internal context path of the MessageStrip control.
     * @returns The internal binding context path for the messageStrip
     */;
    _proto._getMessageStripBindingContextPath = function _getMessageStripBindingContextPath() {
      const internalModelContextPath = this._view.getBindingContext("internal")?.getPath();
      const viewContextPath = this._view.getBindingContext()?.getPath();
      return internalModelContextPath && viewContextPath ? `${internalModelContextPath}/MessageStrip/${viewContextPath.replace(/\//g, "-")}` : "";
    }

    /**
     * Displays the message strip between the title and the header of the ObjectPage. If only one message is provided, it is displayed directly in the message strip. If multiple messages are provided, they are prioritized by the order: Error, Warning, and Information and a corresponding generic text is displayed:
     * - Error: "The object contains errors."
     * - Warning: "The object contains warnings."
     * - Information: "The object contains messages."
     * If a back-end message is received with a target pointing to the Object Page, it is displayed in the message strip, overriding any existing message or message strip. If multiple back-end messages are received, the message with the highest priority is displayed with a generic text as described above.
     * @param  messagesOrStrip The message to be displayed or a MessageStrip control
     * @public
     */;
    _proto.showMessages = function showMessages(messagesOrStrip) {
      if (Array.isArray(messagesOrStrip)) {
        this._showMessages(messagesOrStrip);
      } else if (messagesOrStrip.isA("sap.m.MessageStrip")) {
        this.showCustomMessageStrip(messagesOrStrip);
      }
    }

    /**
     * Shows a custom MessageStrip control provided by the application.
     * Ensures mutual exclusivity with the MessageStrip rendered by the object page view.
     * @param messageStrip MessageStrip control
     * @private
     */;
    _proto.showCustomMessageStrip = function showCustomMessageStrip(messageStrip) {
      const messageStripInternalModelContext = this._view.getModel("internal").bindContext(this._getMessageStripBindingContextPath()).getBoundContext();
      if (!messageStripInternalModelContext) {
        return;
      }
      this.removeCustomMessageStrip(); // Remove any existing custom message strip before adding new one

      // Hide framework generated message strip to ensure mutual exclusivity
      messageStripInternalModelContext.setProperty("OPBackendMessageVisible", false);
      messageStripInternalModelContext.setProperty("OPCustomMessageVisible", false);
      this.customMessageStripId = messageStrip.getId() || uid(); // Store reference for programmatic removal

      messageStrip.addStyleClass("sapUiSmallMarginTop");
      this.addCustomMessageStripToPage(messageStrip, messageStripInternalModelContext);
    }

    /**
     * Adds a custom MessageStrip to the page layout in the header container such as in expanded and snapped content.
     * @param messageStrip The MessageStrip control to add
     * @param messagestripInternalModelContext
     */;
    _proto.addCustomMessageStripToPage = function addCustomMessageStripToPage(messageStrip, messagestripInternalModelContext) {
      const headerContainer = this._view.byId("fe::ObjectPageDynamicHeaderTitle");
      if (headerContainer) {
        const insertIntoAggregation = (aggregationName, controlToInsert) => {
          const aggregationContent = headerContainer.getAggregation(aggregationName);
          if (aggregationContent) {
            const contentArray = Array.isArray(aggregationContent) ? aggregationContent : [aggregationContent];
            headerContainer.insertAggregation(aggregationName, controlToInsert, contentArray.length);
          }
        };
        insertIntoAggregation("expandedContent", messageStrip);
        insertIntoAggregation("snappedContent", messageStrip.clone());
        messagestripInternalModelContext.setProperty("OPCustomMessageStripVisible", true);
      }
    }

    /**
     * Removes the active custom MessageStrip programmatically.
     */;
    _proto.removeCustomMessageStrip = function removeCustomMessageStrip() {
      if (!this.customMessageStripId) {
        return;
      }

      // Find and remove the custom message strip from header container
      const headerContainer = this._view.byId("fe::ObjectPageDynamicHeaderTitle");
      if (headerContainer) {
        const removeFromAggregation = (aggregationName, idMatcher) => {
          const aggregationContent = headerContainer.getAggregation(aggregationName);
          if (aggregationContent) {
            const controlToRemove = aggregationContent.find(control => idMatcher(control.getId()));
            if (controlToRemove) {
              headerContainer.removeAggregation(aggregationName, controlToRemove);
              controlToRemove.destroy();
            }
          }
        };
        removeFromAggregation("expandedContent", controlId => controlId === this.customMessageStripId);
        removeFromAggregation("snappedContent", controlId => controlId.includes(this.customMessageStripId + "-__clone"));
      }
      this.customMessageStripId = undefined;
      const messagestripInternalModelContext = this._view.getModel("internal").bindContext(this._getMessageStripBindingContextPath()).getBoundContext();
      if (messagestripInternalModelContext) {
        messagestripInternalModelContext.setProperty("OPCustomMessageStripVisible", false);
      }
    }

    /**
     * Creates a MessageItem from a Message instance.
     * @param message The message object containing text, type, description, etc.
     * @returns The created MessageItem instance for the MessagePopover.
     */;
    _proto.createMessageItem = function createMessageItem(message) {
      const sDescriptionUrl = message.getDescriptionUrl?.();
      return new MessageItem({
        title: message.getMessage(),
        description: message.getDescription(),
        type: message.getType(),
        longtextUrl: sDescriptionUrl,
        subtitle: message.getAdditionalText?.(),
        groupName: "T_MESSAGE_BUTTON_SAPFE_MESSAGE_GROUP_GENERAL",
        activeTitle: !!message.getControlIds?.().length
      });
    }

    /**
     * Creates a MessagePopover for a set of MessageItems and attaches
     * an async description handler to load long text when needed.
     * @param messageItems Array of MessageItems to be displayed in the popover.
     * @returns The created MessagePopover instance.
     */;
    _proto.createMessagePopover = function createMessagePopover(messageItems) {
      const popover = new MessagePopover({
        items: messageItems
      });
      return popover;
    }

    /**
     * Opens a MessagePopover for the provided messages, anchored to the
     * source control of the UI5 event.
     * @param event The UI5 event from the control that triggers the popover.
     * @param message Array of Message objects to be shown in the popover.
     * @returns The MessagePopover that was opened.
     */;
    _proto.showMessagePopover = function showMessagePopover(event, message) {
      const messageItem = this.createMessageItem(message[0]);
      const popover = this.createMessagePopover(messageItem);
      const sourceControl = event.getSource?.();
      sourceControl?.addDependent(popover);
      popover.openBy(sourceControl);
      return popover;
    }

    /**
     * Displays the message strip between the title and the header of the ObjectPage.
     * @param messages The message to be displayed
     * @param origin The origin of the message. It may come from a back-end message or a custom message
     */;
    _proto._showMessages = function _showMessages(messages) {
      let origin = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "Custom";
      try {
        if (messages.length > 0) {
          // Only if there are messages to show, we remove custom message strip.
          // This way we ensure that we don't interfere with custom message strip's lifecyle until there are new messages to show in the standard message strip.
          this.removeCustomMessageStrip();
        }
        const view = this._view;
        const internalModel = view.getModel("internal");
        const messagestripInternalModelContext = internalModel.bindContext(this._getMessageStripBindingContextPath()).getBoundContext();
        if (!messagestripInternalModelContext) {
          return;
        }
        const resourceModel = ResourceModelHelper.getResourceModel(view);
        let message = messages[0] || null;
        messagestripInternalModelContext.setProperty(`OP${origin}MessageVisible`, !!message);
        switch (messages.length) {
          case 0:
            break;
          case 1:
            message = messages[0];
            const hasDescriptionUrl = !!message?.getDescriptionUrl();
            const isEditMode = CommonUtils.getIsEditable(view);
            try {
              const objectPage = view.getContent()?.[0];
              const headerTitle = objectPage.getHeaderTitle();

              // Collect all MessageStrips (excluding Collaboration Strips)
              const allStrips = [...(headerTitle.getSnappedContent?.() || []), ...(headerTitle.getExpandedContent?.() || [])].filter(item => item instanceof MessageStrip && !item.getId()?.includes("CollaborationStrip"));

              // Only add links when message is from Backend, in Display mode, and has a description URL
              if (origin === "Backend" && !isEditMode && hasDescriptionUrl) {
                allStrips.forEach(strip => {
                  // Always destroy the existing link before creating a new one
                  if (strip.getLink()) {
                    strip.destroyLink();
                  }
                  const link = new Link({
                    text: resourceModel.getText("C_MESSAGE_HANDLING_SAPFE_ERROR_MESSAGE_STRIP_LINK_TEXT"),
                    press: event => {
                      this.showMessagePopover(event, [message]);
                    }
                  });
                  strip.setLink(link);
                });
              } else {
                // Remove links when not applicable
                allStrips.forEach(strip => {
                  if (strip.getLink()) {
                    strip.destroyLink();
                  }
                });
              }
            } catch (err) {
              Log.warning("Unable to attach link to ObjectPage MessageStrip", err);
            }
            break;
          default:
            const messageStats = {
              Error: {
                id: 2,
                count: 0
              },
              Warning: {
                id: 1,
                count: 0
              },
              Information: {
                id: 0,
                count: 0
              },
              Success: {
                id: 0,
                count: 0
              },
              None: {
                id: 0,
                count: 0
              }
            };
            message = messages.reduce((acc, currentValue) => {
              const currentType = currentValue.getType();
              const currentStats = messageStats[currentType] ?? messageStats.Information;
              const accStats = messageStats[acc.getType()] ?? messageStats.Information;
              acc.setType(currentStats.id > accStats.id ? currentType : acc.getType());
              currentStats.count++;
              return acc;
            }, new Message({
              type: MessageType.Information
            }));
            if (origin === "Backend" && !CommonUtils.getIsEditable(view)) {
              messagestripInternalModelContext.setProperty(`OP${origin}MessageVisible`, false);
            } else {
              messagestripInternalModelContext.setProperty(`OP${origin}MessageVisible`, !!message);
            }
            if (messageStats.Error.count > 0) {
              message.setMessage(resourceModel.getText("OBJECTPAGESTATE_ERROR"));
            } else if (messageStats.Warning.count > 0) {
              message.setMessage(resourceModel.getText("OBJECTPAGESTATE_WARNING"));
            } else {
              message.setMessage(resourceModel.getText("OBJECTPAGESTATE_INFORMATION"));
            }
        }
        messagestripInternalModelContext.setProperty(`OP${origin}MessageText`, message ? message.getMessage() : null);
        messagestripInternalModelContext.setProperty(`OP${origin}MessageType`, message ? message.getType() : null);
        if (message) {
          InvisibleMessage.getInstance().announce(message.getMessage(), InvisibleMessageMode.Assertive);
        }
      } catch (err) {
        Log.error("Cannot display ObjectPage message");
      }
    }

    /**
     * Hides the message strip below the anchor bar.
     * @public
     */;
    _proto.hideMessage = function hideMessage() {
      const messagestripInternalModelContext = this._view.getModel("internal").bindContext(this._getMessageStripBindingContextPath()).getBoundContext();
      messagestripInternalModelContext.setProperty(`OPCustomMessageVisible`, false);
      this.removeCustomMessageStrip();
    }

    /**
     * This function will take the recommendation data details, transform it, and update the internal model.
     * @param data Recommendation data for the app
     */;
    _proto.setRecommendations = function setRecommendations(data) {
      recommendationHelper.transformRecommendationsForInternalStorage(data);
      this._view.getModel("internal").setProperty("/recommendationsData", data);
    }

    /**
     * Defines a control to be the title owner of its section/subsection. As the title owners of standard subsections are determined automatically, it is recommended to use this function for custom section/subsection.
     * The title owner can be either one of the standard building blocks (Form, Chart, Table), or reuse components, or sap.m.Title.
     * The framework adapts the value of these properties to be aligned with the title that is shown in the anchor bar (or icon tab bar) for the section. Moreover, the title of the subsection (and if applicable also of the section) is hidden in order to prevent redundant titles, if the subsection possesses a title owner.
     * Hint: If you choose to set sap.m.Title as the title owner, styling adjustments may be required in the custom view. For example, if sap.m.Title is set as title owner which belongs to sap.m.OverflowToolbar or to sap.m.Toolbar, then the ‘design’ property of the toolbar control is to be set to ‘Transparent’.
     * @param control The single content control can be either one of the standard building blocks (Form, Chart, Table), or reuse components, or sap.m.Title.
     * @public
     */;
    _proto.setAsSectionTitleOwner = function setAsSectionTitleOwner(control) {
      let section;
      const originalControl = control;
      let reuseComponent;
      while (control) {
        if (control.isA("sap.fe.macros.controls.Section")) {
          section = control;
          break;
        }
        if (control.isA("sap.fe.core.ReuseComponent")) {
          control = control.container.getParent();
          reuseComponent = true;
        }
        const controlParent = control.getParent();
        if (controlParent) {
          control = controlParent;
        } else {
          break;
        }
      }
      if (section) {
        if (reuseComponent && section.getVisibleSubSections().length > 1) {
          section.adjustForSingleContent(originalControl, {
            multipleSubSectionsWithReuseComponent: true
          });
        } else {
          section.adjustForSingleContent(originalControl);
        }
      }
    }

    /**
     * Displays an error message when navigation to a section fails.
     */;
    _proto.showNavigationError = function showNavigationError() {
      const resourceModel = ResourceModelHelper.getResourceModel(this._view);
      const sTitle = resourceModel.getText("C_ROUTING_NAVIGATION_DISABLED_TITLE");
      Log.error(sTitle);
      MessageBox.error(sTitle);
    }

    /**
     * Navigate to the first section of the object page.
     * Used as a fallback when the target section is not found or invalid.
     * @param objectPageLayout The ObjectPageLayout control to navigate within
     */;
    _proto.navigateToFirstSection = function navigateToFirstSection(objectPageLayout) {
      const sections = objectPageLayout.getSections();
      if (!sections || sections.length === 0) {
        return;
      }
      const firstSection = sections[0];
      const subSections = firstSection.getSubSections();
      if (!subSections || subSections.length === 0) {
        return;
      }
      const firstSubSection = subSections[0];
      const subSectionFullId = firstSubSection.getId();
      if (!subSectionFullId) {
        return;
      }
      objectPageLayout.setSelectedSection(subSectionFullId);
      objectPageLayout.fireNavigate({
        section: firstSection,
        subSection: firstSubSection
      });
    }

    /**
     * Navigate to a specific section or subsection within the current page.
     * Works with Object Page layouts and other section-based layouts.
     * If the target section is not found or invalid, the app automatically falls back to the first available section.
     * @param sectionOrSubSectionId The ID of the target section or subsection (without a view prefix, for example, "fe::FacetSection::TravelData" or "fe::SubSection::Details")
     * @public
     */;
    _proto.navigateToSubSection = function navigateToSubSection(sectionOrSubSectionId) {
      // Guard against concurrent navigation calls to prevent infinite loops
      // from multiple polling mechanisms (ViewState.apply and ObjectPageController._navigateToTargetSection)
      if (this.isNavigatingToSubSection) {
        return;
      }
      this.isNavigatingToSubSection = true;

      // Helper to reset navigation flag after a delay
      const resetNavigationFlag = delayMs => {
        setTimeout(() => {
          this.isNavigatingToSubSection = false;
        }, delayMs);
      };
      try {
        // Find the Object Page Layout control
        const objectPageLayout = this._view.getContent()[0];
        if (!objectPageLayout || !objectPageLayout.getDomRef()) {
          // ObjectPageLayout not available or destroyed - silently return during navigation transitions
          // This is expected when ViewState.apply runs on a view being navigated away from
          this.isNavigatingToSubSection = false;
          return;
        }
        if (!sectionOrSubSectionId) {
          this.navigateToFirstSection(objectPageLayout);
          resetNavigationFlag(100);
          return;
        }
        const control = this._view.byId(sectionOrSubSectionId);
        if (!control || !control.getVisible()) {
          this.navigateToFirstSection(objectPageLayout);
          this.showNavigationError();
          resetNavigationFlag(100);
          return;
        }
        let targetSubSection;
        let targetSection;
        let isNavigatingToSection = false; // Track if original target was a Section (not SubSection)

        // Check if control is a SubSection or Section
        if (control.isA("sap.uxap.ObjectPageSubSection")) {
          targetSubSection = control;
        } else if (control.isA("sap.uxap.ObjectPageSection")) {
          targetSection = control;
          isNavigatingToSection = true;
          // If it's a section, get the first subsection (if available)
          const subSections = control.getSubSections();
          targetSubSection = subSections.length > 0 ? subSections[0] : undefined;
        }

        // Validate we have either a section or subsection
        const hasValidTarget = targetSubSection || targetSection;
        if (!hasValidTarget || targetSubSection && !targetSubSection.getVisible()) {
          this.navigateToFirstSection(objectPageLayout);
          this.showNavigationError();
          resetNavigationFlag(100);
          return;
        }

        // If we have a section but no subsection (lazy loading scenario), scroll directly to the section
        if (targetSection && !targetSubSection) {
          const sectionFullId = targetSection.getId();
          objectPageLayout.scrollToSection(sectionFullId, 0);
          resetNavigationFlag(100);
          return;
        }

        // At this point, targetSubSection is guaranteed to be defined
        // (we've already returned if it was undefined with a valid targetSection)
        if (!targetSubSection) {
          // This should never happen, but satisfies TypeScript
          this.isNavigatingToSubSection = false;
          return;
        }

        // Note: we intentionally do not check getVisible() here.
        // When navigating to a subsection in an inactive IconTabBar tab, the subsection is not yet visible.
        // setSelectedSection will activate the parent section and make the subsection visible.

        // Get the full subsection ID (including view prefix)
        const subSectionFullId = targetSubSection.getId();
        if (!subSectionFullId) {
          this.isNavigatingToSubSection = false;
          return;
        }
        const parentSection = targetSubSection.getParent();
        const parentSectionFullId = parentSection.getId();
        const isParentSectionSelected = objectPageLayout.getSelectedSection() === parentSectionFullId;
        if (!isParentSectionSelected && !isNavigatingToSection) {
          // When navigating to a subsection in an inactive section, we must first activate
          // the parent section, then wait for subsection to be ready before scrolling to it
          objectPageLayout.scrollToSection(parentSectionFullId, 0);

          // Poll for subsection DOM to be ready after parent section activation
          // Related: helpers/SectionNavigationHelper.ts (used by ViewState.apply and ObjectPageController.navigateToTargetSection)
          // This polling differs: checks DOM readiness (binary), not section ID stability
          let attempts = 0;
          const maxAttempts = 10;
          const checkSubsectionReady = () => {
            attempts++;
            const subSectionDom = targetSubSection.getDomRef();
            if (subSectionDom) {
              // Subsection is ready, scroll to it
              objectPageLayout.scrollToSection(subSectionFullId, 0);
              resetNavigationFlag(100);
            } else if (attempts < maxAttempts) {
              // Not ready yet, check again
              setTimeout(checkSubsectionReady, 50);
            } else {
              // Timeout - try scrolling anyway
              objectPageLayout.scrollToSection(subSectionFullId, 0);
              resetNavigationFlag(100);
            }
          };
          // Start checking after 100ms initial delay
          setTimeout(checkSubsectionReady, 100);
        } else {
          // Parent section already selected or navigating to section - scroll directly
          const scrollTarget = isNavigatingToSection ? parentSectionFullId : subSectionFullId;
          objectPageLayout.scrollToSection(scrollTarget, 0);
          resetNavigationFlag(100);
        }
      } catch (error) {
        this.isNavigatingToSubSection = false;
      }
    };
    return ObjectPageExtensionAPI;
  }(ExtensionAPI)) || _class);
  return ObjectPageExtensionAPI;
}, false);
//# sourceMappingURL=ExtensionAPI-dbg.js.map
