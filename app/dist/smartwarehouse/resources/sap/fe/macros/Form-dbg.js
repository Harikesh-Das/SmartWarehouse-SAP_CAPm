/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "./form/FormAPI"], function (ClassSupport, FormAPI) {
  "use strict";

  var _dec, _class;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * Building block for creating a Form based on the metadata provided by OData V4.
   * <br>
   * It is designed to work based on a FieldGroup annotation but can also work if you provide a ReferenceFacet or a CollectionFacet
   *
   *
   * Usage example:
   * <pre>
   * &lt;macros:Form id="MyForm" metaPath="@com.sap.vocabularies.UI.v1.FieldGroup#GeneralInformation" /&gt;
   * </pre>
   */
  let FormBlock = (_dec = defineUI5Class("sap.fe.macros.Form", {
    returnTypes: ["sap.fe.macros.form.FormAPI"]
  }), _dec(_class = /*#__PURE__*/function (_FormAPI) {
    // Re-export constructor signature for proper type inference
    function FormBlock(props, others) {
      return _FormAPI.call(this, props, others) || this;
    }
    _inheritsLoose(FormBlock, _FormAPI);
    return FormBlock;
  }(FormAPI)) || _class);
  return FormBlock;
}, false);
//# sourceMappingURL=Form-dbg.js.map
