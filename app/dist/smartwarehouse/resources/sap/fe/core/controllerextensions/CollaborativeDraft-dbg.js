/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/BindingHelper", "sap/ui/core/Element", "../CommonUtils", "../templating/UIFormatters", "./BaseControllerExtension", "./collaboration/CollaborationCommon"], function (Log, BindingToolkit, ClassSupport, MetaModelConverter, BindingHelper, Element, CommonUtils, UIFormatters, BaseControllerExtension, CollaborationCommon) {
  "use strict";

  var _dec, _class;
  var _exports = {};
  var shareObject = CollaborationCommon.shareObject;
  var addSelf = CollaborationCommon.addSelf;
  var CollaborationFieldGroupPrefix = CollaborationCommon.CollaborationFieldGroupPrefix;
  var Activity = CollaborationCommon.Activity;
  var FieldEditMode = UIFormatters.FieldEditMode;
  var bindingContextPathVisitor = BindingHelper.bindingContextPathVisitor;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var isPathInModelExpression = BindingToolkit.isPathInModelExpression;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var compileExpression = BindingToolkit.compileExpression;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * A controller extension to handle collaborative draft scenarios.
   * @since 1.141.0
   * @public
   */
  let CollaborativeDraft = (_dec = defineUI5Class("sap.fe.core.controllerextensions.CollaborativeDraft"), _dec(_class = /*#__PURE__*/function (_BaseControllerExtens) {
    function CollaborativeDraft() {
      return _BaseControllerExtens.apply(this, arguments) || this;
    }
    _exports = CollaborativeDraft;
    _inheritsLoose(CollaborativeDraft, _BaseControllerExtens);
    var _proto = CollaborativeDraft.prototype;
    _proto.getCollaborativeDraftService = function getCollaborativeDraftService() {
      this.collaborativeDraftService = this.collaborativeDraftService ?? this.base.getAppComponent().getCollaborativeDraftService();
      return this.collaborativeDraftService;
    }

    /**
     * Callback when the focus is set in the Field or one of its children.
     * @param source
     * @param focusEvent
     */;
    _proto.handleContentFocusIn = function handleContentFocusIn(source, focusEvent) {
      // We send the event only if the focus was previously out of the Field
      if (source.isA("sap.m.Tokenizer")) {
        source = source.getParent()?.getParent();
      }
      let targetOutsideOfControlDomRef = false;
      if (focusEvent) {
        targetOutsideOfControlDomRef = !source.getDomRef()?.contains(focusEvent.relatedTarget);
      }
      if (source.isA("sap.ui.mdc.MultiValueField") || targetOutsideOfControlDomRef) {
        // We need to handle the case where the newly focused Field is different from the previous one, but they share the same fieldGroupIDs
        // (e.g. fields in different rows in the same column of a table)
        // In such case, the focusOut handler was not called (because we stay in the same fieldGroupID), so we need to send a focusOut event manually
        const lastFocusId = this.getLastFocusId();
        if (lastFocusId && lastFocusId !== source.getId() && this.getLastFocusFieldGroups() === source.getFieldGroupIds().join(",")) {
          const lastFocused = Element.getElementById(lastFocusId);
          this?.sendFocusOutMessage(lastFocused);
        }
        this.setLastFocusInformation(source);
        this.sendFocusInMessage(source);
      }
    }

    /**
     * Callback when the focus is removed from the Field or one of its children.
     * @param fieldGroupEvent
     */;
    _proto.handleContentFocusOut = function handleContentFocusOut(fieldGroupEvent) {
      let control = fieldGroupEvent.getSource();
      if (control.isA("sap.m.Tokenizer")) {
        control = control.getParent()?.getParent();
      }
      if (!control.isA("sap.ui.mdc.MultiValueField")) {
        while (control && !control?.isA("sap.fe.macros.Field")) {
          control = control?.getParent();
        }
        if (!control) return;
      }
      const fieldGroupIds = fieldGroupEvent.getParameter("fieldGroupIds");

      // We send the event only if the validated fieldCroup corresponds to a collaboration group
      if (fieldGroupIds.some(groupId => {
        return groupId.startsWith(CollaborationFieldGroupPrefix);
      })) {
        const sourceControl = fieldGroupEvent.getSource();

        // Determine if the control that sent the event still has the focus (or one of its children).
        // This could happen e.g. if the user pressed <Enter> to validate the input.
        let currentFocusedControl = Element.getActiveElement();
        while (currentFocusedControl && currentFocusedControl !== sourceControl) {
          currentFocusedControl = currentFocusedControl.getParent();
        }
        if (currentFocusedControl !== sourceControl) {
          // The control that sent the event isn't focused anymore
          this.sendFocusOutMessage(control);
          if (this.getLastFocusId() === control.getId()) {
            this.setLastFocusInformation(undefined);
          }
        }
      }
    }

    /**
     * Gets the id of the last focused Field (if any).
     * @returns ID
     */;
    _proto.getLastFocusId = function getLastFocusId() {
      return this.lastFocusId;
    }

    /**
     * Gets the fieldgroups of the last focused Field (if any).
     * @returns A string containing the fieldgroups separated by ','
     */;
    _proto.getLastFocusFieldGroups = function getLastFocusFieldGroups() {
      return this.lastFocusFieldGroups;
    }

    /**
     * Stores information about the last focused Field (id and fieldgroups).
     * @param focusedField
     */;
    _proto.setLastFocusInformation = function setLastFocusInformation(focusedField) {
      this.lastFocusId = focusedField?.getId();
      this.lastFocusFieldGroups = focusedField?.getFieldGroupIds().join(",");
    }

    /**
     * If collaboration is enabled, send a Lock collaboration message.
     * @param fieldpAPI
     */;
    _proto.sendFocusInMessage = function sendFocusInMessage(fieldpAPI) {
      const collaborationPath = this.getCollaborationPath(fieldpAPI);
      if (collaborationPath) {
        this.send({
          action: Activity.Lock,
          content: collaborationPath
        });
      }
    }

    /**
     * If collaboration is enabled, send an Unlock collaboration message.
     * @param fieldpAPI
     */;
    _proto.sendFocusOutMessage = function sendFocusOutMessage(fieldpAPI) {
      if (!fieldpAPI) {
        return;
      }
      const collaborationPath = this.getCollaborationPath(fieldpAPI);
      if (collaborationPath) {
        this.send({
          action: Activity.Unlock,
          content: collaborationPath
        });
      }
    }

    /**
     * Gets the path used to send collaboration messages.
     * @param field
     * @returns The path (or undefined is no valid path could be found)
     */;
    _proto.getCollaborationPath = function getCollaborationPath(field) {
      // Note: we send messages even if the context is inactive (empty creation rows),
      // otherwise we can't update the corresponding locks when the context is activated.
      const bindingContext = field?.getBindingContext();
      if (!bindingContext) {
        return;
      }
      if (field.isA("sap.fe.macros.Field")) {
        if (!field.getMainPropertyRelativePath()) {
          return undefined;
        }
        const fieldWrapper = field.content;
        if (![FieldEditMode.Editable, FieldEditMode.EditableDisplay, FieldEditMode.EditableReadOnly].includes(fieldWrapper?.getProperty("editMode"))) {
          // The field is not in edit mode --> no collaboration messages
          return undefined;
        }
        return `${bindingContext.getPath()}/${field.getMainPropertyRelativePath()}`;
      } else if (field.isA("sap.ui.mdc.MultiValueField")) {
        const keypath = field.getBindingInfo("items").template.getBindingPath("key");
        return `${bindingContext.getPath()}/${field.getBindingInfo("items").path}/${keypath}`;
      }
    };
    _proto.send = function send(message) {
      this.getCollaborativeDraftService().send(this.getView(), message);
    };
    _proto.isConnected = function isConnected() {
      return this.getCollaborativeDraftService().isConnected(this.getView());
    };
    _proto.connect = async function connect(draftRootContext) {
      return this.getCollaborativeDraftService().connect(draftRootContext, this.getView());
    };
    _proto.disconnect = function disconnect() {
      const uiModel = this.getView().getModel("ui");
      this.cleanDraftRoot();
      uiModel.setProperty("/hasCollaborationAuthorization", undefined);
      if (this.isConnected()) {
        this.getCollaborativeDraftService().disconnect(this.getView());
      }
    };
    _proto.isCollaborationEnabled = function isCollaborationEnabled() {
      return this.getCollaborativeDraftService().isCollaborationEnabled(this.getView());
    };
    _proto.retainAsyncMessages = function retainAsyncMessages(activityPaths) {
      return this.getCollaborativeDraftService().retainAsyncMessages(this.getView(), activityPaths);
    };
    _proto.releaseAsyncMessages = function releaseAsyncMessages(activityPaths) {
      return this.getCollaborativeDraftService().releaseAsyncMessages(this.getView(), activityPaths);
    };
    _proto.updateLocksForContextPath = function updateLocksForContextPath(oldContextPath, newContextPath) {
      return this.getCollaborativeDraftService().updateLocksForContextPath(this.getView(), oldContextPath, newContextPath);
    };
    _proto.getCurrentDraftRootPath = function getCurrentDraftRootPath() {
      const internalModel = this.getView().getModel("internal");
      return internalModel?.getProperty("/collaborativeDraftRootPath");
    };
    _proto.getDraftShareActionOperationAvailablePromise = function getDraftShareActionOperationAvailablePromise() {
      const internalModel = this.getView().getModel("internal");
      return internalModel?.getProperty("/collaborativeDraftShareActionOperationAvailablePromise");
    };
    _proto.isInitialShare = function isInitialShare() {
      const internalModel = this.getView().getModel("internal");
      return internalModel?.getProperty("/collaborativeDraftShareInitial") === true;
    };
    _proto.setInitialShare = function setInitialShare(isInitial) {
      const internalModel = this.getView().getModel("internal");
      internalModel?.setProperty("/collaborativeDraftShareInitial", isInitial);
    }

    /**
     * Sets the draft root context for the collaboration.
     * Its path is stored in the internal model, so that it can be used later to check if the collaboration is active.
     * It also retrieves the list of users invited in the draft and stores it in the internal model.
     * @param draftRootContext The context for the draft root
     */;
    _proto.setDraftRoot = function setDraftRoot(draftRootContext) {
      const internalModel = this.getView().getModel("internal");
      const shareActionOperationAvailablePromise = this.getShareActionOperationAvailable(draftRootContext);
      internalModel?.setProperty("/collaborativeDraftShareActionOperationAvailablePromise", shareActionOperationAvailablePromise);
      internalModel?.setProperty("/collaborativeDraftRootPath", draftRootContext.getPath());
    }

    /**
     * Cleans the draft root context and the list of users invited in the draft.
     * This is called when the collaboration is deactivated or when the draft root context changes.
     */;
    _proto.cleanDraftRoot = function cleanDraftRoot() {
      const internalModel = this.getView().getModel("internal");
      internalModel?.setProperty("/collaborativeDraftShareActionOperationAvailablePromise", undefined);
      internalModel?.setProperty("/collaborativeDraftRootPath", undefined);
    }

    /**
     * Activates the collaboration for the given page context.
     * Checks if the current user is authorized to collaborate on the draft, and sets the flag in the UI model accordingly.
     * @param pageContext The page context (not necessarily a draft root)
     * @param isActiveEntity Is the context the active one (not a draft)?
     * @returns True if the user is authorized to collaborate, false otherwise.
     */;
    _proto.activateCollaboration = async function activateCollaboration(pageContext, isActiveEntity) {
      try {
        const uiModel = this.getView().getModel("ui");
        if (isActiveEntity) {
          // We're not in a draft -> disconnect if we were connected before
          uiModel.setProperty("/showCollaborationStrip", undefined);
          this.disconnect();
          return false;
        }
        const draftRootContext = CommonUtils.findOrCreateRootContext(pageContext, "Draft", this.getView(), this.base.getAppComponent(), {
          $$groupId: pageContext.getGroupId(),
          $select: "DraftAdministrativeData/DraftAdministrativeUser"
        }).rootContext;
        if (!draftRootContext) {
          Log.error("Couldn't find draft root context for enabling collaboration");
          return false;
        }
        const currentDraftRootPath = this.getCurrentDraftRootPath();
        if (currentDraftRootPath !== undefined && currentDraftRootPath !== draftRootContext.getPath()) {
          Log.error(`Unexpected path for checking collaboration authorizations: ${draftRootContext.getPath()} (expecting ${currentDraftRootPath})`);
        }
        if (uiModel.getProperty("/hasCollaborationAuthorization") !== undefined) {
          return uiModel.getProperty("/hasCollaborationAuthorization"); // Already checked, all good
        }
        const isShareActionOperationAvailable = await this.getDraftShareActionOperationAvailablePromise();
        uiModel.setProperty("/hasCollaborationAuthorization", isShareActionOperationAvailable);
        uiModel.setProperty("/showCollaborationStrip", !isShareActionOperationAvailable);
        this.connect(draftRootContext).catch(error => {
          Log.error("Error when connecting to the collaboration draft " + error);
        });
        return !!isShareActionOperationAvailable;
      } catch (err) {
        Log.error("Error while activating the collaborative draft " + err);
        return false;
      }
    };
    _proto.getShareActionOperationAvailableBindingExpression = function getShareActionOperationAvailableBindingExpression(draftRootContext, getODataCacheValue) {
      const metaModel = draftRootContext.getModel()?.getMetaModel();
      const entitySet = metaModel?.getMetaPath(draftRootContext.getPath());
      const metaContext = metaModel?.getMetaContext(draftRootContext.getPath());
      const objectPath = metaContext && getInvolvedDataModelObjects(metaContext);
      const shareActionName = metaModel?.getObject(`${entitySet}@com.sap.vocabularies.Common.v1.DraftRoot/ShareAction`);
      const action = objectPath?.convertedTypes.actions.find(action => {
        return action.fullyQualifiedName.startsWith(shareActionName);
      });
      const bindingParameterFullName = action?.isBound ? action.parameters[0]?.fullyQualifiedName : undefined;
      const bindingExpression = getExpressionFromAnnotation(action?.annotations?.Core?.OperationAvailable, [], undefined, path => bindingContextPathVisitor(path, objectPath?.convertedTypes, bindingParameterFullName));
      if (getODataCacheValue) {
        if (isPathInModelExpression(bindingExpression)) {
          const currentContextWithCache = draftRootContext.getObject();
          if (currentContextWithCache) {
            if (Object.keys(currentContextWithCache).includes(bindingExpression.path)) {
              return currentContextWithCache[bindingExpression.path];
            }
          }
          return undefined;
        }
      } else {
        return bindingExpression;
      }
    };
    _proto.getShareActionOperationAvailable = async function getShareActionOperationAvailable(draftRootContext) {
      const model = draftRootContext.getModel();
      const contextPath = draftRootContext.getPath();
      const bindingExpression = this.getShareActionOperationAvailableBindingExpression(draftRootContext);
      const shareActionOperationAvailableExpression = compileExpression(bindingExpression);
      if (shareActionOperationAvailableExpression === "undefined") {
        return true;
      }
      if (isPathInModelExpression(bindingExpression)) {
        return model.bindContext(`${contextPath}`, undefined, {
          $$groupId: draftRootContext.getGroupId(),
          $select: [bindingExpression.path]
        }).getBoundContext().requestProperty(bindingExpression.path);
      } else {
        return undefined;
      }
    }

    /**
     * Adds the current user in the draft root context.
     * @param pageContext The page context (not necessarily a draft root)
     */;
    _proto.executeShareAction = async function executeShareAction(pageContext) {
      try {
        const draftRootContext = CommonUtils.findOrCreateRootContext(pageContext, "Draft", this.getView(), this.base.getAppComponent(), {
          $$groupId: pageContext.getGroupId(),
          $select: "DraftAdministrativeData/DraftAdministrativeUser"
        }).rootContext;
        if (!draftRootContext) {
          Log.error("Couldn't find draft root context for enabling collaboration");
          return;
        }
        const currentDraftRootPath = this.getCurrentDraftRootPath();
        if (currentDraftRootPath !== undefined && currentDraftRootPath !== draftRootContext.getPath()) {
          // Collaboration was enabled on another draft --> disconnect first
          this.disconnect();
        }
        if (currentDraftRootPath === draftRootContext.getPath()) {
          return; // share was already called before, we don't need to call the Share action again
        }
        const performShare = async () => this.isInitialShare() ? shareObject(draftRootContext, undefined, "$auto.Workers") : addSelf(draftRootContext, "$auto.Workers");
        this.setInitialShare(false); // Reset the initial share flag, so that we don't call the initial Share action again
        this.setDraftRoot(draftRootContext);
        const cachedAvailability = this.getShareActionOperationAvailableBindingExpression(draftRootContext, true);
        // On cache hit: call Share immediately if available, skip if not
        // On cache miss (undefined, first load): wait for the actual OData value before deciding,
        // to avoid calling Share against a context where the operation is disabled
        if (cachedAvailability !== false) {
          const availability = cachedAvailability === true ? true : await this.getDraftShareActionOperationAvailablePromise();
          if (availability !== false) {
            await performShare();
          }
        }
      } catch (err) {
        Log.error("Error while adding current user in the collaborative draft " + err);
      }
    }

    /**
     * Sends a notification to other users that a property has been locked or unlocked by the current user.
     * @param context The context for the property
     * @param propertyName The name of the property
     * @param isLocked True if the property is locked, false if it is unlocked
     * @public
     * @since 1.141.0
     */;
    _proto.sendLockChange = function sendLockChange(context, propertyName, isLocked) {
      this.send({
        action: isLocked ? Activity.Lock : Activity.Unlock,
        content: `${context.getPath()}/${propertyName}`
      });
    }

    /**
     * Sends a notification to other users that property values have been changed by the current user.
     *
     * This notification must be sent after the changes have been sent successfully to the back end.
     * @param context The context for the properties
     * @param propertyNames The property name or the array of property names
     * @public
     * @since 1.141.0
     */;
    _proto.sendPropertyValuesChange = function sendPropertyValuesChange(context, propertyNames) {
      if (!Array.isArray(propertyNames)) {
        propertyNames = [propertyNames];
      }
      this.send({
        action: Activity.Change,
        content: propertyNames.map(prop => `${context.getPath()}/${prop}`)
      });
    }

    /**
     * Sends a notification to other users that new contexts have been created by the current user.
     *
     * This notification must be sent after the new contexts have been created successfully in the back end.
     * @param contextsOrBinding The array of newly created contexts, or the binding where the contexts were created
     * @public
     * @since 1.141.0
     */;
    _proto.sendContextsCreated = function sendContextsCreated(contextsOrBinding) {
      if (Array.isArray(contextsOrBinding)) {
        this.send({
          action: Activity.Create,
          content: contextsOrBinding.map(context => context.getPath())
        });
      } else {
        this.send({
          action: Activity.Create,
          content: contextsOrBinding.getResolvedPath() ?? contextsOrBinding.getPath()
        });
      }
    }

    /**
     * Sends a notification to other users that contexts have been deleted by the current user.
     *
     * This notification must be sent after the contexts have been deleted successfully in the back end.
     * @param contexts The array of deleted contexts
     * @public
     * @since 1.141.0
     */;
    _proto.sendContextsDeleted = function sendContextsDeleted(contexts) {
      this.send({
        action: Activity.Delete,
        content: contexts.map(context => context.getPath())
      });
    };
    return CollaborativeDraft;
  }(BaseControllerExtension)) || _class);
  _exports = CollaborativeDraft;
  return _exports;
}, false);
//# sourceMappingURL=CollaborativeDraft-dbg.js.map
