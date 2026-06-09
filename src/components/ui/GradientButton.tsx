import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { colors } from '@/theme/colors';
import { gradients } from '@/theme/gradients';
import { radius } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

type IconComponent = React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

export function GradientButton({
  children,
  icon: Icon,
  onPress,
  style,
}: {
  children: React.ReactNode;
  icon?: IconComponent;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
    onPress?.();
  };

  return (
    <PressableScale accessibilityRole="button" haptic={false} onPress={handlePress} scaleTo={0.97} style={style}>
      <LinearGradient colors={gradients.primaryButton} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={styles.button}>
        {Icon ? <Icon color={colors.primaryDark} size={18} strokeWidth={2.4} /> : null}
        <Text style={styles.label}>{children}</Text>
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 8,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  label: {
    color: colors.primaryDark,
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
});
