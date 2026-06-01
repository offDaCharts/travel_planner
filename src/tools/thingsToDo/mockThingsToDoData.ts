import type {
  ActivityInterest,
  ActivityOption,
  ActivityType,
  DayOfWeek,
  IndoorOutdoor,
  WeatherSuitability,
} from "./types.js";

export const MOCK_THINGS_TO_DO_START_DATE = "2026-06-01";
export const MOCK_THINGS_TO_DO_END_DATE = "2026-07-31";
export const MOCK_THINGS_TO_DO_GENERATED_AT = "2026-06-01T00:00:00.000Z";
export const MOCK_THINGS_TO_DO_CURRENCY = "USD";

export const MOCK_THINGS_TO_DO_CITIES = [
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

type ActivityTemplate = Omit<ActivityOption, "id" | "location"> & {
  id: string;
  locationName: string;
};

type CityActivityProfile = {
  city: string;
  templates: ActivityTemplate[];
};

const OUTDOOR_SUITABILITY: WeatherSuitability[] = [
  { condition: "clear", suitability: "good" },
  { condition: "rain", suitability: "poor" },
  { condition: "heat", suitability: "okay" },
  { condition: "wind", suitability: "okay" },
];

const INDOOR_SUITABILITY: WeatherSuitability[] = [
  { condition: "any", suitability: "good" },
];

const MIXED_SUITABILITY: WeatherSuitability[] = [
  { condition: "clear", suitability: "good" },
  { condition: "rain", suitability: "okay" },
  { condition: "heat", suitability: "okay" },
];

export function findMockThingsToDoCity(city: string): string | undefined {
  const normalizedCity = normalizeCity(city);
  return MOCK_THINGS_TO_DO_CITIES.find(
    (mockCity) => normalizeCity(mockCity) === normalizedCity,
  );
}

export function getMockActivities(city: string): ActivityOption[] {
  return MOCK_THINGS_TO_DO_ACTIVITIES.filter((activity) =>
    activity.id.startsWith(`${slug(city)}-`),
  );
}

function generateMockActivities(): ActivityOption[] {
  return CITY_PROFILES.flatMap((profile) =>
    profile.templates.map((template) => ({
      ...template,
      id: `${slug(profile.city)}-${template.id}`,
      location: {
        name: template.locationName,
      },
    })),
  );
}

const CITY_PROFILES: CityActivityProfile[] = [
  cityProfile("Seattle", {
    landmark: ["Space Needle", "Seattle Center"],
    museum: ["Museum of Pop Culture", "MoPOP"],
    park: ["Discovery Park Loop", "Discovery Park"],
    food: ["Pike Place Market Food Walk", "Pike Place Market"],
    event: ["Waterfront Summer Music Night", "Pier 62"],
    local: ["Fremont Sunday Market", "Fremont"],
  }),
  cityProfile("Lisbon", {
    landmark: ["Belem Tower Visit", "Belem Tower"],
    museum: ["National Tile Museum", "Museu Nacional do Azulejo"],
    park: ["Miradouro Viewpoint Walk", "Graca"],
    food: ["Pastelaria Tasting Route", "Baixa"],
    event: ["Fado Summer Evening", "Alfama"],
    local: ["LX Factory Market", "LX Factory"],
  }),
  cityProfile("Austin", {
    landmark: ["Texas Capitol Grounds", "Texas State Capitol"],
    museum: ["Blanton Museum of Art", "Blanton Museum"],
    park: ["Lady Bird Lake Trail", "Lady Bird Lake"],
    food: ["East Austin Food Truck Crawl", "East Austin"],
    event: ["Outdoor Blues Showcase", "Zilker Hillside Theater"],
    local: ["South Congress Vintage Walk", "South Congress"],
  }),
  cityProfile("Chicago", {
    landmark: ["Chicago Architecture Riverwalk", "Riverwalk"],
    museum: ["Art Institute Visit", "Art Institute of Chicago"],
    park: ["Millennium Park Afternoon", "Millennium Park"],
    food: ["West Loop Food Hall Tour", "West Loop"],
    event: ["Grant Park Jazz Evening", "Grant Park"],
    local: ["Wicker Park Record Shops", "Wicker Park"],
  }),
  cityProfile("Montreal", {
    landmark: ["Old Montreal Walk", "Old Montreal"],
    museum: ["Montreal Museum of Fine Arts", "MMFA"],
    park: ["Mount Royal Lookout", "Mount Royal"],
    food: ["Jean-Talon Market Tasting", "Jean-Talon Market"],
    event: ["Quartier des Spectacles Music Night", "Quartier des Spectacles"],
    local: ["Plateau Mural Walk", "Le Plateau"],
  }),
  cityProfile("New York", {
    landmark: ["High Line and Chelsea Walk", "The High Line"],
    museum: ["Metropolitan Museum Visit", "The Met"],
    park: ["Central Park Ramble", "Central Park"],
    food: ["Lower East Side Food Walk", "Lower East Side"],
    event: ["Bryant Park Summer Performance", "Bryant Park"],
    local: ["Brooklyn Flea Browse", "Brooklyn Flea"],
  }),
  cityProfile("San Francisco", {
    landmark: ["Golden Gate Bridge Viewpoints", "Golden Gate Bridge"],
    museum: ["SFMOMA Galleries", "SFMOMA"],
    park: ["Golden Gate Park Gardens", "Golden Gate Park"],
    food: ["Mission District Food Walk", "Mission District"],
    event: ["Ferry Building Summer Pop-Up", "Ferry Building"],
    local: ["North Beach Bookstore Walk", "North Beach"],
  }),
  cityProfile("Tokyo", {
    landmark: ["Asakusa Temple Walk", "Senso-ji"],
    museum: ["Mori Art Museum", "Mori Art Museum"],
    park: ["Ueno Park Stroll", "Ueno Park"],
    food: ["Tsukiji Outer Market Snacks", "Tsukiji Outer Market"],
    event: ["Summer Lantern Evening", "Sumida Riverside"],
    local: ["Shimokitazawa Vintage Shops", "Shimokitazawa"],
  }),
  cityProfile("Paris", {
    landmark: ["Eiffel Tower Area Walk", "Champ de Mars"],
    museum: ["Musee d'Orsay Visit", "Musee d'Orsay"],
    park: ["Luxembourg Gardens", "Jardin du Luxembourg"],
    food: ["Marais Pastry Walk", "Le Marais"],
    event: ["Seine Summer Concert", "Seine Riverside"],
    local: ["Canal Saint-Martin Browse", "Canal Saint-Martin"],
  }),
  cityProfile("Barcelona", {
    landmark: ["Sagrada Familia Exterior Walk", "Sagrada Familia"],
    museum: ["Picasso Museum Visit", "Museu Picasso"],
    park: ["Park Guell Paths", "Park Guell"],
    food: ["Boqueria Market Tasting", "La Boqueria"],
    event: ["Gothic Quarter Guitar Night", "Gothic Quarter"],
    local: ["El Born Artisan Shops", "El Born"],
  }),
];

export const MOCK_THINGS_TO_DO_ACTIVITIES = generateMockActivities();

function cityProfile(
  city: string,
  names: Record<"landmark" | "museum" | "park" | "food" | "event" | "local", [string, string]>,
): CityActivityProfile {
  return {
    city,
    templates: [
      generalActivity({
        id: "landmark",
        name: names.landmark[0],
        activityType: "landmark",
        locationName: names.landmark[1],
        interests: ["history", "architecture", "local_culture"],
        indoorOutdoor: "outdoor",
        durationMinutes: 90,
        priceAmount: 0,
        notes: ["Self-guided visit", "Exterior viewing available"],
      }),
      generalActivity({
        id: "museum",
        name: names.museum[0],
        activityType: "museum",
        locationName: names.museum[1],
        interests: ["art", "history", "local_culture"],
        indoorOutdoor: "indoor",
        durationMinutes: 150,
        priceAmount: 24,
        notes: ["Permanent collections", "Indoor galleries"],
      }),
      generalActivity({
        id: "park",
        name: names.park[0],
        activityType: "park",
        locationName: names.park[1],
        interests: ["nature", "wellness", "family"],
        indoorOutdoor: "outdoor",
        durationMinutes: 120,
        priceAmount: 0,
        notes: ["Public outdoor area"],
      }),
      recurringActivity({
        id: "food-market",
        name: names.food[0],
        activityType: "restaurant",
        locationName: names.food[1],
        interests: ["food", "local_culture"],
        indoorOutdoor: "mixed",
        durationMinutes: 120,
        priceAmount: 35,
        daysOfWeek: ["thursday", "friday", "saturday", "sunday"],
        notes: ["Multiple vendors", "Prices vary by vendor"],
      }),
      scheduledActivity({
        id: "summer-event",
        name: names.event[0],
        activityType: "event",
        locationName: names.event[1],
        interests: ["music", "local_culture", "nightlife"],
        indoorOutdoor: "outdoor",
        durationMinutes: 150,
        priceAmount: 18,
        startsAt: scheduledDateForCity(city),
        notes: ["Seasonal summer event", "Evening schedule"],
      }),
      recurringActivity({
        id: "local-experience",
        name: names.local[0],
        activityType: "local_experience",
        locationName: names.local[1],
        interests: ["shopping", "local_culture", "art"],
        indoorOutdoor: "mixed",
        durationMinutes: 90,
        priceAmount: undefined,
        daysOfWeek: ["saturday", "sunday"],
        notes: undefined,
      }),
    ],
  };
}

function generalActivity({
  id,
  name,
  activityType,
  locationName,
  interests,
  indoorOutdoor,
  durationMinutes,
  priceAmount,
  notes,
}: {
  id: string;
  name: string;
  activityType: ActivityType;
  locationName: string;
  interests: ActivityInterest[];
  indoorOutdoor: IndoorOutdoor;
  durationMinutes: number;
  priceAmount: number;
  notes?: string[];
}): ActivityTemplate {
  return {
    id,
    name,
    activityType,
    description: `${name} is a city activity included in the mock things-to-do data set.`,
    dateInfo: {
      kind: "general",
      hours: [{ opensAt: "10:00", closesAt: "18:00" }],
    },
    locationName,
    price: priceAmount === 0
      ? { amount: 0, currency: MOCK_THINGS_TO_DO_CURRENCY, pricingType: "free" }
      : { amount: priceAmount, currency: MOCK_THINGS_TO_DO_CURRENCY, pricingType: "paid" },
    durationMinutes,
    indoorOutdoor,
    interests,
    weatherSuitability: suitabilityFor(indoorOutdoor),
    notes,
  };
}

function recurringActivity({
  id,
  name,
  activityType,
  locationName,
  interests,
  indoorOutdoor,
  durationMinutes,
  priceAmount,
  daysOfWeek,
  notes,
}: {
  id: string;
  name: string;
  activityType: ActivityType;
  locationName: string;
  interests: ActivityInterest[];
  indoorOutdoor: IndoorOutdoor;
  durationMinutes: number;
  priceAmount?: number;
  daysOfWeek: DayOfWeek[];
  notes?: string[];
}): ActivityTemplate {
  return {
    id,
    name,
    activityType,
    description: `${name} is a recurring city activity included in the mock things-to-do data set.`,
    dateInfo: {
      kind: "recurring",
      daysOfWeek,
      hours: [{ opensAt: "11:00", closesAt: "20:00" }],
    },
    locationName,
    price: priceAmount === undefined
      ? { pricingType: "variable", currency: MOCK_THINGS_TO_DO_CURRENCY }
      : { amount: priceAmount, currency: MOCK_THINGS_TO_DO_CURRENCY, pricingType: "paid" },
    durationMinutes,
    indoorOutdoor,
    interests,
    weatherSuitability: suitabilityFor(indoorOutdoor),
    notes,
  };
}

function scheduledActivity({
  id,
  name,
  activityType,
  locationName,
  interests,
  indoorOutdoor,
  durationMinutes,
  priceAmount,
  startsAt,
  notes,
}: {
  id: string;
  name: string;
  activityType: ActivityType;
  locationName: string;
  interests: ActivityInterest[];
  indoorOutdoor: IndoorOutdoor;
  durationMinutes: number;
  priceAmount: number;
  startsAt: string;
  notes?: string[];
}): ActivityTemplate {
  const endDate = new Date(startsAt);
  endDate.setUTCMinutes(endDate.getUTCMinutes() + durationMinutes);

  return {
    id,
    name,
    activityType,
    description: `${name} is a scheduled mock event for the requested city.`,
    dateInfo: {
      kind: "scheduled",
      startsAt,
      endsAt: endDate.toISOString(),
    },
    locationName,
    price: { amount: priceAmount, currency: MOCK_THINGS_TO_DO_CURRENCY, pricingType: "paid" },
    durationMinutes,
    indoorOutdoor,
    interests,
    weatherSuitability: suitabilityFor(indoorOutdoor),
    notes,
  };
}

function scheduledDateForCity(city: string): string {
  const day = 8 + deterministicNumber(city, "summer-event", 0, 45);
  const date = new Date("2026-06-01T19:00:00.000Z");
  date.setUTCDate(day);
  return date.toISOString();
}

function suitabilityFor(indoorOutdoor: IndoorOutdoor): WeatherSuitability[] {
  if (indoorOutdoor === "indoor") {
    return INDOOR_SUITABILITY;
  }

  if (indoorOutdoor === "outdoor") {
    return OUTDOOR_SUITABILITY;
  }

  return MIXED_SUITABILITY;
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
