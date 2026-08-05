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

import { useAppTheme } from '@/theme/colors';
import { radius } from '@/theme/spacing';

export function ToggleSwitch({
  accessibilityLabel,
  disabled,
  onChange,
  value,
}: {
  accessibilityLabel?: string;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
  value?: boolean;
}) {
  const theme = useAppTheme();
  const [internalChecked, setInternalChecked] = useState(value ?? true);
  const checked = value ?? internalChecked;
  const progress = useDerivedValue(() => withSpring(checked ? 1 : 0, { damping: 17, stiffness: 280 }), [checked]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [theme.field, theme.primarySubtle]),
    borderColor: interpolateColor(progress.value, [0, 1], [theme.border, theme.selectionBorder]),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [theme.mutedLight, theme.primarySoft]),
    transform: [{ translateX: interpolate(progress.value, [0, 1], [0, 22]) }],
  }));

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      disabled={disabled}
      onPress={() => {
        if (Platform.OS !== 'web') {
          Haptics.selectionAsync().catch(() => undefined);
        }
        const next = !checked;
        setInternalChecked(next);
        onChange?.(next);
      }}
      style={[styles.pressTarget, disabled ? styles.disabled : null]}>
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
  pressTarget: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 56,
  },
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
