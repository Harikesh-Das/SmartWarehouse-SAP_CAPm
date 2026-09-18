/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/BaseControllerExtension", "sap/fe/core/controllerextensions/BusyLocker", "sap/fe/core/controllerextensions/Feedback", "sap/fe/core/controllerextensions/collaboration/CollaborationCommon", "sap/fe/core/controllerextensions/editFlow/TransactionHelper", "sap/fe/core/controllerextensions/editFlow/draft", "sap/fe/core/controllerextensions/editFlow/editFlowConstants", "sap/fe/core/controllerextensions/editFlow/sticky", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/EditState", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/PromiseKeeper", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/core/helpers/SemanticKeyHelper", "sap/fe/core/library", "sap/m/Button", "sap/m/Dialog", "sap/m/InstanceManager", "sap/m/MessageToast", "sap/m/Text", "sap/ui/core/Element", "sap/ui/core/Lib", "sap/ui/core/Messaging", "sap/ui/core/message/Message", "sap/ui/core/message/MessageType", "sap/ui/core/mvc/OverrideExecution", "sap/ui/model/Filter", "sap/ui/model/Sorter", "../ActionRuntime", "../controls/Recommendations/ConfirmRecommendationDialog", "../converters/ManifestSettings", "../helpers/TypeGuards", "./editFlow/draftDataLossPopup", "./routing/NavigationReason"], function (Log, ClassSupport, CommonUtils, BaseControllerExtension, BusyLocker, Feedback, CollaborationCommon, TransactionHelper, draft, UiModelConstants, sticky, MetaModelConverter, EditState, ModelHelper, PromiseKeeper, ResourceModelHelper, SemanticKeyHelper, FELibrary, Button, Dialog, InstanceManager, MessageToast, Text, Element, Library, Messaging, Message, MessageType, OverrideExecution, Filter, Sorter, ActionRuntime, $ConfirmRecommendationDialog, ManifestSettings, TypeGuards, draftDataLossPopup, NavigationReason) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _dec36, _dec37, _dec38, _dec39, _dec40, _dec41, _dec42, _dec43, _dec44, _dec45, _dec46, _class, _class2;
  var isRejected = TypeGuards.isRejected;
  var isFulfilled = TypeGuards.isFulfilled;
  var CreationMode = ManifestSettings.CreationMode;
  var RecommendationDialogDecision = $ConfirmRecommendationDialog.RecommendationDialogDecision;
  var ConfirmRecommendationDialog = $ConfirmRecommendationDialog.ConfirmRecommendationDialog;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var convertTypes = MetaModelConverter.convertTypes;
  var Activity = CollaborationCommon.Activity;
  var triggerConfiguredSurvey = Feedback.triggerConfiguredSurvey;
  var TriggerType = Feedback.TriggerType;
  var StandardActions = Feedback.StandardActions;
  var publicExtension = ClassSupport.publicExtension;
  var methodOverride = ClassSupport.methodOverride;
  var finalExtension = ClassSupport.finalExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  const ProgrammingModel = FELibrary.ProgrammingModel,
    Constants = FELibrary.Constants,
    DraftStatus = FELibrary.DraftStatus,
    EditMode = FELibrary.EditMode,
    StartupMode = FELibrary.StartupMode;
  /**
   * A controller extension offering hooks into the edit flow of the application
   * @hideconstructor
   * @public
   * @since 1.90.0
   */
  let EditFlow = (_dec = defineUI5Class("sap.fe.core.controllerextensions.EditFlow"), _dec2 = methodOverride(), _dec3 = publicExtension(), _dec4 = finalExtension(), _dec5 = publicExtension(), _dec6 = finalExtension(), _dec7 = publicExtension(), _dec8 = finalExtension(), _dec9 = publicExtension(), _dec10 = extensible(OverrideExecution.After), _dec11 = publicExtension(), _dec12 = extensible("AfterAsync"), _dec13 = publicExtension(), _dec14 = extensible("AfterAsync"), _dec15 = publicExtension(), _dec16 = extensible(OverrideExecution.After), _dec17 = publicExtension(), _dec18 = extensible(OverrideExecution.After), _dec19 = publicExtension(), _dec20 = extensible("AfterAsync"), _dec21 = publicExtension(), _dec22 = extensible(OverrideExecution.After), _dec23 = publicExtension(), _dec24 = extensible(OverrideExecution.After), _dec25 = publicExtension(), _dec26 = extensible(OverrideExecution.After), _dec27 = publicExtension(), _dec28 = extensible(OverrideExecution.After), _dec29 = publicExtension(), _dec30 = extensible(OverrideExecution.After), _dec31 = publicExtension(), _dec32 = finalExtension(), _dec33 = publicExtension(), _dec34 = finalExtension(), _dec35 = publicExtension(), _dec36 = finalExtension(), _dec37 = publicExtension(), _dec38 = finalExtension(), _dec39 = publicExtension(), _dec40 = finalExtension(), _dec41 = publicExtension(), _dec42 = extensible(OverrideExecution.After), _dec43 = publicExtension(), _dec44 = extensible(OverrideExecution.Instead), _dec45 = publicExtension(), _dec46 = finalExtension(), _dec(_class = (_class2 = /*#__PURE__*/function (_BaseControllerExtens) {
    function EditFlow() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BaseControllerExtens.call(this, ...args) || this;
      _this.syncTasks = Promise.resolve();
      /**
       * Manages the SideEffects to execute after the document creation.
       * @param listBinding ODataListBinding where the document has to be created
       * @param creationPromise The promise resolved once the document is created
       * @param parentContext Optional parent context
       * @returns Promise resolves once the SideEffects has been triggered
       */
      _this.handleSideEffects = async (listBinding, creationPromise, parentContext) => {
        try {
          const newContext = await creationPromise;
          // transient contexts are reliably removed once oNewContext.created() is resolved
          await newContext.created();
          // if there are transient contexts, we must avoid requesting side effects
          // this is avoid a potential list refresh, there could be a side effect that refreshes the list binding
          // if list binding is refreshed, transient contexts might be lost
          _this.requestSideEffectsForNavigationProperty(listBinding, parentContext ?? _this.getView().getBindingContext());
        } catch (error) {
          Log.error("Error while creating the document", error);
        }
      };
      /**
       * Generates the custom validation messages for the creationRow.
       * @param validationMessages The error messages form the custom validation function
       * @param table The table targeted by the messages
       */
      _this.createCustomValidationMessages = (validationMessages, table) => {
        const customValidationFunction = table.getCreationRow().data("customValidationFunction");
        const customValidity = table.getBindingContext("internal")?.getProperty("creationRowCustomValidity");
        const customMessages = [];
        let fieldControl;
        let finalTarget;

        // Remove existing CustomValidation message
        const oldMessages = Messaging.getMessageModel().getData().filter(message => message.getCode() === customValidationFunction);
        Messaging.removeMessages(oldMessages);
        validationMessages.forEach(validationMessage => {
          // Handle Bound CustomValidation message
          if (validationMessage.messageTarget) {
            fieldControl = Element.getElementById(customValidity[validationMessage.messageTarget].fieldId);
            finalTarget = `${fieldControl.getBindingContext()?.getPath()}/${fieldControl.getBindingPath("value")}`;
            // Add validation message if still not exists
            if (!Messaging.getMessageModel().getData().filter(message => message.getTargets().some(target => target === finalTarget)).length) {
              Messaging.addMessages(new Message({
                message: validationMessage.messageText,
                processor: _this.getView().getModel(),
                type: MessageType.Error,
                code: customValidationFunction,
                technical: false,
                persistent: false,
                target: finalTarget
              }));
            }
            // Add controlId in order to get the focus handling of the error popover
            const existingValidationMessages = Messaging.getMessageModel().getData().filter(message => message.getTargets().some(target => target === finalTarget));
            existingValidationMessages[0].addControlId(customValidity[validationMessage.messageTarget].fieldId);

            // Handle Unbound CustomValidation message
          } else {
            customMessages.push({
              code: customValidationFunction,
              text: validationMessage.messageText,
              persistent: true,
              type: MessageType.Error
            });
          }
        });
        if (customMessages.length) {
          _this.getMessageHandler().showMessageDialog({
            customMessages: customMessages
          });
        }
      };
      /**
       * Resolves the creation mode
       * Provides the expected creation mode:
       * - preserves the passed creation mode when this one is not a NewPage
       * - calculates the new one if the creation mode is a NewPage.
       * @param initialCreationMode The initial creation mode
       * @param listBinding The list binding
       * @param createData The initial data for object creation
       * @returns The new creation mode
       */
      _this.resolveCreationMode = (initialCreationMode, listBinding, createData) => {
        if (initialCreationMode !== CreationMode.NewPage) {
          // use the passed creation mode
          return initialCreationMode;
        } else {
          const metaModel = listBinding.getModel().getMetaModel();
          const programmingModel = _this.getProgrammingModel(listBinding);
          // NewAction is not yet supported for NavigationProperty collection
          if (!listBinding.isRelative()) {
            const dataModelListBindingPath = getInvolvedDataModelObjects(metaModel.getMetaContext(listBinding.getPath()));
            const entitySet = dataModelListBindingPath.targetEntitySet,
              // if NewAction with parameters is present, then creation is 'Deferred'
              // in the absence of NewAction or NewAction with parameters, creation is async
              newAction = (programmingModel === ProgrammingModel.Draft ? entitySet?.annotations.Common?.DraftRoot : entitySet?.annotations.Session?.StickySessionSupported)?.NewAction?.toString();
            if (newAction && dataModelListBindingPath.targetEntityType.actions[newAction].parameters.length > 1) {
              // binding parameter (eg: _it) is not considered
              return CreationMode.Deferred;
            }
          }
          const creationParameters = _this.getTransactionHelper().getCreationParameters(listBinding, createData, _this.getAppComponent());
          if (creationParameters.length) {
            return CreationMode.Deferred;
          }
          return CreationMode.Async;
        }
      };
      return _this;
    }
    _inheritsLoose(EditFlow, _BaseControllerExtens);
    var _proto = EditFlow.prototype;
    _proto.onInit = function onInit() {
      this._hiddenDraft = this.getAppComponent().getEnvironmentCapabilities().getCapabilities().HiddenDraft;
    }

    //////////////////////////////////////
    // Public methods
    //////////////////////////////////////
    ;
    _proto.getInterface = function getInterface() {
      return _BaseControllerExtens.prototype.getInterface.call(this);
    };
    _proto.getAppComponent = function getAppComponent() {
      return this.base.getAppComponent();
    }

    /**
     * Creates a draft document for the existing active document.
     * @param context Context of the active document
     * @returns Promise resolved once the editable document is available with the editable context
     * @public
     * @since 1.90.0
     */;
    _proto.editDocument = async function editDocument(context) {
      const transactionHelper = this.getTransactionHelper();
      const rootViewController = this._getRootViewController();
      const model = context.getModel();
      const viewData = this.getView().getViewData();
      const programmingModel = this.getProgrammingModel(context);
      const groupId = "editGroup";
      const messageHandlingKey = this.getMessageHandler().registerToHoldMessages();
      try {
        const rootContext = await this.getRootContext(context);
        await this.base.editFlow.onBeforeEdit({
          context: rootContext
        });
        let rightmostContext = this._isFclEnabled() ? rootViewController.getRightmostContext() : context;
        if (rightmostContext === undefined || programmingModel === ProgrammingModel.Draft && this.getProgrammingModel(rightmostContext) !== ProgrammingModel.Draft || this._isFclEnabled() && !rightmostContext.getPath().startsWith(rootContext.getPath())) {
          // we check the rightmostContext can be used in draft, and that it belongs to the same root document
          rightmostContext = context;
        }
        const transactionDetails = {};
        const newDocumentContextPromise = transactionHelper.editDocument(rootContext, this.base.getView(), this.getAppComponent(), this.getMessageHandler(), groupId, transactionDetails);
        this.syncTask(newDocumentContextPromise);
        const rootContextInfo = {
          rootSiblingPathPromise: newDocumentContextPromise
        };
        this._setStickySessionInternalProperties(programmingModel, model);
        let siblingInfoPromise;
        // rightmostContext === rootContext => we're in OP. If not, we're in multi-column layout of FCL
        const computeSiblingInfo = rightmostContext !== rootContext || viewData?.viewLevel > 1;
        if (computeSiblingInfo) {
          siblingInfoPromise = this._computeSiblingInformation(rootContext, rightmostContext, programmingModel, true, rootContextInfo, groupId);
        }
        context.getModel().submitBatch(groupId);
        let siblingInfo = await siblingInfoPromise;
        const newDocumentContext = await newDocumentContextPromise;
        let contextToNavigate = newDocumentContext;
        if (computeSiblingInfo && contextToNavigate) {
          if (siblingInfo === undefined) {
            siblingInfo = await this._computeSiblingInformation(rootContext, rightmostContext, programmingModel, true, rootContextInfo, "$auto");
          }
          contextToNavigate = this._getNavigationTargetForEdit(context, newDocumentContext, siblingInfo);
        } else {
          this._updatePathsInHistory([]);
        }
        let overrideMessageUIDecision = false;
        if (newDocumentContext) {
          if (programmingModel !== ProgrammingModel.Sticky && ModelHelper.isCollaborationDraftSupported(model.getMetaModel()) && transactionDetails.existingDraftReused !== true) {
            // The initial share action shall be called  (except if the draft already existed)
            this.base.collaborativeDraft.setInitialShare(true);
          }
          this.base.recommendations.resetRejectedRecommendations(contextToNavigate);
          await this.base.editFlow.onAfterEdit({
            context: contextToNavigate
          });
          await this._handleNewContext(contextToNavigate, {
            editable: true,
            recreateContext: false,
            forceFocus: true
          });
          if (programmingModel === ProgrammingModel.Sticky) {
            // The stickyOn handler must be set after the navigation has been done,
            // as the URL may change in the case of FCL
            let stickyContext;
            if (this._isFclEnabled()) {
              // We need to use the kept-alive context used to bind the page
              stickyContext = newDocumentContext?.getModel().getKeepAliveContext(newDocumentContext.getPath());
            } else {
              stickyContext = newDocumentContext;
            }
            await this.handleStickyOn(stickyContext);
          } else if (this._hiddenDraft) {
            await this.handleHiddenDraftEdit(newDocumentContext);
          }
          overrideMessageUIDecision = true;

          // We change the edit mode after the page binding has been done, otherwise the creation of empty rows might fail (as the table is still on the active version)
          this.setEditMode(EditMode.Editable, false);
          this.setDocumentModified(false);
        }
        this.getMessageHandler().showMessageDialog({
          unHoldKey: messageHandlingKey,
          overrideUIDecision: overrideMessageUIDecision
        });
        return contextToNavigate;
      } catch (error) {
        this.getMessageHandler().showMessageDialog({
          unHoldKey: messageHandlingKey,
          concurrentEditFlag: true
        });
        Log.error("Error while editing the document", error);
        return Promise.reject(error);
      }
    }

    /**
     * Requests the side effects required after deleting an object.
     * @param listBinding The list binding the deleted object belongs to
     * @param parentContext The context of the parent object of the deleted object
     * @param ignoreTransientContexts If true, transient contexts are ignored
     */;
    _proto.requestSideEffectsOnDelete = function requestSideEffectsOnDelete(listBinding, parentContext) {
      let ignoreTransientContexts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      if (parentContext && this.requestSideEffectsForNavigationProperty(listBinding, parentContext, ignoreTransientContexts).length !== 0) {
        const stateMessagesPath = ModelHelper.getMessagesPath(listBinding.getModel().getMetaModel(), parentContext.getPath());
        // In case of a TreeTable, we need to refresh state messages for the ObjectPage, as some of these messages might be attached
        // to children of a deleted row which may not have been loaded yet, and therefore the model wouldn't clean up these messages
        if (stateMessagesPath && this.getTransactionHelper().isListBindingHierarchical(listBinding)) {
          this.getAppComponent().getSideEffectsService().requestSideEffects([stateMessagesPath], parentContext);
        }
      }
    }

    /**
     * Requests the side effects required when structural change (create/delete) is done into a table.
     * @param listBinding The list binding the deleted object belongs to
     * @param parentContext The context of the parent object of the deleted object
     * @param ignoreTransientContexts If true, transient contexts are ignored
     * @returns Promise resolved once the side effects are requested
     */;
    _proto.requestSideEffectsForNavigationProperty = function requestSideEffectsForNavigationProperty(listBinding, parentContext) {
      let ignoreTransientContexts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      const promises = [];
      if (parentContext) {
        const listBindingRelativePathToPage = ModelHelper.getRelativeMetaPathForListBinding(parentContext, listBinding);
        const listBindingRelativePath = ModelHelper.getRelativeMetaPathForListBinding(listBinding.getContext(), listBinding);
        if (ignoreTransientContexts || !CommonUtils.hasTransientContext(listBinding)) {
          // if there are transient contexts (and we don't ignore this check), we must avoid requesting side effects
          // this is avoid a potential list refresh, there could be a side effect that refreshes the list binding
          // if list binding is refreshed, transient contexts might be lost
          if (listBindingRelativePath) {
            promises.push(this.getAppComponent().getSideEffectsService().requestSideEffectsForNavigationProperty(listBindingRelativePath, listBinding.getContext()));
          }
          // if we are triggering side effects for a multivaluefield within a table, listBindingRelativePathToPage is different to listBindingRelativePath
          // so we also ensure page side effects are triggered if need be
          if (listBindingRelativePathToPage && listBindingRelativePathToPage !== listBindingRelativePath) {
            promises.push(this.getAppComponent().getSideEffectsService().requestSideEffectsForNavigationProperty(listBindingRelativePathToPage, parentContext));
          }
        }
      }
      return promises;
    }

    /**
     * Deletes several documents.
     * @param contextsToDelete The contexts of the documents to be deleted
     * @param parameters The parameters
     * @param parameters.beforeDeleteCallBack A function to be called before deletion
     * @param parameters.requestSideEffects True to request side effects after deletion
     * @param parameters.controlId The ID of the control initiating the deletion
     * @param parameters.parentControl The control initiating the deletion
     * @param parameters.bFindActiveContexts True to find active contexts in case of draft
     * @param parameters.selectedContexts The contexts selected in the table triggering the deletion
     * @param parameters.noDialog True to suppress the delete confirmation dialog
     * @param parameters.hideBusyIndicator True to hide the busy indicator during deletion
     * @returns Promise resolved once the documents are deleted
     */;
    _proto.deleteMultipleDocuments = async function deleteMultipleDocuments(contextsToDelete, parameters) {
      let errorToThrow;
      const currentTask = this.syncTask();
      const deletionPromiseKeeper = new PromiseKeeper();
      this.syncTask(deletionPromiseKeeper.promise);
      parameters.beforeDeleteCallBack = this.base.editFlow.onBeforeDelete;
      parameters.requestSideEffects = parameters.requestSideEffects !== false;
      let tableAPI;
      let isInlineCreationRows = false;
      const lockObject = this.getGlobalUIModel();
      const parentControl = this.getView().byId(parameters.controlId) ?? Element.getElementById(parameters.controlId);
      let inactiveContextsToDelete = [];
      if (parentControl?.isA("sap.ui.mdc.Table")) {
        tableAPI = parentControl.getParent();
        isInlineCreationRows = tableAPI.tableDefinition?.control?.creationMode === CreationMode.InlineCreationRows;
        inactiveContextsToDelete = contextsToDelete.filter(context => context.isInactive());
      }
      if (!parentControl) {
        throw new Error("parameter controlId missing or incorrect");
      } else {
        parameters.parentControl = parentControl;
      }
      const listBinding = parentControl.getBinding("items") || parentControl.getRowBinding();
      parameters.bFindActiveContexts = true;
      if (parameters.hideBusyIndicator !== true) {
        BusyLocker.lock(lockObject);
      }
      const parametersForDeleteDocument = parameters;
      parametersForDeleteDocument.syncTaskDone = true;
      try {
        if (!parameters.doNotWaitForSyncTask) {
          await currentTask;
        }

        // Ignore the selectionChange events while deletion is happening, as an event will be sent for each deletion. This can cause errors (trying to get the sibling for an already deleted item).
        tableAPI?.setIgnoreSelectionChangeEvent(true);
        // Suspend the binding to prevent a DataStateIndicator-triggered rebind from racing with the DELETE request.
        // Without this, when a message strip filter is active, the DataStateIndicator detects the message change
        // synchronously and triggers a table rebind (GET) that can arrive at the backend before the DELETE is committed,
        // causing the deleted item to reappear.
        tableAPI?.suspendBinding();
        const deleted = await this.deleteDocumentTransaction(contextsToDelete, parameters);
        tableAPI?.setIgnoreSelectionChangeEvent(false);
        if (!deleted) {
          // The delete was cancelled
          deletionPromiseKeeper.resolve();
          return;
        }
        if (this.getProgrammingModel(parameters?.selectedContexts?.[0] ?? contextsToDelete[0]) === ProgrammingModel.Sticky) {
          this.setDocumentModified(true);
        }
        let result;

        // Multiple object deletion is triggered from a list
        // First clear the selection in the table as it's not valid any more
        if (parentControl.isA("sap.ui.mdc.Table")) {
          parentControl.clearSelection();
        }

        // Then refresh the list-binding (LR), or require side-effects (OP)
        // Resume the binding first so the DataStateIndicator rebind (triggered by message removal) goes out after the DELETE.
        tableAPI?.resumeBinding(true);
        const viewBindingContext = this.getView().getBindingContext();
        if (listBinding.isRoot()) {
          // keep promise chain pending until refresh of listbinding is completed
          result = this.getTransactionHelper().refreshListBinding(listBinding, this.getAppComponent());
          result.then(() => deletionPromiseKeeper.resolve()).catch(() => deletionPromiseKeeper.reject());
        } else if (parameters.requestSideEffects) {
          this.requestSideEffectsOnDelete(listBinding, viewBindingContext, isInlineCreationRows);
          const sideEffectsPromises = this.requestSideEffectsForNavigationProperty(listBinding, viewBindingContext, isInlineCreationRows);
          Promise.all(sideEffectsPromises).then(() => deletionPromiseKeeper.resolve()).catch(() => deletionPromiseKeeper.reject());
        } else {
          deletionPromiseKeeper.resolve();
        }

        // deleting at least one object should also set the UI to dirty
        if (!this.getAppComponent()._isFclEnabled()) {
          EditState.setEditStateDirty();
        }
        const isRecommendationEnabled = this.base.recommendations.isRecommendationEnabled();
        // We clear recommendation data and contexts from internal model for the deleted contexts
        if (isRecommendationEnabled) {
          this.base.recommendations.ignoreRecommendationForContexts(contextsToDelete);
        }
        contextsToDelete?.forEach(context => this.base.recommendations.resetRejectedRecommendations(context));
        // Notify consumers of which contexts were deleted
        await this.base.editFlow.onAfterDelete({
          contexts: contextsToDelete
        });
        if (tableAPI) {
          if (isInlineCreationRows && inactiveContextsToDelete.length > 0) {
            tableAPI.removeEmptyRowsMessages(inactiveContextsToDelete);
            await tableAPI.setUpEmptyRows(tableAPI.getContent(), false);
          }
        }
        this._sendActivity(Activity.Delete, contextsToDelete);
        return await result;
      } catch (error) {
        errorToThrow = error;
        tableAPI?.setIgnoreSelectionChangeEvent(false); // Make sure to reset to the original state
        // We still want to refresh the listbinding in case we deleted some information but not everything (Drafts for example)
        if (listBinding.isRoot()) {
          // keep promise chain pending until refresh of listbinding is completed
          await this.getTransactionHelper().refreshListBinding(listBinding, this.getAppComponent());
        } else if (parameters.requestSideEffects) {
          const viewBindingContext = this.getView().getBindingContext();
          this.requestSideEffectsOnDelete(listBinding, viewBindingContext, isInlineCreationRows);
        }
        Log.error("Error while deleting the document(s)", error);
        deletionPromiseKeeper.reject();
        if (parameters.throwOnError) {
          throw errorToThrow;
        }
      } finally {
        tableAPI?.resumeBinding(false);
        if (parameters.hideBusyIndicator !== true) {
          BusyLocker.unlock(lockObject);
        }
      }
    }

    /**
     * Updates the draft status and displays the error messages if there are errors during an update.
     * @param updatedContext Context of the updated field
     * @param updatePromise Promise to determine when the update operation is completed. The promise should be resolved when the update operation is completed, so the draft status can be updated.
     * @returns Promise resolves once draft status has been updated
     * @public
     * @since 1.90.0
     */;
    _proto.updateDocument = async function updateDocument(updatedContext, updatePromise) {
      const originalBindingContext = this.getView().getBindingContext();
      const isDraft = this.getProgrammingModel(updatedContext) === ProgrammingModel.Draft;
      this.getMessageHandler().removeTransitionMessages();
      const messageHandlingKey = this.getMessageHandler().registerToHoldMessages();
      return this.syncTask(async () => {
        if (originalBindingContext) {
          this.setDocumentModified(true);
          if (!this._isFclEnabled()) {
            EditState.setEditStateDirty();
          }
          if (isDraft) {
            this.setDraftStatus(DraftStatus.Saving);
          }
        }
        try {
          await updatePromise;
          const currentBindingContext = this.getView().getBindingContext();
          if (!isDraft || !currentBindingContext || currentBindingContext !== originalBindingContext) {
            // If a navigation happened while oPromise was being resolved, the binding context of the page changed
            return;
          }

          // We're still on the same context
          const metaModel = currentBindingContext.getModel().getMetaModel();
          const entitySetName = metaModel.getMetaContext(currentBindingContext.getPath()).getObject("@sapui.name");
          const semanticKeys = SemanticKeyHelper.getSemanticKeys(metaModel, entitySetName);
          if (semanticKeys?.length && currentBindingContext.getProperty("IsActiveEntity") === false &&
          // We don't use the semantic key for a new document (creation)
          currentBindingContext.getProperty("HasActiveEntity") === true) {
            const currentSemanticMapping = this._getSemanticMapping();
            const currentSemanticPath = currentSemanticMapping?.semanticPath,
              sChangedPath = SemanticKeyHelper.getSemanticPath(currentBindingContext, true);
            // currentSemanticPath could be null if we have navigated via deep link then there are no semanticMappings to calculate it from
            if (currentSemanticPath && currentSemanticPath !== sChangedPath) {
              await this._handleNewContext(currentBindingContext, {
                editable: true,
                recreateContext: false
              });
            }
          }
          this.setDraftStatus(DraftStatus.Saved);
        } catch (error) {
          Log.error("Error while updating the document", error);
          if (isDraft && originalBindingContext) {
            this.setDraftStatus(DraftStatus.Clear);
          }
        } finally {
          await this.getMessageHandler().showMessages({
            unHoldKey: messageHandlingKey
          });
        }
      });
    };
    _proto.getParentContextFromSelection = function getParentContextFromSelection(selectedContexts) {
      if (selectedContexts && selectedContexts.length > 1) {
        // One parent at most !!
        throw new Error(`Cannot create a new document in a TreeTable with ${selectedContexts.length} parents`);
      }
      return selectedContexts?.length === 1 ? selectedContexts[0] : undefined;
    }

    // Internal only params ---
    // * @param {string} mParameters.creationMode The creation mode using one of the following:
    // *                    Sync - the creation is triggered and once the document is created, the navigation is done
    // *                    Async - the creation and the navigation to the instance are done in parallel
    // *                    Deferred - the creation is done on the target page
    // *                    CreationRow - The creation is done inline async so the user is not blocked
    // mParameters.creationRow Instance of the creation row - (TODO: get rid but use list bindings only)

    /**
     * Creates a new document.
     * @param source  ODataListBinding object or the binding path or a table building block for a temporary list binding
     * @param mInParameters Contains the following attributes:
     * @param mInParameters.creationMode The creation mode using one of the following:<br/>
     *                    NewPage - the created document is shown in a new page, depending on whether metadata 'Sync', 'Async', or 'Deferred' is used<br/>
     *                    Inline - The creation is done within the table. Not supported on a List Report<br/>
     *                    External - The creation is done in a different application specified by the parameter 'outbound'<br/>
     *                    CreationDialog - the creation is done in the table, with a dialog allowing to specify some initial property values (the properties are listed in `creationDialogFields`)
     * @param mInParameters.tableId ID of the table
     * @param mInParameters.outbound The navigation target where the document is created in case of creationMode 'External'
     * @param mInParameters.createAtEnd Specifies if the new entry should be created at the top or bottom of a table in case of creationMode 'Inline'
     * @param mInParameters.data The initial data for the created document
     * @param mInParameters.beforeCreateCallBack PRIVATE
     * @param mInParameters.bFromDeferred PRIVATE
     * @param mInParameters.busyMode PRIVATE
     * @param mInParameters.createAction PRIVATE
     * @param mInParameters.creationRow PRIVATE
     * @param mInParameters.skipParameterDialog PRIVATE
     * @param mInParameters.skipSideEffects PRIVATE
     * @param mInParameters.selectedContexts The contexts that are selected in the table initiating the creation. Used in case of a TreeTable to determine the parent context of the created document
     * @param mInParameters.singleDraftForCreate When enabled, an extra request checks if any drafts exist that were never saved. If unsaved drafts are found, the newest one is opened. If no unsaved drafts are found, a new entity is created
     * @param mInParameters.creationDialogFields Defines the list of properties that are displayed in the creation dialog when the creation mode is set to 'CreationDialog'.<br/>The value is a comma-separated list of property names
     * @param mInParameters.requestAtLeast PRIVATE - Defines the list of properties that should be requested when creating the new document to avoid additional requests later on.<br/>The value is an array of property names
     * @returns Promise resolves once the object has been created
     * @public
     * @since 1.90.0
     */;
    _proto.createDocument = async function createDocument(source, mInParameters) {
      let oDataListBinding;
      let parentContext;
      const dataModel = this.getView().getModel();
      let selectedProperties;
      if (dataModel && ModelHelper.isCollaborationDraftSupported(dataModel.getMetaModel())) {
        selectedProperties = "DraftAdministrativeData/DraftAdministrativeUser,IsActiveEntity,HasActiveEntity";
      }
      if (typeof source === "object" && source.isA && source.isA("sap.fe.core.IRowBindingInterface")) {
        oDataListBinding = source.getRowBinding({
          $select: selectedProperties,
          $$groupId: "$auto.Workers"
        });
        source = oDataListBinding;
      }
      if (mInParameters.creationMode !== CreationMode.External) {
        if (typeof source === "string") {
          const listBindingFromPath = this.getView().getModel()?.bindList(source, undefined, undefined, undefined, {
            $select: selectedProperties,
            $$groupId: "$auto.Workers"
          });
          if (!listBindingFromPath) {
            return;
          }
          oDataListBinding = listBindingFromPath;
          delete mInParameters.createAtEnd;
        } else if (typeof source === "object" && source.isA && source.isA("sap.ui.model.odata.v4.ODataListBinding")) {
          oDataListBinding = source;
        } else {
          throw new Error("Binding object or path expected");
        }
        if (this.getTransactionHelper().isListBindingHierarchical(oDataListBinding)) {
          parentContext = this.getParentContextFromSelection(mInParameters.selectedContexts);
        }
      }
      const resolvedCreationMode = this.resolveCreationMode(mInParameters.creationMode, oDataListBinding, mInParameters.data);
      this.getAppComponent().getRouterProxy().removeIAppStateKey();

      // In FCL, the ListReport remains visible during Create navigation.
      // removeIAppStateKey() cleared the cached key to prevent stale OP state
      // (e.g. section selection) from being carried to the new ObjectPage.
      // Now create a fresh iAppState containing only the current LR state and
      // set it on the RouterProxy directly (without navToHash to avoid corrupting
      // the FCL managed history).
      if (this._isFclEnabled() && !mInParameters.bFromDeferred && !oDataListBinding?.isRelative()) {
        // if we are coming from this has already been done once, so we avoid redoing it as it might block the creation
        const appStateHandler = this.getAppComponent().getAppStateHandler();
        appStateHandler.resetCachedAppState();
        const appStateInfo = await appStateHandler.createAppState({
          viewId: this.getView().getId(),
          replaceHash: false
        });
        if (appStateInfo?.appStateKey) {
          this.getAppComponent().getRouterProxy().sIAppStateKey = appStateInfo.appStateKey;
        }
      }
      if ((mInParameters.singleDraftForCreate !== undefined ? mInParameters.singleDraftForCreate : this.getAppComponent().getManifestEntry("sap.fe")?.app?.singleDraftForCreate) && oDataListBinding === oDataListBinding.getRootBinding() && oDataListBinding.getHeaderContext() !== null) {
        const newBinding = oDataListBinding.getModel()?.bindList(oDataListBinding.getPath(), oDataListBinding.getContext(), new Sorter("DraftAdministrativeData/LastChangeDateTime", true), new Filter({
          filters: [new Filter({
            path: "IsActiveEntity",
            operator: "EQ",
            value1: false
          }), new Filter({
            path: "HasActiveEntity",
            operator: "EQ",
            value1: false
          })],
          and: true
        }));
        const result = await newBinding?.requestContexts(0, 1);
        if (result.length > 0) {
          return this._handleNewContext(result[0], {
            editable: true,
            recreateContext: false
          }).then(() => newBinding?.destroy());
        }
        newBinding?.destroy();
        await this._handleCreationMode(resolvedCreationMode, source, mInParameters, oDataListBinding, parentContext);
      } else {
        await this._handleCreationMode(resolvedCreationMode, source, mInParameters, oDataListBinding, parentContext);
      }
    };
    _proto._handleCreationMode = async function _handleCreationMode(resolvedCreationMode, vListBinding, parameters, oDataListBinding, parentContext) {
      await this.syncTask();
      this._updatePathsInHistory([]);
      switch (resolvedCreationMode) {
        case CreationMode.External:
          return this.createExternalDocument(vListBinding, parameters.outbound);
        case CreationMode.Deferred:
          return this.createDeferredDocument({
            parentContext,
            data: parameters.data,
            requestAtLeast: parameters.requestAtLeast
          }, oDataListBinding);
        case CreationMode.CreationRow:
          return parameters.creationRow ? this.createCreateRowDocument({
            creationRow: parameters.creationRow,
            skipSideEffects: parameters.skipSideEffects,
            createAtEnd: parameters.createAtEnd,
            requestAtLeast: parameters.requestAtLeast
          }) : undefined;
        case CreationMode.Inline:
          return this.createDialogInlineDocument({
            creationMode: CreationMode.Inline,
            tableId: parameters.tableId,
            createAtEnd: parameters.createAtEnd,
            skipSideEffects: parameters.skipSideEffects,
            parentContext,
            data: parameters.data,
            requestAtLeast: parameters.requestAtLeast
          }, oDataListBinding);
        case CreationMode.CreationDialog:
          if (oDataListBinding.isRelative()) {
            // Creation with dialog in an ObjectPage
            return this.createDialogInlineDocument({
              creationMode: CreationMode.CreationDialog,
              tableId: parameters.tableId,
              createAtEnd: parameters.createAtEnd,
              skipSideEffects: parameters.skipSideEffects,
              parentContext,
              data: parameters.data,
              creationDialogFields: parameters.creationDialogFields,
              requestAtLeast: parameters.requestAtLeast
            }, oDataListBinding);
          } else {
            // Creation with dialog in a ListReport
            return this.createDialogAndSaveDocument({
              tableId: parameters.tableId,
              createAtEnd: parameters.createAtEnd,
              skipSideEffects: parameters.skipSideEffects,
              parentContext,
              data: parameters.data,
              creationDialogFields: parameters.creationDialogFields
            }, oDataListBinding);
          }
        case CreationMode.Sync:
        case CreationMode.Async:
          return this.createSyncAsyncDocument({
            creationMode: resolvedCreationMode,
            data: parameters.data,
            bFromDeferred: parameters.bFromDeferred,
            skipSideEffects: parameters.skipSideEffects,
            createAction: parameters.createAction,
            requestAtLeast: parameters.requestAtLeast,
            parentContext
          }, oDataListBinding);
        default:
          throw new Error(`Unhandled creationMode ${resolvedCreationMode}`);
      }
    }

    /**
     * Executes the mandatory configuration after the document has been created.
     * @param prerequisite Promise of the document creation and the following navigation
     * @param listBinding ODataListBinding where the document is created
     * @returns Promise resolves once the configuration is done
     */;
    _proto.postDocumentCreation = async function postDocumentCreation(prerequisite, listBinding) {
      const programmingModel = this.getProgrammingModel(listBinding);
      const model = listBinding.getModel();
      const results = await prerequisite;

      // Check if creation or navigation failed and throw the respective error
      const creation = results[0];
      if (isRejected(creation)) {
        throw creation.reason;
      }
      const navigation = results[1];
      if (isRejected(navigation)) {
        throw navigation.reason;
      }
      const newDocumentContext = creation.value;
      this._setStickySessionInternalProperties(programmingModel, model);
      await this.base.editFlow.onAfterCreate({
        context: newDocumentContext
      });
      this.setEditMode(EditMode.Editable); // The createMode flag will be set in computeModelsForEditMode
      if (!listBinding.isRelative()) {
        if (programmingModel === ProgrammingModel.Sticky) {
          // Workaround to tell the OP that we've created a new object from the LR
          const metaContext = model.getMetaModel().getMetaContext(listBinding.getPath());
          const entitySet = getInvolvedDataModelObjects(metaContext).startingEntitySet;
          const newAction = entitySet?.annotations.Session?.StickySessionSupported?.NewAction;
          this.getInternalModel().setProperty("/lastInvokedAction", newAction);
        } else if (this.getTransactionHelper().isListBindingHierarchical(listBinding) || this.getTransactionHelper().isListBindingAnalytical(listBinding)) {
          // Creating a new item in a hierarchy/analytical table from the ListReport (since the listBinding is not relative)
          // --> we want to force the user to either save or discard the draft before leaving the OP
          this.forceDraftSaveOrDiscard(true);
        }
      }
      if (newDocumentContext) {
        // Handle hidden draft session for created documents, similar to editDocument
        if (this._hiddenDraft && programmingModel === ProgrammingModel.Draft) {
          await this.handleHiddenDraftEdit(newDocumentContext);
        }
        this.setDocumentModifiedOnCreate(listBinding);
        if (!this._isFclEnabled()) {
          EditState.setEditStateDirty();
        }
        this._sendActivity(Activity.Create, newDocumentContext);
        if (ModelHelper.isCollaborationDraftSupported(model.getMetaModel()) && this.isDraftRoot(newDocumentContext) && !this.base.collaborativeDraft.isConnected()) {
          // The initial share action shall be called
          this.base.collaborativeDraft.setInitialShare(true);
        }
      }
    }

    /**
     * Creates a new document via the creationRow.
     * @param parameters Contains the following attributes:
     * @param parameters.createAtEnd The new document is created at the end.
     * @param parameters.creationRow The creation row
     * @param parameters.skipSideEffects The sideEffects are requested
     * @param parameters.requestAtLeast Defines the list of properties that should be requested when creating the new document to avoid additional requests later on.
     * @returns Promise resolves once the document has been created
     */;
    _proto.createCreateRowDocument = async function createCreateRowDocument(parameters) {
      let creation;
      const appComponent = this.getAppComponent();
      const creationRow = parameters.creationRow;
      const table = parameters.creationRow.getParent();
      let navigation = Promise.resolve();
      if (!table) {
        return;
      }
      const tableDefinition = table.getParent()?.getTableDefinition();
      const metaModel = table.getModel()?.getMetaModel();
      const listBinding = table.getRowBinding();
      if (this.getTransactionHelper().isListBindingHierarchical(listBinding)) {
        throw new Error(`Unhandled creationMode "CreationRow" with a TreeTable`);
      }
      const creationRowContext = creationRow.getBindingContext();
      const documentValidation = this.getCreationRowValidationFunction(table);
      // disableAddRowButtonForEmptyData is set to false in manifest converter (Table.ts) if customValidationFunction exists
      if (tableDefinition?.control.disableAddRowButtonForEmptyData === true) {
        table.getBindingContext("internal")?.setProperty("creationRowFieldValidity", {});
      }
      const validationMessages = await this.syncTask(documentValidation);
      if (validationMessages.length > 0) {
        this.createCustomValidationMessages(validationMessages, table);
        Log.error("Custom Validation failed");
        // if custom validation fails, we leave the method immediately
        return;
      }
      const entityType = getInvolvedDataModelObjects(metaModel.getMetaContext(creationRowContext.getPath())).targetEntityType;
      const creationRowPayload = creationRowContext.getObject();
      await this._checkForValidationErrors();

      //moved after _checkForValidationErrors to avoid "'creation' use before initialization" console errors
      //after validation errors occurred
      listBinding.attachEventOnce("change", async () => {
        await creation;
        table.scrollToIndex(parameters.createAtEnd ? table.getRowBinding().getLength() : 0);
      });

      // take care on message handling, draft indicator (in case of draft)
      // Attach the create sent and create completed event to the object page binding so that we can react
      this.handleCreateEvents(listBinding);
      try {
        creation = this.getTransactionHelper().createDocument(listBinding, {
          data: Object.assign({}, ...Object.keys(creationRowPayload).filter(propertyPath => entityType.navigationProperties.findIndex(property => property.name === propertyPath) === -1) // ensure navigation properties are not part of the payload, deep create not supported
          .map(path => ({
            [path]: creationRowPayload[path]
          }))),
          keepTransientContextOnFailed: false,
          // currently not fully supported
          busyMode: "Local",
          // busy handling shall be done locally only
          busyId: tableDefinition?.annotation.id,
          parentControl: this.getView(),
          beforeCreateCallBack: this.base.editFlow.onBeforeCreate,
          skipParameterDialog: appComponent.getStartupMode() === StartupMode.AutoCreate,
          // In case the application was called with preferredMode=autoCreateWith, we want to skip the action parameter dialog
          createAtEnd: parameters.createAtEnd,
          creationMode: CreationMode.CreationRow,
          requestAtLeast: parameters.requestAtLeast
        }, appComponent, this._getResourceModel(), this.getMessageHandler(), false);
        // SideEffects on Create
        // if Save is pressed directly after filling the CreationRow, no SideEffects request
        if (!parameters.skipSideEffects) {
          this.handleSideEffects(listBinding, creation);
        }
        await creation;
        const creationRowListBinding = creationRowContext.getBinding();
        const newTransientContext = creationRowListBinding.create();
        creationRow.setBindingContext(newTransientContext);

        // this is needed to avoid console errors TO be checked with model colleagues
        newTransientContext.created()?.catch(() => {
          Log.trace("transient fast creation context deleted");
        });
        navigation = creationRowContext.delete("$direct");
        return await this.postDocumentCreation(Promise.allSettled([creation, navigation]), listBinding);
      } catch (error) {
        // Reset busy indicator after a validation error
        if (BusyLocker.isLocked(this.base.getView().getModel("ui"))) {
          BusyLocker.unlock(this.base.getView().getModel("ui"));
        }
        Log.error("CreationRow navigation error: ", error);
      }
    }

    /**
     * Creates a new document in Inline mode or with a creation inline dialog (Object page case).
     * @param parameters Contains the following attributes:
     * @param parameters.creationMode
     * @param parameters.createAtEnd The new document is created at the end
     * @param parameters.skipSideEffects The sideEffects are requested
     * @param parameters.tableId The id of the table
     * @param parameters.parentContext Parent context (for TreeTable)
     * @param parameters.data Intial data for creation
     * @param parameters.creationDialogFields Fields to be displayed in the creation dialog
     * @param parameters.requestAtLeast Defines the list of properties that should be requested when creating the new document to avoid additional requests later on.
     * @param listBinding ODataListBinding where the document is created
     * @returns Promise resolves once the document has been created
     */;
    _proto.createDialogInlineDocument = async function createDialogInlineDocument(parameters, listBinding) {
      let table;
      if (parameters.tableId) {
        table = this.getView().byId(parameters.tableId);
      }
      if (table?.isA("sap.ui.mdc.Table")) {
        table.getRowBinding().attachEventOnce("createCompleted", async () => {
          const newContext = await creation;
          const contextIndex = newContext.getIndex();
          const aggregationData = listBinding.getAggregation();
          const isCreateInPlace = aggregationData?.createInPlace ?? false;
          if (contextIndex !== undefined && contextIndex >= 0) {
            setTimeout(function () {
              if (!table?.getBusy()) {
                const openDialog = InstanceManager.getOpenDialogs().find(dialog => dialog.data("FullScreenDialog") !== true);
                if (openDialog) {
                  openDialog.attachEventOnce("afterClose", () => table?.focusRow(contextIndex, true));
                } else {
                  table?.focusRow(contextIndex, true);
                }
              }
            }, 0);
          } else if (isCreateInPlace) {
            // For create in-place mode (server position), display a warning message in case the newly created node isn't visible
            MessageToast.show(this._getResourceModel().getText("C_NEW_ELEMENT_NOT_DISPLAYED"));
          }
          if (this.getTransactionHelper().isListBindingHierarchical(listBinding) && !isCreateInPlace) {
            // In case of a tree table, we also scroll to keep the parent visible
            const parentContext = newContext.getParent();
            const parentIndex = parentContext?.getIndex();
            if (parentIndex !== undefined && parentIndex >= 0) {
              table?.scrollToIndex(parentIndex);
            }
          }
        });
      } else {
        table = undefined;
      }

      // take care on message handling, draft indicator (in case of draft)
      // Attach the create sent and create completed event to the object page binding so that we can react
      this.handleCreateEvents(listBinding);
      const creation = this.getTransactionHelper().createDocument(listBinding, {
        //Check if All parameters are needed
        keepTransientContextOnFailed: false,
        // currently not fully supported
        busyMode: "Local",
        // busy handling shall be done locally only
        busyId: table?.getParent()?.getTableDefinition()?.annotation.id,
        parentControl: this.getView(),
        beforeCreateCallBack: this.base.editFlow.onBeforeCreate,
        skipParameterDialog: this.getAppComponent().getStartupMode() === StartupMode.AutoCreate,
        // In case the application was called with preferredMode=autoCreateWith, we want to skip the action parameter dialog
        createAtEnd: parameters.createAtEnd,
        creationMode: parameters.creationMode,
        parentContext: parameters.parentContext,
        data: parameters.data,
        creationDialogFields: parameters.creationDialogFields,
        requestAtLeast: parameters.requestAtLeast
      }, this.getAppComponent(), this._getResourceModel(), this.getMessageHandler(), false);
      if (!parameters.skipSideEffects) {
        this.handleSideEffects(listBinding, creation);
      }
      return this.postDocumentCreation(Promise.allSettled([creation, this.syncTask(creation)]), listBinding);
    }

    /**
     * Creates a new document via a dialog and saves it immediately (ListReport case).
     * @param parameters Contains the following attributes:
     * @param parameters.createAtEnd The new document is created at the end
     * @param parameters.skipSideEffects The sideEffects are requested
     * @param parameters.tableId The id of the table
     * @param parameters.parentContext Parent context (for TreeTable)
     * @param parameters.data Intial data for creation
     * @param parameters.creationDialogFields Fields to be displayed in the creation dialog
     * @param listBinding ODataListBinding where the document is created
     * @returns Promise resolves once the document has been created
     */;
    _proto.createDialogAndSaveDocument = async function createDialogAndSaveDocument(parameters, listBinding) {
      let table;
      if (parameters.tableId) {
        table = this.getView().byId(parameters.tableId);
        if (table?.isA("sap.ui.mdc.Table") !== true) {
          table = undefined;
        }
      }
      let savedDocumentContext;
      const afterCreateInDialog = async newDocumentContext => {
        try {
          await this.base.editFlow.onAfterCreate({
            context: newDocumentContext
          });
        } catch (error) {
          // Errors in onAfterCreate are not causing the overall flow to fail
          Log.error("Error after creation: " + error);
        }
        await this.base.editFlow.onBeforeSave({
          context: newDocumentContext
        });
        savedDocumentContext = await this.getTransactionHelper().saveDocument(newDocumentContext, this.getAppComponent(), this._getResourceModel(), false, [], this.getMessageHandler(), true, true);
        try {
          await this.base.editFlow.onAfterSave({
            context: savedDocumentContext
          });
        } catch (error) {
          // Errors in onAfterSave are not causing the overall flow to fail
          Log.error("Error after save: " + error);
        }
        if (this.getTransactionHelper().isListBindingHierarchical(listBinding)) {
          // In case of a TreeTable, we don't use the listBinding from the ListReport to create the new item,
          // So we can't know the position of the new item in the listBinding
          // --> We refresh the table and scroll to the parent position
          const tableAPI = table?.getParent();
          if (tableAPI) {
            const parentIndex = parameters.parentContext?.getIndex();
            tableAPI.refresh();
            if (parentIndex !== undefined && parentIndex >= 0) {
              table?.scrollToIndex(parentIndex);
            }
          }
        } else {
          // In case of a flat table, we can scroll to the newly created item
          const itemIndex = savedDocumentContext.getIndex();
          if (itemIndex !== undefined && itemIndex >= 0) {
            table?.scrollToIndex(itemIndex);
          }
        }
      };
      const creation = this.getTransactionHelper().createDocument(listBinding, {
        //Check if All parameters are needed
        keepTransientContextOnFailed: false,
        // currently not fully supported
        busyMode: "Local",
        // busy handling shall be done locally only
        busyId: table?.getParent()?.getTableDefinition()?.annotation.id,
        parentControl: this.getView(),
        beforeCreateCallBack: this.base.editFlow.onBeforeCreate,
        afterCreateCallBack: afterCreateInDialog,
        skipParameterDialog: this.getAppComponent().getStartupMode() === StartupMode.AutoCreate,
        // In case the application was called with preferredMode=autoCreateWith, we want to skip the action parameter dialog
        createAtEnd: parameters.createAtEnd,
        creationMode: CreationMode.CreationDialog,
        parentContext: parameters.parentContext,
        data: parameters.data,
        creationDialogFields: parameters.creationDialogFields
      }, this.getAppComponent(), this._getResourceModel(), this.getMessageHandler(), false);
      await Promise.all([creation, this.syncTask(creation)]);
      if (savedDocumentContext && parameters.skipSideEffects !== true) {
        this.requestSideEffectsForNavigationProperty(listBinding, savedDocumentContext);
      }
    }

    /**
     * Creates a deferred document.
     * @param parameters Contains the following attributes:
     * @param parameters.data  Data to save on the new document
     * @param parameters.parentContext
     * @param parameters.requestAtLeast Defines the list of properties that should be requested when creating the new document to avoid additional requests later on.
     * @param listBinding ODataListBinding where the document has to be created
     * @returns Promise resolves once the navigation is done
     */;
    _proto.createDeferredDocument = async function createDeferredDocument(parameters, listBinding) {
      const lockObject = this.getGlobalUIModel();
      BusyLocker.lock(lockObject);
      await this.getInternalRouting().navigateForwardToContext(listBinding, {
        createOnNavigateParameters: {
          mode: "Deferred",
          parentContext: parameters.parentContext,
          listBinding,
          data: parameters.data,
          requestAtLeast: parameters.requestAtLeast
        },
        editable: true,
        forceFocus: true
      });
      BusyLocker.unlock(lockObject);
    }

    /**
     * Creates a sync or async document.
     * @param parameters Contains the following attributes:
     * @param parameters.creationMode The sync or async creation mode
     * @param parameters.bFromDeferred This document is created after a deffered creation
     * @param parameters.createAction  The create has been triggered by a create action
     * @param parameters.data  Data to save on the new document
     * @param parameters.skipSideEffects The sideEffects are requested
     * @param parameters.parentContext
     * @param parameters.requestAtLeast Defines the list of properties that should be requested when creating the new document to avoid additional requests later on.
     * @param listBinding ODataListBinding where the document is created
     * @returns Promise resolves once the document has been created
     */;
    _proto.createSyncAsyncDocument = async function createSyncAsyncDocument(parameters, listBinding) {
      let navigation;
      const lockObject = this.getGlobalUIModel();
      const routingListener = this.getInternalRouting();
      BusyLocker.lock(lockObject);
      const creation = this.getTransactionHelper().createDocument(listBinding, {
        ...parameters,
        ...{
          parentControl: this.getView(),
          beforeCreateCallBack: this.base.editFlow.onBeforeCreate,
          skipParameterDialog: this.getAppComponent().getStartupMode() === StartupMode.AutoCreate,
          // In case the application was called with preferredMode=autoCreateWith, we want to skip the action parameter dialog
          requestAtLeast: undefined // The requestAtLeast properties will be loaded when binding the target page
        }
      }, this.getAppComponent(), this._getResourceModel(), this.getMessageHandler(), false).then(newDocumentContext => {
        if (this._isFclEnabled() && newDocumentContext && newDocumentContext.getBinding() !== listBinding) {
          // In FCL case, if the new context has been created with an action (not with the standard POST create), we need to refresh
          // the original listBinding so that it contains the newly created object (this is done automatically by the listBinding for standard create)
          const groupId = listBinding.isSuspended() ? listBinding.getGroupId() : "$auto.LongRunners";
          listBinding.refresh(groupId);
        }
        return newDocumentContext;
      });

      // The SideEffects are requested only if the creation in the FLC case (dirty state is not set to true so SideEffects are relevant)
      // or if the creation is not deferred.
      if ((this._isFclEnabled() || parameters.bFromDeferred !== true) && !parameters.skipSideEffects) {
        this.handleSideEffects(listBinding, creation, parameters.bFromDeferred ? listBinding.getContext() : undefined);
      }
      if (parameters.creationMode === CreationMode.Async) {
        navigation = routingListener.navigateForwardToContext(listBinding, {
          createOnNavigateParameters: {
            mode: "Async",
            createContextPromise: creation
          },
          editable: true,
          forceFocus: true,
          requestOnBinding: this._isFclEnabled() ? parameters.requestAtLeast : undefined // For fullscreen, we don't need to request extra properties as the table will be refreshed when navigating back with the DirtyState
        });
      } else {
        const coreResourceBundle = Library.getResourceBundleFor("sap.fe.core");
        navigation = creation.then(async newDocumentContext => {
          if (!newDocumentContext) {
            return routingListener.navigateToMessagePage(coreResourceBundle.getText("C_COMMON_SAPFE_DATA_RECEIVED_ERROR"), {
              title: coreResourceBundle.getText("C_COMMON_SAPFE_ERROR"),
              description: coreResourceBundle.getText("C_EDITFLOW_SAPFE_CREATION_FAILED_DESCRIPTION")
            });
          } else {
            // In case the Sync creation was triggered for a deferred creation, we don't navigate forward
            // as we're already on the corresponding ObjectPage
            const navParameters = {
              editable: true,
              forceFocus: true,
              requestOnBinding: this._isFclEnabled() ? parameters.requestAtLeast : undefined,
              // For fullscreen, we don't need to request extra properties as the table will be refreshed when navigating back with the DirtyState
              transient: this.getProgrammingModel(listBinding) == ProgrammingModel.Sticky || parameters.createAction ? true : undefined
            };
            return parameters.bFromDeferred ? routingListener.navigateToContext(newDocumentContext, navParameters) : routingListener.navigateForwardToContext(newDocumentContext, navParameters);
          }
        }).catch(async error => {
          if (typeof error === "string" && error === Constants.CancelActionDialog) {
            // Creation has been cancelled by the user => no error message page
            throw error;
          }
          Log.error("Creation error: ", error);
          // Navigate to error message page in case of an error during creation or navigation
          return routingListener.navigateToMessagePage(coreResourceBundle.getText("C_COMMON_SAPFE_DATA_RECEIVED_ERROR"), {
            title: coreResourceBundle.getText("C_COMMON_SAPFE_ERROR"),
            description: coreResourceBundle.getText("C_EDITFLOW_SAPFE_CREATION_FAILED_DESCRIPTION"),
            showMessagePageOnCreateFailure: true
          });
        });
      }
      try {
        await this.postDocumentCreation(Promise.allSettled([creation, navigation]), listBinding);
      } catch (error) {
        // TODO: currently, the only errors handled here are raised as string - should be changed to Error objects
        // creation has been cancelled by user or failed in backend => in case we have navigated to transient context before, navigate back
        // the switch-statement above seems to indicate that this happens in creationModes deferred and async. But in fact, in these cases after the navigation from routeMatched in OP component
        // createDeferredDocument is triggered, which calls this method (createDocument) again - this time with creationMode sync. Therefore, also in that mode we need to trigger back navigation.
        // The other cases might still be needed in case the navigation fails.
        if ([Constants.CancelActionDialog, Constants.ActionExecutionFailed, Constants.CreationFailed, Constants.OnBeforeCreateFailed].includes(error instanceof Error ? error.message : error)) {
          this.getInternalRouting().navigateBackFromTransientState();
        }
        throw error;
      } finally {
        BusyLocker.unlock(lockObject);
      }
    }

    /**
     * Creates an external document.
     * @param listBinding ODataListBinding where the document has to be created
     * @param outbound The outbound action
     * @returns Promise resolves once the navigation has been triggered
     */;
    _proto.createExternalDocument = async function createExternalDocument(listBinding, outbound) {
      // TODO: Call appropriate function (currently using the same as for outbound chevron nav, and without any context - 3rd param)
      if (outbound) {
        if (typeof listBinding !== "string" && this.getTransactionHelper().isListBindingHierarchical(listBinding)) {
          throw new Error(`Unhandled creationMode "External" with a TreeTable`);
        }
        await this.syncTask();
        const controller = this.getView().getController();
        const createPath = ModelHelper.getAbsoluteMetaPathForListBinding(this.base.getView(), listBinding);
        controller._intentBasedNavigation.onChevronPressNavigateOutBound(controller, outbound, undefined, createPath);
      }
    };
    /**
     * Validates a document.
     * @returns Promise resolves with result of the custom validation function
     */
    _proto.validateDocument = async function validateDocument(context, parameters) {
      return this.getTransactionHelper().validateDocument(context, parameters, this.getView());
    }

    /**
     * This function returns an asynchronous function that provides the result of
     * a creation row's custom validation as a promise. If no creation row is involved
     * the resulting function returns a resolved promise.
     * @param table The table with the creationRow
     * @returns A function that returns a promise
     */;
    _proto.getCreationRowValidationFunction = function getCreationRowValidationFunction(table) {
      const creationRow = table?.getCreationRow();
      if (creationRow && table) {
        return async () => {
          const creationRowObjects = creationRow.getBindingContext().getObject();
          delete creationRowObjects["@$ui5.context.isTransient"];
          return this.validateDocument(table.getBindingContext(), {
            data: creationRowObjects,
            customValidationFunction: table.getCreationRow().data("customValidationFunction")
          });
        };
      }
      return async () => Promise.resolve([]);
    }

    /**
     * Creates several documents.
     * @param listBinding The listBinding used to create the documents
     * @param dataForCreate The initial data for the new documents
     * @param options Options to influence the creation
     * @param options.createAtEnd True if the new contexts need to be created at the end of the list binding
     * @param options.isFromCopyPaste True if the creation has been triggered by a paste action
     * @param options.beforeCreateCallBack Callback to be called before the creation
     * @param options.createAsInactive True if the contexts need to be created as inactive
     * @param options.requestSideEffects True by default, false if SideEffects should not be requested
     * @param options.hideBusyIndicator True if the busy indicator should be suppressed
     * @param options.defaultValueFunctionData Default values retrieved from the DefaultValuesFunction to be applied to the new documents
     * @returns A Promise with the newly created contexts.
     */;
    _proto.createMultipleDocuments = async function createMultipleDocuments(listBinding, dataForCreate) {
      let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      const currentTask = this.syncTask();
      let creationResolve;
      let creationReject;
      const creationPromise = new Promise((resolve, reject) => {
        creationResolve = resolve;
        creationReject = reject;
      });
      this.syncTask(creationPromise);
      const transactionHelper = this.getTransactionHelper();
      const lockObject = this.getGlobalUIModel();
      const targetListBinding = listBinding;
      if (!options.hideBusyIndicator) {
        BusyLocker.lock(lockObject);
      }
      try {
        if (!options.createAsInactive && !options.doNotWaitForSyncTask) {
          // if we are creating inactive rows we do not need to wait for sync task
          // in case empty row creation is triggered via side effects it needs to not wait
          //  CS20260011843850
          await currentTask;
        }
        const metaModel = targetListBinding.getModel().getMetaModel();
        let metaPath;
        if (targetListBinding.getContext()) {
          metaPath = metaModel.getMetaPath(`${targetListBinding.getContext().getPath()}/${targetListBinding.getPath()}`);
        } else {
          metaPath = metaModel.getMetaPath(targetListBinding.getPath());
        }
        this.handleCreateEvents(targetListBinding);

        // Iterate on all items and store the corresponding creation promise
        const creationPromises = dataForCreate.map(async propertyValues => {
          const createParameters = {
            data: {},
            parentControl: this.getView()
          };
          createParameters.keepTransientContextOnFailed = false; // currently not fully supported
          createParameters.creationMode = CreationMode.CreationRow;
          createParameters.createAtEnd = options.createAtEnd;
          createParameters.inactive = options.createAsInactive === true;
          createParameters.beforeCreateCallBack = options.beforeCreateCallBack;
          createParameters.hideBusyIndicator = options.hideBusyIndicator;

          // Remove navigation properties as we don't support deep create
          for (const propertyPath in propertyValues) {
            const property = metaModel.getObject(`${metaPath}/${propertyPath}`);
            if (property && property.$kind !== "NavigationProperty" && !propertyPath.includes("/") && propertyValues[propertyPath] !== undefined && propertyValues[propertyPath] !== null) {
              createParameters.data[propertyPath] = propertyValues[propertyPath];
            }
          }
          return transactionHelper.createDocument(targetListBinding, createParameters, this.getAppComponent(), this._getResourceModel(), this.getMessageHandler(), options.isFromCopyPaste === true, options.defaultValueFunctionData);
        });
        const createdContexts = await Promise.all(creationPromises);
        if (!options.createAsInactive) {
          this.setDocumentModifiedOnCreate(targetListBinding);
        }
        // transient contexts are reliably removed once oNewContext.created() is resolved
        const activeContexts = createdContexts.filter(newContext => !newContext.isInactive());
        await Promise.all(activeContexts.map(async newContext => newContext.created()));

        // if there are transient contexts, we must avoid requesting side effects
        // this is avoid a potential list refresh, there could be a side effect that refreshes the list binding
        // if list binding is refreshed, transient contexts might be lost
        if (options.requestSideEffects) {
          const sideEffectsPromises = this.requestSideEffectsForNavigationProperty(listBinding, this.base.getView().getBindingContext());
          Promise.all(sideEffectsPromises).then(() => creationResolve()).catch(() => creationReject());
        } else {
          creationResolve();
        }
        if (this.base.collaborativeDraft.isConnected() && activeContexts.length > 0) {
          this._sendActivity(Activity.Create, activeContexts);
        }
        return createdContexts;
      } catch (err) {
        Log.error("Error while creating multiple documents.");
        creationReject();
        throw err;
      } finally {
        if (!options.hideBusyIndicator) {
          BusyLocker.unlock(lockObject);
        }
      }
    }

    /**
     * This function can be used to intercept the 'Create' action. You can execute custom coding in this function.
     * The framework waits for the returned promise to be resolved before continuing the 'Create' action.
     * If you reject the promise, the 'Create' action is stopped.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param _mParameters Object containing the parameters passed to onBeforeCreate
     * @param _mParameters.contextPath Path pointing to the context on which Create action is triggered
     * @param _mParameters.createParameters Array of values that are filled in the Action Parameter Dialog
     * @returns A promise to be returned by the overridden method. If resolved, the 'Create' action is triggered. If rejected, the 'Create' action is not triggered.
     * @public
     * @since 1.98.0
     */;
    _proto.onBeforeCreate = async function onBeforeCreate(_mParameters) {
      // to be overridden
      return Promise.resolve();
    }

    /**
     * This function can be used to intercept the 'Edit' action. You can execute custom coding in this function.
     * The framework waits for the returned promise to be resolved before continuing the 'Edit' action.
     * If you reject the promise, the 'Edit' action is stopped and the user stays in display mode.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param _mParameters Object containing the parameters passed to onBeforeEdit
     * @param _mParameters.context Page context that is going to be edited.
     * @returns A promise to be returned by the overridden method. If resolved, the 'Edit' action is triggered. If rejected, the 'Edit' action is not triggered and the user stays in display mode.
     * @public
     * @since 1.98.0
     */;
    _proto.onBeforeEdit = async function onBeforeEdit(_mParameters) {
      // to be overridden
      return Promise.resolve();
    }

    /**
     * This function can be used to intercept the 'Save' action. You can execute custom coding in this function.
     * The framework waits for the returned promise to be resolved before continuing the 'Save' action.
     * If you reject the promise, the 'Save' action is stopped and the user stays in edit mode.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param _mParameters Object containing the parameters passed to onBeforeSave
     * @param _mParameters.context Page context that is going to be saved.
     * @returns A promise to be returned by the overridden method. If resolved, the 'Save' action is triggered. If rejected, the 'Save' action is not triggered and the user stays in edit mode.
     * @public
     * @since 1.90.0
     */;
    _proto.onBeforeSave = async function onBeforeSave(_mParameters) {
      // to be overridden
      return Promise.resolve();
    }

    /**
     * This function can be used to intercept the 'Discard' action. You can execute custom coding in this function.
     * The framework waits for the returned promise to be resolved before continuing the 'Discard' action.
     * If you reject the promise, the 'Discard' action is stopped and the user stays in edit mode.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param _mParameters Object containing the parameters passed to onBeforeDiscard
     * @param _mParameters.context Page context that is going to be discarded.
     * @returns A promise to be returned by the overridden method. If resolved, the 'Discard' action is triggered. If rejected, the 'Discard' action is not triggered and the user stays in edit mode.
     * @public
     * @since 1.98.0
     */;
    _proto.onBeforeDiscard = async function onBeforeDiscard(_mParameters) {
      // to be overridden
      return Promise.resolve();
    }

    /**
     * This function can be used to intercept the 'Delete' action. You can execute custom coding in this function.
     * The framework waits for the returned promise to be resolved before continuing the 'Delete' action.
     * If you reject the promise, the 'Delete' action is stopped.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param _mParameters Object containing the parameters passed to onBeforeDelete
     * @param _mParameters.contexts An array of contexts that are going to be deleted
     * @returns A promise to be returned by the overridden method. If resolved, the 'Delete' action is triggered. If rejected, the 'Delete' action is not triggered.
     * @public
     * @since 1.98.0
     */;
    _proto.onBeforeDelete = async function onBeforeDelete(_mParameters) {
      // to be overridden
      return Promise.resolve();
    }

    /**
     * This function can be used to intercept the action execution. You can execute custom coding in this function.
     * The framework waits for the returned promise to be resolved before continuing the action.
     * If you reject the promise, the action is stopped.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param _mParameters Object containing the parameters passed to onBeforeExecuteAction
     * @param _mParameters.contexts An array of contexts that are going to be used for the action execution
     * @returns A promise to be returned by the overridden method. If resolved, the 'Delete' action is triggered. If rejected, the action is not triggered.
     */;
    _proto.onBeforeExecuteAction = async function onBeforeExecuteAction(_mParameters) {
      // to be overridden
      return Promise.resolve();
    }

    /**
     * This function can be used to execute code after the 'Save' action.
     * You can execute custom coding in this function.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param _mParameters Object containing the parameters passed to onAfterSave
     * @param _mParameters.context The context we obtained after saving
     * @returns A promise to be returned by the overridden method. If rejected, any further processing by the framework is stopped.
     * @public
     * @since 1.116.0
     */;
    _proto.onAfterSave = async function onAfterSave(_mParameters) {
      // to be overridden
      return Promise.resolve();
    }

    /**
     * This function can be used to execute code after the 'Create' action.
     * You can execute custom coding in this function.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param _mParameters Object containing the parameters passed to onAfterCreate
     * @param _mParameters.context The newly created context
     * @returns A promise to be returned by the overridden method. If rejected, any further processing by the framework is stopped.
     * @public
     * @since 1.116.0
     */;
    _proto.onAfterCreate = async function onAfterCreate(_mParameters) {
      // to be overridden
      return Promise.resolve();
    }

    /**
     * This function can be used to execute code after the 'Edit' action.
     * You can execute custom coding in this function.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param _mParameters Object containing the parameters passed to onAfterEdit
     * @param _mParameters.context Page context that is going to be edited.
     * @returns A promise to be returned by the overridden method. If rejected, any further processing by the framework is stopped.
     * @public
     * @since 1.116.0
     */;
    _proto.onAfterEdit = async function onAfterEdit(_mParameters) {
      // to be overridden
      return Promise.resolve();
    }

    /**
     * This function can be used to execute code after the 'Discard' action.
     * You can execute custom coding in this function.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param _mParameters Object containing the parameters passed to onAfterDiscard
     * @param _mParameters.context The context obtained after discarding the object, or undefined if we discarded a new object
     * @returns A promise to be returned by the overridden method. If rejected, any further processing by the framework is stopped.
     * @public
     * @since 1.116.0
     */;
    _proto.onAfterDiscard = async function onAfterDiscard(_mParameters) {
      // to be overridden
      return Promise.resolve();
    }

    /**
     * This function can be used to execute code after the 'Delete' action.
     * You can execute custom coding in this function.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     * @param _mParameters Object containing the parameters passed to onAfterDelete
     * @param _mParameters.contexts An array of contexts that are going to be deleted
     * @returns A promise to be returned by the overridden method. If rejected, any further processing by the framework is stopped.
     * @public
     * @since 1.116.0
     */;
    _proto.onAfterDelete = async function onAfterDelete(_mParameters) {
      // to be overridden
      return Promise.resolve();
    };
    _proto.manageSaveAndLeaveNavigation = async function manageSaveAndLeaveNavigation(activeDocumentContext) {
      const appComponent = this.getAppComponent();
      const routerProxy = appComponent?.getRouterProxy();
      const startupMode = appComponent.getStartupMode();
      if (startupMode === StartupMode.Deeplink || startupMode === StartupMode.Create || startupMode === StartupMode.AutoCreate) {
        const backSteps = routerProxy?._oManagedHistory.length ?? 0;
        history.go(-backSteps);
      } else {
        await this.base._routing.navigateBackFromContext(activeDocumentContext);
      }
    }

    // Internal only params ---
    // @param {boolean} mParameters.bExecuteSideEffectsOnError Indicates whether SideEffects need to be ignored when user clicks on Save during an Inline creation
    // @param {object} mParameters.bindings List bindings of the tables in the view.
    // Both of the above parameters are for the same purpose. User can enter some information in the creation row(s) but does not 'Add row', instead clicks Save.
    // There can be more than one in the view.

    /**
     * Saves a new document after checking it.
     * @param oContext  Context of the editable document
     * @param mParameters PRIVATE
     * @returns Promise resolves once save is complete
     * @public
     * @since 1.90.0
     */;
    _proto.saveDocument = async function saveDocument(oContext, mParameters) {
      // saveDocument is called from inline edit keyboard shortcut
      if (!this.getGlobalUIModel().getProperty("/isEditable") && this.base.inlineEditFlow?.isInlineEditPossible() && this.getGlobalUIModel().getProperty("/isInlineEditActive")) {
        this.base.inlineEditFlow.inlineEditSave();
        return;
      }
      mParameters = mParameters || {};
      const bExecuteSideEffectsOnError = mParameters.bExecuteSideEffectsOnError || undefined;
      const transactionHelper = this.getTransactionHelper();
      const aBindings = mParameters.bindings;
      const messageHandlingKey = this.getMessageHandler().registerToHoldMessages();
      try {
        await this.syncTask();
        // in case of saving / activating the bound transition messages shall be removed before the PATCH/POST
        // is sent to the backend
        this.getMessageHandler().removeTransitionMessages();
        if (mParameters.mergePatchDraft !== true) {
          await this._submitOpenChanges(oContext);
          //we need to request for recommendations and then bring the dialog here
        }
        await this._checkForValidationErrors();
        const recommendationOptionChoosen = await this.checkRecommendationOption();
        const rootContext = await this.getRootContext(oContext);
        await this.base.editFlow.onBeforeSave({
          context: rootContext
        });
        const sProgrammingModel = this.getProgrammingModel(oContext);
        const rootViewController = this._getRootViewController();
        let siblingInfo;
        if ((sProgrammingModel === ProgrammingModel.Sticky || oContext.getProperty("HasActiveEntity")) && rootViewController.isFclEnabled() || this._hiddenDraft && oContext.getProperty("HasActiveEntity")) {
          siblingInfo = await this._computeSiblingInformation(rootContext, this._hiddenDraft ? oContext : rootViewController.getRightmostContext(), sProgrammingModel, true);
        }

        // Execute the registered deferred SideEffects which have not be executed yet for the page context
        // Can occur when shortcut is used to save the document.
        await this.base.sideEffects.handlePageChangeContext(oContext);

        // The $auto queue can only have pending changes at this point when SAVE was clicked immediately after changing a field.
        // In this case the $auto queue is locked therefore the following submit batch should not create a separate batch request.
        // It is done in order to make sure that patch, draftprepare, draftactivate each have their own changeset
        if (oContext.getModel().hasPendingChanges("$auto") && mParameters.mergePatchDraft) {
          oContext.getModel().submitBatch("$auto");
        }
        const activeDocumentContext = await transactionHelper.saveDocument(rootContext, this.getAppComponent(), this._getResourceModel(), bExecuteSideEffectsOnError, aBindings, this.getMessageHandler(), this.getCreationMode(), undefined, mParameters?.isStandardSave);
        this._removeStickySessionInternalProperties(sProgrammingModel);
        if (this._hiddenDraft) {
          this.handleSessionOff();
        }
        this._sendActivity(Activity.Activate, activeDocumentContext);
        this.base.collaborativeDraft.disconnect();
        this._triggerConfiguredSurvey(StandardActions.save, TriggerType.standardAction);
        this.setDocumentModified(false);
        this.setEditMode(EditMode.Display, false);
        this.base.recommendations.resetRejectedRecommendations(activeDocumentContext);
        await this.base.editFlow.onAfterSave({
          context: activeDocumentContext
        });

        // update telemetry data for how page was saved and then do storing of this data to backend through the storeData function
        this.base.recommendations.storeDataForTelemetry(recommendationOptionChoosen);
        await this.getMessageHandler().showMessageDialog({
          unHoldKey: messageHandlingKey
        });
        if (activeDocumentContext !== oContext) {
          let contextToNavigate = activeDocumentContext;
          siblingInfo = siblingInfo ?? this._createSiblingInfo(oContext, activeDocumentContext);
          if (sProgrammingModel === ProgrammingModel.Draft) {
            // When saving, the semantic keys may have changed.
            // In this case, we also need to manage the semantic URL change in the history
            const previousSemanticPath = SemanticKeyHelper.getSemanticPath(oContext, true);
            const newSemanticPath = SemanticKeyHelper.getSemanticPath(activeDocumentContext, true);
            if (previousSemanticPath && newSemanticPath && previousSemanticPath !== newSemanticPath) {
              siblingInfo.pathMapping.push({
                oldPath: previousSemanticPath,
                newPath: newSemanticPath
              });
            }
          }
          this._updatePathsInHistory(siblingInfo.pathMapping);
          if (rootViewController.isFclEnabled() || this._hiddenDraft?.stayOnCurrentPageAfterSave) {
            if (siblingInfo.targetContext.getPath() !== activeDocumentContext.getPath()) {
              contextToNavigate = siblingInfo.targetContext;
            }
          }
          if (mParameters.skipBindingToView !== true) {
            if (mParameters.useSaveAndLeave) {
              await this.manageSaveAndLeaveNavigation(activeDocumentContext);
            } else {
              await this._handleNewContext(contextToNavigate, {
                editable: false,
                recreateContext: false,
                forceFocus: true
              });
            }
          }
        }
      } catch (oError) {
        this.getMessageHandler().resetHoldKeys();
        await this.getMessageHandler().showMessageDialog({
          unHoldKey: messageHandlingKey
        });
        if (!(oError && oError.canceled) && oError !== RecommendationDialogDecision.Continue) {
          Log.error("Error while saving the document", oError);
        }
        throw oError;
      }
    }

    /**
     * Switches the UI between draft and active document.
     * @param oContext The context to switch from
     * @returns Promise resolved once the switch is done
     */;
    _proto.toggleDraftActive = async function toggleDraftActive(oContext) {
      const oContextData = oContext.getObject();
      let editable;
      const bIsDraft = oContext && this.getProgrammingModel(oContext) === ProgrammingModel.Draft;

      //toggle between draft and active document is only available for edit drafts and active documents with draft)
      if (!bIsDraft || !(!oContextData.IsActiveEntity && oContextData.HasActiveEntity || oContextData.IsActiveEntity && oContextData.HasDraftEntity)) {
        return;
      }
      if (!oContextData.IsActiveEntity && oContextData.HasActiveEntity) {
        //start Point: edit draft
        editable = false;
      } else {
        // start point active document
        editable = true;
      }
      try {
        const oRootViewController = this._getRootViewController();
        const oRightmostContext = oRootViewController.isFclEnabled() ? oRootViewController.getRightmostContext() : oContext;
        let siblingInfo = await this._computeSiblingInformation(oContext, oRightmostContext, ProgrammingModel.Draft, false);
        if (!siblingInfo && oContext !== oRightmostContext) {
          // Try to compute sibling info for the root context if it fails for the rightmost context
          // --> In case of FCL, if we try to switch between draft and active but a child entity has no sibling, the switch will close the child column
          siblingInfo = await this._computeSiblingInformation(oContext, oContext, ProgrammingModel.Draft, false);
        }
        if (siblingInfo) {
          if (oRootViewController.isFclEnabled()) {
            const lastSemanticMapping = this._getSemanticMapping();
            if (lastSemanticMapping?.technicalPath === oContext.getPath()) {
              const targetPath = siblingInfo.pathMapping[siblingInfo.pathMapping.length - 1].newPath;
              siblingInfo.pathMapping.push({
                oldPath: lastSemanticMapping.semanticPath,
                newPath: targetPath
              });
            }
          }
          this._updatePathsInHistory(siblingInfo.pathMapping);
          await this._handleNewContext(siblingInfo.targetContext, {
            editable,
            recreateContext: true,
            forceFocus: true
          });
        } else {
          throw new Error("Error in EditFlow.toggleDraftActive - Cannot find sibling");
        }
      } catch (oError) {
        throw new Error(`Error in EditFlow.toggleDraftActive:${oError}`);
      }
    };
    _proto.getSiblingContextData = function getSiblingContextData() {
      return this.siblingContextData;
    }

    /**
     * Stores the sibling context data for the given context if it is a draft root and has a sibling. This is used to avoid an extra read when switching between draft and active.
     * @param context
     * @returns Promise resolved once done
     */;
    _proto.storeSiblingContextData = async function storeSiblingContextData(context) {
      if (context) {
        const contextPath = context.getPath() ?? "";
        if (this.isDraftRoot(context) && contextPath.includes("IsActiveEntity=false")) {
          this.siblingContextData = await this.getTransactionHelper().getSiblingContextData(context);
          return;
        }
        this.siblingContextData = undefined;
      }
    }

    // Internal only params ---
    // @param {sap.m.Button} mParameters.cancelButton - Currently this is passed as cancelButton internally (replaced by mParameters.control in the JSDoc below). Currently it is also mandatory.
    // Plan - This should not be mandatory. If not provided, we should have a default that can act as reference control for the discard popover OR we can show a dialog instead of a popover.

    /**
     * Discard the editable document.
     * @param oContext  Context of the editable document
     * @param mParameters Can contain the following attributes:
     * @param mParameters.control This is the control used to open the discard popover
     * @param mParameters.cancelButton PRIVATE
     * @param mParameters.skipDiscardPopover Optional, supresses the discard popover and allows custom handling
     * @param mParameters.skipBackNavigation
     * @param mParameters.skipBindingToView
     * @returns Promise resolves once editable document has been discarded
     * @public
     * @since 1.90.0
     */;
    _proto.cancelDocument = async function cancelDocument(oContext, mParameters) {
      const transactionHelper = this.getTransactionHelper();
      let siblingInfo;
      let isNewDocument = false;
      mParameters.skipDiscardPopover = this._hiddenDraft?.enabled ? true : mParameters.skipDiscardPopover;
      const cancelParameters = {
        skipDiscardPopover: mParameters.skipDiscardPopover === true,
        cancelButton: mParameters.control || mParameters.cancelButton,
        beforeCancelCallBack: this.base.editFlow.onBeforeDiscard
      };
      try {
        await this.syncTask();
        let rootContext;
        const sProgrammingModel = this.getProgrammingModel(oContext);

        // Determine the root context based on hidden draft mode and programming model
        if (this._hiddenDraft && sProgrammingModel === "Draft") {
          const rootContextPath = ModelHelper.getDraftRootPath(oContext);
          rootContext = oContext.getPath() === rootContextPath ? oContext : await this.getRootContext(oContext);
        } else {
          rootContext = await this.getRootContext(oContext);
        }
        if ((sProgrammingModel === ProgrammingModel.Sticky || oContext.getProperty("HasActiveEntity")) && this._isFclEnabled() || this._hiddenDraft) {
          const oRootViewController = this._getRootViewController();

          // No need to try to get rightmost context in case of a new object
          siblingInfo = await this._computeSiblingInformation(rootContext, this._hiddenDraft ? oContext : oRootViewController.getRightmostContext(), sProgrammingModel, true);
        }

        // For hidden drafts, we need to check if it's a new document based on context properties
        // because setEditMode have been called during onAfterBinding, resetting createMode to false
        let isNewDocumentForCancel = this.getCreationMode();
        if (this._hiddenDraft && sProgrammingModel === ProgrammingModel.Draft) {
          isNewDocumentForCancel = await this._isContextNewDraft(rootContext);
        }
        const cancelResult = await transactionHelper.cancelDocument(rootContext, cancelParameters, this.getAppComponent(), this._getResourceModel(), this.getMessageHandler(), isNewDocumentForCancel, this.isDocumentModified() || sProgrammingModel === ProgrammingModel.Sticky,
        // In sticky mode we always ask for confirmation
        this.getSiblingContextData());
        this._getRootViewController().getInstancedViews().forEach(view => {
          const context = view.getBindingContext();
          if (context?.isKeepAlive() === true) {
            context.setKeepAlive(false);
          }
        });
        this._removeStickySessionInternalProperties(sProgrammingModel);
        if (this._hiddenDraft) {
          this.handleSessionOff();
        }
        this.setEditMode(EditMode.Display, false);
        this.setDocumentModified(false);
        this.setDraftStatus(DraftStatus.Clear);
        this.base.recommendations.resetRejectedRecommendations(oContext);
        await this.base.editFlow.onAfterDiscard({
          context: cancelResult.activeContext
        });
        // we force the edit state even for FCL because the draft discard might not be implemented
        // and we may just delete the draft
        EditState.setEditStateDirty();
        if (!cancelResult.activeContext) {
          this._sendActivity(Activity.Discard, oContext);
          this.base.collaborativeDraft.disconnect();
          //in case of a new document, no activeContext is returned --> navigate back.
          if (!mParameters.skipBackNavigation) {
            await this.getInternalRouting().navigateBackFromContext(rootContext);
            isNewDocument = true;
          }
        } else {
          const oActiveDocumentContext = cancelResult.activeContext;
          this._sendActivity(Activity.Discard, oActiveDocumentContext);
          this.base.collaborativeDraft.disconnect();
          let contextToNavigate = oActiveDocumentContext;
          siblingInfo = siblingInfo ?? this._createSiblingInfo(oContext, oActiveDocumentContext);
          this._updatePathsInHistory(siblingInfo.pathMapping);
          if ((this._isFclEnabled() || this._hiddenDraft?.stayOnCurrentPageAfterCancel) && siblingInfo.targetContext.getPath() !== oActiveDocumentContext.getPath()) {
            contextToNavigate = siblingInfo.targetContext;
          }
          if (sProgrammingModel === ProgrammingModel.Draft) {
            // We force the recreation of the context, so that it's created and bound in the same microtask,
            // so that all properties are loaded together by autoExpandSelect, so that when switching back to Edit mode
            // $$inheritExpandSelect takes all loaded properties into account (BCP 2070462265)
            if (!mParameters.skipBindingToView) {
              await this._handleNewContext(contextToNavigate, {
                editable: false,
                recreateContext: true,
                forceFocus: true,
                siblingPath: SemanticKeyHelper.getSemanticPath(cancelResult.activeContext, true, cancelResult.activeContextData)
              });
            } else {
              return oActiveDocumentContext;
            }
          } else {
            // Active context is returned in case of cancel of existing document, and it's the same as the edited context
            // So, we force the recreation as it may have been destroyed when calling setKeepAlive(false) on all view's contexts
            // earlier in this method
            await this._handleNewContext(contextToNavigate, {
              editable: false,
              recreateContext: true,
              forceFocus: true
            });
          }
        }
        if (sProgrammingModel === ProgrammingModel.Draft && !this._hiddenDraft) {
          //show Draft discarded message toast only for draft enabled apps
          this.showDocumentDiscardMessage(isNewDocument);
        }
      } catch (oError) {
        if (typeof oError === "string" && oError === FELibrary.Constants.CancelDiscardDraft) {
          return; // User cancelled the discard -> normal flow
        }
        Log.error("Error while discarding the document", oError);
      }
    };
    _proto.getRootContext = async function getRootContext(context, bindingParameters) {
      const viewData = this.getView().getViewData();
      const programmingModel = this.getProgrammingModel(context);
      if (viewData?.viewLevel > 1) {
        if (programmingModel === ProgrammingModel.Draft || programmingModel === ProgrammingModel.Sticky) {
          return await CommonUtils.createRootContext(programmingModel, this.getView(), this.getAppComponent(), bindingParameters, context);
        }
      }
      return context;
    };
    _proto.isRootContextNew = async function isRootContextNew(context) {
      const rootContext = await this.getRootContext(context, {
        $select: "HasActiveEntity,IsActiveEntity"
      });
      return this._isContextNewDraft(rootContext);
    }

    /**
     * Checks if the given context is a new draft (HasActiveEntity === false && IsActiveEntity === false).
     * @param context The context to check
     * @returns Promise resolving to true if new draft, false otherwise
     */;
    _proto._isContextNewDraft = async function _isContextNewDraft(context) {
      const draftProperties = await context?.requestProperty(["HasActiveEntity", "IsActiveEntity"]);
      if (draftProperties) {
        return !draftProperties[0] && !draftProperties[1];
      }
      return false;
    }

    /**
     * Brings up a message toast when a draft is discarded.
     * @param isNewDocument This is a Boolean flag that determines whether the document is new or already exists.
     */;
    _proto.showDocumentDiscardMessage = function showDocumentDiscardMessage(isNewDocument) {
      const resourceModel = this._getResourceModel();
      const message = resourceModel.getText("C_TRANSACTION_HELPER_DISCARD_DRAFT_TOAST");
      if (isNewDocument == true) {
        const appComponent = this.getAppComponent();
        appComponent.getRoutingService().attachAfterRouteMatched({}, this.showMessageWhenNoContext, this);
      } else {
        MessageToast.show(message);
      }
    }

    /**
     * We use this function in showDocumentDiscardMessage when no context is passed.
     */;
    _proto.showMessageWhenNoContext = function showMessageWhenNoContext() {
      const resourceModel = this._getResourceModel();
      const message = resourceModel.getText("C_TRANSACTION_HELPER_DISCARD_DRAFT_TOAST");
      const appComponent = this.getAppComponent();
      MessageToast.show(message, {
        closeOnBrowserNavigation: false
      });
      appComponent.getRoutingService().detachAfterRouteMatched(this.showMessageWhenNoContext, this);
    }

    /**
     * Checks if a context corresponds to a draft root.
     * @param context The context to check
     * @returns True if the context points to a draft root
     */;
    _proto.isDraftRoot = function isDraftRoot(context) {
      const metaModel = context.getModel().getMetaModel();
      const metaContext = metaModel.getMetaContext(context.getPath());
      return ModelHelper.isDraftRoot(getInvolvedDataModelObjects(metaContext).targetEntitySet);
    }

    // Internal only params ---
    // @param {string} mParameters.entitySetName Name of the EntitySet to which the object belongs

    /**
     * Deletes the document.
     * @param oContext  Context of the document
     * @param mInParameters Can contain the following attributes:
     * @param mInParameters.title Title of the object being deleted
     * @param mInParameters.description Description of the object being deleted
     * @param mInParameters.skipNavigation If true, prevents automatic navigation after the document is deleted.
     * @returns Promise resolves once document has been deleted
     * @public
     * @since 1.90.0
     */;
    _proto.deleteDocument = async function deleteDocument(oContext, mInParameters) {
      const oAppComponent = this.getAppComponent();
      const mParameters = {
          ...mInParameters,
          bFindActiveContexts: false,
          beforeDeleteCallBack: this.base.editFlow.onBeforeDelete
        },
        messageHandlingKey = this.getMessageHandler().registerToHoldMessages();
      try {
        if (this._isFclEnabled() && this.isDraftRoot(oContext) && oContext.getIndex() === undefined && oContext.getProperty("IsActiveEntity") === true && oContext.getProperty("HasDraftEntity") === true) {
          // Deleting an active entity which has a draft that could potentially be displayed in the ListReport (FCL case)
          // --> need to remove the draft from the LR and replace it with the active version, so that the ListBinding is properly refreshed
          // The condition 'oContext.getIndex() === undefined' makes sure the active version isn't already displayed in the LR
          mParameters.beforeDeleteCallBack = async parameters => {
            await this.base.editFlow.onBeforeDelete(parameters);
            try {
              const model = oContext.getModel();
              const siblingContext = model.bindContext(`${oContext.getPath()}/SiblingEntity`).getBoundContext();
              const draftPath = await siblingContext.requestCanonicalPath();
              const draftContextToRemove = model.getKeepAliveContext(draftPath);
              draftContextToRemove.replaceWith(oContext);
            } catch (error) {
              Log.error("Error while replacing the draft instance in the LR ODLB", error);
            }
          };
        }
        const deleted = await this.deleteDocumentTransaction(oContext, mParameters);
        if (!deleted) {
          // The delete was canceled by the user
          return;
        }
        if (this.getProgrammingModel(oContext) === ProgrammingModel.Sticky) {
          this.setDocumentModified(true);
        }

        // Single objet deletion is triggered from an OP header button (not from a list)
        // --> Mark UI dirty and navigate back to dismiss the OP
        if (!this._isFclEnabled()) {
          EditState.setEditStateDirty();
        } else {
          const contextBinding = oContext.getBinding();
          if (contextBinding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
            if (contextBinding.isRoot()) {
              // Even in the FCL case, we need to refresh the listbinding in the LR (not OP) to update the counts in the tabs and quickfilters
              await this.getTransactionHelper().refreshListBinding(contextBinding, oAppComponent);
            } else if (mParameters.requestSideEffects !== false) {
              this.requestSideEffectsOnDelete(contextBinding, contextBinding.getContext());
            }
          }
        }
        this._sendActivity(Activity.Delete, oContext);

        // After delete is successfull, we need to detach the setBackNavigation Methods
        await oAppComponent?.getShellServices().setBackNavigation();
        const isRecommendationEnabled = this.base.recommendations.isRecommendationEnabled();
        // We clear recommendation data and contexts from internal model for the deleted contexts
        if (isRecommendationEnabled) {
          this.base.recommendations.ignoreRecommendationForContexts([oContext]);
        }
        this.base.recommendations.resetRejectedRecommendations(oContext);
        // Notify consumers of which contexts were deleted
        await this.base.editFlow.onAfterDelete({
          contexts: [oContext]
        });
        if (!this._isFclEnabled() && mParameters.skipNavigation !== true) {
          if (oAppComponent?.getStartupMode() === StartupMode.Deeplink) {
            // In case the app has been launched with semantic keys, deleting the object we've landed on shall navigate back
            // to the app we came from (except for FCL, where we navigate to LR as usual)
            oAppComponent.getRouterProxy().exitFromApp();
          } else {
            // Else navigate back from the page. In FCL, this is done when the kept-alive context is destroyed (callback)
            this.getInternalRouting().navigateBackFromContext(oContext);
          }
        }
      } catch (error) {
        Log.error("Error while deleting the document", error);
      } finally {
        this.getMessageHandler().showMessages({
          unHoldKey: messageHandlingKey
        });
      }
    }

    /**
     * Submit the current set of changes and navigate back.
     * @param oContext  Context of the document
     * @returns Promise resolves once the changes have been saved
     * @public
     * @since 1.90.0
     */;
    _proto.applyDocument = async function applyDocument(oContext) {
      const oLockObject = this.getGlobalUIModel();
      const messageHandlingKey = this.getMessageHandler().registerToHoldMessages();
      try {
        await this.syncTask();
        if (oContext.getModel().hasPendingChanges("$auto")) {
          BusyLocker.lock(oLockObject);
          await this._submitOpenChanges(oContext);
          //we need to request for recommendations and then bring the dialog here
        }
        const isContinue = await this.showConfirmRecommendationsDialog(false);
        if (isContinue === RecommendationDialogDecision.Continue) {
          return;
        }
        await this._checkForValidationErrors();
        await this.getMessageHandler().showMessageDialog({
          unHoldKey: messageHandlingKey
        });
        await this.getInternalRouting().navigateBackFromContext(oContext, {
          callExtension: true
        });
      } finally {
        if (BusyLocker.isLocked(oLockObject)) {
          BusyLocker.unlock(oLockObject);
        }
      }
    }

    // Internal only params ---
    // @param {boolean} [mParameters.bStaticAction] Boolean value for static action, undefined for other actions
    // @param {boolean} [mParameters.isNavigable] Boolean value indicating whether navigation is required after the action has been executed
    // Currently the parameter isNavigable is used internally and should be changed to requiresNavigation as it is a more apt name for this param

    /**
     * Invokes an action (bound or unbound) and tracks the changes so that other pages can be refreshed and show the updated data upon navigation.
     * @param sActionName The name of the action to be called
     * @param mInParameters Contains the following attributes:
     * @param mInParameters.parameterValues An optional array of objects representing the action parameters, where each object has a name of string type and a value that can be of any data type.
     * @param mInParameters.skipParameterDialog Skips the action parameter dialog if values are provided for all of them in parameterValues
     * @param mInParameters.contexts For a bound action, a context or an array with contexts for which the action is to be called must be provided
     * @param mInParameters.model For an unbound action, an instance of an OData V4 model must be provided
     * @param mInParameters.requiresNavigation Boolean value indicating whether navigation is required after the action has been executed. Navigation takes place to the context returned by the action
     * @param mInParameters.label A human-readable label for the action. This is needed in case the action has a parameter and a parameter dialog is shown to the user. The label will be used for the title of the dialog and for the confirmation button
     * @param mInParameters.invocationGrouping Mode how actions are to be called: 'ChangeSet' to put all action calls into one changeset, 'Isolated' to put them into separate changesets
     * @param mInParameters.disableStrictHandling Disables strict handling of action calls to turn off 412 confirmation popups
     * @param mInParameters.isNavigable PRIVATE
     * @param mInParameters.entitySetName PRIVATE
     * @param mInParameters.operationAvailableMap PRIVATE
     * @param mInParameters.controlId PRIVATE
     * @param mInParameters.bStaticAction PRIVATE
     * @param mInParameters.applicableContexts PRIVATE
     * @param mInParameters.notApplicableContexts PRIVATE
     * @param mInParameters.enableAutoScroll PRIVATE
     * @param mInParameters.defaultValuesExtensionFunction PRIVATE
     * @param mExtraParams PRIVATE
     * @returns A promise which resolves once the action has been executed. If resolved, the promise returns
     * <ul>
     *      <li>If the parameter contexts is an array: an array of objects, each object containing a key "status", as well as "value" referencing the action status and the context</li>
     * 		<li>If the parameter contexts is not an array: a single context</li>
     * </ul>
     * The context(s) provided in the promise is (are) either the return value context of the action or the bound context if the return value is undefined.
     * @public
     * @since 1.90.0
     * @final
     */;
    _proto.invokeAction = async function invokeAction(sActionName, mInParameters, mExtraParams) {
      const transactionHelper = this.getTransactionHelper();
      let aParts;
      let sOverloadEntityType;
      let oCurrentActionCallBacks;
      const oView = this.base.getView();

      // Due to a mistake the invokeAction in the extensionAPI had a different API than this one.
      // The one from the extensionAPI doesn't exist anymore as we expose the full edit flow now but
      // due to compatibility reasons we still need to support the old signature
      if (mInParameters?.isA && mInParameters?.isA("sap.ui.model.odata.v4.Context") || Array.isArray(mInParameters) || mExtraParams !== undefined) {
        const contexts = mInParameters;
        mInParameters = mExtraParams || {};
        if (contexts) {
          mInParameters.contexts = contexts;
        } else {
          mInParameters.model = this.base.getView().getModel();
        }
      }
      const mParameters = {
        ...mInParameters,
        view: this.base.getView()
      };
      mParameters.isNavigable = mParameters.requiresNavigation || mParameters.isNavigable;

      // Determine if the referenced action is bound or unbound
      const convertedMetadata = convertTypes(this.getView().getModel()?.getMetaModel());
      // The EntityContainer may NOT be missing, so it should not be able to be undefined, but since in our converted Metadata
      // it can be undefined, I need this workaround here of adding "" since indexOf does not accept something that's
      // undefined.
      if (sActionName.includes("" + convertedMetadata.entityContainer.name)) {
        // Unbound actions are always referenced via the action import and we found the EntityContainer in the sActionName so
        // an unbound action is referenced!
        mParameters.isBound = false;
      } else {
        // No entity container in the sActionName, so either a bound or static action is referenced which is also bound!
        mParameters.isBound = true;
      }
      if (!mParameters.entitySetName && mParameters.contexts && mParameters.model) {
        mParameters.entitySetName = mParameters.model.getMetaModel().getMetaContext((Array.isArray(mParameters.contexts) ? mParameters.contexts[0] : mParameters.contexts).getPath()).getObject("@sapui.name");
      }
      let oControl;
      if (mParameters.controlId) {
        oControl = this.getView().byId(mParameters.controlId);
        if (oControl) {
          // TODO: currently this selected contexts update is done within the operation, should be moved out
          mParameters.internalModelContext = oControl.getBindingContext("internal");
        }
      } else {
        mParameters.internalModelContext = oView.getBindingContext("internal");
      }

      // if sticky session is enabled we trigger actions without eTag
      mParameters.ignoreETag = mParameters.internalModelContext?.getProperty("/sessionOn");
      if (sActionName && sActionName.includes("(")) {
        // get entity type of action overload and remove it from the action path
        // Example sActionName = "<ActionName>(Collection(<OverloadEntityType>))"
        // sActionName = aParts[0] --> <ActionName>
        // sOverloadEntityType = aParts[2] --> <OverloadEntityType>
        aParts = sActionName.split("(");
        sActionName = aParts[0];
        sOverloadEntityType = aParts[aParts.length - 1].replaceAll(")", "");
      }
      if (mParameters.bStaticAction && oControl) {
        if (oControl.isA("sap.ui.mdc.Table")) {
          const tableAPI = oControl.getParent();
          mParameters.contexts = tableAPI.getRowBinding().getHeaderContext();
        }
        if (sOverloadEntityType && oControl.getBindingContext() && oControl.isA && oControl.isA("sap.ui.mdc.Table")) {
          mParameters.contexts = this._getActionOverloadContextFromMetadataPath(oControl.getBindingContext(), oControl.getRowBinding(), sOverloadEntityType);
        }
        if (mParameters.enableAutoScroll) {
          oCurrentActionCallBacks = this.createActionPromise(sActionName, oControl.getId());
        }
      }
      try {
        await this.syncTask();
        //Execute the registered deferred SideEffects before the POST of the action
        if (!Array.isArray(mParameters.contexts) && mParameters.contexts?.getBinding().isA("sap.ui.model.odata.v4.ODataContextBinding")) {
          await this.base.sideEffects.handlePageChangeContext(mParameters.contexts);
        }
        await this.base.editFlow.onBeforeExecuteAction({
          contexts: mParameters.contexts
        });
        // Pass disableStrictHandling from invokeAction parameters to callAction
        if (mInParameters?.disableStrictHandling !== undefined) {
          mParameters.disableStrictHandling = mInParameters.disableStrictHandling;
        }
        const callAction = transactionHelper.callAction(sActionName, mParameters, this.getAppComponent(), this.getMessageHandler());
        this.syncTask(callAction);
        const response = await callAction;
        const successFullExecution = response.filter(isFulfilled);
        if (response.length !== successFullExecution.length) {
          // Keep the same workflow than before
          // If at least one promise is rejected, we reject the whole promise
          throw response;
        }
        let listRefreshed;
        if (mParameters.contexts && Array.isArray(mParameters.contexts) && mParameters.isBound === true) {
          listRefreshed = await this._refreshListIfRequired(this.getActionResponseDataAndKeys(sActionName, successFullExecution), mParameters.contexts[0]);
        }
        if (this.base.collaborativeDraft.isConnected()) {
          this._sendActivity(Activity.Action, mParameters.contexts, sActionName, listRefreshed, Object.keys(successFullExecution[0].value.boundContext.getObject()));
        }
        this._triggerConfiguredSurvey(sActionName, TriggerType.action);
        if (oCurrentActionCallBacks) {
          oCurrentActionCallBacks.fResolver(successFullExecution);
        }
        /*
        		We set the (upper) pages to dirty after an execution of an action
        		TODO: get rid of this workaround
        		This workaround is only needed as long as the model does not support the synchronization.
        		Once this is supported we don't need to set the pages to dirty anymore as the context itself
        		is already refreshed (it's just not reflected in the object page)
        		we explicitly don't call this method from the list report but only call it from the object page
        		as if it is called in the list report it's not needed - as we anyway will remove this logic
        		we can live with this
        		we need a context to set the upper pages to dirty - if there are more than one we use the
        		first one as they are anyway siblings
        		*/
        if (mParameters.contexts) {
          if (this.base.getView().getViewData().converterType !== "ListReport") {
            EditState.setEditStateDirty();
          }
          this.getInternalModel().setProperty("/lastInvokedAction", sActionName);
        }
        if (mParameters.isNavigable) {
          if (successFullExecution.length === 1) {
            const context = this._getBoundContext(oView, mParameters) ? successFullExecution[0].value.boundContext : successFullExecution[0].value.returnedContext ?? successFullExecution[0].value.boundContext;
            const oMetaModel = oView.getModel().getMetaModel();
            const sContextMetaPath = oMetaModel.getMetaPath(context.getPath());
            const _fnValidContexts = (contexts, applicableContexts) => {
              return contexts.filter(element => {
                if (applicableContexts) {
                  return applicableContexts.includes(element);
                }
                return true;
              });
            };
            const oActionContext = Array.isArray(mParameters.contexts) ? _fnValidContexts(mParameters.contexts, mParameters.applicableContexts)[0] : mParameters.contexts;
            const sActionContextMetaPath = oActionContext && oMetaModel.getMetaPath(oActionContext.getPath());
            if (sContextMetaPath != undefined && sContextMetaPath === sActionContextMetaPath) {
              if (oActionContext?.getPath() !== context.getPath()) {
                this.getInternalRouting().navigateForwardToContext(context, {
                  checkNoHashChange: true
                });

                // If the action returns a draft context, we already take care during navigation to either create a new
                // (full screen) or to use the list binding context after refresh (and not the return value context).
                // If the draft is discarded or activated, having the context still as dependent context cause issues
                // (e.g. if a side effect is triggered). Therefore, we destroy the return value context here,
                // and to be compatible we return a new context with the same path.
                if (this.getProgrammingModel(context) === ProgrammingModel.Draft && (context.getProperty("IsActiveEntity") === false || this._isFclEnabled())) {
                  context.getBinding().destroy();
                }
              } else {
                Log.info("Navigation to the same context is not allowed");
              }
            }
          }
        }
        this.base.editFlow.onAfterActionExecution(sActionName);

        // Keep this weird returned value for compatibility reasons
        // invokeAction is public and we can't change the returned value for the action
        if (!Array.isArray(mInParameters?.contexts) && successFullExecution.length === 1) {
          return successFullExecution[0].value.returnedContext ?? successFullExecution[0].value.boundContext;
        }
        return successFullExecution.map(oResult => {
          return {
            ...oResult,
            ...{
              value: oResult.value.returnedContext ?? oResult.value.boundContext
            }
          };
        });
      } catch (err) {
        if (oCurrentActionCallBacks) {
          oCurrentActionCallBacks.fRejector();
        }
        if (err === Constants.CancelActionDialog) {
          throw new Error("Dialog cancelled");
        }
        throw err;
      }
    }

    /**
     * Hook which can be overridden after the action execution.
     * @param _actionName Name of the action
     * @since 1.114.0
     */;
    _proto.onAfterActionExecution = async function onAfterActionExecution(_actionName) {
      //to be overridden
    }

    /**
     * This function can be used to execute code on the mass edit save.
     * You can execute custom coding in this function.
     * If you decide to do your own save processing, you can return `true` to prevent the default save behavior.
     *
     * This function is meant to be individually overridden by consuming controllers but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.Instead}.
     * @param _mParameters Object containing the parameters passed to customMassEditSave
     * @param _mParameters.aContexts Array containing the selected contexts for the mass edit
     * @param _mParameters.oUpdateData A dictionary containing the propertyPath and its value
     * @returns `true` to prevent the default execution, `false` to keep the standard behavior
     * @public
     * @since 1.130.0
     */;
    _proto.customMassEditSave = async function customMassEditSave(_mParameters) {
      // to be overridden
      return Promise.resolve(false);
    }

    /**
     * Secured execution of the given function. Ensures that the function is only executed when certain conditions are fulfilled.
     * @param fnFunction The function to be executed. Should return a promise that is settled after completion of the execution. If nothing is returned, immediate completion is assumed.
     * @param mParameters Definitions of the preconditions to be checked before execution
     * @param mParameters.busy Defines the busy indicator
     * @param mParameters.busy.set Triggers a busy indicator when the function is executed.
     * @param mParameters.busy.check Executes function only if application isn't busy.
     * @param mParameters.updatesDocument This operation updates the current document without using the bound model and context. As a result, the draft status is updated if a draft document exists, and the user has to confirm the cancellation of the editing process.
     * @returns A promise that is rejected if the execution is prohibited and resolved by the promise returned by the fnFunction.
     * @public
     * @since 1.90.0
     */;
    _proto.securedExecution = async function securedExecution(fnFunction, mParameters) {
      const bBusySet = mParameters?.busy?.set ?? true,
        bBusyCheck = mParameters?.busy?.check ?? true,
        bUpdatesDocument = mParameters?.updatesDocument ?? false,
        oLockObject = this.getGlobalUIModel(),
        oContext = this.getView().getBindingContext(),
        bIsDraft = oContext && this.getProgrammingModel(oContext) === ProgrammingModel.Draft,
        messageHandlingKey = this.getMessageHandler().registerToHoldMessages();
      if (bBusyCheck && BusyLocker.isLocked(oLockObject)) {
        return Promise.reject("Application already busy therefore execution rejected");
      }

      // we have to set busy and draft indicator immediately also the function might be executed later in queue
      if (bBusySet) {
        BusyLocker.lock(oLockObject);
      }
      if (bUpdatesDocument && bIsDraft) {
        this.setDraftStatus(DraftStatus.Saving);
      }
      this.getMessageHandler().removeTransitionMessages();
      return this.syncTask(fnFunction).then(() => {
        if (bUpdatesDocument) {
          this.setDocumentModified(true);
          if (!this._isFclEnabled()) {
            EditState.setEditStateDirty();
          }
          if (bIsDraft) {
            this.setDraftStatus(DraftStatus.Saved);
          }
        }
        return;
      }).catch(oError => {
        if (bUpdatesDocument && bIsDraft) {
          this.setDraftStatus(DraftStatus.Clear);
        }
        throw oError;
      }).finally(() => {
        if (bBusySet) {
          BusyLocker.unlock(oLockObject);
        }
        this.getMessageHandler().showMessageDialog({
          unHoldKey: messageHandlingKey
        });
      });
    }

    /**
     * Handles the patchSent event: register document modification.
     * @param oEvent The event sent by the binding
     */;
    _proto.handlePatchSent = function handlePatchSent(oEvent) {
      // In collaborative draft or sticky session, disable ETag check for PATCH requests
      const internalContext = this.getView()?.getBindingContext("internal");
      const uiContext = this.getView()?.getBindingContext("ui");
      const ignoreETag = this.base.collaborativeDraft.isConnected() || internalContext.getProperty("/sessionOn");
      if (ignoreETag) {
        oEvent.getSource().getModel().setIgnoreETag(true);
      }
      if (uiContext?.getProperty("isEditable") === false) {
        // the view is not in edit mode this must be inline edit
        this.base.inlineEditFlow.handleInlineEditPatchSent(oEvent);
      } else if (!internalContext?.getProperty("skipPatchHandlers")) {
        const sourceBinding = oEvent.getSource(); // FIXME: UI5 type says this should be an ODataContextBinding
        // Create a promise that will be resolved or rejected when the path is completed
        const oPatchPromise = new Promise((resolve, reject) => {
          oEvent.getSource().attachEventOnce("patchCompleted", patchCompletedEvent => {
            // Re-enable ETag checks
            if (ignoreETag) {
              oEvent.getSource().getModel().setIgnoreETag(false);
            }
            if (oEvent.getSource().isA("sap.ui.model.odata.v4.ODataListBinding")) {
              ActionRuntime.setActionEnablementAfterPatch(this.getView(), sourceBinding, this.getView()?.getBindingContext("internal"));
            }
            const bSuccess = patchCompletedEvent.getParameter("success");
            if (bSuccess) {
              resolve();
            } else {
              reject();
            }
          });
        });
        this.updateDocument(sourceBinding, oPatchPromise);
      }
    }

    /**
     * Handles the createSent event: register document modification.
     * @param event The event sent by the binding
     */;
    _proto.handleCreateSent = function handleCreateSent(event) {
      const context = event.getParameter("context");
      this.getMessageHandler().removeTransitionMessages(false, false, context.getPath());
    }

    /**
     * Performs a task in sync with other tasks created via this function.
     * Returns the promise chain of the task.
     * @param [newTask] Optional, a promise or function to be executed synchronously
     * @returns Promise resolves once the task is completed
     */;
    _proto.syncTask = async function syncTask(newTask) {
      if (newTask) {
        if (typeof newTask === "function") {
          this.syncTasks = this.syncTasks.then(newTask).catch(function (err) {
            Log.debug(err);
          });
        } else {
          this.syncTasks = this.syncTasks.then(async () => newTask).catch(function (err) {
            Log.debug(err);
          });
        }
      }
      return this.syncTasks;
    }

    /**
     * Updates the UI and internal models according to the edit mode.
     * @param oContext The context to be displayed or edited
     * @returns {Promise} Promise resolves once the edit mode is computed
     */;
    _proto.computeModelsForEditMode = async function computeModelsForEditMode(context) {
      const programmingModel = this.getProgrammingModel(context);
      if (programmingModel === ProgrammingModel.Draft) {
        try {
          this.setDraftStatus(DraftStatus.Clear);
          const globalModel = this.getGlobalUIModel();
          globalModel.setProperty("/isEditablePending", true, undefined, true);
          const model = this.getView().getModel();
          const isCollaborationDraftSupported = ModelHelper.isCollaborationDraftSupported(model.getMetaModel());
          let forceDisplayMode = false;
          const isActiveEntity = await context.requestObject("IsActiveEntity");
          if (isCollaborationDraftSupported) {
            forceDisplayMode = !(await this.base.collaborativeDraft.activateCollaboration(context, isActiveEntity));
          } else {
            globalModel.setProperty("/hasCollaborationAuthorization", undefined);
          }
          this.fetchCollaborativeDraftUsersPromise = undefined;
          if (isActiveEntity === false && !forceDisplayMode) {
            // in case the document is draft, set it in edit mode
            // unless we don't have the authorization for a collaborative user
            this.setEditMode(EditMode.Editable);
            const hasActiveEntity = await context.requestObject("HasActiveEntity");
            this.setEditMode(undefined, !hasActiveEntity);
            if (this._hiddenDraft) {
              this.handleHiddenDraftEdit(context);
            }
            // Handle resume action when navigating to draft document
            const internalModelContext = this.getView()?.getBindingContext("internal");
            const navigationParameters = internalModelContext?.getProperty("navigationParameters");
            if (navigationParameters?.reason !== NavigationReason.EditFlowAction && hasActiveEntity === true) {
              this.handleDraftResumeAction(context);
            }
          } else {
            // active document, stay on display mode
            this.setEditMode(EditMode.Display, false);
          }
          globalModel.setProperty("/isEditablePending", false, undefined, true);
        } catch (error) {
          Log.error("Error while determining the editMode for draft", error);
        }
      } else if (programmingModel === ProgrammingModel.Sticky) {
        const lastInvokedActionName = this.getInternalModel().getProperty("/lastInvokedAction");
        if (lastInvokedActionName && this.isNewActionForSticky(lastInvokedActionName, context)) {
          this.setEditMode(EditMode.Editable, true);
          if (!this.getAppComponent()._isFclEnabled()) {
            EditState.setEditStateDirty();
          }
          this.handleStickyOn(context);
          this._setStickySessionInternalProperties(this.getProgrammingModel(context), context.getModel());
          this.getInternalModel().setProperty("/lastInvokedAction", undefined);
        }
      }
    }

    //////////////////////////////////////
    // Private methods
    //////////////////////////////////////

    /**
     * Internal method to delete a context or an array of contexts.
     * @param contexts The context(s) to be deleted
     * @param parameters Parameters for deletion
     * @param parameters.hideBusyIndicator True to hide the busy indicator during deletion
     * @param parameters.beforeDeleteCallBack A function to be called before deletion
     * @param parameters.requestSideEffects True to request side effects after deletion
     * @param parameters.controlId The ID of the control initiating the deletion
     * @param parameters.parentControl The control initiating the deletion
     * @param parameters.bFindActiveContexts True to find active contexts in case of draft
     * @param parameters.selectedContexts The selected contexts for deletion
     * @param parameters.internalModelContext The internal model context of the control initiating the deletion
     * @param parameters.noDialog True to skip the confirmation dialog
     * @param parameters.title 	The title for the deletion confirmation dialog
     * @param parameters.description The description for the deletion confirmation dialog
     * @param parameters.numberOfSelectedContexts The number of selected contexts for deletion
     * @param parameters.unSavedContexts The unsaved contexts among the selected contexts
     * @param parameters.lockedContexts The locked contexts among the selected contexts
     * @param parameters.draftsWithDeletableActive The drafts with deletable active contexts
     * @param parameters.draftsWithNonDeletableActive The drafts with non-deletable active contexts
     * @returns Promise resolves once the deletion is completed
     */;
    _proto.deleteDocumentTransaction = async function deleteDocumentTransaction(contexts, parameters) {
      if (parameters.selectedContexts) {
        // as selected contexts may include inactive context we need to compute this parameter again to ensure delete helper works properly
        parameters.numberOfSelectedContexts = parameters.selectedContexts.length;
      }
      const resourceModel = this._getResourceModel();
      const transactionHelper = this.getTransactionHelper();

      // TODO: this setting and removing of contexts shouldn't be in the transaction helper at all
      // for the time being I kept it and provide the internal model context to not break something
      if (parameters.controlId) {
        const sourceControl = Element.getElementById(parameters.controlId);
        if (sourceControl && !sourceControl.isA("sap.ui.mdc.MultiValueField")) {
          // In case the delete is triggered from a MultiValueField, we don't use the internal model context as the MVF doesn't have
          // such a context of its own, and we don't want to use its parent context (e.g. from the embedding Table)
          parameters.internalModelContext = sourceControl.getBindingContext("internal");
        }
      }
      if (!parameters.syncTaskDone) {
        await this.syncTask();
      }
      const deleteDocument = await transactionHelper.deleteDocument(contexts, parameters, this.getAppComponent(), resourceModel, this.getMessageHandler());
      // In FCL, when the root draft is deleted, we switch off the guards.
      if (this._isFclEnabled() && this._hiddenDraft && this.base.getView().getViewData().viewLevel === 0) {
        const fclController = this._getRootViewController();
        const contextPath = fclController?.getLeftMostViewContextPath();
        // Check if contextPath exists in the contexts being deleted
        if (contextPath) {
          const contextsArray = Array.isArray(contexts) ? contexts : [contexts];
          const isOPContextBeingDeleted = contextsArray.some(context => context.getPath() === contextPath);
          if (isOPContextBeingDeleted) {
            this.handleSessionOff();
          }
        } else {
          this.handleSessionOff();
        }
      }
      return deleteDocument;
    };
    _proto._getResourceModel = function _getResourceModel() {
      return getResourceModel(this.getView());
    };
    _proto.getTransactionHelper = function getTransactionHelper() {
      return TransactionHelper;
    };
    _proto.getMessageHandler = function getMessageHandler() {
      if (this.base.messageHandler) {
        return this.base.messageHandler;
      } else {
        throw new Error("Edit Flow works only with a given message handler");
      }
    };
    _proto.getInternalModel = function getInternalModel() {
      return this.getView().getModel("internal");
    };
    _proto.getGlobalUIModel = function getGlobalUIModel() {
      return this.getView().getModel("ui");
    };
    _proto.getPageInternalModel = function getPageInternalModel() {
      return this.getView().getModel("pageInternal");
    }

    /**
     * Sets that the current page contains a newly created object.
     * @param bCreationMode True if the object is new
     */;
    _proto.setCreationMode = function setCreationMode(bCreationMode) {
      const pageInternalContext = this.getView().getBindingContext("pageInternal");
      this.getPageInternalModel().setProperty(UiModelConstants.CreateMode, bCreationMode, pageInternalContext, true);
    }

    /**
     * Indicates whether the current page contains a newly created object or not.
     * @returns True if the object is new
     */;
    _proto.getCreationMode = function getCreationMode() {
      const pageInternalContext = this.getView().getBindingContext("pageInternal");
      return !!pageInternalContext.getProperty(UiModelConstants.CreateMode);
    }

    /**
     * Indicates whether the object being edited (or one of its sub-objects) has been modified or not.
     * @returns True if the object has been modified
     */;
    _proto.isDocumentModified = function isDocumentModified() {
      return !!this.getGlobalUIModel().getProperty(UiModelConstants.DocumentModified);
    }

    /**
     * Sets that the object being edited (or one of its sub-objects) has been modified.
     * @param modified True if the object has been modified
     */;
    _proto.setDocumentModified = function setDocumentModified(modified) {
      this.getGlobalUIModel().setProperty(UiModelConstants.DocumentModified, modified);
    }

    /**
     * Sets that the object being edited has been modified by creating a sub-object.
     * @param listBinding The list binding on which the object has been created
     */;
    _proto.setDocumentModifiedOnCreate = function setDocumentModifiedOnCreate(listBinding) {
      // Set the modified flag only on relative listBindings, i.e. when creating a sub-object
      // If the listBinding is not relative, then it's a creation from the ListReport, and by default a newly created root object isn't considered as modified
      if (listBinding.isRelative()) {
        this.setDocumentModified(true);
      }
    }

    /**
     * Handles the create event: shows messages and in case of a draft, updates the draft indicator.
     * @param binding OData list binding object
     */;
    _proto.handleCreateEvents = function handleCreateEvents(binding) {
      this.setDraftStatus(DraftStatus.Clear);
      const programmingModel = this.getProgrammingModel(binding);
      // We store key sets (context + key) as the creation interaction might involve multiple creations.
      const messageHandlingKeySets = [];
      binding.attachEvent("createSent", eventInstance => {
        if (programmingModel === ProgrammingModel.Draft) {
          this.setDraftStatus(DraftStatus.Saving);
        }
        const context = eventInstance.getParameter("context");
        let messageHandlingKey = messageHandlingKeySets.find(info => info.context === context)?.messageHandlingKey;
        if (!messageHandlingKey) {
          messageHandlingKey = this.getMessageHandler().registerToHoldMessages();
          messageHandlingKeySets.push({
            context,
            messageHandlingKey
          });
        }
      });
      binding.attachEvent("createCompleted", oEvent => {
        const success = oEvent.getParameter("success"),
          context = oEvent.getParameter("context");
        if (programmingModel === ProgrammingModel.Draft) {
          this.setDraftStatus(success ? DraftStatus.Saved : DraftStatus.Clear);
        }
        const messageHandlingKey = messageHandlingKeySets.find(info => info.context === context)?.messageHandlingKey;
        if (messageHandlingKey) {
          this.getMessageHandler().showMessageDialog({
            unHoldKey: messageHandlingKey
          });
        }
      });
    }

    /**
     * Updates the draft status message (displayed at the bottom of the page).
     * @param draftStatus The draft status message
     */;
    _proto.setDraftStatus = function setDraftStatus(draftStatus) {
      this.getView().getModel("ui").setProperty("/draftStatus", draftStatus, undefined, true);
    }

    /**
     * Gets the programming model from a binding or a context.
     * @param source The binding or context
     * @returns The programming model
     */;
    _proto.getProgrammingModel = function getProgrammingModel(source) {
      return this.getTransactionHelper().getProgrammingModel(source);
    }

    /**
     * Sets the edit mode.
     * @param editMode The edit mode
     * @param isCreation True if the object has been newly created
     */;
    _proto.setEditMode = function setEditMode(editMode, isCreation) {
      // at this point of time it's not meant to release the edit flow for freestyle usage therefore we can
      // rely on the global UI model to exist
      const globalModel = this.getGlobalUIModel();
      if (editMode) {
        globalModel.setProperty("/isEditable", editMode === "Editable", undefined, true);
        if (editMode !== "Editable") {
          this.forceDraftSaveOrDiscard(false);
        }
      }
      if (isCreation !== undefined) {
        // Since setCreationMode is public in EditFlow and can be overriden, make sure to call it via the controller
        // to ensure any overrides are taken into account
        this.setCreationMode(isCreation);
      }
    }

    /**
     * Sets the flag to force Save or Discard when leaving a draft.
     * @param forced
     */;
    _proto.forceDraftSaveOrDiscard = function forceDraftSaveOrDiscard(forced) {
      this.getGlobalUIModel().setProperty("/forceDraftSaveOrDiscard", forced, undefined, true);
    }

    /**
     * Checks if we should force the user to Save or Discard when leaving a draft, or if keeping the draft is allowed.
     * @returns True if keeping the draft is not allowed
     */;
    _proto.shallForceDraftSaveOrDiscard = function shallForceDraftSaveOrDiscard() {
      return this.getGlobalUIModel().getProperty("/forceDraftSaveOrDiscard") === true;
    }

    /**
     * Checks if an action corresponds to a create action for a sticky session.
     * @param actionName The name of the action
     * @param context Context for the sticky session
     * @returns True if the action is a create action
     */;
    _proto.isNewActionForSticky = function isNewActionForSticky(actionName, context) {
      try {
        const metaModel = context.getModel().getMetaModel();
        const metaContext = metaModel.getMetaContext(context.getPath());
        const entitySet = getInvolvedDataModelObjects(metaContext).startingEntitySet;
        const stickySession = entitySet.annotations.Session?.StickySessionSupported;
        if (stickySession?.NewAction === actionName) {
          return true;
        }
        if (stickySession?.AdditionalNewActions && stickySession?.AdditionalNewActions.includes(actionName)) {
          return true;
        }
        return false;
      } catch (error) {
        Log.info(error);
        return false;
      }
    }

    // TODO Move all sticky-related below to a sticky session manager class

    /**
     * Enables the sticky edit session.
     * @param context The context being edited
     * @returns True in case of success, false otherwise
     */;
    _proto.handleStickyOn = async function handleStickyOn(context) {
      const appComponent = this.getAppComponent();
      try {
        if (appComponent === undefined) {
          throw new Error("undefined AppComponent for function handleStickyOn");
        }
        if (!appComponent.getRouterProxy().hasNavigationGuard()) {
          await this.registerEditLifecycleCallbacks(context, appComponent);
        }
      } catch (error) {
        Log.info(error);
        return false;
      }
      return true;
    }

    /**
     * Registers edit lifecycle callbacks for draft/sticky handling.
     * @param context The context being edited
     * @param appComponent The application component
     * @param semanticPath Optional semantic path for navigation guard
     */;
    _proto.registerEditLifecycleCallbacks = async function registerEditLifecycleCallbacks(context, appComponent, semanticPath) {
      const hashTracker = appComponent.getRouterProxy().getHash();
      const internalModel = this.getInternalModel();

      // Set a guard in the RouterProxy
      // A timeout is necessary, as with deferred creation the hashChanger is not updated yet with
      // the new hash, and the guard cannot be found in the managed history of the router proxy
      setTimeout(function () {
        appComponent.getRouterProxy().setNavigationGuard(context.getPath().substring(1), semanticPath);
      }, 0);

      // Setting back navigation on shell service, to get the discard message box in case of sticky
      await appComponent.getShellServices().setBackNavigation(this.onBackNavigationInSession.bind(this, context));

      // Attach edit lifecycle callbacks
      const i18nModel = this.base.getView().getModel("sap.fe.i18n");
      appComponent.getRootViewController().registerEditLifecycleCallbacks(this.getDirtyStateProvider(appComponent, internalModel, hashTracker, context), this.getRouteMatchedFunction(context, appComponent), !this._hiddenDraft ? this.getSessionTimeoutFunction(context, i18nModel) : undefined, this.confirmGuardCross.bind(this, context));
    }

    /**
     * Enables hidden draft edit session handling.
     * Sets up the necessary session callbacks and navigation guards for hidden draft scenarios.
     * @param context The context being edited in the hidden draft session
     * @returns Promise resolving to true if session setup succeeds, false otherwise
     */;
    _proto.handleHiddenDraftEdit = async function handleHiddenDraftEdit(context) {
      const appComponent = this.getAppComponent();
      try {
        if (appComponent === undefined) {
          throw new Error("undefined AppComponent for function handleHiddenDraftEdit");
        }

        // Ensure we have the correct context for hidden draft handling
        let hiddenDraftContext;
        if (!this._isFclEnabled()) {
          hiddenDraftContext = context;
        } else {
          hiddenDraftContext = context?.getModel().getKeepAliveContext(context.getPath());
        }

        //Create can be handled from any context, but we need to create the guard only for the create in root Context.
        if (this.getCreationMode()) {
          const rootContextPath = ModelHelper.getDraftRootPath(hiddenDraftContext);
          hiddenDraftContext = hiddenDraftContext.getPath() === rootContextPath ? hiddenDraftContext : await this.getRootContext(hiddenDraftContext);
        }
        if (!appComponent.getRouterProxy().hasNavigationGuard()) {
          const semanticPath = SemanticKeyHelper.getSemanticPath(hiddenDraftContext, true)?.substring(1);
          await this.registerEditLifecycleCallbacks(hiddenDraftContext, appComponent, semanticPath);
        }
      } catch (error) {
        Log.info(error);
        return false;
      }
      return true;
    }

    /**
     * Disables the sticky edit session.
     * @returns True in case of success, false otherwise
     */;
    _proto.handleSessionOff = function handleSessionOff() {
      const appComponent = this.getAppComponent();
      try {
        if (appComponent === undefined) {
          throw new Error("undefined AppComponent for function handleStickyOff");
        }
        if (appComponent.getRouterProxy) {
          // If we have exited from the app, CommonUtils.getAppComponent doesn't return a
          // sap.fe.core.AppComponent, hence the 'if' above
          appComponent.getRouterProxy().discardNavigationGuard();
        }
        if (appComponent.getRootViewController) {
          // If we have exited from the app, CommonUtils.getAppComponent doesn't return a
          // sap.fe.core.AppComponent, hence the 'if' above
          appComponent.getRootViewController().unregisterEditLifecycleCallbacks();
        }
        this.setEditMode(EditMode.Display, false);
        if (appComponent.getShellServices) {
          // If we have exited from the app, CommonUtils.getAppComponent doesn't return a
          // sap.fe.core.AppComponent, hence the 'if' above
          appComponent.getShellServices().setBackNavigation();
        }
      } catch (error) {
        Log.info(error);
        return false;
      }
      return true;
    };
    _proto._setStickySessionInternalProperties = function _setStickySessionInternalProperties(programmingModel, model) {
      if (programmingModel === ProgrammingModel.Sticky) {
        const internalModel = this.getInternalModel();
        internalModel.setProperty("/sessionOn", true);
        internalModel.setProperty("/stickySessionToken", model.getHttpHeaders(true)["SAP-ContextId"]);
      }
    }

    /**
     * Returns a callback function to be used as a DirtyStateProvider in the Shell.
     * @param appComponent The app component
     * @param internalModel The model "internal"
     * @param hashTracker Hash tracker
     * @param context The context
     * @returns The callback function
     */;
    _proto.getDirtyStateProvider = function getDirtyStateProvider(appComponent, internalModel, hashTracker, context) {
      // In case the app is embedded in another one, the hash from the URL contains a part that is specific to the container app.
      // This part needs to be removed when comparing the current hash with the target hash in the dirty state provider, to ensure that the dirty state is correctly detected even when the app is embedded.
      const hashPrefix = appComponent.getRouterProxy().getFullHash().replace(hashTracker, "");
      return navigationContext => {
        try {
          if (navigationContext === undefined) {
            Log.info("Invalid input parameters for DirtyStateProvider function");
            return undefined;
          }
          let isObjectModified;
          if (this._hiddenDraft) {
            const draftAdminData = context.getObject("DraftAdministrativeData");
            isObjectModified = draftAdminData?.CreationDateTime !== draftAdminData?.LastChangeDateTime;
          }

          // Remove the hash-prefix if there's one, to compare only the relevant part of the hash for dirty state detection
          const targetHash = hashPrefix ? navigationContext.innerAppRoute.replace(hashPrefix, "") : navigationContext.innerAppRoute;
          const routerProxy = appComponent.getRouterProxy();
          let lclHashTracker = "";
          let isDirty;
          const isSessionOn = internalModel.getProperty("/sessionOn");
          if (!isSessionOn && !this._hiddenDraft) {
            // If the sticky session was terminated before hand.
            // Example in case of navigating away from application using IBN.
            return undefined;
          }
          if (!routerProxy.isNavigationFinalized()) {
            // If navigation is currently happening in RouterProxy, it's a transient state
            // (not dirty)
            isDirty = false;
            lclHashTracker = targetHash;
          } else if (hashTracker === targetHash && !this._hiddenDraft) {
            // the hash didn't change so either the user attempts to refresh or to leave the app
            isDirty = true;
          } else if (routerProxy.checkHashWithGuard(targetHash) || routerProxy.isGuardCrossAllowedByUser() || this._hiddenDraft && !isObjectModified && !this.isDocumentModified()) {
            // the user attempts to navigate within the root object
            // or crossing the guard has already been allowed by the RouterProxy
            // or the user attempts to navigate within the hidden draft when the document is not modified
            lclHashTracker = targetHash;
            isDirty = false;
          } else {
            // the user attempts to navigate within the app, for example back to the list report
            isDirty = true;
          }
          if (isDirty) {
            // the FLP doesn't call the dirty state provider anymore once it's dirty, as they can't
            // change this due to compatibility reasons we set it back to not-dirty
            setTimeout(function () {
              appComponent.getShellServices().setDirtyFlag(false);
            }, 0);
          } else {
            hashTracker = lclHashTracker;
          }
          return isDirty;
        } catch (error) {
          Log.info(error);
          return undefined;
        }
      };
    }

    /**
     * Returns a callback function to be used when a sticky session times out.
     * @param stickyContext The context for the sticky session
     * @param i18nModel
     * @returns The callback function
     */;
    _proto.getSessionTimeoutFunction = function getSessionTimeoutFunction(stickyContext, i18nModel) {
      return () => {
        try {
          if (stickyContext === undefined) {
            throw new Error("Context missing for SessionTimeout function");
          }
          // remove transient messages since we will showing our own message
          this.getMessageHandler().removeTransitionMessages();
          const warningDialog = new Dialog({
            title: "{sap.fe.i18n>C_EDITFLOW_OBJECT_PAGE_SESSION_EXPIRED_DIALOG_TITLE}",
            state: "Warning",
            content: new Text({
              text: "{sap.fe.i18n>C_EDITFLOW_OBJECT_PAGE_SESSION_EXPIRED_DIALOG_MESSAGE}"
            }),
            beginButton: new Button({
              text: "{sap.fe.i18n>C_COMMON_DIALOG_OK}",
              type: "Emphasized",
              press: () => {
                // remove sticky handling after navigation since session has already been terminated
                this.handleSessionOff();
                this.getInternalRouting().navigateBackFromContext(stickyContext);
              }
            }),
            afterClose: function () {
              warningDialog.destroy();
            }
          });
          warningDialog.addStyleClass("sapUiContentPadding");
          warningDialog.setModel(i18nModel, "sap.fe.i18n");
          this.getView().addDependent(warningDialog);
          warningDialog.open();
        } catch (error) {
          Log.info(error);
          return undefined;
        }
        return true;
      };
    }

    /**
     * Returns a callback function for the onRouteMatched event in case of sticky edition.
     * @param context The context being edited (root of the sticky session)
     * @param appComponent The app component
     * @returns The callback function
     */;
    _proto.getRouteMatchedFunction = function getRouteMatchedFunction(context, appComponent) {
      const programmingModel = this.getProgrammingModel(context);
      const model = context.getModel();
      const contextPath = context.getPath();
      return async () => {
        const currentHash = appComponent.getRouterProxy().getHash();
        // If the current hash is empty or the navigation is outside the guard, discard the session.
        if (!currentHash || !appComponent.getRouterProxy().checkHashWithGuard(currentHash)) {
          if (this._hiddenDraft && programmingModel === ProgrammingModel.Draft) {
            appComponent.getRootViewController().unregisterEditLifecycleCallbacks();
            return this.handleHiddenDraftDiscard(context, model, contextPath);
          } else {
            // For sticky session, discard changes and clear session context.
            await this.discardStickySession(context);
            context.getModel().clearSessionContext();
          }
        }
      };
    }

    /**
     * Handles the discard process for hidden draft sessions.
     * Prepares the context and ensures we have the required properties before discarding.
     * @param context The context being edited.
     * @param model The OData model instance used for binding the context.
     * @param contextPath The path of the context being edited.
     * @returns A promise that resolves when the hidden draft session is discarded.
     */;
    _proto.handleHiddenDraftDiscard = async function handleHiddenDraftDiscard(context, model, contextPath) {
      // Prepare the context for discard operation
      let discardContext;
      if (context?.getBinding()) {
        discardContext = context;
      } else {
        discardContext = model.bindContext(contextPath, undefined, {}).getBoundContext();
      }

      // Request necessary properties before discarding the draft session.
      await discardContext.requestProperty(["HasActiveEntity", "IsActiveEntity"]);
      return this.discardHiddenDraftSession(discardContext);
    }

    /**
     * Discards the current context changes and refreshes the context if it is not a creation operation.
     * @param context The context to be discarded.
     * @param isCreation A boolean indicating if the context is for a creation operation.
     */;
    _proto.discardContext = function discardContext(context, isCreation) {
      if (context?.hasPendingChanges()) {
        context.getBinding().resetChanges();
      }
      if (!isCreation) {
        context.refresh();
      }
    }

    /**
     * Terminates the draft session for the given context or model if it is a draft programming model.
     * @param contextOrModel The context or model to terminate the session for
     */;
    _proto.terminateDraftSession = function terminateDraftSession(contextOrModel) {
      // If a model is passed directly, we can't check the programming model from it,
      // so we rely on the draft.terminateDraftSession to check for SAP-ContextId presence
      if (contextOrModel?.isA("sap.ui.model.odata.v4.Context")) {
        // It's a Context - check programming model first
        if (this.getProgrammingModel(contextOrModel) === ProgrammingModel.Draft) {
          draft.terminateDraftSession(contextOrModel);
        }
      } else {
        // It's a Model - just call terminate (it will check for SAP-ContextId)
        draft.terminateDraftSession(contextOrModel);
      }
    }

    /**
     * Ends a sticky session by discarding changes.
     * @param context The context being edited (root of the sticky session)
     */;
    _proto.discardStickySession = async function discardStickySession(context) {
      const isCreation = this.getCreationMode();
      this.handleSessionOff();
      const discardedContext = await sticky.discardDocument(context);
      if (discardedContext !== undefined && discardedContext !== null) {
        this.discardContext(discardedContext, isCreation);
      }
    }

    /**
     * Discards the hidden draft session for the given context.
     * @param context The context from which the draft session will be discarded.
     * @returns A promise that resolves when the discard operation is complete.
     */;
    _proto.discardHiddenDraftSession = async function discardHiddenDraftSession(context) {
      const isCreation = this.getCreationMode();

      // Handle the pending changes of the context
      this.discardContext(context, isCreation);

      // Then call the draft data loss popup to handle the actual draft discard
      await draftDataLossPopup.discardDraft(this.getView().getController(), undefined, context, true);
      this.handleSessionOff();
    }

    /**
     * Gets the internal routing extension.
     * @returns The internal routing extension
     */;
    _proto.getInternalRouting = function getInternalRouting() {
      if (this.base._routing) {
        return this.base._routing;
      } else {
        throw new Error("Edit Flow works only with a given routing listener");
      }
    };
    _proto._getRootViewController = function _getRootViewController() {
      return this.getAppComponent().getRootViewController();
    };
    _proto._getSemanticMapping = function _getSemanticMapping() {
      return this.getAppComponent().getRoutingService().getLastSemanticMapping();
    }

    /**
     * Creates a new promise to wait for an action to be executed.
     * @param actionName The name of the action
     * @param controlId The ID of the control
     * @returns The resolver function which can be used to externally resolve the promise
     */;
    _proto.createActionPromise = function createActionPromise(actionName, controlId) {
      let resolveFunction, rejectFunction;
      this.actionPromise = new Promise((resolve, reject) => {
        resolveFunction = resolve;
        rejectFunction = reject;
      }).then(response => {
        return Object.assign({
          controlId
        }, this.getActionResponseDataAndKeys(actionName, response));
      });
      return {
        fResolver: resolveFunction,
        fRejector: rejectFunction
      };
    }

    /**
     *
     * @param actionName The name of the action that is executed
     * @param response The bound action's response data or response context
     * @returns Object with data and names of the key fields of the response
     */;
    _proto.getActionResponseDataAndKeys = function getActionResponseDataAndKeys(actionName, response) {
      if (response.length >= 1) {
        const boundContext = response[0].value.boundContext;
        if (!boundContext.getModel()) {
          // if the model is not there, the context has been destroyed
          return undefined;
        }
        const currentView = this.base.getView();
        const metaModelData = currentView.getModel().getMetaModel().getData() ?? {};
        const metaModelAction = metaModelData[actionName];
        const actionReturnType = metaModelAction?.[0].$ReturnType ? metaModelAction?.[0].$ReturnType.$Type : null;
        const keys = actionReturnType && metaModelData[actionReturnType] ? metaModelData[actionReturnType].$Key : [];
        return {
          oData: boundContext.getObject(),
          keys
        };
      }
      return undefined;
    };
    _proto.getCurrentActionPromise = async function getCurrentActionPromise() {
      return this.actionPromise;
    };
    _proto.deleteCurrentActionPromise = function deleteCurrentActionPromise() {
      this.actionPromise = undefined;
    };
    _proto.showConfirmRecommendationsDialog = async function showConfirmRecommendationsDialog(isSave) {
      if (!this.confirmRecommendationsDialog) {
        this.confirmRecommendationsDialog = new ConfirmRecommendationDialog({
          view: this.getView(),
          programmingModel: this.getProgrammingModel(this.getView().getBindingContext())
        });
      }
      return this.confirmRecommendationsDialog?.open(isSave);
    };
    _proto._scrollAndFocusOnInactiveRow = function _scrollAndFocusOnInactiveRow(table) {
      const rowBinding = table.getRowBinding();
      const activeRowIndex = rowBinding.getCount() || 0;
      if (table.data("tableType") !== "ResponsiveTable") {
        if (activeRowIndex > 0) {
          table.scrollToIndex(activeRowIndex - 1);
        }
        table.focusRow(activeRowIndex, true);
      } else {
        /* In a responsive table, the empty rows appear at the beginning of the table. But when we create more, they appear below the new line.
         * So we check the first inactive row first, then we set the focus on it when we press the button.
         * This doesn't impact the GridTable because they appear at the end, and we already focus the before-the-last row (because 2 empty rows exist)
         */
        const allRowContexts = rowBinding.getAllCurrentContexts();
        if (!allRowContexts?.length) {
          table.focusRow(activeRowIndex, true);
          return;
        }
        let focusRow = activeRowIndex,
          index = 0;
        for (const singleContext of allRowContexts) {
          if (singleContext.isInactive() && index < focusRow) {
            focusRow = index;
          }
          index++;
        }
        if (focusRow > 0) {
          table.scrollToIndex(focusRow);
        }
        table.focusRow(focusRow, true);
      }
    };
    _proto.createEmptyRowsAndFocus = async function createEmptyRowsAndFocus(table) {
      const tableAPI = table.getParent();
      if (tableAPI?.tableDefinition?.control?.inlineCreationRowsHiddenInEditMode && !table.getBindingContext("pageInternal")?.getProperty("createMode")) {
        if (tableAPI.tableDefaultsPromise) {
          const tableDefaultData = await tableAPI.tableDefaultsPromise;
          await tableAPI.setUpEmptyRows(table, true, tableDefaultData ?? {});
        } else {
          // With the parameter, we don't have empty rows in Edit mode, so we need to create them before setting the focus on them
          await tableAPI.setUpEmptyRows(table, true);
        }
      }
      this._scrollAndFocusOnInactiveRow(table);
    };
    _proto._sendActivity = function _sendActivity(action, relatedContexts, triggeredActionName, refreshListBinding, actionRequestedProperties) {
      const content = Array.isArray(relatedContexts) ? relatedContexts.map(context => context.getPath()) : relatedContexts?.getPath();
      this.base.collaborativeDraft.send({
        action,
        content,
        triggeredActionName,
        refreshListBinding,
        actionRequestedProperties
      });
    };
    _proto._triggerConfiguredSurvey = function _triggerConfiguredSurvey(sActionName, triggerType) {
      triggerConfiguredSurvey(this.base.getView(), sActionName, triggerType);
    };
    _proto._submitOpenChanges = async function _submitOpenChanges(oContext) {
      const oModel = oContext.getModel(),
        oLockObject = this.getGlobalUIModel();
      try {
        // Submit any leftover changes that are not yet submitted
        // Currently we are using only 1 updateGroupId, hence submitting the batch directly here
        await oModel.submitBatch("$auto");

        // Wait for all currently running changes
        // For the time being we agreed with the v4 model team to use an internal method. We'll replace it once
        // a public or restricted method was provided
        await oModel.oRequestor.waitForRunningChangeRequests("$auto");

        // Check if all changes were submitted successfully
        if (oModel.hasPendingChanges("$auto")) {
          throw new Error("submit of open changes failed");
        }
      } finally {
        if (BusyLocker.isLocked(oLockObject)) {
          BusyLocker.unlock(oLockObject);
        }
      }
    };
    _proto._removeStickySessionInternalProperties = function _removeStickySessionInternalProperties(programmingModel) {
      if (programmingModel === ProgrammingModel.Sticky) {
        const internalModel = this.getInternalModel();
        internalModel.setProperty("/sessionOn", false);
        internalModel.setProperty("/stickySessionToken", undefined);
        this.handleSessionOff();
      }
    }

    /**
     * Method to display a 'discard' popover when exiting a sticky session.
     * @param context
     */;
    _proto.onBackNavigationInSession = function onBackNavigationInSession(context) {
      const view = this.base.getView();
      const routerProxy = this.getAppComponent().getRouterProxy();
      if (routerProxy.checkIfBackIsOutOfGuard()) {
        sticky.processDataLossConfirmation(async () => {
          await this.discardStickySession(context);
          this._removeStickySessionInternalProperties(ProgrammingModel.Sticky);
          history.back();
        }, undefined,
        // fnCancel not needed for shell back navigation
        view, ProgrammingModel.Sticky);
        return;
      }
      history.back();
    }

    /**
     * Shows confirmation dialog for guard crossing during navigation.
     * Displays appropriate data loss dialog based on programming model (sticky vs draft).
     * @param context The current editing context
     * @returns Promise resolving to true if navigation should proceed, false if cancelled
     */;
    _proto.confirmGuardCross = async function confirmGuardCross(context) {
      const programmingModel = this.getProgrammingModel(context);
      const controller = this.base.getView().getController();
      const view = this.base.getView();
      const promiseKeeper = new PromiseKeeper();
      const fnResolve = () => {
        this.handleSessionOff();
        promiseKeeper.resolve(true);
      };
      if (programmingModel === ProgrammingModel.Sticky) {
        // Sticky session - use sticky.processDataLossConfirmation with cancel callback
        sticky.processDataLossConfirmation(async () => {
          // User confirmed - discard session and proceed
          // discardStickySession already calls handleSessionOff(), so resolve directly
          await this.discardStickySession(context);
          this._removeStickySessionInternalProperties(ProgrammingModel.Sticky);
          promiseKeeper.resolve(true);
        }, () => promiseKeeper.resolve(false),
        // User cancelled - stay on page
        view, programmingModel);
      } else {
        //Hidden Draft - use draft.processDataLossOrDraftDiscardConfirmation
        const hiddenDraftEnabled = this.getAppComponent()?.getEnvironmentCapabilities()?.getCapabilities()?.HiddenDraft?.enabled;
        await draft.processDataLossOrDraftDiscardConfirmation(() => fnResolve(),
        // Save/Keep/Discard all proceed with navigation
        () => promiseKeeper.resolve(false),
        // Cancel - stay on page
        context, controller, true,
        // skipBindingToView
        draft.NavigationType.ForwardNavigation, undefined, hiddenDraftEnabled ? true : undefined);
      }
      return promiseKeeper.promise;
    };
    _proto._handleNewContext = async function _handleNewContext(oContext, navigationParameters) {
      if (!this._isFclEnabled()) {
        EditState.setEditStateDirty();
      }
      await this.getInternalRouting().navigateToContext(oContext, {
        checkNoHashChange: true,
        editable: navigationParameters.editable,
        persistOPScroll: true,
        recreateContext: navigationParameters.recreateContext,
        reason: NavigationReason.EditFlowAction,
        showPlaceholder: false,
        forceFocus: navigationParameters.forceFocus ?? false,
        keepCurrentLayout: true,
        semanticPath: navigationParameters.siblingPath
      });
    }

    /**
     * Checks if there are validation (parse) errors for controls bound to a given context.
     * @param view The view
     * @param params The parameters
     * @param params.controlId The ID of the control
     * @param params.isNavigable True if the action is navigable
     * @returns True if the action needs to returns the bound context, false otherwise
     */;
    _proto._getBoundContext = function _getBoundContext(view, params) {
      //This weird condition is needed to avoid navigation in case of some actions into the table
      // this definitely needs to be refactored to get clear condition where navigation needs to be done or not
      // SNOW: DINC0278490
      const viewLevel = view.getViewData().viewLevel;
      const bRefreshAfterAction = viewLevel > 1 || viewLevel === 1 && params.controlId;
      return !params.isNavigable || !!bRefreshAfterAction;
    }

    /**
     * Checks if there are validation (parse) errors for controls bound to a given context
     * @returns {Promise} Promise resolves if there are no validation errors, and rejects if there are validation errors
     */;
    _proto._checkForValidationErrors = async function _checkForValidationErrors() {
      return this.syncTask().then(() => {
        const visibleViewIds = this._isFclEnabled() ? this._getRootViewController()._getAllVisibleViews().map(view => view.getId()) : [this.getView().getId()];
        const aMessages = Messaging.getMessageModel().getData();
        let oControl;
        if (!aMessages.length) {
          Log.info("No validation errors found");
          return;
        }
        for (const message of aMessages) {
          if (message.validation) {
            oControl = Element.getElementById(message.getControlId());
            while (oControl) {
              if (visibleViewIds.includes(oControl.getId())) {
                throw "validation errors exist";
              }
              oControl = oControl.getParent();
            }
          }
        }
        return;
      });
    }

    /**
     * @param oResponse The response of the bound action and the names of the key fields
     * @param oResponse.oData
     * @param oResponse.keys
     * @param oContext The bound context on which the action was executed
     * @returns True Promise if the list was refreshed
     */;
    _proto._refreshListIfRequired = async function _refreshListIfRequired(oResponse, oContext) {
      if (!oContext || !oResponse || !oResponse.oData || !oResponse.keys) {
        return false;
      }
      const oBinding = oContext.getBinding();
      // refresh only lists
      if (oBinding && oBinding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
        const oContextData = oResponse.oData;
        const aKeys = oResponse.keys;
        const oCurrentData = oContext.getObject();
        let bReturnedContextIsSame = true;
        // ensure context is in the response
        if (Object.keys(oContextData).length) {
          // check if context in response is different than the bound context
          bReturnedContextIsSame = aKeys.every(function (sKey) {
            return oCurrentData[sKey] === oContextData[sKey];
          });
          if (!bReturnedContextIsSame) {
            await this.getTransactionHelper().refreshListBinding(oBinding, this.getAppComponent());
            return true;
          }
        }
      }
      // resolve with oResponse to not disturb the promise chain afterwards
      return false;
    }

    /**
     * Provides the latest context in the metadata hierarchy from rootBinding to given context pointing to given entityType
     * if any such context exists. Otherwise, it returns the original context.
     * Note: It is only needed as work-around for incorrect modelling. Correct modelling would imply a DataFieldForAction in a LineItem
     * to point to an overload defined either on the corresponding EntityType or a collection of the same.
     * @param rootContext The context to start searching from
     * @param listBinding The listBinding of the table
     * @param overloadEntityType The ActionOverload entity type to search for
     * @returns Returns the context of the ActionOverload entity
     */;
    _proto._getActionOverloadContextFromMetadataPath = function _getActionOverloadContextFromMetadataPath(rootContext, listBinding, overloadEntityType) {
      const model = rootContext.getModel();
      const metaModel = model.getMetaModel();
      let contextSegments = listBinding.getPath().split("/");
      let currentContext = rootContext;

      // We expect that the last segment of the listBinding is the ListBinding of the table. Remove this from contextSegments
      // because it is incorrect to execute bindContext on a list. We do not anyway need to search this context for the overload.
      contextSegments.pop();
      if (contextSegments.length === 0) {
        contextSegments = [""]; // Don't leave contextSegments undefined
      }
      if (contextSegments[0] !== "") {
        contextSegments.unshift(""); // to also get the root context, i.e. the bindingContext of the table
      }
      // load all the parent contexts into an array
      const parentContexts = contextSegments.map(pathSegment => {
        if (pathSegment !== "") {
          currentContext = model.bindContext(pathSegment, currentContext).getBoundContext();
        } else {
          // Creating a new context using bindContext(...).getBoundContext() does not work if the etag is needed. According to model colleagues,
          // we should always use an existing context if possible.
          // Currently, the only example we know about is using the rootContext - and in this case, we can obviously reuse that existing context.
          // If other examples should come up, the best possible work around would be to request some data to get an existing context. To keep the
          // request as small and fast as possible, we should request only the first key property. As this would introduce asynchronism, and anyway
          // the whole logic is only part of work-around for incorrect modelling, we wait until we have an example needing it before implementing this.
          currentContext = rootContext;
        }
        return currentContext;
      }).reverse();
      // search for context backwards
      const overloadContext = parentContexts.find(parentContext => metaModel.getMetaContext(parentContext.getPath()).getObject("$Type") === overloadEntityType);
      return overloadContext || listBinding.getHeaderContext();
    };
    _proto._createSiblingInfo = function _createSiblingInfo(currentContext, newContext) {
      return {
        targetContext: newContext,
        pathMapping: [{
          oldPath: currentContext.getPath(),
          newPath: newContext.getPath()
        }]
      };
    };
    _proto._updatePathsInHistory = function _updatePathsInHistory(mappings) {
      const oAppComponent = this.getAppComponent();
      oAppComponent.getRouterProxy().setPathMapping(mappings);

      // Also update the semantic mapping in the routing service
      const lastSemanticMapping = this._getSemanticMapping();
      if (mappings.length && lastSemanticMapping?.technicalPath === mappings[mappings.length - 1].oldPath) {
        lastSemanticMapping.technicalPath = mappings[mappings.length - 1].newPath;
      }
    };
    _proto._getNavigationTargetForEdit = function _getNavigationTargetForEdit(context, newDocumentContext, siblingInfo) {
      let contextToNavigate;
      siblingInfo = siblingInfo ?? this._createSiblingInfo(context, newDocumentContext);
      this._updatePathsInHistory(siblingInfo.pathMapping);
      if (siblingInfo.targetContext.getPath() != newDocumentContext.getPath()) {
        contextToNavigate = context.getPath() === siblingInfo.targetContext.getPath() ? context : siblingInfo.targetContext;
      }
      return contextToNavigate;
    }

    /**
     * This method creates a sibling context for a subobject page, and calculates a sibling path
     * for all intermediate paths between the object page and the subobject page.
     * @param rootCurrentContext The context for the root of the draft
     * @param rightmostCurrentContext The context of the subobject
     * @param sProgrammingModel The programming model
     * @param doNotComputeIfRoot If true, we don't compute siblingInfo if the root and the rightmost contexts are the same
     * @param rootContextInfo The root context information of root of the draft
     * @param groupId
     * @returns Returns the siblingInformation object
     */;
    _proto._computeSiblingInformation = async function _computeSiblingInformation(rootCurrentContext, rightmostCurrentContext, sProgrammingModel, doNotComputeIfRoot, rootContextInfo, groupId) {
      rightmostCurrentContext = rightmostCurrentContext ?? rootCurrentContext;
      if (!rightmostCurrentContext.getPath().startsWith(rootCurrentContext?.getPath())) {
        // Wrong usage !!
        Log.error("Cannot compute rightmost sibling context");
        throw new Error("Cannot compute rightmost sibling context");
      }
      let rightMostContextToUse = rightmostCurrentContext;
      if (sProgrammingModel === ProgrammingModel.Draft && this.getProgrammingModel(rightmostCurrentContext) !== ProgrammingModel.Draft) {
        // we check the rightMostCurrentContext can be used in draft
        rightMostContextToUse = rootCurrentContext;
      }
      if (doNotComputeIfRoot && rightMostContextToUse.getPath() === rootCurrentContext?.getPath()) {
        return Promise.resolve(undefined);
      }
      const model = rootCurrentContext?.getModel();
      if (sProgrammingModel === ProgrammingModel.Draft) {
        return draft.computeSiblingInformation(rootCurrentContext, rightMostContextToUse, rootContextInfo, groupId);
      } else {
        // If not in draft mode, we just recreate a context from the path of the rightmost context
        // No path mapping is needed
        return {
          targetContext: model.bindContext(rightmostCurrentContext.getPath()).getBoundContext(),
          pathMapping: []
        };
      }
    };
    _proto._isFclEnabled = function _isFclEnabled() {
      return this.getAppComponent()._isFclEnabled();
    };
    _proto.checkRecommendationOption = async function checkRecommendationOption() {
      //The existing recommendations check is now present further in the flow for showing confirmation dialog
      const recommendationOptionChoosen = await this.showConfirmRecommendationsDialog(true);
      if (recommendationOptionChoosen === RecommendationDialogDecision.Continue) {
        return Promise.reject(RecommendationDialogDecision.Continue);
      }
      return recommendationOptionChoosen;
    }

    /**
     * Create Next Document.
     * @returns A promise that resolved once create next happens.
     */;
    _proto.createNextDocument = async function createNextDocument() {
      const bindingContextPath = this.getView()?.getBindingContext()?.getPath();
      const listBindingPath = bindingContextPath?.substring(0, bindingContextPath.lastIndexOf("("));
      return this.createDocument(listBindingPath, {
        creationMode: CreationMode.NewPage
      });
    }

    /**
     * Handles the resume action for draft entities if annotated in the metadata.
     * Should be called after binding context is established and data is loaded.
     * Prerequisite: The loaded object is a draft.
     * @param bindingContext The binding context of the Object Page
     */;
    _proto.handleDraftResumeAction = async function handleDraftResumeAction(bindingContext) {
      if (bindingContext == null) {
        return;
      }
      try {
        const model = bindingContext.getModel();
        const metaModel = model.getMetaModel();
        const entitySetPath = "/" + this.base.getView().getViewData().entitySet;
        const resumeActionName = metaModel?.getObject(`${entitySetPath}@com.sap.vocabularies.Common.v1.DraftRoot/ResumeAction`);
        if (resumeActionName) {
          Log.info("Executing resume action for existing draft entity");
          await this.invokeAction(resumeActionName, {
            contexts: bindingContext,
            model: model,
            skipParameterDialog: true,
            bStaticAction: false // resume action is always bound
          });
          Log.info("Resume action completed successfully");
        }
      } catch (error) {
        Log.error("Error executing resume action:", error);
        // Continue with normal flow even if resume action fails
      }
    };
    return EditFlow;
  }(BaseControllerExtension), _applyDecoratedDescriptor(_class2.prototype, "onInit", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "onInit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "editDocument", [_dec3, _dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "editDocument"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "updateDocument", [_dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "updateDocument"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "createDocument", [_dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "createDocument"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeCreate", [_dec9, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeCreate"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeEdit", [_dec11, _dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeEdit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeSave", [_dec13, _dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeSave"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeDiscard", [_dec15, _dec16], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeDiscard"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeDelete", [_dec17, _dec18], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeDelete"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeExecuteAction", [_dec19, _dec20], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeExecuteAction"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onAfterSave", [_dec21, _dec22], Object.getOwnPropertyDescriptor(_class2.prototype, "onAfterSave"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onAfterCreate", [_dec23, _dec24], Object.getOwnPropertyDescriptor(_class2.prototype, "onAfterCreate"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onAfterEdit", [_dec25, _dec26], Object.getOwnPropertyDescriptor(_class2.prototype, "onAfterEdit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onAfterDiscard", [_dec27, _dec28], Object.getOwnPropertyDescriptor(_class2.prototype, "onAfterDiscard"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onAfterDelete", [_dec29, _dec30], Object.getOwnPropertyDescriptor(_class2.prototype, "onAfterDelete"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "saveDocument", [_dec31, _dec32], Object.getOwnPropertyDescriptor(_class2.prototype, "saveDocument"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "cancelDocument", [_dec33, _dec34], Object.getOwnPropertyDescriptor(_class2.prototype, "cancelDocument"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "deleteDocument", [_dec35, _dec36], Object.getOwnPropertyDescriptor(_class2.prototype, "deleteDocument"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "applyDocument", [_dec37, _dec38], Object.getOwnPropertyDescriptor(_class2.prototype, "applyDocument"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "invokeAction", [_dec39, _dec40], Object.getOwnPropertyDescriptor(_class2.prototype, "invokeAction"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onAfterActionExecution", [_dec41, _dec42], Object.getOwnPropertyDescriptor(_class2.prototype, "onAfterActionExecution"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "customMassEditSave", [_dec43, _dec44], Object.getOwnPropertyDescriptor(_class2.prototype, "customMassEditSave"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "securedExecution", [_dec45, _dec46], Object.getOwnPropertyDescriptor(_class2.prototype, "securedExecution"), _class2.prototype), _class2)) || _class);
  return EditFlow;
}, false);
//# sourceMappingURL=EditFlow-dbg.js.map
