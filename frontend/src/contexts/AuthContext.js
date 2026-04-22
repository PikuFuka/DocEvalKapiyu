import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // For initial check

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await api.get('/auth/profile/');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      // Token might be invalid or expired
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, [checkAuthStatus]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login/', { email, password });
      const { token, user_id, email: userEmail, first_name, last_name, is_staff, email_verified } = response.data;

      const normalizedUser = {
        id: user_id,
        email: userEmail,
        first_name,
        last_name,
        is_staff,
        email_verified,
      };

      localStorage.setItem('token', token);
      setUser(normalizedUser);
      setIsAuthenticated(true);

      return { success: true, user: normalizedUser };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  }, []);

  const warmupInferenceServices = useCallback(async () => {
    try {
      const response = await api.post('/auth/warmup/', {}, { timeout: 90000 });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Warmup request failed',
      };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const registerFaculty = useCallback(async (formData) => {
    try {
      const response = await api.post('/auth/faculty-register/', formData);
      const { message } = response.data;

      // Don't auto-login - user needs to verify email
      // The backend sends the verification email

      return { success: true, message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  }, []);

  const verifyEmail = useCallback(async (token) => {
    try {
      await api.post('/auth/verify-email/', { token });
      // Optionally, update the user state if they are logged in
      // Or prompt them to login
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Verification failed'
      };
    }
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    loading, // Expose loading state
    login,
    warmupInferenceServices,
    logout,
    registerFaculty,
    verifyEmail
  }), [user, isAuthenticated, loading, login, warmupInferenceServices, logout, registerFaculty, verifyEmail]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};