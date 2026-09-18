import type { EnhanceWithUI5 } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import type MicroChart from "sap/fe/macros/MicroChart";
import type TitleLink from "sap/fe/macros/internal/TitleLink";
import type MicroChartContainer from "sap/fe/macros/microchart/MicroChartContainer";
import HBox from "sap/m/HBox";
import type Label from "sap/m/Label";
import type Link from "sap/m/Link";
import type Title from "sap/m/Title";
import type VBox from "sap/m/VBox";
import type Control from "sap/ui/core/Control";
import StashedControlSupport from "sap/ui/core/StashedControlSupport";
import type CompositeBinding from "sap/ui/model/CompositeBinding";
import type OdataV4Context from "sap/ui/model/odata/v4/Context";
@defineUI5Class("sap.fe.templates.ObjectPage.controls.StashableHBox", {
	designtime: "sap/fe/templates/ObjectPage/designtime/StashableHBox.designtime"
})
class StashableHBox extends HBox {
	/*
	 * Title of the Header Facet. Not visible on the UI. Visible on the UI is the Title or Link control inside the items aggregation of the Header Facet.
	 * Must always be in sync with the visible Title or Link control.
	 * This is used when renaming through the flexibility dialog.
	 */
	@property({ type: "string" })
	title?: string;

	/*
	 * Fallback title to be displayed if no title is available (only needed for displaying stashed header facets in Flex dialog)
	 */
	@property({ type: "string" })
	fallbackTitle!: string;

	@property({ type: "boolean" })
	_disconnected!: boolean;

	@property({ type: "boolean" })
	disableObjectPageRequestOptimization = true;

	private lastSetVisibleContext: OdataV4Context | null | undefined = undefined;

	/*
	 * Return the title property.
	 */
	getTitle(): string {
		return this.title ?? this.getTitleControl()?.getText() ?? this.fallbackTitle;
	}

	onBeforeRendering(oEvent: jQuery.Event): void | undefined {
		// In case we have a title coming from the RTA, we need to set it to the inner control before rendering
		if (this.title) {
			this.getTitleControl()?.setText(this.title);
		}
		return super.onBeforeRendering(oEvent);
	}

	getControlItems(items: Control[]): Control[] {
		let aItems: Control[] = [],
			i;
		if (items) {
			for (i = 0; i < items.length; i++) {
				if ((items[i] as HBox).getItems) {
					aItems = (items[i] as HBox).getItems();
				} else if ((items[i] as EnhanceWithUI5<MicroChartContainer>).getMicroChartTitle) {
					aItems = (items[i] as EnhanceWithUI5<MicroChartContainer>).getMicroChartTitle();
				} else if (
					((items[i] as EnhanceWithUI5<MicroChart>).getContent?.() as EnhanceWithUI5<MicroChartContainer>)?.getMicroChartTitle
				) {
					aItems = (
						(items[i] as EnhanceWithUI5<MicroChart>).getContent() as EnhanceWithUI5<MicroChartContainer>
					).getMicroChartTitle();
				}
			}
		}
		return aItems;
	}

	/*
	 * Retrieves Title/Link control from items aggregation.
	 */
	getTitleControl(): Link | null {
		let aItems: Control[] = [],
			content,
			i;
		const items = this.getItems();
		aItems = this.getControlItems(items);
		for (i = 0; i < aItems.length; i++) {
			const item = aItems[i].isA("sap.fe.macros.internal.TitleLink") ? (aItems[i] as TitleLink).getContent() : aItems[i];
			if (item) {
				if (item.isA<Title>("sap.m.Title") || item.isA<Link>("sap.m.Link")) {
					if (item.isA<Title>("sap.m.Title")) {
						// If a title was found, check if there is a link in the content aggregation
						content = item.getContent() as unknown as Control | undefined;
						if (content && content.isA<Link>("sap.m.Link")) {
							return content;
						}
					}
					return item as Link;
				}
			}
		}
		return null;
	}

	/**
	 * Refreshes the controls bound to navigation properties of the current context. The refreshing is needed in case the visibility has changed but the context has not changed (eg: visibility changed by an action with side effects ).
	 * @param lastContext
	 */
	_refreshControlsBoundToNavigationProperties(lastContext?: OdataV4Context | null): void {
		const contextToRefresh: OdataV4Context[] = [];
		this.findElements(true).forEach((elem) => {
			//if the visibility change is not due to a navigation but to an interactive action
			// we want to refresh only the elements bound to a navigation property
			if (this.getBindingContext() === lastContext) {
				const elemContext = elem.getBindingContext() as OdataV4Context | undefined;
				// only refreshing the elements which are bound to navigation properties of the current context, to avoid unnecessary refreshes
				if (
					elemContext &&
					elemContext.getPath().startsWith(this.getBindingContext()!.getPath() + "/") &&
					!contextToRefresh.includes(elemContext)
				) {
					contextToRefresh.push(elemContext);
				}
			}
		});
		contextToRefresh.forEach(async (context) => context.requestSideEffects([{ $NavigationPropertyPath: "" }]));
	}

	setVisible(visible: boolean): this {
		super.setVisible(visible);
		if (!this.disableObjectPageRequestOptimization) {
			if (
				visible &&
				(!this.getBinding("visible") ||
					!(this.getBinding("visible") as unknown as CompositeBinding).getRawValue().includes(undefined))
			) {
				this.findElements(false).forEach((elem) => {
					elem.setBindingContext(undefined);
				});
				setTimeout(() => {
					this._refreshControlsBoundToNavigationProperties(this.lastSetVisibleContext);
				}, 0);
			} else {
				this.findElements(false).forEach((elem) => {
					elem.setBindingContext(null);
				});
			}
		}
		this.lastSetVisibleContext = this.getBindingContext() as OdataV4Context | null | undefined;
		return this;
	}

	set_disconnected(disconnected: boolean): this {
		this._disconnected = disconnected;
		// By setting the binding context to `null` we are preventing data loading
		// Setting it back to `undefined` ensures that the parent context is applied
		if (disconnected) {
			this.setBindingContext(null);
		} else {
			this.setBindingContext(undefined);
		}
		return this;
	}

	/*
	 * Retrieves label controls from items aggregation.
	 */
	getFormLabels(): Label[] {
		// NOTE: Present implementation only supports for direct ReferenceFacets(VBox) in UI.Facets as per the requirement for getting Labels from forms.
		const ret: Label[] = [],
			formVBox = this.getItems && this.getItems()[0];

		// VBox is equivalent of form
		if (formVBox?.isA<VBox>("sap.m.VBox")) {
			formVBox.getItems().forEach((formElementHBox) => {
				// HBox is equivalent of form element
				if (formElementHBox.isA<HBox>("sap.m.HBox")) {
					const labelCtrl = formElementHBox.getItems()[0];
					if (labelCtrl?.isA<Label>("sap.m.Label")) {
						// First element is label
						ret.push(labelCtrl);
					}
				}
			});
		}
		return ret;
	}
}
StashedControlSupport.mixInto(StashableHBox);

export default StashableHBox;
