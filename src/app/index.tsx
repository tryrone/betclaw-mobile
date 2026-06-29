import { Redirect } from 'expo-router';

import { useAuthStore } from '@/store/auth-store';

export default function HomeScreen() {
  const authStatus = useAuthStore((state) => state.status);

  if (authStatus === 'hydrating') {
    return null;
  }

  return <Redirect href={authStatus === 'authenticated' ? '/(tabs)' : '/(auth)/welcome'} />;
}
