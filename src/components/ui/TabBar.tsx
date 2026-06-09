import type { BottomTabBarProps } from 'expo-router/tabs';
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
    transform: [{ translateY: -2 * progress.value }],
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
  descriptors,
  icons,
  navigation,
  state,
}: BottomTabBarProps & { icons: Record<string, IconComponent> }) {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const Icon = icons[route.name];

          if (!Icon) return null;

          return (
            <TabItem
              focused={focused}
              icon={Icon}
              key={route.key}
              label={label}
              onPress={() => {
                const event = navigation.emit({
                  canPreventDefault: true,
                  target: route.key,
                  type: 'tabPress',
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    backgroundColor: 'rgba(5,18,15,0.97)',
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    elevation: 12,
    flexDirection: 'row',
    height: 64,
    justifyContent: 'space-between',
    maxWidth: 380,
    paddingHorizontal: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    width: '100%',
  },
  halo: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 46,
    position: 'absolute',
    width: 46,
  },
  item: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  wrap: {
    alignItems: 'center',
    left: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
  },
});
