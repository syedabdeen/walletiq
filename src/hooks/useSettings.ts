import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserSettings {
  id: string;
  user_id: string;
  currency_code: string;
  currency_symbol: string;
  country_code: string;
  country_name: string;
  created_at: string;
  updated_at: string;
}

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

export interface CountryOption {
  code: string;
  name: string;
  currency: CurrencyOption;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'AE', name: 'United Arab Emirates', currency: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' } },
  { code: 'US', name: 'United States', currency: { code: 'USD', symbol: '$', name: 'US Dollar' } },
  { code: 'GB', name: 'United Kingdom', currency: { code: 'GBP', symbol: '£', name: 'British Pound' } },
  { code: 'EU', name: 'European Union', currency: { code: 'EUR', symbol: '€', name: 'Euro' } },
  { code: 'IN', name: 'India', currency: { code: 'INR', symbol: '₹', name: 'Indian Rupee' } },
  { code: 'SA', name: 'Saudi Arabia', currency: { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' } },
  { code: 'PK', name: 'Pakistan', currency: { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' } },
  { code: 'BD', name: 'Bangladesh', currency: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' } },
  { code: 'PH', name: 'Philippines', currency: { code: 'PHP', symbol: '₱', name: 'Philippine Peso' } },
  { code: 'EG', name: 'Egypt', currency: { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' } },
  { code: 'JP', name: 'Japan', currency: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' } },
  { code: 'CN', name: 'China', currency: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' } },
  { code: 'AU', name: 'Australia', currency: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' } },
  { code: 'CA', name: 'Canada', currency: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' } },
  { code: 'SG', name: 'Singapore', currency: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' } },
  { code: 'MY', name: 'Malaysia', currency: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' } },
  { code: 'ID', name: 'Indonesia', currency: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' } },
  { code: 'TH', name: 'Thailand', currency: { code: 'THB', symbol: '฿', name: 'Thai Baht' } },
  { code: 'KR', name: 'South Korea', currency: { code: 'KRW', symbol: '₩', name: 'South Korean Won' } },
  { code: 'ZA', name: 'South Africa', currency: { code: 'ZAR', symbol: 'R', name: 'South African Rand' } },
  { code: 'BR', name: 'Brazil', currency: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' } },
  { code: 'MX', name: 'Mexico', currency: { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' } },
  { code: 'TR', name: 'Turkey', currency: { code: 'TRY', symbol: '₺', name: 'Turkish Lira' } },
  { code: 'RU', name: 'Russia', currency: { code: 'RUB', symbol: '₽', name: 'Russian Ruble' } },
  { code: 'NG', name: 'Nigeria', currency: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' } },
  { code: 'KE', name: 'Kenya', currency: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' } },
  { code: 'QA', name: 'Qatar', currency: { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal' } },
  { code: 'KW', name: 'Kuwait', currency: { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' } },
  { code: 'BH', name: 'Bahrain', currency: { code: 'BHD', symbol: 'BD', name: 'Bahraini Dinar' } },
  { code: 'OM', name: 'Oman', currency: { code: 'OMR', symbol: 'ر.ع.', name: 'Omani Rial' } },
];

export function useSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      // If no settings exist, create default settings
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from('user_settings')
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newSettings as UserSettings;
      }
      
      return data as UserSettings;
    },
    enabled: !!user,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: {
      currency_code: string;
      currency_symbol: string;
      country_code: string;
      country_name: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('user_settings')
        .update(settings)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      toast.success('Settings updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update settings: ' + error.message);
    },
  });
}

export function formatCurrency(amount: number, currencyCode: string = 'AED'): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
