import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle, LayoutAnimation, UIManager, Platform } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  style?: ViewStyle;
}

export function ExpandableSection({ title, icon, children, defaultExpanded = false, style }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={[styles.container, style]}>
      <Pressable onPress={toggle} style={styles.header}>
        <View style={styles.titleRow}>
          {icon && <Ionicons name={icon} size={16} color={COLORS.gold} />}
          <Text style={styles.title}>{title}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={COLORS.textMuted}
        />
      </Pressable>
      {expanded && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.body}>
          {children}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.darkCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.base,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  body: { paddingHorizontal: SPACING.base, paddingBottom: SPACING.base },
});
