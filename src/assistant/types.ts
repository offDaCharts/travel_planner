import type { LodgingLookupInput, LodgingLookupOutput } from "../tools/lodging/index.js";
import type {
  ThingsToDoLookupInput,
  ThingsToDoLookupOutput,
} from "../tools/thingsToDo/index.js";
import type { WeatherLookupInput, WeatherLookupOutput } from "../tools/weather/index.js";

export type TravelRequestMode = "compare" | "focus" | "plan";

export type RequestedTool = "weather" | "lodging" | "thingsToDo";

export type DateRange = {
  startDate: string;
  endDate: string;
};

export type TravelRequestIntent = {
  mode: TravelRequestMode;
  cities: string[];
  dateRange: DateRange;
  requestedTools: RequestedTool[];
  interests?: string[];
  weatherInput?: Partial<Omit<WeatherLookupInput, "city" | "dateRange">>;
  lodgingInput?: Partial<Omit<LodgingLookupInput, "city" | "dateRange">>;
  thingsToDoInput?: Partial<Omit<ThingsToDoLookupInput, "city" | "dateRange">>;
  missingInfo?: string[];
  rawRequest: string;
};

export type NlpProviderName = "anthropic-sonnet-4.5" | "mock";

export type ParsedIntentResult = {
  provider: NlpProviderName;
  intent: TravelRequestIntent;
  warning?: string;
};

export type ToolCallTrace = {
  tool: RequestedTool;
  city: string;
  status: "success" | "error";
  warnings?: string[];
};

export type DestinationEvaluation = {
  city: string;
  weather?: WeatherLookupOutput;
  lodging?: LodgingLookupOutput;
  thingsToDo?: ThingsToDoLookupOutput;
};

export type TravelPlanOption = {
  title: string;
  city: string;
  summary: string;
  weatherHighlights: string[];
  lodgingHighlights: string[];
  activityHighlights: string[];
  tradeoffs: string[];
};

export type AssistantResponse =
  | {
      mode: "compare";
      intent: TravelRequestIntent;
      provider: NlpProviderName;
      evaluations: DestinationEvaluation[];
      trace: ToolCallTrace[];
      summary: string;
    }
  | {
      mode: "focus";
      intent: TravelRequestIntent;
      provider: NlpProviderName;
      evaluations: DestinationEvaluation[];
      trace: ToolCallTrace[];
      answer: string;
    }
  | {
      mode: "plan";
      intent: TravelRequestIntent;
      provider: NlpProviderName;
      evaluations: DestinationEvaluation[];
      trace: ToolCallTrace[];
      plans: TravelPlanOption[];
    };

export type NlpProvider = {
  name: NlpProviderName;
  parse(request: string): Promise<TravelRequestIntent>;
};
