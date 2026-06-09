import { FadeInDown, LinearTransition } from 'react-native-reanimated';

export const SPRING_LAYOUT = LinearTransition.springify().damping(18).stiffness(220);

export function enterUp(index = 0) {
  return FadeInDown.delay(70 * index)
    .springify()
    .damping(17)
    .stiffness(190);
}
