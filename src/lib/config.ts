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

type AppExtra = {
  googleIosClientId?: string;
  googleWebClientId?: string;
};

const extra = Constants.expoConfig?.extra as AppExtra | undefined;

function optionalValue(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export const googleWebClientId = optionalValue(
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? extra?.googleWebClientId,
);

export const googleIosClientId = optionalValue(
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? extra?.googleIosClientId,
);
