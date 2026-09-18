/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/ui/layout/form/FormContainer", "sap/uxap/ObjectPageSubSection"], function (Log, FormContainer, ObjectPageSubSection) {
  "use strict";

  var _exports = {};
  function extractPropertyNameFromField(element) {
    const metaPathValue = element.getProperty("metaPath");
    if (typeof metaPathValue === "string" && metaPathValue.length > 0) {
      const pathParts = metaPathValue.split("/");
      const lastSegment = pathParts[pathParts.length - 1];
      if (lastSegment !== undefined && lastSegment.length > 0) {
        return lastSegment;
      }
    }
    return extractPropertyNameFromFieldId(element.getId());
  }
  _exports.extractPropertyNameFromField = extractPropertyNameFromField;
  function extractPropertyNameFromFieldId(fieldId) {
    const idWithoutCloneSuffix = fieldId.split("-__clone")[0];
    const beforeFieldMarker = idWithoutCloneSuffix.endsWith("::Field") ? idWithoutCloneSuffix.slice(0, -"::Field".length) : idWithoutCloneSuffix;
    const idSegments = beforeFieldMarker.split("::");
    const rawLastSegment = idSegments[idSegments.length - 1];
    if (rawLastSegment === undefined || rawLastSegment.length === 0) {
      return undefined;
    }
    return rawLastSegment;
  }
  _exports.extractPropertyNameFromFieldId = extractPropertyNameFromFieldId;
  function getSectionForField(objectPageLayout, propertyName) {
    for (const section of objectPageLayout.getSections()) {
      if (isFieldInSection(section, propertyName)) {
        return section;
      }
    }
    return undefined;
  }
  _exports.getSectionForField = getSectionForField;
  function getOneExistingSectionTitleOrEmpty(objectPageLayout) {
    const sectionTitle = objectPageLayout.getSections().find(section => section.getVisible() && section.getTitle().length > 0)?.getTitle();
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
  _exports.getOneExistingSectionTitleOrEmpty = getOneExistingSectionTitleOrEmpty;
  function findSectionTitleForTable(table) {
    let current = table.getParent();
    while (current) {
      if (current.isA("sap.uxap.ObjectPageSection")) {
        return current.getTitle();
      }
      current = current.getParent();
    }
    return undefined;
  }
  _exports.findSectionTitleForTable = findSectionTitleForTable;
  function isFieldInSection(section, propertyName) {
    return section.findElements(true).some(element => {
      if (!element.isA("sap.fe.macros.Field")) {
        return false;
      }
      return extractPropertyNameFromField(element) === propertyName;
    });
  }
  _exports.isFieldInSection = isFieldInSection;
  function tryGetFieldInSection(section, propertyName) {
    return section.findElements(true).find(element => {
      if (!element.isA("sap.fe.macros.Field")) {
        return false;
      }
      return extractPropertyNameFromField(element) === propertyName;
    });
  }
  _exports.tryGetFieldInSection = tryGetFieldInSection;
  function tryGetSubsectionTitleForField(section, propertyName) {
    const matchingField = tryGetFieldInSection(section, propertyName);
    return matchingField ? tryGetFormContainerTitleFromFieldElement(matchingField) : undefined;
  }
  _exports.tryGetSubsectionTitleForField = tryGetSubsectionTitleForField;
  function tryGetSectionSubsectionTitleForField(section, propertyName) {
    const matchingField = tryGetFieldInSection(section, propertyName);
    return matchingField ? tryGetObjectPageSubSectionTitleFromFieldElement(matchingField) : undefined;
  }
  _exports.tryGetSectionSubsectionTitleForField = tryGetSectionSubsectionTitleForField;
  function tryGetFormContainerTitleFromFieldElement(fieldElement) {
    let currentElement = fieldElement;
    while (currentElement !== null) {
      if (currentElement instanceof FormContainer) {
        const formContainerTitle = currentElement.getTitle();
        return typeof formContainerTitle === "string" ? formContainerTitle : formContainerTitle?.getProperty("text");
      }
      currentElement = currentElement.getParent();
    }
    return undefined;
  }
  _exports.tryGetFormContainerTitleFromFieldElement = tryGetFormContainerTitleFromFieldElement;
  function tryGetObjectPageSubSectionTitleFromFieldElement(fieldElement) {
    let currentElement = fieldElement;
    while (currentElement !== null) {
      if (currentElement instanceof ObjectPageSubSection) {
        const title = currentElement.getTitle();
        return title.length > 0 ? title : undefined;
      }
      currentElement = currentElement.getParent();
    }
    return undefined;
  }
  _exports.tryGetObjectPageSubSectionTitleFromFieldElement = tryGetObjectPageSubSectionTitleFromFieldElement;
  return _exports;
}, false);
//# sourceMappingURL=ObjectPageHelper-dbg.js.map
