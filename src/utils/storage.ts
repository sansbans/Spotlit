import AsyncStorage from '@react-native-async-storage/async-storage';
import { Patch, DailyLog } from '../types';

const KEYS = {
  PATCHES: '@spotlit/patches',
  LOGS_PREFIX: '@spotlit/logs/',
} as const;

// ─── Patches ────────────────────────────────────────────────────────────────

export async function getPatches(): Promise<Patch[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PATCHES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function savePatch(patch: Patch): Promise<void> {
  const patches = await getPatches();
  const idx = patches.findIndex((p) => p.id === patch.id);
  if (idx >= 0) {
    patches[idx] = patch;
  } else {
    patches.unshift(patch);
  }
  await AsyncStorage.setItem(KEYS.PATCHES, JSON.stringify(patches));
}

export async function deletePatch(patchId: string): Promise<void> {
  const patches = await getPatches();
  const filtered = patches.filter((p) => p.id !== patchId);
  await AsyncStorage.setItem(KEYS.PATCHES, JSON.stringify(filtered));
  // Also delete all logs for this patch
  await AsyncStorage.removeItem(KEYS.LOGS_PREFIX + patchId);
}

// ─── Daily Logs ─────────────────────────────────────────────────────────────

export async function getLogs(patchId: string): Promise<DailyLog[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.LOGS_PREFIX + patchId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveLog(log: DailyLog): Promise<void> {
  const logs = await getLogs(log.patchId);
  const idx = logs.findIndex((l) => l.id === log.id);
  if (idx >= 0) {
    logs[idx] = log;
  } else {
    logs.push(log);
  }
  // Sort by date ascending
  logs.sort((a, b) => a.date.localeCompare(b.date));
  await AsyncStorage.setItem(KEYS.LOGS_PREFIX + log.patchId, JSON.stringify(logs));
}

export async function deleteLog(patchId: string, logId: string): Promise<void> {
  const logs = await getLogs(patchId);
  const filtered = logs.filter((l) => l.id !== logId);
  await AsyncStorage.setItem(KEYS.LOGS_PREFIX + patchId, JSON.stringify(filtered));
}

export async function getLogForDate(patchId: string, date: string): Promise<DailyLog | null> {
  const logs = await getLogs(patchId);
  return logs.find((l) => l.date === date) ?? null;
}

// ─── Clear all (for dev/reset) ───────────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const spotlitKeys = keys.filter((k) => k.startsWith('@spotlit/'));
  await AsyncStorage.multiRemove(spotlitKeys);
}
