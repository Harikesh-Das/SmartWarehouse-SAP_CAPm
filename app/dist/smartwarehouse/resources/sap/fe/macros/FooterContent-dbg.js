/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/controls/CommandExecution", "sap/fe/core/converters/ManifestSettings", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/converters/controls/Common/Action", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/FPMHelper", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/library", "sap/fe/core/templating/CriticalityFormatters", "sap/fe/macros/messages/MessageButton", "sap/m/Button", "sap/m/DraftIndicator", "sap/m/Menu", "sap/m/MenuButton", "sap/m/MenuItem", "sap/m/OverflowToolbar", "sap/m/ToolbarSpacer", "sap/ui/core/CustomData", "sap/ui/core/InvisibleText", "sap/fe/base/HookSupport", "sap/fe/core/helpers/ActionUtilities", "sap/fe/templates/ObjectPage/ObjectPageTemplating", "sap/m/OverflowToolbarLayoutData", "sap/m/ToolbarSeparator", "sap/ui/model/json/JSONModel", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/Fragment", "sap/fe/base/jsx-runtime/jsxs"], function (Log, BindingToolkit, ClassSupport, BuildingBlock, CommandExecution, ManifestSettings, MetaModelConverter, DataField, Action, BindingHelper, FPMHelper, ModelHelper, library, CriticalityFormatters, MessageButton, Button, DraftIndicator, Menu, MenuButton, MenuItem, OverflowToolbar, ToolbarSpacer, CustomData, InvisibleText, HookSupport, ActionUtilities, ObjectPageTemplating, OverflowToolbarLayoutData, ToolbarSeparator, JSONModel, _jsx, _Fragment, _jsxs) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6;
  var _exports = {};
  var controllerExtensionHandler = HookSupport.controllerExtensionHandler;
  var UI = BindingHelper.UI;
  var Draft = BindingHelper.Draft;
  var getCreateNextButtonVisibility = Action.getCreateNextButtonVisibility;
  var ButtonType = Action.ButtonType;
  var aiIcon = Action.aiIcon;
  var isActionWithDialog = DataField.isActionWithDialog;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var ActionType = ManifestSettings.ActionType;
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var defineReference = ClassSupport.defineReference;
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var ifElse = BindingToolkit.ifElse;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  let FooterContent = (_dec = defineUI5Class("sap.fe.macros.FooterContent"), _dec2 = implementInterface("sap.ui.core.Toolbar"), _dec3 = implementInterface("sap.m.IBar"), _dec4 = property({
    type: "string",
    required: true
  }), _dec5 = property({
    type: "string",
    required: true
  }), _dec6 = property({
    type: "string"
  }), _dec7 = defineReference(), _dec8 = controllerExtensionHandler("routing", "onAfterBinding"), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function FooterContent(props, others) {
      var _this;
      _this = _BuildingBlock.call(this, props, others) || this;
      _initializerDefineProperty(_this, "__implements__sap_ui_core_Toolbar", _descriptor, _this);
      _initializerDefineProperty(_this, "__implements__sap_m_IBar", _descriptor2, _this);
      _initializerDefineProperty(_this, "id", _descriptor3, _this);
      _initializerDefineProperty(_this, "metaPath", _descriptor4, _this);
      _initializerDefineProperty(_this, "contextPath", _descriptor5, _this);
      _initializerDefineProperty(_this, "cmdExecution", _descriptor6, _this);
      _this._hideCreateNext = false;
      return _this;
    }
    _exports = FooterContent;
    _inheritsLoose(FooterContent, _BuildingBlock);
    var _proto = FooterContent.prototype;
    _proto.onAfterBinding = async function onAfterBinding() {
      if (this._hiddenDraft) {
        const controller = this._getOwner()?.getRootController();
        const viewContext = controller.getView().getBindingContext();
        const metaModel = viewContext?.getModel?.()?.getMetaModel?.();
        if (metaModel && viewContext && ModelHelper.isDraftSupported(metaModel, viewContext.getPath())) {
          const isNewObject = await controller.editFlow.isRootContextNew(viewContext);
          this.getModel("footerInternal").setProperty("/rootIsNewObject", isNewObject);
        }
      }
    };
    _proto.initialize = function initialize() {
      const owner = this._getOwner();
      this.setModel(new JSONModel(), "footerInternal");
      this.actions = owner?.preprocessorContext?.bindingContexts?.converterContext?.getObject("footerActions");
      const contextPathToUse = owner?.preprocessorContext?.fullContextPath;
      this.oDataMetaModel = owner?.preprocessorContext?.models.metaModel;
      this.dataViewModelPath = this.getDataModelObjectForMetaPath(this.metaPath, contextPathToUse ?? this.contextPath);
      const startingEntitySet = this.dataViewModelPath.startingEntitySet;
      this.isDraftValidation = !!(ModelHelper.getDraftRoot(startingEntitySet)?.PreparationAction && startingEntitySet?.entityType.annotations.Common?.Messages);
      this.content = this.createContent();
    }

    /**
     * Handler for the onMetadataAvailable event.
     */;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      const controller = this._getOwner()?.getRootController();
      this._hiddenDraft = controller.getAppComponent().getEnvironmentCapabilities().getCapabilities().HiddenDraft?.enabled;
      this._hideCreateNext = controller.getAppComponent().getEnvironmentCapabilities().getCapabilities().HiddenDraft?.hideCreateNext === true;
      if (!this.content) {
        this.initialize();
      }
    };
    _proto.getActionModelPath = function getActionModelPath(action) {
      const annotationPath = action.annotationPath;
      if (annotationPath) {
        const actionContext = this.oDataMetaModel.getContext(annotationPath);
        return getInvolvedDataModelObjects(actionContext);
      }
      return undefined;
    };
    _proto.getDraftIndicator = function getDraftIndicator() {
      const entitySet = this.dataViewModelPath.targetEntitySet || this.dataViewModelPath.startingEntitySet; // startingEntitySet is used on containment scenario
      const commonAnnotation = entitySet.annotations?.Common;
      if ((commonAnnotation?.DraftRoot || commonAnnotation?.DraftNode) && !this._hiddenDraft) {
        return _jsx(DraftIndicator, {
          state: "{ui>/draftStatus}",
          visible: "{ui>/isEditable}"
        });
      }
      return undefined;
    };
    _proto.getApplyButton = function getApplyButton(emphasizedExpression) {
      const controller = this._getOwner()?.getRootController();
      const viewData = controller.getView().getViewData();
      if (viewData?.viewLevel != null && viewData?.viewLevel <= 1 || this._hiddenDraft) {
        return null;
      }
      if (this.isDraftValidation && !viewData.isDesktop && !viewData.fclEnabled) {
        return _jsx(MenuButton, {
          text: "{sap.fe.i18n>T_COMMON_OBJECT_PAGE_APPLY_DRAFT}",
          defaultAction: async () => {
            await controller._applyDocument(controller.getView().getBindingContext());
          },
          useDefaultActionOnly: "true",
          buttonMode: "Split",
          type: emphasizedExpression,
          "dt:designtime": "not-adaptable",
          children: _jsx(Menu, {
            children: _jsx(MenuItem, {
              text: "{sap.fe.i18n>T_COMMON_OBJECT_PAGE_VALIDATE_DRAFT}",
              press: async () => {
                await controller._validateDocument();
              }
            })
          })
        });
      }
      return _jsx(Button, {
        id: this.createId("StandardAction::Apply"),
        text: "{sap.fe.i18n>T_COMMON_OBJECT_PAGE_APPLY_DRAFT}",
        type: emphasizedExpression,
        enabled: true,
        press: async () => {
          await controller._applyDocument(controller.getView().getBindingContext());
        },
        visible: "{ui>/isEditable}",
        "dt:designtime": "not-adaptable"
      });
    };
    _proto.getMenuItemsForSaveAndBack = function getMenuItemsForSaveAndBack() {
      return [_jsx(MenuItem, {
        id: this.createId("StandardAction::MenuSave"),
        text: this.getTextSaveButton(),
        tooltip: "{sap.fe.i18n>SAVE_SHORTCUT_DESCRIPTION}",
        "jsx:command": "cmd:Save|press"
      }), _jsx(MenuItem, {
        id: this.createId("StandardAction::MenuSaveAndBack"),
        text: this.getTextSaveButton(true),
        tooltip: "{sap.fe.i18n>SAVEANDBACK_SHORTCUT_DESCRIPTION}",
        "jsx:command": "cmd:SaveAndBack|press"
      })];
    };
    _proto.getPrimary = function getPrimary(emphasizedExpression, action) {
      const controller = this._getOwner()?.getRootController();
      const hiddenDraft = controller.getAppComponent().getEnvironmentCapabilities().getCapabilities().HiddenDraft?.enabled;
      const saveAndLeaveEnabled = controller.getAppComponent().getEnvironmentCapabilities().getCapabilities().enableSaveAndLeave;
      const viewData = controller.getView().getViewData();
      const draftValidationAndNotDesktop = this.isDraftValidation && !viewData.isDesktop;
      controller.getView().addDependent(_jsx(CommandExecution, {
        ref: this.cmdExecution,
        command: "Save",
        execute: () => {
          controller._saveDocument(false, false);
        },
        visible: or(ifElse(hiddenDraft === true, ifElse(viewData.fclEnabled === true, and(UI.IsEditable, equal(pathInModel("/showSaveAndCancelButton", "fclhelper"), true)), UI.IsEditable), UI.IsEditable), equal(pathInModel("/isInlineEditActive", "ui"), true))
      }));
      if (saveAndLeaveEnabled) {
        controller.getView().addDependent(_jsx(CommandExecution, {
          ref: this.cmdExecution,
          command: "SaveAndBack",
          execute: () => {
            controller._saveDocument(false, true);
          },
          visible: or(ifElse(hiddenDraft === true, ifElse(viewData.fclEnabled === true, and(UI.IsEditable, equal(pathInModel("/showSaveAndCancelButton", "fclhelper"), true)), UI.IsEditable), UI.IsEditable), equal(pathInModel("/isInlineEditActive", "ui"), true))
        }));
      }
      if (draftValidationAndNotDesktop) {
        const menuItems = [];
        if (saveAndLeaveEnabled) {
          menuItems.push(...this.getMenuItemsForSaveAndBack());
        }
        menuItems.push(_jsx(MenuItem, {
          text: "{sap.fe.i18n>T_COMMON_OBJECT_PAGE_VALIDATE_DRAFT}",
          press: async () => {
            await controller._validateDocument();
          }
        }));
        return _jsx(MenuButton, {
          text: this.getTextSaveButton(),
          "jsx:command": "cmd:Save|defaultAction",
          useDefaultActionOnly: "true",
          buttonMode: "Split",
          type: emphasizedExpression,
          visible: compileExpression(ifElse(hiddenDraft === true, ifElse(viewData.fclEnabled === true, and(UI.IsEditable, equal(pathInModel("/showSaveAndCancelButton", "fclhelper"), true)), UI.IsEditable), UI.IsEditable)),
          "dt:designtime": "not-adaptable",
          children: _jsx(Menu, {
            children: menuItems
          })
        });
      }
      if (saveAndLeaveEnabled) {
        const visibleExpression = compileExpression(ifElse(hiddenDraft === true, ifElse(viewData.fclEnabled === true, and(UI.IsEditable, equal(pathInModel("/showSaveAndCancelButton", "fclhelper"), true)), UI.IsEditable), UI.IsEditable));
        return _jsxs(_Fragment, {
          children: [_jsx(Button, {
            id: this.createId("StandardAction::Save"),
            text: this.getTextSaveButton(),
            type: emphasizedExpression,
            visible: visibleExpression,
            enabled: true,
            "jsx:command": "cmd:Save|press",
            "dt:designtime": "not-adaptable",
            children: {
              layoutData: _jsx(OverflowToolbarLayoutData, {
                priority: action?.priority,
                group: action?.group
              })
            }
          }), _jsx(Button, {
            id: this.createId("StandardAction::SaveAndBack"),
            text: this.getTextSaveButton(true),
            type: "Ghost",
            visible: visibleExpression,
            enabled: true,
            "jsx:command": "cmd:SaveAndBack|press",
            "dt:designtime": "not-adaptable",
            children: {
              layoutData: _jsx(OverflowToolbarLayoutData, {
                priority: action?.priority,
                group: action?.group
              })
            }
          })]
        });
      } else {
        return _jsx(Button, {
          id: this.createId("StandardAction::Save"),
          text: this.getTextSaveButton(),
          type: emphasizedExpression,
          visible: compileExpression(ifElse(hiddenDraft === true, ifElse(viewData.fclEnabled === true, and(UI.IsEditable, equal(pathInModel("/showSaveAndCancelButton", "fclhelper"), true)), UI.IsEditable), UI.IsEditable)),
          enabled: true,
          "jsx:command": "cmd:Save|press",
          "dt:designtime": "not-adaptable",
          children: {
            layoutData: _jsx(OverflowToolbarLayoutData, {
              priority: action?.priority,
              group: action?.group
            })
          }
        });
      }
    };
    _proto.getTextSaveButton = function getTextSaveButton(saveAndLeave) {
      const saveButtonText = saveAndLeave ? this.getTranslatedText("T_OP_OBJECT_PAGE_SAVEANDBACK") : this.getTranslatedText("T_OP_OBJECT_PAGE_SAVE");
      const createButtonText = saveAndLeave ? this.getTranslatedText("T_OP_OBJECT_PAGE_CREATEANDBACK") : this.getTranslatedText("T_OP_OBJECT_PAGE_CREATE");
      // If we're in sticky mode  -> the ui is in create mode, show Create, else show Save
      // If not -> we're in draft or hidden draft
      // In case of draft if it is a new object (!IsActiveEntity && !HasActiveEntity), show create, else show save
      // In case of hidden draft the button shows up in all pages and follows the below criteria
      // 		If the root object is a new object (!IsActiveEntity && !HasActiveEntity) then all pages should show Create.
      // 		If the roor object is not a new object then all pages should show Save.
      return ifElse(ifElse(this.dataViewModelPath.startingEntitySet.annotations.Session?.StickySessionSupported !== undefined, UI.IsCreateMode, ifElse(this._hiddenDraft, and(pathInModel("/rootIsNewObject", "footerInternal")), Draft.IsNewObject)), createButtonText, saveButtonText);
    };
    _proto.getCancelButton = function getCancelButton(action) {
      const controller = this._getOwner()?.getRootController();
      const hiddenDraft = controller.getAppComponent().getEnvironmentCapabilities().getCapabilities().HiddenDraft?.enabled;
      const viewData = controller.getView().getViewData();
      controller.getView().addDependent(_jsx(CommandExecution, {
        ref: this.cmdExecution,
        command: "Cancel",
        execute: () => {
          controller._cancelDocument({
            cancelButton: "fe::FooterBar::StandardAction::Cancel"
          });
        },
        visible: ifElse(hiddenDraft === true, ifElse(viewData.fclEnabled === true, and(UI.IsEditable, equal(pathInModel("/showSaveAndCancelButton", "fclhelper"), true)), UI.IsEditable), UI.IsEditable)
      }));
      // OverflowToolbarLayoutData setting is needed when the discard button is in the overflow
      return _jsx(Button, {
        id: this.createId("StandardAction::Cancel"),
        text: ModelHelper.isDraftRoot(this.dataViewModelPath.targetEntitySet) && !this._hiddenDraft ? "{sap.fe.i18n>C_COMMON_OBJECT_PAGE_DISCARD_DRAFT}" : "{sap.fe.i18n>C_COMMON_OBJECT_PAGE_CANCEL}",
        "jsx:command": "cmd:Cancel|press",
        visible: compileExpression(ifElse(hiddenDraft === true, ifElse(viewData.fclEnabled === true, and(UI.IsEditable, equal(pathInModel("/showSaveAndCancelButton", "fclhelper"), true)), UI.IsEditable), UI.IsEditable)),
        ariaHasPopup: ifElse(pathInModel("/isDocumentModified", "ui"), constant("Dialog"), constant("None")),
        enabled: true,
        "dt:designtime": "not-adaptable",
        children: {
          layoutData: _jsx(OverflowToolbarLayoutData, {
            priority: action?.priority,
            closeOverflowOnInteraction: false
          })
        }
      });
    };
    _proto.getCreateNextButton = function getCreateNextButton(emphasizedExpression) {
      const controller = this._getOwner()?.getRootController();
      const viewData = controller.getView().getViewData();
      return _jsx(Button, {
        id: this.createId("StandardAction::CreateNext"),
        text: "{sap.fe.i18n>C_COMMON_OBJECT_PAGE_CREATE_NEXT}",
        press: controller.editFlow.createNextDocument,
        type: emphasizedExpression,
        visible: getCreateNextButtonVisibility(this._hiddenDraft, viewData.fclEnabled === true),
        enabled: true,
        "dt:designtime": "not-adaptable",
        children: {
          layoutData: _jsx(OverflowToolbarLayoutData, {
            closeOverflowOnInteraction: false
          })
        }
      });
    };
    _proto.getToolbarSeparator = function getToolbarSeparator(action) {
      return _jsx(ToolbarSeparator, {
        children: {
          layoutData: _jsx(OverflowToolbarLayoutData, {
            group: action.group
          })
        }
      });
    };
    _proto.getDataFieldForActionButton = function getDataFieldForActionButton(action) {
      if (action.annotationPath) {
        const controller = this._getOwner()?.getRootController();
        const annotationPath = action.annotationPath;
        let pressEvent;
        const view = controller.getView();
        const annotationPathContext = this.oDataMetaModel.getContext(annotationPath);
        const dataFieldContextModelPath = getInvolvedDataModelObjects(annotationPathContext);
        const dataFieldForAction = dataFieldContextModelPath.targetObject;
        if (dataFieldForAction) {
          const actionParameters = {
            entitySetName: this.dataViewModelPath.targetEntitySet?.name,
            invocationGrouping: dataFieldForAction.InvocationGrouping === "UI.OperationGroupingType/ChangeSet" ? library.InvocationGrouping.ChangeSet : library.InvocationGrouping.Isolated,
            label: dataFieldForAction.Label?.toString(),
            isNavigable: action.isNavigable,
            defaultValuesExtensionFunction: action.defaultValuesExtensionFunction,
            disableStrictHandling: action.disableStrictHandling
          };
          if (!action.command) {
            pressEvent = {
              press: () => {
                controller.handlers.onCallAction(view, dataFieldForAction.Action, {
                  ...actionParameters,
                  ...{
                    contexts: view.getBindingContext(),
                    model: view.getModel()
                  }
                });
              }
            };
          } else {
            // command coming from the manifest doesn't get the mandatory prefix "cmd:" so we need to add it
            if (!action.command.startsWith("cmd:")) {
              action.command = `cmd:${action.command}`;
            }
            pressEvent = {
              "jsx:command": `${action.command}|press`
            };
          }
          return _jsx(Button, {
            id: this.createId(this.getActionModelPath(action)) + (ActionUtilities.isEmphasizedFirstClone(action) ? ActionUtilities.EMPHASIZED_FIRST_SUFFIX : ""),
            "dt:designtime": this.getDesigntimeForAction(action),
            text: actionParameters.label,
            ...pressEvent,
            ariaHasPopup: isActionWithDialog(dataFieldContextModelPath.targetObject),
            visible: action.visible,
            enabled: action.enabled,
            type: action?.buttonType ?? CriticalityFormatters.buildExpressionForCriticalityButtonType(dataFieldContextModelPath),
            icon: action?.isAIOperation === true ? aiIcon : undefined,
            ariaDescribedBy: action?.isAIOperation === true ? ["fe::AiAction::AriaText"] : undefined,
            children: {
              layoutData: _jsx(OverflowToolbarLayoutData, {
                priority: action.priority,
                group: action.group
              }),
              // Mark the emphasized-first clone as the Ctrl+Enter (FE_PrimaryAction) candidate.
              customData: ActionUtilities.isEmphasizedFirstClone(action) ? [new CustomData({
                key: "fePrimaryActionShortcut",
                value: true
              })] : undefined
            }
          });
        }
      }
    };
    _proto.getManifestButton = function getManifestButton(action) {
      if (ObjectPageTemplating.isManifestAction(action)) {
        let pressEvent;
        if (action.command) {
          pressEvent = {
            "jsx:command": `cmd:${action.command}|press`
          };
        } else {
          pressEvent = {
            press: event => {
              FPMHelper.actionWrapper(event, action.handlerModule, action.handlerMethod, {}).catch(error => Log.error(error));
            }
          };
        }
        return _jsx(Button, {
          id: this.getActionId(action),
          "dt:designtime": this.getDesigntimeForAction(action),
          text: action.text ?? "",
          ...pressEvent,
          type: action.buttonType ?? ButtonType.Transparent,
          visible: action.visible,
          enabled: action.enabled,
          icon: action?.isAIOperation === true ? aiIcon : undefined,
          ariaDescribedBy: action?.isAIOperation === true ? ["fe::AiAction::AriaText"] : undefined,
          children: {
            layoutData: _jsx(OverflowToolbarLayoutData, {
              priority: action.priority,
              group: action.group
            }),
            // Mark the emphasized-first clone as the Ctrl+Enter (FE_PrimaryAction) candidate.
            customData: ActionUtilities.isEmphasizedFirstClone(action) ? [new CustomData({
              key: "fePrimaryActionShortcut",
              value: true
            })] : undefined
          }
        });
      }
    }

    /**
     * Finds all footer emphasized-first clones.
     * These clones are created by insertMultipleEmphasizedFirstClones for footer actions
     * with @UI.Emphasized or manifest isPrimaryAction.
     * @returns Array of emphasized footer clone actions
     */;
    _proto.getEmphasizedFooterClones = function getEmphasizedFooterClones() {
      return this.actions?.filter(action => {
        const isEmphasizedFirstClone = action.key?.endsWith("::EmphasizedFirst");
        // Exclude header clones (header actions with emphFirstVisible property) to avoid false positives
        // Note: Header manifest Menu actions may appear in this.actions but are excluded by the emphFirstVisible check
        const isNotHeaderAction = action.type !== ActionType.Menu;
        return isEmphasizedFirstClone && isNotHeaderAction;
      }) ?? [];
    }

    /**
     * Generates the ID for an action, appending the EmphasizedFirst suffix if it's a clone.
     * @param action Action to generate ID for
     * @returns The generated ID with suffix if applicable
     */;
    _proto.getActionId = function getActionId(action) {
      return this.createId(action.id ?? action.key);
    }

    /**
     * Returns the dt:designtime value for a footer action.
     * - Emphasized-first clones are not adaptable (technical clones, not user-facing).
     * - Actions with dynamic visibility (expression binding) are excluded from adapting the visibility.
     * - Actions with static visibility (true/false) can be fully adapted.
     * @param action Action to get designtime value for
     * @returns The designtime value
     */;
    _proto.getDesigntimeForAction = function getDesigntimeForAction(action) {
      if (ActionUtilities.isEmphasizedFirstClone(action)) {
        return "not-adaptable";
      }
      if (action.visible === "true" || action.visible === "false") {
        return undefined;
      }
      return "not-adaptable-visibility";
    };
    _proto.getActionControls = function getActionControls() {
      // Standard footer actions (Save/Apply/CreateNext) compute their visual type dynamically via emphasizedButtonExpression.
      // To avoid having two emphasized buttons simultaneously, we check if any custom/annotation footer action is
      // explicitly emphasized. If visible, we downgrade standard actions to Ghost and preserve the custom emphasis.

      const emphasizedFooterClones = this.getEmphasizedFooterClones();

      // Build a runtime expression that evaluates to true when any emphasized footer clone is visible
      const anyEmphasizedFooterActionVisible = emphasizedFooterClones.length > 0 ? ActionUtilities.buildAnyActionVisibleExpression(emphasizedFooterClones) : constant(false);

      // Save/Apply should be Ghost when an emphasized footer action is visible, or when any action withcriticality is visible.
      // Also suppress when a criticality action is visible (even if it caused the footer clone to hide).
      const criticalityVisibleExpr = ObjectPageTemplating.buildCriticalityVisibleFromIdentificationExpression(this.dataViewModelPath);
      let emphasizedButtonExpression;
      if (emphasizedFooterClones.length > 0) {
        emphasizedButtonExpression = compileExpression(ifElse(or(anyEmphasizedFooterActionVisible, criticalityVisibleExpr), constant(ButtonType.Ghost), constant(ButtonType.Emphasized)));
      } else {
        emphasizedButtonExpression = ObjectPageTemplating.buildEmphasizedButtonExpression(this.dataViewModelPath);
      }
      return this.actions?.map(action => {
        switch (action.type) {
          case ActionType.DefaultApply:
            return this.getApplyButton(emphasizedButtonExpression);
          case ActionType.DataFieldForAction:
            return this.getDataFieldForActionButton(action);
          case ActionType.Primary:
            const controller = this._getOwner()?.getRootController();
            const viewData = controller.getView().getViewData();
            const viewLevel = viewData?.viewLevel ?? 0;
            if (this._hiddenDraft && !this._hideCreateNext && viewLevel > 1) {
              const emphasizedButtonToolKitExp = emphasizedButtonExpression ? resolveBindingString(emphasizedButtonExpression) : undefined;
              return this.getPrimary(compileExpression(ifElse(Draft.IsNewObject, undefined, emphasizedButtonToolKitExp)));
            }
            return this.getPrimary(emphasizedButtonExpression, action);
          case ActionType.Secondary:
            return this.getCancelButton(action);
          case ActionType.CreateNext:
            if (this._hiddenDraft && !this._hideCreateNext) {
              const emphasizedButtonToolKitExp = emphasizedButtonExpression ? resolveBindingString(emphasizedButtonExpression) : undefined;
              return this.getCreateNextButton(compileExpression(ifElse(Draft.IsNewObject, emphasizedButtonToolKitExp, undefined)));
            }
            return;
          case ActionType.Separator:
            return this.getToolbarSeparator(action);
          default:
            return this.getManifestButton(action);
        }
      }).filter(action => !!action);
    };
    _proto.createContent = function createContent() {
      const controller = this._getOwner()?.getRootController();
      const viewData = controller.getView().getViewData();
      const messageButton = _jsx(MessageButton, {
        id: this.createId("MessageButton"),
        visible: compileExpression(ifElse(this._hiddenDraft === true, ifElse(viewData.fclEnabled === true, and(UI.IsEditable, equal(pathInModel("/showSaveAndCancelButton", "fclhelper"), true)), true), true)),
        messageChange: () => controller._getFooterVisibility(),
        ariaLabelledBy: [this.createId("MessageButton::AriaText")],
        type: "Emphasized",
        ariaHasPopup: "Dialog"
      });
      const footerBar = _jsxs(OverflowToolbar, {
        id: this.createId("_fc"),
        asyncMode: true,
        children: [_jsx(InvisibleText, {
          id: this.createId("MessageButton::AriaText"),
          text: "{sap.fe.i18n>C_COMMON_SAPFE_ERROR_MESSAGES_PAGE_BUTTON_ARIA_TEXT}"
        }), messageButton, _jsx(ToolbarSpacer, {}), this.getDraftIndicator(), this.getActionControls()]
      });
      controller.getView().addDependent(_jsx(CommandExecution, {
        ref: this.cmdExecution,
        command: "OpenMessageButtonMenu",
        execute: () => messageButton.firePress()
      }));
      return footerBar;
    };
    return FooterContent;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_ui_core_Toolbar", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_m_IBar", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "cmdExecution", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _applyDecoratedDescriptor(_class2.prototype, "onAfterBinding", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "onAfterBinding"), _class2.prototype), _class2)) || _class);
  _exports = FooterContent;
  return _exports;
}, false);
//# sourceMappingURL=FooterContent-dbg.js.map
