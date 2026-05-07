import { useState } from 'react';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import IsbnLookupFlow from './IsbnLookupFlow';
import { useToast } from '../../context/ToastContext';
import { addBook } from '../../services/booksService';

const CLOSE_TRANSITION_MS = 200;
const DEFAULT_BOOK_FIELDS = {
  edition: '',
  publisher: '',
  practiceArea: 'General',
  jurisdiction: 'Federal',
};

export default function IsbnIntakeModal({ mode, onClose, onImported }) {
  const { addToast } = useToast();
  const [isbnBooks, setIsbnBooks] = useState([]);
  const [phase, setPhase] = useState(mode === 'scan' ? 'qr' : 'idle');
  const [submitting, setSubmitting] = useState(false);
  const [closing, setClosing] = useState(false);

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
    if ((submitting && !force) || closing) return;

    setClosing(true);
    setTimeout(() => {
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
      addToast({ message: `Added ${isbnBooks.length} books to library`, type: 'success' });
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
        className={`fixed inset-0 z-40 bg-black/30 ${closing ? 'motion-fade-out' : 'motion-fade'}`}
        onClick={() => closeModal()}
      />
      <div
        className={`fixed inset-4 z-50 flex flex-col overflow-hidden rounded-2xl bg-white shadow-xl md:inset-8 lg:inset-16 ${closing ? 'animate-page-out' : 'animate-page-in'}`}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="font-serif text-card-title text-text">{title}</h2>
          <button
            type="button"
            onClick={() => closeModal()}
            disabled={submitting}
            className="rounded-full p-1.5 text-text-muted transition-colors duration-150 hover:bg-slate-100 hover:text-text disabled:opacity-40"
            aria-label={`Close ${title.toLowerCase()} modal`}
          >
            <Icon name="solar:close-linear" size={20} />
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
                Add {isbnBooks.length} books to library
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
