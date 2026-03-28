import React, { useEffect } from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
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

const AnimatedText = Animated.createAnimatedComponent(Text);

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
        : Math.round(v).toLocaleString('id-ID');
    return {
      text: `${prefix}${formatted}${suffix}`,
    } as any;
  });

  return (
    <AnimatedText
      style={[styles.text, style]}
      animatedProps={animProps}
    >
      {`${prefix}${formatter ? formatter(value) : decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString('id-ID')}${suffix}`}
    </AnimatedText>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
