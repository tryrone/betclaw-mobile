import { Link } from 'expo-router';
import { ArrowRight, ArrowRightLeft, Bot, ScanSearch } from '@/components/modern-icons';
import { StyleSheet, Text, View } from 'react-native';

import { DashboardGlassCard, PressableScale, Screen } from '@/components/ui';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const tools = [
  { href: '/(tabs)/build-ticket', Icon: Bot, title: 'Build a ticket', description: 'Create a researched ticket from verified fixtures and your preferred odds profile.' },
  { href: '/(tabs)/fix-ticket', Icon: ScanSearch, title: 'Fix a ticket', description: 'Review a bookmaker ticket and remove or replace weak legs with evidence.' },
  { href: '/(tabs)/convert-ticket', Icon: ArrowRightLeft, title: 'Convert a code', description: 'Translate a supported bookmaker code while preserving exact selection lineage.' },
] as const;

export default function ToolsScreen() {
  const theme = useAppTheme();
  return (
    <Screen hasTabs>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: theme.primary }]}>BETCLAW WORKBENCH</Text>
        <Text style={[styles.title, { color: theme.foregroundStrong }]}>Analysis tools</Text>
        <Text style={[styles.copy, { color: theme.mutedLight }]}>Build, repair and convert tickets without mixing these workflows into the prediction feed.</Text>
      </View>
      {tools.map(({ href, Icon, title, description }) => (
        <Link asChild href={href} key={title}>
          <PressableScale accessibilityLabel={title} accessibilityRole="button" scaleTo={0.98}>
            <DashboardGlassCard style={styles.card}>
              <View style={[styles.icon, { backgroundColor: theme.primarySubtle }]}><Icon color={theme.primary} size={23} /></View>
              <View style={styles.flex}><Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>{title}</Text><Text style={[styles.cardCopy, { color: theme.mutedLight }]}>{description}</Text></View>
              <ArrowRight color={theme.muted} size={20} />
            </DashboardGlassCard>
          </PressableScale>
        </Link>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, minHeight: 112 },
  cardCopy: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 4 },
  cardTitle: { fontFamily: fonts.display, fontSize: 17 },
  copy: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, marginTop: spacing.sm, maxWidth: 380 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.1 },
  flex: { flex: 1 },
  header: { paddingBottom: spacing.md, paddingTop: spacing.sm },
  icon: { alignItems: 'center', borderRadius: radius.lg, height: 52, justifyContent: 'center', width: 52 },
  title: { fontFamily: fonts.displayExtraBold, fontSize: 30, letterSpacing: -0.8, marginTop: 3 },
});
