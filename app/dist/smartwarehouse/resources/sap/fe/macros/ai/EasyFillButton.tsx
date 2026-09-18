import { defineUI5Class, implementInterface, property, type EnhanceWithUI5 } from "sap/fe/base/ClassSupport";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import CommandExecution from "sap/fe/core/controls/CommandExecution";
import type Field from "sap/fe/macros/Field";
import EasyFillDialog from "sap/fe/macros/ai/EasyFillDialog";
import Button from "sap/m/Button";
import OverflowToolbarLayoutData from "sap/m/OverflowToolbarLayoutData";
import type { IOverflowToolbarContent, OverflowToolbarConfig } from "sap/m/library";
import { ButtonType, OverflowToolbarPriority } from "sap/m/library";
import type ManagedObject from "sap/ui/base/ManagedObject";
import FESRHelper from "sap/ui/performance/trace/FESRHelper";

@defineUI5Class("sap.fe.macros.ai.EasyFillButton")
export default class EasyFillButton extends BuildingBlock<Button> implements IOverflowToolbarContent {
	@property({ type: "string" })
	text?: string;

	@implementInterface("sap.m.IOverflowToolbarContent")
	__implements__sap_m_IOverflowToolbarContent = true;

	onMetadataAvailable(_ownerComponent: TemplateComponent): void {
		super.onMetadataAvailable(_ownerComponent);
		this.content = this.createContent();
	}

	async _easyEditDocument(): Promise<void> {
		if (this.getAppComponent()?.getEnvironmentCapabilities().getCapabilities().EasyEdit) {
			const controller = this.getPageController();
			const view = controller.getView();
			if (!this.getPageController()?.getModel("ui").getProperty("/isEditable")) {
				await controller.editFlow.editDocument.apply(controller.editFlow, [view?.getBindingContext()]);
			}
			// Open easy create dialog
			const easyEditDialog = this.getPageController()
				.getOwnerComponent()
				?.runAsOwner(() => {
					return new EasyFillDialog({ getEditableFields: this._getEditableFields.bind(this) });
				});

			easyEditDialog.open();
			view?.addDependent(easyEditDialog);
		}
	}

	async _getEditableFields(): Promise<unknown> {
		// Connect all sections
		const allFields = this.getPageController()
			.getView()
			?.findAggregatedObjects(true, (control: ManagedObject): boolean => {
				return control.isA("sap.fe.macros.Field");
			}) as EnhanceWithUI5<Field>[];
		const editableFields: Record<string, { isEditable: boolean }> = {};
		allFields.forEach((field) => {
			const propertyRelativePath = field.getMainPropertyRelativePath();
			if (propertyRelativePath) {
				if (editableFields[propertyRelativePath] === undefined) {
					editableFields[propertyRelativePath] = { isEditable: field.getEditable() };
				} else {
					// If the field is already in the editableFields object, we combine the editable state, if at least one field is editable then we consider it editable
					editableFields[propertyRelativePath].isEditable =
						editableFields[propertyRelativePath].isEditable || field.getEditable();
				}
			}
		});
		return Promise.resolve(editableFields);
	}

	createContent(): Button | undefined {
		if (this.getAppComponent()?.getEnvironmentCapabilities().getCapabilities().EasyEdit) {
			this.getPageController()
				.getView()
				?.addDependent(<CommandExecution execute={this._easyEditDocument.bind(this)} command="EasyEdit" />);

			const button = (
				<Button
					id={this.createId("button")}
					dt:designtime="not-adaptable"
					text={this.getTranslatedText("C_EASYEDIT_BUTTON")}
					icon="sap-icon://ai"
					type={ButtonType.Ghost}
					jsx:command="cmd:EasyEdit|press"
					ariaDescribedBy={["fe::AiAction::AriaText"]}
				/>
			);
			this.setLayoutData(<OverflowToolbarLayoutData priority={OverflowToolbarPriority.High} />);
			FESRHelper.setSemanticStepname(button, "press", "fe4:ef:easyfill");
			return button;
		}
		this.setVisible(false);
	}

	getOverflowToolbarConfig(): OverflowToolbarConfig {
		return {
			canOverflow: true
		};
	}
}
