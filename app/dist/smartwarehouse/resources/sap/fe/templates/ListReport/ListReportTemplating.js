/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ActionUtilities","sap/fe/core/helpers/StableIdHelper"],function(e,t){"use strict";var n={};var a=t.generate;var r=e.LR_EMPHASIS_SUPPRESSION_CONDITION;const i=function(e,t){if(e&&e.variantManagement==="Page"){return"fe::PageVariantManagement"}if(e&&e.variantManagement==="Control"){return a([t.filterBarId,"VariantManagement"])}return undefined};n.getVariantBackReference=i;const s=function(e){for(let t=0;t<e.length;t++){if(e[t].defaultPath){return e[t].defaultPath}}};n.getDefaultPath=s;const o=function(){return r};n.getEmphasisSuppressionCondition=o;const u=function(e,t,n){return!e&&!t&&!n};n.isListReportEmphasisSuppressed=u;const f=function(t){return e.isEmphasizedFirstClone(t)?"not-adaptable":undefined};n.getDesigntimeForHeaderAction=f;return n},false);
//# sourceMappingURL=ListReportTemplating.js.map