/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/uid", "sap/fe/core/AppComponent", "sap/ui/core/Component", "sap/ui/core/ComponentContainer"], function (uid, AppComponent, Component, ComponentContainer) {
  "use strict";

  var _exports = {};
  /**
   * Creates a new instance of an appComponent and templateComponent with the given options.
   * @param options
   * @param options.bindingContextPath The binding context path to use on the templateComponent
   * @param options.mainContextPath The main context path to use for the appComponent
   * @param options.guid
   * @param options.serviceUri
   * @returns The appcomponent and templateComponent to use for testing
   */
  async function initializeSmallComponent(options) {
    const guid = options?.guid ?? uid();
    const id = `sap.fe.test.${guid}`;
    sap.ui.define(`sap/fe/test/${guid}/Component`, ["sap/fe/core/AppComponent"], function (_AppComponent) {
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
                routes: [{
                  pattern: `/test${guid}`,
                  name: "Default",
                  target: "Default"
                }]
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
    const smallComponent = await Component.create({
      name: `sap.fe.test.${guid}`,
      id: id
    });
    await smallComponent.initialized;
    const v = await smallComponent.getRouter().getTarget("Default").load?.();
    const templateComponent = v.object;
    await smallComponent.getMetaModel().fetchEntityContainer();
    return {
      appComponent: smallComponent,
      templateComponent
    };
  }
  _exports.initializeSmallComponent = initializeSmallComponent;
  async function create(options, contentCallback) {
    const {
      appComponent,
      templateComponent
    } = await initializeSmallComponent(options);
    templateComponent.getRootControl().getContent()[0].addContent(templateComponent.runAsOwner(contentCallback));
    appComponent.getRootContainer().addPage(new ComponentContainer({
      component: templateComponent,
      height: "100%",
      propagateModel: true,
      width: "100%",
      lifecycle: "Application"
    }));
    if (options?.bindingContextPath) {
      const model = appComponent.getModel();
      const bindingContext = model.bindContext(options.bindingContextPath, undefined, {
        $$groupId: "$auto.Heroes",
        $$updateGroupId: "$auto",
        $$patchWithoutSideEffects: true
      });
      templateComponent.setBindingContext(bindingContext.getBoundContext());
    }
    return new ComponentContainer({
      component: appComponent,
      height: options.height ?? "100%"
    });
  }
  _exports.create = create;
  return _exports;
}, false);
//# sourceMappingURL=BuildingBlockContext-dbg.js.map
