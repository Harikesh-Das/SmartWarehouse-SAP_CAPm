import Log from "sap/base/Log";
import type AppComponent from "sap/fe/core/AppComponent";
import CommonUtils from "sap/fe/core/CommonUtils";
import ResourceModelHelper from "sap/fe/core/helpers/ResourceModelHelper";
import FELibrary from "sap/fe/core/library";
import type TableAPI from "sap/fe/macros/Table";
import MessageBox from "sap/m/MessageBox";
import ElementRegistry from "sap/ui/core/ElementRegistry";
import Messaging from "sap/ui/core/Messaging";
import Message from "sap/ui/core/message/Message";
import MessageType from "sap/ui/core/message/MessageType";
import JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataContextBinding from "sap/ui/model/odata/v4/ODataContextBinding";
import StrictDialog from "../../dialog/ODataStrictDialog";
import messageHandling from "../../messageHandler/messageHandling";
const InvocationGrouping = FELibrary.InvocationGrouping;

export default class ODataStrictHandling {
	private strictHandlingResolves: { handlingResolve: (value: boolean) => void; onContextValidation: Function }[] = [];

	private strictHandlingWarningMessages: Message[] = [];

	private canceled = false;

	private readonly tableAPI: TableAPI | undefined;

	/**
	 * Creates an instance of ODataStrictHandling.
	 * This class is used to handle strict handling operations in OData V4.
	 * It manages the responses from the OData service when strict handling is enabled,
	 * and provides a way to display messages to the user when operations fail due to strict handling.
	 * @param parameters The parameters for the strict handling.
	 * @param parameters.appComponent The AppComponent instance.
	 * @param parameters.contexts An array of Context instances used for the operation.
	 * @param parameters.label A label for the operation, used in messages.
	 * @param parameters.invocationGrouping Optional parameter to specify the grouping of the invocation (e.g., ChangeSet).
	 * @param parameters.events The events for the strict handling
	 * @param parameters.events.onResponse The event triggered when the back end returns 412 messages.
	 * @param parameters.events.onCancel The event triggered when the strict handling is canceled by the end user.
	 * @param parameters.events.onValidation The event triggered when the strict handling is validated by the end user.
	 */
	constructor(
		private readonly parameters: {
			appComponent: AppComponent;
			contexts: Context[];
			label: string;
			invocationGrouping?: string;
			events?: {
				onResponse?: (messages: Message[]) => void;
				onCancel?: () => void;
				onValidation?: () => void;
			};
		}
	) {
		if (this.parameters.contexts.length) {
			const binding = this.parameters.contexts[0].getBinding();
			if (binding?.isA("sap.ui.model.odata.v4.ODataListBinding")) {
				this.tableAPI = ElementRegistry.filter(
					(element) => element.isA<TableAPI>("sap.fe.macros.Table") && element.getContent()?.getRowBinding() === binding
				)[0] as TableAPI | undefined;
			}
		}
	}

	async handleOdataStrictHandling(
		operationContextBinding: ODataContextBinding,
		internalOperationsPromiseResolve: Function | undefined,
		onContextValidation: Function,
		messages412: Message[] = []
	): Promise<boolean> {
		let handlingResolve!: (value: boolean) => void;
		const strictHandlingPromise = new Promise<boolean>(function (resolve) {
			handlingResolve = resolve;
		});
		this.strictHandlingResolves.push({ handlingResolve, onContextValidation });
		// Find error message in the 412 response and raise warning.
		if (messages412.filter((message) => message.getType() === MessageType.Error).length) {
			Log.warning(
				"Warning: 412 ('Pre-condition Check Failed due to strict-handling') returns messages of type error but only warning messages are appropriate!"
			);
		}
		let additionalText = "";
		// If there is more than one context we need the identifier. This would fix if the action is triggered via table chevron
		if (this.parameters.contexts.length > 1) {
			const column = this.tableAPI?.getIdentifierColumn();
			if (typeof column === "string") {
				additionalText = operationContextBinding.getContext()?.getObject(column);
			}
		}
		// set type and subtitle for all warning messages
		for (const message of messages412) {
			message.setAdditionalText(additionalText);
			this.strictHandlingWarningMessages.push(message);
		}
		this.parameters.events?.onResponse?.(messages412);
		internalOperationsPromiseResolve?.();
		return strictHandlingPromise;
	}

	public isCanceled = (): boolean => {
		return this.canceled;
	};

	/**
	 * Manages the strict handling fails.
	 * @returns The promise of the strict handling
	 */
	public async manageStrictHandlingFails(): Promise<void> {
		if (this.strictHandlingResolves.length) {
			try {
				if (
					(!messageHandling.hasTransitionErrorsOrWarnings() ||
						this.parameters.invocationGrouping !== InvocationGrouping.ChangeSet) &&
					this.strictHandlingWarningMessages.length
				) {
					await this.displayMessages();
				} else {
					for (const strictHandlingResolve of this.strictHandlingResolves) {
						strictHandlingResolve.handlingResolve(false);
					}
					const messageModel = Messaging.getMessageModel();
					const messagesInModel = messageModel.getData();
					messageModel.setData(messagesInModel.concat(this.strictHandlingWarningMessages));
				}
			} catch {
				Log.error("Re-triggering of strict handling operations failed");
			}
		}
	}

	private async displayMessages(): Promise<void> {
		const messages = this.strictHandlingWarningMessages;
		if (!messages.length) {
			return;
		}
		const actionName = ResourceModelHelper.getLocalizedText(this.parameters.label, this.parameters.appComponent);
		return messages.length === 1 && !(messages[0].getDescription()?.length || messages[0].getDescriptionUrl()?.length)
			? this.displayMessageOnMessageBox(messages[0], actionName)
			: this.displayMessagesOnDialog(messages, actionName);
	}

	private async displayMessageOnMessageBox(message: Message, actionName: string): Promise<void> {
		let messageResolve!: Function;
		const promise = new Promise<void>((resolve) => {
			messageResolve = resolve;
		});
		const resourceModel = ResourceModelHelper.getResourceModel(this.parameters.appComponent);
		const messageText = message.getMessage();
		const identifierText = message.getAdditionalText();
		const isMultiContext412 = this.parameters.contexts.length > 1;
		const genericChangesetMessage = resourceModel.getText("C_COMMON_DIALOG_CANCEL_SINGLE_MESSAGE_TEXT");
		const warningMessageText =
			this.parameters.invocationGrouping === InvocationGrouping.ChangeSet
				? resourceModel.getText("C_COMMON_DIALOG_CANCEL_MESSAGE_TEXT", [actionName])
				: resourceModel.getText("C_COMMON_DIALOG_SKIP_SINGLE_MESSAGE_TEXT");
		let cancelButtonTxt: string = resourceModel.getText("C_COMMON_DIALOG_CANCEL");
		let displayedMessage = "";
		if (!isMultiContext412) {
			displayedMessage = `${messageText}\n${resourceModel.getText("PROCEED")}`;
		} else if (identifierText !== undefined && identifierText !== "") {
			cancelButtonTxt =
				this.parameters.invocationGrouping === InvocationGrouping.ChangeSet
					? cancelButtonTxt
					: resourceModel.getText("C_COMMON_DIALOG_SKIP");
			const tableTypeName = this.tableAPI?.getTableDefinition().headerInfoTypeName;
			const headerInfoTypeName =
				this.tableAPI && typeof tableTypeName === "string"
					? CommonUtils.getTranslatedTextFromExpBindingString(tableTypeName, this.tableAPI)
					: tableTypeName;
			if (headerInfoTypeName) {
				displayedMessage = `${headerInfoTypeName.toString()} ${identifierText}: ${messageText}\n\n${warningMessageText}`;
			} else {
				displayedMessage = `${identifierText}: ${messageText}\n\n${warningMessageText}`;
			}
		} else {
			cancelButtonTxt =
				this.parameters.invocationGrouping === InvocationGrouping.ChangeSet
					? cancelButtonTxt
					: resourceModel.getText("C_COMMON_DIALOG_SKIP");
			displayedMessage = `${messageText}\n\n${warningMessageText}`;
		}
		if (isMultiContext412 && this.parameters.invocationGrouping === InvocationGrouping.ChangeSet) {
			displayedMessage = `${genericChangesetMessage}\n\n${displayedMessage}`;
		}
		MessageBox.warning(displayedMessage, {
			title: resourceModel.getText("WARNING"),
			actions: [actionName, cancelButtonTxt],
			emphasizedAction: actionName,
			onClose: (action: string) => {
				this[action === actionName ? "handleMessageOnValidation" : "handleMessageOnCancel"]();
				messageResolve();
			}
		});
		return promise;
	}

	private async displayMessagesOnDialog(messages: Message[], actionName: string): Promise<void> {
		let messageResolve!: Function;
		const promise = new Promise<void>((resolve) => {
			messageResolve = resolve;
		});
		const messageDialogModel = new JSONModel();
		const resourceModel = ResourceModelHelper.getResourceModel(this.parameters.appComponent);
		const isMultiContext412 = this.parameters.contexts.length > 1;
		let warningMessage = "";
		let warningDesc = "";
		let cancelButtonTxt: string = resourceModel.getText("C_COMMON_DIALOG_CANCEL");
		if (isMultiContext412) {
			cancelButtonTxt =
				this.parameters.invocationGrouping === InvocationGrouping.ChangeSet
					? cancelButtonTxt
					: resourceModel.getText("C_COMMON_DIALOG_SKIP");
			warningMessage = resourceModel.getText(
				this.parameters.invocationGrouping === InvocationGrouping.ChangeSet
					? "C_COMMON_DIALOG_CANCEL_MESSAGES_WARNING"
					: "C_COMMON_DIALOG_SKIP_MESSAGES_WARNING"
			);
			warningDesc = resourceModel.getText(
				this.parameters.invocationGrouping === InvocationGrouping.ChangeSet
					? "C_COMMON_DIALOG_CANCEL_MESSAGES_TEXT"
					: "C_COMMON_DIALOG_SKIP_MESSAGES_TEXT",
				[actionName]
			);
		} else {
			warningMessage = resourceModel.getText("C_COMMON_DIALOG_CANCEL_MESSAGES_GENERIC_ACTION_WARNING", [actionName]);
		}
		const genericMessage = new Message({
			message: warningMessage,
			type: MessageType.Information,
			target: undefined,
			persistent: true,
			description: warningDesc.length ? warningDesc : undefined
		});
		messages = [genericMessage].concat(messages);
		messageDialogModel.setData(messages);
		new StrictDialog({
			messageObject: messageHandling.prepareMessageViewForDialog(messageDialogModel, true, isMultiContext412),
			actionName,
			messageDialogModel,
			cancelButtonTxt,
			onBeginButtonPress: this.handleMessageOnValidation.bind(this),
			onEndButtonPress: this.handleMessageOnCancel.bind(this),
			onClose: messageResolve
		}).open();
		return promise;
	}

	private handleMessageOnValidation(): void {
		for (const strictHandlingResolve of this.strictHandlingResolves) {
			strictHandlingResolve.onContextValidation();
			strictHandlingResolve.handlingResolve(true);
		}
		messageHandling.removeBoundTransitionMessages();
		messageHandling.removeUnboundTransitionMessages();
		this.strictHandlingWarningMessages = [];
		this.parameters.events?.onValidation?.();
	}

	private handleMessageOnCancel(): void {
		const resourceModel = ResourceModelHelper.getResourceModel(this.parameters.appComponent);
		this.strictHandlingWarningMessages = [];
		this.canceled = true;
		for (const strictHandlingResolve of this.strictHandlingResolves) {
			strictHandlingResolve.handlingResolve(false);
		}
		this.strictHandlingResolves = [];
		if (this.parameters.invocationGrouping === InvocationGrouping.ChangeSet) {
			MessageBox.information(resourceModel.getText("M_CHANGESET_CANCEL_MESSAGES"), {
				contentWidth: "150px"
			} as object);
		}
		this.parameters.events?.onCancel?.();
	}
}
