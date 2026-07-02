import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRightLeft, Check, Copy, Ticket } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { enterUp, GlassCard, GradientButton, IconButton, PressableScale, Screen, ScreenHeader, StatusBadge, useToast } from '@/components/ui';
import { getErrorMessage } from '@/lib/api/client';
import { useConvertBookingCodeMutation } from '@/lib/api/hooks';
import { BOOKMAKER_PLATFORM_OPTIONS, getPlatformLabel, type SupportedPlatform } from '@/lib/bookmaker-platforms';
import { copyOrShareText } from '@/lib/mobile-format';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

function PlatformPill({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.platformPill,
        {
          backgroundColor: active ? theme.primarySubtle : theme.field,
          borderColor: active ? theme.selectionBorder : theme.border,
        },
      ]}>
      <Text style={[styles.platformText, { color: active ? theme.primarySoft : theme.mutedLight }]}>{label}</Text>
    </PressableScale>
  );
}

export default function ConvertTicketScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { showToast } = useToast();
  const [code, setCode] = useState('');
  const [fromPlatform, setFromPlatform] = useState<SupportedPlatform>('SPORTYBET');
  const [toPlatform, setToPlatform] = useState<SupportedPlatform>('BET9JA');
  const convertCode = useConvertBookingCodeMutation();

  const handleConvert = () => {
    if (!code.trim() || fromPlatform === toPlatform || convertCode.isPending) return;
    convertCode.mutate({
      code: code.trim(),
      fromPlatform,
      toPlatform,
    });
  };

  const handleSwap = () => {
    setFromPlatform(toPlatform);
    setToPlatform(fromPlatform);
  };

  const handleCopy = async () => {
    const convertedCode = convertCode.data?.convertedCode;
    if (!convertedCode) return;
    try {
      const mode = await copyOrShareText(convertedCode, 'Converted BetClaw code');
      showToast({
        message: mode === 'copied' ? 'Code copied' : 'Code shared',
        title: 'Converted code',
        tone: 'success',
      });
    } catch {
      showToast({
        message: 'Could not copy code',
        title: 'Copy failed',
        tone: 'error',
      });
    }
  };

  const errorMessage =
    convertCode.error ? getErrorMessage(convertCode.error) : convertCode.data && !convertCode.data.success ? convertCode.data.error : null;

  useEffect(() => {
    if (!errorMessage) return;
    showToast({
      message: errorMessage,
      title: 'Conversion failed',
      tone: 'error',
    });
  }, [errorMessage, showToast]);

  return (
    <Screen hasTabs>
      <Animated.View entering={enterUp(0)}>
        <ScreenHeader
          eyebrow="Code converter"
          leadingAction={<IconButton icon={ArrowLeft} label="Go back" onPress={() => router.back()} />}
          title="Convert Code"
        />
      </Animated.View>

      <Animated.View entering={enterUp(1)}>
        <GlassCard gradient="hero" style={styles.hero}>
          <View style={styles.heroTop}>
            <StatusBadge label="Bookmaker bridge" tone="accent" />
            <ArrowRightLeft color={theme.primarySoft} size={22} />
          </View>
          <Text style={[styles.heroTitle, { color: theme.foregroundStrong }]}>Move booking codes between supported bookmakers.</Text>
          <Text style={[styles.heroCopy, { color: theme.mutedLight }]}>
            Paste a code, choose the source and destination platforms, then copy the converted result.
          </Text>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={enterUp(2)}>
        <GlassCard>
          <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>From</Text>
          <ScrollView contentContainerStyle={styles.pillRow} horizontal showsHorizontalScrollIndicator={false}>
            {BOOKMAKER_PLATFORM_OPTIONS.map((platform) => (
              <PlatformPill
                active={fromPlatform === platform.id}
                key={platform.id}
                label={platform.label}
                onPress={() => setFromPlatform(platform.id)}
              />
            ))}
          </ScrollView>

          <PressableScale
            accessibilityLabel="Swap platforms"
            accessibilityRole="button"
            onPress={handleSwap}
            style={[styles.swapButton, { backgroundColor: theme.primarySubtle, borderColor: theme.selectionBorder }]}>
            <ArrowRightLeft color={theme.primarySoft} size={17} />
            <Text style={[styles.swapText, { color: theme.primarySoft }]}>Swap platforms</Text>
          </PressableScale>

          <Text style={[styles.cardTitle, { color: theme.foregroundStrong }]}>To</Text>
          <ScrollView contentContainerStyle={styles.pillRow} horizontal showsHorizontalScrollIndicator={false}>
            {BOOKMAKER_PLATFORM_OPTIONS.map((platform) => (
              <PlatformPill
                active={toPlatform === platform.id}
                key={platform.id}
                label={platform.label}
                onPress={() => setToPlatform(platform.id)}
              />
            ))}
          </ScrollView>

          <View style={[styles.codeInputWrap, { backgroundColor: theme.field, borderColor: theme.border }]}>
            <Ticket color={theme.muted} size={19} />
            <TextInput
              autoCapitalize="characters"
              onChangeText={setCode}
              placeholder="Paste booking code"
              placeholderTextColor={theme.muted}
              style={[styles.codeInput, { color: theme.foregroundStrong }]}
              value={code}
            />
          </View>

          <GradientButton icon={ArrowRightLeft} onPress={handleConvert}>
            {convertCode.isPending ? 'Converting...' : 'Convert Code'}
          </GradientButton>
        </GlassCard>
      </Animated.View>

      {convertCode.data?.success && convertCode.data.convertedCode ? (
        <Animated.View entering={enterUp(3)}>
          <GlassCard gradient="amberCard" style={styles.resultCard}>
            <View style={styles.resultTop}>
              <StatusBadge label={`${getPlatformLabel(fromPlatform)} to ${getPlatformLabel(toPlatform)}`} tone="success" />
              <Check color={theme.success} size={19} />
            </View>
            <Text style={[styles.resultLabel, { color: theme.muted }]}>Converted code</Text>
            <PressableScale
              accessibilityLabel="Copy converted code"
              accessibilityRole="button"
              onPress={handleCopy}
              style={[styles.resultCode, { backgroundColor: theme.field, borderColor: theme.selectionBorder }]}>
              <Text style={[styles.resultCodeText, { color: theme.primarySoft }]}>{convertCode.data.convertedCode}</Text>
              <Copy color={theme.primarySoft} size={18} />
            </PressableScale>
          </GlassCard>
        </Animated.View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  codeInput: {
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    letterSpacing: 0,
    padding: 0,
  },
  codeInputWrap: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  copyState: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  hero: {
    gap: spacing.md,
  },
  heroCopy: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  heroTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    lineHeight: 25,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pillRow: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  platformPill: {
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  platformText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  resultCard: {
    gap: spacing.md,
  },
  resultCode: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  resultCodeText: {
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 24,
    letterSpacing: 0,
  },
  resultLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  resultTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  swapButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 38,
    paddingHorizontal: spacing.md,
  },
  swapText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
});
