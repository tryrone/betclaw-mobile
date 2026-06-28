import { StyleSheet, Text, View } from 'react-native';

import { type AppTheme, useAppTheme } from '@/theme/colors';
import { radius } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

export type BadgeTone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

function badgeColors(theme: AppTheme): Record<BadgeTone, { backgroundColor: string; borderColor: string; color: string }> {
  return {
    accent: { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder, color: theme.primarySoft },
    danger: { backgroundColor: theme.dangerSoft, borderColor: theme.dangerSoft, color: theme.danger },
    neutral: { backgroundColor: theme.cardMuted, borderColor: theme.border, color: theme.mutedLight },
    success: { backgroundColor: theme.successSoft, borderColor: theme.successSoft, color: theme.success },
    warning: { backgroundColor: theme.warningSoft, borderColor: theme.warningSoft, color: theme.warning },
  };
}

export function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: BadgeTone;
}) {
  const theme = useAppTheme();
  const palette = badgeColors(theme)[tone];

  return (
    <View style={[styles.badge, { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor }]}>
      <Text style={[styles.label, { color: palette.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: 26,
    paddingHorizontal: 9,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 24,
  },
});
