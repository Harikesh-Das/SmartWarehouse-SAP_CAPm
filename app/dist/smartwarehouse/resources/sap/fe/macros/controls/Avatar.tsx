import type { BindingToolkitExpression, CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, constant, equal, ifElse, pathInModel, wrapPrimitive } from "sap/fe/base/BindingToolkit";
import BuildingBlockBase from "sap/fe/base/BuildingBlockBase";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import UI5Avatar from "sap/m/Avatar";
import AvatarColor from "sap/m/AvatarColor";
import AvatarImageFitType from "sap/m/AvatarImageFitType";
import AvatarShape from "sap/m/AvatarShape";
import LightBox from "sap/m/LightBox";
import LightBoxItem from "sap/m/LightBoxItem";
import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import type { $ControlSettings } from "sap/ui/core/Control";

/**
 * Simple building block for rendering an avatar.
 *
 * - Converter (Avatar.ts) = Business logic ("WHAT to show")
 *   - Interprets HeaderInfo annotations
 *   - Determines shape based on IsNaturalPerson
 *   - Resolves image sources and fallback icons
 *   - Computes lightBoxTitle and lightBoxSubtitle from HeaderInfo
 * - Avatar BB (this) = Presentation logic ("HOW to show it")
 *   - Applies backgroundColor rules for visual consistency
 *   - Applies imageFitType rules based on shape
 *   - Renders the actual UI control (including LightBox when enabled)
 * @private
 */
@defineUI5Class("sap.fe.macros.controls.Avatar")
export default class Avatar extends BuildingBlockBase {
	@property({ type: "any", isBindingInfo: true })
	src?: string | PropertyBindingInfo;

	@property({ type: "string" })
	initials?: string;

	@property({ type: "string" })
	fallbackIcon?: string;

	@property({ type: "string" })
	displayShape?: string;

	@property({ type: "string" })
	displaySize?: string;

	@property({ type: "string", isBindingInfo: true })
	imageFitType?: string;

	@property({ type: "string", isBindingInfo: true })
	tooltip?: string;

	@property({ type: "boolean" })
	visible?: string | boolean = true;

	@property({ type: "boolean" })
	showLightBox?: boolean = false;

	@property({ type: "string", isBindingInfo: true })
	lightBoxTitle?: string | PropertyBindingInfo;

	@property({ type: "string", isBindingInfo: true })
	lightBoxSubtitle?: string | PropertyBindingInfo;

	@property({ type: "string" })
	class?: string = "";

	constructor(settings: PropertiesOf<Avatar>, others?: $ControlSettings) {
		super(settings, others);
		this.content = this.createContent();
	}

	private createContent(): UI5Avatar | undefined {
		if (!this.src) {
			return;
		}

		// Apply presentation rules
		const backgroundColor = this.getBackgroundColor();
		const imageFitType = this.getImageFitType();

		const avatar = (
			<UI5Avatar
				src={this.src}
				initials={this.initials}
				fallbackIcon={this.fallbackIcon}
				displayShape={this.displayShape}
				displaySize={this.displaySize}
				imageFitType={imageFitType || undefined}
				backgroundColor={backgroundColor}
				tooltip={this.tooltip}
				visible={this.visible}
			>
				{this.showLightBox === true
					? {
							detailBox: (
								<LightBox>
									<LightBoxItem imageSrc={this.src} title={this.lightBoxTitle} subtitle={this.lightBoxSubtitle} />
								</LightBox>
							)
					  }
					: undefined}
			</UI5Avatar>
		);
		avatar.addStyleClass(this.class || "sapUiSmallMarginEnd");

		return avatar;
	}

	/**
	 * Gets the background color for the avatar based on the imageFitType.
	 * Rule: If imageFitType is Contain, use Transparent background; otherwise use Accent6.
	 * @returns The compiled expression for backgroundColor
	 */
	private getBackgroundColor(): CompiledBindingToolkitExpression {
		return compileExpression(
			ifElse(
				equal(this.getPropertyExpression(this.imageFitType), constant(AvatarImageFitType.Contain)),
				constant(AvatarColor.Transparent),
				constant(AvatarColor.Accent6)
			)
		);
	}

	/**
	 * Gets the image fit type for the avatar based on the displayShape.
	 * Rule: If displayShape is Circle, force Cover mode; otherwise use provided imageFitType.
	 * @returns The compiled expression for imageFitType
	 */
	private getImageFitType(): CompiledBindingToolkitExpression {
		return compileExpression(
			ifElse(
				equal(this.getPropertyExpression(this.displayShape), constant(AvatarShape.Circle)),
				constant(AvatarImageFitType.Cover),
				this.getPropertyExpression(this.imageFitType)
			)
		);
	}

	/**
	 * Helper function to convert property to binding expression.
	 * @param propertyValue The property value to convert
	 * @returns A BindingToolkitExpression
	 */
	private getPropertyExpression(propertyValue: string | { path: string } | undefined): BindingToolkitExpression<string> {
		if (propertyValue !== undefined && typeof propertyValue === "object" && "path" in propertyValue) {
			return pathInModel(propertyValue.path);
		}
		return wrapPrimitive(propertyValue ?? "");
	}

	/**
	 * Refreshes the avatar cache busting to reload the image.
	 * Delegates to the underlying sap.m.Avatar control.
	 */
	public refreshAvatarCacheBusting(): void {
		const avatarControl: UI5Avatar | undefined = this.content as UI5Avatar;
		if (avatarControl?.isA("sap.m.Avatar")) {
			avatarControl.refreshAvatarCacheBusting();
		}
	}

	/**
	 * Gets the content (the underlying sap.m.Avatar control).
	 * @returns The sap.m.Avatar control
	 */
	public getContent(): UI5Avatar | undefined {
		return this.content as UI5Avatar;
	}

	/**
	 * Gets the ID for the label association.
	 * Delegates to the underlying sap.m.Avatar control.
	 * @returns The ID for the label
	 */
	public getIdForLabel(): string {
		const oAvatar = this.content;
		return (oAvatar as UI5Avatar).getIdForLabel();
	}
}
