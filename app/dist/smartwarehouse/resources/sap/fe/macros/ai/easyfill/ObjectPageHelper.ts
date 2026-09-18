import Log from "sap/base/Log";
import type UI5Element from "sap/ui/core/Element";
import FormContainer from "sap/ui/layout/form/FormContainer";
import type MDCTable from "sap/ui/mdc/Table";
import type ObjectPageLayout from "sap/uxap/ObjectPageLayout";
import type ObjectPageSection from "sap/uxap/ObjectPageSection";
import ObjectPageSubSection from "sap/uxap/ObjectPageSubSection";

export function extractPropertyNameFromField(element: UI5Element): string | undefined {
	const metaPathValue: unknown = element.getProperty("metaPath");
	if (typeof metaPathValue === "string" && metaPathValue.length > 0) {
		const pathParts: string[] = metaPathValue.split("/");
		const lastSegment: string | undefined = pathParts[pathParts.length - 1];
		if (lastSegment !== undefined && lastSegment.length > 0) {
			return lastSegment;
		}
	}
	return extractPropertyNameFromFieldId(element.getId());
}

export function extractPropertyNameFromFieldId(fieldId: string): string | undefined {
	const idWithoutCloneSuffix: string = fieldId.split("-__clone")[0];
	const beforeFieldMarker: string = idWithoutCloneSuffix.endsWith("::Field")
		? idWithoutCloneSuffix.slice(0, -"::Field".length)
		: idWithoutCloneSuffix;
	const idSegments: string[] = beforeFieldMarker.split("::");
	const rawLastSegment: string | undefined = idSegments[idSegments.length - 1];
	if (rawLastSegment === undefined || rawLastSegment.length === 0) {
		return undefined;
	}
	return rawLastSegment;
}

export function getSectionForField(objectPageLayout: ObjectPageLayout, propertyName: string): ObjectPageSection | undefined {
	for (const section of objectPageLayout.getSections()) {
		if (isFieldInSection(section, propertyName)) {
			return section;
		}
	}
	return undefined;
}

export function getOneExistingSectionTitleOrEmpty(objectPageLayout: ObjectPageLayout): string {
	const sectionTitle: string | undefined = objectPageLayout
		.getSections()
		.find((section: ObjectPageSection): boolean => section.getVisible() && section.getTitle().length > 0)
		?.getTitle();
	if (sectionTitle === undefined) {
		Log.warning("Could not find any visible sections with a title in the ObjectPageLayout");
		return "";
	}
	return sectionTitle;
}

/**
 * Finds the first parent ObjectPageSection for the given table and returns its title or undefined.
 * @param table The MDCTable for which to find the parent section title.
 * @returns The title of the parent ObjectPageSection if found, otherwise undefined.
 */
export function findSectionTitleForTable(table: MDCTable): string | undefined {
	let current = table.getParent();
	while (current) {
		if (current.isA<ObjectPageSection>("sap.uxap.ObjectPageSection")) {
			return current.getTitle();
		}
		current = current.getParent();
	}
	return undefined;
}

export function isFieldInSection(section: ObjectPageSection, propertyName: string): boolean {
	return section.findElements(true).some((element: UI5Element): boolean => {
		if (!element.isA("sap.fe.macros.Field")) {
			return false;
		}
		return extractPropertyNameFromField(element) === propertyName;
	});
}

export function tryGetFieldInSection(section: ObjectPageSection, propertyName: string): UI5Element | undefined {
	return section.findElements(true).find((element: UI5Element): boolean => {
		if (!element.isA("sap.fe.macros.Field")) {
			return false;
		}
		return extractPropertyNameFromField(element) === propertyName;
	});
}

export function tryGetSubsectionTitleForField(section: ObjectPageSection, propertyName: string): string | undefined {
	const matchingField: UI5Element | undefined = tryGetFieldInSection(section, propertyName);
	return matchingField ? tryGetFormContainerTitleFromFieldElement(matchingField) : undefined;
}

export function tryGetSectionSubsectionTitleForField(section: ObjectPageSection, propertyName: string): string | undefined {
	const matchingField: UI5Element | undefined = tryGetFieldInSection(section, propertyName);
	return matchingField ? tryGetObjectPageSubSectionTitleFromFieldElement(matchingField) : undefined;
}

export function tryGetFormContainerTitleFromFieldElement(fieldElement: UI5Element): string | undefined {
	let currentElement: UI5Element | null = fieldElement;
	while (currentElement !== null) {
		if (currentElement instanceof FormContainer) {
			const formContainerTitle: string | UI5Element | null = currentElement.getTitle() as string | UI5Element | null;
			return typeof formContainerTitle === "string" ? formContainerTitle : formContainerTitle?.getProperty("text");
		}
		currentElement = currentElement.getParent() as UI5Element | null;
	}
	return undefined;
}

export function tryGetObjectPageSubSectionTitleFromFieldElement(fieldElement: UI5Element): string | undefined {
	let currentElement: UI5Element | null = fieldElement;
	while (currentElement !== null) {
		if (currentElement instanceof ObjectPageSubSection) {
			const title: string = currentElement.getTitle();
			return title.length > 0 ? title : undefined;
		}
		currentElement = currentElement.getParent() as UI5Element | null;
	}
	return undefined;
}
