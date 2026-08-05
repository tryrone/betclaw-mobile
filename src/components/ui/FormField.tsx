import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colorPalettes, useAppTheme } from '@/theme/colors';
import { radius } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

type IconComponent = React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

export function FormField({
  autoCapitalize = 'none',
  keyboardType,
  icon: Icon,
  label,
  onChangeText,
  placeholder,
  secure,
  value,
  variant = 'default',
}: {
  icon: IconComponent;
  label: string;
  keyboardType?: TextInputProps['keyboardType'];
  onChangeText?: (value: string) => void;
  placeholder?: string;
  secure?: boolean;
  value?: string;
  variant?: 'default' | 'light';
  autoCapitalize?: TextInputProps['autoCapitalize'];
}) {
  const appTheme = useAppTheme();
  const theme = variant === 'light' ? colorPalettes.light : appTheme;

  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: theme.foregroundStrong }]}>{label}</Text>
      <View style={[styles.field, { backgroundColor: theme.field, borderColor: theme.border }]}>
        <Icon color={theme.muted} size={20} strokeWidth={2} />
        <TextInput
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.mutedLight}
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
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 15,
  },
  fieldGroup: {
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 16,
    height: 30,
    padding: 0,
  },
  label: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
});
