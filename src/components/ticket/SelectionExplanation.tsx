import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ChevronRight, Plus, Minus } from '@/components/modern-icons';
import { BottomSheet, useInsideBottomSheet } from '@/components/ui/BottomSheet';
import { PressableScale } from '@/components/ui/PressableScale';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  formatSelectionChance, formatSelectionReturn, selectionCheckLabel, selectionCopy,
  selectionEvidenceSources, selectionOutcomeLabel, selectionReasonTitle,
  type SelectionDecision, type SelectionPresentation, type RecordedSelectionReason,
} from '@/lib/selection-display';
import { useAppTheme } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';

export type SelectionExplanationProps = {
  recorded?: RecordedSelectionReason | null;
  decision?: SelectionDecision | null;
  presentation?: SelectionPresentation | null;
};

function recordedTime(value?: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Unavailable';
  return new Date(value).toLocaleString();
}

export function SelectionOutcomeBadge({ decision }: SelectionExplanationProps) {
  return <StatusBadge label={selectionOutcomeLabel(decision?.outcome)} tone={
    decision?.outcome === 'SELECTED' ? 'success' : decision?.outcome === 'REJECTED' ? 'danger'
      : decision?.outcome === 'QUALIFIED_NOT_SELECTED' ? 'neutral' : 'warning'
  } />;
}

/** Compact, shared first layer. Probability appears exactly once on this surface. */
export function SelectionSummary({ decision, presentation, recorded }: SelectionExplanationProps) {
  const theme = useAppTheme();
  const { fontScale, width } = useWindowDimensions();
  const stacked = width < 360 || fontScale > 1.2;
  const copy = selectionCopy(decision, presentation, recorded);
  const unavailable = formatSelectionChance(decision) === 'Unavailable';
  const quality = decision?.evidenceQuality ?? 'Unavailable';
  const evidenceLabel = quality === 'Complete' ? 'Required evidence checks complete'
    : quality === 'Partial' ? 'Required evidence incomplete' : 'No complete evidence record';
  return <View style={styles.stack}>
    <View style={[styles.metrics, { borderColor: theme.border }, stacked ? styles.stackedMetrics : null]}>
      <View style={[styles.metric, stacked ? { flexBasis: 'auto' } : null]}>
        <Text style={[styles.label, { color: theme.mutedLight }]}>Estimated win chance</Text>
        <Text style={[unavailable ? styles.unavailable : styles.probability, { color: theme.foregroundStrong }]}>{formatSelectionChance(decision)}</Text>
      </View>
      <View style={[styles.metric, stacked ? { flexBasis: 'auto' } : null]}>
        <Text style={[styles.label, { color: theme.mutedLight }]}>Evidence quality</Text>
        <Text style={[styles.subheading, { color: theme.foregroundStrong }]}>{quality}</Text>
        <Text style={[styles.small, { color: theme.mutedLight }]}>{evidenceLabel}</Text>
      </View>
    </View>
    <View style={styles.copyBlock}>
      <Text accessibilityRole="header" style={[styles.subheading, { color: theme.foregroundStrong }]}>{selectionReasonTitle(decision?.outcome)}</Text>
      <Text style={[styles.body, { color: theme.foreground }]}>{copy.summary}</Text>
    </View>
    <View style={[styles.risk, { borderColor: theme.warning }]}>
      <Text style={[styles.subheading, { color: theme.foregroundStrong }]}>Main limitation</Text>
      <Text style={[styles.small, { color: theme.mutedLight }]}>{copy.risk}</Text>
    </View>
  </View>;
}

/** Only mounted inside an existing sheet; it never opens another modal. */
export function SelectionEvidence({ decision, context }: SelectionExplanationProps & { context?: ReactNode }) {
  const theme = useAppTheme();
  const [technical, setTechnical] = useState(false);
  const sources = selectionEvidenceSources(decision);
  const odds = decision?.offeredOdds;
  const validOdds = typeof odds === 'number' && Number.isFinite(odds) && odds > 1;
  const hasProbability = formatSelectionChance(decision) !== 'Unavailable';
  const evidenceChecks = decision?.checks.filter(check => [
    'FIXTURE_UNVERIFIED', 'MARKET_UNVERIFIED', 'INSUFFICIENT_EVIDENCE', 'STALE_EVIDENCE',
  ].includes(check.code)) ?? [];
  return <View style={styles.stack}>
    <View style={[styles.section, { borderColor: theme.border }]}>
      <Text accessibilityRole="header" style={[styles.subheading, { color: theme.foregroundStrong }]}>Evidence at selection</Text>
      {evidenceChecks.length ? evidenceChecks.map(check => <Text key={check.code} style={[styles.small, { color: theme.foreground }]}>
        {check.passed ? 'Passed' : 'Not met'}: {selectionCheckLabel(check.code)}
      </Text>) : <Text style={[styles.small, { color: theme.mutedLight }]}>A complete set of recorded checks is unavailable.</Text>}
      <Text style={[styles.small, { color: theme.mutedLight }]}>
        Evidence quality describes the required checks, not certainty about the result.
      </Text>
      <Text style={[styles.small, { color: theme.mutedLight }]}>Sources: {sources.join(' · ') || 'Unavailable'}</Text>
      <Text style={[styles.small, { color: theme.mutedLight }]}>Price recorded: {recordedTime(decision?.quoteAt)}</Text>
      <Text style={[styles.small, { color: theme.mutedLight }]}>Evidence captured: {recordedTime(decision?.evidenceAt)}</Text>
    </View>
    <View style={[styles.section, { borderColor: theme.border }]}>
      <Text accessibilityRole="header" style={[styles.subheading, { color: theme.foregroundStrong }]}>Match context</Text>
      {context ?? <Text style={[styles.body, { color: theme.foreground }]}>Detailed match context was not recorded. We cannot infer recent form or injuries from the selection checks.</Text>}
      {context ? <Text style={[styles.small, { color: theme.mutedLight }]}>Match background, separate from the recorded selection reason.</Text> : null}
    </View>
    <PressableScale accessibilityRole="button" accessibilityState={{ expanded: technical }} scaleTo={1}
      onPress={() => setTechnical(value => !value)} style={styles.action}>
      <Text style={[styles.actionText, { color: theme.primarySoft }]}>Technical details</Text>
      {technical ? <Minus size={18} color={theme.primarySoft} /> : <Plus size={18} color={theme.primarySoft} />}
    </PressableScale>
    {technical ? <View style={styles.stack}>
      <Text style={[styles.small, { color: theme.foreground }]}>Recorded odds: {validOdds ? odds.toFixed(2) : 'Unavailable'}</Text>
      <Text style={[styles.small, { color: theme.foreground }]}>Break-even chance: {validOdds ? `${(100 / odds).toFixed(1)}%` : 'Unavailable'}</Text>
      <Text style={[styles.small, { color: theme.foreground }]}>Modeled net return: {formatSelectionReturn(decision)}</Text>
      <Text style={[styles.small, { color: theme.mutedLight }]}>Calculation: {hasProbability && validOdds ? `${decision!.estimatedWinProbability} × ${odds} − 1` : 'Unavailable'}</Text>
      <Text style={[styles.small, { color: theme.mutedLight }]}>Modeled net return is a long-run average estimate, not a promised payout for this match.</Text>
      <Text style={[styles.small, { color: theme.mutedLight }]}>Model: {decision?.probabilitySource ?? 'Unavailable'} {decision?.probabilityVersion ?? ''}</Text>
      <Text style={[styles.small, { color: theme.mutedLight }]}>Policy: {decision?.policyVersion ?? 'Unavailable'}</Text>
      {decision?.checks.map(check => <Text key={check.code} style={[styles.small, { color: theme.foreground }]}>{check.passed ? 'Passed' : 'Failed'}: {selectionCheckLabel(check.code)}</Text>)}
      <Text style={[styles.small, { color: theme.mutedLight }]}>Internal references: {decision?.evidenceReferences.join('; ') || 'Unavailable'}</Text>
    </View> : null}
    <Text style={[styles.caption, { color: theme.mutedLight }]}>These checks describe the recorded decision. They do not confirm the current price or evidence.</Text>
  </View>;
}

export function SelectionEvidenceSheet({ decision, presentation, recorded, title, market, onClose, visible }: SelectionExplanationProps & {
  title: string; market?: string; onClose: () => void; visible: boolean;
}) {
  const theme = useAppTheme();
  const insideSheet = useInsideBottomSheet();
  if (insideSheet) return visible ? <View style={styles.stack}>
    <PressableScale accessibilityRole="button" onPress={onClose} style={styles.action}><Text style={[styles.actionText, { color: theme.primarySoft }]}>Hide candidate evidence</Text></PressableScale>
    <Text style={[styles.title, { color: theme.foregroundStrong }]}>{title}</Text>
    <SelectionSummary decision={decision} presentation={presentation} recorded={recorded} />
    <SelectionEvidence key={decision?.candidateKey ?? title} decision={decision} />
  </View> : null;
  return <BottomSheet onClose={onClose} title="Pick evidence" visible={visible}>
    {visible ? <ScrollView contentContainerStyle={styles.sheetContent}>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.foregroundStrong }]}>{title}</Text>
      {market ? <Text style={[styles.subheading, { color: theme.foreground }]}>{market}</Text> : null}
      <SelectionOutcomeBadge decision={decision} />
      <SelectionSummary decision={decision} presentation={presentation} recorded={recorded} />
      <SelectionEvidence key={decision?.candidateKey ?? title} decision={decision} />
    </ScrollView> : null}
  </BottomSheet>;
}

export function SelectionDecisionCard({ decision, presentation, recorded, title = 'Recorded selection', market, onViewEvidence, inlineEvidence }: SelectionExplanationProps & {
  title?: string; market?: string; onViewEvidence?: () => void; inlineEvidence?: ReactNode;
}) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const insideSheet = useInsideBottomSheet();
  return <View style={styles.stack}>
    <SelectionSummary decision={decision} presentation={presentation} recorded={recorded} />
    <PressableScale accessibilityRole="button" accessibilityLabel={`${open && insideSheet ? 'Hide' : 'View'} evidence for ${title}`} scaleTo={1}
      accessibilityState={insideSheet ? { expanded: open } : undefined}
      onPress={insideSheet ? () => setOpen(value => !value) : onViewEvidence ?? (() => setOpen(true))}
      style={[styles.action, styles.evidenceButton, { backgroundColor: theme.field, borderColor: theme.border }]}>
      <Text style={[styles.actionText, { color: theme.primarySoft }]}>{insideSheet && open ? 'Hide evidence' : 'View evidence'}</Text><ChevronRight size={18} color={theme.primarySoft} />
    </PressableScale>
    {insideSheet && open ? inlineEvidence ?? <SelectionEvidence key={decision?.candidateKey} decision={decision} />
      : !onViewEvidence && open ? <SelectionEvidenceSheet decision={decision} presentation={presentation} recorded={recorded} title={title} market={market} visible onClose={() => setOpen(false)} /> : null}
  </View>;
}

const styles = StyleSheet.create({
  stack: { gap: spacing.lg },
  copyBlock: { gap: spacing.sm },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, paddingVertical: spacing.lg, borderBottomWidth: 1 },
  stackedMetrics: { flexDirection: 'column' },
  metric: { flexGrow: 1, flexBasis: 120, gap: spacing.xs },
  label: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18 },
  probability: { fontFamily: fonts.display, fontSize: 28, lineHeight: 38 },
  unavailable: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 26 },
  title: { fontFamily: fonts.display, fontSize: 20, lineHeight: 29 },
  subheading: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 25 },
  small: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 19 },
  risk: { borderLeftWidth: 2, paddingLeft: spacing.md, gap: spacing.xs },
  section: { borderTopWidth: 1, paddingTop: spacing.lg, gap: spacing.md },
  action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, gap: spacing.sm, paddingVertical: spacing.md },
  actionText: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 22 },
  evidenceButton: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.lg },
  sheetContent: { gap: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
});
