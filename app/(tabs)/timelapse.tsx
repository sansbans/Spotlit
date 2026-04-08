import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePatches } from '@/context/PatchContext';
import { TimeLapsePlayer } from '@/components/TimeLapsePlayer';
import { EmptyState } from '@/components/EmptyState';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { PatchWithStats } from '@/types';

export default function TimeLapseScreen() {
  const router = useRouter();
  const { patches, loading } = usePatches();
  const activePatches = patches.filter((p) => p.isActive);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (activePatches.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="film-outline"
          title="No patches to play"
          subtitle="Add a vitiligo patch and log daily photos to build your timelapse."
          actionLabel="Add Patch"
          onAction={() => router.push('/patch/add')}
        />
      </View>
    );
  }

  const selectedPatch: PatchWithStats =
    (selectedId ? activePatches.find((p) => p.id === selectedId) : null) ?? activePatches[0];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Patch selector */}
      {activePatches.length > 1 && (
        <View>
          <Text style={styles.selectorLabel}>Select Patch</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectorRow}
          >
            {activePatches.map((p) => {
              const isSelected = p.id === selectedPatch.id;
              const withPhoto = p.logs.filter((l) => l.photo).length;
              return (
                <Pressable
                  key={p.id}
                  style={[styles.selectorChip, isSelected && styles.selectorChipActive]}
                  onPress={() => setSelectedId(p.id)}
                >
                  <Text
                    style={[styles.selectorChipText, isSelected && styles.selectorChipTextActive]}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                  <Text
                    style={[styles.selectorChipSub, isSelected && styles.selectorChipSubActive]}
                  >
                    {withPhoto} frames
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Header */}
      <View style={styles.playerHeader}>
        <View>
          <Text style={styles.playerTitle}>{selectedPatch.name}</Text>
          <Text style={styles.playerSub}>{selectedPatch.bodyLocation}</Text>
        </View>
        <Pressable
          style={styles.goToDetail}
          onPress={() => router.push(`/patch/${selectedPatch.id}`)}
        >
          <Ionicons name="open-outline" size={16} color={Colors.primaryLight} />
          <Text style={styles.goToDetailText}>Details</Text>
        </Pressable>
      </View>

      {/* How it works callout */}
      <View style={styles.howItWorks}>
        <Ionicons name="information-circle-outline" size={18} color={Colors.primaryLight} />
        <Text style={styles.howItWorksText}>
          One photo per day — played at 6fps — becomes your recovery story. Hit play to watch your healing journey.
        </Text>
      </View>

      {/* The timelapse player */}
      <TimeLapsePlayer
        logs={selectedPatch.logs}
        patchName={selectedPatch.name}
        targetDays={selectedPatch.targetDays}
      />

      {/* Log today CTA */}
      {!selectedPatch.stats.loggedToday && (
        <Pressable
          style={styles.logCta}
          onPress={() => router.push(`/log/${selectedPatch.id}`)}
        >
          <Ionicons name="camera" size={20} color={Colors.textInverse} />
          <Text style={styles.logCtaText}>Add Today's Frame</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, paddingBottom: 40, gap: Spacing.base },
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  selectorLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  selectorRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.base,
  },
  selectorChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceWarm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  selectorChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  selectorChipText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  selectorChipTextActive: { color: Colors.textInverse },
  selectorChipSub: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  selectorChipSubActive: { color: 'rgba(255,255,255,0.7)' },

  playerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  playerTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  playerSub: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  goToDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surfaceWarm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goToDetailText: {
    fontSize: Typography.sm,
    color: Colors.primaryLight,
    fontWeight: Typography.medium,
  },

  howItWorks: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceWarm,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'flex-start',
  },
  howItWorksText: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  logCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    ...Shadows.md,
  },
  logCtaText: {
    color: Colors.textInverse,
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  },
});
