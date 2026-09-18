import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";

/**
 * Share Options.
 * @public
 */
@defineUI5Class("sap.fe.macros.share.ShareOptions")
export default class ShareOptions extends BuildingBlockObjectProperty {
	constructor(idOrProps?: string | PropertiesOf<ShareOptions>, props?: PropertiesOf<ShareOptions>) {
		let checkProps = props;
		if (typeof idOrProps !== "string") {
			checkProps = idOrProps;
		}
		const showSendEmail = checkProps?.showSendEmail;
		const showCollaborationManager = checkProps?.showCollaborationManager;
		const showMsTeamsOptions = checkProps?.showMsTeamsOptions;
		const showSaveAsTile = checkProps?.showSaveAsTile;
		const showShareInWorkzone = checkProps?.showShareInWorkzone;
		super(idOrProps as string, props); // Ignore incoming binding resolution
		this.showSendEmail = showSendEmail;
		this.showCollaborationManager = showCollaborationManager;
		this.showMsTeamsOptions = showMsTeamsOptions;
		this.showSaveAsTile = showSaveAsTile;
		this.showShareInWorkzone = showShareInWorkzone;
	}

	@property({ type: "boolean", isBindingInfo: true })
	showSendEmail?: boolean | CompiledBindingToolkitExpression;

	@property({ type: "boolean", isBindingInfo: true })
	showCollaborationManager?: boolean | CompiledBindingToolkitExpression;

	@property({ type: "boolean", isBindingInfo: true })
	showMsTeamsOptions?: boolean | CompiledBindingToolkitExpression;

	@property({ type: "boolean", isBindingInfo: true })
	showSaveAsTile?: boolean | CompiledBindingToolkitExpression;

	/**
	 * Controls visibility of the "Share in SAP Build Work Zone" option.
	 * This option appears as either "Share in SAP Jam" or "Share in SAP Build Work Zone"
	 * depending on the customer's deployment. Both labels refer to the same functionality.
	 * @public
	 */
	@property({ type: "boolean", isBindingInfo: true })
	showShareInWorkzone?: boolean | CompiledBindingToolkitExpression;
}
