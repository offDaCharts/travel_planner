import { lookupMockWeather } from "../.tmp/weather-build/weather/weatherTool.js";

const exampleRequests = [
  {
    label: "Near-term intraday Seattle request",
    input: {
      city: "Seattle",
      dateRange: {
        startDate: "2026-06-03",
        endDate: "2026-06-04",
      },
      timeOfDay: ["morning", "evening"],
    },
  },
  {
    label: "Multi-day Lisbon full-day request",
    input: {
      city: "Lisbon",
      dateRange: {
        startDate: "2026-06-12",
        endDate: "2026-06-16",
      },
    },
  },
  {
    label: "Future intraday request downgraded to full-day",
    input: {
      city: "Tokyo",
      dateRange: {
        startDate: "2026-07-10",
        endDate: "2026-07-12",
      },
      timeOfDay: ["afternoon", "night"],
    },
  },
  {
    label: "Unsupported city request",
    input: {
      city: "Atlantis",
      dateRange: {
        startDate: "2026-06-10",
      },
    },
  },
];

for (const example of exampleRequests) {
  const output = lookupMockWeather(example.input);

  console.log(`\n=== ${example.label} ===`);
  console.log(`Input: ${JSON.stringify(example.input)}`);
  console.log(`City: ${output.city}`);
  console.log(
    `Date range: ${output.dateRange.startDate} to ${output.dateRange.endDate}`,
  );
  console.log(`Forecast periods returned: ${output.forecasts.length}`);
  console.log(
    `Times of day: ${formatUnique(output.forecasts.map((period) => period.timeOfDay))}`,
  );
  console.log(
    `Data basis: ${formatUnique(output.forecasts.map((period) => period.dataBasis))}`,
  );
  console.log(
    `Warnings: ${
      output.warnings?.map((warning) => warning.code).join(", ") ?? "none"
    }`,
  );

  for (const forecast of output.forecasts.slice(0, 4)) {
    console.log(
      [
        `- ${forecast.date}`,
        forecast.timeOfDay,
        forecast.summary ?? "no summary",
        `precip=${forecast.precipitation?.probabilityPercent ?? "unknown"}%`,
      ].join(" | "),
    );
  }

  if (output.forecasts.length > 4) {
    console.log(`- ... ${output.forecasts.length - 4} more periods`);
  }
}

function formatUnique(values) {
  const uniqueValues = [...new Set(values.filter(Boolean))];
  return uniqueValues.length > 0 ? uniqueValues.join(", ") : "none";
}
