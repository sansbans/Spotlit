import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import * as community from '@/utils/communityStorage';
import { Group } from '@/types/community';
import { EmptyState } from '@/components';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

export default function CommunityScreen() {
  const { session } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const [allGroups, myIds] = await Promise.all([
      community.getGroups(),
      community.getMyGroupIds(session.user.id),
    ]);
    setGroups(allGroups);
    setMyGroupIds(new Set(myIds));
    setLoading(false);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleGroupPress = async (group: Group) => {
    if (!session) return;
    if (!myGroupIds.has(group.id)) {
      setJoiningId(group.id);
      try {
        await community.joinGroup(session.user.id, group.id);
        setMyGroupIds((prev) => new Set(prev).add(group.id));
      } finally {
        setJoiningId(null);
      }
    }
    router.push(`/community/${group.id}`);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={groups}
      keyExtractor={(g) => g.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Groups</Text>
              <Text style={styles.headerSub}>
                Share your journey and learn from others tracking vitiligo.
              </Text>
            </View>
            <Pressable style={styles.newGroupBtn} onPress={() => router.push('/community/new-group')}>
              <Ionicons name="add" size={20} color={Colors.textInverse} />
            </Pressable>
          </View>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          icon="people-outline"
          title="No groups yet"
          subtitle="Check back soon — groups are on their way."
        />
      }
      renderItem={({ item }) => {
        const joined = myGroupIds.has(item.id);
        return (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => handleGroupPress(item)}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="people" size={22} color={Colors.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardName}>{item.name}</Text>
              {item.description && (
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              {item.memberCount !== undefined && (
                <Text style={styles.cardMeta}>
                  {item.memberCount} {item.memberCount === 1 ? 'member' : 'members'}
                </Text>
              )}
            </View>
            {joiningId === item.id ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : joined ? (
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            ) : (
              <View style={styles.joinBadge}>
                <Text style={styles.joinBadgeText}>Join</Text>
              </View>
            )}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  content: { padding: Spacing.base, paddingBottom: 40, backgroundColor: Colors.background, flexGrow: 1 },
  header: { marginBottom: Spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  headerTextWrap: { flex: 1 },
  newGroupBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: Typography.base,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  cardPressed: { opacity: 0.9 },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 2 },
  cardName: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  cardDesc: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  cardMeta: {
    fontSize: Typography.xs,
    color: Colors.textLight,
    marginTop: 2,
  },
  joinBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  joinBadgeText: {
    color: Colors.textInverse,
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },
});
