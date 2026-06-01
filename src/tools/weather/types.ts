export type WeatherTimeOfDay =
  | "full_day"
  | "morning"
  | "afternoon"
  | "evening"
  | "night";

export type WeatherDataBasis =
  | "forecast"
  | "historical_average"
  | "seasonal_average";

export type CloudinessLevel =
  | "clear"
  | "mostly_clear"
  | "partly_cloudy"
  | "mostly_cloudy"
  | "overcast";

export type PrecipitationType =
  | "rain"
  | "snow"
  | "sleet"
  | "mixed"
  | "none";

export type WeatherUnits = {
  temperature: "fahrenheit" | "celsius";
  windSpeed: "mph" | "kph";
  precipitation: "inches" | "millimeters";
  visibility: "miles" | "kilometers";
};

export type WeatherLookupInput = {
  city: string;
  dateRange: {
    startDate: string;
    endDate?: string;
  };
  timeOfDay?: WeatherTimeOfDay[];
  units?: Partial<WeatherUnits>;
};

export type PrecipitationForecast = {
  probabilityPercent?: number;
  expectedAmount?: number;
  type?: PrecipitationType;
};

export type WindForecast = {
  speed?: number;
  gustSpeed?: number;
  directionDegrees?: number;
  directionLabel?: string;
};

export type WeatherAlert = {
  severity: "info" | "watch" | "warning";
  event: string;
  headline?: string;
  startsAt?: string;
  endsAt?: string;
};

export type WeatherForecastPeriod = {
  city: string;
  date: string;
  timeOfDay: WeatherTimeOfDay;
  dataBasis: WeatherDataBasis;
  temperatureHigh?: number;
  temperatureLow?: number;
  temperatureAverage?: number;
  apparentTemperatureHigh?: number;
  apparentTemperatureLow?: number;
  apparentTemperatureAverage?: number;
  cloudiness?: CloudinessLevel;
  precipitation?: PrecipitationForecast;
  humidityPercent?: number;
  wind?: WindForecast;
  uvIndex?: number;
  airQualityIndex?: number;
  visibility?: number;
  sunrise?: string;
  sunset?: string;
  summary?: string;
  alerts?: WeatherAlert[];
};

export type WeatherLookupWarningCode =
  | "INTRADAY_UNAVAILABLE_FOR_DATE_RANGE"
  | "PARTIAL_DATA"
  | "DATE_RANGE_TOO_LONG"
  | "UNSUPPORTED_CITY"
  | "NO_DATA_FOR_DATE_RANGE";

export type WeatherLookupWarning = {
  code: WeatherLookupWarningCode;
  message: string;
};

export type WeatherLookupOutput = {
  city: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  units: WeatherUnits;
  forecasts: WeatherForecastPeriod[];
  warnings?: WeatherLookupWarning[];
  source: {
    provider: "MockWeatherProvider";
    generatedAt: string;
    dataWindow: {
      startDate: string;
      endDate: string;
    };
  };
};
