import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings, useUpdateSettings, COUNTRIES } from '@/hooks/useSettings';
import { useVoiceLanguage, VOICE_LANGUAGES } from '@/hooks/useVoiceLanguage';
import { Globe, Coins, Save, Loader2, Moon, Sun, Monitor, Headphones, Mail, MessageCircle, Mic } from 'lucide-react';
import { isSpeechRecognitionSupported } from '@/lib/voiceExpenseParser';
import { toast } from 'sonner';

export default function Settings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { theme, setTheme } = useTheme();
  const { voiceLanguage, setVoiceLanguage, currentLanguage } = useVoiceLanguage();
  const [mounted, setMounted] = useState(false);
  
  const [selectedCountry, setSelectedCountry] = useState('AE');
  const [selectedVoiceLanguage, setSelectedVoiceLanguage] = useState(voiceLanguage);
  const [hasChanges, setHasChanges] = useState(false);
  const [hasVoiceChanges, setHasVoiceChanges] = useState(false);
  const isVoiceSupported = isSpeechRecognitionSupported();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (settings) {
      setSelectedCountry(settings.country_code);
    }
  }, [settings]);

  // Sync voice language when it loads
  useEffect(() => {
    setSelectedVoiceLanguage(voiceLanguage);
  }, [voiceLanguage]);

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setHasChanges(countryCode !== settings?.country_code);
  };

  const handleVoiceLanguageChange = (langCode: string) => {
    setSelectedVoiceLanguage(langCode);
    setHasVoiceChanges(langCode !== voiceLanguage);
  };

  const handleSaveVoiceLanguage = () => {
    setVoiceLanguage(selectedVoiceLanguage);
    setHasVoiceChanges(false);
    toast.success('Voice language updated');
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
          <p className="text-muted-foreground">Configure your preferences</p>
        </div>

        {/* Theme Settings */}
        <Card className="animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Moon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how WalletIQ looks on your device
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Theme</Label>
              {mounted && (
                <div className="flex gap-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('light')}
                    className="flex-1"
                  >
                    <Sun className="w-4 h-4 mr-2" />
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className="flex-1"
                  >
                    <Moon className="w-4 h-4 mr-2" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('system')}
                    className="flex-1"
                  >
                    <Monitor className="w-4 h-4 mr-2" />
                    System
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings */}
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

        {/* Voice Input Settings */}
        <Card className="animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mic className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Voice Input</CardTitle>
                <CardDescription>
                  Configure voice input language for adding expenses
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isVoiceSupported ? (
              <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
                <p className="text-sm">
                  Voice input is not supported in this browser. Please use Chrome, Edge, or Safari for voice features.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="voice-language">Speech Recognition Language</Label>
                  <Select value={selectedVoiceLanguage} onValueChange={handleVoiceLanguageChange}>
                    <SelectTrigger id="voice-language" className="w-full">
                      <SelectValue placeholder="Select your language" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] bg-popover border border-border z-50">
                      {VOICE_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <span className="flex items-center gap-2">
                            <span>{lang.name}</span>
                            {lang.nativeName !== lang.name.split(' ')[0] && (
                              <span className="text-muted-foreground">({lang.nativeName})</span>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose the language you'll speak when adding expenses by voice
                  </p>
                </div>

                {currentLanguage && (
                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Current Language</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground">
                      {currentLanguage.nativeName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentLanguage.name} ({currentLanguage.code})
                    </p>
                  </div>
                )}

                <Button 
                  onClick={handleSaveVoiceLanguage} 
                  disabled={!hasVoiceChanges}
                  className="w-full sm:w-auto"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Language
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Help & Support */}
        <Card className="animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Headphones className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Help & Support</CardTitle>
                <CardDescription>
                  Get in touch with our support team
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <a 
              href="mailto:cmc@wiedelens.info" 
              className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
            >
              <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Email Support</p>
                <p className="font-semibold text-foreground">cmc@wiedelens.info</p>
              </div>
            </a>

            <a 
              href="https://wa.me/971525943300" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
            >
              <div className="p-2 rounded-full bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <MessageCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">WhatsApp Support</p>
                <p className="font-semibold text-foreground">+971 52 594 3300</p>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
