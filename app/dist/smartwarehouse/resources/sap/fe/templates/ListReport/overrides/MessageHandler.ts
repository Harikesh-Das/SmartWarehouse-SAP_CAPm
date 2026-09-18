import CommonUtils from "sap/fe/core/CommonUtils";
import type MessageHandler from "sap/fe/core/controllerextensions/MessageHandler";
// import type NavContainer from "sap/m/NavContainer";

const MessageHandlerLRExtension = {
	getShowBoundMessagesInMessageDialog: function (this: MessageHandler): boolean {
		// For List Report, determines whether bound messages should be shown in a dialog or not
		const appComponent = this.base.getAppComponent();
		const getCurrentPageView = CommonUtils.getCurrentPageView(appComponent);
		const currentPageViewID = getCurrentPageView?.getId();
		const baseViewID = this.base.getView()?.getId();
		//In FCL scenarios, multiple pages can be visible simultaneously (List Report + Object Page in columns).
		//The original logic prevents showing bound messages from background columns.
		//In non-FCL apps where only one page is visible at a time, this filtering isn't necessary.
		// for a fcl case, when both List Report and Object Page are visible, we want to show message
		if (appComponent._isFclEnabled() && currentPageViewID !== baseViewID && getCurrentPageView?.getViewData()?.viewLevel !== 1) {
			return false;
		}
		return true;
	}
};

export default MessageHandlerLRExtension;
