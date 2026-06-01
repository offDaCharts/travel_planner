# Things To Do Tool Instructions

## Purpose

Use the Things To Do tool to retrieve informational activity, attraction, and event data for a city and date range. This tool does not rank activities, book tickets, check real-time ticket availability, or decide what the traveler should do.

Call this tool when the assistant needs events, landmarks, museums, parks, food activities, local experiences, indoor/outdoor classifications, prices, durations, or weather suitability metadata.

## Function

```ts
lookupMockThingsToDo(input: ThingsToDoLookupInput): ThingsToDoLookupOutput
```

Import from:

```ts
import { lookupMockThingsToDo } from "./src/tools/thingsToDo/index.js";
```

## Input Schema

```ts
type ThingsToDoLookupInput = {
  city: string;
  dateRange: {
    startDate: string; // YYYY-MM-DD
    endDate?: string;  // YYYY-MM-DD; defaults to startDate
  };
  weather?: ThingsToDoWeatherContext;
  interests?: ActivityInterest[];
  activityTypes?: ActivityType[];
  indoorOutdoorPreference?: "indoor" | "outdoor" | "mixed" | "unknown" | "any";
  priceRange?: {
    minPrice?: number;
    maxPrice?: number;
    currency?: string;
  };
};
```

```ts
type ActivityType =
  | "event"
  | "museum"
  | "landmark"
  | "tour"
  | "restaurant"
  | "nightlife"
  | "park"
  | "outdoor_activity"
  | "shopping"
  | "performing_arts"
  | "sports"
  | "family_activity"
  | "local_experience";

type ActivityInterest =
  | "food"
  | "history"
  | "art"
  | "music"
  | "nature"
  | "architecture"
  | "sports"
  | "shopping"
  | "nightlife"
  | "family"
  | "wellness"
  | "local_culture";
```

```ts
type ThingsToDoWeatherContext = {
  periods: {
    date: string;
    timeOfDay?: "full_day" | "morning" | "afternoon" | "evening" | "night";
    temperatureHigh?: number;
    temperatureLow?: number;
    temperatureAverage?: number;
    precipitationProbabilityPercent?: number;
    precipitationType?: "rain" | "snow" | "sleet" | "mixed" | "none";
    cloudiness?: "clear" | "mostly_clear" | "partly_cloudy" | "mostly_cloudy" | "overcast";
    windSpeed?: number;
  }[];
};
```

## Input Rules

- `city` and `startDate` are required.
- Dates must already be normalized to `YYYY-MM-DD`.
- If `endDate` is omitted, the request is treated as a single-day lookup.
- Weather context is optional. The tool accepts it but does not make recommendations from it.
- Omitted filters mean no restriction for that category.
- Mock prices are in USD. A different requested currency returns `UNSUPPORTED_CURRENCY` but still returns USD prices.
- The mock data window is `2026-06-01` through `2026-07-31`.

## Output Schema

```ts
type ThingsToDoLookupOutput = {
  city: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  activities: ActivityOption[];
  warnings?: ThingsToDoLookupWarning[];
  source: {
    provider: "MockThingsToDoProvider";
    generatedAt: string;
    dataWindow: {
      startDate: string;
      endDate: string;
    };
  };
};
```

```ts
type ActivityOption = {
  id: string;
  name: string;
  activityType: ActivityType;
  description?: string;
  dateInfo: ActivityDateInfo;
  location?: {
    name?: string;
    address?: string;
  };
  price?: {
    amount?: number;
    currency?: string;
    pricingType: "free" | "paid" | "variable" | "unknown";
  };
  durationMinutes?: number;
  indoorOutdoor: "indoor" | "outdoor" | "mixed" | "unknown";
  interests: ActivityInterest[];
  weatherSuitability?: WeatherSuitability[];
  notes?: string[];
};
```

```ts
type ActivityDateInfo =
  | {
      kind: "scheduled";
      startsAt: string;
      endsAt?: string;
    }
  | {
      kind: "date_range";
      startDate: string;
      endDate: string;
      hours?: OpeningHours[];
    }
  | {
      kind: "recurring";
      daysOfWeek: DayOfWeek[];
      hours?: OpeningHours[];
    }
  | {
      kind: "general";
      hours?: OpeningHours[];
    };
```

```ts
type WeatherSuitability = {
  condition: "rain" | "snow" | "heat" | "cold" | "wind" | "clear" | "any";
  suitability: "good" | "okay" | "poor" | "closed_or_unavailable";
};
```

## Date Handling

- `scheduled` activities are returned only if their date overlaps the requested date range.
- `date_range` activities are returned if their range overlaps the requested date range.
- `recurring` activities can be returned for any in-window request for the city.
- `general` activities can be returned for any in-window request for the city.
- `general` does not guarantee the attraction is open every day; it means the mock data is not tied to a specific event date.

## Warnings

Possible warning codes:

- `UNSUPPORTED_CITY`: the city is not in the mock data set.
- `NO_ACTIVITIES_FOUND`: no activities exist for the city/date range.
- `PARTIAL_DATA`: some optional fields are missing and should be treated as unknown.
- `DATE_RANGE_TOO_LONG`: requested range exceeds the mock support limit.
- `FILTERS_TOO_RESTRICTIVE`: activities existed before filtering, but none matched the requested filters.
- `NO_DATA_FOR_DATE_RANGE`: the requested date range extends outside the mock data window.
- `UNSUPPORTED_CURRENCY`: requested currency is unsupported; USD prices were returned.

## Agent Handling Guidance

- Treat missing `price.amount`, `location.address`, `notes`, or `durationMinutes` as unknown.
- Use `weatherSuitability` as factual metadata only. The assistant synthesis layer decides how weather affects the final answer.
- Do not treat the presence of an activity as a recommendation.
- Do not infer booking or ticket availability from this tool.

## Example

```ts
const activities = lookupMockThingsToDo({
  city: "Tokyo",
  dateRange: {
    startDate: "2026-07-01",
    endDate: "2026-07-31",
  },
  activityTypes: ["event", "park", "outdoor_activity"],
  indoorOutdoorPreference: "outdoor",
  weather: {
    periods: [
      {
        date: "2026-07-10",
        timeOfDay: "full_day",
        precipitationProbabilityPercent: 45,
        precipitationType: "rain",
      },
    ],
  },
});
```
