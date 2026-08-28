import { Redirect, Tabs } from 'expo-router';

import { TabBar } from '@/components/ui';
import { TOOL_ROUTES } from '@/lib/tool-routes';
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
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches' }} />
      <Tabs.Screen name="tools" options={{ title: 'Tools' }} />
      <Tabs.Screen name="history" options={{ title: 'Activity' }} />
      <Tabs.Screen name="settings" options={{ title: 'Account' }} />
      {Object.values(TOOL_ROUTES).map((route) => (
        <Tabs.Screen key={route.screen} name={route.screen} options={{ href: null }} />
      ))}
      <Tabs.Screen name="wallet" options={{ href: null }} />
      <Tabs.Screen name="referrals" options={{ href: null }} />
    </Tabs>
  );
}
