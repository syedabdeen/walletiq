import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceIdAsync } from './useDeviceId';

interface DeviceCheckResult {
  allowed: boolean;
  reason: 'device_registered' | 'device_matched' | 'device_mismatch';
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(`${label} timed out`)), ms);
  });

  return (Promise.race([Promise.resolve(promise as any), timeoutPromise]) as Promise<T>).finally(() => {
    if (timeoutId) window.clearTimeout(timeoutId);
  });
}

export function useDeviceCheck() {
  const [checking, setChecking] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  const checkDevice = useCallback(async (userId: string): Promise<DeviceCheckResult | null> => {
    setChecking(true);
    setDeviceError(null);

    try {
      const deviceId = await withTimeout(getDeviceIdAsync(), 6000, 'Get device id');
      console.log('[useDeviceCheck] Checking device:', deviceId, 'for user:', userId);

      const { data, error } = await withTimeout(
        supabase.rpc('check_device_access', {
          _user_id: userId,
          _device_id: deviceId,
        }),
        8000,
        'Device access check',
      );

      if (error) {
        console.error('Device check error:', error);
        setDeviceError('Failed to verify device access');
        return null;
      }

      const result = data as unknown as DeviceCheckResult;
      console.log('[useDeviceCheck] Result:', result);

      if (!result.allowed) {
        setDeviceError('This account is already registered on another device. Please use the original device to access your account.');
      }

      return result;
    } catch (err) {
      console.error('Device check error:', err);
      setDeviceError('Failed to verify device access');
      return null;
    } finally {
      setChecking(false);
    }
  }, []);

  const clearDeviceError = useCallback(() => {
    setDeviceError(null);
  }, []);

  return { checkDevice, checking, deviceError, clearDeviceError };
}
