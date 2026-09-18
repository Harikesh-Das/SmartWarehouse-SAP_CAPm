/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/collaboration/CollaborationCommon", "sap/fe/core/controllerextensions/editFlow/TransactionHelper", "sap/fe/core/converters/ManifestSettings", "sap/fe/core/converters/MetaModelConverter", "sap/ui/core/Lib", "sap/ui/core/Messaging", "sap/ui/core/message/Message", "sap/ui/core/message/MessageType"], function (Log, CommonUtils, CollaborationCommon, TransactionHelper, ManifestSettings, MetaModelConverter, Library, Messaging, Message, MessageType) {
  "use strict";

  var _exports = {};
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var CreationMode = ManifestSettings.CreationMode;
  var Activity = CollaborationCommon.Activity;
  let EmptyRowsHandler = /*#__PURE__*/function () {
    function EmptyRowsHandler() {}
    _exports = EmptyRowsHandler;
    var _proto = EmptyRowsHandler.prototype;
    /**
     * Promise that resolves to the table's default values.
     */
    _proto.setupMixin = function setupMixin(_baseClass) {
      // This method is needed to implement interface IInterfaceWithMixin
    }

    /**
     * Handler for the onFieldLiveChange event.
     * @param ui5Event The event object passed by the onFieldLiveChange event
     */;
    _proto._onFieldLiveChange = function _onFieldLiveChange(ui5Event) {
      const field = ui5Event.getSource(),
        bindingContext = field.getBindingContext(),
        binding = bindingContext.getBinding();
      // creation of a new inactive row if relevant
      if (bindingContext.isInactive()) {
        const table = this?.getContent();
        this?.createEmptyRows(binding, table, true);
      }
    }

    /**
     * Handles the CreateActivate event from the ODataListBinding.
     * @param activateEvent The event sent by the binding
     */;
    _proto._handleCreateActivate = async function _handleCreateActivate(activateEvent) {
      const activatedContext = activateEvent.getParameter("context");
      // we start by asking to recreate an empty row (if live change has already done it this won't have any effect)
      // but we do not wait
      this.createEmptyRows(activateEvent.getSource(), this.getContent(), true);
      const table = this.getContent();
      const appComponent = CommonUtils.getAppComponent(table);
      const binding = table.getRowBinding();
      if (!this.validateEmptyRow(activatedContext)) {
        activateEvent.preventDefault();
        return;
      }
      try {
        const transientPath = activatedContext.getPath(),
          view = CommonUtils.getTargetView(this),
          controller = view.getController(),
          editFlow = controller.editFlow;
        try {
          await Promise.all([appComponent.getSideEffectsService().requestSideEffectsForNavigationProperty(binding.getPath(), view.getBindingContext()), activatedContext.created?.() ?? Promise.resolve()]);
          await editFlow.onAfterCreate({
            context: activatedContext
          });
        } catch (e) {
          Log.warning(`Failed to activate context ${activatedContext.getPath()}`);
          return;
        }
        const content = activatedContext.getPath();
        const collaborativeDraft = view.getController().collaborativeDraft;
        // Send notification to other users only after the creation has been finalized
        collaborativeDraft.send({
          action: Activity.Create,
          content
        });
        // Since the path of the context has changed during activation, we need to update all collaboration locks
        // that were using the transient path
        collaborativeDraft.updateLocksForContextPath(transientPath, activatedContext.getPath());

        // Load the properties that are part of the 'requestAtLeast' annotation from the table (if any)
        const requestAtLeast = Object.keys(this.getTableDefinition().requestAtLeast ?? {});
        if (requestAtLeast.length > 0) {
          await activatedContext.requestProperty(requestAtLeast);
        }
      } catch (error) {
        Log.error("Failed to activate new row -", error);
      }
    }

    /**
     * Get the default values from the DefaultValues function.
     * @param listBinding The current list binding
     * @returns The DefaultValues function (or undefined if no function is found)
     */;
    _proto.getDefaultValuesFunction = function getDefaultValuesFunction(listBinding) {
      const model = listBinding.getModel();
      const metaModel = model.getMetaModel();
      const metaContext = metaModel.getMetaContext(listBinding.getResolvedPath());
      const listBindingObjectPath = getInvolvedDataModelObjects(metaContext);
      const defaultFuncOnTargetObject = listBindingObjectPath.targetObject.annotations.Common?.DefaultValuesFunction;
      const defaultFuncOnTargetEntitySet = listBindingObjectPath.targetEntitySet?.annotations.Common?.DefaultValuesFunction;
      return defaultFuncOnTargetObject ?? defaultFuncOnTargetEntitySet;
    }

    /**
     * EmptyRowsEnabled setter.
     * @param enablement
     */;
    _proto.setEmptyRowsEnabled = function setEmptyRowsEnabled(enablement) {
      // INIT: ensure tableDefaultsPromise exists when enabling empty rows
      if (enablement && !this.tableDefaultsPromise) {
        this.tableDefaultsPromise = this.getTableDefaults(this.getContent());
      }
      this.setProperty("emptyRowsEnabled", enablement);
      const navigationPath = this.getContent().data().navigationPath,
        appComponent = CommonUtils.getAppComponent(this.getContent());
      if (enablement) {
        const listBinding = this.getContent().getRowBinding();
        const defaultValuesFunction = listBinding?.getResolvedPath() ? this.getDefaultValuesFunction(listBinding) : undefined;
        if (defaultValuesFunction) {
          appComponent.getSideEffectsService().registerTargetCallback(navigationPath, this.updateEmptyRows.bind(this));
          // Immediate initial setup without defaults
          if (!this.tableDefaultsPromise) {
            this.setUpEmptyRows(this.getContent());
          }
        }
      } else {
        appComponent.getSideEffectsService().deregisterTargetCallback(navigationPath);
      }
      // Immediate initial setup only if no defaults promise exists (to avoid duplicate empty rows)
      if (this.tableDefaultsPromise) {
        this.tableDefaultsPromise.then(tableDefaultData => {
          this.updateEmptyRows(tableDefaultData);
          return tableDefaultData;
        }).catch(error => {
          Log.error("Error while setting up empty rows:", error);
        });
      } else {
        this.setUpEmptyRows(this.getContent());
      }
    }

    /**
     * Remove and recreate the empty rows in order to get any updated default values.
     * @param this
     * @param defaultsFromPromise
     * @returns Promise
     */;
    _proto.updateEmptyRows = async function updateEmptyRows(defaultsFromPromise) {
      const table = this.getContent();
      const binding = table.getRowBinding();
      const bindingHeaderContext = binding.getHeaderContext();
      if (!(binding && binding.isResolved() && binding.isLengthFinal() && bindingHeaderContext)) {
        return;
      }
      const contextPath = bindingHeaderContext.getPath();

      // DO NOT show empty rows in display mode.
      // If any inactive rows are present (from a previous state), remove them and exit.
      if (!CommonUtils.getIsEditable(table)) {
        this.removeEmptyRowsMessages();
        this._deleteEmptyRows(binding, contextPath);
        return;
      }
      this._deleteEmptyRows(binding, contextPath);

      // Analytical tables - Do not create empty rows when grouping is active.
      const groupConditions = table.getGroupConditions?.();
      const bindingAggregation = binding.getAggregation?.();
      if (groupConditions?.groupLevels?.length || bindingAggregation?.groupLevels?.length) {
        return;
      }
      const defaults = defaultsFromPromise ?? (await this.getTableDefaults(table));
      // Update the empty rows with the latest default values
      await this.createEmptyRows(binding, table, false, undefined, false, defaults);
    }

    /**
     * Helper function to perform common checks for table defaults and empty rows setup.
     * @param table The table being processed
     * @returns The binding object if checks pass, or undefined if checks fail
     */;
    _proto._validateAndRetrieveBinding = async function _validateAndRetrieveBinding(table) {
      if (this.getTableDefinition().control?.creationMode !== CreationMode.InlineCreationRows) {
        return undefined;
      }
      const uiModel = table.getModel("ui");
      if (!uiModel) {
        return undefined;
      }
      if (uiModel.getProperty("/isEditablePending")) {
        // Wait until the edit mode computation is complete
        const watchBinding = uiModel.bindProperty("/isEditablePending");
        await new Promise(resolve => {
          const fnHandler = () => {
            watchBinding.detachChange(fnHandler);
            watchBinding.destroy();
            resolve();
          };
          watchBinding.attachChange(fnHandler);
        });
      }
      const binding = table.getRowBinding();
      if (!binding || binding.isRelative() && !binding.getContext()) {
        return undefined;
      }
      return binding;
    }

    /**
     * Gets the table defaults by validating and retrieving the binding, then fetching data from the DefaultValueFunction.
     * @param table The table being processed
     * @returns A promise that resolves to an object containing the default values, or undefined if no binding is available or the DefaultValueFunction returns no data
     */;
    _proto.getTableDefaults = async function getTableDefaults(table) {
      const binding = await this._validateAndRetrieveBinding(table);
      if (!binding) return undefined;
      const appComponent = CommonUtils.getAppComponent(CommonUtils.getTargetView(table));
      return appComponent ? TransactionHelper.getDataFromDefaultValueFunction(binding, appComponent) : undefined;
    };
    _proto.setUpEmptyRows = async function setUpEmptyRows(table) {
      let createButtonWasPressed = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      let tableDefaultData = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      const binding = await this._validateAndRetrieveBinding(table);
      if (!binding) {
        return;
      }
      const bindingHeaderContext = binding.getHeaderContext();
      if (binding && binding.isResolved() && binding.isLengthFinal() && bindingHeaderContext) {
        const contextPath = bindingHeaderContext.getPath();
        if (!this.emptyRowsEnabled) {
          this.removeEmptyRowsMessages();
          return this._deleteEmptyRows(binding, contextPath);
        }
        if (!CommonUtils.getIsEditable(table)) {
          return;
        }
        if (this.getTableDefinition().control?.inlineCreationRowsHiddenInEditMode && !table.getBindingContext("pageInternal")?.getProperty("createMode") && !createButtonWasPressed) {
          return;
        }
        // Do not create empty rows when grouping is active — analytical tables do not support creating rows with active group levels.
        const groupConditions = table.getGroupConditions?.();
        const bindingAggregation = binding.getAggregation?.();
        if (groupConditions?.groupLevels?.length || bindingAggregation?.groupLevels?.length) {
          return;
        }
        const inactiveContext = binding.getAllCurrentContexts().find(function (context) {
          // when this is called from controller code we need to check that inactive contexts are still relative to the current table context
          return context.isInactive() && context.getPath().startsWith(contextPath);
        });
        if (!inactiveContext) {
          this.removeEmptyRowsMessages();
          await this.createEmptyRows(binding, table, false, undefined, false, tableDefaultData);
        }
      }
    }

    /**
     * Deletes inactive rows from the table listBinding.
     * @param binding
     * @param contextPath
     */;
    _proto._deleteEmptyRows = function _deleteEmptyRows(binding, contextPath) {
      for (const context of binding.getAllCurrentContexts()) {
        if (context.isInactive() && context.getPath().startsWith(contextPath)) {
          context.delete();
        }
      }
    }

    /**
     * Returns the current number of inactive contexts within the list binding.
     * @param binding Data list binding
     * @returns The number of inactive contexts
     */;
    _proto.getInactiveContextNumber = function getInactiveContextNumber(binding) {
      return binding.getAllCurrentContexts().filter(context => context.isInactive()).length;
    }

    /**
     * Handles the validation of the empty row.
     * @param context The context of the empty row
     * @returns The validation status
     */;
    _proto.validateEmptyRow = function validateEmptyRow(context) {
      const requiredProperties = this.getTableDefinition().annotation.requiredProperties;
      if (requiredProperties?.length) {
        this.removeEmptyRowsMessages(context);
        const missingProperties = requiredProperties.filter(requiredProperty => !context.getObject(requiredProperty));
        if (missingProperties.length) {
          const resourceBundle = Library.getResourceBundleFor("sap.fe.macros");
          const messages = [];
          let displayedColumn;
          for (const missingProperty of missingProperties) {
            let errorMessage;
            const missingColumn = this.getTableDefinition().columns.find(tableColumn => tableColumn.relativePath === missingProperty || tableColumn.propertyInfos && tableColumn.propertyInfos.includes(missingProperty));
            if (!missingColumn) {
              errorMessage = resourceBundle.getText("M_TABLE_EMPTYROW_MANDATORY", [missingProperty]);
            } else {
              displayedColumn = this.getContent().getColumns().find(mdcColumn => mdcColumn.getPropertyKey() === missingColumn.name);
              errorMessage = resourceBundle.getText(displayedColumn ? "M_TABLE_EMPTYROW_MANDATORY" : "M_TABLE_EMPTYROW_MANDATORY_HIDDEN", [displayedColumn?.getHeader() || missingColumn.label]);
            }
            messages.push(new Message({
              message: errorMessage,
              processor: this.getModel(),
              type: MessageType.Error,
              technical: false,
              persistent: true,
              technicalDetails: {
                tableId: this.getContent().getId(),
                // Need to do it since handleCreateActivate can be triggered multiple times (extra properties set by value help) before controlIds are set on the message
                emptyRowMessage: true,
                missingColumn: displayedColumn ? undefined : missingProperty // needed to change the messageStrip message
              },
              target: `${context?.getPath()}/${missingProperty}`
            }));
          }
          Messaging.addMessages(messages);
          return false;
        }
      }

      // Prevent activation when any field binding holds a client-side invalid value
      const hasInvalidBinding = context.getModel().getDependentBindings(context).some(binding => !binding.getPath()?.startsWith("@$ui5") && binding.getDataState?.()?.getInvalidValue?.() !== undefined);
      if (hasInvalidBinding) {
        return false;
      }
      return true;
    }

    /**
     * Removes the messages related to the empty rows.
     * @param inactiveContexts The contexts of the empty rows, if not provided, the messages of all empty rows are removed
     */;
    _proto.removeEmptyRowsMessages = function removeEmptyRowsMessages(inactiveContexts) {
      Messaging.removeMessages(Messaging.getMessageModel().getData().filter(msg => {
        const technicalDetails = msg.getTechnicalDetails() || {};

        // Check if msg target starts with any path in the inactiveContext array
        const contextMatches = Array.isArray(inactiveContexts) ? inactiveContexts.some(context => msg.getTargets().some(value => value.startsWith(context.getPath()))) : !inactiveContexts || msg.getTargets().some(value => value.startsWith(inactiveContexts.getPath()));
        return contextMatches && technicalDetails.emptyRowMessage && technicalDetails.tableId === this.getContent().getId();
      }));
    }

    /**
     * Creation of inactive rows for the table in creation mode "InlineCreationRows".
     * @param binding Data list binding
     * @param table The table being edited
     * @param recreateOneRow `true` if the call is to recreate an emptyLine
     * @param newInlineCreationRowFromPaste Number of new inactive rows to be created
     * @param forceCreateatEnd `true` if the new row is to be created at the end of the table
     * @param defaultValueFunctionData Default values retrieved from the DefaultValuesFunction to be applied to the new rows
     * @returns A promise that resolves to the created contexts or void if the creation failed
     */;
    _proto.createEmptyRows = async function createEmptyRows(binding, table) {
      let recreateOneRow = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      let newInlineCreationRowFromPaste = arguments.length > 3 ? arguments[3] : undefined;
      let forceCreateatEnd = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
      let defaultValueFunctionData = arguments.length > 5 ? arguments[5] : undefined;
      const inlineCreationRowCount = newInlineCreationRowFromPaste ?? (this.getTableDefinition().control?.inlineCreationRowCount || 1);
      /* ensures that at most one additional empty row can exist during LiveChange (when `recreateOneRow` is true).
      In all other cases, the number of inactive contexts cannot exceed `inlineCreationRowCount`.*/
      if (this.creatingEmptyRows || this.getInactiveContextNumber(binding) >= inlineCreationRowCount + (recreateOneRow ? 1 : 0)) {
        return;
      }
      const data = Array.from({
          length: inlineCreationRowCount
        }, () => ({})),
        atEnd = table.data("tableType") !== "ResponsiveTable",
        view = CommonUtils.getTargetView(table),
        controller = view.getController(),
        editFlow = controller.editFlow;
      this.creatingEmptyRows = true;
      try {
        const dataForCreate = recreateOneRow ? [{}] : data;
        const contexts = await editFlow.createMultipleDocuments(binding,
        // during a live change, only 1 new document is created
        dataForCreate, {
          createAtEnd: recreateOneRow || forceCreateatEnd ? true : atEnd,
          // When editing an empty row, the new empty row is to be created just below and not above

          beforeCreateCallBack: controller.editFlow.onBeforeCreate,
          createAsInactive: true,
          hideBusyIndicator: true,
          defaultValueFunctionData
        });
        contexts?.forEach(async function (context) {
          try {
            await context.created();
          } catch (error) {
            if (!error.canceled) {
              throw error;
            }
          }
        });
        return contexts;
      } catch (e) {
        Log.error(e);
      } finally {
        this.creatingEmptyRows = false;
      }
    };
    return EmptyRowsHandler;
  }();
  _exports = EmptyRowsHandler;
  return _exports;
}, false);
//# sourceMappingURL=EmptyRowsHandler-dbg.js.map
