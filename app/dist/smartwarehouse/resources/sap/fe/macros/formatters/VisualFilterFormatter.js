/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/formatters/Scope"],function(t){"use strict";const e=function(t,e,r){e=e==="undefined"?"":e;r=r==="undefined"?"":r;const n=`${t}${r} ${e}`;const o=e?`${t}${e}`:"";const a=r?`${t}${r}`:o;return e&&r?n:a};e.__functionName="._formatters.VisualFilterFormatter#formatScaleAndUOM";const r=function(t){if(r.hasOwnProperty(t)){for(var e=arguments.length,n=new Array(e>1?e-1:0),o=1;o<e;o++){n[o-1]=arguments[o]}return r[t].apply(this,n)}else{return""}};r.formatScaleAndUOM=e;t._formatters.VisualFilterFormatter=r;return r},false);
//# sourceMappingURL=VisualFilterFormatter.js.map