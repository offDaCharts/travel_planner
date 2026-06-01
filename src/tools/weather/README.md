# Weather Tool Instructions

## Purpose

Use the Weather tool to retrieve weather data for a city and date or date range. This tool is informational only: it does not provide packing advice, itinerary guidance, activity recommendations, or travel suitability scoring.

Call this tool when the assistant needs weather facts such as temperature, precipitation, cloudiness, wind, humidity, UV, visibility, sunrise/sunset, or weather alerts.

## Function

```ts
lookupMockWeather(input: WeatherLookupInput): WeatherLookupOutput
```

Import from:

```ts
import { lookupMockWeather } from "./src/tools/weather/index.js";
```

## Input Schema

```ts
type WeatherLookupInput = {
  city: string;
  dateRange: {
    startDate: string; // YYYY-MM-DD
    endDate?: string;  // YYYY-MM-DD; defaults to startDate
  };
  timeOfDay?: WeatherTimeOfDay[];
  units?: Partial<WeatherUnits>;
};

type WeatherTimeOfDay =
  | "full_day"
  | "morning"
  | "afternoon"
  | "evening"
  | "night";

type WeatherUnits = {
  temperature: "fahrenheit" | "celsius";
  windSpeed: "mph" | "kph";
  precipitation: "inches" | "millimeters";
  visibility: "miles" | "kilometers";
};
```

## Input Rules

- `city` is required and city-level only.
- Dates must already be normalized to `YYYY-MM-DD`.
- If `endDate` is omitted, the request is treated as a single-day lookup.
- If `timeOfDay` is omitted, the tool returns `full_day` periods.
- Default units are Fahrenheit, mph, inches, and miles.
- The mock data window is `2026-06-01` through `2026-07-31`.
- Intraday periods are only available through `2026-06-08`. Requests after that date are downgraded to `full_day` and return a warning.

## Output Schema

```ts
type WeatherLookupOutput = {
  city: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  units: WeatherUnits;
  forecasts: WeatherForecastPeriod[];
  warnings?: WeatherLookupWarning[];
  source: {
    provider: "MockWeatherProvider";
    generatedAt: string;
    dataWindow: {
      startDate: string;
      endDate: string;
    };
  };
};
```

```ts
type WeatherForecastPeriod = {
  city: string;
  date: string;
  timeOfDay: WeatherTimeOfDay;
  dataBasis: "forecast" | "historical_average" | "seasonal_average";
  temperatureHigh?: number;
  temperatureLow?: number;
  temperatureAverage?: number;
  apparentTemperatureHigh?: number;
  apparentTemperatureLow?: number;
  apparentTemperatureAverage?: number;
  cloudiness?: "clear" | "mostly_clear" | "partly_cloudy" | "mostly_cloudy" | "overcast";
  precipitation?: {
    probabilityPercent?: number;
    expectedAmount?: number;
    type?: "rain" | "snow" | "sleet" | "mixed" | "none";
  };
  humidityPercent?: number;
  wind?: {
    speed?: number;
    gustSpeed?: number;
    directionDegrees?: number;
    directionLabel?: string;
  };
  uvIndex?: number;
  airQualityIndex?: number;
  visibility?: number;
  sunrise?: string;
  sunset?: string;
  summary?: string;
  alerts?: WeatherAlert[];
};
```

## Warnings

Possible warning codes:

- `INTRADAY_UNAVAILABLE_FOR_DATE_RANGE`: intraday was requested outside the supported near-term window and full-day data was returned.
- `PARTIAL_DATA`: some optional fields are missing and should be treated as unknown.
- `DATE_RANGE_TOO_LONG`: requested range exceeds the mock support limit.
- `UNSUPPORTED_CITY`: the city is not in the mock data set.
- `NO_DATA_FOR_DATE_RANGE`: the requested date range has no matching mock data.

## Agent Handling Guidance

- Treat missing optional fields as unknown, not zero or false.
- Use `dataBasis` to distinguish actual forecast-style data from historical-average data.
- Do not assume intraday data exists for future dates.
- Do not use this tool to produce recommendations. Interpret the returned weather in the assistant synthesis layer.

## Example

```ts
const weather = lookupMockWeather({
  city: "Seattle",
  dateRange: {
    startDate: "2026-06-03",
    endDate: "2026-06-04",
  },
  timeOfDay: ["morning", "evening"],
});
```
