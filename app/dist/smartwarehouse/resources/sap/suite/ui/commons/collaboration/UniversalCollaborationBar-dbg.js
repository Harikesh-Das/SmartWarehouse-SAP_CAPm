/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "sap/base/Log",
    "sap/ui/Device",
    "sap/ui/core/Lib",
	"sap/m/Menu",
	"sap/m/MenuItem",
    "sap/ui/performance/trace/FESRHelper"
], function (Log, Device, Library, Menu, MenuItem, FESRHelper) {
    "use strict";

    const COLLABORATION_MAIL = "COLLABORATION_POPOVER_MAIL";
    const COLLABORATION_SHARE = "COLLABORATION_MSTEAMS_SHARE";
    const COLLABORATION_CHAT = "COLLABORATION_POPOVER_CHAT";
    const COLLABORATION_TAB = "COLLABORATION_POPOVER_TAB";
    const COLLABORATION_MANAGER = "COLLABORATION_POPOVER_MANAGER";
    const COLLABORATION_COPYURL = "COLLABORATION_POPOVER_COPYURL_BUTTON";

    var UniversalCollaborationBar = Menu.extend("sap.suite.ui.commons.collaboration.UniversalCollaborationBar", {
        metadata: {
            properties: {
                shareToEmailEnabled: { type: "boolean", defaultValue: true },
                shareAsChatEnabled: { type: "boolean", defaultValue: false },
                shareAsTabEnabled: { type: "boolean", defaultValue: false },
                shareToCollaborationManagerEnabled: { type: "boolean", defaultValue: false },
                copyLinkEnabled: { type: "boolean", defaultValue: true }
            },
            events: {
                "shareToChatSelected": {},
                "shareToTabSelected": {},
                "copyLinkSelected": {},
                "shareToEmailSelected": {},
                "shareToCollaborationManagerSelected": {}
            }
        },

        init: function() {
            sap.m.Menu.prototype.init.apply(this, arguments);
            this._mActionHandlers = {
                [COLLABORATION_MAIL]: (...args) => {
	                if (this.hasListeners("shareToEmailSelected")) {
	                    this.fireShareToEmailSelected({ args });
	                } else {
	                    this._shareToEmail(...args);
	                }
	            },
                [COLLABORATION_CHAT]: () => this.fireShareToChatSelected(),
                [COLLABORATION_TAB]: () => this.fireShareToTabSelected(),
                [COLLABORATION_MANAGER]: () => this.fireShareToCollaborationManagerSelected(),
                [COLLABORATION_COPYURL]: (...args) => {
	                if (this.hasListeners("copyLinkSelected")) {
	                    this.fireCopyLinkSelected({ args });
	                } else {
	                    this._toCopyUrl(...args);
	                }
	            }
            };

            this._oLogger = Log.getLogger("sap.suite.ui.commons.collaboration.UniversalCollaborationBar");
            this._oResourceBundle = Library.getResourceBundleFor("sap.suite.ui.commons");
            this.addStyleClass("sapSuiteCollaborationBarMenu");
        },

        /**
         * Opens the menu.
         * @returns {sap.m.Menu} The menu instance.
         */
        openBy: function() {
            if (!this.getItems().length) {
                this._renderMenuItems();
            }
            return sap.m.Menu.prototype.openBy.apply(this, arguments);
        },

        /**
         * Renders the menu items for the collaboration popover.
         * @private
         */
        _renderMenuItems: async function() {
            const aMenuItemOptions = await this._getCollaborationPopoverOptions();
            const aMenuItems = this._getMenuItems(aMenuItemOptions);
            aMenuItems.forEach((oItem) => this.addItem(oItem));
        },

        /**
         * Gets the TeamsHelperService instance.
         * @returns {Promise} A promise that resolves with the TeamsHelperService instance.
         * @private
         */
        _getTeamsHelperService: async function() {
            if (!this._oTeamsHelperService) {
                const ServiceContainer = sap.ui.require("sap/suite/ui/commons/collaboration/ServiceContainer");
                this._oTeamsHelperService = await ServiceContainer.getServiceAsync();
            }
            return this._oTeamsHelperService;
        },

        /**
         * Gets the menu items based on the provided options.
         * @param {Array} aOptions - The array of option objects.
         * @returns {Array} The array of created menu items.
         * @private
         */
        _getMenuItems: function (aOptions) {
            const aMenuItems = [];
            aOptions.forEach((oOption) => {
                const oMenuItem = this._createMenuItem(oOption.icon, oOption.text, oOption.key, oOption.fesrStepName, oOption.styleClass);
                (oOption.subOptions || []).forEach((oSubOption) => {
                    const subMenuItem = this._createMenuItem(oSubOption.icon, oSubOption.text, oSubOption.key, oSubOption.fesrStepName, oSubOption.styleClass);
                    oMenuItem.addItem(subMenuItem);
                });
                aMenuItems.push(oMenuItem);
            });
            return aMenuItems;
        },

        /**
         * Creates a menu item based on the provided parameters.
         *
         * @param {string} sIcon - The icon for the menu item.
         * @param {string} sText - The text for the menu item.
         * @param {string} sKey - The key for the menu item.
         * @param {string} [sFesrStepName] - The FESR step name for the menu item (optional).
         * @param {string} [sStyleClass] - Additional style class for the menu item (optional).
         * @returns {sap.m.MenuItem} The created sap.m.MenuItem object.
         * @private
         */
        _createMenuItem: function(sIcon, sText, sKey, sFesrStepName, sStyleClass) {
            const oConfig = {
                icon: sIcon,
                text: sText,
                key: sKey
            };
            const oMenuItem = new MenuItem(oConfig);

            oMenuItem.attachPress(() => {
                const fnHandler = this._mActionHandlers[sKey];
                if (fnHandler) {
                    fnHandler();
                }
            });

            if (sFesrStepName) {
                FESRHelper.setSemanticStepname(oMenuItem, "press", sFesrStepName);
            }

            oMenuItem.addEventDelegate({
                onAfterRendering: () => {
                    const oDomRef = oMenuItem.getDomRef();
                    if (oDomRef && sStyleClass) {
                        oDomRef.classList.add(sStyleClass);
                    }
                }
            });

            return oMenuItem;
        },

        /**
         * Creates a standardized option object for the collaboration popover menu.
         *
         * @param {string} i18nKey - The i18n key used to fetch the localized text and as the option key.
         * @param {string} iconUri - The SAP icon URI for the option (e.g., "sap-icon://email").
         * @param {string} cssClass - CSS class applied to the option for styling.
         * @param {Object} [options] - Additional optional properties.
         * @param {string} [options.fesrStepName] - The FESR step name for tracking user interactions.
         * @param {Array} [options.subOptions] - Array of sub-options for nested menu items.
         *
         * @returns {Object} The constructed option object to be used in the collaboration popover menu.
         *
         * @private
         */
        _createOption: function(i18nKey, iconUri, cssClass, { fesrStepName = "", subOptions = [] } = {}) {
            const oOption = {
                text: this._oResourceBundle.getText(i18nKey),
                icon: iconUri,
                key: i18nKey,
                styleClass: cssClass
            };

            if (fesrStepName) {
                oOption.fesrStepName = fesrStepName;
            }

            if (subOptions.length > 0) {
                oOption.subOptions = subOptions;
            }

            return oOption;
        },

        /**
         * Build collaboration popover options based on consumer settings,
         * tenant configuration and current device type.
         *
         * @returns {Array} Array of option objects used to render the collaboration popover menu.
         * @private
         */
        _getCollaborationPopoverOptions: async function() {
            const oAppCollaborationParams = {
                isShareAsChatEnabled: this.getShareAsChatEnabled(),
                isShareAsTabEnabled: this.getShareAsTabEnabled(),
                isCopyLinkEnabled: this.getCopyLinkEnabled(),
                isShareToEmailEnabled: this.getShareToEmailEnabled(),
                isShareToCMEnabled: this.getShareToCollaborationManagerEnabled()
            };

            let oProviderConfig = {};
            try {
                const oTeamHelperServ = await this._getTeamsHelperService();
                oProviderConfig = oTeamHelperServ._providerConfig;
            } catch (error) {
                this._oLogger.error("Error fetching TeamsHelperService:", error);
            }

            const aOptions = [];
            let aMSTeamsOptions = [];

            // configuration array
            const aConfig = [
                {
                    key: COLLABORATION_MAIL,
                    icon: "sap-icon://email",
                    styleClass: "sapSuiteUiCommonsCollaborationMail",
                    consumerEnabled: oAppCollaborationParams.isShareToEmailEnabled,
                    providerEnabled: true,
                    fesrStep: "UCB:SendEmail",
                    featureName: "Email",
                    group: "menu"
                },
                {
                    key: COLLABORATION_CHAT,
                    icon: "sap-icon://discussion",
                    styleClass: "sapSuiteUiCommonsCollaborationChat",
                    consumerEnabled: oAppCollaborationParams.isShareAsChatEnabled,
                    providerEnabled: oProviderConfig.isShareAsLinkEnabled === "X",
                    fesrStep: "UCB:CopyLink",
                    featureName: "Share as Chat",
                    desktopOnly: true,
                    group: "subMenu"
                },
                {
                    key: COLLABORATION_TAB,
                    icon: "sap-icon://image-viewer",
                    styleClass: "sapSuiteUiCommonsCollaborationTab",
                    consumerEnabled: oAppCollaborationParams.isShareAsTabEnabled,
                    providerEnabled: oProviderConfig.isShareAsTabEnabled === "X",
                    fesrStep: "MST:ShareAsTab",
                    featureName: "Share as Tab",
                    desktopOnly: true,
                    group: "subMenu"
                },
                {
                    key: COLLABORATION_SHARE,
                    icon: "sap-icon://citizen-connect",
                    styleClass: "sapSuiteUiCommonsCollaborationMSTeamsShare",
                    consumerEnabled: true,
                    providerEnabled: true,
                    isParentOfGroup: "subMenu",
                    group: "menu"
                },
                {
                    key: COLLABORATION_MANAGER,
                    icon: "sap-icon://collaborate",
                    styleClass: "sapSuiteUiCommonsCollaborationManager",
                    consumerEnabled: oAppCollaborationParams.isShareToCMEnabled,
                    providerEnabled: true,
                    fesrStep: "",
                    featureName: "Collaboration Manager",
                    group: "menu"
                },
                {
                    key: COLLABORATION_COPYURL,
                    icon: "sap-icon://chain-link",
                    styleClass: "sapSuiteUiCommonsCollaborationLink",
                    consumerEnabled: oAppCollaborationParams.isCopyLinkEnabled,
                    providerEnabled: true,
                    fesrStep: "",
                    featureName: "Copy link",
                    desktopOnly: true,
                    group: "menu"
                }
            ];

            aConfig.forEach((conf) => {
                if (conf.group === "subMenu") {
                    const option = this._createOptionIfEnabled(conf);
                    if (option) {
                        aMSTeamsOptions.push(option);
                    }
                    return;
                }

                if (conf.isParentOfGroup === "subMenu") {
                    if (aMSTeamsOptions.length > 0) {
                        conf.subOptions = aMSTeamsOptions;
                        aMSTeamsOptions = [];
                    }
                }

                const option = this._createOptionIfEnabled(conf);
                if (option) {
                    aOptions.push(option);
                }
            });

            return aOptions;
        },

        /**
         * Create an option if it is enabled based on the configuration.
         * @param {Object} conf - The configuration object for the option.
         * @returns {Object|null} The created option or null if not enabled.
         * @private
        */
        _createOptionIfEnabled: function(conf) {
            if (conf.desktopOnly && !Device.system.desktop) {
                this._oLogger.info(`${conf.featureName} option is not supported in Phone and Tablet`);
                return null;
            }

            if (!conf.consumerEnabled) {
                this._oLogger.info(`Consumer disabled ${conf.featureName} option`);
                return null;
            }

            if (!conf.providerEnabled) {
                this._oLogger.info(`${conf.featureName} option is not enabled in the tenant`);
                return null;
            }

            return this._createOption(
                conf.key,
                conf.icon,
                conf.styleClass,
                { fesrStepName: conf.fesrStep, subOptions: conf.subOptions }
            );
        },

        /**
         * Share content via email.
         * @private
         */
        _shareToEmail: async function() {
            const oTeamsHelperService = await this._getTeamsHelperService();
            oTeamsHelperService._shareToEmail();
        },


        /**
         * Copy the current URL to the clipboard.
         * @private
         */
        _toCopyUrl: async function() {
            const oTeamsHelperService = await this._getTeamsHelperService();
            oTeamsHelperService._copyLink();
        }
    });

    return UniversalCollaborationBar;
});
