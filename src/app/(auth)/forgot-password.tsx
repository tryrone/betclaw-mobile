import { Link } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';

import { BrandLogo, enterUp, FormField, GlassCard, GradientButton, Screen, StatusBadge } from '@/components/ui';
import { useAppTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

export default function ForgotPasswordScreen() {
  const theme = useAppTheme();

  return (
    <Screen>
      <Animated.View entering={enterUp(0)}>
        <BrandLogo />
      </Animated.View>
      <Animated.View entering={enterUp(1)}>
        <Text style={[styles.title, { color: theme.foregroundStrong }]}>Reset your password</Text>
        <Text style={[styles.copy, { color: theme.mutedLight }]}>Enter your account email and BetClaw will send a reset link.</Text>
      </Animated.View>
      <Animated.View entering={enterUp(2)}>
        <GlassCard>
          <StatusBadge label="Email recovery" tone="accent" />
          <FormField icon={Mail} label="Email" value="tega@betsclaw.win" />
          <GradientButton>Send Reset Link</GradientButton>
        </GlassCard>
      </Animated.View>
      <Animated.View entering={enterUp(3)}>
        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.centerLink}>
            <Text style={[styles.link, { color: theme.primarySoft }]}>Back to sign in</Text>
          </Pressable>
        </Link>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerLink: {
    alignItems: 'center',
  },
  copy: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  link: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 29,
    lineHeight: 34,
  },
});
