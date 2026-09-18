import type ContentSwitcher from "sap/fe/macros/contentSwitcher/ContentSwitcher";

/**
 * Interface for building blocks that can be hosted by a ContentSwitcher control.
 *
 * Building blocks that implement this interface can be used as content providers within a ContentSwitcher,
 * which allows users to toggle between different visualization modes (for example, chart view and table view).
 * The ContentSwitcher notifies the host building block when it becomes the active content provider,
 * enabling the host to integrate the switcher control into its toolbar or perform other initialization tasks.
 */
export default interface IContentSwitcherHost {
	/**
	 * Marker property to identify that this control implements the IContentSwitcherHost interface.
	 */
	__implements__sap_fe_macros_contentSwitcher_IContentSwitcherHost: boolean;

	/**
	 * Called by the ContentSwitcher to register itself with the host building block.
	 * This method is invoked when the host building block is set as the active content provider in the ContentSwitcher.
	 * The host can use this callback to integrate the ContentSwitcher control into its action toolbar or perform
	 * other necessary setup to ensure proper coordination between the host and the switcher.
	 */
	setAsHost(contentSwitcher: ContentSwitcher): void;
}
