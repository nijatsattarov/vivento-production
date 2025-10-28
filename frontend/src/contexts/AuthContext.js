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
  const [token, setToken] = useState(localStorage.getItem('accessToken'));

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
      setToken(token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Profil məlumatları alınarkən xəta:', error);
      // Only remove token on 401/403 errors, not network errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('accessToken');
        setToken(null);
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
      console.log('🔐 AuthContext login called with:', credentials);
      console.log('🔗 API Base URL:', API_BASE_URL);
      
      if (!credentials.email || !credentials.password) {
        throw new Error('Email və parol tələb olunur');
      }

      console.log('📤 Making API call to:', `${API_BASE_URL}/api/auth/login`);
      
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: credentials.email.trim(),
        password: credentials.password
      }, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Login API response:', response.data);
      
      const { access_token, user: userData } = response.data;
      
      if (!access_token || !userData) {
        throw new Error('Server cavab formatı düzgün deyil');
      }
      
      localStorage.setItem('accessToken', access_token);
      setToken(access_token);
      setUser(userData);
      setIsAuthenticated(true);
      
      console.log('✅ Login successful, user set:', userData);
      return { success: true, user: userData };
      
    } catch (error) {
      console.error('❌ Giriş xətası:', error);
      
      let errorMessage = 'Giriş zamanı xəta baş verdi';
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        errorMessage = 'Server əlaqə xətası. Lütfən yenidən cəhd edin.';
      } else if (error.response) {
        console.error('❌ Error response status:', error.response.status);
        console.error('❌ Error response data:', error.response.data);
        
        if (error.response.status === 401) {
          errorMessage = 'Email və ya parol səhvdir';
        } else if (error.response.status === 422) {
          errorMessage = 'Daxil edilən məlumatlar düzgün deyil';
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        }
      } else if (error.request) {
        console.error('❌ Network error - no response:', error.request);
        errorMessage = 'Internet əlaqəsi problemi. Yenidən cəhd edin.';
      } else {
        console.error('❌ Error message:', error.message);
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, userData);
      const { access_token, user: newUser } = response.data;
      
      localStorage.setItem('accessToken', access_token);
      setToken(access_token);
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
      setToken(access_token);
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
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Facebook logout
    if (window.FB) {
      window.FB.logout();
    }
  };

  const value = {
    user,
    token,
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