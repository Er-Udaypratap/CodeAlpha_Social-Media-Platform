export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  avatar: string;
  bio: string;
  location?: string;
  website?: string;
  createdAt: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  unreadNotifs?: number;
  isFollowing?: boolean;
  isSelf?: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  imageUrl?: string;
  tags: string[];
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    bio?: string;
  };
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  actorId: string;
  type: 'like' | 'comment' | 'follow';
  postId?: string;
  postSnippet?: string;
  read: boolean;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  } | null;
}

export interface Trend {
  tag: string;
  count: number;
}

export type FeedMode = 'personalized' | 'explore' | 'trending' | 'bookmarks';
