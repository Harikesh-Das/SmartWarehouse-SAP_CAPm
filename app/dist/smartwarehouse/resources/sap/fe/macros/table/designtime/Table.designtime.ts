/*!
 * Find the current values of the table configuration that is provided in the table adapt dialog
 */

import CommonUtils from "sap/fe/core/CommonUtils";
import type ResourceModel from "sap/fe/core/ResourceModel";
import type { TableType } from "sap/fe/core/converters/controls/Common/Table";

import { getRenameAction, getText, getTextArrangementChangeAction } from "sap/fe/core/designtime/AnnotationBasedChanges";
import type TableAPI from "sap/fe/macros/Table";
import type {
	DesigntimeSetting,
	DesigntimeSettingEnums,
	PropertyValue,
	SettingsData,
	adaptionChange
} from "sap/fe/macros/designtime/Designtime.helper";
import {
	extractChanges,
	getPersonalizationSetting,
	getPropertyNamesAndDescriptions,
	getSettingsIfKeyUser,
	isConfigModelPrepared,
	isManifestChangesEnabled,
	noChanges,
	openAdaptionDialog,
	prepareConfigModel,
	separateChanges
} from "sap/fe/macros/designtime/Designtime.helper";
import {
	getDesigntimeSettings,
	getPropertyPath,
	getSettingsApplicableForTableType,
	getTableType
} from "sap/fe/macros/table/designtime/Table.designtime.helper";
import type MDCTable from "sap/ui/mdc/Table";
import type Context from "sap/ui/model/Context";

export type TableDesigntimeSetting = DesigntimeSetting & { applicableForTableTypes?: TableType[]; enums?: TableDesigntimeSettingEnum[] };
export type TableSettingsData = SettingsData & { applicableForTableTypes?: TableType[]; control: ControlData[] };
export type TableDesigntimeSettingEnum = DesigntimeSettingEnums & { applicableForTableTypes?: TableType[] };

type ControlData = {
	type: string | undefined;
	enum?: TableDesigntimeSettingEnum[];
	value: unknown;
	id: string;
};
// Don't pass these properties to fiori tools processing for the control panel for table. Currently the combination
// of boolean property plus further option of fixed list is not supported
const itemsToRemove = [
	"personalization",
	"personalizationSort",
	"personalizationColumn",
	"personalizationFilter",
	"personalizationGroup",
	"personalizationAggregate"
];

export function getAdaptationProperties(designtimeSettings: DesigntimeSetting[], control: MDCTable): PropertyValue {
	const propertyValues: PropertyValue = {};
	designtimeSettings.forEach(function (setting) {
		propertyValues[setting.id] = getAdaptationPropertyValue(control, setting);
	});
	return propertyValues;
}
/**
 * Returns the value of one of the settings that have been defined for table adaptation.
 * @param control Reference to selected table
 * @param setting The definition of the setting required for adaptation
 * @returns Setting definition with a value for selected control
 */
function getAdaptationPropertyValue(control: MDCTable, setting: DesigntimeSetting): boolean | string | number {
	const table = control.getParent() as TableAPI;
	const tableDefinition = table.getProperty("tableDefinition");
	let returnValue: boolean | string | number = "";

	switch (setting.id) {
		case "headerVisible":
			returnValue = tableDefinition.headerVisible;
			break;
		case "header":
			returnValue = tableDefinition.header;
			break;
		case "enableFullScreen":
			returnValue = tableDefinition.control.enableFullScreen;
			break;
		case "enableExport":
			returnValue = tableDefinition.control.enableExport;
			break;
		case "type":
			returnValue = control.data("tableType");
			break;
		case "creationModeName":
			returnValue = tableDefinition.control.creationMode;
			break;
		case "creationModeCreateAtEnd":
			returnValue = tableDefinition.control.createAtEnd;
			break;
		case "frozenColumnCount":
			returnValue = tableDefinition.control.frozenColumnCount;
			break;
		case "showCounts":
			returnValue = tableDefinition.control.filters?.quickFilters?.showCounts;
			break;
		/* case "hideTableTitle":
			propertyValues.hideTableTitle = tableDefinition.control.filters?.quickFilters && !tableDefinition.control.headerVisible;
			break; */
		case "personalization":
			returnValue = control.getP13nMode().length === 0 ? "False" : "True";
			break;
		case "personalizationSort":
			returnValue = control.getP13nMode().includes("Sort");
			break;
		case "personalizationColumn":
			returnValue = control.getP13nMode().includes("Column");
			break;
		case "personalizationFilter":
			returnValue = control.getP13nMode().includes("Filter");
			break;
		case "personalizationGroup":
			returnValue = control.getP13nMode().includes("Group");
			break;
		case "personalizationAggregate":
			returnValue = control.getP13nMode().includes("Aggregate");
			break;
		case "rowCount":
			returnValue = tableDefinition.control.rowCount;
			break;
		case "rowCountMode":
			returnValue = tableDefinition.control.rowCountMode;
			break;
		case "condensedTableLayout":
			returnValue = tableDefinition.control.useCondensedTableLayout;
			break;
		case "widthIncludingColumnHeader":
			returnValue = tableDefinition.control.widthIncludingColumnHeader;
			break;
		case "selectionMode":
			returnValue = tableDefinition.annotation.selectionMode;
			break;
		case "selectAll":
			returnValue = tableDefinition.control.selectionLimit === 0;
			break;
		case "threshold":
			returnValue = tableDefinition.control.threshold ?? tableDefinition.annotation.threshold;
			break;
		case "scrollThreshold":
			returnValue = tableDefinition.control.scrollThreshold;
			break;
		case "selectionLimit":
			returnValue = tableDefinition.control.selectionLimit;
			break;
		case "hierarchyQualifier":
			returnValue = tableDefinition.control.hierarchyQualifier;
			break;
		case "enableMassEdit":
			returnValue = tableDefinition.control.massEdit.enabled;
			break;
		case "enableMassEditVisibleFields":
			returnValue = tableDefinition.control.massEdit.visibleFields;
			break;
		case "enableMassEditIgnoredFields":
			returnValue = tableDefinition.control.massEdit.ignoreFields;
			break;
		case "enableAddCardToInsights":
			returnValue = tableDefinition.control.enableAddCardToInsights;
			break;
		case "beforeRebindTable":
			returnValue = tableDefinition.control.beforeRebindTable;
			break;
		case "selectionChange":
			returnValue = tableDefinition.control.selectionChange;
			break;
	}
	return returnValue;
}
/**
 * Returns the settings and values for a table formatted for the adaptation dialog content.
 * @param table The MDC Table control
 * @param propertyValues The list of properties and values for the selected table
 * @returns Formatted list for the adaptation dialog
 */
function getSettings(table: MDCTable, propertyValues: PropertyValue): TableSettingsData[] {
	const items: TableSettingsData[] = [];
	const tableAPI = table.getParent() as TableAPI;
	const tableType = getTableType(table);

	getDesigntimeSettings(tableAPI).forEach(function (manifestSetting) {
		let enums: TableDesigntimeSettingEnum[] | undefined = manifestSetting.enums;
		if (manifestSetting.keyUser === true && enums?.length && tableType) {
			enums = (manifestSetting.enums as TableDesigntimeSettingEnum[])?.filter(
				(enumValue) => enumValue.applicableForTableTypes?.includes(tableType)
			);
		}

		//Fill model for adaptation settings data
		const settingsData: TableSettingsData = {
			label: manifestSetting.name,
			tooltip: manifestSetting.description,
			control: [],
			keyUser: manifestSetting.keyUser,
			applicableForTableTypes: manifestSetting.applicableForTableTypes
		};

		const controlData: ControlData = {
			type: manifestSetting.type,
			enum: enums,
			value: propertyValues[manifestSetting.id],
			id: manifestSetting.id
		};

		settingsData.control.push(controlData);
		items.push(settingsData);
	});
	return items;
}

const configPath = "rta/configSettings";

const designTime = {
	actions: {
		annotation: {
			textArrangement: getTextArrangementChangeAction(),
			rename: getRenameAction()
		},
		settings: {
			fe: {
				name: getText("RTA_CONTEXT_ACTIONMENU_CONFIG"),
				icon: "sap-icon://developer-settings",
				isEnabled: isManifestChangesEnabled,
				handler: async function (control: MDCTable): Promise<adaptionChange[]> {
					const tableAPI = control.getParent() as TableAPI;
					const designtimeSettings = getDesigntimeSettings(tableAPI);
					const propertyValues = getAdaptationProperties(designtimeSettings, control);
					const unchangedData = { ...propertyValues };
					const configContext = control.getBindingContext("internal") as Context;
					if (!isConfigModelPrepared(configContext, configPath)) {
						// first time this session
						let items = getSettings(control, propertyValues);
						items = getSettingsIfKeyUser(CommonUtils.getAppComponent(control), items) as TableSettingsData[];
						items = getSettingsApplicableForTableType(control, items);
						// use internal model to persist adaptation configuration values
						prepareConfigModel(items, configContext, configPath);
					} else {
						// set personalization to 'Own Settings' if that was chosen previously
						// as this setting cannot be retrived from the control, and will be always true if personalization is enabled
						propertyValues.personalization = getPersonalizationSetting(configContext);
					}
					const resourceModel = control.getModel("sap.fe.i18n") as ResourceModel;
					return openAdaptionDialog(
						configContext,
						propertyValues,
						"{sap.fe.i18n>RTA_CONFIGURATION_TITLE_TABLE}",
						resourceModel,
						configPath,
						"{sap.fe.i18n>RTA_CONFIGURATION_INFO_MESSAGE}",
						{
							width: "650px",
							height: "800px"
						}
					).then(function (propertyValuesEntered: PropertyValue): adaptionChange[] | [] {
						const propertyPath = getPropertyPath(control.getParent() as TableAPI);
						return extractChanges(designtimeSettings, unchangedData, propertyValuesEntered, propertyPath, control);
					}, noChanges);
				}
			}
		}
	},
	// We disable mdc table properties in the property panel of Fiori Tools
	properties: {
		busyIndicatorDelay: { ignore: true },
		enableColumnResize: { ignore: true },
		enableExport: { ignore: true },
		header: { ignore: true },
		headerLevel: { ignore: true },
		headerVisible: { ignore: true },
		multiSelectMode: { ignore: true },
		showPasteButton: { ignore: true },
		showRowCount: { ignore: true },
		threshold: { ignore: true },
		width: { ignore: true }
	},
	aggregations: {},

	// These functions provide the properties used in table adaption to Fiori tools.
	manifestSettings: function (control: MDCTable): DesigntimeSetting[] {
		const table = control.getParent() as TableAPI;
		const designtimeSettings = getDesigntimeSettings(table).filter((item) => !itemsToRemove.includes(item.id));
		return getPropertyNamesAndDescriptions(designtimeSettings, control.getModel("sap.fe.i18n") as ResourceModel);
	},
	// getAdaptionPropertyValue
	manifestSettingsValues: function (designtimeSettings: DesigntimeSetting[], control: MDCTable): PropertyValue {
		const returnValues: PropertyValue = {};
		designtimeSettings.forEach(function (setting) {
			let propertyIndex;
			if (setting.path) {
				propertyIndex = setting.path;
			} else {
				propertyIndex = setting.id;
			}
			returnValues[propertyIndex] = getAdaptationPropertyValue(control, setting);
		});
		return returnValues;
	},
	// get path for control configuration. Pass reference to the control
	manifestPropertyPath: function (control: MDCTable): string {
		const table = control.getParent() as TableAPI;
		return getPropertyPath(table);
	},
	// create change structue. Pass array of manifest setting and new value, the property path and the control
	manifestPropertyChange: function (propertyChanges: PropertyValue, propertyPath: string, control: MDCTable): adaptionChange[] {
		return separateChanges(propertyChanges, propertyPath, control);
	}
};

export default designTime;
