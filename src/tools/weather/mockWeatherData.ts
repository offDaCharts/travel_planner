import type {
  CloudinessLevel,
  PrecipitationType,
  WeatherDataBasis,
  WeatherForecastPeriod,
  WeatherTimeOfDay,
} from "./types.js";

export const MOCK_WEATHER_START_DATE = "2026-06-01";
export const MOCK_WEATHER_END_DATE = "2026-07-31";
export const MOCK_INTRADAY_END_DATE = "2026-06-08";
export const MOCK_WEATHER_GENERATED_AT = "2026-06-01T00:00:00.000Z";

type CityWeatherProfile = {
  city: string;
  juneHigh: number;
  julyHigh: number;
  dailySwing: number;
  precipitationChance: number;
  precipitationAmount: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  cloudiness: CloudinessLevel[];
  precipitationType: PrecipitationType;
};

export const MOCK_WEATHER_CITIES = [
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

const CITY_PROFILES: CityWeatherProfile[] = [
  {
    city: "Seattle",
    juneHigh: 69,
    julyHigh: 76,
    dailySwing: 13,
    precipitationChance: 24,
    precipitationAmount: 0.06,
    humidity: 66,
    windSpeed: 7,
    uvIndex: 6,
    cloudiness: ["mostly_cloudy", "partly_cloudy", "mostly_clear"],
    precipitationType: "rain",
  },
  {
    city: "Lisbon",
    juneHigh: 78,
    julyHigh: 84,
    dailySwing: 15,
    precipitationChance: 7,
    precipitationAmount: 0.01,
    humidity: 57,
    windSpeed: 11,
    uvIndex: 8,
    cloudiness: ["clear", "mostly_clear", "partly_cloudy"],
    precipitationType: "rain",
  },
  {
    city: "Austin",
    juneHigh: 94,
    julyHigh: 98,
    dailySwing: 20,
    precipitationChance: 18,
    precipitationAmount: 0.08,
    humidity: 62,
    windSpeed: 9,
    uvIndex: 10,
    cloudiness: ["mostly_clear", "partly_cloudy", "clear"],
    precipitationType: "rain",
  },
  {
    city: "Chicago",
    juneHigh: 79,
    julyHigh: 84,
    dailySwing: 17,
    precipitationChance: 28,
    precipitationAmount: 0.11,
    humidity: 65,
    windSpeed: 12,
    uvIndex: 8,
    cloudiness: ["partly_cloudy", "mostly_cloudy", "mostly_clear"],
    precipitationType: "rain",
  },
  {
    city: "Montreal",
    juneHigh: 75,
    julyHigh: 80,
    dailySwing: 16,
    precipitationChance: 30,
    precipitationAmount: 0.12,
    humidity: 67,
    windSpeed: 8,
    uvIndex: 7,
    cloudiness: ["partly_cloudy", "mostly_cloudy", "mostly_clear"],
    precipitationType: "rain",
  },
  {
    city: "New York",
    juneHigh: 80,
    julyHigh: 86,
    dailySwing: 16,
    precipitationChance: 25,
    precipitationAmount: 0.1,
    humidity: 68,
    windSpeed: 10,
    uvIndex: 8,
    cloudiness: ["partly_cloudy", "mostly_clear", "mostly_cloudy"],
    precipitationType: "rain",
  },
  {
    city: "San Francisco",
    juneHigh: 67,
    julyHigh: 68,
    dailySwing: 11,
    precipitationChance: 6,
    precipitationAmount: 0.01,
    humidity: 72,
    windSpeed: 13,
    uvIndex: 7,
    cloudiness: ["mostly_cloudy", "partly_cloudy", "mostly_clear"],
    precipitationType: "rain",
  },
  {
    city: "Tokyo",
    juneHigh: 78,
    julyHigh: 86,
    dailySwing: 13,
    precipitationChance: 42,
    precipitationAmount: 0.18,
    humidity: 76,
    windSpeed: 8,
    uvIndex: 8,
    cloudiness: ["mostly_cloudy", "overcast", "partly_cloudy"],
    precipitationType: "rain",
  },
  {
    city: "Paris",
    juneHigh: 74,
    julyHigh: 79,
    dailySwing: 14,
    precipitationChance: 22,
    precipitationAmount: 0.06,
    humidity: 62,
    windSpeed: 9,
    uvIndex: 7,
    cloudiness: ["partly_cloudy", "mostly_clear", "mostly_cloudy"],
    precipitationType: "rain",
  },
  {
    city: "Barcelona",
    juneHigh: 79,
    julyHigh: 84,
    dailySwing: 13,
    precipitationChance: 10,
    precipitationAmount: 0.02,
    humidity: 64,
    windSpeed: 10,
    uvIndex: 9,
    cloudiness: ["clear", "mostly_clear", "partly_cloudy"],
    precipitationType: "rain",
  },
];

export const MOCK_WEATHER_DATA = generateMockWeatherData();

export function findMockCity(city: string): string | undefined {
  const normalizedCity = normalizeCity(city);
  return MOCK_WEATHER_CITIES.find(
    (mockCity) => normalizeCity(mockCity) === normalizedCity,
  );
}

function generateMockWeatherData(): WeatherForecastPeriod[] {
  const dates = listDates(MOCK_WEATHER_START_DATE, MOCK_WEATHER_END_DATE);

  return CITY_PROFILES.flatMap((profile) =>
    dates.flatMap((date, index) => {
      const dailyForecast = buildForecastPeriod(profile, date, index, "full_day");

      if (date > MOCK_INTRADAY_END_DATE) {
        return [dailyForecast];
      }

      return [
        dailyForecast,
        buildForecastPeriod(profile, date, index, "morning"),
        buildForecastPeriod(profile, date, index, "afternoon"),
        buildForecastPeriod(profile, date, index, "evening"),
        buildForecastPeriod(profile, date, index, "night"),
      ];
    }),
  );
}

function buildForecastPeriod(
  profile: CityWeatherProfile,
  date: string,
  dateIndex: number,
  timeOfDay: WeatherTimeOfDay,
): WeatherForecastPeriod {
  const isJuly = date.slice(5, 7) === "07";
  const baseHigh = isJuly ? profile.julyHigh : profile.juneHigh;
  const weatherWave = Math.round(Math.sin(dateIndex * 0.7) * 3);
  const temperatureHigh = baseHigh + weatherWave;
  const temperatureLow = temperatureHigh - profile.dailySwing;
  const precipitationBump = deterministicNumber(profile.city, date, 0, 12);
  const precipitationProbability = Math.min(
    95,
    Math.max(0, profile.precipitationChance + precipitationBump - 6),
  );
  const cloudiness =
    profile.cloudiness[deterministicNumber(profile.city, date, 0, profile.cloudiness.length - 1)];
  const dataBasis: WeatherDataBasis =
    date <= MOCK_INTRADAY_END_DATE ? "forecast" : "historical_average";

  if (timeOfDay === "full_day") {
    return {
      city: profile.city,
      date,
      timeOfDay,
      dataBasis,
      temperatureHigh,
      temperatureLow,
      temperatureAverage: Math.round((temperatureHigh + temperatureLow) / 2),
      apparentTemperatureHigh: temperatureHigh + apparentTemperatureDelta(profile),
      apparentTemperatureLow: temperatureLow + apparentTemperatureDelta(profile),
      cloudiness,
      precipitation: {
        probabilityPercent: precipitationProbability,
        expectedAmount:
          precipitationProbability > 20 ? round(profile.precipitationAmount, 2) : 0,
        type: precipitationProbability > 20 ? profile.precipitationType : "none",
      },
      humidityPercent: profile.humidity + deterministicNumber(profile.city, date, -4, 4),
      wind: {
        speed: profile.windSpeed + deterministicNumber(date, profile.city, -2, 3),
        gustSpeed: profile.windSpeed + deterministicNumber(date, profile.city, 4, 9),
        directionDegrees: deterministicNumber(profile.city, date, 0, 359),
        directionLabel: directionLabel(deterministicNumber(profile.city, date, 0, 359)),
      },
      uvIndex: Math.max(1, profile.uvIndex + deterministicNumber(date, profile.city, -1, 1)),
      visibility: deterministicNumber(profile.city, date, 6, 10),
      sunrise: isJuly ? "05:45" : "05:30",
      sunset: isJuly ? "20:45" : "20:55",
      summary: `${sentenceCase(cloudiness.replace("_", " "))}, high ${temperatureHigh}, low ${temperatureLow}.`,
    };
  }

  const intradayOffset = {
    morning: -8,
    afternoon: 0,
    evening: -5,
    night: -12,
  }[timeOfDay];
  const average = temperatureHigh + intradayOffset;

  return {
    city: profile.city,
    date,
    timeOfDay,
    dataBasis,
    temperatureAverage: average,
    apparentTemperatureAverage: average + apparentTemperatureDelta(profile),
    cloudiness,
    precipitation: {
      probabilityPercent: Math.max(0, precipitationProbability - 5),
      expectedAmount:
        precipitationProbability > 25 ? round(profile.precipitationAmount / 2, 2) : 0,
      type: precipitationProbability > 25 ? profile.precipitationType : "none",
    },
    humidityPercent: profile.humidity + deterministicNumber(profile.city, date, -5, 5),
    wind: {
      speed: profile.windSpeed + deterministicNumber(date, profile.city, -2, 2),
      directionDegrees: deterministicNumber(profile.city, date, 0, 359),
      directionLabel: directionLabel(deterministicNumber(profile.city, date, 0, 359)),
    },
    summary: `${sentenceCase(timeOfDay)} ${cloudiness.replace("_", " ")}, average ${average}.`,
  };
}

function listDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function deterministicNumber(seedA: string, seedB: string, min: number, max: number): number {
  const seed = `${seedA}:${seedB}`;
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return min + (hash % (max - min + 1));
}

function apparentTemperatureDelta(profile: CityWeatherProfile): number {
  if (profile.humidity >= 70 && profile.julyHigh >= 84) {
    return 4;
  }

  if (profile.windSpeed >= 12 && profile.juneHigh <= 70) {
    return -2;
  }

  return 1;
}

function directionLabel(directionDegrees: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(directionDegrees / 45) % directions.length];
}

function normalizeCity(city: string): string {
  return city.trim().toLowerCase();
}

function round(value: number, decimals: number): number {
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

function sentenceCase(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
