import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { User, Trend } from '../types/index.ts';
import { Search, Sparkles, Hash, Check, UserPlus } from 'lucide-react';

interface SidebarRightProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectTag: (tag: string) => void;
  onViewProfile: (username: string) => void;
  onFollowChanged?: () => void;
}

export const SidebarRight: React.FC<SidebarRightProps> = ({
  searchQuery,
  onSearchChange,
  onSelectTag,
  onViewProfile,
  onFollowChanged,
}) => {
  const { currentUser } = useAuth();
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  const [loadingFollowId, setLoadingFollowId] = useState<string | null>(null);

  const fetchSideData = useCallback(async () => {
    try {
      const [usersRes, trendsRes] = await Promise.all([
        api.getSuggestedUsers(),
        api.getTrends(),
      ]);
      setSuggestedUsers(usersRes.users);
      setTrends(trendsRes.trends);

      const states: Record<string, boolean> = {};
      for (const u of usersRes.users) {
        states[u.id] = !!u.isFollowing;
      }
      setFollowingStates(states);
    } catch (err) {
      console.error('Error fetching sidebar data:', err);
    }
  }, []);

  useEffect(() => {
    fetchSideData();
  }, [fetchSideData, currentUser]);

  const handleToggleFollow = async (userId: string) => {
    if (!currentUser) return;
    setLoadingFollowId(userId);
    try {
      const res = await api.toggleFollow(userId);
      setFollowingStates((prev) => ({
        ...prev,
        [userId]: res.followed,
      }));
      if (onFollowChanged) {
        onFollowChanged();
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    } finally {
      setLoadingFollowId(null);
    }
  };

  return (
    <aside className="hidden xl:flex w-80 flex-col gap-6 py-6 pl-6 border-l border-neutral-900 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      {/* Search Input */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
        <input
          type="text"
          placeholder="Search Pulse..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 py-2.5 pl-10 pr-4 text-sm text-neutral-200 placeholder-neutral-500 focus:border-indigo-500 focus:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-neutral-300"
          >
            Clear
          </button>
        )}
      </div>

      {/* Suggested Creators */}
      <div className="rounded-2xl border border-neutral-900 bg-neutral-900/40 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-neutral-200">Who to Follow</h2>
          <span className="text-xs text-neutral-500">Suggested</span>
        </div>

        <div className="space-y-3.5">
          {suggestedUsers.length === 0 ? (
            <p className="text-xs text-neutral-500 py-2 text-center">You follow everyone suggested!</p>
          ) : (
            suggestedUsers.map((user) => {
              const isFollowing = followingStates[user.id] ?? user.isFollowing;
              const isLoading = loadingFollowId === user.id;

              return (
                <div key={user.id} className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => onViewProfile(user.username)}
                    className="flex items-center gap-3 min-w-0 text-left group"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded-full object-cover border border-neutral-800 bg-neutral-800 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`;
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-neutral-200 group-hover:text-indigo-400 transition-colors truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate">@{user.username}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleToggleFollow(user.id)}
                    disabled={isLoading}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                      isFollowing
                        ? 'border border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-rose-900/50 hover:bg-rose-950/20 hover:text-rose-400'
                        : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3 w-3" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Trending Topics (Disciplined clean layout with no pill enclosures!) */}
      <div className="rounded-2xl border border-neutral-900 bg-neutral-900/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-neutral-200">Trending Topics</h2>
          <span className="text-xs text-neutral-500">Community</span>
        </div>

        <div className="space-y-2.5">
          {trends.length === 0 ? (
            <p className="text-xs text-neutral-500 py-2">No trending topics yet</p>
          ) : (
            trends.map((item) => (
              <button
                key={item.tag}
                onClick={() => onSelectTag(item.tag)}
                className="group flex w-full items-center justify-between rounded-lg p-2 text-left hover:bg-neutral-900/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-neutral-500 group-hover:text-indigo-400 transition-colors" />
                  <span className="text-xs font-medium text-neutral-300 group-hover:text-white transition-colors">
                    {item.tag}
                  </span>
                </div>
                <span className="text-[11px] text-neutral-500 font-mono tabular-nums">
                  {item.count} {item.count === 1 ? 'post' : 'posts'}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Editorial footer */}
      <div className="text-[11px] text-neutral-600 space-y-1 px-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>Pulse Social</span>
          <span aria-hidden="true">·</span>
          <span>Community Guidelines</span>
          <span aria-hidden="true">·</span>
          <span>Privacy</span>
        </div>
        <p className="text-neutral-700">© 2026 Pulse. Pure human content.</p>
      </div>
    </aside>
  );
};
