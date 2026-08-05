import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScoreSyncAuthScreen } from '@/components/auth/ScoreSyncAuth';
import { FormErrorBanner, FormField, GradientButton } from '@/components/ui';
import { getErrorMessage } from '@/lib/api/client';
import { useResetPasswordMutation } from '@/lib/api/hooks';
import { useAppTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();
  const resetPassword = useResetPasswordMutation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
  const matches = Boolean(password) && password === confirmPassword;

  const handleReset = () => {
    if (!token || !matches) return;
    resetPassword.mutate({ token, password }, { onSuccess: () => router.replace('/(auth)/login') });
  };

  return (
    <ScoreSyncAuthScreen
      subtitle="Use at least eight characters. Your new password takes effect immediately."
      title="Choose a new password"
      footer={
        <Link href="/(auth)/login" asChild>
          <Pressable accessibilityRole="button" style={styles.footerLink}>
            <Text style={[styles.footerText, { color: theme.muted }]}>Return to <Text style={[styles.footerStrong, { color: theme.primary }]}>sign in</Text></Text>
          </Pressable>
        </Link>
      }>
      <View style={styles.form}>
        <FormField icon={Lock} label="New password" onChangeText={setPassword} placeholder="8+ characters" secure value={password} />
        <FormField icon={Lock} label="Confirm password" onChangeText={setConfirmPassword} placeholder="Repeat password" secure value={confirmPassword} />
        {!token ? <Text style={[styles.warning, { color: theme.warning }]}>Open the reset link from your email to continue.</Text> : null}
        {password && confirmPassword && !matches ? <Text style={[styles.error, { color: theme.danger }]}>Passwords do not match.</Text> : null}
        {resetPassword.error ? <FormErrorBanner message={getErrorMessage(resetPassword.error)} /> : null}
        <GradientButton disabled={resetPassword.isPending || !token || !matches || password.length < 8} onPress={handleReset} variant="reference">
          {resetPassword.isPending ? 'Updating...' : 'Update password'}
        </GradientButton>
      </View>
    </ScoreSyncAuthScreen>
  );
}

const styles = StyleSheet.create({
  error: { fontFamily: fonts.bold, fontSize: 12 },
  footerLink: { minHeight: 44, justifyContent: 'center' },
  footerStrong: { fontFamily: fonts.bold },
  footerText: { fontFamily: fonts.regular, fontSize: 13 },
  form: { gap: spacing.md },
  warning: { fontFamily: fonts.bold, fontSize: 12 },
});
