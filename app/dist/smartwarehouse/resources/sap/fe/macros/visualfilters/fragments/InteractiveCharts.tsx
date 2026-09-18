import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { isPathAnnotationExpression } from "sap/fe/core/helpers/TypeGuards";
import type { $InteractiveBarChartSettings, InteractiveBarChart$SelectionChangedEvent } from "sap/suite/ui/microchart/InteractiveBarChart";
import type {
	$InteractiveLineChartSettings,
	InteractiveLineChart$SelectionChangedEvent
} from "sap/suite/ui/microchart/InteractiveLineChart";
import type { $InteractiveLineChartPointSettings } from "sap/suite/ui/microchart/InteractiveLineChartPoint";
import type { AggregationBindingInfo } from "sap/ui/base/ManagedObject";
import CustomData from "sap/ui/core/CustomData";
import InteractiveChartHelper, { type InteractiveChartType } from "../InteractiveChartHelper";
import type VisualFilter from "../VisualFilter";
import VisualFilterRuntime from "../VisualFilterRuntime";

type visualFilterChartAggregations = Pick<$InteractiveBarChartSettings, "bars"> | Pick<$InteractiveLineChartSettings, "points">;

export async function getVisualFilterChart(visualFilter: VisualFilter): Promise<string> {
	if (visualFilter.showError) {
		return getInteractiveChartWithError(visualFilter);
	} else if (visualFilter.chartType) {
		return getInteractiveChart(visualFilter);
	} else {
		return "";
	}
}

export async function getInteractiveChartWithError(visualFilter: VisualFilter): Promise<string> {
	const chartAnnotation = visualFilter.chartAnnotation;
	const InteractiveLineChart = (await import("sap/suite/ui/microchart/InteractiveLineChart")).default;
	if (visualFilter.chartMeasure && chartAnnotation?.Dimensions && chartAnnotation.Dimensions[0]) {
		return (
			<InteractiveLineChart
				showError={visualFilter.showError}
				errorMessageTitle={visualFilter.errorMessageTitle}
				errorMessage={visualFilter.errorMessage}
			/>
		);
	}
	return "";
}

export async function getInteractiveChart(visualFilter: VisualFilter): Promise<string> {
	const interactiveChartProperties = InteractiveChartHelper.getInteractiveChartProperties(visualFilter);
	if (visualFilter.chartType === "UI.ChartType/Bar") {
		const InteractiveBarChart = (await import("sap/suite/ui/microchart/InteractiveBarChart")).default;
		const barsConfig = await getBarChartAggregations(interactiveChartProperties);
		return (
			<InteractiveBarChart
				selectionChanged={(event: InteractiveBarChart$SelectionChangedEvent): void => {
					VisualFilterRuntime.selectionChanged(event);
				}}
				{...getChartProperties(interactiveChartProperties, visualFilter)}
			>
				{barsConfig}
				{{
					customData: getCustomData(visualFilter, interactiveChartProperties)
				}}
			</InteractiveBarChart>
		);
	} else if (visualFilter.chartType === "UI.ChartType/Line") {
		const InteractiveLineChart = (await import("sap/suite/ui/microchart/InteractiveLineChart")).default;
		const pointsConfig = await getLineChartAggregations(interactiveChartProperties);
		return (
			<InteractiveLineChart
				selectionChanged={(event: InteractiveLineChart$SelectionChangedEvent): void => {
					VisualFilterRuntime.selectionChanged(event);
				}}
				{...getChartProperties(interactiveChartProperties, visualFilter)}
			>
				{pointsConfig}
				{{
					customData: getCustomData(visualFilter, interactiveChartProperties)
				}}
			</InteractiveLineChart>
		);
	}
	return "";
}

function getChartProperties(
	interactiveChartProperties: InteractiveChartType,
	visualFilter: VisualFilter
): Partial<PropertiesOf<$InteractiveBarChartSettings | $InteractiveLineChartPointSettings>> | undefined {
	const visualFilterChartProperties: $InteractiveBarChartSettings | $InteractiveLineChartPointSettings = {
		visible: interactiveChartProperties.showErrorExpression,
		showError: interactiveChartProperties.showErrorExpression,
		errorMessageTitle: interactiveChartProperties.errorMessageTitleExpression,
		errorMessage: interactiveChartProperties.errorMessageExpression
	};
	if (visualFilter.chartType === "UI.ChartType/Bar") {
		visualFilterChartProperties.bars = interactiveChartProperties.aggregationBinding as unknown as AggregationBindingInfo;
	} else if (visualFilter.chartType === "UI.ChartType/Line") {
		(visualFilterChartProperties as $InteractiveLineChartSettings).points =
			interactiveChartProperties.aggregationBinding as unknown as AggregationBindingInfo;
	}
	return visualFilterChartProperties;
}

async function getBarChartAggregations(interactiveChartProperties: InteractiveChartType): Promise<visualFilterChartAggregations> {
	const barChartAggregations = {};
	const InteractiveBarChartBar = (await import("sap/suite/ui/microchart/InteractiveBarChartBar")).default;
	(barChartAggregations as $InteractiveBarChartSettings).bars = (
		<InteractiveBarChartBar
			label={interactiveChartProperties.chartLabel}
			value={interactiveChartProperties.measure}
			displayedValue={interactiveChartProperties.displayedValue}
			color={interactiveChartProperties.color}
			selected="{path: '$field>/conditions', formatter: '._formatters.VisualFilterRuntime.getAggregationSelected.bind($control)'}"
		/>
	);
	return barChartAggregations;
}

async function getLineChartAggregations(interactiveChartProperties: InteractiveChartType): Promise<visualFilterChartAggregations> {
	const lineChartAggregations = {};
	const InteractiveLineChartPoint = (await import("sap/suite/ui/microchart/InteractiveLineChartPoint")).default;
	(lineChartAggregations as $InteractiveLineChartSettings).points = (
		<InteractiveLineChartPoint
			label={interactiveChartProperties.chartLabel}
			value={interactiveChartProperties.measure}
			displayedValue={interactiveChartProperties.displayedValue}
			color={interactiveChartProperties.color}
			selected="{path: '$field>/conditions', formatter: '._formatters.VisualFilterRuntime.getAggregationSelected.bind($control)'}"
		/>
	);
	return lineChartAggregations;
}

function getCustomData(visualFilter: VisualFilter, interactiveChartProperties: InteractiveChartType): CustomData[] {
	const id = generate([visualFilter.metaPath]);
	const dimension = visualFilter.chartAnnotation?.Dimensions[0];
	return [
		<CustomData key={"outParameter"} value={visualFilter.outParameter} />,
		<CustomData key={"valuelistProperty"} value={visualFilter.valuelistProperty} />,
		<CustomData key={"multipleSelectionAllowed"} value={visualFilter.multipleSelectionAllowed} />,
		<CustomData key={"dimension"} value={dimension?.$target?.name} />,
		<CustomData
			key={"dimensionText"}
			value={
				isPathAnnotationExpression(dimension?.$target?.annotations.Common?.Text)
					? dimension?.$target?.annotations.Common?.Text.path
					: undefined
			}
		/>,
		<CustomData key={"scalefactor"} value={interactiveChartProperties.scalefactor} />,
		<CustomData key={"measure"} value={visualFilter.chartMeasure} />,
		<CustomData key={"uom"} value={interactiveChartProperties.uom} />,
		<CustomData key={"inParameters"} value={interactiveChartProperties.inParameters} />,
		<CustomData key={"inParameterFilters"} value={interactiveChartProperties.inParameterFilters} />,
		<CustomData key={"dimensionType"} value={dimension?.$target?.type} />,
		<CustomData key={"selectionVariantAnnotation"} value={interactiveChartProperties.selectionVariant} />,
		<CustomData key={"required"} value={visualFilter.required} />,
		<CustomData key={"showOverlayInitially"} value={visualFilter.showOverlayInitially} />,
		<CustomData key={"requiredProperties"} value={visualFilter.requiredProperties} />,
		<CustomData key={"infoPath"} value={id} />,
		<CustomData key={"parameters"} value={interactiveChartProperties.stringifiedParameters} />,
		<CustomData key={"draftSupported"} value={visualFilter.draftSupported} />
	];
}
