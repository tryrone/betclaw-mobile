import { useRouter } from 'expo-router';
import { ArrowUpRight, ExternalLink } from '@/components/modern-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { FormBadges } from '@/components/ticket/FormBadges';
import { SelectionEvidence, SelectionOutcomeBadge, SelectionSummary } from './SelectionExplanation';
import { BottomSheet, PressableScale } from '@/components/ui';
import type { TicketDetail } from '@/lib/api/types';
import { formatDateTime, isRealUrl, openExternalUrl } from '@/lib/mobile-format';
import { formatTicketMarketLabel } from '@/lib/ticket-market-label';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

export type TicketLeg = TicketDetail['matches'][number];

/** The same recorded context is used when History expands evidence in its existing sheet. */
export function LegSelectionEvidence({ leg }: { leg: TicketLeg }) {
  const theme = useAppTheme();
  const citations = (leg?.citations ?? []).filter(citation => isRealUrl(citation.url));
  const contextNotes = [leg?.h2hSummary, leg?.keyFactors].filter((note): note is string => typeof note === 'string' && Boolean(note.trim()));
  const earlierNotes = !leg?.selectionDecision
    ? [...new Set([leg?.selectionReason, leg?.reason].filter((note): note is string => Boolean(note)))] : [];
  const hasContext = Boolean(leg?.homeForm || leg?.awayForm || contextNotes.length || citations.length || earlierNotes.length);
  const context = hasContext ? <View style={styles.stack}>
    {leg?.homeForm ? <View style={styles.form}><Text style={[styles.small, { color: theme.mutedLight }]}>Home form</Text><FormBadges value={leg.homeForm} /></View> : null}
    {leg?.awayForm ? <View style={styles.form}><Text style={[styles.small, { color: theme.mutedLight }]}>Away form</Text><FormBadges value={leg.awayForm} /></View> : null}
    {contextNotes.map((note, index) => <Text key={index} style={[styles.body, { color: theme.foreground }]}>{note}</Text>)}
    {earlierNotes.length ? <Text style={[styles.small, { color: theme.mutedLight }]}>Earlier match notes · not a validated decision trail</Text> : null}
    {earlierNotes.map((note, index) => <Text key={`earlier-${index}`} style={[styles.body, { color: theme.foreground }]}>{note}</Text>)}
    {citations.map(citation => <PressableScale key={citation.url} accessibilityRole="link" accessibilityLabel={citation.title ?? 'Open recorded source'}
      onPress={() => void openExternalUrl(citation.url)} style={[styles.action, { borderColor: theme.border, backgroundColor: theme.field }]}>
      <ExternalLink color={theme.primarySoft} size={18} /><Text style={[styles.link, { color: theme.primarySoft }]}>{citation.title ?? citation.url}</Text>
    </PressableScale>)}
  </View> : undefined;
  return <View style={styles.stack}>
    <SelectionEvidence key={leg.id} decision={leg.selectionDecision} context={context} />
      {leg.alternativeMarket && leg.alternativeReason ? <View style={[styles.alternative, { borderColor: theme.border }]}>
        <Text style={[styles.small, { color: theme.warning }]}>Research alternative · eligibility not verified</Text>
        <Text style={[styles.marketText, { color: theme.foregroundStrong }]}>{leg.alternativeMarket}</Text>
        <Text style={[styles.body, { color: theme.foreground }]}>{leg.alternativeReason}</Text>
      </View> : null}
  </View>;
}

/** One evidence sheet shared by Build, Fix and ticket details. */
export function LegDetailSheet({ leg, onClose }: { leg: TicketLeg | null; onClose: () => void }) {
  const router = useRouter();
  const theme = useAppTheme();
  const market = leg ? formatTicketMarketLabel({
    awayTeam: leg.awayTeam, homeTeam: leg.homeTeam, market: leg.market,
    platformSelectionId: leg.platformSelectionId, platformSpecifier: leg.platformSpecifier,
    selectionLabel: leg.selectionLabel, selectionReason: leg.selectionReason ?? leg.reason, selectionTeam: leg.selectionTeam,
  }) : '';
  return <BottomSheet onClose={onClose} title="Pick evidence" visible={Boolean(leg)}>
    {leg ? <ScrollView key={leg.id} contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={[styles.teams, { color: theme.foregroundStrong }]}>{leg.homeTeam} vs {leg.awayTeam}</Text>
      <SelectionOutcomeBadge decision={leg.selectionDecision} />
      <View style={[styles.market, { backgroundColor: theme.primarySubtle }]}>
        <Text style={[styles.marketText, { color: theme.foregroundStrong }]}>{market}</Text>
        <Text style={[styles.small, { color: theme.foreground }]}>{typeof leg.odds === 'number' && Number.isFinite(leg.odds) && leg.odds > 1 ? leg.odds.toFixed(2) : 'Unavailable'} odds</Text>
      </View>
      {leg.kickoffTime ? <Text style={[styles.small, { color: theme.mutedLight }]}>{formatDateTime(leg.kickoffTime)}</Text> : null}
      <SelectionSummary decision={leg.selectionDecision} presentation={leg.selectionPresentation} />
      <LegSelectionEvidence leg={leg} />
      {leg.fixtureId ? <PressableScale accessibilityRole="button" onPress={() => { onClose(); router.push(`/match/${leg.fixtureId}`); }}
        style={[styles.action, { borderColor: theme.border, backgroundColor: theme.field }]}>
        <Text style={[styles.link, { color: theme.primarySoft }]}>Open match details</Text><ArrowUpRight color={theme.primarySoft} size={18} />
      </PressableScale> : null}
    </ScrollView> : null}
  </BottomSheet>;
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  stack: { gap: spacing.md },
  teams: { fontFamily: fonts.display, fontSize: 20, lineHeight: 29 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 25 },
  small: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 21 },
  market: { borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignItems: 'center', justifyContent: 'space-between' },
  marketText: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 24, flexShrink: 1 },
  form: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignItems: 'center', justifyContent: 'space-between' },
  action: { minHeight: 48, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  link: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 22 },
  alternative: { borderTopWidth: 1, paddingTop: spacing.lg, gap: spacing.sm },
});
