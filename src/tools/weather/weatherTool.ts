import {
  MOCK_INTRADAY_END_DATE,
  MOCK_WEATHER_DATA,
  MOCK_WEATHER_END_DATE,
  MOCK_WEATHER_GENERATED_AT,
  MOCK_WEATHER_START_DATE,
  findMockCity,
} from "./mockWeatherData.js";
import type {
  WeatherForecastPeriod,
  WeatherLookupInput,
  WeatherLookupOutput,
  WeatherLookupWarning,
  WeatherTimeOfDay,
  WeatherUnits,
} from "./types.js";

const DEFAULT_UNITS: WeatherUnits = {
  temperature: "fahrenheit",
  windSpeed: "mph",
  precipitation: "inches",
  visibility: "miles",
};

const DEFAULT_TIME_OF_DAY: WeatherTimeOfDay[] = ["full_day"];
const MAX_LOOKUP_DAYS = 61;

export function lookupMockWeather(input: WeatherLookupInput): WeatherLookupOutput {
  const city = findMockCity(input.city);
  const requestedEndDate = input.dateRange.endDate ?? input.dateRange.startDate;
  const warnings: WeatherLookupWarning[] = [];

  validateDateRange(input.dateRange.startDate, requestedEndDate);

  if (!city) {
    return buildOutput({
      city: input.city,
      startDate: input.dateRange.startDate,
      endDate: requestedEndDate,
      units: normalizeUnits(input.units),
      forecasts: [],
      warnings: [
        {
          code: "UNSUPPORTED_CITY",
          message: `No mock weather data is available for ${input.city}.`,
        },
      ],
    });
  }

  const requestedDayCount = daysInclusive(input.dateRange.startDate, requestedEndDate);

  if (requestedDayCount > MAX_LOOKUP_DAYS) {
    warnings.push({
      code: "DATE_RANGE_TOO_LONG",
      message: `Weather lookup supports up to ${MAX_LOOKUP_DAYS} days in the mock data set.`,
    });
  }

  const requestedTimeOfDay = normalizeTimeOfDay(input.timeOfDay);
  const includesDateBeyondIntradayWindow = requestedEndDate > MOCK_INTRADAY_END_DATE;
  const includesIntradayRequest = requestedTimeOfDay.some(
    (timeOfDay) => timeOfDay !== "full_day",
  );
  const effectiveTimeOfDay =
    includesDateBeyondIntradayWindow && includesIntradayRequest
      ? DEFAULT_TIME_OF_DAY
      : requestedTimeOfDay;

  if (includesDateBeyondIntradayWindow && includesIntradayRequest) {
    warnings.push({
      code: "INTRADAY_UNAVAILABLE_FOR_DATE_RANGE",
      message:
        "Intraday weather is only available for dates within 7 days of the mock lookup date. Returned full-day forecasts instead.",
    });
  }

  const forecasts = MOCK_WEATHER_DATA.filter(
    (period) =>
      period.city === city &&
      period.date >= input.dateRange.startDate &&
      period.date <= requestedEndDate &&
      effectiveTimeOfDay.includes(period.timeOfDay),
  );

  if (forecasts.length === 0) {
    warnings.push({
      code: "NO_DATA_FOR_DATE_RANGE",
      message: `No mock weather data is available from ${input.dateRange.startDate} to ${requestedEndDate}.`,
    });
  }

  if (forecasts.some(hasPartialData)) {
    warnings.push({
      code: "PARTIAL_DATA",
      message:
        "Some weather fields are unavailable in the mock data and should be treated as unknown.",
    });
  }

  return buildOutput({
    city,
    startDate: input.dateRange.startDate,
    endDate: requestedEndDate,
    units: normalizeUnits(input.units),
    forecasts,
    warnings,
  });
}

function buildOutput({
  city,
  startDate,
  endDate,
  units,
  forecasts,
  warnings,
}: {
  city: string;
  startDate: string;
  endDate: string;
  units: WeatherUnits;
  forecasts: WeatherForecastPeriod[];
  warnings: WeatherLookupWarning[];
}): WeatherLookupOutput {
  return {
    city,
    dateRange: {
      startDate,
      endDate,
    },
    units,
    forecasts,
    warnings: warnings.length > 0 ? warnings : undefined,
    source: {
      provider: "MockWeatherProvider",
      generatedAt: MOCK_WEATHER_GENERATED_AT,
      dataWindow: {
        startDate: MOCK_WEATHER_START_DATE,
        endDate: MOCK_WEATHER_END_DATE,
      },
    },
  };
}

function normalizeUnits(units?: Partial<WeatherUnits>): WeatherUnits {
  return {
    ...DEFAULT_UNITS,
    ...units,
  };
}

function normalizeTimeOfDay(timeOfDay?: WeatherTimeOfDay[]): WeatherTimeOfDay[] {
  if (!timeOfDay || timeOfDay.length === 0) {
    return DEFAULT_TIME_OF_DAY;
  }

  return [...new Set(timeOfDay)];
}

function validateDateRange(startDate: string, endDate: string): void {
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
    throw new Error("Weather lookup dates must use YYYY-MM-DD format.");
  }

  if (startDate > endDate) {
    throw new Error("Weather lookup startDate must be before or equal to endDate.");
  }
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function daysInclusive(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const end = new Date(`${endDate}T00:00:00.000Z`).getTime();
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((end - start) / millisecondsPerDay) + 1;
}

function hasPartialData(forecast: WeatherForecastPeriod): boolean {
  return (
    forecast.uvIndex === undefined ||
    forecast.airQualityIndex === undefined ||
    forecast.visibility === undefined
  );
}
