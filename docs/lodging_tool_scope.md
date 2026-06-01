# Lodging Tool Scope

## Purpose

The Lodging tool returns normalized lodging option and price data for a city and stay date range. It does not rank hotels, recommend a best option, or interpret whether a property is a good fit for a traveler. The assistant layer is responsible for comparison and synthesis.

## Inputs

```ts
type LodgingLookupInput = {
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
```

- `city` is city-level only for this phase.
- Dates must be normalized before the tool is called and must use `YYYY-MM-DD`.
- `checkOutDate` is not a billed night.
- `guests` defaults to 1 adult, 0 children, and 1 room.
- Currency is included with prices. The mock data currently supports USD only.
- Omitted filters mean no restriction for that category.

## Outputs

The tool returns:

- normalized city and stay date range
- billed night count
- normalized guest count
- multiple lodging options
- per-night rates for each billed night
- total before taxes
- taxes and fees when available
- total estimated cost when available
- source metadata for the mock provider and mock data window
- warnings when data is unavailable, incomplete, or filtered out

Each lodging option may include:

- property id and name
- lodging type
- luxury level
- star rating
- nightly rates with currency
- total prices
- amenities
- factual notes
- availability status

Neighborhood, guest rating, and cancellation policy are out of scope for this phase.

## Mock Data

The mock data set covers 10 cities from June 1 through July 31, 2026:

- Seattle
- Lisbon
- Austin
- Chicago
- Montreal
- New York
- San Francisco
- Tokyo
- Paris
- Barcelona

Each city has five lodging property templates:

- standard hotel
- upscale boutique hotel
- apartment
- budget hostel
- luxury resort

The data is deterministic so the same city/date/filter input always returns the same output.
