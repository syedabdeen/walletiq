import { isNativePlatform } from './capacitor';

interface GoogleAuthUser {
  email: string;
  familyName: string;
  givenName: string;
  id: string;
  imageUrl: string;
  name: string;
  authentication: {
    accessToken: string;
    idToken: string;
    refreshToken?: string;
  };
}

let GoogleAuth: any = null;

// Dynamically import GoogleAuth only on native platforms
export const initGoogleAuth = async (): Promise<void> => {
  if (isNativePlatform() && !GoogleAuth) {
    try {
      const module = await import('@codetrix-studio/capacitor-google-auth');
      GoogleAuth = module.GoogleAuth;
      await GoogleAuth.initialize({
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    } catch (error) {
      console.error('Failed to initialize GoogleAuth:', error);
    }
  }
};

export const nativeGoogleSignIn = async (): Promise<GoogleAuthUser | null> => {
  if (!isNativePlatform()) {
    return null;
  }

  try {
    if (!GoogleAuth) {
      await initGoogleAuth();
    }

    if (!GoogleAuth) {
      throw new Error('GoogleAuth not initialized');
    }

    const user = await GoogleAuth.signIn();
    return user;
  } catch (error) {
    console.error('Native Google Sign-In error:', error);
    throw error;
  }
};

export const nativeGoogleSignOut = async (): Promise<void> => {
  if (!isNativePlatform() || !GoogleAuth) {
    return;
  }

  try {
    await GoogleAuth.signOut();
  } catch (error) {
    console.error('Native Google Sign-Out error:', error);
  }
};
