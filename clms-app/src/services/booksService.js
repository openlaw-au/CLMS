import { booksMock } from '../mocks/books';

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

// TODO(api): Replace with GET /api/books — fetch full catalogue
export async function getBooks() {
  await delay();
  return [...booksMock];
}

// TODO(api): Replace with GET /api/books/:id — fetch single book
export async function getBookById(id) {
  await delay();
  return booksMock.find((b) => b.id === id) || null;
}

// TODO(api): Replace with GET /api/books?q={query} — search books by title/author/practiceArea
export async function searchBooks(query) {
  await delay(200);
  if (!query || query.trim().length < 2) return [];
  const lower = query.toLowerCase();
  return booksMock.filter(
    (b) =>
      b.title.toLowerCase().includes(lower) ||
      b.author.toLowerCase().includes(lower) ||
      b.practiceArea.toLowerCase().includes(lower),
  );
}

// TODO(api): Replace with POST /api/books — add new book to catalogue
export async function addBook(data) {
  await delay(300);
  const newBook = {
    id: `b${Date.now()}`,
    status: 'available',
    borrower: null,
    dueDate: null,
    enrichment: null,
    ...data,
  };
  booksMock.push(newBook);
  return newBook;
}

// TODO(api): Replace with PATCH /api/books/:id/enrichment — update RDA enrichment fields
export async function enrichBook(id, enrichment) {
  await delay(200);
  const book = booksMock.find((b) => b.id === id);
  if (book) {
    book.enrichment = { ...enrichment };
  }
  return book;
}

// TODO(api): Replace with DELETE /api/books/:id — remove book from catalogue
export async function deleteBook(id) {
  await delay(200);
  const idx = booksMock.findIndex((b) => b.id === id);
  if (idx !== -1) {
    booksMock.splice(idx, 1);
    return true;
  }
  return false;
}
