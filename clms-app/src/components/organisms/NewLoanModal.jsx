import { useEffect, useMemo, useState } from 'react';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Skeleton from '../atoms/Skeleton';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { getBooks } from '../../services/booksService';
import { getMembers } from '../../services/membersService';
import { createActiveLoan } from '../../services/loansService';

const STEP_COPY = {
  book: {
    number: 1,
    title: 'Select Book',
    description: 'Search available books by title or author.',
  },
  borrower: {
    number: 2,
    title: 'Select Borrower',
    description: 'Choose the member who is checking out this book.',
  },
  confirm: {
    number: 3,
    title: 'Confirm Loan',
    description: 'Review the details and set the due date.',
  },
};

const DEFAULT_AVATAR = {
  bg: 'bg-slate-100',
  text: 'text-text-secondary',
  ring: 'ring-slate-200',
};

function formatDateValue(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDatePlusDays(days) {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + days);
  return formatDateValue(nextDate);
}

function formatRole(role = 'member') {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function LoadingState() {
  return (
    <div className="motion-fade space-y-4">
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="space-y-3 rounded-2xl border border-border/70 bg-slate-50/60 p-3">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-black/5">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="mt-2 h-3 w-48 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryRow({ label, title, detail }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text">{title}</p>
      <p className="mt-1 text-xs text-text-secondary">{detail}</p>
    </div>
  );
}

export default function NewLoanModal({ onClose, onCreated }) {
  const { chambersSettings } = useAppContext();
  const { addToast } = useToast();
  const defaultLoanDays = chambersSettings?.defaultLoanDays ?? 14;
  const [step, setStep] = useState('book');
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [dueDate, setDueDate] = useState(() => getDatePlusDays(defaultLoanDays));
  const [bookQuery, setBookQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      setLoadingOptions(true);
      const [nextBooks, nextMembers] = await Promise.all([getBooks(), getMembers()]);

      if (cancelled) return;

      setBooks(nextBooks);
      setMembers(nextMembers);
      setLoadingOptions(false);
    };

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  const stepMeta = STEP_COPY[step];
  const stepKey = loadingOptions ? 'loading' : step;
  const filteredBooks = useMemo(() => {
    const query = bookQuery.trim().toLowerCase();

    return books.filter((book) => {
      if (book.status !== 'available') return false;
      if (!query) return true;

      return (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      );
    });
  }, [books, bookQuery]);

  const handleBack = () => {
    if (step === 'borrower') {
      setStep('book');
      return;
    }

    if (step === 'confirm') {
      setStep('borrower');
    }
  };

  const handleBookSelect = (book) => {
    setSelectedBook(book);
    setStep('borrower');
  };

  const handleBorrowerSelect = (borrower) => {
    setSelectedBorrower(borrower);
    setStep('confirm');
  };

  const handleSubmit = async () => {
    if (!selectedBook || !selectedBorrower || !dueDate || submitting) return;

    setSubmitting(true);

    try {
      await createActiveLoan(selectedBook.id, selectedBorrower.name, dueDate);
      addToast({ message: `Checked out to ${selectedBorrower.name}`, type: 'success' });
      await onCreated?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    if (loadingOptions) {
      return <LoadingState />;
    }

    if (step === 'book') {
      return (
        <div className="motion-fade space-y-4">
          <Input
            autoFocus
            value={bookQuery}
            onChange={(event) => setBookQuery(event.target.value)}
            placeholder="Search by title or author"
          />

          <div className="max-h-80 space-y-2 overflow-y-auto rounded-2xl border border-border/70 bg-slate-50/60 p-2">
            {filteredBooks.map((book) => (
              <button
                key={book.id}
                type="button"
                onClick={() => handleBookSelect(book)}
                className="flex w-full items-start justify-between gap-3 rounded-xl bg-white px-4 py-3 text-left transition-all duration-300 hover:bg-brand/5 hover:shadow-sm ring-1 ring-black/5"
              >
                <div>
                  <p className="text-sm font-semibold text-text">{book.title}</p>
                  <p className="mt-1 text-xs text-text-secondary">{book.author}</p>
                  <p className="mt-1 text-xs text-text-muted">{book.location}</p>
                </div>
                <Icon name="solar:alt-arrow-right-linear" size={18} className="mt-0.5 shrink-0 text-text-muted" />
              </button>
            ))}

            {filteredBooks.length === 0 && (
              <div className="rounded-xl bg-white px-4 py-8 text-center ring-1 ring-black/5">
                <p className="text-sm text-text-secondary">No available books match that search.</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (step === 'borrower') {
      return (
        <div className="motion-fade space-y-4">
          {selectedBook && (
            <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-brand">Selected book</p>
              <p className="mt-2 text-sm font-semibold text-text">{selectedBook.title}</p>
              <p className="mt-1 text-xs text-text-secondary">{selectedBook.author} · {selectedBook.location}</p>
            </div>
          )}

          <div className="max-h-80 space-y-2 overflow-y-auto rounded-2xl border border-border/70 bg-slate-50/60 p-2">
            {members.map((member) => {
              const avatarColor = member.avatarColor || DEFAULT_AVATAR;

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleBorrowerSelect(member)}
                  className="flex w-full items-center gap-3 rounded-xl bg-white px-4 py-3 text-left transition-all duration-300 hover:bg-brand/5 hover:shadow-sm ring-1 ring-black/5"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1 ${avatarColor.bg} ${avatarColor.text} ${avatarColor.ring}`}>
                    {member.initials}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text">{member.name}</p>
                    <p className="mt-1 text-xs text-text-secondary">{formatRole(member.role)}</p>
                  </div>
                  <Icon name="solar:alt-arrow-right-linear" size={18} className="shrink-0 text-text-muted" />
                </button>
              );
            })}

            {members.length === 0 && (
              <div className="rounded-xl bg-white px-4 py-8 text-center ring-1 ring-black/5">
                <p className="text-sm text-text-secondary">No members are available to borrow books.</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="motion-fade space-y-4">
        <SummaryRow
          label="Book"
          title={selectedBook?.title || 'No book selected'}
          detail={selectedBook ? `${selectedBook.author} · ${selectedBook.location}` : 'Choose a book to continue.'}
        />

        <SummaryRow
          label="Borrower"
          title={selectedBorrower?.name || 'No borrower selected'}
          detail={selectedBorrower ? formatRole(selectedBorrower.role) : 'Choose a borrower to continue.'}
        />

        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">Due date</label>
          <Input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button size="sm" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            variant="primary"
            loading={submitting}
            disabled={!selectedBook || !selectedBorrower || !dueDate}
            onClick={handleSubmit}
          >
            Check Out
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="border-b border-border/70 px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="w-24">
              {step !== 'book' && (
                <Button size="sm" variant="ghost" className="px-3" onClick={handleBack}>
                  <Icon name="solar:alt-arrow-left-linear" size={16} />
                  Back
                </Button>
              )}
            </div>

            <div className="flex-1 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted">
                Step {stepMeta.number} of 3
              </p>
              <h2 className="mt-1 font-serif text-card-title text-text">{stepMeta.title}</h2>
              <p className="mt-1 text-sm text-text-secondary">{stepMeta.description}</p>
            </div>

            <div className="flex w-24 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-slate-100 hover:text-text"
                aria-label="Close new loan modal"
              >
                <Icon name="solar:close-circle-linear" size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-6 py-5">
          <div key={stepKey}>
            {renderStep()}
          </div>
        </div>
      </div>
    </>
  );
}
