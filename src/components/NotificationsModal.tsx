import React, { useEffect, useState } from 'react';
import { api } from '../services/api.ts';
import { Notification } from '../types/index.ts';
import { X, Bell, Heart, MessageCircle, UserPlus, CheckCheck } from 'lucide-react';

interface NotificationsModalProps {
  onClose: () => void;
  onViewProfile: (username: string) => void;
  onNotificationsRead: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  onClose,
  onViewProfile,
  onNotificationsRead,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadNotifs() {
      try {
        const res = await api.getNotifications();
        setNotifications(res.notifications);
        // Automatically mark as read on open
        await api.markNotificationsRead();
        onNotificationsRead();
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadNotifs();
  }, [onNotificationsRead]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Notifications</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-neutral-500">Loading activity...</div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-xs text-neutral-400">All caught up! No recent notifications.</p>
              <p className="text-[11px] text-neutral-600">Interactions on your posts and follows will appear here.</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const actor = notif.actor;
              return (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                    notif.read
                      ? 'border-neutral-800/60 bg-neutral-950/40'
                      : 'border-indigo-900/60 bg-indigo-950/20'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {notif.type === 'like' && (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
                        <Heart className="h-4 w-4 fill-current" />
                      </span>
                    )}
                    {notif.type === 'comment' && (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
                        <MessageCircle className="h-4 w-4" />
                      </span>
                    )}
                    {notif.type === 'follow' && (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                        <UserPlus className="h-4 w-4" />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-xs">
                    {actor && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onViewProfile(actor.username);
                            onClose();
                          }}
                          className="font-semibold text-neutral-200 hover:text-indigo-400 transition-colors truncate"
                        >
                          {actor.name}
                        </button>
                        <span className="text-[11px] text-neutral-500">@{actor.username}</span>
                      </div>
                    )}

                    <p className="mt-0.5 text-neutral-300">
                      {notif.type === 'like' && 'liked your post'}
                      {notif.type === 'comment' && 'commented on your post'}
                      {notif.type === 'follow' && 'started following your updates'}
                    </p>

                    {notif.postSnippet && (
                      <p className="mt-1 text-[11px] text-neutral-500 italic truncate border-l-2 border-neutral-800 pl-2">
                        "{notif.postSnippet}"
                      </p>
                    )}

                    <span className="mt-1 block text-[10px] text-neutral-500">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-neutral-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="rounded-lg bg-neutral-800 px-4 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
