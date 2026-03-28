import React from 'react';
import { View, StyleSheet, FlatList, Dimensions, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

interface Props {
  images: string[];
  height?: number;
  style?: ViewStyle;
}

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<string>);

export function PhotoCarousel({ images, height = 380, style }: Props) {
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => { scrollX.value = e.contentOffset.x; },
  });

  if (images.length === 0) return null;

  return (
    <View style={[{ height }, style]}>
      <AnimatedFlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }: { item: string }) => (
          <Image
            source={{ uri: item }}
            style={{ width: SCREEN_W, height }}
            contentFit="cover"
            transition={300}
            placeholder={{ blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH' }}
          />
        )}
      />
      {/* Dot indicators */}
      {images.length > 1 && (
        <View style={styles.dots}>
          {images.map((_, i) => (
            <Dot key={i} index={i} scrollX={scrollX} />
          ))}
        </View>
      )}
    </View>
  );
}

function Dot({ index, scrollX }: { index: number; scrollX: Animated.SharedValue<number> }) {
  const dotStyle = useAnimatedStyle(() => {
    const input = [(index - 1) * SCREEN_W, index * SCREEN_W, (index + 1) * SCREEN_W];
    const scale = interpolate(scrollX.value, input, [0.8, 1.3, 0.8], 'clamp');
    const opacity = interpolate(scrollX.value, input, [0.4, 1, 0.4], 'clamp');
    return { transform: [{ scale }], opacity };
  });

  return <Animated.View style={[styles.dot, dotStyle]} />;
}

const styles = StyleSheet.create({
  dots: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.gold,
  },
});
