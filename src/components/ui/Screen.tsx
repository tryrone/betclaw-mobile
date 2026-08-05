import { Platform, RefreshControl, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Background } from '@/components/ui/Background';
import { useAppTheme } from '@/theme/colors';
import { layout, spacing } from '@/theme/spacing';

/** Clearance for content above the fixed 56pt bottom nav row plus breathing room. */
const NAV_CLEARANCE = 68;

export function Screen({
  children,
  contentBottomPadding,
  floatingAction,
  hasTabs,
  onRefresh,
  refreshing,
  safeTop = true,
  scroll = true,
}: {
  children: React.ReactNode;
  /** Override the wrapper's bottom clearance when a child virtualized list owns its insets. */
  contentBottomPadding?: number;
  /** Optional element pinned above the bottom nav (e.g. a floating action button). */
  floatingAction?: React.ReactNode;
  hasTabs?: boolean;
  /** Enable pull-to-refresh; called when the user pulls down. */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Set false to keep top clearance as content padding instead of a SafeAreaView edge. */
  safeTop?: boolean;
  scroll?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const defaultBottomPadding = (hasTabs ? NAV_CLEARANCE : 24) + insets.bottom + (floatingAction ? 64 : 0);
  const bottomPadding = contentBottomPadding ?? defaultBottomPadding;
  const statusBarTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const manualTopInset = safeTop ? 0 : Math.max(insets.top, statusBarTop);
  const contentPadding = {
    paddingBottom: bottomPadding,
    paddingTop: layout.screenGutter + manualTopInset,
  };

  return (
    <Background>
      <SafeAreaView edges={safeTop ? ['top'] : []} style={styles.safe}>
        {scroll ? (
          <ScrollView
            bounces={Boolean(onRefresh)}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  colors={[theme.primary]}
                  onRefresh={onRefresh}
                  progressBackgroundColor={theme.card}
                  refreshing={Boolean(refreshing)}
                  tintColor={theme.primary}
                />
              ) : undefined
            }
            showsVerticalScrollIndicator={false}>
            <View style={[styles.content, contentPadding]}>{children}</View>
          </ScrollView>
        ) : (
          <View style={styles.staticContent}>
            <View style={[styles.content, styles.fill, contentPadding]}>{children}</View>
          </View>
        )}
        {floatingAction ? (
          <View pointerEvents="box-none" style={[styles.floatingAction, { bottom: (hasTabs ? NAV_CLEARANCE - 8 : 24) + insets.bottom }]}>
            {floatingAction}
          </View>
        ) : null}
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    maxWidth: layout.screenMaxWidth,
    paddingHorizontal: layout.screenHorizontalGutter,
    width: '100%',
  },
  fill: {
    flex: 1,
  },
  floatingAction: {
    alignItems: 'flex-end',
    left: 0,
    paddingHorizontal: layout.screenHorizontalGutter + 4,
    position: 'absolute',
    right: 0,
  },
  safe: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
  },
  staticContent: {
    alignItems: 'center',
    flex: 1,
  },
});
