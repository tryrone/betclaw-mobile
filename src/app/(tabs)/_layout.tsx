import { Tabs } from 'expo-router';

import { TabBar } from '@/components/ui';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="fix-ticket" options={{ title: 'Fix' }} />
      <Tabs.Screen name="wallet" options={{ title: 'Wallet' }} />
      <Tabs.Screen name="settings" options={{ title: 'Me' }} />
    </Tabs>
  );
}
