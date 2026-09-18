/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/core/converters/ManifestSettings", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/controls/Common/DataVisualization", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/ui/model/json/JSONModel", "../MacroAPI"], function (Log, BindingToolkit, ManifestSettings, MetaModelConverter, DataVisualization, TypeGuards, DataModelPathHelper, JSONModel, MacroAPI) {
  "use strict";

  var _exports = {};
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var isAnnotationOfTerm = TypeGuards.isAnnotationOfTerm;
  var getVisualizationsFromAnnotation = DataVisualization.getVisualizationsFromAnnotation;
  var getDataVisualizationConfiguration = DataVisualization.getDataVisualizationConfiguration;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var VisualizationType = ManifestSettings.VisualizationType;
  var TemplateType = ManifestSettings.TemplateType;
  var not = BindingToolkit.not;
  var equal = BindingToolkit.equal;
  var compileExpression = BindingToolkit.compileExpression;
  function createTableDefinition(tableAPI) {
    const owner = tableAPI._getOwner();
    const metaModel = owner?.getMetaModel();
    if (!owner || !metaModel) {
      Log.error("Cannot create a table definition for a TableAPI without an owner or a metamodel");
      throw new Error("Cannot create a table definition for a TableAPI without an owner or a metamodel");
    }
    const metaPathContext = metaModel.createBindingContext(tableAPI.getFullMetaPath());
    const contextPathContext = metaModel.createBindingContext(tableAPI.contextPath);
    if (!metaPathContext || !contextPathContext) {
      Log.error(`Incorrect metaPath (${tableAPI.metaPath}) or contextPath (${tableAPI.contextPath}) for tableAPI`);
      throw new Error("Incorrect metaPath or contextPath for tableAPI");
    }
    tableAPI.contextObjectPath = getInvolvedDataModelObjects(metaPathContext, contextPathContext);
    const preprocessorContextModels = {
      ...owner.preprocessorContext?.models
    };
    const viewData = preprocessorContextModels?.viewData;
    if (viewData) {
      const convertTypePath = "/converterType";
      const templateType = tableAPI.getProperty("templateType");
      if (templateType !== viewData.getProperty(convertTypePath)) {
        //The template type is different from the one in the template component
        // We need to create a new view data model with the relevant template type
        // It can happen when a loadFragment is used to load a table inside a template
        const newViewData = new JSONModel(owner.getViewData());
        newViewData.setProperty(convertTypePath, templateType ?? TemplateType.FreeStylePage); // If no template type is set, we consider it is a freestyle page
        preprocessorContextModels.viewData = newViewData;
      }
    }
    const initialConverterContext = MacroAPI.getConverterContext(tableAPI.contextObjectPath, tableAPI.contextPath, {
      appComponent: owner.getAppComponent(),
      models: preprocessorContextModels
    });
    const visualizationPath = getVisualizationPath(tableAPI.contextObjectPath, initialConverterContext);
    const tableSettings = tableAPI.getSettingsForManifest();
    if (!tableSettings.creationMode) {
      const appComponent = owner?.getAppComponent();
      const sapFeSettings = appComponent?.getManifestEntry("sap.fe");
      const defaultCreationMode = sapFeSettings?.macros?.table?.defaultCreationMode;

      // Only InlineCreationRows is supported as a global default creation mode for all tables.
      // Other modes (e.g. CreationRow) require per-table configuration via the manifest or BB properties.
      if (defaultCreationMode === "InlineCreationRows") {
        tableSettings.creationMode = {
          name: defaultCreationMode
        };
      }
    }
    const extraManifestSettings = {
      overflowGroups: {},
      actions: {},
      columns: {},
      tableSettings
    };

    // Process custom actions and columns
    addSlotColumnsToExtraManifest(tableAPI, extraManifestSettings);
    addSlotActionsToExtraManifest(tableAPI, extraManifestSettings);
    addSlotOverflowGroupsToExtraManifest(tableAPI, extraManifestSettings);
    const extraParams = {};
    extraParams[visualizationPath] = extraManifestSettings;
    const converterContext = MacroAPI.getConverterContext(tableAPI.contextObjectPath, tableAPI.contextPath, {
      appComponent: owner?.getAppComponent(),
      models: preprocessorContextModels
    }, extraParams);
    let associatedSelectionVariant;
    if (tableAPI.associatedSelectionVariantPath) {
      const svObjectPath = getInvolvedDataModelObjects(metaModel.createBindingContext(tableAPI.associatedSelectionVariantPath), contextPathContext);
      associatedSelectionVariant = svObjectPath.targetObject;
    }
    const visualizationDefinition = getDataVisualizationConfiguration(tableAPI.inMultiView && tableAPI.contextObjectPath.targetObject ? converterContext.getRelativeAnnotationPath(tableAPI.contextObjectPath.targetObject.fullyQualifiedName, converterContext.getEntityType()) : getContextRelativeTargetObjectPath(tableAPI.contextObjectPath), converterContext, {
      isCondensedTableLayoutCompliant: tableAPI.useCondensedLayout,
      associatedSelectionVariant,
      isMacroOrMultipleView: tableAPI.inMultiView ?? true,
      additionalPropertiesFromMacroBuildingBlock: tableAPI.additionalProperties
    });
    // take the (first) Table visualization
    return visualizationDefinition.visualizations.find(viz => viz.type === VisualizationType.Table);
  }

  /**
   * Returns the annotation path pointing to the visualization annotation (LineItem).
   * @param contextObjectPath The datamodel object path for the table
   * @param converterContext The converter context
   * @returns The annotation path
   */
  _exports.createTableDefinition = createTableDefinition;
  function getVisualizationPath(contextObjectPath, converterContext) {
    const metaPath = getContextRelativeTargetObjectPath(contextObjectPath);

    // fallback to default LineItem if metapath is not set
    if (!metaPath) {
      Log.error(`Missing meta path parameter for LineItem`);
      return `@${"com.sap.vocabularies.UI.v1.LineItem"}`;
    }
    if (isAnnotationOfTerm(contextObjectPath.targetObject, "com.sap.vocabularies.UI.v1.LineItem")) {
      return metaPath; // MetaPath is already pointing to a LineItem
    }
    //Need to switch to the context related the PV or SPV
    const resolvedTarget = converterContext.getEntityTypeAnnotation(metaPath);
    let visualizations = [];
    if (isAnnotationOfTerm(contextObjectPath.targetObject, "com.sap.vocabularies.UI.v1.SelectionPresentationVariant") || isAnnotationOfTerm(contextObjectPath.targetObject, "com.sap.vocabularies.UI.v1.PresentationVariant")) {
      visualizations = getVisualizationsFromAnnotation(contextObjectPath.targetObject, metaPath, resolvedTarget.converterContext, true);
    } else {
      Log.error(`Bad metapath parameter for table : ${contextObjectPath.targetObject.term}`);
    }
    const lineItemViz = visualizations.find(viz => {
      return viz.visualization.term === "com.sap.vocabularies.UI.v1.LineItem";
    });
    if (lineItemViz) {
      return lineItemViz.annotationPath;
    } else {
      // fallback to default LineItem if annotation missing in PV
      Log.error(`Bad meta path parameter for LineItem: ${contextObjectPath.targetObject.term}`);
      return `@${"com.sap.vocabularies.UI.v1.LineItem"}`; // Fallback
    }
  }

  /**
   * Removes all properties with the value of undefined from the object.
   * @param obj The object to remove the undefined properties from
   */
  function removeUndefinedProperties(obj) {
    Object.keys(obj).forEach(key => {
      if (obj[key] === undefined) {
        delete obj[key];
      }
    });
  }

  /**
   * Adds the slot columns to the extra manifest settings.
   * @param tableAPI
   * @param extraManifestSettings
   */
  function addSlotColumnsToExtraManifest(tableAPI, extraManifestSettings) {
    let customColumnDefinition;
    tableAPI.columns?.forEach(column => {
      const isColumn = column.isA("sap.fe.macros.table.Column");
      if (isColumn) {
        customColumnDefinition = {
          header: column.header,
          width: column.width,
          importance: column.importance,
          horizontalAlign: column.horizontalAlign,
          widthIncludingColumnHeader: column.widthIncludingColumnHeader,
          exportSettings: Object.keys(column.exportSettings?.getMetadata().getProperties() ?? {}).reduce((finalObject, propertyName) => {
            const finalPropertyName = propertyName === "properties" ? "property" : propertyName;
            return {
              ...finalObject,
              [finalPropertyName]: column.exportSettings[propertyName]
            };
          }, {}),
          properties: column.properties,
          tooltip: column.tooltip,
          template: column.template,
          availability: column.availability,
          required: column.required,
          disableExport: column.disableExport,
          type: "Slot"
        };
      } else {
        customColumnDefinition = {
          key: column.key,
          width: column.width,
          importance: column.importance,
          horizontalAlign: column.horizontalAlign,
          widthIncludingColumnHeader: column.widthIncludingColumnHeader,
          exportSettings: column.exportSettings,
          availability: column.availability,
          settings: column.mergeCells !== undefined || column.mergeComparisonProperties !== undefined ? {
            mergeCells: column.mergeCells,
            mergeComparisonProperties: column.mergeComparisonProperties
          } : undefined
        };
      }

      // Remove all undefined properties, so that they don't erase what is set in the manifest
      // (necessary because manifest-based columns are transformed into slot columns and we don't copy
      // all their properties in the XML)
      removeUndefinedProperties(customColumnDefinition);
      if (isColumn && (column.anchor || column.placement)) {
        customColumnDefinition.position = {
          anchor: column.anchor,
          placement: column.placement ?? "After"
        };
      }
      extraManifestSettings.columns[column.key] = customColumnDefinition;
    });
  }

  /**
   * Adds the slot actions to the extra manifest settings.
   * @param tableAPI
   * @param extraManifestSettings
   */
  function addSlotActionsToExtraManifest(tableAPI, extraManifestSettings) {
    function addActionToExtraManifest(action) {
      const actions = extraManifestSettings.actions;
      const key = action.key;
      const actionEnablementStateKey = "actionEnablement_" + key;
      tableAPI.syncStateProperty(actionEnablementStateKey, action, "enabled");
      const actionVisibilityStateKey = "actionVisibility_" + key;
      if (action.isBound("visible")) {
        // If the action visibility in the block is not bound, we use its value 'as is' in the MDC table
        // otherwise the action in the MDC table would also be "artificially" bound and would get a flag "not-adaptable-visibility" that would restrict user adaptation
        tableAPI.syncStateProperty(actionVisibilityStateKey, action, "visible");
      }
      actions[key] = {
        position: {
          placement: action.placement ?? "After",
          anchor: action.anchor
        },
        command: action.command,
        enableOnSelect: action.enableOnSelect,
        visible: action.isBound("visible") ? compileExpression(not(equal(tableAPI.bindState(actionVisibilityStateKey), false))) : action.visible,
        enabled: action.enabledCallBack ?? compileExpression(tableAPI.bindState(actionEnablementStateKey)),
        isAIOperation: action.isAIOperation,
        priority: action.priority,
        group: action.group ?? 0,
        // Default group to 0 if not defined
        overflowGroup: action.overflowGroup,
        disableStrictHandling: action.isA("sap.fe.macros.table.ActionOverride") ? action.disableStrictHandling : undefined
      };
      if (action.isA("sap.fe.macros.table.Action")) {
        actions[key] = {
          ...actions[key],
          text: action.text,
          __noWrap: true,
          press: "someHandler",
          // The real handler will be triggered by firing the event on the Action object
          requiresSelection: action.requiresSelection
        };
        return;
      }
      const afterExecution = {
        enableAutoScroll: action["enableAutoScroll"],
        navigateToInstance: action["navigateToInstance"]
      };
      removeUndefinedProperties(afterExecution);
      actions[key] = {
        ...actions[key],
        afterExecution: Object.entries(afterExecution).length ? afterExecution : undefined,
        defaultValuesFunction: action.defaultValuesFunction
      };
    }
    tableAPI.actions?.forEach(action => {
      if (action.isA("sap.fe.macros.table.Action") || action.isA("sap.fe.macros.table.ActionOverride")) {
        // Action or ActionOverride
        addActionToExtraManifest(action);
      } else {
        const actionsSettings = extraManifestSettings.actions;
        const key = action.key;
        actionsSettings[key] = {
          position: {
            placement: action.placement ?? "After",
            anchor: action.anchor
          },
          menu: action.actions.map(subAction => subAction.key)
        };
        if (action.isA("sap.fe.macros.table.ActionGroup")) {
          actionsSettings[key] = {
            ...actionsSettings[key],
            text: action.text,
            defaultAction: action.defaultAction,
            __noWrap: true
          };
        }
        action.actions.forEach(subAction => {
          addActionToExtraManifest(subAction);
        });
      }
    });
  }

  /**
   * Adds the slot actionOverflowGroups to the extra manifest settings.
   * @param tableAPI
   * @param extraManifestSettings
   */
  function addSlotOverflowGroupsToExtraManifest(tableAPI, extraManifestSettings) {
    tableAPI.actionOverflowGroups?.forEach(overflowGroup => {
      extraManifestSettings.overflowGroups[overflowGroup.overflowGroup] = {
        showSeparator: overflowGroup.showSeparator ?? true
      };
    });
  }
  return _exports;
}, false);
//# sourceMappingURL=TableDefinition-dbg.js.map
