import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Background } from '@/components/ui/Background';
import { BrandMark } from '@/components/ui/BrandMark';
import { useAppTheme } from '@/theme/colors';

export function BootSplash() {
  const theme = useAppTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + progress.value * 0.4 }],
  }));

  return (
    <Background>
      <View style={styles.center}>
        <Animated.View style={markStyle}>
          <BrandMark color={theme.primary} size={96} />
        </Animated.View>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
