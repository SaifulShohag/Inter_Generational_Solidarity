import React, { createContext, useContext, useState } from 'react';
import type { UserRole, User } from '../types';
import { volunteerUser, elderlyUser } from '../data/mockData';

interface AppContextType {
  role: UserRole | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (role: UserRole) => void;
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
  const [role, setRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  const user = role === 'volunteer' ? volunteerUser : role === 'elderly' ? elderlyUser : null;

  const login = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setIsAuthenticated(true);
    if (selectedRole === 'elderly') setLargeText(true);
  };

  const logout = () => {
    setRole(null);
    setIsAuthenticated(false);
    setLargeText(false);
  };

  return (
    <AppContext.Provider value={{
      role, user, isAuthenticated, login, logout,
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
