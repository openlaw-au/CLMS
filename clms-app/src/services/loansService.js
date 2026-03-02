import { loansMock } from '../mocks/loans';

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

// TODO(api): Replace with GET /api/loans?status={status}&borrower={borrower} — fetch loans with filters
export async function getLoans(filters = {}) {
  await delay();
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
export async function requestLoan(bookId) {
  await delay(300);
  const newLoan = {
    id: `l${Date.now()}`,
    bookId,
    bookTitle: '',
    borrower: '',
    borrowerRole: 'barrister',
    dateBorrowed: new Date().toISOString().slice(0, 10),
    dueDate: null,
    returnedDate: null,
    status: 'pending',
  };
  loansMock.push(newLoan);
  return newLoan;
}

// TODO(api): Replace with PATCH /api/loans/:id/return — mark loan as returned
export async function returnLoan(id) {
  await delay(200);
  const loan = loansMock.find((l) => l.id === id);
  if (loan) {
    loan.status = 'returned';
    loan.returnedDate = new Date().toISOString().slice(0, 10);
  }
  return loan;
}

// TODO(api): Replace with PATCH /api/loans/:id/approve — clerk approves a pending loan
export async function approveLoan(id) {
  await delay(200);
  const loan = loansMock.find((l) => l.id === id);
  if (loan) {
    loan.status = 'active';
    const due = new Date();
    due.setDate(due.getDate() + 14);
    loan.dueDate = due.toISOString().slice(0, 10);
  }
  return loan;
}
