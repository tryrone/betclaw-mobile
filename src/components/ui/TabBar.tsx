import type { BottomTabBarProps } from 'expo-router/tabs';
import { Home, Compass, Ticket, Star, Menu } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/PressableScale';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

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
  const progress = useDerivedValue(() => withSpring(focused ? 1 : 0, { damping: 16, stiffness: 220 }), [focused]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.55 + progress.value * 0.45 }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -1 * progress.value }],
  }));

  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      scaleTo={0.9}
      style={styles.item}>
      <Animated.View style={[styles.halo, haloStyle]} />
      <Animated.View style={iconStyle}>
        <Icon color={focused ? colors.primaryDark : colors.muted} size={21} strokeWidth={2.4} />
      </Animated.View>
    </PressableScale>
  );
}

export function TabBar({
  navigation,
  state,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const activeRoute = state.routes[state.index].name;

  const handleNavigate = (routeName: string) => {
    navigation.navigate(routeName);
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        {/* Tab 1: Home */}
        <TabItem
          focused={activeRoute === 'index'}
          icon={Home}
          label="Home"
          onPress={() => handleNavigate('index')}
        />

        {/* Tab 2: Explore */}
        <TabItem
          focused={activeRoute === 'wallet'}
          icon={Compass}
          label="Explore"
          onPress={() => handleNavigate('wallet')}
        />

        {/* Tab 3: Tickets */}
        <TabItem
          focused={activeRoute === 'fix-ticket'}
          icon={Ticket}
          label="Tickets"
          onPress={() => handleNavigate('fix-ticket')}
        />

        {/* Tab 4: Favorites */}
        <TabItem
          focused={false}
          icon={Star}
          label="Favorites"
          onPress={() => {}}
        />

        {/* Tab 5: Menu */}
        <TabItem
          focused={activeRoute === 'settings'}
          icon={Menu}
          label="Menu"
          onPress={() => handleNavigate('settings')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    backgroundColor: 'rgba(13,14,15,0.95)',
    borderColor: '#202123',
    borderRadius: radius.pill,
    borderWidth: 1,
    elevation: 12,
    flexDirection: 'row',
    height: 64,
    justifyContent: 'space-between',
    maxWidth: 380,
    paddingHorizontal: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    width: '100%',
  },
  halo: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 44,
    position: 'absolute',
    width: 44,
  },
  item: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  wrap: {
    alignItems: 'center',
    left: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
  },
});
