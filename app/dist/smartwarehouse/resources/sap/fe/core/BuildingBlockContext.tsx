import uid from "sap/base/util/uid";
import AppComponent from "sap/fe/core/AppComponent";
import type BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import type NavContainer from "sap/m/NavContainer";
import type Page from "sap/m/Page";
import Component from "sap/ui/core/Component";
import ComponentContainer from "sap/ui/core/ComponentContainer";

/**
 * Creates a new instance of an appComponent and templateComponent with the given options.
 * @param options
 * @param options.bindingContextPath The binding context path to use on the templateComponent
 * @param options.mainContextPath The main context path to use for the appComponent
 * @param options.guid
 * @param options.serviceUri
 * @returns The appcomponent and templateComponent to use for testing
 */
export async function initializeSmallComponent(options?: {
	bindingContextPath?: string;
	guid?: string;
	mainContextPath?: string;
	serviceUri?: string;
}): Promise<{ appComponent: AppComponent; templateComponent: TemplateComponent }> {
	const guid = options?.guid ?? uid();
	const id = `sap.fe.test.${guid}`;

	sap.ui.define(`sap/fe/test/${guid}/Component`, ["sap/fe/core/AppComponent"], function (_AppComponent: AppComponent) {
		"use strict";

		return AppComponent.extend(`sap.fe.test.${guid}.Component`, {
			metadata: {
				manifest: {
					"sap.app": {
						id: `test${guid}`,
						title: "App Title",
						dataSources: {
							mainService: {
								uri: options?.serviceUri,
								type: "OData",
								settings: {
									odataVersion: "4.0"
								}
							}
						}
					},
					"sap.ui5": {
						models: {
							"": {
								dataSource: "mainService",
								settings: {
									operationMode: "Server",
									autoExpandSelect: true,
									earlyRequests: true
								}
							}
						},
						routing: {
							targets: {
								Default: {
									type: "Component",
									name: "sap.fe.core.fpm",
									id: "Default",
									options: {
										settings: {
											contextPath: options?.mainContextPath ?? "/",
											viewName: "sap.fe.core.buildingBlockContext.ContainerPage"
										}
									}
								}
							},
							routes: [
								{
									pattern: `/test${guid}`,
									name: "Default",
									target: "Default"
								}
							]
						}
					},
					"sap.fe": {
						app: {
							isBuildingBlockContext: true
						}
					}
				}
			}
		});
	});
	const smallComponent = (await Component.create({ name: `sap.fe.test.${guid}`, id: id })) as AppComponent;
	await smallComponent.initialized;
	const v = await (smallComponent.getRouter().getTarget("Default") as { load?: Function }).load?.();
	const templateComponent = v.object as TemplateComponent;
	await smallComponent.getMetaModel().fetchEntityContainer();
	return { appComponent: smallComponent, templateComponent };
}

export async function create(
	options: {
		bindingContextPath?: string;
		guid?: string;
		height?: string;
		mainContextPath?: string;
		serviceUri?: string;
	},
	contentCallback: () => BuildingBlock
): Promise<ComponentContainer> {
	const { appComponent, templateComponent } = await initializeSmallComponent(options);
	(templateComponent.getRootControl().getContent()[0] as unknown as Page).addContent(templateComponent.runAsOwner(contentCallback));
	(appComponent.getRootContainer() as NavContainer).addPage(
		new ComponentContainer({
			component: templateComponent,
			height: "100%",
			propagateModel: true,
			width: "100%",
			lifecycle: "Application"
		})
	);

	if (options?.bindingContextPath) {
		const model = appComponent.getModel();
		const bindingContext = model.bindContext(options.bindingContextPath, undefined, {
			$$groupId: "$auto.Heroes",
			$$updateGroupId: "$auto",
			$$patchWithoutSideEffects: true
		});
		templateComponent.setBindingContext(bindingContext.getBoundContext());
	}

	return new ComponentContainer({ component: appComponent, height: options.height ?? "100%" });
}
