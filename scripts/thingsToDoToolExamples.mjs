import { lookupMockThingsToDo } from "../.tmp/things-to-do-build/src/tools/thingsToDo/thingsToDoTool.js";

const exampleRequests = [
  {
    label: "Default Seattle activities",
    input: {
      city: "Seattle",
      dateRange: {
        startDate: "2026-06-10",
        endDate: "2026-06-13",
      },
    },
  },
  {
    label: "Paris indoor art and history",
    input: {
      city: "Paris",
      dateRange: {
        startDate: "2026-07-05",
        endDate: "2026-07-08",
      },
      interests: ["art", "history"],
      indoorOutdoorPreference: "indoor",
      priceRange: {
        maxPrice: 40,
        currency: "USD",
      },
    },
  },
  {
    label: "Tokyo outdoor/event request with weather context",
    input: {
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
  const output = lookupMockThingsToDo(example.input);

  console.log(`\n=== ${example.label} ===`);
  console.log(`Input: ${JSON.stringify(example.input)}`);
  console.log(`City: ${output.city}`);
  console.log(`Date range: ${output.dateRange.startDate} to ${output.dateRange.endDate}`);
  console.log(`Activities returned: ${output.activities.length}`);
  console.log(
    `Warnings: ${
      output.warnings?.map((warning) => warning.code).join(", ") ?? "none"
    }`,
  );

  for (const activity of output.activities.slice(0, 6)) {
    console.log(
      [
        `- ${activity.name}`,
        activity.activityType,
        activity.dateInfo.kind,
        activity.indoorOutdoor,
        priceLabel(activity),
        `interests=${activity.interests.join(", ")}`,
      ].join(" | "),
    );
  }
}

function priceLabel(activity) {
  if (!activity.price) {
    return "price=unknown";
  }

  if (activity.price.pricingType === "free") {
    return "price=free";
  }

  if (activity.price.amount === undefined) {
    return `price=${activity.price.pricingType}`;
  }

  return `price=${activity.price.currency ?? "USD"} ${activity.price.amount}`;
}
