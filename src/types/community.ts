export interface Profile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
}

export interface Group {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  focusBodyLocation: string | null;
  memberCount?: number;
  createdAt: string;
}

export interface Post {
  id: string;
  groupId: string;
  authorId: string;
  author?: Pick<Profile, 'id' | 'displayName' | 'avatarUrl'>;
  title: string | null;
  body: string;
  imagePath: string | null;
  imageUrl?: string | null;
  commentCount?: number;
  isRemoved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author?: Pick<Profile, 'id' | 'displayName' | 'avatarUrl'>;
  body: string;
  isRemoved: boolean;
  createdAt: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  policyVersion: string;
  researchOptIn: boolean;
  consentedAt: string;
}
