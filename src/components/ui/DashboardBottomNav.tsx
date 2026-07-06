import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, usePathname } from 'expo-router';
import { ArrowRightLeft, Bot, History, Home, Menu, Settings, Share2, Wand2, Wallet, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/PressableScale';
import { useAppTheme } from '@/theme/colors';
import { useAppGradients } from '@/theme/gradients';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

type IconComponent = React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

const primaryItems = [
  { href: '/(tabs)', activePaths: ['/', '/(tabs)'], icon: Home, label: 'Home' },
  { href: '/(tabs)/fix-ticket', activePaths: ['/fix-ticket'], icon: Wand2, label: 'Fix Ticket' },
  { href: '/(tabs)/wallet', activePaths: ['/wallet'], icon: Wallet, label: 'Wallet' },
  { href: '/(tabs)/history', activePaths: ['/history'], icon: History, label: 'History' },
] as const;

const moreItems = [
  { href: '/(tabs)/build-ticket', activePaths: ['/build-ticket'], icon: Bot, label: 'Build' },
  { href: '/(tabs)/convert-ticket', activePaths: ['/convert-ticket'], icon: ArrowRightLeft, label: 'Convert' },
  { href: '/(tabs)/referrals', activePaths: ['/referrals'], icon: Share2, label: 'Referrals' },
  { href: '/(tabs)/settings', activePaths: ['/settings'], icon: Settings, label: 'Profile' },
] as const;

function normalizePath(pathname: string | null) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace('/(tabs)', '');
}

function isActive(pathname: string | null, activePaths: readonly string[]) {
  const normalized = normalizePath(pathname);
  return activePaths.some((path) => normalized === path || normalized.startsWith(`${path}/`));
}

function NavItem({
  active,
  href,
  icon: Icon,
  label,
  onPress,
}: {
  active: boolean;
  href: string;
  icon: IconComponent;
  label: string;
  onPress?: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Link href={href as any} asChild>
      <PressableScale
        accessibilityLabel={label}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        onPress={onPress}
        scaleTo={0.92}
        style={navStyles.item}>
        <View style={[navStyles.iconCircle, active ? { backgroundColor: theme.primary } : null]}>
          <Icon color={active ? theme.primaryDark : theme.muted} size={22} strokeWidth={active ? 2.2 : 1.8} />
        </View>
      </PressableScale>
    </Link>
  );
}

export function DashboardBottomNav() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const theme = useAppTheme();
  const gradients = useAppGradients();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreItems.some((item) => isActive(pathname, item.activePaths));
  const bottomInset = Math.max(insets.bottom, 8);
  const blurTint = theme.mode === 'light' ? 'light' : 'dark';

  return (
    <>
      <Modal transparent animationType="fade" visible={moreOpen} onRequestClose={() => setMoreOpen(false)}>
        <View style={navStyles.modalRoot}>
          <BlurView intensity={18} tint={blurTint} style={StyleSheet.absoluteFill} />
          <Pressable
            accessibilityLabel="Close dashboard navigation menu"
            onPress={() => setMoreOpen(false)}
            style={[navStyles.scrim, { backgroundColor: theme.overlay }]}
          />
          <View
            style={[
              navStyles.moreSheet,
              {
                borderColor: theme.border,
                bottom: bottomInset + 86,
                shadowColor: theme.shadow,
              },
            ]}>
            <BlurView intensity={34} tint={blurTint} style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={gradients.sheet}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={[navStyles.sheetHandle, { backgroundColor: theme.borderStrong }]} />
            <View style={navStyles.sheetHeader}>
              <View>
                <Text style={[navStyles.sheetTitle, { color: theme.foregroundStrong }]}>More</Text>
                <Text style={[navStyles.sheetSubtitle, { color: theme.mutedLight }]}>Dashboard shortcuts</Text>
              </View>
              <PressableScale
                accessibilityLabel="Close menu"
                accessibilityRole="button"
                onPress={() => setMoreOpen(false)}
                style={[navStyles.closeButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <X color={theme.mutedLight} size={16} />
              </PressableScale>
            </View>
            <View style={navStyles.moreGrid}>
              {moreItems.map((item) => {
                const active = isActive(pathname, item.activePaths);
                return (
                  <Link href={item.href as any} key={item.href} asChild>
                    <PressableScale
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => setMoreOpen(false)}
                      style={StyleSheet.flatten([
                        navStyles.moreItem,
                        {
                          backgroundColor: active ? theme.primarySubtle : theme.surface,
                          borderColor: active ? theme.selectionBorder : theme.border,
                        },
                      ])}>
                      {active ? (
                        <LinearGradient
                          colors={gradients.navActive}
                          end={{ x: 1, y: 1 }}
                          start={{ x: 0, y: 0 }}
                          style={StyleSheet.absoluteFill}
                        />
                      ) : null}
                      <View style={[navStyles.moreIcon, { backgroundColor: active ? theme.primaryMuted : theme.field }]}>
                        <item.icon color={active ? theme.primary : theme.foregroundStrong} size={16} />
                      </View>
                      <Text numberOfLines={1} style={[navStyles.moreLabel, { color: active ? theme.primary : theme.foregroundStrong }]}>
                        {item.label}
                      </Text>
                    </PressableScale>
                  </Link>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      <View
        pointerEvents="box-none"
        style={[
          navStyles.bar,
          {
            backgroundColor: theme.tabBar,
            borderColor: theme.border,
            paddingBottom: bottomInset,
            shadowColor: theme.shadow,
          },
        ]}>
        <View style={navStyles.row}>
          {primaryItems.map((item) => (
            <NavItem
              active={isActive(pathname, item.activePaths)}
              href={item.href}
              icon={item.icon}
              key={item.href}
              label={item.label}
            />
          ))}
          <PressableScale
            accessibilityLabel="More dashboard navigation"
            accessibilityRole="button"
            accessibilityState={{ expanded: moreOpen, selected: moreActive }}
            onPress={() => setMoreOpen((open) => !open)}
            scaleTo={0.92}
            style={navStyles.item}>
            <View style={[navStyles.iconCircle, moreActive || moreOpen ? { backgroundColor: theme.primary } : null]}>
              <Menu
                color={moreActive || moreOpen ? theme.primaryDark : theme.muted}
                size={22}
                strokeWidth={moreActive || moreOpen ? 2.2 : 1.8}
              />
            </View>
          </PressableScale>
        </View>
      </View>
    </>
  );
}

const navStyles = StyleSheet.create({
  closeButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  bar: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    bottom: 0,
    elevation: 24,
    left: 0,
    paddingTop: 10,
    position: 'absolute',
    right: 0,
    shadowOffset: { height: -8, width: 0 },
    shadowOpacity: 0.38,
    shadowRadius: 28,
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  item: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  moreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  moreIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  moreItem: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexBasis: '47%',
    flexDirection: 'row',
    flexGrow: 1,
    gap: spacing.sm,
    height: 54,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
  },
  moreLabel: {
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 12,
  },
  moreSheet: {
    borderRadius: radius.xl,
    borderWidth: 1,
    elevation: 28,
    gap: spacing.md,
    left: spacing.md,
    overflow: 'hidden',
    padding: spacing.md,
    position: 'absolute',
    right: spacing.md,
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.46,
    shadowRadius: 32,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 56,
    paddingHorizontal: spacing.md,
  },
  scrim: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheetHandle: {
    alignSelf: 'center',
    borderRadius: radius.pill,
    height: 4,
    opacity: 0.8,
    width: 42,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sheetSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 2,
  },
  sheetTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
});
