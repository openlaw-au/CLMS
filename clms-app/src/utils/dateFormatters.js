/**
 * Format a due date relative to today.
 * @param {string} dateStr — ISO date string (YYYY-MM-DD)
 * @returns {string} e.g. "12 days overdue (due 20 Feb)" or "Due in 3 days" or "Due today"
 */
export function formatDueDate(dateStr) {
  if (!dateStr) return 'No due date';

  const due = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = due - today;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedDate = `${due.getDate()} ${monthNames[due.getMonth()]}`;

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return `${overdueDays} ${overdueDays === 1 ? 'day' : 'days'} overdue (due ${formattedDate})`;
  }
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays} days (${formattedDate})`;
}

/**
 * Format a date as short "D Mon" string, e.g. "20 Feb".
 * @param {string} dateStr — ISO date string (YYYY-MM-DD)
 * @returns {string}
 */
export function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

/**
 * Get overdue severity level for styling.
 * @param {string} dateStr — ISO date string
 * @returns {'none'|'warning'|'danger'|'critical'}
 */
export function getOverdueSeverity(dateStr) {
  if (!dateStr) return 'none';

  const due = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today - due) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'none';
  if (diffDays <= 3) return 'warning';
  if (diffDays <= 7) return 'danger';
  return 'critical';
}
