import { SelectionDecisionCard } from "./SelectionReviewPanel";
import { formatSelectionChance } from "@/lib/selection-display";
import { useRouter } from 'expo-router';
import { ArrowUpRight, ExternalLink, Sparkles } from '@/components/modern-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { FormBadges } from '@/components/ticket/FormBadges';
import { BottomSheet, PressableScale, StatusBadge } from '@/components/ui';
import type { TicketDetail } from '@/lib/api/types';
import { formatDateTime, isRealUrl, openExternalUrl } from '@/lib/mobile-format';
import { formatTicketMarketLabel } from '@/lib/ticket-market-label';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

export type TicketLeg = TicketDetail['matches'][number];

function legTone(status?: string) {
  if (status === 'KEPT') return 'success' as const;
  if (status === 'REMOVED') return 'danger' as const;
  return 'neutral' as const;
}

function legStatusLabel(status?: string) {
  if (status === 'NO_BET') return 'Not picked';
  return status ?? 'Leg';
}

/**
 * Web-parity "Evidence Behind This Estimate" sheet for a single ticket leg:
 * pick/confidence reasoning, odds/confidence/readiness tiles, forms, H2H,
 * key factors, alternative angle, and verified citations.
 */
export function LegDetailSheet({ leg, onClose }: { leg: TicketLeg | null; onClose: () => void }) {
  const router = useRouter();
  const theme = useAppTheme();
  const readiness = leg?.dataReadiness;
  const citations = (leg?.citations ?? []).filter((citation) => isRealUrl(citation.url));
  const recommendedPick = leg
    ? formatTicketMarketLabel({
        awayTeam: leg.awayTeam,
        homeTeam: leg.homeTeam,
        market: leg.market,
        platformSelectionId: leg.platformSelectionId,
        platformSpecifier: leg.platformSpecifier,
        selectionLabel: leg.selectionLabel,
        selectionReason: leg.selectionReason ?? leg.reason,
        selectionTeam: leg.selectionTeam,
      })
    : null;

  const insights = [
    leg?.h2hSummary ? { label: 'H2H', value: String(leg.h2hSummary).replace(/^H2H:\s*/i, '') } : null,
    leg?.keyFactors ? { label: 'Key factors', value: String(leg.keyFactors) } : null,
  ].filter((line): line is { label: string; value: string } => Boolean(line));
  const hasFormData = Boolean(leg?.homeForm || leg?.awayForm);

  const openMatch = () => {
    if (!leg?.fixtureId) return;
    onClose();
    router.push(`/match/${leg.fixtureId}` as any);
  };

  return (
    <BottomSheet onClose={onClose} title="Leg details" visible={Boolean(leg)}>
      {leg ? (
        <ScrollView contentContainerStyle={sheetStyles.content} showsVerticalScrollIndicator={false}>
          <View style={sheetStyles.headerRow}>
            <Text style={[sheetStyles.teams, { color: theme.foregroundStrong }]}>
              {leg.homeTeam} vs {leg.awayTeam}
            </Text>
            <StatusBadge label={legStatusLabel(leg.status)} tone={legTone(leg.status)} />
          </View>
          <View style={sheetStyles.marketRow}>
            <View style={[sheetStyles.marketChip, { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }]}>
              <Text numberOfLines={2} style={[sheetStyles.marketText, { color: theme.foregroundStrong }]}>{recommendedPick}</Text>
            </View>
            {leg.kickoffTime ? (
              <Text style={[sheetStyles.kickoff, { color: theme.muted }]}>{formatDateTime(leg.kickoffTime)}</Text>
            ) : null}
          </View>

          <View style={sheetStyles.tileRow}>
            <View style={[sheetStyles.tile, { backgroundColor: theme.field, borderColor: theme.border }]}>
              <Text style={[sheetStyles.tileLabel, { color: theme.muted }]}>Odds</Text>
              <Text adjustsFontSizeToFit numberOfLines={1} style={[sheetStyles.tileValue, { color: theme.foregroundStrong }]}>
                {typeof leg.odds === 'number' ? leg.odds.toFixed(2) : '-'}
              </Text>
            </View>
            <View style={[sheetStyles.tile, { backgroundColor: theme.field, borderColor: theme.border }]}>
              <Text style={[sheetStyles.tileLabel, { color: theme.muted }]}>Estimated win chance</Text>
              <Text adjustsFontSizeToFit numberOfLines={1} style={[sheetStyles.tileValue, { color: theme.foregroundStrong }]}>
                {formatSelectionChance(leg.selectionDecision)}
              </Text>
            </View>
            <View style={[sheetStyles.tile, { backgroundColor: theme.field, borderColor: theme.border }]}>
              <Text style={[sheetStyles.tileLabel, { color: theme.muted }]}>Readiness</Text>
              <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={[
                  sheetStyles.tileValue,
                  { color: /ready/i.test(readiness?.status ?? '') ? theme.primary : theme.warning },
                ]}>
                {readiness?.status ?? 'Pending'}
                {typeof readiness?.score === 'number' ? ` ${Math.round(readiness.score)}%` : ''}
              </Text>
            </View>
          </View>

          <SelectionDecisionCard decision={leg.selectionDecision} />
          {leg.selectionReason ?? leg.reason ? (
            <View style={sheetStyles.block}>
              <Text style={[sheetStyles.blockLabel, { color: theme.muted }]}>Why this pick</Text>
              <Text style={[sheetStyles.blockCopy, { color: theme.foreground }]}>{leg.selectionReason ?? leg.reason}</Text>
            </View>
          ) : null}
          {leg.confidenceReason ? (
            <View style={sheetStyles.block}>
              <Text style={[sheetStyles.blockLabel, { color: theme.muted }]}>Evidence assessment</Text>
              <Text style={[sheetStyles.blockCopy, { color: theme.foreground }]}>{leg.confidenceReason}</Text>
            </View>
          ) : null}

          {hasFormData || insights.length > 0 ? (
            <View style={[sheetStyles.insightBox, { backgroundColor: theme.field, borderColor: theme.border }]}>
              {leg?.homeForm ? (
                <View style={sheetStyles.insightFormRow}>
                  <Text style={[sheetStyles.insightLabel, { color: theme.muted }]}>Home form</Text>
                  <FormBadges value={leg.homeForm} />
                </View>
              ) : null}
              {leg?.awayForm ? (
                <View style={sheetStyles.insightFormRow}>
                  <Text style={[sheetStyles.insightLabel, { color: theme.muted }]}>Away form</Text>
                  <FormBadges value={leg.awayForm} />
                </View>
              ) : null}
              {insights.map((line) => (
                <Text key={line.label} style={[sheetStyles.insightLine, { color: theme.mutedLight }]}>
                  <Text style={[sheetStyles.insightLabel, { color: theme.muted }]}>{line.label}: </Text>
                  {line.value}
                </Text>
              ))}
            </View>
          ) : null}

          {leg.alternativeMarket && leg.alternativeReason ? (
            <View style={[sheetStyles.altBlock, { backgroundColor: theme.warningSoft, borderColor: theme.warningSoft }]}>
              <View style={sheetStyles.altHeader}>
                <Sparkles color={theme.warning} size={13} />
                <Text style={[sheetStyles.altTitle, { color: theme.warning }]}>Research alternative — eligibility not verified</Text>
                {typeof leg.alternativeConfidence === 'number' ? (
                  <Text style={[sheetStyles.altMeta, { color: theme.warning }]}>Unavailable</Text>
                ) : null}
                {typeof leg.alternativeOdds === 'number' ? (
                  <Text style={[sheetStyles.altMeta, { color: theme.warning }]}>Odds {leg.alternativeOdds.toFixed(2)}</Text>
                ) : null}
              </View>
              <Text style={[sheetStyles.blockCopy, { color: theme.foregroundStrong }]}>{leg.alternativeMarket}</Text>
              <Text style={[sheetStyles.blockCopy, { color: theme.mutedLight }]}>{leg.alternativeReason}</Text>
            </View>
          ) : null}

          {citations.length > 0 ? (
            <View style={sheetStyles.block}>
              <Text style={[sheetStyles.blockLabel, { color: theme.muted }]}>Verified evidence</Text>
              {citations.slice(0, 4).map((citation) => (
                <PressableScale
                  accessibilityLabel={citation.title ?? 'Open source'}
                  accessibilityRole="link"
                  key={citation.url}
                  onPress={() => void openExternalUrl(citation.url)}
                  style={[sheetStyles.citationPill, { backgroundColor: theme.field, borderColor: theme.border }]}>
                  <ExternalLink color={theme.primarySoft} size={13} />
                  <Text numberOfLines={1} style={[sheetStyles.citationText, { color: theme.foreground }]}>
                    {citation.title ?? citation.url}
                  </Text>
                </PressableScale>
              ))}
            </View>
          ) : null}

          {leg.fixtureId ? (
            <PressableScale
              accessibilityLabel="Open match details"
              accessibilityRole="button"
              onPress={openMatch}
              style={[sheetStyles.matchButton, { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }]}>
              <Text style={[sheetStyles.matchButtonText, { color: theme.primary }]}>Open match details</Text>
              <ArrowUpRight color={theme.primary} size={16} />
            </PressableScale>
          ) : null}
        </ScrollView>
      ) : null}
    </BottomSheet>
  );
}

const sheetStyles = StyleSheet.create({
  altBlock: {
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 4,
    padding: spacing.md,
  },
  altHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  altMeta: {
    fontFamily: fonts.bold,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  altTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  block: {
    gap: spacing.xs,
  },
  blockCopy: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  blockLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  citationPill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 34,
    paddingHorizontal: spacing.sm,
  },
  citationText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
    paddingTop: spacing.xs,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  insightBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  insightFormRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  insightLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  insightLine: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
  },
  kickoff: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  marketChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    maxWidth: '60%',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  marketRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  marketText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  matchButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 44,
  },
  matchButtonText: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  teams: {
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    lineHeight: 22,
  },
  tile: {
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    minWidth: 0,
    padding: spacing.md,
  },
  tileLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tileRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tileValue: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
});
