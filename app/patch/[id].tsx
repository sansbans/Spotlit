import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePatches } from '@/context/PatchContext';
import { LogCard } from '@/components/LogCard';
import { StreakBadge } from '@/components/StreakBadge';
import { EmptyState } from '@/components/EmptyState';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { formatDate } from '@/utils/dates';

const { width: W } = Dimensions.get('window');

export default function PatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getPatchById, deletePatch, updatePatch } = usePatches();
  const patch = getPatchById(id);
  const [showAllLogs, setShowAllLogs] = useState(false);

  if (!patch) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Patch not found.</Text>
      </View>
    );
  }

  const { stats, logs } = patch;
  const displayLogs = showAllLogs ? [...logs].reverse() : [...logs].reverse().slice(0, 5);

  const handleDelete = () => {
    Alert.alert(
      'Delete Patch',
      `Delete "${patch.name}" and all its logs? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePatch(patch.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleToggleActive = () => {
    Alert.alert(
      patch.isActive ? 'Mark as Completed' : 'Reactivate Patch',
      patch.isActive
        ? 'Mark this patch as completed? You can reactivate it later.'
        : 'Reactivate tracking for this patch?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: patch.isActive ? 'Complete' : 'Reactivate',
          onPress: () => updatePatch(patch.id, { isActive: !patch.isActive }),
        },
      ]
    );
  };

  const progressColor =
    stats.progressPercent >= 80
      ? Colors.success
      : stats.progressPercent >= 40
      ? Colors.warning
      : Colors.secondary;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Hero image */}
      <View style={styles.heroContainer}>
        {patch.coverPhoto ? (
          <Image source={{ uri: patch.coverPhoto }} style={styles.heroImage} />
        ) : (
          <LinearGradient
            colors={[Colors.primaryLight, Colors.secondary]}
            style={styles.heroPlaceholder}
          >
            <Ionicons name="body-outline" size={60} color="rgba(255,255,255,0.5)" />
          </LinearGradient>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.heroOverlay}
        >
          <Text style={styles.heroName}>{patch.name}</Text>
          <Text style={styles.heroLocation}>{patch.bodyLocation}</Text>
          {!patch.isActive && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
          )}
        </LinearGradient>

        {/* Action buttons */}
        <View style={styles.heroActions}>
          <Pressable style={styles.heroActionBtn} onPress={handleToggleActive}>
            <Ionicons
              name={patch.isActive ? 'checkmark-done-outline' : 'refresh-outline'}
              size={18}
              color={Colors.textInverse}
            />
          </Pressable>
          <Pressable style={[styles.heroActionBtn, styles.heroActionBtnDanger]} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={Colors.textInverse} />
          </Pressable>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatBox label="Started" value={formatDate(patch.startDate)} small />
        <View style={styles.statsDivider} />
        <StatBox label="Streak" value={<StreakBadge streak={stats.currentStreak} animate />} small />
        <View style={styles.statsDivider} />
        <StatBox label="Logged" value={`${stats.totalLogged}/${patch.targetDays}`} small />
      </View>

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Recovery Progress</Text>
          <Text style={[styles.progressPercent, { color: progressColor }]}>
            {stats.progressPercent}%
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${stats.progressPercent}%` as any, backgroundColor: progressColor }]} />
        </View>
        <Text style={styles.progressSub}>
          {stats.totalLogged} of {patch.targetDays} days logged
          {stats.totalLogged >= patch.targetDays ? ' — Journey Complete! 🎉' : ''}
        </Text>
      </View>

      {/* Detail cards */}
      <View style={styles.detailsGrid}>
        {patch.stressor ? (
          <DetailCard icon="flash-outline" label="Stressor" value={patch.stressor} />
        ) : null}
        {patch.medication ? (
          <DetailCard icon="medical-outline" label="Medication" value={patch.medication} />
        ) : null}
        {patch.cause ? (
          <DetailCard icon="information-circle-outline" label="How it occurred" value={patch.cause} fullWidth />
        ) : null}
        {patch.notes ? (
          <DetailCard icon="document-text-outline" label="Notes" value={patch.notes} fullWidth />
        ) : null}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        {patch.isActive && !stats.loggedToday && (
          <Pressable
            style={styles.logBtn}
            onPress={() => router.push(`/log/${patch.id}`)}
          >
            <Ionicons name="camera" size={22} color={Colors.textInverse} />
            <Text style={styles.logBtnText}>Log Today</Text>
          </Pressable>
        )}
        {stats.loggedToday && (
          <View style={styles.loggedTodayBanner}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.loggedTodayText}>Today's log is complete!</Text>
          </View>
        )}
        <Pressable
          style={styles.timelapseBtn}
          onPress={() => router.push('/timelapse')}
        >
          <Ionicons name="film-outline" size={20} color={Colors.primaryLight} />
          <Text style={styles.timelapseBtnText}>Watch Timelapse</Text>
        </Pressable>
      </View>

      {/* Log history */}
      <View style={styles.logsSection}>
        <View style={styles.logsSectionHeader}>
          <Text style={styles.logsSectionTitle}>Log History</Text>
          <Text style={styles.logsCount}>{logs.length} entries</Text>
        </View>

        {logs.length === 0 ? (
          <EmptyState
            icon="camera-outline"
            title="No logs yet"
            subtitle="Start logging today's photo and ointment application."
            actionLabel="Log Now"
            onAction={() => router.push(`/log/${patch.id}`)}
          />
        ) : (
          <>
            {displayLogs.map((log) => (
              <LogCard key={log.id} log={log} />
            ))}
            {logs.length > 5 && (
              <Pressable
                style={styles.showMoreBtn}
                onPress={() => setShowAllLogs((v) => !v)}
              >
                <Text style={styles.showMoreText}>
                  {showAllLogs ? 'Show less' : `Show all ${logs.length} logs`}
                </Text>
                <Ionicons
                  name={showAllLogs ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors.primaryLight}
                />
              </Pressable>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function StatBox({ label, value, small }: { label: string; value: React.ReactNode; small?: boolean }) {
  return (
    <View style={styles.statBox}>
      {typeof value === 'string' ? (
        <Text style={[styles.statValue, small && styles.statValueSmall]} numberOfLines={2}>
          {value}
        </Text>
      ) : value}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DetailCard({
  icon, label, value, fullWidth,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <View style={[styles.detailCard, fullWidth && styles.detailCardFull]}>
      <View style={styles.detailHeader}>
        <Ionicons name={icon} size={14} color={Colors.primaryLight} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: Typography.lg, color: Colors.textMuted },

  heroContainer: {
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  heroName: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.extrabold,
    color: '#FFF',
  },
  heroLocation: {
    fontSize: Typography.base,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  completedBadge: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
  },
  completedBadgeText: {
    color: '#FFF',
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
  heroActions: {
    position: 'absolute',
    top: Spacing.base,
    right: Spacing.base,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  heroActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActionBtnDanger: { backgroundColor: 'rgba(244,67,54,0.6)' },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base,
    marginTop: -Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadows.lg,
    overflow: 'visible',
  },
  statBox: {
    flex: 1,
    padding: Spacing.base,
    alignItems: 'center',
    gap: 4,
  },
  statsDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  statValue: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  statValueSmall: { fontSize: Typography.sm },
  statLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  progressSection: {
    margin: Spacing.base,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  progressPercent: {
    fontSize: Typography.xl,
    fontWeight: Typography.extrabold,
  },
  progressTrack: {
    height: 10,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  progressSub: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },

  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  detailCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  detailCardFull: { width: '100%' },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },

  actions: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    ...Shadows.md,
  },
  logBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  },
  loggedTodayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success + '44',
  },
  loggedTodayText: {
    fontSize: Typography.base,
    color: Colors.success,
    fontWeight: Typography.semibold,
  },
  timelapseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceWarm,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  timelapseBtnText: {
    color: Colors.primaryLight,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },

  logsSection: {
    padding: Spacing.base,
    paddingTop: 0,
  },
  logsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logsSectionTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  logsCount: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceWarm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  showMoreText: {
    fontSize: Typography.sm,
    color: Colors.primaryLight,
    fontWeight: Typography.medium,
  },
});
