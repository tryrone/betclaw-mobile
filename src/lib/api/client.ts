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

export function getTrpcErrorCode(error: unknown) {
  return error instanceof TRPCClientError
    ? (error.data as { code?: string } | undefined)?.code ?? null
    : null;
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

function friendlyZodMessage(raw: string): string | null {
  // tRPC surfaces Zod validation failures as a JSON array of issues.
  if (!raw.trimStart().startsWith('[')) return null;
  try {
    const issues = JSON.parse(raw);
    if (!Array.isArray(issues)) return null;
    const messages = issues
      .map((issue) => (issue && typeof issue.message === 'string' ? issue.message : null))
      .filter((message): message is string => Boolean(message));
    return messages.length > 0 ? Array.from(new Set(messages)).join('\n') : null;
  } catch {
    return null;
  }
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return friendlyZodMessage(error.message) ?? error.message;
  }
  return 'Something went wrong. Please try again.';
}
