import React, { useEffect } from 'react';
import { TextInput, StyleSheet, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: TextStyle;
  formatter?: (n: number) => string;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export function AnimatedCounter({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
  decimals = 0,
  style,
  formatter,
}: AnimatedCounterProps) {
  const animValue = useSharedValue(0);

  useEffect(() => {
    animValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, duration, animValue]);

  const animProps = useAnimatedProps(() => {
    const v = animValue.value;
    const formatted = formatter
      ? formatter(v)
      : decimals > 0
        ? v.toFixed(decimals)
        : Math.round(v).toString();
    return {
      text: `${prefix}${formatted}${suffix}`,
      defaultValue: `${prefix}${formatted}${suffix}`,
    } as any;
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      style={[styles.text, style]}
      animatedProps={animProps}
      defaultValue={`${prefix}${formatter ? formatter(value) : decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString()}${suffix}`}
    />
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    padding: 0,
    margin: 0,
  },
});
