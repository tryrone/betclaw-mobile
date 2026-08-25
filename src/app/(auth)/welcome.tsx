import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight } from '@/components/modern-icons';
import { useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ScoreSyncMatchPreview,
  ScoreSyncOrbit,
  scoreSyncColors,
} from '@/components/auth/ScoreSyncAuth';
import { BrandLogo, PressableScale } from '@/components/ui';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const slides = [
  {
    copy: 'Catch every fixture, live signal, and researched angle in one calm matchday workspace.',
    title: 'Never miss a moment with BetClaw',
  },
  {
    copy: 'See data readiness, recent form, and match context before you make a decision.',
    title: 'Know the match behind the market',
  },
  {
    copy: 'Build, convert, and improve tickets without losing the exact market you selected.',
    title: 'Move from insight to a stronger ticket',
  },
] as const;

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isLast = activeIndex === slides.length - 1;

  const goNext = () => {
    if (isLast) {
      router.replace('/(auth)/signup');
      return;
    }
    const next = activeIndex + 1;
    setActiveIndex(next);
    scrollRef.current?.scrollTo({ animated: true, x: width * next });
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pageWidth = event.nativeEvent.layoutMeasurement.width;
    setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / pageWidth));
  };

  return (
    <LinearGradient
      colors={theme.mode === 'light' ? ['#ffffff', '#f7f9ff', '#e8edff'] : [theme.background, theme.backgroundAlt, '#1a1e4d']}
      locations={[0, 0.54, 1]}
      style={styles.root}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <View style={styles.topBar}>
          <BrandLogo color={theme.mode === 'light' ? scoreSyncColors.navy : theme.foregroundStrong} markSize={32} textSize={20} />
          <PressableScale accessibilityLabel="Sign in" accessibilityRole="button" onPress={() => router.replace('/(auth)/login')} style={styles.signInButton}>
            <Text style={[styles.signInText, { color: theme.mode === 'light' ? scoreSyncColors.navy : theme.primarySoft }]}>Sign in</Text>
          </PressableScale>
        </View>

        <View style={styles.visualStage}>
          <ScoreSyncOrbit />
          <View style={styles.previewWrap}>
            <ScoreSyncMatchPreview />
          </View>
        </View>

        <ScrollView
          bounces={false}
          decelerationRate="fast"
          horizontal
          onMomentumScrollEnd={handleScrollEnd}
          pagingEnabled
          ref={scrollRef}
          showsHorizontalScrollIndicator={false}
          style={styles.copyCarousel}>
          {slides.map((slide) => (
            <View key={slide.title} style={[styles.slide, { width }]}>
              <Text style={[styles.title, { color: theme.foregroundStrong }]}>{slide.title}</Text>
              <Text style={[styles.copy, { color: theme.muted }]}>{slide.copy}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {slides.map((slide, index) => (
              <View
                key={slide.title}
                style={[
                  styles.dot,
                  { backgroundColor: index === activeIndex ? theme.primary : theme.borderStrong },
                  index === activeIndex ? styles.dotActive : null,
                ]}
              />
            ))}
          </View>
          <PressableScale
            accessibilityLabel={isLast ? 'Get started' : 'Continue onboarding'}
            accessibilityRole="button"
            onPress={goNext}
            style={[styles.cta, { backgroundColor: theme.primary }]}>
            <Text style={[styles.ctaText, { color: theme.primaryDark }]}>{isLast ? 'Get started' : 'Next'}</Text>
            <View style={styles.ctaIcon}>
              <ArrowRight color={theme.primaryDark} size={16} strokeWidth={2.3} />
            </View>
          </PressableScale>
          <Text style={[styles.legal, { color: theme.muted }]}>By continuing, you agree to BetClaw&apos;s Terms of Service and Privacy Policy.</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  copy: {
    color: scoreSyncColors.muted,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.md,
    maxWidth: 350,
    textAlign: 'center',
  },
  copyCarousel: {
    flexGrow: 0,
    maxHeight: 136,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: scoreSyncColors.navy,
    borderRadius: radius.md,
    flexDirection: 'row',
    height: 54,
    justifyContent: 'center',
    marginTop: spacing.lg,
    width: '100%',
  },
  ctaIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.md,
    width: 28,
  },
  ctaText: {
    color: scoreSyncColors.white,
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  dot: {
    backgroundColor: '#cfd2df',
    borderRadius: radius.pill,
    height: 6,
    width: 6,
  },
  dotActive: {
    backgroundColor: scoreSyncColors.navy,
    width: 22,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  legal: {
    color: '#777a8d',
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    marginTop: spacing.md,
    maxWidth: 320,
    textAlign: 'center',
  },
  pagination: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    height: 8,
  },
  previewWrap: {
    bottom: 4,
    left: spacing.xxl,
    position: 'absolute',
    right: spacing.xxl,
  },
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
  },
  signInButton: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  signInText: {
    color: scoreSyncColors.navy,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  slide: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  title: {
    color: scoreSyncColors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 27,
    letterSpacing: -0.4,
    lineHeight: 33,
    maxWidth: 350,
    textAlign: 'center',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
  },
  visualStage: {
    alignSelf: 'center',
    flex: 1,
    maxHeight: 400,
    minHeight: 300,
    overflow: 'hidden',
    width: '100%',
  },
});
