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
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { usePatches } from '@/context/PatchContext';
import { PhotoCapture } from '@/components/PhotoCapture';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { BODY_LOCATIONS, COMMON_STRESSORS, COMMON_MEDICATIONS } from '@/types';
import { todayString } from '@/utils/dates';

type Step = 1 | 2 | 3;

const STEPS = [
  { label: 'Photo', icon: 'camera-outline' as const },
  { label: 'Details', icon: 'create-outline' as const },
  { label: 'Treatment', icon: 'medical-outline' as const },
];

export default function AddPatchScreen() {
  const router = useRouter();
  const { addPatch } = usePatches();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);

  // Form state
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [bodyLocation, setBodyLocation] = useState('');
  const [stressor, setStressor] = useState('');
  const [cause, setCause] = useState('');
  const [medication, setMedication] = useState('');
  const [notes, setNotes] = useState('');
  const [targetDays, setTargetDays] = useState(60);

  const canNext = () => {
    if (step === 1) return true; // photo optional
    if (step === 2) return name.trim().length > 0 && bodyLocation.length > 0;
    return true;
  };

  const next = () => {
    if (!canNext()) {
      Alert.alert('Required', 'Please fill in all required fields.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 3) {
      setStep((s) => (s + 1) as Step);
    } else {
      save();
    }
  };

  const back = () => {
    if (step === 1) {
      router.back();
    } else {
      setStep((s) => (s - 1) as Step);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const id = await addPatch({
        name: name.trim(),
        bodyLocation,
        coverPhoto: photo,
        stressor,
        cause: cause.trim(),
        medication,
        startDate: todayString(),
        targetDays,
        notes: notes.trim(),
        isActive: true,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/patch/${id}`);
    } catch {
      Alert.alert('Error', 'Failed to save patch. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Step indicator */}
      <View style={styles.stepBar}>
        {STEPS.map((s, i) => {
          const stepNum = (i + 1) as Step;
          const done = step > stepNum;
          const active = step === stepNum;
          return (
            <React.Fragment key={s.label}>
              <View style={styles.stepItem}>
                <View style={[
                  styles.stepCircle,
                  done && styles.stepCircleDone,
                  active && styles.stepCircleActive,
                ]}>
                  {done
                    ? <Ionicons name="checkmark" size={14} color="#FFF" />
                    : <Ionicons name={s.icon} size={14} color={active ? '#FFF' : Colors.textMuted} />
                  }
                </View>
                <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>
                  {s.label}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, done && styles.stepLineDone]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 1 && <Step1 photo={photo} setPhoto={setPhoto} />}
        {step === 2 && (
          <Step2
            name={name} setName={setName}
            bodyLocation={bodyLocation} setBodyLocation={setBodyLocation}
            stressor={stressor} setStressor={setStressor}
            cause={cause} setCause={setCause}
            notes={notes} setNotes={setNotes}
            targetDays={targetDays} setTargetDays={setTargetDays}
          />
        )}
        {step === 3 && (
          <Step3
            medication={medication} setMedication={setMedication}
          />
        )}
      </ScrollView>

      {/* Nav buttons */}
      <View style={styles.navRow}>
        <Pressable style={styles.backBtn} onPress={back}>
          <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
          <Text style={styles.backBtnText}>{step === 1 ? 'Cancel' : 'Back'}</Text>
        </Pressable>
        <Pressable
          style={[styles.nextBtn, !canNext() && styles.nextBtnDisabled]}
          onPress={next}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Text style={styles.nextBtnText}>{step === 3 ? 'Save Patch' : 'Next'}</Text>
              {step < 3 && <Ionicons name="arrow-forward" size={20} color="#FFF" />}
              {step === 3 && <Ionicons name="checkmark" size={20} color="#FFF" />}
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Step 1: Photo ─────────────────────────────────────────────────────────────

function Step1({ photo, setPhoto }: { photo: string | null; setPhoto: (u: string | null) => void }) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Photograph Your Patch</Text>
      <Text style={styles.stepSub}>
        Take a clear, well-lit photo of the affected area. This becomes your "Day 0" baseline.
      </Text>
      <PhotoCapture
        uri={photo}
        onCapture={setPhoto}
        onClear={() => setPhoto(null)}
        label="Take Baseline Photo"
        size="lg"
      />
      <View style={styles.tipBox}>
        <Ionicons name="bulb-outline" size={16} color={Colors.gold} />
        <Text style={styles.tipText}>
          Use the same angle and lighting each day for the most accurate timelapse.
        </Text>
      </View>
    </View>
  );
}

// ── Step 2: Details ───────────────────────────────────────────────────────────

function Step2({
  name, setName, bodyLocation, setBodyLocation,
  stressor, setStressor, cause, setCause,
  notes, setNotes, targetDays, setTargetDays,
}: {
  name: string; setName: (v: string) => void;
  bodyLocation: string; setBodyLocation: (v: string) => void;
  stressor: string; setStressor: (v: string) => void;
  cause: string; setCause: (v: string) => void;
  notes: string; setNotes: (v: string) => void;
  targetDays: number; setTargetDays: (v: number) => void;
}) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Patch Details</Text>
      <Text style={styles.stepSub}>Tell us about this patch so you can track it accurately.</Text>

      <FormField label="Patch Name *" hint="e.g. Left elbow, Right knee">
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Give this patch a name"
          placeholderTextColor={Colors.textLight}
        />
      </FormField>

      <FormField label="Body Location *">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <View style={styles.chipRow}>
            {BODY_LOCATIONS.map((loc) => (
              <Pressable
                key={loc}
                style={[styles.chip, bodyLocation === loc && styles.chipSelected]}
                onPress={() => setBodyLocation(loc)}
              >
                <Text style={[styles.chipText, bodyLocation === loc && styles.chipTextSelected]}>
                  {loc}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </FormField>

      <FormField label="Primary Stressor">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <View style={styles.chipRow}>
            {COMMON_STRESSORS.map((s) => (
              <Pressable
                key={s}
                style={[styles.chip, stressor === s && styles.chipSelected]}
                onPress={() => setStressor(s)}
              >
                <Text style={[styles.chipText, stressor === s && styles.chipTextSelected]}>
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </FormField>

      <FormField label="How it occurred" hint="Describe the history of this patch">
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={cause}
          onChangeText={setCause}
          placeholder="e.g. Appeared after a stressful period, slowly expanded over 3 months..."
          placeholderTextColor={Colors.textLight}
          multiline
          numberOfLines={3}
        />
      </FormField>

      <FormField label="Tracking Goal">
        <View style={styles.goalRow}>
          {[30, 60, 90, 120].map((d) => (
            <Pressable
              key={d}
              style={[styles.goalChip, targetDays === d && styles.goalChipSelected]}
              onPress={() => setTargetDays(d)}
            >
              <Text style={[styles.goalChipText, targetDays === d && styles.goalChipTextSelected]}>
                {d}d
              </Text>
            </Pressable>
          ))}
        </View>
      </FormField>

      <FormField label="Additional Notes">
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any other details..."
          placeholderTextColor={Colors.textLight}
          multiline
          numberOfLines={2}
        />
      </FormField>
    </View>
  );
}

// ── Step 3: Treatment ─────────────────────────────────────────────────────────

function Step3({
  medication, setMedication,
}: {
  medication: string; setMedication: (v: string) => void;
}) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Treatment Plan</Text>
      <Text style={styles.stepSub}>
        Select the medication or treatment prescribed for this patch.
      </Text>

      <FormField label="Medication / Treatment">
        <View style={styles.medList}>
          {COMMON_MEDICATIONS.map((med) => (
            <Pressable
              key={med}
              style={[styles.medRow, medication === med && styles.medRowSelected]}
              onPress={() => setMedication(med)}
            >
              <View style={[styles.medRadio, medication === med && styles.medRadioSelected]}>
                {medication === med && <View style={styles.medRadioDot} />}
              </View>
              <Text style={[styles.medText, medication === med && styles.medTextSelected]}>
                {med}
              </Text>
            </Pressable>
          ))}
        </View>
      </FormField>

      <View style={styles.tipBox}>
        <Ionicons name="shield-checkmark-outline" size={16} color={Colors.success} />
        <Text style={styles.tipText}>
          Always follow your dermatologist's prescription. This is for tracking purposes only.
        </Text>
      </View>
    </View>
  );
}

function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surfaceWarm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepCircleDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  stepLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
  stepLabelActive: { color: Colors.primary, fontWeight: Typography.bold },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.borderLight,
    marginBottom: 16,
    marginHorizontal: Spacing.xs,
  },
  stepLineDone: { backgroundColor: Colors.success },

  scroll: { flex: 1 },
  content: { padding: Spacing.base, paddingBottom: 20 },
  stepContent: { gap: Spacing.xl },
  stepTitle: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
  },
  stepSub: {
    fontSize: Typography.base,
    color: Colors.textMuted,
    lineHeight: 22,
    marginTop: -Spacing.md,
  },

  field: { gap: Spacing.xs },
  fieldLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldHint: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
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
  inputMulti: {
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },

  chipScroll: { marginHorizontal: -Spacing.base },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceWarm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  chipTextSelected: { color: Colors.textInverse },

  goalRow: { flexDirection: 'row', gap: Spacing.sm },
  goalChip: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceWarm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  goalChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  goalChipText: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
  },
  goalChipTextSelected: { color: Colors.textInverse },

  medList: { gap: Spacing.sm },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  medRowSelected: { borderColor: Colors.primary, backgroundColor: Colors.accentLight },
  medRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medRadioSelected: { borderColor: Colors.primary },
  medRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  medText: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  medTextSelected: { fontWeight: Typography.semibold, color: Colors.primaryLight },

  tipBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceWarm,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  navRow: {
    flexDirection: 'row',
    padding: Spacing.base,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceWarm,
  },
  backBtnText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  nextBtn: {
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
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textInverse,
  },
});
