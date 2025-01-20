'use client';

import React from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

interface GoogleMapComponentProps {
  latitude: number;
  longitude: number;
  location: string;
}

const containerStyle = {
  width: '100%',
  height: '400px'
};

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({ 
  latitude, 
  longitude, 
  location 
}) => {
  const center = {
    lat: latitude,
    lng: longitude
  };

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
    >
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
      >
        <Marker 
          position={center} 
          title={location}
        />
      </GoogleMap>
    </LoadScript>
  );
};

export default GoogleMapComponent;
