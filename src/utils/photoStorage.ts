import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour — regenerated whenever data reloads

/**
 * True for a URI that's still sitting on-device (camera roll / cache) and
 * hasn't been uploaded yet — as opposed to an https:// signed URL we already
 * resolved from a stored storage path, or null.
 */
export function isLocalUri(uri: string | null | undefined): uri is string {
  return !!uri && !uri.startsWith('http');
}

/**
 * Uploads a local photo (file:// URI from expo-camera / expo-image-picker)
 * to a private bucket under the given user's folder, and returns the
 * storage path (not a URL — buckets are private, so callers resolve a
 * signed URL separately via resolveSignedUrl).
 */
export async function uploadImage(bucket: string, userId: string, localUri: string): Promise<string> {
  const ext = localUri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, decode(base64), {
      contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
      upsert: true,
    });
  if (error) throw error;
  return path;
}

export async function deleteImage(bucket: string, path: string): Promise<void> {
  await supabase.storage.from(bucket).remove([path]);
}

/**
 * Resolves a stored path to a temporary signed URL for display. Returns null
 * for a null/empty path, and passes already-resolved http(s) values through.
 */
export async function resolveSignedUrl(bucket: string, path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) return null;
  return data.signedUrl;
}

// ─── patch-photos convenience wrappers (private tracking photos) ────────────

const PATCH_PHOTOS_BUCKET = 'patch-photos';

export const uploadPatchPhoto = (userId: string, localUri: string) =>
  uploadImage(PATCH_PHOTOS_BUCKET, userId, localUri);

export const deletePatchPhoto = (path: string) => deleteImage(PATCH_PHOTOS_BUCKET, path);

export const resolvePhotoUrl = (path: string | null) => resolveSignedUrl(PATCH_PHOTOS_BUCKET, path);
