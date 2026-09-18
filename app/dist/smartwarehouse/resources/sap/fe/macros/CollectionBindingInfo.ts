import deepClone from "sap/base/util/deepClone";
import Filter from "sap/ui/model/Filter";
import type FilterOperator from "sap/ui/model/FilterOperator";
import type Sorter from "sap/ui/model/Sorter";

export type FilterInfo = {
	path?: string;
	test?: (p1: unknown) => boolean;
	comparator?: (p1: unknown, p2: unknown) => number;
	operator?:
		| FilterOperator
		| "All"
		| "Any"
		| "BT"
		| "Contains"
		| "EndsWith"
		| "EQ"
		| "GE"
		| "GT"
		| "LE"
		| "LT"
		| "NB"
		| "NE"
		| "NotContains"
		| "NotEndsWith"
		| "NotStartsWith"
		| "StartsWith"
		| undefined;
	value1?: unknown;
	value2?: unknown;
	variable?: string;
	condition?: Filter;
	filters?: Filter[];
	and?: boolean;
	caseSensitive?: boolean;
};

/**
 * Type definition for the CollectionBindingInfo used in the Table and Chart controls.
 * This type is based on the sap.ui.model.odata.v4.ODataListBinding and adds additional parameters used in SAP Fiori elements.
 * @public
 * @typedef
 */
export type SerializedCollectionBindingInfo = {
	events?: Record<string, Function>;
	suspended?: boolean;
	path?: string;
	filters?: Filter;
	search?: string;
	parameters?: {
		$search?: string;
		$select?: string;
		$$aggregation?: Aggregation;
		$$sharedRequest?: boolean;
		$count?: boolean;
		$$clearSelectionOnFilter?: boolean;
		$$getKeepAliveContext?: boolean;
		$$groupId?: string;
		$$updateGroupId?: string;
		$$ownRequest?: boolean;
		$$patchWithoutSideEffects?: boolean;
	};
	sorter?: Sorter[];
};

export type Aggregation = {
	search?: string;
	expandTo?: number;
	hierarchyQualifier?: string;
};

export type EventHandler = {
	eventId: string;
	callback: Function;
	listener?: object;
	data?: object;
};

/**
 * API to add parameters to the collection binding info.
 * @hideconstructor
 * @alias sap.fe.macros.CollectionBindingInfo
 * @public
 */
export default class CollectionBindingInfoAPI {
	private collectionBindingInfo: SerializedCollectionBindingInfo;

	private attachedEvents: EventHandler[] = [];

	constructor(bindingInfo: SerializedCollectionBindingInfo) {
		this.collectionBindingInfo = bindingInfo;
	}

	/**
	 * Recursive cloning of the Filter.
	 * Filters have a parameter aFilters which contains more filters, so we use this method to recursively clone it.
	 * cloneFilters should be called first, to have the Filter outside an array and avoid an empty filter.
	 * @param cloning The filter to be cloned
	 * @returns The cloned Filter
	 */
	cloneFiltersContent(cloning: Filter): Filter {
		const filterInfo: FilterInfo = {
			path: cloning.getPath(),
			operator: cloning.getOperator(),
			value1: cloning.getValue1(),
			value2: cloning.getValue2(),
			variable: cloning.getVariable(),
			condition: cloning.getCondition(),
			and: cloning.isAnd(),
			caseSensitive: cloning.isCaseSensitive()
		};

		const testFn = cloning.getTest();
		if (testFn !== undefined) {
			filterInfo.test = testFn;
		}

		const comparatorFn = cloning.getComparator();
		if (comparatorFn !== undefined) {
			filterInfo.comparator = comparatorFn;
		}

		const filters = cloning.getFilters();
		const arrayFilter = filters?.map((singleFilter: Filter) => {
			return this.cloneFiltersContent(singleFilter);
		});
		if (arrayFilter) {
			filterInfo.filters = arrayFilter;
		}
		return new Filter(filterInfo);
	}

	/**
	 * Returns the current filters applied to the Table.
	 * @public
	 * @returns The {@link sap.ui.model.Filter "filters"} on the table
	 */
	getFilters(): Filter | undefined {
		if (this.collectionBindingInfo.filters) {
			return this.cloneFiltersContent(this.collectionBindingInfo.filters);
		}
		return undefined;
	}

	/**
	 * Adds a filter to the filters already present in the binding info.
	 * @param customFilter The {@link sap.ui.model.Filter "filter"} to add
	 * @public
	 */
	addFilter(customFilter: Filter): void {
		const filters = this.collectionBindingInfo.filters ? [this.collectionBindingInfo.filters] : [];
		filters.push(customFilter);
		this.collectionBindingInfo.filters = new Filter(filters, true);
	}

	/**
	 * Returns the current sorters of the Table.
	 * @returns The {@link sap.ui.model.Sorter "sorters"} on the table
	 * @public
	 */
	getSorters(): Sorter[] | undefined {
		return this.collectionBindingInfo.sorter;
	}

	/**
	 * Adds parameters to the select query.
	 * @param parameters The list or properties to add to the query
	 * @public
	 */
	addSelect(parameters: string[]): void {
		const parameterString: string = parameters.toString();
		if (this.collectionBindingInfo.parameters?.$select) {
			this.collectionBindingInfo.parameters.$select = this.collectionBindingInfo.parameters.$select + "," + parameterString;
		} else {
			this.collectionBindingInfo.parameters ??= {};
			this.collectionBindingInfo.parameters.$select = parameterString;
		}
	}

	/**
	 * Retrieve the 'serialized' binding info which is useful if you want to create your own binding
	 * @returns {CollectionBindingInfo} The {@link sap.fe.macros.CollectionBindingInfo "CollectionBindingInfo"}
	 * @public
	 */

	getBindingInfo(): SerializedCollectionBindingInfo {
		const clonedBindingInfo = { ...this.collectionBindingInfo };

		// Making deepClones of objects (except Sorters because we can't)
		if (this.collectionBindingInfo.events) {
			clonedBindingInfo.events = deepClone(this.collectionBindingInfo.events);
		}
		if (this.collectionBindingInfo.filters) {
			clonedBindingInfo.filters = this.cloneFiltersContent(this.collectionBindingInfo.filters);
		}
		if (this.collectionBindingInfo.parameters) {
			deepClone(this.collectionBindingInfo.parameters);
		}
		return clonedBindingInfo;
	}

	/**
	 * Adds a sorter to the sorter(s) already present, or create one if none exists.
	 * @param sorter The {@link sap.ui.model.Sorter "sorter"} to add to the query
	 * @public
	 */
	addSorter(sorter: Sorter): void {
		if (!this.collectionBindingInfo.sorter) {
			this.collectionBindingInfo.sorter = [sorter];
		} else {
			this.collectionBindingInfo.sorter.push(sorter);
		}
	}

	/**
	 * Attach the events to the table binding.
	 * @param eventId The event ID to attach the callback to
	 * @param callback The callback function to be executed when the event is triggered
	 * @param listener The listener object that will be used as the context for the callback function
	 * @param data Data that will be passed to the callback function when the event is triggered
	 * @public
	 */
	attachEvent(eventId: string, callback: Function, listener?: object, data?: object): void {
		const handler: EventHandler = { eventId, callback, listener, data };
		this.attachedEvents.push(handler);
	}

	/**
	 * Gets the attached event handlers.
	 * @returns An array of attached event handlers.
	 */
	getAttachedEvents(): EventHandler[] {
		return this.attachedEvents;
	}
}
