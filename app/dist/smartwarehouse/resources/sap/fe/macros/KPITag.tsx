import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, event, property } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import GenericTag, { type GenericTag$PressEvent } from "sap/m/GenericTag";
import ObjectNumber from "sap/m/ObjectNumber";
import type UI5Event from "sap/ui/base/Event";
import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import type { $ControlSettings } from "sap/ui/core/Control";
import type { EventHandler } from "../../../../../../types/extension_types";
/**
 * Building block used to create a KPI tag.
 * @public
 */
@defineUI5Class("sap.fe.macros.KPITag")
export default class KPITag extends BuildingBlock<GenericTag> {
	/**
	 * The ID of the KPI
	 */
	@property({ type: "string", required: true })
	public id!: string;

	/**
	 * The Text to be displayed.
	 * @public
	 */
	@property({ type: "string", isBindingInfo: true })
	public text?: string | PropertyBindingInfo;

	/**
	 * The Status to be displayed.
	 * @public
	 */
	@property({
		type: "string",
		defaultValue: "None",
		allowedValues: ["Success", "Error", "Warning", "None", "Information"],
		isBindingInfo: true
	})
	public status: string | PropertyBindingInfo;

	/**
	 * The Tooltip to be displayed.
	 * @public
	 */
	@property({ type: "string", isBindingInfo: true })
	public tooltip?: string | PropertyBindingInfo;

	/**
	 * An event is triggered when the KPI is pressed.
	 * @public
	 */
	@event()
	public press?: EventHandler<UI5Event<{}, KPITag>>;

	/**
	 * The Number to be displayed.
	 * @public
	 */
	@property({ type: "string", required: true, isBindingInfo: true })
	public number!: string | PropertyBindingInfo;

	/**
	 * The Unit of Measure of the number to be displayed.
	 * @public
	 */
	@property({ type: "string", isBindingInfo: true })
	public unit?: string | PropertyBindingInfo;

	/**
	 * Set it to `true` if the KPI should display its status icon.
	 * @public
	 */
	@property({ type: "boolean", required: false })
	public showIcon = false;

	constructor(properties: $ControlSettings & PropertiesOf<KPITag>, others?: $ControlSettings) {
		super(properties, others);
	}

	onMetadataAvailable(): void {
		if (!this.content) {
			this._getOwner()?.runAsOwner(() => {
				this.content = this.createContent();
			});
		}
	}

	createContent(): GenericTag {
		return (
			<GenericTag
				id={this.createId("_kpi")}
				text={this.text}
				design={this.showIcon ? "Full" : "StatusIconHidden"}
				status={this.status}
				class="sapUiTinyMarginBegin"
				tooltip={this.tooltip}
				press={(e: GenericTag$PressEvent): void => {
					const kpiTag = e.getSource().getParent() as KPITag;
					kpiTag.fireEvent("press");
				}}
			>
				<ObjectNumber state={this.status} emphasized={false} number={this.number} unit={this.unit} />
			</GenericTag>
		);
	}
}
