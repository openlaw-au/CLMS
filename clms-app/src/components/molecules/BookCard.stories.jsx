import BookCard from './BookCard';

const baseBook = {
  id: 'b1',
  title: 'Cross on Evidence',
  author: 'J.D. Heydon',
  edition: '12th',
  publisher: 'LexisNexis Butterworths',
  location: 'Owen Dixon East',
  practiceArea: 'Evidence',
  status: 'available',
  dueDate: null,
};

export default {
  title: 'Molecules/BookCard',
  component: BookCard,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div style={{ width: 220 }}><Story /></div>],
  args: { book: baseBook },
};

export const Available = {
  args: { book: baseBook, onRequest: () => {} },
};

export const Borrowed = {
  args: { book: baseBook, alreadyBorrowed: true },
};

export const LoanRequested = {
  args: { book: baseBook, pendingLoan: true, onCancel: () => {} },
};

export const OnLoan = {
  args: {
    book: { ...baseBook, status: 'on-loan', dueDate: '2026-03-28' },
    onLoan: true,
    onRequestReturn: () => {},
    onCancelReturn: () => {},
  },
};

export const Overdue = {
  args: {
    book: { ...baseBook, status: 'on-loan', dueDate: '2026-02-20' },
    onLoan: true,
    overdue: true,
    onRequestReturn: () => {},
    onCancelReturn: () => {},
  },
};

export const ReturnRequested = {
  args: {
    book: { ...baseBook, status: 'on-loan', dueDate: '2026-03-28' },
    onLoan: true,
    returnRequested: true,
    onCancelReturn: () => {},
  },
};
