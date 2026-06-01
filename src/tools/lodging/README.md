# Lodging Tool Instructions

## Purpose

Use the Lodging tool to retrieve lodging options and nightly prices for a city and stay date range. This tool is informational only: it does not rank hotels, choose the best option, or make traveler-specific recommendations.

Call this tool when the assistant needs lodging availability-style mock data, nightly rates, total estimated lodging costs, amenities, star ratings, or factual lodging notes.

## Function

```ts
lookupMockLodging(input: LodgingLookupInput): LodgingLookupOutput
```

Import from:

```ts
import { lookupMockLodging } from "./src/tools/lodging/index.js";
```

## Input Schema

```ts
type LodgingLookupInput = {
  city: string;
  dateRange: {
    checkInDate: string;  // YYYY-MM-DD
    checkOutDate: string; // YYYY-MM-DD; not a billed night
  };
  guests?: {
    adults: number;
    children?: number;
    rooms?: number;
  };
  luxuryLevel?: "budget" | "standard" | "upscale" | "luxury" | "any";
  priceRange?: {
    minNightlyRate?: number;
    maxNightlyRate?: number;
    currency?: string;
  };
  lodgingTypes?: LodgingType[];
  amenities?: LodgingAmenity[];
  starRatingMin?: number;
};
```

```ts
type LodgingType =
  | "hotel"
  | "boutique_hotel"
  | "apartment"
  | "hostel"
  | "resort";

type LodgingAmenity =
  | "wifi"
  | "breakfast"
  | "parking"
  | "pool"
  | "gym"
  | "kitchen"
  | "pet_friendly"
  | "accessible";
```

## Input Rules

- `city`, `checkInDate`, and `checkOutDate` are required.
- Dates must already be normalized to `YYYY-MM-DD`.
- `checkOutDate` must be after `checkInDate`.
- Checkout day is not billed.
- `guests` defaults to 1 adult, 0 children, and 1 room.
- `luxuryLevel` defaults to `any`.
- Omitted filters mean no restriction for that category.
- Mock prices are in USD. A different requested currency returns `UNSUPPORTED_CURRENCY` but still returns USD prices.
- The mock data window is `2026-06-01` through `2026-07-31`.

## Output Schema

```ts
type LodgingLookupOutput = {
  city: string;
  dateRange: {
    checkInDate: string;
    checkOutDate: string;
    nights: number;
  };
  guests: {
    adults: number;
    children: number;
    rooms: number;
  };
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
```

```ts
type LodgingOption = {
  id: string;
  name: string;
  lodgingType: LodgingType;
  luxuryLevel: "budget" | "standard" | "upscale" | "luxury";
  starRating?: number;
  nightlyRates: {
    date: string;
    rate: number;
    currency: string;
  }[];
  totalBeforeTaxes: number;
  taxesAndFees?: number;
  totalEstimatedCost?: number;
  amenities: LodgingAmenity[];
  notes?: string[];
  availability: "available" | "limited" | "unavailable";
};
```

## Warnings

Possible warning codes:

- `UNSUPPORTED_CITY`: the city is not in the mock data set.
- `NO_LODGING_AVAILABLE`: no lodging options exist for the city/date range.
- `PARTIAL_DATA`: some optional fields are missing and should be treated as unknown.
- `DATE_RANGE_TOO_LONG`: requested stay exceeds the mock support limit.
- `FILTERS_TOO_RESTRICTIVE`: options existed before filtering, but no option matched the requested filters.
- `NO_DATA_FOR_DATE_RANGE`: the requested stay extends outside the mock data window.
- `UNSUPPORTED_CURRENCY`: requested currency is unsupported; USD prices were returned.

## Agent Handling Guidance

- Treat missing `taxesAndFees`, `totalEstimatedCost`, `starRating`, or `notes` as unknown.
- Compare costs using `nightlyRates`, `totalBeforeTaxes`, or `totalEstimatedCost` depending on what is available.
- Do not assume `availability` means real-time bookability; this is mock informational data.
- Do not use this tool to rank or recommend lodging. Interpret lodging fit in the assistant synthesis layer.

## Example

```ts
const lodging = lookupMockLodging({
  city: "Lisbon",
  dateRange: {
    checkInDate: "2026-07-02",
    checkOutDate: "2026-07-06",
  },
  guests: {
    adults: 2,
    rooms: 1,
  },
  luxuryLevel: "upscale",
  amenities: ["wifi", "breakfast"],
  starRatingMin: 4,
});
```
