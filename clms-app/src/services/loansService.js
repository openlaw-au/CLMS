import { loansMock } from '../mocks/loans';
import { booksMock } from '../mocks/books';
import { membersMock } from '../mocks/members';
import { isMockEmpty } from '../context/DevContext';
import { createRecallRequest } from './recallRequestsService';
import { sendReminder as sendLoanReminder } from './loanReminderService';

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

function formatDateValue(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLoanStatusForDueDate(dateStr) {
  if (!dateStr) return 'active';

  const due = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return due < today ? 'overdue' : 'active';
}

function setBookOnLoan(bookId, borrowerName, dueDate) {
  const book = booksMock.find((item) => item.id === bookId);
  if (book) {
    book.status = 'on-loan';
    book.borrower = borrowerName;
    book.dueDate = dueDate;
  }
  return book;
}

// TODO(api): Replace with GET /api/loans?status={status}&borrower={borrower} — fetch loans with filters
export async function getLoans(filters = {}) {
  await delay();
  if (isMockEmpty()) return [];
  let results = [...loansMock];

  if (filters.status) {
    results = results.filter((l) => l.status === filters.status);
  }
  if (filters.borrower) {
    results = results.filter((l) => l.borrower === filters.borrower);
  }

  return results;
}

// TODO(api): Replace with POST /api/loans — request a new loan
export async function requestLoan(bookId, borrowerName = 'James Chen') {
  await delay(300);
  const book = booksMock.find((b) => b.id === bookId);
  const newLoan = {
    id: `l${Date.now()}`,
    bookId,
    bookTitle: book ? book.title : '',
    borrower: borrowerName,
    borrowerRole: 'barrister',
    dateBorrowed: new Date().toISOString().slice(0, 10),
    dueDate: null,
    returnedDate: null,
    status: 'pending',
  };
  loansMock.push(newLoan);
  // Book stays 'available' until clerk approves the loan
  return newLoan;
}

// TODO(api): Replace with PATCH /api/loans/:id/return — mark loan as returned
export async function returnLoan(id) {
  await delay(200);
  const loan = loansMock.find((l) => l.id === id);
  if (loan) {
    loan.status = 'returned';
    loan.returnedDate = formatDateValue(new Date());

    const book = booksMock.find((b) => b.id === loan.bookId);
    if (book) {
      book.status = 'available';
      book.borrower = null;
      book.dueDate = null;
      book.extended = false;
    }
  }
  return loan;
}

// TODO(api): Replace with PATCH /api/loans/:id/approve — clerk approves a pending loan
export async function approveLoan(id, defaultLoanDays = 14) {
  await delay(200);
  const loan = loansMock.find((l) => l.id === id);
  if (loan) {
    loan.status = 'active';
    const due = new Date();
    due.setDate(due.getDate() + defaultLoanDays);
    loan.dueDate = formatDateValue(due);
    setBookOnLoan(loan.bookId, loan.borrower, loan.dueDate);
  }
  return loan;
}

// TODO(api): Replace with PATCH /api/loans/:id/deny — clerk denies a pending loan
export async function denyLoan(id, reason = '') {
  await delay(200);
  const loan = loansMock.find((l) => l.id === id);
  if (loan) {
    loan.status = 'denied';
    loan.denyReason = reason;
  }
  return loan;
}

// TODO(api): Replace with POST /api/loans/:id/reminder — send overdue reminder
export async function sendReminder(id) {
  return sendLoanReminder(id);
}

// TODO(api): Replace with PATCH /api/loans/:id/return — mark book as returned via scan
export async function returnBook(id) {
  await delay(200);
  const loan = loansMock.find((l) => l.id === id);
  if (loan) {
    loan.status = 'returned';
    loan.returnedDate = new Date().toISOString().slice(0, 10);
  }
  return loan;
}

// TODO(api): Replace with POST /api/loans/:id/request-return — barrister requests clerk to recall a book
export async function requestReturn(bookId, requesterName = 'James Chen') {
  return createRecallRequest({ bookId, requesterName });
}

// TODO(api): Replace with PATCH /api/loans/:id/renew — extend loan by 7 days
export async function renewLoan(id) {
  await delay(200);
  const loan = loansMock.find((l) => l.id === id);
  if (loan && loan.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDue = new Date(`${loan.dueDate}T00:00:00`);
    const base = currentDue > today ? currentDue : today;
    base.setDate(base.getDate() + 7);
    loan.dueDate = formatDateValue(base);
    loan.status = getLoanStatusForDueDate(loan.dueDate);
    loan.extended = true;

    const book = booksMock.find((item) => item.id === loan.bookId);
    if (book) {
      book.status = 'on-loan';
      book.borrower = loan.borrower;
      book.dueDate = loan.dueDate;
      book.extended = true;
    }
  }
  return loan;
}

// TODO(api): Replace with POST /api/loans/check-out, clerk creates an active loan directly
export async function createActiveLoan(bookId, borrowerName, dueDate) {
  await delay(300);
  const book = booksMock.find((item) => item.id === bookId);
  const member = membersMock.find((item) => item.name === borrowerName);
  const newLoan = {
    id: `l${Date.now()}`,
    bookId,
    bookTitle: book ? book.title : '',
    borrower: borrowerName,
    borrowerRole: member?.role || 'member',
    dateBorrowed: formatDateValue(new Date()),
    dueDate,
    extended: false,
    returnedDate: null,
    status: 'active',
  };

  loansMock.push(newLoan);
  setBookOnLoan(bookId, borrowerName, dueDate);

  return newLoan;
}
