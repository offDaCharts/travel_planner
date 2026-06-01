import { lookupMockLodging } from "../tools/lodging/index.js";
import { lookupMockThingsToDo } from "../tools/thingsToDo/index.js";
import { lookupMockWeather } from "../tools/weather/index.js";
import { AnthropicNlpProvider } from "./anthropicNlpProvider.js";
import { getAnthropicApiKey } from "./env.js";
import { MockNlpProvider } from "./mockNlpProvider.js";
import type {
  AssistantResponse,
  DestinationEvaluation,
  NlpProvider,
  ParsedIntentResult,
  ToolCallTrace,
  TravelPlanOption,
  TravelRequestIntent,
} from "./types.js";

export async function runTravelAssistant(request: string): Promise<AssistantResponse> {
  const parsed = await parseIntent(request);
  return buildAssistantResponse(parsed);
}

export async function runTravelAssistantWithProvider(
  request: string,
  provider: NlpProvider,
): Promise<AssistantResponse> {
  const intent = normalizeIntent(await provider.parse(request), request);
  return buildAssistantResponse({ provider: provider.name, intent });
}

function buildAssistantResponse(parsed: ParsedIntentResult): AssistantResponse {
  const evaluations: DestinationEvaluation[] = [];
  const trace: ToolCallTrace[] = [];

  for (const city of parsed.intent.cities) {
    const evaluation: DestinationEvaluation = { city };

    if (parsed.intent.requestedTools.includes("weather")) {
      evaluation.weather = lookupMockWeather({
        city,
        dateRange: parsed.intent.dateRange,
        ...parsed.intent.weatherInput,
      });
      trace.push(traceFor("weather", city, evaluation.weather.warnings));
    }

    if (parsed.intent.requestedTools.includes("lodging")) {
      evaluation.lodging = lookupMockLodging({
        city,
        dateRange: {
          checkInDate: parsed.intent.dateRange.startDate,
          checkOutDate: parsed.intent.dateRange.endDate,
        },
        ...parsed.intent.lodgingInput,
      });
      trace.push(traceFor("lodging", city, evaluation.lodging.warnings));
    }

    if (parsed.intent.requestedTools.includes("thingsToDo")) {
      evaluation.thingsToDo = lookupMockThingsToDo({
        city,
        dateRange: parsed.intent.dateRange,
        weather: evaluation.weather
          ? {
              periods: evaluation.weather.forecasts.map((forecast) => ({
                date: forecast.date,
                timeOfDay: forecast.timeOfDay,
                temperatureHigh: forecast.temperatureHigh,
                temperatureLow: forecast.temperatureLow,
                temperatureAverage: forecast.temperatureAverage,
                precipitationProbabilityPercent:
                  forecast.precipitation?.probabilityPercent,
                precipitationType: forecast.precipitation?.type,
                cloudiness: forecast.cloudiness,
                windSpeed: forecast.wind?.speed,
              })),
            }
          : undefined,
        ...parsed.intent.thingsToDoInput,
      });
      trace.push(traceFor("thingsToDo", city, evaluation.thingsToDo.warnings));
    }

    evaluations.push(evaluation);
  }

  if (parsed.intent.mode === "compare") {
    return {
      mode: "compare",
      intent: parsed.intent,
      provider: parsed.provider,
      evaluations,
      trace,
      summary: buildCompareSummary(evaluations),
    };
  }

  if (parsed.intent.mode === "plan") {
    return {
      mode: "plan",
      intent: parsed.intent,
      provider: parsed.provider,
      evaluations,
      trace,
      plans: buildPlanOptions(parsed.intent, evaluations),
    };
  }

  return {
    mode: "focus",
    intent: parsed.intent,
    provider: parsed.provider,
    evaluations,
    trace,
    answer: buildFocusAnswer(evaluations),
  };
}

async function parseIntent(request: string): Promise<ParsedIntentResult> {
  const key = getAnthropicApiKey();
  const fallback = new MockNlpProvider();
  let provider: NlpProvider = fallback;

  if (key) {
    provider = new AnthropicNlpProvider(key);
  }

  try {
    const intent = normalizeIntent(await provider.parse(request), request);
    return { provider: provider.name, intent };
  } catch (error) {
    const intent = normalizeIntent(await fallback.parse(request), request);
    return {
      provider: fallback.name,
      intent,
      warning: error instanceof Error ? error.message : "NLP provider failed.",
    };
  }
}

function normalizeIntent(intent: TravelRequestIntent, rawRequest: string): TravelRequestIntent {
  return {
    ...intent,
    mode: intent.mode ?? "focus",
    cities: intent.cities?.length ? intent.cities : ["Seattle"],
    dateRange: intent.dateRange ?? { startDate: "2026-06-10", endDate: "2026-06-13" },
    requestedTools: intent.requestedTools?.length
      ? intent.requestedTools
      : ["weather", "lodging", "thingsToDo"],
    rawRequest,
  };
}

function traceFor(
  tool: ToolCallTrace["tool"],
  city: string,
  warnings?: { code: string }[],
): ToolCallTrace {
  return {
    tool,
    city,
    status: "success",
    warnings: warnings
      ?.map((warning) => warning.code)
      .filter((code) => code !== "PARTIAL_DATA"),
  };
}

function buildCompareSummary(evaluations: DestinationEvaluation[]): string {
  return `Compared ${evaluations.length} destination${evaluations.length === 1 ? "" : "s"} across the available weather, lodging, and activities data.`;
}

function buildFocusAnswer(evaluations: DestinationEvaluation[]): string {
  const city = evaluations[0]?.city ?? "the destination";
  const parts = evaluations.flatMap((evaluation) => [
    evaluation.weather
      ? `${evaluation.weather.forecasts.length} weather period(s)`
      : undefined,
    evaluation.lodging
      ? `${evaluation.lodging.lodgingOptions.length} lodging option(s)`
      : undefined,
    evaluation.thingsToDo
      ? `${evaluation.thingsToDo.activities.length} activity option(s)`
      : undefined,
  ]).filter(Boolean);

  return `Found ${parts.join(", ")} for ${city}.`;
}

function buildPlanOptions(
  intent: TravelRequestIntent,
  evaluations: DestinationEvaluation[],
): TravelPlanOption[] {
  return evaluations.slice(0, 3).map((evaluation, index) => ({
    title: `${evaluation.city} option ${index + 1}`,
    city: evaluation.city,
    summary: `A ${intent.mode} option assembled from available weather, lodging, and things-to-do data for ${evaluation.city}.`,
    weatherHighlights: summarizeWeather(evaluation),
    lodgingHighlights: summarizeLodging(evaluation),
    activityHighlights: summarizeActivities(evaluation),
    tradeoffs: collectWarnings(evaluation),
  }));
}

export function summarizeWeather(evaluation: DestinationEvaluation): string[] {
  const forecasts = evaluation.weather?.forecasts ?? [];

  if (forecasts.length === 0) {
    return ["Weather data is unavailable."];
  }

  const highs = forecasts.map((forecast) => forecast.temperatureHigh).filter(isNumber);
  const lows = forecasts.map((forecast) => forecast.temperatureLow).filter(isNumber);
  const rain = forecasts
    .map((forecast) => forecast.precipitation?.probabilityPercent)
    .filter(isNumber);

  return [
    highs.length ? `Highs around ${Math.round(avg(highs))}.` : "High temperature unknown.",
    lows.length ? `Lows around ${Math.round(avg(lows))}.` : "Low temperature unknown.",
    rain.length ? `Average precipitation chance ${Math.round(avg(rain))}%.` : "Precipitation unknown.",
  ];
}

export function summarizeLodging(evaluation: DestinationEvaluation): string[] {
  const options = evaluation.lodging?.lodgingOptions ?? [];

  if (options.length === 0) {
    return ["No lodging options returned."];
  }

  const totals = options.map((option) => option.totalEstimatedCost).filter(isNumber);
  return [
    `${options.length} lodging option(s) returned.`,
    totals.length
      ? `Estimated total range $${Math.min(...totals)}-$${Math.max(...totals)}.`
      : "Some total costs are unavailable.",
  ];
}

export function summarizeActivities(evaluation: DestinationEvaluation): string[] {
  const activities = evaluation.thingsToDo?.activities ?? [];

  if (activities.length === 0) {
    return ["No activities returned."];
  }

  return activities.slice(0, 4).map((activity) => `${activity.name} (${activity.activityType})`);
}

function collectWarnings(evaluation: DestinationEvaluation): string[] {
  const warnings = [
    ...(evaluation.weather?.warnings ?? []),
    ...(evaluation.lodging?.warnings ?? []),
    ...(evaluation.thingsToDo?.warnings ?? []),
  ]
    .filter((warning) => warning.code !== "PARTIAL_DATA")
    .map((warning) => warning.message);

  return warnings.length > 0 ? warnings : ["No major tool warnings."];
}

function avg(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}
