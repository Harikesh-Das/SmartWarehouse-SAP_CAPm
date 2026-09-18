/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/macros/Table"], function (ClassSupport, TableAPI) {
  "use strict";

  var _dec, _class;
  var _exports = {};
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * Building block used to create a table based on the metadata provided by OData V4.
   * <br>
   * Usually, a LineItem, PresentationVariant or SelectionPresentationVariant annotation is expected, but the Table building block can also be used to display an EntitySet.
   * <br>
   * If a PresentationVariant is specified, then it must have UI.LineItem as the first property of the Visualizations.
   * <br>
   * If a SelectionPresentationVariant is specified, then it must contain a valid PresentationVariant that also has a UI.LineItem as the first property of the Visualizations.
   *
   * Usage example:
   * <pre>
   * sap.ui.require(["sap/fe/macros/table/Table"], function(Table) {
   * 	 ...
   * 	 new Table("myTable", {metaPath:"@com.sap.vocabularies.UI.v1.LineItem"})
   * })
   * </pre>
   *
   * This is currently an experimental API because the structure of the generated content will change to come closer to the Table that you get out of templates.
   * The public method and property will not change but the internal structure will so be careful on your usage.
   * @public
   * @deprecatedsince 1.145
   * @deprecated Use {@link sap.fe.macros.Table} instead
   * @mixes sap.fe.macros.Table
   */
  let Table = (_dec = defineUI5Class("sap.fe.macros.table.Table", {
    returnTypes: ["sap.fe.macros.MacroAPI"]
  }), _dec(_class = /*#__PURE__*/function (_TableAPI) {
    function Table(mSettings) {
      for (var _len = arguments.length, others = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        others[_key - 1] = arguments[_key];
      }
      return _TableAPI.call(this, mSettings, ...others) || this;
    }

    /**
     * Sets the path to the metadata that should be used to generate the table.
     * @param metaPath The path to the metadata
     * @returns Reference to this to allow method chaining
     * @deprecatedsince 1.145
     * @deprecated Use {@link sap.fe.macros.Table.setMetaPath} instead
     * @public
     */
    _exports = Table;
    _inheritsLoose(Table, _TableAPI);
    var _proto = Table.prototype;
    _proto.setMetaPath = function setMetaPath(metaPath) {
      return this.setProperty("metaPath", metaPath);
    }

    /**
     * Gets the path to the metadata that should be used to generate the table.
     * @returns The path to the metadata
     * @deprecatedsince 1.145
     * @deprecated Use {@link sap.fe.macros.Table.getMetaPath} instead
     * @public
     */;
    _proto.getMetaPath = function getMetaPath() {
      return this.getProperty("metaPath");
    }

    /**
     * Sets the fields that should be ignored when generating the table.
     * @param ignoredFields The fields to ignore
     * @returns Reference to this to allow method chaining
     * @deprecatedsince 1.145
     * @deprecated Use {@link sap.fe.macros.Table.setIgnoredFields} instead
     * @public
     */;
    _proto.setIgnoredFields = function setIgnoredFields(ignoredFields) {
      return this.setProperty("ignoredFields", ignoredFields);
    }

    /**
     * Get the fields that should be ignored when generating the table.
     * @returns The value of the ignoredFields property
     * @deprecatedsince 1.145
     * @deprecated Use {@link sap.fe.macros.Table.getIgnoredFields} instead
     * @public
     */;
    _proto.getIgnoredFields = function getIgnoredFields() {
      return this.getProperty("ignoredFields");
    }

    /**
     * Adds a column to the table.
     * @param column The column to add
     * @returns Reference to this to allow method chaining
     * @deprecatedsince 1.145
     * @deprecated Use {@link sap.fe.macros.Table.addColumn} instead
     * @public
     */;
    _proto.addColumn = function addColumn(column) {
      return _TableAPI.prototype.addColumn.call(this, column);
    }

    /**
     * Removes a column from the table.
     * @param column The column to remove, or its index or ID
     * @returns The removed column or null
     * @deprecatedsince 1.145
     * @deprecated Use {@link sap.fe.macros.Table.removeColumn} instead
     * @public
     */;
    _proto.removeColumn = function removeColumn(column) {
      return _TableAPI.prototype.removeColumn.call(this, column);
    }

    /**
     * Adds an action to the table.
     * @param action The action to add
     * @returns Reference to this to allow method chaining
     * @deprecatedsince 1.145
     * @deprecated Use {@link sap.fe.macros.Table.addAction} instead
     * @public
     */;
    _proto.addAction = function addAction(action) {
      return _TableAPI.prototype.addAction.call(this, action);
    }

    /**
     * Removes an action from the table.
     * @param action The action to remove, or its index or ID
     * @returns The removed action or null
     * @deprecatedsince 1.145
     * @deprecated Use {@link sap.fe.macros.Table.removeAction} instead
     * @public
     */;
    _proto.removeAction = function removeAction(action) {
      return _TableAPI.prototype.removeAction.call(this, action);
    };
    return Table;
  }(TableAPI)) || _class);
  _exports = Table;
  return _exports;
}, false);
//# sourceMappingURL=Table-dbg.js.map
