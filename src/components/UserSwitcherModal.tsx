import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { X, Check, Users, UserPlus } from 'lucide-react';

interface UserSwitcherModalProps {
  onClose: () => void;
  onOpenAuth: () => void;
}

export const UserSwitcherModal: React.FC<UserSwitcherModalProps> = ({ onClose, onOpenAuth }) => {
  const { currentUser, switchUser } = useAuth();
  const [users, setUsers] = useState<Array<{ id: string; username: string; name: string; avatar: string; bio: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDemoUsers() {
      try {
        const res = await api.getDemoUsers();
        setUsers(res.users);
      } catch (err) {
        console.error('Failed to load demo accounts:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDemoUsers();
  }, []);

  const handleSelectUser = async (userId: string) => {
    await switchUser(userId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Switch Test Account</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-xs text-neutral-400 leading-relaxed">
          Switch active accounts instantly to test followers, likes, comments, and personalized feeds from multiple perspectives.
        </p>

        <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-neutral-500">Loading accounts...</div>
          ) : (
            users.map((u) => {
              const isCurrent = currentUser?.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u.id)}
                  className={`flex w-full items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? 'border-indigo-500 bg-indigo-950/20'
                      : 'border-neutral-800 bg-neutral-950/40 hover:bg-neutral-800/80 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded-full object-cover border border-neutral-700 bg-neutral-800 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${u.username}`;
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-neutral-200 truncate">{u.name}</p>
                      <p className="text-[11px] text-neutral-500 truncate">@{u.username}</p>
                      <p className="text-[11px] text-neutral-400 truncate max-w-[220px]">{u.bio}</p>
                    </div>
                  </div>

                  {isCurrent && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAuth();
            }}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Create Brand New Account</span>
          </button>

          <button
            onClick={onClose}
            className="rounded-lg bg-neutral-800 px-4 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
