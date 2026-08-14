-- ============================================================================
-- Spotlit — Storage buckets & policies
-- ============================================================================
-- Convention: every object path starts with the owning user's uuid as the
-- first folder segment, e.g. "{user_id}/{patch_id}/{log_id}.jpg". Policies
-- below check that prefix via storage.foldername(name)[1] rather than
-- trusting anything the client sends in metadata.
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('patch-photos', 'patch-photos', false),
  ('avatars', 'avatars', true),
  ('post-images', 'post-images', false)
on conflict (id) do nothing;

-- ─── patch-photos (private: tracking photos are sensitive health data) ──────

create policy "users manage their own patch photos"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'patch-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'patch-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ─── avatars (public read, own write) ────────────────────────────────────────

create policy "anyone can view avatars"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars');

create policy "users manage their own avatar"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users update or delete their own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ─── post-images (any authenticated member can view; owner manages) ─────────
-- Community post images aren't as sensitive as tracking photos, but we still
-- keep the bucket private and gate reads behind authentication rather than
-- making it public, since posts can reference visible skin patches.

create policy "authenticated users can view post images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'post-images');

create policy "users manage their own post images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users update or delete their own post images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users delete their own post images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);
