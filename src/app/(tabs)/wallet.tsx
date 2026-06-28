import { CreditCard, FileText, ShieldCheck, Trophy, WalletCards, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import {
  enterUp,
  GlassCard,
  GradientButton,
  IconButton,
  PressableScale,
  ProgressBar,
  Screen,
  ScreenHeader,
  StatusBadge,
} from '@/components/ui';
import { billingHistory, tokenPacks, type BillingItemData, type TokenPackData } from '@/data/mock';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

function TokenPack({ onPress, pack, selected }: { onPress: () => void; pack: TokenPackData; selected: boolean }) {
  const theme = useAppTheme();

  return (
    <PressableScale
      accessibilityLabel={`${pack.label} pack, ${pack.tokens} tokens for ${pack.price}`}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.packWrap}>
      <GlassCard style={[styles.packCard, { borderColor: selected ? theme.selectionBorder : theme.border }]}>
        <View style={styles.packTop}>
          <View style={[styles.packIcon, { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }]}>
            <Trophy color={theme.primarySoft} size={17} />
          </View>
          {pack.featured ? <StatusBadge label="Best value" tone="accent" /> : null}
        </View>
        <Text style={[styles.packTitle, { color: theme.foregroundStrong }]}>{pack.label}</Text>
        <Text style={[styles.packMeta, { color: theme.mutedLight }]}>{pack.tokens} tokens</Text>
        <Text style={[styles.packPrice, { color: theme.primarySoft }]}>{pack.price}</Text>
      </GlassCard>
    </PressableScale>
  );
}

function BillingRow({ item }: { item: BillingItemData }) {
  const theme = useAppTheme();

  return (
    <PressableScale accessibilityLabel={item.label} accessibilityRole="button" scaleTo={0.98}>
      <GlassCard style={styles.billingRow}>
        <View style={[styles.billingIcon, { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }]}>
          <FileText color={theme.primarySoft} size={15} />
        </View>
        <View style={styles.billingCopy}>
          <Text numberOfLines={1} style={[styles.billingTitle, { color: theme.foregroundStrong }]}>
            {item.label}
          </Text>
          <Text style={[styles.billingDate, { color: theme.muted }]}>{item.date}</Text>
        </View>
        <View style={styles.billingRight}>
          <Text style={[styles.billingAmount, { color: theme.foreground }]}>{item.amount}</Text>
          <StatusBadge label={item.status} tone="success" />
        </View>
      </GlassCard>
    </PressableScale>
  );
}

export default function WalletScreen() {
  const [selectedPack, setSelectedPack] = useState('weekly');
  const theme = useAppTheme();

  return (
    <Screen hasTabs>
      <Animated.View entering={enterUp(0)}>
        <ScreenHeader action={<IconButton icon={CreditCard} label="Payment methods" />} eyebrow="Billing" title="Wallet" />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <GlassCard gradient="hero" style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <StatusBadge label="Premium active" tone="accent" />
            <ShieldCheck color={theme.primarySoft} size={21} />
          </View>
          <View>
            <Text style={[styles.balanceLabel, { color: theme.muted }]}>Token balance</Text>
            <Text style={[styles.balanceValue, { color: theme.foregroundStrong }]}>700,000</Text>
            <Text style={[styles.balanceSub, { color: theme.mutedLight }]}>tokens remaining</Text>
          </View>
          <ProgressBar value={74} />
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(2)}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>Usage progress</Text>
              <Text style={[styles.cardCaption, { color: theme.muted }]}>Fix Ticket and Build Ticket consume research tokens.</Text>
            </View>
            <Zap color={theme.accent} size={22} />
          </View>
          <ProgressBar tone="warning" value={32} />
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(3)} style={styles.packGrid}>
        {tokenPacks.map((pack) => (
          <TokenPack key={pack.id} onPress={() => setSelectedPack(pack.id)} pack={pack} selected={selectedPack === pack.id} />
        ))}
      </Animated.View>

      <Animated.View entering={enterUp(4)}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>Payment paths</Text>
            <StatusBadge label="Kora + IAP" tone="accent" />
          </View>
          <View style={styles.paymentGrid}>
            <GradientButton icon={WalletCards}>Pay with Kora</GradientButton>
            <PressableScale
              accessibilityLabel="Pay with Apple or Google"
              accessibilityRole="button"
              style={[styles.storePay, { backgroundColor: theme.field, borderColor: theme.border }]}>
              <Text style={[styles.storePayText, { color: theme.foreground }]}>Apple / Google</Text>
            </PressableScale>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(5)} style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.foregroundStrong }]}>Purchase history</Text>
        <Text style={[styles.sectionAction, { color: theme.primarySoft }]}>View all</Text>
      </Animated.View>

      {billingHistory.map((item, index) => (
        <Animated.View entering={enterUp(6 + index)} key={item.id}>
          <BillingRow item={item} />
        </Animated.View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    gap: spacing.md,
  },
  balanceLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  balanceSub: {
    fontFamily: fonts.bold,
    fontSize: 13,
    marginTop: 5,
  },
  balanceTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceValue: {
    fontFamily: fonts.extraBold,
    fontSize: 36,
    letterSpacing: 0,
    lineHeight: 41,
    marginTop: 5,
  },
  billingAmount: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  billingCopy: {
    flex: 1,
    minWidth: 0,
  },
  billingDate: {
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 4,
  },
  billingIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  billingRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  billingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  billingTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  cardCaption: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    maxWidth: 220,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  packCard: {
    flex: 1,
    padding: spacing.md,
  },
  packGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  packIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  packMeta: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  packPrice: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  packTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  packTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  packWrap: {
    flex: 1,
  },
  paymentGrid: {
    gap: spacing.sm,
  },
  sectionAction: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
  storePay: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
  },
  storePayText: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
});
