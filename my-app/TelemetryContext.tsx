"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TelemetryData {
  ping: number;
  jitter: number;
  packetLoss: number;
  isHydrated: boolean;
}

interface TelemetryContextType {
  telemetry: TelemetryData;
  setTelemetry: React.Dispatch<React.SetStateAction<TelemetryData>>;
  markHydrated: () => void;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider = ({ children }: { children: ReactNode }) => {
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    ping: 0,
    jitter: 0,
    packetLoss: 0,
    isHydrated: false,
  });

  const markHydrated = () => {
    setTelemetry(prev => ({ ...prev, isHydrated: true }));
  };

  return (
    <TelemetryContext.Provider value={{ telemetry, setTelemetry, markHydrated }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
