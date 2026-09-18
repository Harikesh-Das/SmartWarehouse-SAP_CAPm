export type DelegateProperties = {
	name: string;
	bindingPath: string;
	entityType: string;
	label?: string;
	hideFromReveal?: boolean;
	unsupported?: boolean;
	entityTypeDisplayName?: string;
};

/**
 * Filters delegate properties based on the filter expressions from navigation properties.
 * @param delegateProperies
 * @param filterExpressions The filter expressions can include wildcards (*) to match multiple properties (for example: "*", "ToSalesOrder/*" and "ToSalesOrder/ToLineItems*" ).
 * @returns Filtered array of DelegateProperty
 */
export function filterNavigationForAdaptation(
	delegateProperies: DelegateProperties[],
	filterExpressions: string[] | null = [""]
): DelegateProperties[] {
	filterExpressions = filterExpressions === null ? [""] : filterExpressions;
	if (!filterExpressions?.includes("")) {
		// Always include properties without navigation if not already included
		filterExpressions.push("");
	}
	return delegateProperies.filter(function (property) {
		return filterExpressions.some(function (filterExpression) {
			let regexString: string;
			switch (filterExpression) {
				case "":
					// Match only properties without navigation
					regexString = "^[^/]*$";
					break;
				case "*":
				case "*/*":
					// Match all properties and navigations
					regexString = ".*";
					break;
				default:
					// Convert wildcard to regex
					regexString = filterExpression.includes("/")
						? "^" + filterExpression.replace(/\*/g, ".*").replace("/", "\\/") + "$"
						: "^" + filterExpression.replace(/\*/g, ".*") + "\\/.*";
			}

			return new RegExp(regexString).test(property.name);
		});
	});
}
