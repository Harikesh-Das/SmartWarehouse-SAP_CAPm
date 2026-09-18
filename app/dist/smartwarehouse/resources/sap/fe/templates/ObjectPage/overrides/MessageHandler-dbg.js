/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils"], function (CommonUtils) {
  "use strict";

  const MessageHandlerExtension = {
    getShowBoundMessagesInMessageDialog: function () {
      // in case of edit mode we show the messages in the message popover
      return !CommonUtils.getIsEditable(this.base) || this.base.getView().getBindingContext("internal").getProperty("isOperationDialogOpen") || this.base.getView().getBindingContext("internal").getProperty("getBoundMessagesForMassEdit");
    },
    filterContextBoundMessages(transitionMessages, context) {
      const boundContextMessages = [];
      transitionMessages?.forEach(message => {
        if (message.getTargets().length === 1 && message.getTargets()[0] === context?.getPath() && message.getPersistent() === true) {
          // Do not filter out ETag messages (412 with concurrent modification) as they are critical for user awareness
          const technicalDetails = message.getTechnicalDetails();
          if (!(technicalDetails?.httpStatus === 412 && technicalDetails?.isConcurrentModification)) {
            boundContextMessages.push(message);
          }
        }
      });
      if (boundContextMessages.length === 1) {
        transitionMessages = transitionMessages?.filter(function (message) {
          return message !== boundContextMessages[0];
        });
      }
      return transitionMessages;
    }
  };
  return MessageHandlerExtension;
}, false);
//# sourceMappingURL=MessageHandler-dbg.js.map
