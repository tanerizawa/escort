import React, { useState } from 'react';
import {
  TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, ANIMATION } from '../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function Input({
  label, error, containerStyle, style, icon, rightIcon, onRightIconPress, ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const focusAnim = useSharedValue(0);
  const shake = useSharedValue(0);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? COLORS.error
      : interpolateColor(focusAnim.value, [0, 1], [COLORS.darkBorder, COLORS.gold]),
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const handleFocus = (e: any) => {
    setFocused(true);
    focusAnim.value = withTiming(1, { duration: ANIMATION.fast });
    props.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    focusAnim.value = withTiming(0, { duration: ANIMATION.fast });
    props.onBlur?.(e);
  };

  // Trigger shake when error changes
  React.useEffect(() => {
    if (error) {
      shake.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [error]);

  return (
    <Animated.View style={[styles.container, shakeStyle, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <AnimatedView style={[styles.inputWrap, borderStyle]}>
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? COLORS.gold : COLORS.textMuted}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[styles.input, icon && { paddingLeft: 0 }, style]}
          placeholderTextColor={COLORS.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={label || props.placeholder}
          accessibilityState={{ disabled: props.editable === false }}
          {...props}
        />
        {rightIcon && (
          <Pressable onPress={onRightIconPress} hitSlop={10}>
            <Ionicons name={rightIcon} size={20} color={COLORS.textMuted} />
          </Pressable>
        )}
      </AnimatedView>
      {error && <Text style={styles.error}>{error}</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.base },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkInput,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.base,
    borderWidth: 1.5,
    borderColor: COLORS.darkBorder,
    gap: 10,
  },
  leftIcon: {},
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    paddingVertical: 14,
    paddingLeft: 0,
  },
  error: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
});
