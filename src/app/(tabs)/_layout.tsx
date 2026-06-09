import { Tabs } from 'expo-router';
import { Home, Settings, Wallet, Wand2 } from 'lucide-react-native';

import { TabBar } from '@/components/ui';

const icons = {
  'fix-ticket': Wand2,
  index: Home,
  settings: Settings,
  wallet: Wallet,
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} icons={icons} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="fix-ticket" options={{ title: 'Fix' }} />
      <Tabs.Screen name="wallet" options={{ title: 'Wallet' }} />
      <Tabs.Screen name="settings" options={{ title: 'Me' }} />
    </Tabs>
  );
}
