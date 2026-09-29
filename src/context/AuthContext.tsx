import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types/index.ts';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../services/api.ts';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (identifier: string, password?: string) => Promise<void>;
  register: (data: { name: string; username: string; email: string; password: string; bio?: string; avatar?: string }) => Promise<void>;
  logout: () => void;
  switchUser: (userId: string) => Promise<void>;
  updateProfile: (data: Partial<Pick<User, 'name' | 'bio' | 'avatar' | 'location' | 'website'>>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.getMe();
      setCurrentUser(res.user);
    } catch {
      // Token might be invalid
      clearStoredToken();
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    async function initAuth() {
      const token = getStoredToken();
      if (token) {
        try {
          const res = await api.getMe();
          setCurrentUser(res.user);
        } catch {
          // If stored token expired or failed, initialize with demo account
          tryDemoFallback();
        }
      } else {
        // Automatically default to demo user for instantaneous interactive exploration
        tryDemoFallback();
      }
      setIsLoading(false);
    }

    async function tryDemoFallback() {
      try {
        setStoredToken('usr_demo');
        const res = await api.getMe();
        setCurrentUser(res.user);
      } catch {
        clearStoredToken();
        setCurrentUser(null);
      }
    }

    initAuth();
  }, [refreshUser]);

  const login = async (identifier: string, password = 'password123') => {
    setIsLoading(true);
    try {
      const res = await api.login(identifier, password);
      setCurrentUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { name: string; username: string; email: string; password: string; bio?: string; avatar?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      setCurrentUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearStoredToken();
    setCurrentUser(null);
  };

  const switchUser = async (userId: string) => {
    setStoredToken(userId);
    await refreshUser();
  };

  const updateProfile = async (data: Partial<Pick<User, 'name' | 'bio' | 'avatar' | 'location' | 'website'>>) => {
    const res = await api.updateProfile(data);
    setCurrentUser((prev) => (prev ? { ...prev, ...res.user } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        login,
        register,
        logout,
        switchUser,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
