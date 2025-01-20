'use client';

import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

interface GoogleMapComponentProps {
  latitude: number;
  longitude: number;
  location: string;
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({ 
  latitude, 
  longitude, 
  location 
}) => {
  const [mapError, setMapError] = useState<string | null>(null);

  // Robust API key detection
  const apiKey = 
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 
    process.env.GOOGLE_MAPS_API_KEY || 
    'AIzaSyAnBbWcHvMVsJlB8uQqELfyRvt_9nXiloA';  // Fallback to the hardcoded key

  const mapOptions = {
    disableDefaultUI: true,
    styles: [
      {
        featureType: 'landscape',
        stylers: [{ saturation: -100 }, { lightness: 60 }]
      },
      {
        featureType: 'road',
        stylers: [{ saturation: -100 }, { lightness: 40 }]
      },
      {
        featureType: 'water',
        stylers: [{ color: '#a0d6f5' }]
      }
    ],
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false
  };

  const containerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '16px',  // Rounded corners
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',  // Subtle shadow
    overflow: 'hidden',
    border: '2px solid #f0f0f0'  // Soft border
  };

  const center = {
    lat: latitude,
    lng: longitude
  };

  const handleMapError = (error: Error) => {
    console.error('Google Maps load error:', error);
    setMapError(`Failed to load map: ${error.message}`);
  };

  if (!apiKey) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-gray-100 text-red-600 rounded-lg shadow-md">
        Google Maps API key is missing. 
        <pre className="ml-4 text-xs">
          Checked:
          - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
          - GOOGLE_MAPS_API_KEY: {process.env.GOOGLE_MAPS_API_KEY}
        </pre>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl overflow-hidden shadow-lg">
      {mapError ? (
        <div className="w-full h-[400px] flex items-center justify-center bg-gray-100 text-red-600 rounded-lg">
          {mapError}
        </div>
      ) : (
        <LoadScript
          googleMapsApiKey={apiKey}
          onError={handleMapError}
        >
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={10}
            options={mapOptions}
          >
            <Marker 
              position={center} 
              title={location}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new window.google.maps.Size(40, 40)
              }}
            />
          </GoogleMap>
        </LoadScript>
      )}
    </div>
  );
};

export default GoogleMapComponent;
