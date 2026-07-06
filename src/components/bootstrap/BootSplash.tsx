import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Background } from '@/components/ui/Background';
import { BrandMark } from '@/components/ui/BrandMark';
import { useAppTheme } from '@/theme/colors';
import { fonts } from '@/theme/typography';

function LoadingDot({ delay, color }: { delay: number; color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 480, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 480, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + progress.value * 0.65,
    transform: [{ translateY: -progress.value * 5 }],
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

export function BootSplash({ label = 'Loading your matchday…' }: { label?: string }) {
  const theme = useAppTheme();

  const breathe = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    ring.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
  }, [breathe, ring]);

  const markStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.94 + breathe.value * 0.12 }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - ring.value),
    transform: [{ scale: 0.9 + ring.value * 1.1 }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + breathe.value * 0.35,
  }));

  return (
    <Background>
      <View style={styles.center}>
        <View style={styles.markWrap}>
          <Animated.View
            style={[
              styles.glow,
              { backgroundColor: theme.primaryGlowStrong },
              glowStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.ring,
              { borderColor: theme.primary },
              ringStyle,
            ]}
          />
          <Animated.View style={markStyle}>
            <BrandMark color={theme.primary} size={72} />
          </Animated.View>
        </View>

        <Text style={[styles.wordmark, { color: theme.primarySoft }]}>BetClaw</Text>

        <View style={styles.dots}>
          <LoadingDot color={theme.primary} delay={0} />
          <LoadingDot color={theme.primary} delay={160} />
          <LoadingDot color={theme.primary} delay={320} />
        </View>

        <Text style={[styles.label, { color: theme.mutedLight }]}>{label}</Text>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    flex: 1,
    gap: 20,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  dot: {
    borderRadius: 5,
    height: 9,
    width: 9,
  },
  dots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  glow: {
    borderRadius: 90,
    height: 180,
    position: 'absolute',
    width: 180,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  markWrap: {
    alignItems: 'center',
    height: 140,
    justifyContent: 'center',
    width: 140,
  },
  ring: {
    borderRadius: 60,
    borderWidth: 2,
    height: 120,
    position: 'absolute',
    width: 120,
  },
  wordmark: {
    fontFamily: fonts.extraBold,
    fontSize: 28,
    letterSpacing: 0.5,
  },
});
