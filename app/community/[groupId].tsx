import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as community from '@/utils/communityStorage';
import { Group, Post } from '@/types/community';
import { EmptyState } from '@/components';
import { formatRelativeTime } from '@/utils/dates';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

export default function GroupScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const navigation = useNavigation();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [g, p] = await Promise.all([community.getGroup(groupId), community.getPosts(groupId)]);
    setGroup(g);
    setPosts(p);
    setLoading(false);
    if (g) navigation.setOptions({ title: g.name });
  }, [groupId, navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading && !group) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          group?.description ? <Text style={styles.groupDesc}>{group.description}</Text> : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="No posts yet"
            subtitle="Be the first to share something with this group."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.postCard, pressed && styles.postCardPressed]}
            onPress={() => router.push(`/community/post/${item.id}`)}
          >
            <View style={styles.postHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(item.author?.displayName ?? '?').slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={styles.postHeaderText}>
                <Text style={styles.authorName}>{item.author?.displayName ?? 'Member'}</Text>
                <Text style={styles.timestamp}>{formatRelativeTime(item.createdAt)}</Text>
              </View>
            </View>
            {item.title && <Text style={styles.postTitle}>{item.title}</Text>}
            <Text style={styles.postBody} numberOfLines={4}>
              {item.body}
            </Text>
            {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.postImage} />}
            <View style={styles.postFooter}>
              <Ionicons name="chatbubble-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.commentCount}>{item.commentCount ?? 0} comments</Text>
            </View>
          </Pressable>
        )}
      />

      <Pressable
        style={styles.fab}
        onPress={() => router.push(`/community/new?groupId=${groupId}`)}
      >
        <Ionicons name="add" size={28} color={Colors.textInverse} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  content: { padding: Spacing.base, paddingBottom: 100, flexGrow: 1 },
  groupDesc: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  postCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  postCardPressed: { opacity: 0.92 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.primary },
  postHeaderText: { flex: 1 },
  authorName: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  timestamp: { fontSize: Typography.xs, color: Colors.textLight },
  postTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary },
  postBody: { fontSize: Typography.base, color: Colors.textSecondary, lineHeight: 21 },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.lg,
    resizeMode: 'cover',
  },
  postFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  commentCount: { fontSize: Typography.xs, color: Colors.textMuted },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
});
