import { useEffect, useRef, useState } from 'react';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import IsbnLookupFlow from './IsbnLookupFlow';
import { useToast } from '../../context/ToastContext';
import { addBook } from '../../services/booksService';

const CLOSE_TRANSITION_MS = 220;
const DEFAULT_BOOK_FIELDS = {
  edition: '',
  publisher: '',
  location: 'Owen Dixon East',
  floor: '3',
  practiceArea: 'General',
  jurisdiction: 'Federal',
};

export default function IsbnIntakeModal({ mode, onClose, onImported }) {
  const { addToast } = useToast();
  const closeTimerRef = useRef(null);
  const [isbnBooks, setIsbnBooks] = useState([]);
  const [phase, setPhase] = useState(mode === 'scan' ? 'qr' : 'idle');
  const [submitting, setSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const openTimer = setTimeout(() => {
      setIsOpen(true);
    }, 10);

    return () => {
      clearTimeout(openTimer);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleAddIsbnBooks = (newBooks, replace = false) => {
    if (replace) {
      setIsbnBooks(newBooks);
      return;
    }

    setIsbnBooks((prev) => [...prev, ...newBooks]);
  };

  const handleRemoveIsbnBook = (index) => {
    setIsbnBooks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditIsbnBook = (index, updated) => {
    setIsbnBooks((prev) => prev.map((book, i) => (i === index ? { ...book, ...updated } : book)));
  };

  const closeModal = ({ force = false } = {}) => {
    if ((submitting && !force) || closeTimerRef.current) return;

    setIsOpen(false);
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      onClose?.();
    }, CLOSE_TRANSITION_MS);
  };

  const handleImport = async () => {
    if (isbnBooks.length === 0 || submitting) return;

    setSubmitting(true);

    try {
      for (const book of isbnBooks) {
        await addBook({
          ...DEFAULT_BOOK_FIELDS,
          ...book,
        });
      }
      addToast({ message: `Added ${isbnBooks.length} books to catalogue`, type: 'success' });
      await onImported?.();
      closeModal({ force: true });
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === 'scan' ? 'Scan ISBN' : 'Paste ISBNs';

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => closeModal()}
      />
      <div
        className={`fixed inset-4 z-50 flex flex-col overflow-hidden rounded-2xl bg-white shadow-xl transition-all duration-300 md:inset-8 lg:inset-16 ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="font-serif text-card-title text-text">{title}</h2>
          <button
            type="button"
            onClick={() => closeModal()}
            disabled={submitting}
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-slate-100 hover:text-text disabled:opacity-40"
            aria-label={`Close ${title.toLowerCase()} modal`}
          >
            <Icon name="solar:close-circle-linear" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <IsbnLookupFlow
            mode={mode}
            addedBooks={isbnBooks}
            onAddBooks={handleAddIsbnBooks}
            onRemoveBook={handleRemoveIsbnBook}
            onEditBook={handleEditIsbnBook}
            onPhaseChange={setPhase}
          />
        </div>

        {isbnBooks.length > 0 && (
          <div className="border-t border-border/60 bg-white px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-text-secondary">
                {isbnBooks.length} book{isbnBooks.length !== 1 ? 's' : ''} ready to add.
              </p>
              <Button
                size="sm"
                variant="primary"
                loading={submitting}
                disabled={phase === 'looking-up'}
                onClick={handleImport}
              >
                Add {isbnBooks.length} books to catalogue
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
