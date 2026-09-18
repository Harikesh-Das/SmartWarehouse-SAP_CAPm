import { TemplateType } from "sap/fe/core/converters/ManifestSettings";
import type { ViewData } from "sap/fe/core/services/TemplatedViewServiceFactory";
import type { ColumnDef } from "./ValueListHelper";

/**
 * Constructs the property path for action parameters based on whether the action is bound or unbound.
 * @param oParameters The action parameter details
 * @param oParameters.UnboundAction Whether the action is unbound
 * @param oParameters.Property The property name
 * @param oParameters.EntityTypePath The entity type path
 * @param oParameters.Action The action name
 * @returns The constructed property path
 */
export function getPropertyPath(oParameters: {
	UnboundAction?: boolean;
	Property: string;
	EntityTypePath: string;
	Action: string;
}): string {
	return !oParameters.UnboundAction
		? `${oParameters.EntityTypePath}/${oParameters.Action}/${oParameters.Property}`
		: `/${oParameters.Action.substring(oParameters.Action.lastIndexOf(".") + 1)}/${oParameters.Property}`;
}

/**
 * Reorders value list qualifiers so the default qualifier (empty string) comes first.
 * @param qualifiers Array of value list qualifiers
 * @returns The reordered array with the default qualifier first
 */
export function putDefaultQualifierFirst(qualifiers: string[]): string[] {
	const indexDefaultVH = qualifiers.indexOf("");

	// default ValueHelp without qualifier should be the first
	if (indexDefaultVH > 0) {
		qualifiers.unshift(qualifiers[indexDefaultVH]);
		qualifiers.splice(indexDefaultVH + 1, 1);
	}
	return qualifiers;
}

export function getViewDataForTemplate(
	columnDefs: ColumnDef[] | null = null,
	enableLinksInDialogTable = false
): Partial<ViewData> & { columns?: ColumnDef[] | null; enableLinksInDialogTable?: boolean } {
	return {
		converterType: TemplateType.ListReport,
		columns: columnDefs,
		enableLinksInDialogTable: enableLinksInDialogTable
	};
}
