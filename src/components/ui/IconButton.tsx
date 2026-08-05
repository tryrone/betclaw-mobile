import { StyleSheet } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { useAppTheme } from '@/theme/colors';
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
  const theme = useAppTheme();

  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      scaleTo={0.9}
      style={[styles.button, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Icon color={theme.foreground} size={18} strokeWidth={2} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    elevation: 0,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
