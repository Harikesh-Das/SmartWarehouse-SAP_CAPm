/**
 * Collection of formatters needed for the collaboration draft.
 * @param {object} this The context
 * @param {string} sName The inner function name
 * @param {object[]} oArgs The inner function parameters
 * @returns {object} The value from the inner function
 */

import type { Property } from "@sap-ux/vocabularies-types";
import type { UserActivity } from "sap/fe/core/controllerextensions/collaboration/CollaborationCommon";
import { getActivityKeyFromPath } from "sap/fe/core/controllerextensions/collaboration/CollaborationCommon";
import type ManagedObject from "sap/ui/base/ManagedObject";
import Library from "sap/ui/core/Lib";

const collaborationFormatters = function (this: object, sName: string, ...oArgs: unknown[]): unknown {
	if (collaborationFormatters.hasOwnProperty(sName)) {
		return (collaborationFormatters as unknown as Record<string, Function>)[sName].apply(this, oArgs);
	} else {
		return "";
	}
};
export const hasCollaborationActivity = function (this: ManagedObject, activities: UserActivity[], ..._keys: unknown[]): boolean {
	return !!getCollaborationActivity(activities, this);
};
hasCollaborationActivity.__functionName = "._formatters.CollaborationFormatter.bind($control)#hasCollaborationActivity";

export const getCollaborationInfo = function (this: ManagedObject, activities: UserActivity[], ..._keys: unknown[]): object | undefined {
	return getCollaborationActivity(activities, this);
};
getCollaborationInfo.__functionName = "._formatters.CollaborationFormatter.bind($control)#getCollaborationInfo";

export const getCollaborationActivityInitials = function (
	this: ManagedObject,
	activities: UserActivity[],
	..._keys: Property[]
): string | undefined {
	const activity = getCollaborationActivity(activities, this);
	return activity?.initials;
};
getCollaborationActivityInitials.__functionName = "._formatters.CollaborationFormatter.bind($control)#getCollaborationActivityInitials";

export const getCollaborationActivityColor = function (
	this: ManagedObject,
	activities: UserActivity[],
	..._keys: Property[]
): string | undefined {
	const activity = getCollaborationActivity(activities, this);
	return activity?.color;
};
getCollaborationActivityColor.__functionName = "._formatters.CollaborationFormatter.bind($control)#getCollaborationActivityColor";

function getCollaborationActivity(activities?: UserActivity[], control?: ManagedObject): UserActivity | undefined {
	const path = control?.getBindingContext()?.getPath();
	if (!path) {
		return undefined;
	}
	const activityKey = getActivityKeyFromPath(path);
	if (activities && activities.length > 0) {
		return activities.find((activity) => {
			return activity.key === activityKey;
		});
	} else {
		return undefined;
	}
}

/**
 * Compute the Invitation dialog title based on the underlying resource bundle.
 * @param args The inner function parameters
 * @returns The dialog title
 */
export const getFormattedText = (...args: string[]): string => {
	const textId = args[0];
	const resourceBundle = Library.getResourceBundleFor("sap.fe.core")!;
	const params = [];
	for (let i = 1; i < args.length; i++) {
		params.push(args[i]);
	}
	return resourceBundle.getText(textId, params);
};

getFormattedText.__functionName = "._formatters.CollaborationFormatter#getFormattedText";

collaborationFormatters.hasCollaborationActivity = hasCollaborationActivity;
collaborationFormatters.getCollaborationActivityInitials = getCollaborationActivityInitials;
collaborationFormatters.getCollaborationActivityColor = getCollaborationActivityColor;
collaborationFormatters.getFormattedText = getFormattedText;
collaborationFormatters.getCollaborationInfo = getCollaborationInfo;

export default collaborationFormatters;
