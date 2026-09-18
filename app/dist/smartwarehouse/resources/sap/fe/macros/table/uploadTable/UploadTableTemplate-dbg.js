/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/macros/field/FieldHelper", "sap/m/plugins/UploadSetwithTable", "sap/m/upload/UploadItemConfiguration", "sap/fe/base/jsx-runtime/jsx"], function (BindingToolkit, FieldHelper, UploadSetwithTable, UploadItemConfiguration, _jsx) {
  "use strict";

  var _exports = {};
  var not = BindingToolkit.not;
  function getUploadButtonInvisible(tableDefinition, uploadConfiguration) {
    // Use override from configuration if provided
    if (uploadConfiguration?.uploadButtonInvisible !== undefined) {
      return uploadConfiguration.uploadButtonInvisible;
    }
    if (tableDefinition.annotation?.uploadTable?.uploadAction?.isTemplated && tableDefinition.annotation?.uploadTable?.uploadAction?.visibleExpression) {
      return not(tableDefinition.annotation.uploadTable.uploadAction.visibleExpression);
    } else {
      // not create enabled, therefore upload button is always invisible
      return true;
    }
  }
  function getUploadPlugin(tableDefinition, id, handlerProvider, uploadConfiguration) {
    const fileNameValidationConfig = {
      mode: "override",
      characters: '[]/\\<>|?:;,"{}*'
    };
    const eventWrapper = (eventName, defaultHandler) => {
      if (uploadConfiguration?.hasListeners(eventName) === true) {
        return eventParamsOrEvent => {
          // For events, parameters need to be extracted from the event object
          const params = eventParamsOrEvent?.getParameters?.() ?? {};
          return uploadConfiguration.fireEvent(eventName, params);
        };
      }
      return defaultHandler;
    };
    const propertyWrapper = (propertyName, defaultValue) => {
      const propertyValue = uploadConfiguration?.getProperty(propertyName);
      return propertyValue !== undefined ? propertyValue : defaultValue;
    };
    const uploadButtonInvisible = propertyWrapper("uploadButtonInvisible", getUploadButtonInvisible(tableDefinition, uploadConfiguration));
    return _jsx(UploadSetwithTable, {
      "core:require": "{UploadTableRuntime: 'sap/fe/macros/table/uploadTable/UploadTableRuntime'}",
      httpRequestMethod: propertyWrapper("httpRequestMethod", "Put"),
      multiple: propertyWrapper("multiple", false),
      uploadButtonInvisible: uploadButtonInvisible,
      itemValidationHandler: propertyWrapper("itemValidationHandler", handlerProvider.uploadItemValidationHandler),
      mediaTypeMismatch: handlerProvider.uploadMediaTypeMismatch,
      fileSizeExceeded: eventWrapper("fileSizeExceeded", handlerProvider.uploadFileSizeExceeded),
      maxFileSize: propertyWrapper("maxFileSize", FieldHelper.calculateMBfromByte(tableDefinition.annotation?.uploadTable?.maxLength)),
      uploadCompleted: eventWrapper("uploadCompleted", handlerProvider.uploadCompleted),
      uploadEnabled: tableDefinition.annotation?.uploadTable?.uploadAction?.enabled,
      mediaTypes: tableDefinition.annotation?.uploadTable?.acceptableMediaTypes,
      actions: [`${id}-uploadButton`],
      previewDialog: uploadConfiguration?.getPreviewDialog(),
      uploadUrl: propertyWrapper("uploadUrl", tableDefinition.annotation?.uploadTable?.stream),
      maxFileNameLength: propertyWrapper("maxFileNameLength", tableDefinition.annotation?.uploadTable?.fileNameMaxLength),
      fileNameLengthExceeded: handlerProvider.uploadFileNameLengthExceeded,
      itemRenamed: eventWrapper("itemRenamed", uploadConfiguration?.itemRenamed),
      itemRenameCanceled: eventWrapper("itemRenameCanceled", uploadConfiguration?.itemRenameCanceled),
      onActivated: eventWrapper("onActivated", uploadConfiguration?.onActivated),
      beforeInitiatingItemUpload: eventWrapper("beforeInitiatingItemUpload", uploadConfiguration?.beforeInitiatingItemUpload),
      beforeUploadStarts: eventWrapper("beforeUploadStarts", uploadConfiguration?.beforeUploadStarts),
      fileNameValidationConfig: fileNameValidationConfig,
      children: {
        rowConfiguration: uploadConfiguration?.getRowConfiguration() ?? _jsx(UploadItemConfiguration, {
          fileNamePath: tableDefinition.annotation?.uploadTable?.fileName
        })
      }
    });
  }
  _exports.getUploadPlugin = getUploadPlugin;
  return _exports;
}, false);
//# sourceMappingURL=UploadTableTemplate-dbg.js.map
