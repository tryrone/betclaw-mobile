import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { GradientButton, Screen } from '@/components/ui';
import { useAppTheme } from '@/theme/colors';
import { fonts } from '@/theme/typography';

export default function NotFoundScreen() {
  const theme = useAppTheme();

  return (
    <Screen scroll={false}>
      <Text style={[styles.title, { color: theme.foregroundStrong }]}>Screen not found</Text>
      <Text style={[styles.copy, { color: theme.mutedLight }]}>The BetClaw mobile screen you requested is not available.</Text>
      <Link asChild href="/(auth)/login">
        <GradientButton>Back to Login</GradientButton>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  copy: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 24,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 30,
    marginTop: 60,
  },
});
