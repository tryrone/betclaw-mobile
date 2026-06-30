import { useEffect } from 'react';

import { configureNativeGoogleSignIn } from '@/lib/api/google-auth';
import { useAuthStore } from '@/store/auth-store';

export function AuthBootstrap() {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    void configureNativeGoogleSignIn();
    hydrate().catch(() => undefined);
  }, [hydrate]);

  return null;
}
