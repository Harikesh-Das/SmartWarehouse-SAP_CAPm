import Log from "sap/base/Log";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import { UI } from "sap/fe/core/helpers/BindingHelper";
import Field from "sap/fe/macros/Field";
import type AddressConfiguration from "sap/fe/macros/address/AddressConfiguration";
import type AddressGroup from "sap/fe/macros/address/AddressGroup";
import FieldWrapper from "sap/fe/macros/controls/FieldWrapper";
import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import HBox from "sap/m/HBox";
import IconTabBar from "sap/m/IconTabBar";
import IconTabFilter from "sap/m/IconTabFilter";
import Link from "sap/m/Link";
import Text from "sap/m/Text";
import VBox from "sap/m/VBox";
import type UI5Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import type Element from "sap/ui/core/Element";
import Title from "sap/ui/core/Title";
import DynamicSideContent from "sap/ui/layout/DynamicSideContent";
import GridData from "sap/ui/layout/GridData";
import Form from "sap/ui/layout/form/Form";
import FormContainer from "sap/ui/layout/form/FormContainer";
import FormElement from "sap/ui/layout/form/FormElement";
import ResponsiveGridLayout from "sap/ui/layout/form/ResponsiveGridLayout";
import type MDCField from "sap/ui/mdc/Field";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type { EventHandler } from "../../../../../../types/extension_types";

const ADDRESS_CHANGE_GROUP_ID = "addressChange";

type AddressFieldConfig = {
	name: string;
	property?: string;
	required?: boolean;
	connection?: string;
	group?: string;
	priority?: string;
};

type CountryReference = {
	reference: string;
};

type CountryConfigurations = Record<string, AddressFieldConfig[] | CountryReference>;

@defineUI5Class("sap.fe.macros.Address")
export default class AddressBlock extends BuildingBlock<Control> {
	/**
	 * The country code for which the address should be displayed and edited. Shall be bound to the country property of the address entity.
	 */
	@property({ type: "string", required: true })
	country!: string;

	/**
	 * If set to true, the address is displayed in read-only mode and editing is disabled.
	 */
	@property({ type: "boolean" })
	readOnly?: boolean;

	/**
	 * If set to true, the address will be displayed in a single line format. This is the recommended visualization within a grid table.
	 */
	@property({ type: "boolean" })
	singleLine?: boolean;

	/**
	 * Separator string used between address fields in single line mode.
	 */
	@property({ type: "string", defaultValue: "," })
	singleLineSeparator?: string;

	/**
	 * Label separator string used between connected fields (for example, between street and house number).
	 */
	@property({ type: "string", defaultValue: " • " })
	labelSeparator?: string;

	/**
	 * Default address configuration. This contains also the mapping between address field roles and actual properties.
	 * This configuration is used when no country-specific configuration is available.
	 */
	@property({ type: "object" })
	defaultConfiguration?: AddressConfiguration[] | Record<string, unknown>[];

	/**
	 * Country-specific address configurations. The key is the country code, the value is an array of field configurations or a reference to another country.
	 */
	@property({ type: "object" })
	countryConfigurations?: CountryConfigurations;

	/**
	 * Optional groups for grouping address fields in edit mode.
	 */
	@property({ type: "object" })
	groups?: AddressGroup[] | Record<string, string>[];

	private _mapping?: Record<string, AddressFieldConfig>;

	private _displayContent?: VBox;

	private _editDialog?: Dialog;

	private _showMoreStates: Map<string, boolean> = new Map();

	/**
	 * Called when metadata is available. Initializes the content of the building block.
	 * @param _ownerComponent The owner component
	 */
	onMetadataAvailable(_ownerComponent: TemplateComponent): void {
		super.onMetadataAvailable(_ownerComponent);
		this.content = this.createContent();
	}

	/**
	 * Cleans up resources when the control is destroyed.
	 * Destroys display content, edit dialog, and clears internal state.
	 */
	exit(): void {
		this._displayContent?.destroy();
		this._editDialog?.destroy();
		this._showMoreStates.clear();
	}

	/**
	 * Updates the country code and recreates the content to reflect the new country configuration.
	 * @param country The new country code
	 */
	setCountry(country: string): void {
		this.country = country;
		this.content = this.createContent();
	}

	/**
	 * Submits the address changes to the backend and closes the edit dialog.
	 * If successful, refreshes the binding context and recreates the display content.
	 * If an error occurs, keeps the dialog open and logs the error.
	 */
	async submitAddressChanges(): Promise<void> {
		const model = this.getModel() as ODataModel;
		const context = this.getBindingContext() as Context;

		try {
			// Submit the batch with our custom group ID
			await model.submitBatch(ADDRESS_CHANGE_GROUP_ID);

			// Refresh the context to update all views (display content, table, flexible column layout)
			if (context !== null && context !== undefined) {
				context.refresh();
			}

			// If successful, close and destroy the dialog
			this._editDialog?.close();
			this._editDialog?.destroy();
			this._editDialog = undefined;
			this._showMoreStates.clear();

			// Refresh the display content
			this.content = this.createContent();
		} catch (error) {
			// If there's an error, keep the dialog open
			// The error will be displayed by the framework's message handling
			Log.error("Error submitting address changes", error as Error);
		}
	}

	/**
	 * Cancels the address changes and closes the edit dialog.
	 * Resets any pending changes in the address change group and destroys the dialog.
	 */
	cancelAddressChanges(): void {
		const model = this.getModel() as ODataModel;

		// Reset any pending changes for this group
		model.resetChanges(ADDRESS_CHANGE_GROUP_ID);

		// Close and destroy the dialog
		this._editDialog?.close();
		this._editDialog?.destroy();
		this._editDialog = undefined;
		this._showMoreStates.clear();
	}

	/**
	 * Opens the edit dialog for changing or creating an address.
	 * Creates a new binding context with custom update group ID and initializes the dialog with edit content.
	 * The dialog title changes based on whether this is an address change or creation.
	 */
	changeAddress(): void {
		const context = this.getBindingContext();
		const model = this.getModel() as ODataModel;

		// Create a new binding context with custom update group ID
		let newContext = context;
		if (context !== null && context !== undefined && model !== null && model !== undefined) {
			const path = context.getPath();
			const contextBinding = model.bindContext(path, undefined, {
				$$updateGroupId: ADDRESS_CHANGE_GROUP_ID
			});
			newContext = contextBinding.getBoundContext();
		}

		this._editDialog = new Dialog({
			title: this.country ? this.getTranslatedText("C_ADDRESS_CHANGE_TITLE") : this.getTranslatedText("C_ADDRESS_CREATE_TITLE"),
			contentWidth: "60rem",
			contentHeight: "50rem",
			resizable: true,
			draggable: true,
			content: this.getEditContent(),
			horizontalScrolling: false,
			verticalScrolling: true,
			beginButton: new Button({
				text: this.country ? this.getTranslatedText("C_ADDRESS_CHANGE_TITLE") : this.getTranslatedText("C_ADDRESS_CREATE_TITLE"),
				type: "Emphasized",
				enabled: false,
				press: this.submitAddressChanges.bind(this)
			}),
			endButton: new Button({
				text: this.getTranslatedText("C_ADDRESS_CANCEL"),
				press: this.cancelAddressChanges.bind(this)
			})
		});

		if (newContext) {
			this._editDialog.setBindingContext(newContext);
		}

		this.addDependent(this._editDialog);

		this._editDialog.open();
		this._editDialog?.attachAfterOpen(() => {
			this.validateRequiredFields();
		});
	}

	/**
	 * Checks if the default configuration contains any fields with a group definition.
	 * @returns True if at least one field in defaultConfiguration has a group, false otherwise
	 */
	hasGroupedFields(): boolean {
		if (!this.defaultConfiguration) {
			return false;
		}
		return this.defaultConfiguration.some((config) => {
			const group = this.getConfigProperty<string | undefined>(config, "group");
			return group !== undefined && group !== "";
		});
	}

	/**
	 * Get the address field configuration for a specific country.
	 * Supports country references where one country can inherit the configuration from another country.
	 * For example, French overseas territories (GP, MQ, RE, GF) can reference the FR configuration.
	 * If no country-specific configuration exists, returns the default configuration from defaultConfiguration.
	 * @param newCountry Optional country code to get configuration for (defaults to current country)
	 * @returns Array of address field configurations for the specified country
	 */
	getConfig(newCountry?: string): AddressFieldConfig[] {
		const targetCountry = newCountry ?? this.country;

		// Use the countryConfigurations property directly
		if (this.countryConfigurations && this.countryConfigurations[targetCountry] !== undefined) {
			const countryFieldsData = this.countryConfigurations[targetCountry];

			// Check if this is a reference to another country
			if (this.isCountryReference(countryFieldsData)) {
				return this.resolveCountryReference(targetCountry, countryFieldsData.reference);
			}

			// Regular array of field configurations
			if (Array.isArray(countryFieldsData)) {
				const countryConfig = countryFieldsData.map((fieldData: AddressFieldConfig) => ({
					name: fieldData.name,
					property: fieldData.property,
					required: fieldData.required ?? false,
					connection: fieldData.connection,
					group: fieldData.group,
					priority: fieldData.priority
				}));

				// Add missing grouped properties from defaultConfiguration as Low priority
				return this.addMissingGroupedProperties(countryConfig);
			}
		}

		// No country-specific configuration found, use default configuration
		return this.getDefaultConfig();
	}

	/**
	 * Add properties from defaultConfiguration that have a group but are not in the country-specific config.
	 * These properties are added with Low priority to appear in the "Show Details" section.
	 * @param countryConfig The country-specific configuration
	 * @returns Enhanced configuration with missing grouped properties added as Low priority
	 */
	private addMissingGroupedProperties(countryConfig: AddressFieldConfig[]): AddressFieldConfig[] {
		if (!this.defaultConfiguration) {
			return countryConfig;
		}

		// Create a set of field names that are already in the country config
		const existingFieldNames = new Set(countryConfig.map((field) => field.name));

		// Find properties in defaultConfiguration that have a group but are not in country config
		const missingGroupedProperties: AddressFieldConfig[] = [];

		for (const config of this.defaultConfiguration) {
			const name = this.getConfigProperty<string>(config, "name");
			const group = this.getConfigProperty<string | undefined>(config, "group");

			// If this property has a group and is not in the country config, add it as Low priority
			if (group && !existingFieldNames.has(name)) {
				const propertyValue = this.getConfigProperty<string | undefined>(config, "property");
				const connection = this.getConfigProperty<string | undefined>(config, "connection");

				missingGroupedProperties.push({
					name: name,
					property: propertyValue ?? name,
					required: false, // Missing properties are not required
					connection: connection,
					group: group,
					priority: "Low" // Always Low priority for missing grouped properties
				});
			}
		}

		// Append missing properties to the country config
		return [...countryConfig, ...missingGroupedProperties];
	}

	/**
	 * Get the default address field configuration from defaultConfiguration.
	 * Returns all fields in the order they appear in defaultConfiguration.
	 * @returns Array of address field configurations from defaultConfiguration
	 */
	private getDefaultConfig(): AddressFieldConfig[] {
		if (!this.defaultConfiguration) {
			return [];
		}

		return this.defaultConfiguration.map((config) => {
			const name = this.getConfigProperty<string>(config, "name");
			const propertyValue = this.getConfigProperty<string | undefined>(config, "property");
			const required = this.getConfigProperty<boolean | undefined>(config, "required");
			const connection = this.getConfigProperty<string | undefined>(config, "connection");
			const group = this.getConfigProperty<string | undefined>(config, "group");
			const priority = this.getConfigProperty<string | undefined>(config, "priority");

			return {
				name: name,
				property: propertyValue ?? name,
				required: required ?? false,
				connection: connection,
				group: group,
				priority: priority
			};
		});
	}

	/**
	 * Check if a country configuration is a reference to another country.
	 * @param config The country configuration to check
	 * @returns True if this is a reference object, false otherwise
	 */
	private isCountryReference(config: AddressFieldConfig[] | CountryReference): config is CountryReference {
		return !Array.isArray(config) && typeof config === "object" && "reference" in config;
	}

	/**
	 * Resolve a country reference, following the reference chain and protecting against circular references.
	 * @param originalCountry The original country that started the reference chain (for error messages)
	 * @param referenceCountry The country to resolve
	 * @param visitedCountries Set of already visited countries to detect circular references
	 * @returns The resolved field configuration array
	 */
	private resolveCountryReference(
		originalCountry: string,
		referenceCountry: string,
		visitedCountries: Set<string> = new Set()
	): AddressFieldConfig[] {
		// Check for circular reference
		if (visitedCountries.has(referenceCountry)) {
			Log.error(
				`Circular reference detected in country configurations: ${originalCountry} -> ${Array.from(visitedCountries).join(
					" -> "
				)} -> ${referenceCountry}`
			);
			return [];
		}

		// Add current country to visited set
		visitedCountries.add(referenceCountry);

		// Check if reference country exists
		if (!this.countryConfigurations || this.countryConfigurations[referenceCountry] === undefined) {
			Log.error(`Country reference '${referenceCountry}' not found in countryConfigurations (referenced by '${originalCountry}')`);
			return [];
		}

		const referencedConfig = this.countryConfigurations[referenceCountry];

		// If the referenced country also has a reference, follow it
		if (this.isCountryReference(referencedConfig)) {
			return this.resolveCountryReference(originalCountry, referencedConfig.reference, visitedCountries);
		}

		// Return the resolved configuration
		if (Array.isArray(referencedConfig)) {
			return referencedConfig.map((fieldData: AddressFieldConfig) => ({
				name: fieldData.name,
				property: fieldData.property,
				required: fieldData.required ?? false,
				connection: fieldData.connection,
				group: fieldData.group,
				priority: fieldData.priority
			}));
		}

		return [];
	}

	/**
	 * Creates the edit content for the address dialog.
	 * Returns either grouped content with tabs or simple form content based on group configuration.
	 * @param [newCountry] Optional country code to get configuration for
	 * @returns The edit content control
	 */
	getEditContent(newCountry?: string): Control {
		// Check if groups are defined and there are fields with groups in defaultConfiguration
		if (this.groups && this.groups.length > 0 && this.hasGroupedFields()) {
			return this.getGroupedEditContent(newCountry);
		} else {
			return this.getSimpleEditContent(newCountry);
		}
	}

	/**
	 * Creates a simple form edit content without grouping or tabs.
	 * Places the country field first, followed by all other configured address fields.
	 * @param [newCountry] Optional country code to get configuration for
	 * @returns Form control containing all address fields
	 */
	getSimpleEditContent(newCountry?: string): Form {
		const countryProperty = this.getCountryProperty();
		const countryPropertyName = this.getCountryPropertyName();
		const countryConfig = this.getConfig(newCountry);
		const metaModel = this.getModel()?.getMetaModel() as ODataMetaModel;
		const path = this.getBindingContext()?.getPath() as string;
		const contextMetaPath = metaModel?.getMetaPath(path);

		// Create Form with ResponsiveGridLayout - labels on top, fields use full width
		const form = (<Form editable={true} />) as Form;
		const layout = (
			<ResponsiveGridLayout
				labelSpanXL={12}
				labelSpanL={12}
				labelSpanM={12}
				labelSpanS={12}
				adjustLabelSpan={false}
				emptySpanXL={0}
				emptySpanL={0}
				emptySpanM={0}
				emptySpanS={0}
				columnsXL={1}
				columnsL={1}
				columnsM={1}
				singleContainerFullSize={false}
			/>
		) as ResponsiveGridLayout;
		form.setLayout(layout);

		const formContainer = (<FormContainer />) as FormContainer;
		form.addFormContainer(formContainer);

		// Country should be the first element in edit mode - filter by the actual property name from binding
		const countryConfigEdit = [...countryConfig];
		const countryIndex = countryConfigEdit.findIndex((item) => item.name === countryPropertyName);
		if (countryIndex > -1) {
			countryConfigEdit.splice(countryIndex, 1);
		}

		// Add country field
		const countryChangeEvent = this.countryChanged.bind(this);
		const countryLabel = this.getFieldLabel(contextMetaPath, countryProperty);
		const field = (
			<Field
				contextPath={contextMetaPath}
				metaPath={countryProperty}
				readOnly={false}
				required={true}
				change={countryChangeEvent as EventHandler}
			/>
		);
		const countryElement = <FormElement label={countryLabel} />;
		countryElement.addField(field);
		formContainer.addFormElement(countryElement);

		// Process remaining fields using common helper
		const formElements = this.processFieldsIntoFormElements(countryConfigEdit, contextMetaPath, metaModel);
		for (const formElement of formElements) {
			formContainer.addFormElement(formElement);
		}

		return form;
	}

	/**
	 * Creates grouped edit content with IconTabBar navigation for different field sections.
	 * Organizes fields into Country, General, and custom group sections based on configuration.
	 * @param [newCountry] Optional country code to get configuration for
	 * @returns VBox control containing IconTabBar and grouped content sections
	 */
	getGroupedEditContent(newCountry?: string): VBox {
		const countryProperty = this.getCountryProperty();
		const countryPropertyName = this.getCountryPropertyName();
		const countryConfig = this.getConfig(newCountry);
		const metaModel = this.getModel()?.getMetaModel() as ODataMetaModel;
		const path = this.getBindingContext()?.getPath() as string;
		const contextMetaPath = metaModel?.getMetaPath(path);

		if (!this._mapping) {
			this._mapping = this.createMapping();
		}

		// Remove country from the config as it's handled separately at the top - use actual property name from binding
		const countryConfigEdit = countryConfig.filter((item) => item.name !== countryPropertyName);

		// Classify fields into groups
		const { groupMap, ungroupedFields, groupedFields } = this.classifyFieldsByGroup(countryConfigEdit);

		// Create IconTabBar
		const iconTabBar = <IconTabBar select={this.onTabSelect.bind(this)} backgroundDesign="Transparent" />;

		// Create content container for all sections
		const contentContainer = <VBox class="sapUiNoContentPadding" />;

		// Create country section
		this.addCountrySection(countryProperty, contextMetaPath, metaModel, contentContainer, iconTabBar);

		// Add "General" section if there are ungrouped fields
		if (ungroupedFields.length > 0) {
			this.addGroupSection(
				"general",
				this.getTranslatedText("C_ADDRESS_SECTION_GENERAL"),
				ungroupedFields,
				contextMetaPath,
				metaModel,
				contentContainer,
				iconTabBar
			);
		}

		// Add grouped sections
		for (const [groupKey, groupFields] of Array.from(groupedFields.entries())) {
			const groupTitle = groupMap.get(groupKey) || groupKey;
			this.addGroupSection(groupKey, groupTitle, groupFields, contextMetaPath, metaModel, contentContainer, iconTabBar);
		}

		return (
			<VBox>
				{iconTabBar}
				{contentContainer}
			</VBox>
		);
	}

	/**
	 * Classify fields into grouped and ungrouped categories.
	 * @param fields The fields to classify
	 * @returns Object containing groupMap, ungroupedFields, and groupedFields
	 */
	private classifyFieldsByGroup(fields: AddressFieldConfig[]): {
		groupMap: Map<string, string>;
		ungroupedFields: AddressFieldConfig[];
		groupedFields: Map<string, AddressFieldConfig[]>;
	} {
		const groupMap = new Map<string, string>(); // key -> title mapping
		const ungroupedFields: AddressFieldConfig[] = [];
		const groupedFields = new Map<string, AddressFieldConfig[]>();

		// Create group map from groups aggregation
		if (this.groups) {
			for (const group of this.groups) {
				const key = (group as AddressGroup).key ?? (group as Record<string, string>).key;
				const title = (group as AddressGroup).title ?? (group as Record<string, string>).title;
				groupMap.set(key, title);
			}
		}

		// Separate fields into grouped and ungrouped based on defaultConfiguration
		for (const entry of fields) {
			const mapping = this._mapping![entry.name];
			if (mapping?.property) {
				const groupKey = entry.group ?? mapping.group;
				if (groupKey && groupMap.has(groupKey)) {
					if (!groupedFields.has(groupKey)) {
						groupedFields.set(groupKey, []);
					}
					groupedFields.get(groupKey)!.push(entry);
				} else {
					ungroupedFields.push(entry);
				}
			}
		}

		return { groupMap, ungroupedFields, groupedFields };
	}

	/**
	 * Add a country section to the dialog content.
	 * @param countryProperty The country property name
	 * @param contextMetaPath The metadata path for the context
	 * @param metaModel The OData metamodel
	 * @param contentContainer The VBox container to add the section to
	 * @param iconTabBar The IconTabBar to add the tab to
	 */
	private addCountrySection(
		countryProperty: string,
		contextMetaPath: string,
		metaModel: ODataMetaModel,
		contentContainer: VBox,
		iconTabBar: IconTabBar
	): void {
		const countryFormContainer = this.createCountryContent(countryProperty, contextMetaPath, metaModel);
		const countryForm = (<Form id="country-section" editable={true} class="sapUiNoMarginTop sapUiMediumMarginBottom" />) as Form;
		const countryLayout = (
			<ResponsiveGridLayout
				labelSpanXL={12}
				labelSpanL={12}
				labelSpanM={12}
				labelSpanS={12}
				adjustLabelSpan={false}
				emptySpanXL={0}
				emptySpanL={0}
				emptySpanM={0}
				emptySpanS={0}
				columnsXL={1}
				columnsL={1}
				columnsM={1}
				singleContainerFullSize={false}
			/>
		) as ResponsiveGridLayout;
		countryForm.setLayout(countryLayout);
		countryForm.setTitle(<Title text={this.getTranslatedText("C_ADDRESS_SECTION_COUNTRY")} />);
		countryForm.addFormContainer(countryFormContainer);
		contentContainer.addItem(countryForm);

		const countryFilter = <IconTabFilter text={this.getTranslatedText("C_ADDRESS_SECTION_COUNTRY")} key="country" />;
		iconTabBar.addItem(countryFilter);
	}

	/**
	 * Add a group section to the dialog content.
	 * @param groupKey The group key
	 * @param groupTitle The group title
	 * @param fields The fields for this group
	 * @param contextMetaPath The metadata path for the context
	 * @param metaModel The OData metamodel
	 * @param contentContainer The VBox container to add the section to
	 * @param iconTabBar The IconTabBar to add the tab to
	 */
	private addGroupSection(
		groupKey: string,
		groupTitle: string,
		fields: AddressFieldConfig[],
		contextMetaPath: string,
		metaModel: ODataMetaModel,
		contentContainer: VBox,
		iconTabBar: IconTabBar
	): void {
		const groupContent = this.createGroupEditContent(fields, contextMetaPath, metaModel, groupTitle);

		if (groupContent instanceof FormContainer) {
			// Simple FormContainer - wrap in Form
			const groupForm = (<Form id={`${groupKey}-section`} editable={true} class="sapUiMediumMarginBottom" />) as Form;
			const groupLayout = (
				<ResponsiveGridLayout
					labelSpanXL={12}
					labelSpanL={12}
					labelSpanM={12}
					labelSpanS={12}
					adjustLabelSpan={false}
					emptySpanXL={0}
					emptySpanL={0}
					emptySpanM={0}
					emptySpanS={0}
					columnsXL={1}
					columnsL={1}
					columnsM={1}
					singleContainerFullSize={false}
				/>
			) as ResponsiveGridLayout;
			groupForm.setLayout(groupLayout);
			groupForm.setTitle(<Title text={groupTitle} />);
			groupForm.addFormContainer(groupContent);
			contentContainer.addItem(groupForm);
		} else if (groupContent instanceof DynamicSideContent) {
			// DynamicSideContent already contains Forms with title, add directly
			contentContainer.addItem(groupContent);
		}

		const filter = <IconTabFilter text={groupTitle} key={groupKey} />;
		iconTabBar.addItem(filter);
	}

	/**
	 * Creates the FormContainer for the country field with change handler.
	 * @param countryProperty The country property path
	 * @param contextMetaPath The metadata path for the context
	 * @param _metaModel The OData metamodel
	 * @returns FormContainer with the country field
	 */
	createCountryContent(countryProperty: string, contextMetaPath: string, _metaModel: ODataMetaModel): FormContainer {
		const countryChangeEvent = this.countryChanged.bind(this);
		const countryLabel = this.getFieldLabel(contextMetaPath, countryProperty);
		const field = (
			<Field
				contextPath={contextMetaPath}
				metaPath={countryProperty}
				readOnly={false}
				required={true}
				change={countryChangeEvent as EventHandler}
			/>
		);

		const formContainer = <FormContainer />;
		const formElement = <FormElement label={countryLabel} />;
		formElement.addField(field);
		formContainer.addFormElement(formElement);
		return formContainer;
	}

	/**
	 * Handles tab selection in the grouped edit dialog.
	 * Scrolls the corresponding section into view when a tab is selected.
	 * @param event The tab selection event
	 */
	onTabSelect(event: UI5Event<{ item?: IconTabFilter }>): void {
		const selectedFilter = event.getParameter("item");
		if (!selectedFilter) {
			return;
		}

		// Find the section by matching the tab index with the section index
		const dialogContent = this._editDialog?.getContent()[0];
		if (dialogContent instanceof VBox) {
			const vboxItems = dialogContent.getItems();
			let iconTabBar: IconTabBar | undefined;
			let contentContainer: VBox | undefined;

			// Find IconTabBar and content container
			for (const item of vboxItems) {
				if (item instanceof IconTabBar) {
					iconTabBar = item;
				} else if (item instanceof VBox) {
					contentContainer = item;
				}
			}

			if (iconTabBar && contentContainer) {
				// Get the selected tab index
				const selectedIndex = iconTabBar.getItems().indexOf(selectedFilter);
				if (selectedIndex >= 0) {
					// Get the corresponding section
					const sections = contentContainer.getItems();
					if (selectedIndex < sections.length) {
						const section = sections[selectedIndex];
						// Use DOM scrolling after a short delay to ensure rendering is complete
						setTimeout(() => {
							const domElement = section.getDomRef();
							if (domElement) {
								domElement.scrollIntoView({ behavior: "smooth", block: "start" });
							}
						}, 100);
					}
				}
			}
		}
	}

	/**
	 * Creates edit content for a group of fields, with optional Show More and Show Less functionality.
	 * If the group contains Low priority fields, uses DynamicSideContent to show and hide details.
	 * Otherwise, returns a simple FormContainer with all fields.
	 * @param fields The fields for this group
	 * @param contextMetaPath The metadata path for the context
	 * @param metaModel The OData metamodel
	 * @param [sectionTitle] Optional title for the section
	 * @returns Control or FormContainer containing the group content
	 */
	createGroupEditContent(
		fields: AddressFieldConfig[],
		contextMetaPath: string,
		metaModel: ODataMetaModel,
		sectionTitle?: string
	): Control | FormContainer {
		// Separate fields by priority
		const highMediumFields = fields.filter((field) => {
			const mapping = this._mapping![field.name];
			const priority = field.priority ?? mapping?.priority;
			return priority === "High" || priority === "Medium" || !priority; // Default to High/Medium if no priority
		});

		const lowFields = fields.filter((field) => {
			const mapping = this._mapping![field.name];
			const priority = field.priority ?? mapping?.priority;
			return priority === "Low";
		});

		// If there are low priority fields, use DynamicSideContent pattern like ObjectPage
		if (lowFields.length > 0) {
			// Create deterministic key based on field names to maintain state across refreshes
			const fieldNames = fields
				.map((f) => f.name)
				.sort((a, b) => a.localeCompare(b))
				.join("_");
			const groupKey = `group_${fieldNames}`;
			const showMore = this._showMoreStates.get(groupKey) ?? false;

			const highMediumContent = this.createFieldsFormContainer(highMediumFields, contextMetaPath, metaModel);
			const lowContent = this.createFieldsFormContainer(lowFields, contextMetaPath, metaModel);

			// Create Show More button
			const showMoreButton = (
				<Button
					text={showMore ? this.getTranslatedText("C_ADDRESS_SHOW_LESS") : this.getTranslatedText("C_ADDRESS_SHOW_MORE")}
					type="Transparent"
					press={(): void => this.toggleShowMore(groupKey)}
				/>
			);

			// Create Forms for main and side content
			const mainForm = (<Form editable={true} />) as Form;
			const mainLayout = (
				<ResponsiveGridLayout
					labelSpanXL={12}
					labelSpanL={12}
					labelSpanM={12}
					labelSpanS={12}
					adjustLabelSpan={false}
					emptySpanXL={0}
					emptySpanL={0}
					emptySpanM={0}
					emptySpanS={0}
					columnsXL={1}
					columnsL={1}
					columnsM={1}
					singleContainerFullSize={false}
				/>
			) as ResponsiveGridLayout;
			mainForm.setLayout(mainLayout);
			// Add title to main form if provided
			if (sectionTitle) {
				mainForm.setTitle(<Title text={sectionTitle} />);
			}
			mainForm.addFormContainer(highMediumContent);

			const sideForm = (<Form editable={true} />) as Form;
			const sideLayout = (
				<ResponsiveGridLayout
					labelSpanXL={12}
					labelSpanL={12}
					labelSpanM={12}
					labelSpanS={12}
					adjustLabelSpan={false}
					emptySpanXL={0}
					emptySpanL={0}
					emptySpanM={0}
					emptySpanS={0}
					columnsXL={1}
					columnsL={1}
					columnsM={1}
					singleContainerFullSize={false}
				/>
			) as ResponsiveGridLayout;
			sideForm.setLayout(sideLayout);
			sideForm.addFormContainer(lowContent);

			// Create container with main content and show more button
			// Add margin to align button with form content (form has internal padding/margins)
			const mainContentContainer = (
				<VBox>
					{mainForm}
					<VBox class="sapUiSmallMarginBegin">{showMoreButton}</VBox>
				</VBox>
			);

			// Create DynamicSideContent with Show More pattern like ObjectPage
			// Store groupKey as custom data instead of ID to avoid duplicate ID issues
			const dynamicSideContent = (
				<DynamicSideContent
					showMainContent={true}
					showSideContent={showMore}
					sideContentFallDown="OnMinimumWidth"
					sideContentPosition="End"
					containerQuery={true}
					equalSplit={false}
					mainContent={mainContentContainer}
					sideContent={sideForm}
				/>
			) as DynamicSideContent;

			// Store the groupKey in custom data for later identification
			dynamicSideContent.data("groupKey", groupKey);

			return dynamicSideContent;
		} else {
			// No low priority fields, return simple FormContainer
			return this.createFieldsFormContainer(highMediumFields, contextMetaPath, metaModel);
		}
	}

	/**
	 * Creates a FormContainer with the provided fields, handling both connected and unconnected fields.
	 * @param fields The fields to include in the FormContainer
	 * @param contextMetaPath The metadata path for the context
	 * @param metaModel The OData metamodel
	 * @returns FormContainer with FormElements for all fields
	 */
	createFieldsFormContainer(fields: AddressFieldConfig[], contextMetaPath: string, metaModel: ODataMetaModel): FormContainer {
		const formContainer = <FormContainer />;

		// Use common field processing helper
		const formElements = this.processFieldsIntoFormElements(fields, contextMetaPath, metaModel);
		for (const formElement of formElements) {
			formContainer.addFormElement(formElement);
		}

		return formContainer;
	}

	/**
	 * Gets the country property path from the binding information.
	 * @returns The country property path
	 */
	getCountryProperty(): string {
		return this.getBindingInfo("country").parts[0].path;
	}

	/**
	 * Get the property name for the country field from the binding path.
	 * This extracts just the property name (such as "Country" from "_toAddress/Country").
	 * @returns The property name used for country in the configuration
	 */
	getCountryPropertyName(): string {
		const countryProperty = this.getCountryProperty();
		// Extract the last segment of the path (e.g., "Country" from "_toAddress/Country")
		const segments = countryProperty.split("/");
		return segments[segments.length - 1];
	}

	/**
	 * Resolves the actual property name from the field configuration and mapping.
	 * Prefers the entry property, then the mapping property, and falls back to the entry name.
	 * @param entry The field configuration entry
	 * @param mapping The field mapping from defaultConfiguration
	 * @returns The resolved property name
	 */
	getActualProperty(entry: AddressFieldConfig, mapping: AddressFieldConfig): string {
		return entry.property ?? mapping.property ?? entry.name;
	}

	/**
	 * Process fields and create FormElements, handling connected and unconnected fields.
	 * Connected fields are grouped together in an HBox, unconnected fields are created individually.
	 * @param fields The array of field configurations to process
	 * @param contextMetaPath The metadata path for the context
	 * @param metaModel The OData metamodel
	 * @returns Array of FormElements
	 */
	private processFieldsIntoFormElements(fields: AddressFieldConfig[], contextMetaPath: string, metaModel: ODataMetaModel): FormElement[] {
		const formElements: FormElement[] = [];
		let i = 0;

		while (i < fields.length) {
			const entry = fields[i];
			const mapping = this._mapping![entry.name];

			if (!mapping?.property) {
				i++;
				continue;
			}

			const connection = entry.connection ?? mapping.connection;

			if (connection) {
				// Find all consecutive fields with the same connection
				const connectedGroup = [entry];
				let j = i + 1;
				while (j < fields.length) {
					const nextEntry = fields[j];
					const nextMapping = this._mapping![nextEntry.name];

					if (!nextMapping?.property) {
						j++;
						continue;
					}

					const nextConnection = nextEntry.connection ?? nextMapping.connection;

					if (nextConnection === connection) {
						connectedGroup.push(nextEntry);
						j++;
					} else {
						break;
					}
				}

				if (connectedGroup.length === 1) {
					// Single field, treat as unconnected
					formElements.push(this.createSingleFieldElement(entry, mapping, contextMetaPath, metaModel));
				} else {
					// Multiple consecutive fields with same connection
					formElements.push(this.createConnectedFieldsElement(connectedGroup, contextMetaPath, metaModel));
				}

				i = j;
			} else {
				// Unconnected field
				formElements.push(this.createSingleFieldElement(entry, mapping, contextMetaPath, metaModel));
				i++;
			}
		}

		return formElements;
	}

	/**
	 * Create a FormElement for a single unconnected field.
	 * @param entry The field configuration
	 * @param mapping The field mapping
	 * @param contextMetaPath The metadata path for the context
	 * @param _metaModel The OData metamodel
	 * @returns FormElement containing the field
	 */
	private createSingleFieldElement(
		entry: AddressFieldConfig,
		mapping: AddressFieldConfig,
		contextMetaPath: string,
		_metaModel: ODataMetaModel
	): FormElement {
		const changeEvent = this.valueChanged.bind(this);
		const actualProperty = this.getActualProperty(entry, mapping);
		const fieldLabel = this.getFieldLabel(contextMetaPath, actualProperty);
		const field = (
			<Field
				contextPath={contextMetaPath}
				metaPath={actualProperty}
				readOnly={false}
				required={entry.required}
				change={changeEvent as EventHandler}
			/>
		);
		const formElement = <FormElement label={fieldLabel} />;
		formElement.addField(field);
		return formElement;
	}

	/**
	 * Get the label for a field property from metadata annotations.
	 * For connected fields, labels are concatenated using the configurable labelSeparator.
	 * @param contextMetaPath The metadata path for the context
	 * @param propertyPath The property path
	 * @returns The label string or the property name as fallback
	 */
	private getFieldLabel(contextMetaPath: string, propertyPath: string): string {
		const metaModel = this.getModel()?.getMetaModel() as ODataMetaModel;
		if (!metaModel) {
			return propertyPath;
		}

		// Get property metadata
		const propertyMetaPath = `${contextMetaPath}/${propertyPath}`;
		const propertyAnnotations = metaModel.getObject(`${propertyMetaPath}@`);

		// Try to get Common.Label annotation
		const label = propertyAnnotations?.["@com.sap.vocabularies.Common.v1.Label"];

		return label ?? propertyPath;
	}

	/**
	 * Create a FormElement for multiple connected fields with proper GridData for width control.
	 * @param connectedGroup Array of field configurations that are connected
	 * @param contextMetaPath The metadata path for the context
	 * @param _metaModel The OData metamodel
	 * @returns FormElement containing all connected fields with GridData
	 */
	private createConnectedFieldsElement(
		connectedGroup: AddressFieldConfig[],
		contextMetaPath: string,
		_metaModel: ODataMetaModel
	): FormElement {
		const labels: string[] = [];
		const connectedFields: Field[] = [];

		for (let i = 0; i < connectedGroup.length; i++) {
			const connectedEntry = connectedGroup[i];
			const connectedMapping = this._mapping![connectedEntry.name];
			if (connectedMapping?.property) {
				const changeEvent = this.valueChanged.bind(this);
				const actualProperty = this.getActualProperty(connectedEntry, connectedMapping);
				const fieldLabel = this.getFieldLabel(contextMetaPath, actualProperty);
				labels.push(fieldLabel);

				const connectedField = (
					<Field
						contextPath={contextMetaPath}
						metaPath={actualProperty}
						readOnly={false}
						required={connectedEntry.required}
						change={changeEvent as EventHandler}
					/>
				);

				// Apply GridData for connected fields to distribute evenly across the 12-column grid
				if (connectedGroup.length > 1) {
					const xlSpan = 12 / connectedGroup.length; // Equal distribution on XL/L
					const mSpan = connectedGroup.length === 4 ? 6 : xlSpan; // 4 fields wrap to 2x2 on medium screens
					const gridData = <GridData span={`XL${xlSpan} L${xlSpan} M${mSpan} S12`} />;
					connectedField.setLayoutData(gridData);
				}

				connectedFields.push(connectedField);
			}
		}

		// Create concatenated label using configurable separator
		const separator = this.labelSeparator ?? " • ";
		const concatenatedLabel = labels.join(separator);

		const formElement = <FormElement label={concatenatedLabel} />;
		for (const connectedField of connectedFields) {
			formElement.addField(connectedField);
		}
		return formElement;
	}

	/**
	 * Handles field value changes in the edit dialog.
	 * Sets value state to Error if a required field is empty, otherwise clears the error state.
	 * Triggers validation of all required fields.
	 * @param event The field change event
	 */
	valueChanged(event: UI5Event<{ value: string }>): void {
		// set the value state if a required field is empty
		const fieldAPI: Field = event.getSource();
		if (fieldAPI.required === true) {
			const field = (fieldAPI.getContent() as FieldWrapper)?.contentEdit[0] as MDCField;
			if (event.getParameter("value") === "") {
				field.setValueState("Error");
				field.setValueStateText("Required field");
			} else {
				field.setValueState("None");
				field.setValueStateText("");
			}
		}
		this.validateRequiredFields();
	}

	/**
	 * Handles country field changes in the edit dialog.
	 * Validates the country value and updates the dialog content with country-specific field configuration.
	 * Clears show more states and triggers validation of all required fields.
	 * @param event The country change event
	 */
	countryChanged(event: UI5Event<{ value: string }>): void {
		const newCountry = event.getParameter("value");
		const fieldAPI = event.getSource();
		const field = ((fieldAPI as Field).getContent() as FieldWrapper)?.contentEdit[0] as MDCField;
		if (!newCountry) {
			field.setValueState("Error");
			field.setValueStateText("Country required");
			return;
		} else if (this.getConfig(newCountry) === undefined) {
			field.setValueState("Error");
			field.setValueStateText("Invalid country");
			return;
		} else {
			field.setValueState("None");
			field.setValueStateText("");
		}

		// Properly destroy existing content before creating new content
		const existingContent = this._editDialog!.getContent();
		this._editDialog!.removeAllContent();
		for (const content of existingContent) {
			content.destroy();
		}

		// Clear the show more states when country changes to reset all toggles
		this._showMoreStates.clear();

		this._editDialog!.addContent(this.getEditContent(newCountry));
		this.validateRequiredFields();
	}

	/**
	 * Validates all required fields in the edit dialog and enables and disables the submit button accordingly.
	 * Traverses the dialog content structure to check if all required fields have values.
	 */
	validateRequiredFields(): void {
		setTimeout(() => {
			const editDialogContent = this._editDialog?.getContent()[0];
			let allRequiredFieldsProvided = true;

			if (editDialogContent instanceof VBox) {
				const items = editDialogContent.getItems();

				// Check if this is the grouped structure with IconTabBar
				let contentContainer: VBox | undefined;

				for (const item of items) {
					if (item instanceof IconTabBar) {
						// Skip the IconTabBar itself
						continue;
					}
					if (item instanceof VBox) {
						// This is the content container with all sections
						contentContainer = item;
						break;
					}
				}

				if (contentContainer) {
					// Validate all sections in the content container
					const sections = contentContainer.getItems();
					for (const section of sections) {
						if (!this.validateFieldsInControl(section)) {
							allRequiredFieldsProvided = false;
						}
					}
				}

				// Simple VBox structure (no tabs)
				if (!contentContainer && !this.validateFieldsInControl(editDialogContent)) {
					allRequiredFieldsProvided = false;
				}
			}

			if (allRequiredFieldsProvided) {
				this._editDialog?.getBeginButton()?.setEnabled(true);
			} else {
				this._editDialog?.getBeginButton()?.setEnabled(false);
			}
		}, 200);
	}

	/**
	 * Recursively validates all Field controls within a control hierarchy.
	 * Handles various control types including Form, FormContainer, FormElement, VBox, HBox, and DynamicSideContent.
	 * @param control The control to validate
	 * @returns True if all required fields are valid, false otherwise
	 */
	validateFieldsInControl(control: Control | Element): boolean {
		let allValid = true;

		if (control instanceof Field) {
			if (!this.isFieldValid(control)) {
				allValid = false;
			}
		} else if (control instanceof FieldWrapper) {
			// Handle FieldWrapper - it might contain HBox with connected fields
			const content = control.contentEdit;
			for (const item of content) {
				if (!this.validateFieldsInControl(item as Control)) {
					allValid = false;
				}
			}
		} else if (control instanceof HBox) {
			// Handle connected fields in HBox
			const hboxItems = control.getItems();
			for (const hboxItem of hboxItems) {
				if (hboxItem instanceof Field && !this.isFieldValid(hboxItem)) {
					allValid = false;
				}
			}
		} else if (control instanceof VBox) {
			// Recursively check VBox items
			const items = control.getItems();
			for (const item of items) {
				if (!this.validateFieldsInControl(item)) {
					allValid = false;
				}
			}
		} else if (control instanceof Form) {
			// Handle Form - get its FormContainers
			const formContainers = control.getFormContainers();
			for (const formContainer of formContainers) {
				if (!this.validateFieldsInControl(formContainer)) {
					allValid = false;
				}
			}
		} else if (control instanceof FormContainer) {
			// Handle FormContainer - get its FormElements
			const formElements = control.getFormElements();
			for (const formElement of formElements) {
				if (!this.validateFieldsInControl(formElement)) {
					allValid = false;
				}
			}
		} else if (control instanceof FormElement) {
			// Handle FormElement - get its fields
			const fields = control.getFields();
			for (const field of fields) {
				if (!this.validateFieldsInControl(field as Control | Element)) {
					allValid = false;
				}
			}
		} else if (control instanceof DynamicSideContent) {
			// Check both main and side content
			const mainContent = control.getMainContent();
			for (const item of mainContent) {
				if (!this.validateFieldsInControl(item)) {
					allValid = false;
				}
			}
			const sideContent = control.getSideContent();
			for (const item of sideContent) {
				if (!this.validateFieldsInControl(item)) {
					allValid = false;
				}
			}
		}

		return allValid;
	}

	/**
	 * Check if a Field control has a valid value (not empty when required).
	 * @param fieldControl The Field control to validate
	 * @returns True if the field is valid (has value or not required), false otherwise
	 */
	private isFieldValid(fieldControl: Field): boolean {
		const field = (fieldControl.getContent() as FieldWrapper)?.contentEdit[0] as MDCField;
		return !(field?.getValue() === "" && fieldControl.required === true);
	}

	/**
	 * Creates the content to display when no address exists yet.
	 * Shows a link to create a new address if the control is not read-only.
	 * @returns VBox control with create address link
	 */
	getCreateContent(): Control {
		this._displayContent = (
			<VBox>
				{this.readOnly !== true && <Link text="Create address" visible={UI.IsEditable} press={this.changeAddress.bind(this)} />}
			</VBox>
		) as VBox;
		return this._displayContent;
	}

	/**
	 * Creates the display content showing the formatted address in read-only mode.
	 * Only displays High priority fields with proper formatting based on singleLine property.
	 * Connected fields are grouped together, and separators are added between different groups.
	 * @returns VBox control with formatted address text and edit link
	 */
	getDisplayContent(): VBox {
		if (!this._mapping) {
			this._mapping = this.createMapping();
		}

		if (this._displayContent) {
			this._displayContent.destroy();
		}

		const countryConfig = this.getConfig();
		let textAreaBinding = "";
		let currentConnection = "";
		let connectionProperties: string[] | undefined;

		for (const entry of countryConfig) {
			const mapping = this._mapping[entry.name];
			if (mapping?.property) {
				// Only show fields with priority "High" in display content
				const priority = entry.priority ?? mapping.priority;
				if (priority !== "High") {
					continue;
				}

				// AddressConfig connection takes precedence over mapping connection
				const connection = entry.connection ?? mapping.connection ?? "";
				const actualProperty = this.getActualProperty(entry, mapping);

				// Add separator or line break when switching to a new connection group
				if (connectionProperties && (currentConnection === "" || currentConnection !== connection)) {
					if (this.singleLine === true) {
						// In single line mode, add separator between different groups (not between connected fields)
						const separator = this.singleLineSeparator ?? ",";
						textAreaBinding += `{= (\${${connectionProperties[0]}} === '' ? '' : '${separator} ') }`;
					} else {
						// In multi-line mode, add a line break only if there is a value for the property
						textAreaBinding += `{= (\${${connectionProperties[0]}} === '' ? '' : '\n') }`;
					}
				} else if (connectionProperties) {
					// Add space between fields in the same connection group
					textAreaBinding += " ";
				}

				textAreaBinding += `{${actualProperty}}`;
				if (currentConnection === connection && connectionProperties) {
					connectionProperties.push(actualProperty);
				} else {
					connectionProperties = [actualProperty];
				}
				currentConnection = connection;
			}
		}

		this._displayContent = (
			<VBox>
				{this.singleLine === true ? (
					<Text text={textAreaBinding} wrapping={false} renderWhitespace={false} />
				) : (
					<Text text={textAreaBinding} />
				)}
				{this.readOnly !== true && (
					<Link
						text={this.getTranslatedText("C_ADDRESS_CHANGE_BTN")}
						visible={UI.IsEditable}
						press={this.changeAddress.bind(this)}
					/>
				)}
			</VBox>
		) as VBox;
		return this._displayContent;
	}

	/**
	 * Extract a property value from an address mapping object, handling both typed and untyped objects.
	 * @param obj The address mapping object
	 * @param propName The property name to extract
	 * @returns The property value
	 */
	private getConfigProperty<T>(obj: AddressConfiguration | Record<string, unknown>, propName: keyof AddressConfiguration): T {
		return ((obj as AddressConfiguration)[propName] ?? (obj as Record<string, unknown>)[propName]) as T;
	}

	/**
	 * Creates a mapping object from the default configuration for quick field lookup.
	 * Maps field names to their configurations including property, connection, group, and priority.
	 * @returns Record mapping field names to their configurations
	 */
	createMapping(): Record<string, AddressFieldConfig> {
		if (this.defaultConfiguration) {
			const mapping: Record<string, AddressFieldConfig> = {};
			for (const addressMapping of this.defaultConfiguration) {
				const name = this.getConfigProperty<string>(addressMapping, "name");
				const propertyValue = this.getConfigProperty<string | undefined>(addressMapping, "property");
				const connection = this.getConfigProperty<string | undefined>(addressMapping, "connection");
				const group = this.getConfigProperty<string | undefined>(addressMapping, "group");
				const priority = this.getConfigProperty<string | undefined>(addressMapping, "priority");

				mapping[name] = {
					name: name,
					property: propertyValue ?? name,
					connection: connection,
					group: group,
					priority: priority
				};
			}
			return mapping;
		}
		return {};
	}

	/**
	 * Creates the appropriate content based on whether a country is set.
	 * Returns create content if no country is set, otherwise returns display content.
	 * @returns The content control
	 */
	createContent(): Control {
		if (!this.country) {
			return this.getCreateContent();
		} else {
			return this.getDisplayContent();
		}
	}

	/**
	 * Toggles the Show More and Show Less state for a specific group.
	 * Updates the internal state and finds the corresponding DynamicSideContent to toggle side content visibility.
	 * @param groupKey The group key to toggle
	 */
	toggleShowMore(groupKey: string): void {
		const currentState = this._showMoreStates.get(groupKey) ?? false;
		const newState = !currentState;
		this._showMoreStates.set(groupKey, newState);

		// Find the DynamicSideContent control and toggle its side content visibility
		const dialogContent = this._editDialog?.getContent()[0];
		if (dialogContent) {
			this.findAndToggleDynamicSideContent(dialogContent, groupKey, newState);
		}
	}

	/**
	 * Find and toggle the DynamicSideContent control with matching groupKey in the dialog.
	 * Traverses the control tree (IconTabBar → Form → content) to locate DynamicSideContent controls.
	 * @param control The control to start the search from
	 * @param groupKey The group key to match against DynamicSideContent's custom data
	 * @param showSideContent Whether to show or hide the side content
	 * @returns True if the DynamicSideContent was found and toggled, false otherwise
	 */
	findAndToggleDynamicSideContent(control: Control, groupKey: string, showSideContent: boolean): boolean {
		// Check if this control is the DynamicSideContent we're looking for
		if (control instanceof DynamicSideContent && control.data("groupKey") === groupKey) {
			control.setShowSideContent(showSideContent, false);

			// Update the button text
			const mainContentArray = control.getMainContent();
			if (mainContentArray && mainContentArray.length > 0) {
				const mainContent = mainContentArray[0];
				if (mainContent && typeof (mainContent as VBox).getItems === "function") {
					const items = (mainContent as VBox).getItems();
					for (const item of items) {
						if (item instanceof Button) {
							item.setText(
								showSideContent
									? this.getTranslatedText("C_ADDRESS_SHOW_LESS")
									: this.getTranslatedText("C_ADDRESS_SHOW_MORE")
							);
							break;
						}
					}
				}
			}
			return true;
		}

		// Recursively search in child controls (IconTabBar items, Form content, VBox items, etc.)
		const controlWithMethods = control as Control & {
			getItems?(): Control[];
			getContent?(): Control | Control[];
		};

		if (controlWithMethods.getItems) {
			const items = controlWithMethods.getItems();
			for (const item of items) {
				if (this.findAndToggleDynamicSideContent(item, groupKey, showSideContent)) {
					return true;
				}
			}
		}

		if (controlWithMethods.getContent) {
			const content = controlWithMethods.getContent();
			if (Array.isArray(content)) {
				for (const item of content) {
					if (this.findAndToggleDynamicSideContent(item, groupKey, showSideContent)) {
						return true;
					}
				}
			} else if (content) {
				return this.findAndToggleDynamicSideContent(content, groupKey, showSideContent);
			}
		}

		return false;
	}
}
