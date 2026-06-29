import { useEffect } from 'react';

import { useAuthStore } from '@/store/auth-store';

export function AuthBootstrap() {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate().catch(() => undefined);
  }, [hydrate]);

  return null;
}
