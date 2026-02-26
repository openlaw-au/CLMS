/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AppContext = createContext(null);

const ONBOARDING_KEY = 'clms-onboarding';
const ROLE_KEY = 'clms-role';

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
    readJson(ONBOARDING_KEY, {
      name: '',
      email: '',
      password: '',
      chambersName: '',
      chambersAddress: '',
      locations: [{ name: '', floor: '' }],
      invites: [{ email: '', role: 'barrister' }],
      mode: 'joined',
    }),
  );

  useEffect(() => {
    localStorage.setItem(ROLE_KEY, role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(onboarding));
  }, [onboarding]);

  const setRole = (nextRole) => {
    setRoleState(nextRole);
  };

  const updateOnboarding = (patch) => {
    setOnboarding((prev) => ({ ...prev, ...patch }));
  };

  const value = useMemo(
    () => ({
      role,
      setRole,
      onboarding,
      updateOnboarding,
    }),
    [onboarding, role],
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
