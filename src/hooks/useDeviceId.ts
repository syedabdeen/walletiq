import { useCallback, useMemo, useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const DEVICE_ID_KEY = 'walletiq_device_id';
const FINGERPRINT_KEY = 'walletiq_fingerprint';

// Cache for fingerprint to avoid recalculating
let cachedFingerprint: string | null = null;

async function generateFingerprint(): Promise<string> {
  const timeoutMs = 6000;

  const withTimeout = async <T,>(promise: Promise<T>, label: string): Promise<T> => {
    let timeoutId: number | undefined;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
    });

    try {
      return (await Promise.race([promise, timeoutPromise])) as T;
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }
  };

  try {
    const fp = (await withTimeout(FingerprintJS.load(), 'FingerprintJS.load')) as Awaited<
      ReturnType<typeof FingerprintJS.load>
    >;
    const result = await withTimeout(fp.get(), 'FingerprintJS.get');
    return result.visitorId;
  } catch (error) {
    console.error('Fingerprint generation failed:', error);
    // Fallback to random ID if fingerprinting fails or times out
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `fallback-${timestamp}-${randomPart}`;
  }
}

function generateDeviceId(): string {
  // Generate a unique device ID based on timestamp and random values
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}-${randomPart2}`;
}

// Get or create a stable device ID using fingerprinting
async function getStableDeviceId(): Promise<string> {
  // First check if we have a fingerprint cached in memory
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  // Check localStorage for existing fingerprint
  const storedFingerprint = localStorage.getItem(FINGERPRINT_KEY);
  if (storedFingerprint) {
    cachedFingerprint = storedFingerprint;
    return storedFingerprint;
  }

  // Generate new fingerprint
  const fingerprint = await generateFingerprint();
  localStorage.setItem(FINGERPRINT_KEY, fingerprint);
  cachedFingerprint = fingerprint;
  
  return fingerprint;
}

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const initDeviceId = async () => {
      const id = await getStableDeviceId();
      if (mounted) {
        setDeviceId(id);
        setLoading(false);
      }
    };

    initDeviceId();

    return () => {
      mounted = false;
    };
  }, []);

  const clearDeviceId = useCallback(() => {
    localStorage.removeItem(DEVICE_ID_KEY);
    localStorage.removeItem(FINGERPRINT_KEY);
    cachedFingerprint = null;
  }, []);

  return { deviceId, clearDeviceId, loading };
}

// Synchronous version for immediate use - returns cached or localStorage value
export function getDeviceId(): string {
  // Return cached fingerprint if available
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  // Check localStorage for fingerprint
  const storedFingerprint = localStorage.getItem(FINGERPRINT_KEY);
  if (storedFingerprint) {
    cachedFingerprint = storedFingerprint;
    return storedFingerprint;
  }

  // Fallback to legacy device ID
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

// Async version that ensures fingerprint is generated
export async function getDeviceIdAsync(): Promise<string> {
  return getStableDeviceId();
}

// Initialize fingerprint on app load
export async function initializeDeviceFingerprint(): Promise<void> {
  await getStableDeviceId();
}
