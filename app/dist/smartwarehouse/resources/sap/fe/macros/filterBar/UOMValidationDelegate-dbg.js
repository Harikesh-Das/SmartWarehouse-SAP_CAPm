/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/core/helpers/ResourceModelHelper", "sap/ui/core/Element", "sap/ui/core/Messaging", "sap/ui/core/message/ControlMessageProcessor", "sap/ui/core/message/Message", "sap/ui/core/message/MessageType", "sap/ui/mdc/enums/FilterBarValidationStatus", "../DelegateUtil", "../filter/FilterUtils"], function (CommonUtils, ResourceModelHelper, UI5Element, Messaging, ControlMessageProcessor, Message, MessageType, FilterBarValidationStatus, DelegateUtil, FilterUtils) {
  "use strict";

  /**
   * UOMValidationDelegate
   *
   * A FilterBarDelegate extension that adds UOM validation behavior to MDC FilterBars including adaptation and personalization variants used in the Table and Chart or FilterBar P13n.
   *
   * The delegate inspects filter fields for an associated Measures or ISOCurrency or Unit annotation and enforces
   * when a value is entered for the leading (measure) field, a corresponding UOM value
   * either exists or is requested from the user. It updates the FilterField value states and required
   * flags, manages message suppression for live searches, and can reorder the visible UOM field next to
   * its leading field in personalization state when required.
   *
   * Key behaviors:
   * - Works with three FilterBar contexts:
   *   - Main (normal) FilterBar
   *   - FilterBar P13n (adaptation UI for FilterBar)
   *   - Table or Chart P13n (adaptation UI for Table or Chart FilterBar)
   * - Discovers UOM relationships using the converted filter field metadata and the Measures.ISOCurrency or Measures.Unit
   *   annotation on the corresponding property.
   * - Determines the validation trigger by inspecting the FilterBar "reason" such as Enter or Go and live mode.
   * - Sets the value state and value state text on the leading (measure) field and marks the UOM FilterField
   *   as required when the leading field has a value but no UOM.
   * - Resets value states when no relevant conditions are present.
   *
   * Usage:
   * - The delegate exposes determineValidationState(filterBar, validationType) which returns a Promise
   *   resolving to a FilterBarValidationStatus. This method is intended to be invoked by the FilterBar
   *   validation lifecycle to decide whether a search should be triggered or whether missing values
   *   should be presented to the user.
   */
  // Type alias representing possible adaptation control element types (FilterBar | Table | Chart)

  const UOMValidationDelegate = {
    /**
     * Function which determines the validation state of the FilterFields on a given FilterBar control.
     * @param filterBar FilterBar control which can be a P13n FilterBar or a regular one
     * @param _mValidation String which consists which type of validation is happening
     * @returns A Promise with a Validation Status which determines if the search is triggered or not
     */
    determineValidationState: async function (filterBar, _mValidation) {
      const adaptationControlElement = UI5Element.getElementById(filterBar.getAssociation("adaptationControl", null));
      const filterType = getFilterBarType(filterBar, adaptationControlElement);
      const {
        hasError,
        hasWarning
      } = await UOMValidationDelegate.validateAllUOMFields(filterBar, filterBar._sReason, filterType, adaptationControlElement);
      if (!hasError && !hasWarning) {
        return new Promise(resolve => {
          //After discussions with MDC we need to use this as a temporary workaround to solve the timing issues related to setting the messages to the filterfield and update of the filterfield valuestate
          //TODO: Remove this workaround once MDC provides an API to set the messages to the filterbar. Will be tracked via BLI.
          setTimeout(() => {
            resolve(filterBar.checkFilters());
          }, 0);
        });
      }
      //if warning or liveMode, we don't open message box
      filterBar.setShowMessages(!hasWarning && !filterBar.getLiveMode());
      return hasError ? FilterBarValidationStatus.FieldInErrorState : filterBar.checkFilters();
    },
    validateAllUOMFields: async function (filterBar, reason, filterType, adaptationControlElement) {
      let hasError = false,
        hasWarning = false;
      let entityTypePath;
      let controlForMetaModel;
      adaptationControlElement = adaptationControlElement ?? UI5Element.getElementById(filterBar.getAssociation("adaptationControl", null));
      filterType = filterType ?? getFilterBarType(filterBar, adaptationControlElement);
      if (filterType === FilterType.FILTERBAR_P13N || filterType === FilterType.TABLE_CHART_P13N) {
        entityTypePath = DelegateUtil.getCustomData(adaptationControlElement, "entityType");
        controlForMetaModel = adaptationControlElement;
      } else {
        entityTypePath = DelegateUtil.getCustomData(filterBar, "entityType");
        controlForMetaModel = filterBar;
      }
      const view = CommonUtils.getTargetView(controlForMetaModel);
      const appComponent = view && CommonUtils.getAppComponent(view);
      const disableStrictUomFiltering = appComponent?.getManifestEntry("sap.fe")?.app?.disableStrictUomFiltering;
      if (disableStrictUomFiltering === true) {
        return {
          hasError: false,
          hasWarning: false
        };
      }
      const internalModel = controlForMetaModel?.getModel("internal");
      const filterBarId = filterBar.getId();
      const allUomValidationMessages = internalModel?.getProperty("/uomValidationMessages") || {};
      const filterBarUomValidationMessages = allUomValidationMessages[filterBarId] || {};

      // Clear existing UOM validation messages for this filterBar from the message model
      removeMessages(internalModel, filterBarId, filterBarUomValidationMessages);
      const model = await DelegateUtil.fetchModel(controlForMetaModel);
      const metaModel = model?.getMetaModel();
      const resourceModel = ResourceModelHelper.getResourceModel(controlForMetaModel);
      const allUOMProperties = getUOMProperties(entityTypePath, filterBar, metaModel);
      if (!allUOMProperties.length || !allUOMProperties.some(uomProp => filterBar?.getConditions()?.[uomProp?.field?.fieldKey]?.length > 0)) {
        uomStateMap = {};
        return {
          hasError: false,
          hasWarning: false
        };
      }
      for (const {
        field,
        uomProperty
      } of allUOMProperties) {
        if (uomProperty) {
          const {
            hasError: fieldHasError,
            hasWarning: fieldHasWarning
          } = validateFilterField(filterBar, field, uomProperty, filterType, resourceModel, adaptationControlElement, reason, internalModel);
          if (fieldHasError) hasError = true;
          if (fieldHasWarning) hasWarning = true;
        }
      }
      uomStateMap = {};
      return {
        hasError,
        hasWarning
      };
    }
  };
  /**
   * Interface representing a unit of measure (UOM) property and its associated field.
   * Used to track relationships between measure fields and their corresponding UOM fields.
   * @interface
   */
  /**
   * Enumeration of possible FilterBar types in the application.
   * Used to determine the validation behavior based on the context where the filter is being used.
   * @enum {string}
   */
  var FilterType = /*#__PURE__*/function (FilterType) {
    /** Regular FilterBar instance (not in personalization mode) */
    FilterType["MAIN"] = "Main";
    /** FilterBar in personalization mode for filter adaptation */
    FilterType["FILTERBAR_P13N"] = "FilterP13n";
    /** FilterBar in personalization mode for Table or Chart adaptation */
    FilterType["TABLE_CHART_P13N"] = "TableChartP13n";
    return FilterType;
  }(FilterType || {});
  let uomStateMap = {};
  let controlMessageProcessor;
  /**
   * Determines the FilterType for a given FilterBar and an optional adaptation control element.
   *
   * The function classifies the filter bar into one of three FilterType values:
   * - FilterType.MAIN: When the provided filterBar is not an adaptation such when it is not an AdaptationFilterBar.
   * - FilterType.FILTERBAR_P13N: When the provided filterBar is an AdaptationFilterBar but the adaptationControlElement
   *   is not a Table or Chart.
   * - FilterType.TABLE_CHART_P13N: When the provided filterBar is an AdaptationFilterBar and the
   *   adaptationControlElement is a Table or Chart.
   * @param filterBar The FilterBar instance to inspect. Expected to implement isA().
   * @param adaptationControlElement The control associated with the adaptation workflow which may be a FilterBar, Table, or Chart. Used to distinguish table or chart personalization from general filter bar personalization.
   * @returns The resolved FilterType enum value representing how the filter bar should be treated.
   */
  function getFilterBarType(filterBar, adaptationControlElement) {
    if (filterBar.isA("sap.ui.mdc.filterbar.p13n.AdaptationFilterBar")) {
      if (adaptationControlElement?.isA("sap.ui.mdc.Table") || adaptationControlElement?.isA("sap.ui.mdc.Chart")) {
        return FilterType.TABLE_CHART_P13N;
      }
      return FilterType.FILTERBAR_P13N;
    }
    return FilterType.MAIN;
  }

  /**
   * Determines whether an error state check should be performed based on the triggering reason,
   * the type of filter context, and the filter bar's configuration.
   *
   * The function returns true for explicit user actions (for example, "Enter", "Go", or "Variant"),
   * when the filter bar is of the table or chart personalization type, or when the filter bar
   * personalization is active and the filter bar is in live mode.
   * @param reason A string describing the event or user action that triggered validation. For example, "Enter", "Go", or "Variant".
   * @param filterType The FilterType enum value indicating the current filter context which is used to detect personalization contexts.
   * @param filterBar Optional FilterBar instance. When provided, its live mode is consulted for certain personalization types.
   * @returns True if an error state should be checked given the inputs. Otherwise, false.
   */
  function shouldCheckErrorState(reason, filterType, filterBar) {
    return reason === "Enter" || reason === "Go" || reason === "Variant" || filterBar?.getLiveMode() || filterType === FilterType.TABLE_CHART_P13N;
  }

  /**
   * Removes existing UOM validation messages for a specific filterBar from the message model
   * and clears the uomValidationMessages property in the internal model.
   * @param internalModel The internal JSONModel containing the validation messages
   * @param filterBarId The ID of the filterBar whose messages should be removed
   * @param filterBarUomValidationMessages The current UOM validation messages for this filterBar
   */
  function removeMessages(internalModel, filterBarId, filterBarUomValidationMessages) {
    if (Object.keys(filterBarUomValidationMessages).length > 0) {
      const allMessages = Messaging.getMessageModel().getData();
      const messagesToRemove = allMessages.filter(m => Object.values(filterBarUomValidationMessages).includes(m.getId()));
      if (messagesToRemove.length) {
        Messaging.removeMessages(messagesToRemove);
      }
      // Clear the uomValidationMessages property for this specific filterBar
      if (internalModel) {
        const allUomValidationMessages = internalModel.getProperty("/uomValidationMessages") || {};
        const updatedMessages = {
          ...allUomValidationMessages
        };
        delete updatedMessages[filterBarId];
        internalModel.setProperty("/uomValidationMessages", updatedMessages);
      }
    }
  }

  /**
   * Function to validate the fields.
   * @param filterBar The control on which the fields exist and whose ID will be used as message storage key
   * @param field The field to be evaluated which has a fieldKey and label
   * @param field.fieldKey
   * @param field.label
   * @param uomProperty The UOM property if any exists for the field
   * @param uomProperty.path
   * @param uomProperty.label
   * @param filterType The type of the filterBar
   * @param resourceModel
   * @param adaptationControlElement
   * @param reason
   * @param internalModel The internal JSONModel for message storage
   * @returns An object consisting of whether we have an error or a warning state
   */
  function validateFilterField(filterBar, field, uomProperty, filterType, resourceModel, adaptationControlElement, reason, internalModel) {
    const {
      fieldKey,
      label
    } = field;
    const associatedUOMPropertyPath = uomProperty.path;
    const filterBarConditions = filterBar.getConditions();
    const isFieldNameInConditions = !!filterBarConditions?.[fieldKey]?.length;
    const isUOMInConditions = associatedUOMPropertyPath ? filterBarConditions?.[associatedUOMPropertyPath]?.length === 1 : false;
    const doesUOMHaveMultipleConditions = associatedUOMPropertyPath ? filterBarConditions?.[associatedUOMPropertyPath]?.length > 1 : false;
    const leadingFilterField = filterBar.getFilterItems().find(item => item.getPropertyKey() === fieldKey);
    const uomFilterField = filterBar.getFilterItems().find(item => item.getPropertyKey() === associatedUOMPropertyPath);
    const messageText = doesUOMHaveMultipleConditions ? resourceModel?.getText?.("FILTERFIELD_VALUE_UOM_MULTIPLE", [uomFilterField?.getLabel() ?? uomProperty?.label]) : resourceModel?.getText?.("FILTERFIELD_VALUE_NO_UOM", [leadingFilterField?.getLabel() ?? label, uomFilterField?.getLabel() ?? uomProperty?.label]);
    if (!isFieldNameInConditions || isFieldNameInConditions && isUOMInConditions) {
      return {
        hasError: false,
        hasWarning: false
      };
    }
    const isError = shouldCheckErrorState(reason, filterType, filterType === FilterType.FILTERBAR_P13N ? adaptationControlElement : filterBar);
    setMessages(leadingFilterField, uomFilterField, isError ? MessageType.Error : MessageType.Warning, messageText, internalModel, filterBar);
    return {
      hasError: isError,
      hasWarning: !isError
    };
  }

  /**
   * Updates the UI state for a leading filter field and its associated UOM filter field.
   * Sets the ValueState and optional ValueStateText on the leading filter (if present),
   * and sets the required flag as well as ValueState and ValueStateText on the UOM filter (if present).
   * @param leadingFilterField The primary (leading) MDCFilterField to update. Only its value state and text are modified.
   * @param uomFilterField The UOM MDCFilterField to update. Its required flag, value state, and text are modified.
   * @param messageType The ValueState to apply such as None, Warning, Error, or Success.
   * @param message Optional descriptive text to display for the value state.
   * @param internalModel The internal JSONModel for message storage.
   * @param filterBar The FilterBar whose ID will be used as the key for message storage in the internal model.
   */
  function setMessages(leadingFilterField, uomFilterField, messageType, message, internalModel, filterBar) {
    const messages = [];
    controlMessageProcessor ??= new ControlMessageProcessor();

    // Get current UOM validation messages from internal model
    const filterBarId = filterBar?.getId() ?? "";
    const allUomValidationMessages = internalModel?.getProperty("/uomValidationMessages") || {};
    const filterBarUomValidationMessages = allUomValidationMessages[filterBarId] || {};
    let leadingMsg;
    if (leadingFilterField) {
      const fieldId = leadingFilterField.getId();
      // Check if message already exists for this field in this filterBar's context
      if (!filterBarUomValidationMessages[fieldId]) {
        leadingMsg = new Message({
          message: message,
          processor: controlMessageProcessor,
          type: messageType,
          target: fieldId + "/conditions"
        });
        messages.push(leadingMsg);
        // Store message ID in filterBar's validation messages
        filterBarUomValidationMessages[fieldId] = leadingMsg.getId();
      }
    }
    if (uomFilterField && uomStateMap[uomFilterField.getId()] !== undefined) {
      if (uomStateMap[uomFilterField.getId()]?.messageType === MessageType.None) {
        setMessageForUOMField(uomFilterField, messageType, message, messages, filterBarUomValidationMessages);
      }
    } else if (uomFilterField) {
      setMessageForUOMField(uomFilterField, messageType, message, messages, filterBarUomValidationMessages);
    }

    // Update internal model with new messages for this filterBar
    if (internalModel) {
      const updatedAllMessages = {
        ...allUomValidationMessages
      };
      updatedAllMessages[filterBarId] = filterBarUomValidationMessages;
      internalModel.setProperty("/uomValidationMessages", updatedAllMessages);
    }
    if (messages.length) {
      Messaging.addMessages(messages);
    }
  }
  function setMessageForUOMField(uomField, messageType, message, messages, uomValidationMessages) {
    const fieldId = uomField.getId();
    // Check if message already exists for this field
    if (uomValidationMessages[fieldId]) {
      return undefined;
    }
    const msg = new Message({
      message: message,
      processor: controlMessageProcessor,
      type: messageType,
      target: fieldId + "/conditions"
    });
    messages.push(msg);
    uomStateMap[fieldId] = {
      messageType
    };

    // Store message ID in uomValidationMessages
    uomValidationMessages[fieldId] = msg.getId();
    return msg;
  }

  /**
   * Retrieves UOM-related properties from a filter control's metadata.
   * Processes filter fields to identify measure fields with associated UOM fields
   * through ISOCurrency or Unit annotations.
   * @param entityTypePath Path to the entity type containing the filter fields
   * @param filterControl The filter control to inspect for UOM properties
   * @param metaModel ODataMetaModel
   * @returns Array of UOMProperty objects containing measure field information
   * and their associated UOM field details
   */
  function getUOMProperties(entityTypePath, filterControl, metaModel) {
    const includeHidden = filterControl.isA("sap.ui.mdc.filterbar.vh.FilterBar") ? true : undefined;
    const filterFields = FilterUtils.getConvertedFilterFields(filterControl, entityTypePath, includeHidden, metaModel);
    const converterContext = FilterUtils.createConverterContext(filterControl, entityTypePath, metaModel);
    return filterFields.map(filterFieldInfo => {
      const annotationPath = filterFieldInfo.annotationPath;
      if (annotationPath) {
        const propertyAnnotations = converterContext.getConvertedTypes().resolvePath(annotationPath).target;
        const uomProperty = propertyAnnotations?.annotations.Measures;
        if (uomProperty?.ISOCurrency || uomProperty?.Unit) {
          let uomPropertyObject;
          const uomPath = uomProperty?.ISOCurrency?.path || uomProperty?.Unit?.path;
          if (uomPath) {
            const uomLabel = filterFields.find(ff => ff.key === uomPath)?.label;
            uomPropertyObject = {
              path: uomPath,
              label: uomLabel ?? uomProperty?.ISOCurrency?.$target?.annotations?.Common?.Label ?? uomProperty?.Unit?.$target?.annotations?.Common?.Label
            };
          }
          return {
            field: {
              fieldKey: filterFieldInfo.key ?? "",
              label: filterFieldInfo.label ?? ""
            },
            uomProperty: uomPropertyObject
          };
        }
      }
      return null;
    }).filter(Boolean);
  }
  return UOMValidationDelegate;
}, false);
//# sourceMappingURL=UOMValidationDelegate-dbg.js.map
