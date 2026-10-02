import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { feedback, pressSpring, useMotionDisabled } from '../lib/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
type Props = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; selectionFeedback?: boolean };

export default function MotionPressable({ style, onPressIn, onPressOut, onPress, selectionFeedback, disabled, ...props }: Props) {
  const scale = useSharedValue(1);
  const reduced = useMotionDisabled();
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <AnimatedPressable
    {...props}
    disabled={disabled}
    accessibilityRole={props.accessibilityRole ?? 'button'}
    style={[style, animatedStyle, disabled && { opacity: 0.55 }]}
    onPressIn={(event) => { scale.value = reduced ? 1 : withSpring(0.97, pressSpring); onPressIn?.(event); }}
    onPressOut={(event) => { scale.value = reduced ? 1 : withSpring(1, pressSpring); onPressOut?.(event); }}
    onPress={(event) => { if (selectionFeedback) feedback.selection(); onPress?.(event); }}
  />;
}
