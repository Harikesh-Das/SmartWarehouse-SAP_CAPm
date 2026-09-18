/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/macros/CommonHelper", "sap/fe/macros/DelegateUtil", "sap/ui/core/Element", "sap/ui/model/ListBinding", "sap/ui/model/json/JSONModel", "sap/fe/core/helpers/Adaptation"], function (Common, DelegateUtil, UI5Element, ListBinding, JSONModel, Adaptation) {
  "use strict";

  var filterNavigationForAdaptation = Adaptation.filterNavigationForAdaptation;
  const Delegate = {
    /**
     * @param mPropertyBag Object with parameters as properties
     * @param mPropertyBag.modifier Modifier to harmonize access, creation and manipulation to controls in XML Views and JS Controls
     * @param [mPropertyBag.appComponent] Needed to calculate the correct ID in case you provide a selector
     * @param [mPropertyBag.view] XML node of the view, required for XML case to create nodes and to find elements
     * @param [mPropertyBag.fieldSelector] Selector to calculate the ID for the control that is created
     * @param [mPropertyBag.fieldSelector.id]
     * @param [mPropertyBag.fieldSelector.isLocalId]
     * @param mPropertyBag.bindingPath Runtime binding path the control should be bound to
     * @param mPropertyBag.payload Payload parameter attached to the delegate, undefined if no payload was assigned
     * @param mPropertyBag.controlType Control type of the element the delegate is attached to
     * @param mPropertyBag.aggregationName Name of the aggregation the delegate should provide additional elements
     * @param mPropertyBag.element
     * @param mPropertyBag.parentSelector
     * @returns Map containing the controls to add
     */
    createLayout: async function (mPropertyBag) {
      const oModifier = mPropertyBag.modifier,
        oMetaModel = mPropertyBag.appComponent?.getMetaModel(),
        oForm = mPropertyBag.element;
      let isCollection = false;
      let feView = null;

      // Check for existing fields with the same _flexId
      if (oModifier.targets === "xmlTree") {
        // at preprocessing time
        const fieldsInView = mPropertyBag.view?.getElementsByTagNameNS("sap.fe.macros", "Field");
        if (fieldsInView) {
          for (const field of Array.from(fieldsInView)) {
            if (field.getAttribute("_flexId") === mPropertyBag.fieldSelector?.id) {
              // Field with same _flexId already exists, reject Promise to avoid duplicates
              return Promise.reject(new Error("FormDelegate.createLayout: field already exists"));
            }
          }
          feView = UI5Element.getElementById(mPropertyBag.view.id);
        }
      } else if (oModifier.targets === "jsControlTree") {
        // at runtime
        if (mPropertyBag.fieldSelector?.id && mPropertyBag.view && mPropertyBag.view.byId(mPropertyBag.fieldSelector?.id)) {
          return Promise.reject(new Error("FormDelegate.createLayout: field already exists"));
        }
        feView = mPropertyBag.view;
      }
      const [__, nav] = /([^/]*)\/.*/.exec(mPropertyBag.bindingPath) ?? [];
      if (nav && feView && oMetaModel) {
        const bindingContextPath = feView.getBindingContext()?.getPath();
        if (bindingContextPath) {
          const metaModelContextObject = oMetaModel.getMetaContext(`${bindingContextPath}/${nav}`).getObject();
          isCollection = metaModelContextObject && metaModelContextObject.$isCollection;
        }
      }
      const metaPath = (await DelegateUtil.getCustomDataWithModifier(oForm, "metaPath", oModifier)) ?? "";
      const oFormContainer = mPropertyBag.parentSelector ? mPropertyBag.modifier.bySelector(mPropertyBag.parentSelector, mPropertyBag.appComponent, mPropertyBag.view) : undefined;
      const sNavigationPath = oFormContainer ? await DelegateUtil.getCustomDataWithModifier(oFormContainer, "navigationPath", oModifier) : "";
      let sBindingPath = metaPath.substring(0, metaPath.indexOf("@"));
      // Only append navigationPath if it's not already in the metaPath
      if (sNavigationPath && !sBindingPath.includes(`${sNavigationPath}/`)) {
        sBindingPath = `${sBindingPath}${sNavigationPath}/`;
      }
      const oMetaModelContext = oMetaModel?.getMetaContext(sBindingPath.substring(0, sBindingPath.length - 1));
      const oPropertyContext = oMetaModel?.createBindingContext(`${sBindingPath}${mPropertyBag.bindingPath}`);
      async function fnTemplateFormElement(sFragmentName, oView, navigationPath) {
        const sOnChangeCustomData = await DelegateUtil.getCustomDataWithModifier(oForm, "onChange", oModifier);
        const sDisplayModeCustomData = await DelegateUtil.getCustomDataWithModifier(oForm, "displayMode", oModifier);
        const oThis = new JSONModel({
          // properties and events of Field macro
          _flexId: mPropertyBag.fieldSelector?.id,
          onChange: Common.removeEscapeCharacters(sOnChangeCustomData),
          displayMode: Common.removeEscapeCharacters(sDisplayModeCustomData),
          navigationPath: navigationPath,
          isMultiValueField: isCollection
        });
        const oPreprocessorSettings = {
          bindingContexts: {
            entitySet: oMetaModelContext,
            dataField: oPropertyContext,
            this: oThis.createBindingContext("/")
          },
          models: {
            this: oThis,
            entitySet: oMetaModel,
            metaModel: oMetaModel,
            dataField: oMetaModel
          },
          appComponent: mPropertyBag.appComponent
        };
        return DelegateUtil.templateControlFragment(sFragmentName, oPreprocessorSettings, {
          view: oView
        }, oModifier);
      }
      const oField = await fnTemplateFormElement("sap.fe.macros.form.FormElementFlexibility", mPropertyBag.view, sNavigationPath);
      return {
        control: oField
      };
    },
    // getPropertyInfo is a patched version of ODataV4ReadDelegates to dela with navigationPath
    getPropertyInfo: async function (mPropertyBag) {
      function _isComplexType(mProperty) {
        if (mProperty && mProperty.$Type) {
          if (mProperty.$Type.toLowerCase().indexOf("edm") !== 0) {
            return true;
          }
        }
        return false;
      }
      function _enrichProperty(sPropertyPath, navOriginPath, mElement, mPropertyAnnotations, sEntityType, oElement, sAggregationName) {
        const navigationPropertyPath = (navOriginPath ? navOriginPath + "/" : "") + sPropertyPath;
        const mProp = {
          name: navigationPropertyPath,
          bindingPath: navigationPropertyPath,
          entityType: sEntityType
        };
        // get label information, either via DataFieldDefault annotation (if exists) or Label annotation
        const mDataFieldDefaultAnnotation = mPropertyAnnotations["@com.sap.vocabularies.UI.v1.DataFieldDefault"];
        const sLabel = mDataFieldDefaultAnnotation && mDataFieldDefaultAnnotation.Label || mPropertyAnnotations["@com.sap.vocabularies.Common.v1.Label"];
        mProp.label = sLabel || "[LABEL_MISSING: " + sPropertyPath + "]";
        // evaluate Hidden annotation
        const mHiddenAnnotation = mPropertyAnnotations["@com.sap.vocabularies.UI.v1.Hidden"];
        mProp.hideFromReveal = mHiddenAnnotation;
        if (mHiddenAnnotation && mHiddenAnnotation.$Path) {
          mProp.hideFromReveal = oElement.getBindingContext()?.getProperty(mHiddenAnnotation.$Path);
        }
        // evaluate AdaptationHidden annotation
        if (!mProp.hideFromReveal) {
          mProp.hideFromReveal = mPropertyAnnotations["@com.sap.vocabularies.UI.v1.AdaptationHidden"];
        }
        // evaluate FieldControl annotation
        let mFieldControlAnnotation;
        if (!mProp.hideFromReveal) {
          mFieldControlAnnotation = mPropertyAnnotations["@com.sap.vocabularies.Common.v1.FieldControl"];
          if (mFieldControlAnnotation) {
            mProp.hideFromReveal = mFieldControlAnnotation.$EnumMember === "com.sap.vocabularies.Common.v1.FieldControlType/Hidden";
          }
        }
        // @runtime hidden by field control value = 0
        mFieldControlAnnotation = mPropertyAnnotations["@com.sap.vocabularies.Common.v1.FieldControl"];
        const sFieldControlPath = mFieldControlAnnotation && mFieldControlAnnotation.$Path;
        if (sFieldControlPath && !mProp.hideFromReveal) {
          // if the binding is a list binding, skip the check for field control
          const bListBinding = oElement.getBinding(sAggregationName) instanceof ListBinding;
          if (!bListBinding) {
            const iFieldControlValue = oElement.getBindingContext()?.getProperty(sFieldControlPath);
            mProp.hideFromReveal = iFieldControlValue === 0;
          }
        }
        // no support for DataFieldFor/WithAction and DataFieldFor/WithIntentBasedNavigation within DataFieldDefault annotation
        if (mDataFieldDefaultAnnotation && (mDataFieldDefaultAnnotation.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" || mDataFieldDefaultAnnotation.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" || mDataFieldDefaultAnnotation.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithAction" || mDataFieldDefaultAnnotation.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation")) {
          mProp.unsupported = true;
        }
        // no support for navigation properties and complex properties
        if (_isComplexType(mElement)) {
          mProp.unsupported = true;
        }
        if (navOriginPath) {
          mProp.entityTypeDisplayName = navOriginPath;
        }
        return mProp;
      }

      // Convert metadata format to delegate format.
      function _convertMetadataToDelegateFormat(mODataEntityType, sEntityType, oMetaModel, oElement, sAggregationName, bindingContextPath) {
        let additionalProps = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : [];
        let sourceEntityType = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : undefined;
        let navOriginPath = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : "";
        let nestedLevel = arguments.length > 9 && arguments[9] !== undefined ? arguments[9] : 0;
        let sElementName = "";
        let mElement;
        for (sElementName in mODataEntityType) {
          mElement = mODataEntityType[sElementName];
          // recursion is allowed only for navigation properties at the first level
          if (mElement.$kind === "NavigationProperty" && nestedLevel === 0 && mElement.$Type !== sourceEntityType && !["DraftAdministrativeData", "SiblingEntity"].includes(sElementName)) {
            const oMetaModelContext = oMetaModel.getMetaContext(`${bindingContextPath}/${navOriginPath ? `${navOriginPath}/` : ""}${sElementName}`);
            const metaModelContextObject = oMetaModelContext.getObject();
            const oDataEntityType2 = oMetaModelContext.getObject(metaModelContextObject.$Type);
            _convertMetadataToDelegateFormat(oDataEntityType2, metaModelContextObject.$Type, oMetaModel, oElement, sAggregationName, bindingContextPath, additionalProps, sEntityType, navOriginPath ? `${navOriginPath}/${sElementName}` : sElementName, nestedLevel + 1);
          }
        }
        for (sElementName in mODataEntityType) {
          mElement = mODataEntityType[sElementName];
          const currentElementName = sElementName; // Capture the current value to avoid closure issues

          if (mElement.$kind === "Property") {
            const mPropAnnotations = oMetaModel.getObject("/" + sEntityType + "/" + currentElementName + "@");
            const mProp = _enrichProperty(currentElementName, navOriginPath, mElement, mPropAnnotations, sEntityType, oElement, sAggregationName);
            additionalProps.push(mProp);
          }
        }
        if (navOriginPath === "") {
          const navigationPropertiesFilters = DelegateUtil.getCustomData(oElement, "navigationPropertiesForAdaptationDialog");
          additionalProps = filterNavigationForAdaptation(additionalProps, navigationPropertiesFilters);
        }
        return additionalProps;
      }

      //Get binding path either from payload (if available) or the element's binding context.
      function _getBindingPath(oElement, mPayload) {
        if (mPayload.path) {
          return mPayload.path;
        }
        const vBinding = oElement.getBindingContext();
        if (vBinding) {
          if (oElement.data("navigationPath")) {
            return vBinding.getPath() + "/" + oElement.data("navigationPath");
          }
          return vBinding.getPath();
        }
      }

      //Get all properties of the element's model.
      async function _getODataPropertiesOfModel(oElement, sAggregationName, mPayload) {
        const oModel = oElement.getModel(mPayload.modelName);
        if (oModel) {
          if (oModel.isA("sap.ui.model.odata.v4.ODataModel")) {
            const oMetaModel = oModel.getMetaModel();
            const sBindingContextPath = _getBindingPath(oElement, mPayload);
            if (sBindingContextPath) {
              const oMetaModelContext = oMetaModel.getMetaContext(sBindingContextPath);
              const oMetaModelContextObject = oMetaModelContext.getObject();
              const mODataEntityType = oMetaModelContext.getObject(oMetaModelContextObject.$Type);
              return _convertMetadataToDelegateFormat(mODataEntityType, oMetaModelContextObject.$Type, oMetaModel, oElement, sAggregationName, sBindingContextPath);
            }
          }
        }
        return Promise.resolve([]);
      }
      return Promise.resolve().then(async function () {
        return _getODataPropertiesOfModel(mPropertyBag.element, mPropertyBag.aggregationName, mPropertyBag.payload);
      });
    }
  };
  return Delegate;
}, false);
//# sourceMappingURL=FormDelegate-dbg.js.map
