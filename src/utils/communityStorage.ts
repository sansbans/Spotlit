import { supabase } from '@/lib/supabase';
import { Group, Post, Comment } from '@/types/community';
import { isLocalUri, uploadImage, resolveSignedUrl } from './photoStorage';

const POST_IMAGES_BUCKET = 'post-images';

// ─── Groups ─────────────────────────────────────────────────────────────────

function mapGroupRow(row: any): Group {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    focusBodyLocation: row.focus_body_location,
    memberCount: row.group_members?.[0]?.count,
    createdAt: row.created_at,
  };
}

export async function getGroups(): Promise<Group[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('*, group_members(count)')
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data.map(mapGroupRow);
}

export async function getGroup(groupId: string): Promise<Group | null> {
  const { data, error } = await supabase.from('groups').select('*').eq('id', groupId).single();
  if (error || !data) return null;
  return mapGroupRow(data);
}

export async function getMyGroupIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('group_members').select('group_id').eq('user_id', userId);
  if (error || !data) return [];
  return data.map((r) => r.group_id);
}

export async function joinGroup(userId: string, groupId: string): Promise<void> {
  const { error } = await supabase
    .from('group_members')
    .upsert({ group_id: groupId, user_id: userId, role: 'member' }, { onConflict: 'group_id,user_id' });
  if (error) throw error;
}

export async function leaveGroup(userId: string, groupId: string): Promise<void> {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function createGroup(
  userId: string,
  data: { name: string; slug: string; description: string; focusBodyLocation: string | null }
): Promise<Group> {
  const { data: row, error } = await supabase
    .from('groups')
    .insert({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      focus_body_location: data.focusBodyLocation,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;
  return mapGroupRow(row);
}

// ─── Posts ──────────────────────────────────────────────────────────────────

function mapPostRow(row: any): Omit<Post, 'imageUrl'> & { imagePathRaw: string | null } {
  return {
    id: row.id,
    groupId: row.group_id,
    authorId: row.author_id,
    author: row.author
      ? { id: row.author.id, displayName: row.author.display_name, avatarUrl: row.author.avatar_url }
      : undefined,
    title: row.title,
    body: row.body,
    imagePath: row.image_path,
    imagePathRaw: row.image_path,
    commentCount: row.comments?.[0]?.count,
    isRemoved: row.is_removed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function toDisplayPost(row: any): Promise<Post> {
  const { imagePathRaw, ...rest } = mapPostRow(row);
  return { ...rest, imageUrl: await resolveSignedUrl(POST_IMAGES_BUCKET, imagePathRaw) };
}

export async function getPosts(groupId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles(id, display_name, avatar_url), comments(count)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return Promise.all(data.map(toDisplayPost));
}

export async function getPost(postId: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles(id, display_name, avatar_url)')
    .eq('id', postId)
    .single();
  if (error || !data) return null;
  return toDisplayPost(data);
}

export async function createPost(
  userId: string,
  data: { groupId: string; title: string; body: string; imageLocalUri: string | null }
): Promise<Post> {
  const imagePath = data.imageLocalUri
    ? await uploadImage(POST_IMAGES_BUCKET, userId, data.imageLocalUri)
    : null;

  const { data: row, error } = await supabase
    .from('posts')
    .insert({
      group_id: data.groupId,
      author_id: userId,
      title: data.title || null,
      body: data.body,
      image_path: imagePath,
    })
    .select('*, author:profiles(id, display_name, avatar_url)')
    .single();
  if (error) throw error;
  return toDisplayPost(row);
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) throw error;
}

// ─── Comments ───────────────────────────────────────────────────────────────

function mapCommentRow(row: any): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    author: row.author
      ? { id: row.author.id, displayName: row.author.display_name, avatarUrl: row.author.avatar_url }
      : undefined,
    body: row.body,
    isRemoved: row.is_removed,
    createdAt: row.created_at,
  };
}

export async function getComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*, author:profiles(id, display_name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data.map(mapCommentRow);
}

export async function addComment(userId: string, postId: string, body: string): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, author_id: userId, body })
    .select('*, author:profiles(id, display_name, avatar_url)')
    .single();
  if (error) throw error;
  return mapCommentRow(data);
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) throw error;
}

// ─── Reports (moderation) ────────────────────────────────────────────────────

export async function reportContent(
  userId: string,
  targetType: 'post' | 'comment',
  targetId: string,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .insert({ target_type: targetType, target_id: targetId, reporter_id: userId, reason });
  if (error) throw error;
}

export { isLocalUri };
