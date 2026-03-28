import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { COLORS, SPACING } from '../constants/theme';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(600)} style={styles.inner}>
        <Text style={styles.brand}>ARETON</Text>
        <Text style={styles.tagline}>Prestige Companion</Text>
        <ActivityIndicator size="small" color={COLORS.gold} style={{ marginTop: SPACING.xl }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: { alignItems: 'center' },
  brand: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.gold,
    letterSpacing: 8,
  },
  tagline: {
    fontSize: 12,
    color: COLORS.textMuted,
    letterSpacing: 3,
    marginTop: 6,
    fontWeight: '500',
  },
});
