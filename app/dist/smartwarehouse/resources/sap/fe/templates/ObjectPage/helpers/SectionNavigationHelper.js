/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define([],function(){"use strict";var e={};const t=50;const n=10;const i=3;function o(e){return new Promise(o=>{let c=0;let r=0;const s=()=>{c++;if(e.guardCheck&&!e.guardCheck()){o();return}const u=e.getSelectedSection();if(u!==e.targetSectionId){r=0;e.onResetDetected()}else{r++;if(r>=i){o();return}}if(c<n){setTimeout(s,t)}else{o()}};setTimeout(s,t)})}e.pollForSectionStability=o;return e},false);
//# sourceMappingURL=SectionNavigationHelper.js.map