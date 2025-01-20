'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
import { Divider } from '@heroui/divider';
import { DateRangePicker, RangeValue, DateValue } from '@heroui/react';
import { useTemperature } from '@/contexts/temperature-unit';
import { useGeolocation } from '@/components/use-geolocation';
import { format, addDays } from 'date-fns';
import { parseDate, CalendarDate } from "@internationalized/date";
import GoogleMapComponent from '@/components/GoogleMap';
import toast from 'react-hot-toast';
import RecordsTable from '@/components/RecordsTable';
import { WeatherData, WeatherRecord } from '@/types/weather';
import ExportModal from '@/components/ExportModal';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<WeatherRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<WeatherRecord | null>(null);
  const [dateRange, setDateRange] = useState<RangeValue<DateValue>>({
    start: parseDate(new Date().toISOString().split('T')[0]),
    end: parseDate(addDays(new Date(), 7).toISOString().split('T')[0])
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
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
    const [year, month, day] = calendarDate.toString().split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-based in JavaScript Date
  };

  const fetchWeather = async (
    searchLocation?: string, 
    start?: Date, 
    end?: Date
  ) => {
    try {
      setLoading(true);
      setError(null);

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

      console.log('Fetching weather with params:', Object.fromEntries(params.entries()));

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
    try {
      // Validate required data
      if (!weatherData || !location) {
        setError('Weather data and location are required');
        return;
      }

      // Prepare record data
      const recordData = {
        location,
        latitude: weatherData.latitude,
        longitude: weatherData.longitude,
        startDate: dateRange.start 
          ? convertFromCalendarDate(dateRange.start).toISOString() 
          : new Date().toISOString(),
        endDate: dateRange.end 
          ? convertFromCalendarDate(dateRange.end).toISOString() 
          : new Date().toISOString(),
        weatherData: JSON.stringify({
          location,
          latitude: weatherData.latitude,
          longitude: weatherData.longitude,
          current: {
            ...weatherData.current,
            temp_min: weatherData.current.temp_min ?? weatherData.current.temp,
            temp_max: weatherData.current.temp_max ?? weatherData.current.temp
          },
          forecast: weatherData.forecast
        })
      };

      // Determine if we're updating an existing record or creating a new one
      if (selectedRecord) {
        // Update existing record
        const response = await fetch(`/api/records?id=${selectedRecord.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recordData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update record');
        }

        const result = await response.json();
        
        // Update the records list
        const updatedRecords = records.map(record => 
          record.id === selectedRecord.id ? result.record : record
        );
        setRecords(updatedRecords);

        // Reset selected record
        setSelectedRecord(null);
        
        toast.success('Record updated successfully');
      } else {
        // Create new record
        const response = await fetch('/api/records', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recordData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to save record');
        }

        const result = await response.json();

        // Add new record to the list
        setRecords(prevRecords => [result.record, ...prevRecords]);
        
        toast.success('Record saved successfully');
      }

      // Close modal or reset state as needed
      setIsModalOpen(false);
      
      // Refresh records
      fetchRecords();
    } catch (err) {
      console.error('Save/Update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save/update record');
      toast.error(err instanceof Error ? err.message : 'Failed to save/update record');
    }
  };

  const handleViewRecord = async (record: WeatherRecord) => {
    try {
      // Fetch full record details
      const response = await fetch(`/api/records?id=${record.id}`);
      const fullRecord = await response.json();

      // Parse the stored weather data
      const parsedWeatherData = JSON.parse(fullRecord.weatherData);

      // Prepare formatted weather data
      const formattedWeatherData: WeatherData = {
        location: fullRecord.location,
        latitude: fullRecord.latitude,
        longitude: fullRecord.longitude,
        current: {
          temp: parsedWeatherData.current.temp,
          temp_min: parsedWeatherData.current.temp_min,
          temp_max: parsedWeatherData.current.temp_max,
          description: parsedWeatherData.current.description,
          icon: parsedWeatherData.current.icon
        },
        forecast: parsedWeatherData.forecast
      };
      
      // Set the parsed weather data 
      setWeatherData(formattedWeatherData);
      
      // Set location from the record
      setLocation(fullRecord.location);
      
      // Set date range from the record
      setDateRange({
        start: convertToCalendarDate(new Date(fullRecord.startDate)),
        end: convertToCalendarDate(new Date(fullRecord.endDate))
      });
      
      // Set the selected record
      setSelectedRecord({
        ...fullRecord,
        description: formattedWeatherData.current.description || ''
      });
      
      // Open the modal
      setIsModalOpen(true);
      
      // Clear any previous errors
      setError(null);
      
      console.log('Viewed record:', {
        record: fullRecord,
        parsedWeatherData: formattedWeatherData
      });
    } catch (err) {
      console.error('Failed to view record:', err);
      setError('Failed to load record details');
      toast.error('Failed to load record details');
    }
  };

  const handleDeleteRecord = async (id: number) => {
    try {
      const response = await fetch(`/api/records?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete record');
      }

      setRecords(prevRecords => prevRecords.filter(record => record.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  };

  const handleSearch = () => {
    if (!dateRange.start || !dateRange.end) {
      fetchWeather(location);
      return;
    }

    const start = convertFromCalendarDate(dateRange.start);
    const end = convertFromCalendarDate(dateRange.end);
    
    console.log('Searching with dates:', { start, end });
    fetchWeather(location, start, end);
  };

  const handleDateRangeChange = (value: RangeValue<DateValue> | null) => {
    if (!value || !value.start || !value.end) {
      const today = new Date();
      const fiveDaysLater = addDays(today, 7);
      
      const defaultRange = {
        start: convertToCalendarDate(today),
        end: convertToCalendarDate(fiveDaysLater)
      };
      
      setDateRange(defaultRange);
      fetchWeather(location, today, fiveDaysLater);
      return;
    }

    const startDate = convertFromCalendarDate(value.start);
    const endDate = convertFromCalendarDate(value.end);

    console.log('Date range changed:', {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    });

    // Don't modify the dates, just use them as selected
    setDateRange({
      start: value.start,
      end: value.end
    });
    
    fetchWeather(location, startDate, endDate);
  };

  const handleFiveDayForecast = () => {
    const today = new Date();
    const fiveDaysLater = addDays(today, 4); // 5 days including today
    
    const startDate = convertToCalendarDate(today);
    const endDate = convertToCalendarDate(fiveDaysLater);
    
    setDateRange({
      start: startDate,
      end: endDate
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
    <div className="container mx-auto p-4">
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
            onChange={handleDateRangeChange}
            maxValue={convertToCalendarDate(addDays(new Date(), 30))}
            defaultValue={{
              start: convertToCalendarDate(new Date()),
              end: convertToCalendarDate(addDays(new Date(), 7))
            }}
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
                {/* Temperature Details */}
                <div className="flex flex-col justify-center items-center w-full h-full p-6 bg-default-100 dark:bg-default-50/30 rounded-xl">
                  {/* Current Temperature Section */}
                  <div className="text-center w-full max-w-md">
                    <div className="flex items-center justify-center mb-6">
                      <img 
                        src={getWeatherIcon(weatherData.current.icon)} 
                        alt={weatherData.current.description} 
                        className="w-32 h-32 mr-6"
                      />
                      <div>
                        <h3 className="text-6xl font-bold text-default-900 dark:text-white">
                          {convertTemp(weatherData.current.temp).toFixed(1)}°{unit === 'celsius' ? 'C' : 'F'}
                        </h3>
                        <p className="text-default-600 dark:text-default-300 capitalize text-xl">
                          {weatherData.current.description}
                        </p>
                      </div>
                    </div>

                    {/* Max Temperature */}
                    <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg mb-4 w-full">
                      <p className="text-sm text-red-600 dark:text-red-300">Max Temp</p>
                      <p className="font-semibold text-red-900 dark:text-red-100 text-xl">
                        {convertTemp(weatherData.current.temp_max).toFixed(1)}°{unit === 'celsius' ? 'C' : 'F'}
                      </p>
                    </div>

                    {/* Min Temperature */}
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg w-full">
                      <p className="text-sm text-blue-600 dark:text-blue-300">Min Temp</p>
                      <p className="font-semibold text-blue-900 dark:text-blue-100 text-xl">
                        {convertTemp(weatherData.current.temp_min).toFixed(1)}°{unit === 'celsius' ? 'C' : 'F'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Map Component */}
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
          <Divider className="my-6" />
          <h2 className="text-2xl font-semibold mb-4">{forecastSectionTitle}</h2>
          
          {weatherData.forecast && weatherData.forecast.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {weatherData.forecast.map((day, index) => (
                <Card key={index} className="p-4 text-center">
                  <CardBody>
                    <p className="font-semibold">{getDayName(day.date)}</p>
                    <img 
                      src={getWeatherIcon(day.icon)} 
                      alt={day.description} 
                      className="w-16 h-16 mx-auto my-2"
                    />
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-sm text-default-600 dark:text-default-400">Max Temp</p>
                      <p className="font-semibold text-default-900 dark:text-default-100 text-lg">
                        {convertTemp(day.temp_max).toFixed(1)}°{unit === 'celsius' ? 'C' : 'F'}
                      </p>
                      <p className="text-sm text-default-600 dark:text-default-400 mt-1">Min Temp</p>
                      <p className="font-semibold text-default-900 dark:text-default-100">
                        {convertTemp(day.temp_min).toFixed(1)}°{unit === 'celsius' ? 'C' : 'F'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 capitalize">
                      {day.description}
                    </p>
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No forecast data available</p>
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
      <RecordsTable 
        records={records}
        onDelete={handleDeleteRecord}
        onView={handleViewRecord}
      />
      
      {/* Export Modal */}
      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        records={records.map(record => ({
          id: record.id,
          location: record.location,
          startDate: record.startDate,
          endDate: record.endDate
        }))}
      />
    </div>
  );
}
