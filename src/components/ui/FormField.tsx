import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '@/theme/colors';
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
  return (
    <View style={styles.field}>
      <Icon color={colors.muted} size={18} strokeWidth={2} />
      <View style={styles.inputWrap}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={secure}
          style={styles.input}
          value={value}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    alignItems: 'center',
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 17,
  },
  input: {
    color: colors.foreground,
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
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
