import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface Props {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export function StreakBadge({ streak, size = 'md', animate = false }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animate && streak > 0) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }
  }, [streak, animate, scale]);

  const sizePx = size === 'sm' ? 40 : size === 'md' ? 56 : 72;
  const fontSize = size === 'sm' ? Typography.sm : size === 'md' ? Typography.md : Typography.xl;
  const emojiSize = size === 'sm' ? 16 : size === 'md' ? 22 : 30;

  const color = streak >= 30
    ? '#FF6B35'
    : streak >= 14
    ? '#FF9800'
    : streak >= 7
    ? Colors.gold
    : Colors.secondary;

  return (
    <Animated.View style={[styles.container, { width: sizePx, height: sizePx, borderColor: color, transform: [{ scale }] }]}>
      <Text style={{ fontSize: emojiSize }}>
        {streak >= 30 ? '🔥' : streak >= 7 ? '⭐' : '✨'}
      </Text>
      <Text style={[styles.count, { fontSize, color }]}>{streak}</Text>
      <Text style={[styles.label, { fontSize: Typography.xs, color }]}>day{streak !== 1 ? 's' : ''}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceWarm,
    gap: 0,
  },
  count: {
    fontWeight: Typography.extrabold,
    lineHeight: 18,
  },
  label: {
    fontWeight: Typography.medium,
    lineHeight: 12,
  },
});
