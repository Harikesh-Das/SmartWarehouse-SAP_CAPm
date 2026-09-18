/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define([],function(){"use strict";const e={buildBindingPath(e,t,i){let r=t.replace(":?query:","");let n=false;for(const u in e){const c=e[u];if(typeof c!=="string"){continue}if(c==="..."&&t.includes(`{${u}}`)){n=true;i.bTargetEditable=true}r=r.replace(`{${u}}`,c)}if(e["?query"]?.["i-action"]?.includes("create")){i.bActionCreate=true}if(r&&r[0]!=="/"){r=`/${r}`}return{path:r,deferred:n}}};return e},false);
//# sourceMappingURL=RoutingHelper.js.map