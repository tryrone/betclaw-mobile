import { Redirect, Tabs } from 'expo-router';

import { TabBar } from '@/components/ui';
import { useAuthStore } from '@/store/auth-store';

export default function TabLayout() {
  const authStatus = useAuthStore((state) => state.status);

  if (authStatus === 'hydrating') {
    return null;
  }

  if (authStatus !== 'authenticated') {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="fix-ticket" options={{ title: 'Fix' }} />
      <Tabs.Screen name="build-ticket" options={{ title: 'Build' }} />
      <Tabs.Screen name="convert-ticket" options={{ title: 'Convert' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="wallet" options={{ title: 'Wallet' }} />
      <Tabs.Screen name="referrals" options={{ title: 'Referrals' }} />
      <Tabs.Screen name="settings" options={{ title: 'Me' }} />
    </Tabs>
  );
}
