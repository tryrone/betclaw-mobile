import type { BottomTabBarProps } from 'expo-router/tabs';
import { Home, Ticket, UserRound, WalletCards } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/PressableScale';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

type IconComponent = React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

function TabItem({
  focused,
  icon: Icon,
  label,
  onPress,
}: {
  focused: boolean;
  icon: IconComponent;
  label: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const progress = useDerivedValue(() => withSpring(focused ? 1 : 0, { damping: 16, stiffness: 220 }), [focused]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.55 + progress.value * 0.45 }],
  }));

  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      scaleTo={0.9}
      style={styles.item}>
      <View style={styles.iconSlot}>
        <Animated.View style={[styles.halo, { backgroundColor: theme.primarySoft }, haloStyle]} />
        <Icon color={focused ? theme.primaryDark : theme.muted} size={20} strokeWidth={2.4} />
      </View>
      <Text numberOfLines={1} style={[styles.label, { color: focused ? theme.primarySoft : theme.muted }]}>
        {label}
      </Text>
    </PressableScale>
  );
}

export function TabBar({
  navigation,
  state,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();

  const activeRoute = state.routes[state.index].name;

  const handleNavigate = (routeName: string) => {
    navigation.navigate(routeName);
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.bar, { backgroundColor: theme.tabBar, borderColor: theme.border, shadowColor: theme.shadow }]}>
        <TabItem
          focused={activeRoute === 'index'}
          icon={Home}
          label="Home"
          onPress={() => handleNavigate('index')}
        />
        <TabItem
          focused={activeRoute === 'fix-ticket'}
          icon={Ticket}
          label="Fix"
          onPress={() => handleNavigate('fix-ticket')}
        />
        <TabItem
          focused={activeRoute === 'wallet'}
          icon={WalletCards}
          label="Wallet"
          onPress={() => handleNavigate('wallet')}
        />
        <TabItem
          focused={activeRoute === 'settings'}
          icon={UserRound}
          label="Profile"
          onPress={() => handleNavigate('settings')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    elevation: 12,
    flexDirection: 'row',
    height: 68,
    justifyContent: 'space-between',
    maxWidth: 300,
    paddingHorizontal: spacing.xs,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    width: '82%',
  },
  halo: {
    borderRadius: radius.pill,
    height: 32,
    left: 1,
    position: 'absolute',
    top: 1,
    width: 32,
  },
  iconSlot: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  item: {
    alignItems: 'center',
    borderRadius: radius.pill,
    gap: 3,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  label: {
    fontFamily: fonts.extraBold,
    fontSize: 10,
    lineHeight: 12,
  },
  wrap: {
    alignItems: 'center',
    left: spacing.md,
    position: 'absolute',
    right: spacing.md,
  },
});
