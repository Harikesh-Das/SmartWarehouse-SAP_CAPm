import type { AnnotationTerm, PropertyAnnotationValue } from "@sap-ux/vocabularies-types";
import type { Boolean as EdmBoolean } from "@sap-ux/vocabularies-types/Edm";
import Log from "sap/base/Log";
import type { BindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, getExpressionFromAnnotation, isPathInModelExpression } from "sap/fe/base/BindingToolkit";
import { defineUI5Class } from "sap/fe/base/ClassSupport";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { bindingContextPathVisitor } from "sap/fe/core/helpers/BindingHelper";
import type Field from "sap/fe/macros/Field";
import type FieldWrapper from "sap/fe/macros/controls/FieldWrapper";
import type Tokenizer from "sap/m/Tokenizer";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import type { Control$ValidateFieldGroupEvent } from "sap/ui/core/Control";
import Element from "sap/ui/core/Element";
import type MultiValueField from "sap/ui/mdc/MultiValueField";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type { FEView } from "../BaseController";
import CommonUtils from "../CommonUtils";
import type { CollaborativeDraftService } from "../services/collaborativeDraftServiceFactory";
import { FieldEditMode } from "../templating/UIFormatters";
import BaseControllerExtension from "./BaseControllerExtension";
import { Activity, CollaborationFieldGroupPrefix, addSelf, shareObject } from "./collaboration/CollaborationCommon";

/**
 * A controller extension to handle collaborative draft scenarios.
 * @since 1.141.0
 * @public
 */
@defineUI5Class("sap.fe.core.controllerextensions.CollaborativeDraft")
export default class CollaborativeDraft extends BaseControllerExtension {
	private lastFocusId: string | undefined;

	private lastFocusFieldGroups: string | undefined;

	private collaborativeDraftService!: CollaborativeDraftService;

	private getCollaborativeDraftService(): CollaborativeDraftService {
		this.collaborativeDraftService = this.collaborativeDraftService ?? this.base.getAppComponent().getCollaborativeDraftService();
		return this.collaborativeDraftService;
	}

	/**
	 * Callback when the focus is set in the Field or one of its children.
	 * @param source
	 * @param focusEvent
	 */
	public handleContentFocusIn(source: Field | MultiValueField, focusEvent?: FocusEvent): void {
		// We send the event only if the focus was previously out of the Field
		if (source.isA<Tokenizer>("sap.m.Tokenizer")) {
			source = source.getParent()?.getParent() as MultiValueField;
		}
		let targetOutsideOfControlDomRef = false;
		if (focusEvent) {
			targetOutsideOfControlDomRef = !source.getDomRef()?.contains(focusEvent.relatedTarget as Node);
		}
		if (source.isA<MultiValueField>("sap.ui.mdc.MultiValueField") || targetOutsideOfControlDomRef) {
			// We need to handle the case where the newly focused Field is different from the previous one, but they share the same fieldGroupIDs
			// (e.g. fields in different rows in the same column of a table)
			// In such case, the focusOut handler was not called (because we stay in the same fieldGroupID), so we need to send a focusOut event manually
			const lastFocusId = this.getLastFocusId();
			if (lastFocusId && lastFocusId !== source.getId() && this.getLastFocusFieldGroups() === source.getFieldGroupIds().join(",")) {
				const lastFocused = Element.getElementById(lastFocusId) as Field;
				this?.sendFocusOutMessage(lastFocused);
			}

			this.setLastFocusInformation(source);

			this.sendFocusInMessage(source);
		}
	}

	/**
	 * Callback when the focus is removed from the Field or one of its children.
	 * @param fieldGroupEvent
	 */
	public handleContentFocusOut(fieldGroupEvent: Control$ValidateFieldGroupEvent): void {
		let control: ManagedObject | null = fieldGroupEvent.getSource();
		if (control.isA<Tokenizer>("sap.m.Tokenizer")) {
			control = control.getParent()?.getParent() as MultiValueField;
		}
		if (!control.isA<MultiValueField>("sap.ui.mdc.MultiValueField")) {
			while (control && !control?.isA<Field>("sap.fe.macros.Field")) {
				control = control?.getParent();
			}
			if (!control) return;
		}

		const fieldGroupIds = fieldGroupEvent.getParameter("fieldGroupIds") as string[];

		// We send the event only if the validated fieldCroup corresponds to a collaboration group
		if (
			fieldGroupIds.some((groupId) => {
				return groupId.startsWith(CollaborationFieldGroupPrefix);
			})
		) {
			const sourceControl: Control = fieldGroupEvent.getSource();

			// Determine if the control that sent the event still has the focus (or one of its children).
			// This could happen e.g. if the user pressed <Enter> to validate the input.
			let currentFocusedControl: ManagedObject | null | undefined = Element.getActiveElement();
			while (currentFocusedControl && currentFocusedControl !== sourceControl) {
				currentFocusedControl = currentFocusedControl.getParent();
			}
			if (currentFocusedControl !== sourceControl) {
				// The control that sent the event isn't focused anymore
				this.sendFocusOutMessage(control);
				if (this.getLastFocusId() === control.getId()) {
					this.setLastFocusInformation(undefined);
				}
			}
		}
	}

	/**
	 * Gets the id of the last focused Field (if any).
	 * @returns ID
	 */
	private getLastFocusId(): string | undefined {
		return this.lastFocusId;
	}

	/**
	 * Gets the fieldgroups of the last focused Field (if any).
	 * @returns A string containing the fieldgroups separated by ','
	 */
	private getLastFocusFieldGroups(): string | undefined {
		return this.lastFocusFieldGroups;
	}

	/**
	 * Stores information about the last focused Field (id and fieldgroups).
	 * @param focusedField
	 */
	private setLastFocusInformation(focusedField: Field | MultiValueField | undefined): void {
		this.lastFocusId = focusedField?.getId();
		this.lastFocusFieldGroups = focusedField?.getFieldGroupIds().join(",");
	}

	/**
	 * If collaboration is enabled, send a Lock collaboration message.
	 * @param fieldpAPI
	 */
	private sendFocusInMessage(fieldpAPI: Field | MultiValueField): void {
		const collaborationPath = this.getCollaborationPath(fieldpAPI);

		if (collaborationPath) {
			this.send({ action: Activity.Lock, content: collaborationPath });
		}
	}

	/**
	 * If collaboration is enabled, send an Unlock collaboration message.
	 * @param fieldpAPI
	 */
	private sendFocusOutMessage(fieldpAPI: Field | MultiValueField | undefined): void {
		if (!fieldpAPI) {
			return;
		}
		const collaborationPath = this.getCollaborationPath(fieldpAPI);
		if (collaborationPath) {
			this.send({ action: Activity.Unlock, content: collaborationPath });
		}
	}

	/**
	 * Gets the path used to send collaboration messages.
	 * @param field
	 * @returns The path (or undefined is no valid path could be found)
	 */
	private getCollaborationPath(field: Field | MultiValueField): string | undefined {
		// Note: we send messages even if the context is inactive (empty creation rows),
		// otherwise we can't update the corresponding locks when the context is activated.
		const bindingContext = field?.getBindingContext() as Context | undefined;
		if (!bindingContext) {
			return;
		}
		if (field.isA<Field>("sap.fe.macros.Field")) {
			if (!field.getMainPropertyRelativePath()) {
				return undefined;
			}

			const fieldWrapper = field.content as FieldWrapper | undefined;
			if (
				![FieldEditMode.Editable, FieldEditMode.EditableDisplay, FieldEditMode.EditableReadOnly].includes(
					fieldWrapper?.getProperty("editMode")
				)
			) {
				// The field is not in edit mode --> no collaboration messages
				return undefined;
			}

			return `${bindingContext.getPath()}/${field.getMainPropertyRelativePath()}`;
		} else if (field.isA<MultiValueField>("sap.ui.mdc.MultiValueField")) {
			const keypath = field.getBindingInfo("items").template.getBindingPath("key");
			return `${bindingContext.getPath()}/${field.getBindingInfo("items").path}/${keypath}`;
		}
	}

	public send(message: {
		action: Activity;
		content: string | string[] | undefined;
		triggeredActionName?: string;
		refreshListBinding?: boolean;
		actionRequestedProperties?: string[];
	}): void {
		this.getCollaborativeDraftService().send(this.getView(), message);
	}

	public isConnected(): boolean {
		return this.getCollaborativeDraftService().isConnected(this.getView());
	}

	public async connect(draftRootContext: Context): Promise<void> {
		return this.getCollaborativeDraftService().connect(draftRootContext, this.getView() as FEView);
	}

	public disconnect(): void {
		const uiModel = this.getView().getModel("ui") as JSONModel;
		this.cleanDraftRoot();
		uiModel.setProperty("/hasCollaborationAuthorization", undefined);

		if (this.isConnected()) {
			this.getCollaborativeDraftService().disconnect(this.getView() as FEView);
		}
	}

	public isCollaborationEnabled(): boolean {
		return this.getCollaborativeDraftService().isCollaborationEnabled(this.getView());
	}

	public retainAsyncMessages(activityPaths: string | string[]): void {
		return this.getCollaborativeDraftService().retainAsyncMessages(this.getView(), activityPaths);
	}

	public releaseAsyncMessages(activityPaths: string | string[]): void {
		return this.getCollaborativeDraftService().releaseAsyncMessages(this.getView(), activityPaths);
	}

	public updateLocksForContextPath(oldContextPath: string, newContextPath: string): void {
		return this.getCollaborativeDraftService().updateLocksForContextPath(this.getView(), oldContextPath, newContextPath);
	}

	private getCurrentDraftRootPath(): string | undefined {
		const internalModel = this.getView().getModel("internal");
		return internalModel?.getProperty("/collaborativeDraftRootPath");
	}

	private getDraftShareActionOperationAvailablePromise(): Promise<boolean> | undefined {
		const internalModel = this.getView().getModel("internal");
		return internalModel?.getProperty("/collaborativeDraftShareActionOperationAvailablePromise");
	}

	private isInitialShare(): boolean {
		const internalModel = this.getView().getModel("internal");
		return internalModel?.getProperty("/collaborativeDraftShareInitial") === true;
	}

	setInitialShare(isInitial: boolean): void {
		const internalModel = this.getView().getModel("internal") as JSONModel;
		internalModel?.setProperty("/collaborativeDraftShareInitial", isInitial);
	}

	/**
	 * Sets the draft root context for the collaboration.
	 * Its path is stored in the internal model, so that it can be used later to check if the collaboration is active.
	 * It also retrieves the list of users invited in the draft and stores it in the internal model.
	 * @param draftRootContext The context for the draft root
	 */
	public setDraftRoot(draftRootContext: Context): void {
		const internalModel = this.getView().getModel("internal") as JSONModel;
		const shareActionOperationAvailablePromise: Promise<boolean | undefined> = this.getShareActionOperationAvailable(draftRootContext);
		internalModel?.setProperty("/collaborativeDraftShareActionOperationAvailablePromise", shareActionOperationAvailablePromise);
		internalModel?.setProperty("/collaborativeDraftRootPath", draftRootContext.getPath());
	}

	/**
	 * Cleans the draft root context and the list of users invited in the draft.
	 * This is called when the collaboration is deactivated or when the draft root context changes.
	 */
	private cleanDraftRoot(): void {
		const internalModel = this.getView().getModel("internal") as JSONModel;
		internalModel?.setProperty("/collaborativeDraftShareActionOperationAvailablePromise", undefined);
		internalModel?.setProperty("/collaborativeDraftRootPath", undefined);
	}

	/**
	 * Activates the collaboration for the given page context.
	 * Checks if the current user is authorized to collaborate on the draft, and sets the flag in the UI model accordingly.
	 * @param pageContext The page context (not necessarily a draft root)
	 * @param isActiveEntity Is the context the active one (not a draft)?
	 * @returns True if the user is authorized to collaborate, false otherwise.
	 */
	async activateCollaboration(pageContext: Context, isActiveEntity: boolean): Promise<boolean> {
		try {
			const uiModel = this.getView().getModel("ui") as JSONModel;
			if (isActiveEntity) {
				// We're not in a draft -> disconnect if we were connected before
				uiModel.setProperty("/showCollaborationStrip", undefined);
				this.disconnect();
				return false;
			}

			const draftRootContext = CommonUtils.findOrCreateRootContext(
				pageContext,
				"Draft",
				this.getView(),
				this.base.getAppComponent(),
				{ $$groupId: pageContext.getGroupId(), $select: "DraftAdministrativeData/DraftAdministrativeUser" }
			).rootContext;
			if (!draftRootContext) {
				Log.error("Couldn't find draft root context for enabling collaboration");
				return false;
			}

			const currentDraftRootPath = this.getCurrentDraftRootPath();
			if (currentDraftRootPath !== undefined && currentDraftRootPath !== draftRootContext.getPath()) {
				Log.error(
					`Unexpected path for checking collaboration authorizations: ${draftRootContext.getPath()} (expecting ${currentDraftRootPath})`
				);
			}

			if (uiModel.getProperty("/hasCollaborationAuthorization") !== undefined) {
				return uiModel.getProperty("/hasCollaborationAuthorization"); // Already checked, all good
			}
			const isShareActionOperationAvailable = await this.getDraftShareActionOperationAvailablePromise();
			uiModel.setProperty("/hasCollaborationAuthorization", isShareActionOperationAvailable);
			uiModel.setProperty("/showCollaborationStrip", !isShareActionOperationAvailable);

			this.connect(draftRootContext).catch((error) => {
				Log.error("Error when connecting to the collaboration draft " + error);
			});

			return !!isShareActionOperationAvailable;
		} catch (err) {
			Log.error("Error while activating the collaborative draft " + err);
			return false;
		}
	}

	getShareActionOperationAvailableBindingExpression(
		draftRootContext: Context,
		getODataCacheValue?: boolean
	): BindingToolkitExpression<boolean> | boolean | undefined {
		const metaModel = draftRootContext.getModel()?.getMetaModel();
		const entitySet = metaModel?.getMetaPath(draftRootContext.getPath());
		const metaContext = metaModel?.getMetaContext(draftRootContext.getPath());
		const objectPath = metaContext && getInvolvedDataModelObjects(metaContext);
		const shareActionName = metaModel?.getObject(`${entitySet}@com.sap.vocabularies.Common.v1.DraftRoot/ShareAction`);
		const action = objectPath?.convertedTypes.actions.find((action) => {
			return action.fullyQualifiedName.startsWith(shareActionName);
		});
		const bindingParameterFullName = action?.isBound ? action.parameters[0]?.fullyQualifiedName : undefined;
		const bindingExpression = getExpressionFromAnnotation(
			action?.annotations?.Core?.OperationAvailable as unknown as AnnotationTerm<PropertyAnnotationValue<EdmBoolean>>,
			[],
			undefined,
			(path: string) => bindingContextPathVisitor(path, objectPath?.convertedTypes, bindingParameterFullName)
		);

		if (getODataCacheValue) {
			if (isPathInModelExpression(bindingExpression)) {
				const currentContextWithCache = draftRootContext.getObject();
				if (currentContextWithCache) {
					if (Object.keys(currentContextWithCache).includes(bindingExpression.path)) {
						return currentContextWithCache[bindingExpression.path];
					}
				}
				return undefined;
			}
		} else {
			return bindingExpression;
		}
	}

	async getShareActionOperationAvailable(draftRootContext: Context): Promise<boolean | undefined> {
		const model = draftRootContext.getModel();
		const contextPath = draftRootContext.getPath();
		const bindingExpression = this.getShareActionOperationAvailableBindingExpression(draftRootContext);
		const shareActionOperationAvailableExpression = compileExpression(bindingExpression);
		if (shareActionOperationAvailableExpression === "undefined") {
			return true;
		}
		if (isPathInModelExpression(bindingExpression)) {
			return model
				.bindContext(`${contextPath}`, undefined, { $$groupId: draftRootContext.getGroupId(), $select: [bindingExpression.path] })
				.getBoundContext()
				.requestProperty(bindingExpression.path);
		} else {
			return undefined;
		}
	}

	/**
	 * Adds the current user in the draft root context.
	 * @param pageContext The page context (not necessarily a draft root)
	 */
	async executeShareAction(pageContext: Context): Promise<void> {
		try {
			const draftRootContext = CommonUtils.findOrCreateRootContext(
				pageContext,
				"Draft",
				this.getView(),
				this.base.getAppComponent(),
				{ $$groupId: pageContext.getGroupId(), $select: "DraftAdministrativeData/DraftAdministrativeUser" }
			).rootContext;
			if (!draftRootContext) {
				Log.error("Couldn't find draft root context for enabling collaboration");
				return;
			}

			const currentDraftRootPath = this.getCurrentDraftRootPath();
			if (currentDraftRootPath !== undefined && currentDraftRootPath !== draftRootContext.getPath()) {
				// Collaboration was enabled on another draft --> disconnect first
				this.disconnect();
			}

			if (currentDraftRootPath === draftRootContext.getPath()) {
				return; // share was already called before, we don't need to call the Share action again
			}

			const performShare = async (): Promise<Context | void> =>
				this.isInitialShare()
					? shareObject(draftRootContext, undefined, "$auto.Workers")
					: addSelf(draftRootContext, "$auto.Workers");

			this.setInitialShare(false); // Reset the initial share flag, so that we don't call the initial Share action again
			this.setDraftRoot(draftRootContext);

			const cachedAvailability = this.getShareActionOperationAvailableBindingExpression(draftRootContext, true);
			// On cache hit: call Share immediately if available, skip if not
			// On cache miss (undefined, first load): wait for the actual OData value before deciding,
			// to avoid calling Share against a context where the operation is disabled
			if (cachedAvailability !== false) {
				const availability = cachedAvailability === true ? true : await this.getDraftShareActionOperationAvailablePromise();
				if (availability !== false) {
					await performShare();
				}
			}
		} catch (err) {
			Log.error("Error while adding current user in the collaborative draft " + err);
		}
	}

	/**
	 * Sends a notification to other users that a property has been locked or unlocked by the current user.
	 * @param context The context for the property
	 * @param propertyName The name of the property
	 * @param isLocked True if the property is locked, false if it is unlocked
	 * @public
	 * @since 1.141.0
	 */
	sendLockChange(context: Context, propertyName: string, isLocked: boolean): void {
		this.send({ action: isLocked ? Activity.Lock : Activity.Unlock, content: `${context.getPath()}/${propertyName}` });
	}

	/**
	 * Sends a notification to other users that property values have been changed by the current user.
	 *
	 * This notification must be sent after the changes have been sent successfully to the back end.
	 * @param context The context for the properties
	 * @param propertyNames The property name or the array of property names
	 * @public
	 * @since 1.141.0
	 */
	sendPropertyValuesChange(context: Context, propertyNames: string | string[]): void {
		if (!Array.isArray(propertyNames)) {
			propertyNames = [propertyNames];
		}
		this.send({ action: Activity.Change, content: propertyNames.map((prop) => `${context.getPath()}/${prop}`) });
	}

	/**
	 * Sends a notification to other users that new contexts have been created by the current user.
	 *
	 * This notification must be sent after the new contexts have been created successfully in the back end.
	 * @param contextsOrBinding The array of newly created contexts, or the binding where the contexts were created
	 * @public
	 * @since 1.141.0
	 */
	sendContextsCreated(contextsOrBinding: Context[] | ODataListBinding): void {
		if (Array.isArray(contextsOrBinding)) {
			this.send({ action: Activity.Create, content: contextsOrBinding.map((context) => context.getPath()) });
		} else {
			this.send({ action: Activity.Create, content: contextsOrBinding.getResolvedPath() ?? contextsOrBinding.getPath() });
		}
	}

	/**
	 * Sends a notification to other users that contexts have been deleted by the current user.
	 *
	 * This notification must be sent after the contexts have been deleted successfully in the back end.
	 * @param contexts The array of deleted contexts
	 * @public
	 * @since 1.141.0
	 */
	sendContextsDeleted(contexts: Context[]): void {
		this.send({ action: Activity.Delete, content: contexts.map((context) => context.getPath()) });
	}
}
