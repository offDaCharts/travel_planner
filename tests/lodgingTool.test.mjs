import assert from "node:assert/strict";
import {
  MOCK_LODGING_CITIES,
  MOCK_LODGING_PROPERTIES,
  lookupMockLodging,
} from "../.tmp/lodging-build/src/tools/lodging/index.js";

test("mock data covers 10 cities with five properties each", () => {
  assert.equal(MOCK_LODGING_CITIES.length, 10);
  assert.equal(MOCK_LODGING_PROPERTIES.length, 50);
});

test("returns multiple lodging options with checkout excluded from billed nights", () => {
  const output = lookupMockLodging({
    city: "Seattle",
    dateRange: {
      checkInDate: "2026-06-10",
      checkOutDate: "2026-06-13",
    },
  });

  assert.equal(output.city, "Seattle");
  assert.equal(output.dateRange.nights, 3);
  assert.equal(output.lodgingOptions.length, 5);
  assert.ok(
    output.lodgingOptions.every((option) => option.nightlyRates.length === 3),
  );
  assert.ok(
    output.lodgingOptions.every((option) =>
      option.nightlyRates.every((nightlyRate) => nightlyRate.currency === "USD"),
    ),
  );
});

test("normalizes guests and applies room count to nightly rates", () => {
  const oneRoom = lookupMockLodging({
    city: "Austin",
    dateRange: {
      checkInDate: "2026-06-19",
      checkOutDate: "2026-06-20",
    },
    lodgingTypes: ["apartment"],
  });
  const twoRooms = lookupMockLodging({
    city: "Austin",
    dateRange: {
      checkInDate: "2026-06-19",
      checkOutDate: "2026-06-20",
    },
    guests: {
      adults: 4,
      rooms: 2,
    },
    lodgingTypes: ["apartment"],
  });

  assert.deepEqual(twoRooms.guests, { adults: 4, children: 0, rooms: 2 });
  assert.equal(
    twoRooms.lodgingOptions[0].nightlyRates[0].rate,
    oneRoom.lodgingOptions[0].nightlyRates[0].rate * 2,
  );
});

test("filters by luxury level, lodging type, amenities, price, and star minimum", () => {
  const output = lookupMockLodging({
    city: "Paris",
    dateRange: {
      checkInDate: "2026-07-05",
      checkOutDate: "2026-07-08",
    },
    luxuryLevel: "luxury",
    lodgingTypes: ["resort"],
    amenities: ["pool", "gym"],
    priceRange: {
      minNightlyRate: 500,
      maxNightlyRate: 700,
      currency: "USD",
    },
    starRatingMin: 5,
  });

  assert.equal(output.lodgingOptions.length, 1);
  assert.equal(output.lodgingOptions[0].luxuryLevel, "luxury");
  assert.equal(output.lodgingOptions[0].lodgingType, "resort");
});

test("returns filters-too-restrictive warning when no option matches", () => {
  const output = lookupMockLodging({
    city: "Lisbon",
    dateRange: {
      checkInDate: "2026-06-10",
      checkOutDate: "2026-06-12",
    },
    priceRange: {
      maxNightlyRate: 40,
      currency: "USD",
    },
  });

  assert.equal(output.lodgingOptions.length, 0);
  assertWarning(output, "FILTERS_TOO_RESTRICTIVE");
});

test("returns unsupported city warning instead of throwing", () => {
  const output = lookupMockLodging({
    city: "Atlantis",
    dateRange: {
      checkInDate: "2026-06-10",
      checkOutDate: "2026-06-12",
    },
  });

  assert.equal(output.lodgingOptions.length, 0);
  assertWarning(output, "UNSUPPORTED_CITY");
});

test("throws when checkout is not after checkin", () => {
  assert.throws(
    () =>
      lookupMockLodging({
        city: "Seattle",
        dateRange: {
          checkInDate: "2026-06-12",
          checkOutDate: "2026-06-12",
        },
      }),
    /checkOutDate must be after checkInDate/,
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
