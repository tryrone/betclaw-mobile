import { LinearGradient } from 'expo-linear-gradient';
import { Link, usePathname, useRouter } from 'expo-router';
import { ArrowRight, type LucideIcon } from 'lucide-react-native';
import { StyleProp, StyleSheet, Text, TextInput, View, ViewStyle, type TextInputProps } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { type BadgeTone, StatusBadge } from '@/components/ui/StatusBadge';
import { useAppTheme } from '@/theme/colors';
import { useAppGradients } from '@/theme/gradients';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

export function DashboardGlassCard({
  children,
  gradient,
  style,
}: {
  children: React.ReactNode;
  gradient?: 'card' | 'hero' | 'amberCard' | 'matchHero';
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useAppTheme();
  const gradients = useAppGradients();
  const cardStyle = [
    primitiveStyles.card,
    { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow },
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

export function DashboardSectionHeader({
  action,
  eyebrow,
  title,
  description,
}: {
  action?: React.ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={primitiveStyles.sectionHeader}>
      <View style={primitiveStyles.sectionCopy}>
        {eyebrow ? <Text style={[primitiveStyles.eyebrow, { color: theme.primary }]}>{eyebrow}</Text> : null}
        <Text style={[primitiveStyles.sectionTitle, { color: theme.foregroundStrong }]}>{title}</Text>
        {description ? <Text style={[primitiveStyles.sectionDescription, { color: theme.mutedLight }]}>{description}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function DashboardMetric({
  icon: Icon,
  label,
  value,
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={[primitiveStyles.metric, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {Icon ? (
        <View style={[primitiveStyles.metricIcon, { backgroundColor: theme.primarySubtle }]}>
          <Icon color={theme.primary} size={14} />
        </View>
      ) : null}
      <View style={primitiveStyles.metricCopy}>
        <Text adjustsFontSizeToFit numberOfLines={1} style={[primitiveStyles.metricValue, { color: theme.foregroundStrong }]}>
          {value}
        </Text>
        <Text numberOfLines={2} style={[primitiveStyles.metricLabel, { color: theme.muted }]}>
          {label}
        </Text>
      </View>
    </View>
  );
}

export function DashboardChip({
  active,
  count,
  icon: Icon,
  label,
  onPress,
}: {
  active?: boolean;
  count?: number;
  icon?: LucideIcon;
  label: string;
  onPress?: () => void;
}) {
  const theme = useAppTheme();

  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(active) }}
      onPress={onPress}
      scaleTo={0.97}
      style={[
        primitiveStyles.chip,
        {
          backgroundColor: active ? theme.primary : theme.surface,
          borderColor: active ? theme.primary : theme.border,
          shadowColor: theme.shadow,
        },
      ]}>
      {Icon ? <Icon color={active ? theme.primaryDark : theme.primary} size={15} /> : null}
      <Text numberOfLines={1} style={[primitiveStyles.chipLabel, { color: active ? theme.primaryDark : theme.mutedLight }]}>
        {label}
      </Text>
      {typeof count === 'number' ? (
        <View style={[primitiveStyles.chipCount, { backgroundColor: active ? 'rgba(2,17,15,0.12)' : 'rgba(0,0,0,0.24)' }]}>
          <Text style={[primitiveStyles.chipCountText, { color: active ? theme.primaryDark : theme.foregroundStrong }]}>{count}</Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

export function DashboardPillField({
  icon: Icon,
  onChangeText,
  placeholder,
  value,
  ...inputProps
}: {
  icon?: LucideIcon;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  value?: string;
} & Omit<TextInputProps, 'onChangeText' | 'placeholder' | 'value'>) {
  const theme = useAppTheme();

  return (
    <View style={[primitiveStyles.field, { backgroundColor: theme.field, borderColor: theme.border }]}>
      {Icon ? <Icon color={theme.mutedLight} size={17} /> : null}
      <TextInput
        {...inputProps}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        style={[primitiveStyles.input, { color: theme.foregroundStrong }]}
        value={value}
      />
    </View>
  );
}

export function DashboardButton({
  children,
  icon: Icon,
  iconChip,
  onPress,
  tone = 'primary',
  style,
}: {
  children: React.ReactNode;
  icon?: LucideIcon;
  /** Render the icon inside a trailing circular chip (reference-style CTA). */
  iconChip?: boolean;
  onPress?: () => void;
  tone?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useAppTheme();
  const primary = tone === 'primary';

  return (
    <PressableScale
      accessibilityRole="button"
      onPress={onPress}
      scaleTo={0.97}
      style={[
        primitiveStyles.button,
        {
          backgroundColor: primary ? theme.primary : theme.surface,
          borderColor: primary ? theme.primary : theme.border,
        },
        style,
      ]}>
      {Icon && !iconChip ? <Icon color={primary ? theme.primaryDark : theme.primary} size={16} /> : null}
      <Text style={[primitiveStyles.buttonText, { color: primary ? theme.primaryDark : theme.foregroundStrong }]}>{children}</Text>
      {Icon && iconChip ? (
        <View style={[primitiveStyles.buttonChip, { backgroundColor: primary ? 'rgba(0,0,0,0.16)' : theme.primarySubtle }]}>
          <Icon color={primary ? theme.primaryDark : theme.primary} size={14} />
        </View>
      ) : null}
    </PressableScale>
  );
}

export function DashboardOddsButton({
  label,
  onPress,
  selected,
  value,
}: {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  value: string;
}) {
  const theme = useAppTheme();

  return (
    <PressableScale
      accessibilityLabel={`${label} odds ${value}`}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      onPress={onPress}
      scaleTo={0.96}
      style={[
        primitiveStyles.odds,
        {
          backgroundColor: selected ? theme.primarySubtle : theme.surface,
          borderColor: selected ? theme.selectionBorder : theme.border,
        },
      ]}>
      <Text numberOfLines={1} style={[primitiveStyles.oddsLabel, { color: theme.muted }]}>{label}</Text>
      <Text numberOfLines={1} style={[primitiveStyles.oddsValue, { color: selected ? theme.primary : theme.foregroundStrong }]}>{value}</Text>
    </PressableScale>
  );
}

export function DashboardLinkButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const theme = useAppTheme();

  return (
    <Link href={href as any} asChild>
      <PressableScale
        accessibilityRole="button"
        style={StyleSheet.flatten([primitiveStyles.linkButton, { borderColor: theme.border, backgroundColor: theme.surface }])}>
        <Text style={[primitiveStyles.linkButtonText, { color: theme.foregroundStrong }]}>{label}</Text>
        <ArrowRight color={theme.primary} size={15} />
      </PressableScale>
    </Link>
  );
}

export function DashboardStatePanel({
  children,
  icon: Icon,
  title,
  tone = 'neutral',
}: {
  children?: React.ReactNode;
  icon?: LucideIcon;
  title: string;
  tone?: BadgeTone;
}) {
  const theme = useAppTheme();

  return (
    <View style={[primitiveStyles.statePanel, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
      {Icon ? <Icon color={tone === 'warning' ? theme.warning : theme.primary} size={28} /> : null}
      <Text style={[primitiveStyles.stateTitle, { color: theme.foregroundStrong }]}>{title}</Text>
      {children ? <Text style={[primitiveStyles.stateCopy, { color: theme.mutedLight }]}>{children}</Text> : null}
    </View>
  );
}

export { StatusBadge as DashboardStatusBadge };

export function useDashboardNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  return {
    pathname,
    push: (href: string) => router.push(href as any),
  };
}

const primitiveStyles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonChip: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  buttonText: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    overflow: 'hidden',
    padding: spacing.lg,
    shadowOffset: { height: 22, width: 0 },
    shadowOpacity: 0.34,
    shadowRadius: 34,
  },
  chip: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    gap: 7,
    height: 46,
    paddingHorizontal: spacing.md,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
  },
  chipCount: {
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  chipCountText: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  chipLabel: {
    fontFamily: fonts.extraBold,
    fontSize: 12,
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  field: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    height: 46,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    height: 42,
    padding: 0,
  },
  linkButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  linkButtonText: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  metric: {
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    minHeight: 88,
    minWidth: 0,
    padding: spacing.sm,
  },
  metricCopy: {
    flex: 1,
    minWidth: 0,
  },
  metricIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  metricLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.4,
    lineHeight: 13,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  odds: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 48,
    justifyContent: 'center',
    minWidth: 0,
  },
  oddsLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  oddsValue: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  sectionCopy: {
    flex: 1,
    minWidth: 0,
  },
  sectionDescription: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    lineHeight: 27,
  },
  stateCopy: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  statePanel: {
    alignItems: 'center',
    borderRadius: radius.xl,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 180,
    padding: spacing.xl,
  },
  stateTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
    textAlign: 'center',
  },
});
