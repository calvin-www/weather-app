'use client';

import React, { useState, useEffect } from 'react';
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';

interface GoogleMapComponentProps {
  latitude: number;
  longitude: number;
  location: string;
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  latitude,
  longitude,
  location,
}) => {
  const [mapError, setMapError] = useState<string | null>(null);

  // Robust API key detection
  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    libraries: ['places'],
  });

  useEffect(() => {
    if (loadError) {
      console.error('Google Maps script failed to load', loadError);
      setMapError(`Failed to load Google Maps: ${loadError.message}`);
    }
  }, [loadError]);

  const mapOptions = {
    disableDefaultUI: true,
    styles: [
      {
        featureType: 'landscape',
        stylers: [{ saturation: -100 }, { lightness: 60 }],
      },
      {
        featureType: 'road',
        stylers: [{ saturation: -100 }, { lightness: 40 }],
      },
      {
        featureType: 'water',
        stylers: [{ color: '#a0d6f5' }],
      },
    ],
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false,
  };

  const containerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '16px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    border: '2px solid #f0f0f0',
  };

  const center = {
    lat: latitude,
    lng: longitude,
  };

  if (!apiKey) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-gray-100 text-red-600 rounded-lg shadow-md">
        Google Maps API key is missing.
        <pre className="ml-4 text-xs">
          Checked: - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}-
          GOOGLE_MAPS_API_KEY: {process.env.GOOGLE_MAPS_API_KEY}
        </pre>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-gray-100 text-red-600 rounded-lg">
        {mapError}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-gray-100 text-gray-600 rounded-lg">
        Loading map...
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl overflow-hidden shadow-lg">
      <GoogleMap center={center} mapContainerStyle={containerStyle} options={mapOptions} zoom={10}>
        <Marker
          icon={{
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new window.google.maps.Size(40, 40),
          }}
          position={center}
          title={location}
        />
      </GoogleMap>
    </div>
  );
};

export default GoogleMapComponent;
