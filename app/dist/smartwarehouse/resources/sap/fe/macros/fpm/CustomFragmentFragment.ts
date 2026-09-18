import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import type PageController from "sap/fe/core/PageController";
import type Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
@defineUI5Class("sap.fe.macros.fpm.CustomFragmentFragment")
export default class CustomFragmentFragment extends Fragment {
	/*
	 * Event to hold and resolve functions for runtime building blocks
	 */
	@property({ type: "string" })
	childCustomData!: object;

	@property({ type: "string" })
	contextPath?: string;

	constructor(properties: PropertiesOf<CustomFragmentFragment> & { fragmentName: string; type: string }) {
		super(properties);
	}

	/**
	 * Static method to load a custom fragment.
	 * @param options Configuration object for fragment loading
	 * @param options.type Fragment type
	 * @param options.name Fragment name to load
	 * @param [options.controller] Page controller instance
	 * @param [options.contextPath] Context path for the fragment
	 * @param [options.id] Fragment ID prefix for all controls within the fragment
	 * @returns Promise resolving to the loaded fragment control
	 */
	static async load(options: {
		type: string;
		name: string;
		controller?: PageController;
		contextPath?: string;
		id?: string;
	}): Promise<Control> {
		return Fragment.load({
			name: options.name,
			type: options.type || "XML",
			id: options.id || options.name,
			controller: options.controller
		}) as Promise<Control>;
	}
}
