/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/m/Button", "sap/m/OverflowToolbar", "sap/m/Popover", "sap/m/Text", "sap/m/ToolbarSpacer", "sap/ui/core/Lib", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/Fragment", "sap/fe/base/jsx-runtime/jsxs"], function (Button, OverflowToolbar, Popover, Text, ToolbarSpacer, Lib, _jsx, _Fragment, _jsxs) {
  "use strict";

  function getParentView(control) {
    let current = control;
    while (current && !current.isA("sap.ui.core.mvc.View")) {
      current = current.getParent();
    }
    return current ?? undefined;
  }
  return {
    /**
     * Generates a popover with AI notice content. The popover is opened by the provided parent control.
     * @param params An object containing parameters for generating the popover
     * @param params.parent The control that opens the popover
     * @param params.placementType Optional placement type for the popover
     * @param params.content Optional content for the popover. If not provided, default content is used.
     * @param params.contentText Optional text content for the popover. Use this instead of content to support i18n binding strings.
     * @returns The generated Popover instance
     */
    generatePopover(params) {
      const {
        parent,
        placementType
      } = params;
      const resourceBundle = Lib.getResourceBundleFor("sap.fe.controls");
      const resolveContent = () => {
        if (params.contentText !== undefined) {
          return new Text({
            text: params.contentText
          });
        }
        const {
          content
        } = params;
        return Array.isArray(content) ? content.map(item => item.clone()) : content?.clone();
      };
      const view = getParentView(params.parent);
      const myPopover = _jsx(Popover, {
        class: "sapUiContentPadding",
        contentMinWidth: "22.8125rem",
        showArrow: true,
        showHeader: true,
        placement: placementType,
        title: resourceBundle.getText("M_POPOVER_AI_TITLE"),
        afterClose: () => {
          view?.removeDependent(myPopover);
          myPopover?.destroy();
        },
        children: {
          content: resolveContent(),
          footer: _jsx(OverflowToolbar, {
            children: {
              content: _jsxs(_Fragment, {
                children: [_jsx(ToolbarSpacer, {}), _jsx(Button, {
                  text: resourceBundle.getText("M_NOTICE_AI_CLOSE"),
                  press: () => {
                    myPopover.close();
                  }
                })]
              })
            }
          })
        }
      });
      view?.addDependent(myPopover);
      myPopover.openBy(parent);
      return myPopover;
    }
  };
}, false);
//# sourceMappingURL=AiNoticeHelper-dbg.js.map
