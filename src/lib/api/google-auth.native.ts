import type { OneTapResponse } from 'react-native-nitro-google-signin';

import { trpc } from '@/lib/api/client';
import type { MobileAuthSession } from '@/lib/api/types';
import { googleIosClientId, googleWebClientId } from '@/lib/config';
import { getMobileDeviceInput } from '@/lib/device';

type NitroGoogleModule = typeof import('react-native-nitro-google-signin');

const DEV_BUILD_REQUIRED_MESSAGE =
  'Google sign in requires a development build. It is not available in Expo Go.';

let nativeModule: NitroGoogleModule | null | undefined;
let nativeModulePromise: Promise<NitroGoogleModule | null> | null = null;
let configuredClientKey: string | null = null;

/**
 * Lazily load the native Google Sign-In module.
 *
 * Importing it at module scope crashes the entire app in any environment
 * without the underlying native TurboModule (Expo Go, or a build that has not
 * been prebuilt/rebuilt yet). Loading it on demand keeps the app booting and
 * lets Google sign in fail gracefully instead of taking the whole app down.
 */
async function loadNativeGoogleModule(): Promise<NitroGoogleModule | null> {
  if (nativeModule !== undefined) return nativeModule;
  if (nativeModulePromise) return nativeModulePromise;

  nativeModulePromise = import('react-native-nitro-google-signin')
    .then((mod) => {
      nativeModule = mod;
      return nativeModule;
    })
    .catch(() => {
      nativeModule = null;
      return nativeModule;
    });

  return nativeModulePromise;
}

function configureGoogleSignInModule(mod: NitroGoogleModule) {
  if (!googleWebClientId) return;

  const clientKey = `${googleWebClientId}:${googleIosClientId ?? ''}`;
  if (configuredClientKey === clientKey) return;

  mod.GoogleOneTapSignIn.configure({
    iosClientId: googleIosClientId,
    webClientId: googleWebClientId,
  });
  configuredClientKey = clientKey;
}

export async function configureNativeGoogleSignIn() {
  if (!googleWebClientId) return;

  const mod = await loadNativeGoogleModule();
  if (!mod) return;

  configureGoogleSignInModule(mod);
}

function getGoogleResponseError(mod: NitroGoogleModule, response: OneTapResponse) {
  if (mod.isCancelledResponse(response)) return new Error('Google sign in was cancelled.');
  if (mod.isNoSavedCredentialFoundResponse(response)) {
    return new Error('No Google account was selected. Please try again.');
  }
  return new Error('Google sign in did not return a complete account.');
}

function normalizeGoogleSignInError(mod: NitroGoogleModule, error: unknown) {
  if (!mod.isErrorWithCode(error)) return error;

  if (error.code === mod.statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
    return new Error('Google Play Services is unavailable or needs to be updated.');
  }

  if (error.code === mod.statusCodes.SIGN_IN_CANCELLED) {
    return new Error('Google sign in was cancelled.');
  }

  return new Error(error.message || 'Google sign in could not be completed.');
}

export async function signInWithNativeGoogle() {
  if (!googleWebClientId) {
    throw new Error('Google sign in is not configured for this build.');
  }

  const mod = await loadNativeGoogleModule();
  if (!mod) {
    throw new Error(DEV_BUILD_REQUIRED_MESSAGE);
  }

  configureGoogleSignInModule(mod);

  try {
    await mod.GoogleOneTapSignIn.checkPlayServices(true);

    let response = await mod.GoogleOneTapSignIn.signIn();
    if (mod.isNoSavedCredentialFoundResponse(response)) {
      response = await mod.GoogleOneTapSignIn.createAccount();
    }
    if (mod.isNoSavedCredentialFoundResponse(response)) {
      response = await mod.GoogleOneTapSignIn.presentExplicitSignIn();
    }

    if (!mod.isSuccessResponse(response)) {
      throw getGoogleResponseError(mod, response);
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      throw new Error('Google sign in did not return an ID token.');
    }

    return trpc.auth.mobileGoogleLogin.mutate({
      idToken,
      ...(await getMobileDeviceInput()),
    }) as Promise<MobileAuthSession>;
  } catch (error) {
    throw normalizeGoogleSignInError(mod, error);
  }
}
