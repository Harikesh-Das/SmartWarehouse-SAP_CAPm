/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/ManifestSettings"],function(e){"use strict";var t={};var n=e.TemplateType;function i(e){return!e.UnboundAction?`${e.EntityTypePath}/${e.Action}/${e.Property}`:`/${e.Action.substring(e.Action.lastIndexOf(".")+1)}/${e.Property}`}t.getPropertyPath=i;function r(e){const t=e.indexOf("");if(t>0){e.unshift(e[t]);e.splice(t+1,1)}return e}t.putDefaultQualifierFirst=r;function o(){let e=arguments.length>0&&arguments[0]!==undefined?arguments[0]:null;let t=arguments.length>1&&arguments[1]!==undefined?arguments[1]:false;return{converterType:n.ListReport,columns:e,enableLinksInDialogTable:t}}t.getViewDataForTemplate=o;return t},false);
//# sourceMappingURL=ValueHelpUtils.js.map