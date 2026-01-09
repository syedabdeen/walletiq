import { useState, useEffect, useCallback } from 'react';

export interface VoiceLanguageOption {
  code: string;      // BCP-47 language code for Web Speech API
  name: string;      // Display name
  nativeName: string; // Name in native script
}

// Supported languages for voice input - commonly used languages with good speech recognition support
export const VOICE_LANGUAGES: VoiceLanguageOption[] = [
  { code: 'en-US', name: 'English (US)', nativeName: 'English' },
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English' },
  { code: 'en-IN', name: 'English (India)', nativeName: 'English' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ar-SA', name: 'Arabic (Saudi)', nativeName: 'العربية' },
  { code: 'ar-AE', name: 'Arabic (UAE)', nativeName: 'العربية' },
  { code: 'es-ES', name: 'Spanish (Spain)', nativeName: 'Español' },
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch' },
  { code: 'it-IT', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', nativeName: 'Português' },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '中文' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
  { code: 'id-ID', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ms-MY', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'th-TH', name: 'Thai', nativeName: 'ไทย' },
  { code: 'vi-VN', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'tr-TR', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'pl-PL', name: 'Polish', nativeName: 'Polski' },
  { code: 'nl-NL', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'sv-SE', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'da-DK', name: 'Danish', nativeName: 'Dansk' },
  { code: 'no-NO', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'fi-FI', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'el-GR', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'he-IL', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'ur-PK', name: 'Urdu', nativeName: 'اردو' },
  { code: 'bn-BD', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'tl-PH', name: 'Filipino', nativeName: 'Filipino' },
];

const STORAGE_KEY = 'walletiq_voice_language';
const DEFAULT_LANGUAGE = 'en-US';

/**
 * Hook to manage voice input language preference
 * Stored in localStorage for persistence without database changes
 */
export function useVoiceLanguage() {
  const [voiceLanguage, setVoiceLanguageState] = useState<string>(DEFAULT_LANGUAGE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && VOICE_LANGUAGES.some(lang => lang.code === stored)) {
        setVoiceLanguageState(stored);
      }
    } catch (e) {
      console.warn('Failed to load voice language preference:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  const setVoiceLanguage = useCallback((languageCode: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, languageCode);
      setVoiceLanguageState(languageCode);
    } catch (e) {
      console.warn('Failed to save voice language preference:', e);
    }
  }, []);

  // Get the current language option
  const currentLanguage = VOICE_LANGUAGES.find(lang => lang.code === voiceLanguage) 
    || VOICE_LANGUAGES[0];

  return {
    voiceLanguage,
    setVoiceLanguage,
    currentLanguage,
    isLoaded,
    languages: VOICE_LANGUAGES,
  };
}
