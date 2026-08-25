import { Link } from 'expo-router';
import { Mail } from '@/components/modern-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScoreSyncAuthScreen } from '@/components/auth/ScoreSyncAuth';
import { FormErrorBanner, FormField, GradientButton, useToast } from '@/components/ui';
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
    showToast({ message: forgotPassword.data.message, title: 'Reset email sent', tone: 'success' });
  }, [forgotPassword.data?.message, showToast]);

  return (
    <ScoreSyncAuthScreen
      subtitle="Enter your account email and we will send a secure link to choose a new password."
      title="Reset your password"
      footer={
        <Link href="/(auth)/login" asChild>
          <Pressable accessibilityRole="button" style={styles.footerLink}>
            <Text style={[styles.footerText, { color: theme.muted }]}>Remembered it? <Text style={[styles.footerStrong, { color: theme.primary }]}>Back to sign in</Text></Text>
          </Pressable>
        </Link>
      }>
      <View style={styles.form}>
        <FormField icon={Mail} keyboardType="email-address" label="Email" onChangeText={setEmail} placeholder="you@example.com" value={email} />
        {forgotPassword.error ? <FormErrorBanner message={getErrorMessage(forgotPassword.error)} /> : null}
        <GradientButton disabled={forgotPassword.isPending || !email.trim()} onPress={() => forgotPassword.mutate({ email: email.trim() })} variant="reference">
          {forgotPassword.isPending ? 'Sending...' : 'Send reset link'}
        </GradientButton>
        <Text style={[styles.helper, { color: theme.muted }]}>For your privacy, we show the same confirmation whether or not an account exists.</Text>
      </View>
    </ScoreSyncAuthScreen>
  );
}

const styles = StyleSheet.create({
  footerLink: { minHeight: 44, justifyContent: 'center' },
  footerStrong: { fontFamily: fonts.bold },
  footerText: { fontFamily: fonts.regular, fontSize: 13 },
  form: { gap: spacing.md },
  helper: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
