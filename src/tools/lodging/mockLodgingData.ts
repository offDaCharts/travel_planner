import type {
  LodgingAmenity,
  LodgingAvailability,
  LodgingConcreteLuxuryLevel,
  LodgingOption,
  LodgingType,
} from "./types.js";

export const MOCK_LODGING_START_DATE = "2026-06-01";
export const MOCK_LODGING_END_DATE = "2026-07-31";
export const MOCK_LODGING_GENERATED_AT = "2026-06-01T00:00:00.000Z";
export const MOCK_LODGING_CURRENCY = "USD";

export const MOCK_LODGING_CITIES = [
  "Seattle",
  "Lisbon",
  "Austin",
  "Chicago",
  "Montreal",
  "New York",
  "San Francisco",
  "Tokyo",
  "Paris",
  "Barcelona",
] as const;

type LodgingPropertyTemplate = {
  id: string;
  name: string;
  lodgingType: LodgingType;
  luxuryLevel: LodgingConcreteLuxuryLevel;
  starRating?: number;
  baseNightlyRate: number;
  amenities: LodgingAmenity[];
  notes?: string[];
  availability: LodgingAvailability;
  omitTaxesAndFees?: boolean;
  omitNotes?: boolean;
};

type CityLodgingProfile = {
  city: string;
  rateMultiplier: number;
  properties: LodgingPropertyTemplate[];
};

export type MockLodgingProperty = Omit<
  LodgingOption,
  "nightlyRates" | "totalBeforeTaxes" | "taxesAndFees" | "totalEstimatedCost"
> & {
  baseNightlyRate: number;
};

export function findMockLodgingCity(city: string): string | undefined {
  const normalizedCity = normalizeCity(city);
  return MOCK_LODGING_CITIES.find(
    (mockCity) => normalizeCity(mockCity) === normalizedCity,
  );
}

export function getMockLodgingProperties(city: string): MockLodgingProperty[] {
  return MOCK_LODGING_PROPERTIES.filter((property) => property.id.startsWith(`${slug(city)}-`));
}

export function nightlyRateForDate(baseNightlyRate: number, city: string, date: string): number {
  const weekendBump = isWeekend(date) ? 24 : 0;
  const julyBump = date.slice(5, 7) === "07" ? 18 : 0;
  const deterministicBump = deterministicNumber(city, date, -12, 18);
  return Math.max(35, baseNightlyRate + weekendBump + julyBump + deterministicBump);
}

function generateMockLodgingProperties(): MockLodgingProperty[] {
  return CITY_PROFILES.flatMap((profile) =>
    profile.properties.map((property) => {
      const propertyId = `${slug(profile.city)}-${property.id}`;
      const baseNightlyRate = Math.round(property.baseNightlyRate * profile.rateMultiplier);
      const notes = property.omitNotes ? undefined : property.notes;

      return {
        id: propertyId,
        name: property.name,
        lodgingType: property.lodgingType,
        luxuryLevel: property.luxuryLevel,
        starRating: property.starRating,
        baseNightlyRate,
        amenities: property.amenities,
        notes,
        availability: property.availability,
      };
    }),
  );
}

const BASE_PROPERTIES: LodgingPropertyTemplate[] = [
  {
    id: "central-hotel",
    name: "Central House Hotel",
    lodgingType: "hotel",
    luxuryLevel: "standard",
    starRating: 3,
    baseNightlyRate: 165,
    amenities: ["wifi", "breakfast", "gym"],
    notes: ["Central location", "Breakfast included", "Compact rooms"],
    availability: "available",
  },
  {
    id: "market-boutique",
    name: "Market Street Boutique",
    lodgingType: "boutique_hotel",
    luxuryLevel: "upscale",
    starRating: 4,
    baseNightlyRate: 245,
    amenities: ["wifi", "breakfast", "accessible"],
    notes: ["Historic building", "Small lobby bar", "Limited onsite parking"],
    availability: "limited",
  },
  {
    id: "urban-apartment",
    name: "Urban Stay Apartment",
    lodgingType: "apartment",
    luxuryLevel: "standard",
    starRating: 3,
    baseNightlyRate: 205,
    amenities: ["wifi", "kitchen", "parking"],
    notes: ["Apartment-style rooms", "Kitchen included", "Self check-in"],
    availability: "available",
  },
  {
    id: "traveler-hostel",
    name: "Traveler Commons Hostel",
    lodgingType: "hostel",
    luxuryLevel: "budget",
    starRating: 2,
    baseNightlyRate: 78,
    amenities: ["wifi", "kitchen"],
    notes: ["Shared kitchen", "Private rooms available", "Shared common area"],
    availability: "available",
    omitTaxesAndFees: true,
  },
  {
    id: "grand-resort",
    name: "Grand View Resort",
    lodgingType: "resort",
    luxuryLevel: "luxury",
    starRating: 5,
    baseNightlyRate: 390,
    amenities: ["wifi", "pool", "gym", "breakfast", "accessible"],
    notes: ["Pool onsite", "Large rooms", "Spa services onsite"],
    availability: "limited",
  },
];

const CITY_PROFILES: CityLodgingProfile[] = [
  cityProfile("Seattle", 1.16),
  cityProfile("Lisbon", 0.88),
  cityProfile("Austin", 1.02),
  cityProfile("Chicago", 1.1),
  cityProfile("Montreal", 0.96),
  cityProfile("New York", 1.45),
  cityProfile("San Francisco", 1.42),
  cityProfile("Tokyo", 1.18),
  cityProfile("Paris", 1.32),
  cityProfile("Barcelona", 1.08),
];

export const MOCK_LODGING_PROPERTIES = generateMockLodgingProperties();

function cityProfile(city: string, rateMultiplier: number): CityLodgingProfile {
  return {
    city,
    rateMultiplier,
    properties: BASE_PROPERTIES.map((property) => ({
      ...property,
      name: `${city} ${property.name}`,
    })),
  };
}

function isWeekend(date: string): boolean {
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return day === 5 || day === 6;
}

function deterministicNumber(seedA: string, seedB: string, min: number, max: number): number {
  const seed = `${seedA}:${seedB}`;
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return min + (hash % (max - min + 1));
}

function normalizeCity(city: string): string {
  return city.trim().toLowerCase();
}

function slug(value: string): string {
  return normalizeCity(value).replaceAll(" ", "-");
}
