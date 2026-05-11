import React, { createContext, useContext, useState, useEffect } from 'react';
import { setAuthToken } from '../api/axios';

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      try {
        const savedToken = localStorage.getItem('vibe_auth_token');
        const savedUser = localStorage.getItem('vibe_auth_user');

        if (savedToken && savedUser) {
          setAuthToken(savedToken);
          const parsedUser = JSON.parse(savedUser);
          
          // Set the user
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Failed to restore auth session:', error);
        localStorage.removeItem('vibe_auth_token');
        localStorage.removeItem('vibe_auth_user');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem('vibe_auth_token', token);
    localStorage.setItem('vibe_auth_user', JSON.stringify(user));
    setAuthToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('vibe_auth_token');
    localStorage.removeItem('vibe_auth_user');
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {!loading && children}
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
