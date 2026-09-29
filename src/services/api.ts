import { User, Post, Comment, Notification, Trend, FeedMode } from '../types/index.ts';

const TOKEN_KEY = 'pulse_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `HTTP ${response.status}: Request failed`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  async register(data: { name: string; username: string; email: string; password: string; bio?: string; avatar?: string }) {
    const res = await request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setStoredToken(res.token);
    return res;
  },

  async login(identifier: string, password: string) {
    const res = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe() {
    return request<{ user: User }>('/api/auth/me');
  },

  async getDemoUsers() {
    return request<{ users: Array<{ id: string; username: string; name: string; avatar: string; bio: string }> }>('/api/auth/demo-users');
  },

  // Users
  async getProfile(username: string) {
    return request<{ user: User }>(`/api/users/profile/${encodeURIComponent(username)}`);
  },

  async updateProfile(updates: Partial<Pick<User, 'name' | 'bio' | 'avatar' | 'location' | 'website'>>) {
    return request<{ user: User }>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async toggleFollow(userId: string) {
    return request<{ followed: boolean; followersCount: number }>(`/api/users/${userId}/follow`, {
      method: 'POST',
    });
  },

  async getSuggestedUsers() {
    return request<{ users: User[] }>('/api/users/suggested');
  },

  // Posts
  async getPosts(params: { feed?: FeedMode; tag?: string; author?: string; search?: string } = {}) {
    const query = new URLSearchParams();
    if (params.feed) query.set('feed', params.feed);
    if (params.tag) query.set('tag', params.tag);
    if (params.author) query.set('author', params.author);
    if (params.search) query.set('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<{ posts: Post[]; count: number; feedMode: string }>(`/api/posts${queryString}`);
  },

  async createPost(data: { content: string; tags?: string[]; imageUrl?: string }) {
    return request<{ post: Post }>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deletePost(postId: string) {
    return request<{ message: string }>(`/api/posts/${postId}`, {
      method: 'DELETE',
    });
  },

  async toggleLike(postId: string) {
    return request<{ liked: boolean; likesCount: number }>(`/api/posts/${postId}/like`, {
      method: 'POST',
    });
  },

  async toggleBookmark(postId: string) {
    return request<{ bookmarked: boolean }>(`/api/posts/${postId}/bookmark`, {
      method: 'POST',
    });
  },

  // Comments
  async getComments(postId: string) {
    return request<{ comments: Comment[] }>(`/api/posts/${postId}/comments`);
  },

  async addComment(postId: string, content: string) {
    return request<{ comment: Comment; commentsCount: number }>(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async deleteComment(postId: string, commentId: string) {
    return request<{ message: string; commentsCount: number }>(`/api/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  },

  // Notifications
  async getNotifications() {
    return request<{ notifications: Notification[] }>('/api/notifications');
  },

  async markNotificationsRead() {
    return request<{ message: string }>('/api/notifications/read', {
      method: 'POST',
    });
  },

  // Trends
  async getTrends() {
    return request<{ trends: Trend[] }>('/api/trends');
  },
};
