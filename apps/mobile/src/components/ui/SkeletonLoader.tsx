import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS } from '../../constants/theme';

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function SkeletonItem({ width, height, borderRadius = RADIUS.md, style }: SkeletonProps) {
  const shimmer = useSharedValue(-1);

  React.useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [shimmer]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmer.value * 200 }],
  }));

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: COLORS.darkCard,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        <LinearGradient
          colors={['transparent', COLORS.darkBorder + '60', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[skeletonStyles.card, style]}>
      <SkeletonItem width="100%" height={180} borderRadius={0} />
      <View style={skeletonStyles.info}>
        <SkeletonItem width="70%" height={16} />
        <SkeletonItem width="50%" height={12} style={{ marginTop: 8 }} />
        <SkeletonItem width="40%" height={14} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

export function SkeletonProfile() {
  return (
    <View style={skeletonStyles.profile}>
      <SkeletonItem width="100%" height={320} borderRadius={0} />
      <View style={{ padding: 20, gap: 12 }}>
        <SkeletonItem width="60%" height={24} />
        <SkeletonItem width="80%" height={16} />
        <SkeletonItem width="100%" height={80} borderRadius={RADIUS.lg} />
      </View>
    </View>
  );
}

export function SkeletonChatItem() {
  return (
    <View style={skeletonStyles.chatItem}>
      <SkeletonItem width={48} height={48} borderRadius={24} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonItem width="50%" height={14} />
        <SkeletonItem width="80%" height={12} />
      </View>
    </View>
  );
}

export { SkeletonItem as Skeleton };

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.darkCard,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  info: { padding: 12 },
  profile: { flex: 1 },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
