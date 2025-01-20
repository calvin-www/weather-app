export interface WeatherData {
  location: string;
  latitude: number;
  longitude: number;
  current: {
    temp: number;
    temp_min: number;
    temp_max: number;
    description: string;
    icon: string;
  };
  forecast: Array<{
    dt: number;
    date: string;
    temp_min: number;
    temp_max: number;
    description: string;
    icon: string;
  }>;
}

export interface WeatherRecord {
  id: number;
  location: string;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  temperature_min: number;
  temperature_max: number;
  description: string;
  weatherData?: string;
  createdAt: string;
  updatedAt: string;
}
