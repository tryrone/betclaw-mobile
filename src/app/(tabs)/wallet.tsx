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
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

function TokenPack({
  onPress,
  pack,
  selected,
}: {
  onPress: () => void;
  pack: TokenPackData;
  selected: boolean;
}) {
  return (
    <PressableScale
      accessibilityLabel={`${pack.label} pack, ${pack.tokens} tokens for ${pack.price}`}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.packWrap}>
      <GlassCard style={[styles.packCard, selected && styles.selectedPack]}>
        <View style={styles.packTop}>
          <View style={styles.packIcon}>
            <Trophy color={colors.primary} size={18} />
          </View>
          {pack.featured ? <StatusBadge label="Best value" tone="accent" /> : null}
        </View>
        <Text style={styles.packTitle}>{pack.label}</Text>
        <Text style={styles.packMeta}>{pack.tokens} tokens</Text>
        <Text style={styles.packPrice}>{pack.price}</Text>
      </GlassCard>
    </PressableScale>
  );
}

function BillingRow({ item }: { item: BillingItemData }) {
  return (
    <PressableScale accessibilityLabel={item.label} accessibilityRole="button" scaleTo={0.98}>
      <GlassCard style={styles.billingRow}>
        <View style={styles.billingIcon}>
          <FileText color={colors.primary} size={16} />
        </View>
        <View style={styles.billingCopy}>
          <Text numberOfLines={1} style={styles.billingTitle}>
            {item.label}
          </Text>
          <Text style={styles.billingDate}>{item.date}</Text>
        </View>
        <View style={styles.billingRight}>
          <Text style={styles.billingAmount}>{item.amount}</Text>
          <StatusBadge label={item.status} tone="success" />
        </View>
      </GlassCard>
    </PressableScale>
  );
}

export default function WalletScreen() {
  const [selectedPack, setSelectedPack] = useState('weekly');

  return (
    <Screen hasTabs>
      <Animated.View entering={enterUp(0)}>
        <ScreenHeader action={<IconButton icon={CreditCard} label="Payment methods" />} eyebrow="Billing" title="Wallet" />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <GlassCard gradient="hero" style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <StatusBadge label="Premium active" tone="accent" />
            <ShieldCheck color={colors.primary} size={22} />
          </View>
          <View>
            <Text style={styles.balanceLabel}>Token balance</Text>
            <Text style={styles.balanceValue}>700,000</Text>
            <Text style={styles.balanceSub}>tokens remaining</Text>
          </View>
          <ProgressBar value={74} />
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(2)}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Usage progress</Text>
              <Text style={styles.cardCaption}>Fix Ticket and Build Ticket consume research tokens.</Text>
            </View>
            <Zap color={colors.accent} size={22} />
          </View>
          <ProgressBar tone="warning" value={32} />
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(3)} style={styles.packGrid}>
        {tokenPacks.map((pack) => (
          <TokenPack
            key={pack.id}
            onPress={() => setSelectedPack(pack.id)}
            pack={pack}
            selected={selectedPack === pack.id}
          />
        ))}
      </Animated.View>

      <Animated.View entering={enterUp(4)}>
        <GlassCard>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Payment paths</Text>
            <StatusBadge label="Kora + IAP" tone="accent" />
          </View>
          <View style={styles.paymentGrid}>
            <GradientButton icon={WalletCards}>Pay with Kora</GradientButton>
            <PressableScale accessibilityLabel="Pay with Apple or Google" accessibilityRole="button" style={styles.storePay}>
              <Text style={styles.storePayText}>Apple / Google</Text>
            </PressableScale>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(5)} style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Purchase history</Text>
        <Text style={styles.sectionAction}>View all</Text>
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
    gap: spacing.xl,
  },
  balanceLabel: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  balanceSub: {
    color: colors.mutedLight,
    fontFamily: fonts.bold,
    fontSize: 13,
    marginTop: 8,
  },
  balanceTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceValue: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 40,
    letterSpacing: 0,
    lineHeight: 46,
    marginTop: 8,
  },
  billingAmount: {
    color: colors.foreground,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  billingCopy: {
    flex: 1,
    minWidth: 0,
  },
  billingDate: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 4,
  },
  billingIcon: {
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    borderColor: colors.borderAccent,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  billingRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  billingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  billingTitle: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  cardCaption: {
    color: colors.muted,
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
    color: colors.foregroundStrong,
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
    backgroundColor: colors.primaryMuted,
    borderColor: colors.borderAccent,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  packMeta: {
    color: colors.mutedLight,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  packPrice: {
    color: colors.primary,
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  packTitle: {
    color: colors.foregroundStrong,
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
    gap: spacing.md,
  },
  sectionAction: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.foregroundStrong,
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
  selectedPack: {
    borderColor: colors.borderAccent,
  },
  storePay: {
    alignItems: 'center',
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
  },
  storePayText: {
    color: colors.foreground,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
});
