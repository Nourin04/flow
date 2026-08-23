import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Profile, Category } from '../lib/types';
import { db } from '../lib/db';

interface AuthContextType {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SEEDED_USER_ID = 'noureen-user-id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if there is an active session
    const activeUserId = localStorage.getItem('flow_active_user_id');
    const initAuth = async () => {
      try {
        if (activeUserId) {
          const profile = await db.getProfile(activeUserId);
          if (profile) {
            setUser(profile);
          } else {
            localStorage.removeItem('flow_active_user_id');
          }
        }
      } catch (err) {
        console.error('Failed to load user profile', err);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication
    //noureen@example.com with password
    // Allow standard testing
    setIsLoading(true);
    try {
      if (email.toLowerCase() === 'noureen@example.com' && password === 'password') {
        const profile = await db.getProfile(SEEDED_USER_ID);
        if (profile) {
          setUser(profile);
          localStorage.setItem('flow_active_user_id', SEEDED_USER_ID);
          return true;
        }
      }

      // Check if user signed up dynamically
      const profilesData = localStorage.getItem('flow_all_profiles');
      const profiles: (Profile & { password?: string })[] = profilesData ? JSON.parse(profilesData) : [];
      const found = profiles.find(p => p.email.toLowerCase() === email.toLowerCase() && p.password === password);
      
      if (found) {
        // Ensure their profile is in main profile table
        const profileObj: Profile = {
          id: found.id,
          name: found.name,
          email: found.email,
          currency: found.currency || '₹',
          created_at: found.created_at,
          updated_at: found.updated_at
        };
        await db.updateProfile(profileObj);
        setUser(profileObj);
        localStorage.setItem('flow_active_user_id', found.id);
        return true;
      }

      return false;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const userId = `user-${Date.now()}`;
      const newProfile: Profile & { password?: string } = {
        id: userId,
        name,
        email,
        currency: '₹',
        password,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to all profiles
      const profilesData = localStorage.getItem('flow_all_profiles');
      const profiles: any[] = profilesData ? JSON.parse(profilesData) : [];
      if (profiles.some(p => p.email.toLowerCase() === email.toLowerCase()) || email.toLowerCase() === 'noureen@example.com') {
        // User already exists
        return false;
      }

      profiles.push(newProfile);
      localStorage.setItem('flow_all_profiles', JSON.stringify(profiles));

      // Save to active profiles table
      await db.updateProfile({
        id: userId,
        name,
        email,
        currency: '₹',
        created_at: newProfile.created_at,
        updated_at: newProfile.updated_at
      });

      // Seed starting categories for the new user
      db.getAllIncome(SEEDED_USER_ID); // trigger init check
      const currentCatsData = localStorage.getItem('flow_categories');
      const currentCats: Category[] = currentCatsData ? JSON.parse(currentCatsData) : [];
      
      // Default categories list copy
      const defaultCats = [
        { name: 'Food & Dining', icon: 'Pizza', color: '#EC4899', is_default: true, is_active: true, user_id: userId },
        { name: 'Transportation', icon: 'Car', color: '#3B82F6', is_default: true, is_active: true, user_id: userId },
        { name: 'Home', icon: 'Home', color: '#EF4444', is_default: true, is_active: true, user_id: userId },
        { name: 'Shopping', icon: 'ShoppingBag', color: '#F59E0B', is_default: true, is_active: true, user_id: userId },
        { name: 'Personal Care', icon: 'Sparkles', color: '#8B5CF6', is_default: true, is_active: true, user_id: userId },
        { name: 'Education / Learning', icon: 'GraduationCap', color: '#10B981', is_default: true, is_active: true, user_id: userId },
        { name: 'Gifts', icon: 'Gift', color: '#F43F5E', is_default: true, is_active: true, user_id: userId },
        { name: 'Other', icon: 'HelpCircle', color: '#6B7280', is_default: true, is_active: true, user_id: userId },
      ];

      defaultCats.forEach((cat, idx) => {
        currentCats.push({
          ...cat,
          id: `cat-${userId}-${idx + 1}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });
      localStorage.setItem('flow_categories', JSON.stringify(currentCats));

      // Seed initial monthly income of 0 or fallback
      await db.setIncome(userId, '2026-08', 0);

      setUser({
        id: userId,
        name,
        email,
        currency: '₹',
        created_at: newProfile.created_at,
        updated_at: newProfile.updated_at
      });
      localStorage.setItem('flow_active_user_id', userId);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('flow_active_user_id');
    setUser(null);
  };

  const updateUser = async (updates: Partial<Profile>) => {
    if (!user) return;
    const updated = await db.updateProfile({
      ...user,
      ...updates,
      id: user.id
    });
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
