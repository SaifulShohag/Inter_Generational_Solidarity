import React, { createContext, useContext, useState } from 'react';
import type { UserRole, User } from '../types';
import { volunteerUser, elderlyUser } from '../data/mockData';
import type { ApiUser } from '../services/api';

const TOKEN_KEY   = 'vfa_token';
const ROLE_KEY    = 'vfa_role';
const APIUSER_KEY = 'vfa_api_user';
const SESSION_KEY = 'vfa_session_id';

function apiUserToFrontend(apiUser: ApiUser, role: UserRole): User {
  return {
    id: String(apiUser.id),
    role,
    name: apiUser.name,
    email: apiUser.email,
    phone: apiUser.phone ?? undefined,
    location: '',
    language: 'Français',
    interests: [],
    availability: [],
    joinedAt: apiUser.created_at.split('T')[0],
    profileCompletion: 60,
  };
}

interface AppContextType {
  role: UserRole | null;
  user: User | null;
  token: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  isDemo: boolean;
  login: (role: UserRole) => void;
  loginWithApi: (token: string, apiUser: ApiUser) => void;
  setSessionId: (id: string) => void;
  logout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  largeText: boolean;
  toggleLargeText: () => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [storedRole, setStoredRole] = useState<UserRole | null>(
    () => localStorage.getItem(ROLE_KEY) as UserRole | null,
  );
  const [apiUser, setApiUser] = useState<ApiUser | null>(() => {
    const s = localStorage.getItem(APIUSER_KEY);
    return s ? JSON.parse(s) : null;
  });
  const [sessionId, setSessionIdState] = useState<string | null>(
    () => localStorage.getItem(SESSION_KEY),
  );
  const [demoRole, setDemoRole] = useState<UserRole | null>(null);

  const [darkMode, setDarkMode]         = useState(false);
  const [largeText, setLargeText]       = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  const isAuthenticated = token !== null || demoRole !== null;
  const isDemo          = token === null && demoRole !== null;
  const role: UserRole | null = token ? storedRole : demoRole;

  const user: User | null = token && apiUser && storedRole
    ? apiUserToFrontend(apiUser, storedRole)
    : role === 'volunteer'
      ? volunteerUser
      : role === 'elderly'
        ? elderlyUser
        : null;

  const loginWithApi = (newToken: string, newApiUser: ApiUser) => {
    const frontendRole: UserRole = newApiUser.role === 'requester' ? 'elderly' : 'volunteer';
    localStorage.setItem(TOKEN_KEY,   newToken);
    localStorage.setItem(ROLE_KEY,    frontendRole);
    localStorage.setItem(APIUSER_KEY, JSON.stringify(newApiUser));
    setToken(newToken);
    setStoredRole(frontendRole);
    setApiUser(newApiUser);
    if (frontendRole === 'elderly') setLargeText(true);
  };

  const login = (selectedRole: UserRole) => {
    setDemoRole(selectedRole);
    if (selectedRole === 'elderly') setLargeText(true);
  };

  const setSessionId = (id: string) => {
    localStorage.setItem(SESSION_KEY, id);
    setSessionIdState(id);
  };

  const logout = () => {
    [TOKEN_KEY, ROLE_KEY, APIUSER_KEY, SESSION_KEY].forEach(k => localStorage.removeItem(k));
    setToken(null);
    setStoredRole(null);
    setApiUser(null);
    setSessionIdState(null);
    setDemoRole(null);
    setLargeText(false);
  };

  return (
    <AppContext.Provider value={{
      role, user, token, sessionId, isAuthenticated, isDemo,
      login, loginWithApi, setSessionId, logout,
      darkMode, toggleDarkMode: () => setDarkMode(d => !d),
      largeText, toggleLargeText: () => setLargeText(l => !l),
      highContrast, toggleHighContrast: () => setHighContrast(h => !h),
    }}>
      <div className={`${darkMode ? 'dark' : ''} ${largeText ? 'text-lg' : ''} ${highContrast ? 'contrast-125' : ''}`}>
        {children}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
