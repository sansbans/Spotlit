import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useConsent } from '@/context/ConsentContext';
import { RESEARCH_POLICY_SUMMARY } from '@/constants/consent';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

export default function ConsentScreen() {
  const { session } = useAuth();
  const { loading, researchOptIn, setResearchOptIn } = useConsent();
  const [choice, setChoice] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!session) return <Redirect href="/(auth)/sign-in" />;
  if (loading) return null;
  // Already made a decision before (e.g. re-visiting via Settings) — nothing
  // forced here, just let them through to the app.
  if (researchOptIn !== null) return <Redirect href="/(tabs)" />;

  const handleContinue = async () => {
    setSaving(true);
    try {
      await setResearchOptIn(choice);
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.iconWrap}>
        <Ionicons name="flask-outline" size={40} color={Colors.primary} />
      </View>
      <Text style={styles.title}>Help advance vitiligo research</Text>
      <Text style={styles.intro}>
        Spotlit can optionally contribute de-identified tracking data to vitiligo research
        partners. This is completely separate from using the app to track your own patches —
        you can use Spotlit fully either way.
      </Text>

      {RESEARCH_POLICY_SUMMARY.map((section) => (
        <View key={section.heading} style={styles.card}>
          <Text style={styles.cardHeading}>{section.heading}</Text>
          <Text style={styles.cardBody}>{section.body}</Text>
        </View>
      ))}

      <View style={styles.toggleRow}>
        <View style={styles.toggleTextWrap}>
          <Text style={styles.toggleLabel}>Share my de-identified data for research</Text>
          <Text style={styles.toggleHint}>Off by default. Change anytime in Settings.</Text>
        </View>
        <Switch
          value={choice}
          onValueChange={setChoice}
          trackColor={{ true: Colors.primary, false: Colors.borderLight }}
          thumbColor="#FFF"
        />
      </View>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={handleContinue}
        disabled={saving}
      >
        <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Continue'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  intro: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardHeading: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  cardBody: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceWarm,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  toggleTextWrap: { flex: 1 },
  toggleLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  toggleHint: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: {
    color: Colors.textInverse,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
});
