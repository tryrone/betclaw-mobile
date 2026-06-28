import { Link } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';

import { BrandLogo, enterUp, FormField, GlassCard, GradientButton, Screen, StatusBadge } from '@/components/ui';
import { useAppTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

export default function ResetPasswordScreen() {
  const theme = useAppTheme();

  return (
    <Screen>
      <Animated.View entering={enterUp(0)}>
        <BrandLogo />
      </Animated.View>
      <Animated.View entering={enterUp(1)}>
        <Text style={[styles.title, { color: theme.foregroundStrong }]}>Choose a new password</Text>
        <Text style={[styles.copy, { color: theme.mutedLight }]}>This screen is ready for the future deep-link token flow.</Text>
      </Animated.View>
      <Animated.View entering={enterUp(2)}>
        <GlassCard>
          <StatusBadge label="Secure reset" tone="accent" />
          <FormField icon={Lock} label="New password" secure value="password123" />
          <FormField icon={Lock} label="Confirm password" secure value="password123" />
          <GradientButton>Update Password</GradientButton>
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
