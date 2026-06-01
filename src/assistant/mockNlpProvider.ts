import type { NlpProvider, TravelRequestIntent } from "./types.js";
import type { ActivityInterest } from "../tools/thingsToDo/index.js";
import type { WeatherTimeOfDay } from "../tools/weather/index.js";

const DEFAULT_RANGE = { startDate: "2026-06-10", endDate: "2026-06-13" };

export class MockNlpProvider implements NlpProvider {
  name = "mock" as const;

  async parse(request: string): Promise<TravelRequestIntent> {
    return parseMockIntent(request);
  }
}

export function parseMockIntent(request: string): TravelRequestIntent {
  const normalized = request.toLowerCase();
  const cities = extractCities(normalized);
  const dateRange = extractDateRange(normalized);
  const requestedTools = inferRequestedTools(normalized);
  const mode = inferMode(normalized, cities.length);
  const interests = extractInterests(normalized);

  return {
    mode,
    cities: cities.length > 0 ? cities : ["Seattle"],
    dateRange,
    requestedTools,
    interests,
    weatherInput: inferWeatherInput(normalized),
    lodgingInput: inferLodgingInput(normalized),
    thingsToDoInput: inferThingsToDoInput(normalized, interests),
    rawRequest: request,
  };
}

function inferMode(request: string, cityCount: number): TravelRequestIntent["mode"] {
  if (request.includes("compare") || cityCount > 1 || request.includes("considering")) {
    return "compare";
  }

  if (request.includes("plan") || request.includes("itinerary") || request.includes("trip")) {
    return "plan";
  }

  return "focus";
}

function inferRequestedTools(request: string): TravelRequestIntent["requestedTools"] {
  const tools = new Set<TravelRequestIntent["requestedTools"][number]>();

  if (request.includes("weather") || request.includes("rain") || request.includes("temperature")) {
    tools.add("weather");
  }

  if (
    request.includes("hotel") ||
    request.includes("lodging") ||
    request.includes("stay") ||
    request.includes("cost") ||
    request.includes("under $")
  ) {
    tools.add("lodging");
  }

  if (
    request.includes("things to do") ||
    request.includes("activities") ||
    request.includes("museum") ||
    request.includes("food") ||
    request.includes("art") ||
    request.includes("outdoor")
  ) {
    tools.add("thingsToDo");
  }

  if (tools.size === 0 || request.includes("compare") || request.includes("plan")) {
    tools.add("weather");
    tools.add("lodging");
    tools.add("thingsToDo");
  }

  return [...tools];
}

function extractCities(request: string): string[] {
  const knownCities = [
    "Seattle",
    "Lisbon",
    "Austin",
    "Chicago",
    "Montreal",
    "New York",
    "San Francisco",
    "Tokyo",
    "Paris",
    "Barcelona",
  ];

  return knownCities.filter((city) => request.includes(city.toLowerCase()));
}

function extractDateRange(request: string): TravelRequestIntent["dateRange"] {
  const isoDates = [...request.matchAll(/\b(2026-\d{2}-\d{2})\b/g)].map((match) => match[1]);

  if (isoDates.length >= 2) {
    return { startDate: isoDates[0], endDate: isoDates[1] };
  }

  const monthDayRange = request.match(
    /\b(june|july)\s+(\d{1,2})\s+(?:to|-|through)\s+(?:(june|july)\s+)?(\d{1,2})\b/,
  );

  if (monthDayRange) {
    const startMonth = monthNumber(monthDayRange[1]);
    const endMonth = monthNumber(monthDayRange[3] ?? monthDayRange[1]);
    return {
      startDate: `2026-${startMonth}-${monthDayRange[2].padStart(2, "0")}`,
      endDate: `2026-${endMonth}-${monthDayRange[4].padStart(2, "0")}`,
    };
  }

  if (request.includes("july")) {
    return { startDate: "2026-07-10", endDate: "2026-07-14" };
  }

  return DEFAULT_RANGE;
}

function monthNumber(month: string): string {
  return month === "july" ? "07" : "06";
}

function extractInterests(request: string): ActivityInterest[] {
  return [
    ["food", "food"],
    ["art", "art"],
    ["museum", "art"],
    ["outdoor", "nature"],
    ["park", "nature"],
    ["music", "music"],
    ["history", "history"],
    ["shopping", "shopping"],
  ]
    .map(([needle, interest]) => [needle, interest] as [string, ActivityInterest])
    .filter(([needle]) => request.includes(needle))
    .map(([, interest]) => interest);
}

function inferWeatherInput(request: string): TravelRequestIntent["weatherInput"] {
  const timeOfDay: WeatherTimeOfDay[] = [];

  if (request.includes("morning")) {
    timeOfDay.push("morning" as const);
  }
  if (request.includes("afternoon")) {
    timeOfDay.push("afternoon" as const);
  }
  if (request.includes("evening")) {
    timeOfDay.push("evening" as const);
  }
  if (request.includes("night")) {
    timeOfDay.push("night" as const);
  }

  return timeOfDay.length > 0 ? { timeOfDay } : undefined;
}

function inferLodgingInput(request: string): TravelRequestIntent["lodgingInput"] {
  const maxPrice = request.match(/under\s+\$?(\d+)/)?.[1];
  const luxuryLevel = request.includes("luxury")
    ? "luxury"
    : request.includes("upscale")
      ? "upscale"
      : request.includes("budget")
        ? "budget"
        : undefined;
  const amenities = request.includes("breakfast") ? (["breakfast"] as const) : undefined;

  return {
    luxuryLevel,
    amenities: amenities ? [...amenities] : undefined,
    priceRange: maxPrice ? { maxNightlyRate: Number(maxPrice), currency: "USD" } : undefined,
  };
}

function inferThingsToDoInput(
  request: string,
  interests: ActivityInterest[],
): TravelRequestIntent["thingsToDoInput"] {
  return {
    interests: interests.length > 0 ? interests : undefined,
    indoorOutdoorPreference: request.includes("outdoor") ? "outdoor" : undefined,
  };
}
