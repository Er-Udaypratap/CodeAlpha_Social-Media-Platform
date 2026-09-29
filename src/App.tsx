import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { api } from './services/api.ts';
import { Post, FeedMode } from './types/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { SidebarLeft } from './components/SidebarLeft.tsx';
import { SidebarRight } from './components/SidebarRight.tsx';
import { PostComposer } from './components/PostComposer.tsx';
import { PostCard } from './components/PostCard.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { EditProfileModal } from './components/EditProfileModal.tsx';
import { NotificationsModal } from './components/NotificationsModal.tsx';
import { UserSwitcherModal } from './components/UserSwitcherModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import {
  Compass,
  Home,
  TrendingUp,
  Bookmark,
  Bell,
  User,
  Plus,
  X,
  Sparkles,
  Users,
  Search,
  Filter
} from 'lucide-react';

function MainApp() {
  const { currentUser, refreshUser } = useAuth();

  // Navigation & filter state
  const [currentTab, setCurrentTab] = useState<string>('feed');
  const [feedMode, setFeedMode] = useState<FeedMode>('personalized');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Feed posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(true);
  const [feedSubtitle, setFeedSubtitle] = useState<string>('');

  // Modals
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);

  // Fetch feed posts
  const fetchPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const res = await api.getPosts({
        feed: feedMode,
        tag: selectedTag || undefined,
        search: searchQuery.trim() || undefined,
      });
      setPosts(res.posts);

      if (selectedTag) {
        setFeedSubtitle(`Posts tagged #${selectedTag}`);
      } else if (searchQuery.trim()) {
        setFeedSubtitle(`Search results for "${searchQuery}"`);
      } else if (feedMode === 'personalized') {
        setFeedSubtitle('Personalized stream of posts from accounts you follow');
      } else if (feedMode === 'explore') {
        setFeedSubtitle('Global stream of latest community updates');
      } else if (feedMode === 'trending') {
        setFeedSubtitle('Discussions with the highest community engagement');
      } else if (feedMode === 'bookmarks') {
        setFeedSubtitle('Your saved posts collection');
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [feedMode, selectedTag, searchQuery]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts, currentUser]);

  // Check unread notifications
  useEffect(() => {
    if (currentUser) {
      setUnreadNotifsCount(currentUser.unreadNotifs || 0);
    }
  }, [currentUser]);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
    if (currentUser) {
      refreshUser();
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  };

  const handleSelectTag = (tag: string) => {
    setSelectedTag(tag);
    setCurrentTab('feed');
  };

  const handleClearFilters = () => {
    setSelectedTag(null);
    setSearchQuery('');
  };

  const handleViewProfile = (username: string) => {
    setCurrentTab(`profile:${username}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isProfileTab = currentTab.startsWith('profile:');
  const activeProfileUsername = isProfileTab ? currentTab.replace('profile:', '') : '';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        feedMode={feedMode}
        onFeedModeChange={(mode) => {
          setFeedMode(mode);
          setSelectedTag(null);
          setSearchQuery('');
        }}
        onOpenComposer={() => setIsComposerOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenUserSwitcher={() => setIsUserSwitcherOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        unreadCount={unreadNotifsCount}
      />

      {/* Main 3-Column Layout */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 pb-20 lg:pb-8">
        {/* Left Navigation Sidebar */}
        <SidebarLeft
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          feedMode={feedMode}
          onFeedModeChange={(mode) => {
            setFeedMode(mode);
            setSelectedTag(null);
            setSearchQuery('');
          }}
          onOpenComposer={() => setIsComposerOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenUserSwitcher={() => setIsUserSwitcherOpen(true)}
          unreadCount={unreadNotifsCount}
        />

        {/* Center Primary Column */}
        <main className="flex-1 min-w-0 py-6 lg:px-8">
          {isProfileTab ? (
            <ProfileView
              username={activeProfileUsername}
              onBack={() => setCurrentTab('feed')}
              onEditProfile={() => setIsEditProfileOpen(true)}
              onViewProfile={handleViewProfile}
              onSelectTag={handleSelectTag}
            />
          ) : (
            <div className="space-y-6">
              {/* In-feed Post Composer (Desktop) */}
              <div className="hidden sm:block">
                <PostComposer onPostCreated={handlePostCreated} />
              </div>

              {/* Feed Control Bar */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-900">
                  {/* Segmented Feed Mode Buttons */}
                  <div className="flex items-center gap-1 p-1 bg-neutral-900/90 rounded-xl border border-neutral-800 self-start">
                    <button
                      onClick={() => {
                        setFeedMode('personalized');
                        setSelectedTag(null);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                        feedMode === 'personalized' && !selectedTag
                          ? 'bg-neutral-800 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      For You
                    </button>
                    <button
                      onClick={() => {
                        setFeedMode('explore');
                        setSelectedTag(null);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                        feedMode === 'explore' && !selectedTag
                          ? 'bg-neutral-800 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Explore
                    </button>
                    <button
                      onClick={() => {
                        setFeedMode('trending');
                        setSelectedTag(null);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                        feedMode === 'trending' && !selectedTag
                          ? 'bg-neutral-800 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Trending
                    </button>
                    <button
                      onClick={() => {
                        setFeedMode('bookmarks');
                        setSelectedTag(null);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                        feedMode === 'bookmarks' && !selectedTag
                          ? 'bg-neutral-800 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Saved
                    </button>
                  </div>

                  {/* Active filters notice */}
                  {(selectedTag || searchQuery) && (
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <span>Filtering by</span>
                      {selectedTag && (
                        <span className="text-indigo-400 font-semibold">#{selectedTag}</span>
                      )}
                      {searchQuery && (
                        <span className="text-indigo-400 font-semibold">"{searchQuery}"</span>
                      )}
                      <button
                        onClick={handleClearFilters}
                        className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-rose-400 ml-1"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Clear</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Quiet Unboxed Subtitle */}
                <p className="text-xs text-neutral-500 px-0.5">{feedSubtitle}</p>
              </div>

              {/* Feed Stream */}
              {isLoadingPosts ? (
                <div className="py-16 text-center">
                  <div className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                  <p className="mt-3 text-xs text-neutral-500">Loading stream...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="rounded-2xl border border-neutral-900 bg-neutral-900/30 p-12 text-center space-y-3">
                  <p className="text-sm font-semibold text-neutral-300">No posts in this stream</p>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    {feedMode === 'personalized'
                      ? 'Follow more creators from the right sidebar to populate your personalized feed, or explore global posts!'
                      : 'Try broadening your search query or choosing another topic.'}
                  </p>
                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={() => {
                        setFeedMode('explore');
                        handleClearFilters();
                      }}
                      className="rounded-lg bg-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700 transition-colors"
                    >
                      View Explore Stream
                    </button>
                    <button
                      onClick={() => setIsComposerOpen(true)}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
                    >
                      Create First Post
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onPostUpdated={handlePostUpdated}
                      onPostDeleted={handlePostDeleted}
                      onViewProfile={handleViewProfile}
                      onSelectTag={handleSelectTag}
                      onFollowChanged={fetchPosts}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <SidebarRight
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectTag={handleSelectTag}
          onViewProfile={handleViewProfile}
          onFollowChanged={fetchPosts}
        />
      </div>

      {/* Mobile Floating Action Button for Post Creation */}
      <div className="fixed bottom-18 right-4 sm:hidden z-30">
        <button
          onClick={() => setIsComposerOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar (Within 15% Viewport Cap) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center justify-around border-t border-neutral-800/90 bg-neutral-950/95 backdrop-blur-md px-2 lg:hidden"
        aria-label="Mobile Navigation"
      >
        <button
          onClick={() => {
            setCurrentTab('feed');
            setFeedMode('personalized');
          }}
          className={`flex flex-col items-center justify-center p-1 transition-colors ${
            currentTab === 'feed' && feedMode === 'personalized' ? 'text-indigo-400' : 'text-neutral-400'
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Feed</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab('feed');
            setFeedMode('explore');
          }}
          className={`flex flex-col items-center justify-center p-1 transition-colors ${
            currentTab === 'feed' && feedMode === 'explore' ? 'text-indigo-400' : 'text-neutral-400'
          }`}
        >
          <Compass className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Explore</span>
        </button>

        <button
          onClick={() => setIsNotificationsOpen(true)}
          className="relative flex flex-col items-center justify-center p-1 text-neutral-400 hover:text-white transition-colors"
        >
          <Bell className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Alerts</span>
          {unreadNotifsCount > 0 && (
            <span className="absolute top-1 right-2 h-2 w-2 rounded-full bg-indigo-500" />
          )}
        </button>

        <button
          onClick={() => {
            if (currentUser) {
              setCurrentTab(`profile:${currentUser.username}`);
            } else {
              setIsAuthOpen(true);
            }
          }}
          className={`flex flex-col items-center justify-center p-1 transition-colors ${
            currentUser && currentTab === `profile:${currentUser.username}`
              ? 'text-indigo-400'
              : 'text-neutral-400'
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Profile</span>
        </button>

        <button
          onClick={() => setIsUserSwitcherOpen(true)}
          className="flex flex-col items-center justify-center p-1 text-neutral-400 hover:text-white transition-colors"
          title="Switch User"
        >
          <Users className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Switch</span>
        </button>
      </nav>

      {/* Modal: New Post Composer Modal */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <PostComposer
            isModal={true}
            onPostCreated={(post) => {
              handlePostCreated(post);
              setIsComposerOpen(false);
            }}
            onClose={() => setIsComposerOpen(false)}
          />
        </div>
      )}

      {/* Modal: Notifications */}
      {isNotificationsOpen && (
        <NotificationsModal
          onClose={() => setIsNotificationsOpen(false)}
          onViewProfile={handleViewProfile}
          onNotificationsRead={() => setUnreadNotifsCount(0)}
        />
      )}

      {/* Modal: User Switcher */}
      {isUserSwitcherOpen && (
        <UserSwitcherModal
          onClose={() => setIsUserSwitcherOpen(false)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      )}

      {/* Modal: Auth (Login/Signup) */}
      {isAuthOpen && (
        <AuthModal
          onClose={() => {
            setIsAuthOpen(false);
            fetchPosts();
          }}
        />
      )}

      {/* Modal: Edit Profile */}
      {isEditProfileOpen && (
        <EditProfileModal
          onClose={() => setIsEditProfileOpen(false)}
          onSaved={() => {
            fetchPosts();
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
