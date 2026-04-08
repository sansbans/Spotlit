import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Patch, DailyLog, PatchWithStats } from '../types';
import * as storage from '../utils/storage';
import { computeStats, todayString, generateId, getDayNumber } from '../utils/dates';

interface PatchContextValue {
  patches: PatchWithStats[];
  loading: boolean;
  addPatch: (data: Omit<Patch, 'id' | 'createdAt'>) => Promise<string>;
  updatePatch: (id: string, updates: Partial<Patch>) => Promise<void>;
  deletePatch: (id: string) => Promise<void>;
  addLog: (data: Omit<DailyLog, 'id' | 'createdAt' | 'dayNumber'>) => Promise<void>;
  updateLog: (log: DailyLog) => Promise<void>;
  deleteLog: (patchId: string, logId: string) => Promise<void>;
  getPatchById: (id: string) => PatchWithStats | undefined;
  refresh: () => Promise<void>;
}

const PatchContext = createContext<PatchContextValue | null>(null);

export function PatchProvider({ children }: { children: React.ReactNode }) {
  const [patches, setPatches] = useState<PatchWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    const rawPatches = await storage.getPatches();
    const patchesWithStats: PatchWithStats[] = await Promise.all(
      rawPatches.map(async (p) => {
        const logs = await storage.getLogs(p.id);
        const stats = computeStats(logs, p.startDate, p.targetDays);
        return { ...p, logs, stats };
      })
    );
    if (mounted.current) {
      setPatches(patchesWithStats);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const addPatch = useCallback(async (data: Omit<Patch, 'id' | 'createdAt'>): Promise<string> => {
    const patch: Patch = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await storage.savePatch(patch);
    await load();
    return patch.id;
  }, [load]);

  const updatePatch = useCallback(async (id: string, updates: Partial<Patch>): Promise<void> => {
    const patch = patches.find((p) => p.id === id);
    if (!patch) return;
    const updated: Patch = { ...patch, ...updates };
    await storage.savePatch(updated);
    await load();
  }, [patches, load]);

  const deletePatch = useCallback(async (id: string): Promise<void> => {
    await storage.deletePatch(id);
    await load();
  }, [load]);

  const addLog = useCallback(async (
    data: Omit<DailyLog, 'id' | 'createdAt' | 'dayNumber'>
  ): Promise<void> => {
    const patch = patches.find((p) => p.id === data.patchId);
    if (!patch) return;
    const dayNumber = getDayNumber(patch.startDate, data.date);
    const log: DailyLog = {
      ...data,
      id: generateId(),
      dayNumber,
      createdAt: new Date().toISOString(),
    };
    await storage.saveLog(log);
    await load();
  }, [patches, load]);

  const updateLog = useCallback(async (log: DailyLog): Promise<void> => {
    await storage.saveLog(log);
    await load();
  }, [load]);

  const deleteLog = useCallback(async (patchId: string, logId: string): Promise<void> => {
    await storage.deleteLog(patchId, logId);
    await load();
  }, [load]);

  const getPatchById = useCallback(
    (id: string) => patches.find((p) => p.id === id),
    [patches]
  );

  return (
    <PatchContext.Provider
      value={{
        patches,
        loading,
        addPatch,
        updatePatch,
        deletePatch,
        addLog,
        updateLog,
        deleteLog,
        getPatchById,
        refresh: load,
      }}
    >
      {children}
    </PatchContext.Provider>
  );
}

export function usePatches() {
  const ctx = useContext(PatchContext);
  if (!ctx) throw new Error('usePatches must be used within PatchProvider');
  return ctx;
}
