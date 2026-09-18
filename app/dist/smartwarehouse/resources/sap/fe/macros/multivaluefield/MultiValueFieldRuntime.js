/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["../field/FieldRuntimeHelper"],function(e){"use strict";const n={handleChange:async function(n,t){const i=t.getSource(),r=i.getBindingContext(),s=r?.isTransient()??false,o=t.getParameter("promise")??Promise.resolve("");const a=e.getExtensionController(n);await a.editFlow.syncTask(o);if(s){return}a.sideEffects.prepareDeferredSideEffectsForField(t,true,o)},onValidateFieldGroup:async function(n,t){const i=e.getExtensionController(n);await i.sideEffects.handleFieldGroupChange(t)}};return n},false);
//# sourceMappingURL=MultiValueFieldRuntime.js.map