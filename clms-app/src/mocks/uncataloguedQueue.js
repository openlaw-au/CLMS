const STORAGE_KEY = 'clms-uncatalogued-queue';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* silent */ }
}

const stored = loadFromStorage();
export const uncataloguedQueueMock = stored || [];

export function persistUncataloguedQueue() {
  saveToStorage(uncataloguedQueueMock);
}
