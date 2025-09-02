import { create } from 'zustand';
import type { AuthState, LoginCredentials, User } from '../types/auth';
import { authService } from '../services/authService';

export const useAuthStore = create<AuthState>((set) => ({
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
}));

// Initialize auth state from localStorage on app start
export const initializeAuth = async () => {
  const token = authService.getToken();
  if (!token) return;

  try {
    const response = await authService.validateToken();
    if (response.success && response.data) {
      useAuthStore.setState({
        user: response.data.user,
        token: response.data.token,
        isAuthenticated: true,
      });
    } else {
      // Invalid token, clear it
      authService.clearToken();
    }
  } catch (error) {
    // Invalid token, clear it
    authService.clearToken();
    console.warn('Token validation failed:', error);
  }
};