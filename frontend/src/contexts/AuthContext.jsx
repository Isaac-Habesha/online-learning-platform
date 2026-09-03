import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('access_token'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refresh_token'));
  const [loading, setLoading] = useState(true);

  // Sync state with localStorage
  const persistAuth = (userData, tokens) => {
    if (userData) {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    }
    if (tokens?.access) {
      setAccessToken(tokens.access);
      localStorage.setItem('access_token', tokens.access);
    }
    if (tokens?.refresh) {
      setRefreshToken(tokens.refresh);
      localStorage.setItem('refresh_token', tokens.refresh);
    }
  };

  const clearAuth = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }, []);

  // Fetch current user details on mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
        } catch (err) {
          console.warn('Initial session validation error:', err);
          // If token is invalid and refresh fails, clearAuth will be called by interceptor
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen for forced logout event from api interceptor
    const handleLogoutEvent = () => clearAuth();
    window.addEventListener('auth:logout', handleLogoutEvent);

    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
    };
  }, [clearAuth]);

  // Login handler
  const login = async (credentials) => {
    const data = await authService.login(credentials);
    persistAuth(data.user, data.tokens);
    return data;
  };

  // Register handler
  const register = async (registrationData) => {
    const data = await authService.register(registrationData);
    return data;
  };

  // Logout handler
  const logout = async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      try {
        await authService.logout(refresh);
      } catch (err) {
        console.warn('Logout API error:', err);
      }
    }
    clearAuth();
  };

  // Refresh user profile
  const refreshUserProfile = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      localStorage.setItem('user', JSON.stringify(currentUser));
      return currentUser;
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
      throw err;
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const role = user?.role || null;
  const isLearner = role === 'LEARNER';
  const isInstructor = role === 'INSTRUCTOR';
  const isAdmin = role === 'ADMIN';
  const isAuthenticated = Boolean(accessToken && user);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        role,
        isLearner,
        isInstructor,
        isAdmin,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
