/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/controls/AiNoticeHelper","sap/fe/core/CommonUtils","sap/m/Text","sap/ui/core/Lib"],function(e,t,n,r){"use strict";const a=async a=>{let o=a.content;if(!o){const p=t.getTargetView(a.parent);if(a.contentFragmentName&&p){o=await(p.getController()?.loadFragment({name:a.contentFragmentName}));return e.generatePopover({parent:a.parent,placementType:a.placementType,content:o})}else if(a.contentText){return e.generatePopover({parent:a.parent,placementType:a.placementType,contentText:a.contentText})}else{const e=r.getResourceBundleFor("sap.fe.macros");o=new n({text:e?.getText("T_TABLE_COLUMN_AINOTICE_CONTENT")})}}return e.generatePopover({parent:a.parent,placementType:a.placementType,content:o})};return{generateHeaderAIPopover:a}},false);
//# sourceMappingURL=ColumnHelper.js.map