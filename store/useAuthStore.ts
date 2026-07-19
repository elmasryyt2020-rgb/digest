import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useDiaryStore } from './useDiaryStore';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: AuthUser | null;
  isSignedIn: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  
  initializeAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<boolean>;
  verifyOtp: (email: string, token: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  verifyResetOtp: (email: string, token: string) => Promise<boolean>;
  updatePassword: (password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isSignedIn: false,
  isLoading: false,
  isInitialized: false,

  initializeAuth: async () => {
    try {
      // 1. Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const user = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.display_name || '',
        };
        set({ user, isSignedIn: true });
        await useDiaryStore.getState().fetchFromSupabase(session.user.id);
      }

      // 2. Subscribe to auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const user = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.display_name || '',
          };
          set({ user, isSignedIn: true });
          await useDiaryStore.getState().fetchFromSupabase(session.user.id);
        } else {
          set({ user: null, isSignedIn: false });
        }
      });
    } finally {
      set({ isInitialized: true });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const user = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.display_name || '',
        };
        set({ user, isSignedIn: true, isLoading: false });
        await useDiaryStore.getState().fetchFromSupabase(data.user.id);
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  signUp: async (email, password, firstName, lastName) => {
    set({ isLoading: true });
    try {
      const capFirstName = firstName.trim().charAt(0).toUpperCase() + firstName.trim().slice(1).toLowerCase();
      const capLastName = lastName.trim().charAt(0).toUpperCase() + lastName.trim().slice(1).toLowerCase();
      const display_name = `${capFirstName} ${capLastName}`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: capFirstName,
            last_name: capLastName,
            display_name,
          },
        },
      });

      if (error) throw error;
      set({ isLoading: false });
      return true;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  verifyOtp: async (email, token) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });

      if (error) throw error;

      if (data.user) {
        const user = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.display_name || '',
        };
        set({ user, isSignedIn: true, isLoading: false });

        // Update profile in store
        useDiaryStore.getState().setProfile({
          email: user.email,
          name: user.name,
        });

        // Sync local logs to Supabase
        await useDiaryStore.getState().syncToSupabase(data.user.id);
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  sendPasswordReset: async (email) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      set({ isLoading: false });
      return true;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  verifyResetOtp: async (email, token) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery',
      });
      if (error) throw error;
      set({ isLoading: false });
      return true;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  updatePassword: async (password) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      if (error) throw error;
      set({ isLoading: false });
      return true;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
      set({ user: null, isSignedIn: false, isLoading: false });
      useDiaryStore.getState().resetAll();
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  deleteAccount: async () => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      await supabase.auth.signOut();
      set({ user: null, isSignedIn: false, isLoading: false });
      useDiaryStore.getState().resetAll();
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },
}));
