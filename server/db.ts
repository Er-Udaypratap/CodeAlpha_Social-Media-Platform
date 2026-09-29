import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar: string;
  bio: string;
  location: string;
  website: string;
  createdAt: string;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  imageUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Like {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  actorId: string;
  type: 'like' | 'comment' | 'follow';
  postId?: string;
  read: boolean;
  createdAt: string;
}

interface DatabaseSchema {
  users: User[];
  follows: Follow[];
  posts: Post[];
  likes: Like[];
  bookmarks: Bookmark[];
  comments: Comment[];
  notifications: Notification[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

// Helper to hash passwords consistently
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'pulse_salt_2026').digest('hex');
}

// Initial seed data
function getInitialSeedData(): DatabaseSchema {
  const users: User[] = [
    {
      id: 'usr_maya',
      username: 'mayachen',
      name: 'Maya Chen',
      email: 'maya@pulsesocial.app',
      passwordHash: hashPassword('password123'),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      bio: 'Architectural photographer & spatial designer based in Tokyo. Exploring light, shadows & brutalist lines.',
      location: 'Tokyo, Japan',
      website: 'https://mayachen.design',
      createdAt: '2026-09-01T10:00:00.000Z'
    },
    {
      id: 'usr_alex',
      username: 'alex_dev',
      name: 'Alex Rivera',
      email: 'alex@pulsesocial.app',
      passwordHash: hashPassword('password123'),
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      bio: 'Staff Systems Engineer. Building resilient distributed architectures, writing TypeScript & tinkering with keyboards.',
      location: 'San Francisco, CA',
      website: 'https://alexrivera.dev',
      createdAt: '2026-09-05T12:00:00.000Z'
    },
    {
      id: 'usr_elena',
      username: 'elena_nature',
      name: 'Elena Rostova',
      email: 'elena@pulsesocial.app',
      passwordHash: hashPassword('password123'),
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      bio: 'Alpine guide & environmental documentarian. Documenting high-altitude biodiversity & glacial changes.',
      location: 'Chamonix, France',
      website: 'https://elenarostova.earth',
      createdAt: '2026-09-10T14:30:00.000Z'
    },
    {
      id: 'usr_liam',
      username: 'liam_craft',
      name: 'Liam Cooper',
      email: 'liam@pulsesocial.app',
      passwordHash: hashPassword('password123'),
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      bio: 'Specialty coffee roaster, ceramicist & slow living advocate. Morning rituals and tactile artifacts.',
      location: 'Melbourne, Australia',
      website: 'https://cooperroasters.co',
      createdAt: '2026-09-12T08:15:00.000Z'
    },
    {
      id: 'usr_demo',
      username: 'you',
      name: 'Demo Explorer',
      email: 'demo@pulsesocial.app',
      passwordHash: hashPassword('password123'),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      bio: 'Exploring Pulse Social. Interested in design, technology, craftsmanship, and community ideas.',
      location: 'Global',
      website: 'https://pulsesocial.app',
      createdAt: '2026-09-20T00:00:00.000Z'
    }
  ];

  const follows: Follow[] = [
    // Demo user follows Maya and Alex by default so personalized feed has rich content right away!
    { id: 'fol_1', followerId: 'usr_demo', followingId: 'usr_maya', createdAt: '2026-09-21T09:00:00.000Z' },
    { id: 'fol_2', followerId: 'usr_demo', followingId: 'usr_alex', createdAt: '2026-09-21T09:05:00.000Z' },
    // Maya follows Alex and Elena
    { id: 'fol_3', followerId: 'usr_maya', followingId: 'usr_alex', createdAt: '2026-09-11T10:00:00.000Z' },
    { id: 'fol_4', followerId: 'usr_maya', followingId: 'usr_elena', createdAt: '2026-09-12T10:00:00.000Z' },
    // Alex follows Maya and Liam
    { id: 'fol_5', followerId: 'usr_alex', followingId: 'usr_maya', createdAt: '2026-09-13T11:00:00.000Z' },
    { id: 'fol_6', followerId: 'usr_alex', followingId: 'usr_liam', createdAt: '2026-09-14T11:00:00.000Z' },
    // Elena follows Maya and Liam
    { id: 'fol_7', followerId: 'usr_elena', followingId: 'usr_maya', createdAt: '2026-09-15T12:00:00.000Z' },
    { id: 'fol_8', followerId: 'usr_elena', followingId: 'usr_liam', createdAt: '2026-09-16T12:00:00.000Z' },
    // Liam follows Elena
    { id: 'fol_9', followerId: 'usr_liam', followingId: 'usr_elena', createdAt: '2026-09-17T13:00:00.000Z' }
  ];

  const posts: Post[] = [
    {
      id: 'post_1',
      authorId: 'usr_maya',
      content: 'Morning study of structural rhythm and diffused light. When the timber louvers filter the early sun against raw concrete, the entire pavilion breathes silence.',
      imageUrl: '/src/assets/images/architecture_design_photo_1790571233620.jpg',
      tags: ['architecture', 'design', 'photography', 'minimalism'],
      createdAt: '2026-09-26T18:45:00.000Z'
    },
    {
      id: 'post_2',
      authorId: 'usr_alex',
      content: 'Shipped a fresh migration pipeline today. Simplified four microservices into an event-streamed pipeline with zero dropped frames. Also cleaned up my desk for some focused coding sessions.',
      imageUrl: '/src/assets/images/technology_workspace_desk_1790571270751.jpg',
      tags: ['tech', 'engineering', 'workspace', 'typescript'],
      createdAt: '2026-09-27T04:20:00.000Z'
    },
    {
      id: 'post_3',
      authorId: 'usr_elena',
      content: 'Summit push at 05:40 AM. The stillness before the first rays strike the northern ridge is unlike anything else on Earth. Temperature was -8°C with crisp 15kt ridge winds.',
      imageUrl: '/src/assets/images/nature_mountain_view_1790571251235.jpg',
      tags: ['nature', 'mountains', 'expedition', 'adventure'],
      createdAt: '2026-09-27T12:10:00.000Z'
    },
    {
      id: 'post_4',
      authorId: 'usr_liam',
      content: 'First cupping of the new Ethiopian Yirgacheffe harvest. Notes of jasmine blossom, bergamot, and sweet stone fruit. Starting the morning slow with manual notes.',
      imageUrl: '/src/assets/images/culinary_coffee_art_1790571287506.jpg',
      tags: ['coffee', 'slowliving', 'craft', 'morning'],
      createdAt: '2026-09-27T15:30:00.000Z'
    },
    {
      id: 'post_5',
      authorId: 'usr_maya',
      content: 'Quick thought on modern digital interfaces: When we eliminate unnecessary containers, floating pills, and noisy badges, what remains is typography, spacing, and genuine human content. That clarity is timeless.',
      tags: ['design', 'thoughts', 'craft'],
      createdAt: '2026-09-27T19:15:00.000Z'
    }
  ];

  const likes: Like[] = [
    { id: 'lik_1', userId: 'usr_demo', postId: 'post_1', createdAt: '2026-09-26T20:00:00.000Z' },
    { id: 'lik_2', userId: 'usr_alex', postId: 'post_1', createdAt: '2026-09-26T21:10:00.000Z' },
    { id: 'lik_3', userId: 'usr_elena', postId: 'post_1', createdAt: '2026-09-26T22:30:00.000Z' },
    { id: 'lik_4', userId: 'usr_demo', postId: 'post_2', createdAt: '2026-09-27T05:00:00.000Z' },
    { id: 'lik_5', userId: 'usr_maya', postId: 'post_2', createdAt: '2026-09-27T06:15:00.000Z' },
    { id: 'lik_6', userId: 'usr_maya', postId: 'post_3', createdAt: '2026-09-27T13:00:00.000Z' },
    { id: 'lik_7', userId: 'usr_liam', postId: 'post_3', createdAt: '2026-09-27T13:45:00.000Z' },
    { id: 'lik_8', userId: 'usr_alex', postId: 'post_4', createdAt: '2026-09-27T16:00:00.000Z' }
  ];

  const bookmarks: Bookmark[] = [
    { id: 'bm_1', userId: 'usr_demo', postId: 'post_1', createdAt: '2026-09-26T20:05:00.000Z' }
  ];

  const comments: Comment[] = [
    {
      id: 'com_1',
      postId: 'post_1',
      authorId: 'usr_alex',
      content: 'The depth of field and tonal contrast here is stunning Maya! Which lens did you take this with?',
      createdAt: '2026-09-26T19:30:00.000Z'
    },
    {
      id: 'com_2',
      postId: 'post_1',
      authorId: 'usr_maya',
      content: 'Thank you Alex! Shot on a 35mm prime f/2.0 at 1/160s. Natural light only.',
      createdAt: '2026-09-26T19:42:00.000Z'
    },
    {
      id: 'com_3',
      postId: 'post_2',
      authorId: 'usr_demo',
      content: 'Love the minimalist setup! Clean workspace and clean code go hand in hand.',
      createdAt: '2026-09-27T05:15:00.000Z'
    },
    {
      id: 'com_4',
      postId: 'post_3',
      authorId: 'usr_maya',
      content: 'Breathtaking elevation. The golden band of light on the crest is pure magic Elena.',
      createdAt: '2026-09-27T13:05:00.000Z'
    },
    {
      id: 'com_5',
      postId: 'post_4',
      authorId: 'usr_alex',
      content: 'Need to order a bag of that Yirgacheffe roast. Coffee fuel for the terminal sessions!',
      createdAt: '2026-09-27T16:10:00.000Z'
    }
  ];

  const notifications: Notification[] = [
    {
      id: 'notif_1',
      userId: 'usr_demo',
      actorId: 'usr_maya',
      type: 'follow',
      read: false,
      createdAt: '2026-09-27T18:00:00.000Z'
    },
    {
      id: 'notif_2',
      userId: 'usr_demo',
      actorId: 'usr_alex',
      type: 'like',
      postId: 'post_2',
      read: false,
      createdAt: '2026-09-27T19:00:00.000Z'
    }
  ];

  return { users, follows, posts, likes, bookmarks, comments, notifications };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Error reading database, creating new seed:', err);
    }
    const seed = getInitialSeedData();
    this.saveData(seed);
    return seed;
  }

  private saveData(data: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  public save(): void {
    this.saveData(this.data);
  }

  // User queries
  public getUsers(): User[] {
    return this.data.users;
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByUsername(username: string): User | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<Pick<User, 'name' | 'bio' | 'avatar' | 'location' | 'website'>>): User | undefined {
    const user = this.findUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates);
    this.save();
    return user;
  }

  // Follow queries
  public getFollows(): Follow[] {
    return this.data.follows;
  }

  public getFollowers(userId: string): Follow[] {
    return this.data.follows.filter((f) => f.followingId === userId);
  }

  public getFollowing(userId: string): Follow[] {
    return this.data.follows.filter((f) => f.followerId === userId);
  }

  public isFollowing(followerId: string, followingId: string): boolean {
    return this.data.follows.some((f) => f.followerId === followerId && f.followingId === followingId);
  }

  public toggleFollow(followerId: string, followingId: string): { followed: boolean } {
    if (followerId === followingId) return { followed: false };
    const existingIndex = this.data.follows.findIndex((f) => f.followerId === followerId && f.followingId === followingId);
    if (existingIndex >= 0) {
      this.data.follows.splice(existingIndex, 1);
      this.save();
      return { followed: false };
    } else {
      const follow: Follow = {
        id: 'fol_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        followerId,
        followingId,
        createdAt: new Date().toISOString()
      };
      this.data.follows.push(follow);
      // Create notification
      this.addNotification({
        userId: followingId,
        actorId: followerId,
        type: 'follow',
        read: false
      });
      this.save();
      return { followed: true };
    }
  }

  // Post queries
  public getPosts(): Post[] {
    return this.data.posts;
  }

  public findPostById(id: string): Post | undefined {
    return this.data.posts.find((p) => p.id === id);
  }

  public createPost(authorId: string, content: string, tags: string[], imageUrl?: string): Post {
    const post: Post = {
      id: 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      authorId,
      content,
      imageUrl,
      tags,
      createdAt: new Date().toISOString()
    };
    this.data.posts.unshift(post);
    this.save();
    return post;
  }

  public deletePost(postId: string, userId: string): boolean {
    const postIndex = this.data.posts.findIndex((p) => p.id === postId && p.authorId === userId);
    if (postIndex === -1) return false;
    this.data.posts.splice(postIndex, 1);
    // Cleanup related comments, likes, bookmarks
    this.data.comments = this.data.comments.filter((c) => c.postId !== postId);
    this.data.likes = this.data.likes.filter((l) => l.postId !== postId);
    this.data.bookmarks = this.data.bookmarks.filter((b) => b.postId !== postId);
    this.save();
    return true;
  }

  // Like queries
  public toggleLike(userId: string, postId: string): { liked: boolean; count: number } {
    const existingIndex = this.data.likes.findIndex((l) => l.userId === userId && l.postId === postId);
    const post = this.findPostById(postId);
    let liked = false;
    if (existingIndex >= 0) {
      this.data.likes.splice(existingIndex, 1);
      liked = false;
    } else {
      const like: Like = {
        id: 'lik_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        userId,
        postId,
        createdAt: new Date().toISOString()
      };
      this.data.likes.push(like);
      liked = true;

      if (post && post.authorId !== userId) {
        this.addNotification({
          userId: post.authorId,
          actorId: userId,
          type: 'like',
          postId,
          read: false
        });
      }
    }
    this.save();
    const count = this.data.likes.filter((l) => l.postId === postId).length;
    return { liked, count };
  }

  public isPostLiked(userId: string, postId: string): boolean {
    return this.data.likes.some((l) => l.userId === userId && l.postId === postId);
  }

  public getPostLikesCount(postId: string): number {
    return this.data.likes.filter((l) => l.postId === postId).length;
  }

  public getUserLikedPostIds(userId: string): string[] {
    return this.data.likes.filter((l) => l.userId === userId).map((l) => l.postId);
  }

  // Bookmark queries
  public toggleBookmark(userId: string, postId: string): { bookmarked: boolean } {
    const existingIndex = this.data.bookmarks.findIndex((b) => b.userId === userId && b.postId === postId);
    let bookmarked = false;
    if (existingIndex >= 0) {
      this.data.bookmarks.splice(existingIndex, 1);
      bookmarked = false;
    } else {
      this.data.bookmarks.push({
        id: 'bm_' + Date.now(),
        userId,
        postId,
        createdAt: new Date().toISOString()
      });
      bookmarked = true;
    }
    this.save();
    return { bookmarked };
  }

  public isPostBookmarked(userId: string, postId: string): boolean {
    return this.data.bookmarks.some((b) => b.userId === userId && b.postId === postId);
  }

  public getUserBookmarkedPostIds(userId: string): string[] {
    return this.data.bookmarks.filter((b) => b.userId === userId).map((b) => b.postId);
  }

  // Comments
  public getPostComments(postId: string): Comment[] {
    return this.data.comments
      .filter((c) => c.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public getPostCommentsCount(postId: string): number {
    return this.data.comments.filter((c) => c.postId === postId).length;
  }

  public createComment(postId: string, authorId: string, content: string): Comment | undefined {
    const post = this.findPostById(postId);
    if (!post) return undefined;
    const comment: Comment = {
      id: 'com_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      postId,
      authorId,
      content,
      createdAt: new Date().toISOString()
    };
    this.data.comments.push(comment);

    if (post.authorId !== authorId) {
      this.addNotification({
        userId: post.authorId,
        actorId: authorId,
        type: 'comment',
        postId,
        read: false
      });
    }

    this.save();
    return comment;
  }

  public deleteComment(commentId: string, userId: string): boolean {
    const index = this.data.comments.findIndex((c) => c.id === commentId && c.authorId === userId);
    if (index === -1) return false;
    this.data.comments.splice(index, 1);
    this.save();
    return true;
  }

  // Notifications
  public addNotification(notif: Omit<Notification, 'id' | 'createdAt'>): void {
    const item: Notification = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      ...notif,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(item);
  }

  public getUserNotifications(userId: string): Notification[] {
    return this.data.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public markNotificationsRead(userId: string): void {
    let changed = false;
    for (const n of this.data.notifications) {
      if (n.userId === userId && !n.read) {
        n.read = true;
        changed = true;
      }
    }
    if (changed) this.save();
  }
}

export const db = new Database();
