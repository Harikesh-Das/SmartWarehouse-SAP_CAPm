import type { BindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { not } from "sap/fe/base/BindingToolkit";
import type { TableVisualization } from "sap/fe/core/converters/controls/Common/Table";
import FieldHelper from "sap/fe/macros/field/FieldHelper";
import UploadSetwithTable from "sap/m/plugins/UploadSetwithTable";
import UploadItemConfiguration from "sap/m/upload/UploadItemConfiguration";
import type UI5Event from "sap/ui/base/Event";
import type TableEventHandlerProvider from "../TableEventHandlerProvider";
import type UploadConfiguration from "../uploadTable/UploadConfiguration";

function getUploadButtonInvisible(
	tableDefinition: TableVisualization,
	uploadConfiguration?: UploadConfiguration
): BindingToolkitExpression<boolean> | boolean {
	// Use override from configuration if provided
	if (uploadConfiguration?.uploadButtonInvisible !== undefined) {
		return uploadConfiguration.uploadButtonInvisible;
	}

	if (
		tableDefinition.annotation?.uploadTable?.uploadAction?.isTemplated &&
		tableDefinition.annotation?.uploadTable?.uploadAction?.visibleExpression
	) {
		return not(tableDefinition.annotation.uploadTable.uploadAction.visibleExpression);
	} else {
		// not create enabled, therefore upload button is always invisible
		return true;
	}
}

export function getUploadPlugin(
	tableDefinition: TableVisualization,
	id: string,
	handlerProvider: TableEventHandlerProvider,
	uploadConfiguration?: UploadConfiguration
): UploadSetwithTable {
	const fileNameValidationConfig = { mode: "override", characters: '[]/\\<>|?:;,"{}*' };

	const eventWrapper = <T extends Function>(eventName: string, defaultHandler?: T): T | undefined => {
		if (uploadConfiguration?.hasListeners(eventName) === true) {
			return ((eventParamsOrEvent?: object): unknown => {
				// For events, parameters need to be extracted from the event object
				const params = (eventParamsOrEvent as UI5Event | undefined)?.getParameters?.() ?? {};
				return uploadConfiguration.fireEvent(eventName, params);
			}) as unknown as T;
		}
		return defaultHandler;
	};

	const propertyWrapper = <T,>(propertyName: string, defaultValue: T): T => {
		const propertyValue = uploadConfiguration?.getProperty(propertyName);
		return propertyValue !== undefined ? (propertyValue as T) : defaultValue;
	};

	const uploadButtonInvisible = propertyWrapper("uploadButtonInvisible", getUploadButtonInvisible(tableDefinition, uploadConfiguration));

	return (
		<UploadSetwithTable
			core:require="{UploadTableRuntime: 'sap/fe/macros/table/uploadTable/UploadTableRuntime'}"
			httpRequestMethod={propertyWrapper("httpRequestMethod", "Put")}
			multiple={propertyWrapper("multiple", false)}
			uploadButtonInvisible={uploadButtonInvisible}
			itemValidationHandler={propertyWrapper("itemValidationHandler", handlerProvider.uploadItemValidationHandler)}
			mediaTypeMismatch={handlerProvider.uploadMediaTypeMismatch}
			fileSizeExceeded={eventWrapper("fileSizeExceeded", handlerProvider.uploadFileSizeExceeded)}
			maxFileSize={propertyWrapper(
				"maxFileSize",
				FieldHelper.calculateMBfromByte(tableDefinition.annotation?.uploadTable?.maxLength)
			)}
			uploadCompleted={eventWrapper("uploadCompleted", handlerProvider.uploadCompleted)}
			uploadEnabled={tableDefinition.annotation?.uploadTable?.uploadAction?.enabled}
			mediaTypes={tableDefinition.annotation?.uploadTable?.acceptableMediaTypes}
			actions={[`${id}-uploadButton`]}
			previewDialog={uploadConfiguration?.getPreviewDialog()}
			uploadUrl={propertyWrapper("uploadUrl", tableDefinition.annotation?.uploadTable?.stream)}
			maxFileNameLength={propertyWrapper("maxFileNameLength", tableDefinition.annotation?.uploadTable?.fileNameMaxLength)}
			fileNameLengthExceeded={handlerProvider.uploadFileNameLengthExceeded}
			itemRenamed={eventWrapper("itemRenamed", uploadConfiguration?.itemRenamed)}
			itemRenameCanceled={eventWrapper("itemRenameCanceled", uploadConfiguration?.itemRenameCanceled)}
			onActivated={eventWrapper("onActivated", uploadConfiguration?.onActivated)}
			beforeInitiatingItemUpload={eventWrapper("beforeInitiatingItemUpload", uploadConfiguration?.beforeInitiatingItemUpload)}
			beforeUploadStarts={eventWrapper("beforeUploadStarts", uploadConfiguration?.beforeUploadStarts)}
			fileNameValidationConfig={fileNameValidationConfig}
		>
			{{
				rowConfiguration: uploadConfiguration?.getRowConfiguration() ?? (
					<UploadItemConfiguration fileNamePath={tableDefinition.annotation?.uploadTable?.fileName} />
				)
			}}
		</UploadSetwithTable>
	);
}
