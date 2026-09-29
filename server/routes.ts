import express, { Request, Response, NextFunction } from 'express';
import { db, hashPassword, User, Post } from './db.ts';

export const apiRouter = express.Router();

// Middleware to extract authenticated user
export interface AuthRequest extends Request {
  user?: User;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const customUserId = req.headers['x-user-id'] as string;

  let userId: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    userId = authHeader.substring(7).trim();
  } else if (customUserId) {
    userId = customUserId;
  }

  if (userId) {
    const user = db.findUserById(userId);
    if (user) {
      req.user = user;
    }
  }
  next();
}

// Helper to format post with author and user-specific status
function enrichPost(post: Post, currentUserId?: string) {
  const author = db.findUserById(post.authorId);
  const likesCount = db.getPostLikesCount(post.id);
  const commentsCount = db.getPostCommentsCount(post.id);
  const isLiked = currentUserId ? db.isPostLiked(currentUserId, post.id) : false;
  const isBookmarked = currentUserId ? db.isPostBookmarked(currentUserId, post.id) : false;

  return {
    ...post,
    author: author
      ? {
          id: author.id,
          name: author.name,
          username: author.username,
          avatar: author.avatar,
          bio: author.bio
        }
      : {
          id: post.authorId,
          name: 'Anonymous',
          username: 'anonymous',
          avatar: '',
          bio: ''
        },
    likesCount,
    commentsCount,
    isLiked,
    isBookmarked
  };
}

// -----------------------------------------------------------------------------
// AUTH ROUTES
// -----------------------------------------------------------------------------

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, username, email, password, bio, avatar } = req.body;

  if (!username || !email || !password || !name) {
    return res.status(400).json({ error: 'Name, username, email, and password are required.' });
  }

  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters alphanumeric.' });
  }

  if (db.findUserByUsername(cleanUsername)) {
    return res.status(400).json({ error: 'Username is already taken.' });
  }

  if (db.findUserByEmail(email)) {
    return res.status(400).json({ error: 'Email is already registered.' });
  }

  const defaultAvatar = avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanUsername}`;

  const newUser: User = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    username: cleanUsername,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    avatar: defaultAvatar,
    bio: (bio || 'Exploring ideas and connecting on Pulse.').trim(),
    location: '',
    website: '',
    createdAt: new Date().toISOString()
  };

  db.createUser(newUser);

  // Automatically follow the platform demo creators so feed is immediately vibrant!
  db.toggleFollow(newUser.id, 'usr_maya');
  db.toggleFollow(newUser.id, 'usr_alex');

  return res.status(201).json({
    token: newUser.id,
    user: {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      email: newUser.email,
      avatar: newUser.avatar,
      bio: newUser.bio,
      location: newUser.location,
      website: newUser.website,
      createdAt: newUser.createdAt
    }
  });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Identifier (username/email) and password are required.' });
  }

  const user = db.findUserByUsername(identifier) || db.findUserByEmail(identifier);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const hashedPassword = hashPassword(password);
  if (user.passwordHash !== hashedPassword) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  return res.json({
    token: user.id,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      website: user.website,
      createdAt: user.createdAt
    }
  });
});

apiRouter.get('/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const followers = db.getFollowers(req.user.id).length;
  const following = db.getFollowing(req.user.id).length;
  const postsCount = db.getPosts().filter((p) => p.authorId === req.user!.id).length;
  const unreadNotifs = db.getUserNotifications(req.user.id).filter((n) => !n.read).length;

  return res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      bio: req.user.bio,
      location: req.user.location,
      website: req.user.website,
      createdAt: req.user.createdAt,
      followersCount: followers,
      followingCount: following,
      postsCount,
      unreadNotifs
    }
  });
});

// Quick switch user list for testing multi-user experience seamlessly
apiRouter.get('/auth/demo-users', (req: Request, res: Response) => {
  const users = db.getUsers().map((u) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    avatar: u.avatar,
    bio: u.bio
  }));
  return res.json({ users });
});

// -----------------------------------------------------------------------------
// USER PROFILES & FOLLOW SYSTEM
// -----------------------------------------------------------------------------

apiRouter.get('/users/profile/:username', authMiddleware, (req: AuthRequest, res: Response) => {
  const { username } = req.params;
  const targetUser = db.findUserByUsername(username);

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const followers = db.getFollowers(targetUser.id);
  const following = db.getFollowing(targetUser.id);
  const posts = db.getPosts().filter((p) => p.authorId === targetUser.id);

  const isFollowing = req.user ? db.isFollowing(req.user.id, targetUser.id) : false;
  const isSelf = req.user ? req.user.id === targetUser.id : false;

  return res.json({
    user: {
      id: targetUser.id,
      username: targetUser.username,
      name: targetUser.name,
      avatar: targetUser.avatar,
      bio: targetUser.bio,
      location: targetUser.location,
      website: targetUser.website,
      createdAt: targetUser.createdAt,
      followersCount: followers.length,
      followingCount: following.length,
      postsCount: posts.length,
      isFollowing,
      isSelf
    }
  });
});

apiRouter.put('/users/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { name, bio, avatar, location, website } = req.body;
  const updated = db.updateUser(req.user.id, {
    ...(name !== undefined && { name: name.trim() }),
    ...(bio !== undefined && { bio: bio.trim() }),
    ...(avatar !== undefined && { avatar: avatar.trim() }),
    ...(location !== undefined && { location: location.trim() }),
    ...(website !== undefined && { website: website.trim() })
  });

  return res.json({ user: updated });
});

apiRouter.post('/users/:id/follow', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const targetId = req.params.id;
  const targetUser = db.findUserById(targetId);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  const result = db.toggleFollow(req.user.id, targetId);
  const followersCount = db.getFollowers(targetId).length;

  return res.json({
    followed: result.followed,
    followersCount
  });
});

apiRouter.get('/users/suggested', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user?.id;
  const allUsers = db.getUsers();

  const suggested = allUsers
    .filter((u) => u.id !== currentUserId)
    .map((u) => {
      const isFollowing = currentUserId ? db.isFollowing(currentUserId, u.id) : false;
      const followersCount = db.getFollowers(u.id).length;
      return {
        id: u.id,
        username: u.username,
        name: u.name,
        avatar: u.avatar,
        bio: u.bio,
        followersCount,
        isFollowing
      };
    })
    .sort((a, b) => (a.isFollowing === b.isFollowing ? b.followersCount - a.followersCount : a.isFollowing ? 1 : -1))
    .slice(0, 5);

  return res.json({ users: suggested });
});

// -----------------------------------------------------------------------------
// POSTS & FEEDS (Personalized, Explore, Trending, User Posts)
// -----------------------------------------------------------------------------

apiRouter.get('/posts', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user?.id;
  const feed = (req.query.feed as string) || 'personalized';
  const tag = req.query.tag as string;
  const authorUsername = req.query.author as string;
  const search = req.query.search as string;

  let allPosts = db.getPosts();

  // Author filter (for profile page)
  if (authorUsername) {
    const author = db.findUserByUsername(authorUsername);
    if (!author) {
      return res.json({ posts: [], count: 0 });
    }
    allPosts = allPosts.filter((p) => p.authorId === author.id);
  }

  // Tag filter
  if (tag) {
    const cleanTag = tag.replace('#', '').toLowerCase();
    allPosts = allPosts.filter((p) => p.tags.some((t) => t.toLowerCase() === cleanTag));
  }

  // Search filter
  if (search) {
    const s = search.toLowerCase();
    allPosts = allPosts.filter((p) => {
      const author = db.findUserById(p.authorId);
      return (
        p.content.toLowerCase().includes(s) ||
        p.tags.some((t) => t.toLowerCase().includes(s)) ||
        (author && (author.name.toLowerCase().includes(s) || author.username.toLowerCase().includes(s)))
      );
    });
  }

  // Bookmarks feed
  if (feed === 'bookmarks' && currentUserId) {
    const bookmarkedIds = new Set(db.getUserBookmarkedPostIds(currentUserId));
    allPosts = allPosts.filter((p) => bookmarkedIds.has(p.id));
  }

  // Personalized feed logic:
  // If user is authenticated and asks for 'personalized' feed:
  // Show posts from users they follow + their own posts!
  if (feed === 'personalized' && currentUserId && !authorUsername && !tag && !search) {
    const following = db.getFollowing(currentUserId).map((f) => f.followingId);
    const relevantUserIds = new Set([...following, currentUserId]);

    // If following people, prioritize followed creators
    const followedPosts = allPosts.filter((p) => relevantUserIds.has(p.authorId));

    // If followed posts is empty (e.g. user just started and unfollowed everyone), fallback to global explore
    if (followedPosts.length > 0) {
      allPosts = followedPosts;
    }
  }

  // Trending sort: order by engagement (likes + comments)
  if (feed === 'trending') {
    allPosts = [...allPosts].sort((a, b) => {
      const aScore = db.getPostLikesCount(a.id) * 2 + db.getPostCommentsCount(a.id);
      const bScore = db.getPostLikesCount(b.id) * 2 + db.getPostCommentsCount(b.id);
      return bScore - aScore;
    });
  } else {
    // Default newest first
    allPosts = [...allPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const enriched = allPosts.map((p) => enrichPost(p, currentUserId));

  return res.json({
    posts: enriched,
    count: enriched.length,
    feedMode: feed
  });
});

apiRouter.post('/posts', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'You must be logged in to create a post.' });
  }

  const { content, imageUrl, tags } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Post content cannot be empty.' });
  }

  // Parse hashtags from text if not explicitly provided
  let postTags: string[] = Array.isArray(tags) ? tags : [];
  if (postTags.length === 0) {
    const tagMatches = content.match(/#[a-zA-Z0-9_]+/g);
    if (tagMatches) {
      postTags = tagMatches.map((t: string) => t.substring(1).toLowerCase());
    }
  }

  const newPost = db.createPost(req.user.id, content.trim(), postTags, imageUrl);
  const enriched = enrichPost(newPost, req.user.id);

  return res.status(201).json({ post: enriched });
});

apiRouter.get('/posts/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const post = db.findPostById(req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const enriched = enrichPost(post, req.user?.id);
  return res.json({ post: enriched });
});

apiRouter.delete('/posts/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const success = db.deletePost(req.params.id, req.user.id);
  if (!success) {
    return res.status(403).json({ error: 'Unable to delete post. Either post was not found or you are not the author.' });
  }

  return res.json({ message: 'Post deleted successfully' });
});

// Like / Unlike
apiRouter.post('/posts/:id/like', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'You must be logged in to like posts.' });
  }

  const post = db.findPostById(req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const result = db.toggleLike(req.user.id, post.id);
  return res.json({
    liked: result.liked,
    likesCount: result.count
  });
});

// Bookmark / Unbookmark
apiRouter.post('/posts/:id/bookmark', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'You must be logged in to bookmark posts.' });
  }

  const post = db.findPostById(req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const result = db.toggleBookmark(req.user.id, post.id);
  return res.json({
    bookmarked: result.bookmarked
  });
});

// -----------------------------------------------------------------------------
// COMMENTS
// -----------------------------------------------------------------------------

apiRouter.get('/posts/:id/comments', (req: Request, res: Response) => {
  const post = db.findPostById(req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const rawComments = db.getPostComments(post.id);
  const enrichedComments = rawComments.map((c) => {
    const author = db.findUserById(c.authorId);
    return {
      ...c,
      author: author
        ? {
            id: author.id,
            name: author.name,
            username: author.username,
            avatar: author.avatar
          }
        : {
            id: c.authorId,
            name: 'Anonymous',
            username: 'anonymous',
            avatar: ''
          }
    };
  });

  return res.json({ comments: enrichedComments });
});

apiRouter.post('/posts/:id/comments', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'You must be logged in to comment.' });
  }

  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content cannot be empty.' });
  }

  const comment = db.createComment(req.params.id, req.user.id, content.trim());
  if (!comment) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const enriched = {
    ...comment,
    author: {
      id: req.user.id,
      name: req.user.name,
      username: req.user.username,
      avatar: req.user.avatar
    }
  };

  const commentsCount = db.getPostCommentsCount(req.params.id);

  return res.status(201).json({
    comment: enriched,
    commentsCount
  });
});

apiRouter.delete('/posts/:postId/comments/:commentId', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const success = db.deleteComment(req.params.commentId, req.user.id);
  if (!success) {
    return res.status(403).json({ error: 'Unable to delete comment. You may only delete your own comments.' });
  }

  const commentsCount = db.getPostCommentsCount(req.params.postId);
  return res.json({ message: 'Comment deleted successfully', commentsCount });
});

// -----------------------------------------------------------------------------
// NOTIFICATIONS
// -----------------------------------------------------------------------------

apiRouter.get('/notifications', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const rawNotifs = db.getUserNotifications(req.user.id);
  const enriched = rawNotifs.map((n) => {
    const actor = db.findUserById(n.actorId);
    let postSnippet = '';
    if (n.postId) {
      const post = db.findPostById(n.postId);
      if (post) {
        postSnippet = post.content.substring(0, 60);
      }
    }
    return {
      ...n,
      actor: actor
        ? {
            id: actor.id,
            name: actor.name,
            username: actor.username,
            avatar: actor.avatar
          }
        : null,
      postSnippet
    };
  });

  return res.json({ notifications: enriched });
});

apiRouter.post('/notifications/read', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  db.markNotificationsRead(req.user.id);
  return res.json({ message: 'Notifications marked as read' });
});

// -----------------------------------------------------------------------------
// TRENDS & DISCOVER STATS
// -----------------------------------------------------------------------------

apiRouter.get('/trends', (req: Request, res: Response) => {
  const posts = db.getPosts();
  const tagCounts: Record<string, number> = {};

  for (const post of posts) {
    for (const tag of post.tags) {
      const lower = tag.toLowerCase();
      tagCounts[lower] = (tagCounts[lower] || 0) + 1;
    }
  }

  const trends = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return res.json({ trends });
});
