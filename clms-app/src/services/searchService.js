import { booksMock } from '../mocks/books';
import { jadeResultsMock } from '../mocks/jadeResults';

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

// TODO(api): Replace with GET /api/search?q={query} — unified search across books + JADE
export async function searchAll(query) {
  await delay(250);
  if (!query || query.trim().length < 2) return { books: [], jade: [] };

  const lower = query.toLowerCase();

  const books = booksMock.filter(
    (b) =>
      b.title.toLowerCase().includes(lower) ||
      b.author.toLowerCase().includes(lower) ||
      b.practiceArea.toLowerCase().includes(lower),
  );

  const jade = jadeResultsMock.filter(
    (j) =>
      j.title.toLowerCase().includes(lower) ||
      j.citation.toLowerCase().includes(lower) ||
      j.tags.some((t) => t.toLowerCase().includes(lower)),
  );

  return { books, jade };
}
