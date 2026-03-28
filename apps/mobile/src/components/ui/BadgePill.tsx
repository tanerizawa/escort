import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, RADIUS, SPACING, TIER_COLORS, TIER_ICONS } from '../../constants/theme';

interface BadgePillProps {
  tier: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  showIcon?: boolean;
}

export function BadgePill({ tier, size = 'md', style, showIcon = true }: BadgePillProps) {
  const sizes = {
    sm: { px: 8, py: 2, fontSize: 9, iconSize: 8 },
    md: { px: 10, py: 4, fontSize: 11, iconSize: 10 },
    lg: { px: 14, py: 6, fontSize: 13, iconSize: 12 },
  };

  const s = sizes[size];
  const color = TIER_COLORS[tier] || COLORS.gold;
  const icon = TIER_ICONS[tier] || '◆';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color,
          paddingHorizontal: s.px,
          paddingVertical: s.py,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: s.fontSize }]}>
        {showIcon ? `${icon} ` : ''}{tier}
      </Text>
    </View>
  );
}

interface VerifiedBadgeProps {
  size?: number;
}

export function VerifiedBadge({ size = 16 }: VerifiedBadgeProps) {
  return (
    <View style={[styles.verified, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ fontSize: size * 0.6, color: COLORS.white }}>✓</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.xs,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    color: COLORS.textInverse,
    letterSpacing: 0.5,
  },
  verified: {
    backgroundColor: COLORS.info,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
