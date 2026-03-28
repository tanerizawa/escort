import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, RADIUS, SHADOWS, ANIMATION } from '../../constants/theme';
import { useHaptic } from '../../hooks/useHaptic';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  gradient?: readonly string[];
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'gradient' | 'outline' | 'ghost';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GradientButton({
  title,
  onPress,
  loading,
  disabled,
  gradient = GRADIENTS.gold,
  style,
  textStyle,
  size = 'md',
  variant = 'gradient',
}: GradientButtonProps) {
  const scale = useSharedValue(1);
  const { light } = useHaptic();
  const isDisabled = disabled || loading;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, ANIMATION.springBouncy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, ANIMATION.springSmooth);
  };

  const handlePress = () => {
    if (!isDisabled) {
      light();
      onPress();
    }
  };

  const heights = { sm: 40, md: 52, lg: 60 };
  const fontSizes = { sm: 13, md: 15, lg: 17 };

  if (variant === 'outline') {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={[
          styles.base,
          { height: heights[size], borderWidth: 1.5, borderColor: COLORS.gold },
          isDisabled && styles.disabled,
          animStyle,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.gold} />
        ) : (
          <Text style={[styles.text, { fontSize: fontSizes[size], color: COLORS.gold }, textStyle]}>
            {title}
          </Text>
        )}
      </AnimatedPressable>
    );
  }

  if (variant === 'ghost') {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={[
          styles.base,
          { height: heights[size] },
          isDisabled && styles.disabled,
          animStyle,
          style,
        ]}
      >
        <Text style={[styles.text, { fontSize: fontSizes[size], color: COLORS.gold }, textStyle]}>
          {title}
        </Text>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[animStyle, isDisabled && styles.disabled]}
    >
      <LinearGradient
        colors={gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, SHADOWS.gold, { height: heights[size] }, style]}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.textInverse} />
        ) : (
          <Text style={[styles.text, { fontSize: fontSizes[size], color: COLORS.textInverse }, textStyle]}>
            {title}
          </Text>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  gradient: {
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.5,
  },
});
