import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.1571aaafb4b049bc860c3cd756c89e37',
  appName: 'walletiq',
  webDir: 'dist',
  server: {
    url: 'https://1571aaaf-b4b0-49bc-860c-3cd756c89e37.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    SpeechRecognition: {
      // Plugin will use system default settings
    },
  },
};

export default config;
