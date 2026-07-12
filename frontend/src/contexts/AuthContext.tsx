import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<any>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadUser = async () => {
    const token = localStorage.getItem('assetflow_access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    
    try {
      const profile = await authService.getCurrentUser();
      setUser(profile);
    } catch (error) {
      console.error('Failed to load user profile on app start:', error);
      authService.logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    // Listen for axios 401 unauthorized automatic logout events
    const handleLogoutEvent = () => {
      setUser(null);
    };
    
    window.addEventListener('auth_logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth_logout', handleLogoutEvent);
    };
  }, []);

  const login = async (data: any) => {
    setIsLoading(true);
    try {
      await authService.login(data);
      const profile = await authService.getCurrentUser();
      setUser(profile);
      return profile; // Return profile so caller can redirect based on role
    } catch (error) {
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: any) => {
    setIsLoading(true);
    try {
      await authService.signup(data);
    } catch (error) {
      setIsLoading(false);
      throw error; // Re-throw so Signup.tsx catch block can handle it
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
