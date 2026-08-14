import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import * as community from '@/utils/communityStorage';
import { Comment, Post } from '@/types/community';
import { formatRelativeTime } from '@/utils/dates';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { session } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, c] = await Promise.all([community.getPost(postId), community.getComments(postId)]);
    setPost(p);
    setComments(c);
    setLoading(false);
  }, [postId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSendComment = async () => {
    if (!session || !commentText.trim()) return;
    setSending(true);
    try {
      const comment = await community.addComment(session.user.id, postId, commentText.trim());
      setComments((prev) => [...prev, comment]);
      setCommentText('');
    } catch {
      Alert.alert('Error', 'Could not post your comment. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleReportPost = () => {
    if (!post || !session) return;
    Alert.alert('Report Post', 'Why are you reporting this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Spam',
        onPress: () => community.reportContent(session.user.id, 'post', post.id, 'spam'),
      },
      {
        text: 'Inappropriate',
        onPress: () => community.reportContent(session.user.id, 'post', post.id, 'inappropriate'),
      },
      {
        text: 'Misinformation',
        onPress: () => community.reportContent(session.user.id, 'post', post.id, 'misinformation'),
      },
    ]);
  };

  if (loading || !post) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={comments}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(post.author?.displayName ?? '?').slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={styles.postHeaderText}>
                <Text style={styles.authorName}>{post.author?.displayName ?? 'Member'}</Text>
                <Text style={styles.timestamp}>{formatRelativeTime(post.createdAt)}</Text>
              </View>
              <Pressable onPress={handleReportPost} hitSlop={8}>
                <Ionicons name="flag-outline" size={18} color={Colors.textLight} />
              </Pressable>
            </View>
            {post.title && <Text style={styles.postTitle}>{post.title}</Text>}
            <Text style={styles.postBody}>{post.body}</Text>
            {post.imageUrl && <Image source={{ uri: post.imageUrl }} style={styles.postImage} />}
            <Text style={styles.commentsHeading}>
              {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.noComments}>No comments yet. Be the first to reply.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.commentRow}>
            <View style={styles.commentAvatar}>
              <Text style={styles.commentAvatarText}>
                {(item.author?.displayName ?? '?').slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={styles.commentBody}>
              <Text style={styles.commentAuthor}>{item.author?.displayName ?? 'Member'}</Text>
              <Text style={styles.commentText}>{item.body}</Text>
              <Text style={styles.commentTime}>{formatRelativeTime(item.createdAt)}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.composer}>
        <TextInput
          style={styles.composerInput}
          value={commentText}
          onChangeText={setCommentText}
          placeholder="Add a comment…"
          placeholderTextColor={Colors.textLight}
          multiline
        />
        <Pressable
          style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
          onPress={handleSendComment}
          disabled={sending || !commentText.trim()}
        >
          {sending ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Ionicons name="send" size={18} color="#FFF" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  content: { padding: Spacing.base, paddingBottom: 20 },
  postCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.primary },
  postHeaderText: { flex: 1 },
  authorName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  timestamp: { fontSize: Typography.xs, color: Colors.textLight },
  postTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  postBody: { fontSize: Typography.base, color: Colors.textSecondary, lineHeight: 22 },
  postImage: { width: '100%', height: 220, borderRadius: BorderRadius.lg, resizeMode: 'cover' },
  commentsHeading: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  noComments: {
    textAlign: 'center',
    fontSize: Typography.sm,
    color: Colors.textMuted,
    paddingVertical: Spacing.xl,
  },
  commentRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.primaryLight },
  commentBody: {
    flex: 1,
    backgroundColor: Colors.surfaceWarm,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
  },
  commentAuthor: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  commentText: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2, lineHeight: 19 },
  commentTime: { fontSize: Typography.xs, color: Colors.textLight, marginTop: 4 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    padding: Spacing.base,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  composerInput: {
    flex: 1,
    backgroundColor: Colors.surfaceWarm,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
