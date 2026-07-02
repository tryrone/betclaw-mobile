import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/colors';
import { radius } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

export function formLetters(value?: string | null) {
  return (value ?? '')
    .replace(/[^WDLwdl]/g, '')
    .toUpperCase()
    .slice(0, 8)
    .split('');
}

/**
 * Renders a raw form string ("H-LWWWWW", "W-D-W-W-D") as colored W/D/L
 * circles instead of a wall of letters.
 */
export function FormBadges({ value }: { value?: string | null }) {
  const theme = useAppTheme();
  const letters = formLetters(value);

  if (letters.length === 0) {
    return <Text style={[badgeStyles.fallback, { color: theme.muted }]}>Pending</Text>;
  }

  return (
    <View style={badgeStyles.row}>
      {letters.map((letter, index) => {
        const color = letter === 'W' ? theme.success : letter === 'D' ? theme.warning : theme.danger;
        return (
          <View
            key={`${letter}-${index}`}
            style={[badgeStyles.pill, { backgroundColor: `${color}22`, borderColor: `${color}66` }]}>
            <Text style={[badgeStyles.letter, { color }]}>{letter}</Text>
          </View>
        );
      })}
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  fallback: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  letter: {
    fontFamily: fonts.extraBold,
    fontSize: 10,
  },
  pill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
});
