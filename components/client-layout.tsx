'use client';

import { Navbar } from '@/components/navbar';
import { TemperatureProvider } from '@/contexts/temperature-unit';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <TemperatureProvider>
      <div className="relative flex flex-col h-screen">
        <Navbar />
        <main className="container mx-auto max-w-7xl pt-16 px-6 flex-grow">{children}</main>
      </div>
    </TemperatureProvider>
  );
}
