/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/base/jsx-runtime/jsx", "sap/fe/core/controls/Any", "sap/fe/core/controls/DataWatcher", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/MetaPath", "sap/fe/core/helpers/PromiseKeeper", "sap/fe/core/helpers/TypeGuards", "sap/ui/core/Element", "sap/ui/model/BindingMode", "sap/ui/model/json/JSONModel", "sap/ui/model/odata/type/Raw"], function (Log, BindingToolkit, jsx, Any, DataWatcher, MetaModelConverter, MetaPath, PromiseKeeper, TypeGuards, UI5Element, BindingMode, JSONModel, Raw) {
  "use strict";

  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var isNavigationProperty = TypeGuards.isNavigationProperty;
  var isEntitySet = TypeGuards.isEntitySet;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var convertTypes = MetaModelConverter.convertTypes;
  var compileExpression = BindingToolkit.compileExpression;
  /* This class contains helpers to be used at runtime to retrieve further information on the model */
  // TODO: Right now recommendations is not part of the UI vocabulary.
  // hence we are adding it to the type.
  // once this becomes part of the UI vocabulary then we can remove this.

  const ModelHelper = {
    // global switch to disable the collaboration draft by a private manifest flag
    // this allows customers to disable the collaboration draft in case we run into issues with the first delivery
    // this will be removed with the next S/4 release
    disableCollaborationDraft: false,
    /**
     * Method to determine if the programming model is sticky.
     * @param metaModel ODataModelMetaModel to check for sticky enabled entity
     * @returns Returns true if sticky, else false
     */
    isStickySessionSupported: function (metaModel) {
      const entityContainer = metaModel.getObject("/");
      for (const entitySetName in entityContainer) {
        if (entityContainer[entitySetName].$kind === "EntitySet" && metaModel.getObject(`/${entitySetName}@com.sap.vocabularies.Session.v1.StickySessionSupported`)) {
          return true;
        }
      }
      return false;
    },
    /**
     * Method to determine if the programming model is draft.
     * @param metaModel ODataModelMetaModel of the context for which draft support shall be checked
     * @param path Path for which draft support shall be checked
     * @returns Returns true if draft, else false
     */
    isDraftSupported: function (metaModel, path) {
      const metaContext = metaModel.getMetaContext(path);
      const objectPath = getInvolvedDataModelObjects(metaContext);
      return this.isObjectPathDraftSupported(objectPath);
    },
    /**
     * Checks if draft is supported for the data model object path.
     * @param dataModelObjectPath
     * @returns `true` if it is supported
     */
    isObjectPathDraftSupported: function (dataModelObjectPath) {
      const currentEntitySet = dataModelObjectPath.targetEntitySet;
      const bIsDraftRoot = ModelHelper.isDraftRoot(currentEntitySet);
      const bIsDraftNode = ModelHelper.isDraftNode(currentEntitySet);
      const bIsDraftParentEntityForContainment = isNavigationProperty(dataModelObjectPath.targetObject) && dataModelObjectPath.targetObject?.containsTarget && (dataModelObjectPath.startingEntitySet?.annotations?.Common?.DraftRoot || dataModelObjectPath.startingEntitySet?.annotations?.Common?.DraftNode) ? true : false;
      const hasIsActiveEntityKey = dataModelObjectPath.targetEntityType.keys?.some(key => key.name === "IsActiveEntity");
      return bIsDraftRoot || bIsDraftNode || !currentEntitySet && bIsDraftParentEntityForContainment && hasIsActiveEntityKey;
    },
    isMetaPathDraftSupported: function (dataModelObjectPath) {
      const currentEntitySet = dataModelObjectPath.getClosestEntitySet();
      const bIsDraftRoot = ModelHelper.isDraftRoot(currentEntitySet);
      const bIsDraftNode = ModelHelper.isDraftNode(currentEntitySet);
      return bIsDraftRoot || bIsDraftNode;
    },
    /**
     * Returns whether or not we have a ShareAction in any EntitySet of the application.
     * @param converterContext The instance of the converter context
     * @returns True if the annotation exists. False otherwise.
     */
    isCollaborationDraftSupportedFromConverterContext(converterContext) {
      return converterContext.getConvertedTypes().entitySets.some(entitySet => {
        return entitySet.annotations?.Common?.DraftRoot?.ShareAction !== undefined;
      });
    },
    /**
     * Method to determine if the service, supports collaboration draft.
     * @param metaObject MetaObject to be used for determination
     * @param templateInterface API provided by UI5 templating if used
     * @param templateInterface.context Context of the template
     * @returns Returns true if the service supports collaboration draft, else false
     */
    isCollaborationDraftSupported: function (metaObject, templateInterface) {
      if (!ModelHelper.disableCollaborationDraft) {
        const oMetaModel = templateInterface?.context?.getModel() || metaObject;
        if (oMetaModel.__$feIsCollaborationDraftEnabled !== undefined) {
          return oMetaModel.__$feIsCollaborationDraftEnabled;
        }
        const oEntityContainer = oMetaModel.getObject("/");
        for (const sEntitySet in oEntityContainer) {
          if (oEntityContainer[sEntitySet].$kind === "EntitySet" && oMetaModel.getObject(`/${sEntitySet}@com.sap.vocabularies.Common.v1.DraftRoot/ShareAction`)) {
            oMetaModel.__$feIsCollaborationDraftEnabled = true;
            return true;
          }
        }
        oMetaModel.__$feIsCollaborationDraftEnabled = false;
      }
      return false;
    },
    /**
     * Method to get the path of the DraftRoot path according to the provided context.
     * @param oContext OdataModel context
     * @returns Returns the path of the draftRoot entity, or undefined if no draftRoot is found
     */
    getDraftRootPath: function (oContext) {
      const oMetaModel = oContext.getModel().getMetaModel();
      const getRootPath = function (sPath, model) {
        let firstIteration = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
        const sIterationPath = firstIteration ? sPath : new RegExp(/.*(?=\/)/).exec(sPath)?.[0]; // *Regex to get the ancestor
        if (sIterationPath && sIterationPath !== "/") {
          const sEntityPath = oMetaModel.getMetaPath(sIterationPath);
          const mDataModel = MetaModelConverter.getInvolvedDataModelObjects(oMetaModel.getContext(sEntityPath));
          if (mDataModel.targetEntitySet?.annotations.Common?.DraftRoot) {
            return sIterationPath;
          }
          return getRootPath(sIterationPath, model, false);
        }
        return undefined;
      };
      return getRootPath(oContext.getPath(), oContext.getModel());
    },
    /**
     * Method to get the path of the StickyRoot path according to the provided context.
     * @param oContext OdataModel context
     * @returns Returns the path of the StickyRoot entity, or undefined if no StickyRoot is found
     */
    getStickyRootPath: function (oContext) {
      const oMetaModel = oContext.getModel().getMetaModel();
      const getRootPath = function (sPath, model) {
        let firstIteration = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
        const sIterationPath = firstIteration ? sPath : new RegExp(/.*(?=\/)/).exec(sPath)?.[0]; // *Regex to get the ancestor
        if (oMetaModel && sIterationPath && sIterationPath !== "/") {
          const sEntityPath = oMetaModel.getMetaPath(sIterationPath);
          const mDataModel = MetaModelConverter.getInvolvedDataModelObjects(oMetaModel.getContext(sEntityPath));
          if (mDataModel.startingEntitySet === mDataModel.targetEntitySet && mDataModel.targetEntitySet?.annotations?.Session?.StickySessionSupported) {
            return sIterationPath;
          }
          return getRootPath(sIterationPath, model, false);
        }
        return undefined;
      };
      return getRootPath(oContext.getPath(), oContext.getModel());
    },
    /**
     * Returns the path to the target entity set with navigation property binding.
     * @param oContext Context for which the target entity set will be determined
     * @returns Returns the path to the target entity set
     */
    getTargetEntitySet: function (oContext) {
      const sPath = oContext.getPath();
      if (oContext.getObject("$kind") === "EntitySet" || oContext.getObject("$kind") === "Action" || oContext.getObject("0/$kind") === "Action") {
        return sPath;
      }
      const sEntitySetPath = ModelHelper.getEntitySetPath(sPath);
      return `/${oContext.getObject(sEntitySetPath)}`;
    },
    /**
     * Returns complete path to the entity set via using navigation property binding. Note: To be used only after the metamodel has loaded.
     * @param path Path for which complete entitySet path needs to be determined from entityType path
     * @param odataMetaModel Metamodel to be used.(Optional in normal scenarios, but needed for parameterized service scenarios)
     * @returns Returns complete path to the entity set
     */
    getEntitySetPath: function (path, odataMetaModel) {
      let entitySetPath = "";
      if (!odataMetaModel) {
        // Previous implementation for getting entitySetPath from entityTypePath
        entitySetPath = `/${path.split("/").filter(ModelHelper.filterOutNavPropBinding).join("/$NavigationPropertyBinding/")}`;
      } else {
        // Calculating the entitySetPath from MetaModel.
        const pathParts = path.split("/").filter(ModelHelper.filterOutNavPropBinding);
        if (pathParts.length > 1) {
          const initialPathObject = {
            growingPath: "/",
            pendingNavPropBinding: ""
          };
          const pathObject = pathParts.reduce((pathUnderConstruction, pathPart, idx) => {
            const delimiter = !!idx && "/$NavigationPropertyBinding/" || "";
            let {
              growingPath,
              pendingNavPropBinding
            } = pathUnderConstruction;
            const tempPath = growingPath + delimiter;
            const navPropBindings = odataMetaModel.getObject(tempPath);
            const navPropBindingToCheck = pendingNavPropBinding ? `${pendingNavPropBinding}/${pathPart}` : pathPart;
            if (navPropBindings && Object.keys(navPropBindings).length > 0 && navPropBindings.hasOwnProperty(navPropBindingToCheck)) {
              growingPath = tempPath + navPropBindingToCheck.replace("/", "%2F");
              pendingNavPropBinding = "";
            } else {
              pendingNavPropBinding += pendingNavPropBinding ? `/${pathPart}` : pathPart;
            }
            return {
              growingPath,
              pendingNavPropBinding
            };
          }, initialPathObject);
          entitySetPath = pathObject.growingPath;
        } else {
          entitySetPath = `/${pathParts[0]}`;
        }
      }
      return entitySetPath;
    },
    /**
     * Gets the path for the items property of MultiValueField parameters.
     * @param oParameter Action Parameter
     * @returns Returns the complete model path for the items property of MultiValueField parameters
     */
    getActionParameterItemsModelPath: function (oParameter) {
      return oParameter && oParameter.$Name ? `{path: 'mvfview>/${oParameter.$Name}'}` : undefined;
    },
    filterOutNavPropBinding: function (sPathPart) {
      return sPathPart !== "" && sPathPart !== "$NavigationPropertyBinding";
    },
    /**
     * Adds a setProperty to the created binding contexts of the internal JSON model.
     * @param Internal JSON Model which is enhanced
     */

    enhanceInternalJSONModel: function (oInternalModel) {
      const fnSetProperty = oInternalModel.setProperty.bind(oInternalModel);
      oInternalModel.setProperty = function (propertyPath, value, oContext, bAsyncUpdate) {
        if (oContext && oContext.getObject() === undefined) {
          // initialize
          fnSetProperty(oContext.getPath(), {});
        }
        const propertyPathSplit = propertyPath.split("/");
        let path = oContext?.getPath().replace(/\/$/, "") ?? ""; // Remove slash if it is at the end
        // let's ensure that sub objects are initialized
        const startIndex = propertyPath.startsWith("/") ? 1 : 0;
        for (let i = startIndex; i < propertyPathSplit.length - 1; i++) {
          path = `${path}/${propertyPathSplit[i]}`;
          if (this.getProperty(path, oContext) === undefined) {
            // initialize
            fnSetProperty(path, {});
          }
        }
        return fnSetProperty(propertyPath, value, oContext, bAsyncUpdate);
      };
      const fnBindContext = oInternalModel.bindContext;
      oInternalModel.bindContext = function (sPath, context, mParameters, oEvents) {
        const contextBinding = fnBindContext.apply(this, [sPath, context, mParameters, oEvents]);
        const fnGetBoundContext = contextBinding.getBoundContext;
        contextBinding.getBoundContext = function () {
          const oBoundContext = fnGetBoundContext.apply(this);
          if (oBoundContext) {
            oBoundContext.setProperty = function (propertyPath, value) {
              if (this.getObject() === undefined) {
                // initialize
                this.getModel().setProperty(this.getPath(), {});
              }
              const propertyPathSplit = propertyPath.split("/");
              let path = this.getPath().replace(/\/$/, ""); // Remove slash if it is at the end
              // let's ensure that sub objects are initialized
              for (let i = 0; i < propertyPathSplit.length - 1; i++) {
                path = `${path}/${propertyPathSplit[i]}`;
                if (this.getModel().getProperty(path) === undefined) {
                  // initialize
                  this.getModel().setProperty(path, {});
                }
              }
              this.getModel().setProperty(propertyPath, value, this);
            };
          }
          return oBoundContext;
        };
        return contextBinding;
      };
    },
    /**
     * Adds an handler on propertyChange.
     * The property "/editMode" is changed according to property '/isEditable' when this last one is set
     * in order to be compliant with former versions where building blocks use the property "/editMode"
     * @param uiModel JSON Model which is enhanced
     * @param library Core library of SAP Fiori elements
     */

    enhanceUiJSONModel: function (uiModel, library) {
      const fnSetProperty = uiModel.setProperty;
      uiModel.setProperty = function (path, value, context, asyncUpdate) {
        if (path === "/isEditable") {
          uiModel.setProperty("/editMode", value ? library.EditMode.Editable : library.EditMode.Display, context, asyncUpdate);
        }
        return fnSetProperty.apply(this, [path, value, context, asyncUpdate]);
      };
    },
    enhanceViewJSONModel: function (viewModel) {
      const fnGetObject = viewModel._getObject;
      viewModel._getObject = function (sPath, oContext) {
        if (sPath === undefined || sPath === "") {
          sPath = "/";
        }
        return fnGetObject.apply(this, [sPath, oContext]);
      };
    },
    /**
     * Returns whether filtering on the table is case sensitive.
     * @param oMetaModel The instance of the meta model
     * @param filterFunctions Filter functions supported by the service
     * @returns Returns 'false' if the service supports 'tolower', else 'true'
     */
    isFilteringCaseSensitive: function (oMetaModel, filterFunctions) {
      const _filterFunctions = filterFunctions ?? oMetaModel?.getObject("/@Org.OData.Capabilities.V1.FilterFunctions");
      if (!_filterFunctions) {
        // if no filters function defined in service, we assume that the service is case sensitive
        return true;
      }
      return _filterFunctions.indexOf("tolower") === -1;
    },
    /**
     * Get MetaPath for the context.
     * @param oContext Context to be used
     * @returns Returns the metapath for the context.
     */
    getMetaPathForContext: function (oContext) {
      const oModel = oContext.getModel(),
        oMetaModel = oModel.getMetaModel(),
        sPath = oContext.getPath();
      return oMetaModel && sPath && oMetaModel.getMetaPath(sPath);
    },
    /**
     * Get MetaPath for the context.
     * @param contextPath MetaPath to be used
     * @returns Returns the root entity set path.
     */
    getRootEntitySetPath: function (contextPath) {
      let rootEntitySetPath = "";
      const aPaths = contextPath ? contextPath.split("/") : [];
      if (aPaths.length > 1) {
        rootEntitySetPath = aPaths[1];
      }
      return rootEntitySetPath;
    },
    /**
     * Get MetaPath for the listBinding.
     * @param oView View of the control using listBinding
     * @param vListBinding ODataListBinding object or the binding path for a temporary list binding
     * @returns Returns the metapath for the listbinding.
     */
    getAbsoluteMetaPathForListBinding: function (oView, vListBinding) {
      const oMetaModel = oView.getModel().getMetaModel();
      let sMetaPath;
      if (typeof vListBinding === "string") {
        if (vListBinding.startsWith("/")) {
          // absolute path
          sMetaPath = oMetaModel.getMetaPath(vListBinding);
        } else {
          // relative path
          const oBindingContext = oView.getBindingContext();
          const sRootContextPath = oBindingContext.getPath();
          sMetaPath = oMetaModel.getMetaPath(`${sRootContextPath}/${vListBinding}`);
        }
      } else {
        // we already get a list binding use this one
        const oBinding = vListBinding;
        const oRootBinding = oBinding.getRootBinding();
        if (oBinding === oRootBinding) {
          // absolute path
          sMetaPath = oMetaModel.getMetaPath(oBinding.getPath());
        } else {
          // relative path
          const sRootBindingPath = oRootBinding.getPath();
          const sRelativePath = oBinding.getPath();
          if (vListBinding.getContext() === oView.getBindingContext()) {
            sMetaPath = oMetaModel.getMetaPath(`${sRootBindingPath}/${sRelativePath}`);
          } else {
            //On the case of a multi value field, the context of the list binding is not the same as the view binding context.
            // we have to get the meta path from the context of the list binding
            sMetaPath = `${oMetaModel.getMetaPath(vListBinding.getContext().getPath())}/${sRelativePath}`;
          }
        }
      }
      return sMetaPath;
    },
    /**
     * Get the relative metaPath from the view for the listBinding.
     * @param parentContext Context of the view or the parent control
     * @param listBinding ODataListBinding object or the binding path for a temporary list binding
     * @returns Returns the metaPath for the ODataListBinding.
     */
    getRelativeMetaPathForListBinding(parentContext, listBinding) {
      if (!parentContext) {
        return;
      }
      const listBindingContext = listBinding.getContext();
      const parentContextPath = parentContext.getPath();

      //For absolute path we return undefined
      if (!listBindingContext) {
        return;
      }
      // if the list binding context is the parent context, we return the list binding path
      if (listBindingContext.getPath() === parentContextPath) {
        return listBinding.getPath();
      }
      // if the list binding context is not the parent context, we try to find the relative path
      if (listBindingContext.getPath().startsWith(parentContextPath)) {
        const metaModel = listBinding.getModel().getMetaModel();
        const viewBindingMetaPath = metaModel.getMetaPath(parentContextPath);
        return `${metaModel.getMetaPath(listBindingContext.getPath())}/${listBinding.getPath()}`.replace(`${viewBindingMetaPath}/`, "");
      }
      // otherwise, we return undefined since the list binding is not relative to the view binding context
      return;
    },
    /**
     * Method to determine whether the argument is a draft root.
     * @param entitySet EntitySet | Singleton | undefined
     * @returns Whether the argument is a draft root
     */
    isDraftRoot: function (entitySet) {
      return this.getDraftRoot(entitySet) !== undefined;
    },
    /**
     * Method to determine whether the argument is a draft node.
     * @param entitySet EntitySet | Singleton | undefined
     * @returns Whether the argument is a draft node
     */
    isDraftNode: function (entitySet) {
      return this.getDraftNode(entitySet) !== undefined;
    },
    /**
     * Method to determine whether the argument is a sticky session root.
     * @param entitySet EntitySet | Singleton | undefined
     * @returns Whether the argument is a sticky session root
     */
    isSticky: function (entitySet) {
      return this.getStickySession(entitySet) !== undefined;
    },
    /**
     * Method to determine if entity is updatable or not.
     * @param entitySet EntitySet | Singleton | undefined
     * @param entityType EntityType
     * @returns True if updatable else false
     */
    isUpdateHidden: function (entitySet, entityType) {
      if (isEntitySet(entitySet)) {
        return entitySet.annotations.UI?.UpdateHidden ?? entityType?.annotations.UI?.UpdateHidden;
      }
    },
    /**
     * Gets the @Common.DraftRoot annotation if the argument is an EntitySet.
     * @param entitySet EntitySet | Singleton | undefined
     * @returns DraftRoot
     */
    getDraftRoot: function (entitySet) {
      return isEntitySet(entitySet) ? entitySet.annotations.Common?.DraftRoot : undefined;
    },
    /**
     * Gets the @Common.DraftNode annotation if the argument is an EntitySet.
     * @param entitySet EntitySet | Singleton | undefined
     * @returns DraftRoot
     */
    getDraftNode: function (entitySet) {
      return isEntitySet(entitySet) ? entitySet.annotations.Common?.DraftNode : undefined;
    },
    /**
     * Helper method to get sticky session.
     * @param entitySet EntitySet | Singleton | undefined
     * @returns Session StickySessionSupported
     */
    getStickySession: function (entitySet) {
      return isEntitySet(entitySet) ? entitySet.annotations.Session?.StickySessionSupported : undefined;
    },
    /**
     * Method to get the visibility state of delete button.
     * @param entitySet EntitySet | Singleton | undefined
     * @param entityType EntityType
     * @returns True if delete button is hidden
     */
    getDeleteHidden: function (entitySet, entityType) {
      if (isEntitySet(entitySet)) {
        return entitySet.annotations.UI?.DeleteHidden ?? entityType.annotations.UI?.DeleteHidden;
      }
    },
    /**
     * This function will return metapath for the given list binding.
     * @param listBinding ListBinding.
     * @returns MetaPath
     */
    getAbsolutePathFromListBinding(listBinding) {
      const metamodel = listBinding.getModel().getMetaModel();
      let metaPath;
      const rootBinding = listBinding.getRootBinding();
      if (listBinding === rootBinding) {
        metaPath = metamodel.getMetaPath(listBinding.getPath());
      } else {
        const rootBindingPath = rootBinding?.getPath();
        const relativePath = listBinding.getPath();
        metaPath = metamodel.getMetaPath(`${rootBindingPath}/${relativePath}`);
      }
      return metaPath;
    },
    enhanceODataModel(odataModel, appComponent) {
      odataModel.virtualPropertyBindingRegistry = new Array();
      const fnMessage = odataModel.setMessages;
      const localAnnotationModel = new JSONModel({});
      localAnnotationModel.setDefaultBindingMode(BindingMode.OneWay);
      const baseSetProperty = localAnnotationModel.setProperty;
      const baseGetProperty = localAnnotationModel.getProperty;
      localAnnotationModel.getProperty = function (path, context) {
        const [propertyName, annotationType] = path.split("@$ui5.fe.");
        if (context && context.isTransient() !== true && (context.getIndex() === undefined || context.getIndex() >= 0) && annotationType === "@Common/ExternalID") {
          const contextObject = context.getObject();
          if (contextObject) {
            const metaPath = new MetaPath(convertTypes(odataModel.getMetaModel()), odataModel.getMetaModel().getMetaPath(context.getPath()), odataModel.getMetaModel().getMetaPath(context.getPath()));
            const externalIdProperty = metaPath.getMetaPathForPath(metaPath.getPath() + "/" + propertyName)?.getTarget().annotations.Common?.ExternalID;
            if (isPathAnnotationExpression(externalIdProperty)) {
              return context.getObject(externalIdProperty.path);
            } else {
              return context.getObject(propertyName);
            }
          } else {
            return undefined;
          }
        } else if (context && annotationType === "contextPath") {
          return context.getPath();
        }
        return baseGetProperty.apply(this, [path, context]);
      };
      localAnnotationModel.setProperty = function (path, value, context, asyncUpdate) {
        let fullPath = path;
        if (context) {
          fullPath = context.getPath(path);
        }
        const _refreshLocalModel = () => {
          this.refresh();
        };
        const [propertyName, annotationType] = path.split("@$ui5.fe.");
        if (context && annotationType === "@Common/ExternalID") {
          context.setProperty(propertyName, value, undefined, true);
          // refreshing ExternalID and text properties (paths need to be determined generically)
          const metaPath = new MetaPath(convertTypes(odataModel.getMetaModel()), odataModel.getMetaModel().getMetaPath(context.getPath()), odataModel.getMetaModel().getMetaPath(context.getPath()));
          const externalIdProperty = metaPath.getMetaPathForPath(metaPath.getPath() + "/" + propertyName)?.getTarget().annotations.Common?.ExternalID;
          if (isPathAnnotationExpression(externalIdProperty)) {
            const externalIdPropPath = externalIdProperty.path;
            const navPropertyPath = externalIdPropPath.substring(0, externalIdPropPath.lastIndexOf("/"));
            const propertiesToRequest = [navPropertyPath || externalIdPropPath]; // if the externalIdPropPath does not contain a navigation property, we request the property directly which is under main entity
            const textProperty = metaPath.getMetaPathForPath(metaPath.getPath() + "/" + externalIdPropPath)?.getTarget().annotations.Common?.Text;
            if (value === null) {
              context.setProperty(externalIdPropPath, null, null, true);
            }
            if (isPathAnnotationExpression(textProperty)) {
              const textPropPath = textProperty.path;
              if (textPropPath.includes("/")) {
                propertiesToRequest.push(textPropPath);
              }
            }
            context.requestSideEffects(propertiesToRequest).then(_refreshLocalModel).catch(err => {
              Log.error(err);
            });
          }
        }
        const propertyPathSplit = fullPath.split("/");
        // let's ensure that sub objects are initialized
        let pathFromRoot = "";
        for (let i = 0; i < propertyPathSplit.length - 1; i++) {
          if (i > 0) {
            pathFromRoot += "/";
          }
          pathFromRoot += propertyPathSplit[i];
          if (this.getObject(pathFromRoot) === undefined) {
            // initialize
            this.setProperty(pathFromRoot, {});
          }
        }
        return baseSetProperty.apply(this, [path, value, context, asyncUpdate]);
      };
      function clearAnnotationType(annotationTypes, dataSet) {
        for (const contextPath in dataSet) {
          // we added a context for accepting recommendations eventually.
          // the context is a deeply nested object iterating over it cause the code the break
          // hence we are skipping it here.
          const context = dataSet?.[contextPath];
          const isContext = context?.isA?.("sap.ui.model.odata.v4.Context");
          if (typeof context === "object" && !isContext) {
            dataSet[contextPath] = clearAnnotationType(annotationTypes, dataSet[contextPath]);
            if (dataSet[contextPath] && Object.keys(dataSet[contextPath]).length === 0) {
              delete dataSet[contextPath];
            }
          }
          for (const annotationType of annotationTypes) {
            if (contextPath.endsWith(annotationType)) {
              delete dataSet[contextPath];
            }
          }
        }
        return dataSet;
      }
      odataModel._localAnnotationModel = localAnnotationModel;
      odataModel.getLocalAnnotationModel = function () {
        return this._localAnnotationModel;
      };
      odataModel.setMessages = function (messages) {
        const cleanedData = clearAnnotationType(["@$ui5.fe.messageType", "@$ui5.fe.messageText"], this._localAnnotationModel.getData());
        this._localAnnotationModel.setData(cleanedData);
        for (const messageTarget in messages) {
          this._localAnnotationModel.setProperty(`${messageTarget}@$ui5.fe.messageType`, messages[messageTarget][0].getType());
          this._localAnnotationModel.setProperty(`${messageTarget}@$ui5.fe.messageText`, messages[messageTarget][0].getMessage());
        }
        fnMessage.apply(this, [messages]);
      };
      const fnBindProperty = odataModel.bindProperty.bind(odataModel);
      odataModel.bindProperty = function (path, context, parameters) {
        const recommendationFeatureDisabled = appComponent.getEnvironmentCapabilities()?.getCapabilities?.().DisableInputAssistance;
        const recommendationPropertyBinding = ModelHelper.setUpRecommendationLocalModelBinding(this, fnBindProperty, path, context, recommendationFeatureDisabled);
        if (recommendationPropertyBinding) {
          return recommendationPropertyBinding;
        }
        if (path.endsWith("@$ui5.fe.@Common/ExternalID") && context) {
          const internalIdPropertyName = path.split("@$ui5.fe.")[0];
          const internalIdBinding = fnBindProperty(internalIdPropertyName, context);
          const metaPath = new MetaPath(convertTypes(odataModel.getMetaModel()), odataModel.getMetaModel().getMetaPath(context.getPath()), odataModel.getMetaModel().getMetaPath(context.getPath()));
          const externalIdProperty = metaPath.getMetaPathForPath(metaPath.getPath() + "/" + internalIdPropertyName)?.getTarget().annotations.Common?.ExternalID;
          if (isPathAnnotationExpression(externalIdProperty)) {
            const externalIDBinding = fnBindProperty(externalIdProperty.path, context);
            odataModel.virtualPropertyBindingRegistry.push(externalIDBinding);
            const externalIdTextProperty = metaPath.getMetaPathForPath(externalIDBinding.getContext()?.getPath() + "/" + externalIdProperty.path)?.getTarget().annotations.Common?.Text;
            if (isPathAnnotationExpression(externalIdTextProperty)) {
              const externalIDTextBinding = fnBindProperty(externalIdTextProperty.path, context);
              odataModel.virtualPropertyBindingRegistry.push(externalIDTextBinding);
            }
          }
          const externalIdBinding = this._localAnnotationModel.bindProperty(path, context);
          internalIdBinding.attachChange(() => {
            externalIdBinding.refresh();
          });
          internalIdBinding.requestValue().then(() => {
            externalIdBinding.refresh();
            return;
          }).catch(err => {
            Log.error(err);
          });
          return externalIdBinding;
        }
        if (path.includes("@$ui5.fe.")) {
          const propBinding = this._localAnnotationModel.bindProperty(path, context);
          if (path.endsWith("@$ui5.fe.@Common/ExternalID")) {
            return propBinding;
          }
          propBinding.updateRequired = function (model) {
            return model && model === odataModel;
          };
          if (path.includes("@$ui5.fe.virtual.")) {
            const {
              expression,
              viewId
            } = MetaModelConverter.getVirtualBindingExpression(path, MetaModelConverter.convertTypes(this.getMetaModel()));
            const owner = viewId ? UI5Element.getElementById(viewId) : undefined;
            const ghostControl = new Any({
              any: compileExpression(expression),
              bindBackProperty: path
            }, owner?.getController() ?? jsx.getFormatterContext());
            // Track the list binding listener so it can be detached on context change or destroy.
            let currentListBinding;
            let listChangeHandler;
            const fnDestroyPropertyBinding = propBinding.destroy.bind(propBinding);
            propBinding.destroy = () => {
              if (currentListBinding && listChangeHandler) {
                currentListBinding.detachChange(listChangeHandler);
                currentListBinding = undefined;
              }
              ghostControl?.destroy();
              return fnDestroyPropertyBinding();
            };
            const fnSetContext = propBinding.setContext;
            if (fnSetContext) {
              propBinding.setContext = newContext => {
                ghostControl?.setBindingContext(newContext);
                if (currentListBinding && listChangeHandler) {
                  currentListBinding.detachChange(listChangeHandler);
                  currentListBinding = undefined;
                }
                const newBinding = newContext?.getBinding();
                if (newBinding?.isA("sap.ui.model.odata.v4.ODataListBinding") && listChangeHandler) {
                  currentListBinding = newBinding;
                  currentListBinding.attachChange(listChangeHandler);
                }
                return fnSetContext.bind(propBinding)(newContext);
              };
            }
            ghostControl.setModel(this);
            const ghostBinding = ghostControl.getBindingInfo("any")?.binding;
            const fnCheckUpdate = ghostBinding?.checkUpdate;
            if (fnCheckUpdate) {
              ghostControl.getBindingInfo("any").binding.checkUpdate = forceUpdate => {
                // Force an update only when the ghost control has a binding context and the value stored in the
                // local annotation model differs from the binding’s external value.
                // When a context exists but its data is not loaded yet (bindingContext.getObject() === undefined),
                // the local annotation value resolves to undefined; if an external value is already available
                // (e.g. after a save), we still force the update to prevent stale values.
                const bindingContext = ghostControl.getBindingContext();
                const isContextLoaded = bindingContext?.getObject() !== undefined;
                const bindBackProperty = ghostControl.getBindBackProperty();
                const externalValue = ghostBinding.getExternalValue();
                const valueInLocalAnnotation = isContextLoaded ? localAnnotationModel.getProperty(bindingContext.getPath(bindBackProperty)) : undefined;
                return fnCheckUpdate.bind(ghostBinding)(forceUpdate || bindBackProperty && bindingContext != null && externalValue !== undefined && externalValue !== valueInLocalAnnotation);
              };
            }
            // When the list binding fires a structural change (e.g. tree children added/removed),
            // @$ui5.node.* virtual annotations are updated in the V4 context but do not propagate
            // change events to composite expression bindings via the normal checkUpdate path.
            // Force re-evaluation of the ghost binding so the localAnnotationModel stays in sync.
            // Only applies to tree virtual properties — regular list bindings must not trigger this.
            if (ghostBinding && path.includes("@$ui5.node.")) {
              listChangeHandler = () => {
                ghostBinding.checkUpdate(true);
              };
              const initialBinding = context?.getBinding();
              if (initialBinding?.isA("sap.ui.model.odata.v4.ODataListBinding")) {
                currentListBinding = initialBinding;
                currentListBinding.attachChange(listChangeHandler);
              }
            }
            ghostControl.setBindingContext(context);
          }
          return propBinding;
        }
        return fnBindProperty(path, context, parameters);
      };
      const fnDestroy = odataModel.destroy.bind(odataModel);
      odataModel.destroy = function () {
        for (const vpBinding of odataModel.virtualPropertyBindingRegistry) {
          vpBinding.destroy();
        }
        this._localAnnotationModel.destroy();
        return fnDestroy.apply(this);
      };
    },
    /**
     * Evaluates a virtual binding expression and returns the result as a promise.
     * @param path The path to the virtual property
     * @param context The binding context to be used for evaluation
     * @returns A promise that resolves with the evaluated value
     */
    async evaluateVirtualExpression(path, context) {
      const promiseKeeper = new PromiseKeeper();
      const {
        expression,
        viewId
      } = MetaModelConverter.getVirtualBindingExpression(path, MetaModelConverter.convertTypes(context.getModel().getMetaModel()));
      const owner = viewId ? UI5Element.getElementById(viewId) : undefined;
      const ghostControl = new DataWatcher({
        valueChanged: function (event) {
          if (event.getParameter("isBindingInitial") === false) {
            promiseKeeper.resolve(event.getParameter("value"));
            event.getSource().destroy();
          }
        },
        propertyBinding: compileExpression(expression)
      }, owner?.getController() ?? jsx.getFormatterContext());
      ghostControl.setBindingContext(context);
      ghostControl.setModel(context.getModel());
      return promiseKeeper.promise;
    },
    /**
     * Resolves a metadata binding to its text, either using the converterContext or the metaModel directly.
     * @param path
     * @param converterContext
     * @param metaModel
     * @returns The resolved text if possible, else the input value or an empty string if the path was undefined
     */
    fetchTextFromMetaModel(path, converterContext, metaModel) {
      let text = path !== undefined ? path : "";
      if (typeof path === "string" && path?.startsWith?.("{metaModel>") || path?.model === "metaModel") {
        const metaModelPath = typeof path === "string" ? path.substring(11, path.length - 1) : path?.path;
        try {
          if (converterContext) {
            text = converterContext.getEntityTypeAnnotation(metaModelPath).annotation?.toString() ?? "";
          } else {
            text = metaModel?.getObject(metaModelPath);
          }
        } catch (e) {
          Log.info(`Unable to retrieve text from meta model using path ${metaModelPath}`);
        }
      }
      return text;
    },
    /**
     * Method to retrieve the property path corresponding to state messages.
     * @param metaModel The metamodel
     * @param contextPath Path for the context on which we what to retreive the message path
     * @returns Returns the property path, or undefined if no Messages annotation is defined
     */
    getMessagesPath: function (metaModel, contextPath) {
      const metaContext = metaModel.getMetaContext(contextPath);
      const objectPath = getInvolvedDataModelObjects(metaContext);
      const messages = objectPath.targetEntityType.annotations.Common?.Messages;
      return isPathAnnotationExpression(messages) ? messages.path : undefined;
    },
    /**
     * Setup recommendation local binding to make recommendations accessible via client side instance annotations.
     *
     * Recommendations is a complex property.
     * Model does not provide an easy way to bind to complex properties. It has 2 major limitations.
     *
     * It only supports one time binding to complex properties. This is needed to show updated recommendations on the UI.
     * It does not support bindings to properties inside a complex property which is needed for recommendations.
     *
     * This function provides a workaround to overcome the above two short comings and
     * to support client side instance annotations for recommendations.
     * @param odataModel The odata model instance.
     * @param fnBindProperty Original bind property of the oDataModel
     * @param path Binding path for which recommendation is being requested
     * @param context Context where recommendation is being requested
     * @param recommendationFeatureDisabled Flag which toggles the recommendation feature
     * @returns Recommendation property path for the entity related to the context and whether the bindingPath is relevant or not based on metadata.
     */
    setUpRecommendationLocalModelBinding: function (odataModel, fnBindProperty, path, context, recommendationFeatureDisabled) {
      if (path.includes("ui5.fe.recommendations")) {
        const recommendationbinding = odataModel.getLocalAnnotationModel().bindProperty(path, context);
        const setContextOnRecommendationBinding = odataPropertyBinding => {
          //we make sure the parent context is set to the propertybinding
          const fnSetContext = recommendationbinding.setContext;
          if (fnSetContext) {
            recommendationbinding.setContext = newContext => {
              odataPropertyBinding?.setContext(newContext);
              fnSetContext.bind(odataPropertyBinding)(newContext);
              return fnSetContext.bind(recommendationbinding)(newContext);
            };
          }
        };
        if (context) {
          const {
            recommendationComplexProperty,
            propertyPath,
            isComplexRecommendedProperty,
            isNavPropRecommendedProperty
          } = ModelHelper.validateRecommendationBindingPath(context, path);
          if (recommendationComplexProperty && (isComplexRecommendedProperty || isNavPropRecommendedProperty) && !recommendationFeatureDisabled) {
            const recommendationPropertyBindingPath = isNavPropRecommendedProperty ? `${recommendationComplexProperty}/${propertyPath}` : recommendationComplexProperty;
            const alreadyBound = odataModel.virtualPropertyBindingRegistry.some(existingBinding => {
              return (
                // We do not want the binding to the complex property to be created too many times
                // hence we rely on checking whether the contexts are same or not before creating a binding.
                context === existingBinding.getContext() && recommendationPropertyBindingPath === existingBinding.getPath()
              );
            });
            if (!alreadyBound) {
              const odataPropertyBinding = fnBindProperty(recommendationPropertyBindingPath, context);
              // Becuase recommendations is a complex property and not a primitive type hence use a raw type.
              odataPropertyBinding.setType(new Raw(), "any");
              odataPropertyBinding.setBindingMode(BindingMode.OneWay);
              odataModel.virtualPropertyBindingRegistry.push(odataPropertyBinding);
              odataPropertyBinding.attachChange(event => {
                // refresh the local annotation binding once recommendation binding is updated.
                const propertyBinding = event.getSource();
                const currentContext = propertyBinding.getContext();
                if (currentContext) {
                  let contextRecommendations = {};
                  if (isNavPropRecommendedProperty) {
                    /*currentContext.getObject(recommendationComplexProperty);
                    const associatedPropertyBindingPaths = odataModel.virtualPropertyBindingRegistry.find((existingBinding) => {
                    	if(existingBinding.getContext() === currentContext) {
                    		return currentContext.getObject(existingBinding.getPath());
                    	}
                    });*/
                    odataModel.virtualPropertyBindingRegistry.forEach(existingBinding => {
                      if (existingBinding.getContext() === currentContext) {
                        const recommendationProperty = existingBinding.getPath().split("/")[1];
                        contextRecommendations[recommendationProperty] = currentContext.getObject(existingBinding.getPath());
                      }
                    });
                  } else {
                    contextRecommendations = propertyBinding.getValue();
                  }
                  ModelHelper.setRecommendationsOnLocalAnnotationModel(contextRecommendations, currentContext);
                  recommendationbinding.refresh();
                }
              });
              // reuestValue will add the recommendation property to the $select
              // hence we do not need to add it to the $select when constructing the binding at various places (forms, table etc.)
              odataPropertyBinding.requestValue().catch(error => {
                Log.error("Recommendations could not be resolved", error);
              });
              setContextOnRecommendationBinding(odataPropertyBinding);
            }
          }
        }
        // We need to ensure that the binding becomes invalid and a new binding is created so the recommendation property binding can be created.
        //
        // For this we need to override updateRequired so that the binding is updated until it has not received a context
        // post that we do not need the binding to be updated.
        // If we remove the updateRequired override then recommendations work fine by during save of a newly created document
        // we get binding related issues.
        //
        // Updating the binding to recommendations will be done by setProperty on the localAnnotationModel
        // when the recommendation property is actually updated.
        recommendationbinding.updateRequired = function (model) {
          return this.getContext() ? model && model === odataModel : model && this.getModel() === model;
        };
        return recommendationbinding;
      }
    },
    /**
     * Validates based on metadata whether a given binding should deal with recommendations or not.
     * @param context Context where recommendation is being requested.
     * @param bindingPath Binding path for which recommendation is being requested.
     * @returns Recommendation property path for the entity related to the context and whether the bindingPath is relevant or not based on metadata.
     */
    validateRecommendationBindingPath: function (context, bindingPath) {
      const metaModel = context.getModel().getMetaModel();
      const contextMetaPath = metaModel.getMetaPath(context.getPath());
      const metaContext = metaModel.getMetaContext(contextMetaPath);
      const targetEntityType = getInvolvedDataModelObjects(metaContext).targetEntityType;
      const recommendationComplexProperty = targetEntityType?.annotations?.UI?.Recommendations?.path;
      // sample binding - ShippingCondition@$ui5.fe.recommendations.placeholderValue
      const propertyPath = bindingPath.split("@$ui5.fe.recommendations")[0];

      // Check if recommendationComplexProperty is a ComplexProperty or entityProperty
      let isComplexRecommendedProperty = false;
      let isNavPropRecommendedProperty = false;
      if (recommendationComplexProperty) {
        isComplexRecommendedProperty = targetEntityType.entityProperties.some(entityProperty => entityProperty.name === recommendationComplexProperty && entityProperty?.targetType?._type === "ComplexType" && Array.isArray(entityProperty?.targetType?.properties) && entityProperty.targetType.properties.some(property => propertyPath === property.name));

        // If not found in entityProperties, check navigationProperties
        if (!isComplexRecommendedProperty && Array.isArray(targetEntityType.navigationProperties)) {
          isNavPropRecommendedProperty = targetEntityType.navigationProperties.some(navProp => navProp.name === recommendationComplexProperty && navProp?._type === "NavigationProperty" && Array.isArray(navProp.targetType.entityProperties) && navProp.targetType.entityProperties.some(property => propertyPath === property.name));
        }
      }
      const isRecommendedProperty = targetEntityType.entityProperties.some(entityProperty => {
        if (entityProperty.name === recommendationComplexProperty) {
          return entityProperty?.targetType?.properties.some(property => {
            return propertyPath === property.name;
          });
        }
      });
      return {
        recommendationComplexProperty,
        isRecommendedProperty,
        isComplexRecommendedProperty,
        isNavPropRecommendedProperty,
        propertyPath
      };
    },
    /**
     * Update recommendation client side instance annotations.
     * @param contextRecommendations Updated recommendations.
     * @param currentContext Context where recommendation was updated.
     */
    setRecommendationsOnLocalAnnotationModel: function (contextRecommendations, currentContext) {
      if (contextRecommendations) {
        const localAnnotationModel = currentContext.getModel().getLocalAnnotationModel();
        const recommendationObj = {};
        const rejectedRecommendations = localAnnotationModel.getProperty("/rejectedRecommendations") || {};
        for (const recommendedProperty in contextRecommendations) {
          const propertyRecommendations = contextRecommendations[recommendedProperty];
          const localModelPath = recommendedProperty;
          const placeholderValueKey = localModelPath + "@$ui5.fe.recommendations.placeholderValue";
          const placeholderDescriptionKey = localModelPath + "@$ui5.fe.recommendations.placeholderDescription";
          const typeAheadValuesKey = localModelPath + "@$ui5.fe.recommendations.typeAheadValues";
          if (!propertyRecommendations || !propertyRecommendations.length) {
            recommendationObj[placeholderValueKey] = null;
            recommendationObj[placeholderDescriptionKey] = "";
          } else {
            for (const propertyRecommendation of propertyRecommendations) {
              if (propertyRecommendation.RecommendedFieldIsSuggestion) {
                recommendationObj[placeholderValueKey] = propertyRecommendation.RecommendedFieldValue;
                recommendationObj[placeholderDescriptionKey] = propertyRecommendation.RecommendedFieldDescription;
              }
              if (propertyRecommendation.RecommendedFieldValue) {
                recommendationObj[typeAheadValuesKey] = recommendationObj[typeAheadValuesKey] || [];
                recommendationObj[typeAheadValuesKey].push(propertyRecommendation.RecommendedFieldValue);
              }
            }
          }
        }
        recommendationObj["recommendationContext"] = currentContext;
        if (!this._compareRecommendations(recommendationObj, rejectedRecommendations[currentContext.getPath()] || {})) {
          // Get existing data from the local annotation model for the current context path
          const existingData = localAnnotationModel.getProperty(currentContext.getPath()) || {};

          // Remove all keys that include "@$ui5.fe.recommendations" from existing data
          const cleanedExistingData = {};
          for (const key in existingData) {
            if (!key.includes("@$ui5.fe.recommendations")) {
              cleanedExistingData[key] = existingData[key];
            }
          }

          // Merge cleaned existing data with new recommendation data
          const mergedData = {
            ...cleanedExistingData,
            ...recommendationObj
          };

          // make sure to set the recommendations on the current context path so that old recommendations are overridden and some stale data is not shown.
          localAnnotationModel.setProperty(currentContext.getPath(), mergedData, currentContext, false);
        }
      }
    },
    _compareRecommendations: function (recommendations, rejectedRecommendations) {
      const recommendationKeys = Object.keys(recommendations).filter(key => key !== "recommendationContext");
      const rejectedRecommendationKeys = Object.keys(rejectedRecommendations).filter(key => key !== "recommendationContext");
      if (recommendationKeys.length !== rejectedRecommendationKeys.length) {
        return false;
      }
      for (const key of recommendationKeys) {
        if (!rejectedRecommendationKeys.includes(key)) {
          return false;
        }
        if (key.includes("ui5.fe.recommendations.typeAheadValues")) {
          const recommendationTypeAheadValues = recommendations[key];
          const rejectedRecommendationTypeAheadValues = rejectedRecommendations[key];
          if (!Array.isArray(recommendationTypeAheadValues) || !Array.isArray(rejectedRecommendationTypeAheadValues) || recommendationTypeAheadValues.length !== rejectedRecommendationTypeAheadValues.length || recommendationTypeAheadValues.some((val, idx) => val !== rejectedRecommendationTypeAheadValues[idx])) {
            return false;
          }
        } else if (recommendations[key] !== rejectedRecommendations[key]) {
          return false;
        }
      }
      return true;
    },
    /**
     * Fetches the SecondaryKeys from entitytype.
     * @param entityType Datamodel object of entityType
     * @param entitySet Datamodel object of entitySet
     * @returns An array of alternate keys
     */
    getAlternateAndSecondaryKeys: (entityType, entitySet) => {
      const alternateKeys = [];
      const _fetchAlternateKeys = entityTypeOrSet => {
        entityTypeOrSet?.annotations?.Core?.AlternateKeys?.forEach(alternateKey => {
          alternateKey.Key.forEach(key => {
            alternateKeys.push(key.Name.value);
          });
        });
      };
      const _fetchSecondaryKeys = eT => {
        eT?.annotations?.Common?.SecondaryKey?.forEach(secondaryKey => {
          if (!alternateKeys.includes(secondaryKey.value)) {
            alternateKeys.push(secondaryKey.value);
          }
        });
      };
      _fetchAlternateKeys(entitySet);
      if (!alternateKeys.length) {
        _fetchAlternateKeys(entityType);
      }
      _fetchSecondaryKeys(entityType);
      return alternateKeys;
    },
    /**
     * Validates additional property names against the EntityType metadata by walking
     * each `/`-separated segment through the metadata graph.
     *
     * Rules per segment:
     * - A scalar entity property is always valid and terminates the walk.
     * - A 1:1 (non-collection) navigation property is valid; the walk continues on its target EntityType.
     * - A 1:n (collection) navigation property makes the entire path invalid.
     * - An unknown segment makes the entire path invalid.
     * - An absolute path (starting with `/`) referencing a singleton property is always invalid.
     *
     * Examples of valid paths: `'prop1'`, `'_ToOne'`, `'_ToOne/prop1'`, and `'_ToOne/_ToOne2/prop1'`.
     * Examples of invalid paths: `'/MySingleton/prop1'`.
     * @param dataModelObjectPath
     * @param properties The list of additional property names to validate.
     * @returns The subset of input properties that are fully valid according to the rules.
     */
    getValidatedAdditionalProperties: (dataModelObjectPath, properties) => {
      const entityTypeName = dataModelObjectPath?.targetEntityType?.name;
      if (!entityTypeName) {
        return [];
      }
      const allEntityTypes = dataModelObjectPath.convertedTypes.entityTypes;
      const rootEntityType = allEntityTypes.find(entityType => entityType.name === entityTypeName);
      if (!rootEntityType) {
        return [];
      }
      const isValidPath = (segments, entityType) => {
        const [head, ...tail] = segments;
        const scalarMatch = entityType.entityProperties.find(p => p.name === head);
        if (scalarMatch) {
          // scalar property — valid regardless of remaining segments
          return true;
        }
        const navMatch = entityType.navigationProperties.find(np => np.name === head);
        if (!navMatch) {
          // unknown segment
          return false;
        }
        if (navMatch.isCollection) {
          // 1:N traversal not allowed (bare or mid-path)
          return false;
        }
        if (tail.length === 0) {
          // bare 1:1 navigation property — valid
          return true;
        }
        // continue walking into the target entity type
        return isValidPath(tail, navMatch.targetType);
      };
      const propertyArray = typeof properties === "string" ? properties.split(",").map(p => p.trim()) : properties;
      return propertyArray?.filter(property => !property.startsWith("/") && isValidPath(property.split("/"), rootEntityType));
    }
  };
  return ModelHelper;
}, false);
//# sourceMappingURL=ModelHelper-dbg.js.map
