import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePatches } from '@/context/PatchContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import * as storage from '@/utils/storage';

export default function SettingsScreen() {
  const { patches, refresh } = usePatches();
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('20:00');

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your patches and logs. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            await storage.clearAllData();
            await refresh();
            Alert.alert('Done', 'All data has been cleared.');
          },
        },
      ]
    );
  };

  const stats = {
    patches: patches.length,
    active: patches.filter((p) => p.isActive).length,
    totalLogs: patches.reduce((acc, p) => acc + p.logs.length, 0),
    withPhotos: patches.reduce(
      (acc, p) => acc + p.logs.filter((l) => l.photo !== null).length,
      0
    ),
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* App info */}
      <View style={styles.appInfo}>
        <View style={styles.appIconWrapper}>
          <Text style={styles.appIcon}>🔦</Text>
        </View>
        <Text style={styles.appName}>Spotlit</Text>
        <Text style={styles.appTagline}>Track. Log. Recover.</Text>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
      </View>

      {/* Stats summary */}
      <SectionHeader title="Your Journey" />
      <View style={styles.statsGrid}>
        <StatCell label="Total Patches" value={stats.patches} />
        <StatCell label="Active Now" value={stats.active} />
        <StatCell label="Days Logged" value={stats.totalLogs} />
        <StatCell label="Photos Taken" value={stats.withPhotos} />
      </View>

      {/* Reminders */}
      <SectionHeader title="Reminders" />
      <SettingsCard>
        <SettingsRow
          icon="notifications-outline"
          label="Daily Log Reminder"
          right={
            <Switch
              value={remindersEnabled}
              onValueChange={setRemindersEnabled}
              trackColor={{ true: Colors.primary, false: Colors.borderLight }}
              thumbColor="#FFF"
            />
          }
        />
        {remindersEnabled && (
          <SettingsRow
            icon="time-outline"
            label="Reminder Time"
            right={<Text style={styles.settingValue}>{formatTime(reminderTime)}</Text>}
          />
        )}
      </SettingsCard>

      {/* About vitiligo */}
      <SectionHeader title="About Vitiligo" />
      <SettingsCard>
        <View style={styles.infoBlock}>
          <Text style={styles.infoText}>
            Vitiligo is a chronic condition where skin loses pigment in patches due to the immune system
            attacking melanocytes. Treatment often involves topical immunomodulators (like tacrolimus),
            corticosteroids, or phototherapy.
          </Text>
          <Text style={styles.infoText}>
            Recovery is slow — typically months to years. Consistent treatment application and
            photo-tracking helps monitor progress and stay motivated.
          </Text>
        </View>
        <SettingsRow
          icon="medical-outline"
          label="Common Treatments"
          right={<Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />}
          onPress={() =>
            Alert.alert(
              'Common Treatments',
              '• Tacrolimus (Protopic)\n• Pimecrolimus (Elidel)\n• NB-UVB Phototherapy\n• Ruxolitinib (Opzelura)\n• Corticosteroids\n• JAK inhibitors\n\nAlways consult a dermatologist for personalised advice.'
            )
          }
        />
      </SettingsCard>

      {/* Danger zone */}
      <SectionHeader title="Data" />
      <SettingsCard>
        <SettingsRow
          icon="trash-outline"
          label="Clear All Data"
          labelStyle={{ color: Colors.error }}
          iconColor={Colors.error}
          onPress={handleClearData}
        />
      </SettingsCard>

      <Text style={styles.footer}>
        Spotlit is not a medical app. Always follow your dermatologist's advice.
      </Text>
    </ScrollView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={styles.sectionHeader}>{title.toUpperCase()}</Text>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function SettingsRow({
  icon,
  label,
  right,
  onPress,
  labelStyle,
  iconColor,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  labelStyle?: object;
  iconColor?: string;
}) {
  const inner = (
    <>
      <Ionicons name={icon} size={20} color={iconColor ?? Colors.primaryLight} />
      <Text style={[styles.rowLabel, labelStyle]}>{label}</Text>
      <View style={styles.rowRight}>{right}</View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={onPress}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={styles.row}>{inner}</View>;
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const p = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${p}`;
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },

  appInfo: {
    alignItems: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.xs,
  },
  appIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  appIcon: { fontSize: 40 },
  appName: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
  },
  appTagline: {
    fontSize: Typography.base,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  appVersion: {
    fontSize: Typography.xs,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  statCell: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  statValue: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.extrabold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },

  sectionHeader: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textMuted,
    letterSpacing: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  card: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  rowPressed: { backgroundColor: Colors.surfaceWarm },
  rowLabel: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  rowRight: { alignItems: 'flex-end' },
  settingValue: {
    fontSize: Typography.base,
    color: Colors.primaryLight,
    fontWeight: Typography.medium,
  },
  infoBlock: {
    padding: Spacing.base,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  footer: {
    textAlign: 'center',
    fontSize: Typography.xs,
    color: Colors.textLight,
    padding: Spacing['2xl'],
    lineHeight: 18,
  },
});
