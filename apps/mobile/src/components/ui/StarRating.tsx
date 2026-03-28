import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, ANIMATION } from '../../constants/theme';
import { useHaptic } from '../../hooks/useHaptic';

interface Props {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (val: number) => void;
  style?: ViewStyle;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 24,
  interactive = false,
  onChange,
  style,
}: Props) {
  const { light } = useHaptic();

  const handlePress = (idx: number) => {
    if (!interactive || !onChange) return;
    light();
    onChange(idx + 1);
  };

  return (
    <View style={[styles.row, style]}>
      {Array.from({ length: maxRating }, (_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <Pressable key={i} onPress={() => handlePress(i)} hitSlop={6}>
            <Ionicons
              name={filled ? 'star' : half ? 'star-half' : 'star-outline'}
              size={size}
              color={filled || half ? COLORS.gold : COLORS.darkBorder}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
});
