import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DailyLog } from '../types';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { formatDateShort } from '../utils/dates';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PLAYER_HEIGHT = SCREEN_WIDTH * 1.1;

interface Props {
  logs: DailyLog[];
  patchName: string;
  targetDays: number;
}

type Speed = 0.5 | 1 | 2 | 4;
const SPEEDS: Speed[] = [0.5, 1, 2, 4];
const BASE_FPS = 6; // frames per second at 1x

export function TimeLapsePlayer({ logs, patchName, targetDays }: Props) {
  const frames = logs.filter((l) => l.photo !== null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const opacity = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const crossfadeTo = useCallback((nextIndex: number) => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0, duration: 60, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 60, useNativeDriver: true }),
    ]).start();
    setCurrentIndex(nextIndex);
  }, [opacity]);

  useEffect(() => {
    if (isPlaying && frames.length > 1) {
      const ms = 1000 / (BASE_FPS * speed);
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          crossfadeTo(prev + 1);
          return prev + 1;
        });
      }, ms);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [isPlaying, speed, frames.length, crossfadeTo]);

  const togglePlay = () => {
    if (currentIndex >= frames.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying((p) => !p);
  };

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    setSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
  };

  const seek = (index: number) => {
    clearTimer();
    setIsPlaying(false);
    crossfadeTo(index);
  };

  if (frames.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="film-outline" size={48} color={Colors.accent} />
        <Text style={styles.emptyTitle}>No frames yet</Text>
        <Text style={styles.emptySubtitle}>
          Log a photo each day to build your timelapse. You have {targetDays - frames.length} frames to go!
        </Text>
      </View>
    );
  }

  const frame = frames[currentIndex];
  const progress = frames.length > 1 ? currentIndex / (frames.length - 1) : 0;

  return (
    <View style={styles.container}>
      {/* Film frame */}
      <View style={styles.filmFrame}>
        <Animated.View style={{ opacity, flex: 1 }}>
          <Image source={{ uri: frame.photo! }} style={styles.frameImage} />
        </Animated.View>

        {/* Overlay: day counter + date */}
        <View style={styles.overlay}>
          <View style={styles.dayBadge}>
            <Text style={styles.dayNumber}>Day {frame.dayNumber}</Text>
          </View>
          <Text style={styles.dateLabel}>{formatDateShort(frame.date)}</Text>
        </View>

        {/* Progress indicator */}
        {frame.progress && (
          <View style={[
            styles.moodTag,
            frame.progress === 'improving' && styles.moodImproving,
            frame.progress === 'same' && styles.moodSame,
            frame.progress === 'worsening' && styles.moodWorsening,
          ]}>
            <Text style={styles.moodText}>
              {frame.progress === 'improving' ? '↑ Improving'
                : frame.progress === 'worsening' ? '↓ Worsening'
                : '→ Same'}
            </Text>
          </View>
        )}

        {/* Frame counter */}
        <View style={styles.frameCounter}>
          <Text style={styles.frameCounterText}>
            {currentIndex + 1} / {frames.length}
          </Text>
        </View>
      </View>

      {/* Scrubber */}
      <View style={styles.scrubberArea}>
        <View style={styles.scrubberTrack}>
          <View style={[styles.scrubberFill, { width: `${progress * 100}%` as any }]} />
        </View>
        {/* Tick marks for each frame */}
        <View style={styles.tickRow}>
          {frames.map((_, i) => (
            <Pressable
              key={i}
              style={[styles.tick, i === currentIndex && styles.tickActive]}
              onPress={() => seek(i)}
            />
          ))}
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Rewind */}
        <Pressable
          style={styles.controlBtn}
          onPress={() => seek(Math.max(0, currentIndex - 1))}
        >
          <Ionicons name="play-back" size={22} color={Colors.textPrimary} />
        </Pressable>

        {/* Play/Pause */}
        <Pressable style={styles.playBtn} onPress={togglePlay}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={28}
            color={Colors.textInverse}
          />
        </Pressable>

        {/* Forward */}
        <Pressable
          style={styles.controlBtn}
          onPress={() => seek(Math.min(frames.length - 1, currentIndex + 1))}
        >
          <Ionicons name="play-forward" size={22} color={Colors.textPrimary} />
        </Pressable>

        {/* Speed */}
        <Pressable style={styles.speedBtn} onPress={cycleSpeed}>
          <Text style={styles.speedText}>{speed}x</Text>
        </Pressable>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <StatItem label="Frames" value={`${frames.length}`} />
        <StatItem label="Duration" value={`~${Math.round(frames.length / (BASE_FPS * speed))}s`} />
        <StatItem label="Coverage" value={`${Math.round((frames.length / targetDays) * 100)}%`} />
        <StatItem label="Days left" value={`${Math.max(0, targetDays - frames.length)}`} />
      </View>
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  empty: {
    alignItems: 'center',
    padding: Spacing['4xl'],
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: Typography.base,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  filmFrame: {
    height: PLAYER_HEIGHT,
    backgroundColor: '#000',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  frameImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: Spacing.base,
    left: Spacing.base,
    flexDirection: 'column',
    gap: 4,
  },
  dayBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  dayNumber: {
    color: Colors.textInverse,
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
  dateLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    marginLeft: 4,
  },
  moodTag: {
    position: 'absolute',
    top: Spacing.base,
    right: Spacing.base,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  moodImproving: { backgroundColor: 'rgba(76,175,80,0.85)' },
  moodSame: { backgroundColor: 'rgba(255,152,0,0.85)' },
  moodWorsening: { backgroundColor: 'rgba(244,67,54,0.85)' },
  moodText: {
    color: '#FFF',
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
  frameCounter: {
    position: 'absolute',
    bottom: Spacing.base,
    right: Spacing.base,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  frameCounterText: {
    color: '#FFF',
    fontSize: Typography.xs,
  },
  scrubberArea: {
    paddingHorizontal: Spacing.xs,
    gap: Spacing.xs,
  },
  scrubberTrack: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  scrubberFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  tickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  tick: {
    width: 3,
    height: 8,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
  },
  tickActive: {
    backgroundColor: Colors.primary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedText: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceWarm,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
});
