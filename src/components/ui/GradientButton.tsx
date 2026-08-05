import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { useAppTheme } from '@/theme/colors';
import { useAppGradients } from '@/theme/gradients';
import { radius } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

type IconComponent = React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

export function GradientButton({
  children,
  icon: Icon,
  disabled,
  onPress,
  style,
  variant = 'default',
}: {
  children: React.ReactNode;
  icon?: IconComponent;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'reference';
}) {
  const theme = useAppTheme();
  const gradients = useAppGradients();
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
    if (!disabled) onPress?.();
  };

  const buttonColors = gradients.primaryButton;
  const foreground = theme.primaryDark;

  return (
    <PressableScale accessibilityRole="button" accessibilityState={{ disabled: Boolean(disabled) }} disabled={disabled} haptic={false} onPress={handlePress} scaleTo={0.97} style={[style, disabled ? styles.disabled : null]}>
      <LinearGradient colors={buttonColors} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={styles.button}>
        {Icon ? <Icon color={foreground} size={18} strokeWidth={2.4} /> : null}
        <Text style={[styles.label, { color: foreground }]}>{children}</Text>
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: 8,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  disabled: {
    opacity: 0.48,
  },
  label: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
});
