/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define([],function(){"use strict";var e={};function n(e){let n=arguments.length>1&&arguments[1]!==undefined?arguments[1]:[""];n=n===null?[""]:n;if(!n?.includes("")){n.push("")}return e.filter(function(e){return n.some(function(n){let t;switch(n){case"":t="^[^/]*$";break;case"*":case"*/*":t=".*";break;default:t=n.includes("/")?"^"+n.replace(/\*/g,".*").replace("/","\\/")+"$":"^"+n.replace(/\*/g,".*")+"\\/.*"}return new RegExp(t).test(e.name)})})}e.filterNavigationForAdaptation=n;return e},false);
//# sourceMappingURL=Adaptation.js.map