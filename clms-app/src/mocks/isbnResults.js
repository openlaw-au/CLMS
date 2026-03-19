// TODO(api): GET /api/books/isbn/:isbn — look up book metadata by ISBN from external service (e.g. Google Books API)

export const MOCK_ISBN_RESULTS = [
  { title: 'Principles of Administrative Law', author: 'M. Aronson', isbn: '978-0-455-24389-7' },
  { title: 'Evidence Law in Queensland', author: 'P. Hastie', isbn: '978-0-409-33215-6' },
  { title: 'Contract Law in Australia', author: 'N.C. Seddon', isbn: '978-1-760-02198-5' },
  { title: 'Australian Constitutional Law', author: 'G. Williams', isbn: '978-0-195-57662-8' },
  { title: 'Equity and Trusts', author: 'M.W. Bryan', isbn: '978-0-521-75297-4' },
  { title: 'Cross on Evidence', author: 'J.D. Heydon', isbn: '978-0-409-34395-3' },
  { title: 'The Law of Torts', author: 'C. Sappideen', isbn: '978-0-455-23374-1' },
  { title: 'Corporations Law', author: 'R.P. Austin', isbn: '978-0-409-34712-8' },
];

let mockIndex = 0;

export function getNextMockBook() {
  const book = MOCK_ISBN_RESULTS[mockIndex % MOCK_ISBN_RESULTS.length];
  mockIndex++;
  return book;
}

export function getMockBooksForPaste(count) {
  const books = [];
  for (let i = 0; i < count; i++) {
    books.push(MOCK_ISBN_RESULTS[i % MOCK_ISBN_RESULTS.length]);
  }
  return books;
}

export function resetMockIndex() {
  mockIndex = 0;
}
