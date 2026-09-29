import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { Post, Comment } from '../types/index.ts';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Trash2,
  Send,
  UserPlus,
  Check,
  MoreHorizontal
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  onPostUpdated?: (updatedPost: Post) => void;
  onPostDeleted?: (postId: string) => void;
  onViewProfile: (username: string) => void;
  onSelectTag: (tag: string) => void;
  onFollowChanged?: () => void;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPostUpdated,
  onPostDeleted,
  onViewProfile,
  onSelectTag,
  onFollowChanged,
}) => {
  const { currentUser } = useAuth();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isAuthor = currentUser?.id === post.authorId;

  const handleLike = async () => {
    if (!currentUser) return;
    const nextLiked = !isLiked;
    const nextCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

    setIsLiked(nextLiked);
    setLikesCount(nextCount);
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 300);

    try {
      const res = await api.toggleLike(post.id);
      setLikesCount(res.likesCount);
      setIsLiked(res.liked);
      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          isLiked: res.liked,
          likesCount: res.likesCount,
        });
      }
    } catch (err) {
      // Revert optimistic update
      setIsLiked(!nextLiked);
      setLikesCount(likesCount);
    }
  };

  const handleBookmark = async () => {
    if (!currentUser) return;
    const nextBookmarked = !isBookmarked;
    setIsBookmarked(nextBookmarked);

    try {
      const res = await api.toggleBookmark(post.id);
      setIsBookmarked(res.bookmarked);
      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          isBookmarked: res.bookmarked,
        });
      }
    } catch {
      setIsBookmarked(!nextBookmarked);
    }
  };

  const handleToggleComments = async () => {
    const nextShow = !showComments;
    setShowComments(nextShow);

    if (nextShow && comments.length === 0) {
      setIsLoadingComments(true);
      try {
        const res = await api.getComments(post.id);
        setComments(res.comments);
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setIsSubmittingComment(true);
    try {
      const res = await api.addComment(post.id, newComment.trim());
      setComments((prev) => [...prev, res.comment]);
      setCommentsCount(res.commentsCount);
      setNewComment('');
      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          commentsCount: res.commentsCount,
        });
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await api.deleteComment(post.id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsCount(res.commentsCount);
      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          commentsCount: res.commentsCount,
        });
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    setIsDeleting(true);
    try {
      await api.deletePost(post.id);
      if (onPostDeleted) {
        onPostDeleted(post.id);
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      // Fallback
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <article className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-5 hover:border-neutral-700/80 transition-all duration-200">
      {/* Header: Author info & clean unboxed metadata */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => onViewProfile(post.author.username)}
            className="shrink-0 focus:outline-none"
          >
            <img
              src={post.author.avatar}
              alt={post.author.name}
              referrerPolicy="no-referrer"
              className="h-10 w-10 rounded-full object-cover border border-neutral-800 bg-neutral-800 hover:border-indigo-500 transition-colors"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${post.author.username}`;
              }}
            />
          </button>

          <div className="min-w-0">
            {/* Unboxed human metadata with typographic separator */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 flex-wrap">
              <button
                onClick={() => onViewProfile(post.author.username)}
                className="font-semibold text-neutral-200 hover:text-indigo-400 transition-colors truncate max-w-[140px] sm:max-w-[180px]"
              >
                {post.author.name}
              </button>
              <button
                onClick={() => onViewProfile(post.author.username)}
                className="text-neutral-500 hover:text-neutral-400 transition-colors truncate max-w-[120px]"
              >
                @{post.author.username}
              </button>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span className="text-neutral-500 shrink-0">{formatRelativeTime(post.createdAt)}</span>
            </div>
            {post.author.bio && (
              <p className="text-[11px] text-neutral-500 truncate max-w-sm hidden sm:block">
                {post.author.bio}
              </p>
            )}
          </div>
        </div>

        {/* Top actions: Delete if author */}
        <div className="flex items-center gap-1">
          {isAuthor && (
            <button
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="p-1.5 text-neutral-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-neutral-800"
              title="Delete post"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Post Text Content */}
      <div className="mt-3 text-sm text-neutral-200 leading-relaxed whitespace-pre-line">
        {post.content}
      </div>

      {/* Hashtags list (unboxed clean inline links) */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
          {post.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onSelectTag(tag)}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Attached Media Asset with Zero-Broken-Image Policy */}
      {post.imageUrl && !imageError && (
        <div className="mt-3.5 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 max-h-96">
          <img
            src={post.imageUrl}
            alt="Post media visual"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover max-h-96 hover:scale-[1.01] transition-transform duration-300"
          />
        </div>
      )}

      {/* Styled Fallback Container if image fails */}
      {post.imageUrl && imageError && (
        <div className="mt-3.5 flex h-48 w-full items-center justify-center rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 p-4 text-center">
          <span className="text-xs text-neutral-500 font-mono">Visual attachment unavailable</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="mt-4 flex items-center justify-between border-t border-neutral-800/60 pt-3 text-neutral-400 text-xs">
        <div className="flex items-center gap-5 sm:gap-6">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={`group flex items-center gap-1.5 transition-colors focus:outline-none ${
              isLiked ? 'text-rose-500 font-medium' : 'hover:text-rose-400'
            }`}
          >
            <Heart
              className={`h-4 w-4 transition-transform duration-200 ${
                isLiked ? 'fill-current scale-110' : 'group-hover:scale-110'
              } ${isLikeAnimating ? 'scale-125' : ''}`}
            />
            <span className="font-mono tabular-nums">{likesCount}</span>
          </button>

          {/* Comment Button */}
          <button
            onClick={handleToggleComments}
            className={`group flex items-center gap-1.5 transition-colors focus:outline-none ${
              showComments ? 'text-indigo-400' : 'hover:text-indigo-400'
            }`}
          >
            <MessageCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span className="font-mono tabular-nums">{commentsCount}</span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={handleBookmark}
            className={`group flex items-center gap-1.5 transition-colors focus:outline-none ${
              isBookmarked ? 'text-amber-400' : 'hover:text-amber-400'
            }`}
          >
            <Bookmark
              className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                isBookmarked ? 'fill-current' : ''
              }`}
            />
            <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        {/* Share Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 hover:text-neutral-200 transition-colors focus:outline-none"
            title="Copy share link"
          >
            <Share2 className="h-4 w-4" />
            <span className="text-[11px]">{copiedShare ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Inline Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-neutral-800/80 space-y-3">
          {/* Add Comment Input Form */}
          {currentUser ? (
            <form onSubmit={handleAddComment} className="flex gap-2.5">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="h-8 w-8 rounded-full object-cover border border-neutral-800 bg-neutral-800 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.username}`;
                }}
              />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950/80 px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          ) : (
            <p className="text-xs text-neutral-500 italic">Sign in to participate in the discussion.</p>
          )}

          {/* Comment list */}
          {isLoadingComments ? (
            <div className="py-2 text-center text-xs text-neutral-500">Loading replies...</div>
          ) : comments.length === 0 ? (
            <div className="py-2 text-center text-xs text-neutral-500">No comments yet. Be the first to share your thoughts!</div>
          ) : (
            <div className="space-y-2.5 pt-1">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start justify-between gap-2.5 text-xs bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-900">
                  <div className="flex gap-2.5 min-w-0">
                    <button
                      onClick={() => onViewProfile(comment.author.username)}
                      className="shrink-0"
                    >
                      <img
                        src={comment.author.avatar}
                        alt={comment.author.name}
                        referrerPolicy="no-referrer"
                        className="h-7 w-7 rounded-full object-cover border border-neutral-800 bg-neutral-800"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${comment.author.username}`;
                        }}
                      />
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-neutral-400">
                        <button
                          onClick={() => onViewProfile(comment.author.username)}
                          className="font-semibold text-neutral-300 hover:text-indigo-400 transition-colors truncate"
                        >
                          {comment.author.name}
                        </button>
                        <span className="text-[11px] text-neutral-500">@{comment.author.username}</span>
                        <span aria-hidden="true" className="text-neutral-700">·</span>
                        <span className="text-[11px] text-neutral-500">{formatRelativeTime(comment.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-neutral-200 leading-normal">{comment.content}</p>
                    </div>
                  </div>

                  {currentUser?.id === comment.authorId && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-neutral-600 hover:text-rose-400 transition-colors p-1"
                      title="Delete reply"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
};
