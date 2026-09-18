import Log from "sap/base/Log";
import { aggregation, defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import type Control from "sap/ui/core/Control";
import type CustomData from "sap/ui/core/CustomData";
import CustomDataClass from "sap/ui/core/CustomData";
import Fragment from "sap/ui/core/Fragment";
import type View from "sap/ui/core/mvc/View";
/**
 * Content of a custom fragment
 * @private
 */
@defineUI5Class("sap.fe.macros.fpm.CustomFragment")
export default class CustomFragmentBlock extends BuildingBlock<Control> {
	/**
	 * ID of the custom fragment
	 */
	@property({ type: "string" })
	public id!: string;

	/**
	 * Context Path
	 */
	@property({ type: "string" })
	public contextPath?: string;

	/**
	 *  Name of the custom fragment
	 */
	@property({ type: "string" })
	public fragmentName!: string;

	/**
	 * Containing view
	 */
	@property({ type: "object" })
	public containingView?: View;

	@aggregation({ type: "sap.ui.core.CustomData", multiple: true })
	public childCustomData!: CustomData[];

	constructor(props?: PropertiesOf<CustomFragmentBlock>, others?: PropertiesOf<CustomFragmentBlock>) {
		if (props?.id) {
			props.id = props.id + "--wrapper";
		}
		super(props, others);
	}

	onMetadataAvailable(): void {
		if (!this.content) {
			this.loadFragmentAsync();
		}
	}

	/**
	 * Load the fragment and set it as content.
	 *
	 */
	private async loadFragmentAsync(): Promise<void> {
		const fragment = await this.createContent();
		if (fragment) {
			this.content = fragment;
		}
	}

	/**
	 * Creates the content for the custom fragment.
	 * @returns The fragment as a control
	 */
	async createContent(): Promise<Control | undefined> {
		if (!this.fragmentName) {
			Log.error("CustomFragment: fragmentName is required");
			return undefined;
		}
		const customDataObj: Record<string, string | null> = {};
		if (this.childCustomData?.length > 0) {
			this.childCustomData.forEach((customData) => {
				const key = customData.getKey();
				const value = customData.getValue();
				if (key) {
					customDataObj[key] = value;
				}
			});
		}
		try {
			const loadedFragment = await Fragment.load({
				name: this.fragmentName,
				type: "CUSTOM",
				id: this.fragmentName,
				containingView: this.containingView,
				controller: this.containingView?.getController()
			});
			let resultControl: Control;
			//If we have multiple controls at root level, we load only the last one in the array
			if (Array.isArray(loadedFragment)) {
				resultControl = loadedFragment[loadedFragment.length - 1];
			} else {
				resultControl = loadedFragment;
			}
			if (Object.keys(customDataObj).length > 0) {
				Object.entries(customDataObj).forEach(([key, value]) => {
					if (value !== null) {
						resultControl.addCustomData(
							new CustomDataClass({
								key: key,
								value: value
							})
						);
					}
				});
			}
			return resultControl;
		} catch (error) {
			Log.error(`Failed to load fragment: ${this.fragmentName}`, error as string);
			return undefined;
		}
	}
}
