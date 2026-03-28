import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.3;

interface SwipeCardProps {
  children: React.ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
}

export function SwipeCard({ children, onSwipeRight, onSwipeLeft }: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const isActive = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onStart(() => {
      isActive.value = true;
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      isActive.value = false;
      if (e.translationX > SWIPE_THRESHOLD && onSwipeRight) {
        translateX.value = withTiming(SCREEN_W, { duration: 250 }, () => {
          runOnJS(onSwipeRight)();
          translateX.value = 0;
        });
      } else if (e.translationX < -SWIPE_THRESHOLD && onSwipeLeft) {
        translateX.value = withTiming(-SCREEN_W, { duration: 250 }, () => {
          runOnJS(onSwipeLeft)();
          translateX.value = 0;
        });
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 120 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${interpolate(translateX.value, [-SCREEN_W, 0, SCREEN_W], [-8, 0, 8], Extrapolation.CLAMP)}deg` },
    ],
  }));

  const rightActionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  const leftActionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.container}>
      {/* Swipe right hint (view detail) */}
      <Animated.View style={[styles.actionHint, styles.rightAction, rightActionStyle]}>
        <Ionicons name="eye-outline" size={24} color={COLORS.gold} />
        <Text style={styles.actionText}>Lihat</Text>
      </Animated.View>

      {/* Swipe left hint (skip) */}
      <Animated.View style={[styles.actionHint, styles.leftAction, leftActionStyle]}>
        <Ionicons name="close" size={24} color={COLORS.error} />
        <Text style={[styles.actionText, { color: COLORS.error }]}>Lewati</Text>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={cardStyle}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  actionHint: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  rightAction: {
    left: -4,
  },
  leftAction: {
    right: -4,
  },
  actionText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gold,
    marginTop: 2,
  },
});
