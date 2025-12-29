import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings, useUpdateSettings, COUNTRIES } from '@/hooks/useSettings';
import { Globe, Coins, Save, Loader2 } from 'lucide-react';

export default function Settings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  
  const [selectedCountry, setSelectedCountry] = useState('AE');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setSelectedCountry(settings.country_code);
    }
  }, [settings]);

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setHasChanges(countryCode !== settings?.country_code);
  };

  const handleSave = () => {
    const country = COUNTRIES.find(c => c.code === selectedCountry);
    if (!country) return;

    updateSettings.mutate({
      country_code: country.code,
      country_name: country.name,
      currency_code: country.currency.code,
      currency_symbol: country.currency.symbol,
    }, {
      onSuccess: () => setHasChanges(false),
    });
  };

  const selectedCountryData = COUNTRIES.find(c => c.code === selectedCountry);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure your regional preferences</p>
        </div>

        <Card className="animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Regional Settings</CardTitle>
                <CardDescription>
                  Set your country and currency for expense tracking
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={selectedCountry} onValueChange={handleCountryChange}>
                <SelectTrigger id="country" className="w-full">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-popover border border-border z-50">
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCountryData && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Currency</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Code</p>
                    <p className="font-semibold text-foreground">{selectedCountryData.currency.code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Symbol</p>
                    <p className="font-semibold text-foreground text-lg">{selectedCountryData.currency.symbol}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium text-foreground">{selectedCountryData.currency.name}</p>
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || updateSettings.isPending}
              className="w-full sm:w-auto"
            >
              {updateSettings.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
