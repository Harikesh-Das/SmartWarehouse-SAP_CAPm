import { aggregation, defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import { type TableType } from "sap/fe/core/converters/controls/Common/Table";
import { type $ControlSettings } from "sap/ui/core/Control";
import TableAPI from "./Table";
import TreeTableCreationOptions from "./table/TreeTableCreationOptions";

/**
 * Building block used to create a tree table based on the metadata provided by OData V4.
 * {@link demo:sap/fe/core/fpmExplorer/index.html#/buildingBlocks/table/treeTable Overview of Tree Table Building Block}
 * @mixes sap.fe.macros.Table
 * @augments sap.fe.macros.MacroAPI
 * @public
 */
@defineUI5Class("sap.fe.macros.TreeTable", { returnTypes: ["sap.fe.macros.MacroAPI"] })
class TreeTableAPI extends TableAPI {
	/**
	 * The hierarchy qualifier used in the RecursiveHierarchy annotation.
	 * @public
	 */
	@property({ type: "string", required: true })
	hierarchyQualifier!: string;

	/**
	 * Defines the extension point to control whether a source node can be dropped on a specific parent node.<br/>
	 * @public
	 */
	@property({ type: "string" })
	isMoveToPositionAllowed?: string;

	/**
	 * Defines the extension point to control whether a source node can be copied to a specific parent node.<br/>
	 * @public
	 */
	@property({ type: "string" })
	isCopyToPositionAllowed?: string;

	/**
	 * Defines the extension point to control if a node can be dragged.<br/>
	 * @public
	 */
	@property({ type: "string" })
	isNodeMovable?: string;

	/**
	 * Defines the extension point to control whether a node can be copied.<br/>
	 * @public
	 */
	@property({ type: "string" })
	isNodeCopyable?: string;

	/**
	 * A set of options that can be configured.
	 * @public
	 */
	@aggregation({ type: "sap.fe.macros.table.TreeTableCreationOptions", defaultClass: TreeTableCreationOptions })
	creationMode?: TreeTableCreationOptions;

	/**
	 * Defines the type of table that will be used by the building block to render the data. This setting is defined by the framework.
	 *
	 * Allowed value is `TreeTable`.
	 * @public
	 */
	@property({ type: "string", allowedValues: ["TreeTable"] })
	type: TableType = "TreeTable";

	constructor(mSettings?: PropertiesOf<TreeTableAPI> & { id?: string }, ...others: $ControlSettings[]) {
		super(mSettings, ...others);
	}

	getDefaultCreationMode(): TreeTableCreationOptions {
		return new TreeTableCreationOptions({
			name: this.tableDefinition.annotation.create.mode as TreeTableCreationOptions["name"]
		});
	}

	/**
	 * Add tree-specific settings in the manifest.
	 * @returns Settings
	 */
	getSettingsForManifest(): Record<string, unknown> {
		const tableSettings = super.getSettingsForManifest();
		TableAPI.addSetting(tableSettings, "type", "TreeTable");
		TableAPI.addSetting(tableSettings, "hierarchyQualifier", this.hierarchyQualifier);
		TableAPI.addSetting(tableSettings, "isMoveToPositionAllowed", this.isMoveToPositionAllowed);
		TableAPI.addSetting(tableSettings, "isCopyToPositionAllowed", this.isCopyToPositionAllowed);
		TableAPI.addSetting(tableSettings, "isNodeMovable", this.isNodeMovable);
		TableAPI.addSetting(tableSettings, "isNodeCopyable", this.isNodeCopyable);
		const creationMode = (tableSettings["creationMode"] ?? {}) as Record<string, unknown>;
		TableAPI.addSetting(creationMode, "createInPlace", this.creationMode?.createInPlace);

		if (this.creationMode?.nodeType) {
			//Values is passed as Array into the XML but in the manifest it is a dictionary
			// so we need to transform the array into a dictionary
			TableAPI.addSetting(creationMode, "nodeType", {
				propertyName: this.creationMode.nodeType.propertyName,
				values: Object.assign(
					{},
					...(this.creationMode.nodeType.values ?? []).map((value) => ({
						[value.key]: { label: value.label, creationFields: value.creationFields }
					}))
				)
			});
		}

		TableAPI.addSetting(creationMode, "isCreateEnabled", this.creationMode?.isCreateEnabled);
		if (Object.entries(creationMode).length > 0) {
			tableSettings["creationMode"] = creationMode;
		}

		return tableSettings;
	}
}

export default TreeTableAPI;
