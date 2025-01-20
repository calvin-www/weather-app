'use client';

import { useState, useEffect } from 'react';

interface GeolocationState {
  loading: boolean;
  error: string | null;
  location: {
    latitude: number;
    longitude: number;
  } | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    loading: true,
    error: null,
    location: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        loading: false,
        error: 'Geolocation is not supported by your browser',
        location: null,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          loading: false,
          error: null,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
      },
      (error) => {
        setState({
          loading: false,
          error: error.message,
          location: null,
        });
      }
    );
  }, []);

  return state;
}
