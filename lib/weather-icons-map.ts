import {
  WiDaySunny,
  WiNightClear,
  WiDayCloudy,
  WiNightAltCloudy,
  WiCloud,
  WiCloudy,
  WiDayShowers,
  WiNightAltShowers,
  WiDayRain,
  WiNightAltRain,
  WiDayThunderstorm,
  WiNightAltThunderstorm,
  WiDaySnow,
  WiNightAltSnow,
  WiDayFog,
  WiNightFog,
} from 'weather-icons-react';

// Map OpenWeatherMap icon codes to Weather Icons components
export const weatherIconsMap: { [key: string]: any } = {
  '01d': WiDaySunny,
  '01n': WiNightClear,
  '02d': WiDayCloudy,
  '02n': WiNightAltCloudy,
  '03d': WiCloud,
  '03n': WiCloud,
  '04d': WiCloudy,
  '04n': WiCloudy,
  '09d': WiDayShowers,
  '09n': WiNightAltShowers,
  '10d': WiDayRain,
  '10n': WiNightAltRain,
  '11d': WiDayThunderstorm,
  '11n': WiNightAltThunderstorm,
  '13d': WiDaySnow,
  '13n': WiNightAltSnow,
  '50d': WiDayFog,
  '50n': WiNightFog,
};

// Map OpenWeatherMap icon codes to icon colors
export const weatherIconColors: { [key: string]: string } = {
  '01d': '#FFB300', // sunny - yellow/orange
  '01n': '#5C6BC0', // clear night - indigo
  '02d': '#90CAF9', // partly cloudy day - light blue
  '02n': '#5C6BC0', // partly cloudy night - indigo
  '03d': '#90A4AE', // cloudy - blue grey
  '03n': '#78909C', // cloudy night - darker blue grey
  '04d': '#78909C', // overcast - blue grey
  '04n': '#546E7A', // overcast night - darker blue grey
  '09d': '#4FC3F7', // shower - light blue
  '09n': '#039BE5', // shower night - darker blue
  '10d': '#4FC3F7', // rain - light blue
  '10n': '#039BE5', // rain night - darker blue
  '11d': '#7E57C2', // thunderstorm - purple
  '11n': '#5E35B1', // thunderstorm night - darker purple
  '13d': '#E1F5FE', // snow - very light blue
  '13n': '#B3E5FC', // snow night - slightly darker light blue
  '50d': '#B0BEC5', // mist - blue grey
  '50n': '#90A4AE', // mist night - darker blue grey
};
