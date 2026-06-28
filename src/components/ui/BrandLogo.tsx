import { StyleSheet, Text, View } from 'react-native';

import { BrandMark } from '@/components/ui/BrandMark';
import { useAppTheme } from '@/theme/colors';
import { fonts } from '@/theme/typography';

export function BrandLogo() {
  const theme = useAppTheme();

  return (
    <View style={styles.logo}>
      <BrandMark size={42} />
      <Text style={[styles.bets, { color: theme.primarySoft }]}>Bets</Text>
      <Text style={[styles.claw, { color: theme.accent }]}>Claw</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  bets: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
  },
  claw: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    marginLeft: -8,
  },
});
