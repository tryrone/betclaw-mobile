import { LinearTransition } from 'react-native-reanimated';

export const SPRING_LAYOUT = LinearTransition.springify().damping(18).stiffness(220);

export function enterUp(_index = 0) {
  return undefined;
}
