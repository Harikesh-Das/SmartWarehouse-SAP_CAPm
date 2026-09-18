import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import Button from "sap/m/Button";
import type { PlacementType } from "sap/m/library";
import OverflowToolbar from "sap/m/OverflowToolbar";
import Popover from "sap/m/Popover";
import Text from "sap/m/Text";
import ToolbarSpacer from "sap/m/ToolbarSpacer";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import Lib from "sap/ui/core/Lib";
import type View from "sap/ui/core/mvc/View";

function getParentView(control: Control): View | undefined {
	let current: ManagedObject | null = control;
	while (current && !current.isA<View>("sap.ui.core.mvc.View")) {
		current = current.getParent();
	}
	return current ?? undefined;
}

export default {
	/**
	 * Generates a popover with AI notice content. The popover is opened by the provided parent control.
	 * @param params An object containing parameters for generating the popover
	 * @param params.parent The control that opens the popover
	 * @param params.placementType Optional placement type for the popover
	 * @param params.content Optional content for the popover. If not provided, default content is used.
	 * @param params.contentText Optional text content for the popover. Use this instead of content to support i18n binding strings.
	 * @returns The generated Popover instance
	 */
	generatePopover(params: {
		parent: Control;
		placementType?: PlacementType;
		content?: Control | Control[];
		contentText?: string;
	}): Popover {
		const { parent, placementType } = params;
		const resourceBundle = Lib.getResourceBundleFor("sap.fe.controls") as ResourceBundle;

		const resolveContent = (): Control | Control[] | undefined => {
			if (params.contentText !== undefined) {
				return new Text({ text: params.contentText });
			}
			const { content } = params;
			return Array.isArray(content) ? content.map((item: Control) => item.clone()) : content?.clone();
		};

                const view = getParentView(params.parent);
		const myPopover = (
			<Popover
				class="sapUiContentPadding"
				contentMinWidth={"22.8125rem"}
				showArrow={true}
				showHeader={true}
				placement={placementType}
				title={resourceBundle.getText("M_POPOVER_AI_TITLE")}
				afterClose={(): void => {
					view?.removeDependent(myPopover);
					myPopover?.destroy();
				}}
			>
				{{
					content: resolveContent(),
					footer: (
						<OverflowToolbar>
							{{
								content: (
									<>
										<ToolbarSpacer />
										<Button
											text={resourceBundle.getText("M_NOTICE_AI_CLOSE")}
											press={(): void => {
												myPopover.close();
											}}
										/>
									</>
								)
							}}
						</OverflowToolbar>
					)
				}}
			</Popover>
		);
		view?.addDependent(myPopover);
		myPopover.openBy(parent);
		return myPopover;
	}
};
