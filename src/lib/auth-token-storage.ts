import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type StoredAuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  refreshExpiresAt: string;
};

const AUTH_TOKEN_KEY = 'betclaw.mobile.authTokens';

async function secureStoreAvailable() {
  if (Platform.OS === 'web') return false;
  return SecureStore.isAvailableAsync();
}

export async function readStoredAuthTokens() {
  const raw = (await secureStoreAvailable())
    ? await SecureStore.getItemAsync(AUTH_TOKEN_KEY)
    : await AsyncStorage.getItem(AUTH_TOKEN_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredAuthTokens;
  } catch {
    return null;
  }
}

export async function writeStoredAuthTokens(tokens: StoredAuthTokens | null) {
  if (!tokens) {
    if (await secureStoreAvailable()) {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    } else {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    }
    return;
  }

  const raw = JSON.stringify(tokens);
  if (await secureStoreAvailable()) {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, raw);
  } else {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, raw);
  }
}
