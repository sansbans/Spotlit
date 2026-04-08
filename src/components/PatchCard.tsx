import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PatchWithStats } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { formatDate, formatDateShort } from '../utils/dates';

interface Props {
  patch: PatchWithStats;
  onPress: () => void;
  onLog?: () => void;
}

export function PatchCard({ patch, onPress, onLog }: Props) {
  const { stats } = patch;

  const progressColor = stats.progressPercent >= 80
    ? Colors.success
    : stats.progressPercent >= 40
    ? Colors.warning
    : Colors.secondary;

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      {/* Cover photo or placeholder */}
      <View style={styles.photoContainer}>
        {patch.coverPhoto ? (
          <Image source={{ uri: patch.coverPhoto }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="body-outline" size={32} color={Colors.accent} />
          </View>
        )}
        {/* Streak badge */}
        {stats.currentStreak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakFire}>🔥</Text>
            <Text style={styles.streakCount}>{stats.currentStreak}</Text>
          </View>
        )}
        {/* Needs log today indicator */}
        {!stats.loggedToday && (
          <View style={styles.needsLogDot} />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <Text style={styles.name} numberOfLines={1}>{patch.name}</Text>
            <Text style={styles.location}>{patch.bodyLocation}</Text>
          </View>
          {onLog && !stats.loggedToday && (
            <Pressable style={styles.logBtn} onPress={onLog}>
              <Ionicons name="camera" size={16} color={Colors.textInverse} />
              <Text style={styles.logBtnText}>Log</Text>
            </Pressable>
          )}
          {stats.loggedToday && (
            <View style={styles.doneBtn}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.doneBtnText}>Done</Text>
            </View>
          )}
        </View>

        {/* Progress bar */}
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${stats.progressPercent}%` as any, backgroundColor: progressColor },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {stats.totalLogged}/{patch.targetDays}d
          </Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatChip icon="calendar-outline" label={`Day ${Math.min(stats.totalLogged + 1, patch.targetDays)}`} />
          {stats.lastLogDate && (
            <StatChip icon="time-outline" label={`Last: ${formatDateShort(stats.lastLogDate)}`} />
          )}
          <StatChip icon="medical-outline" label={patch.medication ? patch.medication.split(' ')[0] : 'No meds'} />
        </View>
      </View>
    </Pressable>
  );
}

function StatChip({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={11} color={Colors.textMuted} />
      <Text style={styles.chipText} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.md,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  photoContainer: {
    height: 140,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    gap: 2,
  },
  streakFire: { fontSize: 12 },
  streakCount: {
    color: '#FFF',
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
  needsLogDot: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.error,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleGroup: { flex: 1, marginRight: Spacing.sm },
  name: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  location: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  logBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doneBtnText: {
    color: Colors.success,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  progressLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    width: 50,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surfaceWarm,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    maxWidth: 100,
  },
});
