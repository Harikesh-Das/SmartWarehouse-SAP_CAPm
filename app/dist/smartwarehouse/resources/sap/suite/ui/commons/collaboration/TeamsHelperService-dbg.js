/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "sap/base/Log",
    "sap/ui/core/Core",
    "sap/base/security/URLListValidator",
    "./CollaborationHelper",
    "./BaseHelperService",
    "sap/ui/core/Element",
    "./ContactHelper",
    "sap/ui/Device",
    "./CollaborationCardHelper",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/ui/core/Lib",
    "sap/m/Popover",
    "sap/m/HBox",
    "sap/m/VBox",
    "sap/m/MessageStrip",
    "sap/m/Button",
    "./CollaborationContactInfoHelper",
    "sap/m/library",
    "sap/m/FlexBox",
    "sap/base/i18n/Localization",
    "./CollaborationManagerService",
    "sap/m/FlexItemData"
], function(Log, Core, URLListValidator, CollaborationHelper, BaseHelperService, Element, ContactHelper, Device, CollaborationCardHelper, Fragment, MessageBox, Library, Popover, HBox, VBox, MessageStrip, Button, CollaborationContactInfoHelper, sapMLibrary, FlexBox, Localization, CollaborationManagerService, FlexItemData) {
    "use strict";

    /**
     * Provides the Share options
     * @namespace
     * @since 1.104
     * @alias module:sap/suite/ui/commons/collaboration/TeamsHelperService
     * @private
     * @ui5-restricted
     */
    var TeamsHelperService = BaseHelperService.extend("sap.suite.ui.commons.collaboration.TeamsHelperService", {
        constructor: function(oProviderConfig) {
            this._providerConfig = oProviderConfig;
            this._providerConfig.shareAsLinkUrl = "https://teams.microsoft.com/share";
            this._getShareAsTabUrl().then(function(sShareAsTabUrl) {
                this._providerConfig.shareAsTabUrl = sShareAsTabUrl;
            }.bind(this));
        }
    });

    /**
     * sTeamsAppID is hardcoded as of now, will be changed when app is published at org level.
     */
    const COLLABORATION_MSTEAMS_APPID = 'db5b69c6-0430-4ae1-8d6e-a65c2220b50c';
    const oLogger = Log.getLogger("sap.suite.ui.commons.collaboration.TeamsHelperService");
    const CARD_URL_PREFIX = "https://saps4hana.azure-api.net/bot/redirect?target-url=";
    const oResourceBundle = Library.getResourceBundleFor("sap.suite.ui.commons");
    const PARAM_SAP_CARD_INFO = "info";

    let oBusyDialog;
    let iBusyDialogTimeoutId;
    const AUTO_CLOSE_BUSY_DIALOG_TIME = 60 * 1000; //60 sec
    let oTeamsParams = {};
    const windowWidthAndHeight = "width=720,height=720";
    const validDomains = [
        "*.s4hana.ondemand.com",
        "*.*.s4hana.ondemand.com",
        "*.*.*.s4hana.ondemand.com",
        "*.cloud.sap",
        "*.*.cloud.sap",
        "*.*.*.cloud.sap",
        "*.sapcloud.cn",
        "*.*.sapcloud.cn",
        "*.*.*.sapcloud.cn",
        "*.saps4hanacloud.cn",
        "*.*.saps4hanacloud.cn",
        "*.*.*.saps4hanacloud.cn",
        "*.sap.com"
    ];

    /**
     * Gives list of all Collaboration Options
     * @param {object} oParams Optional argument in case consumer wants to influence the options, otherwise pass as undefined
     * @param {boolean} oParams.isShareAsLinkEnabled Allow Share as Chat option
     * @param {boolean} oParams.isShareAsTabEnabled Allow Share as Tab option
     * @param {boolean} oParams.isShareAsCardEnabled Allow Share as Card option
     * @returns {array} Array of available options
     * @private
     * @ui5-restricted
     */
    TeamsHelperService.prototype.getOptions = function(oParams) {
        oTeamsParams = {
            isShareAsLinkEnabled: (oParams && typeof oParams.isShareAsLinkEnabled !== 'undefined') ? oParams.isShareAsLinkEnabled : true,
            isShareAsTabEnabled: (oParams && typeof oParams.isShareAsTabEnabled !== 'undefined') ? oParams.isShareAsTabEnabled : true,
            isShareAsCardEnabled: (oParams && typeof oParams.isShareAsCardEnabled !== 'undefined') ? oParams.isShareAsCardEnabled : false
        };

        var aOptions = [];
        var aFinalOptions = [];

        if (Device.system.desktop) {
            if (oTeamsParams.isShareAsLinkEnabled) {
                if (this._providerConfig.isShareAsLinkEnabled === "X") {
                    aOptions.push({
                        "text": oResourceBundle.getText("COLLABORATION_MSTEAMS_CHAT"),
                        "key": "COLLABORATION_MSTEAMS_CHAT",
                        "icon": "sap-icon://post",
                        "fesrStepName": "MST:ShareAsLink"
                    });
                } else {
                    oLogger.info("Share as Chat option is not enabled in the tenant");
                }
            } else {
                oLogger.info("Consumer disable Share as Chat option");
            }
        } else {
            oLogger.info("Share as Chat option is not supported in Phone and Tablet");
        }

        if (Device.system.desktop) {
            if (oTeamsParams.isShareAsTabEnabled) {
                if (this._providerConfig.isShareAsTabEnabled === "X") {
                    aOptions.push({
                        "text": oResourceBundle.getText("COLLABORATION_MSTEAMS_TAB"),
                        "key": "COLLABORATION_MSTEAMS_TAB",
                        "icon": "sap-icon://image-viewer",
                        "fesrStepName": "MST:ShareAsTab"
                    });
                } else {
                    oLogger.info("Share as Tab option is not enabled in the tenant");
                }
            } else {
                oLogger.info("Consumer disable Share as Tab option");
            }
        } else {
            oLogger.info("Share as Tab option is not supported in Phone and Tablet");
        }

        if (Device.system.desktop) {
            if (oTeamsParams.isShareAsCardEnabled) {
                const bIsShareAsCardEnabled = this._providerConfig.isShareAsCardEnabled;

                const CARD_OBJECT = {
                    "text": oResourceBundle.getText("COLLABORATION_MSTEAMS_CARD"),
                    "key": "COLLABORATION_MSTEAMS_CARD",
                    "icon": "sap-icon://ui-notifications",
                    "fesrStepName": "MST:ShareAsCard"
                };

                switch (bIsShareAsCardEnabled) {
                    case "DISABLED":
                        oLogger.info("Share as Card option is not enabled in the tenant");
                        break;
                    case "ENABLED":
                    case "AUTHENABLE":
                        aOptions.push(CARD_OBJECT);
                        break;
                    default:
                        oLogger.info("Share as Card option is not enabled in the tenant");
                        break;
                }
            } else {
                oLogger.info("Consumer disable Share as Card option");
            }
        } else {
            oLogger.info("Share as Card option is not supported in Phone and Tablet");
        }

        if (aOptions.length === 1) {
            aFinalOptions = aOptions;
            if (aFinalOptions[0].key === "COLLABORATION_MSTEAMS_CHAT") {
                aFinalOptions[0].text = oResourceBundle.getText("COLLABORATION_MSTEAMS_CHAT_SINGLE");
            } else if (aFinalOptions[0].key === "COLLABORATION_MSTEAMS_TAB") {
                aFinalOptions[0].text = oResourceBundle.getText("COLLABORATION_MSTEAMS_TAB_SINGLE");
            } else if (aFinalOptions[0].key === "COLLABORATION_MSTEAMS_CARD") {
                aFinalOptions[0].text = oResourceBundle.getText("COLLABORATION_MSTEAMS_CARD_SINGLE");
            }
            return aFinalOptions;
        }

        if (aOptions.length > 1) {
            aFinalOptions.push({
                "type": "microsoft",
                "text": oResourceBundle.getText("COLLABORATION_MSTEAMS_SHARE"),
                "icon": "sap-icon://collaborate",
                "subOptions": aOptions
            });
        }

        return aFinalOptions;
    };

    /**
     * Triggers the 'Share' operation
     *
     * @param {Object} oOption Option Object/SubObject which is clicked
     * @param {Object} oParams Parameter object which contain the information to share
     * @param {string} oParams.url Url of the application which needs to be shared
     * @param {string} oParams.appTitle Title of the application which needs to be used while integration
     * @param {string} oParams.subTitle Title of the object page which needs to be used while integration
     * @param {boolean} oParams.minifyUrlForChat Set the flag to 'true' to minimize the URL
     * @param {Object} oParams.cardManifest Adaptive card json for a given instance of the object page used for the ‘Share as Card’ option
     * @param {string} oParams.cardId ID of the card that needs to be stored and is constructed from SemanticObject_Action
     * @returns {void}
     * @private
     * @ui5-restricted
     */
    TeamsHelperService.prototype.share = function(oOption, oParams) {

        if (!oParams.url) {
            oLogger.error("url is not supplied in object so terminating Click");
            return;
        }

        if (!URLListValidator.validate(oParams.url)) {
            oLogger.error("Invalid URL supplied");
            return;
        }

        if (oOption.key === "COLLABORATION_MSTEAMS_CHAT") {
            this._shareAsChat(oParams);
            return;
        }

        if (oOption.key === "COLLABORATION_MSTEAMS_TAB") {
            this._shareAsTab(oParams);
            return;
        }

        if (oOption.key === "COLLABORATION_MSTEAMS_CARD") {
            this._shareAsCard(oParams);
            return;
        }
    };

    /**
     * Helper method which shares the URL as Link
     *
     * @param {Object} oParams Parameter object which contain the information to share
     * @param {string} oParams.url Url of the application which needs to be shared
     * @param {string} oParams.appTitle Title of the application which needs to be used in the chat message
     * @param {string} oParams.subTitle Title of the object page which needs to be used in the chat message
     * @param {boolean} oParams.minifyUrlForChat Experimental flag. Set to true to minify the Url.
     * @returns {void}
     * @private
     * @ui5-restricted
     */
    TeamsHelperService.prototype._shareAsChat = function(oParams) {
        var newWindow = window.open(
            "",
            "_blank",
            windowWidthAndHeight
        );
        var sMessage = oParams.appTitle;
        if (oParams.subTitle.length > 0) {
            sMessage += ": " + oParams.subTitle;
        }

        newWindow.opener = null;
        if (oParams.minifyUrlForChat) {
            CollaborationHelper.compactHash(oParams.url, []).then(async function(sShortURL) {
                var sModifiedUrl = await this._modifyUrlForNavigationContext(oParams.url, sShortURL.url);
                newWindow.location = this._providerConfig.shareAsLinkUrl + "?msgText=" + encodeURIComponent(sMessage) + "&preview=false" + "&href=" + encodeURIComponent(sModifiedUrl);
            }.bind(this));
        } else {
            newWindow.location = this._providerConfig.shareAsLinkUrl + "?msgText=" + encodeURIComponent(sMessage) + "&preview=false" + "&href=" + encodeURIComponent(oParams.url);
        }
    };

    /**
     * Modifies the given application URL to prepare it for sharing as a tab in Microsoft Teams.
     * Adds parameters to enable headerless mode and Teams collaboration context,
     * as well as FESR (Frontend Subrecording) step tracking, and sets the navigation mode to "explace".
     *
     * @param {string} sUrl - The original application URL.
     * @param {string} fesrStepName - The name of the FESR step (used for UI performance tracking).
     * @returns {Promise<string>} - The modified URL suitable for Teams tab usage.
     */
    TeamsHelperService.prototype._modifyUrlForShareAsTab = async function(sUrl, fesrStepName) {
        var sAppUri = sUrl;
        var iIndexOfHash = sAppUri.indexOf('#');
        if (iIndexOfHash !== -1) {
            var sUriForHeaderLess = sAppUri.substring(0, iIndexOfHash);
            var iIndexOfQuestionMark = sUriForHeaderLess.indexOf('?', 0);
            var sParam = 'sap-ushell-config=lean&sap-collaboration-teams=true&sap-ui-fesr-env=' + fesrStepName;
            if (iIndexOfQuestionMark !== -1) {
                sUriForHeaderLess = sUriForHeaderLess.substring(0, iIndexOfQuestionMark + 1) + sParam + '&' + sUriForHeaderLess.substring(iIndexOfQuestionMark + 1);
            } else {
                sUriForHeaderLess += ("?" + sParam);
            }
            sAppUri = sUriForHeaderLess + sAppUri.substring(iIndexOfHash);
            sAppUri = await this._addNavmodeInUrl(sAppUri, 'explace');
        }
        return sAppUri;
    };

    /**
     * Helper method which shares the application as a Tab in MS Teams
     *
     * @param {Object} oParams Parameter object which contain the information to share
     * @param {string} oParams.url Url of the application which needs to be shared
     * @param {string} oParams.appTitle Title of the application which needs to be used in the Tab title
     * @param {string} oParams.subTitle Title of the object page which needs to be used in the Tab title
     * @returns {void}
     * @private
     * @ui5-restricted
     */
    TeamsHelperService.prototype._shareAsTab = async function(oParams) {
        var sAppUri = await this._modifyUrlForShareAsTab(oParams.url, "MST:T");
        var oData = {
            "subEntityId": {
                "url": sAppUri,
                "appTitle": oParams.appTitle,
                "subTitle": oParams.subTitle,
                "mode": "tab"
            }
        };
        if (oParams.minifyUrlForChat) {
            CollaborationHelper.compactHash(sAppUri, []).then(async function(sShortURL) {
                var sModifiedUrl = await this._modifyUrlForNavigationContext(sAppUri, sShortURL.url);
                oData.subEntityId.url = await this._addNavmodeInUrl(sModifiedUrl, 'explace');
                var sURL = this._providerConfig.shareAsTabUrl + "?&context=" + encodeURIComponent(JSON.stringify(oData));
                sap.m.URLHelper.redirect(sURL, true);
            }.bind(this));
        } else {
            var sURL = this._providerConfig.shareAsTabUrl + "?&context=" + encodeURIComponent(JSON.stringify(oData));
            sap.m.URLHelper.redirect(sURL, true);
        }
    };

    TeamsHelperService.prototype._addNavmodeInUrl = function(sURL, sNavMode) {
        const UshellContainer = sap.ui.require("sap/ushell/Container");
        return UshellContainer && UshellContainer.getServiceAsync("URLParsing").then(function(oURLParsing) {
            var sAppUri = sURL;
            var iIndexOfHash = sAppUri.indexOf('#');
            var oHashPartOfUri = oURLParsing.parseShellHash(sAppUri.substring(iIndexOfHash));
            oHashPartOfUri.params['sap-ushell-navmode'] = sNavMode;
            oHashPartOfUri.params['sap-ushell-next-navmode'] = sNavMode;
            var sHashOfUri = oURLParsing.constructShellHash(oHashPartOfUri);
            sAppUri = sAppUri.substring(0, iIndexOfHash) + '#' + sHashOfUri;
            return Promise.resolve(sAppUri);
        });
    };

    TeamsHelperService.prototype._modifyUrlForNavigationContext = function(originalUrl, sURL) {
        // The following condition applies when URL shortening hasn't been performed.
        // In this case, there's no requirement to make any changes to navigation context.
        if (originalUrl === sURL) {
            return Promise.resolve(sURL);
        }
        const UshellContainer = sap.ui.require("sap/ushell/Container");
        return UshellContainer && UshellContainer.getServiceAsync("URLParsing").then(function(oURLParsing) {
            var sAppUri = originalUrl;
            var iIndexOfHash = sAppUri.indexOf('#');
            var oHashPartOfUri = oURLParsing.parseShellHash(sAppUri.substring(iIndexOfHash));
            var iParamsCount = Object.keys(oHashPartOfUri.params).length;
            var oUrl = new URL(sURL);
            if (iParamsCount > 0) {
                if (!oUrl.searchParams.has("sap-collaboration-teams")) {
                    oUrl.searchParams.set("sap-collaboration-teams", "true");
                } else {
                    oUrl.searchParams.delete("sap-collaboration-teams");
                }
            }
            return Promise.resolve(oUrl.toString());
        });
    };

    /**
     * Helper method which shares the URL as Card
     *
     * @param {Object} oParams Parameter object which contain the information to share
     * @param {string} oParams.url Url of the application which needs to be shared
     * @returns {void}
     * @private
     * @ui5-restricted
     */
    TeamsHelperService.prototype._shareAsCard = async function (oParams) {
        if (!oParams?.cardId || !oParams.cardId.length || !oParams.cardManifest || !this.isFeatureFlagEnabled()) {
            // Base Card to unfurl
            this._updateUrl(oParams, {});
            return;
        }
        let oCardData = {};
        try {
            // Card Id and Card Manifest Passed. It will show busy helper and store card into DB.
            try {
                const oDialog = await Fragment.load({
                    name: "sap.suite.ui.commons.collaboration.CollaborationBusyDialog",
                    controller: this,
                    type: "XML"
                });
                oBusyDialog = oDialog;
                oBusyDialog.open();

                // Automatically close the dialog after a fixed time
                iBusyDialogTimeoutId = setTimeout(() => {
                    oBusyDialog.close();
                    oBusyDialog.destroy();
                }, AUTO_CLOSE_BUSY_DIALOG_TIME);
            } catch (err) {
                oLogger.error("Fragment load failed: " + err.message);
            }

            oCardData = await this._buildCardInfo(oParams);
        } catch (err) {
            oLogger.error("buildCardInfo failed: " + err.message);
        } finally {
            if (oCardData && Object.keys(oCardData).length === 0) {
                oLogger.warn("Card info could not be saved.");
            }

            // Auth/Base card to unfurl
            this._updateUrl(oParams, oCardData);
        }
    };

    /**
     * Builds card information for a Teams collaboration card.
     * This method calls the postCard API to create or retrieve card info.
     * - On success: returns { cardId, version }.
     * - On business error (e.g., APS_UI_MSG/001 when card already exists):
     *   tries to recover the card version from the error message and still returns { cardId, version }.
     * - On other business errors: returns an empty object {}.
     * - On technical errors (network/CSRF/JSON parsing): the promise rejects and should be caught by the caller.
     *
     * @param {Object} oParams - Parameters for building the card
     * @param {string} oParams.cardId - The card ID
     * @param {Object} oParams.cardManifest - The card manifest metadata
     * @returns {Promise<Object>} - Resolves with card information { cardId, version } or {} if not available
     *                              (may reject on technical errors)
     */
    TeamsHelperService.prototype._buildCardInfo = async function (oParams) {
        // Set right-to-left layout based on localization settings
        oParams.cardManifest.rtl = Localization.getRTL();
        const postCardResponse = await CollaborationCardHelper.postCard(oParams.cardId, oParams.cardManifest);

        let oCardData = {
            cardId: postCardResponse.card_id,
            version: postCardResponse.version
        };

        // Handle special error scenario where the card already exists
        if (postCardResponse.error) {
            if (postCardResponse.error.code === "APS_UI_MSG/001") {
                // Card ID with same CardManifest detail is present so it will get version and open Teams Dialog
                oCardData.cardId = oParams.cardId;
                if (postCardResponse.error.message.length > 0){
                    try {
                        const sCardVersion = JSON.parse(atob(postCardResponse.error.message)).version;
                        oCardData.version = sCardVersion;
                    } catch (e) {
                        oCardData = {};
                    }
                }
            } else {
                oCardData = {};
            }
        }
        return oCardData;
    };

    /**
     * Updates the URL based on parameters, optionally minifying it for chat,
     * and then opens the Teams dialog with the processed URL.
     *
     * @param {Object} oParams - Parameters including original URL and flags.
     * @param {Object} oCardData - The card data containing cardId and version.
     */
    TeamsHelperService.prototype._updateUrl = async function(oParams, oCardData) {
        let sModifiedUrl = oParams?.url || window.location.href;
        try {
            if (oParams.minifyUrlForChat) {
                sModifiedUrl = await this._getModifiedUrlForSharing(oParams);
            } else if (oTeamsParams.isShareAsTabEnabled && this._providerConfig.isShareAsTabEnabled) {
                const sUrlForTab = await this._modifyUrlForShareAsTab(sModifiedUrl, "MST:C");
                sModifiedUrl = await this._addNavmodeInUrl(sUrlForTab, 'inplace');
            }
        } catch (error) {
            oLogger.error("Error while modifying URL for sharing: " + error.message);
        } finally {
            // Close busy dialog and open the Teams dialog with the final URL
            this._closeBusyDialogAndOpenTeamsDialog(sModifiedUrl, oParams, oCardData);
        }
    };

    /**
     * Generates a modified URL for sharing in Microsoft Teams.
     * @param {Object} oParams - Parameters containing the original URL and flags.
     * @returns {Promise<string>} - A fully processed URL ready to be used for sharing.
     */
    TeamsHelperService.prototype._getModifiedUrlForSharing = async function(oParams) {
        const sShortURL = await CollaborationHelper.compactHash(oParams.url, []);
        let sModifiedUrl = await this._modifyUrlForNavigationContext(oParams.url, sShortURL.url);
        let sUrlForTab = await this._modifyUrlForShareAsTab(oParams.url, "MST:C");
        const sShortURLTab = await CollaborationHelper.compactHash(sUrlForTab, []);
        const sStageViewHash = sShortURLTab.url.split("sap-url-hash=")[1];

        if (sStageViewHash) {
            sModifiedUrl += `,${sStageViewHash}`;
        } else {
            sUrlForTab = await this._modifyUrlForShareAsTab(sModifiedUrl, "MST:C");
            sModifiedUrl = await this._addNavmodeInUrl(sUrlForTab, 'inplace');
        }

        return sModifiedUrl;
    };

    /**
     * Closes and destroys the busy dialog, and clears timeout.
     */
    TeamsHelperService.prototype._closeBusyDialog = function() {
        if (oBusyDialog) {
            oBusyDialog.close();
            oBusyDialog.destroy();
            clearTimeout(iBusyDialogTimeoutId);
        }
    };

    /**
     * Closes the busy dialog and opens a new Teams dialog window with card info in the URL.
     *
     * @param {string} sUrl - URL with card info.
     * @param {Object} oParams - Parameters including original URL and flags.
     * @param {Object} oCardData - The card data containing cardId and version.
     */
    TeamsHelperService.prototype._closeBusyDialogAndOpenTeamsDialog = function(sUrl, oParams, oCardData) {
        this._closeBusyDialog();
        const newWindow = window.open(
            "",
            "_blank",
            windowWidthAndHeight
        );
        newWindow.opener = null;
        newWindow.location = this._generateShareAsCardUrl(sUrl, oParams.appTitle, oCardData);
    };

    /**
     * Converts a wildcard pattern to a regular expression
     * @param {string} pattern - The wildcard pattern to convert
     * @returns {RegExp} The resulting regular expression
     */
    TeamsHelperService.prototype._wildcardToRegExp = function(pattern) {
        return new RegExp('^' + pattern.split('*').map(function(part) {
            return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }).join('[^.]+') + '$', 'i');
    };

    /**
     * Checks if a given URL's domain is valid according to the validDomains list
     * @param {string} url - The URL to check
     * @returns {boolean} True if the domain is valid, false otherwise
     */
    TeamsHelperService.prototype._isValidDomain = function(url) {
        try {
            const domain = new URL(url).hostname;
            return validDomains.some((pattern) =>
                this._wildcardToRegExp(pattern).test(domain)
            );
        } catch (e) {
            return false;
        }
    };

    /**
     * Generates the card info URL based on the provided parameters.
     *
     * @param {string} sUrl - The base URL to be processed.
     * @param {Object} oParams - An object containing additional parameters.
     * @param {string} oParams.appTitle - The title of the application.
     * @param {Object} oCardData - The card data object.
     * @returns {string} The processed URL with card info parameters.
     */
    TeamsHelperService.prototype._getCardInfoUrl = function(sUrl, oParams, oCardData) {
        const isValid = this._isValidDomain(sUrl);
        const sAppTitle = oParams?.appTitle;
        if (isValid) {
            return this._generateCardUnfurlingUrl(sUrl, oCardData, { appTitle: sAppTitle });
        } else {
            return this._generateShareAsCardUrl(sUrl, sAppTitle, oCardData);
        }
    };

    /**
     * Generates the full shareable Teams URL with card info.
     *
     * @param {string} sUrl - The card URL.
     * @param {string} sAppTitle - The application title.
     * @param {Object} oCardData - The card data containing cardId and version.
     * @returns {string} Teams shareable URL.
     */
    TeamsHelperService.prototype._generateShareAsCardUrl = function(sUrl, sAppTitle, oCardData) {
        const sCardInfoUrl = this._generateCardUnfurlingUrl(sUrl, oCardData, { appTitle: sAppTitle });

		// add the domain prefix to solve link unfurling issue for systems with different domain patterns
		return `${this._providerConfig.shareAsLinkUrl}?href=${encodeURIComponent(CARD_URL_PREFIX + encodeURIComponent(sCardInfoUrl))}`;
    };

    /**
     * Generates the unfurling URL with card info.
     * Appends the SAP card info parameters (cardId, version, appTitle) to the given URL.
     *
     * @param {string} cardUrl - The base card URL to which the parameter will be appended.
     * @param {Object} oCardData - The card data object containing cardId and version.
     * @param {Object} oParams - The parameter object containing appTitle.
     * @returns {string} The updated URL with the appended sap-card-info query parameter.
     */
    TeamsHelperService.prototype._generateCardUnfurlingUrl = function(cardUrl, oCardData, oParams) {
        const infoFields = [
            oCardData.cardId || "",
            oCardData.version || "",
            encodeURIComponent(oParams.appTitle || "")
        ].filter(Boolean);

        return `${cardUrl}&${PARAM_SAP_CARD_INFO}=${infoFields.join(",")}`;
    };

    TeamsHelperService.prototype._getShareAsTabUrl = function() {
        return this._getApplicationID().then(function(sTeamsAppID) {
            return "https://teams.microsoft.com/l/entity/" + sTeamsAppID + "/tab";
        });
    };

    TeamsHelperService.prototype._getApplicationID = function() {
        const UshellContainer = sap.ui.require("sap/ushell/Container");
        return UshellContainer && UshellContainer.getServiceAsync("URLParsing").then(function(oURLParsing) {
            return CollaborationHelper._getCurrentUrl().then(function(sCurrentUrl) {
                var sBeforeHashURL = sCurrentUrl.split("#")[0];
                if (sBeforeHashURL.indexOf('?') !== -1) {
                    var oParsedUrl = oURLParsing && oURLParsing.parseParameters(sBeforeHashURL.substring(sBeforeHashURL.indexOf('?')));
                    if (oParsedUrl &&
                        oParsedUrl["sap-collaboration-xx-TeamsAppId"] &&
                        oParsedUrl["sap-collaboration-xx-TeamsAppId"][0] &&
                        oParsedUrl["sap-collaboration-xx-TeamsAppId"][0].length > 0) {
                        return Promise.resolve(oParsedUrl["sap-collaboration-xx-TeamsAppId"][0]);
                    }
                    return Promise.resolve(COLLABORATION_MSTEAMS_APPID);
                } else {
                    return Promise.resolve(COLLABORATION_MSTEAMS_APPID);
                }
            });
        });
    };

    /**
     * Checks whether the feature flag is enabled and executes the code for the Adaptive Card Generation accordingly
     * @returns {boolean} If set to true, Adaptive Card Generation is enabled
     * @private
     */
    TeamsHelperService.prototype.isFeatureFlagEnabled = function() {
        const bIsShareAsCardEnabled = this._providerConfig.isShareAsCardEnabled;
        return bIsShareAsCardEnabled === "AUTHENABLE";
    };

    /**
     * Checks if collaboration with contacts is supported in teams AD
     *
     * @returns {boolean} A boolean indicating collaboration is supported
     * @private
     */

    TeamsHelperService.prototype.isContactsCollaborationSupported = function() {
        return true;
    };


    /**
     * Enables collaboration with contacts in teams AD
     * @param {string} sEmail email of the contact to enable the communication
     * @param {object} oParams subject and body of the email
     * @returns {Promise} Returns promise which enables the contact options
     * @private
     */

    TeamsHelperService.prototype.enableContactsCollaboration = async function(sEmail, oParams) {
        const isTeamMode = await CollaborationHelper.isTeamsModeActive();
        const isContactServiceAvailable = await CollaborationContactInfoHelper.fetchServiceStatus();
        if (sEmail && isContactServiceAvailable.value && isContactServiceAvailable.value && isContactServiceAvailable.value[0].FetchContacts === "Active") {
            if (!this.oContactHelper) {
                this.oContactHelper = new ContactHelper();
            }
            if (this._providerConfig.isDirectCommunicationEnabled === "ENABLED") {
                return this.oContactHelper.loadContactPopover(sEmail, oParams, true);
            } else {
                return this.oContactHelper.loadContactPopover(sEmail, oParams);
            }

        } else if (isTeamMode || !sEmail || this._providerConfig.isDirectCommunicationEnabled !== "ENABLED") {
            return Promise.reject();
        } else {
            if (!this.oContactHelper) {
                this.oContactHelper = new ContactHelper();
            }
            return this.oContactHelper.loadMinimalContactPopover(sEmail, oParams);
        }
    };

    /**
     * Provide Teams collaboration options for contact
     * @returns {Promise} Returns promise which has the options for teams collaboration
     * @private
     */

    TeamsHelperService.prototype.getTeamsContactCollabOptions = async function() {
        const isTeamMode = await CollaborationHelper.isTeamsModeActive();
        if (isTeamMode || this._providerConfig.isDirectCommunicationEnabled !== "ENABLED") {
            return Promise.reject();
        }
        if (!this.oContactHelper) {
            this.oContactHelper = new ContactHelper();
        }
        return this.oContactHelper.getTeamsContactOptions();
    };

    /**
     * Provide Teams status for the contact
     * @returns {Promise} Returns promise which has the status of the contact
     * @param {sEmail} sEmail email of the contact
     * @private
     */

    TeamsHelperService.prototype.getTeamsContactStatus = async function(sEmail) {
        const isTeamMode = await CollaborationHelper.isTeamsModeActive();
        if (isTeamMode) {
            return Promise.reject();
        }
        if (!this.oContactHelper) {
            this.oContactHelper = new ContactHelper();
        }
        return this.oContactHelper.getTeamsContactStatus(sEmail);
    };

    /**
     * Opens a Popup that helps to share content to teams, mail.
     * @param { object } oParams Optional argument in case consumer wants to influence the options, otherwise pass as undefined
     * @param { object } oData Title and data to share
     * @param { string } oSource The source to which the popover is rendered.
     * @param { boolean } isLink Indicates the data is a URL or not.
     * @param { object } oCollaborationOptionsConfig Configuration options for collaboration (e.g., shareToTeams, shareToEmail, shareToCM).
     *
     */
    TeamsHelperService.prototype.getCollaborationPopover = function(oParams, oData, oSource, isLink, oCollaborationOptionsConfig) {
        if (oData.data === undefined || oData.data.trim() === "") {
            oLogger.error("Popover cannnot be opened without data");
            return;
        }
        var oTeamsParams = {
            isShareAsLinkEnabled: (oParams && typeof oParams.isShareAsLinkEnabled !== 'undefined') ? oParams.isShareAsLinkEnabled : true
        };
        var oCollaborationOptionsCfg = {
            shareToTeams: oCollaborationOptionsConfig && typeof oCollaborationOptionsConfig.shareToTeams !== "undefined" ? oCollaborationOptionsConfig.shareToTeams : true,
            shareToEmail: oCollaborationOptionsConfig && typeof oCollaborationOptionsConfig.shareToEmail !== "undefined" ? oCollaborationOptionsConfig.shareToEmail : true,
            shareToCM: oCollaborationOptionsConfig && typeof oCollaborationOptionsConfig.shareToCM !== "undefined" ? oCollaborationOptionsConfig.shareToCM : false
        };
        var aOptions = [];
        if (Device.system.desktop) {
            if (oTeamsParams.isShareAsLinkEnabled) {
                if (this._providerConfig.isShareAsLinkEnabled === "X" && oCollaborationOptionsCfg.shareToTeams) {
                    aOptions.push({
                        "text": oResourceBundle.getText("COLLABORATION_POPOVER_TEAMS"),
                        "icon": "sap-icon://discussion",
                        "key": "COLLABORATION_POPOVER_TEAMS"
                    });

                } else {
                    oLogger.info("Share as Chat option is not enabled in the tenant");
                }
            } else {
                oLogger.info("Consumer disable Share as Chat option");
            }
        } else {
            oLogger.info("Share as Chat option is not supported in Phone and Tablet");
        }
        if (oCollaborationOptionsCfg.shareToEmail) {
            aOptions.push({
                "text": oResourceBundle.getText("COLLABORATION_POPOVER_MAIL"),
                "icon": "sap-icon://email",
                "key": "COLLABORATION_POPOVER_MAIL"
            });
        }
        this.oCollaborationManager = new CollaborationManagerService();
        var oCMOption = this.oCollaborationManager.getOptions();
        if (oCMOption && oCollaborationOptionsCfg.shareToCM) {
            aOptions.push({
                "text": oCMOption.text,
                "icon": oCMOption.icon,
                "key": "COLLABORATION_POPOVER_CM"
            });
        }
        if (aOptions.length === 1 && !isLink && aOptions[0].key === "COLLABORATION_POPOVER_MAIL") {
            this._shareData(oData, aOptions[0], isLink);
            return;
        }
        var oCollaborationPopover = this._getPopover(oData, aOptions, isLink);
        oCollaborationPopover.openBy(oSource);
    };

    /**
     *
     * @param { object } oData Title and data to share
     * @param { array } aOptions Array of available options
     * @param { boolean } isLink Indicates the data is a URL or not.
     * @returns {sap.m.Popover} Returns the final Popover to the control.
     */
    TeamsHelperService.prototype._getPopover = function(oData, aOptions, isLink) {
        var oCollaborationPopover = new Popover({
            showHeader: false,
            placement: oData.placement ? oData.placement : "Auto",
            verticalScrolling: false,
            horizontalScrolling: false,
            content: this._getPopoverContent(oData, aOptions, isLink)
        });
        return oCollaborationPopover;
    };

    /**
     * Returns the content of popover in a FlexBox
     * @param { object } oData Title and data to share
     * @param { array } aOptions Array of available options
     * @param { boolean } isLink Indicates the data is a URL or not.
     * @returns {sap.m.FlexBox} Returns the FlexBox containing the popover content.
     */
    TeamsHelperService.prototype._getPopoverContent = function(oData, aOptions, isLink) {
        var oMainFBox = new FlexBox({
            items: [],
            direction: sapMLibrary.FlexDirection.Column
        });
        var oOptionFBox = new FlexBox({
            direction: oData.sFormat === "Vertical" ? sapMLibrary.FlexDirection.Column : sapMLibrary.FlexDirection.Row,
            justifyContent: sapMLibrary.FlexJustifyContent.SpaceAround,
            items: []
        });
        aOptions.forEach((oOption) => {
            var button = new Button({
                text: oOption.text,
                icon: oOption.icon,
                width: oData.sFormat === "Horizontal" && aOptions.length === 3 ? "120px" : "180px",
                press: (oEvent) => {
                    oEvent.getSource().getParent().getParent().getParent().close();
                    this._shareData(oData, oOption, isLink);
                }
            }).addStyleClass("sapUiTinyMarginTop").addStyleClass("sapUiTinyMarginBegin");

            if (oOption.key === "COLLABORATION_POPOVER_TEAMS") {
                button.addStyleClass("sapSuiteUiCollaborationBarMSTeamsButton" + (oData.sFormat ? oData.sFormat : "Horizontal"));
            } else if (oOption.key === "COLLABORATION_POPOVER_CM") {
                button.addStyleClass("sapSuiteUiCollaborationBarCMButton" + (oData.sFormat ? oData.sFormat : "Horizontal"));
            } else {
                button.addStyleClass("sapSuiteUiCollaborationBarEmailButton" + (oData.sFormat ? oData.sFormat : "Horizontal"));
            }
            oOptionFBox.addItem(button);
            oMainFBox.addItem(oOptionFBox);
        });

        if (isLink) {
            var oCopyLinkFlexbox = new FlexBox({
                justifyContent: oData.sFormat === "Vertical" ? sapMLibrary.FlexJustifyContent.Center : sapMLibrary.FlexJustifyContent.SpaceBetween,
                alignItems: sapMLibrary.FlexAlignItems.Center,
                items: [
                    new Button({
                        text: oResourceBundle.getText("COLLABORATION_POPOVER_COPYURL_BUTTON"),
                        width: oData.sFormat === "Vertical" ? "150px" : "",
                        press: async () => {
                            await this._writeToClipBoard(oData.data);
                        }
                    }).addStyleClass("sapUiTinyMarginBeginEnd")
                ]
            });
            if (oData.sFormat === "Horizontal" || oData.sFormat === undefined) {
                oCopyLinkFlexbox.insertItem(
                    new MessageStrip({
                        text: oResourceBundle.getText("COLLABORATION_POPOVER_MSGSTRIP"),
                        showIcon: true
                    }).addStyleClass("sapUiTinyMarginBeginEnd").addStyleClass("sapSuiteCollaborationBarMsgStrip"), 0);
                oCopyLinkFlexbox.addStyleClass("sapSuiteUiCollaborationBarMsgStripHBox");
            }
            oCopyLinkFlexbox.addStyleClass("sapUiTinyMarginBeginEnd").addStyleClass("sapUiTinyMarginTopBottom");
            oMainFBox.addItem(oCopyLinkFlexbox);
        }

        if (oData.sFormat === "Vertical") {
            oOptionFBox.setHeight(aOptions.length > 1 ? (aOptions.length * 50 + 50) + "px" : "80px");
            oOptionFBox.addStyleClass("sapUiSmallMarginBottom").addStyleClass("sapUiTinyMarginEnd");
        } else {
            oOptionFBox.setHeight("110px");
            oOptionFBox.addStyleClass("sapUiTinyMarginEnd");

        }
        return oMainFBox;
    };

    /**
     *
     * @param { text } sText Text to copy to the cilpboard
     * Writes the given URL to the clipboard
     */
    TeamsHelperService.prototype._writeToClipBoard = async function(sText) {
        try {
            await window.navigator.clipboard.writeText(sText);
        } catch (e) {
            oLogger.info(e);
        }
    };

    /**
     *
     * @param { object } oData Title and data to share
     * @param { object } oOption Data related to the selected option
     * @param { boolean } isLink Indicates the data is a URL or not.
     */
    TeamsHelperService.prototype._shareData = function(oData, oOption, isLink) {
        if (oOption.key === "COLLABORATION_POPOVER_TEAMS") {
            if (isLink) {
                var oShareDataLink = {
                    url: oData.data,
                    appTitle: oData.title ? oData.title : "",
                    subTitle: "",
                    minifyUrlForChat: true
                };
                this._shareAsChat(oShareDataLink);
            } else {
                var oShareDataSummary = {
                    appTitle: oData.title ? oData.title : "",
                    message: oData.data,
                    showPreview: typeof oData.showPreview !== "undefined" ? oData.showPreview : true
                };
                this._shareSummary(oShareDataSummary);
            }
        } else if (oOption.key === "COLLABORATION_POPOVER_MAIL") {
            sap.m.URLHelper.triggerEmail(null, oData.title && oData.title.trim() !== "" ? oData.title : null, oData.data);
        } else if (oOption.key === "COLLABORATION_POPOVER_CM") {
            this.oCollaborationManager.triggerH2HChat(oData.title, oData.data);
        }
    };

    /**
     * Shares the summary data (large content) to Microsoft Teams
     * @param { object } oParams Title and summary data to share
     */
    TeamsHelperService.prototype._shareSummary = function(oParams) {
        var oData = {
            "subEntityId": {
                "appTitle": oParams.appTitle,
                "mode": "summary",
                "message": oParams.message,
                "showPreview": oParams.showPreview
            }
        };

        var sURL = this._providerConfig.shareAsTabUrl + "?&context=" + encodeURIComponent(JSON.stringify(oData));
        sap.m.URLHelper.redirect(sURL, true);

    };

    /**
     * Shares the current or unfurled URL via email.
     * @param {Object} oParams - Parameters for sharing.
     * @param {string} [oParams.url] - The base URL to share.
     * @param {string} [oParams.appTitle] - The subject of the email.
     * @returns {Promise<void>} A promise that resolves when the email sharing process is complete.
     */
    TeamsHelperService.prototype._shareToEmail = async function (oParams) {
        let sUnfurlingUrl = oParams?.url || window.location.href;
        try {
            sUnfurlingUrl = await this._getUnfurlingUrl(oParams);
        } catch (error) {
            oLogger.error("getUnfurlingUrl failed: " + error.message);
        }

        const sSubject = oParams?.appTitle?.trim() ? oParams.appTitle : null;
        sap.m.URLHelper.triggerEmail(null, sSubject, sUnfurlingUrl);
    };

    /**
     * Shares a card from the collaboration bar.
     * @param {Object} params - Parameters for sharing the card.
     */
    TeamsHelperService.prototype._shareAsChatFromCollabBar = async function (params) {
        try {
            await this._shareAsCard(params);
        } catch (error) {
            oLogger.error("Failed to share card from collaboration bar: " + error.message);
        }
    };

    /**
     * Copies the unfurled card URL to the clipboard.
     * @param {Object} oParams - Parameters for sharing.
     * @param {string} [oParams.url] - The base URL to copy.
     * @returns {Promise<void>} A promise that resolves when the URL has been copied to the clipboard.
     */
    TeamsHelperService.prototype._copyLink = async function (oParams) {
        let sUnfurlingUrl = oParams?.url || window.location.href;
        try {
            sUnfurlingUrl = await this._getUnfurlingUrl(oParams);
        } catch (error) {
            oLogger.error("getUnfurlingUrl failed: " + error.message);
        }

        this._copyCardUrlToClipboard(sUnfurlingUrl);
    };

    /**
     * Copies a given URL string into the clipboard.
     * @param {string} sUrl - The URL to copy into the clipboard.
     * @returns {Promise<void>} A promise that resolves when the URL has been copied to the clipboard.
     */
    TeamsHelperService.prototype._copyCardUrlToClipboard = async function(sUrl) {
        try {
            if (typeof window.navigator !== "undefined" &&
                window.navigator.clipboard &&
                typeof window.navigator.clipboard.writeText === "function") {
                try {
                    await window.navigator.clipboard.writeText(sUrl);
                    oLogger.info("Card URL copied to clipboard successfully.");
                    sap.m.MessageToast.show(oResourceBundle.getText("COLLABORATION_POPOVER_MSGSTRIP_SUCCESS"));
                } catch (e) {
                    oLogger.error("Clipboard write failed: " + e.message);
                }
            } else {
                oLogger.error("Clipboard API is not available.");
            }

        } catch (err) {
            oLogger.error("Failed to generate or copy Card URL", err);
        }
    };

    /**
     * Gets the unfurling URL for a card.
     * If cardId and cardManifest are provided, saves the card data and shows a busy dialog.
     * Otherwise, returns a base unfurling URL.
     * @param {Object} oParams - Parameters for the card.
     * @param {string} [oParams.url] - Base URL for the card.
     * @param {string} [oParams.cardId] - The card ID.
     * @param {Object} [oParams.cardManifest] - The card manifest definition.
     * @returns {Promise<string>} The unfurling URL.
     */
    TeamsHelperService.prototype._getUnfurlingUrl = async function(oParams) {
        if (!oParams?.cardId || !oParams.cardId.length || !oParams.cardManifest || !this.isFeatureFlagEnabled()) {
            // Base Card to unfurl
            return this._generateUnfurlingUrl(oParams, {});
        }

        let sUnfurlingUrl = "";
        let oCardData = {};
        try {
            // Card Id and Card Manifest Passed. It will show busy helper and store card into DB.
            try {
                const oDialog = await Fragment.load({
                    name: "sap.suite.ui.commons.collaboration.CollaborationBusyDialog",
                    controller: this,
                    type: "XML"
                });
                oBusyDialog = oDialog;
                oBusyDialog.open();

                // Automatically close the dialog after a fixed time
                iBusyDialogTimeoutId = setTimeout(() => {
                    oBusyDialog.close();
                    oBusyDialog.destroy();
                }, AUTO_CLOSE_BUSY_DIALOG_TIME);
            } catch (err) {
                oLogger.error("Fragment load failed: " + err.message);
            }

            oCardData = await this._buildCardInfo(oParams);
        } catch (err) {
            oLogger.error("buildCardInfo failed: " + err.message);
        } finally {
            if (oCardData && Object.keys(oCardData).length === 0) {
                oLogger.warn("Card info could not be saved.");
            }

            // Auth/Base card to unfurl
            sUnfurlingUrl = this._generateUnfurlingUrl(oParams, oCardData);
            this._closeBusyDialog();
        }

        return sUnfurlingUrl;
    };

    /**
     * Generates a URL for unfurling a card in Microsoft Teams.
     * Handles minification, share-as-tab logic, and adds navigation modes.
     * @param {Object} oParams - Parameters for the card.
     * @param {Object} oCardData - The card data (id, version, etc.).
     * @returns {Promise<string>} The generated unfurling URL.
     */
    TeamsHelperService.prototype._generateUnfurlingUrl = async function(oParams, oCardData) {
        let sModifiedUrl = oParams?.url || window.location.href;
        try {
            if (oParams?.minifyUrlForChat) {
                sModifiedUrl = await this._getModifiedUrlForSharing(oParams);
            } else if (oTeamsParams.isShareAsTabEnabled && this._providerConfig.isShareAsTabEnabled) {
                const sUrlForTab = await this._modifyUrlForShareAsTab(sModifiedUrl, "MST:C");
                sModifiedUrl = await this._addNavmodeInUrl(sUrlForTab, 'inplace');
            }
        } catch (error) {
            oLogger.error("Error while modifying URL for sharing: " + error.message);
        }
        return this._getCardInfoUrl(sModifiedUrl, oParams, oCardData);
    };

    return TeamsHelperService;
});
