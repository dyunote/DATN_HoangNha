import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import api from '../api/axios';
import type { ApiResponse, User } from '../types';

interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('hoangnha_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get<ApiResponse<User>>('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => {
        localStorage.removeItem('hoangnha_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', { email, password });
    const { user: loggedInUser, token } = res.data.data;
    localStorage.setItem('hoangnha_token', token);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (payload: RegisterPayload) => {
    const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', payload);
    const { user: registeredUser, token } = res.data.data;
    localStorage.setItem('hoangnha_token', token);
    setUser(registeredUser);
    return registeredUser;
  };

  const logout = () => {
    localStorage.removeItem('hoangnha_token');
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    setUser(res.data.data);
    return res.data.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
