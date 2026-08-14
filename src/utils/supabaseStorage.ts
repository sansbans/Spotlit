import { supabase } from '@/lib/supabase';
import { Patch, DailyLog } from '@/types';
import { isLocalUri, uploadPatchPhoto, resolvePhotoUrl } from './photoStorage';

// This module is the Supabase-backed replacement for the old AsyncStorage
// layer (src/utils/storage.ts, kept only as a local-dev/offline reference).
// It preserves the same app-level shape (Patch / DailyLog with a directly
// renderable `coverPhoto` / `photo` URI) so screens and components didn't
// need to change — the translation between a stored object-storage path and
// a signed display URL happens entirely in here. Row ids are DB-generated
// (uuid default) rather than client-generated, since these rows now need to
// satisfy foreign keys and RLS checks server-side.
//
// Photo round-trip contract: PhotoCapture always hands back a fresh local
// file:// (or content://) URI when the user actually takes/picks a new
// photo. A value that already starts with "http" can therefore only be a
// signed URL we resolved on a previous load — i.e. "the user didn't change
// this photo" — so on update we reuse the existing stored path instead of
// re-uploading it. A field left `undefined` in a partial update means
// "don't touch this column at all".

// ─── Patches ────────────────────────────────────────────────────────────────

function mapPatchRow(row: any) {
  return {
    id: row.id as string,
    name: row.name as string,
    bodyLocation: row.body_location as string,
    coverPhotoPath: row.cover_photo_path as string | null,
    stressor: (row.stressor ?? '') as string,
    cause: (row.cause ?? '') as string,
    medication: (row.medication ?? '') as string,
    startDate: row.start_date as string,
    targetDays: row.target_days as number,
    notes: (row.notes ?? '') as string,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
  };
}

async function toDisplayPatch(row: any): Promise<Patch> {
  const { coverPhotoPath, ...rest } = mapPatchRow(row);
  return { ...rest, coverPhoto: await resolvePhotoUrl(coverPhotoPath) };
}

export async function getPatches(userId: string): Promise<Patch[]> {
  const { data, error } = await supabase
    .from('patches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return Promise.all(data.map(toDisplayPatch));
}

export async function insertPatch(
  userId: string,
  data: Omit<Patch, 'id' | 'createdAt'>
): Promise<Patch> {
  const coverPhotoPath = data.coverPhoto && isLocalUri(data.coverPhoto)
    ? await uploadPatchPhoto(userId, data.coverPhoto)
    : null;

  const { data: row, error } = await supabase
    .from('patches')
    .insert({
      user_id: userId,
      name: data.name,
      body_location: data.bodyLocation,
      cover_photo_path: coverPhotoPath,
      stressor: data.stressor,
      cause: data.cause,
      medication: data.medication,
      start_date: data.startDate,
      target_days: data.targetDays,
      notes: data.notes,
      is_active: data.isActive,
    })
    .select()
    .single();
  if (error) throw error;
  return toDisplayPatch(row);
}

export async function updatePatch(
  userId: string,
  id: string,
  updates: Partial<Patch>
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.bodyLocation !== undefined) payload.body_location = updates.bodyLocation;
  if (updates.stressor !== undefined) payload.stressor = updates.stressor;
  if (updates.cause !== undefined) payload.cause = updates.cause;
  if (updates.medication !== undefined) payload.medication = updates.medication;
  if (updates.startDate !== undefined) payload.start_date = updates.startDate;
  if (updates.targetDays !== undefined) payload.target_days = updates.targetDays;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;

  if (updates.coverPhoto !== undefined) {
    payload.cover_photo_path =
      updates.coverPhoto && isLocalUri(updates.coverPhoto)
        ? await uploadPatchPhoto(userId, updates.coverPhoto)
        : updates.coverPhoto === null
          ? null
          : undefined; // an http value means "unchanged" — leave the column untouched
    if (payload.cover_photo_path === undefined) delete payload.cover_photo_path;
  }

  const { error } = await supabase.from('patches').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deletePatch(patchId: string): Promise<void> {
  const { error } = await supabase.from('patches').delete().eq('id', patchId);
  if (error) throw error;
}

// ─── Daily Logs ─────────────────────────────────────────────────────────────

function mapLogRow(row: any) {
  return {
    id: row.id as string,
    patchId: row.patch_id as string,
    date: row.date as string,
    photoPath: row.photo_path as string | null,
    ointmentApplied: row.ointment_applied as boolean,
    ointmentName: (row.ointment_name ?? '') as string,
    applicationTime: (row.application_time?.slice(0, 5) ?? '') as string,
    notes: (row.notes ?? '') as string,
    dayNumber: row.day_number as number,
    progress: row.progress as DailyLog['progress'],
    createdAt: row.created_at as string,
  };
}

async function toDisplayLog(row: any): Promise<DailyLog> {
  const { photoPath, ...rest } = mapLogRow(row);
  return { ...rest, photo: await resolvePhotoUrl(photoPath) };
}

export async function getLogs(patchId: string): Promise<DailyLog[]> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('patch_id', patchId)
    .order('date', { ascending: true });
  if (error || !data) return [];
  return Promise.all(data.map(toDisplayLog));
}

export async function insertLog(
  userId: string,
  data: Omit<DailyLog, 'id' | 'createdAt'>
): Promise<DailyLog> {
  // This upserts on (patch_id, date), so "insert" doubles as "re-save
  // today's log" — resolve the photo the same way updatePatch/updateLog do:
  // a local URI is a real new photo, an http URL means "unchanged, keep
  // whatever's already stored for this day", null means "explicitly cleared".
  let photoPath: string | null;
  if (data.photo === null) {
    photoPath = null;
  } else if (isLocalUri(data.photo)) {
    photoPath = await uploadPatchPhoto(userId, data.photo);
  } else {
    const { data: existing } = await supabase
      .from('daily_logs')
      .select('photo_path')
      .eq('patch_id', data.patchId)
      .eq('date', data.date)
      .maybeSingle();
    photoPath = existing?.photo_path ?? null;
  }

  const { data: row, error } = await supabase
    .from('daily_logs')
    // Re-logging the same day (unique patch_id+date) updates that row instead
    // of failing, which matches the "edit today's log" flow in the UI.
    .upsert(
      {
        patch_id: data.patchId,
        user_id: userId,
        date: data.date,
        photo_path: photoPath,
        ointment_applied: data.ointmentApplied,
        ointment_name: data.ointmentName,
        application_time: data.applicationTime || null,
        notes: data.notes,
        day_number: data.dayNumber,
        progress: data.progress,
      },
      { onConflict: 'patch_id,date' }
    )
    .select()
    .single();
  if (error) throw error;
  return toDisplayLog(row);
}

export async function updateLog(userId: string, log: DailyLog): Promise<void> {
  const photoPath = log.photo && isLocalUri(log.photo)
    ? await uploadPatchPhoto(userId, log.photo)
    : log.photo === null
      ? null
      : undefined;

  const payload: Record<string, unknown> = {
    ointment_applied: log.ointmentApplied,
    ointment_name: log.ointmentName,
    application_time: log.applicationTime || null,
    notes: log.notes,
    progress: log.progress,
  };
  if (photoPath !== undefined) payload.photo_path = photoPath;

  const { error } = await supabase.from('daily_logs').update(payload).eq('id', log.id);
  if (error) throw error;
}

export async function deleteLog(_patchId: string, logId: string): Promise<void> {
  const { error } = await supabase.from('daily_logs').delete().eq('id', logId);
  if (error) throw error;
}

export async function clearAllData(userId: string): Promise<void> {
  // Deleting patches cascades to daily_logs via the foreign key.
  const { error } = await supabase.from('patches').delete().eq('user_id', userId);
  if (error) throw error;
}
