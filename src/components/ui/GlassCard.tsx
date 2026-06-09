import { LinearGradient } from 'expo-linear-gradient';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { gradients } from '@/theme/gradients';
import { radius, spacing } from '@/theme/spacing';

export function GlassCard({
  children,
  gradient,
  style,
}: {
  children: React.ReactNode;
  gradient?: keyof typeof gradients;
  style?: StyleProp<ViewStyle>;
}) {
  if (gradient) {
    return (
      <LinearGradient colors={gradients[gradient]} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={[styles.card, style]}>
        {children}
      </LinearGradient>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
});
