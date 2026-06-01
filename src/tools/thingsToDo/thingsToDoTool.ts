import {
  MOCK_THINGS_TO_DO_CURRENCY,
  MOCK_THINGS_TO_DO_END_DATE,
  MOCK_THINGS_TO_DO_GENERATED_AT,
  MOCK_THINGS_TO_DO_START_DATE,
  findMockThingsToDoCity,
  getMockActivities,
} from "./mockThingsToDoData.js";
import type {
  ActivityDateInfo,
  ActivityOption,
  IndoorOutdoorPreference,
  ThingsToDoLookupInput,
  ThingsToDoLookupOutput,
  ThingsToDoLookupWarning,
} from "./types.js";

const MAX_LOOKUP_DAYS = 61;

export function lookupMockThingsToDo(input: ThingsToDoLookupInput): ThingsToDoLookupOutput {
  const requestedEndDate = input.dateRange.endDate ?? input.dateRange.startDate;

  validateDateRange(input.dateRange.startDate, requestedEndDate);

  const city = findMockThingsToDoCity(input.city);
  const warnings: ThingsToDoLookupWarning[] = [];

  if (input.priceRange?.currency && input.priceRange.currency !== MOCK_THINGS_TO_DO_CURRENCY) {
    warnings.push({
      code: "UNSUPPORTED_CURRENCY",
      message: `Mock things-to-do data only supports ${MOCK_THINGS_TO_DO_CURRENCY}. Returned ${MOCK_THINGS_TO_DO_CURRENCY} prices.`,
    });
  }

  if (!city) {
    return buildOutput({
      city: input.city,
      startDate: input.dateRange.startDate,
      endDate: requestedEndDate,
      activities: [],
      warnings: [
        ...warnings,
        {
          code: "UNSUPPORTED_CITY",
          message: `No mock things-to-do data is available for ${input.city}.`,
        },
      ],
    });
  }

  const requestedDayCount = daysInclusive(input.dateRange.startDate, requestedEndDate);

  if (requestedDayCount > MAX_LOOKUP_DAYS) {
    warnings.push({
      code: "DATE_RANGE_TOO_LONG",
      message: `Things-to-do lookup supports up to ${MAX_LOOKUP_DAYS} days in the mock data set.`,
    });
  }

  if (
    input.dateRange.startDate < MOCK_THINGS_TO_DO_START_DATE ||
    requestedEndDate > MOCK_THINGS_TO_DO_END_DATE
  ) {
    warnings.push({
      code: "NO_DATA_FOR_DATE_RANGE",
      message: `No complete mock things-to-do data is available outside ${MOCK_THINGS_TO_DO_START_DATE} to ${MOCK_THINGS_TO_DO_END_DATE}.`,
    });
  }

  const allActivities = getMockActivities(city).filter((activity) =>
    overlapsRequestedDates(activity.dateInfo, input.dateRange.startDate, requestedEndDate),
  );
  const filteredActivities = allActivities.filter((activity) => matchesFilters(activity, input));

  if (allActivities.length === 0) {
    warnings.push({
      code: "NO_ACTIVITIES_FOUND",
      message: `No mock activities are available for ${city} in the requested date range.`,
    });
  } else if (filteredActivities.length === 0) {
    warnings.push({
      code: "FILTERS_TOO_RESTRICTIVE",
      message: "No activities match the requested filters.",
    });
  }

  if (filteredActivities.some(hasPartialData)) {
    warnings.push({
      code: "PARTIAL_DATA",
      message:
        "Some activity fields are unavailable in the mock data and should be treated as unknown.",
    });
  }

  return buildOutput({
    city,
    startDate: input.dateRange.startDate,
    endDate: requestedEndDate,
    activities: filteredActivities,
    warnings,
  });
}

function matchesFilters(activity: ActivityOption, input: ThingsToDoLookupInput): boolean {
  if (input.activityTypes && !input.activityTypes.includes(activity.activityType)) {
    return false;
  }

  if (
    input.interests &&
    !input.interests.some((interest) => activity.interests.includes(interest))
  ) {
    return false;
  }

  if (!matchesIndoorOutdoor(activity.indoorOutdoor, input.indoorOutdoorPreference)) {
    return false;
  }

  if (!matchesPrice(activity, input)) {
    return false;
  }

  return true;
}

function matchesIndoorOutdoor(
  activityIndoorOutdoor: ActivityOption["indoorOutdoor"],
  preference?: IndoorOutdoorPreference,
): boolean {
  if (!preference || preference === "any") {
    return true;
  }

  if (preference === "mixed") {
    return activityIndoorOutdoor === "mixed";
  }

  return activityIndoorOutdoor === preference || activityIndoorOutdoor === "mixed";
}

function matchesPrice(activity: ActivityOption, input: ThingsToDoLookupInput): boolean {
  if (!input.priceRange) {
    return true;
  }

  const amount = activity.price?.amount;

  if (amount === undefined) {
    return true;
  }

  if (input.priceRange.minPrice !== undefined && amount < input.priceRange.minPrice) {
    return false;
  }

  if (input.priceRange.maxPrice !== undefined && amount > input.priceRange.maxPrice) {
    return false;
  }

  return true;
}

function overlapsRequestedDates(
  dateInfo: ActivityDateInfo,
  startDate: string,
  endDate: string,
): boolean {
  if (dateInfo.kind === "general" || dateInfo.kind === "recurring") {
    return true;
  }

  if (dateInfo.kind === "scheduled") {
    const eventDate = dateInfo.startsAt.slice(0, 10);
    return eventDate >= startDate && eventDate <= endDate;
  }

  return dateInfo.startDate <= endDate && dateInfo.endDate >= startDate;
}

function buildOutput({
  city,
  startDate,
  endDate,
  activities,
  warnings,
}: {
  city: string;
  startDate: string;
  endDate: string;
  activities: ActivityOption[];
  warnings: ThingsToDoLookupWarning[];
}): ThingsToDoLookupOutput {
  return {
    city,
    dateRange: {
      startDate,
      endDate,
    },
    activities,
    warnings: warnings.length > 0 ? warnings : undefined,
    source: {
      provider: "MockThingsToDoProvider",
      generatedAt: MOCK_THINGS_TO_DO_GENERATED_AT,
      dataWindow: {
        startDate: MOCK_THINGS_TO_DO_START_DATE,
        endDate: MOCK_THINGS_TO_DO_END_DATE,
      },
    },
  };
}

function validateDateRange(startDate: string, endDate: string): void {
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
    throw new Error("Things-to-do lookup dates must use YYYY-MM-DD format.");
  }

  if (startDate > endDate) {
    throw new Error("Things-to-do lookup startDate must be before or equal to endDate.");
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

function hasPartialData(activity: ActivityOption): boolean {
  return (
    activity.price?.amount === undefined ||
    activity.location?.address === undefined ||
    activity.notes === undefined
  );
}
