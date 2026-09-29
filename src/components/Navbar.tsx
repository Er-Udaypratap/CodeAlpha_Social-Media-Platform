import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Bell, PenSquare, Search, User as UserIcon, Users, Compass, Bookmark, TrendingUp } from 'lucide-react';
import { FeedMode } from '../types/index.ts';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  feedMode: FeedMode;
  onFeedModeChange: (mode: FeedMode) => void;
  onOpenComposer: () => void;
  onOpenNotifications: () => void;
  onOpenUserSwitcher: () => void;
  onOpenAuth: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  unreadCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  feedMode,
  onFeedModeChange,
  onOpenComposer,
  onOpenNotifications,
  onOpenUserSwitcher,
  onOpenAuth,
  searchQuery,
  onSearchChange,
  unreadCount,
}) => {
  const { currentUser } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              onTabChange('feed');
              onFeedModeChange('personalized');
            }}
            className="group flex items-center gap-2.5 text-left focus:outline-none"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-black tracking-tight text-white shadow-sm shadow-indigo-500/20 group-hover:bg-indigo-500 transition-colors">
              P
            </span>
            <span className="text-xl font-bold tracking-tight text-white">
              Pulse
            </span>
          </button>

          {/* Quick Search on larger screens */}
          <div className="relative hidden md:block w-64 lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search posts, tags, creators..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900/80 py-1.5 pl-9 pr-3 text-sm text-neutral-200 placeholder-neutral-500 focus:border-indigo-500 focus:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-neutral-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Zone 2: 4-6 text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => {
              onTabChange('feed');
              onFeedModeChange('personalized');
            }}
            className={`transition-colors hover:text-white ${
              currentTab === 'feed' && feedMode === 'personalized'
                ? 'text-white font-semibold'
                : 'text-neutral-400'
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => {
              onTabChange('feed');
              onFeedModeChange('explore');
            }}
            className={`transition-colors hover:text-white ${
              currentTab === 'feed' && feedMode === 'explore'
                ? 'text-white font-semibold'
                : 'text-neutral-400'
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => {
              onTabChange('feed');
              onFeedModeChange('trending');
            }}
            className={`transition-colors hover:text-white ${
              currentTab === 'feed' && feedMode === 'trending'
                ? 'text-white font-semibold'
                : 'text-neutral-400'
            }`}
          >
            Trending
          </button>
          <button
            onClick={() => {
              onTabChange('feed');
              onFeedModeChange('bookmarks');
            }}
            className={`transition-colors hover:text-white ${
              currentTab === 'feed' && feedMode === 'bookmarks'
                ? 'text-white font-semibold'
                : 'text-neutral-400'
            }`}
          >
            Saved
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              {/* Notification icon */}
              <button
                onClick={onOpenNotifications}
                className="relative rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                )}
              </button>

              {/* Compose button */}
              <button
                onClick={onOpenComposer}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-95 transition-all whitespace-nowrap"
              >
                <PenSquare className="h-4 w-4" />
                <span className="hidden sm:inline">New Post</span>
              </button>

              {/* Account switcher / avatar */}
              <div className="flex items-center gap-2 pl-1 border-l border-neutral-800">
                <button
                  onClick={() => onTabChange(`profile:${currentUser.username}`)}
                  className="flex items-center gap-2 rounded-lg p-1 hover:bg-neutral-900 transition-colors"
                  title={`View @${currentUser.username}'s profile`}
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="h-7 w-7 rounded-full object-cover border border-neutral-700 bg-neutral-800"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.username}`;
                    }}
                  />
                  <span className="hidden xl:inline text-xs font-medium text-neutral-300 max-w-[100px] truncate">
                    {currentUser.name}
                  </span>
                </button>

                <button
                  onClick={onOpenUserSwitcher}
                  className="rounded-md border border-neutral-800 bg-neutral-900/90 px-2 py-1 text-[11px] font-medium text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors whitespace-nowrap"
                  title="Switch accounts to test social interactions"
                >
                  Switch User
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuth}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-500 transition-colors whitespace-nowrap"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
