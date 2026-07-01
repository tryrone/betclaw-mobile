import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme/colors';
import { useAppGradients } from '@/theme/gradients';

export function Background({ children }: { children: React.ReactNode }) {
  const theme = useAppTheme();
  const gradients = useAppGradients();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <LinearGradient colors={gradients.appBackground} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} />
      <View style={[styles.radialGlow, styles.tealGlow, { backgroundColor: theme.primarySubtle }]} />
      <View style={[styles.radialGlow, styles.amberGlow, { backgroundColor: theme.accentMuted }]} />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.30)']}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  amberGlow: {
    right: -86,
    top: 42,
  },
  radialGlow: {
    borderRadius: 220,
    height: 220,
    opacity: 0.35,
    position: 'absolute',
    width: 220,
  },
  tealGlow: {
    left: -80,
    top: -36,
  },
});
