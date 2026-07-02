import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowUpRight, Trophy, Volleyball } from 'lucide-react-native';
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
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo, enterUp, PressableScale } from '@/components/ui';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const heroImage = require('@/../assets/images/neymar_cutout.png');

const slides = [
  {
    copy: 'Join the action, make your moves and claim your victory.',
    titleLineOne: 'Step into the game',
    titleLineTwo: 'Own the win',
  },
  {
    copy: 'Follow fixtures, live pressure, and confidence at a glance.',
    titleLineOne: 'Track matchday',
    titleLineTwo: 'signals live',
  },
  {
    copy: 'Decode slips, compare risk, and keep your strongest ticket.',
    titleLineOne: 'Fix tickets',
    titleLineTwo: 'faster',
  },
] as const;

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isLast = activeIndex === slides.length - 1;

  const goToLogin = () => {
    router.replace('/(auth)/login');
  };

  const goToSignup = () => {
    router.replace('/(auth)/signup');
  };

  const goNext = () => {
    if (isLast) {
      goToSignup();
      return;
    }

    const nextIndex = activeIndex + 1;
    setActiveIndex(nextIndex);
    scrollRef.current?.scrollTo({ animated: true, x: width * nextIndex });
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pageWidth = event.nativeEvent.layoutMeasurement.width;
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    setActiveIndex(Math.max(0, Math.min(slides.length - 1, nextIndex)));
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.black }]}>
      <View pointerEvents="none" style={[styles.heroGlow, { backgroundColor: theme.primarySubtle }]} />
      <Image contentFit="contain" contentPosition="top center" source={heroImage} style={styles.hero} />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)', '#000000']}
        locations={[0.35, 0.62, 0.88]}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.md), paddingTop: insets.top + spacing.md }]}>
        <Animated.View entering={enterUp(0)} style={styles.topBar}>
          <BrandLogo markSize={34} textSize={22} />
          <PressableScale accessibilityLabel="Sign in" accessibilityRole="button" onPress={goToLogin} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: theme.mutedLight }]}>Sign in</Text>
          </PressableScale>
        </Animated.View>

        <View style={styles.spacer} />

        <ScrollView
          bounces={false}
          decelerationRate="fast"
          horizontal
          onMomentumScrollEnd={handleScrollEnd}
          pagingEnabled
          ref={scrollRef}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          style={styles.carousel}>
          {slides.map((slide, index) => (
            <View key={slide.titleLineOne} style={[styles.slide, { width }]}>
              <View style={styles.copyBlock}>
                <Text style={[styles.title, { color: theme.white }]}>{slide.titleLineOne}</Text>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, { color: theme.white }]}>{slide.titleLineTwo}</Text>
                  {index === 0 ? (
                    <View style={styles.emojiChips}>
                      <View style={[styles.emojiChip, { backgroundColor: 'rgba(255,255,255,0.10)' }]}>
                        <Volleyball color={theme.white} size={17} />
                      </View>
                      <View style={[styles.emojiChip, { backgroundColor: 'rgba(255,255,255,0.10)' }]}>
                        <Trophy color={theme.accent} size={17} />
                      </View>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.copy, { color: theme.mutedLight }]}>{slide.copy}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <Animated.View entering={enterUp(2)} style={styles.footer}>
          <View style={styles.pagination}>
            {slides.map((slide, index) => {
              const active = activeIndex === index;
              return (
                <View
                  key={slide.titleLineOne}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: active ? theme.primary : 'rgba(255,255,255,0.22)',
                      width: active ? 26 : 7,
                    },
                  ]}
                />
              );
            })}
          </View>

          <PressableScale
            accessibilityLabel={isLast ? 'Get started' : 'Next onboarding screen'}
            accessibilityRole="button"
            onPress={goNext}
            style={[styles.ctaButton, { backgroundColor: theme.primary }]}>
            <Text style={[styles.ctaText, { color: theme.primaryDark }]}>{isLast ? 'Get started' : 'Next'}</Text>
            <View style={[styles.ctaChip, { backgroundColor: 'rgba(0,0,0,0.14)' }]}>
              <ArrowUpRight color={theme.primaryDark} size={16} strokeWidth={2.4} />
            </View>
          </PressableScale>
        </Animated.View>

        {isLast ? (
          <PressableScale accessibilityLabel="Sign in instead" accessibilityRole="button" onPress={goToLogin} style={styles.secondaryAuthButton}>
            <Text style={[styles.secondaryAuthText, { color: theme.primarySoft }]}>Already have an account? Sign in</Text>
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carousel: {
    flexGrow: 0,
  },
  content: {
    flex: 1,
  },
  copy: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  copyBlock: {
    paddingHorizontal: spacing.xl,
  },
  ctaButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  ctaChip: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  ctaText: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  dot: {
    borderRadius: radius.pill,
    height: 7,
  },
  emojiChip: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  emojiChips: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  hero: {
    height: '64%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: '7%',
  },
  heroGlow: {
    alignSelf: 'center',
    borderRadius: 999,
    height: 420,
    opacity: 0.5,
    position: 'absolute',
    top: 60,
    width: 420,
  },
  pagination: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  root: {
    flex: 1,
  },
  secondaryAuthButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: 34,
  },
  secondaryAuthText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  skipButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  skipText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  slide: {
    justifyContent: 'flex-end',
  },
  spacer: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 34,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
});
