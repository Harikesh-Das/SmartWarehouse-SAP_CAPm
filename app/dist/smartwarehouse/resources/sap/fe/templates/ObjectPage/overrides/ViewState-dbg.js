/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/core/helpers/KeepAliveHelper", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/library", "sap/fe/templates/ObjectPage/helpers/SectionNavigationHelper"], function (Log, CommonUtils, KeepAliveHelper, ModelHelper, CoreLibrary, SectionNavigationHelper) {
  "use strict";

  var pollForSectionStability = SectionNavigationHelper.pollForSectionStability;
  const VariantManagement = CoreLibrary.VariantManagement;
  const opControlHandlers = {
    retrieve: function (oOPLayout) {
      const controller = this.getView().getController();
      // Get subsection from controller's stored target subsection (set by onNavigateChange or targetControlId navigation)
      const targetSubSection = controller.targetSubSection;
      const selectedSection = oOPLayout.getSelectedSection();
      const selectedSubSection = targetSubSection?.getId() ?? null;
      return {
        selectedSection,
        selectedSubSection
      };
    },
    apply: function (opLayout, controlState) {
      const selectedSection = controlState?.selectedSection;
      const selectedSubSection = controlState?.selectedSubSection;
      if (!selectedSection) {
        return;
      }

      // Check if the selected section is a section or subsection
      const opSectionToSelect = opLayout.getSections().find(section => section.getId() === selectedSection);
      const isSubSectionId = !opSectionToSelect && this.getView().byId(selectedSection)?.isA("sap.uxap.ObjectPageSubSection");
      const controller = this.getView().getController();

      // Determine the target to navigate to: prefer subsection if available
      const navigationTarget = selectedSubSection ?? selectedSection;
      const isNavigatingToSubSection = !!selectedSubSection || isSubSectionId;

      // Determine target section ID for comparison  (needed before pageReady)
      const getTargetSectionId = () => {
        if (isSubSectionId) {
          return opLayout.getSections().find(s => s.getSubSections().some(ss => ss.getId() === navigationTarget))?.getId();
        }
        return selectedSection;
      };

      // Wait for pageReady, then navigate and poll for UX rules reset
      controller.pageReady.waitPageReady().then(async () => {
        const targetSectionId = getTargetSectionId();

        // Skip if no valid target section (e.g., subsection's parent no longer exists)
        // or already on target section - no navigation or polling needed
        if (!targetSectionId || opLayout.getSelectedSection() === targetSectionId) {
          return;
        }
        const performNavigation = () => {
          // Guard: don't navigate if ObjectPageLayout has been destroyed
          if (!opLayout.getDomRef()) {
            return;
          }

          // Guard: don't navigate if already on target section
          const currentSection = opLayout.getSelectedSection();
          if (currentSection === targetSectionId) {
            return;
          }
          if (isNavigatingToSubSection) {
            // For subsection navigation, use navigateToSubSection which handles parent section activation
            const localId = controller.getView().getLocalId(navigationTarget);
            if (localId) {
              controller.getExtensionAPI().navigateToSubSection(localId);
            } else {
              opLayout.scrollToSection(navigationTarget, 0);
            }
          } else if (opSectionToSelect && opSectionToSelect.getVisible() === true) {
            // For section IDs, navigate if section is visible
            opLayout.scrollToSection(selectedSection, 0);
          }
        };

        // Skip navigation and polling on subsequent loads - only restore section during initial load
        // This prevents overriding user's manual tab selection when state is restored later
        const controllerWithFlag = controller;
        if (controllerWithFlag.skipViewStateSectionRestore === true) {
          return;
        }

        // Navigate immediately
        performNavigation();

        // Skip polling if already on target section
        if (opLayout.getSelectedSection() === targetSectionId) {
          return;
        }

        // Poll to detect UX rules reset during initial load
        // Uses shared utility from helpers/SectionNavigationHelper.ts
        await pollForSectionStability({
          getSelectedSection: () => opLayout.getSelectedSection(),
          targetSectionId,
          onResetDetected: performNavigation,
          guardCheck: () => !!opLayout.getDomRef()
        });
        return; // Required by linter rule promise/always-return
      }).catch(() => {
        // ViewState: ObjectPageLayout section state couldn't be applied
        // Don't re-throw - allow page to continue even if navigation fails
      });
    },
    refreshBinding: function (oOPLayout) {
      const oBindingContext = oOPLayout.getBindingContext();
      const oBinding = oBindingContext && oBindingContext.getBinding();
      if (oBinding) {
        const sMetaPath = ModelHelper.getMetaPathForContext(oBindingContext);
        const sStrategy = KeepAliveHelper.getControlRefreshStrategyForContextPath(oOPLayout, sMetaPath);
        if (sStrategy === "self") {
          // Refresh main context and 1-1 navigation properties or OP
          const oModel = oBindingContext.getModel(),
            oMetaModel = oModel.getMetaModel(),
            oNavigationProperties = CommonUtils.getContextPathProperties(oMetaModel, sMetaPath, {
              $kind: "NavigationProperty"
            }) || {},
            aNavPropertiesToRequest = Object.keys(oNavigationProperties).reduce(function (aPrev, sNavProp) {
              if (oNavigationProperties[sNavProp].$isCollection !== true) {
                aPrev.push({
                  $NavigationPropertyPath: sNavProp
                });
              }
              return aPrev;
            }, []),
            aProperties = [{
              $PropertyPath: "*"
            }],
            sGroupId = oBinding.getGroupId();
          oBindingContext.requestSideEffects(aProperties.concat(aNavPropertiesToRequest), sGroupId);
        } else if (sStrategy === "includingDependents") {
          // Complete refresh
          oBinding.refresh();
        }
      } else {
        Log.info(`ObjectPage: ${oOPLayout.getId()} was not refreshed. No binding found!`);
      }
    }
  };
  const ViewStateExtensionOverride = {
    _getObjectPageLayout: function () {
      const view = this.getView();
      const controller = view.getController();
      return controller._getObjectPageLayoutControl();
    },
    /**
     * Get the state handler for ObjectPageLayout in view.
     * @param control The control for state interaction
     * @returns State handler
     */
    _getOPStateHandler: function (control) {
      const viewOP = ViewStateExtensionOverride._getObjectPageLayout.call(this);
      if (viewOP === control) {
        return {
          retrieve: opControlHandlers.retrieve,
          apply: opControlHandlers.apply
        };
      }
    },
    /**
     * Get the refresh handler for ObjectPageLayout in view.
     * @param control The control being refreshed
     * @returns Refresh handler
     */
    _getOPRefreshHandler: function (control) {
      const viewOP = ViewStateExtensionOverride._getObjectPageLayout.call(this);
      if (viewOP === control) {
        return {
          refreshBinding: opControlHandlers.refreshBinding
        };
      }
    },
    /**
     * Pass the state handlers of object page view according to the control in concern.
     * @param control The control for state interaction
     * @param controlStateHandlers State handlers
     */
    adaptControlStateHandler: function (control, controlStateHandlers) {
      const opStateHandler = ViewStateExtensionOverride._getOPStateHandler.call(this, control);
      if (opStateHandler) {
        controlStateHandlers.push(opStateHandler);
      }
    },
    /**
     * Pass the refresh handlers of object page view according to the control being refreshed.
     * @param control The control being refreshed
     * @param controlRefreshHandlers Refresh handlers
     */
    adaptBindingRefreshHandler: function (control, controlRefreshHandlers) {
      const opStateHandler = ViewStateExtensionOverride._getOPRefreshHandler.call(this, control);
      if (opStateHandler) {
        controlRefreshHandlers.refreshBinding = opStateHandler.refreshBinding;
      }
    },
    applyInitialStateOnly: function () {
      return false;
    },
    adaptStateControls: function (aStateControls) {
      const oView = this.base.getView(),
        oViewData = oView.getViewData();
      switch (oViewData.variantManagement) {
        case VariantManagement.Control:
          break;
        case VariantManagement.Page:
        case VariantManagement.None:
          break;
        default:
          throw new Error(`unhandled variant setting: ${oViewData.variantManagement}`);
      }
      aStateControls.push(oView.byId("fe::ObjectPage"));
    },
    adaptBindingRefreshControls: function (aControls) {
      const oView = this.base.getView(),
        sRefreshStrategy = KeepAliveHelper.getViewRefreshInfo(oView),
        oController = oView.getController();
      let aControlsToRefresh = [];
      if (sRefreshStrategy) {
        const oObjectPageControl = oController._getObjectPageLayoutControl();
        aControlsToRefresh.push(oObjectPageControl);
      }
      if (sRefreshStrategy !== "includingDependents") {
        const aViewControls = oController._findTables();
        aControlsToRefresh = aControlsToRefresh.concat(KeepAliveHelper.getControlsForRefresh(oView, aViewControls) || []);
      }
      return aControlsToRefresh.reduce(function (aPrevControls, oControl) {
        if (!aPrevControls.includes(oControl)) {
          aPrevControls.push(oControl);
        }
        return aPrevControls;
      }, aControls);
    }
  };
  return ViewStateExtensionOverride;
}, false);
//# sourceMappingURL=ViewState-dbg.js.map
