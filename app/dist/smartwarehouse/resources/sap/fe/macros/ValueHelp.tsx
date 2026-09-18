import type { EnhanceWithUI5, PropertiesOf } from "sap/fe/base/ClassSupport";
import { association, defineUI5Class, property } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { isEntitySet } from "sap/fe/core/helpers/TypeGuards";
import FieldHelper from "sap/fe/macros/field/FieldHelper";
import { getValueHelpTemplate } from "sap/fe/macros/internal/valuehelp/ValueHelpTemplating";

import type PageController from "sap/fe/core/PageController";
import type { $ManagedObjectSettings } from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import UI5Element from "sap/ui/core/Element";
import type MDCValueHelp from "sap/ui/mdc/ValueHelp";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";

/**
 * Building block for creating a ValueHelp based on the provided OData V4 metadata.
 * @private
 */
@defineUI5Class("sap.fe.macros.ValueHelp")
export default class ValueHelp extends BuildingBlock<MDCValueHelp | Control> {
	/**
	 * A prefix that is added to the generated ID of the value help.
	 */
	@association({ type: "string" })
	idPrefix?: string;

	/**
	 * Defines the metadata path to the property.
	 */
	@property({ type: "string" })
	metaPath!: string;

	@property({ type: "string" })
	contextPath!: string;

	/**
	 * Indicator whether the value help is for a filter field.
	 */
	@property({ type: "string" })
	conditionModel = "";

	/**
	 * Indicates that this is a value help of a filter field. Necessary to decide if a
	 * validation should occur on the back end or already on the client.
	 */
	@property({ type: "boolean" })
	filterFieldValueHelp = false;

	/**
	 * Specifies the Sematic Date Range option for the filter field.
	 */
	@property({ type: "boolean" })
	useSemanticDateRange = true;

	/**
	 * Specifies whether the ValueHelp can be used with a MultiValueField
	 */
	@property({ type: "boolean" })
	useMultiValueField = false;

	@property({ type: "string" })
	navigationPrefix?: string;

	@property({ type: "boolean" })
	requiresValidation = false;

	@association({ type: "string" })
	// eslint-disable-next-line @typescript-eslint/naming-convention
	_flexId?: string;

	requestGroupId: string | undefined = "$auto.Workers";

	collaborationEnabled = false;

	targetId?: string;

	constructor(props: PropertiesOf<ValueHelp>, others?: PropertiesOf<ValueHelp>) {
		if (props._flexId) {
			props.id = props._flexId + "::Block";
		}
		super(props, others);
	}

	override applySettings(mSettings: $ManagedObjectSettings, oScope?: object): this {
		return super.applySettings(mSettings, oScope);
	}

	static getValueHelpForMetaPath(
		pageController: PageController,
		metaPath: string,
		contextPath: string | undefined,
		metaModel: ODataMetaModel | undefined,
		requiresValidation = false
	): ValueHelp | undefined {
		const dependents = pageController.getView()?.getDependents();
		const targetMetaPath = metaPath.startsWith("/") ? metaPath : contextPath + "/" + metaPath;
		const foundDep = dependents?.find((child) => {
			if (child.isA<EnhanceWithUI5<ValueHelp>>("sap.fe.macros.ValueHelp") && !requiresValidation) {
				const childMetaPath = child.getMetaPath();
				const childContextPath = child.getContextPath();
				const childTargetPath = childMetaPath.startsWith("/") ? childMetaPath : childContextPath + "/" + childMetaPath;
				return childTargetPath === targetMetaPath;
			}
			return false;
		});
		if (!foundDep) {
			const valueHelp = new ValueHelp({
				metaPath: metaPath,
				contextPath: contextPath,
				metaModel: metaModel?.getId(),
				idPrefix: pageController.getView()?.createId("FieldValueHelp"),
				requiresValidation: requiresValidation
			});
			pageController.getView().addDependent(valueHelp);
			if (!valueHelp.getContent() && valueHelp.targetId) {
				const innerValueHelp = UI5Element.getElementById(valueHelp.targetId);
				valueHelp.destroy();
				return innerValueHelp?.getParent() as ValueHelp | undefined;
			}

			return valueHelp;
		} else {
			return foundDep as ValueHelp | undefined;
		}
	}

	onMetadataAvailable(): void {
		if (!this.content) {
			this._getOwner()?.runAsOwner(() => {
				this.content = this.createContent();
			});
		}
	}

	createContent(): Control | MDCValueHelp | undefined {
		const metaContextPath = this.getMetaPathObject(this.metaPath, this.contextPath);
		const metaModel = this._getOwner()?.getMetaModel(this.metaModel);
		if (metaContextPath && metaModel) {
			const entitySetOrSingleton = metaContextPath.getClosestEntitySet();
			if (isEntitySet(entitySetOrSingleton)) {
				this.collaborationEnabled = ModelHelper.isCollaborationDraftSupported(metaModel);
			}

			let metaPath = metaModel.createBindingContext(metaContextPath.getPath());
			if (metaPath) {
				if (this.filterFieldValueHelp) {
					metaPath = metaModel.createBindingContext(FieldHelper.valueHelpPropertyForFilterField(metaPath))!;
				} else {
					metaPath = metaModel.createBindingContext(FieldHelper.valueHelpProperty(metaPath))!;
				}
				const idPrefix = this.idPrefix ?? "ValueHelp";
				const templateResult = getValueHelpTemplate(metaPath, {
					metaPath: metaModel.createBindingContext(metaContextPath.getPath())!,
					contextPath: metaModel.createBindingContext(metaContextPath.getContextPath())!,
					filterFieldValueHelp: this.filterFieldValueHelp,
					useSemanticDateRange: this.useSemanticDateRange,
					useMultiValueField: this.useMultiValueField,
					navigationPrefix: this.navigationPrefix,
					requiresValidation: this.requiresValidation,
					_flexId: this._flexId,
					idPrefix: idPrefix,
					conditionModel: this.conditionModel,
					requestGroupId: this.requestGroupId,
					collaborationEnabled: this.collaborationEnabled
				});
				if (typeof templateResult === "string") {
					this.targetId = templateResult;
					return undefined;
				} else {
					return templateResult;
				}
			}
		}
	}
}
