/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/controls/AiNoticeHelper", "sap/fe/core/CommonUtils", "sap/m/Text", "sap/ui/core/Lib"], function (AiNoticeHelper, CommonUtils, Text, Lib) {
  "use strict";

  /**
   *  Generates a popover with AI notice content for table column headers. The popover is opened by the provided parent control.
   * @param params An object containing parameters for generating the popover
   * @param params.parent The control that opens the popover
   * @param params.placementType Optional placement type for the popover
   * @param params.content Optional content for the popover. If not provided, default content is used.
   * @param params.contentText Optional text content for the popover. Used if `content` is not provided. Supports i18n binding strings.
   * @param params.contentFragmentName Optional fragment name for the popover content. Used if `content` is not provided.
   * @returns The generated Popover instance
   */
  const generateHeaderAIPopover = async params => {
    let content = params.content;
    if (!content) {
      const view = CommonUtils.getTargetView(params.parent);
      if (params.contentFragmentName && view) {
        content = await view.getController()?.loadFragment({
          name: params.contentFragmentName
        });
        return AiNoticeHelper.generatePopover({
          parent: params.parent,
          placementType: params.placementType,
          content
        });
      } else if (params.contentText) {
        return AiNoticeHelper.generatePopover({
          parent: params.parent,
          placementType: params.placementType,
          contentText: params.contentText
        });
      } else {
        const resourceBundle = Lib.getResourceBundleFor("sap.fe.macros");
        content = new Text({
          text: resourceBundle?.getText("T_TABLE_COLUMN_AINOTICE_CONTENT")
        });
      }
    }
    return AiNoticeHelper.generatePopover({
      parent: params.parent,
      placementType: params.placementType,
      content
    });
  };
  return {
    generateHeaderAIPopover
  };
}, false);
//# sourceMappingURL=ColumnHelper-dbg.js.map
