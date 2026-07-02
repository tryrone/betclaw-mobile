import { Platform, RefreshControl, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Background } from '@/components/ui/Background';
import { useAppTheme } from '@/theme/colors';
import { layout, spacing } from '@/theme/spacing';

/** Clearance for content above the anchored bottom nav bar (row 56 + padding + breathing room). */
const NAV_CLEARANCE = 96;

export function Screen({
  children,
  hasTabs,
  onRefresh,
  refreshing,
  safeTop = true,
  scroll = true,
}: {
  children: React.ReactNode;
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
  const bottomPadding = (hasTabs ? NAV_CLEARANCE : 24) + insets.bottom;
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
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    maxWidth: 390,
    paddingHorizontal: layout.screenGutter,
    width: '100%',
  },
  fill: {
    flex: 1,
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
