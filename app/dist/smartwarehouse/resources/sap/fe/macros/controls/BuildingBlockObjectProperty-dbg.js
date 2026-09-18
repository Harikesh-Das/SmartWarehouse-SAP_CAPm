/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BuildingBlockBase", "sap/fe/base/ClassSupport", "sap/fe/base/jsx-runtime/jsx-xml"], function (BuildingBlockBase, ClassSupport, jsxXml) {
  "use strict";

  var _dec, _class;
  var _exports = {};
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * Base class for building block complex object properties that can be serialized to XML.
   * @public
   */
  let BuildingBlockObjectProperty = (_dec = defineUI5Class("sap.fe.macros.controls.BuildingBlockObjectProperty"), _dec(_class = /*#__PURE__*/function (_BuildingBlockBase) {
    function BuildingBlockObjectProperty() {
      return _BuildingBlockBase.apply(this, arguments) || this;
    }
    _exports = BuildingBlockObjectProperty;
    _inheritsLoose(BuildingBlockObjectProperty, _BuildingBlockBase);
    var _proto = BuildingBlockObjectProperty.prototype;
    _proto.getPropertyBag = function getPropertyBag() {
      const settings = {};
      const properties = this.getMetadata().getAllProperties();
      const aggregations = this.getMetadata().getAllAggregations();
      for (const propertyName in properties) {
        const property = this.getProperty(propertyName);
        if (typeof property !== "function") {
          settings[propertyName] = property;
        }
      }
      for (const aggregationName in aggregations) {
        const aggregationContent = this.getAggregation(aggregationName);
        if (Array.isArray(aggregationContent)) {
          const childrenArray = [];
          for (const managedObject of aggregationContent) {
            if (managedObject.isA("sap.fe.macros.controls.BuildingBlockObjectProperty")) {
              childrenArray.push(managedObject.getPropertyBag());
            }
          }
          settings[aggregationName] = childrenArray;
        } else if (aggregationContent) {
          if (aggregationContent.isA("sap.fe.macros.controls.BuildingBlockObjectProperty")) {
            settings[aggregationName] = aggregationContent.getPropertyBag();
          } else {
            settings[aggregationName] = aggregationContent.getId();
          }
        }
      }
      return settings;
    };
    _proto.serialize = function serialize(overrideNodeName) {
      const properties = this.getMetadata().getAllProperties();
      const events = this.getMetadata().getAllEvents();
      const aggregations = this.getMetadata().getAllAggregations();
      const settings = {
        children: {}
      };
      for (const eventName in events) {
        settings[eventName] = `THIS._fireEvent($event, $controller, '${eventName}')`;
      }
      for (const propertyName in properties) {
        const property = this.getProperty(propertyName);
        if (typeof property !== "function") {
          settings[propertyName] = property;
        }
      }
      for (const aggregationName in aggregations) {
        const aggregationContent = this.getAggregation(aggregationName);
        if (Array.isArray(aggregationContent)) {
          const childrenArray = [];
          for (const managedObject of aggregationContent) {
            if (managedObject.isA("sap.fe.macros.controls.BuildingBlockObjectProperty")) {
              childrenArray.push(managedObject.serialize());
            }
          }
          settings.children[aggregationName] = childrenArray;
        } else if (aggregationContent) {
          if (aggregationContent.isA("sap.fe.macros.controls.BuildingBlockObjectProperty")) {
            settings.children[aggregationName] = aggregationContent.serialize();
          } else {
            settings[aggregationName] = aggregationContent.getId();
          }
        }
      }
      return jsxXml(this.getMetadata().getClass(), settings, undefined, {}, overrideNodeName);
    };
    _proto.bindProperty = function bindProperty(name, bindingInfo) {
      const propertyMetadata = this.getMetadata().getProperty(name);
      if (propertyMetadata?.bindable === false && propertyMetadata.group === "Data") {
        this[name] = bindingInfo;
      } else {
        _BuildingBlockBase.prototype.bindProperty.call(this, name, bindingInfo);
      }
      return this;
    };
    return BuildingBlockObjectProperty;
  }(BuildingBlockBase)) || _class);
  _exports = BuildingBlockObjectProperty;
  return _exports;
}, false);
//# sourceMappingURL=BuildingBlockObjectProperty-dbg.js.map
