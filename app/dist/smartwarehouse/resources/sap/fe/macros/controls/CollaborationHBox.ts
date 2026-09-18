import { association, defineUI5Class } from "sap/fe/base/ClassSupport";
import HBox from "sap/m/HBox";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";

type ControlWithAccessibility = Control & { addAriaLabelledBy?: (id: string) => void; getAriaLabelledBy?: () => string[] };

@defineUI5Class("sap.fe.macros.controls.CollaborationHBox")
class CollaborationHBox extends HBox {
	/**
	 * Association to controls / IDs that label this control (see WAI-ARIA attribute aria-labelledby).
	 */
	@association({ type: "sap.ui.core.Control", multiple: true, singularName: "ariaLabelledBy" })
	ariaLabelledBy!: string[];

	enhanceAccessibilityState(_oElement: object, mAriaProps: object): object {
		const oParent = this.getParent();

		if (oParent && (oParent as ManagedObject & { enhanceAccessibilityState?: Function }).enhanceAccessibilityState) {
			// forward  enhanceAccessibilityState call to the parent
			(oParent as ManagedObject & { enhanceAccessibilityState: Function }).enhanceAccessibilityState(_oElement, mAriaProps);
		}

		return mAriaProps;
	}

	private setAriaLabelledBy(content?: ControlWithAccessibility): void {
		if (content && content.addAriaLabelledBy && content.getAriaLabelledBy) {
			const ariaLabelledByIds = this.ariaLabelledBy;

			for (const id of ariaLabelledByIds) {
				const existingIds = content.getAriaLabelledBy() ?? [];
				if (!existingIds.includes(id)) {
					content.addAriaLabelledBy(id);
				}
			}
		}
	}

	onBeforeRendering(): void {
		// before calling the renderer, parent control may have set ariaLabelledBy
		// we ensure it is passed to the inner controls (items)
		const items = this.getItems();
		for (const item of items) {
			this.setAriaLabelledBy(item as ControlWithAccessibility);
		}
	}
}

export default CollaborationHBox;
