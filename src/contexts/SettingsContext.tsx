import React, { createContext, useContext, useMemo } from 'react';
import { useSettings, formatCurrency as formatCurrencyUtil } from '@/hooks/useSettings';

interface SettingsContextType {
  currencyCode: string;
  currencySymbol: string;
  countryCode: string;
  countryName: string;
  isLoading: boolean;
  formatAmount: (amount: number) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { data: settings, isLoading } = useSettings();

  const value = useMemo(() => ({
    currencyCode: settings?.currency_code || 'AED',
    currencySymbol: settings?.currency_symbol || 'د.إ',
    countryCode: settings?.country_code || 'AE',
    countryName: settings?.country_name || 'United Arab Emirates',
    isLoading,
    formatAmount: (amount: number) => {
      const formatted = formatCurrencyUtil(amount, settings?.currency_code || 'AED');
      return `${formatted} ${settings?.currency_code || 'AED'}`;
    },
  }), [settings, isLoading]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
}
