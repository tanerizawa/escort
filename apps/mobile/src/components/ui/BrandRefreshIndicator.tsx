import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { COLORS, SPACING } from '../../constants/theme';

/**
 * Branded refresh indicator — 3 gold dots pulsing with stagger
 */
export function BrandRefreshIndicator() {
  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>
        <PulseDot delay={0} />
        <PulseDot delay={150} />
        <PulseDot delay={300} />
      </View>
      <Text style={styles.text}>Memperbarui...</Text>
    </View>
  );
}

function PulseDot({ delay }: { delay: number }) {
  const scale = useSharedValue(0.6);

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
        withTiming(0.6, { duration: 400, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 0.5 + scale.value * 0.5,
  }));

  return <Animated.View style={[styles.dot, animStyle, { marginLeft: delay > 0 ? 8 : 0 }]} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gold,
  },
  text: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});
