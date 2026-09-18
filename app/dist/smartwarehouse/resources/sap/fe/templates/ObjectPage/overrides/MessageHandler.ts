import CommonUtils from "sap/fe/core/CommonUtils";
import type MessageHandler from "sap/fe/core/controllerextensions/MessageHandler";
import type { MessageTechnicalDetails } from "sap/fe/core/controllerextensions/messageHandler/messageHandling";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import type Message from "sap/ui/core/message/Message";
import type Context from "sap/ui/model/Context";

const MessageHandlerExtension = {
	getShowBoundMessagesInMessageDialog: function (this: MessageHandler): boolean {
		// in case of edit mode we show the messages in the message popover
		return (
			!CommonUtils.getIsEditable(this.base) ||
			(this.base.getView().getBindingContext("internal") as InternalModelContext).getProperty("isOperationDialogOpen") ||
			(this.base.getView().getBindingContext("internal") as InternalModelContext).getProperty("getBoundMessagesForMassEdit")
		);
	},
	filterContextBoundMessages(transitionMessages: Message[], context: Context): Message[] {
		const boundContextMessages: Message[] = [];
		transitionMessages?.forEach((message: Message) => {
			if (message.getTargets().length === 1 && message.getTargets()[0] === context?.getPath() && message.getPersistent() === true) {
				// Do not filter out ETag messages (412 with concurrent modification) as they are critical for user awareness
				const technicalDetails = message.getTechnicalDetails() as MessageTechnicalDetails;
				if (!(technicalDetails?.httpStatus === 412 && technicalDetails?.isConcurrentModification)) {
					boundContextMessages.push(message);
				}
			}
		});
		if (boundContextMessages.length === 1) {
			transitionMessages = transitionMessages?.filter(function (message: Message) {
				return message !== boundContextMessages[0];
			});
		}
		return transitionMessages;
	}
};

export default MessageHandlerExtension;
