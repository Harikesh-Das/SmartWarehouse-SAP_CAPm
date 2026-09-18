import Log from "sap/base/Log";
import { defineUI5Class, implementInterface, property } from "sap/fe/base/ClassSupport";
import CommonUtils from "sap/fe/core/CommonUtils";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import Button from "sap/m/Button";
import OverflowToolbarLayoutData from "sap/m/OverflowToolbarLayoutData";
import { ButtonType, OverflowToolbarPriority } from "sap/m/library";
import type UI5Element from "sap/ui/core/Element";
import FESRHelper from "sap/ui/performance/trace/FESRHelper";

/**
 * Summarization button building block.
 *
 * If the summarization feature is available, this building block will render a button that triggers the summarization feature.
 */
@defineUI5Class("sap.fe.macros.ai.SummarizationButton")
export default class SummarizationButton extends BuildingBlock {
	@implementInterface("sap.m.IOverflowToolbarContent")
	__implements__sap_m_IOverflowToolbarContent = true;
	/**
	 * The ID of the button.
	 */
	@property({ type: "string", required: true })
	public id!: string;

	fesrStepName = "fe4:sum:summarize";

	onMetadataAvailable(): void {
		this.content = this.createContent();
	}

	getOverflowToolbarConfig(): object {
		return {
			canOverflow: true
		};
	}

	createContent(): Button | undefined {
		const environmentService = this.getAppComponent()?.getEnvironmentCapabilities();
		let button;
		if (environmentService?.environmentCapabilities.SmartSummarize === true) {
			button = (
				<Button
					id={this.createId("button")}
					dt:designtime="not-adaptable"
					text="{sap.fe.i18n>SUMMARIZE}"
					icon="sap-icon://ai"
					type={ButtonType.Ghost}
					ariaDescribedBy={["fe::AiAction::AriaText"]}
					press={async (event): Promise<void> => {
						try {
							await environmentService?.prepareFeature("SmartSummarize");
							const library = await import("ux/eng/fioriai/reuse/summary/SmartSummary");
							const triggerButton: UI5Element = event.getSource();
							await library.summarize({ view: CommonUtils.getTargetView(this), triggerElement: triggerButton });
						} catch (error) {
							Log.error("Summarization failed", error as Error);
						}
					}}
				></Button>
			);
			this.setLayoutData(<OverflowToolbarLayoutData priority={OverflowToolbarPriority.High} />);
			FESRHelper.setSemanticStepname(button, "press", this.fesrStepName);
		}
		return button;
	}
}
