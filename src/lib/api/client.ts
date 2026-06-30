import { createTRPCClient, httpBatchLink, TRPCClientError } from '@trpc/client';

import { apiBaseUrl } from '@/lib/config';
import { getMobileDeviceInput } from '@/lib/device';
import { useAuthStore } from '@/store/auth-store';

export const trpc = createTRPCClient<any>({
  links: [
    httpBatchLink({
      url: `${apiBaseUrl}/api/trpc`,
      headers() {
        const token = useAuthStore.getState().accessToken;
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
}) as Record<string, any>;

let refreshPromise: Promise<boolean> | null = null;

function isUnauthorized(error: unknown) {
  return (
    error instanceof TRPCClientError &&
    (error.data as { code?: string } | undefined)?.code === 'UNAUTHORIZED'
  );
}

async function performMobileSessionRefresh() {
  const { refreshToken, setSession, clearSession } = useAuthStore.getState();
  if (!refreshToken) return false;

  try {
    const session = await trpc.auth.mobileRefresh.mutate({
      refreshToken,
      ...(await getMobileDeviceInput()),
    });
    await setSession(session);
    return true;
  } catch {
    if (useAuthStore.getState().refreshToken === refreshToken) {
      await clearSession();
      return false;
    }

    return true;
  }
}

export function refreshMobileSession() {
  refreshPromise ??= performMobileSessionRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function callWithMobileRefresh<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    const refreshed = await refreshMobileSession();
    if (!refreshed) throw error;
    return operation();
  }
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
