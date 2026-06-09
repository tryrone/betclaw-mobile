import { Link, useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { BrandMark, enterUp, GradientButton, Screen, StatusBadge } from '@/components/ui';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

function FloatingMark() {
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [float]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [0, -12]) }],
  }));

  return (
    <View style={styles.markWrap}>
      <View style={styles.markGlow} />
      <Animated.View style={floatStyle}>
        <BrandMark size={120} />
      </Animated.View>
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <Screen scroll={false}>
      <View style={styles.root}>
        <Animated.View entering={enterUp(0)} style={styles.topRow}>
          <StatusBadge label="BetClaw" tone="accent" />
          <StatusBadge label="Mobile MVP" />
        </Animated.View>

        <Animated.View entering={enterUp(1)}>
          <FloatingMark />
        </Animated.View>

        <View style={styles.bottom}>
          <Animated.View entering={enterUp(2)} style={styles.headlineRow}>
            <Text style={styles.title}>Step into the game.{'\n'}Own the win.</Text>
            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>⚽</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>🏆</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={enterUp(3)}>
            <Text style={styles.copy}>
              Join the action, make your moves, and claim your victory with AI-verified picks.
            </Text>
          </Animated.View>

          <Animated.View entering={enterUp(4)} style={styles.ctaBlock}>
            <GradientButton icon={ArrowRight} onPress={() => router.push('/(auth)/signup')}>
              Get Started
            </GradientButton>
            <Link href="/(auth)/login" asChild>
              <Pressable style={styles.centerLink}>
                <Text style={styles.link}>Already have an account? Sign in</Text>
              </Pressable>
            </Link>
          </Animated.View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bottom: {
    gap: spacing.lg,
  },
  centerLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chipText: {
    fontSize: 16,
  },
  copy: {
    color: colors.mutedLight,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 300,
  },
  ctaBlock: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  headlineRow: {
    gap: spacing.md,
  },
  link: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  markGlow: {
    backgroundColor: 'rgba(46,242,208,0.10)',
    borderRadius: radius.pill,
    height: 220,
    position: 'absolute',
    width: 220,
  },
  markWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  root: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 38,
    letterSpacing: 0,
    lineHeight: 44,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
