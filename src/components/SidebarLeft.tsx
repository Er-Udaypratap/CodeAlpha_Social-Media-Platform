import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Home,
  Compass,
  TrendingUp,
  Bookmark,
  Bell,
  User,
  PenSquare,
  LogOut,
  Users
} from 'lucide-react';
import { FeedMode } from '../types/index.ts';

interface SidebarLeftProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  feedMode: FeedMode;
  onFeedModeChange: (mode: FeedMode) => void;
  onOpenComposer: () => void;
  onOpenNotifications: () => void;
  onOpenUserSwitcher: () => void;
  unreadCount: number;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
  currentTab,
  onTabChange,
  feedMode,
  onFeedModeChange,
  onOpenComposer,
  onOpenNotifications,
  onOpenUserSwitcher,
  unreadCount,
}) => {
  const { currentUser, logout } = useAuth();

  const navItems = [
    {
      id: 'feed',
      label: 'Home Feed',
      icon: Home,
      action: () => {
        onTabChange('feed');
        onFeedModeChange('personalized');
      },
      isActive: currentTab === 'feed' && feedMode === 'personalized',
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: Compass,
      action: () => {
        onTabChange('feed');
        onFeedModeChange('explore');
      },
      isActive: currentTab === 'feed' && feedMode === 'explore',
    },
    {
      id: 'trending',
      label: 'Trending',
      icon: TrendingUp,
      action: () => {
        onTabChange('feed');
        onFeedModeChange('trending');
      },
      isActive: currentTab === 'feed' && feedMode === 'trending',
    },
    {
      id: 'bookmarks',
      label: 'Saved Posts',
      icon: Bookmark,
      action: () => {
        onTabChange('feed');
        onFeedModeChange('bookmarks');
      },
      isActive: currentTab === 'feed' && feedMode === 'bookmarks',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadCount,
      action: () => onOpenNotifications(),
      isActive: false,
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: User,
      action: () => {
        if (currentUser) {
          onTabChange(`profile:${currentUser.username}`);
        }
      },
      isActive: currentUser ? currentTab === `profile:${currentUser.username}` : false,
    },
  ];

  return (
    <aside className="hidden lg:flex w-64 flex-col justify-between py-6 pr-6 border-r border-neutral-900 sticky top-16 h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Navigation list */}
        <nav className="space-y-1.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  item.isActive
                    ? 'bg-neutral-900 text-white font-semibold shadow-sm'
                    : 'text-neutral-400 hover:bg-neutral-900/60 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-5 w-5 transition-colors ${
                      item.isActive ? 'text-indigo-400' : 'text-neutral-400 group-hover:text-neutral-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-bold text-white tabular-nums">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Primary CTA */}
        <button
          onClick={onOpenComposer}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 active:scale-[0.98] transition-all"
        >
          <PenSquare className="h-4 w-4" />
          <span>Publish Post</span>
        </button>
      </div>

      {/* User profile card & switch account */}
      {currentUser && (
        <div className="space-y-3 pt-4 border-t border-neutral-900">
          <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/50 hover:bg-neutral-900 transition-colors">
            <button
              onClick={() => onTabChange(`profile:${currentUser.username}`)}
              className="flex items-center gap-3 min-w-0 text-left"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="h-9 w-9 rounded-full object-cover border border-neutral-800 bg-neutral-800 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.username}`;
                }}
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-neutral-200 truncate">{currentUser.name}</p>
                <p className="text-[11px] text-neutral-500 truncate">@{currentUser.username}</p>
              </div>
            </button>

            <button
              onClick={logout}
              className="p-1.5 text-neutral-400 hover:text-rose-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={onOpenUserSwitcher}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-800/80 bg-neutral-950 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 transition-colors"
          >
            <Users className="h-3.5 w-3.5 text-neutral-400" />
            <span>Switch Test Account</span>
          </button>
        </div>
      )}
    </aside>
  );
};
