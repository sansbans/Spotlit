import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { usePatches } from '@/context/PatchContext';
import { PatchCard } from '@/components/PatchCard';
import { EmptyState } from '@/components/EmptyState';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

type Filter = 'active' | 'all' | 'completed';

export default function PatchesScreen() {
  const router = useRouter();
  const { patches, loading, refresh } = usePatches();
  const [filter, setFilter] = useState<Filter>('active');

  const filtered = patches.filter((p) => {
    if (filter === 'active') return p.isActive;
    if (filter === 'completed') return !p.isActive;
    return true;
  });

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['active', 'all', 'completed'] as Filter[]).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {' '}
              <Text style={styles.filterCount}>
                ({patches.filter((p) =>
                  f === 'active' ? p.isActive : f === 'completed' ? !p.isActive : true
                ).length})
              </Text>
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.list,
          filtered.length === 0 && styles.listEmpty,
        ]}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refresh} tintColor={Colors.primary} />
        }
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon="body-outline"
            title="No patches here"
            subtitle={
              filter === 'active'
                ? "Add your first patch to start tracking recovery."
                : filter === 'completed'
                ? "You haven't completed any 60-day journeys yet."
                : "No patches logged yet. Start your journey!"
            }
            actionLabel={filter !== 'completed' ? 'Add Patch' : undefined}
            onAction={filter !== 'completed' ? () => router.push('/patch/add') : undefined}
          />
        ) : (
          filtered.map((patch) => (
            <PatchCard
              key={patch.id}
              patch={patch}
              onPress={() => router.push(`/patch/${patch.id}`)}
              onLog={
                patch.isActive && !patch.stats.loggedToday
                  ? () => router.push(`/log/${patch.id}`)
                  : undefined
              }
            />
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push('/patch/add')}
      >
        <Ionicons name="add" size={28} color={Colors.textInverse} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  filterRow: {
    flexDirection: 'row',
    padding: Spacing.base,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    backgroundColor: Colors.surfaceWarm,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textMuted,
  },
  filterTabTextActive: {
    color: Colors.textInverse,
    fontWeight: Typography.semibold,
  },
  filterCount: {
    opacity: 0.7,
  },

  list: {
    padding: Spacing.base,
    paddingBottom: 100,
  },
  listEmpty: {
    flex: 1,
  },

  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabPressed: { transform: [{ scale: 0.95 }] },
});
