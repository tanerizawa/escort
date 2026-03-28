import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS, ANIMATION } from '../../constants/theme';
import { useHaptic } from '../../hooks/useHaptic';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function StatCard({ label, value, icon, color = COLORS.gold, onPress, style }: StatCardProps) {
  const scale = useSharedValue(1);
  const { light } = useHaptic();

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => { light(); onPress?.(); }}
      onPressIn={() => { scale.value = withSpring(0.95, ANIMATION.springBouncy); }}
      onPressOut={() => { scale.value = withSpring(1, ANIMATION.springSmooth); }}
      style={[styles.card, SHADOWS.sm, { borderLeftColor: color }, animStyle, style]}
    >
      {icon && <Ionicons name={icon} size={20} color={color} />}
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.darkCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderLeftWidth: 3,
    gap: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});
