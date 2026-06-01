import { lookupMockLodging } from "../.tmp/lodging-build/lodging/lodgingTool.js";

const exampleRequests = [
  {
    label: "Default Seattle stay",
    input: {
      city: "Seattle",
      dateRange: {
        checkInDate: "2026-06-10",
        checkOutDate: "2026-06-13",
      },
    },
  },
  {
    label: "Lisbon upscale or luxury filter",
    input: {
      city: "Lisbon",
      dateRange: {
        checkInDate: "2026-07-02",
        checkOutDate: "2026-07-06",
      },
      luxuryLevel: "upscale",
      guests: {
        adults: 2,
        rooms: 1,
      },
      amenities: ["wifi", "breakfast"],
      starRatingMin: 4,
    },
  },
  {
    label: "Austin apartment with price ceiling",
    input: {
      city: "Austin",
      dateRange: {
        checkInDate: "2026-06-19",
        checkOutDate: "2026-06-22",
      },
      guests: {
        adults: 4,
        children: 0,
        rooms: 2,
      },
      lodgingTypes: ["apartment"],
      priceRange: {
        maxNightlyRate: 500,
        currency: "USD",
      },
      amenities: ["kitchen", "parking"],
    },
  },
  {
    label: "Unsupported city request",
    input: {
      city: "Atlantis",
      dateRange: {
        checkInDate: "2026-06-10",
        checkOutDate: "2026-06-12",
      },
    },
  },
];

for (const example of exampleRequests) {
  const output = lookupMockLodging(example.input);

  console.log(`\n=== ${example.label} ===`);
  console.log(`Input: ${JSON.stringify(example.input)}`);
  console.log(`City: ${output.city}`);
  console.log(
    `Stay: ${output.dateRange.checkInDate} to ${output.dateRange.checkOutDate} (${output.dateRange.nights} nights)`,
  );
  console.log(
    `Guests: ${output.guests.adults} adults, ${output.guests.children} children, ${output.guests.rooms} room(s)`,
  );
  console.log(`Options returned: ${output.lodgingOptions.length}`);
  console.log(
    `Warnings: ${
      output.warnings?.map((warning) => warning.code).join(", ") ?? "none"
    }`,
  );

  for (const option of output.lodgingOptions.slice(0, 4)) {
    const firstRate = option.nightlyRates[0];
    const lastRate = option.nightlyRates.at(-1);
    console.log(
      [
        `- ${option.name}`,
        option.lodgingType,
        option.luxuryLevel,
        `${option.starRating ?? "unknown"} stars`,
        `${firstRate?.currency ?? "USD"} ${firstRate?.rate ?? "n/a"}-${lastRate?.rate ?? "n/a"}/night`,
        `total=${option.totalEstimatedCost ?? "unknown"}`,
        `amenities=${option.amenities.join(", ")}`,
      ].join(" | "),
    );
  }
}
