import { BlurView } from 'expo-blur';
import { Link, usePathname } from 'expo-router';
import { ArrowRightLeft, Bot, Menu as MenuIcon, Settings, Share2, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/PressableScale';
import { type AppTheme, useAppTheme, useThemeController } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

type ReferenceIconName = 'home' | 'fix' | 'wallet' | 'history';

const TAB_COUNT = 5;
const TAB_ROW_HORIZONTAL_PADDING = spacing.sm;
const ACTIVE_INDICATOR_WIDTH = 24;

const primaryItems = [
  { dockIndex: 0, href: '/(tabs)', activePaths: ['/', '/(tabs)'], icon: 'home', label: 'Home' },
  { dockIndex: 1, href: '/(tabs)/fix-ticket', activePaths: ['/fix-ticket'], icon: 'fix', label: 'Fix' },
  { dockIndex: 3, href: '/(tabs)/wallet', activePaths: ['/wallet'], icon: 'wallet', label: 'Wallet' },
  { dockIndex: 4, href: '/(tabs)/history', activePaths: ['/history'], icon: 'history', label: 'History' },
] as const satisfies readonly {
  activePaths: readonly string[];
  dockIndex: number;
  href: string;
  icon: ReferenceIconName;
  label: string;
}[];

const moreItems = [
  {
    description: 'Create a researched ticket with BetClaw AI',
    href: '/(tabs)/build-ticket',
    activePaths: ['/build-ticket'],
    icon: Bot,
    label: 'Build a ticket',
  },
  {
    description: 'Turn a bookmaker code into a BetClaw ticket',
    href: '/(tabs)/convert-ticket',
    activePaths: ['/convert-ticket'],
    icon: ArrowRightLeft,
    label: 'Convert ticket',
  },
  {
    description: 'Invite friends and view referral rewards',
    href: '/(tabs)/referrals',
    activePaths: ['/referrals'],
    icon: Share2,
    label: 'Referrals',
  },
  {
    description: 'Manage your profile, alerts and preferences',
    href: '/(tabs)/settings',
    activePaths: ['/settings'],
    icon: Settings,
    label: 'Profile & settings',
  },
] as const;

function normalizePath(pathname: string | null) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace('/(tabs)', '');
}

function isActive(pathname: string | null, activePaths: readonly string[]) {
  const normalized = normalizePath(pathname);
  return activePaths.some((path) => normalized === path || normalized.startsWith(`${path}/`));
}

function ReferenceTabIcon({ active, name, theme }: { active: boolean; name: ReferenceIconName; theme: AppTheme }) {
  const color = active ? theme.primary : theme.mutedLight;
  const common = {
    fill: 'none',
    stroke: color,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: active ? 2.6 : 1.7,
  };

  return (
    <Svg height={24} viewBox="0 0 24 24" width={24}>
      {name === 'home' ? (
        <>
          <Path {...common} d="M3.8 10.3 12 3.5l8.2 6.8v8.1a2.1 2.1 0 0 1-2.1 2.1H5.9a2.1 2.1 0 0 1-2.1-2.1z" />
          <Path {...common} d="M9.1 17.2h5.8" />
        </>
      ) : null}
      {name === 'fix' ? (
        <>
          <Path {...common} d="m12 3 1.5 3.5L17 8l-3.5 1.5L12 13l-1.5-3.5L7 8l3.5-1.5z" />
          <Path {...common} d="m6.1 12.3.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9z" />
          <Path {...common} d="m17.5 14 .8 1.8 1.7.7-1.7.7-.8 1.8-.7-1.8-1.8-.7 1.8-.7z" />
        </>
      ) : null}
      {name === 'wallet' ? (
        <>
          <Rect {...common} height="14.5" rx="3" width="18" x="3" y="5.5" />
          <Path {...common} d="M3.5 9h13.7A3.8 3.8 0 0 1 21 12.8v2.7h-5a3.3 3.3 0 0 1 0-6.5" />
          <Circle cx="16.1" cy="12.3" fill={color} r=".9" />
        </>
      ) : null}
      {name === 'history' ? (
        <>
          <Path {...common} d="M4.2 7.4A8.2 8.2 0 1 1 3.8 16" />
          <Path {...common} d="M4.2 3.8v3.8H8" />
          <Path {...common} d="M12 7.4v5l3.2 1.8" />
        </>
      ) : null}
    </Svg>
  );
}

function FocusJiggle({ active, children }: { active: boolean; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (!active || reduceMotion) {
      rotation.value = 0;
      return;
    }

    rotation.value = withSequence(
      withTiming(-5, { duration: 55 }),
      withTiming(5, { duration: 70 }),
      withTiming(-3, { duration: 60 }),
      withTiming(2, { duration: 55 }),
      withTiming(0, { duration: 60 }),
    );
  }, [active, reduceMotion, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotation.value}deg` }],
  }));

  return <Animated.View style={[styles.iconMotion, animatedStyle]}>{children}</Animated.View>;
}

function NavItem({
  active,
  href,
  icon,
  label,
  theme,
}: {
  active: boolean;
  href: string;
  icon: ReferenceIconName;
  label: string;
  theme: AppTheme;
}) {
  return (
    <Link href={href as never} asChild>
      <PressableScale
        accessibilityLabel={label}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        haptic
        scaleTo={0.94}
        style={StyleSheet.flatten(styles.item)}>
        <FocusJiggle active={active}>
          <ReferenceTabIcon active={active} name={icon} theme={theme} />
        </FocusJiggle>
      </PressableScale>
    </Link>
  );
}

export function DashboardBottomNav() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const theme = useAppTheme();
  const { mode } = useThemeController();
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [barWidth, setBarWidth] = useState(0);
  const bottomInset = insets.bottom;
  const moreActive = moreItems.some((item) => isActive(pathname, item.activePaths));
  const activeIndex = useMemo(
    () => (moreActive ? 2 : primaryItems.find((item) => isActive(pathname, item.activePaths))?.dockIndex ?? 0),
    [moreActive, pathname],
  );
  const animatedIndex = useSharedValue(activeIndex);
  const slotWidth = Math.max(0, (barWidth - TAB_ROW_HORIZONTAL_PADDING * 2) / TAB_COUNT);

  useEffect(() => {
    animatedIndex.value = reduceMotion
      ? withTiming(activeIndex, { duration: 0 })
      : withSpring(activeIndex, { damping: 22, mass: 0.72, stiffness: 235 });
  }, [activeIndex, animatedIndex, reduceMotion]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: animatedIndex.value * slotWidth }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    setBarWidth(event.nativeEvent.layout.width);
  };

  const renderPrimary = (dockIndex: number) => {
    const item = primaryItems.find((candidate) => candidate.dockIndex === dockIndex);
    if (!item) return null;
    return (
      <NavItem
        active={activeIndex === dockIndex}
        href={item.href}
        icon={item.icon}
        key={item.href}
        label={item.label}
        theme={theme}
      />
    );
  };

  return (
    <>
      <Modal transparent animationType="fade" visible={menuOpen} onRequestClose={() => setMenuOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel="Close dashboard navigation menu"
            onPress={() => setMenuOpen(false)}
            style={[styles.scrim, { backgroundColor: theme.overlay }]}
          />
          <BlurView
            intensity={72}
            tint={mode === 'dark' ? 'systemMaterialDark' : 'systemMaterialLight'}
            style={[
              styles.menuSheet,
              {
                backgroundColor: theme.panelElevated,
                borderColor: theme.borderStrong,
                bottom: bottomInset + 64,
                shadowColor: theme.shadow,
              },
            ]}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.borderStrong }]} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetTitle, { color: theme.foregroundStrong }]}>More tools</Text>
                <Text style={[styles.sheetSubtitle, { color: theme.muted }]}>Everything beyond matchday essentials</Text>
              </View>
              <PressableScale
                accessibilityLabel="Close menu"
                accessibilityRole="button"
                onPress={() => setMenuOpen(false)}
                style={[styles.closeButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <X color={theme.foreground} size={18} strokeWidth={1.9} />
              </PressableScale>
            </View>
            <View style={styles.menuList}>
              {moreItems.map((item, index) => {
                const active = isActive(pathname, item.activePaths);
                const Icon = item.icon;
                return (
                  <Link href={item.href as never} key={item.href} asChild>
                    <PressableScale
                      accessibilityLabel={item.label}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => setMenuOpen(false)}
                      style={StyleSheet.flatten([
                        styles.menuRow,
                        index < moreItems.length - 1
                          ? { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }
                          : null,
                      ])}>
                      <View style={[styles.menuIcon, { backgroundColor: active ? theme.primary : theme.surface, borderColor: active ? theme.primary : theme.border }]}>
                        <Icon color={active ? theme.primaryDark : theme.primarySoft} size={20} strokeWidth={1.8} />
                      </View>
                      <View style={styles.menuCopy}>
                        <Text style={[styles.menuLabel, { color: theme.foregroundStrong }]}>{item.label}</Text>
                        <Text numberOfLines={1} style={[styles.menuDescription, { color: theme.muted }]}>{item.description}</Text>
                      </View>
                    </PressableScale>
                  </Link>
                );
              })}
            </View>
          </BlurView>
        </View>
      </Modal>

      <View pointerEvents="box-none" style={styles.navHost}>
        <View
          onLayout={handleLayout}
          style={[styles.bar, { borderColor: theme.borderStrong, height: 56 + bottomInset }]}>
          <BlurView
            intensity={74}
            tint={mode === 'dark' ? 'systemThinMaterialDark' : 'systemThinMaterialLight'}
            style={[styles.blur, { backgroundColor: theme.tabBar }]}>
            {slotWidth > 0 ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.activeIndicator,
                  {
                    backgroundColor: theme.primary,
                    bottom: bottomInset + 5,
                    left: TAB_ROW_HORIZONTAL_PADDING + Math.max(0, (slotWidth - ACTIVE_INDICATOR_WIDTH) / 2),
                  },
                  indicatorStyle,
                ]}
              />
            ) : null}
            <View style={[styles.row, { paddingBottom: bottomInset }]}>
              {renderPrimary(0)}
              {renderPrimary(1)}
              <PressableScale
                accessibilityLabel="Open more tools"
                accessibilityRole="button"
                accessibilityState={{ expanded: menuOpen, selected: moreActive }}
                onPress={() => setMenuOpen(true)}
                scaleTo={0.94}
                style={styles.item}>
                <FocusJiggle active={moreActive}>
                  <MenuIcon
                    color={moreActive ? theme.primary : theme.mutedLight}
                    size={24}
                    strokeWidth={moreActive ? 2.7 : 1.7}
                  />
                </FocusJiggle>
              </PressableScale>
              {renderPrimary(3)}
              {renderPrimary(4)}
            </View>
          </BlurView>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  activeIndicator: {
    borderRadius: 2,
    height: 3,
    position: 'absolute',
    width: ACTIVE_INDICATOR_WIDTH,
  },
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    width: '100%',
  },
  blur: {
    flex: 1,
    overflow: 'hidden',
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  item: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    zIndex: 2,
  },
  iconMotion: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  menuCopy: {
    flex: 1,
    minWidth: 0,
  },
  menuDescription: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  menuIcon: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  menuLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  menuList: {
    marginTop: spacing.sm,
  },
  menuRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 68,
    paddingVertical: spacing.sm,
  },
  menuSheet: {
    borderRadius: radius.xl,
    borderWidth: 1,
    elevation: 30,
    left: spacing.md,
    overflow: 'hidden',
    padding: spacing.lg,
    position: 'absolute',
    right: spacing.md,
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
  },
  modalRoot: {
    flex: 1,
  },
  navHost: {
    alignItems: 'center',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: TAB_ROW_HORIZONTAL_PADDING,
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
    marginBottom: spacing.md,
    width: 46,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sheetSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
  sheetTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
  },
});
