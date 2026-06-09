import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

export type BadgeTone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

const badgeColors: Record<BadgeTone, { backgroundColor: string; borderColor: string; color: string }> = {
  accent: { backgroundColor: colors.primaryMuted, borderColor: colors.borderAccent, color: colors.primary },
  danger: { backgroundColor: colors.dangerSoft, borderColor: 'rgba(248,113,113,0.35)', color: '#fca5a5' },
  neutral: { backgroundColor: colors.surface, borderColor: colors.border, color: '#c9d4d2' },
  success: { backgroundColor: colors.successSoft, borderColor: 'rgba(74,222,128,0.35)', color: '#86efac' },
  warning: { backgroundColor: colors.warningSoft, borderColor: 'rgba(251,191,36,0.35)', color: '#fde68a' },
};

export function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: BadgeTone;
}) {
  const palette = badgeColors[tone];

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
    minHeight: 30,
    paddingHorizontal: 11,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 28,
  },
});
