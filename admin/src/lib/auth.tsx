/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, UserRole } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  login: (role: UserRole, schoolNumber: number, login: string, passwordString: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('yordamchi_auth_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (
    role: UserRole,
    schoolNumber: number,
    loginStr: string,
    passwordStr: string
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      if (role === 'super_admin') {
        const res = await fetch('/api/admin/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginStr, login: loginStr, password: passwordStr }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.token) {
            localStorage.setItem('yordamchi_admin_token', json.data.token);
            const superAdminUser: AuthUser = {
              id: json.data.user.id,
              role: 'super_admin',
              schoolNumber: 0,
              login: json.data.user.email || json.data.user.login,
              displayName: json.data.user.displayName || 'Super Admin',
            };
            setUser(superAdminUser);
            localStorage.setItem('yordamchi_auth_user', JSON.stringify(superAdminUser));
            setIsLoading(false);
            return true;
          }
        }
      }
    } catch (err) {
      console.warn('Backend login connection failed, checking fallback:', err);
    }

    // Fallback for offline development
    if (role === 'super_admin' && loginStr === 'admin@yordamchi.med' && passwordStr === 'superadmin123') {
      const superAdminUser: AuthUser = {
        id: 'superadmin-1',
        role: 'super_admin',
        schoolNumber: 0,
        login: 'admin@yordamchi.med',
        displayName: 'Super Admin',
      };
      setUser(superAdminUser);
      localStorage.setItem('yordamchi_auth_user', JSON.stringify(superAdminUser));
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('yordamchi_auth_user');
    localStorage.removeItem('yordamchi_admin_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
