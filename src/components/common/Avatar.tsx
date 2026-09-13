import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../../constants';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  variant?: 'circle' | 'rounded' | 'square';
}

// Paleta serena coherente con el design system
const PALETTE = [
  '#2A9D8F', '#5B8FB9', '#8E7CC3', '#4C9F87',
  '#C98A5E', '#B8879B', '#6BA3BF', '#7E9E68',
];

export function Avatar({ uri, name, size = 48, variant = 'circle' }: AvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const backgroundColor = stringToColor(name || 'default');

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: variant === 'circle' ? size / 2 : variant === 'rounded' ? size / 4 : 4,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: variant === 'circle' ? size / 2 : variant === 'rounded' ? size / 4 : 4,
          backgroundColor,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
        {initials}
      </Text>
    </View>
  );
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: COLORS.surfaceAlt,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
