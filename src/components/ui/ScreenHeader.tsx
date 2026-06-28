import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/colors';
import { fonts } from '@/theme/typography';

export function ScreenHeader({
  action,
  eyebrow,
  title,
}: {
  action?: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={[styles.eyebrow, { color: theme.muted }]}>{eyebrow}</Text>
        <Text numberOfLines={1} style={[styles.title, { color: theme.foregroundStrong }]}>
          {title}
        </Text>
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    letterSpacing: 0,
    lineHeight: 31,
  },
});
