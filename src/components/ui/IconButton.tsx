import { StyleSheet } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/spacing';

type IconComponent = React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

export function IconButton({
  icon: Icon,
  label,
  onPress,
}: {
  icon: IconComponent;
  label: string;
  onPress?: () => void;
}) {
  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      scaleTo={0.9}
      style={styles.button}>
      <Icon color="#c9d4d2" size={18} strokeWidth={2} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
