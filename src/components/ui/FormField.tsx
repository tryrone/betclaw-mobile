import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppTheme } from '@/theme/colors';
import { radius } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

type IconComponent = React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

export function FormField({
  icon: Icon,
  label,
  placeholder,
  secure,
  value,
}: {
  icon: IconComponent;
  label: string;
  placeholder?: string;
  secure?: boolean;
  value?: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={[styles.field, { backgroundColor: theme.field, borderColor: theme.border }]}>
      <Icon color={theme.muted} size={18} strokeWidth={2} />
      <View style={styles.inputWrap}>
        <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          secureTextEntry={secure}
          style={[styles.input, { color: theme.foreground }]}
          value={value}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 15,
  },
  input: {
    fontFamily: fonts.bold,
    fontSize: 14,
    height: 26,
    padding: 0,
  },
  inputWrap: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
