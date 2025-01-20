import { NextResponse } from 'next/server';
import axios from 'axios';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

interface WeatherResponse {
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
  coord: {
    lat: number;
    lon: number;
  };
}

interface ForecastResponse {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      temp_min: number;
      temp_max: number;
    };
    weather: Array<{
      description: string;
      icon: string;
    }>;
  }>;
}

async function getLocationName(latitude: number, longitude: number) {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.results.length > 0) {
      return response.data.results[0].formatted_address;
    }
    return `${latitude}, ${longitude}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${latitude}, ${longitude}`;
  }
}

async function getCoordinates(location: string) {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        location
      )}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry.location;
      return { latitude: lat, longitude: lng };
    }
    throw new Error('Location not found');
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to geocode location');
  }
}

async function fetchFullForecast(lat: number, lon: number) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  
  const response = await axios.get(url);
  if (response.status !== 200) {
    throw new Error('Failed to fetch full forecast');
  }
  
  return response.data;
}

interface DailyForecast {
  dt: number;
  temp_min: number;
  temp_max: number;
  description: string;
  icon: string;
  forecasts: Array<{
    dt: number;
    main: {
      temp: number;
      temp_min: number;
      temp_max: number;
    };
    weather: Array<{
      description: string;
      icon: string;
    }>;
  }>;
}

function getAllDailyForecasts(list: ForecastResponse['list']): DailyForecast[] {
  const dailyForecasts = new Map<string, DailyForecast>();
  
  list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format

    if (!dailyForecasts.has(dateStr)) {
      dailyForecasts.set(dateStr, {
        dt: item.dt,
        temp_min: item.main.temp,
        temp_max: item.main.temp,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        forecasts: [item]
      });
    } else {
      const forecast = dailyForecasts.get(dateStr)!;
      forecast.forecasts.push(item);
      
      forecast.temp_min = Math.min(forecast.temp_min, item.main.temp);
      forecast.temp_max = Math.max(forecast.temp_max, item.main.temp);
      
      const conditions = forecast.forecasts.reduce((acc, curr) => {
        const desc = curr.weather[0].description;
        acc[desc] = (acc[desc] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostCommonCondition = Object.entries(conditions)
        .sort((a, b) => b[1] - a[1])[0][0];
      
      forecast.description = mostCommonCondition;
      
      const noonForecast = forecast.forecasts.find(f => {
        const hour = new Date(f.dt * 1000).getHours();
        return hour >= 11 && hour <= 13;
      });
      if (noonForecast) {
        forecast.icon = noonForecast.weather[0].icon;
      }
    }
  });

  // Sort and return all unique dates
  return Array.from(dailyForecasts.values())
    .sort((a, b) => a.dt - b.dt)
    .filter((forecast, index, self) => 
      index === self.findIndex(f => 
        new Date(f.dt * 1000).toLocaleDateString() === new Date(forecast.dt * 1000).toLocaleDateString()
      )
    );
}

async function fetchHistoricalWeather(
  latitude: number, 
  longitude: number, 
  startDate: Date, 
  endDate: Date
): Promise<ForecastResponse> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  
  // Convert dates to Unix timestamps
  const startTimestamp = Math.floor(startDate.getTime() / 1000);
  const endTimestamp = Math.floor(endDate.getTime() / 1000);

  const url = `https://history.openweathermap.org/data/2.5/history/city?lat=${latitude}&lon=${longitude}&type=hour&start=${startTimestamp}&end=${endTimestamp}&units=metric&appid=${apiKey}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch historical weather data');
  }

  return await response.json();
}

function processHistoricalData(historicalData: any): { 
  current: {
    temp: number;
    temp_min: number;
    temp_max: number;
    description: string;
    icon: string;
  }, 
  forecast: DailyForecast[] 
} {
  const dailyForecasts = new Map<string, DailyForecast>();

  historicalData.list.forEach((item: any) => {
    const date = new Date(item.dt * 1000);
    const dateStr = date.toISOString().split('T')[0];

    if (!dailyForecasts.has(dateStr)) {
      dailyForecasts.set(dateStr, {
        dt: item.dt,
        temp_min: item.main.temp,
        temp_max: item.main.temp,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        forecasts: [item]
      });
    } else {
      const forecast = dailyForecasts.get(dateStr)!;
      forecast.forecasts.push(item);
      
      forecast.temp_min = Math.min(forecast.temp_min, item.main.temp);
      forecast.temp_max = Math.max(forecast.temp_max, item.main.temp);
      
      const conditions = forecast.forecasts.reduce((acc, curr) => {
        const desc = curr.weather[0].description;
        acc[desc] = (acc[desc] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostCommonCondition = Object.entries(conditions)
        .sort((a, b) => b[1] - a[1])[0][0];
      
      forecast.description = mostCommonCondition;
    }
  });

  // Use the first item as current weather
  const currentWeather = historicalData.list[0];

  return {
    current: {
      temp: currentWeather.main.temp,
      temp_min: currentWeather.main.temp_min,
      temp_max: currentWeather.main.temp_max,
      description: currentWeather.weather[0].description,
      icon: currentWeather.weather[0].icon
    },
    forecast: Array.from(dailyForecasts.values())
      .sort((a, b) => a.dt - b.dt)
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const mode = searchParams.get('mode') || 'current'; // Default to current

    if (!location) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      );
    }

    // Check if location is coordinates
    const coordinateMatch = location.match(/^([-+]?\d+\.?\d*),\s*([-+]?\d+\.?\d*)$/);
    let lat: number, lon: number, geocodedLocation: string;

    if (coordinateMatch) {
      // Direct coordinates provided
      lat = parseFloat(coordinateMatch[1]);
      lon = parseFloat(coordinateMatch[2]);
      
      // Reverse geocode to get a human-readable location name
      const reverseGeocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${process.env.GOOGLE_MAPS_API_KEY}`
      );
      const reverseGeocodeData = await reverseGeocodeResponse.json();
      
      // Use the first formatted address or a generic location if not found
      geocodedLocation = reverseGeocodeData.results[0]?.formatted_address || `${lat}, ${lon}`;
    } else {
      // Geocode the location name
      const geocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
      );
      const geocodeData = await geocodeResponse.json();

      if (!geocodeData.results || geocodeData.results.length === 0) {
        return NextResponse.json(
          { error: 'Location not found' },
          { status: 404 }
        );
      }

      const locationData = geocodeData.results[0].geometry.location;
      lat = locationData.lat;
      lon = locationData.lng;
      geocodedLocation = geocodeData.results[0].formatted_address;
    }

    // Determine which API to call based on mode and date range
    let weatherData;
    if (mode === 'current') {
      // 5-day forecast (default)
      const fullForecastData = await fetchFullForecast(lat, lon);
      const dailyForecasts = getAllDailyForecasts(fullForecastData.list);
      const currentWeather = fullForecastData.list[0];

      weatherData = {
        location: geocodedLocation,
        latitude: lat,
        longitude: lon,
        current: {
          temp: currentWeather.main.temp,
          temp_min: currentWeather.main.temp_min,
          temp_max: currentWeather.main.temp_max,
          description: currentWeather.weather[0].description,
          icon: currentWeather.weather[0].icon
        },
        forecast: dailyForecasts.slice(0, 5).map(item => ({
          dt: item.dt,
          date: new Date(item.dt * 1000).toLocaleDateString(),
          temp_min: item.temp_min,
          temp_max: item.temp_max,
          description: item.description,
          icon: item.icon
        }))
      };
    } else if (mode === 'range' && startDateStr && endDateStr) {
      // Historical data
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      
      const historicalData = await fetchHistoricalWeather(lat, lon, startDate, endDate);
      const processedData = processHistoricalData(historicalData);

      weatherData = {
        location: geocodedLocation,
        latitude: lat,
        longitude: lon,
        current: processedData.current,
        forecast: processedData.forecast.map(item => ({
          dt: item.dt,
          date: new Date(item.dt * 1000).toLocaleDateString(),
          temp_min: item.temp_min,
          temp_max: item.temp_max,
          description: item.description,
          icon: item.icon
        }))
      };
    } else {
      return NextResponse.json(
        { error: 'Invalid mode or missing date range for range data' },
        { status: 400 }
      );
    }

    return NextResponse.json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}
