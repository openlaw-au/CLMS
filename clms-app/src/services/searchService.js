import { booksMock } from '../mocks/books';
import { jadeResultsMock } from '../mocks/jadeResults';
import { authorityListsMock } from '../mocks/authorityLists';

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

// TODO(api): Replace with GET /api/search/suggest?q={query} — lightweight autocomplete endpoint
export async function getSuggestions(query) {
  await delay(80);
  if (!query || query.trim().length < 1) return [];

  const lower = query.toLowerCase();
  const suggestions = [];
  const seen = new Set();

  // My authority lists (highest priority)
  for (const l of authorityListsMock) {
    if (
      (l.name.toLowerCase().includes(lower) || (l.caseRef && l.caseRef.toLowerCase().includes(lower))) &&
      !seen.has(l.name)
    ) {
      seen.add(l.name);
      suggestions.push({
        id: l.id,
        type: 'list',
        title: l.name,
        subtitle: `${l.items.length} entries${l.caseRef ? ` · ${l.caseRef}` : ''}`,
        icon: 'solar:folder-open-linear',
      });
    }
  }

  // Direct book title matches
  for (const b of booksMock) {
    if (b.title.toLowerCase().includes(lower) && !seen.has(b.title)) {
      seen.add(b.title);
      suggestions.push({
        id: b.id,
        type: 'book',
        title: b.title,
        subtitle: `${b.author} · ${b.edition} Ed`,
        status: b.status,
        icon: 'solar:book-2-linear',
      });
    }
  }

  // Direct JADE matches — cases and legislation
  for (const j of jadeResultsMock) {
    if (
      (j.title.toLowerCase().includes(lower) || j.citation.toLowerCase().includes(lower)) &&
      !seen.has(j.title)
    ) {
      seen.add(j.title);
      suggestions.push({
        id: j.id,
        type: 'jade',
        title: j.title,
        subtitle: j.citation + (j.court ? ` · ${j.court}` : ''),
        jadeType: j.type,
        icon: j.type === 'legislation' ? 'solar:document-text-linear' : 'solar:scale-linear',
      });
    }
  }

  // Cap at 6 suggestions to keep the dropdown tight
  return suggestions.slice(0, 6);
}
