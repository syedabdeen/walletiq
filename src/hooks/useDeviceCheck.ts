import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceIdAsync } from './useDeviceId';

export interface DeviceCheckResult {
  allowed: boolean;
  reason: 'device_registered' | 'device_matched' | 'device_mismatch' | 'super_admin_whitelisted' | 'test_user_whitelisted';
}

export interface DeviceMismatchInfo {
  userId: string;
  currentDeviceId: string;
  newDeviceId: string;
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
  const [deviceMismatchInfo, setDeviceMismatchInfo] = useState<DeviceMismatchInfo | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);

  const checkDevice = useCallback(async (userId: string): Promise<DeviceCheckResult | null> => {
    setChecking(true);
    setDeviceError(null);
    setDeviceMismatchInfo(null);

    try {
      const deviceId = await withTimeout(getDeviceIdAsync(), 6000, 'Get device id');
      setCurrentDeviceId(deviceId);
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

      if (!result.allowed && result.reason === 'device_mismatch') {
        // Get the current registered device ID for the user
        const { data: deviceData } = await supabase
          .from('user_devices')
          .select('device_id')
          .eq('user_id', userId)
          .single();

        setDeviceMismatchInfo({
          userId,
          currentDeviceId: deviceData?.device_id || 'unknown',
          newDeviceId: deviceId,
        });
        setDeviceError('This account is already registered on another device. You can request device access from the admin.');
      } else if (!result.allowed) {
        setDeviceError('Device access denied.');
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
    setDeviceMismatchInfo(null);
  }, []);

  return { 
    checkDevice, 
    checking, 
    deviceError, 
    clearDeviceError, 
    deviceMismatchInfo,
    currentDeviceId,
  };
}
