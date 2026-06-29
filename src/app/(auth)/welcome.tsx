import { useRouter } from 'expo-router';
import { ArrowRight, Check, Search, ShieldCheck, Ticket } from 'lucide-react-native';
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

import { BrandLogo, enterUp, PressableScale, ProgressBar, StatusBadge, TeamLogo } from '@/components/ui';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const slides = [
  {
    copy: 'Follow fixtures, live pressure, and confidence without turning discovery into an odds board.',
    title: 'Track matchday signals',
    visual: 'signals',
  },
  {
    copy: 'Spot verified trends, compare readiness, and keep the strongest insight visible at a glance.',
    title: 'Compare confidence quickly',
    visual: 'confidence',
  },
  {
    copy: 'Decode slips, compare risk, and keep your strongest ticket workflow in one calm mobile space.',
    title: 'Fix tickets faster',
    visual: 'tickets',
  },
] as const;

function SignalVisual() {
  const theme = useAppTheme();

  return (
    <View style={styles.visual}>
      <View
        style={[
          styles.layeredCard,
          styles.layeredBack,
          { backgroundColor: theme.panelElevated, borderColor: theme.border },
        ]}
      />
      <View style={[styles.matchPreviewCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
        <View style={styles.previewTop}>
          <Text style={[styles.previewLeague, { color: theme.foregroundStrong }]}>Premier League</Text>
          <StatusBadge label="Live" tone="danger" />
        </View>

        <View style={styles.previewTeams}>
          <View style={styles.previewTeam}>
            <TeamLogo name="Newcastle" size={48} />
            <Text numberOfLines={1} style={[styles.previewTeamName, { color: theme.foregroundStrong }]}>
              Newcastle
            </Text>
          </View>
          <View style={styles.previewScore}>
            <Text style={[styles.previewScoreText, { color: theme.foregroundStrong }]}>0 : 3</Text>
            <Text style={[styles.previewMeta, { color: theme.muted }]}>{"83'"}</Text>
          </View>
          <View style={styles.previewTeam}>
            <TeamLogo name="Chelsea" size={48} />
            <Text numberOfLines={1} style={[styles.previewTeamName, { color: theme.foregroundStrong }]}>
              Chelsea
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.floatingSignal, { backgroundColor: theme.card, borderColor: theme.selectionBorder, shadowColor: theme.shadow }]}>
        <View style={styles.previewTop}>
          <Text style={[styles.previewKicker, { color: theme.muted }]}>Away pressure</Text>
          <Text style={[styles.previewValue, { color: theme.primarySoft }]}>86%</Text>
        </View>
        <ProgressBar value={86} />
      </View>
    </View>
  );
}

function ConfidenceVisual() {
  const theme = useAppTheme();
  const rows = [
    { label: 'Shot control', value: 82 },
    { label: 'Data readiness', value: 76 },
    { label: 'Risk clarity', value: 68 },
  ];

  return (
    <View style={styles.visual}>
      <View style={[styles.searchBubble, { backgroundColor: theme.field, borderColor: theme.border }]}>
        <Search color={theme.muted} size={17} />
        <Text style={[styles.searchText, { color: theme.muted }]}>Premier League signals</Text>
      </View>

      <View style={[styles.analystCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
        <View style={styles.analystHeader}>
          <View style={[styles.analystAvatar, { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }]}>
            <ShieldCheck color={theme.primarySoft} size={22} />
          </View>
          <View style={styles.analystCopy}>
            <Text style={[styles.analystTitle, { color: theme.foregroundStrong }]}>Verified analysis</Text>
            <Text style={[styles.previewMeta, { color: theme.muted }]}>3 ready signals</Text>
          </View>
          <StatusBadge label="Ready" tone="accent" />
        </View>

        {rows.map((row) => (
          <View key={row.label} style={styles.signalRow}>
            <View style={styles.signalRowTop}>
              <Text style={[styles.signalLabel, { color: theme.foreground }]}>{row.label}</Text>
              <Text style={[styles.signalValue, { color: theme.primarySoft }]}>{row.value}%</Text>
            </View>
            <ProgressBar value={row.value} />
          </View>
        ))}
      </View>
    </View>
  );
}

function TicketVisual() {
  const theme = useAppTheme();

  return (
    <View style={styles.visual}>
      <View style={[styles.orbit, { borderColor: theme.border }]}>
        <View style={[styles.orbitCore, { backgroundColor: theme.foregroundStrong, borderColor: theme.card }]}>
          <Text style={[styles.orbitScore, { color: theme.background }]}>86%</Text>
        </View>
        <View style={[styles.orbitNode, styles.orbitNodeLeft, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Check color={theme.success} size={20} />
        </View>
        <View style={[styles.orbitNode, styles.orbitNodeRight, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ticket color={theme.primarySoft} size={20} />
        </View>
        <View style={[styles.orbitNode, styles.orbitNodeBottom, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ShieldCheck color={theme.warning} size={20} />
        </View>
      </View>

      <View style={[styles.ticketMiniCard, { backgroundColor: theme.card, borderColor: theme.selectionBorder, shadowColor: theme.shadow }]}>
        <View style={styles.previewTop}>
          <Text style={[styles.previewKicker, { color: theme.muted }]}>Ticket trust</Text>
          <Text style={[styles.previewValue, { color: theme.primarySoft }]}>High</Text>
        </View>
        <Text style={[styles.ticketCopy, { color: theme.mutedLight }]}>2 kept legs, 1 risk removed</Text>
      </View>
    </View>
  );
}

function OnboardingVisual({ type }: { type: (typeof slides)[number]['visual'] }) {
  if (type === 'confidence') {
    return <ConfidenceVisual />;
  }

  if (type === 'tickets') {
    return <TicketVisual />;
  }

  return <SignalVisual />;
}

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
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.background,
          paddingBottom: Math.max(insets.bottom, spacing.md),
          paddingTop: insets.top + spacing.md,
        },
      ]}>
      <Animated.View entering={enterUp(0)} style={styles.topBar}>
        <BrandLogo markSize={34} textSize={22} />
        <PressableScale accessibilityLabel="Sign in" accessibilityRole="button" onPress={goToLogin} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: theme.muted }]}>Sign in</Text>
        </PressableScale>
      </Animated.View>

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
          <View key={slide.title} style={[styles.slide, { width }]}>
            <View style={styles.slideInner}>
              <Animated.View entering={enterUp(index + 1)}>
                <OnboardingVisual type={slide.visual} />
              </Animated.View>
              <View style={styles.copyBlock}>
                <Text style={[styles.title, { color: theme.foregroundStrong }]}>{slide.title}</Text>
                <Text style={[styles.copy, { color: theme.mutedLight }]}>{slide.copy}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Animated.View entering={enterUp(4)} style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((slide, index) => {
            const active = activeIndex === index;
            return (
              <View
                key={slide.title}
                style={[
                  styles.dot,
                  {
                    backgroundColor: active ? (isLast ? theme.primarySoft : theme.foregroundStrong) : theme.borderStrong,
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
          style={[
            styles.ctaButton,
            {
              backgroundColor: isLast ? theme.primarySoft : theme.foregroundStrong,
            },
          ]}>
          <Text style={[styles.ctaText, { color: isLast ? theme.primaryDark : theme.background }]}>
            {isLast ? 'Create account' : 'Next'}
          </Text>
          <ArrowRight color={isLast ? theme.primaryDark : theme.background} size={18} strokeWidth={2.6} />
        </PressableScale>
        {isLast ? (
          <PressableScale accessibilityLabel="Sign in instead" accessibilityRole="button" onPress={goToLogin} style={styles.secondaryAuthButton}>
            <Text style={[styles.secondaryAuthText, { color: theme.primarySoft }]}>Already have an account? Sign in</Text>
          </PressableScale>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  analystAvatar: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  analystCard: {
    borderRadius: 22,
    borderWidth: 1,
    elevation: 8,
    gap: spacing.md,
    left: 2,
    padding: spacing.md,
    position: 'absolute',
    right: 2,
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.11,
    shadowRadius: 32,
    top: 88,
  },
  analystCopy: {
    flex: 1,
    minWidth: 0,
  },
  analystHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  analystTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  carousel: {
    flex: 1,
  },
  copy: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 23,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  copyBlock: {
    paddingHorizontal: spacing.xs,
  },
  ctaButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 48,
    justifyContent: 'center',
    width: '100%',
  },
  ctaText: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  dot: {
    borderRadius: radius.pill,
    height: 7,
  },
  floatingSignal: {
    borderRadius: radius.lg,
    borderWidth: 1,
    bottom: 32,
    elevation: 7,
    padding: spacing.md,
    position: 'absolute',
    right: 6,
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    width: 188,
  },
  footer: {
    alignSelf: 'center',
    gap: spacing.md,
    maxWidth: 390,
    paddingHorizontal: spacing.xl,
    width: '100%',
  },
  layeredBack: {
    height: 168,
    left: 42,
    position: 'absolute',
    right: 28,
    top: 58,
    transform: [{ rotate: '6deg' }],
  },
  layeredCard: {
    borderRadius: 22,
    borderWidth: 1,
  },
  matchPreviewCard: {
    borderRadius: 22,
    borderWidth: 1,
    elevation: 9,
    left: 6,
    padding: spacing.md,
    position: 'absolute',
    right: 6,
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    top: 78,
    transform: [{ rotate: '-4deg' }],
  },
  orbit: {
    borderRadius: 999,
    borderWidth: 1,
    height: 240,
    left: 40,
    position: 'absolute',
    top: 38,
    width: 240,
  },
  orbitCore: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 9,
    height: 88,
    justifyContent: 'center',
    left: 75,
    position: 'absolute',
    top: 75,
    width: 88,
  },
  orbitNode: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 62,
    justifyContent: 'center',
    position: 'absolute',
    width: 62,
  },
  orbitNodeBottom: {
    bottom: -16,
    left: 88,
  },
  orbitNodeLeft: {
    left: -14,
    top: 82,
  },
  orbitNodeRight: {
    right: -14,
    top: 40,
  },
  orbitScore: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
  },
  pagination: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
  },
  previewKicker: {
    fontFamily: fonts.bold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  previewLeague: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  previewMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 3,
  },
  previewScore: {
    alignItems: 'center',
    flex: 1,
  },
  previewScoreText: {
    fontFamily: fonts.extraBold,
    fontSize: 34,
  },
  previewTeam: {
    alignItems: 'center',
    width: 82,
  },
  previewTeamName: {
    fontFamily: fonts.extraBold,
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  previewTeams: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  previewTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewValue: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  root: {
    flex: 1,
  },
  searchBubble: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 42,
    justifyContent: 'center',
    minWidth: 236,
    paddingHorizontal: spacing.md,
    position: 'absolute',
    top: 34,
  },
  searchText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  secondaryAuthButton: {
    alignItems: 'center',
    minHeight: 38,
    justifyContent: 'center',
  },
  secondaryAuthText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  signalLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  signalRow: {
    gap: spacing.xs,
  },
  signalRowTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signalValue: {
    fontFamily: fonts.extraBold,
    fontSize: 12,
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
    alignItems: 'center',
  },
  slideInner: {
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    maxWidth: 390,
    paddingHorizontal: spacing.xl,
    width: '100%',
  },
  ticketCopy: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  ticketMiniCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    bottom: 22,
    elevation: 7,
    left: 28,
    padding: spacing.md,
    position: 'absolute',
    right: 28,
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 36,
    letterSpacing: 0,
    lineHeight: 40,
    textAlign: 'center',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  visual: {
    alignSelf: 'center',
    height: 300,
    maxWidth: 340,
    position: 'relative',
    width: '100%',
  },
});
