/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/SemanticKeyHelper", "sap/ui/model/Filter", "sap/ui/model/FilterOperator"], function (MetaModelConverter, ModelHelper, SemanticKeyHelper, Filter, FilterOperator) {
  "use strict";

  var _exports = {};
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  /**
   * Checks if a path refers to a draft root path.
   * @param path The path to test
   * @param metaModel The associated metadata model
   * @returns `true` if the path is a draft root path
   */
  function isPathOnDraftRoot(path, metaModel) {
    // Check if the path follows the pattern '/aaa(bbb)'
    const matches = /^[/]?(\w+)\([^/]+\)$/.exec(path);
    if (!matches) {
      return false;
    }

    // Check if the entity set supports draft
    const entitySetPath = `/${matches[1]}`;
    return metaModel.getObject(`${entitySetPath}@com.sap.vocabularies.Common.v1.DraftRoot`) ? true : false;
  }

  /**
   * Creates the filter to retrieve the draft or active instance from a path.
   * @param path The semantic or technical path
   * @param keys The semantic or technical keys for the path
   * @param metaModel The instance of the metamodel
   * @returns The filter
   */
  _exports.isPathOnDraftRoot = isPathOnDraftRoot;
  function createFilterFromPath(path, keys, metaModel) {
    const unquoteAndDecode = function (value) {
      if (value.indexOf("'") === 0 && value.lastIndexOf("'") === value.length - 1) {
        // Remove the quotes from the value and decode special chars
        value = decodeURIComponent(value.substring(1, value.length - 1));
      }
      return value;
    };
    const keyValues = path.substring(path.indexOf("(") + 1, path.length - 1).split(",");
    let finalKeys = keys;
    let finalKeyValues = keyValues;
    // If we have technical keys, IsActiveEntity will be present. We need to remove it as we're already adding them at the end.
    if (keys.includes("IsActiveEntity")) {
      finalKeys = keys.filter(singleKey => !singleKey.includes("IsActiveEntity"));
      finalKeyValues = keyValues.filter(element => !element.startsWith("IsActiveEntity"));
    }
    if (finalKeys.length != finalKeyValues.length) {
      return null;
    }
    const filteringCaseSensitive = ModelHelper.isFilteringCaseSensitive(metaModel);
    let filters;
    if (finalKeys.length === 1) {
      // If this is a technical key, the equal is present because there's at least 2 parameters, a technical key and IsActiveEntity
      if (finalKeyValues[0].indexOf("=") > 0) {
        const keyPart = finalKeyValues[0].split("=");
        finalKeyValues[0] = keyPart[1];
      }
      // Take the first key value
      const keyValue = unquoteAndDecode(finalKeyValues[0]);
      filters = [new Filter({
        path: finalKeys[0],
        operator: FilterOperator.EQ,
        value1: keyValue,
        caseSensitive: filteringCaseSensitive
      })];
    } else {
      const mKeyValues = {};
      // Create a map of all key values
      finalKeyValues.forEach(function (sKeyAssignment) {
        const aParts = sKeyAssignment.split("="),
          keyValue = unquoteAndDecode(aParts[1]);
        mKeyValues[aParts[0]] = keyValue;
      });
      let failed = false;
      filters = finalKeys.map(function (semanticKey) {
        const key = semanticKey,
          value = mKeyValues[key];
        if (value !== undefined) {
          return new Filter({
            path: key,
            operator: FilterOperator.EQ,
            value1: value,
            caseSensitive: filteringCaseSensitive
          });
        } else {
          failed = true;
          return new Filter({
            path: "XX"
          }); // will be ignored anyway since we return after
        }
      });
      if (failed) {
        return null;
      }
    }

    // Add a draft filter to make sure we take the draft entity if there is one
    // Or the active entity otherwise
    const draftFilter = new Filter({
      filters: [new Filter("IsActiveEntity", "EQ", false), new Filter("SiblingEntity/IsActiveEntity", "EQ", null)],
      and: false
    });
    filters.push(draftFilter);
    return new Filter(filters, true);
  }

  /**
   * Loads a context from a list of keys (semantic or technical).
   * @param keys The keys
   * @param keyValues The key values in a string, e.g. /entity(aa=xx,bb=xx,...)
   * @param model
   * @param fetchProperties Additional properties to fetch along with the keys
   * @returns The context (or undefined if no query could be sent, or null if no context was returns by the query)
   */
  _exports.createFilterFromPath = createFilterFromPath;
  async function getContextFromKeys(keys, keyValues, model) {
    let fetchProperties = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
    const metaModel = model.getMetaModel();
    if (!keys || keys.length === 0) {
      // No semantic/technical keys
      return undefined;
    }

    // Create a set of filters corresponding to all keys
    const filter = createFilterFromPath(keyValues, keys, metaModel);
    if (filter === null) {
      // Couldn't interpret the path as a semantic one
      return undefined;
    }

    // Retrieve the entity keys to add them in the $select query parameter
    const absolutePath = keyValues.startsWith("/") ? keyValues : `/${keyValues}`;
    const metaContext = metaModel.getMetaContext(absolutePath);
    const objectPath = getInvolvedDataModelObjects(metaContext);
    const technicalKeys = objectPath.targetEntityType.keys.map(property => property.name);

    // Load the corresponding object
    const listBinding = model.bindList(metaContext.getPath(), undefined, undefined, filter, {
      $select: technicalKeys.concat(fetchProperties).join(","),
      $$groupId: "$auto.Heroes"
    });
    const contexts = await listBinding.requestContexts(0, 2);
    if (contexts.length) {
      return contexts[0];
    } else {
      // No data could be loaded
      return null;
    }
  }

  /**
   * Get the draft (if it exists) or the active context for a given draft-root context.
   * @param context
   * @param fetchProperties Additional properties to fetch along with the keys
   * @returns The draft context if there's one, the active context otherwise
   */
  async function getDraftOrActiveContext(context) {
    let fetchProperties = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    const model = context.getModel();
    const metaModel = model.getMetaModel();
    const objectPath = getInvolvedDataModelObjects(metaModel.getMetaContext(context.getPath()));
    const keys = objectPath.targetEntityType.keys.map(property => property.name);
    const draftOrActiveContext = await getContextFromKeys(keys, context.getPath(), model, fetchProperties);
    return draftOrActiveContext ?? null;
  }

  /**
   * Transforms a patch (semantic or not) into a technical path.
   * @param pathToResolve The path (semantic or not)
   * @param model
   * @param routingService
   * @returns The technical path corresponding to the pathToResolve
   */
  _exports.getDraftOrActiveContext = getDraftOrActiveContext;
  async function resolvePath(pathToResolve, model, routingService) {
    const metaModel = model.getMetaModel();

    // If pathToResolve is not a path on a draft root (e.g. a child entity path), return as-is
    if (!isPathOnDraftRoot(pathToResolve, metaModel)) {
      return pathToResolve;
    }
    const rootEntityName = pathToResolve.substring(pathToResolve.indexOf("/") + 1, pathToResolve.indexOf("("));
    const semanticKeys = SemanticKeyHelper.getSemanticKeys(metaModel, rootEntityName)?.map(key => key.$PropertyPath);
    if (semanticKeys === undefined) {
      // If we don't have semantic keys, the path we have is technical and can be used as is.
      return pathToResolve;
    }
    const lastSemanticMapping = routingService.getLastSemanticMapping();
    if (lastSemanticMapping?.semanticPath === pathToResolve) {
      // This semantic path has been resolved previously
      return lastSemanticMapping.technicalPath;
    }

    // We need resolve the semantic path to get the technical keys
    const context = await getContextFromKeys(semanticKeys, pathToResolve, model);
    if (context === null) {
      // No data could be loaded for the semantic keys
      return null;
    }
    const technicalPath = context?.getPath();
    if (technicalPath && technicalPath !== pathToResolve) {
      // The semantic path was resolved (otherwise keep the original value for target)
      routingService.setLastSemanticMapping({
        technicalPath: technicalPath,
        semanticPath: pathToResolve
      });
      return technicalPath;
    }
    return pathToResolve;
  }
  _exports.resolvePath = resolvePath;
  return _exports;
}, false);
//# sourceMappingURL=ContextPathHelper-dbg.js.map
