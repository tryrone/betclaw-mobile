import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme/colors';
import { useAppGradients } from '@/theme/gradients';

export function Background({ children }: { children: React.ReactNode }) {
  const theme = useAppTheme();
  const gradients = useAppGradients();
  const glowOpacity = theme.mode === 'light' ? 0.05 : 0.1;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <LinearGradient colors={gradients.appBackground} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} />
      <View style={[styles.radialGlow, styles.primaryGlow, { backgroundColor: theme.primarySubtle, opacity: glowOpacity }]} />
      <View style={[styles.radialGlow, styles.accentGlow, { backgroundColor: theme.accentMuted, opacity: glowOpacity }]} />
      <LinearGradient
        colors={theme.mode === 'light' ? ['rgba(255,255,255,0.34)', 'rgba(17,20,59,0.018)'] : ['rgba(255,255,255,0.012)', 'rgba(3,5,24,0.12)']}
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
  accentGlow: {
    right: -160,
    top: 160,
  },
  radialGlow: {
    borderRadius: 260,
    height: 320,
    position: 'absolute',
    width: 320,
  },
  primaryGlow: {
    left: -170,
    top: -150,
  },
});
