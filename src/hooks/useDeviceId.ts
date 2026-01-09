import { useCallback, useMemo } from 'react';

const DEVICE_ID_KEY = 'walletiq_device_id';

function generateDeviceId(): string {
  // Generate a unique device ID based on timestamp and random values
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}-${randomPart2}`;
}

export function useDeviceId() {
  const deviceId = useMemo(() => {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = generateDeviceId();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  }, []);

  const clearDeviceId = useCallback(() => {
    localStorage.removeItem(DEVICE_ID_KEY);
  }, []);

  return { deviceId, clearDeviceId };
}

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
