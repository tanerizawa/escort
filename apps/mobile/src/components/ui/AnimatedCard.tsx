import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, ANIMATION } from '../../constants/theme';
import { useHaptic } from '../../hooks/useHaptic';

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  scaleValue?: number;
  haptic?: boolean;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedCard({
  children,
  onPress,
  style,
  scaleValue = 0.97,
  haptic = true,
  disabled = false,
}: AnimatedCardProps) {
  const scale = useSharedValue(1);
  const { light } = useHaptic();

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(scaleValue, ANIMATION.springBouncy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, ANIMATION.springSmooth);
  };

  const handlePress = () => {
    if (haptic) light();
    onPress?.();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[styles.card, SHADOWS.md, animStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.darkCard,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
});
