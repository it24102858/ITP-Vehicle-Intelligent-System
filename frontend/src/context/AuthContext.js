import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../utils/api';
import axios from 'axios';

const AuthContext = createContext(null);
const normalizeUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    role: String(user.role || '').trim().toLowerCase()
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored && token) {
      try {
        setUser(normalizeUser(JSON.parse(stored)));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const authPostWithPortFallback = async (path, payload) => {
    try {
      return await API.post(path, payload);
    } catch (err) {
      const currentBase = (API.defaults.baseURL || '').trim();
      const altBase = currentBase.includes(':5001')
        ? currentBase.replace(':5001', ':5000')
        : currentBase.includes(':5000')
          ? currentBase.replace(':5000', ':5001')
          : '';

      const isLikelyBaseUrlIssue =
        !err.response || err.response?.status === 404 || err.code === 'ERR_NETWORK';

      if (!altBase || !isLikelyBaseUrlIssue) throw err;

      const alt = axios.create({
        baseURL: altBase,
        headers: { 'Content-Type': 'application/json' }
      });
      return alt.post(path, payload);
    }
  };

  const login = async (email, password) => {
    const res = await authPostWithPortFallback('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    const normalizedUser = normalizeUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    return normalizedUser;
  };

  const register = async (formData) => {
    const res = await authPostWithPortFallback('/auth/register', formData);
    const { token, user: userData } = res.data;
    const normalizedUser = normalizeUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    return normalizedUser;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
