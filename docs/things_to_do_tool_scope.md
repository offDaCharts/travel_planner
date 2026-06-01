# Things To Do Tool Scope

## Purpose

The Things To Do tool returns informational activity, attraction, and event data for a city and date range. It does not book tickets, check real-time availability, rank options, or recommend what a traveler should choose. The assistant layer is responsible for interpreting and selecting from the data.

## Inputs

```ts
type ThingsToDoLookupInput = {
  city: string;
  dateRange: {
    startDate: string;
    endDate?: string;
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

- `city` is city-level only for this phase.
- Dates must be normalized before the tool is called and must use `YYYY-MM-DD`.
- Currency is included with prices. The mock data currently supports USD only.
- Weather context may be accepted, but the tool does not make recommendations from weather.

## Outputs

The tool returns:

- normalized city and date range
- multiple activity options
- source metadata for the mock provider and mock data window
- warnings when data is unavailable, incomplete, or filtered out

Each activity option may include:

- id and name
- activity type
- description
- date information
- location name
- price with currency
- duration
- indoor/outdoor classification
- interests
- weather suitability metadata
- factual notes

Booking, ticket availability, sold-out status, and cancellation details are out of scope.

## Date Model

Activities may be:

- `scheduled`: one-time event with a specific start time
- `date_range`: activity available across a defined date range
- `recurring`: activity available on days of the week
- `general`: city activity or attraction not tied to a specific date

Scheduled activities are returned only when they overlap the requested date range. General and recurring activities can be returned for any in-window request for that city.

## Mock Data

The mock data set covers 10 cities from June 1 through July 31, 2026:

- Seattle
- Lisbon
- Austin
- Chicago
- Montreal
- New York
- San Francisco
- Tokyo
- Paris
- Barcelona

Each city includes:

- landmark
- museum
- park or outdoor activity
- food/market activity
- scheduled summer event
- local experience

The data is deterministic so the same city/date/filter input always returns the same output.
