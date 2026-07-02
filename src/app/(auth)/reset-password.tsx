import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';

import { BrandLogo, enterUp, FormErrorBanner, FormField, GradientButton, Screen, StatusBadge } from '@/components/ui';
import { getErrorMessage } from '@/lib/api/client';
import { useResetPasswordMutation } from '@/lib/api/hooks';
import { useAppTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

export default function ResetPasswordScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();
  const resetPassword = useResetPasswordMutation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  const handleReset = () => {
    if (!token || password !== confirmPassword) return;
    resetPassword.mutate(
      { token, password },
      {
        onSuccess: () => router.replace('/(auth)/login'),
      },
    );
  };

  return (
    <Screen>
      <Animated.View entering={enterUp(0)}>
        <BrandLogo />
      </Animated.View>
      <Animated.View entering={enterUp(1)}>
        <Text style={[styles.title, { color: theme.foregroundStrong }]}>Choose a new password</Text>
        <Text style={[styles.copy, { color: theme.mutedLight }]}>This screen is ready for the future deep-link token flow.</Text>
      </Animated.View>
      <Animated.View entering={enterUp(2)} style={styles.form}>
        <StatusBadge label="Secure reset" tone="accent" />
        <FormField icon={Lock} label="New password" onChangeText={setPassword} placeholder="8+ characters" secure value={password} />
        <FormField icon={Lock} label="Confirm password" onChangeText={setConfirmPassword} placeholder="Repeat password" secure value={confirmPassword} />
        {!token ? <Text style={[styles.message, { color: theme.warning }]}>Open the reset link from your email to continue.</Text> : null}
        {password && confirmPassword && password !== confirmPassword ? <Text style={[styles.message, { color: theme.danger }]}>Passwords do not match.</Text> : null}
        {resetPassword.error ? <FormErrorBanner message={getErrorMessage(resetPassword.error)} /> : null}
        <GradientButton onPress={handleReset}>{resetPassword.isPending ? 'Updating...' : 'Update Password'}</GradientButton>
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
