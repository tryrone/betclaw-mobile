import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import type { MobileAuthSession, MobileOAuthProvider } from '@/lib/api/types';
import { apiBaseUrl } from '@/lib/config';
import { getMobileDeviceInput } from '@/lib/device';

WebBrowser.maybeCompleteAuthSession();

type QueryValue = string | string[] | undefined;

function singleValue(value: QueryValue) {
  return Array.isArray(value) ? value[0] : value;
}

function requireParam(params: Record<string, QueryValue>, key: string) {
  const value = singleValue(params[key]);
  if (!value) {
    throw new Error('OAuth sign in did not return a complete mobile session.');
  }

  return value;
}

export function mobileSessionFromOAuthUrl(url: string): MobileAuthSession {
  const parsed = Linking.parse(url);
  const params = parsed.queryParams ?? {};
  const oauthStatus = singleValue(params.oauth);
  const oauthError = singleValue(params.error);

  if (oauthStatus === 'error' || oauthError) {
    throw new Error('OAuth sign in could not be completed. Please try again.');
  }

  return {
    accessToken: requireParam(params, 'accessToken'),
    refreshToken: requireParam(params, 'refreshToken'),
    expiresAt: requireParam(params, 'expiresAt'),
    refreshExpiresAt: requireParam(params, 'refreshExpiresAt'),
    user: {
      id: requireParam(params, 'userId'),
      email: requireParam(params, 'email'),
      name: singleValue(params.name) ?? null,
      image: singleValue(params.image) ?? null,
      role: singleValue(params.role) ?? 'USER',
    },
  };
}

export async function signInWithMobileOAuth(provider: MobileOAuthProvider) {
  const returnUrl = Linking.createURL('/oauth/callback');
  const device = await getMobileDeviceInput();
  const startUrl = new URL(`${apiBaseUrl}/api/mobile/oauth/start`);

  startUrl.searchParams.set('provider', provider);
  startUrl.searchParams.set('returnUrl', returnUrl);
  for (const [key, value] of Object.entries(device)) {
    if (value) startUrl.searchParams.set(key, value);
  }

  const result = await WebBrowser.openAuthSessionAsync(startUrl.toString(), returnUrl);

  if (result.type !== 'success') {
    throw new Error('Sign in was cancelled.');
  }

  return mobileSessionFromOAuthUrl(result.url);
}
