export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: string; // UUID from backend
  username: string;
  email: string;
  role: string;
  created_at: string; // Backend uses snake_case
  updated_at: string; // Backend uses snake_case
  last_login?: string; // Optional field from backend
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}