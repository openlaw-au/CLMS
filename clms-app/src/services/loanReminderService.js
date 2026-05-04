import { loansMock } from '../mocks/loans';

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * TODO(api): Replace with POST /api/loans/:id/reminder
 */
export async function sendReminder(id) {
  await delay(200);
  const loan = loansMock.find((item) => item.id === id);
  if (loan) {
    loan.reminderSentAt = new Date().toISOString();
  }
  return loan;
}
