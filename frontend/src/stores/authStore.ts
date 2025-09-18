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
        console.log('🔐 [AuthStore] Starting login process for:', credentials.username);
        set({ isLoading: true });

        try {
          console.log('📡 [AuthStore] Calling authService.login...');
          const response = await authService.login(credentials);

          console.log('📥 [AuthStore] Login response received:', {
            success: response.success,
            hasData: !!response.data,
            hasUser: !!response.data?.user,
            hasToken: !!response.data?.token,
            userRole: response.data?.user?.role,
            userId: response.data?.user?.id,
            message: response.message
          });

          if (response.success && response.data) {
            const { user, token } = response.data;

            console.log('💾 [AuthStore] Storing authentication data:', {
              userId: user.id,
              username: user.username,
              userRole: user.role,
              tokenLength: token?.length || 0,
              hasEmail: !!user.email
            });

            // Store token in localStorage
            authService.setToken(token);

            // Update state
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });

            console.log('✅ [AuthStore] Login successful, auth state updated');
          } else {
            console.error('❌ [AuthStore] Login failed - invalid response:', {
              success: response.success,
              message: response.message,
              hasData: !!response.data
            });
            throw new Error(response.message || 'Login failed');
          }
        } catch (error: any) {
          console.error('💥 [AuthStore] Login error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            statusText: error.response?.statusText
          });
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
      onRehydrateStorage: () => (state) => {
        if (state && state.token && state.user) {
          // Ensure token is also stored in localStorage when rehydrating
          authService.setToken(state.token);
          console.log('Auth rehydrated:', {
            hasUser: !!state.user,
            hasToken: !!state.token,
            isAuth: state.isAuthenticated,
            userRole: state.user?.role
          });
        }
      },
    }
  )
);

// Initialize auth state - validate persisted token
export const initializeAuth = async () => {
  const { token, isAuthenticated, user } = useAuthStore.getState();

  // Check if we have a stored token in localStorage (fallback)
  const storedToken = authService.getToken();

  console.log('Auth initialization:', {
    storeToken: !!token,
    localToken: !!storedToken,
    isAuthenticated,
    hasUser: !!user,
    userRole: user?.role
  });

  if (!token && !storedToken) {
    // No token available, user needs to login
    console.log('No tokens found, clearing auth state');
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    return;
  }

  // If we have a token but not authenticated, or token mismatch, validate it
  if ((token || storedToken) && (!isAuthenticated || !user)) {
    try {
      // Ensure token is set in both places
      const activeToken = token || storedToken;
      console.log('Validating token with backend...');

      if (activeToken && !token) {
        useAuthStore.setState({ token: activeToken });
      }
      if (activeToken && !authService.getToken()) {
        authService.setToken(activeToken);
      }

      const response = await authService.validateToken();
      if (response.success && response.data) {
        // Token is still valid, restore full auth state
        console.log('Token validated successfully, restoring auth state');
        useAuthStore.setState({
          user: response.data.user,
          token: response.data.token || activeToken,
          isAuthenticated: true,
          isLoading: false,
        });

        // Ensure token is stored
        const finalToken = response.data.token || activeToken;
        if (finalToken) {
          authService.setToken(finalToken);
        }
      } else {
        // Invalid token, logout
        console.log('Token validation failed, logging out');
        useAuthStore.getState().logout();
      }
    } catch (error) {
      // Invalid token, logout
      console.warn('Token validation failed:', error);
      useAuthStore.getState().logout();
    }
  } else if (token && user && isAuthenticated) {
    console.log('Auth state already valid, no need to revalidate');
    // Ensure localStorage token is set
    if (!authService.getToken()) {
      authService.setToken(token);
    }
  }
};