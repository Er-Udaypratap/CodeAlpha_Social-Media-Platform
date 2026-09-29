import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { User, Post } from '../types/index.ts';
import { PostCard } from './PostCard.tsx';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Check,
  UserPlus,
  Edit3
} from 'lucide-react';

interface ProfileViewProps {
  username: string;
  onBack: () => void;
  onEditProfile: () => void;
  onViewProfile: (username: string) => void;
  onSelectTag: (tag: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  username,
  onBack,
  onEditProfile,
  onViewProfile,
  onSelectTag,
}) => {
  const { currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const fetchProfileData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getProfile(username);
      setProfileUser(res.user);
      setIsFollowing(!!res.user.isFollowing);
      setFollowersCount(res.user.followersCount || 0);

      const postsRes = await api.getPosts({ author: username });
      setPosts(postsRes.posts);
    } catch (err) {
      console.error('Failed to load user profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleToggleFollow = async () => {
    if (!profileUser || !currentUser) return;
    setIsFollowLoading(true);
    try {
      const res = await api.toggleFollow(profileUser.id);
      setIsFollowing(res.followed);
      setFollowersCount(res.followersCount);
    } catch (err) {
      console.error('Failed to follow:', err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    if (profileUser) {
      setProfileUser({
        ...profileUser,
        postsCount: Math.max(0, (profileUser.postsCount || 1) - 1),
      });
    }
  };

  const isOwnProfile = currentUser?.username === username;

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
        <p className="mt-3 text-xs text-neutral-500">Loading creator profile...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-sm text-neutral-400">User @{username} not found.</p>
        <button
          onClick={onBack}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-800"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  const joinDate = new Date(profileUser.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          title="Back to Feed"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">{profileUser.name}</h1>
          <p className="text-xs text-neutral-500 font-mono tabular-nums">
            {profileUser.postsCount || 0} posts published
          </p>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={profileUser.avatar}
              alt={profileUser.name}
              referrerPolicy="no-referrer"
              className="h-20 w-20 rounded-full object-cover border-2 border-neutral-700 bg-neutral-800 shadow-md shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${profileUser.username}`;
              }}
            />
            <div>
              <h2 className="text-xl font-bold text-white">{profileUser.name}</h2>
              <p className="text-sm text-neutral-400 font-medium">@{profileUser.username}</p>
            </div>
          </div>

          <div>
            {isOwnProfile ? (
              <button
                onClick={onEditProfile}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/80 px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 hover:text-white transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={handleToggleFollow}
                disabled={isFollowLoading}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold transition-all ${
                  isFollowing
                    ? 'border border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-rose-900/60 hover:bg-rose-950/20 hover:text-rose-400'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20'
                }`}
              >
                {isFollowing ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Bio */}
        {profileUser.bio && (
          <p className="text-sm text-neutral-300 leading-relaxed">{profileUser.bio}</p>
        )}

        {/* Unboxed Metadata: location, website, join date */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-400">
          {profileUser.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-neutral-500" />
              <span>{profileUser.location}</span>
            </div>
          )}

          {profileUser.website && (
            <div className="flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-neutral-500" />
              <a
                href={profileUser.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline"
              >
                {profileUser.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-neutral-500" />
            <span>Joined {joinDate}</span>
          </div>
        </div>

        {/* Follower Stats with Tabular Numerals */}
        <div className="flex items-center gap-6 pt-3 border-t border-neutral-800/80 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white font-mono tabular-nums">
              {profileUser.followingCount || 0}
            </span>
            <span className="text-neutral-500 text-xs">Following</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white font-mono tabular-nums">
              {followersCount}
            </span>
            <span className="text-neutral-500 text-xs">Followers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white font-mono tabular-nums">
              {profileUser.postsCount || 0}
            </span>
            <span className="text-neutral-500 text-xs">Posts</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800">
        <button
          onClick={() => setActiveTab('posts')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-colors relative ${
            activeTab === 'posts' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <span>Posts</span>
          {activeTab === 'posts' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Posts Stream */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-neutral-900 bg-neutral-900/20 p-8 text-center">
            <p className="text-xs text-neutral-500">No posts shared by this creator yet.</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPostDeleted={handlePostDeleted}
              onViewProfile={onViewProfile}
              onSelectTag={onSelectTag}
            />
          ))
        )}
      </div>
    </div>
  );
};
