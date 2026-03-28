import React from 'react';
import { View, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { COLORS, SPACING } from '../../constants/theme';

interface AnimatedHeaderProps {
  children: React.ReactNode;
  headerContent: React.ReactNode;
  headerHeight?: number;
  minHeaderHeight?: number;
  style?: ViewStyle;
}

export function AnimatedHeader({
  children,
  headerContent,
  headerHeight = 200,
  minHeaderHeight = 80,
  style,
}: AnimatedHeaderProps) {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, headerHeight - minHeaderHeight],
      [headerHeight, minHeaderHeight],
      Extrapolation.CLAMP,
    );
    return { height };
  });

  const headerOpacity = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, (headerHeight - minHeaderHeight) * 0.5],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.header, headerStyle]}>
        <Animated.View style={[styles.headerContent, headerOpacity]}>
          {headerContent}
        </Animated.View>
      </Animated.View>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={{ height: headerHeight }} />
        {children}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.base,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
