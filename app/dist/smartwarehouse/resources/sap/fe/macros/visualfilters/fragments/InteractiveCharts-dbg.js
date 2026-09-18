/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2026 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/ui/core/CustomData", "../InteractiveChartHelper", "../VisualFilterRuntime", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (StableIdHelper, TypeGuards, CustomData, InteractiveChartHelper, VisualFilterRuntime, _jsx, _jsxs) {
  "use strict";

  function __ui5_require_async(path) {
    return new Promise((resolve, reject) => {
      sap.ui.require([path], module => {
        if (!(module && module.__esModule)) {
          module = module === null || !(typeof module === "object" && path.endsWith("/library")) ? {
            default: module
          } : module;
          Object.defineProperty(module, "__esModule", {
            value: true
          });
        }
        resolve(module);
      }, err => {
        reject(err);
      });
    });
  }
  var _exports = {};
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var generate = StableIdHelper.generate;
  async function getVisualFilterChart(visualFilter) {
    if (visualFilter.showError) {
      return getInteractiveChartWithError(visualFilter);
    } else if (visualFilter.chartType) {
      return getInteractiveChart(visualFilter);
    } else {
      return "";
    }
  }
  _exports.getVisualFilterChart = getVisualFilterChart;
  async function getInteractiveChartWithError(visualFilter) {
    const chartAnnotation = visualFilter.chartAnnotation;
    const InteractiveLineChart = (await __ui5_require_async("sap/suite/ui/microchart/InteractiveLineChart")).default;
    if (visualFilter.chartMeasure && chartAnnotation?.Dimensions && chartAnnotation.Dimensions[0]) {
      return _jsx(InteractiveLineChart, {
        showError: visualFilter.showError,
        errorMessageTitle: visualFilter.errorMessageTitle,
        errorMessage: visualFilter.errorMessage
      });
    }
    return "";
  }
  _exports.getInteractiveChartWithError = getInteractiveChartWithError;
  async function getInteractiveChart(visualFilter) {
    const interactiveChartProperties = InteractiveChartHelper.getInteractiveChartProperties(visualFilter);
    if (visualFilter.chartType === "UI.ChartType/Bar") {
      const InteractiveBarChart = (await __ui5_require_async("sap/suite/ui/microchart/InteractiveBarChart")).default;
      const barsConfig = await getBarChartAggregations(interactiveChartProperties);
      return _jsxs(InteractiveBarChart, {
        selectionChanged: event => {
          VisualFilterRuntime.selectionChanged(event);
        },
        ...getChartProperties(interactiveChartProperties, visualFilter),
        children: [barsConfig, {
          customData: getCustomData(visualFilter, interactiveChartProperties)
        }]
      });
    } else if (visualFilter.chartType === "UI.ChartType/Line") {
      const InteractiveLineChart = (await __ui5_require_async("sap/suite/ui/microchart/InteractiveLineChart")).default;
      const pointsConfig = await getLineChartAggregations(interactiveChartProperties);
      return _jsxs(InteractiveLineChart, {
        selectionChanged: event => {
          VisualFilterRuntime.selectionChanged(event);
        },
        ...getChartProperties(interactiveChartProperties, visualFilter),
        children: [pointsConfig, {
          customData: getCustomData(visualFilter, interactiveChartProperties)
        }]
      });
    }
    return "";
  }
  _exports.getInteractiveChart = getInteractiveChart;
  function getChartProperties(interactiveChartProperties, visualFilter) {
    const visualFilterChartProperties = {
      visible: interactiveChartProperties.showErrorExpression,
      showError: interactiveChartProperties.showErrorExpression,
      errorMessageTitle: interactiveChartProperties.errorMessageTitleExpression,
      errorMessage: interactiveChartProperties.errorMessageExpression
    };
    if (visualFilter.chartType === "UI.ChartType/Bar") {
      visualFilterChartProperties.bars = interactiveChartProperties.aggregationBinding;
    } else if (visualFilter.chartType === "UI.ChartType/Line") {
      visualFilterChartProperties.points = interactiveChartProperties.aggregationBinding;
    }
    return visualFilterChartProperties;
  }
  async function getBarChartAggregations(interactiveChartProperties) {
    const barChartAggregations = {};
    const InteractiveBarChartBar = (await __ui5_require_async("sap/suite/ui/microchart/InteractiveBarChartBar")).default;
    barChartAggregations.bars = _jsx(InteractiveBarChartBar, {
      label: interactiveChartProperties.chartLabel,
      value: interactiveChartProperties.measure,
      displayedValue: interactiveChartProperties.displayedValue,
      color: interactiveChartProperties.color,
      selected: "{path: '$field>/conditions', formatter: '._formatters.VisualFilterRuntime.getAggregationSelected.bind($control)'}"
    });
    return barChartAggregations;
  }
  async function getLineChartAggregations(interactiveChartProperties) {
    const lineChartAggregations = {};
    const InteractiveLineChartPoint = (await __ui5_require_async("sap/suite/ui/microchart/InteractiveLineChartPoint")).default;
    lineChartAggregations.points = _jsx(InteractiveLineChartPoint, {
      label: interactiveChartProperties.chartLabel,
      value: interactiveChartProperties.measure,
      displayedValue: interactiveChartProperties.displayedValue,
      color: interactiveChartProperties.color,
      selected: "{path: '$field>/conditions', formatter: '._formatters.VisualFilterRuntime.getAggregationSelected.bind($control)'}"
    });
    return lineChartAggregations;
  }
  function getCustomData(visualFilter, interactiveChartProperties) {
    const id = generate([visualFilter.metaPath]);
    const dimension = visualFilter.chartAnnotation?.Dimensions[0];
    return [_jsx(CustomData, {
      value: visualFilter.outParameter
    }, "outParameter"), _jsx(CustomData, {
      value: visualFilter.valuelistProperty
    }, "valuelistProperty"), _jsx(CustomData, {
      value: visualFilter.multipleSelectionAllowed
    }, "multipleSelectionAllowed"), _jsx(CustomData, {
      value: dimension?.$target?.name
    }, "dimension"), _jsx(CustomData, {
      value: isPathAnnotationExpression(dimension?.$target?.annotations.Common?.Text) ? dimension?.$target?.annotations.Common?.Text.path : undefined
    }, "dimensionText"), _jsx(CustomData, {
      value: interactiveChartProperties.scalefactor
    }, "scalefactor"), _jsx(CustomData, {
      value: visualFilter.chartMeasure
    }, "measure"), _jsx(CustomData, {
      value: interactiveChartProperties.uom
    }, "uom"), _jsx(CustomData, {
      value: interactiveChartProperties.inParameters
    }, "inParameters"), _jsx(CustomData, {
      value: interactiveChartProperties.inParameterFilters
    }, "inParameterFilters"), _jsx(CustomData, {
      value: dimension?.$target?.type
    }, "dimensionType"), _jsx(CustomData, {
      value: interactiveChartProperties.selectionVariant
    }, "selectionVariantAnnotation"), _jsx(CustomData, {
      value: visualFilter.required
    }, "required"), _jsx(CustomData, {
      value: visualFilter.showOverlayInitially
    }, "showOverlayInitially"), _jsx(CustomData, {
      value: visualFilter.requiredProperties
    }, "requiredProperties"), _jsx(CustomData, {
      value: id
    }, "infoPath"), _jsx(CustomData, {
      value: interactiveChartProperties.stringifiedParameters
    }, "parameters"), _jsx(CustomData, {
      value: visualFilter.draftSupported
    }, "draftSupported")];
  }
  return _exports;
}, false);
//# sourceMappingURL=InteractiveCharts-dbg.js.map
