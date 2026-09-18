/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BuildingBlockBase", "sap/fe/base/ClassSupport", "sap/m/CustomTreeItem", "sap/m/FlexBox", "sap/m/FormattedText", "sap/m/Label", "sap/m/Panel", "sap/m/SearchField", "sap/m/Tree", "sap/ui/core/Lib", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (BuildingBlockBase, ClassSupport, CustomTreeItem, FlexBox, FormattedText, Label, Panel, SearchField, Tree, Lib, _jsx, _jsxs) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var _exports = {};
  var defineUI5Class = ClassSupport.defineUI5Class;
  var defineReference = ClassSupport.defineReference;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function getDocsDetail(docsPath, data) {
    const spltiPath = docsPath.split("/");
    let result = data;
    spltiPath.forEach(path => {
      result = result[path];
    });
    return result;
  }
  function collapseDuplicate(elements, filterQuery) {
    const map = {};
    elements.forEach(element => {
      if (!map[element.label]) {
        map[element.label] = [];
      }
      element.nodes.filter(node => {
        return node.label.toLowerCase().includes(filterQuery.toLowerCase());
      }).forEach(node => {
        if (!map[element.label].some(existingNode => existingNode.label === node.label)) {
          map[element.label].push(node);
        }
      });
    });
    return Object.entries(map).map(_ref => {
      let [label, nodes] = _ref;
      return {
        label,
        nodes
      };
    });
  }

  /**
   * Maps a keyboard key to a symbol for display purposes.
   * We need to perform the mapping based on the raw key name but return the translated key for display.
   * @param key The raw key name (e.g., "ArrowUp", "Ctrl", etc.)
   * @param translatedKey The translated key name in the proper language
   * @returns The symbol to be displayed for the key
   */
  function mapKeyToSymbol(key, translatedKey) {
    switch (key.trim()) {
      case "ArrowDown":
        return "↓";
      case "ArrowUp":
        return "↑";
      case "ArrowLeft":
        return "←";
      case "ArrowRight":
        return "→";
      default:
        return translatedKey;
    }
  }
  let ShortcutTool = (_dec = defineUI5Class("sap.fe.controls.shortcuts.popup.ShortcutTool"), _dec2 = defineReference(), _dec3 = defineReference(), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    function ShortcutTool() {
      var _this;
      _this = _BuildingBlockBase.call(this) || this;
      _this.resourceBundle = Lib.getResourceBundleFor("sap.fe.controls");
      _initializerDefineProperty(_this, "$searchField", _descriptor, _this);
      _initializerDefineProperty(_this, "$tree", _descriptor2, _this);
      _this.state.shortcutsTree = [];
      _this.state.originalTree = [];
      _this.content = _this.createContent();
      _this.state.initialFocus = true;
      _this.$searchField.current?.addEventDelegate({
        onAfterRendering: () => {
          if (_this.state.initialFocus) {
            _this.$searchField.current?.focus();
            _this.state.initialFocus = false;
          }
        }
      });
      if (window.messagePort) {
        _this.setupPort(window.messagePort);
      }
      return _this;
    }
    _exports = ShortcutTool;
    _inheritsLoose(ShortcutTool, _BuildingBlockBase);
    var _proto = ShortcutTool.prototype;
    _proto.setupPort = function setupPort(messagePort) {
      messagePort.onmessage = this.onMessageReceived.bind(this);
      // We send a message to stop the display if it is already running
      // and then start it again to ensure we have the latest data.
      // This is to ensure that the popup is always up-to-date with the latest shortcuts
      // and to avoid any potential issues with the display being already running.
      messagePort.postMessage({
        service: "sap.ui.interaction.StopDisplay"
      });
      messagePort.postMessage({
        service: "sap.ui.interaction.StartDisplay"
      });
    };
    _proto.onMessageReceived = function onMessageReceived(e) {
      if (e?.data?.service === "sap.ui.interaction.UpdateDisplay") {
        const elements = e.data.payload.elements;
        elements.reverse();
        this.state.originalTree = elements.map(element => {
          const nodes = [];
          element.interactions.forEach(shortcut => {
            if (shortcut.$ref) {
              const interactions = getDocsDetail(shortcut.$ref, e.data.payload);
              interactions?.forEach(documentationInteraction => {
                nodes.push({
                  label: documentationInteraction.description.replaceAll("<kbd", "<strong").replaceAll("</kbd>", "</strong>"),
                  shortcutKeys: documentationInteraction.kbd
                });
              });
            } else {
              nodes.push({
                label: (shortcut.description ?? shortcut.name).replaceAll("<kbd", "<strong").replaceAll("</kbd>", "</strong>"),
                shortcutKeys: shortcut.kbd
              });
            }
          });
          return {
            label: element.label.replaceAll("<kbd", "<strong").replaceAll("</kbd>", "</strong>"),
            nodes: nodes
          };
        });
      }
      this.state.shortcutsTree = collapseDuplicate(this.state.originalTree.concat(), "");
    };
    _proto.onStateChange = function onStateChange() {
      this.$tree.current?.expandToLevel(1);
    };
    _proto.onSearch = function onSearch(_e) {
      const query = _e.getParameter("query") ?? "";
      this.state.shortcutsTree = collapseDuplicate(this.state.originalTree.filter(element => {
        const isTitleMatch = element.label.toLowerCase().includes(query.toLowerCase());
        const isNodeMatch = element.nodes.some(node => node.label.toLowerCase().includes(query.toLowerCase()));
        return isTitleMatch || isNodeMatch;
      }).concat(), query);
    };
    _proto.createContent = function createContent() {
      return _jsx(Panel, {
        headerText: this.resourceBundle.getText("C_SHORTCUT_TITLE"),
        width: "100%",
        children: {
          content: [_jsx(SearchField, {
            ref: this.$searchField,
            placeholder: this.resourceBundle.getText("C_SHORTCUT_PLACEHOLDER"),
            search: e => this.onSearch(e)
          }), _jsx(Tree, {
            ref: this.$tree,
            items: {
              model: "$componentState",
              path: "/shortcutsTree",
              parameters: {
                arrayNames: ["nodes"]
              }
            },
            noDataText: this.resourceBundle.getText("C_SHORTCUT_NODATA"),
            children: _jsx(CustomTreeItem, {
              children: _jsxs(FlexBox, {
                alignItems: "Start",
                width: "100%",
                renderType: "Bare",
                justifyContent: "SpaceBetween",
                children: [_jsx(FormattedText, {
                  htmlText: this.state.shortcutsTree.label,
                  class: "sapFeControlsShorcutMFT"
                }), _jsx(FlexBox, {
                  renderType: "Bare",
                  justifyContent: "SpaceBetween",
                  items: "{$componentState>shortcutKeys}",
                  direction: "Column",
                  children: {
                    items: function (id, context) {
                      const shortcutKey = context.getObject();
                      const shortCutText = typeof shortcutKey === "string" ? shortcutKey : shortcutKey.raw;
                      const translatedShortCutText = typeof shortcutKey === "string" ? shortcutKey : shortcutKey.translated;
                      const shortcutKeys = shortCutText.split("+");
                      const translatedShortCutKeys = translatedShortCutText.split("+");
                      const elements = [];
                      shortcutKeys.forEach((rawKey, idx) => {
                        const translatedKey = translatedShortCutKeys[idx] ?? rawKey;
                        elements.push(_jsx(Label, {
                          text: mapKeyToSymbol(rawKey, translatedKey),
                          class: "sapUiTinyMarginEnd sapFeControlsShortcutKey"
                        }));
                        if (idx !== shortcutKeys.length - 1) {
                          elements.push(_jsx(Label, {
                            text: "+",
                            class: "sapUiTinyMarginEnd"
                          }));
                        }
                      });
                      return _jsx(FlexBox, {
                        id: id,
                        renderType: "Bare",
                        alignItems: "Center",
                        children: {
                          items: elements
                        }
                      });
                    }
                  }
                })]
              })
            })
          })]
        }
      });
    };
    return ShortcutTool;
  }(BuildingBlockBase), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "$searchField", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "$tree", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = ShortcutTool;
  return _exports;
}, false);
//# sourceMappingURL=ShortcutTool-dbg.js.map
