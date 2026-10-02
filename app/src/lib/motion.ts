import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { FadeIn, FadeOut, ReduceMotion, useReducedMotion, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export const enter = FadeIn.duration(180).reduceMotion(ReduceMotion.System);
export const exit = FadeOut.duration(150).reduceMotion(ReduceMotion.System);
export const pressSpring = { duration: 220, dampingRatio: 0.8, reduceMotion: ReduceMotion.System };

// Also respond when accessibility preferences change while the app is open.
export function useMotionDisabled() {
  const initial = useReducedMotion();
  const [disabled, setDisabled] = useState(initial);
  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setDisabled);
    return () => subscription.remove();
  }, []);
  return disabled;
}

export const feedback = {
  selection: () => { void Haptics.selectionAsync().catch(() => {}); },
  snap: () => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); },
  success: () => { void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); },
  error: () => { void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}); },
};

// Move surviving list cells using transforms; their final geometry is committed immediately.
export const itemLayout = (values: {
  currentOriginX: number; currentOriginY: number;
  targetOriginX: number; targetOriginY: number;
}) => {
  'worklet';
  return {
    initialValues: { transform: [
      { translateX: values.currentOriginX - values.targetOriginX },
      { translateY: values.currentOriginY - values.targetOriginY },
    ] },
    animations: { transform: [
      { translateX: withTiming(0, { duration: 200, reduceMotion: ReduceMotion.System }) },
      { translateY: withTiming(0, { duration: 200, reduceMotion: ReduceMotion.System }) },
    ] },
  };
};
