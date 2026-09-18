import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import type { DateTimeStyle } from "sap/fe/core/templating/UIFormatters";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";
import type AvatarImageFitType from "sap/m/AvatarImageFitType";
import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";

export type FieldEditStyle = "RadioButtons";
/**
 * Additional format options for the field.
 * @alias sap.fe.macros.field.FieldFormatOptions
 * @public
 */
@defineUI5Class("sap.fe.macros.field.FieldFormatOptions")
export default class FieldFormatOptions extends BuildingBlockObjectProperty {
	constructor(props?: string | PropertiesOf<FieldFormatOptions>, others?: PropertiesOf<FieldFormatOptions>) {
		super(props as string, others);
	}

	/**
	 * Defines how the field value and associated text will be displayed together.<br/>
	 *
	 * Allowed values are "Value", "Description", "DescriptionValue" and "ValueDescription"
	 *  @public
	 */
	@property({ type: "string" })
	displayMode?: "Value" | "Description" | "DescriptionValue" | "ValueDescription";

	/**
	 * Defines if and how the field measure will be displayed.<br/>
	 *
	 * Allowed values are "Hidden" and "ReadOnly"
	 *  @public
	 */
	@property({ type: "string" })
	measureDisplayMode?: "Hidden" | "ReadOnly";

	/**
	 * Maximum number of lines for multiline texts in edit mode.<br/>
	 * Supports int and string type.
	 *  @public
	 */
	@property({ type: "any", isBindingInfo: true })
	textLinesEdit?: number | string | PropertyBindingInfo;

	/**
	 * Maximum number of lines that multiline texts in edit mode can grow to.<br/>
	 * Supports int and string type.
	 *  @public
	 */
	@property({ type: "any", isBindingInfo: true })
	textMaxLines?: number | string | PropertyBindingInfo;

	/**
	 * Maximum number of characters from the beginning of the text field that are shown initially.<br/>
	 * Supports int and string type.
	 *  @public
	 */
	@property({ type: "any", isBindingInfo: true })
	textMaxCharactersDisplay?: number | string | PropertyBindingInfo;

	/**
	 * Defines how the full text is displayed.<br/>
	 *
	 * Allowed values are "InPlace" and "Popover"
	 *  @public
	 */
	@property({ type: "string" })
	textExpandBehaviorDisplay?: "InPlace" | "Popover";

	/**
	 * Defines the maximum number of characters for the multiline text value.<br/>
	 *
	 * If a multiline text exceeds the maximum number of allowed characters, the counter below the input field displays the exact number.<br/>
	 * Supports int and string type.
	 *  @public
	 */
	@property({ type: "any", isBindingInfo: true })
	textMaxLength?: number | string | PropertyBindingInfo;

	/**
	 * Defines if the date part of a date time with timezone field is shown. <br/>
	 *
	 * The dateTimeOffset field must have a timezone annotation.
	 *
	 * The default value is true.
	 *  @public
	 */
	@property({ type: "boolean" })
	showDate?: boolean;

	/**
	 * Defines if the time part of a date time with timezone field should be shown. <br/>
	 *
	 * The dateTimeOffset field must have a timezone annotation.
	 *
	 * The default value is true.
	 *  @public
	 */
	@property({ type: "boolean" })
	showTime?: boolean;

	/**
	 * Defines if the timezone part of a date time with timezone field should be shown. <br/>
	 *
	 * The dateTimeOffset field must have a timezone annotation.
	 *
	 * The default value is true.
	 *  @public
	 */
	@property({ type: "boolean" })
	showTimezone?: boolean;

	/**
	 * Determines how the field should be rendered, e.g. as radio buttons. <br/>
	 * If not all prerequisites are met, the field will default back to the standard rendering.
	 *  @public
	 */
	@property({ type: "string", allowedValues: ["RadioButtons", ""] })
	fieldEditStyle?: FieldEditStyle;

	/**
	 * Specifies if radio buttons should be rendered in a horizontal layout. <br/>
	 *  @public
	 */
	@property({ type: "boolean" })
	radioButtonsHorizontalLayout?: boolean;
	/**
	 * Property for defining the display style for the date, time, or dateTime format. <br/>
	 * If there is a dateTimePattern defined, dateTimeStyle is ignored.
	 * @public
	 */

	@property({ type: "string", allowedValues: ["short", "medium", "long", "full"] })
	dateTimeStyle?: DateTimeStyle;

	/**
	 * Property for defining a custom pattern for the date, time, or dateTime format. <br/>
	 * If a dateTimePattern is defined, the dateTimeStyle is ignored.
	 * @public
	 */
	@property({ type: "string" })
	dateTimePattern?: string;

	/**
	 *  When the Field is displayed as a clickable element, it defines the size of the reactive area of the clickable element:
	 *
	 * - ReactiveAreaMode.Inline - The link is displayed as part of a sentence.
	 * - ReactiveAreaMode.Overlay - The link is displayed as an overlay on top of other interactive parts of the page.
	 * Note: It is designed to make the clickable element easier to activate and helps meet the WCAG 2.2 Target Size requirement. It is applicable only for the SAP Horizon themes. Note: The size of the reactive area is sufficiently large to help users avoid accidentally selecting (clicking or tapping) unintended UI elements. UI elements positioned over other parts of the page may need an invisible active touch area. This ensures that no elements beneath are activated accidentally when the user tries to interact with the overlay element.
	 * @public
	 */
	@property({ type: "string", allowedValues: ["Inline", "Overlay"] })
	reactiveAreaMode?: "Inline" | "Overlay";

	/**
	 * Indicates whether the field has a situations indicator.
	 * @public
	 */
	@property({ type: "boolean" })
	hasSituationsIndicator?: boolean;

	/**
	 * Property for defining how the avatar image fits within the given dimensions.
	 * @public
	 */
	@property({ type: "string", allowedValues: ["Cover", "Contain"] })
	imageFitType?: AvatarImageFitType;

	/**
	 * Property for defining if the avatar image can be enlarged.
	 * @public
	 */
	@property({ type: "boolean" })
	enableEnlargeImage?: boolean;

	/**
	 * If true, suppresses the link display style.
	 * @private
	 */
	@property({ type: "boolean" })
	suppressLinkDisplayStyle?: boolean;

	// internal properties
	/**
	 *
	 * @private
	 */
	@property({ type: "string" })
	fieldMode?: string;

	/**
	 *
	 * @private
	 */
	@property({ type: "boolean" })
	hasDraftIndicator?: boolean;

	/**
	 *
	 * @private
	 */
	@property({ type: "boolean" })
	isAnalytics?: boolean;

	/**
	 * If true and if the field is part of an inactive row, then a check will be done to determine if the underlying property has a non-insertable restriction
	 * @private
	 */
	@property({ type: "boolean" })
	forInlineCreationRows?: boolean;

	/**
	 * If true then the navigationavailable property will not be used for the enablement of the IBN button
	 * @private
	 */
	@property({ type: "boolean" })
	ignoreNavigationAvailable?: boolean;

	/**
	 *
	 * @private
	 */
	@property({ type: "boolean" })
	isCurrencyOrUnitAligned?: boolean;

	/**
	 * Enables the fallback feature for the usage of the text annotation from the value lists
	 * @private
	 */
	@property({ type: "boolean" })
	retrieveTextFromValueList?: boolean;

	/**
	 *
	 * @private
	 */
	@property({ type: "string" })
	semantickeys?: string[];

	/**
	 * Preferred control to visualize semantic key properties
	 * @private
	 */
	@property({ type: "string" })
	semanticKeyStyle?: string;

	/**
	 * If set to 'true', SAP Fiori elements shows an empty indicator in display mode for the text and links
	 * @private
	 */
	@property({ type: "boolean" })
	showEmptyIndicator?: boolean;

	/**
	 * If true then sets the given icon instead of text in Action/IBN Button
	 * @private
	 */
	@property({ type: "boolean" })
	showIconUrl?: boolean;

	/**
	 * Describes how the alignment works between Table mode (Date and Numeric End alignment) and Form mode (numeric aligned End in edit and Begin in display)
	 * @private
	 */
	@property({ type: "string" })
	textAlignMode?: string;

	/**
	 *
	 * @private
	 */
	@property({ type: "string" })
	compactSemanticKey?: string;

	/**
	 *
	 * @private
	 */
	@property({ type: "string" })
	fieldGroupDraftIndicatorPropertyPath?: string;

	/**
	 *
	 * @private
	 */
	@property({ type: "string" })
	collectionFieldsName?: string;

	/**
	 * Indicates if this field is part of a field group
	 * @private
	 */
	@property({ type: "boolean" })
	isFieldGroupItem?: boolean;

	/**
	 * Name of the field group this field belongs to. <br/>
	 *
	 * This property is primarily used when displaying FieldGroups in tables.
	 * @private
	 */
	@property({ type: "string" })
	fieldGroupName?: string;

	/**
	 * Describes if this field is part of an analytical table aggregated row
	 * @private
	 */
	@property({ type: "boolean" })
	isAnalyticalAggregatedRow?: boolean;

	@property({ type: "boolean" })
	showOnlyUnitDecimals?: boolean;

	@property({ type: "boolean" })
	preserveDecimalsForCurrency?: boolean;

	/**
	 * If true, boolean fields are displayed as radio buttons.
	 * @private
	 * @experimental
	 * @ui5-experimental-since 1.141.0
	 * @since 1.141.0
	 */
	@property({ type: "boolean" })
	useRadioButtonsForBoolean?: boolean;

	/**
	 *
	 * @private
	 */
	@property({ type: "boolean" })
	createAssociatedAriaLabel?: boolean;
}
