import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, ANIMATION, SHADOWS } from '../../constants/theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  color?: string;
  bgColor?: string;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FloatingActionButton({
  icon,
  onPress,
  size = 56,
  color = COLORS.dark,
  bgColor = COLORS.gold,
  style,
}: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.88, ANIMATION.springBouncy); }}
      onPressOut={() => { scale.value = withSpring(1, ANIMATION.springSmooth); }}
      style={[
        styles.fab,
        SHADOWS.gold,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor },
        animStyle,
        style,
      ]}
    >
      <Ionicons name={icon} size={size * 0.42} color={color} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 24,
    right: 20,
    zIndex: 100,
  },
});
