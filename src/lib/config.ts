import Constants from 'expo-constants';
import { Platform } from 'react-native';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function defaultApiUrl() {
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
}

export const apiBaseUrl = trimTrailingSlash(
  process.env.EXPO_PUBLIC_API_URL ??
    (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
    defaultApiUrl(),
);

export const expoProjectId =
  process.env.EXPO_PUBLIC_EXPO_PROJECT_ID ??
  ((Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId);
