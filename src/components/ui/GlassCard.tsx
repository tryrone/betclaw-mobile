import { LinearGradient } from 'expo-linear-gradient';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/theme/colors';
import { type GradientName, useAppGradients } from '@/theme/gradients';
import { radius, spacing } from '@/theme/spacing';

export function GlassCard({
  children,
  gradient,
  style,
}: {
  children: React.ReactNode;
  gradient?: GradientName;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useAppTheme();
  const gradients = useAppGradients();
  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.card,
      borderColor: theme.border,
      shadowColor: theme.shadow,
    },
    style,
  ];

  if (gradient) {
    return (
      <LinearGradient colors={gradients[gradient]} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={cardStyle}>
        {children}
      </LinearGradient>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    elevation: 5,
    gap: spacing.sm,
    padding: spacing.md,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.09,
    shadowRadius: 22,
  },
});
