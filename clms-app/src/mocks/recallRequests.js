import { loansMock } from './loans';
import { booksMock } from './books';

const STORAGE_KEY = 'clms.recallRequests';
const ACTIVE_LOAN_STATUSES = new Set(['active', 'overdue']);

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch { /* ignore */ }
  return null;
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* silent */ }
}

function buildSeedRecallRequest(id, bookId, requesterName, requestedAt) {
  const book = booksMock.find((item) => item.id === bookId);
  const loan = loansMock.find((item) => item.bookId === bookId && ACTIVE_LOAN_STATUSES.has(item.status));
  if (!book || !loan) return null;

  return {
    id,
    bookId,
    bookTitle: book.title,
    requesterName,
    currentBorrower: loan.borrower,
    dueDate: loan.dueDate,
    status: 'pending',
    requestedAt,
    resolvedAt: null,
  };
}

const stored = loadFromStorage();
const seededRecallRequests = [
  buildSeedRecallRequest('rr-seed-1', 'b2', 'James Chen', '2026-04-29T02:15:00.000Z'),
  buildSeedRecallRequest('rr-seed-2', 'b9', 'Nina Patel', '2026-04-30T05:45:00.000Z'),
].filter(Boolean);

export const recallRequestsMock = stored ?? seededRecallRequests;

if (stored === null) {
  saveToStorage(recallRequestsMock);
}

export function persistRecallRequests() {
  saveToStorage(recallRequestsMock);
}
