import { booksMock } from '../mocks/books';
import { loansMock } from '../mocks/loans';
import { recallRequestsMock, persistRecallRequests } from '../mocks/recallRequests';
import { sendReminder } from './loanReminderService';

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));
const ACTIVE_LOAN_STATUSES = new Set(['active', 'overdue']);
const RECALL_REQUEST_STATUS = {
  ALL: 'all',
  DISMISSED: 'dismissed',
  PENDING: 'pending',
  RECALLED: 'recalled',
};

function cloneRecallRequest(entry) {
  return {
    ...entry,
    dueDate: entry.dueDate || null,
    resolvedAt: entry.resolvedAt || null,
  };
}

function findMatchingLoan(bookId) {
  return loansMock.find((loan) => loan.bookId === bookId && ACTIVE_LOAN_STATUSES.has(loan.status));
}

/**
 * TODO(api): Replace with GET /api/recall-requests?status={status}
 */
export async function getRecallRequests(status = RECALL_REQUEST_STATUS.PENDING) {
  await delay();
  if (status === RECALL_REQUEST_STATUS.ALL) return recallRequestsMock.map(cloneRecallRequest);
  return recallRequestsMock.filter((entry) => entry.status === status).map(cloneRecallRequest);
}

/**
 * TODO(api): Replace with POST /api/recall-requests
 */
export async function createRecallRequest({ bookId, requesterName }) {
  await delay(200);
  const book = booksMock.find((item) => item.id === bookId);
  if (!book) return null;

  const matchingLoan = findMatchingLoan(bookId);
  const entry = {
    id: `rr${Date.now()}`,
    bookId,
    bookTitle: book.title,
    requesterName,
    currentBorrower: matchingLoan?.borrower || book.borrower || '',
    dueDate: matchingLoan?.dueDate || book.dueDate || null,
    status: RECALL_REQUEST_STATUS.PENDING,
    requestedAt: new Date().toISOString(),
    resolvedAt: null,
  };

  recallRequestsMock.unshift(entry);
  persistRecallRequests();
  return cloneRecallRequest(entry);
}

/**
 * TODO(api): Replace with PATCH /api/recall-requests/:id/recall
 */
export async function recallRequest(id) {
  await delay(200);
  const entry = recallRequestsMock.find((item) => item.id === id);
  if (!entry) return null;

  entry.status = RECALL_REQUEST_STATUS.RECALLED;
  entry.resolvedAt = new Date().toISOString();

  const matchingLoan = findMatchingLoan(entry.bookId);
  if (matchingLoan) {
    await sendReminder(matchingLoan.id);
  }

  persistRecallRequests();
  return cloneRecallRequest(entry);
}

/**
 * TODO(api): Replace with PATCH /api/recall-requests/:id/dismiss
 */
export async function dismissRecallRequest(id) {
  await delay(200);
  const entry = recallRequestsMock.find((item) => item.id === id);
  if (!entry) return null;

  entry.status = RECALL_REQUEST_STATUS.DISMISSED;
  entry.resolvedAt = new Date().toISOString();
  persistRecallRequests();
  return cloneRecallRequest(entry);
}
