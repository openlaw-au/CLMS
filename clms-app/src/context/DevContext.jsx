/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react';

const DevContext = createContext(null);

const DEV_KEY = 'clms-dev';

const readDev = () => {
  try {
    const raw = localStorage.getItem(DEV_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export function DevProvider({ children }) {
  const [state, setState] = useState(() => {
    const saved = readDev();
    return {
      mockEmpty: saved.mockEmpty ?? false,
    };
  });

  const setMockEmpty = (val) => {
    setState((prev) => {
      const next = { ...prev, mockEmpty: val };
      localStorage.setItem(DEV_KEY, JSON.stringify(next));
      return next;
    });
  };

  const value = useMemo(() => ({
    mockEmpty: state.mockEmpty,
    setMockEmpty,
  }), [state.mockEmpty]);

  return <DevContext.Provider value={value}>{children}</DevContext.Provider>;
}

export function useDevContext() {
  return useContext(DevContext);
}

/**
 * Check if mock data should be empty.
 * Works outside React components (services) by reading localStorage directly.
 */
export function isMockEmpty() {
  try {
    const raw = localStorage.getItem(DEV_KEY);
    if (!raw) return false;
    return JSON.parse(raw).mockEmpty === true;
  } catch {
    return false;
  }
}
