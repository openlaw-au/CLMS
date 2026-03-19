import { booksMock } from '../mocks/books';
import { membersMock } from '../mocks/members';

// TODO(api): Replace with GET /api/books?title={title} — lookup book by title
export function lookupBookByTitle(title) {
  if (!title) return null;
  const lower = title.toLowerCase();
  return booksMock.find((b) => b.title.toLowerCase().includes(lower) || lower.includes(b.title.toLowerCase())) || null;
}

// TODO(api): Replace with GET /api/members/:id — resolve member ID to name
export function getBorrowerName(borrowerId) {
  if (!borrowerId) return null;
  const member = membersMock.find((m) => m.id === borrowerId);
  return member ? member.name : borrowerId;
}
