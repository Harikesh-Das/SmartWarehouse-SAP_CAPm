/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/helpers/FPMHelper", "sap/fe/macros/controls/section/mixin/SubSectionStateHandler", "sap/uxap/ObjectPageSubSection"], function (ClassSupport, FPMHelper, SubSectionStateHandler, ObjectPageSubSection) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;
  var property = ClassSupport.property;
  var mixin = ClassSupport.mixin;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let SubSection = (_dec = defineUI5Class("sap.fe.macros.controls.section.SubSection", {
    designtime: "sap/uxap/designtime/ObjectPageSubSection.designtime"
  }), _dec2 = mixin(SubSectionStateHandler), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "string"
  }), _dec5 = event(), _dec6 = property({
    type: "string"
  }), _dec(_class = _dec2(_class = (_class2 = /*#__PURE__*/function (_ObjectPageSubSection) {
    function SubSection(sId, mSettings) {
      var _this;
      _this = _ObjectPageSubSection.call(this, sId, mSettings) || this;

      // Register delegate for lifecycle management
      /**
       * Path to the apply-state handler to be called during state interactions.
       */
      _initializerDefineProperty(_this, "applyStateHandler", _descriptor, _this);
      /**
       * Path to the retrieve-state handler to be called during state interactions.
       */
      _initializerDefineProperty(_this, "retrieveStateHandler", _descriptor2, _this);
      /**
       * Fired when the visibility changes (due to change of value or context).
       */
      _initializerDefineProperty(_this, "visibilityChanged", _descriptor3, _this);
      _this.observedDOM = null;
      /**
       * Hook function that is called when the subsection is first set to visible
       * @ui5-experimental-since 1.143.0
       */
      _initializerDefineProperty(_this, "subSectionCreated", _descriptor4, _this);
      _this.initialCall = true;
      const eventDelegates = {
        onBeforeRendering: () => {
          _this.checkAndApplyFormAlignmentClass();
        }
      };
      _this.addEventDelegate(eventDelegates);
      return _this;
    }
    _inheritsLoose(SubSection, _ObjectPageSubSection);
    var _proto = SubSection.prototype;
    _proto.init = function init() {
      _ObjectPageSubSection.prototype.init.call(this);
      this.attachModelContextChange(this.waiForVisibilityResolved.bind(this));
    }

    /**
     * Waits for the visibility binding to be resolved and fires the "visibilityChanged" event.
     */;
    _proto.waiForVisibilityResolved = async function waiForVisibilityResolved() {
      const visibilitybinding = this.getBinding("visible");
      if (visibilitybinding) {
        const allBindings = visibilitybinding.isA("sap.ui.model.CompositeBinding") ? visibilitybinding.getBindings() : [visibilitybinding];
        await Promise.all(allBindings.filter(binding => binding.getModel() === this.getModel()) // consider only bindings from the current model. Internal model bindings should not impact the resolution
        .map(async binding => binding.requestValue()));
        const visibilityValue = this.getCurrentBindingValue(visibilitybinding);
        this.fireEvent("visibilityChanged", {
          value: visibilityValue,
          oldValue: this.previousVisibilityValue,
          context: this.getBindingContext()
        });
        this.previousVisibilityValue = visibilityValue;
      }
    };
    _proto.onAfterRendering = function onAfterRendering(oEvent) {
      _ObjectPageSubSection.prototype.onAfterRendering.call(this, oEvent);
      // If the targeted DOM element has changed, re-observe it
      if (this.observer && this.observedDOM && this.observedDOM !== this.getDomRef()) {
        this.observeCurrentSection();
      }
    }
    /**
     * Gets the current value of the given binding.
     * @param binding The binding to get the value from
     * @returns The current value of the binding
     */;
    _proto.getCurrentBindingValue = function getCurrentBindingValue(binding) {
      if (binding) {
        return binding.isA("sap.ui.model.CompositeBinding") ? binding.getExternalValue() : binding.getValue();
      }
      return null;
    }

    /**
     * Sets the visibility of the subsection.
     * This function is an override to capture visibility changes and fire the "visibilityChanged" event when the binding is resolved.
     * @param bVisible The new visibility value
     * @returns The current instance for chaining
     */;
    _proto.setVisible = function setVisible(bVisible) {
      _ObjectPageSubSection.prototype.setVisible.call(this, bVisible);
      if (this.isBindingResolvedOnCurrentModel("visible")) {
        this.fireEvent("visibilityChanged", {
          value: bVisible,
          oldValue: this.previousVisibilityValue,
          context: this.getBindingContext()
        });
        this.previousVisibilityValue = bVisible;
      }
      return this;
    }

    /**
     * Recursively retrieves all property paths from the given object.
     * @param obj The object to extract property paths from
     * @param prefix  The prefix to prepend to each property path (used for recursion)
     * @returns Array of property paths
     */;
    _proto.getAllProperties = function getAllProperties(obj) {
      let prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
      let properties = [];
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const fullKey = prefix ? `${prefix}/${key}` : key;
          properties.push(fullKey);
          if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
            properties = properties.concat(this.getAllProperties(obj[key], fullKey));
          }
        }
      }
      return properties;
    }

    /**
     * Checks if the binding for the given path is resolved on the current model.
     * @param path The binding path to check
     * @returns True if the binding is resolved on the current model, false otherwise
     */;
    _proto.isBindingResolvedOnCurrentModel = function isBindingResolvedOnCurrentModel(path) {
      const binding = this.getBinding(path);
      const currentContextData = this.getBindingContext()?.getObject();
      const currentDataAvailableProperties = this.getAllProperties(currentContextData || {});
      if (binding?.isA("sap.ui.model.CompositeBinding")) {
        return binding.getBindings().filter(partBinding => partBinding.getModel() === this.getModel()) // consider only bindings from the current model. Internal model bindings should not impact the resolution
        .every(partBinding => currentDataAvailableProperties.includes(partBinding.getPath()) || currentDataAvailableProperties.includes(partBinding.getPath().split("/")[0]) && !currentContextData[partBinding.getPath().split("/")[0]] // nested properties returning undefined is also considered as resolved
        ); // in case of navigation path we check only the first segment of the path
      } else {
        if (binding?.getModel() !== this.getModel()) {
          return true;
        }
        return binding?.getPath() ? currentDataAvailableProperties.includes(binding.getPath()) || currentDataAvailableProperties.includes(binding.getPath().split("/")[0]) && !currentContextData[binding.getPath().split("/")[0]] // nested properties returning undefined is also considered as resolved
        : false;
      }
    }

    /**
     * Creates an IntersectionObserver for the ObjectPage scroll area to monitor subsection visibility.
     */;
    _proto.createIntersectionObserverOnScrollArea = function createIntersectionObserverOnScrollArea() {
      if (!this.observer?.root?.isConnected) {
        this.observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.intersectionRatio > 0 && this.getDomRef()) {
              this.fireEvent("subSectionEnteredViewPort", {
                subSection: this
              });
            }
          });
        }, {
          root: null,
          // viewport of the scroll area; null means the browser viewport
          rootMargin: "0% 0% 0% 0%",
          // adjust as needed to trigger earlier/later (eg: "0% 0% 50% 0%" to increase the bottom margin of 50%)
          threshold: 0
        });
      }
    }

    /**
     * Observes the DOM element of the current subsection for visibility changes.
     */;
    _proto.observeCurrentSection = function observeCurrentSection() {
      if (this.observedDOM) {
        this.observer?.unobserve(this.observedDOM);
      }
      this.observedDOM = this.getDomRef();
      if (this.observedDOM) {
        this.createIntersectionObserverOnScrollArea();
        this.observer?.observe(this.observedDOM);
      } else {
        // Register delegate for lifecycle management
        this.eventDelegatesToCreateObserver = {
          onAfterRendering: () => {
            this.observedDOM = this.getDomRef();
            if (this.observedDOM) {
              this.createIntersectionObserverOnScrollArea();
              this.observer?.observe(this.observedDOM);
              this.removeEventDelegate(this.eventDelegatesToCreateObserver);
              this.eventDelegatesToCreateObserver = undefined;
            }
          }
        };
        this.addEventDelegate(this.eventDelegatesToCreateObserver);
      }
    };
    _proto.disconnectVisibilityObserver = function disconnectVisibilityObserver() {
      this.observer?.disconnect();
      this.observedDOM = null;
      if (this.eventDelegatesToCreateObserver) {
        this.removeEventDelegate(this.eventDelegatesToCreateObserver);
        this.eventDelegatesToCreateObserver = undefined;
      }
    }

    /**
     * Gets visible content from all blocks in this subsection.
     * @returns Array of visible controls
     */;
    _proto.getVisibleContent = function getVisibleContent() {
      const blocks = this.getBlocks();
      const visibleContent = [];
      blocks.forEach(block => {
        let content = block.getAggregation("content");
        if (content === null) {
          return;
        }
        if (!Array.isArray(content)) {
          content = [content];
        }
        for (const control of content) {
          if (control.getVisible()) {
            visibleContent.push(control);
          }
        }
      });
      return visibleContent;
    }

    /**
     * Checks if control is eligible for alignment CSS class.
     * @param control Control to check
     * @returns True if control is Form, Panel, Table, or List
     */;
    _proto.isEligibleForAlignment = function isEligibleForAlignment(control) {
      return control.isA(["sap.ui.layout.form.Form", "sap.fe.macros.form.FormAPI", "sap.m.Panel", "sap.m.Table", "sap.m.List"]);
    }

    /**
     * Checks subsection content and applies/removes alignment CSS class on Form elements.
     */;
    _proto.checkAndApplyFormAlignmentClass = function checkAndApplyFormAlignmentClass() {
      const visibleContent = this.getVisibleContent();

      // Only apply if exactly one visible control of eligible type
      if (visibleContent.length === 1 && this.isEligibleForAlignment(visibleContent[0])) {
        visibleContent[0].addStyleClass("sapUxAPObjectPageSubSectionAlignContent");
      } else {
        for (const control of visibleContent) {
          control.removeStyleClass("sapUxAPObjectPageSubSectionAlignContent");
        }
      }
    };
    _proto.handleSubSectionCreated = function handleSubSectionCreated(view) {
      if (this.subSectionCreated && this.initialCall) {
        this.initialCall = false;
        const loadSplit = this.subSectionCreated.split(".");
        const methodName = loadSplit?.pop();
        const moduleName = loadSplit?.join("/");
        FPMHelper.loadModuleAndCallMethod(moduleName, methodName ?? "", view, this);
      }
    }

    /**
     * Sets the title of the subsection and adjusts the section content accordingly.
     * @param sTitle The title to set for the subsection
     * @returns The current instance of SubSection
     */;
    _proto.setTitle = function setTitle(sTitle) {
      _ObjectPageSubSection.prototype.setTitle.call(this, sTitle);

      // We need to run the title adjustment logic at section level after the title is set.
      const feSection = this.getParent();
      if (feSection && feSection.isA("sap.fe.macros.controls.Section") && feSection.checkAndAdjustSectionContent) {
        feSection.checkAndAdjustSectionContent();
      }
      return this;
    };
    _proto.destroy = function destroy() {
      if (this.observedDOM) {
        this.observer?.unobserve(this.observedDOM);
        this.observer?.disconnect();
        this.observer = undefined;
        this.observedDOM = null;
      }
      _ObjectPageSubSection.prototype.destroy.call(this);
    };
    return SubSection;
  }(ObjectPageSubSection), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "applyStateHandler", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "retrieveStateHandler", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "visibilityChanged", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "subSectionCreated", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class) || _class);
  return SubSection;
}, false);
//# sourceMappingURL=SubSection-dbg.js.map
