import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Profile, Category } from '../lib/types';
import { db } from '../lib/db';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SEEDED_USER_ID = 'noureen-user-id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // 1. Initial session check via Supabase
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncSupabaseUser(session.user.id, session.user.email || '', session.user.user_metadata?.name || 'User');
        } else {
          setIsLoading(false);
        }
      });

      // 2. Listen to Auth State Changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          syncSupabaseUser(session.user.id, session.user.email || '', session.user.user_metadata?.name || 'User');
        } else {
          setUser(null);
          setIsLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Local fallback auth initialization
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
    }
  }, []);

  const syncSupabaseUser = async (userId: string, email: string, defaultName: string) => {
    try {
      let profile = await db.getProfile(userId);
      if (!profile) {
        profile = {
          id: userId,
          name: defaultName,
          email,
          currency: '₹',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await db.updateProfile(profile);
      }
      setUser(profile);
    } catch (err) {
      console.error('Error syncing Supabase user profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            return { 
              success: false, 
              message: 'Email not confirmed yet. Please confirm your email address or disable "Confirm Email" in Supabase Dashboard -> Authentication -> Providers -> Email.' 
            };
          }
          return { success: false, message: error.message };
        }

        if (data.user) {
          await syncSupabaseUser(
            data.user.id,
            data.user.email || email,
            data.user.user_metadata?.name || 'User'
          );
          return { success: true };
        }
        return { success: false, message: 'Login failed. Please try again.' };
      }

      // Fallback: Local demo auth
      if (email.toLowerCase() === 'noureen@example.com' && password === 'password') {
        const profile = await db.getProfile(SEEDED_USER_ID);
        if (profile) {
          setUser(profile);
          localStorage.setItem('flow_active_user_id', SEEDED_USER_ID);
          return { success: true };
        }
      }

      const profilesData = localStorage.getItem('flow_all_profiles');
      const profiles: (Profile & { password?: string })[] = profilesData ? JSON.parse(profilesData) : [];
      const found = profiles.find(p => p.email.toLowerCase() === email.toLowerCase() && p.password === password);

      if (found) {
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
        return { success: true };
      }

      return { success: false, message: 'Invalid email or password.' };
    } catch (err: any) {
      console.error(err);
      return { success: false, message: err.message || 'An error occurred during login.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { name: name.trim() }
          }
        });

        if (error) {
          return { success: false, message: error.message };
        }

        if (data.user) {
          await syncSupabaseUser(data.user.id, email.trim(), name.trim());
          return { 
            success: true, 
            message: data.session ? undefined : 'Account created! Please check your email for confirmation if required.'
          };
        }
        return { success: false, message: 'Signup failed. Please try again.' };
      }

      // Fallback: Local demo signup
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

      const profilesData = localStorage.getItem('flow_all_profiles');
      const profiles: any[] = profilesData ? JSON.parse(profilesData) : [];
      if (profiles.some(p => p.email.toLowerCase() === email.toLowerCase()) || email.toLowerCase() === 'noureen@example.com') {
        return { success: false, message: 'An account with this email already exists.' };
      }

      profiles.push(newProfile);
      localStorage.setItem('flow_all_profiles', JSON.stringify(profiles));

      await db.updateProfile({
        id: userId,
        name,
        email,
        currency: '₹',
        created_at: newProfile.created_at,
        updated_at: newProfile.updated_at
      });

      // Seed categories
      db.getAllIncome(SEEDED_USER_ID);
      const currentCatsData = localStorage.getItem('flow_categories');
      const currentCats: Category[] = currentCatsData ? JSON.parse(currentCatsData) : [];

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
      return { success: true };
    } catch (err: any) {
      console.error(err);
      return { success: false, message: err.message || 'An error occurred during signup.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
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
