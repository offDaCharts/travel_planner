# Weather Tool Scope

## Purpose

The Weather tool returns normalized weather data for a city and date or date range. It does not return traveler suggestions, packing advice, activity recommendations, itinerary guidance, or suitability scoring. The assistant layer is responsible for interpreting the weather data.

## Inputs

```ts
type WeatherLookupInput = {
  city: string;
  dateRange: {
    startDate: string;
    endDate?: string;
  };
  timeOfDay?: WeatherTimeOfDay[];
  units?: Partial<WeatherUnits>;
};
```

- `city` is city-level only for this phase.
- Dates must be normalized before the tool is called and must use `YYYY-MM-DD`.
- `timeOfDay` may include `full_day`, `morning`, `afternoon`, `evening`, and `night`.
- Units default to Fahrenheit, mph, inches, and miles.

## Outputs

The tool returns:

- normalized city and date range
- echoed units
- forecast periods
- warnings when the tool downgrades or cannot fulfill part of the request
- source metadata for the mock provider and mock data window

Each forecast period may include:

- temperature high, low, and average
- apparent temperature high, low, and average
- cloudiness
- precipitation probability, amount, and type
- humidity
- wind speed, gusts, and direction
- UV index
- air quality index
- visibility
- sunrise and sunset
- weather alerts
- short weather summary

Most fields are optional because real weather providers will not always return complete data. Missing data should be treated as unknown by the assistant layer.

## Forecast Basis

Each forecast period includes a `dataBasis`:

- `forecast`: near-term forecast-style data
- `historical_average`: future dates where actual forecast granularity is unavailable
- `seasonal_average`: reserved for broader future seasonal requests

For the current mock data set:

- June 1-8, 2026 returns `forecast`.
- June 9-July 31, 2026 returns `historical_average`.

## Time-Of-Day Rule

Intraday weather is only available for dates within 7 days of the mock lookup date.

- Requests fully within June 1-8, 2026 may return `morning`, `afternoon`, `evening`, and `night`.
- Requests that include dates after June 8, 2026 are downgraded to `full_day`.
- Downgraded requests return an `INTRADAY_UNAVAILABLE_FOR_DATE_RANGE` warning.

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

The data is deterministic so the same city/date input always returns the same output.
