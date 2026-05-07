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

const DEFAULT_AVATAR = {
  bg: 'bg-slate-100',
  text: 'text-text-secondary',
  ring: 'ring-slate-200',
};

const MODAL_CLOSE_MS = 200;

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
      <div className="space-y-2">
        <Skeleton className="h-4 w-12 rounded" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      <div className="rounded-xl border border-border/70 bg-white p-3">
        <div className="space-y-2">
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      <div className="flex justify-end">
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
    </div>
  );
}

export default function NewLoanModal({ onClose, onCreated, prefillBook = null }) {
  const { chambersSettings } = useAppContext();
  const { addToast } = useToast();
  const defaultLoanDays = chambersSettings?.defaultLoanDays ?? 14;
  const [selectedBook, setSelectedBook] = useState(prefillBook);
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [dueDate, setDueDate] = useState(() => getDatePlusDays(defaultLoanDays));
  const [bookQuery, setBookQuery] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [closing, setClosing] = useState(false);

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

  useEffect(() => {
    if (!prefillBook) return;

    setSelectedBook(prefillBook);
    setBookQuery('');
  }, [prefillBook]);

  useEffect(() => {
    if (!prefillBook || books.length === 0) return;

    const matchedBook = books.find((book) => book.id === prefillBook.id);
    if (matchedBook) {
      setSelectedBook(matchedBook);
    }
  }, [books, prefillBook]);

  const filteredBooks = useMemo(() => {
    const query = bookQuery.trim().toLowerCase();

    if (!query) return [];

    return books
      .filter((book) => {
        if (book.status !== 'available') return false;

        return (
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query)
        );
      })
      .slice(0, 30);
  }, [books, bookQuery]);

  const filteredMembers = useMemo(() => {
    const query = memberQuery.trim().toLowerCase();

    if (!query) return members;

    return members.filter((member) => {
      const role = member.role ?? '';

      return (
        member.name.toLowerCase().includes(query) ||
        role.toLowerCase().includes(query)
      );
    });
  }, [members, memberQuery]);

  const requestClose = () => {
    if (closing) return;
    setSelectedBook(prefillBook ?? null);
    setSelectedBorrower(null);
    setDueDate(getDatePlusDays(defaultLoanDays));
    setBookQuery('');
    setMemberQuery('');
    setClosing(true);
    setTimeout(() => onClose(), MODAL_CLOSE_MS);
  };

  const handleSubmit = async () => {
    if (!selectedBook || !selectedBorrower || !dueDate || submitting) return;

    setSubmitting(true);

    try {
      await createActiveLoan(selectedBook.id, selectedBorrower.name, dueDate);
      addToast({ message: `Checked out to ${selectedBorrower.name}`, type: 'success' });
      await onCreated?.();
      requestClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 ${closing ? 'motion-fade-out' : 'motion-fade'}`}
        onClick={requestClose}
      />
      <div className={`fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-xl ${closing ? 'animate-page-out' : 'animate-page-in'}`}>
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-6 py-4">
          <h2 className="font-serif text-card-title text-text">New Loan</h2>
          <button
            type="button"
            onClick={requestClose}
            className="rounded-full p-1.5 text-text-muted transition-colors duration-150 hover:bg-slate-100 hover:text-text"
            aria-label="Close new loan modal"
          >
            <Icon name="solar:close-linear" size={20} />
          </button>
        </div>

        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-6 py-5">
          {loadingOptions ? (
            <LoadingState />
          ) : (
            <div className="motion-fade space-y-4">
              {!selectedBook && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">Book</label>
                  <Input
                    autoFocus
                    value={bookQuery}
                    onChange={(event) => setBookQuery(event.target.value)}
                    placeholder="Search by title or author"
                  />
                  {bookQuery.trim() && (
                    <div className="mt-1.5 max-h-40 overflow-y-auto rounded-lg border border-border/70 bg-white">
                      {filteredBooks.map((book) => (
                        <button
                          key={book.id}
                          type="button"
                          onClick={() => {
                            setSelectedBook(book);
                            setBookQuery('');
                          }}
                          className="flex w-full items-start gap-2 border-b border-border/30 px-3 py-2 text-left transition-colors last:border-0 hover:bg-slate-50"
                        >
                          <Icon name="solar:book-2-linear" size={14} className="mt-0.5 shrink-0 text-text-muted" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-text">{book.title}</p>
                            <p className="truncate text-xs text-text-muted">{book.author}</p>
                          </div>
                        </button>
                      ))}
                      {filteredBooks.length === 0 && (
                        <p className="px-3 py-3 text-center text-xs text-text-muted">No matches.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {selectedBook && (
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-200">
                    <Icon name="solar:book-2-linear" size={16} className="text-text-secondary" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-sm font-medium text-text">{selectedBook.title}</p>
                    <p className="truncate text-xs text-text-secondary">{selectedBook.author}</p>
                  </div>
                  {!prefillBook && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBook(null);
                        setBookQuery('');
                      }}
                      className="shrink-0 text-xs font-medium text-text-muted transition-colors hover:text-brand"
                    >
                      Change
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">Borrower</label>
                <Input
                  icon="solar:user-linear"
                  value={memberQuery}
                  onChange={(event) => setMemberQuery(event.target.value)}
                  placeholder="Search members"
                />
                <div className="mt-1.5 max-h-48 overflow-y-auto rounded-lg border border-border/70 bg-white">
                  {filteredMembers.map((member) => {
                    const avatar = member.avatarColor || DEFAULT_AVATAR;
                    const isSelected = selectedBorrower?.id === member.id;

                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => setSelectedBorrower(member)}
                        className={`flex w-full items-center gap-2 border-b border-border/30 px-3 py-1.5 text-left transition-colors last:border-0 ${
                          isSelected ? 'bg-brand/5' : 'hover:bg-slate-50'
                        }`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-2xs font-semibold ring-1 ${avatar.bg} ${avatar.text} ${avatar.ring}`}>
                          {member.initials}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-text">{member.name}</p>
                          <p className="truncate text-2xs text-text-muted">{formatRole(member.role)}</p>
                        </div>
                        {isSelected && (
                          <Icon name="solar:check-circle-bold" size={14} className="shrink-0 text-brand" />
                        )}
                      </button>
                    );
                  })}
                  {filteredMembers.length === 0 && (
                    <p className="px-3 py-3 text-center text-xs text-text-muted">
                      {members.length === 0 ? 'No members available.' : 'No members found.'}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">Due date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </div>

              <div className="flex justify-end pt-2">
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
          )}
        </div>
      </div>
    </>
  );
}
