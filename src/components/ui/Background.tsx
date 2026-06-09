import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { gradients } from '@/theme/gradients';

export function Background({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient colors={gradients.appBackground} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} />
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glowOne: {
    backgroundColor: 'rgba(46,242,208,0.12)',
    borderRadius: 120,
    height: 240,
    left: -80,
    position: 'absolute',
    top: -70,
    width: 240,
  },
  glowTwo: {
    backgroundColor: 'rgba(255,211,77,0.09)',
    borderRadius: 120,
    height: 240,
    position: 'absolute',
    right: -90,
    top: 160,
    width: 240,
  },
  root: {
    flex: 1,
    overflow: 'hidden',
  },
});
