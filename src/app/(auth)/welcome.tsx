import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowUpRight } from 'lucide-react-native';
import { View, StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { enterUp, PressableScale } from '@/components/ui';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const onboardingImage = require('@/../assets/images/neymar_onboarding.png');

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      {/* Background Image */}
      <Image
        source={onboardingImage}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />

      {/* Dark Overlay Mask */}
      <View style={styles.overlay} />

      {/* Content Container */}
      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 24) }]}>
        {/* Top Spacer */}
        <View style={styles.flex} />

        {/* Text and CTA Block */}
        <View style={styles.bottomBlock}>
          {/* Title and Emoji pill */}
          <Animated.View entering={enterUp(0)} style={styles.titleContainer}>
            <Text style={styles.title}>Step into the game</Text>
            <View style={styles.titleSecondRow}>
              <Text style={styles.title}>Own the win</Text>
              <View style={styles.emojiPill}>
                <Text style={styles.emoji}>⚽</Text>
                <Text style={styles.emoji}>🏆</Text>
              </View>
            </View>
          </Animated.View>

          {/* Description copy */}
          <Animated.View entering={enterUp(1)}>
            <Text style={styles.copy}>
              Join the action make your moves{'\n'}and claim your victory
            </Text>
          </Animated.View>

          {/* Footer: Pagination & CTA */}
          <Animated.View entering={enterUp(2)} style={styles.footerRow}>
            {/* Pagination Indicators */}
            <View style={styles.pagination}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={[styles.dot, styles.dotActive]} />
            </View>

            {/* Lime Green Button */}
            <PressableScale
              accessibilityLabel="Get started"
              accessibilityRole="button"
              onPress={() => router.push('/(tabs)')}
              style={styles.ctaButton}>
              <Text style={styles.ctaText}>Get started</Text>
              <ArrowUpRight color={colors.black} size={18} strokeWidth={2.6} />
            </PressableScale>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBlock: {
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  copy: {
    color: '#a0a8a5',
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  ctaButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  ctaText: {
    color: colors.black,
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  dot: {
    backgroundColor: '#3a3f3e',
    borderRadius: radius.pill,
    height: 6,
    width: 6,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  emoji: {
    fontSize: 15,
  },
  emojiPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'center',
    marginLeft: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)', // Gradient-like overlay from image
  },
  pagination: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  root: {
    backgroundColor: colors.black,
    flex: 1,
  },
  title: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 34,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  titleContainer: {
    gap: 2,
  },
  titleSecondRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});
