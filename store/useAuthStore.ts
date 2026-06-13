import { create } from 'zustand';
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
  
  signIn: (email: string) => Promise<boolean>;
  signUp: (email: string, name: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isSignedIn: false,
  isLoading: false,

  signIn: async (email) => {
    set({ isLoading: true });
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const mockUserId = 'user_' + Math.random().toString(36).substring(2, 9);
    const mockUser: AuthUser = {
      id: mockUserId,
      email,
      name: email.split('@')[0],
    };

    set({
      user: mockUser,
      isSignedIn: true,
      isLoading: false,
    });

    // Update profile in useDiaryStore
    useDiaryStore.getState().setProfile({
      email,
      name: mockUser.name,
    });

    // Trigger local logs sync
    await useDiaryStore.getState().syncToSupabase(mockUserId);
    return true;
  },

  signUp: async (email, name) => {
    set({ isLoading: true });
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const mockUserId = 'user_' + Math.random().toString(36).substring(2, 9);
    const mockUser: AuthUser = {
      id: mockUserId,
      email,
      name,
    };

    set({
      user: mockUser,
      isSignedIn: true,
      isLoading: false,
    });

    // Update profile in useDiaryStore
    useDiaryStore.getState().setProfile({
      email,
      name,
    });

    // Trigger local logs sync
    await useDiaryStore.getState().syncToSupabase(mockUserId);
    return true;
  },

  signOut: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    set({
      user: null,
      isSignedIn: false,
      isLoading: false,
    });

    // Reset diary cache back to trial mode
    useDiaryStore.getState().resetAll();
  },
}));
