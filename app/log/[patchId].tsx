import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { usePatches } from '@/context/PatchContext';
import { PhotoCapture } from '@/components/PhotoCapture';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { ProgressMood } from '@/types';
import { todayString, formatDate } from '@/utils/dates';

export default function DailyLogScreen() {
  const { patchId } = useLocalSearchParams<{ patchId: string }>();
  const router = useRouter();
  const { getPatchById, addLog: doAddLog } = usePatches();

  const patch = getPatchById(patchId);
  const today = todayString();

  const existingLog = patch?.logs.find((l) => l.date === today) ?? null;

  const [photo, setPhoto] = useState<string | null>(existingLog?.photo ?? null);
  const [ointmentApplied, setOintmentApplied] = useState(existingLog?.ointmentApplied ?? false);
  const [ointmentName, setOintmentName] = useState(existingLog?.ointmentName ?? patch?.medication ?? '');
  const [notes, setNotes] = useState(existingLog?.notes ?? '');
  const [progress, setProgress] = useState<ProgressMood>(existingLog?.progress ?? 'same');
  const [saving, setSaving] = useState(false);

  // If already logged today, show in edit mode
  const alreadyLogged = !!existingLog;

  if (!patch) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Patch not found.</Text>
      </View>
    );
  }

  const dayNumber = patch.logs.length + (alreadyLogged ? 0 : 1);

  const handleSave = async () => {
    if (!photo) {
      Alert.alert(
        'Photo required',
        'Please take a photo of your patch — this is your daily timelapse frame!',
        [
          { text: 'Skip', onPress: () => doSave() },
          { text: 'Take Photo', style: 'cancel' },
        ]
      );
      return;
    }
    await doSave();
  };

  const doSave = async () => {
    setSaving(true);
    try {
      await doAddLog({
        patchId: patch.id,
        date: today,
        photo,
        ointmentApplied,
        ointmentName: ointmentName.trim(),
        applicationTime: new Date().toTimeString().slice(0, 5),
        notes: notes.trim(),
        progress,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save log. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const MOODS: { value: ProgressMood; label: string; emoji: string; color: string }[] = [
    { value: 'improving', label: 'Improving', emoji: '↑', color: Colors.improving },
    { value: 'same', label: 'Same', emoji: '→', color: Colors.same },
    { value: 'worsening', label: 'Worsening', emoji: '↓', color: Colors.worsening },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.patchName}>{patch.name}</Text>
            <Text style={styles.dateLabel}>{formatDate(today)}</Text>
          </View>
          <View style={styles.dayBadge}>
            <Text style={styles.dayNumber}>Day {dayNumber}</Text>
          </View>
        </View>

        {/* Timelapse reminder */}
        <View style={styles.timelapseBanner}>
          <Text style={styles.timelapseEmoji}>🎬</Text>
          <Text style={styles.timelapseBannerText}>
            This photo becomes Frame {dayNumber} of your recovery timelapse. Same angle = best results!
          </Text>
        </View>

        {/* Photo section */}
        <SectionTitle icon="camera" title="Today's Photo *" />
        <PhotoCapture
          uri={photo}
          onCapture={setPhoto}
          onClear={() => setPhoto(null)}
          label="Photograph Your Patch"
          size="lg"
        />

        {/* Progress mood */}
        <SectionTitle icon="trending-up-outline" title="Today's Progress" />
        <View style={styles.moodRow}>
          {MOODS.map((m) => (
            <Pressable
              key={m.value}
              style={[
                styles.moodBtn,
                progress === m.value && { backgroundColor: m.color, borderColor: m.color },
              ]}
              onPress={() => {
                setProgress(m.value);
                Haptics.selectionAsync();
              }}
            >
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text
                style={[
                  styles.moodLabel,
                  progress === m.value && styles.moodLabelSelected,
                ]}
              >
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Ointment section */}
        <SectionTitle icon="medical-outline" title="Ointment Application" />
        <View style={styles.ointmentCard}>
          <View style={styles.ointmentToggleRow}>
            <View style={styles.ointmentToggleLeft}>
              <Ionicons
                name={ointmentApplied ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={ointmentApplied ? Colors.success : Colors.textMuted}
              />
              <View>
                <Text style={styles.ointmentToggleLabel}>Applied today</Text>
                <Text style={styles.ointmentToggleSub}>
                  {ointmentApplied ? 'Great job! Keep it consistent.' : 'Tap to mark as applied'}
                </Text>
              </View>
            </View>
            <Switch
              value={ointmentApplied}
              onValueChange={(v) => {
                setOintmentApplied(v);
                if (v) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              trackColor={{ true: Colors.success, false: Colors.borderLight }}
              thumbColor="#FFF"
            />
          </View>

          {ointmentApplied && (
            <View style={styles.ointmentNameField}>
              <Text style={styles.ointmentNameLabel}>Ointment / Treatment</Text>
              <TextInput
                style={styles.ointmentInput}
                value={ointmentName}
                onChangeText={setOintmentName}
                placeholder="e.g. Tacrolimus 0.1%"
                placeholderTextColor={Colors.textLight}
              />
            </View>
          )}
        </View>

        {/* Notes */}
        <SectionTitle icon="create-outline" title="Notes" />
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any observations today? Changes in color, texture, size..."
          placeholderTextColor={Colors.textLight}
          multiline
          numberOfLines={4}
        />
      </ScrollView>

      {/* Save button */}
      <View style={styles.saveRow}>
        <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
        <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#FFF" />
              <Text style={styles.saveBtnText}>{alreadyLogged ? 'Update Log' : 'Save Log'}</Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
}) {
  return (
    <View style={styles.sectionTitle}>
      <Ionicons name={icon} size={16} color={Colors.primaryLight} />
      <Text style={styles.sectionTitleText}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.base, paddingBottom: 20, gap: Spacing.xl },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: Typography.lg, color: Colors.textMuted },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: { flex: 1, gap: 4 },
  patchName: {
    fontSize: Typography.xl,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
  },
  dateLabel: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  dayBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  dayNumber: {
    color: Colors.textInverse,
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },

  timelapseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceWarm,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  timelapseEmoji: { fontSize: 22 },
  timelapseBannerText: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: -Spacing.md,
  },
  sectionTitleText: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  moodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  moodBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceWarm,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  moodEmoji: { fontSize: 22 },
  moodLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  moodLabelSelected: {
    color: Colors.textInverse,
  },

  ointmentCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  ointmentToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  ointmentToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  ointmentToggleLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  ointmentToggleSub: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  ointmentNameField: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  ointmentNameLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ointmentInput: {
    backgroundColor: Colors.surfaceWarm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },

  notesInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },

  saveRow: {
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
  cancelBtnText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    ...Shadows.md,
  },
  saveBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
});
