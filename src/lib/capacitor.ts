import { Capacitor } from '@capacitor/core';

export const isNativePlatform = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch (e) {
    // Not running in a Capacitor environment
    return false;
  }
};

export const getPlatform = (): string => {
  try {
    return Capacitor.getPlatform();
  } catch (e) {
    return 'web';
  }
};
