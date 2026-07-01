import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Background } from '@/components/ui/Background';
import { layout, spacing } from '@/theme/spacing';

/** Clearance for content above the floating bottom dock (dock 68 + glow + breathing room). */
const NAV_CLEARANCE = 124;

export function Screen({
  children,
  hasTabs,
  scroll = true,
}: {
  children: React.ReactNode;
  hasTabs?: boolean;
  scroll?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const bottomPadding = (hasTabs ? NAV_CLEARANCE : 24) + insets.bottom;

  return (
    <Background>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {scroll ? (
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={[styles.content, { paddingBottom: bottomPadding }]}>{children}</View>
          </ScrollView>
        ) : (
          <View style={styles.staticContent}>
            <View style={[styles.content, styles.fill, { paddingBottom: bottomPadding }]}>{children}</View>
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
    paddingTop: layout.screenGutter,
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
