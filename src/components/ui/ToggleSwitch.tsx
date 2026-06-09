import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors } from '@/theme/colors';
import { radius } from '@/theme/spacing';

export function ToggleSwitch({
  onChange,
  value = true,
}: {
  onChange?: (value: boolean) => void;
  value?: boolean;
}) {
  const [checked, setChecked] = useState(value);
  const progress = useDerivedValue(() => withSpring(checked ? 1 : 0, { damping: 17, stiffness: 280 }), [checked]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['rgba(255,255,255,0.07)', colors.primary]),
    borderColor: interpolateColor(progress.value, [0, 1], ['rgba(255,255,255,0.10)', 'rgba(46,242,208,0.70)']),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['#c9d4d2', colors.primaryDark]),
    transform: [{ translateX: interpolate(progress.value, [0, 1], [0, 22]) }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      onPress={() => {
        if (Platform.OS !== 'web') {
          Haptics.selectionAsync().catch(() => undefined);
        }
        const next = !checked;
        setChecked(next);
        onChange?.(next);
      }}>
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  thumb: {
    borderRadius: radius.pill,
    height: 22,
    left: 3,
    position: 'absolute',
    top: 3,
    width: 22,
  },
  track: {
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 30,
    width: 52,
  },
});
