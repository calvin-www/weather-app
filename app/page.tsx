'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
import { Divider } from '@heroui/divider';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@heroui/table';
import { DateRangePicker, RangeValue, DateValue } from '@heroui/react';
import { useTemperature } from '@/contexts/temperature-unit';
import { useGeolocation } from '@/components/use-geolocation';
import { format, addDays } from 'date-fns';
import { parseDate, CalendarDate } from "@internationalized/date";
import GoogleMapComponent from '@/components/GoogleMap';

interface WeatherData {
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
  temp?: number;
  temp_min?: number;
  temp_max?: number;
  description?: string;
  icon?: string;
  forecast: Array<{
    dt: number;
    date: string;
    temp_min: number;
    temp_max: number;
    description: string;
    icon: string;
  }>;
  dt?: number;
  date?: string;
}

interface WeatherRecord {
  id: number;
  location: string;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  tempMin: number;
  tempMax: number;
  description: string;
  createdAt: string;
  weatherData: string; 
}

const getWeatherIcon = (iconCode: string) => {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};

const getDayName = (dateStr: string) => {
  const date = new Date(dateStr);
  return format(date, 'EEEE');
};

export default function Home() {
  const [location, setLocation] = useState('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [records, setRecords] = useState<WeatherRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<WeatherRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState<RangeValue<DateValue>>({
    start: parseDate(new Date().toISOString().split('T')[0]),
    end: parseDate(addDays(new Date(), 4).toISOString().split('T')[0])
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { unit, convertTemp } = useTemperature();
  const geolocation = useGeolocation();

  // Initial weather fetch when component mounts or geolocation changes
  useEffect(() => {
    if (geolocation.location) {
      // Explicitly convert to coordinate string
      const locationString = `${geolocation.location.latitude},${geolocation.location.longitude}`;
      fetchWeather(locationString);
    }
  }, [geolocation.location]);

  const convertToCalendarDate = (date: Date): CalendarDate => {
    return parseDate(date.toISOString().split('T')[0]);
  };

  const convertFromCalendarDate = (calendarDate: DateValue): Date => {
    return new Date(calendarDate.toString());
  };

  const fetchWeather = async (
    searchLocation?: string, 
    start?: Date, 
    end?: Date
  ) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      
      // Use the provided search location or default to geolocation
      params.append('location', searchLocation || 
        (geolocation.location 
          ? `${geolocation.location.latitude},${geolocation.location.longitude}` 
          : '')
      );
      
      // Determine mode based on date range
      if (start && end) {
        // If dates are more than 5 days apart or in the past, use range mode
        const daysDifference = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const isRange = daysDifference > 5 || end < new Date();

        params.append('mode', isRange ? 'range' : 'current');
        params.append('startDate', start.toISOString().split('T')[0]);
        params.append('endDate', end.toISOString().split('T')[0]);
      } else {
        // Default to current mode
        params.append('mode', 'current');
      }

      const response = await fetch(`/api/weather?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch weather data');
      }

      setWeatherData(data);
      setLocation(data.location);
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/records');
      const data = await response.json();
      setRecords(data);
    } catch (err) {
      console.error('Failed to fetch records:', err);
    }
  };

  const handleSaveOrUpdateRecord = async () => {
    if (!weatherData || !location) {
      console.error('No weather data to save');
      return;
    }

    try {
      let response;
      
      // Determine if we're saving a new record or updating an existing one
      if (!selectedRecord) {
        // Save new record
        response = await fetch('/api/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: location,
            latitude: weatherData.latitude,
            longitude: weatherData.longitude,
            startDate: dateRange.start ? new Date(dateRange.start.toString()) : new Date(),
            endDate: dateRange.end ? new Date(dateRange.end.toString()) : new Date(),
            weatherData: weatherData
          })
        });
      } else {
        // Update existing record
        response = await fetch(`/api/records?id=${selectedRecord.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startDate: format(convertFromCalendarDate(dateRange.start), 'yyyy-MM-dd'),
            endDate: format(convertFromCalendarDate(dateRange.end), 'yyyy-MM-dd'),
            description: weatherData.current.description || '',
            weatherData: weatherData
          }),
        });
      }

      const responseData = await response.json();
      
      if (!response.ok || !responseData.success) {
        throw new Error(responseData.error || 'Failed to save/update record');
      }

      console.log(selectedRecord ? 'Record updated' : 'Record saved', 'successfully:', responseData.record);
      await fetchRecords();
      
      // Reset selected record after update
      if (selectedRecord) {
        setSelectedRecord(null);
      }
      
      setError('');
    } catch (err) {
      console.error('Failed to save/update record:', err);
      setError(err instanceof Error ? err.message : 'Failed to save/update record');
    }
  };

  const handleDeleteRecord = async (id: number) => {
    try {
      await fetch(`/api/records?id=${id}`, { method: 'DELETE' });
      await fetchRecords();
    } catch (err) {
      console.error('Failed to delete record:', err);
    }
  };

  const handleEditRecord = (record: WeatherRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleViewRecord = (record: WeatherRecord) => {
    try {
      // Parse the weatherData JSON string
      const parsedWeatherData: WeatherData = JSON.parse(record.weatherData || '{}');
      
      // Ensure the parsed data matches the WeatherData interface
      const formattedWeatherData: WeatherData = {
        location: record.location,
        latitude: record.latitude,
        longitude: record.longitude,
        current: {
          temp: parsedWeatherData.current?.temp || 0,
          temp_min: parsedWeatherData.current?.temp_min || 0,
          temp_max: parsedWeatherData.current?.temp_max || 0,
          description: parsedWeatherData.current?.description || '',
          icon: parsedWeatherData.current?.icon || ''
        },
        description: parsedWeatherData.description || record.description || '',
        forecast: parsedWeatherData.forecast || []
      };
      
      // Set the parsed weather data 
      setWeatherData(formattedWeatherData);
      
      // Set location from the record
      setLocation(record.location);
      
      // Set date range from the record
      setDateRange({
        start: convertToCalendarDate(new Date(record.startDate)),
        end: convertToCalendarDate(new Date(record.endDate))
      });
      
      // Set the selected record
      setSelectedRecord({
        ...record,
        description: formattedWeatherData.description || ''
      });
      
      // Open the modal
      setIsModalOpen(true);
      
      // Clear any previous errors
      setError('');
      
      console.log('Viewed record:', {
        record,
        parsedWeatherData: formattedWeatherData
      });
    } catch (err) {
      console.error('Failed to view record:', err);
      setError('Failed to load record details');
    }
  };

  const handleSearch = () => {
    const start = dateRange.start ? convertFromCalendarDate(dateRange.start) : undefined;
    const end = dateRange.end ? convertFromCalendarDate(dateRange.end) : undefined;
    
    fetchWeather(location, start, end);
  };

  const handleDateRangeChange = (value: RangeValue<DateValue>) => {
    setDateRange(value);
    
    if (value.start && value.end) {
      fetchWeather(
        location, 
        convertFromCalendarDate(value.start), 
        convertFromCalendarDate(value.end)
      );
    }
  };

  const handleFiveDayForecast = () => {
    const today = new Date();
    const fiveDaysLater = addDays(today, 4);
    
    setDateRange({
      start: convertToCalendarDate(today),
      end: convertToCalendarDate(fiveDaysLater)
    });
    
    fetchWeather(location, today, fiveDaysLater);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    if (geolocation.location && !weatherData && !location) {
      fetchWeather();
    }
  }, [geolocation.location]);

  const currentWeatherTitle = useMemo(() => {
    if (!weatherData) return '';
    
    const earliestDate = dateRange.start 
      ? new Date(dateRange.start.toString()) 
      : new Date();
    
    return `Weather in ${weatherData.location} on ${format(earliestDate, 'EEEE, MMMM d, yyyy')}`;
  }, [weatherData, dateRange]);

  const forecastSectionTitle = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return 'Range';
    
    const startDate = new Date(dateRange.start.toString());
    const endDate = new Date(dateRange.end.toString());
    
    return `${format(startDate, 'MMMM d, yyyy')} - ${format(endDate, 'MMMM d, yyyy')}`;
  }, [dateRange]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">{currentWeatherTitle}</h1>
      
      {/* Search and Date Range Section */}
      <div className="space-y-4 mb-8">
        <div className="flex gap-4">
          <Input
            type="text"
            placeholder="Enter location (city, zip code, landmark...)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="flex-grow"
          />
          <Button
            color="primary"
            onClick={handleSearch}
            isLoading={loading}
          >
            Get Weather
          </Button>
        </div>

        <div className="flex items-center gap-4 w-full">
          <DateRangePicker
            value={dateRange}
            // onChange={handleDateRangeChange}
            // minDate={convertToCalendarDate(new Date())}
            // maxDate={convertToCalendarDate(addDays(new Date(), 30))}
            className="flex-grow"
          />
          <Button
            color="secondary"
            onClick={handleFiveDayForecast}
          >
            5-Day Forecast
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      {weatherData && (
        <div className="space-y-6 mb-8">
          {/* Current Weather Card */}
          <Card>
            <CardBody>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-semibold">{currentWeatherTitle}</h2>
                  <p className="text-gray-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Weather Details Column */}
                <div>
                  <div className="flex items-center gap-4 mt-4">
                    <img 
                      src={getWeatherIcon(weatherData.current.icon)} 
                      alt={weatherData.current.description} 
                      className="w-24 h-24"
                    />
                    <div>
                      <p className="text-4xl font-bold">{weatherData.current.temp.toFixed(1)}°C</p>
                      <p className="text-lg capitalize">{weatherData.current.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600">Min Temp</p>
                      <p className="text-blue-600 font-semibold">{weatherData.current.temp_min.toFixed(1)}°C</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Max Temp</p>
                      <p className="text-red-600 font-semibold">{weatherData.current.temp_max.toFixed(1)}°C</p>
                    </div>
                  </div>
                </div>

                {/* Google Maps Column */}
                <div>
                  <GoogleMapComponent 
                    latitude={weatherData.latitude} 
                    longitude={weatherData.longitude} 
                    location={location} 
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Forecast Section */}
          {weatherData.forecast && (
            <Card>
              <CardBody>
                <h2 className="text-2xl font-semibold mb-6">{forecastSectionTitle}</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {weatherData.forecast.map((day) => (
                    <div
                      key={day.dt}
                      className="flex flex-col items-center p-4 rounded-lg bg-content1 hover:bg-content2 transition-colors"
                    >
                      <p className="font-semibold text-lg">{getDayName(day.date)}</p>
                      <p className="text-sm text-gray-500">{day.date}</p>
                      <img
                        src={getWeatherIcon(day.icon)}
                        alt={day.description}
                        className="w-16 h-16 my-2"
                      />
                      <div className="flex gap-2 items-center">
                        <span className="text-lg font-semibold">
                          {Math.round(convertTemp(day.temp_max))}°
                        </span>
                        <span className="text-sm text-gray-500">
                          {Math.round(convertTemp(day.temp_min))}°
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 text-center capitalize">{day.description}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Save/Update Record Button */}
      {weatherData && (
        <div className="mt-4 flex justify-end">
          <Button 
            color="success" 
            onClick={handleSaveOrUpdateRecord}
          >
            {selectedRecord ? 'Update Record' : 'Save Record'}
          </Button>
        </div>
      )}

      <Divider className="my-8" />

      {/* Records Table */}
      {records.length > 0 && (
        <Card className="mt-8">
          <CardBody>
            <h2 className="text-2xl font-semibold mb-6">Saved Weather Records</h2>
            <Table aria-label="Weather Records">
              <TableHeader>
                <TableColumn>Location</TableColumn>
                <TableColumn>Start Date</TableColumn>
                <TableColumn>End Date</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.location}</TableCell>
                    <TableCell>{format(new Date(record.startDate), 'MMMM d, yyyy')}</TableCell>
                    <TableCell>{format(new Date(record.endDate), 'MMMM d, yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          color="primary" 
                          size="sm" 
                          onClick={() => handleViewRecord(record)}
                        >
                          View
                        </Button>
                        <Button 
                          color="danger" 
                          size="sm" 
                          onClick={() => handleDeleteRecord(record.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
