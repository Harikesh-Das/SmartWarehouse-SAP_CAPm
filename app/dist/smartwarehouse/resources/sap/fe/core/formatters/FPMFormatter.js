/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/FPMHelper"],function(e){"use strict";const t=async function(t,n,o){const r=n.split(".");const s=r.pop();const c=r.join("/");return e.loadModuleAndCallMethod(c,s,t,t.getBindingContext(),o||[])};t.__functionName="._formatters.FPMFormatter.bind($control)#customBooleanPropertyCheck";const n=function(e){if(n.hasOwnProperty(e)){for(var t=arguments.length,o=new Array(t>1?t-1:0),r=1;r<t;r++){o[r-1]=arguments[r]}return n[e].apply(this,o)}else{return""}};n.customBooleanPropertyCheck=t;return n},false);
//# sourceMappingURL=FPMFormatter.js.map