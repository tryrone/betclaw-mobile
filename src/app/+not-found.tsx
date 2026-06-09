import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { GradientButton, Screen } from '@/components/ui';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

export default function NotFoundScreen() {
  return (
    <Screen scroll={false}>
      <Text style={styles.title}>Screen not found</Text>
      <Text style={styles.copy}>The BetClaw mobile screen you requested is not available.</Text>
      <Link asChild href="/(auth)/login">
        <GradientButton>Back to Login</GradientButton>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  copy: {
    color: colors.mutedLight,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 24,
  },
  title: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 30,
    marginTop: 60,
  },
});
