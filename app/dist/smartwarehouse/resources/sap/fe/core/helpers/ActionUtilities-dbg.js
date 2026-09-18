/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/core/helpers/BindingHelper", "sap/m/library", "../converters/ManifestSettings"], function (Log, BindingToolkit, BindingHelper, library, ManifestSettings) {
  "use strict";

  var _exports = {};
  var ActionType = ManifestSettings.ActionType;
  var OverflowToolbarPriority = library.OverflowToolbarPriority;
  var ButtonType = library.ButtonType;
  var UI = BindingHelper.UI;
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var ifElse = BindingToolkit.ifElse;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  /**
   * Utility functions for action processing and overflow protection.
   * This module hosts small, reusable helpers shared by converters and building blocks.
   */
  const EMPHASIZED_FIRST_SUFFIX = "::EmphasizedFirst";
  _exports.EMPHASIZED_FIRST_SUFFIX = EMPHASIZED_FIRST_SUFFIX;
  const SAVE_ACTION_KEY = "SaveAction";
  _exports.SAVE_ACTION_KEY = SAVE_ACTION_KEY;
  const APPLY_ACTION_KEY = "ApplyAction";
  _exports.APPLY_ACTION_KEY = APPLY_ACTION_KEY;
  const EDIT_ACTION_KEY = "EditAction";

  /**
   * Binding expression that evaluates to true when ListReport header emphasis should be suppressed.
   * Emphasis is suppressed when the FilterBar is visible and liveMode is disabled (Go button gets emphasis instead).
   * This condition is used both in converters and templates to ensure consistency.
   */
  _exports.EDIT_ACTION_KEY = EDIT_ACTION_KEY;
  const LR_EMPHASIS_SUPPRESSION_CONDITION = "{= !${viewData>/hideFilterBar} && !${viewData>/useHiddenFilterBar} && !${viewData>/liveMode} }";

  /**
   * Builds a stable action key for the emphasized-first clone.
   * @param key Base action key
   * @returns The clone key
   */
  _exports.LR_EMPHASIS_SUPPRESSION_CONDITION = LR_EMPHASIS_SUPPRESSION_CONDITION;
  function buildEmphasizedFirstKey(key) {
    return `${key}${EMPHASIZED_FIRST_SUFFIX}`;
  }

  /**
   * Builds a stable action ID for the emphasized-first clone.
   * @param id Base action ID
   * @returns The clone ID
   */
  function buildEmphasizedFirstId(id) {
    return `${id}${EMPHASIZED_FIRST_SUFFIX}`;
  }
  const ActionUtilities = {
    EMPHASIZED_FIRST_SUFFIX,
    // ==========
    // General helpers
    // ==========

    /**
     * Ensures primary actions never overflow by setting priority to NeverOverflow.
     * @param actions Array of actions to process
     * @returns Processed actions with primary action overflow protection
     */
    ensurePrimaryActionNeverOverflows(actions) {
      return actions.map(action => !this.isPrimaryActionType(action) ? action : {
        ...action,
        priority: OverflowToolbarPriority.NeverOverflow
      });
    },
    /**
     * Determines whether an action is a standard FE Primary action type (e.g. Save / Apply).
     * @param action Action to check
     * @returns True if the action has type Primary
     */
    isPrimaryActionType(action) {
      return action.type === ActionType.Primary;
    },
    /**
     * Determines whether an action is a standard draft action (Save or Apply).
     * Draft actions have special handling for emphasis in the footer.
     * @param action Action to check
     * @returns True if the action is SaveAction or ApplyAction
     */
    isDraftAction(action) {
      return action.key === SAVE_ACTION_KEY || action.key === APPLY_ACTION_KEY;
    },
    /**
     * Determines whether an action originates from the manifest (custom action)
     * rather than from annotations.
     * Manifest actions do not have an annotationPath property.
     * @param action Action to check
     * @returns True if the action is a manifest/custom action (no annotationPath)
     */
    isManifestAction(action) {
      return !("annotationPath" in action) || !action.annotationPath;
    },
    /**
     * Returns true when the action is the technical first-position clone used for emphasis.
     * @param action Action to check
     * @returns True if the action is an emphasized-first clone
     */
    isEmphasizedFirstClone(action) {
      return !!action.key && action.key.endsWith(EMPHASIZED_FIRST_SUFFIX);
    },
    /**
     * Sets the overflow priority of an action so that it can be protected from going into the overflow menu.
     * When `enabled` is an expression, the priority is compiled so the protection can switch at runtime.
     * @param action Action to update
     * @param enabled Whether NeverOverflow should be enforced (Boolean or expression)
     * @param fallbackPriority Priority to use when the protection is disabled
     * @returns The updated action
     */
    setNeverOverflowPriority(action, enabled, fallbackPriority) {
      if (typeof enabled === "boolean") {
        action.priority = enabled ? OverflowToolbarPriority.NeverOverflow : fallbackPriority;
        return action;
      }
      // dynamic switch
      const basePriority = fallbackPriority ?? action.priority ?? OverflowToolbarPriority.Low;
      action.priority = compileExpression(ifElse(enabled, constant(OverflowToolbarPriority.NeverOverflow), constant(basePriority)));
      return action;
    },
    // ==========
    // Visibility conditions
    // ==========

    /**
     * Returns the visibility expression for an action.
     * Annotation processing always sets both fields together: `visible = compileExpression(visibleExpression)`.
     * A manifest override (OverrideType.overwrite) updates `visible` only, leaving `visibleExpression` stale.
     * We detect this by comparing `visible` against `compileExpression(visibleExpression)`: divergence means
     * a manifest override occurred, so `visible` is the authoritative source.
     * Note: this relies on `compileExpression` being deterministic. If its output format ever changes,
     * the comparison would fall through to `visibleExpression` silently. TODO: A `visibleOverridden` flag on
     * BaseAction would be more robust.
     * @param action Action for which to compute visibility
     * @param fallback Fallback visibility when neither `visible` nor `visibleExpression` is provided
     * @returns The visibility expression
     */
    getActionVisibleExpression(action) {
      let fallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      if (action.visibleExpression !== undefined) {
        if (action.visible === undefined || action.visible === compileExpression(action.visibleExpression)) {
          return action.visibleExpression;
        }
      }
      if (action.visible !== undefined) {
        return resolveBindingString(action.visible, "boolean");
      }
      return resolveBindingString(fallback, "boolean");
    },
    /**
     * Builds an OR-combination of visibility expressions for a list of actions.
     * This is used to create runtime conditions such as "footer is shown" or "any criticality action is visible".
     * @param actions Actions to evaluate
     * @param include Optional filter to decide which actions participate in the OR (default: include all)
     * @returns The combined visibility expression that evaluates to true when any of the included actions is visible at runtime.
     *          Returns constant(false) if no actions match the criteria.
     */
    buildAnyActionVisibleExpression(actions, include) {
      const exprs = [];
      for (const action of actions) {
        if (include && !include(action)) {
          continue;
        }
        exprs.push(this.getActionVisibleExpression(action, false));
      }
      return exprs.length ? or(...exprs) : constant(false);
    },
    /**
     * Builds an expression that evaluates to true when at least one criticality action is visible on the ObjectPage.
     * If this becomes true at runtime, emphasis must be suppressed everywhere on the page.
     * @param headerActions Header actions
     * @param footerActions Footer actions
     * @returns Expression that evaluates to true when any criticality action is visible
     */
    buildCriticalityVisibleExpr(headerActions, footerActions) {
      const allActions = [...headerActions, ...footerActions];
      return this.buildAnyActionVisibleExpression(allActions, action => action.hasCriticality === true);
    },
    // ==========
    // Emphasis application and post-processing
    // ==========

    /**
     * Removes emphasis from an action or a list of actions.
     * This resets the `buttonType` when it is emphasized.
     * @param actions Action or list of actions to reset
     */
    resetEmphasis(actions) {
      const list = Array.isArray(actions) ? actions : [actions];
      for (const action of list) {
        if (!action) {
          continue;
        }
        if (action.buttonType === ButtonType.Emphasized) {
          action.buttonType = undefined;
        }
      }
    },
    // ==========
    // Manifest-driven primaryAction (ObjectPage / ListReport)
    // ==========

    /**
     * Finds the first manifest custom action marked as primary (isPrimaryAction=true).
     * Primary actions receive emphasis and appear as the main call-to-action.
     * @param manifestActions Manifest actions map (key -> action definition)
     * @returns An object containing the key and action of the first primary candidate,
     *          or an empty object {} if no primary action is found
     */
    findPrimaryActionCandidateFromManifestRecord(manifestActions) {
      if (!manifestActions) {
        return {};
      }
      for (const [key, action] of Object.entries(manifestActions)) {
        if (action?.isPrimaryAction === true) {
          return {
            key,
            action
          };
        }
      }
      return {};
    },
    /**
     * Finds the first action in an array that is marked as primary.
     * @param actions Actions to search
     * @returns The first primary action, if any
     */
    findPrimaryActionCandidateFromActionsArray(actions) {
      return (actions ?? []).find(action => action.isPrimaryAction === true);
    },
    /**
     * Applies emphasis based on the manifest custom action flag `primaryAction`.
     * On ObjectPage, `manifestActions` is provided as a record of custom actions coming from the manifest.
     * On ListReport, no `manifestActions` record is passed because the actions are already built from the manifest.
     * If no manifest primary action exists, nothing is changed (multiple annotation emphasized actions are supported).
     * If manifest primary actions exist, they are emphasized alongside annotation-based emphasis.
     * Manifest actions get priority through their position in the actions array (manifest actions are inserted before annotations).
     * Supports multiple manifest actions with isPrimaryAction for cascading priority (e.g., with dynamic visibility).
     * Menu items cannot be emphasized, but a menu button may be emphasized through its defaultAction.
     * @param pageActions Actions available on the page at this stage
     * @param manifestActions Custom actions record coming from the manifest on ObjectPage
     */
    applyManifestPrimaryActionEmphasis(pageActions, manifestActions) {
      // Extract ALL primary action keys from the manifest or page actions
      let primaryKeysFromManifest;
      if (manifestActions) {
        // ObjectPage: extract primary keys from manifest record
        primaryKeysFromManifest = Object.values(manifestActions).filter(action => action.isPrimaryAction === true).map(action => action.key);
      } else {
        // ListReport: extract primary keys from built actions (actions already have isPrimaryAction property)
        primaryKeysFromManifest = pageActions.filter(action => action.isPrimaryAction === true).map(action => action.key);
      }

      // Only proceed if at least one manifest action with isPrimaryAction exists.
      // If no manifest primary action exists, annotation-based emphasis is left untouched (multi-emphasized cascade supported).
      if (primaryKeysFromManifest.length === 0) {
        return;
      }
      const targetActions = pageActions.filter(action => primaryKeysFromManifest.includes(action.key));
      if (targetActions.length === 0) {
        // Log error to inform developer that their isPrimaryAction setting is not working
        const missingKeys = primaryKeysFromManifest.filter(key => !pageActions.some(action => action.key === key));
        Log.error(`Manifest action(s) with isPrimaryAction=true not found in page actions: ${missingKeys.join(", ")}. ` + `Verify that the action keys match between manifest configuration and rendered actions.`);
        return;
      }

      // Menus rule: an action within a menu cannot have emphasis, only a MenuButton with a defaultAction can.
      const validTargetActions = targetActions.filter(action => {
        const isMenuCandidate = action.type === ActionType.Menu;
        if (isMenuCandidate && !action?.defaultAction) {
          Log.error(`Action "${action.key}" is marked as isPrimaryAction but cannot be emphasized because it is a menu without a defaultAction. Only menus with a defaultAction can be emphasized.`);
          return false;
        }
        return true;
      });
      if (validTargetActions.length === 0) {
        return;
      }

      // Emphasize all valid manifest primary actions (supports cascading priority).
      // Coexists with annotation-based emphasis. Priority is determined by action order (manifest before annotations).
      for (const targetAction of validTargetActions) {
        targetAction.buttonType = ButtonType.Emphasized;
      }
    },
    /**
     * Reorders actions to ensure manifest primary actions with emphasis come before annotation emphasized actions.
     * This ensures correct cascade priority: manifest → annotation.
     * Manifest actions are identified by the absence of an annotationPath (annotation actions always have one).
     * @param actions Actions to reorder
     * @returns Reordered actions array
     */
    prioritizeManifestEmphasizedActions(actions) {
      const manifestEmphasized = [];
      const annotationEmphasized = [];
      const nonEmphasized = [];
      for (const action of actions) {
        if (action.buttonType === ButtonType.Emphasized) {
          // Check if it's a manifest action (no annotationPath) or annotation action
          if (this.isManifestAction(action)) {
            manifestEmphasized.push(action);
          } else {
            annotationEmphasized.push(action);
          }
        } else {
          nonEmphasized.push(action);
        }
      }

      // Return: manifest emphasized first, then annotation emphasized, then non-emphasized
      return [...manifestEmphasized, ...annotationEmphasized, ...nonEmphasized];
    },
    // ==========
    // Emphasized-first clone helpers
    // ==========

    /**
     * Inserts a cloned action that is shown first and styled as emphasized when the provided condition is true.
     * When emphasis is active, the clone is shown at first position, and the original is hidden.
     * When emphasis is not active, the clone is hidden, and the original is shown at its natural position.
     * @param actions Action array to update in place
     * @param emphasizedAction Emphasized action instance contained in the array
     * @param emphasisActiveExpr Expression that evaluates to true when emphasis should be active
     */
    insertEmphasizedFirstClone(actions, emphasizedAction, emphasisActiveExpr) {
      const emphasizedActionVisibleExpr = this.getActionVisibleExpression(emphasizedAction, false);
      const showCloneExpr = and(emphasizedActionVisibleExpr, emphasisActiveExpr);
      const showOriginalExpr = and(emphasizedActionVisibleExpr, not(emphasisActiveExpr));

      // Create a first-position clone that carries the emphasis and NeverOverflow protection.
      const emphasizedFirstClone = {
        ...emphasizedAction,
        key: buildEmphasizedFirstKey(emphasizedAction.key),
        id: buildEmphasizedFirstId(emphasizedAction.key),
        visibleExpression: showCloneExpr,
        visible: compileExpression(showCloneExpr),
        buttonType: ButtonType.Emphasized,
        priority: OverflowToolbarPriority.NeverOverflow
      };

      // Rewire the original instance: it is only visible when emphasis is not active.
      emphasizedAction.visibleExpression = showOriginalExpr;
      emphasizedAction.visible = compileExpression(showOriginalExpr);
      this.resetEmphasis(emphasizedAction);
      actions.unshift(emphasizedFirstClone);
    },
    /**
     * Builds an expression that evaluates to true when at least one higher-priority emphasized action is visible.
     * Used for cascade logic to determine when lower-priority actions should be displayed in their original position.
     * @param higherPriorityActionsHiddenExprs Array of expressions indicating each higher-priority action is hidden
     * @returns Expression that is true when any higher-priority action is visible, or constant(false) if no higher-priority actions
     */
    buildHigherPriorityActionsVisibleExpr(higherPriorityActionsHiddenExprs) {
      return higherPriorityActionsHiddenExprs.length > 0 ? not(and(...higherPriorityActionsHiddenExprs)) // At least one higher-priority action is visible
      : constant(false); // No higher-priority actions
    },
    /**
     * Inserts emphasized-first clones for multiple emphasized actions with cascading priority.
     * When multiple actions are emphasized (e.g., with dynamic UI.Hidden), this ensures that
     * the first visible emphasized action is displayed first and emphasized, with automatic
     * fallback to the next visible one if the first is hidden.
     *
     * The visibility expressions are built with cascading priority:
     * - Clone1: visible if action1.visible && emphasisActive.
     * - Clone2: visible if action2.visible && !action1.visible && emphasisActive.
     * - Clone3: visible if action3.visible && !action1.visible && !action2.visible && emphasisActive.
     * @param actions Action array to update in place
     * @param emphasizedActions Array of all emphasized actions, in priority order
     * @param emphasisActiveExpr Expression that evaluates to true when emphasis should be active
     */
    insertMultipleEmphasizedFirstClones(actions, emphasizedActions, emphasisActiveExpr) {
      if (emphasizedActions.length === 0) {
        return;
      }

      // If only one emphasized action, use the simple method
      if (emphasizedActions.length === 1) {
        this.insertEmphasizedFirstClone(actions, emphasizedActions[0], emphasisActiveExpr);
        return;
      }

      // Build cascading visibility expressions for multiple emphasized actions
      const higherPriorityActionsHiddenExprs = [];
      const clonesToInsert = [];
      for (let i = 0; i < emphasizedActions.length; i++) {
        const emphasizedAction = emphasizedActions[i];
        const emphasizedActionVisibleExpr = this.getActionVisibleExpression(emphasizedAction, false);

        // Clone is visible when:
        // 1. The action itself is visible
        // 2. All previous emphasized actions are NOT visible (cascading priority)
        // 3. Emphasis is active
        const showCloneExpr = higherPriorityActionsHiddenExprs.length === 0 ? and(emphasizedActionVisibleExpr, emphasisActiveExpr) : and(emphasizedActionVisibleExpr, and(...higherPriorityActionsHiddenExprs), emphasisActiveExpr);

        // Create the emphasized-first clone
        const emphasizedFirstClone = {
          ...emphasizedAction,
          key: buildEmphasizedFirstKey(emphasizedAction.key),
          id: buildEmphasizedFirstId(emphasizedAction.key),
          visibleExpression: showCloneExpr,
          visible: compileExpression(showCloneExpr),
          buttonType: ButtonType.Emphasized,
          priority: OverflowToolbarPriority.NeverOverflow
        };

        // Original action is visible when:
        // - action.visible && (higherPriorityVisible || emphasisInactive)
        // This ensures non-first actions remain visible when higher priority actions are visible
        const higherPriorityActionsVisibleExpr = this.buildHigherPriorityActionsVisibleExpr(higherPriorityActionsHiddenExprs);
        const showOriginalExpr = and(emphasizedActionVisibleExpr, or(higherPriorityActionsVisibleExpr, not(emphasisActiveExpr)));

        // Rewire the original instance
        emphasizedAction.visibleExpression = showOriginalExpr;
        emphasizedAction.visible = compileExpression(showOriginalExpr);
        this.resetEmphasis(emphasizedAction);

        // Collect the clone (will insert all at once to preserve order)
        clonesToInsert.push(emphasizedFirstClone);

        // Add "this action is NOT visible" to the cascade for the next iteration
        higherPriorityActionsHiddenExprs.push(not(emphasizedActionVisibleExpr));
      }

      // Insert all clones at the beginning, in the correct order (higher priority first)
      actions.unshift(...clonesToInsert);
    },
    /**
     * Returns the runtime expression that evaluates to true when ListReport header emphasis should be active.
     * Emphasis is suppressed when the FilterBar is visible and liveMode is disabled (Go button gets emphasis instead).
     * @returns Expression that evaluates to true when header emphasis should be active on the ListReport
     */
    getListReportHeaderEmphasisActiveExpr() {
      // Suppression condition: FilterBar is visible AND liveMode=false.
      // This matches the condition used in ListReport.view.xml to redirect emphasis to the FilterBar Go button.
      const suppressHeaderEmphasisExpr = resolveBindingString(LR_EMPHASIS_SUPPRESSION_CONDITION, "boolean");
      return not(suppressHeaderEmphasisExpr);
    },
    // ==========
    // ObjectPage emphasis helpers (clone / criticality / draft actions)
    // ==========

    /**
     * Returns the action explicitly configured with emphasis.
     * This helper is used by ObjectPage/ListReport pipelines to locate the emphasized action instance.
     * @param actions Actions to inspect
     * @returns The emphasized action, or undefined if none is configured
     */
    getEmphasizedAction(actions) {
      return actions.find(action => action?.buttonType === ButtonType.Emphasized);
    },
    /**
     * Returns all actions explicitly configured with emphasis.
     * This helper is used to handle multiple emphasized actions with dynamic visibility (UI.Hidden).
     * @param actions Actions to inspect
     * @returns Array of all emphasized actions, in order
     */
    getAllEmphasizedActions(actions) {
      return actions.filter(action => action?.buttonType === ButtonType.Emphasized);
    },
    /**
     * Suppresses emphasis on footer actions when any criticality action is visible at runtime.
     * @param footerActions Footer actions to update
     * @param criticalityVisibleExpr Expression that evaluates to true when any criticality action is visible
     */
    suppressFooterEmphasisWhenCriticalityVisible(footerActions, criticalityVisibleExpr) {
      for (const action of footerActions) {
        if (action.buttonType === ButtonType.Emphasized) {
          action.buttonType = compileExpression(ifElse(not(criticalityVisibleExpr), constant(ButtonType.Emphasized), constant(ButtonType.Ghost)));
        }
      }
    },
    /**
     * If a custom or annotation footer action is explicitly emphasized, ensure standard draft actions (Save/Apply)
     * do not override it visually in the footer rendering.
     * @param footerActions Footer actions to update
     */
    ghostDraftActionsIfAnotherFooterActionEmphasized(footerActions) {
      const emphasizedFooter = footerActions.find(footerAction => footerAction?.buttonType === ButtonType.Emphasized);
      if (!emphasizedFooter) {
        return;
      }
      if (this.isDraftAction(emphasizedFooter)) {
        return;
      }
      for (const footerAction of footerActions) {
        if (!footerAction || footerAction === emphasizedFooter) {
          continue;
        }
        if (this.isDraftAction(footerAction)) {
          footerAction.buttonType = ButtonType.Ghost;
        }
      }
    },
    /**
     * Updates the EditAction button type so it loses emphasis when another emphasized action is effectively active.
     * This is used to guarantee that only one emphasized action is displayed on the page.
     * @param headerActions Header actions containing EditAction
     * @param suppressEditEmphasisExpr Expression that evaluates to true when EditAction must not be emphasized
     */
    updateEditActionEmphasis(headerActions, suppressEditEmphasisExpr) {
      const editAction = headerActions.find(headerAction => headerAction.key === EDIT_ACTION_KEY);
      if (!editAction) {
        return;
      }
      editAction.buttonType = compileExpression(ifElse(suppressEditEmphasisExpr, constant(ButtonType.Ghost), constant(ButtonType.Emphasized)));
    },
    /**
     * Applies all ObjectPage emphasis rules in a single, ordered pipeline.
     * This centralizes the feature rules so converters remain readable and the execution order is deterministic.
     * @param headerActions Header actions of the ObjectPage
     * @param footerActions Footer actions of the ObjectPage
     * @returns All emphasized header actions (supports multiple with dynamic visibility)
     */
    applyObjectPageEmphasisRules(headerActions, footerActions) {
      // Determine if any action with criticality is visible at runtime (dynamic @UI.Hidden etc.).
      const hasAnyCriticalityAction = headerActions.some(action => action.hasCriticality === true) || footerActions.some(action => action.hasCriticality === true);
      const criticalityVisibleExpr = hasAnyCriticalityAction ? ActionUtilities.buildCriticalityVisibleExpr(headerActions, footerActions) : constant(false);

      // Footer: insert first-position clones for emphasized footer actions.
      // Supports multiple emphasized actions with dynamic visibility (UI.Hidden) via cascading priority.
      // The clones are only visible when the underlying actions are effectively visible without any visible action with a criticality.
      const emphasizedFooterActions = this.getAllEmphasizedActions(footerActions);
      if (emphasizedFooterActions.length > 0) {
        this.insertMultipleEmphasizedFirstClones(footerActions, emphasizedFooterActions, not(criticalityVisibleExpr));
      }

      // Footer visibility expression used as a condition to enable or disable header emphasis.
      // Combines custom/annotation footer actions visibility with standard draft actions visibility (UI.IsEditable).
      const customFooterActionsVisibleExpr = this.buildAnyActionVisibleExpression(footerActions);
      const footerVisibleExpr = or(customFooterActionsVisibleExpr, UI.IsEditable);

      // Header: compute when header emphasis should be enabled or disabled, and keep references to all emphasized actions.
      const {
        emphasizedHeaderActions: emphasizedHeaderActionsRef,
        emphasisActiveExpr: headerEmphasisActiveExpr
      } = this.prepareHeaderEmphasis(headerActions, footerVisibleExpr, criticalityVisibleExpr);

      // Footer: determine at runtime whether a footer emphasized-first clone is actually visible.
      const footerEmphasisActiveExpr = this.buildAnyActionVisibleExpression(footerActions, action => this.isEmphasizedFirstClone(action));

      // EditAction: suppress its emphasis when the footer is visible (regardless of footer emphasis/criticality),
      // when another emphasized action is effectively active, or when any criticality action is visible.
      const suppressEditEmphasisExpr = or(footerVisibleExpr, headerEmphasisActiveExpr ?? constant(false), footerEmphasisActiveExpr, criticalityVisibleExpr);
      this.updateEditActionEmphasis(headerActions, suppressEditEmphasisExpr);

      // When a custom or annotation footer action is emphasized, standard draft actions (Save/Apply)
      // must lose their emphasis to ensure only one emphasized action is visible.
      this.ghostDraftActionsIfAnotherFooterActionEmphasized(footerActions);

      // Criticality: suppress emphasis on footer actions when any criticality action is visible.
      this.suppressFooterEmphasisWhenCriticalityVisible(footerActions, criticalityVisibleExpr);
      return emphasizedHeaderActionsRef ?? [];
    },
    /**
     * Prepares the emphasized header action(s) to switch between active emphasized-first instance(s) and inactive normal instances.
     * Supports multiple emphasized actions with dynamic visibility (UI.Hidden) by creating clones with cascading priority.
     * When the active instance is shown, the action is displayed first and emphasized, and the inactive instance is hidden.
     * When the inactive instance is shown, the action is displayed at its original position without emphasis, and the active instance is hidden.
     * The active instance is shown only when the action is visible, the footer is not shown, and no criticality action is visible.
     * @param headerActions Header actions to update in place
     * @param footerVisibleExpr Expression that evaluates to true when the footer is effectively shown
     * @param criticalityVisibleExpr Expression that evaluates to true when any criticality action is visible
     * @returns An object containing:
     *  - emphasizedHeaderActions: Array of all valid emphasized header actions (excluding those with criticality)
     *  - emphasisActiveExpr: Expression that evaluates to true when any emphasized-first instance should be shown
     */
    prepareHeaderEmphasis(headerActions, footerVisibleExpr, criticalityVisibleExpr) {
      const emphasizedHeaderActions = this.getAllEmphasizedActions(headerActions);
      if (emphasizedHeaderActions.length === 0) {
        return {};
      }

      // Filter out actions with criticality (misconfiguration)
      const validEmphasizedActions = emphasizedHeaderActions.filter(action => {
        if (action.hasCriticality) {
          action.buttonType = undefined;
          return false;
        }
        return true;
      });
      if (validEmphasizedActions.length === 0) {
        return {};
      }

      // Build the combined visibility expression for all emphasized actions
      // An emphasized clone is visible when its action is visible, footer is hidden, and no criticality action is visible
      const emphasisActiveCondition = and(not(footerVisibleExpr), not(criticalityVisibleExpr));

      // Save original visibility expressions BEFORE modifying actions
      const originalVisibilityExprs = new Map();
      for (const action of validEmphasizedActions) {
        originalVisibilityExprs.set(action, this.getActionVisibleExpression(action, false));
      }

      // Update each emphasized action's original instance WITH CASCADING PRIORITY
      const higherPriorityActionsHiddenExprs = [];
      for (let i = 0; i < validEmphasizedActions.length; i++) {
        const emphasizedAction = validEmphasizedActions[i];
        const emphasizedActionVisibleExpr = originalVisibilityExprs.get(emphasizedAction);

        // Active emphasized instance visibility (first position) WITH CASCADE:
        // - First action: visible if action.visible && emphasisActive
        // - Second action: visible if action.visible && !firstAction.visible && emphasisActive
        // - Third action: visible if action.visible && !firstAction.visible && !secondAction.visible && emphasisActive
        const showActiveEmphasizedHeaderInstanceExpr = higherPriorityActionsHiddenExprs.length === 0 ? and(emphasizedActionVisibleExpr, emphasisActiveCondition) : and(emphasizedActionVisibleExpr, and(...higherPriorityActionsHiddenExprs), emphasisActiveCondition);
        emphasizedAction.emphFirstVisible = compileExpression(showActiveEmphasizedHeaderInstanceExpr);

        // Inactive instance visibility (original position, not emphasized)
        // Should be visible when: action.visible && (higherPriorityVisible || emphasisInactive)
        // This ensures the action is still visible when it's not "first" due to higher priority actions being visible
        const higherPriorityActionsVisibleExpr = this.buildHigherPriorityActionsVisibleExpr(higherPriorityActionsHiddenExprs);
        const emphasisInactiveCondition = not(emphasisActiveCondition); // footer || criticality
        const showInactiveHeaderInstanceExpr = and(emphasizedActionVisibleExpr, or(higherPriorityActionsVisibleExpr, emphasisInactiveCondition));
        emphasizedAction.visible = compileExpression(showInactiveHeaderInstanceExpr);

        // Ensure the inactive instance is not emphasized when displayed in its original place
        emphasizedAction.buttonType = ButtonType.Ghost;

        // Overflow protection only when the emphasized-first instance is active
        this.setNeverOverflowPriority(emphasizedAction, showActiveEmphasizedHeaderInstanceExpr, emphasizedAction.priority ?? OverflowToolbarPriority.Low);

        // Add "this action is NOT visible" to the cascade for the next iteration
        higherPriorityActionsHiddenExprs.push(not(emphasizedActionVisibleExpr));
      }

      // Compute the expression that evaluates to true when ANY emphasized action is effectively shown
      const anyEmphasizedCloneVisibleExprs = [];
      for (const action of validEmphasizedActions) {
        // Use ORIGINAL visibility expression saved before we modified action.visible
        const actionVisibleExpr = originalVisibilityExprs.get(action);
        anyEmphasizedCloneVisibleExprs.push(and(actionVisibleExpr, emphasisActiveCondition));
      }
      const showActiveEmphasizedHeaderInstanceExpr = or(...anyEmphasizedCloneVisibleExprs);
      return {
        emphasizedHeaderActions: validEmphasizedActions,
        emphasisActiveExpr: showActiveEmphasizedHeaderInstanceExpr
      };
    }
  };
  return ActionUtilities;
}, false);
//# sourceMappingURL=ActionUtilities-dbg.js.map
