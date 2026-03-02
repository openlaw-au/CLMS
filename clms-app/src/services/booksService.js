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
    ...data,
  };
  booksMock.push(newBook);
  return newBook;
}
