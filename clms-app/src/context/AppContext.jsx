/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AppContext = createContext(null);

const ONBOARDING_KEY = 'clms-onboarding';
const ROLE_KEY = 'clms-role';
const createInitialOnboarding = () => ({
  name: '',
  email: '',
  password: '',
  chambersName: '',
  chambersLogo: null,
  chambersAddress: '',
  locations: [{ name: '', floor: '' }],
  importedCount: 0,
  invites: [{ email: '', role: 'barrister' }],
  chambersFound: null,
  clerkInviteEmail: '',
  mode: 'joined',
  firstVisit: true,
  celebrationShown: false,
});

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export function AppProvider({ children }) {
  const [role, setRoleState] = useState(() => localStorage.getItem(ROLE_KEY) || 'barrister');
  const [onboarding, setOnboarding] = useState(() =>
    readJson(ONBOARDING_KEY, createInitialOnboarding()),
  );

  useEffect(() => {
    localStorage.setItem(ROLE_KEY, role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(onboarding));
  }, [onboarding]);

  const setRole = useCallback((nextRole) => {
    localStorage.setItem(ROLE_KEY, nextRole);
    setRoleState(nextRole);
  }, []);

  const updateOnboarding = useCallback((patch) => {
    setOnboarding((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(ONBOARDING_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearFirstVisit = useCallback(() => {
    setOnboarding((prev) => {
      const next = { ...prev, firstVisit: false };
      localStorage.setItem(ONBOARDING_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const markCelebrationShown = useCallback(() => {
    setOnboarding((prev) => {
      const next = { ...prev, celebrationShown: true };
      localStorage.setItem(ONBOARDING_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetSession = useCallback((nextRole = role) => {
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.setItem(ROLE_KEY, nextRole);
    setRoleState(nextRole);
    setOnboarding(createInitialOnboarding());
  }, [role]);

  const value = useMemo(
    () => ({
      role,
      setRole,
      onboarding,
      updateOnboarding,
      clearFirstVisit,
      markCelebrationShown,
      resetSession,
    }),
    [clearFirstVisit, markCelebrationShown, onboarding, resetSession, role, setRole, updateOnboarding],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used inside AppProvider');
  }

  return context;
}
