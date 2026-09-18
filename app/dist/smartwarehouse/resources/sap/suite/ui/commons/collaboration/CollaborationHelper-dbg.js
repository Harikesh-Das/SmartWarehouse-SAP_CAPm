/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(
	[
		"sap/base/Log",
		"sap/ui/base/Object",
		"sap/ui/core/Element",
		"../windowmessages/CollaborationMessageConsumer"
	],
	function(Log, BaseObject, Element, CollaborationMessageConsumer) {
		"use strict";
		var URL_KEY = "sap-url-hash";
		var PARAM_SAP_CARD_TITLE = "&sap-ui-cardTitle";
		var PARAM_SAP_STAGEVIEW_HASH = "&sap-stageview-hash";
		var PARAM_SAP_CARD_ID = "&sap-ui-cardId";
		var PARAM_SAP_XX_CARD_ID = "&sap-ui-xx-cardId";
		var PARAM_SAP_CARD_INFO = "&info=";
		var PARAM_SAP_USHELL_CONFIG = "sap-ushell-config";
		var PARAM_SAP_COLLABORATION_TEAMS = "sap-collaboration-teams";
		var PARAM_SAP_UI_FESR_ENV = "sap-ui-fesr-env";
		var TRANSIENT_KEY = "transient";
		var oLogger = Log.getLogger("sap.suite.ui.commons.collaboration.CollaborationHelper");

		/**
		 * CollaborationHelper for collaboration-related functionalities
		 * @namespace
		 * @alias module:sap/suite/ui/commons/collaboration/CollaborationHelper
		 * @public
		 */
		var CollaborationHelper = BaseObject.extend(
			"sap.suite.ui.commons.collaboration.CollaborationHelper"
		);

		/**
		 * This function creates a shortened URL.
		 * @param {string} sUrl Full URL
		 * @returns {string} This function returns a shortened URL in the format
		 * `<protocol>/<hostname>#<semantic-object>&/sap-url-hash=<UUID>`
		 * @private
		 * @ui5-restricted sap.suite.suite-ui-commons
		 */
		CollaborationHelper.compactHash = function(sUrl) {
			const UshellContainer = sap.ui.require("sap/ushell/Container");
			if (!UshellContainer) {
				//In case uShell Container is not present, minification is not needed.
				return {
					url: sUrl
				};
			}
			return UshellContainer && UshellContainer.getServiceAsync("AppState").then(async function(oAppStateService) {
				var oEmptyAppState = oAppStateService.createEmptyAppState(
					undefined,
					false
				);
				var sKey = this._getNextKey(oEmptyAppState);
				if (!this._isEligibleForBackendPersistency(oAppStateService)) {
					oLogger.warning("Transient flag is true. URL will not be shortened");
					return {
						url: sUrl
					};
				}
				var sUrlBeforeHash = this._extractURLBeforeHash(sUrl);
				var sSemanticObjectAndAction = await this._extractSemanticObjectAndAction(sUrl);
				var isMinificationPossible = false;
				try {
					isMinificationPossible = await this._isMinificationFeasible(sUrl);
				} catch (e) {
					oLogger.error("isMinificationPossible check failed. URL will not be shortened");
				}
				if (!sSemanticObjectAndAction || !isMinificationPossible) {
					// In case sSemanticObjectAndAction is undefined
					// or the fragment is not resolved, then return the current url as shortened url.
					return {
						url: sUrl
					};
				}
				return this._storeUrl(sUrl, oEmptyAppState)
					.then(function() {
						return {
							url: sUrlBeforeHash + "#" + sSemanticObjectAndAction + "&/" + URL_KEY + "=" + sKey
						};
					})
					.catch(function(error) {
						oLogger.warning("URL is not shortened due to an error." + error.toString());
						//In case if the wrapper promise is rejected then return the current url as shortened url.
						return {
							url: sUrl
						};
					});
			}.bind(this));
		};

		/**
		 * Function that returns a Promise that resolves to the current URL.
		 * @returns {Promise} Promise which resolves to the current URL
		 * @private
		 */
		CollaborationHelper._getCurrentUrl = function() {
			const UshellContainer = sap.ui.require("sap/ushell/Container");
			return UshellContainer && UshellContainer ? new Promise(function(fnResolve) {
				UshellContainer.getFLPUrlAsync(true).then(function(sFLPUrl) {
					fnResolve(sFLPUrl);
				});
			}) : Promise.resolve(document.URL);
		};

		/**
		 * Method that checks whether the application is running in the Microsoft Teams environment. If yes, the
		 * method disables the Avatar icon on the shell. This is done synchronously. The Method returns
		 * a promise. The promise is resolved immediately if the URL is not compact. In case of a compact hash,
		 * the method retrieves the original or complete hash and replaces it in the window. The method then resolves the promise.
		 * @return {Promise} Return the resolved promise when the redirection of the URL is done.
		 * @public
		 */
		CollaborationHelper.processAndExpandHash = function() {
			this._hideAvatarFromShellbar();
			return this._getCurrentUrl().then(async function(sCurrentUrl) {
				//if the current url has url param, sap-url-hash, then we have to redirect to an actual url.
				if (sCurrentUrl.indexOf(URL_KEY) > -1) {
					var sHash = sCurrentUrl.split(URL_KEY)[1].split("=")[1];
					if (sCurrentUrl.indexOf(PARAM_SAP_STAGEVIEW_HASH) > 0) {
						sHash = sHash.split(PARAM_SAP_STAGEVIEW_HASH)[0];
					} else if (sCurrentUrl.includes("info=")) {
						sHash = sHash.includes(",") ? sHash.split(",")[0] : sHash.split("&")[0];
					} else if (
						sCurrentUrl.indexOf(PARAM_SAP_CARD_ID) > 0 ||
						sCurrentUrl.indexOf(PARAM_SAP_XX_CARD_ID) > 0
					) {
						if (sCurrentUrl.indexOf(PARAM_SAP_CARD_ID) > 0) {
							sHash = sHash.split(PARAM_SAP_CARD_ID)[0];
						} else {
							sHash = sHash.split(PARAM_SAP_XX_CARD_ID)[0];
						}
					} else if (sCurrentUrl.indexOf(PARAM_SAP_CARD_TITLE) > 0) {
						sHash = sHash.split(PARAM_SAP_CARD_TITLE)[0];
					}
					return this._retrieveURL(sHash).then(function(oAppState) {
						if (oAppState.getData()) {
							window.location.replace(oAppState.getData());
						} else {
							// In case AppState couldn't found value for the hash, so removing it and redirecting to LR
							const sUrl = sCurrentUrl.split(URL_KEY)[0];
							window.location.replace(sUrl);
						}
						return Promise.resolve();
					});
				} else if (sCurrentUrl.indexOf(PARAM_SAP_CARD_ID) > -1) {
					const sUrl = sCurrentUrl.split(PARAM_SAP_CARD_ID)[0];
					window.location.replace(sUrl);
				} else if (sCurrentUrl.indexOf(PARAM_SAP_CARD_TITLE) > -1) {
					const sUrl = sCurrentUrl.split(PARAM_SAP_CARD_TITLE)[0];
					await this._redirectBasedOnRuntime(sUrl);
				} else if (
					sCurrentUrl.includes(PARAM_SAP_CARD_INFO) &&
					this._isFromTeams(sCurrentUrl)
				) {
					const sUrl = sCurrentUrl.split(PARAM_SAP_CARD_INFO)[0];
					await this._redirectBasedOnRuntime(sUrl);
				}
				return Promise.resolve();
			}.bind(this));
		};

		/**
		 * Checks whether the given URL indicates that it originated from a Microsoft Teams environment.
		 *
		 * This is determined by the presence of the query parameter `sap-collaboration-teams=true`.
		 *
		 * @param {string} sCurrentUrl - The full URL to inspect.
		 * @returns {boolean} True if the URL contains `sap-collaboration-teams=true`; otherwise, false.
		 */
		CollaborationHelper._isFromTeams = function(sCurrentUrl) {
			const urlObj = new URL(sCurrentUrl);
			const bIsFromTeams = urlObj.searchParams.get("sap-collaboration-teams");
			return bIsFromTeams === "true";
		};

		/**
		 * Handles URL redirection according to the runtime environment.
		 *
		 * - In AppRuntime (e.g., BTP Fiori App in S/Cube), updates the top-level URL.
		 * - Otherwise, performs a standard window location redirect.
		 *
		 * @param {string} sUrl - The target URL for redirection.
		 * @private
		 */
		CollaborationHelper._redirectBasedOnRuntime = async function(sUrl) {
			const UshellContainer = sap.ui.require("sap/ushell/Container");

			// Get indication is if we are in AppRuntime (for special use cases handling, e.g. BTP Fiori App in S/Cube)
			if (UshellContainer && UshellContainer.inAppRuntime()) {
				await CollaborationMessageConsumer.updateTopLevelURLforAppRuntime(sUrl);
			} else {
				const targetUrl = this._stripTeamsParams(sUrl);
				window.location.replace(targetUrl);
			}
		};

		/**
		 * Removes 'sap-ushell-config' and 'sap-collaboration-teams' query parameters
		 * from the given URL while preserving the hash fragment.
		 *
		 * @param {string} sUrl - The original full URL
		 * @returns {string} - The cleaned URL
		 * @private
		 */
		CollaborationHelper._removeTeamsParams = function(sUrl) {
			try {
				const urlParts = sUrl.split("#");
				const baseUrl = urlParts[0];
				const hashPart = urlParts[1] ? "#" + urlParts[1] : "";

				const [path, queryString] = baseUrl.split("?");
				if (!queryString) {
					return sUrl;
				}

				const params = new URLSearchParams(queryString);
				params.delete(PARAM_SAP_USHELL_CONFIG);
				params.delete(PARAM_SAP_COLLABORATION_TEAMS);
				params.delete(PARAM_SAP_UI_FESR_ENV);

				const newBaseUrl = params.toString()
					? `${path}?${params.toString()}`
					: path;

				return newBaseUrl + hashPart;
			} catch (e) {
				return sUrl;
			}
		};

		/**
		 * If the current window is the top window, we assume it's not running inside an iframe, e.g. Microsoft Teams.
		 * In this case, we remove the Teams parameters from the URL.
		 *
		 * @param {string} sUrl The URL to be cleaned of Teams parameters.
		 * @returns {string} - The cleaned URL
		 * @private
		 */
		CollaborationHelper._stripTeamsParams = function(sUrl) {
			if (this._isTopWindow()) {
				return this._removeTeamsParams(sUrl);
			}
			return sUrl;
		};

		/**
		 * Determines whether the current window is the top-level window.
		 * This is typically used to detect if the application is running inside an iframe (e.g., in Microsoft Teams).
		 *
		 * @returns {boolean} - Returns true if the current window is not inside an iframe, false otherwise.
		 * @private
		 */
		CollaborationHelper._isTopWindow = function() {
			return window.self === window.top;
		};

		/**
		 * Hides the avatar of the user if the app is running in the Microsoft Teams application.
		 * @private
		 * @ui5-restricted sap.suite.suite-ui-commons
		 */
		CollaborationHelper._hideAvatarFromShellbar = function() {
			this.isTeamsModeActive().then(function(bIsActive) {
				if (bIsActive) {
					var oAvatar = Element.getElementById("userActionsMenuHeaderButton");
					if (oAvatar) {
						oAvatar.setVisible(false);
					}
				}
			});
		};

		/**
		 * Determines whether the app is running in the Microsoft Teams application.
		 * If the URL parameter "sap-collaboration-teams" is set to true and if the sap-ushell-config is set to lean,
		 * the method ensures that the application runs in the Microsoft Teams environment
		 * @returns {Promise} Return the resolved promise with the data if the conditions are met with 'true', else 'false'
		 * @public
		 */
		CollaborationHelper.isTeamsModeActive = function() {
			var bAppRunningInTeams = false;
			const UshellContainer = sap.ui.require("sap/ushell/Container");
			if (UshellContainer) {
				return UshellContainer.getServiceAsync("URLParsing").then(function(oURLParsing) {
					return this._getCurrentUrl().then(function(sCurrentUrl) {
						var sBeforeHashURL = sCurrentUrl.split("#")[0];
						if (sBeforeHashURL.indexOf("?") !== -1) {
							var oParsedUrl = oURLParsing && oURLParsing.parseParameters(sBeforeHashURL.substring(sBeforeHashURL.indexOf("?")));
							if (oParsedUrl &&
								oParsedUrl["sap-collaboration-teams"] &&
								oParsedUrl["sap-collaboration-teams"][0] &&
								oParsedUrl["sap-collaboration-teams"][0] === "true") {
								bAppRunningInTeams = true;
							}
							var bAppStateLean = false;
							if (oParsedUrl &&
								oParsedUrl["sap-ushell-config"] &&
								oParsedUrl["sap-ushell-config"][0] &&
								oParsedUrl["sap-ushell-config"][0] === "lean") {
								bAppStateLean = true;
							}
							return Promise.resolve(bAppRunningInTeams && bAppStateLean);
						} else {
							return Promise.resolve(false);
						}
					});
				}.bind(this));
			} else {
				return Promise.resolve(false);
			}
		};

		/**
		 * This function retrieves the URL stored against the hash in the key/value persistent store.
		 * @param {string} hash The hash from the URL
		 * @returns {AppState} The instance of the AppState
		 * @private
		 */
		CollaborationHelper._retrieveURL = function(hash) {
			const UshellContainer = sap.ui.require("sap/ushell/Container");
			return UshellContainer && UshellContainer.getServiceAsync("AppState").then(function(oAppStateService) {
				return oAppStateService.getAppState(hash);
			});
		};

		/**
		 * This function checks the transient flag in the _oConfig object.
		 * @param {AppState} appStateInstance Instance of the AppState
		 * @returns {boolean} 'True' if the transient flag is set to 'false'
		 * @private
		 */
		CollaborationHelper._isEligibleForBackendPersistency = function(appStateInstance) {
			return (
				appStateInstance &&
				appStateInstance._oConfig &&
				TRANSIENT_KEY in appStateInstance._oConfig &&
				!appStateInstance._oConfig[TRANSIENT_KEY]
			);
		};

		/**
		 * This function generates an alphanumeric UUID string.
		 * @param {AppState} oAppStateService Instance of the AppState
		 * @returns {string} Returns a randomly generated UUID string.
		 * @private
		 */
		CollaborationHelper._getNextKey = function(oAppStateService) {
			return oAppStateService.getKey();
		};

		/**
		 * This functions parses a URL and extracts the semantic-object, the action and the context-raw if applicable.
		 * @param {string}  sUrl Full URL
		 * @returns {string} Returns a string in the format <semantic-object>-<action>~<contextRaw>.
		 * @private
		 */
		CollaborationHelper._extractSemanticObjectAndAction = function(sUrl) {
			const UshellContainer = sap.ui.require("sap/ushell/Container");
			return UshellContainer && UshellContainer.getServiceAsync("URLParsing").then(function(oURLParsing) {
				var parsedShellHash = oURLParsing.parseShellHash(this._extractURLHash(sUrl));
				if (parsedShellHash) {
					return Promise.resolve(parsedShellHash.contextRaw ?
						parsedShellHash.semanticObject + "-" +
						parsedShellHash.action + "~" +
						parsedShellHash.contextRaw :
						parsedShellHash.semanticObject + "-" + parsedShellHash.action);
				}
			}.bind(this));
		};

		/**
		 * This function checks whether the fragment is resolved successfully.
		 * @param {string} sUrl Full URL
		 * @returns {boolean} Returns 'true' if the fragment is resolved successfully.
		 * @private
		 */
		CollaborationHelper._isMinificationFeasible = async function(sUrl) {
			const UshellContainer = sap.ui.require("sap/ushell/Container");
			if (UshellContainer) {
				const oNavTargetResolution = await UshellContainer.getServiceAsync("NavTargetResolution");
				const oURLParsing = await UshellContainer.getServiceAsync("URLParsing");
				var oParsedShellHash = oURLParsing.parseShellHash(this._extractURLHash(sUrl));
				var iParamsCount = Object.keys(oParsedShellHash.params).length;
				if (iParamsCount > 0) {
					return oNavTargetResolution.resolveHashFragment(`#${oParsedShellHash.semanticObject}-${oParsedShellHash.action}`)
						.then(function(param) {
							return true;
						})
						.catch(function(e) {
							return false;
						});
				} else {
					return Promise.resolve(true);
				}
			}
			return Promise.resolve(false);
		};

		/**
		 * Extracting URL present before the hash character.
		 * @param {string} sUrl Full URL
		 * @returns {string} String before the hash character in the URL.
		 * @private
		 */
		CollaborationHelper._extractURLBeforeHash = function(sUrl) {
			var sUrlFragementBeforeHash = sUrl.split("#")[0];
			return sUrlFragementBeforeHash;
		};

		/**
		 * Extracting the hash from the URL
		 * @param {string} sUrl Full URL
		 * @returns {string} Hash from the URL
		 * @private
		 */
		CollaborationHelper._extractURLHash = function(sUrl) {
			var sUrlHash = sUrl.substring(sUrl.indexOf("#"));
			return sUrlHash;
		};

		/**
		 * This function saves the hash and the long URL in the key/value DB.
		 * @param {string} sUrl Full URL
		 * @param {AppState} oAppStateService Instance of the AppState
		 * @returns {Promise} Promise which ultimately resolves once the value is stored successfully.
		 * @private
		 */
		CollaborationHelper._storeUrl = function(sUrl, oAppStateService) {
			oAppStateService.setData(sUrl);
			return oAppStateService.save();
		};

		return CollaborationHelper;
	}
);
