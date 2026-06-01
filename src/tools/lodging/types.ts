export type LodgingLuxuryLevel =
  | "budget"
  | "standard"
  | "upscale"
  | "luxury"
  | "any";

export type LodgingConcreteLuxuryLevel = Exclude<LodgingLuxuryLevel, "any">;

export type LodgingType =
  | "hotel"
  | "boutique_hotel"
  | "apartment"
  | "hostel"
  | "resort";

export type LodgingAmenity =
  | "wifi"
  | "breakfast"
  | "parking"
  | "pool"
  | "gym"
  | "kitchen"
  | "pet_friendly"
  | "accessible";

export type LodgingAvailability =
  | "available"
  | "limited"
  | "unavailable";

export type LodgingLookupInput = {
  city: string;
  dateRange: {
    checkInDate: string;
    checkOutDate: string;
  };
  guests?: {
    adults: number;
    children?: number;
    rooms?: number;
  };
  luxuryLevel?: LodgingLuxuryLevel;
  priceRange?: {
    minNightlyRate?: number;
    maxNightlyRate?: number;
    currency?: string;
  };
  lodgingTypes?: LodgingType[];
  amenities?: LodgingAmenity[];
  starRatingMin?: number;
};

export type LodgingGuests = {
  adults: number;
  children: number;
  rooms: number;
};

export type NightlyRate = {
  date: string;
  rate: number;
  currency: string;
};

export type LodgingOption = {
  id: string;
  name: string;
  lodgingType: LodgingType;
  luxuryLevel: LodgingConcreteLuxuryLevel;
  starRating?: number;
  nightlyRates: NightlyRate[];
  totalBeforeTaxes: number;
  taxesAndFees?: number;
  totalEstimatedCost?: number;
  amenities: LodgingAmenity[];
  notes?: string[];
  availability: LodgingAvailability;
};

export type LodgingLookupWarningCode =
  | "UNSUPPORTED_CITY"
  | "NO_LODGING_AVAILABLE"
  | "PARTIAL_DATA"
  | "DATE_RANGE_TOO_LONG"
  | "FILTERS_TOO_RESTRICTIVE"
  | "NO_DATA_FOR_DATE_RANGE"
  | "UNSUPPORTED_CURRENCY";

export type LodgingLookupWarning = {
  code: LodgingLookupWarningCode;
  message: string;
};

export type LodgingLookupOutput = {
  city: string;
  dateRange: {
    checkInDate: string;
    checkOutDate: string;
    nights: number;
  };
  guests: LodgingGuests;
  lodgingOptions: LodgingOption[];
  warnings?: LodgingLookupWarning[];
  source: {
    provider: "MockLodgingProvider";
    generatedAt: string;
    dataWindow: {
      startDate: string;
      endDate: string;
    };
  };
};
