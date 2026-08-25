/* eslint-disable react-hooks/immutability -- Reanimated shared values are mutable by design. */
import { X } from '@/components/modern-icons';
import { useCallback, useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/PressableScale';
import { useAppTheme } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';

const DISMISS_DISTANCE = 140;
const DISMISS_VELOCITY = 900;

/**
 * Reusable slide-up bottom sheet: the backdrop fades in first, then the sheet
 * springs up. Drag the header area down (or tap the backdrop / close button)
 * to dismiss. Content area is at least 50% of the screen tall.
 */
export function BottomSheet({
  children,
  onClose,
  title,
  visible,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  visible: boolean;
}) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const translateY = useSharedValue(height);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = height;
      backdrop.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) });
      translateY.value = withDelay(140, withSpring(0, { damping: 22, mass: 0.9, stiffness: 210 }));
    }
  }, [backdrop, height, translateY, visible]);

  const requestClose = useCallback(() => {
    backdrop.value = withTiming(0, { duration: 240 });
    translateY.value = withTiming(height, { duration: 240, easing: Easing.in(Easing.quad) }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [backdrop, height, onClose, translateY]);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY) {
        backdrop.value = withTiming(0, { duration: 220 });
        translateY.value = withTiming(height, { duration: 220 }, (finished) => {
          if (finished) runOnJS(onClose)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 22, stiffness: 240 });
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return (
    <Modal animationType="none" onRequestClose={requestClose} statusBarTranslucent transparent visible={visible}>
      <GestureHandlerRootView style={sheetStyles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.overlay }, backdropStyle]}>
          <Pressable accessibilityLabel={`Close ${title}`} onPress={requestClose} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View
          style={[
            sheetStyles.sheet,
            {
              backgroundColor: theme.backgroundAlt,
              borderColor: theme.border,
              maxHeight: height * 0.9,
              minHeight: height * 0.5,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
            sheetStyle,
          ]}>
          <GestureDetector gesture={pan}>
            <View style={sheetStyles.grabArea}>
              <View style={[sheetStyles.handle, { backgroundColor: theme.borderStrong }]} />
              <View style={sheetStyles.header}>
                <Text style={[sheetStyles.title, { color: theme.foregroundStrong }]}>{title}</Text>
                <PressableScale
                  accessibilityLabel="Close"
                  accessibilityRole="button"
                  onPress={requestClose}
                  style={[sheetStyles.close, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <X color={theme.mutedLight} size={16} />
                </PressableScale>
              </View>
            </View>
          </GestureDetector>
          {children}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  close: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  grabArea: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    borderRadius: radius.pill,
    height: 4,
    opacity: 0.8,
    width: 42,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
});
