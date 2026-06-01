import assert from "node:assert/strict";
import {
  MOCK_THINGS_TO_DO_ACTIVITIES,
  MOCK_THINGS_TO_DO_CITIES,
  lookupMockThingsToDo,
} from "../.tmp/things-to-do-build/thingsToDo/index.js";

test("mock data covers 10 cities with six activities each", () => {
  assert.equal(MOCK_THINGS_TO_DO_CITIES.length, 10);
  assert.equal(MOCK_THINGS_TO_DO_ACTIVITIES.length, 60);
});

test("returns general and recurring activities for a supported city and date range", () => {
  const output = lookupMockThingsToDo({
    city: "Seattle",
    dateRange: {
      startDate: "2026-06-10",
      endDate: "2026-06-13",
    },
  });

  assert.equal(output.city, "Seattle");
  assert.ok(output.activities.length >= 5);
  assert.ok(
    output.activities.some((activity) => activity.dateInfo.kind === "general"),
  );
  assert.ok(
    output.activities.some((activity) => activity.dateInfo.kind === "recurring"),
  );
});

test("returns scheduled activities only when they overlap the requested dates", () => {
  const fullWindow = lookupMockThingsToDo({
    city: "Tokyo",
    dateRange: {
      startDate: "2026-06-01",
      endDate: "2026-07-31",
    },
  });
  const scheduled = fullWindow.activities.find(
    (activity) => activity.dateInfo.kind === "scheduled",
  );

  assert.ok(scheduled);

  const eventDate = scheduled.dateInfo.kind === "scheduled"
    ? scheduled.dateInfo.startsAt.slice(0, 10)
    : "";
  const eventDay = lookupMockThingsToDo({
    city: "Tokyo",
    dateRange: {
      startDate: eventDate,
      endDate: eventDate,
    },
  });
  const nonEventDay = lookupMockThingsToDo({
    city: "Tokyo",
    dateRange: {
      startDate: "2026-06-01",
      endDate: "2026-06-01",
    },
  });

  assert.ok(eventDay.activities.some((activity) => activity.id === scheduled.id));
  assert.ok(!nonEventDay.activities.some((activity) => activity.id === scheduled.id));
});

test("filters by interests, activity types, indoor/outdoor preference, and price", () => {
  const output = lookupMockThingsToDo({
    city: "Paris",
    dateRange: {
      startDate: "2026-07-05",
      endDate: "2026-07-08",
    },
    interests: ["art"],
    activityTypes: ["museum"],
    indoorOutdoorPreference: "indoor",
    priceRange: {
      maxPrice: 40,
      currency: "USD",
    },
  });

  assert.equal(output.activities.length, 1);
  assert.equal(output.activities[0].activityType, "museum");
  assert.equal(output.activities[0].indoorOutdoor, "indoor");
});

test("accepts weather context without filtering out activities by weather", () => {
  const output = lookupMockThingsToDo({
    city: "Chicago",
    dateRange: {
      startDate: "2026-06-10",
      endDate: "2026-06-12",
    },
    weather: {
      periods: [
        {
          date: "2026-06-10",
          timeOfDay: "full_day",
          precipitationProbabilityPercent: 95,
          precipitationType: "rain",
        },
      ],
    },
  });

  assert.ok(output.activities.some((activity) => activity.indoorOutdoor === "outdoor"));
  assert.ok(
    output.activities.some((activity) =>
      activity.weatherSuitability?.some((item) => item.condition === "rain"),
    ),
  );
});

test("returns filters-too-restrictive warning when no activity matches", () => {
  const output = lookupMockThingsToDo({
    city: "Lisbon",
    dateRange: {
      startDate: "2026-06-10",
      endDate: "2026-06-12",
    },
    activityTypes: ["sports"],
    indoorOutdoorPreference: "indoor",
  });

  assert.equal(output.activities.length, 0);
  assertWarning(output, "FILTERS_TOO_RESTRICTIVE");
});

test("returns unsupported city warning instead of throwing", () => {
  const output = lookupMockThingsToDo({
    city: "Atlantis",
    dateRange: {
      startDate: "2026-06-10",
    },
  });

  assert.equal(output.activities.length, 0);
  assertWarning(output, "UNSUPPORTED_CITY");
});

test("throws for invalid date ranges", () => {
  assert.throws(
    () =>
      lookupMockThingsToDo({
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
