import {
  MOCK_LODGING_CURRENCY,
  MOCK_LODGING_END_DATE,
  MOCK_LODGING_GENERATED_AT,
  MOCK_LODGING_START_DATE,
  findMockLodgingCity,
  getMockLodgingProperties,
  nightlyRateForDate,
} from "./mockLodgingData.js";
import type {
  LodgingAmenity,
  LodgingGuests,
  LodgingLookupInput,
  LodgingLookupOutput,
  LodgingLookupWarning,
  LodgingOption,
} from "./types.js";

const DEFAULT_GUESTS: LodgingGuests = {
  adults: 1,
  children: 0,
  rooms: 1,
};

const MAX_LOOKUP_NIGHTS = 60;

export function lookupMockLodging(input: LodgingLookupInput): LodgingLookupOutput {
  validateDateRange(input.dateRange.checkInDate, input.dateRange.checkOutDate);

  const city = findMockLodgingCity(input.city);
  const guests = normalizeGuests(input.guests);
  const warnings: LodgingLookupWarning[] = [];

  if (input.priceRange?.currency && input.priceRange.currency !== MOCK_LODGING_CURRENCY) {
    warnings.push({
      code: "UNSUPPORTED_CURRENCY",
      message: `Mock lodging data only supports ${MOCK_LODGING_CURRENCY}. Returned ${MOCK_LODGING_CURRENCY} prices.`,
    });
  }

  if (!city) {
    return buildOutput({
      city: input.city,
      checkInDate: input.dateRange.checkInDate,
      checkOutDate: input.dateRange.checkOutDate,
      guests,
      lodgingOptions: [],
      warnings: [
        ...warnings,
        {
          code: "UNSUPPORTED_CITY",
          message: `No mock lodging data is available for ${input.city}.`,
        },
      ],
    });
  }

  const nights = nightsBetween(input.dateRange.checkInDate, input.dateRange.checkOutDate);

  if (nights > MAX_LOOKUP_NIGHTS) {
    warnings.push({
      code: "DATE_RANGE_TOO_LONG",
      message: `Lodging lookup supports up to ${MAX_LOOKUP_NIGHTS} billed nights in the mock data set.`,
    });
  }

  if (
    input.dateRange.checkInDate < MOCK_LODGING_START_DATE ||
    previousDate(input.dateRange.checkOutDate) > MOCK_LODGING_END_DATE
  ) {
    warnings.push({
      code: "NO_DATA_FOR_DATE_RANGE",
      message: `No complete mock lodging data is available for stays outside ${MOCK_LODGING_START_DATE} to ${MOCK_LODGING_END_DATE}.`,
    });
  }

  const stayDates = listBilledNightDates(
    input.dateRange.checkInDate,
    input.dateRange.checkOutDate,
  ).filter((date) => date >= MOCK_LODGING_START_DATE && date <= MOCK_LODGING_END_DATE);

  const allOptions = getMockLodgingProperties(city)
    .map((property) => buildLodgingOption(property, city, stayDates, guests.rooms))
    .filter((option) => option.nightlyRates.length > 0);
  const filteredOptions = allOptions.filter((option) => matchesFilters(option, input));

  if (allOptions.length === 0) {
    warnings.push({
      code: "NO_LODGING_AVAILABLE",
      message: `No lodging options are available for ${city} in the requested date range.`,
    });
  } else if (filteredOptions.length === 0) {
    warnings.push({
      code: "FILTERS_TOO_RESTRICTIVE",
      message: "No lodging options match the requested filters.",
    });
  }

  if (filteredOptions.some(hasPartialData)) {
    warnings.push({
      code: "PARTIAL_DATA",
      message:
        "Some lodging fields are unavailable in the mock data and should be treated as unknown.",
    });
  }

  return buildOutput({
    city,
    checkInDate: input.dateRange.checkInDate,
    checkOutDate: input.dateRange.checkOutDate,
    guests,
    lodgingOptions: filteredOptions,
    warnings,
  });
}

function buildLodgingOption(
  property: ReturnType<typeof getMockLodgingProperties>[number],
  city: string,
  stayDates: string[],
  rooms: number,
): LodgingOption {
  const nightlyRates = stayDates.map((date) => ({
    date,
    rate: nightlyRateForDate(property.baseNightlyRate, `${city}:${property.id}`, date) * rooms,
    currency: MOCK_LODGING_CURRENCY,
  }));
  const totalBeforeTaxes = nightlyRates.reduce((total, nightlyRate) => total + nightlyRate.rate, 0);
  const taxesAndFees =
    property.lodgingType === "hostel" ? undefined : Math.round(totalBeforeTaxes * 0.14);

  return {
    id: property.id,
    name: property.name,
    lodgingType: property.lodgingType,
    luxuryLevel: property.luxuryLevel,
    starRating: property.starRating,
    nightlyRates,
    totalBeforeTaxes,
    taxesAndFees,
    totalEstimatedCost:
      taxesAndFees === undefined ? undefined : totalBeforeTaxes + taxesAndFees,
    amenities: property.amenities,
    notes: property.notes,
    availability: property.availability,
  };
}

function matchesFilters(option: LodgingOption, input: LodgingLookupInput): boolean {
  if (input.luxuryLevel && input.luxuryLevel !== "any" && option.luxuryLevel !== input.luxuryLevel) {
    return false;
  }

  if (input.lodgingTypes && !input.lodgingTypes.includes(option.lodgingType)) {
    return false;
  }

  if (input.starRatingMin !== undefined && (option.starRating ?? 0) < input.starRatingMin) {
    return false;
  }

  if (
    input.amenities &&
    !input.amenities.every((amenity: LodgingAmenity) => option.amenities.includes(amenity))
  ) {
    return false;
  }

  const nightlyRates = option.nightlyRates.map((nightlyRate) => nightlyRate.rate);
  const minRate = Math.min(...nightlyRates);
  const maxRate = Math.max(...nightlyRates);

  if (
    input.priceRange?.minNightlyRate !== undefined &&
    maxRate < input.priceRange.minNightlyRate
  ) {
    return false;
  }

  if (
    input.priceRange?.maxNightlyRate !== undefined &&
    minRate > input.priceRange.maxNightlyRate
  ) {
    return false;
  }

  return true;
}

function buildOutput({
  city,
  checkInDate,
  checkOutDate,
  guests,
  lodgingOptions,
  warnings,
}: {
  city: string;
  checkInDate: string;
  checkOutDate: string;
  guests: LodgingGuests;
  lodgingOptions: LodgingOption[];
  warnings: LodgingLookupWarning[];
}): LodgingLookupOutput {
  return {
    city,
    dateRange: {
      checkInDate,
      checkOutDate,
      nights: nightsBetween(checkInDate, checkOutDate),
    },
    guests,
    lodgingOptions,
    warnings: warnings.length > 0 ? warnings : undefined,
    source: {
      provider: "MockLodgingProvider",
      generatedAt: MOCK_LODGING_GENERATED_AT,
      dataWindow: {
        startDate: MOCK_LODGING_START_DATE,
        endDate: MOCK_LODGING_END_DATE,
      },
    },
  };
}

function normalizeGuests(guests?: LodgingLookupInput["guests"]): LodgingGuests {
  return {
    adults: guests?.adults ?? DEFAULT_GUESTS.adults,
    children: guests?.children ?? DEFAULT_GUESTS.children,
    rooms: guests?.rooms ?? DEFAULT_GUESTS.rooms,
  };
}

function validateDateRange(checkInDate: string, checkOutDate: string): void {
  if (!isIsoDate(checkInDate) || !isIsoDate(checkOutDate)) {
    throw new Error("Lodging lookup dates must use YYYY-MM-DD format.");
  }

  if (checkInDate >= checkOutDate) {
    throw new Error("Lodging lookup checkOutDate must be after checkInDate.");
  }
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function nightsBetween(checkInDate: string, checkOutDate: string): number {
  const checkIn = new Date(`${checkInDate}T00:00:00.000Z`).getTime();
  const checkOut = new Date(`${checkOutDate}T00:00:00.000Z`).getTime();
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((checkOut - checkIn) / millisecondsPerDay);
}

function listBilledNightDates(checkInDate: string, checkOutDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${checkInDate}T00:00:00.000Z`);
  const checkOut = new Date(`${checkOutDate}T00:00:00.000Z`);

  while (current < checkOut) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function previousDate(date: string): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

function hasPartialData(option: LodgingOption): boolean {
  return option.taxesAndFees === undefined || option.totalEstimatedCost === undefined || !option.notes;
}
