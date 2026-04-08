import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DailyLog } from '../types';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { formatDate } from '../utils/dates';

interface Props {
  log: DailyLog;
  onPress?: () => void;
}

const MOOD_CONFIG = {
  improving: { color: Colors.improving, icon: '↑', label: 'Improving' },
  same: { color: Colors.same, icon: '→', label: 'Same' },
  worsening: { color: Colors.worsening, icon: '↓', label: 'Worsening' },
};

export function LogCard({ log, onPress }: Props) {
  const mood = MOOD_CONFIG[log.progress];

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      {/* Thumbnail */}
      {log.photo ? (
        <Image source={{ uri: log.photo }} style={styles.thumbnail} />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <Ionicons name="image-outline" size={20} color={Colors.textMuted} />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.dayLabel}>Day {log.dayNumber}</Text>
          <View style={[styles.moodBadge, { backgroundColor: mood.color + '22' }]}>
            <Text style={[styles.moodText, { color: mood.color }]}>
              {mood.icon} {mood.label}
            </Text>
          </View>
        </View>
        <Text style={styles.date}>{formatDate(log.date)}</Text>

        {/* Ointment status */}
        <View style={styles.ointmentRow}>
          <Ionicons
            name={log.ointmentApplied ? 'checkmark-circle' : 'ellipse-outline'}
            size={14}
            color={log.ointmentApplied ? Colors.success : Colors.textMuted}
          />
          <Text style={[styles.ointmentText, !log.ointmentApplied && styles.ointmentMissed]}>
            {log.ointmentApplied
              ? `Ointment applied${log.ointmentName ? ` · ${log.ointmentName}` : ''}`
              : 'Ointment not logged'}
          </Text>
        </View>

        {log.notes ? (
          <Text style={styles.notes} numberOfLines={2}>{log.notes}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.sm,
  },
  pressed: { opacity: 0.85 },
  thumbnail: {
    width: 80,
    alignSelf: 'stretch',
    resizeMode: 'cover',
  },
  thumbnailPlaceholder: {
    width: 80,
    alignSelf: 'stretch',
    backgroundColor: Colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayLabel: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  moodBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  moodText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },
  date: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  ointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ointmentText: {
    fontSize: Typography.sm,
    color: Colors.success,
  },
  ointmentMissed: {
    color: Colors.textMuted,
  },
  notes: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
