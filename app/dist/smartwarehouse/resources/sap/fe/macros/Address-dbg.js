/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/helpers/BindingHelper", "sap/fe/macros/Field", "sap/fe/macros/controls/FieldWrapper", "sap/m/Button", "sap/m/Dialog", "sap/m/HBox", "sap/m/IconTabBar", "sap/m/IconTabFilter", "sap/m/Link", "sap/m/Text", "sap/m/VBox", "sap/ui/core/Title", "sap/ui/layout/DynamicSideContent", "sap/ui/layout/GridData", "sap/ui/layout/form/Form", "sap/ui/layout/form/FormContainer", "sap/ui/layout/form/FormElement", "sap/ui/layout/form/ResponsiveGridLayout", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (Log, ClassSupport, BuildingBlock, BindingHelper, Field, FieldWrapper, Button, Dialog, HBox, IconTabBar, IconTabFilter, Link, Text, VBox, Title, DynamicSideContent, GridData, Form, FormContainer, FormElement, ResponsiveGridLayout, _jsx, _jsxs) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8;
  var _exports = {};
  var UI = BindingHelper.UI;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  const ADDRESS_CHANGE_GROUP_ID = "addressChange";
  let AddressBlock = (_dec = defineUI5Class("sap.fe.macros.Address"), _dec2 = property({
    type: "string",
    required: true
  }), _dec3 = property({
    type: "boolean"
  }), _dec4 = property({
    type: "boolean"
  }), _dec5 = property({
    type: "string",
    defaultValue: ","
  }), _dec6 = property({
    type: "string",
    defaultValue: " • "
  }), _dec7 = property({
    type: "object"
  }), _dec8 = property({
    type: "object"
  }), _dec9 = property({
    type: "object"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function AddressBlock() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BuildingBlock.call(this, ...args) || this;
      /**
       * The country code for which the address should be displayed and edited. Shall be bound to the country property of the address entity.
       */
      _initializerDefineProperty(_this, "country", _descriptor, _this);
      /**
       * If set to true, the address is displayed in read-only mode and editing is disabled.
       */
      _initializerDefineProperty(_this, "readOnly", _descriptor2, _this);
      /**
       * If set to true, the address will be displayed in a single line format. This is the recommended visualization within a grid table.
       */
      _initializerDefineProperty(_this, "singleLine", _descriptor3, _this);
      /**
       * Separator string used between address fields in single line mode.
       */
      _initializerDefineProperty(_this, "singleLineSeparator", _descriptor4, _this);
      /**
       * Label separator string used between connected fields (for example, between street and house number).
       */
      _initializerDefineProperty(_this, "labelSeparator", _descriptor5, _this);
      /**
       * Default address configuration. This contains also the mapping between address field roles and actual properties.
       * This configuration is used when no country-specific configuration is available.
       */
      _initializerDefineProperty(_this, "defaultConfiguration", _descriptor6, _this);
      /**
       * Country-specific address configurations. The key is the country code, the value is an array of field configurations or a reference to another country.
       */
      _initializerDefineProperty(_this, "countryConfigurations", _descriptor7, _this);
      /**
       * Optional groups for grouping address fields in edit mode.
       */
      _initializerDefineProperty(_this, "groups", _descriptor8, _this);
      _this._showMoreStates = new Map();
      return _this;
    }
    _exports = AddressBlock;
    _inheritsLoose(AddressBlock, _BuildingBlock);
    var _proto = AddressBlock.prototype;
    /**
     * Called when metadata is available. Initializes the content of the building block.
     * @param _ownerComponent The owner component
     */
    _proto.onMetadataAvailable = function onMetadataAvailable(_ownerComponent) {
      _BuildingBlock.prototype.onMetadataAvailable.call(this, _ownerComponent);
      this.content = this.createContent();
    }

    /**
     * Cleans up resources when the control is destroyed.
     * Destroys display content, edit dialog, and clears internal state.
     */;
    _proto.exit = function exit() {
      this._displayContent?.destroy();
      this._editDialog?.destroy();
      this._showMoreStates.clear();
    }

    /**
     * Updates the country code and recreates the content to reflect the new country configuration.
     * @param country The new country code
     */;
    _proto.setCountry = function setCountry(country) {
      this.country = country;
      this.content = this.createContent();
    }

    /**
     * Submits the address changes to the backend and closes the edit dialog.
     * If successful, refreshes the binding context and recreates the display content.
     * If an error occurs, keeps the dialog open and logs the error.
     */;
    _proto.submitAddressChanges = async function submitAddressChanges() {
      const model = this.getModel();
      const context = this.getBindingContext();
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
        Log.error("Error submitting address changes", error);
      }
    }

    /**
     * Cancels the address changes and closes the edit dialog.
     * Resets any pending changes in the address change group and destroys the dialog.
     */;
    _proto.cancelAddressChanges = function cancelAddressChanges() {
      const model = this.getModel();

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
     */;
    _proto.changeAddress = function changeAddress() {
      const context = this.getBindingContext();
      const model = this.getModel();

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
     */;
    _proto.hasGroupedFields = function hasGroupedFields() {
      if (!this.defaultConfiguration) {
        return false;
      }
      return this.defaultConfiguration.some(config => {
        const group = this.getConfigProperty(config, "group");
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
     */;
    _proto.getConfig = function getConfig(newCountry) {
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
          const countryConfig = countryFieldsData.map(fieldData => ({
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
     */;
    _proto.addMissingGroupedProperties = function addMissingGroupedProperties(countryConfig) {
      if (!this.defaultConfiguration) {
        return countryConfig;
      }

      // Create a set of field names that are already in the country config
      const existingFieldNames = new Set(countryConfig.map(field => field.name));

      // Find properties in defaultConfiguration that have a group but are not in country config
      const missingGroupedProperties = [];
      for (const config of this.defaultConfiguration) {
        const name = this.getConfigProperty(config, "name");
        const group = this.getConfigProperty(config, "group");

        // If this property has a group and is not in the country config, add it as Low priority
        if (group && !existingFieldNames.has(name)) {
          const propertyValue = this.getConfigProperty(config, "property");
          const connection = this.getConfigProperty(config, "connection");
          missingGroupedProperties.push({
            name: name,
            property: propertyValue ?? name,
            required: false,
            // Missing properties are not required
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
     */;
    _proto.getDefaultConfig = function getDefaultConfig() {
      if (!this.defaultConfiguration) {
        return [];
      }
      return this.defaultConfiguration.map(config => {
        const name = this.getConfigProperty(config, "name");
        const propertyValue = this.getConfigProperty(config, "property");
        const required = this.getConfigProperty(config, "required");
        const connection = this.getConfigProperty(config, "connection");
        const group = this.getConfigProperty(config, "group");
        const priority = this.getConfigProperty(config, "priority");
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
     */;
    _proto.isCountryReference = function isCountryReference(config) {
      return !Array.isArray(config) && typeof config === "object" && "reference" in config;
    }

    /**
     * Resolve a country reference, following the reference chain and protecting against circular references.
     * @param originalCountry The original country that started the reference chain (for error messages)
     * @param referenceCountry The country to resolve
     * @param visitedCountries Set of already visited countries to detect circular references
     * @returns The resolved field configuration array
     */;
    _proto.resolveCountryReference = function resolveCountryReference(originalCountry, referenceCountry) {
      let visitedCountries = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : new Set();
      // Check for circular reference
      if (visitedCountries.has(referenceCountry)) {
        Log.error(`Circular reference detected in country configurations: ${originalCountry} -> ${Array.from(visitedCountries).join(" -> ")} -> ${referenceCountry}`);
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
        return referencedConfig.map(fieldData => ({
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
     */;
    _proto.getEditContent = function getEditContent(newCountry) {
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
     */;
    _proto.getSimpleEditContent = function getSimpleEditContent(newCountry) {
      const countryProperty = this.getCountryProperty();
      const countryPropertyName = this.getCountryPropertyName();
      const countryConfig = this.getConfig(newCountry);
      const metaModel = this.getModel()?.getMetaModel();
      const path = this.getBindingContext()?.getPath();
      const contextMetaPath = metaModel?.getMetaPath(path);

      // Create Form with ResponsiveGridLayout - labels on top, fields use full width
      const form = _jsx(Form, {
        editable: true
      });
      const layout = _jsx(ResponsiveGridLayout, {
        labelSpanXL: 12,
        labelSpanL: 12,
        labelSpanM: 12,
        labelSpanS: 12,
        adjustLabelSpan: false,
        emptySpanXL: 0,
        emptySpanL: 0,
        emptySpanM: 0,
        emptySpanS: 0,
        columnsXL: 1,
        columnsL: 1,
        columnsM: 1,
        singleContainerFullSize: false
      });
      form.setLayout(layout);
      const formContainer = _jsx(FormContainer, {});
      form.addFormContainer(formContainer);

      // Country should be the first element in edit mode - filter by the actual property name from binding
      const countryConfigEdit = [...countryConfig];
      const countryIndex = countryConfigEdit.findIndex(item => item.name === countryPropertyName);
      if (countryIndex > -1) {
        countryConfigEdit.splice(countryIndex, 1);
      }

      // Add country field
      const countryChangeEvent = this.countryChanged.bind(this);
      const countryLabel = this.getFieldLabel(contextMetaPath, countryProperty);
      const field = _jsx(Field, {
        contextPath: contextMetaPath,
        metaPath: countryProperty,
        readOnly: false,
        required: true,
        change: countryChangeEvent
      });
      const countryElement = _jsx(FormElement, {
        label: countryLabel
      });
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
     */;
    _proto.getGroupedEditContent = function getGroupedEditContent(newCountry) {
      const countryProperty = this.getCountryProperty();
      const countryPropertyName = this.getCountryPropertyName();
      const countryConfig = this.getConfig(newCountry);
      const metaModel = this.getModel()?.getMetaModel();
      const path = this.getBindingContext()?.getPath();
      const contextMetaPath = metaModel?.getMetaPath(path);
      if (!this._mapping) {
        this._mapping = this.createMapping();
      }

      // Remove country from the config as it's handled separately at the top - use actual property name from binding
      const countryConfigEdit = countryConfig.filter(item => item.name !== countryPropertyName);

      // Classify fields into groups
      const {
        groupMap,
        ungroupedFields,
        groupedFields
      } = this.classifyFieldsByGroup(countryConfigEdit);

      // Create IconTabBar
      const iconTabBar = _jsx(IconTabBar, {
        select: this.onTabSelect.bind(this),
        backgroundDesign: "Transparent"
      });

      // Create content container for all sections
      const contentContainer = _jsx(VBox, {
        class: "sapUiNoContentPadding"
      });

      // Create country section
      this.addCountrySection(countryProperty, contextMetaPath, metaModel, contentContainer, iconTabBar);

      // Add "General" section if there are ungrouped fields
      if (ungroupedFields.length > 0) {
        this.addGroupSection("general", this.getTranslatedText("C_ADDRESS_SECTION_GENERAL"), ungroupedFields, contextMetaPath, metaModel, contentContainer, iconTabBar);
      }

      // Add grouped sections
      for (const [groupKey, groupFields] of Array.from(groupedFields.entries())) {
        const groupTitle = groupMap.get(groupKey) || groupKey;
        this.addGroupSection(groupKey, groupTitle, groupFields, contextMetaPath, metaModel, contentContainer, iconTabBar);
      }
      return _jsxs(VBox, {
        children: [iconTabBar, contentContainer]
      });
    }

    /**
     * Classify fields into grouped and ungrouped categories.
     * @param fields The fields to classify
     * @returns Object containing groupMap, ungroupedFields, and groupedFields
     */;
    _proto.classifyFieldsByGroup = function classifyFieldsByGroup(fields) {
      const groupMap = new Map(); // key -> title mapping
      const ungroupedFields = [];
      const groupedFields = new Map();

      // Create group map from groups aggregation
      if (this.groups) {
        for (const group of this.groups) {
          const key = group.key ?? group.key;
          const title = group.title ?? group.title;
          groupMap.set(key, title);
        }
      }

      // Separate fields into grouped and ungrouped based on defaultConfiguration
      for (const entry of fields) {
        const mapping = this._mapping[entry.name];
        if (mapping?.property) {
          const groupKey = entry.group ?? mapping.group;
          if (groupKey && groupMap.has(groupKey)) {
            if (!groupedFields.has(groupKey)) {
              groupedFields.set(groupKey, []);
            }
            groupedFields.get(groupKey).push(entry);
          } else {
            ungroupedFields.push(entry);
          }
        }
      }
      return {
        groupMap,
        ungroupedFields,
        groupedFields
      };
    }

    /**
     * Add a country section to the dialog content.
     * @param countryProperty The country property name
     * @param contextMetaPath The metadata path for the context
     * @param metaModel The OData metamodel
     * @param contentContainer The VBox container to add the section to
     * @param iconTabBar The IconTabBar to add the tab to
     */;
    _proto.addCountrySection = function addCountrySection(countryProperty, contextMetaPath, metaModel, contentContainer, iconTabBar) {
      const countryFormContainer = this.createCountryContent(countryProperty, contextMetaPath, metaModel);
      const countryForm = _jsx(Form, {
        id: "country-section",
        editable: true,
        class: "sapUiNoMarginTop sapUiMediumMarginBottom"
      });
      const countryLayout = _jsx(ResponsiveGridLayout, {
        labelSpanXL: 12,
        labelSpanL: 12,
        labelSpanM: 12,
        labelSpanS: 12,
        adjustLabelSpan: false,
        emptySpanXL: 0,
        emptySpanL: 0,
        emptySpanM: 0,
        emptySpanS: 0,
        columnsXL: 1,
        columnsL: 1,
        columnsM: 1,
        singleContainerFullSize: false
      });
      countryForm.setLayout(countryLayout);
      countryForm.setTitle(_jsx(Title, {
        text: this.getTranslatedText("C_ADDRESS_SECTION_COUNTRY")
      }));
      countryForm.addFormContainer(countryFormContainer);
      contentContainer.addItem(countryForm);
      const countryFilter = _jsx(IconTabFilter, {
        text: this.getTranslatedText("C_ADDRESS_SECTION_COUNTRY")
      }, "country");
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
     */;
    _proto.addGroupSection = function addGroupSection(groupKey, groupTitle, fields, contextMetaPath, metaModel, contentContainer, iconTabBar) {
      const groupContent = this.createGroupEditContent(fields, contextMetaPath, metaModel, groupTitle);
      if (groupContent instanceof FormContainer) {
        // Simple FormContainer - wrap in Form
        const groupForm = _jsx(Form, {
          id: `${groupKey}-section`,
          editable: true,
          class: "sapUiMediumMarginBottom"
        });
        const groupLayout = _jsx(ResponsiveGridLayout, {
          labelSpanXL: 12,
          labelSpanL: 12,
          labelSpanM: 12,
          labelSpanS: 12,
          adjustLabelSpan: false,
          emptySpanXL: 0,
          emptySpanL: 0,
          emptySpanM: 0,
          emptySpanS: 0,
          columnsXL: 1,
          columnsL: 1,
          columnsM: 1,
          singleContainerFullSize: false
        });
        groupForm.setLayout(groupLayout);
        groupForm.setTitle(_jsx(Title, {
          text: groupTitle
        }));
        groupForm.addFormContainer(groupContent);
        contentContainer.addItem(groupForm);
      } else if (groupContent instanceof DynamicSideContent) {
        // DynamicSideContent already contains Forms with title, add directly
        contentContainer.addItem(groupContent);
      }
      const filter = _jsx(IconTabFilter, {
        text: groupTitle
      }, groupKey);
      iconTabBar.addItem(filter);
    }

    /**
     * Creates the FormContainer for the country field with change handler.
     * @param countryProperty The country property path
     * @param contextMetaPath The metadata path for the context
     * @param _metaModel The OData metamodel
     * @returns FormContainer with the country field
     */;
    _proto.createCountryContent = function createCountryContent(countryProperty, contextMetaPath, _metaModel) {
      const countryChangeEvent = this.countryChanged.bind(this);
      const countryLabel = this.getFieldLabel(contextMetaPath, countryProperty);
      const field = _jsx(Field, {
        contextPath: contextMetaPath,
        metaPath: countryProperty,
        readOnly: false,
        required: true,
        change: countryChangeEvent
      });
      const formContainer = _jsx(FormContainer, {});
      const formElement = _jsx(FormElement, {
        label: countryLabel
      });
      formElement.addField(field);
      formContainer.addFormElement(formElement);
      return formContainer;
    }

    /**
     * Handles tab selection in the grouped edit dialog.
     * Scrolls the corresponding section into view when a tab is selected.
     * @param event The tab selection event
     */;
    _proto.onTabSelect = function onTabSelect(event) {
      const selectedFilter = event.getParameter("item");
      if (!selectedFilter) {
        return;
      }

      // Find the section by matching the tab index with the section index
      const dialogContent = this._editDialog?.getContent()[0];
      if (dialogContent instanceof VBox) {
        const vboxItems = dialogContent.getItems();
        let iconTabBar;
        let contentContainer;

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
                  domElement.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                  });
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
     */;
    _proto.createGroupEditContent = function createGroupEditContent(fields, contextMetaPath, metaModel, sectionTitle) {
      // Separate fields by priority
      const highMediumFields = fields.filter(field => {
        const mapping = this._mapping[field.name];
        const priority = field.priority ?? mapping?.priority;
        return priority === "High" || priority === "Medium" || !priority; // Default to High/Medium if no priority
      });
      const lowFields = fields.filter(field => {
        const mapping = this._mapping[field.name];
        const priority = field.priority ?? mapping?.priority;
        return priority === "Low";
      });

      // If there are low priority fields, use DynamicSideContent pattern like ObjectPage
      if (lowFields.length > 0) {
        // Create deterministic key based on field names to maintain state across refreshes
        const fieldNames = fields.map(f => f.name).sort((a, b) => a.localeCompare(b)).join("_");
        const groupKey = `group_${fieldNames}`;
        const showMore = this._showMoreStates.get(groupKey) ?? false;
        const highMediumContent = this.createFieldsFormContainer(highMediumFields, contextMetaPath, metaModel);
        const lowContent = this.createFieldsFormContainer(lowFields, contextMetaPath, metaModel);

        // Create Show More button
        const showMoreButton = _jsx(Button, {
          text: showMore ? this.getTranslatedText("C_ADDRESS_SHOW_LESS") : this.getTranslatedText("C_ADDRESS_SHOW_MORE"),
          type: "Transparent",
          press: () => this.toggleShowMore(groupKey)
        });

        // Create Forms for main and side content
        const mainForm = _jsx(Form, {
          editable: true
        });
        const mainLayout = _jsx(ResponsiveGridLayout, {
          labelSpanXL: 12,
          labelSpanL: 12,
          labelSpanM: 12,
          labelSpanS: 12,
          adjustLabelSpan: false,
          emptySpanXL: 0,
          emptySpanL: 0,
          emptySpanM: 0,
          emptySpanS: 0,
          columnsXL: 1,
          columnsL: 1,
          columnsM: 1,
          singleContainerFullSize: false
        });
        mainForm.setLayout(mainLayout);
        // Add title to main form if provided
        if (sectionTitle) {
          mainForm.setTitle(_jsx(Title, {
            text: sectionTitle
          }));
        }
        mainForm.addFormContainer(highMediumContent);
        const sideForm = _jsx(Form, {
          editable: true
        });
        const sideLayout = _jsx(ResponsiveGridLayout, {
          labelSpanXL: 12,
          labelSpanL: 12,
          labelSpanM: 12,
          labelSpanS: 12,
          adjustLabelSpan: false,
          emptySpanXL: 0,
          emptySpanL: 0,
          emptySpanM: 0,
          emptySpanS: 0,
          columnsXL: 1,
          columnsL: 1,
          columnsM: 1,
          singleContainerFullSize: false
        });
        sideForm.setLayout(sideLayout);
        sideForm.addFormContainer(lowContent);

        // Create container with main content and show more button
        // Add margin to align button with form content (form has internal padding/margins)
        const mainContentContainer = _jsxs(VBox, {
          children: [mainForm, _jsx(VBox, {
            class: "sapUiSmallMarginBegin",
            children: showMoreButton
          })]
        });

        // Create DynamicSideContent with Show More pattern like ObjectPage
        // Store groupKey as custom data instead of ID to avoid duplicate ID issues
        const dynamicSideContent = _jsx(DynamicSideContent, {
          showMainContent: true,
          showSideContent: showMore,
          sideContentFallDown: "OnMinimumWidth",
          sideContentPosition: "End",
          containerQuery: true,
          equalSplit: false,
          mainContent: mainContentContainer,
          sideContent: sideForm
        });

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
     */;
    _proto.createFieldsFormContainer = function createFieldsFormContainer(fields, contextMetaPath, metaModel) {
      const formContainer = _jsx(FormContainer, {});

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
     */;
    _proto.getCountryProperty = function getCountryProperty() {
      return this.getBindingInfo("country").parts[0].path;
    }

    /**
     * Get the property name for the country field from the binding path.
     * This extracts just the property name (such as "Country" from "_toAddress/Country").
     * @returns The property name used for country in the configuration
     */;
    _proto.getCountryPropertyName = function getCountryPropertyName() {
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
     */;
    _proto.getActualProperty = function getActualProperty(entry, mapping) {
      return entry.property ?? mapping.property ?? entry.name;
    }

    /**
     * Process fields and create FormElements, handling connected and unconnected fields.
     * Connected fields are grouped together in an HBox, unconnected fields are created individually.
     * @param fields The array of field configurations to process
     * @param contextMetaPath The metadata path for the context
     * @param metaModel The OData metamodel
     * @returns Array of FormElements
     */;
    _proto.processFieldsIntoFormElements = function processFieldsIntoFormElements(fields, contextMetaPath, metaModel) {
      const formElements = [];
      let i = 0;
      while (i < fields.length) {
        const entry = fields[i];
        const mapping = this._mapping[entry.name];
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
            const nextMapping = this._mapping[nextEntry.name];
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
     */;
    _proto.createSingleFieldElement = function createSingleFieldElement(entry, mapping, contextMetaPath, _metaModel) {
      const changeEvent = this.valueChanged.bind(this);
      const actualProperty = this.getActualProperty(entry, mapping);
      const fieldLabel = this.getFieldLabel(contextMetaPath, actualProperty);
      const field = _jsx(Field, {
        contextPath: contextMetaPath,
        metaPath: actualProperty,
        readOnly: false,
        required: entry.required,
        change: changeEvent
      });
      const formElement = _jsx(FormElement, {
        label: fieldLabel
      });
      formElement.addField(field);
      return formElement;
    }

    /**
     * Get the label for a field property from metadata annotations.
     * For connected fields, labels are concatenated using the configurable labelSeparator.
     * @param contextMetaPath The metadata path for the context
     * @param propertyPath The property path
     * @returns The label string or the property name as fallback
     */;
    _proto.getFieldLabel = function getFieldLabel(contextMetaPath, propertyPath) {
      const metaModel = this.getModel()?.getMetaModel();
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
     */;
    _proto.createConnectedFieldsElement = function createConnectedFieldsElement(connectedGroup, contextMetaPath, _metaModel) {
      const labels = [];
      const connectedFields = [];
      for (let i = 0; i < connectedGroup.length; i++) {
        const connectedEntry = connectedGroup[i];
        const connectedMapping = this._mapping[connectedEntry.name];
        if (connectedMapping?.property) {
          const changeEvent = this.valueChanged.bind(this);
          const actualProperty = this.getActualProperty(connectedEntry, connectedMapping);
          const fieldLabel = this.getFieldLabel(contextMetaPath, actualProperty);
          labels.push(fieldLabel);
          const connectedField = _jsx(Field, {
            contextPath: contextMetaPath,
            metaPath: actualProperty,
            readOnly: false,
            required: connectedEntry.required,
            change: changeEvent
          });

          // Apply GridData for connected fields to distribute evenly across the 12-column grid
          if (connectedGroup.length > 1) {
            const xlSpan = 12 / connectedGroup.length; // Equal distribution on XL/L
            const mSpan = connectedGroup.length === 4 ? 6 : xlSpan; // 4 fields wrap to 2x2 on medium screens
            const gridData = _jsx(GridData, {
              span: `XL${xlSpan} L${xlSpan} M${mSpan} S12`
            });
            connectedField.setLayoutData(gridData);
          }
          connectedFields.push(connectedField);
        }
      }

      // Create concatenated label using configurable separator
      const separator = this.labelSeparator ?? " • ";
      const concatenatedLabel = labels.join(separator);
      const formElement = _jsx(FormElement, {
        label: concatenatedLabel
      });
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
     */;
    _proto.valueChanged = function valueChanged(event) {
      // set the value state if a required field is empty
      const fieldAPI = event.getSource();
      if (fieldAPI.required === true) {
        const field = fieldAPI.getContent()?.contentEdit[0];
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
     */;
    _proto.countryChanged = function countryChanged(event) {
      const newCountry = event.getParameter("value");
      const fieldAPI = event.getSource();
      const field = fieldAPI.getContent()?.contentEdit[0];
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
      const existingContent = this._editDialog.getContent();
      this._editDialog.removeAllContent();
      for (const content of existingContent) {
        content.destroy();
      }

      // Clear the show more states when country changes to reset all toggles
      this._showMoreStates.clear();
      this._editDialog.addContent(this.getEditContent(newCountry));
      this.validateRequiredFields();
    }

    /**
     * Validates all required fields in the edit dialog and enables and disables the submit button accordingly.
     * Traverses the dialog content structure to check if all required fields have values.
     */;
    _proto.validateRequiredFields = function validateRequiredFields() {
      setTimeout(() => {
        const editDialogContent = this._editDialog?.getContent()[0];
        let allRequiredFieldsProvided = true;
        if (editDialogContent instanceof VBox) {
          const items = editDialogContent.getItems();

          // Check if this is the grouped structure with IconTabBar
          let contentContainer;
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
     */;
    _proto.validateFieldsInControl = function validateFieldsInControl(control) {
      let allValid = true;
      if (control instanceof Field) {
        if (!this.isFieldValid(control)) {
          allValid = false;
        }
      } else if (control instanceof FieldWrapper) {
        // Handle FieldWrapper - it might contain HBox with connected fields
        const content = control.contentEdit;
        for (const item of content) {
          if (!this.validateFieldsInControl(item)) {
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
          if (!this.validateFieldsInControl(field)) {
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
     */;
    _proto.isFieldValid = function isFieldValid(fieldControl) {
      const field = fieldControl.getContent()?.contentEdit[0];
      return !(field?.getValue() === "" && fieldControl.required === true);
    }

    /**
     * Creates the content to display when no address exists yet.
     * Shows a link to create a new address if the control is not read-only.
     * @returns VBox control with create address link
     */;
    _proto.getCreateContent = function getCreateContent() {
      this._displayContent = _jsx(VBox, {
        children: this.readOnly !== true && _jsx(Link, {
          text: "Create address",
          visible: UI.IsEditable,
          press: this.changeAddress.bind(this)
        })
      });
      return this._displayContent;
    }

    /**
     * Creates the display content showing the formatted address in read-only mode.
     * Only displays High priority fields with proper formatting based on singleLine property.
     * Connected fields are grouped together, and separators are added between different groups.
     * @returns VBox control with formatted address text and edit link
     */;
    _proto.getDisplayContent = function getDisplayContent() {
      if (!this._mapping) {
        this._mapping = this.createMapping();
      }
      if (this._displayContent) {
        this._displayContent.destroy();
      }
      const countryConfig = this.getConfig();
      let textAreaBinding = "";
      let currentConnection = "";
      let connectionProperties;
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
      this._displayContent = _jsxs(VBox, {
        children: [this.singleLine === true ? _jsx(Text, {
          text: textAreaBinding,
          wrapping: false,
          renderWhitespace: false
        }) : _jsx(Text, {
          text: textAreaBinding
        }), this.readOnly !== true && _jsx(Link, {
          text: this.getTranslatedText("C_ADDRESS_CHANGE_BTN"),
          visible: UI.IsEditable,
          press: this.changeAddress.bind(this)
        })]
      });
      return this._displayContent;
    }

    /**
     * Extract a property value from an address mapping object, handling both typed and untyped objects.
     * @param obj The address mapping object
     * @param propName The property name to extract
     * @returns The property value
     */;
    _proto.getConfigProperty = function getConfigProperty(obj, propName) {
      return obj[propName] ?? obj[propName];
    }

    /**
     * Creates a mapping object from the default configuration for quick field lookup.
     * Maps field names to their configurations including property, connection, group, and priority.
     * @returns Record mapping field names to their configurations
     */;
    _proto.createMapping = function createMapping() {
      if (this.defaultConfiguration) {
        const mapping = {};
        for (const addressMapping of this.defaultConfiguration) {
          const name = this.getConfigProperty(addressMapping, "name");
          const propertyValue = this.getConfigProperty(addressMapping, "property");
          const connection = this.getConfigProperty(addressMapping, "connection");
          const group = this.getConfigProperty(addressMapping, "group");
          const priority = this.getConfigProperty(addressMapping, "priority");
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
     */;
    _proto.createContent = function createContent() {
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
     */;
    _proto.toggleShowMore = function toggleShowMore(groupKey) {
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
     */;
    _proto.findAndToggleDynamicSideContent = function findAndToggleDynamicSideContent(control, groupKey, showSideContent) {
      // Check if this control is the DynamicSideContent we're looking for
      if (control instanceof DynamicSideContent && control.data("groupKey") === groupKey) {
        control.setShowSideContent(showSideContent, false);

        // Update the button text
        const mainContentArray = control.getMainContent();
        if (mainContentArray && mainContentArray.length > 0) {
          const mainContent = mainContentArray[0];
          if (mainContent && typeof mainContent.getItems === "function") {
            const items = mainContent.getItems();
            for (const item of items) {
              if (item instanceof Button) {
                item.setText(showSideContent ? this.getTranslatedText("C_ADDRESS_SHOW_LESS") : this.getTranslatedText("C_ADDRESS_SHOW_MORE"));
                break;
              }
            }
          }
        }
        return true;
      }

      // Recursively search in child controls (IconTabBar items, Form content, VBox items, etc.)
      const controlWithMethods = control;
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
    };
    return AddressBlock;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "country", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "readOnly", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "singleLine", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "singleLineSeparator", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "labelSeparator", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "defaultConfiguration", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "countryConfigurations", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "groups", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = AddressBlock;
  return _exports;
}, false);
//# sourceMappingURL=Address-dbg.js.map
