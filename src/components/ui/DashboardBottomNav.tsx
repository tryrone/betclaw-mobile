import { Link, usePathname } from 'expo-router';
import { CalendarDots, ClockCounterClockwise, Sparkle, UserCircle, Wrench } from 'phosphor-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/PressableScale';
import { useAppTheme } from '@/theme/colors';
import { fonts } from '@/theme/typography';

const items = [
  { href: '/(tabs)' as const, active: ['/', '/(tabs)'], label: 'Today', Icon: Sparkle },
  { href: '/(tabs)/matches' as const, active: ['/matches'], label: 'Matches', Icon: CalendarDots },
  { href: '/(tabs)/tools' as const, active: ['/tools', '/fix-ticket', '/build-ticket', '/convert-ticket'], label: 'Tools', Icon: Wrench },
  { href: '/(tabs)/history' as const, active: ['/history'], label: 'Activity', Icon: ClockCounterClockwise },
  { href: '/(tabs)/settings' as const, active: ['/settings', '/wallet', '/referrals'], label: 'Account', Icon: UserCircle },
] as const;

function normalized(pathname: string) {
  if (pathname === '/' || pathname === '/(tabs)') return '/';
  return pathname.replace('/(tabs)', '');
}

export function DashboardBottomNav() {
  const insets = useSafeAreaInsets();
  const pathname = normalized(usePathname());
  const theme = useAppTheme();

  return (
    <View style={[styles.host, { backgroundColor: theme.tabBar, borderTopColor: theme.borderStrong, paddingBottom: insets.bottom }]}>
      <View accessibilityRole="tablist" style={styles.row}>
        {items.map(({ href, active, label, Icon }) => {
          const selected = active.some((path) => pathname === path || (path !== '/' && pathname.startsWith(`${path}/`)));
          const color = selected ? theme.primary : theme.muted;
          return (
            <Link asChild href={href as any} key={label}>
              <PressableScale
                accessibilityLabel={label}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                haptic
                scaleTo={0.95}
                style={styles.item}>
                <View style={[styles.iconWrap, selected ? { backgroundColor: theme.primarySubtle } : null]}>
                  <Icon color={color} size={21} weight={selected ? 'fill' : 'regular'} />
                </View>
                {selected ? <Text style={[styles.label, { color }, styles.labelActive]}>{label}</Text> : null}
              </PressableScale>
            </Link>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { borderTopWidth: StyleSheet.hairlineWidth },
  iconWrap: { alignItems: 'center', borderRadius: 12, height: 28, justifyContent: 'center', width: 42 },
  item: { alignItems: 'center', flex: 1, gap: 2, justifyContent: 'center', minHeight: 58, minWidth: 48 },
  label: { fontFamily: fonts.medium, fontSize: 10 },
  labelActive: { fontFamily: fonts.bold },
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 58, paddingHorizontal: 4 },
});
