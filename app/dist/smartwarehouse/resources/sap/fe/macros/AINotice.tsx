import { aggregation, defineUI5Class } from "sap/fe/base/ClassSupport";
import { default as AINoticeControl } from "sap/fe/controls/AINotice";
import type Control from "sap/ui/core/Control";

/**
 * Building block that displays a AI notice.
 *
 * It's used to display information related to AI features. This information is rendered either
 * as a link if the aggregation popoverContent is defined or as a label if there is no aggregation popoverContent.
 * @public
 * @since 1.145.0
 */
@defineUI5Class("sap.fe.macros.AINotice")
export default class AINotice extends AINoticeControl {
	// the implementation of the AI Notice is done in the AINotice control as it needs to be shared between FEv2 and FeV4

	/**
	 * The content to display into the popover
	 * @public
	 */
	@aggregation({ type: "sap.ui.core.Control", multiple: true, isDefault: true })
	popoverContent?: Control;
}
