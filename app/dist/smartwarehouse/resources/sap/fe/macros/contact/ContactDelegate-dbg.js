/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/ui/core/Fragment", "sap/ui/core/util/XMLPreprocessor", "sap/ui/core/XMLTemplateProcessor", "sap/ui/mdc/enums/LinkType", "sap/ui/mdc/LinkDelegate", "sap/ui/model/json/JSONModel"], function (CommonUtils, Fragment, XMLPreprocessor, XMLTemplateProcessor, LinkType, LinkDelegate, JSONModel) {
  "use strict";

  return Object.assign({}, LinkDelegate, {
    /**
     * Method called to do the templating of the popover content.
     * @param payload
     * @param metaModel
     * @param mdcLinkControl
     * @returns  A promise containing the popover content
     */
    _fnTemplateFragment: async function (payload, metaModel, mdcLinkControl) {
      const fragmentName = "sap.fe.macros.contact.ContactQuickView";
      const containingView = CommonUtils.getTargetView(mdcLinkControl);
      const appComponent = CommonUtils.getAppComponent(containingView);
      const preProcessorSettings = {
        bindingContexts: {},
        models: {},
        appComponent
      };
      const contactContext = metaModel.createBindingContext(payload.contact);
      const payloadModel = new JSONModel(payload);
      if (payload.contact && contactContext) {
        preProcessorSettings.bindingContexts = {
          contact: contactContext,
          payload: payloadModel.createBindingContext("/")
        };
        preProcessorSettings.models = {
          contact: metaModel,
          payload: payloadModel
        };
      }
      const fragment = await XMLTemplateProcessor.loadTemplatePromise(fragmentName, "fragment");
      const templateComponent = containingView.getController().getOwnerComponent();
      const templatedFragment = await XMLPreprocessor.process(fragment, {
        name: fragmentName
      }, preProcessorSettings);
      return templateComponent.runAsOwner(async () => {
        return Fragment.load({
          definition: templatedFragment,
          controller: containingView.getController()
        });
      });
    },
    /**
     * Method calls by the mdc.field to determine what should be the content of the popup when mdcLink#open is called.
     * @param mdcLinkControl
     * @returns A promise containing the popover content
     */
    fetchAdditionalContent: async function (mdcLinkControl) {
      const payload = mdcLinkControl.getPayload();
      const navigateRegexpMatch = payload.navigationPath?.match(/{(.*?)}/);
      const binding = mdcLinkControl.getBindingContext()?.getBinding();
      const aggregation = binding?.isA("sap.ui.model.odata.v4.ODataListBinding") ? binding.getAggregation() : undefined;
      const isListBindingAnalytical = aggregation !== undefined && !aggregation.hierarchyQualifier;
      let bindingContext = navigateRegexpMatch && navigateRegexpMatch.length > 1 && navigateRegexpMatch[1] ? mdcLinkControl.getModel().bindContext(navigateRegexpMatch[1], mdcLinkControl.getBindingContext(), {
        $$ownRequest: true
      }) : null;
      if (isListBindingAnalytical && !bindingContext) {
        // in case of analytical binding, we need to have a binding with its own cache to ensure data is properly requested
        bindingContext = mdcLinkControl.getModel().bindContext("", mdcLinkControl.getBindingContext(), {
          $$ownRequest: true
        });
      }
      if (mdcLinkControl.isA("sap.ui.mdc.Link")) {
        const metaModel = mdcLinkControl.getModel().getMetaModel();
        const popoverContent = await this._fnTemplateFragment(payload, metaModel, mdcLinkControl);
        if (bindingContext) {
          popoverContent.setBindingContext(bindingContext.getBoundContext());
        }
        return [popoverContent];
      }
      return Promise.resolve([]);
    },
    fetchLinkType: async function () {
      return Promise.resolve({
        initialType: {
          type: LinkType.Popover,
          // this means mdcLink.open will open a popup which shows content retrieved by fetchAdditionalContent
          directLink: undefined
        },
        runtimeType: undefined
      });
    },
    /**
     * Enables the modification of the sap.m.ResponsivePopover#title property and setting which Control should be added to the ariaLabelledBy association.
     * @param link Instance of the Link
     * @param _panel Instance of the Panel
     * @returns Once resolved, an Object containing the title string and an Control which is referenced as arialabelledBy.
     */
    fetchPopoverTitle: async function (link, _panel) {
      const payload = link.getPayload();
      const metaModel = link.getModel().getMetaModel();

      // Get the popover content first
      const popoverContent = await this._fnTemplateFragment(payload, metaModel, link);
      let titleControl = null;
      let titleText = "";

      // Navigate through the control tree to find the Title control
      // Structure: VBox -> CollaborativeHeader -> HBox -> VBox -> Title
      if (popoverContent?.isA("sap.m.VBox")) {
        const vbox = popoverContent;
        const items = vbox.getItems();

        // Find the CollaborativeHeader control
        for (const item of items) {
          if (item.getMetadata().getName() === "sap.fe.macros.contact.CollaborativeHeader") {
            // The CollaborativeHeader creates its content dynamically
            const headerContent = item.getAggregation("content");
            if (headerContent?.isA("sap.m.HBox")) {
              const hbox = headerContent;
              const hboxItems = hbox.getItems();

              // Find the VBox that contains the Title
              for (const hboxItem of hboxItems) {
                if (hboxItem.isA("sap.m.VBox")) {
                  const innerVBox = hboxItem;
                  const vboxItems = innerVBox.getItems();

                  // Find the Title control
                  for (const vboxItem of vboxItems) {
                    if (vboxItem.isA("sap.m.Title")) {
                      titleControl = vboxItem;
                      titleText = titleControl.getText() || "";
                      break;
                    }
                  }
                }
                if (titleControl) break;
              }
            }
          }
          if (titleControl) break;
        }
      }
      return {
        sTitle: titleText,
        oLabelledByControl: titleControl
      };
    }
  });
}, false);
//# sourceMappingURL=ContactDelegate-dbg.js.map
