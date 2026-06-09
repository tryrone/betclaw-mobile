import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

export function LiveDot({
  color = colors.danger,
  label,
  size = 7,
}: {
  color?: string;
  label?: string;
  size?: number;
}) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.out(Easing.quad) }), -1, false);
  }, [pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 1.4 }],
  }));

  return (
    <View style={styles.row}>
      <View style={[styles.anchor, { height: size * 2.6, width: size * 2.6 }]}>
        <Animated.View
          style={[
            styles.ring,
            { backgroundColor: color, borderRadius: size, height: size * 2, width: size * 2 },
            ringStyle,
          ]}
        />
        <View style={{ backgroundColor: color, borderRadius: size / 2, height: size, width: size }} />
      </View>
      {label ? <Text style={[styles.label, { color }]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  ring: {
    position: 'absolute',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
});
