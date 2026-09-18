/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/macros/Field", "sap/fe/macros/ai/EasyFillTableHelper", "sap/fe/macros/ai/easyfill/FieldHelper", "sap/fe/macros/ai/easyfill/TablePreviewRenderer", "sap/fe/macros/internal/valuehelp/ValueListHelper", "sap/m/ColumnListItem", "sap/m/VBox", "sap/ui/core/message/MessageType", "sap/ui/mdc/enums/FieldEditMode", "sap/fe/base/jsx-runtime/jsx"], function (Log, Field, EasyFillTableHelper, EasyFillFieldHelper, EasyFillTablePreviewRenderer, ValueListHelper, ColumnListItem, VBox, MessageType, FieldEditMode, _jsx) {
  "use strict";

  var _exports = {};
  var isPropertyEditable = EasyFillTableHelper.isPropertyEditable;
  var isGridSourceTable = EasyFillTableHelper.isGridSourceTable;
  var getInnerTable = EasyFillTableHelper.getInnerTable;
  var getCellEditMode = EasyFillTableHelper.getCellEditMode;
  var buildVisibleColumns = EasyFillTableHelper.buildVisibleColumns;
  var buildPropToColumnMap = EasyFillTableHelper.buildPropToColumnMap;
  var buildPrimaryToAuxMap = EasyFillTableHelper.buildPrimaryToAuxMap;
  const INNER_CONTROL_RENDER_DELAY_MS = 200;
  const UNIT_INPUT_ID_SUFFIX = "-inner-unit";

  /** Internal rendering flags for a single table property. */

  /** Rendering flags for a table. */

  /** All dependencies the table view builder needs from EasyFillDialog. */
  _exports.UNIT_INPUT_ID_SUFFIX = UNIT_INPUT_ID_SUFFIX;
  /**
   * Creates a transient ODataListBinding used for staging row contexts.
   * @param path The binding path.
   * @param model The OData model.
   * @param groupId The update group ID.
   * @returns The transient list binding.
   */
  function createListBinding(path, model) {
    let groupId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "submitLater";
    const transientListBinding = model.bindList(path, undefined, [], [], {
      $$updateGroupId: groupId
    });
    transientListBinding.refreshInternal = () => {
      /* */
    };
    return transientListBinding;
  }

  /**
   * Returns column widths from an MDC grid table for a navigation property.
   * @param ctx The table preview context.
   * @param navigationPropertyName The navigation property name.
   * @returns A map of property key to width string, or undefined if not a grid table.
   */
  _exports.createListBinding = createListBinding;
  function getColumnWidthsForGrid(ctx, navigationPropertyName) {
    const mdcTable = ctx.tableReferences.get(navigationPropertyName);
    if (!mdcTable || !isGridSourceTable(mdcTable)) {
      return undefined;
    }
    const widths = {};
    for (const col of mdcTable.getColumns()) {
      const w = col.getWidth();
      widths[col.getPropertyKey()] = w && w !== "auto" ? w : "10rem";
    }
    return widths;
  }

  /**
   * Renders the previous (read-only) table view showing original row values.
   * @param ctx The table preview context.
   * @param navigationPropertyName The navigation property name.
   * @param collectionMetadata The collection metadata.
   * @param existingRowContexts The V4 contexts for the existing rows.
   * @param isGridLayout Whether the source table uses grid layout.
   * @returns Preview table.
   */
  _exports.getColumnWidthsForGrid = getColumnWidthsForGrid;
  function renderPreviousTableView(ctx, navigationPropertyName, collectionMetadata, existingRowContexts, isGridLayout) {
    const itemProperties = collectionMetadata.itemProperties ?? {};
    const tableFlags = ctx.tableData.get(navigationPropertyName)?.flags;
    const propNames = Object.keys(itemProperties).filter(p => tableFlags?.properties[p]?.isAuxiliary !== true);
    const visualColumns = buildVisibleColumns(propNames, tableFlags?.properties ?? {}, Object.fromEntries(Object.entries(itemProperties).map(_ref => {
      let [k, v] = _ref;
      return [k, v?.description];
    })));
    const columns = EasyFillTablePreviewRenderer.createPreviewColumns(visualColumns, getColumnWidthsForGrid(ctx, navigationPropertyName));
    const rows = existingRowContexts.map(rowContext => {
      const cells = visualColumns.map(spec => {
        const leafFields = spec.propNames.map(propName => {
          const f = ctx.runAsOwner(() => {
            return _jsx(Field, {
              metaPath: propName,
              contextPath: `${ctx.ownerContextPath}${navigationPropertyName}`,
              readOnly: true,
              required: false
            });
          });
          f.setBindingContext(rowContext);
          return f;
        });
        if (leafFields.length === 1) return leafFields[0];
        return new VBox({
          items: leafFields
        });
      });
      return new ColumnListItem({
        cells: cells
      });
    });
    return EasyFillTablePreviewRenderer.createPreviewTable(columns, rows, isGridLayout);
  }

  /**
   * Renders the new table view with AI changes highlighted; new rows are editable.
   * @param ctx The table preview context.
   * @param navigationPropertyName The navigation property name.
   * @param aiChanges Array of row changes from the AI response.
   * @param collectionMetadata The collection metadata.
   * @param existingRowContexts The V4 contexts for the existing rows.
   * @param isGridLayout Whether the source table uses grid layout.
   * @param parentDataPath Data path of the parent entity (e.g. "/Travel(1)").
   * @returns Preview table, and flags indicating editable/uneditable changes.
   */
  _exports.renderPreviousTableView = renderPreviousTableView;
  function renderNewTableView(ctx, navigationPropertyName, aiChanges, collectionMetadata, existingRowContexts, isGridLayout, parentDataPath) {
    const itemProperties = collectionMetadata.itemProperties ?? {};
    const tableFlags = ctx.tableData.get(navigationPropertyName)?.flags;
    const allPropNames = Object.keys(itemProperties);
    const displayPropNames = allPropNames.filter(p => tableFlags?.properties[p]?.isAuxiliary !== true);
    const editablePropNames = displayPropNames.filter(p => tableFlags?.properties[p]?.isComputed !== true);
    const updatesForExistingRows = aiChanges.filter(r => r._rowIndex !== undefined);
    let newRows = aiChanges.filter(r => r._rowIndex === undefined);
    if (newRows.length > 0) {
      newRows = [newRows[0]];
    }
    const columns = EasyFillTablePreviewRenderer.createPreviewColumns(buildVisibleColumns(displayPropNames, tableFlags?.properties ?? {}, Object.fromEntries(Object.entries(itemProperties).map(_ref2 => {
      let [k, v] = _ref2;
      return [k, v?.description];
    }))), getColumnWidthsForGrid(ctx, navigationPropertyName));
    const bindingPath = `${parentDataPath}/${navigationPropertyName}`;
    const stagingBinding = createListBinding(bindingPath, ctx.model, "easyFillStaging");
    const newRowBinding = createListBinding(bindingPath, ctx.model, "submitLater");
    const {
      items: existingRowItems,
      fieldMap: existingFieldMap,
      hasUneditableChanges,
      hasEditableChanges: existingEditableChanges
    } = createExistingRowItems(ctx, navigationPropertyName, displayPropNames, allPropNames, existingRowContexts, updatesForExistingRows, stagingBinding);
    let newRowItems = [];
    let newFieldMap = new Map();
    if (tableFlags?.allowsCreation === true) {
      ({
        items: newRowItems,
        fieldMap: newFieldMap
      } = createNewRowItems(ctx, navigationPropertyName, displayPropNames, editablePropNames, allPropNames, newRows, newRowBinding));
    }
    const tableOrContainer = EasyFillTablePreviewRenderer.createPreviewTable(columns, [...existingRowItems, ...newRowItems], isGridLayout);
    const combinedFieldMap = new Map();
    existingFieldMap.forEach((field, key) => combinedFieldMap.set(key, field));
    const existingCount = existingRowContexts.length;
    newFieldMap.forEach((field, key) => {
      const [rowIdxStr, ...rest] = key.split("_");
      combinedFieldMap.set(`${existingCount + Number(rowIdxStr)}_${rest.join("_")}`, field);
    });
    validateTableCellValues(ctx, navigationPropertyName, aiChanges, parentDataPath, combinedFieldMap, existingCount).catch(err => Log.error("Table cell value help validation failed:", err));
    return {
      view: tableOrContainer,
      hasUneditableChanges,
      hasEditableChanges: existingEditableChanges || newRows.length > 0
    };
  }

  /**
   * Creates editable row items for existing rows, backed by transient contexts seeded from real row data.
   * @param ctx The table preview context.
   * @param navigationPropertyName The navigation property name.
   * @param visiblePropNames Non-auxiliary property names shown as columns.
   * @param allPropNames All property names including auxiliary ones.
   * @param existingRowContexts The V4 contexts for the existing rows.
   * @param updatedRows AI-proposed row updates (have _rowIndex).
   * @param navListBinding Transient list binding for staging contexts.
   * @returns Row items, field map, and change flags.
   */
  _exports.renderNewTableView = renderNewTableView;
  function createExistingRowItems(ctx, navigationPropertyName, visiblePropNames, allPropNames, existingRowContexts, updatedRows, navListBinding) {
    const allRowContextMap = new Map();
    const fieldMap = new Map();
    let hasUneditableChanges = false;
    let hasEditableChanges = false;
    const mdcTable = ctx.tableReferences.get(navigationPropertyName);
    const innerTable = mdcTable ? getInnerTable(mdcTable) : null;
    const propColMap = mdcTable ? buildPropToColumnMap(mdcTable, visiblePropNames) : new Map();
    const primaryToAux = buildPrimaryToAuxMap(propColMap);
    const tableFlags = ctx.tableData.get(navigationPropertyName)?.flags;
    const rowSpecs = buildVisibleColumns(visiblePropNames, tableFlags?.properties ?? {}, {});
    const items = existingRowContexts.map((rowContext, rowIdx) => {
      const updatedRow = updatedRows.find(c => c._rowIndex === rowIdx);
      const transientContext = navListBinding.create({}, true);
      const uneditableAiProps = new Set();
      for (const key of allPropNames) {
        const aiValue = updatedRow?.[key];
        const propInfo = propColMap.get(key);
        const isGrouped = tableFlags?.properties[key]?.groupKey !== undefined;
        const canApplyAiValue = aiValue !== undefined && (isGrouped ? tableFlags?.properties[key]?.isComputed !== true && tableFlags?.properties[key]?.isImmutable !== true : propInfo !== undefined && isPropertyEditable(innerTable, rowIdx, propInfo.colIndex, propInfo.isAuxiliary));
        if (!canApplyAiValue && aiValue !== undefined) {
          hasUneditableChanges = true;
          uneditableAiProps.add(key);
        }
        if (canApplyAiValue) {
          hasEditableChanges = true;
        }
        const value = canApplyAiValue ? aiValue : rowContext.getProperty(key);
        transientContext.setProperty(key, value);
      }
      allRowContextMap.set(rowIdx, transientContext);
      const cells = rowSpecs.map(spec => {
        const leafFields = spec.propNames.map(propName => {
          const propInfo = propColMap.get(propName);
          const isUneditableAiProp = uneditableAiProps.has(propName);
          let editMode;
          if (isUneditableAiProp) {
            editMode = "Editable";
          } else if (spec.groupKey !== undefined) {
            editMode = tableFlags?.properties[propName]?.isComputed === true || tableFlags?.properties[propName]?.isImmutable === true ? FieldEditMode.Display : FieldEditMode.Editable;
          } else if (propInfo !== undefined) {
            editMode = getCellEditMode(innerTable, rowIdx, propInfo.colIndex) ?? FieldEditMode.Display;
          } else {
            editMode = FieldEditMode.Display;
          }
          const editableField = ctx.runAsOwner(() => {
            return _jsx(Field, {
              _requiresValidation: true,
              editMode: editMode,
              validateFieldGroup: ctx.onValidateFieldGroups,
              fieldGroupIds: "EasyFillField",
              metaPath: propName,
              contextPath: `${ctx.ownerContextPath}${navigationPropertyName}`,
              change: ctx.onFieldChange
            });
          });
          editableField.setBindingContext(transientContext);
          const auxPropNames = primaryToAux.get(propName) ?? [];
          if (updatedRow !== undefined && (updatedRow[propName] !== undefined || auxPropNames.some(aux => updatedRow[aux] !== undefined))) {
            fieldMap.set(`${rowIdx}_${propName}`, editableField);
            for (const auxPropName of auxPropNames) {
              fieldMap.set(`${rowIdx}_${auxPropName}`, editableField);
            }
          }
          if (isUneditableAiProp) {
            editableField.addStyleClass("sapFeEasyFillWarningCell");
            setTimeout(() => {
              const content = editableField.content;
              const inputBase = content?.isA("sap.m.InputBase") === true ? content : content?.findAggregatedObjects(true, c => c.isA("sap.m.InputBase"))[0];
              inputBase?.addStyleClass("sapFeEasyFillWarningCell");
              inputBase?.setEditable(false);
            }, INNER_CONTROL_RENDER_DELAY_MS);
          }
          return editableField;
        });
        if (leafFields.length === 1) return leafFields[0];
        return new VBox({
          items: leafFields
        });
      });
      return new ColumnListItem({
        cells: cells,
        highlight: MessageType.None
      });
    });
    ctx.pendingUpdatedRowContexts.set(navigationPropertyName, allRowContextMap);
    return {
      items,
      fieldMap,
      hasUneditableChanges,
      hasEditableChanges
    };
  }

  /**
   * Creates row items for rows the AI proposes to add as new entries.
   * @param ctx The table preview context.
   * @param navigationPropertyName The navigation property name.
   * @param displayPropNames All non-auxiliary property names shown as columns.
   * @param editablePropNames Subset the AI can fill (excludes computed).
   * @param allPropNames All property names including auxiliary ones.
   * @param newRows AI-proposed new rows (no _rowIndex).
   * @param navListBinding Transient list binding for creating contexts.
   * @returns Row items and field map.
   */
  _exports.createExistingRowItems = createExistingRowItems;
  function createNewRowItems(ctx, navigationPropertyName, displayPropNames, editablePropNames, allPropNames, newRows, navListBinding) {
    const newContexts = [];
    const fieldMap = new Map();
    const editableSet = new Set(editablePropNames);
    const tableFlags = ctx.tableData.get(navigationPropertyName)?.flags;
    const mdcTable = ctx.tableReferences.get(navigationPropertyName);
    const propColMap = mdcTable ? buildPropToColumnMap(mdcTable, editablePropNames) : new Map();
    const primaryToAux = buildPrimaryToAuxMap(propColMap);
    const items = newRows.map((newRowData, rowIdx) => {
      const transientContext = navListBinding.create({}, true);
      for (const key of allPropNames) {
        if (tableFlags?.properties[key]?.isComputed === true) {
          continue;
        }
        const value = newRowData[key];
        if (value !== undefined && typeof value !== "object") {
          transientContext.setProperty(key, value);
        }
      }
      newContexts.push(transientContext);
      const newSpecs = buildVisibleColumns(displayPropNames, tableFlags?.properties ?? {}, {});
      const cells = newSpecs.map(spec => {
        const leafFields = spec.propNames.map(propName => {
          const isEditable = editableSet.has(propName);
          const field = ctx.runAsOwner(() => {
            if (isEditable) {
              return _jsx(Field, {
                _requiresValidation: true,
                validateFieldGroup: ctx.onValidateFieldGroups,
                fieldGroupIds: "EasyFillField",
                metaPath: propName,
                contextPath: `${ctx.ownerContextPath}${navigationPropertyName}`,
                change: ctx.onFieldChange
              });
            }
            return _jsx(Field, {
              metaPath: propName,
              contextPath: `${ctx.ownerContextPath}${navigationPropertyName}`,
              readOnly: true,
              required: false
            });
          });
          field.setBindingContext(transientContext);
          if (isEditable) {
            fieldMap.set(`${rowIdx}_${propName}`, field);
            for (const auxPropName of primaryToAux.get(propName) ?? []) {
              fieldMap.set(`${rowIdx}_${auxPropName}`, field);
            }
          }
          return field;
        });
        if (leafFields.length === 1) return leafFields[0];
        return new VBox({
          items: leafFields
        });
      });
      return new ColumnListItem({
        cells: cells,
        highlight: MessageType.Information
      });
    });
    if (newContexts.length > 0) {
      ctx.pendingNewRowContexts.set(navigationPropertyName, newContexts);
    }
    return {
      items,
      fieldMap
    };
  }

  /**
   * Validates AI-supplied table cell values against their value lists and marks invalid cells.
   * @param ctx The table preview context.
   * @param navigationPropertyName The navigation property name.
   * @param aiChanges All AI-proposed rows.
   * @param parentDataPath Data path of the parent entity.
   * @param fieldMap Field references keyed by `${rowIdx}_${propName}`.
   * @param existingRowCount Number of existing rows (offset for new row field map keys).
   */
  _exports.createNewRowItems = createNewRowItems;
  async function validateTableCellValues(ctx, navigationPropertyName, aiChanges, parentDataPath, fieldMap, existingRowCount) {
    const {
      metaModel
    } = ctx;
    if (!metaModel) {
      return;
    }
    const tableFlags = ctx.tableData.get(navigationPropertyName)?.flags;
    let newRowIdx = 0;
    const fieldsToCheck = new Set();
    for (const aiRow of aiChanges) {
      const fieldMapRowIdx = aiRow._rowIndex !== undefined ? aiRow._rowIndex : existingRowCount + newRowIdx++;
      for (const propName of Object.keys(aiRow).filter(k => k !== "_rowIndex" && !EasyFillFieldHelper.isTechnicalFieldKey(k))) {
        const field = fieldMap.get(`${fieldMapRowIdx}_${propName}`);
        if (!field) {
          continue;
        }
        const propertyMetaPath = metaModel.getMetaPath(`${parentDataPath}/${navigationPropertyName}/${propName}`);
        try {
          const valueList = await ctx.getValueList(propertyMetaPath);
          if (!valueList || !ValueListHelper.isValueListSearchable(propertyMetaPath, valueList)) {
            continue;
          }
          const prefix = tableFlags?.properties?.[propName]?.isAuxiliary === true ? "auxiliary" : "primary";
          field.data(`${prefix}PropMetaPath`, propertyMetaPath);
          fieldsToCheck.add(field);
        } catch (err) {
          Log.warning(`EasyFill: value list lookup failed for "${propName}", skipping VH check:`, err);
        }
      }
    }
    setTimeout(() => {
      fieldsToCheck.forEach(field => {
        ctx.applyCompositeFieldCheck(field).catch(err => Log.error("EasyFill VH error marking failed:", err));
      });
    }, INNER_CONTROL_RENDER_DELAY_MS);
  }
  _exports.validateTableCellValues = validateTableCellValues;
  return _exports;
}, false);
//# sourceMappingURL=TableViewBuilder-dbg.js.map
