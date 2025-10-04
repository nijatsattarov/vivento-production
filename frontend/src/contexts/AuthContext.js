import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUserProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Profil məlumatları alınarkən xəta:', error);
      // Only remove token on 401/403 errors, not network errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('accessToken');
        setUser(null);
        setIsAuthenticated(false);
      } else {
        // For network errors, keep trying with existing token
        console.warn('Network error, keeping existing auth state');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, credentials);
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('accessToken', access_token);
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Giriş xətası:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Giriş zamanı xəta baş verdi' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, userData);
      const { access_token, user: newUser } = response.data;
      
      localStorage.setItem('accessToken', access_token);
      setUser(newUser);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Qeydiyyat xətası:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Qeydiyyat zamanı xəta baş verdi' 
      };
    }
  };

  const facebookLogin = async (facebookResponse) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/facebook`, {
        access_token: facebookResponse.accessToken
      });
      
      const { access_token, user: userData } = response.data;
      localStorage.setItem('accessToken', access_token);
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Facebook giriş xətası:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Facebook girişi uğursuz oldu' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    setIsAuthenticated(false);
    
    // Facebook logout
    if (window.FB) {
      window.FB.logout();
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    facebookLogin,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};