import Log from "sap/base/Log";
import { compileExpression, or, pathInModel, type CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineReference, defineUI5Class, property } from "sap/fe/base/ClassSupport";
import { controllerExtensionHandler } from "sap/fe/base/HookSupport";
import type { Ref } from "sap/fe/base/jsx-runtime/jsx";
import type PageController from "sap/fe/core/PageController";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { ContextNavigationType } from "sap/fe/core/library";
import HBox from "sap/m/HBox";
import type UI5Event from "sap/ui/base/Event";
import Element from "sap/ui/core/Element";
import InvisibleText from "sap/ui/core/InvisibleText";
import JSONModel from "sap/ui/model/json/JSONModel";
import type { default as Context, default as ODataV4Context } from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ObjectPageHeaderActionButton from "sap/uxap/ObjectPageHeaderActionButton";

enum ButtonType {
	Next = "Next",
	Previous = "Previous"
}

/**
 * Building block used to create a paginator control.
 *
 * Usage example:
 * <pre>
 * &lt;macros:Paginator /&gt;
 * </pre>
 * @hideconstructor
 * @public
 * @since 1.94.0
 */
@defineUI5Class("sap.fe.macros.Paginator")
export default class Paginator extends BuildingBlock<HBox> {
	/**
	 * The identifier of the Paginator control.
	 */
	@property({ type: "string" })
	public id = "";

	/**
	 * Title of the object that is readout by screen readers when the next/previous item is loaded via keyboard focus on the paginator button.
	 * @public
	 */
	@property({ type: "string" })
	public ariaTitle?: CompiledBindingToolkitExpression;

	@defineReference()
	upButton!: Ref<ObjectPageHeaderActionButton>;

	@defineReference()
	downButton!: Ref<ObjectPageHeaderActionButton>;

	@defineReference()
	upDescription!: Ref<InvisibleText>;

	@defineReference()
	downDescription!: Ref<InvisibleText>;

	protected base!: PageController;

	private paginatorModel = new JSONModel({
		navUpEnabled: false,
		navDownEnabled: false
	});

	private _oListBinding?: ODataListBinding;

	private _oCurrentContext?: Context;

	private _iCurrentIndex = -1;

	private _nextIndex = -1;

	private _previousIndex = -1;

	private _listCurrentContexts: ODataV4Context[] = [];

	private _visibleExpression?: CompiledBindingToolkitExpression;

	constructor(props?: PropertiesOf<Paginator>, others?: PropertiesOf<Paginator>) {
		super(props, others);
	}

	private static ObjectPageHeaderActionButton: typeof ObjectPageHeaderActionButton;

	static async load(): Promise<typeof Paginator> {
		if (Paginator.ObjectPageHeaderActionButton === undefined) {
			const { default: ObjectPageHeaderActionButton } = await import("sap/uxap/ObjectPageHeaderActionButton");
			Paginator.ObjectPageHeaderActionButton = ObjectPageHeaderActionButton;
		}
		return this;
	}

	async onMetadataAvailable(_ownerComponent: TemplateComponent): Promise<void> {
		await Paginator.load();
		if (!this.content) {
			this.content = this.createContent(_ownerComponent);
		}
	}

	onModelContextChange(event: UI5Event): void {
		const source = event.getSource();
		if (source.isA<HBox>("sap.m.HBox") && this.upButton.current && this.downButton.current) {
			const context = source.getBindingContext();
			if (!context) {
				return;
			}
			this._updateDescriptionAndFocus(this.upButton.current, this.downButton.current);
		}
	}

	/**
	 * Initiates the paginator control.
	 * @param listBinding ODataListBinding object
	 * @param context Current context where the navigation is initiated
	 * @since 1.94.0
	 */
	@controllerExtensionHandler("paginator", "initialize")
	initialize(listBinding?: ODataListBinding, context?: Context): void {
		if (listBinding && (listBinding as { getAllCurrentContexts?: Function }).getAllCurrentContexts) {
			this._oListBinding = listBinding;
			this._listCurrentContexts = this._oListBinding.getAllCurrentContexts();
			listBinding.attachEvent("change", this._updateIndicesAndButtonEnablement.bind(this));
		} else {
			this._oListBinding = undefined;
		}
		if (context) {
			this._oCurrentContext = context;
		}

		this._updateIndicesAndButtonEnablement();
	}

	/**
	 * Updates the indices for the paginator based on the current context and direction.
	 * @param index Determines the next or previous index from the current context.
	 * @param direction The navigation direction, either "Next" or "Previous".
	 */
	async _setPrevOrNextIndex(index: number, direction: ButtonType): Promise<void> {
		let type = await this.getPageController()?.paginator.determineContextNavigationType(this._listCurrentContexts[index]);

		const navigationAvailable = await ModelHelper.evaluateVirtualExpression(
			"@$ui5.fe.virtual.routeNavigable-" + this.getPageController().getRoutingTargetName(),
			this._listCurrentContexts[index]
		);
		if (navigationAvailable === false) {
			type = ContextNavigationType.None;
		}
		if (type === ContextNavigationType.Internal) {
			if (direction === ButtonType.Next) {
				this._nextIndex = index;
			} else {
				this._previousIndex = index;
			}
		} else if (direction === ButtonType.Next) {
			if (index !== this._listCurrentContexts.length - 1) {
				await this._setPrevOrNextIndex(index + 1, ButtonType.Next);
			} else {
				this._nextIndex = -1;
			}
		} else if (index !== 0) {
			await this._setPrevOrNextIndex(index - 1, ButtonType.Previous);
		} else {
			this._previousIndex = -1;
		}
	}

	async _updateIndicesAndButtonEnablement(): Promise<void> {
		if (this._oCurrentContext && this._oListBinding) {
			this._listCurrentContexts = this._oListBinding.getAllCurrentContexts();
			const sPath = this._oCurrentContext.getPath();
			// Storing the currentIndex in global variable
			this._iCurrentIndex = this._listCurrentContexts?.findIndex(function (oContext: ODataV4Context) {
				return oContext && oContext.getPath() === sPath;
			});
			const oCurrentIndexContext = this._listCurrentContexts?.[this._iCurrentIndex];
			if (
				(!this._iCurrentIndex && this._iCurrentIndex !== 0) ||
				!oCurrentIndexContext ||
				this._oCurrentContext.getPath() !== oCurrentIndexContext.getPath()
			) {
				this._updateCurrentIndex();
			}

			return this._invokeSetPrevOrNextIndex()
				.then((): void => {
					this._handleButtonEnablement();
					return;
				})
				.catch((error) => {
					Log.error("Error occurred while setting button indices or handling button enablement:", error);
				});
		} else {
			this._handleButtonEnablement();
			return Promise.resolve();
		}
	}

	/**
	 * Handles the enablement of navigation buttons based on the current context and list binding.
	 * If applicable, updates the model properties to enable or disable the navigation buttons.
	 */
	_handleButtonEnablement(): void {
		//Enabling and Disabling the Buttons on change of the control context
		const buttonEnablementModel = this.paginatorModel;
		const isListBindingActive = !!(this._oListBinding && (!this._oListBinding.isRelative() || this._oListBinding.getContext()));
		if (
			this._oListBinding &&
			isListBindingActive &&
			this._oListBinding.getAllCurrentContexts()?.length > 1 &&
			this._iCurrentIndex > -1
		) {
			this._listCurrentContexts = this._oListBinding.getAllCurrentContexts();
			if (this._iCurrentIndex === this._listCurrentContexts.length - 1 || this._nextIndex === -1) {
				buttonEnablementModel.setProperty("/navDownEnabled", false);
			} else if (this._listCurrentContexts[this._iCurrentIndex + 1].isInactive()) {
				//check the next context is not an inactive context
				buttonEnablementModel.setProperty("/navDownEnabled", false);
			} else {
				buttonEnablementModel.setProperty("/navDownEnabled", true);
			}
			if (this._iCurrentIndex === 0 || this._previousIndex === -1) {
				buttonEnablementModel.setProperty("/navUpEnabled", false);
			} else if (this._listCurrentContexts[this._iCurrentIndex - 1].isInactive()) {
				buttonEnablementModel.setProperty("/navUpEnabled", false);
			} else {
				buttonEnablementModel.setProperty("/navUpEnabled", true);
			}
		} else {
			// Don't show the paginator buttons
			// 1. When no listbinding is available
			// 2. Only '1' or '0' context exists in the listBinding
			// 3. The current index is -ve, i.e the currentIndex is invalid.
			buttonEnablementModel.setProperty("/navUpEnabled", false);
			buttonEnablementModel.setProperty("/navDownEnabled", false);
		}
	}

	_updateCurrentIndex(): void {
		if (this._oCurrentContext && this._oListBinding) {
			const sPath = this._oCurrentContext.getPath();
			// Storing the currentIndex in global variable
			this._iCurrentIndex = this._listCurrentContexts?.findIndex(function (oContext: ODataV4Context) {
				return oContext && oContext.getPath() === sPath;
			});
		}
	}

	async _invokeSetPrevOrNextIndex(): Promise<void> {
		if (this._listCurrentContexts.length > 1 && this._iCurrentIndex >= 0) {
			if (this._iCurrentIndex !== this._listCurrentContexts.length - 1) {
				await this._setPrevOrNextIndex(this._iCurrentIndex + 1, ButtonType.Next);
			}

			if (this._iCurrentIndex !== 0) {
				await this._setPrevOrNextIndex(this._iCurrentIndex - 1, ButtonType.Previous);
			}
		}
	}

	async updateCurrentContext(newContextIndex: number): Promise<void> {
		if (!this._oListBinding) {
			return;
		}
		const oModel = this._oCurrentContext?.getModel ? this._oCurrentContext?.getModel() : undefined;
		//Submitting any pending changes that might be there before navigating to next context.
		await oModel?.submitBatch("$auto");
		const currentContexts = this._oListBinding.getAllCurrentContexts();
		const newContext = currentContexts[newContextIndex];

		if (newContext) {
			const preventIdxUpdate = this.getPageController()?.paginator.onBeforeContextUpdate(
				this._oListBinding,
				this._iCurrentIndex,
				newContextIndex
			);
			if (!preventIdxUpdate) {
				this._iCurrentIndex = newContextIndex;
				this._oCurrentContext = newContext;
			}
			this.getPageController()?.paginator.onContextUpdate(newContext);
		}
		this._updateIndicesAndButtonEnablement();
	}

	_updateDescriptionAndFocus(upButton: ObjectPageHeaderActionButton, downButton: ObjectPageHeaderActionButton): void {
		const focusControl = Element.getActiveElement();
		const upEnabled = upButton.getEnabled();
		const downEnabled = downButton.getEnabled();
		let upDescriptionText = "";
		let downDescriptionText = "";

		if (upEnabled && !downEnabled && focusControl === downButton) {
			// Last record in the list.
			upButton.focus();
			upDescriptionText = this.getTranslatedText("M_PAGINATOR_TITLE_BOTTOM");
			downDescriptionText = "";
		} else if (downEnabled && !upEnabled && focusControl === upButton) {
			// First record in the list.
			downButton.focus();
			upDescriptionText = "";
			downDescriptionText = this.getTranslatedText("M_PAGINATOR_TITLE_TOP");
		}

		if (this.upDescription.current) {
			this.upDescription.current.setText(upDescriptionText);
		}
		if (this.downDescription.current) {
			this.downDescription.current.setText(downDescriptionText);
		}
	}

	/**
	 * The runtime building block template function.
	 * @param _ownerComponent
	 * @returns A JS-based string
	 */
	createContent(_ownerComponent: TemplateComponent): HBox {
		// The model name is hardcoded, as this building block can also be used transparently by application developers
		const navUpEnabledExpression = pathInModel("/navUpEnabled", "paginator");
		const navDownEnabledExpression = pathInModel("/navDownEnabled", "paginator");
		const visibleExpression = or(navUpEnabledExpression, navDownEnabledExpression);
		const navUpTooltipExpression = pathInModel("T_PAGINATOR_CONTROL_PAGINATOR_TOOLTIP_UP", "sap.fe.i18n");
		const navDownTooltipExpression = pathInModel("T_PAGINATOR_CONTROL_PAGINATOR_TOOLTIP_DOWN", "sap.fe.i18n");
		const titleDescription = this.ariaTitle
			? this.getTranslatedText("M_PAGINATOR_ANNOUNCEMENT_TITLE_LOADED", [this.ariaTitle])
			: this.getTranslatedText("M_PAGINATOR_ANNOUNCEMENT_OBJECT_LOADED");
		_ownerComponent.setModel(this.paginatorModel, "paginator");

		return (
			<HBox
				displayInline="true"
				id={this.createId("_box")}
				visible={compileExpression(visibleExpression)}
				modelContextChange={(event: UI5Event): void => {
					this.onModelContextChange(event);
				}}
			>
				<InvisibleText ref={this.upDescription} id={this.createId("upDescription")} />
				<InvisibleText ref={this.downDescription} id={this.createId("downDescription")} />
				<InvisibleText id={this.createId("titleDescription")} text={titleDescription} />
				<Paginator.ObjectPageHeaderActionButton
					id={this.createId("previousItem")}
					ref={this.upButton}
					enabled={compileExpression(navUpEnabledExpression)}
					tooltip={compileExpression(navUpTooltipExpression)}
					icon="sap-icon://navigation-up-arrow"
					press={async (): Promise<void> => this.updateCurrentContext(this._previousIndex)}
					type="Transparent"
					importance="High"
					ariaDescribedBy={
						[this.createId("titleDescription"), this.createId("upDescription")].filter((val) => val !== undefined) as string[]
					}
				/>
				<Paginator.ObjectPageHeaderActionButton
					id={this.createId("nextItem")}
					ref={this.downButton}
					enabled={compileExpression(navDownEnabledExpression)}
					tooltip={compileExpression(navDownTooltipExpression)}
					icon="sap-icon://navigation-down-arrow"
					press={async (): Promise<void> => this.updateCurrentContext(this._nextIndex)}
					type="Transparent"
					importance="High"
					ariaDescribedBy={
						[this.createId("titleDescription"), this.createId("downDescription")].filter((val) => val !== undefined) as string[]
					}
				/>
			</HBox>
		);
	}
}
