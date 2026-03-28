import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TIER_COLORS, RADIUS, SHADOWS, SPACING, ANIMATION, GRADIENTS, resolvePhotoUrl } from '../constants/theme';
import { EscortListItem } from '../constants/types';
import { useHaptic } from '../hooks/useHaptic';
import { usePresenceStore } from '../stores/presence';

interface EscortCardProps {
  escort: EscortListItem;
  onPress: () => void;
  style?: ViewStyle;
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function EscortCard({ escort, onPress, style, index = 0 }: EscortCardProps) {
  const { user, tier, hourlyRate, ratingAvg, totalBookings, skills } = escort;
  const photoUri = resolvePhotoUrl(user.profilePhoto);
  const isOnline = usePresenceStore((s) => s.isOnline(user.id));
  // Vary image height for masonry effect
  const imageHeight = index % 3 === 0 ? 220 : index % 3 === 1 ? 180 : 200;

  const scale = useSharedValue(1);
  const { light } = useHaptic();

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const tierColor = TIER_COLORS[tier] || COLORS.gold;

  return (
    <Animated.View
      entering={FadeIn.delay(index * 80).duration(400)}
      style={[style]}
    >
      <AnimatedPressable
        onPress={() => { light(); onPress(); }}
        onPressIn={() => { scale.value = withSpring(0.96, ANIMATION.springBouncy); }}
        onPressOut={() => { scale.value = withSpring(1, ANIMATION.springSmooth); }}
        accessibilityRole="button"
        accessibilityLabel={`${user.firstName} ${user.lastName}, ${tier}, Rating ${ratingAvg.toFixed(1)}, Rp ${hourlyRate.toLocaleString('id-ID')} per jam`}
        accessibilityHint="Ketuk untuk melihat profil"
        style={[styles.card, SHADOWS.md, animStyle]}
      >
        {/* Image section */}
        <View style={styles.imageWrap}>
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={[styles.image, { height: imageHeight }]}
              contentFit="cover"
              transition={300}
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            />
          ) : (
            <View style={[styles.image, styles.placeholder, { height: imageHeight }]}>
              <Ionicons name="person" size={36} color={COLORS.textMuted} />
            </View>
          )}

          {/* Gradient overlay at bottom of image */}
          <LinearGradient
            colors={['transparent', 'rgba(19,27,46,0.9)']}
            style={styles.imageOverlay}
          />

          {/* Tier badge */}
          <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
            <Text style={styles.tierText}>{tier}</Text>
          </View>

          {/* Rating on image */}
          <View style={styles.ratingOnImage}>
            <Ionicons name="star" size={11} color={COLORS.gold} />
            <Text style={styles.ratingOnImageText}>{ratingAvg.toFixed(1)}</Text>
          </View>

          {/* Online indicator */}
          {isOnline && (
            <View style={styles.onlineDot} />
          )}
        </View>

        {/* Info section */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {user.firstName} {user.lastName}
          </Text>

          {skills.length > 0 && (
            <Text style={styles.skills} numberOfLines={1}>
              {skills.slice(0, 2).join(' · ')}
            </Text>
          )}

          <View style={styles.bottomRow}>
            <Text style={styles.rate}>
              Rp {hourlyRate.toLocaleString('id-ID')}
            </Text>
            <Text style={styles.rateUnit}>/jam</Text>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.darkCard,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
  },
  placeholder: {
    backgroundColor: COLORS.darkInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  tierBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  tierText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textInverse,
    letterSpacing: 0.5,
  },
  ratingOnImage: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(11,17,32,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  ratingOnImageText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gold,
  },
  onlineDot: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.online,
    borderWidth: 1.5,
    borderColor: COLORS.darkCard,
  },
  info: {
    padding: SPACING.md,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  skills: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  rate: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gold,
  },
  rateUnit: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: 2,
  },
});
