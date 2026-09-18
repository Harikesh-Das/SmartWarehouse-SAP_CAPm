/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define([],function(){"use strict";var e={};function t(e){let t=arguments.length>1&&arguments[1]!==undefined?arguments[1]:"generatedId";let n=0;const r=new Set;function a(e){if(d(e)&&!e.hasAttribute("id")){const a=i(t,r);e.setAttribute("id",a);r.add(a);n++}for(let t=0;t<e.children.length;t++){a(e.children[t])}}function d(e){const t=e.localName??e.tagName.toLowerCase();return t.length>0&&t.charAt(0)===t.charAt(0).toUpperCase()}function i(e,t){let n=1;let r=`${e}_${n}`;while(t.has(r)||document.getElementById(r)){n++;r=`${e}_${n}`}return r}a(e);return n}e.addGeneratedIdsToControls=t;return e},false);
//# sourceMappingURL=XMLTools.js.map