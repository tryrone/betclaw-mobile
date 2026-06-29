import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'betclaw.mobile.deviceId';

function randomDeviceId() {
  const maybeCrypto = globalThis.crypto as { randomUUID?: () => string } | undefined;
  return maybeCrypto?.randomUUID?.() ?? `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function getDeviceId() {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const created = randomDeviceId();
  await AsyncStorage.setItem(DEVICE_ID_KEY, created);
  return created;
}

export async function getMobileDeviceInput() {
  return {
    deviceId: await getDeviceId(),
    deviceName: Device.modelName ?? Device.deviceName ?? Platform.OS,
    platform: Platform.OS,
  };
}
