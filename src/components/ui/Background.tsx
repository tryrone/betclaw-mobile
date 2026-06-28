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
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
});
