'use client';

import React, { createContext, useContext, useState } from 'react';

type TemperatureUnit = 'celsius' | 'fahrenheit';

interface TemperatureContextType {
  unit: TemperatureUnit;
  toggleUnit: () => void;
  convertTemp: (celsius: number) => number;
}

const TemperatureContext = createContext<TemperatureContextType | undefined>(undefined);

export function TemperatureProvider({ children }: { children: React.ReactNode }) {
  const [unit, setUnit] = useState<TemperatureUnit>('fahrenheit');

  const toggleUnit = () => {
    setUnit(prev => prev === 'celsius' ? 'fahrenheit' : 'celsius');
  };

  const convertTemp = (celsius: number) => {
    return unit === 'celsius' ? celsius : (celsius * 9/5) + 32;
  };

  return (
    <TemperatureContext.Provider value={{ unit, toggleUnit, convertTemp }}>
      {children}
    </TemperatureContext.Provider>
  );
}

export function useTemperature() {
  const context = useContext(TemperatureContext);
  if (context === undefined) {
    throw new Error('useTemperature must be used within a TemperatureProvider');
  }
  return context;
}
