import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, setTokens, getAccessToken } from '../services/api';
import { realtimeClient } from '../services/websocket';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  canViewPhi: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      const token = getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const userData = await api.getMe();
        setUser(userData);
        realtimeClient.connect();
      } catch {
        setTokens(null, null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    const handleLogout = () => {
      setUser(null);
      realtimeClient.disconnect();
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
    realtimeClient.connect();
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    realtimeClient.disconnect();
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return roles.includes(user.role);
  };

  const canViewPhi = (): boolean => {
    if (!user) return false;
    // Structural Zero-PHI enforcement: DRIVER, SUPER_ADMIN, GOVERNMENT_OPERATOR never have PHI access
    return !['DRIVER', 'SUPER_ADMIN', 'GOVERNMENT_OPERATOR'].includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
        canViewPhi,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
