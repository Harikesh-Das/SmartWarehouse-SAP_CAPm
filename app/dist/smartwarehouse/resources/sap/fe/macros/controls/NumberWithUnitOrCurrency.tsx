import BuildingBlockBase from "sap/fe/base/BuildingBlockBase";
import { defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import HBox from "sap/m/HBox";
import Text from "sap/m/Text";

@defineUI5Class("sap.fe.macros.controls.NumberWithUnitOrCurrency")
export default class NumberWithUnitOrCurrency extends BuildingBlockBase<
	HBox,
	{ number: string; unitOrCurrency: string; visible: boolean }
> {
	@property({
		type: "string"
	})
	public id!: string;

	@property({
		type: "string",
		group: "Data",
		bindToState: true
	})
	public number!: string | number;

	@property({
		type: "string",
		group: "Data",
		bindToState: true
	})
	public unitOrCurrency!: string;

	constructor(propertiesOrId: string | PropertiesOf<NumberWithUnitOrCurrency>, properties?: PropertiesOf<NumberWithUnitOrCurrency>) {
		super(propertiesOrId, properties);
		this.state.visible = this.shouldBeVisible(this.state.number);
		this.content = this.createContent();
	}

	onStateChange(changedKeys: string[]): void {
		if (changedKeys?.includes("number")) {
			this.state.visible = this.shouldBeVisible(this.state.number);
		}
	}

	private shouldBeVisible(value: unknown): boolean {
		return (typeof value === "string" && value.trim() !== "") || (typeof value === "number" && value !== 0);
	}

	createContent(): HBox {
		return (
			<HBox renderType="Bare" justifyContent="End" class="sapFeControlsUnitCurrencyHbox" visible={this.bindState("visible")}>
				<Text textDirection="LTR" wrapping="false" textAlign="End" text={this.bindState("number")}></Text>
				<Text textDirection="LTR" wrapping="false" textAlign="End" text={this.bindState("unitOrCurrency")} width="3.3em"></Text>
			</HBox>
		);
	}
}
