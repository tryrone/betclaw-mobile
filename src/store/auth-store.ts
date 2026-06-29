import { create } from 'zustand';

import {
  readStoredAuthTokens,
  writeStoredAuthTokens,
  type StoredAuthTokens,
} from '@/lib/auth-token-storage';

export type MobileUser = {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
  role?: string;
};

export type AuthStatus = 'hydrating' | 'anonymous' | 'authenticated';

type AuthState = {
  accessToken: string | null;
  expiresAt: string | null;
  hydrate: () => Promise<void>;
  refreshExpiresAt: string | null;
  refreshToken: string | null;
  setSession: (session: {
    accessToken: string;
    expiresAt: string | Date;
    refreshExpiresAt: string | Date;
    refreshToken: string;
    user: MobileUser;
  }) => Promise<void>;
  clearSession: () => Promise<void>;
  status: AuthStatus;
  user: MobileUser | null;
};

function serializeDate(value: string | Date) {
  return value instanceof Date ? value.toISOString() : value;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  expiresAt: null,
  refreshExpiresAt: null,
  refreshToken: null,
  status: 'hydrating',
  user: null,

  hydrate: async () => {
    let tokens: StoredAuthTokens | null = null;

    try {
      tokens = await readStoredAuthTokens();
    } catch {
      tokens = null;
    }

    if (!tokens?.accessToken || !tokens.refreshToken) {
      set({ status: 'anonymous' });
      return;
    }

    set({
      accessToken: tokens.accessToken,
      expiresAt: tokens.expiresAt,
      refreshExpiresAt: tokens.refreshExpiresAt,
      refreshToken: tokens.refreshToken,
      status: 'authenticated',
    });
  },

  setSession: async (session) => {
    const tokens: StoredAuthTokens = {
      accessToken: session.accessToken,
      expiresAt: serializeDate(session.expiresAt),
      refreshExpiresAt: serializeDate(session.refreshExpiresAt),
      refreshToken: session.refreshToken,
    };

    await writeStoredAuthTokens(tokens);
    set({
      ...tokens,
      status: 'authenticated',
      user: session.user,
    });
  },

  clearSession: async () => {
    await writeStoredAuthTokens(null);
    set({
      accessToken: null,
      expiresAt: null,
      refreshExpiresAt: null,
      refreshToken: null,
      status: 'anonymous',
      user: null,
    });
  },
}));
