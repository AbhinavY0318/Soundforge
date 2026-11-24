import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { User, Account, Plan } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  account: Account | null;
  plan: Plan | null;
  loading: boolean;
  login: (tokens: { accessToken: string; refreshToken: string }, user: User, account: Account) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('soundforge_access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await api.get('/api/v1/auth/me');
      setUser(res.data.user);
      setAccount(res.data.account);
      setPlan(res.data.plan);
    } catch {
      localStorage.removeItem('soundforge_access_token');
      localStorage.removeItem('soundforge_refresh_token');
      setUser(null);
      setAccount(null);
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = (
    tokens: { accessToken: string; refreshToken: string },
    userData: User,
    accountData: Account
  ) => {
    localStorage.setItem('soundforge_access_token', tokens.accessToken);
    localStorage.setItem('soundforge_refresh_token', tokens.refreshToken);
    setUser(userData);
    setAccount(accountData);
    fetchProfile();
  };

  const logout = () => {
    localStorage.removeItem('soundforge_access_token');
    localStorage.removeItem('soundforge_refresh_token');
    setUser(null);
    setAccount(null);
    setPlan(null);
    window.location.href = '/auth/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        account,
        plan,
        loading,
        login,
        logout,
        refreshUser: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
