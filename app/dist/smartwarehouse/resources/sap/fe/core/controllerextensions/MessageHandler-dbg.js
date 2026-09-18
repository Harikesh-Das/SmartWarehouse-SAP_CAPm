/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/deepEqual", "sap/base/util/uid", "sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/messageHandler/messageHandling", "sap/ui/core/Lib", "sap/ui/core/Messaging", "sap/ui/core/message/MessageType", "sap/ui/core/mvc/ControllerExtension", "sap/ui/core/mvc/OverrideExecution", "../helpers/ResourceModelHelper"], function (Log, deepEqual, uid, ClassSupport, CommonUtils, messageHandling, Library, Messaging, MessageType, ControllerExtension, OverrideExecution, ResourceModelHelper) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _class, _class2;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var publicExtension = ClassSupport.publicExtension;
  var privateExtension = ClassSupport.privateExtension;
  var methodOverride = ClassSupport.methodOverride;
  var finalExtension = ClassSupport.finalExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  /**
   * Defines the message details relevant for the MessageButton building block to display a popover.
   * @public
   */
  /**
   * A controller extension offering message handling.
   * @hideconstructor
   * @public
   * @since 1.90.0
   */
  let MessageHandler = (_dec = defineUI5Class("sap.fe.core.controllerextensions.MessageHandler"), _dec2 = methodOverride(), _dec3 = privateExtension(), _dec4 = extensible(OverrideExecution.Instead), _dec5 = privateExtension(), _dec6 = extensible(OverrideExecution.Instead), _dec7 = publicExtension(), _dec8 = extensible("AfterAsync"), _dec9 = publicExtension(), _dec10 = finalExtension(), _dec11 = publicExtension(), _dec12 = publicExtension(), _dec13 = finalExtension(), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    function MessageHandler() {
      var _this;
      _this = _ControllerExtension.call(this) || this;
      _this.strictWarningMessages = [];
      _this.holdKeys = [];
      _this.holdMsgsToShow = false;
      return _this;
    }
    _inheritsLoose(MessageHandler, _ControllerExtension);
    var _proto = MessageHandler.prototype;
    _proto.onInit = function onInit() {
      const internalModel = this.base.getAppComponent().getModel("internal");
      internalModel.setProperty("/messageUIDecision", undefined);
      internalModel.setProperty("/messageUIElementIsAvailable", Promise.resolve());
    }

    /**
     * Adds warning messages to the message handler.
     * @param aMessages The strict warning messages to be added
     */;
    _proto.addWarningMessagesToMessageHandler = function addWarningMessagesToMessageHandler(aMessages) {
      this.strictWarningMessages = this.strictWarningMessages.concat(aMessages);
    }

    /**
     * Determines whether or not a message is a strict warning message that was received previously.
     * @param oMessage The message to be checked
     * @returns Whether or not the message is a strict warning message
     */;
    _proto.isStrictWarningMessage = function isStrictWarningMessage(oMessage) {
      return this.strictWarningMessages.find(message => {
        return message.getCode() === oMessage.getCode() && message.getMessage() === oMessage.getMessage() && message.getType() === oMessage.getType() && message.getDescriptionUrl() === oMessage.getDescriptionUrl() && deepEqual(message.getTargets(), oMessage.getTargets()) && message.getPersistent() === oMessage.getPersistent();
      }) !== undefined;
    }

    /**
     * Clears all strict warning messages from the message handler.
     */;
    _proto.clearStrictWarningMessages = function clearStrictWarningMessages() {
      this.strictWarningMessages = [];
    };
    _proto.filterErrorMessages = function filterErrorMessages(messages) {
      return messages.filter(message => message.getType() === MessageType.Error);
    }

    /**
     * Determines whether or not bound messages are shown in the message dialog.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.Instead}.
     *
     * If the bound messages are shown to the user with a different control like the (TODO:Link) MessageButton
     * this method has to be overridden.
     * @returns Determines whether or not bound messages are shown in the message dialog.
     */;
    _proto.getShowBoundMessagesInMessageDialog = function getShowBoundMessagesInMessageDialog() {
      const internalContext = this.base.getView().getBindingContext("internal");
      const uiModel = this.base.getView().getModel("ui");
      return !uiModel?.getProperty("/isEditable") || internalContext?.getProperty("isOperationDialogOpen") || internalContext?.getProperty("getBoundMessagesForMassEdit") ||
      // In edit mode: only suppress the dialog when a MessageButton BB is present on this page
      this.base.getView().findAggregatedObjects(true, element => element.isA("sap.fe.macros.MessageButton")).length === 0;
    }

    /**
     * Determines whether or not bound messages should be removed from the dialog.
     *
     * For the object page if the bound messages are shown in the message strip, then remove that from the dialog to avoid duplicate messages.
     *
     * Only remove the messages if more than one message is present in the message model.
     * @param transitionMessages The messages that are shown in the message dialog.
     * @param context The context of the message dialog.
     * @returns Returns the bound messages which should be shown in the message dialog.
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    filterContextBoundMessages = function filterContextBoundMessages(transitionMessages, context) {
      return transitionMessages;
    }

    /**
     * Allows the consumer of the MessageButton building block to decide which bound messages are shown and how.
     *
     * This hook is called when the MessageButton building block detects a change in the message model.
     * The hooks allow you to define the behavior for messages in the MessageButton building block.
     *
     * Consumers are able to do the following with this hook:
     *
     * 1. Filter out messages so that they are not shown on the message button.
     * 2. Group messages based on their UI.
     * 3. Provide a presser handler if the message should display as a link.
     * @param _messageDetails Object containing the details related to the message.
     * @param _messageDetails.message The message from the message. It must not be modified directly.
     * @param _messageDetails.groupName The group name associated with the current message.
     * @param _messageDetails.activeTitleHandler Function to handle the click event on a message in the MessageButton building block.
     * @returns A promise that must be returned by the overridden method.
     * @public
     */;
    _proto.beforeShowMessageButton = async function beforeShowMessageButton(_messageDetails) {
      if (!this.base.isViewVisible()) {
        // do not show message if the view is not visible
        return Promise.reject();
      }
      return Promise.resolve();
    }

    /**
     * Register to hold messages unitl a process is complete.
     *
     * The caller can register to hold the message handler from showing messages until the caller's processes are completed.
     * On registering the caller is returned a unique key.
     * The messages will not be shown in the UI with subsequent 'showMessageDialog()' calls.
     * The caller needs to use 'showMessageDialog(<key>)' at the end of all his processes to show the messages in the UI.
     *
     * If multiple owners register simultaneously, then messages are shown in the UI only after 'showMessageDialog(<respective_key>)' is called by all the processes' owners.
     * @param key Unique identifier to use, If not provided, a UID would be created and used to register.
     * @returns Unique Key to be used by the caller to show messages at a later point of time.
     */;
    _proto.registerToHoldMessages = function registerToHoldMessages(key) {
      const uniqueKey = key ?? uid();
      if (!this.holdKeys.includes(uniqueKey)) {
        this.holdKeys.push(uniqueKey);
      }
      return uniqueKey;
    }

    /**
     * Clear all existing held keys.
     */;
    _proto.resetHoldKeys = function resetHoldKeys() {
      this.holdKeys = [];
    }

    /**
     * Shows a message dialog with transition messages if there are any.
     * The message dialog is shown as a modal dialog. Once the user confirms the dialog, all transition messages
     * are removed from the message model. If there is more than one message, a list of messages is shown. The user
     * can filter on message types and can display details as well as the long text. If there is one message,
     * the dialog immediately shows the details of the message. If there is just one success message, a message
     * toast is shown instead.
     * @param mParameters PRIVATE
     * @returns A promise that is resolved once the user closes the dialog. If there are no messages
     * to be shown, the promise is resolved immediately
     * @public
     * @since 1.90.0
     */;
    _proto.showMessageDialog = async function showMessageDialog(mParameters) {
      const internalModel = this.base.getAppComponent().getModel("internal");
      // remove strict warning messages from the message model before showing the message dialog
      await internalModel.getProperty("/messageUIElementIsAvailable");
      const messagesInModel = Messaging.getMessageModel().getData();
      const duplicateWarningMessage = messagesInModel.filter(message => {
        return this.isStrictWarningMessage(message);
      });
      Messaging.removeMessages(duplicateWarningMessage);
      const customMessages = mParameters && mParameters.customMessages ? mParameters.customMessages : undefined,
        oOPInternalBindingContext = this.base.getView().getBindingContext("internal");
      const viewType = this.base.getView().getViewData().converterType;
      // set isActionParameterDialog open so that it can be used in the controller extension to decide whether message dialog should open or not
      if (mParameters && mParameters.isOperationDialogOpen && oOPInternalBindingContext) {
        oOPInternalBindingContext.setProperty("isOperationDialogOpen", true);
      }
      const bShowBoundMessages = this.getShowBoundMessagesInMessageDialog();
      const oBindingContext = mParameters && mParameters.context ? mParameters.context : this.getView().getBindingContext();
      //const bEtagMessage = mParameters && mParameters.bHasEtagMessage;
      // reset  isOperationDialogOpen
      // cannot do this operations.js since it is not aware of the view
      if (oOPInternalBindingContext) {
        oOPInternalBindingContext.setProperty("isOperationDialogOpen", false);
      }
      return new Promise(function (resolve, reject) {
        // we have to set a timeout to be able to access the most recent messages
        setTimeout(function () {
          // TODO: great API - will be changed later
          this.processAndShowMessages(mParameters ?? {}, oBindingContext, bShowBoundMessages, customMessages ?? [], resolve, reject, viewType);
        }.bind(this), 0);
      }.bind(this));
    }

    /**
     * Process the messages and show them when expected.
     *
     * We filter the messages to show and hold them until all registered processes call showMessageDialog with their respective held keys.
     * @param parameters Parameters to show message dialog.
     * @param bindingContext Bind context of the page.
     * @param showBoundTransitionMessages Should bound messages be shown.
     * @param customMessages Custom messages to add.
     * @param success Success callback.
     * @param failure Failure callback.
     * @param viewType View type, list report or object page.
     */;
    _proto.processAndShowMessages = function processAndShowMessages(parameters, bindingContext, showBoundTransitionMessages, customMessages, success, failure, viewType) {
      const {
        concurrentEditFlag,
        control,
        sActionName,
        onBeforeShowMessage,
        unHoldKey,
        isOperationDialogOpen: forceShowUIElement = false,
        overrideUIDecision,
        showBoundStateMessages
      } = parameters;
      this.holdMsgsToShow = true;

      // Create a UI decision.
      const newUIDecisions = messageHandling.getUIDecisions(customMessages, bindingContext, showBoundTransitionMessages, concurrentEditFlag, control, sActionName, onBeforeShowMessage, viewType, showBoundStateMessages, parameters, getResourceModel(this.getView()), this);
      this.updateUIDecisions(newUIDecisions, overrideUIDecision);
      this.removeHoldKey(unHoldKey ?? control?.getId());
      const uiElementIsAvailable = this.base.getAppComponent().getModel("internal")?.getProperty("/messageUIElementIsAvailable");
      this.base.getAppComponent().getModel("internal")?.setProperty("/messageUIElementIsAvailable", uiElementIsAvailable.then(async function () {
        return this.showMessagesWithCondtions(forceShowUIElement, success, failure);
      }.bind(this)));
    }

    /**
     * Show Messages in the UI based on conditions.
     * @param forceShowUIElement
     * @param success
     * @param failure
     */;
    _proto.showMessagesWithCondtions = async function showMessagesWithCondtions() {
      let forceShowUIElement = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      let success = arguments.length > 1 ? arguments[1] : undefined;
      let failure = arguments.length > 2 ? arguments[2] : undefined;
      const showUIElement = forceShowUIElement || this.checkToShowUIElement();
      const internalModel = this.base.getAppComponent().getModel("internal");
      if (showUIElement && internalModel.getProperty("/messageUIDecision")) {
        // Show UI element for the present decision and clear the decision.
        try {
          const ret = await messageHandling.showMessagesInUI(internalModel.getProperty("/messageUIDecision"));
          success?.(ret);
        } catch (err) {
          Log.error(`FE : V4 : MessageHandler : Error on trying to show UI element: ${err}`);
          failure?.(err);
          internalModel.setProperty("/messageUIElementIsAvailable", Promise.resolve());
        }
        internalModel.setProperty("/messageUIDecision", undefined);
        this.clearStrictWarningMessages();
        this.holdMsgsToShow = false;
      } else {
        Log.info("FE : V4 : MessageHandler : Holding messages until a registered process ");
        success?.();
      }
    }

    /**
     * You can remove the existing transition message from the message model with this method.
     * With every user interaction that causes server communication (like clicking on an action, changing data),
     * this method removes the existing transition messages from the message model.
     * @param [keepBoundMessage] Checks if the bound transition messages are not to be removed
     * @param keepUnboundMessage
     * @param sPathToBeRemoved
     */;
    _proto.removeTransitionMessages = function removeTransitionMessages(keepBoundMessage, keepUnboundMessage, sPathToBeRemoved) {
      if (!keepBoundMessage) {
        messageHandling.removeBoundTransitionMessages(sPathToBeRemoved);
      }
      if (!keepUnboundMessage) {
        messageHandling.removeUnboundTransitionMessages();
      }
    }

    /**
     * Method that returns all the parameters needed to handle the navigation to the error page.
     * @param mParameters
     * @returns The parameters necessary for the navigation to the error page
     */;
    _proto._checkNavigationToErrorPage = function _checkNavigationToErrorPage(mParameters) {
      const aUnboundMessages = messageHandling.getMessages();
      const bShowBoundTransitionMessages = this.getShowBoundMessagesInMessageDialog();
      const aBoundTransitionMessages = bShowBoundTransitionMessages ? messageHandling.getMessages(true, true) : [];
      const aCustomMessages = mParameters && mParameters.customMessages ? mParameters.customMessages : [];
      const bIsStickyEditMode = CommonUtils.isStickyEditMode(this.base.getView());
      let mMessagePageParameters;

      // TODO: Stick mode check is okay as long as the controller extension is used with sap.fe.core and sap.fe.core.AppComponent.
      // It might be better to provide an extension to the consumer of the controller extension to provide this value.

      // The message page can only show 1 message today, so we navigate to it when :
      // 1. There are no bound transition messages to show,
      // 2. There are no custom messages to show, &
      // 3. There is exactly 1 unbound message in the message model with statusCode=503 and retry-After available
      // 4. retryAfter is greater than 120 seconds
      //
      // In Addition, navigating away from a sticky session will destroy the session so we do not navigate to message page for now.
      // TODO: check if navigation should be done in sticky edit mode.
      if (mParameters?.isDataReceivedError === true) {
        mMessagePageParameters = {
          title: mParameters.title,
          description: mParameters.description,
          navigateBackToOrigin: true,
          errorType: "PageNotFound"
        };
      } else if (!bIsStickyEditMode && !aBoundTransitionMessages.length && !aCustomMessages.length && (aUnboundMessages.length === 1 || mParameters?.isInitialLoad503Error === true)) {
        const oMessage = aUnboundMessages[0];
        const oTechnicalDetails = oMessage.getTechnicalDetails();
        if (oTechnicalDetails?.httpStatus === 503) {
          mMessagePageParameters = this._getHTTP503MessageParameters(oMessage, oTechnicalDetails);
        }
      }
      return mMessagePageParameters;
    };
    _proto._getHTTP503MessageParameters = function _getHTTP503MessageParameters(message, technicalDetails) {
      let messagePageParameters;
      const secondsBeforeRetry = technicalDetails.retryAfter !== undefined ? this._getSecondsBeforeRetryAfter(technicalDetails.retryAfter) : undefined;
      if (secondsBeforeRetry === undefined || secondsBeforeRetry > 120) {
        const retryAfterMessage = messageHandling.getRetryAfterMessage(message);
        messagePageParameters = {
          description: retryAfterMessage ? `${retryAfterMessage} ${message.getMessage()}` : message.getMessage(),
          navigateBackToOrigin: true,
          errorType: "UnableToLoad"
        };
      }
      return messagePageParameters;
    };
    _proto._getSecondsBeforeRetryAfter = function _getSecondsBeforeRetryAfter(dRetryAfter) {
      const dCurrentDateTime = new Date(),
        iCurrentDateTimeInMilliSeconds = dCurrentDateTime.getTime(),
        iRetryAfterDateTimeInMilliSeconds = dRetryAfter.getTime(),
        iSecondsBeforeRetry = (iRetryAfterDateTimeInMilliSeconds - iCurrentDateTimeInMilliSeconds) / 1000;
      return iSecondsBeforeRetry;
    }

    /**
     * Update the existing UI decisions with the new ones.
     * @param newUIDecisions In comming UI decisions.
     * @param overrideUIDecision Override the existing UI decision to show messages with the new one.
     *
     * 'overrideUIDecision', This would be needed when there is a change in page context and the paramters to create the new UI decision are different.
     */;
    _proto.updateUIDecisions = function updateUIDecisions(newUIDecisions) {
      let overrideUIDecision = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      const internalModel = this.base.getAppComponent().getModel("internal");
      const oldUIDecisions = internalModel.getProperty("/messageUIDecision");
      let allMessagesToShow = [];
      let mergedUIDecision;
      if (oldUIDecisions && overrideUIDecision === false) {
        if (oldUIDecisions.messagesToShow.length === 1 && newUIDecisions.messagesToShow.length === 1 && oldUIDecisions.messagesToShow[0].getCode() === "C_COMMON_SUCCESS_MESSAGE" && newUIDecisions.messagesToShow[0].getCode() === "C_COMMON_SUCCESS_MESSAGE") {
          // Check if both are generic success messages, then we show only one message.
          allMessagesToShow = oldUIDecisions.messagesToShow;
        } else {
          allMessagesToShow = Array.from(new Set([...oldUIDecisions.messagesToShow, ...newUIDecisions.messagesToShow]));
        }
        const elements = [oldUIDecisions.uiElementToUse, newUIDecisions.uiElementToUse];
        // Default we show dialog
        let uiElementToUse = allMessagesToShow.length > 0 ? "Dialog" : "None";
        if (allMessagesToShow.length === 1) {
          // Single message, we check for specific UI Element to use.
          if (elements.includes("Toast")) {
            uiElementToUse = "Toast";
          } else if (elements.includes("Box")) {
            uiElementToUse = "Box";
          }
        }
        mergedUIDecision = {
          messagesToShow: allMessagesToShow,
          uiElementToUse,
          contextNeedsEtagRefresh: oldUIDecisions.contextNeedsEtagRefresh || newUIDecisions.contextNeedsEtagRefresh,
          containsBoundTransition: oldUIDecisions.containsBoundTransition || newUIDecisions.containsBoundTransition
        };
      } else {
        mergedUIDecision = newUIDecisions;
      }
      internalModel.setProperty("/messageUIDecision", mergedUIDecision);
    }

    /**
     * Remove held key.
     * @param inKey Key to remove.
     */;
    _proto.removeHoldKey = function removeHoldKey(inKey) {
      if (inKey && this.holdKeys.includes(inKey)) {
        this.holdKeys.splice(this.holdKeys.indexOf(inKey), 1);
      }
    }

    /**
     * Check if UI Element with messages should be shown.
     * @returns Boolean
     */;
    _proto.checkToShowUIElement = function checkToShowUIElement() {
      return this.holdMsgsToShow && (this.holdKeys.length > 0 ? false : true);
    }

    /**
     * Hold messages for the control.
     * @param control
     */;
    _proto.holdMessagesForControl = function holdMessagesForControl(control) {
      const identifier = control.getId();
      this.registerToHoldMessages(identifier);
    }

    /**
     * Release message hold by a control.
     * @param control
     */;
    _proto.releaseHoldByControl = async function releaseHoldByControl(control) {
      const identifier = control?.getId();
      this.removeHoldKey(identifier);
      const uiElementIsAvailable = this.base.getAppComponent().getModel("internal")?.getProperty("/messageUIElementIsAvailable");
      this.base.getAppComponent().getModel("internal")?.setProperty("/messageUIElementIsAvailable", uiElementIsAvailable?.then(async function () {
        return this.showMessagesWithCondtions();
      }.bind(this)));
      await this.base.getAppComponent().getModel("internal")?.getProperty("/messageUIElementIsAvailable");
    }

    /**
     * Shows a message page or a message dialog based on the messages in the message dialog.
     * @param [parameters]
     * @returns A promise that is resolved once the user closes the message dialog or when navigation to the message page is complete. If there are no messages
     * to be shown, the promise is resolved immediately
     */;
    _proto.showMessages = async function showMessages(parameters) {
      const messagePageParameters = this._checkNavigationToErrorPage(parameters);
      if (messagePageParameters) {
        // navigate to message page.
        // handler before page navigation is triggered, for example to close the action parameter dialog
        if (parameters?.messagePageNavigationCallback) {
          parameters.messagePageNavigationCallback();
        }
        messagePageParameters.handleShellBack = !parameters?.shellBack;
        this.removeTransitionMessages();
        const oResourceBundle = Library.getResourceBundleFor("sap.fe.core");
        return new Promise((resolve, reject) => {
          // we have to set a timeout to be able to access the most recent messages
          setTimeout(() => {
            // clear all hold keys as we navigate to message page.
            this.resetHoldKeys();

            // TODO: great API - will be changed later
            this.base._routing.navigateToMessagePage(parameters?.isDataReceivedError === true ? oResourceBundle.getText("C_COMMON_SAPFE_DATA_RECEIVED_ERROR") : oResourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_503_TITLE"), messagePageParameters).then(resolve).catch(reject);
          }, 0);
        });
      } else {
        // navigate to message dialog
        return this.showMessageDialog(parameters);
      }
    };
    return MessageHandler;
  }(ControllerExtension), _applyDecoratedDescriptor(_class2.prototype, "onInit", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "onInit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getShowBoundMessagesInMessageDialog", [_dec3, _dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "getShowBoundMessagesInMessageDialog"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "filterContextBoundMessages", [_dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "filterContextBoundMessages"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "beforeShowMessageButton", [_dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "beforeShowMessageButton"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "showMessageDialog", [_dec9, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "showMessageDialog"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "removeTransitionMessages", [_dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "removeTransitionMessages"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "showMessages", [_dec12, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "showMessages"), _class2.prototype), _class2)) || _class);
  return MessageHandler;
}, false);
//# sourceMappingURL=MessageHandler-dbg.js.map
