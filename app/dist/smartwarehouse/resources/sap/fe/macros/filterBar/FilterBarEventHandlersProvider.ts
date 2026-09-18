import type UI5Event from "sap/ui/base/Event";
import type FilterBarAPI from "../FilterBar";

type EventHandlerType = (e: UI5Event) => void;

export default class FilterBarEventHandlerProvider {
	search!: EventHandlerType;

	filtersChanged!: EventHandlerType;

	constructor(private filterBarAPI?: FilterBarAPI) {
		if (filterBarAPI) {
			this.constructorWithFunctions(filterBarAPI);
		} else {
			this.constructorWithStrings();
		}
	}

	/**
	 * Initializes the event handler properties with string values.
	 */
	private constructorWithStrings(): void {
		this.search = "API.handleSearch($event)" as unknown as EventHandlerType;
		this.filtersChanged = "API.handleFilterChanged($event)" as unknown as EventHandlerType;
	}

	/**
	 * Initializes the event handler properties with functions.
	 * @param filterBarAPI
	 */
	private constructorWithFunctions(filterBarAPI: FilterBarAPI): void {
		this.search = filterBarAPI.handleSearch.bind(filterBarAPI);
		this.filtersChanged = filterBarAPI.handleFilterChanged.bind(filterBarAPI);
	}

	/**
	 * Get the search event handler.
	 * @returns The event handler.
	 */
	getSearchHandler(): EventHandlerType {
		return this.search;
	}

	/**
	 * Get the filters changed event handler.
	 * @returns The event handler.
	 */
	getFiltersChangedHandler(): EventHandlerType {
		return this.filtersChanged;
	}
}
