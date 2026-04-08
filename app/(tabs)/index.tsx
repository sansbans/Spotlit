import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePatches } from '@/context/PatchContext';
import { PatchCard } from '@/components/PatchCard';
import { EmptyState } from '@/components/EmptyState';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { todayString, formatDate } from '@/utils/dates';

export default function HomeScreen() {
  const router = useRouter();
  const { patches, loading, refresh } = usePatches();
  const today = todayString();

  const activePatches = patches.filter((p) => p.isActive);
  const needsLogToday = activePatches.filter((p) => !p.stats.loggedToday);
  const totalStreak = activePatches.reduce((acc, p) => acc + p.stats.currentStreak, 0);
  const overallProgress =
    activePatches.length > 0
      ? Math.round(
          activePatches.reduce((acc, p) => acc + p.stats.progressPercent, 0) /
            activePatches.length
        )
      : 0;

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={refresh}
          tintColor={Colors.primary}
        />
      }
    >
      {/* Hero banner */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroGreeting}>Good{getTimeOfDay()},</Text>
            <Text style={styles.heroTitle}>Track your recovery</Text>
          </View>
          <View style={styles.heroDate}>
            <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.heroDateText}>{formatDate(today)}</Text>
          </View>
        </View>

        {/* Summary stats */}
        <View style={styles.heroStats}>
          <HeroStat value={activePatches.length} label="Active Patches" icon="body-outline" />
          <View style={styles.heroDivider} />
          <HeroStat value={`${totalStreak}d`} label="Combined Streak" icon="flame-outline" />
          <View style={styles.heroDivider} />
          <HeroStat value={`${overallProgress}%`} label="Avg Progress" icon="trending-up-outline" />
        </View>
      </LinearGradient>

      {/* Today's check-in banner */}
      {needsLogToday.length > 0 && (
        <View style={styles.checkInBanner}>
          <View style={styles.checkInLeft}>
            <View style={styles.checkInDot} />
            <View>
              <Text style={styles.checkInTitle}>
                {needsLogToday.length} patch{needsLogToday.length > 1 ? 'es' : ''} need today's log
              </Text>
              <Text style={styles.checkInSub}>Don't break your streak! Log now.</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
        </View>
      )}

      {/* Active patches */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Patches</Text>
          <Pressable onPress={() => router.push('/patches')}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        {activePatches.length === 0 ? (
          <EmptyState
            icon="body-outline"
            title="No patches tracked yet"
            subtitle="Start tracking a vitiligo patch to monitor your recovery journey."
            actionLabel="Add First Patch"
            onAction={() => router.push('/patch/add')}
          />
        ) : (
          activePatches.slice(0, 3).map((patch) => (
            <PatchCard
              key={patch.id}
              patch={patch}
              onPress={() => router.push(`/patch/${patch.id}`)}
              onLog={
                !patch.stats.loggedToday
                  ? () => router.push(`/log/${patch.id}`)
                  : undefined
              }
            />
          ))
        )}
      </View>

      {/* Quick tips */}
      {activePatches.length > 0 && (
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={20} color={Colors.gold} />
          <Text style={styles.tipText}>{DAILY_TIPS[new Date().getDay()]}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function HeroStat({ value, label, icon }: { value: string | number; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }) {
  return (
    <View style={styles.heroStatItem}>
      <Ionicons name={icon} size={16} color="rgba(255,255,255,0.7)" />
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return ' morning';
  if (h < 17) return ' afternoon';
  return ' evening';
}

const DAILY_TIPS = [
  'Apply ointment to a slightly damp skin for better absorption.',
  'Consistent application twice daily is more effective than sporadic use.',
  'Sun protection on affected areas helps prevent further depigmentation.',
  'Stress management can slow vitiligo progression — try 5 min of deep breathing.',
  'Some foods rich in antioxidants may support skin health.',
  'Keep your daily log streak going — consistency is key to recovery.',
  'NB-UVB phototherapy combined with topical treatment shows great results.',
];

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: {
    padding: Spacing.xl,
    paddingTop: Spacing['2xl'],
    gap: Spacing.xl,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroGreeting: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: Typography.base,
  },
  heroTitle: {
    color: Colors.textInverse,
    fontSize: Typography['2xl'],
    fontWeight: Typography.extrabold,
  },
  heroDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  heroDateText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.xs,
  },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  heroStatValue: {
    color: Colors.textInverse,
    fontSize: Typography.xl,
    fontWeight: Typography.extrabold,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: Typography.xs,
    textAlign: 'center',
  },
  heroDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 4,
  },

  checkInBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    margin: Spacing.base,
    marginBottom: 0,
    padding: Spacing.base,
    borderRadius: BorderRadius.xl,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    ...Shadows.sm,
  },
  checkInLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  checkInDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.error,
  },
  checkInTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  checkInSub: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },

  section: {
    padding: Spacing.base,
    paddingTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  seeAll: {
    fontSize: Typography.sm,
    color: Colors.primaryLight,
    fontWeight: Typography.semibold,
  },

  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    backgroundColor: Colors.surfaceWarm,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tipText: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
