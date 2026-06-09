import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import { colors } from '@/theme/colors';
import { radius } from '@/theme/spacing';

export function ProgressBar({
  delay = 250,
  tone = 'accent',
  value,
}: {
  delay?: number;
  tone?: 'accent' | 'warning' | 'success';
  value: number;
}) {
  const fillColor = tone === 'warning' ? colors.warning : tone === 'success' ? colors.success : colors.primary;
  const clamped = Math.max(0, Math.min(100, value));
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withSpring(clamped, { damping: 24, stiffness: 90 }));
  }, [clamped, delay, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { backgroundColor: fillColor }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    borderRadius: radius.pill,
    height: '100%',
  },
  track: {
    backgroundColor: 'rgba(255,255,255,0.11)',
    borderRadius: radius.pill,
    height: 8,
    overflow: 'hidden',
    width: '100%',
  },
});
