import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AvatarWithStatus } from './AvatarWithStatus';
import { COLORS } from '../../constants/theme';

interface StoryRingProps {
  uri?: string | null;
  size?: number;
  isOnline?: boolean;
  ringColors?: readonly string[];
  style?: ViewStyle;
}

export function StoryRing({
  uri,
  size = 64,
  isOnline,
  ringColors = [COLORS.gold, COLORS.goldLight],
  style,
}: StoryRingProps) {
  const ringSize = size + 6;

  return (
    <View style={[{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }, style]}>
      <LinearGradient
        colors={ringColors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.ring, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}
      >
        <View style={[styles.inner, { width: size + 2, height: size + 2, borderRadius: (size + 2) / 2 }]}>
          <AvatarWithStatus
            uri={uri}
            size={size}
            status={isOnline ? 'online' : undefined}
          />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    backgroundColor: COLORS.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
