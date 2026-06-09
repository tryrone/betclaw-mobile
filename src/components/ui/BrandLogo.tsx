import { StyleSheet, Text, View } from 'react-native';

import { BrandMark } from '@/components/ui/BrandMark';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

export function BrandLogo() {
  return (
    <View style={styles.logo}>
      <BrandMark size={42} />
      <Text style={styles.bets}>Bets</Text>
      <Text style={styles.claw}>Claw</Text>
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
    color: colors.primary,
    fontFamily: fonts.extraBold,
    fontSize: 22,
  },
  claw: {
    color: colors.accent,
    fontFamily: fonts.extraBold,
    fontSize: 22,
    marginLeft: -8,
  },
});
