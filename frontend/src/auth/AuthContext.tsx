import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setAccessToken, setActiveTenantHeader } from '../api/client';
import { authApi } from '../api';
import { User } from '../types/api';

export interface TenantScope {
  id: string;
  code: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  activeScope: TenantScope | null;
  setScope: (scope: TenantScope | null) => void;
  login: (email: string, password: string, tenantCode?: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeScope, setActiveScopeState] = useState<TenantScope | null>(null);

  const setScope = useCallback((scope: TenantScope | null) => {
    setActiveScopeState(scope);
    if (scope) {
      setActiveTenantHeader(scope.id);
      localStorage.setItem('hms.superadmin.scope', JSON.stringify(scope));
    } else {
      setActiveTenantHeader(null);
      localStorage.removeItem('hms.superadmin.scope');
    }
    // Refresh user profile if needed and dispatch event so React Query invalidates
    authApi.me().then((profile: any) => {
      if (profile?.data) setUser(profile.data);
    }).catch(() => {});
    window.dispatchEvent(new Event('tenant-scope-change'));
  }, []);

  // Sync auth state and scope on mount
  useEffect(() => {
    const initAuth = async () => {
      const stored = localStorage.getItem('hms.auth');
      const storedScope = localStorage.getItem('hms.superadmin.scope');
      if (storedScope) {
        try {
          const parsedScope = JSON.parse(storedScope);
          setActiveScopeState(parsedScope);
          setActiveTenantHeader(parsedScope.id);
        } catch (e) {
          localStorage.removeItem('hms.superadmin.scope');
          setActiveTenantHeader(null);
        }
      }

      if (stored) {
        try {
          const authData = JSON.parse(stored);
          setAccessToken(authData.accessToken);
          const userProfile = await authApi.me();
          setUser((userProfile as any).data);
        } catch (err) {
          // Token is likely invalid/expired
          localStorage.removeItem('hms.auth');
          setAccessToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen to global logout events from axios interceptor
    const handleLogout = () => {
      setUser(null);
      setActiveScopeState(null);
      setActiveTenantHeader(null);
      localStorage.removeItem('hms.superadmin.scope');
    };
    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  const login = async (email: string, password: string, tenantCode?: string) => {
    setLoading(true);
    try {
      const res = await authApi.login({ email, password, tenantCode: tenantCode || undefined });
      const authData = res.data;
      setAccessToken(authData.accessToken);
      localStorage.setItem('hms.auth', JSON.stringify({
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
      }));
      // Reset any old scope on new login
      setActiveScopeState(null);
      setActiveTenantHeader(null);
      localStorage.removeItem('hms.superadmin.scope');

      const profile = await authApi.me();
      setUser((profile as any).data);
    } catch (error) {
      setAccessToken(null);
      localStorage.removeItem('hms.auth');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authApi.logout().catch(() => {}); // Fire and forget
    setAccessToken(null);
    setActiveScopeState(null);
    setActiveTenantHeader(null);
    localStorage.removeItem('hms.superadmin.scope');
    localStorage.removeItem('hms.auth');
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // Super admins have all permissions
    if (user.role === 'SUPER_ADMIN') return true;
    
    // permissions are in user object or decoded token
    // We assume backend returns user profile with permissions list
    const userPermissions = (user as any).permissions || [];
    return userPermissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, loading, activeScope, setScope, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
