import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, LoginCredentials, User } from '../types/auth';
import { authService } from '../services/authService';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(credentials);
          
          if (response.success && response.data) {
            const { user, token } = response.data;
            
            // Store token in localStorage
            authService.setToken(token);
            
            // Update state
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        // Call logout API in background
        authService.logout();
        
        // Clear token from localStorage
        authService.clearToken();
        
        // Reset state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth state - validate persisted token
export const initializeAuth = async () => {
  const { token, isAuthenticated } = useAuthStore.getState();
  
  if (!token || !isAuthenticated) {
    return;
  }

  try {
    const response = await authService.validateToken();
    if (response.success && response.data) {
      // Token is still valid, update user data if needed
      useAuthStore.setState({
        user: response.data.user,
        token: response.data.token,
        isAuthenticated: true,
      });
    } else {
      // Invalid token, logout
      useAuthStore.getState().logout();
    }
  } catch (error) {
    // Invalid token, logout
    useAuthStore.getState().logout();
    console.warn('Token validation failed:', error);
  }
};