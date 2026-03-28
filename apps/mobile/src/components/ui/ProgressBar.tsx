import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

interface Props {
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({ height = 4, style }: Props) {
  const width = useSharedValue(0);

  React.useEffect(() => {
    width.value = withRepeat(
      withTiming(100, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [width]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={[styles.track, { height }, style]}>
      <Animated.View style={[styles.bar, { height }, barStyle]} />
    </View>
  );
}

interface StepProgressProps {
  current: number;
  total: number;
  style?: ViewStyle;
}

export function StepProgress({ current, total, style }: StepProgressProps) {
  const pct = (current / total) * 100;

  return (
    <View style={[stepStyles.wrapper, style]}>
      <View style={stepStyles.track}>
        <Animated.View style={[stepStyles.fill, { width: `${pct}%` }]} />
      </View>
      <View style={stepStyles.dots}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[
              stepStyles.dot,
              i < current && stepStyles.dotDone,
              i === current && stepStyles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: COLORS.darkBorder,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  bar: {
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.pill,
  },
});

const stepStyles = StyleSheet.create({
  wrapper: { gap: SPACING.sm },
  track: {
    height: 3,
    backgroundColor: COLORS.darkBorder,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.pill,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.darkBorder,
  },
  dotDone: { backgroundColor: COLORS.gold },
  dotActive: {
    backgroundColor: COLORS.gold,
    borderWidth: 2,
    borderColor: COLORS.goldLight,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
