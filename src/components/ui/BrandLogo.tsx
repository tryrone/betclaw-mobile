import { StyleSheet, Text, View } from 'react-native';

import { BrandMark } from '@/components/ui/BrandMark';
import { useAppTheme } from '@/theme/colors';
import { fonts } from '@/theme/typography';

export function BrandLogo({
  color,
  markSize = 42,
  textSize = 22,
}: {
  color?: string;
  markSize?: number;
  textSize?: number;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.logo}>
      <BrandMark color={color ?? theme.primarySoft} size={markSize} />
      <Text style={[styles.wordmark, { color: color ?? theme.primarySoft, fontSize: textSize }]}>BetClaw</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  wordmark: {
    fontFamily: fonts.extraBold,
    letterSpacing: 0,
  },
});
