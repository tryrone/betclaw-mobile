import type { MobileAuthSession } from '@/lib/api/types';

export async function configureNativeGoogleSignIn() {
  return;
}

export async function signInWithNativeGoogle(): Promise<MobileAuthSession> {
  throw new Error('Google sign in requires an iOS or Android development build.');
}
