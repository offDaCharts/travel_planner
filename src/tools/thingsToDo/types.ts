import type {
  CloudinessLevel,
  PrecipitationType,
  WeatherTimeOfDay,
} from "../weather/types.js";

export type ActivityType =
  | "event"
  | "museum"
  | "landmark"
  | "tour"
  | "restaurant"
  | "nightlife"
  | "park"
  | "outdoor_activity"
  | "shopping"
  | "performing_arts"
  | "sports"
  | "family_activity"
  | "local_experience";

export type ActivityInterest =
  | "food"
  | "history"
  | "art"
  | "music"
  | "nature"
  | "architecture"
  | "sports"
  | "shopping"
  | "nightlife"
  | "family"
  | "wellness"
  | "local_culture";

export type IndoorOutdoor = "indoor" | "outdoor" | "mixed" | "unknown";

export type IndoorOutdoorPreference = IndoorOutdoor | "any";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type OpeningHours = {
  dayOfWeek?: DayOfWeek;
  opensAt?: string;
  closesAt?: string;
};

export type ActivityDateInfo =
  | {
      kind: "scheduled";
      startsAt: string;
      endsAt?: string;
    }
  | {
      kind: "date_range";
      startDate: string;
      endDate: string;
      hours?: OpeningHours[];
    }
  | {
      kind: "recurring";
      daysOfWeek: DayOfWeek[];
      hours?: OpeningHours[];
    }
  | {
      kind: "general";
      hours?: OpeningHours[];
    };

export type ActivityPrice = {
  amount?: number;
  currency?: string;
  pricingType: "free" | "paid" | "variable" | "unknown";
};

export type WeatherSuitability = {
  condition: "rain" | "snow" | "heat" | "cold" | "wind" | "clear" | "any";
  suitability: "good" | "okay" | "poor" | "closed_or_unavailable";
};

export type ThingsToDoWeatherContext = {
  periods: {
    date: string;
    timeOfDay?: WeatherTimeOfDay;
    temperatureHigh?: number;
    temperatureLow?: number;
    temperatureAverage?: number;
    precipitationProbabilityPercent?: number;
    precipitationType?: PrecipitationType;
    cloudiness?: CloudinessLevel;
    windSpeed?: number;
  }[];
};

export type ThingsToDoLookupInput = {
  city: string;
  dateRange: {
    startDate: string;
    endDate?: string;
  };
  weather?: ThingsToDoWeatherContext;
  interests?: ActivityInterest[];
  activityTypes?: ActivityType[];
  indoorOutdoorPreference?: IndoorOutdoorPreference;
  priceRange?: {
    minPrice?: number;
    maxPrice?: number;
    currency?: string;
  };
};

export type ActivityOption = {
  id: string;
  name: string;
  activityType: ActivityType;
  description?: string;
  dateInfo: ActivityDateInfo;
  location?: {
    name?: string;
    address?: string;
  };
  price?: ActivityPrice;
  durationMinutes?: number;
  indoorOutdoor: IndoorOutdoor;
  interests: ActivityInterest[];
  weatherSuitability?: WeatherSuitability[];
  notes?: string[];
};

export type ThingsToDoLookupWarningCode =
  | "UNSUPPORTED_CITY"
  | "NO_ACTIVITIES_FOUND"
  | "PARTIAL_DATA"
  | "DATE_RANGE_TOO_LONG"
  | "FILTERS_TOO_RESTRICTIVE"
  | "NO_DATA_FOR_DATE_RANGE"
  | "UNSUPPORTED_CURRENCY";

export type ThingsToDoLookupWarning = {
  code: ThingsToDoLookupWarningCode;
  message: string;
};

export type ThingsToDoLookupOutput = {
  city: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  activities: ActivityOption[];
  warnings?: ThingsToDoLookupWarning[];
  source: {
    provider: "MockThingsToDoProvider";
    generatedAt: string;
    dataWindow: {
      startDate: string;
      endDate: string;
    };
  };
};
