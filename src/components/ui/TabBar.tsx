import type { BottomTabBarProps } from 'expo-router/tabs';

import { DashboardBottomNav } from '@/components/ui/DashboardBottomNav';

export function TabBar(_props: BottomTabBarProps) {
  return <DashboardBottomNav />;
}
