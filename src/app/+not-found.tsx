import { Link } from 'expo-router';
import { Compass, Home } from '@/components/modern-icons';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { enterUp, GlassCard, GradientButton, Screen, StatusBadge } from '@/components/ui';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

export default function NotFoundScreen() {
  const theme = useAppTheme();

  return (
    <Screen scroll={false}>
      <View style={styles.center}>
        <Animated.View entering={enterUp(0)} style={styles.cardWrap}>
          <GlassCard gradient="hero" style={styles.card}>
            <View style={[styles.icon, { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }]}>
              <Compass color={theme.primarySoft} size={30} strokeWidth={1.8} />
            </View>
            <StatusBadge label="404 · Offside" tone="accent" />
            <Text style={[styles.title, { color: theme.foregroundStrong }]}>That screen is out of play.</Text>
            <Text style={[styles.copy, { color: theme.mutedLight }]}>The page may have moved, or the link is no longer available.</Text>
            <Link asChild href="/(tabs)">
              <GradientButton icon={Home}>Back to Home</GradientButton>
            </Link>
          </GlassCard>
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: radius.xl,
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: 34,
  },
  cardWrap: {
    maxWidth: 420,
    width: '100%',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  copy: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  icon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 25,
    lineHeight: 30,
    textAlign: 'center',
  },
});
