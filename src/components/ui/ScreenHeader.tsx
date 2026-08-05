import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/colors';
import { fonts } from '@/theme/typography';

export function ScreenHeader({
  action,
  eyebrow,
  leadingAction,
  title,
}: {
  action?: React.ReactNode;
  eyebrow: string;
  leadingAction?: React.ReactNode;
  title: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.row}>
      {leadingAction}
      <View style={styles.copy}>
        <Text style={[styles.eyebrow, { color: theme.primary }]}>{eyebrow}</Text>
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
    fontSize: 10,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 25,
    letterSpacing: -0.35,
    lineHeight: 30,
  },
});
