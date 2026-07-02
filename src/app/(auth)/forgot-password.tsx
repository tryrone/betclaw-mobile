import { Link } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';

import { BrandLogo, enterUp, FormErrorBanner, FormField, GradientButton, Screen, StatusBadge, useToast } from '@/components/ui';
import { getErrorMessage } from '@/lib/api/client';
import { useForgotPasswordMutation } from '@/lib/api/hooks';
import { useAppTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

export default function ForgotPasswordScreen() {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const forgotPassword = useForgotPasswordMutation();
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!forgotPassword.data?.message) return;
    showToast({
      message: forgotPassword.data.message,
      title: 'Reset email sent',
      tone: 'success',
    });
  }, [forgotPassword.data?.message, showToast]);

  return (
    <Screen>
      <Animated.View entering={enterUp(0)}>
        <BrandLogo />
      </Animated.View>
      <Animated.View entering={enterUp(1)}>
        <Text style={[styles.title, { color: theme.foregroundStrong }]}>Reset your password</Text>
        <Text style={[styles.copy, { color: theme.mutedLight }]}>Enter your account email and BetClaw will send a reset link.</Text>
      </Animated.View>
      <Animated.View entering={enterUp(2)} style={styles.form}>
        <StatusBadge label="Email recovery" tone="accent" />
        <FormField icon={Mail} keyboardType="email-address" label="Email" onChangeText={setEmail} placeholder="you@example.com" value={email} />
        {forgotPassword.error ? <FormErrorBanner message={getErrorMessage(forgotPassword.error)} /> : null}
        <GradientButton onPress={() => forgotPassword.mutate({ email: email.trim() })}>
          {forgotPassword.isPending ? 'Sending...' : 'Send Reset Link'}
        </GradientButton>
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
  form: {
    gap: spacing.md,
  },
  link: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  message: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 18,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 29,
    lineHeight: 34,
  },
});
