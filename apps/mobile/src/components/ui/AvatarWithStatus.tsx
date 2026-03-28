import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '../../constants/theme';

interface AvatarWithStatusProps {
  uri?: string | null;
  size?: number;
  status?: 'online' | 'away' | 'offline';
  borderColor?: string;
  style?: ViewStyle;
}

export function AvatarWithStatus({
  uri,
  size = 48,
  status,
  borderColor,
  style,
}: AvatarWithStatusProps) {
  const borderW = borderColor ? 2.5 : 0;

  return (
    <View style={[{ width: size, height: size }, style]} accessibilityRole="image" accessibilityLabel="Foto profil">
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: borderW,
            borderColor: borderColor || 'transparent',
          },
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={[styles.image, { width: size - borderW * 2, height: size - borderW * 2, borderRadius: (size - borderW * 2) / 2 }]}
            contentFit="cover"
            transition={300}
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          />
        ) : (
          <View
            style={[
              styles.placeholder,
              {
                width: size - borderW * 2,
                height: size - borderW * 2,
                borderRadius: (size - borderW * 2) / 2,
              },
            ]}
          >
            <View style={styles.placeholderIcon}>
              <View style={[styles.head, { width: size * 0.25, height: size * 0.25, borderRadius: size * 0.125 }]} />
              <View style={[styles.body, { width: size * 0.4, height: size * 0.2, borderRadius: size * 0.1 }]} />
            </View>
          </View>
        )}
      </View>
      {status && (
        <View
          style={[
            styles.statusDot,
            {
              width: size * 0.28,
              height: size * 0.28,
              borderRadius: size * 0.14,
              borderWidth: 2,
              borderColor: COLORS.dark,
              backgroundColor:
                status === 'online' ? COLORS.online
                : status === 'away' ? COLORS.away
                : COLORS.offline,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {},
  placeholder: {
    backgroundColor: COLORS.darkCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    alignItems: 'center',
    gap: 2,
  },
  head: {
    backgroundColor: COLORS.textMuted,
  },
  body: {
    backgroundColor: COLORS.textMuted,
  },
  statusDot: {
    position: 'absolute',
  },
});
