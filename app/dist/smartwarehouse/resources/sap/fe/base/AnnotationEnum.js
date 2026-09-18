/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define([],function(){"use strict";var e={};const n={"com.sap.vocabularies.Common.v1.FieldControlType":{Mandatory:7,Optional:3,ReadOnly:0,Inapplicable:0,Disabled:1}};const a=function(e,a){if(!e){return false}const[l,s]=e.split("/");if(n.hasOwnProperty(l)){return n[l][s]}else{const e=a?.enumTypes.by_fullyQualifiedName(l);return e?e.members.by_name(s)?.value:false}};e.resolveEnumValue=a;return e},false);
//# sourceMappingURL=AnnotationEnum.js.map