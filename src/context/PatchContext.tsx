import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Patch, DailyLog, PatchWithStats } from '../types';
import * as storage from '../utils/supabaseStorage';
import { computeStats, getDayNumber } from '../utils/dates';
import { useAuth } from './AuthContext';

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
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [patches, setPatches] = useState<PatchWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    if (!userId) {
      setPatches([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const rawPatches = await storage.getPatches(userId);
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
  }, [userId]);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const addPatch = useCallback(
    async (data: Omit<Patch, 'id' | 'createdAt'>): Promise<string> => {
      if (!userId) throw new Error('Must be signed in to add a patch');
      const patch = await storage.insertPatch(userId, data);
      await load();
      return patch.id;
    },
    [userId, load]
  );

  const updatePatch = useCallback(
    async (id: string, updates: Partial<Patch>): Promise<void> => {
      if (!userId) return;
      await storage.updatePatch(userId, id, updates);
      await load();
    },
    [userId, load]
  );

  const deletePatch = useCallback(
    async (id: string): Promise<void> => {
      await storage.deletePatch(id);
      await load();
    },
    [load]
  );

  const addLog = useCallback(
    async (data: Omit<DailyLog, 'id' | 'createdAt' | 'dayNumber'>): Promise<void> => {
      if (!userId) return;
      const patch = patches.find((p) => p.id === data.patchId);
      if (!patch) return;
      const dayNumber = getDayNumber(patch.startDate, data.date);
      await storage.insertLog(userId, { ...data, dayNumber });
      await load();
    },
    [userId, patches, load]
  );

  const updateLog = useCallback(
    async (log: DailyLog): Promise<void> => {
      if (!userId) return;
      await storage.updateLog(userId, log);
      await load();
    },
    [userId, load]
  );

  const deleteLog = useCallback(
    async (patchId: string, logId: string): Promise<void> => {
      await storage.deleteLog(patchId, logId);
      await load();
    },
    [load]
  );

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
