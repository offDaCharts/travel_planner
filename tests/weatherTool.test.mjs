import assert from "node:assert/strict";
import {
  MOCK_WEATHER_CITIES,
  MOCK_WEATHER_DATA,
  lookupMockWeather,
} from "../.tmp/weather-build/src/tools/weather/index.js";

test("mock data covers 10 cities for the two-month window", () => {
  assert.equal(MOCK_WEATHER_CITIES.length, 10);
  assert.equal(MOCK_WEATHER_DATA.length, 930);
});

test("returns default full-day forecasts for a supported city and date range", () => {
  const output = lookupMockWeather({
    city: "Seattle",
    dateRange: {
      startDate: "2026-06-10",
      endDate: "2026-06-12",
    },
  });

  assert.equal(output.city, "Seattle");
  assert.equal(output.forecasts.length, 3);
  assert.deepEqual(
    [...new Set(output.forecasts.map((forecast) => forecast.timeOfDay))],
    ["full_day"],
  );
  assert.ok(output.forecasts.every((forecast) => forecast.temperatureHigh));
});

test("returns requested intraday periods inside the 7-day window", () => {
  const output = lookupMockWeather({
    city: "Chicago",
    dateRange: {
      startDate: "2026-06-02",
      endDate: "2026-06-03",
    },
    timeOfDay: ["morning", "night"],
  });

  assert.equal(output.forecasts.length, 4);
  assert.deepEqual(
    [...new Set(output.forecasts.map((forecast) => forecast.timeOfDay))],
    ["morning", "night"],
  );
  assert.ok(output.forecasts.every((forecast) => forecast.dataBasis === "forecast"));
});

test("downgrades intraday requests beyond the 7-day window to full-day forecasts", () => {
  const output = lookupMockWeather({
    city: "Tokyo",
    dateRange: {
      startDate: "2026-07-10",
      endDate: "2026-07-12",
    },
    timeOfDay: ["afternoon", "night"],
  });

  assert.equal(output.forecasts.length, 3);
  assert.ok(output.forecasts.every((forecast) => forecast.timeOfDay === "full_day"));
  assert.ok(
    output.forecasts.every(
      (forecast) => forecast.dataBasis === "historical_average",
    ),
  );
  assertWarning(output, "INTRADAY_UNAVAILABLE_FOR_DATE_RANGE");
});

test("returns an unsupported city warning instead of throwing", () => {
  const output = lookupMockWeather({
    city: "Atlantis",
    dateRange: {
      startDate: "2026-06-10",
    },
  });

  assert.equal(output.forecasts.length, 0);
  assertWarning(output, "UNSUPPORTED_CITY");
});

test("throws for invalid date ranges", () => {
  assert.throws(
    () =>
      lookupMockWeather({
        city: "Seattle",
        dateRange: {
          startDate: "2026-06-12",
          endDate: "2026-06-10",
        },
      }),
    /startDate must be before or equal to endDate/,
  );
});

function assertWarning(output, code) {
  assert.ok(
    output.warnings?.some((warning) => warning.code === code),
    `Expected warning ${code}`,
  );
}

function test(name, run) {
  try {
    run();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}
