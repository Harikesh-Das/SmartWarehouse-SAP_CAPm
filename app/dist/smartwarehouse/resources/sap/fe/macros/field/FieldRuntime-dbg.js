/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/ObjectPath", "sap/fe/core/CommonUtils", "sap/fe/core/helpers/FPMHelper", "sap/fe/macros/CommonHelper", "sap/m/HBox", "sap/m/table/Util", "sap/ui/core/Lib", "sap/ui/model/Filter", "sap/ui/model/Sorter", "./FieldRuntimeHelper"], function (Log, ObjectPath, CommonUtils, FPMHelper, CommonHelper, HBox, Util, Library, Filter, Sorter, FieldRuntimeHelper) {
  "use strict";

  /**
   * Static class used by "sap.ui.mdc.Field" during runtime
   * @private
   */
  const FieldRuntime = {
    uploadPromises: {},
    creatingInactiveRow: false,
    /**
     * This is a formatter in disguise.
     * @param sPropertyPath
     * @param sSemanticKeyHasDraftIndicator
     * @param HasDraftEntity
     * @param IsActiveEntity
     * @param hideDraftInfo
     * @returns True if the draft indicator should be displayed.
     */
    isDraftIndicatorVisible: function (sPropertyPath, sSemanticKeyHasDraftIndicator, HasDraftEntity, IsActiveEntity, hideDraftInfo) {
      if (IsActiveEntity !== undefined && HasDraftEntity !== undefined && (!IsActiveEntity || HasDraftEntity) && !hideDraftInfo) {
        return sPropertyPath === sSemanticKeyHasDraftIndicator;
      } else {
        return false;
      }
    },
    /**
     * Handler for the validateFieldGroup event.
     * @param oEvent The event object passed by the validateFieldGroup event
     */
    onValidateFieldGroup: function (oEvent) {
      const oSourceField = oEvent.getSource();
      const view = CommonUtils.getTargetView(oSourceField),
        controller = view.getController();
      const oFEController = FieldRuntimeHelper.getExtensionController(controller);
      oFEController.sideEffects.handleFieldGroupChange(oEvent);
    },
    _fnFixHashQueryString: function (sCurrentHash) {
      if (sCurrentHash?.includes("?")) {
        // sCurrentHash can contain query string, cut it off!
        sCurrentHash = sCurrentHash.split("?")[0];
      }
      return sCurrentHash;
    },
    /**
     * Creates filters for ValueList requests based on ValueListParameterIn and ValueListParameterInOut annotations.
     * @param valueListInfo The ValueList annotation information
     * @param propertyId The ID property of the IdAndDesciption of the text arrangement annotation
     * @param propertyValue The value for the propertyId property
     * @param bindingContext The binding context to get values from
     * @returns Array of filters for the ValueList request
     */
    createValueListFilters: function (valueListInfo, propertyId, propertyValue, bindingContext) {
      // Start with the key filter
      const filters = [new Filter({
        path: propertyId,
        operator: "EQ",
        value1: propertyValue
      })];
      if (bindingContext && valueListInfo.Parameters) {
        const relevantParameters = valueListInfo.Parameters.filter(parameter => {
          const isInOrInOut = parameter.$Type === "com.sap.vocabularies.Common.v1.ValueListParameterIn" || parameter.$Type === "com.sap.vocabularies.Common.v1.ValueListParameterInOut";
          return isInOrInOut && parameter.LocalDataProperty?.$PropertyPath && parameter.ValueListProperty && parameter.ValueListProperty !== propertyId;
        });
        relevantParameters.forEach(parameter => {
          const localValue = bindingContext.getProperty(parameter.LocalDataProperty.$PropertyPath);
          if (localValue !== undefined && localValue !== null && localValue !== "") {
            filters.push(new Filter({
              path: parameter.ValueListProperty,
              operator: "EQ",
              value1: localValue
            }));
          }
        });
      }
      return filters;
    },
    /**
     * Method to retrieve text from the value list for DataField.
     * This is a formatter in disguise.
     * @param sPropertyValue The property value of the data field.
     * @param sPropertyFullPath The full path to the property in the metadata.
     * @param sDisplayFormat The display format for the data field.
     * @returns The formatted value based on the display format.
     */
    retrieveTextFromValueList: async function (sPropertyValue, sPropertyFullPath, sDisplayFormat) {
      let sTextProperty;
      let oMetaModel;
      let sPropertyName;
      if (sPropertyValue) {
        oMetaModel = this.getModel()?.getMetaModel() || CommonHelper.getMetaModel();
        sPropertyName = oMetaModel.getObject(`${sPropertyFullPath}@sapui.name`);
        const bindingContext = this.getBindingContext();
        return oMetaModel.requestValueListInfo(sPropertyFullPath, true).then(function (mValueListInfo) {
          // take the "" one if exists, otherwise take the first one in the object TODO: to be discussed
          const oValueListInfo = mValueListInfo[mValueListInfo[""] ? "" : Object.keys(mValueListInfo)[0]];
          const oValueListModel = oValueListInfo.$model;
          const oMetaModelValueList = oValueListModel.getMetaModel();
          const oParamWithKey = oValueListInfo.Parameters.find(function (oParameter) {
            return oParameter.LocalDataProperty && oParameter.LocalDataProperty.$PropertyPath === sPropertyName;
          });
          if (oParamWithKey && !oParamWithKey.ValueListProperty) {
            throw new Error(`Inconsistent value help annotation for ${sPropertyName}`);
          }
          const oTextAnnotation = oMetaModelValueList.getObject(`/${oValueListInfo.CollectionPath}/${oParamWithKey.ValueListProperty}@com.sap.vocabularies.Common.v1.Text`);
          if (oTextAnnotation && oTextAnnotation.$Path) {
            sTextProperty = oTextAnnotation.$Path;
            const filters = FieldRuntime.createValueListFilters(oValueListInfo, oParamWithKey.ValueListProperty, sPropertyValue, bindingContext);
            const listBinding = oValueListModel.bindList(`/${oValueListInfo.CollectionPath}`, undefined, undefined, filters, {
              $select: sTextProperty
            });
            return listBinding.requestContexts(0, 2);
          } else {
            sDisplayFormat = "Value";
            return sPropertyValue;
          }
        }).then(function (aContexts) {
          const sDescription = sTextProperty ? aContexts[0]?.getObject()[sTextProperty] : "";
          if (!sDescription) {
            return sPropertyValue;
          }
          switch (sDisplayFormat) {
            case "Description":
              return sDescription || sPropertyValue;
            case "DescriptionValue":
              return Library.getResourceBundleFor("sap.fe.core").getText("C_FORMAT_FOR_TEXT_ARRANGEMENT", [sDescription, sPropertyValue]);
            case "ValueDescription":
              return Library.getResourceBundleFor("sap.fe.core").getText("C_FORMAT_FOR_TEXT_ARRANGEMENT", [sPropertyValue, sDescription]);
            default:
              return sPropertyValue;
          }
        }).catch(function (oError) {
          const errorObj = oError;
          const sMsg = errorObj.status && errorObj.status === 404 ? `Metadata not found (${errorObj.status}) for value help of property ${sPropertyFullPath}` : errorObj.message;
          Log.error(sMsg);
        });
      }
      return sPropertyValue;
    },
    displayAggregateDetails: async function (event, aggregatedPropertyPath) {
      if (!aggregatedPropertyPath) {
        return;
      }
      const link = event.getSource();
      const analyticalTable = FPMHelper.getMdcTable(link);
      const popoverId = `${analyticalTable.getId()}-multiUnitPopover`;
      if (analyticalTable.getDependents().some(dependent => dependent.getId() === popoverId)) {
        // Popover is already open for the same link (otherwise the dependent would have been removed and destroyed on close)
        return;
      }
      const rowContext = link.getBindingContext();
      const tableRowBinding = rowContext.getBinding();

      // Get the filters corresponding to the total row
      const rowContextData = rowContext.getObject();
      const rowSpecificFilter = [];
      const rowFilter = rowContext.getFilter();
      if (rowFilter) {
        rowSpecificFilter.push(rowFilter);
      }

      // Add the filters applied to the original table
      const allFilters = rowSpecificFilter.concat(tableRowBinding.getFilters("Application"), tableRowBinding.getFilters("Control"));

      // Calculate $$aggregation parameters for the table in the popover (aggregate amount, group by currency/unit)
      const aggregation = tableRowBinding.getAggregation();
      const unitOrCurrencyName = aggregation.aggregate[aggregatedPropertyPath].unit;
      const group = {};
      group[unitOrCurrencyName] = {};
      const aggregate = {};
      aggregate[aggregatedPropertyPath] = {
        grandTotal: false,
        subtotals: false,
        unit: unitOrCurrencyName
      };

      // The item displayed in the table in the popover is a copy of the item displayed in the table
      const tableItem = link.getDependents()[0].clone();
      const currencyOrQuantityEnabledLayout = new HBox({
        renderType: "Bare",
        justifyContent: "End",
        items: [tableItem]
      });
      const aggregationParameters = {
        group,
        aggregate
      };
      if (aggregation.search) {
        aggregationParameters.search = aggregation.search;
      }
      const oItemsBindingInfo = {
        path: tableRowBinding.getResolvedPath(),
        filters: allFilters,
        parameters: {
          $$aggregation: aggregationParameters
        },
        sorter: new Sorter(unitOrCurrencyName, false) // Order by currency
      };
      const isPopoverForGrandTotal = rowContextData["@$ui5.node.level"] === 0;
      const popover = await Util.createOrUpdateMultiUnitPopover(popoverId, {
        control: analyticalTable,
        grandTotal: isPopoverForGrandTotal,
        itemsBindingInfo: oItemsBindingInfo,
        listItemContentTemplate: currencyOrQuantityEnabledLayout
      });

      // We force the popover to be non-editable by providing a dedicated ui context.
      // This is required to make sure the fields inside the popover are not editable
      const tableUIContext = analyticalTable.getBindingContext("ui");
      const popoverUIContext = tableUIContext?.getModel().bindContext(`${popover.getId()}`, tableUIContext).getBoundContext();
      popover.setBindingContext(popoverUIContext, "ui");
      popoverUIContext?.setProperty("", {
        isEditable: false
      });
      analyticalTable.addDependent(popover);
      const fnOnClose = () => {
        analyticalTable.removeDependent(popover);
        popover.detachEvent("afterClose", fnOnClose);
        popover.destroy();
      };
      popover.attachEvent("afterClose", fnOnClose);
      popover.openBy(link);
    }
  };
  ObjectPath.set("sap.fe.macros.field.FieldRuntime", FieldRuntime);
  return FieldRuntime;
}, false);
//# sourceMappingURL=FieldRuntime-dbg.js.map
