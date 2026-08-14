import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import * as community from '@/utils/communityStorage';
import { PhotoCapture } from '@/components/PhotoCapture';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

export default function NewPostScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePost = async () => {
    if (!session) return;
    if (!body.trim()) {
      Alert.alert('Say something first', 'Write a message before posting.');
      return;
    }
    setSubmitting(true);
    try {
      const post = await community.createPost(session.user.id, {
        groupId,
        title: title.trim(),
        body: body.trim(),
        imageLocalUri: photo,
      });
      router.replace(`/community/post/${post.id}`);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not create your post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Title (optional)</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Give your post a title"
          placeholderTextColor={Colors.textLight}
        />

        <Text style={styles.label}>What's on your mind?</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={body}
          onChangeText={setBody}
          placeholder="Share progress, ask a question, offer support…"
          placeholderTextColor={Colors.textLight}
          multiline
          numberOfLines={6}
        />

        <Text style={styles.label}>Photo (optional)</Text>
        <PhotoCapture uri={photo} onCapture={setPhoto} onClear={() => setPhoto(null)} size="md" />

        <Text style={styles.hint}>
          Photos you post here are visible to everyone in the group — this is separate from your
          private patch-tracking photos, which are never shared automatically.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
        <Pressable style={styles.postBtn} onPress={handlePost} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, gap: Spacing.sm, paddingBottom: 40 },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  inputMulti: { minHeight: 120, textAlignVertical: 'top', paddingTop: Spacing.md },
  hint: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    lineHeight: 16,
    marginTop: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.base,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  cancelBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceWarm,
  },
  cancelBtnText: { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: Typography.medium },
  postBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
  },
  postBtnText: { color: Colors.textInverse, fontSize: Typography.base, fontWeight: Typography.bold },
});
