import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Profile } from '../lib/types';
import { db, DEMO_USER_ID, STORAGE_KEYS } from '../lib/db';
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

// ---- Local demo-mode accounts (only used when Supabase is NOT configured) ----
type LocalAccount = Profile & { password_hash?: string; salt?: string; password?: string /* legacy plaintext */ };

const hashPassword = async (password: string, salt: string) => {
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
};
const newSalt = () => Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');

const readAccounts = (): LocalAccount[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ALL_PROFILES) || '[]');
  } catch {
    return [];
  }
};
const writeAccounts = (accounts: LocalAccount[]) => localStorage.setItem(STORAGE_KEYS.ALL_PROFILES, JSON.stringify(accounts));
const toProfile = ({ id, name, email, currency, created_at, updated_at }: LocalAccount): Profile =>
  ({ id, name, email, currency: currency || '₹', created_at, updated_at });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
      const activeUserId = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
      const initAuth = async () => {
        try {
          if (activeUserId) {
            const profile = await db.getProfile(activeUserId);
            if (profile) {
              setUser(profile);
            } else {
              localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
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

  // NOTE: login/signup must not toggle the global isLoading flag — App swaps the whole
  // screen for a spinner while it's true, which unmounted the Login page and wiped
  // its error message and form fields.
  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes('email not confirmed')) {
            return { success: false, message: 'Email not confirmed yet. Please check your inbox for the confirmation link.' };
          }
          if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
            return { success: false, message: 'Invalid email or password. Please check your credentials.' };
          }
          return { success: false, message: error.message };
        }

        if (data.user) {
          await syncSupabaseUser(data.user.id, data.user.email || email, data.user.user_metadata?.name || 'User');
          return { success: true };
        }
        return { success: false, message: 'Login failed. Please try again.' };
      }

      // ---- Local demo mode ----
      // Built-in demo account (local mode only; never active when Supabase is configured)
      if (email.toLowerCase() === 'noureen@example.com' && password === 'password') {
        const profile = await db.getProfile(DEMO_USER_ID);
        if (profile) {
          setUser(profile);
          localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, DEMO_USER_ID);
          return { success: true };
        }
      }

      const accounts = readAccounts();
      const idx = accounts.findIndex(p => p.email.toLowerCase() === email.toLowerCase());
      const account = accounts[idx];
      let valid = false;
      if (account?.password_hash && account.salt) {
        valid = (await hashPassword(password, account.salt)) === account.password_hash;
      } else if (account?.password !== undefined) {
        // Legacy plaintext account: verify, then upgrade to a hash
        valid = account.password === password;
        if (valid) {
          const salt = newSalt();
          const { password: _legacy, ...rest } = account;
          accounts[idx] = { ...rest, salt, password_hash: await hashPassword(password, salt) };
          writeAccounts(accounts);
        }
      }

      if (valid) {
        setUser(toProfile(accounts[idx]));
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, accounts[idx].id);
        return { success: true };
      }
      return { success: false, message: 'Invalid email or password.' };
    } catch (err) {
      console.error(err);
      return { success: false, message: err instanceof Error ? err.message : 'An error occurred during login.' };
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim() } }
        });

        if (error) return { success: false, message: error.message };

        if (data.user) {
          // Without a session (email confirmation required) RLS would reject profile reads/writes;
          // the DB trigger creates the profile, so just ask the user to confirm.
          if (!data.session) {
            return { success: true, message: 'Account created! Please check your email to confirm your account, then log in.' };
          }
          await syncSupabaseUser(data.user.id, email.trim(), name.trim());
          return { success: true };
        }
        return { success: false, message: 'Signup failed. Please try again.' };
      }

      // ---- Local demo mode ----
      const accounts = readAccounts();
      if (accounts.some(p => p.email.toLowerCase() === email.toLowerCase()) || email.toLowerCase() === 'noureen@example.com') {
        return { success: false, message: 'An account with this email already exists.' };
      }

      const ts = new Date().toISOString();
      const salt = newSalt();
      const account: LocalAccount = {
        id: `user-${Date.now()}`,
        name,
        email,
        currency: '₹',
        salt,
        password_hash: await hashPassword(password, salt),
        created_at: ts,
        updated_at: ts
      };
      writeAccounts([...accounts, account]);
      // Default categories are shared (user_id null) and already seeded, so nothing else to create.

      setUser(toProfile(account));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, account.id);
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, message: err instanceof Error ? err.message : 'An error occurred during signup.' };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
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
