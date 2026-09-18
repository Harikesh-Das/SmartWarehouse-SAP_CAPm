/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/m/Column","sap/m/Label","sap/m/Table"],function(e,a,t){"use strict";var n={};function r(t,n){return t.map(t=>new e({header:new a({text:t.label,wrapping:true}),...n?{width:n[t.propNames[0]]??"10rem"}:{}}))}n.createPreviewColumns=r;function i(e,a,n){const r={columns:e,items:a,autoPopinMode:!n,fixedLayout:n};if(!n){r.contextualWidth="Auto"}const i=new t(r);i.addStyleClass("sapFeEasyFillPreviewTable");return i}n.createPreviewTable=i;return n},false);
//# sourceMappingURL=TablePreviewRenderer.js.map