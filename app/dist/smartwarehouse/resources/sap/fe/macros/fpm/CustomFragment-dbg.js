/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/ui/core/CustomData", "sap/ui/core/Fragment"], function (Log, ClassSupport, BuildingBlock, CustomDataClass, Fragment) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Content of a custom fragment
   * @private
   */
  let CustomFragmentBlock = (_dec = defineUI5Class("sap.fe.macros.fpm.CustomFragment"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "object"
  }), _dec6 = aggregation({
    type: "sap.ui.core.CustomData",
    multiple: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function CustomFragmentBlock(props, others) {
      var _this;
      if (props?.id) {
        props.id = props.id + "--wrapper";
      }
      _this = _BuildingBlock.call(this, props, others) || this;
      /**
       * ID of the custom fragment
       */
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      /**
       * Context Path
       */
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _this);
      /**
       *  Name of the custom fragment
       */
      _initializerDefineProperty(_this, "fragmentName", _descriptor3, _this);
      /**
       * Containing view
       */
      _initializerDefineProperty(_this, "containingView", _descriptor4, _this);
      _initializerDefineProperty(_this, "childCustomData", _descriptor5, _this);
      return _this;
    }
    _exports = CustomFragmentBlock;
    _inheritsLoose(CustomFragmentBlock, _BuildingBlock);
    var _proto = CustomFragmentBlock.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      if (!this.content) {
        this.loadFragmentAsync();
      }
    }

    /**
     * Load the fragment and set it as content.
     *
     */;
    _proto.loadFragmentAsync = async function loadFragmentAsync() {
      const fragment = await this.createContent();
      if (fragment) {
        this.content = fragment;
      }
    }

    /**
     * Creates the content for the custom fragment.
     * @returns The fragment as a control
     */;
    _proto.createContent = async function createContent() {
      if (!this.fragmentName) {
        Log.error("CustomFragment: fragmentName is required");
        return undefined;
      }
      const customDataObj = {};
      if (this.childCustomData?.length > 0) {
        this.childCustomData.forEach(customData => {
          const key = customData.getKey();
          const value = customData.getValue();
          if (key) {
            customDataObj[key] = value;
          }
        });
      }
      try {
        const loadedFragment = await Fragment.load({
          name: this.fragmentName,
          type: "CUSTOM",
          id: this.fragmentName,
          containingView: this.containingView,
          controller: this.containingView?.getController()
        });
        let resultControl;
        //If we have multiple controls at root level, we load only the last one in the array
        if (Array.isArray(loadedFragment)) {
          resultControl = loadedFragment[loadedFragment.length - 1];
        } else {
          resultControl = loadedFragment;
        }
        if (Object.keys(customDataObj).length > 0) {
          Object.entries(customDataObj).forEach(_ref => {
            let [key, value] = _ref;
            if (value !== null) {
              resultControl.addCustomData(new CustomDataClass({
                key: key,
                value: value
              }));
            }
          });
        }
        return resultControl;
      } catch (error) {
        Log.error(`Failed to load fragment: ${this.fragmentName}`, error);
        return undefined;
      }
    };
    return CustomFragmentBlock;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "fragmentName", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "containingView", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "childCustomData", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = CustomFragmentBlock;
  return _exports;
}, false);
//# sourceMappingURL=CustomFragment-dbg.js.map
